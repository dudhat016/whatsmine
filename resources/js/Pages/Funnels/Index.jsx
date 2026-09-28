import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import Modal from '@/Components/ui/Modal';
import Checkbox from '@/Components/ui/Checkbox';
import EmptyState from '@/Components/EmptyState';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Plus, Funnel, Trash2, BarChart2, Pencil, Globe, EyeOff,
    Eye, TrendingUp, DollarSign, MousePointerClick, MoreVertical,
    ExternalLink, Copy, Share2, CheckCircle, Clock, Folder,
    FolderPlus, LayoutGrid, List as ListIcon, Search, Home,
    ChevronRight, FolderOpen, Layers, Check, ArrowRight,
} from 'lucide-react';
import { useConfirm } from '@/context/ConfirmationContext';
import FolderModal from './components/FolderModal';
import MoveToFolderModal from './components/MoveToFolderModal';

const STATUS_COLORS = {
    draft:     'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    archived:  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
};

const fmt = (n, style = 'decimal') =>
    new Intl.NumberFormat(undefined, { style, currency: 'USD', maximumFractionDigits: 2 }).format(n ?? 0);

const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function FunnelIndex({
    funnels = [],
    folders = [],
    activeFolder = null,
    rootFunnelsCount = 0,
    filters = {},
    usage = null,
}) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const { props } = usePage();
    const flash = props.flash ?? {};

    // View mode: 'table' (GoHighLevel style) vs 'grid' (cards)
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('whatsmine_funnels_view_mode') || 'table';
    });

    const handleSetViewMode = (mode) => {
        setViewMode(mode);
        localStorage.setItem('whatsmine_funnels_view_mode', mode);
    };

    const [search, setSearch] = useState(filters.search || '');
    const [copiedId, setCopiedId] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [selectedFunnelIds, setSelectedFunnelIds] = useState([]);

    // Modals
    const [showCreate, setShowCreate] = useState(false);
    const [folderModal, setFolderModal] = useState({ isOpen: false, folder: null });
    const [moveModal, setMoveModal] = useState({ isOpen: false, funnels: [] });

    // Create Funnel Form
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        folder_id: activeFolder ? activeFolder.id : null,
    });

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // ── Search & Navigation ───────────────────────────────────────────────────
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get(
            route('client.funnels.index'),
            {
                folder_id: activeFolder ? activeFolder.id : undefined,
                search: search || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleNavigateFolder = (folderId) => {
        setSelectedFunnelIds([]);
        router.get(
            route('client.funnels.index'),
            {
                folder_id: folderId || undefined,
                search: search || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // ── Funnel Actions ────────────────────────────────────────────────────────
    const handleCreate = (e) => {
        e.preventDefault();
        post(route('client.funnels.store'), {
            onSuccess: () => {
                reset();
                setShowCreate(false);
            },
        });
    };

    const handleDelete = async (funnel) => {
        const ok = await confirm({
            title: t('funnel.delete_confirm') || 'Delete Funnel',
            message: `Are you sure you want to delete "${funnel.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(route('client.funnels.destroy', funnel.uuid), { preserveScroll: true });
    };

    const handleDuplicate = (funnel) => {
        router.post(route('client.funnels.duplicate', funnel.uuid), {}, { preserveScroll: true });
    };

    const copyUrl = useCallback((funnel) => {
        const url = `${window.location.origin}/f/${funnel.slug}`;
        navigator.clipboard.writeText(url);
        setCopiedId(funnel.id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    // ── Folder Actions ────────────────────────────────────────────────────────
    const handleSaveFolder = (folderData) => {
        if (folderModal.folder) {
            router.put(route('client.funnels.folders.update', folderModal.folder.id), folderData, {
                preserveScroll: true,
                onSuccess: () => setFolderModal({ isOpen: false, folder: null }),
            });
        } else {
            router.post(route('client.funnels.folders.store'), folderData, {
                preserveScroll: true,
                onSuccess: () => setFolderModal({ isOpen: false, folder: null }),
            });
        }
    };

    const handleDeleteFolder = async (folder) => {
        const ok = await confirm({
            title: 'Delete Folder',
            message: `Are you sure you want to delete folder "${folder.name}"? All funnels inside will move to Home (Unassigned).`,
            confirmText: 'Delete Folder',
            variant: 'danger',
        });
        if (ok) {
            router.delete(route('client.funnels.folders.destroy', folder.id), { preserveScroll: true });
        }
    };

    const handleMoveSubmit = (payload) => {
        router.post(route('client.funnels.move_to_folder'), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setMoveModal({ isOpen: false, funnels: [] });
                setSelectedFunnelIds([]);
            },
        });
    };

    // ── Bulk Selection ────────────────────────────────────────────────────────
    const toggleSelectAll = () => {
        if (selectedFunnelIds.length === funnels.length) {
            setSelectedFunnelIds([]);
        } else {
            setSelectedFunnelIds(funnels.map((f) => f.id));
        }
    };

    const toggleSelectFunnel = (id) => {
        setSelectedFunnelIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const selectedFunnels = funnels.filter((f) => selectedFunnelIds.includes(f.id));

    return (
        <ClientLayout title={t('funnel.title')}>
            <Head title={t('funnel.title')} />

            <div className="space-y-6">
                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                            <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
                                <Funnel className="w-6 h-6" />
                            </div>
                            {t('funnel.title')}
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {t('funnel.subtitle') || 'Organize, launch, and optimize high-converting sales & marketing funnels.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        {/* New Folder Button */}
                        {!activeFolder && (
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => setFolderModal({ isOpen: true, folder: null })}
                                className="gap-2"
                            >
                                <FolderPlus className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                New Folder
                            </Button>
                        )}

                        {/* Create Funnel Button */}
                        <button
                            id="btn-create-funnel"
                            onClick={() => {
                                setData('folder_id', activeFolder ? activeFolder.id : null);
                                setShowCreate(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t('funnel.create_funnel') || 'Create Funnel'}
                        </button>
                    </div>
                </div>

                {/* ── Flash Messages ───────────────────────────────────────── */}
                {flash.success && (
                    <div role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-sm text-emerald-800 dark:text-emerald-200">
                        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div role="status" className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-800 dark:text-red-200">
                        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {flash.error}
                    </div>
                )}

                {/* ── Toolbar: Breadcrumbs, Search, View Switcher ─────────── */}
                <Card padding={true} className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Left: Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm font-semibold w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => handleNavigateFolder(null)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition ${
                                !activeFolder
                                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                        >
                            <Home className="w-4 h-4" />
                            Home
                        </button>

                        {activeFolder && (
                            <>
                                <ChevronRight className="w-4 h-4 text-neutral-400" />
                                <span className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: activeFolder.color || '#16a34a' }}
                                    />
                                    {activeFolder.name}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Right: Search + View Switcher */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                        {/* Search */}
                        <form onSubmit={handleSearchSubmit} className="min-w-[200px]">
                            <Input
                                size="sm"
                                leftIcon={<Search className="w-3.5 h-3.5" />}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search funnels..."
                            />
                        </form>

                        {/* View Switcher: Table (GHL) vs Grid */}
                        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={() => handleSetViewMode('table')}
                                className={`p-1.5 rounded transition ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200'
                                }`}
                                title="Table View (GoHighLevel style)"
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetViewMode('grid')}
                                className={`p-1.5 rounded transition ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200'
                                }`}
                                title="Grid Cards View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </Card>

                {/* ── Bulk Actions Floating Bar ────────────────────────────── */}
                {selectedFunnelIds.length > 0 && (
                    <div className="sticky top-4 z-20 flex items-center justify-between p-3.5 bg-neutral-900 text-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-700 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold">
                                {selectedFunnelIds.length}
                            </span>
                            <span>{selectedFunnelIds.length === 1 ? '1 funnel selected' : `${selectedFunnelIds.length} funnels selected`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setMoveModal({ isOpen: true, funnels: selectedFunnels })}
                                className="text-neutral-900 dark:text-white"
                            >
                                <FolderOpen className="w-4 h-4 mr-1.5" />
                                Move to Folder
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedFunnelIds([])}
                                className="text-neutral-300 hover:text-white"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Empty State ─────────────────────────────────────────── */}
                {funnels.length === 0 && (!folders.length || activeFolder) ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-20 text-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30 mb-4">
                            <Funnel className="h-8 w-8 text-brand-500" aria-hidden="true" />
                        </span>
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {activeFolder ? `No funnels in "${activeFolder.name}"` : (t('funnel.no_funnels') || 'No funnels yet')}
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {activeFolder ? 'Create a new funnel or move existing funnels into this folder.' : (t('funnel.subtitle') || 'Create your first high-converting funnel now.')}
                        </p>
                        <button
                            onClick={() => {
                                setData('folder_id', activeFolder ? activeFolder.id : null);
                                setShowCreate(true);
                            }}
                            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t('funnel.create_funnel') || 'Create Funnel'}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ─── 1. Table View (GoHighLevel Style) ─────────────── */}
                        {viewMode === 'table' && (
                            <Card padding={false} className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                                        <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-200 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                            <tr>
                                                <th className="p-3.5 w-10 text-center">
                                                    <Checkbox
                                                        checked={funnels.length > 0 && selectedFunnelIds.length === funnels.length}
                                                        onChange={toggleSelectAll}
                                                    />
                                                </th>
                                                <th className="p-3.5">Name</th>
                                                <th className="p-3.5">Steps</th>
                                                <th className="p-3.5">Status</th>
                                                <th className="p-3.5">Views / Conv.</th>
                                                <th className="p-3.5">Revenue</th>
                                                <th className="p-3.5">Last Updated</th>
                                                <th className="p-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {/* Folder Rows (when at root Home and no active search) */}
                                            {!activeFolder && !search &&
                                                folders.map((folder) => (
                                                    <tr
                                                        key={`folder_${folder.id}`}
                                                        onClick={() => handleNavigateFolder(folder.id)}
                                                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition cursor-pointer"
                                                    >
                                                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                            {/* Empty cell for align with checkbox */}
                                                        </td>
                                                        <td className="p-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="p-2 rounded-lg text-white shrink-0 shadow-xs"
                                                                    style={{ backgroundColor: folder.color || '#16a34a' }}
                                                                >
                                                                    <Folder className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                                                                        {folder.name}
                                                                    </span>
                                                                    <span className="text-xs text-neutral-400 block">
                                                                        {folder.funnels_count ?? 0} {folder.funnels_count === 1 ? 'funnel' : 'funnels'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3.5">
                                                            <Badge variant="default" size="sm">
                                                                Folder
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3.5 text-neutral-400">—</td>
                                                        <td className="p-3.5 text-neutral-400">—</td>
                                                        <td className="p-3.5 text-neutral-400">—</td>
                                                        <td className="p-3.5 text-neutral-500">
                                                            {fmtDate(folder.updated_at)}
                                                        </td>
                                                        <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="relative inline-block text-left">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenMenuId(openMenuId === `folder_${folder.id}` ? null : `folder_${folder.id}`);
                                                                    }}
                                                                    className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                                >
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>
                                                                {openMenuId === `folder_${folder.id}` && (
                                                                    <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg py-1 z-30">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setOpenMenuId(null);
                                                                                setFolderModal({ isOpen: true, folder });
                                                                            }}
                                                                            className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                            Rename
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setOpenMenuId(null);
                                                                                handleDeleteFolder(folder);
                                                                            }}
                                                                            className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-2"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                            {/* Funnel Rows */}
                                            {funnels.map((funnel) => {
                                                const isSelected = selectedFunnelIds.includes(funnel.id);
                                                return (
                                                    <tr
                                                        key={`funnel_${funnel.id}`}
                                                        className={`hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition ${
                                                            isSelected ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                                                        }`}
                                                    >
                                                        <td className="p-3.5 text-center">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onChange={() => toggleSelectFunnel(funnel.id)}
                                                            />
                                                        </td>
                                                        <td className="p-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 shrink-0">
                                                                    <Funnel className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <Link
                                                                        href={route('client.funnels.show', funnel.uuid)}
                                                                        className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm hover:text-brand-600 dark:hover:text-brand-400 transition truncate block"
                                                                    >
                                                                        {funnel.name}
                                                                    </Link>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                                                                            /f/{funnel.slug}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => copyUrl(funnel)}
                                                                            className="text-neutral-400 hover:text-brand-500 transition"
                                                                            title="Copy public URL"
                                                                        >
                                                                            {copiedId === funnel.id ? (
                                                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                                            ) : (
                                                                                <Copy className="w-3 h-3" />
                                                                            )}
                                                                        </button>
                                                                        {funnel.folder && (
                                                                            <span
                                                                                onClick={() => handleNavigateFolder(funnel.folder.id)}
                                                                                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80"
                                                                                style={{
                                                                                    backgroundColor: `${funnel.folder.color || '#16a34a'}20`,
                                                                                    color: funnel.folder.color || '#16a34a',
                                                                                }}
                                                                            >
                                                                                <Folder className="w-2.5 h-2.5" />
                                                                                {funnel.folder.name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Step Count Badge - GoHighLevel Green Style */}
                                                        <td className="p-3.5">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                <Layers className="w-3 h-3" />
                                                                {funnel.steps_count ?? 0} {funnel.steps_count === 1 ? 'Step' : 'Steps'}
                                                            </span>
                                                        </td>

                                                        {/* Status */}
                                                        <td className="p-3.5">
                                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[funnel.status] ?? ''}`}>
                                                                {t(`funnel.status_${funnel.status}`) || funnel.status}
                                                            </span>
                                                        </td>

                                                        {/* Views / Conv. */}
                                                        <td className="p-3.5">
                                                            <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                                                {fmt(funnel.views_count)} views
                                                            </div>
                                                            <div className="text-[11px] text-neutral-400">
                                                                {funnel.conversion_rate ?? 0}% conv. ({fmt(funnel.conversions_count)})
                                                            </div>
                                                        </td>

                                                        {/* Revenue */}
                                                        <td className="p-3.5 font-semibold text-neutral-900 dark:text-neutral-100">
                                                            ${fmt(funnel.total_revenue)}
                                                        </td>

                                                        {/* Last Updated */}
                                                        <td className="p-3.5 text-neutral-500">
                                                            {fmtDate(funnel.updated_at)}
                                                        </td>

                                                        {/* Actions Menu */}
                                                        <td className="p-3.5 text-right">
                                                            <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenMenuId(openMenuId === `funnel_${funnel.id}` ? null : `funnel_${funnel.id}`);
                                                                    }}
                                                                    className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                                >
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>
                                                                {openMenuId === `funnel_${funnel.id}` && (
                                                                    <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg py-1 z-30">
                                                                        <Link
                                                                            href={route('client.funnels.edit', funnel.uuid)}
                                                                            className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                            Edit in Builder
                                                                        </Link>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setOpenMenuId(null);
                                                                                handleDuplicate(funnel);
                                                                            }}
                                                                            className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                                        >
                                                                            <Copy className="w-3.5 h-3.5" />
                                                                            Duplicate
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setOpenMenuId(null);
                                                                                setMoveModal({ isOpen: true, funnels: [funnel] });
                                                                            }}
                                                                            className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                                        >
                                                                            <FolderOpen className="w-3.5 h-3.5" />
                                                                            Move to Folder
                                                                        </button>
                                                                        <Link
                                                                            href={route('client.reports.funnels.show', funnel.uuid)}
                                                                            className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                                        >
                                                                            <BarChart2 className="w-3.5 h-3.5" />
                                                                            Analytics Report
                                                                        </Link>
                                                                        {funnel.status === 'published' && (
                                                                            <a
                                                                                href={`/f/${funnel.slug}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                                            >
                                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                                Live Page
                                                                            </a>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setOpenMenuId(null);
                                                                                handleDelete(funnel);
                                                                            }}
                                                                            className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-700/50 mt-1 pt-1"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                            Delete Funnel
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {/* ─── 2. Cards Grid View ────────────────────────────── */}
                        {viewMode === 'grid' && (
                            <div className="space-y-6">
                                {/* Folders Grid (Root level) */}
                                {!activeFolder && !search && folders.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                            Folders ({folders.length})
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {folders.map((folder) => (
                                                <div
                                                    key={`grid_folder_${folder.id}`}
                                                    onClick={() => handleNavigateFolder(folder.id)}
                                                    className="group relative p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-brand-500 hover:shadow-md transition cursor-pointer flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            className="p-2.5 rounded-lg text-white shrink-0 shadow-xs"
                                                            style={{ backgroundColor: folder.color || '#16a34a' }}
                                                        >
                                                            <Folder className="w-5 h-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                                                {folder.name}
                                                            </h4>
                                                            <p className="text-xs text-neutral-400">
                                                                {folder.funnels_count ?? 0} {folder.funnels_count === 1 ? 'funnel' : 'funnels'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenMenuId(openMenuId === `grid_folder_${folder.id}` ? null : `grid_folder_${folder.id}`)}
                                                            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                        {openMenuId === `grid_folder_${folder.id}` && (
                                                            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg py-1 z-30">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenMenuId(null);
                                                                        setFolderModal({ isOpen: true, folder });
                                                                    }}
                                                                    className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                    Rename
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenMenuId(null);
                                                                        handleDeleteFolder(folder);
                                                                    }}
                                                                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-2"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Funnels Grid */}
                                <div className="space-y-3">
                                    {!activeFolder && !search && folders.length > 0 && (
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                            Funnels ({funnels.length})
                                        </h3>
                                    )}
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                        {funnels.map((funnel) => (
                                            <article
                                                key={`grid_funnel_${funnel.id}`}
                                                className="group flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-600"
                                            >
                                                {/* Card Header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex min-w-0 items-center gap-2.5">
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                                                            <Funnel className="h-4 w-4 text-brand-500" aria-hidden="true" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={route('client.funnels.show', funnel.uuid)}
                                                                className="truncate font-semibold text-neutral-900 hover:text-brand-600 dark:text-neutral-100 dark:hover:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded block"
                                                            >
                                                                {funnel.name}
                                                            </Link>
                                                            {funnel.folder && (
                                                                <span
                                                                    onClick={() => handleNavigateFolder(funnel.folder.id)}
                                                                    className="inline-flex items-center gap-1 text-[10px] font-medium cursor-pointer hover:opacity-80 mt-0.5"
                                                                    style={{ color: funnel.folder.color || '#16a34a' }}
                                                                >
                                                                    <Folder className="w-2.5 h-2.5" />
                                                                    {funnel.folder.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {/* Green Steps Badge */}
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                            {funnel.steps_count ?? 0} {funnel.steps_count === 1 ? 'Step' : 'Steps'}
                                                        </span>
                                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[funnel.status] ?? ''}`}>
                                                            {t(`funnel.status_${funnel.status}`) || funnel.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* URL chip */}
                                                <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400 truncate">
                                                    <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                                    <span className="truncate">/f/{funnel.slug}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyUrl(funnel)}
                                                        aria-label="Copy URL"
                                                        className="ml-auto shrink-0 rounded p-0.5 hover:text-brand-500 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                    >
                                                        {copiedId === funnel.id ? (
                                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Stats row */}
                                                <div className="mt-4 grid grid-cols-4 divide-x divide-neutral-100 dark:divide-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 py-2.5 text-center">
                                                    {[
                                                        { label: 'Views', value: fmt(funnel.views_count) },
                                                        { label: 'Conv.', value: `${funnel.conversion_rate ?? 0}%` },
                                                        { label: 'Revenue', value: `$${fmt(funnel.total_revenue)}` },
                                                        { label: 'Steps', value: funnel.steps_count ?? 0 },
                                                    ].map(({ label, value }) => (
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
                                                        <button
                                                            type="button"
                                                            onClick={() => setMoveModal({ isOpen: true, funnels: [funnel] })}
                                                            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800 transition"
                                                            title="Move to Folder"
                                                        >
                                                            <FolderOpen className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDuplicate(funnel)}
                                                            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800 transition"
                                                            title="Duplicate Funnel"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                        <Link
                                                            href={route('client.funnels.edit', funnel.uuid)}
                                                            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800 transition"
                                                            title="Edit in Builder"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                        <Link
                                                            href={route('client.reports.funnels.show', funnel.uuid)}
                                                            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800 transition"
                                                            title="Analytics Report"
                                                        >
                                                            <BarChart2 className="h-4 w-4" />
                                                        </Link>
                                                        {funnel.status === 'published' && (
                                                            <a
                                                                href={`/f/${funnel.slug}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800 transition"
                                                                title="Preview Live Page"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(funnel)}
                                                            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800 transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Create Funnel Modal ────────────────────────────────────────── */}
            <Modal show={showCreate} onClose={() => { setShowCreate(false); reset(); }} maxWidth="sm">
                <Modal.Header title={t('funnel.create_funnel') || 'Create Funnel'} onClose={() => { setShowCreate(false); reset(); }} />
                <form onSubmit={handleCreate} noValidate>
                    <Modal.Body className="space-y-3">
                        <Input
                            id="funnel-name"
                            label={t('funnel.funnel_name') || 'Funnel Name'}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoFocus
                            placeholder={t('funnel.funnel_name_placeholder') || 'e.g. Black Friday Special'}
                            error={errors.name}
                        />

                        {/* Folder Assignment indicator */}
                        <Select
                            label="Folder"
                            value={data.folder_id || ''}
                            onChange={(e) => setData('folder_id', e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">Home (No Folder / Root)</option>
                            {folders.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </Select>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowCreate(false);
                                reset();
                            }}
                        >
                            {t('common.cancel') || 'Cancel'}
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing ? (t('common.saving') || 'Creating...') : (t('common.create') || 'Create Funnel')}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* ── Folder Create/Edit Modal ──────────────────────────────────── */}
            <FolderModal
                isOpen={folderModal.isOpen}
                folder={folderModal.folder}
                onClose={() => setFolderModal({ isOpen: false, folder: null })}
                onSave={handleSaveFolder}
            />

            {/* ── Move To Folder Modal ──────────────────────────────────────── */}
            <MoveToFolderModal
                isOpen={moveModal.isOpen}
                funnels={moveModal.funnels}
                folders={folders}
                onClose={() => setMoveModal({ isOpen: false, funnels: [] })}
                onMove={handleMoveSubmit}
            />
        </ClientLayout>
    );
}
