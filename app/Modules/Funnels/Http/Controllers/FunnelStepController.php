<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\Funnel;
use App\Modules\Funnels\Models\FunnelPage;
use App\Modules\Funnels\Models\FunnelStep;
use App\Modules\Funnels\Services\FunnelCapacity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FunnelStepController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    private function authoriseFunnel(Request $request, Funnel $funnel): void
    {
        abort_unless((int) $funnel->workspace_id === $this->workspaceId($request), 403);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(Request $request, Funnel $funnel)
    {
        $this->authoriseFunnel($request, $funnel);

        // ── Plan step limit gate ───────────────────────────────────────────
        abort_unless(
            app(FunnelCapacity::class)->canAddStep($funnel->id, $this->workspaceId($request)),
            403,
            'You have reached the maximum number of steps allowed on your plan.'
        );

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:128'],
            'slug' => ['nullable', 'string', 'max:128'],
            'type' => ['required', 'in:optin,optin_thank_you,sales,checkout,order_bump,upsell,downsell,thank_you,thankyou,booking,contact_us,webinar_registration,webinar_broadcast,webinar_thank_you,info_page,content,legal_terms,legal_privacy'],
        ]);

        // Pipeline Rule 1: Max 1 checkout step per funnel
        if ($validated['type'] === 'checkout' && FunnelStep::where('funnel_id', $funnel->id)->where('type', 'checkout')->exists()) {
            return back()->withErrors([
                'type' => 'This funnel already contains an Order Form / Checkout step. Only 1 checkout step is allowed per funnel flow.',
            ]);
        }

        // Pipeline Rule 2: Max 1 order confirmation / thank you step per funnel
        if (in_array($validated['type'], ['thank_you', 'thankyou']) && FunnelStep::where('funnel_id', $funnel->id)->whereIn('type', ['thank_you', 'thankyou'])->exists()) {
            return back()->withErrors([
                'type' => 'This funnel already contains an Order Confirmation / Thank You step.',
            ]);
        }

        // Place new step at the end of the funnel
        $maxOrder = FunnelStep::where('funnel_id', $funnel->id)->max('sort_order') ?? -1;
        $slug = ! empty($validated['slug'])
            ? \Illuminate\Support\Str::slug($validated['slug'])
            : \Illuminate\Support\Str::slug($validated['name']);

        $step = FunnelStep::create([
            'funnel_id'  => $funnel->id,
            'name'       => $validated['name'],
            'slug'       => $slug ?: 'step-' . ($maxOrder + 2),
            'type'       => $validated['type'],
            'sort_order' => $maxOrder + 1,
        ]);

        // Create default FunnelPage control variant
        FunnelPage::create([
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
                                'fontSize'  => 36,
                                'textColor' => '#111827',
                            ]
                        ]
                    ]
                ]
            ],
        ]);

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Step created successfully.');
        }

        return response()->json(['ok' => true, 'step' => $step]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, Funnel $funnel, FunnelStep $step)
    {
        $this->authoriseFunnel($request, $funnel);
        abort_unless((int) $step->funnel_id === $funnel->id, 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:128'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:128'],
            'type' => ['sometimes', 'in:optin,optin_thank_you,sales,checkout,order_bump,upsell,downsell,thank_you,thankyou,booking,contact_us,webinar_registration,webinar_broadcast,webinar_thank_you,info_page,content,legal_terms,legal_privacy'],
        ]);

        if (isset($validated['type']) && $validated['type'] === 'checkout' && $step->type !== 'checkout') {
            $hasCheckout = $funnel->steps()->where('type', 'checkout')->where('id', '!=', $step->id)->exists();
            if ($hasCheckout) {
                if ($request->header('X-Inertia')) {
                    return back()->withErrors(['type' => 'This funnel already has an Order Form / Checkout step. Only 1 checkout step is permitted per funnel pipeline.']);
                }
                return response()->json([
                    'ok' => false,
                    'message' => 'This funnel already has an Order Form / Checkout step. Only 1 checkout step is permitted per funnel pipeline.'
                ], 422);
            }
        }

        if (isset($validated['type']) && in_array($validated['type'], ['thank_you', 'thankyou'], true) && !in_array($step->type, ['thank_you', 'thankyou'], true)) {
            $hasThankYou = $funnel->steps()->whereIn('type', ['thank_you', 'thankyou'])->where('id', '!=', $step->id)->exists();
            if ($hasThankYou) {
                if ($request->header('X-Inertia')) {
                    return back()->withErrors(['type' => 'This funnel already has a Thank You / Confirmation step. Only 1 final confirmation step is permitted per funnel pipeline.']);
                }
                return response()->json([
                    'ok' => false,
                    'message' => 'This funnel already has a Thank You / Confirmation step. Only 1 final confirmation step is permitted per funnel pipeline.'
                ], 422);
            }
        }

        if (isset($validated['slug'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['slug']);
        }

        $step->update($validated);

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Step updated successfully.');
        }

        return response()->json(['ok' => true, 'step' => $step->fresh()]);
    }

    // ─── Reorder (Drag-and-Drop) ──────────────────────────────────────────────

    /**
     * Accepts an ordered array of step IDs and reassigns sort_order values.
     * Called when user drags steps in the funnel builder sidebar.
     */
    public function reorder(Request $request, Funnel $funnel)
    {
        $this->authoriseFunnel($request, $funnel);

        $validated = $request->validate([
            'order'   => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        \DB::transaction(function () use ($funnel, $validated) {
            foreach ($validated['order'] as $position => $stepId) {
                FunnelStep::where('id', $stepId)
                    ->where('funnel_id', $funnel->id) // Scoped — can only reorder own steps
                    ->update(['sort_order' => $position]);
            }
        });

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Steps reordered successfully.');
        }

        return response()->json(['ok' => true]);
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(Request $request, Funnel $funnel, FunnelStep $step)
    {
        $this->authoriseFunnel($request, $funnel);
        abort_unless((int) $step->funnel_id === $funnel->id, 403);

        $step->delete(); // cascades to funnel_pages → funnel_popups, funnel_page_revisions

        if ($request->header('X-Inertia')) {
            return back()->with('success', 'Step deleted successfully.');
        }

        return response()->json(['ok' => true]);
    }
}
