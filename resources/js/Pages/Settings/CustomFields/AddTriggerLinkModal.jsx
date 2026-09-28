import React, { useState, useEffect } from 'react';
import { Link2, Sparkles, ExternalLink } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Modal, Button, Input } from '@/Components/ui';

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

        const targetRoute = linkToEdit
            ? route('client.trigger_links.update', linkToEdit.id)
            : route('client.trigger_links.store');
        const method = linkToEdit ? router.put : router.post;

        method(targetRoute, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                onClose();
            },
            onError: () => setProcessing(false),
        });
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const displayShortUrl = `${origin}/l/${slug || 'link_slug'}`;
    const displayToken = `{{ trigger_links.${slug || 'link_slug'} }}`;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="lg">
            <Modal.Header
                title={
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
                }
                onClose={onClose}
            />

            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-4">
                    <Input
                        label="Link Name *"
                        type="text"
                        required
                        value={name}
                        onChange={handleNameChange}
                        placeholder="e.g. Google Review Link, Schedule Demo, Promo Landing Page"
                    />

                    <Input
                        label="Target Redirect URL *"
                        type="url"
                        required
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="https://g.page/r/your-business/review or https://example.com/demo"
                        hint="Where the recipient is redirected after their click is logged and tracked."
                    />

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Short Link Slug *
                            </label>
                            <span className="text-[10px] text-neutral-400 font-mono">
                                /l/{slug || '...'}
                            </span>
                        </div>
                        <Input
                            type="text"
                            required
                            value={slug}
                            onChange={handleSlugChange}
                            placeholder="e.g. google_review"
                            className="font-mono"
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
                        disabled={!name.trim() || !targetUrl.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {linkToEdit ? 'Save Changes' : 'Create Trigger Link'}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
