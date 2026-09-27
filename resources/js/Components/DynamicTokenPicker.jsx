import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Sparkles,
    Search,
    ChevronRight,
    User,
    UserCheck,
    Building2,
    Clock,
    Tag,
    Calendar,
    ChevronDown,
    Link2,
    ShieldAlert,
    GitBranch,
    MessageCircle,
} from 'lucide-react';
import { Input } from '@/Components/ui';

const STANDARD_SCOPES = [
    {
        id: 'contact',
        name: 'Contact',
        icon: User,
        tokens: [
            { label: 'First Name', tag: '{{contact.first_name}}' },
            { label: 'Last Name', tag: '{{contact.last_name}}' },
            { label: 'Full Name', tag: '{{contact.name}}' },
            { label: 'Email Address', tag: '{{contact.email}}' },
            { label: 'Phone Number', tag: '{{contact.phone_e164}}' },
            { label: 'WhatsApp Number', tag: '{{contact.whatsapp}}' },
            { label: 'Country', tag: '{{contact.country}}' },
            { label: 'Timezone', tag: '{{contact.timezone}}' },
        ],
    },
    {
        id: 'user',
        name: 'User (Assigned Staff)',
        icon: UserCheck,
        tokens: [
            { label: 'Agent Name', tag: '{{user.name}}' },
            { label: 'Agent First Name', tag: '{{user.first_name}}' },
            { label: 'Agent Email', tag: '{{user.email}}' },
            { label: 'Agent Phone', tag: '{{user.phone}}' },
        ],
    },
    {
        id: 'account',
        name: 'Account (Business)',
        icon: Building2,
        tokens: [
            { label: 'Business Name', tag: '{{account.name}}' },
            { label: 'Currency', tag: '{{account.currency_code}}' },
            { label: 'Default Locale', tag: '{{account.default_locale}}' },
        ],
    },
    {
        id: 'opportunity',
        name: 'Opportunity (Deal)',
        icon: GitBranch,
        tokens: [
            { label: 'Opportunity Name', tag: '{{opportunity.name}}' },
            { label: 'Monetary Value', tag: '{{opportunity.monetary_value}}' },
            { label: 'Pipeline Stage', tag: '{{opportunity.stage_name}}' },
            { label: 'Status (Open/Won/Lost)', tag: '{{opportunity.status}}' },
            { label: 'Pipeline Name', tag: '{{opportunity.pipeline_name}}' },
        ],
    },
    {
        id: 'appointment',
        name: 'Appointment',
        icon: Calendar,
        tokens: [
            { label: 'Meeting Title', tag: '{{appointment.title}}' },
            { label: 'Calendar Name', tag: '{{appointment.calendar_name}}' },
            { label: 'Appointment Date', tag: '{{appointment.date}}' },
            { label: 'Start Time', tag: '{{appointment.start_time}}' },
            { label: 'End Time', tag: '{{appointment.end_time}}' },
            { label: 'Timezone', tag: '{{appointment.timezone}}' },
            { label: 'Location / Address', tag: '{{appointment.location}}' },
            { label: 'Meeting Join URL', tag: '{{appointment.meeting_join_url}}' },
            { label: 'Add to Google Calendar', tag: '{{appointment.add_to_google_calendar}}' },
            { label: 'Add to Outlook', tag: '{{appointment.add_to_outlook}}' },
            { label: 'Add to Apple / iCal (.ics)', tag: '{{appointment.add_to_ical}}' },
            { label: 'Calendar Action Links (All 4)', tag: '{{appointment.calendar_links}}' },
            { label: 'Reschedule Link', tag: '{{appointment.reschedule_link}}' },
            { label: 'Cancellation Link', tag: '{{appointment.cancel_link}}' },
            { label: 'Host Staff Name', tag: '{{appointment.staff_name}}' },
            { label: 'Appointment Status', tag: '{{appointment.status}}' },
            { label: 'Appointment Notes', tag: '{{appointment.notes}}' },
        ],
    },
    {
        id: 'message',
        name: 'Trigger & Context',
        icon: MessageCircle,
        tokens: [
            { label: 'Inbound Message Text', tag: '{{message.body}}' },
            { label: 'Trigger Name', tag: '{{trigger.name}}' },
            { label: 'Workflow Context Key', tag: '{{context.key}}' },
        ],
    },
    {
        id: 'right_now',
        name: 'Right Now (Date/Time)',
        icon: Clock,
        tokens: [
            { label: 'Current Day (e.g. Friday)', tag: '{{right_now.day}}' },
            { label: 'Current Date (YYYY-MM-DD)', tag: '{{right_now.date}}' },
            { label: 'Current Month', tag: '{{right_now.month}}' },
            { label: 'Current Year', tag: '{{right_now.year}}' },
            { label: 'Current Time (g:i A)', tag: '{{right_now.time}}' },
        ],
    },
];

export default function DynamicTokenPicker({
    onSelect,
    onOpenChange,
    customValues = [],
    customFields = [],
    triggerLinks = [],
    triggerType = null,
    buttonText = 'Custom Values',
    buttonClassName = '',
    size = 'sm',
    align = 'auto', // 'auto' | 'left' | 'right'
    trigger = null,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [fallbackDefault, setFallbackDefault] = useState('');

    const initialScope = useMemo(() => {
        if (!triggerType) return 'contact';
        const t = triggerType.toLowerCase();
        if (t.includes('appointment')) return 'appointment';
        if (t.includes('opportunity')) return 'opportunity';
        if (t.includes('message') || t.includes('replied')) return 'message';
        return 'contact';
    }, [triggerType]);

    const [activeScopeId, setActiveScopeId] = useState(initialScope);
    const [remoteValues, setRemoteValues] = useState([]);
    const [remoteTriggerLinks, setRemoteTriggerLinks] = useState([]);
    const [alignRight, setAlignRight] = useState(align === 'right');
    const [openUpwards, setOpenUpwards] = useState(false);
    const containerRef = useRef(null);

    // Notify parent component of open/close state so parent can elevate z-index
    useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    // Direction (upwards/downwards) and alignment
    useEffect(() => {
        if (!isOpen || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;

        // Open upwards if space below is limited and space above is greater
        if (spaceBelow < 380 && rect.top > spaceBelow) {
            setOpenUpwards(true);
        } else {
            setOpenUpwards(false);
        }

        if (align === 'right') {
            setAlignRight(true);
        } else if (align === 'left') {
            setAlignRight(false);
        } else {
            setAlignRight(window.innerWidth - rect.left < 400);
        }
    }, [isOpen, align]);

    // Fetch custom values and trigger links if not provided directly
    useEffect(() => {
        if (customValues && customValues.length > 0) {
            setRemoteValues(customValues);
        } else if (isOpen) {
            fetch('/app/custom-values/list')
                .then(res => res.ok ? res.json() : [])
                .then(data => setRemoteValues(data))
                .catch(() => {});
        }

        if (triggerLinks && triggerLinks.length > 0) {
            setRemoteTriggerLinks(triggerLinks);
        } else if (isOpen) {
            fetch('/app/trigger-links/list')
                .then(res => res.ok ? res.json() : [])
                .then(data => setRemoteTriggerLinks(data))
                .catch(() => {});
        }
    }, [isOpen, customValues, triggerLinks]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Build all available token groups
    const allScopes = useMemo(() => {
        const scopes = [...STANDARD_SCOPES];

        // Add custom fields into Contact scope if available
        if (customFields && customFields.length > 0) {
            const contactScope = scopes.find(s => s.id === 'contact');
            if (contactScope) {
                const cfTokens = customFields.map(cf => ({
                    label: cf.name,
                    tag: `{{contact.custom.${cf.key}}}`,
                    sub: 'Custom Field',
                }));
                contactScope.tokens = [...contactScope.tokens, ...cfTokens];
            }
        }

        // Add Custom Values scope
        const valuesTokens = (remoteValues || []).map(cv => ({
            label: cv.name,
            tag: `{{custom_values.${cv.key}}}`,
            sub: cv.value ? `Value: ${cv.value}` : 'Global Constant',
        }));

        scopes.push({
            id: 'custom_values',
            name: 'Custom Values',
            icon: Tag,
            tokens: valuesTokens,
        });

        // Add Trigger Links scope
        const linkTokens = (remoteTriggerLinks || []).map(tl => ({
            label: tl.name,
            tag: `{{trigger_links.${tl.slug}}}`,
            sub: `Tracked Link (${tl.clicks_count ?? 0} clicks)`,
        }));

        scopes.push({
            id: 'trigger_links',
            name: 'Trigger Links',
            icon: Link2,
            tokens: linkTokens,
        });

        return scopes;
    }, [remoteValues, remoteTriggerLinks, customFields]);

    // Filter tokens across all scopes if searching
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase();
        const results = [];

        allScopes.forEach(scope => {
            scope.tokens.forEach(tok => {
                if (
                    tok.label.toLowerCase().includes(q) ||
                    tok.tag.toLowerCase().includes(q) ||
                    (tok.sub && tok.sub.toLowerCase().includes(q))
                ) {
                    results.push({ ...tok, scopeName: scope.name, icon: scope.icon });
                }
            });
        });

        return results;
    }, [searchQuery, allScopes]);

    const activeScope = useMemo(() => {
        return allScopes.find(s => s.id === activeScopeId) || allScopes[0];
    }, [activeScopeId, allScopes]);

    const handleSelectToken = (rawTag) => {
        let finalTag = rawTag;
        const trimmedFallback = fallbackDefault.trim();

        // If user provided a fallback default, format token with fallback modifier
        if (trimmedFallback && rawTag.endsWith('}}')) {
            const inner = rawTag.slice(2, -2).trim();
            finalTag = `{{ ${inner} | default: '${trimmedFallback}' }}`;
        }

        if (onSelect) {
            onSelect(finalTag);
        }
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div
            className="relative inline-block"
            style={{ zIndex: isOpen ? 100 : undefined }}
            ref={containerRef}
        >
            {/* Trigger Button */}
            {trigger ? (
                typeof trigger === 'function' ? (
                    trigger({ open: () => setIsOpen(!isOpen), isOpen })
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={buttonClassName || 'inline-flex items-center cursor-pointer'}
                        title="Insert dynamic variable / merge tag"
                    >
                        {trigger}
                    </button>
                )
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={
                        buttonClassName ||
                        `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 transition cursor-pointer shadow-2xs`
                    }
                    title="Insert dynamic variable / merge tag"
                >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{buttonText}</span>
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>
            )}

            {/* Dropdown / Popover Window */}
            {isOpen && (
                <div
                    className={`absolute ${openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'} ${
                        alignRight ? 'right-0' : 'left-0'
                    } w-80 sm:w-96 max-w-[calc(100vw-24px)] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
                    style={{ maxHeight: '460px', display: 'flex', flexDirection: 'column' }}
                >
                    {/* Search Header */}
                    <div className="p-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/50">
                        <Input
                            size="sm"
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search variables (name or tag)..."
                            leftIcon={Search}
                        />
                    </div>

                    {/* Content: Search Mode vs Flyout Mode */}
                    <div className="flex-1 overflow-y-auto" style={{ maxHeight: '280px' }}>
                        {searchResults !== null ? (
                            // Search Results List
                            <div className="p-1.5 space-y-0.5">
                                {searchResults.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-neutral-400">
                                        No variables matching "{searchQuery}"
                                    </div>
                                ) : (
                                    searchResults.map((tok, idx) => (
                                        <button
                                            key={`${tok.tag}-${idx}`}
                                            type="button"
                                            onClick={() => handleSelectToken(tok.tag)}
                                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-800 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition flex items-center justify-between group cursor-pointer gap-2"
                                        >
                                            <div className="flex flex-col min-w-0 flex-1 pr-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-xs truncate">{tok.label}</span>
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                                                        {tok.scopeName}
                                                    </span>
                                                </div>
                                                {tok.sub && (
                                                    <span className="text-[10px] text-neutral-400 truncate">{tok.sub}</span>
                                                )}
                                            </div>
                                            <span className="font-mono text-[10px] text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 max-w-[130px] truncate text-right">
                                                {tok.tag}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : (
                            // 2-Column Split: Scopes on Left, Items on Right (GHL Pattern)
                            <div className="flex h-full min-h-[240px]">
                                {/* Left Scopes Column */}
                                <div className="w-36 sm:w-40 border-r border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-800/30 p-1.5 space-y-0.5 shrink-0">
                                    {allScopes.map(scope => {
                                        const Icon = scope.icon;
                                        const isSelected = activeScopeId === scope.id;
                                        return (
                                            <button
                                                key={scope.id}
                                                type="button"
                                                onClick={() => setActiveScopeId(scope.id)}
                                                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <Icon className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{scope.name}</span>
                                                </div>
                                                <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Right Tokens Column */}
                                <div className="flex-1 min-w-0 p-1.5 overflow-y-auto space-y-0.5">
                                    {activeScope.tokens.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-neutral-400">
                                            No variables in this category
                                        </div>
                                    ) : (
                                        activeScope.tokens.map((tok, idx) => (
                                            <button
                                                key={`${tok.tag}-${idx}`}
                                                type="button"
                                                onClick={() => handleSelectToken(tok.tag)}
                                                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-neutral-800 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition flex items-center justify-between group cursor-pointer gap-2"
                                            >
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-semibold text-xs truncate">{tok.label}</span>
                                                    {tok.sub && (
                                                        <span className="text-[10px] text-neutral-400 truncate">{tok.sub}</span>
                                                    )}
                                                </div>
                                                <span className="font-mono text-[9.5px] text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 max-w-[125px] truncate text-right">
                                                    {tok.tag}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Inline Fallback Assistant (Rule 5 & Section 7.6) */}
                    <div className="p-2 bg-neutral-50/90 dark:bg-neutral-800/60 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 shrink-0">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Fallback:</span>
                        </div>
                        <Input
                            size="sm"
                            value={fallbackDefault}
                            onChange={(e) => setFallbackDefault(e.target.value)}
                            placeholder="Default if blank (e.g. there, our team)"
                            className="text-[11px]"
                            wrapperClassName="flex-1 min-w-0"
                        />
                    </div>

                    {/* Footer Info */}
                    <div className="px-3 py-1.5 bg-neutral-100/80 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
                        <span>Click to insert at cursor</span>
                        <span className="font-mono">
                            {fallbackDefault.trim() ? `| default: '${fallbackDefault.trim()}'` : 'GHL Token Engine'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
