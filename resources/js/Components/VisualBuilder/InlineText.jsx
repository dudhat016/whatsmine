import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
    Bold,
    Italic,
    Link2,
    RemoveFormatting,
    Underline,
    Variable,
    X,
} from 'lucide-react';

export const BUILDER_CSS = `
[data-vb-text] { outline: none; min-height: 1em; word-break: break-word; }
[data-vb-text]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
.dark [data-vb-text]:empty:before { color: #6b7280; }
[data-vb-text] a { color: #2563eb; text-decoration: underline; }
[data-vb-canvas] [data-vb-block] { transition: box-shadow .15s, border-color .15s; }
`;

function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

/**
 * Universal InlineText contentEditable surface with caret stability
 */
export default function InlineText({
    as: Tag = 'div',
    html = '',
    onChange,
    placeholder = '',
    singleLine = false,
    autoFocus = false,
    className = '',
    style,
    onFocus,
    onBlur,
    ...rest
}) {
    const ref = useRef(null);
    const lastHtml = useRef(html);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (document.activeElement === el) return;
        if (el.innerHTML !== (html ?? '')) {
            el.innerHTML = html ?? '';
            lastHtml.current = html ?? '';
        }
    }, [html]);

    useEffect(() => {
        if (autoFocus && ref.current) {
            placeCaretAtEnd(ref.current);
        }
    }, []);

    const emit = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const next = el.innerHTML;
        if (next !== lastHtml.current) {
            lastHtml.current = next;
            onChange?.(next);
        }
    }, [onChange]);

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            if (singleLine) {
                e.preventDefault();
                ref.current?.blur();
            } else if (!e.shiftKey) {
                e.preventDefault();
                document.execCommand('insertLineBreak');
                emit();
            }
        }
    }

    function handlePaste(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
        emit();
    }

    return (
        <Tag
            ref={ref}
            data-vb-text=""
            role="textbox"
            contentEditable
            suppressContentEditableWarning
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            spellCheck
            data-placeholder={placeholder}
            className={className}
            style={style}
            onInput={emit}
            onBlur={(e) => {
                emit();
                onBlur?.(e);
            }}
            onFocus={onFocus}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            {...rest}
        />
    );
}

function TBtn({ active, onClick, title, children }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition ${
                active
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
        >
            {children}
        </button>
    );
}

export function SelectionToolbar({ canvasRef, tokens = [] }) {
    const { t } = useTranslation();
    const [anchor, setAnchor] = useState(null);
    const [pos, setPos] = useState({ top: 0, left: 0, below: false });
    const [active, setActive] = useState({ bold: false, italic: false, underline: false });
    const [linkMode, setLinkMode] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [tokenOpen, setTokenOpen] = useState(false);
    const toolbarRef = useRef(null);
    const savedRange = useRef(null);

    const place = useCallback((el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const below = r.top < 64;
        setPos({ top: below ? r.bottom : r.top, left: r.left + Math.min(r.width / 2, 160), below });
    }, []);

    const refreshActive = useCallback(() => {
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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        function onFocusIn(e) {
            const el = e.target.closest?.('[data-vb-text]');
            if (el && canvas.contains(el)) {
                setAnchor(el);
                place(el);
                setLinkMode(false);
                setTokenOpen(false);
            }
        }
        function onFocusOut() {
            setTimeout(() => {
                const ae = document.activeElement;
                if (toolbarRef.current && toolbarRef.current.contains(ae)) return;
                if (ae && ae.closest?.('[data-vb-text]') && canvas.contains(ae)) return;
                setAnchor(null);
                setLinkMode(false);
                setTokenOpen(false);
            }, 0);
        }
        canvas.addEventListener('focusin', onFocusIn);
        canvas.addEventListener('focusout', onFocusOut);
        return () => {
            canvas.removeEventListener('focusin', onFocusIn);
            canvas.removeEventListener('focusout', onFocusOut);
        };
    }, [canvasRef, place]);

    useEffect(() => {
        function onSel() {
            if (!anchor) return;
            const sel = window.getSelection();
            if (sel && sel.rangeCount && anchor.contains(sel.anchorNode)) {
                savedRange.current = sel.getRangeAt(0).cloneRange();
            }
            refreshActive();
            place(anchor);
        }
        document.addEventListener('selectionchange', onSel);
        return () => document.removeEventListener('selectionchange', onSel);
    }, [anchor, place, refreshActive]);

    useEffect(() => {
        if (!anchor) return;
        const handler = () => place(anchor);
        window.addEventListener('scroll', handler, true);
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('scroll', handler, true);
            window.removeEventListener('resize', handler);
        };
    }, [anchor, place]);

    if (!anchor) return null;

    const blockType = anchor.closest('[data-vb-block]')?.dataset.vbBlock;
    const allowLink = blockType !== 'button';

    function restore() {
        const r = savedRange.current;
        if (!r) return;
        anchor.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
    }

    function exec(cmd, value = null) {
        restore();
        try {
            document.execCommand('styleWithCSS', false, false);
        } catch {
            /* ignore */
        }
        document.execCommand(cmd, false, value);
        anchor.dispatchEvent(new Event('input', { bubbles: true }));
        refreshActive();
    }

    function applyLink() {
        let url = linkUrl.trim();
        if (!url) {
            setLinkMode(false);
            return;
        }
        if (!/^(https?:|mailto:|tel:|#|\{\{)/i.test(url)) url = 'https://' + url;
        exec('createLink', url);
        setLinkMode(false);
        setLinkUrl('');
    }

    return createPortal(
        <div
            ref={toolbarRef}
            data-vb-toolbar=""
            onMouseDown={(e) => {
                if (e.target.tagName !== 'INPUT') e.preventDefault();
            }}
            style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                transform: pos.below ? 'translate(-50%, 8px)' : 'translate(-50%, calc(-100% - 8px))',
            }}
            className="z-[60] flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white px-1 py-1 shadow-soft-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
            {linkMode ? (
                <div className="flex items-center gap-1 px-1">
                    <input
                        autoFocus
                        type="text"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                applyLink();
                            } else if (e.key === 'Escape') {
                                setLinkMode(false);
                            }
                        }}
                        placeholder={t('common.link_placeholder', 'https://example.com')}
                        className="w-52 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-neutral-600 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                        type="button"
                        onClick={applyLink}
                        className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700"
                    >
                        {t('common.apply', 'Apply')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setLinkMode(false)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <>
                    <TBtn active={active.bold} onClick={() => exec('bold')} title={t('common.bold', 'Bold')}>
                        <Bold className="h-3.5 w-3.5" />
                    </TBtn>
                    <TBtn active={active.italic} onClick={() => exec('italic')} title={t('common.italic', 'Italic')}>
                        <Italic className="h-3.5 w-3.5" />
                    </TBtn>
                    <TBtn active={active.underline} onClick={() => exec('underline')} title={t('common.underline', 'Underline')}>
                        <Underline className="h-3.5 w-3.5" />
                    </TBtn>
                    <span className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
                    {allowLink && (
                        <TBtn onClick={() => setLinkMode(true)} title={t('common.insert_link', 'Insert Link')}>
                            <Link2 className="h-3.5 w-3.5" />
                        </TBtn>
                    )}
                    <TBtn onClick={() => exec('removeFormat')} title={t('common.clear_formatting', 'Clear Formatting')}>
                        <RemoveFormatting className="h-3.5 w-3.5" />
                    </TBtn>
                    {tokens.length > 0 && (
                        <div className="relative">
                            <span className="mx-0.5 inline-block h-5 w-px bg-neutral-200 align-middle dark:bg-neutral-700" />
                            <TBtn onClick={() => setTokenOpen((o) => !o)} title={t('common.insert_variable', 'Insert Tag')}>
                                <Variable className="h-3.5 w-3.5" />
                            </TBtn>
                            {tokenOpen && (
                                <div className="absolute left-1/2 top-full z-10 mt-1 w-56 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white py-1 shadow-soft-lg dark:border-neutral-700 dark:bg-neutral-800">
                                    {tokens.map((t) => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            onClick={() => {
                                                exec('insertText', t.key);
                                                setTokenOpen(false);
                                            }}
                                            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                        >
                                            <span className="text-neutral-700 dark:text-neutral-200">{t.label}</span>
                                            <span className="font-mono text-[10px] text-neutral-400">{t.key}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>,
        document.body,
    );
}
