import React from 'react';
import { Bookmark } from 'lucide-react';

export default function SaveBlockModal({
    saveBlockModal,
    setSaveBlockModal,
    savedBlockName,
    setSavedBlockName,
    handleConfirmSaveBlock,
}) {
    if (!saveBlockModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-neutral-100 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center gap-3 text-brand-600 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center">
                        <Bookmark className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-neutral-900">Save Custom Block Template</h3>
                        <p className="text-xs text-neutral-500">Save this element to reuse across your funnels</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                            Block Name
                        </label>
                        <input
                            type="text"
                            value={savedBlockName}
                            onChange={(e) => setSavedBlockName(e.target.value)}
                            placeholder="e.g. Hero Section, Pricing Grid..."
                            className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-brand-500"
                            autoFocus
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setSaveBlockModal(null)}
                            className="px-3.5 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmSaveBlock}
                            disabled={!savedBlockName.trim()}
                            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                        >
                            Save Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
