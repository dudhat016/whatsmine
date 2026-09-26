import { ChannelBrandIcon } from '@/Components/BrandIcons';
import ConditionFieldPicker from '@/Components/ConditionFieldPicker';
import EmailEditor from '@/Components/EmailEditor';
import InlineTokenInput from '@/Components/InlineTokenInput';
import InlineTokenTextarea from '@/Components/InlineTokenTextarea';
import MediaUpload from '@/Components/MediaUpload';
import ClientLayout from '@/Layouts/ClientLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useUpdateNodeInternals,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Bot,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown, ChevronUp,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  FlaskConical,
  GitBranch,
  GripVertical,
  HelpCircle,
  Image,
  Info,
  Layers,
  LayoutTemplate,
  Link2,
  List,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquareReply,
  MinusCircle,
  MoreVertical,
  MousePointerClick,
  PackageCheck,
  Pause,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Save,
  Scissors,
  Search,
  Send,
  Settings,
  Sheet,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  UserCheck,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  Video,
  Webhook,
  Workflow,
  X,
  XCircle,
  Zap
} from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

/* ─── Constants ─────────────────────────────────────────────── */

const TRIGGER_TYPES = [
    { value: 'contact.created',           labelKey: 'automation.trigger_contact_created',           Icon: UserRound      },
    { value: 'contact.tag_added',         labelKey: 'automation.trigger_tag_added',                 Icon: Tag            },
    { value: 'message.received',          labelKey: 'automation.trigger_message_received',          Icon: MessageCircle  },
    { value: 'customer.replied',          labelKey: 'Customer Replied',                             Icon: MessageCircle  },
    { value: 'opportunity.created',       labelKey: 'Opportunity Created',                         Icon: GitBranch      },
    { value: 'opportunity.stage_changed', labelKey: 'Opportunity Stage Changed',                   Icon: GitBranch      },
    { value: 'opportunity.status_changed',labelKey: 'Opportunity Status Changed',                  Icon: TrendingUp     },
    { value: 'opportunity.won',           labelKey: 'Opportunity Won',                              Icon: CheckCircle2   },
    { value: 'opportunity.lost',          labelKey: 'Opportunity Lost',                             Icon: XCircle        },
    { value: 'opportunity.abandoned',     labelKey: 'Opportunity Abandoned',                        Icon: AlertTriangle  },
    { value: 'appointment.status',        labelKey: 'Appointment Status',                          Icon: CalendarClock  },
    { value: 'appointment.created',       labelKey: 'Appointment Booked',                          Icon: CalendarClock  },
    { value: 'appointment.rescheduled',   labelKey: 'Appointment Rescheduled',                     Icon: CalendarClock  },
    { value: 'appointment.cancelled',     labelKey: 'Appointment Cancelled',                       Icon: XCircle        },
    { value: 'campaign.sent',             labelKey: 'automation.trigger_campaign_sent',             Icon: Megaphone      },
    { value: 'form.submitted',            labelKey: 'automation.trigger_form_submitted',            Icon: FileText       },
    { value: 'webhook.received',          labelKey: 'automation.trigger_webhook_received',          Icon: Link2          },
    { value: 'order.placed',              labelKey: 'automation.trigger_order_placed',              Icon: ShoppingBag    },
    { value: 'order.fulfilled',           labelKey: 'automation.trigger_order_fulfilled',           Icon: PackageCheck   },
    { value: 'order.cancelled',           labelKey: 'automation.trigger_order_cancelled',           Icon: XCircle        },
    { value: 'cart.abandoned',            labelKey: 'automation.trigger_cart_abandoned',            Icon: ShoppingCart   },
    { value: 'customer.created',          labelKey: 'automation.trigger_customer_created',          Icon: UserPlus       },
    { value: 'contract.signed',           labelKey: 'Contract / Proposal Signed',                   Icon: FileText       },
    { value: 'proposal.accepted',         labelKey: 'Proposal Accepted',                           Icon: CheckCircle2   },
    { value: 'proposal.revision_requested', labelKey: 'Proposal Revision Requested',               Icon: AlertCircle    },
    { value: 'invoice.paid',              labelKey: 'Invoice Paid',                                Icon: DollarSign     },
    { value: 'funnel.cart_abandoned',     labelKey: 'Funnel Step 1 Cart Abandoned',                Icon: ShoppingCart   },
    { value: 'funnel.order_completed',    labelKey: 'Funnel 2-Step Order Completed',               Icon: ShoppingBag    },
    { value: 'funnel.order_bump_purchased', labelKey: 'Funnel Order Bump Purchased',               Icon: Sparkles       },
    { value: 'funnel.upsell_accepted',    labelKey: 'Funnel 1-Click Upsell Accepted',              Icon: TrendingUp     },
    { value: 'funnel.upsell_declined',    labelKey: 'Funnel 1-Click Upsell Declined',              Icon: XCircle        },
    { value: 'funnel.step_visited',       labelKey: 'Funnel Step Visited',                         Icon: Eye            },
    { value: 'funnel.form_submitted',      labelKey: 'Funnel Form Submitted',                       Icon: FileText       },
    { value: 'trigger_link.clicked',        labelKey: 'Trigger Link Clicked',                         Icon: Link2          },
];

// Categories rendered (in order) in the node palette — mirrors the product node list.
const CATEGORY_ORDER = ['send', 'listen', 'logic', 'ai', 'contact', 'pipeline', 'engage', 'agency', 'commerce', 'integrations'];

const NODE_DEFS = {
    // ── SEND ──────────────────────────────────────────────────────────────
    send_whatsapp:       { labelKey: 'automation.node_send_whatsapp',       color: '#25D366', bg: '#f0fdf4', icon: 'whatsapp',        category: 'send' },
    send_template:       { labelKey: 'automation.node_send_template',       color: '#16a34a', bg: '#f0fdf4', icon: LayoutTemplate,    category: 'send' },
    send_media:          { labelKey: 'automation.node_send_media',          color: '#0d9488', bg: '#f0fdfa', icon: Image,             category: 'send' },
    send_sequence:       { labelKey: 'automation.node_send_sequence',       color: '#0891b2', bg: '#ecfeff', icon: Layers,            category: 'send' },
    quick_replies:       { labelKey: 'automation.node_quick_replies',       color: '#7c3aed', bg: '#faf5ff', icon: MousePointerClick, category: 'send' },
    list_message:        { labelKey: 'automation.node_list_message',        color: '#6d28d9', bg: '#f5f3ff', icon: List,              category: 'send' },
    send_sms:            { labelKey: 'automation.node_send_sms',            color: '#6366f1', bg: '#eef2ff', icon: Phone,             category: 'send' },
    send_email:          { labelKey: 'automation.node_send_email',          color: '#0ea5e9', bg: '#f0f9ff', icon: Mail,              category: 'send' },
    internal_notification: { labelKey: 'Internal Notification',         color: '#f59e0b', bg: '#fffbeb', icon: Bell,              category: 'send' },
    // ── LISTEN ────────────────────────────────────────────────────────────
    ask_question:        { labelKey: 'automation.node_ask_question',        color: '#ea580c', bg: '#fff7ed', icon: HelpCircle,        category: 'listen' },
    wait_for_reply:      { labelKey: 'Wait for Customer Reply',             color: '#0284c7', bg: '#f0f9ff', icon: MessageSquareReply,category: 'listen' },
    // ── LOGIC ─────────────────────────────────────────────────────────────
    condition:           { labelKey: 'automation.node_condition',           color: '#8b5cf6', bg: '#f5f3ff', icon: GitBranch,         category: 'logic' },
    wait:                { labelKey: 'automation.node_wait',                color: '#f59e0b', bg: '#fffbeb', icon: Clock,             category: 'logic' },
    webhook:             { labelKey: 'automation.node_webhook',             color: '#64748b', bg: '#f8fafc', icon: Webhook,           category: 'logic' },
    run_subflow:         { labelKey: 'automation.node_run_subflow',         color: '#475569', bg: '#f8fafc', icon: Workflow,          category: 'logic' },
    remove_from_workflow:{ labelKey: 'Remove from Workflow',                color: '#e11d48', bg: '#fff1f2', icon: LogOut,            category: 'logic' },
    // ── AI ────────────────────────────────────────────────────────────────
    ai_reply:            { labelKey: 'automation.node_ai_reply',            color: '#7c3aed', bg: '#faf5ff', icon: Sparkles,          category: 'ai' },
    // ── CONTACT ───────────────────────────────────────────────────────────
    add_tag:             { labelKey: 'automation.node_add_tag',             color: '#10b981', bg: '#ecfdf5', icon: Tag,               category: 'contact' },
    remove_tag:          { labelKey: 'automation.node_remove_tag',          color: '#f43f5e', bg: '#fff1f2', icon: Scissors,          category: 'contact' },
    update_contact:      { labelKey: 'automation.node_update_contact',      color: '#0ea5e9', bg: '#f0f9ff', icon: UserCog,           category: 'contact' },
    assign_agent:        { labelKey: 'automation.node_assign_agent',        color: '#0284c7', bg: '#f0f9ff', icon: UserCheck,         category: 'contact' },
    add_to_campaign:     { labelKey: 'automation.node_add_to_campaign',     color: '#f97316', bg: '#fff7ed', icon: Megaphone,         category: 'contact' },
    // ── PIPELINE ──────────────────────────────────────────────────────────
    create_opportunity:       { labelKey: 'Create / Update Opportunity',    color: '#6366f1', bg: '#eef2ff', icon: GitBranch,         category: 'pipeline' },
    change_opportunity_stage: { labelKey: 'Change Opportunity Stage',       color: '#8b5cf6', bg: '#f5f3ff', icon: GitBranch,         category: 'pipeline' },
    update_opportunity_status:{ labelKey: 'Update Opportunity Status',      color: '#10b981', bg: '#ecfdf5', icon: CheckCircle2,      category: 'pipeline' },
    remove_opportunity:       { labelKey: 'Remove Opportunity',             color: '#f43f5e', bg: '#fff1f2', icon: Trash2,            category: 'pipeline' },
    // ── ENGAGE ────────────────────────────────────────────────────────────
    cta_button:          { labelKey: 'automation.node_cta_button',          color: '#e11d48', bg: '#fff1f2', icon: ExternalLink,      category: 'engage' },
    send_location:       { labelKey: 'automation.node_send_location',       color: '#dc2626', bg: '#fef2f2', icon: MapPin,            category: 'engage' },
    send_poll:           { labelKey: 'automation.node_send_poll',           color: '#9333ea', bg: '#faf5ff', icon: BarChart3,         category: 'engage' },
    run_chatbot:         { labelKey: 'automation.node_run_chatbot',         color: '#7c3aed', bg: '#faf5ff', icon: Bot,               category: 'engage' },
    book_appointment:    { labelKey: 'automation.node_book_appointment',    color: '#2563eb', bg: '#eff6ff', icon: CalendarClock,     category: 'engage' },
    google_meet:         { labelKey: 'automation.node_google_meet',         color: '#16a34a', bg: '#f0fdf4', icon: Video,             category: 'engage' },
    whatsapp_form:       { labelKey: 'automation.node_whatsapp_form',       color: '#0891b2', bg: '#ecfeff', icon: ClipboardList,     category: 'engage' },
    // ── AGENCY SUITE & PAYMENTS ───────────────────────────────────────────
    create_agency_invoice:   { labelKey: 'Create B2B Invoice',                  color: '#10b981', bg: '#ecfdf5', icon: FileText,          category: 'agency' },
    send_agency_payment_link:{ labelKey: 'Send WhatsApp Payment Link',         color: '#059669', bg: '#ecfdf5', icon: DollarSign,        category: 'agency' },
    send_onboarding_form_link:{ labelKey: 'Send Onboarding Questionnaire Link',color: '#0891b2', bg: '#ecfeff', icon: ClipboardCheck,    category: 'agency' },
    // ── COMMERCE ──────────────────────────────────────────────────────────
    whatsapp_catalog:    { labelKey: 'automation.node_whatsapp_catalog',    color: '#16a34a', bg: '#f0fdf4', icon: ShoppingBag,       category: 'commerce' },
    woocommerce_product: { labelKey: 'automation.node_woocommerce_product', color: '#7f54b3', bg: '#f5f3ff', icon: ShoppingCart,      category: 'commerce' },
    shopify_product:     { labelKey: 'automation.node_shopify_product',     color: '#5a8a35', bg: '#f7fee7', icon: Store,             category: 'commerce' },
    // ── INTEGRATIONS ──────────────────────────────────────────────────────
    google_sheets:       { labelKey: 'automation.node_google_sheets',       color: '#0f9d58', bg: '#f0fdf4', icon: Sheet,             category: 'integrations' },
    google_docs:         { labelKey: 'automation.node_google_docs',         color: '#4285f4', bg: '#eff6ff', icon: FileText,          category: 'integrations' },
    google_forms:        { labelKey: 'automation.node_google_forms',        color: '#7248b9', bg: '#f5f3ff', icon: ClipboardCheck,    category: 'integrations' },
};

const CONDITION_CATEGORIES = [
    {
        category: 'Contact Details',
        fields: [
            { value: 'contact.tag',        labelKey: 'Contact Tag' },
            { value: 'contact.name',       labelKey: 'Contact Full Name' },
            { value: 'contact.first_name', labelKey: 'First Name' },
            { value: 'contact.last_name',  labelKey: 'Last Name' },
            { value: 'contact.email',      labelKey: 'Contact Email' },
            { value: 'contact.phone',      labelKey: 'Contact Phone / WhatsApp' },
            { value: 'contact.country',    labelKey: 'Country' },
            { value: 'contact.timezone',   labelKey: 'Timezone' },
            { value: 'contact.source',     labelKey: 'Lead Source' },
        ],
    },
    {
        category: 'Appointments & Scheduling',
        fields: [
            { value: 'appointment.status',      labelKey: 'Appointment Status (confirmed, showed, etc)' },
            { value: 'appointment.calendar_id', labelKey: 'In Calendar' },
            { value: 'appointment.title',       labelKey: 'Appointment Title' },
            { value: 'appointment.location',    labelKey: 'Meeting Location / Type' },
        ],
    },
    {
        category: 'Sales & Opportunities',
        fields: [
            { value: 'opportunity.pipeline_id',   labelKey: 'Pipeline' },
            { value: 'opportunity.stage_id',      labelKey: 'Pipeline Stage' },
            { value: 'opportunity.status',        labelKey: 'Opportunity Status (open, won, lost, abandoned)' },
            { value: 'opportunity.monetary_value',labelKey: 'Deal Value ($)' },
        ],
    },
    {
        category: 'Invoices & Orders',
        fields: [
            { value: 'invoice.status',      labelKey: 'Invoice Status (paid, unpaid, overdue, pending)' },
            { value: 'funnel.order_bump',   labelKey: 'Order Bump Taken (Yes/No)' },
            { value: 'funnel.total_amount', labelKey: 'Order Total Amount' },
        ],
    },
    {
        category: 'Funnels & Forms',
        fields: [
            { value: 'form.slug',        labelKey: 'Subscription / Funnel Form' },
            { value: 'funnel.name',      labelKey: 'Funnel Name' },
            { value: 'funnel.step_name', labelKey: 'Funnel Step Name' },
            { value: 'funnel.variant',   labelKey: 'Split Test Variant (A/B)' },
        ],
    },
    {
        category: 'Triggers & Messages',
        fields: [
            { value: 'trigger.name',  labelKey: 'Workflow Trigger' },
            { value: 'message.body',  labelKey: 'Message Body' },
            { value: 'context.key',   labelKey: 'Context Variable' },
            { value: 'custom.field',  labelKey: 'Form / Custom Field' },
        ],
    },
];

const CONDITION_FIELDS = CONDITION_CATEGORIES.flatMap(c => c.fields);

const CONDITION_OPERATORS = [
    { value: 'equals',       labelKey: 'Is' },
    { value: 'not_equals',   labelKey: 'Is not' },
    { value: 'contains',     labelKey: 'Contains' },
    { value: 'not_contains', labelKey: 'Does not contain' },
    { value: 'exists',       labelKey: 'Is defined / exists' },
    { value: 'not_exists',   labelKey: 'Is empty / not exists' },
];

const UPDATE_FIELDS = [
    { value: 'name',   labelKey: 'common.name' },
    { value: 'email',  labelKey: 'common.email' },
    { value: 'phone',  labelKey: 'automation.update_field_phone' },
    { value: 'notes',  labelKey: 'automation.update_field_notes' },
];

/* ─── Resources (builder reference data from the controller) ───── */
function useResources() {
    const { props } = usePage();
    return props.resources ?? {};
}

/* ─── Node icon helper ───────────────────────────────────────── */
function NodeIcon({ nodeType, size = 14 }) {
    const def = NODE_DEFS[nodeType];
    if (!def) return <Settings size={size} />;
    if (def.icon === 'whatsapp' || def.icon === 'sms' || def.icon === 'email') {
        return <ChannelBrandIcon channel={def.icon} className={`h-[${size}px] w-[${size}px] shrink-0`} />;
    }
    const Icon = def.icon;
    return <Icon size={size} />;
}

/* Lets custom nodes reach the builder's configure/duplicate/delete handlers (context crosses the ReactFlow boundary). */
const NodeActionsContext = createContext({
    onConfigure: () => {},
    onDuplicate: () => {},
    onDelete: () => {},
    onToggleDisable: () => {},
    onCopyAction: () => {},
    onCopyBranch: () => {},
    clipboard: null,
    onPaste: () => {},
    clearClipboard: () => {},
    triggerNodes: [],
    nodes: [],
    edges: [],
});

const actionBtnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 22, height: 22, padding: 0, borderRadius: 6, border: 'none',
    background: 'transparent', color: '#9ca3af', cursor: 'pointer',
    transition: 'background 0.12s, color 0.12s',
};

/* ─── Node Action Dropdown Menu (Three Dots) ────────────────────── */
function NodeActionMenu({ id, data, isTrigger = false }) {
    const { t } = useTranslation();
    const { onConfigure, onDuplicate, onDelete, onToggleDisable, onCopyAction, onCopyBranch, edges = [] } = useContext(NodeActionsContext);
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const hasDownstream = !isTrigger && edges.some(e => e.source === id);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, [open]);

    const itemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '7px 10px',
        fontSize: 12,
        fontWeight: 500,
        color: '#334155',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s, color 0.12s',
        whiteSpace: 'nowrap',
    };

    return (
        <div ref={menuRef} className="nodrag" style={{ position: 'relative', display: 'inline-flex' }}>
            <button
                type="button"
                className="nodrag"
                title="More options"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(prev => !prev);
                }}
                style={{
                    ...actionBtnStyle,
                    background: open ? '#f1f5f9' : 'transparent',
                    color: open ? '#1e293b' : '#9ca3af',
                }}
                onMouseEnter={e => { if (!open) { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#4b5563'; } }}
                onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; } }}
            >
                <MoreVertical size={14} />
            </button>

            {open && (
                <div
                    className="nodrag"
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        right: 0,
                        minWidth: 195,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)',
                        padding: 4,
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {!isTrigger && (
                        <>
                            <button
                                type="button"
                                className="nodrag"
                                style={itemStyle}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(false);
                                    onCopyAction?.(id);
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}
                            >
                                <Copy size={13} style={{ color: '#6366f1', flexShrink: 0 }} />
                                <span style={{ flex: 1 }}>Copy action</span>
                                <span style={{ fontSize: 9.5, color: '#94a3b8', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, border: '1px solid #e2e8f0' }}>Ctrl+C</span>
                            </button>

                            {hasDownstream && (
                                <button
                                    type="button"
                                    className="nodrag"
                                    style={itemStyle}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpen(false);
                                        onCopyBranch?.(id);
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}
                                >
                                    <Layers size={13} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                                    <span style={{ flex: 1 }}>Copy all actions from here</span>
                                </button>
                            )}

                            <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
                        </>
                    )}

                    <button
                        type="button"
                        className="nodrag"
                        style={itemStyle}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            onConfigure?.(id);
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}
                    >
                        <Settings size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{t('common.settings')}</span>
                    </button>

                    <button
                        type="button"
                        className="nodrag"
                        style={itemStyle}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            onDuplicate?.(id);
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}
                    >
                        <Copy size={13} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>Duplicate</span>
                        <span style={{ fontSize: 9.5, color: '#94a3b8', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, border: '1px solid #e2e8f0' }}>Ctrl+D</span>
                    </button>

                    {!isTrigger && onToggleDisable && (
                        <button
                            type="button"
                            className="nodrag"
                            style={itemStyle}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                onToggleDisable?.(id);
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}
                        >
                            {data?.disabled ? (
                                <>
                                    <Play size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                                    <span>Enable Step</span>
                                </>
                            ) : (
                                <>
                                    <Pause size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                    <span>Disable Step</span>
                                </>
                            )}
                        </button>
                    )}

                    <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />

                    <button
                        type="button"
                        className="nodrag"
                        style={{ ...itemStyle, color: '#ef4444' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            onDelete?.(id);
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                        <Trash2 size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
                        <span>{t('common.delete')}</span>
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─── GoHighLevel Condition Visual Tree Node ─────────────────────── */
function BranchConditionSummary({ branch, resources = {} }) {
    const conds = branch.conditions || branch.segments?.[0]?.conditions || [];
    if (!conds || conds.length === 0) {
        return <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginTop: 3 }}>No conditions set</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
            {conds.slice(0, 2).map((c, cIdx) => {
                const fieldObj = CONDITION_FIELDS.find(f => f.value === c.field);
                let fName = c.field === 'trigger.name' ? 'Trigger' : (fieldObj ? fieldObj.labelKey : (c.field || 'Field'));
                if (c.field === 'custom.field' && c.custom_key) {
                    const cf = (resources.custom_fields || []).find(f => f.key === c.custom_key);
                    fName = cf ? (cf.name || cf.key) : c.custom_key;
                } else if (c.field?.startsWith('custom.')) {
                    const k = c.field.replace('custom.', '');
                    const cf = (resources.custom_fields || []).find(f => f.key === k);
                    if (cf) fName = cf.name || cf.key;
                }
                const op = c.operator === 'equals' ? 'is' : c.operator === 'not_equals' ? 'is not' : (c.operator || 'is');
                const val = c.value !== undefined && c.value !== null && c.value !== '' ? `"${c.value}"` : 'any';

                return (
                    <div
                        key={cIdx}
                        style={{
                            fontSize: 10,
                            color: '#475569',
                            lineHeight: 1.35,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {cIdx === 0 ? 'If ' : `${c.logic || 'AND'} `}
                        "{fName}" {op} {val}
                    </div>
                );
            })}
            {conds.length > 2 && (
                <div style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 600 }}>
                    +{conds.length - 2} more rule{conds.length - 2 > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}

function ConditionTreeNode({ id, data, selected, displayName, resources, t }) {
    const updateNodeInternals = useUpdateNodeInternals();
    const { onConfigure, onPaste, clipboard } = useContext(NodeActionsContext);

    const branches = Array.isArray(data.branches) && data.branches.length > 0
        ? data.branches
        : (data.field
            ? [{ id: 'branch_0', name: data.branchName || 'Branch 1', conditions: [{ field: data.field, operator: data.operator || 'equals', value: data.value, logic: 'AND' }] }]
            : [{ id: 'branch_0', name: 'Branch 1', conditions: [] }]);

    const allCards = [];
    branches.forEach((b, bIdx) => {
        const conds = b.conditions || b.segments?.[0]?.conditions || [];
        const baseBranchId = b.id || `branch_${bIdx}`;
        const baseBranchName = b.name || `Branch ${bIdx + 1}`;

        if (conds.length > 1) {
            // Multiple conditions inside this branch -> unpack each as an individual branch node!
            conds.forEach((c, cIdx) => {
                const cardId = cIdx === 0 ? baseBranchId : `${baseBranchId}_${cIdx}`;
                const cardTitle = c.value !== undefined && c.value !== null && c.value !== ''
                    ? String(c.value)
                    : `${baseBranchName} (Rule ${cIdx + 1})`;
                allCards.push({
                    id: cardId,
                    name: cardTitle,
                    badge: baseBranchName,
                    conditions: [c],
                    isNone: false,
                    branchIdx: bIdx,
                    condIdx: cIdx,
                });
            });
        } else {
            const firstCond = conds[0];
            const cardTitle = b.name && b.name !== `Branch ${bIdx + 1}`
                ? b.name
                : (firstCond?.value ? String(firstCond.value) : baseBranchName);

            allCards.push({
                ...b,
                id: baseBranchId,
                name: cardTitle,
                badge: b.name && b.name !== cardTitle && b.name !== `Branch ${bIdx + 1}` ? b.name : null,
                conditions: conds,
                isNone: false,
                branchIdx: bIdx,
                condIdx: 0,
            });
        }
    });

    allCards.push({
        id: 'none',
        name: data.noneBranchName || 'None',
        isNone: true,
        conditions: [],
    });

    useEffect(() => {
        updateNodeInternals(id);
    }, [id, allCards.length, updateNodeInternals]);

    const cardWidth = 205;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            opacity: data.disabled ? 0.68 : 1,
        }}>
            {/* Top Condition Router Node */}
            <div
                onClick={() => onConfigure?.(id)}
                style={{
                    position: 'relative',
                    background: '#fff',
                    border: data.disabled ? '1.5px dashed #94a3b8' : selected ? '1.5px solid #8b5cf6' : '1px solid #e2e8f0',
                    borderRadius: 12,
                    boxShadow: selected
                        ? '0 0 0 3px rgba(139, 92, 246, 0.2), 0 6px 20px rgba(0,0,0,0.06)'
                        : '0 2px 8px rgba(0,0,0,0.05)',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    minWidth: 175,
                    zIndex: 5,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                }}
            >
                <Handle
                    type="target"
                    position={Position.Top}
                    style={{ background: '#fff', width: 9, height: 9, border: '2px solid #8b5cf6' }}
                />

                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: '#f5f3ff',
                    color: '#7c3aed',
                    fontWeight: 700,
                    fontSize: 13,
                    fontFamily: 'monospace',
                }}>
                    {'{ }'}
                </span>

                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        {displayName || 'Condition'}
                    </div>
                </div>

                <div className="nodrag" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <NodeActionMenu id={id} data={data} isTrigger={false} />
                </div>
            </div>

            {/* Tree Branching Stem & Horizontal Spanning Line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', pointerEvents: 'none' }}>
                {/* Vertical Stem from Top Pill */}
                <div style={{ width: 2, height: 20, background: '#cbd5e1' }} />

                {/* Horizontal Spanning Bar & Drops */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    {allCards.map((card, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === allCards.length - 1;
                        const isOnly = allCards.length === 1;

                        return (
                            <div
                                key={card.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: cardWidth,
                                    padding: '0 8px',
                                    boxSizing: 'border-box',
                                }}
                            >
                                {/* Connector junction */}
                                <div style={{ position: 'relative', width: '100%', height: 20 }}>
                                    {!isOnly && (
                                        <>
                                            {isFirst ? (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    bottom: 0,
                                                    left: '50%',
                                                    right: 0,
                                                    borderTop: '2px solid #cbd5e1',
                                                    borderLeft: '2px solid #cbd5e1',
                                                    borderTopLeftRadius: 8,
                                                }} />
                                            ) : isLast ? (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    bottom: 0,
                                                    left: 0,
                                                    right: '50%',
                                                    borderTop: '2px solid #cbd5e1',
                                                    borderRight: '2px solid #cbd5e1',
                                                    borderTopRightRadius: 8,
                                                }} />
                                            ) : (
                                                <>
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: 2,
                                                        background: '#cbd5e1',
                                                    }} />
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        bottom: 0,
                                                        left: '50%',
                                                        width: 2,
                                                        transform: 'translateX(-50%)',
                                                        background: '#cbd5e1',
                                                    }} />
                                                </>
                                            )}
                                        </>
                                    )}
                                    {isOnly && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            bottom: 0,
                                            left: '50%',
                                            width: 2,
                                            transform: 'translateX(-50%)',
                                            background: '#cbd5e1',
                                        }} />
                                    )}
                                </div>

                                {/* Branch Card */}
                                <div
                                    onClick={() => onConfigure?.(id)}
                                    style={{
                                        pointerEvents: 'all',
                                        width: '100%',
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderBottom: '3.5px solid #8b5cf6',
                                        borderRadius: 10,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                        padding: '9px 11px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 3,
                                        boxSizing: 'border-box',
                                        cursor: 'pointer',
                                        transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.15s',
                                        minHeight: 68,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
                                        e.currentTarget.style.borderColor = '#c4b5fd';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    {/* Card Header: Icon + Title */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {card.badge && !card.isNone && (
                                            <span style={{ fontSize: 8.5, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                {card.badge}
                                            </span>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <GitBranch size={13} strokeWidth={2.5} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                                            <span style={{
                                                fontSize: 11.5,
                                                fontWeight: 700,
                                                color: '#7c3aed',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                flex: 1,
                                            }}>
                                                {card.name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Subtitle / Rules */}
                                    {card.isNone ? (
                                        <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.35, marginTop: 3 }}>
                                            When none of the conditions are met
                                        </div>
                                    ) : (
                                        <BranchConditionSummary branch={card} resources={resources} />
                                    )}
                                </div>

                                {/* Bottom Stem + Circular Plus Button + ReactFlow Handle */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    position: 'relative',
                                    width: '100%',
                                    marginTop: 0,
                                    pointerEvents: 'all',
                                }}>
                                    {/* Vertical Stem */}
                                    <div style={{ width: 2, height: 16, background: '#cbd5e1' }} />

                                    {/* Circular Plus Indicator with integrated Handle */}
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: 22,
                                            height: 22,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className="nodrag"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (clipboard) {
                                                    onPaste?.(id, card.id);
                                                }
                                            }}
                                            title={clipboard ? `Paste "${clipboard.name}" (${clipboard.count} step${clipboard.count > 1 ? 's' : ''}) under ${card.name}` : undefined}
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                background: clipboard ? '#f5f3ff' : '#fff',
                                                border: clipboard ? '1.5px solid #8b5cf6' : '1.5px solid #cbd5e1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: clipboard ? '#7c3aed' : '#94a3b8',
                                                boxShadow: clipboard ? '0 0 0 3px rgba(139, 92, 246, 0.25), 0 2px 5px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.05)',
                                                cursor: clipboard ? 'pointer' : 'default',
                                                transition: 'all 0.15s ease',
                                                padding: 0,
                                                zIndex: 5,
                                            }}
                                        >
                                            {clipboard ? <Copy size={10} strokeWidth={2.5} /> : <Plus size={11} strokeWidth={2.5} />}
                                        </button>

                                        {/* Output Handle */}
                                        <Handle
                                            type="source"
                                            position={Position.Bottom}
                                            id={card.id}
                                            style={{
                                                position: 'absolute',
                                                bottom: -4,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: '#fff',
                                                width: 9,
                                                height: 9,
                                                borderRadius: '50%',
                                                border: '2px solid #8b5cf6',
                                                cursor: 'crosshair',
                                                zIndex: 10,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ─── Custom Nodes ───────────────────────────────────────────── */
function BaseNode({ id, data, selected }) {
    const { t } = useTranslation();
    const resources = useResources();
    const { onPaste, clipboard } = useContext(NodeActionsContext);
    const { nodeType, label, configured } = data;
    const def = NODE_DEFS[nodeType];
    const defLabel = def ? t(def.labelKey) : nodeType;
    const defColor = def?.color ?? '#6b7280';
    const isCondition = nodeType === 'condition';
    const isWaitForReply = nodeType === 'wait_for_reply';
    const isSubflow = nodeType === 'run_subflow';
    const isRemoveWorkflow = nodeType === 'remove_from_workflow';

    const hasLabel = label && label.trim() !== '' && label !== defLabel;
    const displayName = hasLabel ? label : defLabel;
    const summary = configured ? summarizeConfig(data, t) : '';
    const branches = isCondition && Array.isArray(data.branches) && data.branches.length > 0 ? data.branches : null;

    if (isCondition) {
        return (
            <ConditionTreeNode
                id={id}
                data={data}
                selected={selected}
                displayName={displayName}
                resources={resources}
                t={t}
            />
        );
    }

    return (
        <div
            style={{
                position: 'relative',
                background: data.disabled ? '#f8fafc' : '#fff',
                border: data.disabled ? '1.5px dashed #94a3b8' : `1px solid ${selected ? defColor : '#e5e7eb'}`,
                opacity: data.disabled ? 0.68 : 1,
                borderRadius: 14,
                minWidth: (isCondition && branches) || isWaitForReply ? 260 : 210,
                boxShadow: selected
                    ? `0 0 0 3px ${defColor}1f, 0 8px 24px rgba(0,0,0,0.08)`
                    : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.15s, border-color 0.15s, opacity 0.15s',
            }}
        >
            <Handle type="target" position={Position.Top} style={{ background: '#fff', width: 9, height: 9, border: `2px solid ${defColor}` }} />

            {/* Row: icon chip · text · actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderBottom: (isCondition && branches) || isWaitForReply ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: def?.bg ?? '#f3f4f6', color: defColor,
                }}>
                    <NodeIcon nodeType={nodeType} size={15} />
                </span>

                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: data.disabled ? '#64748b' : '#111827', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayName}
                        </div>
                        {data.disabled && (
                            <span style={{ fontSize: 8.5, fontWeight: 700, padding: '0px 4px', borderRadius: 3, background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
                                Skipped
                            </span>
                        )}
                    </div>
                    {isSubflow && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <span style={{
                                fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                                background: data.mode === 'wait_completion' ? '#f5f3ff' : data.mode === 'handoff' ? '#fff1f2' : '#f8fafc',
                                color: data.mode === 'wait_completion' ? '#6366f1' : data.mode === 'handoff' ? '#e11d48' : '#475569',
                                border: `1px solid ${data.mode === 'wait_completion' ? '#ddd6fe' : data.mode === 'handoff' ? '#fecaca' : '#e2e8f0'}`,
                            }}>
                                {data.mode === 'wait_completion' ? '⏳ Nested Wait' : data.mode === 'handoff' ? '🔀 Handoff' : '⚡ Background'}
                            </span>
                        </div>
                    )}
                    {isRemoveWorkflow && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <span style={{
                                fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                                background: data.target_type === 'all_except_current' ? '#eff6ff' : '#fff1f2',
                                color: data.target_type === 'all_except_current' ? '#2563eb' : '#be123c',
                                border: `1px solid ${data.target_type === 'all_except_current' ? '#bfdbfe' : '#fecaca'}`,
                            }}>
                                {data.target_type === 'all' ? '🛑 All Workflows' : (data.target_type === 'all_except_current' ? '⚡ All Except Current' : (data.target_type === 'another' || data.target_type === 'specific' ? '🔀 Another Workflow' : 'Current Workflow'))}
                            </span>
                        </div>
                    )}
                    {(!branches || hasLabel) && !isSubflow && !isRemoveWorkflow && (
                        <div style={{
                            fontSize: 10.5, lineHeight: 1.3, marginTop: 1,
                            color: summary ? '#6b7280' : '#9ca3af',
                            fontStyle: summary ? 'normal' : 'italic',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {hasLabel && isCondition ? defLabel : (summary || t('automation.click_to_configure'))}
                        </div>
                    )}
                </div>

                <div className="nodrag" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <NodeActionMenu id={id} data={data} isTrigger={false} />
                </div>
            </div>

            {/* Handles & Branch Cards */}
            {isWaitForReply ? (
                <div style={{ padding: '6px 8px 8px', display: 'flex', flexDirection: 'column', gap: 6, background: '#fafafa' }}>
                    {/* Replied Branch */}
                    <div style={{
                        position: 'relative', background: '#fff', border: '1px solid #bbf7d0', borderRadius: 8,
                        padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 2,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '1px 5px', borderRadius: 4 }}>
                                REPLIED
                            </span>
                            <span style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {data.match_type === 'contains' && data.match_phrase ? `Contains "${data.match_phrase}"` : data.match_type === 'exact' && data.match_phrase ? `Equals "${data.match_phrase}"` : 'Any reply'}
                            </span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#15803d' }}>
                            Customer Responded
                        </div>
                        <Handle
                            type="source"
                            id="replied"
                            position={Position.Right}
                            style={{ top: '50%', right: -6, background: '#fff', width: 9, height: 9, border: '2px solid #16a34a' }}
                        />
                    </div>
                    {/* Timeout Branch */}
                    <div style={{
                        position: 'relative', background: '#fff', border: '1px solid #fed7aa', borderRadius: 8,
                        padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 2,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '1px 5px', borderRadius: 4 }}>
                                TIMEOUT
                            </span>
                            <span style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                After {data.timeout_amount || 24} {data.timeout_unit || 'hours'}
                            </span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#c2410c' }}>
                            No Response (Timeout)
                        </div>
                        <Handle
                            type="source"
                            id="timeout"
                            position={Position.Right}
                            style={{ top: '50%', right: -6, background: '#fff', width: 9, height: 9, border: '2px solid #ea580c' }}
                        />
                    </div>
                </div>
            ) : isRemoveWorkflow && (data.target_type === 'current' || data.target_type === 'all' || !data.target_type) ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 6px', background: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                        padding: '2px 9px', borderRadius: 999,
                        background: '#e2e8f0', color: '#64748b',
                    }}>
                        END
                    </span>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    width: '100%',
                }}>
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 0,
                        marginBottom: -10,
                    }}>
                        <button
                            type="button"
                            className="nodrag"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (clipboard) {
                                    onPaste?.(id);
                                }
                            }}
                            title={clipboard ? `Paste "${clipboard.name}" (${clipboard.count} step${clipboard.count > 1 ? 's' : ''}) here` : undefined}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: clipboard ? '#f5f3ff' : '#fff',
                                border: clipboard ? '1.5px solid #8b5cf6' : '1.5px solid #cbd5e1',
                                color: clipboard ? '#7c3aed' : '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: clipboard ? 'pointer' : 'default',
                                boxShadow: clipboard ? '0 0 0 3px rgba(139, 92, 246, 0.25), 0 2px 4px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.05)',
                                transition: 'all 0.15s ease',
                                padding: 0,
                                zIndex: 5,
                            }}
                        >
                            {clipboard ? <Copy size={10} strokeWidth={2.5} /> : <Plus size={11} strokeWidth={2.5} />}
                        </button>

                        <Handle
                            type="source"
                            position={Position.Bottom}
                            style={{
                                position: 'absolute',
                                bottom: -4,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#fff',
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                border: `2px solid ${defColor}`,
                                cursor: 'crosshair',
                                zIndex: 10,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function getTriggerSummary(data, resources = {}) {
    const config = data.triggerConfig || {};
    const trName = data.triggerName || (data.label && data.label !== 'Trigger' ? data.label : null);
    if (data.triggerType === 'form.submitted') {
        const form = (resources.subscription_forms || []).find(f => f.slug === config.form_slug || f.id === config.form_id);
        return form ? `Form: ${form.name}` : (config.form_slug ? `Form: ${config.form_slug}` : 'All Forms');
    }
    if (data.triggerType === 'contact.tag_added') {
        return config.tag_name ? `Tag: ${config.tag_name}` : 'All Tags';
    }
    if (data.triggerType === 'contact.created') {
        return config.source ? `Source: ${config.source}` : 'All Sources';
    }
    if (['opportunity.created', 'opportunity.stage_changed', 'opportunity.status_changed', 'opportunity.won', 'opportunity.lost', 'opportunity.abandoned'].includes(data.triggerType)) {
        const pipeline = (resources.pipelines || []).find(p => p.id === parseInt(config.pipeline_id, 10));
        let sum = pipeline ? `Pipeline: ${pipeline.name}` : 'All Opportunities';
        if (data.triggerType === 'opportunity.won') sum += ' • Won';
        else if (data.triggerType === 'opportunity.lost') sum += ' • Lost';
        else if (data.triggerType === 'opportunity.abandoned') sum += ' • Abandoned';
        else if (data.triggerType === 'opportunity.stage_changed') {
            const toStage = (resources.pipelines || []).flatMap(p => p.stages || []).find(s => String(s.id) === String(config.stage_id));
            const fromStage = (resources.pipelines || []).flatMap(p => p.stages || []).find(s => String(s.id) === String(config.from_stage_id));
            if (fromStage && toStage) {
                sum += ` • ${fromStage.name} ➔ ${toStage.name}`;
            } else if (toStage) {
                sum += ` • Stage: ${toStage.name}`;
            } else if (fromStage) {
                sum += ` • From: ${fromStage.name}`;
            }
            if (config.change_source && config.change_source !== 'any') {
                sum += ` • ${config.change_source === 'manual' ? 'Manual Move' : 'Automation'}`;
            }
        }
        else if (config.status) sum += ` • Status: ${config.status}`;
        return sum;
    }
    if (data.triggerType === 'message.received' || data.triggerType === 'customer.replied') {
        const repliedWfId = config.replied_to_workflow_id || (config.filters || []).find(f => f.type === 'replied_to_workflow')?.value;
        let ch = '';
        if (repliedWfId) {
            const wfList = resources.workflows || resources.subflows || [];
            const wf = wfList.find(w => String(w.id || w.uuid) === String(repliedWfId));
            ch = `Replied to: ${wf ? wf.name : `Workflow #${repliedWfId}`}`;
        } else if (config.channel) {
            ch = `Channel: ${config.channel}`;
        } else {
            ch = data.triggerType === 'customer.replied' ? 'Customer Replied' : 'All Channels';
        }
        return config.stop_on_response ? `${ch} • Stop on Response` : ch;
    }
    if (data.triggerType === 'campaign.sent') {
        return config.campaign_id ? `Campaign #${config.campaign_id}` : 'All Campaigns';
    }
    if (['order.placed', 'cart.abandoned', 'order.fulfilled', 'order.cancelled', 'customer.created'].includes(data.triggerType)) {
        return config.store_id ? `Store #${config.store_id}` : 'All Stores';
    }
    if (data.triggerType && data.triggerType.startsWith('funnel.')) {
        const funnel = (resources.funnels || []).find(f => String(f.id) === String(config.funnel_id));
        const step = (funnel?.steps || []).find(s => String(s.id) === String(config.funnel_step_id));
        let sum = funnel ? `Funnel: ${funnel.name}` : 'All Funnels';
        if (step) sum += ` • Step: ${step.name}`;
        if (config.variant && config.variant !== 'all') sum += ` (${config.variant})`;
        return sum;
    }
    return '';
}

function getTriggerConditions(data, resources = {}) {
    const config = data.triggerConfig || {};
    const filters = Array.isArray(config.filters) ? config.filters : [];
    const conditions = [];
    const seen = new Set();

    const addCond = (text) => {
        if (text && !seen.has(text)) {
            seen.add(text);
            conditions.push(text);
        }
    };

    const formatEventType = (val) => {
        if (!val) return 'Normal';
        const lower = String(val).toLowerCase();
        if (lower === 'personal' || lower === 'normal') return 'Normal';
        if (lower === 'team') return 'Team';
        if (lower === 'round_robin') return 'Round Robin';
        if (lower === 'class') return 'Class';
        return val.charAt(0).toUpperCase() + val.slice(1);
    };

    const formatApptStatus = (val) => {
        return val || 'confirmed';
    };

    // 1. Process explicit filters configured in trigger settings
    filters.forEach(flt => {
        if (!flt || !flt.type || !flt.value) return;
        const val = flt.value;

        switch (flt.type) {
            case 'event_type_is':
                addCond(`Event type is "${formatEventType(val)}"`);
                break;
            case 'appointment_status_is':
                addCond(`Appointment status is "${formatApptStatus(val)}"`);
                break;
            case 'calendar_is': {
                const cal = (resources.calendars || []).find(c => String(c.id) === String(val));
                addCond(`In calendar "${cal ? cal.name : val}"`);
                break;
            }
            case 'assigned_user_is': {
                const user = (resources.agents || resources.users || []).find(u => String(u.id) === String(val));
                addCond(`Assigned staff is "${user ? user.name : val}"`);
                break;
            }
            case 'replied_to_workflow': {
                const wfList = resources.workflows || resources.subflows || [];
                const wf = wfList.find(w => String(w.id || w.uuid) === String(val));
                const lookback = flt.lookback && flt.lookback !== 'any' ? ` (within ${flt.lookback})` : '';
                addCond(`Replied to "${wf ? wf.name : `Workflow #${val}`}"${lookback}`);
                break;
            }
            case 'channel_is':
                addCond(`Channel is "${val}"`);
                break;
            case 'keywords_contain':
                addCond(`Message contains "${val}"`);
                break;
            case 'form_is': {
                const form = (resources.subscription_forms || []).find(f => f.slug === val || String(f.id) === String(val));
                addCond(`Form is "${form ? form.name : val}"`);
                break;
            }
            case 'form_is_not': {
                const form = (resources.subscription_forms || []).find(f => f.slug === val || String(f.id) === String(val));
                addCond(`Form is not "${form ? form.name : val}"`);
                break;
            }
            case 'tag_is':
                addCond(`Tag is "${val}"`);
                break;
            case 'tag_is_not':
                addCond(`Tag is not "${val}"`);
                break;
            case 'pipeline_is': {
                const pipe = (resources.pipelines || []).find(p => String(p.id) === String(val));
                addCond(`Pipeline is "${pipe ? pipe.name : val}"`);
                break;
            }
            case 'stage_is': {
                const stage = (resources.pipelines || []).flatMap(p => p.stages || []).find(s => String(s.id) === String(val));
                addCond(`Stage is "${stage ? stage.name : val}"`);
                break;
            }
            case 'from_stage_is': {
                const stage = (resources.pipelines || []).flatMap(p => p.stages || []).find(s => String(s.id) === String(val));
                addCond(`Previous stage was "${stage ? stage.name : val}"`);
                break;
            }
            case 'change_source_is': {
                const sourceLabel = val === 'manual' ? 'Manual move (Kanban)' : (val === 'automation' ? 'Workflow / Automation' : 'Any source');
                addCond(`Trigger source is "${sourceLabel}"`);
                break;
            }
            case 'status_is':
                addCond(`Opportunity status is "${val}"`);
                break;
            case 'source_is':
                addCond(`Lead source is "${val}"`);
                break;
            case 'funnel_is': {
                const fn = (resources.funnels || []).find(f => String(f.id) === String(val));
                addCond(`Funnel is "${fn ? fn.name : val}"`);
                break;
            }
            case 'funnel_step_is': {
                const st = (resources.funnels || []).flatMap(f => f.steps || []).find(s => String(s.id) === String(val));
                addCond(`Funnel step is "${st ? st.name : val}"`);
                break;
            }
            case 'variant_is':
                if (val !== 'all') addCond(`Variant is "${val}"`);
                break;
            case 'order_bump_is':
                if (val !== 'all') addCond(`Order bump is "${val === 'yes' ? 'Purchased' : 'Not Purchased'}"`);
                break;
            case 'store_is':
                addCond(`Store is "${val}"`);
                break;
            default:
                addCond(`${flt.type} is "${val}"`);
                break;
        }
    });

    // 2. Also check direct config fields if not already captured
    if (config.event_type) {
        addCond(`Event type is "${formatEventType(config.event_type)}"`);
    }
    if (config.appointment_status) {
        addCond(`Appointment status is "${formatApptStatus(config.appointment_status)}"`);
    }
    if (config.calendar_id) {
        const cal = (resources.calendars || []).find(c => String(c.id) === String(config.calendar_id));
        addCond(`In calendar "${cal ? cal.name : config.calendar_id}"`);
    }
    if (config.assigned_user_id) {
        const user = (resources.agents || resources.users || []).find(u => String(u.id) === String(config.assigned_user_id));
        addCond(`Assigned staff is "${user ? user.name : config.assigned_user_id}"`);
    }
    if (config.enroll_audience && config.enroll_audience !== 'contact') {
        const audMap = {
            both: 'The contact and their guests',
            guests: "Only the contact's guests",
        };
        addCond(`Audience is "${audMap[config.enroll_audience] || config.enroll_audience}"`);
    }
    if (config.form_slug || config.form_id) {
        const form = (resources.subscription_forms || []).find(f => f.slug === config.form_slug || String(f.id) === String(config.form_id));
        addCond(`Form is "${form ? form.name : (config.form_slug || config.form_id)}"`);
    }
    if (config.tag_name) {
        addCond(`Tag is "${config.tag_name}"`);
    }
    if (config.source) {
        addCond(`Source is "${config.source}"`);
    }
    if (config.channel) {
        addCond(`Channel is "${config.channel}"`);
    }
    if (config.funnel_id) {
        const fn = (resources.funnels || []).find(f => String(f.id) === String(config.funnel_id));
        addCond(`Funnel is "${fn ? fn.name : config.funnel_id}"`);
    }
    if (config.funnel_step_id) {
        const st = (resources.funnels || []).flatMap(f => f.steps || []).find(s => String(s.id) === String(config.funnel_step_id));
        addCond(`Funnel step is "${st ? st.name : config.funnel_step_id}"`);
    }
    if (config.variant && config.variant !== 'all') {
        addCond(`Variant is "${config.variant}"`);
    }
    if (config.order_bump && config.order_bump !== 'all') {
        addCond(`Order bump is "${config.order_bump === 'yes' ? 'Purchased' : 'Not Purchased'}"`);
    }
    if (config.trigger_link_id) {
        const tl = (resources.trigger_links || []).find(t => String(t.id) === String(config.trigger_link_id));
        addCond(`Trigger link is "${tl ? tl.name : `#${config.trigger_link_id}`}"`);
    }
    if (config.from_stage_id) {
        const stage = (resources.pipelines || []).flatMap(p => p.stages || []).find(s => String(s.id) === String(config.from_stage_id));
        addCond(`Previous stage was "${stage ? stage.name : config.from_stage_id}"`);
    }
    if (config.change_source && config.change_source !== 'any') {
        const sourceLabel = config.change_source === 'manual' ? 'Manual move (Kanban)' : 'Workflow / Automation';
        addCond(`Trigger source is "${sourceLabel}"`);
    }
    if (config.cancel_previous_stage_runs) {
        addCond(`Cancels waiting workflows from prior stage`);
    }

    return conditions;
}

function TriggerNode({ id, data, selected }) {
    const { t } = useTranslation();
    const resources = useResources();
    const trigger = TRIGGER_TYPES.find(tr => tr.value === data.triggerType);
    const accent = '#10b981';
    const summary = getTriggerSummary(data, resources);
    const conditions = getTriggerConditions(data, resources);
    const title = data.triggerName || (data.label && data.label !== 'Trigger' ? data.label : (trigger ? t(trigger.labelKey) : 'Workflow Trigger'));
    const isFormTrigger = data.triggerType === 'form.submitted';

    return (
        <div style={{
            position: 'relative',
            background: '#fff',
            border: `1px solid ${selected ? '#6366f1' : '#e5e7eb'}`,
            borderRadius: 14,
            minWidth: 240,
            maxWidth: 320,
            boxShadow: selected ? `0 0 0 3px #6366f11f, 0 8px 24px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.05)',
            transition: 'box-shadow 0.15s, border-color 0.15s',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px' }}>
                <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: isFormTrigger ? '#ecfdf5' : '#eef2ff',
                    color: isFormTrigger ? '#10b981' : '#6366f1',
                }}>
                    {isFormTrigger ? <FileText size={16} /> : (trigger?.Icon ? <trigger.Icon size={16} /> : <Zap size={16} />)}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                    </div>
                    {summary && conditions.length === 0 && (
                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {summary}
                        </div>
                    )}
                </div>

                <div className="nodrag" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <NodeActionMenu id={id} data={data} isTrigger={true} />
                </div>
            </div>

            {/* Render all conditions directly on the node */}
            {conditions.length > 0 && (
                <div style={{
                    padding: '8px 12px 10px',
                    borderTop: '1px solid #f1f5f9',
                    background: '#fafbfc',
                    borderBottomLeftRadius: 13,
                    borderBottomRightRadius: 13,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3.5,
                }}>
                    {conditions.map((cond, idx) => (
                        <div
                            key={idx}
                            style={{
                                fontSize: 11,
                                color: '#334155',
                                lineHeight: 1.4,
                                fontWeight: 500,
                                wordBreak: 'break-word',
                            }}
                        >
                            {cond}
                        </div>
                    ))}
                </div>
            )}

            <Handle type="source" position={Position.Right} style={{ background: '#fff', width: 9, height: 9, border: '2px solid #6366f1' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#fff', width: 9, height: 9, border: '2px solid #6366f1' }} />
        </div>
    );
}

function clip(str, n = 40) {
    if (!str) return '';
    return str.length > n ? str.slice(0, n) + '…' : str;
}

function summarizeConfig(data, t) {
    const { nodeType } = data;
    switch (nodeType) {
        case 'wait': {
            const wt = data.wait_type || 'delay';
            if (wt === 'event_relative') {
                const days = parseInt(data.offset_days, 10) || 0;
                const hrs = parseInt(data.offset_hours, 10) || 0;
                const mins = parseInt(data.offset_minutes, 10) || 0;
                let dur = '';
                if (days > 0) dur += `${days}d `;
                if (hrs > 0) dur += `${hrs}h `;
                if (mins > 0 && days === 0) dur += `${mins}m `;
                if (!dur) dur = data.amount ? `${data.amount} ${data.unit ?? 'hours'} ` : '';

                const timing = data.event_timing === 'at_time' ? 'At appointment' : `${dur.trim()} ${data.event_timing || 'before'} appointment`;
                const past = data.past_action === 'skip_outbound' ? ' • Skip past' : (data.past_action === 'exit' ? ' • Exit if past' : '');
                return `${timing}${past}`;
            }
            if (wt === 'invoice_due_date') {
                return `Invoice due date (${data.event_timing || 'before'})`;
            }
            if (wt === 'contact_reply') {
                return `Wait for reply (${data.channel || 'All'} · max ${data.timeout_amount || 24}${data.timeout_unit ? data.timeout_unit[0] : 'h'})`;
            }
            if (wt === 'user_reply') {
                return `SLA: Staff reply (max ${data.timeout_amount || 15}m)`;
            }
            if (wt === 'contact_action') {
                return 'Wait for link/email action';
            }
            if (wt === 'conditions_met') {
                return 'Wait for conditions';
            }
            const base = data.amount ? `${data.amount} ${data.unit ?? 'minutes'}` : 'Wait delay';
            const win = data.advance_window_enabled ? ' • Business hrs' : '';
            return `${base}${win}`;
        }
        case 'wait_for_reply': {
            const amt = data.timeout_amount ?? data.amount ?? 24;
            const unit = data.timeout_unit ?? data.unit ?? 'hours';
            return `Wait max ${amt} ${unit}`;
        }
        case 'condition': return data.field ? `${data.field} ${data.operator ?? '='} ${data.value ?? ''}` : '';
        case 'add_tag':
        case 'remove_tag': return data.tag ?? '';
        case 'create_opportunity': return data.name ? clip(data.name, 28) : 'Create Opportunity';
        case 'change_opportunity_stage': return data.stage_id ? `Stage #${data.stage_id}` : 'Change Stage';
        case 'send_whatsapp':
        case 'send_sms': return clip(data.body);
        case 'send_email': return data.subject ?? '';
        case 'internal_notification': return `${data.notification_type ?? 'email'} → ${data.send_to ?? 'user'}`;
        case 'update_contact': return data.field ? `${data.field} = ${data.value ?? ''}` : '';
        case 'assign_agent': return data.agent_name ?? (data.user_id ? `#${data.user_id}` : t('automation.assign_unassigned'));
        case 'add_to_campaign': return data.campaign_id ? t('automation.campaign_ref', { id: data.campaign_id }) : '';
        case 'ai_reply':
        case 'run_chatbot': return clip(data.prompt || data.chatbot_id || '');
        case 'webhook': return data.url ? `${data.method ?? 'POST'} ${clip(data.url, 28)}` : '';
        case 'send_template': return data.template_name ?? '';
        case 'send_media': return data.link ? `${data.media_type ?? 'image'} · ${clip(data.link, 24)}` : (data.media_type ?? '');
        case 'send_sequence': return Array.isArray(data.steps) && data.steps.length ? t('automation.seq_steps', { count: data.steps.length }) : '';
        case 'quick_replies': return clip(data.body, 30);
        case 'list_message': return clip(data.body, 30);
        case 'ask_question': return data.question ? `${clip(data.question, 28)} → {{${data.variable || 'answer'}}}` : '';
        case 'run_subflow': {
            const name = data.subflow_name ?? data.automation_uuid ?? '';
            const mode = data.mode === 'wait_completion' ? 'Wait' : data.mode === 'handoff' ? 'Handoff' : 'Async';
            return name ? `${name} (${mode})` : '';
        }
        case 'cta_button': return data.display_text ? `${data.display_text} · ${clip(data.url, 22)}` : clip(data.url, 28);
        case 'send_location': return data.name || (data.latitude ? `${data.latitude}, ${data.longitude}` : '');
        case 'send_poll': return clip(data.question, 30);
        case 'book_appointment':
        case 'google_meet': return data.start ? `${clip(data.summary, 18)} · ${data.start}` : clip(data.summary, 24);
        case 'whatsapp_form': return data.flow_id ? `flow ${data.flow_id}` : '';
        case 'whatsapp_catalog': return clip(data.body, 30);
        case 'woocommerce_product':
        case 'shopify_product': return data.product_id ? `#${data.product_id}` : '';
        case 'google_sheets': return data.spreadsheet_id ? `${data.mode ?? 'append'} · ${clip(data.range, 18)}` : '';
        case 'google_docs': return clip(data.title, 28);
        case 'google_forms': return data.form_id ? `${data.mode === 'read_response' ? 'read' : 'share'} · ${clip(data.form_id, 18)}` : '';
        case 'remove_from_workflow': {
            const target = data.target_type ?? 'current';
            if (target === 'current') return 'Current workflow';
            if (target === 'another' || target === 'specific') {
                return data.target_automation_name ? `Workflow: ${data.target_automation_name}` : 'Another workflow';
            }
            if (target === 'all_except_current') return 'All workflows except current workflow';
            if (target === 'all') return 'All workflows';
            return 'Remove from Workflow';
        }
        default: return '';
    }
}

const nodeTypes = {
    automationNode: BaseNode,
    triggerNode: TriggerNode,
};

/* ─── Config Panel ───────────────────────────────────────────── */
const FIELD_COMPONENTS = {
    send_whatsapp: WhatsAppFields,
    send_sms: SmsFields,
    send_email: EmailFields,
    internal_notification: InternalNotificationFields,
    send_template: TemplateFields,
    send_media: MediaFields,
    send_sequence: SequenceFields,
    quick_replies: QuickRepliesFields,
    list_message: ListMessageFields,
    ask_question: AskQuestionFields,
    wait: WaitFields,
    wait_for_reply: WaitForReplyFields,
    condition: ConditionFields,
    webhook: WebhookFields,
    run_subflow: SubflowFields,
    remove_from_workflow: RemoveFromWorkflowFields,
    ai_reply: AIReplyFields,
    add_tag: TagFields,
    remove_tag: TagFields,
    update_contact: UpdateContactFields,
    assign_agent: AssignAgentFields,
    add_to_campaign: CampaignFields,
    create_opportunity: CreateOpportunityFields,
    change_opportunity_stage: ChangeStageFields,
    update_opportunity_status: UpdateOpportunityStatusFields,
    remove_opportunity: () => <p style={{ fontSize: 11, color: '#64748b', padding: 8 }}>Removes active opportunity record(s) linked to this contact.</p>,
    cta_button: CtaButtonFields,
    send_location: LocationFields,
    send_poll: PollFields,
    run_chatbot: RunChatbotFields,
    book_appointment: BookAppointmentFields,
    google_meet: GoogleMeetFields,
    whatsapp_form: WhatsappFormFields,
    whatsapp_catalog: WhatsappCatalogFields,
    woocommerce_product: (p) => <ProductFields {...p} platform="woocommerce" />,
    shopify_product: (p) => <ProductFields {...p} platform="shopify" />,
    google_sheets: GoogleSheetsFields,
    google_docs: GoogleDocsFields,
    google_forms: GoogleFormsFields,
};

function ConfigPanel({ node, onClose, onSave, onDelete }) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState(node?.data || {});

    useEffect(() => {
        setDraft(node?.data || {});
    }, [node?.id]);

    if (!node) return null;
    const { nodeType } = node.data;
    const def = NODE_DEFS[nodeType];
    const defLabel = def ? t(def.labelKey) : nodeType;

    const set = (key, val) => {
        if (typeof key === 'object' && key !== null) {
            setDraft(prev => ({ ...prev, ...key, configured: true }));
        } else {
            setDraft(prev => ({ ...prev, [key]: val, configured: true }));
        }
    };

    const handleSave = () => {
        if (onSave) onSave(node.id, draft);
        onClose();
    };

    const isEmailEditorNode = nodeType === 'send_email' || (nodeType === 'internal_notification' && draft.notification_type === 'email');
    const panelWidth = isEmailEditorNode ? 720 : (nodeType === 'condition' ? 620 : 420);
    const Fields = FIELD_COMPONENTS[nodeType];
    const { triggerNodes = [], triggerType: contextTriggerType } = useContext(NodeActionsContext);
    const triggerType = contextTriggerType || triggerNodes[0]?.data?.triggerType || triggerNodes[0]?.data?.trigger_type || 'contact';

    return (
        <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: panelWidth,
            background: '#fff', borderLeft: '1px solid #e5e7eb',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
            zIndex: 10, display: 'flex', flexDirection: 'column',
            borderRadius: '0 0 12px 0',
            transition: 'width 0.2s ease-in-out',
        }}>
            {/* Header */}
            <div style={{
                background: def?.color ?? '#6366f1', padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fff' }}><NodeIcon nodeType={nodeType} size={15} /></span>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{defLabel}</span>
                </div>
                <button onClick={onClose} style={{ color: '#ffffff99', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                    <X size={16} />
                </button>
            </div>

            {/* Fields */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 80 }} className="space-y-4">
                {/* Action Name for all nodes */}
                <Field label="Action Name">
                    <input className={inputCls} value={draft.label ?? ''} onChange={e => set('label', e.target.value)} placeholder={defLabel} />
                </Field>

                {/* Per-type fields */}
                {Fields && <Fields d={draft} set={set} triggerType={triggerType} />}
            </div>

            {/* Sticky Footer: Cancel, Delete & Save */}
            <div style={{
                padding: '12px 16px', borderTop: '1px solid #e5e7eb', background: '#fafafa',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 12,
            }}>
                {onDelete ? (
                    <button
                        type="button"
                        onClick={() => onDelete(node.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                            borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2',
                            color: '#dc2626', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        <Trash2 size={13} /> {t('common.delete')}
                    </button>
                ) : <div />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                            background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 18px', borderRadius: 8, border: 'none',
                            background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', boxShadow: '0 1px 3px rgba(99,102,241,0.3)',
                        }}
                    >
                        <Save size={13} /> Save Action
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";
const textareaCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none";
const selectCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";
const labelCls = "block text-xs font-semibold text-gray-600 mb-1";

function Field({ label, children }) {
    return <div><label className={labelCls}>{label}</label>{children}</div>;
}

/* ─── Trigger-Scoped Filter Configuration ────────────────────────── */
const ALL_FILTER_OPTIONS = [
    { value: 'calendar_is',          label: 'In Calendar',              category: 'appointment' },
    { value: 'appointment_status_is',label: 'Appointment Status is',    category: 'appointment' },
    { value: 'event_type_is',        label: 'Event Type is',            category: 'appointment' },
    { value: 'assigned_user_is',     label: 'Assigned Staff is',        category: 'appointment' },
    { value: 'replied_to_workflow', label: 'Replied to Workflow',      category: 'message' },
    { value: 'channel_is',          label: 'Channel is',               category: 'message' },
    { value: 'keywords_contain',    label: 'Message Contains Phrase',  category: 'message' },
    { value: 'form_is',             label: 'Form is',                  category: 'form' },
    { value: 'form_is_not',         label: 'Form is not',              category: 'form' },
    { value: 'funnel_is',           label: 'Funnel is',                category: 'funnel' },
    { value: 'funnel_step_is',      label: 'Funnel Step is',           category: 'funnel' },
    { value: 'variant_is',          label: 'Variant is',               category: 'funnel' },
    { value: 'order_bump_is',       label: 'Order Bump is',            category: 'funnel' },
    { value: 'pipeline_is',         label: 'Pipeline is',              category: 'opportunity' },
    { value: 'stage_is',            label: 'Stage is',                 category: 'opportunity' },
    { value: 'from_stage_is',        label: 'Previous Stage is',        category: 'opportunity' },
    { value: 'change_source_is',     label: 'Change Source is',         category: 'opportunity' },
    { value: 'status_is',           label: 'Opportunity Status is',    category: 'opportunity' },
    { value: 'store_is',            label: 'Store is',                 category: 'commerce' },
    { value: 'source_is',           label: 'Lead Source is',           category: 'contact' },
    { value: 'tag_is',              label: 'Contact Tag is',           category: 'contact' },
    { value: 'tag_is_not',          label: 'Contact Tag is not',       category: 'contact' },
];

function getAllowedFilterTypes(triggerType) {
    if (!triggerType) return ['tag_is', 'tag_is_not'];

    // 0. Appointment Triggers
    if (triggerType.startsWith('appointment.')) {
        return ['calendar_is', 'appointment_status_is', 'event_type_is', 'assigned_user_is', 'tag_is', 'tag_is_not'];
    }

    // 1. Customer Replied & Message Received
    if (triggerType === 'customer.replied' || triggerType === 'message.received') {
        return ['replied_to_workflow', 'channel_is', 'keywords_contain', 'tag_is', 'tag_is_not', 'source_is'];
    }

    // 2. Subscription / Lead Form Submitted
    if (triggerType === 'form.submitted') {
        return ['form_is', 'form_is_not', 'tag_is', 'tag_is_not', 'source_is'];
    }

    // 3. Opportunities & Pipelines
    if (['opportunity.created', 'opportunity.stage_changed', 'opportunity.status_changed', 'opportunity.won', 'opportunity.lost', 'opportunity.abandoned'].includes(triggerType)) {
        if (triggerType === 'opportunity.stage_changed') {
            return ['pipeline_is', 'stage_is', 'from_stage_is', 'change_source_is', 'tag_is', 'tag_is_not'];
        }
        if (triggerType === 'opportunity.status_changed') {
            return ['pipeline_is', 'stage_is', 'status_is', 'change_source_is', 'tag_is', 'tag_is_not'];
        }
        return ['pipeline_is', 'stage_is', 'change_source_is', 'tag_is', 'tag_is_not'];
    }

    // 4. Funnels
    if (triggerType.startsWith('funnel.')) {
        const list = ['funnel_is', 'funnel_step_is', 'variant_is', 'tag_is', 'tag_is_not'];
        if (triggerType === 'funnel.order_completed' || triggerType === 'funnel.order_bump_purchased') {
            list.push('order_bump_is');
        }
        return list;
    }

    // 5. Commerce Events
    if (['order.placed', 'cart.abandoned', 'order.fulfilled', 'order.cancelled', 'customer.created'].includes(triggerType)) {
        return ['store_is', 'tag_is', 'tag_is_not'];
    }

    // 6. Contact Creation / Tag
    if (triggerType === 'contact.created') {
        return ['source_is', 'tag_is', 'tag_is_not'];
    }
    if (triggerType === 'contact.tag_added') {
        return ['tag_is', 'source_is'];
    }

    // Default fallback
    return ['tag_is', 'tag_is_not', 'source_is'];
}

function getDefaultFilterType(triggerType) {
    if (triggerType?.startsWith('appointment.')) return 'calendar_is';
    if (triggerType === 'customer.replied') return 'replied_to_workflow';
    if (triggerType === 'message.received') return 'channel_is';
    if (triggerType === 'form.submitted') return 'form_is';
    if (triggerType === 'opportunity.status_changed') return 'status_is';
    if (triggerType?.startsWith('opportunity.')) return 'pipeline_is';
    if (triggerType?.startsWith('funnel.')) return 'funnel_is';
    if (['order.placed', 'cart.abandoned', 'order.fulfilled', 'order.cancelled'].includes(triggerType)) return 'store_is';
    if (triggerType === 'contact.created') return 'source_is';
    return 'tag_is';
}

function renderTriggerNaturalSummary(triggerType, filters, stopOnResponse, resources = {}) {
    const triggerObj = TRIGGER_TYPES.find(tr => tr.value === triggerType);
    const triggerTitle = triggerObj ? (triggerObj.labelKey ? triggerObj.labelKey : triggerType) : (triggerType || 'Workflow Trigger');

    const parts = [];
    (filters || []).forEach(flt => {
        if (!flt.value) return;
        if (flt.type === 'calendar_is') {
            const cal = (resources.calendars || []).find(c => String(c.id) === String(flt.value));
            parts.push(`Calendar: "${cal ? cal.name : flt.value}"`);
        } else if (flt.type === 'appointment_status_is') {
            parts.push(`Status: ${flt.value}`);
        } else if (flt.type === 'event_type_is') {
            parts.push(`Event Type: ${flt.value}`);
        } else if (flt.type === 'assigned_user_is') {
            const user = (resources.agents || []).find(u => String(u.id) === String(flt.value));
            parts.push(`Staff: "${user ? user.name : flt.value}"`);
        } else if (flt.type === 'replied_to_workflow') {
            const wfList = resources.workflows || resources.subflows || [];
            const wf = wfList.find(w => String(w.id || w.uuid) === String(flt.value));
            const lookbackText = flt.lookback && flt.lookback !== 'any' ? ` (within ${flt.lookback})` : '';
            parts.push(`Replied to: "${wf ? wf.name : `Workflow #${flt.value}`}"${lookbackText}`);
        } else if (flt.type === 'channel_is') {
            parts.push(`Channel: ${flt.value}`);
        } else if (flt.type === 'keywords_contain') {
            parts.push(`Phrase: "${flt.value}"`);
        } else if (flt.type === 'form_is') {
            const form = (resources.subscription_forms || []).find(f => f.slug === flt.value || f.id === flt.value);
            parts.push(`Form: ${form ? form.name : flt.value}`);
        } else if (flt.type === 'form_is_not') {
            const form = (resources.subscription_forms || []).find(f => f.slug === flt.value || f.id === flt.value);
            parts.push(`Form != ${form ? form.name : flt.value}`);
        } else if (flt.type === 'pipeline_is') {
            const pipe = (resources.pipelines || []).find(p => String(p.id) === String(flt.value));
            parts.push(`Pipeline: ${pipe ? pipe.name : flt.value}`);
        } else if (flt.type === 'stage_is') {
            const stage = (resources.pipelines || []).flatMap(p => p.stages || []).find(s => String(s.id) === String(flt.value));
            parts.push(`Stage: ${stage ? stage.name : flt.value}`);
        } else if (flt.type === 'from_stage_is') {
            const stage = (resources.pipelines || []).flatMap(p => p.stages || []).find(s => String(s.id) === String(flt.value));
            parts.push(`From: ${stage ? stage.name : flt.value}`);
        } else if (flt.type === 'change_source_is') {
            const sourceLabel = flt.value === 'manual' ? 'Manual Move' : (flt.value === 'automation' ? 'Automation' : 'All Sources');
            parts.push(`Source: ${sourceLabel}`);
        } else if (flt.type === 'status_is') {
            parts.push(`Status: ${flt.value}`);
        } else if (flt.type === 'tag_is') {
            parts.push(`Tag: ${flt.value}`);
        } else if (flt.type === 'tag_is_not') {
            parts.push(`Tag != ${flt.value}`);
        } else if (flt.type === 'source_is') {
            parts.push(`Source: ${flt.value}`);
        } else if (flt.type === 'funnel_is') {
            const fn = (resources.funnels || []).find(f => String(f.id) === String(flt.value));
            parts.push(`Funnel: ${fn ? fn.name : flt.value}`);
        }
    });

    let summaryText = `Fires on ${triggerTitle}`;
    if (parts.length > 0) {
        summaryText += ` where ${parts.join(' • ')}`;
    }
    if (stopOnResponse) {
        summaryText += ` [Safeguard: Drip stops on reply]`;
    }
    return summaryText;
}

/* ─── Trigger Config Panel (GHL Style) ─────────────────────────── */
function TriggerConfigPanel({ node, automation, onSave, webhookUrl, copied, onCopy, onGenerateToken, generatingToken, onClose }) {
    const { t } = useTranslation();
    const resources = useResources();
    const triggerData = node?.data || {};
    const initialType = triggerData.triggerType || automation?.trigger_type || 'form.submitted';
    const initialConfig = triggerData.triggerConfig || automation?.trigger_config || {};
    const initialName = triggerData.triggerName || (triggerData.label && triggerData.label !== 'Trigger' ? triggerData.label : (
        TRIGGER_TYPES.find(tr => tr.value === initialType)?.labelKey ? t(TRIGGER_TYPES.find(tr => tr.value === initialType).labelKey) : 'Workflow Trigger'
    ));

    const [triggerType, setTriggerType] = useState(initialType);
    const [triggerName, setTriggerName] = useState(initialName);
    const [stopOnResponse, setStopOnResponse] = useState(Boolean(initialConfig.stop_on_response));
    const [cancelPreviousStageRuns, setCancelPreviousStageRuns] = useState(Boolean(initialConfig.cancel_previous_stage_runs));
    const [reEntryPolicy, setReEntryPolicy] = useState(initialConfig.re_entry_policy || 'always');
    const [cooldownAmount, setCooldownAmount] = useState(initialConfig.cooldown_amount || 24);
    const [cooldownUnit, setCooldownUnit] = useState(initialConfig.cooldown_unit || 'hours');
    const [preventParallelRuns, setPreventParallelRuns] = useState(initialConfig.prevent_parallel_runs !== false);
    const [enrollAudience, setEnrollAudience] = useState(initialConfig.enroll_audience || 'contact');
    const [funnelId, setFunnelId] = useState(initialConfig.funnel_id || '');
    const [funnelStepId, setFunnelStepId] = useState(initialConfig.funnel_step_id || '');
    const [variant, setVariant] = useState(initialConfig.variant || 'all');
    const [orderBump, setOrderBump] = useState(initialConfig.order_bump || 'all');
    const [triggerLinkId, setTriggerLinkId] = useState(initialConfig.trigger_link_id || '');
    const [triggerLinks, setTriggerLinks] = useState([]);

    useEffect(() => {
        if (triggerType === 'trigger_link.clicked') {
            axios.get('/app/trigger-links/list')
                .then(res => {
                    if (Array.isArray(res.data)) setTriggerLinks(res.data);
                })
                .catch(() => {});
        }
    }, [triggerType]);
    const [filters, setFilters] = useState(() => {
        const allowed = getAllowedFilterTypes(initialType);
        if (Array.isArray(initialConfig.filters) && initialConfig.filters.length > 0) {
            const valid = initialConfig.filters.filter(f => allowed.includes(f.type));
            if (valid.length > 0) return valid;
        }
        const initial = [];
        if (initialConfig.calendar_id && allowed.includes('calendar_is')) initial.push({ type: 'calendar_is', value: initialConfig.calendar_id });
        if (initialConfig.appointment_status && allowed.includes('appointment_status_is')) initial.push({ type: 'appointment_status_is', value: initialConfig.appointment_status });
        if (initialConfig.event_type && allowed.includes('event_type_is')) initial.push({ type: 'event_type_is', value: initialConfig.event_type });
        if (initialConfig.assigned_user_id && allowed.includes('assigned_user_is')) initial.push({ type: 'assigned_user_is', value: initialConfig.assigned_user_id });
        if (initialConfig.replied_to_workflow_id && allowed.includes('replied_to_workflow')) {
            initial.push({ type: 'replied_to_workflow', value: initialConfig.replied_to_workflow_id, lookback: initialConfig.replied_lookback || 'any' });
        }
        if (initialConfig.funnel_id && allowed.includes('funnel_is')) initial.push({ type: 'funnel_is', value: initialConfig.funnel_id });
        if (initialConfig.funnel_step_id && allowed.includes('funnel_step_is')) initial.push({ type: 'funnel_step_is', value: initialConfig.funnel_step_id });
        if (initialConfig.form_slug && allowed.includes('form_is')) initial.push({ type: 'form_is', value: initialConfig.form_slug });
        if (initialConfig.tag_name && allowed.includes('tag_is')) initial.push({ type: 'tag_is', value: initialConfig.tag_name });
        if (initialConfig.pipeline_id && allowed.includes('pipeline_is')) initial.push({ type: 'pipeline_is', value: initialConfig.pipeline_id });
        if (initialConfig.stage_id && allowed.includes('stage_is')) initial.push({ type: 'stage_is', value: initialConfig.stage_id });
        if (initialConfig.from_stage_id && allowed.includes('from_stage_is')) initial.push({ type: 'from_stage_is', value: initialConfig.from_stage_id });
        if (initialConfig.change_source && allowed.includes('change_source_is')) initial.push({ type: 'change_source_is', value: initialConfig.change_source });
        if (initialConfig.status && allowed.includes('status_is')) initial.push({ type: 'status_is', value: initialConfig.status });
        if (initialConfig.channel && allowed.includes('channel_is')) initial.push({ type: 'channel_is', value: initialConfig.channel });
        if (initialConfig.keywords && allowed.includes('keywords_contain')) {
            const kw = Array.isArray(initialConfig.keywords) ? initialConfig.keywords.join(', ') : initialConfig.keywords;
            initial.push({ type: 'keywords_contain', value: kw });
        }
        if (initialConfig.source && allowed.includes('source_is')) initial.push({ type: 'source_is', value: initialConfig.source });
        if (initialConfig.store_id && allowed.includes('store_is')) initial.push({ type: 'store_id', value: initialConfig.store_id });
        return initial.length > 0 ? initial : [{ type: getDefaultFilterType(initialType), value: '' }];
    });

    useEffect(() => {
        const td = node?.data || {};
        const tType = td.triggerType || automation?.trigger_type || 'form.submitted';
        const tConfig = td.triggerConfig || automation?.trigger_config || {};
        const tName = td.triggerName || (td.label && td.label !== 'Trigger' ? td.label : (
            TRIGGER_TYPES.find(tr => tr.value === tType)?.labelKey ? t(TRIGGER_TYPES.find(tr => tr.value === tType).labelKey) : 'Workflow Trigger'
        ));
        setTriggerType(tType);
        setTriggerName(tName);
        setStopOnResponse(Boolean(tConfig.stop_on_response));
        setCancelPreviousStageRuns(Boolean(tConfig.cancel_previous_stage_runs));
        setReEntryPolicy(tConfig.re_entry_policy || 'always');
        setCooldownAmount(tConfig.cooldown_amount || 24);
        setCooldownUnit(tConfig.cooldown_unit || 'hours');
        setPreventParallelRuns(tConfig.prevent_parallel_runs !== false);
        setEnrollAudience(tConfig.enroll_audience || 'contact');
        setFunnelId(tConfig.funnel_id || '');
        setFunnelStepId(tConfig.funnel_step_id || '');
        setVariant(tConfig.variant || 'all');
        setOrderBump(tConfig.order_bump || 'all');
        setTriggerLinkId(tConfig.trigger_link_id || '');

        const allowed = getAllowedFilterTypes(tType);
        let nextFilters = [];
        if (Array.isArray(tConfig.filters) && tConfig.filters.length > 0) {
            nextFilters = tConfig.filters.filter(f => allowed.includes(f.type));
        }
        if (nextFilters.length === 0) {
            const initial = [];
            if (tConfig.calendar_id && allowed.includes('calendar_is')) initial.push({ type: 'calendar_is', value: tConfig.calendar_id });
            if (tConfig.appointment_status && allowed.includes('appointment_status_is')) initial.push({ type: 'appointment_status_is', value: tConfig.appointment_status });
            if (tConfig.event_type && allowed.includes('event_type_is')) initial.push({ type: 'event_type_is', value: tConfig.event_type });
            if (tConfig.assigned_user_id && allowed.includes('assigned_user_is')) initial.push({ type: 'assigned_user_id', value: tConfig.assigned_user_id });
            if (tConfig.replied_to_workflow_id && allowed.includes('replied_to_workflow')) {
                initial.push({ type: 'replied_to_workflow', value: tConfig.replied_to_workflow_id, lookback: tConfig.replied_lookback || 'any' });
            }
            if (tConfig.funnel_id && allowed.includes('funnel_is')) initial.push({ type: 'funnel_is', value: tConfig.funnel_id });
            if (tConfig.funnel_step_id && allowed.includes('funnel_step_is')) initial.push({ type: 'funnel_step_id', value: tConfig.funnel_step_id });
            if (tConfig.form_slug && allowed.includes('form_is')) initial.push({ type: 'form_is', value: tConfig.form_slug });
            if (tConfig.tag_name && allowed.includes('tag_is')) initial.push({ type: 'tag_is', value: tConfig.tag_name });
            if (tConfig.pipeline_id && allowed.includes('pipeline_is')) initial.push({ type: 'pipeline_is', value: tConfig.pipeline_id });
            if (tConfig.stage_id && allowed.includes('stage_is')) initial.push({ type: 'stage_is', value: tConfig.stage_id });
            if (tConfig.from_stage_id && allowed.includes('from_stage_is')) initial.push({ type: 'from_stage_is', value: tConfig.from_stage_id });
            if (tConfig.change_source && allowed.includes('change_source_is')) initial.push({ type: 'change_source_is', value: tConfig.change_source });
            if (tConfig.status && allowed.includes('status_is')) initial.push({ type: 'status_is', value: tConfig.status });
            if (tConfig.channel && allowed.includes('channel_is')) initial.push({ type: 'channel_is', value: tConfig.channel });
            if (tConfig.keywords && allowed.includes('keywords_contain')) {
                const kw = Array.isArray(tConfig.keywords) ? tConfig.keywords.join(', ') : tConfig.keywords;
                initial.push({ type: 'keywords_contain', value: kw });
            }
            if (tConfig.source && allowed.includes('source_is')) initial.push({ type: 'source_is', value: tConfig.source });
            if (tConfig.store_id && allowed.includes('store_is')) initial.push({ type: 'store_is', value: tConfig.store_id });
            nextFilters = initial.length > 0 ? initial : [{ type: getDefaultFilterType(tType), value: '' }];
        }
        setFilters(nextFilters);
    }, [node?.id]);

    const addFilter = () => {
        const allowed = getAllowedFilterTypes(triggerType);
        const unused = allowed.find(ft => !filters.some(f => f.type === ft)) || getDefaultFilterType(triggerType);
        setFilters(prev => [...prev, { type: unused, value: '', lookback: 'any' }]);
    };

    const removeFilter = (idx) => {
        setFilters(prev => prev.filter((_, i) => i !== idx));
    };

    const changeFilter = (idx, key, val) => {
        setFilters(prev => prev.map((f, i) => i === idx ? { ...f, [key]: val } : f));
    };

    const handleSave = () => {
        const patch = {
            filters,
            trigger_name: triggerName,
            stop_on_response: Boolean(stopOnResponse),
            cancel_previous_stage_runs: Boolean(cancelPreviousStageRuns),
            re_entry_policy: reEntryPolicy,
            cooldown_amount: parseInt(cooldownAmount, 10) || 24,
            cooldown_unit: cooldownUnit,
            prevent_parallel_runs: Boolean(preventParallelRuns),
            enroll_audience: enrollAudience,
            funnel_id: funnelId ? parseInt(funnelId, 10) : null,
            funnel_step_id: funnelStepId ? parseInt(funnelStepId, 10) : null,
            variant: variant || 'all',
            order_bump: orderBump || 'all',
            trigger_link_id: triggerLinkId ? parseInt(triggerLinkId, 10) : null,
        };
        filters.forEach(f => {
            if (f.type === 'calendar_is') patch.calendar_id = f.value ? parseInt(f.value, 10) : null;
            if (f.type === 'appointment_status_is') patch.appointment_status = f.value || null;
            if (f.type === 'event_type_is') patch.event_type = f.value || null;
            if (f.type === 'assigned_user_is') patch.assigned_user_id = f.value ? parseInt(f.value, 10) : null;
            if (f.type === 'replied_to_workflow') {
                patch.replied_to_workflow_id = f.value ? (isNaN(f.value) ? f.value : parseInt(f.value, 10)) : null;
                patch.replied_lookback = f.lookback || 'any';
            }
            if (f.type === 'funnel_is') patch.funnel_id = f.value ? parseInt(f.value, 10) : null;
            if (f.type === 'funnel_step_id') patch.funnel_step_id = f.value ? parseInt(f.value, 10) : null;
            if (f.type === 'variant_is') patch.variant = f.value || 'all';
            if (f.type === 'order_bump_is') patch.order_bump = f.value || 'all';
            if (f.type === 'form_is' || f.type === 'form_is_not') patch.form_slug = f.value || null;
            if (f.type === 'tag_is' || f.type === 'tag_is_not') patch.tag_name = f.value || null;
            if (f.type === 'pipeline_is') patch.pipeline_id = f.value ? parseInt(f.value, 10) : null;
            if (f.type === 'stage_is') patch.stage_id = f.value ? parseInt(f.value, 10) : null;
            if (f.type === 'from_stage_is') patch.from_stage_id = f.value ? parseInt(f.value, 10) : null;
            if (f.type === 'change_source_is') patch.change_source = f.value || 'any';
            if (f.type === 'status_is') patch.status = f.value || null;
            if (f.type === 'channel_is') patch.channel = f.value || null;
            if (f.type === 'keywords_contain') {
                patch.keywords = (f.value || '').split(',').map(s => s.trim()).filter(Boolean);
            }
            if (f.type === 'source_is') patch.source = f.value || null;
            if (f.type === 'store_is') patch.store_id = f.value ? parseInt(f.value, 10) : null;
        });

        if (onSave) {
            onSave({
                triggerType,
                triggerName,
                label: triggerName,
                triggerConfig: patch,
            });
        }
        onClose();
    };

    return (
        <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 440,
            background: '#fff', borderLeft: '1px solid #e5e7eb',
            boxShadow: '-4px 0 30px rgba(0,0,0,0.09)',
            zIndex: 20, display: 'flex', flexDirection: 'column',
            borderRadius: '0 0 12px 0',
        }}>
            {/* Top Bar Header (Matches Screenshot 3) */}
            <div style={{
                padding: '14px 18px', borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={onClose} style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                        <ArrowLeft size={16} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Configure Trigger</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        type="button"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                            borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff',
                            fontSize: 11, fontWeight: 600, color: '#2563eb', cursor: 'pointer',
                        }}
                    >
                        <Sparkles size={12} /> Learn More
                    </button>
                    <button onClick={onClose} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                        <X size={17} />
                    </button>
                </div>
            </div>

            {/* Subtitle intro */}
            <div style={{ padding: '12px 18px 0', fontSize: 11, color: '#64748b' }}>
                Adds a workflow trigger, and on execution, the Contact gets added to the workflow.
            </div>

            {/* Main Form Fields */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', paddingBottom: 80 }} className="space-y-5">
                {/* 1. Choose Workflow Trigger */}
                <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                        CHOOSE A WORKFLOW TRIGGER
                    </label>
                    <select
                        className={selectCls}
                        value={triggerType}
                        onChange={e => {
                            const newType = e.target.value;
                            setTriggerType(newType);
                            const matched = TRIGGER_TYPES.find(tr => tr.value === newType);
                            if (matched) {
                                setTriggerName(t(matched.labelKey));
                            }
                            const allowed = getAllowedFilterTypes(newType);
                            setFilters(prev => {
                                const valid = prev.filter(f => allowed.includes(f.type));
                                return valid.length > 0 ? valid : [{ type: getDefaultFilterType(newType), value: '' }];
                            });
                        }}
                        style={{ padding: '8px 12px', fontSize: 12, borderRadius: 8 }}
                    >
                        <option value="">{t('automation.select_trigger')}</option>
                        {TRIGGER_TYPES.map(tr => (
                            <option key={tr.value} value={tr.value}>{t(tr.labelKey)}</option>
                        ))}
                    </select>
                </div>

                {/* 2. Workflow Trigger Name */}
                <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                        WORKFLOW TRIGGER NAME
                    </label>
                    <input
                        className={inputCls}
                        value={triggerName}
                        onChange={e => setTriggerName(e.target.value)}
                        placeholder="e.g. Lead Capture Form Submitted"
                        style={{ padding: '8px 12px', fontSize: 12, borderRadius: 8 }}
                    />
                </div>

                {/* 2b-1. Audience Enrollment for Appointment Triggers (GHL Parity) */}
                {triggerType?.startsWith('appointment.') && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={13} className="text-emerald-600" />
                            Who should be enrolled in this workflow?
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                            {[
                                { value: 'contact', label: 'Only the contact' },
                                { value: 'both', label: 'The contact and their guests' },
                                { value: 'guests', label: "Only the contact's guests" },
                            ].map(opt => (
                                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#334155', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="enroll_audience"
                                        value={opt.value}
                                        checked={enrollAudience === opt.value}
                                        onChange={() => setEnrollAudience(opt.value)}
                                        style={{ accentColor: '#10b981', cursor: 'pointer' }}
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2b. Cascading Funnel Selector (When Funnel Trigger Selected) */}
                {triggerType.startsWith('funnel.') && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Filter size={13} className="text-brand-500" />
                            Funnel Trigger Scope & Targeting
                        </div>

                        {/* Funnel Selector */}
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                Select Funnel
                            </label>
                            <select
                                className={selectCls}
                                value={funnelId}
                                onChange={e => {
                                    setFunnelId(e.target.value);
                                    setFunnelStepId('');
                                }}
                                style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8 }}
                            >
                                <option value="">Any Funnel in Workspace</option>
                                {(resources.funnels ?? []).map(fn => (
                                    <option key={fn.id} value={fn.id}>{fn.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Cascading Step Selector */}
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                Select Funnel Step
                            </label>
                            <select
                                className={selectCls}
                                value={funnelStepId}
                                onChange={e => setFunnelStepId(e.target.value)}
                                style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8 }}
                            >
                                <option value="">Any Step in this Funnel</option>
                                {(() => {
                                    const matchedFunnel = (resources.funnels ?? []).find(fn => String(fn.id) === String(funnelId));
                                    const stepList = matchedFunnel ? (matchedFunnel.steps ?? []) : (resources.funnels ?? []).flatMap(fn => fn.steps ?? []);
                                    return stepList.map(st => (
                                        <option key={st.id} value={st.id}>
                                            {matchedFunnel ? st.name : `${st.name}`} ({st.type})
                                        </option>
                                    ));
                                })()}
                            </select>
                        </div>

                        {/* Split Test Variant */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                    A/B Variant
                                </label>
                                <select
                                    className={selectCls}
                                    value={variant}
                                    onChange={e => setVariant(e.target.value)}
                                    style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8 }}
                                >
                                    <option value="all">All Variants</option>
                                    <option value="A">Variant A only</option>
                                    <option value="B">Variant B only</option>
                                </select>
                            </div>

                            {/* Order bump condition if checkout or bump trigger */}
                            {(triggerType === 'funnel.order_completed' || triggerType === 'funnel.order_bump_purchased') && (
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                        Order Bump
                                    </label>
                                    <select
                                        className={selectCls}
                                        value={orderBump}
                                        onChange={e => setOrderBump(e.target.value)}
                                        style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8 }}
                                    >
                                        <option value="all">Any</option>
                                        <option value="yes">Bump Purchased</option>
                                        <option value="no">No Bump</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2c. Cascading Trigger Link Selector (When Trigger Link Clicked Selected) */}
                {triggerType === 'trigger_link.clicked' && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Link2 size={13} className="text-brand-500" />
                            Trigger Link Targeting
                        </div>
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                Target Link
                            </label>
                            <select
                                className={selectCls}
                                value={triggerLinkId}
                                onChange={e => setTriggerLinkId(e.target.value)}
                                style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8 }}
                            >
                                <option value="">Any Trigger Link</option>
                                {triggerLinks.map(tl => (
                                    <option key={tl.id} value={tl.id}>{tl.name} ({tl.slug})</option>
                                ))}
                            </select>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                                Choose whether any trigger link click fires this workflow, or only a specific tracked link.
                            </div>
                        </div>
                    </div>
                )}

                {/* 2d. Stop on Customer Response Safeguard */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <input
                            type="checkbox"
                            id="stopOnResponseCheckbox"
                            checked={stopOnResponse}
                            onChange={e => setStopOnResponse(e.target.checked)}
                            style={{ marginTop: 3, accentColor: '#4f46e5', width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <label htmlFor="stopOnResponseCheckbox" style={{ cursor: 'pointer', userSelect: 'none' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                Stop on Customer Response
                                <span style={{ fontSize: 9.5, fontWeight: 600, color: '#4f46e5', background: '#eef2ff', padding: '1px 6px', borderRadius: 4 }}>
                                    Safeguard
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                                Automatically cancel ongoing drip actions and wait steps for this contact when they send any reply.
                            </div>
                        </label>
                    </div>
                </div>

                {/* 2d-2. Stage Exit Auto-Cancellation Safeguard */}
                {['opportunity.stage_changed', 'opportunity.won', 'opportunity.lost', 'opportunity.abandoned'].includes(triggerType) && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <input
                                type="checkbox"
                                id="cancelPreviousStageRunsCheckbox"
                                checked={cancelPreviousStageRuns}
                                onChange={e => setCancelPreviousStageRuns(e.target.checked)}
                                style={{ marginTop: 3, accentColor: '#4f46e5', width: 16, height: 16, cursor: 'pointer' }}
                            />
                            <label htmlFor="cancelPreviousStageRunsCheckbox" style={{ cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    Cancel Workflows Waiting on Previous Stage
                                    <span style={{ fontSize: 9.5, fontWeight: 600, color: '#0ea5e9', background: '#f0f9ff', padding: '1px 6px', borderRadius: 4 }}>
                                        Stage Exit
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                                    Automatically cancel pending wait steps and follow-ups from prior stages when a deal transitions to this stage.
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* 2d. Re-enrollment Policy & Frequency Capping (Enterprise Feature) */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RefreshCw size={13} className="text-brand-500" />
                        Re-enrollment & Frequency Capping
                    </div>
                    <div>
                        <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                            Contact Re-entry Policy
                        </label>
                        <select
                            className={selectCls}
                            value={reEntryPolicy}
                            onChange={e => setReEntryPolicy(e.target.value)}
                            style={{ fontSize: 11, padding: '7px 10px', borderRadius: 8 }}
                        >
                            <option value="always">Allow re-entry multiple times</option>
                            <option value="once">Allow only once per contact (No re-entry)</option>
                            <option value="cooldown">Allow re-entry after cooldown period</option>
                        </select>
                    </div>
                    {reEntryPolicy === 'cooldown' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                    Cooldown Time
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className={inputCls}
                                    value={cooldownAmount}
                                    onChange={e => setCooldownAmount(parseInt(e.target.value, 10) || 1)}
                                    style={{ fontSize: 11, padding: '6px 9px', borderRadius: 8 }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                    Unit
                                </label>
                                <select
                                    className={selectCls}
                                    value={cooldownUnit}
                                    onChange={e => setCooldownUnit(e.target.value)}
                                    style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                >
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                    <option value="minutes">Minutes</option>
                                </select>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <input
                            type="checkbox"
                            id="preventParallelRuns"
                            checked={preventParallelRuns}
                            onChange={e => setPreventParallelRuns(e.target.checked)}
                            style={{ accentColor: '#4f46e5', width: 14, height: 14, cursor: 'pointer' }}
                        />
                        <label htmlFor="preventParallelRuns" style={{ fontSize: 11, color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                            Prevent duplicate parallel runs if contact is already active
                        </label>
                    </div>
                </div>

                {/* 3. Filters Section (Matches Screenshot 3) */}
                <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                        FILTERS
                    </label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filters.map((flt, idx) => {
                            const allowedForTrigger = getAllowedFilterTypes(triggerType);
                            const availableOptions = ALL_FILTER_OPTIONS.filter(opt => allowedForTrigger.includes(opt.value));
                            return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <select
                                        className={selectCls}
                                        style={{ flex: '0 0 155px', fontSize: 11, padding: '7px 9px', borderRadius: 8, marginTop: 1 }}
                                        value={flt.type}
                                        onChange={e => changeFilter(idx, 'type', e.target.value)}
                                    >
                                        {availableOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>

                                    {/* Dynamic Value Selector based on filter type */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {flt.type === 'replied_to_workflow' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8, borderColor: '#93c5fd' }}
                                                    value={flt.value}
                                                    onChange={e => changeFilter(idx, 'value', e.target.value)}
                                                >
                                                    <option value="">Select a Workflow...</option>
                                                    {(resources.workflows || resources.subflows || []).map((wf, wfIdx) => (
                                                        <option key={wf.id || wf.uuid || wfIdx} value={wf.id || wf.uuid}>
                                                            {wfIdx + 1}. {wf.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: '#64748b' }}>
                                                    <span style={{ fontWeight: 600 }}>Attribution Window:</span>
                                                    <select
                                                        className={selectCls}
                                                        style={{ fontSize: 10.5, padding: '3px 6px', borderRadius: 6, width: 'auto' }}
                                                        value={flt.lookback || 'any'}
                                                        onChange={e => changeFilter(idx, 'lookback', e.target.value)}
                                                    >
                                                        <option value="any">Any time in history</option>
                                                        <option value="24h">Within last 24 hours</option>
                                                        <option value="48h">Within last 48 hours</option>
                                                        <option value="7d">Within last 7 days</option>
                                                        <option value="30d">Within last 30 days</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ) : flt.type === 'funnel_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Select Funnel</option>
                                                {(resources.funnels ?? []).map(fn => (
                                                    <option key={fn.id} value={fn.id}>{fn.name}</option>
                                                ))}
                                            </select>
                                        ) : flt.type === 'funnel_step_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Select Funnel Step</option>
                                                {((resources.funnels ?? []).flatMap(fn => (fn.steps || []).map(st => ({ ...st, funnelName: fn.name })))).map(st => (
                                                    <option key={st.id} value={st.id}>{st.funnelName} ➔ {st.name}</option>
                                                ))}
                                            </select>
                                        ) : flt.type === 'variant_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="A">Variant A</option>
                                                <option value="B">Variant B</option>
                                            </select>
                                        ) : flt.type === 'order_bump_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="yes">Bump Purchased</option>
                                                <option value="no">Bump Not Purchased</option>
                                            </select>
                                        ) : flt.type === 'calendar_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8, borderColor: '#93c5fd' }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Please Select Calendar</option>
                                                {(resources.calendars ?? []).map(cal => (
                                                    <option key={cal.id} value={cal.id}>{cal.name}</option>
                                                ))}
                                            </select>
                                        ) : flt.type === 'appointment_status_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Any Status</option>
                                                <option value="confirmed">Confirmed / Booked</option>
                                                <option value="showed">Showed (Attended)</option>
                                                <option value="no_show">No-Show</option>
                                                <option value="rescheduled">Rescheduled</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        ) : flt.type === 'event_type_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Any Event Type</option>
                                                <option value="personal">Personal / 1-on-1</option>
                                                <option value="team">Team / Collective</option>
                                                <option value="round_robin">Round Robin</option>
                                                <option value="class">Class / Group Booking</option>
                                            </select>
                                        ) : flt.type === 'assigned_user_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Any Host Staff</option>
                                                {(resources.agents ?? []).map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        ) : flt.type === 'form_is' || flt.type === 'form_is_not' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8, borderColor: '#93c5fd' }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Please Select Forms</option>
                                                {(resources.subscription_forms ?? []).map(f => (
                                                    <option key={f.id} value={f.slug}>{f.name}</option>
                                                ))}
                                            </select>
                                        ) : flt.type === 'tag_is' || flt.type === 'tag_is_not' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Please Select Tags</option>
                                                {(resources.tags ?? []).map(t => (
                                                    <option key={t.id} value={t.name}>{t.name}</option>
                                                ))}
                                            </select>
                                        ) : flt.type === 'pipeline_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Please Select Pipeline</option>
                                                {(resources.pipelines ?? []).map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        ) : flt.type === 'stage_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Please Select Stage</option>
                                                {(() => {
                                                    const pipeFlt = filters.find(f => f.type === 'pipeline_is');
                                                    const selectedPipeId = pipeFlt?.value;
                                                    const availableStages = selectedPipeId
                                                        ? (((resources.pipelines ?? []).find(p => String(p.id) === String(selectedPipeId)))?.stages || [])
                                                        : ((resources.pipelines ?? []).flatMap(p => (p.stages || []).map(s => ({ ...s, pipelineName: p.name }))));
                                                    return availableStages.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.pipelineName ? `${s.pipelineName} ➔ ${s.name}` : s.name}
                                                        </option>
                                                    ));
                                                })()}
                                            </select>
                                        ) : flt.type === 'from_stage_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Any Previous Stage</option>
                                                {(() => {
                                                    const pipeFlt = filters.find(f => f.type === 'pipeline_is');
                                                    const selectedPipeId = pipeFlt?.value;
                                                    const availableStages = selectedPipeId
                                                        ? (((resources.pipelines ?? []).find(p => String(p.id) === String(selectedPipeId)))?.stages || [])
                                                        : ((resources.pipelines ?? []).flatMap(p => (p.stages || []).map(s => ({ ...s, pipelineName: p.name }))));
                                                    return availableStages.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.pipelineName ? `${s.pipelineName} ➔ ${s.name}` : s.name}
                                                        </option>
                                                    ));
                                                })()}
                                            </select>
                                        ) : flt.type === 'change_source_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value || 'any'}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="any">All Sources (Manual & Automation)</option>
                                                <option value="manual">Manual Move Only (Kanban / User Action)</option>
                                                <option value="automation">Automation Only (Workflow Action / API)</option>
                                            </select>
                                        ) : flt.type === 'status_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">Any Status</option>
                                                <option value="open">Open (Active Deal)</option>
                                                <option value="won">Won (Deal Closed / Won)</option>
                                                <option value="lost">Lost</option>
                                                <option value="abandoned">Abandoned / Dropped</option>
                                            </select>
                                        ) : flt.type === 'keywords_contain' ? (
                                            <input
                                                className={inputCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                                placeholder="e.g. price, demo, quote (comma-separated)"
                                            />
                                        ) : flt.type === 'source_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">All Sources</option>
                                                <option value="form">Subscription / Lead Form</option>
                                                <option value="widget">WhatsApp Widget</option>
                                                <option value="api">API</option>
                                                <option value="import">CSV Import</option>
                                                <option value="manual">Manual</option>
                                            </select>
                                        ) : flt.type === 'channel_is' ? (
                                            <select
                                                className={selectCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                            >
                                                <option value="">All Channels</option>
                                                <option value="whatsapp">WhatsApp</option>
                                                <option value="sms">SMS</option>
                                                <option value="email">Email</option>
                                                <option value="messenger">Messenger</option>
                                                <option value="instagram">Instagram</option>
                                            </select>
                                        ) : (
                                            <input
                                                className={inputCls}
                                                style={{ fontSize: 11, padding: '7px 9px', borderRadius: 8 }}
                                                value={flt.value}
                                                onChange={e => changeFilter(idx, 'value', e.target.value)}
                                                placeholder="Enter filter value..."
                                            />
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeFilter(idx)}
                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, display: 'flex' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={addFilter}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
                            background: 'none', border: 'none', color: '#2563eb', fontSize: 11.5,
                            fontWeight: 600, cursor: 'pointer', padding: 0,
                        }}
                    >
                        <Plus size={13} /> Add filters
                    </button>

                    {/* Natural Trigger Sentence Summary Card */}
                    <div style={{
                        marginTop: 14, background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#334155',
                        display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4
                    }}>
                        <Zap size={14} className="text-brand-500 shrink-0 mt-0.5" />
                        <div>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>Trigger Logic: </span>
                            <span>{renderTriggerNaturalSummary(triggerType, filters, stopOnResponse, resources)}</span>
                        </div>
                    </div>
                </div>

                {/* Webhook URL if webhook trigger */}
                {triggerType === 'webhook.received' && (
                    <Field label={t('automation.webhook_url')}>
                        {webhookUrl ? (
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <input readOnly className={inputCls} value={webhookUrl} style={{ fontFamily: 'monospace', fontSize: 10 }} />
                                <button onClick={onCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}>
                                    {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                </button>
                            </div>
                        ) : (
                            <p style={{ fontSize: 11, color: '#94a3b8' }}>{t('automation.no_token_yet')}</p>
                        )}
                        <button onClick={onGenerateToken} disabled={generatingToken} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <RefreshCw size={11} style={{ animation: generatingToken ? 'spin 1s linear infinite' : 'none' }} />
                            {automation.trigger_token ? t('automation.regenerate_token') : t('automation.generate_token')}
                        </button>
                    </Field>
                )}
            </div>

            {/* Sticky Footer: Cancel & Save Trigger */}
            <div style={{
                padding: '12px 18px', borderTop: '1px solid #f1f5f9', background: '#fafafa',
                display: 'flex', justifyContent: 'flex-end', gap: 8,
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 22,
            }}>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                        background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 18px', borderRadius: 8, border: 'none',
                        background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', boxShadow: '0 1px 3px rgba(99,102,241,0.3)',
                    }}
                >
                    <Save size={13} /> Save Trigger
                </button>
            </div>
        </div>
    );
}

function CheckField({ label, checked, onChange }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} style={{ width: 14, height: 14 }} />
            {label}
        </label>
    );
}

function ChannelSelect({ d, set, imageOnlyHint = false }) {
    const { t } = useTranslation();
    const ch = d.channel ?? 'whatsapp';
    return (
        <>
            <Field label={t('automation.field_channel')}>
                <select className={selectCls} value={ch} onChange={e => set('channel', e.target.value)}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="messenger">Messenger</option>
                    <option value="instagram">Instagram</option>
                    <option value="sms">SMS</option>
                </select>
            </Field>
            {(ch === 'messenger' || ch === 'instagram') && (
                <div style={{ display: 'flex', gap: 6, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 10px', fontSize: 10, color: '#1e40af' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{imageOnlyHint ? t('automation.channel_meta_image_hint') : t('automation.channel_meta_hint')}</span>
                </div>
            )}
        </>
    );
}

function GoogleWarning() {
    const { t } = useTranslation();
    const r = useResources();
    if (r.integrations?.google) return null;
    return (
        <div style={{ display: 'flex', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', fontSize: 10, color: '#92400e' }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{t('automation.google_not_configured')}</span>
        </div>
    );
}

/* ─── Field components ────────────────────────────────────────── */

function WhatsAppFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    return (
        <>
            <InlineTokenTextarea
                label={t('automation.field_message_body_required')}
                required={true}
                rows={4}
                value={d.body ?? ''}
                onChange={val => set('body', val)}
                placeholder={t('automation.placeholder_whatsapp_body', { token: '{{contact.name}}' })}
                triggerType={triggerType}
            />
            <ChannelSelect d={d} set={set} />
        </>
    );
}

function SmsFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    return (
        <InlineTokenTextarea
            label={t('automation.field_message_body_required')}
            required={true}
            rows={4}
            value={d.body ?? ''}
            onChange={val => set('body', val)}
            placeholder={t('automation.placeholder_sms_body', { token: '{{contact.name}}' })}
            triggerType={triggerType}
        />
    );
}

function RichMessageEditor({ value, onChange, subject, onSubjectChange }) {
    return (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #cbd5e1', overflow: 'hidden', padding: 8 }}>
            <EmailEditor
                subject={subject ?? ''}
                body={value ?? ''}
                onSubjectChange={onSubjectChange || (() => {})}
                onBodyChange={onChange}
            />
        </div>
    );
}

const EMAIL_CONTACT_TOKENS = [
    { label: 'Full Name', key: '{{contact.name}}' },
    { label: 'First Name', key: '{{contact.first_name}}' },
    { label: 'Last Name', key: '{{contact.last_name}}' },
    { label: 'Email', key: '{{contact.email}}' },
    { label: 'Phone', key: '{{contact.phone}}' },
    { label: 'User Name', key: '{{user.name}}' },
    { label: 'User Email', key: '{{user.email}}' },
    { label: 'Company Name', key: '{{company.name}}' },
];

function EmailFields({ d, set }) {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const [showCc, setShowCc] = useState(Boolean(d.cc));
    const [showBcc, setShowBcc] = useState(Boolean(d.bcc));
    const [showAdditional, setShowAdditional] = useState(false);
    const [testEmail, setTestEmail] = useState(auth?.user?.email || '');
    const [isSendingTest, setIsSendingTest] = useState(false);

    const handleSendTest = async () => {
        if (!testEmail || !testEmail.includes('@')) {
            toast.error('Please enter a valid recipient email address.');
            return;
        }
        setIsSendingTest(true);
        try {
            const res = await axios.post('/app/automations/send-test-email', {
                email: testEmail,
                subject: d.subject || 'Workflow Email Preview',
                body: d.body || '<p>This is a test email preview from your workflow.</p>',
                from_name: d.from_name || '',
                from_email: d.from_email || '',
                preheader: d.preheader || '',
            });
            if (res.data?.ok) {
                toast.success(res.data.message || `Test email sent to ${testEmail}`);
            } else {
                toast.error(res.data?.error || 'Failed to send test email');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Failed to send test email');
        } finally {
            setIsSendingTest(false);
        }
    };

    return (
        <div className="space-y-4 text-xs">
            {/* Sender Name */}
            <InlineTokenInput
                label={t('automation.field_from_name_optional') || 'From Name'}
                value={d.from_name ?? ''}
                onChange={val => set('from_name', val)}
                placeholder="e.g. {{user.name}} or Support Team"
            />

            {/* Sender Email */}
            <InlineTokenInput
                label="From Email"
                value={d.from_email ?? ''}
                onChange={val => set('from_email', val)}
                placeholder="e.g. {{user.email}} or info@company.com"
                subtext="If 'From Name' and 'From email' fields are empty then Email will be sent using default workspace settings."
            />

            {/* Cc / Bcc Pills & Inputs */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    {!showCc && (
                        <button
                            type="button"
                            onClick={() => setShowCc(true)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition cursor-pointer"
                        >
                            + Cc
                        </button>
                    )}
                    {!showBcc && (
                        <button
                            type="button"
                            onClick={() => setShowBcc(true)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition cursor-pointer"
                        >
                            + Bcc
                        </button>
                    )}
                </div>

                {showCc && (
                    <div className="relative">
                        <InlineTokenInput
                            label="Cc"
                            value={d.cc ?? ''}
                            onChange={val => set('cc', val)}
                            placeholder="Comma-separated emails (e.g. team@company.com)..."
                        />
                        <button
                            type="button"
                            onClick={() => { setShowCc(false); set('cc', ''); }}
                            className="absolute right-9 top-0 text-[10px] text-neutral-400 hover:text-red-500 cursor-pointer"
                            title="Remove Cc"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {showBcc && (
                    <div className="relative">
                        <InlineTokenInput
                            label="Bcc"
                            value={d.bcc ?? ''}
                            onChange={val => set('bcc', val)}
                            placeholder="Comma-separated emails (e.g. archive@company.com)..."
                        />
                        <button
                            type="button"
                            onClick={() => { setShowBcc(false); set('bcc', ''); }}
                            className="absolute right-9 top-0 text-[10px] text-neutral-400 hover:text-red-500 cursor-pointer"
                            title="Remove Bcc"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            {/* Subject Line */}
            <InlineTokenInput
                label="Subject"
                required={true}
                value={d.subject ?? ''}
                onChange={val => set('subject', val)}
                placeholder="Enter subject line..."
                subtext="Subject line is mandatory in email action, if you choose to keep it empty, we will fill in the subject line of the template."
            />

            {/* Pre-Header (Preview Text) */}
            <InlineTokenInput
                label="Pre-Header (Preview Text)"
                value={d.preheader ?? ''}
                onChange={val => set('preheader', val)}
                placeholder="(Optional) Mobile preview snippet..."
                subtext="This will be used as the preview text that displays next to subject line in some email clients."
            />

            {/* Email Message Content - Default Email View (Editor, Template, HTML tabs) */}
            <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Email Content <span className="text-red-500">*</span>
                </label>
                <div className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 shadow-2xs">
                    <EmailEditor
                        subject={d.subject ?? ''}
                        body={d.body ?? ''}
                        onSubjectChange={val => set('subject', val)}
                        onBodyChange={val => set('body', val)}
                        contactTokens={EMAIL_CONTACT_TOKENS}
                        hideSubject={true}
                        defaultTab="visual"
                    />
                </div>
            </div>

            {/* In-Drawer Test Email Dispatch Bar */}
            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-850/60 space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Test Emails <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="test@yourdomain.com"
                        className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        type="button"
                        onClick={handleSendTest}
                        disabled={isSendingTest}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 transition cursor-pointer disabled:opacity-60 shrink-0"
                    >
                        {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{isSendingTest ? 'Sending...' : 'Send test mail'}</span>
                    </button>
                </div>
                <p className="text-[10px] text-neutral-400">
                    Sends a live sample with sample tokens resolved to preview in your inbox.
                </p>
            </div>

            {/* Collapsible Additional Settings Accordion */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowAdditional(!showAdditional)}
                    className="w-full p-2.5 bg-neutral-50/80 dark:bg-neutral-800/50 flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Additional settings</span>
                    </div>
                    {showAdditional ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showAdditional && (
                    <div className="p-3 space-y-3 bg-white dark:bg-neutral-900">
                        {/* Track Clicks */}
                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={d.track_clicks ?? true}
                                onChange={(e) => set('track_clicks', e.target.checked)}
                                className="w-4 h-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                            />
                            <div>
                                <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                    Track clicks
                                </div>
                                <div className="text-[11px] text-neutral-400 leading-tight">
                                    Discover which links were clicked, how many times each link was clicked, and who clicked.
                                </div>
                            </div>
                        </label>

                        {/* UTM Tracking */}
                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={d.utm_tracking ?? false}
                                onChange={(e) => set('utm_tracking', e.target.checked)}
                                className="w-4 h-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                            />
                            <div>
                                <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                    UTM tracking
                                </div>
                                <div className="text-[11px] text-neutral-400 leading-tight">
                                    Automatically append default UTM tracking parameters (utm_source, utm_medium, utm_campaign) to every link in the email.
                                </div>
                            </div>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}

function templateBodyText(components) {
    const body = (Array.isArray(components) ? components : []).find(c => (c.type || '').toUpperCase() === 'BODY');
    return body?.text || '';
}

function templateBodyVarCount(components) {
    const text = templateBodyText(components);
    const matches = text.match(/\{\{\s*(\d+)\s*\}\}/g) || [];
    return matches.reduce((max, m) => Math.max(max, parseInt(m.replace(/[^\d]/g, ''), 10) || 0), 0);
}

function TemplateFields({ d, set }) {
    const { t } = useTranslation();
    const { templates = [] } = useResources();
    const tpl = templates.find(x => x.name === d.template_name && x.language === d.language)
        || templates.find(x => x.name === d.template_name);
    const varCount = tpl ? templateBodyVarCount(tpl.components) : 0;
    const vars = Array.isArray(d.variables)
        ? d.variables
        : (typeof d.variables === 'string' && d.variables ? d.variables.split('\n') : []);

    const onPick = (val) => {
        const [name, language] = val.split('||');
        set('template_name', name);
        set('language', language || 'en');
        set('variables', []); // reset on template change so indices match the new body
    };
    const setVar = (i, val) => {
        const next = Array.from({ length: varCount }, (_, idx) => vars[idx] ?? '');
        next[i] = val;
        set('variables', next);
    };

    return (
        <>
            <Field label={t('automation.field_template_required')}>
                {templates.length ? (
                    <select className={selectCls} value={tpl ? `${tpl.name}||${tpl.language}` : ''} onChange={e => onPick(e.target.value)}>
                        <option value="">{t('automation.select_template')}</option>
                        {templates.map(x => (
                            <option key={`${x.name}-${x.language}`} value={`${x.name}||${x.language}`}>
                                {x.name} ({x.language}){x.status && x.status !== 'APPROVED' ? ` · ${x.status}` : ''}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input className={inputCls} value={d.template_name ?? ''} onChange={e => set('template_name', e.target.value)} placeholder="my_template_name" />
                )}
            </Field>

            {!templates.length && (
                <Field label={t('automation.field_language')}>
                    <input className={inputCls} value={d.language ?? 'en'} onChange={e => set('language', e.target.value)} placeholder="en" />
                </Field>
            )}

            {tpl && tpl.status && tpl.status !== 'APPROVED' && (
                <div style={{ display: 'flex', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', fontSize: 10, color: '#92400e' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{t('automation.template_not_approved', { status: tpl.status })}</span>
                </div>
            )}

            {tpl && templateBodyText(tpl.components) && (
                <div>
                    <label className={labelCls}>{t('automation.template_preview')}</label>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#475569', whiteSpace: 'pre-wrap' }}>
                        {templateBodyText(tpl.components)}
                    </div>
                </div>
            )}

            {varCount > 0 && Array.from({ length: varCount }).map((_, i) => (
                <Field key={i} label={t('automation.template_var_n', { n: i + 1 })}>
                    <input className={inputCls} value={vars[i] ?? ''} onChange={e => setVar(i, e.target.value)} placeholder={t('automation.template_var_placeholder', { n: i + 1 })} />
                </Field>
            ))}

            {!tpl && templates.length === 0 && (
                <Field label={t('automation.field_template_vars_optional')}>
                    <textarea className={textareaCls} rows={3} value={typeof d.variables === 'string' ? d.variables : ''} onChange={e => set('variables', e.target.value)} placeholder={t('automation.placeholder_template_vars')} />
                </Field>
            )}
        </>
    );
}

function mediaAccept(type) {
    return type === 'video' ? 'video/*'
        : type === 'audio' ? 'audio/*'
            : type === 'document' ? '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv'
                : 'image/*';
}

function MediaFields({ d, set }) {
    const { t } = useTranslation();
    return (
        <>
            <Field label={t('automation.field_media_type')}>
                <select className={selectCls} value={d.media_type ?? 'image'} onChange={e => set('media_type', e.target.value)}>
                    <option value="image">{t('automation.media_image')}</option>
                    <option value="video">{t('automation.media_video')}</option>
                    <option value="document">{t('automation.media_document')}</option>
                    <option value="audio">{t('automation.media_audio')}</option>
                </select>
            </Field>
            <MediaUpload
                label={t('automation.field_media_required')}
                value={d.link ?? ''}
                onChange={url => set('link', url)}
                accept={mediaAccept(d.media_type)}
                collection="automation"
                placeholder="https://example.com/file.pdf"
            />
            {d.media_type !== 'audio' && (
                <Field label={t('automation.field_caption_optional')}>
                    <textarea className={textareaCls} rows={2} value={d.caption ?? ''} onChange={e => set('caption', e.target.value)} placeholder={t('automation.placeholder_caption')} />
                </Field>
            )}
            {d.media_type === 'document' && (
                <Field label={t('automation.field_filename_optional')}>
                    <input className={inputCls} value={d.filename ?? ''} onChange={e => set('filename', e.target.value)} placeholder="invoice.pdf" />
                </Field>
            )}
            <ChannelSelect d={d} set={set} imageOnlyHint />
        </>
    );
}

function SequenceFields({ d, set }) {
    const { t } = useTranslation();
    const steps = Array.isArray(d.steps) ? d.steps : [];
    const update = (i, patch) => set('steps', steps.map((s, idx) => idx === i ? { ...s, ...patch } : s));
    const add = (kind) => set('steps', [...steps, kind === 'media' ? { kind: 'media', media_type: 'image', link: '', caption: '' } : { kind: 'text', body: '' }]);
    const remove = (i) => set('steps', steps.filter((_, idx) => idx !== i));

    return (
        <>
            <p style={{ fontSize: 10, color: '#64748b' }}>{t('automation.sequence_hint')}</p>
            {steps.map((s, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }} className="space-y-2">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{t('automation.step_n', { n: i + 1 })}</span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <select className="rounded border border-gray-200 text-[10px] px-1 py-0.5" value={s.kind ?? 'text'} onChange={e => update(i, { kind: e.target.value })}>
                                <option value="text">{t('automation.step_text')}</option>
                                <option value="media">{t('automation.step_media')}</option>
                            </select>
                            <button onClick={() => remove(i)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Trash2 size={13} /></button>
                        </div>
                    </div>
                    {s.kind === 'media' ? (
                        <>
                            <select className={selectCls} value={s.media_type ?? 'image'} onChange={e => update(i, { media_type: e.target.value })}>
                                <option value="image">{t('automation.media_image')}</option>
                                <option value="video">{t('automation.media_video')}</option>
                                <option value="document">{t('automation.media_document')}</option>
                                <option value="audio">{t('automation.media_audio')}</option>
                            </select>
                            <MediaUpload
                                value={s.link ?? ''}
                                onChange={url => update(i, { link: url })}
                                accept={mediaAccept(s.media_type)}
                                collection="automation"
                                placeholder="https://example.com/file.jpg"
                            />
                            <input className={inputCls} value={s.caption ?? ''} onChange={e => update(i, { caption: e.target.value })} placeholder={t('automation.field_caption_optional')} />
                        </>
                    ) : (
                        <textarea className={textareaCls} rows={2} value={s.body ?? ''} onChange={e => update(i, { body: e.target.value })} placeholder={t('automation.placeholder_whatsapp_body', { token: '{{contact.name}}' })} />
                    )}
                </div>
            ))}
            <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => add('text')} style={addBtnStyle}><Plus size={11} /> {t('automation.step_text')}</button>
                <button onClick={() => add('media')} style={addBtnStyle}><Plus size={11} /> {t('automation.step_media')}</button>
            </div>
        </>
    );
}

const addBtnStyle = {
    display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center',
    border: '1px dashed #cbd5e1', borderRadius: 8, padding: '6px 0', fontSize: 11,
    fontWeight: 600, color: '#475569', background: '#f8fafc', cursor: 'pointer',
};

function QuickRepliesFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    const buttons = Array.isArray(d.buttons) ? d.buttons : ['', '', ''];
    const setBtn = (i, val) => {
        const next = [...buttons];
        next[i] = val;
        set('buttons', next);
    };
    return (
        <>
            <InlineTokenTextarea
                label={t('automation.field_message_body_required')}
                required={true}
                rows={3}
                value={d.body ?? ''}
                onChange={val => set('body', val)}
                placeholder={t('automation.placeholder_quick_replies_body')}
                triggerType={triggerType}
            />
            {[0, 1, 2].map(i => (
                <Field key={i} label={t('automation.field_button_n', { n: i + 1 })}>
                    <input className={inputCls} maxLength={20} value={buttons[i] ?? ''} onChange={e => setBtn(i, e.target.value)} placeholder={i === 0 ? t('automation.placeholder_button_required') : t('automation.placeholder_button_optional')} />
                </Field>
            ))}
        </>
    );
}

function ListMessageFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    return (
        <>
            <InlineTokenTextarea
                label={t('automation.field_message_body_required')}
                required={true}
                rows={3}
                value={d.body ?? ''}
                onChange={val => set('body', val)}
                placeholder={t('automation.placeholder_list_body')}
                triggerType={triggerType}
            />
            <Field label={t('automation.field_list_button')}>
                <input className={inputCls} maxLength={20} value={d.button_label ?? ''} onChange={e => set('button_label', e.target.value)} placeholder={t('automation.placeholder_list_button')} />
            </Field>
            <Field label={t('automation.field_section_title_optional')}>
                <input className={inputCls} maxLength={24} value={d.section_title ?? ''} onChange={e => set('section_title', e.target.value)} placeholder={t('automation.placeholder_section_title')} />
            </Field>
            <Field label={t('automation.field_list_rows_required')}>
                <textarea className={textareaCls} rows={4} value={d.rows ?? ''} onChange={e => set('rows', e.target.value)} placeholder={t('automation.placeholder_list_rows')} />
            </Field>
        </>
    );
}

function AskQuestionFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    return (
        <>
            <InlineTokenTextarea
                label={t('automation.field_question_required')}
                required={true}
                rows={3}
                value={d.question ?? ''}
                onChange={val => set('question', val)}
                placeholder={t('automation.placeholder_question')}
                triggerType={triggerType}
            />
            <Field label={t('automation.field_save_to_var_required')}>
                <input className={inputCls} value={d.variable ?? 'answer'} onChange={e => set('variable', e.target.value)} placeholder="answer" />
            </Field>
            <ChannelSelect d={d} set={set} />
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 10px', fontSize: 10, color: '#9a3412' }}>
                {t('automation.ask_question_hint', { var: `{{context.${d.variable || 'answer'}}}` })}
            </div>
        </>
    );
}

const WAIT_CATEGORIES = [
    {
        category: 'Time based',
        options: [
            {
                value: 'delay',
                label: 'Time Delay',
                desc: 'wait for a particular amount of time or period',
                icon: Clock,
            },
            {
                value: 'event_relative',
                label: 'Event / Appointment time',
                desc: 'wait until before or after event start time, or appointment time',
                icon: CalendarClock,
            },
            {
                value: 'invoice_due_date',
                label: 'Overdue',
                desc: 'wait until before or after the Invoice due date',
                icon: DollarSign,
            },
        ],
    },
    {
        category: 'CRM Events',
        options: [
            {
                value: 'contact_reply',
                label: 'The contact to reply',
                desc: 'wait for contact to reply via WhatsApp, SMS, or Email',
                icon: MessageSquareReply,
            },
            {
                value: 'contact_action',
                label: 'The contact to take an action',
                desc: 'wait until contact clicks a trigger link or opens an email',
                icon: MousePointerClick,
            },
            {
                value: 'conditions_met',
                label: 'Specific conditions to be met',
                desc: 'wait until specific conditions or fields evaluate to true',
                icon: GitBranch,
            },
            {
                value: 'user_reply',
                label: 'A user to reply',
                desc: 'hold until a member of your team replies (Response SLA)',
                icon: UserCheck,
            },
        ],
    },
];

function WaitFields({ d, set }) {
    const { t } = useTranslation();
    const { triggerNodes = [], nodes = [] } = useContext(NodeActionsContext);
    const resources = useResources();
    const waitType = d.wait_type || 'delay';
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQ, setSearchQ] = useState('');
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        const handleOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleOutside);
        return () => document.removeEventListener('pointerdown', handleOutside);
    }, [dropdownOpen]);

    const allOptions = WAIT_CATEGORIES.flatMap(c => c.options);
    const currentOption = allOptions.find(o => o.value === waitType) || allOptions[0];
    const triggerTitle = triggerNodes[0]?.data?.triggerName || triggerNodes[0]?.data?.label || 'Appointment';

    // Filter categories by search
    const filteredCategories = WAIT_CATEGORIES.map(cat => ({
        ...cat,
        options: cat.options.filter(o =>
            !searchQ.trim() ||
            o.label.toLowerCase().includes(searchQ.toLowerCase()) ||
            o.desc.toLowerCase().includes(searchQ.toLowerCase())
        ),
    })).filter(cat => cat.options.length > 0);

    const toggleWeekday = (day) => {
        const currentDays = Array.isArray(d.allowed_days) ? d.allowed_days : ['mon', 'tue', 'wed', 'thu', 'fri'];
        const next = currentDays.includes(day)
            ? currentDays.filter(x => x !== day)
            : [...currentDays, day];
        set('allowed_days', next.length > 0 ? next : [day]);
    };

    const currentDays = Array.isArray(d.allowed_days) ? d.allowed_days : ['mon', 'tue', 'wed', 'thu', 'fri'];
    const otherNodes = nodes.filter(n => n.type === 'automationNode' && n.id !== d.id);

    return (
        <div className="space-y-4">
            {/* Header Description */}
            <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.45 }}>
                Holds a contact for a specific time, until a condition exists, or until the contact replies
            </div>

            {/* WAIT FOR: Custom Categorized Searchable Dropdown */}
            <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    WAIT FOR
                </label>

                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                        type="button"
                        onClick={() => setDropdownOpen(prev => !prev)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            background: '#fff',
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{ color: '#4f46e5', display: 'flex' }}>
                                <currentOption.icon size={16} />
                            </span>
                            <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>
                                    {currentOption.label}
                                </div>
                            </div>
                        </div>
                        <ChevronDown size={15} style={{ color: '#94a3b8', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>

                    {dropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            background: '#fff',
                            border: '1px solid #cbd5e1',
                            borderRadius: 10,
                            boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                            zIndex: 50,
                            maxHeight: 340,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            {/* Search bar */}
                            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px' }}>
                                    <Search size={13} style={{ color: '#94a3b8' }} />
                                    <input
                                        value={searchQ}
                                        onChange={e => setSearchQ(e.target.value)}
                                        placeholder="Search wait options..."
                                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 11.5, width: '100%', color: '#1e293b' }}
                                        autoFocus
                                    />
                                    {searchQ && (
                                        <button type="button" onClick={() => setSearchQ('')} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}>
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Options List */}
                            <div style={{ padding: '4px 0' }}>
                                {filteredCategories.map((cat, cIdx) => (
                                    <div key={cIdx}>
                                        <div style={{
                                            padding: '6px 12px 4px',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#64748b',
                                            background: '#f8fafc',
                                            borderTop: cIdx > 0 ? '1px solid #f1f5f9' : 'none',
                                            borderBottom: '1px solid #f1f5f9',
                                            letterSpacing: '0.04em',
                                            textTransform: 'uppercase',
                                        }}>
                                            {cat.category}
                                        </div>
                                        {cat.options.map(opt => {
                                            const isSelected = waitType === opt.value;
                                            const Icon = opt.icon;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => {
                                                        set('wait_type', opt.value);
                                                        setDropdownOpen(false);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: 10,
                                                        padding: '8px 12px',
                                                        border: 'none',
                                                        background: isSelected ? '#f5f3ff' : 'transparent',
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.1s',
                                                    }}
                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <span style={{ color: isSelected ? '#7c3aed' : '#64748b', marginTop: 2, flexShrink: 0 }}>
                                                        <Icon size={15} />
                                                    </span>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#6d28d9' : '#1e293b' }}>
                                                            {opt.label}
                                                        </div>
                                                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1, lineHeight: 1.3 }}>
                                                            {opt.desc}
                                                        </div>
                                                    </div>
                                                    {isSelected && <Check size={14} style={{ color: '#7c3aed', flexShrink: 0, marginTop: 3 }} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Sub-Form 1: Event / Appointment Time (Matches Screenshot 1) ── */}
            {waitType === 'event_relative' && (
                <div className="space-y-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                    {/* What type? */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6 }}>
                            What type?
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { value: 'appointment', label: 'Appointment / calendar event' },
                                { value: 'rental', label: 'Rental booking' },
                                { value: 'invoice', label: 'Invoice due date' },
                            ].map(tOpt => (
                                <label key={tOpt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#334155', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="scheduled_what_type"
                                        value={tOpt.value}
                                        checked={(d.scheduled_what_type || 'appointment') === tOpt.value}
                                        onChange={() => {
                                            if (tOpt.value === 'invoice') {
                                                set({ wait_type: 'invoice_due_date', scheduled_what_type: 'invoice' });
                                            } else {
                                                set('scheduled_what_type', tOpt.value);
                                            }
                                        }}
                                        style={{ accentColor: '#4f46e5', cursor: 'pointer' }}
                                    />
                                    <span>{tOpt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Info banner referencing trigger appointment */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Info size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                        <span>Using appointment from workflow trigger: <strong>"{triggerTitle}"</strong></span>
                    </div>

                    {/* When should the contact proceed? */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6 }}>
                            When should the contact proceed?
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { value: 'at_time', label: 'At the scheduled time' },
                                { value: 'before', label: 'Before' },
                                { value: 'after', label: 'After' },
                            ].map(pOpt => (
                                <label key={pOpt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#334155', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="event_timing"
                                        value={pOpt.value}
                                        checked={(d.event_timing || 'before') === pOpt.value}
                                        onChange={() => set('event_timing', pOpt.value)}
                                        style={{ accentColor: '#4f46e5', cursor: 'pointer' }}
                                    />
                                    <span>{pOpt.label}</span>
                                </label>
                            ))}
                        </div>

                        {/* Granular Offset Inputs */}
                        {(d.event_timing || 'before') !== 'at_time' && (
                            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Days</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className={inputCls}
                                        value={d.offset_days ?? 1}
                                        onChange={e => set('offset_days', parseInt(e.target.value, 10) || 0)}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Hours</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={23}
                                        className={inputCls}
                                        value={d.offset_hours ?? 0}
                                        onChange={e => set('offset_hours', parseInt(e.target.value, 10) || 0)}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Minutes</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={59}
                                        className={inputCls}
                                        value={d.offset_minutes ?? 0}
                                        onChange={e => set('offset_minutes', parseInt(e.target.value, 10) || 0)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* If this date has already passed */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6 }}>
                            If this date has already passed
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { value: 'continue', label: 'Continue to next action' },
                                { value: 'skip_outbound', label: 'Skip all outbound communication actions till next wait or event start date action' },
                                { value: 'exit', label: 'Exit contact from automation' },
                                { value: 'go_to_step', label: 'Go to specific step' },
                            ].map(passOpt => (
                                <label key={passOpt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11.5, color: '#334155', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="past_action"
                                        value={passOpt.value}
                                        checked={(d.past_action || 'skip_outbound') === passOpt.value}
                                        onChange={() => set('past_action', passOpt.value)}
                                        style={{ accentColor: '#4f46e5', cursor: 'pointer', marginTop: 2 }}
                                    />
                                    <span style={{ lineHeight: 1.35 }}>{passOpt.label}</span>
                                </label>
                            ))}
                        </div>

                        {d.past_action === 'go_to_step' && (
                            <div style={{ marginTop: 8 }}>
                                <select
                                    className={selectCls}
                                    value={d.past_target_step_id || ''}
                                    onChange={e => set('past_target_step_id', e.target.value)}
                                >
                                    <option value="">Select target step...</option>
                                    {otherNodes.map(on => (
                                        <option key={on.id} value={on.id}>
                                            {on.data?.label || on.data?.nodeType} (#{on.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Sub-Form 2: Time Delay + Advance Business Hours Window ── */}
            {waitType === 'delay' && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className={labelCls}>Time period</label>
                            <input
                                type="number"
                                min={1}
                                className={inputCls}
                                value={d.amount ?? 1}
                                onChange={e => set('amount', parseInt(e.target.value, 10) || 1)}
                                placeholder="1"
                            />
                        </div>
                        <div className="flex-1">
                            <label className={labelCls}>Unit</label>
                            <select className={selectCls} value={d.unit ?? 'minutes'} onChange={e => set('unit', e.target.value)}>
                                <option value="seconds">Seconds</option>
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                            </select>
                        </div>
                    </div>

                    {/* Advance Window (Delivery Business Hours) */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <input
                                type="checkbox"
                                id="advanceWindowCheckbox"
                                checked={Boolean(d.advance_window_enabled)}
                                onChange={e => set('advance_window_enabled', e.target.checked)}
                                style={{ marginTop: 3, accentColor: '#4f46e5', width: 15, height: 15, cursor: 'pointer' }}
                            />
                            <label htmlFor="advanceWindowCheckbox" style={{ cursor: 'pointer', userSelect: 'none', flex: 1 }}>
                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>
                                    Advance Window (Delivery Hours)
                                </div>
                                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>
                                    Limit workflow execution to specific weekdays & business hours.
                                </div>
                            </label>
                        </div>

                        {d.advance_window_enabled && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>
                                        Resume On (Allowed Weekdays)
                                    </label>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {[
                                            { code: 'mon', label: 'Mon' },
                                            { code: 'tue', label: 'Tue' },
                                            { code: 'wed', label: 'Wed' },
                                            { code: 'thu', label: 'Thu' },
                                            { code: 'fri', label: 'Fri' },
                                            { code: 'sat', label: 'Sat' },
                                            { code: 'sun', label: 'Sun' },
                                        ].map(dItem => {
                                            const active = currentDays.includes(dItem.code);
                                            return (
                                                <button
                                                    key={dItem.code}
                                                    type="button"
                                                    onClick={() => toggleWeekday(dItem.code)}
                                                    style={{
                                                        padding: '4px 9px',
                                                        borderRadius: 6,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        border: `1px solid ${active ? '#4f46e5' : '#cbd5e1'}`,
                                                        background: active ? '#4f46e5' : '#fff',
                                                        color: active ? '#fff' : '#475569',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {dItem.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <div>
                                        <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                            Resume Between
                                        </label>
                                        <input
                                            type="time"
                                            className={inputCls}
                                            value={d.window_from || '09:00'}
                                            onChange={e => set('window_from', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                                            And
                                        </label>
                                        <input
                                            type="time"
                                            className={inputCls}
                                            value={d.window_to || '18:00'}
                                            onChange={e => set('window_to', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Sub-Form 3: Overdue / Invoice Due Date ── */}
            {waitType === 'invoice_due_date' && (
                <div className="space-y-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Info size={14} style={{ color: '#059669', flexShrink: 0 }} />
                        <span>Evaluates relative to contact's latest unpaid invoice due date</span>
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6 }}>
                            When should the contact proceed?
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { value: 'before', label: 'Before invoice due date (Upcoming payment reminder)' },
                                { value: 'at_time', label: 'On the invoice due date' },
                                { value: 'after', label: 'After invoice due date (Overdue collection reminder)' },
                            ].map(pOpt => (
                                <label key={pOpt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#334155', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="inv_timing"
                                        value={pOpt.value}
                                        checked={(d.event_timing || 'after') === pOpt.value}
                                        onChange={() => set('event_timing', pOpt.value)}
                                        style={{ accentColor: '#059669', cursor: 'pointer' }}
                                    />
                                    <span>{pOpt.label}</span>
                                </label>
                            ))}
                        </div>

                        {(d.event_timing || 'after') !== 'at_time' && (
                            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Days</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className={inputCls}
                                        value={d.offset_days ?? 1}
                                        onChange={e => set('offset_days', parseInt(e.target.value, 10) || 0)}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Hours</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={23}
                                        className={inputCls}
                                        value={d.offset_hours ?? 0}
                                        onChange={e => set('offset_hours', parseInt(e.target.value, 10) || 0)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6 }}>
                            If invoice is already paid or date passed
                        </label>
                        <select className={selectCls} value={d.past_action || 'exit'} onChange={e => set('past_action', e.target.value)}>
                            <option value="exit">Exit contact from automation (Recommended)</option>
                            <option value="skip_outbound">Skip outbound reminder messages</option>
                            <option value="continue">Continue to next step</option>
                        </select>
                    </div>
                </div>
            )}

            {/* ── Sub-Form 4: The contact to reply ── */}
            {waitType === 'contact_reply' && (
                <div className="space-y-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                    <Field label="Reply To Channel">
                        <select className={selectCls} value={d.channel || ''} onChange={e => set('channel', e.target.value)}>
                            <option value="">All Supported Channels</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="sms">SMS</option>
                            <option value="email">Email</option>
                        </select>
                    </Field>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className={labelCls}>Timeout (Maximum Wait)</label>
                            <input
                                type="number"
                                min={1}
                                className={inputCls}
                                value={d.timeout_amount ?? 24}
                                onChange={e => set('timeout_amount', parseInt(e.target.value, 10) || 1)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className={labelCls}>Unit</label>
                            <select className={selectCls} value={d.timeout_unit ?? 'hours'} onChange={e => set('timeout_unit', e.target.value)}>
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sub-Form 5: User / Staff to Reply (SLA Monitoring) ── */}
            {waitType === 'user_reply' && (
                <div className="space-y-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#1e40af', lineHeight: 1.4 }}>
                        ⏱️ <strong>Response SLA:</strong> Tracks whether your internal team responds to the contact. If unanswered before timeout, execution continues to escalation.
                    </div>

                    <Field label="Reply Channel">
                        <select className={selectCls} value={d.channel || ''} onChange={e => set('channel', e.target.value)}>
                            <option value="">Any Channel</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="sms">SMS</option>
                            <option value="email">Email</option>
                        </select>
                    </Field>

                    <Field label="Which User">
                        <select className={selectCls} value={d.assigned_user_id || ''} onChange={e => set('assigned_user_id', e.target.value)}>
                            <option value="">Any Team Member</option>
                            <option value="assigned">Contact's Assigned Agent</option>
                            {(resources.agents || []).map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </Field>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className={labelCls}>SLA Timeout</label>
                            <input
                                type="number"
                                min={1}
                                className={inputCls}
                                value={d.timeout_amount ?? 15}
                                onChange={e => set('timeout_amount', parseInt(e.target.value, 10) || 1)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className={labelCls}>Unit</label>
                            <select className={selectCls} value={d.timeout_unit ?? 'minutes'} onChange={e => set('timeout_unit', e.target.value)}>
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sub-Form 6: Contact Action & Specific Conditions fallback ── */}
            {(waitType === 'contact_action' || waitType === 'conditions_met') && (
                <div className="space-y-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>
                        Pauses execution until the contact completes the action or conditions match, then continues immediately.
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className={labelCls}>Max Wait Timeout</label>
                            <input
                                type="number"
                                min={1}
                                className={inputCls}
                                value={d.timeout_amount ?? 48}
                                onChange={e => set('timeout_amount', parseInt(e.target.value, 10) || 1)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className={labelCls}>Unit</label>
                            <select className={selectCls} value={d.timeout_unit ?? 'hours'} onChange={e => set('timeout_unit', e.target.value)}>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function WaitForReplyFields({ d, set }) {
    const timeoutAmount = d.timeout_amount ?? d.amount ?? 24;
    const timeoutUnit = d.timeout_unit ?? d.unit ?? 'hours';
    const matchType = d.match_type ?? 'any';
    const matchPhrase = d.match_phrase ?? '';
    const replyVar = d.reply_variable ?? d.variable ?? 'customer_reply';

    return (
        <div className="space-y-4">
            {/* Informational Card */}
            <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
                padding: '10px 12px', fontSize: 11, color: '#1e40af', lineHeight: 1.45,
            }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <MessageSquareReply size={14} /> Wait For Customer Reply Fork
                </div>
                The automation pauses at this step. If the contact replies before timeout, execution continues along the <strong style={{ color: '#15803d' }}>Customer Replied</strong> branch. If the wait expires with no reply, it continues along the <strong style={{ color: '#c2410c' }}>Timeout</strong> branch.
            </div>

            {/* Maximum Wait Time (Timeout) */}
            <div>
                <label className={labelCls}>Maximum Wait Time (Timeout)</label>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <input
                            type="number"
                            min={1}
                            className={inputCls}
                            value={timeoutAmount}
                            onChange={e => set('timeout_amount', parseInt(e.target.value, 10) || 1)}
                            placeholder="24"
                        />
                    </div>
                    <div className="flex-1">
                        <select
                            className={selectCls}
                            value={timeoutUnit}
                            onChange={e => set('timeout_unit', e.target.value)}
                        >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reply Matching Filter */}
            <div>
                <label className={labelCls}>Reply Matching Rule</label>
                <select
                    className={selectCls}
                    value={matchType}
                    onChange={e => set('match_type', e.target.value)}
                >
                    <option value="any">Any Customer Reply (Default)</option>
                    <option value="contains">Reply Contains Phrase / Keyword</option>
                    <option value="exact">Reply Exactly Matches Keyword</option>
                </select>
            </div>

            {matchType !== 'any' && (
                <Field label="Target Keyword / Phrase">
                    <input
                        className={inputCls}
                        value={matchPhrase}
                        onChange={e => set('match_phrase', e.target.value)}
                        placeholder="e.g. YES, DEMO, CONFIRM, 1"
                    />
                </Field>
            )}

            {/* Save Reply to Context Variable */}
            <Field label="Save Reply Body to Variable">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{'{{context.'}</span>
                    <input
                        className={inputCls}
                        style={{ flex: 1 }}
                        value={replyVar}
                        onChange={e => set('reply_variable', e.target.value)}
                        placeholder="customer_reply"
                    />
                    <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{'}}'}</span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                    Downstream nodes can read this message text using <code>{'{{context.' + (replyVar || 'customer_reply') + '}}'}</code>.
                </div>
            </Field>

            {/* Branch Routing Preview */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Canvas Branch Handles
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#16a34a' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                        <span><strong>Replied:</strong> Inbound message {matchType !== 'any' && matchPhrase ? `matching "${matchPhrase}"` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#ea580c' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', flexShrink: 0 }} />
                        <span><strong>Timeout:</strong> No message within {timeoutAmount} {timeoutUnit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConditionFields({ d, set }) {
    const { t } = useTranslation();
    const resources = useResources();
    const { triggerNodes = [] } = useContext(NodeActionsContext);

    // Collect trigger names strictly from canvas trigger nodes
    const triggerOptions = (triggerNodes || [])
        .map(n => n.data?.triggerName || (n.data?.label && n.data?.label !== 'Trigger' ? n.data?.label : null))
        .filter(Boolean);

    const formatCustomFieldName = (cf) => {
        if (!cf) return '';
        let name = cf.name || cf.key || '';
        if (cf.key === 'consent_marketing') return 'Consent: Marketing & Promotional Messages';
        if (cf.key === 'consent_transactional') return 'Consent: Transactional Messages';
        if (name.length > 55) {
            return name.slice(0, 52) + '...';
        }
        return name;
    };

    const customFieldFolders = resources.custom_field_folders || [];
    const folderMap = {};
    customFieldFolders.forEach(f => {
        folderMap[f.key] = f.name;
    });

    const customFieldsByFolder = {};
    (resources.custom_fields || []).forEach(cf => {
        const groupKey = cf.field_group || 'other';
        const groupTitle = folderMap[groupKey] || (groupKey === 'contact' ? 'Contact' : groupKey === 'general_info' ? 'General Info' : (groupKey.startsWith('form_') ? 'Form Fields' : 'Custom Fields'));
        if (!customFieldsByFolder[groupTitle]) {
            customFieldsByFolder[groupTitle] = [];
        }
        customFieldsByFolder[groupTitle].push(cf);
    });

    // Initial branches without hardcoded mock strings
    const branches = Array.isArray(d.branches) && d.branches.length > 0
        ? d.branches
        : [
            {
                id: 'branch_0',
                name: 'Branch 1',
                collapsed: false,
                conditions: [{ field: '', operator: 'equals', value: '', logic: 'AND' }],
            },
        ];

    const updateBranches = (nextBranches) => {
        set('branches', nextBranches);
    };

    const addBranch = () => {
        const newId = `branch_${Date.now()}`;
        const newBranch = {
            id: newId,
            name: `Branch ${branches.length + 1}`,
            collapsed: false,
            conditions: [{ field: '', operator: 'equals', value: '', logic: 'AND' }],
        };
        updateBranches([...branches, newBranch]);
    };

    const removeBranch = (branchIdx) => {
        updateBranches(branches.filter((_, idx) => idx !== branchIdx));
    };

    const splitBranchConditions = (branchIdx) => {
        const targetBranch = branches[branchIdx];
        const conds = targetBranch?.conditions || [];
        if (conds.length <= 1) return;

        const newBranchesList = [];
        branches.forEach((b, idx) => {
            if (idx !== branchIdx) {
                newBranchesList.push(b);
            } else {
                conds.forEach((c, cIdx) => {
                    const valName = c.value ? String(c.value) : `${b.name || 'Branch'} (Rule ${cIdx + 1})`;
                    newBranchesList.push({
                        id: cIdx === 0 ? (b.id || `branch_${idx}`) : `branch_${Date.now()}_${cIdx}`,
                        name: valName,
                        collapsed: false,
                        conditions: [{ ...c, logic: 'AND' }],
                    });
                });
            }
        });
        updateBranches(newBranchesList);
        toast.success(`Split into ${conds.length} separate branches!`);
    };

    const updateBranchName = (branchIdx, name) => {
        updateBranches(branches.map((b, idx) => idx === branchIdx ? { ...b, name } : b));
    };

    const toggleBranchCollapse = (branchIdx) => {
        updateBranches(branches.map((b, idx) => idx === branchIdx ? { ...b, collapsed: !b.collapsed } : b));
    };

    const addConditionToBranch = (branchIdx, logic = 'AND') => {
        updateBranches(branches.map((b, idx) => {
            if (idx !== branchIdx) return b;
            return {
                ...b,
                conditions: [...(b.conditions || []), { field: '', operator: 'equals', value: '', logic }],
            };
        }));
    };

    const removeConditionFromBranch = (branchIdx, condIdx) => {
        updateBranches(branches.map((b, idx) => {
            if (idx !== branchIdx) return b;
            return {
                ...b,
                conditions: (b.conditions || []).filter((_, cIdx) => cIdx !== condIdx),
            };
        }));
    };

    const updateCondition = (branchIdx, condIdx, patch) => {
        updateBranches(branches.map((b, idx) => {
            if (idx !== branchIdx) return b;
            const nextConditions = (b.conditions || []).map((c, cIdx) => cIdx === condIdx ? { ...c, ...patch } : c);
            return { ...b, conditions: nextConditions };
        }));
    };

    return (
        <div className="space-y-4">
            {/* Top Action Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={addBranch}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px',
                        borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff',
                        fontSize: 11.5, fontWeight: 600, color: '#334155', cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                >
                    <Plus size={13} /> Add Branch
                </button>
            </div>

            {/* Branch Cards List */}
            {branches.map((branch, bIdx) => (
                <div
                    key={branch.id || bIdx}
                    style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'visible',
                    }}
                >
                    {/* Branch Card Header */}
                    <div style={{
                        padding: '10px 14px', borderBottom: branch.collapsed ? 'none' : '1px solid #f1f5f9',
                        display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa',
                    }}>
                        <GripVertical size={14} style={{ color: '#94a3b8', cursor: 'grab', flexShrink: 0 }} />
                        <input
                            style={{
                                flex: 1, minWidth: 0, fontWeight: 600, fontSize: 13, color: '#0f172a',
                                background: 'transparent', border: 'none', outline: 'none',
                            }}
                            value={branch.name || ''}
                            onChange={e => updateBranchName(bIdx, e.target.value)}
                            placeholder={`Branch ${bIdx + 1}`}
                        />
                        <span style={{ fontSize: 11, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                            {(branch.name || '').length}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {branches.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeBranch(bIdx)}
                                    title="Delete branch"
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 3, display: 'flex' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => toggleBranchCollapse(bIdx)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 3, display: 'flex' }}
                            >
                                <span style={{ transform: branch.collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>▲</span>
                            </button>
                        </div>
                    </div>

                    {/* Branch Conditions Body */}
                    {!branch.collapsed && (
                        <div style={{ padding: 14 }} className="space-y-3">
                            {branch.conditions && branch.conditions.length > 1 && (
                                <div style={{
                                    padding: '8px 12px',
                                    background: '#f5f3ff',
                                    border: '1px solid #ddd6fe',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 8,
                                }}>
                                    <div style={{ fontSize: 11, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Sparkles size={13} style={{ color: '#7c3aed', flexShrink: 0 }} />
                                        <span>Displaying as <strong>{branch.conditions.length} separate branch nodes</strong> on canvas.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => splitBranchConditions(bIdx)}
                                        style={{
                                            fontSize: 10.5,
                                            fontWeight: 700,
                                            color: '#7c3aed',
                                            background: '#fff',
                                            border: '1px solid #c4b5fd',
                                            borderRadius: 6,
                                            padding: '3px 10px',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                        }}
                                    >
                                        Convert to Individual Branches
                                    </button>
                                </div>
                            )}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                                {(branch.conditions || []).map((cond, cIdx) => (
                                    <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: cIdx < (branch.conditions.length - 1) ? 8 : 0 }}>
                                        {/* Dynamic AND / OR Selector for subsequent condition lines */}
                                        {cIdx > 0 ? (
                                            <select
                                                className={selectCls}
                                                style={{
                                                    flex: '0 0 66px', fontSize: 10.5, fontWeight: 700, padding: '6px 4px',
                                                    borderRadius: 6, background: cond.logic === 'OR' ? '#eff6ff' : '#faf5ff',
                                                    color: cond.logic === 'OR' ? '#2563eb' : '#7c3aed',
                                                    border: `1px solid ${cond.logic === 'OR' ? '#bfdbfe' : '#ddd6fe'}`,
                                                }}
                                                value={cond.logic || 'AND'}
                                                onChange={e => updateCondition(bIdx, cIdx, { logic: e.target.value })}
                                            >
                                                <option value="AND">AND</option>
                                                <option value="OR">OR</option>
                                            </select>
                                        ) : (
                                            <div style={{ color: '#94a3b8', flexShrink: 0, width: 20, display: 'flex', justifyContent: 'center' }} title="Initial condition">
                                                <HelpCircle size={15} />
                                            </div>
                                        )}

                                        {/* GoHighLevel-Style Searchable Cascading Field Picker */}
                                        <ConditionFieldPicker
                                            value={cond.field || ''}
                                            customKey={cond.custom_key || ''}
                                            placeholder="Type to search"
                                            categories={CONDITION_CATEGORIES}
                                            customFields={resources.custom_fields || []}
                                            customFieldFolders={resources.custom_field_folders || []}
                                            onChange={({ field, customKey }) => {
                                                updateCondition(bIdx, cIdx, {
                                                    field,
                                                    custom_key: customKey || '',
                                                    value: '',
                                                });
                                            }}
                                            style={{ flex: '0 0 200px' }}
                                        />

                                        {/* Operator Dropdown */}
                                        <select
                                            className={selectCls}
                                            style={{ flex: '0 0 100px', fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                            value={cond.operator || 'equals'}
                                            onChange={e => updateCondition(bIdx, cIdx, { operator: e.target.value })}
                                        >
                                            {CONDITION_OPERATORS.map(o => (
                                                <option key={o.value} value={o.value}>{o.labelKey}</option>
                                            ))}
                                        </select>

                                        {/* Smart Value Selector */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {cond.field === 'trigger.name' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6, borderColor: '#93c5fd' }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Select Workflow Trigger</option>
                                                    {triggerOptions.map((opt, oIdx) => (
                                                        <option key={oIdx} value={opt}>{opt}</option>
                                                    ))}
                                                    {cond.value && !triggerOptions.includes(cond.value) && (
                                                        <option value={cond.value}>{cond.value}</option>
                                                    )}
                                                </select>
                                            ) : cond.field === 'contact.tag' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Select Tag</option>
                                                    {(resources.tags ?? []).map(t => (
                                                        <option key={t.id} value={t.name}>{t.name}</option>
                                                    ))}
                                                </select>
                                            ) : cond.field === 'appointment.status' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Select Status</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="showed">Showed</option>
                                                    <option value="no_show">No Show</option>
                                                    <option value="rescheduled">Rescheduled</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            ) : cond.field === 'appointment.calendar_id' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Select Calendar</option>
                                                    {(resources.calendars ?? []).map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            ) : cond.field === 'opportunity.status' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Select Status</option>
                                                    <option value="open">Open</option>
                                                    <option value="won">Won</option>
                                                    <option value="lost">Lost</option>
                                                    <option value="abandoned">Abandoned</option>
                                                </select>
                                            ) : cond.field === 'opportunity.pipeline_id' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Select Pipeline</option>
                                                    {(resources.pipelines ?? []).map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            ) : cond.field === 'opportunity.stage_id' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Select Stage</option>
                                                    {(resources.pipelines ?? []).map(p => (
                                                        <optgroup key={p.id} label={p.name}>
                                                            {(p.stages || []).map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            ) : cond.field === 'invoice.status' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Select Invoice Status</option>
                                                    <option value="paid">Paid</option>
                                                    <option value="unpaid">Unpaid</option>
                                                    <option value="overdue">Overdue</option>
                                                    <option value="pending">Pending</option>
                                                </select>
                                            ) : cond.field === 'funnel.order_bump' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Order Bump Taken?</option>
                                                    <option value="yes">Yes (Purchased)</option>
                                                    <option value="no">No (Skipped)</option>
                                                </select>
                                            ) : cond.field === 'funnel.variant' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Select Variant</option>
                                                    <option value="A">Variant A</option>
                                                    <option value="B">Variant B</option>
                                                </select>
                                            ) : cond.field === 'form.slug' ? (
                                                <select
                                                    className={selectCls}
                                                    style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                    value={cond.value || ''}
                                                    onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                >
                                                    <option value="">Select Form</option>
                                                    {(resources.subscription_forms ?? []).map(f => (
                                                        <option key={f.id} value={f.slug}>{f.name}</option>
                                                    ))}
                                                </select>
                                            ) : (() => {
                                                const activeCustomKey = cond.field === 'custom.field'
                                                    ? cond.custom_key
                                                    : (cond.field?.startsWith('custom.') ? cond.field.replace('custom.', '') : null);

                                                const activeCustomField = activeCustomKey
                                                    ? (resources.custom_fields || []).find(cf => cf.key === activeCustomKey)
                                                    : null;

                                                if (cond.field === 'custom.field' && !cond.custom_key) {
                                                    return (
                                                        <input
                                                            className={inputCls}
                                                            style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6, color: '#94a3b8' }}
                                                            disabled
                                                            value=""
                                                            placeholder="Select custom field above first..."
                                                        />
                                                    );
                                                }

                                                if (activeCustomField && activeCustomField.options && activeCustomField.options.length > 0) {
                                                    return (
                                                        <select
                                                            className={selectCls}
                                                            style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                            value={cond.value || ''}
                                                            onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                        >
                                                            <option value="">Select Option</option>
                                                            {activeCustomField.options.map((opt, oIdx) => (
                                                                <option key={oIdx} value={typeof opt === 'object' ? opt.value : opt}>
                                                                    {typeof opt === 'object' ? (opt.label || opt.value) : opt}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    );
                                                }

                                                if (activeCustomField && (activeCustomField.key?.startsWith('consent_') || activeCustomField.type === 'checkbox' || activeCustomField.type === 'boolean' || activeCustomField.type === 'gdpr')) {
                                                    return (
                                                        <select
                                                            className={selectCls}
                                                            style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                            value={cond.value || ''}
                                                            onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                        >
                                                            <option value="">Select State</option>
                                                            <option value="yes">Yes (Consented / Checked)</option>
                                                            <option value="no">No (Unchecked / Declined)</option>
                                                        </select>
                                                    );
                                                }

                                                if (activeCustomField && activeCustomField.type === 'date') {
                                                    return (
                                                        <input
                                                            type="date"
                                                            className={inputCls}
                                                            style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                            value={cond.value || ''}
                                                            onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                        />
                                                    );
                                                }

                                                if (activeCustomField && activeCustomField.type === 'number') {
                                                    return (
                                                        <input
                                                            type="number"
                                                            className={inputCls}
                                                            style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                            value={cond.value || ''}
                                                            onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                            placeholder="Enter number..."
                                                        />
                                                    );
                                                }

                                                return (
                                                    <input
                                                        className={inputCls}
                                                        style={{ fontSize: 11, padding: '7px 8px', borderRadius: 6 }}
                                                        value={cond.value || ''}
                                                        onChange={e => updateCondition(bIdx, cIdx, { value: e.target.value })}
                                                        placeholder="Enter value..."
                                                    />
                                                );
                                            })()}
                                        </div>

                                        {branch.conditions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeConditionFromBranch(bIdx, cIdx)}
                                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2, display: 'flex' }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* AND / OR condition rule buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                                    <button
                                        type="button"
                                        onClick={() => addConditionToBranch(bIdx, 'AND')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px',
                                            borderRadius: 6, border: '1px solid #ddd6fe', background: '#faf5ff',
                                            fontSize: 11, fontWeight: 700, color: '#7c3aed', cursor: 'pointer',
                                        }}
                                    >
                                        AND <Plus size={11} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addConditionToBranch(bIdx, 'OR')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px',
                                            borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff',
                                            fontSize: 11, fontWeight: 700, color: '#2563eb', cursor: 'pointer',
                                        }}
                                    >
                                        OR <Plus size={11} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Bottom Add Branch Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6 }}>
                <button
                    type="button"
                    onClick={addBranch}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px',
                        borderRadius: 8, border: '1px solid #bfdbfe', background: '#eff6ff',
                        fontSize: 12, fontWeight: 600, color: '#2563eb', cursor: 'pointer',
                    }}
                >
                    <Plus size={13} /> Add Branch
                </button>
            </div>

            {/* None Branch Card (Default Fallback) */}
            <div style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 14,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <GripVertical size={14} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>None Branch</span>
                </div>
                <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 8, marginLeft: 22 }}>
                    When no condition is met
                </div>
                <input
                    className={inputCls}
                    style={{ marginLeft: 22, width: 'calc(100% - 22px)' }}
                    value={d.noneBranchName || 'None'}
                    onChange={e => set('noneBranchName', e.target.value)}
                    placeholder="None"
                />
            </div>
        </div>
    );
}

function TagFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    return (
        <InlineTokenInput
            label={t('automation.field_tag_name_required')}
            required={true}
            value={d.tag ?? ''}
            onChange={val => set('tag', val)}
            placeholder={t('automation.placeholder_tag_name')}
            triggerType={triggerType}
        />
    );
}

function UpdateContactFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    return (
        <>
            <Field label={t('automation.field_field_to_update_required')}>
                <select className={selectCls} value={d.field ?? ''} onChange={e => set('field', e.target.value)}>
                    <option value="">{t('automation.select_field')}</option>
                    {UPDATE_FIELDS.map(f => <option key={f.value} value={f.value}>{t(f.labelKey)}</option>)}
                </select>
            </Field>
            <InlineTokenInput
                label={t('automation.field_new_value_required')}
                required={true}
                value={d.value ?? ''}
                onChange={val => set('value', val)}
                placeholder={t('automation.placeholder_new_value', { token: '{{token}}' })}
                triggerType={triggerType}
            />
        </>
    );
}

function CampaignFields({ d, set }) {
    const { t } = useTranslation();
    const { campaigns = [] } = useResources();
    return (
        <Field label={t('automation.field_campaign_required')}>
            {campaigns.length ? (
                <select className={selectCls} value={d.campaign_id ?? ''} onChange={e => set('campaign_id', e.target.value)}>
                    <option value="">{t('automation.select_campaign')}</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            ) : (
                <input type="number" className={inputCls} value={d.campaign_id ?? ''} onChange={e => set('campaign_id', e.target.value)} placeholder="123" />
            )}
        </Field>
    );
}

function SubflowFields({ d, set }) {
    const { t } = useTranslation();
    const { subflows = [] } = useResources();
    const mode = d.mode ?? 'fire_and_forget';
    const passContext = d.pass_context ?? true;

    const pick = (uuid) => {
        set('automation_uuid', uuid);
        set('subflow_name', subflows.find(s => s.uuid === uuid)?.name ?? '');
    };

    return (
        <div className="space-y-4">
            <Field label={t('automation.field_subflow_required')}>
                {subflows.length ? (
                    <select className={selectCls} value={d.automation_uuid ?? ''} onChange={e => pick(e.target.value)}>
                        <option value="">{t('automation.select_subflow')}</option>
                        {subflows.map(s => <option key={s.uuid} value={s.uuid}>{s.name}{s.status !== 'active' ? ` (${s.status})` : ''}</option>)}
                    </select>
                ) : (
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{t('automation.no_subflows')}</p>
                )}
            </Field>

            {/* Execution Mode */}
            <div>
                <label className={labelCls}>Sub-Workflow Execution Mode</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    <label style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px',
                        borderRadius: 8, border: `1px solid ${mode === 'wait_completion' ? '#6366f1' : '#e2e8f0'}`,
                        background: mode === 'wait_completion' ? '#f5f3ff' : '#fff', cursor: 'pointer',
                    }}>
                        <input
                            type="radio"
                            name="subflow_mode"
                            value="wait_completion"
                            checked={mode === 'wait_completion'}
                            onChange={() => set('mode', 'wait_completion')}
                            style={{ marginTop: 2, accentColor: '#6366f1' }}
                        />
                        <div>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>
                                ⏳ Wait for Sub-Workflow to Finish (Nested)
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
                                Pauses this parent workflow until the child workflow completes, then resumes downstream steps.
                            </div>
                        </div>
                    </label>

                    <label style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px',
                        borderRadius: 8, border: `1px solid ${mode === 'fire_and_forget' ? '#6366f1' : '#e2e8f0'}`,
                        background: mode === 'fire_and_forget' ? '#f5f3ff' : '#fff', cursor: 'pointer',
                    }}>
                        <input
                            type="radio"
                            name="subflow_mode"
                            value="fire_and_forget"
                            checked={mode === 'fire_and_forget'}
                            onChange={() => set('mode', 'fire_and_forget')}
                            style={{ marginTop: 2, accentColor: '#6366f1' }}
                        />
                        <div>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>
                                ⚡ Run in Background (Parallel)
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
                                Triggers the sub-workflow in parallel while this parent workflow continues immediately.
                            </div>
                        </div>
                    </label>

                    <label style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px',
                        borderRadius: 8, border: `1px solid ${mode === 'handoff' ? '#6366f1' : '#e2e8f0'}`,
                        background: mode === 'handoff' ? '#f5f3ff' : '#fff', cursor: 'pointer',
                    }}>
                        <input
                            type="radio"
                            name="subflow_mode"
                            value="handoff"
                            checked={mode === 'handoff'}
                            onChange={() => set('mode', 'handoff')}
                            style={{ marginTop: 2, accentColor: '#6366f1' }}
                        />
                        <div>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>
                                🔀 Permanent Hand-off (Transfer)
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
                                Hands the contact off to the sub-workflow and completes this parent workflow here.
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Pass Context */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={Boolean(passContext)}
                        onChange={e => set('pass_context', e.target.checked)}
                        style={{ accentColor: '#6366f1', width: 15, height: 15 }}
                    />
                    Inherit Context & Contact Data
                </label>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, marginLeft: 23 }}>
                    Carries active session variables and contact metadata into the sub-workflow run.
                </div>
            </div>
        </div>
    );
}

function RemoveFromWorkflowFields({ d, set }) {
    const { t } = useTranslation();
    const resources = useResources();
    const automations = resources.workflows || resources.subflows || [];
    const targetType = d.target_type ?? 'current';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px' }}>
                Removes the Contact from a specific workflow
            </p>

            <Field label="WORKFLOW">
                <select
                    className={selectCls}
                    value={targetType === 'specific' ? 'another' : targetType}
                    onChange={e => set('target_type', e.target.value)}
                >
                    <option value="current">Current workflow</option>
                    <option value="another">Another workflow</option>
                    <option value="all_except_current">All workflows except current workflow</option>
                    <option value="all">All workflows</option>
                </select>
            </Field>

            {(targetType === 'another' || targetType === 'specific') && (
                <Field label="Select Workflow">
                    <select
                        className={selectCls}
                        value={d.target_automation_id ?? ''}
                        onChange={e => {
                            const selectedId = e.target.value;
                            const found = automations.find(a => String(a.id) === String(selectedId) || a.uuid === selectedId);
                            set({
                                target_automation_id: selectedId,
                                target_automation_name: found?.name || '',
                            });
                        }}
                    >
                        <option value="">Select a Workflow to unenroll contact from...</option>
                        {automations.map(a => (
                            <option key={a.id || a.uuid} value={a.id || a.uuid}>
                                {a.name} ({a.status})
                            </option>
                        ))}
                    </select>
                </Field>
            )}

            <Field label="Exit Reason (Recorded in audit logs)">
                <input
                    className={inputCls}
                    value={d.reason ?? ''}
                    onChange={e => set('reason', e.target.value)}
                    placeholder="e.g. Customer replied, Goal achieved, Deal won"
                />
            </Field>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#475569', lineHeight: 1.4 }}>
                {targetType === 'current' && '🚪 Halts this workflow run immediately. Any downstream actions or scheduled timers are cancelled for this contact.'}
                {(targetType === 'another' || targetType === 'specific') && '🔀 Cancels active runs and pending scheduled delays in the chosen workflow for this contact, while this workflow continues.'}
                {targetType === 'all_except_current' && '⚡ Cancels active runs and scheduled delays across all other workflows for this contact, allowing this workflow to continue (ideal for reply handling & task assignment).'}
                {targetType === 'all' && '🛑 Cancels all pending delays, scheduled follow-ups, and active runs across all automations in this workspace.'}
            </div>
        </div>
    );
}

function AIReplyFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    const { chatbots = [] } = useResources();
    return (
        <>
            <Field label={t('automation.field_chatbot_optional')}>
                <select className={selectCls} value={d.chatbot_id ?? ''} onChange={e => set('chatbot_id', e.target.value)}>
                    <option value="">{t('automation.ai_use_prompt')}</option>
                    {chatbots.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </Field>
            <InlineTokenTextarea
                label={d.chatbot_id ? t('automation.field_prompt_optional') : t('automation.field_prompt_instructions_required')}
                rows={5}
                value={d.prompt ?? ''}
                onChange={val => set('prompt', val)}
                placeholder={t('automation.placeholder_ai_prompt')}
                triggerType={triggerType}
            />
            <ChannelSelect d={d} set={set} />
        </>
    );
}

function RunChatbotFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    const { chatbots = [] } = useResources();
    return (
        <>
            <Field label={t('automation.field_chatbot_required')}>
                {chatbots.length ? (
                    <select className={selectCls} value={d.chatbot_id ?? ''} onChange={e => set('chatbot_id', e.target.value)}>
                        <option value="">{t('automation.select_chatbot')}</option>
                        {chatbots.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                ) : (
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{t('automation.no_chatbots')}</p>
                )}
            </Field>
            <InlineTokenTextarea
                label={t('automation.field_prompt_optional')}
                rows={3}
                value={d.prompt ?? ''}
                onChange={val => set('prompt', val)}
                placeholder={t('automation.placeholder_chatbot_prompt')}
                triggerType={triggerType}
            />
            <ChannelSelect d={d} set={set} />
        </>
    );
}

function AssignAgentFields({ d, set }) {
    const { t } = useTranslation();
    const { agents = [] } = useResources();
    const pick = (id) => {
        set('user_id', id);
        set('agent_name', agents.find(a => String(a.id) === String(id))?.name ?? '');
    };
    return (
        <Field label={t('automation.field_assign_to')}>
            <select className={selectCls} value={d.user_id ?? ''} onChange={e => pick(e.target.value)}>
                <option value="">{t('automation.assign_unassigned')}</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
        </Field>
    );
}

function CtaButtonFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    return (
        <>
            <InlineTokenTextarea
                label={t('automation.field_message_body_required')}
                required={true}
                rows={3}
                value={d.body ?? ''}
                onChange={val => set('body', val)}
                placeholder={t('automation.placeholder_cta_body')}
                triggerType={triggerType}
            />
            <Field label={t('automation.field_button_text_required')}>
                <input className={inputCls} maxLength={20} value={d.display_text ?? ''} onChange={e => set('display_text', e.target.value)} placeholder={t('automation.placeholder_button_text')} />
            </Field>
            <InlineTokenInput
                label={t('automation.field_url_required')}
                required={true}
                value={d.url ?? ''}
                onChange={val => set('url', val)}
                placeholder="https://example.com"
                triggerType={triggerType}
            />
        </>
    );
}

function LocationFields({ d, set }) {
    const { t } = useTranslation();
    return (
        <>
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className={labelCls}>{t('automation.field_latitude_required')}</label>
                    <input className={inputCls} value={d.latitude ?? ''} onChange={e => set('latitude', e.target.value)} placeholder="37.4220" />
                </div>
                <div className="flex-1">
                    <label className={labelCls}>{t('automation.field_longitude_required')}</label>
                    <input className={inputCls} value={d.longitude ?? ''} onChange={e => set('longitude', e.target.value)} placeholder="-122.0841" />
                </div>
            </div>
            <Field label={t('automation.field_place_name_optional')}>
                <input className={inputCls} value={d.name ?? ''} onChange={e => set('name', e.target.value)} placeholder={t('automation.placeholder_place_name')} />
            </Field>
            <Field label={t('automation.field_address_optional')}>
                <input className={inputCls} value={d.address ?? ''} onChange={e => set('address', e.target.value)} placeholder={t('automation.placeholder_address')} />
            </Field>
        </>
    );
}

function PollFields({ d, set }) {
    const { t } = useTranslation();
    return (
        <>
            <Field label={t('automation.field_question_required')}>
                <textarea className={textareaCls} rows={2} value={d.question ?? ''} onChange={e => set('question', e.target.value)} placeholder={t('automation.placeholder_poll_question')} />
            </Field>
            <Field label={t('automation.field_poll_options_required')}>
                <textarea className={textareaCls} rows={4} value={d.options ?? ''} onChange={e => set('options', e.target.value)} placeholder={t('automation.placeholder_poll_options')} />
            </Field>
            <p style={{ fontSize: 10, color: '#64748b' }}>{t('automation.poll_hint')}</p>
        </>
    );
}

function BookAppointmentFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    return (
        <>
            <GoogleWarning />
            <InlineTokenInput
                label={t('automation.field_summary_required')}
                required={true}
                value={d.summary ?? ''}
                onChange={val => set('summary', val)}
                placeholder={t('automation.placeholder_appointment_summary')}
                triggerType={triggerType}
            />
            <InlineTokenInput
                label={t('automation.field_start_required')}
                required={true}
                value={d.start ?? ''}
                onChange={val => set('start', val)}
                placeholder="2026-07-01 14:00 or {{context.start}}"
                triggerType={triggerType}
            />
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className={labelCls}>{t('automation.field_duration_min')}</label>
                    <input type="number" min={1} className={inputCls} value={d.duration_minutes ?? ''} onChange={e => set('duration_minutes', e.target.value)} placeholder="30" />
                </div>
                <div className="flex-1">
                    <label className={labelCls}>{t('automation.field_timezone_optional')}</label>
                    <input className={inputCls} value={d.timezone ?? ''} onChange={e => set('timezone', e.target.value)} placeholder="UTC" />
                </div>
            </div>
            <Field label={t('automation.field_calendar_id_optional')}>
                <input className={inputCls} value={d.calendar_id ?? ''} onChange={e => set('calendar_id', e.target.value)} placeholder="primary" />
            </Field>
            <CheckField label={t('automation.field_send_confirmation')} checked={d.send_confirmation} onChange={v => set('send_confirmation', v)} />
        </>
    );
}

function GoogleMeetFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    return (
        <>
            <GoogleWarning />
            <InlineTokenInput
                label={t('automation.field_summary_required')}
                required={true}
                value={d.summary ?? ''}
                onChange={val => set('summary', val)}
                placeholder={t('automation.placeholder_meeting_summary')}
                triggerType={triggerType}
            />
            <InlineTokenInput
                label={t('automation.field_start_required')}
                required={true}
                value={d.start ?? ''}
                onChange={val => set('start', val)}
                placeholder="2026-07-01 14:00 or {{context.start}}"
                triggerType={triggerType}
            />
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className={labelCls}>{t('automation.field_duration_min')}</label>
                    <input type="number" min={1} className={inputCls} value={d.duration_minutes ?? ''} onChange={e => set('duration_minutes', e.target.value)} placeholder="30" />
                </div>
                <div className="flex-1">
                    <label className={labelCls}>{t('automation.field_timezone_optional')}</label>
                    <input className={inputCls} value={d.timezone ?? ''} onChange={e => set('timezone', e.target.value)} placeholder="UTC" />
                </div>
            </div>
            <CheckField label={t('automation.field_send_link')} checked={d.send_link ?? true} onChange={v => set('send_link', v)} />
        </>
    );
}

function WhatsappFormFields({ d, set }) {
    const { t } = useTranslation();
    return (
        <>
            <Field label={t('automation.field_flow_id_required')}>
                <input className={inputCls} value={d.flow_id ?? ''} onChange={e => set('flow_id', e.target.value)} placeholder="1234567890" />
            </Field>
            <Field label={t('automation.field_message_body_required')}>
                <textarea className={textareaCls} rows={3} value={d.body ?? ''} onChange={e => set('body', e.target.value)} placeholder={t('automation.placeholder_form_body')} />
            </Field>
            <Field label={t('automation.field_flow_cta')}>
                <input className={inputCls} maxLength={20} value={d.flow_cta ?? ''} onChange={e => set('flow_cta', e.target.value)} placeholder={t('automation.placeholder_flow_cta')} />
            </Field>
            <Field label={t('automation.field_flow_screen_optional')}>
                <input className={inputCls} value={d.screen ?? ''} onChange={e => set('screen', e.target.value)} placeholder="WELCOME_SCREEN" />
            </Field>
        </>
    );
}

function WhatsappCatalogFields({ d, set }) {
    const { t } = useTranslation();
    return (
        <>
            <Field label={t('automation.field_message_body_required')}>
                <textarea className={textareaCls} rows={3} value={d.body ?? ''} onChange={e => set('body', e.target.value)} placeholder={t('automation.placeholder_catalog_body')} />
            </Field>
            <Field label={t('automation.field_thumbnail_product_optional')}>
                <input className={inputCls} value={d.thumbnail_product_retailer_id ?? ''} onChange={e => set('thumbnail_product_retailer_id', e.target.value)} placeholder="SKU_123" />
            </Field>
        </>
    );
}

function ProductFields({ d, set, platform }) {
    const { t } = useTranslation();
    const { stores = [] } = useResources();
    const platformStores = stores.filter(s => s.platform === platform);
    return (
        <>
            <Field label={t('automation.field_store_required')}>
                {platformStores.length ? (
                    <select className={selectCls} value={d.store_id ?? ''} onChange={e => set('store_id', e.target.value)}>
                        <option value="">{t('automation.select_store')}</option>
                        {platformStores.map(s => <option key={s.id} value={s.id}>{s.name || s.platform}</option>)}
                    </select>
                ) : (
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{t('automation.no_stores', { platform })}</p>
                )}
            </Field>
            <Field label={t('automation.field_product_id_required')}>
                <input className={inputCls} value={d.product_id ?? ''} onChange={e => set('product_id', e.target.value)} placeholder={t('automation.placeholder_product_id')} />
            </Field>
            <Field label={t('automation.field_intro_text_optional')}>
                <textarea className={textareaCls} rows={2} value={d.body ?? ''} onChange={e => set('body', e.target.value)} placeholder={t('automation.placeholder_product_intro')} />
            </Field>
        </>
    );
}

function GoogleSheetsFields({ d, set }) {
    const { t } = useTranslation();
    const mode = d.mode ?? 'append';
    return (
        <>
            <GoogleWarning />
            <Field label={t('automation.field_sheets_mode')}>
                <select className={selectCls} value={mode} onChange={e => set('mode', e.target.value)}>
                    <option value="append">{t('automation.sheets_append')}</option>
                    <option value="read">{t('automation.sheets_read')}</option>
                </select>
            </Field>
            <Field label={t('automation.field_spreadsheet_id_required')}>
                <input className={inputCls} value={d.spreadsheet_id ?? ''} onChange={e => set('spreadsheet_id', e.target.value)} placeholder="1AbC...xyz" />
            </Field>
            <Field label={t('automation.field_range_required')}>
                <input className={inputCls} value={d.range ?? ''} onChange={e => set('range', e.target.value)} placeholder="Sheet1!A:D" />
            </Field>
            {mode === 'append' ? (
                <Field label={t('automation.field_row_values_required')}>
                    <textarea className={textareaCls} rows={4} value={d.values ?? ''} onChange={e => set('values', e.target.value)} placeholder={t('automation.placeholder_row_values')} />
                </Field>
            ) : (
                <Field label={t('automation.field_result_var')}>
                    <input className={inputCls} value={d.result_var ?? ''} onChange={e => set('result_var', e.target.value)} placeholder="sheet" />
                </Field>
            )}
        </>
    );
}

function GoogleDocsFields({ d, set }) {
    const { t } = useTranslation();
    return (
        <>
            <GoogleWarning />
            <Field label={t('automation.field_template_doc_id_required')}>
                <input className={inputCls} value={d.template_doc_id ?? ''} onChange={e => set('template_doc_id', e.target.value)} placeholder="1AbC...xyz" />
            </Field>
            <Field label={t('automation.field_doc_title')}>
                <input className={inputCls} value={d.title ?? ''} onChange={e => set('title', e.target.value)} placeholder={t('automation.placeholder_doc_title', { token: '{{contact.name}}' })} />
            </Field>
            <Field label={t('automation.field_replacements_optional')}>
                <textarea className={textareaCls} rows={4} value={d.replacements ?? ''} onChange={e => set('replacements', e.target.value)} placeholder={t('automation.placeholder_replacements')} />
            </Field>
            <CheckField label={t('automation.field_send_doc_link')} checked={d.send_link} onChange={v => set('send_link', v)} />
        </>
    );
}

function GoogleFormsFields({ d, set }) {
    const { t } = useTranslation();
    const mode = d.mode ?? 'send_link';
    return (
        <>
            <GoogleWarning />
            <Field label={t('automation.field_forms_mode')}>
                <select className={selectCls} value={mode} onChange={e => set('mode', e.target.value)}>
                    <option value="send_link">{t('automation.forms_send_link')}</option>
                    <option value="read_response">{t('automation.forms_read_response')}</option>
                </select>
            </Field>
            <Field label={t('automation.field_form_id_required')}>
                <input className={inputCls} value={d.form_id ?? ''} onChange={e => set('form_id', e.target.value)} placeholder="1AbC...xyz" />
            </Field>
            {mode === 'send_link' ? (
                <>
                    <Field label={t('automation.field_message_body_optional')}>
                        <textarea className={textareaCls} rows={2} value={d.body ?? ''} onChange={e => set('body', e.target.value)} placeholder={t('automation.placeholder_form_intro')} />
                    </Field>
                    <CheckField label={t('automation.field_send_form_link')} checked={d.send_link ?? true} onChange={v => set('send_link', v)} />
                </>
            ) : (
                <Field label={t('automation.field_result_var')}>
                    <input className={inputCls} value={d.result_var ?? ''} onChange={e => set('result_var', e.target.value)} placeholder="form" />
                </Field>
            )}
        </>
    );
}

function InternalNotificationFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    const resources = useResources();
    const notificationType = d.notification_type ?? 'email';
    const sendTo = d.send_to ?? 'user';

    return (
        <>
            <Field label="Action Name">
                <input
                    className={inputCls}
                    value={d.label ?? 'Internal Notification'}
                    onChange={e => set('label', e.target.value)}
                    placeholder="Internal Notification"
                />
            </Field>

            <Field label="Type of Notification">
                <select
                    className={selectCls}
                    value={notificationType}
                    onChange={e => set('notification_type', e.target.value)}
                >
                    <option value="email">Email Notification</option>
                    <option value="notification">In-App System Notification</option>
                    <option value="sms">SMS Alert</option>
                    <option value="whatsapp">WhatsApp Alert</option>
                </select>
            </Field>

            <Field label="Send To">
                <select
                    className={selectCls}
                    value={sendTo}
                    onChange={e => set('send_to', e.target.value)}
                >
                    <option value="user">Specific Team Member / User</option>
                    <option value="assigned_user">Assigned Contact Owner / Agent</option>
                    <option value="custom_email">Custom Email Address(es)</option>
                    <option value="custom_phone">Custom Mobile Number(s)</option>
                </select>
            </Field>

            {sendTo === 'user' && (
                <Field label="Select User / Agent">
                    <select
                        className={selectCls}
                        value={d.user_id ?? ''}
                        onChange={e => set('user_id', e.target.value ? parseInt(e.target.value, 10) : null)}
                    >
                        <option value="">Select a Workspace User</option>
                        {(resources.agents ?? []).map(u => (
                            <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                            </option>
                        ))}
                    </select>
                </Field>
            )}

            {(sendTo === 'custom_email' || sendTo === 'custom_phone') && (
                <InlineTokenInput
                    label={sendTo === 'custom_email' ? "Recipient Email Address(es)" : "Recipient Mobile Number(s)"}
                    value={d.to_address ?? ''}
                    onChange={val => set('to_address', val)}
                    placeholder={sendTo === 'custom_email' ? "e.g. sales@company.com, {{user.email}}" : "e.g. +1234567890, {{contact.phone}}"}
                    triggerType={triggerType}
                />
            )}

            {(notificationType === 'email' || notificationType === 'notification') && (
                <InlineTokenInput
                    label="Notification Title / Subject"
                    value={d.subject ?? d.title ?? ''}
                    onChange={val => set('subject', val)}
                    placeholder="e.g. New Lead Form Submission: {{contact.name}}"
                    triggerType={triggerType}
                />
            )}

            {notificationType === 'email' ? (
                <Field label="Message / Notification Body">
                    <RichMessageEditor
                        value={d.body ?? ''}
                        onChange={val => set('body', val)}
                        onSelectTemplate={tpl => {
                            if (tpl.subject && !(d.subject || d.title)) {
                                set('subject', tpl.subject);
                            }
                        }}
                        placeholder="e.g. New lead {{contact.name}} ({{contact.email}}) submitted form {{context.form_name}}!"
                    />
                </Field>
            ) : (
                <InlineTokenTextarea
                    label="Message / Notification Body"
                    required={true}
                    rows={4}
                    value={d.body ?? ''}
                    onChange={val => set('body', val)}
                    placeholder="e.g. New lead {{contact.name}} ({{contact.email}}) submitted form {{context.form_name}}!"
                    triggerType={triggerType}
                />
            )}
        </>
    );
}

function WebhookFields({ d, set, triggerType }) {
    const { t } = useTranslation();
    return (
        <>
            <InlineTokenInput
                label={t('automation.field_url_required')}
                required={true}
                value={d.url ?? ''}
                onChange={val => set('url', val)}
                placeholder="https://example.com/webhook"
                triggerType={triggerType}
            />
            <Field label={t('automation.field_method')}>
                <select className={selectCls} value={d.method ?? 'POST'} onChange={e => set('method', e.target.value)}>
                    <option>POST</option>
                    <option>GET</option>
                    <option>PUT</option>
                    <option>PATCH</option>
                </select>
            </Field>
            <InlineTokenTextarea
                label={t('automation.field_headers_json_optional')}
                rows={3}
                value={d.headers ?? ''}
                onChange={val => set('headers', val)}
                placeholder={'{"Authorization": "Bearer {{token}}"}'}
                triggerType={triggerType}
            />
            <InlineTokenTextarea
                label={t('automation.field_payload_json_optional')}
                rows={4}
                value={d.payload ?? ''}
                onChange={val => set('payload', val)}
                placeholder={'{"contact_id": "{{contact.id}}"}'}
                triggerType={triggerType}
            />
        </>
    );
}

function CreateOpportunityFields({ d, set, triggerType }) {
    const { pipelines = [], agents = [] } = useResources();
    const selectedPipeline = pipelines.find(p => p.id === parseInt(d.pipeline_id, 10)) || pipelines[0];
    const stages = selectedPipeline?.stages || [];

    return (
        <>
            <Field label="Select Target Pipeline">
                <select
                    className={selectCls}
                    value={d.pipeline_id ?? (selectedPipeline?.id || '')}
                    onChange={e => {
                        const pid = parseInt(e.target.value, 10);
                        const p = pipelines.find(x => x.id === pid);
                        const firstStageId = p?.stages?.[0]?.id || null;
                        set({ pipeline_id: pid, stage_id: firstStageId });
                    }}
                >
                    {pipelines.map(p => (
                        <option key={p.id} value={p.id}>{p.name} {p.is_default ? '(Default)' : ''}</option>
                    ))}
                </select>
            </Field>

            <Field label="Target Pipeline Stage">
                <select
                    className={selectCls}
                    value={d.stage_id ?? (stages[0]?.id || '')}
                    onChange={e => set('stage_id', parseInt(e.target.value, 10))}
                >
                    {stages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </Field>

            <InlineTokenInput
                label="Opportunity Title"
                value={d.name ?? ''}
                onChange={val => set('name', val)}
                placeholder="e.g. Lead - {{contact.name}}"
                triggerType={triggerType}
            />

            <InlineTokenInput
                label="Monetary Value ($)"
                value={d.monetary_value ?? ''}
                onChange={val => set('monetary_value', val)}
                placeholder="e.g. 500 or {{context.deal_amount}}"
                triggerType={triggerType}
            />

            <Field label="Assigned Sales Agent">
                <select
                    className={selectCls}
                    value={d.assigned_user_id ?? ''}
                    onChange={e => set('assigned_user_id', e.target.value ? parseInt(e.target.value, 10) : null)}
                >
                    <option value="">Unassigned</option>
                    {agents.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </Field>

            <Field label="Opportunity Status">
                <select
                    className={selectCls}
                    value={d.status ?? 'open'}
                    onChange={e => set('status', e.target.value)}
                >
                    <option value="open">🟢 Open (In Progress)</option>
                    <option value="won">🏆 Closed Won (Converted)</option>
                    <option value="lost">🔴 Closed Lost</option>
                    <option value="abandoned">⚪ Abandoned</option>
                </select>
            </Field>

            {(d.status === 'lost' || d.status === 'abandoned') && (
                <InlineTokenInput
                    label={d.status === 'lost' ? 'Lost Reason' : 'Abandonment Reason'}
                    value={d.lost_reason ?? ''}
                    onChange={val => set('lost_reason', val)}
                    placeholder="e.g. Competitor Chosen, Price, {{message.body}}"
                    triggerType={triggerType}
                />
            )}

            <Field label="Status Overwrite Policy">
                <select
                    className={selectCls}
                    value={d.status_policy ?? 'preserve_if_won'}
                    onChange={e => set('status_policy', e.target.value)}
                >
                    <option value="preserve_if_won">🛡️ Don't overwrite if deal is already Won</option>
                    <option value="always_update">⚡ Always update status</option>
                    <option value="keep_existing">🔒 Leave existing status unchanged on existing deals</option>
                </select>
            </Field>
        </>
    );
}

function ChangeStageFields({ d, set }) {
    const { pipelines = [] } = useResources();
    const selectedPipeline = pipelines.find(p => p.id === parseInt(d.pipeline_id, 10)) || pipelines[0];
    const stages = selectedPipeline?.stages || [];

    return (
        <>
            <Field label="Select Pipeline">
                <select
                    className={selectCls}
                    value={d.pipeline_id ?? (selectedPipeline?.id || '')}
                    onChange={e => {
                        const pid = parseInt(e.target.value, 10);
                        const p = pipelines.find(x => x.id === pid);
                        const firstStageId = p?.stages?.[0]?.id || null;
                        set({ pipeline_id: pid, stage_id: firstStageId });
                    }}
                >
                    {pipelines.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </Field>

            <Field label="New Target Stage">
                <select
                    className={selectCls}
                    value={d.stage_id ?? (stages[0]?.id || '')}
                    onChange={e => set('stage_id', parseInt(e.target.value, 10))}
                >
                    {stages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </Field>
        </>
    );
}

function UpdateOpportunityStatusFields({ d, set, triggerType }) {
    return (
        <>
            <Field label="Target Opportunity Outcome Status">
                <select
                    className={selectCls}
                    value={d.status ?? 'won'}
                    onChange={e => set('status', e.target.value)}
                >
                    <option value="won">🏆 Closed Won</option>
                    <option value="lost">🔴 Closed Lost</option>
                    <option value="abandoned">⚪ Abandoned</option>
                    <option value="open">🟢 Open</option>
                </select>
            </Field>

            {(d.status === 'lost' || d.status === 'abandoned') && (
                <InlineTokenInput
                    label={d.status === 'lost' ? 'Lost Reason' : 'Abandonment Reason'}
                    value={d.lost_reason ?? ''}
                    onChange={val => set('lost_reason', val)}
                    placeholder="e.g. Disqualified, Ghosted, {{message.body}}"
                    triggerType={triggerType}
                />
            )}
        </>
    );
}

/* ─── Edge defaults ──────────────────────────────────────────── */
const defaultEdgeOptions = {
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
};

/* ─── Builder Inner ──────────────────────────────────────────── */
function makeNode(type, existingCount, position) {
    const id = `${type}-${Date.now()}`;
    return {
        id,
        type: 'automationNode',
        position: position ?? { x: 300, y: 200 + existingCount * 100 },
        data: {
            nodeType: type,
            label: '',
            configured: false,
            ...(type === 'condition' ? {
                branches: [
                    {
                        id: 'branch_0',
                        name: 'Branch 1',
                        collapsed: false,
                        conditions: [{ field: '', operator: 'equals', value: '', logic: 'AND' }],
                    },
                ],
            } : {}),
        },
    };
}

function serializeNodes(nodes) {
    return nodes.map(n => ({
        id: n.id,
        type: n.data?.nodeType ?? n.type,
        position: n.position,
        data: n.data,
    }));
}

const TRIGGER_NODE_ID = 'trigger-1';

function deserializeNodes(raw) {
    return (raw ?? []).map(n => {
        // The trigger node is seeded by the backend as type 'trigger'; older saves use 'triggerNode'.
        if (n.data?.triggerType !== undefined || n.type === 'triggerNode' || n.type === 'trigger') {
            return { ...n, type: 'triggerNode', deletable: false, data: { ...n.data } };
        }
        return {
            ...n,
            type: 'automationNode',
            data: { ...n.data, nodeType: n.data?.nodeType ?? n.type },
        };
    });
}

// Guarantee a single, non-deletable trigger node anchored at the top of the canvas, with its
// display synced to the automation's trigger_type (the backend source of truth).
function withTriggerNodes(nodes, defaultTriggerType, defaultTriggerConfig = {}) {
    const hasTriggers = nodes.some(n => n.type === 'triggerNode' || n.type === 'trigger');
    if (!hasTriggers) {
        return [
            {
                id: TRIGGER_NODE_ID,
                type: 'triggerNode',
                position: { x: 250, y: 50 },
                deletable: true,
                data: {
                    triggerType: defaultTriggerType || 'form.submitted',
                    triggerConfig: defaultTriggerConfig || {},
                    label: 'Trigger',
                },
            },
            ...nodes,
        ];
    }
    return nodes.map(n => {
        if (n.type === 'triggerNode' || n.type === 'trigger') {
            return {
                ...n,
                type: 'triggerNode',
                deletable: true,
                data: {
                    ...n.data,
                    triggerType: n.data?.triggerType ?? n.data?.trigger_type ?? defaultTriggerType,
                    triggerConfig: n.data?.triggerConfig ?? n.data?.trigger_config ?? defaultTriggerConfig,
                },
            };
        }
        return n;
    });
}

/* ─── Test & AI Generate modals ──────────────────────────────── */
const overlayStyle = { position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const modalStyle = { background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxWidth: '92vw', overflow: 'hidden' };
const modalHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f0f0f0' };
const modalFooterStyle = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid #f0f0f0', background: '#fafafa' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' };
const ghostBtnStyle = { borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer' };
const primaryBtnStyle = { display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer' };
const chipBtnStyle = { borderRadius: 999, padding: '5px 10px', fontSize: 10.5, fontWeight: 500, border: '1px solid #e5e7eb', background: '#fff', color: '#475569', cursor: 'pointer' };

const RESULT_META = {
    ok:      { Icon: CheckCircle2, color: '#16a34a' },
    skipped: { Icon: MinusCircle,  color: '#6b7280' },
    error:   { Icon: AlertCircle,  color: '#dc2626' },
};

function TestResultModal({ result, loading, onClose, onRerun }) {
    const { t } = useTranslation();
    return (
        <div onClick={onClose} style={overlayStyle}>
            <div onClick={e => e.stopPropagation()} style={{ ...modalStyle, width: 560, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
                <div style={modalHeaderStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'flex', width: 30, height: 30, borderRadius: 8, background: '#eef2ff', color: '#6366f1', alignItems: 'center', justifyContent: 'center' }}><FlaskConical size={16} /></span>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{t('automation.test_title')}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{t('automation.test_subtitle')}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={iconBtnStyle}><X size={18} /></button>
                </div>

                <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0' }}>
                            <Loader2 size={22} className="animate-spin" style={{ color: '#6366f1' }} />
                            <span style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{t('automation.test_running')}</span>
                        </div>
                    ) : !result ? null : !result.ok ? (
                        <div style={{ display: 'flex', gap: 8, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 14px', fontSize: 12.5, color: '#9a3412' }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {result.error}
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 11.5, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                                <span>{t('automation.test_steps_count', { count: result.steps.length })}</span>
                                {result.contact && <span style={{ color: '#94a3b8' }}>· {t('automation.test_sample_contact', { name: result.contact.name })}</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {result.steps.map((s, i) => {
                                    const meta = RESULT_META[s.result] ?? RESULT_META.ok;
                                    const def = NODE_DEFS[s.node_type];
                                    return (
                                        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', border: '1px solid #eef0f2', borderRadius: 10, background: '#fff' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 18 }}>
                                                <span style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af' }}>{i + 1}</span>
                                                <span style={{ marginTop: 4, color: def?.color ?? '#6b7280', display: 'flex' }}><NodeIcon nodeType={s.node_type} size={15} /></span>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{s.label || (def ? t(def.labelKey) : s.node_type)}</span>
                                                    {s.branch && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: s.branch === 'true' ? '#dcfce7' : '#fee2e2', color: s.branch === 'true' ? '#166534' : '#991b1b' }}>{s.branch === 'true' ? t('common.yes') : t('common.no')}</span>}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, wordBreak: 'break-word' }}>{s.message}</div>
                                            </div>
                                            <meta.Icon size={16} style={{ color: meta.color, flexShrink: 0, marginTop: 2 }} />
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 14, fontSize: 10.5, color: '#94a3b8', alignItems: 'flex-start' }}>
                                <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {t('automation.test_disclaimer')}
                            </div>
                        </>
                    )}
                </div>

                <div style={modalFooterStyle}>
                    <button onClick={onClose} style={ghostBtnStyle}>{t('common.close')}</button>
                    <button onClick={onRerun} disabled={loading} style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}>
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />} {t('automation.test_run_again')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function deleteTargetName(node, t) {
    const nt = node?.data?.nodeType;
    const def = NODE_DEFS[nt];
    return node?.data?.label || (def ? t(def.labelKey) : nt) || t('automation.this_node');
}

function ConfirmDeleteModal({ target, onCancel, onConfirm }) {
    const { t } = useTranslation();
    const nodes = target?.nodes ?? [];
    const body = nodes.length > 1
        ? t('automation.delete_nodes_confirm_body', { count: nodes.length })
        : t('automation.delete_node_confirm_body', { name: deleteTargetName(nodes[0], t) });
    return (
        <div onClick={onCancel} style={overlayStyle}>
            <div onClick={e => e.stopPropagation()} style={{ ...modalStyle, width: 384 }}>
                <div style={{ padding: '20px 20px 4px', display: 'flex', gap: 12 }}>
                    <span style={{ display: 'flex', width: 38, height: 38, borderRadius: 10, background: '#fef2f2', color: '#dc2626', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trash2 size={18} /></span>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{t('automation.delete_node_confirm_title')}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.5 }}>{body}</div>
                    </div>
                </div>
                <div style={modalFooterStyle}>
                    <button onClick={onCancel} style={ghostBtnStyle}>{t('common.cancel')}</button>
                    <button onClick={onConfirm} style={{ ...primaryBtnStyle, background: '#dc2626' }}><Trash2 size={13} /> {t('common.delete')}</button>
                </div>
            </div>
        </div>
    );
}

const AI_EXAMPLES = ['automation.ai_example_welcome', 'automation.ai_example_abandoned', 'automation.ai_example_faq'];

function AiGenerateModal({ prompt, setPrompt, loading, error, onClose, onGenerate }) {
    const { t } = useTranslation();
    return (
        <div onClick={loading ? undefined : onClose} style={overlayStyle}>
            <div onClick={e => e.stopPropagation()} style={{ ...modalStyle, width: 520 }}>
                <div style={modalHeaderStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'flex', width: 30, height: 30, borderRadius: 8, background: '#faf5ff', color: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={16} /></span>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{t('automation.ai_title')}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{t('automation.ai_subtitle')}</div>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={loading} style={iconBtnStyle}><X size={18} /></button>
                </div>
                <div style={{ padding: 16 }} className="space-y-3">
                    <textarea autoFocus rows={5} className={textareaCls} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t('automation.ai_placeholder')} disabled={loading} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {AI_EXAMPLES.map(k => (
                            <button key={k} disabled={loading} onClick={() => setPrompt(t(k))} style={chipBtnStyle}>{t(k)}</button>
                        ))}
                    </div>
                    {error && <div style={{ display: 'flex', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px', fontSize: 11.5, color: '#b91c1c' }}><AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{error}</div>}
                    <div style={{ fontSize: 10.5, color: '#94a3b8', display: 'flex', gap: 6, alignItems: 'flex-start' }}><AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />{t('automation.ai_disclaimer')}</div>
                </div>
                <div style={modalFooterStyle}>
                    <button onClick={onClose} disabled={loading} style={ghostBtnStyle}>{t('common.cancel')}</button>
                    <button onClick={onGenerate} disabled={loading || !prompt.trim()} className="ai-glow" style={{ ...primaryBtnStyle, background: '#7c3aed', opacity: (loading || !prompt.trim()) ? 0.6 : 1 }}>
                        {loading ? <><Loader2 size={13} className="animate-spin" /> {t('automation.ai_generating')}</> : <><Sparkles size={13} /> {t('automation.ai_generate')}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Graph Traversal & Subtree Clipboard Utilities ─────────────── */

/**
 * Collects a node and all of its downstream descendant nodes and internal edges using BFS.
 */
function collectDownstreamSubtree(startNodeId, allNodes, allEdges) {
    const visited = new Set([startNodeId]);
    const queue = [startNodeId];

    while (queue.length > 0) {
        const currId = queue.shift();
        const outgoing = allEdges.filter(e => e.source === currId);
        for (const edge of outgoing) {
            if (!visited.has(edge.target)) {
                const targetNode = allNodes.find(n => n.id === edge.target);
                if (targetNode) {
                    visited.add(edge.target);
                    queue.push(edge.target);
                }
            }
        }
    }

    const rootNode = allNodes.find(n => n.id === startNodeId);
    const descendantNodes = allNodes.filter(n => visited.has(n.id));
    const internalEdges = allEdges.filter(e => visited.has(e.source) && visited.has(e.target));

    return { rootNode, descendantNodes, internalEdges };
}

/**
 * Clones and remaps a copied subtree, calculating downstream positions and linking edges.
 */
function instantiatePastedSubtree(clipboardData, targetNodeId, targetHandle, currentNodes, currentEdges, getEdgeColor) {
    if (!clipboardData || !clipboardData.nodes || clipboardData.nodes.length === 0) {
        return { newNodes: [], newEdges: [] };
    }

    const idMap = {};
    const timestamp = Date.now();
    clipboardData.nodes.forEach((n, idx) => {
        const typePrefix = n.data?.nodeType || 'node';
        idMap[n.id] = `${typePrefix}-${timestamp}_${idx}`;
    });

    const origRoot = clipboardData.nodes.find(n => n.id === clipboardData.rootNodeId) || clipboardData.nodes[0];
    const targetNode = targetNodeId ? currentNodes.find(n => n.id === targetNodeId) : null;

    let baseX = 250;
    let baseY = 200;

    if (targetNode) {
        const isCondition = targetNode.data?.nodeType === 'condition';
        const isWaitForReply = targetNode.data?.nodeType === 'wait_for_reply';
        const yOffset = isCondition ? 210 : isWaitForReply ? 150 : 130;
        baseY = (targetNode.position?.y ?? 100) + yOffset;

        if (isCondition && targetHandle) {
            let cardOffset = 0;
            if (targetHandle === 'none') {
                cardOffset = 140;
            } else if (targetHandle.startsWith('branch_')) {
                const parts = targetHandle.replace('branch_', '').split('_');
                const bIdx = parseInt(parts[0], 10) || 0;
                cardOffset = (bIdx - 1) * 210;
            }
            baseX = (targetNode.position?.x ?? 250) + cardOffset;
        } else {
            baseX = targetNode.position?.x ?? 250;
        }
    } else {
        const maxY = currentNodes.reduce((max, n) => Math.max(max, n.position?.y ?? 0), 100);
        baseY = maxY + 140;
    }

    const newNodes = clipboardData.nodes.map(n => {
        const relX = (n.position?.x ?? 0) - (origRoot.position?.x ?? 0);
        const relY = (n.position?.y ?? 0) - (origRoot.position?.y ?? 0);

        const clonedData = JSON.parse(JSON.stringify(n.data || {}));
        return {
            ...n,
            id: idMap[n.id],
            position: {
                x: baseX + relX,
                y: baseY + relY,
            },
            selected: n.id === origRoot.id,
            data: clonedData,
        };
    });

    const newInternalEdges = (clipboardData.edges || []).map(e => {
        const newSource = idMap[e.source];
        const newTarget = idMap[e.target];
        if (!newSource || !newTarget) return null;
        const strokeColor = getEdgeColor(e.sourceHandle);
        return {
            ...e,
            id: `edge-${newSource}-${newTarget}-${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
            source: newSource,
            target: newTarget,
            animated: true,
            style: { stroke: strokeColor, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
        };
    }).filter(Boolean);

    const linkingEdges = [];
    if (targetNodeId && targetNode) {
        const newRootId = idMap[origRoot.id];
        if (newRootId) {
            const strokeColor = getEdgeColor(targetHandle);
            linkingEdges.push({
                id: `edge-${targetNodeId}-${newRootId}-${timestamp}`,
                source: targetNodeId,
                target: newRootId,
                sourceHandle: targetHandle || undefined,
                animated: true,
                style: { stroke: strokeColor, strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
            });
        }
    }

    return {
        newNodes,
        newEdges: [...newInternalEdges, ...linkingEdges],
        newRootId: idMap[origRoot.id],
    };
}

function AutomationBuilderInner({ automation: initial }) {
    const { t } = useTranslation();
    const [automation, setAutomation] = useState(initial);
    const [nodes, setNodes, onNodesChange] = useNodesState(
        withTriggerNodes(deserializeNodes(initial.nodes ?? []), initial.trigger_type ?? '', initial.trigger_config ?? {})
    );
    const getEdgeColor = (h) => h === 'replied' ? '#16a34a' : h === 'timeout' ? '#ea580c' : h === 'false' ? '#ef4444' : h === 'none' || h?.startsWith('branch') ? '#8b5cf6' : '#6366f1';

    const [edges, setEdges, onEdgesChange] = useEdgesState(
        (initial.edges ?? []).map(e => ({
            ...e,
            animated: true,
            style: { stroke: getEdgeColor(e.sourceHandle), strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeColor(e.sourceHandle) },
        }))
    );
    const [saving, setSaving] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [copied, setCopied] = useState(false);
    const [generatingToken, setGeneratingToken] = useState(false);
    const [search, setSearch] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [showTest, setShowTest] = useState(false);
    const [aiOpen, setAiOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const webhookUrl = automation.trigger_token
        ? `${window.location.origin}/webhooks/automation/${automation.trigger_token}`
        : null;

    const copyWebhookUrl = () => {
        if (!webhookUrl) return;
        navigator.clipboard.writeText(webhookUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const generateToken = () => {
        setGeneratingToken(true);
        axios.post(route('client.automations.generate-token', automation.uuid))
            .then(res => setAutomation(a => ({ ...a, trigger_token: res.data.trigger_token })))
            .finally(() => setGeneratingToken(false));
    };

    const onConnect = useCallback((params) => {
        const strokeColor = getEdgeColor(params.sourceHandle);
        setEdges(eds => addEdge({
            ...params,
            animated: true,
            style: { stroke: strokeColor, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
        }, eds));
    }, []);

    const { screenToFlowPosition, deleteElements } = useReactFlow();

    // Single confirmation gate for every delete path (node trash icon, panel button, Delete key).
    // deleteElements + the Delete key both run through onBeforeDelete, so we resolve its promise
    // from the modal: confirm → proceed, cancel → abort. Edge-only deletions are not confirmed.
    const onBeforeDelete = useCallback(({ nodes: delNodes, edges: delEdges }) => {
        if (!delNodes || delNodes.length === 0) return Promise.resolve(true);
        return new Promise((resolve) => setConfirmDelete({ nodes: delNodes, edges: delEdges, resolve }));
    }, []);

    const resolveDelete = (ok) => {
        if (ok && confirmDelete?.nodes?.length) {
            const delNodeIds = confirmDelete.nodes.map(n => n.id);
            if (delNodeIds.length === 1) {
                const targetId = delNodeIds[0];
                const incoming = edges.filter(e => e.target === targetId);
                const outgoing = edges.filter(e => e.source === targetId);

                // Auto-heal canvas: If deleted node connects 1 predecessor and 1 successor, bridge them
                if (incoming.length === 1 && outgoing.length === 1) {
                    const src = incoming[0];
                    const dst = outgoing[0];
                    if (src.source !== dst.target) {
                        const strokeColor = getEdgeColor(src.sourceHandle);
                        const newEdge = {
                            id: `edge-${src.source}-${dst.target}-${Date.now()}`,
                            source: src.source,
                            target: dst.target,
                            sourceHandle: src.sourceHandle || undefined,
                            targetHandle: dst.targetHandle || undefined,
                            animated: true,
                            style: { stroke: strokeColor, strokeWidth: 2 },
                            markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
                        };
                        setEdges(eds => {
                            const filtered = eds.filter(e => e.source !== targetId && e.target !== targetId);
                            const exists = filtered.some(e => e.source === newEdge.source && e.target === newEdge.target);
                            return exists ? filtered : [...filtered, newEdge];
                        });
                    }
                }
            }
        }
        confirmDelete?.resolve?.(ok);
        if (ok) setSelectedNode(null);
        setConfirmDelete(null);
    };

    const addNode = (type, position) => {
        const n = makeNode(type, nodes.length, position);
        setNodes(nds => [...nds, n]);
    };

    const onDragStart = (e, type) => {
        e.dataTransfer.setData('application/automation-node', type);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('application/automation-node');
        if (!type || !NODE_DEFS[type]) return;
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        setNodes(nds => [...nds, makeNode(type, nds.length, position)]);
    }, [screenToFlowPosition, setNodes]);

    const updateNodeData = (nodeId, newData) => {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
        setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data: newData } : prev);
    };

    // Routes through deleteElements so it hits onBeforeDelete (the confirmation gate); ReactFlow
    // also removes any edges connected to the node automatically.
    const deleteNode = (nodeId) => {
        deleteElements({ nodes: [{ id: nodeId }] });
    };

    // Opens the config panel for a node by id (used by the on-node settings icon).
    const configureNode = (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) setSelectedNode(node);
    };

    // Duplicates a node (step or trigger) along with all its configuration and settings.
    const duplicateNode = useCallback((nodeId) => {
        const target = nodes.find(n => n.id === nodeId);
        if (!target) return;

        const isTrigger = target.type === 'triggerNode';
        const newId = `${isTrigger ? 'trigger' : target.data?.nodeType || 'node'}-${Date.now()}`;
        const newPosition = {
            x: (target.position?.x ?? 100) + 40,
            y: (target.position?.y ?? 100) + 40,
        };

        const clonedData = JSON.parse(JSON.stringify(target.data || {}));
        if (isTrigger) {
            const baseName = target.data?.label || target.data?.triggerName || 'Trigger';
            clonedData.label = `${baseName} (Copy)`;
            if (clonedData.triggerName) {
                clonedData.triggerName = `${clonedData.triggerName} (Copy)`;
            }
        } else {
            const def = NODE_DEFS[target.data?.nodeType];
            const originalLabel = target.data?.label || (def ? t(def.labelKey) : target.data?.nodeType);
            clonedData.label = `${originalLabel} (Copy)`;
        }

        const newNode = {
            ...target,
            id: newId,
            position: newPosition,
            selected: true,
            data: clonedData,
        };

        setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newNode));
        setSelectedNode(newNode);
    }, [nodes, t, setNodes]);

    // Quick enable/disable toggle from dropdown or keyboard
    const toggleNodeDisabled = useCallback((nodeId) => {
        setNodes(nds => nds.map(n => {
            if (n.id === nodeId) {
                const nextDisabled = !n.data?.disabled;
                return {
                    ...n,
                    data: {
                        ...n.data,
                        disabled: nextDisabled,
                    },
                };
            }
            return n;
        }));
        setSelectedNode(prev => {
            if (prev?.id === nodeId) {
                return {
                    ...prev,
                    data: {
                        ...prev.data,
                        disabled: !prev.data?.disabled,
                    },
                };
            }
            return prev;
        });
    }, [setNodes]);

    const [clipboard, setClipboard] = useState(() => {
        try {
            const saved = localStorage.getItem('whatsmine_automation_clipboard');
            return saved ? JSON.parse(saved) : null;
        } catch (err) {
            return null;
        }
    });

    const copySingleAction = useCallback((nodeId) => {
        const target = nodes.find(n => n.id === nodeId);
        if (!target || target.type === 'triggerNode') return;

        const def = NODE_DEFS[target.data?.nodeType];
        const name = target.data?.label || (def ? t(def.labelKey) : target.data?.nodeType) || 'Action';

        const clipData = {
            type: 'single',
            name,
            count: 1,
            rootNodeId: target.id,
            nodes: [JSON.parse(JSON.stringify(target))],
            edges: [],
            timestamp: Date.now(),
        };

        setClipboard(clipData);
        try {
            localStorage.setItem('whatsmine_automation_clipboard', JSON.stringify(clipData));
        } catch (err) {}
        toast.success(`Copied "${name}" to clipboard`);
    }, [nodes, t]);

    const copyBranchSubtree = useCallback((nodeId) => {
        const target = nodes.find(n => n.id === nodeId);
        if (!target || target.type === 'triggerNode') return;

        const { descendantNodes, internalEdges } = collectDownstreamSubtree(nodeId, nodes, edges);
        const def = NODE_DEFS[target.data?.nodeType];
        const name = target.data?.label || (def ? t(def.labelKey) : target.data?.nodeType) || 'Branch';

        const clipData = {
            type: 'branch',
            name,
            count: descendantNodes.length,
            rootNodeId: target.id,
            nodes: JSON.parse(JSON.stringify(descendantNodes)),
            edges: JSON.parse(JSON.stringify(internalEdges)),
            timestamp: Date.now(),
        };

        setClipboard(clipData);
        try {
            localStorage.setItem('whatsmine_automation_clipboard', JSON.stringify(clipData));
        } catch (err) {}
        toast.success(`Copied branch "${name}" (${descendantNodes.length} step${descendantNodes.length > 1 ? 's' : ''}) to clipboard`);
    }, [nodes, edges, t]);

    const pasteClipboardAt = useCallback((targetNodeId = null, targetHandle = null) => {
        let activeClipboard = clipboard;
        if (!activeClipboard) {
            try {
                const saved = localStorage.getItem('whatsmine_automation_clipboard');
                if (saved) activeClipboard = JSON.parse(saved);
            } catch (err) {}
        }

        if (!activeClipboard || !activeClipboard.nodes || activeClipboard.nodes.length === 0) {
            toast.info('Clipboard is empty. Copy an action or branch first.');
            return;
        }

        const { newNodes, newEdges, newRootId } = instantiatePastedSubtree(
            activeClipboard,
            targetNodeId,
            targetHandle,
            nodes,
            edges,
            getEdgeColor
        );

        setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newNodes));
        setEdges(eds => [...eds, ...newEdges]);

        toast.success(`Pasted ${activeClipboard.type === 'branch' ? 'branch' : 'action'} "${activeClipboard.name}" (${activeClipboard.count} step${activeClipboard.count > 1 ? 's' : ''})`);

        const newRoot = newNodes.find(n => n.id === newRootId);
        if (newRoot) {
            setSelectedNode(newRoot);
        }
    }, [clipboard, nodes, edges, getEdgeColor, setNodes, setEdges]);

    const clearClipboard = useCallback(() => {
        setClipboard(null);
        try {
            localStorage.removeItem('whatsmine_automation_clipboard');
        } catch (err) {}
        toast.info('Clipboard cleared');
    }, []);

    // Keyboard shortcuts:
    // Ctrl+D / Cmd+D: duplicate
    // Ctrl+C / Cmd+C: copy single action
    // Ctrl+V / Cmd+V: paste clipboard
    useEffect(() => {
        const handleKeyDown = (e) => {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'd' || e.key === 'D') {
                    if (selectedNode) {
                        e.preventDefault();
                        duplicateNode(selectedNode.id);
                    }
                } else if (e.key === 'c' || e.key === 'C') {
                    if (selectedNode && selectedNode.type !== 'triggerNode') {
                        e.preventDefault();
                        copySingleAction(selectedNode.id);
                    }
                } else if (e.key === 'v' || e.key === 'V') {
                    e.preventDefault();
                    pasteClipboardAt(selectedNode?.id || null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, duplicateNode, copySingleAction, pasteClipboardAt]);

    const addTriggerNode = () => {
        const triggerNodes = nodes.filter(n => n.type === 'triggerNode');
        const maxX = triggerNodes.reduce((max, n) => Math.max(max, n.position?.x ?? 250), 100);
        const newId = `trigger-${Date.now()}`;
        const newTriggerNode = {
            id: newId,
            type: 'triggerNode',
            position: { x: maxX + 240, y: 50 },
            deletable: true,
            data: {
                triggerType: 'form.submitted',
                triggerConfig: {},
                label: 'Trigger',
            },
        };

        const firstActionNode = nodes.find(n => n.type === 'automationNode');
        let nextEdges = [...edges];
        if (firstActionNode) {
            nextEdges.push({
                id: `edge-${newId}-${firstActionNode.id}`,
                source: newId,
                target: firstActionNode.id,
                animated: true,
                style: { stroke: '#6366f1', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
            });
        }

        setNodes(nds => [...nds, newTriggerNode]);
        setEdges(nextEdges);
        setSelectedNode(newTriggerNode);
    };

    const saveTriggerData = (nodeId, data) => {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
        setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev);
        if (data.triggerType) {
            setAutomation(a => ({
                ...a,
                trigger_type: data.triggerType,
                trigger_config: data.triggerConfig ?? a.trigger_config,
            }));
        }
    };

    // Trigger lives on the canvas as nodes; update active selected trigger node directly.
    const setTriggerType = (value) => {
        setAutomation(a => ({ ...a, trigger_type: value }));
        if (selectedNode && selectedNode.type === 'triggerNode') {
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, triggerType: value, triggerConfig: {} } } : n));
            setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, triggerType: value, triggerConfig: {} } } : null);
        } else {
            setNodes(nds => nds.map(n => n.type === 'triggerNode' ? { ...n, data: { ...n.data, triggerType: value } } : n));
        }
    };

    const setTriggerConfig = (patch) => {
        setAutomation(a => ({ ...a, trigger_config: { ...(a.trigger_config ?? {}), ...patch } }));
        if (selectedNode && selectedNode.type === 'triggerNode') {
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, triggerConfig: { ...(n.data?.triggerConfig ?? {}), ...patch } } } : n));
            setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, triggerConfig: { ...(prev.data?.triggerConfig ?? {}), ...patch } } } : null);
        }
    };

    const save = () => {
        setSaving(true);
        router.put(route('client.automations.update', automation.uuid), {
            nodes: serializeNodes(nodes),
            edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),
            trigger_type: automation.trigger_type,
            trigger_config: automation.trigger_config,
            name: automation.name,
        }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    const toggleStatus = () => {
        const newStatus = automation.status === 'active' ? 'paused' : 'active';
        router.put(route('client.automations.update', automation.uuid), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => setAutomation(a => ({ ...a, status: newStatus })),
        });
    };

    // Dry-run the live canvas through the engine and show a step-by-step trace (no real sends).
    const runTest = () => {
        setShowTest(true);
        setTesting(true);
        setTestResult(null);
        axios.post(route('client.automations.test', automation.uuid), {
            nodes: serializeNodes(nodes),
            edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
            trigger_type: automation.trigger_type,
            trigger_config: automation.trigger_config,
        })
            .then(res => setTestResult(res.data))
            .catch(err => setTestResult({ ok: false, error: err.response?.data?.error || err.response?.data?.message || t('automation.test_failed'), steps: [] }))
            .finally(() => setTesting(false));
    };

    // Replace the canvas with an AI-generated (or otherwise supplied) graph for review before saving.
    const applyGraph = (graph) => {
        setNodes(withTriggerNodes(deserializeNodes(graph.nodes ?? []), graph.trigger_type ?? '', graph.trigger_config ?? {}));
        setEdges((graph.edges ?? []).map(e => ({
            ...e,
            animated: true,
            style: { stroke: getEdgeColor(e.sourceHandle), strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeColor(e.sourceHandle) },
        })));
        setAutomation(a => ({ ...a, trigger_type: graph.trigger_type ?? a.trigger_type, trigger_config: graph.trigger_config ?? a.trigger_config, name: graph.name || a.name }));
        setSelectedNode(null);
    };

    const generateAi = () => {
        setAiLoading(true);
        setAiError(null);
        axios.post(route('client.automations.generate'), { prompt: aiPrompt, persist: false })
            .then(res => {
                if (res.data?.ok && res.data.graph) {
                    applyGraph(res.data.graph);
                    setAiOpen(false);
                    setAiPrompt('');
                } else {
                    setAiError(res.data?.error || t('automation.ai_failed'));
                }
            })
            .catch(err => setAiError(err.response?.data?.error || err.response?.data?.message || t('automation.ai_failed')))
            .finally(() => setAiLoading(false));
    };

    const q = search.trim().toLowerCase();
    const grouped = CATEGORY_ORDER.map(cat => ({
        cat,
        items: Object.entries(NODE_DEFS).filter(([type, def]) =>
            def.category === cat && (q === '' || type.includes(q) || t(def.labelKey).toLowerCase().includes(q))
        ),
    })).filter(g => g.items.length > 0);

    return (
        <NodeActionsContext.Provider value={{
            onConfigure: configureNode,
            onDuplicate: duplicateNode,
            onToggleDisable: toggleNodeDisabled,
            onDelete: deleteNode,
            onCopyAction: copySingleAction,
            onCopyBranch: copyBranchSubtree,
            clipboard,
            onPaste: pasteClipboardAt,
            clearClipboard,
            triggerNodes: nodes.filter(n => n.type === 'triggerNode'),
            triggerType: automation.trigger_type,
            nodes,
            edges,
        }}>
        <div style={{ display: 'flex', height: 'calc(100vh - 130px)', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
            {/* ── Sidebar ── */}
            <div style={{ width: 234, display: 'flex', flexDirection: 'column', background: '#fafafa', borderRight: '1px solid #e5e7eb', overflowY: 'auto' }}>
                {/* Node palette */}
                <div style={{ padding: 12, flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{t('automation.add_node')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#94a3b8', marginBottom: 8 }}>
                        <GripVertical size={10} /> {t('automation.drag_node_hint')}
                    </div>

                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('automation.search_nodes')}
                        style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', padding: '6px 9px', fontSize: 11, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
                    />

                    {grouped.map(({ cat, items }) => (
                        <div key={cat} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                                {t(`automation.category_${cat}`)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {items.map(([type, def]) => (
                                    <button
                                        key={type}
                                        draggable
                                        onDragStart={e => onDragStart(e, type)}
                                        onClick={() => addNode(type)}
                                        title={t('automation.drag_node_hint')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                                            borderRadius: 8, border: '1px solid transparent', background: 'white',
                                            cursor: 'grab', textAlign: 'left', fontSize: 11, color: '#374151',
                                            transition: 'all 0.12s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = def.color; e.currentTarget.style.background = def.bg; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'white'; }}
                                    >
                                        <span style={{ color: def.color, display: 'flex', flexShrink: 0 }}>
                                            <NodeIcon nodeType={type} size={13} />
                                        </span>
                                        <span style={{ fontWeight: 500 }}>{t(def.labelKey)}</span>
                                        <GripVertical size={11} style={{ marginLeft: 'auto', color: '#d1d5db', flexShrink: 0 }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Canvas ── */}
            <div style={{ flex: 1, position: 'relative' }} onDrop={onDrop} onDragOver={onDragOver}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, node) => setSelectedNode(node)}
                    onPaneClick={() => setSelectedNode(null)}
                    onBeforeDelete={onBeforeDelete}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    fitView
                    deleteKeyCode="Delete"
                >
                    <Background color="#e5e7eb" gap={20} />
                    <Controls style={{ bottom: 20, left: 20 }} />
                    <MiniMap
                        nodeColor={n => NODE_DEFS[n.data?.nodeType]?.color ?? '#6366f1'}
                        style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8 }}
                    />

                    {/* Floating Active Clipboard Banner */}
                    {clipboard && (
                        <Panel position="top-center">
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                                color: '#fff',
                                borderRadius: 999,
                                padding: '6px 14px 6px 12px',
                                boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.45), 0 8px 10px -6px rgba(0,0,0,0.12)',
                                border: '1px solid rgba(199, 210, 254, 0.25)',
                                fontSize: 12,
                                fontWeight: 500,
                                zIndex: 1000,
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.18)',
                                    color: '#a5b4fc',
                                    flexShrink: 0,
                                }}>
                                    <Copy size={12} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#c7d2fe', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                                        {clipboard.type === 'branch' ? 'Branch' : 'Action'} Copied:
                                    </span>
                                    <span style={{ fontWeight: 700, color: '#ffffff', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        "{clipboard.name}"
                                    </span>
                                    <span style={{
                                        fontSize: 10,
                                        background: 'rgba(165, 180, 252, 0.25)',
                                        color: '#e0e7ff',
                                        padding: '1px 6px',
                                        borderRadius: 999,
                                        fontWeight: 600,
                                    }}>
                                        {clipboard.count} step{clipboard.count > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
                                <div style={{ fontSize: 11, color: '#c7d2fe' }}>
                                    Click any <strong style={{ color: '#fff' }}>(+)</strong> or press <kbd style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)', fontSize: 10 }}>Ctrl+V</kbd> to paste
                                </div>
                                {selectedNode && (
                                    <button
                                        type="button"
                                        onClick={() => pasteClipboardAt(selectedNode.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            background: '#6366f1',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 6,
                                            padding: '4px 9px',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'background 0.12s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
                                    >
                                        Paste Here
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={clearClipboard}
                                    title="Cancel / Clear Clipboard"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        padding: 2,
                                        marginLeft: 2,
                                        borderRadius: 4,
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </Panel>
                    )}

                    {/* Top toolbar */}
                    <Panel position="top-right">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8, borderRight: '1px solid #f0f0f0' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: automation.status === 'active' ? '#10b981' : '#f59e0b' }} />
                                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{t(`automation.status_${automation.status}`)}</span>
                            </div>
                            <button onClick={addTriggerNode} title="Add an additional trigger to start this workflow" style={{
                                display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8,
                                background: '#eff6ff', padding: '6px 12px', fontSize: 12, fontWeight: 600,
                                color: '#2563eb', border: '1px border-dashed #bfdbfe', cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                                <Plus size={13} /> + Add New Trigger
                            </button>
                            <button onClick={() => { setAiError(null); setAiOpen(true); }} title={t('automation.ai_title')} style={{
                                display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8,
                                background: '#faf5ff', padding: '6px 12px', fontSize: 12, fontWeight: 600,
                                color: '#7c3aed', border: '1px solid #e9d5ff', cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                                <Sparkles size={13} /> {t('automation.ai_generate_short')}
                            </button>
                            <button onClick={runTest} disabled={testing} title={t('automation.test_title')} style={{
                                display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8,
                                background: '#eef2ff', padding: '6px 12px', fontSize: 12, fontWeight: 600,
                                color: '#4f46e5', border: '1px solid #e0e7ff', cursor: testing ? 'not-allowed' : 'pointer',
                                opacity: testing ? 0.7 : 1, transition: 'all 0.15s',
                            }}>
                                {testing ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />} {t('automation.test')}
                            </button>
                            <button onClick={save} disabled={saving} style={{
                                display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8,
                                background: '#6366f1', padding: '6px 14px', fontSize: 12, fontWeight: 600,
                                color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.7 : 1, transition: 'all 0.15s',
                            }}>
                                <Save size={13} /> {saving ? t('automation.saving') : t('common.save')}
                            </button>
                            <button onClick={toggleStatus} style={{
                                display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8,
                                padding: '6px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                                background: automation.status === 'active' ? '#fef3c7' : '#dcfce7',
                                color: automation.status === 'active' ? '#92400e' : '#166534',
                                transition: 'all 0.15s',
                            }}>
                                {automation.status === 'active'
                                    ? <><Pause size={13} /> {t('automation.pause')}</>
                                    : <><Play size={13} /> {t('automation.activate')}</>}
                            </button>
                        </div>
                    </Panel>

                    {/* Hint */}
                    <Panel position="bottom-center">
                        <div style={{ fontSize: 10, color: '#9ca3af', background: '#fff', borderRadius: 999, padding: '4px 12px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            {t('automation.canvas_hint')}
                        </div>
                    </Panel>
                </ReactFlow>

                {/* Node config panel */}
                {selectedNode && selectedNode.type === 'automationNode' && (
                    <>
                        <div onClick={() => setSelectedNode(null)} style={{ position: 'absolute', inset: 0, zIndex: 9 }} />
                        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 10, pointerEvents: 'all' }}>
                            <ConfigPanel
                                node={selectedNode}
                                onClose={() => setSelectedNode(null)}
                                onSave={updateNodeData}
                                onDelete={deleteNode}
                            />
                        </div>
                    </>
                )}

                {/* Trigger config panel */}
                {selectedNode && selectedNode.type === 'triggerNode' && (
                    <>
                        <div onClick={() => setSelectedNode(null)} style={{ position: 'absolute', inset: 0, zIndex: 9 }} />
                        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 10, pointerEvents: 'all' }}>
                            <TriggerConfigPanel
                                node={selectedNode}
                                automation={automation}
                                onSave={(data) => saveTriggerData(selectedNode.id, data)}
                                webhookUrl={webhookUrl}
                                copied={copied}
                                onCopy={copyWebhookUrl}
                                onGenerateToken={generateToken}
                                generatingToken={generatingToken}
                                onClose={() => setSelectedNode(null)}
                            />
                        </div>
                    </>
                )}
            </div>

            {showTest && <TestResultModal result={testResult} loading={testing} onClose={() => setShowTest(false)} onRerun={runTest} />}
            {aiOpen && <AiGenerateModal prompt={aiPrompt} setPrompt={setAiPrompt} loading={aiLoading} error={aiError} onClose={() => setAiOpen(false)} onGenerate={generateAi} />}
            {confirmDelete && <ConfirmDeleteModal target={confirmDelete} onCancel={() => resolveDelete(false)} onConfirm={() => resolveDelete(true)} />}
        </div>
        </NodeActionsContext.Provider>
    );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function AutomationBuilder({ automation }) {
    const { t } = useTranslation();
    return (
        <ClientLayout title={automation.name}>
            <Head title={`${automation.name} · ${t('automation.builder')}`} />
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <Link href={route('client.automations.index')} className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 shadow-sm transition">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{automation.name}</h2>
                        <p className="text-xs text-neutral-500">{t('automation.builder')}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Link href={route('client.automations.runs', automation.uuid)} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition">
                            {t('automation.view_runs_arrow')}
                        </Link>
                    </div>
                </div>
                <ReactFlowProvider>
                    <AutomationBuilderInner automation={automation} />
                </ReactFlowProvider>
            </div>
        </ClientLayout>
    );
}
