<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\Funnel;
use App\Modules\Funnels\Models\FunnelAffiliate;
use App\Modules\Funnels\Models\FunnelAffiliateCommission;
use App\Modules\Funnels\Services\FunnelCapacity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FunnelAffiliateController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    // ─── Portal Index ─────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $wid = $this->workspaceId($request);

        $affiliates = FunnelAffiliate::where('workspace_id', $wid)
            ->with('funnel:id,name')
            ->withCount('commissions')
            ->latest()
            ->get()
            ->map(fn ($a) => [
                'id'                => $a->id,
                'name'              => $a->name,
                'email'             => $a->email,
                'ref_code'          => $a->ref_code,
                'funnel'            => $a->funnel,
                'commission_rate'   => $a->commission_rate,
                'status'            => $a->status,
                'clicks_count'      => $a->clicks_count,
                'leads_count'       => $a->leads_count,
                'conversions_count' => $a->conversions_count,
                'total_earned'      => $a->total_earned,
                'total_paid'        => $a->total_paid,
                'pending_balance'   => $a->pending_balance,
            ]);

        // Funnels list for the "Add Affiliate" dropdown
        $funnels = Funnel::forWorkspace($wid)
            ->where('status', 'published')
            ->get(['id', 'name']);

        return Inertia::render('Funnels/Affiliates', [
            'affiliates' => $affiliates,
            'funnels'    => $funnels,
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);

        // ── Plan affiliate gate ────────────────────────────────────────────
        $capacity = app(FunnelCapacity::class);
        abort_unless(
            $capacity->affiliatesEnabled($wid),
            403,
            'The Affiliate Portal is not available on your current plan. Please upgrade.'
        );
        abort_unless(
            ($capacity->affiliatesRemaining($wid) ?? 1) > 0,
            403,
            'You have reached your plan\'s affiliate limit. Upgrade to add more affiliates.'
        );

        $validated = $request->validate([
            'funnel_id'       => ['required', 'integer', 'exists:funnels,id'],
            'name'            => ['required', 'string', 'max:128'],
            'email'           => ['required', 'email', 'max:191'],
            'commission_rate' => ['sometimes', 'numeric', 'min:1', 'max:100'],
        ]);

        // Ensure the funnel belongs to this workspace
        abort_unless(
            Funnel::where('id', $validated['funnel_id'])->where('workspace_id', $wid)->exists(),
            403
        );

        $affiliate = FunnelAffiliate::create(array_merge($validated, [
            'workspace_id' => $wid,
        ]));

        return response()->json(['ok' => true, 'affiliate' => $affiliate]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, FunnelAffiliate $affiliate): JsonResponse
    {
        abort_unless((int) $affiliate->workspace_id === $this->workspaceId($request), 403);

        $validated = $request->validate([
            'name'            => ['sometimes', 'string', 'max:128'],
            'commission_rate' => ['sometimes', 'numeric', 'min:1', 'max:100'],
            'status'          => ['sometimes', 'in:active,paused,banned'],
        ]);

        $affiliate->update($validated);

        return response()->json(['ok' => true, 'affiliate' => $affiliate->fresh()]);
    }

    // ─── Commissions History ──────────────────────────────────────────────────

    public function commissions(Request $request, FunnelAffiliate $affiliate): JsonResponse
    {
        abort_unless((int) $affiliate->workspace_id === $this->workspaceId($request), 403);

        $commissions = FunnelAffiliateCommission::where('funnel_affiliate_id', $affiliate->id)
            ->latest()
            ->paginate(50);

        return response()->json(['commissions' => $commissions]);
    }

    // ─── Mark Commission as Paid ──────────────────────────────────────────────

    public function markPaid(Request $request, FunnelAffiliate $affiliate, FunnelAffiliateCommission $commission): JsonResponse
    {
        abort_unless((int) $affiliate->workspace_id === $this->workspaceId($request), 403);
        abort_unless((int) $commission->funnel_affiliate_id === $affiliate->id, 403);

        \DB::transaction(function () use ($affiliate, $commission) {
            $commission->update(['status' => 'paid', 'paid_at' => now()]);
            $affiliate->increment('total_paid', $commission->commission_amount);
        });

        return response()->json(['ok' => true]);
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(Request $request, FunnelAffiliate $affiliate): JsonResponse
    {
        abort_unless((int) $affiliate->workspace_id === $this->workspaceId($request), 403);

        $affiliate->delete();

        return response()->json(['ok' => true]);
    }
}
