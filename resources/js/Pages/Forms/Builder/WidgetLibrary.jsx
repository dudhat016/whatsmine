import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
    AtSign, User, Phone, Type, AlignLeft, Hash, Calendar,
    ChevronDown, CircleDot, CheckSquare, Upload, Star, EyeOff,
    Heading, Minus, FileText, ShieldCheck, Shield, Plus,
    LayoutGrid, Sparkles, Database, Image as ImageIcon, PenTool,
    FileCheck, Sliders, CheckCheck, Lock, Folder, Globe, MapPin, Building, Briefcase, FileSignature,
    MousePointerClick, ShoppingBag, CreditCard, Tag, Zap, Package
} from 'lucide-react';
import CreateCustomFieldModal from './modals/CreateCustomFieldModal';

// Helper to pick the best icon based on key or type
function getFieldIcon(type, key) {
    if (key === 'email') return AtSign;
    if (['first_name', 'last_name', 'name'].includes(key)) return User;
    if (['phone_e164', 'whatsapp'].includes(key)) return Phone;
    if (['company_name'].includes(key)) return Building;
    if (['address_1', 'address_2', 'city', 'state', 'postal_code', 'country'].includes(key)) return MapPin;
    if (['website'].includes(key)) return Globe;
    if (['job_title'].includes(key)) return Briefcase;
    if (['notes'].includes(key)) return FileText;
    if (['vat_id'].includes(key)) return Hash;

    switch (type) {
        case 'order_2step': return ShoppingBag;
        case 'product_select': return Package;
        case 'order_bump': return Zap;
        case 'coupon_code': return Tag;
        case 'button': return MousePointerClick;
        case 'text': return Type;
        case 'textarea': return AlignLeft;
        case 'number': return Hash;
        case 'tel': return Phone;
        case 'date': return Calendar;
        case 'select': return ChevronDown;
        case 'radio': return CircleDot;
        case 'checkbox': return CheckSquare;
        case 'multi_checkbox': return CheckCheck;
        case 'file': return Upload;
        case 'rating': return Star;
        case 'scale': return Sliders;
        case 'signature': return PenTool;
        case 'hidden': return EyeOff;
        default: return Sparkles;
    }
}

const STATIC_ELEMENT_GROUPS = [
    {
        label: 'Order & Monetization (GHL)',
        color: 'brand',
        items: [
            { type: 'order_2step',    label: '2-Step Order Form',    icon: ShoppingBag },
            { type: 'product_select', label: 'Product Selection',    icon: Package },
            { type: 'order_bump',     label: '1-Click Order Bump',   icon: Zap },
            { type: 'coupon_code',    label: 'Discount Coupon Code', icon: Tag },
        ],
    },
    {
        label: 'Form Elements & Media',
        color: 'violet',
        items: [
            { type: 'button',    label: 'Button',          icon: MousePointerClick },
            { type: 'heading',   label: 'Section Heading', icon: Heading },
            { type: 'paragraph', label: 'Paragraph Text',  icon: FileText },
            { type: 'image',     label: 'Image / Logo',    icon: ImageIcon },
            { type: 'divider',   label: 'Divider Line',    icon: Minus },
        ],
    },
    {
        label: 'Compliance & Security',
        color: 'emerald',
        items: [
            { type: 'gdpr',         label: 'GDPR Consent',       icon: Shield },
            { type: 'terms',        label: 'Terms & Conditions', icon: FileCheck },
            { type: 'double_optin', label: 'Double OTP',         icon: ShieldCheck },
            { type: 'captcha',      label: 'Bot Protection',     icon: Lock },
        ],
    },
];

const CUSTOM_TEMPLATES = [
    {
        label: 'Custom Field Templates',
        color: 'indigo',
        items: [
            { type: 'text',           label: 'Short Text',         icon: Type },
            { type: 'textarea',       label: 'Long Text',          icon: AlignLeft },
            { type: 'number',         label: 'Number',             icon: Hash },
            { type: 'tel',            label: 'Phone',              icon: Phone },
            { type: 'date',           label: 'Date Picker',        icon: Calendar },
            { type: 'select',         label: 'Dropdown',           icon: ChevronDown },
            { type: 'radio',          label: 'Radio Buttons',      icon: CircleDot },
            { type: 'checkbox',       label: 'Checkbox',           icon: CheckSquare },
            { type: 'multi_checkbox', label: 'Multi-Checkboxes',   icon: CheckCheck },
            { type: 'file',           label: 'File Upload',        icon: Upload },
            { type: 'rating',         label: 'Rating Stars',       icon: Star },
            { type: 'scale',          label: 'NPS / Opinion Scale',icon: Sliders },
            { type: 'signature',      label: 'Signature Pad',      icon: PenTool },
            { type: 'hidden',         label: 'Hidden Field',       icon: EyeOff },
        ],
    },
];

const COLOR_MAP = {
    brand:   { dot: 'bg-brand-500',   text: 'text-brand-600 dark:text-brand-400',    tile: 'hover:bg-brand-50 dark:hover:bg-brand-950/30' },
    indigo:  { dot: 'bg-indigo-500',  text: 'text-indigo-600 dark:text-indigo-400',  tile: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30' },
    violet:  { dot: 'bg-violet-500',  text: 'text-violet-600 dark:text-violet-400',  tile: 'hover:bg-violet-50 dark:hover:bg-violet-950/30' },
    emerald: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400',tile: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30' },
    purple:  { dot: 'bg-purple-500',  text: 'text-purple-600 dark:text-purple-400',  tile: 'hover:bg-purple-50 dark:hover:bg-purple-950/30' },
    amber:   { dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400',    tile: 'hover:bg-amber-50 dark:hover:bg-amber-950/30' },
};

function DraggableTile({ widget, color = 'indigo', onAdd, active = false }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `widget-${widget.type}-${widget.key || widget.id || 'default'}`,
        data: { widgetType: widget.type, isStandard: !!widget.standard, customField: widget },
    });
    const c = COLOR_MAP[color] || COLOR_MAP.indigo;
    const Icon = widget.icon || Sparkles;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={() => onAdd(widget.type, !!widget.standard, widget)}
            className={[
                'relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer select-none',
                'border transition-all duration-150',
                'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
                c.tile,
                isDragging ? 'opacity-40 ring-2 ring-brand-400 scale-95' : 'hover:border-neutral-300 dark:hover:border-neutral-600',
            ].join(' ')}
            title={`Click or drag to add ${widget.label}`}
        >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${c.text}`} />
            <div className="min-w-0 flex-1 truncate">
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">{widget.label}</p>
                {widget.objectTarget && (
                    <p className="text-[9px] text-neutral-400 font-mono uppercase truncate">{widget.objectTarget}</p>
                )}
            </div>
            {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Present on Canvas" />
            )}
        </div>
    );
}

export default function WidgetLibrary({
    fields = [],
    globalCustomFields = [],
    availableFolders = [],
    onAdd,
    onCreateCustomField,
}) {
    const [activeTab, setActiveTab] = useState('object_fields');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const placedKeys = fields.map(f => f.key || f.type);

    // ── Build Dynamic Object Field Groups (Contact & General Info from DB) ──
    const contactDbFields = globalCustomFields.filter(f => f.field_group === 'contact');
    const generalDbFields = globalCustomFields.filter(f => f.field_group === 'general_info');

    const contactGroupItems = (contactDbFields.length > 0 ? contactDbFields : [
        { key: 'email', name: 'Email Address', type: 'email' },
        { key: 'first_name', name: 'First Name', type: 'first_name' },
        { key: 'last_name', name: 'Last Name', type: 'last_name' },
        { key: 'phone_e164', name: 'WhatsApp Phone', type: 'phone_e164' },
    ]).map(cf => ({
        type: cf.type,
        key: cf.key,
        label: cf.name,
        standard: ['email', 'first_name', 'last_name', 'phone_e164'].includes(cf.key),
        objectTarget: 'contact',
        fieldGroup: 'contact',
        options: cf.options || [],
        placeholder: cf.placeholder || '',
        required: cf.is_required,
        icon: getFieldIcon(cf.type, cf.key),
    }));

    const generalGroupItems = (generalDbFields.length > 0 ? generalDbFields : [
        { key: 'company_name', name: 'Company / Business Name', type: 'text' },
        { key: 'address_1', name: 'Street Address', type: 'text' },
        { key: 'address_2', name: 'Apartment / Suite', type: 'text' },
        { key: 'city', name: 'City', type: 'text' },
        { key: 'state', name: 'State / Region', type: 'text' },
        { key: 'postal_code', name: 'Postal / ZIP Code', type: 'text' },
        { key: 'country', name: 'Country', type: 'text' },
        { key: 'website', name: 'Website URL', type: 'text' },
        { key: 'job_title', name: 'Job Title', type: 'text' },
        { key: 'notes', name: 'Contact Notes', type: 'textarea' },
        { key: 'vat_id', name: 'Tax / VAT ID', type: 'text' },
    ]).map(cf => ({
        type: cf.type,
        key: cf.key,
        label: cf.name,
        standard: false,
        objectTarget: 'contact',
        fieldGroup: 'general_info',
        options: cf.options || [],
        placeholder: cf.placeholder || cf.name || '',
        required: cf.is_required,
        icon: getFieldIcon(cf.type, cf.key),
    }));

    // ── Build Dynamic Custom Fields by Folder ──
    const customFieldsFromDb = globalCustomFields.filter(f => !['contact', 'general_info'].includes(f.field_group));
    
    // Group custom fields by their folder
    const customFieldsByFolder = {};
    customFieldsFromDb.forEach(cf => {
        const folderKey = cf.field_group || 'additional_info';
        if (!customFieldsByFolder[folderKey]) {
            const folderObj = availableFolders.find(f => f.key === folderKey || f.id === folderKey);
            customFieldsByFolder[folderKey] = {
                folderName: folderObj ? folderObj.name : folderKey.replace(/_/g, ' ').toUpperCase(),
                items: [],
            };
        }
        customFieldsByFolder[folderKey].items.push({
            type: cf.type,
            key: cf.key,
            label: cf.name,
            objectTarget: cf.object_target || 'contact',
            fieldGroup: cf.field_group,
            options: cf.options || [],
            placeholder: cf.placeholder || '',
            required: cf.is_required,
            icon: getFieldIcon(cf.type, cf.key),
        });
    });

    return (
        <aside className="w-[240px] shrink-0 flex flex-col bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 overflow-y-auto">
            {/* Header & Tabs */}
            <div className="px-3 py-3 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 bg-neutral-50 dark:bg-neutral-900 z-10 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <LayoutGrid className="w-4 h-4 text-brand-500" />
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Quick Add</span>
                    </div>
                </div>

                {/* GoHighLevel-style 2 Tabs */}
                <div className="grid grid-cols-2 p-0.5 bg-neutral-200/60 dark:bg-neutral-800 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setActiveTab('object_fields')}
                        className={`py-1.5 text-[11px] font-bold rounded-md transition cursor-pointer ${
                            activeTab === 'object_fields'
                                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                        }`}
                    >
                        Object Fields
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('custom_fields')}
                        className={`py-1.5 text-[11px] font-bold rounded-md transition cursor-pointer ${
                            activeTab === 'custom_fields'
                                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
                        }`}
                    >
                        Custom Fields
                    </button>
                </div>
            </div>

            {/* TAB 1: OBJECT FIELDS (Contact + General Info + Elements + Compliance) */}
            {activeTab === 'object_fields' && (
                <div className="flex-1 px-2 py-3 space-y-4">
                    {/* Contact Standard Fields */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-1.5 px-1">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-brand-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Contact Fields ({contactGroupItems.length})
                            </span>
                        </div>
                        <div className="space-y-1">
                            {contactGroupItems.map((widget) => (
                                <DraggableTile
                                    key={widget.key || widget.type}
                                    widget={widget}
                                    color="brand"
                                    onAdd={onAdd}
                                    active={placedKeys.includes(widget.key || widget.type)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* General Info Fields (if any exist) */}
                    {generalGroupItems.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-1.5 px-1">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    General Info ({generalGroupItems.length})
                                </span>
                            </div>
                            <div className="space-y-1">
                                {generalGroupItems.map((widget) => (
                                    <DraggableTile
                                        key={widget.key}
                                        widget={widget}
                                        color="amber"
                                        onAdd={onAdd}
                                        active={placedKeys.includes(widget.key)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Form Elements & Compliance */}
                    {STATIC_ELEMENT_GROUPS.map((group) => {
                        const c = COLOR_MAP[group.color];
                        return (
                            <div key={group.label}>
                                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        {group.label}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {group.items.map((widget) => (
                                        <DraggableTile
                                            key={widget.type}
                                            widget={widget}
                                            color={group.color}
                                            onAdd={onAdd}
                                            active={placedKeys.includes(widget.type)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TAB 2: CUSTOM FIELDS (Folder Groups + Template Elements) */}
            {activeTab === 'custom_fields' && (
                <div className="flex-1 flex flex-col">
                    <div className="p-2.5 border-b border-neutral-200 dark:border-neutral-800 sticky top-[73px] bg-neutral-50 dark:bg-neutral-900 z-10">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Add Custom Field
                        </button>
                    </div>

                    <div className="flex-1 px-2 py-3 space-y-4">
                        {/* Dynamic Saved Folder Groups */}
                        {Object.entries(customFieldsByFolder).map(([folderKey, group]) => (
                            <div key={folderKey}>
                                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                                    <Folder className="w-3.5 h-3.5 text-purple-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 truncate">
                                        {group.folderName} ({group.items.length})
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {group.items.map((widget) => (
                                        <DraggableTile
                                            key={widget.key}
                                            widget={widget}
                                            color="purple"
                                            onAdd={onAdd}
                                            active={placedKeys.includes(widget.key)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Custom Field Templates for Quick Add */}
                        {CUSTOM_TEMPLATES.map((group) => {
                            const c = COLOR_MAP[group.color];
                            return (
                                <div key={group.label}>
                                    <div className="flex items-center gap-1.5 mb-1.5 px-1">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            {group.label}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {group.items.map((widget) => (
                                            <DraggableTile
                                                key={widget.type}
                                                widget={widget}
                                                color={group.color}
                                                onAdd={onAdd}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Create Custom Field Modal */}
            <CreateCustomFieldModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                availableFolders={availableFolders}
                onCreateCustomField={(newCustomField) => {
                    if (onCreateCustomField) {
                        onCreateCustomField(newCustomField);
                    }
                }}
            />
        </aside>
    );
}
