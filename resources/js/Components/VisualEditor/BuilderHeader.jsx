import React from 'react';
import { Link } from '@inertiajs/react';
import {
    ArrowLeft, Send, CheckCircle, RefreshCw, AlertCircle, Save,
    Monitor, Tablet, Smartphone, LayoutTemplate, Layers, History, Share2, Code
} from 'lucide-react';

export default function BuilderHeader({
    funnel,
    activePage,
    viewport,
    setViewport,
    publishing,
    handlePublish,
    hasUnsavedChanges = false,
    isSaving = false,
    handleSave,
    onOpenTemplates,
    onOpenPopups,
    onOpenHistory,
    onOpenShare,
    onOpenCodeExport,
}) {
    return (
        <header className="h-14 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0 shadow-xs z-30">
            {/* Left: Back & Title Info */}
            <div className="flex items-center gap-3">
                <Link
                    href={route('client.funnels.index')}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    title="Back to Funnels List"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="h-4 w-px bg-neutral-200 dark:border-neutral-800" />
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="font-bold text-xs text-neutral-900 dark:text-white leading-tight">
                            {funnel.name}
                        </h1>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            funnel.status === 'published' ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' : 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                        }`}>
                            {funnel.status || 'draft'}
                        </span>
                        {/* Save Status Indicator */}
                        <div className="flex items-center gap-1 text-[10px] font-medium">
                            {isSaving ? (
                                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                                    <RefreshCw className="h-3 w-3 animate-spin" /> Saving changes...
                                </span>
                            ) : hasUnsavedChanges ? (
                                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Unsaved Changes
                                </span>
                            ) : (
                                <span className="text-neutral-400 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-emerald-500" /> Saved
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle: Responsive Viewport Switcher */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-inner">
                <button
                    type="button"
                    onClick={() => setViewport('desktop')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        viewport === 'desktop'
                            ? 'bg-neutral-800 text-white dark:bg-brand-600 shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200'
                    }`}
                >
                    <Monitor className="h-3.5 w-3.5" /> Desktop
                </button>
                <button
                    type="button"
                    onClick={() => setViewport('tablet')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        viewport === 'tablet'
                            ? 'bg-neutral-800 text-white dark:bg-brand-600 shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200'
                    }`}
                >
                    <Tablet className="h-3.5 w-3.5" /> Tablet (1024px)
                </button>
                <button
                    type="button"
                    onClick={() => setViewport('mobile')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        viewport === 'mobile'
                            ? 'bg-neutral-800 text-white dark:bg-brand-600 shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200'
                    }`}
                >
                    <Smartphone className="h-3.5 w-3.5" /> Mobile (768px)
                </button>
            </div>

            {/* Right: Modal Actions & Publish */}
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={onOpenTemplates}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center gap-1 text-xs font-semibold"
                    title="Template Gallery"
                >
                    <LayoutTemplate className="h-3.5 w-3.5 text-brand-500" />
                    <span className="hidden lg:inline">Templates</span>
                </button>

                <button
                    type="button"
                    onClick={onOpenPopups}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center gap-1 text-xs font-semibold"
                    title="Interactive Popups"
                >
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="hidden lg:inline">Popups</span>
                </button>

                <button
                    type="button"
                    onClick={onOpenHistory}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center gap-1 text-xs font-semibold"
                    title="Revision History"
                >
                    <History className="h-3.5 w-3.5 text-amber-500" />
                    <span className="hidden lg:inline">History</span>
                </button>

                <button
                    type="button"
                    onClick={onOpenShare}
                    className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center gap-1 text-xs font-semibold"
                    title="Share Funnel"
                >
                    <Share2 className="h-3.5 w-3.5 text-blue-500" />
                    <span className="hidden lg:inline">Share</span>
                </button>

                {activePage && (
                    <a
                        href={route('client.funnels.pages.render', [funnel.uuid, activePage.slug || activePage.id])}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition flex items-center gap-1.5"
                    >
                        <Globe className="h-3.5 w-3.5 text-neutral-500" /> Live Page
                    </a>
                )}

                <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    title="Publish & Save Funnel (Ctrl+S)"
                >
                    {publishing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {publishing ? 'Publishing...' : 'Publish Funnel'}
                </button>
            </div>
        </header>
    );
}

function Globe({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
        </svg>
    );
}
