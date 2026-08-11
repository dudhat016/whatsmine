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
    { label: '100 (Thin)', value: '100' },
    { label: '200 (Extra Light)', value: '200' },
    { label: '300 (Light)', value: '300' },
    { label: '400 (Normal)', value: '400' },
    { label: '500 (Medium)', value: '500' },
    { label: '600 (Semi-bold)', value: '600' },
    { label: '700 (Bold)', value: '700' },
    { label: '800 (Extra-bold)', value: '800' },
    { label: '900 (Black)', value: '900' },
];

export const ELEMENT_CATEGORIES = [
    {
        category: 'Sections & Layout',
        icon: Box,
        items: [
            {
                id: 'el_section',
                name: 'Layout Section',
                type: 'section',
                title: 'Main Page Section',
                layoutMode: 'flex',
                flexDirection: 'column',
            },
            {
                id: 'el_flex_container',
                name: 'Flexbox Container (d-flex)',
                type: 'flex_container',
                layoutMode: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 24,
                paddingY: 16,
                paddingX: 16,
                elements: [],
                mobile: { flexDirection: 'column', paddingX: 12, gap: 16 }
            },
            {
                id: 'el_grid_container',
                name: 'CSS Grid Container',
                type: 'grid_container',
                layoutMode: 'grid',
                gridPreset: 'repeat(2, 1fr)',
                gap: 24,
                paddingY: 16,
                paddingX: 16,
                colsCount: 2,
                columns: [[], [], [], []],
                mobile: { gridPreset: 'repeat(1, 1fr)', gap: 16 }
            }
        ]
    },
    {
        category: 'Text',
        icon: Type,
        items: [
            {
                id: 'el_headline',
                name: 'Headline (H1)',
                type: 'headline',
                headingTag: 'h1',
                content: 'Main Catchy Headline Title Goes Here',
                marginBottom: 12,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_subheadline',
                name: 'Subheadline (H2)',
                type: 'subheadline',
                headingTag: 'h2',
                content: 'Supporting subheadline clarifying the core benefit of your product.',
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_paragraph',
                name: 'Paragraph Text',
                type: 'paragraph',
                content: 'Detailed paragraph text explaining your product features, benefits, and offer details in full clarity.',
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_bullets',
                name: 'Bullet List',
                type: 'bullets',
                items: ['100% Automated Workflow', 'Instant Setup & Launch', '24/7 Dedicated Support'],
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_quote',
                name: 'Quote Block',
                type: 'quote',
                quote: 'This single strategy doubled our conversion rate overnight!',
                author: 'Mark R., CMO',
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_rich_text',
                name: 'Rich Text Block',
                type: 'rich_text',
                htmlContent: '<p>Edit this <strong>Rich Text</strong> content to add <em>formatting</em>, lists, and links.</p>',
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            }
        ]
    },
    {
        category: 'Media',
        icon: Image,
        items: [
            {
                id: 'el_image',
                name: 'Single Image',
                type: 'image',
                url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
                alt: 'Feature Showcase',
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_video',
                name: 'Video Player',
                type: 'video',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_audio',
                name: 'Audio Player',
                type: 'audio',
                title: 'Listen to Podcast Episode #42',
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_icon_box',
                name: 'Icon Feature Card',
                type: 'icon_box',
                title: 'Lightning Speed',
                desc: 'Optimized for 95+ PageSpeed performance scores.',
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            }
        ]
    },
    {
        category: 'Form',
        icon: MousePointerClick,
        items: [
            {
                id: 'el_email',
                name: 'Email Input Field',
                type: 'input_email',
                placeholder: 'Enter your email address...',
                marginBottom: 12,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_name',
                name: 'Full Name Field',
                type: 'input_name',
                placeholder: 'Enter your full name...',
                marginBottom: 12,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_phone',
                name: 'Phone Number Field',
                type: 'input_phone',
                placeholder: 'Enter phone number...',
                marginBottom: 12,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_btn',
                name: 'CTA Submit Button',
                type: 'submit_button',
                text: 'Get Instant Access Now →',
                btnType: 'primary',
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true,
            },
            {
                id: 'el_checkbox',
                name: 'Checkbox Consent',
                type: 'checkbox',
                text: 'I agree to the Terms of Service and Privacy Policy.',
                marginBottom: 12,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_order_bump',
                name: 'Order Bump Offer',
                type: 'order_bump',
                title: 'ONE TIME OFFER: Add Master Implementation Checklist ($17)',
                desc: 'Check this box to instantly add our step-by-step master checklist to your order today.',
                price: 17,
                badgeText: 'YES! ADD THIS',
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            }
        ]
    },
    {
        category: 'Other',
        icon: Sliders,
        items: [
            { id: 'el_star_rating', name: 'Star Rating', type: 'star_rating', stars: 5, ratingText: '5.0 out of 5 stars (1,240+ reviews)', starColor: '#f59e0b', marginBottom: 16, visibleDesktop: true, visibleMobile: true },
            {
                id: 'el_faq_accordion',
                name: 'FAQ Accordion',
                type: 'faq_accordion',
                items: [
                    { q: 'How fast can I get my funnel running?', a: 'You can launch in under 10 minutes using our pre-built templates.' },
                    { q: 'Is there a money-back guarantee?', a: 'Yes! We offer a full 30-day money-back guarantee with no questions asked.' },
                    { q: 'Can I connect a custom domain?', a: 'Absolutely! You can map any custom domain or subdomain in workspace settings.' }
                ],
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_testimonial_slider',
                name: 'Testimonial Slider',
                type: 'testimonial_slider',
                items: [
                    { quote: 'This funnel builder doubled our conversion rate in the first week!', author: 'Sarah Jenkins', role: 'Agency Owner' },
                    { quote: 'The 1-click order bumps added $12,000 in extra revenue last month alone.', author: 'Michael Chen', role: 'E-commerce Lead' }
                ],
                marginBottom: 16,
                visibleDesktop: true,
                visibleMobile: true
            },
            { id: 'el_divider', name: 'Divider Line', type: 'divider', marginBottom: 16, visibleDesktop: true, visibleMobile: true },
            { id: 'el_spacer', name: 'Vertical Spacer', type: 'spacer', paddingY: 20, visibleDesktop: true, visibleMobile: true },
            { id: 'el_timer', name: 'Countdown Timer', type: 'timer', days: 0, hours: 2, minutes: 15, seconds: 0, timerTheme: 'red_urgent', timerAction: 'show_message', expireMessage: 'SPECIAL OFFER HAS EXPIRED!', marginBottom: 16, visibleDesktop: true, visibleMobile: true },
            { id: 'el_progress', name: 'Progress Bar', type: 'progress_bar', percent: 80, marginBottom: 16, visibleDesktop: true, visibleMobile: true },
            { id: 'el_social', name: 'Social Share Buttons', type: 'social', marginBottom: 16, visibleDesktop: true, visibleMobile: true },
            { id: 'el_custom_code', name: 'Custom HTML / Embed', type: 'custom_code', code: '<div style="padding:10px;background:#eef2ff;border-radius:6px;text-align:center;">Custom HTML Embed Code</div>', marginBottom: 16, visibleDesktop: true, visibleMobile: true }
        ]
    }
];

// ─── 3. ADMIN CREATED BLOCK TEMPLATES ─────────────────────────────────────────
// ─── 3. ADMIN CREATED BLOCK TEMPLATES ─────────────────────────────────────────
// Bug 11 Fix: Templates must be valid Section trees composed of standard element types
// (headline, subheadline, paragraph, submit_button, video, input_name, input_email, quote, etc.)
export const ADMIN_BLOCK_TEMPLATES = [
    {
        id: 'hero',
        name: 'Hero Headline & CTA',
        category: 'Header',
        icon: LayoutTemplate,
        badge: 'Popular',
        data: {
            type: 'section',
            name: 'Hero Section',
            paddingY: 48,
            paddingX: 24,
            elements: [
                { type: 'headline', headingTag: 'h1', content: 'Transform Your Business With Our High-Converting Platform', marginBottom: 12 },
                { type: 'subheadline', headingTag: 'h2', content: 'Join over 10,000+ businesses growing faster every day with automated funnels.', marginBottom: 24 },
                { type: 'submit_button', text: 'Claim Your Free Trial Now →', btnType: 'primary', marginBottom: 16 }
            ],
            columns: [[], [], [], []]
        }
    },
    {
        id: 'vsl',
        name: 'Video Sales Letter (VSL)',
        category: 'Media',
        icon: Play,
        badge: 'High CVR',
        data: {
            type: 'section',
            name: 'VSL Section',
            paddingY: 48,
            paddingX: 24,
            elements: [
                { type: 'headline', headingTag: 'h1', content: 'Watch This 5-Minute Video To Discover The Secret Strategy', marginBottom: 20 },
                { type: 'video', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', marginBottom: 24 },
                { type: 'submit_button', text: 'Yes! Unlock Full Access Now →', btnType: 'primary', marginBottom: 12 },
                { type: 'paragraph', content: '🔒 30-Day 100% Money-Back Guarantee · No Risk', marginBottom: 16 }
            ],
            columns: [[], [], [], []]
        }
    },
    {
        id: 'optin',
        name: 'Lead Capture Form',
        category: 'Forms',
        icon: MousePointerClick,
        badge: 'Leads',
        data: {
            type: 'section',
            name: 'Lead Capture Section',
            paddingY: 48,
            paddingX: 24,
            elements: [
                { type: 'headline', headingTag: 'h2', content: 'Enter Your Email Below To Get Instant Access', marginBottom: 16 },
                { type: 'input_name', placeholder: 'Your Full Name...', marginBottom: 12 },
                { type: 'input_email', placeholder: 'Your Best Email Address...', marginBottom: 16 },
                { type: 'submit_button', text: 'Get Free Access Now →', btnType: 'primary', marginBottom: 12 }
            ],
            columns: [[], [], [], []]
        }
    },
    {
        id: 'order_bump',
        name: 'Order Bump Box',
        category: 'Checkout',
        icon: Sparkles,
        badge: '+34% Revenue',
        data: {
            type: 'section',
            name: 'Order Bump Section',
            paddingY: 24,
            paddingX: 24,
            elements: [
                { type: 'checkbox', text: 'ONE TIME OFFER: Add Complete Implementation Checklist for just $17', marginBottom: 8 },
                { type: 'paragraph', content: 'Check this box to instantly include our step-by-step master checklist in your order today.', marginBottom: 12 }
            ],
            columns: [[], [], [], []]
        }
    },
    {
        id: 'upsell',
        name: '1-Click Upsell Offer',
        category: 'Sales',
        icon: Zap,
        badge: '1-Click',
        data: {
            type: 'section',
            name: '1-Click Upsell Section',
            paddingY: 48,
            paddingX: 24,
            elements: [
                { type: 'headline', headingTag: 'h1', content: 'WAIT! Your Order Is Not Complete...', marginBottom: 12 },
                { type: 'subheadline', headingTag: 'h2', content: 'Add The Masterclass Upgrade To Your Order With 70% Off Today Only!', marginBottom: 24 },
                { type: 'submit_button', text: 'Yes! Add Masterclass For Only $47 →', btnType: 'primary', marginBottom: 12 },
                { type: 'paragraph', content: 'No thanks, I will pass on this special offer.', marginBottom: 16 }
            ],
            columns: [[], [], [], []]
        }
    },
    {
        id: 'testimonials',
        name: 'Social Proof & Reviews',
        category: 'Trust',
        icon: Star,
        data: {
            type: 'section',
            name: 'Testimonials Section',
            paddingY: 48,
            paddingX: 24,
            elements: [
                { type: 'headline', headingTag: 'h2', content: 'Loved By Thousands Of Marketers Worldwide', marginBottom: 24 },
                { type: 'quote', quote: 'This funnel builder doubled our conversion rate in the first week!', author: 'Sarah Jenkins, Agency Owner', marginBottom: 16 },
                { type: 'quote', quote: 'The 1-click upsells alone added $12,000 in extra revenue last month.', author: 'Michael Chen, E-commerce Director', marginBottom: 16 }
            ],
            columns: [[], [], [], []]
        }
    },
    {
        id: 'faq',
        name: 'Frequently Asked Questions',
        category: 'Content',
        icon: HelpCircle,
        data: {
            type: 'section',
            name: 'FAQ Section',
            paddingY: 48,
            paddingX: 24,
            elements: [
                { type: 'headline', headingTag: 'h2', content: 'Frequently Asked Questions', marginBottom: 24 },
                { type: 'subheadline', headingTag: 'h3', content: 'How fast can I get my funnel running?', marginBottom: 4 },
                { type: 'paragraph', content: 'You can launch in under 10 minutes using our pre-built templates.', marginBottom: 16 },
                { type: 'subheadline', headingTag: 'h3', content: 'Is there a money-back guarantee?', marginBottom: 4 },
                { type: 'paragraph', content: 'Yes! We offer a full 30-day money-back guarantee with no questions asked.', marginBottom: 16 }
            ],
            columns: [[], [], [], []]
        }
    },
    {
        id: 'footer',
        name: 'Footer & Legal Links',
        category: 'Footer',
        icon: AlignLeft,
        data: {
            type: 'section',
            name: 'Footer Section',
            paddingY: 32,
            paddingX: 24,
            elements: [
                { type: 'divider', marginBottom: 16 },
                { type: 'paragraph', content: '© 2026 WhatsMine Inc. All Rights Reserved. · Privacy Policy · Terms of Service · Support', marginBottom: 12 }
            ],
            columns: [[], [], [], []]
        }
    }
];

export const STATUS_COLORS = {
    draft:     'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    published: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
