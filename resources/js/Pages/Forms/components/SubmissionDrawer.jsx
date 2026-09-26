import { X, User, Mail, Phone, Calendar, ShieldCheck, ShieldAlert, Globe, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import { Link } from '@inertiajs/react';

export default function SubmissionDrawer({ submission, onClose }) {
    if (!submission) return null;

    const data = submission.submitted_data || {};
    const contact = submission.contact;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="flex-1" onClick={onClose} />

            {/* Slide-over Container */}
            <div className="w-full max-w-xl bg-white dark:bg-neutral-900 h-full shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                                Submission #{submission.id}
                            </h2>
                            <Badge variant={submission.is_verified ? 'success' : 'warning'} size="sm">
                                {submission.is_verified ? 'OTP Verified' : 'Pending OTP'}
                            </Badge>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Form: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{submission.form?.name || 'Subscription Form'}</span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-soft transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* CRM Contact Link Card */}
                    {contact ? (
                        <div className="p-4 rounded-soft-lg bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-brand-600 text-white rounded-full">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                        {contact.first_name} {contact.last_name}
                                    </div>
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                                        {contact.email && <span>{contact.email}</span>}
                                        {contact.phone_e164 && <span>• {contact.phone_e164}</span>}
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={route('client.contacts.show', contact.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-soft transition shadow-xs"
                            >
                                View CRM Contact
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    ) : (
                        <div className="p-3.5 rounded-soft bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500">
                            No linked CRM Contact created for this submission.
                        </div>
                    )}

                    {/* Submitted Fields Summary */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                            Submitted Answers & Fields
                        </h3>
                        <div className="rounded-soft-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                            {Object.entries(data).map(([key, val]) => {
                                let displayVal = val;
                                if (typeof val === 'boolean') {
                                    displayVal = val ? 'Yes / Agreed' : 'No';
                                } else if (Array.isArray(val)) {
                                    displayVal = val.join(', ');
                                } else if (typeof val === 'object' && val !== null) {
                                    displayVal = JSON.stringify(val);
                                }

                                // If it's a signature base64 image
                                const isSignature = typeof val === 'string' && val.startsWith('data:image');

                                return (
                                    <div key={key} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-neutral-900">
                                        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 text-right">
                                            {isSignature ? (
                                                <img
                                                    src={val}
                                                    alt="Signature"
                                                    className="h-12 border border-neutral-200 dark:border-neutral-700 rounded-soft bg-white p-1 ml-auto"
                                                />
                                            ) : (
                                                <span>{displayVal || '—'}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                            Submission Metadata & Verification
                        </h3>
                        <div className="rounded-soft-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 p-4 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                                <span>Submitted At:</span>
                                <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                                    {submission.created_at ? new Date(submission.created_at).toLocaleString() : 'N/A'}
                                </span>
                            </div>

                            {submission.verified_at && (
                                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                                    <span>OTP Verified At:</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {new Date(submission.verified_at).toLocaleString()}
                                    </span>
                                </div>
                            )}

                            {submission.ip_address && (
                                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                                    <span>IP Address:</span>
                                    <span className="font-mono text-neutral-800 dark:text-neutral-300">{submission.ip_address}</span>
                                </div>
                            )}

                            {submission.referrer_url && (
                                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                                    <span>Referrer URL:</span>
                                    <a
                                        href={submission.referrer_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-brand-600 hover:underline truncate max-w-xs"
                                    >
                                        {submission.referrer_url}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end shrink-0">
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
