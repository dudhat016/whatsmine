import React, { useState, useEffect } from 'react';
import { Tag, Sparkles } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Modal, Button, Input } from '@/Components/ui';

export default function AddCustomValueModal({ isOpen, onClose, valueToEdit = null }) {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [value, setValue] = useState('');
    const [isAutoKey, setIsAutoKey] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (valueToEdit) {
            setName(valueToEdit.name || '');
            setKey(valueToEdit.key || '');
            setValue(valueToEdit.value || '');
            setIsAutoKey(false);
        } else {
            setName('');
            setKey('');
            setValue('');
            setIsAutoKey(true);
        }
    }, [valueToEdit, isOpen]);

    const handleNameChange = (e) => {
        const val = e.target.value;
        setName(val);
        if (isAutoKey) {
            setKey(val.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''));
        }
    };

    const handleKeyChange = (e) => {
        setIsAutoKey(false);
        setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setProcessing(true);

        const payload = {
            name: name.trim(),
            key: key.trim() || name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            value: value.trim(),
        };

        const targetRoute = valueToEdit
            ? route('client.custom_values.update', valueToEdit.id)
            : route('client.custom_values.store');
        const method = valueToEdit ? router.put : router.post;

        method(targetRoute, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                onClose();
            },
            onError: () => setProcessing(false),
        });
    };

    const displayToken = `{{ custom_values.${key || 'your_key'} }}`;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="lg">
            <Modal.Header
                title={
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
                            <Tag className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                {valueToEdit ? 'Edit Custom Value' : 'Add Custom Value'}
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Global workspace constant usable across all automations, emails & funnels.
                            </p>
                        </div>
                    </div>
                }
                onClose={onClose}
            />

            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-4">
                    <Input
                        label="Name *"
                        type="text"
                        required
                        value={name}
                        onChange={handleNameChange}
                        placeholder="e.g. Google Review Link, Support WhatsApp, Office Address"
                    />

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Variable Key *
                            </label>
                            <span className="text-[10px] text-neutral-400 font-mono">
                                snake_case
                            </span>
                        </div>
                        <Input
                            type="text"
                            required
                            value={key}
                            onChange={handleKeyChange}
                            placeholder="e.g. google_review_link"
                            className="font-mono"
                        />
                        
                        {/* Token Preview Banner */}
                        <div className="mt-2 p-2.5 bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[11px] font-medium">Merge Tag:</span>
                            </div>
                            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                                {displayToken}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Value
                        </label>
                        <textarea
                            rows={3}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="e.g. https://g.page/r/your-review-link or +1 (800) 555-0199"
                            className="w-full px-3.5 py-2.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-neutral-400 resize-none"
                        />
                        <p className="text-[11px] text-neutral-400 mt-1">
                            When referenced in messages, emails, or funnels, this exact value will replace the tag.
                        </p>
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
                        loading={processing}
                        disabled={!name.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {valueToEdit ? 'Save Changes' : 'Create Custom Value'}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
