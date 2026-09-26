import React, { useState, useMemo } from 'react';
import { GripVertical, Plus, Bookmark, RefreshCw, Search, LayoutGrid, Box, Type, Image, MousePointerClick, ShoppingBag, Sliders, X, Sparkles, SlidersHorizontal, Filter } from 'lucide-react';
import { 
    ELEMENT_CATEGORIES, 
    ADMIN_BLOCK_TEMPLATES, 
    STEP_RECOMMENDED_ELEMENT_TYPES, 
    getRecommendedElementsForStep,
    isElementCompatibleWithStep,
    isAdminBlockCompatibleWithStep,
    getStepFilterRule
} from './constants';

export default function BlocksTab({
    blockSubTab,
    setBlockSubTab,
    mySavedBlocks,
    loadingSavedBlocks,
    handleDragStart,
    handleDragEnd,
    handleAddElement,
    handleAddAdminBlock,
    handleAddSavedBlock,
    activeStep = null,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterByStep, setFilterByStep] = useState(true);
    const draggedRef = React.useRef(false);

    const stepConfig = useMemo(() => {
        if (!activeStep?.type) return null;
        return STEP_RECOMMENDED_ELEMENT_TYPES[activeStep.type] || null;
    }, [activeStep?.type]);

    const activeStepRule = useMemo(() => {
        return getStepFilterRule(activeStep?.type);
    }, [activeStep?.type]);

    const stepLabel = activeStepRule?.label || stepConfig?.badge || activeStep?.name || 'Step';

    const recommendedElements = useMemo(() => {
        if (!activeStep?.type) return [];
        return getRecommendedElementsForStep(activeStep.type);
    }, [activeStep?.type]);

    const onCardDragStart = (e, item) => {
        draggedRef.current = true;
        handleDragStart(e, item);
    };

    const onCardDragEnd = (e) => {
        handleDragEnd(e);
        setTimeout(() => {
            draggedRef.current = false;
        }, 100);
    };

    const onCardClick = (item) => {
        if (draggedRef.current) return;
        handleAddElement(item);
    };

    const totalElementCount = useMemo(() => {
        return ELEMENT_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
    }, []);

    const filteredCategories = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return ELEMENT_CATEGORIES.map(cat => {
            let items = cat.items;
            // Step-contextual filtering when no search query and filtering enabled
            if (filterByStep && activeStep?.type && !q) {
                items = items.filter(item => isElementCompatibleWithStep(item.type, activeStep.type));
            }
            // User search query filtering
            if (q) {
                items = items.filter(item => 
                    item.name.toLowerCase().includes(q) || 
                    item.type.toLowerCase().includes(q) ||
                    (item.desc && item.desc.toLowerCase().includes(q))
                );
            }
            return {
                ...cat,
                items
            };
        }).filter(cat => cat.items.length > 0);
    }, [searchQuery, filterByStep, activeStep?.type]);

    const visibleElementCount = useMemo(() => {
        return filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);
    }, [filteredCategories]);

    const hiddenElementsCount = totalElementCount - visibleElementCount;

    const filteredAdminBlocks = useMemo(() => {
        let list = ADMIN_BLOCK_TEMPLATES;
        const q = searchQuery.toLowerCase().trim();
        if (filterByStep && activeStep?.type && !q) {
            list = list.filter(b => isAdminBlockCompatibleWithStep(b.id, activeStep.type));
        }
        if (q) {
            list = list.filter(b => 
                b.name.toLowerCase().includes(q) || 
                b.category.toLowerCase().includes(q)
            );
        }
        return list;
    }, [searchQuery, filterByStep, activeStep?.type]);

    return (
        <div className="p-3 space-y-3 select-none">
            {/* Top Sub-tab Switcher */}
            <div className="flex border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl gap-1">
                <button
                    type="button"
                    onClick={() => setBlockSubTab('elements')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                        blockSubTab === 'elements' ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                >
                    Elements
                </button>
                <button
                    type="button"
                    onClick={() => setBlockSubTab('admin_blocks')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                        blockSubTab === 'admin_blocks' ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                >
                    Templates
                </button>
                <button
                    type="button"
                    onClick={() => setBlockSubTab('my_blocks')}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                        blockSubTab === 'my_blocks' ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                >
                    Saved
                </button>
            </div>


            {/* Quick Search Bar */}
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search widgets & elements..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
            </div>

            {/* Step Contextual Filter Indicator & Toggle */}
            {activeStep?.type && !searchQuery.trim() && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[11px] transition bg-neutral-50 dark:bg-neutral-800/70 border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <SlidersHorizontal className={`h-3 w-3 shrink-0 ${filterByStep ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-400'}`} />
                        <span className="truncate text-neutral-700 dark:text-neutral-300 font-medium">
                            {filterByStep ? (
                                <>
                                    Filtered for <strong className="text-neutral-900 dark:text-white font-bold">{stepLabel}</strong>
                                    {hiddenElementsCount > 0 && blockSubTab === 'elements' && (
                                        <span className="ml-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-normal">
                                            ({hiddenElementsCount} hidden)
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span>Showing all elements</span>
                            )}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFilterByStep(prev => !prev)}
                        className={`shrink-0 ml-2 px-2 py-0.5 rounded-lg text-[10px] font-bold transition border ${
                            filterByStep
                                ? 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                : 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border-brand-300 dark:border-brand-700 hover:bg-brand-100'
                        }`}
                        title={filterByStep ? "Show all elements without step filtering" : `Filter elements for ${stepLabel}`}
                    >
                        {filterByStep ? 'Show All' : 'Filter by Step'}
                    </button>
                </div>
            )}

            {searchQuery.trim() && (
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 px-1">
                    Searching across all elements...
                </div>
            )}


            {/* 1. ELEMENTS SUB-TAB */}
            {blockSubTab === 'elements' && (
                <div className="space-y-4 pt-1">
                    {/* ── STEP-AWARE PINNED RECOMMENDATIONS ── */}
                    {recommendedElements.length > 0 && !searchQuery.trim() && (
                        <div className="space-y-2 p-2.5 rounded-xl bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-amber-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 shadow-2xs">
                            <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-amber-200/70 dark:border-amber-800/60">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                                        Recommended For Step
                                    </span>
                                </div>
                                {stepConfig?.badge && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                                        {stepConfig.badge}
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-amber-800 dark:text-amber-300/90 leading-tight">
                                Recommended conversion elements for <strong>{activeStep?.name || 'this step'}</strong>:
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-0.5">
                                {recommendedElements.map(item => (
                                    <div
                                        key={`rec_${item.id || item.type}`}
                                        draggable={true}
                                        onDragStart={(e) => onCardDragStart(e, item)}
                                        onDragEnd={onCardDragEnd}
                                        onClick={() => onCardClick(item)}
                                        className="group relative flex flex-col justify-between p-2 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-white dark:bg-neutral-900 hover:border-amber-500 hover:shadow-xs transition cursor-grab active:cursor-grabbing min-h-[58px]"
                                    >
                                        <div className="flex items-start gap-1.5 w-full">
                                            <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition shrink-0">
                                                <GripVertical className="h-3 w-3" />
                                            </div>
                                            <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-100 leading-tight">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-1 pl-6">
                                            + Add to Step
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredCategories.map(cat => (
                        <div key={cat.category} className="space-y-2">
                            <div className="flex items-center gap-1.5 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                                <cat.icon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                                <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">{cat.category}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {cat.items.map(item => (
                                    <div
                                        key={item.id}
                                        draggable={true}
                                        onDragStart={(e) => onCardDragStart(e, item)}
                                        onDragEnd={onCardDragEnd}
                                        onClick={() => onCardClick(item)}
                                        className="group relative flex flex-col justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition cursor-grab active:cursor-grabbing shadow-2xs hover:shadow-xs min-h-[58px]"
                                    >
                                        <div className="flex items-start gap-1.5 w-full">
                                            <div className="p-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 group-hover:bg-brand-600 group-hover:text-white transition shrink-0">
                                                <GripVertical className="h-3 w-3" />
                                            </div>
                                            <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-brand-700 dark:group-hover:text-brand-300 leading-tight">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1 pl-6">
                                            Drag to Canvas
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredCategories.length === 0 && (
                        <div className="py-8 text-center text-neutral-400">
                            <p className="text-xs">No elements match "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            )}

            {/* 2. ADMIN BLOCK TEMPLATES SUB-TAB */}
            {blockSubTab === 'admin_blocks' && (
                <div className="space-y-3 pt-1">
                    {filteredAdminBlocks.map(template => (
                        <div
                            key={template.id}
                            onClick={() => handleAddAdminBlock(template)}
                            className="group flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 cursor-pointer transition shadow-2xs"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 group-hover:scale-105 transition">
                                    <template.icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600">{template.name}</p>
                                    <p className="text-[10px] text-neutral-400">{template.category} Section</p>
                                </div>
                            </div>
                            {template.badge && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                    {template.badge}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 3. MY SAVED BLOCKS SUB-TAB */}
            {blockSubTab === 'my_blocks' && (
                <div className="space-y-3 pt-1">
                    {loadingSavedBlocks ? (
                        <div className="py-8 text-center text-neutral-400">
                            <RefreshCw className="h-5 w-5 mx-auto animate-spin text-brand-600 mb-2" />
                            <p className="text-xs font-medium">Loading saved blocks...</p>
                        </div>
                    ) : mySavedBlocks.length === 0 ? (
                        <div className="py-8 text-center text-neutral-400 space-y-2">
                            <Bookmark className="h-8 w-8 mx-auto text-neutral-300 dark:text-neutral-700" />
                            <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">No Saved Blocks Yet</p>
                            <p className="text-[11px] leading-relaxed max-w-[200px] mx-auto text-neutral-400">
                                Save custom sections to your library to reuse them instantly across all your funnels!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {mySavedBlocks.map(block => (
                                <div
                                    key={block.id}
                                    onClick={() => handleAddSavedBlock(block)}
                                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-brand-500 cursor-pointer transition shadow-2xs"
                                >
                                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{block.name}</p>
                                    <p className="text-[9px] text-neutral-400 mt-0.5">Click to insert saved block</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
