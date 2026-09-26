import { Head, Link, router, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import {
    FormInput,
    Plus,
    FolderPlus,
    LayoutList,
    FileText,
    BarChart3,
    Layers,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FormsListTab from './components/FormsListTab';
import FormsSubmissionsTab from './components/FormsSubmissionsTab';
import FormsAnalyticsTab from './components/FormsAnalyticsTab';
import FolderModal from './components/FolderModal';

export default function FormsIndex({
    activeTab = 'forms',
    folders = [],
    activeFolder = null,
    forms = [],
    rootFormsCount = 0,
    submissions = null,
    analytics = null,
    allWorkspaceForms = [],
    filters = {},
}) {
    const { t } = useTranslation();
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

    const handleTabSwitch = (tabKey) => {
        router.get(
            route('client.forms.index'),
            { tab: tabKey },
            { preserveState: false, preserveScroll: true }
        );
    };

    const tabs = [
        {
            id: 'forms',
            label: 'Forms Builder',
            icon: LayoutList,
            count: forms?.length ?? 0,
        },
        {
            id: 'submissions',
            label: 'Submissions',
            icon: FileText,
            count: submissions?.total ?? null,
        },
        {
            id: 'analytics',
            label: 'Analytics & UTM',
            icon: BarChart3,
            count: null,
        },
    ];

    return (
        <ClientLayout title="Subscription & Lead Forms">
            <Head title="Subscription & Lead Forms" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                            <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-soft-lg">
                                <FormInput className="w-6 h-6" />
                            </div>
                            Subscription & Lead Forms
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Build high-converting multi-step forms with folders, OTP verification, submissions hub & real-time analytics.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        {activeTab === 'forms' && (
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => setIsFolderModalOpen(true)}
                                className="gap-2"
                            >
                                <FolderPlus className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                New Folder
                            </Button>
                        )}
                        <Link
                            href={route('client.forms.create', activeFolder?.id ? { folder_id: activeFolder.id } : {})}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-medium text-sm rounded-soft shadow-soft transition"
                        >
                            <Plus className="w-4 h-4" />
                            Create Form
                        </Link>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-soft text-sm font-medium flex items-center justify-between">
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 bg-coral-50 dark:bg-coral-950/30 border border-coral-200 dark:border-coral-800 text-coral-800 dark:text-coral-200 rounded-soft text-sm font-medium flex items-center justify-between">
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="border-b border-neutral-200 dark:border-neutral-800">
                    <nav className="flex space-x-2 sm:space-x-4" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabSwitch(tab.id)}
                                    className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-sm transition-all relative ${
                                        isActive
                                            ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400 font-semibold'
                                            : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-400'}`} />
                                    {tab.label}
                                    {tab.count !== null && tab.count > 0 && (
                                        <span
                                            className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-medium ${
                                                isActive
                                                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                                                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Views */}
                {activeTab === 'forms' && (
                    <FormsListTab
                        forms={forms}
                        folders={folders}
                        activeFolder={activeFolder}
                        filters={filters}
                    />
                )}

                {activeTab === 'submissions' && (
                    <FormsSubmissionsTab
                        submissions={submissions}
                        allWorkspaceForms={allWorkspaceForms}
                        filters={filters}
                    />
                )}

                {activeTab === 'analytics' && (
                    <FormsAnalyticsTab
                        analytics={analytics}
                    />
                )}
            </div>

            {/* Create Folder Modal */}
            <FolderModal
                isOpen={isFolderModalOpen}
                folder={null}
                onClose={() => setIsFolderModalOpen(false)}
            />
        </ClientLayout>
    );
}
