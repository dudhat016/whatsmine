import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { 
    CreditCard, ShieldCheck, Lock, Sparkles, Check, DollarSign, 
    ChevronRight, Zap, CheckCircle, Download
} from 'lucide-react';

export default function InvoicePublicCheckout({ invoice = {} }) {
    const { post, processing } = useForm({});

    const isPaid = invoice.status === 'paid';

    const handlePaySubmit = (e) => {
        e.preventDefault();
        post(route('agency.invoices.pay', invoice.uuid));
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-start p-4 md:p-8 font-sans">
            <Head title={`Invoice: ${invoice.invoice_number}`} />

            {/* Header branding */}
            <div className="max-w-xl w-full flex items-center justify-between py-4 mb-6 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-base tracking-wider">
                    <Sparkles className="h-5 w-5" /> WhatsMine Checkout
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href={route('agency.invoices.pdf', invoice.uuid)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-[11px] font-semibold text-neutral-300 transition flex items-center gap-1"
                    >
                        <Download className="h-3 w-3" /> PDF Tax Invoice
                    </a>
                    <span className="text-xs text-neutral-400 font-mono font-bold">
                        {invoice.invoice_number}
                    </span>
                </div>
            </div>

            {/* Main Checkout Container */}
            <div className="max-w-xl w-full space-y-6">
                <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                            📜 Official B2B Tax Invoice
                        </span>
                        <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                            {invoice.status}
                        </span>
                    </div>

                    <div>
                        <h1 className="text-xl font-black text-white">
                            Invoice #{invoice.invoice_number}
                        </h1>
                        <p className="text-xs text-neutral-400 mt-1">
                            Billed to: <strong className="text-neutral-200">{invoice.contact?.name || 'Client Contact'}</strong> ({invoice.contact?.email || 'N/A'})
                        </p>
                    </div>

                    {/* Line Items Breakdown */}
                    <div className="space-y-2 pt-3 border-t border-neutral-800 text-xs">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Service Line Items</span>
                        {(invoice.line_items || []).map((item, idx) => (
                            <div key={idx} className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
                                <span className="font-semibold text-neutral-200">{item.name}</span>
                                <span className="font-mono font-bold text-emerald-400">${parseFloat(item.price || 0).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Subtotal & Tax */}
                    <div className="space-y-1.5 pt-3 border-t border-neutral-800 text-xs">
                        <div className="flex justify-between text-neutral-400 text-[11px]">
                            <span>Subtotal:</span>
                            <span className="font-mono">${(invoice.subtotal || 0).toFixed(2)}</span>
                        </div>
                        {invoice.tax_rate > 0 && (
                            <div className="flex justify-between text-neutral-400 text-[11px]">
                                <span>Tax ({invoice.tax_rate}%):</span>
                                <span className="font-mono">${(invoice.tax_amount || 0).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 text-base font-black text-white border-t border-neutral-800">
                            <span>Total Due:</span>
                            <span className="text-2xl font-mono text-emerald-400">${(invoice.total || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Execution Action */}
                    {isPaid ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1.5">
                            <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
                            <div className="text-sm font-bold text-emerald-400">Payment Complete</div>
                            <p className="text-xs text-neutral-400">Paid on {new Date(invoice.paid_at).toLocaleDateString()}</p>
                        </div>
                    ) : (
                        <form onSubmit={handlePaySubmit} className="space-y-3 pt-2">
                            <div className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                                <Lock className="h-3 w-3 text-emerald-400" /> 256-bit SSL Encrypted Secure Checkout
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                            >
                                <Zap className="h-4 w-4 fill-current" /> Pay ${(invoice.total || 0).toFixed(2)} Now
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
