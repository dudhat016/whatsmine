import React from 'react';
import { SectionTitle } from '../BuilderUI';

export default function VisibilityPanel({ element, handleUpdateElementSetting }) {
    const update = (key, value) => handleUpdateElementSetting(element.id, key, value);

    return (
        <div className="space-y-2 pt-3 border-t border-neutral-200">
            <SectionTitle>Visible On</SectionTitle>
            <div className="space-y-1.5">
                {[
                    { label: 'Desktop', key: 'visibleDesktop' },
                    { label: 'Mobile',  key: 'visibleMobile' },
                ].map(({ label, key }) => (
                    <label key={key} className="flex items-center gap-2 text-[11px] font-medium text-neutral-700 cursor-pointer hover:text-brand-600 transition">
                        <input
                            type="checkbox"
                            checked={element[key] !== false}
                            onChange={e => update(key, e.target.checked)}
                            className="h-4 w-4 rounded accent-brand-600"
                        />
                        <span>{label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
