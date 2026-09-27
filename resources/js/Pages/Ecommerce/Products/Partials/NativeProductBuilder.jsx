import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import MediaUpload from '@/Components/MediaUpload';
import ProductLandingView from '@/Components/Ecommerce/ProductLandingView';
import { Input, Select } from '@/Components/ui';
import { 
    X, ArrowLeft, Monitor, Smartphone, Check, FileText, Link as LinkIcon, 
    Key, Clock, Sparkles, HelpCircle, MessageSquare, User, Tag, RefreshCw, 
    CreditCard, Gift, ChevronRight, Plus, Trash2, ShieldCheck, Download, Layers,
    Star, Images, Quote, Percent, Zap, Ticket, Package
} from 'lucide-react';

export default function NativeProductBuilder({ isOpen, onClose, product = null, calendars = [], allProducts = [] }) {
    const { props: pageProps } = usePage();
    const nativeStore = pageProps.nativeStore;
    const isEdit = !!product;
    const [step, setStep] = useState(1);
    const [previewDevice, setPreviewDevice] = useState('desktop');

    const { data, setData, post, put, processing, errors, reset, transform } = useForm({
        name: product?.name || '',
        description: product?.description || '',
        sku: product?.sku || '',
        product_type: 'digital',
        pricing_type: product?.pricing_type || 'one_time',
        price: product?.price ? String(product.price) : '10.00',
        compare_price: product?.compare_price ? String(product.compare_price) : '',
        billing_interval: product?.billing_interval || 'month',
        billing_interval_count: product?.billing_interval_count || 1,
        trial_days: product?.trial_days || 0,
        installment_count: product?.installment_count || 3,
        enable_stock_limit: product?.inventory_quantity !== null && product?.inventory_quantity !== undefined,
        inventory_quantity: product?.inventory_quantity ?? 10,
        status: product?.status || 'active',
        image_url: product?.image_url || '',
        button_text: product?.raw?.button_text || 'Get it now',
        digital_fulfillment_type: product?.digital_fulfillment_type || 'file',
        digital_file_url: product?.digital_file_url || '',
        digital_external_url: product?.digital_external_url || '',
        digital_license_key: product?.digital_license_key || '',
        digital_download_limit: product?.digital_download_limit || 5,
        calendar_id: product?.calendar_id || '',
        faqs: product?.raw?.faqs || [],
        reviews: product?.raw?.reviews || [],
        gallery: product?.raw?.gallery || [],
        about_me: product?.raw?.about_me || { headline: '', bio: '', custom_message: '' },
        order_bump: product?.raw?.order_bump || { enabled: false, title: '', price: '5.00', description: '', fulfillment_type: 'file', file_url: '', external_url: '' },
        coupons: product?.raw?.coupons || [],
        prices: product?.prices && product.prices.length > 0 ? product.prices.map(p => ({
            id: p.id,
            name: p.name || 'Standard',
            pricing_type: p.pricing_type || 'one_time',
            price: p.price ? String(p.price) : '10.00',
            compare_price: p.compare_price ? String(p.compare_price) : '',
            billing_interval: p.billing_interval || 'month',
            billing_interval_count: p.billing_interval_count || 1,
            trial_days: p.trial_days || 0,
            installment_count: p.installment_count || 3,
            is_default: !!p.is_default,
        })) : [],
        // New fields
        meta_title: product?.meta_title || '',
        meta_description: product?.meta_description || '',
        access_duration_type: product?.access_duration_type || 'lifetime',
        access_duration_days: product?.access_duration_days || 30,
        refund_policy: product?.raw?.refund_policy || '',
        terms_url: product?.raw?.terms_url || '',
    });

    const liveDomain = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:8005';
    const liveStoreSlug = nativeStore?.slug || nativeStore?.id || 'store';
    const liveProductSlug = product?.slug || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'product');
    const displayUrl = `${liveDomain}/${liveStoreSlug}/${liveProductSlug}`;

    useEffect(() => {
        if (product) {
            setData({
                name: product.name || '',
                description: product.description || '',
                sku: product.sku || '',
                product_type: 'digital',
                pricing_type: product.pricing_type || 'one_time',
                price: product.price ? String(product.price) : '10.00',
                compare_price: product.compare_price ? String(product.compare_price) : '',
                billing_interval: product.billing_interval || 'month',
                billing_interval_count: product.billing_interval_count || 1,
                trial_days: product.trial_days || 0,
                installment_count: product.installment_count || 3,
                enable_stock_limit: product.inventory_quantity !== null && product.inventory_quantity !== undefined,
                inventory_quantity: product.inventory_quantity ?? 10,
                status: product.status || 'active',
                image_url: product.image_url || '',
                button_text: product.raw?.button_text || 'Get it now',
                digital_fulfillment_type: product.digital_fulfillment_type || 'file',
                digital_file_url: product.digital_file_url || '',
                digital_external_url: product.digital_external_url || '',
                digital_license_key: product.digital_license_key || '',
                digital_download_limit: product.digital_download_limit || 5,
                calendar_id: product.calendar_id || '',
                faqs: product.raw?.faqs || [],
                reviews: product.raw?.reviews || [],
                gallery: product.raw?.gallery || [],
                about_me: product.raw?.about_me || { headline: '', bio: '', custom_message: '' },
                order_bump: product.raw?.order_bump || { enabled: false, title: '', price: '5.00', description: '', fulfillment_type: 'file', file_url: '', external_url: '' },
                coupons: product.raw?.coupons || [],
                prices: product.prices && product.prices.length > 0 ? product.prices.map(p => ({
                    id: p.id,
                    name: p.name || 'Standard',
                    pricing_type: p.pricing_type || 'one_time',
                    price: p.price ? String(p.price) : '10.00',
                    compare_price: p.compare_price ? String(p.compare_price) : '',
                    billing_interval: p.billing_interval || 'month',
                    billing_interval_count: p.billing_interval_count || 1,
                    trial_days: p.trial_days || 0,
                    installment_count: p.installment_count || 3,
                    is_default: !!p.is_default,
                })) : [],
                // New fields
                meta_title: product.meta_title || '',
                meta_description: product.meta_description || '',
                access_duration_type: product.access_duration_type || 'lifetime',
                access_duration_days: product.access_duration_days || 30,
                refund_policy: product.raw?.refund_policy || '',
                terms_url: product.raw?.terms_url || '',
            });
        } else {
            reset();
        }
    }, [product, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        transform((currentData) => ({
            ...currentData,
            raw: {
                button_text: currentData.button_text,
                faqs: currentData.faqs,
                reviews: currentData.reviews,
                gallery: currentData.gallery,
                about_me: currentData.about_me,
                order_bump: currentData.order_bump,
                coupons: currentData.coupons,
                refund_policy: currentData.refund_policy,
                terms_url: currentData.terms_url,
            }
        }));

        if (isEdit) {
            put(route('client.ecommerce.products.update', product.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('client.ecommerce.products.store'), {
                onSuccess: () => onClose(),
            });
        }
    };

    const addFaq = () => {
        setData('faqs', [...(data.faqs || []), { question: '', answer: '' }]);
    };

    const removeFaq = (index) => {
        setData('faqs', (data.faqs || []).filter((_, i) => i !== index));
    };

    const addReview = () => {
        setData('reviews', [...(data.reviews || []), { name: '', role: 'Verified Buyer', rating: 5, text: '' }]);
    };

    const removeReview = (index) => {
        setData('reviews', (data.reviews || []).filter((_, i) => i !== index));
    };

    const removeGalleryImage = (index) => {
        setData('gallery', (data.gallery || []).filter((_, i) => i !== index));
    };

    const addCoupon = () => {
        setData('coupons', [...(data.coupons || []), { code: '', discount_type: 'percent', discount_value: 20 }]);
    };

    const removeCoupon = (index) => {
        setData('coupons', (data.coupons || []).filter((_, i) => i !== index));
    };

    const addPriceTier = () => {
        const currentPrices = data.prices || [];
        setData('prices', [
            ...currentPrices,
            {
                name: `Tier ${currentPrices.length + 1}`,
                pricing_type: 'one_time',
                price: '29.00',
                compare_price: '',
                billing_interval: 'month',
                billing_interval_count: 1,
                trial_days: 0,
                installment_count: 3,
                is_default: currentPrices.length === 0,
            }
        ]);
    };

    const removePriceTier = (index) => {
        setData('prices', (data.prices || []).filter((_, i) => i !== index));
    };

    const updatePriceTier = (index, field, value) => {
        const updated = [...(data.prices || [])];
        if (field === 'is_default' && value) {
            updated.forEach((p, idx) => {
                p.is_default = idx === index;
            });
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setData('prices', updated);
    };

    return (
        <div className="fixed inset-0 z-50 bg-neutral-100 dark:bg-neutral-950 flex flex-col font-sans text-neutral-900 dark:text-neutral-100 overflow-hidden">
            {/* WhatsMine Top Navigation Bar */}
            <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            WM
                        </div>
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                step === 1
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            Step 1: Content & Media
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                step === 2
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            Step 2: Pricing, Stock & Upsells
                        </button>
                    </div>
                </div>
            </div>

            {/* Device Preview Mode Toggles */}
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            previewDevice === 'desktop'
                                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-neutral-200 dark:border-neutral-700'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                    >
                        <Monitor className="h-4 w-4" /> Desktop
                    </button>
                    <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            previewDevice === 'mobile'
                                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-neutral-200 dark:border-neutral-700'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                    >
                        <Smartphone className="h-4 w-4" /> Mobile
                    </button>
                </div>
            </div>

            {/* Split Builder Main Canvas */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: WhatsMine Builder Form Controls */}
                <div className="w-full lg:w-[500px] xl:w-[540px] border-r border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col shrink-0 overflow-hidden">
                    <form onSubmit={(e) => { e.preventDefault(); }} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* ─── STEP 1: Product Setup ───────────────── */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="pb-3 border-b border-neutral-200 dark:border-neutral-800">
                                        <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-emerald-500" /> Product Setup
                                        </h2>
                                        <p className="text-xs text-neutral-500 mt-1">Define what the product is, how it looks, and how it gets delivered after purchase.</p>
                                    </div>

                                    {/* 1. Product Title */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                                Product Title <span className="text-red-500">*</span>
                                            </label>
                                            <span className="text-xs font-mono text-neutral-400">{data.name.length}/75</span>
                                        </div>
                                        <Input
                                            type="text"
                                            maxLength={75}
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g. Master Digital Product Vault 2026"
                                            required
                                        />
                                    </div>

                                    {/* 2. Cover Banner */}
                                    <div>
                                        <MediaUpload
                                            label="Cover Banner Image *"
                                            value={data.image_url}
                                            onChange={(url) => setData('image_url', url)}
                                            accept="image/*"
                                            collection="payment_covers"
                                            placeholder="Upload banner image or paste URL..."
                                        />
                                    </div>

                                    {/* 3. Description */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                                            Description / Overview <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={5}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Highlight key features, benefits, and instructions for your buyers."
                                            required
                                            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                                        />
                                    </div>

                                    {/* 4. Content Delivery Mode */}
                                    <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                            <Download className="h-3.5 w-3.5 text-emerald-500" /> Content Delivery Mode
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { type: 'file',          emoji: '📄', label: 'File Upload' },
                                                { type: 'external_link', emoji: '🔗', label: 'Access Link' },
                                                { type: 'license_key',   emoji: '🔑', label: 'License Key' },
                                                { type: 'booking',       emoji: '📅', label: 'Booking Calendar' },
                                            ].map(({ type, emoji, label }) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setData('digital_fulfillment_type', type)}
                                                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                                        data.digital_fulfillment_type === type
                                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                                                    }`}
                                                >
                                                    {emoji} {label}
                                                </button>
                                            ))}
                                        </div>

                                        {data.digital_fulfillment_type === 'file' && (
                                            <div className="space-y-2">
                                                <MediaUpload
                                                    label="Upload product files (PDF, ZIP, MP3, MP4)"
                                                    value={data.digital_file_url || ''}
                                                    onChange={(url) => setData('digital_file_url', url)}
                                                    accept=".pdf,.zip,.rar,.mp3,.mp4,.doc,.docx,.epub"
                                                    collection="digital_product_files"
                                                    maxSizeMb={100}
                                                    placeholder="Drag & drop file or enter URL..."
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Download Limit (times)</label>
                                                        <Input size="sm" type="number" min="1" value={data.digital_download_limit || 5}
                                                            onChange={(e) => setData('digital_download_limit', parseInt(e.target.value) || 5)}
                                                            className="font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Link Expires After (days)</label>
                                                        <Input size="sm" type="number" min="1" value={data.digital_expiration_days || 30}
                                                            onChange={(e) => setData('digital_expiration_days', parseInt(e.target.value) || 30)}
                                                            className="font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {data.digital_fulfillment_type === 'external_link' && (
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                                    Private Access URL (Google Drive, Notion, Discord)
                                                </label>
                                                <Input type="text" value={data.digital_external_url || ''}
                                                    onChange={(e) => setData('digital_external_url', e.target.value)}
                                                    placeholder="https://drive.google.com/..."
                                                />
                                            </div>
                                        )}

                                        {data.digital_fulfillment_type === 'license_key' && (
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">License Key or Serial Code</label>
                                                <textarea rows={2} value={data.digital_license_key || ''}
                                                    onChange={(e) => setData('digital_license_key', e.target.value)}
                                                    placeholder="Enter product key..."
                                                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm font-mono"
                                                />
                                            </div>
                                        )}

                                        {data.digital_fulfillment_type === 'booking' && (
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                                    Select Booking Calendar / Webinar
                                                </label>
                                                <Select value={data.calendar_id || ''}
                                                    onChange={(e) => setData('calendar_id', e.target.value)}
                                                    size="sm"
                                                >
                                                    <option value="">-- Select Calendar --</option>
                                                    {calendars.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name} ({c.type} • {c.duration_minutes}m)</option>
                                                    ))}
                                                </Select>
                                            </div>
                                        )}
                                    </div>


                                    {/* 4b. Access Duration */}
                                    <div className="space-y-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-emerald-500" /> Access Duration
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'lifetime', label: '♾️ Lifetime Access' },
                                                { value: 'days',     label: '📅 Limited (days)' },
                                            ].map(({ value, label }) => (
                                                <button key={value} type="button"
                                                    onClick={() => setData('access_duration_type', value)}
                                                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                                                        data.access_duration_type === value
                                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                                                    }`}
                                                >{label}</button>
                                            ))}
                                        </div>
                                        {data.access_duration_type === 'days' && (
                                            <div>
                                                <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Number of Days</label>
                                                <Input type="number" min="1" value={data.access_duration_days || 30}
                                                    onChange={(e) => setData('access_duration_days', parseInt(e.target.value) || 30)}
                                                    placeholder="e.g. 365"
                                                    className="font-bold"
                                                />
                                                <p className="text-[10px] text-neutral-400 mt-1">Buyer loses access after <strong>{data.access_duration_days}</strong> days.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 4c. SEO Meta Fields */}
                                    <div className="space-y-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> SEO & Social Preview
                                        </label>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">Meta Title <span className="font-normal">(optional — defaults to product name)</span></label>
                                                <span className="text-[10px] font-mono text-neutral-400">{(data.meta_title||'').length}/60</span>
                                            </div>
                                            <Input type="text" maxLength={60} value={data.meta_title}
                                                onChange={(e) => setData('meta_title', e.target.value)}
                                                placeholder={data.name || 'SEO page title...'}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">Meta Description <span className="font-normal">(shown in Google/WhatsApp preview)</span></label>
                                                <span className="text-[10px] font-mono text-neutral-400">{(data.meta_description||'').length}/160</span>
                                            </div>
                                            <textarea rows={2} maxLength={160} value={data.meta_description}
                                                onChange={(e) => setData('meta_description', e.target.value)}
                                                placeholder="Short compelling description for search engines and social link previews..."
                                                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* 5. Status + Button Text */}
                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">Product Status</label>
                                            <Select value={data.status} onChange={(e) => setData('status', e.target.value)}
                                                size="sm"
                                            >
                                                <option value="active">✅ Active</option>
                                                <option value="draft">📝 Draft</option>
                                                <option value="archived">📦 Archived</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Button Text</label>
                                                <span className="text-xs font-mono text-neutral-400">{(data.button_text || '').length}/25</span>
                                            </div>
                                            <Input type="text" maxLength={25} value={data.button_text}
                                                onChange={(e) => setData('button_text', e.target.value)}
                                                placeholder="Get it now"
                                            />
                                        </div>
    
                                    {/* 5b. SKU (auto-generated, editable) */}
                                    <div className="col-span-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">SKU</label>
                                            <button type="button"
                                                onClick={() => {
                                                    const prefix = (data.name||'PROD').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
                                                    const rand = Math.random().toString(36).substring(2,8).toUpperCase();
                                                    setData('sku', `${prefix}-${rand}`);
                                                }}
                                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                            >⚡ Auto-generate</button>
                                        </div>
                                        <Input type="text" value={data.sku || ''}
                                            onChange={(e) => setData('sku', e.target.value.toUpperCase())}
                                            placeholder="e.g. MASTV-AB12CD"
                                            className="font-mono font-bold"
                                        />
                                    </div>
                                </div>
                                </div>
                            )}

                            {/* ─── STEP 2: Sales & Revenue ──────────────── */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="pb-3 border-b border-neutral-200 dark:border-neutral-800">
                                        <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-emerald-500" /> Sales & Revenue
                                        </h2>
                                        <p className="text-xs text-neutral-500 mt-1">Set your pricing model, revenue boosts, discounts, and social proof content.</p>
                                    </div>

                                    {/* ── Pricing Model ── */}
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                            <Tag className="h-3.5 w-3.5 text-emerald-500" /> Pricing Model
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: 'one_time',     label: '💳 Fixed One-Time' },
                                                { value: 'recurring',    label: '🔄 Subscription' },
                                                { value: 'installments', label: '📆 Installment Plan' },
                                                { value: 'free',         label: '🎁 FREE ($0)' },
                                            ].map(({ value, label }) => (
                                                <button key={value} type="button" onClick={() => setData('pricing_type', value)}
                                                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                                                        data.pricing_type === value
                                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                                                    }`}
                                                >{label}</button>
                                            ))}
                                        </div>

                                        {data.pricing_type !== 'free' && (
                                            <div className="space-y-3 pt-1">
                                                <div>
                                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                                        {data.pricing_type === 'installments' ? 'Installment Amount (USD $) *' : 'Sale Price (USD $) *'}
                                                    </label>
                                                    <Input type="number" step="0.01" min="0" value={data.price}
                                                        onChange={(e) => setData('price', e.target.value)}
                                                        placeholder="10.00" required
                                                        className="font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                                                        Original Price ($) <span className="font-normal text-neutral-400">(optional — shown as strikethrough)</span>
                                                    </label>
                                                    <Input type="number" step="0.01" min="0" value={data.compare_price}
                                                        onChange={(e) => setData('compare_price', e.target.value)}
                                                        placeholder="e.g. 99.00"
                                                    />
                                                </div>

                                                {data.pricing_type === 'recurring' && (
                                                    <div className="space-y-2">
                                                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Billing Frequency</label>
                                                        <Select
                                                            value={
                                                                data.billing_interval === 'day'   && Number(data.billing_interval_count) === 7 ? '7days' :
                                                                data.billing_interval === 'month' && Number(data.billing_interval_count) === 3 ? '3months' :
                                                                data.billing_interval === 'month' && Number(data.billing_interval_count) === 6 ? '6months' :
                                                                data.billing_interval === 'year'  && Number(data.billing_interval_count) === 1 ? '1year' :
                                                                'custom'
                                                            }
                                                            onChange={(e) => {
                                                                const v = e.target.value;
                                                                if (v === '7days')   setData({ ...data, billing_interval: 'day',   billing_interval_count: 7 });
                                                                if (v === '3months') setData({ ...data, billing_interval: 'month', billing_interval_count: 3 });
                                                                if (v === '6months') setData({ ...data, billing_interval: 'month', billing_interval_count: 6 });
                                                                if (v === '1year')   setData({ ...data, billing_interval: 'year',  billing_interval_count: 1 });
                                                                if (v === 'custom')  setData({ ...data, billing_interval: 'day',   billing_interval_count: '' });
                                                            }}
                                                            size="sm"
                                                        >
                                                            <option value="7days">Every 7 Days</option>
                                                            <option value="3months">Every 3 Months (Quarterly)</option>
                                                            <option value="6months">Every 6 Months (Bi-Annually)</option>
                                                            <option value="1year">Every 1 Year (Annually)</option>
                                                            <option value="custom">Custom (days)</option>
                                                        </Select>
                                                        {data.billing_interval === 'day' && Number(data.billing_interval_count) !== 7 && (
                                                            <div>
                                                                <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Custom Interval (in days)</label>
                                                                <Input type="number" min="1" value={data.billing_interval_count || ''}
                                                                    onChange={(e) => setData('billing_interval_count', parseInt(e.target.value) || '')}
                                                                    placeholder="e.g. 210"
                                                                    className="font-bold"
                                                                />
                                                                <p className="text-[10px] text-neutral-400 mt-1">Charge every <strong>{data.billing_interval_count || '?'}</strong> days</p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                                                                Free Trial Days <span className="font-normal">(0 = no trial)</span>
                                                            </label>
                                                            <Input type="number" min="0" value={data.trial_days || 0}
                                                                onChange={(e) => setData('trial_days', parseInt(e.target.value) || 0)}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {data.pricing_type === 'installments' && (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Number of Installment Payments</label>
                                                        <Input type="number" min="2" max="24" value={data.installment_count || 3}
                                                            onChange={(e) => setData('installment_count', parseInt(e.target.value) || 3)}
                                                            className="font-bold"
                                                        />
                                                        <p className="text-[11px] text-neutral-500 mt-1">
                                                            Total value: <strong>${(parseFloat(data.price || 0) * parseInt(data.installment_count || 1)).toFixed(2)}</strong>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Multi-Price Tiers (Multiple Prices under 1 Product) ── */}
                                    <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                                    <Layers className="h-3.5 w-3.5 text-brand-500" /> Multi-Price Tiers
                                                </label>
                                                <p className="text-[11px] text-neutral-500 mt-0.5">Offer multiple payment plans (e.g. Monthly, Annual, Lifetime) for this product.</p>
                                            </div>
                                            <button type="button" onClick={addPriceTier}
                                                className="px-2.5 py-1 rounded-lg bg-brand-600/10 hover:bg-brand-600/20 text-brand-600 dark:text-brand-400 font-bold text-[11px] transition flex items-center gap-1 shrink-0"
                                            >
                                                <Plus className="h-3 w-3" /> Add Price Tier
                                            </button>
                                        </div>

                                        {data.prices && data.prices.length > 0 ? (
                                            <div className="space-y-3">
                                                {data.prices.map((tier, idx) => (
                                                    <div key={idx} className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <Input
                                                                    size="sm"
                                                                    type="text"
                                                                    value={tier.name || ''}
                                                                    onChange={(e) => updatePriceTier(idx, 'name', e.target.value)}
                                                                    placeholder="e.g. Annual VIP Pass (Save 20%)"
                                                                    className="font-bold"
                                                                    wrapperClassName="flex-1"
                                                                />
                                                                <label className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500 cursor-pointer shrink-0">
                                                                    <input
                                                                        type="radio"
                                                                        name="default_price_tier"
                                                                        checked={!!tier.is_default}
                                                                        onChange={() => updatePriceTier(idx, 'is_default', true)}
                                                                        className="text-brand-600"
                                                                    />
                                                                    Default
                                                                </label>
                                                            </div>
                                                            <button type="button" onClick={() => removePriceTier(idx)} className="p-1 text-neutral-400 hover:text-red-500 transition shrink-0">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Pricing Model</label>
                                                                <Select
                                                                    value={tier.pricing_type || 'one_time'}
                                                                    onChange={(e) => updatePriceTier(idx, 'pricing_type', e.target.value)}
                                                                    size="sm"
                                                                >
                                                                    <option value="one_time">💳 Fixed One-Time</option>
                                                                    <option value="recurring">🔄 Subscription</option>
                                                                    <option value="installments">📆 Installments</option>
                                                                    <option value="free">🎁 Free ($0)</option>
                                                                </Select>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Price (USD $)</label>
                                                                <Input
                                                                    size="sm"
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={tier.price ?? ''}
                                                                    onChange={(e) => updatePriceTier(idx, 'price', e.target.value)}
                                                                    placeholder="29.00"
                                                                    className="font-bold"
                                                                />
                                                            </div>
                                                        </div>

                                                        {tier.pricing_type === 'recurring' && (
                                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                                <div>
                                                                    <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Billing Frequency</label>
                                                                    <Select
                                                                        value={tier.billing_interval || 'month'}
                                                                        onChange={(e) => updatePriceTier(idx, 'billing_interval', e.target.value)}
                                                                        size="sm"
                                                                    >
                                                                        <option value="day">Weekly / Daily</option>
                                                                        <option value="month">Monthly</option>
                                                                        <option value="year">Annually (Yearly)</option>
                                                                    </Select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Trial Days</label>
                                                                    <Input
                                                                        size="sm"
                                                                        type="number"
                                                                        min="0"
                                                                        value={tier.trial_days || 0}
                                                                        onChange={(e) => updatePriceTier(idx, 'trial_days', parseInt(e.target.value) || 0)}
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {tier.pricing_type === 'installments' && (
                                                            <div className="pt-1">
                                                                <label className="block text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Installment Payments Count</label>
                                                                <Input
                                                                    size="sm"
                                                                    type="number"
                                                                    min="2"
                                                                    max="24"
                                                                    value={tier.installment_count || 3}
                                                                    onChange={(e) => updatePriceTier(idx, 'installment_count', parseInt(e.target.value) || 3)}
                                                                    placeholder="3"
                                                                    className="font-bold"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-neutral-400 italic">No extra price tiers added. Primary product price will be used.</p>
                                        )}
                                    </div>


                                    {/* ── Refund & Terms ── */}
                                    <div className="space-y-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Refund Policy & Terms
                                        </label>
                                        <textarea rows={2} value={data.refund_policy}
                                            onChange={(e) => setData('refund_policy', e.target.value)}
                                            placeholder="e.g. 30-day money-back guarantee, no questions asked."
                                            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm"
                                        />
                                        <Input type="url" value={data.terms_url}
                                            onChange={(e) => setData('terms_url', e.target.value)}
                                            placeholder="Terms & Conditions URL (optional)"
                                        />
                                    </div>

                                    {/* ── Stock / Inventory ── */}
                                    <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                                <Package className="h-3.5 w-3.5 text-amber-500" /> Stock Limit / Inventory
                                            </label>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={!!data.enable_stock_limit}
                                                    onChange={(e) => {
                                                        const enabled = e.target.checked;
                                                        setData(prev => ({ ...prev, enable_stock_limit: enabled, inventory_quantity: enabled ? (prev.inventory_quantity ?? 10) : null }));
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-neutral-600 peer-checked:bg-emerald-600"></div>
                                            </label>
                                        </div>
                                        {data.enable_stock_limit ? (
                                            <div>
                                                <Input type="number" min="0" value={data.inventory_quantity ?? 10}
                                                    onChange={(e) => setData('inventory_quantity', parseInt(e.target.value) || 0)}
                                                    placeholder="10"
                                                    className="font-bold"
                                                />
                                                <p className="text-[11px] text-neutral-500 mt-1">When stock reaches 0, the product shows as Sold Out.</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-neutral-500 italic">Disabled — product has unlimited availability.</p>
                                        )}
                                    </div>

                                    {/* ── Discount Coupons ── */}
                                    <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                                <Ticket className="h-3.5 w-3.5 text-emerald-500" /> Discount Coupons
                                            </label>
                                            <button type="button" onClick={addCoupon}
                                                className="px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] transition flex items-center gap-1"
                                            >
                                                <Plus className="h-3 w-3" /> Add Coupon
                                            </button>
                                        </div>
                                        {data.coupons && data.coupons.length > 0 && (
                                            <div className="space-y-2">
                                                {data.coupons.map((c, idx) => (
                                                    <div key={idx} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
                                                        <Input
                                                            size="sm"
                                                            type="text"
                                                            value={c.code}
                                                            onChange={(e) => { const arr=[...data.coupons]; arr[idx].code=e.target.value.toUpperCase(); setData('coupons',arr); }}
                                                            placeholder="LAUNCH20"
                                                            className="font-mono font-bold uppercase"
                                                            wrapperClassName="w-1/3"
                                                        />
                                                        <Select value={c.discount_type||'percent'}
                                                            onChange={(e)=>{ const arr=[...data.coupons]; arr[idx].discount_type=e.target.value; setData('coupons',arr); }}
                                                            size="sm"
                                                            className="w-24"
                                                        >
                                                            <option value="percent">% Off</option>
                                                            <option value="fixed">$ Off</option>
                                                        </Select>
                                                        <Input
                                                            size="sm"
                                                            type="number"
                                                            step="0.01"
                                                            value={c.discount_value}
                                                            onChange={(e)=>{ const arr=[...data.coupons]; arr[idx].discount_value=parseFloat(e.target.value)||0; setData('coupons',arr); }}
                                                            placeholder="20"
                                                            className="font-bold"
                                                            wrapperClassName="w-20"
                                                        />
                                                        <button type="button" onClick={()=>removeCoupon(idx)} className="p-1 text-neutral-400 hover:text-red-500 ml-auto">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* ── 1-Click Order Bump ── */}
                                    <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                                <Zap className="h-3.5 w-3.5 text-amber-500" /> 1-Click Order Bump
                                            </label>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={!!data.order_bump?.enabled}
                                                    onChange={(e) => setData('order_bump', { ...data.order_bump, enabled: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-neutral-600 peer-checked:bg-emerald-600"></div>
                                            </label>
                                        </div>
                                        {data.order_bump?.enabled && (
                                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Attach Existing Product</label>
                                                    <Select value={data.order_bump?.product_id||''}
                                                        onChange={(e) => {
                                                            const id = parseInt(e.target.value)||null;
                                                            const found = allProducts.find(p => p.id === id);
                                                            if (found) {
                                                                setData('order_bump', { ...data.order_bump, enabled:true, product_id:found.id, title:found.name, price:String(found.price||'5.00'), file_url:found.digital_file_url||'', external_url:found.digital_external_url||'' });
                                                            } else {
                                                                setData('order_bump', { ...data.order_bump, product_id:null });
                                                            }
                                                        }}
                                                        size="sm"
                                                    >
                                                        <option value="">-- Select Product --</option>
                                                        {allProducts.filter(p => p.id !== product?.id).map(p => (
                                                            <option key={p.id} value={p.id}>📦 {p.name} (${p.price})</option>
                                                        ))}
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="col-span-2">
                                                        <label className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">Bump Offer Title *</label>
                                                        <Input
                                                            size="sm"
                                                            type="text"
                                                            value={data.order_bump?.title||''}
                                                            onChange={(e)=>setData('order_bump',{...data.order_bump,title:e.target.value})}
                                                            placeholder="Yes, Add 1-on-1 Strategy Call!"
                                                            className="font-semibold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">Bump Price ($)</label>
                                                        <Input
                                                            size="sm"
                                                            type="number"
                                                            step="0.01"
                                                            value={data.order_bump?.price||'5.00'}
                                                            onChange={(e)=>setData('order_bump',{...data.order_bump,price:e.target.value})}
                                                            placeholder="5.00"
                                                            className="font-bold text-emerald-600 dark:text-emerald-400"
                                                        />
                                                    </div>
                                                </div>
                                                <textarea rows={2} value={data.order_bump?.description||''}
                                                    onChange={(e)=>setData('order_bump',{...data.order_bump,description:e.target.value})}
                                                    placeholder="One-time offer! Get instant access to 50+ premium templates..."
                                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs"
                                                />
                                                {!data.order_bump?.product_id && (
                                                    <MediaUpload
                                                        label="Upsell Bonus File (Custom)"
                                                        value={data.order_bump?.file_url||''}
                                                        onChange={(url)=>setData('order_bump',{...data.order_bump,file_url:url})}
                                                        accept=".pdf,.zip,.mp4,.mp3"
                                                        collection="order_bump_files"
                                                        placeholder="Upload bonus file..."
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Social Proof & Trust ── */}
                                    <div className="space-y-5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Social Proof & Trust
                                        </h3>

                                        {/* Media Gallery */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                                <Images className="h-3.5 w-3.5 text-emerald-500" /> Product Gallery
                                            </label>
                                            <MediaUpload label="Add Showcase Image" value=""
                                                onChange={(url)=>{ if(url) setData('gallery',[...(data.gallery||[]),url]); }}
                                                accept="image/*" collection="product_gallery" placeholder="Upload or paste image URL..."
                                            />
                                            {data.gallery && data.gallery.length > 0 && (
                                                <div className="grid grid-cols-4 gap-2 pt-1">
                                                    {data.gallery.map((img,idx)=>(
                                                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 aspect-square">
                                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                                            <button type="button" onClick={()=>removeGalleryImage(idx)} className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* FAQs */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                                <HelpCircle className="h-3.5 w-3.5 text-emerald-500" /> FAQs
                                            </label>
                                            <button type="button" onClick={addFaq}
                                                className="w-full p-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 transition"
                                            >
                                                <HelpCircle className="h-4 w-4 text-emerald-500" /> + Add FAQ
                                            </button>
                                            {data.faqs.map((faq,idx)=>(
                                                <div key={idx} className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2 relative">
                                                    <button type="button" onClick={()=>removeFaq(idx)} className="absolute top-3 right-3 text-neutral-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                                    <Input
                                                        size="sm"
                                                        type="text"
                                                        value={faq.question||''}
                                                        onChange={(e)=>{ const arr=[...data.faqs]; arr[idx].question=e.target.value; setData('faqs',arr); }}
                                                        placeholder="e.g. How do I access files after purchase?"
                                                        className="font-medium"
                                                    />
                                                    <textarea rows={2} value={faq.answer||''}
                                                        onChange={(e)=>{ const arr=[...data.faqs]; arr[idx].answer=e.target.value; setData('faqs',arr); }}
                                                        placeholder="Answer detail..."
                                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Testimonials */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                                <Quote className="h-3.5 w-3.5 text-emerald-500" /> Customer Testimonials
                                            </label>
                                            <button type="button" onClick={addReview}
                                                className="w-full p-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 transition"
                                            >
                                                <Star className="h-4 w-4 text-emerald-500 fill-emerald-500" /> + Add Testimonial
                                            </button>
                                            {data.reviews && data.reviews.map((rev,idx)=>(
                                                <div key={idx} className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2 relative">
                                                    <button type="button" onClick={()=>removeReview(idx)} className="absolute top-3 right-3 text-neutral-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                                    <div className="grid grid-cols-2 gap-2 pr-6">
                                                        <Input
                                                            size="sm"
                                                            type="text"
                                                            value={rev.name||''}
                                                            onChange={(e)=>{ const arr=[...data.reviews]; arr[idx].name=e.target.value; setData('reviews',arr); }}
                                                            placeholder="Sarah J."
                                                            className="font-semibold"
                                                        />
                                                        <Select value={rev.rating||5}
                                                            onChange={(e)=>{ const arr=[...data.reviews]; arr[idx].rating=parseInt(e.target.value)||5; setData('reviews',arr); }}
                                                            size="sm"
                                                            className="font-bold text-amber-500"
                                                        >
                                                            <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                                                            <option value="4">⭐⭐⭐⭐ (4/5)</option>
                                                            <option value="3">⭐⭐⭐ (3/5)</option>
                                                        </Select>
                                                    </div>
                                                    <Input
                                                        size="sm"
                                                        type="text"
                                                        value={rev.role||''}
                                                        onChange={(e)=>{ const arr=[...data.reviews]; arr[idx].role=e.target.value; setData('reviews',arr); }}
                                                        placeholder="Verified Buyer"
                                                    />
                                                    <textarea rows={2} value={rev.text||''}
                                                        onChange={(e)=>{ const arr=[...data.reviews]; arr[idx].text=e.target.value; setData('reviews',arr); }}
                                                        placeholder="Highly recommended! Worth every penny..."
                                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* About Me */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 text-emerald-500" /> About Me & Custom Message
                                            </label>
                                            <Input
                                                size="sm"
                                                type="text"
                                                value={data.about_me?.headline||''}
                                                onChange={(e)=>setData('about_me',{...data.about_me,headline:e.target.value})}
                                                placeholder="Hi, I'm Alex — Creator & Educator"
                                                className="font-semibold"
                                            />
                                            <textarea rows={2} value={data.about_me?.bio||''}
                                                onChange={(e)=>setData('about_me',{...data.about_me,bio:e.target.value})}
                                                placeholder="Short bio e.g. I help creators build digital businesses..."
                                                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-xs"
                                            />
                                            <Input
                                                size="sm"
                                                type="text"
                                                value={data.about_me?.custom_message||''}
                                                onChange={(e)=>setData('about_me',{...data.about_me,custom_message:e.target.value})}
                                                placeholder="⚡ Special Launch Offer — Instant Delivery!"
                                                className="text-emerald-600 dark:text-emerald-400 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 flex items-center justify-between shrink-0">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-white flex items-center gap-1"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Back
                                </button>
                            ) : (
                                <div />
                            )}

                            {step < 2 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step + 1)}
                                    className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs hover:opacity-90 transition flex items-center gap-1.5"
                                >
                                    Next Step <ChevronRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                                >
                                    <Check className="h-4 w-4" /> {isEdit ? 'Update Product' : 'Publish Product'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* RIGHT: WhatsMine Real-Time Device Canvas */}
                <div className="flex-1 bg-neutral-950 p-6 md:p-10 flex flex-col items-center justify-center overflow-y-auto relative">
                    <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> WhatsMine Live Device Preview
                    </div>

                    {/* Preview Frame Container */}
                    <div className={`transition-all duration-300 rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl flex flex-col ${
                        previewDevice === 'mobile' ? 'w-[375px] h-[680px]' : 'w-full max-w-4xl h-[680px]'
                    }`}>
                        {/* WhatsMine Mock Browser Header */}
                        <div className="h-9 bg-neutral-950 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                            </div>
                            <div title={displayUrl} className="px-3 py-0.5 rounded-full bg-neutral-900 text-[10px] text-neutral-400 font-mono border border-neutral-800 truncate max-w-[300px]">
                                {displayUrl}
                            </div>
                            <div className="w-8" />
                        </div>

                        {/* Public Page Glassmorphism Canvas */}
                        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex flex-col">
                            <ProductLandingView
                                data={data}
                                store={nativeStore}
                                isLive={false}
                                previewDevice={previewDevice}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
