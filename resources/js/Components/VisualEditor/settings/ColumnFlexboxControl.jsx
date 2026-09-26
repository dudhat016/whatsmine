import React from 'react';
import { FieldLabel, IconButtonGroup } from '../BuilderUI';

export default function ColumnFlexboxControl({ element, val, handleUpdateElementSetting }) {
    const update = (key, value) => handleUpdateElementSetting(element.id, key, value);

    const verticalAlign = val('verticalAlign', 'flex-start');
    const horizontalAlign = val('horizontalAlign', 'stretch');
    const gap = val('gap', 16);

    return (
        <div className="space-y-3 pt-1">
            {/* Vertical Content Distribution */}
            <div className="space-y-0.5">
                <FieldLabel>Vertical Content Distribution</FieldLabel>
                <IconButtonGroup
                    value={verticalAlign}
                    onChange={v => update('verticalAlign', v)}
                    cols={4}
                    options={[
                        { key: 'flex-start',    icon: '⊤', title: 'Top (Start)' },
                        { key: 'center',        icon: '┼', title: 'Center' },
                        { key: 'flex-end',      icon: '⊥', title: 'Bottom (End)' },
                        { key: 'space-between', icon: '↕', title: 'Space Between' },
                    ]}
                />
                <p className="text-[10px] text-neutral-500 italic mt-0.5">
                    {verticalAlign === 'space-between'
                        ? 'Pushes elements apart, keeping buttons/footers at the very bottom.'
                        : verticalAlign === 'center'
                        ? 'Centers elements vertically inside this column.'
                        : 'Standard top-aligned content.'}
                </p>
            </div>

            {/* Horizontal Content Alignment */}
            <div className="space-y-0.5">
                <FieldLabel>Horizontal Content Alignment</FieldLabel>
                <IconButtonGroup
                    value={horizontalAlign}
                    onChange={v => update('horizontalAlign', v)}
                    cols={4}
                    options={[
                        { key: 'stretch',    icon: '⧉', title: 'Stretch (Full Width)' },
                        { key: 'flex-start', icon: '╞', title: 'Left' },
                        { key: 'center',     icon: '┼', title: 'Center' },
                        { key: 'flex-end',   icon: '╡', title: 'Right' },
                    ]}
                />
                <p className="text-[10px] text-neutral-500 italic mt-0.5">
                    {horizontalAlign === 'center'
                        ? 'Centers all elements horizontally inside this column.'
                        : horizontalAlign === 'flex-start'
                        ? 'Aligns elements to the left edge of this column.'
                        : horizontalAlign === 'flex-end'
                        ? 'Aligns elements to the right edge of this column.'
                        : 'Elements stretch to fill the column width.'}
                </p>
            </div>

            {/* Element Gap */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <FieldLabel>Element Gap (px)</FieldLabel>
                    <span className="font-mono text-xs font-bold text-amber-600">{gap}px</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="64"
                    step="2"
                    value={gap}
                    onChange={e => update('gap', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full"
                />
            </div>
        </div>
    );
}
