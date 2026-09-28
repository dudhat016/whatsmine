import React from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { Modal, Button } from '@/Components/ui';

export default function ConfirmDialogModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger', // 'danger' | 'warning' | 'primary'
    icon: CustomIcon = null,
}) {
    const Icon = CustomIcon || (variant === 'danger' ? Trash2 : AlertTriangle);

    const buttonVariant = {
        danger: 'danger',
        warning: 'primary',
        primary: 'primary',
    }[variant] || 'danger';

    const iconBadgeColors = {
        danger: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/50',
        warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50',
        primary: 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border-brand-200/60 dark:border-brand-800/50',
    }[variant] || 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400';

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <Modal.Header
                title={
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${iconBadgeColors}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-base font-bold text-neutral-900 dark:text-white">
                            {title}
                        </span>
                    </div>
                }
                onClose={onClose}
            />
            <Modal.Body>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {message}
                </p>
            </Modal.Body>
            <Modal.Footer>
                {cancelText && (
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        {cancelText}
                    </Button>
                )}
                <Button
                    variant={buttonVariant}
                    size="sm"
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                >
                    {confirmText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
