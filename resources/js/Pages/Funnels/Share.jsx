import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Share2, Download, ExternalLink, Copy, Check, Layers,
    CheckCircle2, ArrowRight, ShieldCheck, Sparkles, LayoutTemplate,
    ShoppingCart, Zap, HeartHandshake, Eye
} from 'lucide-react';
import { Input } from '@/Components/ui';

export default function ShareFunnel({ funnel, steps = [], previewUrl, shareToken, isAuthenticated }) {
    const [importing, setImporting] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);

    const cloneToken = `fnl_share_${funnel.uuid || funnel.id}`;

    const handleCopyToken = () => {
        navigator.clipboard?.writeText(cloneToken);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
    };

    const handleImport = () => {
        setImporting(true);
        router.post(route('funnels.share.import', shareToken), {}, {
            onFinish: () => setImporting(false),
        });
    };

    const stepTypeIcons = {
        optin: '🎯',
        sales: '🔥',
        checkout: '💳',
        upsell: '⚡',
        downsell: '🏷️',
        thankyou: '🎉',
        webinar: '🎥',
        content: '📄',
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
            <Head title={`Import Funnel: ${funnel.name}`} />

            {/* Top Navigation */}
            <header className="border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">WhatsMine</span>
                            <span className="text-[10px] ml-1.5 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-bold border border-brand-500/20">Funnel Share</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {previewUrl && (
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition border border-neutral-700"
                            >
                                <Eye className="h-3.5 w-3.5" /> Live Preview
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={importing}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition shadow-lg shadow-brand-600/30 active:scale-95 disabled:opacity-50"
                        >
                            <Download className="h-3.5 w-3.5" />
                            {importing ? 'Cloning Funnel...' : '1-Click Import Funnel'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-10">
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                        <ShieldCheck className="h-4 w-4" /> Ready for 1-Click Workspace Import
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                        {funnel.name}
                    </h1>
                    <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto">
                        This complete multi-step sales funnel is ready to clone directly into your workspace with all layouts, styles, and checkout logic preserved.
                    </p>
                </div>

                {/* Primary Action Card */}
                <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/90 to-neutral-900/50 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
                        <div>
                            <span className="text-xs uppercase font-bold tracking-wider text-neutral-500">Funnel Structure</span>
                            <h3 className="text-lg font-bold text-white mt-0.5">
                                {steps.length} Optimized Funnel Step{steps.length === 1 ? '' : 's'}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {previewUrl && (
                                <a
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-xl transition border border-neutral-700 flex items-center gap-1.5"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" /> Preview Funnel
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={handleImport}
                                disabled={importing}
                                className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl transition shadow-lg shadow-brand-500/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                <Zap className="h-4 w-4" />
                                {importing ? 'Importing Funnel...' : 'Clone to My Workspace'}
                            </button>
                        </div>
                    </div>

                    {/* Step Timeline Sequence */}
                    <div className="space-y-3">
                        {steps.map((step, idx) => (
                            <div
                                key={step.id || idx}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-neutral-800/80 bg-neutral-950/40 hover:border-neutral-700 transition"
                            >
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-lg font-bold">
                                    {stepTypeIcons[step.type] || '📄'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-brand-400">Step {idx + 1}:</span>
                                        <h4 className="text-sm font-bold text-white truncate">{step.name}</h4>
                                    </div>
                                    <p className="text-xs text-neutral-400 capitalize mt-0.5">
                                        {step.type?.replace('_', ' ') || 'Page'}
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase bg-neutral-800/80 text-neutral-300 border border-neutral-700/60">
                                        {step.type}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {steps.length === 0 && (
                            <div className="text-center py-6 text-neutral-500 text-xs">
                                1 Master Landing Step
                            </div>
                        )}
                    </div>

                    {/* Clone Token Box */}
                    <div className="pt-4 border-t border-neutral-800/80 space-y-2">
                        <label className="text-xs font-semibold text-neutral-400 flex items-center justify-between">
                            <span>Agency Clone Token</span>
                            <span className="text-[10px] text-neutral-500">Copy token for agency imports</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={cloneToken}
                                className="flex-1 font-mono text-xs"
                            />
                            <button
                                type="button"
                                onClick={handleCopyToken}
                                className="px-3.5 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition flex items-center gap-1.5 shrink-0 border border-neutral-700"
                            >
                                {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                {copiedToken ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-600">
                Powered by WhatsMine Funnels • High-Converting Funnel Engine
            </footer>
        </div>
    );
}
