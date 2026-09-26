import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import {
    Plus,
    Search,
    Folder,
    FolderPlus,
    GripVertical,
    MoreHorizontal,
    RotateCcw,
    Trash2,
    Sliders,
    User,
    Target,
    Building2,
    Check,
    Copy,
    ChevronLeft,
    ChevronRight,
    Tag,
    Edit2,
    Lock,
    Link2,
    ExternalLink,
} from 'lucide-react';
import axios from 'axios';
import CreateCustomFieldModal from '@/Pages/Forms/Builder/modals/CreateCustomFieldModal';
import AddFolderModal from './AddFolderModal';
import ConfirmDialogModal from './ConfirmDialogModal';
import RenameFolderModal from './RenameFolderModal';
import AddCustomValueModal from './AddCustomValueModal';
import AddTriggerLinkModal from './AddTriggerLinkModal';

export default function CustomFieldsIndex({ folders = [], customFields = [], deletedFields = [], customValues = [], triggerLinks = [] }) {
    const [activeTab, setActiveTab] = useState('folders'); // 'all', 'folders', 'deleted', 'custom_values', 'trigger_links'
    const [filterObject, setFilterObject] = useState('all'); // 'all', 'contact', 'opportunity', 'company'
    const [filterFolder, setFilterFolder] = useState('all'); // 'all' or folder key/id
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
    const [isAddCustomValueModalOpen, setIsAddCustomValueModalOpen] = useState(false);
    const [customValueToEdit, setCustomValueToEdit] = useState(null);
    const [isAddTriggerLinkModalOpen, setIsAddTriggerLinkModalOpen] = useState(false);
    const [triggerLinkToEdit, setTriggerLinkToEdit] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);
    const [selectedFieldIds, setSelectedFieldIds] = useState([]);
    const [draggedFolderIndex, setDraggedFolderIndex] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
        onConfirm: () => {},
    });
    const [renameFolderModal, setRenameFolderModal] = useState({
        isOpen: false,
        folder: null,
    });

    // Filtered folders for Folders Tab
    const filteredFolders = useMemo(() => {
        return folders.filter(folder => {
            const matchesObject = filterObject === 'all' || folder.object_target === filterObject;
            const matchesSearch = searchQuery === '' || folder.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesObject && matchesSearch;
        });
    }, [folders, filterObject, searchQuery]);

    // Filtered fields for All Fields Tab
    const filteredFields = useMemo(() => {
        return customFields.filter(field => {
            const matchesObject = filterObject === 'all' || field.object_target === filterObject;
            const matchesFolder = filterFolder === 'all' || (field.field_group || 'general_info') === filterFolder;
            const matchesSearch = searchQuery === ''
                || field.name.toLowerCase().includes(searchQuery.toLowerCase())
                || field.key.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesObject && matchesFolder && matchesSearch;
        });
    }, [customFields, filterObject, filterFolder, searchQuery]);

    // Filtered fields for Deleted Tab
    const filteredDeletedFields = useMemo(() => {
        return deletedFields.filter(field => {
            const matchesObject = filterObject === 'all' || field.object_target === filterObject;
            const matchesSearch = searchQuery === ''
                || field.name.toLowerCase().includes(searchQuery.toLowerCase())
                || field.key.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesObject && matchesSearch;
        });
    }, [deletedFields, filterObject, searchQuery]);

    // Filtered custom values for Custom Values Tab
    const filteredCustomValues = useMemo(() => {
        if (!searchQuery.trim()) return customValues;
        const q = searchQuery.toLowerCase();
        return customValues.filter(val =>
            (val.name && val.name.toLowerCase().includes(q)) ||
            (val.key && val.key.toLowerCase().includes(q)) ||
            (val.value && val.value.toLowerCase().includes(q))
        );
    }, [customValues, searchQuery]);

    // Filtered trigger links for Trigger Links Tab
    const filteredTriggerLinks = useMemo(() => {
        if (!searchQuery.trim()) return triggerLinks;
        const q = searchQuery.toLowerCase();
        return triggerLinks.filter(tl =>
            (tl.name && tl.name.toLowerCase().includes(q)) ||
            (tl.slug && tl.slug.toLowerCase().includes(q)) ||
            (tl.target_url && tl.target_url.toLowerCase().includes(q))
        );
    }, [triggerLinks, searchQuery]);

    const handleCopyMergeTag = (field) => {
        const tag = `{{ ${field.object_target || 'contact'}.${field.key} }}`;
        navigator.clipboard.writeText(tag);
        setCopiedKey(field.id);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleCopyCustomValueTag = (val) => {
        const tag = `{{ custom_values.${val.key} }}`;
        navigator.clipboard.writeText(tag);
        setCopiedKey(`cv_${val.id}`);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleCopyTriggerLinkTag = (tl) => {
        const tag = `{{ trigger_links.${tl.slug} }}`;
        navigator.clipboard.writeText(tag);
        setCopiedKey(`tl_${tl.id}`);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleCopyShortUrl = (tl) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${origin}/l/${tl.slug}`;
        navigator.clipboard.writeText(url);
        setCopiedKey(`url_${tl.id}`);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleDeleteCustomValueWithCheck = (val) => {
        axios.get(route('client.custom_values.check_dependencies', val.id))
            .then(res => {
                const count = res.data?.used_in_count || 0;
                const autos = res.data?.automations || [];
                const warning = count > 0
                    ? `⚠️ Dependency Warning: "${val.name}" is currently referenced in ${count} active automation(s) (${autos.map(a => a.name).slice(0, 3).join(', ')}${autos.length > 3 ? '...' : ''}). Deleting it will leave empty placeholders in those messages. Are you sure you want to delete?`
                    : `Are you sure you want to delete "${val.name}"?`;

                setConfirmModal({
                    isOpen: true,
                    title: count > 0 ? 'Delete Referenced Custom Value?' : 'Delete Custom Value',
                    message: warning,
                    confirmText: count > 0 ? 'Delete Anyway' : 'Delete',
                    cancelText: 'Cancel',
                    variant: 'danger',
                    onConfirm: () => {
                        router.delete(route('client.custom_values.destroy', val.id), { preserveScroll: true });
                    },
                });
            })
            .catch(() => {
                setConfirmModal({
                    isOpen: true,
                    title: 'Delete Custom Value',
                    message: `Are you sure you want to delete "${val.name}"?`,
                    confirmText: 'Delete',
                    cancelText: 'Cancel',
                    variant: 'danger',
                    onConfirm: () => {
                        router.delete(route('client.custom_values.destroy', val.id), { preserveScroll: true });
                    },
                });
            });
    };

    const handleDeleteTriggerLinkWithCheck = (tl) => {
        axios.get(route('client.trigger_links.check_dependencies', tl.id))
            .then(res => {
                const count = res.data?.used_in_count || 0;
                const autos = res.data?.automations || [];
                const warning = count > 0
                    ? `⚠️ Dependency Warning: Trigger Link "${tl.name}" is used as a workflow trigger in ${count} active automation(s) (${autos.map(a => a.name).slice(0, 3).join(', ')}${autos.length > 3 ? '...' : ''}). Deleting it will stop those workflows from triggering when contacts click this link.`
                    : `Are you sure you want to delete trigger link "${tl.name}"? The short URL /l/${tl.slug} will stop redirecting.`;

                setConfirmModal({
                    isOpen: true,
                    title: count > 0 ? 'Delete Active Trigger Link?' : 'Delete Trigger Link',
                    message: warning,
                    confirmText: count > 0 ? 'Delete Anyway' : 'Delete',
                    cancelText: 'Cancel',
                    variant: 'danger',
                    onConfirm: () => {
                        router.delete(route('client.trigger_links.destroy', tl.id), { preserveScroll: true });
                    },
                });
            })
            .catch(() => {
                setConfirmModal({
                    isOpen: true,
                    title: 'Delete Trigger Link',
                    message: `Are you sure you want to delete trigger link "${tl.name}"?`,
                    confirmText: 'Delete',
                    cancelText: 'Cancel',
                    variant: 'danger',
                    onConfirm: () => {
                        router.delete(route('client.trigger_links.destroy', tl.id), { preserveScroll: true });
                    },
                });
            });
    };

    const handleDeleteFieldWithCheck = (field) => {
        axios.get(route('client.custom_fields.check_dependencies', field.id))
            .then(res => {
                const count = res.data?.used_in_count || 0;
                const autos = res.data?.automations || [];
                const warning = count > 0
                    ? `⚠️ Dependency Warning: Field "${field.name}" is referenced in ${count} active automation(s) (${autos.map(a => a.name).slice(0, 3).join(', ')}${autos.length > 3 ? '...' : ''}). Deleting it will leave empty values in those workflows.`
                    : `Are you sure you want to delete field "${field.name}"? It will be moved to the recycle bin.`;

                setConfirmModal({
                    isOpen: true,
                    title: count > 0 ? 'Delete Referenced Custom Field?' : 'Move to Trash',
                    message: warning,
                    confirmText: count > 0 ? 'Delete Anyway' : 'Delete',
                    cancelText: 'Cancel',
                    variant: 'danger',
                    onConfirm: () => {
                        router.delete(route('client.custom_fields.destroy', field.id), { preserveScroll: true });
                    },
                });
            })
            .catch(() => {
                setConfirmModal({
                    isOpen: true,
                    title: 'Move to Trash',
                    message: `Are you sure you want to delete field "${field.name}"?`,
                    confirmText: 'Delete',
                    cancelText: 'Cancel',
                    variant: 'danger',
                    onConfirm: () => {
                        router.delete(route('client.custom_fields.destroy', field.id), { preserveScroll: true });
                    },
                });
            });
    };

    const SYSTEM_KEYS = [
        'first_name', 'last_name', 'name', 'email', 'phone_e164', 'whatsapp',
        'date_of_birth', 'contact_type', 'timezone', 'source',
        'company_name', 'address_1', 'address_2', 'city', 'state', 'postal_code',
        'country', 'website', 'job_title', 'notes', 'vat_id',
    ];

    const selectableFields = filteredFields.filter(
        f => !f.is_system && !SYSTEM_KEYS.includes(f.key) && !['contact', 'general_info'].includes(f.field_group)
    );

    const toggleSelectAll = () => {
        if (selectableFields.length > 0 && selectedFieldIds.length === selectableFields.length) {
            setSelectedFieldIds([]);
        } else {
            setSelectedFieldIds(selectableFields.map(f => f.id));
        }
    };

    const toggleSelectField = (id) => {
        setSelectedFieldIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleCreateField = (newFieldData) => {
        router.post(route('client.custom_fields.store'), {
            name: newFieldData.label || newFieldData.name,
            key: newFieldData.key,
            type: newFieldData.type,
            object_target: newFieldData.objectTarget || 'contact',
            field_group: newFieldData.fieldGroup || 'general_info',
            options: newFieldData.options,
            placeholder: newFieldData.placeholder,
            is_required: newFieldData.required,
        });
    };

    const handleCreateFolder = (folderData) => {
        router.post(route('client.custom_fields.folders.store'), {
            name: folderData.name,
            object_target: folderData.object_target,
        });
    };

    const handleDeleteFolder = (folder) => {
        if (folder.is_system) {
            setConfirmModal({
                isOpen: true,
                title: 'System Protected Folder',
                message: 'System default folders are required by CRM operations and cannot be deleted.',
                confirmText: 'Got it',
                cancelText: null,
                variant: 'primary',
                onConfirm: () => {},
            });
            return;
        }
        setConfirmModal({
            isOpen: true,
            title: 'Delete Folder',
            message: `Are you sure you want to delete the folder "${folder.name}"?`,
            confirmText: 'Delete Folder',
            cancelText: 'Cancel',
            variant: 'danger',
            onConfirm: () => {
                router.delete(route('client.custom_fields.folders.destroy', folder.id));
            },
        });
    };

    const handleRenameFolder = (folder) => {
        setRenameFolderModal({
            isOpen: true,
            folder: folder,
        });
    };

    const handleSaveRenameFolder = (folder, newName, objectTarget) => {
        if (newName && newName.trim()) {
            router.put(route('client.custom_fields.folders.update', folder.id), {
                name: newName.trim(),
                object_target: objectTarget || folder.object_target,
            });
        }
    };

    const handleDeleteField = (field) => {
        const fieldId = typeof field === 'object' ? field.id : field;
        const fieldName = typeof field === 'object' ? field.name : 'this custom field';
        setConfirmModal({
            isOpen: true,
            title: 'Delete Custom Field',
            message: `Are you sure you want to move "${fieldName}" to Deleted Fields?`,
            confirmText: 'Move to Deleted',
            cancelText: 'Cancel',
            variant: 'danger',
            onConfirm: () => {
                router.delete(route('client.custom_fields.destroy', fieldId));
            },
        });
    };

    const handleRestoreField = (id) => {
        router.post(route('client.custom_fields.restore', id));
    };

    const handleForceDeleteField = (field) => {
        const fieldId = typeof field === 'object' ? field.id : field;
        const fieldName = typeof field === 'object' ? field.name : 'this custom field';
        setConfirmModal({
            isOpen: true,
            title: 'Permanently Purge Field',
            message: `Permanently purge "${fieldName}"? This action cannot be undone.`,
            confirmText: 'Permanently Purge',
            cancelText: 'Cancel',
            variant: 'danger',
            onConfirm: () => {
                router.delete(route('client.custom_fields.force_delete', fieldId));
            },
        });
    };

    const formatDate = (isoStr) => {
        if (!isoStr) return '—';
        try {
            const d = new Date(isoStr);
            const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            return `${datePart} At ${timePart}`;
        } catch {
            return isoStr;
        }
    };

    // Drag-and-drop reordering for folders
    const handleDragStart = (e, index) => {
        setDraggedFolderIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedFolderIndex === null || draggedFolderIndex === targetIndex) return;

        const updated = [...filteredFolders];
        const [moved] = updated.splice(draggedFolderIndex, 1);
        updated.splice(targetIndex, 0, moved);

        const folderIds = updated.map(f => f.id);
        router.post(route('client.custom_fields.folders.reorder'), { folder_ids: folderIds }, {
            preserveState: true,
            preserveScroll: true,
        });

        setDraggedFolderIndex(null);
    };

    return (
        <ClientLayout title="Custom Fields">
            <Head title="Custom Fields" />

            <div className="max-w-7xl mx-auto space-y-4 pb-12">
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* View Switcher Tabs (All Fields / Folders / Deleted Fields) */}
                    <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60 w-fit">
                        {[
                            { id: 'all', label: 'All Fields', count: customFields.length },
                            { id: 'folders', label: 'Folders', count: folders.length },
                            { id: 'deleted', label: 'Deleted Fields', count: deletedFields.length },
                            { id: 'custom_values', label: 'Custom Values', count: customValues.length },
                            { id: 'trigger_links', label: 'Trigger Links', count: triggerLinks.length },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id === 'all') setFilterFolder('all');
                                }}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                                    activeTab === tab.id
                                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                                        activeTab === tab.id
                                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                                            : 'bg-neutral-200/70 dark:bg-neutral-700/60 text-neutral-500 dark:text-neutral-400'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Top Right Action Buttons */}
                    <div className="flex items-center gap-2.5">
                        {activeTab === 'custom_values' ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomValueToEdit(null);
                                    setIsAddCustomValueModalOpen(true);
                                }}
                                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Custom Value</span>
                            </button>
                        ) : activeTab === 'trigger_links' ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setTriggerLinkToEdit(null);
                                    setIsAddTriggerLinkModalOpen(true);
                                }}
                                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Trigger Link</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsAddFolderModalOpen(true)}
                                    className="px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                    <FolderPlus className="w-4 h-4 text-neutral-500" />
                                    <span>Add Folder</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Field</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Search & Object Target & Folder Filter Row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={
                                activeTab === 'custom_values'
                                    ? "Search custom values by name, key, or value..."
                                    : activeTab === 'trigger_links'
                                    ? "Search trigger links by name, slug, or target URL..."
                                    : "Search..."
                            }
                            className="w-full pl-9 pr-3.5 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs"
                        />
                    </div>

                    {/* Filter Selectors (Folder Group By + Object Target) - Only for field tabs */}
                    {activeTab !== 'custom_values' && activeTab !== 'trigger_links' && (
                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                            {/* Group By Folder Selector (GHL Feature) */}
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                <span className="shrink-0 font-medium">Group By</span>
                                <select
                                    value={filterFolder}
                                    onChange={(e) => setFilterFolder(e.target.value)}
                                    className="px-3 py-2 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs cursor-pointer"
                                >
                                    <option value="all">All Folders</option>
                                    {folders.map(folder => (
                                        <option key={folder.key || folder.id} value={folder.key || folder.id}>
                                            {folder.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Object Target Filter Dropdown (Contact, Opportunity, Company, All) */}
                            <div className="w-full sm:w-40">
                                <select
                                    value={filterObject}
                                    onChange={(e) => setFilterObject(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-medium border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs cursor-pointer capitalize"
                                >
                                    <option value="all">All Objects</option>
                                    <option value="contact">Contact</option>
                                    <option value="opportunity">Opportunity</option>
                                    <option value="company">Company</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── TAB 1: FOLDERS VIEW (Matching GoHighLevel) ────────────────────── */}
                {activeTab === 'folders' && (
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        <th className="py-3 px-4 w-12 text-center"></th>
                                        <th className="py-3 px-4">Folder Name</th>
                                        <th className="py-3 px-4">Object</th>
                                        <th className="py-3 px-4">Fields</th>
                                        <th className="py-3 px-4">Created On</th>
                                        <th className="py-3 px-4 w-16 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                                    {filteredFolders.map((folder, index) => {
                                        return (
                                            <tr
                                                key={folder.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDrop={(e) => handleDrop(e, index)}
                                                className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition group cursor-default"
                                            >
                                                {/* Drag handle */}
                                                <td className="py-3.5 px-4 text-center cursor-grab active:cursor-grabbing text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                                                    <GripVertical className="w-4 h-4 mx-auto" />
                                                </td>

                                                {/* Folder Name (Clickable Drill-down into folder) */}
                                                <td
                                                    onClick={() => {
                                                        setActiveTab('all');
                                                        setFilterFolder(folder.key || folder.id);
                                                    }}
                                                    className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white flex items-center gap-2 cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition"
                                                >
                                                    <Folder className="w-4 h-4 text-brand-500 shrink-0" />
                                                    <span className="hover:underline">{folder.name}</span>
                                                    {folder.is_system && (
                                                        <span className="text-[10px] font-normal text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">System</span>
                                                    )}
                                                </td>

                                                {/* Object Target */}
                                                <td className="py-3.5 px-4 font-semibold capitalize text-neutral-700 dark:text-neutral-300">
                                                    {folder.object_target || 'Contact'}
                                                </td>

                                                {/* Field Count (Clickable Drill-down) */}
                                                <td
                                                    onClick={() => {
                                                        setActiveTab('all');
                                                        setFilterFolder(folder.key || folder.id);
                                                    }}
                                                    className="py-3.5 px-4 font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer hover:text-brand-600 dark:hover:text-brand-400"
                                                >
                                                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-neutral-700 dark:text-neutral-300 font-bold">
                                                        {folder.fields_count || 0}
                                                    </span>
                                                </td>

                                                {/* Created On Date */}
                                                <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 font-medium">
                                                    {formatDate(folder.created_at)}
                                                </td>

                                                {/* Action Menu */}
                                                <td className="py-3.5 px-4 text-right relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveMenuId(activeMenuId === folder.id ? null : folder.id)}
                                                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>

                                                    {activeMenuId === folder.id && (
                                                        <div className="absolute right-4 top-10 z-20 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100 text-left">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveTab('all');
                                                                    setFilterFolder(folder.key || folder.id);
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 flex items-center gap-2"
                                                            >
                                                                <Tag className="w-3.5 h-3.5" />
                                                                View Fields
                                                            </button>

                                                            {!folder.is_system && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setActiveMenuId(null);
                                                                            handleRenameFolder(folder);
                                                                        }}
                                                                        className="w-full px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 flex items-center gap-2"
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                        Rename Folder
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setActiveMenuId(null);
                                                                            handleDeleteFolder(folder);
                                                                        }}
                                                                        className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                        Delete Folder
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredFolders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                                                No custom field folders found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Pagination Bar */}
                        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                            <span>Showing 1 to {filteredFolders.length} of {filteredFolders.length} results</span>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span>Page Size</span>
                                    <select className="px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 dark:text-white">
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-1 text-neutral-400 hover:text-neutral-600 rounded border border-neutral-200 dark:border-neutral-700">
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="px-2.5 py-0.5 text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/40 rounded border border-brand-200 dark:border-brand-800">
                                        1
                                    </span>
                                    <button className="p-1 text-neutral-400 hover:text-neutral-600 rounded border border-neutral-200 dark:border-neutral-700">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 2: ALL FIELDS VIEW (Exact GoHighLevel Format) ──────────────── */}
                {activeTab === 'all' && (
                    <div className="space-y-3">
                        {/* Folder Drill-down Header / Breadcrumb Banner */}
                        {filterFolder !== 'all' && (
                            <div className="flex items-center justify-between p-3 bg-brand-50/70 dark:bg-brand-950/30 rounded-2xl border border-brand-200 dark:border-brand-800/80 shadow-2xs">
                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterFolder('all');
                                            setActiveTab('folders');
                                        }}
                                        className="px-3 py-1.5 text-xs font-bold text-brand-700 dark:text-brand-300 bg-white dark:bg-neutral-800 border border-brand-300 dark:border-brand-700/80 rounded-xl hover:bg-brand-50 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>Folders</span>
                                    </button>
                                    <span className="text-neutral-400 text-sm font-semibold">/</span>
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 dark:text-white">
                                        <Folder className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                                        <span>
                                            {folders.find(f => f.key === filterFolder || f.id === filterFolder)?.name || filterFolder}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-full font-bold border border-neutral-200 dark:border-neutral-700">
                                        {filteredFields.length} field{filteredFields.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setFilterFolder('all')}
                                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition cursor-pointer"
                                >
                                    Show All Workspace Fields
                                </button>
                            </div>
                        )}

                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        <th className="py-3 px-4 w-12 text-center">
                                            <input
                                                type="checkbox"
                                                disabled={selectableFields.length === 0}
                                                checked={selectableFields.length > 0 && selectedFieldIds.length === selectableFields.length}
                                                onChange={toggleSelectAll}
                                                className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500 disabled:opacity-30"
                                                title={selectableFields.length === 0 ? 'No custom user fields to select' : 'Select all custom fields'}
                                            />
                                        </th>
                                        <th className="py-3 px-4">Field Name</th>
                                        <th className="py-3 px-4">Object</th>
                                        <th className="py-3 px-4">Folder</th>
                                        <th className="py-3 px-4">Unique Key</th>
                                        <th className="py-3 px-4">Created On</th>
                                        <th className="py-3 px-4 w-16 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                                    {filteredFields.map((field) => {
                                        const folderMeta = folders.find(f => f.key === (field.field_group || 'general_info') || f.id === field.field_group);
                                        const folderLabel = folderMeta?.name || field.field_group?.replace(/_/g, ' ') || 'General Info';
                                        const isCopied = copiedKey === field.id;
                                        const SYSTEM_KEYS = [
                                            'first_name', 'last_name', 'name', 'email', 'phone_e164', 'whatsapp',
                                            'date_of_birth', 'contact_type', 'timezone', 'source',
                                            'company_name', 'address_1', 'address_2', 'city', 'state', 'postal_code',
                                            'country', 'website', 'job_title', 'notes', 'vat_id',
                                        ];
                                        const isSystemField = field.is_system || SYSTEM_KEYS.includes(field.key) || ['contact', 'general_info'].includes(field.field_group);

                                        return (
                                            <tr key={field.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition group">
                                                {/* Select & Drag handle */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <GripVertical className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-500 cursor-grab" />
                                                        <input
                                                            type="checkbox"
                                                            disabled={isSystemField}
                                                            checked={selectedFieldIds.includes(field.id)}
                                                            onChange={() => toggleSelectField(field.id)}
                                                            className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title={isSystemField ? 'System default fields cannot be deleted' : 'Select field'}
                                                        />
                                                    </div>
                                                </td>

                                                {/* Field Name */}
                                                <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{field.name}</span>
                                                        {field.is_required && (
                                                            <span className="text-[10px] font-semibold text-red-500">*</span>
                                                        )}
                                                        {isSystemField && (
                                                            <span className="px-1.5 py-0.5 text-[9px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                                                                System
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Object Target */}
                                                <td className="py-3.5 px-4 font-semibold capitalize text-neutral-800 dark:text-neutral-200">
                                                    {field.object_target || 'Contact'}
                                                </td>

                                                {/* Folder Badge Pill (Clickable) */}
                                                <td className="py-3.5 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFilterFolder(field.field_group || 'general_info')}
                                                        className="px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700/70 rounded-lg border border-neutral-200/80 dark:border-neutral-700/60 inline-flex items-center gap-1.5 transition cursor-pointer"
                                                    >
                                                        <Folder className="w-3 h-3 text-neutral-400" />
                                                        <span className="truncate max-w-[140px]">{folderLabel}</span>
                                                    </button>
                                                </td>

                                                {/* Unique Merge Key (GoHighLevel format with 1-Click Copy) */}
                                                <td className="py-3.5 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyMergeTag(field)}
                                                        className={`font-mono text-[11px] px-2.5 py-1 rounded-lg border inline-flex items-center gap-2 transition group/btn cursor-pointer ${
                                                            isCopied
                                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                                                : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700/80 hover:border-brand-400'
                                                        }`}
                                                        title="Click to copy template merge tag"
                                                    >
                                                        <span>&#123;&#123; {field.object_target || 'contact'}.{field.key} &#125;&#125;</span>
                                                        {isCopied ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5 text-neutral-400 group-hover/btn:text-neutral-600 dark:group-hover/btn:text-neutral-200" />
                                                        )}
                                                    </button>
                                                </td>

                                                {/* Created On */}
                                                <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 font-medium">
                                                    {formatDate(field.created_at)}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right">
                                                    {isSystemField ? (
                                                        <span
                                                            className="inline-flex items-center justify-center p-1.5 text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                                                            title="Default system field is protected and cannot be deleted"
                                                        >
                                                            <Lock className="w-3.5 h-3.5" />
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteFieldWithCheck(field)}
                                                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                                            title="Move to Deleted Fields"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredFields.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-xs text-neutral-400">
                                                No custom fields found. Click "+ Add Field" to create one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Pagination Bar */}
                        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                            <span>Showing 1 to {filteredFields.length} of {filteredFields.length} results</span>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span>Page Size</span>
                                    <select className="px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 dark:text-white">
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-1 text-neutral-400 hover:text-neutral-600 rounded border border-neutral-200 dark:border-neutral-700">
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="px-2.5 py-0.5 text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/40 rounded border border-brand-200 dark:border-brand-800">
                                        1
                                    </span>
                                    <button className="p-1 text-neutral-400 hover:text-neutral-600 rounded border border-neutral-200 dark:border-neutral-700">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

                {/* ─── TAB 3: DELETED FIELDS VIEW (Recycle Bin) ──────────────────────── */}
                {activeTab === 'deleted' && (
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        <th className="py-3 px-4">Field Name</th>
                                        <th className="py-3 px-4">API Key</th>
                                        <th className="py-3 px-4">Object</th>
                                        <th className="py-3 px-4">Folder</th>
                                        <th className="py-3 px-4">Deleted At</th>
                                        <th className="py-3 px-4 w-28 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                                    {filteredDeletedFields.map((field) => (
                                        <tr key={field.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition">
                                            <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white line-through opacity-70">
                                                {field.name}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400">
                                                {field.key}
                                            </td>
                                            <td className="py-3.5 px-4 capitalize font-semibold text-neutral-500">
                                                {field.object_target}
                                            </td>
                                            <td className="py-3.5 px-4 text-neutral-500 capitalize">
                                                {field.field_group?.replace(/_/g, ' ')}
                                            </td>
                                            <td className="py-3.5 px-4 text-neutral-500">
                                                {formatDate(field.deleted_at)}
                                            </td>
                                            <td className="py-3.5 px-4 text-right space-x-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRestoreField(field.id)}
                                                    className="px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/60 rounded-lg transition inline-flex items-center gap-1 border border-brand-200 dark:border-brand-800/60"
                                                    title="Restore Custom Field"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    Restore
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleForceDeleteField(field)}
                                                    className="p-1 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition inline-flex"
                                                    title="Permanently Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredDeletedFields.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                                                No deleted custom fields found in the recycle bin.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── TAB 4: CUSTOM VALUES VIEW (Workspace Global Constants) ───────── */}
                {activeTab === 'custom_values' && (
                    <div className="space-y-4">
                        {/* Info Callout Banner */}
                        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                                <Tag className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                                    Global Workspace Constants (Edit Once, Update Everywhere)
                                </h4>
                                <p className="mt-0.5 text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                    Unlike contact fields (which vary per lead), Custom Values are identical across your entire workspace. Reference them using their merge tags in emails, WhatsApp messages, and funnels. When you update the value here, every active message and page updates automatically.
                                </p>
                            </div>
                        </div>

                        {/* Custom Values Table */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-800/40 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                            <th className="py-3 px-4 w-1/4">Name</th>
                                            <th className="py-3 px-4 w-1/3">Merge Tag</th>
                                            <th className="py-3 px-4 w-1/3">Current Value</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs">
                                        {filteredCustomValues.map(val => (
                                            <tr key={val.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition">
                                                <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                        <span>{val.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCustomValueTag(val)}
                                                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-300 font-mono text-[11px] font-medium transition cursor-pointer"
                                                        title="Click to copy merge tag"
                                                    >
                                                        <span>{`{{ custom_values.${val.key} }}`}</span>
                                                        {copiedKey === `cv_${val.id}` ? (
                                                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 text-neutral-400 group-hover:text-emerald-600 transition" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300 font-medium max-w-xs truncate">
                                                    {val.value ? (
                                                        <span className="truncate block" title={val.value}>{val.value}</span>
                                                    ) : (
                                                        <span className="text-neutral-400 italic font-normal">Empty</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCustomValueToEdit(val);
                                                            setIsAddCustomValueModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition inline-flex cursor-pointer"
                                                        title="Edit Custom Value"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteCustomValueWithCheck(val)}
                                                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition inline-flex cursor-pointer"
                                                        title="Delete Custom Value"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredCustomValues.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-14 text-center">
                                                    <div className="max-w-xs mx-auto text-center space-y-2">
                                                        <Tag className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                                                        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                            No Custom Values Found
                                                        </p>
                                                        <p className="text-[11px] text-neutral-400">
                                                            Create reusable constants like support numbers, booking URLs, and review links.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCustomValueToEdit(null);
                                                                setIsAddCustomValueModalOpen(true);
                                                            }}
                                                            className="mt-2 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-xl transition inline-flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Create First Custom Value</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 5: TRIGGER LINKS VIEW (Tracked Redirect Links with Automation Triggers) ─ */}
                {activeTab === 'trigger_links' && (
                    <div className="space-y-4">
                        {/* Info Callout Banner */}
                        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/60 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                                <Link2 className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-100">
                                    Tracked Trigger Links (Log Clicks & Fire Automated Workflows)
                                </h4>
                                <p className="mt-0.5 text-indigo-800 dark:text-indigo-300 leading-relaxed">
                                    Trigger links are intelligent, tracked redirect URLs. Insert them into WhatsApp, SMS, or Email campaigns. When a contact clicks the link, the click is logged, click counts increment, and any workflow listening to <strong>Trigger Link Clicked</strong> executes automatically (e.g. tagging the contact, un-enrolling from reminder drips, or alerting sales reps).
                                </p>
                            </div>
                        </div>

                        {/* Trigger Links Table */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-800/40 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                            <th className="py-3 px-4 w-1/5">Link Name</th>
                                            <th className="py-3 px-4 w-1/4">Tracked Short URL</th>
                                            <th className="py-3 px-4 w-1/4">Target Destination</th>
                                            <th className="py-3 px-4 text-center">Clicks</th>
                                            <th className="py-3 px-4">Merge Tag</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs">
                                        {filteredTriggerLinks.map(tl => {
                                            const origin = typeof window !== 'undefined' ? window.location.origin : '';
                                            const shortUrl = `${origin}/l/${tl.slug}`;
                                            const isCopiedTag = copiedKey === `tl_${tl.id}`;
                                            const isCopiedUrl = copiedKey === `url_${tl.id}`;

                                            return (
                                                <tr key={tl.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition">
                                                    <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">
                                                        <div className="flex items-center gap-2">
                                                            <Link2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                            <span>{tl.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyShortUrl(tl)}
                                                                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-medium transition cursor-pointer"
                                                                title="Click to copy short URL"
                                                            >
                                                                <span className="truncate max-w-[180px]">{shortUrl}</span>
                                                                {isCopiedUrl ? (
                                                                    <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600 transition" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300 font-medium max-w-xs truncate">
                                                        <a
                                                            href={tl.target_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline truncate"
                                                            title={tl.target_url}
                                                        >
                                                            <span className="truncate">{tl.target_url}</span>
                                                            <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                                                        </a>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                                                            {tl.clicks_count ?? 0}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyTriggerLinkTag(tl)}
                                                            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-amber-700 dark:hover:text-amber-300 font-mono text-[11px] font-medium transition cursor-pointer"
                                                            title="Click to copy merge tag"
                                                        >
                                                            <span>{`{{ trigger_links.${tl.slug} }}`}</span>
                                                            {isCopiedTag ? (
                                                                <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                                            ) : (
                                                                <Copy className="w-3 h-3 text-neutral-400 group-hover:text-amber-600 transition" />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setTriggerLinkToEdit(tl);
                                                                setIsAddTriggerLinkModalOpen(true);
                                                            }}
                                                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition inline-flex cursor-pointer"
                                                            title="Edit Trigger Link"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTriggerLinkWithCheck(tl)}
                                                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition inline-flex cursor-pointer"
                                                            title="Delete Trigger Link"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {filteredTriggerLinks.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-14 text-center">
                                                    <div className="max-w-xs mx-auto text-center space-y-2">
                                                        <Link2 className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                                                        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                            No Trigger Links Found
                                                        </p>
                                                        <p className="text-[11px] text-neutral-400">
                                                            Create trackable links like review surveys, promo pages, or calendars to trigger workflow automations on click.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setTriggerLinkToEdit(null);
                                                                setIsAddTriggerLinkModalOpen(true);
                                                            }}
                                                            className="mt-2 px-3.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-xl transition inline-flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Create First Trigger Link</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Custom Field Modal */}
            <CreateCustomFieldModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateCustomField={handleCreateField}
                availableFolders={folders}
            />

            {/* Add Custom Folder Modal */}
            <AddFolderModal
                isOpen={isAddFolderModalOpen}
                onClose={() => setIsAddFolderModalOpen(false)}
                onCreateFolder={handleCreateFolder}
            />

            {/* Add / Edit Custom Value Modal */}
            <AddCustomValueModal
                isOpen={isAddCustomValueModalOpen}
                onClose={() => {
                    setIsAddCustomValueModalOpen(false);
                    setCustomValueToEdit(null);
                }}
                valueToEdit={customValueToEdit}
            />

            {/* Add / Edit Trigger Link Modal */}
            <AddTriggerLinkModal
                isOpen={isAddTriggerLinkModalOpen}
                onClose={() => {
                    setIsAddTriggerLinkModalOpen(false);
                    setTriggerLinkToEdit(null);
                }}
                linkToEdit={triggerLinkToEdit}
            />

            {/* Confirm Dialog Modal */}
            <ConfirmDialogModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                variant={confirmModal.variant}
            />

            {/* Rename Folder Modal */}
            <RenameFolderModal
                isOpen={renameFolderModal.isOpen}
                folder={renameFolderModal.folder}
                onClose={() => setRenameFolderModal({ isOpen: false, folder: null })}
                onRename={handleSaveRenameFolder}
            />
        </ClientLayout>
    );
}
