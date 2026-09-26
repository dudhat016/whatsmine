import React, { useState } from 'react';
import PipelineColumn from './PipelineColumn';
import LostReasonModal from '../Builder/LostReasonModal';
import TransferPipelineModal from '../Builder/TransferPipelineModal';
import { Trophy, XCircle, Archive } from 'lucide-react';
import axios from 'axios';

export default function KanbanBoard({
    columns,
    setColumns,
    onEditDeal,
    onAddDeal,
    activePipelineId,
    statusFilter = 'open',
    onDealStatusUpdated,
    pipelines = [],
    users = [],
}) {
    const [draggedDealId, setDraggedDealId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOverStatusZone, setDragOverStatusZone] = useState(null);
    const [activeLostModal, setActiveLostModal] = useState(null);
    const [activeTransferModalDeal, setActiveTransferModalDeal] = useState(null);

    const handleDragStart = (e, dealId) => {
        e.dataTransfer.setData('text/plain', dealId.toString());
        setDraggedDealId(dealId);
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDraggedDealId(null);
        setDragOverStatusZone(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropColumn = async (e, targetStageId) => {
        e.preventDefault();
        const dealIdStr = e.dataTransfer.getData('text/plain') || draggedDealId;
        handleDragEnd();
        if (!dealIdStr) return;

        const dealId = parseInt(dealIdStr, 10);
        await moveDealToStage(dealId, targetStageId);
    };

    const handleDropCard = async (e, targetDealId) => {
        e.preventDefault();
        e.stopPropagation();

        const dealIdStr = e.dataTransfer.getData('text/plain') || draggedDealId;
        handleDragEnd();
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
        let sourceDeal = null;

        // Locate source deal
        columns.forEach((col) => {
            const found = col.deals.find((d) => d.id === dealId);
            if (found) {
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

        // Extract ordered deal IDs in target stage
        const targetCol = updatedColumns.find((c) => c.id === targetStageId);
        const orderedDealIds = targetCol ? targetCol.deals.map((d) => d.id) : [dealId];

        try {
            await axios.post(route('client.opportunities.deals.update-stage-and-priority'), {
                deal_id: dealId,
                target_stage_id: targetStageId,
                ordered_deal_ids_in_stage: orderedDealIds,
            });

            // If target stage is Lost or Abandoned, prompt user for reason
            const targetColObj = columns.find((c) => c.id === targetStageId);
            const colNameLower = (targetColObj?.name || '').toLowerCase();
            const isLostCol = colNameLower.includes('lost') || targetColObj?.probability === 0;
            const isAbandonedCol = colNameLower.includes('abandoned');
            const isWonCol = colNameLower.includes('won') || targetColObj?.probability === 100;

            if (isLostCol || isAbandonedCol) {
                setActiveLostModal({
                    deal: { ...sourceDeal, stage_id: targetStageId },
                    targetStatus: isLostCol ? 'lost' : 'abandoned',
                });
            } else if (isWonCol && sourceDeal.status !== 'won') {
                try {
                    await axios.post(route('client.opportunities.deals.update-status', dealId), {
                        status: 'won',
                    });
                    onDealStatusUpdated?.();
                } catch (e) {
                    console.error('Failed to mark deal status as won:', e);
                }
            }
        } catch (error) {
            console.error('Failed to update stage on server:', error);
        }
    };

    const handleStatusTrayDrop = async (e, targetStatus) => {
        e.preventDefault();
        e.stopPropagation();
        const dealIdStr = e.dataTransfer.getData('text/plain') || draggedDealId;
        handleDragEnd();

        if (!dealIdStr) return;
        const dealId = parseInt(dealIdStr, 10);

        let targetDeal = null;
        for (const col of columns) {
            const found = col.deals.find((d) => d.id === dealId);
            if (found) {
                targetDeal = found;
                break;
            }
        }
        if (!targetDeal) return;

        if (targetStatus === 'won') {
            // Optimistically remove or update deal if filtering by open
            if (statusFilter === 'open') {
                const updated = columns.map((col) => {
                    const filtered = col.deals.filter((d) => d.id !== dealId);
                    return {
                        ...col,
                        deals: filtered,
                        deals_count: filtered.length,
                        total_value: filtered.reduce((sum, d) => sum + (d.monetary_value || 0), 0),
                    };
                });
                setColumns(updated);
            }

            try {
                await axios.post(route('client.opportunities.deals.update-status', dealId), {
                    status: 'won',
                });
                onDealStatusUpdated?.();
            } catch (err) {
                console.error('Failed to mark deal as won:', err);
                onDealStatusUpdated?.();
            }
        } else {
            // Lost or Abandoned requires reason modal
            setActiveLostModal({
                deal: targetDeal,
                targetStatus,
            });
        }
    };

    return (
        <div className="relative">
            {/* Kanban Columns */}
            <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-230px)] custom-scrollbar">
                {columns.map((column) => (
                    <PipelineColumn
                        key={column.id}
                        column={column}
                        onEditDeal={onEditDeal}
                        onAddDeal={onAddDeal}
                        onTransferDeal={setActiveTransferModalDeal}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDropColumn={handleDropColumn}
                        onDropCard={handleDropCard}
                    />
                ))}
            </div>

            {/* Competitor-Style Floating Bottom Action Trays on Drag (GHL & Pipedrive Parity) */}
            {isDragging && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 animate-in fade-in slide-in-from-bottom-5 duration-200">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mr-1 hidden sm:inline">
                        Drop to Quick Status:
                    </span>

                    {/* Won Tray */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverStatusZone !== 'won') setDragOverStatusZone('won');
                        }}
                        onDragLeave={() => setDragOverStatusZone(null)}
                        onDrop={(e) => handleStatusTrayDrop(e, 'won')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl cursor-pointer border-2 border-dashed transition-all duration-150 ${
                            dragOverStatusZone === 'won'
                                ? 'bg-emerald-600 text-white border-emerald-500 scale-105 shadow-lg shadow-emerald-500/25'
                                : 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500'
                        }`}
                    >
                        <Trophy className={`h-5 w-5 ${dragOverStatusZone === 'won' ? 'animate-bounce' : ''}`} />
                        <div className="text-left">
                            <div className="text-xs font-bold leading-none">WON</div>
                            <div className="text-[10px] opacity-80 mt-0.5">Converted</div>
                        </div>
                    </div>

                    {/* Lost Tray */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverStatusZone !== 'lost') setDragOverStatusZone('lost');
                        }}
                        onDragLeave={() => setDragOverStatusZone(null)}
                        onDrop={(e) => handleStatusTrayDrop(e, 'lost')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl cursor-pointer border-2 border-dashed transition-all duration-150 ${
                            dragOverStatusZone === 'lost'
                                ? 'bg-rose-600 text-white border-rose-500 scale-105 shadow-lg shadow-rose-500/25'
                                : 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:border-rose-500'
                        }`}
                    >
                        <XCircle className={`h-5 w-5 ${dragOverStatusZone === 'lost' ? 'animate-bounce' : ''}`} />
                        <div className="text-left">
                            <div className="text-xs font-bold leading-none">LOST</div>
                            <div className="text-[10px] opacity-80 mt-0.5">With Reason</div>
                        </div>
                    </div>

                    {/* Abandoned Tray */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverStatusZone !== 'abandoned') setDragOverStatusZone('abandoned');
                        }}
                        onDragLeave={() => setDragOverStatusZone(null)}
                        onDrop={(e) => handleStatusTrayDrop(e, 'abandoned')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl cursor-pointer border-2 border-dashed transition-all duration-150 ${
                            dragOverStatusZone === 'abandoned'
                                ? 'bg-amber-600 text-white border-amber-500 scale-105 shadow-lg shadow-amber-500/25'
                                : 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:border-amber-500'
                        }`}
                    >
                        <Archive className={`h-5 w-5 ${dragOverStatusZone === 'abandoned' ? 'animate-bounce' : ''}`} />
                        <div className="text-left">
                            <div className="text-xs font-bold leading-none">ABANDONED</div>
                            <div className="text-[10px] opacity-80 mt-0.5">Cold / Stale</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lost / Abandoned Reason Modal */}
            {activeLostModal && (
                <LostReasonModal
                    isOpen={true}
                    deal={activeLostModal.deal}
                    targetStatus={activeLostModal.targetStatus}
                    onClose={() => setActiveLostModal(null)}
                    onSuccess={() => {
                        setActiveLostModal(null);
                        onDealStatusUpdated?.();
                    }}
                />
            )}

            {/* Transfer Pipeline Modal */}
            {activeTransferModalDeal && (
                <TransferPipelineModal
                    isOpen={true}
                    deal={activeTransferModalDeal}
                    pipelines={pipelines}
                    users={users}
                    onClose={() => setActiveTransferModalDeal(null)}
                    onSuccess={() => {
                        setActiveTransferModalDeal(null);
                        onDealStatusUpdated?.();
                    }}
                />
            )}
        </div>
    );
}
