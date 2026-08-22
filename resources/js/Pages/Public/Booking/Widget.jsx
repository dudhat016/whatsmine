import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Calendar, Clock, Video, CheckCircle2, Globe, ShieldCheck } from 'lucide-react';
import DatePicker from '@/Components/ui/DatePicker';

export default function Widget({ calendar, customFormFields = [] }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTimezone, setSelectedTimezone] = useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    );
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [step, setStep] = useState(1); // 1: Pick Time, 2: Lead Details, 3: Confirmed

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        notes: '',
    });
    const [customFieldValues, setCustomFieldValues] = useState({});
    const [additionalGuests, setAdditionalGuests] = useState(['']);
    const [bookingProcessing, setBookingProcessing] = useState(false);
    const [confirmedAppointment, setConfirmedAppointment] = useState(null);

    useEffect(() => {
        if (calendar?.slug && selectedDate) {
            setLoadingSlots(true);
            axios.get(`/b/${calendar.slug}/slots`, { params: { date: selectedDate, timezone: selectedTimezone } })
                .then(res => {
                    setSlots(res.data.slots || []);
                })
                .catch(() => setSlots([]))
                .finally(() => setLoadingSlots(false));
        }
    }, [calendar?.slug, selectedDate, selectedTimezone]);

    const getGoogleCalendarUrl = (app, cal) => {
        if (!app || !app.start_at) return '#';
        const start = new Date(app.start_at).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const end = new Date(app.end_at).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const title = encodeURIComponent(app.title || cal.name);
        const details = encodeURIComponent(`Meeting Join Link: ${app.meeting_join_url || ''}\n\n${cal.description || ''}`);
        const location = encodeURIComponent(app.meeting_join_url || cal.location_type);
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    };

    const getOutlookCalendarUrl = (app, cal) => {
        if (!app || !app.start_at) return '#';
        const start = new Date(app.start_at).toISOString();
        const end = new Date(app.end_at).toISOString();
        const title = encodeURIComponent(app.title || cal.name);
        const details = encodeURIComponent(`Meeting Join Link: ${app.meeting_join_url || ''}\n\n${cal.description || ''}`);
        const location = encodeURIComponent(app.meeting_join_url || cal.location_type);
        return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start}&enddt=${end}&body=${details}&location=${location}`;
    };

    const downloadIcsFile = (app, cal) => {
        if (!app || !app.start_at) return;
        const start = new Date(app.start_at).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const end = new Date(app.end_at).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WhatsMine//Calendar//EN\nBEGIN:VEVENT\nUID:${app.id || Date.now()}@whatsmine.com\nDTSTAMP:${start}\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${app.title || cal.name}\nDESCRIPTION:Join Link: ${app.meeting_join_url || ''}\nLOCATION:${app.meeting_join_url || cal.location_type}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `appointment-${app.id || 'booking'}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSelectSlot = (slot) => {
        setSelectedSlot(slot);
        setStep(2);
    };

    const handleBookSubmit = (e) => {
        e.preventDefault();
        setBookingProcessing(true);

        axios.post(`/b/${calendar.slug}/book`, {
            ...form,
            start_at: selectedSlot.start_at,
            timezone: selectedTimezone,
            payment_token: calendar.requires_payment ? 'tok_' + Date.now() : null,
            custom_fields: customFieldValues,
            additional_guests: additionalGuests.filter(g => g.trim() !== ''),
        })
        .then(res => {
            if (res.data.success) {
                if (res.data.redirect_url) {
                    window.location.href = res.data.redirect_url;
                    return;
                }
                setConfirmedAppointment(res.data.appointment);
                setStep(3);
            }
        })
        .catch(err => {
            alert(err.response?.data?.message || 'Failed to confirm booking. Please try again.');
        })
        .finally(() => setBookingProcessing(false));
    };

    const maxFutureDate = new Date(Date.now() + (calendar?.look_ahead_days || 30) * 86400000).toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <Head title={`Book ${calendar.name}`} />

            <div className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-3">
                {/* Left Sidebar */}
                <div className="p-6 bg-slate-900 text-white flex flex-col justify-between space-y-6 rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl">
                    <div>
                        <div className="text-xs uppercase tracking-wider font-semibold text-indigo-400 mb-2">
                            {calendar.type.replace('_', ' ')}
                        </div>
                        <h1 className="text-xl font-bold">{calendar.name}</h1>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-4">{calendar.description || 'Schedule your appointment in a few easy steps.'}</p>

                        <div className="mt-6 space-y-3 text-xs text-slate-300">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-400" />
                                <span>{calendar.duration_minutes} Minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-indigo-400" />
                                <span>{calendar.location_type.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            {calendar.is_recurring && (
                                <div className="flex items-center gap-2 text-amber-300 font-medium">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    <span>Recurring Series ({calendar.recurring_count}x {calendar.recurring_frequency})</span>
                                </div>
                            )}
                            {calendar.requires_payment && (
                                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                                    <span>${calendar.amount} {calendar.currency} Deposit</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800 text-xs">
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Timezone</span>
                            </label>
                            <select
                                value={selectedTimezone}
                                onChange={e => setSelectedTimezone(e.target.value)}
                                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="UTC">UTC (Coordinated Universal Time)</option>
                                <option value="America/New_York">Eastern Time (US & Canada)</option>
                                <option value="America/Chicago">Central Time (US & Canada)</option>
                                <option value="America/Denver">Mountain Time (US & Canada)</option>
                                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                                <option value="Europe/London">London / GMT</option>
                                <option value="Europe/Paris">Central European Time (CET)</option>
                                <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
                                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                                <option value="Asia/Singapore">Singapore / Hong Kong (SGT)</option>
                                <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                                <option value="Australia/Sydney">Australian Eastern Time (AEST)</option>
                            </select>
                        </div>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Powered by WhatsMine Booking Engine</span>
                    </div>
                </div>

                {/* Right Content */}
                <div className="md:col-span-2 p-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-600" />
                                Select Date & Time Slot
                            </h2>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Pick Date</label>
                                <DatePicker
                                    value={selectedDate}
                                    onChange={val => setSelectedDate(val)}
                                    mode="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    max={maxFutureDate}
                                    placeholder="Select booking date..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-2">Available Time Slots</label>
                                {loadingSlots ? (
                                    <p className="text-xs text-slate-400">Loading available times...</p>
                                ) : slots.length === 0 ? (
                                    <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg">No open slots on this date. Please pick another date.</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                                        {slots.map(s => (
                                            <button
                                                key={s.time}
                                                onClick={() => handleSelectSlot(s)}
                                                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-800 dark:text-slate-200 transition-colors"
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleBookSubmit} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Contact Details</h2>
                                <button type="button" onClick={() => setStep(1)} className="text-xs text-indigo-600 underline">Change Slot</button>
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-950/50 p-3 rounded-lg text-xs text-indigo-900 dark:text-indigo-200">
                                Selected Slot: <strong>{selectedSlot?.label}</strong> on <strong>{selectedDate}</strong>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">First Name *</label>
                                    <input
                                        required
                                        value={form.first_name}
                                        onChange={e => setForm({ ...form, first_name: e.target.value })}
                                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Last Name</label>
                                    <input
                                        value={form.last_name}
                                        onChange={e => setForm({ ...form, last_name: e.target.value })}
                                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address *</label>
                                <input
                                    required
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">WhatsApp / Phone Number *</label>
                                <input
                                    required
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    placeholder="+1234567890"
                                />
                            </div>

                            {/* Custom Intake Form Fields */}
                            {customFormFields.length > 0 && (
                                <div className="space-y-3 border-t border-dashed border-slate-200 dark:border-slate-800 pt-3">
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Additional Information</p>
                                    {customFormFields.map((field, idx) => (
                                        <div key={idx}>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                                                {field.label}{field.required ? ' *' : ''}
                                            </label>
                                            {field.type === 'select' ? (
                                                <select
                                                    required={!!field.required}
                                                    value={customFieldValues[field.name] || ''}
                                                    onChange={e => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                                                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                >
                                                    <option value="">Select an option...</option>
                                                    {(field.options || []).map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : field.type === 'textarea' ? (
                                                <textarea
                                                    required={!!field.required}
                                                    value={customFieldValues[field.name] || ''}
                                                    onChange={e => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                                                    rows={3}
                                                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                                                    placeholder={field.placeholder || ''}
                                                />
                                            ) : (
                                                <input
                                                    type={field.type || 'text'}
                                                    required={!!field.required}
                                                    value={customFieldValues[field.name] || ''}
                                                    onChange={e => setCustomFieldValues({ ...customFieldValues, [field.name]: e.target.value })}
                                                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                    placeholder={field.placeholder || ''}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Additional Guests */}
                            {calendar.allow_additional_guests && (
                                <div className="space-y-2 border-t border-dashed border-slate-200 dark:border-slate-800 pt-3">
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Additional Guest Emails</p>
                                    {additionalGuests.map((guest, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input
                                                type="email"
                                                value={guest}
                                                onChange={e => {
                                                    const updated = [...additionalGuests];
                                                    updated[idx] = e.target.value;
                                                    setAdditionalGuests(updated);
                                                }}
                                                className="flex-1 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                placeholder={`Guest ${idx + 1} email`}
                                            />
                                            {additionalGuests.length > 1 && (
                                                <button type="button" onClick={() => setAdditionalGuests(additionalGuests.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 text-xs">✕</button>
                                            )}
                                        </div>
                                    ))}
                                    {additionalGuests.length < 5 && (
                                        <button type="button" onClick={() => setAdditionalGuests([...additionalGuests, ''])} className="text-xs text-indigo-600 font-semibold hover:underline">
                                            + Add Guest Email
                                        </button>
                                    )}
                                </div>
                            )}

                            {calendar.requires_payment && (
                                <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                            <span>💳 Upfront Deposit Required</span>
                                        </div>
                                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                            ${calendar.amount} {calendar.currency}
                                        </span>
                                    </div>

                                    <div className="space-y-2 pt-1">
                                        <div>
                                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Cardholder Name *</label>
                                            <input
                                                type="text"
                                                required
                                                defaultValue={`${form.first_name} ${form.last_name}`}
                                                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                placeholder="Name on card"
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="col-span-2">
                                                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Card Number *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength="19"
                                                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                                                    placeholder="4242 •••• •••• 4242"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">CVC *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength="4"
                                                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                                                    placeholder="123"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                                        🔒 Encrypted 256-bit SSL Card Payment Gateway. Deposit reserves your slot instantly.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={bookingProcessing}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-colors"
                            >
                                {bookingProcessing
                                    ? 'Processing Payment...'
                                    : calendar.requires_payment
                                    ? `Pay $${calendar.amount} ${calendar.currency} Deposit & Book Call`
                                    : 'Confirm Appointment'}
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="text-center py-6 space-y-4">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appointment Confirmed!</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                A WhatsApp message and Email confirmation have been dispatched to <strong>{form.email}</strong>.
                            </p>

                            {confirmedAppointment?.meeting_join_url && (
                                <a
                                    href={confirmedAppointment.meeting_join_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-block my-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                                >
                                    🎥 Join Meeting Room
                                </a>
                            )}

                            {/* 1-Tap Add to Calendar Buttons */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    📅 Add Event to your Personal Calendar:
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <a
                                        href={getGoogleCalendarUrl(confirmedAppointment, calendar)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition"
                                    >
                                        Google Calendar
                                    </a>
                                    <a
                                        href={getOutlookCalendarUrl(confirmedAppointment, calendar)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition"
                                    >
                                        Outlook Calendar
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => downloadIcsFile(confirmedAppointment, calendar)}
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition"
                                    >
                                        Apple / iCal (.ics)
                                    </button>
                                </div>
                            </div>

                            {/* Reschedule & Cancel Info */}
                            {confirmedAppointment?.reschedule_token && (
                                <div className="pt-3 text-[11px] text-slate-500 dark:text-slate-400">
                                    Need to change time? You can{' '}
                                    <a
                                        href={`/b/reschedule/${confirmedAppointment.reschedule_token}`}
                                        className="text-indigo-600 dark:text-indigo-400 font-semibold underline"
                                    >
                                        Reschedule
                                    </a>{' '}
                                    or{' '}
                                    <a
                                        href={`/b/cancel/${confirmedAppointment.reschedule_token}`}
                                        className="text-rose-500 font-semibold underline"
                                    >
                                        Cancel
                                    </a>{' '}
                                    your appointment anytime.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
