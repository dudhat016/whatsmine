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
    // ─── Share Preview (Public / Inertia) ───────────────────────────────────

    public function sharePreview(Request $request, string $shareToken)
    {
        $funnel = $this->resolveShareableFunnel($shareToken);

        if ($request->wantsJson()) {
            return response()->json([
                'name'        => $funnel->name,
                'uuid'        => $funnel->uuid,
                'slug'        => $funnel->slug,
                'steps_count' => $funnel->steps->count(),
                'steps'       => $funnel->steps->map(fn ($s) => [
                    'id'   => $s->id,
                    'name' => $s->name,
                    'type' => $s->type,
                ]),
            ]);
        }

        $user = $request->user();
        $previewUrl = url("/f/{$funnel->workspace_id}/{$funnel->slug}");

        return \Inertia\Inertia::render('Funnels/Share', [
            'funnel' => [
                'id'               => $funnel->id,
                'uuid'             => $funnel->uuid,
                'name'             => $funnel->name,
                'slug'             => $funnel->slug,
                'theme_color'      => $funnel->theme_color,
                'meta_title'       => $funnel->meta_title,
                'meta_description' => $funnel->meta_description,
                'steps_count'      => $funnel->steps->count(),
            ],
            'steps' => $funnel->steps->map(fn ($s) => [
                'id'         => $s->id,
                'name'       => $s->name,
                'type'       => $s->type,
                'sort_order' => $s->sort_order,
            ]),
            'previewUrl'  => $previewUrl,
            'shareToken'  => $shareToken,
            'isAuthenticated' => (bool) $user,
        ]);
    }

    // ─── Import (Clone into workspace) ───────────────────────────────────────

    /**
     * 1-Click funnel import: clones the entire funnel structure (steps + pages)
     * into the authenticated user's workspace.
     */
    public function import(Request $request, string $shareToken)
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->guest(route('login', ['redirect' => url()->current()]));
        }

        $wid = $this->workspaceId($request);
        $source = $this->resolveShareableFunnel($shareToken);

        $newFunnel = \DB::transaction(function () use ($source, $wid) {
            $newFunnel = Funnel::create([
                'workspace_id'       => $wid,
                'name'               => $source->name.' (Imported)',
                'slug'               => $this->uniqueSlug($wid, $source->slug),
                'theme_color'        => $source->theme_color,
                'meta_title'         => $source->meta_title,
                'meta_description'   => $source->meta_description,
                'status'             => 'draft',
            ]);

            foreach ($source->steps()->with('pages')->get() as $step) {
                $newStep = FunnelStep::create([
                    'funnel_id'  => $newFunnel->id,
                    'name'       => $step->name,
                    'type'       => $step->type,
                    'sort_order' => $step->sort_order,
                ]);

                foreach ($step->pages as $page) {
                    FunnelPage::create([
                        'funnel_step_id'   => $newStep->id,
                        'variant'          => $page->variant,
                        'is_control'       => $page->is_control,
                        'traffic_split'    => $page->traffic_split,
                        'canvas_json'      => $page->canvas_json,
                        'meta_title'       => $page->meta_title,
                        'meta_description' => $page->meta_description,
                        'schema_json'      => $page->schema_json,
                    ]);
                }
            }

            return $newFunnel;
        });

        if ($request->wantsJson()) {
            return response()->json([
                'ok'          => true,
                'redirect'    => route('client.funnels.edit', $newFunnel->uuid),
                'funnel_uuid' => $newFunnel->uuid,
            ]);
        }

        return redirect()->route('client.funnels.edit', $newFunnel->uuid)
            ->with('success', "Funnel \"{$source->name}\" was successfully imported into your workspace!");
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function resolveShareableFunnel(string $token): Funnel
    {
        $cleanToken = str_starts_with($token, 'fnl_share_') ? substr($token, 10) : $token;

        return Funnel::where(function ($q) use ($token, $cleanToken) {
            $q->where('share_token', $token)
              ->orWhere('share_token', $cleanToken)
              ->orWhere('uuid', $token)
              ->orWhere('uuid', $cleanToken)
              ->orWhere('slug', $token)
              ->orWhere('slug', $cleanToken);

            if (is_numeric($token)) {
                $q->orWhere('id', (int) $token);
            }
            if (is_numeric($cleanToken)) {
                $q->orWhere('id', (int) $cleanToken);
            }
        })
        ->with(['steps' => fn ($q) => $q->orderBy('sort_order'), 'steps.pages'])
        ->firstOrFail();
    }

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
