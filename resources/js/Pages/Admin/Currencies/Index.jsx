import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Input } from '@/Components/ui';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function AdminCurrenciesIndex({ currencies = [], flash = {} }) {
    const { t } = useTranslation();
    return (
        <AdminLayout title={t('admin.nav.currencies')}>
            <Head title={`${t('admin.nav.currencies')} · ${t('head.admin')}`} />
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('admin.nav.currencies')}</h2>
                {flash?.success && <div className="rounded-soft-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">{flash.success}</div>}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
                                    <th className="pb-2 pr-4 font-medium">{t('admin.col_code')}</th>
                                    <th className="pb-2 pr-4 font-medium">{t('admin.col_symbol')}</th>
                                    <th className="pb-2 pr-4 font-medium">{t('admin.col_decimals')}</th>
                                    <th className="pb-2 pr-4 font-medium">{t('admin.col_exchange_rate')}</th>
                                    <th className="pb-2 pr-4 font-medium">{t('admin.col_default')}</th>
                                    <th className="pb-2 pr-4 font-medium">{t('common.enabled')}</th>
                                    <th className="pb-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {currencies.map((c) => (
                                    <CurrencyRow key={c.code} currency={c} />
                                ))}
                                <tr className="border-t-2 border-neutral-200 dark:border-neutral-700">
                                    <td colSpan={7} className="pt-4 pb-1">
                                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                            {t('admin.add_currency', 'Add new currency')}
                                        </span>
                                    </td>
                                </tr>
                                <AddCurrencyRow />
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}

function CurrencyRow({ currency }) {
    const { t } = useTranslation();
    const { data, setData, put, processing } = useForm({
        symbol: currency.symbol ?? '',
        decimals: currency.decimals ?? 2,
        exchange_rate: currency.exchange_rate ?? '',
        is_default: currency.is_default ?? false,
        enabled: currency.enabled ?? true,
    });
    return (
        <tr className="border-b border-neutral-100 dark:border-neutral-800">
            <td className="py-3 pr-4 font-medium text-neutral-900 dark:text-neutral-100">{currency.code}</td>
            <td className="py-3 pr-4"><Input value={data.symbol} onChange={(e) => setData('symbol', e.target.value)} size="sm" wrapperClassName="w-16" /></td>
            <td className="py-3 pr-4"><Input type="number" value={data.decimals} onChange={(e) => setData('decimals', parseInt(e.target.value, 10) || 0)} size="sm" wrapperClassName="w-16" /></td>
            <td className="py-3 pr-4"><Input type="number" step="any" value={data.exchange_rate} onChange={(e) => setData('exchange_rate', e.target.value)} size="sm" wrapperClassName="w-24" /></td>
            <td className="py-3 pr-4"><input type="checkbox" checked={data.is_default} onChange={(e) => setData('is_default', e.target.checked)} className="rounded border-neutral-300 dark:border-neutral-600 text-brand-500" /></td>
            <td className="py-3 pr-4"><input type="checkbox" checked={data.enabled} onChange={(e) => setData('enabled', e.target.checked)} className="rounded border-neutral-300 dark:border-neutral-600 text-brand-500" /></td>
            <td className="py-3"><button type="button" onClick={() => put(route('admin.currencies.update', currency.code))} className="text-brand-600 dark:text-brand-400 text-sm hover:underline font-medium" disabled={processing}>{t('common.save')}</button></td>
        </tr>
    );
}

function AddCurrencyRow() {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        symbol: '',
        decimals: 2,
        exchange_rate: '',
        is_default: false,
        enabled: true,
    });

    const submit = () => {
        post(route('admin.currencies.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <tr className="align-top bg-neutral-50/60 dark:bg-neutral-800/30">
            <td className="py-3 pr-4">
                <Input value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} placeholder="USD" maxLength={10} size="sm" wrapperClassName="w-20" className="uppercase" error={errors.code} />
            </td>
            <td className="py-3 pr-4">
                <Input value={data.symbol} onChange={(e) => setData('symbol', e.target.value)} placeholder="$" size="sm" wrapperClassName="w-16" error={errors.symbol} />
            </td>
            <td className="py-3 pr-4"><Input type="number" value={data.decimals} onChange={(e) => setData('decimals', parseInt(e.target.value, 10) || 0)} size="sm" wrapperClassName="w-16" /></td>
            <td className="py-3 pr-4"><Input type="number" step="any" value={data.exchange_rate} onChange={(e) => setData('exchange_rate', e.target.value)} placeholder="1" size="sm" wrapperClassName="w-24" /></td>
            <td className="py-3 pr-4"><input type="checkbox" checked={data.is_default} onChange={(e) => setData('is_default', e.target.checked)} className="rounded border-neutral-300 dark:border-neutral-600 text-brand-500" /></td>
            <td className="py-3 pr-4"><input type="checkbox" checked={data.enabled} onChange={(e) => setData('enabled', e.target.checked)} className="rounded border-neutral-300 dark:border-neutral-600 text-brand-500" /></td>
            <td className="py-3"><Button type="button" onClick={submit} size="sm" disabled={processing || !data.code || !data.symbol}>{t('common.add', 'Add')}</Button></td>
        </tr>
    );
}
