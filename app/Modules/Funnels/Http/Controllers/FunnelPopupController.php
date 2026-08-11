<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\Funnel;
use App\Modules\Funnels\Models\FunnelPage;
use App\Modules\Funnels\Models\FunnelPopup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FunnelPopupController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    private function authoriseFunnel(Request $request, Funnel $funnel): void
    {
        abort_unless((int) $funnel->workspace_id === $this->workspaceId($request), 403);
    }

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request, Funnel $funnel, FunnelPage $page): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);

        $popups = FunnelPopup::where('funnel_page_id', $page->id)->get();

        return response()->json(['popups' => $popups]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(Request $request, Funnel $funnel, FunnelPage $page): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);

        $validated = $request->validate([
            'name'               => ['required', 'string', 'max:128'],
            'trigger_type'       => ['required', 'in:exit_intent,time_delay,scroll_depth,on_click'],
            'trigger_value'      => ['nullable', 'integer', 'min:0', 'max:9999'],
            'trigger_selector'   => ['nullable', 'string', 'max:255'],
            'canvas_json'        => ['nullable', 'array'],
            'frequency'          => ['sometimes', 'in:always,once_per_session,once_per_week'],
            'has_countdown'      => ['sometimes', 'boolean'],
            'countdown_seconds'  => ['nullable', 'integer', 'min:60', 'max:86400'],
            'is_active'          => ['sometimes', 'boolean'],
        ]);

        $popup = FunnelPopup::create(array_merge($validated, [
            'funnel_page_id' => $page->id,
        ]));

        return response()->json(['ok' => true, 'popup' => $popup]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, Funnel $funnel, FunnelPage $page, FunnelPopup $popup): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);
        abort_unless((int) $popup->funnel_page_id === $page->id, 403);

        $validated = $request->validate([
            'name'               => ['sometimes', 'string', 'max:128'],
            'trigger_type'       => ['sometimes', 'in:exit_intent,time_delay,scroll_depth,on_click'],
            'trigger_value'      => ['nullable', 'integer', 'min:0', 'max:9999'],
            'trigger_selector'   => ['nullable', 'string', 'max:255'],
            'canvas_json'        => ['nullable', 'array'],
            'frequency'          => ['sometimes', 'in:always,once_per_session,once_per_week'],
            'has_countdown'      => ['sometimes', 'boolean'],
            'countdown_seconds'  => ['nullable', 'integer', 'min:60', 'max:86400'],
            'is_active'          => ['sometimes', 'boolean'],
        ]);

        $popup->update($validated);

        return response()->json(['ok' => true, 'popup' => $popup->fresh()]);
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(Request $request, Funnel $funnel, FunnelPage $page, FunnelPopup $popup): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);
        abort_unless((int) $popup->funnel_page_id === $page->id, 403);

        $popup->delete();

        return response()->json(['ok' => true]);
    }
}
