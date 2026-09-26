import { useState } from 'react';
import { X, Folder, FolderOpen, Home, Check } from 'lucide-react';
import Button from '@/Components/ui/Button';

export default function MoveToFolderModal({ isOpen, forms = [], folders = [], onClose, onMove }) {
    const [selectedFolderId, setSelectedFolderId] = useState(null);

    if (!isOpen || !forms.length) return null;

    const formCount = forms.length;
    const formNames = forms.map((f) => f.name).join(', ');

    const handleSubmit = (e) => {
        e.preventDefault();
        onMove({
            form_ids: forms.map((f) => f.id),
            folder_id: selectedFolderId,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-soft-lg shadow-soft-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-soft">
                            <FolderOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                Move to Folder
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[260px]">
                                {formCount === 1 ? formNames : `${formCount} forms selected`}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-soft transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Folder Selection List */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {/* Root Option */}
                        <button
                            type="button"
                            onClick={() => setSelectedFolderId(null)}
                            className={`w-full flex items-center justify-between p-3 rounded-soft border text-left transition ${
                                selectedFolderId === null
                                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-medium'
                                    : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Home className="w-4 h-4 text-neutral-400" />
                                <div>
                                    <span className="text-sm font-semibold">Home (Root / Unassigned)</span>
                                    <p className="text-[11px] text-neutral-400">Do not place inside any folder</p>
                                </div>
                            </div>
                            {selectedFolderId === null && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                        </button>

                        {/* Folders List */}
                        {folders.map((folder) => {
                            const isSelected = selectedFolderId === folder.id;
                            return (
                                <button
                                    key={folder.id}
                                    type="button"
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-soft border text-left transition ${
                                        isSelected
                                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-medium'
                                            : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-3.5 h-3.5 rounded-full shrink-0"
                                            style={{ backgroundColor: folder.color || '#16a34a' }}
                                        />
                                        <div>
                                            <span className="text-sm font-semibold">{folder.name}</span>
                                            <p className="text-[11px] text-neutral-400">
                                                {folder.forms_count ?? 0} {folder.forms_count === 1 ? 'form' : 'forms'}
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                        <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit">
                            Move Here
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
