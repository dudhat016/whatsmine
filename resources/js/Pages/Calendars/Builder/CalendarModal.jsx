import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/ui/Modal';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import Checkbox from '@/Components/ui/Checkbox';
import DatePicker from '@/Components/ui/DatePicker';
import MultiSelect from '@/Components/ui/MultiSelect';
import { Settings, Clock } from 'lucide-react';

const DAYS = [
    { day_of_week: 0, label: 'Sunday' },
    { day_of_week: 1, label: 'Monday' },
    { day_of_week: 2, label: 'Tuesday' },
    { day_of_week: 3, label: 'Wednesday' },
    { day_of_week: 4, label: 'Thursday' },
    { day_of_week: 5, label: 'Friday' },
    { day_of_week: 6, label: 'Saturday' },
];

const buildDefaultAvailability = (existingSlots = []) => {
    return DAYS.map(d => {
        const found = existingSlots?.find(s => s.day_of_week === d.day_of_week);
        if (found) {
            return {
                day_of_week: d.day_of_week,
                label: d.label,
                is_active: !!found.is_active,
                start_time: found.start_time ? found.start_time.substring(0, 5) : '09:00',
                end_time: found.end_time ? found.end_time.substring(0, 5) : '17:00',
            };
        }
        const isWeekday = d.day_of_week >= 1 && d.day_of_week <= 5;
        return {
            day_of_week: d.day_of_week,
            label: d.label,
            is_active: isWeekday,
            start_time: '09:00',
            end_time: '17:00',
        };
    });
};

export default function CalendarModal({ isOpen, onClose, calendar = null, workspaceUsers = [], workspaceForms = [] }) {
    const isEdit = !!calendar;
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'availability'
    const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        type: 'personal',
        duration_minutes: 30,
        slot_interval_minutes: 30,
        pre_buffer_minutes: 0,
        post_buffer_minutes: 0,
        min_notice_hours: 2,
        look_ahead_days: 30,
        redirect_url: '',
        location_type: 'google_meet',
        location_custom: '',
        requires_payment: false,
        amount: '0.00',
        is_recurring: false,
        recurring_frequency: 'weekly',
        recurring_count: 4,
        custom_form_id: '',
        allow_additional_guests: false,
        team_members: [],
        availability: buildDefaultAvailability(),
    });

    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (calendar) {
            setForm({
                name: calendar.name || '',
                description: calendar.description || '',
                type: calendar.type || 'personal',
                duration_minutes: calendar.duration_minutes || 30,
                slot_interval_minutes: calendar.slot_interval_minutes || 30,
                pre_buffer_minutes: calendar.pre_buffer_minutes || 0,
                post_buffer_minutes: calendar.post_buffer_minutes || 0,
                min_notice_hours: calendar.min_notice_hours ?? 2,
                look_ahead_days: calendar.look_ahead_days ?? 30,
                max_bookings_per_day: calendar.max_bookings_per_day || '',
                max_capacity: calendar.max_capacity || 1,
                round_robin_mode: calendar.round_robin_mode || 'optimize_for_availability',
                redirect_url: calendar.redirect_url || '',
                location_type: calendar.location_type || 'google_meet',
                location_custom: calendar.location_custom || '',
                requires_payment: !!calendar.requires_payment,
                amount: calendar.amount || '0.00',
                is_recurring: !!calendar.is_recurring,
                recurring_frequency: calendar.recurring_frequency || 'weekly',
                recurring_count: calendar.recurring_count || 4,
                custom_form_id: calendar.custom_form_id || '',
                allow_additional_guests: !!calendar.allow_additional_guests,
                team_members: calendar.team_members?.map(m => m.user_id) || [],
                availability: buildDefaultAvailability(calendar.availability_slots),
                date_overrides: calendar.date_overrides?.map(d => ({ override_date: d.override_date })) || [],
            });
        } else {
            setForm({
                name: '',
                description: '',
                type: 'personal',
                duration_minutes: 30,
                slot_interval_minutes: 30,
                pre_buffer_minutes: 0,
                post_buffer_minutes: 0,
                min_notice_hours: 2,
                look_ahead_days: 30,
                max_bookings_per_day: '',
                max_capacity: 1,
                round_robin_mode: 'optimize_for_availability',
                redirect_url: '',
                location_type: 'google_meet',
                location_custom: '',
                requires_payment: false,
                amount: '0.00',
                is_recurring: false,
                recurring_frequency: 'weekly',
                recurring_count: 4,
                custom_form_id: '',
                allow_additional_guests: false,
                team_members: [],
                availability: buildDefaultAvailability(),
                date_overrides: [],
            });
        }
        setActiveTab('general');
    }, [calendar, isOpen]);

    const handleAvailabilityChange = (index, field, value) => {
        const updated = [...form.availability];
        updated[index][field] = value;
        setForm({ ...form, availability: updated });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);

        if (isEdit) {
            router.put(route('client.calendars.update', calendar.id), form, {
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                },
            });
        } else {
            router.post(route('client.calendars.store'), form, {
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                },
            });
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="xl">
            <Modal.Header title={isEdit ? 'Edit Booking Calendar' : 'Create New Booking Calendar'} onClose={onClose} />
            
            {/* Sub-tabs header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-50 dark:bg-slate-900/50">
                <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                        activeTab === 'general'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Settings className="w-3.5 h-3.5" />
                    General & Location
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('availability')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                        activeTab === 'availability'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Clock className="w-3.5 h-3.5" />
                    Available Time & Hours
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-4 text-slate-800 dark:text-slate-100 max-h-[65vh] overflow-y-auto">
                    {activeTab === 'general' ? (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Calendar Name</label>
                                <Input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Executive Discovery Call"
                                    required
                                />
                            </div>

                            {/* Calendar Type Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Calendar Type</label>
                                <Select
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value })}
                                    placeholder={null}
                                    options={[
                                        { value: 'personal', label: 'Personal (1-on-1 Dedicated Host)' },
                                        { value: 'round_robin', label: 'Round-Robin (Team Auto Routing)' },
                                        { value: 'class', label: 'Class / Group Session' },
                                        { value: 'collective', label: 'Collective (Multi-Host Simultaneous)' },
                                    ]}
                                />
                            </div>

                            {/* 1. Round-Robin Specific Options */}
                            {form.type === 'round_robin' && (
                                <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                                    <label className="block text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                                        Round-Robin Routing Distribution Policy
                                    </label>
                                    <Select
                                        value={form.round_robin_mode}
                                        onChange={e => setForm({ ...form, round_robin_mode: e.target.value })}
                                        placeholder={null}
                                        options={[
                                            { value: 'optimize_for_availability', label: 'Max Availability — Route call to any free staff host' },
                                            { value: 'equal_distribution', label: 'Equal Distribution — Balance booking counts evenly across staff' },
                                        ]}
                                    />
                                    <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                                        Automatically assigns incoming bookings to staff members based on availability or workload balance.
                                    </p>
                                </div>
                            )}

                            {/* 2. Class / Group Session Specific Options */}
                            {form.type === 'class' && (
                                <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-100 dark:border-amber-900/40 space-y-2">
                                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200">
                                        Class Seat Capacity (Max Attendees Per Time Slot)
                                    </label>
                                    <Input
                                        type="number"
                                        value={form.max_capacity}
                                        onChange={e => setForm({ ...form, max_capacity: parseInt(e.target.value, 10) })}
                                        min="1"
                                        max="500"
                                        placeholder="e.g. 20 Seats"
                                        required
                                    />
                                    <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                                        Allows multiple leads to book the exact same time slot until maximum seat capacity is filled.
                                    </p>
                                </div>
                            )}

                            {/* 3. Collective Multi-Host Specific Banner */}
                            {form.type === 'collective' && (
                                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                                    <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                                        👥 Collective Call Mode Active
                                    </p>
                                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                                        Time slots will only display when ALL assigned staff hosts are free simultaneously. Every assigned staff member will be added to the meeting.
                                    </p>
                                </div>
                            )}

                            {/* Staff Member Multi-Select with Type-Aware Label */}
                            <MultiSelect
                                label={
                                    form.type === 'personal'
                                        ? 'Dedicated Staff Host'
                                        : form.type === 'collective'
                                        ? 'Required Hosts (All Must Be Free)'
                                        : 'Assigned Host Staff Pool'
                                }
                                value={form.team_members}
                                onChange={vals => setForm({ ...form, team_members: vals })}
                                options={workspaceUsers.map(u => ({ value: u.id, label: u.name }))}
                                placeholder={form.type === 'personal' ? 'Select dedicated staff host...' : 'Select host staff members...'}
                            />

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description (Optional)</label>
                                <Input
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief overview shown to visitors on booking page"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Duration (Minutes)</label>
                                    <Input
                                        type="number"
                                        value={form.duration_minutes}
                                        onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value, 10) })}
                                        min="5"
                                        max="480"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Slot Interval (Minutes)</label>
                                    <Input
                                        type="number"
                                        value={form.slot_interval_minutes}
                                        onChange={e => setForm({ ...form, slot_interval_minutes: parseInt(e.target.value, 10) })}
                                        min="5"
                                        max="240"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Pre-Buffer Padding (Mins)</label>
                                    <Input
                                        type="number"
                                        value={form.pre_buffer_minutes}
                                        onChange={e => setForm({ ...form, pre_buffer_minutes: parseInt(e.target.value, 10) })}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Post-Buffer Padding (Mins)</label>
                                    <Input
                                        type="number"
                                        value={form.post_buffer_minutes}
                                        onChange={e => setForm({ ...form, post_buffer_minutes: parseInt(e.target.value, 10) })}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Minimum Notice (Hours)</label>
                                    <Input
                                        type="number"
                                        value={form.min_notice_hours}
                                        onChange={e => setForm({ ...form, min_notice_hours: parseInt(e.target.value, 10) })}
                                        min="0"
                                        max="72"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Look-Ahead Range (Days)</label>
                                    <Input
                                        type="number"
                                        value={form.look_ahead_days}
                                        onChange={e => setForm({ ...form, look_ahead_days: parseInt(e.target.value, 10) })}
                                        min="1"
                                        max="90"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Custom Thank-You Redirect URL (Optional)</label>
                                <Input
                                    type="url"
                                    value={form.redirect_url}
                                    onChange={e => setForm({ ...form, redirect_url: e.target.value })}
                                    placeholder="https://mycompany.com/thank-you"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Daily Maximum Booking Cap (Optional)</label>
                                <Input
                                    type="number"
                                    value={form.max_bookings_per_day}
                                    onChange={e => setForm({ ...form, max_bookings_per_day: e.target.value })}
                                    min="1"
                                    placeholder="e.g. 4 (Leave empty for unlimited bookings/day)"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Meeting Joining Location</label>
                                <Select
                                    value={form.location_type}
                                    onChange={e => setForm({ ...form, location_type: e.target.value })}
                                    placeholder={null}
                                    options={[
                                        { value: 'google_meet', label: 'Google Meet (Auto-generated link)' },
                                        { value: 'zoom', label: 'Zoom Video Call' },
                                        { value: 'whatsapp', label: 'WhatsApp Audio / Video Call' },
                                        { value: 'phone', label: 'Outbound Phone Call' },
                                        { value: 'address', label: 'Physical Address' },
                                        { value: 'custom', label: 'Custom URL Link' },
                                    ]}
                                />
                            </div>

                            {['address', 'custom'].includes(form.location_type) && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Custom Location Details</label>
                                    <Input
                                        value={form.location_custom}
                                        onChange={e => setForm({ ...form, location_custom: e.target.value })}
                                        placeholder="Enter physical address or join link"
                                    />
                                </div>
                            )}

                            <div className="pt-2">
                                <Checkbox
                                    id="requires_payment"
                                    label="Require upfront deposit / payment to confirm booking"
                                    checked={form.requires_payment}
                                    onChange={e => setForm({ ...form, requires_payment: e.target.checked })}
                                />
                            </div>

                            {/* Custom Intake Form Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Custom Intake Form (Optional)</label>
                                <Select
                                    value={form.custom_form_id}
                                    onChange={e => setForm({ ...form, custom_form_id: e.target.value })}
                                    placeholder={null}
                                    options={[
                                        { value: '', label: 'No extra form — use default fields only' },
                                        ...workspaceForms.map(f => ({ value: f.id, label: f.title || f.name }))
                                    ]}
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Attach a CRM subscription form to collect qualifying questions before the booking is confirmed.</p>
                            </div>

                            {/* Allow Additional Guest Emails */}
                            <div className="pt-1">
                                <Checkbox
                                    id="allow_additional_guests"
                                    label="Allow leads to add additional guest email addresses"
                                    checked={form.allow_additional_guests}
                                    onChange={e => setForm({ ...form, allow_additional_guests: e.target.checked })}
                                />
                            </div>

                            {form.requires_payment && (
                                <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Deposit Amount ($ USD)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={form.amount}
                                            onChange={e => setForm({ ...form, amount: e.target.value })}
                                            placeholder="50.00"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        ⚡ Collected via your workspace default payment gateway (Stripe / PayPal / Razorpay) configured in Payment Settings.
                                    </p>
                                </div>
                            )}

                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                <Checkbox
                                    id="is_recurring"
                                    label="Enable Recurring Meeting Series (Auto-repeat sessions)"
                                    checked={form.is_recurring}
                                    onChange={e => setForm({ ...form, is_recurring: e.target.checked })}
                                />
                            </div>

                            {form.is_recurring && (
                                <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Recurrence Frequency</label>
                                        <Select
                                            value={form.recurring_frequency}
                                            onChange={e => setForm({ ...form, recurring_frequency: e.target.value })}
                                            placeholder={null}
                                            options={[
                                                { value: 'daily', label: 'Daily (Every Day)' },
                                                { value: 'weekly', label: 'Weekly (Every Week)' },
                                                { value: 'monthly', label: 'Monthly (Every Month)' },
                                            ]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Total Repeat Sessions</label>
                                        <Input
                                            type="number"
                                            value={form.recurring_count}
                                            onChange={e => setForm({ ...form, recurring_count: parseInt(e.target.value, 10) })}
                                            min="2"
                                            max="52"
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500">
                                Configure the available operating hours for each day of the week. Only active days will display available time slots on the booking page.
                            </p>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {form.availability.map((day, idx) => (
                                    <div key={day.day_of_week} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                                        <div className="w-32">
                                            <Checkbox
                                                id={`day_${day.day_of_week}`}
                                                label={day.label}
                                                checked={day.is_active}
                                                onChange={e => handleAvailabilityChange(idx, 'is_active', e.target.checked)}
                                            />
                                        </div>

                                        {day.is_active ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={day.start_time}
                                                    onChange={e => handleAvailabilityChange(idx, 'start_time', e.target.value)}
                                                    className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                                                />
                                                <span className="text-slate-400">to</span>
                                                <input
                                                    type="time"
                                                    value={day.end_time}
                                                    onChange={e => handleAvailabilityChange(idx, 'end_time', e.target.value)}
                                                    className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">Unavailable / Closed</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Specific Date Overrides / Holiday Blockouts</h3>
                                        <p className="text-[11px] text-slate-400">Block specific calendar dates (e.g., Dec 25, Jan 1, vacation days) as unavailable.</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="xs"
                                        onClick={() => setForm({ ...form, date_overrides: [...form.date_overrides, { override_date: '' }] })}
                                    >
                                        + Add Blockout Date
                                    </Button>
                                </div>

                                {form.date_overrides.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                                        No specific holiday blockout dates added yet.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {form.date_overrides.map((ov, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                                <div className="w-48">
                                                    <DatePicker
                                                        value={ov.override_date}
                                                        onChange={val => {
                                                            const updated = [...form.date_overrides];
                                                            updated[oIdx].override_date = val;
                                                            setForm({ ...form, date_overrides: updated });
                                                        }}
                                                        mode="date"
                                                        placeholder="Select blockout date..."
                                                    />
                                                </div>
                                                <span className="text-xs text-rose-500 font-medium">Marked as Closed / Blocked</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, date_overrides: form.date_overrides.filter((_, i) => i !== oIdx) })}
                                                    className="ml-auto text-xs text-slate-400 hover:text-rose-600 font-bold px-2 py-1"
                                                >
                                                    ✕ Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={processing}>
                        {processing ? 'Saving...' : (isEdit ? 'Update Calendar' : 'Create Calendar')}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
