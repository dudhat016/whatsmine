import React, { useState } from 'react';
import ColorPickerInput from './ColorPicker';
import {
    Settings, Trash2, RotateCcw, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    SlidersVertical, SlidersHorizontal, CopyCheck, Copy, Monitor, Tablet, Smartphone, Sparkles, Scan,
    Link as LinkIcon, Unlink
} from 'lucide-react';
import { GOOGLE_FONTS, SYSTEM_FONTS, FONT_WEIGHTS } from './constants';
import {
    UnitSelect,
    TypographyControl,
    FourSideInput,
    ShadowControl,
    BorderControl,
    TabSwitcher,
} from './StyleControls';

export default function SettingsTab({
    selectedElement,
    handleDeleteSelectedElement,
    handleUpdateElementSetting,
    handleResetElementCategory,
    styleGuide,
    copiedId,
    setCopiedId,
    viewport = 'desktop',
}) {
    const [styleTab, setStyleTab] = useState('Normal');
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

    // Helper to get effective property value for current active viewport with Brand Theme Fallbacks
    const val = (key, defaultVal = '') => {
        if (!selectedElement) return defaultVal;
        if (viewport !== 'desktop' && selectedElement[viewport] && selectedElement[viewport][key] !== undefined) {
            return selectedElement[viewport][key];
        }
        if (selectedElement[key] !== undefined) {
            return selectedElement[key];
        }
        // Fallbacks to Global Brand Theme Settings
        const type = selectedElement.type;
        const tag = selectedElement.headingTag || (type === 'headline' ? 'h1' : 'h2');

        if (['headline', 'subheadline'].includes(type)) {
            if (key === 'textColor') return styleGuide?.[`${tag}Color`] || styleGuide?.headingColor || '#111827';
            if (key === 'fontFamily') return styleGuide?.[`${tag}Typography`]?.family || styleGuide?.headingFontName || styleGuide?.defaultFont || "'Inter', sans-serif";
            if (key === 'fontSize') return styleGuide?.[`${tag}Typography`]?.size || (tag === 'h1' ? 32 : tag === 'h2' ? 24 : tag === 'h3' ? 20 : 18);
            if (key === 'fontWeight') return styleGuide?.[`${tag}Typography`]?.weight || '700';
            if (key === 'lineHeight') return styleGuide?.[`${tag}Typography`]?.lineHeight || 36;
            if (key === 'paddingTop') return styleGuide?.[`${tag}PaddingTop`] ?? 0;
            if (key === 'paddingRight') return styleGuide?.[`${tag}PaddingRight`] ?? 0;
            if (key === 'paddingBottom') return styleGuide?.[`${tag}PaddingBottom`] ?? 0;
            if (key === 'paddingLeft') return styleGuide?.[`${tag}PaddingLeft`] ?? 0;
            if (key === 'paddingUnit') return styleGuide?.[`${tag}PaddingUnit`] || 'px';
            if (key === 'marginTop') return styleGuide?.[`${tag}MarginTop`] ?? 0;
            if (key === 'marginRight') return styleGuide?.[`${tag}MarginRight`] ?? 0;
            if (key === 'marginBottom') return styleGuide?.[`${tag}MarginBottom`] ?? styleGuide?.headingMarginBottom ?? (tag === 'h1' || tag === 'h2' || tag === 'h3' ? 12 : 8);
            if (key === 'marginLeft') return styleGuide?.[`${tag}MarginLeft`] ?? 0;
            if (key === 'marginUnit') return styleGuide?.[`${tag}MarginUnit`] || 'px';
        }

        if (['paragraph', 'bullets'].includes(type)) {
            if (key === 'textColor') return styleGuide?.textColor || '#1f2937';
            if (key === 'fontFamily') return styleGuide?.bodyTypography?.family || styleGuide?.defaultFont || "'Inter', sans-serif";
            if (key === 'fontSize') return styleGuide?.bodyTypography?.size || styleGuide?.fontSize || 16;
            if (key === 'lineHeight') return styleGuide?.bodyTypography?.lineHeight || styleGuide?.lineHeight || 24;
            if (key === 'paddingTop') return styleGuide?.bodyPaddingTop ?? 0;
            if (key === 'paddingRight') return styleGuide?.bodyPaddingRight ?? 0;
            if (key === 'paddingBottom') return styleGuide?.bodyPaddingBottom ?? 0;
            if (key === 'paddingLeft') return styleGuide?.bodyPaddingLeft ?? 0;
            if (key === 'paddingUnit') return styleGuide?.bodyPaddingUnit || 'px';
            if (key === 'marginTop') return styleGuide?.bodyMarginTop ?? 0;
            if (key === 'marginRight') return styleGuide?.bodyMarginRight ?? 0;
            if (key === 'marginBottom') return styleGuide?.bodyMarginBottom ?? styleGuide?.paragraphMarginBottom ?? 16;
            if (key === 'marginLeft') return styleGuide?.bodyMarginLeft ?? 0;
            if (key === 'marginUnit') return styleGuide?.bodyMarginUnit || 'px';
        }

        if (type === 'submit_button') {
            const primaryColor = styleGuide?.systemColors?.primary || 'var(--color-primary)';
            if (key === 'textColor') return styleGuide?.btnTextColor || '#ffffff';
            if (key === 'bgColor') return styleGuide?.btnBgColor || primaryColor;
            if (key === 'fontFamily') return styleGuide?.btnTypography?.family || styleGuide?.defaultFont || "'Inter', sans-serif";
            if (key === 'fontSize') return styleGuide?.btnTypography?.size || 16;
            if (key === 'fontWeight') return styleGuide?.btnTypography?.weight || '700';
            if (key === 'borderStyle') return styleGuide?.btnBorder?.type || 'none';
            if (key === 'borderWidth') return styleGuide?.btnBorder?.width || 1;
            if (key === 'borderColor') return styleGuide?.btnBorder?.color || '#d1d5db';
            if (key === 'borderRadiusTL' || key === 'borderRadiusTR' || key === 'borderRadiusBL' || key === 'borderRadiusBR') return styleGuide?.btnRadiusTop ?? 12;
            if (key === 'paddingTop') return styleGuide?.btnPaddingTop ?? 14;
            if (key === 'paddingRight') return styleGuide?.btnPaddingRight ?? 28;
            if (key === 'paddingBottom') return styleGuide?.btnPaddingBottom ?? 14;
            if (key === 'paddingLeft') return styleGuide?.btnPaddingLeft ?? 28;
            if (key === 'paddingUnit') return styleGuide?.btnPaddingUnit || 'px';
            if (key === 'marginTop') return styleGuide?.btnMarginTop ?? 0;
            if (key === 'marginRight') return styleGuide?.btnMarginRight ?? 0;
            if (key === 'marginBottom') return styleGuide?.btnMarginBottom ?? styleGuide?.buttonMarginBottom ?? 16;
            if (key === 'marginLeft') return styleGuide?.btnMarginLeft ?? 0;
            if (key === 'marginUnit') return styleGuide?.btnMarginUnit || 'px';
            if (key === 'hoverTextColor') return styleGuide?.btnHoverTextColor || '#ffffff';
            if (key === 'hoverBgColor') return styleGuide?.btnHoverBgColor || primaryColor;
            if (key === 'hoverBorderStyle') return styleGuide?.btnHoverBorder?.type || 'none';
            if (key === 'hoverBorderWidth') return styleGuide?.btnHoverBorder?.width || 1;
            if (key === 'hoverBorderColor') return styleGuide?.btnHoverBorder?.color || '#d1d5db';
        }

        if (['input_email', 'input_name', 'input_phone', 'checkbox'].includes(type)) {
            if (key === 'textColor') return styleGuide?.fieldTextColor || '#111827';
            if (key === 'bgColor') return styleGuide?.fieldBgColor || '#ffffff';
            if (key === 'borderStyle') return styleGuide?.fieldBorder?.type || 'solid';
            if (key === 'borderColor') return styleGuide?.fieldBorder?.color || '#d1d5db';
            if (key === 'borderRadiusTL' || key === 'borderRadiusTR' || key === 'borderRadiusBL' || key === 'borderRadiusBR') return styleGuide?.fieldRadiusTop ?? 8;
            if (key === 'paddingTop') return styleGuide?.fieldPaddingTop ?? 12;
            if (key === 'paddingRight') return styleGuide?.fieldPaddingRight ?? 16;
            if (key === 'paddingBottom') return styleGuide?.fieldPaddingBottom ?? 12;
            if (key === 'paddingLeft') return styleGuide?.fieldPaddingLeft ?? 16;
            if (key === 'paddingUnit') return styleGuide?.fieldPaddingUnit || 'px';
            if (key === 'marginTop') return styleGuide?.fieldMarginTop ?? 0;
            if (key === 'marginRight') return styleGuide?.fieldMarginRight ?? 0;
            if (key === 'marginBottom') return styleGuide?.fieldMarginBottom ?? styleGuide?.fieldMarginBottom ?? 12;
            if (key === 'marginLeft') return styleGuide?.fieldMarginLeft ?? 0;
            if (key === 'marginUnit') return styleGuide?.fieldMarginUnit || 'px';
        }

        if (['section', 'flex_container', 'grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(type)) {
            if (key === 'containerWidth') return styleGuide?.containerWidth ?? 1200;
            if (key === 'paddingTop') return styleGuide?.containerPaddingTop ?? 48;
            if (key === 'paddingRight') return styleGuide?.containerPaddingRight ?? 24;
            if (key === 'paddingBottom') return styleGuide?.containerPaddingBottom ?? 48;
            if (key === 'paddingLeft') return styleGuide?.containerPaddingLeft ?? 24;
            if (key === 'paddingUnit') return styleGuide?.containerPaddingUnit || 'px';
            if (key === 'marginTop') return styleGuide?.containerMarginTop ?? 0;
            if (key === 'marginRight') return styleGuide?.containerMarginRight ?? 0;
            if (key === 'marginBottom') return styleGuide?.containerMarginBottom ?? styleGuide?.sectionMarginBottom ?? 24;
            if (key === 'marginLeft') return styleGuide?.containerMarginLeft ?? 0;
            if (key === 'marginUnit') return styleGuide?.containerMarginUnit || 'px';
            if (key === 'bgColor') return styleGuide?.bgColor || '#ffffff';
        }

        if (key === 'fontSize') return styleGuide?.fontSize || 17;
        if (key === 'lineHeight') return styleGuide?.lineHeight || 25;
        if (key === 'fontFamily') return styleGuide?.defaultFont || "'Inter', sans-serif";
        if (key === 'textColor') return styleGuide?.textColor || '#1f2937';
        if (key === 'bgColor') return '';

        return defaultVal;
    };

    const isKeyOverridden = (key) => viewport !== 'desktop' && selectedElement?.[viewport]?.[key] !== undefined;
    const isLocallySet = (key) => selectedElement && selectedElement[key] !== undefined;

    return (
        <div className="p-4 space-y-4 text-xs divide-y divide-neutral-200 overflow-y-auto">
            {/* Device Viewport Mode Indicator Banner */}
            <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                viewport === 'desktop'
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-700'
                    : viewport === 'tablet'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-blue-50 border-blue-300 text-blue-900'
            }`}>
                <div className="flex items-center gap-2 capitalize">
                    {viewport === 'desktop' && <Monitor className="h-4 w-4 text-neutral-600" />}
                    {viewport === 'tablet' && <Tablet className="h-4 w-4 text-amber-600" />}
                    {viewport === 'mobile' && <Smartphone className="h-4 w-4 text-blue-600" />}
                    <div>
                        <p className="font-bold text-[11px] leading-none">{viewport} Styling Mode</p>
                        <p className="text-[9px] text-neutral-500 font-normal mt-0.5">
                            {viewport === 'desktop' ? 'Modifies base / desktop styles' : `Edits apply ONLY to ${viewport} screens`}
                        </p>
                    </div>
                </div>
                {viewport !== 'desktop' && (
                    <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                        Object.keys(selectedElement?.[viewport] || {}).length > 0
                            ? 'bg-white text-brand-600 border-brand-300 shadow-sm'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                    }`}>
                        {Object.keys(selectedElement?.[viewport] || {}).length > 0 ? 'Customized' : 'Inheriting Desktop'}
                    </span>
                )}
            </div>

            <div className="space-y-4 pt-3">
                {/* Header & Delete Button */}
                <div className="flex items-center justify-between pb-1">
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

                {/* HEADING TAG SELECTION (H1 - H6) */}
                {['headline', 'subheadline'].includes(selectedElement.type) && (
                    <div className="space-y-1 pt-1">
                        <label className="block font-bold text-neutral-800">Heading Tag (SEO / Structure)</label>
                        <select
                            value={val('headingTag', selectedElement.type === 'headline' ? 'h1' : 'h2')}
                            onChange={e => handleUpdateElementSetting(selectedElement.id, 'headingTag', e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-bold bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        >
                            <option value="h1">H1 — Main Title</option>
                            <option value="h2">H2 — Section Header</option>
                            <option value="h3">H3 — Sub Heading</option>
                            <option value="h4">H4 — Small Header</option>
                            <option value="h5">H5 — Minor Header</option>
                            <option value="h6">H6 — Tiny Header</option>
                        </select>
                    </div>
                )}

                {/* 1. TEXT CONTENT */}
                {['headline', 'subheadline', 'paragraph', 'quote', 'submit_button', 'section', 'input_email', 'input_name', 'input_phone', 'checkbox', 'audio', 'icon_box', 'image', 'video'].includes(selectedElement.type) && (
                    <div className="space-y-2 pt-1">
                        <label className="block font-bold text-neutral-800">Element Content & Properties</label>
                        {selectedElement.type === 'paragraph' && (
                            <textarea
                                rows={4}
                                value={selectedElement.content || ''}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'content', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                placeholder="Enter paragraph text..."
                            />
                        )}

                        {['headline', 'subheadline'].includes(selectedElement.type) && (
                            <input
                                type="text"
                                value={selectedElement.content || ''}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'content', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                placeholder="Enter headline text..."
                            />
                        )}

                        {selectedElement.type === 'submit_button' && (
                            <input
                                type="text"
                                value={selectedElement.text || ''}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'text', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                placeholder="Button CTA text..."
                            />
                        )}

                        {['input_email', 'input_name', 'input_phone'].includes(selectedElement.type) && (
                            <input
                                type="text"
                                value={selectedElement.placeholder || ''}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'placeholder', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                placeholder="Input placeholder text..."
                            />
                        )}

                        {selectedElement.type === 'checkbox' && (
                            <input
                                type="text"
                                value={selectedElement.text || ''}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'text', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                placeholder="Checkbox label text..."
                            />
                        )}

                        {selectedElement.type === 'quote' && (
                            <div className="space-y-2">
                                <textarea
                                    rows={3}
                                    value={selectedElement.quote || selectedElement.content || ''}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'quote', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="Quote text..."
                                />
                                <input
                                    type="text"
                                    value={selectedElement.author || ''}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'author', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="Author name..."
                                />
                            </div>
                        )}

                        {selectedElement.type === 'image' && (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={selectedElement.url || ''}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'url', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="Image URL (https://...)"
                                />
                                <input
                                    type="text"
                                    value={selectedElement.alt || ''}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'alt', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="Image Alt attribute text..."
                                />
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                                        <span>Max Width (%)</span>
                                        <span className="font-mono text-brand-600 font-bold">{val('maxWidth', 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={val('maxWidth', 100)}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'maxWidth', Number(e.target.value))}
                                        className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                                    />
                                </div>
                            </div>
                        )}

                        {selectedElement.type === 'video' && (
                            <input
                                type="text"
                                value={selectedElement.videoUrl || ''}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'videoUrl', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                placeholder="Embed Video URL (YouTube / Vimeo embed)..."
                            />
                        )}

                        {selectedElement.type === 'audio' && (
                            <input
                                type="text"
                                value={selectedElement.title || ''}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'title', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                placeholder="Audio Track Title..."
                            />
                        )}

                        {selectedElement.type === 'icon_box' && (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={selectedElement.title || ''}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'title', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="Feature Card Title..."
                                />
                                <textarea
                                    rows={2}
                                    value={selectedElement.desc || ''}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'desc', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="Feature Card Description..."
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* BUTTON SPECIFIC OPTIONS & HOVER EFFECTS */}
                {selectedElement.type === 'submit_button' && (
                    <div className="space-y-3 pt-3 border-t border-neutral-200">
                        <h4 className="font-bold text-neutral-900 flex items-center justify-between">
                            <span>Button Actions & Style</span>
                        </h4>

                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Button Action / Type</label>
                            <select
                                value={val('btnType', 'submit')}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'btnType', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium"
                            >
                                <option value="submit">Submit Form & Go Next Step</option>
                                <option value="url">Open External URL</option>
                                <option value="step">Go to Specific Step</option>
                            </select>
                        </div>

                        {val('btnType') === 'url' && (
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Target URL</label>
                                <input
                                    type="text"
                                    value={val('targetUrl', '')}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'targetUrl', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium"
                                    placeholder="https://example.com/checkout"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Button Size</label>
                                <select
                                    value={val('btnSize', 'md')}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'btnSize', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium"
                                >
                                    <option value="sm">Small</option>
                                    <option value="md">Medium</option>
                                    <option value="lg">Large</option>
                                    <option value="xl">Full / XL</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Button Icon</label>
                                <select
                                    value={val('btnIcon', 'none')}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'btnIcon', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium"
                                >
                                    <option value="none">No Icon</option>
                                    <option value="arrow">Right Arrow (→)</option>
                                    <option value="lock">Lock (🔒)</option>
                                    <option value="lightning">Lightning (⚡)</option>
                                    <option value="cart">Cart (🛒)</option>
                                    <option value="download">Download (📥)</option>
                                    <option value="star">Star (⭐)</option>
                                    <option value="sparkles">Sparkles (✨)</option>
                                    <option value="check">Check (✓)</option>
                                </select>
                            </div>
                        </div>

                        {val('btnIcon') !== 'none' && (
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Icon Position</label>
                                <select
                                    value={val('btnIconPosition', 'right')}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'btnIconPosition', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium"
                                >
                                    <option value="right">Right Side</option>
                                    <option value="left">Left Side</option>
                                </select>
                            </div>
                        )}

                        {/* HOVER EFFECTS & MOVEMENT */}
                        <div className="space-y-2 pt-2 border-t border-neutral-100">
                            <h5 className="font-bold text-neutral-800">Hover Effects & Movement</h5>
                            
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Hover Background</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={val('hoverBgColor', styleGuide.btnHoverBgColor || '#b36443')}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'hoverBgColor', e.target.value)}
                                        className="h-8 w-10 cursor-pointer rounded border p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={val('hoverBgColor', styleGuide.btnHoverBgColor || '#b36443')}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'hoverBgColor', e.target.value)}
                                        className="flex-1 rounded-lg border p-1.5 font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Hover Text Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={val('hoverTextColor', '#ffffff')}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'hoverTextColor', e.target.value)}
                                        className="h-8 w-10 cursor-pointer rounded border p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={val('hoverTextColor', '#ffffff')}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'hoverTextColor', e.target.value)}
                                        className="flex-1 rounded-lg border p-1.5 font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between font-semibold text-neutral-600">
                                    <span>Hover Lift Y (Translate Y)</span>
                                    <span className="font-mono text-brand-600 font-bold">{val('hoverTransformY', -2)}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="-10"
                                    max="10"
                                    value={val('hoverTransformY', -2)}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'hoverTransformY', Number(e.target.value))}
                                    className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between font-semibold text-neutral-600">
                                    <span>Hover Shift X (Translate X)</span>
                                    <span className="font-mono text-brand-600 font-bold">{val('hoverTransformX', 0)}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="-10"
                                    max="10"
                                    value={val('hoverTransformX', 0)}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'hoverTransformX', Number(e.target.value))}
                                    className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. TYPOGRAPHY SECTION */}
                {['headline', 'subheadline', 'paragraph', 'quote', 'submit_button'].includes(selectedElement.type) && (
                    <div className="space-y-3 pt-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
                                Typography
                                {viewport !== 'desktop' && isKeyOverridden('fontSize') && (
                                    <Sparkles className="h-3 w-3 text-amber-500" title="Custom viewport overrides applied" />
                                )}
                            </h4>
                            <button
                                type="button"
                                onClick={() => handleResetElementCategory(selectedElement.id, 'typography')}
                                className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                                title={`Reset Typography for ${viewport}`}
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <TypographyControl
                            label="Typography"
                            value={{
                                family: val('fontFamily', styleGuide?.defaultFont || 'Default'),
                                size: val('fontSize', 16),
                                sizeUnit: val('fontSizeUnit', 'px'),
                                weight: val('fontWeight', '400'),
                                transform: val('textTransform', 'Default'),
                                style: val('fontStyle', 'Default'),
                                decoration: val('textDecoration', 'Default'),
                                lineHeight: val('lineHeight', 24),
                                lineHeightUnit: val('lineHeightUnit', 'px'),
                                letterSpacing: val('letterSpacing', 0),
                                letterSpacingUnit: val('letterSpacingUnit', 'px'),
                                wordSpacing: val('wordSpacing', 0),
                                wordSpacingUnit: val('wordSpacingUnit', 'px'),
                            }}
                            onChange={typo => {
                                const u = {};
                                if (typo.family !== undefined) u.fontFamily = typo.family;
                                if (typo.size !== undefined) u.fontSize = typo.size;
                                if (typo.sizeUnit !== undefined) u.fontSizeUnit = typo.sizeUnit;
                                if (typo.weight !== undefined) u.fontWeight = typo.weight;
                                if (typo.transform !== undefined) u.textTransform = typo.transform === 'Default' ? 'none' : typo.transform;
                                if (typo.style !== undefined) u.fontStyle = typo.style === 'Default' ? 'normal' : typo.style;
                                if (typo.decoration !== undefined) u.textDecoration = typo.decoration === 'Default' ? 'none' : typo.decoration;
                                if (typo.lineHeight !== undefined) u.lineHeight = typo.lineHeight;
                                if (typo.lineHeightUnit !== undefined) u.lineHeightUnit = typo.lineHeightUnit;
                                if (typo.letterSpacing !== undefined) u.letterSpacing = typo.letterSpacing;
                                if (typo.letterSpacingUnit !== undefined) u.letterSpacingUnit = typo.letterSpacingUnit;
                                if (typo.wordSpacing !== undefined) u.wordSpacing = typo.wordSpacing;
                                if (typo.wordSpacingUnit !== undefined) u.wordSpacingUnit = typo.wordSpacingUnit;
                                handleUpdateElementSetting(selectedElement.id, u);
                            }}
                        />
                    </div>
                )}

                {/* 3. STYLE — Color, Shadow, Border with Normal/Hover tabs */}
                <div className="space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-neutral-900">Style</h4>
                        <button
                            type="button"
                            onClick={() => {
                                handleResetElementCategory(selectedElement.id, 'color');
                                handleResetElementCategory(selectedElement.id, 'border');
                            }}
                            className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                            title="Reset Style"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <TabSwitcher tabs={['Normal', 'Hover']} active={styleTab} onChange={setStyleTab} />
                    {styleTab === 'Normal' ? (
                    <>
                    {['headline', 'subheadline', 'paragraph', 'quote', 'submit_button'].includes(selectedElement.type) && (
                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Text Color</label>
                            <ColorPickerInput
                                value={val('textColor', '#111827')}
                                onChange={v => handleUpdateElementSetting(selectedElement.id, 'textColor', v)}
                                styleGuide={styleGuide}
                            />
                        </div>
                    )}
                    {/* ── BACKGROUND TYPE SELECTOR ── */}
                    <div className="space-y-2">
                        <label className="block font-semibold text-neutral-600">Background Type</label>
                        <div className="flex gap-1 p-1 rounded-lg bg-neutral-100 border border-neutral-200">
                            {[
                                { value: 'solid', label: '● Solid' },
                                { value: 'gradient', label: '◑ Gradient' },
                                { value: 'image', label: '⬜ Image' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleUpdateElementSetting(selectedElement.id, 'bgType', opt.value)}
                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                                        val('bgType', 'solid') === opt.value
                                            ? 'bg-white text-brand-600 shadow-sm border border-brand-200'
                                            : 'text-neutral-500 hover:text-neutral-800'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* SOLID */}
                        {val('bgType', 'solid') === 'solid' && (
                            <ColorPickerInput
                                value={val('bgColor', '#ffffff')}
                                onChange={v => handleUpdateElementSetting(selectedElement.id, 'bgColor', v)}
                                styleGuide={styleGuide}
                            />
                        )}

                        {/* GRADIENT */}
                        {val('bgType') === 'gradient' && (() => {
                            // helper: read stops array with safe defaults
                            const stops = val('gradientStops', [
                                { color: val('gradientColor1', '#6366f1'), pos: 0 },
                                { color: val('gradientColor2', '#ec4899'), pos: 100 },
                            ]);
                            const gType  = val('gradientType', 'linear');
                            const angle  = val('gradientAngle', 135);

                            // Build CSS gradient string from stops
                            const stopsStr = stops
                                .slice()
                                .sort((a, b) => a.pos - b.pos)
                                .map(s => `${s.color} ${s.pos}%`)
                                .join(', ');
                            const previewCss = gType === 'radial'
                                ? `radial-gradient(circle, ${stopsStr})`
                                : `linear-gradient(${angle}deg, ${stopsStr})`;

                            const updateStops = (newStops) =>
                                handleUpdateElementSetting(selectedElement.id, 'gradientStops', newStops);

                            const addStop = () => {
                                const sorted = [...stops].sort((a, b) => a.pos - b.pos);
                                // insert midpoint between last two stops or at 50% if < 2
                                let newPos = 50;
                                if (sorted.length >= 2) {
                                    const last = sorted[sorted.length - 1];
                                    const prev = sorted[sorted.length - 2];
                                    newPos = Math.round((last.pos + prev.pos) / 2);
                                }
                                // blend color between prev and last
                                updateStops([...stops, { color: '#ffffff', pos: newPos }]);
                            };

                            const removeStop = (idx) => {
                                if (stops.length <= 2) return; // keep minimum 2
                                updateStops(stops.filter((_, i) => i !== idx));
                            };

                            const updateStop = (idx, field, value) => {
                                const next = stops.map((s, i) =>
                                    i === idx ? { ...s, [field]: value } : s
                                );
                                updateStops(next);
                            };

                            return (
                                <div className="space-y-2.5 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                                    {/* Gradient Type: Linear / Radial */}
                                    <div className="flex gap-1 p-1 rounded-lg bg-neutral-100">
                                        {[
                                            { value: 'linear', label: '↗ Linear' },
                                            { value: 'radial', label: '◎ Radial' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleUpdateElementSetting(selectedElement.id, 'gradientType', opt.value)}
                                                className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${
                                                    gType === opt.value
                                                        ? 'bg-white text-brand-600 shadow-sm border border-brand-200'
                                                        : 'text-neutral-500 hover:text-neutral-700'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Live Gradient Preview Strip */}
                                    <div
                                        className="w-full h-8 rounded-lg border border-neutral-200 shadow-inner"
                                        style={{ background: previewCss }}
                                    />

                                    {/* Color Stops */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Color Stops</span>
                                            <button
                                                type="button"
                                                onClick={addStop}
                                                className="flex items-center gap-0.5 text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-md transition"
                                            >
                                                + Add Stop
                                            </button>
                                        </div>

                                        {stops.map((stop, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-neutral-200 shadow-sm">
                                                <ColorPickerInput
                                                    value={stop.color}
                                                    onChange={v => updateStop(idx, 'color', v)}
                                                    styleGuide={styleGuide}
                                                    className="flex-1"
                                                />
                                                {/* Position % Numeric Input (No Slider) */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <span className="text-[10px] text-neutral-400 font-semibold">Pos:</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={stop.pos}
                                                        onChange={e => updateStop(idx, 'pos', Math.max(0, Math.min(100, Number(e.target.value))))}
                                                        className="w-12 rounded border border-neutral-300 p-1 text-center font-bold text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                                                    />
                                                    <span className="text-[10px] font-bold text-neutral-500">%</span>
                                                </div>
                                                {/* Trash Remove Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeStop(idx)}
                                                    disabled={stops.length <= 2}
                                                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-20 disabled:cursor-not-allowed transition shrink-0"
                                                    title={stops.length <= 2 ? 'Need at least 2 stops' : `Remove stop ${idx + 1}`}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Angle (only for Linear) */}
                                    {gType === 'linear' && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-semibold text-neutral-500">
                                                <span>Angle</span>
                                                <span className="text-brand-600 font-bold">{angle}°</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="360"
                                                    value={angle}
                                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'gradientAngle', Number(e.target.value))}
                                                    className="flex-1 accent-brand-600 cursor-pointer h-1.5"
                                                />
                                                <input
                                                    type="number"
                                                    value={angle}
                                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'gradientAngle', Number(e.target.value))}
                                                    className="w-14 rounded border p-1 text-center font-bold text-xs"
                                                />
                                            </div>
                                            {/* Quick Angle Presets */}
                                            <div className="flex gap-1 flex-wrap mt-1">
                                                {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                                                    <button
                                                        key={a}
                                                        type="button"
                                                        onClick={() => handleUpdateElementSetting(selectedElement.id, 'gradientAngle', a)}
                                                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition ${
                                                            angle === a
                                                                ? 'bg-brand-600 text-white'
                                                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                                        }`}
                                                    >
                                                        {a}°
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}


                        {/* IMAGE BACKGROUND */}
                        {val('bgType') === 'image' && (
                            <div className="space-y-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-semibold text-neutral-500">Image URL</label>
                                    <input
                                        type="text"
                                        value={val('bgImage', '')}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'bgImage', e.target.value)}
                                        className="w-full rounded-lg border p-1.5 font-mono text-xs bg-white"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-semibold text-neutral-500">Size</label>
                                        <select
                                            value={val('bgSize', 'cover')}
                                            onChange={e => handleUpdateElementSetting(selectedElement.id, 'bgSize', e.target.value)}
                                            className="w-full rounded border border-neutral-300 p-1 text-xs font-medium bg-white"
                                        >
                                            <option value="cover">Cover</option>
                                            <option value="contain">Contain</option>
                                            <option value="auto">Auto</option>
                                            <option value="100% 100%">Stretch</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-semibold text-neutral-500">Position</label>
                                        <select
                                            value={val('bgPosition', 'center center')}
                                            onChange={e => handleUpdateElementSetting(selectedElement.id, 'bgPosition', e.target.value)}
                                            className="w-full rounded border border-neutral-300 p-1 text-xs font-medium bg-white"
                                        >
                                            <option value="center center">Center</option>
                                            <option value="top center">Top Center</option>
                                            <option value="bottom center">Bottom Center</option>
                                            <option value="left center">Left</option>
                                            <option value="right center">Right</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-semibold text-neutral-500">Repeat</label>
                                    <select
                                        value={val('bgRepeat', 'no-repeat')}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'bgRepeat', e.target.value)}
                                        className="w-full rounded border border-neutral-300 p-1 text-xs font-medium bg-white"
                                    >
                                        <option value="no-repeat">No Repeat</option>
                                        <option value="repeat">Repeat (Tile)</option>
                                        <option value="repeat-x">Repeat Horizontal</option>
                                        <option value="repeat-y">Repeat Vertical</option>
                                    </select>
                                </div>
                                {/* Overlay Color on Image */}
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-semibold text-neutral-500">Overlay Color</label>
                                    <ColorPickerInput
                                        value={val('bgOverlay', '')}
                                        onChange={v => handleUpdateElementSetting(selectedElement.id, 'bgOverlay', v)}
                                        styleGuide={styleGuide}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Shadow — Normal tab */}
                    <ShadowControl
                        label="Box Shadow"
                        value={{
                            color: val('shadowColor', 'rgba(0,0,0,0.15)'),
                            h: val('shadowH', 0),
                            v: val('shadowV', 8),
                            blur: val('shadowBlur', 24),
                            spread: val('shadowSpread', 0),
                        }}
                        onChange={s => {
                            const u = {};
                            if (s.color !== undefined) u.shadowColor = s.color;
                            if (s.h !== undefined) u.shadowH = s.h;
                            if (s.v !== undefined) u.shadowV = s.v;
                            if (s.blur !== undefined) u.shadowBlur = s.blur;
                            if (s.spread !== undefined) u.shadowSpread = s.spread;
                            handleUpdateElementSetting(selectedElement.id, u);
                        }}
                        styleGuide={styleGuide}
                    />

                    {/* Border & Radius — Normal */}
                    <BorderControl
                        label="Border"
                        value={{
                            type: val('borderStyle', 'Default'),
                            width: val('borderWidth', 1),
                            widthUnit: 'px',
                            color: val('borderColor', '#d1d5db'),
                        }}
                        onChange={b => {
                            const u = {};
                            if (b.type !== undefined) u.borderStyle = b.type === 'Default' ? 'none' : b.type;
                            if (b.width !== undefined) u.borderWidth = b.width;
                            if (b.color !== undefined) u.borderColor = b.color;
                            handleUpdateElementSetting(selectedElement.id, u);
                        }}
                        styleGuide={styleGuide}
                    />

                    <FourSideInput
                        label="Corner Radius"
                        top={val('borderRadiusTL', val('borderRadius', 0))}
                        right={val('borderRadiusTR', val('borderRadius', 0))}
                        bottom={val('borderRadiusBL', val('borderRadius', 0))}
                        left={val('borderRadiusBR', val('borderRadius', 0))}
                        unit={val('borderRadiusUnit', 'px')}
                        units={['px', 'em', 'rem', '%']}
                        onUnitChange={u => handleUpdateElementSetting(selectedElement.id, 'borderRadiusUnit', u)}
                        onChange={s => {
                            handleUpdateElementSetting(selectedElement.id, {
                                borderRadiusTL: s.top,
                                borderRadiusTR: s.right,
                                borderRadiusBL: s.bottom,
                                borderRadiusBR: s.left,
                                borderRadius: s.top,
                            });
                        }}
                    />
                    </>
                    ) : (
                    <>
                        {/* ── HOVER TAB ── */}
                        {['headline', 'subheadline', 'paragraph', 'quote', 'submit_button'].includes(selectedElement.type) && (
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Text Color</label>
                                <ColorPickerInput
                                    value={val('hoverTextColor', '#000000')}
                                    onChange={v => handleUpdateElementSetting(selectedElement.id, 'hoverTextColor', v)}
                                    styleGuide={styleGuide}
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Background Color</label>
                            <ColorPickerInput
                                value={val('hoverBgColor', '#ffffff')}
                                onChange={v => handleUpdateElementSetting(selectedElement.id, 'hoverBgColor', v)}
                                styleGuide={styleGuide}
                            />
                        </div>

                        <ShadowControl
                            label="Box Shadow"
                            value={{
                                color: val('hoverShadowColor', 'rgba(0,0,0,0.15)'),
                                h: val('hoverShadowH', 0),
                                v: val('hoverShadowV', 8),
                                blur: val('hoverShadowBlur', 24),
                                spread: val('hoverShadowSpread', 0),
                            }}
                            onChange={s => {
                                const u = {};
                                if (s.color !== undefined) u.hoverShadowColor = s.color;
                                if (s.h !== undefined) u.hoverShadowH = s.h;
                                if (s.v !== undefined) u.hoverShadowV = s.v;
                                if (s.blur !== undefined) u.hoverShadowBlur = s.blur;
                                if (s.spread !== undefined) u.hoverShadowSpread = s.spread;
                                handleUpdateElementSetting(selectedElement.id, u);
                            }}
                            styleGuide={styleGuide}
                        />

                        <BorderControl
                            label="Border"
                            value={{
                                type: val('hoverBorderStyle', 'Default'),
                                width: val('hoverBorderWidth', 1),
                                widthUnit: 'px',
                                color: val('hoverBorderColor', '#d1d5db'),
                            }}
                            onChange={b => {
                                const u = {};
                                if (b.type !== undefined) u.hoverBorderStyle = b.type === 'Default' ? 'none' : b.type;
                                if (b.width !== undefined) u.hoverBorderWidth = b.width;
                                if (b.color !== undefined) u.hoverBorderColor = b.color;
                                handleUpdateElementSetting(selectedElement.id, u);
                            }}
                            styleGuide={styleGuide}
                        />

                        <FourSideInput
                            label="Corner Radius"
                            top={val('hoverBorderRadius', val('borderRadius', 0))}
                            right={val('hoverBorderRadius', val('borderRadius', 0))}
                            bottom={val('hoverBorderRadius', val('borderRadius', 0))}
                            left={val('hoverBorderRadius', val('borderRadius', 0))}
                            unit="px"
                            onChange={s => handleUpdateElementSetting(selectedElement.id, 'hoverBorderRadius', s.top)}
                        />
                    </>
                    )}
                </div>

                {/* 4. SIZE AND POSITION (PADDING & MARGIN & CONTAINER WIDTH) */}
                <div className="space-y-3 pt-3">
                    <h4 className="font-bold text-neutral-900 flex items-center justify-between">
                        <span>Size and position</span>
                        <button
                            type="button"
                            onClick={() => handleResetElementCategory(selectedElement.id, 'size_position')}
                            className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                            title={`Reset Size & Position for ${viewport}`}
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </h4>
                    {selectedElement.type === 'section' && (
                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Container width</label>
                            <select
                                value={val('containerWidth', '1200')}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'containerWidth', e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                            >
                                <option value="100%">Full Width (100%)</option>
                                <option value="1600">Wide (1600px)</option>
                                <option value="1280">Large (1280px)</option>
                                <option value="1200">Default (1200px)</option>
                                <option value="1024">Standard (1024px)</option>
                                <option value="960">Medium (960px)</option>
                                <option value="768">Tablet (768px)</option>
                                <option value="640">Narrow (640px)</option>
                                <option value="540">Small (540px)</option>
                            </select>
                        </div>
                    )}
                    {/* PADDING CONTROL */}
                    <FourSideInput
                        label="Padding"
                        top={val('paddingTop', val('paddingY', 0))}
                        right={val('paddingRight', val('paddingX', 0))}
                        bottom={val('paddingBottom', val('paddingY', 0))}
                        left={val('paddingLeft', val('paddingX', 0))}
                        unit={val('paddingUnit', 'px')}
                        units={['px', '%', 'rem', 'vw']}
                        onUnitChange={u => handleUpdateElementSetting(selectedElement.id, 'paddingUnit', u)}
                        onChange={s => {
                            handleUpdateElementSetting(selectedElement.id, {
                                paddingTop: s.top,
                                paddingRight: s.right,
                                paddingBottom: s.bottom,
                                paddingLeft: s.left,
                                paddingY: s.top,
                                paddingX: s.right,
                            });
                        }}
                        defaultLinked={true}
                    />

                    {/* MARGIN CONTROL */}
                    <FourSideInput
                        label="Margin"
                        top={val('marginTop', 0)}
                        right={val('marginRight', 0)}
                        bottom={val('marginBottom', 0)}
                        left={val('marginLeft', 0)}
                        unit={val('marginUnit', 'px')}
                        units={['px', '%', 'rem', 'vw']}
                        onUnitChange={u => handleUpdateElementSetting(selectedElement.id, 'marginUnit', u)}
                        onChange={s => {
                            handleUpdateElementSetting(selectedElement.id, {
                                marginTop: s.top,
                                marginRight: s.right,
                                marginBottom: s.bottom,
                                marginLeft: s.left,
                            });
                        }}
                        defaultLinked={true}
                    />
                </div>

                {/* 5. CONTAINER LAYOUT ENGINE (FLEXBOX vs GRID) */}
                {['section', 'flex_container', 'grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(selectedElement.type) && (
                    <div className="space-y-4 pt-3 border-t border-neutral-200">
                        <h4 className="font-bold text-neutral-900 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-700">
                                ▾ Container Layout
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    {viewport === 'desktop' ? <Monitor className="h-3 w-3" /> : viewport === 'tablet' ? <Tablet className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                                    {viewport}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleResetElementCategory(selectedElement.id, 'flex_container')}
                                    className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                                    title={`Reset Layout for ${viewport}`}
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </h4>

                        {/* Container Layout & Content Width Selectors */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-neutral-700">Container Layout</label>
                                    <select
                                        value={val('layoutMode', selectedElement.type === 'section' ? 'block' : (selectedElement.type === 'grid_container' || selectedElement.type.startsWith('col_') ? 'grid' : 'flex'))}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'layoutMode', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    >
                                        <option value="flex">Flexbox</option>
                                        <option value="grid">Grid</option>
                                        <option value="block">Block</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-neutral-700">Content Width</label>
                                    <select
                                        value={val('contentWidth', 'full')}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'contentWidth', e.target.value)}
                                        className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    >
                                        <option value="full">Full Width</option>
                                        <option value="boxed">Boxed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Width Slider & Input */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                                    <span className="flex items-center gap-1">Width <Monitor className="h-3 w-3 text-neutral-400" /></span>
                                    <select
                                        value={val('widthUnit', '%')}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'widthUnit', e.target.value)}
                                        className="text-[10px] font-bold text-neutral-500 bg-transparent border-0 py-0 pr-2 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="%">%</option>
                                        <option value="px">px</option>
                                        <option value="vw">vw</option>
                                        <option value="rem">rem</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max={val('widthUnit', '%') === '%' || val('widthUnit', '%') === 'vw' ? 100 : 1920}
                                        step="0.5"
                                        value={val('width', val('widthUnit', '%') === '%' ? 100 : 1200)}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'width', parseFloat(e.target.value))}
                                        className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={val('width', val('widthUnit', '%') === '%' ? 100 : 1200)}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'width', parseFloat(e.target.value) || 0)}
                                        className="w-16 rounded-lg border border-neutral-300 p-1.5 text-xs text-center font-bold text-neutral-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Min Height Slider & Input */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                                    <span className="flex items-center gap-1">Min Height <Monitor className="h-3 w-3 text-neutral-400" /></span>
                                    <select
                                        value={val('minHeightUnit', 'px')}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'minHeightUnit', e.target.value)}
                                        className="text-[10px] font-bold text-neutral-500 bg-transparent border-0 py-0 pr-2 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="px">px</option>
                                        <option value="vh">vh</option>
                                        <option value="%">%</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max={val('minHeightUnit', 'px') === 'vh' || val('minHeightUnit', 'px') === '%' ? 100 : 1000}
                                        value={val('minHeight', 0)}
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'minHeight', parseFloat(e.target.value))}
                                        className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        value={val('minHeight', '')}
                                        placeholder="Auto"
                                        onChange={e => handleUpdateElementSetting(selectedElement.id, 'minHeight', e.target.value ? parseFloat(e.target.value) : '')}
                                        className="w-16 rounded-lg border border-neutral-300 p-1.5 text-xs text-center font-bold text-neutral-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    />
                                </div>
                                <p className="text-[10px] italic text-neutral-400">To achieve full height Container use 100vh.</p>
                            </div>
                        </div>

                        {/* ── ITEMS SECTION HEADER ── */}
                        <div className="pt-2 border-t border-neutral-200">
                            <h5 className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider mb-2">Items</h5>

                            {/* ── FLEXBOX ITEMS CONTROLS ── */}
                            {val('layoutMode', selectedElement.type === 'section' ? 'block' : (selectedElement.type === 'grid_container' || selectedElement.type.startsWith('col_') ? 'grid' : 'flex')) === 'flex' && (
                                <div className="space-y-3">
                                    {/* Direction */}
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-neutral-600 flex items-center gap-1">Direction <Monitor className="h-3 w-3 text-neutral-400" /></label>
                                        <div className="grid grid-cols-4 gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                            {[
                                                { key: 'row', icon: '→', title: 'Row' },
                                                { key: 'column', icon: '↓', title: 'Column' },
                                                { key: 'row-reverse', icon: '←', title: 'Row Reverse' },
                                                { key: 'column-reverse', icon: '↑', title: 'Column Reverse' },
                                            ].map(d => (
                                                <button
                                                    key={d.key}
                                                    type="button"
                                                    title={d.title}
                                                    onClick={() => handleUpdateElementSetting(selectedElement.id, 'flexDirection', d.key)}
                                                    className={`py-1.5 text-xs font-extrabold rounded transition ${
                                                        val('flexDirection', selectedElement.type === 'section' ? 'column' : 'row') === d.key
                                                            ? 'bg-neutral-800 text-white shadow-sm'
                                                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                                                    }`}
                                                >
                                                    {d.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Justify Content */}
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-neutral-600 flex items-center gap-1">Justify Content <Monitor className="h-3 w-3 text-neutral-400" /></label>
                                        <div className="grid grid-cols-6 gap-0.5 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                            {[
                                                { key: 'flex-start', icon: '▍ ', title: 'Start' },
                                                { key: 'center', icon: ' ▌ ', title: 'Center' },
                                                { key: 'flex-end', icon: ' ▍', title: 'End' },
                                                { key: 'space-between', icon: '▍ ▍', title: 'Space Between' },
                                                { key: 'space-around', icon: '▌ ▌', title: 'Space Around' },
                                                { key: 'space-evenly', icon: '▕ ▕', title: 'Space Evenly' },
                                            ].map(j => (
                                                <button
                                                    key={j.key}
                                                    type="button"
                                                    title={j.title}
                                                    onClick={() => handleUpdateElementSetting(selectedElement.id, 'justifyContent', j.key)}
                                                    className={`py-1 text-xs font-black rounded transition flex items-center justify-center ${
                                                        val('justifyContent', 'flex-start') === j.key
                                                            ? 'bg-neutral-800 text-white shadow-sm'
                                                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                                                    }`}
                                                >
                                                    {j.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Align Items */}
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-neutral-600 flex items-center gap-1">Align Items <Monitor className="h-3 w-3 text-neutral-400" /></label>
                                        <div className="grid grid-cols-4 gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                            {[
                                                { key: 'flex-start', icon: '⊤', title: 'Start' },
                                                { key: 'center', icon: '┼', title: 'Center' },
                                                { key: 'flex-end', icon: '⊥', title: 'End' },
                                                { key: 'stretch', icon: '⧉', title: 'Stretch' },
                                            ].map(a => (
                                                <button
                                                    key={a.key}
                                                    type="button"
                                                    title={a.title}
                                                    onClick={() => handleUpdateElementSetting(selectedElement.id, 'alignItems', a.key)}
                                                    className={`py-1.5 text-xs font-extrabold rounded transition ${
                                                        val('alignItems', 'stretch') === a.key
                                                            ? 'bg-neutral-800 text-white shadow-sm'
                                                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                                                    }`}
                                                >
                                                    {a.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Gaps (Column & Row Gap + Link Toggle) */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                                            <span className="flex items-center gap-1">Gaps <Monitor className="h-3 w-3 text-neutral-400" /></span>
                                            <select
                                                value={val('gapUnit', 'px')}
                                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'gapUnit', e.target.value)}
                                                className="text-[10px] font-bold text-neutral-500 bg-transparent border-0 py-0 pr-2 focus:ring-0 cursor-pointer"
                                            >
                                                <option value="px">px</option>
                                                <option value="rem">rem</option>
                                                <option value="%">%</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                            <div className="flex-1 space-y-0.5 text-center">
                                                <input
                                                    type="number"
                                                    value={val('gapX', val('gap', 24))}
                                                    onChange={e => {
                                                        const num = parseFloat(e.target.value) || 0;
                                                        if (val('gapsLinked', true)) {
                                                            handleUpdateElementSetting(selectedElement.id, { gapX: num, gapY: num, gap: num });
                                                        } else {
                                                            handleUpdateElementSetting(selectedElement.id, 'gapX', num);
                                                        }
                                                    }}
                                                    className="w-full text-center text-xs font-extrabold text-neutral-800 bg-white border border-neutral-300 rounded p-1.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                                />
                                                <span className="block text-[9px] font-semibold text-neutral-400 uppercase">Column</span>
                                            </div>
                                            <div className="flex-1 space-y-0.5 text-center">
                                                <input
                                                    type="number"
                                                    value={val('gapY', val('gap', 24))}
                                                    onChange={e => {
                                                        const num = parseFloat(e.target.value) || 0;
                                                        if (val('gapsLinked', true)) {
                                                            handleUpdateElementSetting(selectedElement.id, { gapX: num, gapY: num, gap: num });
                                                        } else {
                                                            handleUpdateElementSetting(selectedElement.id, 'gapY', num);
                                                        }
                                                    }}
                                                    className="w-full text-center text-xs font-extrabold text-neutral-800 bg-white border border-neutral-300 rounded p-1.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                                />
                                                <span className="block text-[9px] font-semibold text-neutral-400 uppercase">Row</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newLinked = !val('gapsLinked', true);
                                                    handleUpdateElementSetting(selectedElement.id, 'gapsLinked', newLinked);
                                                    if (newLinked) {
                                                        const activeVal = val('gapX', val('gap', 24));
                                                        handleUpdateElementSetting(selectedElement.id, { gapX: activeVal, gapY: activeVal, gap: activeVal });
                                                    }
                                                }}
                                                className={`p-2 rounded border transition ${
                                                    val('gapsLinked', true)
                                                        ? 'bg-neutral-800 text-white border-neutral-800'
                                                        : 'bg-white text-neutral-400 border-neutral-300 hover:text-neutral-700'
                                                }`}
                                                title={val('gapsLinked', true) ? 'Unlink Column & Row Gaps' : 'Link Column & Row Gaps'}
                                            >
                                                {val('gapsLinked', true) ? <LinkIcon className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Wrap */}
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-neutral-600 flex items-center gap-1">Wrap <Monitor className="h-3 w-3 text-neutral-400" /></label>
                                        <div className="grid grid-cols-2 gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                            {[
                                                { key: 'nowrap', icon: '↳ No Wrap' },
                                                { key: 'wrap', icon: '↲ Wrap' },
                                            ].map(w => (
                                                <button
                                                    key={w.key}
                                                    type="button"
                                                    onClick={() => handleUpdateElementSetting(selectedElement.id, 'flexWrap', w.key)}
                                                    className={`py-1.5 text-xs font-extrabold rounded transition ${
                                                        val('flexWrap', 'nowrap') === w.key
                                                            ? 'bg-neutral-800 text-white shadow-sm'
                                                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                                                    }`}
                                                >
                                                    {w.icon}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] italic text-neutral-400">Items within the container can stay in a single line (No wrap), or break into multiple lines (Wrap).</p>
                                    </div>
                                </div>
                            )}

                            {/* ── GRID ITEMS CONTROLS ── */}
                            {val('layoutMode', selectedElement.type === 'section' ? 'block' : (selectedElement.type === 'grid_container' || selectedElement.type.startsWith('col_') ? 'grid' : 'flex')) === 'grid' && (
                                <div className="space-y-3">
                                    {/* Grid Outline Switch */}
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-xs font-semibold text-neutral-700">Grid Outline</span>
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateElementSetting(selectedElement.id, 'gridOutline', !val('gridOutline', true))}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                val('gridOutline', true) ? 'bg-pink-500' : 'bg-neutral-300'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    val('gridOutline', true) ? 'translate-x-4' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Columns Slider & Input */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                                            <span className="flex items-center gap-1">Columns <Monitor className="h-3 w-3 text-neutral-400" /></span>
                                            <select
                                                value={val('gridColumnsUnit', '1fr') === 'fr' ? '1fr' : val('gridColumnsUnit', '1fr')}
                                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'gridColumnsUnit', e.target.value)}
                                                className="text-[10px] font-bold text-neutral-500 bg-transparent border-0 py-0 pr-2 focus:ring-0 cursor-pointer"
                                            >
                                                <option value="1fr">fr</option>
                                                <option value="px">px</option>
                                                <option value="%">%</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="1"
                                                max="12"
                                                value={val('gridColumns', selectedElement.colsCount || 2)}
                                                onChange={e => {
                                                    const count = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
                                                    const currCols = [...(selectedElement.columns || [])];
                                                    while (currCols.length < count) currCols.push([]);
                                                    handleUpdateElementSetting(selectedElement.id, {
                                                        gridColumns: count,
                                                        colsCount: count,
                                                        columns: currCols.slice(0, count)
                                                    });
                                                }}
                                                className="flex-1 accent-neutral-800 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                                            />
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={val('gridColumns', selectedElement.colsCount || 2)}
                                                onChange={e => {
                                                    const count = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
                                                    const currCols = [...(selectedElement.columns || [])];
                                                    while (currCols.length < count) currCols.push([]);
                                                    handleUpdateElementSetting(selectedElement.id, {
                                                        gridColumns: count,
                                                        colsCount: count,
                                                        columns: currCols.slice(0, count)
                                                    });
                                                }}
                                                className="w-16 rounded-lg border border-neutral-300 p-1.5 text-xs text-center font-bold text-neutral-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Rows Slider & Input */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                                            <span className="flex items-center gap-1">Rows <Monitor className="h-3 w-3 text-neutral-400" /></span>
                                            <select
                                                value={val('gridRowsUnit', 'fr')}
                                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'gridRowsUnit', e.target.value)}
                                                className="text-[10px] font-bold text-neutral-500 bg-transparent border-0 py-0 pr-2 focus:ring-0 cursor-pointer"
                                            >
                                                <option value="fr">fr</option>
                                                <option value="px">px</option>
                                                <option value="%">%</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="1"
                                                max="12"
                                                value={val('gridRows', 2)}
                                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'gridRows', parseInt(e.target.value) || 1)}
                                                className="flex-1 accent-neutral-800 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                                            />
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={val('gridRows', 2)}
                                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'gridRows', parseInt(e.target.value) || 1)}
                                                className="w-16 rounded-lg border border-neutral-300 p-1.5 text-xs text-center font-bold text-neutral-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Gaps (Column & Row Gap + Link Toggle) */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                                            <span className="flex items-center gap-1">Gaps <Monitor className="h-3 w-3 text-neutral-400" /></span>
                                            <select
                                                value={val('gapUnit', 'px')}
                                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'gapUnit', e.target.value)}
                                                className="text-[10px] font-bold text-neutral-500 bg-transparent border-0 py-0 pr-2 focus:ring-0 cursor-pointer"
                                            >
                                                <option value="px">px</option>
                                                <option value="rem">rem</option>
                                                <option value="%">%</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                            <div className="flex-1 space-y-0.5 text-center">
                                                <input
                                                    type="number"
                                                    value={val('gapX', val('gap', 24))}
                                                    onChange={e => {
                                                        const num = parseFloat(e.target.value) || 0;
                                                        if (val('gapsLinked', true)) {
                                                            handleUpdateElementSetting(selectedElement.id, { gapX: num, gapY: num, gap: num });
                                                        } else {
                                                            handleUpdateElementSetting(selectedElement.id, 'gapX', num);
                                                        }
                                                    }}
                                                    className="w-full text-center text-xs font-extrabold text-neutral-800 bg-white border border-neutral-300 rounded p-1.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                                />
                                                <span className="block text-[9px] font-semibold text-neutral-400 uppercase">Column</span>
                                            </div>
                                            <div className="flex-1 space-y-0.5 text-center">
                                                <input
                                                    type="number"
                                                    value={val('gapY', val('gap', 24))}
                                                    onChange={e => {
                                                        const num = parseFloat(e.target.value) || 0;
                                                        if (val('gapsLinked', true)) {
                                                            handleUpdateElementSetting(selectedElement.id, { gapX: num, gapY: num, gap: num });
                                                        } else {
                                                            handleUpdateElementSetting(selectedElement.id, 'gapY', num);
                                                        }
                                                    }}
                                                    className="w-full text-center text-xs font-extrabold text-neutral-800 bg-white border border-neutral-300 rounded p-1.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                                />
                                                <span className="block text-[9px] font-semibold text-neutral-400 uppercase">Row</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newLinked = !val('gapsLinked', true);
                                                    handleUpdateElementSetting(selectedElement.id, 'gapsLinked', newLinked);
                                                    if (newLinked) {
                                                        const activeVal = val('gapX', val('gap', 24));
                                                        handleUpdateElementSetting(selectedElement.id, { gapX: activeVal, gapY: activeVal, gap: activeVal });
                                                    }
                                                }}
                                                className={`p-2 rounded border transition ${
                                                    val('gapsLinked', true)
                                                        ? 'bg-neutral-800 text-white border-neutral-800'
                                                        : 'bg-white text-neutral-400 border-neutral-300 hover:text-neutral-700'
                                                }`}
                                                title={val('gapsLinked', true) ? 'Unlink Column & Row Gaps' : 'Link Column & Row Gaps'}
                                            >
                                                {val('gapsLinked', true) ? <LinkIcon className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Auto Flow */}
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-neutral-600 flex items-center gap-1">Auto Flow <Monitor className="h-3 w-3 text-neutral-400" /></label>
                                        <select
                                            value={val('gridAutoFlow', 'row')}
                                            onChange={e => handleUpdateElementSetting(selectedElement.id, 'gridAutoFlow', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                        >
                                            <option value="row">Row</option>
                                            <option value="column">Column</option>
                                            <option value="row dense">Row Dense</option>
                                            <option value="column dense">Column Dense</option>
                                        </select>
                                    </div>

                                    {/* Justify Items */}
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-neutral-600 flex items-center gap-1">Justify Items <Monitor className="h-3 w-3 text-neutral-400" /></label>
                                        <div className="grid grid-cols-4 gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                            {[
                                                { key: 'start', icon: '╞', title: 'Start' },
                                                { key: 'center', icon: '┼', title: 'Center' },
                                                { key: 'end', icon: '╡', title: 'End' },
                                                { key: 'stretch', icon: '⧉', title: 'Stretch' },
                                            ].map(j => (
                                                <button
                                                    key={j.key}
                                                    type="button"
                                                    title={j.title}
                                                    onClick={() => handleUpdateElementSetting(selectedElement.id, 'justifyItems', j.key)}
                                                    className={`py-1.5 text-xs font-extrabold rounded transition ${
                                                        val('justifyItems', 'stretch') === j.key
                                                            ? 'bg-neutral-800 text-white shadow-sm'
                                                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                                                    }`}
                                                >
                                                    {j.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Align Items */}
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-neutral-600 flex items-center gap-1">Align Items <Monitor className="h-3 w-3 text-neutral-400" /></label>
                                        <div className="grid grid-cols-4 gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                            {[
                                                { key: 'start', icon: '⊤', title: 'Start' },
                                                { key: 'center', icon: '┼', title: 'Center' },
                                                { key: 'end', icon: '⊥', title: 'End' },
                                                { key: 'stretch', icon: '⧉', title: 'Stretch' },
                                            ].map(a => (
                                                <button
                                                    key={a.key}
                                                    type="button"
                                                    title={a.title}
                                                    onClick={() => handleUpdateElementSetting(selectedElement.id, 'alignItems', a.key)}
                                                    className={`py-1.5 text-xs font-extrabold rounded transition ${
                                                        val('alignItems', 'stretch') === a.key
                                                            ? 'bg-neutral-800 text-white shadow-sm'
                                                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                                                    }`}
                                                >
                                                    {a.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 6. FLEX CHILD ITEM OVERRIDES */}
                {!['section', 'flex_container', 'grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(selectedElement.type) && (
                    <div className="space-y-3 pt-3 border-t border-neutral-200">
                        <h4 className="font-bold text-neutral-900 flex items-center justify-between">
                            <span>Flex Child Sizing & Order</span>
                            <button
                                type="button"
                                onClick={() => handleResetElementCategory(selectedElement.id, 'flex_child')}
                                className="p-1 hover:bg-neutral-100 rounded transition text-neutral-400 hover:text-brand-600"
                                title={`Reset Flex Child Settings for ${viewport}`}
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                        </h4>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Flex Grow / Fill</label>
                                <select
                                    value={val('flexGrow', 0)}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'flexGrow', Number(e.target.value))}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium bg-white"
                                >
                                    <option value={0}>Fixed (Fit Content)</option>
                                    <option value={1}>Grow (Fill Available Space)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Align Self</label>
                                <select
                                    value={val('alignSelf', 'auto')}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'alignSelf', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium bg-white"
                                >
                                    <option value="auto">Auto (Inherit)</option>
                                    <option value="flex-start">Start (Top / Left)</option>
                                    <option value="center">Center</option>
                                    <option value="flex-end">End (Bottom / Right)</option>
                                    <option value="stretch">Stretch</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between font-semibold text-neutral-600">
                                <span>Display Order</span>
                                <span className="font-mono text-brand-600 font-bold">{val('order', 0)}</span>
                            </div>
                            <input
                                type="range"
                                min="-5"
                                max="10"
                                value={val('order', 0)}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'order', Number(e.target.value))}
                                className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                            />
                        </div>
                    </div>
                )}

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

                {/* 8. MOTION ON HOVER */}
                <div className="space-y-3 pt-3 border-t border-neutral-200">
                    <h4 className="font-bold text-neutral-900">Motion on Hover</h4>

                    {/* Transform: Move & Scale */}
                    <div className="space-y-2">
                        <label className="block font-semibold text-neutral-600">Transform</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-semibold text-neutral-500">Move X (px)</label>
                                <input
                                    type="number"
                                    value={val('hoverTransformX', 0)}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'hoverTransformX', Number(e.target.value))}
                                    className="w-full rounded border p-1 text-center font-bold text-xs bg-white"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-semibold text-neutral-500">Move Y (px)</label>
                                <input
                                    type="number"
                                    value={val('hoverTransformY', 0)}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'hoverTransformY', Number(e.target.value))}
                                    className="w-full rounded border p-1 text-center font-bold text-xs bg-white"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-semibold text-neutral-500">Scale</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={val('hoverScale', 1)}
                                    onChange={e => handleUpdateElementSetting(selectedElement.id, 'hoverScale', Number(e.target.value))}
                                    className="w-full rounded border p-1 text-center font-bold text-xs bg-white"
                                    placeholder="1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Transition Duration */}
                    <div className="space-y-1">
                        <div className="flex justify-between font-semibold text-neutral-600">
                            <span>Transition Duration</span>
                            <span className="font-mono text-purple-600 font-bold">{val('transitionDuration', 300)}ms</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0"
                                max="1200"
                                step="50"
                                value={val('transitionDuration', 300)}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'transitionDuration', Number(e.target.value))}
                                className="flex-1 accent-purple-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                            />
                            <input
                                type="number"
                                value={val('transitionDuration', 300)}
                                onChange={e => handleUpdateElementSetting(selectedElement.id, 'transitionDuration', Number(e.target.value))}
                                className="w-16 rounded border p-1 text-center font-bold text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* 9. (ADVANCED) HTML ATTRIBUTES */}
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
