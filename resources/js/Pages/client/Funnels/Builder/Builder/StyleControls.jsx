/**
 * StyleControls.jsx
 *
 * Shared, reusable UI control components for the Funnel Builder.
 * Used across BrandTab.jsx, SettingsTab.jsx, and any future panels.
 *
 * Exports:
 *   UnitSelect         – Small dropdown for CSS unit selection (px, em, rem, %)
 *   SizeInput          – Number input + UnitSelect inline combo
 *   TypographyControl  – Full Elementor-style typography drawer
 *   FourSideInput      – 4-side (Top/Right/Bottom/Left) linked numeric inputs with unit
 *   ShadowControl      – Box / Text shadow editor drawer
 *   BorderControl      – Border type, width, color picker
 *   AccordionSection   – Collapsible accordion wrapper
 *   TabSwitcher        – Normal/Hover/Focus tab row
 */

import React, { useState } from 'react';
import {
    RotateCcw, Globe, Edit2, Link as LinkIcon, Unlink, ChevronDown, ChevronRight
} from 'lucide-react';
import ColorPickerInput from './ColorPicker';
import { GOOGLE_FONTS, SYSTEM_FONTS } from './constants';

// ── 1. UnitSelect ──────────────────────────────────────────────────────────

export function UnitSelect({
    value = 'px',
    options = ['px', 'em', 'rem', 'vw', 'vh', '%'],
    onChange,
    className = '',
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`text-[10px] font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded px-1.5 py-0.5 border border-neutral-300 focus:outline-none cursor-pointer ${className}`}
        >
            {options.map(u => (
                <option key={u} value={u}>{u}</option>
            ))}
        </select>
    );
}

// ── 2. SizeInput ───────────────────────────────────────────────────────────

export function SizeInput({
    value = '',
    unit = 'px',
    units = ['px', 'em', 'rem', 'vw', 'vh', '%'],
    placeholder = '0',
    onChange,
    onUnitChange,
    inputClass = '',
}) {
    return (
        <div className="flex items-center gap-1.5">
            <input
                type="number"
                value={value}
                onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={placeholder}
                className={`w-full rounded border border-neutral-300 bg-white p-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-brand-500 ${inputClass}`}
            />
            <UnitSelect value={unit} options={units} onChange={onUnitChange} />
        </div>
    );
}

// ── 3. TypographyControl ───────────────────────────────────────────────────

export function TypographyControl({ label = 'Typography', value = {}, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const font = typeof value === 'object' && value !== null ? value : {};

    const set = (prop, val) => onChange({ ...font, [prop]: val });

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-700 text-xs">{label}</span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className="p-1 rounded border bg-neutral-50 hover:bg-neutral-100 text-neutral-500 border-neutral-300"
                        title="Link to global style"
                    >
                        <Globe className="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-1 rounded border transition ${
                            isOpen
                                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-300'
                        }`}
                        title="Edit Typography"
                    >
                        <Edit2 className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="p-2.5 mt-1 rounded-xl bg-neutral-900 text-white border border-neutral-800 space-y-2.5 shadow-xl text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                        <span className="font-bold text-neutral-200 text-[11px] uppercase tracking-wider">Typography</span>
                        <button
                            type="button"
                            onClick={() => onChange({})}
                            className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                        >
                            <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                    </div>

                    {/* Family */}
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Family</label>
                        <select
                            value={font.family || 'Default'}
                            onChange={e => set('family', e.target.value)}
                            className="w-full rounded border border-neutral-700 bg-neutral-950 p-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                            <option value="Default">Default</option>
                            <optgroup label="Google Fonts">
                                {GOOGLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </optgroup>
                            <optgroup label="System Fonts">
                                {SYSTEM_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </optgroup>
                        </select>
                    </div>

                    {/* Size — NO range slider */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Size</label>
                            <UnitSelect
                                value={font.sizeUnit || 'px'}
                                onChange={u => set('sizeUnit', u)}
                            />
                        </div>
                        <input
                            type="number"
                            value={font.size || ''}
                            onChange={e => set('size', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 16"
                            className="w-full rounded border border-neutral-700 bg-neutral-950 p-1.5 font-bold text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                    </div>

                    {/* Weight */}
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Weight</label>
                        <select
                            value={font.weight || 'Default'}
                            onChange={e => set('weight', e.target.value)}
                            className="w-full rounded border border-neutral-700 bg-neutral-950 p-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                            <option value="Default">Default</option>
                            {[
                                ['100','100 (Thin)'],['200','200 (Extra Light)'],['300','300 (Light)'],
                                ['400','400 (Normal)'],['500','500 (Medium)'],['600','600 (Semi Bold)'],
                                ['700','700 (Bold)'],['800','800 (Extra Bold)'],['900','900 (Black)']
                            ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>

                    {/* Transform */}
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Transform</label>
                        <select
                            value={font.transform || 'Default'}
                            onChange={e => set('transform', e.target.value)}
                            className="w-full rounded border border-neutral-700 bg-neutral-950 p-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                            <option value="Default">Default</option>
                            <option value="uppercase">Uppercase</option>
                            <option value="lowercase">Lowercase</option>
                            <option value="capitalize">Capitalize</option>
                            <option value="none">Normal (None)</option>
                        </select>
                    </div>

                    {/* Style */}
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Style</label>
                        <select
                            value={font.style || 'Default'}
                            onChange={e => set('style', e.target.value)}
                            className="w-full rounded border border-neutral-700 bg-neutral-950 p-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                            <option value="Default">Default</option>
                            <option value="normal">Normal</option>
                            <option value="italic">Italic</option>
                            <option value="oblique">Oblique</option>
                        </select>
                    </div>

                    {/* Decoration */}
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Decoration</label>
                        <select
                            value={font.decoration || 'Default'}
                            onChange={e => set('decoration', e.target.value)}
                            className="w-full rounded border border-neutral-700 bg-neutral-950 p-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                            <option value="Default">Default</option>
                            <option value="underline">Underline</option>
                            <option value="overline">Overline</option>
                            <option value="line-through">Line Through</option>
                            <option value="none">None</option>
                        </select>
                    </div>

                    {/* Line Height */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Line Height</label>
                            <UnitSelect
                                value={font.lineHeightUnit || 'px'}
                                options={['px', 'em', 'rem', '%']}
                                onChange={u => set('lineHeightUnit', u)}
                            />
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            value={font.lineHeight || ''}
                            onChange={e => set('lineHeight', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 24"
                            className="w-full rounded border border-neutral-700 bg-neutral-950 p-1.5 font-bold text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                    </div>

                    {/* Letter Spacing */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Letter Spacing</label>
                            <UnitSelect
                                value={font.letterSpacingUnit || 'px'}
                                options={['px', 'em', 'rem']}
                                onChange={u => set('letterSpacingUnit', u)}
                            />
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            value={font.letterSpacing || ''}
                            onChange={e => set('letterSpacing', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 0.5"
                            className="w-full rounded border border-neutral-700 bg-neutral-950 p-1.5 font-bold text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                    </div>

                    {/* Word Spacing */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Word Spacing</label>
                            <UnitSelect
                                value={font.wordSpacingUnit || 'px'}
                                options={['px', 'em', 'rem']}
                                onChange={u => set('wordSpacingUnit', u)}
                            />
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            value={font.wordSpacing || ''}
                            onChange={e => set('wordSpacing', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 1"
                            className="w-full rounded border border-neutral-700 bg-neutral-950 p-1.5 font-bold text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── 4. FourSideInput ───────────────────────────────────────────────────────

export function FourSideInput({
    label,
    top, right, bottom, left,
    unit = 'px',
    units = ['px', 'em', 'rem', '%'],
    onUnitChange,
    onChange,
    defaultLinked = true,
}) {
    const [isLinked, setIsLinked] = useState(defaultLinked);

    const update = (side, rawVal) => {
        const v = rawVal === '' ? '' : (isNaN(Number(rawVal)) ? 0 : Number(rawVal));
        if (isLinked) {
            onChange({ top: v, right: v, bottom: v, left: v });
        } else {
            onChange({
                top: side === 'top' ? v : (top ?? 0),
                right: side === 'right' ? v : (right ?? 0),
                bottom: side === 'bottom' ? v : (bottom ?? 0),
                left: side === 'left' ? v : (left ?? 0),
            });
        }
    };

    const handleKeyDown = (side, e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const currentVal = Number(
                side === 'top' ? (top ?? 0) :
                side === 'right' ? (right ?? 0) :
                side === 'bottom' ? (bottom ?? 0) :
                (left ?? 0)
            );
            const diff = e.key === 'ArrowUp' ? step : -step;
            const newVal = currentVal + diff;
            update(side, newVal);
        }
    };

    const toggleLink = () => {
        const newLinked = !isLinked;
        setIsLinked(newLinked);
        if (newLinked) {
            const linkVal = (top !== undefined && top !== '') ? top : ((right !== undefined && right !== '') ? right : ((bottom !== undefined && bottom !== '') ? bottom : (left ?? 0)));
            onChange({ top: linkVal, right: linkVal, bottom: linkVal, left: linkVal });
        }
    };

    const sides = [
        { key: 'top',    label: 'Top',    val: top    },
        { key: 'right',  label: 'Right',  val: right  },
        { key: 'bottom', label: 'Bottom', val: bottom },
        { key: 'left',   label: 'Left',   val: left   },
    ];

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                {label && <span className="font-semibold text-neutral-600 text-xs">{label}</span>}
                {onUnitChange && (
                    <UnitSelect value={unit} options={units} onChange={onUnitChange} />
                )}
            </div>
            <div className="flex items-start gap-1">
                <div className="grid grid-cols-4 gap-1 flex-1">
                    {sides.map(s => (
                        <div key={s.key} className="text-center">
                            <input
                                type="number"
                                step="1"
                                value={s.val ?? ''}
                                onChange={e => update(s.key, e.target.value)}
                                onKeyDown={e => handleKeyDown(s.key, e)}
                                placeholder="0"
                                className="w-full rounded border border-neutral-300 bg-white p-1 text-center font-bold text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            />
                            <span className="text-[9px] text-neutral-400 font-semibold mt-0.5 block">{s.label}</span>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={toggleLink}
                    className={`p-1.5 rounded border transition shrink-0 mt-px ${
                        isLinked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-300 hover:bg-neutral-200'
                    }`}
                    title={isLinked ? 'Unlink sides' : 'Link all sides'}
                >
                    {isLinked ? <LinkIcon className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
                </button>
            </div>
        </div>
    );
}

// ── 5. ShadowControl ──────────────────────────────────────────────────────

export function ShadowControl({ label = 'Box Shadow', value = {}, onChange, styleGuide }) {
    const [isOpen, setIsOpen] = useState(false);
    const shadow = typeof value === 'object' && value !== null ? value : {};
    const set = (prop, val) => onChange({ ...shadow, [prop]: val });

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-700 text-xs">{label}</span>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-1 rounded border transition ${
                        isOpen
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-300'
                    }`}
                    title="Edit Shadow"
                >
                    <Edit2 className="h-3 w-3" />
                </button>
            </div>

            {isOpen && (
                <div className="p-2.5 mt-1 rounded-xl bg-neutral-900 text-white border border-neutral-800 space-y-2.5 shadow-xl text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                        <span className="font-bold text-[10px] text-neutral-200 uppercase tracking-wider">Shadow Options</span>
                        <button
                            type="button"
                            onClick={() => onChange({})}
                            className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                        >
                            <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Color</label>
                        <ColorPickerInput
                            value={shadow.color || 'rgba(0,0,0,0.15)'}
                            onChange={v => set('color', v)}
                            styleGuide={styleGuide}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { key: 'h',      label: 'Horizontal', def: 0  },
                            { key: 'v',      label: 'Vertical',   def: 8  },
                            { key: 'blur',   label: 'Blur',       def: 24 },
                            { key: 'spread', label: 'Spread',     def: 0  },
                        ].map(f => (
                            <div key={f.key} className="space-y-0.5">
                                <label className="block text-[10px] font-semibold text-neutral-400">{f.label}</label>
                                <input
                                    type="number"
                                    value={shadow[f.key] ?? f.def}
                                    onChange={e => set(f.key, Number(e.target.value))}
                                    className="w-full rounded border border-neutral-700 bg-neutral-950 p-1 font-bold text-xs text-white focus:outline-none focus:border-brand-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── 6. BorderControl ──────────────────────────────────────────────────────

export function BorderControl({ label = 'Border', value = {}, onChange, styleGuide }) {
    const border = typeof value === 'object' && value !== null ? value : {};
    const set = (prop, val) => onChange({ ...border, [prop]: val });
    const hasType = border.type && border.type !== 'none' && border.type !== 'Default';

    return (
        <div className="space-y-2">
            {label && <span className="block font-semibold text-neutral-700 text-xs">{label}</span>}

            <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Type</label>
                <select
                    value={border.type || 'Default'}
                    onChange={e => set('type', e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium bg-white focus:outline-none focus:border-brand-500"
                >
                    <option value="Default">Default</option>
                    <option value="none">None</option>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                    <option value="groove">Groove</option>
                    <option value="ridge">Ridge</option>
                </select>
            </div>

            {hasType && (
                <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Width</label>
                    <SizeInput
                        value={border.width ?? 1}
                        unit={border.widthUnit || 'px'}
                        units={['px', 'em', 'rem']}
                        onChange={v => set('width', v)}
                        onUnitChange={u => set('widthUnit', u)}
                    />
                </div>
            )}

            {hasType && (
                <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Color</label>
                    <ColorPickerInput
                        value={border.color || '#d1d5db'}
                        onChange={v => set('color', v)}
                        styleGuide={styleGuide}
                    />
                </div>
            )}
        </div>
    );
}

// ── 7. AccordionSection ────────────────────────────────────────────────────

export function AccordionSection({ title, icon, defaultOpen = false, children }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 transition text-left"
            >
                <span className="font-bold text-neutral-900 flex items-center gap-2 text-xs">
                    {icon}
                    {title}
                </span>
                {isOpen
                    ? <ChevronDown className="h-4 w-4 text-neutral-500 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-neutral-500 shrink-0" />
                }
            </button>
            {isOpen && (
                <div className="p-3 space-y-3 border-t border-neutral-200">
                    {children}
                </div>
            )}
        </div>
    );
}

// ── 8. TabSwitcher ─────────────────────────────────────────────────────────

export function TabSwitcher({ tabs = ['Normal', 'Hover'], active, onChange }) {
    return (
        <div className="flex gap-1 p-1 rounded-lg bg-neutral-100 border border-neutral-200">
            {tabs.map(tab => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => onChange(tab)}
                    className={`flex-1 py-1 text-[11px] font-bold rounded transition ${
                        active === tab
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}
