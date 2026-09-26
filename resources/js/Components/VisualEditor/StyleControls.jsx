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

// ── 0. InheritanceBadge (Global Brand vs Local Override Indicator & Reset) ─

export function InheritanceBadge({
    isOverridden = false,
    onReset,
    label = 'Brand',
    resetTitle = 'Reset to Brand Theme',
}) {
    return (
        <div className="flex items-center gap-1 shrink-0">
            {isOverridden ? (
                <span
                    className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 rounded px-1.5 py-0.5 tracking-tight flex items-center gap-1 shadow-2xs select-none"
                    title="Custom override set on this element (will not update with Brand settings)"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Custom
                </span>
            ) : (
                <span
                    className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 rounded px-1.5 py-0.5 tracking-tight flex items-center gap-1 shadow-2xs select-none"
                    title={`Inheriting from Global ${label} Style (updates automatically)`}
                >
                    <Globe className="h-2.5 w-2.5 text-blue-500" />
                    {label}
                </span>
            )}
            {isOverridden && onReset && (
                <button
                    type="button"
                    onClick={onReset}
                    className="p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-neutral-100 transition shadow-2xs"
                    title={resetTitle}
                >
                    <RotateCcw className="h-2.5 w-2.5" />
                </button>
            )}
        </div>
    );
}

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
            className={`text-[10px] font-bold text-neutral-700 bg-white hover:bg-neutral-50 rounded-md px-1.5 py-0.5 border border-neutral-300 focus:outline-none focus:border-brand-500 cursor-pointer shadow-2xs ${className}`}
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
                className={`w-full rounded-lg border border-neutral-300 bg-white p-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:border-brand-500 ${inputClass}`}
            />
            <UnitSelect value={unit} options={units} onChange={onUnitChange} />
        </div>
    );
}

// ── 3. TypographyControl ───────────────────────────────────────────────────

export function TypographyControl({
    label = 'Typography',
    prefix,
    val,
    update,
    updateBatch,
    styleGuide,
    defaultSize = 16,
    defaultWeight = '400',
    defaultFamily,
    value,
    onChange,
    onReset,
    resetTitle,
    element,
    isLocallySet,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const k = (prop) => {
        if (!prefix) return prop;
        return `${prefix}${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
    };

    const isPrefixMode = prefix !== undefined && val !== undefined;

    const typoKeys = [
        k('fontFamily'), k('fontSize'), k('fontSizeUnit'), k('fontWeight'),
        k('textTransform'), k('fontStyle'), k('textDecoration'),
        k('lineHeight'), k('letterSpacing'), k('wordSpacing')
    ];
    const isOverridden = isLocallySet
        ? typoKeys.some(key => isLocallySet(key))
        : (element ? typoKeys.some(key => element[key] !== undefined) : false);

    const font = isPrefixMode ? {
        family: val(k('fontFamily'), defaultFamily || styleGuide?.defaultFont || 'Default'),
        size: val(k('fontSize'), defaultSize),
        sizeUnit: val(k('fontSizeUnit'), 'px'),
        weight: val(k('fontWeight'), defaultWeight),
        transform: val(k('textTransform'), 'Default'),
        style: val(k('fontStyle'), 'Default'),
        decoration: val(k('textDecoration'), 'Default'),
        lineHeight: val(k('lineHeight'), ''),
        lineHeightUnit: val(k('lineHeightUnit'), 'px'),
        letterSpacing: val(k('letterSpacing'), 0),
        letterSpacingUnit: val(k('letterSpacingUnit'), 'px'),
        wordSpacing: val(k('wordSpacing'), 0),
        wordSpacingUnit: val(k('wordSpacingUnit'), 'px'),
    } : (typeof value === 'object' && value !== null ? value : {});

    const set = (prop, propVal) => {
        if (isPrefixMode) {
            const keyMap = {
                family: k('fontFamily'),
                size: k('fontSize'),
                sizeUnit: k('fontSizeUnit'),
                weight: k('fontWeight'),
                transform: k('textTransform'),
                style: k('fontStyle'),
                decoration: k('textDecoration'),
                lineHeight: k('lineHeight'),
                lineHeightUnit: k('lineHeightUnit'),
                letterSpacing: k('letterSpacing'),
                letterSpacingUnit: k('letterSpacingUnit'),
                wordSpacing: k('wordSpacing'),
                wordSpacingUnit: k('wordSpacingUnit'),
            };
            const updateKey = keyMap[prop] || k(prop);
            if (update) update(updateKey, propVal);
            else if (updateBatch) updateBatch({ [updateKey]: propVal });
        } else if (onChange) {
            onChange({ ...font, [prop]: propVal });
        }
    };

    const handleReset = () => {
        if (onReset) {
            onReset();
        } else if (isPrefixMode && updateBatch) {
            const resetObj = {};
            typoKeys.forEach(kName => { resetObj[kName] = undefined; });
            updateBatch(resetObj);
        } else if (onChange) {
            onChange({});
        }
    };

    // Compute compact summary badge e.g. "Inter 16px" or "Roboto 600"
    const summaryParts = [];
    if (font.family && font.family !== 'Default') summaryParts.push(font.family);
    if (font.size) summaryParts.push(`${font.size}${font.sizeUnit || 'px'}`);
    if (font.weight && font.weight !== 'Default' && font.weight !== '400') summaryParts.push(font.weight);
    const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : null;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                    {typeof label === 'string' ? (
                        <span className="font-bold text-neutral-800 text-xs truncate">{label}</span>
                    ) : (
                        label
                    )}
                    {summary && (
                        <span className="text-[10px] font-medium text-brand-700 bg-brand-50 border border-brand-200/60 rounded px-1.5 py-0.5 max-w-[110px] truncate" title={summary}>
                            {summary}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <InheritanceBadge
                        isOverridden={isOverridden}
                        onReset={handleReset}
                        label="Brand"
                        resetTitle={resetTitle || "Reset Typography to Brand Defaults"}
                    />
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-1 rounded-md border transition shadow-2xs ${
                            isOpen
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-300'
                        }`}
                        title="Edit Typography"
                    >
                        <Edit2 className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="p-3 mt-1.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5 shadow-sm text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                        <span className="font-bold text-neutral-800 text-[11px] uppercase tracking-wider">Typography Settings</span>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-[10px] font-semibold text-neutral-500 hover:text-red-600 flex items-center gap-1 transition"
                        >
                            <RotateCcw className="h-3 w-3" /> Reset to Brand
                        </button>
                    </div>

                    {/* Family */}
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Font Family</label>
                        <select
                            value={font.family || 'Default'}
                            onChange={e => set('family', e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
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

                    {/* Size — numeric input */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Font Size</label>
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
                            className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 font-bold text-xs text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
                        />
                    </div>

                    {/* Weight */}
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Weight</label>
                        <select
                            value={font.weight || 'Default'}
                            onChange={e => set('weight', e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
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
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Transform</label>
                        <select
                            value={font.transform || 'Default'}
                            onChange={e => set('transform', e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
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
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Style</label>
                        <select
                            value={font.style || 'Default'}
                            onChange={e => set('style', e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
                        >
                            <option value="Default">Default</option>
                            <option value="normal">Normal</option>
                            <option value="italic">Italic</option>
                            <option value="oblique">Oblique</option>
                        </select>
                    </div>

                    {/* Decoration */}
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Decoration</label>
                        <select
                            value={font.decoration || 'Default'}
                            onChange={e => set('decoration', e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
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
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Line Height</label>
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
                            className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 font-bold text-xs text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
                        />
                    </div>

                    {/* Letter Spacing */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Letter Spacing</label>
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
                            className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 font-bold text-xs text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
                        />
                    </div>

                    {/* Word Spacing */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Word Spacing</label>
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
                            className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 font-bold text-xs text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
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
    isOverridden = false,
    onReset,
    resetTitle = 'Reset to Brand Default',
    inheritedLabel = 'Brand',
}) {
    const [isLinked, setIsLinked] = useState(defaultLinked);

    const update = (side, rawVal) => {
        const v = rawVal === '' ? '' : (isNaN(Number(rawVal)) ? 0 : Number(rawVal));
        if (isLinked || side === 'all') {
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

    const linkedVal = (top !== undefined && top !== '') ? top : ((right !== undefined && right !== '') ? right : 0);

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 truncate">
                    {label && <span className="font-semibold text-neutral-700 text-xs truncate">{label}</span>}
                    <InheritanceBadge
                        isOverridden={isOverridden}
                        onReset={onReset}
                        label={inheritedLabel}
                        resetTitle={resetTitle}
                    />
                </div>
                {onUnitChange && (
                    <UnitSelect value={unit} options={units} onChange={onUnitChange} />
                )}
            </div>
            <div className="flex items-center gap-1.5">
                {isLinked ? (
                    <div className="flex-1 relative flex items-center">
                        <input
                            type="number"
                            step="1"
                            value={linkedVal ?? ''}
                            onChange={e => update('all', e.target.value)}
                            onKeyDown={e => handleKeyDown('top', e)}
                            placeholder="0"
                            className="w-full rounded-lg border border-neutral-300 bg-white py-1 px-2.5 font-bold text-xs text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
                        />
                        <span className="text-[10px] text-neutral-400 font-semibold absolute right-2 pointer-events-none">all sides</span>
                    </div>
                ) : (
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
                )}
                <button
                    type="button"
                    onClick={toggleLink}
                    className={`p-1.5 rounded-lg border transition shrink-0 ${
                        isLinked
                            ? 'bg-brand-50 text-brand-600 border-brand-300 hover:bg-brand-100 shadow-2xs'
                            : 'bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50'
                    }`}
                    title={isLinked ? 'Click to set individual sides (Top/Right/Bottom/Left)' : 'Click to link all sides together'}
                >
                    {isLinked ? <LinkIcon className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
                </button>
            </div>
        </div>
    );
}

// ── 4b. CornerRadiusControl & SpacingControl ───────────────────────────────

export function CornerRadiusControl({
    label = 'Corner Radius',
    prefix = '',
    val,
    updateBatch,
    defaultRadius = 0,
    element,
    isLocallySet,
}) {
    const k = (prop) => {
        if (!prefix) return prop;
        return `${prefix}${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
    };

    const radiusKeys = [
        k('borderRadius'), k('borderRadiusTL'), k('borderRadiusTR'),
        k('borderRadiusBL'), k('borderRadiusBR')
    ];
    const isOverridden = isLocallySet
        ? radiusKeys.some(key => isLocallySet(key))
        : (element ? radiusKeys.some(key => element[key] !== undefined) : false);

    const handleReset = () => {
        if (updateBatch) {
            const resetObj = {};
            radiusKeys.forEach(kName => { resetObj[kName] = undefined; });
            updateBatch(resetObj);
        }
    };

    const tl = val(k('borderRadiusTL'), val(k('borderRadius'), defaultRadius));
    const tr = val(k('borderRadiusTR'), val(k('borderRadius'), defaultRadius));
    const bl = val(k('borderRadiusBL'), val(k('borderRadius'), defaultRadius));
    const br = val(k('borderRadiusBR'), val(k('borderRadius'), defaultRadius));
    const unit = val(k('borderRadiusUnit'), 'px');

    return (
        <FourSideInput
            label={label}
            top={tl}
            right={tr}
            bottom={bl}
            left={br}
            unit={unit}
            units={['px', 'em', 'rem', '%']}
            isOverridden={isOverridden}
            onReset={handleReset}
            resetTitle="Reset Corner Radius to Brand Default"
            onUnitChange={u => updateBatch({ [k('borderRadiusUnit')]: u })}
            onChange={s => updateBatch({
                [k('borderRadiusTL')]: s.top,
                [k('borderRadiusTR')]: s.right,
                [k('borderRadiusBL')]: s.bottom,
                [k('borderRadiusBR')]: s.left,
                [k('borderRadius')]: s.top,
            })}
        />
    );
}

export function SpacingControl({
    label = 'Padding',
    type = 'padding', // 'padding' | 'margin'
    prefix = '',
    val,
    updateBatch,
    defaultVal = 0,
    element,
    isLocallySet,
}) {
    const k = (side) => {
        const sideCap = side.charAt(0).toUpperCase() + side.slice(1);
        const typeCap = type.charAt(0).toUpperCase() + type.slice(1);
        if (!prefix) return `${type}${sideCap}`;
        return `${prefix}${typeCap}${sideCap}`;
    };
    const unitKey = prefix ? `${prefix}${type.charAt(0).toUpperCase() + type.slice(1)}Unit` : `${type}Unit`;

    const spacingKeys = [
        k('top'), k('right'), k('bottom'), k('left'),
        `${prefix ? prefix : ''}${type}Y`,
        `${prefix ? prefix : ''}${type}X`,
    ];
    const isOverridden = isLocallySet
        ? spacingKeys.some(key => isLocallySet(key))
        : (element ? spacingKeys.some(key => element[key] !== undefined) : false);

    const handleReset = () => {
        if (updateBatch) {
            const resetObj = {};
            spacingKeys.forEach(kName => { resetObj[kName] = undefined; });
            updateBatch(resetObj);
        }
    };

    const top = val(k('top'), val(`${prefix ? prefix : ''}${type}Y`, defaultVal));
    const right = val(k('right'), val(`${prefix ? prefix : ''}${type}X`, defaultVal));
    const bottom = val(k('bottom'), val(`${prefix ? prefix : ''}${type}Y`, defaultVal));
    const left = val(k('left'), val(`${prefix ? prefix : ''}${type}X`, defaultVal));
    const unit = val(unitKey, 'px');

    return (
        <FourSideInput
            label={label}
            top={top}
            right={right}
            bottom={bottom}
            left={left}
            unit={unit}
            units={['px', 'em', 'rem', '%']}
            isOverridden={isOverridden}
            onReset={handleReset}
            resetTitle={`Reset ${label} to Brand Default`}
            onUnitChange={u => updateBatch({ [unitKey]: u })}
            onChange={s => updateBatch({
                [k('top')]: s.top,
                [k('right')]: s.right,
                [k('bottom')]: s.bottom,
                [k('left')]: s.left,
                [`${prefix ? prefix : ''}${type}Y`]: undefined,
                [`${prefix ? prefix : ''}${type}X`]: undefined,
            })}
        />
    );
}

// ── 5. ShadowControl ──────────────────────────────────────────────────────

export function ShadowControl({
    label = 'Box Shadow',
    prefix,
    val,
    update,
    updateBatch,
    styleGuide,
    defaultColor = 'rgba(0,0,0,0.15)',
    value,
    onChange,
    element,
    isLocallySet,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const k = (prop) => {
        if (!prefix) return prop;
        return `${prefix}${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
    };

    const isPrefixMode = prefix !== undefined && val !== undefined;

    const shadowKeys = [
        k('shadowColor'), k('shadowH'), k('shadowV'), k('shadowBlur'),
        k('shadowSpread'), k('shadowInset')
    ];
    const isOverridden = isLocallySet
        ? shadowKeys.some(key => isLocallySet(key))
        : (element ? shadowKeys.some(key => element[key] !== undefined) : false);

    const shadow = isPrefixMode ? {
        color: val(k('shadowColor'), defaultColor),
        h: val(k('shadowH'), 0),
        v: val(k('shadowV'), 8),
        blur: val(k('shadowBlur'), 24),
        spread: val(k('shadowSpread'), 0),
    } : (typeof value === 'object' && value !== null ? value : {});

    const set = (prop, propVal) => {
        if (isPrefixMode) {
            const keyMap = {
                color: k('shadowColor'),
                h: k('shadowH'),
                v: k('shadowV'),
                blur: k('shadowBlur'),
                spread: k('shadowSpread'),
            };
            const updateKey = keyMap[prop] || k(prop);
            if (update) update(updateKey, propVal);
            else if (updateBatch) updateBatch({ [updateKey]: propVal });
        } else if (onChange) {
            onChange({ ...shadow, [prop]: propVal });
        }
    };

    const handleReset = () => {
        if (isPrefixMode && updateBatch) {
            const resetObj = {};
            shadowKeys.forEach(kName => { resetObj[kName] = undefined; });
            updateBatch(resetObj);
        } else if (onChange) {
            onChange({});
        }
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-neutral-700 text-xs truncate">{label}</span>
                    <InheritanceBadge
                        isOverridden={isOverridden}
                        onReset={handleReset}
                        label="Brand"
                        resetTitle="Reset Shadow to Brand Default"
                    />
                </div>
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
                <div className="p-3 mt-1.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5 shadow-sm text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
                        <span className="font-bold text-[10px] text-neutral-800 uppercase tracking-wider">Shadow Options</span>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-[10px] font-semibold text-neutral-500 hover:text-red-600 flex items-center gap-1 transition"
                        >
                            <RotateCcw className="h-3 w-3" /> Reset to Brand
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color</label>
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
                                <label className="block text-[10px] font-semibold text-neutral-500">{f.label}</label>
                                <input
                                    type="number"
                                    value={shadow[f.key] ?? f.def}
                                    onChange={e => set(f.key, Number(e.target.value))}
                                    className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 font-bold text-xs text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
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

export function BorderControl({
    label = 'Border',
    prefix,
    val,
    update,
    updateBatch,
    styleGuide,
    defaultType = 'Default',
    defaultWidth = 1,
    defaultColor = '#d1d5db',
    value,
    onChange,
    element,
    isLocallySet,
}) {
    const k = (prop) => {
        if (!prefix) return prop;
        return `${prefix}${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
    };

    const isPrefixMode = prefix !== undefined && val !== undefined;

    const borderKeys = [
        k('borderStyle'), k('borderWidth'), k('borderWidthUnit'), k('borderColor')
    ];
    const isOverridden = isLocallySet
        ? borderKeys.some(key => isLocallySet(key))
        : (element ? borderKeys.some(key => element[key] !== undefined) : false);

    const border = isPrefixMode ? {
        type: val(k('borderStyle'), defaultType),
        width: val(k('borderWidth'), defaultWidth),
        widthUnit: val(k('borderWidthUnit'), 'px'),
        color: val(k('borderColor'), defaultColor),
    } : (typeof value === 'object' && value !== null ? value : {});

    const set = (prop, propVal) => {
        if (isPrefixMode) {
            const keyMap = {
                type: k('borderStyle'),
                width: k('borderWidth'),
                widthUnit: k('borderWidthUnit'),
                color: k('borderColor'),
            };
            const updateKey = keyMap[prop] || k(prop);
            const finalVal = (prop === 'type' && propVal === 'Default') ? 'none' : propVal;
            if (update) update(updateKey, finalVal);
            else if (updateBatch) updateBatch({ [updateKey]: finalVal });
        } else if (onChange) {
            onChange({ ...border, [prop]: propVal });
        }
    };

    const handleReset = () => {
        if (isPrefixMode && updateBatch) {
            const resetObj = {};
            borderKeys.forEach(kName => { resetObj[kName] = undefined; });
            updateBatch(resetObj);
        } else if (onChange) {
            onChange({});
        }
    };

    const hasType = border.type && border.type !== 'none' && border.type !== 'Default';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold text-neutral-700 text-xs truncate">{label}</span>
                    <InheritanceBadge
                        isOverridden={isOverridden}
                        onReset={handleReset}
                        label="Brand"
                        resetTitle="Reset Border to Brand Default"
                    />
                </div>
                <select
                    value={border.type || 'Default'}
                    onChange={e => set('type', e.target.value)}
                    className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-800 bg-white focus:outline-none focus:border-brand-500 shadow-2xs cursor-pointer"
                >
                    <option value="Default">None / Default</option>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                    <option value="groove">Groove</option>
                    <option value="ridge">Ridge</option>
                </select>
            </div>

            {hasType && (
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Width</label>
                        <SizeInput
                            value={border.width ?? 1}
                            unit={border.widthUnit || 'px'}
                            units={['px', 'em', 'rem']}
                            onChange={v => set('width', v)}
                            onUnitChange={u => set('widthUnit', u)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Color</label>
                        <ColorPickerInput
                            value={border.color || '#d1d5db'}
                            onChange={v => set('color', v)}
                            styleGuide={styleGuide}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── 7. AccordionSection ────────────────────────────────────────────────────

export function AccordionSection({
    title,
    icon,
    defaultOpen = false,
    isOpen: controlledOpen,
    onToggle,
    badge,
    hasOverride = false,
    children,
    className = '',
}) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

    const handleToggle = () => {
        if (onToggle) onToggle(!isOpen);
        else setUncontrolledOpen(!uncontrolledOpen);
    };

    return (
        <div className={`rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden transition-all ${className}`}>
            <button
                type="button"
                onClick={handleToggle}
                className={`w-full flex items-center justify-between p-2.5 transition text-left cursor-pointer select-none ${
                    isOpen ? 'bg-neutral-50 border-b border-neutral-200 font-bold text-neutral-900' : 'bg-white hover:bg-neutral-50 text-neutral-700 font-semibold'
                }`}
            >
                <span className="flex items-center gap-2 text-xs truncate">
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-brand-600 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
                    {icon && <span className="text-neutral-500">{icon}</span>}
                    <span className="truncate">{title}</span>
                    {hasOverride && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" title="Custom overrides active in this section" />
                    )}
                </span>
                {(typeof badge === 'string' || typeof badge === 'number') && badge !== '' && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200 truncate max-w-[120px]">
                        {badge}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="p-3 space-y-3 bg-white">
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
                            ? 'bg-white text-brand-600 shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    {tab === 'Hover' ? 'Hover ✨' : tab}
                </button>
            ))}
        </div>
    );
}

// ── 9. HoverAnimationSelect ────────────────────────────────────────────────

export function HoverAnimationSelect({ value = 'none', onChange }) {
    return (
        <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Hover Animation</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 text-xs font-medium text-neutral-800 focus:outline-none focus:border-brand-500"
            >
                <option value="none">None</option>
                <option value="lift">↗ Lift Up (-3px)</option>
                <option value="grow">🔍 Grow / Scale Up (1.03x)</option>
                <option value="shrink">🔬 Shrink (0.97x)</option>
                <option value="glow">✨ Accent Glow</option>
                <option value="pulse">💓 Pulse</option>
            </select>
        </div>
    );
}

// ── 10. TransitionControl ──────────────────────────────────────────────────

export function TransitionControl({ duration = 200, timing = 'ease', onDurationChange, onTimingChange }) {
    return (
        <div className="space-y-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Transition Duration & Curve</label>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-500 font-medium">Duration (ms)</span>
                    <input
                        type="number"
                        min="50"
                        max="1500"
                        step="50"
                        value={duration}
                        onChange={e => onDurationChange(Number(e.target.value))}
                        className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 text-xs font-bold text-neutral-800"
                    />
                </div>
                <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-500 font-medium">Easing Curve</span>
                    <select
                        value={timing}
                        onChange={e => onTimingChange(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 bg-white p-1.5 text-xs font-medium text-neutral-800"
                    >
                        <option value="ease">Ease</option>
                        <option value="ease-in-out">Ease In-Out</option>
                        <option value="ease-out">Ease Out</option>
                        <option value="linear">Linear</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

// ── 11. BackgroundControl (Solid, Gradient, Image for Normal & Hover) ───────

export function BackgroundControl({
    label = 'Background',
    prefix = '',
    val,
    update,
    updateBatch,
    styleGuide,
    defaultColor = '#ffffff',
    element,
    isLocallySet,
}) {
    const k = (prop) => {
        if (!prefix) return prop;
        return `${prefix}${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
    };

    const isPrefixMode = prefix !== undefined && val !== undefined;

    const bgKeys = [
        k('bgType'), k('bgColor'), k('bgImage'), k('bgSize'),
        k('bgPosition'), k('bgRepeat'), k('bgOverlay'),
        k('gradientType'), k('gradientAngle'), k('gradientStops'),
        k('gradientColor1'), k('gradientColor2')
    ];
    const isOverridden = isLocallySet
        ? bgKeys.some(key => isLocallySet(key))
        : (element ? bgKeys.some(key => element[key] !== undefined) : false);

    const handleReset = () => {
        if (updateBatch) {
            const resetObj = {};
            bgKeys.forEach(kName => { resetObj[kName] = undefined; });
            updateBatch(resetObj);
        }
    };

    const bgType = val(k('bgType'), 'solid');
    const bgColor = val(k('bgColor'), defaultColor);
    const bgImage = val(k('bgImage'), '');
    const bgSize = val(k('bgSize'), 'cover');
    const bgPosition = val(k('bgPosition'), 'center center');
    const bgRepeat = val(k('bgRepeat'), 'no-repeat');
    const bgOverlay = val(k('bgOverlay'), '');

    const gType = val(k('gradientType'), 'linear');
    const angle = val(k('gradientAngle'), 135);
    const stops = val(k('gradientStops'), [
        { color: val(k('gradientColor1'), '#6366f1'), pos: 0 },
        { color: val(k('gradientColor2'), '#ec4899'), pos: 100 },
    ]);

    const stopsStr = stops.slice().sort((a, b) => a.pos - b.pos).map(s => `${s.color} ${s.pos}%`).join(', ');
    const previewCss = gType === 'radial'
        ? `radial-gradient(circle, ${stopsStr})`
        : `linear-gradient(${angle}deg, ${stopsStr})`;

    const updateStops = (next) => update(k('gradientStops'), next);

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

    const updateStop = (idx, field, value) => {
        updateStops(stops.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                    <label className="block text-[11px] font-bold text-neutral-700">{label}</label>
                    <InheritanceBadge
                        isOverridden={isOverridden}
                        onReset={handleReset}
                        label="Brand"
                        resetTitle="Reset Background to Brand Default"
                    />
                </div>
            </div>

            {/* Pill Group: Solid / Gradient / Image */}
            <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-xl">
                {[
                    { id: 'solid', label: '● Solid' },
                    { id: 'gradient', label: '◑ Gradient' },
                    { id: 'image', label: '⬜ Image' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => update(k('bgType'), tab.id)}
                        className={`py-1 text-xs font-semibold rounded-lg transition ${
                            bgType === tab.id
                                ? 'bg-white text-brand-600 shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Solid Color Picker */}
            {bgType === 'solid' && (
                <ColorPickerInput
                    value={bgColor}
                    onChange={v => update(k('bgColor'), v)}
                    styleGuide={styleGuide}
                />
            )}

            {/* Gradient Editor */}
            {bgType === 'gradient' && (
                <div className="space-y-2.5 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="flex gap-1 p-1 rounded-lg bg-neutral-100">
                        {[
                            { value: 'linear', label: '↗ Linear' },
                            { value: 'radial', label: '◎ Radial' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => update(k('gradientType'), opt.value)}
                                className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${
                                    gType === opt.value
                                        ? 'bg-white text-brand-600 shadow-xs border border-neutral-200'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Gradient Preview Bar */}
                    <div
                        className="w-full h-7 rounded-lg border border-neutral-200 shadow-inner"
                        style={{ background: previewCss }}
                    />

                    {/* Color Stops */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Color Stops</span>
                            <button
                                type="button"
                                onClick={addStop}
                                className="flex items-center gap-0.5 text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-md border border-brand-200 transition"
                            >
                                + Add Stop
                            </button>
                        </div>

                        {stops.map((stop, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-neutral-200 shadow-2xs">
                                <ColorPickerInput
                                    value={stop.color}
                                    onChange={v => updateStop(idx, 'color', v)}
                                    styleGuide={styleGuide}
                                    className="flex-1"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] text-neutral-400 font-semibold">Pos:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={stop.pos}
                                        onChange={e => updateStop(idx, 'pos', Math.max(0, Math.min(100, Number(e.target.value))))}
                                        className="w-12 rounded border border-neutral-300 p-1 text-center font-bold text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    />
                                    <span className="text-[10px] font-bold text-neutral-500">%</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeStop(idx)}
                                    disabled={stops.length <= 2}
                                    className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-25 disabled:cursor-not-allowed transition shrink-0 text-xs font-bold"
                                    title={stops.length <= 2 ? 'Need at least 2 stops' : `Remove stop ${idx + 1}`}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Angle (linear only) */}
                    {gType === 'linear' && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-neutral-600">
                                <span>Gradient Angle</span>
                                <span className="text-brand-600 font-bold">{angle}°</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={angle}
                                    onChange={e => update(k('gradientAngle'), Number(e.target.value))}
                                    className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                                />
                                <input
                                    type="number"
                                    value={angle}
                                    onChange={e => update(k('gradientAngle'), Number(e.target.value))}
                                    className="w-14 rounded-lg border border-neutral-300 p-1 text-center font-bold text-xs bg-white"
                                />
                            </div>
                            <div className="flex gap-1 flex-wrap pt-0.5">
                                {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                                    <button
                                        key={a}
                                        type="button"
                                        onClick={() => update(k('gradientAngle'), a)}
                                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition ${
                                            angle === a
                                                ? 'bg-brand-600 text-white'
                                                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    >
                                        {a}°
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Image Background */}
            {bgType === 'image' && (
                <div className="space-y-2 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="space-y-0.5">
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Image URL</label>
                        <input
                            type="text"
                            value={bgImage}
                            onChange={e => update(k('bgImage'), e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-brand-500 shadow-2xs"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Size</label>
                            <select
                                value={bgSize}
                                onChange={e => update(k('bgSize'), e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium"
                            >
                                <option value="cover">Cover</option>
                                <option value="contain">Contain</option>
                                <option value="auto">Auto</option>
                                <option value="100% 100%">Stretch (100%)</option>
                            </select>
                        </div>
                        <div className="space-y-0.5">
                            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Position</label>
                            <select
                                value={bgPosition}
                                onChange={e => update(k('bgPosition'), e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium"
                            >
                                <option value="center center">Center</option>
                                <option value="top center">Top Center</option>
                                <option value="bottom center">Bottom Center</option>
                                <option value="left center">Left</option>
                                <option value="right center">Right</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Repeat</label>
                        <select
                            value={bgRepeat}
                            onChange={e => update(k('bgRepeat'), e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium"
                        >
                            <option value="no-repeat">No Repeat</option>
                            <option value="repeat">Repeat (Tile)</option>
                            <option value="repeat-x">Repeat Horizontal</option>
                            <option value="repeat-y">Repeat Vertical</option>
                        </select>
                    </div>
                    <div className="space-y-0.5">
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Overlay Tint Color</label>
                        <ColorPickerInput
                            value={bgOverlay}
                            onChange={v => update(k('bgOverlay'), v)}
                            styleGuide={styleGuide}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}


