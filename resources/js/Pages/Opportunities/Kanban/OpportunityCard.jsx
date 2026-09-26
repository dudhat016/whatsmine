import React from 'react';
import { User, Phone, Eye, GitBranch } from 'lucide-react';
import Badge from '@/Components/ui/Badge';

export default function OpportunityCard({ deal, onEdit, onTransfer, onDragStart, onDragEnd, onDragOver, onDrop }) {
    const statusVariantMap = {
        open: 'brand',
        won: 'success',
        lost: 'danger',
        abandoned: 'warning',
    };

    const contactName = deal.contact ? `${deal.contact.first_name ?? ''} ${deal.contact.last_name ?? ''}`.trim() : 'Unassigned Contact';

    const getDaysInStage = () => {
        const dateStr = deal.updated_at || deal.created_at;
        if (!dateStr) return 0;
        const diffMs = new Date() - new Date(dateStr);
        return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    };

    const daysInStage = getDaysInStage();

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, deal.id)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, deal.id)}
            onClick={() => onEdit(deal)}
            className="group relative cursor-grab active:cursor-grabbing rounded-soft bg-white p-3.5 shadow-soft border border-soft border-neutral-200 hover:border-brand-500 hover:shadow-soft-md transition-all duration-150 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-brand-500"
        >
            {/* Header Title & Badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {deal.name}
                </h4>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {onTransfer && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onTransfer(deal);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
                            title="Transfer to another pipeline"
                        >
                            <GitBranch className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {deal.status === 'open' && daysInStage >= 14 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800" title={`Rotting warning: In this stage for ${daysInStage} days without movement`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span>{daysInStage}d rotting</span>
                        </span>
                    )}
                    {deal.status === 'open' && daysInStage >= 7 && daysInStage < 14 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title={`Stale deal: In this stage for ${daysInStage} days`}>
                            <span>⏳ {daysInStage}d</span>
                        </span>
                    )}
                    <Badge variant={statusVariantMap[deal.status] || 'default'} size="sm">
                        {deal.status.toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* Contact Name & Details */}
            <div className="space-y-1 mb-2 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                    <User className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="truncate">{contactName || 'No Name'}</span>
                </div>
                {deal.contact?.phone_e164 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <Phone className="h-3 w-3" />
                        <span>{deal.contact.phone_e164}</span>
                    </div>
                )}
            </div>

            {/* Lost / Abandoned Reason if applicable */}
            {deal.status !== 'open' && deal.lost_reason && (
                <div className="mb-2 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 rounded px-2 py-1 border border-neutral-200/60 dark:border-neutral-800 truncate" title={deal.lost_reason}>
                    <span className="font-semibold text-neutral-600 dark:text-neutral-300">Reason: </span>
                    <span>{deal.lost_reason}</span>
                </div>
            )}

            {/* Opportunity Custom Fields / Qualifiers (GHL Feature) */}
            {deal.custom_fields && Object.keys(deal.custom_fields).length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1">
                    {Object.entries(deal.custom_fields).slice(0, 3).map(([key, val]) => (
                        <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 truncate max-w-full">
                            {key.replace('_', ' ')}: {String(val)}
                        </span>
                    ))}
                </div>
            )}

            {/* Value & Metadata */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400">$</span>
                    <span>{Number(deal.monetary_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* Assigned Agent Avatar / Watcher */}
                <div className="flex items-center gap-1">
                    {deal.deal_watcher && (
                        <div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[9px] font-bold" title={`Watcher: ${deal.deal_watcher.name}`}>
                            <Eye className="h-3 w-3" />
                        </div>
                    )}
                    {deal.assigned_user && (
                        <div className="h-5 w-5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-[10px] font-bold uppercase" title={`Agent: ${deal.assigned_user.name}`}>
                            {deal.assigned_user.name.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
