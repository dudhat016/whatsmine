import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    Plus, Users2, DollarSign, MousePointerClick, TrendingUp,
    Trash2, CheckCircle, XCircle, Pause, Play, ChevronRight,
    Coins, BarChart2, ExternalLink, AlertTriangle,
} from 'lucide-react';

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    banned: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const fmt = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n ?? 0);
const fmtCurrency = (n) => `$${fmt(n)}`;

export default function FunnelAffiliates({ affiliates, funnels }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [showAdd, setShowAdd] = useState(false);
    const [toast, setToast] = useState(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        funnel_id: funnels[0]?.id ?? '',
        name: '',
        email: '',
        commission_rate: 20,
    });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Add affiliate ─────────────────────────────────────────────────────────
    const handleAdd = (e) => {
        e.preventDefault();
        post(route('client.affiliates.store'), {
            onSuccess: () => { reset(); setShowAdd(false); showToast('Affiliate added successfully.'); },
            onError: () => showToast(t('funnel.error_generic'), 'error'),
        });
    };

    // ── Toggle status ─────────────────────────────────────────────────────────
    const toggleStatus = (affiliate) => {
        const newStatus = affiliate.status === 'active' ? 'paused' : 'active';
        axios.put(route('client.affiliates.update', affiliate.id), { status: newStatus })
            .then(() => router.reload({ only: ['affiliates'] }))
            .catch(() => showToast(t('funnel.error_generic'), 'error'));
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = (affiliate) => {
        if (!confirm(`Remove affiliate "${affiliate.name}"?`)) return;
        router.delete(route('client.affiliates.destroy', affiliate.id), { preserveScroll: true });
    };

    return (
        <ClientLayout title={t('funnel.affiliate_title')}>
            <Head title={t('funnel.affiliate_title')} />

            <div className="space-y-6">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            {t('funnel.affiliate_title')}
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                            Manage your affiliate partners and commission payouts.
                        </p>
                    </div>
                    <button
                        id="btn-add-affiliate"
                        type="button"
                        onClick={() => setShowAdd(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t('funnel.affiliate_add')}
                    </button>
                </div>

                {/* ── Flash ──────────────────────────────────────────────── */}
                {flash.success && (
                    <div role="status" className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/30 px-4 py-2.5 text-sm text-green-800 dark:text-green-200">
                        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {flash.success}
                    </div>
                )}

                {/* ── Empty ──────────────────────────────────────────────── */}
                {affiliates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-20 text-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30 mb-4">
                            <Users2 className="h-8 w-8 text-brand-500" aria-hidden="true" />
                        </span>
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            No affiliates yet
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Add your first affiliate partner to get started.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowAdd(true)}
                            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t('funnel.affiliate_add')}
                        </button>
                    </div>
                ) : (
                    /* ── Affiliate Table ──────────────────────────────────── */
                    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                    <tr>
                                        {[
                                            t('funnel.affiliate_name'),
                                            t('funnel.affiliate_ref_code'),
                                            'Funnel',
                                            t('funnel.affiliate_commission_rate'),
                                            t('funnel.affiliate_clicks'),
                                            t('funnel.affiliate_earned'),
                                            t('funnel.affiliate_pending'),
                                            t('funnel.affiliate_status'),
                                            '',
                                        ].map((h, i) => (
                                            <th
                                                key={i}
                                                scope="col"
                                                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {affiliates.map(affiliate => (
                                        <tr key={affiliate.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{affiliate.name}</div>
                                                <div className="text-xs text-neutral-400">{affiliate.email}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs font-mono text-neutral-700 dark:text-neutral-300">
                                                    {affiliate.ref_code}
                                                </code>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                                                {affiliate.funnel?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100">
                                                {affiliate.commission_rate}%
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                                                {fmt(affiliate.clicks_count)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                {fmtCurrency(affiliate.total_earned)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    affiliate.pending_balance > 0
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                                                }`}>
                                                    <Coins className="h-3 w-3" aria-hidden="true" />
                                                    {fmtCurrency(affiliate.pending_balance)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[affiliate.status] ?? ''}`}>
                                                    {affiliate.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Link
                                                        href={route('client.affiliates.commissions', affiliate.id)}
                                                        className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-700 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                        title={t('funnel.affiliate_commissions')}
                                                    >
                                                        <BarChart2 className="h-4 w-4" aria-hidden="true" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleStatus(affiliate)}
                                                        className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-700 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                        title={affiliate.status === 'active' ? 'Pause' : 'Activate'}
                                                    >
                                                        {affiliate.status === 'active'
                                                            ? <Pause className="h-4 w-4" aria-hidden="true" />
                                                            : <Play className="h-4 w-4" aria-hidden="true" />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(affiliate)}
                                                        className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-700 transition focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add Affiliate Modal ───────────────────────────────────────── */}
            {showAdd && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-add-affiliate-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                >
                    <div className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 p-6 shadow-xl space-y-4">
                        <h2 id="modal-add-affiliate-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {t('funnel.affiliate_add')}
                        </h2>
                        <form onSubmit={handleAdd} className="space-y-3" noValidate>
                            {/* Funnel select */}
                            <div>
                                <label htmlFor="affiliate-funnel" className="block text-xs font-medium text-neutral-500 mb-1">
                                    Funnel
                                </label>
                                <select
                                    id="affiliate-funnel"
                                    value={data.funnel_id}
                                    onChange={e => setData('funnel_id', e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                >
                                    {funnels.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Name */}
                            <div>
                                <label htmlFor="affiliate-name" className="block text-xs font-medium text-neutral-500 mb-1">
                                    {t('funnel.affiliate_name')}
                                </label>
                                <input
                                    id="affiliate-name"
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required autoFocus
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    aria-describedby={errors.name ? 'aff-name-error' : undefined}
                                />
                                {errors.name && <p id="aff-name-error" role="alert" className="mt-1 text-xs text-red-600">{errors.name}</p>}
                            </div>
                            {/* Email */}
                            <div>
                                <label htmlFor="affiliate-email" className="block text-xs font-medium text-neutral-500 mb-1">
                                    {t('funnel.affiliate_email')}
                                </label>
                                <input
                                    id="affiliate-email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    aria-describedby={errors.email ? 'aff-email-error' : undefined}
                                />
                                {errors.email && <p id="aff-email-error" role="alert" className="mt-1 text-xs text-red-600">{errors.email}</p>}
                            </div>
                            {/* Commission rate */}
                            <div>
                                <label htmlFor="affiliate-rate" className="block text-xs font-medium text-neutral-500 mb-1">
                                    {t('funnel.affiliate_commission_rate')}
                                </label>
                                <div className="flex items-center">
                                    <input
                                        id="affiliate-rate"
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={data.commission_rate}
                                        onChange={e => setData('commission_rate', e.target.value)}
                                        required
                                        className="w-full rounded-l-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    <span className="rounded-r-lg border border-l-0 border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 px-3 py-2 text-sm text-neutral-500">%</span>
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                                >
                                    {processing ? t('common.saving') : t('common.create')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAdd(false); reset(); }}
                                    className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Toast ────────────────────────────────────────────────────── */}
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${
                        toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                    }`}
                >
                    {toast.type === 'error'
                        ? <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                        : <CheckCircle className="h-4 w-4" aria-hidden="true" />}
                    {toast.msg}
                </div>
            )}
        </ClientLayout>
    );
}
