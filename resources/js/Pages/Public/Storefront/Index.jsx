import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ShoppingBag, Search, Tag, RefreshCw, CreditCard, Gift, Check, X, ShieldCheck, ArrowRight, Package, Truck, Lock, Sun, Moon, Zap } from 'lucide-react';
import { useConfirm } from '@/context/ConfirmationContext';

export default function StorefrontIndex({ store, products = [] }) {
    const { alert } = useConfirm();
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isOrderComplete, setIsOrderComplete] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const [checkoutForm, setCheckoutForm] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        shipping_address: '',
        payment_method: 'card',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem(`whatsmine_cart_${store.id}`);
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Could not parse cart', e);
            }
        }
    }, [store.id]);

    const saveCart = (newCart) => {
        setCart(newCart);
        localStorage.setItem(`whatsmine_cart_${store.id}`, JSON.stringify(newCart));
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            const updated = cart.map(item => 
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
            saveCart(updated);
        } else {
            saveCart([...cart, { ...product, quantity: 1 }]);
        }
        setIsCartOpen(true);
    };

    const handleDirectBuy = (product) => {
        saveCart([{ ...product, quantity: 1 }]);
        setIsCheckoutOpen(true);
    };

    const updateQuantity = (productId, delta) => {
        const updated = cart.map(item => {
            if (item.id === productId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean);
        saveCart(updated);
    };

    const removeFromCart = (productId) => {
        const updated = cart.filter(item => item.id !== productId);
        saveCart(updated);
    };

    const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || p.product_type === selectedCategory || p.pricing_type === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(route('public.ecommerce.checkout', store.slug), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    ...checkoutForm,
                    items: cart.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                    })),
                }),
            });

            const data = await response.json();
            if (response.ok && data.vault_url) {
                window.location.href = data.vault_url;
            } else if (data.success) {
                setCompletedOrder(data);
                setIsOrderComplete(true);
                setCart([]);
                localStorage.removeItem(`whatsmine_cart_${store.id}`);
            } else {
                await alert({
                    title: 'Payment Notice',
                    message: data.message || 'Payment failed.',
                    variant: 'warning',
                });
            }
        } catch (err) {
            await alert({
                title: 'Checkout Error',
                message: 'Order checkout error. Please try again.',
                variant: 'danger',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-200 ${
            isDarkMode 
                ? 'dark bg-neutral-950 text-neutral-100' 
                : 'bg-neutral-50 text-neutral-900'
        }`}>
            <Head title={`${store.name} — Store`} />

            {/* Light / Dark Mode Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {store.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{store.name}</h1>
                            <span className="text-xs text-neutral-500 flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified Native Store</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                            title="Toggle Light / Dark Mode"
                        >
                            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-neutral-600" />}
                        </button>

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                        >
                            <ShoppingBag className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow">
                                    {cart.reduce((a, b) => a + b.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Storefront Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search catalog products..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        {['all', 'physical', 'digital', 'recurring', 'free'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition whitespace-nowrap ${
                                    selectedCategory === cat
                                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold'
                                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Catalog Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
                        <Package className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500 font-medium">No products found in this store catalog.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {filteredProducts.map(p => (
                            <div key={p.id} className="group rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden flex flex-col hover:shadow-lg transition">
                                <Link href={route('public.storefront.show', [store.slug || store.id, p.slug || p.id])} className="aspect-video bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden block">
                                    {p.image_url ? (
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                            <Package className="h-10 w-10 opacity-40" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex gap-1.5">
                                        <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-200 backdrop-blur shadow-sm">
                                            {p.product_type}
                                        </span>
                                    </div>
                                </Link>

                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                    <div>
                                        <Link href={route('public.storefront.show', [store.slug || store.id, p.slug || p.id])} className="hover:text-emerald-600 transition">
                                            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-snug">{p.name}</h3>
                                        </Link>
                                        {p.description && <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{p.description}</p>}
                                    </div>

                                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                                        <div className="flex items-center justify-between">
                                            {p.pricing_type === 'free' ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">FREE</span>
                                            ) : p.pricing_type === 'recurring' ? (
                                                <span className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base">${p.price}<span className="text-xs font-normal text-neutral-500">/{p.billing_interval}</span></span>
                                            ) : p.pricing_type === 'installments' ? (
                                                <span className="font-extrabold text-neutral-900 dark:text-neutral-100 text-sm">{p.installment_count}x ${p.price}</span>
                                            ) : (
                                                <span className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base">${p.price}</span>
                                            )}
                                        </div>

                                        {/* Dual Buttons: Add to Cart & Buy Now */}
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => addToCart(p)}
                                                className="w-full py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition flex items-center justify-center gap-1"
                                            >
                                                Add to Cart
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDirectBuy(p)}
                                                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                                            >
                                                <Zap className="h-3.5 w-3.5" /> Buy Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Slide-over Shopping Cart Drawer */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-neutral-900 h-full flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h2 className="font-bold text-base flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-emerald-600" /> Shopping Cart
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                            {cart.length === 0 ? (
                                <div className="text-center py-16 text-neutral-400">
                                    <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    Your cart is empty.
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.product_id} className="pt-3 flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                                            <span className="text-xs text-neutral-500">${item.price.toFixed(2)} each</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateQuantity(item.product_id, -1)} className="h-7 w-7 rounded bg-neutral-100 dark:bg-neutral-800 font-bold">-</button>
                                            <span className="text-xs font-semibold">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product_id, 1)} className="h-7 w-7 rounded bg-neutral-100 dark:bg-neutral-800 font-bold">+</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3 bg-neutral-50 dark:bg-neutral-900/50">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-500">Subtotal:</span>
                                    <span className="font-extrabold text-base">${cartTotal.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition flex items-center justify-center gap-2"
                                >
                                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Complete Order Checkout Modal */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="font-bold text-base text-neutral-900 dark:text-white">Complete Order Checkout</h3>
                            <button onClick={() => setIsCheckoutOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-600"><X className="h-5 w-5" /></button>
                        </div>

                        {isOrderComplete ? (
                            <div className="p-8 text-center space-y-4">
                                <div className="h-14 w-14 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                    <Check className="h-8 w-8" />
                                </div>
                                <h4 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Order Confirmed!</h4>
                                <p className="text-sm text-neutral-500">Order Number: <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{completedOrder?.order_number}</span></p>
                                <p className="text-xs text-neutral-400">A receipt has been dispatched to your email & WhatsApp.</p>
                                <button
                                    onClick={() => { setIsCheckoutOpen(false); setIsOrderComplete(false); }}
                                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-400 mb-1">Full Name *</label>
                                    <input required type="text" value={checkoutForm.customer_name} onChange={e => setCheckoutForm({...checkoutForm, customer_name: e.target.value})} className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="John Doe" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-400 mb-1">Email Address *</label>
                                        <input required type="email" value={checkoutForm.customer_email} onChange={e => setCheckoutForm({...checkoutForm, customer_email: e.target.value})} className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="john@example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-400 mb-1">WhatsApp Phone *</label>
                                        <input required type="text" value={checkoutForm.customer_phone} onChange={e => setCheckoutForm({...checkoutForm, customer_phone: e.target.value})} className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="+1234567890" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-400 mb-1">Shipping Address (Optional)</label>
                                    <input type="text" value={checkoutForm.shipping_address} onChange={e => setCheckoutForm({...checkoutForm, shipping_address: e.target.value})} className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="123 Main St, City, Country" />
                                </div>

                                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 flex justify-between items-center text-sm font-bold">
                                    <span className="text-neutral-700 dark:text-neutral-300">Total Due:</span>
                                    <span className="text-base text-emerald-600 dark:text-emerald-400">${cartTotal.toFixed(2)}</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition"
                                >
                                    {isSubmitting ? 'Processing Order...' : 'Pay & Complete Order'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
