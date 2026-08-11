import React from 'react';
import { PanelInput, PanelTextarea, PanelSelect, FieldLabel } from '../BuilderUI';
import ColorPickerInput from '../ColorPicker';

const INPUT_TYPES = ['headline', 'subheadline', 'paragraph', 'bullets', 'quote', 'submit_button',
    'section', 'input_email', 'input_name', 'input_phone', 'checkbox',
    'audio', 'icon_box', 'image', 'video', 'progress_bar', 'social', 'star_rating', 'custom_code',
    'rich_text', 'order_bump', 'faq_accordion', 'testimonial_slider', 'timer'];

/**
 * ContentPanel — type-specific content/property inputs.
 */
export default function ContentPanel({ element, val, handleUpdateElementSetting }) {
    if (!INPUT_TYPES.includes(element.type)) return null;

    const update = (key, value) => handleUpdateElementSetting(element.id, key, value);

    return (
        <div className="space-y-2.5 pt-1">
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Content</p>

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
                    <FieldLabel>Text Content</FieldLabel>
                    <PanelInput
                        type="text"
                        value={element.content || ''}
                        onChange={e => update('content', e.target.value)}
                        placeholder="Enter headline text..."
                    />
                </div>
            )}

            {/* Paragraph */}
            {element.type === 'paragraph' && (
                <div className="space-y-0.5">
                    <FieldLabel>Paragraph Text</FieldLabel>
                    <PanelTextarea
                        rows={4}
                        value={element.content || ''}
                        onChange={e => update('content', e.target.value)}
                        placeholder="Enter paragraph text..."
                    />
                </div>
            )}

            {/* Button text */}
            {element.type === 'submit_button' && (
                <div className="space-y-0.5">
                    <FieldLabel>Button Label</FieldLabel>
                    <PanelInput
                        type="text"
                        value={element.text || ''}
                        onChange={e => update('text', e.target.value)}
                        placeholder="Button CTA text..."
                    />
                </div>
            )}

            {/* Input placeholder */}
            {['input_email', 'input_name', 'input_phone'].includes(element.type) && (
                <div className="space-y-0.5">
                    <FieldLabel>Placeholder Text</FieldLabel>
                    <PanelInput
                        type="text"
                        value={element.placeholder || ''}
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
                        value={element.text || ''}
                        onChange={e => update('text', e.target.value)}
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
                            value={element.quote || element.content || ''}
                            onChange={e => update('quote', e.target.value)}
                            placeholder="Quote text..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Author</FieldLabel>
                        <PanelInput
                            type="text"
                            value={element.author || ''}
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
                            value={element.url || ''}
                            onChange={e => update('url', e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Alt Text</FieldLabel>
                        <PanelInput
                            type="text"
                            value={element.alt || ''}
                            onChange={e => update('alt', e.target.value)}
                            placeholder="Describe the image..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Link URL (optional click target)</FieldLabel>
                        <PanelInput
                            type="text"
                            value={element.linkUrl || ''}
                            onChange={e => update('linkUrl', e.target.value)}
                            placeholder="https://..."
                        />
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
                <div className="space-y-0.5">
                    <FieldLabel>Video Embed URL</FieldLabel>
                    <PanelInput
                        type="text"
                        value={element.videoUrl || ''}
                        onChange={e => update('videoUrl', e.target.value)}
                        placeholder="YouTube / Vimeo embed URL..."
                    />
                </div>
            )}

            {/* Audio */}
            {element.type === 'audio' && (
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <FieldLabel>Track Title</FieldLabel>
                        <PanelInput
                            type="text"
                            value={element.title || ''}
                            onChange={e => update('title', e.target.value)}
                            placeholder="Audio Track Title..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Audio File URL (.mp3 / .wav)</FieldLabel>
                        <PanelInput
                            type="text"
                            value={element.url || ''}
                            onChange={e => update('url', e.target.value)}
                            placeholder="https://your-domain.com/audio.mp3"
                        />
                    </div>
                </div>
            )}

            {/* Icon Box */}
            {element.type === 'icon_box' && (
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <FieldLabel>Card Title</FieldLabel>
                        <PanelInput
                            type="text"
                            value={element.title || ''}
                            onChange={e => update('title', e.target.value)}
                            placeholder="Feature Card Title..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Card Description</FieldLabel>
                        <PanelTextarea
                            rows={2}
                            value={element.desc || ''}
                            onChange={e => update('desc', e.target.value)}
                            placeholder="Feature Card Description..."
                        />
                    </div>
                    <div className="pt-2 border-t border-neutral-200 space-y-2">
                        <p className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Sub-Component Styling</p>
                        <div className="space-y-1">
                            <FieldLabel>Card Background</FieldLabel>
                            <ColorPickerInput value={val('boxBgColor', '#ffffff')} onChange={v => update('boxBgColor', v)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Card Border Color</FieldLabel>
                            <ColorPickerInput value={val('boxBorderColor', '#f3f4f6')} onChange={v => update('boxBorderColor', v)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Title Text Color</FieldLabel>
                            <ColorPickerInput value={val('titleColor', '#111827')} onChange={v => update('titleColor', v)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Description Color</FieldLabel>
                            <ColorPickerInput value={val('descColor', '#6b7280')} onChange={v => update('descColor', v)} />
                        </div>
                    </div>
                </div>
            )}
            {/* Bullets — Bug 10 Fix: add full editing UI for bullet items */}
            {element.type === 'bullets' && (
                <div className="space-y-2">
                    <FieldLabel>Bullet Items</FieldLabel>
                    {(element.items || []).map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                            <PanelInput
                                type="text"
                                value={bullet}
                                onChange={e => {
                                    const next = [...(element.items || [])];
                                    next[idx] = e.target.value;
                                    update('items', next);
                                }}
                                placeholder={`Bullet ${idx + 1}...`}
                            />
                            <button
                                type="button"
                                onClick={() => update('items', (element.items || []).filter((_, i) => i !== idx))}
                                className="shrink-0 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-500 hover:bg-red-100 transition"
                            >✕</button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => update('items', [...(element.items || []), 'New bullet point'])}
                        className="w-full rounded border border-dashed border-brand-400 py-1.5 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 transition"
                    >+ Add Bullet</button>
                </div>
            )}

            {/* Progress Bar */}
            {element.type === 'progress_bar' && (
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <FieldLabel>Label (optional)</FieldLabel>
                        <PanelInput
                            type="text"
                            value={element.label || ''}
                            onChange={e => update('label', e.target.value)}
                            placeholder="e.g. Seats Remaining..."
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-neutral-600">
                            <span>Fill Percentage</span>
                            <span className="font-mono text-brand-600 font-bold">{element.percent || 80}%</span>
                        </div>
                        <input
                            type="range" min="1" max="100"
                            value={element.percent || 80}
                            onChange={e => update('percent', Number(e.target.value))}
                            className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Bar Color</FieldLabel>
                        <input
                            type="color"
                            value={element.barColor || '#467235'}
                            onChange={e => update('barColor', e.target.value)}
                            className="h-8 w-full rounded cursor-pointer border border-neutral-200"
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
                        value={element.shareUrl || ''}
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
                            <span className="font-mono text-brand-600 font-bold">{element.stars || 5} Stars</span>
                        </div>
                        <input
                            type="range" min="1" max="5"
                            value={element.stars || 5}
                            onChange={e => update('stars', Number(e.target.value))}
                            className="w-full accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Rating Subtext</FieldLabel>
                        <PanelInput
                            type="text"
                            value={element.ratingText || ''}
                            onChange={e => update('ratingText', e.target.value)}
                            placeholder="5.0 out of 5 stars (1,200+ reviews)"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Star Color</FieldLabel>
                        <input
                            type="color"
                            value={element.starColor || '#f59e0b'}
                            onChange={e => update('starColor', e.target.value)}
                            className="h-8 w-full rounded cursor-pointer border border-neutral-200"
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
                        value={element.code || ''}
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
                        value={element.htmlContent || element.content || ''}
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
                            value={element.badgeText || ''}
                            onChange={e => update('badgeText', e.target.value)}
                            placeholder="YES! ADD THIS TO MY ORDER"
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Offer Headline</FieldLabel>
                        <PanelInput
                            type="text"
                            value={element.title || ''}
                            onChange={e => update('title', e.target.value)}
                            placeholder="ONE TIME OFFER: Add Checklist..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Description</FieldLabel>
                        <PanelTextarea
                            rows={3}
                            value={element.desc || ''}
                            onChange={e => update('desc', e.target.value)}
                            placeholder="Check this box to instantly add..."
                        />
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Price ($)</FieldLabel>
                        <PanelInput
                            type="number"
                            value={element.price || 17}
                            onChange={e => update('price', Number(e.target.value))}
                            placeholder="17"
                        />
                    </div>
                    <div className="pt-2 border-t border-neutral-200 space-y-2">
                        <p className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Sub-Component Styling</p>
                        <div className="space-y-1">
                            <FieldLabel>Box Background</FieldLabel>
                            <ColorPickerInput value={val('boxBgColor', '#fef2f2')} onChange={v => update('boxBgColor', v)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Box Border Color</FieldLabel>
                            <ColorPickerInput value={val('boxBorderColor', '#f87171')} onChange={v => update('boxBorderColor', v)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Badge Background</FieldLabel>
                            <ColorPickerInput value={val('badgeBgColor', '#dc2626')} onChange={v => update('badgeBgColor', v)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Badge Text Color</FieldLabel>
                            <ColorPickerInput value={val('badgeTextColor', '#ffffff')} onChange={v => update('badgeTextColor', v)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Offer Title Color</FieldLabel>
                            <ColorPickerInput value={val('titleColor', '#111827')} onChange={v => update('titleColor', v)} />
                        </div>
                        <div className="space-y-1">
                            <FieldLabel>Price Tag Color</FieldLabel>
                            <ColorPickerInput value={val('priceColor', '#991b1b')} onChange={v => update('priceColor', v)} />
                        </div>
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

                    <div className="pt-2 border-t border-neutral-200 space-y-2.5">
                        <p className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Sub-Component Styling</p>

                        {/* Question Header Controls */}
                        <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                            <span className="text-[10px] font-bold uppercase text-neutral-500">❓ Question Header</span>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <FieldLabel>Text Color</FieldLabel>
                                    <ColorPickerInput value={val('qColor', '#111827')} onChange={v => update('qColor', v)} />
                                </div>
                                <div>
                                    <FieldLabel>Header BG</FieldLabel>
                                    <ColorPickerInput value={val('qBgColor', '#ffffff')} onChange={v => update('qBgColor', v)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <FieldLabel>Font Size (px)</FieldLabel>
                                    <PanelInput type="number" value={val('qFontSize', 14)} onChange={e => update('qFontSize', Number(e.target.value))} />
                                </div>
                                <div>
                                    <FieldLabel>Font Weight</FieldLabel>
                                    <PanelSelect value={val('qFontWeight', '700')} onChange={e => update('qFontWeight', e.target.value)}>
                                        <option value="400">400 (Normal)</option>
                                        <option value="600">600 (Semi-Bold)</option>
                                        <option value="700">700 (Bold)</option>
                                        <option value="800">800 (Extra Bold)</option>
                                    </PanelSelect>
                                </div>
                            </div>
                        </div>

                        {/* Answer Body Controls */}
                        <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                            <span className="text-[10px] font-bold uppercase text-neutral-500">💬 Answer Body</span>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <FieldLabel>Text Color</FieldLabel>
                                    <ColorPickerInput value={val('aColor', '#4b5563')} onChange={v => update('aColor', v)} />
                                </div>
                                <div>
                                    <FieldLabel>Body BG</FieldLabel>
                                    <ColorPickerInput value={val('aBgColor', '#ffffff')} onChange={v => update('aBgColor', v)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <FieldLabel>Font Size (px)</FieldLabel>
                                    <PanelInput type="number" value={val('aFontSize', 13)} onChange={e => update('aFontSize', Number(e.target.value))} />
                                </div>
                                <div>
                                    <FieldLabel>Line Height</FieldLabel>
                                    <PanelInput type="number" step="0.1" value={val('aLineHeight', 1.6)} onChange={e => update('aLineHeight', Number(e.target.value))} />
                                </div>
                            </div>
                        </div>

                        {/* Card & Icon Controls */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <FieldLabel>Toggle Icon Color</FieldLabel>
                                <ColorPickerInput value={val('iconColor', '#9ca3af')} onChange={v => update('iconColor', v)} />
                            </div>
                            <div>
                                <FieldLabel>Card Border Color</FieldLabel>
                                <ColorPickerInput value={val('itemBorderColor', '#e5e7eb')} onChange={v => update('itemBorderColor', v)} />
                            </div>
                        </div>
                    </div>
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

                    <div className="pt-2 border-t border-neutral-200 space-y-2.5">
                        <p className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Sub-Component Styling</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <FieldLabel>Quote Text Color</FieldLabel>
                                <ColorPickerInput value={val('quoteColor', '#1f2937')} onChange={v => update('quoteColor', v)} />
                            </div>
                            <div>
                                <FieldLabel>Quote Size (px)</FieldLabel>
                                <PanelInput type="number" value={val('quoteFontSize', 14)} onChange={e => update('quoteFontSize', Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <FieldLabel>Author Text Color</FieldLabel>
                                <ColorPickerInput value={val('authorColor', '#111827')} onChange={v => update('authorColor', v)} />
                            </div>
                            <div>
                                <FieldLabel>Author Size (px)</FieldLabel>
                                <PanelInput type="number" value={val('authorFontSize', 13)} onChange={e => update('authorFontSize', Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <FieldLabel>Star Rating Color</FieldLabel>
                                <ColorPickerInput value={val('starColor', '#f59e0b')} onChange={v => update('starColor', v)} />
                            </div>
                            <div>
                                <FieldLabel>Card BG Color</FieldLabel>
                                <ColorPickerInput value={val('cardBgColor', '#ffffff')} onChange={v => update('cardBgColor', v)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <FieldLabel>Card Border Color</FieldLabel>
                                <ColorPickerInput value={val('cardBorderColor', '#e5e7eb')} onChange={v => update('cardBorderColor', v)} />
                            </div>
                            <div>
                                <FieldLabel>Nav Arrow BG</FieldLabel>
                                <ColorPickerInput value={val('arrowBgColor', '#ffffff')} onChange={v => update('arrowBgColor', v)} />
                            </div>
                        </div>
                    </div>
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
                                value={element.days !== undefined ? element.days : 0}
                                onChange={e => update('days', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-neutral-500">Hours</span>
                            <PanelInput
                                type="number" min="0" max="23"
                                value={element.hours !== undefined ? element.hours : 2}
                                onChange={e => update('hours', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-neutral-500">Mins</span>
                            <PanelInput
                                type="number" min="0" max="59"
                                value={element.minutes !== undefined ? element.minutes : 15}
                                onChange={e => update('minutes', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-neutral-500">Secs</span>
                            <PanelInput
                                type="number" min="0" max="59"
                                value={element.seconds !== undefined ? element.seconds : 0}
                                onChange={e => update('seconds', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <FieldLabel>Timer Visual Style</FieldLabel>
                        <PanelSelect
                            value={val('timerTheme', 'red_urgent')}
                            onChange={e => update('timerTheme', e.target.value)}
                        >
                            <option value="red_urgent">🚨 Urgent Red (High Conversion)</option>
                            <option value="brand">✨ Brand Theme (Follows System)</option>
                            <option value="dark">🖤 Sleek Dark Mode</option>
                            <option value="light">🤍 Clean Light Mode</option>
                            <option value="minimal">Minimal Inline Text</option>
                        </PanelSelect>
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

                    {element.timerAction === 'redirect' ? (
                        <div className="space-y-0.5">
                            <FieldLabel>Redirect Target URL</FieldLabel>
                            <PanelInput
                                type="text"
                                value={element.redirectUrl || ''}
                                onChange={e => update('redirectUrl', e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            <FieldLabel>Expired Message Text</FieldLabel>
                            <PanelInput
                                type="text"
                                value={element.expireMessage || 'OFFER EXPIRED!'}
                                onChange={e => update('expireMessage', e.target.value)}
                                placeholder="SPECIAL OFFER HAS EXPIRED!"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
