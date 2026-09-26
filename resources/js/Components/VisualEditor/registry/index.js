import {
    Box, Type, Image, MousePointerClick, Sliders, LayoutTemplate, Play, 
    Sparkles, Zap, Star, HelpCircle, AlignLeft, Monitor, Tablet, Smartphone,
    ShoppingBag, CreditCard, Tag, CheckSquare, Calendar, Phone, AtSign,
    User, Upload, PenTool, Layers, Clock, List, Share2, Code, ShieldCheck,
    FolderTree, DollarSign, Award, Grid, Columns
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

export const STATUS_COLORS = {
    draft: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
    published: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    archived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

export const CONTAINER_TYPES = ['section', 'flex_container', 'grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'];

// ─── Universal Element Categories Registry ──────────────────────────────────
export const ELEMENT_CATEGORIES = [
    {
        category: 'Sections & Layout',
        icon: Box,
        items: [
            {
                id: 'el_section',
                name: 'Full Section',
                type: 'section',
                title: 'Main Page Section',
                htmlTag: 'section',
                elements: []
            },
            {
                id: 'el_grid_container',
                name: 'Grid / Row',
                type: 'grid_container',
                title: 'Layout Row',
                colsCount: 2,
                columnRatio: '50-50',
                columns: [[], []],
                columnStyles: [{}, {}],
                elements: [],
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_divider',
                name: 'Divider Line',
                type: 'divider',
                dividerType: 'horizontal',
                dividerWidth: 100,
                dividerWidthUnit: '%',
                dividerHeight: 60,
                dividerHeightUnit: 'px',
                alignment: 'center',
                visibleDesktop: true,
                visibleMobile: true
            }
        ]
    },
    {
        category: 'Typography & Core',
        icon: Type,
        items: [
            {
                id: 'el_headline',
                name: 'Heading',
                type: 'headline',
                headingTag: 'h1',
                content: 'Main Catchy Heading Title Goes Here',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_paragraph',
                name: 'Paragraph Text',
                type: 'paragraph',
                content: 'Detailed paragraph text explaining your product features, benefits, and offer details in full clarity.',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_bullets',
                name: 'Bullet List',
                type: 'bullets',
                items: ['100% Automated Workflow', 'Instant Setup & Launch', '24/7 Dedicated Support'],
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_quote',
                name: 'Quote Block',
                type: 'quote',
                quote: 'This single strategy doubled our conversion rate overnight!',
                author: 'Mark R., CMO',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_rich_text',
                name: 'Rich Text Block',
                type: 'rich_text',
                htmlContent: '<p>Edit this <strong>Rich Text</strong> content to add <em>formatting</em>, lists, and links.</p>',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_btn',
                name: 'Action Button / CTA',
                type: 'submit_button',
                text: 'Get Instant Access Now →',
                btnType: 'primary',
                buttonAction: 'submit_or_next',
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
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_video',
                name: 'Video Player',
                type: 'video',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_audio',
                name: 'Audio Player / Podcast',
                type: 'audio',
                title: 'Listen to Podcast Episode #42',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_icon_box',
                name: 'Icon Feature Card',
                type: 'icon_box',
                title: 'Lightning Speed',
                desc: 'Optimized for 95+ PageSpeed performance scores.',
                iconName: 'Zap',
                visibleDesktop: true,
                visibleMobile: true
            }
        ]
    },
    {
        category: 'Lead Capture & Forms',
        icon: MousePointerClick,
        items: [
            {
                id: 'el_email',
                name: 'Email Address Field',
                type: 'input_email',
                label: 'Email Address',
                placeholder: 'Enter your email address...',
                required: true,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_name',
                name: 'Full Name Field',
                type: 'input_name',
                label: 'Full Name',
                placeholder: 'Enter your full name...',
                required: true,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_phone',
                name: 'Phone Number (E.164)',
                type: 'input_phone',
                label: 'Phone Number',
                placeholder: 'Enter mobile phone...',
                required: false,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_datepicker',
                name: 'Appointment / Date Picker',
                type: 'datepicker',
                label: 'Select Date & Time',
                placeholder: 'Choose booking date...',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_checkbox',
                name: 'Checkbox Consent (GDPR)',
                type: 'checkbox',
                text: 'I agree to the Terms of Service and Privacy Policy.',
                required: true,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_signature',
                name: 'Digital Signature Pad',
                type: 'signature',
                label: 'Sign Agreement Below',
                visibleDesktop: true,
                visibleMobile: true
            }
        ]
    },
    {
        category: 'Sales & Checkout (GHL)',
        icon: ShoppingBag,
        items: [
            {
                id: 'el_two_step_order',
                name: '2-Step Smart Checkout',
                type: 'two_step_order',
                step1Title: 'Step 1: Contact & Shipping Info',
                step1Subtitle: 'Where should we send your receipt and access?',
                step1BtnText: 'Proceed to Step 2: Payment →',
                step2Title: 'Step 2: Select Offer & Payment',
                step2Subtitle: 'Fast & Encrypted 256-bit SSL Checkout',
                step2BtnText: 'Complete Secure Order Now 🔒',
                showPhone: true,
                showAddress: true,
                showCity: true,
                showZip: true,
                products: [
                    { id: 'prod_1', name: 'Starter Lifetime License', price: 47, desc: 'Instant access + all basic templates', defaultSelected: true },
                    { id: 'prod_2', name: 'Pro Agency Master Bundle', price: 97, desc: 'Includes client seats, commercial license & priority support', defaultSelected: false }
                ],
                hasOrderBump: true,
                bumpTitle: 'ONE TIME OFFER: Add High-Converting Template Pack ($19)',
                bumpDesc: 'Check this box to instantly add 20+ tested multi-step funnel templates to your account today.',
                bumpPrice: 19,
                bumpBadge: '70% OFF SPECIAL',
                paymentGateways: ['stripe', 'paypal', 'cod'],
                guaranteeBadge: '30-Day 100% Risk-Free Money-Back Guarantee',
                boxBgColor: '#ffffff',
                boxBorderColor: '#e5e7eb',
                boxBorderWidth: 1,
                boxBorderStyle: 'solid',
                boxBorderRadius: 16,
                tabActiveBgColor: '#4f46e5',
                tabActiveTextColor: '#ffffff',
                tabInactiveBgColor: '#f9fafb',
                tabInactiveTextColor: '#6b7280',
                inputBgColor: '#ffffff',
                inputBorderColor: '#d1d5db',
                inputFocusBorderColor: '#4f46e5',
                inputTextColor: '#111827',
                inputBorderRadius: 8,
                summaryBgColor: '#f8fafc',
                summaryBorderColor: '#e2e8f0',
                btnBgColor: '#10b981',
                btnTextColor: '#ffffff',
                btnBorderRadius: 10,
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_order_bump',
                name: '1-Click Order Bump',
                type: 'order_bump',
                title: 'ONE TIME OFFER: Add Master Implementation Checklist ($17)',
                desc: 'Check this box to instantly add our step-by-step master checklist to your order today.',
                price: 17,
                badgeText: 'YES! ADD THIS',
                boxBgColor: '#fffbeb',
                boxBorderColor: '#f59e0b',
                boxBorderWidth: 2,
                boxBorderStyle: 'dashed',
                boxBorderRadius: 12,
                bumpBadgeBgColor: '#f59e0b',
                bumpBadgeTextColor: '#ffffff',
                bumpPriceColor: '#b45309',
                titleColor: '#92400e',
                descColor: '#78350f',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_upsell_box',
                name: '1-Click Upsell / OTO Offer Box',
                type: 'upsell_box',
                productName: 'Exclusive VIP Accelerator Pack',
                productPrice: 47,
                regularPrice: 197,
                offerHeadline: 'WAIT! Complete Your System With This Exclusive One-Time Offer',
                offerSubheadline: 'Save 75% on our VIP Accelerator training and fast-track your results.',
                urgencyText: '⚡ This one-time discounted offer is only available on this page right now.',
                acceptBtnText: 'YES! Add This to My Order for Only $47 →',
                declineBtnText: 'No thanks, I will pass on this special offer and proceed to final step',
                boxBgColor: '#ffffff',
                boxBorderColor: '#6366f1',
                boxBorderWidth: 2,
                boxBorderStyle: 'solid',
                boxBorderRadius: 16,
                badgeBgColor: '#fee2e2',
                badgeTextColor: '#dc2626',
                headlineColor: '#111827',
                subheadlineColor: '#4b5563',
                calloutBgColor: '#f8fafc',
                calloutBorderColor: '#e2e8f0',
                priceColor: '#16a34a',
                acceptBtnBgColor: '#16a34a',
                acceptBtnTextColor: '#ffffff',
                acceptBtnBorderRadius: 10,
                declineTextColor: '#9ca3af',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_pricing_table',
                name: 'Pricing Tier Table',
                type: 'pricing_table',
                plans: [
                    { name: 'Starter', price: '29', period: '/mo', features: ['1 Funnel', '1,000 Visitors', 'Standard Support'], btnText: 'Choose Starter' },
                    { name: 'Growth', price: '79', period: '/mo', features: ['Unlimited Funnels', '50,000 Visitors', 'Order Bumps & Upsells', 'Priority Support'], isFeatured: true, btnText: 'Choose Growth' },
                    { name: 'Agency', price: '199', period: '/mo', features: ['Unlimited Everything', 'Custom Domains', 'Client Sub-accounts', 'Dedicated Manager'], btnText: 'Choose Agency' }
                ],
                cardBgColor: '#ffffff',
                cardBorderColor: '#e5e7eb',
                cardBorderWidth: 1,
                cardBorderStyle: 'solid',
                cardBorderRadius: 16,
                featuredCardBgColor: '#ffffff',
                featuredCardBorderColor: '#4f46e5',
                featuredBadgeBgColor: '#4f46e5',
                featuredBadgeTextColor: '#ffffff',
                planTitleColor: '#111827',
                priceColor: '#111827',
                btnBgColor: '#4f46e5',
                btnTextColor: '#ffffff',
                btnBorderRadius: 10,
                visibleDesktop: true,
                visibleMobile: true
            }
        ]
    },
    {
        category: 'Social Proof & Interactive',
        icon: Sliders,
        items: [
            {
                id: 'el_star_rating',
                name: 'Star Rating & Reviews Count',
                type: 'star_rating',
                stars: 5,
                ratingText: '5.0 out of 5 stars (1,240+ verified reviews)',
                starColor: '#f59e0b',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_faq_accordion',
                name: 'FAQ Collapsible Accordion',
                type: 'faq_accordion',
                items: [
                    { q: 'How fast can I get my funnel running?', a: 'You can launch in under 10 minutes using our pre-built templates.' },
                    { q: 'Is there a money-back guarantee?', a: 'Yes! We offer a full 30-day money-back guarantee with no questions asked.' },
                    { q: 'Can I connect a custom domain?', a: 'Absolutely! You can map any custom domain or subdomain in workspace settings.' }
                ],
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_testimonial_slider',
                name: 'Testimonials Carousel',
                type: 'testimonial_slider',
                items: [
                    { quote: 'This visual builder doubled our conversion rate in the first week!', author: 'Sarah Jenkins', role: 'Agency Founder' },
                    { quote: 'The 1-click order bumps added $12,000 in extra revenue last month alone.', author: 'Michael Chen', role: 'E-commerce Growth Lead' }
                ],
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_timer',
                name: 'Urgency Countdown Timer',
                type: 'timer',
                days: 0,
                hours: 2,
                minutes: 15,
                seconds: 0,
                timerTheme: 'red_urgent',
                timerAction: 'show_message',
                expireMessage: 'SPECIAL OFFER HAS EXPIRED!',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_progress',
                name: 'Progress Bar Indicator',
                type: 'progress_bar',
                percent: 80,
                label: 'Step 1 of 2 Completed (80%)',
                barColor: '#10b981',
                visibleDesktop: true,
                visibleMobile: true
            },
            {
                id: 'el_custom_code',
                name: 'Custom HTML / Embed Code',
                type: 'custom_code',
                code: '<div style="padding:12px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;text-align:center;font-size:13px;color:#64748b;">Custom Embed Widget</div>',
                visibleDesktop: true,
                visibleMobile: true
            }
        ]
    }
];

// ─── Admin Pre-built Section Block Templates ────────────────────────────────
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
                { type: 'headline', headingTag: 'h2', content: 'Join over 10,000+ businesses growing faster every day with automated funnels.', marginBottom: 24 },
                { type: 'submit_button', text: 'Claim Your Free Trial Now →', btnType: 'primary', marginBottom: 16 }
            ]
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
            ]
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
            ]
        }
    },
    {
        id: 'two_step_checkout_block',
        name: '2-Step Order Form & Bump Block',
        category: 'Checkout',
        icon: ShoppingBag,
        badge: 'Monetize',
        data: {
            type: 'section',
            name: '2-Step Checkout Section',
            paddingY: 36,
            paddingX: 24,
            elements: [
                {
                    type: 'two_step_order',
                    step1Title: 'Step 1: Contact & Delivery Details',
                    step1Subtitle: 'Enter where your receipt and access credentials should be sent',
                    step1BtnText: 'Proceed to Payment →',
                    step2Title: 'Step 2: Choose Payment Option',
                    step2Subtitle: 'Encrypted & Guaranteed Secure Checkout',
                    step2BtnText: 'Complete Secure Order 🔒',
                    hasOrderBump: true,
                    bumpTitle: 'ONE TIME OFFER: Add Master Template Pack ($19)',
                    bumpDesc: 'Get our battle-tested collection of high-converting funnel templates.',
                    bumpPrice: 19,
                    bumpBadge: '70% OFF',
                    marginBottom: 20
                }
            ]
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
                {
                    type: 'upsell_box',
                    productName: 'VIP Coaching & Template Accelerator',
                    productPrice: 47,
                    regularPrice: 197,
                    offerHeadline: 'WAIT! Special One-Time Offer Before You Go',
                    offerSubheadline: 'Fast-track your results with our private coaching sessions & bonus packs.',
                    urgencyText: '⚡ This exclusive 75% discount is only available on this page.',
                    acceptBtnText: 'YES! Add To My Order For Only $47 →',
                    declineBtnText: 'No thanks, I will pass on this special offer',
                    marginBottom: 20
                }
            ]
        }
    },
    {
        id: 'faq',
        name: 'FAQ Accordion Block',
        category: 'Support',
        icon: HelpCircle,
        data: {
            type: 'section',
            name: 'FAQ Section',
            paddingY: 48,
            paddingX: 24,
            elements: [
                { type: 'headline', headingTag: 'h2', content: 'Frequently Asked Questions', marginBottom: 24 },
                {
                    type: 'faq_accordion',
                    items: [
                        { q: 'How do I access my purchase?', a: 'You will receive immediate login instructions via email and WhatsApp upon checkout.' },
                        { q: 'Is there a refund policy?', a: 'Yes, we provide an unconditional 30-day money-back guarantee.' }
                    ],
                    marginBottom: 16
                }
            ]
        }
    }
];

// Helper to find an element schema from type
export function getElementDefinition(type) {
    for (const group of ELEMENT_CATEGORIES) {
        const found = group.items.find(item => item.type === type);
        if (found) return found;
    }
    return null;
}

// ─── Step-Aware Element Recommendations & Health Verification ────────────────
export const STEP_RECOMMENDED_ELEMENT_TYPES = {
    optin: {
        badge: 'Lead Magnet',
        types: ['input_email', 'input_name', 'input_phone', 'submit_button', 'checkbox'],
        requiredType: 'input_email',
        requiredLabel: 'Email Lead Form',
        warningMsg: 'No email field detected. Add an Email Input or Form to capture leads.'
    },
    contact_us: {
        badge: 'Inquiry Form',
        types: ['input_name', 'input_email', 'input_phone', 'submit_button'],
        requiredType: 'input_email',
        requiredLabel: 'Contact Email Field',
        warningMsg: 'No email field detected. Add an Email Field so visitors can contact you.'
    },
    booking: {
        badge: 'Calendar Appointment',
        types: ['datepicker', 'input_name', 'input_email', 'submit_button'],
        requiredType: 'datepicker',
        requiredLabel: 'Appointment / Date Picker',
        warningMsg: 'No calendar found. Add a Date & Time Picker so visitors can schedule meetings.'
    },
    checkout: {
        badge: 'Checkout Form',
        types: ['two_step_order', 'order_bump', 'submit_button', 'checkbox'],
        requiredType: 'two_step_order',
        requiredLabel: '2-Step Smart Checkout',
        warningMsg: 'No checkout element found. Add a 2-Step Checkout to process orders.'
    },
    order_bump: {
        badge: 'Offer Add-on',
        types: ['order_bump', 'two_step_order', 'submit_button'],
        requiredType: 'order_bump',
        requiredLabel: 'Order Bump Box',
        warningMsg: 'No Order Bump box detected. Add an Order Bump element.'
    },
    upsell: {
        badge: '1-Click OTO',
        types: ['upsell_box', 'video', 'timer', 'submit_button'],
        requiredType: 'upsell_box',
        requiredLabel: '1-Click Upsell Box',
        warningMsg: 'No upsell box detected. Add a 1-Click Upsell Box to pitch your offer.'
    },
    downsell: {
        badge: 'Discount Offer',
        types: ['upsell_box', 'video', 'timer', 'submit_button'],
        requiredType: 'upsell_box',
        requiredLabel: 'Downsell Box',
        warningMsg: 'No offer box detected. Add a Downsell Box with the discounted price.'
    },
    sales: {
        badge: 'Sales & CTA',
        types: ['headline', 'video', 'submit_button', 'faq_accordion', 'two_step_order'],
        requiredType: 'submit_button',
        requiredLabel: 'Call to Action Button',
        warningMsg: 'No call-to-action button found. Add a Button linking to checkout.'
    },
    webinar_registration: {
        badge: 'Webinar Reg',
        types: ['input_email', 'input_name', 'timer', 'video', 'submit_button'],
        requiredType: 'input_email',
        requiredLabel: 'Registration Form',
        warningMsg: 'No email field detected. Add an Email field for webinar registrations.'
    },
    webinar_broadcast: {
        badge: 'Live Room',
        types: ['video', 'submit_button', 'faq_accordion'],
        requiredType: 'video',
        requiredLabel: 'Webinar Video Stream',
        warningMsg: 'No video stream detected. Add a Video Player element.'
    },
    thank_you: {
        badge: 'Confirmation',
        types: ['headline', 'bullets', 'icon_box', 'submit_button'],
        requiredType: 'headline',
        requiredLabel: 'Confirmation Message',
        warningMsg: 'Add an order confirmation message and next steps.'
    },
    optin_thank_you: {
        badge: 'Confirmation',
        types: ['headline', 'bullets', 'icon_box', 'submit_button'],
        requiredType: 'headline',
        requiredLabel: 'Confirmation Message',
        warningMsg: 'Add a confirmation message and download instructions.'
    },
};

/**
 * Returns element schema definitions recommended for a given funnel step.
 */
export function getRecommendedElementsForStep(stepType) {
    const config = STEP_RECOMMENDED_ELEMENT_TYPES[stepType];
    if (!config) return [];
    
    const matched = [];
    for (const type of config.types) {
        const def = getElementDefinition(type);
        if (def && !matched.some(m => m.type === def.type)) {
            matched.push({
                ...def,
                isRecommended: true,
                badge: config.badge,
            });
        }
    }
    return matched;
}

/**
 * Recursively scans canvas sections to verify if the active step has its required conversion element.
 */
export function checkStepReadiness(stepType, sections = []) {
    const config = STEP_RECOMMENDED_ELEMENT_TYPES[stepType];
    if (!config) return { isReady: true, label: 'Standard Step' };

    const presentTypes = new Set();
    const traverse = (items) => {
        if (!Array.isArray(items)) return;
        for (const it of items) {
            if (it && it.type) presentTypes.add(it.type);
            if (it.elements) traverse(it.elements);
            if (it.columns) {
                for (const col of it.columns) {
                    if (Array.isArray(col)) traverse(col);
                }
            }
        }
    };
    traverse(sections);

    const hasRequired = presentTypes.has(config.requiredType);
    return {
        isReady: hasRequired,
        requiredType: config.requiredType,
        requiredLabel: config.requiredLabel,
        warningMsg: config.warningMsg,
        badge: config.badge,
        quickAddElement: getElementDefinition(config.requiredType),
    };
}

// ─── Step Contextual Filtering Rules ─────────────────────────────────────────
// Controls which elements and admin block templates are relevant for each funnel step type.
export const STEP_FILTER_RULES = {
    optin: {
        label: 'Lead Magnet / Opt-in',
        excludedElements: ['two_step_order', 'order_bump', 'upsell_box', 'pricing_table', 'signature'],
        excludedAdminBlocks: ['two_step_checkout_block', 'upsell'],
    },
    sales: {
        label: 'Sales Page',
        excludedElements: ['upsell_box', 'order_bump'],
        excludedAdminBlocks: ['upsell'],
    },
    checkout: {
        label: 'Checkout Page',
        excludedElements: ['upsell_box'],
        excludedAdminBlocks: ['upsell'],
    },
    order_bump: {
        label: 'Order Bump',
        excludedElements: ['upsell_box'],
        excludedAdminBlocks: ['upsell'],
    },
    upsell: {
        label: '1-Click Upsell',
        excludedElements: ['two_step_order', 'order_bump', 'pricing_table', 'input_email', 'input_name', 'input_phone', 'datepicker', 'signature', 'checkbox'],
        excludedAdminBlocks: ['two_step_checkout_block', 'optin'],
    },
    downsell: {
        label: 'Downsell Offer',
        excludedElements: ['two_step_order', 'order_bump', 'pricing_table', 'input_email', 'input_name', 'input_phone', 'datepicker', 'signature', 'checkbox'],
        excludedAdminBlocks: ['two_step_checkout_block', 'optin'],
    },
    thank_you: {
        label: 'Thank You / Download',
        excludedElements: ['two_step_order', 'order_bump', 'upsell_box', 'pricing_table', 'input_email', 'input_name', 'input_phone', 'datepicker', 'signature', 'checkbox'],
        excludedAdminBlocks: ['two_step_checkout_block', 'upsell', 'optin'],
    },
    optin_thank_you: {
        label: 'Thank You / Confirmation',
        excludedElements: ['two_step_order', 'order_bump', 'upsell_box', 'pricing_table', 'input_email', 'input_name', 'input_phone', 'datepicker', 'signature', 'checkbox'],
        excludedAdminBlocks: ['two_step_checkout_block', 'upsell', 'optin'],
    },
    webinar_registration: {
        label: 'Webinar Registration',
        excludedElements: ['two_step_order', 'order_bump', 'upsell_box', 'pricing_table', 'signature'],
        excludedAdminBlocks: ['two_step_checkout_block', 'upsell'],
    },
    webinar_broadcast: {
        label: 'Webinar Broadcast',
        excludedElements: ['two_step_order', 'order_bump', 'upsell_box', 'pricing_table', 'signature', 'input_email', 'input_name', 'input_phone', 'datepicker', 'checkbox'],
        excludedAdminBlocks: ['two_step_checkout_block', 'upsell', 'optin'],
    },
    contact_us: {
        label: 'Contact Us',
        excludedElements: ['two_step_order', 'order_bump', 'upsell_box', 'pricing_table'],
        excludedAdminBlocks: ['two_step_checkout_block', 'upsell'],
    },
    booking: {
        label: 'Appointment Booking',
        excludedElements: ['two_step_order', 'order_bump', 'upsell_box', 'pricing_table', 'signature'],
        excludedAdminBlocks: ['two_step_checkout_block', 'upsell'],
    },
    content: {
        label: 'Content Page',
        excludedElements: ['two_step_order', 'order_bump', 'upsell_box', 'signature'],
        excludedAdminBlocks: ['two_step_checkout_block', 'upsell'],
    },
};

export function normalizeStepType(type) {
    if (!type) return '';
    const t = String(type).toLowerCase().trim();
    if (t === 'thankyou' || t === 'thank-you') return 'thank_you';
    if (t === 'webinar') return 'webinar_registration';
    if (t === 'lead_magnet' || t === 'leadmagnet' || t === 'squeeze') return 'optin';
    return t;
}

export function isElementCompatibleWithStep(elementType, stepType) {
    if (!stepType) return true;
    const norm = normalizeStepType(stepType);
    const rule = STEP_FILTER_RULES[norm];
    if (!rule || !rule.excludedElements) return true;
    return !rule.excludedElements.includes(elementType);
}

export function isAdminBlockCompatibleWithStep(blockId, stepType) {
    if (!stepType) return true;
    const norm = normalizeStepType(stepType);
    const rule = STEP_FILTER_RULES[norm];
    if (!rule || !rule.excludedAdminBlocks) return true;
    return !rule.excludedAdminBlocks.includes(blockId);
}

export function getStepFilterRule(stepType) {
    if (!stepType) return null;
    const norm = normalizeStepType(stepType);
    return STEP_FILTER_RULES[norm] || null;
}


