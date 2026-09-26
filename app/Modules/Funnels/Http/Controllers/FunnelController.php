<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Funnels\Models\Funnel;
use App\Modules\Funnels\Models\FunnelFolder;
use App\Modules\Funnels\Models\FunnelStep;
use App\Modules\Funnels\Models\FunnelStepProduct;
use App\Modules\Funnels\Models\FunnelSubmission;
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
        $folderId = $request->query('folder_id');
        $searchQuery = $request->query('search', '');

        // 1. Folders List for Current Workspace
        $folders = FunnelFolder::where('workspace_id', $wid)
            ->withCount('funnels')
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        // 2. Active Folder Object (if inside a folder)
        $activeFolder = null;
        if (! empty($folderId)) {
            $activeFolder = FunnelFolder::where('workspace_id', $wid)
                ->where('id', $folderId)
                ->first();
        }

        // 3. Funnels Query
        $funnelsQuery = Funnel::forWorkspace($wid)
            ->with('folder')
            ->withCount('steps');

        if (! empty($folderId)) {
            $funnelsQuery->where('folder_id', $folderId);
        } elseif (empty($searchQuery)) {
            $funnelsQuery->whereNull('folder_id');
        }

        if (! empty($searchQuery)) {
            $funnelsQuery->where(function ($q) use ($searchQuery) {
                $q->where('name', 'like', "%{$searchQuery}%")
                    ->orWhere('slug', 'like', "%{$searchQuery}%");
            });
        }

        $funnels = $funnelsQuery->latest()
            ->get()
            ->map(fn ($f) => [
                'id'                 => $f->id,
                'uuid'               => $f->uuid,
                'folder_id'          => $f->folder_id,
                'folder'             => $f->folder ? [
                    'id'    => $f->folder->id,
                    'name'  => $f->folder->name,
                    'color' => $f->folder->color,
                ] : null,
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

        // Count of all funnels without folder (root level)
        $rootFunnelsCount = Funnel::forWorkspace($wid)->whereNull('folder_id')->count();

        // Pass plan usage summary so the UI can show upgrade prompts
        $usage = app(FunnelCapacity::class)->usageSummary($wid);

        return Inertia::render('Funnels/Index', [
            'funnels'          => $funnels,
            'folders'          => $folders,
            'activeFolder'     => $activeFolder,
            'rootFunnelsCount' => $rootFunnelsCount,
            'filters'          => [
                'folder_id' => $folderId,
                'search'    => $searchQuery,
            ],
            'usage'            => $usage,
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
            'name'      => ['required', 'string', 'max:128'],
            'folder_id' => ['nullable', 'exists:funnel_folders,id'],
        ]);

        // Generate a slug from the name, ensure uniqueness in this workspace
        $slug = $this->uniqueSlug($wid, Str::slug($validated['name']));

        $funnel = \DB::transaction(function () use ($wid, $validated, $slug) {
            $funnel = Funnel::create([
                'workspace_id' => $wid,
                'folder_id'    => $validated['folder_id'] ?? null,
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
            ->route('client.funnels.show', $funnel->uuid)
            ->with('success', 'Funnel created.');
    }

    // ─── Funnel Step Management Hub ───────────────────────────────────────────

    public function show(Request $request, Funnel $funnel): Response
    {
        $this->authorise($request, $funnel);
        $wid = $this->workspaceId($request);

        $funnel->load([
            'folder',
            'steps' => fn ($q) => $q->orderBy('sort_order'),
            'steps.pages',
            'steps.products.product.prices',
            'steps.products.price',
        ]);

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
                                'id'       => 'sec_' . uniqid('', true),
                                'type'     => 'section',
                                'title'    => 'Main Section',
                                'elements' => [
                                    [
                                        'id'        => 'el_' . uniqid('', true),
                                        'type'      => 'headline',
                                        'content'   => $step->name,
                                        'fontSize'  => 32,
                                        'textColor' => '#111827',
                                    ]
                                ]
                            ]
                        ]
                    ],
                ]);
                $step->load('pages');
            }
        }

        $availableProducts = EcommerceProduct::where('workspace_id', $wid)
            ->with('prices')
            ->orderBy('name')
            ->get();

        $dateRange = $request->input('date_range', 'all');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $submissionQuery = FunnelSubmission::where('funnel_id', $funnel->id);

        if ($startDate && $endDate) {
            $submissionQuery->whereBetween('created_at', [
                \Illuminate\Support\Carbon::parse($startDate)->startOfDay(),
                \Illuminate\Support\Carbon::parse($endDate)->endOfDay(),
            ]);
            $dateRange = 'custom';
        } elseif ($startDate) {
            $submissionQuery->where('created_at', '>=', \Illuminate\Support\Carbon::parse($startDate)->startOfDay());
            $dateRange = 'custom';
        } elseif ($endDate) {
            $submissionQuery->where('created_at', '<=', \Illuminate\Support\Carbon::parse($endDate)->endOfDay());
            $dateRange = 'custom';
        } elseif ($dateRange === 'today') {
            $submissionQuery->whereDate('created_at', now()->toDateString());
        } elseif ($dateRange === '7d') {
            $submissionQuery->where('created_at', '>=', now()->subDays(7));
        } elseif ($dateRange === '30d') {
            $submissionQuery->where('created_at', '>=', now()->subDays(30));
        } elseif ($dateRange === 'month') {
            $submissionQuery->where('created_at', '>=', now()->startOfMonth());
        }

        $stepStats = (clone $submissionQuery)
            ->selectRaw("
                funnel_step_id,
                COUNT(*) as submissions_count,
                COUNT(CASE WHEN status = 'lead' OR status IS NULL OR status = '' THEN 1 END) as optins_count,
                COUNT(CASE WHEN status IN ('customer', 'paid', 'completed') THEN 1 END) as sales_count,
                COALESCE(SUM(CASE WHEN status IN ('customer', 'paid', 'completed') THEN order_amount ELSE 0 END), 0) as sales_revenue
            ")
            ->groupBy('funnel_step_id')
            ->get()
            ->keyBy('funnel_step_id');

        $leads = (clone $submissionQuery)
            ->with('step:id,name,type')
            ->latest()
            ->limit(50)
            ->get();

        $sales = (clone $submissionQuery)
            ->whereIn('status', ['customer', 'paid', 'completed'])
            ->with('step:id,name,type')
            ->latest()
            ->limit(50)
            ->get();

        $automations = \App\Modules\Automation\Models\Automation::where('workspace_id', $wid)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'uuid', 'name', 'trigger_type', 'trigger_config', 'nodes']);

        return Inertia::render('Funnels/Show', [
            'funnel'            => $funnel,
            'availableProducts' => $availableProducts,
            'automations'       => $automations,
            'leads'             => $leads,
            'sales'             => $sales,
            'stepStats'         => $stepStats,
            'dateRange'         => $dateRange,
            'startDate'         => $startDate,
            'endDate'           => $endDate,
        ]);
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

    // ─── Folders Management ───────────────────────────────────────────────────

    /** Create a new Funnel Folder */
    public function storeFolder(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:128'],
            'color' => ['nullable', 'string', 'max:32'],
        ]);

        FunnelFolder::create([
            'workspace_id' => $wid,
            'name'         => $validated['name'],
            'color'        => $validated['color'] ?? '#16a34a',
            'sort_order'   => FunnelFolder::where('workspace_id', $wid)->count() + 1,
        ]);

        return back()->with('success', "Folder '{$validated['name']}' created.");
    }

    /** Update an existing Funnel Folder */
    public function updateFolder(Request $request, $id): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        $folder = FunnelFolder::where('workspace_id', $wid)->findOrFail($id);

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:128'],
            'color' => ['nullable', 'string', 'max:32'],
        ]);

        $folder->update($validated);

        return back()->with('success', 'Folder updated successfully.');
    }

    /** Destroy a Funnel Folder */
    public function destroyFolder(Request $request, $id): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        $folder = FunnelFolder::where('workspace_id', $wid)->findOrFail($id);

        // Move funnels inside this folder to root
        Funnel::where('folder_id', $folder->id)->update(['folder_id' => null]);

        $folder->delete();

        return redirect()->route('client.funnels.index')
            ->with('success', "Folder '{$folder->name}' deleted.");
    }

    /** Move funnels to a folder or root */
    public function moveToFolder(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'funnel_ids'   => ['required', 'array'],
            'funnel_ids.*' => ['required'],
            'folder_id'    => ['nullable', 'exists:funnel_folders,id'],
        ]);

        Funnel::where('workspace_id', $wid)
            ->where(function ($q) use ($validated) {
                $q->whereIn('id', $validated['funnel_ids'])
                    ->orWhereIn('uuid', $validated['funnel_ids']);
            })
            ->update(['folder_id' => $validated['folder_id']]);

        return back()->with('success', 'Funnels moved successfully.');
    }

    /** Duplicate a funnel with all its steps */
    public function duplicate(Request $request, Funnel $funnel): RedirectResponse
    {
        $this->authorise($request, $funnel);
        $wid = $this->workspaceId($request);

        abort_unless(
            app(FunnelCapacity::class)->canCreateFunnel($wid),
            403,
            'You have reached your plan\'s funnel limit. Upgrade to create more funnels.'
        );

        \DB::transaction(function () use ($funnel, $wid) {
            $cloned = $funnel->replicate([
                'uuid',
                'slug',
                'share_token',
                'views_count',
                'conversions_count',
                'total_revenue',
                'created_at',
                'updated_at',
            ]);
            $cloned->name = $funnel->name.' (Copy)';
            $cloned->slug = $this->uniqueSlug($wid, Str::slug($cloned->name));
            $cloned->uuid = (string) Str::uuid();
            $cloned->share_token = Str::random(32);
            $cloned->status = 'draft';
            $cloned->save();

            // Clone steps and pages
            foreach ($funnel->steps()->with('pages')->get() as $step) {
                $newStep = $step->replicate(['funnel_id', 'created_at', 'updated_at']);
                $newStep->funnel_id = $cloned->id;
                $newStep->save();

                foreach ($step->pages as $page) {
                    $newPage = $page->replicate(['step_id', 'created_at', 'updated_at']);
                    $newPage->step_id = $newStep->id;
                    $newPage->save();
                }
            }
        });

        return back()->with('success', 'Funnel duplicated successfully.');
    }

    // ─── Step Products Management ─────────────────────────────────────────────

    public function storeProduct(Request $request, Funnel $funnel, FunnelStep $step): RedirectResponse
    {
        $this->authorise($request, $funnel);
        $wid = $this->workspaceId($request);
        abort_unless($step->funnel_id === $funnel->id, 404);

        // 1. Strict step type enforcement (products allowed only on checkout, upsell, downsell)
        if (! in_array($step->type, ['checkout', 'upsell', 'downsell', 'order_bump'])) {
            return back()->withErrors([
                'product' => "Products can only be attached to Checkout, Upsell, or Downsell steps. Step '{$step->name}' is a '{$step->type}' step.",
            ]);
        }

        // 2. Cardinality limit for Upsell / Downsell (strictly 1 product per 1-click OTO step)
        if (in_array($step->type, ['upsell', 'downsell'])) {
            $existingCount = FunnelStepProduct::where('funnel_step_id', $step->id)->count();
            if ($existingCount >= 1) {
                return back()->withErrors([
                    'product' => "Upsell and Downsell steps can only have one 1-Click offer. Please remove the existing product to replace it.",
                ]);
            }
        }

        $validated = $request->validate([
            'product_id'       => ['nullable', 'exists:ecommerce_products,id'],
            'product_price_id' => ['nullable', 'exists:ecommerce_product_prices,id'],
            'name'             => ['nullable', 'string', 'max:255'],
            'type'             => ['required', 'in:main,bump,upsell,downsell'],
            'offer_type'       => ['nullable', 'in:digital,physical'],
            'price'            => ['nullable', 'numeric', 'min:0'],
            'bump_headline'    => ['nullable', 'string', 'max:255'],
            'bump_description' => ['nullable', 'string'],
        ]);

        // 3. Checkout step limits (Max 1 main product)
        if ($step->type === 'checkout') {
            if ($validated['type'] === 'main') {
                $hasMain = FunnelStepProduct::where('funnel_step_id', $step->id)->where('type', 'main')->exists();
                if ($hasMain) {
                    return back()->withErrors([
                        'product' => 'A main product is already attached to this checkout step. You can add an Order Bump or remove the existing main product.',
                    ]);
                }
            } elseif ($validated['type'] === 'bump') {
                $bumpCount = FunnelStepProduct::where('funnel_step_id', $step->id)->where('type', 'bump')->count();
                if ($bumpCount >= 2) {
                    return back()->withErrors([
                        'product' => 'A checkout step can have a maximum of 2 order bumps.',
                    ]);
                }
            }
        }

        // 4. Duplicate catalog product prevention on same step
        if (! empty($validated['product_id'])) {
            $alreadyAttached = FunnelStepProduct::where('funnel_step_id', $step->id)
                ->where('product_id', $validated['product_id'])
                ->exists();
            if ($alreadyAttached) {
                return back()->withErrors([
                    'product' => 'This product is already attached to this step. The same product cannot be selected as both main and bump, or added twice.',
                ]);
            }
        }

        if (! empty($validated['product_id'])) {
            $catalogProduct = EcommerceProduct::where('workspace_id', $wid)->with('prices')->find($validated['product_id']);
            if ($catalogProduct) {
                $validated['name'] = $validated['name'] ?: $catalogProduct->name;
                if (! empty($validated['product_price_id']) && $catalogProduct->prices) {
                    $tier = $catalogProduct->prices->firstWhere('id', (int) $validated['product_price_id']);
                    if ($tier && $tier->price !== null) {
                        $validated['price'] = $validated['price'] ?? $tier->price;
                    }
                }
                $validated['price'] = $validated['price'] ?? $catalogProduct->price;
                $validated['offer_type'] = $catalogProduct->product_type ?: ($validated['offer_type'] ?? 'digital');
            }
        }

        // Fallbacks
        $validated['name'] = $validated['name'] ?: 'Product Offer';
        $validated['price'] = $validated['price'] ?? 0.00;
        $validated['offer_type'] = $validated['offer_type'] ?? 'digital';

        FunnelStepProduct::create([
            'workspace_id'     => $wid,
            'funnel_step_id'   => $step->id,
            'name'             => $validated['name'],
            'type'             => $validated['type'],
            'offer_type'       => $validated['offer_type'],
            'price'            => $validated['price'],
            'product_id'       => $validated['product_id'] ?? null,
            'product_price_id' => $validated['product_price_id'] ?? null,
            'bump_headline'    => $validated['bump_headline'] ?? null,
            'bump_description' => $validated['bump_description'] ?? null,
            'is_active'        => true,
            'sort_order'       => (FunnelStepProduct::where('funnel_step_id', $step->id)->max('sort_order') ?? 0) + 1,
        ]);

        return back()->with('success', 'Product attached successfully.');
    }

    public function updateProduct(Request $request, Funnel $funnel, FunnelStep $step, FunnelStepProduct $product): RedirectResponse
    {
        $this->authorise($request, $funnel);
        abort_unless($step->funnel_id === $funnel->id && $product->funnel_step_id === $step->id, 404);

        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'type'             => ['required', 'in:main,bump,upsell,downsell'],
            'offer_type'       => ['required', 'in:digital,physical'],
            'price'            => ['required', 'numeric', 'min:0'],
            'product_id'       => ['nullable', 'exists:ecommerce_products,id'],
            'product_price_id' => ['nullable', 'exists:ecommerce_product_prices,id'],
            'bump_headline'    => ['nullable', 'string', 'max:255'],
            'bump_description' => ['nullable', 'string'],
            'is_active'        => ['nullable', 'boolean'],
        ]);

        $product->update($validated);

        return back()->with('success', 'Product updated successfully.');
    }

    public function destroyProduct(Request $request, Funnel $funnel, FunnelStep $step, FunnelStepProduct $product): RedirectResponse
    {
        $this->authorise($request, $funnel);
        abort_unless($step->funnel_id === $funnel->id && $product->funnel_step_id === $step->id, 404);

        $product->delete();

        return back()->with('success', 'Product removed from step.');
    }

    // ─── Funnel Settings ──────────────────────────────────────────────────────

    public function updateSettings(Request $request, Funnel $funnel): RedirectResponse
    {
        $this->authorise($request, $funnel);

        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:128'],
            'slug'             => ['required', 'string', 'max:128', Rule::unique('funnels', 'slug')->where('workspace_id', $this->workspaceId($request))->ignore($funnel->id)],
            'theme_color'      => ['nullable', 'string', 'max:32'],
            'meta_title'       => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'no_index'         => ['nullable', 'boolean'],
        ]);

        $funnel->update($validated);

        return back()->with('success', 'Funnel settings updated.');
    }
}
