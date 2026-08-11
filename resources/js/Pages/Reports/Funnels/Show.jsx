import { Head, Link } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { useTranslation } from 'react-i18next';
import {
    Eye, MousePointerClick, DollarSign, TrendingUp, Users,
    BarChart2, ArrowRight, Funnel, ChevronDown, ChevronUp,
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n ?? 0);
const fmtCurrency = (n) => `$${fmt(n)}`;

const STATUS_COLORS = {
    draft:     'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    published: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

// ─── KPI Card component ───────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, subValue, color = 'brand' }) {
    const colorMap = {
        brand:  'bg-brand-50 dark:bg-brand-900/30 text-brand-500',
        green:  'bg-green-50 dark:bg-green-900/30 text-green-500',
        purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-500',
        amber:  'bg-amber-50 dark:bg-amber-900/30 text-amber-500',
    };
    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
            <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
                    <p className="mt-0.5 text-xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</p>
                    {subValue && <p className="text-xs text-neutral-400">{subValue}</p>}
                </div>
            </div>
        </div>
    );
}

// ─── Funnel Index Report ──────────────────────────────────────────────────────
export function FunnelReportIndex({ funnels }) {
    const { t } = useTranslation();

    const totalViews       = funnels.reduce((s, f) => s + (f.views_count ?? 0), 0);
    const totalRevenue     = funnels.reduce((s, f) => s + (f.total_revenue ?? 0), 0);
    const totalConversions = funnels.reduce((s, f) => s + (f.conversions_count ?? 0), 0);

    return (
        <ClientLayout title={t('funnel.report_title')}>
            <Head title={t('funnel.report_title')} />

            <div className="space-y-6">
                {/* ── Page Header ───────────────────────────────────────── */}
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {t('funnel.report_title')}
                    </h1>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                        Overview of all your funnel performance metrics.
                    </p>
                </div>

                {/* ── Summary KPIs ──────────────────────────────────────── */}
                <section aria-label="Summary metrics">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <KpiCard icon={Eye}              label={t('funnel.report_total_views')}       value={fmt(totalViews)}       color="brand" />
                        <KpiCard icon={MousePointerClick} label={t('funnel.report_total_conversions')} value={fmt(totalConversions)} color="green" />
                        <KpiCard icon={DollarSign}       label={t('funnel.report_total_revenue')}     value={fmtCurrency(totalRevenue)} color="purple" />
                    </div>
                </section>

                {/* ── Funnels Table ─────────────────────────────────────── */}
                <section aria-label="All funnels">
                    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                    <tr>
                                        {['Funnel', 'Status', 'Views', 'Conversions', 'Conv. Rate', 'Revenue', ''].map((h, i) => (
                                            <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {funnels.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-10 text-center text-sm text-neutral-400">
                                                {t('funnel.no_funnels')}
                                            </td>
                                        </tr>
                                    ) : funnels.map(f => (
                                        <tr key={f.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{f.name}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[f.status] ?? ''}`}>
                                                    {t(`funnel.status_${f.status}`)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{fmt(f.views_count)}</td>
                                            <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{fmt(f.conversions_count)}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                {f.conversion_rate ?? 0}%
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                {fmtCurrency(f.total_revenue)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={route('client.reports.funnels.show', f.uuid)}
                                                    className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
                                                >
                                                    {t('common.view')} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </ClientLayout>
    );
}

// ─── Single Funnel Deep Report ────────────────────────────────────────────────
export default function FunnelReportShow({ funnel, kpis, step_stats, ab_stats, utm_sources, submissions }) {
    const { t } = useTranslation();

    return (
        <ClientLayout title={`${t('funnel.report_title')} — ${funnel.name}`}>
            <Head title={`${funnel.name} — ${t('funnel.report_title')}`} />

            <div className="space-y-6">
                {/* ── Breadcrumb + Header ────────────────────────────────── */}
                <div>
                    <nav aria-label="Breadcrumb" className="mb-2">
                        <ol className="flex items-center gap-1.5 text-xs text-neutral-400">
                            <li><Link href={route('client.reports.funnels.index')} className="hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded">{t('funnel.report_title')}</Link></li>
                            <li aria-hidden="true"><ChevronDown className="h-3 w-3 -rotate-90" /></li>
                            <li className="text-neutral-700 dark:text-neutral-300 font-medium">{funnel.name}</li>
                        </ol>
                    </nav>
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{funnel.name}</h1>
                </div>

                {/* ── KPI Grid ────────────────────────────────────────────── */}
                <section aria-label="Key performance indicators">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <KpiCard icon={Eye}              label={t('funnel.report_total_views')}       value={fmt(kpis.totalViews)}       color="brand" />
                        <KpiCard icon={MousePointerClick} label={t('funnel.report_total_conversions')} value={fmt(kpis.totalConversions)} color="green" />
                        <KpiCard icon={DollarSign}       label={t('funnel.report_aov')}               value={`$${fmt(kpis.aov)}`}       color="purple" />
                        <KpiCard icon={TrendingUp}       label={t('funnel.report_rpv')}               value={`$${fmt(kpis.rpv)}`}       color="amber" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <KpiCard icon={DollarSign}  label={t('funnel.report_total_revenue')} value={`$${fmt(kpis.totalRevenue)}`} color="green" />
                        <KpiCard icon={Users}        label={t('funnel.report_leads')}         value={fmt(kpis.leadCount)}          color="brand" />
                        <KpiCard icon={Users}        label={t('funnel.report_customers')}     value={fmt(kpis.customerCount)}      color="purple" />
                    </div>
                </section>

                {/* ── Step Drop-off Analysis ───────────────────────────────── */}
                <section aria-label={t('funnel.report_step_dropoff')}>
                    <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t('funnel.report_step_dropoff')}
                    </h2>
                    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                    <tr>
                                        {['Step', 'Type', 'Views', 'Conversions', 'Conv. Rate'].map((h, i) => (
                                            <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {step_stats?.map(s => (
                                        <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                                            <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">{s.name}</td>
                                            <td className="px-4 py-3 text-xs text-neutral-500 capitalize">{s.type?.replace(/_/g, ' ')}</td>
                                            <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{fmt(s.views_count)}</td>
                                            <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{fmt(s.conversions_count)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-brand-500"
                                                            style={{ width: `${Math.min(s.conversion_rate ?? 0, 100)}%` }}
                                                            role="progressbar"
                                                            aria-valuenow={s.conversion_rate ?? 0}
                                                            aria-valuemin={0}
                                                            aria-valuemax={100}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                        {s.conversion_rate ?? 0}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ── A/B Testing Matrix ───────────────────────────────────── */}
                {ab_stats?.length > 0 && (
                    <section aria-label={t('funnel.report_ab_matrix')}>
                        <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            {t('funnel.report_ab_matrix')}
                        </h2>
                        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                        <tr>
                                            {['Step', 'Variant', 'Views', 'Conversions', 'Conv. Rate', 'Revenue', 'RPV'].map((h, i) => (
                                                <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {ab_stats.map((row, i) => (
                                            <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                                                <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{row.step_name}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        row.variant === 'A'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                    }`}>
                                                        {t(`funnel.variant_${row.variant.toLowerCase()}`)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{fmt(row.views_count)}</td>
                                                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{fmt(row.conversions_count)}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">{row.conversion_rate ?? 0}%</td>
                                                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{fmtCurrency(row.revenue)}</td>
                                                <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{fmtCurrency(row.rpv)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── UTM Sources ─────────────────────────────────────────── */}
                {utm_sources?.length > 0 && (
                    <section aria-label={t('funnel.report_utm')}>
                        <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            {t('funnel.report_utm')}
                        </h2>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {utm_sources.map((src, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3">
                                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                                        {src.utm_source || 'Direct'}
                                    </span>
                                    <span className="ml-4 rounded-full bg-brand-50 dark:bg-brand-900/30 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
                                        {fmt(src.count)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Recent Submissions ───────────────────────────────────── */}
                <section aria-label={t('funnel.report_submissions')}>
                    <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {t('funnel.report_submissions')}
                    </h2>
                    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                    <tr>
                                        {['Name', 'Email', 'Step', 'Status', 'Date'].map((h, i) => (
                                            <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {submissions?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
                                                No submissions yet.
                                            </td>
                                        </tr>
                                    ) : submissions?.data?.map(sub => (
                                        <tr key={sub.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                                            <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                {sub.contact_name || sub.email || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{sub.email ?? '—'}</td>
                                            <td className="px-4 py-3 text-sm text-neutral-500">{sub.step?.name ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    sub.status === 'customer'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                                                }`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-neutral-500">
                                                {new Date(sub.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </ClientLayout>
    );
}
