import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

export default function DeviceViewportBanner({ viewport, selectedElement }) {
    return (
        <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
            viewport === 'desktop'
                ? 'bg-neutral-50 border-neutral-200 text-neutral-700'
                : viewport === 'tablet'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-blue-50 border-blue-300 text-blue-900'
        }`}>
            <div className="flex items-center gap-2 capitalize">
                {viewport === 'desktop' && <Monitor className="h-4 w-4 text-neutral-600" />}
                {viewport === 'tablet' && <Tablet className="h-4 w-4 text-amber-600" />}
                {viewport === 'mobile' && <Smartphone className="h-4 w-4 text-blue-600" />}
                <div>
                    <p className="font-bold text-[11px] leading-none">{viewport} Styling Mode</p>
                    <p className="text-[9px] text-neutral-500 font-normal mt-0.5">
                        {viewport === 'desktop' ? 'Modifies base / desktop styles' : `Edits apply ONLY to ${viewport} screens`}
                    </p>
                </div>
            </div>
            {viewport !== 'desktop' && (
                <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                    Object.keys(selectedElement?.[viewport] || {}).length > 0
                        ? 'bg-white text-brand-600 border-brand-300 shadow-sm'
                        : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                }`}>
                    {Object.keys(selectedElement?.[viewport] || {}).length > 0 ? 'Customized' : 'Inheriting Desktop'}
                </span>
            )}
        </div>
    );
}
