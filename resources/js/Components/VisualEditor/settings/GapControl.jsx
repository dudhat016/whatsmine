import React from 'react';
import { Link as LinkIcon, Unlink } from 'lucide-react';
import { Input, Select } from '@/Components/ui';

/**
 * GapControl — reusable linked column/row gap input.
 * Used by both Flexbox and Grid layout sections.
 */
export default function GapControl({ val, elementId, handleUpdateElementSetting }) {
    const update = (patch) => handleUpdateElementSetting(elementId, patch);

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                <span>Gaps</span>
                <div className="w-16">
                    <Select
                        size="sm"
                        value={val('gapUnit', 'px')}
                        onChange={e => update({ gapUnit: e.target.value })}
                    >
                        <option value="px">px</option>
                        <option value="rem">rem</option>
                        <option value="%">%</option>
                    </Select>
                </div>
            </div>

            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                {/* Column gap */}
                <div className="flex-1 space-y-0.5 text-center">
                    <Input
                        size="sm"
                        type="number"
                        value={val('gapX', val('gap', 24))}
                        onChange={e => {
                            const num = parseFloat(e.target.value) || 0;
                            update(val('gapsLinked', true)
                                ? { gapX: num, gapY: num, gap: num }
                                : { gapX: num });
                        }}
                        className="text-center font-extrabold"
                    />
                    <span className="block text-[9px] font-semibold text-neutral-400 uppercase">Column</span>
                </div>

                {/* Row gap */}
                <div className="flex-1 space-y-0.5 text-center">
                    <Input
                        size="sm"
                        type="number"
                        value={val('gapY', val('gap', 24))}
                        onChange={e => {
                            const num = parseFloat(e.target.value) || 0;
                            update(val('gapsLinked', true)
                                ? { gapX: num, gapY: num, gap: num }
                                : { gapY: num });
                        }}
                        className="text-center font-extrabold"
                    />
                    <span className="block text-[9px] font-semibold text-neutral-400 uppercase">Row</span>
                </div>

                {/* Link/Unlink toggle */}
                <button
                    type="button"
                    onClick={() => {
                        const linked = !val('gapsLinked', true);
                        if (linked) {
                            const v = val('gapX', val('gap', 24));
                            update({ gapsLinked: linked, gapX: v, gapY: v, gap: v });
                        } else {
                            update({ gapsLinked: linked });
                        }
                    }}
                    className={`p-2 rounded border transition ${
                        val('gapsLinked', true)
                            ? 'bg-neutral-800 text-white border-neutral-800'
                            : 'bg-white text-neutral-400 border-neutral-300 hover:text-neutral-700'
                    }`}
                    title={val('gapsLinked', true) ? 'Unlink Column & Row Gaps' : 'Link Column & Row Gaps'}
                >
                    {val('gapsLinked', true) ? <LinkIcon className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
                </button>
            </div>
        </div>
    );
}
