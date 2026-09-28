import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import Card from '@/Components/ui/Card';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import DatePicker from '@/Components/ui/DatePicker';
import Modal from '@/Components/ui/Modal';
import Checkbox from '@/Components/ui/Checkbox';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft, Plus, Funnel, Trash2, BarChart2, Pencil, Globe,
    Eye, TrendingUp, DollarSign, MousePointerClick, MoreVertical,
    ExternalLink, Copy, Share2, CheckCircle, Clock, Folder,
    FolderPlus, LayoutGrid, List as ListIcon, Search, Home,
    ChevronRight, FolderOpen, Layers, Check, ArrowRight, Settings,
    FileText, Users, ShoppingCart, Tag, ArrowUpRight, ArrowDownRight,
    Split, ShieldAlert, Sparkles, Sliders, AlertCircle, HelpCircle,
    Package, RefreshCw, X, Box, CheckSquare, Save, Calendar, Mail,
    Video, Info, Shield, CheckCheck, Link2, Workflow, Zap,
} from 'lucide-react';
import { useConfirm } from '@/context/ConfirmationContext';

const STEP_TYPE_CONFIG = {
    optin:                { label: 'Opt-in / Lead Capture',   badge: 'Lead Magnet',   color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',       border: 'border-blue-200 dark:border-blue-800',   category: 'Lead Generation' },
    optin_thank_you:      { label: 'Opt-in Thank You',        badge: 'Confirmation',  color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',           border: 'border-sky-200 dark:border-sky-800',     category: 'Lead Generation' },
    contact_us:           { label: 'Contact Us Form',         badge: 'Inquiry',       color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',       border: 'border-cyan-200 dark:border-cyan-800',   category: 'Lead Generation' },
    booking:              { label: 'Booking / Meeting',       badge: 'Calendar',      color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',       border: 'border-teal-200 dark:border-teal-800',   category: 'Lead Generation' },
    sales:                { label: 'Sales Page',              badge: 'Offer Pitch',   color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', category: 'Sales & Commerce' },
    checkout:             { label: 'Order Form / Checkout',   badge: 'Checkout',      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', category: 'Sales & Commerce' },
    order_bump:           { label: 'Order Bump Offer',        badge: 'Add-on',        color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',   border: 'border-amber-200 dark:border-amber-800', category: 'Sales & Commerce' },
    upsell:               { label: 'Upsell (OTO)',            badge: '1-Click OTO',   color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', category: 'Sales & Commerce' },
    downsell:             { label: 'Downsell',                badge: 'Discount OTO',  color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',       border: 'border-rose-200 dark:border-rose-800',   category: 'Sales & Commerce' },
    thank_you:            { label: 'Thank You / Confirm',     badge: 'Order Summary', color: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',   border: 'border-green-200 dark:border-green-800', category: 'Sales & Commerce' },
    webinar_registration: { label: 'Webinar Registration',    badge: 'Registration',  color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', category: 'Webinars' },
    webinar_broadcast:    { label: 'Webinar Broadcast / Room', badge: 'Live Room',     color: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300', border: 'border-fuchsia-200 dark:border-fuchsia-800', category: 'Webinars' },
    webinar_thank_you:    { label: 'Webinar Confirmation',    badge: 'Replay / Pass', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', category: 'Webinars' },
    info_page:            { label: 'Info / Policy Page',      badge: 'Legal / Info',  color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',     border: 'border-slate-200 dark:border-slate-700', category: 'Legal & Info' },
    legal_terms:          { label: 'Terms & Conditions',      badge: 'Compliance',    color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', border: 'border-neutral-200 dark:border-neutral-700', category: 'Legal & Info' },
    legal_privacy:        { label: 'Privacy Policy',          badge: 'Privacy',       color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400', border: 'border-neutral-200 dark:border-neutral-700', category: 'Legal & Info' },
};

const fmt = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n ?? 0);
const fmtCurrency = (n) => `$${fmt(n)}`;
const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function FunnelShow({
    funnel,
    availableProducts = [],
    automations = [],
    leads = [],
    sales = [],
    stepStats = {},
    dateRange = 'all',
    startDate = '',
    endDate = '',
}) {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const { props } = usePage();
    const flash = props.flash ?? {};

    // Top Tabs: 'steps', 'stats', 'sales', 'leads', 'settings'
    const [activeTab, setActiveTab] = useState('steps');

    // Selected Step ID in sidebar
    const [selectedStepId, setSelectedStepId] = useState(() => {
        return funnel.steps?.[0]?.id ?? null;
    });

    // Modals
    const [showAddStepModal, setShowAddStepModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitValue, setSplitValue] = useState(50);

    // Active Step Object
    const currentStep = useMemo(() => {
        return funnel.steps?.find((s) => s.id === selectedStepId) || funnel.steps?.[0] || null;
    }, [funnel.steps, selectedStepId]);

    // Active Step Pages (Control & Variations)
    const controlPage = useMemo(() => {
        return currentStep?.pages?.find((p) => p.is_control) || currentStep?.pages?.[0] || null;
    }, [currentStep]);

    const variationPage = useMemo(() => {
        return currentStep?.pages?.find((p) => !p.is_control) || null;
    }, [currentStep]);

    // Inline Step Workspace State (Systeme.io & ClickFunnels 2.0 style)
    const [stepName, setStepName] = useState('');
    const [stepSlug, setStepSlug] = useState('');
    const [isSavingStep, setIsSavingStep] = useState(false);

    useEffect(() => {
        if (currentStep) {
            setStepName(currentStep.name || '');
            setStepSlug(currentStep.slug || (currentStep.name ? currentStep.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : ''));
        }
    }, [currentStep?.id, currentStep?.name, currentStep?.slug]);

    // Active Automations bound to this funnel & current step
    const stepAutomations = useMemo(() => {
        if (!automations || !funnel || !currentStep) return [];
        return automations.filter((auto) => {
            const cfg = auto.trigger_config || {};
            const filters = cfg.filters || [];

            // Check if root config matches
            const matchesRootFunnel = (String(cfg.funnel_id) === String(funnel.id));
            const matchesRootStep = !cfg.funnel_step_id || String(cfg.funnel_step_id) === String(currentStep.id) || cfg.funnel_step_id === 'all';

            if (matchesRootFunnel && matchesRootStep) return true;

            // Check if filters match
            const hasFilterMatch = filters.some(f => (
                (f.type === 'funnel_is' && String(f.value) === String(funnel.id)) ||
                (f.type === 'funnel_step_is' && String(f.value) === String(currentStep.id))
            ));
            if (hasFilterMatch) return true;

            // Check graph nodes
            const nodes = auto.nodes || [];
            return nodes.some(n => {
                const td = n.data || {};
                const tCfg = td.triggerConfig || {};
                const tFilters = tCfg.filters || [];
                const nodeMatchFunnel = (String(tCfg.funnel_id) === String(funnel.id));
                const nodeMatchStep = !tCfg.funnel_step_id || String(tCfg.funnel_step_id) === String(currentStep.id) || tCfg.funnel_step_id === 'all';
                if (nodeMatchFunnel && nodeMatchStep) return true;
                return tFilters.some(f => (
                    (f.type === 'funnel_is' && String(f.value) === String(funnel.id)) ||
                    (f.type === 'funnel_step_is' && String(f.value) === String(currentStep.id))
                ));
            });
        });
    }, [automations, funnel?.id, currentStep?.id]);

    const handleCreateWorkflowForStep = () => {
        if (!currentStep) return;
        router.post(route('client.automations.store'), {
            name: `${funnel.name} - ${currentStep.name} Flow`,
            trigger_type: 'funnel.form_submitted',
            trigger_config: {
                funnel_id: funnel.id,
                funnel_step_id: currentStep.id,
                trigger_name: `Funnel: ${currentStep.name}`,
            }
        });
    };

    // Step Add Form
    const addStepForm = useForm({
        name: '',
        type: 'sales',
    });

    // Funnel Pipeline Integrity Checks
    const hasFunnelCheckout = useMemo(() => {
        return (funnel.steps || []).some((s) => s.type === 'checkout');
    }, [funnel.steps]);

    const hasFunnelThankYou = useMemo(() => {
        return (funnel.steps || []).some((s) => ['thank_you', 'thankyou'].includes(s.type));
    }, [funnel.steps]);

    // Step Product Add Form
    const productForm = useForm({
        name: '',
        type: 'main',
        offer_type: 'digital',
        price: '29.00',
        product_id: '',
        product_price_id: '',
        bump_headline: '',
        bump_description: '',
    });

    // Commerce steps strictly: checkout, upsell, downsell, order_bump (NOT sales or opt-in)
    const isCommerceStep = useMemo(() => {
        return ['checkout', 'upsell', 'downsell', 'order_bump'].includes(currentStep?.type);
    }, [currentStep?.type]);

    // Already attached product IDs on this step (prevent duplicates)
    const attachedProductIds = useMemo(() => {
        return (currentStep?.products || []).map((p) => String(p.product_id)).filter(Boolean);
    }, [currentStep?.products]);

    // Filter out products already attached to this step
    const eligibleProducts = useMemo(() => {
        return availableProducts.filter((p) => !attachedProductIds.includes(String(p.id)));
    }, [availableProducts, attachedProductIds]);

    // Step limits & capacities
    const isSingleOfferStep = currentStep?.type === 'upsell' || currentStep?.type === 'downsell';
    const isSingleOfferFull = isSingleOfferStep && (currentStep?.products?.length ?? 0) >= 1;

    const hasMainCheckoutProduct = useMemo(() => {
        return currentStep?.products?.some((p) => p.type === 'main');
    }, [currentStep?.products]);

    const hasOrderBump = useMemo(() => {
        return currentStep?.products?.some((p) => p.type === 'bump');
    }, [currentStep?.products]);

    const isCheckoutFull = currentStep?.type === 'checkout' && hasMainCheckoutProduct && hasOrderBump;
    const isStepProductLimitReached = isSingleOfferFull || isCheckoutFull;

    const selectedCatalogProduct = useMemo(() => {
        if (!productForm.data.product_id) return null;
        return availableProducts.find((p) => String(p.id) === String(productForm.data.product_id)) || null;
    }, [availableProducts, productForm.data.product_id]);

    const modalRoleTitle = useMemo(() => {
        if (currentStep?.type === 'upsell') return 'Add 1-Click Upsell Offer (OTO)';
        if (currentStep?.type === 'downsell') return 'Add Downsell Discount Offer';
        if (productForm.data.type === 'bump') return 'Add Order Bump Offer';
        return 'Add Product to Checkout';
    }, [currentStep?.type, productForm.data.type]);

    const modalRoleSubtitle = useMemo(() => {
        if (currentStep?.type === 'upsell') {
            return 'Visitors can purchase this 1-click offer immediately after their initial checkout.';
        }
        if (currentStep?.type === 'downsell') {
            return 'Shown to visitors who decline the primary upsell offer.';
        }
        if (productForm.data.type === 'bump') {
            return 'Impulse add-on checkbox displayed on the checkout order form.';
        }
        return 'The primary product or plan customers purchase on this order form.';
    }, [currentStep?.type, productForm.data.type]);

    const openAddProductModal = () => {
        let stepRole = 'main';
        if (currentStep?.type === 'upsell') {
            stepRole = 'upsell';
        } else if (currentStep?.type === 'downsell') {
            stepRole = 'downsell';
        } else if (currentStep?.type === 'checkout' && hasMainCheckoutProduct) {
            stepRole = 'bump';
        }

        const firstProd = eligibleProducts[0] || null;
        const firstTier = firstProd?.prices?.[0] || null;
        const initialPrice = firstTier?.price ?? firstProd?.price ?? '29.00';
        const initialOfferType = firstProd?.product_type || 'digital';

        productForm.setData({
            name: firstProd ? firstProd.name : '',
            type: stepRole,
            offer_type: initialOfferType,
            price: initialPrice,
            product_id: firstProd ? String(firstProd.id) : '',
            product_price_id: firstTier ? String(firstTier.id) : '',
            bump_headline: stepRole === 'bump' && firstProd ? `YES! Add ${firstProd.name} for only ${fmtCurrency(initialPrice)}` : '',
            bump_description: stepRole === 'bump' ? 'Special one-time offer available only right now on this order form.' : '',
        });
        setShowAddProductModal(true);
    };

    const handleSelectCatalogProduct = (productId) => {
        if (!productId) {
            productForm.setData((prev) => ({
                ...prev,
                product_id: '',
                product_price_id: '',
            }));
            return;
        }

        const prod = availableProducts.find((p) => String(p.id) === String(productId));
        if (prod) {
            const firstTier = prod.prices?.[0] || null;
            const priceVal = firstTier?.price ?? prod.price ?? '0.00';
            productForm.setData((prev) => ({
                ...prev,
                product_id: String(prod.id),
                product_price_id: firstTier ? String(firstTier.id) : '',
                name: prod.name,
                price: priceVal,
                offer_type: prod.product_type || 'digital',
                bump_headline: prev.type === 'bump' ? `YES! Add ${prod.name} for only ${fmtCurrency(priceVal)}` : prev.bump_headline,
            }));
        }
    };

    const handleSelectPriceTier = (priceId) => {
        const prod = availableProducts.find((p) => String(p.id) === String(productForm.data.product_id));
        const tier = prod?.prices?.find((pr) => String(pr.id) === String(priceId));
        if (tier) {
            productForm.setData((prev) => ({
                ...prev,
                product_price_id: String(tier.id),
                price: tier.price ?? prev.price,
                bump_headline: prev.type === 'bump' && !prev.bump_headline ? `YES! Add ${prev.name} for only $${tier.price}` : prev.bump_headline,
            }));
        } else {
            productForm.setData((prev) => ({
                ...prev,
                product_price_id: '',
            }));
        }
    };

    // ─── Stats Tab Performance Metrics (Systeme.io Matrix Analytics) ──────────
    const [selectedDateRange, setSelectedDateRange] = useState(dateRange || 'all');
    const [filterStartDate, setFilterStartDate] = useState(startDate || '');
    const [filterEndDate, setFilterEndDate] = useState(endDate || '');

    useEffect(() => {
        setSelectedDateRange(dateRange || 'all');
    }, [dateRange]);

    useEffect(() => {
        setFilterStartDate(startDate || '');
    }, [startDate]);

    useEffect(() => {
        setFilterEndDate(endDate || '');
    }, [endDate]);

    const handlePresetChange = (preset) => {
        setSelectedDateRange(preset);
        setFilterStartDate('');
        setFilterEndDate('');
        router.get(
            route('client.funnels.show', funnel.uuid),
            { date_range: preset },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleApplyDateRange = () => {
        if (!filterStartDate && !filterEndDate) {
            handlePresetChange('all');
            return;
        }
        setSelectedDateRange('custom');
        router.get(
            route('client.funnels.show', funnel.uuid),
            {
                start_date: filterStartDate || undefined,
                end_date: filterEndDate || undefined,
                date_range: 'custom',
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleClearDates = () => {
        handlePresetChange('all');
    };

    const statsSummary = useMemo(() => {
        let totalViews = 0;
        let totalOptins = 0;
        let totalSalesCount = 0;
        let totalSalesRevenue = 0;

        const rows = (funnel.steps || []).map((step) => {
            const views = Number(step.views_count || 0);
            totalViews += views;

            const st = stepStats[step.id] || {};
            const isOptinType = ['optin', 'optin_thank_you', 'contact_us', 'booking', 'webinar_registration'].includes(step.type);
            const isCommerceType = ['checkout', 'upsell', 'downsell', 'order_bump'].includes(step.type);

            const optinsCount = st.optins_count !== undefined
                ? Number(st.optins_count)
                : (isOptinType ? Number(step.conversions_count || 0) : 0);

            const salesCount = st.sales_count !== undefined
                ? Number(st.sales_count)
                : (isCommerceType ? Number(step.conversions_count || 0) : 0);

            const salesRevenue = st.sales_revenue !== undefined
                ? Number(st.sales_revenue)
                : (isCommerceType && salesCount > 0 ? (salesCount * 29) : 0);

            totalOptins += optinsCount;
            totalSalesCount += salesCount;
            totalSalesRevenue += salesRevenue;

            const optinConvRate = views > 0 ? ((optinsCount / views) * 100).toFixed(2) : '0';
            const salesConvRate = views > 0 ? ((salesCount / views) * 100).toFixed(2) : '0';
            const earningsPerView = views > 0 ? (salesRevenue / views) : 0;

            return {
                step,
                views,
                isOptinType,
                isCommerceType,
                optinsCount,
                optinConvRate,
                salesCount,
                salesConvRate,
                salesRevenue,
                earningsPerView,
            };
        });

        const finalRevenue = Math.max(totalSalesRevenue, Number(funnel.total_revenue || 0));
        const finalSalesCount = Math.max(totalSalesCount, sales.length);
        const avgCartValue = finalSalesCount > 0 ? (finalRevenue / finalSalesCount) : 0;
        const overallOptinRate = totalViews > 0 ? ((totalOptins / totalViews) * 100).toFixed(2) : '0';
        const overallSalesRate = totalViews > 0 ? ((finalSalesCount / totalViews) * 100).toFixed(2) : '0';
        const overallEarningsPerView = totalViews > 0 ? (finalRevenue / totalViews) : 0;

        return {
            rows,
            totalViews,
            totalOptins,
            totalSalesCount: finalSalesCount,
            totalSalesRevenue: finalRevenue,
            avgCartValue,
            overallOptinRate,
            overallSalesRate,
            overallEarningsPerView,
        };
    }, [funnel.steps, funnel.total_revenue, stepStats, sales.length]);

    // Funnel Settings Form
    const settingsForm = useForm({
        name: funnel.name || '',
        slug: funnel.slug || '',
        theme_color: funnel.theme_color || '#16a34a',
        meta_title: funnel.meta_title || '',
        meta_description: funnel.meta_description || '',
        no_index: funnel.no_index || false,
    });

    // ─── Step Actions ─────────────────────────────────────────────────────────

    const handleSaveStepSettings = (e) => {
        e?.preventDefault();
        if (!currentStep) return;
        setIsSavingStep(true);
        router.put(
            route('client.funnels.steps.update', [funnel.uuid, currentStep.id]),
            {
                name: stepName,
                slug: stepSlug,
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSavingStep(false),
            }
        );
    };

    const handleCreateStep = (e) => {
        e.preventDefault();
        addStepForm.post(route('client.funnels.steps.store', funnel.uuid), {
            preserveScroll: true,
            onSuccess: (res) => {
                addStepForm.reset();
                setShowAddStepModal(false);
            },
        });
    };

    const handleDeleteStep = async (step) => {
        const ok = await confirm({
            title: 'Delete Funnel Step',
            message: `Are you sure you want to delete step "${step.name}"? All page variants and products attached will be removed.`,
            confirmText: 'Delete Step',
            variant: 'danger',
        });
        if (!ok) return;

        router.delete(route('client.funnels.steps.destroy', [funnel.uuid, step.id]), {
            preserveScroll: true,
        });
    };

    // ─── A/B Test Actions ─────────────────────────────────────────────────────

    const handleCreateVariant = () => {
        if (!currentStep) return;
        router.post(route('client.funnels.steps.variant', [funnel.uuid, currentStep.id]), {}, {
            preserveScroll: true,
        });
    };

    const handleDeclareWinner = async (page) => {
        const ok = await confirm({
            title: 'Declare Winner Variant',
            message: `Are you sure you want to declare Variant ${page.variant} as the permanent winner? The other variant will be removed and traffic set to 100%.`,
            confirmText: 'Declare Winner',
            variant: 'primary',
        });
        if (!ok) return;

        router.post(route('client.funnels.steps.declareWinner', [funnel.uuid, currentStep.id]), {
            winning_variant: page.variant,
            winning_page_id: page.id,
        }, {
            preserveScroll: true,
        });
    };

    const handleSaveSplit = () => {
        router.post(route('client.funnels.steps.split', [funnel.uuid, currentStep.id]), {
            control_split: splitValue,
            variant_split: 100 - splitValue,
        }, {
            preserveScroll: true,
            onSuccess: () => setShowSplitModal(false),
        });
    };

    // ─── Product Actions ──────────────────────────────────────────────────────

    const handleAttachProduct = (e) => {
        e.preventDefault();
        productForm.post(route('client.funnels.steps.products.store', [funnel.uuid, currentStep.id]), {
            preserveScroll: true,
            onSuccess: () => {
                productForm.reset();
                setShowAddProductModal(false);
            },
        });
    };

    const handleRemoveProduct = async (product) => {
        const ok = await confirm({
            title: 'Remove Product',
            message: `Are you sure you want to remove "${product.name}" from this step?`,
            confirmText: 'Remove',
            variant: 'danger',
        });
        if (!ok) return;

        router.delete(route('client.funnels.steps.products.destroy', [funnel.uuid, currentStep.id, product.id]), {
            preserveScroll: true,
        });
    };

    // ─── Settings Save ────────────────────────────────────────────────────────

    const handleSaveSettings = (e) => {
        e.preventDefault();
        settingsForm.put(route('client.funnels.settings.update', funnel.uuid), {
            preserveScroll: true,
        });
    };

    return (
        <ClientLayout title={`${funnel.name} — Step Hub`}>
            <Head title={`${funnel.name} — Funnel Hub`} />

            <div className="space-y-6">
                {/* ─── Top Funnel Header Bar ──────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('client.funnels.index')}
                            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition shadow-xs"
                            title="Back to funnels list"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                    {funnel.name}
                                </h1>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                    funnel.status === 'published'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                }`}>
                                    {funnel.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                                <span>/f/{funnel.slug}</span>
                                {funnel.folder && (
                                    <span className="inline-flex items-center gap-1 font-medium px-1.5 py-0.2 rounded" style={{ backgroundColor: `${funnel.folder.color || '#16a34a'}20`, color: funnel.folder.color || '#16a34a' }}>
                                        <Folder className="w-2.5 h-2.5" />
                                        {funnel.folder.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {funnel.status === 'published' && (
                            <a
                                href={`/f/${funnel.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                View Live Funnel
                            </a>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveTab('settings')}
                            className="gap-1.5 text-xs"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            Funnel Settings
                        </Button>
                    </div>
                </div>

                {/* ─── Top Navigation Tabs ────────────────────────────────────────── */}
                <div className="border-b border-neutral-200 dark:border-neutral-800">
                    <nav className="flex space-x-3 sm:space-x-6" aria-label="Funnel Tabs">
                        {[
                            { id: 'steps',    label: 'Steps',     icon: Layers,       count: funnel.steps?.length ?? 0 },
                            { id: 'stats',    label: 'Stats',     icon: BarChart2,    count: null },
                            { id: 'sales',    label: 'Sales',     icon: DollarSign,   count: sales.length || null },
                            { id: 'leads',    label: 'Leads',     icon: Users,        count: leads.length || null },
                            { id: 'settings', label: 'Settings',  icon: Settings,     count: null },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-3 px-2 border-b-2 font-medium text-sm transition ${
                                        isActive
                                            ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-semibold'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                    {tab.count !== null && (
                                        <span className={`px-2 py-0.2 rounded-full text-xs font-semibold ${
                                            isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* ─── TAB 1: STEPS MANAGER ───────────────────────────────────────── */}
                {activeTab === 'steps' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* ── Left Steps Sidebar (4 Cols) ──────────────────────── */}
                        <div className="lg:col-span-4 space-y-4">
                            <Card padding={true} className="space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                                        <Layers className="w-4 h-4 text-brand-500" />
                                        Funnel Steps ({funnel.steps?.length ?? 0})
                                    </span>
                                </div>

                                {/* Steps List */}
                                <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
                                    {funnel.steps?.map((step, idx) => {
                                        const isSelected = (selectedStepId === step.id) || (!selectedStepId && idx === 0);
                                        const typeCfg = STEP_TYPE_CONFIG[step.type] || STEP_TYPE_CONFIG.sales;

                                        return (
                                            <div
                                                key={step.id}
                                                onClick={() => setSelectedStepId(step.id)}
                                                className={`group flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 text-brand-900 dark:text-brand-100 shadow-xs'
                                                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-500 shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-bold truncate text-neutral-900 dark:text-neutral-100">
                                                            {step.name}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${typeCfg.color}`}>
                                                                {typeCfg.label}
                                                            </span>
                                                            {step.slug && (
                                                                <span className="text-[10px] text-neutral-400 font-mono">
                                                                    /{step.slug}
                                                                </span>
                                                            )}
                                                            {(step.products?.length ?? 0) > 0 && (
                                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                                    • {step.products.length} offer{step.products.length > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {step.pages?.length > 1 && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" title="A/B Split Testing Active">
                                                            A/B
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteStep(step);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 rounded transition"
                                                        title="Delete Step"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Add Step Button */}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowAddStepModal(true)}
                                    className="w-full justify-center gap-2 text-xs"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add New Step or Import
                                </Button>
                            </Card>
                        </div>

                        {/* ── Right Step Workspace (8 Cols) ────────────────────── */}
                        <div className="lg:col-span-8 space-y-4">
                            {currentStep ? (
                                <>
                                    {/* ── CARD 1: Step Configuration & URL Slug (Systeme.io / ClickFunnels 2.0 style) ── */}
                                    <Card padding={true} className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${STEP_TYPE_CONFIG[currentStep.type]?.color || 'bg-neutral-100 text-neutral-700'}`}>
                                                    {STEP_TYPE_CONFIG[currentStep.type]?.label || currentStep.type}
                                                </span>
                                                <span className="text-xs text-neutral-400">
                                                    Step #{funnel.steps?.findIndex((s) => s.id === currentStep.id) + 1} of {funnel.steps?.length}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {funnel.status === 'published' && (
                                                    <a
                                                        href={`/f/${funnel.slug}/${currentStep.slug || `step-${currentStep.id}`}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition shadow-2xs"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                                                        <span>Open Live</span>
                                                    </a>
                                                )}
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={handleSaveStepSettings}
                                                    disabled={isSavingStep || !stepName.trim()}
                                                    className="gap-1.5 text-xs shadow-xs"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                    <span>{isSavingStep ? 'Saving...' : 'Save Step'}</span>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Form inputs grid: Step Name & URL Slug */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                            {/* Step Name */}
                                            <Input
                                                label="Step Name *"
                                                value={stepName}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setStepName(val);
                                                    if (!currentStep.slug) {
                                                        setStepSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
                                                    }
                                                }}
                                                placeholder="e.g. Masterclass Checkout"
                                                required
                                            />

                                            {/* Step URL Slug */}
                                            <div>
                                                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                                    Live URL Path Slug
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1.5 text-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-md text-[11px] font-mono shrink-0 select-none">
                                                        /f/{funnel.slug}/
                                                    </span>
                                                    <Input
                                                        size="sm"
                                                        wrapperClassName="flex-1"
                                                        type="text"
                                                        value={stepSlug}
                                                        onChange={(e) => setStepSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                        className="font-mono"
                                                        placeholder="order-checkout"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* ── CARD 2: Visual Page Design & A/B Split Testing ── */}
                                    <Card padding={true} className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                            <div>
                                                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                                    <Layers className="w-4 h-4 text-brand-500" />
                                                    Page Design & A/B Split Testing
                                                </h3>
                                                <p className="text-xs text-neutral-400">
                                                    Design your step in the visual drag-and-drop editor or test two variations against each other.
                                                </p>
                                            </div>

                                            {variationPage && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSplitValue(controlPage?.traffic_split ?? 50);
                                                        setShowSplitModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 transition shadow-2xs"
                                                >
                                                    <Sliders className="w-3.5 h-3.5" />
                                                    <span>Adjust Traffic Split ({controlPage?.traffic_split ?? 50}% / {variationPage?.traffic_split ?? 50}%)</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Side-by-Side Control vs Variation Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Card 1: CONTROL Page */}
                                            <div className="rounded-xl border-2 border-brand-500/80 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
                                                <div className="flex items-center justify-between px-4 py-2.5 bg-brand-50/60 dark:bg-brand-950/40 border-b border-brand-100 dark:border-brand-900/50">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                                                            <Layers className="w-3.5 h-3.5" />
                                                            Control (Page {controlPage?.variant || 'A'})
                                                        </span>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-600 text-white">
                                                        {controlPage?.traffic_split ?? (variationPage ? 50 : 100)}% Traffic
                                                    </span>
                                                </div>

                                                <div className="p-4 flex flex-col items-center justify-center min-h-[190px] bg-neutral-950/5 dark:bg-neutral-950/30 border-b border-neutral-100 dark:border-neutral-800">
                                                    <div className="w-full max-w-[260px] aspect-video rounded-lg bg-gradient-to-br from-indigo-900 to-purple-950 text-white flex flex-col items-center justify-center p-4 shadow-md text-center">
                                                        <Funnel className="w-8 h-8 text-brand-400 mb-2 opacity-80" />
                                                        <span className="text-xs font-semibold truncate max-w-[200px]">
                                                            {currentStep.name}
                                                        </span>
                                                        <span className="text-[10px] text-brand-200 mt-0.5">Control Variant Preview</span>
                                                    </div>
                                                </div>

                                                <div className="p-4 space-y-3">
                                                    <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800 text-center py-1 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg text-xs">
                                                        <div>
                                                            <span className="text-neutral-400 block text-[10px] uppercase">Views</span>
                                                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{fmt(controlPage?.views_count)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-neutral-400 block text-[10px] uppercase">Conv.</span>
                                                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{fmt(controlPage?.conversions_count)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-neutral-400 block text-[10px] uppercase">Rate</span>
                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                {controlPage?.views_count > 0 ? ((controlPage.conversions_count / controlPage.views_count) * 100).toFixed(1) : 0}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={route('client.funnels.edit', funnel.uuid)}
                                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                            Edit Page
                                                        </Link>
                                                        {funnel.status === 'published' && (
                                                            <a
                                                                href={`/f/${funnel.slug}/${currentStep.slug || `step-${currentStep.id}`}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 transition"
                                                                title="Live Preview"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card 2: VARIATION Page (or Starter Card) */}
                                            {variationPage ? (
                                                <div className="rounded-xl border-2 border-purple-500/80 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
                                                    <div className="flex items-center justify-between px-4 py-2.5 bg-purple-50/60 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900/50">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                                                <Split className="w-3.5 h-3.5" />
                                                                Variation ({variationPage.variant || 'B'})
                                                            </span>
                                                        </div>
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white">
                                                            {variationPage.traffic_split ?? 50}% Traffic
                                                        </span>
                                                    </div>

                                                    <div className="p-4 flex flex-col items-center justify-center min-h-[190px] bg-neutral-950/5 dark:bg-neutral-950/30 border-b border-neutral-100 dark:border-neutral-800">
                                                        <div className="w-full max-w-[260px] aspect-video rounded-lg bg-gradient-to-br from-purple-900 to-rose-950 text-white flex flex-col items-center justify-center p-4 shadow-md text-center">
                                                            <Split className="w-8 h-8 text-purple-400 mb-2 opacity-80" />
                                                            <span className="text-xs font-semibold truncate max-w-[200px]">
                                                                {currentStep.name} (Variant B)
                                                            </span>
                                                            <span className="text-[10px] text-purple-200 mt-0.5">Split Variant Preview</span>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 space-y-3">
                                                        <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800 text-center py-1 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg text-xs">
                                                            <div>
                                                                <span className="text-neutral-400 block text-[10px] uppercase">Views</span>
                                                                <span className="font-bold text-neutral-900 dark:text-neutral-100">{fmt(variationPage.views_count)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-neutral-400 block text-[10px] uppercase">Conv.</span>
                                                                <span className="font-bold text-neutral-900 dark:text-neutral-100">{fmt(variationPage.conversions_count)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-neutral-400 block text-[10px] uppercase">Rate</span>
                                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {variationPage.views_count > 0 ? ((variationPage.conversions_count / variationPage.views_count) * 100).toFixed(1) : 0}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={route('client.funnels.edit', funnel.uuid)}
                                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                                Edit Variation
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeclareWinner(variationPage)}
                                                                className="px-3 py-2 border border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition"
                                                                title="Declare this variation as winner"
                                                            >
                                                                Declare Winner
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 flex flex-col items-center justify-center text-center shadow-xs">
                                                    <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5">
                                                        <Split className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                                        Start Split Test
                                                    </h3>
                                                    <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                                                        Test two designs or offers against each other. Traffic is automatically divided between Control and Variant B.
                                                    </p>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={handleCreateVariant}
                                                        className="mt-3.5 gap-1.5 text-xs text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Create Variation (Variant B)
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </Card>

                                    {/* ── CARD 3: Step Offers & Products (or Contextual Strategy Guide) ── */}
                                    {isCommerceStep ? (
                                        <Card padding={true} className="space-y-4">
                                            {(!currentStep.products || currentStep.products.length === 0) && (
                                                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-xs flex items-center gap-2.5">
                                                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                                    <span>
                                                        <strong>Product Required:</strong> Please add at least one product ({currentStep.type === 'upsell' ? '1-Click Upsell' : (currentStep.type === 'downsell' ? 'Downsell Offer' : 'Main Product or Order Bump')}). Otherwise, visitors cannot complete their purchase on this step.
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                                <div>
                                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                                        <ShoppingCart className="w-4 h-4 text-emerald-500" />
                                                        Attached Step Products & Offers
                                                    </h3>
                                                    <p className="text-xs text-neutral-400">
                                                        {currentStep?.type === 'upsell'
                                                            ? '1-click post-purchase upsell offers bound to this step.'
                                                            : (currentStep?.type === 'downsell'
                                                                ? 'Downsell alternative offers bound to this step.'
                                                                : 'Core checkout products and optional order bump add-ons.')}
                                                    </p>
                                                </div>

                                                {isSingleOfferFull ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        <Check className="w-3.5 h-3.5" />
                                                        1-Click Offer Bound (1/1)
                                                    </div>
                                                ) : isCheckoutFull ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        <Check className="w-3.5 h-3.5" />
                                                        Checkout Complete (1 Main + 1 Bump)
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={openAddProductModal}
                                                        disabled={eligibleProducts.length === 0 && availableProducts.length > 0}
                                                        className="gap-1.5 text-xs"
                                                        title={eligibleProducts.length === 0 && availableProducts.length > 0 ? "All catalog products are already attached to this step" : "Add Product / Offer"}
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        {currentStep?.type === 'checkout' && hasMainCheckoutProduct ? 'Add Order Bump' : 'Add Product / Offer'}
                                                    </Button>
                                                )}
                                            </div>

                                            <Card padding={false} className="overflow-hidden">
                                                <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                                                    <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-200 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                                        <tr>
                                                            <th className="p-3.5">Product / Offer</th>
                                                            <th className="p-3.5">Role</th>
                                                            <th className="p-3.5">Type</th>
                                                            <th className="p-3.5">Price</th>
                                                            <th className="p-3.5 text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                        {(!currentStep.products || currentStep.products.length === 0) ? (
                                                            <tr>
                                                                <td colSpan={5} className="p-8 text-center text-neutral-400">
                                                                    No products attached to this step yet. Click <strong>"Add Product / Offer"</strong> to bind an offer from your store catalog.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            currentStep.products.map((p) => (
                                                                <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                                                                    <td className="p-3.5">
                                                                        <div className="flex items-center gap-3">
                                                                            {p.product?.image_url ? (
                                                                                <img
                                                                                    src={p.product.image_url}
                                                                                    alt={p.name}
                                                                                    className="w-9 h-9 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center border border-neutral-200 dark:border-neutral-700 shrink-0">
                                                                                    <Package className="w-4 h-4" />
                                                                                </div>
                                                                            )}
                                                                            <div className="min-w-0">
                                                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs truncate">
                                                                                    {p.name}
                                                                                </div>
                                                                                {p.bump_headline && (
                                                                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 italic mt-0.5">
                                                                                        Bump: "{p.bump_headline}"
                                                                                    </p>
                                                                                )}
                                                                                {p.product && (
                                                                                    <span className="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                                                        Catalog Synced
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3.5">
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                                                            p.type === 'bump'
                                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                                                : p.type === 'upsell'
                                                                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                                                                                : p.type === 'downsell'
                                                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                        }`}>
                                                                            {p.type === 'bump' ? 'Order Bump' : (p.type === 'main' ? 'Main Product' : (p.type === 'upsell' ? '1-Click Upsell' : (p.type === 'downsell' ? '1-Click Downsell' : p.type)))}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3.5 capitalize">
                                                                        {p.offer_type || 'Digital'}
                                                                    </td>
                                                                    <td className="p-3.5 font-bold text-neutral-900 dark:text-neutral-100">
                                                                        {fmtCurrency(p.price)}
                                                                    </td>
                                                                    <td className="p-3.5 text-right">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveProduct(p)}
                                                                            className="p-1.5 text-neutral-400 hover:text-red-500 rounded transition"
                                                                            title="Remove product"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </Card>
                                        </Card>
                                    ) : (
                                        /* Contextual Non-Commerce Step Strategy & Automation Guide */
                                        <Card padding={true} className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                <Sparkles className="w-4 h-4 text-brand-500" />
                                                <span>Step Strategy & Automation Details</span>
                                            </div>

                                            {currentStep.type === 'sales' && (
                                                <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 rounded-xl text-xs space-y-1.5 text-purple-900 dark:text-purple-200">
                                                    <strong className="font-bold">Sales Page Pipeline Role:</strong>
                                                    <p className="leading-relaxed text-purple-800 dark:text-purple-300">
                                                        Sales pages pitch your primary offer with headlines, benefits, proof, and video. In standard funnel pipelines, payment processing takes place on your <strong>Order Form / Checkout</strong> step.
                                                    </p>
                                                    <div className="pt-1 text-[11px] text-purple-700 dark:text-purple-400 font-medium">
                                                        💡 <em>Tip: In the Page Builder, set your CTA button action to <strong>"Go to Next Step"</strong> to seamlessly lead visitors to your checkout.</em>
                                                    </div>
                                                </div>
                                            )}

                                            {currentStep.type === 'optin' && (
                                                <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs space-y-1.5 text-blue-900 dark:text-blue-200">
                                                    <strong className="font-bold">Opt-in / Lead Capture Pipeline Role:</strong>
                                                    <p className="leading-relaxed text-blue-800 dark:text-blue-300">
                                                        Captures subscriber contacts in exchange for a free lead magnet, PDF guide, or checklist. Submissions automatically appear in your <strong>Leads</strong> tab.
                                                    </p>
                                                    <div className="pt-1 text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                                                        💡 <em>Tip: Forward visitors directly to an <strong>Opt-in Thank You</strong> or a bridge <strong>Sales Page</strong> upon submission.</em>
                                                    </div>
                                                </div>
                                            )}

                                            {currentStep.type === 'optin_thank_you' && (
                                                <div className="p-4 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 rounded-xl text-xs space-y-1.5 text-sky-900 dark:text-sky-200">
                                                    <strong className="font-bold">Opt-in Confirmation / Download Deliverable:</strong>
                                                    <p className="leading-relaxed text-sky-800 dark:text-sky-300">
                                                        Displayed immediately after lead submission. Provide direct download buttons for the free resource or invite users to join your community.
                                                    </p>
                                                </div>
                                            )}

                                            {currentStep.type === 'booking' && (
                                                <div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 rounded-xl text-xs space-y-1.5 text-teal-900 dark:text-teal-200">
                                                    <strong className="font-bold">Appointment & Calendar Booking:</strong>
                                                    <p className="leading-relaxed text-teal-800 dark:text-teal-300">
                                                        Ideal for high-ticket coaching, consulting, or client discovery calls. Embed your calendar widget in the Page Builder to allow leads to pick a time slot.
                                                    </p>
                                                </div>
                                            )}

                                            {currentStep.type === 'contact_us' && (
                                                <div className="p-4 bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/80 rounded-xl text-xs space-y-1.5 text-cyan-900 dark:text-cyan-200">
                                                    <strong className="font-bold">Contact Us & Inquiry Ingestion:</strong>
                                                    <p className="leading-relaxed text-cyan-800 dark:text-cyan-300">
                                                        Submissions from contact form elements on this page automatically create lead entries in your CRM with full name, email, and inquiry messages.
                                                    </p>
                                                </div>
                                            )}

                                            {['webinar_registration', 'webinar_broadcast', 'webinar_thank_you'].includes(currentStep.type) && (
                                                <div className="p-4 bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/80 rounded-xl text-xs space-y-1.5 text-violet-900 dark:text-violet-200">
                                                    <strong className="font-bold">Webinar Pipeline Step:</strong>
                                                    <p className="leading-relaxed text-violet-800 dark:text-violet-300">
                                                        {currentStep.type === 'webinar_registration' && 'Register attendees for upcoming live or automated webinars with dynamic countdown timers.'}
                                                        {currentStep.type === 'webinar_broadcast' && 'Host your presentation video stream with timed purchase buttons.'}
                                                        {currentStep.type === 'webinar_thank_you' && 'Deliver replay access, event tickets, and exclusive bonus downloads.'}
                                                    </p>
                                                </div>
                                            )}

                                            {['info_page', 'legal_terms', 'legal_privacy'].includes(currentStep.type) && (
                                                <div className="p-4 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1.5 text-slate-800 dark:text-slate-200">
                                                    <strong className="font-bold">Information & Compliance Documentation:</strong>
                                                    <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                                                        Required for advertising network compliance (Google Ads, Meta, TikTok) and international regulations (GDPR, CCPA). Link this step in your funnel footers.
                                                    </p>
                                                </div>
                                            )}

                                            {['thank_you', 'thankyou'].includes(currentStep.type) && (
                                                <div className="p-4 bg-green-50/70 dark:bg-green-950/30 border border-green-200 dark:border-green-800/80 rounded-xl text-xs space-y-1.5 text-green-900 dark:text-green-200">
                                                    <strong className="font-bold">Order Confirmation & Receipt:</strong>
                                                    <p className="leading-relaxed text-green-800 dark:text-green-300">
                                                        The final confirmation step of your funnel. Displays customer purchase details, transaction receipt, and next steps or access links.
                                                    </p>
                                                </div>
                                            )}
                                        </Card>
                                    )}

                                    {/* ── CARD 4: Attached Automation Workflows & Follow-up Rules ── */}
                                    <Card padding={true} className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                                    <Workflow className="w-4 h-4 text-brand-500" />
                                                    Attached Automation Workflows
                                                </h3>
                                                <p className="text-xs text-neutral-400">
                                                    Automated multi-channel follow-ups (Email, WhatsApp, SMS, Tagging, Pipeline Deals) triggered by this step.
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCreateWorkflowForStep}
                                                className="gap-1.5 text-xs text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800 hover:bg-brand-50"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Create Workflow for Step
                                            </Button>
                                        </div>

                                        {stepAutomations.length > 0 ? (
                                            <div className="space-y-2.5">
                                                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                        <span>Active Automation Connected ({stepAutomations.length})</span>
                                                    </div>
                                                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                                        Listening for triggers on {currentStep.name}
                                                    </span>
                                                </div>

                                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/40 dark:bg-neutral-850/40">
                                                    {stepAutomations.map((auto) => (
                                                        <div key={auto.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-white dark:hover:bg-neutral-800 transition">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs truncate">
                                                                        {auto.name}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                                        {auto.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
                                                                    <span>Trigger: {auto.trigger_config?.trigger_name || auto.trigger_type || 'Step Submission'}</span>
                                                                    <span>•</span>
                                                                    <span>Target: {currentStep.name}</span>
                                                                </p>
                                                            </div>
                                                            <a
                                                                href={route('client.automations.edit', auto.uuid)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition shrink-0"
                                                            >
                                                                Edit Workflow <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs space-y-2 text-amber-900 dark:text-amber-200">
                                                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                                                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                    <span>No Automation Workflow Connected</span>
                                                </div>
                                                <p className="leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                                                    Submissions and customer actions on <strong>{currentStep.name}</strong> will be saved to your CRM, but no automated follow-up emails, WhatsApp messages, or SMS will be sent automatically.
                                                </p>
                                                <div className="pt-1 flex items-center gap-2">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={handleCreateWorkflowForStep}
                                                        className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Create Workflow for this Step
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                </>
                            ) : (
                                <div className="p-12 text-center text-neutral-400">
                                    Select a step from the left sidebar or click "+ Add New Step" to begin.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── TAB 2: STATS & ANALYTICS (SYSTEME.IO FUNNEL MATRIX) ─────────── */}
                {activeTab === 'stats' && (
                    <div className="space-y-6">
                        {/* Top KPI Header: Total Sales, Average Cart Value & Date Filter */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                            <div className="flex items-center gap-12 sm:gap-20">
                                <div>
                                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                        Total sales
                                    </span>
                                    <p className="text-3xl sm:text-4xl font-extrabold text-[#0284c7] dark:text-[#38bdf8] mt-1 tracking-tight">
                                        {fmtCurrency(statsSummary.totalSalesRevenue)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                        Average cart value
                                    </span>
                                    <p className="text-3xl sm:text-4xl font-extrabold text-[#0284c7] dark:text-[#38bdf8] mt-1 tracking-tight">
                                        {fmtCurrency(statsSummary.avgCartValue)}
                                    </p>
                                </div>
                            </div>

                            {/* Date Filter with DatePicker */}
                            <div className="flex items-center gap-2">
                                <DatePicker
                                    value={filterStartDate}
                                    onChange={(val) => {
                                        setFilterStartDate(val);
                                        if (val) setSelectedDateRange('custom');
                                    }}
                                    placeholder="Start date"
                                    className="w-36"
                                />
                                <span className="text-neutral-400 dark:text-neutral-500 text-xs font-bold">—</span>
                                <DatePicker
                                    value={filterEndDate}
                                    onChange={(val) => {
                                        setFilterEndDate(val);
                                        if (val) setSelectedDateRange('custom');
                                    }}
                                    min={filterStartDate || undefined}
                                    placeholder="End date"
                                    className="w-36"
                                />
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={handleApplyDateRange}
                                    disabled={!filterStartDate && !filterEndDate}
                                    className="h-[38px] px-3.5 text-xs font-semibold shadow-xs"
                                >
                                    Filter
                                </Button>
                                {(filterStartDate || filterEndDate || selectedDateRange !== 'all') && (
                                    <button
                                        type="button"
                                        onClick={handleClearDates}
                                        className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                        title="Reset to all dates"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Systeme.io Multi-Column Funnel Performance Table */}
                        <Card padding={false} className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                                <thead>
                                    {/* Tier 1 Header */}
                                    <tr className="bg-[#f8fafc] dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-200 font-semibold border-b border-neutral-200 dark:border-neutral-700/80">
                                        <th rowSpan={2} className="p-3.5 border-r border-neutral-200 dark:border-neutral-700/60 font-bold text-neutral-800 dark:text-neutral-100 min-w-[180px]">
                                            Step
                                        </th>
                                        <th rowSpan={2} className="p-3.5 text-center border-r border-neutral-200 dark:border-neutral-700/60 font-bold text-neutral-800 dark:text-neutral-100 min-w-[100px]">
                                            Page views
                                        </th>
                                        <th colSpan={2} className="p-3 text-center border-r border-neutral-200 dark:border-neutral-700/60 font-bold text-neutral-800 dark:text-neutral-100">
                                            <span className="inline-flex items-center justify-center gap-1.5">
                                                Opt-ins
                                                <span title="Contacts collected via opt-in forms on this step" className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 text-[10px] cursor-help font-bold">
                                                    ?
                                                </span>
                                            </span>
                                        </th>
                                        <th colSpan={3} className="p-3 text-center border-r border-neutral-200 dark:border-neutral-700/60 font-bold text-neutral-800 dark:text-neutral-100">
                                            Sales
                                        </th>
                                        <th rowSpan={2} className="p-3.5 text-center font-bold text-neutral-800 dark:text-neutral-100 min-w-[130px]">
                                            Earnings / Pageview
                                        </th>
                                    </tr>
                                    {/* Tier 2 Header */}
                                    <tr className="bg-[#f8fafc] dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-700/80 text-[11px]">
                                        {/* Under Opt-ins */}
                                        <th className="py-2.5 px-3 text-center border-r border-neutral-200 dark:border-neutral-700/60">
                                            All
                                        </th>
                                        <th className="py-2.5 px-3 text-center border-r border-neutral-200 dark:border-neutral-700/60">
                                            Conversion rate
                                        </th>
                                        {/* Under Sales */}
                                        <th className="py-2.5 px-3 text-center border-r border-neutral-200 dark:border-neutral-700/60">
                                            Total
                                        </th>
                                        <th className="py-2.5 px-3 text-center border-r border-neutral-200 dark:border-neutral-700/60">
                                            Conversion rate
                                        </th>
                                        <th className="py-2.5 px-3 text-center border-r border-neutral-200 dark:border-neutral-700/60">
                                            Revenue
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-neutral-600 dark:text-neutral-300">
                                    {statsSummary.rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-neutral-400">
                                                No funnel steps found. Add steps to your funnel to view detailed conversion and sales analytics.
                                            </td>
                                        </tr>
                                    ) : (
                                        statsSummary.rows.map(({ step, views, isOptinType, isCommerceType, optinsCount, optinConvRate, salesCount, salesConvRate, salesRevenue, earningsPerView }) => (
                                            <tr key={step.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition">
                                                {/* Step Name */}
                                                <td className="p-3.5 border-r border-neutral-100 dark:border-neutral-800 font-medium text-neutral-900 dark:text-neutral-100">
                                                    <div className="flex items-center gap-2">
                                                        <span>{step.name}</span>
                                                    </div>
                                                </td>

                                                {/* Page views */}
                                                <td className="p-3.5 text-center border-r border-neutral-100 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                                                    {fmt(views)}
                                                </td>

                                                {/* Opt-ins All */}
                                                <td className="p-3.5 text-center border-r border-neutral-100 dark:border-neutral-800">
                                                    {isOptinType || optinsCount > 0 ? fmt(optinsCount) : (isCommerceType ? '-' : '0')}
                                                </td>

                                                {/* Opt-ins Conv Rate */}
                                                <td className="p-3.5 text-center border-r border-neutral-100 dark:border-neutral-800">
                                                    {isOptinType || optinsCount > 0 ? `${optinConvRate}%` : (isCommerceType ? '-' : '0%')}
                                                </td>

                                                {/* Sales Total */}
                                                <td className="p-3.5 text-center border-r border-neutral-100 dark:border-neutral-800">
                                                    {isCommerceType || salesCount > 0 ? fmt(salesCount) : '-'}
                                                </td>

                                                {/* Sales Conv Rate */}
                                                <td className="p-3.5 text-center border-r border-neutral-100 dark:border-neutral-800">
                                                    {isCommerceType || salesCount > 0 ? `${salesConvRate}%` : '-'}
                                                </td>

                                                {/* Sales Revenue */}
                                                <td className="p-3.5 text-center border-r border-neutral-100 dark:border-neutral-800 font-semibold text-neutral-800 dark:text-neutral-200">
                                                    {isCommerceType || salesRevenue > 0 ? fmtCurrency(salesRevenue) : '-'}
                                                </td>

                                                {/* Earnings / Pageview */}
                                                <td className="p-3.5 text-center font-semibold text-neutral-800 dark:text-neutral-200">
                                                    {views > 0 && (isCommerceType || salesRevenue > 0)
                                                        ? fmtCurrency(earningsPerView)
                                                        : (isCommerceType && views > 0 ? '$0.00' : '-')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {statsSummary.rows.length > 0 && (
                                    <tfoot className="bg-[#f8fafc] dark:bg-neutral-800/80 font-bold border-t-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs">
                                        <tr>
                                            <td className="p-3.5 border-r border-neutral-200 dark:border-neutral-700/60">
                                                Total / Overall
                                            </td>
                                            <td className="p-3.5 text-center border-r border-neutral-200 dark:border-neutral-700/60">
                                                {fmt(statsSummary.totalViews)}
                                            </td>
                                            <td className="p-3.5 text-center border-r border-neutral-200 dark:border-neutral-700/60">
                                                {fmt(statsSummary.totalOptins)}
                                            </td>
                                            <td className="p-3.5 text-center border-r border-neutral-200 dark:border-neutral-700/60 text-sky-600 dark:text-sky-400">
                                                {statsSummary.overallOptinRate}%
                                            </td>
                                            <td className="p-3.5 text-center border-r border-neutral-200 dark:border-neutral-700/60">
                                                {fmt(statsSummary.totalSalesCount)}
                                            </td>
                                            <td className="p-3.5 text-center border-r border-neutral-200 dark:border-neutral-700/60 text-emerald-600 dark:text-emerald-400">
                                                {statsSummary.overallSalesRate}%
                                            </td>
                                            <td className="p-3.5 text-center border-r border-neutral-200 dark:border-neutral-700/60 text-[#0284c7] dark:text-[#38bdf8]">
                                                {fmtCurrency(statsSummary.totalSalesRevenue)}
                                            </td>
                                            <td className="p-3.5 text-center text-purple-600 dark:text-purple-400">
                                                {fmtCurrency(statsSummary.overallEarningsPerView)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </Card>
                    </div>
                )}

                {/* ─── TAB 3: SALES & ORDERS ──────────────────────────────────────── */}
                {activeTab === 'sales' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card padding={true}>
                                <span className="text-xs text-neutral-400">Total Orders</span>
                                <p className="text-xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">{sales.length}</p>
                            </Card>
                            <Card padding={true}>
                                <span className="text-xs text-neutral-400">Total Funnel Revenue</span>
                                <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{fmtCurrency(funnel.total_revenue)}</p>
                            </Card>
                            <Card padding={true}>
                                <span className="text-xs text-neutral-400">Average Order Value (AOV)</span>
                                <p className="text-xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                                    {sales.length > 0 ? fmtCurrency(funnel.total_revenue / sales.length) : '$0.00'}
                                </p>
                            </Card>
                        </div>

                        <Card padding={false} className="overflow-hidden">
                            <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/60 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th className="p-3.5">Customer / Contact</th>
                                        <th className="p-3.5">Step</th>
                                        <th className="p-3.5">Status</th>
                                        <th className="p-3.5">Amount</th>
                                        <th className="p-3.5">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {sales.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-neutral-400">
                                                No sales recorded yet. Once visitors purchase via the order form or upsell, their transactions will appear here.
                                            </td>
                                        </tr>
                                    ) : (
                                        sales.map((order) => (
                                            <tr key={order.id}>
                                                <td className="p-3.5">
                                                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {order.contact_name || order.email || 'Customer'}
                                                    </div>
                                                    <div className="text-[11px] text-neutral-400">{order.email}</div>
                                                </td>
                                                <td className="p-3.5">{order.step?.name || 'Checkout'}</td>
                                                <td className="p-3.5">
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                        Paid
                                                    </span>
                                                </td>
                                                <td className="p-3.5 font-bold text-neutral-900 dark:text-neutral-100">
                                                    {fmtCurrency(order.amount || 0)}
                                                </td>
                                                <td className="p-3.5 text-neutral-400">{fmtDate(order.created_at)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                )}

                {/* ─── TAB 4: LEADS & OPT-INS ─────────────────────────────────────── */}
                {activeTab === 'leads' && (
                    <Card padding={false} className="overflow-hidden">
                        <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/60 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="p-3.5">Contact</th>
                                    <th className="p-3.5">Step Captured</th>
                                    <th className="p-3.5">UTM Source</th>
                                    <th className="p-3.5">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-neutral-400">
                                            No leads captured yet.
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id}>
                                            <td className="p-3.5">
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {lead.name || lead.email || 'Lead'}
                                                </div>
                                                <div className="text-[11px] text-neutral-400">{lead.email} {lead.phone && `• ${lead.phone}`}</div>
                                            </td>
                                            <td className="p-3.5">{lead.step?.name || 'Opt-in'}</td>
                                            <td className="p-3.5 text-neutral-400">{lead.utm_source || 'Direct'}</td>
                                            <td className="p-3.5 text-neutral-400">{fmtDate(lead.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                )}

                {/* ─── TAB 5: FUNNEL SETTINGS ─────────────────────────────────────── */}
                {activeTab === 'settings' && (
                    <Card padding={true} className="max-w-2xl space-y-5">
                        <div>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                                Funnel Configuration & Settings
                            </h3>
                            <p className="text-xs text-neutral-400">
                                Configure funnel name, URL slug, custom tracking pixels, and SEO metadata.
                            </p>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-4">
                            <Input
                                label="Funnel Name *"
                                type="text"
                                value={settingsForm.data.name}
                                onChange={(e) => settingsForm.setData('name', e.target.value)}
                                required
                            />

                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Funnel Slug Path *
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-neutral-500 border border-neutral-300 dark:border-neutral-700 rounded-md text-xs">
                                        /f/
                                    </span>
                                    <Input
                                        size="sm"
                                        wrapperClassName="flex-1"
                                        type="text"
                                        value={settingsForm.data.slug}
                                        onChange={(e) => settingsForm.setData('slug', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Input
                                label="SEO Meta Title"
                                type="text"
                                value={settingsForm.data.meta_title}
                                onChange={(e) => settingsForm.setData('meta_title', e.target.value)}
                                placeholder="e.g. Special Black Friday Offer"
                            />

                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    SEO Meta Description
                                </label>
                                <textarea
                                    value={settingsForm.data.meta_description}
                                    onChange={(e) => settingsForm.setData('meta_description', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>

                            <div className="pt-2">
                                <Button
                                    variant="primary"
                                    size="md"
                                    type="submit"
                                    disabled={settingsForm.processing}
                                >
                                    {settingsForm.processing ? 'Saving...' : 'Save Funnel Settings'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}
            </div>

            {/* ── MODAL: ADD STEP ──────────────────────────────────────────────── */}
            <Modal
                show={showAddStepModal}
                onClose={() => setShowAddStepModal(false)}
                title="Add New Funnel Step"
                maxWidth="md"
            >
                <form onSubmit={handleCreateStep} className="space-y-4 text-xs">
                    <Input
                        label="Step Name *"
                        type="text"
                        value={addStepForm.data.name}
                        onChange={(e) => addStepForm.setData('name', e.target.value)}
                        placeholder="e.g. Core Checkout, VIP Upsell, Booking"
                        required
                        autoFocus
                    />

                    <Select
                        label="Step Type Pipeline Role *"
                        value={addStepForm.data.type}
                        onChange={(e) => addStepForm.setData('type', e.target.value)}
                    >
                        <optgroup label="Sales & Commerce">
                            <option value="sales">Sales Page</option>
                            <option value="checkout" disabled={hasFunnelCheckout}>
                                Order Form / Checkout {hasFunnelCheckout ? '(Already in funnel — 1 Max)' : ''}
                            </option>
                            <option value="upsell">Upsell (One-Time-Offer / OTO)</option>
                            <option value="downsell">Downsell Discount</option>
                            <option value="thank_you" disabled={hasFunnelThankYou}>
                                Thank You / Confirmation {hasFunnelThankYou ? '(Already in funnel — 1 Max)' : ''}
                            </option>
                        </optgroup>
                        <optgroup label="Lead Generation">
                            <option value="optin">Opt-in / Lead Capture</option>
                            <option value="optin_thank_you">Opt-in Thank You</option>
                            <option value="contact_us">Contact Us Form (Inquiry)</option>
                            <option value="booking">Booking / Calendar Meeting</option>
                        </optgroup>
                        <optgroup label="Webinar Funnels">
                            <option value="webinar_registration">Webinar Registration</option>
                            <option value="webinar_broadcast">Webinar Broadcast / Room</option>
                            <option value="webinar_thank_you">Webinar Replay / Pass</option>
                        </optgroup>
                        <optgroup label="Legal & Information">
                            <option value="info_page">Info / Policy Page</option>
                            <option value="legal_terms">Terms & Conditions</option>
                            <option value="legal_privacy">Privacy Policy</option>
                        </optgroup>
                    </Select>
                    <div className="pt-2 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                        <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddStepModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit" disabled={addStepForm.processing}>
                            Create Step
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── MODAL: ADD PRODUCT TO STEP ───────────────────────────────────── */}
            <Modal
                show={showAddProductModal}
                onClose={() => setShowAddProductModal(false)}
                title={modalRoleTitle}
                description={modalRoleSubtitle}
                maxWidth="md"
            >
                <form onSubmit={handleAttachProduct} className="space-y-4 text-xs">
                    {/* Step Role Notice (Context-driven: Locked for Upsell/Downsell, Toggleable for Checkout Bumps) */}
                    {currentStep?.type === 'upsell' && (
                        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 text-indigo-800 dark:text-indigo-200 font-medium">
                            <ArrowUpRight className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                            <span>Configured automatically as <strong>1-Click Upsell (OTO)</strong> for this upsell step.</span>
                        </div>
                    )}

                    {currentStep?.type === 'downsell' && (
                        <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-800 dark:text-rose-200 font-medium">
                            <ArrowDownRight className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span>Configured automatically as <strong>1-Click Downsell Offer</strong> for this downsell step.</span>
                        </div>
                    )}

                    {currentStep?.type === 'checkout' && hasMainCheckoutProduct ? (
                        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1 text-xs">
                            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Configuring as Order Bump (Checkout Add-on)</span>
                            </div>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                A main product is already attached. This offer will be bound as an optional one-click checkbox add-on on the checkout page.
                            </p>
                        </div>
                    ) : (
                        currentStep?.type !== 'upsell' && currentStep?.type !== 'downsell' && (
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
                                <Checkbox
                                    label="Enable as Order Bump (Checkout Add-on)"
                                    description="Check this if this product is an optional one-click checkbox add-on on the checkout page instead of the main product."
                                    checked={productForm.data.type === 'bump'}
                                    onChange={(e) => {
                                        const isBump = e.target.checked;
                                        const prod = selectedCatalogProduct;
                                        const pr = productForm.data.price;
                                        productForm.setData((prev) => ({
                                            ...prev,
                                            type: isBump ? 'bump' : 'main',
                                            bump_headline: isBump && !prev.bump_headline ? `YES! Add ${prod?.name || prev.name || 'this add-on'} for only ${fmtCurrency(pr)}` : prev.bump_headline,
                                            bump_description: isBump && !prev.bump_description ? 'Special one-time offer available only right now on this order form.' : prev.bump_description,
                                        }));
                                    }}
                                />
                            </div>
                        )
                    )}

                    {/* Product Selection Dropdown (from Ecommerce Product Catalog) */}
                    <div>
                        {eligibleProducts.length > 0 ? (
                            <Select
                                label="Select Product from Store Catalog *"
                                value={productForm.data.product_id}
                                onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                                required
                            >
                                <option value="" disabled>-- Choose a product from catalog --</option>
                                {eligibleProducts.map((prod) => (
                                    <option key={prod.id} value={prod.id}>
                                        {prod.name} — {fmtCurrency(prod.price || prod.prices?.[0]?.price)} ({prod.product_type || 'Digital'})
                                    </option>
                                ))}
                            </Select>
                        ) : availableProducts.length > 0 ? (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-xs">
                                <strong>All products already attached:</strong> All {availableProducts.length} product(s) from your store catalog have already been attached to this step.
                            </div>
                        ) : (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                                <span>No products found in store catalog.</span>
                                <Link
                                    href={route().has('client.ecommerce.products.index') ? route('client.ecommerce.products.index') : '/app/ecommerce/products'}
                                    className="font-bold underline text-amber-900 dark:text-amber-100 hover:opacity-80"
                                    target="_blank"
                                >
                                    + Manage Products
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Selected Product Preview Card */}
                    {selectedCatalogProduct && (
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                            {selectedCatalogProduct.image_url ? (
                                <img
                                    src={selectedCatalogProduct.image_url}
                                    alt={selectedCatalogProduct.name}
                                    className="w-11 h-11 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                                />
                            ) : (
                                <div className="w-11 h-11 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800 shrink-0">
                                    <Package className="w-5 h-5" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-neutral-900 dark:text-neutral-100 truncate text-xs">
                                        {selectedCatalogProduct.name}
                                    </h4>
                                    <span className="capitalize px-1.5 py-0.2 rounded text-[10px] font-semibold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                        {selectedCatalogProduct.product_type || 'Digital'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                        {fmtCurrency(productForm.data.price)}
                                    </span>
                                    <span>•</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                        Catalog Synced
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pricing Tier Dropdown (if multiple prices exist) */}
                    {selectedCatalogProduct?.prices && selectedCatalogProduct.prices.length > 1 && (
                        <Select
                            label="Pricing Option / Tier *"
                            value={productForm.data.product_price_id}
                            onChange={(e) => handleSelectPriceTier(e.target.value)}
                        >
                            {selectedCatalogProduct.prices.map((tier) => (
                                <option key={tier.id} value={tier.id}>
                                    {tier.name || 'Standard'} — {fmtCurrency(tier.price)} {tier.billing_interval ? `/${tier.billing_interval}` : ''}
                                </option>
                            ))}
                        </Select>
                    )}

                    {/* Fallback Manual Inputs if no catalog products exist */}
                    {availableProducts.length === 0 && (
                        <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                            <Input
                                label="Product Title *"
                                type="text"
                                value={productForm.data.name}
                                onChange={(e) => productForm.setData('name', e.target.value)}
                                placeholder="e.g. Masterclass VIP Pass"
                                required
                            />
                            <Input
                                label="Price ($) *"
                                type="number"
                                step="0.01"
                                value={productForm.data.price}
                                onChange={(e) => productForm.setData('price', e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {/* Order Bump Specific Fields */}
                    {productForm.data.type === 'bump' && (
                        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-3">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-xs">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                Order Bump Checkout Configuration
                            </div>
                            <Input
                                label="Bump Headline *"
                                type="text"
                                value={productForm.data.bump_headline}
                                onChange={(e) => productForm.setData('bump_headline', e.target.value)}
                                placeholder="e.g. YES! Add the Audio Workbook for only $19"
                                required
                            />
                            <div>
                                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                                    Bump Description
                                </label>
                                <textarea
                                    value={productForm.data.bump_description}
                                    onChange={(e) => productForm.setData('bump_description', e.target.value)}
                                    placeholder="Explain why this one-time add-on is irresistible..."
                                    rows={2}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                        <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddProductModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            disabled={productForm.processing || (availableProducts.length > 0 && (!productForm.data.product_id || eligibleProducts.length === 0))}
                        >
                            {productForm.processing ? 'Attaching...' : 'Attach to Step'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </ClientLayout>
    );
}
