import { Head, Link, router, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import EmptyState from '@/Components/EmptyState';
import { Plus, Trash2, Code, ExternalLink, Pencil, Check, FormInput, ShieldCheck, Layers } from 'lucide-react';
import { useState } from 'react';

export default function FormsIndex({ forms }) {
    const { props } = usePage();
    const flash = props.flash ?? {};
    const [copied, setCopied] = useState(null);

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this subscription form?')) {
            router.delete(route('client.forms.destroy', id), { preserveScroll: true });
        }
    };

    const handleCopyIframe = (slug) => {
        const snippet = `<iframe src="${window.location.origin}/subscribe/${slug}" width="100%" height="550" frameborder="0" style="border:0;overflow:hidden;" scrolling="no"></iframe>`;
        navigator.clipboard?.writeText(snippet);
        setCopied(slug);
        setTimeout(() => setCopied(null), 2500);
    };

    return (
        <ClientLayout title="Subscription & Lead Forms">
            <Head title="Subscription Forms" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FormInput className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                            Subscription & Lead Forms
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Build standalone lead forms with custom fields and Double OTP verification to collect verified contacts anywhere.
                        </p>
                    </div>
                    <Link
                        href={route('client.forms.create')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Create Form
                    </Link>
                </div>

                {flash.success && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl text-sm">
                        {flash.success}
                    </div>
                )}

                {/* Forms Grid */}
                {forms.length === 0 ? (
                    <EmptyState
                        icon={<FormInput className="w-8 h-8" />}
                        title="No Subscription Forms Created"
                        description="Create your first subscription form to start collecting verified leads on external HTML sites or WordPress."
                        action={{
                            label: 'Create Subscription Form',
                            href: route('client.forms.create'),
                        }}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {forms.map((form) => (
                            <div
                                key={form.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                                            {form.name}
                                        </h3>
                                        <span
                                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full shrink-0 ${
                                                form.is_active
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            {form.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>

                                    {form.title && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                            "{form.title}"
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs rounded-lg border border-gray-200 dark:border-gray-600">
                                            <Layers className="w-3 h-3" />
                                            {form.type}
                                        </span>
                                        {form.double_optin_enabled && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                <ShieldCheck className="w-3 h-3" />
                                                OTP Verified ({form.optin_channel})
                                            </span>
                                        )}
                                    </div>

                                    <div className="pt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                                        <span>Submissions:</span>
                                        <span className="font-bold text-gray-900 dark:text-white text-sm">
                                            {form.submissions_count ?? 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={route('client.forms.show', form.id)}
                                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                                            title="View Embed Code & Submissions"
                                        >
                                            <Code className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={route('client.forms.edit', form.id)}
                                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                                            title="Edit Form"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                        <a
                                            href={route('public.subscribe.show', form.slug)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                                            title="Preview Form"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyIframe(form.slug)}
                                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition flex items-center gap-1"
                                        >
                                            {copied === form.slug ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                                    Copied!
                                                </>
                                            ) : (
                                                'Copy iFrame'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(form.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                                            title="Delete Form"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ClientLayout>
    );
}
