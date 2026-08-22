import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Trash2 } from 'lucide-react';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import DatePicker from '@/Components/ui/DatePicker';
import Button from '@/Components/ui/Button';

export default function OpportunityModal({
    isOpen,
    onClose,
    deal,
    pipelineId,
    stageId,
    stages,
    contacts,
    users,
}) {
    if (!isOpen) return null;

    const isEdit = !!deal;

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: deal?.name ?? '',
        monetary_value: deal?.monetary_value ?? 0,
        contact_id: deal?.contact_id ?? (contacts[0]?.id ?? ''),
        stage_id: deal?.stage_id ?? (stageId || stages[0]?.id || ''),
        pipeline_id: pipelineId,
        assigned_user_id: deal?.assigned_user_id ?? '',
        deal_watcher_id: deal?.deal_watcher_id ?? '',
        status: deal?.status ?? 'open',
        expected_close_date: deal?.expected_close_date ?? '',
        lost_reason: deal?.lost_reason ?? '',
    });

    useEffect(() => {
        if (deal) {
            setData({
                name: deal.name ?? '',
                monetary_value: deal.monetary_value ?? 0,
                contact_id: deal.contact_id ?? '',
                stage_id: deal.stage_id ?? (stageId || stages[0]?.id || ''),
                pipeline_id: pipelineId,
                assigned_user_id: deal.assigned_user_id ?? '',
                deal_watcher_id: deal.deal_watcher_id ?? '',
                status: deal.status ?? 'open',
                expected_close_date: deal.expected_close_date ?? '',
                lost_reason: deal.lost_reason ?? '',
            });
        }
    }, [deal]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isEdit) {
            put(route('client.opportunities.deals.update', deal.id), {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post(route('client.opportunities.deals.store'), {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deal || !confirm('Are you sure you want to delete this opportunity?')) return;
        destroy(route('client.opportunities.deals.destroy', deal.id), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    const contactOptions = contacts.map((c) => ({
        value: c.id,
        label: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.phone_e164 || c.email,
    }));

    const stageOptions = stages.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    const userOptions = [
        { value: '', label: 'Unassigned' },
        ...users.map((u) => ({ value: u.id, label: u.name })),
    ];

    const watcherOptions = [
        { value: '', label: 'None' },
        ...users.map((u) => ({ value: u.id, label: u.name })),
    ];

    const statusOptions = [
        { value: 'open', label: '🟢 Open' },
        { value: 'won', label: '🏆 Closed Won' },
        { value: 'lost', label: '🔴 Closed Lost' },
        { value: 'abandoned', label: '⚪ Abandoned' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-soft-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-soft-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                        {isEdit ? 'Edit Opportunity' : 'Create Opportunity'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-soft text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Deal Title Input */}
                    <Input
                        label="Opportunity Name *"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="e.g. Acme Corp Enterprise Deal"
                        error={errors.name}
                        required
                    />

                    {/* Contact & Monetary Value */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label="Primary Contact *"
                            value={data.contact_id}
                            onChange={(e) => setData('contact_id', e.target.value)}
                            options={contactOptions}
                            placeholder="Select Contact..."
                            error={errors.contact_id}
                            required
                        />

                        <Input
                            label="Monetary Value ($)"
                            type="number"
                            step="0.01"
                            value={data.monetary_value}
                            onChange={(e) => setData('monetary_value', e.target.value)}
                            placeholder="0.00"
                            error={errors.monetary_value}
                        />
                    </div>

                    {/* Stage & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label="Pipeline Stage *"
                            value={data.stage_id}
                            onChange={(e) => setData('stage_id', e.target.value)}
                            options={stageOptions}
                            placeholder="Select Stage..."
                            error={errors.stage_id}
                            required
                        />

                        <Select
                            label="Status"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            options={statusOptions}
                            placeholder={null}
                            error={errors.status}
                        />
                    </div>

                    {/* Sales Agent & Watcher Dual Control */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label="Primary Sales Agent"
                            value={data.assigned_user_id}
                            onChange={(e) => setData('assigned_user_id', e.target.value)}
                            options={userOptions}
                            placeholder={null}
                        />

                        <Select
                            label="Secondary Watcher / Manager"
                            value={data.deal_watcher_id}
                            onChange={(e) => setData('deal_watcher_id', e.target.value)}
                            options={watcherOptions}
                            placeholder={null}
                        />
                    </div>

                    {/* Custom DatePicker Component */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Expected Close Date
                        </label>
                        <DatePicker
                            value={data.expected_close_date}
                            onChange={(val) => setData('expected_close_date', val)}
                            placeholder="Pick close date..."
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        {isEdit ? (
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={handleDelete}
                                className="flex items-center gap-1.5"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        ) : (
                            <div />
                        )}

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={processing}
                            >
                                {isEdit ? 'Save Changes' : 'Create Opportunity'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
