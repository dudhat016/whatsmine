import { Head, Link } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { ArrowLeft, Check, Code, Copy, ExternalLink, FormInput, ShieldCheck, Users, Globe } from 'lucide-react';
import { useState } from 'react';

export default function FormsShow({ form, appUrl }) {
    const [copiedField, setCopiedField] = useState(null);

    const publicUrl = `${appUrl}/subscribe/${form.slug}`;
    const iframeSnippet = `<iframe src="${publicUrl}" width="100%" height="550" frameborder="0" style="border:0;overflow:hidden;" scrolling="no"></iframe>`;
    const apiUrl = `${appUrl}/api/v1/subscribe/${form.slug}`;

    const apiPayloadSample = JSON.stringify(
        {
            email: 'user@example.com',
            first_name: 'John',
            last_name: 'Doe',
            phone_e164: '+1234567890',
            custom_fields: {
                company_name: 'Acme Corp',
            },
        },
        null,
        2
    );

    const handleCopy = (text, fieldName) => {
        navigator.clipboard?.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2500);
    };

    return (
        <ClientLayout title={`Form Details - ${form.name}`}>
            <Head title={`Details - ${form.name}`} />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('client.forms.index')}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {form.name}
                                </h1>
                                <span
                                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                                        form.is_active
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {form.is_active ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Slug: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{form.slug}</code>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 transition"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Public Link
                        </a>
                        <Link
                            href={route('client.forms.edit', form.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition"
                        >
                            Edit Form
                        </Link>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Total Submissions</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{form.submissions_count ?? 0}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Double OTP Status</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {form.double_optin_enabled ? `Enabled (${form.optin_channel.toUpperCase()})` : 'Disabled'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Embed Mode</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{form.type}</span>
                        </div>
                    </div>
                </div>

                {/* Embed Codes Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <Code className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        Embed Codes & Integration Options
                    </h2>

                    {/* Option 1: iFrame */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                1. HTML iFrame Snippet (For Websites & WordPress)
                            </label>
                            <button
                                type="button"
                                onClick={() => handleCopy(iframeSnippet, 'iframe')}
                                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
                            >
                                {copiedField === 'iframe' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedField === 'iframe' ? 'Copied Code!' : 'Copy Code'}
                            </button>
                        </div>
                        <pre className="p-3 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono overflow-x-auto">
                            {iframeSnippet}
                        </pre>
                    </div>

                    {/* Option 2: Direct Link */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                2. Direct Public URL
                            </label>
                            <button
                                type="button"
                                onClick={() => handleCopy(publicUrl, 'url')}
                                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
                            >
                                {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedField === 'url' ? 'Copied URL!' : 'Copy URL'}
                            </button>
                        </div>
                        <input
                            type="text"
                            readOnly
                            value={publicUrl}
                            className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl dark:text-gray-200"
                        />
                    </div>

                    {/* Option 3: REST API */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                3. REST API Endpoint (For Custom React / Mobile Apps)
                            </label>
                            <button
                                type="button"
                                onClick={() => handleCopy(apiUrl, 'api')}
                                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
                            >
                                {copiedField === 'api' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedField === 'api' ? 'Copied Endpoint!' : 'Copy Endpoint'}
                            </button>
                        </div>
                        <div className="p-3 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono space-y-2 overflow-x-auto">
                            <div><span className="text-green-400 font-bold">POST</span> {apiUrl}</div>
                            <div className="text-gray-400">// Sample Payload:</div>
                            <pre className="text-gray-300">{apiPayloadSample}</pre>
                        </div>
                    </div>
                </div>

                {/* Submissions Audit Log Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700">
                        Submissions History ({form.submissions?.length || 0})
                    </h2>

                    {form.submissions?.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-6">
                            No submissions recorded yet for this form.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-semibold">
                                    <tr>
                                        <th className="p-3">Subscriber</th>
                                        <th className="p-3">Submitted Data</th>
                                        <th className="p-3">Verification</th>
                                        <th className="p-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {form.submissions?.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="p-3 font-medium text-gray-900 dark:text-white">
                                                <div>{sub.submitted_data?.email || 'N/A'}</div>
                                                <div className="text-gray-400 text-[11px]">{sub.submitted_data?.phone_e164}</div>
                                            </td>
                                            <td className="p-3 font-mono text-[11px]">
                                                <pre className="whitespace-pre-wrap max-w-xs">{JSON.stringify(sub.submitted_data, null, 2)}</pre>
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                                                        sub.is_verified
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                    }`}
                                                >
                                                    {sub.is_verified ? 'Verified' : 'Pending OTP'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-400">
                                                {new Date(sub.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ClientLayout>
    );
}
