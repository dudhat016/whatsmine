import React from 'react';
import { SectionTitle, PanelSelect, FieldLabel } from '../BuilderUI';
import ColorPickerInput from '../ColorPicker';

export default function ButtonPanel({ element, val, styleGuide, handleUpdateElementSetting }) {
    if (element.type !== 'submit_button') return null;
    const update = (key, value) => handleUpdateElementSetting(element.id, key, value);

    return (
        <div className="space-y-3 pt-3 border-t border-neutral-200">
            <SectionTitle>Button Actions & Style</SectionTitle>

            {/* Action / Type */}
            <div className="space-y-0.5">
                <FieldLabel>Button Action</FieldLabel>
                <PanelSelect value={val('btnType', 'submit')} onChange={e => update('btnType', e.target.value)}>
                    <option value="submit">Submit Form & Go Next Step</option>
                    <option value="url">Open External URL</option>
                    <option value="step">Go to Specific Step</option>
                </PanelSelect>
            </div>

            {val('btnType') === 'url' && (
                <div className="space-y-0.5">
                    <FieldLabel>Target URL</FieldLabel>
                    <input
                        type="text" value={val('targetUrl', '')} onChange={e => update('targetUrl', e.target.value)}
                        className="w-full rounded-soft border border-soft border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        placeholder="https://example.com/checkout"
                    />
                </div>
            )}

            {/* Size & Icon */}
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                    <FieldLabel>Button Size</FieldLabel>
                    <PanelSelect value={val('btnSize', 'md')} onChange={e => update('btnSize', e.target.value)}>
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="xl">Full / XL</option>
                    </PanelSelect>
                </div>
                <div className="space-y-0.5">
                    <FieldLabel>Icon</FieldLabel>
                    <PanelSelect value={val('btnIcon', 'none')} onChange={e => update('btnIcon', e.target.value)}>
                        <option value="none">No Icon</option>
                        <option value="arrow">Arrow (→)</option>
                        <option value="lock">Lock (🔒)</option>
                        <option value="lightning">Lightning (⚡)</option>
                        <option value="cart">Cart (🛒)</option>
                        <option value="download">Download (📥)</option>
                        <option value="star">Star (⭐)</option>
                        <option value="sparkles">Sparkles (✨)</option>
                        <option value="check">Check (✓)</option>
                    </PanelSelect>
                </div>
            </div>

            {val('btnIcon') !== 'none' && (
                <div className="space-y-0.5">
                    <FieldLabel>Icon Position</FieldLabel>
                    <PanelSelect value={val('btnIconPosition', 'right')} onChange={e => update('btnIconPosition', e.target.value)}>
                        <option value="right">Right Side</option>
                        <option value="left">Left Side</option>
                    </PanelSelect>
                </div>
            )}

            {/* Hover Effects */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Hover Effects</p>

                <div className="space-y-0.5">
                    <FieldLabel>Hover Background</FieldLabel>
                    <ColorPickerInput value={val('hoverBgColor', styleGuide?.btnHoverBgColor || '#b36443')}
                        onChange={v => update('hoverBgColor', v)} styleGuide={styleGuide} />
                </div>

                <div className="space-y-0.5">
                    <FieldLabel>Hover Text Color</FieldLabel>
                    <ColorPickerInput value={val('hoverTextColor', '#ffffff')}
                        onChange={v => update('hoverTextColor', v)} styleGuide={styleGuide} />
                </div>

                {[
                    { label: 'Hover Lift Y (px)',  key: 'hoverTransformY', default: -2 },
                    { label: 'Hover Shift X (px)', key: 'hoverTransformX', default: 0  },
                ].map(({ label, key, default: def }) => (
                    <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                            <span>{label}</span>
                            <span className="font-mono text-brand-600 font-bold">{val(key, def)}px</span>
                        </div>
                        <input type="range" min="-10" max="10" value={val(key, def)}
                            onChange={e => update(key, Number(e.target.value))}
                            className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
