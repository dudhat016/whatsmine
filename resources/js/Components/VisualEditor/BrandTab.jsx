import React, { useState } from 'react';
import { Palette, Type, Box, FormInput, LayoutTemplate, Sliders, Tablet, Smartphone, Trash2, Plus } from 'lucide-react';
import { Input, Select } from '@/Components/ui';
import ColorPickerInput from './ColorPicker';
import {
    TypographyControl,
    FourSideInput,
    ShadowControl,
    BorderControl,
    AccordionSection,
    TabSwitcher,
} from './StyleControls';

export default function BrandTab({ styleGuide = {}, handleStyleChange }) {
    const [linkTab,   setLinkTab]   = useState('Normal');
    const [buttonTab, setButtonTab] = useState('Normal');
    const [fieldTab,  setFieldTab]  = useState('Normal');
    const [scaleBase, setScaleBase] = useState(16);
    const [scaleRatio, setScaleRatio] = useState(1.25); // 1.25 = Major Third

    const handleApplyModularScale = () => {
        const base = Number(scaleBase) || 16;
        const r = Number(scaleRatio) || 1.25;

        const h6 = Math.round(base * Math.pow(r, 0.5));
        const h5 = Math.round(base * Math.pow(r, 1));
        const h4 = Math.round(base * Math.pow(r, 2));
        const h3 = Math.round(base * Math.pow(r, 3));
        const h2 = Math.round(base * Math.pow(r, 4));
        const h1 = Math.round(base * Math.pow(r, 5));

        handleStyleChange({
            bodyTypography: { ...(styleGuide.bodyTypography || {}), fontSize: base },
            h6Typography: { ...(styleGuide.h6Typography || {}), fontSize: h6 },
            h5Typography: { ...(styleGuide.h5Typography || {}), fontSize: h5 },
            h4Typography: { ...(styleGuide.h4Typography || {}), fontSize: h4 },
            h3Typography: { ...(styleGuide.h3Typography || {}), fontSize: h3 },
            h2Typography: { ...(styleGuide.h2Typography || {}), fontSize: h2 },
            h1Typography: { ...(styleGuide.h1Typography || {}), fontSize: h1 },
        });
    };

    const systemColors = styleGuide.systemColors || {
        primary:   '#6EC1E4',
        secondary: '#54595F',
        text:      '#7A7A7A',
        accent:    '#61CE70',
    };
    const customColors = styleGuide.customColors || [];

    const handleSystemColorChange = (key, value) => {
        handleStyleChange('systemColors', { ...systemColors, [key]: value });
    };

    return (
        <div className="p-3 space-y-3 text-xs overflow-y-auto max-h-full">

            {/* ── 1. SYSTEM COLORS ── */}
            <AccordionSection
                title="System Colors"
                icon={<Palette className="h-4 w-4 text-brand-600" />}
                defaultOpen={true}
            >
                {/* Default Colors */}
                <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Default Colors</span>
                    {[
                        { key: 'primary',   label: 'Primary',   def: '#6EC1E4' },
                        { key: 'secondary', label: 'Secondary', def: '#54595F' },
                        { key: 'text',      label: 'Text',      def: '#7A7A7A' },
                        { key: 'accent',    label: 'Accent',    def: '#61CE70' },
                    ].map(c => (
                        <div key={c.key} className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-700">{c.label}</span>
                            <ColorPickerInput
                                value={systemColors[c.key] || c.def}
                                onChange={val => handleSystemColorChange(c.key, val)}
                                styleGuide={styleGuide}
                            />
                        </div>
                    ))}
                </div>

                {/* Custom Colors */}
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Custom Colors</span>
                        <button
                            type="button"
                            onClick={() => {
                                handleStyleChange('customColors', [...customColors, {
                                    id: 'custom_' + Date.now(),
                                    name: `Custom ${customColors.length + 1}`,
                                    value: '#3B82F6',
                                }]);
                            }}
                            className="text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-md transition flex items-center gap-1"
                        >
                            <Plus className="h-3 w-3" /> Add Color
                        </button>
                    </div>

                    {customColors.length === 0 ? (
                        <p className="text-[11px] text-neutral-400 italic">No custom colors added yet.</p>
                    ) : customColors.map((c, idx) => (
                        <div key={c.id || idx} className="flex items-center gap-2 p-1.5 bg-neutral-50 rounded-lg border border-neutral-200">
                            <Input
                                size="sm"
                                type="text"
                                value={c.name}
                                onChange={e => {
                                    const updated = [...customColors];
                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                    handleStyleChange('customColors', updated);
                                }}
                                placeholder="Color Name"
                                wrapperClassName="flex-1"
                            />
                            <ColorPickerInput
                                value={c.value}
                                onChange={val => {
                                    const updated = [...customColors];
                                    updated[idx] = { ...updated[idx], value: val };
                                    handleStyleChange('customColors', updated);
                                }}
                                styleGuide={styleGuide}
                            />
                            <button
                                type="button"
                                onClick={() => handleStyleChange('customColors', customColors.filter((_, i) => i !== idx))}
                                className="p-1 text-neutral-400 hover:text-red-600 rounded transition"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </AccordionSection>

            {/* ── 2. TYPOGRAPHY ── */}
            <AccordionSection
                title="Typography"
                icon={<Type className="h-4 w-4 text-brand-600" />}
                defaultOpen={true}
            >
                {/* 1-Click Modular Scale Generator */}
                <div className="p-2.5 rounded-xl bg-neutral-900 text-white space-y-2 mb-3 shadow-md">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1">
                            <Sliders className="h-3 w-3 text-brand-400" /> Modular Scale Calculator
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono">Auto H1-H6</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <div>
                            <span className="text-[9px] text-neutral-400 block mb-0.5">Base (px)</span>
                            <Input
                                size="sm"
                                type="number"
                                value={scaleBase}
                                onChange={e => setScaleBase(e.target.value)}
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                        <div>
                            <span className="text-[9px] text-neutral-400 block mb-0.5">Ratio Scale</span>
                            <Select
                                size="sm"
                                value={scaleRatio}
                                onChange={e => setScaleRatio(parseFloat(e.target.value))}
                                className="bg-neutral-800 border-neutral-700 text-white text-[11px]"
                            >
                                <option value={1.125}>1.125 Major Second</option>
                                <option value={1.200}>1.200 Minor Third</option>
                                <option value={1.250}>1.250 Major Third</option>
                                <option value={1.333}>1.333 Perfect Fourth</option>
                                <option value={1.414}>1.414 Aug Fourth</option>
                                <option value={1.500}>1.500 Perfect Fifth</option>
                                <option value={1.618}>1.618 Golden Ratio</option>
                            </Select>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleApplyModularScale}
                        className="w-full py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                    >
                        Calculate & Apply to All Headings
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-2.5">
                    <span className="font-bold text-neutral-800 text-xs block border-b pb-1">Body</span>
                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-600">Text Color</label>
                        <ColorPickerInput
                            value={styleGuide.textColor || '#1f2937'}
                            onChange={val => handleStyleChange('textColor', val)}
                            styleGuide={styleGuide}
                        />
                    </div>
                    <TypographyControl
                        label="Typography"
                        value={styleGuide.bodyTypography || {}}
                        onChange={val => handleStyleChange('bodyTypography', val)}
                    />
                    <FourSideInput
                        label="Margin"
                        top={styleGuide.bodyMarginTop ?? 0}
                        right={styleGuide.bodyMarginRight ?? 0}
                        bottom={styleGuide.bodyMarginBottom ?? styleGuide.paragraphMarginBottom ?? 16}
                        left={styleGuide.bodyMarginLeft ?? 0}
                        unit={styleGuide.bodyMarginUnit || 'px'}
                        onUnitChange={u => handleStyleChange('bodyMarginUnit', u)}
                        onChange={s => {
                            handleStyleChange({
                                bodyMarginTop:    s.top,
                                bodyMarginRight:  s.right,
                                bodyMarginBottom: s.bottom,
                                bodyMarginLeft:   s.left,
                            });
                        }}
                    />
                    <FourSideInput
                        label="Padding"
                        top={styleGuide.bodyPaddingTop ?? 0}
                        right={styleGuide.bodyPaddingRight ?? 0}
                        bottom={styleGuide.bodyPaddingBottom ?? 0}
                        left={styleGuide.bodyPaddingLeft ?? 0}
                        unit={styleGuide.bodyPaddingUnit || 'px'}
                        onUnitChange={u => handleStyleChange('bodyPaddingUnit', u)}
                        onChange={s => {
                            handleStyleChange({
                                bodyPaddingTop:    s.top,
                                bodyPaddingRight:  s.right,
                                bodyPaddingBottom: s.bottom,
                                bodyPaddingLeft:   s.left,
                            });
                        }}
                    />
                </div>

                {/* Link */}
                <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                    <span className="font-bold text-neutral-800 text-xs block border-b pb-1">Link</span>
                    <TabSwitcher tabs={['Normal', 'Hover']} active={linkTab} onChange={setLinkTab} />
                    {linkTab === 'Normal' ? (
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Color</label>
                                <ColorPickerInput
                                    value={styleGuide.linkColor || '#c87a57'}
                                    onChange={val => handleStyleChange('linkColor', val)}
                                    styleGuide={styleGuide}
                                />
                            </div>
                            <TypographyControl
                                label="Typography"
                                value={styleGuide.linkTypography || {}}
                                onChange={val => handleStyleChange('linkTypography', val)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Hover Color</label>
                                <ColorPickerInput
                                    value={styleGuide.linkHoverColor || '#a05c3c'}
                                    onChange={val => handleStyleChange('linkHoverColor', val)}
                                    styleGuide={styleGuide}
                                />
                            </div>
                            <TypographyControl
                                label="Hover Typography"
                                value={styleGuide.linkHoverTypography || {}}
                                onChange={val => handleStyleChange('linkHoverTypography', val)}
                            />
                        </div>
                    )}
                </div>

                {/* Headings H1 - H6 */}
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                    <span className="font-bold text-neutral-800 text-xs block border-b pb-1">Headings</span>
                    {['H1','H2','H3','H4','H5','H6'].map(h => {
                        const defaultMb = h === 'H1' || h === 'H2' || h === 'H3' ? 12 : (h === 'H4' ? 10 : 8);
                        const hKey = h.toLowerCase();
                        return (
                            <div key={h} className="space-y-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                                <span className="font-bold text-neutral-900 text-xs">{h}</span>
                                <div className="space-y-1">
                                    <label className="block text-[11px] font-semibold text-neutral-600">Color</label>
                                    <ColorPickerInput
                                        value={styleGuide[`${hKey}Color`] || styleGuide.headingColor || '#111827'}
                                        onChange={val => handleStyleChange(`${hKey}Color`, val)}
                                        styleGuide={styleGuide}
                                    />
                                </div>
                                <TypographyControl
                                    label="Typography"
                                    value={styleGuide[`${hKey}Typography`] || {}}
                                    onChange={val => handleStyleChange(`${hKey}Typography`, val)}
                                />
                                <FourSideInput
                                    label="Margin"
                                    top={styleGuide[`${hKey}MarginTop`] ?? 0}
                                    right={styleGuide[`${hKey}MarginRight`] ?? 0}
                                    bottom={styleGuide[`${hKey}MarginBottom`] ?? styleGuide.headingMarginBottom ?? defaultMb}
                                    left={styleGuide[`${hKey}MarginLeft`] ?? 0}
                                    unit={styleGuide[`${hKey}MarginUnit`] || 'px'}
                                    onUnitChange={u => handleStyleChange(`${hKey}MarginUnit`, u)}
                                    onChange={s => {
                                        handleStyleChange({
                                            [`${hKey}MarginTop`]:    s.top,
                                            [`${hKey}MarginRight`]:  s.right,
                                            [`${hKey}MarginBottom`]: s.bottom,
                                            [`${hKey}MarginLeft`]:   s.left,
                                        });
                                    }}
                                />
                                <FourSideInput
                                    label="Padding"
                                    top={styleGuide[`${hKey}PaddingTop`] ?? 0}
                                    right={styleGuide[`${hKey}PaddingRight`] ?? 0}
                                    bottom={styleGuide[`${hKey}PaddingBottom`] ?? 0}
                                    left={styleGuide[`${hKey}PaddingLeft`] ?? 0}
                                    unit={styleGuide[`${hKey}PaddingUnit`] || 'px'}
                                    onUnitChange={u => handleStyleChange(`${hKey}PaddingUnit`, u)}
                                    onChange={s => {
                                        handleStyleChange({
                                            [`${hKey}PaddingTop`]:    s.top,
                                            [`${hKey}PaddingRight`]:  s.right,
                                            [`${hKey}PaddingBottom`]: s.bottom,
                                            [`${hKey}PaddingLeft`]:   s.left,
                                        });
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </AccordionSection>

            {/* ── 3. BUTTONS ── */}
            <AccordionSection
                title="Buttons"
                icon={<Box className="h-4 w-4 text-brand-600" />}
                defaultOpen={false}
            >
                <TypographyControl
                    label="Typography"
                    value={styleGuide.btnTypography || {}}
                    onChange={val => handleStyleChange('btnTypography', val)}
                />

                <ShadowControl
                    label="Text Shadow"
                    value={styleGuide.btnTextShadow || {}}
                    onChange={val => handleStyleChange('btnTextShadow', val)}
                    styleGuide={styleGuide}
                />

                <TabSwitcher tabs={['Normal', 'Hover']} active={buttonTab} onChange={setButtonTab} />

                {buttonTab === 'Normal' ? (
                    <>
                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Text Color</label>
                            <ColorPickerInput
                                value={styleGuide.btnTextColor || '#ffffff'}
                                onChange={val => handleStyleChange('btnTextColor', val)}
                                styleGuide={styleGuide}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Background Color</label>
                            <ColorPickerInput
                                value={styleGuide.btnBgColor || styleGuide.systemColors?.primary || '#6EC1E4'}
                                onChange={val => handleStyleChange('btnBgColor', val)}
                                styleGuide={styleGuide}
                            />
                        </div>
                        <ShadowControl
                            label="Box Shadow"
                            value={styleGuide.btnBoxShadow || {}}
                            onChange={val => handleStyleChange('btnBoxShadow', val)}
                            styleGuide={styleGuide}
                        />
                        <BorderControl
                            label="Border"
                            value={styleGuide.btnBorder || {}}
                            onChange={val => handleStyleChange('btnBorder', val)}
                            styleGuide={styleGuide}
                        />
                    </>
                ) : (
                    <>
                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Hover Text Color</label>
                            <ColorPickerInput
                                value={styleGuide.btnHoverTextColor || '#ffffff'}
                                onChange={val => handleStyleChange('btnHoverTextColor', val)}
                                styleGuide={styleGuide}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block font-semibold text-neutral-600">Hover Background Color</label>
                            <ColorPickerInput
                                value={styleGuide.btnHoverBgColor || styleGuide.systemColors?.primary || '#6EC1E4'}
                                onChange={val => handleStyleChange('btnHoverBgColor', val)}
                                styleGuide={styleGuide}
                            />
                        </div>
                        <ShadowControl
                            label="Hover Box Shadow"
                            value={styleGuide.btnHoverBoxShadow || {}}
                            onChange={val => handleStyleChange('btnHoverBoxShadow', val)}
                            styleGuide={styleGuide}
                        />
                        <BorderControl
                            label="Hover Border"
                            value={styleGuide.btnHoverBorder || {}}
                            onChange={val => handleStyleChange('btnHoverBorder', val)}
                            styleGuide={styleGuide}
                        />
                    </>
                )}

                <FourSideInput
                    label="Border Radius"
                    top={styleGuide.btnRadiusTop ?? 12}
                    right={styleGuide.btnRadiusRight ?? 12}
                    bottom={styleGuide.btnRadiusBottom ?? 12}
                    left={styleGuide.btnRadiusLeft ?? 12}
                    unit={styleGuide.btnRadiusUnit || 'px'}
                    onUnitChange={u => handleStyleChange('btnRadiusUnit', u)}
                    onChange={s => {
                        handleStyleChange({
                            btnRadiusTop:    s.top,
                            btnRadiusRight:  s.right,
                            btnRadiusBottom: s.bottom,
                            btnRadiusLeft:   s.left,
                            btnRadius:       s.top,
                        });
                    }}
                />

                <FourSideInput
                    label="Padding"
                    top={styleGuide.btnPaddingTop ?? 14}
                    right={styleGuide.btnPaddingRight ?? 28}
                    bottom={styleGuide.btnPaddingBottom ?? 14}
                    left={styleGuide.btnPaddingLeft ?? 28}
                    unit={styleGuide.btnPaddingUnit || 'px'}
                    onUnitChange={u => handleStyleChange('btnPaddingUnit', u)}
                    onChange={s => {
                        handleStyleChange({
                            btnPaddingTop:    s.top,
                            btnPaddingRight:  s.right,
                            btnPaddingBottom: s.bottom,
                            btnPaddingLeft:   s.left,
                        });
                    }}
                />

                <FourSideInput
                    label="Margin"
                    top={styleGuide.btnMarginTop ?? 0}
                    right={styleGuide.btnMarginRight ?? 0}
                    bottom={styleGuide.btnMarginBottom ?? styleGuide.buttonMarginBottom ?? 16}
                    left={styleGuide.btnMarginLeft ?? 0}
                    unit={styleGuide.btnMarginUnit || 'px'}
                    onUnitChange={u => handleStyleChange('btnMarginUnit', u)}
                    onChange={s => {
                        handleStyleChange({
                            btnMarginTop:    s.top,
                            btnMarginRight:  s.right,
                            btnMarginBottom: s.bottom,
                            btnMarginLeft:   s.left,
                        });
                    }}
                />
            </AccordionSection>

            {/* ── 4. FORM FIELDS ── */}
            <AccordionSection
                title="Form Fields"
                icon={<FormInput className="h-4 w-4 text-brand-600" />}
                defaultOpen={false}
            >
                {/* Label */}
                <div className="space-y-2.5">
                    <span className="font-bold text-neutral-800 text-xs block border-b pb-1">Label</span>
                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-600">Color</label>
                        <ColorPickerInput
                            value={styleGuide.labelColor || '#374151'}
                            onChange={val => handleStyleChange('labelColor', val)}
                            styleGuide={styleGuide}
                        />
                    </div>
                    <TypographyControl
                        label="Typography"
                        value={styleGuide.labelTypography || {}}
                        onChange={val => handleStyleChange('labelTypography', val)}
                    />
                </div>

                {/* Field */}
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                    <span className="font-bold text-neutral-800 text-xs block border-b pb-1">Field</span>

                    <TypographyControl
                        label="Typography"
                        value={styleGuide.fieldTypography || {}}
                        onChange={val => handleStyleChange('fieldTypography', val)}
                    />

                    <TabSwitcher tabs={['Normal', 'Focus']} active={fieldTab} onChange={setFieldTab} />

                    {fieldTab === 'Normal' ? (
                        <>
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Text Color</label>
                                <ColorPickerInput
                                    value={styleGuide.fieldTextColor || '#111827'}
                                    onChange={val => handleStyleChange('fieldTextColor', val)}
                                    styleGuide={styleGuide}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Accent Color</label>
                                <ColorPickerInput
                                    value={styleGuide.fieldAccentColor || '#6EC1E4'}
                                    onChange={val => handleStyleChange('fieldAccentColor', val)}
                                    styleGuide={styleGuide}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Background Color</label>
                                <ColorPickerInput
                                    value={styleGuide.fieldBgColor || '#ffffff'}
                                    onChange={val => handleStyleChange('fieldBgColor', val)}
                                    styleGuide={styleGuide}
                                />
                            </div>
                            <ShadowControl
                                label="Box Shadow"
                                value={styleGuide.fieldBoxShadow || {}}
                                onChange={val => handleStyleChange('fieldBoxShadow', val)}
                                styleGuide={styleGuide}
                            />
                            <BorderControl
                                label="Border"
                                value={styleGuide.fieldBorder || {}}
                                onChange={val => handleStyleChange('fieldBorder', val)}
                                styleGuide={styleGuide}
                            />
                        </>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Focus Text Color</label>
                                <ColorPickerInput
                                    value={styleGuide.fieldFocusTextColor || '#111827'}
                                    onChange={val => handleStyleChange('fieldFocusTextColor', val)}
                                    styleGuide={styleGuide}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Focus Accent Color</label>
                                <ColorPickerInput
                                    value={styleGuide.fieldFocusAccentColor || '#6EC1E4'}
                                    onChange={val => handleStyleChange('fieldFocusAccentColor', val)}
                                    styleGuide={styleGuide}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block font-semibold text-neutral-600">Focus Background Color</label>
                                <ColorPickerInput
                                    value={styleGuide.fieldFocusBgColor || '#ffffff'}
                                    onChange={val => handleStyleChange('fieldFocusBgColor', val)}
                                    styleGuide={styleGuide}
                                />
                            </div>
                            <ShadowControl
                                label="Focus Box Shadow"
                                value={styleGuide.fieldFocusBoxShadow || {}}
                                onChange={val => handleStyleChange('fieldFocusBoxShadow', val)}
                                styleGuide={styleGuide}
                            />
                            <BorderControl
                                label="Focus Border"
                                value={styleGuide.fieldFocusBorder || {}}
                                onChange={val => handleStyleChange('fieldFocusBorder', val)}
                                styleGuide={styleGuide}
                            />
                        </>
                    )}

                    <FourSideInput
                        label="Border Radius"
                        top={styleGuide.fieldRadiusTop ?? 8}
                        right={styleGuide.fieldRadiusRight ?? 8}
                        bottom={styleGuide.fieldRadiusBottom ?? 8}
                        left={styleGuide.fieldRadiusLeft ?? 8}
                        unit={styleGuide.fieldRadiusUnit || 'px'}
                        onUnitChange={u => handleStyleChange('fieldRadiusUnit', u)}
                        onChange={s => {
                            handleStyleChange({
                                fieldRadiusTop:    s.top,
                                fieldRadiusRight:  s.right,
                                fieldRadiusBottom: s.bottom,
                                fieldRadiusLeft:   s.left,
                                fieldRadius:       s.top,
                            });
                        }}
                    />

                    <FourSideInput
                        label="Padding"
                        top={styleGuide.fieldPaddingTop ?? 12}
                        right={styleGuide.fieldPaddingRight ?? 16}
                        bottom={styleGuide.fieldPaddingBottom ?? 12}
                        left={styleGuide.fieldPaddingLeft ?? 16}
                        unit={styleGuide.fieldPaddingUnit || 'px'}
                        onUnitChange={u => handleStyleChange('fieldPaddingUnit', u)}
                        onChange={s => {
                            handleStyleChange({
                                fieldPaddingTop:    s.top,
                                fieldPaddingRight:  s.right,
                                fieldPaddingBottom: s.bottom,
                                fieldPaddingLeft:   s.left,
                            });
                        }}
                    />

                    <FourSideInput
                        label="Margin"
                        top={styleGuide.fieldMarginTop ?? 0}
                        right={styleGuide.fieldMarginRight ?? 0}
                        bottom={styleGuide.fieldMarginBottom ?? styleGuide.fieldMarginBottom ?? 12}
                        left={styleGuide.fieldMarginLeft ?? 0}
                        unit={styleGuide.fieldMarginUnit || 'px'}
                        onUnitChange={u => handleStyleChange('fieldMarginUnit', u)}
                        onChange={s => {
                            handleStyleChange({
                                fieldMarginTop:    s.top,
                                fieldMarginRight:  s.right,
                                fieldMarginBottom: s.bottom,
                                fieldMarginLeft:   s.left,
                            });
                        }}
                    />
                </div>
            </AccordionSection>

            {/* ── 5. LAYOUT & RESPONSIVE BREAKPOINTS ── */}
            <AccordionSection
                title="Layout & Breakpoints"
                icon={<LayoutTemplate className="h-4 w-4 text-brand-600" />}
                defaultOpen={false}
            >
                <div className="space-y-3">
                    {/* Quick Container Width Presets */}
                    <div className="space-y-1.5 pb-2 border-b border-neutral-100">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Container Width Presets</span>
                        <div className="grid grid-cols-4 gap-1.5">
                            {[
                                { label: 'Compact', val: 800 },
                                { label: 'Standard', val: 1140 },
                                { label: 'Wide', val: 1280 },
                                { label: 'Ultra', val: 1440 },
                            ].map(p => (
                                <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => handleStyleChange({ containerWidth: p.val, containerWidthUnit: 'px' })}
                                    className={`py-1 px-1 rounded-md text-[10px] font-bold border transition text-center ${
                                        styleGuide.containerWidth === p.val && (styleGuide.containerWidthUnit === 'px' || !styleGuide.containerWidthUnit)
                                            ? 'bg-brand-50 border-brand-500 text-brand-700 font-black'
                                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                    }`}
                                >
                                    {p.label}
                                    <span className="block text-[8px] font-normal text-neutral-400 font-mono">{p.val}px</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Container Width + Unit */}
                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-700">Default Container Width</label>
                        <div className="flex items-center gap-2">
                            <Input
                                size="sm"
                                type="number"
                                value={styleGuide.containerWidth ?? 1200}
                                onChange={e => handleStyleChange('containerWidth', parseInt(e.target.value) || 1200)}
                                placeholder="1200"
                                wrapperClassName="flex-1"
                            />
                            <div className="w-20">
                                <Select
                                    size="sm"
                                    value={styleGuide.containerWidthUnit || 'px'}
                                    onChange={e => handleStyleChange('containerWidthUnit', e.target.value)}
                                >
                                    <option value="px">px</option>
                                    <option value="%">%</option>
                                    <option value="rem">rem</option>
                                    <option value="vw">vw</option>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Container Margin */}
                    <FourSideInput
                        label="Default Container Margin"
                        top={styleGuide.containerMarginTop ?? 0}
                        right={styleGuide.containerMarginRight ?? 0}
                        bottom={styleGuide.containerMarginBottom ?? styleGuide.sectionMarginBottom ?? 24}
                        left={styleGuide.containerMarginLeft ?? 0}
                        unit={styleGuide.containerMarginUnit || 'px'}
                        onUnitChange={u => handleStyleChange('containerMarginUnit', u)}
                        onChange={s => {
                            handleStyleChange({
                                containerMarginTop:    s.top,
                                containerMarginRight:  s.right,
                                containerMarginBottom: s.bottom,
                                containerMarginLeft:   s.left,
                            });
                        }}
                    />

                    {/* Container Padding */}
                    <FourSideInput
                        label="Default Container Padding"
                        top={styleGuide.containerPaddingTop ?? 48}
                        right={styleGuide.containerPaddingRight ?? 24}
                        bottom={styleGuide.containerPaddingBottom ?? 48}
                        left={styleGuide.containerPaddingLeft ?? 24}
                        unit={styleGuide.containerPaddingUnit || 'px'}
                        onUnitChange={u => handleStyleChange('containerPaddingUnit', u)}
                        onChange={s => {
                            handleStyleChange({
                                containerPaddingTop:    s.top,
                                containerPaddingRight:  s.right,
                                containerPaddingBottom: s.bottom,
                                containerPaddingLeft:   s.left,
                            });
                        }}
                    />

                    {/* Horizontal & Vertical Gaps with Units */}
                    <div className="space-y-2 pt-1">
                        <label className="block font-semibold text-neutral-700">Default Element & Grid Gaps</label>
                        
                        {/* Horizontal Gap (X) */}
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                            <span className="font-semibold text-neutral-600 text-xs">Horizontal Gap (X)</span>
                            <div className="flex items-center gap-1.5 w-36">
                                <Input
                                    size="sm"
                                    type="number"
                                    value={styleGuide.elementGapX ?? styleGuide.elementGap ?? 24}
                                    onChange={e => {
                                        const v = parseInt(e.target.value) || 0;
                                        handleStyleChange('elementGapX', v);
                                        handleStyleChange('elementGap', v);
                                    }}
                                    className="text-right font-medium"
                                    wrapperClassName="w-full"
                                />
                                <div className="w-18">
                                    <Select
                                        size="sm"
                                        value={styleGuide.elementGapXUnit || 'px'}
                                        onChange={e => handleStyleChange('elementGapXUnit', e.target.value)}
                                    >
                                        <option value="px">px</option>
                                        <option value="rem">rem</option>
                                        <option value="em">em</option>
                                        <option value="vw">vw</option>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Vertical Gap (Y) */}
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                            <span className="font-semibold text-neutral-600 text-xs">Vertical Gap (Y)</span>
                            <div className="flex items-center gap-1.5 w-36">
                                <Input
                                    size="sm"
                                    type="number"
                                    value={styleGuide.elementGapY ?? styleGuide.elementGap ?? 24}
                                    onChange={e => handleStyleChange('elementGapY', parseInt(e.target.value) || 0)}
                                    className="text-right font-medium"
                                    wrapperClassName="w-full"
                                />
                                <div className="w-18">
                                    <Select
                                        size="sm"
                                        value={styleGuide.elementGapYUnit || 'px'}
                                        onChange={e => handleStyleChange('elementGapYUnit', e.target.value)}
                                    >
                                        <option value="px">px</option>
                                        <option value="rem">rem</option>
                                        <option value="em">em</option>
                                        <option value="vh">vh</option>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Responsive Breakpoints */}
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Dynamic Breakpoints</span>
                            <button
                                type="button"
                                onClick={() => {
                                    const list = [...(styleGuide.customBreakpoints || [])];
                                    const newBp = {
                                        id: 'bp_' + Date.now(),
                                        name: `Custom Breakpoint #${list.length + 1}`,
                                        width: 1280
                                    };
                                    handleStyleChange('customBreakpoints', [...list, newBp]);
                                }}
                                className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded transition"
                            >
                                <Plus className="h-3 w-3" /> Add Breakpoint
                            </button>
                        </div>
                        
                        {/* Built-in Tablet Breakpoint */}
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                            <div className="flex items-center gap-1.5">
                                <Tablet className="h-3.5 w-3.5 text-brand-600" />
                                <span className="font-semibold text-neutral-700 text-xs">Tablet Breakpoint</span>
                            </div>
                            <div className="flex items-center gap-1 w-24">
                                <Input
                                    size="sm"
                                    type="number"
                                    value={styleGuide.tabletBreakpoint ?? 1024}
                                    onChange={e => handleStyleChange('tabletBreakpoint', parseInt(e.target.value) || 1024)}
                                    className="text-right font-medium"
                                    wrapperClassName="w-full"
                                />
                                <span className="text-[10px] text-neutral-400 font-bold">px</span>
                            </div>
                        </div>

                        {/* Built-in Mobile Breakpoint */}
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                            <div className="flex items-center gap-1.5">
                                <Smartphone className="h-3.5 w-3.5 text-brand-600" />
                                <span className="font-semibold text-neutral-700 text-xs">Mobile Breakpoint</span>
                            </div>
                            <div className="flex items-center gap-1 w-24">
                                <Input
                                    size="sm"
                                    type="number"
                                    value={styleGuide.mobileBreakpoint ?? 768}
                                    onChange={e => handleStyleChange('mobileBreakpoint', parseInt(e.target.value) || 768)}
                                    className="text-right font-medium"
                                    wrapperClassName="w-full"
                                />
                                <span className="text-[10px] text-neutral-400 font-bold">px</span>
                            </div>
                        </div>

                        {/* User-defined Custom Breakpoints */}
                        {(styleGuide.customBreakpoints || []).map((bp, idx) => (
                            <div key={bp.id || idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-brand-50/50 border border-brand-200/60">
                                <Input
                                    size="sm"
                                    type="text"
                                    value={bp.name || ''}
                                    onChange={e => {
                                        const list = [...(styleGuide.customBreakpoints || [])];
                                        list[idx] = { ...list[idx], name: e.target.value };
                                        handleStyleChange('customBreakpoints', list);
                                    }}
                                    placeholder="Breakpoint Name"
                                    wrapperClassName="w-full"
                                />
                                <div className="flex items-center gap-1 w-28 shrink-0">
                                    <Input
                                        size="sm"
                                        type="number"
                                        value={bp.width || 1280}
                                        onChange={e => {
                                            const list = [...(styleGuide.customBreakpoints || [])];
                                            list[idx] = { ...list[idx], width: parseInt(e.target.value) || 1280 };
                                            handleStyleChange('customBreakpoints', list);
                                        }}
                                        className="text-right font-medium"
                                        wrapperClassName="w-full"
                                    />
                                    <span className="text-[10px] text-neutral-400 font-bold">px</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const list = (styleGuide.customBreakpoints || []).filter((_, i) => i !== idx);
                                            handleStyleChange('customBreakpoints', list);
                                        }}
                                        className="text-neutral-400 hover:text-red-600 p-0.5 rounded transition"
                                        title="Delete custom breakpoint"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </AccordionSection>
        </div>
    );
}
