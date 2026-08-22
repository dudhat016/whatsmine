import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Calendar, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import DatePicker from '@/Components/ui/DatePicker';

export default function Reschedule({ appointment, calendar }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [rescheduledSuccess, setRescheduledSuccess] = useState(false);

    useEffect(() => {
        if (calendar?.slug && selectedDate) {
            setLoadingSlots(true);
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
            axios.get(`/b/${calendar.slug}/slots`, { params: { date: selectedDate, timezone: userTimezone } })
                .then(res => {
                    setSlots(res.data.slots || []);
                })
                .catch(() => setSlots([]))
                .finally(() => setLoadingSlots(false));
        }
    }, [calendar?.slug, selectedDate]);

    const handleRescheduleSubmit = () => {
        if (!selectedSlot) return;
        setProcessing(true);
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

        axios.post(`/b/reschedule/${appointment.reschedule_token}`, {
            start_at: selectedSlot.start_at,
            timezone: userTimezone,
        })
        .then(res => {
            if (res.data.success) {
                setRescheduledSuccess(true);
            }
        })
        .catch(err => {
            alert(err.response?.data?.message || 'Failed to reschedule. Please try again.');
        })
        .finally(() => setProcessing(false));
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <Head title={`Reschedule Appointment - ${calendar.name}`} />

            <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6">
                {!rescheduledSuccess ? (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                            <RefreshCw className="w-6 h-6 animate-spin-slow" />
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Reschedule Your Call</h1>
                                <p className="text-xs text-slate-500">{calendar.name} ({calendar.duration_minutes} Mins)</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
                            Current Booking: <strong>{new Date(appointment.start_at).toLocaleString()}</strong>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Select New Date</label>
                            <DatePicker
                                value={selectedDate}
                                onChange={val => setSelectedDate(val)}
                                mode="date"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Available Time Slots</label>
                            {loadingSlots ? (
                                <div className="text-center py-6 text-xs text-slate-400">Loading available time slots...</div>
                            ) : slots.length === 0 ? (
                                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                                    No available slots on this date.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {slots.map((slot, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`p-2 rounded-xl text-xs font-medium border transition ${
                                                selectedSlot?.start_at === slot.start_at
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-500'
                                            }`}
                                        >
                                            {slot.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            disabled={!selectedSlot || processing}
                            onClick={handleRescheduleSubmit}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                        >
                            {processing ? 'Rescheduling...' : 'Confirm New Time Slot'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-8 space-y-4">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appointment Rescheduled!</h2>
                        <p className="text-xs text-slate-500">
                            Your call has been updated to <strong>{selectedSlot?.label}</strong> on <strong>{selectedDate}</strong>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
