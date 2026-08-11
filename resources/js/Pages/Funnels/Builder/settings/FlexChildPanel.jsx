import React from 'react';
import { SectionTitle, PanelSelect, FieldLabel } from '../BuilderUI';

const CONTAINER_TYPES = ['section', 'flex_container', 'grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'];

export default function FlexChildPanel({ element, val, viewport, handleUpdateElementSetting, handleResetElementCategory }) {
    if (CONTAINER_TYPES.includes(element.type)) return null;

    const update = (key, value) => handleUpdateElementSetting(element.id, key, value);

    return (
        <div className="space-y-3 pt-3 border-t border-neutral-200">
            <SectionTitle
                onReset={() => handleResetElementCategory(element.id, 'flex_child')}
                resetTitle={`Reset Flex Child Settings for ${viewport}`}
            >
                Flex Child Sizing & Order
            </SectionTitle>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                    <FieldLabel>Flex Grow</FieldLabel>
                    <PanelSelect value={val('flexGrow', 0)} onChange={e => update('flexGrow', Number(e.target.value))}>
                        <option value={0}>Fixed (Fit Content)</option>
                        <option value={1}>Grow (Fill Space)</option>
                    </PanelSelect>
                </div>
                <div className="space-y-0.5">
                    <FieldLabel>Align Self</FieldLabel>
                    <PanelSelect value={val('alignSelf', 'auto')} onChange={e => update('alignSelf', e.target.value)}>
                        <option value="auto">Auto (Inherit)</option>
                        <option value="flex-start">Start</option>
                        <option value="center">Center</option>
                        <option value="flex-end">End</option>
                        <option value="stretch">Stretch</option>
                    </PanelSelect>
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                    <span>Display Order</span>
                    <span className="font-mono text-brand-600 font-bold">{val('order', 0)}</span>
                </div>
                <input type="range" min="-5" max="10" value={val('order', 0)}
                    onChange={e => update('order', Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-full" />
            </div>
        </div>
    );
}
