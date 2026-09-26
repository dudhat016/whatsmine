import React from 'react';
import { Monitor, Tablet, Smartphone, RotateCcw } from 'lucide-react';

/** Shows which viewport mode is active and if the element has custom overrides for it. */
export default function ViewportBanner({ viewport, element, onReset }) {
    const overrideCount = Object.keys(element?.[viewport] || {}).length;

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
                {viewport === 'tablet'  && <Tablet  className="h-4 w-4 text-amber-600" />}
                {viewport === 'mobile'  && <Smartphone className="h-4 w-4 text-blue-600" />}
                <div>
                    <p className="font-bold text-[11px] leading-none">{viewport} Styling Mode</p>
                    <p className="text-[9px] text-neutral-500 font-normal mt-0.5">
                        {viewport === 'desktop'
                            ? 'Modifies base / desktop styles'
                            : `Edits apply ONLY to ${viewport} screens`}
                    </p>
                </div>
            </div>

            {viewport !== 'desktop' && (
                <div className="flex items-center gap-1.5">
                    <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                        overrideCount > 0
                            ? 'bg-white text-brand-600 border-brand-300 shadow-2xs'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                    }`}>
                        {overrideCount > 0 ? `${overrideCount} Overrides` : 'Inheriting'}
                    </span>
                    {overrideCount > 0 && onReset && (
                        <button
                            type="button"
                            onClick={onReset}
                            title="Reset all overrides for this viewport"
                            className="p-1 rounded-full hover:bg-white text-neutral-400 hover:text-red-600 transition shadow-2xs"
                        >
                            <RotateCcw className="h-3 w-3" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
