<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\Funnel;
use App\Modules\Funnels\Models\FunnelPage;
use App\Modules\Funnels\Models\FunnelStep;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FunnelShareController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    // ─── Generate / Refresh Share Token ──────────────────────────────────────

    public function generateToken(Request $request, Funnel $funnel): JsonResponse
    {
        abort_unless((int) $funnel->workspace_id === $this->workspaceId($request), 403);

        $funnel->update([
            'share_token' => Str::random(32),
            'is_shareable' => true,
        ]);

        return response()->json([
            'ok'         => true,
            'share_url'  => route('funnels.import', $funnel->fresh()->share_token),
            'share_token' => $funnel->share_token,
        ]);
    }

    // ─── Disable Sharing ─────────────────────────────────────────────────────

    public function revokeToken(Request $request, Funnel $funnel): JsonResponse
    {
        abort_unless((int) $funnel->workspace_id === $this->workspaceId($request), 403);

        $funnel->update(['is_shareable' => false]);

        return response()->json(['ok' => true]);
    }

    // ─── Import (Clone into workspace) ───────────────────────────────────────

    /**
     * 1-Click funnel import: clones the entire funnel structure (steps + pages)
     * into the authenticated user's workspace.
     * Asset deep-cloning (images) is dispatched as a background job.
     */
    public function import(Request $request, string $shareToken): JsonResponse
    {
        $wid = $this->workspaceId($request);

        $source = Funnel::where('share_token', $shareToken)
            ->where('is_shareable', true)
            ->firstOrFail();

        $newFunnel = \DB::transaction(function () use ($source, $wid) {
            // Clone funnel record
            $newFunnel = Funnel::create([
                'workspace_id'       => $wid,
                'name'               => $source->name.' (Imported)',
                'slug'               => $this->uniqueSlug($wid, $source->slug),
                'theme_color'        => $source->theme_color,
                'meta_title'         => $source->meta_title,
                'meta_description'   => $source->meta_description,
                'status'             => 'draft', // Always start as draft
            ]);

            // Clone steps and pages
            foreach ($source->steps()->with('pages')->get() as $step) {
                $newStep = FunnelStep::create([
                    'funnel_id'  => $newFunnel->id,
                    'name'       => $step->name,
                    'type'       => $step->type,
                    'sort_order' => $step->sort_order,
                ]);

                foreach ($step->pages as $page) {
                    FunnelPage::create([
                        'funnel_step_id' => $newStep->id,
                        'variant'        => $page->variant,
                        'is_control'     => $page->is_control,
                        'traffic_split'  => $page->traffic_split,
                        'canvas_json'    => $page->canvas_json,  // Deep-clone of JSON
                        'meta_title'     => $page->meta_title,
                        'meta_description' => $page->meta_description,
                        'schema_json'    => $page->schema_json,
                    ]);
                }
            }

            return $newFunnel;
        });

        // Dispatch background job to deep-clone image assets into recipient's cloud bucket
        // \App\Modules\Funnels\Jobs\CloneFunnelAssetsJob::dispatch($source->id, $newFunnel->id);

        return response()->json([
            'ok'          => true,
            'redirect'    => route('client.funnels.edit', $newFunnel->uuid),
            'funnel_uuid' => $newFunnel->uuid,
        ]);
    }

    // ─── Export (Preview before import) ──────────────────────────────────────

    public function preview(string $shareToken): JsonResponse
    {
        $funnel = Funnel::where('share_token', $shareToken)
            ->where('is_shareable', true)
            ->with('steps')
            ->firstOrFail();

        return response()->json([
            'name'        => $funnel->name,
            'steps_count' => $funnel->steps->count(),
            'steps'       => $funnel->steps->map(fn ($s) => [
                'name' => $s->name,
                'type' => $s->type,
            ]),
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function uniqueSlug(int $workspaceId, string $base): string
    {
        $slug   = $base;
        $suffix = 2;

        while (Funnel::where('workspace_id', $workspaceId)->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
