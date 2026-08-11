<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\Funnel;
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

    public function store(Request $request, Funnel $funnel): JsonResponse
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
            'type' => ['required', 'in:optin,optin_thank_you,sales,checkout,order_bump,upsell,downsell,thank_you,legal_terms,legal_privacy'],
        ]);

        // Place new step at the end of the funnel
        $maxOrder = FunnelStep::where('funnel_id', $funnel->id)->max('sort_order') ?? -1;

        $step = FunnelStep::create([
            'funnel_id'  => $funnel->id,
            'name'       => $validated['name'],
            'type'       => $validated['type'],
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json(['ok' => true, 'step' => $step]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, Funnel $funnel, FunnelStep $step): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);
        abort_unless((int) $step->funnel_id === $funnel->id, 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:128'],
            'type' => ['sometimes', 'in:optin,optin_thank_you,sales,checkout,order_bump,upsell,downsell,thank_you,legal_terms,legal_privacy'],
        ]);

        $step->update($validated);

        return response()->json(['ok' => true, 'step' => $step->fresh()]);
    }

    // ─── Reorder (Drag-and-Drop) ──────────────────────────────────────────────

    /**
     * Accepts an ordered array of step IDs and reassigns sort_order values.
     * Called when user drags steps in the funnel builder sidebar.
     */
    public function reorder(Request $request, Funnel $funnel): JsonResponse
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

        return response()->json(['ok' => true]);
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(Request $request, Funnel $funnel, FunnelStep $step): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);
        abort_unless((int) $step->funnel_id === $funnel->id, 403);

        $step->delete(); // cascades to funnel_pages → funnel_popups, funnel_page_revisions

        return response()->json(['ok' => true]);
    }
}
