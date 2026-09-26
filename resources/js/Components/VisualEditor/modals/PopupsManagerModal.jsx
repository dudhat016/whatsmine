import React, { useState } from 'react';
import { X, Layers, Sparkles, Sliders, Eye, Save, MousePointer, ShieldCheck } from 'lucide-react';

export default function PopupsManagerModal({ isOpen, onClose, funnel, onSavePopups }) {
    const [activeTab, setActiveTab] = useState('exit_intent');
    const [saved, setSaved] = useState(false);

    const [popups, setPopups] = useState({
        exit_intent: {
            enabled: true,
            title: 'Wait! Don\'t Leave Empty Handed! 🎁',
            description: 'Get an extra 15% OFF your subscription today. Enter your WhatsApp number below.',
            buttonText: 'Claim My 15% Discount',
            trigger: 'Exit Intent (Mouse Leaves Window)',
            frequencyCap: '1 time per session',
        },
        time_delay: {
            enabled: false,
            title: 'Quick Question For You!',
            description: 'Are you looking to automate your sales or customer support?',
            buttonText: 'Get Started Now',
            delaySeconds: 15,
            frequencyCap: 'Every 24 hours',
        },
        scroll_depth: {
            enabled: false,
            title: 'Ready To Take The Next Step?',
            description: 'Talk with our expert team on WhatsApp for a custom quote.',
            buttonText: 'Chat On WhatsApp',
            scrollPercentage: 60,
            frequencyCap: 'Every 7 days',
        },
    });

    if (!isOpen) return null;

    const current = popups[activeTab] || {};

    const updateCurrent = (key, val) => {
        setPopups(prev => ({
            ...prev,
            [activeTab]: { ...prev[activeTab], [key]: val },
        }));
    };

    const handleSave = () => {
        if (onSavePopups) onSavePopups(popups);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                                Interactive Popups Engine
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Configure Exit-Intent, Time Delay, and Scroll Popups to recover abandoning visitors.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2 bg-white dark:bg-neutral-900">
                    {[
                        { id: 'exit_intent', label: '🚪 Exit-Intent Popup' },
                        { id: 'time_delay', label: '⏱️ Time Delay Popup' },
                        { id: 'scroll_depth', label: '📜 Scroll Depth Popup' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                activeTab === tab.id
                                    ? 'bg-brand-600 text-white shadow-xs'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div>
                            <span className="font-bold text-xs text-neutral-900 dark:text-white block">
                                Enable {activeTab.replace('_', ' ').toUpperCase()} Popup
                            </span>
                            <span className="text-[11px] text-neutral-400">
                                Triggers automatically based on visitor action.
                            </span>
                        </div>
                        <input
                            type="checkbox"
                            checked={!!current.enabled}
                            onChange={(e) => updateCurrent('enabled', e.target.checked)}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Popup Headline
                            </label>
                            <input
                                type="text"
                                value={current.title || ''}
                                onChange={(e) => updateCurrent('title', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Subtitle / Description
                            </label>
                            <textarea
                                rows={2}
                                value={current.description || ''}
                                onChange={(e) => updateCurrent('description', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    CTA Button Text
                                </label>
                                <input
                                    type="text"
                                    value={current.buttonText || ''}
                                    onChange={(e) => updateCurrent('buttonText', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Frequency Cap
                                </label>
                                <select
                                    value={current.frequencyCap || '1 time per session'}
                                    onChange={(e) => updateCurrent('frequencyCap', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl dark:bg-neutral-800 dark:text-white"
                                >
                                    <option value="1 time per session">1 time per session</option>
                                    <option value="Every 24 hours">Every 24 hours</option>
                                    <option value="Every 7 days">Every 7 days</option>
                                    <option value="Always show">Always show</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                        {saved ? 'Settings saved!' : 'Configured popups apply live on publish'}
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save Popup Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
