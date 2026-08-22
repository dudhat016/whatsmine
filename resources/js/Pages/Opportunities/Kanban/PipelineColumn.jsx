import React from 'react';
import OpportunityCard from './OpportunityCard';
import { Plus } from 'lucide-react';

export default function PipelineColumn({
    column,
    onEditDeal,
    onAddDeal,
    onDragStart,
    onDragOver,
    onDropColumn,
    onDropCard,
}) {
    return (
        <div
            onDragOver={onDragOver}
            onDrop={(e) => onDropColumn(e, column.id)}
            className="flex flex-col flex-shrink-0 w-80 max-h-full rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/60 p-3"
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-neutral-200/60 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                    <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: column.color || '#3b82f6' }}
                    />
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm truncate">
                        {column.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-200/80 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        {column.deals_count}
                    </span>
                </div>

                <button
                    onClick={() => onAddDeal(column.id)}
                    className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors"
                    title="Add Opportunity to Stage"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            {/* Column Valuation Summary */}
            <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-white/60 dark:bg-neutral-800/40 text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                <span>Total Value:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ${Number(column.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>

            {/* Cards List Container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar min-h-[150px]">
                {column.deals.map((deal) => (
                    <OpportunityCard
                        key={deal.id}
                        deal={deal}
                        onEdit={onEditDeal}
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDrop={onDropCard}
                    />
                ))}

                {column.deals.length === 0 && (
                    <div className="h-28 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-xs text-neutral-400">
                        No opportunities
                    </div>
                )}
            </div>
        </div>
    );
}
