import React from 'react';
import {
    Settings, Trash2, RotateCcw, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    SlidersVertical, SlidersHorizontal, CopyCheck, Copy
} from 'lucide-react';
import { GOOGLE_FONTS, SYSTEM_FONTS, FONT_WEIGHTS } from './constants';

export default function SettingsTab({
    selectedElement,
    handleDeleteSelectedElement,
    handleUpdateElementSetting,
    handleResetElementCategory,
    styleGuide,
    copiedId,
    setCopiedId,
}) {
    if (!selectedElement) {
        return (
            <div className="p-6 text-center text-neutral-400 space-y-2">
                <Settings className="h-8 w-8 mx-auto text-neutral-300 animate-spin" />
                <p className="font-bold text-neutral-700">No Element Selected</p>
                <p className="text-[11px]">
                    Click any element on the canvas to customize its typography, spacing, background, borders, and shadows in real-time!
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-5 text-xs divide-y divide-neutral-200 overflow-y-auto">
            <div className="space-y-5 pt-1">
                {/* Header & Delete Button */}
                <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-brand-600" />
                        <h3 className="font-bold text-sm text-neutral-900 capitalize">
                            {selectedElement.name || selectedElement.type} Settings
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleDeleteSelectedElement(selectedElement.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Delete Element"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>

                {/* 1. TEXT CONTENT */}
                {['headline', 'subheadline', 'paragraph', 'quote', 'submit_button', 'section'].includes(selectedElement.type) && (
                    <div className="space-y-1 pt-3">
                        <label className="block font-bold text-neutral-800">Text Content / Title</label>
                        {selectedElement.type === 'paragraph' ? (
                            <textarea
                                rows={4}
                                value={selectedElement.content || ''}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'content', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                            />
                        ) : (
                            <input
                                type="text"
                                value={selectedElement.content || selectedElement.title || selectedElement.text || ''}
                                onChange={e => {
                                    const key = selectedElement.title ? 'title' : selectedElement.text ? 'text' : 'content';
                                    handleUpdateElementSetting(selectedElement.id, key, e.target.value);
                                }}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                            />
                        )}
                    </div>
                )}

                {/* 2. TYPOGRAPHY SECTION */}
                {['headline', 'subheadline', 'paragraph', 'quote', 'submit_button'].includes(selectedElement.type) && (
                    <div className="space-y-3 pt-3">
                        <h4 className="font-bold text-neutral-900 flex items-center justify-between">
                            <span>Typography</span>
                            <button
                                type="button"
                                onClick={() => handleResetElementCategory(selectedElement.id, 'typography')}
                                className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                                title="Reset Typography to Defaults"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                        </h4>
                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-neutral-600">
                                <span>Font size</span>
                                <span className="font-mono text-brand-600 font-bold">{selectedElement.fontSize || 16}px</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="range" min="10" max="72" value={selectedElement.fontSize || 16} onChange={e => handleUpdateElementSetting(selectedElement.id, 'fontSize', Number(e.target.value))} className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg" />
                                <input type="number" min="10" max="72" value={selectedElement.fontSize || 16} onChange={e => handleUpdateElementSetting(selectedElement.id, 'fontSize', Number(e.target.value))} className="w-14 rounded-lg border p-1 text-center font-bold" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-neutral-600">
                                <span>Line height</span>
                                <span className="font-mono text-brand-600 font-bold">{selectedElement.lineHeight || 24}px</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="range" min="12" max="90" value={selectedElement.lineHeight || 24} onChange={e => handleUpdateElementSetting(selectedElement.id, 'lineHeight', Number(e.target.value))} className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg" />
                                <input type="number" min="12" max="90" value={selectedElement.lineHeight || 24} onChange={e => handleUpdateElementSetting(selectedElement.id, 'lineHeight', Number(e.target.value))} className="w-14 rounded-lg border p-1 text-center font-bold" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Font family</label>
                            <select
                                value={selectedElement.fontFamily || styleGuide.defaultFont}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'fontFamily', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium"
                            >
                                <optgroup label="Google Fonts">
                                    {GOOGLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </optgroup>
                                <optgroup label="System Fonts">
                                    {SYSTEM_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </optgroup>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Font style</label>
                            <select
                                value={selectedElement.fontWeight || '400'}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'fontWeight', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium"
                            >
                                {FONT_WEIGHTS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-neutral-600">
                                <span>Letter spacing</span>
                                <span className="font-mono text-brand-600 font-bold">{selectedElement.letterSpacing || 0}px</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="range" min="-2" max="10" value={selectedElement.letterSpacing || 0} onChange={e => handleUpdateElementSetting(selectedElement.id, 'letterSpacing', Number(e.target.value))} className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg" />
                                <input type="number" min="-2" max="10" value={selectedElement.letterSpacing || 0} onChange={e => handleUpdateElementSetting(selectedElement.id, 'letterSpacing', Number(e.target.value))} className="w-14 rounded-lg border p-1 text-center font-bold" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. COLOR SECTION */}
                <div className="space-y-3 pt-3">
                    <h4 className="font-bold text-neutral-900 flex items-center justify-between">
                        <span>Color</span>
                        <button
                            type="button"
                            onClick={() => handleResetElementCategory(selectedElement.id, 'color')}
                            className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                            title="Reset Colors to Defaults"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </h4>
                    {['headline', 'subheadline', 'paragraph', 'quote', 'submit_button'].includes(selectedElement.type) && (
                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Text color</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={selectedElement.textColor || '#111827'} onChange={e => handleUpdateElementSetting(selectedElement.id, 'textColor', e.target.value)} className="h-8 w-10 cursor-pointer rounded border p-0.5" />
                                <input type="text" value={selectedElement.textColor || '#111827'} onChange={e => handleUpdateElementSetting(selectedElement.id, 'textColor', e.target.value)} className="flex-1 rounded-lg border p-1.5 font-mono text-xs" />
                            </div>
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-600">Background color</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={selectedElement.bgColor || '#ffffff'} onChange={e => handleUpdateElementSetting(selectedElement.id, 'bgColor', e.target.value)} className="h-8 w-10 cursor-pointer rounded border p-0.5" />
                            <input type="text" value={selectedElement.bgColor || '#ffffff'} onChange={e => handleUpdateElementSetting(selectedElement.id, 'bgColor', e.target.value)} className="flex-1 rounded-lg border p-1.5 font-mono text-xs" />
                        </div>
                    </div>
                </div>

                {/* 4. SIZE AND POSITION (PADDING & MARGIN) */}
                <div className="space-y-3 pt-3">
                    <h4 className="font-bold text-neutral-900 flex items-center justify-between">
                        <span>Size and position</span>
                        <button
                            type="button"
                            onClick={() => handleResetElementCategory(selectedElement.id, 'size_position')}
                            className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                            title="Reset Padding & Margins to Defaults"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </h4>
                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-600">Padding</label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1 rounded-lg border px-2 py-1.5 bg-white">
                                <SlidersVertical className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                <span className="text-[10px] text-neutral-400 font-mono">↕</span>
                                <input type="number" value={selectedElement.paddingY || 0} onChange={e => handleUpdateElementSetting(selectedElement.id, 'paddingY', Number(e.target.value))} className="w-full text-xs font-bold text-center border-none focus:outline-none" />
                            </div>
                            <div className="flex items-center gap-1 rounded-lg border px-2 py-1.5 bg-white">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                <span className="text-[10px] text-neutral-400 font-mono">↔</span>
                                <input type="number" value={selectedElement.paddingX || 0} onChange={e => handleUpdateElementSetting(selectedElement.id, 'paddingX', Number(e.target.value))} className="w-full text-xs font-bold text-center border-none focus:outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-600">Margin</label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1 rounded-lg border px-2 py-1.5 bg-white">
                                <span className="text-[10px] text-neutral-400 font-mono">⬍ Top</span>
                                <input type="number" value={selectedElement.marginTop || 0} onChange={e => handleUpdateElementSetting(selectedElement.id, 'marginTop', Number(e.target.value))} className="w-full text-xs font-bold text-center border-none focus:outline-none" />
                            </div>
                            <div className="flex items-center gap-1 rounded-lg border px-2 py-1.5 bg-white">
                                <span className="text-[10px] text-neutral-400 font-mono">⬍ Btm</span>
                                <input type="number" value={selectedElement.marginBottom || 0} onChange={e => handleUpdateElementSetting(selectedElement.id, 'marginBottom', Number(e.target.value))} className="w-full text-xs font-bold text-center border-none focus:outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-600">Alignment</label>
                        <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
                            {[
                                { key: 'left', icon: AlignLeft },
                                { key: 'center', icon: AlignCenter },
                                { key: 'right', icon: AlignRight },
                                { key: 'justify', icon: AlignJustify },
                            ].map(al => (
                                <button
                                    key={al.key}
                                    type="button"
                                    onClick={() => handleUpdateElementSetting(selectedElement.id, 'alignment', al.key)}
                                    className={`flex-1 py-1.5 rounded flex items-center justify-center transition ${
                                        selectedElement.alignment === al.key ? 'bg-white text-brand-600 shadow font-bold' : 'text-neutral-500'
                                    }`}
                                >
                                    <al.icon className="h-3.5 w-3.5" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 5. BACKGROUND IMAGE & SHADOW */}
                <div className="space-y-3 pt-3">
                    <h4 className="font-bold text-neutral-900 flex items-center justify-between">
                        <span>Shadow & Background Image</span>
                        <button
                            type="button"
                            onClick={() => handleResetElementCategory(selectedElement.id, 'shadow')}
                            className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                            title="Reset Shadow to Defaults"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </h4>
                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-600">Box Shadow</label>
                        <select
                            value={selectedElement.shadow || 'none'}
                            onChange={e => handleUpdateElementSetting(selectedElement.id, 'shadow', e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium"
                        >
                            <option value="none">No shadow</option>
                            <option value="sm">Soft Small Shadow</option>
                            <option value="md">Medium Elevator Shadow</option>
                            <option value="lg">Deep Large Shadow</option>
                            <option value="glow">Brand Orange Glow</option>
                        </select>
                    </div>
                </div>

                {/* 6. BORDER & RADIUS */}
                <div className="space-y-3 pt-3">
                    <h4 className="font-bold text-neutral-900 flex items-center justify-between">
                        <span>Border & Radius</span>
                        <button
                            type="button"
                            onClick={() => handleResetElementCategory(selectedElement.id, 'border')}
                            className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                            title="Reset Border to Defaults"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </h4>
                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-600">Border Style</label>
                        <select
                            value={selectedElement.borderStyle || 'none'}
                            onChange={e => handleUpdateElementSetting(selectedElement.id, 'borderStyle', e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium"
                        >
                            <option value="none">No border</option>
                            <option value="full">Full Border</option>
                            <option value="dashed">Dashed Border</option>
                            <option value="bottom">Bottom Border Only</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between font-semibold text-neutral-600">
                            <span>Corner radius</span>
                            <span className="font-mono text-brand-600 font-bold">{selectedElement.borderRadius || 0}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-neutral-400 font-mono text-xs">╭</span>
                            <input type="range" min="0" max="50" value={selectedElement.borderRadius || 0} onChange={e => handleUpdateElementSetting(selectedElement.id, 'borderRadius', Number(e.target.value))} className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg" />
                            <input type="number" min="0" max="50" value={selectedElement.borderRadius || 0} onChange={e => handleUpdateElementSetting(selectedElement.id, 'borderRadius', Number(e.target.value))} className="w-14 rounded-lg border p-1 text-center font-bold" />
                        </div>
                    </div>
                </div>

                {/* 7. ITEM VISIBLE ON */}
                <div className="space-y-2 pt-3">
                    <h4 className="font-bold text-neutral-900">Item visible on:</h4>
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 font-medium text-neutral-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedElement.visibleDesktop !== false}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'visibleDesktop', e.target.checked)}
                                className="rounded text-brand-600 h-4 w-4"
                            />
                            <span>Desktop</span>
                        </label>
                        <label className="flex items-center gap-2 font-medium text-neutral-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedElement.visibleMobile !== false}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'visibleMobile', e.target.checked)}
                                className="rounded text-brand-600 h-4 w-4"
                            />
                            <span>Mobile</span>
                        </label>
                    </div>
                </div>

                {/* 8. (ADVANCED) HTML ATTRIBUTES */}
                <div className="space-y-2 pt-3 border-t">
                    <h4 className="font-bold text-neutral-900">(Advanced) HTML attributes</h4>
                    <div>
                        <label className="block text-[11px] text-neutral-500 font-medium">ID attribute</label>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-100 font-mono text-[11px] text-neutral-700 mt-1">
                            <span className="truncate">{selectedElement.id}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedElement.id);
                                    setCopiedId(true);
                                    setTimeout(() => setCopiedId(false), 2000);
                                }}
                                className="p-1 hover:text-brand-600"
                                title="Copy ID attribute"
                            >
                                {copiedId ? <CopyCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-neutral-400" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
