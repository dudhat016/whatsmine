import React from 'react';
import { SectionTitle, FieldLabel, PanelNumber } from '../BuilderUI';

export default function MotionPanel({ element, val, handleUpdateElementSetting }) {
    const update = (key, value) => handleUpdateElementSetting(element.id, key, value);

    return (
        <div className="space-y-3">
            {/* Hover Motion & Transforms */}
            <div className="space-y-3">
                <SectionTitle>Hover Motion & Transforms</SectionTitle>

                <div className="space-y-0.5">
                    <FieldLabel>Transform Shift</FieldLabel>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Move X (px)', key: 'hoverTransformX', def: 0 },
                            { label: 'Move Y (px)', key: 'hoverTransformY', def: 0 },
                            { label: 'Rotate (°)',  key: 'hoverRotate',     def: 0 },
                        ].map(({ label, key, def }) => (
                            <div key={key} className="space-y-0.5">
                                <span className="block text-[10px] font-semibold text-neutral-500">{label}</span>
                                <PanelNumber
                                    value={val(key, def)}
                                    placeholder="0"
                                    onChange={e => update(key, Number(e.target.value))}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                        <span>Hover Scale</span>
                        <span className="font-mono text-brand-600 font-bold">{val('hoverScale', 1)}x</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.02"
                        value={val('hoverScale', 1)}
                        onChange={e => update('hoverScale', Number(e.target.value))}
                        className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                        <span>Hover Opacity</span>
                        <span className="font-mono text-brand-600 font-bold">{Math.round((val('hoverOpacity', 1) !== '' ? Number(val('hoverOpacity', 1)) : 1) * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={val('hoverOpacity', 1)}
                        onChange={e => update('hoverOpacity', parseFloat(e.target.value))}
                        className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                    />
                </div>
            </div>
        </div>
    );
}
