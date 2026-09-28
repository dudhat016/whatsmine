import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Modal, Button, Input, Select, Checkbox } from '@/Components/ui';

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
        <Modal
            show={!!isOpen}
            onClose={onClose}
            title="New Custom Field"
            description="Configure Object, Group, and field options (GoHighLevel format)."
            maxWidth="md"
        >
            <form onSubmit={handleSave} className="space-y-4">
                {/* Object & Group Dropdowns (GHL Feature) */}
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="Object Target *"
                        value={fieldData.objectTarget}
                        onChange={(e) => setFieldData({ ...fieldData, objectTarget: e.target.value })}
                    >
                        <option value="contact">Contact</option>
                        <option value="opportunity">Opportunity</option>
                        <option value="company">Company</option>
                    </Select>

                    <Select
                        label="Folder / Group *"
                        value={fieldData.fieldGroup}
                        onChange={(e) => setFieldData({ ...fieldData, fieldGroup: e.target.value })}
                    >
                        {folderOptions.map(f => (
                            <option key={f.id || f.name} value={f.id || f.name}>
                                {f.name}
                            </option>
                        ))}
                    </Select>
                </div>

                <Input
                    label="Field Label *"
                    type="text"
                    required
                    value={fieldData.label}
                    onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
                    placeholder="e.g. Company Name or Budget Range"
                />

                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="Input Type"
                        value={fieldData.type}
                        onChange={(e) => setFieldData({ ...fieldData, type: e.target.value })}
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
                    </Select>

                    <Input
                        label="Custom Key (API)"
                        type="text"
                        value={fieldData.key}
                        onChange={(e) => setFieldData({ ...fieldData, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                        placeholder={fieldData.label ? fieldData.label.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'key_name'}
                        className="font-mono"
                    />
                </div>

                {['select', 'radio'].includes(fieldData.type) && (
                    <Input
                        label="Options (comma separated)"
                        type="text"
                        value={fieldData.optionsText}
                        onChange={(e) => setFieldData({ ...fieldData, optionsText: e.target.value })}
                        placeholder="Option 1, Option 2, Option 3"
                    />
                )}

                <Input
                    label="Placeholder Text"
                    type="text"
                    value={fieldData.placeholder}
                    onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
                    placeholder="e.g. Enter your company name"
                />

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <Checkbox
                        label="Required Field"
                        checked={fieldData.required}
                        onChange={(e) => setFieldData({ ...fieldData, required: e.target.checked })}
                    />

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            icon={Plus}
                        >
                            Save & Add Field
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
