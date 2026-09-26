import React, { useState } from 'react';
import { X, Plus, Sparkles, Sliders, Check, User, Target, Folder } from 'lucide-react';

export default function CreateCustomFieldModal({ isOpen, onClose, onCreateCustomField, availableFolders = [] }) {
    const [fieldData, setFieldData] = useState({
        objectTarget: 'contact',
        fieldGroup: 'general_info',
        label: '',
        key: '',
        type: 'text',
        placeholder: '',
        required: false,
        optionsText: '',
    });

    if (!isOpen) return null;

    const defaultFolders = [
        { id: 'contact', name: 'Contact' },
        { id: 'general_info', name: 'General Info' },
        { id: 'additional_info', name: 'Additional Info' },
        { id: 'billing_info', name: 'Billing Info' },
    ];

    const folderOptions = availableFolders.length > 0 ? availableFolders : defaultFolders;

    const handleSave = (e) => {
        e.preventDefault();
        if (!fieldData.label.trim()) return;

        const key = fieldData.key.trim() || fieldData.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const options = ['select', 'radio', 'multi_checkbox'].includes(fieldData.type) && fieldData.optionsText
            ? fieldData.optionsText.split(',').map(s => s.trim()).filter(Boolean)
            : ['Option 1', 'Option 2'];

        const newField = {
            id: `custom_${Date.now()}`,
            objectTarget: fieldData.objectTarget,
            fieldGroup: fieldData.fieldGroup,
            type: fieldData.type,
            key,
            label: fieldData.label.trim(),
            name: fieldData.label.trim(),
            placeholder: fieldData.placeholder.trim(),
            required: fieldData.required,
            options,
            width: 'full',
            showLabel: true,
        };

        onCreateCustomField(newField);
        setFieldData({ objectTarget: 'contact', fieldGroup: 'general_info', label: '', key: '', type: 'text', placeholder: '', required: false, optionsText: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                New Custom Field
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Configure Object, Group, and field options (GoHighLevel format).
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    {/* Object & Group Dropdowns (GHL Feature) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Object Target *
                            </label>
                            <select
                                value={fieldData.objectTarget}
                                onChange={(e) => setFieldData({ ...fieldData, objectTarget: e.target.value })}
                                className="w-full px-3 py-2 text-xs font-semibold border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="contact">Contact</option>
                                <option value="opportunity">Opportunity</option>
                                <option value="company">Company</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Folder / Group *
                            </label>
                            <select
                                value={fieldData.fieldGroup}
                                onChange={(e) => setFieldData({ ...fieldData, fieldGroup: e.target.value })}
                                className="w-full px-3 py-2 text-xs font-semibold border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                {folderOptions.map(f => (
                                    <option key={f.id || f.name} value={f.id || f.name}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                            Field Label *
                        </label>
                        <input
                            type="text"
                            required
                            value={fieldData.label}
                            onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
                            placeholder="e.g. Company Name or Budget Range"
                            className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Input Type
                            </label>
                            <select
                                value={fieldData.type}
                                onChange={(e) => setFieldData({ ...fieldData, type: e.target.value })}
                                className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white"
                            >
                                <option value="text">Single Line Text</option>
                                <option value="textarea">Multi-Line Textarea</option>
                                <option value="number">Number</option>
                                <option value="tel">Phone</option>
                                <option value="date">Date Picker</option>
                                <option value="select">Dropdown (Select)</option>
                                <option value="radio">Radio Buttons</option>
                                <option value="checkbox">Checkbox (Single)</option>
                                <option value="multi_checkbox">Multi-Checkboxes</option>
                                <option value="file">File Upload</option>
                                <option value="rating">Rating Stars</option>
                                <option value="scale">Opinion Scale (1-10)</option>
                                <option value="signature">Signature Pad</option>
                                <option value="hidden">Hidden Field</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Custom Key (API)
                            </label>
                            <input
                                type="text"
                                value={fieldData.key}
                                onChange={(e) => setFieldData({ ...fieldData, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                placeholder={fieldData.label ? fieldData.label.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'key_name'}
                                className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {['select', 'radio'].includes(fieldData.type) && (
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Options (comma separated)
                            </label>
                            <input
                                type="text"
                                value={fieldData.optionsText}
                                onChange={(e) => setFieldData({ ...fieldData, optionsText: e.target.value })}
                                placeholder="Option 1, Option 2, Option 3"
                                className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                            Placeholder Text
                        </label>
                        <input
                            type="text"
                            value={fieldData.placeholder}
                            onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
                            placeholder="e.g. Enter your company name"
                            className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={fieldData.required}
                                onChange={(e) => setFieldData({ ...fieldData, required: e.target.checked })}
                                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                            />
                            Required Field
                        </label>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Save & Add Field
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
