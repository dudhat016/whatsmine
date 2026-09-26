import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import MediaUpload from '@/Components/MediaUpload';
import { 
    CheckCircle, Sparkles, Send, UploadCloud, FileText, 
    ShieldCheck, Building, Globe, Layers, ArrowRight
} from 'lucide-react';

export default function OnboardingFormView({ onboarding = {} }) {
    const isCompleted = onboarding.status === 'completed';

    const { data, setData, post, processing } = useForm({
        brand_name: onboarding.form_data?.brand_name || '',
        website: onboarding.form_data?.website || '',
        target_audience: onboarding.form_data?.target_audience || '',
        brand_color: onboarding.form_data?.brand_color || '#10b981',
        logo_url: onboarding.files?.[0] || '',
        brief_url: onboarding.files?.[1] || '',
        notes: onboarding.form_data?.notes || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('agency.onboarding.submit', onboarding.uuid));
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-start p-4 md:p-8 font-sans">
            <Head title="Client Onboarding Questionnaire — WhatsMine" />

            {/* Header branding */}
            <div className="max-w-2xl w-full flex items-center justify-between py-4 mb-6 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-base tracking-wider">
                    <Sparkles className="h-5 w-5" /> WhatsMine Onboarding Vault
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                    Invoice Ref: #{onboarding.invoice?.invoice_number || 'PAID'}
                </div>
            </div>

            {/* Main Form Container */}
            <div className="max-w-2xl w-full space-y-6">
                <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-5 shadow-2xl">
                    <div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                            🚀 Project Kickoff Survey
                        </span>
                        <h1 className="text-xl font-black text-white mt-2">
                            Welcome Aboard! Let's Collect Your Brand Assets
                        </h1>
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                            Please provide your business details and upload your brand files so our account team can kick off work immediately.
                        </p>
                    </div>

                    {isCompleted ? (
                        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                            <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
                            <h3 className="text-base font-extrabold text-emerald-400">Onboarding Submitted!</h3>
                            <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                                Thank you! Your brand assets and project brief have been received. Your dedicated Account Manager is reviewing the files.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-neutral-300 mb-1">Company / Brand Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={data.brand_name}
                                    onChange={(e) => setData('brand_name', e.target.value)}
                                    placeholder="Acme Corp"
                                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-neutral-300 mb-1">Website URL</label>
                                    <input
                                        type="url"
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                        placeholder="https://acme.com"
                                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-neutral-300 mb-1">Primary Brand Color</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={data.brand_color}
                                            onChange={(e) => setData('brand_color', e.target.value)}
                                            className="h-8 w-12 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={data.brand_color}
                                            onChange={(e) => setData('brand_color', e.target.value)}
                                            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-neutral-300 mb-1">Target Audience & Ideal Client Profile</label>
                                <textarea
                                    rows={2}
                                    value={data.target_audience}
                                    onChange={(e) => setData('target_audience', e.target.value)}
                                    placeholder="Describe your ideal customers, industry niche, and core offer..."
                                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white"
                                />
                            </div>

                            {/* File uploads */}
                            <div className="space-y-3 pt-3 border-t border-neutral-800">
                                <div>
                                    <label className="block font-bold text-neutral-300 mb-1">Upload Brand Logo (PNG / SVG / Vector)</label>
                                    <MediaUpload
                                        label="Logo Upload"
                                        value={data.logo_url}
                                        onChange={(url) => setData('logo_url', url)}
                                        accept="image/*"
                                        collection="brand_logos"
                                        placeholder="Drag & drop logo file or paste URL..."
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-neutral-300 mb-1">Upload Project Brief / Guideline Document (PDF / ZIP)</label>
                                    <MediaUpload
                                        label="Brief File"
                                        value={data.brief_url}
                                        onChange={(url) => setData('brief_url', url)}
                                        accept=".pdf,.doc,.docx,.zip"
                                        collection="project_briefs"
                                        placeholder="Drag & drop project brief document..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-neutral-300 mb-1">Additional Notes or Login Credentials</label>
                                <textarea
                                    rows={2}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Any specific requests, social handles, or access links..."
                                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                            >
                                Submit Onboarding Assets <ArrowRight className="h-4 w-4" />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
