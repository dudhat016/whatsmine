import React, { useState } from 'react';
import Modal from '@/Components/ui/Modal';
import Button from '@/Components/ui/Button';
import { Copy, Check, Code, ExternalLink } from 'lucide-react';

export default function EmbedModal({ isOpen, onClose, calendar }) {
    const [copiedIframe, setCopiedIframe] = useState(false);
    const [copiedButton, setCopiedButton] = useState(false);

    if (!calendar) return null;

    const publicUrl = window.location.origin + `/b/${calendar.slug}`;

    const iframeCode = `<iframe src="${publicUrl}" width="100%" height="700" frameborder="0" style="border:0; min-height: 700px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);" allowfullscreen></iframe>`;

    const buttonCode = `<a href="${publicUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 24px; font-family: sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">Book ${calendar.name}</a>`;

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'iframe') {
            setCopiedIframe(true);
            setTimeout(() => setCopiedIframe(false), 2000);
        } else {
            setCopiedButton(true);
            setTimeout(() => setCopiedButton(false), 2000);
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="xl">
            <Modal.Header title={`Embed "${calendar.name}" on Your Website`} onClose={onClose} />
            <Modal.Body className="space-y-6 text-slate-800 dark:text-slate-100">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Copy and paste these responsive code snippets into your website HTML (WordPress, Webflow, Wix, Squarespace, Shopify, or custom HTML).
                </p>

                {/* Option 1: Inline iFrame */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            1. Inline iFrame Embed Code (Seamless Responsive Widget)
                        </label>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => copyToClipboard(iframeCode, 'iframe')}
                            className="text-xs gap-1"
                        >
                            {copiedIframe ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedIframe ? 'Copied!' : 'Copy Code'}
                        </Button>
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all border border-slate-800">
                        {iframeCode}
                    </pre>
                </div>

                {/* Option 2: Booking Button */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <ExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            2. Branded Call-to-Action Button Snippet
                        </label>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => copyToClipboard(buttonCode, 'button')}
                            className="text-xs gap-1"
                        >
                            {copiedButton ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedButton ? 'Copied!' : 'Copy Code'}
                        </Button>
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all border border-slate-800">
                        {buttonCode}
                    </pre>
                </div>

                {/* Direct Link */}
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate pr-2">Direct URL: {publicUrl}</span>
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0 hover:underline">
                        Test Link →
                    </a>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
