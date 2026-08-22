import { Head, Link, useForm } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { ArrowLeft, Plus, Trash2, ShieldCheck, FormInput, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function FormsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        title: '',
        description: '',
        type: 'embedded',
        fields: ['email', 'first_name'],
        settings: {
            theme_color: '#25D366',
            button_text: 'Subscribe Now',
            success_message: 'Thank you for subscribing!',
            redirect_url: '',
            auto_tags: ['Website Lead'],
            custom_fields: [],
        },
        double_optin_enabled: false,
        optin_channel: 'whatsapp',
        gdpr_checkbox: false,
        gdpr_text: 'I agree to receive updates and promotional offers.',
    });

    const [newTag, setNewTag] = useState('');
    const [newCustomField, setNewCustomField] = useState({
        key: '',
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        optionsText: '',
    });

    const handleStandardFieldToggle = (fieldName) => {
        const current = [...data.fields];
        if (current.includes(fieldName)) {
            setData('fields', current.filter((f) => f !== fieldName));
        } else {
            setData('fields', [...current, fieldName]);
        }
    };

    const handleAddCustomField = () => {
        if (!newCustomField.label.trim()) return;
        const key = newCustomField.key.trim() || newCustomField.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const options = newCustomField.optionsText
            ? newCustomField.optionsText.split(',').map((s) => s.trim()).filter(Boolean)
            : [];

        const cf = {
            key,
            label: newCustomField.label.trim(),
            type: newCustomField.type,
            required: newCustomField.required,
            placeholder: newCustomField.placeholder.trim(),
            options,
        };

        setData('settings', {
            ...data.settings,
            custom_fields: [...(data.settings.custom_fields || []), cf],
        });

        setNewCustomField({ key: '', label: '', type: 'text', required: false, placeholder: '', optionsText: '' });
    };

    const handleRemoveCustomField = (index) => {
        const updated = [...(data.settings.custom_fields || [])];
        updated.splice(index, 1);
        setData('settings', { ...data.settings, custom_fields: updated });
    };

    const handleAddTag = () => {
        if (!newTag.trim()) return;
        const tags = [...(data.settings.auto_tags || [])];
        if (!tags.includes(newTag.trim())) {
            tags.push(newTag.trim());
            setData('settings', { ...data.settings, auto_tags: tags });
        }
        setNewTag('');
    };

    const handleRemoveTag = (tag) => {
        const tags = (data.settings.auto_tags || []).filter((t) => t !== tag);
        setData('settings', { ...data.settings, auto_tags: tags });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('client.forms.store'));
    };

    return (
        <ClientLayout title="Create Subscription Form">
            <Head title="Create Subscription Form" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('client.forms.index')}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FormInput className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                            Create Standalone Subscription Form
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Build custom lead capture forms with custom fields & Double OTP Verification.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Form Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700">
                            1. Form Information & Display
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Internal Form Name *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Website Contact Form"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                                    required
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Public Title / Headline
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Subscribe to our Newsletter"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Description / Subtitle
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={2}
                                placeholder="e.g. Enter your email and phone to receive our latest updates..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Fields & Custom Field Builder */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700">
                            2. Form Fields & Custom Inputs
                        </h2>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Standard Fields
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { id: 'email', label: 'Email Address' },
                                    { id: 'first_name', label: 'First Name' },
                                    { id: 'last_name', label: 'Last Name' },
                                    { id: 'phone_e164', label: 'WhatsApp Phone Number' },
                                ].map((field) => (
                                    <label key={field.id} className="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.fields.includes(field.id)}
                                            onChange={() => handleStandardFieldToggle(field.id)}
                                            className="rounded text-brand-600"
                                        />
                                        {field.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Custom Fields List */}
                        <div className="pt-2">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Custom Fields List ({data.settings.custom_fields?.length || 0})
                            </label>
                            {data.settings.custom_fields?.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {data.settings.custom_fields.map((cf, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 text-xs"
                                        >
                                            <div>
                                                <span className="font-semibold text-gray-900 dark:text-white">{cf.label}</span>
                                                <span className="ml-2 text-gray-500">[{cf.type}]</span>
                                                {cf.required && <span className="ml-2 text-red-500 font-bold">*Required</span>}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCustomField(idx)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Custom Field Form */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 space-y-3">
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-brand-500" /> + Add New Custom Field
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Field Label (e.g. Company Name)"
                                        value={newCustomField.label}
                                        onChange={(e) => setNewCustomField({ ...newCustomField, label: e.target.value })}
                                        className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                                    />
                                    <select
                                        value={newCustomField.type}
                                        onChange={(e) => setNewCustomField({ ...newCustomField, type: e.target.value })}
                                        className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="text">Text (Single Line)</option>
                                        <option value="textarea">Textarea (Multi Line)</option>
                                        <option value="number">Number</option>
                                        <option value="tel">Phone</option>
                                        <option value="date">Date</option>
                                        <option value="select">Dropdown (Select)</option>
                                        <option value="radio">Radio Buttons</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Placeholder text"
                                        value={newCustomField.placeholder}
                                        onChange={(e) => setNewCustomField({ ...newCustomField, placeholder: e.target.value })}
                                        className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                {['select', 'radio'].includes(newCustomField.type) && (
                                    <input
                                        type="text"
                                        placeholder="Comma separated options (e.g. Sales, Support, General)"
                                        value={newCustomField.optionsText}
                                        onChange={(e) => setNewCustomField({ ...newCustomField, optionsText: e.target.value })}
                                        className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                                    />
                                )}

                                <div className="flex items-center justify-between pt-1">
                                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={newCustomField.required}
                                            onChange={(e) => setNewCustomField({ ...newCustomField, required: e.target.checked })}
                                            className="rounded text-brand-600"
                                        />
                                        Is Required Field?
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddCustomField}
                                        className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-lg transition"
                                    >
                                        Add Field
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Double OTP Verification Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            3. Double Opt-in & OTP Verification
                        </h2>

                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.double_optin_enabled}
                                    onChange={(e) => setData('double_optin_enabled', e.target.checked)}
                                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <div>
                                    <span className="font-semibold text-sm text-gray-900 dark:text-white block">
                                        Enable Double OTP Verification
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-gray-300">
                                        Sends a 6-digit OTP code before marking the contact as verified in CRM. Ensures 100% real leads.
                                    </span>
                                </div>
                            </label>

                            {data.double_optin_enabled && (
                                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex items-center gap-4">
                                    <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                        OTP Channel:
                                    </label>
                                    <select
                                        value={data.optin_channel}
                                        onChange={(e) => setData('optin_channel', e.target.value)}
                                        className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white font-medium"
                                    >
                                        <option value="whatsapp">WhatsApp OTP (Recommended)</option>
                                        <option value="email">Email OTP</option>
                                        <option value="sms">SMS OTP</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Auto Tags & Customization */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700">
                            4. Customization & Auto-Tags
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Button Text
                                </label>
                                <input
                                    type="text"
                                    value={data.settings.button_text}
                                    onChange={(e) => setData('settings', { ...data.settings, button_text: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Theme Color
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={data.settings.theme_color}
                                        onChange={(e) => setData('settings', { ...data.settings, theme_color: e.target.value })}
                                        className="w-10 h-10 border-0 rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={data.settings.theme_color}
                                        onChange={(e) => setData('settings', { ...data.settings, theme_color: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Success Message
                            </label>
                            <input
                                type="text"
                                value={data.settings.success_message}
                                onChange={(e) => setData('settings', { ...data.settings, success_message: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Redirect URL (Optional)
                            </label>
                            <input
                                type="url"
                                value={data.settings.redirect_url}
                                onChange={(e) => setData('settings', { ...data.settings, redirect_url: e.target.value })}
                                placeholder="https://yourwebsite.com/thank-you"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Auto-Assigned Tags
                            </label>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Enter tag and press Add"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Add Tag
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {data.settings.auto_tags?.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-xs font-medium rounded-lg border border-brand-200 dark:border-brand-800"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-red-500 ml-1"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Link
                            href={route('client.forms.index')}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-sm"
                        >
                            {processing ? 'Creating...' : 'Create Form'}
                        </button>
                    </div>
                </form>
            </div>
        </ClientLayout>
    );
}
