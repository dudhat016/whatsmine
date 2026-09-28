import React, { useState, useRef } from 'react';
import ClientLayout from '@/Layouts/ClientLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Image as ImageIcon, 
    Upload, 
    Trash2, 
    Copy, 
    Check, 
    HardDrive, 
    Search, 
    Filter, 
    Layers, 
    Info, 
    Calendar, 
    CheckCircle2, 
    CheckSquare, 
    FileText, 
    Film, 
    Music, 
    Loader2, 
    AlertCircle,
    X,
    FolderOpen
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/context/ConfirmationContext';
import { Button, Input, Badge } from '@/Components/ui';

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function MediaIndex({ files, usedBytes, quotaBytes }) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const fileRef = useRef(null);

    // State
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'images' | 'documents' | 'audio_video'
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const [dragging, setDragging] = useState(false);

    // Bulk Select Mode (WordPress style)
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [inspectedFile, setInspectedFile] = useState(files.data?.[0] || null);
    const [copied, setCopied] = useState(false);

    const isImageMime = (mime) => mime?.startsWith('image/') || false;
    const isVideoMime = (mime) => mime?.startsWith('video/') || false;
    const isAudioMime = (mime) => mime?.startsWith('audio/') || false;

    const renderFileTypeIcon = (mime, className = "h-5 w-5") => {
        if (isImageMime(mime)) return <ImageIcon className={`${className} text-emerald-500`} />;
        if (isVideoMime(mime)) return <Film className={`${className} text-blue-500`} />;
        if (isAudioMime(mime)) return <Music className={`${className} text-purple-500`} />;
        return <FileText className={`${className} text-amber-500`} />;
    };

    const quotaPct = quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0;

    // Filter files locally for live search or trigger server reload
    const handleSearchChange = (val) => {
        setSearch(val);
        router.get(route('client.media.index'), { search: val || undefined, type: filterType !== 'all' ? filterType : undefined }, { preserveState: true, replace: true });
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
        router.get(route('client.media.index'), { search: search || undefined, type: type !== 'all' ? type : undefined }, { preserveState: true, replace: true });
    };

    // File Click (WordPress behavior)
    const handleFileClick = (file) => {
        setInspectedFile(file);

        if (isBulkMode) {
            setSelectedFiles((prev) => {
                const exists = prev.some((f) => f.id === file.id);
                if (exists) {
                    return prev.filter((f) => f.id !== file.id);
                } else {
                    return [...prev, file];
                }
            });
        }
    };

    const isSelected = (file) => selectedFiles.some((f) => f.id === file.id);

    // Toggle bulk select mode
    const toggleBulkMode = () => {
        if (isBulkMode) {
            setIsBulkMode(false);
            setSelectedFiles([]);
        } else {
            setIsBulkMode(true);
        }
    };

    // Select all / Deselect all
    const handleSelectAll = () => {
        const fileList = files.data || [];
        if (selectedFiles.length === fileList.length && fileList.length > 0) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles([...fileList]);
        }
    };

    // Upload files
    const handleUploadFiles = async (fileList) => {
        if (!fileList || fileList.length === 0) return;

        const filesArray = Array.from(fileList);
        setUploadError('');
        setUploading(true);
        setUploadProgress(10);

        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i];
            try {
                const formData = new FormData();
                formData.append('file', file);
                await axios.post(route('client.media.store'), formData, {
                    onUploadProgress: (progressEvent) => {
                        const currentFilePercent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                        const overall = Math.round(((i * 100) + currentFilePercent) / filesArray.length);
                        setUploadProgress(overall);
                    }
                });
            } catch (err) {
                const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? `Upload failed for "${file.name}".`;
                setUploadError(msg);
            }
        }

        setUploading(false);
        setUploadProgress(0);
        if (fileRef.current) fileRef.current.value = '';
        router.reload();
    };

    // Single Delete
    const handleDelete = async (fileItem) => {
        const usagesCount = fileItem.usages?.length || 0;
        const warningMessage = usagesCount > 0
            ? `Warning: This file is currently used in ${usagesCount} place(s) (${fileItem.usages.map(u => u.title).join(', ')}). Deleting it will break those references.`
            : `Are you sure you want to permanently delete "${fileItem.filename}"? This will free up storage space.`;

        const ok = await confirm({
            title: 'Delete Media File',
            message: warningMessage,
            confirmLabel: 'Delete Permanently',
            variant: 'danger',
        });

        if (!ok) return;

        try {
            await axios.delete(route('client.media.destroy', fileItem.id));
            if (inspectedFile?.id === fileItem.id) {
                setInspectedFile(null);
            }
            setSelectedFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
            router.reload();
        } catch {
            // silently ignore
        }
    };

    // Bulk Delete (WordPress style)
    const handleBulkDelete = async () => {
        if (selectedFiles.length === 0) return;

        const totalCount = selectedFiles.length;
        const usedFiles = selectedFiles.filter((f) => f.usages && f.usages.length > 0);

        let warningMessage = `You are about to permanently delete ${totalCount} item(s) from your site. This action cannot be undone.`;
        if (usedFiles.length > 0) {
            warningMessage = `Warning: ${usedFiles.length} of the ${totalCount} selected files are currently used in active products or posts. Deleting them will break those references. Are you sure you want to proceed?`;
        }

        const ok = await confirm({
            title: `Delete ${totalCount} Media Items`,
            message: warningMessage,
            confirmLabel: `Delete ${totalCount} Items Permanently`,
            variant: 'danger',
        });

        if (!ok) return;

        try {
            const ids = selectedFiles.map((f) => f.id);
            await axios.post(route('client.media.bulk-destroy'), { ids });
            setSelectedFiles([]);
            setInspectedFile(null);
            router.reload();
        } catch (err) {
            console.error('Failed to bulk delete media', err);
        }
    };

    const copyUrl = (url) => {
        if (!url) return;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const fileList = files.data || [];

    return (
        <ClientLayout title={t('media.title')}>
            <Head title={t('media.title')} />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header & Storage Capacity */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <FolderOpen className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            Media Library
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Manage, organize, and reuse all uploaded assets across your workspace.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Storage Usage Bar */}
                        {quotaBytes > 0 && (
                            <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm min-w-[220px]">
                                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 font-semibold mb-1.5">
                                    <span className="flex items-center gap-1.5">
                                        <HardDrive className="h-3.5 w-3.5 text-neutral-400" /> Storage Used
                                    </span>
                                    <span>{formatBytes(usedBytes)} / {formatBytes(quotaBytes)}</span>
                                </div>
                                <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            quotaPct > 90 ? 'bg-red-500' : quotaPct > 70 ? 'bg-amber-500' : 'bg-brand-500'
                                        }`}
                                        style={{ width: `${quotaPct}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Upload Button */}
                        <div>
                            <input
                                ref={fileRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => handleUploadFiles(e.target.files)}
                            />
                            <Button
                                variant="primary"
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="gap-2 font-bold shadow-sm"
                            >
                                <Upload className="h-4 w-4" />
                                {uploading ? `Uploading (${uploadProgress}%)...` : 'Add New File'}
                            </Button>
                        </div>
                    </div>
                </div>

                {uploadError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{uploadError}</span>
                    </div>
                )}

                {/* Main Card Container with Two-Pane Layout */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                    
                    {/* LEFT PANEL: Toolbar & Media Grid */}
                    <div className="flex-1 p-6 space-y-4">
                        {/* Search & Filter Bar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex-1 w-full">
                                <Input
                                    type="text"
                                    leftIcon={Search}
                                    value={search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search library assets by filename..."
                                />
                            </div>

                            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'images', label: 'Images' },
                                    { id: 'documents', label: 'Docs' },
                                    { id: 'audio_video', label: 'Media' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleFilterChange(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                                            filterType === tab.id
                                                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}

                                {/* WordPress Style Bulk Select Button */}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={isBulkMode ? 'primary' : 'outline'}
                                    onClick={toggleBulkMode}
                                    className="text-xs font-semibold whitespace-nowrap ml-1 gap-1.5"
                                >
                                    <CheckSquare className="h-3.5 w-3.5" />
                                    {isBulkMode ? 'Cancel Selection' : 'Bulk Select'}
                                </Button>
                            </div>
                        </div>

                        {/* WordPress Style Bulk Action Banner */}
                        {isBulkMode && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 shadow-sm animate-fadeIn">
                                <div className="flex items-center gap-3 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                    <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono font-bold">
                                        {selectedFiles.length} item{selectedFiles.length !== 1 ? 's' : ''} selected
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-neutral-600 dark:text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 underline text-xs"
                                    >
                                        {selectedFiles.length === fileList.length && fileList.length > 0 ? 'Deselect all' : `Select all (${fileList.length})`}
                                    </button>
                                </div>

                                <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    disabled={selectedFiles.length === 0}
                                    onClick={handleBulkDelete}
                                    className="gap-1.5 text-xs font-bold"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Permanently ({selectedFiles.length})
                                </Button>
                            </div>
                        )}

                        {/* Media Grid */}
                        {fileList.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50/50 dark:bg-neutral-800/20">
                                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No media assets found</h3>
                                <p className="text-xs text-neutral-500 mt-1">Upload images, videos, or documents to manage your media library.</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => fileRef.current?.click()}
                                    className="mt-4 gap-1.5"
                                >
                                    <Upload className="h-3.5 w-3.5" /> Upload File
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                                {fileList.map((file) => {
                                    const selected = isSelected(file);
                                    const isInspected = inspectedFile?.id === file.id;
                                    const isImg = isImageMime(file.mime_type);
                                    const usagesCount = file.usages?.length || 0;

                                    return (
                                        <div
                                            key={file.id}
                                            onClick={() => handleFileClick(file)}
                                            className={`group relative rounded-xl border overflow-hidden cursor-pointer flex flex-col justify-between transition duration-150 ${
                                                selected
                                                    ? 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-50/20 dark:bg-brand-950/30'
                                                    : isInspected
                                                    ? 'border-neutral-400 dark:border-neutral-600 ring-1 ring-neutral-400/20 bg-neutral-50/60 dark:bg-neutral-800/80'
                                                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700'
                                            }`}
                                        >
                                            {/* Thumbnail Container */}
                                            <div className="aspect-square w-full bg-neutral-100 dark:bg-neutral-800/80 relative overflow-hidden flex items-center justify-center">
                                                {isImg ? (
                                                    <img
                                                        src={file.url}
                                                        alt={file.filename}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-2 text-center">
                                                        {renderFileTypeIcon(file.mime_type, "h-8 w-8")}
                                                        <span className="text-[10px] font-mono text-neutral-500 uppercase mt-1">
                                                            {file.filename.split('.').pop()}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Selection Indicator Badge */}
                                                {(selected || isBulkMode) && (
                                                    <div className={`absolute top-2 right-2 h-5 w-5 rounded-md flex items-center justify-center transition shadow-sm ${
                                                        selected 
                                                            ? 'bg-brand-600 text-white' 
                                                            : 'bg-white/80 dark:bg-neutral-800/80 text-transparent border border-neutral-300 dark:border-neutral-600'
                                                    }`}>
                                                        {selected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}
                                                    </div>
                                                )}

                                                {/* Usages Count Badge */}
                                                {usagesCount > 0 && (
                                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-neutral-900/80 text-white text-[9px] font-semibold flex items-center gap-1 backdrop-blur-sm shadow">
                                                        <Layers className="h-2.5 w-2.5 text-brand-400" /> {usagesCount} used
                                                    </div>
                                                )}
                                            </div>

                                            {/* File meta label */}
                                            <div className="p-2.5 border-t border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900">
                                                <p className="text-[11px] font-medium text-neutral-900 dark:text-neutral-100 truncate" title={file.filename}>
                                                    {file.filename}
                                                </p>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <span className="text-[10px] text-neutral-400 font-mono">
                                                        {formatBytes(file.size_bytes)}
                                                    </span>
                                                    {file.mime_type && (
                                                        <span className="text-[9px] uppercase font-mono text-neutral-400">
                                                            {file.mime_type.split('/')[1] || ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {files.links && files.links.length > 3 && (
                            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
                                <span>Showing {files.from || 0} to {files.to || 0} of {files.total || 0} files</span>
                                <div className="flex gap-1">
                                    {files.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            disabled={!link.url || link.active}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                link.active
                                                    ? 'bg-brand-600 text-white'
                                                    : link.url
                                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                                    : 'opacity-40 cursor-not-allowed text-neutral-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL: INSPECTOR & USAGE TRACKER */}
                    <div className="w-full md:w-80 bg-neutral-50/70 dark:bg-neutral-900/80 p-6 space-y-5">
                        {inspectedFile ? (
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                                    <Info className="h-3.5 w-3.5" /> File Details & Usages
                                </h4>

                                {/* Big Preview Box */}
                                <div className="aspect-video w-full rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden flex items-center justify-center shadow-inner relative">
                                    {isImageMime(inspectedFile.mime_type) ? (
                                        <img
                                            src={inspectedFile.url}
                                            alt={inspectedFile.filename}
                                            className="w-full h-full object-contain p-1"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-4 text-center">
                                            {renderFileTypeIcon(inspectedFile.mime_type, "h-10 w-10")}
                                            <span className="text-xs font-mono text-neutral-500 uppercase mt-2">
                                                {inspectedFile.filename.split('.').pop()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Meta Info List */}
                                <div className="space-y-2 text-xs">
                                    <div>
                                        <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Filename</span>
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100 break-words">
                                            {inspectedFile.filename}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                                        <div>
                                            <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Size</span>
                                            <span className="font-mono text-neutral-800 dark:text-neutral-200 font-semibold">
                                                {formatBytes(inspectedFile.size_bytes)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-400 block text-[10px] uppercase font-semibold">MIME Type</span>
                                            <span className="font-mono text-neutral-800 dark:text-neutral-200 truncate block">
                                                {inspectedFile.mime_type || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>

                                    {inspectedFile.created_at && (
                                        <div className="pt-1 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 text-neutral-500">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>Uploaded: {new Date(inspectedFile.created_at).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* WHERE THIS IS USED (Usage Tracker) */}
                                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                            <Layers className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                                            Where This Is Used
                                        </span>
                                        <Badge size="sm" variant={inspectedFile.usages?.length > 0 ? 'brand' : 'neutral'}>
                                            {inspectedFile.usages?.length || 0} Places
                                        </Badge>
                                    </div>

                                    {inspectedFile.usages && inspectedFile.usages.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {inspectedFile.usages.map((usage, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <span className="font-bold text-neutral-900 dark:text-neutral-100 block truncate">
                                                            {usage.title}
                                                        </span>
                                                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">
                                                            {usage.type} • {usage.context}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                            <span>Not currently attached to any active product or post (Safe to remove).</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions: Copy Link & Delete */}
                                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyUrl(inspectedFile.url)}
                                        className="w-full gap-1.5 text-xs justify-center"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied Direct URL
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" /> Copy Direct Asset URL
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(inspectedFile)}
                                        className="w-full gap-1.5 text-xs justify-center"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Delete Permanently
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-24 text-center text-neutral-400 space-y-1">
                                <Info className="h-8 w-8 mx-auto mb-1 text-neutral-300 dark:text-neutral-600" />
                                <p className="text-xs font-medium">Click on any file to inspect details and see where it is used.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
