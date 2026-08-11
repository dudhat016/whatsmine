import React from 'react';
import { SectionTitle, PanelSelect, FieldLabel } from '../BuilderUI';
import { FourSideInput } from '../StyleControls';

export default function SizePanel({ element, val, viewport, handleUpdateElementSetting, handleResetElementCategory }) {
    const update = (patch) => handleUpdateElementSetting(element.id, patch);

    return (
        <div className="space-y-3 pt-3 border-t border-neutral-200">
            <SectionTitle
                onReset={() => handleResetElementCategory(element.id, 'size_position')}
                resetTitle={`Reset Size & Position for ${viewport}`}
            >
                Size and Position
            </SectionTitle>

            {/* Container width (sections only) */}
            {element.type === 'section' && (
                <div className="space-y-0.5">
                    <FieldLabel>Container Width</FieldLabel>
                    <PanelSelect
                        value={val('containerWidth', '1200')}
                        onChange={e => handleUpdateElementSetting(element.id, 'containerWidth', e.target.value)}
                    >
                        <option value="100%">Full Width (100%)</option>
                        <option value="1600">Wide (1600px)</option>
                        <option value="1280">Large (1280px)</option>
                        <option value="1200">Default (1200px)</option>
                        <option value="1024">Standard (1024px)</option>
                        <option value="960">Medium (960px)</option>
                        <option value="768">Tablet (768px)</option>
                        <option value="640">Narrow (640px)</option>
                        <option value="540">Small (540px)</option>
                    </PanelSelect>
                </div>
            )}

            {/* Padding */}
            <FourSideInput
                label="Padding"
                top={val('paddingTop', val('paddingY', 0))}
                right={val('paddingRight', val('paddingX', 0))}
                bottom={val('paddingBottom', val('paddingY', 0))}
                left={val('paddingLeft', val('paddingX', 0))}
                unit={val('paddingUnit', 'px')}
                units={['px', '%', 'rem', 'vw']}
                onUnitChange={u => handleUpdateElementSetting(element.id, 'paddingUnit', u)}
                onChange={s => update({ paddingTop: s.top, paddingRight: s.right, paddingBottom: s.bottom, paddingLeft: s.left, paddingY: s.top, paddingX: s.right })}
                defaultLinked={true}
            />

            {/* Margin */}
            <FourSideInput
                label="Margin"
                top={val('marginTop', 0)}
                right={val('marginRight', 0)}
                bottom={val('marginBottom', 0)}
                left={val('marginLeft', 0)}
                unit={val('marginUnit', 'px')}
                units={['px', '%', 'rem', 'vw']}
                onUnitChange={u => handleUpdateElementSetting(element.id, 'marginUnit', u)}
                onChange={s => update({ marginTop: s.top, marginRight: s.right, marginBottom: s.bottom, marginLeft: s.left })}
                defaultLinked={true}
            />
        </div>
    );
}
