import { useState } from 'react';
import { FolderOpen, Home, Check } from 'lucide-react';
import { Modal, Button } from '@/Components/ui';

export default function MoveToFolderModal({ isOpen, forms = [], folders = [], onClose, onMove }) {
    const [selectedFolderId, setSelectedFolderId] = useState(null);

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
        <Modal show={isOpen && forms.length > 0} onClose={onClose} maxWidth="md">
            <Modal.Header
                title={
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
                }
                onClose={onClose}
            />

            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-4">
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {/* Root Option */}
                        <button
                            type="button"
                            onClick={() => setSelectedFolderId(null)}
                            className={`w-full flex items-center justify-between p-3 rounded-soft border text-left transition cursor-pointer ${
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
                                    className={`w-full flex items-center justify-between p-3 rounded-soft border text-left transition cursor-pointer ${
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
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                        Move Here
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
