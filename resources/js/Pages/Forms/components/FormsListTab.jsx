import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import EmptyState from '@/Components/EmptyState';
import {
    Folder,
    FolderPlus,
    Plus,
    LayoutGrid,
    List as ListIcon,
    Search,
    MoreVertical,
    Pencil,
    Copy,
    Trash2,
    ExternalLink,
    Code,
    Check,
    FolderInput,
    Layers,
    ShieldCheck,
    FormInput,
    Home,
    ChevronRight,
    Users,
    Eye,
} from 'lucide-react';
import FolderModal from './FolderModal';
import MoveToFolderModal from './MoveToFolderModal';
import { useConfirm } from '@/context/ConfirmationContext';

export default function FormsListTab({
    forms = [],
    folders = [],
    activeFolder = null,
    filters = {},
}) {
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
    const [search, setSearch] = useState(filters.search || '');
    const [copied, setCopied] = useState(null);

    // Modal states
    const [folderModal, setFolderModal] = useState({ isOpen: false, folder: null });
    const [moveModal, setMoveModal] = useState({ isOpen: false, forms: [] });
    const [openMenuId, setOpenMenuId] = useState(null); // 'form_12' or 'folder_3'

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get(
            route('client.forms.index'),
            {
                tab: 'forms',
                folder_id: activeFolder ? activeFolder.id : undefined,
                search: search || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleNavigateFolder = (folderId) => {
        router.get(
            route('client.forms.index'),
            {
                tab: 'forms',
                folder_id: folderId || undefined,
                search: search || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const { confirm } = useConfirm();

    const handleCopyEmbed = (slug) => {
        const snippet = `<iframe src="${window.location.origin}/forms/embed/${slug}" width="100%" height="500" frameborder="0"></iframe>`;
        navigator.clipboard?.writeText(snippet);
        setCopied(slug);
        setTimeout(() => setCopied(null), 2500);
    };

    const handleDeleteForm = async (form) => {
        const ok = await confirm({
            title: 'Delete Form',
            message: `Are you sure you want to delete the form "${form.name}"? This action cannot be undone.`,
            confirmText: 'Delete Form',
            variant: 'danger',
        });
        if (ok) {
            router.delete(route('client.forms.destroy', form.id), { preserveScroll: true });
        }
    };

    const handleDuplicateForm = (form) => {
        router.post(route('client.forms.duplicate', form.id), {}, { preserveScroll: true });
    };

    const handleSaveFolder = (data) => {
        if (folderModal.folder) {
            router.put(route('client.forms.folders.update', folderModal.folder.id), data, {
                onSuccess: () => setFolderModal({ isOpen: false, folder: null }),
            });
        } else {
            router.post(route('client.forms.folders.store'), data, {
                onSuccess: () => setFolderModal({ isOpen: false, folder: null }),
            });
        }
    };

    const handleDeleteFolder = async (folder) => {
        const ok = await confirm({
            title: 'Delete Folder',
            message: `Are you sure you want to delete the folder "${folder.name}"? All forms inside will move to Home.`,
            confirmText: 'Delete Folder',
            variant: 'danger',
        });
        if (ok) {
            router.delete(route('client.forms.folders.destroy', folder.id), { preserveScroll: true });
        }
    };

    const handleMoveSubmit = (payload) => {
        router.post(route('client.forms.move_to_folder'), payload, {
            onSuccess: () => setMoveModal({ isOpen: false, forms: [] }),
        });
    };

    return (
        <div className="space-y-5">
            {/* Toolbar: Breadcrumbs, Search, View Switcher & Action Buttons */}
            <Card padding={true} className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left: Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm font-semibold w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => handleNavigateFolder(null)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-soft transition ${
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
                            <span className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100 px-2.5 py-1 rounded-soft bg-neutral-100 dark:bg-neutral-800">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: activeFolder.color || '#16a34a' }}
                                />
                                {activeFolder.name}
                            </span>
                        </>
                    )}
                </div>

                {/* Right: Search, View Switcher, Create Folder & Add Form */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                    {/* Search */}
                    <form onSubmit={handleSearchSubmit} className="min-w-[180px]">
                        <Input
                            size="sm"
                            leftIcon={<Search className="w-3.5 h-3.5" />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search forms..."
                        />
                    </form>

                    {/* View Switcher */}
                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-soft border border-neutral-200 dark:border-neutral-700">
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`p-1 rounded transition ${
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
                            onClick={() => setViewMode('grid')}
                            className={`p-1 rounded transition ${
                                viewMode === 'grid'
                                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200'
                            }`}
                            title="Grid Card View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Create Folder Button */}
                    {!activeFolder && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setFolderModal({ isOpen: true, folder: null })}
                            className="flex items-center gap-1.5 text-xs"
                        >
                            <FolderPlus className="w-3.5 h-3.5" />
                            Create folder
                        </Button>
                    )}

                    {/* Add Form Button */}
                    <Link
                        href={route('client.forms.create')}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs rounded-soft transition shadow-soft shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        + Add Form
                    </Link>
                </div>
            </Card>

            {/* Content: Folders & Forms */}
            {viewMode === 'table' ? (
                /* ─── Table / List View (GHL Style) ────────────────────────────── */
                <Card padding={false} className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-200 font-semibold border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="p-3.5">Name</th>
                                    <th className="p-3.5">Status / Type</th>
                                    <th className="p-3.5">Views</th>
                                    <th className="p-3.5">Submissions</th>
                                    <th className="p-3.5">Last Updated</th>
                                    <th className="p-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {/* Folders (when on root Home) */}
                                {!activeFolder &&
                                    folders.map((folder) => (
                                        <tr
                                            key={`folder_${folder.id}`}
                                            onClick={() => handleNavigateFolder(folder.id)}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition cursor-pointer"
                                        >
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="p-2 rounded-soft text-white shrink-0"
                                                        style={{ backgroundColor: folder.color || '#16a34a' }}
                                                    >
                                                        <Folder className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                                                            {folder.name}
                                                        </span>
                                                        <span className="text-xs text-neutral-400 block">
                                                            {folder.forms_count ?? 0} {folder.forms_count === 1 ? 'form' : 'forms'}
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
                                            <td className="p-3.5 text-neutral-500">
                                                {new Date(folder.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-3.5 text-right">
                                                <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenMenuId(openMenuId === `folder_${folder.id}` ? null : `folder_${folder.id}`)}
                                                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-soft hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {openMenuId === `folder_${folder.id}` && (
                                                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-neutral-800 rounded-soft border border-neutral-200 dark:border-neutral-700 shadow-lg py-1 z-30">
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
                                                                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
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

                                {/* Forms Rows */}
                                {forms.map((form) => (
                                    <tr
                                        key={`form_${form.id}`}
                                        className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition"
                                    >
                                        <td className="p-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-soft bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 shrink-0">
                                                    <FormInput className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <Link
                                                        href={route('client.forms.edit', form.id)}
                                                        className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm hover:text-brand-600 transition"
                                                    >
                                                        {form.name}
                                                    </Link>
                                                    {form.title && (
                                                        <span className="text-xs text-neutral-400 block truncate max-w-xs">
                                                            "{form.title}"
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <Badge
                                                    variant={form.is_active ? 'success' : 'default'}
                                                    size="sm"
                                                >
                                                    {form.is_active ? 'Active' : 'Disabled'}
                                                </Badge>
                                                <Badge variant="default" size="sm" className="capitalize">
                                                    {form.type}
                                                </Badge>
                                            </div>
                                        </td>

                                        <td className="p-3.5 font-semibold text-neutral-700 dark:text-neutral-300">
                                            <div className="flex items-center gap-1 text-xs">
                                                <Eye className="w-3.5 h-3.5 text-neutral-400" />
                                                {form.views_count ?? 0}
                                            </div>
                                        </td>

                                        <td className="p-3.5 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                                            <div className="flex items-center gap-1 text-xs">
                                                <Users className="w-3.5 h-3.5 text-brand-500" />
                                                {form.submissions_count ?? 0}
                                            </div>
                                        </td>

                                        <td className="p-3.5 text-neutral-500">
                                            {new Date(form.updated_at).toLocaleDateString()}
                                        </td>

                                        <td className="p-3.5 text-right">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenMenuId(openMenuId === `form_${form.id}` ? null : `form_${form.id}`)}
                                                    className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-soft hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                {openMenuId === `form_${form.id}` && (
                                                    <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-neutral-800 rounded-soft border border-neutral-200 dark:border-neutral-700 shadow-lg py-1 z-30">
                                                        <Link
                                                            href={route('client.forms.edit', form.id)}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                            Edit in Builder
                                                        </Link>
                                                        <a
                                                            href={route('public.subscribe.show', form.slug)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            Preview Form
                                                        </a>
                                                        <Link
                                                            href={route('client.forms.show', form.id)}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                        >
                                                            <Code className="w-3.5 h-3.5" />
                                                            Embed / API Keys
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                setMoveModal({ isOpen: true, forms: [form] });
                                                            }}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                        >
                                                            <FolderInput className="w-3.5 h-3.5" />
                                                            Move to Folder
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                handleDuplicateForm(form);
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
                                                                handleDeleteForm(form);
                                                            }}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-700 mt-1"
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
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                /* ─── Grid Card View ─────────────────────────────────────────────── */
                <div className="space-y-6">
                    {/* Folders Grid (when on root Home) */}
                    {!activeFolder && folders.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Folders</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {folders.map((folder) => (
                                    <div
                                        key={folder.id}
                                        onClick={() => handleNavigateFolder(folder.id)}
                                        className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-soft-lg hover:border-brand-500 shadow-soft-xs transition cursor-pointer flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="p-2.5 rounded-soft text-white"
                                                style={{ backgroundColor: folder.color || '#16a34a' }}
                                            >
                                                <Folder className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 block">
                                                    {folder.name}
                                                </span>
                                                <span className="text-xs text-neutral-400">
                                                    {folder.forms_count ?? 0} {folder.forms_count === 1 ? 'form' : 'forms'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFolderModal({ isOpen: true, folder });
                                            }}
                                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Forms Cards Grid */}
                    <div className="space-y-3">
                        {!activeFolder && folders.length > 0 && (
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Forms</h3>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {forms.map((form) => (
                                <Card
                                    key={form.id}
                                    padding={true}
                                    className="flex flex-col justify-between space-y-4 hover:border-brand-400 transition shadow-soft-xs"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base truncate">
                                                {form.name}
                                            </h3>
                                            <Badge
                                                variant={form.is_active ? 'success' : 'default'}
                                                size="sm"
                                            >
                                                {form.is_active ? 'Active' : 'Disabled'}
                                            </Badge>
                                        </div>

                                        {form.title && (
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                                "{form.title}"
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            <Badge variant="default" size="sm" className="gap-1 capitalize">
                                                <Layers className="w-3 h-3" />
                                                {form.type}
                                            </Badge>

                                            {form.double_optin_enabled && (
                                                <Badge variant="brand" size="sm" className="gap-1">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    OTP ({form.optin_channel})
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="pt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5 text-neutral-400" />
                                                <span>{form.views_count ?? 0} views</span>
                                            </div>
                                            <div className="flex items-center gap-1 font-bold text-neutral-900 dark:text-neutral-100">
                                                <Users className="w-3.5 h-3.5 text-brand-500" />
                                                <span>{form.submissions_count ?? 0} submissions</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                            <Link
                                                href={route('client.forms.edit', form.id)}
                                                className="p-1.5 text-neutral-500 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-soft transition"
                                                title="Edit Form"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                            <a
                                                href={route('public.subscribe.show', form.slug)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 text-neutral-500 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-soft transition"
                                                title="Preview Form"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <Link
                                                href={route('client.forms.show', form.id)}
                                                className="p-1.5 text-neutral-500 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-soft transition"
                                                title="Embed Code & API"
                                            >
                                                <Code className="w-4 h-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setMoveModal({ isOpen: true, forms: [form] })}
                                                className="p-1.5 text-neutral-500 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-soft transition"
                                                title="Move to Folder"
                                            >
                                                <FolderInput className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleCopyIframe(form.slug)}
                                                className="text-xs"
                                            >
                                                {copied === form.slug ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    'Copy iFrame'
                                                )}
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteForm(form)}
                                                className="p-1.5 text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-950/30 rounded-soft transition"
                                                title="Delete Form"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {forms.length === 0 && (activeFolder || folders.length === 0) && (
                <EmptyState
                    icon={<FormInput className="w-8 h-8" />}
                    title={activeFolder ? `No Forms in "${activeFolder.name}"` : 'No Subscription Forms Created'}
                    description="Create your first subscription form or move existing forms into this folder."
                    action={{
                        label: 'Create Subscription Form',
                        href: route('client.forms.create'),
                    }}
                />
            )}

            {/* Modals */}
            <FolderModal
                isOpen={folderModal.isOpen}
                folder={folderModal.folder}
                onClose={() => setFolderModal({ isOpen: false, folder: null })}
                onSave={handleSaveFolder}
            />

            <MoveToFolderModal
                isOpen={moveModal.isOpen}
                forms={moveModal.forms}
                folders={folders}
                onClose={() => setMoveModal({ isOpen: false, forms: [] })}
                onMove={handleMoveSubmit}
            />
        </div>
    );
}
