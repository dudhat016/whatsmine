import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import Toggle from '@/Components/ui/Toggle';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';

const inputCls = 'w-full px-2.5 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-soft bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500';
const labelCls = 'block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1';

function Row({ label, children }) {
    return (
        <div className="space-y-1">
            <label className={labelCls}>{label}</label>
            {children}
        </div>
    );
}

function SettingToggle({ checked, onChange, label, hint }) {
    return (
        <div className="space-y-0.5">
            <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">{label}</span>
                <Toggle checked={checked} onChange={onChange} />
            </div>
            {hint && <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{hint}</p>}
        </div>
    );
}

function TagInput({ tags, onChange }) {
    const [val, setVal] = React.useState('');
    const add = () => {
        if (!val.trim()) return;
        if (!tags.includes(val.trim())) onChange([...tags, val.trim()]);
        setVal('');
    };
    const remove = (t) => onChange(tags.filter(x => x !== t));
    return (
        <div>
            <div className="flex gap-1 mb-2">
                <Input
                    size="sm"
                    type="text"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
                    placeholder="Add tag & press Enter"
                    wrapperClassName="flex-1"
                />
                <button type="button" onClick={add} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-xs rounded-lg hover:bg-neutral-200 transition">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-xs rounded-full border border-brand-200 dark:border-brand-800">
                        {t}
                        <button type="button" onClick={() => remove(t)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function FormSettings({ formSettings, onChange, formName, onNameChange, formType, onTypeChange }) {
    const set = (key, val) => onChange({ ...formSettings, [key]: val });

    return (
        <aside className="w-[280px] shrink-0 flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Form Settings</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5">Click a field to configure it</p>
            </div>

            <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">

                {/* Identity */}
                <div className="space-y-3">
                    <span className={labelCls}>📋 Form Identity</span>
                    <Row label="Internal Name *">
                        <Input size="sm" type="text" value={formName} onChange={e => onNameChange(e.target.value)} placeholder="e.g. Website Contact Form" />
                    </Row>
                    <Row label="Embed Type">
                        <Select size="sm" value={formType} onChange={e => onTypeChange(e.target.value)}>
                            <option value="embedded">Embedded (iFrame / HTML)</option>
                            <option value="popup">Popup / Modal</option>
                            <option value="api">API Only</option>
                        </Select>
                    </Row>
                </div>

                <hr className="border-neutral-100 dark:border-neutral-800" />

                {/* Appearance */}
                <div className="space-y-3">
                    <span className={labelCls}>🎨 Appearance</span>
                    <Row label="Theme Color">
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={formSettings.theme_color || '#25D366'}
                                onChange={e => set('theme_color', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input
                                size="sm"
                                type="text"
                                value={formSettings.theme_color || '#25D366'}
                                onChange={e => set('theme_color', e.target.value)}
                                className="font-mono"
                                wrapperClassName="flex-1"
                            />
                        </div>
                    </Row>
                    <Row label="Button Text">
                        <Input size="sm" type="text" value={formSettings.button_text || ''} onChange={e => set('button_text', e.target.value)} placeholder="Subscribe Now" />
                    </Row>
                </div>

                <hr className="border-neutral-100 dark:border-neutral-800" />

                {/* After Submit */}
                <div className="space-y-3">
                    <span className={labelCls}>✅ After Submit</span>
                    <Row label="Success Message">
                        <Input size="sm" type="text" value={formSettings.success_message || ''} onChange={e => set('success_message', e.target.value)} placeholder="Thank you for subscribing!" />
                    </Row>
                    <Row label="Redirect URL (optional)">
                        <Input size="sm" type="url" value={formSettings.redirect_url || ''} onChange={e => set('redirect_url', e.target.value)} placeholder="https://example.com/thank-you" />
                    </Row>
                </div>

                <hr className="border-neutral-100 dark:border-neutral-800" />

                {/* Spacing & Layout */}
                <div className="space-y-3">
                    <span className={labelCls}>📐 Form Spacing & Layout</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-[10px] text-neutral-400 block mb-0.5">Card Padding (px)</span>
                            <Input
                                size="sm"
                                type="number"
                                min="0"
                                max="100"
                                value={formSettings.card_padding !== undefined ? formSettings.card_padding : 24}
                                onChange={e => set('card_padding', e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="24"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-neutral-400 block mb-0.5">Field Gap (px)</span>
                            <Input
                                size="sm"
                                type="number"
                                min="0"
                                max="80"
                                value={formSettings.field_gap !== undefined ? formSettings.field_gap : 12}
                                onChange={e => set('field_gap', e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="12"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-neutral-400 block mb-0.5">Max Width (px)</span>
                            <Input
                                size="sm"
                                type="number"
                                min="280"
                                max="1200"
                                value={formSettings.card_max_width !== undefined ? formSettings.card_max_width : 576}
                                onChange={e => set('card_max_width', e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="576"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-neutral-400 block mb-0.5">Corner Radius (px)</span>
                            <Input
                                size="sm"
                                type="number"
                                min="0"
                                max="48"
                                value={formSettings.card_border_radius !== undefined ? formSettings.card_border_radius : 16}
                                onChange={e => set('card_border_radius', e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="16"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-neutral-100 dark:border-neutral-800" />

                {/* Auto Tags */}
                <div className="space-y-3">
                    <span className={labelCls}>🏷 Auto-Tags on Submit</span>
                    <TagInput
                        tags={formSettings.auto_tags || []}
                        onChange={v => set('auto_tags', v)}
                    />
                </div>
            </div>
        </aside>
    );
}
