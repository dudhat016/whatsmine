import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import KanbanBoard from './Kanban/KanbanBoard';
import OpportunityModal from './Builder/OpportunityModal';
import PipelineSettingsModal from './Builder/PipelineSettingsModal';
import { Plus, Settings, Search, GitBranch, Trophy, XCircle, Archive, LayoutGrid, Loader2 } from 'lucide-react';
import axios from 'axios';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import Skeleton from '@/Components/ui/Skeleton';

const STATUS_TABS = [
    {
        key: 'open',
        label: 'Open',
        icon: <span className="w-2 h-2 rounded-full bg-emerald-500" />,
        badgeClass: (active) => active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
    },
    {
        key: 'won',
        label: 'Won',
        icon: <Trophy className="h-3.5 w-3.5 text-amber-500" />,
        badgeClass: (active) => active ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
    },
    {
        key: 'lost',
        label: 'Lost',
        icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
        badgeClass: (active) => active ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
    },
    {
        key: 'abandoned',
        label: 'Abandoned',
        icon: <Archive className="h-3.5 w-3.5 text-slate-500" />,
        badgeClass: (active) => active ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
    },
    {
        key: 'all',
        label: 'All Deals',
        icon: <LayoutGrid className="h-3.5 w-3.5 text-neutral-500" />,
        badgeClass: (active) => active ? 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
    },
];

export default function OpportunitiesIndex({ pipelines, activePipelineId, contacts, users }) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [selectedPipelineId, setSelectedPipelineId] = useState(activePipelineId);
    const [boardColumns, setBoardColumns] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [agentFilter, setAgentFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('open');
    const [statusCounts, setStatusCounts] = useState({
        open: 0,
        won: 0,
        lost: 0,
        abandoned: 0,
        all: 0,
    });

    // Modals
    const [isOppModalOpen, setIsOppModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [targetStageId, setTargetStageId] = useState(null);

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Debounce search input to avoid re-triggering rapid requests on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchBoardData = async (isBackground = false) => {
        if (!isBackground && boardColumns.length === 0) {
            setInitialLoading(true);
        } else {
            setIsRefreshing(true);
        }

        try {
            const res = await axios.get(route('client.opportunities.board-data'), {
                params: {
                    pipeline_id: selectedPipelineId,
                    search: debouncedSearch,
                    agent_id: agentFilter,
                    status: statusFilter,
                },
            });
            setBoardColumns(res.data.boardColumns || []);
            if (res.data.statusCounts) {
                setStatusCounts(res.data.statusCounts);
            }
        } catch (err) {
            console.error('Failed to load board data:', err);
        } finally {
            setInitialLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const isBg = boardColumns.length > 0;
        fetchBoardData(isBg);
    }, [selectedPipelineId, debouncedSearch, agentFilter, statusFilter]);

    const activePipeline = pipelines.find((p) => p.id === selectedPipelineId) || pipelines[0];
    const totalDeals = boardColumns.reduce((sum, col) => sum + (col.deals_count || 0), 0);
    const totalValue = boardColumns.reduce((sum, col) => sum + (col.total_value || 0), 0);

    const handleAddOpportunity = (stageId = null) => {
        setEditingDeal(null);
        setTargetStageId(stageId);
        setIsOppModalOpen(true);
    };

    const handleEditOpportunity = (deal) => {
        setEditingDeal(deal);
        setIsOppModalOpen(true);
    };

    const agentOptions = [
        { value: 'all', label: 'All Sales Agents' },
        ...users.map((u) => ({ value: u.id, label: u.name })),
    ];

    return (
        <ClientLayout title="Opportunities & Pipelines">
            <Head title="Opportunities & Pipelines" />

            <div className="space-y-5">
                {/* Standard Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Opportunities & Pipelines
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Manage sales pipelines, track revenue opportunities, and move deals across dynamic stages
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSettingsModalOpen(true)}
                            className="flex items-center gap-1.5"
                        >
                            <Settings className="h-4 w-4" />
                            <span>Manage Pipelines</span>
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddOpportunity()}
                            className="flex items-center gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Opportunity</span>
                        </Button>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && <div className="rounded-soft bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 text-sm">{flash.success}</div>}
                {flash.error   && <div className="rounded-soft bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 text-sm">{flash.error}</div>}

                {/* Top Control Bar & Pipeline Selector */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-soft border-neutral-200 dark:border-neutral-800 p-4 rounded-soft-lg shadow-soft">
                    {/* Pipeline Selector & Summary Metrics */}
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-soft bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                            <GitBranch className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={selectedPipelineId}
                                    onChange={(e) => setSelectedPipelineId(parseInt(e.target.value, 10))}
                                    size="sm"
                                    className="font-semibold text-sm w-48"
                                >
                                    {pipelines.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                <span>{totalDeals} Opportunities</span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    Total Value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {isRefreshing && (
                                    <>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-medium animate-pulse">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span>Syncing...</span>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filter Inputs */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search Input */}
                        <div className="w-56">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search deal or contact..."
                            />
                        </div>

                        {/* Agent Filter */}
                        <div className="w-48">
                            <Select
                                value={agentFilter}
                                onChange={(e) => setAgentFilter(e.target.value)}
                                options={agentOptions}
                                placeholder={null}
                            />
                        </div>
                    </div>
                </div>

                {/* Opportunity Status Switcher Tabs (Open, Won, Lost, Abandoned, All) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-2 rounded-soft-lg border border-soft border-neutral-200 dark:border-neutral-800 shadow-soft">
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                        {STATUS_TABS.map((tab) => {
                            const isActive = statusFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm border border-neutral-200/80 dark:border-neutral-700'
                                            : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${tab.badgeClass(isActive)}`}>
                                        {statusCounts[tab.key] ?? 0}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {statusFilter !== 'open' && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 px-2 font-medium">
                            Viewing <span className="font-semibold text-neutral-800 dark:text-neutral-200 capitalize">{statusFilter}</span> opportunities
                        </div>
                    )}
                </div>

                {/* Kanban Board Canvas */}
                {initialLoading && boardColumns.length === 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-230px)] custom-scrollbar">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col flex-shrink-0 w-80 rounded-2xl bg-neutral-100/60 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800/60 p-3 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-800">
                                    <Skeleton className="h-4 w-28 rounded-md" />
                                    <Skeleton className="h-5 w-8 rounded-full" />
                                </div>
                                <Skeleton className="h-7 w-full rounded-lg" />
                                <div className="space-y-2.5">
                                    <Skeleton className="h-28 w-full rounded-xl" />
                                    <Skeleton className="h-28 w-full rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={`transition-opacity duration-150 ${isRefreshing ? 'opacity-85' : 'opacity-100'}`}>
                        <KanbanBoard
                            columns={boardColumns}
                            setColumns={setBoardColumns}
                            onEditDeal={handleEditOpportunity}
                            onAddDeal={handleAddOpportunity}
                            activePipelineId={selectedPipelineId}
                            statusFilter={statusFilter}
                            onDealStatusUpdated={() => fetchBoardData(true)}
                            pipelines={pipelines}
                            users={users}
                        />
                    </div>
                )}
            </div>

            {/* Opportunity Modal / Drawer */}
            <OpportunityModal
                isOpen={isOppModalOpen}
                onClose={() => setIsOppModalOpen(false)}
                onSuccess={() => {
                    setIsOppModalOpen(false);
                    fetchBoardData(true);
                }}
                deal={editingDeal}
                pipelineId={selectedPipelineId}
                stageId={targetStageId}
                stages={activePipeline?.stages || []}
                contacts={contacts}
                users={users}
            />

            {/* Pipeline Settings Modal */}
            <PipelineSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onSuccess={() => {
                    setIsSettingsModalOpen(false);
                    fetchBoardData(true);
                }}
                pipelines={pipelines}
                activePipeline={activePipeline}
            />
        </ClientLayout>
    );
}
