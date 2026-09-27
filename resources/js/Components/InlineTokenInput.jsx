import React, { useRef, useState } from 'react';
import { Tag } from 'lucide-react';
import DynamicTokenPicker from '@/Components/DynamicTokenPicker';
import { Input } from '@/Components/ui';

export default function InlineTokenInput({
    label,
    value = '',
    onChange,
    placeholder = '',
    subtext = '',
    required = false,
    type = 'text',
    id,
    name,
    className = '',
    inputClassName = '',
    align = 'right',
    customValues = [],
    customFields = [],
    triggerLinks = [],
    triggerType = null,
    disabled = false,
}) {
    const inputRef = useRef(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const openPickerRef = useRef(null);

    const handleSelectToken = (token) => {
        if (!inputRef.current) {
            onChange(value ? `${value} ${token}` : token);
            return;
        }

        const input = inputRef.current;
        const start = input.selectionStart ?? value.length;
        const end = input.selectionEnd ?? value.length;

        // If user was typing '{{', replace the typed '{{'
        let insertStart = start;
        let prevText = value.substring(0, start);
        if (prevText.endsWith('{{')) {
            insertStart = start - 2;
            prevText = value.substring(0, insertStart);
        }

        const nextValue = prevText + token + value.substring(end);
        onChange(nextValue);

        // Reposition cursor right after inserted token
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newPos = insertStart + token.length;
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const handleKeyDown = (e) => {
        if (e.key === '{') {
            const input = e.currentTarget;
            const pos = input.selectionStart ?? 0;
            if (pos > 0 && input.value[pos - 1] === '{') {
                setTimeout(() => {
                    if (openPickerRef.current) {
                        openPickerRef.current();
                    }
                }, 50);
            }
        }
    };

    return (
        <div
            className={`space-y-1 ${className}`}
            style={{ position: 'relative', zIndex: isPickerOpen ? 100 : 1 }}
        >
            {label && (
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                </div>
            )}

            <div
                className="relative flex items-center"
                style={{ zIndex: isPickerOpen ? 100 : 1 }}
            >
                <Input
                    ref={inputRef}
                    id={id}
                    name={name}
                    type={type}
                    size="sm"
                    disabled={disabled}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`pr-9 text-xs ${inputClassName}`}
                    wrapperClassName="w-full"
                />

                {/* Inline Tag Picker Button */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    <DynamicTokenPicker
                        onSelect={handleSelectToken}
                        onOpenChange={setIsPickerOpen}
                        align={align}
                        customValues={customValues}
                        customFields={customFields}
                        triggerLinks={triggerLinks}
                        triggerType={triggerType}
                        trigger={({ open }) => {
                            openPickerRef.current = open;
                            return (
                                <button
                                    type="button"
                                    onClick={open}
                                    title="Insert dynamic variable / merge tag"
                                    className="p-1 rounded-md text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                                >
                                    <Tag className="w-3.5 h-3.5" />
                                </button>
                            );
                        }}
                    />
                </div>
            </div>

            {subtext && (
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-tight">
                    {subtext}
                </p>
            )}
        </div>
    );
}
