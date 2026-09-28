import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Sparkles, Sun, Moon, AlertCircle } from 'lucide-react';
import ProductLandingView from '@/Components/Ecommerce/ProductLandingView';
import { useTheme } from '@/context/ThemeContext';

export default function StorefrontShow({ store, product }) {
    const { theme, setTheme } = useTheme();
    const [errorMsg, setErrorMsg] = useState('');
    const [statusNotice, setStatusNotice] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_status') === 'cancelled') {
            setStatusNotice('Payment was cancelled. You have not been charged.');
        }
    }, []);

    const handleCheckoutSubmit = async (formData) => {
        setErrorMsg('');
        setStatusNotice('');
        setProcessing(true);

        try {
            const res = await fetch(route('public.storefront.checkout', store.slug || store.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    shipping_address: formData.address,
                    payment_method: 'card',
                    include_order_bump: formData.includeOrderBump,
                    coupon_code: formData.appliedCoupon ? formData.appliedCoupon.code : null,
                    items: [{ product_id: product.id, quantity: 1 }]
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to complete order checkout.');
            }

            if (data.redirect_url) {
                window.location.href = data.redirect_url;
            }
        } catch (err) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
            setProcessing(false);
        }
    };

    return (
        <div className={theme === 'dark' ? 'dark' : ''}>
            <Head title={`${product.name} — ${store.name}`} />

            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-300">
                {/* Header Navbar */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 px-6 py-3.5 flex items-center justify-between">
                    <Link href={route('public.storefront.index', store.slug || store.id)} className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-emerald-500 transition">
                        <ArrowLeft className="h-4 w-4" /> Storefront Catalog
                    </Link>

                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> WhatsMine Digital Vault
                        </span>

                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                            title="Toggle Light/Dark Theme"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />}
                        </button>
                    </div>
                </header>

                {/* Cancellation / Failure Alert */}
                {statusNotice && (
                    <div className="max-w-7xl mx-auto px-6 pt-4">
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" /> {statusNotice}
                        </div>
                    </div>
                )}

                {/* Error Alert */}
                {errorMsg && (
                    <div className="max-w-7xl mx-auto px-6 pt-4">
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto min-h-[calc(100vh-3.5rem)]">
                    <ProductLandingView
                        product={product}
                        store={store}
                        isLive={true}
                        processing={processing}
                        onCheckoutSubmit={handleCheckoutSubmit}
                    />
                </div>
            </div>
        </div>
    );
}
