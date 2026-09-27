import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { 
    ArrowLeft, Plus, Trash2, CheckCircle2, ShieldCheck, DollarSign, 
    Calendar, User, FileText, Check, HelpCircle, AlertCircle, Package, Tag, Sparkles
} from 'lucide-react';
import Card from '@/Components/ui/Card';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';

export default function ProposalEdit({ proposal = null, contacts = [], products = [] }) {
    const isEditing = Boolean(proposal?.id);

    const { data, setData, post, put, processing, errors } = useForm({
        title: proposal?.title || '',
        contact_id: proposal?.contact_id || '',
        pricing_type: proposal?.pricing_type || 'one_time',
        status: proposal?.status || 'draft',
        valid_until: proposal?.valid_until || '',
        discount_amount: proposal?.discount_amount || 0,
        tax_rate: proposal?.tax_rate || 0,
        require_signature: proposal?.require_signature ?? true,
        note: proposal?.note || 'Thank you for considering our services. We look forward to working together.',
        contract_terms: proposal?.contract_terms || 'This Master Services Agreement ("Agreement") is entered into between {{account.name}} and {{contact.name}} ({{contact.email}}).\n\n1. Scope of Work: As outlined in the proposal line items totaling {{proposal.total}}.\n2. Payment Terms: Payment is due upon execution or according to invoice due date.\n3. Governing Law: This agreement is governed by the laws of {{account.timezone}}.\n\nDate: {{right_now.date}}',
        line_items: proposal?.line_items?.length 
            ? proposal.line_items 
            : [{ product_id: '', name: 'Custom Website Design & Development', quantity: 1, price: '1500.00' }],
    });

    const handleAddLineItem = () => {
        setData('line_items', [...data.line_items, { product_id: '', name: '', quantity: 1, price: '' }]);
    };

    const handleRemoveLineItem = (idx) => {
        const items = [...data.line_items];
        items.splice(idx, 1);
        setData('line_items', items);
    };

    const handleLineItemChange = (idx, field, val) => {
        const items = [...data.line_items];
        items[idx][field] = val;
        setData('line_items', items);
    };

    const handleSelectProduct = (idx, productId) => {
        const selectedProd = products.find(p => String(p.id) === String(productId));
        const items = [...data.line_items];
        if (selectedProd) {
            items[idx].product_id = selectedProd.id;
            items[idx].name = selectedProd.name;
            items[idx].price = selectedProd.price;
        } else {
            items[idx].product_id = '';
        }
        setData('line_items', items);
    };

    const insertToken = (token) => {
        setData('contract_terms', (data.contract_terms || '') + ' ' + token);
    };

    const subtotal = data.line_items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity) || 1;
        return sum + (price * qty);
    }, 0);

    const discount = parseFloat(data.discount_amount) || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * ((parseFloat(data.tax_rate) || 0) / 100);
    const total = taxable + tax;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('client.agency.proposals.update', proposal.id));
        } else {
            post(route('client.agency.proposals.store'));
        }
    };

    const tokenHelpers = [
        { label: 'Client Name', token: '{{contact.name}}' },
        { label: 'Client Email', token: '{{contact.email}}' },
        { label: 'Client Phone', token: '{{contact.phone}}' },
        { label: 'Company Name', token: '{{account.name}}' },
        { label: 'Total Amount', token: '{{proposal.total}}' },
        { label: 'Today Date', token: '{{right_now.date}}' },
    ];

    return (
        <ClientLayout title={isEditing ? `Edit Proposal: ${proposal.title}` : 'Create Proposal & Estimate'}>
            <Head title={isEditing ? `Edit Proposal #${proposal.id}` : 'Create Proposal & Estimate'} />

            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route('client.agency.proposals.index')}
                        className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            {isEditing ? `Edit Proposal: ${proposal.title}` : 'New Proposal & Estimate'}
                        </h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Draft a service estimate, link global products, and attach legal contract terms with E-Signature.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. General Info Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2 flex items-center gap-2">
                            <User className="h-4 w-4 text-brand-500" /> 1. Deal & Client Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Proposal Title *"
                                type="text"
                                placeholder="e.g. Q4 Growth & Full-Stack Development"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                error={errors.title}
                                required
                            />

                            <Select
                                label="Client Contact"
                                value={data.contact_id}
                                onChange={(e) => setData('contact_id', e.target.value)}
                            >
                                <option value="">Select a Contact...</option>
                                {contacts.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.email ? `(${c.email})` : ''}
                                    </option>
                                ))}
                            </Select>

                            <Select
                                label="Pricing Structure"
                                value={data.pricing_type}
                                onChange={(e) => setData('pricing_type', e.target.value)}
                            >
                                <option value="one_time">Fixed One-Time Fee</option>
                                <option value="recurring">Monthly Retainer</option>
                                <option value="installments">Milestone Split-Pay</option>
                            </Select>

                            <Input
                                label="Valid Until Date"
                                type="date"
                                value={data.valid_until}
                                onChange={(e) => setData('valid_until', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 2. Line Items with Global Products */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <Package className="h-4 w-4 text-brand-500" /> 2. Scope & Pricing Items
                            </h2>
                            <button
                                type="button"
                                onClick={handleAddLineItem}
                                className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Scope Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {data.line_items.map((item, idx) => (
                                <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2">
                                    {products.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-neutral-500">Pick from Catalog:</span>
                                            <Select
                                                size="sm"
                                                value={item.product_id || ''}
                                                onChange={(e) => handleSelectProduct(idx, e.target.value)}
                                            >
                                                <option value="">Custom Service</option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} (${p.price})
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <Input
                                            size="sm"
                                            type="text"
                                            placeholder="Item description"
                                            value={item.name}
                                            onChange={(e) => handleLineItemChange(idx, 'name', e.target.value)}
                                            wrapperClassName="flex-1"
                                            required
                                        />
                                        <Input
                                            size="sm"
                                            type="number"
                                            min="1"
                                            placeholder="Qty"
                                            value={item.quantity || 1}
                                            onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                                            wrapperClassName="w-20"
                                            className="text-center"
                                        />
                                        <Input
                                            size="sm"
                                            type="number"
                                            step="0.01"
                                            placeholder="Price"
                                            value={item.price}
                                            onChange={(e) => handleLineItemChange(idx, 'price', e.target.value)}
                                            leftElement={<span className="text-xs text-neutral-400">$</span>}
                                            wrapperClassName="w-28"
                                            className="text-right"
                                            required
                                        />
                                        {data.line_items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLineItem(idx)}
                                                className="p-1.5 text-neutral-400 hover:text-red-600 rounded"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Financial Totals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Input
                                    label="Discount ($)"
                                    type="number"
                                    step="0.01"
                                    value={data.discount_amount}
                                    onChange={(e) => setData('discount_amount', e.target.value)}
                                />
                                <Input
                                    label="Tax Rate (%)"
                                    type="number"
                                    step="0.1"
                                    value={data.tax_rate}
                                    onChange={(e) => setData('tax_rate', e.target.value)}
                                />
                            </div>

                            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg space-y-1 text-xs text-neutral-600 dark:text-neutral-300 self-end">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Discount:</span>
                                        <span>-${discount.toFixed(2)}</span>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between">
                                        <span>Tax ({data.tax_rate}%):</span>
                                        <span>+${tax.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold text-neutral-900 dark:text-neutral-100 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                                    <span>Total Estimate:</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Legal Agreement & E-Signature Terms with Dynamic Variable Helper */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" /> 3. Legal Contract Terms & Dynamic Tokens
                            </h2>
                        </div>

                        {/* Token helper chips */}
                        <div>
                            <span className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1 mb-1.5">
                                <Sparkles className="h-3 w-3 text-brand-500" /> Insert Dynamic Variable:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {tokenHelpers.map((th, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => insertToken(th.token)}
                                        className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30 text-[10px] font-medium text-neutral-700 dark:text-neutral-300 transition"
                                    >
                                        + {th.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            rows={6}
                            value={data.contract_terms}
                            onChange={(e) => setData('contract_terms', e.target.value)}
                            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 font-mono leading-relaxed"
                            placeholder="Type contract terms with dynamic tokens like {{contact.name}}..."
                        />
                    </div>

                    {/* Submit Bar */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Link
                            href={route('client.agency.proposals.index')}
                            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                        >
                            Cancel
                        </Link>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={processing}
                        >
                            {processing ? 'Saving...' : isEditing ? 'Update Proposal' : 'Save Proposal & Contract'}
                        </Button>
                    </div>
                </form>
            </div>
        </ClientLayout>
    );
}
