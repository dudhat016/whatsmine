import { Head, Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
    Eye, DollarSign, BarChart2, Globe, ShieldOff, ShieldCheck,
    Trash2, CheckCircle, AlertTriangle, Search, ChevronDown,
    Star, StarOff,
} from 'lucide-react';

// ─── Minimal admin layout wrapper (reuses admin shell conventions) ─────────────
// We use the Admin layout that already exists in the project
// Import path mirrors how other Admin pages import their layout
import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Input, Modal, Pagination, Badge } from '@/Components/ui';

const fmt = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n ?? 0);
const fmtCurrency = (n) => `$${fmt(n)}`;

const STATUS_VARIANTS = {
    draft: 'default',
    published: 'success',
    suspended: 'danger',
};

export default function AdminFunnelsIndex({ funnels, filters }) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [search, setSearch] = useState(filters?.search ?? '');
    const [suspendModal, setSuspendModal] = useState(null); // { funnel }
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Search ────────────────────────────────────────────────────────────────
    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.funnels.index'), { search }, { preserveState: true });
    };

    // ── Suspend ───────────────────────────────────────────────────────────────
    const handleSuspend = async () => {
        if (!suspendModal) return;
        setSubmitting(true);
        try {
            await axios.post(route('admin.funnels.suspend', suspendModal.funnel.id), { reason });
            showToast('Funnel suspended.');
            setSuspendModal(null);
            setReason('');
            router.reload({ only: ['funnels'] });
        } catch {
            showToast('Failed to suspend.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Restore ───────────────────────────────────────────────────────────────
    const handleRestore = async (funnel) => {
        try {
            await axios.post(route('admin.funnels.restore', funnel.id));
            showToast('Funnel restored.');
            router.reload({ only: ['funnels'] });
        } catch {
            showToast('Failed to restore.', 'error');
        }
    };

    // ── Toggle System Template ────────────────────────────────────────────────
    const toggleTemplate = async (funnel) => {
        const routeName = funnel.is_system_template ? 'admin.funnels.remove-template' : 'admin.funnels.make-template';
        try {
            await axios.post(route(routeName, funnel.id));
            showToast(funnel.is_system_template ? 'Removed from templates.' : 'Marked as system template.');
            router.reload({ only: ['funnels'] });
        } catch {
            showToast('Action failed.', 'error');
        }
    };

    // ── Force Delete ──────────────────────────────────────────────────────────
    const handleDelete = async (funnel) => {
        const ok = await confirm({
            title: 'Delete Funnel',
            message: `Permanently delete "${funnel.name}"? This cannot be undone.`,
            confirmText: 'Delete Permanently',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(route('admin.funnels.destroy', funnel.id));
    };

    return (
        <AdminLayout title="System Funnels">
            <Head title="System Funnels — Admin" />

            <div className="space-y-6">
                {/* ── Header ────────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            System Funnels
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                            All client funnels across every workspace.
                        </p>
                    </div>
                    <Link
                        href={route('admin.funnels.templates')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        <Star className="h-4 w-4" aria-hidden="true" />
                        System Templates
                    </Link>
                </div>

                {/* ── Flash ──────────────────────────────────────────────── */}
                {flash.success && (
                    <div role="status" className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/30 px-4 py-2.5 text-sm text-green-800 dark:text-green-200">
                        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {flash.success}
                    </div>
                )}

                {/* ── Search bar ─────────────────────────────────────────── */}
                <form onSubmit={handleSearch} className="flex items-center gap-2" role="search" aria-label="Search funnels">
                    <Input
                        id="admin-funnel-search"
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search funnel name…"
                        leftIcon={<Search className="h-4 w-4" />}
                        wrapperClassName="flex-1"
                    />
                    <Button type="submit">
                        Search
                    </Button>
                </form>

                {/* ── Funnels Table ─────────────────────────────────────── */}
                <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                <tr>
                                    {['Funnel', 'Workspace', 'Status', 'Views', 'Revenue', 'Steps', 'Template', ''].map((h, i) => (
                                        <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {funnels?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-sm text-neutral-400">
                                            No funnels found.
                                        </td>
                                    </tr>
                                ) : funnels?.data?.map(f => (
                                    <tr key={f.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition ${f.deleted_at ? 'opacity-50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{f.name}</div>
                                            <div className="text-xs text-neutral-400">/f/{f.slug}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-500">
                                            WS #{f.workspace_id}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={STATUS_VARIANTS[f.status] || 'default'}>
                                                {f.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">{fmt(f.views_count)}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">{fmtCurrency(f.total_revenue)}</td>
                                        <td className="px-4 py-3 text-sm text-neutral-500">{f.steps_count ?? 0}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => toggleTemplate(f)}
                                                className="rounded p-1 text-neutral-400 hover:text-amber-500 transition focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                title={f.is_system_template ? 'Remove from system templates' : 'Mark as system template'}
                                            >
                                                {f.is_system_template
                                                    ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                                                    : <Star className="h-4 w-4" aria-hidden="true" />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {f.status === 'suspended' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestore(f)}
                                                        className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-green-600 dark:hover:bg-neutral-700 transition focus:outline-none focus:ring-2 focus:ring-green-500"
                                                        title="Restore"
                                                    >
                                                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSuspendModal({ funnel: f })}
                                                        className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-700 transition focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        title="Suspend"
                                                    >
                                                        <ShieldOff className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(f)}
                                                    className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-700 transition focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    title="Force Delete"
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

                    {/* Pagination */}
                    <div className="border-t border-neutral-200 dark:border-neutral-700 px-4 py-3">
                        <Pagination data={funnels} />
                    </div>
                </div>
            </div>

            {/* ── Suspend Modal ─────────────────────────────────────────────── */}
            <Modal show={!!suspendModal} onClose={() => { setSuspendModal(null); setReason(''); }} maxWidth="sm">
                <Modal.Header title="Suspend Funnel" onClose={() => { setSuspendModal(null); setReason(''); }} />
                <Modal.Body className="space-y-4">
                    <p className="text-sm text-neutral-500">
                        This will unpublish <strong>{suspendModal?.funnel?.name}</strong> and prevent re-publishing until restored.
                    </p>
                    <div>
                        <label htmlFor="suspend-reason" className="block text-xs font-medium text-neutral-500 mb-1">
                            Reason (optional)
                        </label>
                        <textarea
                            id="suspend-reason"
                            rows={3}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Policy violation, spam, etc."
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => { setSuspendModal(null); setReason(''); }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={handleSuspend}
                        disabled={submitting}
                    >
                        {submitting ? 'Suspending…' : 'Suspend Funnel'}
                    </Button>
                </Modal.Footer>
            </Modal>

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
        </AdminLayout>
    );
}
