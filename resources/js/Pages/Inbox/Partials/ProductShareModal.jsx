import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
import { Input } from '@/Components/ui';
import { Search, Package, Send, Tag, RefreshCw, CreditCard, Gift, ExternalLink } from 'lucide-react';

export default function ProductShareModal({ isOpen, onClose, onShareProduct }) {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProducts('');
        }
    }, [isOpen]);

    const fetchProducts = async (q) => {
        setLoading(true);
        try {
            const res = await fetch(route('client.ecommerce.products.search') + `?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setProducts(data || []);
        } catch (e) {
            console.error('Failed to fetch products for share picker:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        fetchProducts(val);
    };

    const handleSelectProduct = (product) => {
        let priceFormatted = `$${product.price}`;
        if (product.pricing_type === 'free') priceFormatted = 'FREE';
        if (product.pricing_type === 'recurring') priceFormatted = `$${product.price}/${product.billing_interval || 'mo'}`;

        const cardText = `🛍️ *${product.name}*\nPrice: ${priceFormatted}\n${product.description ? product.description + '\n' : ''}\n👉 Order Now: ${product.checkout_url}`;
        
        if (onShareProduct) {
            onShareProduct(cardText);
        }
        onClose();
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="lg">
            <Modal.Header title="Share Native Product to Chat" onClose={onClose} />
            <Modal.Body>
                <div className="space-y-4">
                    <Input
                        type="text"
                        value={search}
                        onChange={handleSearchChange}
                        leftIcon={<Search className="h-4 w-4 text-neutral-400" />}
                        placeholder="Search product catalog by name or SKU..."
                    />

                    <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        {loading && <p className="text-center py-6 text-xs text-neutral-400">Loading catalog...</p>}
                        {!loading && products.length === 0 && (
                            <p className="text-center py-6 text-xs text-neutral-400">No active products found.</p>
                        )}
                        {!loading && products.map(p => (
                            <div key={p.id} className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                                <div className="flex items-center gap-3 min-w-0">
                                    {p.image_url ? (
                                        <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover bg-neutral-100" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                            <Package className="h-5 w-5 text-neutral-400" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">{p.name}</h4>
                                        <span className="text-xs text-neutral-500 block">${p.price} • {p.pricing_type}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSelectProduct(p)}
                                    className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                                >
                                    <Send className="h-3.5 w-3.5" /> Share
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}
