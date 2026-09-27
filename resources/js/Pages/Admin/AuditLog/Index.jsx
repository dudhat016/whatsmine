import AdminLayout from '@/Layouts/AdminLayout';
import { Button, Card, Input, Pagination } from '@/Components/ui';
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { formatInTz } from '@/Utils/datetime';

export default function AdminAuditLogIndex({ logs, filters = {} }) {
    const { t } = useTranslation();
    const adminTz = usePage().props.timezone || 'Asia/Dhaka';
    return (
        <AdminLayout title={t('admin.audit_log')}>
            <Head title={`${t('admin.audit_log')} · ${t('head.admin')}`} />
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t('admin.audit_log')}</h2>
                <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); const f = e.target; router.get(route('admin.audit-log.index'), { user_id: f.user_id?.value, action: f.action?.value }, { preserveState: true }); }}>
                    <Input type="text" name="user_id" placeholder={t('admin.user_id')} size="sm" wrapperClassName="w-28" defaultValue={filters.user_id} />
                    <Input type="text" name="action" placeholder={t('admin.action')} size="sm" wrapperClassName="w-36" defaultValue={filters.action} />
                    <Button type="submit" variant="outline" size="sm">{t('common.filter')}</Button>
                </form>
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
                                    <th className="pb-2 pr-4 font-medium">{t('client.date')}</th>
                                    <th className="pb-2 pr-4 font-medium">{t('client.user')}</th>
                                    <th className="pb-2 pr-4 font-medium">{t('client.action')}</th>
                                    <th className="pb-2 pr-4 font-medium">{t('admin.col_auditable')}</th>
                                    <th className="pb-2 pr-4 font-medium">{t('admin.col_ip')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data?.map((l) => (
                                    <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800">
                                        <td className="py-3 pr-4 text-neutral-500 dark:text-neutral-400">{l.created_at && formatInTz(l.created_at, adminTz)}</td>
                                        <td className="py-3 pr-4 text-neutral-900 dark:text-neutral-100">{l.actor_admin ? l.actor_admin.email : (l.user ? l.user.email : '—')}</td>
                                        <td className="py-3 pr-4 font-medium text-neutral-900 dark:text-neutral-100">{l.action}</td>
                                        <td className="py-3 pr-4 text-neutral-900 dark:text-neutral-100">{l.auditable_type ? `${l.auditable_type}#${l.auditable_id}` : '—'}</td>
                                        <td className="py-3 pr-4 text-neutral-500 dark:text-neutral-400">{l.ip ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {logs.data?.length === 0 && <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">{t('client.no_audit_entries')}</div>}
                    <Pagination data={logs} />
                </Card>
            </div>
        </AdminLayout>
    );
}
