import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import ClientLayout from '@/Layouts/ClientLayout';
import EmptyState from '@/Components/EmptyState';
import { SocialBrandIcon } from '@/Components/BrandIcons';
import {
    Plus, Trash2, ExternalLink, Share2, Clock, CheckCircle2, XCircle,
    Pencil, Send, Sparkles, Eye, Image, X, Calendar, Zap, Ban,
} from 'lucide-react';
import { browserTz, formatInTz } from '@/Utils/datetime';
import AiPlannerModal from './AiPlannerModal';
import { useConfirm } from '@/context/ConfirmationContext';

const STATUS_META = {
    draft:      { labelKey: 'social.status_draft',      cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300', icon: <Pencil className="h-3 w-3" /> },
    scheduled:  { labelKey: 'social.status_scheduled',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',         icon: <Clock className="h-3 w-3" /> },
    publishing: { labelKey: 'social.status_publishing', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', icon: <Send className="h-3 w-3" /> },
    published:  { labelKey: 'social.status_published',  cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',     icon: <CheckCircle2 className="h-3 w-3" /> },
    failed:     { labelKey: 'social.status_failed',     cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',             icon: <XCircle className="h-3 w-3" /> },
};

const NETWORKS = ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok'];
const NETWORK_LABELS = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', twitter: 'X (Twitter)', youtube: 'YouTube', tiktok: 'TikTok' };

function StatusBadge({ status }) {
    const { t } = useTranslation();
    const meta = STATUS_META[status] ?? { labelKey: null, cls: 'bg-neutral-100 text-neutral-500', icon: null };
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
            {meta.icon} {meta.labelKey ? t(meta.labelKey) : status}
        </span>
    );
}

function AccountPill({ acct }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="relative shrink-0">
                {acct.picture_url
                    ? <img src={acct.picture_url} alt={acct.name} className="h-5 w-5 rounded-full object-cover" />
                    : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 text-[9px] font-bold text-neutral-500">
                        {acct.name?.[0]?.toUpperCase() ?? '?'}
                      </span>
                }
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white dark:bg-neutral-900 ring-1 ring-white dark:ring-neutral-900">
                    <SocialBrandIcon network={acct.network} className="h-2.5 w-2.5" />
                </span>
            </div>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-[100px]">{acct.name}</span>
        </div>
    );
}

/* ── Detail Modal ─────────────────────────────────────────────── */
function PostDetailModal({ post, accountMap, userTz, onClose }) {
    const { t } = useTranslation();
    if (!post) return null;
    const targets = post.target_accounts ?? [];
    const dateField = post.published_at ?? post.scheduled_at;
    const tz = post.timezone || userTz;
    const mediaUrls = (post.media_urls ?? []).filter(Boolean);
    const canEdit = ['draft', 'scheduled', 'failed'].includes(post.status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={post.status} />
                        {dateField && (
                            <span className="flex items-center gap-1 text-xs text-neutral-400">
                                <Calendar className="h-3 w-3" /> {formatInTz(dateField, tz)}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                    {post.title && <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{post.title}</h3>}
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">{post.body}</p>

                    {mediaUrls.length > 0 && (
                        <div className={`grid gap-2 ${mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {mediaUrls.map((url, i) => (
                                <img key={i} src={url} alt="" className="w-full rounded-lg object-cover max-h-48" />
                            ))}
                        </div>
                    )}

                    {targets.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{t('social.posted_to')}</p>
                            <div className="flex flex-wrap gap-2">
                                {targets.map((id) => {
                                    const acct = accountMap[id];
                                    if (!acct) return null;
                                    return (
                                        <div key={id} className="flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 px-2.5 py-1">
                                            <AccountPill acct={acct} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {post.publish_results && Object.keys(post.publish_results).length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{t('social.publish_results')}</p>
                            <div className="space-y-1.5">
                                {Object.entries(post.publish_results).map(([accountId, result]) => {
                                    const acct = accountMap[accountId];
                                    return (
                                        <div key={accountId} className="flex items-center justify-between text-xs rounded-lg bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
                                            <span className="text-neutral-600 dark:text-neutral-400">{acct?.name ?? t('social.account_number', { id: accountId })}</span>
                                            <span className={result.status === 'published' ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                                                {result.status === 'published' ? t('social.result_published') : t('social.result_failed')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        {post.post_url && (
                            <a href={post.post_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition">
                                <ExternalLink className="h-4 w-4" /> {t('social.view_on_platform')}
                            </a>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Link href={route('client.social.posts.edit', post.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition">
                                <Pencil className="h-3.5 w-3.5" /> {t('common.edit')}
                            </Link>
                        )}
                        <button onClick={onClose}
                            className="rounded-lg bg-neutral-200 dark:bg-neutral-700 px-4 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition">
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Post Card ────────────────────────────────────────────────── */
function PostCard({ post, accountMap, userTz, onView, onDelete }) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const [actioning, setActioning] = useState(null);
    const targets = post.target_accounts ?? [];
    const dateField = post.published_at ?? post.scheduled_at;
    const tz = post.timezone || userTz;
    const canDelete = ['draft', 'scheduled', 'failed'].includes(post.status);
    const canEdit   = ['draft', 'scheduled', 'failed'].includes(post.status);
    const canPublishNow = ['draft', 'scheduled', 'failed'].includes(post.status);
    const canCancel = post.status === 'scheduled';
    const mediaUrls = (post.media_urls ?? []).filter(Boolean);

    const action = async (type, confirmMsg, fn) => {
        const ok = await confirm({
            title: 'Confirm Action',
            message: confirmMsg,
            confirmText: 'Confirm',
            variant: type === 'delete' || type === 'cancel' ? 'danger' : 'primary',
        });
        if (!ok) return;
        setActioning(type);
        router.post(fn(), {}, {
            preserveScroll: true,
            onFinish: () => setActioning(null),
        });
    };

    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
            {/* Media thumbnail / accent bar */}
            {mediaUrls.length > 0 ? (
                <div className="relative h-40 bg-neutral-100 dark:bg-neutral-800 shrink-0">
                    <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                    {mediaUrls.length > 1 && (
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            +{mediaUrls.length - 1}
                        </span>
                    )}
                </div>
            ) : (
                <div className="h-2 bg-gradient-to-r from-brand-400 to-indigo-500 shrink-0" />
            )}

            <div className="p-4 flex flex-col flex-1 gap-3">
                {/* Status + Target accounts */}
                <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={post.status} />
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                        {targets.map(target => {
                            const acc = accountMap[target.account_id];
                            return (
                                <span
                                    key={target.account_id}
                                    title={acc?.name || target.platform}
                                    className="inline-flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-neutral-100 dark:bg-neutral-800 text-xs"
                                >
                                    <SocialBrandIcon platform={target.platform} className="h-3.5 w-3.5" />
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Content preview */}
                <p className="text-sm text-neutral-800 dark:text-neutral-200 line-clamp-3 flex-1">
                    {post.content || <span className="italic text-neutral-400">{t('social.no_content')}</span>}
                </p>

                {/* Date / meta */}
                {dateField && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatInTz(dateField, tz, 'MMM d, yyyy h:mm a')}</span>
                    </div>
                )}

                {/* Failure reason */}
                {post.status === 'failed' && post.error_message && (
                    <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2 line-clamp-2">
                        {post.error_message}
                    </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                    <button
                        type="button"
                        onClick={() => onView(post)}
                        className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        {t('common.view')}
                    </button>

                    <div className="flex items-center gap-1">
                        {canPublishNow && (
                            <button
                                type="button"
                                disabled={actioning !== null}
                                onClick={() => action('publish', t('social.confirm_publish_now'), () => route('client.social.posts.publish-now', post.id))}
                                title={t('social.publish_now')}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 dark:text-brand-300 font-medium transition-colors"
                            >
                                <Zap className="h-3 w-3" />
                                {t('social.publish_now')}
                            </button>
                        )}
                        {canCancel && (
                            <button
                                type="button"
                                disabled={actioning !== null}
                                onClick={() => action('cancel', t('social.confirm_cancel_post'), () => route('client.social.posts.cancel', post.id))}
                                title={t('social.cancel_scheduled')}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 transition-colors"
                            >
                                <Ban className="h-3 w-3" />
                                {t('common.cancel')}
                            </button>
                        )}
                        {canEdit && (
                            <Link
                                href={route('client.social.posts.edit', post.id)}
                                className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                                title={t('common.edit')}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Link>
                        )}
                        {canDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(post.id)}
                                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-600 transition-colors"
                                title={t('common.delete')}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Page Component ───────────────────────────────────────── */
export default function SocialPostsIndex({ posts, accounts, filters }) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const { props } = usePage();
    const flash = props.flash ?? {};
    const userTz = props.timezone || browserTz() || 'Asia/Dhaka';

    const [plannerOpen, setPlannerOpen] = useState(false);
    const [detailPost, setDetailPost] = useState(null);
    const accountMap = accounts.reduce((acc, a) => { acc[a.id] = a; return acc; }, {});

    const handleFilter = (key, val) =>
        router.get(route('client.social.posts.index'), { ...filters, [key]: val || undefined }, { preserveState: true, replace: true });

    const handleDelete = async (id) => {
        const ok = await confirm({
            title: 'Delete Post',
            message: t('social.confirm_delete_post') || 'Are you sure you want to delete this post?',
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (ok) {
            router.delete(route('client.social.posts.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <ClientLayout title={t('social.posts_title')}>
            <Head title={t('social.posts_head')} />
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('social.posts_title')}</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{t('social.posts_subtitle')}</p>
                    </div>
                    {(
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPlannerOpen(true)}
                                className="ai-glow inline-flex items-center gap-1.5 rounded-lg border border-brand-600 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition">
                                <Sparkles className="h-4 w-4" /> {t('social.ai_plan')}
                            </button>
                            <Link href={route('client.social.composer')}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 transition">
                                <Plus className="h-4 w-4" /> {t('social.new_post')}
                            </Link>
                        </div>
                    )}
                </div>

                {flash.success && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">{flash.success}</div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider shrink-0">{t('social.filter_by')}</span>
                    <div className="flex flex-wrap gap-2 flex-1">
                        <div className="relative">
                            <select
                                value={filters.status ?? ''}
                                onChange={(e) => handleFilter('status', e.target.value)}
                                className="appearance-none rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 pl-3 pr-8 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                            >
                                <option value="">{t('social.status_all')}</option>
                                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{t(v.labelKey)}</option>)}
                            </select>
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                            </span>
                        </div>
                        <div className="relative">
                            <select
                                value={filters.network ?? ''}
                                onChange={(e) => handleFilter('network', e.target.value)}
                                className="appearance-none rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 pl-3 pr-8 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                            >
                                <option value="">{t('social.all_platforms')}</option>
                                {NETWORKS.map((n) => <option key={n} value={n}>{NETWORK_LABELS[n]}</option>)}
                            </select>
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                            </span>
                        </div>
                        {(filters.status || filters.network) && (
                            <button
                                onClick={() => router.get(route('client.social.posts.index'), {}, { replace: true })}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            >
                                <X className="h-3.5 w-3.5" /> {t('social.clear')}
                            </button>
                        )}
                    </div>
                    <span className="text-xs text-neutral-400 shrink-0">{t('social.post_count', { count: posts.total })}</span>
                </div>

                {/* Cards */}
                {posts.data.length === 0 ? (
                    <EmptyState
                        icon={<Share2 className="h-8 w-8" />}
                        title={t('social.no_posts_title')}
                        description={t('social.no_posts_description')}
                        action={{ label: t('social.new_post'), href: route('client.social.composer') }}
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {posts.data.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                accountMap={accountMap}
                                userTz={userTz}
                                onView={setDetailPost}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {posts.last_page > 1 && (
                    <div className="flex gap-1 flex-wrap">
                        {posts.links.map((link, i) => (
                            link.url ? (
                                <Link key={i} href={link.url}
                                    className={`px-3 py-1.5 rounded text-sm border ${link.active ? 'bg-brand-600 text-white border-brand-600' : 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="px-3 py-1.5 rounded text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-300 dark:text-neutral-600 opacity-40 cursor-not-allowed"
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            )
                        ))}
                    </div>
                )}
            </div>

            <PostDetailModal post={detailPost} accountMap={accountMap} userTz={userTz} onClose={() => setDetailPost(null)} />

            <AiPlannerModal show={plannerOpen} onClose={() => setPlannerOpen(false)} accounts={accounts}
                onSuccess={() => { setPlannerOpen(false); router.reload({ only: ['posts'] }); }} />
        </ClientLayout>
    );
}
