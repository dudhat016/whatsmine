import React from 'react';
import { Head } from '@inertiajs/react';
import { XCircle, Calendar } from 'lucide-react';

export default function Cancelled({ appointment, calendar }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <Head title={`Appointment Cancelled - ${calendar.name}`} />

            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 text-center space-y-4">
                <XCircle className="w-14 h-14 text-rose-500 mx-auto" />
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Appointment Cancelled</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your appointment for <strong>{calendar.name}</strong> has been cancelled.
                </p>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <a
                        href={`/b/${calendar.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                    >
                        <Calendar className="w-4 h-4" />
                        <span>Book a New Appointment</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
