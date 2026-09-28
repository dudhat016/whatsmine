import React from 'react';
import { Bookmark } from 'lucide-react';
import { Modal, Button, Input } from '@/Components/ui';

export default function SaveBlockModal({
    saveBlockModal,
    setSaveBlockModal,
    savedBlockName,
    setSavedBlockName,
    handleConfirmSaveBlock,
}) {
    return (
        <Modal
            show={!!saveBlockModal}
            onClose={() => setSaveBlockModal(null)}
            title="Save Custom Block Template"
            description="Save this element to reuse across your funnels"
            maxWidth="md"
        >
            <div className="space-y-4">
                <Input
                    label="Block Name"
                    size="sm"
                    type="text"
                    value={savedBlockName}
                    onChange={(e) => setSavedBlockName(e.target.value)}
                    placeholder="e.g. Hero Section, Pricing Grid..."
                    autoFocus
                />
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSaveBlockModal(null)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleConfirmSaveBlock}
                        disabled={!savedBlockName.trim()}
                    >
                        Save Template
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
