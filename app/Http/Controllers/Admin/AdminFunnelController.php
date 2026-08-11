<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\Funnel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminFunnelController extends Controller
{
    // ─── Master Funnel Directory ──────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $query = Funnel::withTrashed()
            ->with('steps')
            ->withCount('submissions');

        // Search by funnel name
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where('name', 'like', "%{$q}%");
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $funnels = $query->latest()->paginate(30)->withQueryString()->through(fn ($f) => [
            'id'                => $f->id,
            'uuid'              => $f->uuid,
            'name'              => $f->name,
            'slug'              => $f->slug,
            'status'            => $f->status,
            'workspace_id'      => $f->workspace_id,
            'views_count'       => $f->views_count,
            'conversions_count' => $f->conversions_count,
            'total_revenue'     => $f->total_revenue,
            'submissions_count' => $f->submissions_count,
            'steps_count'       => $f->steps->count(),
            'deleted_at'        => $f->deleted_at,
            'created_at'        => $f->created_at,
        ]);

        return Inertia::render('Admin/Funnels/Index', [
            'funnels' => $funnels,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    // ─── Suspend (Unpublish by Admin) ─────────────────────────────────────────

    /**
     * Admin can suspend a funnel across any workspace for policy violations.
     */
    public function suspend(Request $request, Funnel $funnel): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $funnel->update([
            'status'              => 'suspended',
            'validation_warnings' => array_merge((array) $funnel->validation_warnings, [
                ['type' => 'admin_suspension', 'reason' => $validated['reason'] ?? 'Policy violation', 'by' => $request->user('admin')?->email],
            ]),
        ]);

        return response()->json(['ok' => true]);
    }

    // ─── Restore (Un-suspend) ─────────────────────────────────────────────────

    public function restore(Request $request, Funnel $funnel): JsonResponse
    {
        $funnel->update(['status' => 'draft']);

        return response()->json(['ok' => true]);
    }

    // ─── System Templates ─────────────────────────────────────────────────────

    /**
     * Mark a funnel as a system template available to all workspaces.
     */
    public function makeSystemTemplate(Funnel $funnel): JsonResponse
    {
        $funnel->update(['is_system_template' => true]);

        return response()->json(['ok' => true]);
    }

    public function removeSystemTemplate(Funnel $funnel): JsonResponse
    {
        $funnel->update(['is_system_template' => false]);

        return response()->json(['ok' => true]);
    }

    // ─── System Templates Gallery ─────────────────────────────────────────────

    public function templates(Request $request): Response
    {
        $templates = Funnel::where('is_system_template', true)
            ->withCount('steps')
            ->latest()
            ->get()
            ->map(fn ($f) => [
                'id'          => $f->id,
                'uuid'        => $f->uuid,
                'name'        => $f->name,
                'steps_count' => $f->steps_count,
                'created_at'  => $f->created_at,
            ]);

        return Inertia::render('admin/Funnels/Templates', [
            'templates' => $templates,
        ]);
    }

    // ─── Force Delete ─────────────────────────────────────────────────────────

    public function destroy(Funnel $funnel): RedirectResponse
    {
        $funnel->forceDelete();

        return redirect()
            ->route('admin.funnels.index')
            ->with('success', 'Funnel permanently deleted.');
    }

    // ─── Proactive Policy Scanner ─────────────────────────────────────────────

    /**
     * Scans all published funnel names/meta_titles for policy-violating keywords.
     * Returns flagged funnels for admin review.
     */
    public function policyScanner(Request $request): JsonResponse
    {
        // Configurable banned keyword list (in production, load from system_settings)
        $bannedKeywords = ['spam', 'scam', 'guaranteed income', 'get rich quick'];

        $flagged = Funnel::where('status', 'published')
            ->where(function ($q) use ($bannedKeywords) {
                foreach ($bannedKeywords as $keyword) {
                    $q->orWhere('name', 'like', "%{$keyword}%")
                      ->orWhere('meta_title', 'like', "%{$keyword}%");
                }
            })
            ->get(['id', 'uuid', 'name', 'workspace_id', 'status', 'meta_title']);

        return response()->json(['flagged' => $flagged, 'count' => $flagged->count()]);
    }
}
