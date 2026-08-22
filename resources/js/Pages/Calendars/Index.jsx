import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import Button from '@/Components/ui/Button';
import Badge from '@/Components/ui/Badge';
import CalendarModal from './Builder/CalendarModal';
import EmbedModal from './Builder/EmbedModal';
import ManualBookingModal from './Builder/ManualBookingModal';
import { Calendar, Plus, Users, Clock, Video, CheckCircle2, ExternalLink, Trash2, Edit2, ShieldAlert, Code, UserPlus } from 'lucide-react';

export default function Index({ calendars = [], appointments = [], workspaceUsers = [], workspaceForms = [], stats = {} }) {
    const [activeTab, setActiveTab] = useState('calendars');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCalendar, setSelectedCalendar] = useState(null);
    const [isEmbedOpen, setIsEmbedOpen] = useState(false);
    const [embedCalendar, setEmbedCalendar] = useState(null);
    const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);

    const handleOpenEmbed = (cal) => {
        setEmbedCalendar(cal);
        setIsEmbedOpen(true);
    };

    const handleOpenCreate = () => {
        setSelectedCalendar(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cal) => {
        setSelectedCalendar(cal);
        setIsModalOpen(true);
    };

    const handleDelete = (cal) => {
        if (confirm(`Are you sure you want to delete calendar "${cal.name}"?`)) {
            router.delete(route('client.calendars.destroy', cal.id));
        }
    };

    const handleUpdateStatus = (appId, newStatus) => {
        router.put(route('client.calendars.appointments.status', appId), { status: newStatus });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed': return <Badge variant="success">Confirmed</Badge>;
            case 'rescheduled': return <Badge variant="warning">Rescheduled</Badge>;
            case 'cancelled': return <Badge variant="danger">Cancelled</Badge>;
            case 'completed': return <Badge variant="info">Completed</Badge>;
            case 'no_show': return <Badge variant="secondary">No-Show</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <ClientLayout title="Appointment Booking & Calendars">
            <Head title="Appointment Booking & Calendars" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            Appointment Booking & Calendars
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Manage team round-robin routing, 1-on-1 personal booking pages, and public calendar availability.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={() => setIsManualBookingOpen(true)} className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Book for Client
                        </Button>
                        <Button variant="primary" onClick={handleOpenCreate} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create New Calendar
                        </Button>
                    </div>
                </div>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Calendars</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total_calendars ?? calendars.length}</p>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Upcoming Appointments</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.upcoming_appointments ?? 0}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed Sessions</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.completed_appointments ?? 0}</p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Team Hosts</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{workspaceUsers.length}</p>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6">
                    <button
                        onClick={() => setActiveTab('calendars')}
                        className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'calendars'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                    >
                        Booking Calendars ({calendars.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'appointments'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                    >
                        Appointments Log ({appointments.length})
                    </button>
                </div>

                {/* Tab Content: Calendars */}
                {activeTab === 'calendars' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {calendars.map(cal => (
                            <div key={cal.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{cal.name}</h3>
                                        <Badge variant={cal.type === 'round_robin' ? 'primary' : 'secondary'}>
                                            {cal.type.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{cal.description || 'No description provided.'}</p>

                                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span>Duration: <strong>{cal.duration_minutes} Minutes</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Video className="w-4 h-4 text-slate-400" />
                                            <span>Location: <strong>{cal.location_type.replace('_', ' ').toUpperCase()}</strong></span>
                                        </div>
                                        {cal.requires_payment && (
                                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                <span>Deposit Required: ${cal.amount} {cal.currency}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <a
                                            href={route('public.booking.widget', cal.slug)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Public Link
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEmbed(cal)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                                        >
                                            <Code className="w-3.5 h-3.5" />
                                            Embed Code
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(cal)}>
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(cal)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab Content: Appointments */}
                {activeTab === 'appointments' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-3">Title / Client</th>
                                    <th className="p-3">Calendar</th>
                                    <th className="p-3">Date & Time</th>
                                    <th className="p-3">Host Staff</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                                            No appointments booked yet.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map(app => (
                                        <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-3 font-semibold text-slate-900 dark:text-white">
                                                {app.title}
                                                <div className="text-[11px] text-slate-400 font-normal">{app.contact?.email || 'Guest User'} • {app.contact?.phone_e164 || ''}</div>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="secondary">{app.calendar?.name || 'Calendar'}</Badge>
                                            </td>
                                            <td className="p-3 font-medium">
                                                {new Date(app.start_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300">
                                                {app.assigned_user?.name || 'Unassigned'}
                                            </td>
                                            <td className="p-3">
                                                {getStatusBadge(app.status)}
                                            </td>
                                            <td className="p-3 text-right">
                                                <select
                                                    value={app.status}
                                                    onChange={e => handleUpdateStatus(app.id, e.target.value)}
                                                    className="text-xs p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                                                >
                                                    <option value="confirmed">Mark Confirmed</option>
                                                    <option value="completed">Mark Completed</option>
                                                    <option value="no_show">Mark No-Show</option>
                                                    <option value="cancelled">Mark Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CalendarModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                calendar={selectedCalendar}
                workspaceUsers={workspaceUsers}
                workspaceForms={workspaceForms}
            />

            <EmbedModal
                isOpen={isEmbedOpen}
                onClose={() => setIsEmbedOpen(false)}
                calendar={embedCalendar}
            />

            <ManualBookingModal
                isOpen={isManualBookingOpen}
                onClose={() => setIsManualBookingOpen(false)}
                calendars={calendars}
                workspaceUsers={workspaceUsers}
            />
        </ClientLayout>
    );
}
