import React from 'react';
import { FieldLabel } from '../BuilderUI';
import { Checkbox } from '@/Components/ui';

export default function VisibilityPanel({ element, handleUpdateElementSetting }) {
    const update = (key, value) => handleUpdateElementSetting(element.id, key, value);

    return (
        <div className="space-y-2">
            <FieldLabel>Display on Devices</FieldLabel>
            <div className="space-y-1.5">
                {[
                    { label: 'Desktop', key: 'visibleDesktop' },
                    { label: 'Mobile',  key: 'visibleMobile' },
                ].map(({ label, key }) => (
                    <Checkbox
                        key={key}
                        checked={element[key] !== false}
                        onChange={e => update(key, e.target.checked)}
                        label={label}
                    />
                ))}
            </div>
        </div>
    );
}
