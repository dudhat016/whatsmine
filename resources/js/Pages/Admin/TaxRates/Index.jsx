import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';
import { Percent, Plus, Pencil, Trash2 } from 'lucide-react';
import { useConfirm } from '@/context/ConfirmationContext';
import { Input, Button, Card, Checkbox } from '@/Components/ui';

function TaxRateForm({ taxRate = null, onClose }) {
    const { t } = useTranslation();
    const { data, setData, post, put, processing, errors } = useForm({
        name: taxRate?.name ?? '',
        country: taxRate?.country ?? '',
        region: taxRate?.region ?? '',
        percentage: taxRate?.percentage ?? '',
        inclusive: taxRate?.inclusive ?? false,
        enabled: taxRate?.enabled ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        if (taxRate) {
            put(route('admin.tax-rates.update', taxRate.id), { onSuccess: onClose });
        } else {
            post(route('admin.tax-rates.store'), { onSuccess: onClose });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label={t('common.name')}
                    type="text"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    placeholder="VAT 20%"
                    required
                    error={errors.name}
                />
                <Input
                    label={t('admin.tax_country_code')}
                    type="text"
                    value={data.country}
                    onChange={e => setData('country', e.target.value.toUpperCase())}
                    className="font-mono"
                    placeholder="US"
                    maxLength={2}
                    required
                    error={errors.country}
                />
                <Input
                    label={t('admin.tax_region')}
                    type="text"
                    value={data.region}
                    onChange={e => setData('region', e.target.value)}
                    placeholder="CA"
                />
                <Input
                    label={t('admin.tax_percentage')}
                    type="number"
                    value={data.percentage}
                    onChange={e => setData('percentage', e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    error={errors.percentage}
                />
                <div className="flex items-center gap-6 pt-2">
                    <Checkbox
                        label={t('admin.tax_inclusive')}
                        checked={data.inclusive}
                        onChange={e => setData('inclusive', e.target.checked)}
                    />
                    <Checkbox
                        label={t('common.enabled')}
                        checked={data.enabled}
                        onChange={e => setData('enabled', e.target.checked)}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={processing}>
                    {taxRate ? t('admin.tax_update') : t('admin.tax_create')}
                </Button>
            </div>
        </form>
    );
}

export default function TaxRatesIndex({ taxRates }) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState(null);

    const handleDelete = async (taxRate) => {
        const ok = await confirm({
            title: 'Delete Tax Rate',
            message: t('admin.tax_delete_confirm', { name: taxRate.name }) || `Are you sure you want to delete tax rate "${taxRate.name}"?`,
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(route('admin.tax-rates.destroy', taxRate.id));
    };

    return (
        <AdminLayout title={t('admin.tax_rates_title')}>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Percent className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        <div>
                            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{t('admin.tax_rates_title')}</h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('admin.tax_rates_subtitle')}</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowCreate(true)} variant="primary" size="sm" icon={Plus}>
                        {t('admin.tax_add')}
                    </Button>
                </div>

                {showCreate && (
                    <Card className="p-6">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">{t('admin.tax_new')}</h2>
                        <TaxRateForm onClose={() => setShowCreate(false)} />
                    </Card>
                )}

                <Card className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">{t('common.name')}</th>
                                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">{t('admin.tax_country')}</th>
                                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">{t('admin.tax_region_col')}</th>
                                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">{t('admin.tax_rate')}</th>
                                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">{t('admin.tax_type')}</th>
                                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300">{t('admin.status')}</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {taxRates?.map(rate => (
                                <tr key={rate.id}>
                                    {editing?.id === rate.id ? (
                                        <td colSpan={7} className="px-4 py-4">
                                            <TaxRateForm taxRate={rate} onClose={() => setEditing(null)} />
                                        </td>
                                    ) : (
                                        <>
                                            <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{rate.name}</td>
                                            <td className="px-4 py-3 font-mono text-neutral-700 dark:text-neutral-300">{rate.country}</td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{rate.region ?? '—'}</td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{rate.percentage}%</td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{rate.inclusive ? t('admin.tax_type_inclusive') : t('admin.tax_type_exclusive')}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${rate.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'}`}>
                                                    {rate.enabled ? t('common.active') : t('admin.disabled')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button onClick={() => setEditing(rate)} className="p-1 text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 transition">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(rate)} className="p-1 text-neutral-400 hover:text-coral-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {!taxRates?.length && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500">
                                        {t('admin.tax_empty')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </AdminLayout>
    );
}
