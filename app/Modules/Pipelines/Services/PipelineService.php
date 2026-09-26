<?php

namespace App\Modules\Pipelines\Services;

use App\Modules\Pipelines\Models\Deal;
use App\Modules\Pipelines\Models\DealHistory;
use App\Modules\Pipelines\Models\LeadPipeline;
use App\Modules\Pipelines\Models\PipelineStage;
use Illuminate\Support\Facades\DB;

class PipelineService
{
    /**
     * Get default workspace pipeline or seed a default one.
     */
    public function getOrCreateDefaultPipeline(int $workspaceId): LeadPipeline
    {
        $pipeline = LeadPipeline::where('workspace_id', $workspaceId)
            ->where('is_default', true)
            ->first();

        if (! $pipeline) {
            $pipeline = LeadPipeline::where('workspace_id', $workspaceId)->first();
        }

        if (! $pipeline) {
            $pipeline = DB::transaction(function () use ($workspaceId) {
                $p = LeadPipeline::create([
                    'workspace_id' => $workspaceId,
                    'name' => 'Sales Pipeline',
                    'is_default' => true,
                    'priority' => 1,
                    'label_color' => '#6366f1',
                ]);

                $defaultStages = [
                    ['name' => 'New Lead', 'color' => '#3b82f6', 'probability' => 20, 'priority' => 1],
                    ['name' => 'Contacted', 'color' => '#8b5cf6', 'probability' => 40, 'priority' => 2],
                    ['name' => 'Proposal Sent', 'color' => '#f59e0b', 'probability' => 70, 'priority' => 3],
                    ['name' => 'Won', 'color' => '#10b981', 'probability' => 100, 'priority' => 4],
                    ['name' => 'Lost', 'color' => '#ef4444', 'probability' => 0, 'priority' => 5],
                ];

                foreach ($defaultStages as $stage) {
                    PipelineStage::create([
                        'pipeline_id' => $p->id,
                        'name' => $stage['name'],
                        'color' => $stage['color'],
                        'probability' => $stage['probability'],
                        'priority' => $stage['priority'],
                        'show_in_funnel' => true,
                    ]);
                }

                return $p;
            });
        }

        return $pipeline;
    }

    /**
     * Reorder stages within a pipeline.
     */
    public function reorderStages(LeadPipeline $pipeline, array $orderedStageIds): void
    {
        DB::transaction(function () use ($pipeline, $orderedStageIds) {
            foreach ($orderedStageIds as $index => $stageId) {
                PipelineStage::where('pipeline_id', $pipeline->id)
                    ->where('id', $stageId)
                    ->update(['priority' => $index + 1]);
            }
        });
    }

    /**
     * Safely delete a stage after migrating deals to a target stage.
     */
    public function safeDeleteStage(PipelineStage $stage, PipelineStage $targetStage, ?int $userId = null): void
    {
        DB::transaction(function () use ($stage, $targetStage, $userId) {
            $dealsToMigrate = Deal::where('stage_id', $stage->id)->get();

            foreach ($dealsToMigrate as $deal) {
                $deal->update([
                    'stage_id' => $targetStage->id,
                    'pipeline_id' => $targetStage->pipeline_id,
                ]);

                DealHistory::create([
                    'deal_id' => $deal->id,
                    'event_type' => 'stage_change',
                    'stage_from_id' => $stage->id,
                    'stage_to_id' => $targetStage->id,
                    'user_id' => $userId,
                    'remarks' => "Migrated due to deletion of stage '{$stage->name}'",
                ]);
            }

            $stage->delete();
        });
    }

    /**
     * Update a deal's stage and card column priorities on drag and drop or automation.
     */
    public function updateStageAndPriority(
        Deal $deal,
        int $targetStageId,
        array $orderedDealIdsInStage,
        ?int $userId = null,
        string $source = 'manual',
        ?string $workflowName = null
    ): Deal {
        return DB::transaction(function () use ($deal, $targetStageId, $orderedDealIdsInStage, $userId, $source, $workflowName) {
            $oldStageId = $deal->stage_id;
            $stageChanged = $oldStageId !== $targetStageId;

            $targetStage = PipelineStage::findOrFail($targetStageId);

            $deal->update([
                'stage_id' => $targetStageId,
                'pipeline_id' => $targetStage->pipeline_id,
            ]);

            if ($stageChanged) {
                $user = $userId ? \App\Models\User::find($userId) : null;
                $remarks = $source === 'automation'
                    ? ('Moved automatically via workflow ' . ($workflowName ? "'{$workflowName}'" : ''))
                    : ($user ? "Moved manually by {$user->name} on Kanban board" : 'Moved manually via Kanban board');

                DealHistory::create([
                    'deal_id' => $deal->id,
                    'event_type' => 'stage_change',
                    'stage_from_id' => $oldStageId,
                    'stage_to_id' => $targetStageId,
                    'user_id' => $userId,
                    'remarks' => trim($remarks),
                ]);

                if ($deal->contact_id) {
                    $this->triggerStageAutomations($deal, $oldStageId, $source, $workflowName);
                }
            }

            // Update column priority for all deals in target stage
            foreach ($orderedDealIdsInStage as $priority => $dealId) {
                Deal::where('id', $dealId)->update(['column_priority' => $priority]);
            }

            return $deal->fresh();
        });
    }

    public function triggerStageAutomations(
        Deal $deal,
        ?int $oldStageId = null,
        string $source = 'manual',
        ?string $workflowName = null
    ): void {
        try {
            $engine = app(\App\Modules\Automation\Services\AutomationEngine::class);
            $automations = \App\Modules\Automation\Models\Automation::where('workspace_id', $deal->workspace_id)
                ->whereIn('status', ['active', 'published'])
                ->get();

            foreach ($automations as $automation) {
                foreach ($engine->getAutomationTriggers($automation) as $tr) {
                    if (! in_array($tr['trigger_type'], ['opportunity.stage_changed', 'opportunity.created'], true)) {
                        continue;
                    }
                    $config = $tr['trigger_config'] ?? [];

                    // 1. Pipeline filter
                    if (! empty($config['pipeline_id']) && (int) $config['pipeline_id'] !== (int) $deal->pipeline_id) {
                        continue;
                    }

                    // 2. Destination stage filter
                    if (! empty($config['stage_id']) && (int) $config['stage_id'] !== (int) $deal->stage_id) {
                        continue;
                    }

                    // 3. Previous ("From") stage filter (if set, must match the stage the deal just left)
                    if (! empty($config['from_stage_id']) && $oldStageId !== null && (int) $config['from_stage_id'] !== (int) $oldStageId) {
                        continue;
                    }

                    // 4. Change source filter (any, manual, automation)
                    $changeSource = $config['change_source'] ?? 'any';
                    if ($changeSource === 'manual' && $source !== 'manual') {
                        continue;
                    }
                    if ($changeSource === 'automation' && $source !== 'automation') {
                        continue;
                    }

                    // 4b. Standard Field Filters: Assigned User, Min Lead Value, Priority
                    if (! empty($config['assigned_user_id']) && (int) $config['assigned_user_id'] !== (int) $deal->assigned_user_id) {
                        continue;
                    }
                    if (! empty($config['min_lead_value']) && (float) $deal->monetary_value < (float) $config['min_lead_value']) {
                        continue;
                    }
                    if (! empty($config['priority']) && $config['priority'] !== 'all' && (string) $deal->priority !== (string) $config['priority']) {
                        continue;
                    }

                    // 5. Auto-cancel active/waiting runs from previous stage if configured
                    if (! empty($config['cancel_previous_stage_runs']) && ! empty($deal->contact_id)) {
                        $waitingRuns = \App\Modules\Automation\Models\AutomationRun::where('contact_id', $deal->contact_id)
                            ->where('automation_id', '!=', $automation->id)
                            ->whereIn('status', ['waiting', 'running', 'pending'])
                            ->get();

                        foreach ($waitingRuns as $wRun) {
                            $wRun->update([
                                'status' => 'cancelled',
                                'completed_at' => now(),
                                'error' => "Cancelled because opportunity #{$deal->id} changed stage to '{$deal->stage?->name}'",
                            ]);

                            \App\Modules\Automation\Models\AutomationRunLog::create([
                                'run_id' => $wRun->id,
                                'node_id' => 'system',
                                'node_type' => 'stage_change_unenroll',
                                'result' => 'ok',
                                'message' => "Unenrolled because deal moved to stage '{$deal->stage?->name}'",
                            ]);
                        }
                    }

                    $engine->triggerForContact($automation, (int) $deal->contact_id, [
                        'opportunity_id' => $deal->id,
                        'opportunity_name' => $deal->name,
                        'opportunity_value' => $deal->monetary_value,
                        'stage_id' => $deal->stage_id,
                        'stage_name' => $deal->stage?->name ?? '',
                        'old_stage_id' => $oldStageId,
                        'pipeline_id' => $deal->pipeline_id,
                        'pipeline_name' => $deal->pipeline?->name ?? '',
                        'change_source' => $source,
                        'workflow_name' => $workflowName,
                        'trigger_name' => $tr['trigger_name'],
                        'trigger_type' => $tr['trigger_type'],
                        '_matched_trigger_id' => $tr['id'],
                    ]);
                    break;
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to trigger opportunity automation: '.$e->getMessage());
        }
    }

    /**
     * Transfer a deal to a different pipeline and landing stage.
     */
    public function transferPipeline(
        Deal $deal,
        int $targetPipelineId,
        int $targetStageId,
        ?int $assignedUserId = null,
        ?int $currentUserId = null,
        string $source = 'manual',
        ?string $workflowName = null
    ): Deal {
        return DB::transaction(function () use ($deal, $targetPipelineId, $targetStageId, $assignedUserId, $currentUserId, $source, $workflowName) {
            $oldPipelineId = (int) $deal->pipeline_id;
            $oldStageId = (int) $deal->stage_id;
            $oldPipeline = LeadPipeline::find($oldPipelineId);
            $newPipeline = LeadPipeline::findOrFail($targetPipelineId);
            $newStage = PipelineStage::where('pipeline_id', $targetPipelineId)->findOrFail($targetStageId);

            $user = $currentUserId ? \App\Models\User::find($currentUserId) : null;

            $updateData = [
                'pipeline_id' => $targetPipelineId,
                'stage_id' => $targetStageId,
            ];
            if ($assignedUserId !== null) {
                $updateData['assigned_user_id'] = $assignedUserId ?: null;
            }

            $deal->update($updateData);

            $sourceRemark = ($source === 'automation')
                ? ($workflowName ? "via workflow '{$workflowName}'" : 'via automation')
                : ($user ? "by {$user->name} on Kanban board" : 'via Kanban board');

            $remarks = "Transferred from '{$oldPipeline?->name}' to '{$newPipeline->name}' (Stage: {$newStage->name}) {$sourceRemark}";

            DealHistory::create([
                'deal_id' => $deal->id,
                'event_type' => 'pipeline_transferred',
                'stage_from_id' => $oldStageId,
                'stage_to_id' => $targetStageId,
                'user_id' => $currentUserId,
                'remarks' => $remarks,
                'created_at' => now(),
            ]);

            // 1. Trigger Pipeline Changed Automations
            if ($deal->contact_id) {
                $this->triggerPipelineChangedAutomations($deal, $oldPipelineId, $targetPipelineId, $oldStageId, $source, $workflowName);
                // 2. Also trigger destination stage automations
                $this->triggerStageAutomations($deal, $oldStageId, $source, $workflowName);
            }

            return $deal->fresh(['stage', 'pipeline', 'contact', 'assignedUser']);
        });
    }

    public function triggerPipelineChangedAutomations(
        Deal $deal,
        int $oldPipelineId,
        int $newPipelineId,
        ?int $oldStageId = null,
        string $source = 'manual',
        ?string $workflowName = null
    ): void {
        try {
            $engine = app(\App\Modules\Automation\Services\AutomationEngine::class);
            $automations = \App\Modules\Automation\Models\Automation::where('workspace_id', $deal->workspace_id)
                ->whereIn('status', ['active', 'published'])
                ->get();

            foreach ($automations as $automation) {
                foreach ($engine->getAutomationTriggers($automation) as $tr) {
                    if ($tr['trigger_type'] !== 'opportunity.pipeline_changed') {
                        continue;
                    }
                    $config = $tr['trigger_config'] ?? [];

                    // From pipeline filter
                    if (! empty($config['from_pipeline_id']) && (int) $config['from_pipeline_id'] !== $oldPipelineId) {
                        continue;
                    }

                    // To / In pipeline filter
                    $targetPipeFilter = $config['to_pipeline_id'] ?? $config['pipeline_id'] ?? null;
                    if (! empty($targetPipeFilter) && (int) $targetPipeFilter !== $newPipelineId) {
                        continue;
                    }

                    // Target stage filter (optional)
                    if (! empty($config['stage_id']) && (int) $config['stage_id'] !== (int) $deal->stage_id) {
                        continue;
                    }

                    // Change source filter
                    $changeSource = $config['change_source'] ?? 'any';
                    if ($changeSource === 'manual' && $source !== 'manual') {
                        continue;
                    }
                    if ($changeSource === 'automation' && $source !== 'automation') {
                        continue;
                    }

                    // Standard field filters
                    if (! empty($config['assigned_user_id']) && (int) $config['assigned_user_id'] !== (int) $deal->assigned_user_id) {
                        continue;
                    }
                    if (! empty($config['min_lead_value']) && (float) $deal->monetary_value < (float) $config['min_lead_value']) {
                        continue;
                    }
                    if (! empty($config['priority']) && $config['priority'] !== 'all' && (string) $deal->priority !== (string) $config['priority']) {
                        continue;
                    }

                    $engine->triggerForContact($automation, (int) $deal->contact_id, [
                        'opportunity_id' => $deal->id,
                        'opportunity_name' => $deal->name,
                        'opportunity_value' => $deal->monetary_value,
                        'stage_id' => $deal->stage_id,
                        'stage_name' => $deal->stage?->name ?? '',
                        'old_stage_id' => $oldStageId,
                        'from_pipeline_id' => $oldPipelineId,
                        'to_pipeline_id' => $newPipelineId,
                        'pipeline_id' => $deal->pipeline_id,
                        'pipeline_name' => $deal->pipeline?->name ?? '',
                        'change_source' => $source,
                        'workflow_name' => $workflowName,
                        'trigger_name' => $tr['trigger_name'],
                        'trigger_type' => $tr['trigger_type'],
                        '_matched_trigger_id' => $tr['id'],
                    ]);
                    break;
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to trigger pipeline changed automation: '.$e->getMessage());
        }
    }

    public function triggerStatusAutomations(Deal $deal, string $oldStatus, string $newStatus): void
    {
        if ($oldStatus === $newStatus || empty($deal->contact_id)) {
            return;
        }

        try {
            $engine = app(\App\Modules\Automation\Services\AutomationEngine::class);
            $triggerTypes = ['opportunity.status_changed'];
            if ($newStatus === 'won') {
                $triggerTypes[] = 'opportunity.won';
            } elseif ($newStatus === 'lost') {
                $triggerTypes[] = 'opportunity.lost';
            } elseif ($newStatus === 'abandoned') {
                $triggerTypes[] = 'opportunity.abandoned';
            }

            $automations = \App\Modules\Automation\Models\Automation::where('workspace_id', $deal->workspace_id)
                ->whereIn('status', ['active', 'published'])
                ->get();

            foreach ($automations as $automation) {
                foreach ($engine->getAutomationTriggers($automation) as $tr) {
                    if (! in_array($tr['trigger_type'], $triggerTypes, true)) {
                        continue;
                    }
                    $config = $tr['trigger_config'] ?? [];
                    if (! empty($config['pipeline_id']) && (int) $config['pipeline_id'] !== (int) $deal->pipeline_id) {
                        continue;
                    }
                    if (! empty($config['status']) && $config['status'] !== $newStatus) {
                        continue;
                    }

                    $engine->triggerForContact($automation, (int) $deal->contact_id, [
                        'opportunity_id' => $deal->id,
                        'opportunity_name' => $deal->name,
                        'opportunity_value' => $deal->monetary_value,
                        'stage_id' => $deal->stage_id,
                        'pipeline_id' => $deal->pipeline_id,
                        'old_status' => $oldStatus,
                        'new_status' => $newStatus,
                        'lost_reason' => $deal->lost_reason,
                        'trigger_name' => $tr['trigger_name'],
                        'trigger_type' => $tr['trigger_type'],
                        '_matched_trigger_id' => $tr['id'],
                    ]);
                    break;
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to trigger opportunity status automation: '.$e->getMessage());
        }
    }
}
