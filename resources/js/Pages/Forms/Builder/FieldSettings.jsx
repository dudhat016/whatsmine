import React from 'react';
import { Trash2, Settings2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Input, Toggle, Select } from '@/Components/ui';
import MiniRichEditor from './components/MiniRichEditor';

const OBJECT_TARGETS = [
    { value: 'contact', label: 'Contact (Profile)' },
    { value: 'opportunity', label: 'Opportunity (Pipeline deal)' },
    { value: 'company', label: 'Company / Business' },
];

const FIELD_GROUPS = [
    { value: 'contact', label: 'Contact (Basic Info)' },
    { value: 'general_info', label: 'General Info' },
    { value: 'additional_info', label: 'Additional Info' },
    { value: 'billing_info', label: 'Billing Info' },
];

const inputCls = 'w-full px-2.5 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-soft bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500';
const labelCls = 'block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1';

function Row({ label, htmlFor, children }) {
    const generatedId = htmlFor || (typeof label === 'string' ? `setting_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : undefined);
    
    let renderedChildren = children;
    if (React.isValidElement(children) && ['input', 'select', 'textarea'].includes(children.type) && !children.props.id && generatedId) {
        renderedChildren = React.cloneElement(children, { id: generatedId });
    }

    return (
        <div className="space-y-1">
            <label htmlFor={generatedId} className={`${labelCls} ${generatedId ? 'cursor-pointer' : ''}`}>{label}</label>
            {renderedChildren}
        </div>
    );
}

export default function FieldSettings({ field, onChange, onDelete, availableFolders = [], ecommerceProducts = [] }) {
    const update = (key, val) => onChange({ ...field, [key]: val });
    const updateOption = (idx, val) => {
        const opts = [...(field.options || [])];
        opts[idx] = val;
        update('options', opts);
    };
    const addOption = () => update('options', [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]);
    const removeOption = (idx) => {
        const opts = [...(field.options || [])];
        opts.splice(idx, 1);
        update('options', opts);
    };

    const folderList = availableFolders.length > 0
        ? availableFolders.map(f => ({ value: f.key || f.id, label: f.name }))
        : FIELD_GROUPS;

    const isStandard = ['email', 'first_name', 'last_name', 'phone_e164'].includes(field.type);
    const isElement = ['heading', 'divider', 'paragraph', 'image', 'button'].includes(field.type);
    const isCompliance = ['gdpr', 'double_optin', 'terms', 'captcha'].includes(field.type);
    const hasOptions = ['select', 'radio', 'multi_checkbox'].includes(field.type);
    const hasPlaceholder = !['checkbox', 'multi_checkbox', 'radio', 'file', 'rating', 'scale', 'signature', 'image', 'terms', 'captcha', 'hidden', 'heading', 'divider', 'paragraph', 'gdpr', 'double_optin', 'button'].includes(field.type);

    return (
        <aside className="w-[280px] shrink-0 flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Field Settings</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5 capitalize">{field.type.replace('_', ' ')} field</p>
            </div>

            <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
                {/* Content fields for text elements */}
                {isElement && !['image', 'button'].includes(field.type) && (
                    <Row label="Content">
                        <MiniRichEditor
                            value={field.content || ''}
                            onChange={val => update('content', val)}
                            placeholder={field.type === 'heading' ? 'Section title...' : 'Paragraph text...'}
                            minHeight="80px"
                        />
                    </Row>
                )}

                {/* Button Settings */}
                {field.type === 'button' && (
                    <div className="space-y-3">
                        <Row label="Button Text">
                            <Input
                                size="sm"
                                type="text"
                                value={field.buttonText || ''}
                                onChange={e => update('buttonText', e.target.value)}
                                placeholder="Submit"
                            />
                        </Row>
                        <Row label="Background Color">
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={field.backgroundColor || '#16a34a'}
                                    onChange={e => update('backgroundColor', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                />
                                <Input
                                    size="sm"
                                    type="text"
                                    value={field.backgroundColor || '#16a34a'}
                                    onChange={e => update('backgroundColor', e.target.value)}
                                    className="font-mono"
                                    wrapperClassName="flex-1"
                                />
                            </div>
                        </Row>
                        <Row label="Text Color">
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={field.textColor || '#ffffff'}
                                    onChange={e => update('textColor', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                />
                                <Input
                                    size="sm"
                                    type="text"
                                    value={field.textColor || '#ffffff'}
                                    onChange={e => update('textColor', e.target.value)}
                                    className="font-mono"
                                    wrapperClassName="flex-1"
                                />
                            </div>
                        </Row>
                        <Row label="Border Radius (px)">
                            <Input
                                size="sm"
                                type="number"
                                min={0}
                                max={50}
                                value={field.borderRadius ?? 12}
                                onChange={e => update('borderRadius', parseInt(e.target.value) || 0)}
                            />
                        </Row>
                        <Row label="Font Size (px)">
                            <Input
                                size="sm"
                                type="number"
                                min={10}
                                max={24}
                                value={field.fontSize ?? 14}
                                onChange={e => update('fontSize', parseInt(e.target.value) || 14)}
                            />
                        </Row>
                        <Row label="Alignment">
                            <div className="flex rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                {['left', 'center', 'right'].map((align) => {
                                    const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                                    return (
                                        <button
                                            key={align}
                                            type="button"
                                            onClick={() => update('align', align)}
                                            className={`flex-1 py-1.5 flex items-center justify-center text-xs font-semibold ${
                                                (field.align || 'center') === align
                                                    ? 'bg-brand-500 text-white'
                                                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                        </button>
                                    );
                                })}
                            </div>
                        </Row>
                    </div>
                )}

                {/* Image Settings */}
                {field.type === 'image' && (
                    <>
                        <Row label="Image URL">
                            <Input
                                size="sm"
                                type="url"
                                value={field.imageUrl || ''}
                                onChange={e => update('imageUrl', e.target.value)}
                                placeholder="https://example.com/banner.jpg"
                            />
                        </Row>
                        <Row label="Alt Text">
                            <Input
                                size="sm"
                                type="text"
                                value={field.imageAlt || ''}
                                onChange={e => update('imageAlt', e.target.value)}
                                placeholder="e.g. Company Logo or Header Banner"
                            />
                        </Row>
                    </>
                )}

                {/* 2-Step Order Form Settings */}
                {field.type === 'order_2step' && (
                    <div className="space-y-3.5 pt-1">
                        <div className="p-2.5 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-lg text-xs text-brand-700 dark:text-brand-300">
                            <strong>GHL 2-Step Order Form</strong>: Step 1 captures lead contact info; Step 2 presents product selection, bump offers, and checkout.
                        </div>

                        {ecommerceProducts && ecommerceProducts.length > 0 && (
                            <Row label="Select Main Product from Catalog">
                                <Select
                                    size="sm"
                                    value={field.productId || ''}
                                    onChange={e => {
                                        const pId = parseInt(e.target.value) || null;
                                        const selected = ecommerceProducts.find(p => p.id === pId);
                                        if (selected) {
                                            const defaultPrice = selected.price ? String(selected.price) : '0.00';
                                            const hasTiers = Array.isArray(selected.prices) && selected.prices.length > 0;
                                            const tier1 = hasTiers ? selected.prices[0] : null;

                                            onChange({
                                                ...field,
                                                productId: selected.id,
                                                productTitle: tier1?.name || selected.name,
                                                productSubtitle: selected.description ? selected.description.slice(0, 80) : 'Instant digital access & updates',
                                                productPrice: tier1?.price ? String(tier1.price) : defaultPrice,
                                                imageUrl: selected.image_url || '',
                                                prices: selected.prices || [],
                                            });
                                        } else {
                                            onChange({ ...field, productId: null, prices: [] });
                                        }
                                    }}
                                >
                                    <option value="">-- Choose from Catalog --</option>
                                    {ecommerceProducts.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (${parseFloat(p.price || 0).toFixed(2)}) {p.prices?.length > 1 ? `• ${p.prices.length} Tiers` : ''}
                                        </option>
                                    ))}
                                </Select>
                            </Row>
                        )}

                        <Row label="Step 1 Header Title">
                            <Input
                                size="sm"
                                type="text"
                                value={field.step1Title || '1. Contact Info'}
                                onChange={e => update('step1Title', e.target.value)}
                                placeholder="1. Contact Info"
                            />
                        </Row>
                        <Row label="Step 2 Header Title">
                            <Input
                                size="sm"
                                type="text"
                                value={field.step2Title || '2. Products & Pay'}
                                onChange={e => update('step2Title', e.target.value)}
                                placeholder="2. Products & Pay"
                            />
                        </Row>
                        <Row label="Step 1 Button Label">
                            <Input
                                size="sm"
                                type="text"
                                value={field.step1ButtonText || 'Go to Step 2 →'}
                                onChange={e => update('step1ButtonText', e.target.value)}
                                placeholder="Go to Step 2 →"
                            />
                        </Row>
                        <Row label="Step 2 Submit Button Label">
                            <Input
                                size="sm"
                                type="text"
                                value={field.step2ButtonText || 'Complete Order 🔒'}
                                onChange={e => update('step2ButtonText', e.target.value)}
                                placeholder="Complete Order 🔒"
                            />
                        </Row>

                        {/* Primary Product Configuration */}
                        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-2.5">
                            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                                Main Product Details
                            </label>
                            <Row label="Product Name">
                                <Input
                                    size="sm"
                                    type="text"
                                    value={field.productTitle || 'Standard Access Plan'}
                                    onChange={e => update('productTitle', e.target.value)}
                                    placeholder="Standard Access Plan"
                                />
                            </Row>
                            <Row label="Product Subtitle">
                                <Input
                                    size="sm"
                                    type="text"
                                    value={field.productSubtitle || 'Instant digital access & updates'}
                                    onChange={e => update('productSubtitle', e.target.value)}
                                    placeholder="Instant digital access & updates"
                                />
                            </Row>
                            <Row label="Product Price ($)">
                                <Input
                                    size="sm"
                                    type="number"
                                    step="0.01"
                                    value={field.productPrice || '49.00'}
                                    onChange={e => update('productPrice', e.target.value)}
                                    placeholder="49.00"
                                />
                            </Row>
                        </div>

                        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">1-Click Order Bump</label>
                                <Toggle
                                    checked={field.orderBumpEnabled !== false}
                                    onChange={val => update('orderBumpEnabled', val)}
                                    size="sm"
                                />
                            </div>

                            {field.orderBumpEnabled !== false && (
                                <div className="space-y-2 pl-2 border-l-2 border-amber-400">
                                    {ecommerceProducts && ecommerceProducts.length > 0 && (
                                        <Row label="Select Bump Product from Catalog">
                                            <Select
                                                size="sm"
                                                value={field.orderBumpProductId || ''}
                                                onChange={e => {
                                                    const pId = parseInt(e.target.value) || null;
                                                    const selected = ecommerceProducts.find(p => p.id === pId);
                                                    if (selected) {
                                                        onChange({
                                                            ...field,
                                                            orderBumpProductId: selected.id,
                                                            orderBumpTitle: `Yes! Add ${selected.name}`,
                                                            orderBumpDescription: selected.description ? selected.description.slice(0, 90) : 'Get lifetime access to the quickstart toolkit & bonus resources.',
                                                            orderBumpPrice: String(selected.price || '19.00'),
                                                        });
                                                    } else {
                                                        onChange({ ...field, orderBumpProductId: null });
                                                    }
                                                }}
                                            >
                                                <option value="">-- Choose from Catalog --</option>
                                                {ecommerceProducts.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} (${parseFloat(p.price || 0).toFixed(2)})
                                                    </option>
                                                ))}
                                            </Select>
                                        </Row>
                                    )}

                                    <Row label="Bump Offer Headline">
                                        <Input
                                            size="sm"
                                            type="text"
                                            value={field.orderBumpTitle || 'Yes! Add the VIP Bonus Pack'}
                                            onChange={e => update('orderBumpTitle', e.target.value)}
                                            placeholder="Yes! Add the VIP Bonus Pack"
                                        />
                                    </Row>
                                    <Row label="Bump Badge Pill">
                                        <Input
                                            size="sm"
                                            type="text"
                                            value={field.orderBumpBadge || 'ONE-TIME OFFER - 80% OFF'}
                                            onChange={e => update('orderBumpBadge', e.target.value)}
                                            placeholder="ONE-TIME OFFER - 80% OFF"
                                        />
                                    </Row>
                                    <Row label="Bump Price ($)">
                                        <Input
                                            size="sm"
                                            type="number"
                                            step="0.01"
                                            value={field.orderBumpPrice || '19.00'}
                                            onChange={e => update('orderBumpPrice', e.target.value)}
                                            placeholder="19.00"
                                        />
                                    </Row>
                                    <Row label="Bump Description">
                                        <textarea
                                            rows={2}
                                            value={field.orderBumpDescription || 'Get lifetime access to the quickstart toolkit & bonus resources.'}
                                            onChange={e => update('orderBumpDescription', e.target.value)}
                                            className={inputCls}
                                            placeholder="Describe the impulse add-on..."
                                        />
                                    </Row>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Product Select Field Settings (1-Step Checkout) */}
                {field.type === 'product_select' && (() => {
                    const selectedProduct = ecommerceProducts.find(p => p.id === field.productId);
                    const hasTiers = Array.isArray(field.prices) && field.prices.length > 0;

                    return (
                        <div className="space-y-3 pt-1">
                            <div className="p-2.5 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-lg text-xs text-brand-700 dark:text-brand-300">
                                <strong>1-Step Product Selector</strong>: Displays products or pricing tiers directly on your single-step form.
                            </div>

                            {ecommerceProducts && ecommerceProducts.length > 0 && (
                                <Row label="Select Product from Catalog">
                                    <Select
                                        size="sm"
                                        value={field.productId || ''}
                                        onChange={e => {
                                            const pId = parseInt(e.target.value) || null;
                                            const selected = ecommerceProducts.find(p => p.id === pId);
                                            if (selected) {
                                                const defaultPrice = selected.price ? String(selected.price) : '0.00';
                                                const hasTiers = Array.isArray(selected.prices) && selected.prices.length > 0;
                                                const tier1 = hasTiers ? selected.prices[0] : null;
                                                const tier2 = hasTiers && selected.prices.length > 1 ? selected.prices[1] : null;

                                                onChange({
                                                    ...field,
                                                    productId: selected.id,
                                                    productTitle: tier1?.name || selected.name,
                                                    productSubtitle: selected.description ? selected.description.slice(0, 80) : 'Instant digital access',
                                                    productPrice: tier1?.price ? String(tier1.price) : defaultPrice,
                                                    imageUrl: selected.image_url || '',
                                                    tier2Title: tier2 ? tier2.name : '',
                                                    tier2Subtitle: tier2 ? (tier2.pricing_type === 'recurring' ? `Billed every ${tier2.billing_interval || 'month'}` : 'Upgrade package') : '',
                                                    tier2Price: tier2?.price ? String(tier2.price) : '',
                                                    prices: selected.prices || [],
                                                });
                                            } else {
                                                onChange({ ...field, productId: null, prices: [] });
                                            }
                                        }}
                                    >
                                        <option value="">-- Choose from Catalog --</option>
                                        {ecommerceProducts.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (${parseFloat(p.price || 0).toFixed(2)}) {p.prices?.length > 1 ? `• ${p.prices.length} Tiers` : ''}
                                            </option>
                                        ))}
                                    </Select>
                                </Row>
                            )}

                            {/* Product Info Card from Catalog */}
                            {selectedProduct && (
                                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-start gap-2.5">
                                    {selectedProduct.image_url ? (
                                        <img src={selectedProduct.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                                            PROD
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{selectedProduct.name}</p>
                                        <p className="text-[10px] text-neutral-500 line-clamp-2 mt-0.5">{selectedProduct.description || 'No description provided'}</p>
                                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                            ${parseFloat(selectedProduct.price || 0).toFixed(2)} Base Catalog Price
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Multi-Price Tiers Display & Name Customization */}
                            {hasTiers ? (
                                <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                        Plan Tiers (Custom Display Names)
                                    </label>
                                    {field.prices.map((pTier, idx) => (
                                        <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-neutral-500 uppercase">Tier {idx + 1}</span>
                                                <span className="text-[10px] font-extrabold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    🔒 ${parseFloat(pTier.price || 0).toFixed(2)}{pTier.pricing_type === 'recurring' ? `/${pTier.billing_interval === 'year' ? 'yr' : 'mo'}` : ''}
                                                </span>
                                            </div>
                                            <Row label="Plan Display Name">
                                                <Input
                                                    size="sm"
                                                    type="text"
                                                    value={pTier.name || ''}
                                                    onChange={e => {
                                                        const updated = [...field.prices];
                                                        updated[idx] = { ...updated[idx], name: e.target.value };
                                                        onChange({ ...field, prices: updated });
                                                    }}
                                                    placeholder="e.g. Monthly VIP Pass"
                                                />
                                            </Row>
                                            <Row label="Plan Description / Subtitle">
                                                <Input
                                                    size="sm"
                                                    type="text"
                                                    value={pTier.description || ''}
                                                    onChange={e => {
                                                        const updated = [...field.prices];
                                                        updated[idx] = { ...updated[idx], description: e.target.value };
                                                        onChange({ ...field, prices: updated });
                                                    }}
                                                    placeholder={pTier.pricing_type === 'recurring' ? `Billed every ${pTier.billing_interval || 'month'}` : 'Tier description'}
                                                />
                                            </Row>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <Row label="Plan Display Name">
                                        <Input
                                            size="sm"
                                            type="text"
                                            value={field.productTitle || ''}
                                            onChange={e => update('productTitle', e.target.value)}
                                            placeholder="Standard Access Plan"
                                        />
                                    </Row>
                                    <Row label="Plan Description / Subtitle">
                                        <Input
                                            size="sm"
                                            type="text"
                                            value={field.productSubtitle || ''}
                                            onChange={e => update('productSubtitle', e.target.value)}
                                            placeholder="Instant digital access"
                                        />
                                    </Row>
                                    <Row label="Catalog Price ($)">
                                        <Input
                                            size="sm"
                                            type="text"
                                            value={`$${parseFloat(field.productPrice || 49.00).toFixed(2)} 🔒 (Catalog Price)`}
                                            readOnly
                                            disabled
                                            className="bg-neutral-100 dark:bg-neutral-800 opacity-75 font-mono font-bold cursor-not-allowed"
                                        />
                                    </Row>
                                </>
                            )}
                        </div>
                    );
                })()}

                {/* 1-Click Order Bump Field Settings */}
                {field.type === 'order_bump' && (
                    <div className="space-y-3 pt-1">
                        {ecommerceProducts && ecommerceProducts.length > 0 && (
                            <Row label="Select Bump Product from Catalog">
                                <Select
                                    size="sm"
                                    value={field.productId || ''}
                                    onChange={e => {
                                        const pId = parseInt(e.target.value) || null;
                                        const selected = ecommerceProducts.find(p => p.id === pId);
                                        if (selected) {
                                            onChange({
                                                ...field,
                                                productId: selected.id,
                                                headline: `Yes! Add ${selected.name}`,
                                                description: selected.description ? selected.description.slice(0, 100) : 'Get our comprehensive blueprint and templates at an exclusive one-time discount.',
                                                price: String(selected.price || '19.00'),
                                                imageUrl: selected.image_url || '',
                                            });
                                        } else {
                                            onChange({ ...field, productId: null });
                                        }
                                    }}
                                >
                                    <option value="">-- Choose from Catalog --</option>
                                    {ecommerceProducts.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (${parseFloat(p.price || 0).toFixed(2)})
                                        </option>
                                    ))}
                                </Select>
                            </Row>
                        )}

                        <Row label="Offer Headline">
                            <Input
                                size="sm"
                                type="text"
                                value={field.headline || 'Yes! Add This Exclusive Bonus'}
                                onChange={e => update('headline', e.target.value)}
                                placeholder="Yes! Add This Exclusive Bonus"
                            />
                        </Row>
                        <Row label="Badge Pill Text">
                            <Input
                                size="sm"
                                type="text"
                                value={field.badgeText || 'SPECIAL ONE-TIME OFFER'}
                                onChange={e => update('badgeText', e.target.value)}
                                placeholder="SPECIAL ONE-TIME OFFER"
                            />
                        </Row>
                        <Row label="Price ($)">
                            <Input
                                size="sm"
                                type="number"
                                step="0.01"
                                value={field.price || '19.00'}
                                onChange={e => update('price', e.target.value)}
                                placeholder="19.00"
                            />
                        </Row>
                        <Row label="Description">
                            <textarea
                                rows={2}
                                value={field.description || 'Get our comprehensive blueprint and templates at an exclusive one-time discount.'}
                                onChange={e => update('description', e.target.value)}
                                className={inputCls}
                                placeholder="Offer description..."
                            />
                        </Row>
                    </div>
                )}

                {/* Coupon Code Field Settings */}
                {field.type === 'coupon_code' && (
                    <div className="space-y-3 pt-1">
                        <Row label="Placeholder Text">
                            <Input
                                size="sm"
                                type="text"
                                value={field.placeholder || 'Enter coupon or promo code'}
                                onChange={e => update('placeholder', e.target.value)}
                                placeholder="Enter coupon code"
                            />
                        </Row>
                        <Row label="Button Label">
                            <Input
                                size="sm"
                                type="text"
                                value={field.buttonText || 'Apply'}
                                onChange={e => update('buttonText', e.target.value)}
                                placeholder="Apply"
                            />
                        </Row>
                    </div>
                )}

                {/* API Key */}
                {!isElement && !isCompliance && (
                    <>
                        {!isStandard && (
                            <Row label="Field Key (API)">
                                <Input
                                    size="sm"
                                    type="text"
                                    value={field.key || ''}
                                    onChange={e => update('key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                    className="font-mono"
                                    placeholder="e.g. company_name"
                                />
                                <p className="text-[10px] text-neutral-400 mt-1">Used in API response and CRM custom fields</p>
                            </Row>
                        )}

                        {/* Query Key (URL Autofill Parameter) */}
                        <Row label="Query Key (URL Autofill)">
                            <Input
                                size="sm"
                                type="text"
                                value={field.queryKey !== undefined ? field.queryKey : (field.key || field.type)}
                                onChange={e => update('queryKey', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                className="font-mono"
                                placeholder="e.g. utm_source or features"
                            />
                            <p className="text-[10px] text-neutral-400 mt-1">
                                URL parameter to auto-populate this field (e.g. ?{(field.queryKey !== undefined ? field.queryKey : (field.key || field.type)) || 'key'}=value)
                            </p>
                        </Row>
                    </>
                )}

                {/* Alignment & Text Color */}
                {field.type !== 'divider' && field.type !== 'hidden' && (
                    <>
                        <Row label="Alignment">
                            <div className="grid grid-cols-3 gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
                                {[
                                    { value: 'left', icon: AlignLeft, label: 'Left' },
                                    { value: 'center', icon: AlignCenter, label: 'Center' },
                                    { value: 'right', icon: AlignRight, label: 'Right' },
                                ].map(({ value, icon: Icon, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => update('align', value)}
                                        className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition ${
                                            (field.align || 'left') === value
                                                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                                        }`}
                                        title={label}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                    </button>
                                ))}
                            </div>
                        </Row>

                        <Row label={isElement ? "Text Color" : "Label / Text Color"}>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={field.color || '#111827'}
                                    onChange={(e) => update('color', e.target.value)}
                                    className="h-8 w-10 rounded cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0"
                                />
                                <Input
                                    size="sm"
                                    type="text"
                                    value={field.color || ''}
                                    onChange={(e) => update('color', e.target.value)}
                                    placeholder="#111827"
                                    wrapperClassName="flex-1"
                                />
                            </div>
                        </Row>
                    </>
                )}

                {/* Label — for non-element, non-compliance */}
                {!isElement && field.type !== 'divider' && field.type !== 'captcha' && (
                    <Row label={field.type === 'checkbox' ? "Checkbox Text / Consent" : "Label"}>
                        <MiniRichEditor
                            value={field.label || ''}
                            onChange={val => update('label', val)}
                            placeholder={field.type === 'checkbox' ? 'Consent / agreement text...' : 'Field label'}
                            minHeight={field.type === 'checkbox' ? "90px" : "60px"}
                        />
                    </Row>
                )}

                {/* Placeholder */}
                {hasPlaceholder && (
                    <Row label="Placeholder">
                        <Input size="sm" type="text" value={field.placeholder || ''} onChange={e => update('placeholder', e.target.value)} placeholder="e.g. Enter your email" />
                    </Row>
                )}

                {/* Options for select/radio/multi_checkbox */}
                {hasOptions && (
                    <Row label="Options">
                        <div className="space-y-1.5">
                            {(field.options || ['Option 1']).map((opt, idx) => (
                                <div key={idx} className="flex gap-1">
                                    <Input
                                        size="sm"
                                        type="text"
                                        value={opt}
                                        onChange={e => updateOption(idx, e.target.value)}
                                        wrapperClassName="flex-1"
                                        placeholder={`Option ${idx + 1}`}
                                    />
                                    <button type="button" onClick={() => removeOption(idx)} className="p-1 text-red-400 hover:text-red-600 rounded">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addOption} className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                                + Add option
                            </button>
                        </div>
                    </Row>
                )}

                {/* Rating max */}
                {field.type === 'rating' && (
                    <Row label="Max Stars">
                        <Select value={field.maxRating || 5} onChange={e => update('maxRating', Number(e.target.value))} size="sm">
                            {[3, 4, 5, 7, 10].map(n => <option key={n} value={n}>{n} Stars</option>)}
                        </Select>
                    </Row>
                )}

                {/* Scale (NPS / Opinion) Settings */}
                {field.type === 'scale' && (
                    <>
                        <Row label="Scale Range">
                            <Select value={field.maxScale || 10} onChange={e => update('maxScale', Number(e.target.value))} size="sm">
                                <option value={5}>1 to 5 Scale</option>
                                <option value={7}>1 to 7 Scale</option>
                                <option value={10}>1 to 10 Scale (NPS)</option>
                            </Select>
                        </Row>
                        <Row label="Left Label">
                            <Input size="sm" type="text" value={field.minLabel || ''} onChange={e => update('minLabel', e.target.value)} placeholder="e.g. Not likely" />
                        </Row>
                        <Row label="Right Label">
                            <Input size="sm" type="text" value={field.maxLabel || ''} onChange={e => update('maxLabel', e.target.value)} placeholder="e.g. Very likely" />
                        </Row>
                    </>
                )}

                {/* Terms & Privacy Settings */}
                {field.type === 'terms' && (
                    <Row label="Terms & Privacy Text">
                        <MiniRichEditor
                            value={field.termsText || field.label || ''}
                            onChange={val => {
                                update('termsText', val);
                                update('label', val);
                            }}
                            placeholder="Privacy Policy | Terms of Service"
                            minHeight="90px"
                        />
                    </Row>
                )}

                {/* Hidden field default value */}
                {field.type === 'hidden' && (
                    <Row label="Default Value">
                        <Input size="sm" type="text" value={field.defaultValue || ''} onChange={e => update('defaultValue', e.target.value)} placeholder="e.g. utm_source value" />
                    </Row>
                )}

                {/* GDPR text */}
                {field.type === 'gdpr' && (
                    <Row label="Consent Text">
                        <MiniRichEditor
                            value={field.gdprText || ''}
                            onChange={val => update('gdprText', val)}
                            placeholder="I agree to receive communications and updates..."
                            minHeight="90px"
                        />
                    </Row>
                )}

                {/* Double OTP channel */}
                {field.type === 'double_optin' && (
                    <Row label="OTP Channel">
                        <Select value={field.channel || 'whatsapp'} onChange={e => update('channel', e.target.value)} size="sm">
                            <option value="whatsapp">WhatsApp</option>
                            <option value="email">Email</option>
                            <option value="sms">SMS</option>
                        </Select>
                    </Row>
                )}

                {/* Required & Label toggles — for input fields */}
                {!isElement && !isCompliance && field.type !== 'hidden' && (
                    <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                        <Toggle label="Required field" checked={!!field.required} onChange={v => update('required', v)} />
                        <Toggle label="Show label" checked={field.showLabel !== false} onChange={v => update('showLabel', v)} />
                    </div>
                )}

                {/* Field Width toggle — available for all fields */}
                {field.type !== 'divider' && field.type !== 'hidden' && (
                    <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
                        <label className={labelCls}>Field Width</label>
                        <div className="flex gap-1.5">
                            {[
                                { value: 'full', label: '100% Full Width' },
                                { value: 'half', label: '50% Half Width' },
                            ].map(w => (
                                <button
                                    key={w.value}
                                    type="button"
                                    onClick={() => update('width', w.value)}
                                    className={`flex-1 py-1.5 px-2 text-xs rounded-lg border font-medium transition flex items-center justify-center gap-1.5 ${
                                        (field.width || 'full') === w.value
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-semibold'
                                            : 'border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-emerald-500'
                                    }`}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-neutral-400">
                            Two consecutive 50% half-width fields will automatically sit side-by-side in one row.
                        </p>
                    </div>
                )}

                {/* Spacing (Margin & Padding) Controls */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                    <span className={labelCls}>📐 Spacing</span>

                    {/* Margin */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                            Margin (Outside Gap)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">Top (px)</span>
                                <Input
                                    size="sm"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={field.marginTop !== undefined ? field.marginTop : ''}
                                    onChange={(e) => update('marginTop', e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">Bottom (px)</span>
                                <Input
                                    size="sm"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={field.marginBottom !== undefined ? field.marginBottom : ''}
                                    onChange={(e) => update('marginBottom', e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">Left (px)</span>
                                <Input
                                    size="sm"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={field.marginLeft !== undefined ? field.marginLeft : ''}
                                    onChange={(e) => update('marginLeft', e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">Right (px)</span>
                                <Input
                                    size="sm"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={field.marginRight !== undefined ? field.marginRight : ''}
                                    onChange={(e) => update('marginRight', e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Padding */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                            Padding (Inside Spacing)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">Top (px)</span>
                                <Input
                                    size="sm"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={field.paddingTop !== undefined ? field.paddingTop : ''}
                                    onChange={(e) => update('paddingTop', e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">Bottom (px)</span>
                                <Input
                                    size="sm"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={field.paddingBottom !== undefined ? field.paddingBottom : ''}
                                    onChange={(e) => update('paddingBottom', e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">Left (px)</span>
                                <Input
                                    size="sm"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={field.paddingLeft !== undefined ? field.paddingLeft : ''}
                                    onChange={(e) => update('paddingLeft', e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">Right (px)</span>
                                <Input
                                    size="sm"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={field.paddingRight !== undefined ? field.paddingRight : ''}
                                    onChange={(e) => update('paddingRight', e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete button */}
            {field.type !== 'email' && (
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 sticky bottom-0 bg-white dark:bg-neutral-900">
                    <button
                        type="button"
                        onClick={onDelete}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-600 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Field
                    </button>
                </div>
            )}
        </aside>
    );
}
