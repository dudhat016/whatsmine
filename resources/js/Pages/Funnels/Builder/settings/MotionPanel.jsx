import React from 'react';
import { SectionTitle, PanelNumber, FieldLabel } from '../BuilderUI';

export default function MotionPanel({ element, val, handleUpdateElementSetting }) {
    const update = (key, value) => handleUpdateElementSetting(element.id, key, value);

    return (
        <div className="space-y-3 pt-3 border-t border-neutral-200">
            <SectionTitle>Motion on Hover</SectionTitle>

            {/* Transform X / Y / Rotate */}
            <div className="space-y-0.5">
                <FieldLabel>Transform</FieldLabel>
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

            {/* Scale */}
            <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                    <span>Scale</span>
                    <span className="font-mono text-brand-600 font-bold">{val('hoverScale', 1)}</span>
                </div>
                <input type="range" min="0.5" max="2" step="0.01" value={val('hoverScale', 1)}
                    onChange={e => update('hoverScale', Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-full" />
            </div>

            {/* Opacity */}
            <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                    <span>Opacity (%)</span>
                    <span className="font-mono text-brand-600 font-bold">{val('hoverOpacity', 100)}</span>
                </div>
                <input type="range" min="0" max="100" value={val('hoverOpacity', 100)}
                    onChange={e => update('hoverOpacity', Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-full" />
            </div>

            {/* Transition Duration */}
            <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                    <span>Transition (ms)</span>
                    <span className="font-mono text-brand-600 font-bold">{val('transitionDuration', 300)}ms</span>
                </div>
                <input type="range" min="0" max="2000" step="50" value={val('transitionDuration', 300)}
                    onChange={e => update('transitionDuration', Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-full" />
            </div>
        </div>
    );
}
