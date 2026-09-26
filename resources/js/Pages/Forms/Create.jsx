import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { ArrowLeft, Save, FormInput, Eye, Undo2, Redo2 } from 'lucide-react';
import {
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import useHistoryState from '@/hooks/useHistoryState';

import WidgetLibrary from './Builder/WidgetLibrary';
import FormCanvas from './Builder/FormCanvas';
import FieldSettings from './Builder/FieldSettings';
import FormSettings from './Builder/FormSettings';

// ── UID ─────────────────────────────────────────────────────────────────────
let _uid = 1;
function uid() { return `f_${Date.now()}_${_uid++}`; }

// ── Field defaults ───────────────────────────────────────────────────────────
const STANDARD_DEFAULTS = {
    first_name: { label: 'First Name',     placeholder: 'First Name',     required: false, width: 'full', showLabel: true, standard: true },
    last_name:  { label: 'Last Name',      placeholder: 'Last Name',      required: false, width: 'full', showLabel: true, standard: true },
    phone_e164: { label: 'Phone',          placeholder: 'Phone',          required: true,  width: 'full', showLabel: true, standard: true },
    email:      { label: 'Email',          placeholder: 'Email',          required: true,  width: 'full', showLabel: true, standard: true },
};

const CUSTOM_DEFAULTS = {
    text:          { label: 'Short Text',       placeholder: '',  required: false, width: 'full',  showLabel: true },
    textarea:      { label: 'Long Text',        placeholder: '',  required: false, width: 'full',  showLabel: true },
    number:        { label: 'Number',           placeholder: '',  required: false, width: 'half',  showLabel: true },
    tel:           { label: 'Phone',            placeholder: '',  required: false, width: 'half',  showLabel: true },
    date:          { label: 'Date',             placeholder: '',  required: false, width: 'half',  showLabel: true },
    select:        { label: 'Dropdown',         placeholder: 'Select an option', options: ['Option 1', 'Option 2'], required: false, width: 'full', showLabel: true },
    radio:         { label: 'Radio',            options: ['Option 1', 'Option 2'], required: false, width: 'full', showLabel: true },
    checkbox:      { label: 'I agree to the terms', required: false, width: 'full', showLabel: false },
    multi_checkbox:{ label: 'Multi-Select',     options: ['Option A', 'Option B', 'Option C'], required: false, width: 'full', showLabel: true },
    file:          { label: 'Upload File',      required: false, width: 'full',  showLabel: true },
    rating:        { label: 'Rating',           maxRating: 5, required: false, width: 'full', showLabel: true },
    scale:         { label: 'How likely are you to recommend us?', minScale: 1, maxScale: 10, minLabel: 'Not likely', maxLabel: 'Very likely', required: false, width: 'full', showLabel: true },
    signature:     { label: 'Signature',        required: false, width: 'full', showLabel: true },
    image:         { label: 'Image',            imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80', imageAlt: 'Banner Image', width: 'full' },
    terms:         { label: 'Terms & Privacy', termsText: 'Privacy Policy | Terms of Service', required: false, width: 'full' },
    captcha:       { label: 'Protected by Spam Protection', width: 'full' },
    hidden:        { label: 'Hidden Field',     defaultValue: '', key: 'hidden_field', width: 'full', showLabel: false },
    heading:       { content: 'Section Heading',width: 'full' },
    divider:       { width: 'full' },
    paragraph:     { content: 'Add paragraph text here.', width: 'full' },
    order_2step:   { label: '2-Step Order Form', step1Title: '1. Contact Info', step2Title: '2. Products & Pay', step1ButtonText: 'Go to Step 2 →', step2ButtonText: 'Complete Order 🔒', orderBumpEnabled: true, orderBumpTitle: 'Yes! Add the VIP Bonus Pack', orderBumpDescription: 'Get lifetime access to the quickstart toolkit & bonus resources.', orderBumpPrice: '19.00', orderBumpBadge: 'ONE-TIME OFFER - 80% OFF', couponEnabled: true, currency: 'USD', width: 'full' },
    product_select:{ label: 'Product Selection', currency: 'USD', width: 'full' },
    order_bump:    { label: '1-Click Order Bump', headline: 'Yes! Add This Exclusive Bonus', description: 'Get our comprehensive blueprint and templates at an exclusive one-time discount.', price: '19.00', badgeText: 'SPECIAL ONE-TIME OFFER', currency: 'USD', width: 'full' },
    coupon_code:   { label: 'Discount Coupon Code', placeholder: 'Enter coupon or promo code', buttonText: 'Apply', width: 'full' },
    gdpr:          { gdprText: 'I agree to receive updates and promotional offers.', required: true, width: 'full' },
    double_optin:  { channel: 'whatsapp', width: 'full' },
};

function buildField(type, isStandard, overrides = {}) {
    const defaults = isStandard ? (STANDARD_DEFAULTS[type] || {}) : (CUSTOM_DEFAULTS[type] || {});
    const fieldId = uid();
    const defaultKey = isStandard ? type : (overrides.key || `${type}_${fieldId}`);
    return { id: fieldId, type, key: defaultKey, ...defaults, ...overrides };
}

// ── Serialize builder state → DB payload ─────────────────────────────────────
function serialize(fields, formSettings, formName, formType) {
    const STANDARD_TYPES = ['email', 'first_name', 'last_name', 'phone_e164'];

    // Standard fields — just the keys, in order
    const standardFields = fields
        .filter(f => STANDARD_TYPES.includes(f.type))
        .map(f => f.type);

    // Custom fields — everything else except compliance widgets
    const EXCLUDE = ['gdpr', 'double_optin'];
    const customFields = fields
        .filter(f => !STANDARD_TYPES.includes(f.type) && !EXCLUDE.includes(f.type))
        .map(({ id, standard, showLabel, width, ...rest }) => ({
            ...rest,
            width: width || 'full',        // persist width
            showLabel: showLabel !== false, // persist label visibility
        }));

    // Compliance widgets
    const otpField  = fields.find(f => f.type === 'double_optin');
    const gdprField = fields.find(f => f.type === 'gdpr');

    const firstHeading   = fields.find(f => f.type === 'heading');
    const firstParagraph = fields.find(f => f.type === 'paragraph');

    const order2StepField = fields.find(f => f.type === 'order_2step');
    const orderBumpField = fields.find(f => f.type === 'order_bump') || order2StepField;
    const isOrderForm = !!order2StepField || fields.some(f => ['product_select', 'order_bump'].includes(f.type));

    return {
        name:                 formName,
        title:                firstHeading?.content || formSettings.title || formName,
        description:          firstParagraph?.content || formSettings.description || '',
        type:                 formType,
        fields:               standardFields,           // → DB `fields` column
        settings: {                                     // → DB `settings` column
            theme_color:        formSettings.theme_color        || '#16a34a',
            button_text:        formSettings.button_text        || 'Button',
            success_message:    formSettings.success_message    || 'Thank you for submitting!',
            redirect_url:       formSettings.redirect_url       || '',
            auto_tags:          formSettings.auto_tags          || [],
            card_padding:       formSettings.card_padding       !== undefined ? formSettings.card_padding : 24,
            field_gap:          formSettings.field_gap          !== undefined ? formSettings.field_gap : 12,
            card_max_width:     formSettings.card_max_width     !== undefined ? formSettings.card_max_width : 576,
            card_border_radius: formSettings.card_border_radius !== undefined ? formSettings.card_border_radius : 16,
            custom_fields:      customFields,             // nested in settings JSON
            builder_fields:     fields,                   // Full snapshot with exact order, placement, text & styles
        },
        double_optin_enabled: !!otpField,
        optin_channel:        otpField?.channel || 'whatsapp',
        gdpr_checkbox:        !!gdprField,
        gdpr_text:            gdprField?.gdprText || '',
        is_order_form:        isOrderForm,
        order_form_type:      order2StepField ? '2_step' : '1_step',
        currency:             order2StepField?.currency || 'USD',
        order_bump_settings:  orderBumpField ? {
            enabled:    orderBumpField.orderBumpEnabled ?? true,
            title:      orderBumpField.orderBumpTitle || orderBumpField.headline || 'Order Bump Offer',
            description:orderBumpField.orderBumpDescription || orderBumpField.description || '',
            price:      orderBumpField.orderBumpPrice || orderBumpField.price || '19.00',
            badge_text: orderBumpField.orderBumpBadge || orderBumpField.badgeText || 'SPECIAL OFFER',
        } : null,
        coupon_enabled:       !!fields.find(f => f.type === 'coupon_code') || !!order2StepField?.couponEnabled,
    };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FormsCreate({ globalCustomFields = [], availableFolders = [], ecommerceProducts = [] }) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    // Canvas fields — source of truth with Undo/Redo history support (GoHighLevel default form template)
    const [fields, setFields, { undo, redo, canUndo, canRedo }] = useHistoryState([
        buildField('first_name', true, { width: 'full', placeholder: 'First Name' }),
        buildField('last_name',  true, { width: 'full', placeholder: 'Last Name' }),
        buildField('phone_e164', true, { width: 'full', label: 'Phone', placeholder: 'Phone', required: true }),
        buildField('email',      true, { width: 'full', label: 'Email', placeholder: 'Email', required: true }),
        buildField('checkbox',  false, {
            key: 'consent_transactional',
            label: 'By checking this box, I consent to receive transactional messages related to my account, orders, or services I have requested. These messages may include appointment reminders, order confirmations, and account notifications among others. Message frequency may vary. Message & Data rates may apply. Reply HELP for help or STOP to opt-out.',
            required: false,
            width: 'full',
            showLabel: true,
        }),
        buildField('checkbox',  false, {
            key: 'consent_marketing',
            label: 'By checking this box, I consent to receive marketing and promotional messages, including special offers, discounts, new product updates among others. Message frequency may vary. Message & Data rates may apply. Reply HELP for help or STOP to opt-out.',
            required: false,
            width: 'full',
            showLabel: true,
        }),
        buildField('button',    false, {
            label: 'Button',
            buttonText: 'Button',
            backgroundColor: '#16a34a',
            textColor: '#ffffff',
            width: 'full',
            align: 'center',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: '600',
        }),
        buildField('terms',     false, {
            label: 'Terms & Privacy',
            termsText: 'Privacy Policy | Terms of Service',
            required: false,
            width: 'full',
        }),
    ]);

    const [selectedFieldId, setSelectedFieldId]   = useState(null);
    const [device, setDevice]                     = useState('desktop');
    const [draggingWidget, setDraggingWidget]     = useState(null);
    const [formName, setFormName]                 = useState('');
    const [formType, setFormType]                 = useState('embedded');
    const [formSettings, setFormSettings]         = useState({
        title:           '',
        description:     '',
        theme_color:     '#16a34a',
        button_text:     'Button',
        success_message: 'Thank you for submitting!',
        redirect_url:    '',
        auto_tags:       ['Website Lead'],
    });

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    // Add field from widget panel or DnD
    const handleWidgetAdd = useCallback((type, isStandard = false, customWidget = null, targetFieldId = null) => {
        if (isStandard && !customWidget && targetFieldId === null) {
            const exists = fields.some(f => f.type === type);
            if (exists) {
                // Toggle standard field off
                setFields(prev => prev.filter(f => f.type !== type));
                setSelectedFieldId(prev => {
                    const removing = fields.find(f => f.type === type);
                    return removing?.id === prev ? null : prev;
                });
                return;
            }
        }

        let newField;
        if (customWidget && customWidget.key) {
            newField = {
                id: `custom_${Date.now()}`,
                type: customWidget.type,
                key: customWidget.key,
                label: customWidget.label,
                objectTarget: customWidget.objectTarget || 'contact',
                fieldGroup: customWidget.fieldGroup || 'general_info',
                placeholder: customWidget.placeholder || '',
                options: customWidget.options || [],
                required: !!customWidget.required,
                width: 'full',
                showLabel: true,
            };
        } else {
            newField = buildField(type, isStandard);
        }

        setFields(prev => {
            if (targetFieldId && targetFieldId !== 'canvas-drop') {
                const targetIdx = prev.findIndex(f => f.id === targetFieldId);
                if (targetIdx !== -1) {
                    const copy = [...prev];
                    copy.splice(targetIdx + 1, 0, newField);
                    return copy;
                }
            }
            return [...prev, newField];
        });
        setSelectedFieldId(newField.id);
    }, [fields]);

    // DnD — drag from library or reorder canvas
    const handleDragStart = ({ active }) => {
        if (active.data.current?.widgetType) setDraggingWidget(active.data.current.widgetType);
    };

    const handleDragEnd = ({ active, over }) => {
        setDraggingWidget(null);
        if (!over) return;
        const widgetType = active.data.current?.widgetType;
        if (widgetType) {
            // Dropped from widget library onto canvas or specific field
            handleWidgetAdd(widgetType, !!active.data.current?.isStandard, active.data.current?.customField || null, over.id);
            return;
        }
        // Reorder within canvas
        if (active.id !== over.id) {
            setFields(prev => {
                const oldIdx = prev.findIndex(f => f.id === active.id);
                const newIdx = prev.findIndex(f => f.id === over.id);
                return arrayMove(prev, oldIdx, newIdx);
            });
        }
    };

    const handleFieldChange  = (updated) => setFields(prev => prev.map(f => f.id === updated.id ? updated : f));
    const handleFieldDelete  = (id) => { setFields(prev => prev.filter(f => f.id !== id)); setSelectedFieldId(null); };
    const handleFieldDuplicate = (id) => {
        const idx = fields.findIndex(f => f.id === id);
        if (idx === -1) return;
        const orig = fields[idx];
        const cloned = { ...orig, id: `f_${Date.now()}_${_uid++}`, label: `${orig.label || 'Field'} (Copy)` };
        setFields(prev => {
            const copy = [...prev];
            copy.splice(idx + 1, 0, cloned);
            return copy;
        });
        setSelectedFieldId(cloned.id);
    };

    const handleCreateCustomField = (newCustomField) => {
        setFields(prev => [...prev, newCustomField]);
        setSelectedFieldId(newCustomField.id);
    };

    // Submit → POST /client/forms with exact DB schema
    const handleSubmit = (e) => {
        e?.preventDefault();
        setErrors({});

        if (!formName.trim()) {
            setErrors({ name: 'Form name is required.' });
            return;
        }

        // GoHighLevel rule: A form must contain at least 1 primary identifier (email or phone)
        const hasPrimaryIdentifier = fields.some(f =>
            ['email', 'phone_e164', 'whatsapp', 'tel'].includes(f.type || f.key)
        );

        if (!hasPrimaryIdentifier) {
            setErrors({
                primary_identifier: 'A form must contain at least an Email Address or WhatsApp Phone number to identify and create contacts in the CRM.',
            });
            return;
        }

        setProcessing(true);
        const payload = serialize(fields, formSettings, formName, formType);
        router.post(route('client.forms.store'), payload, {
            onError:  (errs) => { setErrors(errs); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    };

    const selectedField = fields.find(f => f.id === selectedFieldId);

    return (
        <div className="h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
            <Head title="Create Subscription Form" />

            {/* Top bar */}
            <header className="h-12 flex items-center justify-between px-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href={route('client.forms.index')} className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <FormInput className="w-4 h-4 text-brand-500" />
                    <input
                        type="text"
                        value={formName}
                        onChange={e => { setFormName(e.target.value); setErrors({}); }}
                        placeholder="Untitled Form..."
                        className={`text-sm font-semibold text-neutral-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 w-52 placeholder-neutral-400 ${errors.name ? 'placeholder-red-400' : ''}`}
                    />
                    {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-1">
                        <button
                            type="button"
                            onClick={undo}
                            disabled={!canUndo}
                            title="Undo (Ctrl+Z)"
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={redo}
                            disabled={!canRedo}
                            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </div>
                    <span className="text-xs text-neutral-400">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-lg transition shadow-sm"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {processing ? 'Saving...' : 'Save Form'}
                    </button>
                </div>
            </header>

            {/* Validation Banner (GoHighLevel Rule) */}
            {errors.primary_identifier && (
                <div className="bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900/60 px-4 py-2 flex items-center justify-between text-xs text-red-700 dark:text-red-300 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">⚠️ Warning:</span>
                        <span>{errors.primary_identifier}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrors({ ...errors, primary_identifier: null })}
                        className="font-bold hover:underline ml-3"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* 3-Column Body */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex flex-1 min-h-0 overflow-hidden">
                    <WidgetLibrary fields={fields} globalCustomFields={globalCustomFields} availableFolders={availableFolders} onAdd={handleWidgetAdd} onCreateCustomField={handleCreateCustomField} />
                    <FormCanvas
                        fields={fields}
                        formSettings={formSettings}
                        selectedFieldId={selectedFieldId}
                        onSelectField={(id) => setSelectedFieldId(prev => prev === id ? null : id)}
                        device={device}
                        onDeviceChange={setDevice}
                        onFormSettingsChange={setFormSettings}
                        onUpdateField={handleFieldChange}
                        onDuplicateField={handleFieldDuplicate}
                        onDeleteField={handleFieldDelete}
                        onAddField={handleWidgetAdd}
                    />
                    {selectedField ? (
                        <FieldSettings
                            key={selectedField.id}
                            field={selectedField}
                            availableFolders={availableFolders}
                            ecommerceProducts={ecommerceProducts}
                            onChange={handleFieldChange}
                            onDelete={() => handleFieldDelete(selectedField.id)}
                        />
                    ) : (
                        <FormSettings
                            formSettings={formSettings}
                            onChange={setFormSettings}
                            formName={formName}
                            onNameChange={setFormName}
                            formType={formType}
                            onTypeChange={setFormType}
                        />
                    )}
                </div>
                <DragOverlay>
                    {draggingWidget && (
                        <div className="px-3 py-2 bg-white dark:bg-neutral-800 border border-brand-400 rounded-lg shadow-xl text-xs font-medium text-brand-600 dark:text-brand-400 opacity-90">
                            + {draggingWidget.replace(/_/g, ' ')}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
