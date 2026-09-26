import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import { 
    CreditCard, Plus, Search, ExternalLink, CheckCircle, Clock, Send, 
    Trash2, DollarSign, Copy, Check, User, FileText, Share2, Package, Tag
} from 'lucide-react';

export default function InvoicesIndex({ invoices = { data: [] }, contacts = [], products = [], filters = {} }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        contact_id: '',
        billing_type: 'one_time',
        tax_rate: 0,
        discount_amount: 0,
        due_date: '',
        line_items: [{ product_id: '', name: 'Professional Service Retainer', price: 1000, quantity: 1 }],
        installments: [],
    });

    const handleAddLineItem = () => {
        setData('line_items', [...data.line_items, { product_id: '', name: '', price: 0, quantity: 1 }]);
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

    const subtotal = data.line_items.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
    const discount = parseFloat(data.discount_amount) || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * ((parseFloat(data.tax_rate) || 0) / 100);
    const total = taxable + tax;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('client.agency.invoices.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            },
        });
    };

    const handleCopyPayLink = (inv) => {
        const url = route('agency.invoices.checkout', inv.uuid);
        navigator.clipboard.writeText(url);
        setCopiedId(inv.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <ClientLayout title="Invoices & Billing">
            <Head title="B2B Invoices — WhatsMine" />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Header Card */}
                <Card padding={true} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-brand-600 dark:text-brand-400" /> Invoices & Billing
                        </h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            Create B2B tax invoices from your global product catalog, generate 1-click payment links, and trigger automated workflows.
                        </p>
                    </div>

                    <Button
                        variant="primary"
                        onClick={() => setShowCreateModal(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" /> Create Invoice
                    </Button>
                </Card>

                {/* Invoices Table Card */}
                <Card padding={false} className="overflow-hidden">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search invoices..."
                                defaultValue={filters.search || ''}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.get(route('client.agency.invoices.index'), { search: e.target.value }, { preserveState: true });
                                    }
                                }}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 pl-9 pr-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 uppercase tracking-wider text-[10px] font-bold text-neutral-400">
                                <tr>
                                    <th className="px-4 py-3">Invoice #</th>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Total Amount</th>
                                    <th className="px-4 py-3">Balance Due</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Due Date</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {invoices.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-10 text-neutral-400">
                                            No invoices found. Click "Create Invoice" to issue your first invoice.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.data.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                                <FileText className="h-3.5 w-3.5 text-brand-500" />
                                                {inv.invoice_number}
                                            </td>
                                            <td className="px-4 py-3">
                                                {inv.contact ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                                            {trimContactName(inv.contact)}
                                                        </span>
                                                        <span className="text-[10px] text-neutral-400">{inv.contact.email || inv.contact.phone_e164}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400 italic">No contact assigned</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 capitalize">
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 font-medium">
                                                    {(inv.billing_type || 'one_time').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                                                ${parseFloat(inv.total).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300">
                                                ${parseFloat(inv.balance_due ?? inv.total).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={
                                                        inv.status === 'paid' ? 'success' :
                                                        inv.status === 'partially_paid' ? 'primary' :
                                                        inv.status === 'overdue' ? 'danger' : 'warning'
                                                    }
                                                    size="sm"
                                                >
                                                    {inv.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                    {inv.status === 'unpaid' && <Clock className="h-3 w-3 mr-1" />}
                                                    {inv.status.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        size="xs"
                                                        variant="secondary"
                                                        onClick={() => handleCopyPayLink(inv)}
                                                        title="Copy Payment Link"
                                                    >
                                                        {copiedId === inv.id ? (
                                                            <><Check className="h-3 w-3 text-emerald-600 mr-1" /> Copied</>
                                                        ) : (
                                                            <><Copy className="h-3 w-3 mr-1" /> Pay Link</>
                                                        )}
                                                    </Button>
                                                    <a
                                                        href={route('agency.invoices.checkout', inv.uuid)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-brand-600"
                                                        title="Open Checkout View"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Create Invoice Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <Plus className="h-4 w-4 text-brand-600" /> Create B2B Invoice
                            </h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Contact Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Client Contact *
                                    </label>
                                    <select
                                        value={data.contact_id}
                                        onChange={(e) => setData('contact_id', e.target.value)}
                                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-brand-500"
                                        required
                                    >
                                        <option value="">Select a Contact...</option>
                                        {contacts.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.email ? `(${c.email})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.contact_id && <p className="text-red-500 text-[10px] mt-1">{errors.contact_id}</p>}
                                </div>

                                {/* Billing Type */}
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Billing Model
                                    </label>
                                    <select
                                        value={data.billing_type}
                                        onChange={(e) => setData('billing_type', e.target.value)}
                                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="one_time">One-Time Invoice</option>
                                        <option value="recurring">Recurring Retainer</option>
                                        <option value="installments">Milestone Split-Pay</option>
                                    </select>
                                </div>
                            </div>

                            {/* Line Items with Global Products Dropdown */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                        <Package className="h-3.5 w-3.5 text-brand-500" /> Line Items & Services
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddLineItem}
                                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Item
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {data.line_items.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-2">
                                            {/* Product picker */}
                                            {products.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-medium text-neutral-500">Pick from Catalog:</span>
                                                    <select
                                                        value={item.product_id || ''}
                                                        onChange={(e) => handleSelectProduct(idx, e.target.value)}
                                                        className="text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-neutral-900 dark:text-neutral-100"
                                                    >
                                                        <option value="">Custom Item / Service</option>
                                                        {products.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} (${p.price})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Item or service description"
                                                    value={item.name}
                                                    onChange={(e) => handleLineItemChange(idx, 'name', e.target.value)}
                                                    className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                                                    required
                                                />
                                                <div className="relative w-24">
                                                    <span className="absolute left-2.5 top-1.5 text-xs text-neutral-400">$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Price"
                                                        step="0.01"
                                                        value={item.price}
                                                        onChange={(e) => handleLineItemChange(idx, 'price', e.target.value)}
                                                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 pl-6 pr-2 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 text-right"
                                                        required
                                                    />
                                                </div>
                                                <div className="w-16">
                                                    <input
                                                        type="number"
                                                        placeholder="Qty"
                                                        min="1"
                                                        value={item.quantity || 1}
                                                        onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                                                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 text-center"
                                                    />
                                                </div>
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
                            </div>

                            {/* Discounts & Taxes */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Discount ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.discount_amount}
                                        onChange={(e) => setData('discount_amount', e.target.value)}
                                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Tax Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={data.tax_rate}
                                        onChange={(e) => setData('tax_rate', e.target.value)}
                                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Payment Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                                    />
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
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
                                    <span>Total Amount:</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={processing}
                                >
                                    {processing ? 'Generating...' : 'Save & Issue Invoice'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ClientLayout>
    );
}

function trimContactName(contact) {
    const full = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    return full || contact.email || contact.phone_e164 || `Contact #${contact.id}`;
}
