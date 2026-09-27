import React, { useState, useEffect } from 'react';
import { X, GitBranch, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Button, Select } from '@/Components/ui';

export default function TransferPipelineModal({
    isOpen,
    onClose,
    deal,
    pipelines = [],
    users = [],
    onSuccess,
}) {
    if (!isOpen || !deal) return null;

    // Current pipeline of the deal
    const currentPipelineId = deal.pipeline_id;
    const currentPipeline = pipelines.find((p) => p.id === currentPipelineId) || pipelines[0];
    const currentStage = currentPipeline?.stages?.find((s) => s.id === deal.stage_id);

    // Filter pipelines or default target pipeline to another pipeline if available
    const otherPipelines = pipelines.filter((p) => p.id !== currentPipelineId);
    const defaultTargetPipeline = otherPipelines.length > 0 ? otherPipelines[0] : currentPipeline;

    const [targetPipelineId, setTargetPipelineId] = useState(defaultTargetPipeline?.id || '');
    const [targetStageId, setTargetStageId] = useState(defaultTargetPipeline?.stages?.[0]?.id || '');
    const [assignedUserId, setAssignedUserId] = useState(deal.assigned_user_id ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const selectedTargetPipeline = pipelines.find((p) => p.id === parseInt(targetPipelineId, 10)) || defaultTargetPipeline;
    const availableStages = selectedTargetPipeline?.stages || [];

    useEffect(() => {
        if (deal) {
            const nextTarget = otherPipelines.length > 0 ? otherPipelines[0] : currentPipeline;
            setTargetPipelineId(nextTarget?.id || '');
            setTargetStageId(nextTarget?.stages?.[0]?.id || '');
            setAssignedUserId(deal.assigned_user_id ?? '');
            setError('');
        }
    }, [deal]);

    const handlePipelineChange = (e) => {
        const pid = parseInt(e.target.value, 10);
        setTargetPipelineId(pid);
        const p = pipelines.find((x) => x.id === pid);
        setTargetStageId(p?.stages?.[0]?.id || '');
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!targetPipelineId || !targetStageId) {
            setError('Please select both a destination pipeline and stage.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await axios.post(route('client.opportunities.deals.transfer-pipeline'), {
                deal_id: deal.id,
                target_pipeline_id: parseInt(targetPipelineId, 10),
                target_stage_id: parseInt(targetStageId, 10),
                assigned_user_id: assignedUserId ? parseInt(assignedUserId, 10) : null,
            });

            if (onSuccess) {
                onSuccess(res.data);
            }
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to transfer opportunity. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                            <GitBranch className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                                Transfer to Pipeline
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[260px]">
                                {deal.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Current Placement Banner */}
                    <div className="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-neutral-400">Current Pipeline</span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[150px]">
                                {currentPipeline?.name || 'Pipeline'}
                            </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] uppercase font-bold text-neutral-400">Current Stage</span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[150px]">
                                {currentStage?.name || 'Stage'}
                            </span>
                        </div>
                    </div>

                    {/* Destination Pipeline */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                            Destination Pipeline
                        </label>
                        <Select
                            value={targetPipelineId}
                            onChange={handlePipelineChange}
                            size="sm"
                        >
                            {pipelines.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} {p.id === currentPipelineId ? '(Current)' : ''} {p.is_default ? '★' : ''}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* Target Stage */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                            Initial Stage in Destination Pipeline
                        </label>
                        <Select
                            value={targetStageId}
                            onChange={(e) => setTargetStageId(parseInt(e.target.value, 10))}
                            size="sm"
                        >
                            {availableStages.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.probability ?? 100}%)
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* Optional Reassign Sales Rep */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Assign Sales Representative</span>
                            <span className="text-[10px] font-normal text-neutral-400 capitalize">Optional</span>
                        </label>
                        <Select
                            value={assignedUserId}
                            onChange={(e) => setAssignedUserId(e.target.value)}
                            size="sm"
                        >
                            <option value="">Keep current rep ({deal.assigned_user?.name || 'Unassigned'})</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.email})
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* Helpful Context Alert */}
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
                        Moving this deal to a new pipeline will automatically log a transfer event in deal history, trigger any stage-entry automations in the new pipeline, and fire "Pipeline Changed" automations.
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="brand"
                            size="sm"
                            isLoading={submitting}
                            className="gap-1.5"
                        >
                            <GitBranch className="h-3.5 w-3.5" />
                            <span>Confirm Transfer</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
