import React from 'react';
import { PanelInput, PanelTextarea, PanelSelect, FieldLabel } from '../BuilderUI';
import { Checkbox } from '@/Components/ui';

const INPUT_TYPES = ['headline', 'subheadline', 'paragraph', 'bullets', 'quote', 'submit_button',
    'section', 'input_email', 'input_name', 'input_phone', 'checkbox',
    'audio', 'icon_box', 'image', 'video', 'progress_bar', 'social', 'star_rating', 'custom_code',
    'rich_text', 'order_bump', 'faq_accordion', 'testimonial_slider', 'timer', 'two_step_order', 'upsell_box',
    'grid_column', 'divider'];

const DYNAMIC_TAGS = [
    { label: 'First Name', tag: '{{contact.first_name}}' },
    { label: 'Last Name', tag: '{{contact.last_name}}' },
    { label: 'Email', tag: '{{contact.email}}' },
    { label: 'Phone', tag: '{{contact.phone}}' },
    { label: 'Workspace Name', tag: '{{workspace.name}}' },
    { label: 'Current Year', tag: '{{current_year}}' },
];

import DynamicTokenPicker from '@/Components/DynamicTokenPicker';

function MergeTagPicker({ onInsert }) {
    return (
        <DynamicTokenPicker
            onSelect={onInsert}
            buttonText="+ Dynamic Tag"
            align="right"
            buttonClassName="text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-1.5 py-0.5 rounded border border-brand-200 flex items-center gap-1 transition cursor-pointer"
        />
    );
}

/**
 * ContentPanel — type-specific content/property inputs.
 */
export default function ContentPanel({ element, val, handleUpdateElementSetting, activeStep = null }) {
    if (!INPUT_TYPES.includes(element.type)) return null;

    const update = (key, value) => {
        if (element.type === 'submit_button') {
            if (key === 'btnWidthMode') {
                handleUpdateElementSetting(element.id, { btnWidthMode: value, widthMode: value });
                return;
            }
            if (key === 'btnCustomWidth') {
                handleUpdateElementSetting(element.id, { btnCustomWidth: value, customWidth: value });
                return;
            }
            if (key === 'btnAlign') {
                const alignSelf = value === 'left' ? 'flex-start' : value === 'right' ? 'flex-end' : 'center';
                handleUpdateElementSetting(element.id, { btnAlign: value, alignSelf });
                return;
            }
        }
        handleUpdateElementSetting(element.id, key, value);
    };

    return (
        <div className="space-y-2.5 pt-1">
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Content</p>

            {/* Column Link & Info */}
            {element.type === 'grid_column' && (
                <div className="space-y-3">
                    <div className="space-y-0.5">
                        <FieldLabel>Column Hyperlink URL</FieldLabel>
                        <PanelInput
                            type="url"
                            value={val('linkUrl', '')}
                            onChange={e => update('linkUrl', e.target.value)}
                            placeholder="https://example.com/checkout or #target"
                        />
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                            Turns this entire column into a clickable destination link.
                        </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">
                            Column Content
                        </div>
                        <p>
                            Add, reorder, or delete elements inside this column directly on the canvas or via the Layers Tree.
                        </p>
                        <p className="text-neutral-500 italic">
                            Use the <strong>Style</strong> tab for background colors, gradients, borders, shadows & spacing, and the <strong>Advanced</strong> tab for flexbox alignment.
                        </p>
                    </div>
                </div>
            )}

            {/* Heading tag selector */}
            {['headline', 'subheadline'].includes(element.type) && (
                <div className="space-y-0.5">
                    <FieldLabel>Heading Tag (SEO)</FieldLabel>
                    <PanelSelect
                        value={val('headingTag', element.type === 'headline' ? 'h1' : 'h2')}
                        onChange={e => update('headingTag', e.target.value)}
                    >
                        <option value="h1">H1 — Main Title</option>
                        <option value="h2">H2 — Section Header</option>
                        <option value="h3">H3 — Sub Heading</option>
                        <option value="h4">H4 — Small Header</option>
                        <option value="h5">H5 — Minor Header</option>
                        <option value="h6">H6 — Tiny Header</option>
                    </PanelSelect>
                </div>
            )}

            {/* Headline / Subheadline text */}
            {['headline', 'subheadline'].includes(element.type) && (
                <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                        <FieldLabel>Text Content</FieldLabel>
                        <MergeTagPicker onInsert={(tag) => {
                            const cur = val('content') || val('text', '');
                            const next = (cur ? cur + ' ' : '') + tag;
                            update('content', next);
                            update('text', next);
                        }} />
                    </div>
                    <PanelInput
                        type="text"
                        value={val('content') || val('text', '')}
                        onChange={e => {
                            update('content', e.target.value);
                            update('text', e.target.value);
                        }}
                        placeholder="Enter headline text..."
                    />
                </div>
            )}

            {/* Paragraph */}
            {element.type === 'paragraph' && (
                <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                        <FieldLabel>Paragraph Text</FieldLabel>
                        <MergeTagPicker onInsert={(tag) => {
                            const cur = val('content') || val('text', '');
                            const next = (cur ? cur + ' ' : '') + tag;
                            update('content', next);
                            update('text', next);
                        }} />
                    </div>
                    <PanelTextarea
                        rows={4}
                        value={val('content') || val('text', '')}
                        onChange={e => {
                            update('content', e.target.value);
                            update('text', e.target.value);
                        }}
                        placeholder="Enter paragraph text..."
                    />
                </div>
            )}

            {/* Button Content & Actions */}
            {element.type === 'submit_button' && (
                <div className="space-y-2.5">
                    <div className="space-y-0.5">
                        <FieldLabel>Button Label Text</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('text') || val('content', '')}
                            onChange={e => {
                                update('text', e.target.value);
                                update('content', e.target.value);
                            }}
                            placeholder="Get Started Today →"
                        />
                    </div>

                    <div className="space-y-0.5">
                        <FieldLabel>Subtext Micro-Copy (under label)</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('subtext', '')}
                            onChange={e => update('subtext', e.target.value)}
                            placeholder="Instant Access • 100% Secure Guarantee"
                        />
                    </div>

                    {/* Icon selection */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <FieldLabel>Icon Graphic</FieldLabel>
                            <PanelSelect value={val('btnIcon', 'none')} onChange={e => update('btnIcon', e.target.value)}>
                                <option value="none">No Icon</option>
                                <option value="arrow">Arrow (→)</option>
                                <option value="lock">Lock (🔒)</option>
                                <option value="lightning">Lightning (⚡)</option>
                                <option value="cart">Cart (🛒)</option>
                                <option value="download">Download (📥)</option>
                                <option value="star">Star (⭐)</option>
                                <option value="sparkles">Sparkles (✨)</option>
                                <option value="check">Check (✓)</option>
                            </PanelSelect>
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Icon Position</FieldLabel>
                            <PanelSelect value={val('btnIconPosition', 'right')} onChange={e => update('btnIconPosition', e.target.value)}>
                                <option value="right">Right Side</option>
                                <option value="left">Left Side</option>
                            </PanelSelect>
                        </div>
                    </div>
                    {/* Button Sizing & Column Alignment */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
                        <div className="space-y-0.5">
                            <FieldLabel>Button Width</FieldLabel>
                            <PanelSelect
                                value={val('btnWidthMode') || val('widthMode', 'full')}
                                onChange={e => {
                                    update('btnWidthMode', e.target.value);
                                    update('widthMode', e.target.value);
                                }}
                            >
                                <option value="full">Full Width (100%)</option>
                                <option value="auto">Fit Content (Auto)</option>
                                <option value="custom">Custom Width</option>
                            </PanelSelect>
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Alignment</FieldLabel>
                            <PanelSelect
                                value={val('btnAlign') || (val('alignSelf') === 'flex-start' ? 'left' : val('alignSelf') === 'flex-end' ? 'right' : 'center')}
                                onChange={e => {
                                    const a = e.target.value;
                                    update('btnAlign', a);
                                    update('alignSelf', a === 'left' ? 'flex-start' : a === 'right' ? 'flex-end' : 'center');
                                }}
                            >
                                <option value="center">Center</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                            </PanelSelect>
                        </div>
                    </div>

                    {(val('btnWidthMode') === 'custom' || val('widthMode') === 'custom') && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                                <span>Custom Width (%)</span>
                                <span className="font-mono text-brand-600 font-bold">{val('btnCustomWidth') || val('customWidth', 80)}%</span>
                            </div>
                            <input
                                type="range" min="20" max="100"
                                value={val('btnCustomWidth') || val('customWidth', 80)}
                                onChange={e => {
                                    const n = Number(e.target.value);
                                    update('btnCustomWidth', n);
                                    update('customWidth', n);
                                }}
                                className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                            />
                        </div>
                    )}

                    {/* Smart Action Selector */}
                    <div className="space-y-1 pt-1 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                            <FieldLabel>Button Action</FieldLabel>
                            {activeStep?.type && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                    {activeStep.name} Step
                                </span>
                            )}
                        </div>
                        <PanelSelect value={val('btnType', 'submit')} onChange={e => update('btnType', e.target.value)}>
                            {['upsell', 'downsell'].includes(activeStep?.type) && (
                                <>
                                    <option value="accept_upsell">⚡ Accept 1-Click Offer (Charge & Continue)</option>
                                    <option value="decline_upsell">✕ Decline Offer (Skip to Next Step)</option>
                                </>
                            )}
                            <option value="submit">
                                {['optin', 'contact_us', 'booking'].includes(activeStep?.type)
                                    ? 'Submit Form & Go to Next Step (Recommended)'
                                    : 'Submit Form & Proceed (Default)'}
                            </option>
                            <option value="next_step">Go to Next Step in Funnel</option>
                            <option value="specific_step">Go to Specific Step</option>
                            <option value="scroll_to">Scroll to Page Section</option>
                            <option value="open_popup">Open Popup Modal</option>
                            <option value="url">Open External Website URL</option>
                            <option value="call">Click to Call (Phone)</option>
                            <option value="email">Send Email (mailto)</option>
                        </PanelSelect>
                    </div>

                    {['accept_upsell', 'decline_upsell'].includes(val('btnType')) && (
                        <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-200">
                            {val('btnType') === 'accept_upsell' ? (
                                <span>⚡ <strong>1-Click Upsell Action:</strong> Clicking this button immediately charges the customer's saved payment card and seamlessly advances to the next funnel step.</span>
                            ) : (
                                <span>✕ <strong>Decline Action:</strong> Clicking this link declines the upsell offer and routes the customer to the next pipeline step or downsell without charging.</span>
                            )}
                        </div>
                    )}

                    {/* Contextual Action Inputs */}
                    {val('btnType') === 'url' && (
                        <div className="space-y-1.5 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                            <FieldLabel>Target Website URL</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('targetUrl', '')}
                                onChange={e => update('targetUrl', e.target.value)}
                                placeholder="https://example.com/special-offer"
                            />
                            <Checkbox
                                checked={val('targetBlank', false)}
                                onChange={e => update('targetBlank', e.target.checked)}
                                label="Open link in new browser tab"
                            />
                        </div>
                    )}

                    {val('btnType') === 'scroll_to' && (
                        <div className="space-y-1 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                            <FieldLabel>Target Section ID</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('targetSectionId', '')}
                                onChange={e => update('targetSectionId', e.target.value)}
                                placeholder="#pricing-section"
                            />
                        </div>
                    )}

                    {val('btnType') === 'open_popup' && (
                        <div className="space-y-1 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                            <FieldLabel>Popup Modal ID</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('targetPopupId', 'popup_main')}
                                onChange={e => update('targetPopupId', e.target.value)}
                                placeholder="popup_main"
                            />
                        </div>
                    )}

                    {val('btnType') === 'call' && (
                        <div className="space-y-1 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                            <FieldLabel>Phone Number</FieldLabel>
                            <PanelInput
                                type="tel"
                                value={val('phoneNumber', '')}
                                onChange={e => update('phoneNumber', e.target.value)}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    )}

                    {val('btnType') === 'email' && (
                        <div className="space-y-1 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                            <FieldLabel>Recipient Email Address</FieldLabel>
                            <PanelInput
                                type="email"
                                value={val('emailAddress', '')}
                                onChange={e => update('emailAddress', e.target.value)}
                                placeholder="sales@company.com"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Input placeholder */}
            {['input_email', 'input_name', 'input_phone'].includes(element.type) && (
                <div className="space-y-0.5">
                    <FieldLabel>Placeholder Text</FieldLabel>
                    <PanelInput
                        type="text"
                        value={val('placeholder', '')}
                        onChange={e => update('placeholder', e.target.value)}
                        placeholder="Input placeholder text..."
                    />
                </div>
            )}

            {/* Checkbox label */}
            {element.type === 'checkbox' && (
                <div className="space-y-0.5">
                    <FieldLabel>Checkbox Label</FieldLabel>
                    <PanelInput
                        type="text"
                        value={val('text') || val('content', '')}
                        onChange={e => {
                            update('text', e.target.value);
                            update('content', e.target.value);
                        }}
                        placeholder="Checkbox label text..."
                    />
                </div>
            )}

            {/* Quote */}
            {element.type === 'quote' && (
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <FieldLabel>Quote Text</FieldLabel>
                        <PanelTextarea
                            rows={3}
                            value={val('quote') || val('content') || val('text', '')}
                            onChange={e => {
                                update('quote', e.target.value);
                                update('content', e.target.value);
                            }}
                            placeholder="Quote text..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Author</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('author', '')}
                            onChange={e => update('author', e.target.value)}
                            placeholder="Author name..."
                        />
                    </div>
                </div>
            )}

            {/* Image */}
            {element.type === 'image' && (
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <FieldLabel>Image URL</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('url', '')}
                            onChange={e => update('url', e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Alt Text</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('alt', '')}
                            onChange={e => update('alt', e.target.value)}
                            placeholder="Describe the image..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Link URL (optional click target)</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('linkUrl', '')}
                            onChange={e => update('linkUrl', e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                    {/* Column-Specific Sizing & Aspect Ratio */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
                        <div className="space-y-0.5">
                            <FieldLabel>Aspect Ratio</FieldLabel>
                            <PanelSelect value={val('aspectRatio', 'auto')} onChange={e => update('aspectRatio', e.target.value)}>
                                <option value="auto">Natural (Auto)</option>
                                <option value="1/1">1:1 (Square)</option>
                                <option value="16/9">16:9 (Landscape)</option>
                                <option value="4/3">4:3 (Standard)</option>
                                <option value="3/2">3:2 (Photo)</option>
                            </PanelSelect>
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Object Fit</FieldLabel>
                            <PanelSelect value={val('objectFit', 'cover')} onChange={e => update('objectFit', e.target.value)}>
                                <option value="cover">Cover (Fill & Crop)</option>
                                <option value="contain">Contain (Fit All)</option>
                                <option value="fill">Fill (Stretch)</option>
                            </PanelSelect>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <FieldLabel>Hover Effect</FieldLabel>
                            <PanelSelect value={val('hoverEffect', 'none')} onChange={e => update('hoverEffect', e.target.value)}>
                                <option value="none">None</option>
                                <option value="zoom-in">Zoom In (1.05x)</option>
                                <option value="lift">Lift Up</option>
                            </PanelSelect>
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Corner Radius (px)</FieldLabel>
                            <PanelInput
                                type="number" min="0" max="48"
                                value={val('borderRadius', '')}
                                placeholder="Brand default"
                                onChange={e => update('borderRadius', e.target.value === '' ? undefined : Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                            <span>Max Width (%)</span>
                            <span className="font-mono text-brand-600 font-bold">{val('maxWidth', 100)}%</span>
                        </div>
                        <input
                            type="range" min="10" max="100"
                            value={val('maxWidth', 100)}
                            onChange={e => update('maxWidth', Number(e.target.value))}
                            className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Video */}
            {element.type === 'video' && (
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <FieldLabel>Video Embed URL</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('videoUrl', '')}
                            onChange={e => update('videoUrl', e.target.value)}
                            placeholder="YouTube / Vimeo embed URL..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Corner Radius (px)</FieldLabel>
                        <PanelInput
                            type="number" min="0" max="48"
                            value={val('borderRadius', '')}
                            placeholder="Brand default"
                            onChange={e => update('borderRadius', e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                    </div>
                </div>
            )}

            {/* Audio */}
            {element.type === 'audio' && (
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <FieldLabel>Track Title</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('title', '')}
                            onChange={e => update('title', e.target.value)}
                            placeholder="Audio Track Title..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Audio File URL (.mp3 / .wav)</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('url', '')}
                            onChange={e => update('url', e.target.value)}
                            placeholder="https://your-domain.com/audio.mp3"
                        />
                    </div>
                </div>
            )}

            {/* Icon Box */}
            {element.type === 'icon_box' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <FieldLabel>Icon Graphic</FieldLabel>
                            <PanelSelect value={val('icon', 'sparkles')} onChange={e => update('icon', e.target.value)}>
                                <option value="sparkles">Sparkles (✨)</option>
                                <option value="star">Star (⭐)</option>
                                <option value="shield">Shield (🛡️)</option>
                                <option value="lightning">Lightning (⚡)</option>
                                <option value="check">Check (✓)</option>
                                <option value="lock">Lock (🔒)</option>
                                <option value="cart">Cart (🛒)</option>
                                <option value="heart">Heart (❤️)</option>
                                <option value="rocket">Rocket (🚀)</option>
                                <option value="message">Message (💬)</option>
                                <option value="clock">Clock (⏱️)</option>
                                <option value="none">No Icon</option>
                            </PanelSelect>
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Card Layout</FieldLabel>
                            <PanelSelect value={val('layoutAlign', 'vertical')} onChange={e => update('layoutAlign', e.target.value)}>
                                <option value="vertical">Stacked (Centered)</option>
                                <option value="horizontal">Inline (Icon Left)</option>
                            </PanelSelect>
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <FieldLabel>Title</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('title', '')}
                            onChange={e => update('title', e.target.value)}
                            placeholder="Feature Title..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Description</FieldLabel>
                        <PanelTextarea
                            rows={3}
                            value={val('desc', '')}
                            onChange={e => update('desc', e.target.value)}
                            placeholder="Feature Description..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="space-y-0.5">
                            <FieldLabel>Icon Bg Color</FieldLabel>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="color"
                                    value={val('iconBgColor', '#eef2ff')}
                                    onChange={e => update('iconBgColor', e.target.value)}
                                    className="h-7 w-7 rounded border border-neutral-300 cursor-pointer p-0.5"
                                />
                                <PanelInput
                                    type="text"
                                    value={val('iconBgColor', '#eef2ff')}
                                    onChange={e => update('iconBgColor', e.target.value)}
                                    className="text-xs font-mono"
                                />
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Link URL (optional)</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('linkUrl', '')}
                                onChange={e => update('linkUrl', e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Countdown / Urgency Timer */}
            {element.type === 'timer' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <FieldLabel>Timer Mode</FieldLabel>
                            <PanelSelect value={val('timerType', 'evergreen')} onChange={e => update('timerType', e.target.value)}>
                                <option value="evergreen">Evergreen (Per Visitor)</option>
                                <option value="standard">Fixed Deadline</option>
                            </PanelSelect>
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Visual Theme</FieldLabel>
                            <PanelSelect value={val('timerTheme', 'red_urgent')} onChange={e => update('timerTheme', e.target.value)}>
                                <option value="red_urgent">Red Urgent (High Conv.)</option>
                                <option value="brand">Brand Indigo</option>
                                <option value="dark">Sleek Dark</option>
                                <option value="light">Clean Card</option>
                                <option value="minimal">Minimalist Text</option>
                            </PanelSelect>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <FieldLabel>Countdown Duration</FieldLabel>
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">DAYS</label>
                                <PanelInput
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={val('days', 0)}
                                    onChange={e => update('days', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="text-center font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">HOURS</label>
                                <PanelInput
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={val('hours', 0)}
                                    onChange={e => update('hours', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="text-center font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">MINS</label>
                                <PanelInput
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={val('minutes', 15)}
                                    onChange={e => update('minutes', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="text-center font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">SECS</label>
                                <PanelInput
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={val('seconds', 0)}
                                    onChange={e => update('seconds', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="text-center font-mono font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-0.5 pt-1">
                        <FieldLabel>When Timer Expires</FieldLabel>
                        <PanelSelect value={val('timerAction', 'show_message')} onChange={e => update('timerAction', e.target.value)}>
                            <option value="show_message">Show Expired Banner</option>
                            <option value="redirect_url">Redirect Visitor to URL</option>
                            <option value="hide">Hide Countdown Timer</option>
                        </PanelSelect>
                    </div>

                    {(val('timerAction', 'show_message') === 'show_message') && (
                        <div className="space-y-0.5">
                            <FieldLabel>Expired Message Text</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('expireMessage', 'SPECIAL OFFER HAS EXPIRED!')}
                                onChange={e => update('expireMessage', e.target.value)}
                                placeholder="e.g. OFFER EXPIRED!"
                            />
                        </div>
                    )}

                    {val('timerAction') === 'redirect_url' && (
                        <div className="space-y-0.5">
                            <FieldLabel>Redirect Destination URL</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('redirectUrl', '')}
                                onChange={e => update('redirectUrl', e.target.value)}
                                placeholder="https://yourdomain.com/offer-expired"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Bullets */}
            {element.type === 'bullets' && (
                <div className="space-y-3">
                    <div className="space-y-0.5">
                        <FieldLabel>List Icon</FieldLabel>
                        <PanelSelect value={val('bulletIcon', 'check-circle')} onChange={e => update('bulletIcon', e.target.value)}>
                            <option value="check-circle">Check Circle (✓)</option>
                            <option value="check">Checkmark (✓)</option>
                            <option value="star">Star (⭐)</option>
                            <option value="sparkles">Sparkles (✨)</option>
                            <option value="arrow">Arrow (→)</option>
                            <option value="chevron">Chevron (›)</option>
                            <option value="dot">Bullet Dot (•)</option>
                            <option value="shield">Shield (🛡️)</option>
                            <option value="lightning">Lightning (⚡)</option>
                            <option value="heart">Heart (❤️)</option>
                            <option value="cross">Cross / X (✕)</option>
                            <option value="none">No Icon</option>
                        </PanelSelect>
                    </div>

                    <div className="space-y-2">
                        <FieldLabel>Bullet Items</FieldLabel>
                        {(val('items') || element.items || []).map((bullet, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                                <PanelInput
                                    type="text"
                                    value={bullet}
                                    onChange={e => {
                                        const next = [...(val('items') || element.items || [])];
                                        next[idx] = e.target.value;
                                        update('items', next);
                                    }}
                                    placeholder={`Bullet ${idx + 1}...`}
                                />
                                <button
                                    type="button"
                                    onClick={() => update('items', (val('items') || element.items || []).filter((_, i) => i !== idx))}
                                    className="shrink-0 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-500 hover:bg-red-100 transition cursor-pointer"
                                >✕</button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => update('items', [...(val('items') || element.items || []), 'New bullet point'])}
                            className="w-full rounded-lg border border-dashed border-brand-400 py-1.5 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 transition cursor-pointer"
                        >+ Add Bullet Item</button>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            {element.type === 'progress_bar' && (
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <FieldLabel>Label (optional)</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('label', '')}
                            onChange={e => update('label', e.target.value)}
                            placeholder="e.g. Seats Remaining..."
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                            <span>Fill Percentage</span>
                            <span className="font-mono text-brand-600 font-bold">{val('percent', 80)}%</span>
                        </div>
                        <input
                            type="range" min="1" max="100"
                            value={val('percent', 80)}
                            onChange={e => update('percent', Number(e.target.value))}
                            className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Social Share */}
            {element.type === 'social' && (
                <div className="space-y-0.5">
                    <FieldLabel>Page URL to Share (leave blank for current page)</FieldLabel>
                    <PanelInput
                        type="text"
                        value={val('shareUrl', '')}
                        onChange={e => update('shareUrl', e.target.value)}
                        placeholder="https://your-funnel-url.com/page"
                    />
                </div>
            )}

            {/* Star Rating */}
            {element.type === 'star_rating' && (
                <div className="space-y-2">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                            <span>Number of Stars</span>
                            <span className="font-mono text-brand-600 font-bold">{val('stars', 5)} Stars</span>
                        </div>
                        <input
                            type="range" min="1" max="5"
                            value={val('stars', 5)}
                            onChange={e => update('stars', Number(e.target.value))}
                            className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Rating Subtext</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('ratingText', '')}
                            onChange={e => update('ratingText', e.target.value)}
                            placeholder="5.0 out of 5 stars (1,200+ reviews)"
                        />
                    </div>
                </div>
            )}

            {/* Custom Code */}
            {element.type === 'custom_code' && (
                <div className="space-y-0.5">
                    <FieldLabel>Custom HTML / Embed Script</FieldLabel>
                    <PanelTextarea
                        rows={6}
                        value={val('code', '')}
                        onChange={e => update('code', e.target.value)}
                        placeholder="<script>...</script> or <iframe>...</iframe> or <div>...</div>"
                        className="font-mono text-xs"
                    />
                </div>
            )}

            {/* Rich Text */}
            {element.type === 'rich_text' && (
                <div className="space-y-0.5">
                    <FieldLabel>HTML Content</FieldLabel>
                    <PanelTextarea
                        rows={5}
                        value={val('htmlContent') || val('content') || ''}
                        onChange={e => update('htmlContent', e.target.value)}
                        placeholder="<p>Formatted HTML content...</p>"
                        className="font-mono text-xs"
                    />
                </div>
            )}

            {/* Order Bump */}
            {element.type === 'order_bump' && (
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <FieldLabel>Badge Text</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('badgeText', '')}
                            onChange={e => update('badgeText', e.target.value)}
                            placeholder="YES! ADD THIS TO MY ORDER"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Offer Headline</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('title', '')}
                            onChange={e => update('title', e.target.value)}
                            placeholder="ONE TIME OFFER: Add Checklist..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Description</FieldLabel>
                        <PanelTextarea
                            rows={3}
                            value={val('desc', '')}
                            onChange={e => update('desc', e.target.value)}
                            placeholder="Check this box to instantly add..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Price ($)</FieldLabel>
                        <PanelInput
                            type="number"
                            value={val('price', 17)}
                            onChange={e => update('price', Number(e.target.value))}
                            placeholder="17"
                        />
                    </div>
                </div>
            )}

            {/* FAQ Accordion */}
            {element.type === 'faq_accordion' && (
                <div className="space-y-2">
                    <FieldLabel>FAQ Items</FieldLabel>
                    {(element.items || []).map((faq, idx) => (
                        <div key={idx} className="p-2 rounded border border-neutral-200 bg-neutral-50 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-neutral-500">Question #{idx + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => update('items', (element.items || []).filter((_, i) => i !== idx))}
                                    className="text-[10px] text-red-500 hover:underline"
                                >Remove</button>
                            </div>
                            <PanelInput
                                type="text"
                                value={faq.q || ''}
                                onChange={e => {
                                    const next = [...(element.items || [])];
                                    next[idx] = { ...next[idx], q: e.target.value };
                                    update('items', next);
                                }}
                                placeholder="Question..."
                            />
                            <PanelTextarea
                                rows={2}
                                value={faq.a || ''}
                                onChange={e => {
                                    const next = [...(element.items || [])];
                                    next[idx] = { ...next[idx], a: e.target.value };
                                    update('items', next);
                                }}
                                placeholder="Answer..."
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => update('items', [...(element.items || []), { q: 'New Question?', a: 'Answer text goes here.' }])}
                        className="w-full rounded border border-dashed border-brand-400 py-1.5 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 transition"
                    >+ Add FAQ Item</button>
                </div>
            )}

            {/* Testimonial Slider */}
            {element.type === 'testimonial_slider' && (
                <div className="space-y-2">
                    <FieldLabel>Testimonial Cards</FieldLabel>
                    {(element.items || []).map((t, idx) => (
                        <div key={idx} className="p-2 rounded border border-neutral-200 bg-neutral-50 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-neutral-500">Card #{idx + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => update('items', (element.items || []).filter((_, i) => i !== idx))}
                                    className="text-[10px] text-red-500 hover:underline"
                                >Remove</button>
                            </div>
                            <PanelTextarea
                                rows={2}
                                value={t.quote || ''}
                                onChange={e => {
                                    const next = [...(element.items || [])];
                                    next[idx] = { ...next[idx], quote: e.target.value };
                                    update('items', next);
                                }}
                                placeholder="Quote..."
                            />
                            <PanelInput
                                type="text"
                                value={t.author || ''}
                                onChange={e => {
                                    const next = [...(element.items || [])];
                                    next[idx] = { ...next[idx], author: e.target.value };
                                    update('items', next);
                                }}
                                placeholder="Author Name..."
                            />
                            <PanelInput
                                type="text"
                                value={t.role || ''}
                                onChange={e => {
                                    const next = [...(element.items || [])];
                                    next[idx] = { ...next[idx], role: e.target.value };
                                    update('items', next);
                                }}
                                placeholder="Role / Title (e.g. CMO)..."
                            />
                            <PanelInput
                                type="text"
                                value={t.avatar || ''}
                                onChange={e => {
                                    const next = [...(element.items || [])];
                                    next[idx] = { ...next[idx], avatar: e.target.value };
                                    update('items', next);
                                }}
                                placeholder="Avatar Photo URL (https://...)..."
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => update('items', [...(element.items || []), { quote: 'Great product!', author: 'Jane Doe', role: 'Founder' }])}
                        className="w-full rounded border border-dashed border-brand-400 py-1.5 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 transition"
                    >+ Add Testimonial</button>
                </div>
            )}

            {/* Countdown Timer Settings */}
            {element.type === 'timer' && (
                <div className="space-y-2.5">
                    <FieldLabel>Timer Duration</FieldLabel>
                    <div className="grid grid-cols-4 gap-1.5">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-neutral-500">Days</span>
                            <PanelInput
                                type="number" min="0" max="99"
                                value={val('days', 0)}
                                onChange={e => update('days', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-neutral-500">Hours</span>
                            <PanelInput
                                type="number" min="0" max="23"
                                value={val('hours', 2)}
                                onChange={e => update('hours', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-neutral-500">Mins</span>
                            <PanelInput
                                type="number" min="0" max="59"
                                value={val('minutes', 15)}
                                onChange={e => update('minutes', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-neutral-500">Secs</span>
                            <PanelInput
                                type="number" min="0" max="59"
                                value={val('seconds', 0)}
                                onChange={e => update('seconds', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <FieldLabel>When Expired</FieldLabel>
                        <PanelSelect
                            value={val('timerAction', 'show_message')}
                            onChange={e => update('timerAction', e.target.value)}
                        >
                            <option value="show_message">Show Expired Message</option>
                            <option value="hide">Hide Timer Element</option>
                            <option value="redirect">Redirect to URL</option>
                        </PanelSelect>
                    </div>

                    {val('timerAction', 'show_message') === 'redirect' ? (
                        <div className="space-y-0.5">
                            <FieldLabel>Redirect Target URL</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('redirectUrl', '')}
                                onChange={e => update('redirectUrl', e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            <FieldLabel>Expired Message Text</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('expireMessage', 'OFFER EXPIRED!')}
                                onChange={e => update('expireMessage', e.target.value)}
                                placeholder="SPECIAL OFFER HAS EXPIRED!"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* 2-Step Order Form Settings (GHL style) */}
            {element.type === 'two_step_order' && (
                <div className="space-y-2.5 border-t border-neutral-200 pt-2">
                    <div className="p-2 bg-brand-50 border border-brand-200 rounded-md text-[11px] text-brand-800">
                        ⚡ <strong>2-Step Smart Checkout</strong> collects leads on Step 1 to prevent cart abandonment, then completes order & payment on Step 2.
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-neutral-600 uppercase">Step 1 Configuration</p>
                        <div className="space-y-0.5">
                            <FieldLabel>Step 1 Headline</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('step1Title', 'Step 1: Contact & Shipping Info')}
                                onChange={e => update('step1Title', e.target.value)}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Step 1 Subtitle</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('step1Subtitle', '')}
                                onChange={e => update('step1Subtitle', e.target.value)}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Step 1 Button CTA</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('step1BtnText', 'Proceed to Step 2: Payment →')}
                                onChange={e => update('step1BtnText', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1 border-t border-neutral-200 pt-2">
                        <p className="text-[10px] font-bold text-neutral-600 uppercase">Step 2 Configuration</p>
                        <div className="space-y-0.5">
                            <FieldLabel>Step 2 Headline</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('step2Title', 'Step 2: Select Offer & Payment')}
                                onChange={e => update('step2Title', e.target.value)}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Step 2 Subtitle</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('step2Subtitle', '')}
                                onChange={e => update('step2Subtitle', e.target.value)}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Checkout Submit Button</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('step2BtnText', 'Complete Secure Order Now 🔒')}
                                onChange={e => update('step2BtnText', e.target.value)}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Guarantee Badge</FieldLabel>
                            <PanelInput
                                type="text"
                                value={val('guaranteeBadge', '30-Day 100% Risk-Free Guarantee')}
                                onChange={e => update('guaranteeBadge', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1 border-t border-neutral-200 pt-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-neutral-600 uppercase">1-Click Order Bump</p>
                            <Checkbox
                                checked={val('hasOrderBump') !== false}
                                onChange={e => update('hasOrderBump', e.target.checked)}
                                label="Enable Bump"
                            />
                        </div>
                        {val('hasOrderBump') !== false && (
                            <div className="space-y-1.5 pt-1">
                                <div className="space-y-0.5">
                                    <FieldLabel>Bump Headline</FieldLabel>
                                    <PanelInput
                                        type="text"
                                        value={val('bumpTitle', '')}
                                        onChange={e => update('bumpTitle', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <FieldLabel>Bump Description</FieldLabel>
                                    <PanelTextarea
                                        rows={2}
                                        value={val('bumpDesc', '')}
                                        onChange={e => update('bumpDesc', e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-0.5">
                                        <FieldLabel>Price ($)</FieldLabel>
                                        <PanelInput
                                            type="number"
                                            value={val('bumpPrice', 19)}
                                            onChange={e => update('bumpPrice', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-0.5">
                                        <FieldLabel>Badge Text</FieldLabel>
                                        <PanelInput
                                            type="text"
                                            value={val('bumpBadge', '70% OFF SPECIAL')}
                                            onChange={e => update('bumpBadge', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 1-Click Upsell Box Settings */}
            {element.type === 'upsell_box' && (
                <div className="space-y-2 border-t border-neutral-200 pt-2">
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800">
                        ⭐ <strong>1-Click Upsell (OTO)</strong> charges the customer's vaulted payment from checkout with a single click.
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Urgency Banner</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('urgencyText', '⚡ One-Time Offer Exclusive')}
                            onChange={e => update('urgencyText', e.target.value)}
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Headline</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('offerHeadline', '')}
                            onChange={e => update('offerHeadline', e.target.value)}
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Subheadline</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('offerSubheadline', '')}
                            onChange={e => update('offerSubheadline', e.target.value)}
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Product Name</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('productName', 'VIP Accelerator')}
                            onChange={e => update('productName', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <FieldLabel>Special Price ($)</FieldLabel>
                            <PanelInput
                                type="number"
                                value={val('productPrice', 47)}
                                onChange={e => update('productPrice', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Regular Price ($)</FieldLabel>
                            <PanelInput
                                type="number"
                                value={val('regularPrice', 197)}
                                onChange={e => update('regularPrice', Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Accept Button Text</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('acceptBtnText', 'YES! Upgrade My Order Now →')}
                            onChange={e => update('acceptBtnText', e.target.value)}
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Decline Link Text</FieldLabel>
                        <PanelInput
                            type="text"
                            value={val('declineBtnText', 'No thanks, I will skip this offer')}
                            onChange={e => update('declineBtnText', e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Grid Column Settings */}
            {element.type === 'grid_column' && (
                <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-700 pt-2">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] text-amber-800 dark:text-amber-200">
                        📐 <strong>Column #{val('colIdx', 0) + 1}</strong> — Configure clickable link, ribbon badge, and display settings. Use the <em>Style</em> tab for column backgrounds, borders, and paddings.
                    </div>

                    <div className="space-y-1">
                        <FieldLabel>Column Link URL (Clickable Column)</FieldLabel>
                        <PanelInput
                            type="text"
                            placeholder="https://... or #contact"
                            value={val('linkUrl', '')}
                            onChange={e => update('linkUrl', e.target.value)}
                        />
                    </div>

                    {val('linkUrl', '') && (
                        <div className="flex items-center justify-between py-1">
                            <Checkbox
                                checked={!!val('linkTargetBlank')}
                                onChange={e => update('linkTargetBlank', e.target.checked)}
                                label="Open link in new tab"
                            />
                        </div>
                    )}

                    <div className="space-y-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                        <FieldLabel>Column Ribbon / Badge Text (Optional)</FieldLabel>
                        <PanelInput
                            type="text"
                            placeholder="e.g. BEST VALUE, FEATURED"
                            value={val('badgeText', '')}
                            onChange={e => {
                                update('badgeText', e.target.value);
                                if (e.target.value && !val('hasBadge')) update('hasBadge', true);
                            }}
                        />
                    </div>

                    {val('badgeText', '') && (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <FieldLabel>Badge Background</FieldLabel>
                                <input
                                    type="color"
                                    value={val('badgeBgColor', '#4f46e5')}
                                    onChange={e => update('badgeBgColor', e.target.value)}
                                    className="w-full h-8 rounded border border-neutral-200 cursor-pointer p-0.5"
                                />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>Badge Text Color</FieldLabel>
                                <input
                                    type="color"
                                    value={val('badgeTextColor', '#ffffff')}
                                    onChange={e => update('badgeTextColor', e.target.value)}
                                    className="w-full h-8 rounded border border-neutral-200 cursor-pointer p-0.5"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Divider Line Settings (Horizontal & Vertical) */}
            {element.type === 'divider' && (
                <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-700 pt-2">
                    <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] text-neutral-700 dark:text-neutral-300">
                        📏 <strong>Divider Line</strong> — Choose horizontal or vertical orientation, thickness, style, length, and alignment.
                    </div>

                    <div className="space-y-1">
                        <FieldLabel>Orientation</FieldLabel>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={() => update('dividerType', 'horizontal')}
                                className={`py-1.5 px-2 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                    val('dividerType', 'horizontal') === 'horizontal'
                                        ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-brand-300 shadow-xs'
                                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                                }`}
                            >
                                <span>— Horizontal</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => update('dividerType', 'vertical')}
                                className={`py-1.5 px-2 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                    val('dividerType', 'horizontal') === 'vertical'
                                        ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-brand-300 shadow-xs'
                                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                                }`}
                            >
                                <span>| Vertical</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <FieldLabel>Line Style</FieldLabel>
                            <PanelSelect
                                value={val('dividerStyle', 'solid')}
                                onChange={e => update('dividerStyle', e.target.value)}
                            >
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                                <option value="double">Double</option>
                            </PanelSelect>
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Thickness ({val('dividerThickness', 1)}px)</FieldLabel>
                            <PanelInput
                                type="number"
                                min={1}
                                max={20}
                                value={val('dividerThickness', 1)}
                                onChange={e => update('dividerThickness', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    {val('dividerType', 'horizontal') === 'vertical' ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <FieldLabel>Height ({val('dividerHeight', 60)}px)</FieldLabel>
                                <PanelInput
                                    type="number"
                                    min={10}
                                    max={1000}
                                    value={val('dividerHeight', 60)}
                                    onChange={e => update('dividerHeight', Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>Alignment</FieldLabel>
                                <PanelSelect
                                    value={val('alignment', 'center')}
                                    onChange={e => update('alignment', e.target.value)}
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                </PanelSelect>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <FieldLabel>Width ({val('dividerWidth', 100)}%)</FieldLabel>
                                <PanelInput
                                    type="number"
                                    min={5}
                                    max={100}
                                    value={val('dividerWidth', 100)}
                                    onChange={e => update('dividerWidth', Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>Alignment</FieldLabel>
                                <PanelSelect
                                    value={val('alignment', 'center')}
                                    onChange={e => update('alignment', e.target.value)}
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                </PanelSelect>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <FieldLabel>Line Color</FieldLabel>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={val('dividerColor', '#d1d5db')}
                                onChange={e => update('dividerColor', e.target.value)}
                                className="w-9 h-8 rounded border border-neutral-200 cursor-pointer p-0.5"
                            />
                            <PanelInput
                                type="text"
                                value={val('dividerColor', '#d1d5db')}
                                onChange={e => update('dividerColor', e.target.value)}
                                placeholder="#d1d5db"
                                className="font-mono text-xs flex-1"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
