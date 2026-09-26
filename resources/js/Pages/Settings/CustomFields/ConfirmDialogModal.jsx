import React from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';

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
    if (!isOpen) return null;

    const Icon = CustomIcon || (variant === 'danger' ? Trash2 : AlertTriangle);

    const buttonColors = {
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xs focus:ring-red-500',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-500',
        primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs focus:ring-brand-500',
    }[variant] || 'bg-red-600 hover:bg-red-700 text-white';

    const iconBadgeColors = {
        danger: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/50',
        warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50',
        primary: 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border-brand-200/60 dark:border-brand-800/50',
    }[variant] || 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${iconBadgeColors}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                    {cancelText && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${buttonColors}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
