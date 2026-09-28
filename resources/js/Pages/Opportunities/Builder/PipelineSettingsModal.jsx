import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, Input, Button } from '@/Components/ui';

export default function PipelineSettingsModal({
    isOpen,
    onClose,
    onSuccess,
    pipelines,
    activePipeline,
}) {
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
                onSuccess: () => {
                    if (onSuccess) onSuccess();
                    else onClose();
                },
            });
        } else {
            put(route('client.opportunities.pipelines.update', selectedPipeline.id), {
                onSuccess: () => {
                    if (onSuccess) onSuccess();
                    else onClose();
                },
            });
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="3xl">
            <Modal.Header title="Pipeline & Stage Settings" onClose={onClose} />

            <div className="flex flex-1 overflow-hidden min-h-[420px] max-h-[70vh]">
                {/* Pipelines Sidebar List */}
                <div className="w-56 border-r border-neutral-100 dark:border-neutral-800 p-3 space-y-2 bg-neutral-50/50 dark:bg-neutral-950/40">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Pipelines</span>
                        <button
                            type="button"
                            onClick={handleStartNewPipeline}
                            className="p-1 text-xs rounded-soft text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 font-medium cursor-pointer"
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
                            className={`w-full text-left px-3 py-2 rounded-soft text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
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
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="p-6 space-y-4 overflow-y-auto flex-1">
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

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {data.stages.map((stage, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 rounded-soft border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                        <input
                                            type="color"
                                            value={stage.color || '#3b82f6'}
                                            onChange={(e) => handleStageChange(idx, 'color', e.target.value)}
                                            className="h-8 w-8 rounded border-none cursor-pointer"
                                            title="Stage Accent Color"
                                        />
                                        <div className="flex-1">
                                            <Input
                                                size="sm"
                                                type="text"
                                                value={stage.name}
                                                onChange={(e) => handleStageChange(idx, 'name', e.target.value)}
                                                placeholder="Stage Name"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-neutral-500 w-20">
                                            <Input
                                                size="sm"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={stage.probability}
                                                onChange={(e) => handleStageChange(idx, 'probability', parseInt(e.target.value, 10) || 0)}
                                                className="text-center"
                                            />
                                            <span>%</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStage(idx)}
                                            className="p-1 rounded text-neutral-400 hover:text-red-500 cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Modal.Footer>
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
                            loading={processing}
                        >
                            {isCreatingNew ? 'Create Pipeline' : 'Save Stage Settings'}
                        </Button>
                    </Modal.Footer>
                </form>
            </div>
        </Modal>
    );
}
