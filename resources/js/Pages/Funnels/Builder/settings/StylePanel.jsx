import React, { useState } from 'react';
import { SectionTitle, PanelSelect, FieldLabel, PillGroup } from '../BuilderUI';
import ColorPickerInput from '../ColorPicker';
import { TabSwitcher, ShadowControl, BorderControl, FourSideInput } from '../StyleControls';
import GradientEditor from './GradientEditor';

const TEXT_TYPES = ['headline', 'subheadline', 'paragraph', 'quote', 'submit_button'];

export default function StylePanel({
    element, val, styleGuide, handleUpdateElementSetting, handleResetElementCategory,
}) {
    const [styleTab, setStyleTab] = useState('Normal');
    const update      = (key, value) => handleUpdateElementSetting(element.id, key, value);
    const updateBatch = (patch)      => handleUpdateElementSetting(element.id, patch);

    return (
        <div className="space-y-3 pt-3 border-t border-neutral-200">
            <SectionTitle
                onReset={() => {
                    handleResetElementCategory(element.id, 'color');
                    handleResetElementCategory(element.id, 'border');
                }}
                resetTitle="Reset Style"
            >
                Style
            </SectionTitle>

            <TabSwitcher tabs={['Normal', 'Hover']} active={styleTab} onChange={setStyleTab} />

            {styleTab === 'Normal' ? (
                <>
                    {/* Text Color */}
                    {TEXT_TYPES.includes(element.type) && (
                        <div className="space-y-0.5">
                            <FieldLabel>Text Color</FieldLabel>
                            <ColorPickerInput value={val('textColor', '#111827')} onChange={v => update('textColor', v)} styleGuide={styleGuide} />
                        </div>
                    )}

                    {/* Background type */}
                    <div className="space-y-1.5">
                        <FieldLabel>Background</FieldLabel>
                        <PillGroup
                            value={val('bgType', 'solid')}
                            onChange={v => update('bgType', v)}
                            options={[
                                { value: 'solid',    label: '● Solid' },
                                { value: 'gradient', label: '◑ Gradient' },
                                { value: 'image',    label: '⬜ Image' },
                            ]}
                        />

                        {val('bgType', 'solid') === 'solid' && (
                            <ColorPickerInput value={val('bgColor', '#ffffff')} onChange={v => update('bgColor', v)} styleGuide={styleGuide} />
                        )}

                        {val('bgType') === 'gradient' && (
                            <GradientEditor val={val} elementId={element.id} handleUpdateElementSetting={handleUpdateElementSetting} styleGuide={styleGuide} />
                        )}

                        {val('bgType') === 'image' && (
                            <div className="space-y-2 p-2.5 rounded-soft bg-neutral-50 border border-soft border-neutral-200">
                                <div className="space-y-0.5">
                                    <FieldLabel>Image URL</FieldLabel>
                                    <input type="text" value={val('bgImage', '')} onChange={e => update('bgImage', e.target.value)}
                                        className="w-full rounded-soft border border-soft border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                        placeholder="https://example.com/image.jpg" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-0.5">
                                        <FieldLabel>Size</FieldLabel>
                                        <PanelSelect value={val('bgSize', 'cover')} onChange={e => update('bgSize', e.target.value)}>
                                            <option value="cover">Cover</option>
                                            <option value="contain">Contain</option>
                                            <option value="auto">Auto</option>
                                            <option value="100% 100%">Stretch</option>
                                        </PanelSelect>
                                    </div>
                                    <div className="space-y-0.5">
                                        <FieldLabel>Position</FieldLabel>
                                        <PanelSelect value={val('bgPosition', 'center center')} onChange={e => update('bgPosition', e.target.value)}>
                                            <option value="center center">Center</option>
                                            <option value="top center">Top Center</option>
                                            <option value="bottom center">Bottom Center</option>
                                            <option value="left center">Left</option>
                                            <option value="right center">Right</option>
                                        </PanelSelect>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <FieldLabel>Repeat</FieldLabel>
                                    <PanelSelect value={val('bgRepeat', 'no-repeat')} onChange={e => update('bgRepeat', e.target.value)}>
                                        <option value="no-repeat">No Repeat</option>
                                        <option value="repeat">Repeat (Tile)</option>
                                        <option value="repeat-x">Repeat Horizontal</option>
                                        <option value="repeat-y">Repeat Vertical</option>
                                    </PanelSelect>
                                </div>
                                <div className="space-y-0.5">
                                    <FieldLabel>Overlay Color</FieldLabel>
                                    <ColorPickerInput value={val('bgOverlay', '')} onChange={v => update('bgOverlay', v)} styleGuide={styleGuide} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Shadow */}
                    <ShadowControl
                        label="Box Shadow"
                        value={{ color: val('shadowColor', 'rgba(0,0,0,0.15)'), h: val('shadowH', 0), v: val('shadowV', 8), blur: val('shadowBlur', 24), spread: val('shadowSpread', 0) }}
                        onChange={s => updateBatch({ shadowColor: s.color, shadowH: s.h, shadowV: s.v, shadowBlur: s.blur, shadowSpread: s.spread })}
                        styleGuide={styleGuide}
                    />

                    {/* Border */}
                    <BorderControl
                        label="Border"
                        value={{ type: val('borderStyle', 'Default'), width: val('borderWidth', 1), widthUnit: 'px', color: val('borderColor', '#d1d5db') }}
                        onChange={b => updateBatch({
                            ...(b.type  !== undefined && { borderStyle: b.type === 'Default' ? 'none' : b.type }),
                            ...(b.width !== undefined && { borderWidth: b.width }),
                            ...(b.color !== undefined && { borderColor: b.color }),
                        })}
                        styleGuide={styleGuide}
                    />

                    {/* Corner Radius */}
                    <FourSideInput
                        label="Corner Radius"
                        top={val('borderRadiusTL', val('borderRadius', 0))}
                        right={val('borderRadiusTR', val('borderRadius', 0))}
                        bottom={val('borderRadiusBL', val('borderRadius', 0))}
                        left={val('borderRadiusBR', val('borderRadius', 0))}
                        unit={val('borderRadiusUnit', 'px')}
                        units={['px', 'em', 'rem', '%']}
                        onUnitChange={u => update('borderRadiusUnit', u)}
                        onChange={s => updateBatch({ borderRadiusTL: s.top, borderRadiusTR: s.right, borderRadiusBL: s.bottom, borderRadiusBR: s.left, borderRadius: s.top })}
                    />
                </>
            ) : (
                <>
                    {TEXT_TYPES.includes(element.type) && (
                        <div className="space-y-0.5">
                            <FieldLabel>Text Color</FieldLabel>
                            <ColorPickerInput value={val('hoverTextColor', '#000000')} onChange={v => update('hoverTextColor', v)} styleGuide={styleGuide} />
                        </div>
                    )}
                    <div className="space-y-0.5">
                        <FieldLabel>Background Color</FieldLabel>
                        <ColorPickerInput value={val('hoverBgColor', '#ffffff')} onChange={v => update('hoverBgColor', v)} styleGuide={styleGuide} />
                    </div>
                    <ShadowControl
                        label="Box Shadow"
                        value={{ color: val('hoverShadowColor', 'rgba(0,0,0,0.15)'), h: val('hoverShadowH', 0), v: val('hoverShadowV', 8), blur: val('hoverShadowBlur', 24), spread: val('hoverShadowSpread', 0) }}
                        onChange={s => updateBatch({ hoverShadowColor: s.color, hoverShadowH: s.h, hoverShadowV: s.v, hoverShadowBlur: s.blur, hoverShadowSpread: s.spread })}
                        styleGuide={styleGuide}
                    />
                    <BorderControl
                        label="Border"
                        value={{ type: val('hoverBorderStyle', 'Default'), width: val('hoverBorderWidth', 1), widthUnit: 'px', color: val('hoverBorderColor', '#d1d5db') }}
                        onChange={b => updateBatch({
                            ...(b.type  !== undefined && { hoverBorderStyle: b.type === 'Default' ? 'none' : b.type }),
                            ...(b.width !== undefined && { hoverBorderWidth: b.width }),
                            ...(b.color !== undefined && { hoverBorderColor: b.color }),
                        })}
                        styleGuide={styleGuide}
                    />
                    <FourSideInput
                        label="Corner Radius"
                        top={val('hoverBorderRadius', val('borderRadius', 0))}
                        right={val('hoverBorderRadius', val('borderRadius', 0))}
                        bottom={val('hoverBorderRadius', val('borderRadius', 0))}
                        left={val('hoverBorderRadius', val('borderRadius', 0))}
                        unit="px"
                        onChange={s => update('hoverBorderRadius', s.top)}
                    />
                </>
            )}
        </div>
    );
}
