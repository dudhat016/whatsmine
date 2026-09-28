import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
    Upload, 
    Link as LinkIcon, 
    X, 
    Image as ImageIcon, 
    FileText, 
    Check, 
    Loader2, 
    AlertCircle, 
    FolderOpen,
    Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Input from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import MediaPickerModal from '@/Components/Media/MediaPickerModal';

/**
 * MediaUpload — unified media input component with integrated MediaPickerModal.
 *
 * Props:
 *   value        (string)   — current URL value
 *   onChange     (fn)       — called with the new URL string
 *   accept       (string)   — file accept attribute (default: "image/*")
 *   maxSizeMb    (number)   — client-side size guard in MB (default: 50)
 *   label        (string)   — optional label above the input
 *   placeholder  (string)   — URL input placeholder
 *   collection   (string)   — media collection name sent to the server
 *   disabled     (bool)
 *   className    (string)
 */
export default function MediaUpload({
    value = '',
    onChange,
    multiple = false,
    accept = 'image/*',
    maxSizeMb = 50,
    label,
    placeholder = 'https://',
    collection = 'default',
    disabled = false,
    className = '',
}) {
    const { t } = useTranslation();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [mode, setMode] = useState('upload'); // 'upload' | 'url'
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef(null);

    const isImage = value && /\.(jpe?g|png|gif|webp|svg|avif)(\?.*)?$/i.test(value);

    const uploadFile = useCallback(async (file) => {
        if (!file) return;

        if (file.size > maxSizeMb * 1024 * 1024) {
            setError(t('ui.file_exceeds_limit', { max: maxSizeMb }) || `File exceeds maximum limit of ${maxSizeMb} MB.`);
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const form = new FormData();
            form.append('file', file);
            form.append('collection', collection);

            const resp = await axios.post(route('client.media.store'), form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            onChange?.(resp.data.url);
        } catch (err) {
            const msg =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                t('ui.upload_failed_retry') ||
                'Upload failed. Please try again.';
            setError(msg);
        } finally {
            setUploading(false);
        }
    }, [collection, maxSizeMb, onChange, t]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    const clear = () => {
        onChange?.('');
        setError(null);
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center justify-between">
                {label && (
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {label}
                    </label>
                )}

                {/* Mode Switcher */}
                <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden w-fit ml-auto">
                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors ${
                            mode === 'upload'
                                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                        }`}
                    >
                        <Upload className="h-3 w-3" />
                        Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('url')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors ${
                            mode === 'url'
                                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                        }`}
                    >
                        <LinkIcon className="h-3 w-3" />
                        URL
                    </button>
                </div>
            </div>

            {/* URL Direct Input mode */}
            {mode === 'url' && (
                <div className="relative">
                    <Input
                        size="sm"
                        type="url"
                        value={value}
                        onChange={(e) => { setError(null); onChange?.(e.target.value); }}
                        placeholder={placeholder}
                        disabled={disabled}
                    />
                    {value && (
                        <button
                            type="button"
                            onClick={clear}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 z-10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Upload & Library Mode */}
            {mode === 'upload' && (
                <div className="space-y-2">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={`relative flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed transition-all px-4 py-5 ${
                            dragging
                                ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/20'
                                : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-neutral-400 dark:hover:border-neutral-600'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
                                <Loader2 className="h-6 w-6 text-brand-600 animate-spin" />
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Uploading file...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center space-y-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setIsPickerOpen(true)}
                                        disabled={disabled}
                                        className="gap-1.5 shadow-sm text-xs font-bold"
                                    >
                                        <FolderOpen className="h-3.5 w-3.5 text-brand-600" />
                                        Media Library
                                    </Button>

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => fileRef.current?.click()}
                                        disabled={disabled}
                                        className="gap-1.5 text-xs font-semibold"
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                        Browse Device
                                    </Button>
                                </div>

                                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    or drag & drop files here (Max {maxSizeMb} MB)
                                </span>
                            </div>
                        )}

                        <input
                            ref={fileRef}
                            type="file"
                            accept={accept}
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={disabled || uploading}
                        />
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Active Asset Preview Card */}
            {value && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    {isImage ? (
                        <img
                            src={value}
                            alt="Preview"
                            className="h-11 w-11 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shrink-0 bg-neutral-100 dark:bg-neutral-900"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400';
                            }}
                        />
                    ) : (
                        <div className="h-11 w-11 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-600">
                            <FileText className="h-5 w-5 text-neutral-500 dark:text-neutral-300" />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate block">
                            {value.split('/').pop()?.split('?')[0] || 'Selected Asset'}
                        </span>
                        <span className="text-[10px] text-neutral-400 truncate block font-mono">
                            {value}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsPickerOpen(true)}
                            className="text-xs px-2 py-1 h-auto"
                        >
                            Change
                        </Button>
                        <button
                            type="button"
                            onClick={clear}
                            title="Remove file"
                            className="p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                multiple={multiple}
                onSelect={(selected, files) => {
                    onChange?.(selected, files);
                    setIsPickerOpen(false);
                }}
                currentValue={value}
                accept={accept}
                maxSizeMb={maxSizeMb}
                collection={collection}
                title={label ? `Select ${label}` : 'Select Media Asset'}
            />
        </div>
    );
}
