import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
    Modal, 
    Button, 
    Input 
} from '@/Components/ui';
import { 
    Upload, 
    Image as ImageIcon, 
    FileText, 
    Film, 
    Music, 
    Search, 
    Check, 
    Link as LinkIcon, 
    Loader2, 
    FolderOpen,
    ExternalLink,
    AlertCircle,
    CheckSquare
} from 'lucide-react';

export default function MediaPickerModal({
    isOpen,
    onClose,
    onSelect,
    currentValue = '',
    multiple = false,
    accept = 'image/*',
    maxSizeMb = 50,
    collection = 'default',
    title = 'Select Media Assets'
}) {
    const [activeTab, setActiveTab] = useState('library'); // 'library' | 'upload' | 'url'
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState(null);

    // Media library state
    const [files, setFiles] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

    // Search and filter state
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'images' | 'documents' | 'audio_video'

    // Selection state
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [customUrl, setCustomUrl] = useState('');

    // Drag-and-drop
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef(null);

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const fetchLibrary = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                search: search.trim() || undefined,
                type: filterType !== 'all' ? filterType : undefined,
            };
            const resp = await axios.get(route('client.media.index'), {
                params,
                headers: { 'Accept': 'application/json' }
            });

            if (resp.data?.files) {
                const loadedFiles = resp.data.files.data || [];
                setFiles(loadedFiles);
                setPagination({
                    currentPage: resp.data.files.current_page || 1,
                    lastPage: resp.data.files.last_page || 1,
                    total: resp.data.files.total || 0,
                });
            }
        } catch (err) {
            console.error('Failed to load media library', err);
        } finally {
            setLoading(false);
        }
    }, [search, filterType]);

    // Initial fetch on open or filter change
    useEffect(() => {
        if (isOpen) {
            fetchLibrary(1);
            if (currentValue) {
                if (typeof currentValue === 'string') {
                    setCustomUrl(currentValue);
                }
            }
        }
    }, [isOpen, fetchLibrary, currentValue]);

    // File selection toggle
    const handleFileClick = (file) => {
        if (multiple) {
            setSelectedFiles((prev) => {
                const exists = prev.some((f) => f.id === file.id);
                if (exists) {
                    return prev.filter((f) => f.id !== file.id);
                } else {
                    return [...prev, file];
                }
            });
        } else {
            setSelectedFiles([file]);
        }
    };

    const isSelected = (file) => {
        return selectedFiles.some((f) => f.id === file.id || f.url === file.url);
    };

    // Bulk / Single Upload handler
    const handleUploadFiles = async (fileList) => {
        if (!fileList || fileList.length === 0) return;

        const filesArray = Array.from(fileList);
        setUploadError(null);
        setUploading(true);
        setUploadProgress(10);

        const uploadedResults = [];

        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i];

            if (file.size > maxSizeMb * 1024 * 1024) {
                setUploadError(`File "${file.name}" exceeds limit of ${maxSizeMb} MB.`);
                continue;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('collection', collection);

                const resp = await axios.post(route('client.media.store'), formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const currentFilePercent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                        const overall = Math.round(((i * 100) + currentFilePercent) / filesArray.length);
                        setUploadProgress(overall);
                    }
                });

                if (resp.data?.url) {
                    uploadedResults.push({
                        id: resp.data.id,
                        filename: resp.data.filename,
                        url: resp.data.url,
                        size_bytes: resp.data.size_bytes,
                    });
                }
            } catch (err) {
                const msg = err?.response?.data?.error || err?.response?.data?.message || `Failed to upload "${file.name}".`;
                setUploadError(msg);
            }
        }

        setUploading(false);
        setUploadProgress(0);

        if (uploadedResults.length > 0) {
            if (multiple) {
                setSelectedFiles((prev) => [...prev, ...uploadedResults]);
            } else {
                setSelectedFiles([uploadedResults[0]]);
            }
            setActiveTab('library');
            fetchLibrary(1);
        }
    };

    // Confirm selection
    const handleConfirmSelection = () => {
        if (activeTab === 'url' && customUrl.trim()) {
            if (multiple) {
                onSelect?.([customUrl.trim()]);
            } else {
                onSelect?.(customUrl.trim());
            }
            onClose();
        } else if (selectedFiles.length > 0) {
            if (multiple) {
                const urls = selectedFiles.map((f) => f.url);
                onSelect?.(urls, selectedFiles);
            } else {
                onSelect?.(selectedFiles[0].url, selectedFiles[0]);
            }
            onClose();
        }
    };

    const isImageMime = (mime) => mime?.startsWith('image/') || false;
    const isVideoMime = (mime) => mime?.startsWith('video/') || false;
    const isAudioMime = (mime) => mime?.startsWith('audio/') || false;

    const renderFileTypeIcon = (mime, className = "h-5 w-5") => {
        if (isImageMime(mime)) return <ImageIcon className={`${className} text-emerald-500`} />;
        if (isVideoMime(mime)) return <Film className={`${className} text-blue-500`} />;
        if (isAudioMime(mime)) return <Music className={`${className} text-purple-500`} />;
        return <FileText className={`${className} text-amber-500`} />;
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="4xl">
            <Modal.Header 
                title={title} 
                subtitle={multiple ? 'Select one or more files to insert' : 'Choose or upload an asset'}
                onClose={onClose} 
            />

            {/* Top Bar: Tabs & Link to Full Media Library */}
            <div className="px-6 pt-3 pb-0 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 bg-white dark:bg-neutral-900">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('library')}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                            activeTab === 'library'
                                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                    >
                        <FolderOpen className="h-4 w-4" /> Media Library
                        {pagination.total > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
                                {pagination.total}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                            activeTab === 'upload'
                                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                    >
                        <Upload className="h-4 w-4" /> Upload {multiple ? 'Files' : 'New'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('url')}
                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                            activeTab === 'url'
                                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                        }`}
                    >
                        <LinkIcon className="h-4 w-4" /> Embed URL
                    </button>
                </div>

                {/* External link to Full Media Manager */}
                <a
                    href={route('client.media.index')}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition"
                    title="Open full Media Library to manage, inspect usages, or bulk delete files"
                >
                    <span>Manage Library</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            </div>

            <Modal.Body className="p-6 max-h-[68vh] overflow-y-auto bg-white dark:bg-neutral-900">
                {/* TAB 1: MEDIA LIBRARY (CLEAN FULL-WIDTH GRID) */}
                {activeTab === 'library' && (
                    <div className="space-y-4">
                        {/* Search & Filter Toolbar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex-1 w-full">
                                <Input
                                    type="text"
                                    leftIcon={Search}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
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
                                        onClick={() => setFilterType(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                                            filterType === tab.id
                                                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Media Grid */}
                        {loading ? (
                            <div className="py-24 flex flex-col items-center justify-center text-neutral-400 space-y-2">
                                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                                <span className="text-xs">Loading media assets...</span>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="py-16 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 bg-neutral-50/50 dark:bg-neutral-800/20">
                                <ImageIcon className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No media assets found</p>
                                <p className="text-xs text-neutral-500 mt-1">Upload your first image or document to start reusing assets.</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setActiveTab('upload')}
                                    className="mt-4 gap-1.5"
                                >
                                    <Upload className="h-3.5 w-3.5" /> Upload File
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                                {files.map((file) => {
                                    const selected = isSelected(file);
                                    const isImg = isImageMime(file.mime_type);

                                    return (
                                        <div
                                            key={file.id}
                                            onClick={() => handleFileClick(file)}
                                            className={`group relative rounded-xl border overflow-hidden cursor-pointer flex flex-col justify-between transition duration-150 ${
                                                selected
                                                    ? 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-50/20 dark:bg-brand-950/30'
                                                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700'
                                            }`}
                                        >
                                            {/* Thumbnail preview */}
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

                                                {/* Selection Checkmark Badge */}
                                                {selected && (
                                                    <div className="absolute top-2 right-2 h-5 w-5 rounded-md bg-brand-600 text-white flex items-center justify-center shadow">
                                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
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

                        {/* Pagination Bar */}
                        {pagination.lastPage > 1 && (
                            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
                                <span>Page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} files)</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={pagination.currentPage <= 1 || loading}
                                        onClick={() => fetchLibrary(pagination.currentPage - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={pagination.currentPage >= pagination.lastPage || loading}
                                        onClick={() => fetchLibrary(pagination.currentPage + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: UPLOAD NEW */}
                {activeTab === 'upload' && (
                    <div className="space-y-4">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragging(false);
                                if (e.dataTransfer.files?.length) {
                                    handleUploadFiles(e.dataTransfer.files);
                                }
                            }}
                            className={`p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition cursor-pointer ${
                                dragging
                                    ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                                    : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 hover:border-brand-400'
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple={multiple}
                                accept={accept}
                                onChange={(e) => {
                                    if (e.target.files?.length) {
                                        handleUploadFiles(e.target.files);
                                    }
                                }}
                                className="hidden"
                            />

                            {uploading ? (
                                <div className="space-y-3 flex flex-col items-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
                                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                        Uploading files ({uploadProgress}%)...
                                    </p>
                                    <div className="w-56 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 flex flex-col items-center">
                                    <div className="h-14 w-14 rounded-2xl bg-brand-100 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                                        <Upload className="h-7 w-7" />
                                    </div>
                                    <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                                        Drag & drop {multiple ? 'files' : 'your file'} here, or browse
                                    </h4>
                                    <p className="text-xs text-neutral-500 max-w-sm">
                                        Supports JPG, PNG, WebP, GIF, PDF, MP4, MP3, DOCX up to {maxSizeMb} MB.
                                    </p>
                                </div>
                            )}
                        </div>

                        {uploadError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{uploadError}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: EMBED URL */}
                {activeTab === 'url' && (
                    <div className="space-y-4">
                        <Input
                            type="url"
                            label="Direct Image or File URL"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/... or https://cdn.site.com/asset.jpg"
                            leftIcon={LinkIcon}
                            hint="Paste any public CDN, Unsplash, or direct image link."
                        />

                        {customUrl && (
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-2">
                                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                                    Live Preview
                                </span>
                                <div className="max-h-56 rounded-lg overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center p-2">
                                    <img
                                        src={customUrl}
                                        alt="Preview"
                                        className="max-h-56 object-contain rounded"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                    {multiple ? (
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                        </span>
                    ) : selectedFiles[0] && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 truncate">
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[280px]">
                                {selectedFiles[0].filename}
                            </span>
                            <span className="text-neutral-400 font-mono">({formatBytes(selectedFiles[0].size_bytes)})</span>
                        </div>
                    )}
                </div>

                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirmSelection}
                    disabled={
                        (activeTab === 'library' && selectedFiles.length === 0) ||
                        (activeTab === 'url' && !customUrl.trim()) ||
                        (activeTab === 'upload' && selectedFiles.length === 0)
                    }
                    className="gap-1.5 font-bold"
                >
                    <Check className="h-4 w-4" /> 
                    {multiple 
                        ? `Insert ${selectedFiles.length || ''} Selected Files` 
                        : 'Use Selected Asset'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
