import React, { useState } from 'react';
import { FolderPlus, User, Target, Building2 } from 'lucide-react';
import { Modal, Button, Input } from '@/Components/ui';

export default function AddFolderModal({ isOpen, onClose, onCreateFolder }) {
    const [name, setName] = useState('');
    const [objectTarget, setObjectTarget] = useState('contact');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        onCreateFolder({
            id: name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            name: name.trim(),
            object_target: objectTarget,
            created_at: new Date().toISOString(),
        });

        setName('');
        setObjectTarget('contact');
        onClose();
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <Modal.Header
                title={
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 rounded-xl border border-brand-200/50 dark:border-brand-800/40">
                            <FolderPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                Add Custom Field Folder
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Create a section group to organize custom fields in CRM details.
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
                        placeholder="e.g. Form | Lead Capture Form or Survey 0"
                        hint="This folder will show as an expandable accordion section in the CRM."
                    />

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
                        leftIcon={<FolderPlus className="w-3.5 h-3.5" />}
                    >
                        Create Folder
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
