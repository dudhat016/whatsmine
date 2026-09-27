import React, { useState } from 'react';
import axios from 'axios';
import { 
    ListFilter, Plus, Trash2, Globe, GitBranch, Split, 
    Sparkles, TrendingUp, Eye, CheckCircle2, DollarSign, 
    Award, Layers, Check, ArrowRight, XCircle
} from 'lucide-react';
import { Input, Select } from '@/Components/ui';

export default function StepsTab({
    funnel,
    activeStepId,
    setActiveStepId,
    activeVariant = 'A',
    onSelectVariant,
    showAddStep,
    setShowAddStep,
    newStep,
    setNewStep,
    handleAddStep,
    handleDeleteStep,
    publishing,
    onVariantChanged,
}) {
    const [viewMode, setViewMode] = useState('flow'); // 'flow' | 'analytics'
    const [loadingAction, setLoadingAction] = useState(null);

    const handleCreateVariantB = async (stepId) => {
        setLoadingAction(`create_${stepId}`);
        try {
            const res = await axios.post(`/funnels/${funnel.id}/steps/${stepId}/variant`);
            if (res.data.ok) {
                if (onVariantChanged) {
                    onVariantChanged(stepId, 'B', res.data.variant_b);
                } else {
                    window.location.reload();
                }
            }
        } catch (err) {
            console.error('Failed to create variant B', err);
            alert(err.response?.data?.message || 'Could not create Variant B.');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleUpdateSplit = async (stepId, splitA) => {
        try {
            await axios.post(`/funnels/${funnel.id}/steps/${stepId}/split`, {
                traffic_split_a: splitA,
            });
            if (onVariantChanged) onVariantChanged(stepId);
        } catch (err) {
            console.error('Failed to update traffic split', err);
        }
    };

    const handleDeclareWinner = async (stepId, winnerVariant) => {
        if (!confirm(`Are you sure you want to declare Variant ${winnerVariant} as the winner? This will apply its content and end the A/B test.`)) return;
        setLoadingAction(`winner_${stepId}`);
        try {
            const res = await axios.post(`/funnels/${funnel.id}/steps/${stepId}/declare-winner`, {
                winning_variant: winnerVariant,
            });
            if (res.data.ok) {
                if (onVariantChanged) {
                    onVariantChanged(stepId, 'A');
                } else {
                    window.location.reload();
                }
            }
        } catch (err) {
            console.error('Failed to declare winner', err);
            alert(err.response?.data?.message || 'Error declaring winner.');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleDeleteVariantB = async (stepId) => {
        if (!confirm('Are you sure you want to delete Variant B?')) return;
        setLoadingAction(`delete_${stepId}`);
        try {
            const res = await axios.delete(`/funnels/${funnel.id}/steps/${stepId}/variant`);
            if (res.data.ok) {
                if (onVariantChanged) {
                    onVariantChanged(stepId, 'A');
                } else {
                    window.location.reload();
                }
            }
        } catch (err) {
            console.error('Failed to delete variant B', err);
            alert(err.response?.data?.message || 'Error deleting variant B.');
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="p-3 space-y-4 text-xs overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5">
                    <ListFilter className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Funnel Steps ({funnel.steps?.length || 0})</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 p-0.5 bg-neutral-100 dark:bg-neutral-800">
                        <button
                            type="button"
                            onClick={() => setViewMode('flow')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                viewMode === 'flow' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                        >
                            Flow
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('analytics')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                viewMode === 'analytics' ? 'bg-brand-600 text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                        >
                            📊 Stats
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAddStep(s => !s)}
                        className="flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-brand-700 transition"
                    >
                        <Plus className="h-3 w-3" /> Add Step
                    </button>
                </div>
            </div>

            {/* Add Step Form */}
            {showAddStep && (
                <div className="rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-950/30 p-3 space-y-2">
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Step Name</label>
                    <Input
                        size="sm"
                        type="text"
                        value={newStep.name}
                        onChange={e => setNewStep(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Opt-in Page"
                        wrapperClassName="w-full"
                    />
                    <Select
                        label="Step Type"
                        size="sm"
                        value={newStep.type}
                        onChange={e => setNewStep(p => ({ ...p, type: e.target.value }))}
                    >
                        <option value="optin">Opt-in Page</option>
                        <option value="sales">Sales Page</option>
                        <option value="checkout">2-Step Checkout Page</option>
                        <option value="upsell">1-Click Upsell Page</option>
                        <option value="downsell">Downsell Page</option>
                        <option value="thankyou">Thank You Page</option>
                        <option value="webinar">Webinar Registration</option>
                        <option value="content">Content Page</option>
                    </Select>
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleAddStep}
                            disabled={publishing}
                            className="flex-1 rounded-lg bg-brand-600 py-1.5 text-xs text-white font-bold hover:bg-brand-700"
                        >
                            {publishing ? 'Adding…' : 'Add Step'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowAddStep(false); setNewStep({ name: '', type: 'optin' }); }}
                            className="rounded-lg border px-3 py-1.5 text-xs dark:border-neutral-700 dark:text-neutral-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Steps List */}
            <div className="space-y-3">
                {(funnel.steps || []).map((step, idx) => {
                    const isActive = step.id === activeStepId;
                    const pageA = step.pages?.find(p => p.variant === 'A' || p.is_control) ?? step.pages?.[0];
                    const pageB = step.pages?.find(p => p.variant === 'B');
                    const hasSplitTest = !!pageB;
                    const splitRatioA = pageA?.traffic_split ?? (hasSplitTest ? 50 : 100);
                    const splitRatioB = pageB?.traffic_split ?? (100 - splitRatioA);
                    
                    const views = step.views_count ?? (idx === 0 ? (funnel.views_count || 120) : Math.max(0, Math.round((funnel.views_count || 120) * Math.pow(0.5, idx))));
                    const convs = step.conversions_count ?? (idx === 0 ? (funnel.conversions_count || 45) : Math.max(0, Math.round((funnel.conversions_count || 45) * Math.pow(0.4, idx))));
                    const convRate = views > 0 ? ((convs / views) * 100).toFixed(1) : '0.0';
                    const prevStep = idx > 0 ? funnel.steps[idx - 1] : null;
                    const prevViews = prevStep ? (prevStep.views_count ?? Math.round((funnel.views_count || 120) * Math.pow(0.5, idx - 1))) : views;
                    const dropoff = prevViews > 0 && idx > 0 ? Math.max(0, Math.round(((prevViews - views) / prevViews) * 100)) : 0;

                    const typeColors = {
                        optin: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
                        sales: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
                        upsell: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                        downsell: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                        thankyou: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
                        webinar: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
                        checkout: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
                        content: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
                    };

                    return (
                        <div
                            key={step.id}
                            onClick={() => setActiveStepId(step.id)}
                            className={`group relative rounded-xl border p-3 cursor-pointer transition ${
                                isActive
                                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/20 shadow-xs'
                                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-brand-300 dark:hover:border-neutral-700'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`shrink-0 flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-black ${
                                        isActive ? 'bg-brand-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                    }`}>{idx + 1}</span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className={`font-bold text-[11px] truncate ${isActive ? 'text-brand-700 dark:text-brand-400' : 'text-neutral-800 dark:text-neutral-200'}`}>{step.name}</p>
                                            {hasSplitTest && (
                                                <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[9px] font-black tracking-wide">
                                                    A/B TEST
                                                </span>
                                            )}
                                        </div>
                                        {pageA && (
                                            <p className="text-[10px] text-neutral-400 truncate">{pageA.meta_title || step.type + ' page'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${typeColors[step.type] || typeColors.content}`}>
                                        {step.type || 'page'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); handleDeleteStep(step.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                                        title="Delete step"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Analytics Overlay Bar */}
                            {viewMode === 'analytics' && (
                                <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-3 gap-1.5 text-center">
                                    <div className="bg-neutral-50 dark:bg-neutral-800/60 p-1.5 rounded-lg">
                                        <div className="text-[9px] text-neutral-400 font-semibold flex items-center justify-center gap-0.5">
                                            <Eye className="h-2.5 w-2.5" /> Views
                                        </div>
                                        <div className="text-[11px] font-black text-neutral-800 dark:text-neutral-200">{views}</div>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-800/60 p-1.5 rounded-lg">
                                        <div className="text-[9px] text-neutral-400 font-semibold flex items-center justify-center gap-0.5">
                                            <TrendingUp className="h-2.5 w-2.5 text-emerald-500" /> Conv.
                                        </div>
                                        <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{convRate}%</div>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-800/60 p-1.5 rounded-lg">
                                        <div className="text-[9px] text-neutral-400 font-semibold flex items-center justify-center gap-0.5">
                                            {idx === 0 ? 'Entry' : 'Drop-off'}
                                        </div>
                                        <div className={`text-[11px] font-black ${idx === 0 ? 'text-blue-600' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {idx === 0 ? '100%' : `-${dropoff}%`}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* A/B Split Test Controls & Active Variant Selector */}
                            {isActive && (
                                <div className="mt-3 pt-2 border-t border-brand-200 dark:border-neutral-800 space-y-2.5" onClick={e => e.stopPropagation()}>
                                    {hasSplitTest ? (
                                        <div className="p-2.5 bg-purple-50/80 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-purple-900 dark:text-purple-300 flex items-center gap-1">
                                                    <GitBranch className="h-3 w-3 text-purple-600" /> Split Test Active
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteVariantB(step.id)}
                                                    className="text-[9px] text-red-500 hover:underline flex items-center gap-0.5 font-medium"
                                                >
                                                    <XCircle className="h-2.5 w-2.5" /> End Test
                                                </button>
                                            </div>

                                            {/* Dual Variant Selector Tabs */}
                                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-neutral-900 rounded-lg border border-purple-200 dark:border-purple-800/50">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectVariant && onSelectVariant('A')}
                                                    className={`py-1.5 px-2 rounded-md text-[10px] font-bold text-center transition flex flex-col items-center ${
                                                        activeVariant === 'A'
                                                            ? 'bg-purple-600 text-white shadow-xs'
                                                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                    }`}
                                                >
                                                    <span>Variant A (Control)</span>
                                                    <span className="text-[9px] opacity-80 font-normal">{activeVariant === 'A' ? 'Editing Active' : 'Switch'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectVariant && onSelectVariant('B')}
                                                    className={`py-1.5 px-2 rounded-md text-[10px] font-bold text-center transition flex flex-col items-center ${
                                                        activeVariant === 'B'
                                                            ? 'bg-purple-600 text-white shadow-xs'
                                                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                    }`}
                                                >
                                                    <span>Variant B (Challenger)</span>
                                                    <span className="text-[9px] opacity-80 font-normal">{activeVariant === 'B' ? 'Editing Active' : 'Switch'}</span>
                                                </button>
                                            </div>

                                            {/* Split Slider */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-purple-900 dark:text-purple-300">
                                                    <span>A: {splitRatioA}%</span>
                                                    <span>B: {splitRatioB}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="90"
                                                    step="5"
                                                    defaultValue={splitRatioA}
                                                    onChange={(e) => handleUpdateSplit(step.id, parseInt(e.target.value))}
                                                    className="w-full h-1.5 bg-purple-200 dark:bg-purple-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                />
                                            </div>

                                            {/* Declare Winner Actions */}
                                            <div className="pt-1 flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeclareWinner(step.id, 'A')}
                                                    className="flex-1 py-1 rounded bg-white dark:bg-neutral-800 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold text-[9px] hover:bg-purple-100 flex items-center justify-center gap-1"
                                                >
                                                    <Award className="h-2.5 w-2.5 text-amber-500" /> Declare A Winner
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeclareWinner(step.id, 'B')}
                                                    className="flex-1 py-1 rounded bg-white dark:bg-neutral-800 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold text-[9px] hover:bg-purple-100 flex items-center justify-center gap-1"
                                                >
                                                    <Award className="h-2.5 w-2.5 text-amber-500" /> Declare B Winner
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <button
                                                type="button"
                                                disabled={loadingAction === `create_${step.id}`}
                                                onClick={() => handleCreateVariantB(step.id)}
                                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition"
                                            >
                                                <GitBranch className="h-3 w-3 text-purple-600" />
                                                {loadingAction === `create_${step.id}` ? 'Creating Variant…' : 'Create A/B Split Test'}
                                            </button>
                                            <a
                                                href={`/f/${funnel.workspace_id}/${funnel.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                                            >
                                                <Globe className="h-3 w-3" /> Live
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {(!funnel.steps || funnel.steps.length === 0) && (
                    <div className="py-8 text-center text-neutral-400">
                        <ListFilter className="h-8 w-8 mx-auto mb-2 text-neutral-200 dark:text-neutral-700" />
                        <p className="text-xs font-medium">No steps yet</p>
                        <p className="text-[10px] mt-1">Click "Add Step" to create your funnel flow</p>
                    </div>
                )}
            </div>
        </div>
    );
}
