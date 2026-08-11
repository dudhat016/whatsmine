import React from 'react';
import { Palette, Type, Box, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { GOOGLE_FONTS, SYSTEM_FONTS } from './constants';

export default function BrandTab({ styleGuide, handleStyleChange }) {
    return (
        <div className="p-4 space-y-5 text-xs overflow-y-auto">
            {/* ── Page Background ── */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
                    <Palette className="h-3.5 w-3.5 text-brand-600" /> Page Background
                </h3>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">Background color</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={styleGuide.bgColor || '#ffffff'}
                            onChange={e => handleStyleChange('bgColor', e.target.value)}
                            className="h-8 w-10 cursor-pointer rounded border p-0.5"
                        />
                        <input
                            type="text"
                            value={styleGuide.bgColor || '#ffffff'}
                            onChange={e => handleStyleChange('bgColor', e.target.value)}
                            className="flex-1 rounded-lg border p-1.5 font-mono text-xs"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">Text / Body color</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={styleGuide.textColor || '#1f2937'}
                            onChange={e => handleStyleChange('textColor', e.target.value)}
                            className="h-8 w-10 cursor-pointer rounded border p-0.5"
                        />
                        <input
                            type="text"
                            value={styleGuide.textColor || '#1f2937'}
                            onChange={e => handleStyleChange('textColor', e.target.value)}
                            className="flex-1 rounded-lg border p-1.5 font-mono text-xs"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">Brand / Link color</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={styleGuide.linkColor || '#c87a57'}
                            onChange={e => handleStyleChange('linkColor', e.target.value)}
                            className="h-8 w-10 cursor-pointer rounded border p-0.5"
                        />
                        <input
                            type="text"
                            value={styleGuide.linkColor || '#c87a57'}
                            onChange={e => handleStyleChange('linkColor', e.target.value)}
                            className="flex-1 rounded-lg border p-1.5 font-mono text-xs"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">Heading color</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={styleGuide.headingColor || '#111827'}
                            onChange={e => handleStyleChange('headingColor', e.target.value)}
                            className="h-8 w-10 cursor-pointer rounded border p-0.5"
                        />
                        <input
                            type="text"
                            value={styleGuide.headingColor || '#111827'}
                            onChange={e => handleStyleChange('headingColor', e.target.value)}
                            className="flex-1 rounded-lg border p-1.5 font-mono text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* ── Typography ── */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
                    <Type className="h-3.5 w-3.5 text-brand-600" /> Typography
                </h3>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">Body font</label>
                    <select
                        value={styleGuide.defaultFont}
                        onChange={e => handleStyleChange('defaultFont', e.target.value)}
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
                    <label className="block font-semibold text-neutral-600">Heading font</label>
                    <select
                        value={styleGuide.headingFontName}
                        onChange={e => handleStyleChange('headingFontName', e.target.value)}
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
                    <div className="flex justify-between font-semibold text-neutral-600">
                        <span>Base font size</span>
                        <span className="font-mono text-brand-600 font-bold">{styleGuide.fontSize || 17}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="range" min="12" max="24" value={styleGuide.fontSize || 17} onChange={e => handleStyleChange('fontSize', Number(e.target.value))} className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg" />
                        <input type="number" min="12" max="24" value={styleGuide.fontSize || 17} onChange={e => handleStyleChange('fontSize', Number(e.target.value))} className="w-14 rounded-lg border p-1 text-center font-bold" />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-neutral-600">
                        <span>Base line height</span>
                        <span className="font-mono text-brand-600 font-bold">{styleGuide.lineHeight || 25}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="range" min="16" max="40" value={styleGuide.lineHeight || 25} onChange={e => handleStyleChange('lineHeight', Number(e.target.value))} className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg" />
                        <input type="number" min="16" max="40" value={styleGuide.lineHeight || 25} onChange={e => handleStyleChange('lineHeight', Number(e.target.value))} className="w-14 rounded-lg border p-1 text-center font-bold" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">Body alignment</label>
                    <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
                        {[{key:'left',icon:AlignLeft},{key:'center',icon:AlignCenter},{key:'right',icon:AlignRight}].map(al => (
                            <button
                                key={al.key}
                                type="button"
                                onClick={() => handleStyleChange('bodyAlignment', al.key)}
                                className={`flex-1 py-1.5 rounded flex items-center justify-center transition ${
                                    styleGuide.bodyAlignment === al.key ? 'bg-white text-brand-600 shadow font-bold' : 'text-neutral-500'
                                }`}
                            >
                                <al.icon className="h-3.5 w-3.5" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Container & Spacing ── */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
                    <Box className="h-3.5 w-3.5 text-brand-600" /> Container & Spacing
                </h3>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">Container max width</label>
                    <select
                        value={styleGuide.containerMaxWidth}
                        onChange={e => handleStyleChange('containerMaxWidth', Number(e.target.value))}
                        className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                    >
                        <option value={640}>Narrow (640px)</option>
                        <option value={768}>Medium (768px)</option>
                        <option value={1024}>Standard (1024px)</option>
                        <option value={1200}>Default (1200px)</option>
                        <option value={1280}>Wide (1280px)</option>
                        <option value={1600}>Full Width (1600px)</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-neutral-600">
                        <span>Container padding X</span>
                        <span className="font-mono text-brand-600 font-bold">{styleGuide.containerPaddingX || 32}px</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="80"
                        value={styleGuide.containerPaddingX || 32}
                        onChange={e => handleStyleChange('containerPaddingX', Number(e.target.value))}
                        className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                    />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-neutral-600">
                        <span>Section padding Y</span>
                        <span className="font-mono text-brand-600 font-bold">{styleGuide.sectionPaddingY || 48}px</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="120"
                        value={styleGuide.sectionPaddingY || 48}
                        onChange={e => handleStyleChange('sectionPaddingY', Number(e.target.value))}
                        className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                    />
                </div>
            </div>
        </div>
    );
}
