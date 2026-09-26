import React, { useState } from 'react';
import {
    RotateCcw,
    Layers,
    Type,
    Smile,
    HelpCircle,
    MessageSquare,
    Star,
    Clock,
    Tag,
    Sparkles,
    ShoppingBag,
    CheckSquare,
    DollarSign,
    Sliders
} from 'lucide-react';
import { PanelSelect, FieldLabel } from '../BuilderUI';
import ColorPickerInput from '../ColorPicker';
import {
    TabSwitcher,
    AccordionSection,
    ShadowControl,
    BorderControl,
    SpacingControl,
    TypographyControl,
    BackgroundControl,
    CornerRadiusControl,
    HoverAnimationSelect,
    TransitionControl
} from '../StyleControls';

const TYPOGRAPHY_TYPES = ['headline', 'subheadline', 'paragraph', 'quote', 'submit_button'];
const TEXT_COLOR_TYPES = [
    'headline', 'subheadline', 'paragraph', 'quote', 'submit_button',
    'bullets', 'rich_text', 'icon_box', 'star_rating', 'custom_code',
    'order_bump', 'faq_accordion', 'testimonial_slider', 'timer', 'progress_bar'
];

const COMPOUND_TYPES = [
    'submit_button', 'faq_accordion', 'testimonial_slider', 'icon_box',
    'timer', 'order_bump', 'bullets', 'two_step_order', 'upsell_box',
    'pricing_table', 'progress_bar', 'input_email', 'input_name',
    'input_phone', 'datepicker', 'signature'
];

export default function StylePanel({
    element,
    val,
    viewport = 'desktop',
    styleGuide,
    handleUpdateElementSetting,
    handleResetElementCategory,
    isKeyOverridden = () => false,
    isLocallySet,
}) {
    const [mainStyleTab, setMainStyleTab] = useState('Normal');
    const [subtextStyleTab, setSubtextStyleTab] = useState('Normal');
    const [iconStyleTab, setIconStyleTab] = useState('Normal');
    const [faqQStyleTab, setFaqQStyleTab] = useState('Normal');
    const [faqCardStyleTab, setFaqCardStyleTab] = useState('Normal');
    const [testCardStyleTab, setTestCardStyleTab] = useState('Normal');
    const [timerDigitStyleTab, setTimerDigitStyleTab] = useState('Normal');
    const [bulletTextStyleTab, setBulletTextStyleTab] = useState('Normal');
    const [bulletIconStyleTab, setBulletIconStyleTab] = useState('Normal');

    const checkLocallySet = isLocallySet || ((k) => {
        if (!element) return false;
        if (viewport !== 'desktop' && element[viewport]?.[k] !== undefined) return true;
        return element[k] !== undefined;
    });

    const update      = (key, value) => handleUpdateElementSetting(element.id, key, value);
    const updateBatch = (patch)      => handleUpdateElementSetting(element.id, patch);

    return (
        <div className="space-y-3.5 pt-1">
            {/* 1. VERTICAL ACCORDION STRUCTURE FOR COMPOUND ELEMENTS */}

            {/* --- CASE A: SUBMIT BUTTON ACCORDIONS --- */}
            {element.type === 'submit_button' && (
                <div className="space-y-2.5">
                    {/* Accordion 1: Main Button */}
                    <AccordionSection title="Main Button" icon={<Layers className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex-1">
                                    <TabSwitcher tabs={['Normal', 'Hover ✨']} active={mainStyleTab === 'Hover' ? 'Hover ✨' : mainStyleTab} onChange={t => setMainStyleTab(t.startsWith('Hover') ? 'Hover' : 'Normal')} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleResetElementCategory(element.id, 'color');
                                        handleResetElementCategory(element.id, 'border');
                                    }}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition border border-transparent hover:border-neutral-200"
                                    title="Reset Button Styles"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {mainStyleTab === 'Normal' ? (
                                <>
                                    <TypographyControl
                                        label="Typography"
                                        prefix=""
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultSize={val('btnFontSize', 16)}
                                        defaultWeight="700"
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />

                                    <div className="space-y-0.5">
                                        <FieldLabel>Sizing Preset</FieldLabel>
                                        <PanelSelect value={val('btnSize', 'md')} onChange={e => update('btnSize', e.target.value)}>
                                            <option value="sm">Small (Compact)</option>
                                            <option value="md">Medium (Standard)</option>
                                            <option value="lg">Large (CTA / Highlight)</option>
                                            <option value="xl">Full / XL Hero CTA</option>
                                        </PanelSelect>
                                    </div>

                                    <div className="space-y-0.5">
                                        <FieldLabel>Text Color</FieldLabel>
                                        <ColorPickerInput value={val('textColor', '#ffffff')} onChange={v => update('textColor', v)} styleGuide={styleGuide} />
                                    </div>

                                    <BackgroundControl
                                        label="Background"
                                        prefix=""
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor={styleGuide?.systemColors?.primary || '#6EC1E4'}
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />

                                    {/* Border */}
                                    <BorderControl
                                        label="Border"
                                        prefix=""
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />

                                    {/* Corner Radius */}
                                    <CornerRadiusControl
                                        label="Corner Radius"
                                        prefix=""
                                        val={val}
                                        updateBatch={updateBatch}
                                        defaultRadius={8}
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />

                                    {/* Box Shadow */}
                                    <ShadowControl
                                        label="Box Shadow"
                                        prefix=""
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />

                                    {/* Spacing (Padding & Margin) */}
                                    <SpacingControl
                                        label="Padding (Inner Spacing)"
                                        type="padding"
                                        prefix=""
                                        val={val}
                                        updateBatch={updateBatch}
                                        defaultVal={14}
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />

                                    <SpacingControl
                                        label="Margin (Outer Spacing)"
                                        type="margin"
                                        prefix=""
                                        val={val}
                                        updateBatch={updateBatch}
                                        defaultVal={0}
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />
                                </>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-0.5">
                                        <FieldLabel>Hover Text Color</FieldLabel>
                                        <ColorPickerInput value={val('hoverTextColor', '#ffffff')} onChange={v => update('hoverTextColor', v)} styleGuide={styleGuide} />
                                    </div>

                                    <BackgroundControl
                                        label="Hover Background"
                                        prefix="hover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor={styleGuide?.btnHoverBgColor || '#4ba3c7'}
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />

                                    <ShadowControl
                                        label="Hover Box Shadow"
                                        prefix="hover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="rgba(0,0,0,0.2)"
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />

                                    <BorderControl
                                        label="Hover Border"
                                        prefix="hover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="#9ca3af"
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />

                                    <CornerRadiusControl
                                        label="Hover Corner Radius"
                                        prefix="hover"
                                        val={val}
                                        updateBatch={updateBatch}
                                        element={element}
                                        isLocallySet={checkLocallySet}
                                    />

                                    <HoverAnimationSelect
                                        value={val('hoverAnimation', 'lift')}
                                        onChange={v => update('hoverAnimation', v)}
                                    />

                                    <TransitionControl
                                        duration={val('transitionDuration', 200)}
                                        timing={val('transitionTiming', 'ease')}
                                        onDurationChange={d => update('transitionDuration', d)}
                                        onTimingChange={t => update('transitionTiming', t)}
                                    />
                                </div>
                            )}
                        </div>
                    </AccordionSection>

                    {/* Accordion 2: Subtext */}
                    <AccordionSection title="Subtext" icon={<Type className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex-1">
                                    <TabSwitcher tabs={['Normal', 'Hover ✨']} active={subtextStyleTab === 'Hover' ? 'Hover ✨' : subtextStyleTab} onChange={t => setSubtextStyleTab(t.startsWith('Hover') ? 'Hover' : 'Normal')} />
                                </div>
                            </div>

                            {subtextStyleTab === 'Normal' ? (
                                <>
                                    <TypographyControl
                                        label="Typography"
                                        prefix="subtext"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultSize={11}
                                        defaultWeight="400"
                                    />

                                    <div className="space-y-0.5">
                                        <FieldLabel>Text Color</FieldLabel>
                                        <ColorPickerInput
                                            value={val('subtextColor', 'rgba(255,255,255,0.85)')}
                                            onChange={v => update('subtextColor', v)}
                                            styleGuide={styleGuide}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <FieldLabel>Opacity</FieldLabel>
                                            <input
                                                type="number"
                                                min="0.1"
                                                max="1.0"
                                                step="0.05"
                                                value={val('subtextOpacity', 0.9)}
                                                onChange={e => update('subtextOpacity', parseFloat(e.target.value) || 0.9)}
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <FieldLabel>Top Spacing (px)</FieldLabel>
                                            <input
                                                type="number"
                                                value={val('subtextGap', 3)}
                                                onChange={e => update('subtextGap', Number(e.target.value))}
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    <BackgroundControl
                                        label="Background"
                                        prefix="subtext"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="transparent"
                                    />

                                    <ShadowControl
                                        label="Box Shadow"
                                        prefix="subtext"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <BorderControl
                                        label="Border"
                                        prefix="subtext"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <CornerRadiusControl
                                        label="Corner Radius"
                                        prefix="subtext"
                                        val={val}
                                        updateBatch={updateBatch}
                                    />
                                </>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-0.5">
                                        <FieldLabel>Hover Text Color</FieldLabel>
                                        <ColorPickerInput
                                            value={val('subtextHoverColor', val('hoverSubtextColor', '#ffffff'))}
                                            onChange={v => updateBatch({ subtextHoverColor: v, hoverSubtextColor: v })}
                                            styleGuide={styleGuide}
                                        />
                                    </div>

                                    <div className="space-y-0.5">
                                        <FieldLabel>Hover Opacity</FieldLabel>
                                        <input
                                            type="number"
                                            min="0.1"
                                            max="1.0"
                                            step="0.05"
                                            value={val('subtextHoverOpacity', 1.0)}
                                            onChange={e => update('subtextHoverOpacity', parseFloat(e.target.value) || 1.0)}
                                            className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium"
                                        />
                                    </div>

                                    <BackgroundControl
                                        label="Hover Background"
                                        prefix="subtextHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="transparent"
                                    />

                                    <ShadowControl
                                        label="Hover Box Shadow"
                                        prefix="subtextHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <BorderControl
                                        label="Hover Border"
                                        prefix="subtextHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />
                                </div>
                            )}
                        </div>
                    </AccordionSection>

                    {/* Accordion 3: Icon */}
                    <AccordionSection title="Icon" icon={<Smile className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex-1">
                                    <TabSwitcher tabs={['Normal', 'Hover ✨']} active={iconStyleTab === 'Hover' ? 'Hover ✨' : iconStyleTab} onChange={t => setIconStyleTab(t.startsWith('Hover') ? 'Hover' : 'Normal')} />
                                </div>
                            </div>

                            {iconStyleTab === 'Normal' ? (
                                <>
                                    <div className="space-y-0.5">
                                        <FieldLabel>Color</FieldLabel>
                                        <ColorPickerInput
                                            value={val('btnIconColor', '#ffffff')}
                                            onChange={v => update('btnIconColor', v)}
                                            styleGuide={styleGuide}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <FieldLabel>Size (px)</FieldLabel>
                                            <input
                                                type="number"
                                                value={val('btnIconSize', 16)}
                                                onChange={e => update('btnIconSize', Number(e.target.value))}
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <FieldLabel>Spacing (px)</FieldLabel>
                                            <input
                                                type="number"
                                                value={val('btnIconGap', 8)}
                                                onChange={e => update('btnIconGap', Number(e.target.value))}
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <FieldLabel>Position</FieldLabel>
                                            <PanelSelect value={val('btnIconPosition', 'right')} onChange={e => update('btnIconPosition', e.target.value)}>
                                                <option value="left">Left of Text</option>
                                                <option value="right">Right of Text</option>
                                            </PanelSelect>
                                        </div>
                                        <div className="space-y-0.5">
                                            <FieldLabel>Padding (px)</FieldLabel>
                                            <input
                                                type="number"
                                                value={val('btnIconPadding', 0)}
                                                onChange={e => update('btnIconPadding', Number(e.target.value))}
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    <BackgroundControl
                                        label="Background"
                                        prefix="btnIcon"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="transparent"
                                    />

                                    <ShadowControl
                                        label="Box Shadow"
                                        prefix="btnIcon"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <BorderControl
                                        label="Border"
                                        prefix="btnIcon"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <CornerRadiusControl
                                        label="Corner Radius"
                                        prefix="btnIcon"
                                        val={val}
                                        updateBatch={updateBatch}
                                    />
                                </>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-0.5">
                                        <FieldLabel>Hover Color</FieldLabel>
                                        <ColorPickerInput
                                            value={val('btnIconHoverColor', '#ffffff')}
                                            onChange={v => update('btnIconHoverColor', v)}
                                            styleGuide={styleGuide}
                                        />
                                    </div>

                                    <BackgroundControl
                                        label="Hover Background"
                                        prefix="btnIconHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="transparent"
                                    />

                                    <ShadowControl
                                        label="Hover Box Shadow"
                                        prefix="btnIconHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <BorderControl
                                        label="Hover Border"
                                        prefix="btnIconHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />
                                </div>
                            )}
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE B: FAQ ACCORDION ACCORDIONS --- */}
            {element.type === 'faq_accordion' && (
                <div className="space-y-2.5">
                    <AccordionSection title="Question Header" icon={<HelpCircle className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex-1">
                                    <TabSwitcher tabs={['Normal', 'Hover ✨']} active={faqQStyleTab === 'Hover' ? 'Hover ✨' : faqQStyleTab} onChange={t => setFaqQStyleTab(t.startsWith('Hover') ? 'Hover' : 'Normal')} />
                                </div>
                            </div>

                            {faqQStyleTab === 'Normal' ? (
                                <>
                                    <TypographyControl
                                        label="Typography"
                                        prefix="q"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultSize={14}
                                        defaultWeight="700"
                                    />

                                    <div className="space-y-0.5">
                                        <FieldLabel>Text Color</FieldLabel>
                                        <ColorPickerInput value={val('qColor', '#111827')} onChange={v => update('qColor', v)} styleGuide={styleGuide} />
                                    </div>

                                    <BackgroundControl
                                        label="Background"
                                        prefix="q"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="#ffffff"
                                    />

                                    <ShadowControl
                                        label="Box Shadow"
                                        prefix="q"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <BorderControl
                                        label="Border"
                                        prefix="q"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <CornerRadiusControl
                                        label="Corner Radius"
                                        prefix="q"
                                        val={val}
                                        updateBatch={updateBatch}
                                    />

                                    <SpacingControl
                                        label="Padding"
                                        type="padding"
                                        prefix="q"
                                        val={val}
                                        updateBatch={updateBatch}
                                        defaultVal={12}
                                    />
                                </>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-0.5">
                                        <FieldLabel>Hover Text Color</FieldLabel>
                                        <ColorPickerInput value={val('qHoverColor', styleGuide?.systemColors?.primary || '#2563eb')} onChange={v => update('qHoverColor', v)} styleGuide={styleGuide} />
                                    </div>

                                    <BackgroundControl
                                        label="Hover Background"
                                        prefix="qHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="#f9fafb"
                                    />

                                    <ShadowControl
                                        label="Hover Box Shadow"
                                        prefix="qHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <BorderControl
                                        label="Hover Border"
                                        prefix="qHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />
                                </div>
                            )}
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Answer Body" icon={<MessageSquare className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <TypographyControl
                                label="Typography"
                                prefix="a"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultSize={13}
                                defaultWeight="400"
                            />

                            <div className="space-y-0.5">
                                <FieldLabel>Text Color</FieldLabel>
                                <ColorPickerInput value={val('aColor', '#4b5563')} onChange={v => update('aColor', v)} styleGuide={styleGuide} />
                            </div>

                            <BackgroundControl
                                label="Background"
                                prefix="a"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="#ffffff"
                            />

                            <ShadowControl
                                label="Box Shadow"
                                prefix="a"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />

                            <BorderControl
                                label="Border"
                                prefix="a"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />

                            <CornerRadiusControl
                                label="Corner Radius"
                                prefix="a"
                                val={val}
                                updateBatch={updateBatch}
                            />

                            <SpacingControl
                                label="Padding"
                                type="padding"
                                prefix="a"
                                val={val}
                                updateBatch={updateBatch}
                                defaultVal={14}
                            />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Card Container & Toggle Icon" icon={<Layers className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex-1">
                                    <TabSwitcher tabs={['Normal', 'Hover ✨']} active={faqCardStyleTab === 'Hover' ? 'Hover ✨' : faqCardStyleTab} onChange={t => setFaqCardStyleTab(t.startsWith('Hover') ? 'Hover' : 'Normal')} />
                                </div>
                            </div>

                            {faqCardStyleTab === 'Normal' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <FieldLabel>Toggle Icon Color</FieldLabel>
                                            <ColorPickerInput value={val('iconColor', '#9ca3af')} onChange={v => update('iconColor', v)} styleGuide={styleGuide} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <FieldLabel>Toggle Icon Size (px)</FieldLabel>
                                            <input type="number" value={val('iconSize', 14)} onChange={e => update('iconSize', Number(e.target.value))} className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium" />
                                        </div>
                                    </div>

                                    <BackgroundControl
                                        label="Background"
                                        prefix="faqCard"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="#ffffff"
                                    />

                                    <BorderControl
                                        label="Border"
                                        prefix="item"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="#e5e7eb"
                                    />

                                    <CornerRadiusControl
                                        label="Corner Radius"
                                        prefix="item"
                                        val={val}
                                        updateBatch={updateBatch}
                                        defaultRadius={8}
                                    />

                                    <ShadowControl
                                        label="Box Shadow"
                                        prefix="item"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />
                                </>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-0.5">
                                        <FieldLabel>Hover Toggle Icon Color</FieldLabel>
                                        <ColorPickerInput value={val('iconHoverColor', styleGuide?.systemColors?.primary || '#2563eb')} onChange={v => update('iconHoverColor', v)} styleGuide={styleGuide} />
                                    </div>

                                    <BackgroundControl
                                        label="Hover Background"
                                        prefix="faqCardHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <BorderControl
                                        label="Hover Border"
                                        prefix="itemHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <ShadowControl
                                        label="Hover Box Shadow"
                                        prefix="itemHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />
                                </div>
                            )}
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE C: TESTIMONIAL SLIDER ACCORDIONS --- */}
            {element.type === 'testimonial_slider' && (
                <div className="space-y-2.5">
                    <AccordionSection title="Quote Text" icon={<MessageSquare className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <TypographyControl
                                label="Typography"
                                prefix="quote"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultSize={14}
                            />

                            <div className="space-y-0.5">
                                <FieldLabel>Text Color</FieldLabel>
                                <ColorPickerInput value={val('quoteColor', '#1f2937')} onChange={v => update('quoteColor', v)} styleGuide={styleGuide} />
                            </div>

                            <BackgroundControl
                                label="Background"
                                prefix="quote"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="transparent"
                            />

                            <BorderControl
                                label="Border"
                                prefix="quote"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />

                            <ShadowControl
                                label="Box Shadow"
                                prefix="quote"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Author & Role" icon={<Type className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <TypographyControl
                                label="Typography"
                                prefix="author"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultSize={13}
                                defaultWeight="700"
                            />

                            <div className="space-y-0.5">
                                <FieldLabel>Text Color</FieldLabel>
                                <ColorPickerInput value={val('authorColor', '#111827')} onChange={v => update('authorColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Card, Stars & Navigation" icon={<Star className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex-1">
                                    <TabSwitcher tabs={['Normal', 'Hover ✨']} active={testCardStyleTab === 'Hover' ? 'Hover ✨' : testCardStyleTab} onChange={t => setTestCardStyleTab(t.startsWith('Hover') ? 'Hover' : 'Normal')} />
                                </div>
                            </div>

                            {testCardStyleTab === 'Normal' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <FieldLabel>Star Color</FieldLabel>
                                            <ColorPickerInput value={val('starColor', '#f59e0b')} onChange={v => update('starColor', v)} styleGuide={styleGuide} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <FieldLabel>Nav Arrow BG</FieldLabel>
                                            <ColorPickerInput value={val('arrowBgColor', '#ffffff')} onChange={v => update('arrowBgColor', v)} styleGuide={styleGuide} />
                                        </div>
                                    </div>

                                    <BackgroundControl
                                        label="Background"
                                        prefix="card"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="#ffffff"
                                    />

                                    <BorderControl
                                        label="Border"
                                        prefix="card"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="#e5e7eb"
                                    />

                                    <CornerRadiusControl
                                        label="Corner Radius"
                                        prefix="card"
                                        val={val}
                                        updateBatch={updateBatch}
                                        defaultRadius={12}
                                    />

                                    <ShadowControl
                                        label="Box Shadow"
                                        prefix="card"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <SpacingControl
                                        label="Padding"
                                        type="padding"
                                        prefix="card"
                                        val={val}
                                        updateBatch={updateBatch}
                                        defaultVal={16}
                                    />
                                </>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <BackgroundControl
                                        label="Hover Background"
                                        prefix="cardHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <BorderControl
                                        label="Hover Border"
                                        prefix="cardHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <ShadowControl
                                        label="Hover Box Shadow"
                                        prefix="cardHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />
                                </div>
                            )}
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE D: ICON BOX ACCORDIONS --- */}
            {element.type === 'icon_box' && (
                <div className="space-y-2.5">
                    <AccordionSection title="Box Card" icon={<Layers className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <BackgroundControl
                                label="Background"
                                prefix="box"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="#ffffff"
                            />

                            <BorderControl
                                label="Border"
                                prefix="box"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="#e5e7eb"
                            />

                            <CornerRadiusControl
                                label="Corner Radius"
                                prefix="box"
                                val={val}
                                updateBatch={updateBatch}
                                defaultRadius={12}
                            />

                            <ShadowControl
                                label="Box Shadow"
                                prefix="box"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />

                            <SpacingControl
                                label="Padding"
                                type="padding"
                                prefix="box"
                                val={val}
                                updateBatch={updateBatch}
                                defaultVal={16}
                            />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Icon Graphic" icon={<Smile className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Icon Color</FieldLabel>
                                <ColorPickerInput value={val('iconColor', styleGuide?.systemColors?.primary || '#3b82f6')} onChange={v => update('iconColor', v)} styleGuide={styleGuide} />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                    <FieldLabel>Size (px)</FieldLabel>
                                    <input type="number" value={val('iconSize', 24)} onChange={e => update('iconSize', Number(e.target.value))} className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium" />
                                </div>
                                <div className="space-y-0.5">
                                    <FieldLabel>Padding (px)</FieldLabel>
                                    <input type="number" value={val('iconPadding', 10)} onChange={e => update('iconPadding', Number(e.target.value))} className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium" />
                                </div>
                            </div>

                            <BackgroundControl
                                label="Background"
                                prefix="icon"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="#eff6ff"
                            />

                            <BorderControl
                                label="Border"
                                prefix="icon"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />

                            <CornerRadiusControl
                                label="Corner Radius"
                                prefix="icon"
                                val={val}
                                updateBatch={updateBatch}
                                defaultRadius={12}
                            />

                            <ShadowControl
                                label="Box Shadow"
                                prefix="icon"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Titles & Text" icon={<Type className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <TypographyControl
                                label="Title Typography"
                                prefix="title"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultSize={18}
                                defaultWeight="700"
                            />

                            <div className="space-y-0.5">
                                <FieldLabel>Title Color</FieldLabel>
                                <ColorPickerInput value={val('titleColor', '#111827')} onChange={v => update('titleColor', v)} styleGuide={styleGuide} />
                            </div>

                            <TypographyControl
                                label="Description Typography"
                                prefix="desc"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultSize={14}
                                defaultWeight="400"
                            />

                            <div className="space-y-0.5">
                                <FieldLabel>Description Color</FieldLabel>
                                <ColorPickerInput value={val('descColor', '#4b5563')} onChange={v => update('descColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE E: COUNTDOWN TIMER ACCORDIONS --- */}
            {element.type === 'timer' && (
                <div className="space-y-2.5">
                    <AccordionSection title="Digit Boxes" icon={<Clock className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex-1">
                                    <TabSwitcher tabs={['Normal', 'Hover ✨']} active={timerDigitStyleTab === 'Hover' ? 'Hover ✨' : timerDigitStyleTab} onChange={t => setTimerDigitStyleTab(t.startsWith('Hover') ? 'Hover' : 'Normal')} />
                                </div>
                            </div>

                            {timerDigitStyleTab === 'Normal' ? (
                                <>
                                    <TypographyControl
                                        label="Typography"
                                        prefix="digit"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultSize={24}
                                        defaultWeight="700"
                                    />

                                    <div className="space-y-0.5">
                                        <FieldLabel>Text Color</FieldLabel>
                                        <ColorPickerInput value={val('digitTextColor', '#ffffff')} onChange={v => update('digitTextColor', v)} styleGuide={styleGuide} />
                                    </div>

                                    <BackgroundControl
                                        label="Background"
                                        prefix="digit"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultColor="#1e293b"
                                    />

                                    <BorderControl
                                        label="Border"
                                        prefix="digit"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <CornerRadiusControl
                                        label="Corner Radius"
                                        prefix="digit"
                                        val={val}
                                        updateBatch={updateBatch}
                                        defaultRadius={8}
                                    />

                                    <ShadowControl
                                        label="Box Shadow"
                                        prefix="digit"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />
                                </>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-0.5">
                                        <FieldLabel>Hover Text Color</FieldLabel>
                                        <ColorPickerInput value={val('digitHoverTextColor', '#ffffff')} onChange={v => update('digitHoverTextColor', v)} styleGuide={styleGuide} />
                                    </div>

                                    <BackgroundControl
                                        label="Hover Background"
                                        prefix="digitHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <BorderControl
                                        label="Hover Border"
                                        prefix="digitHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />

                                    <ShadowControl
                                        label="Hover Box Shadow"
                                        prefix="digitHover"
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                    />
                                </div>
                            )}
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Unit Labels" icon={<Type className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <TypographyControl
                                label="Typography"
                                prefix="unit"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultSize={10}
                                defaultWeight="600"
                            />

                            <div className="space-y-0.5">
                                <FieldLabel>Text Color</FieldLabel>
                                <ColorPickerInput value={val('unitColor', '#64748b')} onChange={v => update('unitColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Timer Container" icon={<Layers className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <BackgroundControl
                                label="Background"
                                prefix="timer"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="transparent"
                            />

                            <BorderControl
                                label="Border"
                                prefix="timer"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />

                            <CornerRadiusControl
                                label="Corner Radius"
                                prefix="timer"
                                val={val}
                                updateBatch={updateBatch}
                            />

                            <ShadowControl
                                label="Box Shadow"
                                prefix="timer"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE F: ORDER BUMP ACCORDIONS --- */}
            {element.type === 'order_bump' && (
                <div className="space-y-2.5">
                    <AccordionSection title="Bump Card" icon={<Layers className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <BackgroundControl
                                label="Background"
                                prefix="box"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="#fffbeb"
                            />

                            <BorderControl
                                label="Border"
                                prefix="box"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultType="dashed"
                                defaultColor="#f59e0b"
                            />

                            <CornerRadiusControl
                                label="Corner Radius"
                                prefix="box"
                                val={val}
                                updateBatch={updateBatch}
                                defaultRadius={8}
                            />

                            <ShadowControl
                                label="Box Shadow"
                                prefix="box"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />

                            <SpacingControl
                                label="Padding"
                                type="padding"
                                prefix="box"
                                val={val}
                                updateBatch={updateBatch}
                                defaultVal={14}
                            />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Offer Badge" icon={<Tag className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <TypographyControl
                                label="Typography"
                                prefix="bumpBadge"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultSize={10}
                                defaultWeight="700"
                            />

                            <div className="space-y-0.5">
                                <FieldLabel>Text Color</FieldLabel>
                                <ColorPickerInput value={val('bumpBadgeTextColor', '#92400e')} onChange={v => update('bumpBadgeTextColor', v)} styleGuide={styleGuide} />
                            </div>

                            <BackgroundControl
                                label="Background"
                                prefix="bumpBadge"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="#fef3c7"
                            />

                            <BorderControl
                                label="Border"
                                prefix="bumpBadge"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />

                            <CornerRadiusControl
                                label="Corner Radius"
                                prefix="bumpBadge"
                                val={val}
                                updateBatch={updateBatch}
                                defaultRadius={4}
                            />

                            <ShadowControl
                                label="Box Shadow"
                                prefix="bumpBadge"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Price & Text" icon={<Type className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <TypographyControl
                                label="Price Typography"
                                prefix="bumpPrice"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultSize={16}
                                defaultWeight="700"
                            />

                            <div className="space-y-0.5">
                                <FieldLabel>Price Color</FieldLabel>
                                <ColorPickerInput value={val('bumpPriceColor', val('priceColor', '#16a34a'))} onChange={v => updateBatch({ bumpPriceColor: v, priceColor: v })} styleGuide={styleGuide} />
                            </div>

                            <TypographyControl
                                label="Title Typography"
                                prefix="title"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultSize={14}
                                defaultWeight="700"
                            />

                            <div className="space-y-0.5">
                                <FieldLabel>Title Color</FieldLabel>
                                <ColorPickerInput value={val('titleColor', '#111827')} onChange={v => update('titleColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE F: BULLET LIST ACCORDIONS --- */}
            {element.type === 'bullets' && (
                <div className="space-y-2.5">
                    {/* Accordion 1: List Items & Typography */}
                    <AccordionSection title="List Text & Spacing" icon={<Type className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex-1">
                                    <TabSwitcher tabs={['Normal', 'Hover ✨']} active={bulletTextStyleTab === 'Hover' ? 'Hover ✨' : bulletTextStyleTab} onChange={t => setBulletTextStyleTab(t.startsWith('Hover') ? 'Hover' : 'Normal')} />
                                </div>
                            </div>

                            {bulletTextStyleTab === 'Normal' ? (
                                <>
                                    <TypographyControl
                                        label="Typography"
                                        prefix=""
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultSize={16}
                                        defaultWeight="500"
                                    />

                                    <div className="space-y-0.5">
                                        <FieldLabel>Text Color</FieldLabel>
                                        <ColorPickerInput value={val('textColor', '#1f2937')} onChange={v => update('textColor', v)} styleGuide={styleGuide} />
                                    </div>

                                    <div className="space-y-0.5">
                                        <FieldLabel>Space Between Items (px)</FieldLabel>
                                        <input
                                            type="number"
                                            value={val('itemSpacing', 12)}
                                            onChange={e => update('itemSpacing', Number(e.target.value))}
                                            className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-0.5">
                                        <FieldLabel>Hover Text Color</FieldLabel>
                                        <ColorPickerInput value={val('hoverTextColor', '#111827')} onChange={v => update('hoverTextColor', v)} styleGuide={styleGuide} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </AccordionSection>

                    {/* Accordion 2: List Icons */}
                    <AccordionSection title="Icon Styling" icon={<Sparkles className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex-1">
                                    <TabSwitcher tabs={['Normal', 'Hover ✨']} active={bulletIconStyleTab === 'Hover' ? 'Hover ✨' : bulletIconStyleTab} onChange={t => setBulletIconStyleTab(t.startsWith('Hover') ? 'Hover' : 'Normal')} />
                                </div>
                            </div>

                            {bulletIconStyleTab === 'Normal' ? (
                                <>
                                    <div className="space-y-0.5">
                                        <FieldLabel>Icon Color</FieldLabel>
                                        <ColorPickerInput value={val('bulletIconColor', '#22c55e')} onChange={v => update('bulletIconColor', v)} styleGuide={styleGuide} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-0.5">
                                            <FieldLabel>Icon Size (px)</FieldLabel>
                                            <input
                                                type="number"
                                                value={val('bulletIconSize', 18)}
                                                onChange={e => update('bulletIconSize', Number(e.target.value))}
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <FieldLabel>Icon Spacing (px)</FieldLabel>
                                            <input
                                                type="number"
                                                value={val('bulletIconGap', 10)}
                                                onChange={e => update('bulletIconGap', Number(e.target.value))}
                                                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-0.5">
                                        <FieldLabel>Vertical Alignment</FieldLabel>
                                        <PanelSelect value={val('bulletIconAlign', 'center')} onChange={e => update('bulletIconAlign', e.target.value)}>
                                            <option value="center">Center</option>
                                            <option value="top">Top (Multi-line)</option>
                                            <option value="baseline">Baseline</option>
                                        </PanelSelect>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-0.5">
                                        <FieldLabel>Hover Icon Color</FieldLabel>
                                        <ColorPickerInput value={val('bulletIconHoverColor', '#16a34a')} onChange={v => update('bulletIconHoverColor', v)} styleGuide={styleGuide} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </AccordionSection>

                    {/* Accordion 3: Container Box */}
                    <AccordionSection title="Container Box" icon={<Layers className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <BackgroundControl
                                label="Background"
                                prefix=""
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="transparent"
                            />
                            <BorderControl
                                label="Border"
                                prefix=""
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />
                            <CornerRadiusControl
                                label="Corner Radius"
                                prefix=""
                                val={val}
                                updateBatch={updateBatch}
                            />
                            <ShadowControl
                                label="Box Shadow"
                                prefix=""
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                            />
                            <SpacingControl
                                label="Padding"
                                type="padding"
                                prefix=""
                                val={val}
                                updateBatch={updateBatch}
                            />
                            <SpacingControl
                                label="Margin"
                                type="margin"
                                prefix=""
                                val={val}
                                updateBatch={updateBatch}
                            />
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE I: TWO STEP ORDER FORM --- */}
            {element.type === 'two_step_order' && (
                <div className="space-y-2.5">
                    <AccordionSection title="Order Box Container" icon={<ShoppingBag className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <BackgroundControl label="Background" prefix="box" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} defaultColor="#ffffff" />
                            <BorderControl label="Border" prefix="box" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} defaultColor="#e5e7eb" />
                            <CornerRadiusControl label="Corner Radius" prefix="box" val={val} updateBatch={updateBatch} defaultRadius={16} />
                            <ShadowControl label="Box Shadow" prefix="box" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Step Navigation Tabs" icon={<Layers className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Active Tab Background</FieldLabel>
                                <ColorPickerInput value={val('tabActiveBgColor', '#ffffff')} onChange={v => update('tabActiveBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Active Tab Text & Border Color</FieldLabel>
                                <ColorPickerInput value={val('tabActiveTextColor', styleGuide?.systemColors?.primary || '#6366f1')} onChange={v => update('tabActiveTextColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Inactive Tab Background</FieldLabel>
                                <ColorPickerInput value={val('tabInactiveBgColor', '#f9fafb')} onChange={v => update('tabInactiveBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Inactive Tab Text Color</FieldLabel>
                                <ColorPickerInput value={val('tabInactiveTextColor', '#6b7280')} onChange={v => update('tabInactiveTextColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Input Fields & Labels" icon={<CheckSquare className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Label Color</FieldLabel>
                                <ColorPickerInput value={val('labelColor', '#374151')} onChange={v => update('labelColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Input Background</FieldLabel>
                                <ColorPickerInput value={val('inputBgColor', '#ffffff')} onChange={v => update('inputBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Input Border Color</FieldLabel>
                                <ColorPickerInput value={val('inputBorderColor', '#d1d5db')} onChange={v => update('inputBorderColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Input Focus Color</FieldLabel>
                                <ColorPickerInput value={val('inputFocusBorderColor', styleGuide?.systemColors?.primary || '#6366f1')} onChange={v => update('inputFocusBorderColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Input Text Color</FieldLabel>
                                <ColorPickerInput value={val('inputTextColor', '#111827')} onChange={v => update('inputTextColor', v)} styleGuide={styleGuide} />
                            </div>
                            <CornerRadiusControl label="Input Corner Radius" prefix="input" val={val} updateBatch={updateBatch} defaultRadius={8} />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Order Summary & Total" icon={<Tag className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Summary Box Background</FieldLabel>
                                <ColorPickerInput value={val('summaryBgColor', '#f8fafc')} onChange={v => update('summaryBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Summary Border Color</FieldLabel>
                                <ColorPickerInput value={val('summaryBorderColor', '#e2e8f0')} onChange={v => update('summaryBorderColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Total Price Text Color</FieldLabel>
                                <ColorPickerInput value={val('totalPriceColor', '#0f172a')} onChange={v => update('totalPriceColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Submit CTA Button" icon={<Sparkles className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Button Background</FieldLabel>
                                <ColorPickerInput value={val('btnBgColor', '#10b981')} onChange={v => update('btnBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Button Text Color</FieldLabel>
                                <ColorPickerInput value={val('btnTextColor', '#ffffff')} onChange={v => update('btnTextColor', v)} styleGuide={styleGuide} />
                            </div>
                            <CornerRadiusControl label="Button Corner Radius" prefix="btn" val={val} updateBatch={updateBatch} defaultRadius={10} />
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE J: UPSELL / OTO BOX --- */}
            {element.type === 'upsell_box' && (
                <div className="space-y-2.5">
                    <AccordionSection title="Offer Card Container" icon={<ShoppingBag className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <BackgroundControl label="Background" prefix="box" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} defaultColor="#ffffff" />
                            <BorderControl label="Border" prefix="box" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} defaultColor="#6366f1" />
                            <CornerRadiusControl label="Corner Radius" prefix="box" val={val} updateBatch={updateBatch} defaultRadius={16} />
                            <ShadowControl label="Box Shadow" prefix="box" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Offer Headlines & Badge" icon={<Type className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Urgency Badge Background</FieldLabel>
                                <ColorPickerInput value={val('badgeBgColor', '#fee2e2')} onChange={v => update('badgeBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Urgency Badge Text Color</FieldLabel>
                                <ColorPickerInput value={val('badgeTextColor', '#dc2626')} onChange={v => update('badgeTextColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Headline Color</FieldLabel>
                                <ColorPickerInput value={val('headlineColor', '#111827')} onChange={v => update('headlineColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Subheadline Color</FieldLabel>
                                <ColorPickerInput value={val('subheadlineColor', '#4b5563')} onChange={v => update('subheadlineColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Product Callout & Pricing" icon={<DollarSign className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Callout Background</FieldLabel>
                                <ColorPickerInput value={val('calloutBgColor', '#f8fafc')} onChange={v => update('calloutBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Callout Border Color</FieldLabel>
                                <ColorPickerInput value={val('calloutBorderColor', '#e2e8f0')} onChange={v => update('calloutBorderColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Special Offer Price Color</FieldLabel>
                                <ColorPickerInput value={val('priceColor', '#16a34a')} onChange={v => update('priceColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Accept & Decline Buttons" icon={<Sparkles className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Accept Button Background</FieldLabel>
                                <ColorPickerInput value={val('acceptBtnBgColor', '#16a34a')} onChange={v => update('acceptBtnBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Accept Button Text Color</FieldLabel>
                                <ColorPickerInput value={val('acceptBtnTextColor', '#ffffff')} onChange={v => update('acceptBtnTextColor', v)} styleGuide={styleGuide} />
                            </div>
                            <CornerRadiusControl label="Accept Button Radius" prefix="acceptBtn" val={val} updateBatch={updateBatch} defaultRadius={10} />
                            <div className="space-y-0.5">
                                <FieldLabel>Decline Link Color</FieldLabel>
                                <ColorPickerInput value={val('declineTextColor', '#9ca3af')} onChange={v => update('declineTextColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE K: PRICING TABLE --- */}
            {element.type === 'pricing_table' && (
                <div className="space-y-2.5">
                    <AccordionSection title="Standard Plan Cards" icon={<Layers className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <BackgroundControl label="Card Background" prefix="card" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} defaultColor="#ffffff" />
                            <BorderControl label="Card Border" prefix="card" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} defaultColor="#e5e7eb" />
                            <CornerRadiusControl label="Corner Radius" prefix="card" val={val} updateBatch={updateBatch} defaultRadius={16} />
                            <ShadowControl label="Card Shadow" prefix="card" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Featured / Popular Card" icon={<Star className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Featured Card Border Color</FieldLabel>
                                <ColorPickerInput value={val('featuredCardBorderColor', styleGuide?.systemColors?.primary || '#4f46e5')} onChange={v => update('featuredCardBorderColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Featured Badge Background</FieldLabel>
                                <ColorPickerInput value={val('featuredBadgeBgColor', styleGuide?.systemColors?.primary || '#4f46e5')} onChange={v => update('featuredBadgeBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Featured Badge Text Color</FieldLabel>
                                <ColorPickerInput value={val('featuredBadgeTextColor', '#ffffff')} onChange={v => update('featuredBadgeTextColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Typography & Pricing" icon={<DollarSign className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Plan Title Color</FieldLabel>
                                <ColorPickerInput value={val('planTitleColor', '#111827')} onChange={v => update('planTitleColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Price Color</FieldLabel>
                                <ColorPickerInput value={val('priceColor', '#111827')} onChange={v => update('priceColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="CTA Buttons" icon={<Sparkles className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Button Background</FieldLabel>
                                <ColorPickerInput value={val('btnBgColor', styleGuide?.systemColors?.primary || '#4f46e5')} onChange={v => update('btnBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Button Text Color</FieldLabel>
                                <ColorPickerInput value={val('btnTextColor', '#ffffff')} onChange={v => update('btnTextColor', v)} styleGuide={styleGuide} />
                            </div>
                            <CornerRadiusControl label="Button Corner Radius" prefix="btn" val={val} updateBatch={updateBatch} defaultRadius={10} />
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE L: FORM INPUTS --- */}
            {['input_email', 'input_name', 'input_phone', 'datepicker', 'signature'].includes(element.type) && (
                <div className="space-y-2.5">
                    <AccordionSection title="Field Label" icon={<Type className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <TypographyControl label="Label Typography" prefix="label" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} defaultSize={13} defaultWeight="600" />
                            <div className="space-y-0.5">
                                <FieldLabel>Label Color</FieldLabel>
                                <ColorPickerInput value={val('labelColor', '#374151')} onChange={v => update('labelColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title={element.type === 'signature' ? 'Signature Pad' : 'Input Box'} icon={<CheckSquare className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <BackgroundControl label="Input Background" prefix="input" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} defaultColor="#ffffff" />
                            <BorderControl label="Input Border" prefix="input" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} defaultColor="#d1d5db" />
                            <div className="space-y-0.5">
                                <FieldLabel>Focus Ring Color</FieldLabel>
                                <ColorPickerInput value={val('inputFocusBorderColor', styleGuide?.systemColors?.primary || '#4f46e5')} onChange={v => update('inputFocusBorderColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Text Color</FieldLabel>
                                <ColorPickerInput value={val('inputTextColor', '#111827')} onChange={v => update('inputTextColor', v)} styleGuide={styleGuide} />
                            </div>
                            <CornerRadiusControl label="Corner Radius" prefix="input" val={val} updateBatch={updateBatch} defaultRadius={8} />
                            <SpacingControl label="Padding" type="padding" prefix="input" val={val} updateBatch={updateBatch} defaultVal={10} />
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE M: PROGRESS BAR --- */}
            {element.type === 'progress_bar' && (
                <div className="space-y-2.5">
                    <AccordionSection title="Bar Track & Fill" icon={<Sliders className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={true}>
                        <div className="space-y-3">
                            <div className="space-y-0.5">
                                <FieldLabel>Fill Color</FieldLabel>
                                <ColorPickerInput value={val('fillColor', '#10b981')} onChange={v => update('fillColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Track Background</FieldLabel>
                                <ColorPickerInput value={val('trackBgColor', '#e5e7eb')} onChange={v => update('trackBgColor', v)} styleGuide={styleGuide} />
                            </div>
                            <div className="space-y-0.5">
                                <FieldLabel>Bar Height (px)</FieldLabel>
                                <input type="number" min="4" max="50" value={val('barHeight', 12)} onChange={e => update('barHeight', Number(e.target.value))} className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium" />
                            </div>
                            <CornerRadiusControl label="Bar Corner Radius" prefix="bar" val={val} updateBatch={updateBatch} defaultRadius={9999} />
                        </div>
                    </AccordionSection>
                    <AccordionSection title="Label Typography" icon={<Type className="h-3.5 w-3.5 text-brand-600" />} defaultOpen={false}>
                        <div className="space-y-3">
                            <TypographyControl label="Typography" prefix="label" val={val} update={update} updateBatch={updateBatch} styleGuide={styleGuide} defaultSize={13} defaultWeight="600" />
                            <div className="space-y-0.5">
                                <FieldLabel>Label Color</FieldLabel>
                                <ColorPickerInput value={val('labelColor', '#374151')} onChange={v => update('labelColor', v)} styleGuide={styleGuide} />
                            </div>
                        </div>
                    </AccordionSection>
                </div>
            )}

            {/* --- CASE N: STANDARD SINGLE ELEMENTS (Headline, Paragraph, Container, etc.) --- */}
            {!COMPOUND_TYPES.includes(element.type) && (
                <>
                    {/* Unified Normal / Hover State Switcher */}
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                        <div className="flex-1">
                            <TabSwitcher tabs={['Normal', 'Hover ✨']} active={mainStyleTab === 'Hover' ? 'Hover ✨' : mainStyleTab} onChange={t => setMainStyleTab(t.startsWith('Hover') ? 'Hover' : 'Normal')} />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                handleResetElementCategory(element.id, 'color');
                                handleResetElementCategory(element.id, 'border');
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition border border-transparent hover:border-neutral-200"
                            title="Reset All Styles"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {mainStyleTab === 'Normal' ? (
                        <>
                            {/* Typography Control */}
                            {TYPOGRAPHY_TYPES.includes(element.type) && (
                                <div className="space-y-2">
                                    <TypographyControl
                                        label={
                                            <span className="flex items-center gap-1.5 font-bold text-neutral-800 text-xs">
                                                Typography
                                                {viewport !== 'desktop' && isKeyOverridden('fontSize') && (
                                                    <Sparkles className="h-3 w-3 text-amber-500" title="Custom viewport overrides applied" />
                                                )}
                                            </span>
                                        }
                                        prefix=""
                                        val={val}
                                        update={update}
                                        updateBatch={updateBatch}
                                        styleGuide={styleGuide}
                                        defaultSize={16}
                                        defaultWeight="400"
                                        onReset={() => handleResetElementCategory(element.id, 'typography')}
                                        resetTitle={`Reset Typography for ${viewport}`}
                                    />
                                </div>
                            )}

                            {/* Text Color */}
                            {TEXT_COLOR_TYPES.includes(element.type) && (
                                <div className="space-y-0.5">
                                    <FieldLabel>Text Color</FieldLabel>
                                    <ColorPickerInput value={val('textColor', '#111827')} onChange={v => update('textColor', v)} styleGuide={styleGuide} />
                                </div>
                            )}

                            {/* Background (Solid, Gradient, Image) */}
                            <BackgroundControl
                                label="Background"
                                prefix=""
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="#ffffff"
                                element={element}
                                isLocallySet={checkLocallySet}
                            />

                            {/* Border */}
                            <BorderControl
                                label="Border"
                                prefix=""
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                element={element}
                                isLocallySet={checkLocallySet}
                            />

                            {/* Corner Radius */}
                            <CornerRadiusControl
                                label="Corner Radius"
                                prefix=""
                                val={val}
                                updateBatch={updateBatch}
                                element={element}
                                isLocallySet={checkLocallySet}
                            />

                            {/* Box Shadow */}
                            <ShadowControl
                                label="Box Shadow"
                                prefix=""
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                element={element}
                                isLocallySet={checkLocallySet}
                            />

                            {/* Spacing (Padding & Margin) */}
                            <SpacingControl
                                label="Padding"
                                type="padding"
                                prefix=""
                                val={val}
                                updateBatch={updateBatch}
                                defaultVal={0}
                                element={element}
                                isLocallySet={checkLocallySet}
                            />

                            <SpacingControl
                                label="Margin"
                                type="margin"
                                prefix=""
                                val={val}
                                updateBatch={updateBatch}
                                defaultVal={0}
                                element={element}
                                isLocallySet={checkLocallySet}
                            />
                        </>
                    ) : (
                        /* Hover State */
                        <div className="space-y-3 pt-1">
                            {TEXT_COLOR_TYPES.includes(element.type) && (
                                <div className="space-y-0.5">
                                    <FieldLabel>Hover Text Color</FieldLabel>
                                    <ColorPickerInput value={val('hoverTextColor', '#ffffff')} onChange={v => update('hoverTextColor', v)} styleGuide={styleGuide} />
                                </div>
                            )}
                            
                            {/* Hover Background (Solid, Gradient, Image) */}
                            <BackgroundControl
                                label="Hover Background"
                                prefix="hover"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="#f3f4f6"
                                element={element}
                                isLocallySet={checkLocallySet}
                            />

                            <ShadowControl
                                label="Hover Box Shadow"
                                prefix="hover"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="rgba(0,0,0,0.2)"
                                element={element}
                                isLocallySet={checkLocallySet}
                            />

                            <BorderControl
                                label="Hover Border"
                                prefix="hover"
                                val={val}
                                update={update}
                                updateBatch={updateBatch}
                                styleGuide={styleGuide}
                                defaultColor="#9ca3af"
                                element={element}
                                isLocallySet={checkLocallySet}
                            />

                            <CornerRadiusControl
                                label="Hover Corner Radius"
                                prefix="hover"
                                val={val}
                                updateBatch={updateBatch}
                                element={element}
                                isLocallySet={checkLocallySet}
                            />

                            {/* Hover Micro-Animation Preset */}
                            <HoverAnimationSelect
                                value={val('hoverAnimation', 'none')}
                                onChange={v => update('hoverAnimation', v)}
                            />

                            {/* Transition Duration & Curve */}
                            <TransitionControl
                                duration={val('transitionDuration', 200)}
                                timing={val('transitionTiming', 'ease')}
                                onDurationChange={d => update('transitionDuration', d)}
                                onTimingChange={t => update('transitionTiming', t)}
                            />
                        </div>
                    )}
                </>
            )}

        </div>
    );
}
