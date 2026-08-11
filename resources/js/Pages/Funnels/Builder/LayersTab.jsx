import React from 'react';
import { FolderTree, Box, Columns, FileText } from 'lucide-react';

export default function LayersTab({ sections, selectedSectionId, setSelectedSectionId }) {
    const RenderLayerTreeItem = ({ item, depth = 0 }) => {
        if (!item || !item.id) return null;
        return (
            <div className="space-y-1">
                <div
                    style={{ paddingLeft: `${depth * 14 + 8}px` }}
                    onClick={() => setSelectedSectionId(item.id)}
                    className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                        selectedSectionId === item.id
                            ? 'bg-brand-50 border-brand-500 text-brand-600 font-bold'
                            : 'bg-white border-neutral-200 hover:bg-neutral-50'
                    }`}
                >
                    <div className="flex items-center gap-1.5 truncate">
                        {item.type === 'section' ? (
                            <Box className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                        ) : item.type.startsWith('col_') ? (
                            <Columns className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        ) : (
                            <FileText className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                        )}
                        <span className="truncate">{item.name || item.title || item.headline || item.type}</span>
                    </div>
                </div>

                {item.elements && item.elements.length > 0 && (
                    <div className="space-y-1">
                        {item.elements.map(child => (
                            <RenderLayerTreeItem key={child.id} item={child} depth={depth + 1} />
                        ))}
                    </div>
                )}

                {item.columns && item.columns.some(col => col && col.length > 0) && (
                    <div className="space-y-1">
                        {item.columns.map((col, cIdx) => (
                            col && col.length > 0 && (
                                <div key={cIdx} className="space-y-1">
                                    <div style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }} className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                                        Column #{cIdx + 1}
                                    </div>
                                    {col.map(colChild => (
                                        <RenderLayerTreeItem key={colChild.id} item={colChild} depth={depth + 2} />
                                    ))}
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-3 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <div className="flex items-center gap-1.5">
                    <FolderTree className="h-4 w-4 text-brand-600" />
                    <p className="text-xs font-bold text-neutral-900">Nested Layer Tree ({sections.length})</p>
                </div>
            </div>
            <div className="space-y-1">
                {sections.map(sec => (
                    <RenderLayerTreeItem key={sec.id} item={sec} depth={0} />
                ))}
            </div>
        </div>
    );
}
