import React from 'react';
import { PanelSelect, PanelNumber, FieldLabel } from '../BuilderUI';
import { FourSideInput } from '../StyleControls';
import { CONTENT_WIDTH_PRESETS } from '../utils/treeUtils';

export default function SizePanel({ element, val, viewport, handleUpdateElementSetting, handleResetElementCategory }) {
    const update = (patch) => handleUpdateElementSetting(element.id, patch);

    const childRows = element.type === 'section'
        ? (element.elements || []).filter(el =>
            el.type === 'grid_container' ||
            el.type === 'flex_container' ||
            (typeof el.type === 'string' && el.type.startsWith('col_'))
        )
        : [];
    const activeRow = element.type === 'section'
        ? (childRows[0] || (element.elements && element.elements[0]) || null)
        : element;

    const activeContentWidth = (() => {
        const target = activeRow || element;
        const cw = target?.contentWidth;
        if (['full', 'wide', 'medium', 'small', 'extra_small', 'custom'].includes(cw)) return cw;
        const w = target?.containerWidth;
        if (w === '100%') return 'full';
        if (w === '960') return 'medium';
        if (w === '768') return 'small';
        if (w === '540') return 'extra_small';
        if (w === '1120' || w === '1200') return 'wide';
        return 'wide';
    })();

    return (
        <div className="space-y-3">

            {/* Content Width (applies to row element, never main section) */}
            {(element.type === 'section' || element.type === 'grid_container' || (typeof element.type === 'string' && element.type.startsWith('col_'))) && (
                <div className="space-y-0.5">
                    <FieldLabel>Content Width</FieldLabel>
                    <PanelSelect
                        value={activeContentWidth}
                        onChange={e => {
                            const key = e.target.value;
                            const preset = CONTENT_WIDTH_PRESETS.find(p => p.key === key);
                            const widthVal = key === 'custom'
                                ? (activeRow?.containerWidth || '1120')
                                : (preset ? preset.widthValue : '1120');

                            if (element.type === 'section') {
                                const rowsToUpdate = childRows.length > 0 ? childRows : (element.elements || []);
                                rowsToUpdate.forEach(row => {
                                    handleUpdateElementSetting(row.id, {
                                        contentWidth: key,
                                        containerWidth: widthVal,
                                    });
                                });
                                handleUpdateElementSetting(element.id, {
                                    contentWidth: undefined,
                                    containerWidth: undefined,
                                });
                            } else {
                                handleUpdateElementSetting(element.id, {
                                    contentWidth: key,
                                    containerWidth: widthVal,
                                });
                            }
                        }}
                    >
                        {CONTENT_WIDTH_PRESETS.map(p => (
                            <option key={p.key} value={p.key}>{p.label}</option>
                        ))}
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

            {/* Positioning & Sticky */}
            <div className="pt-2 border-t border-neutral-200 space-y-2">
                <div className="space-y-0.5">
                    <FieldLabel>Positioning</FieldLabel>
                    <PanelSelect
                        value={val('positionType', 'static')}
                        onChange={e => handleUpdateElementSetting(element.id, 'positionType', e.target.value)}
                    >
                        <option value="static">Default (Static)</option>
                        <option value="sticky_top">📌 Sticky Top (Header / Bar)</option>
                        <option value="sticky_bottom">📌 Sticky Bottom (Mobile CTA Bar)</option>
                        <option value="fixed_bottom">📌 Fixed Bottom Screen</option>
                    </PanelSelect>
                </div>

                {val('positionType', 'static') !== 'static' && (
                    <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                        <div className="space-y-0.5">
                            <FieldLabel>Offset (px)</FieldLabel>
                            <PanelNumber
                                value={val('stickyOffset', 0)}
                                onChange={e => handleUpdateElementSetting(element.id, 'stickyOffset', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Z-Index</FieldLabel>
                            <PanelNumber
                                value={val('zIndex', 40)}
                                onChange={e => handleUpdateElementSetting(element.id, 'zIndex', parseInt(e.target.value, 10) || 1)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
