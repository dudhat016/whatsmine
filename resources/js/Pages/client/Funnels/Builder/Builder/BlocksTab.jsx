import React from 'react';
import { GripVertical, Plus, Bookmark, RefreshCw } from 'lucide-react';
import { ELEMENT_CATEGORIES, ADMIN_BLOCK_TEMPLATES } from './constants';

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
}) {
    return (
        <div className="p-3 space-y-3">
            <div className="flex border border-neutral-200 bg-neutral-100 p-1 rounded-lg gap-1">
                <button
                    type="button"
                    onClick={() => setBlockSubTab('elements')}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md ${
                        blockSubTab === 'elements' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500'
                    }`}
                >
                    1. Elements
                </button>
                <button
                    type="button"
                    onClick={() => setBlockSubTab('my_blocks')}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md ${
                        blockSubTab === 'my_blocks' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500'
                    }`}
                >
                    2. My Block
                </button>
                <button
                    type="button"
                    onClick={() => setBlockSubTab('admin_blocks')}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md ${
                        blockSubTab === 'admin_blocks' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500'
                    }`}
                >
                    3. Block
                </button>
            </div>

            {/* 1. ELEMENTS SUB-TAB */}
            {blockSubTab === 'elements' && (
                <div className="space-y-4 pt-1">
                    {ELEMENT_CATEGORIES.map(cat => (
                        <div key={cat.category} className="space-y-2">
                            <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-1">
                                <cat.icon className="h-3.5 w-3.5 text-brand-600" />
                                <span className="text-xs font-bold text-neutral-800">{cat.category}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {cat.items.map(item => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleAddElement(item)}
                                        className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-neutral-200 bg-white text-center hover:border-brand-500 hover:bg-brand-50/50 transition cursor-grab active:cursor-grabbing shadow-sm"
                                    >
                                        <span className="text-xs font-medium text-neutral-900 truncate w-full flex items-center justify-center gap-1">
                                            <GripVertical className="h-3 w-3 text-neutral-300" /> {item.name}
                                        </span>
                                        <span className="text-[9px] text-neutral-400 mt-0.5">Drag or Click</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 2. MY BLOCKS SUB-TAB */}
            {blockSubTab === 'my_blocks' && (
                <div className="space-y-3 pt-1">
                    {loadingSavedBlocks ? (
                        <div className="py-8 text-center text-neutral-400">
                            <RefreshCw className="h-5 w-5 mx-auto animate-spin text-brand-600 mb-2" />
                            <p className="text-xs font-medium">Loading saved blocks...</p>
                        </div>
                    ) : mySavedBlocks.length === 0 ? (
                        <div className="py-8 text-center text-neutral-400 space-y-2">
                            <Bookmark className="h-8 w-8 mx-auto text-neutral-300" />
                            <p className="text-xs font-bold text-neutral-700">No Saved Blocks Yet</p>
                            <p className="text-[11px] leading-relaxed max-w-[200px] mx-auto">
                                Save custom sections to your library to reuse them instantly across all your funnels!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {mySavedBlocks.map(block => (
                                <div
                                    key={block.id}
                                    onClick={() => handleAddSavedBlock(block)}
                                    className="p-3 rounded-lg border border-neutral-200 bg-white hover:border-brand-500 hover:bg-brand-50/40 transition cursor-pointer shadow-sm flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Bookmark className="h-4 w-4 text-brand-600 shrink-0" />
                                        <span className="text-xs font-bold text-neutral-800 truncate">{block.name}</span>
                                    </div>
                                    <Plus className="h-4 w-4 text-neutral-400 shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 3. ADMIN BLOCKS SUB-TAB */}
            {blockSubTab === 'admin_blocks' && (
                <div className="space-y-3 pt-1">
                    <p className="text-[11px] text-neutral-500 font-medium">Pre-designed high-converting sections:</p>
                    <div className="space-y-2">
                        {ADMIN_BLOCK_TEMPLATES.map(tmpl => (
                            <div
                                key={tmpl.id}
                                onClick={() => handleAddAdminBlock(tmpl)}
                                className="p-3 rounded-lg border border-neutral-200 bg-white hover:border-brand-500 hover:bg-brand-50/40 transition cursor-pointer shadow-sm flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-2 rounded-lg bg-brand-50 text-brand-600 shrink-0">
                                        <tmpl.icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-bold text-neutral-800 truncate">{tmpl.name}</p>
                                            {tmpl.badge && (
                                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase shrink-0">
                                                    {tmpl.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-neutral-400">{tmpl.category}</p>
                                    </div>
                                </div>
                                <Plus className="h-4 w-4 text-neutral-400 group-hover:text-brand-600 shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
