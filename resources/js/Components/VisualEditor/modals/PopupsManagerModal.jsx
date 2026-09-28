import React, { useState } from 'react';
import { Layers, Sparkles, Sliders, Eye, Save, MousePointer, ShieldCheck } from 'lucide-react';
import { Modal, Button, Input, Select, Toggle } from '@/Components/ui';

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
        <Modal
            show={!!isOpen}
            onClose={onClose}
            title="Interactive Popups Engine"
            description="Configure Exit-Intent, Time Delay, and Scroll Popups to recover abandoning visitors."
            maxWidth="2xl"
        >
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    {[
                        { id: 'exit_intent', label: '🚪 Exit-Intent Popup' },
                        { id: 'time_delay', label: '⏱️ Time Delay Popup' },
                        { id: 'scroll_depth', label: '📜 Scroll Depth Popup' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
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
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div>
                            <span className="font-bold text-xs text-neutral-900 dark:text-white block">
                                Enable {activeTab.replace('_', ' ').toUpperCase()} Popup
                            </span>
                            <span className="text-[11px] text-neutral-400">
                                Triggers automatically based on visitor action.
                            </span>
                        </div>
                        <Toggle
                            checked={!!current.enabled}
                            onChange={(val) => updateCurrent('enabled', val)}
                        />
                    </div>

                    <div className="space-y-3">
                        <Input
                            label="Popup Headline"
                            size="sm"
                            type="text"
                            value={current.title || ''}
                            onChange={(e) => updateCurrent('title', e.target.value)}
                        />

                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Subtitle / Description
                            </label>
                            <textarea
                                rows={2}
                                value={current.description || ''}
                                onChange={(e) => updateCurrent('description', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="CTA Button Text"
                                size="sm"
                                type="text"
                                value={current.buttonText || ''}
                                onChange={(e) => updateCurrent('buttonText', e.target.value)}
                            />

                            <Select
                                label="Frequency Cap"
                                value={current.frequencyCap || '1 time per session'}
                                onChange={(e) => updateCurrent('frequencyCap', e.target.value)}
                            >
                                <option value="1 time per session">1 time per session</option>
                                <option value="Every 24 hours">Every 24 hours</option>
                                <option value="Every 7 days">Every 7 days</option>
                                <option value="Always show">Always show</option>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                        {saved ? 'Settings saved!' : 'Configured popups apply live on publish'}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={handleSave}
                            icon={Save}
                        >
                            Save Popup Settings
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
