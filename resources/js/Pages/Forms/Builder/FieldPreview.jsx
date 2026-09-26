import {
    Star, GripVertical, SlidersHorizontal, Copy, Trash2, Calendar, Upload, Check,
    ChevronDown, PenTool, Image as ImageIcon, Lock, ShieldCheck, FileCheck, Sliders,
    ShoppingBag, Package, Zap, Tag, CreditCard, Sparkles, ArrowRight, CheckCircle2
} from 'lucide-react';
import InlineText from '@/Components/VisualBuilder/InlineText';
import DatePicker from '@/Components/ui/DatePicker';

const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition duration-150';

function StarRating({ count = 5 }) {
    return (
        <div className="flex gap-1.5 items-center">
            {Array.from({ length: count }).map((_, i) => (
                <Star key={i} className={`w-5 h-5 transition ${i < 3 ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`} />
            ))}
        </div>
    );
}

export default function FieldPreview({
    field,
    isSelected,
    onClick,
    dragHandleProps,
    onUpdateField,
    onDuplicate,
    onDelete,
}) {
    const alignCls = field.align === 'center' ? 'text-center' : field.align === 'right' ? 'text-right' : 'text-left';
    const flexAlignCls = field.align === 'center' ? 'justify-center' : field.align === 'right' ? 'justify-end' : 'justify-start';
    const flexItemsCls = field.align === 'center' ? 'items-center' : field.align === 'right' ? 'items-end' : 'items-start';
    const customTextColor = field.color || undefined;

    const plainLabel = field.label ? field.label.replace(/<[^>]*>?/gm, '').trim() : '';

    const renderInput = () => {
        const fieldInputCls = `${inputCls} ${alignCls}`;

        switch (field.type) {
            case 'order_2step': {
                const isBumpActive = field.orderBumpEnabled !== false;
                const basePrice = parseFloat(field.productPrice || '49.00') || 49.00;
                const bumpPrice = isBumpActive ? (parseFloat(field.orderBumpPrice || '19.00') || 19.00) : 0;
                const totalPreview = (basePrice + bumpPrice).toFixed(2);

                return (
                    <div className="w-full space-y-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30 p-4">
                        {/* 2-Step Tabs Header */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold text-center">
                            <div className="py-1.5 px-2 bg-white dark:bg-neutral-700 text-brand-600 dark:text-brand-400 rounded-md shadow-xs flex items-center justify-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">1</span>
                                <span>{field.step1Title || '1. Contact Info'}</span>
                            </div>
                            <div className="py-1.5 px-2 text-neutral-500 dark:text-neutral-400 flex items-center justify-center gap-1.5 opacity-75">
                                <span className="w-4 h-4 rounded-full bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-[10px]">2</span>
                                <span>{field.step2Title || '2. Products & Pay'}</span>
                            </div>
                        </div>

                        {/* Step 2 Simulation Preview */}
                        <div className="space-y-3 pt-1">
                            {/* Product Selection List Item */}
                            <div className="p-3 rounded-lg border-2 border-brand-500/80 bg-white dark:bg-neutral-800 flex items-center justify-between shadow-xs">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-4 h-4 rounded-full border-2 border-brand-500 flex items-center justify-center">
                                        <span className="w-2 h-2 rounded-full bg-brand-500" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{field.productTitle || 'Standard Access Plan'}</p>
                                        <p className="text-[11px] text-neutral-500">{field.productSubtitle || 'Instant digital access & updates'}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100">${basePrice.toFixed(2)}</span>
                            </div>

                            {/* Order Bump Glowing Box */}
                            {isBumpActive && (
                                <div className="relative p-3.5 rounded-xl border-2 border-dashed border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-500 text-white shadow-xs">
                                            <Zap className="w-3 h-3 fill-white" />
                                            {field.orderBumpBadge || 'ONE-TIME OFFER - 80% OFF'}
                                        </span>
                                        <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">+${parseFloat(field.orderBumpPrice || '19.00').toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-start gap-2 pt-0.5">
                                        <span className="w-4 h-4 mt-0.5 rounded border-2 border-amber-500 bg-amber-500 text-white flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        </span>
                                        <div className="text-xs">
                                            <p className="font-bold text-neutral-900 dark:text-neutral-100">{field.orderBumpTitle || 'Yes! Add the VIP Bonus Pack'}</p>
                                            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5">{field.orderBumpDescription || 'Get lifetime access to the quickstart toolkit & bonus resources.'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method Preview Section */}
                            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-brand-600" />
                                        Payment Method
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        256-Bit SSL Encrypted
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                                        <span>Credit / Debit Card</span>
                                        <div className="flex gap-1 text-[9px] font-black uppercase">
                                            <span className="px-1 py-0.5 bg-[#1a1f71] text-white rounded">VISA</span>
                                            <span className="px-1 py-0.5 bg-[#eb001b] text-white rounded">MC</span>
                                            <span className="px-1 py-0.5 bg-[#006fcf] text-white rounded">AMEX</span>
                                        </div>
                                    </div>
                                    <input type="text" placeholder="Cardholder Name" className="w-full text-xs px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800" readOnly />
                                    <input type="text" placeholder="4000 1234 5678 9010" className="w-full text-xs px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800" readOnly />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" placeholder="MM / YY" className="w-full text-xs px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800" readOnly />
                                        <input type="password" placeholder="CVC" className="w-full text-xs px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800" readOnly />
                                    </div>
                                </div>
                            </div>

                            {/* Total & Button */}
                            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                <span>Order Total:</span>
                                <span className="text-sm text-brand-600 dark:text-brand-400 font-extrabold">${totalPreview}</span>
                            </div>
                            <button
                                type="button"
                                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition"
                            >
                                <Lock className="w-3.5 h-3.5" />
                                {field.step2ButtonText || 'Complete Order 🔒'}
                            </button>
                        </div>
                    </div>
                );
            }

            case 'product_select': {
                const hasCustomPrices = Array.isArray(field.prices) && field.prices.length > 0;
                const tier1Title = field.productTitle || 'Primary Product / Tier';
                const tier1Sub = field.productSubtitle || 'Selected product plan';
                const tier1Price = parseFloat(field.productPrice || '49.00').toFixed(2);
                const tier2Title = field.tier2Title || 'Annual VIP Upgrade';
                const tier2Sub = field.tier2Subtitle || 'Save 20% with annual billing';
                const tier2Price = field.tier2Price || '390.00';

                return (
                    <div className="w-full space-y-2">
                        {hasCustomPrices ? (
                            field.prices.map((pTier, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg border flex items-center justify-between shadow-xs transition ${
                                        idx === 0 ? 'border-2 border-brand-500/80 bg-white dark:bg-neutral-800' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 opacity-80'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${idx === 0 ? 'border-brand-500' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                            {idx === 0 && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                                        </span>
                                        {field.imageUrl && (
                                            <img src={field.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover border border-neutral-200 dark:border-neutral-700 shrink-0" />
                                        )}
                                        <div>
                                            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{pTier.name || `Tier ${idx + 1}`}</p>
                                            <p className="text-[11px] text-neutral-500">
                                                {pTier.description || (pTier.pricing_type === 'recurring' ? `Billed every ${pTier.billing_interval || 'month'}` : (pTier.pricing_type === 'installments' ? `${pTier.installment_count || 3} installments` : 'One-time payment'))}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                                        ${parseFloat(pTier.price || 0).toFixed(2)}
                                        {pTier.pricing_type === 'recurring' ? `/${pTier.billing_interval === 'year' ? 'yr' : 'mo'}` : ''}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="p-3 rounded-lg border-2 border-brand-500/80 bg-white dark:bg-neutral-800 flex items-center justify-between shadow-xs">
                                    <div className="flex items-center gap-2.5">
                                        {field.imageUrl && (
                                            <img src={field.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover border border-neutral-200 dark:border-neutral-700 shrink-0" />
                                        )}
                                        <span className="w-4 h-4 rounded-full border-2 border-brand-500 flex items-center justify-center shrink-0">
                                            <span className="w-2 h-2 rounded-full bg-brand-500" />
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{tier1Title}</p>
                                            <p className="text-[11px] text-neutral-500">{tier1Sub}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100">${tier1Price}</span>
                                </div>
                                {tier2Title && tier2Title !== '' && (
                                    <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-between opacity-75">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{tier2Title}</p>
                                                <p className="text-[11px] text-neutral-500">{tier2Sub}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100">${tier2Price}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            }

            case 'order_bump':
                return (
                    <div className="relative w-full p-3.5 rounded-xl border-2 border-dashed border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 space-y-1.5 select-none">
                        <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-500 text-white shadow-xs">
                                <Zap className="w-3 h-3 fill-white" />
                                {field.badgeText || 'SPECIAL ONE-TIME OFFER'}
                            </span>
                            <span className="text-xs font-black text-amber-800 dark:text-amber-300">+${field.price || '19.00'}</span>
                        </div>
                        <div className="flex items-start gap-2.5 pt-0.5">
                            <span className="w-4 h-4 mt-0.5 rounded border-2 border-amber-500 bg-amber-500 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                            <div className="text-xs flex-1">
                                <InlineText
                                    as="p"
                                    singleLine
                                    html={field.headline || 'Yes! Add This Exclusive Bonus'}
                                    onChange={(val) => onUpdateField && onUpdateField({ ...field, headline: val })}
                                    placeholder="Yes! Add This Exclusive Bonus"
                                    className="font-bold text-neutral-900 dark:text-neutral-100 cursor-text outline-none"
                                />
                                <InlineText
                                    as="p"
                                    html={field.description || 'Get our comprehensive blueprint and templates at an exclusive one-time discount.'}
                                    onChange={(val) => onUpdateField && onUpdateField({ ...field, description: val })}
                                    placeholder="Offer details description..."
                                    className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed cursor-text outline-none"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'coupon_code':
                return (
                    <div className="w-full flex gap-2">
                        <input
                            type="text"
                            placeholder={field.placeholder || 'Enter coupon or promo code'}
                            className="flex-1 px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 uppercase font-mono placeholder:normal-case"
                            readOnly
                        />
                        <button
                            type="button"
                            className="px-3.5 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs rounded-lg shrink-0 shadow-xs"
                        >
                            {field.buttonText || 'Apply'}
                        </button>
                    </div>
                );

            case 'email':
                return <input id={`builder_input_${field.id}`} type="email" placeholder={field.placeholder || 'your@email.com'} className={fieldInputCls} style={{ color: customTextColor }} readOnly />;
            case 'first_name':
            case 'last_name':
            case 'text':
            case 'tel':
            case 'number':
                return <input id={`builder_input_${field.id}`} type="text" placeholder={field.placeholder || plainLabel} className={fieldInputCls} style={{ color: customTextColor }} readOnly />;
            case 'phone_e164':
                return <input id={`builder_input_${field.id}`} type="tel" placeholder={field.placeholder || '+1 234 567 8900'} className={fieldInputCls} style={{ color: customTextColor }} readOnly />;
            case 'textarea':
                return <textarea id={`builder_input_${field.id}`} rows={3} placeholder={field.placeholder || plainLabel} className={`${fieldInputCls} resize-none`} style={{ color: customTextColor }} readOnly />;
            case 'date':
                return (
                    <div onClick={(e) => e.stopPropagation()} className="w-full">
                        <DatePicker
                            id={`builder_input_${field.id}`}
                            placeholder={field.placeholder || 'Select date'}
                            className="w-full"
                        />
                    </div>
                );
            case 'select':
                return (
                    <div className="relative w-full">
                        <select id={`builder_input_${field.id}`} className={`${fieldInputCls} appearance-none pr-9 cursor-pointer`} style={{ color: customTextColor }}>
                            <option>{field.placeholder || `Select ${plainLabel}`}</option>
                            {(field.options || []).map((o, i) => <option key={i}>{o}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                    </div>
                );
            case 'radio':
                return (
                    <div className={`flex flex-col space-y-2.5 ${flexItemsCls} w-full`}>
                        {(field.options?.length ? field.options : ['Option 1', 'Option 2']).map((o, i) => (
                            <label key={i} htmlFor={`builder_input_${field.id}_opt_${i}`} className="flex items-center gap-2.5 text-sm text-neutral-700 dark:text-neutral-300 select-none cursor-pointer">
                                <input type="radio" id={`builder_input_${field.id}_opt_${i}`} name={`builder_radio_${field.id}`} checked={i === 0} readOnly className="sr-only" />
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${i === 0 ? 'border-emerald-500 bg-white dark:bg-neutral-800' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                    {i === 0 && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                                </span>
                                <InlineText
                                    as="span"
                                    singleLine
                                    html={o}
                                    onChange={(val) => {
                                        const nextOptions = [...(field.options || ['Option 1', 'Option 2'])];
                                        nextOptions[i] = val;
                                        onUpdateField && onUpdateField({ ...field, options: nextOptions });
                                    }}
                                    placeholder={`Option ${i + 1}`}
                                    className="text-sm font-medium cursor-text outline-none"
                                    style={{ color: customTextColor }}
                                />
                            </label>
                        ))}
                    </div>
                );
            case 'checkbox':
                return (
                    <div className={`flex items-start gap-2.5 ${flexAlignCls} w-full`}>
                        <label htmlFor={`builder_input_${field.id}`} className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300 select-none w-full cursor-pointer">
                            <input type="checkbox" id={`builder_input_${field.id}`} checked readOnly className="sr-only" />
                            <span className="w-4 h-4 mt-0.5 rounded-md border border-emerald-500 bg-emerald-500 flex items-center justify-center text-white shadow-xs shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                            <InlineText
                                as="div"
                                html={field.label || ''}
                                onChange={(val) => onUpdateField && onUpdateField({ ...field, label: val })}
                                placeholder="I agree to the terms"
                                className="text-sm font-medium leading-relaxed cursor-text flex-1 outline-none"
                                style={{ color: customTextColor }}
                            />
                        </label>
                    </div>
                );
            case 'multi_checkbox':
                return (
                    <div className={`flex flex-col space-y-2.5 ${flexItemsCls} w-full`}>
                        {(field.options?.length ? field.options : ['Option A', 'Option B', 'Option C']).map((o, i) => (
                            <label key={i} htmlFor={`builder_input_${field.id}_chk_${i}`} className="flex items-center gap-2.5 text-sm text-neutral-700 dark:text-neutral-300 select-none cursor-pointer">
                                <input type="checkbox" id={`builder_input_${field.id}_chk_${i}`} checked={i === 0} readOnly className="sr-only" />
                                <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${i === 0 ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                    {i === 0 && <Check className="w-3 h-3 stroke-[3]" />}
                                </span>
                                <InlineText
                                    as="span"
                                    singleLine
                                    html={o}
                                    onChange={(val) => {
                                        const nextOptions = [...(field.options || ['Option A', 'Option B', 'Option C'])];
                                        nextOptions[i] = val;
                                        onUpdateField && onUpdateField({ ...field, options: nextOptions });
                                    }}
                                    placeholder={`Option ${i + 1}`}
                                    className="text-sm font-medium cursor-text outline-none"
                                    style={{ color: customTextColor }}
                                />
                            </label>
                        ))}
                    </div>
                );
            case 'file':
                return (
                    <label htmlFor={`builder_input_${field.id}`} className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50/70 dark:bg-neutral-800/40 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 px-4 py-5 transition cursor-pointer select-none">
                        <input type="file" id={`builder_input_${field.id}`} className="sr-only" />
                        <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-700/60 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                            <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-neutral-600 dark:text-neutral-300 text-center">
                            Drag & drop or <span className="text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-2">browse</span>
                        </span>
                        <span className="text-[11px] text-neutral-400">
                            Images, PDF, Documents · max 50 MB
                        </span>
                    </label>
                );
            case 'rating':
                return (
                    <div className={`flex ${flexAlignCls}`}>
                        <StarRating count={field.maxRating || 5} />
                    </div>
                );
            case 'scale':
                return (
                    <div className="w-full space-y-1.5">
                        <div className={`flex items-center gap-1 overflow-x-auto py-1 ${flexAlignCls}`}>
                            {Array.from({ length: (field.maxScale || 10) - (field.minScale || 1) + 1 }).map((_, i) => {
                                const val = (field.minScale || 1) + i;
                                return (
                                    <button
                                        key={val}
                                        type="button"
                                        className={`w-8 h-8 rounded-lg text-xs font-semibold border transition ${val === 8 ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-emerald-500'}`}
                                    >
                                        {val}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[11px] text-neutral-400 dark:text-neutral-500 px-0.5">
                            <InlineText
                                as="span"
                                singleLine
                                html={field.minLabel || 'Not likely'}
                                onChange={(val) => onUpdateField && onUpdateField({ ...field, minLabel: val })}
                                placeholder="Not likely"
                                className="cursor-text outline-none"
                            />
                            <InlineText
                                as="span"
                                singleLine
                                html={field.maxLabel || 'Very likely'}
                                onChange={(val) => onUpdateField && onUpdateField({ ...field, maxLabel: val })}
                                placeholder="Very likely"
                                className="cursor-text outline-none text-right"
                            />
                        </div>
                    </div>
                );
            case 'signature':
                return (
                    <div className="relative w-full h-24 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800/60 flex flex-col items-center justify-center p-3 text-center cursor-pointer select-none">
                        <PenTool className="w-4 h-4 text-neutral-400 mb-1" />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Click or draw signature</span>
                        <div className="absolute bottom-3 left-4 right-4 border-b border-dashed border-neutral-300 dark:border-neutral-600" />
                        <span className="absolute bottom-1 right-3 text-[10px] text-neutral-400">Clear</span>
                    </div>
                );
            case 'image':
                return (
                    <div className={`w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 ${alignCls}`}>
                        <img
                            src={field.imageUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80'}
                            alt={field.imageAlt || 'Form media'}
                            className="w-full max-h-48 object-cover rounded-lg"
                        />
                    </div>
                );
            case 'terms':
                return (
                    <div className={`flex items-start gap-2.5 ${flexAlignCls} w-full`}>
                        <div className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 select-none w-full">
                            <span className="w-4 h-4 mt-0.5 rounded-md border border-neutral-300 dark:border-neutral-600 flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 text-transparent" />
                            </span>
                            <InlineText
                                as="div"
                                html={field.termsText || field.label || 'I accept the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.'}
                                onChange={(val) => onUpdateField && onUpdateField({ ...field, termsText: val, label: val })}
                                placeholder="I accept the Terms of Service and Privacy Policy"
                                className="leading-relaxed cursor-text flex-1 outline-none text-xs"
                                style={{ color: customTextColor }}
                            />
                        </div>
                    </div>
                );
            case 'captcha':
                return (
                    <div className={`flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 ${flexAlignCls}`}>
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Protected by <strong>Spam Protection</strong> (reCAPTCHA / Turnstile)</span>
                    </div>
                );
            case 'hidden':
                return (
                    <div className="text-xs text-neutral-400 dark:text-neutral-500 italic border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 bg-neutral-50/50 dark:bg-neutral-900/50">
                        Hidden field — value: {field.defaultValue || '(empty)'}
                    </div>
                );
            case 'heading': {
                return (
                    <InlineText
                        as="h2"
                        html={field.content || field.label || 'Subscribe to our Newsletter'}
                        onChange={(val) => onUpdateField && onUpdateField({ ...field, content: val })}
                        placeholder="Subscribe to our Newsletter"
                        className={`w-full text-base font-bold text-neutral-800 dark:text-neutral-100 py-0.5 outline-none ${alignCls}`}
                        style={{ color: customTextColor }}
                    />
                );
            }
            case 'divider':
                return <hr className="border-neutral-200 dark:border-neutral-700 my-1" />;
            case 'paragraph': {
                return (
                    <InlineText
                        as="p"
                        html={field.content || field.label || 'Enter your email and phone to receive our latest updates...'}
                        onChange={(val) => onUpdateField && onUpdateField({ ...field, content: val })}
                        placeholder="Enter your email and phone to receive our latest updates..."
                        className={`w-full text-sm text-neutral-600 dark:text-neutral-400 py-0.5 outline-none ${alignCls}`}
                        style={{ color: customTextColor }}
                    />
                );
            }
            case 'button': {
                const btnBg = field.backgroundColor || '#16a34a';
                const btnText = field.buttonText || field.label || 'Button';
                const btnColor = field.textColor || '#ffffff';
                const btnRadius = field.borderRadius !== undefined ? `${field.borderRadius}px` : '12px';
                const btnWidth = field.width === 'auto' ? 'w-auto px-8' : 'w-full';
                const btnAlignCls = field.align === 'center' ? 'justify-center' : field.align === 'right' ? 'justify-end' : 'justify-start';

                return (
                    <div className={`flex ${btnAlignCls} w-full my-1`}>
                        <div
                            style={{
                                backgroundColor: btnBg,
                                color: btnColor,
                                borderRadius: btnRadius,
                                fontSize: field.fontSize ? `${field.fontSize}px` : '14px',
                                fontWeight: field.fontWeight || '600',
                            }}
                            className={`${btnWidth} py-2.5 text-center shadow-xs transition hover:opacity-90 select-none flex items-center justify-center`}
                        >
                            <InlineText
                                as="span"
                                singleLine
                                html={btnText}
                                onChange={(val) => onUpdateField && onUpdateField({ ...field, buttonText: val, label: val })}
                                placeholder="Button"
                                className="outline-none cursor-text w-full text-center"
                                style={{ color: btnColor }}
                            />
                        </div>
                    </div>
                );
            }
            case 'gdpr':
                return (
                    <div className={`flex items-start gap-2.5 ${flexAlignCls} w-full`}>
                        <div className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 select-none w-full">
                            <span className="w-4 h-4 mt-0.5 rounded-md border border-neutral-300 dark:border-neutral-600 flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 text-transparent" />
                            </span>
                            <InlineText
                                as="div"
                                html={field.gdprText || 'I agree to receive updates and promotional offers.'}
                                onChange={(val) => onUpdateField && onUpdateField({ ...field, gdprText: val })}
                                placeholder="I agree to receive updates and promotional offers."
                                className="leading-relaxed cursor-text flex-1 outline-none text-xs"
                                style={{ color: customTextColor }}
                            />
                        </div>
                    </div>
                );
            case 'double_optin':
                return (
                    <div className={`flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 ${flexAlignCls}`}>
                        <span>🔒</span>
                        <span>Double OTP verification via <strong>{field.channel || 'WhatsApp'}</strong> enabled</span>
                    </div>
                );
            default:
                return <input type="text" placeholder={field.placeholder || plainLabel} className={fieldInputCls} style={{ color: customTextColor }} readOnly />;
        }
    };

    const isStandard = ['email', 'first_name', 'last_name', 'phone_e164'].includes(field.type);
    const isElement = ['heading', 'divider', 'paragraph', 'image', 'button'].includes(field.type);
    const isCompliance = ['gdpr', 'double_optin', 'terms', 'captcha'].includes(field.type);
    const showLabel = !isElement && !isCompliance && field.type !== 'checkbox' && field.showLabel !== false;

    const wrapperStyle = {
        marginTop: field.marginTop !== undefined && field.marginTop !== '' ? `${field.marginTop}px` : undefined,
        marginBottom: field.marginBottom !== undefined && field.marginBottom !== '' ? `${field.marginBottom}px` : undefined,
        marginLeft: field.marginLeft !== undefined && field.marginLeft !== '' ? `${field.marginLeft}px` : undefined,
        marginRight: field.marginRight !== undefined && field.marginRight !== '' ? `${field.marginRight}px` : undefined,
        paddingTop: field.paddingTop !== undefined && field.paddingTop !== '' ? `${field.paddingTop}px` : (isElement ? '2px' : '4px'),
        paddingBottom: field.paddingBottom !== undefined && field.paddingBottom !== '' ? `${field.paddingBottom}px` : (isElement ? '2px' : '4px'),
        paddingLeft: field.paddingLeft !== undefined && field.paddingLeft !== '' ? `${field.paddingLeft}px` : (isElement ? '2px' : '4px'),
        paddingRight: field.paddingRight !== undefined && field.paddingRight !== '' ? `${field.paddingRight}px` : (isElement ? '2px' : '4px'),
    };

    return (
        <div
            onClick={onClick}
            style={wrapperStyle}
            className={`group/field relative rounded-lg bg-white dark:bg-neutral-850 cursor-pointer transition-all duration-150 ${
                isSelected
                    ? 'border-2 border-emerald-600 bg-emerald-50/5 dark:bg-emerald-950/10 shadow-sm'
                    : 'border-2 border-transparent hover:border-emerald-600/70'
            } w-full`}
        >
            {/* ── Top-Right Floating Action Pill Bar ── */}
            <div
                className={`absolute right-2 -top-3 z-30 flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-0.5 shadow-md transition-all ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover/field:opacity-100'
                }`}
            >
                {dragHandleProps && (
                    <div
                        {...dragHandleProps}
                        title="Drag handle"
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab rounded"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-3.5 w-3.5" />
                    </div>
                )}

                <button
                    type="button"
                    title="Field Settings"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick?.();
                    }}
                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>

                {onDuplicate && (
                    <button
                        type="button"
                        title="Duplicate Field"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate(field.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </button>
                )}

                {onDelete && (
                    <button
                        type="button"
                        title="Delete Field"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(field.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <div>
                {showLabel && (
                    <div className={`flex items-center gap-0.5 mb-1 ${alignCls}`}>
                        <InlineText
                            as="label"
                            htmlFor={`builder_input_${field.id}`}
                            singleLine
                            html={field.label || ''}
                            onChange={(val) => onUpdateField && onUpdateField({ ...field, label: val })}
                            placeholder="Field Label"
                            className={`text-xs font-semibold cursor-text inline-block outline-none ${customTextColor ? '' : 'text-neutral-700 dark:text-neutral-300'}`}
                            style={{ color: customTextColor }}
                        />
                        {field.required && <span className="text-red-500 text-xs ml-0.5 select-none">*</span>}
                    </div>
                )}
                {renderInput()}
            </div>
        </div>
    );
}
