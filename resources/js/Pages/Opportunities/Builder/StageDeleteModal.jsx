import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import axios from 'axios';
import Select from '@/Components/ui/Select';
import Button from '@/Components/ui/Button';

export default function StageDeleteModal({
    isOpen,
    onClose,
    stage,
    otherStages,
    onSuccess,
}) {
    if (!isOpen || !stage) return null;

    const [targetStageId, setTargetStageId] = useState(otherStages[0]?.id || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleConfirmDelete = async () => {
        if (!targetStageId) return;
        setSubmitting(true);
        setError('');

        try {
            await axios.post(route('client.opportunities.stages.safe-delete', stage.id), {
                target_stage_id: targetStageId,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete stage.');
        } finally {
            setSubmitting(false);
        }
    };

    const stageOptions = otherStages.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-soft-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-soft-lg overflow-hidden p-6 space-y-4">
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                    <div className="p-2 rounded-soft bg-amber-50 dark:bg-amber-950/40">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                        Delete Stage & Migrate Opportunities
                    </h3>
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    You are deleting stage <strong className="text-neutral-900 dark:text-neutral-200">{stage.name}</strong>. Select a destination stage to transfer all active opportunities:
                </p>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Select
                    label="Destination Stage *"
                    value={targetStageId}
                    onChange={(e) => setTargetStageId(e.target.value)}
                    options={stageOptions}
                    placeholder="Select Stage..."
                />

                <div className="pt-3 flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={submitting}
                        onClick={handleConfirmDelete}
                    >
                        {submitting ? 'Migrating...' : 'Migrate & Delete'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
