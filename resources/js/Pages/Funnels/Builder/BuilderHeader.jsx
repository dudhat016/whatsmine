import React from 'react';
import { Link } from '@inertiajs/react';
import {
    ArrowLeft, Eye, Send, CheckCircle, RefreshCw, AlertCircle,
    Monitor, Tablet, Smartphone
} from 'lucide-react';

export default function BuilderHeader({
    funnel,
    activePage,
    viewport,
    setViewport,
    publishing,
    handlePublish,
    syncState,
}) {
    return (
        <header className="h-14 bg-white border-b border-neutral-200 px-4 flex items-center justify-between shrink-0 shadow-xs z-30">
            {/* Left: Back & Title Info */}
            <div className="flex items-center gap-3">
                <Link
                    href={route('client.funnels.index')}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
                    title="Back to Funnels List"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="h-4 w-px bg-neutral-200" />
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="font-bold text-xs text-neutral-900 leading-tight">
                            {funnel.name}
                        </h1>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            funnel.status === 'published' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                            {funnel.status || 'draft'}
                        </span>
                        {/* Auto-Sync Status Indicator */}
                        <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-400">
                            {syncState === 'synced' && (
                                <span className="text-green-600 flex items-center gap-1 font-semibold">
                                    <CheckCircle className="h-3 w-3" /> Real-time Synced
                                </span>
                            )}
                            {syncState === 'saving' && (
                                <span className="text-amber-600 flex items-center gap-1 font-semibold">
                                    <RefreshCw className="h-3 w-3 animate-spin" /> Saving changes...
                                </span>
                            )}
                            {syncState === 'unsaved' && (
                                <span className="text-red-500 flex items-center gap-1 font-semibold">
                                    <AlertCircle className="h-3 w-3" /> Unsaved Changes
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle: Responsive Viewport Switcher */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200 shadow-inner">
                <button
                    type="button"
                    onClick={() => setViewport('desktop')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        viewport === 'desktop'
                            ? 'bg-neutral-800 text-white shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                    }`}
                >
                    <Monitor className="h-3.5 w-3.5" /> Desktop
                </button>
                <button
                    type="button"
                    onClick={() => setViewport('tablet')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        viewport === 'tablet'
                            ? 'bg-neutral-800 text-white shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                    }`}
                >
                    <Tablet className="h-3.5 w-3.5" /> Tablet (1024px)
                </button>
                <button
                    type="button"
                    onClick={() => setViewport('mobile')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        viewport === 'mobile'
                            ? 'bg-neutral-800 text-white shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                    }`}
                >
                    <Smartphone className="h-3.5 w-3.5" /> Mobile (768px)
                </button>
            </div>

            {/* Right: Actions (Live Page & Publish) */}
            <div className="flex items-center gap-2">
                {activePage && (
                    <a
                        href={route('client.funnels.pages.render', [funnel.uuid, activePage.slug || activePage.id])}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition flex items-center gap-1.5"
                    >
                        <Globe className="h-3.5 w-3.5 text-neutral-500" /> Live Page
                    </a>
                )}
                <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
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
