import React from 'react';
import { ListFilter, Plus, Trash2, Globe } from 'lucide-react';

export default function StepsTab({
    funnel,
    activeStepId,
    setActiveStepId,
    showAddStep,
    setShowAddStep,
    newStep,
    setNewStep,
    handleAddStep,
    handleDeleteStep,
    publishing,
}) {
    return (
        <div className="p-3 space-y-4 text-xs overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <div className="flex items-center gap-1.5">
                    <ListFilter className="h-4 w-4 text-brand-600" />
                    <p className="text-xs font-bold text-neutral-900">Funnel Steps ({funnel.steps?.length || 0})</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAddStep(s => !s)}
                    className="flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-brand-700 transition"
                >
                    <Plus className="h-3 w-3" /> Add Step
                </button>
            </div>

            {/* Add Step Form */}
            {showAddStep && (
                <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-3 space-y-2">
                    <label className="block font-semibold text-neutral-700">Step Name</label>
                    <input
                        type="text"
                        value={newStep.name}
                        onChange={e => setNewStep(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Opt-in Page"
                        className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <label className="block font-semibold text-neutral-700">Step Type</label>
                    <select
                        value={newStep.type}
                        onChange={e => setNewStep(p => ({ ...p, type: e.target.value }))}
                        className="w-full rounded-lg border border-neutral-300 p-2 text-xs font-medium"
                    >
                        <option value="optin">Opt-in Page</option>
                        <option value="sales">Sales Page</option>
                        <option value="upsell">Upsell Page</option>
                        <option value="downsell">Downsell Page</option>
                        <option value="thankyou">Thank You Page</option>
                        <option value="webinar">Webinar Registration</option>
                        <option value="checkout">Checkout Page</option>
                        <option value="content">Content Page</option>
                    </select>
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
                            className="rounded-lg border px-3 py-1.5 text-xs"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Steps List */}
            <div className="space-y-2">
                {(funnel.steps || []).map((step, idx) => {
                    const isActive = step.id === activeStepId;
                    const stepPage = step.pages?.find(p => p.is_control) ?? step.pages?.[0];
                    const typeColors = {
                        optin: 'bg-blue-100 text-blue-700',
                        sales: 'bg-purple-100 text-purple-700',
                        upsell: 'bg-green-100 text-green-700',
                        downsell: 'bg-orange-100 text-orange-700',
                        thankyou: 'bg-teal-100 text-teal-700',
                        webinar: 'bg-pink-100 text-pink-700',
                        checkout: 'bg-yellow-100 text-yellow-700',
                        content: 'bg-neutral-100 text-neutral-700',
                    };
                    return (
                        <div
                            key={step.id}
                            onClick={() => setActiveStepId(step.id)}
                            className={`group relative rounded-xl border p-3 cursor-pointer transition ${
                                isActive
                                    ? 'border-brand-500 bg-brand-50 shadow-sm'
                                    : 'border-neutral-200 bg-white hover:border-brand-300 hover:bg-neutral-50'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`shrink-0 flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-black ${
                                        isActive ? 'bg-brand-600 text-white' : 'bg-neutral-200 text-neutral-600'
                                    }`}>{idx + 1}</span>
                                    <div className="min-w-0">
                                        <p className={`font-bold text-[11px] truncate ${isActive ? 'text-brand-700' : 'text-neutral-800'}`}>{step.name}</p>
                                        {stepPage && (
                                            <p className="text-[10px] text-neutral-400 truncate">{stepPage.title || 'Untitled page'}</p>
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
                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                        title="Delete step"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                            {isActive && (
                                <div className="mt-2 pt-2 border-t border-brand-200 flex gap-1.5">
                                    <a
                                        href={`/f/${funnel.workspace_id}/${funnel.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:underline"
                                    >
                                        <Globe className="h-3 w-3" /> Preview
                                    </a>
                                </div>
                            )}
                        </div>
                    );
                })}
                {(!funnel.steps || funnel.steps.length === 0) && (
                    <div className="py-8 text-center text-neutral-400">
                        <ListFilter className="h-8 w-8 mx-auto mb-2 text-neutral-200" />
                        <p className="text-xs font-medium">No steps yet</p>
                        <p className="text-[10px] mt-1">Click "Add Step" to create your funnel flow</p>
                    </div>
                )}
            </div>
        </div>
    );
}
