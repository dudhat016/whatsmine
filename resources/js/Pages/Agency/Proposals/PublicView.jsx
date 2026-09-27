import React, { useState, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { 
    FileText, CheckCircle, ShieldCheck, Lock, Sparkles, Send, Check, 
    Clock, DollarSign, ChevronRight, PenTool, User, Mail, Download, MessageSquare, X
} from 'lucide-react';
import { useConfirm } from '@/context/ConfirmationContext';
import { Input } from '@/Components/ui';

export default function ProposalPublicView({ proposal = {} }) {
    const { alert } = useConfirm();
    const { branding } = usePage().props;
    const [signMode, setSignMode] = useState('type'); // type | draw
    const [typedName, setTypedName] = useState('');
    const [drawing, setDrawing] = useState(false);
    const [showSignModal, setShowSignModal] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const canvasRef = useRef(null);

    const currencyCode = proposal.workspace?.currency_code || 'USD';
    const workspaceName = proposal.workspace?.name || branding?.appName || 'WhatsMine Agency';
    const workspaceLogo = proposal.workspace?.logo_url || branding?.logo_url;
    const workspaceAddress = proposal.workspace?.address || branding?.companyAddress || 'Main Workspace Address';
    const workspacePhone = proposal.workspace?.phone || branding?.companyPhone || '+1 234 567 890';
    const workspaceEmail = proposal.workspace?.email || branding?.companyEmail || 'info@agency.com';

    const { data, setData, post, processing, errors } = useForm({
        full_name: '',
        email: '',
        signature_data: '',
    });

    const revisionForm = useForm({
        notes: '',
    });

    const handleRevisionSubmit = (e) => {
        e.preventDefault();
        revisionForm.post(route('agency.proposals.revision', proposal.uuid), {
            onSuccess: () => setShowRevisionModal(false),
        });
    };

    const isSigned = proposal.contract?.status === 'signed';

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setDrawing(true);
    };

    const draw = (e) => {
        if (!drawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (drawing) {
            setDrawing(false);
            if (canvasRef.current) {
                setData('signature_data', canvasRef.current.toDataURL());
            }
        }
    };

    const handleClearCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setData('signature_data', '');
        }
    };

    const handleSubmitSign = (e) => {
        e.preventDefault();
        const sigVal = signMode === 'type' ? typedName : (data.signature_data || canvasRef.current?.toDataURL());
        if (!sigVal) {
            alert({
                title: 'Signature Required',
                message: 'Please provide your signature before submitting.',
                variant: 'warning',
            });
            return;
        }

        post(route('agency.contracts.sign', proposal.contract.uuid), {
            data: {
                ...data,
                signature_data: sigVal,
            },
            onSuccess: () => setShowSignModal(false),
        });
    };

    const getStatusBadge = () => {
        const s = proposal.status || 'waiting';
        if (s === 'accepted' || isSigned) {
            return <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border border-emerald-500 text-emerald-400 bg-emerald-500/10">ACCEPTED</span>;
        }
        if (s === 'revision_requested') {
            return <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border border-amber-500 text-amber-400 bg-amber-500/10">REVISION REQUESTED</span>;
        }
        return <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded border-2 border-amber-400 text-amber-400 bg-amber-400/5">WAITING</span>;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 md:p-10 font-sans">
            <Head title={`Proposal: ${proposal.title}`} />

            {/* Document Container (Worksuite Style Paper) */}
            <div className="max-w-4xl w-full bg-white text-slate-800 rounded-lg shadow-2xl overflow-hidden border border-slate-200">
                
                {/* Document Header */}
                <div className="p-8 md:p-10 border-b border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        
                        {/* Company Logo & Address */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                {workspaceLogo ? (
                                    <img src={workspaceLogo} alt={workspaceName} className="h-10 w-10 object-contain rounded-md shadow" />
                                ) : (
                                    <div className="h-10 w-10 bg-amber-400 rounded-md flex items-center justify-center font-black text-slate-900 text-xl shadow">
                                        {workspaceName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h2 className="font-extrabold text-lg text-slate-900 leading-none">{workspaceName}</h2>
                                    <span className="text-xs text-slate-500">Official Sales Proposal</span>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500 leading-relaxed pt-1">
                                {workspaceAddress}<br />
                                {workspacePhone} • {workspaceEmail}
                            </div>
                        </div>

                        {/* Proposal Header Right & Metadata Grid */}
                        <div className="flex flex-col items-end space-y-3 w-full md:w-auto">
                            <h1 className="text-2xl font-black tracking-wider text-slate-900 uppercase">PROPOSAL</h1>
                            
                            <table className="text-xs border border-slate-200 rounded overflow-hidden">
                                <tbody>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <td className="px-3 py-1.5 font-bold text-slate-600 border-r border-slate-200">Proposal #</td>
                                        <td className="px-3 py-1.5 font-mono font-bold text-slate-900">Proposal#{proposal.id || proposal.uuid?.slice(0, 4)}</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td className="px-3 py-1.5 font-bold text-slate-600 border-r border-slate-200">Valid Till</td>
                                        <td className="px-3 py-1.5 font-mono text-slate-700">
                                            {proposal.valid_until ? new Date(proposal.valid_until).toLocaleDateString() : '30 Days'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Billed To & Status Row */}
                <div className="p-8 md:p-10 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Billed To</span>
                        <h3 className="text-base font-bold text-slate-900">{proposal.contact?.name || 'Client Lead'}</h3>
                        <p className="text-xs text-slate-600">{proposal.contact?.email || 'email@client.com'}</p>
                        {proposal.contact?.phone && <p className="text-xs text-slate-600">{proposal.contact.phone}</p>}
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2">
                        {getStatusBadge()}
                        {proposal.current_version && (
                            <button
                                type="button"
                                onClick={() => setShowHistoryModal(true)}
                                className="text-[11px] font-mono text-emerald-700 font-bold underline hover:text-emerald-800"
                            >
                                Version {proposal.current_version} (View Audit Log)
                            </button>
                        )}
                    </div>
                </div>

                {/* Proposal Title */}
                <div className="px-8 md:px-10 pt-8">
                    <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">{proposal.title}</h2>
                </div>

                {/* Line Items Table (Worksuite Style) */}
                <div className="p-8 md:p-10">
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="p-3.5">Description</th>
                                    <th className="p-3.5 text-center">Quantity</th>
                                    <th className="p-3.5 text-right">Unit Price ({currencyCode})</th>
                                    <th className="p-3.5 text-center">Tax</th>
                                    <th className="p-3.5 text-right">Amount ({currencyCode})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {(proposal.line_items || []).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition">
                                        <td className="p-3.5 font-medium text-slate-900">
                                            <div>{item.name || `Service Item #${idx + 1}`}</div>
                                            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                                                {item.description || 'Professional deliverable as detailed in scope agreement.'}
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-center font-mono text-slate-600">
                                            {item.quantity || 1} <span className="text-[10px] text-slate-400">Pcs</span>
                                        </td>
                                        <td className="p-3.5 text-right font-mono text-slate-700">
                                            {formatCurrency(item.price || 0, currencyCode)}
                                        </td>
                                        <td className="p-3.5 text-center text-slate-400 font-mono">
                                            -
                                        </td>
                                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                                            {formatCurrency((item.price || 0) * (item.quantity || 1), currencyCode)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Sub Total & Total Calculation Box */}
                    <div className="flex justify-end mt-4">
                        <div className="w-72 border border-slate-200 rounded-lg overflow-hidden text-xs">
                            <div className="flex justify-between p-3 border-b border-slate-200 bg-slate-50">
                                <span className="font-semibold text-slate-600">Sub Total</span>
                                <span className="font-mono font-bold text-slate-800">{formatCurrency(proposal.subtotal || 0, currencyCode)}</span>
                            </div>
                            <div className="flex justify-between p-3.5 bg-slate-100 text-slate-900 font-bold text-sm">
                                <span>Total</span>
                                <span className="font-mono text-emerald-700">{formatCurrency(proposal.total || 0, currencyCode)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms and Conditions / Notes */}
                <div className="px-8 md:px-10 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 border-t border-slate-100 pt-6">
                    <div>
                        <h4 className="font-bold text-slate-900 mb-1">Note</h4>
                        <p className="leading-relaxed whitespace-pre-line">
                            {proposal.note || 'Thank you for considering our services. We look forward to working together.'}
                        </p>
                    </div>
                    <div className="md:text-right">
                        <h4 className="font-bold text-slate-900 mb-1">Terms and Conditions</h4>
                        <p className="leading-relaxed whitespace-pre-line">
                            {proposal.terms || 'Thank you for your business. Master Services Agreement (MSA) applies upon signature.'}
                        </p>
                    </div>
                </div>

                {/* Bottom Worksuite Action Bar */}
                <div className="p-6 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
                    <a
                        href={route('agency.proposals.pdf', proposal.uuid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                        <Download className="h-3.5 w-3.5" /> Download Proposal PDF
                    </a>

                    {!isSigned && (
                        <button
                            type="button"
                            onClick={() => setShowRevisionModal(true)}
                            className="px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
                        >
                            <X className="h-3.5 w-3.5 text-red-500" /> Request Revision
                        </button>
                    )}

                    {isSigned ? (
                        <div className="px-4 py-2 rounded bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow">
                            <CheckCircle className="h-4 w-4" /> Signed & Executed
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowSignModal(true)}
                            className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
                        >
                            <Check className="h-4 w-4" /> Accept & Sign
                        </button>
                    )}
                </div>

            </div>

            {/* E-Signature Modal / Drawer */}
            {showSignModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                <PenTool className="h-4 w-4 text-emerald-400" /> Sign & Accept Proposal
                            </h2>
                            <button onClick={() => setShowSignModal(false)} className="text-xs text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSubmitSign} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Your Legal Name *</label>
                                <Input
                                    type="text"
                                    required
                                    value={data.signer_name}
                                    onChange={(e) => {
                                        setData('signer_name', e.target.value);
                                        setTypedName(e.target.value);
                                    }}
                                    placeholder="Full Name"
                                    className="bg-slate-950 border-slate-800 text-white text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Your Email Address *</label>
                                <Input
                                    type="email"
                                    required
                                    value={data.signer_email}
                                    onChange={(e) => setData('signer_email', e.target.value)}
                                    placeholder="email@company.com"
                                    className="bg-slate-950 border-slate-800 text-white text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Signature Input Method</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setSignMode('type')}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${signMode === 'type' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                    >
                                        Type Name
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSignMode('draw')}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${signMode === 'draw' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                    >
                                        Draw Pad
                                    </button>
                                </div>

                                {signMode === 'type' ? (
                                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                                        <span className="font-serif italic text-lg text-emerald-400">{typedName || 'Your Signature Here'}</span>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <canvas
                                            ref={canvasRef}
                                            width={380}
                                            height={120}
                                            onMouseDown={handleCanvasMouseDown}
                                            onMouseMove={handleCanvasMouseMove}
                                            onMouseUp={handleCanvasMouseUp}
                                            className="w-full h-28 rounded-xl bg-slate-950 border border-slate-800 cursor-crosshair touch-none"
                                        />
                                        <button type="button" onClick={handleClearCanvas} className="text-[10px] text-slate-400 hover:text-red-400">Clear Canvas</button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                                <button type="button" onClick={() => setShowSignModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
                                >
                                    Confirm Signature & Accept
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Revision Modal */}
            {showRevisionModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <h2 className="text-base font-extrabold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-amber-400" /> Request Proposal Revision
                        </h2>
                        <form onSubmit={handleRevisionSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-300 mb-1">Your Requested Changes / Feedback *</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={revisionForm.data.notes}
                                    onChange={(e) => revisionForm.setData('notes', e.target.value)}
                                    placeholder="e.g. Please add monthly SEO management to the scope and update the payment terms to 2 installments."
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowRevisionModal(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                                <button type="submit" disabled={revisionForm.processing} className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold">Submit Notes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Revision History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-extrabold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-emerald-400" /> Proposal Revision Audit History
                            </h2>
                            <button onClick={() => setShowHistoryModal(false)} className="text-xs text-slate-400">✕ Close</button>
                        </div>

                        <div className="space-y-3 pt-2 text-xs">
                            {(proposal.revision_history || []).length === 0 ? (
                                <p className="text-slate-500 italic text-center py-4">No prior revisions recorded. Viewing initial version 1.0.</p>
                            ) : (
                                (proposal.revision_history || []).map((h, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                                        <div className="flex justify-between font-mono text-[10px] text-emerald-400">
                                            <span>{h.version || `v1.${idx+1}`} — {h.event || 'Revision Event'}</span>
                                            <span className="text-slate-500">{new Date(h.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-slate-200">"{h.notes}"</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatCurrency(num, code = 'USD') {
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(num || 0);
    } catch {
        return `$${(parseFloat(num) || 0).toFixed(2)}`;
    }
}
