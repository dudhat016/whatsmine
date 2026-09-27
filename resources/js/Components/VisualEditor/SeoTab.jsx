import React, { useState, useMemo } from 'react';
import {
    Search, Code, Globe, Share2, Sparkles, Check, ShieldAlert,
    Smartphone, Monitor, ExternalLink, HelpCircle, CheckCircle2,
    AlertTriangle, XCircle, Copy, Eye, Sliders, MessageCircle, Twitter
} from 'lucide-react';
import { Input } from '@/Components/ui';

export default function SeoTab({
    seoSettings = {},
    handleSeoChange,
    customCode = {},
    handleCustomCodeChange,
    funnel = {},
}) {
    const [previewTab, setPreviewTab] = useState('google_desktop'); // 'google_desktop' | 'google_mobile' | 'facebook' | 'twitter' | 'whatsapp'
    const [copiedPreset, setCopiedPreset] = useState(null);

    // Quick Connect IDs State helpers
    const [pixelId, setPixelId] = useState('');
    const [ga4Id, setGa4Id] = useState('');
    const [tiktokId, setTiktokId] = useState('');

    const scriptPresets = [
        {
            name: 'Meta Pixel',
            code: `<!-- Meta Pixel Code -->\n<script>\n!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;\nn.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,\ndocument,'script','https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', 'YOUR_PIXEL_ID');\nfbq('track', 'PageView');\n</script>`,
        },
        {
            name: 'Google Tag Manager',
            code: `<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\nnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\nj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>`,
        },
        {
            name: 'Google Analytics 4',
            code: `<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-XXXXXXXXXX');\n</script>`,
        },
        {
            name: 'TikTok Pixel',
            code: `<!-- TikTok Pixel Code -->\n<script>\n!function (w, d, t) {\n  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};\n  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);\n  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};\n  ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};\n  ttq.load('YOUR_TIKTOK_PIXEL_ID');\n  ttq.page();\n}(window, document, 'ttq');\n</script>`,
        },
    ];

    const handleInsertPreset = (preset) => {
        const current = customCode.headerCode || '';
        const updated = current ? `${current}\n\n${preset.code}` : preset.code;
        handleCustomCodeChange('headerCode', updated);
        setCopiedPreset(preset.name);
        setTimeout(() => setCopiedPreset(null), 2000);
    };

    const handleConnectPixel = (type) => {
        let snippet = '';
        if (type === 'meta' && pixelId.trim()) {
            snippet = `<!-- Meta Pixel -->\n<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId.trim()}');fbq('track','PageView');</script>`;
            setPixelId('');
        } else if (type === 'ga4' && ga4Id.trim()) {
            snippet = `<!-- Google Analytics 4 -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id.trim()}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id.trim()}');</script>`;
            setGa4Id('');
        } else if (type === 'tiktok' && tiktokId.trim()) {
            snippet = `<!-- TikTok Pixel -->\n<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktokId.trim()}');ttq.page();}(window,document,'ttq');</script>`;
            setTiktokId('');
        }

        if (snippet) {
            const current = customCode.headerCode || '';
            handleCustomCodeChange('headerCode', current ? `${current}\n\n${snippet}` : snippet);
            setCopiedPreset(type);
            setTimeout(() => setCopiedPreset(null), 2000);
        }
    };

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://whatsmine.com';
    const pageUrl = `${siteUrl}/f/${funnel?.workspace_id || 'w'}/${funnel?.slug || 'my-funnel'}`;

    // ─── Real-time SEO Health Checklist & Audit Score ────────────────────────
    const seoAudit = useMemo(() => {
        let score = 0;
        const checks = [];

        const titleLen = (seoSettings.metaTitle || '').trim().length;
        if (titleLen >= 30 && titleLen <= 65) {
            score += 30;
            checks.push({ label: 'Title length is optimal (30-65 chars)', status: 'pass' });
        } else if (titleLen > 0) {
            score += 15;
            checks.push({ label: titleLen < 30 ? 'Title is too short (min 30 chars)' : 'Title may be truncated (max 65 chars)', status: 'warn' });
        } else {
            checks.push({ label: 'Missing meta title tag', status: 'fail' });
        }

        const descLen = (seoSettings.metaDescription || '').trim().length;
        if (descLen >= 70 && descLen <= 160) {
            score += 30;
            checks.push({ label: 'Meta description is ideal (70-160 chars)', status: 'pass' });
        } else if (descLen > 0) {
            score += 15;
            checks.push({ label: descLen < 70 ? 'Description is too short' : 'Description is over 160 chars', status: 'warn' });
        } else {
            checks.push({ label: 'Missing meta description', status: 'fail' });
        }

        if (seoSettings.ogImage && seoSettings.ogImage.startsWith('http')) {
            score += 20;
            checks.push({ label: 'Social OG sharing image attached', status: 'pass' });
        } else {
            checks.push({ label: 'No Social OG preview image configured', status: 'warn' });
        }

        if (seoSettings.noIndex) {
            checks.push({ label: 'Search engines blocked (noindex enabled)', status: 'warn' });
        } else {
            score += 20;
            checks.push({ label: 'Search indexation enabled (SEO Ready)', status: 'pass' });
        }

        return { score, checks };
    }, [seoSettings]);

    return (
        <div className="p-4 space-y-6 text-xs overflow-y-auto">
            {/* ── 0. Live SEO Audit Score Card ── */}
            <div className="p-3.5 rounded-2xl bg-neutral-900 text-white shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${seoAudit.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : seoAudit.score >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold">SEO Health Audit</h4>
                            <p className="text-[10px] text-neutral-400">Search & Social Optimization</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-lg font-black ${seoAudit.score >= 80 ? 'text-emerald-400' : seoAudit.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {seoAudit.score}/100
                        </span>
                    </div>
                </div>

                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${seoAudit.score >= 80 ? 'bg-emerald-500' : seoAudit.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${seoAudit.score}%` }}
                    />
                </div>

                <div className="space-y-1.5 pt-1">
                    {seoAudit.checks.map((chk, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px]">
                            {chk.status === 'pass' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                            {chk.status === 'warn' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                            {chk.status === 'fail' && <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                            <span className={chk.status === 'pass' ? 'text-neutral-300' : chk.status === 'warn' ? 'text-amber-300' : 'text-red-300'}>
                                {chk.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 1. Meta / SEO Configuration ── */}
            <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100 dark:border-neutral-800">
                    <Search className="h-3.5 w-3.5 text-brand-600" /> SEO & Meta Tags
                </h3>

                {/* Meta Title */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                            Page Title <span className="text-neutral-400 font-normal">(meta title)</span>
                        </label>
                        <span className={`text-[10px] font-mono ${(seoSettings.metaTitle || '').length > 60 ? 'text-amber-600 font-bold' : 'text-neutral-400'}`}>
                            {(seoSettings.metaTitle || '').length}/60
                        </span>
                    </div>
                    <Input
                        size="sm"
                        type="text"
                        value={seoSettings.metaTitle || ''}
                        onChange={e => handleSeoChange('metaTitle', e.target.value)}
                        placeholder="My High Converting Sales Funnel"
                        wrapperClassName="w-full"
                    />
                </div>

                {/* Meta Description */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Meta Description</label>
                        <span className={`text-[10px] font-mono ${(seoSettings.metaDescription || '').length > 160 ? 'text-amber-600 font-bold' : 'text-neutral-400'}`}>
                            {(seoSettings.metaDescription || '').length}/160
                        </span>
                    </div>
                    <textarea
                        rows={3}
                        value={seoSettings.metaDescription || ''}
                        onChange={e => handleSeoChange('metaDescription', e.target.value)}
                        placeholder="Discover how our revolutionary system helps you scale effortlessly with automated funnels..."
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                </div>

                {/* OG Social Image */}
                <div className="space-y-1">
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Open Graph Social Image URL</label>
                    <Input
                        size="sm"
                        type="url"
                        value={seoSettings.ogImage || ''}
                        onChange={e => handleSeoChange('ogImage', e.target.value)}
                        placeholder="https://images.unsplash.com/... or https://yourdomain.com/og.jpg"
                        wrapperClassName="w-full"
                    />
                </div>

                {/* Canonical URL & Favicon */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Canonical Tag URL</label>
                        <Input
                            size="sm"
                            type="url"
                            value={seoSettings.canonical || ''}
                            onChange={e => handleSeoChange('canonical', e.target.value)}
                            placeholder={pageUrl}
                            wrapperClassName="w-full"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Favicon URL (.ico/.png)</label>
                        <Input
                            size="sm"
                            type="url"
                            value={seoSettings.favicon || ''}
                            onChange={e => handleSeoChange('favicon', e.target.value)}
                            placeholder="https://.../favicon.png"
                            wrapperClassName="w-full"
                        />
                    </div>
                </div>

                {/* Robots Indexing Toggle (noindex) */}
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <div className="space-y-0.5 pr-3">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 text-xs">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                            Hide from Search Engines (noindex)
                        </span>
                        <p className="text-[10px] text-neutral-500">
                            Enable for upsells, thank-you pages, or private members-only funnels.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!seoSettings.noIndex}
                            onChange={e => handleSeoChange('noIndex', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                </div>
            </div>

            {/* ── 2. Quick Connect Pixel IDs & 3-Location Injection ── */}
            <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-100 dark:border-neutral-800">
                    <Code className="h-3.5 w-3.5 text-brand-600" /> Tracking & Custom Code
                </h3>

                {/* 1-Click Quick Connect ID Inputs */}
                <div className="p-3 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/40 space-y-2.5">
                    <p className="text-[10px] font-bold text-brand-800 dark:text-brand-300 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Quick Connect Pixel IDs:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="flex gap-1.5">
                            <Input
                                size="sm"
                                type="text"
                                value={pixelId}
                                onChange={e => setPixelId(e.target.value)}
                                placeholder="Meta Pixel ID (e.g. 123456789)"
                                className="font-mono"
                                wrapperClassName="flex-1"
                            />
                            <button
                                type="button"
                                onClick={() => handleConnectPixel('meta')}
                                className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-xs shrink-0 transition shadow-2xs"
                            >
                                {copiedPreset === 'meta' ? '✓ Added' : 'Add'}
                            </button>
                        </div>
                        <div className="flex gap-1.5">
                            <Input
                                size="sm"
                                type="text"
                                value={ga4Id}
                                onChange={e => setGa4Id(e.target.value)}
                                placeholder="GA4 ID (e.g. G-XXXXXXXXXX)"
                                className="font-mono"
                                wrapperClassName="flex-1"
                            />
                            <button
                                type="button"
                                onClick={() => handleConnectPixel('ga4')}
                                className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-xs shrink-0 transition shadow-2xs"
                            >
                                {copiedPreset === 'ga4' ? '✓ Added' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 1-Click Preset Badges */}
                <div className="space-y-1.5 bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        Insert Boilerplate Scripts:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {scriptPresets.map(preset => (
                            <button
                                key={preset.name}
                                type="button"
                                onClick={() => handleInsertPreset(preset)}
                                className="px-2 py-1 rounded-md text-[10px] font-bold bg-white dark:bg-neutral-800 hover:bg-brand-50 dark:hover:bg-neutral-700 hover:text-brand-700 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 transition flex items-center gap-1 shadow-2xs"
                            >
                                {copiedPreset === preset.name ? <Check className="h-3 w-3 text-emerald-600" /> : <span>+</span>}
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3-Location Code Injection Fields */}
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                            Header Code <span className="text-neutral-400 font-normal">(injected before &lt;/head&gt;)</span>
                        </label>
                        <textarea
                            rows={4}
                            value={customCode.headerCode || ''}
                            onChange={e => handleCustomCodeChange('headerCode', e.target.value)}
                            placeholder="<!-- Meta Pixel, GA4, Custom Styles -->"
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 p-2 font-mono text-[10px] focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                            Body Start Code <span className="text-neutral-400 font-normal">(injected right after &lt;body&gt; opens)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={customCode.bodyStartCode || ''}
                            onChange={e => handleCustomCodeChange('bodyStartCode', e.target.value)}
                            placeholder="<!-- Google Tag Manager (noscript), Accessibility widgets -->"
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 p-2 font-mono text-[10px] focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block font-semibold text-neutral-700 dark:text-neutral-300">
                            Footer Code <span className="text-neutral-400 font-normal">(injected before &lt;/body&gt;)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={customCode.footerCode || ''}
                            onChange={e => handleCustomCodeChange('footerCode', e.target.value)}
                            placeholder="<!-- Live Chat, Custom JS event trackers -->"
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 p-2 font-mono text-[10px] focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* ── 3. Multi-Platform Live Preview Switcher ── */}
            <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-brand-600" /> Live Search & Social Previews
                    </h3>
                </div>

                {/* Switcher Pills */}
                <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setPreviewTab('google_desktop')}
                        className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                            previewTab === 'google_desktop' ? 'bg-white dark:bg-neutral-900 text-brand-600 shadow-xs' : 'text-neutral-500'
                        }`}
                    >
                        <Monitor className="h-3 w-3" /> Google (PC)
                    </button>
                    <button
                        type="button"
                        onClick={() => setPreviewTab('google_mobile')}
                        className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                            previewTab === 'google_mobile' ? 'bg-white dark:bg-neutral-900 text-brand-600 shadow-xs' : 'text-neutral-500'
                        }`}
                    >
                        <Smartphone className="h-3 w-3" /> Google (Mob)
                    </button>
                    <button
                        type="button"
                        onClick={() => setPreviewTab('facebook')}
                        className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                            previewTab === 'facebook' ? 'bg-white dark:bg-neutral-900 text-blue-600 shadow-xs' : 'text-neutral-500'
                        }`}
                    >
                        <Share2 className="h-3 w-3" /> Facebook
                    </button>
                    <button
                        type="button"
                        onClick={() => setPreviewTab('whatsapp')}
                        className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                            previewTab === 'whatsapp' ? 'bg-white dark:bg-neutral-900 text-emerald-600 shadow-xs' : 'text-neutral-500'
                        }`}
                    >
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                    </button>
                </div>

                {/* Google Desktop Preview */}
                {previewTab === 'google_desktop' && (
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3.5 space-y-1 shadow-2xs">
                        <div className="flex items-center gap-1.5">
                            <div className="h-4 w-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[9px]">🌐</div>
                            <p className="text-[10px] text-neutral-500 truncate font-mono">{pageUrl}</p>
                        </div>
                        <p className="text-[14px] text-blue-700 dark:text-blue-400 font-semibold leading-snug truncate hover:underline cursor-pointer">
                            {seoSettings.metaTitle || funnel?.name || 'Page Title'}
                        </p>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                            {seoSettings.metaDescription || 'Add a compelling meta description to rank higher and attract clicks on search engines...'}
                        </p>
                    </div>
                )}

                {/* Google Mobile Preview */}
                {previewTab === 'google_mobile' && (
                    <div className="rounded-2xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 max-w-[280px] mx-auto space-y-1.5 shadow-md">
                        <div className="flex items-center gap-1.5">
                            <div className="h-3.5 w-3.5 rounded-full bg-neutral-200 text-[8px] flex items-center justify-center">🌐</div>
                            <p className="text-[9px] text-neutral-500 truncate">{pageUrl}</p>
                        </div>
                        <p className="text-[12px] text-blue-700 dark:text-blue-400 font-bold leading-tight line-clamp-2">
                            {seoSettings.metaTitle || funnel?.name || 'Page Title'}
                        </p>
                        <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-snug line-clamp-3">
                            {seoSettings.metaDescription || 'Add a compelling meta description to rank higher on mobile searches...'}
                        </p>
                    </div>
                )}

                {/* Facebook Card Preview */}
                {previewTab === 'facebook' && (
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
                        {seoSettings.ogImage ? (
                            <img
                                src={seoSettings.ogImage}
                                alt="OG preview"
                                className="w-full h-32 object-cover bg-neutral-100 dark:bg-neutral-800"
                                onError={e => e.target.style.display='none'}
                            />
                        ) : (
                            <div className="w-full h-24 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-400 italic">
                                Add OG Image URL above to see Facebook Card
                            </div>
                        )}
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-950 space-y-0.5 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-[9px] uppercase font-bold text-neutral-400 truncate">
                                {(() => { try { return new URL(pageUrl).hostname; } catch { return 'whatsmine.com'; } })()}
                            </p>
                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                {seoSettings.metaTitle || funnel?.name || 'Your Offer Title'}
                            </p>
                            <p className="text-[10px] text-neutral-500 line-clamp-2 leading-tight">
                                {seoSettings.metaDescription || 'Add a description to maximize social clicks.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* WhatsApp Link Card Preview */}
                {previewTab === 'whatsapp' && (
                    <div className="rounded-xl bg-[#0b141a] p-3 text-white max-w-[290px] mx-auto space-y-1.5 shadow-lg">
                        <div className="rounded-lg bg-[#1f2c34] p-2 flex gap-2 items-center">
                            {seoSettings.ogImage ? (
                                <img src={seoSettings.ogImage} alt="wa" className="h-12 w-12 rounded object-cover shrink-0" onError={e => e.target.style.display='none'} />
                            ) : (
                                <div className="h-12 w-12 rounded bg-neutral-700 flex items-center justify-center text-[9px] text-neutral-400 shrink-0">Img</div>
                            )}
                            <div className="overflow-hidden space-y-0.5">
                                <p className="text-[11px] font-bold text-white truncate">{seoSettings.metaTitle || funnel?.name || 'Your Link Title'}</p>
                                <p className="text-[9px] text-neutral-300 line-clamp-2 leading-tight">{seoSettings.metaDescription || 'Description preview...'}</p>
                                <p className="text-[8px] text-neutral-400 truncate">{pageUrl}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
