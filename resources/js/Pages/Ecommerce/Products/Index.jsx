import { Head, router, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { Button, Card, Badge, Pagination, Input, Select } from '@/Components/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Package, ShoppingBag, AlertTriangle, XOctagon, XCircle, Plus, Edit, Edit3, Trash2, Tag, RefreshCw, CreditCard, Gift, ExternalLink, Eye, Copy } from 'lucide-react';
import NativeProductBuilder from './Partials/NativeProductBuilder';
import { useConfirm } from '@/context/ConfirmationContext';

function StatCard({ label, value, tone = 'neutral', Icon }) {
    const iconColors = {
        neutral: 'text-neutral-600 dark:text-neutral-300',
        amber: 'text-amber-500 dark:text-amber-400',
        red: 'text-coral-500 dark:text-coral-400',
    };
    return (
        <Card padding={true} className="flex items-center gap-3.5">
            {Icon && (
                <div className="p-2.5 rounded-soft bg-neutral-50 dark:bg-neutral-800">
                    <Icon className={`h-5 w-5 ${iconColors[tone] || iconColors.neutral}`} />
                </div>
            )}
            <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
                <p className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{value}</p>
            </div>
        </Card>
    );
}

function StockBadge({ qty, threshold, t }) {
    if (qty === null || qty === undefined) {
        return <Badge variant="brand" size="sm">Unlimited</Badge>;
    }
    if (qty <= 0) {
        return <Badge variant="danger" size="sm">Out of Stock (0)</Badge>;
    }
    if (qty <= threshold) {
        return <Badge variant="warning" size="sm">🔥 {qty} left</Badge>;
    }
    return <Badge variant="success" size="sm">⚡ {qty} in stock</Badge>;
}

function PricingBadge({ product }) {
    const p = product || {};
    const type = p.pricing_type || 'one_time';
    if (type === 'free') {
        return <Badge variant="success" size="sm" className="gap-1"><Gift className="h-3 w-3" /> FREE</Badge>;
    }
    if (type === 'recurring') {
        const interval = p.billing_interval === 'year' ? '/yr' : '/mo';
        return <Badge variant="brand" size="sm" className="gap-1"><RefreshCw className="h-3 w-3" /> ${p.price}{interval}</Badge>;
    }
    if (type === 'installments') {
        return <Badge variant="default" size="sm" className="gap-1"><CreditCard className="h-3 w-3" /> {p.installment_count}x ${p.price}</Badge>;
    }
    return <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-800 dark:text-neutral-200">${p.price}</span>;
}

export default function ProductsIndex({ products, allProducts = [], filters = {}, stores = [], nativeStore = null, calendars = [], stats = {}, lowStockThreshold = 5 }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};
    const { confirm } = useConfirm();
    const [search, setSearch] = useState(filters.search ?? '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const apply = (next) => {
        router.get(route('client.ecommerce.products.index'), { ...filters, ...next }, { preserveState: true, replace: true });
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (p) => {
        setEditingProduct(p);
        setIsModalOpen(true);
    };

    const { displayCurrency = 'USD' } = usePage().props;

    const handleDuplicate = async (p) => {
        const ok = await confirm({
            title: 'Duplicate Product',
            message: `Duplicate "${p.name}"? A draft copy will be created.`,
            confirmText: 'Duplicate',
            variant: 'primary',
        });
        if (ok) {
            router.post(route('client.ecommerce.products.duplicate', p.id));
        }
    };

    const handleDelete = async (p) => {
        const ok = await confirm({
            title: 'Delete Product',
            message: `Are you sure you want to delete "${p.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (ok) {
            router.delete(route('client.ecommerce.products.destroy', p.id));
        }
    };

    return (
        <ClientLayout title={t('ecommerce.products') || 'Products & Inventory'}>
            <Head title={t('ecommerce.products') || 'Products & Inventory'} />
            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{t('ecommerce.products') || 'Products & Inventory'}</h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('ecommerce.products_sub') || 'Synced products and live stock levels from your connected stores.'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {nativeStore && (
                            <a
                                href={nativeStore.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-soft text-sm font-medium border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition shadow-soft"
                            >
                                <ExternalLink className="h-4 w-4 text-brand-600" /> View Storefront
                            </a>
                        )}
                        <Button
                            onClick={handleCreate}
                            variant="primary"
                            className="gap-1.5"
                        >
                            <Plus className="h-4 w-4" /> Create Product
                        </Button>
                    </div>
                </div>

                {flash.success && <div className="rounded-soft bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-sm font-medium">{flash.success}</div>}
                {flash.error && <div className="rounded-soft bg-coral-50 dark:bg-coral-950/30 text-coral-800 dark:text-coral-200 border border-coral-200 dark:border-coral-800 px-4 py-2.5 text-sm font-medium">{flash.error}</div>}

                <div className="grid gap-3 sm:grid-cols-3">
                    <StatCard label={t('ecommerce.total_products') || 'Products'} value={stats.total ?? 0} Icon={ShoppingBag} />
                    <StatCard label={t('ecommerce.low_stock') || 'Low stock'} value={stats.low_stock ?? 0} Icon={AlertTriangle} tone="amber" />
                    <StatCard label={t('ecommerce.out_of_stock') || 'Out of stock'} value={stats.out_of_stock ?? 0} Icon={XCircle} tone="red" />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={e => { e.preventDefault(); apply({ search }); }} className="flex-1 min-w-[200px]">
                        <Input
                            leftIcon={<Search className="h-4 w-4" />}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('ecommerce.search_products') || 'Search name or SKU…'}
                        />
                    </form>
                    <Select
                        value={filters.store_id ?? ''}
                        onChange={e => apply({ store_id: e.target.value || undefined })}
                        size="sm"
                        className="w-40"
                    >
                        <option value="">{t('ecommerce.all_stores') || 'All stores'}</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <Select
                        value={filters.pricing_type ?? ''}
                        onChange={e => apply({ pricing_type: e.target.value || undefined })}
                        size="sm"
                        className="w-48"
                    >
                        <option value="">Pricing Options (All)</option>
                        <option value="one_time">Fixed One-Time</option>
                        <option value="recurring">Recurring Subscription</option>
                        <option value="installments">Installment Plan</option>
                        <option value="free">🎁 FREE ($0)</option>
                    </Select>
                    <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300 cursor-pointer">
                        <input type="checkbox" checked={!!filters.low_stock} onChange={e => apply({ low_stock: e.target.checked ? 1 : undefined })}
                            className="rounded border-neutral-300 text-brand-600" />
                        {t('ecommerce.low_stock_only') || 'Low stock only'}
                    </label>
                </div>

                <Card padding={false} className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">{t('ecommerce.product') || 'Product'}</th>
                                <th className="text-left font-medium px-4 py-3">Source</th>
                                <th className="text-left font-medium px-4 py-3">{t('ecommerce.sku') || 'SKU'}</th>
                                <th className="text-left font-medium px-4 py-3">{t('ecommerce.price') || 'Price'}</th>
                                <th className="text-left font-medium px-4 py-3">{t('ecommerce.stock') || 'Stock'}</th>
                                <th className="text-right font-medium px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {products.data.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-400 dark:text-neutral-500">{t('ecommerce.no_products') || 'No products synced yet.'}</td></tr>
                            )}
                            {products.data.map(p => (
                                <tr key={p.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                                    <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                                        <div className="flex items-center gap-3">
                                            {p.image_url ? (
                                                <img src={p.image_url} alt="" className="h-10 w-10 rounded-soft object-cover bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-soft bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-center">
                                                    <ShoppingBag className="h-4 w-4 text-neutral-400" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">{p.name}</div>
                                                {p.description && <div className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-1">{p.description}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.platform === 'native' ? (
                                            <Badge variant="brand" size="sm">Native</Badge>
                                        ) : (
                                            <Badge variant="default" size="sm" className="capitalize">{p.platform || 'Shopify'}</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 font-mono text-xs">{p.sku || '—'}</td>
                                    <td className="px-4 py-3"><PricingBadge product={p} /></td>
                                    <td className="px-4 py-3"><StockBadge qty={p.inventory_quantity} threshold={lowStockThreshold} t={t} productType={p.product_type} /></td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <a
                                                href={route('public.storefront.show', { slug: nativeStore?.slug || p.store_id || 1, productSlug: p.slug || p.id })}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="View Live Product Page"
                                                className="p-1.5 rounded-soft text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </a>
                                            {p.platform === 'native' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        title="Edit Product"
                                                        className="p-1.5 rounded-soft text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDuplicate(p)}
                                                        title="Duplicate Product"
                                                        className="p-1.5 rounded-soft text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10 transition"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p)}
                                                        title="Delete Product"
                                                        className="p-1.5 rounded-soft text-neutral-400 hover:text-coral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination data={products} />
                </Card>
            </div>

            <NativeProductBuilder
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
                calendars={calendars}
                allProducts={allProducts}
            />
        </ClientLayout>
    );
}
