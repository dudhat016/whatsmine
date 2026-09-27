import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Save, FormInput, Eye, Undo2, Redo2 } from 'lucide-react';
import { Input } from '@/Components/ui';
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
    terms:         { label: 'Terms & Privacy',  termsText: 'Privacy Policy | Terms of Service', required: false, width: 'full' },
    captcha:       { label: 'Protected by Spam Protection', width: 'full' },
    hidden:        { label: 'Hidden Field',     defaultValue: '', key: 'hidden_field', width: 'full', showLabel: false },
    heading:       { content: 'Section Heading',width: 'full' },
    divider:       { width: 'full' },
    paragraph:     { content: 'Add paragraph text here.', width: 'full' },
    button:        { label: 'Button', buttonText: 'Button', backgroundColor: '#16a34a', textColor: '#ffffff', width: 'full', align: 'center', borderRadius: 12, fontSize: 14, fontWeight: '600' },
    order_2step:   { label: '2-Step Order Form', step1Title: '1. Contact Info', step2Title: '2. Products & Pay', step1ButtonText: 'Go to Step 2 →', step2ButtonText: 'Complete Order 🔒', orderBumpEnabled: true, orderBumpTitle: 'Yes! Add the VIP Bonus Pack', orderBumpDescription: 'Get lifetime access to the quickstart toolkit & bonus resources.', orderBumpPrice: '19.00', orderBumpBadge: 'ONE-TIME OFFER - 80% OFF', couponEnabled: true, currency: 'USD', width: 'full' },
    product_select:{ label: 'Product Selection', currency: 'USD', width: 'full' },
    order_bump:    { label: '1-Click Order Bump', headline: 'Yes! Add This Exclusive Bonus', description: 'Get our comprehensive blueprint and templates at an exclusive one-time discount.', price: '19.00', badgeText: 'SPECIAL ONE-TIME OFFER', currency: 'USD', width: 'full' },
    coupon_code:   { label: 'Discount Coupon Code', placeholder: 'Enter coupon or promo code', buttonText: 'Apply', width: 'full' },
    gdpr:          { gdprText: 'I agree to receive updates and promotional offers.', required: true, width: 'full' },
    double_optin:  { channel: 'whatsapp', width: 'full' },
};

// ── DB → builder: reconstruct field array from saved DB record ───────────────
function hydrateFields(form) {
    const settings = form.settings || {};

    // 1. Direct restoration from exact builder_fields snapshot if present
    if (Array.isArray(settings.builder_fields) && settings.builder_fields.length > 0) {
        const loadedFields = settings.builder_fields.map(f => ({
            ...f,
            id: f.id || uid(),
        }));

        // If legacy saved builder_fields didn't have a button element, insert one before terms/compliance or at end
        if (!loadedFields.some(f => f.type === 'button')) {
            const btnField = {
                id: uid(),
                type: 'button',
                key: 'button',
                label: 'Button',
                buttonText: settings.button_text || 'Button',
                backgroundColor: settings.theme_color || '#16a34a',
                textColor: '#ffffff',
                width: 'full',
                align: 'center',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: '600',
            };
            const termsIdx = loadedFields.findIndex(f => ['terms', 'gdpr', 'double_optin'].includes(f.type));
            if (termsIdx !== -1) {
                loadedFields.splice(termsIdx, 0, btnField);
            } else {
                loadedFields.push(btnField);
            }
        }

        return loadedFields;
    }

    // 2. Fallback parser for legacy forms
    const STANDARD_TYPES = ['email', 'first_name', 'last_name', 'phone_e164'];
    const out = [];
    const customFields = settings.custom_fields || [];
    const hasHeading = customFields.some(cf => cf.type === 'heading');
    const hasParagraph = customFields.some(cf => cf.type === 'paragraph');

    if (form.title && !hasHeading) {
        out.push({
            id: uid(),
            type: 'heading',
            key: 'heading',
            width: 'full',
            content: form.title,
        });
    }

    if (form.description && !hasParagraph) {
        out.push({
            id: uid(),
            type: 'paragraph',
            key: 'paragraph',
            width: 'full',
            content: form.description,
        });
    }

    // Standard fields
    (form.fields || []).forEach(type => {
        if (STANDARD_TYPES.includes(type)) {
            out.push({
                id:       uid(),
                type,
                key:      type,
                standard: true,
                ...STANDARD_DEFAULTS[type],
            });
        }
    });

    // Custom fields
    customFields.forEach(cf => {
        const defaults = CUSTOM_DEFAULTS[cf.type] || {};
        out.push({
            id:  uid(),
            ...defaults,
            ...cf,
        });
    });

    // Button field for fallback
    out.push({
        id:              uid(),
        type:            'button',
        key:             'button',
        label:           'Button',
        buttonText:      settings.button_text || 'Button',
        backgroundColor: settings.theme_color || '#16a34a',
        textColor:       '#ffffff',
        width:           'full',
        align:           'center',
        borderRadius:    12,
        fontSize:        14,
        fontWeight:      '600',
    });

    if (form.gdpr_checkbox) {
        out.push({
            id:       uid(),
            type:     'gdpr',
            key:      'gdpr',
            width:    'full',
            gdprText: form.gdpr_text || 'I agree to receive updates and promotional offers.',
            required: true,
        });
    }

    if (form.double_optin_enabled) {
        out.push({
            id:      uid(),
            type:    'double_optin',
            key:     'double_optin',
            width:   'full',
            channel: form.optin_channel || 'whatsapp',
        });
    }

    return out.length ? out : [{ id: uid(), type: 'email', key: 'email', standard: true, ...STANDARD_DEFAULTS.email }];
}

// ── Builder → DB: serialize back to exact schema ─────────────────────────────
function serialize(fields, formSettings, formName, formType, extraData = {}) {
    const STANDARD_TYPES = ['email', 'first_name', 'last_name', 'phone_e164'];
    const EXCLUDE        = ['gdpr', 'double_optin'];

    // DB `fields` column: ordered array of standard field keys
    const standardFields = fields
        .filter(f => STANDARD_TYPES.includes(f.type))
        .map(f => f.type);

    // DB `settings.custom_fields`: all non-standard, non-compliance fields
    const customFields = fields
        .filter(f => !STANDARD_TYPES.includes(f.type) && !EXCLUDE.includes(f.type))
        .map(({ id, standard, showLabel, width, ...rest }) => ({
            ...rest,
            width:     width     || 'full',
            showLabel: showLabel !== false,
        }));

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
        fields:               standardFields,
        settings: {
            theme_color:        formSettings.theme_color        || '#25D366',
            button_text:        formSettings.button_text        || 'Subscribe Now',
            success_message:    formSettings.success_message    || 'Thank you for subscribing!',
            redirect_url:       formSettings.redirect_url       || '',
            auto_tags:          formSettings.auto_tags          || [],
            card_padding:       formSettings.card_padding       !== undefined ? formSettings.card_padding : 24,
            field_gap:          formSettings.field_gap          !== undefined ? formSettings.field_gap : 12,
            card_max_width:     formSettings.card_max_width     !== undefined ? formSettings.card_max_width : 576,
            card_border_radius: formSettings.card_border_radius !== undefined ? formSettings.card_border_radius : 16,
            custom_fields:      customFields,
            builder_fields:     fields,                       // Full snapshot with exact order, placement, text & styles
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
        ...extraData,
    };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FormsEdit({ form, globalCustomFields = [], availableFolders = [], ecommerceProducts = [] }) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors]         = useState({});

    // Hydrate from DB record on mount with Undo/Redo history support
    const [fields, setFields, { undo, redo, canUndo, canRedo, setPast, setFuture }] = useHistoryState(() => hydrateFields(form));
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [device, setDevice]             = useState('desktop');
    const [draggingWidget, setDraggingWidget] = useState(null);

    const [formName, setFormName]     = useState(form.name || '');
    const [formType, setFormType]     = useState(form.type || 'embedded');
    const [formSettings, setFormSettings] = useState({
        title:              form.title                            || '',
        description:        form.description                      || '',
        theme_color:        form.settings?.theme_color            || '#25D366',
        button_text:        form.settings?.button_text            || 'Subscribe Now',
        success_message:    form.settings?.success_message        || 'Thank you for subscribing!',
        redirect_url:       form.settings?.redirect_url           || '',
        auto_tags:          form.settings?.auto_tags              || [],
        card_padding:       form.settings?.card_padding           !== undefined ? form.settings.card_padding : 24,
        field_gap:          form.settings?.field_gap              !== undefined ? form.settings.field_gap : 12,
        card_max_width:     form.settings?.card_max_width         !== undefined ? form.settings.card_max_width : 576,
        card_border_radius: form.settings?.card_border_radius     !== undefined ? form.settings.card_border_radius : 16,
    });

    useEffect(() => {
        setFields(hydrateFields(form));
        setPast([]);
        setFuture([]);
        setFormName(form.name || '');
        setFormType(form.type || 'embedded');
        setFormSettings({
            title:              form.title                            || '',
            description:        form.description                      || '',
            theme_color:        form.settings?.theme_color            || '#25D366',
            button_text:        form.settings?.button_text            || 'Subscribe Now',
            success_message:    form.settings?.success_message        || 'Thank you for subscribing!',
            redirect_url:       form.settings?.redirect_url           || '',
            auto_tags:          form.settings?.auto_tags              || [],
            card_padding:       form.settings?.card_padding           !== undefined ? form.settings.card_padding : 24,
            field_gap:          form.settings?.field_gap              !== undefined ? form.settings.field_gap : 12,
            card_max_width:     form.settings?.card_max_width         !== undefined ? form.settings.card_max_width : 576,
            card_border_radius: form.settings?.card_border_radius     !== undefined ? form.settings.card_border_radius : 16,
        });
    }, [form.updated_at, form.id]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handleWidgetAdd = useCallback((type, isStandard, customWidget, targetFieldId = null) => {
        if (isStandard) {
            const exists = fields.some(f => f.type === type);
            if (exists) {
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
                id: uid(),
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
            const fieldId = uid();
            const defaults = isStandard ? (STANDARD_DEFAULTS[type] || {}) : (CUSTOM_DEFAULTS[type] || {});
            const defaultKey = isStandard ? type : `${type}_${fieldId}`;
            newField = { id: fieldId, type, key: defaultKey, ...(isStandard ? { standard: true } : {}), ...defaults };
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

    const handleDragStart = ({ active }) => {
        if (active.data.current?.widgetType) setDraggingWidget(active.data.current.widgetType);
    };

    const handleDragEnd = ({ active, over }) => {
        setDraggingWidget(null);
        if (!over) return;
        const widgetType = active.data.current?.widgetType;
        if (widgetType) {
            handleWidgetAdd(widgetType, !!active.data.current?.isStandard, active.data.current?.customField || null, over.id);
            return;
        }
        if (active.id !== over.id) {
            setFields(prev => {
                const oldIdx = prev.findIndex(f => f.id === active.id);
                const newIdx = prev.findIndex(f => f.id === over.id);
                return arrayMove(prev, oldIdx, newIdx);
            });
        }
    };

    const handleFieldChange = (updated) => setFields(prev => prev.map(f => f.id === updated.id ? updated : f));
    const handleFieldDelete = (id) => { setFields(prev => prev.filter(f => f.id !== id)); setSelectedFieldId(null); };
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

    // Submit → PUT /client/forms/{id}  with exact DB schema
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
        const payload = serialize(fields, formSettings, formName, formType, {
            is_active: form.is_active ?? true,
        });
        router.put(route('client.forms.update', form.id), payload, {
            onError:  (errs) => { setErrors(errs); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    };

    const selectedField = fields.find(f => f.id === selectedFieldId);

    return (
        <div className="h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
            <Head title={`Edit Form — ${form.name}`} />

            {/* Top bar */}
            <header className="h-12 flex items-center justify-between px-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href={route('client.forms.index')} className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <FormInput className="w-4 h-4 text-brand-500" />
                    <Input
                        size="sm"
                        wrapperClassName="w-56"
                        type="text"
                        value={formName}
                        onChange={e => { setFormName(e.target.value); setErrors({}); }}
                        placeholder="Untitled Form..."
                        error={errors.name}
                    />
                    {form.is_active ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full">Live</span>
                    ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-700 text-neutral-500 rounded-full">Disabled</span>
                    )}
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
                    <a
                        href={route('public.subscribe.show', form.slug)}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
                    >
                        <Eye className="w-3.5 h-3.5" /> Preview
                    </a>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-lg transition shadow-sm"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {processing ? 'Saving...' : 'Save Changes'}
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
