import { Head, useForm, router, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import EmptyState from '@/Components/EmptyState';
import { Input, Select, Modal, Button, Toggle } from '@/Components/ui';
import { Plus, Bot, Trash2, Play, Settings, Send, X, BookOpen, Zap, MessageSquare, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownLite from '@/Components/MarkdownLite';
import { useConfirm } from '@/context/ConfirmationContext';

const TONE_OPTIONS = ['professional', 'friendly', 'formal', 'casual'];

const TONE_COLORS = {
    professional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    friendly: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    formal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    casual: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

function ToggleSwitch({ checked, onChange }) {
    return <Toggle checked={checked} onChange={onChange} />;
}

function PlaygroundPanel({ chatbot }) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const send = async () => {
        if (!input.trim() || loading) return;
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        try {
            const res = await fetch(route('client.ai.chatbots.playground', chatbot.uuid), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.content,
                },
                body: JSON.stringify({ message: userMsg.content, history: messages }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? data.error ?? t('ai.playground_error') }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <div className="flex flex-col h-[28rem] bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{chatbot.name} — {t('ai.playground')}</span>
                {messages.length > 0 && (
                    <button onClick={() => setMessages([])} className="ml-auto text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition">{t('ai.clear')}</button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                        <MessageSquare className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-sm text-neutral-400 dark:text-neutral-500">{t('ai.playground_empty')}</p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'}`}>
                            {m.role === 'user' ? 'U' : <Bot className="h-3.5 w-3.5" />}
                        </div>
                        <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${m.role === 'user' ? 'max-w-[75%] bg-brand-600 text-white rounded-tr-sm whitespace-pre-wrap break-words' : 'max-w-[85%] bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm rounded-tl-sm'}`}>
                            {m.role === 'user' ? m.content : <MarkdownLite content={m.content} />}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-2">
                        <div className="shrink-0 w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                            <Bot className="h-3.5 w-3.5 text-neutral-500" />
                        </div>
                        <div className="bg-white dark:bg-neutral-700 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                <Input
                    size="sm"
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={t('ai.type_a_message')}
                    rightElement={
                        <button
                            type="button"
                            onClick={send}
                            disabled={loading || !input.trim()}
                            className="shrink-0 w-6 h-6 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition text-white"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </button>
                    }
                    wrapperClassName="w-full"
                />
            </div>
        </div>
    );
}

function ChatbotCard({ chatbot, knowledgeBases }) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const [tab, setTab] = useState(null); // null | 'settings' | 'playground'

    const { data, setData, put, processing } = useForm({
        name: chatbot.name,
        system_prompt: chatbot.system_prompt ?? '',
        tone: chatbot.tone ?? 'professional',
        max_context_chunks: chatbot.max_context_chunks ?? 5,
        fallback_reply: chatbot.fallback_reply ?? '',
        ai_kb_id: chatbot.ai_kb_id ?? '',
        enabled: chatbot.enabled,
    });

    const save = (e) => {
        e.preventDefault();
        put(route('client.ai.chatbots.update', chatbot.uuid), { preserveScroll: true });
    };

    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Delete Chatbot',
            message: t('ai.delete_chatbot_confirm', { name: chatbot.name }) || `Are you sure you want to delete chatbot "${chatbot.name}"?`,
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (ok) {
            router.delete(route('client.ai.chatbots.destroy', chatbot.uuid), { preserveScroll: true });
        }
    };

    const linkedKb = knowledgeBases.find(kb => kb.id == chatbot.ai_kb_id);

    const toggleTab = (t) => setTab(prev => prev === t ? null : t);

    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden transition hover:shadow-sm">
            {/* Card Header */}
            <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{chatbot.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${chatbot.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                            {chatbot.enabled ? t('common.active') : t('ai.disabled')}
                        </span>
                        {chatbot.tone && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_COLORS[chatbot.tone] ?? 'bg-neutral-100 text-neutral-500'}`}>
                                {t(`ai.tone_${chatbot.tone}`)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                        {linkedKb ? (
                            <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                <BookOpen className="h-3 w-3" /> {linkedKb.name}
                            </span>
                        ) : (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">{t('ai.no_knowledge_base')}</span>
                        )}
                        {chatbot.system_prompt && (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate max-w-[180px]">"{chatbot.system_prompt}"</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => toggleTab('playground')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${tab === 'playground' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    >
                        <Play className="h-3.5 w-3.5" /> {t('ai.test')}
                    </button>
                    <button
                        onClick={() => toggleTab('settings')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${tab === 'settings' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    >
                        <Settings className="h-3.5 w-3.5" /> {t('ai.configure')}
                    </button>
                    <button onClick={handleDelete} className="rounded-lg p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Expandable Panels */}
            {tab === 'playground' && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 px-5 pb-5 pt-4">
                    <PlaygroundPanel chatbot={chatbot} />
                </div>
            )}

            {tab === 'settings' && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 px-5 pb-5 pt-4">
                    <form onSubmit={save} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Input
                                    label={t('common.name')}
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                />
                            </div>
                            <Select
                                label={t('ai.tone')}
                                value={data.tone}
                                onChange={e => setData('tone', e.target.value)}
                            >
                                {TONE_OPTIONS.map(tone => <option key={tone} value={tone}>{t(`ai.tone_${tone}`)}</option>)}
                            </Select>
                        </div>

                        <Select
                            label={t('ai.knowledge_base')}
                            value={data.ai_kb_id}
                            onChange={e => setData('ai_kb_id', e.target.value)}
                        >
                            <option value="">{t('ai.none')}</option>
                            {knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
                        </Select>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t('ai.system_prompt')}</label>
                            <textarea
                                value={data.system_prompt}
                                onChange={e => setData('system_prompt', e.target.value)}
                                rows={3}
                                placeholder={t('ai.system_prompt_placeholder')}
                                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
                            />
                        </div>

                        <div>
                            <Input
                                label={t('ai.fallback_reply')}
                                type="text"
                                value={data.fallback_reply}
                                onChange={e => setData('fallback_reply', e.target.value)}
                                placeholder={t('ai.fallback_reply_placeholder')}
                                hint={t('ai.fallback_reply_hint')}
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            <div>
                                <Input
                                    label={t('ai.max_context_chunks')}
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={data.max_context_chunks}
                                    onChange={e => setData('max_context_chunks', Number(e.target.value))}
                                    className="w-20"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-5">
                                <ToggleSwitch checked={data.enabled} onChange={v => setData('enabled', v)} />
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('common.active')}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition"
                            >
                                {processing ? t('ai.saving') : t('ai.save_changes')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab(null)}
                                className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function AiChatbotsIndex({ chatbots, knowledgeBases }) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};
    const [showCreate, setShowCreate] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({ name: '' });

    const handleCreate = (e) => {
        e.preventDefault();
        post(route('client.ai.chatbots.store'), { onSuccess: () => { reset(); setShowCreate(false); } });
    };

    return (
        <ClientLayout title={t('ai.chatbots_title')}>
            <Head title={`${t('ai.chatbots_title')} · AI`} />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('ai.chatbots_heading')}</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{t('ai.chatbots_subtitle')}</p>
                    </div>
                    {(
                        <Button
                            onClick={() => setShowCreate(true)}
                        >
                            <Plus className="h-4 w-4 mr-1.5" /> {t('ai.new_chatbot')}
                        </Button>
                    )}
                </div>

                {/* Stats bar */}
                {chatbots.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: t('ai.stat_total_bots'), value: chatbots.length, icon: Bot, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20' },
                            { label: t('common.active'), value: chatbots.filter(c => c.enabled).length, icon: Zap, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                            { label: t('ai.stat_with_kb'), value: chatbots.filter(c => c.ai_kb_id).length, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                        ].map(stat => (
                            <div key={stat.label} className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                                    <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">{stat.value}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {flash.success && (
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        {flash.success}
                    </div>
                )}

                {/* Chatbot list */}
                <div className="space-y-3">
                    {chatbots.map(cb => (
                        <ChatbotCard key={cb.id} chatbot={cb} knowledgeBases={knowledgeBases} />
                    ))}
                    {chatbots.length === 0 && (
                        <EmptyState
                            icon={<Bot className="h-8 w-8" />}
                            title={t('ai.chatbots_empty_title')}
                            description={t('ai.chatbots_empty_description')}
                            action={{ label: t('ai.new_chatbot'), onClick: () => setShowCreate(true) }}
                        />
                    )}
                </div>
            </div>

            {/* Create modal */}
            <Modal show={showCreate} onClose={() => setShowCreate(false)} maxWidth="sm">
                <Modal.Header
                    title={
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                            </div>
                            <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('ai.new_chatbot')}</span>
                        </div>
                    }
                    onClose={() => setShowCreate(false)}
                />
                <form onSubmit={handleCreate}>
                    <Modal.Body className="space-y-4">
                        <div>
                            <Input
                                label={t('ai.chatbot_name')}
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                required
                                autoFocus
                                placeholder={t('ai.chatbot_name_placeholder')}
                                error={errors.name}
                            />
                        </div>

                        <p className="text-xs text-neutral-400 dark:text-neutral-500">{t('ai.chatbot_create_hint')}</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowCreate(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            {processing ? t('ai.creating') : t('ai.create_chatbot')}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </ClientLayout>
    );
}
