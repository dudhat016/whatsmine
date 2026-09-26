import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, Link2, AlignLeft, AlignCenter, AlignRight, Check, Sparkles } from 'lucide-react';
import MediaUpload from '@/Components/MediaUpload';
import Toggle from '@/Components/ui/Toggle';

export default function BlockPopover({
    block,
    isOpen,
    onClose,
    onChange,
    mode = 'email',
}) {
    const { t } = useTranslation();
    const [imageTab, setImageTab] = useState('upload'); // 'url' | 'upload'

    if (!isOpen || !block) return null;

    const update = (key, val) => {
        onChange({ ...block, [key]: val });
    };

    const type = block.type;

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-10 right-0 z-50 w-80 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 shadow-xl text-neutral-900 dark:text-neutral-100 transition-all text-xs"
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800">
                <span className="font-bold uppercase tracking-wider text-[11px] text-neutral-500 dark:text-neutral-400">
                    {type.toUpperCase().replace('_', ' ')} SETTINGS
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* ── IMAGE SETTINGS ── */}
            {type === 'image' && (
                <div className="space-y-3.5">
                    <div className="flex rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5">
                        <button
                            type="button"
                            onClick={() => setImageTab('url')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold text-xs transition ${
                                imageTab === 'url'
                                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            <Link2 className="h-3.5 w-3.5" /> URL
                        </button>
                        <button
                            type="button"
                            onClick={() => setImageTab('upload')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold text-xs transition ${
                                imageTab === 'upload'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            <Upload className="h-3.5 w-3.5" /> Upload
                        </button>
                    </div>

                    {imageTab === 'upload' ? (
                        <div className="rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 p-4 text-center">
                            <MediaUpload
                                value={block.src || block.url || ''}
                                onChange={(url) => update('src', url)}
                                accept="image/*"
                                placeholder="Drag & drop or browse image/* · max 50 MB"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Image URL</label>
                            <input
                                type="url"
                                value={block.src || block.url || ''}
                                onChange={(e) => update('src', e.target.value)}
                                placeholder="https://..."
                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Alt text</label>
                        <input
                            type="text"
                            value={block.alt || ''}
                            onChange={(e) => update('alt', e.target.value)}
                            placeholder="Describe the image"
                            className="w-full rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Link URL (optional)</label>
                        <input
                            type="url"
                            value={block.href || ''}
                            onChange={(e) => update('href', e.target.value)}
                            placeholder="https://example.com"
                            className="w-full rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Width</label>
                            <input
                                type="text"
                                value={block.width || '100%'}
                                onChange={(e) => update('width', e.target.value)}
                                placeholder="e.g. 320px or 100%"
                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Alignment</label>
                            <div className="flex rounded-soft border border-neutral-300 dark:border-neutral-700 p-0.5 bg-neutral-50 dark:bg-neutral-800">
                                {['left', 'center', 'right'].map((align) => (
                                    <button
                                        key={align}
                                        type="button"
                                        onClick={() => update('align', align)}
                                        className={`flex-1 py-1 rounded flex items-center justify-center transition ${
                                            (block.align || 'center') === align
                                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                                : 'text-neutral-400 hover:text-neutral-700'
                                        }`}
                                    >
                                        {align === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                                        {align === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
                                        {align === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── BUTTON / CTA SETTINGS ── */}
            {['button', 'submit_button', 'cta'].includes(type) && (
                <div className="space-y-3.5">
                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Link URL</label>
                        <input
                            type="text"
                            value={block.url || block.href || '#'}
                            onChange={(e) => update('url', e.target.value)}
                            placeholder="https://... or #"
                            className="w-full rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Alignment</label>
                        <div className="flex rounded-soft border border-neutral-300 dark:border-neutral-700 p-0.5 bg-neutral-50 dark:bg-neutral-800">
                            {['left', 'center', 'right'].map((align) => (
                                <button
                                    key={align}
                                    type="button"
                                    onClick={() => update('align', align)}
                                    className={`flex-1 py-1.5 rounded flex items-center justify-center transition ${
                                        (block.align || 'center') === align
                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                            : 'text-neutral-400 hover:text-neutral-700'
                                    }`}
                                >
                                    {align === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                                    {align === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
                                    {align === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Background</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={block.bgColor || block.buttonColor || '#2563eb'}
                                onChange={(e) => update('bgColor', e.target.value)}
                                className="h-8 w-12 rounded cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0"
                            />
                            <input
                                type="text"
                                value={block.bgColor || block.buttonColor || '#2563eb'}
                                onChange={(e) => update('bgColor', e.target.value)}
                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Text color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={block.textColor || '#ffffff'}
                                onChange={(e) => update('textColor', e.target.value)}
                                className="h-8 w-12 rounded cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0"
                            />
                            <input
                                type="text"
                                value={block.textColor || '#ffffff'}
                                onChange={(e) => update('textColor', e.target.value)}
                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-mono"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── HEADING / TEXT SETTINGS ── */}
            {['heading', 'text', 'paragraph'].includes(type) && (
                <div className="space-y-3.5">
                    {type === 'heading' && (
                        <div>
                            <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Heading Level</label>
                            <div className="flex rounded-soft border border-neutral-300 dark:border-neutral-700 p-0.5 bg-neutral-50 dark:bg-neutral-800">
                                {['h1', 'h2', 'h3'].map((lvl) => (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => update('level', lvl)}
                                        className={`flex-1 py-1 rounded font-bold text-xs uppercase transition ${
                                            (block.level || 'h1') === lvl
                                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                                : 'text-neutral-400 hover:text-neutral-700'
                                        }`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Alignment</label>
                        <div className="flex rounded-soft border border-neutral-300 dark:border-neutral-700 p-0.5 bg-neutral-50 dark:bg-neutral-800">
                            {['left', 'center', 'right'].map((align) => (
                                <button
                                    key={align}
                                    type="button"
                                    onClick={() => update('align', align)}
                                    className={`flex-1 py-1.5 rounded flex items-center justify-center transition ${
                                        (block.align || 'left') === align
                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                            : 'text-neutral-400 hover:text-neutral-700'
                                    }`}
                                >
                                    {align === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                                    {align === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
                                    {align === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Text Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={block.color || '#111827'}
                                onChange={(e) => update('color', e.target.value)}
                                className="h-8 w-12 rounded cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0"
                            />
                            <input
                                type="text"
                                value={block.color || '#111827'}
                                onChange={(e) => update('color', e.target.value)}
                                className="w-full rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-mono"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── FORM FIELD SETTINGS ── */}
            {mode === 'form' && !['heading', 'paragraph', 'divider', 'image'].includes(type) && (
                <div className="space-y-3">
                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Field Label</label>
                        <input
                            type="text"
                            value={block.label || ''}
                            onChange={(e) => update('label', e.target.value)}
                            className="w-full rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Placeholder</label>
                        <input
                            type="text"
                            value={block.placeholder || ''}
                            onChange={(e) => update('placeholder', e.target.value)}
                            className="w-full rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs"
                        />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Required Field</span>
                        <Toggle
                            checked={!!block.required}
                            onChange={(v) => update('required', v)}
                        />
                    </div>
                </div>
            )}

            {/* ── SPACER / DIVIDER SETTINGS ── */}
            {type === 'spacer' && (
                <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Height: {block.height || 24}px</label>
                    <input
                        type="range"
                        min="8"
                        max="120"
                        step="4"
                        value={block.height || 24}
                        onChange={(e) => update('height', parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-600"
                    />
                </div>
            )}
            {type === 'divider' && (
                <div className="space-y-3">
                    <div>
                        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Color</label>
                        <input
                            type="color"
                            value={block.color || '#e5e7eb'}
                            onChange={(e) => update('color', e.target.value)}
                            className="h-8 w-12 rounded cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
