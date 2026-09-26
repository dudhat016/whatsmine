import React, { useRef, useState } from 'react';
import { Tag } from 'lucide-react';
import DynamicTokenPicker from '@/Components/DynamicTokenPicker';

export default function InlineTokenTextarea({
    label,
    value = '',
    onChange,
    placeholder = '',
    subtext = '',
    required = false,
    rows = 4,
    id,
    name,
    className = '',
    textareaClassName = '',
    align = 'right',
    customValues = [],
    customFields = [],
    triggerLinks = [],
    triggerType = null,
    disabled = false,
    showCounter = true,
}) {
    const textareaRef = useRef(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const openPickerRef = useRef(null);

    const charCount = (value || '').length;
    const wordCount = (value || '').trim() ? (value || '').trim().split(/\s+/).filter(Boolean).length : 0;

    const handleSelectToken = (token) => {
        if (!textareaRef.current) {
            onChange(value ? `${value} ${token}` : token);
            return;
        }

        const ta = textareaRef.current;
        const start = ta.selectionStart ?? value.length;
        const end = ta.selectionEnd ?? value.length;

        // If user was typing '{{', replace the typed '{{'
        let insertStart = start;
        let prevText = value.substring(0, start);
        if (prevText.endsWith('{{')) {
            insertStart = start - 2;
            prevText = value.substring(0, insertStart);
        }

        const nextValue = prevText + token + value.substring(end);
        onChange(nextValue);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = insertStart + token.length;
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const handleKeyDown = (e) => {
        // If user types '{' right after another '{', open picker
        if (e.key === '{') {
            const ta = e.currentTarget;
            const pos = ta.selectionStart ?? 0;
            if (pos > 0 && ta.value[pos - 1] === '{') {
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
            {/* Header: Label on Left, Custom Values on Right */}
            <div className="flex items-center justify-between">
                {label ? (
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                ) : <div />}

                <div className="flex items-center gap-1.5">
                    <DynamicTokenPicker
                        onSelect={handleSelectToken}
                        onOpenChange={setIsPickerOpen}
                        align={align}
                        customValues={customValues}
                        customFields={customFields}
                        triggerLinks={triggerLinks}
                        triggerType={triggerType}
                        trigger={({ open, isOpen }) => {
                            openPickerRef.current = open;
                            return (
                                <button
                                    type="button"
                                    onClick={open}
                                    title="Insert dynamic variable / merge tag"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                                >
                                    <Tag className="w-3 h-3" />
                                    <span>Variables</span>
                                </button>
                            );
                        }}
                    />
                </div>
            </div>

            {/* Textarea Container */}
            <div
                className="relative"
                style={{ zIndex: isPickerOpen ? 100 : 1 }}
            >
                <textarea
                    ref={textareaRef}
                    id={id}
                    name={name}
                    rows={rows}
                    disabled={disabled}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={
                        textareaClassName ||
                        "w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition shadow-2xs resize-y disabled:opacity-60 leading-relaxed font-sans"
                    }
                />
            </div>

            {/* Subtext and Character/Word Counter */}
            <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 px-0.5">
                {subtext ? (
                    <p className="leading-tight flex-1 pr-2">{subtext}</p>
                ) : <span />}

                {showCounter && (
                    <span className="shrink-0 font-mono text-[10px]">
                        {charCount} chars | {wordCount} words
                    </span>
                )}
            </div>
        </div>
    );
}
