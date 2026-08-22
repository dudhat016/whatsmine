import React, { useState } from 'react';
import PipelineColumn from './PipelineColumn';
import axios from 'axios';

export default function KanbanBoard({ columns, setColumns, onEditDeal, onAddDeal, activePipelineId }) {
    const [draggedDealId, setDraggedDealId] = useState(null);

    const handleDragStart = (e, dealId) => {
        e.dataTransfer.setData('text/plain', dealId.toString());
        setDraggedDealId(dealId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropColumn = async (e, targetStageId) => {
        e.preventDefault();
        const dealIdStr = e.dataTransfer.getData('text/plain') || draggedDealId;
        if (!dealIdStr) return;

        const dealId = parseInt(dealIdStr, 10);
        await moveDealToStage(dealId, targetStageId);
    };

    const handleDropCard = async (e, targetDealId) => {
        e.preventDefault();
        e.stopPropagation();

        const dealIdStr = e.dataTransfer.getData('text/plain') || draggedDealId;
        if (!dealIdStr) return;

        const dealId = parseInt(dealIdStr, 10);

        // Find target stage containing targetDealId
        let targetStageId = null;
        for (const col of columns) {
            if (col.deals.some((d) => d.id === targetDealId)) {
                targetStageId = col.id;
                break;
            }
        }

        if (targetStageId) {
            await moveDealToStage(dealId, targetStageId, targetDealId);
        }
    };

    const moveDealToStage = async (dealId, targetStageId, insertBeforeDealId = null) => {
        let sourceColumnIndex = -1;
        let sourceDeal = null;

        // Locate source deal
        columns.forEach((col, cIdx) => {
            const found = col.deals.find((d) => d.id === dealId);
            if (found) {
                sourceColumnIndex = cIdx;
                sourceDeal = found;
            }
        });

        if (!sourceDeal) return;

        // Optimistically update columns state locally
        const updatedColumns = columns.map((col) => {
            // Remove deal from source
            const filteredDeals = col.deals.filter((d) => d.id !== dealId);

            if (col.id === targetStageId) {
                let newDeals = [...filteredDeals];
                if (insertBeforeDealId) {
                    const idx = newDeals.findIndex((d) => d.id === insertBeforeDealId);
                    if (idx !== -1) {
                        newDeals.splice(idx, 0, { ...sourceDeal, stage_id: targetStageId });
                    } else {
                        newDeals.push({ ...sourceDeal, stage_id: targetStageId });
                    }
                } else {
                    newDeals.push({ ...sourceDeal, stage_id: targetStageId });
                }

                return {
                    ...col,
                    deals: newDeals,
                    deals_count: newDeals.length,
                    total_value: newDeals.reduce((sum, d) => sum + (d.monetary_value || 0), 0),
                };
            }

            return {
                ...col,
                deals: filteredDeals,
                deals_count: filteredDeals.length,
                total_value: filteredDeals.reduce((sum, d) => sum + (d.monetary_value || 0), 0),
            };
        });

        setColumns(updatedColumns);
        setDraggedDealId(null);

        // Extract ordered deal IDs in target stage
        const targetCol = updatedColumns.find((c) => c.id === targetStageId);
        const orderedDealIds = targetCol ? targetCol.deals.map((d) => d.id) : [dealId];

        try {
            await axios.post(route('client.opportunities.deals.update-stage-and-priority'), {
                deal_id: dealId,
                target_stage_id: targetStageId,
                ordered_deal_ids_in_stage: orderedDealIds,
            });
        } catch (error) {
            console.error('Failed to update stage on server:', error);
        }
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] custom-scrollbar">
            {columns.map((column) => (
                <PipelineColumn
                    key={column.id}
                    column={column}
                    onEditDeal={onEditDeal}
                    onAddDeal={onAddDeal}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDropColumn={handleDropColumn}
                    onDropCard={handleDropCard}
                />
            ))}
        </div>
    );
}
