import { Head, router, usePage, Link } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { Button, Card, Badge, Pagination, Input, Select } from '@/Components/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingBag, DollarSign, PackageCheck, Clock, Truck } from 'lucide-react';
import FulfillOrderModal from './Partials/FulfillOrderModal';

function StatCard({ label, value, Icon, tone = 'neutral' }) {
    const iconColors = {
        neutral: 'text-neutral-600 dark:text-neutral-300',
        green: 'text-emerald-600 dark:text-emerald-400',
        amber: 'text-amber-500 dark:text-amber-400',
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

function StatusBadge({ status }) {
    if (!status) return <span className="text-neutral-400 text-xs">—</span>;
    const s = String(status).toLowerCase();
    if (['paid', 'fulfilled', 'delivered', 'completed', 'active'].includes(s)) {
        return <Badge variant="success" size="sm" className="capitalize">{status}</Badge>;
    }
    if (['processing', 'shipped', 'pending', 'authorized'].includes(s)) {
        return <Badge variant="warning" size="sm" className="capitalize">{status}</Badge>;
    }
    if (['cancelled', 'refunded', 'voided', 'failed'].includes(s)) {
        return <Badge variant="danger" size="sm" className="capitalize">{status}</Badge>;
    }
    return <Badge variant="default" size="sm" className="capitalize">{status}</Badge>;
}

export default function OrdersIndex({ orders, filters = {}, stores = [], stats = {} }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};
    const [search, setSearch] = useState(filters.search ?? '');
    const [fulfillOrder, setFulfillOrder] = useState(null);
    const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);

    const apply = (next) => {
        router.get(route('client.ecommerce.orders.index'), { ...filters, ...next }, { preserveState: true, replace: true });
    };

    const handleFulfillClick = (e, o) => {
        e.stopPropagation();
        setFulfillOrder(o);
        setIsFulfillModalOpen(true);
    };

    return (
        <ClientLayout title={t('ecommerce.orders') || 'Orders'}>
            <Head title={t('ecommerce.orders') || 'Orders'} />
            <div className="space-y-5">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{t('ecommerce.orders') || 'Orders'}</h2>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('ecommerce.orders_sub') || 'Orders synced from your connected stores.'}</p>
                </div>

                {flash.success && <div className="rounded-soft bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-sm font-medium">{flash.success}</div>}
                {flash.error && <div className="rounded-soft bg-coral-50 dark:bg-coral-950/30 text-coral-800 dark:text-coral-200 border border-coral-200 dark:border-coral-800 px-4 py-2.5 text-sm font-medium">{flash.error}</div>}

                <div className="grid gap-3 sm:grid-cols-4">
                    <StatCard label={t('ecommerce.total_orders') || 'Orders'} value={stats.total ?? 0} Icon={ShoppingBag} />
                    <StatCard label={t('ecommerce.revenue') || 'Revenue'} value={stats.revenue ?? 0} Icon={DollarSign} tone="green" />
                    <StatCard label={t('ecommerce.fulfilled') || 'Fulfilled'} value={stats.fulfilled ?? 0} Icon={PackageCheck} tone="green" />
                    <StatCard label={t('ecommerce.unfulfilled') || 'Unfulfilled'} value={stats.unfulfilled ?? 0} Icon={Clock} tone="amber" />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={e => { e.preventDefault(); apply({ search }); }} className="flex-1 min-w-[200px]">
                        <Input
                            leftIcon={<Search className="h-4 w-4" />}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('ecommerce.search_orders') || 'Search order # or customer…'}
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
                        value={filters.fulfillment ?? ''}
                        onChange={e => apply({ fulfillment: e.target.value || undefined })}
                        size="sm"
                        className="w-40"
                    >
                        <option value="">{t('ecommerce.all_fulfillment') || 'All fulfillment'}</option>
                        <option value="fulfilled">Fulfilled</option>
                    </Select>
                </div>

                <Card padding={false} className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">{t('ecommerce.order') || 'Order'}</th>
                                <th className="text-left font-medium px-4 py-3">{t('ecommerce.customer') || 'Customer'}</th>
                                <th className="text-right font-medium px-4 py-3">{t('ecommerce.total') || 'Total'}</th>
                                <th className="text-left font-medium px-4 py-3">{t('ecommerce.payment') || 'Payment'}</th>
                                <th className="text-left font-medium px-4 py-3">{t('ecommerce.fulfillment') || 'Fulfillment'}</th>
                                <th className="text-left font-medium px-4 py-3">{t('ecommerce.date') || 'Date'}</th>
                                <th className="text-right font-medium px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {orders.data.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-400 dark:text-neutral-500">{t('ecommerce.no_orders') || 'No orders synced yet.'}</td></tr>
                            )}
                            {orders.data.map(o => (
                                <tr key={o.id} onClick={() => router.visit(route('client.ecommerce.orders.show', o.id))}
                                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors">
                                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{o.number}</td>
                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{o.contact?.name || '—'}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-neutral-100">{o.currency} {o.total}</td>
                                    <td className="px-4 py-3"><StatusBadge status={o.financial_status} /></td>
                                    <td className="px-4 py-3"><StatusBadge status={o.fulfillment_status} /></td>
                                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{o.placed_at || '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={(e) => handleFulfillClick(e, o)}
                                            className="gap-1"
                                        >
                                            <Truck className="h-3.5 w-3.5" /> Fulfill
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination data={orders} />
                </Card>
            </div>

            <FulfillOrderModal
                isOpen={isFulfillModalOpen}
                onClose={() => setIsFulfillModalOpen(false)}
                order={fulfillOrder}
            />
        </ClientLayout>
    );
}
