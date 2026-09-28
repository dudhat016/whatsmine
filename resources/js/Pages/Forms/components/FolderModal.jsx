import { useState, useEffect } from 'react';
import { Folder, FolderPlus, Palette } from 'lucide-react';
import { Modal, Button, Input } from '@/Components/ui';

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Folder name is required');
            return;
        }
        onSave({ name: name.trim(), color });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <Modal.Header
                title={
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
                }
                onClose={onClose}
            />

            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-4">
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
                                    className={`w-7 h-7 rounded-full transition transform cursor-pointer ${
                                        color === c ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 scale-110' : 'hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                        {folder ? 'Save Changes' : 'Create Folder'}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
