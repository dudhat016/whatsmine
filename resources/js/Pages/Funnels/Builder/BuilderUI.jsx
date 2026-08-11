/**
 * BuilderUI — compact-sized wrappers over the project's design system tokens.
 *
 * These apply the same border-radius, border-color, focus-ring, and shadow
 * tokens used in Components/ui/ (Input.jsx, Select.jsx, Toggle.jsx, Button.jsx)
 * but at text-xs / tighter padding suitable for the sidebar panels.
 */
import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Toggle } from '@/Components/ui';

// ─── Shared token classes ────────────────────────────────────────────────────
const BASE =
    'w-full rounded-soft border border-soft border-neutral-300 bg-white ' +
    'text-neutral-900 shadow-inner transition duration-150 placeholder:text-neutral-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ' +
    'dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder:text-neutral-500';

// ─── Text Input ──────────────────────────────────────────────────────────────
export function PanelInput({ className = '', ...props }) {
    return (
        <input
            className={`${BASE} px-2.5 py-1.5 text-xs font-medium ${className}`}
            {...props}
        />
    );
}

// ─── Textarea ────────────────────────────────────────────────────────────────
export function PanelTextarea({ className = '', ...props }) {
    return (
        <textarea
            className={`${BASE} px-2.5 py-1.5 text-xs font-medium resize-none ${className}`}
            {...props}
        />
    );
}

// ─── Select / Dropdown ───────────────────────────────────────────────────────
export function PanelSelect({ className = '', children, ...props }) {
    return (
        <select
            className={`${BASE} px-2.5 py-1.5 text-xs font-medium cursor-pointer ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}

// ─── Number input (no spinner, centered) ─────────────────────────────────────
export function PanelNumber({ className = '', ...props }) {
    return (
        <input
            type="number"
            className={`w-full rounded-soft border border-soft border-neutral-300 bg-white
                        text-neutral-900 shadow-inner text-xs font-bold text-center
                        px-1.5 py-1.5 transition duration-150
                        focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
                        dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 ${className}`}
            {...props}
        />
    );
}

// ─── Toggle (re-exports project Toggle, zero extra styling) ───────────────────
export function PanelToggle({ value, onChange, label }) {
    return <Toggle checked={value} onChange={onChange} label={label} />;
}

// ─── Consistent section heading + optional reset button ───────────────────────
export function SectionTitle({ children, onReset, resetTitle, className = '' }) {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            <h4 className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                {children}
            </h4>
            {onReset && (
                <button
                    type="button"
                    onClick={onReset}
                    className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                    title={resetTitle}
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}

// ─── Consistent field label ───────────────────────────────────────────────────
export function FieldLabel({ children, className = '' }) {
    return (
        <label className={`block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-0.5 ${className}`}>
            {children}
        </label>
    );
}

// ─── Pill / segmented toggle group (replaces raw button grids) ────────────────
export function PillGroup({ options, value, onChange, cols }) {
    return (
        <div className={`grid gap-0.5 p-1 rounded-soft bg-neutral-100 border border-soft border-neutral-200 ${cols ? `grid-cols-${cols}` : 'flex'}`}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    title={opt.title}
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-all ${
                        value === opt.value
                            ? 'bg-white text-brand-600 shadow-soft border border-brand-200'
                            : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

// ─── Icon button group (flex direction, justify, align) ───────────────────────
export function IconButtonGroup({ options, value, onChange, cols = 4 }) {
    return (
        <div className={`grid grid-cols-${cols} gap-0.5 p-1 rounded-soft bg-neutral-100 border border-soft border-neutral-200`}>
            {options.map(opt => (
                <button
                    key={opt.key}
                    type="button"
                    title={opt.title}
                    onClick={() => onChange(opt.key)}
                    className={`py-1.5 text-xs font-extrabold rounded transition flex items-center justify-center ${
                        value === opt.key
                            ? 'bg-neutral-800 text-white shadow-soft'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                    }`}
                >
                    {opt.icon}
                </button>
            ))}
        </div>
    );
}
