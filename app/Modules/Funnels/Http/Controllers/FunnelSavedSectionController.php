<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\FunnelSavedSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FunnelSavedSectionController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    // ─── Index ────────────────────────────────────────────────────────────────

    /**
     * Lists all saved sections for this workspace (own + global master sections).
     */
    public function index(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);

        $sections = FunnelSavedSection::forWorkspace($wid)
            ->orderByDesc('is_global')
            ->orderByDesc('usage_count')
            ->get(['id', 'name', 'thumbnail_url', 'is_global', 'usage_count', 'created_at']);

        return response()->json(['sections' => $sections]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:128'],
            'canvas_json'   => ['required', 'array'],
            'thumbnail_url' => ['nullable', 'url', 'max:500'],
            'is_global'     => ['sometimes', 'boolean'],
        ]);

        $section = FunnelSavedSection::create(array_merge($validated, [
            'workspace_id' => $wid,
        ]));

        return response()->json(['ok' => true, 'section' => $section]);
    }

    // ─── Show (fetch canvas for insert) ──────────────────────────────────────

    public function show(Request $request, FunnelSavedSection $section): JsonResponse
    {
        abort_unless((int) $section->workspace_id === $this->workspaceId($request), 403);

        // Increment usage count when a section is fetched for insertion
        $section->increment('usage_count');

        return response()->json(['section' => $section]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    /**
     * Updating a Global Master Section will propagate to all funnel pages using it.
     * For now, the updated canvas_json is saved here; the builder syncs on next load.
     */
    public function update(Request $request, FunnelSavedSection $section): JsonResponse
    {
        abort_unless((int) $section->workspace_id === $this->workspaceId($request), 403);

        $validated = $request->validate([
            'name'          => ['sometimes', 'string', 'max:128'],
            'canvas_json'   => ['sometimes', 'array'],
            'thumbnail_url' => ['nullable', 'url', 'max:500'],
            'is_global'     => ['sometimes', 'boolean'],
        ]);

        $section->update($validated);

        return response()->json(['ok' => true, 'section' => $section->fresh()]);
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(Request $request, FunnelSavedSection $section): JsonResponse
    {
        abort_unless((int) $section->workspace_id === $this->workspaceId($request), 403);

        $section->delete();

        return response()->json(['ok' => true]);
    }
}
