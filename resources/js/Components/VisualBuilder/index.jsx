import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Code2,
    Eye,
    Layers,
    Paintbrush,
    Sparkles,
    Undo2,
    Redo2,
} from 'lucide-react';
import VisualCanvas from './VisualCanvas';
import { blocksToEmailHtml, emailHtmlToBlocks } from './serializers/EmailSerializer';
import { blocksToFunnelHtml } from './serializers/FunnelSerializer';
import { blocksToFormSchema } from './serializers/FormSerializer';
import { getDefaultBlock, uid } from './types';
import useHistoryState from '@/hooks/useHistoryState';

export default function VisualBuilder({
    mode = 'email', // 'email' | 'funnel' | 'form'
    value = '',
    blocks: initialBlocks = null,
    onChange,
    tokens = [],
    templates = [],
    showAiAssistant = false,
    className = '',
}) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('visual');
    const [blocks, setBlocks, { undo, redo, canUndo, canRedo }] = useHistoryState(() => {
        if (initialBlocks && Array.isArray(initialBlocks) && initialBlocks.length > 0) {
            return initialBlocks;
        }
        if (mode === 'email') {
            return emailHtmlToBlocks(value);
        }
        if (mode === 'form') {
            return [
                getDefaultBlock('heading'),
                getDefaultBlock('form_text'),
                getDefaultBlock('form_email'),
                getDefaultBlock('form_submit'),
            ];
        }
        return [
            getDefaultBlock('heading'),
            getDefaultBlock('paragraph'),
            getDefaultBlock('button'),
        ];
    });

    const lastExport = useRef('');

    // Sync blocks to output value
    useEffect(() => {
        let compiled = '';
        if (mode === 'email') {
            compiled = blocksToEmailHtml(blocks);
        } else if (mode === 'funnel') {
            compiled = blocksToFunnelHtml(blocks);
        } else if (mode === 'form') {
            compiled = blocksToFormSchema(blocks);
        }

        if (compiled !== lastExport.current) {
            lastExport.current = compiled;
            onChange?.(compiled, blocks);
        }
    }, [blocks, mode, onChange]);

    const TABS = [
        { id: 'visual', label: t('common.visual_editor', 'Visual Canvas'), icon: Layers },
        { id: 'code', label: t('common.code_view', 'Code / Schema'), icon: Code2 },
    ];

    if (templates.length > 0) {
        TABS.unshift({ id: 'templates', label: t('common.templates', 'Templates'), icon: Paintbrush });
    }

    return (
        <div className={`flex flex-col space-y-3 ${className}`}>
            {/* ── Sub-header Navigation ── */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/60 p-1 rounded-lg">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                activeTab === id
                                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-1">
                        <button
                            type="button"
                            onClick={undo}
                            disabled={!canUndo}
                            title="Undo (Ctrl+Z)"
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        >
                            <Undo2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={redo}
                            disabled={!canRedo}
                            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        >
                            <Redo2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="text-xs text-neutral-400">
                        {t('common.mode', 'Mode')}: <span className="font-semibold uppercase text-brand-600 dark:text-brand-400">{mode}</span>
                    </div>
                </div>
            </div>

            {/* ── Tab Content ── */}
            {activeTab === 'templates' && templates.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900">
                    {templates.map((tpl, i) => (
                        <div
                            key={i}
                            onClick={() => {
                                if (tpl.blocks) setBlocks(tpl.blocks);
                                else if (tpl.html && mode === 'email') setBlocks(emailHtmlToBlocks(tpl.html));
                                setActiveTab('visual');
                            }}
                            className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-brand-500 dark:hover:border-brand-400 transition-all cursor-pointer group"
                        >
                            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-600">{tpl.name}</h4>
                            <p className="text-xs text-neutral-500 mt-1">{tpl.description || 'Click to apply template'}</p>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'visual' && (
                <VisualCanvas
                    blocks={blocks}
                    onChange={setBlocks}
                    mode={mode}
                    tokens={tokens}
                />
            )}

            {activeTab === 'code' && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-900 text-neutral-100 p-4 font-mono text-xs overflow-x-auto min-h-[300px]">
                    <pre>
                        {mode === 'form'
                            ? JSON.stringify(blocksToFormSchema(blocks), null, 2)
                            : mode === 'email'
                            ? blocksToEmailHtml(blocks)
                            : blocksToFunnelHtml(blocks)}
                    </pre>
                </div>
            )}
        </div>
    );
}

export { VisualCanvas, InlineText };
