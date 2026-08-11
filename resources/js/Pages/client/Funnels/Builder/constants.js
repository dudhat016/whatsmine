import {
    Box, Type, Image, MousePointerClick, Sliders, LayoutTemplate, Play, Sparkles, Zap, Star, HelpCircle, AlignLeft, Monitor, Tablet, Smartphone
} from 'lucide-react';

// ─── Viewport Presets ────────────────────────────────────────────────────────
export const VIEWPORTS = [
    { key: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
    { key: 'tablet',  label: 'Tablet',  icon: Tablet,  width: '768px' },
    { key: 'mobile',  label: 'Mobile',  icon: Smartphone, width: '375px' },
];

// ─── Font Options ────────────────────────────────────────────────────────────
export const GOOGLE_FONTS = [
    { label: 'Lora', value: "'Lora', serif" },
    { label: 'Outfit', value: "'Outfit', sans-serif" },
    { label: 'Playfair Display', value: "'Playfair Display', serif" },
    { label: 'Poppins', value: "'Poppins', sans-serif" },
    { label: 'Montserrat', value: "'Montserrat', sans-serif" },
    { label: 'Inter', value: "'Inter', sans-serif" },
    { label: 'Roboto', value: "'Roboto', sans-serif" },
    { label: 'Open Sans', value: "'Open Sans', sans-serif" },
];

export const SYSTEM_FONTS = [
    { label: 'System Default', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif font-sans" },
    { label: 'Monospace', value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
    { label: 'Georgia Serif', value: "Georgia, Cambria, 'Times New Roman', Times, serif" },
];

export const FONT_WEIGHTS = [
    { label: 'Normal 400', value: '400' },
    { label: 'Medium 500', value: '500' },
    { label: 'Semi-bold 600', value: '600' },
    { label: 'Bold 700', value: '700' },
    { label: 'Extra-bold 800', value: '800' },
];

// ─── 1. ELEMENTS (Categorized atomic components including SECTION & COLUMNS) ─────
export const ELEMENT_CATEGORIES = [
    {
        category: 'Sections & Columns',
        icon: Box,
        items: [
            { id: 'el_section', name: 'Layout Section', type: 'section', title: 'Main Page Section', content: 'Main page section container to hold nested columns and elements.', bgColor: '#ffffff', paddingY: 32, paddingX: 24 },
            { id: 'el_col_1', name: '1 Column (Full Width)', type: 'col_1', colsCount: 1 },
            { id: 'el_col_2', name: '2 Columns (50 / 50)', type: 'col_2', colsCount: 2 },
            { id: 'el_col_3', name: '3 Columns (33 / 33 / 33)', type: 'col_3', colsCount: 3 },
            { id: 'el_col_4', name: '4 Columns Grid', type: 'col_4', colsCount: 4 },
            { id: 'el_col_sidebar', name: 'Sidebar Layout (70 / 30)', type: 'col_sidebar', colsCount: 2 }
        ]
    },
    {
        category: 'Text',
        icon: Type,
        items: [
            { id: 'el_headline', name: 'Headline (H1)', type: 'headline', content: 'Main Catchy Headline Title Goes Here', fontSize: 32, lineHeight: 40, fontWeight: '700', alignment: 'left', textColor: '#111827', letterSpacing: 0, visibleDesktop: true, visibleMobile: true },
            { id: 'el_subheadline', name: 'Subheadline (H2)', type: 'subheadline', content: 'Supporting subheadline clarifying the core benefit of your product.', fontSize: 20, lineHeight: 28, fontWeight: '600', alignment: 'left', textColor: '#374151', letterSpacing: 0, visibleDesktop: true, visibleMobile: true },
            { id: 'el_paragraph', name: 'Paragraph Text', type: 'paragraph', content: 'Detailed paragraph text explaining your product features, benefits, and offer details in full clarity.', fontSize: 16, lineHeight: 24, fontWeight: '400', alignment: 'left', textColor: '#4b5563', letterSpacing: 0, visibleDesktop: true, visibleMobile: true },
            { id: 'el_bullets', name: 'Bullet List', type: 'bullets', items: ['100% Automated Workflow', 'Instant Setup & Launch', '24/7 Dedicated Support'], visibleDesktop: true, visibleMobile: true },
            { id: 'el_quote', name: 'Quote Block', type: 'quote', quote: 'This single strategy doubled our conversion rate overnight!', author: 'Mark R., CMO', visibleDesktop: true, visibleMobile: true }
        ]
    },
    {
        category: 'Media',
        icon: Image,
        items: [
            { id: 'el_image', name: 'Single Image', type: 'image', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', alt: 'Feature Showcase', borderRadius: 12, visibleDesktop: true, visibleMobile: true },
            { id: 'el_video', name: 'Video Player', type: 'video', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', visibleDesktop: true, visibleMobile: true },
            { id: 'el_audio', name: 'Audio Player', type: 'audio', title: 'Listen to Podcast Episode #42', visibleDesktop: true, visibleMobile: true },
            { id: 'el_icon_box', name: 'Icon Feature Card', type: 'icon_box', title: 'Lightning Speed', desc: 'Optimized for 95+ PageSpeed performance scores.', visibleDesktop: true, visibleMobile: true }
        ]
    },
    {
        category: 'Form',
        icon: MousePointerClick,
        items: [
            { id: 'el_email', name: 'Email Input Field', type: 'input_email', placeholder: 'Enter your email address...', visibleDesktop: true, visibleMobile: true },
            { id: 'el_name', name: 'Full Name Field', type: 'input_name', placeholder: 'Enter your full name...', visibleDesktop: true, visibleMobile: true },
            { id: 'el_phone', name: 'Phone Number Field', type: 'input_phone', placeholder: 'Enter phone number...', visibleDesktop: true, visibleMobile: true },
            { id: 'el_btn', name: 'CTA Submit Button', type: 'submit_button', text: 'Get Instant Access Now →', bgColor: '#c87a57', textColor: '#ffffff', borderRadius: 12, visibleDesktop: true, visibleMobile: true },
            { id: 'el_checkbox', name: 'Checkbox Consent', type: 'checkbox', text: 'I agree to the Terms of Service and Privacy Policy.', visibleDesktop: true, visibleMobile: true }
        ]
    },
    {
        category: 'Other',
        icon: Sliders,
        items: [
            { id: 'el_divider', name: 'Divider Line', type: 'divider', visibleDesktop: true, visibleMobile: true },
            { id: 'el_spacer', name: 'Vertical Spacer', type: 'spacer', visibleDesktop: true, visibleMobile: true },
            { id: 'el_timer', name: 'Countdown Timer', type: 'timer', hours: 2, minutes: 15, visibleDesktop: true, visibleMobile: true },
            { id: 'el_progress', name: 'Progress Bar', type: 'progress_bar', percent: 80, visibleDesktop: true, visibleMobile: true },
            { id: 'el_social', name: 'Social Share Buttons', type: 'social', visibleDesktop: true, visibleMobile: true }
        ]
    }
];

// ─── 3. ADMIN CREATED BLOCK TEMPLATES ─────────────────────────────────────────
export const ADMIN_BLOCK_TEMPLATES = [
    {
        id: 'hero',
        name: 'Hero Headline & CTA',
        category: 'Header',
        icon: LayoutTemplate,
        badge: 'Popular',
        data: {
            type: 'hero',
            headline: 'Transform Your Business With Our High-Converting Platform',
            subheadline: 'Join over 10,000+ businesses growing faster every day with automated funnels.',
            ctaText: 'Claim Your Free Trial Now',
            ctaSubtext: 'No credit card required · Instant access',
        }
    },
    {
        id: 'vsl',
        name: 'Video Sales Letter (VSL)',
        category: 'Media',
        icon: Play,
        badge: 'High CVR',
        data: {
            type: 'vsl',
            title: 'Watch This 5-Minute Video To Discover The Secret Strategy',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            ctaText: 'Yes! Unlock Full Access Now',
            guaranteeText: '30-Day 100% Money-Back Guarantee',
        }
    },
    {
        id: 'optin',
        name: 'Lead Capture Form',
        category: 'Forms',
        icon: MousePointerClick,
        badge: 'Leads',
        data: {
            type: 'optin',
            title: 'Enter Your Email Below To Get Instant Access',
            buttonText: 'Get Free Access Now →',
            placeholderName: 'Your Full Name',
            placeholderEmail: 'Your Best Email Address',
        }
    },
    {
        id: 'order_bump',
        name: 'Order Bump Box',
        category: 'Checkout',
        icon: Sparkles,
        badge: '+34% Revenue',
        data: {
            type: 'order_bump',
            title: 'ONE TIME OFFER: Add Complete Implementation Checklist for just $17',
            description: 'Check this box to instantly include our step-by-step master checklist in your order today.',
            price: 17,
        }
    },
    {
        id: 'upsell',
        name: '1-Click Upsell Offer',
        category: 'Sales',
        icon: Zap,
        badge: '1-Click',
        data: {
            type: 'upsell',
            headline: 'WAIT! Your Order Is Not Complete...',
            subheadline: 'Add The Masterclass Upgrade To Your Order With 70% Off Today Only!',
            yesButtonText: 'Yes! Add Masterclass For Only $47',
            noButtonText: 'No thanks, I will pass on this special offer.',
            price: 47,
        }
    },
    {
        id: 'testimonials',
        name: 'Social Proof & Reviews',
        category: 'Trust',
        icon: Star,
        data: {
            type: 'testimonials',
            title: 'Loved By Thousands Of Marketers Worldwide',
            reviews: [
                { name: 'Sarah Jenkins', role: 'Agency Owner', text: 'This funnel builder increased our conversion rate by 42% in the first week!' },
                { name: 'Michael Chen', role: 'E-commerce Director', text: 'The 1-click upsells alone added $12,000 in extra revenue last month.' },
            ]
        }
    },
    {
        id: 'faq',
        name: 'Frequently Asked Questions',
        category: 'Content',
        icon: HelpCircle,
        data: {
            type: 'faq',
            title: 'Frequently Asked Questions',
            items: [
                { q: 'How fast can I get my funnel running?', a: 'You can launch in under 10 minutes using our pre-built templates.' },
                { q: 'Is there a money-back guarantee?', a: 'Yes! We offer a full 30-day money-back guarantee with no questions asked.' },
            ]
        }
    },
    {
        id: 'footer',
        name: 'Footer & Legal Links',
        category: 'Footer',
        icon: AlignLeft,
        data: {
            type: 'footer',
            companyName: 'WhatsMine Inc.',
            copyright: '© 2026 WhatsMine. All Rights Reserved.',
            links: ['Privacy Policy', 'Terms of Service', 'Support']
        }
    }
];

export const STATUS_COLORS = {
    draft:     'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    published: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
