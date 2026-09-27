import { Head, useForm, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { Input, Select } from '@/Components/ui';
import {
    ArrowLeft, MessageSquare, Phone, Mail, Globe, Camera, Trash2, Upload,
    ChevronDown, ChevronRight, Folder, FileText, CheckCircle2,
    Calendar, Building, MapPin, Tag, Sparkles, Sliders, CheckSquare, Clock
} from 'lucide-react';
import { useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/context/ConfirmationContext';

function OptInBadge({ label, active }) {
    return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
            {active ? '✓' : '✗'} {label}
        </span>
    );
}

function AvatarUploader({ contact }) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const fileInput = useRef();
    const [preview, setPreview] = useState(contact.avatar_url ?? null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const name = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim();
    const initials = name
        ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    const uploadFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setPreview(URL.createObjectURL(file));
        setUploading(true);

        const formData = new FormData();
        formData.append('avatar', file);
        router.post(route('client.contacts.avatar.upload', contact.uuid), formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setUploading(false),
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) uploadFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) uploadFile(file);
    };

    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Remove Avatar',
            message: t('contacts_page.avatar_confirm_remove') || 'Are you sure you want to remove this avatar?',
            confirmText: 'Remove',
            variant: 'danger',
        });
        if (!ok) return;
        setPreview(null);
        router.delete(route('client.contacts.avatar.delete', contact.uuid), { preserveScroll: true });
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Avatar circle */}
            <div
                className={`relative group cursor-pointer rounded-full transition ${dragOver ? 'ring-4 ring-brand-400' : ''}`}
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt={name || t('contacts_page.contact_alt')}
                        className="h-24 w-24 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700"
                    />
                ) : (
                    <div className="h-24 w-24 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-2xl font-bold border-2 border-neutral-200 dark:border-neutral-700">
                        {initials}
                    </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Camera className="h-6 w-6 text-white" />
                </div>
                {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                    <Upload className="h-3.5 w-3.5" /> {t('contacts_page.avatar_upload')}
                </button>
                {preview && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"
                    >
                        <Trash2 className="h-3.5 w-3.5" /> {t('common.remove')}
                    </button>
                )}
            </div>
            <p className="text-xs text-neutral-400">{t('contacts_page.avatar_hint')}</p>
            {contact.avatar_url && contact.avatar_url.startsWith('http') && !contact.avatar_url.includes('/storage/') && (
                <p className="text-xs text-blue-500 dark:text-blue-400">{t('contacts_page.avatar_synced')}</p>
            )}
        </div>
    );
}

export default function ContactShow({
    contact,
    staticSegments = [],
    availableFolders = [],
    customFields = [],
    contactSubmissions = [],
}) {
    const { t } = useTranslation();
    const rawFirstName = contact.first_name ?? '';
    const validFirstName = (rawFirstName && !rawFirstName.includes('@')) ? rawFirstName : '';
    const fullName = [validFirstName, contact.last_name].filter(Boolean).join(' ').trim();
    const headerTitle = fullName || contact.email || contact.phone_e164 || t('contacts_page.unknown_contact');

    // Manage expanded accordion folders (like GoHighLevel)
    const [openFolders, setOpenFolders] = useState({
        general_info: true,
        additional_info: true,
    });

    const toggleFolder = (key) => {
        setOpenFolders(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const contactCustomMap = contact.custom_fields || {};

    const { data, setData, put, processing } = useForm({
        first_name: validFirstName,
        last_name: contact.last_name ?? '',
        email: contact.email ?? '',
        phone_e164: contact.phone_e164 ?? '',
        country: contact.country ?? '',
        language: contact.language ?? '',
        opt_in_whatsapp: contact.opt_in_whatsapp,
        opt_in_sms: contact.opt_in_sms,
        opt_in_email: contact.opt_in_email,
        custom_fields: { ...contactCustomMap },
        segment_ids: (contact.segments ?? []).filter(s => s.type === 'static').map(s => s.id),
    });

    const handleCustomFieldChange = (key, val) => {
        setData('custom_fields', {
            ...data.custom_fields,
            [key]: val,
        });
    };

    const handleSave = (e) => {
        e?.preventDefault();
        put(route('client.contacts.update', contact.uuid), { preserveScroll: true });
    };

    // ── Group Custom Fields by Folder (GoHighLevel format) ───────────────────
    const folderGroups = useMemo(() => {
        const groups = {};

        // 1. Initialize from available folders
        availableFolders.forEach(folder => {
            if (folder.key === 'contact') return; // Handled in primary profile
            groups[folder.key] = {
                key: folder.key,
                name: folder.name,
                isSystem: !!folder.is_system,
                fields: [],
            };
        });

        // Ensure default fallbacks exist
        if (!groups['general_info']) groups['general_info'] = { key: 'general_info', name: 'General Info', isSystem: true, fields: [] };
        if (!groups['additional_info']) groups['additional_info'] = { key: 'additional_info', name: 'Additional Info', isSystem: true, fields: [] };

        // 2. Put defined workspace custom fields into their folders
        const processedKeys = new Set();
        customFields.forEach(cf => {
            if (['email', 'first_name', 'last_name', 'phone_e164'].includes(cf.key)) return;
            const fKey = cf.field_group || 'general_info';
            if (!groups[fKey]) {
                groups[fKey] = {
                    key: fKey,
                    name: fKey.replace(/_/g, ' ').toUpperCase(),
                    isSystem: false,
                    fields: [],
                };
            }
            groups[fKey].fields.push(cf);
            processedKeys.add(cf.key);
        });

        // 3. Any extra custom field submitted by forms not yet in schema
        Object.keys(contactCustomMap).forEach(k => {
            if (!processedKeys.has(k)) {
                // Check if starts with form_
                const matchingFolder = Object.keys(groups).find(gKey => k.startsWith(gKey));
                const targetKey = matchingFolder || 'additional_info';
                if (groups[targetKey]) {
                    groups[targetKey].fields.push({
                        key: k,
                        name: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        type: typeof contactCustomMap[k] === 'boolean' ? 'checkbox' : 'text',
                    });
                    processedKeys.add(k);
                }
            }
        });

        return Object.values(groups);
    }, [availableFolders, customFields, contactCustomMap]);

    return (
        <ClientLayout title={t('contacts_page.contact_alt')}>
            <Head title={`${headerTitle} · ${t('contacts_page.contact_alt')}`} />

            <div className="max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <a href={route('client.contacts.index')} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                {headerTitle}
                            </h2>
                            <p className="text-xs text-neutral-500">
                                Contact Profile & Submitted Form Data
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={processing}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? t('common.saving') : t('contacts_page.save_changes')}
                    </button>
                </div>

                {/* Profile Card & Avatar */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-2xs">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <AvatarUploader contact={{ ...contact, first_name: validFirstName }} />

                        <div className="flex-1 space-y-3 w-full">
                            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                                {t('contacts_page.contact_details')}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {contact.phone_e164 && (
                                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60">
                                        <Phone className="h-4 w-4 text-brand-500" />
                                        <span>{contact.phone_e164}</span>
                                    </div>
                                )}
                                {contact.email && (
                                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60">
                                        <Mail className="h-4 w-4 text-brand-500" />
                                        <span className="truncate">{contact.email}</span>
                                    </div>
                                )}
                                {contact.country && (
                                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60">
                                        <Globe className="h-4 w-4 text-brand-500" />
                                        <span>{contact.country}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <OptInBadge label="WhatsApp" active={contact.opt_in_whatsapp} />
                                <OptInBadge label={t('contacts_page.channel_sms')} active={contact.opt_in_sms} />
                                <OptInBadge label={t('common.email')} active={contact.opt_in_email} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── GoHighLevel-Style Folder Accordions ──────────────────────── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                            <Folder className="w-4 h-4 text-brand-600" />
                            <span>Contact Folders & Custom Field Attributes</span>
                        </h3>
                    </div>

                    {folderGroups.map((group) => {
                        const isOpen = openFolders[group.key] ?? true;
                        const hasFields = group.fields.length > 0;

                        return (
                            <div
                                key={group.key}
                                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs transition"
                            >
                                {/* Accordion Header */}
                                <button
                                    type="button"
                                    onClick={() => toggleFolder(group.key)}
                                    className="w-full px-5 py-3.5 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-900/50 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40 transition cursor-pointer text-left"
                                >
                                    <div className="flex items-center gap-2.5">
                                        {isOpen ? (
                                            <ChevronDown className="w-4 h-4 text-brand-600" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                                        )}
                                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                            {group.name}
                                        </span>
                                        {group.isSystem && (
                                            <span className="px-1.5 py-0.2 text-[9px] font-bold text-neutral-500 bg-neutral-200/60 dark:bg-neutral-800 rounded">
                                                System
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-semibold text-neutral-400">
                                        {group.fields.length} field{group.fields.length !== 1 ? 's' : ''}
                                    </span>
                                </button>

                                {/* Accordion Body */}
                                {isOpen && (
                                    <div className="p-5 border-t border-neutral-100 dark:border-neutral-800">
                                        {hasFields ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {group.fields.map((field) => {
                                                    const val = data.custom_fields[field.key] ?? contactCustomMap[field.key] ?? '';
                                                    const isLong = field.type === 'textarea' || (typeof val === 'string' && val.length > 60);

                                                    return (
                                                        <div
                                                            key={field.key}
                                                            className={`space-y-1.5 ${isLong ? 'sm:col-span-2' : ''}`}
                                                        >
                                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                                                {field.name || field.label || field.key.replace(/_/g, ' ')}
                                                            </label>

                                                            {field.type === 'textarea' ? (
                                                                <textarea
                                                                    rows={3}
                                                                    value={val}
                                                                    onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                                                                    placeholder="Enter notes or answers..."
                                                                    className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-brand-500"
                                                                />
                                                            ) : field.type === 'select' && field.options?.length > 0 ? (
                                                                <Select
                                                                    value={val}
                                                                    onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                                                                    size="sm"
                                                                >
                                                                    <option value="">— Select —</option>
                                                                    {field.options.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </Select>
                                                            ) : (
                                                                <Input
                                                                    type="text"
                                                                    value={Array.isArray(val) ? val.join(', ') : val}
                                                                    onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                                                                    placeholder="No value recorded"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-neutral-400 italic py-2">
                                                No fields added to this folder yet.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Form Submissions Log (GoHighLevel Activity Feature) */}
                {contactSubmissions.length > 0 && (
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-brand-500" />
                                <span>Recent Form Submissions ({contactSubmissions.length})</span>
                            </h3>
                        </div>

                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                            {contactSubmissions.map((sub) => (
                                <div key={sub.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-neutral-900 dark:text-white">
                                            {sub.form?.name || 'Subscription Form'}
                                        </p>
                                        <p className="text-[11px] text-neutral-400 mt-0.5">
                                            Submitted on {new Date(sub.created_at).toLocaleString()}
                                            {sub.ip_address && ` • IP: ${sub.ip_address}`}
                                        </p>
                                    </div>
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        Verified
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Primary Edit Form (Basic CRM Fields) */}
                <form onSubmit={handleSave} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-2xs">
                    <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                        {t('common.edit')} Primary CRM Profile
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            ['first_name', t('contacts_page.first_name')],
                            ['last_name', t('contacts_page.last_name')],
                            ['email', t('common.email')],
                            ['phone_e164', 'Phone Number (E.164 / WhatsApp)'],
                            ['country', t('contacts_page.country_label')],
                            ['language', t('contacts_page.language_label')]
                        ].map(([k, l]) => (
                            <Input
                                key={k}
                                label={l}
                                type="text"
                                value={data[k] ?? ''}
                                onChange={e => setData(k, e.target.value)}
                            />
                        ))}
                    </div>

                    <div className="flex gap-4 flex-wrap pt-2">
                        {[['opt_in_whatsapp', t('contacts_page.channel_wa')], ['opt_in_sms', t('contacts_page.channel_sms')], ['opt_in_email', t('common.email')]].map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data[key]}
                                    onChange={e => setData(key, e.target.checked)}
                                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                                />
                                {label}
                            </label>
                        ))}
                    </div>

                    {staticSegments.length > 0 && (
                        <div className="pt-2">
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 block">{t('contacts_page.segments')}</label>
                            <div className="flex flex-wrap gap-2">
                                {staticSegments.map(seg => {
                                    const checked = data.segment_ids.includes(seg.id);
                                    return (
                                        <label key={seg.id} className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer transition ${checked ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-brand-400'}`}>
                                            <input type="checkbox" className="sr-only" checked={checked} onChange={() => {
                                                const ids = checked ? data.segment_ids.filter(id => id !== seg.id) : [...data.segment_ids, seg.id];
                                                setData('segment_ids', ids);
                                            }} />
                                            {seg.name}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={processing} className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60 transition shadow-xs cursor-pointer">
                        {processing ? t('common.saving') : t('contacts_page.save_changes')}
                    </button>
                </form>

                {/* Conversation timeline */}
                {contact.conversations?.length > 0 && (
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-2xs space-y-4">
                        <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-brand-500" />
                            <span>{t('contacts_page.recent_conversations')}</span>
                        </h3>
                        <div className="space-y-3">
                            {contact.conversations.map(conv => (
                                <div key={conv.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 p-4">
                                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                                        <span className="capitalize font-bold text-neutral-700 dark:text-neutral-200">{conv.channel_account?.channel ?? t('contacts_page.unknown_channel')}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${conv.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'}`}>{conv.status}</span>
                                    </div>
                                    {conv.messages?.map(msg => (
                                        <div key={msg.id} className={`text-xs p-2.5 rounded-xl mb-1.5 max-w-xs font-medium ${msg.direction === 'in' ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60' : 'ml-auto bg-brand-600 text-white shadow-2xs'}`}>
                                            {msg.body || t('contacts_page.media_placeholder')}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ClientLayout>
    );
}
