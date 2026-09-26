import React, { useState, useEffect } from 'react';
import { X, XCircle, AlertCircle, Check } from 'lucide-react';
import axios from 'axios';
import Button from '@/Components/ui/Button';

const LOST_REASONS = [
    'Competitor Chosen',
    'Price / Budget Too High',
    'Timing Not Right / Postponed',
    'Unresponsive / Ghosted',
    'Product / Feature Gap',
    'Poor Fit / Disqualified',
    'Other',
];

const ABANDONED_REASONS = [
    'Lead Unresponsive / Cold',
    'Project Cancelled by Client',
    'Contact Left Company',
    'Duplicate Opportunity',
    'Invalid Contact Info',
    'Other',
];

export default function LostReasonModal({
    isOpen,
    onClose,
    deal,
    targetStatus = 'lost',
    onSuccess,
}) {
    if (!isOpen || !deal) return null;

    const isLost = targetStatus === 'lost';
    const presets = isLost ? LOST_REASONS : ABANDONED_REASONS;

    const [selectedPreset, setSelectedPreset] = useState(presets[0]);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setSelectedPreset(presets[0]);
        setNotes('');
        setError('');
    }, [deal, targetStatus]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        const finalReason = selectedPreset === 'Other'
            ? (notes.trim() || 'Other')
            : (notes.trim() ? `${selectedPreset}: ${notes.trim()}` : selectedPreset);

        try {
            await axios.post(route('client.opportunities.deals.update-status', deal.id), {
                status: targetStatus,
                lost_reason: finalReason,
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to update deal status:', err);
            setError(err.response?.data?.message || 'Failed to update status. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg rounded-soft-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-soft-lg overflow-hidden p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-soft ${isLost ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                            {isLost ? <XCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                                {isLost ? 'Mark Opportunity as Lost' : 'Mark Opportunity as Abandoned'}
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Record the reason for analytics, reporting, and automated follow-ups.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Target Deal Details Summary */}
                <div className="p-3 rounded-soft bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{deal.name}</div>
                        <div className="text-neutral-500 dark:text-neutral-400">
                            {deal.contact ? `${deal.contact.first_name || ''} ${deal.contact.last_name || ''}`.trim() : 'No Contact Assigned'}
                        </div>
                    </div>
                    <div className="font-bold text-neutral-700 dark:text-neutral-300">
                        ${Number(deal.monetary_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-soft bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs font-medium">
                        {error}
                    </div>
                )}

                {/* Reason Selection Chips */}
                <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Primary Reason <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {presets.map((reason) => {
                            const isSelected = selectedPreset === reason;
                            return (
                                <button
                                    key={reason}
                                    type="button"
                                    onClick={() => setSelectedPreset(reason)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                                        isSelected
                                            ? isLost
                                                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                                : 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                                    }`}
                                >
                                    {isSelected && <Check className="h-3 w-3" />}
                                    <span>{reason}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Optional Notes */}
                <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Additional Notes or Specific Context
                    </label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Provide details (e.g. competitor name, price feedback, client quotation response)..."
                        className="w-full text-xs rounded-soft border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-neutral-400 transition-colors"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={isLost ? 'danger' : 'warning'}
                        onClick={handleSubmit}
                        loading={submitting}
                    >
                        {isLost ? 'Confirm Lost' : 'Confirm Abandoned'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
