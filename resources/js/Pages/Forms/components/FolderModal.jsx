import { useState, useEffect } from 'react';
import { X, Folder, FolderPlus, Palette } from 'lucide-react';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';

const FOLDER_COLORS = [
    '#16a34a', // Emerald
    '#2563eb', // Blue
    '#7c3aed', // Purple
    '#db2777', // Pink
    '#ea580c', // Orange
    '#0284c7', // Sky
    '#ca8a04', // Amber
    '#4b5563', // Slate
];

export default function FolderModal({ isOpen, folder = null, onClose, onSave }) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#16a34a');
    const [error, setError] = useState('');

    useEffect(() => {
        if (folder) {
            setName(folder.name || '');
            setColor(folder.color || '#16a34a');
        } else {
            setName('');
            setColor('#16a34a');
        }
        setError('');
    }, [folder, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Folder name is required');
            return;
        }
        onSave({ name: name.trim(), color });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-soft-lg shadow-soft-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="p-2 rounded-soft text-white"
                            style={{ backgroundColor: color }}
                        >
                            {folder ? <Folder className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                {folder ? 'Rename Folder' : 'Create New Folder'}
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {folder ? 'Update folder name and color' : 'Organize your subscription and lead forms'}
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

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <Input
                        label="Folder Name"
                        required
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder="e.g. Lead Magnets, Client Onboarding"
                        error={error}
                        autoFocus
                    />

                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-neutral-400" />
                            Folder Color
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {FOLDER_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-full transition transform ${
                                        color === c ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 scale-110' : 'hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                        <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit">
                            {folder ? 'Save Changes' : 'Create Folder'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
