import React, { useState, useEffect } from 'react';
import { X, Link2, Sparkles, ExternalLink } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function AddTriggerLinkModal({ isOpen, onClose, linkToEdit = null }) {
    const [name, setName] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [isAutoSlug, setIsAutoSlug] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (linkToEdit) {
            setName(linkToEdit.name || '');
            setTargetUrl(linkToEdit.target_url || '');
            setSlug(linkToEdit.slug || '');
            setIsAutoSlug(false);
        } else {
            setName('');
            setTargetUrl('');
            setSlug('');
            setIsAutoSlug(true);
        }
    }, [linkToEdit, isOpen]);

    if (!isOpen) return null;

    const handleNameChange = (e) => {
        const val = e.target.value;
        setName(val);
        if (isAutoSlug) {
            setSlug(val.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''));
        }
    };

    const handleSlugChange = (e) => {
        setIsAutoSlug(false);
        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !targetUrl.trim()) return;

        setProcessing(true);

        const payload = {
            name: name.trim(),
            target_url: targetUrl.trim(),
            slug: slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        };

        if (linkToEdit) {
            router.put(route('client.trigger_links.update', linkToEdit.id), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onClose();
                },
                onError: () => setProcessing(false),
            });
        } else {
            router.post(route('client.trigger_links.store'), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onClose();
                },
                onError: () => setProcessing(false),
            });
        }
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const displayShortUrl = `${origin}/l/${slug || 'link_slug'}`;
    const displayToken = `{{ trigger_links.${slug || 'link_slug'} }}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200/50 dark:border-indigo-800/40">
                            <Link2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                {linkToEdit ? 'Edit Trigger Link' : 'Add Trigger Link'}
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Track clicks and trigger automated workflows when leads click this link.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Link Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={handleNameChange}
                            placeholder="e.g. Google Review Link, Schedule Demo, Promo Landing Page"
                            className="w-full px-3.5 py-2.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-neutral-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Target Redirect URL *
                        </label>
                        <input
                            type="url"
                            required
                            value={targetUrl}
                            onChange={(e) => setTargetUrl(e.target.value)}
                            placeholder="https://g.page/r/your-business/review or https://example.com/demo"
                            className="w-full px-3.5 py-2.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-neutral-400"
                        />
                        <p className="text-[11px] text-neutral-400 mt-1">
                            Where the recipient is redirected after their click is logged and tracked.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Short Link Slug *
                            </label>
                            <span className="text-[10px] text-neutral-400 font-mono">
                                /l/{slug || '...'}
                            </span>
                        </div>
                        <input
                            type="text"
                            required
                            value={slug}
                            onChange={handleSlugChange}
                            placeholder="e.g. google_review"
                            className="w-full px-3.5 py-2.5 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-neutral-400"
                        />
                        
                        {/* Live Previews */}
                        <div className="mt-3 space-y-2">
                            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="text-[11px] font-medium">Short URL:</span>
                                </div>
                                <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 truncate max-w-[260px]">
                                    {displayShortUrl}
                                </span>
                            </div>

                            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-[11px] font-medium">Merge Tag:</span>
                                </div>
                                <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                                    {displayToken}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !name.trim() || !targetUrl.trim()}
                            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                            <span>{linkToEdit ? 'Save Changes' : 'Create Trigger Link'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
