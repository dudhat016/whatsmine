import React, { useState, useEffect } from 'react';
import { X, Folder, Edit2, User, Target, Building2 } from 'lucide-react';

export default function RenameFolderModal({ isOpen, folder, onClose, onRename }) {
    const [name, setName] = useState('');
    const [objectTarget, setObjectTarget] = useState('contact');

    useEffect(() => {
        if (folder) {
            setName(folder.name || '');
            setObjectTarget(folder.object_target || 'contact');
        }
    }, [folder]);

    if (!isOpen || !folder) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        onRename(folder, name.trim(), objectTarget);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/50">
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
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Folder Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Folder Name"
                            className="w-full px-3.5 py-2.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-neutral-400"
                            autoFocus
                        />
                    </div>

                    {!folder.is_system && (
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

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-xs"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
