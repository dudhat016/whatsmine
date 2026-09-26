import { useState } from 'react';
import { router } from '@inertiajs/react';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import EmptyState from '@/Components/EmptyState';
import { Search, Download, Eye, FileText, User, Filter, CheckCircle2, Clock } from 'lucide-react';
import SubmissionDrawer from './SubmissionDrawer';

export default function FormsSubmissionsTab({
    submissions,
    allWorkspaceForms = [],
    filters = {},
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedFormId, setSelectedFormId] = useState(filters.form_id || '');
    const [activeSubmission, setActiveSubmission] = useState(null);

    const handleFilterChange = (newFormId, newSearch) => {
        router.get(
            route('client.forms.index'),
            {
                tab: 'submissions',
                form_id: newFormId || undefined,
                search: newSearch || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilterChange(selectedFormId, search);
    };

    const handleExport = () => {
        const url = route('client.forms.submissions.export', {
            form_id: selectedFormId || undefined,
        });
        window.location.href = url;
    };

    const submissionList = submissions?.data || [];

    return (
        <div className="space-y-5">
            {/* Filter Toolbar */}
            <Card padding={true} className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto flex-1">
                    {/* Form Dropdown Filter */}
                    <div className="relative min-w-[200px]">
                        <select
                            value={selectedFormId}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedFormId(val);
                                handleFilterChange(val, search);
                            }}
                            className="w-full text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100/80 dark:bg-neutral-800 border-none rounded-soft px-3 py-2 cursor-pointer focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">All Subscription Forms</option>
                            {allWorkspaceForms.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs min-w-[180px]">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search contacts, email, phone..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-soft border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </form>
                </div>

                {/* Export Button */}
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExport}
                    className="flex items-center gap-1.5 shrink-0 text-xs"
                >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                </Button>
            </Card>

            {/* Submissions Table */}
            {submissionList.length === 0 ? (
                <EmptyState
                    icon={<FileText className="w-8 h-8" />}
                    title="No Submissions Found"
                    description={
                        search || selectedFormId
                            ? 'No submissions match your active filter criteria.'
                            : 'When visitors fill out your forms, their submitted lead data will appear here in real-time.'
                    }
                />
            ) : (
                <Card padding={false} className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-200 font-semibold border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="p-3.5">Subscriber / Contact</th>
                                    <th className="p-3.5">Form Name</th>
                                    <th className="p-3.5">Verification</th>
                                    <th className="p-3.5">Submission Date</th>
                                    <th className="p-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {submissionList.map((sub) => {
                                    const contact = sub.contact;
                                    const data = sub.submitted_data || {};
                                    const email = data.email || contact?.email || '—';
                                    const phone = data.phone_e164 || contact?.phone_e164 || '';
                                    const name = contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : (data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : 'Anonymous Lead');

                                    return (
                                        <tr
                                            key={sub.id}
                                            onClick={() => setActiveSubmission(sub)}
                                            className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition cursor-pointer"
                                        >
                                            <td className="p-3.5">
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                                                    {name}
                                                </div>
                                                <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                                                    <span>{email}</span>
                                                    {phone && <span>• {phone}</span>}
                                                </div>
                                            </td>

                                            <td className="p-3.5">
                                                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                                    {sub.form?.name || 'Deleted Form'}
                                                </span>
                                            </td>

                                            <td className="p-3.5">
                                                <Badge
                                                    variant={sub.is_verified ? 'success' : 'warning'}
                                                    size="sm"
                                                    className="gap-1"
                                                >
                                                    {sub.is_verified ? (
                                                        <>
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                            Verified
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="w-3 h-3 text-amber-500" />
                                                            Pending OTP
                                                        </>
                                                    )}
                                                </Badge>
                                            </td>

                                            <td className="p-3.5 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                                {sub.created_at ? new Date(sub.created_at).toLocaleString() : '—'}
                                            </td>

                                            <td className="p-3.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveSubmission(sub);
                                                    }}
                                                    className="p-1.5 text-neutral-500 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-soft transition"
                                                    title="View Submission Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {submissions?.links && submissions.links.length > 3 && (
                        <div className="p-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                            <div>
                                Showing <span className="font-semibold">{submissions.from ?? 0}</span> to{' '}
                                <span className="font-semibold">{submissions.to ?? 0}</span> of{' '}
                                <span className="font-semibold">{submissions.total}</span> submissions
                            </div>
                            <div className="flex items-center gap-1">
                                {submissions.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                                        className={`px-2.5 py-1 rounded-soft text-xs transition ${
                                            link.active
                                                ? 'bg-brand-600 text-white font-semibold'
                                                : link.url
                                                    ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                                                    : 'opacity-40 cursor-not-allowed text-neutral-400'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Submission Detail Slide-over Drawer */}
            <SubmissionDrawer
                submission={activeSubmission}
                onClose={() => setActiveSubmission(null)}
            />
        </div>
    );
}
