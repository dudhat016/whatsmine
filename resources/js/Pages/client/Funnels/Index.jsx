import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Plus, Funnel, Trash2, BarChart2, Pencil, Globe, EyeOff,
    Eye, TrendingUp, DollarSign, MousePointerClick, MoreVertical,
    ExternalLink, Copy, Share2, CheckCircle, Clock,
} from 'lucide-react';

// ─── Status badge styles ───────────────────────────────────────────────────────
const STATUS_COLORS = {
    draft:     'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    published: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    archived:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
};

const fmt = (n, style = 'decimal') =>
    new Intl.NumberFormat(undefined, { style, currency: 'USD', maximumFractionDigits: 2 }).format(n ?? 0);

const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function FunnelIndex({ funnels }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [showCreate, setShowCreate] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const { data, setData, post, processing, reset, errors } = useForm({ name: '' });

    // ── Create funnel ─────────────────────────────────────────────────────────
    const handleCreate = (e) => {
        e.preventDefault();
        post(route('client.funnels.store'), {
            onSuccess: () => { reset(); setShowCreate(false); },
        });
    };

    // ── Delete funnel ─────────────────────────────────────────────────────────
    const handleDelete = (funnel) => {
        if (!confirm(t('funnel.delete_confirm'))) return;
        router.delete(route('client.funnels.destroy', funnel.uuid), { preserveScroll: true });
    };

    // ── Copy public URL ───────────────────────────────────────────────────────
    const copyUrl = useCallback((funnel) => {
        const url = `${window.location.origin}/f/${funnel.slug}`;
        navigator.clipboard.writeText(url);
        setCopiedId(funnel.id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    return (
        <ClientLayout title={t('funnel.title')}>
            <Head title={t('funnel.title')} />

            <div className="space-y-6">
                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            {t('funnel.title')}
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                            {t('funnel.subtitle')}
                        </p>
                    </div>
                    <button
                        id="btn-create-funnel"
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t('funnel.create_funnel')}
                    </button>
                </div>

                {/* ── Flash ───────────────────────────────────────────────── */}
                {flash.success && (
                    <div role="status" className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/30 px-4 py-2.5 text-sm text-green-800 dark:text-green-200">
                        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {flash.success}
                    </div>
                )}

                {/* ── Empty State ─────────────────────────────────────────── */}
                {funnels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-20 text-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30 mb-4">
                            <Funnel className="h-8 w-8 text-brand-500" aria-hidden="true" />
                        </span>
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {t('funnel.no_funnels')}
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {t('funnel.subtitle')}
                        </p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t('funnel.create_funnel')}
                        </button>
                    </div>
                ) : (
                    /* ── Funnel Cards Grid ────────────────────────────────── */
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {funnels.map(funnel => (
                            <article
                                key={funnel.id}
                                className="group flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-600"
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                                            <Funnel className="h-4 w-4 text-brand-500" aria-hidden="true" />
                                        </span>
                                        <Link
                                            href={route('client.funnels.edit', funnel.uuid)}
                                            className="truncate font-semibold text-neutral-900 hover:text-brand-600 dark:text-neutral-100 dark:hover:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
                                        >
                                            {funnel.name}
                                        </Link>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[funnel.status] ?? ''}`}>
                                        {t(`funnel.status_${funnel.status}`)}
                                    </span>
                                </div>

                                {/* URL chip */}
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400 truncate">
                                    <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span className="truncate">/f/{funnel.slug}</span>
                                    <button
                                        type="button"
                                        onClick={() => copyUrl(funnel)}
                                        aria-label={t('funnel.copied')}
                                        className="ml-auto shrink-0 rounded p-0.5 hover:text-brand-500 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        {copiedId === funnel.id
                                            ? <CheckCircle className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                                            : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                                    </button>
                                </div>

                                {/* Stats row */}
                                <div className="mt-4 grid grid-cols-4 divide-x divide-neutral-100 dark:divide-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 py-2.5 text-center">
                                    {[
                                        { icon: Eye, label: t('funnel.views'), value: fmt(funnel.views_count) },
                                        { icon: MousePointerClick, label: t('funnel.conversions'), value: `${funnel.conversion_rate ?? 0}%` },
                                        { icon: DollarSign, label: t('funnel.revenue'), value: `$${fmt(funnel.total_revenue)}` },
                                        { icon: TrendingUp, label: t('funnel.steps'), value: funnel.steps_count ?? 0 },
                                    ].map(({ icon: Icon, label, value }) => (
                                        <div key={label} className="px-1">
                                            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{value}</div>
                                            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-400">{label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3">
                                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                        {fmtDate(funnel.updated_at)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={route('client.funnels.edit', funnel.uuid)}
                                            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            title={t('common.edit')}
                                        >
                                            <Pencil className="h-4 w-4" aria-hidden="true" />
                                        </Link>
                                        <Link
                                            href={route('client.reports.funnels.show', funnel.uuid)}
                                            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            title={t('funnel.report_title')}
                                        >
                                            <BarChart2 className="h-4 w-4" aria-hidden="true" />
                                        </Link>
                                        {funnel.status === 'published' && (
                                            <a
                                                href={`/f/${funnel.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                title={t('funnel.preview')}
                                            >
                                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(funnel)}
                                            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-red-500"
                                            title={t('funnel.delete')}
                                        >
                                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Create Funnel Modal ────────────────────────────────────────── */}
            {showCreate && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-create-funnel-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                >
                    <div className="w-full max-w-sm rounded-xl bg-white dark:bg-neutral-900 p-6 shadow-xl space-y-4">
                        <h2 id="modal-create-funnel-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {t('funnel.create_funnel')}
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-3" noValidate>
                            <div>
                                <label htmlFor="funnel-name" className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                                    {t('funnel.funnel_name')}
                                </label>
                                <input
                                    id="funnel-name"
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                    autoFocus
                                    placeholder={t('funnel.funnel_name_placeholder')}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    aria-describedby={errors.name ? 'funnel-name-error' : undefined}
                                />
                                {errors.name && (
                                    <p id="funnel-name-error" className="mt-1 text-xs text-red-600" role="alert">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
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
                                    onClick={() => { setShowCreate(false); reset(); }}
                                    className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ClientLayout>
    );
}
