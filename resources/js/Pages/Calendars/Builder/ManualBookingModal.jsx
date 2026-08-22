import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/ui/Modal';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import DatePicker from '@/Components/ui/DatePicker';

export default function ManualBookingModal({ isOpen, onClose, calendars = [], workspaceUsers = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        calendar_id: calendars[0]?.id || '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        start_at: '',
        assigned_user_id: workspaceUsers[0]?.id || '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('client.calendars.manual_book'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <Modal.Header title="Book Manual Appointment for Client" onClose={onClose} />
            <form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Target Calendar <span className="text-rose-500">*</span>
                        </label>
                        <Select
                            value={data.calendar_id}
                            onChange={e => setData('calendar_id', e.target.value)}
                            options={calendars.map(c => ({ value: c.id, label: `${c.name} (${c.duration_minutes} Mins)` }))}
                            required
                        />
                        {errors.calendar_id && <p className="text-xs text-rose-500 mt-1">{errors.calendar_id}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                First Name <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={data.first_name}
                                onChange={e => setData('first_name', e.target.value)}
                                placeholder="John"
                                required
                            />
                            {errors.first_name && <p className="text-xs text-rose-500 mt-1">{errors.first_name}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                            <Input
                                type="text"
                                value={data.last_name}
                                onChange={e => setData('last_name', e.target.value)}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Email Address <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="client@example.com"
                                required
                            />
                            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp Phone</label>
                            <Input
                                type="text"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                                placeholder="+1234567890"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Date & Start Time <span className="text-rose-500">*</span>
                            </label>
                            <DatePicker
                                mode="datetime"
                                value={data.start_at}
                                onChange={val => setData('start_at', val)}
                                placeholder="Select date and start time"
                                error={errors.start_at}
                                required
                            />
                            {errors.start_at && <p className="text-xs text-rose-500 mt-1">{errors.start_at}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign Staff Member</label>
                            <Select
                                value={data.assigned_user_id}
                                onChange={e => setData('assigned_user_id', e.target.value)}
                                options={workspaceUsers.map(u => ({ value: u.id, label: u.name }))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Internal Notes / Call Agenda</label>
                        <textarea
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            rows="2"
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2"
                            placeholder="Reason for meeting or special request details..."
                        ></textarea>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={processing}>
                        {processing ? 'Booking...' : 'Book Appointment'}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
}
