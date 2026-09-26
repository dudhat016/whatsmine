import React, { useState } from 'react';
import { X, Sparkles, Check, LayoutTemplate, ArrowRight, Star } from 'lucide-react';

const TEMPLATES = [
    {
        id: 'lead-magnet-v1',
        category: 'Lead Capture',
        title: 'High-Converting Ebook Lead Magnet',
        description: 'Clean squeeze page with hero section, benefit checklist, and 1-field email capture form.',
        previewColor: 'from-emerald-500 to-teal-600',
        rating: 4.9,
        usageCount: '12.4k',
        blocks: [
            {
                id: 'hero-1',
                type: 'hero',
                content: {
                    headline: 'Download The Ultimate WhatsApp Marketing Playbook (2026 Edition)',
                    subheadline: 'Get 50+ proven broadcast templates and automation workflows to 10x your response rate.',
                    ctaText: 'Get Free Instant Access',
                    theme: 'dark',
                },
            },
            {
                id: 'features-1',
                type: 'features',
                content: {
                    title: 'What You Will Learn Inside',
                    items: [
                        'How to bypass spam filters and maintain 99.8% inbox delivery',
                        'The 3-step automated follow-up sequence for abandoned carts',
                        'How to convert cold website leads into loyal WhatsApp subscribers',
                    ],
                },
            },
        ],
    },
    {
        id: 'sales-vsl-v1',
        category: 'Sales & VSL',
        title: 'High-Ticket Consultation VSL Page',
        description: 'Video Sales Letter layout with sticky CTA, testimonial grid, and booking calendar integration.',
        previewColor: 'from-indigo-600 to-violet-700',
        rating: 5.0,
        usageCount: '8.9k',
        blocks: [
            {
                id: 'hero-vsl',
                type: 'hero',
                content: {
                    headline: 'How We Scaled Our SaaS To $100k/Mo Using Automated Conversational Funnels',
                    subheadline: 'Watch this 12-minute breakdown video to see our exact step-by-step strategy.',
                    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    ctaText: 'Book Your Free Strategy Call',
                },
            },
            {
                id: 'testimonials-vsl',
                type: 'testimonials',
                content: {
                    title: 'Trusted By Over 1,500+ Fast-Growing Brands',
                },
            },
        ],
    },
    {
        id: 'webinar-reg-v1',
        category: 'Webinar',
        title: 'Live Masterclass Registration Funnel',
        description: 'Countdown timer, speaker bio section, and double OTP registration form.',
        previewColor: 'from-amber-500 to-orange-600',
        rating: 4.8,
        usageCount: '15.1k',
        blocks: [
            {
                id: 'hero-webinar',
                type: 'hero',
                content: {
                    headline: 'LIVE MASTERCLASS: The Future of Conversational E-commerce',
                    subheadline: 'Reserve your seat now before spots run out.',
                    countdownEnabled: true,
                    ctaText: 'Reserve My Free Seat',
                },
            },
        ],
    },
    {
        id: 'thank-you-v1',
        category: 'Thank You',
        title: 'Order Confirmation & Next Steps',
        description: 'Thank you page with order summary, community join button, and referral link.',
        previewColor: 'from-blue-500 to-cyan-600',
        rating: 4.9,
        usageCount: '20.2k',
        blocks: [
            {
                id: 'hero-ty',
                type: 'hero',
                content: {
                    headline: '🎉 You Are All Set!',
                    subheadline: 'Check your email inbox or WhatsApp for your access confirmation link.',
                    ctaText: 'Join Our VIP Community',
                },
            },
        ],
    },
];

export default function TemplateGalleryModal({ isOpen, onClose, onApplyTemplate }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    if (!isOpen) return null;

    const categories = ['All', 'Lead Capture', 'Sales & VSL', 'Webinar', 'Thank You'];
    const filteredTemplates = selectedCategory === 'All'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === selectedCategory);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl">
                            <LayoutTemplate className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                Template Gallery
                                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 rounded-full">
                                    Pro Templates
                                </span>
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Choose a pre-designed page layout to jumpstart your funnel conversion.
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

                {/* Filter Categories */}
                <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto bg-white dark:bg-neutral-900">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                                selectedCategory === cat
                                    ? 'bg-brand-600 text-white shadow-xs'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Template Grid */}
                <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((tpl) => {
                        const isSelected = selectedTemplate?.id === tpl.id;
                        return (
                            <div
                                key={tpl.id}
                                onClick={() => setSelectedTemplate(tpl)}
                                className={`group relative rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                                    isSelected
                                        ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20 dark:bg-brand-950/20 shadow-md'
                                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md'
                                }`}
                            >
                                <div className="space-y-3">
                                    {/* Thumbnail Placeholder with Gradient */}
                                    <div className={`h-32 rounded-xl bg-gradient-to-br ${tpl.previewColor} p-4 flex flex-col justify-between text-white shadow-xs relative overflow-hidden`}>
                                        <div className="flex items-center justify-between">
                                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-white/20 backdrop-blur-md rounded-md">
                                                {tpl.category}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] font-bold bg-black/20 backdrop-blur-xs px-2 py-0.5 rounded-md">
                                                <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {tpl.rating}
                                            </span>
                                        </div>
                                        <div className="font-bold text-sm line-clamp-1">{tpl.title}</div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-brand-600 transition">
                                            {tpl.title}
                                        </h3>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                                            {tpl.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                                    <span>Used by {tpl.usageCount} funnels</span>
                                    <span className="font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition flex items-center gap-1">
                                        Select Template <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {selectedTemplate ? `Selected: "${selectedTemplate.title}"` : 'Select a template to apply'}
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!selectedTemplate}
                            onClick={() => {
                                if (selectedTemplate) {
                                    onApplyTemplate(selectedTemplate);
                                    onClose();
                                }
                            }}
                            className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Apply Template to Page
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
