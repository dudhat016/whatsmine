import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

/**
 * Reusable MultiSelect Dropdown component — design system compliant tag pill selector.
 *
 * Props:
 *   label        optional header label text
 *   value        array of selected values e.g. [1, 2] or ['a', 'b']
 *   onChange     (selectedValues: Array) => void
 *   options      Array of { value, label } objects or strings
 *   placeholder  trigger placeholder text (default: 'Select options...')
 *   error        shows error text/styling when present
 *   disabled     disables interaction
 *   className    applied to root container
 */
export default function MultiSelect({
    label,
    value = [],
    onChange,
    options = [],
    placeholder = 'Select options...',
    error,
    disabled = false,
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    // Standardize options into array of { value, label }
    const normalizedOptions = options.map(opt =>
        typeof opt === 'object' && opt !== null ? opt : { value: opt, label: String(opt) }
    );

    // Close on click outside (works in modals, portals & touch devices)
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('touchstart', handleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('touchstart', handleClickOutside, true);
        };
    }, []);

    const selectedValues = Array.isArray(value) ? value : [];

    const handleToggle = (optValue) => {
        if (disabled) return;
        const exists = selectedValues.includes(optValue);
        let updated;
        if (exists) {
            updated = selectedValues.filter(v => v !== optValue);
        } else {
            updated = [...selectedValues, optValue];
        }
        if (onChange) {
            onChange(updated);
        }
    };

    const handleRemove = (e, optValue) => {
        e.stopPropagation();
        if (disabled) return;
        const updated = selectedValues.filter(v => v !== optValue);
        if (onChange) {
            onChange(updated);
        }
    };

    const filteredOptions = normalizedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`w-full ${className}`} ref={containerRef}>
            {label && (
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {label}
                </label>
            )}

            <div className="relative">
                <div
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={[
                        'w-full min-h-[38px] px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs flex flex-wrap items-center gap-1.5 cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                        error ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700',
                        disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800' : 'hover:border-slate-400 dark:hover:border-slate-600',
                    ].filter(Boolean).join(' ')}
                >
                    {selectedValues.length === 0 ? (
                        <span className="text-slate-400 select-none py-0.5">{placeholder}</span>
                    ) : (
                        selectedValues.map(val => {
                            const opt = normalizedOptions.find(o => o.value === val);
                            const displayLabel = opt ? opt.label : String(val);
                            return (
                                <span
                                    key={val}
                                    className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[11px] font-medium border border-indigo-200 dark:border-indigo-800/80 shadow-xs"
                                >
                                    {displayLabel}
                                    {!disabled && (
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:text-indigo-950 dark:hover:text-white transition-colors"
                                            onClick={(e) => handleRemove(e, val)}
                                        />
                                    )}
                                </span>
                            );
                        })
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && !disabled && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-h-56 overflow-y-auto p-1.5 space-y-1">
                        {normalizedOptions.length > 5 && (
                            <div className="relative mb-1 px-1 pt-1">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full text-xs pl-7 pr-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}

                        {filteredOptions.length === 0 ? (
                            <div className="p-2.5 text-center text-xs text-slate-400 italic">No options found</div>
                        ) : (
                            filteredOptions.map(opt => {
                                const isSelected = selectedValues.includes(opt.value);
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => handleToggle(opt.value)}
                                        className={[
                                            'flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition select-none',
                                            isSelected
                                                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300',
                                        ].filter(Boolean).join(' ')}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>
    );
}
