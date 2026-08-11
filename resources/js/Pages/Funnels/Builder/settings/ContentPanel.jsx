import React from 'react';
import { PanelInput, PanelTextarea, PanelSelect, FieldLabel } from '../BuilderUI';

const INPUT_TYPES = ['headline', 'subheadline', 'paragraph', 'quote', 'submit_button',
    'section', 'input_email', 'input_name', 'input_phone', 'checkbox',
    'audio', 'icon_box', 'image', 'video'];

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
                <div className="space-y-0.5">
                    <FieldLabel>Track Title</FieldLabel>
                    <PanelInput
                        type="text"
                        value={element.title || ''}
                        onChange={e => update('title', e.target.value)}
                        placeholder="Audio Track Title..."
                    />
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
                </div>
            )}
        </div>
    );
}
