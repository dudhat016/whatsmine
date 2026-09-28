import { useState } from 'react';
import ClientLayout from '@/Layouts/ClientLayout';
import { Head, usePage } from '@inertiajs/react';
import { Key, Plus, Trash2, Copy, Check } from 'lucide-react';
import { DatePicker, Input, Modal, Button, Checkbox } from '@/Components/ui';
import { formatDateTz } from '@/Utils/datetime';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/context/ConfirmationContext';

const ALL_SCOPES = [
    { scope: 'contacts:read',       labelKey: 'api.scope_contacts_read' },
    { scope: 'contacts:write',      labelKey: 'api.scope_contacts_write' },
    { scope: 'campaigns:read',      labelKey: 'api.scope_campaigns_read' },
    { scope: 'campaigns:write',     labelKey: 'api.scope_campaigns_write' },
    { scope: 'messages:write',      labelKey: 'api.scope_messages_write' },
    { scope: 'conversations:read',  labelKey: 'api.scope_conversations_read' },
    { scope: 'webhooks:write',      labelKey: 'api.scope_webhooks_write' },
    { scope: 'ai:read',             labelKey: 'api.scope_ai_read' },
    { scope: 'ai:write',            labelKey: 'api.scope_ai_write' },
    { scope: 'automations:write',   labelKey: 'api.scope_automations_write' },
    { scope: 'social:write',        labelKey: 'api.scope_social_write' },
];

// formatDate is resolved per component using user's timezone via usePage()

function ScopeTag({ scope }) {
    return (
        <span className="inline-block px-2 py-0.5 text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full font-mono">
            {scope}
        </span>
    );
}

function CreateTokenModal({ onClose, onCreated }) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [selectedScopes, setSelectedScopes] = useState([]);
    const [wildcardAll, setWildcardAll] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleScope = (scope) => {
        setSelectedScopes(prev =>
            prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
        );
    };

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const abilities = wildcardAll ? ['*'] : (selectedScopes.length ? selectedScopes : ['*']);
        try {
            const res = await fetch('/api/v1/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                credentials: 'include',
                body: JSON.stringify({ name, abilities, expires_at: expiresAt || undefined }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.message ?? JSON.stringify(json.errors ?? t('api.create_token_failed')));
            } else {
                onCreated(json);
            }
        } catch {
            setError(t('api.error_occurred'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={true} onClose={onClose} maxWidth="lg">
            <Modal.Header title={t('api.create_token')} onClose={onClose} />
            <form onSubmit={submit}>
                <Modal.Body className="space-y-5">
                    <div>
                        <Input
                            type="text"
                            label={t('api.token_name_label')}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t('api.token_name_placeholder')}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t('api.permissions_label')}</label>
                        <Checkbox
                            checked={wildcardAll}
                            onChange={e => setWildcardAll(e.target.checked)}
                            label={t('api.full_access')}
                            className="mb-3"
                        />
                        {!wildcardAll && (
                            <div className="border border-neutral-200 dark:border-neutral-600 rounded-soft divide-y divide-neutral-100 dark:divide-neutral-700 max-h-48 overflow-y-auto">
                                {ALL_SCOPES.map(({ scope, labelKey }) => (
                                    <label key={scope} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <Checkbox
                                            checked={selectedScopes.includes(scope)}
                                            onChange={() => toggleScope(scope)}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <span className="text-xs font-mono text-brand-600 dark:text-brand-400">{scope}</span>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t(labelKey)}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('api.expires_at_label')}</label>
                        <DatePicker
                            value={expiresAt}
                            onChange={setExpiresAt}
                            min={new Date().toISOString().slice(0, 10)}
                        />
                    </div>

                    {error && <p className="text-coral-500 text-sm">{error}</p>}
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? t('api.creating') : t('api.create_token')}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}

function NewTokenDisplay({ token, onClose }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(token.token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal show={true} onClose={onClose} maxWidth="lg">
            <Modal.Header title={t('api.token_created')} onClose={onClose} />
            <Modal.Body className="space-y-4">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                    {t('api.copy_token_warning')}
                </p>
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-700/50 rounded-soft p-3">
                    <code className="flex-1 text-xs text-neutral-900 dark:text-white break-all font-mono">{token.token}</code>
                    <button onClick={copy} className="shrink-0 p-1.5 text-neutral-500 hover:text-brand-600">
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
                <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('api.scopes_label')}</p>
                    <div className="flex flex-wrap gap-1">
                        {(token.abilities ?? ['*']).map(s => <ScopeTag key={s} scope={s} />)}
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose}>{t('common.close')}</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default function TokensIndex({ initialTokens = [] }) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const { timezone } = usePage().props;
    const userTz = timezone || 'Asia/Dhaka';
    const formatDate = (iso) => formatDateTz(iso, userTz);
    const [tokens, setTokens] = useState(initialTokens);
    const [showCreate, setShowCreate] = useState(false);
    const [newToken, setNewToken] = useState(null);

    const handleCreated = (token) => {
        setShowCreate(false);
        setNewToken(token);
        setTokens(prev => [{ id: token.id, name: token.name, abilities: token.abilities, last_used_at: null, expires_at: token.expires_at, created_at: token.created_at }, ...prev]);
    };

    const handleRevoke = async (id) => {
        const ok = await confirm({
            title: 'Revoke API Token',
            message: t('api.revoke_confirm') || 'Are you sure you want to revoke this token? Any application using it will lose access immediately.',
            confirmText: 'Revoke Token',
            variant: 'danger',
        });
        if (!ok) return;
        await fetch(`/api/v1/tokens/${id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
            credentials: 'include',
        });
        setTokens(prev => prev.filter(tk => tk.id !== id));
    };

    return (
        <ClientLayout title={t('api.tokens_title')}>
            <Head title={t('api.tokens_title')} />
            <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Key className="h-6 w-6 text-brand-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('api.tokens_title')}</h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('api.tokens_subtitle')}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowCreate(true)}
                    >
                        <Plus className="h-4 w-4 mr-1.5" /> {t('api.create_token')}
                    </Button>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-soft border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            {t('api.base_url')}: <code className="font-mono text-brand-600 dark:text-brand-400">{window.location.origin}/api/v1</code>
                        </h2>
                        <a href={route('client.api-docs')} className="text-xs text-brand-600 hover:underline">{t('api.view_docs')} →</a>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('api.col_name')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('api.col_scopes')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('api.col_last_used')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('api.col_expires')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('api.col_created')}</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {tokens.map(token => (
                                <tr key={token.id}>
                                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{token.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(token.abilities ?? ['*']).slice(0, 3).map(s => <ScopeTag key={s} scope={s} />)}
                                            {(token.abilities ?? []).length > 3 && (
                                                <span className="text-xs text-neutral-400">+{token.abilities.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">{formatDate(token.last_used_at)}</td>
                                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">
                                        {token.expires_at ? (
                                            <span className={new Date(token.expires_at) < new Date() ? 'text-coral-500' : ''}>
                                                {formatDate(token.expires_at)}
                                            </span>
                                        ) : t('api.never')}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">{formatDate(token.created_at)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleRevoke(token.id)} className="p-1 text-neutral-400 hover:text-coral-600" title={t('api.revoke')}>
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!tokens.length && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500">
                                        {t('api.no_tokens')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-soft border border-neutral-200 dark:border-neutral-700 p-4">
                    <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('api.quick_start')}</h3>
                    <pre className="text-xs text-neutral-600 dark:text-neutral-400 overflow-x-auto whitespace-pre-wrap">
{`curl -H "Authorization: Bearer <your_token>" \\
     -H "Accept: application/json" \\
     ${window.location.origin}/api/v1/me`}
                    </pre>
                </div>
            </div>

            {showCreate && <CreateTokenModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
            {newToken && <NewTokenDisplay token={newToken} onClose={() => setNewToken(null)} />}
        </ClientLayout>
    );
}
