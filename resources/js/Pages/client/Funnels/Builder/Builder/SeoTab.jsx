import React from 'react';
import { Search, Code, Globe } from 'lucide-react';

export default function SeoTab({
    seoSettings,
    handleSeoChange,
    customCode,
    handleCustomCodeChange,
    funnel,
}) {
    return (
        <div className="p-4 space-y-5 text-xs overflow-y-auto">
            {/* ── Meta / SEO ── */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
                    <Search className="h-3.5 w-3.5 text-brand-600" /> SEO & Meta Tags
                </h3>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">
                        Page Title <span className="text-neutral-400 font-normal">(meta title)</span>
                    </label>
                    <input
                        type="text"
                        value={seoSettings.metaTitle}
                        onChange={e => handleSeoChange('metaTitle', e.target.value)}
                        placeholder="My Awesome Sales Page"
                        className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-neutral-400">{(seoSettings.metaTitle || '').length}/60 chars</p>
                </div>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">Meta Description</label>
                    <textarea
                        rows={3}
                        value={seoSettings.metaDescription}
                        onChange={e => handleSeoChange('metaDescription', e.target.value)}
                        placeholder="Describe this page for search engines…"
                        className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                    />
                    <p className="text-[10px] text-neutral-400">{(seoSettings.metaDescription || '').length}/160 chars</p>
                </div>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">OG / Social Share Image URL</label>
                    <input
                        type="url"
                        value={seoSettings.ogImage}
                        onChange={e => handleSeoChange('ogImage', e.target.value)}
                        placeholder="https://yourdomain.com/og-image.jpg"
                        className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    {seoSettings.ogImage && (
                        <img
                            src={seoSettings.ogImage}
                            alt="OG preview"
                            className="mt-1.5 w-full rounded-lg border object-cover h-24"
                            onError={e => e.target.style.display='none'}
                        />
                    )}
                </div>
            </div>

            {/* ── Custom Code ── */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
                    <Code className="h-3.5 w-3.5 text-brand-600" /> Custom Code Injection
                </h3>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">
                        Header Code <span className="text-neutral-400 font-normal">(before &lt;/head&gt;)</span>
                    </label>
                    <textarea
                        rows={4}
                        value={customCode.headerCode}
                        onChange={e => handleCustomCodeChange('headerCode', e.target.value)}
                        placeholder="<!-- Google Analytics, Facebook Pixel, etc. -->"
                        className="w-full rounded-lg border border-neutral-300 p-2 font-mono text-[10px] focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none bg-neutral-50"
                    />
                </div>
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-600">
                        Footer Code <span className="text-neutral-400 font-normal">(before &lt;/body&gt;)</span>
                    </label>
                    <textarea
                        rows={4}
                        value={customCode.footerCode}
                        onChange={e => handleCustomCodeChange('footerCode', e.target.value)}
                        placeholder="<!-- Any custom scripts, chatbots, etc. -->"
                        className="w-full rounded-lg border border-neutral-300 p-2 font-mono text-[10px] focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none bg-neutral-50"
                    />
                </div>
            </div>

            {/* ── SEO Preview ── */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100">
                    <Globe className="h-3.5 w-3.5 text-brand-600" /> Google Preview
                </h3>
                <div className="rounded-xl border border-neutral-200 bg-white p-3 space-y-0.5">
                    <p className="text-[11px] text-green-700 font-medium truncate">
                        {window.location.origin}/f/{funnel.workspace_id}/{funnel.slug}
                    </p>
                    <p className="text-[13px] text-blue-700 font-semibold leading-snug truncate">
                        {seoSettings.metaTitle || funnel.name || 'Page Title'}
                    </p>
                    <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2">
                        {seoSettings.metaDescription || 'Your page meta description will appear here in search results…'}
                    </p>
                </div>
            </div>
        </div>
    );
}
