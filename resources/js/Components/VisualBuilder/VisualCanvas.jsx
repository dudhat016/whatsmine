import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import {
    Copy,
    GripVertical,
    Plus,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react';
import BlockRenderer from './BlockRenderer';
import BlockPopover from './BlockPopover';
import BlockLibrary from './BlockLibrary';
import { BUILDER_CSS, SelectionToolbar } from './InlineText';
import { getDefaultBlock } from './types';

function SortableBlockItem({
    block,
    index,
    isSelected,
    isPopoverOpen,
    mode,
    onSelect,
    onTogglePopover,
    onClosePopover,
    onClone,
    onRemove,
    onUpdate,
    onInsertAbove,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 40 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group/block">
            {/* In-Between Insertion Line & Green (+) Button */}
            {index > 0 && (
                <div className="relative py-1.5 opacity-0 hover:opacity-100 transition-opacity z-20 flex items-center justify-center -mt-3 -mb-3">
                    <div className="absolute inset-x-0 h-0.5 bg-emerald-500" />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onInsertAbove(index);
                        }}
                        className="relative z-10 h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:scale-110 transition"
                        title="Insert element here"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Block Box with Green Bounding Outline */}
            <div
                data-vb-block={block.type}
                onClick={onSelect}
                className={`relative rounded-lg p-2.5 transition-all ${
                    isSelected || isPopoverOpen
                        ? 'border-2 border-emerald-600 bg-emerald-50/5 dark:bg-emerald-950/10'
                        : 'border-2 border-transparent hover:border-emerald-600/70'
                }`}
            >
                {/* ── Top-Right Floating Action Pill Bar ── */}
                <div
                    className={`absolute right-3 -top-3 z-30 flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-0.5 shadow-md transition-all ${
                        isSelected || isPopoverOpen ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100'
                    }`}
                >
                    {/* Drag Handle with dnd-kit attributes and listeners */}
                    <div
                        {...attributes}
                        {...listeners}
                        title="Drag to reorder block"
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-3.5 w-3.5" />
                    </div>

                    <button
                        type="button"
                        title="Settings"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePopover();
                        }}
                        className={`p-1 rounded transition ${
                            isPopoverOpen
                                ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold'
                                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }`}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                    </button>

                    <button
                        type="button"
                        title="Duplicate"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClone(index);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition"
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </button>

                    <button
                        type="button"
                        title="Delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(index);
                        }}
                        className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Contextual Popover Anchored to Block */}
                {isPopoverOpen && (
                    <BlockPopover
                        block={block}
                        isOpen={isPopoverOpen}
                        mode={mode}
                        onClose={onClosePopover}
                        onChange={onUpdate}
                    />
                )}

                <BlockRenderer
                    block={block}
                    mode={mode}
                    isSelected={isSelected}
                    onChange={onUpdate}
                    onOpenSettings={onTogglePopover}
                />
            </div>
        </div>
    );
}

export default function VisualCanvas({
    blocks = [],
    onChange,
    mode = 'email',
    tokens = [],
    className = '',
}) {
    const { t } = useTranslation();
    const canvasRef = useRef(null);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [activePopoverId, setActivePopoverId] = useState(null);
    const [insertIndex, setInsertIndex] = useState(null);
    const [activeDragId, setActiveDragId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 4,
            },
        })
    );

    function updateBlock(index, next) {
        const copy = [...blocks];
        copy[index] = next;
        onChange(copy);
    }

    function removeBlock(index) {
        const target = blocks[index];
        const copy = blocks.filter((_, i) => i !== index);
        onChange(copy);
        if (selectedBlockId === target?.id) setSelectedBlockId(null);
        if (activePopoverId === target?.id) setActivePopoverId(null);
    }

    function cloneBlock(index) {
        const orig = blocks[index];
        const next = { ...orig, id: Math.random().toString(36).slice(2, 9) };
        const copy = [...blocks];
        copy.splice(index + 1, 0, next);
        onChange(copy);
        setSelectedBlockId(next.id);
    }

    function handleAddBlock(type, targetIdx = null) {
        const newBlock = getDefaultBlock(type);
        if (targetIdx !== null && targetIdx !== undefined) {
            const copy = [...blocks];
            copy.splice(targetIdx, 0, newBlock);
            onChange(copy);
            setInsertIndex(null);
        } else {
            onChange([...blocks, newBlock]);
        }
        setSelectedBlockId(newBlock.id);
    }

    function handleDragStart(event) {
        setActiveDragId(event.active.id);
        setActivePopoverId(null);
    }

    function handleDragEnd(event) {
        const { active, over } = event;
        setActiveDragId(null);

        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                onChange(arrayMove(blocks, oldIndex, newIndex));
            }
        }
    }

    function handleDragCancel() {
        setActiveDragId(null);
    }

    const activeDraggingBlock = blocks.find((b) => b.id === activeDragId);
    const maxWidthCls = mode === 'email' ? 'max-w-[640px]' : mode === 'form' ? 'max-w-[540px]' : 'max-w-[880px]';

    return (
        <div className={`relative flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-950/60 ${className}`}>
            <style>{BUILDER_CSS}</style>
            <SelectionToolbar canvasRef={canvasRef} tokens={tokens} />

            {/* ── Block Library Top Dashed Pill Tray ── */}
            <BlockLibrary
                mode={mode}
                onAddBlock={(type) => handleAddBlock(type, insertIndex)}
            />

            {/* ── Canvas Area ── */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 min-h-[460px]">
                <div
                    ref={canvasRef}
                    data-vb-canvas=""
                    className={`mx-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm transition-all ${maxWidthCls}`}
                >
                    {blocks.length === 0 ? (
                        <div className="py-20 text-center text-neutral-400">
                            <p className="text-sm font-medium">{t('common.empty_canvas', 'Canvas is empty. Add a block above to get started.')}</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragCancel={handleDragCancel}
                        >
                            <SortableContext
                                items={blocks.map((b) => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4">
                                    {blocks.map((b, i) => (
                                        <SortableBlockItem
                                            key={b.id}
                                            block={b}
                                            index={i}
                                            isSelected={selectedBlockId === b.id}
                                            isPopoverOpen={activePopoverId === b.id}
                                            mode={mode}
                                            onSelect={() => setSelectedBlockId(b.id)}
                                            onTogglePopover={() => setActivePopoverId(activePopoverId === b.id ? null : b.id)}
                                            onClosePopover={() => setActivePopoverId(null)}
                                            onClone={cloneBlock}
                                            onRemove={removeBlock}
                                            onUpdate={(updated) => updateBlock(i, updated)}
                                            onInsertAbove={(idx) => setInsertIndex(idx)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>

                            <DragOverlay dropAnimation={null}>
                                {activeDraggingBlock ? (
                                    <div className="rounded-lg border-2 border-emerald-600 bg-white dark:bg-neutral-900 p-3 shadow-2xl opacity-90 cursor-grabbing">
                                        <BlockRenderer
                                            block={activeDraggingBlock}
                                            mode={mode}
                                            isSelected={true}
                                            onChange={() => {}}
                                        />
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    )}
                </div>
            </div>
        </div>
    );
}
