import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { Modal, Input, Select, DatePicker, Button } from '@/Components/ui';
import { useConfirm } from '@/context/ConfirmationContext';

export default function OpportunityModal({
    isOpen,
    onClose,
    onSuccess,
    deal,
    pipelineId,
    stageId,
    stages,
    contacts,
    users,
}) {
    const isEdit = !!deal;
    const { confirm } = useConfirm();

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
                    if (onSuccess) onSuccess();
                    else onClose();
                    reset();
                },
            });
        } else {
            post(route('client.opportunities.deals.store'), {
                onSuccess: () => {
                    if (onSuccess) onSuccess();
                    else onClose();
                    reset();
                },
            });
        }
    };

    const handleDelete = async () => {
        if (!deal) return;
        const ok = await confirm({
            title: 'Delete Opportunity',
            message: 'Are you sure you want to delete this opportunity? This action cannot be undone.',
            confirmText: 'Delete',
            variant: 'danger',
        });
        if (!ok) return;

        destroy(route('client.opportunities.deals.destroy', deal.id), {
            onSuccess: () => {
                if (onSuccess) onSuccess();
                else onClose();
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
        <Modal show={isOpen} onClose={onClose} maxWidth="lg">
            <Modal.Header
                title={isEdit ? 'Edit Opportunity' : 'Create Opportunity'}
                onClose={onClose}
            />

            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-4 max-h-[70vh] overflow-y-auto">
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

                    {/* Lost or Abandoned Reason */}
                    {(data.status === 'lost' || data.status === 'abandoned') && (
                        <div>
                            <Input
                                label={data.status === 'lost' ? 'Lost Reason' : 'Abandonment Reason'}
                                value={data.lost_reason}
                                onChange={(e) => setData('lost_reason', e.target.value)}
                                placeholder={data.status === 'lost' ? 'e.g. Competitor Chosen, Budget Too High...' : 'e.g. Lead Unresponsive, Project Cancelled...'}
                                error={errors.lost_reason}
                            />
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer className="justify-between">
                    {isEdit ? (
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                        >
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
                            loading={processing}
                        >
                            {isEdit ? 'Save Changes' : 'Create Opportunity'}
                        </Button>
                    </div>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
