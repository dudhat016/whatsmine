<?php

namespace App\Modules\Pipelines\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Pipelines\Models\Deal;
use App\Modules\Pipelines\Models\LeadPipeline;
use App\Modules\Pipelines\Models\PipelineStage;
use App\Modules\Pipelines\Services\PipelineService;
use App\Modules\Shared\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PipelineController extends Controller
{
    public function __construct(
        protected PipelineService $pipelineService
    ) {}

    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    public function index(Request $request): Response
    {
        $wid = $this->workspaceId($request);
        $defaultPipeline = $this->pipelineService->getOrCreateDefaultPipeline($wid);

        $pipelines = LeadPipeline::where('workspace_id', $wid)
            ->with(['stages' => function ($q) {
                $q->orderBy('priority', 'asc');
            }])
            ->orderBy('priority', 'asc')
            ->get();

        $activePipelineId = (int) $request->input('pipeline_id', $defaultPipeline->id);
        $activePipeline = $pipelines->firstWhere('id', $activePipelineId) ?? $defaultPipeline;

        $contacts = Contact::where('workspace_id', $wid)
            ->select('id', 'uuid', 'first_name', 'last_name', 'phone_e164', 'email')
            ->limit(200)
            ->get();

        $users = User::select('id', 'name', 'email')->get();

        return Inertia::render('Opportunities/Index', [
            'pipelines' => $pipelines,
            'activePipelineId' => $activePipeline->id,
            'contacts' => $contacts,
            'users' => $users,
        ]);
    }

    public function getBoardData(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);
        $pipelineId = (int) $request->input('pipeline_id');
        $searchText = trim($request->input('search', ''));
        $agentId = $request->input('agent_id');
        $status = $request->input('status', 'all');

        $pipeline = LeadPipeline::where('workspace_id', $wid)
            ->where('id', $pipelineId)
            ->with(['stages' => function ($q) {
                $q->orderBy('priority', 'asc');
            }])
            ->firstOrFail();

        $boardColumns = [];

        foreach ($pipeline->stages as $stage) {
            $query = Deal::where('workspace_id', $wid)
                ->where('stage_id', $stage->id)
                ->with(['contact:id,uuid,first_name,last_name,phone_e164,email', 'assignedUser:id,name', 'dealWatcher:id,name']);

            if ($searchText !== '') {
                $query->where(function ($q) use ($searchText) {
                    $q->where('name', 'like', "%{$searchText}%")
                        ->orWhereHas('contact', function ($cq) use ($searchText) {
                            $cq->where('first_name', 'like', "%{$searchText}%")
                                ->orWhere('last_name', 'like', "%{$searchText}%")
                                ->orWhere('phone_e164', 'like', "%{$searchText}%")
                                ->orWhere('email', 'like', "%{$searchText}%");
                        });
                });
            }

            if ($agentId && $agentId !== 'all') {
                $query->where('assigned_user_id', (int) $agentId);
            }

            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            $dealsCount = (clone $query)->count();
            $totalValue = (clone $query)->sum('monetary_value');

            $deals = $query->orderBy('column_priority', 'asc')
                ->latest()
                ->get();

            $boardColumns[] = [
                'id' => $stage->id,
                'uuid' => $stage->uuid,
                'name' => $stage->name,
                'color' => $stage->color,
                'probability' => $stage->probability,
                'show_in_funnel' => $stage->show_in_funnel,
                'priority' => $stage->priority,
                'deals_count' => $dealsCount,
                'total_value' => (float) $totalValue,
                'deals' => $deals,
            ];
        }

        return response()->json([
            'status' => 'success',
            'pipeline' => $pipeline,
            'boardColumns' => $boardColumns,
        ]);
    }

    public function storePipeline(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'label_color' => ['nullable', 'string', 'max:30'],
            'stages' => ['required', 'array', 'min:1'],
            'stages.*.name' => ['required', 'string', 'max:255'],
            'stages.*.color' => ['nullable', 'string', 'max:30'],
            'stages.*.probability' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $pipeline = LeadPipeline::create([
            'workspace_id' => $wid,
            'name' => $validated['name'],
            'label_color' => $validated['label_color'] ?? '#3b82f6',
            'is_default' => false,
            'priority' => LeadPipeline::where('workspace_id', $wid)->max('priority') + 1,
        ]);

        foreach ($validated['stages'] as $index => $sData) {
            PipelineStage::create([
                'pipeline_id' => $pipeline->id,
                'name' => $sData['name'],
                'color' => $sData['color'] ?? '#3b82f6',
                'probability' => $sData['probability'] ?? 100,
                'priority' => $index + 1,
                'show_in_funnel' => true,
            ]);
        }

        return back()->with('success', 'Pipeline created successfully.');
    }

    public function updatePipeline(Request $request, LeadPipeline $pipeline): RedirectResponse
    {
        abort_unless((int) $pipeline->workspace_id === $this->workspaceId($request), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'label_color' => ['nullable', 'string', 'max:30'],
            'stages' => ['required', 'array', 'min:1'],
            'stages.*.id' => ['nullable', 'integer'],
            'stages.*.name' => ['required', 'string', 'max:255'],
            'stages.*.color' => ['nullable', 'string', 'max:30'],
            'stages.*.probability' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $pipeline->update([
            'name' => $validated['name'],
            'label_color' => $validated['label_color'] ?? $pipeline->label_color,
        ]);

        $existingStageIds = [];
        foreach ($validated['stages'] as $index => $sData) {
            if (! empty($sData['id'])) {
                $stage = PipelineStage::where('pipeline_id', $pipeline->id)->find($sData['id']);
                if ($stage) {
                    $stage->update([
                        'name' => $sData['name'],
                        'color' => $sData['color'] ?? '#3b82f6',
                        'probability' => $sData['probability'] ?? 100,
                        'priority' => $index + 1,
                    ]);
                    $existingStageIds[] = $stage->id;
                }
            } else {
                $newStage = PipelineStage::create([
                    'pipeline_id' => $pipeline->id,
                    'name' => $sData['name'],
                    'color' => $sData['color'] ?? '#3b82f6',
                    'probability' => $sData['probability'] ?? 100,
                    'priority' => $index + 1,
                    'show_in_funnel' => true,
                ]);
                $existingStageIds[] = $newStage->id;
            }
        }

        return back()->with('success', 'Pipeline updated successfully.');
    }

    public function destroyPipeline(Request $request, LeadPipeline $pipeline): RedirectResponse
    {
        abort_unless((int) $pipeline->workspace_id === $this->workspaceId($request), 403);
        
        if (LeadPipeline::where('workspace_id', $this->workspaceId($request))->count() <= 1) {
            return back()->with('error', 'Cannot delete the only pipeline.');
        }

        $pipeline->delete();
        return back()->with('success', 'Pipeline deleted successfully.');
    }

    public function reorderStages(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);
        $validated = $request->validate([
            'pipeline_id' => ['required', 'integer'],
            'stage_ids' => ['required', 'array'],
        ]);

        $pipeline = LeadPipeline::where('workspace_id', $wid)->where('id', $validated['pipeline_id'])->firstOrFail();
        $this->pipelineService->reorderStages($pipeline, $validated['stage_ids']);

        return response()->json(['status' => 'success']);
    }

    public function safeDeleteStage(Request $request, PipelineStage $stage): JsonResponse
    {
        $wid = $this->workspaceId($request);
        abort_unless((int) $stage->pipeline->workspace_id === $wid, 403);

        $validated = $request->validate([
            'target_stage_id' => ['required', 'integer', 'different:'.$stage->id],
        ]);

        $targetStage = PipelineStage::where('pipeline_id', $stage->pipeline_id)->where('id', $validated['target_stage_id'])->firstOrFail();
        $this->pipelineService->safeDeleteStage($stage, $targetStage, $request->user()->id);

        return response()->json(['status' => 'success']);
    }

    public function storeDeal(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        $validated = $request->validate([
            'pipeline_id' => ['required', 'integer'],
            'stage_id' => ['required', 'integer'],
            'contact_id' => ['required', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'monetary_value' => ['nullable', 'numeric', 'min:0'],
            'assigned_user_id' => ['nullable', 'integer'],
            'deal_watcher_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:open,won,lost,abandoned'],
            'expected_close_date' => ['nullable', 'date'],
        ]);

        $maxPriority = Deal::where('workspace_id', $wid)
            ->where('stage_id', $validated['stage_id'])
            ->max('column_priority') ?? 0;

        Deal::create(array_merge($validated, [
            'workspace_id' => $wid,
            'monetary_value' => $validated['monetary_value'] ?? 0.00,
            'status' => $validated['status'] ?? 'open',
            'column_priority' => $maxPriority + 1,
        ]));

        return back()->with('success', 'Opportunity created successfully.');
    }

    public function updateDeal(Request $request, Deal $deal): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === $this->workspaceId($request), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'monetary_value' => ['nullable', 'numeric', 'min:0'],
            'contact_id' => ['required', 'integer'],
            'stage_id' => ['required', 'integer'],
            'assigned_user_id' => ['nullable', 'integer'],
            'deal_watcher_id' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:open,won,lost,abandoned'],
            'expected_close_date' => ['nullable', 'date'],
            'lost_reason' => ['nullable', 'string', 'max:255'],
        ]);

        $deal->update($validated);

        return back()->with('success', 'Opportunity updated successfully.');
    }

    public function destroyDeal(Request $request, Deal $deal): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === $this->workspaceId($request), 403);
        $deal->delete();

        return back()->with('success', 'Opportunity deleted.');
    }

    public function updateStageAndPriority(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);
        $validated = $request->validate([
            'deal_id' => ['required', 'integer'],
            'target_stage_id' => ['required', 'integer'],
            'ordered_deal_ids_in_stage' => ['required', 'array'],
        ]);

        $deal = Deal::where('workspace_id', $wid)->where('id', $validated['deal_id'])->firstOrFail();

        $updatedDeal = $this->pipelineService->updateStageAndPriority(
            $deal,
            $validated['target_stage_id'],
            $validated['ordered_deal_ids_in_stage'],
            $request->user()->id
        );

        return response()->json([
            'status' => 'success',
            'deal' => $updatedDeal,
        ]);
    }
}
