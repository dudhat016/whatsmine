import React, { forwardRef } from 'react';

/**
 * Enhanced Text Input with soft border, subtle focus ring,
 * forwardRef support, size variants, and icon slots.
 */
const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-soft',
    md: 'px-3 py-2 text-sm rounded-soft',
    lg: 'px-4 py-2.5 text-base rounded-soft-lg',
};

const Input = forwardRef(function Input(
    {
        type = 'text',
        label,
        error,
        hint,
        size = 'md',
        leftIcon = null,
        rightIcon = null,
        leftElement = null,
        rightElement = null,
        className = '',
        wrapperClassName = '',
        id,
        disabled = false,
        ...props
    },
    ref
) {
    const inputId = id || props.name;

    const renderIcon = (icon) => {
        if (!icon) return null;
        if (React.isValidElement(icon)) return icon;
        if (typeof icon === 'function' || typeof icon === 'object') {
            const IconComponent = icon;
            return <IconComponent className="h-4 w-4" />;
        }
        return icon;
    };

    const hasLeft = Boolean(leftIcon || leftElement);
    const hasRight = Boolean(rightIcon || rightElement);

    const baseInput = (
        <div className={`relative flex items-center ${wrapperClassName ? '' : 'w-full'}`}>
            {leftElement ? (
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    {leftElement}
                </div>
            ) : leftIcon ? (
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 dark:text-neutral-500">
                    {renderIcon(leftIcon)}
                </div>
            ) : null}
            <input
                ref={ref}
                id={inputId}
                type={type}
                disabled={disabled}
                className={[
                    'w-full border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-inner transition duration-150 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
                    sizeClasses[size] ?? sizeClasses.md,
                    hasLeft ? 'pl-9' : '',
                    hasRight ? 'pr-9' : '',
                    error
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-soft border-neutral-300 dark:border-neutral-600 focus:border-brand-500 focus:ring-brand-500/20',
                    className,
                ]
                    .filter(Boolean)
                    .join(' ')}
                {...props}
            />
            {rightElement ? (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {rightElement}
                </div>
            ) : rightIcon ? (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 dark:text-neutral-500">
                    {renderIcon(rightIcon)}
                </div>
            ) : null}
        </div>
    );

    if (!label && !error && !hint && !wrapperClassName) {
        return baseInput;
    }

    return (
        <div className={wrapperClassName || 'w-full'}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                    {label}
                </label>
            )}
            {baseInput}
            {error && (
                <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
            {hint && !error && (
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>
            )}
        </div>
    );
});

export default Input;

