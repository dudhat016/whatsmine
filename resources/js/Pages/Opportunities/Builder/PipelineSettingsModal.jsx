import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Plus, Trash2 } from 'lucide-react';
import Input from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';

export default function PipelineSettingsModal({
    isOpen,
    onClose,
    pipelines,
    activePipeline,
}) {
    if (!isOpen) return null;

    const [selectedPipeline, setSelectedPipeline] = useState(activePipeline || pipelines[0]);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors } = useForm({
        name: selectedPipeline?.name ?? 'New Pipeline',
        label_color: selectedPipeline?.label_color ?? '#3b82f6',
        stages: selectedPipeline?.stages ?? [
            { name: 'New Lead', color: '#3b82f6', probability: 20 },
            { name: 'Qualified', color: '#8b5cf6', probability: 40 },
            { name: 'Proposal Sent', color: '#f59e0b', probability: 70 },
            { name: 'Won', color: '#10b981', probability: 100 },
        ],
    });

    const handleSelectPipeline = (p) => {
        setSelectedPipeline(p);
        setIsCreatingNew(false);
        setData({
            name: p.name,
            label_color: p.label_color || '#3b82f6',
            stages: p.stages.map((s) => ({ id: s.id, name: s.name, color: s.color, probability: s.probability })),
        });
    };

    const handleStartNewPipeline = () => {
        setIsCreatingNew(true);
        setSelectedPipeline(null);
        setData({
            name: 'New Custom Pipeline',
            label_color: '#3b82f6',
            stages: [
                { name: 'Inquiry', color: '#3b82f6', probability: 20 },
                { name: 'Meeting Booked', color: '#8b5cf6', probability: 50 },
                { name: 'Contract Sent', color: '#f59e0b', probability: 80 },
                { name: 'Closed Won', color: '#10b981', probability: 100 },
            ],
        });
    };

    const handleAddStage = () => {
        setData('stages', [
            ...data.stages,
            { name: 'New Stage', color: '#6366f1', probability: 50 },
        ]);
    };

    const handleRemoveStage = (index) => {
        if (data.stages.length <= 1) return;
        const newStages = [...data.stages];
        newStages.splice(index, 1);
        setData('stages', newStages);
    };

    const handleStageChange = (index, field, value) => {
        const newStages = [...data.stages];
        newStages[index] = { ...newStages[index], [field]: value };
        setData('stages', newStages);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isCreatingNew) {
            post(route('client.opportunities.pipelines.store'), {
                onSuccess: () => onClose(),
            });
        } else {
            put(route('client.opportunities.pipelines.update', selectedPipeline.id), {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-soft-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-soft-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                        Pipeline & Stage Settings
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-soft text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Pipelines Sidebar List */}
                    <div className="w-56 border-r border-neutral-100 dark:border-neutral-800 p-3 space-y-2 bg-neutral-50/50 dark:bg-neutral-950/40">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Pipelines</span>
                            <button
                                type="button"
                                onClick={handleStartNewPipeline}
                                className="p-1 text-xs rounded-soft text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 font-medium"
                                title="Create New Pipeline"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {pipelines.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelectPipeline(p)}
                                className={`w-full text-left px-3 py-2 rounded-soft text-xs font-semibold flex items-center justify-between transition-colors ${
                                    selectedPipeline?.id === p.id && !isCreatingNew
                                        ? 'bg-brand-600 text-white shadow-soft'
                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                                }`}
                            >
                                <span className="truncate">{p.name}</span>
                                <span className="text-[10px] opacity-75">{p.stages?.length || 0} stages</span>
                            </button>
                        ))}
                    </div>

                    {/* Stage Form Content */}
                    <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
                        <Input
                            label="Pipeline Name *"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                            required
                        />

                        {/* Dynamic Stages List */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Dynamic Pipeline Stages (Custom Columns)
                                </label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleAddStage}
                                    className="flex items-center gap-1 text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add Stage
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                {data.stages.map((stage, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 rounded-soft border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                        <input
                                            type="color"
                                            value={stage.color || '#3b82f6'}
                                            onChange={(e) => handleStageChange(idx, 'color', e.target.value)}
                                            className="h-8 w-8 rounded border-none cursor-pointer"
                                            title="Stage Accent Color"
                                        />
                                        <input
                                            type="text"
                                            value={stage.name}
                                            onChange={(e) => handleStageChange(idx, 'name', e.target.value)}
                                            placeholder="Stage Name"
                                            className="flex-1 rounded-soft border border-neutral-300 dark:border-neutral-600 text-sm dark:bg-neutral-800 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                                            required
                                        />
                                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={stage.probability}
                                                onChange={(e) => handleStageChange(idx, 'probability', parseInt(e.target.value, 10) || 0)}
                                                className="w-14 rounded-soft border border-neutral-300 dark:border-neutral-600 text-sm dark:bg-neutral-800 text-center px-1 py-1.5"
                                            />
                                            <span>%</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStage(idx)}
                                            className="p-1 rounded text-neutral-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={processing}
                            >
                                {isCreatingNew ? 'Create Pipeline' : 'Save Stage Settings'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
