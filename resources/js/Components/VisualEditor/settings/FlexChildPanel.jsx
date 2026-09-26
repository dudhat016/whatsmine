import React from 'react';
import { SectionTitle, PanelSelect, FieldLabel, PanelToggle, IconButtonGroup } from '../BuilderUI';
import { CONTAINER_TYPES } from '../constants';

export default function FlexChildPanel({ element, val, viewport, handleUpdateElementSetting, handleResetElementCategory }) {
    if (CONTAINER_TYPES.includes(element.type)) return null;

    const update = (key, value) => {
        if (element.type === 'submit_button') {
            if (key === 'widthMode') {
                handleUpdateElementSetting(element.id, { widthMode: value, btnWidthMode: value });
                return;
            }
            if (key === 'customWidth') {
                handleUpdateElementSetting(element.id, { customWidth: value, btnCustomWidth: value });
                return;
            }
            if (key === 'alignSelf') {
                const btnAlign = value === 'flex-start' ? 'left' : value === 'flex-end' ? 'right' : 'center';
                handleUpdateElementSetting(element.id, { alignSelf: value, btnAlign });
                return;
            }
        }
        handleUpdateElementSetting(element.id, key, value);
    };

    const widthMode = val('widthMode') || val('btnWidthMode', 'full');
    const customWidthVal = val('customWidth') || val('btnCustomWidth', 80);
    const alignSelfVal = val('alignSelf') || (val('btnAlign') === 'left' ? 'flex-start' : val('btnAlign') === 'right' ? 'flex-end' : val('btnAlign') === 'center' ? 'center' : 'auto');

    return (
        <div className="space-y-3">
            <SectionTitle
                onReset={() => handleResetElementCategory(element.id, 'flex_child')}
                resetTitle={`Reset Flex Child Settings for ${viewport}`}
            >
                Element Sizing & Flex Alignment
            </SectionTitle>

            {/* Width Mode (Full vs Fit Content vs Custom) */}
            <div className="space-y-1.5">
                <FieldLabel>Width Mode</FieldLabel>
                <div className="flex border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg gap-0.5">
                    {[
                        { key: 'full', label: 'Full (100%)' },
                        { key: 'auto', label: 'Fit Content' },
                        { key: 'custom', label: 'Custom' },
                    ].map(mode => (
                        <button
                            key={mode.key}
                            type="button"
                            onClick={() => update('widthMode', mode.key)}
                            className={`flex-1 py-1 text-[11px] font-bold rounded transition cursor-pointer ${
                                widthMode === mode.key
                                    ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-brand-400 shadow-2xs'
                                    : 'text-neutral-500 hover:text-neutral-900'
                            }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {widthMode === 'custom' && (
                <div className="space-y-1 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-500">Custom Width</span>
                        <span className="font-mono text-xs font-bold text-brand-600">{customWidthVal}%</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={customWidthVal}
                        onChange={e => update('customWidth', Number(e.target.value))}
                        className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full"
                    />
                </div>
            )}

            {/* Align Self */}
            <div className="space-y-0.5">
                <FieldLabel>Self Alignment (align-self)</FieldLabel>
                <IconButtonGroup
                    value={alignSelfVal}
                    onChange={v => update('alignSelf', v)}
                    cols={5}
                    options={[
                        { key: 'auto',       icon: '⚙', title: 'Auto (Inherit)' },
                        { key: 'flex-start', icon: '╞', title: 'Left (Start)' },
                        { key: 'center',     icon: '┼', title: 'Center' },
                        { key: 'flex-end',   icon: '╡', title: 'Right (End)' },
                        { key: 'stretch',    icon: '⧉', title: 'Stretch' },
                    ]}
                />
                <p className="text-[10px] text-neutral-500 italic mt-0.5">
                    Overrides container alignment for this specific element.
                </p>
            </div>

            {/* Push to Bottom of Column */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <div className="space-y-0.5">
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Push to Bottom</div>
                    <p className="text-[10px] text-neutral-500">Locks button to bottom of column / card (mt-auto)</p>
                </div>
                <PanelToggle
                    value={val('pushToBottom', false)}
                    onChange={v => update('pushToBottom', v)}
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                    <FieldLabel>Flex Grow</FieldLabel>
                    <PanelSelect value={val('flexGrow', 0)} onChange={e => update('flexGrow', Number(e.target.value))}>
                        <option value={0}>Fixed (Fit Content)</option>
                        <option value={1}>Grow (Fill Space)</option>
                    </PanelSelect>
                </div>
                <div className="space-y-0.5">
                    <FieldLabel>Display Order</FieldLabel>
                    <PanelSelect value={val('order', 0)} onChange={e => update('order', Number(e.target.value))}>
                        <option value={-1}>-1 (First)</option>
                        <option value={0}>0 (Normal)</option>
                        <option value={1}>1 (Last)</option>
                    </PanelSelect>
                </div>
            </div>
        </div>
    );
}
