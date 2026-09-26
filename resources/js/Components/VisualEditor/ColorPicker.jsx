import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Database, Pipette, X, Link, Unlink, Check } from 'lucide-react';

// ── Helper to slugify string for CSS var ───────────────────────────────

function slugify(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Resolve Variable Color to Hex for Picker ──────────────────────────

export function resolveColorValue(val, styleGuide) {
    if (!val) return '#ffffff';
    val = String(val).trim();
    if (val.startsWith('var(')) {
        const match = val.match(/var\((--[^)]+)\)/);
        if (match) {
            const varName = match[1];
            if (varName === '--color-primary') return styleGuide?.systemColors?.primary || '#6EC1E4';
            if (varName === '--color-secondary') return styleGuide?.systemColors?.secondary || '#54595F';
            if (varName === '--color-text') return styleGuide?.systemColors?.text || '#7A7A7A';
            if (varName === '--color-accent') return styleGuide?.systemColors?.accent || '#61CE70';
            const customList = styleGuide?.customColors || [];
            const found = customList.find(c => `--color-${c.id}` === varName || `--color-${slugify(c.name)}` === varName);
            if (found) return found.value || '#3B82F6';
        }
    }
    return val;
}

export function getVariableLabel(val, styleGuide) {
    if (!val || typeof val !== 'string' || !val.startsWith('var(')) return null;
    const match = val.match(/var\((--[^)]+)\)/);
    if (!match) return null;
    const varName = match[1];
    if (varName === '--color-primary') return 'Primary';
    if (varName === '--color-secondary') return 'Secondary';
    if (varName === '--color-text') return 'Text';
    if (varName === '--color-accent') return 'Accent';
    const customList = styleGuide?.customColors || [];
    const found = customList.find(c => `--color-${c.id}` === varName || `--color-${slugify(c.name)}` === varName);
    return found ? found.name : 'Variable';
}

// ── Color Conversion Utilities ─────────────────────────────────────────

function hsvToRgb(h, s, v) {
    let r, g, b;
    let i = Math.floor(h / 60) % 6;
    let f = h / 60 - Math.floor(h / 60);
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: r = 0; g = 0; b = 0;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: h = 0;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s, v };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: h = 0;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

function rgbToHex(r, g, b, a = 1) {
    const toHex = n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    if (a < 0.999) {
        const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`.toUpperCase();
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function parseColorString(str) {
    if (!str) return { r: 255, g: 255, b: 255, a: 1, h: 0, s: 0, v: 1 };
    str = String(str).trim();
    // HEX / HEXA
    if (str.startsWith('#')) {
        let hex = str.slice(1);
        if (hex.length === 3 || hex.length === 4) {
            hex = hex.split('').map(c => c + c).join('');
        }
        let r = parseInt(hex.slice(0, 2), 16) || 0;
        let g = parseInt(hex.slice(2, 4), 16) || 0;
        let b = parseInt(hex.slice(4, 6), 16) || 0;
        let a = hex.length === 8 ? (parseInt(hex.slice(6, 8), 16) / 255) : 1;
        let hsv = rgbToHsv(r, g, b);
        return { r, g, b, a: Number(a.toFixed(2)), ...hsv };
    }
    // RGBA / RGB
    let rgbaMatch = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (rgbaMatch) {
        let r = Math.min(255, parseInt(rgbaMatch[1], 10));
        let g = Math.min(255, parseInt(rgbaMatch[2], 10));
        let b = Math.min(255, parseInt(rgbaMatch[3], 10));
        let a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
        let hsv = rgbToHsv(r, g, b);
        return { r, g, b, a: Number(a.toFixed(2)), ...hsv };
    }
    // HSLA / HSL
    let hslaMatch = str.match(/hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (hslaMatch) {
        let h = parseInt(hslaMatch[1], 10);
        let s = parseFloat(hslaMatch[2]);
        let l = parseFloat(hslaMatch[3]);
        let a = hslaMatch[4] !== undefined ? parseFloat(hslaMatch[4]) : 1;
        let { r, g, b } = hslToRgb(h, s, l);
        let hsv = rgbToHsv(r, g, b);
        return { r, g, b, a: Number(a.toFixed(2)), h: hsv.h, s: hsv.s, v: hsv.v };
    }
    return { r: 255, g: 255, b: 255, a: 1, h: 0, s: 0, v: 1 };
}

function formatColorOutput(parsed, format) {
    const { r, g, b, a, h } = parsed;
    if (format === 'RGBA') {
        return a < 0.999 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    }
    if (format === 'HSLA') {
        const { s, l } = rgbToHsl(r, g, b);
        return a < 0.999 ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`;
    }
    // Default HEX
    return rgbToHex(r, g, b, a);
}

// ── COLOR PICKER POPOVER COMPONENT (Elementor / Figma Styled) ───────────

export function ColorPickerPopover({ initialValue = '#ffffff', onChange, onClose, styleGuide }) {
    const isVariable = typeof initialValue === 'string' && initialValue.startsWith('var(');
    const resolvedColor = resolveColorValue(initialValue, styleGuide);
    const variableName = getVariableLabel(initialValue, styleGuide);

    const [parsed, setParsed] = useState(() => parseColorString(resolvedColor));
    const [format, setFormat] = useState('HEX'); // 'HEX' | 'RGBA' | 'HSLA'
    const [inputText, setInputText] = useState(() => isVariable ? initialValue : formatColorOutput(parseColorString(resolvedColor), 'HEX'));
    const [showPalette, setShowPalette] = useState(false);
    const canvasRef = useRef(null);
    const isDragging = useRef(false);

    // Sync input text when color state changes from picker interaction
    const updateColor = (newParsed, updateText = true) => {
        setParsed(newParsed);
        const formatted = formatColorOutput(newParsed, format);
        if (updateText) setInputText(formatted);
        onChange(formatted);
    };

    // Update format
    const handleFormatChange = (newFormat) => {
        setFormat(newFormat);
        if (!inputText.startsWith('var(')) {
            setInputText(formatColorOutput(parsed, newFormat));
        }
    };

    // Saturation-Value Canvas Dragging
    const handleCanvasPointer = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

        const s = x / rect.width;
        const v = 1 - (y / rect.height);
        const { r, g, b } = hsvToRgb(parsed.h, s, v);

        updateColor({ ...parsed, r, g, b, s, v });
    };

    const onPointerDown = (e) => {
        isDragging.current = true;
        handleCanvasPointer(e);
    };

    useEffect(() => {
        const onPointerMove = (e) => {
            if (isDragging.current) handleCanvasPointer(e);
        };
        const onPointerUp = () => {
            isDragging.current = false;
        };
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);
        window.addEventListener('touchmove', onPointerMove);
        window.addEventListener('touchend', onPointerUp);
        return () => {
            window.removeEventListener('mousemove', onPointerMove);
            window.removeEventListener('mouseup', onPointerUp);
            window.removeEventListener('touchmove', onPointerMove);
            window.removeEventListener('touchend', onPointerUp);
        };
    }, [parsed]);

    // Eyedropper
    const handleEyedropper = async () => {
        if ('EyeDropper' in window) {
            try {
                const eyeDropper = new window.EyeDropper();
                const result = await eyeDropper.open();
                if (result?.sRGBHex) {
                    const p = parseColorString(result.sRGBHex);
                    updateColor(p);
                }
            } catch (e) {
                // cancelled
            }
        }
    };

    // Handle text input change directly
    const handleTextInput = (e) => {
        const val = e.target.value;
        setInputText(val);
        if (!val.startsWith('var(')) {
            const p = parseColorString(val);
            setParsed(p);
        }
        onChange(val);
    };

    // Background color of current Hue
    const hueRgb = hsvToRgb(parsed.h, 1, 1);
    const hueBg = `rgb(${hueRgb.r}, ${hueRgb.g}, ${hueRgb.b})`;
    const currentRgbaStr = `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${parsed.a})`;

    // System Colors & Custom Colors with Variable Binding
    const systemColors = [
        { name: 'Primary', var: 'var(--color-primary)', value: styleGuide?.systemColors?.primary || '#6EC1E4' },
        { name: 'Secondary', var: 'var(--color-secondary)', value: styleGuide?.systemColors?.secondary || '#54595F' },
        { name: 'Text', var: 'var(--color-text)', value: styleGuide?.systemColors?.text || '#7A7A7A' },
        { name: 'Accent', var: 'var(--color-accent)', value: styleGuide?.systemColors?.accent || '#61CE70' },
    ];
    const customColors = (styleGuide?.customColors || []).map(c => ({
        name: c.name || 'Custom',
        var: `var(--color-${c.id})`,
        value: c.value || '#3B82F6',
    }));

    const allPresets = [...systemColors, ...customColors];

    return (
        <div className="w-[264px] bg-white text-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 p-3 select-none text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-neutral-800 text-xs">Color</span>
                    {isVariable && (
                        <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-semibold border border-brand-200/80 flex items-center gap-1 truncate max-w-[110px]" title={variableName}>
                            <Link className="h-2.5 w-2.5 shrink-0" /> {variableName}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {/* Reset */}
                    <button
                        type="button"
                        onClick={() => {
                            const p = parseColorString(resolveColorValue(initialValue, styleGuide));
                            setParsed(p);
                            setInputText(initialValue);
                            onChange(initialValue);
                        }}
                        className="p-1 hover:bg-neutral-100 rounded-md text-neutral-400 hover:text-neutral-700 transition"
                        title="Reset color"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </button>

                    {/* Global Palette / Variables Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowPalette(!showPalette)}
                        className={`p-1 rounded-md transition ${
                            showPalette
                                ? 'bg-brand-600 text-white shadow-xs'
                                : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800'
                        }`}
                        title="Brand & Global Variables"
                    >
                        <Database className="h-3.5 w-3.5" />
                    </button>

                    {/* Eyedropper */}
                    {'EyeDropper' in window && (
                        <button
                            type="button"
                            onClick={handleEyedropper}
                            className="p-1 hover:bg-neutral-100 rounded-md text-neutral-500 hover:text-neutral-800 transition"
                            title="Pick color from screen"
                        >
                            <Pipette className="h-3.5 w-3.5" />
                        </button>
                    )}

                    {/* Close */}
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 hover:bg-neutral-100 rounded-md text-neutral-400 hover:text-neutral-700 transition ml-0.5"
                            title="Close"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Variable Status Banner */}
            {isVariable && !showPalette && (
                <div className="mt-2 p-2 rounded-lg bg-brand-50/80 border border-brand-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-brand-900 font-medium">
                        <Link className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                        <span>Linked to <strong>{variableName}</strong></span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const staticHex = resolveColorValue(initialValue, styleGuide);
                            setInputText(staticHex);
                            onChange(staticHex);
                        }}
                        className="text-[10px] text-brand-700 hover:text-brand-900 underline flex items-center gap-0.5 font-semibold"
                        title="Detach from global variable"
                    >
                        <Unlink className="h-3 w-3" /> Detach
                    </button>
                </div>
            )}

            {/* Full Global Variables Palette Drawer */}
            {showPalette ? (
                <div className="py-2 space-y-3">
                    <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">System Variables</span>
                        <div className="grid grid-cols-2 gap-1.5">
                            {systemColors.map((sc, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        onChange(sc.var);
                                        setInputText(sc.var);
                                        setParsed(parseColorString(sc.value));
                                        setShowPalette(false);
                                    }}
                                    className={`flex items-center gap-2 p-1.5 rounded-lg transition border text-left ${
                                        initialValue === sc.var
                                            ? 'bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500'
                                            : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700'
                                    }`}
                                >
                                    <span className="h-4 w-4 rounded-md border border-neutral-300 shrink-0 shadow-2xs" style={{ backgroundColor: sc.value }} />
                                    <div className="truncate">
                                        <div className="text-[11px] font-bold truncate">{sc.name}</div>
                                        <div className="text-[9px] font-mono text-neutral-400 truncate">{sc.value}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {customColors.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Custom Brand Colors</span>
                            <div className="grid grid-cols-2 gap-1.5">
                                {customColors.map((cc, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            onChange(cc.var);
                                            setInputText(cc.var);
                                            setParsed(parseColorString(cc.value));
                                            setShowPalette(false);
                                        }}
                                        className={`flex items-center gap-2 p-1.5 rounded-lg transition border text-left ${
                                            initialValue === cc.var
                                                ? 'bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500'
                                                : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700'
                                        }`}
                                    >
                                        <span className="h-4 w-4 rounded-md border border-neutral-300 shrink-0 shadow-2xs" style={{ backgroundColor: cc.value }} />
                                        <div className="truncate">
                                            <div className="text-[11px] font-bold truncate">{cc.name}</div>
                                            <div className="text-[9px] font-mono text-neutral-400 truncate">{cc.value}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* 2D Canvas Color Field */}
                    <div
                        ref={canvasRef}
                        onMouseDown={onPointerDown}
                        onTouchStart={onPointerDown}
                        className="relative w-full h-[130px] rounded-xl mt-2 cursor-crosshair overflow-hidden border border-neutral-200 shadow-inner"
                        style={{
                            backgroundColor: hueBg,
                            backgroundImage: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
                        }}
                    >
                        {/* Circle Handle */}
                        <div
                            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/20"
                            style={{
                                left: `${parsed.s * 100}%`,
                                top: `${(1 - parsed.v) * 100}%`,
                                backgroundColor: currentRgbaStr,
                            }}
                        />
                    </div>

                    {/* Sliders (Hue + Alpha) */}
                    <div className="space-y-2 my-2.5">
                        {/* Hue Spectrum Slider */}
                        <div className="relative flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={parsed.h}
                                onChange={(e) => {
                                    const h = Number(e.target.value);
                                    const { r, g, b } = hsvToRgb(h, parsed.s, parsed.v);
                                    updateColor({ ...parsed, h, r, g, b });
                                }}
                                className="w-full h-3 rounded-full appearance-none cursor-pointer border border-neutral-200 shadow-2xs"
                                style={{
                                    background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                                }}
                            />
                        </div>

                        {/* Alpha Slider */}
                        <div className="relative flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={parsed.a}
                                onChange={(e) => {
                                    const a = Number(e.target.value);
                                    updateColor({ ...parsed, a });
                                }}
                                className="w-full h-3 rounded-full appearance-none cursor-pointer border border-neutral-200 shadow-2xs"
                                style={{
                                    background: `linear-gradient(to right, transparent, ${hueBg}), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23e5e7eb' d='0 0h4v4H0zM4 4h4v4H4z'/%3E%3C/svg%3E")`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Format Switcher & Text input Row */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-100">
                        {/* Format Select Dropdown */}
                        <select
                            value={format}
                            onChange={(e) => handleFormatChange(e.target.value)}
                            className="rounded-lg border border-neutral-300 bg-neutral-50 px-1.5 py-1 text-[10px] font-bold text-neutral-700 focus:outline-none focus:border-brand-500 cursor-pointer shadow-2xs"
                        >
                            <option value="HEX">HEX</option>
                            <option value="RGBA">RGB</option>
                            <option value="HSLA">HSL</option>
                        </select>

                        {/* Hex/Value Input */}
                        <input
                            type="text"
                            value={inputText}
                            onChange={handleTextInput}
                            className="flex-1 rounded-lg border border-neutral-300 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-neutral-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-2xs"
                        />

                        {/* Opacity % */}
                        <div className="px-1.5 py-1 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-[10px] font-bold text-neutral-600 shadow-2xs">
                            {Math.round(parsed.a * 100)}%
                        </div>
                    </div>

                    {/* Quick Preset Swatches */}
                    {allPresets.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-neutral-100 flex items-center gap-1.5 overflow-x-auto pb-0.5">
                            {allPresets.slice(0, 7).map((p, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        onChange(p.var);
                                        setInputText(p.var);
                                        setParsed(parseColorString(p.value));
                                    }}
                                    className={`h-5 w-5 rounded-full border border-neutral-300 shadow-2xs hover:scale-110 transition shrink-0 relative flex items-center justify-center ${
                                        initialValue === p.var ? 'ring-2 ring-brand-500 ring-offset-1' : ''
                                    }`}
                                    style={{ backgroundColor: p.value }}
                                    title={`${p.name} (${p.var})`}
                                >
                                    {initialValue === p.var && (
                                        <Check className="h-2.5 w-2.5 text-white drop-shadow-md" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ── COLOR PICKER INLINE INPUT COMPONENT ────────────────────────────────

export default function ColorPickerInput({ value = '#ffffff', onChange, styleGuide, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);
    const containerRef = useRef(null);

    const isVariable = typeof value === 'string' && value.startsWith('var(');
    const resolvedColor = resolveColorValue(value, styleGuide);
    const variableLabel = getVariableLabel(value, styleGuide);

    // Close when clicking outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (
                popoverRef.current && !popoverRef.current.contains(e.target) &&
                containerRef.current && !containerRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={containerRef} className={`relative flex items-center gap-2 w-full ${className}`}>
            {/* Color Swatch Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`h-8 w-8 cursor-pointer rounded-lg border p-0.5 shadow-2xs transition hover:scale-105 shrink-0 overflow-hidden relative ${
                    isOpen ? 'ring-2 ring-brand-500 border-brand-500' : 'border-neutral-300 hover:border-neutral-400'
                }`}
                style={{
                    background: `linear-gradient(${resolvedColor}, ${resolvedColor}), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23ccc' d='0 0h4v4H0zM4 4h4v4H4z'/%3E%3C/svg%3E")`
                }}
                title={isVariable ? `Global Variable: ${variableLabel}` : "Click to open Color Picker"}
            />

            {/* Editable Text Input */}
            <div className="relative flex-1 min-w-0">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs ${
                        isVariable ? 'border-brand-400 bg-brand-50/50 text-brand-900 font-bold' : 'border-neutral-300 bg-white'
                    }`}
                    placeholder="#ffffff or var(--color-primary)"
                />
                {isVariable && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-brand-600 text-white text-[9px] font-sans font-bold flex items-center gap-1 pointer-events-none">
                        <Link className="h-2.5 w-2.5" /> {variableLabel}
                    </span>
                )}
            </div>

            {/* Popover */}
            {isOpen && (
                <div ref={popoverRef} className="absolute left-0 top-10 z-50">
                    <ColorPickerPopover
                        initialValue={value}
                        onChange={onChange}
                        onClose={() => setIsOpen(false)}
                        styleGuide={styleGuide}
                    />
                </div>
            )}
        </div>
    );
}
