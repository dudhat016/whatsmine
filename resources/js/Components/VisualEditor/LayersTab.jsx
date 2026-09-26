import React, { useState, useMemo } from 'react';
import {
    FolderTree, Box, Columns, FileText, Type, Image, MousePointerClick,
    Play, Star, Sparkles, LayoutTemplate, Clock, Music, CheckSquare,
    ShoppingBag, Code, Eye, EyeOff, Trash2, Copy, Search, ChevronDown,
    ChevronRight, X, Layers, Target, Minus
} from 'lucide-react';

const getElementIcon = (type) => {
    if (type === 'section') return Box;
    if (['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(type)) return Columns;
    if (type === 'flex_container') return LayoutTemplate;
    if (['headline', 'subheadline'].includes(type)) return Type;
    if (type === 'divider') return Minus;
    if (['paragraph', 'quote', 'rich_text', 'bullets'].includes(type)) return FileText;
    if (type === 'image') return Image;
    if (type === 'video') return Play;
    if (type === 'submit_button') return MousePointerClick;
    if (['checkout_2step', 'order_bump', 'upsell_box', 'pricing_table'].includes(type)) return ShoppingBag;
    if (['input_email', 'input_name', 'input_phone', 'checkbox', 'date_picker', 'signature_pad'].includes(type)) return CheckSquare;
    if (type === 'timer') return Clock;
    if (type === 'audio') return Music;
    if (type === 'star_rating') return Star;
    if (type === 'custom_code') return Code;
    return Sparkles;
};

export default function LayersTab({
    sections,
    selectedSectionId,
    setSelectedSectionId,
    setSidebarTab,
    setBlockSubTab,
    handleDuplicateSelectedElement,
    handleDeleteSelectedElement,
    handleUpdateElementSetting,
    hoveredElementId,
    setHoveredElementId,
    onClose,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedIds, setCollapsedIds] = useState({});

    const toggleCollapse = (id, e) => {
        e.stopPropagation();
        setCollapsedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelectNode = (id) => {
        setSelectedSectionId(id);
        if (setSidebarTab) {
            setSidebarTab('settings');
        }
    };

    const countAllElements = (items) => {
        let count = 0;
        items.forEach(item => {
            count++;
            if (item.elements && item.elements.length > 0) count += countAllElements(item.elements);
            const isGrid = ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type) || (item.type === 'section' && item.layoutMode === 'grid');
            if (isGrid && item.columns && item.columns.length > 0) {
                const colsCount = item.colsCount || (
                    item.type === 'col_1' ? 1 :
                    item.type === 'col_2' || item.type === 'col_sidebar' ? 2 :
                    item.type === 'col_3' ? 3 :
                    item.type === 'col_4' ? 4 :
                    (item.columns?.length || 2)
                );
                item.columns.slice(0, colsCount).forEach(col => {
                    if (Array.isArray(col)) count += countAllElements(col);
                });
            }
        });
        return count;
    };

    const totalCount = useMemo(() => countAllElements(sections), [sections]);

    const RenderLayerTreeItem = ({ item, depth = 0 }) => {
        if (!item || !item.id) return null;

        const isSelected = selectedSectionId === item.id;
        const isHovered = hoveredElementId === item.id;
        const isGridContainer = ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type) || (item.type === 'section' && item.layoutMode === 'grid');
        const Icon = (item.type === 'section' && item.layoutMode === 'grid') ? Columns : getElementIcon(item.type);
        const hasChildren = (item.elements && item.elements.length > 0) || (isGridContainer && Array.isArray(item.columns) && item.columns.length > 0);
        const isCollapsed = !!collapsedIds[item.id];
        const isHidden = item.visibleDesktop === false && item.visibleMobile === false;

        const label = (item.type === 'section' && item.layoutMode === 'grid')
            ? `${item.name || item.title || 'Section'} (${item.colsCount || item.columns?.length || 2} Cols Grid)`
            : (item.name || item.title || item.headline || item.content || item.type);
        const matchesSearch = !searchQuery.trim() || label.toLowerCase().includes(searchQuery.toLowerCase().trim()) || item.type.toLowerCase().includes(searchQuery.toLowerCase().trim());

        if (searchQuery.trim() && !matchesSearch && !hasChildren) {
            return null;
        }

        return (
            <div className="space-y-0.5">
                <div
                    onClick={() => handleSelectNode(item.id)}
                    onMouseEnter={() => setHoveredElementId && setHoveredElementId(item.id)}
                    onMouseLeave={() => setHoveredElementId && setHoveredElementId(null)}
                    style={{ paddingLeft: `${depth * 12 + 6}px` }}
                    className={`group/layer flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition select-none ${
                        isSelected
                            ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold border border-brand-300 dark:border-brand-700 shadow-2xs'
                            : isHovered
                            ? 'bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent'
                    } ${isHidden ? 'opacity-50' : ''}`}
                >
                    <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={(e) => toggleCollapse(item.id, e)}
                                className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded shrink-0 transition"
                            >
                                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                        ) : (
                            <span className="w-4 shrink-0" />
                        )}

                        <Icon className={`h-3.5 w-3.5 shrink-0 ${
                            item.type === 'section' ? 'text-brand-600 dark:text-brand-400' :
                            ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type) ? 'text-amber-500' :
                            item.type === 'flex_container' ? 'text-indigo-500' :
                            'text-neutral-400 dark:text-neutral-500'
                        }`} />

                        <span className="truncate text-[11px] font-medium leading-tight">
                            {label}
                        </span>
                    </div>

                    {/* Quick action buttons on hover */}
                    <div className={`flex items-center gap-0.5 shrink-0 transition ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/layer:opacity-100'}`}>
                        {handleUpdateElementSetting && (
                            <button
                                type="button"
                                title={item.visibleDesktop === false ? 'Hidden on Desktop' : 'Visible on Desktop'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateElementSetting(item.id, 'visibleDesktop', item.visibleDesktop === false ? true : false);
                                }}
                                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-700"
                            >
                                {item.visibleDesktop === false ? <EyeOff className="h-3 w-3 text-red-500" /> : <Eye className="h-3 w-3" />}
                            </button>
                        )}

                        {handleDuplicateSelectedElement && (
                            <button
                                type="button"
                                title="Duplicate"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateSelectedElement(item.id);
                                }}
                                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-700"
                            >
                                <Copy className="h-3 w-3" />
                            </button>
                        )}

                        {handleDeleteSelectedElement && (
                            <button
                                type="button"
                                title="Delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSelectedElement(item.id);
                                }}
                                className="p-1 text-neutral-400 hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Children / Nested elements */}
                {!isCollapsed && item.elements && item.elements.length > 0 && (
                    <div className="space-y-0.5 border-l border-neutral-200/60 dark:border-neutral-800 ml-3">
                        {item.elements.map(child => (
                            <RenderLayerTreeItem key={child.id} item={child} depth={depth + 1} />
                        ))}
                    </div>
                )}

                {/* Grid Columns - ONLY for actual grid containers */}
                {!isCollapsed && isGridContainer && Array.isArray(item.columns) && (
                    <div className="space-y-0.5 border-l border-amber-200/60 dark:border-amber-900/40 ml-3">
                        {(() => {
                            const colsCount = item.colsCount || (
                                item.type === 'col_1' ? 1 :
                                item.type === 'col_2' || item.type === 'col_sidebar' ? 2 :
                                item.type === 'col_3' ? 3 :
                                item.type === 'col_4' ? 4 :
                                (item.columns?.length || 2)
                            );
                            return [...Array(colsCount)].map((_, cIdx) => {
                                const col = item.columns[cIdx] || [];
                                const colId = `${item.id}_col_${cIdx}`;
                                const isColSelected = selectedSectionId === colId;
                                return (
                                    <div key={cIdx} className="space-y-0.5">
                                        <div
                                            style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSectionId(colId);
                                                if (setSidebarTab) setSidebarTab('settings');
                                            }}
                                            className={`flex items-center justify-between py-1 pr-2 rounded-md text-[11px] font-medium transition cursor-pointer ${
                                                isColSelected
                                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700 shadow-2xs'
                                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-amber-600 hover:bg-amber-50/60 dark:hover:bg-amber-950/30'
                                            }`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <Columns className={`h-3 w-3 shrink-0 ${isColSelected ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500'}`} />
                                                <span>Col #{cIdx + 1}</span>
                                                <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono font-normal ${
                                                    isColSelected
                                                        ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                                                }`}>
                                                    {col.length}
                                                </span>
                                            </span>
                                            {isColSelected && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        {col.map(colChild => (
                                            <RenderLayerTreeItem key={colChild.id} item={colChild} depth={depth + 2} />
                                        ))}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 w-80 shrink-0 select-none overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-neutral-50 dark:bg-neutral-950">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300">
                        <FolderTree className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Layers Tree</h3>
                        <p className="text-[10px] text-neutral-400">{totalCount} nested elements</p>
                    </div>
                </div>

                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition"
                        title="Close Layers Panel"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Search Filter */}
            <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search layer tree..."
                        className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                </div>
            </div>

            {/* Tree list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sections.length === 0 ? (
                    <div className="py-12 text-center text-neutral-400 space-y-2">
                        <Layers className="h-8 w-8 mx-auto text-neutral-300 dark:text-neutral-700" />
                        <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">No Layers on Canvas</p>
                        <p className="text-[11px] text-neutral-400 px-4">
                            Add sections or widgets from the Blocks panel on the left to see the hierarchy tree here.
                        </p>
                    </div>
                ) : (
                    sections.map(sec => (
                        <RenderLayerTreeItem key={sec.id} item={sec} depth={0} />
                    ))
                )}
            </div>
        </div>
    );
}
