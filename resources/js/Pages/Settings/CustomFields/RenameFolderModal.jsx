import React, { useState, useEffect } from 'react';
import { Edit2, User, Target, Building2 } from 'lucide-react';
import { Modal, Button, Input } from '@/Components/ui';

export default function RenameFolderModal({ isOpen, folder, onClose, onRename }) {
    const [name, setName] = useState('');
    const [objectTarget, setObjectTarget] = useState('contact');

    useEffect(() => {
        if (folder) {
            setName(folder.name || '');
            setObjectTarget(folder.object_target || 'contact');
        }
    }, [folder]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        onRename(folder, name.trim(), objectTarget);
        onClose();
    };

    return (
        <Modal show={isOpen && !!folder} onClose={onClose} maxWidth="md">
            <Modal.Header
                title={
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 rounded-xl border border-brand-200/50 dark:border-brand-800/40">
                            <Edit2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                Rename Folder
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Update the folder display name and target object.
                            </p>
                        </div>
                    </div>
                }
                onClose={onClose}
            />

            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-4">
                    <Input
                        label="Folder Name *"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Folder Name"
                        autoFocus
                    />

                    {folder && !folder.is_system && (
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                                Target Object *
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'contact', label: 'Contact', icon: User },
                                    { value: 'opportunity', label: 'Opportunity', icon: Target },
                                    { value: 'company', label: 'Company', icon: Building2 },
                                ].map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setObjectTarget(value)}
                                        className={`py-2 px-3 text-xs font-medium rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                                            objectTarget === value
                                                ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 font-semibold ring-2 ring-brand-400'
                                                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        disabled={!name.trim()}
                    >
                        Save Changes
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
