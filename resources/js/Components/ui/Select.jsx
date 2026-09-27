import React, { forwardRef, useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-soft',
    md: 'px-3 py-2 text-sm rounded-soft',
    lg: 'px-4 py-2.5 text-base rounded-soft-lg',
};

const optionSizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-3.5 py-2.5 text-base',
};

function extractOptionsFromChildren(children) {
    const items = [];

    const traverse = (nodes) => {
        React.Children.forEach(nodes, (child) => {
            if (!child) return;

            if (React.isValidElement(child)) {
                if (child.type === 'option' || child.type?.displayName === 'option') {
                    let text = '';
                    if (typeof child.props.children === 'string' || typeof child.props.children === 'number') {
                        text = String(child.props.children);
                    } else if (Array.isArray(child.props.children)) {
                        text = child.props.children
                            .map((c) => (typeof c === 'string' || typeof c === 'number' ? c : ''))
                            .join('');
                    } else if (child.props.children) {
                        text = String(child.props.value ?? '');
                    }

                    const val = child.props.value !== undefined ? child.props.value : text;
                    items.push({
                        value: val,
                        label: text || String(val),
                        disabled: Boolean(child.props.disabled),
                        node: child.props.children,
                    });
                } else if (child.type === 'optgroup') {
                    items.push({
                        isGroup: true,
                        label: child.props.label || '',
                    });
                    if (child.props.children) {
                        traverse(child.props.children);
                    }
                } else if (child.props && child.props.children) {
                    traverse(child.props.children);
                }
            }
        });
    };

    traverse(children);
    return items;
}

const Select = forwardRef(function Select(
    {
        label,
        error,
        hint,
        size = 'md',
        options = [],
        placeholder = 'Select...',
        className = '',
        wrapperClassName = '',
        id,
        name,
        value,
        defaultValue,
        onChange,
        disabled = false,
        leftIcon = null,
        children,
        searchable = null, // auto-enabled if > 6 options unless boolean passed
        ...props
    },
    ref
) {
    const generatedId = useId();
    const selectId = id || name || generatedId;
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef(null);
    const listRef = useRef(null);
    const searchInputRef = useRef(null);

    // Build standardized options list
    let normalizedOptions = [];
    if (options && options.length > 0) {
        normalizedOptions = options.map((opt) =>
            typeof opt === 'object' && opt !== null
                ? {
                      value: opt.value,
                      label: opt.label ?? String(opt.value),
                      disabled: Boolean(opt.disabled),
                  }
                : { value: opt, label: String(opt), disabled: false }
        );
    } else if (children) {
        normalizedOptions = extractOptionsFromChildren(children);
    }

    // Determine current selected option
    const currentValue = value !== undefined ? value : defaultValue;
    const selectedOption = normalizedOptions.find(
        (opt) => !opt.isGroup && String(opt.value) === String(currentValue)
    );

    // Filter options based on search query
    const showSearch =
        searchable === true ||
        (searchable !== false && normalizedOptions.filter((o) => !o.isGroup).length > 7);

    const filteredOptions = normalizedOptions.filter((opt) => {
        if (opt.isGroup) return true;
        if (!searchTerm.trim()) return true;
        return String(opt.label).toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('touchstart', handleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('touchstart', handleClickOutside, true);
        };
    }, []);

    // Focus search input when menu opens
    useEffect(() => {
        if (isOpen && showSearch && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen, showSearch]);

    const handleSelectOption = (opt) => {
        if (disabled || opt.disabled || opt.isGroup) return;

        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);

        if (onChange) {
            const syntheticEvent = {
                target: {
                    name: name || id,
                    id: selectId,
                    value: opt.value,
                },
                currentTarget: {
                    name: name || id,
                    id: selectId,
                    value: opt.value,
                },
                value: opt.value,
                preventDefault: () => {},
                stopPropagation: () => {},
            };
            onChange(syntheticEvent);
        }
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
            return;
        }

        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        const selectableOptions = filteredOptions.filter((o) => !o.isGroup && !o.disabled);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev < selectableOptions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : selectableOptions.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && selectableOptions[highlightedIndex]) {
                handleSelectOption(selectableOptions[highlightedIndex]);
            }
        } else if (e.key === 'Tab') {
            setIsOpen(false);
        }
    };

    const renderIcon = (icon) => {
        if (!icon) return null;
        if (React.isValidElement(icon)) return icon;
        if (typeof icon === 'function' || typeof icon === 'object') {
            const IconComponent = icon;
            return <IconComponent className="h-4 w-4" />;
        }
        return icon;
    };

    // Selected text or placeholder
    const displayLabel = selectedOption
        ? selectedOption.label
        : placeholder;
    const isPlaceholder = !selectedOption;

    const baseSelect = (
        <div
            ref={containerRef}
            className={`relative ${wrapperClassName ? '' : 'w-full'}`}
            onKeyDown={handleKeyDown}
        >
            {/* Custom Trigger Button */}
            <div
                ref={ref}
                id={selectId}
                tabIndex={disabled ? -1 : 0}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={`${selectId}-dropdown`}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                className={[
                    'w-full border border-soft border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs transition-all duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-between gap-2 select-none',
                    sizeClasses[size] ?? sizeClasses.md,
                    leftIcon ? 'pl-9' : '',
                    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '',
                    isOpen ? 'border-brand-500 ring-2 ring-brand-500/20' : '',
                    disabled ? 'opacity-60 cursor-not-allowed bg-neutral-50 dark:bg-neutral-800/60' : 'hover:border-neutral-400 dark:hover:border-neutral-500',
                    className,
                ]
                    .filter(Boolean)
                    .join(' ')}
                {...props}
            >
                {leftIcon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 dark:text-neutral-500">
                        {renderIcon(leftIcon)}
                    </div>
                )}

                <span
                    className={[
                        'truncate block flex-1 text-left',
                        isPlaceholder
                            ? 'text-neutral-400 dark:text-neutral-500 font-normal'
                            : 'text-neutral-900 dark:text-neutral-100 font-medium',
                    ].join(' ')}
                >
                    {displayLabel}
                </span>

                <ChevronDown
                    className={`h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
                    }`}
                />
            </div>

            {/* Custom Dropdown Options Popup */}
            {isOpen && !disabled && (
                <div
                    id={`${selectId}-dropdown`}
                    role="listbox"
                    ref={listRef}
                    className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-1 max-h-64 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                    style={{ minWidth: '100%' }}
                >
                    {showSearch && (
                        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 px-1 pt-1 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="relative flex items-center">
                                <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-2.5 pointer-events-none" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search options..."
                                    className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    {filteredOptions.length === 0 ? (
                        <div className="py-3 px-2 text-center text-xs text-neutral-400 dark:text-neutral-500 italic">
                            No options found
                        </div>
                    ) : (
                        filteredOptions.map((opt, index) => {
                            if (opt.isGroup) {
                                return (
                                    <div
                                        key={`group-${opt.label}-${index}`}
                                        className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500"
                                    >
                                        {opt.label}
                                    </div>
                                );
                            }

                            const isSelected = selectedOption && String(selectedOption.value) === String(opt.value);
                            const isHighlighted = highlightedIndex === index;

                            return (
                                <div
                                    key={`opt-${opt.value}-${index}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelectOption(opt)}
                                    className={[
                                        'flex items-center justify-between rounded-lg cursor-pointer transition-colors duration-100 select-none',
                                        optionSizeClasses[size] ?? optionSizeClasses.md,
                                        opt.disabled ? 'opacity-40 cursor-not-allowed' : '',
                                        isSelected
                                            ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                                            : isHighlighted
                                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                >
                                    <span className="truncate flex-1">
                                        {opt.label}
                                    </span>
                                    {isSelected && (
                                        <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 ml-2" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );

    if (!label && !error && !hint && !wrapperClassName) {
        return baseSelect;
    }

    return (
        <div className={wrapperClassName || 'w-full'}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                    {label}
                </label>
            )}
            {baseSelect}
            {error && (
                <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
            {hint && !error && (
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>
            )}
        </div>
    );
});

export default Select;
