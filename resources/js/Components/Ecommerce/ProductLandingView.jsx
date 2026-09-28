import { Badge, Button, Card, Checkbox, Input } from '@/Components/ui';
import {
  Check,
  Lock,
  Package,
  ShieldCheck,
  Sparkles,
  Zap,
  Tag,
  Gift
} from 'lucide-react';
import { useState } from 'react';
import { usePage } from '@inertiajs/react';

function FaqItem({ question, answer }) {
    const [open, setOpen] = useState(true);
    return (
        <Card padding={false} className="p-3.5 bg-white dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800 space-y-1.5 text-xs shadow-sm">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between font-bold text-neutral-900 dark:text-neutral-100 text-left text-xs"
            >
                <span>{question}</span>
                <span className="text-neutral-400 dark:text-neutral-500 text-base">{open ? '−' : '+'}</span>
            </button>
            {open && (
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px] pt-1.5 border-t border-neutral-100 dark:border-neutral-800/80">
                    {answer}
                </p>
            )}
        </Card>
    );
}

export default function ProductLandingView({
    product,
    data,
    store,
    isLive = false,
    previewDevice = 'desktop',
    onCheckoutSubmit,
    checkoutState = {},
    processing: processingProp = false,
}) {
    // Standardize object reference (support both product or data prop)
    const p = data || product || {};

    // Global workspace currency
    const pageProps = usePage()?.props ?? {};
    const currency = store?.currency_code || pageProps.displayCurrency || 'USD';
    const currencySymbol = (pageProps.currencies ?? []).find(c => c.code === currency)?.symbol
        || (currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$');

    const fmt = (amount) => {
        try {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
        } catch {
            return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
        }
    };

    const [includeOrderBump, setIncludeOrderBump] = useState(false);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');

    const [errors, setErrors] = useState({});

    // Form inputs for live checkout
    const [name, setName] = useState(checkoutState.name || '');
    const [email, setEmail] = useState(checkoutState.email || '');
    const [phone, setPhone] = useState(checkoutState.phone || '');
    const [address, setAddress] = useState(checkoutState.address || '');
    const [processing, setProcessing] = useState(false);

    const buttonText = p.button_text || p.raw?.button_text || 'Pay & Complete Order';
    const storeName = store?.name || 'Native Catalog';

    const faqs = (p.faqs && p.faqs.length > 0) ? p.faqs : (p.raw?.faqs || []);
    const gallery = (p.gallery && p.gallery.length > 0) ? p.gallery : (p.raw?.gallery || []);
    const reviews = (p.reviews && p.reviews.length > 0) ? p.reviews : (p.raw?.reviews || []);
    const aboutMe = p.about_me || p.raw?.about_me || {};
    const orderBumpConfig = p.order_bump || p.raw?.order_bump || {};
    const couponsList = p.coupons || p.raw?.coupons || [];

    const basePrice = p.pricing_type === 'free' ? 0 : parseFloat(p.price || 0);
    const comparePrice = parseFloat(p.compare_price || 0);
    const hasSale = comparePrice > 0 && comparePrice > basePrice;
    const savingsAmount = hasSale ? (comparePrice - basePrice) : 0;
    const savingsPct = hasSale ? Math.round((savingsAmount / comparePrice) * 100) : 0;
    const orderBumpPrice = (includeOrderBump && orderBumpConfig.enabled) ? parseFloat(orderBumpConfig.price || 0) : 0;

    // Human-readable billing frequency label
    const billingLabel = (() => {
        if (p.pricing_type !== 'recurring') return null;
        const interval = p.billing_interval || 'month';
        const count = parseInt(p.billing_interval_count || 1);
        if (interval === 'day') return `every ${count} day${count !== 1 ? 's' : ''}`;
        if (interval === 'month') {
            if (count === 1) return 'monthly';
            if (count === 3) return 'every 3 months (quarterly)';
            if (count === 6) return 'every 6 months (bi-annually)';
            return `every ${count} months`;
        }
        if (interval === 'year') return count === 1 ? 'yearly' : `every ${count} years`;
        return `every ${count} ${interval}(s)`;
    })();

    let discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'percent') {
            discountAmount = basePrice * (parseFloat(appliedCoupon.discount_value || 0) / 100);
        } else {
            discountAmount = parseFloat(appliedCoupon.discount_value || 0);
        }
    }
    discountAmount = Math.min(discountAmount, basePrice);
    const finalTotal = Math.max(0, basePrice - discountAmount + orderBumpPrice);

    const handleApplyCoupon = () => {
        setCouponError('');
        const code = couponInput.trim().toUpperCase();
        if (!code) return;

        const match = couponsList.find(c => (c.code || '').toUpperCase() === code);
        if (match) {
            setAppliedCoupon(match);
            setCouponError('');
        } else {
            setCouponError('Invalid promo coupon code');
        }
    };

    const validate = () => {
        const errs = {};
        if (!name.trim()) {
            errs.name = 'Please enter your full name';
        }
        if (!email.trim()) {
            errs.email = 'Please enter your email address';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errs.email = 'Please enter a valid email address';
        }
        if (!phone.trim()) {
            errs.phone = 'Please enter your WhatsApp phone number';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isLive) return;

        if (!validate()) {
            return;
        }

        if (onCheckoutSubmit) {
            onCheckoutSubmit({
                name,
                email,
                phone,
                address,
                includeOrderBump,
                appliedCoupon,
            });
        }
    };

    const isMobile = previewDevice === 'mobile';

    return (
        <div className={`w-full relative min-h-full font-sans text-neutral-900 dark:text-neutral-100 bg-neutral-50/60 dark:bg-neutral-950 transition-colors duration-300 ${
            isMobile ? 'flex flex-col p-4 space-y-4' : 'grid grid-cols-1 md:grid-cols-12'
        }`}>
            {/* Left Main Product Content Section */}
            <div className={isMobile ? 'w-full space-y-4' : 'md:col-span-7 p-6 space-y-6'}>
                {/* Store Header Badge */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
                        {storeName.charAt(0)}
                    </div>
                    <div>
                        <Badge variant="success" size="sm" className="mb-0.5 gap-1">
                            <ShieldCheck className="h-3 w-3" /> Verified Native Store
                        </Badge>
                        <h3 className="font-bold text-sm md:text-base text-neutral-900 dark:text-white leading-tight">
                            {p.name || 'Product Title Placeholder'}
                        </h3>
                        {/* Price Hero — sale vs original */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {p.pricing_type === 'free' ? (
                                <Badge variant="success" size="md" className="font-bold text-sm">FREE</Badge>
                            ) : (
                                <>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xl leading-none">
                                        {fmt(basePrice)}
                                    </span>
                                    {hasSale && (
                                        <>
                                            <span className="text-neutral-400 dark:text-neutral-500 text-sm line-through font-medium">
                                                {fmt(comparePrice)}
                                            </span>
                                            <Badge variant="danger" size="sm" className="font-bold">
                                                Save {savingsPct}%
                                            </Badge>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Banner / Cover Media */}
                {p.image_url ? (
                    <img
                        src={p.image_url}
                        alt={p.name || ''}
                        className={`w-full object-cover rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md dark:shadow-xl transition duration-300 ${
                            isMobile ? 'h-44' : 'h-64'
                        }`}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400';
                        }}
                    />
                ) : (
                    <div className={`w-full rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-xs ${
                        isMobile ? 'h-44' : 'h-64'
                    }`}>
                        <Package className="h-8 w-8 opacity-40 mr-2" /> Cover Banner Media
                    </div>
                )}

                {/* Description & Overview */}
                <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Overview</h4>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                        {p.description || 'Enter product description to preview overview details here.'}
                    </p>
                </div>

                {/* What You'll Get Box */}
                <Card padding={false} className="p-4 bg-white dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800 space-y-2 text-xs shadow-sm">
                    <h5 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">What you'll get</h5>
                    <div className="flex justify-between text-neutral-500 dark:text-neutral-400 py-1 border-b border-neutral-100 dark:border-neutral-800/60 text-[11px]">
                        <span>Fulfillment Type:</span>
                        <span className="text-neutral-900 dark:text-white font-medium capitalize">{p.digital_fulfillment_type || 'Instant File / URL'}</span>
                    </div>
                    {billingLabel && (
                        <div className="flex justify-between text-neutral-500 dark:text-neutral-400 py-1 border-b border-neutral-100 dark:border-neutral-800/60 text-[11px]">
                            <span>Billed:</span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold capitalize">{billingLabel}</span>
                        </div>
                    )}
                    {p.trial_days > 0 && (
                        <div className="flex justify-between text-neutral-500 dark:text-neutral-400 py-1 border-b border-neutral-100 dark:border-neutral-800/60 text-[11px]">
                            <span>Free Trial:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{p.trial_days} days</span>
                        </div>
                    )}
                    <div className="flex justify-between text-neutral-500 dark:text-neutral-400 py-1 text-[11px]">
                        <span>Access Vault:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Instant Automatic Link
                        </span>
                    </div>
                </Card>

                {/* Dynamic FAQs */}
                {faqs && faqs.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800/80">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Frequently Asked Questions</h4>
                        <div className="space-y-2">
                            {faqs.map((faq, idx) => (
                                <FaqItem key={idx} question={faq.question || 'FAQ Question'} answer={faq.answer || 'FAQ Answer'} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Dynamic Showcase Gallery */}
                {gallery && gallery.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800/80">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Media Showcase Gallery</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {gallery.map((img, idx) => (
                                <img key={idx} src={img} alt="" className="w-full h-20 object-cover rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Dynamic Customer Testimonials */}
                {reviews && reviews.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800/80">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Customer Testimonials</h4>
                        <div className="space-y-2">
                            {reviews.map((rev, idx) => (
                                <Card key={idx} padding={false} className="p-3 bg-white dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 space-y-1 text-xs shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-neutral-900 dark:text-white text-[11px]">{rev.name || 'Anonymous Buyer'}</span>
                                        <span className="text-amber-500 dark:text-amber-400 text-[10px]">
                                            {'★'.repeat(rev.rating || 5)}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-neutral-400 dark:text-neutral-500 block">{rev.role || 'Verified Customer'}</span>
                                    <p className="text-neutral-600 dark:text-neutral-300 text-[10px] italic leading-relaxed pt-0.5">"{rev.text || 'Great digital product!'}"</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dynamic About Me & Announcement Note */}
                {(aboutMe.headline || aboutMe.bio || aboutMe.custom_message) && (
                    <Card padding={false} className="p-4 bg-emerald-50/50 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-neutral-900 dark:to-neutral-950 border-emerald-200 dark:border-emerald-500/30 space-y-1.5 text-xs shadow-sm">
                        {aboutMe.custom_message && (
                            <Badge variant="success" size="sm" className="w-fit font-bold">
                                {aboutMe.custom_message}
                            </Badge>
                        )}
                        {aboutMe.headline && <h5 className="font-bold text-neutral-900 dark:text-white text-xs">{aboutMe.headline}</h5>}
                        {aboutMe.bio && <p className="text-neutral-600 dark:text-neutral-400 text-[10px] leading-relaxed">{aboutMe.bio}</p>}
                    </Card>
                )}
            </div>

            {/* Right Floating Checkout Card */}
            <div className={isMobile ? 'w-full' : 'md:col-span-5 bg-neutral-100/70 dark:bg-gradient-to-br dark:from-emerald-950/20 dark:via-neutral-950 dark:to-neutral-900 p-6 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800/80 flex flex-col justify-start sticky top-0'}>
                <form noValidate onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xl dark:shadow-2xl backdrop-blur-md">
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
                        <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Access link delivered instantly post-checkout
                    </div>

                    <div className="space-y-3">
                        <Input
                            disabled={!isLive}
                            type="text"
                            label="Full Name *"
                            value={name}
                            error={errors.name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                            }}
                            placeholder="John Doe"
                        />
                        <Input
                            disabled={!isLive}
                            type="email"
                            label="Email Address *"
                            value={email}
                            error={errors.email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                            }}
                            placeholder="buyer@gmail.com"
                        />
                        <Input
                            disabled={!isLive}
                            type="text"
                            label="WhatsApp Phone *"
                            value={phone}
                            error={errors.phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                            }}
                            placeholder="+1234567890"
                        />
                    </div>

                    {/* Order Bump Box */}
                    {orderBumpConfig.enabled && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 space-y-1">
                            <Checkbox
                                checked={includeOrderBump}
                                onChange={(e) => setIncludeOrderBump(e.target.checked)}
                                label={
                                    <div className="text-xs">
                                        <span className="font-bold text-neutral-900 dark:text-white block leading-snug">
                                            ADD: {orderBumpConfig.title || 'Special Add-on Offer'} (+{fmt(parseFloat(orderBumpConfig.price || 0))})
                                        </span>
                                        {orderBumpConfig.description && (
                                            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-tight mt-0.5">{orderBumpConfig.description}</p>
                                        )}
                                    </div>
                                }
                            />
                        </div>
                    )}

                    {/* Promo Coupon Code — only shown if seller has added coupons */}
                    {couponsList.length > 0 && <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Have a promo coupon?</label>
                        <div className="flex gap-2 items-end">
                            <Input
                                type="text"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value)}
                                placeholder="COUPON20"
                                className="uppercase text-xs"
                                wrapperClassName="flex-1"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                onClick={handleApplyCoupon}
                                className="shrink-0 font-bold"
                            >
                                Apply
                            </Button>
                        </div>
                        {appliedCoupon && (
                            <Badge variant="success" size="sm" className="mt-1 flex items-center gap-1">
                                <Check className="h-3 w-3" /> Coupon applied: {appliedCoupon.code} ({appliedCoupon.discount_value}% OFF)
                            </Badge>
                        )}
                        {couponError && <span className="text-[10px] text-red-500 dark:text-red-400 font-bold block">{couponError}</span>}
                    </div>}

                    {/* Price Breakdown */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5 text-xs">
                        {hasSale && (
                            <div className="flex justify-between text-neutral-400 dark:text-neutral-500 text-[11px]">
                                <span>Original Price:</span>
                                <span className="line-through">{fmt(comparePrice)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400 text-[11px]">
                            <span>{hasSale ? 'Sale Price:' : 'Product Base:'}</span>
                            <span className="text-neutral-900 dark:text-white font-medium">
                                {p.pricing_type === 'free' ? 'FREE' : fmt(basePrice)}
                            </span>
                        </div>
                        {hasSale && (
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-[11px]">
                                <span>You Save:</span>
                                <span className="font-semibold">-{fmt(savingsAmount)} ({savingsPct}% OFF)</span>
                            </div>
                        )}
                        {appliedCoupon && (
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-[11px]">
                                <span>Discount:</span>
                                <span>-{fmt(discountAmount)}</span>
                            </div>
                        )}
                        {includeOrderBump && orderBumpConfig.enabled && (
                            <div className="flex justify-between text-amber-600 dark:text-amber-400 text-[11px]">
                                <span>Add-on Bump:</span>
                                <span>+{fmt(orderBumpPrice)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-neutral-900 dark:text-white text-sm pt-2 border-t border-neutral-200 dark:border-neutral-800">
                            <span>Total Due:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">{fmt(finalTotal)}</span>
                        </div>
                    </div>

                    <Button
                        type={isLive ? "submit" : "button"}
                        disabled={isLive && (processing || processingProp)}
                        variant="primary"
                        className="w-full py-3 text-sm font-bold shadow-lg gap-2"
                    >
                        {(isLive && (processing || processingProp)) ? (
                            <span>Processing Order...</span>
                        ) : (
                            <>
                                <Zap className="h-4 w-4 fill-current" /> {buttonText}
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
