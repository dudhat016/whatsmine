import { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import {
    Monitor,
    Smartphone,
    Plus,
} from 'lucide-react';
import FieldPreview from './FieldPreview';
import { BUILDER_CSS, SelectionToolbar } from '@/Components/VisualBuilder/InlineText';

function SortableField({
    field,
    isSelected,
    onSelect,
    onUpdateField,
    onDuplicateField,
    onDeleteField,
    isHalf = false,
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: field.id });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className={`relative ${isHalf ? 'flex-1 min-w-0' : 'w-full'}`}>
            <FieldPreview
                field={field}
                isSelected={isSelected}
                onClick={() => onSelect(field.id)}
                onUpdateField={onUpdateField}
                onDuplicate={onDuplicateField}
                onDelete={onDeleteField}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
            {isOver && !isDragging && (
                <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-emerald-500 rounded-full shadow-sm z-30 pointer-events-none animate-pulse" />
            )}
        </div>
    );
}

export default function FormCanvas({
    fields,
    formSettings,
    selectedFieldId,
    onSelectField,
    device,
    onDeviceChange,
    onFormSettingsChange,
    onUpdateField,
    onDuplicateField,
    onDeleteField,
    onAddField,
}) {
    const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop' });
    const canvasRef = useRef(null);
    const [insertIndex, setInsertIndex] = useState(null);

    const themeColor = formSettings.theme_color || '#25D366';

    // Group half-width fields into rows
    const rows = [];
    let i = 0;
    while (i < fields.length) {
        const f = fields[i];
        if (f.width === 'half' && fields[i + 1]?.width === 'half') {
            rows.push({ type: 'pair', fields: [f, fields[i + 1]], index: i });
            i += 2;
        } else {
            rows.push({ type: 'single', field: f, index: i });
            i++;
        }
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-neutral-100 dark:bg-neutral-950 overflow-y-auto">
            <style>{BUILDER_CSS}</style>
            <SelectionToolbar canvasRef={canvasRef} tokens={[]} />

            {/* Device toggle bar */}
            <div className="flex items-center justify-between px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10">
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => onDeviceChange('desktop')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                            device === 'desktop'
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                    >
                        <Monitor className="w-3.5 h-3.5" /> Desktop
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeviceChange('mobile')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                            device === 'mobile'
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                    >
                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                    </button>
                </div>

                <div className="text-xs text-neutral-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Visual Form Canvas</span>
                </div>
            </div>

            {/* Canvas area */}
            <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto">
                <div
                    style={{ width: '100%', maxWidth: device === 'mobile' ? '375px' : `${formSettings.card_max_width !== undefined && formSettings.card_max_width !== '' ? Number(formSettings.card_max_width) : 576}px` }}
                    className="transition-all duration-300"
                >
                    {/* Form card */}
                    <div
                        ref={(node) => {
                            setNodeRef(node);
                            canvasRef.current = node;
                        }}
                        data-vb-canvas=""
                        style={{ borderRadius: `${formSettings.card_border_radius !== undefined && formSettings.card_border_radius !== '' ? Number(formSettings.card_border_radius) : 16}px` }}
                        className={`bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all ${
                            isOver ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''
                        }`}
                    >
                        {/* Fields area */}
                        <div style={{ padding: `${formSettings.card_padding !== undefined && formSettings.card_padding !== '' ? Number(formSettings.card_padding) : 24}px`, paddingBottom: 0 }}>
                            {fields.length === 0 ? (
                                <div
                                    className={`flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed transition-all ${
                                        isOver
                                            ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                                            : 'border-neutral-300 dark:border-neutral-700'
                                    }`}
                                >
                                    <Plus className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-2" />
                                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Drag fields here</p>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">or click quick-add buttons below</p>
                                </div>
                            ) : (
                                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${formSettings.field_gap !== undefined && formSettings.field_gap !== '' ? Number(formSettings.field_gap) : 12}px` }}>
                                        {rows.map((row, rowIdx) => (
                                            <div key={rowIdx} className="relative group/fieldrow">
                                                {/* In-Between Insertion Line */}
                                                {rowIdx > 0 && onAddField && (
                                                    <div className="relative py-1 opacity-0 group-hover/fieldrow:opacity-100 transition-opacity z-20 flex items-center justify-center -mt-2 -mb-2">
                                                        <div className="absolute inset-x-0 h-0.5 bg-emerald-500" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onAddField('text', false);
                                                            }}
                                                            className="relative z-10 h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:scale-110 transition"
                                                            title="Insert field here"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}

                                                {row.type === 'pair' ? (
                                                    <div className="flex gap-2">
                                                        {row.fields.map((f) => (
                                                            <SortableField
                                                                key={f.id}
                                                                field={f}
                                                                isHalf={true}
                                                                isSelected={selectedFieldId === f.id}
                                                                onSelect={onSelectField}
                                                                onUpdateField={onUpdateField}
                                                                onDuplicateField={onDuplicateField}
                                                                onDeleteField={onDeleteField}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <SortableField
                                                        key={row.field.id}
                                                        field={row.field}
                                                        isSelected={selectedFieldId === row.field.id}
                                                        onSelect={onSelectField}
                                                        onUpdateField={onUpdateField}
                                                        onDuplicateField={onDuplicateField}
                                                        onDeleteField={onDeleteField}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </SortableContext>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
