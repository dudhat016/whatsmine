import React, { useState } from 'react';
import ClientLayout from '@/Layouts/ClientLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Globe, 
    Plus, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    ExternalLink, 
    RefreshCw, 
    Trash2, 
    Settings2, 
    Copy, 
    Check, 
    ShieldCheck, 
    HelpCircle, 
    ArrowRight, 
    Sparkles, 
    Layers, 
    ShoppingBag, 
    Calendar as CalendarIcon, 
    Building2,
    Lock,
    Search
} from 'lucide-react';
import { Button, Input, Select, Badge, Card, Modal } from '@/Components/ui';
import { useConfirm } from '@/context/ConfirmationContext';
import axios from 'axios';

export default function DomainsIndex({ 
    domains = [], 
    funnels = [], 
    stores = [], 
    calendars = [], 
    cnameTarget = 'custom.whatsmine.com', 
    aRecordTarget = '162.159.137.91' 
}) {
    const { confirm } = useConfirm();

    // Local state
    const [domainList, setDomainList] = useState(domains);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDnsModalOpen, setIsDnsModalOpen] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [verifyingId, setVerifyingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedField, setCopiedField] = useState(null);

    // Add Form State
    const [newDomain, setNewDomain] = useState('');
    const [newType, setNewType] = useState('funnel');
    const [newTargetId, setNewTargetId] = useState('');
    const [newFallbackUrl, setNewFallbackUrl] = useState('');
    const [addingLoading, setAddingLoading] = useState(false);
    const [addError, setAddError] = useState('');

    // Edit Form State
    const [editType, setEditType] = useState('funnel');
    const [editTargetId, setEditTargetId] = useState('');
    const [editFallbackUrl, setEditFallbackUrl] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleOpenAdd = () => {
        setNewDomain('');
        setNewType('funnel');
        setNewTargetId(funnels[0]?.id || '');
        setNewFallbackUrl('');
        setAddError('');
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (d) => {
        setSelectedDomain(d);
        setEditType(d.type || 'funnel');
        setEditTargetId(d.target_id || '');
        setEditFallbackUrl(d.fallback_url || '');
        setIsEditModalOpen(true);
    };

    const handleOpenDns = (d) => {
        setSelectedDomain(d);
        setIsDnsModalOpen(true);
    };

    const handleAddDomain = async (e) => {
        e.preventDefault();
        setAddingLoading(true);
        setAddError('');

        try {
            const res = await axios.post(route('client.settings.domains.store'), {
                domain: newDomain,
                type: newType,
                target_id: newTargetId || null,
                fallback_url: newFallbackUrl || null,
            });

            if (res.data.success) {
                setIsAddModalOpen(false);
                router.reload({ preserveScroll: true });
            }
        } catch (err) {
            setAddError(err.response?.data?.message || err.response?.data?.errors?.domain?.[0] || 'Failed to add custom domain.');
        } finally {
            setAddingLoading(false);
        }
    };

    const handleVerifyDomain = async (domain) => {
        setVerifyingId(domain.id);
        try {
            const res = await axios.post(route('client.settings.domains.verify', domain.id));
            if (res.data) {
                setDomainList(prev => prev.map(item => item.id === domain.id ? {
                    ...item,
                    is_verified: res.data.custom_domain.is_verified,
                    dns_status: res.data.custom_domain.dns_status,
                    ssl_status: res.data.custom_domain.ssl_status,
                    dns_records: res.data.custom_domain.dns_records,
                } : item));
                
                if (selectedDomain?.id === domain.id) {
                    setSelectedDomain(res.data.custom_domain);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setVerifyingId(null);
        }
    };

    const handleUpdateDomain = async (e) => {
        e.preventDefault();
        if (!selectedDomain) return;
        setEditLoading(true);

        try {
            const res = await axios.put(route('client.settings.domains.update', selectedDomain.id), {
                type: editType,
                target_id: editTargetId || null,
                fallback_url: editFallbackUrl || null,
            });

            if (res.data.success) {
                setIsEditModalOpen(false);
                router.reload({ preserveScroll: true });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteDomain = (domain) => {
        confirm({
            title: `Remove Custom Domain`,
            message: `Are you sure you want to disconnect '${domain.domain}'? Traffic sent to this domain will no longer be routed to your funnels or app portal.`,
            confirmText: 'Yes, Remove Domain',
            confirmVariant: 'danger',
            onConfirm: async () => {
                await axios.delete(route('client.settings.domains.destroy', domain.id));
                setDomainList(prev => prev.filter(item => item.id !== domain.id));
            }
        });
    };

    const getTypeMeta = (type) => {
        switch (type) {
            case 'app_whitelabel':
                return { label: 'Agency App Portal', icon: Building2, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
            case 'ecommerce':
                return { label: 'E-Commerce Store', icon: ShoppingBag, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
            case 'booking':
                return { label: 'Booking Calendar', icon: CalendarIcon, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
            case 'funnel':
            default:
                return { label: 'Sales Funnel', icon: Layers, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
        }
    };

    const filteredDomains = domainList.filter(d => 
        d.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.target_name && d.target_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const verifiedCount = domainList.filter(d => d.is_verified).length;
    const sslCount = domainList.filter(d => d.ssl_status === 'active').length;

    return (
        <ClientLayout title="Custom Domains & Whitelabel">
            <Head title="Custom Domains & Whitelabel" />

            <div className="space-y-6 pb-12">
                {/* Header Title & CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    Custom Domains & Whitelabel
                                </h1>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Connect branded domains for your Agency App Portal, Sales Funnels, E-Commerce, and Calendars with automated SSL.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button 
                        variant="primary" 
                        onClick={handleOpenAdd}
                        className="gap-2 font-bold shadow-sm self-start sm:self-auto"
                    >
                        <Plus className="h-4 w-4" /> Connect New Domain
                    </Button>
                </div>

                {/* Overview Stats & Global DNS Instructions Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Stat Card 1 */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Total Connected</span>
                            <span className="text-2xl font-black text-neutral-900 dark:text-white mt-1 block">{domainList.length}</span>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                            <Globe className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">DNS Verified</span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{verifiedCount}</span>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">SSL Certificates</span>
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{sslCount} Active</span>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Interactive DNS Setup Quick Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-800 text-white shadow-md border border-neutral-700/60">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 font-mono text-[11px] font-bold border border-brand-500/30">
                                    DNS Configuration Guide
                                </span>
                                <span className="text-xs text-neutral-400">Add this record in your Cloudflare, GoDaddy, or Namecheap DNS settings:</span>
                            </div>
                            <p className="text-xs text-neutral-300">
                                For subdomains (e.g. <code className="text-brand-300 font-mono">app.yourdomain.com</code> or <code className="text-brand-300 font-mono">go.yourdomain.com</code>), create a <strong>CNAME</strong> record pointing to your server.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            {/* CNAME Chip */}
                            <div className="flex items-center bg-neutral-950/80 border border-neutral-700 rounded-xl px-3.5 py-2 gap-3 text-xs">
                                <div>
                                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">CNAME Target</span>
                                    <span className="font-mono font-bold text-neutral-200">{cnameTarget}</span>
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(cnameTarget, 'cname')}
                                    className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                                    title="Copy CNAME"
                                >
                                    {copiedField === 'cname' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Apex A-Record Chip */}
                            <div className="flex items-center bg-neutral-950/80 border border-neutral-700 rounded-xl px-3.5 py-2 gap-3 text-xs">
                                <div>
                                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Apex (A Record)</span>
                                    <span className="font-mono font-bold text-neutral-200">{aRecordTarget}</span>
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(aRecordTarget, 'ip')}
                                    className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                                    title="Copy IP"
                                >
                                    {copiedField === 'ip' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Domain List Container */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                    {/* Filter Bar */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="w-full sm:w-80">
                            <Input
                                type="text"
                                leftIcon={Search}
                                placeholder="Search connected domains..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <span className="text-xs text-neutral-500 font-medium self-end sm:self-auto">
                            Showing {filteredDomains.length} of {domainList.length} domain{domainList.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Table / Empty State */}
                    {filteredDomains.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="h-16 w-16 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
                                <Globe className="h-8 w-8" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">No custom domains connected</h3>
                            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                                Connect your first custom domain or subdomain to run white-labeled sales funnels, booking portals, or an agency SaaS portal.
                            </p>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleOpenAdd}
                                className="mt-4 gap-1.5"
                            >
                                <Plus className="h-4 w-4" /> Connect Domain
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-neutral-50/70 dark:bg-neutral-800/40 text-neutral-500 uppercase font-semibold text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                                        <th className="py-3 px-4">Domain Name</th>
                                        <th className="py-3 px-4">Type & Purpose</th>
                                        <th className="py-3 px-4">Destination Target</th>
                                        <th className="py-3 px-4">DNS Status</th>
                                        <th className="py-3 px-4">SSL Security</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {filteredDomains.map((d) => {
                                        const typeMeta = getTypeMeta(d.type);
                                        const TypeIcon = typeMeta.icon;
                                        const isVerifying = verifyingId === d.id;

                                        return (
                                            <tr key={d.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition">
                                                {/* Domain Name */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <a 
                                                            href={`https://${d.domain}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="font-mono font-bold text-neutral-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1.5 group"
                                                        >
                                                            {d.domain}
                                                            <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition text-neutral-400" />
                                                        </a>
                                                    </div>
                                                    <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono">
                                                        Added {d.created_at}
                                                    </span>
                                                </td>

                                                {/* Type Badge */}
                                                <td className="py-4 px-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${typeMeta.color}`}>
                                                        <TypeIcon className="h-3.5 w-3.5" />
                                                        {typeMeta.label}
                                                    </div>
                                                </td>

                                                {/* Destination Target */}
                                                <td className="py-4 px-4">
                                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 block truncate max-w-[200px]" title={d.target_name}>
                                                        {d.target_name}
                                                    </span>
                                                    {d.fallback_url && (
                                                        <span className="text-[10px] text-neutral-400 truncate block max-w-[200px]">
                                                            Fallback: {d.fallback_url}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* DNS Status */}
                                                <td className="py-4 px-4">
                                                    {d.is_verified ? (
                                                        <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                                                            <CheckCircle2 className="h-4 w-4" /> Connected
                                                        </div>
                                                    ) : d.dns_status === 'pending' ? (
                                                        <div className="inline-flex items-center gap-1 text-amber-500 font-semibold text-xs">
                                                            <Clock className="h-4 w-4" /> Pending DNS
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1 text-red-500 font-semibold text-xs">
                                                            <AlertTriangle className="h-4 w-4" /> DNS Failed
                                                        </div>
                                                    )}
                                                </td>

                                                {/* SSL Status */}
                                                <td className="py-4 px-4">
                                                    {d.ssl_status === 'active' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                                                            <Lock className="h-3 w-3" /> HTTPS Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono text-[10px]">
                                                            Pending Issuance
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                                        {/* Verify Button */}
                                                        <Button
                                                            size="xs"
                                                            variant="outline"
                                                            disabled={isVerifying}
                                                            onClick={() => handleVerifyDomain(d)}
                                                            className="gap-1 font-semibold"
                                                            title="Check DNS status"
                                                        >
                                                            <RefreshCw className={`h-3.5 w-3.5 ${isVerifying ? 'animate-spin text-brand-600' : ''}`} />
                                                            {isVerifying ? 'Checking...' : 'Verify'}
                                                        </Button>

                                                        {/* DNS Inspector */}
                                                        <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            onClick={() => handleOpenDns(d)}
                                                            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                                                            title="View DNS Records"
                                                        >
                                                            <HelpCircle className="h-4 w-4" />
                                                        </Button>

                                                        {/* Edit Target */}
                                                        <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            onClick={() => handleOpenEdit(d)}
                                                            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                                                            title="Configure Target"
                                                        >
                                                            <Settings2 className="h-4 w-4" />
                                                        </Button>

                                                        {/* Delete */}
                                                        <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteDomain(d)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            title="Remove Domain"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Connect New Domain */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} size="lg">
                <form onSubmit={handleAddDomain}>
                    <Modal.Header onClose={() => setIsAddModalOpen(false)}>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center">
                                <Globe className="h-4 w-4" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Connect Custom Domain</h3>
                        </div>
                    </Modal.Header>

                    <Modal.Body className="space-y-5">
                        {addError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>{addError}</span>
                            </div>
                        )}

                        {/* Domain Input */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                Domain Name / Subdomain
                            </label>
                            <Input
                                type="text"
                                required
                                placeholder="e.g. app.myagency.com or go.mybrand.com"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                            />
                            <p className="text-[11px] text-neutral-400 mt-1">
                                Enter your full domain or subdomain without http:// or https://.
                            </p>
                        </div>

                        {/* Purpose Selector */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                                Purpose & Routing
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { id: 'funnel', label: 'Sales Funnel', desc: 'Direct visitors to landing pages & checkout funnels', icon: Layers },
                                    { id: 'app_whitelabel', label: 'Agency App Portal', desc: 'White-labeled dashboard & login screen for clients', icon: Building2 },
                                    { id: 'ecommerce', label: 'E-Commerce Store', desc: 'Product catalogs & digital vault checkout', icon: ShoppingBag },
                                    { id: 'booking', label: 'Booking Calendars', desc: 'Appointment booking and meeting scheduling', icon: CalendarIcon },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    const isSelected = newType === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setNewType(item.id)}
                                            className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                                                isSelected 
                                                    ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/30 dark:bg-brand-950/20' 
                                                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-800/40'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon className={`h-4 w-4 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-500'}`} />
                                                <span className={`text-xs font-bold ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-900 dark:text-white'}`}>
                                                    {item.label}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-neutral-400 leading-snug">
                                                {item.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Target Selection Dropdown */}
                        {newType === 'funnel' && funnels.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                    Target Funnel
                                </label>
                                <Select
                                    value={newTargetId}
                                    onChange={(e) => setNewTargetId(e.target.value)}
                                >
                                    <option value="">Select a Funnel...</option>
                                    {funnels.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} ({f.slug})</option>
                                    ))}
                                </Select>
                            </div>
                        )}

                        {newType === 'ecommerce' && stores.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                    Target Store
                                </label>
                                <Select
                                    value={newTargetId}
                                    onChange={(e) => setNewTargetId(e.target.value)}
                                >
                                    <option value="">All Products & Default Store</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </Select>
                            </div>
                        )}

                        {newType === 'booking' && calendars.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                    Target Calendar
                                </label>
                                <Select
                                    value={newTargetId}
                                    onChange={(e) => setNewTargetId(e.target.value)}
                                >
                                    <option value="">All Booking Services</option>
                                    {calendars.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </Select>
                            </div>
                        )}

                        {/* DNS Instructions Preview Box */}
                        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs space-y-2">
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 block">Required DNS Record:</span>
                            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                                <div>
                                    <span className="text-neutral-400 block text-[9px] uppercase">Type</span>
                                    <span className="font-bold text-neutral-900 dark:text-white">CNAME</span>
                                </div>
                                <div>
                                    <span className="text-neutral-400 block text-[9px] uppercase">Host / Name</span>
                                    <span className="font-bold text-neutral-900 dark:text-white">
                                        {newDomain.split('.')[0] || 'subdomain'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-neutral-400 block text-[9px] uppercase">Target / Value</span>
                                    <span className="font-bold text-brand-600 dark:text-brand-400">{cnameTarget}</span>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={addingLoading || !newDomain.trim()}>
                            {addingLoading ? 'Validating...' : 'Connect Domain'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Modal: Edit Domain Settings */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <form onSubmit={handleUpdateDomain}>
                    <Modal.Header onClose={() => setIsEditModalOpen(false)}>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                            Configure {selectedDomain?.domain}
                        </h3>
                    </Modal.Header>

                    <Modal.Body className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                Purpose & Routing Type
                            </label>
                            <Select value={editType} onChange={(e) => setEditType(e.target.value)}>
                                <option value="funnel">Sales Funnel</option>
                                <option value="app_whitelabel">Agency App Portal</option>
                                <option value="ecommerce">E-Commerce Storefront</option>
                                <option value="booking">Booking Calendar</option>
                                <option value="universal">Universal</option>
                            </Select>
                        </div>

                        {editType === 'funnel' && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                    Assigned Funnel
                                </label>
                                <Select value={editTargetId} onChange={(e) => setEditTargetId(e.target.value)}>
                                    <option value="">Select a Funnel...</option>
                                    {funnels.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </Select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                                Fallback Redirect URL (Optional)
                            </label>
                            <Input
                                type="url"
                                placeholder="https://example.com/home"
                                value={editFallbackUrl}
                                onChange={(e) => setEditFallbackUrl(e.target.value)}
                            />
                        </div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={editLoading}>
                            {editLoading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Modal: Live DNS Inspector */}
            <Modal isOpen={isDnsModalOpen} onClose={() => setIsDnsModalOpen(false)} size="md">
                <Modal.Header onClose={() => setIsDnsModalOpen(false)}>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-brand-500" />
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                            DNS Diagnostics: {selectedDomain?.domain}
                        </h3>
                    </div>
                </Modal.Header>

                <Modal.Body className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs space-y-2">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 block">Expected Configuration:</span>
                        <div className="font-mono text-[11px] space-y-1">
                            <div>CNAME: <strong className="text-brand-600 dark:text-brand-400">{selectedDomain?.expected_cname}</strong></div>
                            <div>Apex (A Record): <strong className="text-neutral-600 dark:text-neutral-300">{selectedDomain?.expected_ip}</strong></div>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs space-y-2">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 block">Detected DNS Records:</span>
                        {selectedDomain?.dns_records?.detected_cname?.length > 0 ? (
                            <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                                CNAME: {selectedDomain.dns_records.detected_cname.join(', ')}
                            </div>
                        ) : selectedDomain?.dns_records?.detected_a?.length > 0 ? (
                            <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                                A Record IP: {selectedDomain.dns_records.detected_a.join(', ')}
                            </div>
                        ) : (
                            <span className="text-neutral-400 font-mono text-[11px] block">No CNAME or A records detected yet. DNS changes can take a few minutes to propagate worldwide.</span>
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="outline" onClick={() => setIsDnsModalOpen(false)}>
                        Close
                    </Button>
                    <Button 
                        variant="primary" 
                        disabled={verifyingId === selectedDomain?.id}
                        onClick={() => handleVerifyDomain(selectedDomain)}
                        className="gap-1.5"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${verifyingId === selectedDomain?.id ? 'animate-spin' : ''}`} />
                        Verify Again
                    </Button>
                </Modal.Footer>
            </Modal>
        </ClientLayout>
    );
}
