<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\Funnel;
use App\Modules\Funnels\Models\FunnelStep;
use App\Modules\Funnels\Services\FunnelCapacity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FunnelController extends Controller
{
    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    private function authorise(Request $request, Funnel $funnel): void
    {
        abort_unless((int) $funnel->workspace_id === $this->workspaceId($request), 403);
    }

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $wid = $this->workspaceId($request);

        $funnels = Funnel::forWorkspace($wid)
            ->withCount('steps')
            ->latest()
            ->get()
            ->map(fn ($f) => [
                'id'                 => $f->id,
                'uuid'               => $f->uuid,
                'name'               => $f->name,
                'slug'               => $f->slug,
                'status'             => $f->status,
                'steps_count'        => $f->steps_count,
                'views_count'        => $f->views_count,
                'conversions_count'  => $f->conversions_count,
                'conversion_rate'    => $f->conversion_rate,
                'total_revenue'      => $f->total_revenue,
                'updated_at'         => $f->updated_at,
            ]);

        // Pass plan usage summary so the UI can show upgrade prompts
        $usage = app(FunnelCapacity::class)->usageSummary($wid);

        return Inertia::render('Funnels/Index', [
            'funnels' => $funnels,
            'usage'   => $usage,
        ]);
    }

    // ─── Create / Store ───────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        // ── Plan limit gate ────────────────────────────────────────────────
        abort_unless(
            app(FunnelCapacity::class)->canCreateFunnel($wid),
            403,
            'You have reached your plan\'s funnel limit. Upgrade to create more funnels.'
        );

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:128'],
        ]);

        // Generate a slug from the name, ensure uniqueness in this workspace
        $slug = $this->uniqueSlug($wid, Str::slug($validated['name']));

        $funnel = \DB::transaction(function () use ($wid, $validated, $slug) {
            $funnel = Funnel::create([
                'workspace_id' => $wid,
                'name'         => $validated['name'],
                'slug'         => $slug,
                'status'       => 'draft',
            ]);

            // Create a default first Opt-In step
            $step = FunnelStep::create([
                'funnel_id'  => $funnel->id,
                'name'       => 'Opt-In Page',
                'type'       => 'optin',
                'sort_order' => 0,
            ]);

            // Create default FunnelPage control variant
            \App\Modules\Funnels\Models\FunnelPage::create([
                'funnel_step_id' => $step->id,
                'variant'        => 'A',
                'is_control'     => true,
                'traffic_split'  => 100,
                'canvas_json'    => [
                    'sections' => [
                        [
                            // Bug 14 Fix: use uniqid() (microsecond precision) instead of time()
                            // to prevent section and element from sharing the same ID.
                            'id'       => 'sec_' . uniqid('', true),
                            'type'     => 'section',
                            'title'    => 'Hero Section',
                            'elements' => [
                                [
                                    'id'        => 'el_' . uniqid('', true),
                                    'type'      => 'headline',
                                    'content'   => 'Welcome to ' . $validated['name'],
                                    'fontSize'  => 36,
                                    'textColor' => '#111827',
                                ]
                            ]
                        ]
                    ]
                ],
            ]);

            return $funnel;
        });

        return redirect()
            ->route('client.funnels.edit', $funnel->uuid)
            ->with('success', 'Funnel created.');
    }

    // ─── Edit / Builder ───────────────────────────────────────────────────────

    public function edit(Request $request, Funnel $funnel): Response
    {
        $this->authorise($request, $funnel);

        $funnel->load(['steps.pages']);

        // Auto-fix: Ensure every step has at least one control page
        foreach ($funnel->steps as $step) {
            if ($step->pages->isEmpty()) {
                \App\Modules\Funnels\Models\FunnelPage::create([
                    'funnel_step_id' => $step->id,
                    'variant'        => 'A',
                    'is_control'     => true,
                    'traffic_split'  => 100,
                    'canvas_json'    => [
                        'sections' => [
                            [
                                // Bug 15 Fix: same uniqid() fix for the auto-fix path.
                                'id'       => 'sec_' . uniqid('', true),
                                'type'     => 'section',
                                'title'    => 'Main Section',
                                'elements' => [
                                    [
                                        'id'        => 'el_' . uniqid('', true),
                                        'type'      => 'headline',
                                        'content'   => 'Welcome to ' . $funnel->name,
                                        'fontSize'  => 32,
                                        'textColor' => '#111827',
                                    ]
                                ]
                            ]
                        ]
                    ],
                ]);
            }
        }

        $funnel->load([
            'steps.pages.popups',
            'steps.pages.latestRevision',
        ]);

        return Inertia::render('Funnels/Builder', [
            'funnel' => $funnel,
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, Funnel $funnel): RedirectResponse
    {
        $this->authorise($request, $funnel);
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'name'             => ['sometimes', 'string', 'max:128'],
            'slug'             => ['sometimes', 'string', 'max:128', 'regex:/^[a-z0-9\-]+$/',
                Rule::unique('funnels')->where('workspace_id', $wid)->ignore($funnel->id),
            ],
            'theme_color'      => ['sometimes', 'string', 'max:32'],
            'meta_title'       => ['nullable', 'string', 'max:191'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'og_image_url'     => ['nullable', 'url', 'max:500'],
            'no_index'         => ['sometimes', 'boolean'],
        ]);

        $funnel->update($validated);

        return back()->with('success', 'Funnel settings saved.');
    }

    // ─── Publish / Unpublish ──────────────────────────────────────────────────

    public function createVariantStep(Request $request, Funnel $funnel, FunnelStep $step): JsonResponse
    {
        abort_unless(
            app(FunnelCapacity::class)->abTestingEnabled($this->workspaceId($request)),
            403,
            'A/B testing is not available on your current plan. Please upgrade.'
        );

        return $this->createVariantInternal($request, $funnel, $step);
    }

    private function createVariantInternal(Request $request, Funnel $funnel, FunnelStep $step): JsonResponse
    {
        $this->authorise($request, $funnel);

        $warnings = $this->runPreFlight($funnel);

        if (! empty($warnings['errors'])) {
            return response()->json([
                'ok'       => false,
                'warnings' => $warnings,
            ], 422);
        }

        $funnel->update([
            'status'              => 'published',
            'is_ready'            => true,
            'validation_warnings' => $warnings,
        ]);

        return response()->json(['ok' => true]);
    }

    public function publish(Request $request, Funnel $funnel): JsonResponse
    {
        $this->authorise($request, $funnel);

        $funnel->update([
            'status'              => 'published',
            'is_ready'            => true,
        ]);

        return response()->json(['ok' => true]);
    }

    public function unpublish(Request $request, Funnel $funnel): JsonResponse
    {
        $this->authorise($request, $funnel);
        $funnel->update(['status' => 'draft', 'is_ready' => false]);

        return response()->json(['ok' => true]);
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    public function destroy(Request $request, Funnel $funnel): RedirectResponse
    {
        $this->authorise($request, $funnel);
        $funnel->delete();

        return redirect()
            ->route('client.funnels.index')
            ->with('success', 'Funnel deleted.');
    }

    // ─── Slug Check API ───────────────────────────────────────────────────────

    /**
     * POST /client/funnels/check-slug
     * Real-time debounced slug uniqueness check for the builder UI.
     */
    public function checkSlug(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'slug'       => ['required', 'string', 'max:128', 'regex:/^[a-z0-9\-]+$/'],
            'funnel_id'  => ['nullable', 'integer'],
        ]);

        $query = Funnel::forWorkspace($wid)->where('slug', $validated['slug']);

        // Exclude current funnel when editing (so it doesn't conflict with itself)
        if (! empty($validated['funnel_id'])) {
            $query->where('id', '!=', $validated['funnel_id']);
        }

        $taken = $query->exists();

        return response()->json([
            'available' => ! $taken,
            'slug'      => $validated['slug'],
            'url'       => config('app.url').'/f/'.urlencode($request->user()->workspace->slug ?? 'workspace').'/'.$validated['slug'],
        ]);
    }

    // ─── Pre-Flight Validation ────────────────────────────────────────────────

    /**
     * Validates funnel dependencies before publishing.
     * Returns categorised warnings and hard errors.
     */
    private function runPreFlight(Funnel $funnel): array
    {
        $errors   = [];
        $warnings = [];

        $funnel->load('steps.pages');

        foreach ($funnel->steps as $step) {
            // ⚠️ Payment gateway check: checkout/upsell/downsell steps need a gateway
            if ($step->requiresPaymentGateway()) {
                $hasGateway = \DB::table('payment_gateway_configs')
                    ->where('workspace_id', $funnel->workspace_id)
                    ->where('is_active', true)
                    ->exists();

                if (! $hasGateway) {
                    $errors[] = [
                        'type'    => 'missing_payment_gateway',
                        'step_id' => $step->id,
                        'step'    => $step->name,
                        'message' => "Step \"{$step->name}\" requires a connected payment gateway.",
                    ];
                }
            }

            // ⚠️ Empty page check: every step must have at least one page with canvas content
            if ($step->pages->isEmpty() || $step->pages->every(fn ($p) => empty($p->canvas_json))) {
                $warnings[] = [
                    'type'    => 'empty_page',
                    'step_id' => $step->id,
                    'step'    => $step->name,
                    'message' => "Step \"{$step->name}\" has no page content yet.",
                ];
            }
        }

        return compact('errors', 'warnings');
    }

    // ─── Utilities ────────────────────────────────────────────────────────────

    private function uniqueSlug(int $workspaceId, string $base): string
    {
        $slug      = $base;
        $suffix    = 2;

        while (Funnel::where('workspace_id', $workspaceId)->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
