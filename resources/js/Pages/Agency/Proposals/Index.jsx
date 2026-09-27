import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Pagination from '@/Components/ui/Pagination';
import { 
    FileText, Plus, Search, ExternalLink, CheckCircle, Clock, Send, 
    Trash2, DollarSign, Copy, Check, User, Calendar
} from 'lucide-react';

export default function ProposalsIndex({ proposals = { data: [] }, filters = {} }) {
    const [copiedId, setCopiedId] = useState(null);

    const handleCopyLink = (p) => {
        const url = route('agency.proposals.show', p.uuid);
        navigator.clipboard.writeText(url);
        setCopiedId(p.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted': return <Badge variant="success" size="sm" className="uppercase text-[10px]">Accepted</Badge>;
            case 'viewed': return <Badge variant="brand" size="sm" className="uppercase text-[10px]">Viewed</Badge>;
            case 'declined': return <Badge variant="danger" size="sm" className="uppercase text-[10px]">Declined</Badge>;
            default: return <Badge variant="warning" size="sm" className="uppercase text-[10px]">{status || 'Draft'}</Badge>;
        }
    };

    return (
        <ClientLayout title="Proposals & Estimates">
            <Head title="Proposals & Estimates — WhatsMine" />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Top Action Header */}
                <Card padding={true} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Proposals & E-Contracts
                        </h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Create interactive web proposals, capture e-signatures, and auto-convert to B2B invoices.</p>
                    </div>

                    <Link
                        href={route('client.agency.proposals.create')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs rounded-soft transition shadow-soft shrink-0"
                    >
                        <Plus className="h-4 w-4" /> Create Proposal
                    </Link>
                </Card>

                {/* Proposals Table */}
                <Card padding={false} className="overflow-hidden">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <div className="w-64">
                            <Input
                                size="sm"
                                placeholder="Search proposals..."
                                defaultValue={filters.search || ''}
                                leftIcon={<Search className="h-4 w-4 text-neutral-400" />}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.get(route('client.agency.proposals.index'), { search: e.target.value }, { preserveState: true });
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 uppercase tracking-wider text-[10px] font-bold text-neutral-400">
                                <tr>
                                    <th className="px-4 py-3">Proposal Title</th>
                                    <th className="px-4 py-3">Client Contact</th>
                                    <th className="px-4 py-3">Total Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {proposals.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-neutral-400 italic">
                                            No proposals created yet. Click "+ Create Proposal" to send your first estimate.
                                        </td>
                                    </tr>
                                ) : (
                                    proposals.data.map((p) => (
                                        <tr key={p.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition">
                                            <td className="px-4 py-3.5 font-bold text-neutral-900 dark:text-white">
                                                {p.title}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {p.contact ? (
                                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{p.contact.first_name} {p.contact.last_name}</span>
                                                ) : (
                                                    <span className="text-neutral-400 italic">No contact assigned</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                ${parseFloat(p.total).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {getStatusBadge(p.status)}
                                            </td>
                                            <td className="px-4 py-3.5 text-neutral-500 dark:text-neutral-400 font-mono">
                                                {new Date(p.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3.5 text-right space-x-2">
                                                <Link
                                                    href={route('client.agency.proposals.edit', p.id)}
                                                    className="px-2.5 py-1 rounded-soft bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition"
                                                >
                                                    Edit
                                                </Link>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleCopyLink(p)}
                                                    className="text-xs"
                                                >
                                                    {copiedId === p.id ? <span className="text-emerald-500 flex items-center gap-1"><Check className="h-3 w-3" /> Copied</span> : 'Copy Link'}
                                                </Button>
                                                <a
                                                    href={route('agency.proposals.show', p.uuid)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-soft bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-500/20 text-xs transition"
                                                >
                                                    <ExternalLink className="h-3 w-3" /> View
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {proposals.links && <Pagination data={proposals} />}
                </Card>
            </div>
        </ClientLayout>
    );
}
