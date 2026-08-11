<?php

namespace App\Http\Controllers\Client\Reports;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\Funnel;
use App\Modules\Funnels\Models\FunnelSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FunnelReportController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    // ─── Funnel Analytics Overview ────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $wid = $this->workspaceId($request);

        $funnels = Funnel::forWorkspace($wid)
            ->withCount(['submissions', 'submissions as customer_count' => fn ($q) => $q->where('status', 'customer')])
            ->latest()
            ->get()
            ->map(fn ($f) => [
                'id'               => $f->id,
                'uuid'             => $f->uuid,
                'name'             => $f->name,
                'status'           => $f->status,
                'views_count'      => $f->views_count,
                'conversions_count' => $f->conversions_count,
                'conversion_rate'  => $f->conversion_rate,
                'total_revenue'    => $f->total_revenue,
                'submissions_count' => $f->submissions_count,
                'customer_count'   => $f->customer_count,
            ]);

        return Inertia::render('Reports/Funnels/Index', [
            'funnels' => $funnels,
        ]);
    }

    // ─── Single Funnel Deep Analytics ────────────────────────────────────────

    public function show(Request $request, Funnel $funnel): Response
    {
        abort_unless((int) $funnel->workspace_id === $this->workspaceId($request), 403);

        $funnel->load('steps.pages');

        // ── KPIs ──────────────────────────────────────────────────────────────
        $totalViews       = $funnel->views_count;
        $totalConversions = $funnel->conversions_count;
        $totalRevenue     = $funnel->total_revenue;
        $aov              = $totalConversions > 0
            ? round($totalRevenue / $totalConversions, 2)
            : 0.00;
        $rpv              = $totalViews > 0
            ? round($totalRevenue / $totalViews, 2)
            : 0.00;

        // ── Lead / Customer counts ────────────────────────────────────────────
        $leadCount     = FunnelSubmission::where('funnel_id', $funnel->id)->where('status', 'lead')->count();
        $customerCount = FunnelSubmission::where('funnel_id', $funnel->id)->where('status', 'customer')->count();

        // ── Step-level funnel drop-off table ──────────────────────────────────
        $stepStats = $funnel->steps->map(fn ($step) => [
            'id'               => $step->id,
            'name'             => $step->name,
            'type'             => $step->type,
            'views_count'      => $step->views_count,
            'conversions_count' => $step->conversions_count,
            'conversion_rate'  => $step->conversion_rate,
        ]);

        // ── A/B Testing table per step ────────────────────────────────────────
        $abStats = $funnel->steps->flatMap(function ($step) {
            return $step->pages->map(fn ($page) => [
                'step_name'        => $step->name,
                'variant'          => $page->variant,
                'views_count'      => $page->views_count,
                'conversions_count' => $page->conversions_count,
                'conversion_rate'  => $page->conversion_rate,
                'revenue'          => $page->revenue,
                'rpv'              => $page->revenue_per_visitor,
            ]);
        });

        // ── Traffic sources (UTM) ─────────────────────────────────────────────
        $utmSources = FunnelSubmission::where('funnel_id', $funnel->id)
            ->whereNotNull('utm_source')
            ->select('utm_source', DB::raw('count(*) as count'))
            ->groupBy('utm_source')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // ── Recent submissions (paginated) ────────────────────────────────────
        $submissions = FunnelSubmission::where('funnel_id', $funnel->id)
            ->with('step:id,name,type')
            ->latest()
            ->paginate(50);

        return Inertia::render('Reports/Funnels/Show', [
            'funnel'      => $funnel->only('id', 'uuid', 'name', 'status', 'slug'),
            'kpis'        => compact('totalViews', 'totalConversions', 'totalRevenue', 'aov', 'rpv', 'leadCount', 'customerCount'),
            'step_stats'  => $stepStats,
            'ab_stats'    => $abStats,
            'utm_sources' => $utmSources,
            'submissions' => $submissions,
        ]);
    }
}
