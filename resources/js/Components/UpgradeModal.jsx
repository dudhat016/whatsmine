import { useEffect, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '@/Components/ui';
import { AlertTriangle } from 'lucide-react';

export default function UpgradeModal() {
    const { t } = useTranslation();
    const { flash } = usePage().props;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (flash?.upgrade_required) {
            setOpen(true);
        }
    }, [flash?.upgrade_required]);

    if (!flash?.upgrade_required) return null;

    return (
        <Modal show={open} onClose={() => setOpen(false)} maxWidth="md">
            <Modal.Header
                title={
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                                {t('ui.upgrade_modal_title')}
                            </h2>
                            {flash.upgrade_reason && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {flash.upgrade_reason}
                                </p>
                            )}
                        </div>
                    </div>
                }
                onClose={() => setOpen(false)}
            />

            <Modal.Body>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {t('ui.upgrade_modal_body')}
                </p>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setOpen(false)}
                >
                    {t('ui.maybe_later')}
                </Button>
                <Link
                    href={route('client.pricing')}
                    onClick={() => setOpen(false)}
                >
                    <Button variant="primary" size="sm">
                        {t('ui.view_plans')}
                    </Button>
                </Link>
            </Modal.Footer>
        </Modal>
    );
}
