import React, { useState } from 'react';
import { Copy, Check, Globe, Key, ShieldCheck } from 'lucide-react';
import { Modal, Button, Input } from '@/Components/ui';

export default function ShareFunnelModal({ isOpen, onClose, funnel }) {
    const [copiedField, setCopiedField] = useState(null);

    if (!funnel) return null;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/funnels/share/${funnel.uuid || funnel.id}`;
    const cloneToken = `fnl_share_${funnel.uuid || funnel.id}`;

    const handleCopy = (text, field) => {
        navigator.clipboard?.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2500);
    };

    return (
        <Modal
            show={!!isOpen}
            onClose={onClose}
            title="Share & Transfer Funnel"
            description="Share this funnel with clients or clone to another workspace."
            maxWidth="lg"
        >
            <div className="space-y-5">
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
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleCopy(shareUrl, 'url')}
                            icon={copiedField === 'url' ? Check : Copy}
                        >
                            {copiedField === 'url' ? 'Copied' : 'Copy'}
                        </Button>
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
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCopy(cloneToken, 'token')}
                            icon={copiedField === 'token' ? Check : Copy}
                        >
                            {copiedField === 'token' ? 'Copied' : 'Copy'}
                        </Button>
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

                {/* Footer */}
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                    >
                        Done
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
