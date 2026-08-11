<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\Funnel;
use App\Modules\Funnels\Models\FunnelPage;
use App\Modules\Funnels\Models\FunnelPageRevision;
use App\Modules\Funnels\Models\FunnelStep;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FunnelPageController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    private function authoriseFunnel(Request $request, Funnel $funnel): void
    {
        abort_unless((int) $funnel->workspace_id === $this->workspaceId($request), 403);
    }

    // ─── Save Canvas ──────────────────────────────────────────────────────────

    /**
     * Auto-save the builder canvas JSON for a page.
     * Invalidates the HTML cache so the next public render re-compiles.
     */
    public function save(Request $request, Funnel $funnel, FunnelPage $page): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);
        $this->authorisePage($funnel, $page);

        $validated = $request->validate([
            'canvas_json'      => ['required', 'array'],
            'html_cache'       => ['nullable', 'string'],
            'meta_title'       => ['nullable', 'string', 'max:191'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'og_image_url'     => ['nullable', 'string', 'max:500'],
            'no_index'         => ['sometimes', 'boolean'],
            'schema_json'      => ['nullable', 'array'],
        ]);

        $page->update(array_merge($validated, [
            'cache_compiled_at' => now(),
        ]));

        return response()->json(['ok' => true, 'page' => $page]);
    }

    // ─── Publish (Compile + Snapshot) ────────────────────────────────────────

    /**
     * Compiles the canvas JSON into HTML/CSS cache and saves a revision snapshot.
     */
    public function publish(Request $request, Funnel $funnel, FunnelPage $page): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);
        $this->authorisePage($funnel, $page);

        // Save a revision snapshot BEFORE overwriting the cache
        FunnelPageRevision::create([
            'funnel_page_id' => $page->id,
            'published_by'   => $request->user()->id,
            'canvas_json'    => $page->canvas_json ?? [],
            'html_snapshot'  => $page->html_cache,
            'label'          => 'Published '.now()->format('d M Y H:i'),
        ]);

        // Compile canvas → raw HTML + inline CSS
        [$html, $css] = $this->compile($page->canvas_json ?? []);

        $page->update([
            'html_cache'        => $html,
            'css_cache'         => $css,
            'cache_compiled_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    // ─── Revision History & Rollback ─────────────────────────────────────────

    public function revisions(Request $request, Funnel $funnel, FunnelPage $page): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);
        $this->authorisePage($funnel, $page);

        $revisions = FunnelPageRevision::where('funnel_page_id', $page->id)
            ->latest()
            ->limit(30)
            ->get(['id', 'label', 'published_by', 'created_at']);

        return response()->json(['revisions' => $revisions]);
    }

    /**
     * 1-Click rollback: restore a previous canvas snapshot back to the page.
     */
    public function rollback(Request $request, Funnel $funnel, FunnelPage $page, FunnelPageRevision $revision): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);
        $this->authorisePage($funnel, $page);
        abort_unless((int) $revision->funnel_page_id === $page->id, 403);

        $page->update([
            'canvas_json'       => $revision->canvas_json,
            'html_cache'        => $revision->html_snapshot,
            'cache_compiled_at' => now(),
        ]);

        return response()->json(['ok' => true, 'canvas_json' => $revision->canvas_json]);
    }

    // ─── A/B Variant Management ───────────────────────────────────────────────

    /**
     * Create the Variant B challenger page for A/B split testing.
     */
    public function createVariant(Request $request, Funnel $funnel, FunnelStep $step): JsonResponse
    {
        $this->authoriseFunnel($request, $funnel);
        abort_unless((int) $step->funnel_id === $funnel->id, 403);

        $controlPage = $step->controlPage;
        abort_unless($controlPage, 422);

        // Only allow one B variant per step
        $alreadyExists = FunnelPage::where('funnel_step_id', $step->id)
            ->where('variant', 'B')
            ->exists();

        if ($alreadyExists) {
            return response()->json(['ok' => false, 'message' => 'Variant B already exists.'], 422);
        }

        $variantB = FunnelPage::create([
            'funnel_step_id' => $step->id,
            'variant'        => 'B',
            'is_control'     => false,
            'traffic_split'  => 50,
            'canvas_json'    => $controlPage->canvas_json, // Start as a copy of A
        ]);

        // Set variant A traffic split to 50% as well
        $controlPage->update(['traffic_split' => 50]);

        return response()->json(['ok' => true, 'variant_b' => $variantB]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function authorisePage(Funnel $funnel, FunnelPage $page): void
    {
        // Page → Step → Funnel chain validation
        $step = FunnelStep::find($page->funnel_step_id);
        abort_unless($step && (int) $step->funnel_id === $funnel->id, 403);
    }

    /**
     * Stub compiler: in production, this parses canvas_json blocks into
     * semantic HTML5 (following W3C rules) and scoped inline CSS.
     * The full block-renderer will be built in the builder canvas phase.
     */
    private function compile(array $canvasJson): array
    {
        // Placeholder — full block renderer implemented in Builder phase
        $html = '<div class="funnel-page"><!-- canvas compiled --></div>';
        $css  = '';

        return [$html, $css];
    }
}
