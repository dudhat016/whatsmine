import React, { useState } from 'react';
import { Sparkles, LayoutTemplate, ArrowRight, Star } from 'lucide-react';
import { Modal, Button } from '@/Components/ui';

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

    const categories = ['All', 'Lead Capture', 'Sales & VSL', 'Webinar', 'Thank You'];
    const filteredTemplates = selectedCategory === 'All'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === selectedCategory);

    return (
        <Modal
            show={!!isOpen}
            onClose={onClose}
            title="Template Gallery"
            description="Choose a pre-designed page layout to jumpstart your funnel conversion."
            maxWidth="4xl"
        >
            <div className="space-y-4">
                {/* Filter Categories */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-100 dark:border-neutral-800">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
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
                <div className="max-h-[55vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
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
                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {selectedTemplate ? `Selected: "${selectedTemplate.title}"` : 'Select a template to apply'}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={!selectedTemplate}
                            onClick={() => {
                                if (selectedTemplate) {
                                    onApplyTemplate(selectedTemplate);
                                    onClose();
                                }
                            }}
                            icon={Sparkles}
                        >
                            Apply Template to Page
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
