import { useState, useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, Link2, RemoveFormatting, Code, X, Check, Eye } from 'lucide-react';
import { Input } from '@/Components/ui';

export default function MiniRichEditor({
    value = '',
    onChange,
    placeholder = 'Type text here...',
    minHeight = '80px',
    className = '',
}) {
    const editorRef = useRef(null);
    const lastHtml = useRef(value);
    const [active, setActive] = useState({ bold: false, italic: false, underline: false });
    const [isCodeMode, setIsCodeMode] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const savedRange = useRef(null);

    // Sync external value changes into contentEditable when not currently focused
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (document.activeElement === el) return;
        if (el.innerHTML !== (value ?? '')) {
            el.innerHTML = value ?? '';
            lastHtml.current = value ?? '';
        }
    }, [value, isCodeMode]);

    const emit = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;
        const next = el.innerHTML;
        if (next !== lastHtml.current) {
            lastHtml.current = next;
            onChange?.(next);
        }
    }, [onChange]);

    const refreshActiveStates = useCallback(() => {
        try {
            setActive({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
            });
        } catch {
            /* ignore unsupported */
        }
    }, []);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        const r = savedRange.current;
        if (!r || !editorRef.current) return;
        editorRef.current.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
    };

    const exec = (cmd, val = null) => {
        if (isCodeMode) return;
        restoreSelection();
        try {
            document.execCommand('styleWithCSS', false, false);
        } catch {
            /* ignore */
        }
        document.execCommand(cmd, false, val);
        emit();
        refreshActiveStates();
    };

    const handleApplyLink = () => {
        let url = linkUrl.trim();
        if (!url) {
            setShowLinkInput(false);
            return;
        }
        if (!/^(https?:|mailto:|tel:|#)/i.test(url)) {
            url = 'https://' + url;
        }
        exec('createLink', url);
        setShowLinkInput(false);
        setLinkUrl('');
    };

    return (
        <div className={`flex flex-col border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 shadow-xs focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition ${className}`}>
            {/* ── Toolbar ── */}
            <div
                className="flex items-center gap-0.5 px-2 py-1.5 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850/80 text-neutral-600 dark:text-neutral-300 select-none"
                onMouseDown={(e) => {
                    if (e.target.tagName !== 'INPUT') e.preventDefault();
                }}
            >
                <button
                    type="button"
                    title="Bold"
                    disabled={isCodeMode}
                    onClick={() => exec('bold')}
                    className={`p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition disabled:opacity-40 ${
                        active.bold ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold' : ''
                    }`}
                >
                    <Bold className="w-3.5 h-3.5" />
                </button>

                <button
                    type="button"
                    title="Italic"
                    disabled={isCodeMode}
                    onClick={() => exec('italic')}
                    className={`p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition disabled:opacity-40 ${
                        active.italic ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold' : ''
                    }`}
                >
                    <Italic className="w-3.5 h-3.5" />
                </button>

                <button
                    type="button"
                    title="Underline"
                    disabled={isCodeMode}
                    onClick={() => exec('underline')}
                    className={`p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition disabled:opacity-40 ${
                        active.underline ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold' : ''
                    }`}
                >
                    <Underline className="w-3.5 h-3.5" />
                </button>

                <span className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

                <button
                    type="button"
                    title="Insert Link"
                    disabled={isCodeMode}
                    onClick={() => {
                        saveSelection();
                        setShowLinkInput(prev => !prev);
                    }}
                    className={`p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition disabled:opacity-40 ${
                        showLinkInput ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : ''
                    }`}
                >
                    <Link2 className="w-3.5 h-3.5" />
                </button>

                <button
                    type="button"
                    title="Clear Formatting"
                    disabled={isCodeMode}
                    onClick={() => exec('removeFormat')}
                    className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition disabled:opacity-40"
                >
                    <RemoveFormatting className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1" />

                <button
                    type="button"
                    title={isCodeMode ? "Preview Visual HTML" : "Edit Raw HTML Source"}
                    onClick={() => {
                        if (isCodeMode && editorRef.current) {
                            editorRef.current.innerHTML = lastHtml.current || '';
                        }
                        setIsCodeMode(!isCodeMode);
                        setShowLinkInput(false);
                    }}
                    className={`p-1.5 rounded-md text-xs font-mono flex items-center gap-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition ${
                        isCodeMode ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold' : ''
                    }`}
                >
                    {isCodeMode ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* ── Link Input Bar ── */}
            {showLinkInput && !isCodeMode && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-50/60 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800">
                    <Input
                        size="sm"
                        wrapperClassName="flex-1"
                        type="text"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyLink();
                            } else if (e.key === 'Escape') {
                                setShowLinkInput(false);
                            }
                        }}
                        placeholder="https://example.com"
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={handleApplyLink}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-2xs flex items-center gap-1"
                    >
                        <Check className="w-3 h-3" /> Apply
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowLinkInput(false)}
                        className="p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* ── Content Area ── */}
            {isCodeMode ? (
                <textarea
                    rows={4}
                    value={value || ''}
                    onChange={(e) => {
                        lastHtml.current = e.target.value;
                        onChange?.(e.target.value);
                    }}
                    style={{ minHeight }}
                    className="w-full p-2.5 text-xs font-mono bg-neutral-900 text-emerald-400 border-0 outline-none resize-y"
                    placeholder="<p>HTML markup here...</p>"
                />
            ) : (
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder={placeholder}
                    onInput={emit}
                    onBlur={emit}
                    onKeyUp={refreshActiveStates}
                    onMouseUp={() => {
                        saveSelection();
                        refreshActiveStates();
                    }}
                    onPaste={(e) => {
                        e.preventDefault();
                        const text = (e.clipboardData || window.clipboardData).getData('text/html') ||
                                     (e.clipboardData || window.clipboardData).getData('text/plain');
                        document.execCommand('insertHTML', false, text);
                        emit();
                    }}
                    style={{ minHeight }}
                    className="p-2.5 text-xs text-neutral-800 dark:text-neutral-200 outline-none cursor-text prose prose-sm dark:prose-invert max-w-none leading-relaxed [&_a]:text-emerald-600 dark:[&_a]:text-emerald-400 [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400 empty:before:pointer-events-none"
                />
            )}
        </div>
    );
}
