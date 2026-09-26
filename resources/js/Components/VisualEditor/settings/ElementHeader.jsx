import React from 'react';
import { Layers, Trash2, Columns } from 'lucide-react';

/** Element name + delete button row at the top of the panel. */
export default function ElementHeader({
    element,
    handleDeleteSelectedElement
}) {
    const isColumn = element.type === 'grid_column';
    const elementName = element.name || (isColumn ? `Column #${(element.colIdx ?? 0) + 1}` : element.type?.replace(/_/g, ' ') || 'Element');

    return (
        <div className="space-y-2 pb-2 border-b border-neutral-200">
            {/* Top Row: Icon + Name + Type Badge + Delete */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${
                        isColumn ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-brand-50 border-brand-200 text-brand-600'
                    }`}>
                        {isColumn ? <Columns className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-xs text-neutral-900 capitalize truncate leading-tight">
                            {elementName}
                        </h3>
                        <span className="text-[10px] text-neutral-400 font-mono capitalize block leading-tight">
                            {element.type}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => handleDeleteSelectedElement(element.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                    title={isColumn ? "Reset Column Styles" : "Delete Element"}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}


