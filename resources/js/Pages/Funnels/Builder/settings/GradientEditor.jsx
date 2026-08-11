import React from 'react';
import { Trash2 } from 'lucide-react';
import ColorPickerInput from '../ColorPicker';

/**
 * GradientEditor — extracted from the 120-line inline IIFE in SettingsTab.
 * Handles linear/radial type toggle, live preview, color stops, and angle.
 */
export default function GradientEditor({ val, elementId, handleUpdateElementSetting, styleGuide }) {
    const update = (key, value) => handleUpdateElementSetting(elementId, key, value);

    const stops  = val('gradientStops', [
        { color: val('gradientColor1', '#6366f1'), pos: 0 },
        { color: val('gradientColor2', '#ec4899'), pos: 100 },
    ]);
    const gType  = val('gradientType', 'linear');
    const angle  = val('gradientAngle', 135);

    const stopsStr  = stops.slice().sort((a, b) => a.pos - b.pos).map(s => `${s.color} ${s.pos}%`).join(', ');
    const previewCss = gType === 'radial'
        ? `radial-gradient(circle, ${stopsStr})`
        : `linear-gradient(${angle}deg, ${stopsStr})`;

    const updateStops = (next) => update('gradientStops', next);

    const addStop = () => {
        const sorted = [...stops].sort((a, b) => a.pos - b.pos);
        let pos = 50;
        if (sorted.length >= 2) {
            const last = sorted[sorted.length - 1];
            const prev = sorted[sorted.length - 2];
            pos = Math.round((last.pos + prev.pos) / 2);
        }
        updateStops([...stops, { color: '#ffffff', pos }]);
    };

    const removeStop = (idx) => {
        if (stops.length <= 2) return;
        updateStops(stops.filter((_, i) => i !== idx));
    };

    const updateStop = (idx, field, value) =>
        updateStops(stops.map((s, i) => i === idx ? { ...s, [field]: value } : s));

    return (
        <div className="space-y-2.5 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
            {/* Type: Linear / Radial */}
            <div className="flex gap-1 p-1 rounded-lg bg-neutral-100">
                {[{ value: 'linear', label: '↗ Linear' }, { value: 'radial', label: '◎ Radial' }].map(opt => (
                    <button
                        key={opt.value} type="button"
                        onClick={() => update('gradientType', opt.value)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${
                            gType === opt.value
                                ? 'bg-white text-brand-600 shadow-sm border border-brand-200'
                                : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                    >{opt.label}</button>
                ))}
            </div>

            {/* Live preview strip */}
            <div className="w-full h-8 rounded-lg border border-neutral-200 shadow-inner" style={{ background: previewCss }} />

            {/* Color stops */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Color Stops</span>
                    <button type="button" onClick={addStop}
                        className="flex items-center gap-0.5 text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-md transition">
                        + Add Stop
                    </button>
                </div>

                {stops.map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-neutral-200 shadow-sm">
                        <ColorPickerInput value={stop.color} onChange={v => updateStop(idx, 'color', v)} styleGuide={styleGuide} className="flex-1" />
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-neutral-400 font-semibold">Pos:</span>
                            <input
                                type="number" min="0" max="100" value={stop.pos}
                                onChange={e => updateStop(idx, 'pos', Math.max(0, Math.min(100, Number(e.target.value))))}
                                className="w-12 rounded border border-neutral-300 p-1 text-center font-bold text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                            <span className="text-[10px] font-bold text-neutral-500">%</span>
                        </div>
                        <button type="button" onClick={() => removeStop(idx)} disabled={stops.length <= 2}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-20 disabled:cursor-not-allowed transition shrink-0"
                            title={stops.length <= 2 ? 'Need at least 2 stops' : `Remove stop ${idx + 1}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Angle (linear only) */}
            {gType === 'linear' && (
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-neutral-500">
                        <span>Angle</span>
                        <span className="text-brand-600 font-bold">{angle}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="range" min="0" max="360" value={angle}
                            onChange={e => update('gradientAngle', Number(e.target.value))}
                            className="flex-1 accent-brand-600 cursor-pointer h-1.5" />
                        <input type="number" value={angle}
                            onChange={e => update('gradientAngle', Number(e.target.value))}
                            className="w-14 rounded border p-1 text-center font-bold text-xs" />
                    </div>
                    {/* Quick angle presets */}
                    <div className="flex gap-1 flex-wrap mt-1">
                        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                            <button key={a} type="button" onClick={() => update('gradientAngle', a)}
                                className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition ${
                                    angle === a ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                }`}>{a}°</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
