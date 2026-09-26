import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2, HelpCircle, Info } from 'lucide-react';
import Modal from '@/Components/ui/Modal';
import Button from '@/Components/ui/Button';

const ConfirmationContext = createContext({
    confirm: () => Promise.resolve(false),
    alert: () => Promise.resolve(true),
});

export function ConfirmationProvider({ children }) {
    const { t } = useTranslation();
    const [state, setState] = useState({
        show: false,
        title: '',
        message: '',
        confirmText: '',
        cancelText: null,
        variant: 'danger',
    });

    const resolverRef = useRef(null);

    const confirm = useCallback((options = {}) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            if (typeof options === 'string') {
                setState({
                    show: true,
                    title: t('common.confirm') || 'Confirm Action',
                    message: options,
                    confirmText: t('common.confirm') || 'Confirm',
                    cancelText: t('common.cancel') || 'Cancel',
                    variant: 'danger',
                });
            } else {
                setState({
                    show: true,
                    title: options.title || t('common.confirm') || 'Confirm Action',
                    message: options.message || options.body || options.text || '',
                    confirmText: options.confirmText || (options.variant === 'danger' ? (t('common.delete') || 'Delete') : (t('common.confirm') || 'Confirm')),
                    cancelText: options.cancelText || t('common.cancel') || 'Cancel',
                    variant: options.variant || 'danger',
                });
            }
        });
    }, [t]);

    const alert = useCallback((options = {}) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            if (typeof options === 'string') {
                setState({
                    show: true,
                    title: t('common.notice') || 'Notice',
                    message: options,
                    confirmText: t('common.ok') || 'OK',
                    cancelText: null,
                    variant: 'info',
                });
            } else {
                setState({
                    show: true,
                    title: options.title || t('common.notice') || 'Notice',
                    message: options.message || options.body || options.text || '',
                    confirmText: options.confirmText || t('common.ok') || 'OK',
                    cancelText: null,
                    variant: options.variant || 'info',
                });
            }
        });
    }, [t]);

    const handleConfirm = () => {
        setState((prev) => ({ ...prev, show: false }));
        if (resolverRef.current) {
            resolverRef.current(true);
            resolverRef.current = null;
        }
    };

    const handleCancel = () => {
        setState((prev) => ({ ...prev, show: false }));
        if (resolverRef.current) {
            resolverRef.current(false);
            resolverRef.current = null;
        }
    };

    const renderIcon = () => {
        if (state.variant === 'danger') {
            return (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                    <Trash2 className="h-5 w-5" />
                </div>
            );
        }
        if (state.variant === 'warning') {
            return (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                </div>
            );
        }
        if (state.variant === 'info') {
            return (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                    <Info className="h-5 w-5" />
                </div>
            );
        }
        return (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                <HelpCircle className="h-5 w-5" />
            </div>
        );
    };

    return (
        <ConfirmationContext.Provider value={{ confirm, alert }}>
            {children}
            <Modal show={state.show} onClose={handleCancel} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {renderIcon()}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                                {state.title}
                            </h3>
                            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
                                {state.message}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-end gap-3">
                        {state.cancelText && (
                            <Button variant="ghost" onClick={handleCancel} className="text-sm font-medium">
                                {state.cancelText}
                            </Button>
                        )}
                        <Button
                            variant={state.variant === 'danger' ? 'danger' : 'primary'}
                            onClick={handleConfirm}
                            className="text-sm font-semibold px-5"
                        >
                            {state.confirmText}
                        </Button>
                    </div>
                </div>
            </Modal>
        </ConfirmationContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmationProvider');
    }
    return context;
}

