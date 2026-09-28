import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { Modal, Select, Button } from '@/Components/ui';

export default function StageDeleteModal({
    isOpen,
    onClose,
    stage,
    otherStages = [],
    onSuccess,
}) {
    const [targetStageId, setTargetStageId] = useState(otherStages[0]?.id || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleConfirmDelete = async () => {
        if (!stage || !targetStageId) return;
        setSubmitting(true);
        setError('');

        try {
            await axios.post(route('client.opportunities.stages.safe-delete', stage.id), {
                target_stage_id: targetStageId,
            });
            if (onSuccess) onSuccess();
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
        <Modal show={isOpen && !!stage} onClose={onClose} maxWidth="md">
            <Modal.Header
                title={
                    <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                        <div className="p-2 rounded-soft bg-amber-50 dark:bg-amber-950/40">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                            Delete Stage & Migrate Opportunities
                        </span>
                    </div>
                }
                onClose={onClose}
            />

            <Modal.Body className="space-y-4">
                {stage && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        You are deleting stage <strong className="text-neutral-900 dark:text-neutral-200">{stage.name}</strong>. Select a destination stage to transfer all active opportunities:
                    </p>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Select
                    label="Destination Stage *"
                    value={targetStageId}
                    onChange={(e) => setTargetStageId(e.target.value)}
                    options={stageOptions}
                    placeholder="Select Stage..."
                />
            </Modal.Body>

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
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={submitting}
                    onClick={handleConfirmDelete}
                    loading={submitting}
                >
                    Migrate & Delete
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
