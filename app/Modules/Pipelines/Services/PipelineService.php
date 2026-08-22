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
     * Update a deal's stage and card column priorities on drag and drop.
     */
    public function updateStageAndPriority(Deal $deal, int $targetStageId, array $orderedDealIdsInStage, ?int $userId = null): Deal
    {
        return DB::transaction(function () use ($deal, $targetStageId, $orderedDealIdsInStage, $userId) {
            $oldStageId = $deal->stage_id;
            $stageChanged = $oldStageId !== $targetStageId;

            $targetStage = PipelineStage::findOrFail($targetStageId);

            $deal->update([
                'stage_id' => $targetStageId,
                'pipeline_id' => $targetStage->pipeline_id,
            ]);

            if ($stageChanged) {
                DealHistory::create([
                    'deal_id' => $deal->id,
                    'event_type' => 'stage_change',
                    'stage_from_id' => $oldStageId,
                    'stage_to_id' => $targetStageId,
                    'user_id' => $userId,
                    'remarks' => 'Moved stage via Kanban board',
                ]);

                if ($deal->contact_id) {
                    $this->triggerStageAutomations($deal);
                }
            }

            // Update column priority for all deals in target stage
            foreach ($orderedDealIdsInStage as $priority => $dealId) {
                Deal::where('id', $dealId)->update(['column_priority' => $priority]);
            }

            return $deal->fresh();
        });
    }

    public function triggerStageAutomations(Deal $deal): void
    {
        try {
            $engine = app(\App\Modules\Automation\Services\AutomationEngine::class);
            $automations = \App\Modules\Automation\Models\Automation::where('workspace_id', $deal->workspace_id)
                ->where('status', 'active')
                ->whereIn('trigger_type', ['opportunity.stage_changed', 'opportunity.created'])
                ->get();

            foreach ($automations as $automation) {
                $config = $automation->trigger_config ?? [];
                if (! empty($config['pipeline_id']) && (int) $config['pipeline_id'] !== (int) $deal->pipeline_id) {
                    continue;
                }
                if (! empty($config['stage_id']) && (int) $config['stage_id'] !== (int) $deal->stage_id) {
                    continue;
                }

                $engine->triggerForContact($automation, (int) $deal->contact_id, [
                    'opportunity_id' => $deal->id,
                    'opportunity_name' => $deal->name,
                    'opportunity_value' => $deal->monetary_value,
                    'stage_id' => $deal->stage_id,
                    'pipeline_id' => $deal->pipeline_id,
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to trigger opportunity automation: '.$e->getMessage());
        }
    }
}
