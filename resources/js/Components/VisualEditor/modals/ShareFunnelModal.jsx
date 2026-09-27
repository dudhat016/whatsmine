import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, Key, ShieldCheck } from 'lucide-react';
import { Input } from '@/Components/ui';

export default function ShareFunnelModal({ isOpen, onClose, funnel }) {
    const [copiedField, setCopiedField] = useState(null);

    if (!isOpen || !funnel) return null;

    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/funnels/share/${funnel.uuid || funnel.id}`;
    const cloneToken = `fnl_share_${funnel.uuid || funnel.id}`;

    const handleCopy = (text, field) => {
        navigator.clipboard?.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                Share & Transfer Funnel
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Share this funnel with clients or clone to another workspace.
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

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Share Link */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Globe className="w-4 h-4 text-brand-500" /> Public Share Link
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                size="sm"
                                wrapperClassName="flex-1"
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => handleCopy(shareUrl, 'url')}
                                className="px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition flex items-center gap-1 shrink-0"
                            >
                                {copiedField === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedField === 'url' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Clone Token */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Key className="w-4 h-4 text-indigo-500" /> Agency Clone Token
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                size="sm"
                                wrapperClassName="flex-1"
                                type="text"
                                readOnly
                                value={cloneToken}
                                className="font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => handleCopy(cloneToken, 'token')}
                                className="px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-xl transition flex items-center gap-1 shrink-0"
                            >
                                {copiedField === 'token' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedField === 'token' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                            Anyone with this token can import a complete copy of this funnel into their workspace.
                        </p>
                    </div>

                    {/* Status Badge */}
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                            <span className="font-bold block">Funnel Active & Shareable</span>
                            <span>Shared templates automatically strip sensitive payment keys and private contacts.</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 transition"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
