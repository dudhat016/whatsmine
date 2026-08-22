import React from 'react';
import { User, Phone, Eye } from 'lucide-react';
import Badge from '@/Components/ui/Badge';

export default function OpportunityCard({ deal, onEdit, onDragStart, onDragOver, onDrop }) {
    const statusVariantMap = {
        open: 'brand',
        won: 'success',
        lost: 'danger',
        abandoned: 'warning',
    };

    const contactName = deal.contact ? `${deal.contact.first_name ?? ''} ${deal.contact.last_name ?? ''}`.trim() : 'Unassigned Contact';

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, deal.id)}
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
                <Badge variant={statusVariantMap[deal.status] || 'default'} size="sm">
                    {deal.status.toUpperCase()}
                </Badge>
            </div>

            {/* Contact Name & Details */}
            <div className="space-y-1 mb-3 text-xs text-neutral-500 dark:text-neutral-400">
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
