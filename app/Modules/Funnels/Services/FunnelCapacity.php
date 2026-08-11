<?php

namespace App\Modules\Funnels\Services;

use App\Models\Workspace;
use App\Modules\Funnels\Models\Funnel;

/**
 * FunnelCapacity — Plan limit resolver for the Funnels module.
 *
 * Follows the exact same pattern as:
 *   App\Modules\Ecommerce\Services\ContactCapacity
 *
 * How limits work:
 *  - `null`  in plan limits = UNLIMITED (Business plan)
 *  - integer = hard cap
 *  - key missing from plan JSON = falls back to a safe default
 *
 * Supported plan limit keys:
 *  - funnels          : max number of funnels per workspace
 *  - funnel_steps     : max steps per funnel
 *  - funnel_ab_tests  : A/B testing enabled (0 = off, 1 = on, null = on)
 *  - funnel_affiliates: max affiliates per workspace (0 = disabled)
 */
class FunnelCapacity
{
    // ── Funnels remaining ─────────────────────────────────────────────────────

    /**
     * How many more funnels the workspace may create under its current plan.
     * Returns null for unlimited.
     */
    public function funnelsRemaining(int $workspaceId): ?int
    {
        $limit = $this->planLimit($workspaceId, 'funnels');

        if ($limit === null) {
            return null; // Unlimited
        }

        $current = Funnel::where('workspace_id', $workspaceId)->count();

        return max(0, (int) $limit - $current);
    }

    /**
     * Whether the workspace can create another funnel.
     */
    public function canCreateFunnel(int $workspaceId): bool
    {
        $remaining = $this->funnelsRemaining($workspaceId);

        return $remaining === null || $remaining > 0;
    }

    // ── Steps remaining ───────────────────────────────────────────────────────

    /**
     * How many more steps a funnel may have.
     * Returns null for unlimited.
     */
    public function stepsRemaining(int $funnelId, int $workspaceId): ?int
    {
        $limit = $this->planLimit($workspaceId, 'funnel_steps');

        if ($limit === null) {
            return null;
        }

        $current = \DB::table('funnel_steps')->where('funnel_id', $funnelId)->count();

        return max(0, (int) $limit - $current);
    }

    public function canAddStep(int $funnelId, int $workspaceId): bool
    {
        $remaining = $this->stepsRemaining($funnelId, $workspaceId);

        return $remaining === null || $remaining > 0;
    }

    // ── A/B Testing enabled ───────────────────────────────────────────────────

    /**
     * Whether A/B split testing is available on this workspace's plan.
     * Starter plan: disabled (0). Pro/Business: enabled (null or 1).
     */
    public function abTestingEnabled(int $workspaceId): bool
    {
        $limit = $this->planLimit($workspaceId, 'funnel_ab_tests');

        // null = unlimited/enabled, 0 = disabled, 1 = enabled
        return $limit === null || (int) $limit >= 1;
    }

    // ── Affiliates ─────────────────────────────────────────────────────────────

    /**
     * Whether the affiliate portal is available on this plan.
     * Starter: 0 (disabled). Pro: 5. Business: null (unlimited).
     */
    public function affiliatesEnabled(int $workspaceId): bool
    {
        $limit = $this->planLimit($workspaceId, 'funnel_affiliates');

        return $limit === null || (int) $limit > 0;
    }

    public function affiliatesRemaining(int $workspaceId): ?int
    {
        $limit = $this->planLimit($workspaceId, 'funnel_affiliates');

        if ($limit === null) {
            return null;
        }

        if ((int) $limit === 0) {
            return 0;
        }

        $current = \DB::table('funnel_affiliates')->where('workspace_id', $workspaceId)->count();

        return max(0, (int) $limit - $current);
    }

    // ── Usage summary (for dashboard and settings pages) ──────────────────────

    /**
     * Returns a structured usage/limit summary for the workspace.
     * Consumed by the Funnel Index page to show upgrade prompts.
     */
    public function usageSummary(int $workspaceId): array
    {
        $funnelCount     = Funnel::where('workspace_id', $workspaceId)->count();
        $funnelLimit     = $this->planLimit($workspaceId, 'funnels');
        $affiliateLimit  = $this->planLimit($workspaceId, 'funnel_affiliates');
        $affiliateCount  = \DB::table('funnel_affiliates')->where('workspace_id', $workspaceId)->count();

        return [
            'funnels' => [
                'used'      => $funnelCount,
                'limit'     => $funnelLimit,
                'unlimited' => $funnelLimit === null,
                'can_create' => $funnelLimit === null || $funnelCount < (int) $funnelLimit,
            ],
            'ab_testing' => [
                'enabled' => $this->abTestingEnabled($workspaceId),
            ],
            'affiliates' => [
                'used'      => $affiliateCount,
                'limit'     => $affiliateLimit,
                'unlimited' => $affiliateLimit === null,
                'enabled'   => $this->affiliatesEnabled($workspaceId),
                'can_add'   => $affiliateLimit === null || $affiliateCount < (int) $affiliateLimit,
            ],
        ];
    }

    // ── Private helper ────────────────────────────────────────────────────────

    /**
     * Reads a single limit key from the workspace's active plan.
     * Returns null if no plan is set OR if the plan has no cap for this key
     * (treating both as "unlimited" — safe default).
     */
    private function planLimit(int $workspaceId, string $key): mixed
    {
        return Workspace::with('client')
            ->find($workspaceId)
            ?->client
            ?->activePlan()
            ?->limitValue($key);
    }
}
