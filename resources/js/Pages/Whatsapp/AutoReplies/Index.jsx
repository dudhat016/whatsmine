import { Head, useForm, router, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import EmptyState from '@/Components/EmptyState';
import { Input, Select, Modal, Button, Checkbox } from '@/Components/ui';
import { Plus, Trash2, ToggleLeft, ToggleRight, Zap, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/context/ConfirmationContext';

const TRIGGER_TYPES  = ['keyword', 'welcome', 'away', 'out_of_hours'];
const MATCH_MODES    = ['exact', 'contains', 'regex'];
const RESPONSE_KINDS = ['text', 'template', 'media'];
const MEDIA_TYPES    = ['image', 'video', 'document'];

const TRIGGER_LABEL_KEYS = {
    keyword:       'whatsapp.auto_replies_trigger_keyword',
    welcome:       'whatsapp.auto_replies_trigger_welcome',
    away:          'whatsapp.auto_replies_trigger_away',
    out_of_hours:  'whatsapp.auto_replies_trigger_out_of_hours',
};

const MATCH_MODE_LABEL_KEYS = {
    exact:    'whatsapp.auto_replies_match_exact',
    contains: 'whatsapp.auto_replies_match_contains',
    regex:    'whatsapp.auto_replies_match_regex',
};

const RESPONSE_KIND_LABEL_KEYS = {
    text:     'whatsapp.auto_replies_response_text',
    template: 'whatsapp.auto_replies_response_template',
    media:    'whatsapp.auto_replies_response_media',
};

const MEDIA_TYPE_LABEL_KEYS = {
    image:    'whatsapp.auto_replies_media_image',
    video:    'whatsapp.auto_replies_media_video',
    document: 'whatsapp.auto_replies_media_document',
};

const emptyForm = {
    trigger_type:  'keyword',
    match_mode:    'contains',
    keywords:      [],
    response_kind: 'text',
    payload_json:  { text: '' },
    enabled:       true,
    priority:      0,
};

function RuleForm({ data, setData, errors, onSubmit, onCancel, processing, submitLabel }) {
    const { t } = useTranslation();
    return (
        <form onSubmit={onSubmit} className="space-y-3">
            {/* Trigger type */}
            <Select
                label={t('whatsapp.auto_replies_trigger_type')}
                value={data.trigger_type}
                onChange={e => setData('trigger_type', e.target.value)}
            >
                {TRIGGER_TYPES.map(tt => <option key={tt} value={tt}>{t(TRIGGER_LABEL_KEYS[tt] ?? '')}</option>)}
            </Select>

            {/* Keywords (only for keyword trigger) */}
            {data.trigger_type === 'keyword' && (
                <div>
                    <Input
                        label={<>{t('whatsapp.auto_replies_keywords')} <span className="text-neutral-400 font-normal">{t('whatsapp.auto_replies_keywords_hint')}</span></>}
                        type="text"
                        value={(data.keywords ?? []).join(', ')}
                        onChange={e => setData('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                        placeholder={t('whatsapp.auto_replies_keywords_placeholder')}
                        error={errors.keywords}
                    />

                    <Select
                        label={t('whatsapp.auto_replies_match_mode')}
                        value={data.match_mode}
                        onChange={e => setData('match_mode', e.target.value)}
                        className="mt-2"
                    >
                        {MATCH_MODES.map(m => <option key={m} value={m}>{t(MATCH_MODE_LABEL_KEYS[m] ?? '')}</option>)}
                    </Select>
                </div>
            )}

            {/* Response kind */}
            <Select
                label={t('whatsapp.auto_replies_response_type')}
                value={data.response_kind}
                onChange={e => setData('response_kind', e.target.value)}
            >
                {RESPONSE_KINDS.map(k => <option key={k} value={k}>{t(RESPONSE_KIND_LABEL_KEYS[k] ?? '')}</option>)}
            </Select>

            {/* Response content */}
            {data.response_kind === 'text' && (
                <div>
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('whatsapp.auto_replies_reply_text')}</label>
                    <textarea
                        value={data.payload_json?.text ?? ''}
                        onChange={e => setData('payload_json', { ...data.payload_json, text: e.target.value })}
                        rows={3}
                        placeholder={t('whatsapp.auto_replies_reply_text_placeholder')}
                        className="mt-1 w-full rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm resize-none"
                    />
                    {errors.payload_json && <p className="text-xs text-red-500 mt-1">{errors.payload_json}</p>}
                </div>
            )}

            {data.response_kind === 'template' && (
                <div className="space-y-2">
                    <div>
                        <Input
                            label={t('whatsapp.auto_replies_template_name')}
                            type="text"
                            value={data.payload_json?.template_name ?? ''}
                            onChange={e => setData('payload_json', { ...data.payload_json, template_name: e.target.value })}
                            placeholder={t('whatsapp.auto_replies_template_name_placeholder')}
                        />
                    </div>
                    <div>
                        <Input
                            label={t('whatsapp.auto_replies_language_code')}
                            type="text"
                            value={data.payload_json?.language ?? 'en'}
                            onChange={e => setData('payload_json', { ...data.payload_json, language: e.target.value })}
                            placeholder="en"
                        />
                    </div>
                </div>
            )}

            {data.response_kind === 'media' && (
                <div className="space-y-2">
                        <Select
                            label={t('whatsapp.auto_replies_media_type')}
                            value={data.payload_json?.media_type ?? 'image'}
                            onChange={e => setData('payload_json', { ...data.payload_json, media_type: e.target.value })}
                        >
                            {MEDIA_TYPES.map(mt => <option key={mt} value={mt}>{t(MEDIA_TYPE_LABEL_KEYS[mt] ?? '')}</option>)}
                        </Select>
                    <div>
                        <Input
                            label={t('whatsapp.auto_replies_media_id')}
                            type="text"
                            value={data.payload_json?.media_id ?? ''}
                            onChange={e => setData('payload_json', { ...data.payload_json, media_id: e.target.value })}
                            placeholder={t('whatsapp.auto_replies_media_id_placeholder')}
                        />
                    </div>
                    <div>
                        <Input
                            label={t('whatsapp.auto_replies_caption')}
                            type="text"
                            value={data.payload_json?.caption ?? ''}
                            onChange={e => setData('payload_json', { ...data.payload_json, caption: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {/* Priority */}
            <div>
                <Input
                    label={<>{t('whatsapp.auto_replies_priority')} <span className="font-normal">{t('whatsapp.auto_replies_priority_hint')}</span></>}
                    type="number"
                    min={0}
                    value={data.priority}
                    onChange={e => setData('priority', parseInt(e.target.value, 10) || 0)}
                />
            </div>

            {/* Enabled */}
            <Checkbox
                checked={data.enabled}
                onChange={e => setData('enabled', e.target.checked)}
                label={t('common.enabled')}
            />

            <div className="flex gap-2 pt-2">
                <Button
                    type="submit"
                    disabled={processing}
                    className="flex-1"
                >
                    {processing ? t('whatsapp.auto_replies_saving') : (submitLabel ?? t('whatsapp.auto_replies_save_rule'))}
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                >
                    {t('common.cancel')}
                </Button>
            </div>
        </form>
    );
}

export default function WhatsappAutoRepliesIndex({ rules }) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const { props } = usePage();
    const flash = props.flash ?? {};
    const [showCreate, setShowCreate] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    /* ── Create form ── */
    const createForm = useForm(emptyForm);

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route('client.whatsapp.auto-replies.store'), {
            onSuccess: () => { createForm.reset(); setShowCreate(false); },
        });
    };

    /* ── Edit form ── */
    const editForm = useForm(emptyForm);

    const openEdit = (rule) => {
        editForm.setData({
            trigger_type:  rule.trigger_type,
            match_mode:    rule.match_mode,
            keywords:      rule.keywords ?? [],
            response_kind: rule.response_kind,
            payload_json:  rule.payload_json ?? { text: '' },
            enabled:       rule.enabled,
            priority:      rule.priority ?? 0,
        });
        setEditingRule(rule);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        editForm.put(route('client.whatsapp.auto-replies.update', editingRule.id), {
            onSuccess: () => setEditingRule(null),
        });
    };

    /* ── Toggle / delete ── */
    const handleToggle = (rule) => {
        router.put(
            route('client.whatsapp.auto-replies.update', rule.id),
            { enabled: !rule.enabled },
            { preserveScroll: true },
        );
    };

    const handleDelete = async (id) => {
        const ok = await confirm({
            title: 'Delete Auto-Reply Rule',
            message: t('whatsapp.auto_replies_delete_confirm') || 'Are you sure you want to delete this auto-reply rule?',
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (ok) {
            router.delete(route('client.whatsapp.auto-replies.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <ClientLayout title={t('whatsapp.auto_replies_title')}>
            <Head title={t('whatsapp.auto_replies_head_title')} />
            <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('whatsapp.auto_replies_title')}</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {t('whatsapp.auto_replies_subtitle')}
                        </p>
                    </div>
                    {(
                        <Button
                            onClick={() => setShowCreate(true)}
                        >
                            <Plus className="h-4 w-4 mr-1.5" /> {t('whatsapp.auto_replies_add_rule')}
                        </Button>
                    )}
                </div>

                {flash.success && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">
                        {flash.success}
                    </div>
                )}

                <div className="space-y-3">
                    {rules.map(rule => (
                        <div
                            key={rule.id}
                            className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 flex items-center gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                        rule.trigger_type === 'keyword'
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                    }`}>
                                        {TRIGGER_LABEL_KEYS[rule.trigger_type] ? t(TRIGGER_LABEL_KEYS[rule.trigger_type]) : rule.trigger_type}
                                    </span>
                                    {rule.keywords?.length > 0 && (
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                            <strong>{rule.keywords.slice(0, 3).join(', ')}{rule.keywords.length > 3 ? '…' : ''}</strong>
                                            <span className="text-neutral-400 ml-1">({MATCH_MODE_LABEL_KEYS[rule.match_mode] ? t(MATCH_MODE_LABEL_KEYS[rule.match_mode]) : rule.match_mode})</span>
                                        </span>
                                    )}
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                        rule.response_kind === 'text'
                                            ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
                                            : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                    }`}>
                                        → {RESPONSE_KIND_LABEL_KEYS[rule.response_kind] ? t(RESPONSE_KIND_LABEL_KEYS[rule.response_kind]) : rule.response_kind}
                                    </span>
                                    {rule.priority > 0 && (
                                        <span className="text-[11px] text-neutral-400">{t('whatsapp.auto_replies_priority_badge', { n: rule.priority })}</span>
                                    )}
                                </div>
                                {rule.payload_json?.text && (
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                                        {rule.payload_json.text}
                                    </p>
                                )}
                                {rule.payload_json?.template_name && (
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                        {t('whatsapp.auto_replies_template_label')} <strong>{rule.payload_json.template_name}</strong> ({rule.payload_json.language ?? 'en'})
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => openEdit(rule)}
                                    title={t('whatsapp.auto_replies_edit_tooltip')}
                                    className="text-neutral-400 hover:text-brand-600 transition"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleToggle(rule)}
                                    title={rule.enabled ? t('whatsapp.auto_replies_disable') : t('whatsapp.auto_replies_enable')}
                                    className="text-neutral-400 hover:text-brand-600 transition"
                                >
                                    {rule.enabled
                                        ? <ToggleRight className="h-5 w-5 text-green-500" />
                                        : <ToggleLeft className="h-5 w-5" />
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(rule.id)}
                                    title={t('whatsapp.auto_replies_delete_tooltip')}
                                    className="text-neutral-400 hover:text-red-500 transition"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {rules.length === 0 && (
                        <EmptyState
                            icon={<Zap className="h-8 w-8" />}
                            title={t('whatsapp.auto_replies_empty_title')}
                            description={t('whatsapp.auto_replies_empty_description')}
                            action={{ label: t('whatsapp.auto_replies_add_rule'), onClick: () => setShowCreate(true) }}
                        />
                    )}
                </div>
            </div>

            {/* ── Create modal ── */}
            <Modal show={showCreate} onClose={() => setShowCreate(false)} maxWidth="md">
                <Modal.Header title={t('whatsapp.auto_replies_new_rule')} onClose={() => setShowCreate(false)} />
                <Modal.Body className="max-h-[80vh] overflow-y-auto">
                    <RuleForm
                        data={createForm.data}
                        setData={createForm.setData}
                        errors={createForm.errors}
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreate(false)}
                        processing={createForm.processing}
                        submitLabel={t('whatsapp.auto_replies_create_rule')}
                    />
                </Modal.Body>
            </Modal>

            {/* ── Edit modal ── */}
            <Modal show={!!editingRule} onClose={() => setEditingRule(null)} maxWidth="md">
                <Modal.Header title={t('whatsapp.auto_replies_edit_rule')} onClose={() => setEditingRule(null)} />
                <Modal.Body className="max-h-[80vh] overflow-y-auto">
                    <RuleForm
                        data={editForm.data}
                        setData={editForm.setData}
                        errors={editForm.errors}
                        onSubmit={handleEdit}
                        onCancel={() => setEditingRule(null)}
                        processing={editForm.processing}
                        submitLabel={t('whatsapp.auto_replies_save_changes')}
                    />
                </Modal.Body>
            </Modal>
        </ClientLayout>
    );
}
