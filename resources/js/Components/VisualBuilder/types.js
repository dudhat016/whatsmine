import {
    AlignLeft,
    CheckSquare,
    ChevronDown,
    Columns,
    FileText,
    FormInput,
    Heading,
    HelpCircle,
    Image as ImageIcon,
    Key,
    Mail,
    Minus,
    MousePointerClick,
    Phone,
    PlusCircle,
    ShoppingBag,
    Sparkles,
    StretchVertical,
    Tag,
    Type,
    Video,
} from 'lucide-react';

export function uid() {
    return Math.random().toString(36).slice(2, 9);
}

// ─── Block Types for Email Mode ───────────────────────────────────────────────
export const EMAIL_BLOCKS = [
    { type: 'heading', label: 'Heading', icon: Heading, category: 'content' },
    { type: 'paragraph', label: 'Text', icon: Type, category: 'content' },
    { type: 'button', label: 'Button', icon: MousePointerClick, category: 'content' },
    { type: 'image', label: 'Image', icon: ImageIcon, category: 'media' },
    { type: 'divider', label: 'Divider', icon: Minus, category: 'layout' },
    { type: 'spacer', label: 'Spacer', icon: StretchVertical, category: 'layout' },
];

// ─── Block Types for Funnel Mode ──────────────────────────────────────────────
export const FUNNEL_BLOCKS = [
    { type: 'heading', label: 'Headline', icon: Heading, category: 'typography' },
    { type: 'paragraph', label: 'Paragraph', icon: Type, category: 'typography' },
    { type: 'button', label: 'Action Button', icon: MousePointerClick, category: 'conversion' },
    { type: 'image', label: 'Image', icon: ImageIcon, category: 'media' },
    { type: 'video', label: 'Video Embed', icon: Video, category: 'media' },
    { type: 'pricing_card', label: 'Pricing Card', icon: Tag, category: 'conversion' },
    { type: 'order_bump', label: 'Order Bump', icon: PlusCircle, category: 'conversion' },
    { type: 'faq_accordion', label: 'FAQ Accordion', icon: HelpCircle, category: 'content' },
    { type: 'divider', label: 'Divider', icon: Minus, category: 'layout' },
    { type: 'spacer', label: 'Spacer', icon: StretchVertical, category: 'layout' },
];

// ─── Block Types for Subscription Form Mode ──────────────────────────────────
export const FORM_BLOCKS = [
    { type: 'form_text', label: 'Text Field', icon: FormInput, category: 'fields' },
    { type: 'form_email', label: 'Email Field', icon: Mail, category: 'fields' },
    { type: 'form_phone', label: 'Phone Field', icon: Phone, category: 'fields' },
    { type: 'form_otp', label: 'OTP Verification', icon: Key, category: 'security' },
    { type: 'form_dropdown', label: 'Dropdown Select', icon: ChevronDown, category: 'fields' },
    { type: 'form_checkbox', label: 'Checkbox / Consent', icon: CheckSquare, category: 'fields' },
    { type: 'heading', label: 'Form Title', icon: Heading, category: 'layout' },
    { type: 'paragraph', label: 'Description', icon: Type, category: 'layout' },
    { type: 'form_submit', label: 'Submit Button', icon: MousePointerClick, category: 'action' },
];

export function getDefaultBlock(type) {
    const id = uid();
    switch (type) {
        // Core / Email Blocks
        case 'heading':
            return { id, type: 'heading', level: 2, text: 'Heading Text', align: 'left', color: '#111111' };
        case 'paragraph':
            return { id, type: 'paragraph', text: 'Enter your content here...', align: 'left' };
        case 'button':
            return { id, type: 'button', text: 'Click Here', url: '#', align: 'center', color: '#2563eb', textColor: '#ffffff', borderRadius: 8, paddingY: 12, paddingX: 24 };
        case 'image':
            return { id, type: 'image', src: '', alt: 'Image', align: 'center', width: '100%', url: '', borderRadius: 8 };
        case 'video':
            return { id, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', aspectRatio: '16:9' };
        case 'divider':
            return { id, type: 'divider', color: '#e5e7eb', thickness: 1, marginY: 16 };
        case 'spacer':
            return { id, type: 'spacer', height: 24 };

        // Funnel Blocks
        case 'pricing_card':
            return { id, type: 'pricing_card', title: 'Standard Plan', price: '$49', period: '/month', features: ['Feature 1', 'Feature 2', 'Feature 3'], buttonText: 'Get Started Now', buttonUrl: '#' };
        case 'order_bump':
            return { id, type: 'order_bump', title: 'Special One-Time Offer', headline: 'Yes! Add Priority VIP Support for just $19', description: 'Get 24/7 dedicated support and faster queue response times.', price: '$19.00', checked: false };
        case 'faq_accordion':
            return { id, type: 'faq_accordion', items: [{ q: 'How does it work?', a: 'You can easily configure and automate in minutes.' }, { q: 'Can I cancel anytime?', a: 'Yes, no long-term contracts required.' }] };

        // Form Blocks
        case 'form_text':
            return { id, type: 'form_text', label: 'Full Name', name: 'name', placeholder: 'John Doe', required: true, helpText: '' };
        case 'form_email':
            return { id, type: 'form_email', label: 'Email Address', name: 'email', placeholder: 'john@example.com', required: true, helpText: '' };
        case 'form_phone':
            return { id, type: 'form_phone', label: 'Phone Number', name: 'phone', placeholder: '+1 234 567 8900', required: false, helpText: '' };
        case 'form_otp':
            return { id, type: 'form_otp', label: 'Verification Code', name: 'otp', placeholder: 'Enter 6-digit OTP', length: 6, required: true };
        case 'form_dropdown':
            return { id, type: 'form_dropdown', label: 'Select an Option', name: 'option', options: ['Option 1', 'Option 2', 'Option 3'], required: false };
        case 'form_checkbox':
            return { id, type: 'form_checkbox', label: 'I agree to the Terms & Privacy Policy', name: 'consent', required: true };
        case 'form_submit':
            return { id, type: 'form_submit', text: 'Submit Form', color: '#2563eb', textColor: '#ffffff', align: 'center', fullWidth: true, borderRadius: 8 };

        default:
            return { id, type: 'paragraph', text: '', align: 'left' };
    }
}

export function isTextBlock(type) {
    return ['heading', 'paragraph', 'button', 'form_submit'].includes(type);
}
