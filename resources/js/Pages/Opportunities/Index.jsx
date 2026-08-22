import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import KanbanBoard from './Kanban/KanbanBoard';
import OpportunityModal from './Builder/OpportunityModal';
import PipelineSettingsModal from './Builder/PipelineSettingsModal';
import { Plus, Settings, Search, GitBranch } from 'lucide-react';
import axios from 'axios';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';

export default function OpportunitiesIndex({ pipelines, activePipelineId, contacts, users }) {
    const { props } = usePage();
    const flash = props.flash ?? {};

    const [selectedPipelineId, setSelectedPipelineId] = useState(activePipelineId);
    const [boardColumns, setBoardColumns] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [agentFilter, setAgentFilter] = useState('all');

    // Modals
    const [isOppModalOpen, setIsOppModalOpen] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [targetStageId, setTargetStageId] = useState(null);

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const fetchBoardData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(route('client.opportunities.board-data'), {
                params: {
                    pipeline_id: selectedPipelineId,
                    search: search,
                    agent_id: agentFilter,
                },
            });
            setBoardColumns(res.data.boardColumns || []);
        } catch (err) {
            console.error('Failed to load board data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoardData();
    }, [selectedPipelineId, search, agentFilter]);

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
                                <select
                                    value={selectedPipelineId}
                                    onChange={(e) => setSelectedPipelineId(parseInt(e.target.value, 10))}
                                    className="font-semibold text-base text-neutral-900 dark:text-neutral-100 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"
                                >
                                    {pipelines.map((p) => (
                                        <option key={p.id} value={p.id} className="dark:bg-neutral-900">
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                <span>{totalDeals} Opportunities</span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    Total Value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
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

                {/* Kanban Board Canvas */}
                {loading ? (
                    <div className="h-96 rounded-soft-lg border border-soft border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-500">
                        Loading board opportunities...
                    </div>
                ) : (
                    <KanbanBoard
                        columns={boardColumns}
                        setColumns={setBoardColumns}
                        onEditDeal={handleEditOpportunity}
                        onAddDeal={handleAddOpportunity}
                        activePipelineId={selectedPipelineId}
                    />
                )}
            </div>

            {/* Opportunity Modal / Drawer */}
            <OpportunityModal
                isOpen={isOppModalOpen}
                onClose={() => {
                    setIsOppModalOpen(false);
                    fetchBoardData();
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
                onClose={() => {
                    setIsSettingsModalOpen(false);
                    fetchBoardData();
                }}
                pipelines={pipelines}
                activePipeline={activePipeline}
            />
        </ClientLayout>
    );
}
