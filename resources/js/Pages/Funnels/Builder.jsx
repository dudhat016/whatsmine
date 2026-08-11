import { Head, Link, router, usePage } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    ChevronLeft, Plus, Trash2, Globe, Eye, EyeOff,
    Monitor, Tablet, Smartphone, Send, RotateCcw,
    Settings, BarChart2, Share2, CheckCircle, AlertTriangle,
    GripVertical, Layers, Zap, Image, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Play, Star, HelpCircle, ArrowRight, LayoutTemplate,
    MousePointerClick, Sparkles, MoveUp, MoveDown, Copy, RefreshCw,
    Palette, Code, Search, Upload, Bookmark, Columns, Sliders, Music,
    Clock, ListFilter, CheckSquare, MessageSquare, ShieldCheck, Download,
    Box, Maximize2, MoveHorizontal, MoveVertical, ChevronRight, FolderTree, FileText,
    GripHorizontal, DownloadCloud, SlidersHorizontal, SlidersVertical, CopyCheck, RefreshCw as ResetIcon
} from 'lucide-react';

import {
    VIEWPORTS, GOOGLE_FONTS, SYSTEM_FONTS, FONT_WEIGHTS,
    ELEMENT_CATEGORIES, ADMIN_BLOCK_TEMPLATES, STATUS_COLORS
} from './Builder/constants';

import {
    isContainer, wrapInStandardHierarchy, insertNestedItem,
    insertExistingNestedItem, deleteNestedElement, updateNestedElement,
    sanitizeElementForBrandInheritance, deepAssignNewIds
} from './Builder/utils/treeUtils';

import { buildBrandVars, collectElementCss, compileFullStyleTag } from './Builder/utils/cssCompiler';

import SaveBlockModal from './Builder/modals/SaveBlockModal';
import CodeExportModal from './Builder/modals/CodeExportModal';

import BlocksTab from './Builder/BlocksTab';
import SettingsTab from './Builder/SettingsTab';
import BrandTab from './Builder/BrandTab';
import LayersTab from './Builder/LayersTab';
import StepsTab from './Builder/StepsTab';
import SeoTab from './Builder/SeoTab';

const findNestedElement = (itemList, targetId) => {
    for (const item of itemList) {
        if (item.id === targetId) return item;
        if (item.elements && item.elements.length > 0) {
            const found = findNestedElement(item.elements, targetId);
            if (found) return found;
        }
        if (item.columns && item.columns.length > 0) {
            for (const col of item.columns) {
                if (col && col.length > 0) {
                    const found = findNestedElement(col, targetId);
                    if (found) return found;
                }
            }
        }
    }
    return null;
};

export default function FunnelBuilder({ funnel: initialFunnel }) {
    const { t } = useTranslation();
    const { props } = usePage();

    const [funnel, setFunnel] = useState(initialFunnel);
    const [activeStepId, setActiveStepId] = useState(funnel.steps?.[0]?.id ?? null);
    const [viewport, setViewport] = useState('desktop');
    const [sidebarTab, setSidebarTab] = useState('blocks');
    const [blockSubTab, setBlockSubTab] = useState('elements');
    const [mySavedBlocks, setMySavedBlocks] = useState([]);
    const [loadingSavedBlocks, setLoadingSavedBlocks] = useState(false);
    const [saveBlockModal, setSaveBlockModal] = useState(null);
    const [savedBlockName, setSavedBlockName] = useState('');
    const [copiedId, setCopiedId] = useState(false);

    // Drag & Drop Real-Time State
    const [draggingElement, setDraggingElement] = useState(null);
    const [dragOverTargetId, setDragOverTargetId] = useState(null);

    // Sections & Brand Style Guide State
    const [sections, setSections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [syncState, setSyncState] = useState('synced');

    const [styleGuide, setStyleGuide] = useState({
        systemColors: {
            primary: '#6EC1E4',
            secondary: '#54595F',
            text: '#7A7A7A',
            accent: '#61CE70',
        },
        customColors: [],
        defaultFont: "'Inter', sans-serif",
        fontSize: 17,
        lineHeight: 25,
        linkColor: '#c87a57',
        textColor: '#1f2937',
        bodyAlignment: 'left',

        headingFontType: 'Google Fonts',
        headingFontName: "'Lora', serif",
        headingFontStyle: '600',
        headingColor: '#111827',
        headingAlignment: 'left',

        containerMaxWidth: 1200,
        containerPaddingX: 32,
        sectionPaddingY: 48,
        containerAlignment: 'center',

        bgColor: '#ffffff',
        bgImage: '',
        bgBlur: 0,
    });

    const [seoSettings, setSeoSettings] = useState({
        metaTitle: funnel.meta_title || funnel.name || '',
        metaDescription: funnel.meta_description || '',
        ogImage: '',
    });

    const [customCode, setCustomCode] = useState({
        headerCode: '',
        footerCode: '',
    });

    const [showAddStep, setShowAddStep] = useState(false);
    const [newStep, setNewStep] = useState({ name: '', type: 'optin' });
    const [publishing, setPublishing] = useState(false);
    const [toast, setToast] = useState(null);

    const activeViewports = [
        { key: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
        { key: 'tablet',  label: `Tablet (${styleGuide?.tabletBreakpoint || 1024}px)`, icon: Tablet, width: `${styleGuide?.tabletBreakpoint || 1024}px` },
        { key: 'mobile',  label: `Mobile (${styleGuide?.mobileBreakpoint || 768}px)`, icon: Smartphone, width: `${styleGuide?.mobileBreakpoint || 768}px` },
        ...(styleGuide?.customBreakpoints || []).map(bp => ({
            key: bp.id || `bp_${bp.name}`,
            label: `${bp.name} (${bp.width || 1280}px)`,
            icon: Sliders,
            width: `${bp.width || 1280}px`
        }))
    ];

    const activeStep = funnel.steps?.find(s => s.id === activeStepId);
    const activePage = activeStep?.pages?.find(p => p.is_control) ?? activeStep?.pages?.[0];

    const selectedElement = findNestedElement(sections, selectedSectionId);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (activePage?.canvas_json) {
            if (activePage.canvas_json.sections) {
                setSections(activePage.canvas_json.sections);
            }
            if (activePage.canvas_json.styleGuide) {
                setStyleGuide(prev => ({ ...prev, ...activePage.canvas_json.styleGuide }));
            }
            if (activePage.canvas_json.seoSettings) {
                setSeoSettings(activePage.canvas_json.seoSettings);
            } else {
                setSeoSettings({
                    metaTitle: activePage.meta_title || funnel.meta_title || funnel.name || '',
                    metaDescription: activePage.meta_description || funnel.meta_description || '',
                    ogImage: activePage.og_image_url || '',
                });
            }
            if (activePage.canvas_json.customCode) {
                setCustomCode(activePage.canvas_json.customCode);
            }
        } else {
            setSections([ADMIN_BLOCK_TEMPLATES[0].data]);
        }
    }, [activeStepId, activePage?.id]);

    useEffect(() => {
        if (blockSubTab === 'my_blocks') {
            setLoadingSavedBlocks(true);
            axios.get(route('client.funnels.sections.index'))
                .then(res => setMySavedBlocks(res.data.sections || []))
                .catch(() => setMySavedBlocks([]))
                .finally(() => setLoadingSavedBlocks(false));
        }
    }, [blockSubTab]);

    // ── Update Element Settings with Device Override Support ─────────────────────────────
    const handleUpdateElementSetting = (targetId, keyOrObj, value) => {
        const updates = (typeof keyOrObj === 'object' && keyOrObj !== null) ? keyOrObj : { [keyOrObj]: value };
        const updated = updateNestedElement(sections, targetId, item => {
            if (viewport === 'desktop') {
                return {
                    ...item,
                    ...updates,
                    isLocallyOverridden: true,
                };
            } else {
                const deviceObj = item[viewport] || {};
                return {
                    ...item,
                    isLocallyOverridden: true,
                    [viewport]: {
                        ...deviceObj,
                        ...updates
                    }
                };
            }
        });
        setSections(updated);
        triggerAutoSave(updated, styleGuide, seoSettings, customCode);
    };

    // ── Reset Category Settings with Device Awareness ────────────────────────
    const handleResetElementCategory = (targetId, category) => {
        const updated = updateNestedElement(sections, targetId, item => {
            let keysToClean = [];
            if (category === 'typography') {
                keysToClean = ['fontSize', 'lineHeight', 'fontFamily', 'fontWeight', 'letterSpacing', 'textTransform', 'fontStyle', 'textDecoration', 'wordSpacing'];
            } else if (category === 'color') {
                keysToClean = ['textColor', 'bgColor', 'textBgColor', 'hoverTextColor', 'hoverBgColor', 'bgType', 'gradientStops', 'bgImage'];
            } else if (category === 'size_position') {
                keysToClean = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'padding', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'margin', 'paddingY', 'paddingX', 'alignment', 'width', 'height', 'minHeight', 'maxWidth'];
            } else if (category === 'shadow') {
                keysToClean = ['shadow', 'shadowColor', 'shadowH', 'shadowV', 'shadowBlur', 'shadowSpread', 'hoverShadow', 'hoverShadowColor', 'hoverShadowH', 'hoverShadowV', 'hoverShadowBlur', 'hoverShadowSpread'];
            } else if (category === 'border') {
                keysToClean = ['borderStyle', 'borderWidth', 'borderColor', 'borderRadiusTL', 'borderRadiusTR', 'borderRadiusBL', 'borderRadiusBR', 'borderRadius', 'hoverBorderStyle', 'hoverBorderWidth', 'hoverBorderColor', 'hoverBorderRadius'];
            }

            if (viewport !== 'desktop') {
                const deviceObj = { ...(item[viewport] || {}) };
                keysToClean.forEach(k => delete deviceObj[k]);
                return {
                    ...item,
                    [viewport]: deviceObj
                };
            }

            const newItem = { ...item };
            keysToClean.forEach(k => delete newItem[k]);
            delete newItem.isLocallyOverridden;
            return newItem;
        });

        setSections(updated);
        triggerAutoSave(updated, styleGuide, seoSettings, customCode);
        showToast(`Reset ${category.replace('_', ' ')} for ${viewport} to defaults`, 'info');
    };

    const handleDeleteSelectedElement = (targetId) => {
        const updated = deleteNestedElement(sections, targetId);
        setSections(updated);
        setSelectedSectionId(null);
        setSidebarTab('blocks');
        triggerAutoSave(updated, styleGuide, seoSettings, customCode);
        showToast('Element deleted', 'info');
    };



    // ── Drag & Drop Handlers ───────────────────────────────────────────
    const handleDragStart = (e, itemData) => {
        e.dataTransfer.setData('application/json', JSON.stringify(itemData));
        e.dataTransfer.effectAllowed = 'copy';
        setDraggingElement(itemData);
    };

    const handleDragEnd = () => {
        setDraggingElement(null);
        setDragOverTargetId(null);
    };

    const handleDragOver = (e, targetId) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        if (dragOverTargetId !== targetId) {
            setDragOverTargetId(targetId);
        }
    };

    // ─── NOTE: wrapInStandardHierarchy, isContainer, insertNestedItem,
    // insertExistingNestedItem are imported from utils/treeUtils.js above.
    // Do NOT redefine them here — local definitions shadow the imports (Bug 2/3/4 fix).

    const handleCanvasElementDragStart = (e, item) => {
        e.stopPropagation();
        const payload = { isExisting: true, existingId: item.id };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'move';
        setDraggingElement(payload);
    };

    const handleDropOnTarget = (e, targetId = null, colIdx = null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverTargetId(null);

        let itemData = draggingElement;
        if (!itemData) {
            try {
                const json = e.dataTransfer.getData('application/json');
                if (json) itemData = JSON.parse(json);
            } catch (err) {}
        }
        if (!itemData) return;

        // ── Case A: Reordering / Moving existing element on Canvas ──
        if (itemData.isExisting) {
            const existingId = itemData.existingId;
            if (existingId === targetId) {
                setDraggingElement(null);
                return;
            }
            const existingObj = findNestedElement(sections, existingId);
            if (!existingObj) {
                setDraggingElement(null);
                return;
            }

            // Bug 6 Fix: Guard against dropping a parent element into its own descendant.
            // Find if targetId lives anywhere inside existingObj's subtree.
            const isDescendant = !!findNestedElement(
                existingObj.elements || [],
                targetId
            ) || (existingObj.columns || []).some(col =>
                Array.isArray(col) && !!findNestedElement(col, targetId)
            );
            if (isDescendant) {
                showToast('Cannot move a parent element into its own child.', 'error');
                setDraggingElement(null);
                return;
            }

            // 1. Remove from previous position
            const cleanSections = deleteNestedElement(sections, existingId);

            // 2. Insert into new target position
            let updated = cleanSections;
            if (!targetId || targetId === 'canvas_root') {
                updated = [...cleanSections, existingObj];
            } else {
                updated = insertExistingNestedItem(cleanSections, targetId, colIdx, existingObj);
            }

            setSections(updated);
            setSelectedSectionId(existingId);
            triggerAutoSave(updated, styleGuide, seoSettings, customCode);
            showToast(`Moved ${existingObj.name || existingObj.type}!`, 'info');
            setDraggingElement(null);
            return;
        }

        // ── Case B: Dropping new element from Blocks library ──
        let updated = [...sections];

        if (!targetId || targetId === 'canvas_root') {
            const wrappedSection = wrapInStandardHierarchy(itemData);
            updated.push(wrappedSection);
            setSelectedSectionId(wrappedSection.id);
        } else {
            const cleanItemProps = JSON.parse(JSON.stringify(itemData));
            delete cleanItemProps.id;
            const newItem = {
                ...cleanItemProps,
                id: 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                elements: cleanItemProps.elements || [],
                columns: cleanItemProps.columns || [[], [], [], []],
            };
            updated = insertNestedItem(updated, targetId, colIdx, newItem);
            setSelectedSectionId(newItem.id);
        }

        setSections(updated);
        setSidebarTab('settings');
        triggerAutoSave(updated, styleGuide, seoSettings, customCode);
        showToast(`Inserted ${itemData.name || 'element'}!`, 'success');
        setDraggingElement(null);
    };

    const handleAddElement = (elItem) => {
        let updated = [...sections];

        if (elItem.type === 'section' || !selectedSectionId) {
            const wrappedSection = wrapInStandardHierarchy(elItem);
            updated.push(wrappedSection);
            setSelectedSectionId(wrappedSection.id);
        } else {
            const cleanItemProps = JSON.parse(JSON.stringify(elItem));
            delete cleanItemProps.id;
            const newItem = {
                ...cleanItemProps,
                id: 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                elements: cleanItemProps.elements || [],
                columns: cleanItemProps.columns || [[], [], [], []],
            };
            updated = insertNestedItem(updated, selectedSectionId, null, newItem);
            setSelectedSectionId(newItem.id);
        }

        setSections(updated);
        setSidebarTab('settings');
        triggerAutoSave(updated, styleGuide, seoSettings, customCode);
        showToast(`Added ${elItem.name}`, 'success');
    };

    const handleAddRootSection = () => {
        const newSec = {
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'section',
            name: 'Layout Section',
            title: `Page Section #${sections.length + 1}`,
            elements: [],
            columns: [[], [], [], []],
        };
        const updated = [...sections, newSec];
        setSections(updated);
        setSelectedSectionId(newSec.id);
        setSidebarTab('settings');
        triggerAutoSave(updated, styleGuide, seoSettings, customCode);
        showToast(`Added Section #${sections.length}`, 'success');
    };

    const handleAddAdminBlock = (template) => {
        // Use deepAssignNewIds so inserting the same template twice never creates duplicate IDs
        // (bug 11 fix: also ensures template data is a proper element tree, not custom-type placeholders)
        const cloned = JSON.parse(JSON.stringify(template.data));
        const newBlock = deepAssignNewIds(cloned);
        const updated = [...sections, newBlock];
        setSections(updated);
        setSelectedSectionId(newBlock.id);
        triggerAutoSave(updated, styleGuide, seoSettings, customCode);
        showToast(`Added ${template.name}`, 'success');
    };

    const handleAddSavedBlock = (savedBlock) => {
        axios.get(route('client.funnels.sections.show', savedBlock.id))
            .then(res => {
                const canvas = res.data.canvas_json || {};
                // Bug 19 Fix: deep-assign fresh IDs to every node in the saved block tree.
                // Without this, re-inserting the same saved block creates duplicate element IDs
                // which breaks drag-drop selection and CSS targeting.
                const freshBlock = deepAssignNewIds(canvas);
                const updated = [...sections, freshBlock];
                setSections(updated);
                triggerAutoSave(updated, styleGuide, seoSettings, customCode);
                showToast(`Inserted saved block "${savedBlock.name}"`, 'success');
            })
            .catch(() => showToast('Failed to insert saved block', 'error'));
    };

    const handleSaveSectionToMyBlocks = (e) => {
        e.preventDefault();
        if (!saveBlockModal || !savedBlockName) return;
        axios.post(route('client.funnels.sections.store'), {
            name: savedBlockName,
            canvas_json: saveBlockModal,
        })
        .then(() => {
            showToast(`Saved "${savedBlockName}" to My Blocks library!`, 'success');
            setSaveBlockModal(null);
            setSavedBlockName('');
            if (blockSubTab === 'my_blocks') {
                axios.get(route('client.funnels.sections.index'))
                    .then(res => setMySavedBlocks(res.data.sections || []));
            }
        })
        .catch(() => showToast('Failed to save block', 'error'));
    };

    const handleStyleChange = (keyOrObj, value) => {
        const updates = (typeof keyOrObj === 'object' && keyOrObj !== null) ? keyOrObj : { [keyOrObj]: value };
        setStyleGuide(prev => {
            const next = { ...prev, ...updates };
            triggerAutoSave(sections, next, seoSettings, customCode);
            return next;
        });
    };

    const handleSeoChange = (key, value) => {
        const updated = { ...seoSettings, [key]: value };
        setSeoSettings(updated);
        triggerAutoSave(sections, styleGuide, updated, customCode);
    };

    const handleCustomCodeChange = (key, value) => {
        const updated = { ...customCode, [key]: value };
        setCustomCode(updated);
        triggerAutoSave(sections, styleGuide, seoSettings, updated);
    };

    const handleAddStep = () => {
        if (!newStep.name.trim()) return;
        setPublishing(true);
        axios.post(route('client.funnels.steps.store', funnel.uuid), {
            name: newStep.name,
            type: newStep.type,
        })
        .then(res => {
            setFunnel(prev => ({ ...prev, steps: [...(prev.steps || []), res.data.step] }));
            setNewStep({ name: '', type: 'optin' });
            setShowAddStep(false);
            showToast(`Step "${res.data.step?.name}" added!`, 'success');
        })
        .catch(() => showToast('Failed to add step', 'error'))
        .finally(() => setPublishing(false));
    };

    const handleDeleteStep = (stepId) => {
        if (!confirm('Delete this step and all its pages?')) return;
        axios.delete(route('client.funnels.steps.destroy', [funnel.uuid, stepId]))
        .then(() => {
            setFunnel(prev => {
                const remainingSteps = prev.steps.filter(s => s.id !== stepId);
                // Bug 5 Fix: use the updated (post-deletion) steps list for the fallback,
                // not the stale pre-deletion funnel.steps.
                if (activeStepId === stepId) {
                    setActiveStepId(remainingSteps[0]?.id ?? null);
                }
                return { ...prev, steps: remainingSteps };
            });
            showToast('Step deleted', 'info');
        })
        .catch(() => showToast('Failed to delete step', 'error'));
    };

    const handleMoveSection = (index, direction) => {
        const updated = [...sections];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= updated.length) return;
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;
        setSections(updated);
        triggerAutoSave(updated, styleGuide, seoSettings, customCode);
    };

    const handleDeleteSection = (index) => {
        const updated = sections.filter((_, i) => i !== index);
        setSections(updated);
        triggerAutoSave(updated, styleGuide, seoSettings, customCode);
        showToast('Section removed', 'info');
    };

    const saveTimerRef = useRef(null);
    /**
     * triggerAutoSave — debounced canvas persistence.
     *
     * Bug 1 & 9 Fix:
     * - Debounce raised from 500ms → 1500ms so that typing a sentence
     *   doesn't fire 3–6 API calls per second.
     * - html_cache is intentionally OMITTED from auto-save. The HTML
     *   renderer is synchronous and expensive (it walks the full element tree).
     *   Running it on every keystroke can freeze the UI for 100–300ms on
     *   large pages. html_cache is regenerated on explicit Publish only.
     */
    const triggerAutoSave = (secList, styleObj, seoObj, codeObj) => {
        setSyncState('saving');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            if (!activeStep || !activePage) {
                setSyncState('synced');
                return;
            }
            axios.post(route('client.funnels.pages.save', [funnel.uuid, activePage.id]), {
                canvas_json: {
                    sections: secList,
                    styleGuide: styleObj,
                    seoSettings: seoObj,
                    customCode: codeObj
                },
                // html_cache omitted — regenerated only on Publish (see handlePublish).
                meta_title: seoObj?.metaTitle || null,
                meta_description: seoObj?.metaDescription || null,
                og_image_url: seoObj?.ogImage || null,
            })
            .then(() => setSyncState('synced'))
            .catch(() => setSyncState('unsaved'));
        }, 1500);
    };



    const handlePublish = () => {
        setPublishing(true);
        const savePromise = activePage?.id
            ? axios.post(route('client.funnels.pages.save', [funnel.uuid, activePage.id]), {
                canvas_json: { sections, styleGuide, seoSettings, customCode },
                html_cache: renderSectionsHtml(sections, styleGuide, seoSettings, customCode),
                meta_title: seoSettings?.metaTitle || null,
                meta_description: seoSettings?.metaDescription || null,
                og_image_url: seoSettings?.ogImage || null,
            })
            : Promise.resolve();

        savePromise
            .then(() => axios.post(route('client.funnels.publish', funnel.uuid)))
            .then(() => {
                showToast('Funnel published live!', 'success');
                router.reload({ only: ['funnel'] });
            })
            .catch(() => showToast('Publish error — check requirements', 'error'))
            .finally(() => setPublishing(false));
    };

    const isPublished = funnel.status === 'published';

    // ── UNIVERSAL RECURSIVE RRENDERER WITH REAL-TIME PROPERTY INJECTION ────────
    const CanvasFaqAccordion = ({ item, items, inlineStyles }) => {
        const [openIndices, setOpenIndices] = useState([0]);
        const toggle = (idx) => {
            setOpenIndices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
        };
        const itemObj = item || {};
        return (
            <div style={inlineStyles} className="w-full space-y-2">
                {(items || []).map((faq, fIdx) => {
                    const isOpen = openIndices.includes(fIdx);
                    return (
                        <div
                            key={fIdx}
                            style={{ borderColor: itemObj.itemBorderColor || '#e5e7eb' }}
                            className="rounded-xl border bg-white overflow-hidden shadow-sm transition"
                        >
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggle(fIdx); }}
                                style={{
                                    color: itemObj.qColor || '#111827',
                                    background: itemObj.qBgColor || '#ffffff',
                                    fontSize: itemObj.qFontSize ? `${itemObj.qFontSize}px` : undefined,
                                    fontWeight: itemObj.qFontWeight || '700',
                                }}
                                className="w-full p-4 flex items-center justify-between text-left transition hover:brightness-95"
                            >
                                <span>{faq.q || 'Question?'}</span>
                                <span style={{ color: itemObj.iconColor || '#9ca3af' }} className="text-xs transition-transform">{isOpen ? '▲' : '▼'}</span>
                            </button>
                            {isOpen && (
                                <p
                                    style={{
                                        color: itemObj.aColor || '#4b5563',
                                        background: itemObj.aBgColor || '#ffffff',
                                        fontSize: itemObj.aFontSize ? `${itemObj.aFontSize}px` : undefined,
                                        lineHeight: itemObj.aLineHeight || 1.6,
                                    }}
                                    className="px-4 pb-4 border-t border-neutral-100 pt-2.5"
                                >
                                    {faq.a || 'Answer text...'}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const CanvasTestimonialSlider = ({ item, items, inlineStyles }) => {
        const [activeIdx, setActiveIdx] = useState(0);
        const list = items?.length > 0 ? items : [{ quote: 'Sample quote', author: 'Author', role: 'Role' }];
        const count = list.length;
        const current = list[activeIdx] || list[0];
        const itemObj = item || {};

        const prev = (e) => {
            e.stopPropagation();
            setActiveIdx(i => (i - 1 + count) % count);
        };
        const next = (e) => {
            e.stopPropagation();
            setActiveIdx(i => (i + 1) % count);
        };

        return (
            <div style={inlineStyles} className="w-full relative group">
                <div
                    style={{
                        background: itemObj.cardBgColor || '#ffffff',
                        borderColor: itemObj.cardBorderColor || '#e5e7eb',
                    }}
                    className="w-full rounded-2xl border p-6 shadow-md text-center space-y-3 relative overflow-hidden transition-all"
                >
                    <div style={{ color: itemObj.starColor || '#f59e0b' }} className="flex justify-center gap-1 text-sm">★★★★★</div>
                    <blockquote
                        style={{
                            color: itemObj.quoteColor || '#1f2937',
                            fontSize: itemObj.quoteFontSize ? `${itemObj.quoteFontSize}px` : undefined,
                        }}
                        className="italic font-medium max-w-xl mx-auto min-h-[48px] flex items-center justify-center"
                    >
                        "{current.quote || 'This platform completely transformed our marketing performance!'}"
                    </blockquote>
                    <div className="flex items-center justify-center gap-2 pt-1">
                        {current.avatar && (
                            <img src={current.avatar} alt={current.author || 'Avatar'} className="h-9 w-9 rounded-full object-cover border border-neutral-200 shadow-sm" />
                        )}
                        <div
                            style={{
                                color: itemObj.authorColor || '#111827',
                                fontSize: itemObj.authorFontSize ? `${itemObj.authorFontSize}px` : undefined,
                            }}
                            className="font-bold text-left"
                        >
                            <p className="m-0 leading-tight">{current.author || 'Client Name'}</p>
                            <p className="m-0 opacity-70 font-normal text-[11px]">{current.role || 'Verified Customer'}</p>
                        </div>
                    </div>

                    {/* Prev / Next Arrows */}
                    {count > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={prev}
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-600 hover:bg-neutral-50 hover:text-black transition"
                            >‹</button>
                            <button
                                type="button"
                                onClick={next}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-600 hover:bg-neutral-50 hover:text-black transition"
                            >›</button>
                        </>
                    )}

                    {/* Dots */}
                    {count > 1 && (
                        <div className="flex justify-center items-center gap-1.5 pt-2">
                            {list.map((_, dotIdx) => (
                                <button
                                    key={dotIdx}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setActiveIdx(dotIdx); }}
                                    className={`h-2 rounded-full transition-all ${dotIdx === activeIdx ? 'w-6 bg-brand-600' : 'w-2 bg-neutral-200 hover:bg-neutral-300'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderElementBlock = (item, parentId, cIdx = null) => {
        if (!item) return null;
        // Merge active viewport overrides (mobile/tablet) into effective properties for canvas real-time preview
        const effRaw = (viewport !== 'desktop' && item[viewport]) ? { ...item, ...item[viewport] } : item;
        const eff = sanitizeElementForBrandInheritance(effRaw);
        const isSelected = selectedSectionId === item.id;

        const u = (key, def = 'px') => eff[`${key}Unit`] || def;
        const pU = u('padding', 'px');
        const mU = u('margin', 'px');

        const hasPad = eff.paddingTop !== undefined || eff.paddingRight !== undefined || eff.paddingBottom !== undefined || eff.paddingLeft !== undefined || eff.paddingY !== undefined || eff.paddingX !== undefined;
        const pTop = eff.paddingTop !== undefined ? `${eff.paddingTop}${u('paddingTop', pU)}` : (eff.paddingY !== undefined ? `${eff.paddingY}${pU}` : '0px');
        const pRight = eff.paddingRight !== undefined ? `${eff.paddingRight}${u('paddingRight', pU)}` : (eff.paddingX !== undefined ? `${eff.paddingX}${pU}` : '0px');
        const pBottom = eff.paddingBottom !== undefined ? `${eff.paddingBottom}${u('paddingBottom', pU)}` : (eff.paddingY !== undefined ? `${eff.paddingY}${pU}` : '0px');
        const pLeft = eff.paddingLeft !== undefined ? `${eff.paddingLeft}${u('paddingLeft', pU)}` : (eff.paddingX !== undefined ? `${eff.paddingX}${pU}` : '0px');

        const hasMar = eff.marginTop !== undefined || eff.marginRight !== undefined || eff.marginBottom !== undefined || eff.marginLeft !== undefined;
        const mTop = eff.marginTop !== undefined ? `${eff.marginTop}${u('marginTop', mU)}` : '0px';
        const mRight = eff.marginRight !== undefined ? `${eff.marginRight}${u('marginRight', mU)}` : '0px';
        const mBottom = eff.marginBottom !== undefined ? `${eff.marginBottom}${u('marginBottom', mU)}` : '0px';
        const mLeft = eff.marginLeft !== undefined ? `${eff.marginLeft}${u('marginLeft', mU)}` : '0px';

        const inlineStyles = {
            padding: hasPad ? `${pTop} ${pRight} ${pBottom} ${pLeft}` : undefined,
            margin: hasMar ? `${mTop} ${mRight} ${mBottom} ${mLeft}` : undefined,
            width: eff.width !== undefined ? `${eff.width}${eff.widthUnit || '%'}` : undefined,
            minHeight: eff.minHeight !== undefined && eff.minHeight !== '' ? `${eff.minHeight}${eff.minHeightUnit || 'px'}` : undefined,

            fontSize: eff.fontSize ? `${eff.fontSize}${u('fontSize', 'px')}` : undefined,
            lineHeight: eff.lineHeight ? `${eff.lineHeight}${u('lineHeight', 'px')}` : undefined,
            fontFamily: eff.fontFamily || undefined,
            fontWeight: eff.fontWeight || undefined,
            letterSpacing: eff.letterSpacing !== undefined ? `${eff.letterSpacing}${u('letterSpacing', 'px')}` : undefined,
            wordSpacing: eff.wordSpacing !== undefined ? `${eff.wordSpacing}${u('wordSpacing', 'px')}` : undefined,
            textTransform: eff.textTransform || undefined,
            fontStyle: eff.fontStyle || undefined,
            textDecoration: eff.textDecoration || undefined,
            color: eff.textColor || undefined,
            // ── BACKGROUND (Solid / Gradient / Image) ──────────────────────────
            ...(() => {
                const bgType = eff.bgType || 'solid';
                if (bgType === 'gradient') {
                    const gType = eff.gradientType || 'linear';
                    const angle = eff.gradientAngle !== undefined ? eff.gradientAngle : 135;
                    const rawStops = eff.gradientStops || [
                        { color: eff.gradientColor1 || '#6366f1', pos: 0 },
                        { color: eff.gradientColor2 || '#ec4899', pos: 100 },
                    ];
                    const stopsStr = [...rawStops].sort((a,b)=>a.pos-b.pos).map(s=>`${s.color} ${s.pos}%`).join(', ');
                    const gradient = gType === 'radial'
                        ? `radial-gradient(circle, ${stopsStr})`
                        : `linear-gradient(${angle}deg, ${stopsStr})`;
                    return { backgroundImage: gradient };
                }
                if (bgType === 'image') {
                    const styles = {};
                    if (eff.bgImage) {
                        styles.backgroundImage = eff.bgOverlay
                            ? `linear-gradient(${eff.bgOverlay}, ${eff.bgOverlay}), url(${eff.bgImage})`
                            : `url(${eff.bgImage})`;
                        styles.backgroundSize = eff.bgSize || 'cover';
                        styles.backgroundPosition = eff.bgPosition || 'center center';
                        styles.backgroundRepeat = eff.bgRepeat || 'no-repeat';
                    }
                    return styles;
                }
                // solid (default)
                const bg = eff.bgColor || eff.textBgColor;
                return bg ? { backgroundColor: bg } : {};
            })(),
            borderRadius: (eff.borderRadiusTL !== undefined || eff.borderRadiusTR !== undefined || eff.borderRadiusBL !== undefined || eff.borderRadiusBR !== undefined)
                ? `${eff.borderRadiusTL !== undefined ? eff.borderRadiusTL : (eff.borderRadius || 0)}px ${eff.borderRadiusTR !== undefined ? eff.borderRadiusTR : (eff.borderRadius || 0)}px ${eff.borderRadiusBR !== undefined ? eff.borderRadiusBR : (eff.borderRadius || 0)}px ${eff.borderRadiusBL !== undefined ? eff.borderRadiusBL : (eff.borderRadius || 0)}px`
                : (eff.borderRadius !== undefined ? `${eff.borderRadius}px` : undefined),

            border: (eff.borderStyle && eff.borderStyle !== 'none' && eff.borderStyle !== 'full' && eff.borderStyle !== 'dashed' && eff.borderStyle !== 'bottom')
                ? `${eff.borderWidth !== undefined ? eff.borderWidth : 1}px ${eff.borderStyle} ${eff.borderColor || '#d1d5db'}`
                : (eff.borderStyle === 'full' ? '1px solid #d1d5db' : eff.borderStyle === 'dashed' ? '2px dashed #94a3b8' : eff.borderStyle === 'bottom' ? undefined : 'none'),
            borderBottom: eff.borderStyle === 'bottom' ? '2px solid #d1d5db' : undefined,

            boxShadow: (eff.shadowColor || eff.shadowH !== undefined || eff.shadowV !== undefined || eff.shadowBlur !== undefined)
                ? `${eff.shadowPosition === 'inset' ? 'inset ' : ''}${eff.shadowH !== undefined ? eff.shadowH : 0}px ${eff.shadowV !== undefined ? eff.shadowV : 4}px ${eff.shadowBlur !== undefined ? eff.shadowBlur : 8}px ${eff.shadowSpread !== undefined ? eff.shadowSpread : 0}px ${eff.shadowColor || 'rgba(0,0,0,0.1)'}`
                : (eff.shadow === 'sm' ? '0 1px 3px rgba(0,0,0,0.1)' : eff.shadow === 'md' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : eff.shadow === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : eff.shadow === 'glow' ? '0 0 15px rgba(200,122,87,0.5)' : undefined),
            textAlign: eff.alignment || 'left',
        };

        // Bug 10 Fix: corrected Tailwind responsive visibility classes.
        // 'max-sm:hidden' = hide on mobile, show on desktop (sm and above).
        // 'sm:hidden'     = hide on desktop (sm and above), show on mobile.
        const visibilityClasses = [
            eff.visibleDesktop === false ? 'max-sm:hidden' : '',
            eff.visibleMobile  === false ? 'sm:hidden'     : '',
        ].filter(Boolean).join(' ');

        return (
            <div
                key={eff.id}
                draggable={true}
                onDragStart={(e) => handleCanvasElementDragStart(e, eff)}
                onDragOver={(e) => handleDragOver(e, eff.id)}
                onDrop={(e) => handleDropOnTarget(e, eff.id, cIdx)}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSectionId(eff.id);
                    setSidebarTab('settings');
                }}
                className={`w-full relative transition-all rounded-lg p-1.5 cursor-grab active:cursor-grabbing ${visibilityClasses} ${
                    isSelected ? 'ring-2 ring-brand-500 bg-brand-50/20 shadow-md' : 'hover:ring-1 hover:ring-brand-300'
                } ${dragOverTargetId === eff.id ? 'ring-2 ring-dashed ring-brand-600 bg-brand-100/50' : ''}`}
            >
                {/* Drag Handle Badge for Selected Element */}
                {isSelected && (
                    <div className="absolute -top-3.5 left-3 z-30 bg-neutral-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1 cursor-grab">
                        <GripVertical className="h-3 w-3 text-brand-400" />
                        <span>{eff.name || eff.type}</span>
                    </div>
                )}
                {/* ── SECTION CONTAINER ───── */}
                {eff.type === 'section' && (
                    <div
                        onDragOver={(e) => handleDragOver(e, eff.id)}
                        onDrop={(e) => handleDropOnTarget(e, eff.id)}
                        style={{
                            ...inlineStyles,
                            maxWidth: eff.containerWidth ? (eff.containerWidth === '100%' || String(eff.containerWidth).endsWith('%') ? '100%' : `${eff.containerWidth}px`) : undefined,
                            marginLeft: eff.containerWidth ? 'auto' : undefined,
                            marginRight: eff.containerWidth ? 'auto' : undefined,
                        }}
                        className={`w-full transition rounded-lg ${
                            dragOverTargetId === eff.id ? 'border-2 border-dashed border-amber-500 bg-amber-50/40 p-4' : ''
                        }`}
                    >
                        {eff.elements?.length === 0 ? (
                            <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 rounded-lg bg-neutral-50/50">
                                📥 Drag & drop elements or columns into this Section
                            </div>
                        ) : (
                            <div className="w-full">
                                {eff.elements?.map(el => renderElementBlock(el, eff.id))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── FLEXBOX CONTAINER (d-flex) ── */}
                {eff.type === 'flex_container' && (
                    <div
                        onDragOver={(e) => handleDragOver(e, eff.id)}
                        onDrop={(e) => handleDropOnTarget(e, eff.id)}
                        style={{
                            ...inlineStyles,
                            display: 'flex',
                            flexDirection: eff.flexDirection || 'row',
                            justifyContent: eff.justifyContent || 'flex-start',
                            alignItems: eff.alignItems || 'center',
                            flexWrap: eff.flexWrap || 'nowrap',
                            gap: eff.gap !== undefined ? `${eff.gap}px` : '24px',
                        }}
                        className={`${eff.width !== undefined ? '' : 'w-full'} transition-all rounded-lg ${eff.paddingTop !== undefined || eff.paddingY !== undefined ? '' : 'p-3'} min-h-[70px] ${
                            dragOverTargetId === eff.id ? 'border-2 border-dashed border-brand-500 bg-brand-50/40' : 'border border-dashed border-neutral-200'
                        }`}
                    >
                        {eff.elements?.length === 0 ? (
                            <div className="w-full p-4 text-center text-xs font-semibold text-neutral-400 bg-neutral-50/60 rounded-lg">
                                ⚡ Flexbox Container — Drag & Drop elements here
                            </div>
                        ) : (
                            eff.elements?.map(el => renderElementBlock(el, eff.id))
                        )}
                    </div>
                )}

                {/* ── CSS GRID CONTAINER ── */}
                {['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(eff.type) && (
                    <div
                        style={{
                            ...inlineStyles,
                            display: 'grid',
                            gridTemplateColumns: eff.gridColumns !== undefined
                                ? (typeof eff.gridColumns === 'number' ? `repeat(${eff.gridColumns}, ${eff.gridColumnsUnit || '1fr'})` : eff.gridColumns)
                                : (eff.gridPreset === 'custom'
                                    ? (eff.gridTemplateColumns || 'repeat(2, 1fr)')
                                    : (eff.gridPreset || (eff.type === 'col_1' ? '1fr' : eff.type === 'col_2' ? 'repeat(2, 1fr)' : eff.type === 'col_3' ? 'repeat(3, 1fr)' : eff.type === 'col_4' ? 'repeat(4, 1fr)' : eff.type === 'col_sidebar' ? '7fr 3fr' : `repeat(${eff.colsCount || 2}, 1fr)`))),
                            gap: eff.gap !== undefined ? `${eff.gap}px` : '24px',
                            justifyItems: eff.justifyItems || undefined,
                            alignItems: eff.alignItems || undefined,
                            gridAutoFlow: eff.gridAutoFlow || undefined,
                        }}
                        className="w-full"
                    >
                        {[...Array(eff.colsCount || 2)].map((_, innerColIdx) => {
                            const hasItems = eff.columns?.[innerColIdx]?.length > 0;
                            return (
                                <div
                                    key={innerColIdx}
                                    onDragOver={(e) => handleDragOver(e, `${eff.id}_col_${innerColIdx}`)}
                                    onDrop={(e) => handleDropOnTarget(e, eff.id, innerColIdx)}
                                    className={`transition-all rounded-lg ${
                                        dragOverTargetId === `${eff.id}_col_${innerColIdx}`
                                            ? 'border-2 border-dashed border-amber-500 bg-amber-50/40 p-3'
                                            : hasItems
                                            ? 'space-y-2'
                                            : 'p-4 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/30 text-center flex flex-col justify-center items-center min-h-[60px]'
                                    }`}
                                >
                                    {!hasItems ? (
                                        <p className="text-[11px] font-medium text-neutral-400">Column #{innerColIdx + 1} (Empty Grid Slot)</p>
                                    ) : (
                                        eff.columns?.[innerColIdx]?.map(colChild => renderElementBlock(colChild, eff.id, innerColIdx))
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── ATOMIC ELEMENTS ─── */}
                {['headline', 'subheadline'].includes(eff.type) && (() => {
                    const tagStr = (eff.headingTag || (eff.type === 'headline' ? 'h1' : 'h2')).toLowerCase();
                    const Tag = tagStr;
                    return (
                        <Tag
                            style={inlineStyles}
                            className="w-full transition-all"
                        >
                            {eff.content}
                        </Tag>
                    );
                })()}
                {eff.type === 'paragraph' && (
                    <p style={inlineStyles} className="w-full transition-all">{eff.content}</p>
                )}
                {eff.type === 'bullets' && (
                    <ul style={inlineStyles} className="space-y-2 text-left">
                        {eff.items?.map((bullet, bI) => (
                            <li key={bI} className="flex items-center gap-2 font-medium">
                                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> {bullet}
                            </li>
                        ))}
                    </ul>
                )}
                {eff.type === 'quote' && (
                    <blockquote style={inlineStyles} className="p-4 border-l-4 border-brand-500 italic rounded-r-lg space-y-1">
                        <p>"{eff.quote || eff.content}"</p>
                        <cite className="block text-xs font-bold not-italic text-brand-600">— {eff.author || 'Author'}</cite>
                    </blockquote>
                )}
                {eff.type === 'image' && (
                    <img
                        src={eff.url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'}
                        alt={eff.alt || ''}
                        style={{ ...inlineStyles, maxWidth: eff.maxWidth ? `${eff.maxWidth}%` : '100%' }}
                        className="mx-auto"
                    />
                )}
                {eff.type === 'video' && (
                    <div style={inlineStyles} className="aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-2xl bg-black border border-neutral-800 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <span style={{ backgroundColor: styleGuide.linkColor }} className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg"><Play className="h-6 w-6 text-white fill-white ml-1" /></span>
                            <span className="text-xs text-neutral-400">{eff.videoUrl || 'Click Play to Watch Video'}</span>
                        </div>
                    </div>
                )}
                {eff.type === 'submit_button' && (() => {
                    const iconMap = {
                        arrow: '→', lock: '🔒', lightning: '⚡', cart: '🛒', download: '📥', star: '⭐', sparkles: '✨', check: '✓'
                    };
                    const iconChar = eff.btnIcon && eff.btnIcon !== 'none' ? (iconMap[eff.btnIcon] || '') : '';
                    const iconPos = eff.btnIconPosition || 'right';
                    const btnLabel = iconChar
                        ? (iconPos === 'left' ? `${iconChar} ${eff.text || 'Submit'}` : `${eff.text || 'Submit'} ${iconChar}`)
                        : (eff.text || 'Submit →');

                    return (
                        <div className="funnel-btn-wrap">
                            <button
                                type="button"
                                style={inlineStyles}
                                className="funnel-builder-btn w-full transition-all rounded-xl cursor-pointer flex flex-col items-center justify-center gap-0.5"
                            >
                                <span>{btnLabel}</span>
                                {eff.subtext && (
                                    <span
                                        style={{
                                            color: eff.subtextColor || 'rgba(255,255,255,0.85)',
                                            fontSize: eff.subtextFontSize ? `${eff.subtextFontSize}px` : '11px',
                                        }}
                                        className="font-normal tracking-normal"
                                    >
                                        {eff.subtext}
                                    </span>
                                )}
                            </button>
                        </div>
                    );
                })()}
                {eff.type === 'input_email' && (
                    <div className="funnel-input-wrap">
                        <input type="email" style={inlineStyles} placeholder={eff.placeholder || 'Enter your email address...'} disabled className="funnel-builder-input w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm bg-white" />
                    </div>
                )}
                {eff.type === 'input_name' && (
                    <div className="funnel-input-wrap">
                        <input type="text" style={inlineStyles} placeholder={eff.placeholder || 'Enter your full name...'} disabled className="funnel-builder-input w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm bg-white" />
                    </div>
                )}
                {eff.type === 'divider' && <hr style={inlineStyles} className="border-neutral-300 my-4" />}
                {eff.type === 'spacer' && (
                    // Bug 7 Fix: derive height from element data — removed hardcoded h-10 (40px)
                    // which overrode any user-set padding/height from the SizePanel.
                    <div
                        style={{
                            ...inlineStyles,
                            height: eff.spacerHeight !== undefined
                                ? `${eff.spacerHeight}px`
                                : `${(eff.paddingY || 20) * 2}px`,
                        }}
                        className="border border-dashed border-neutral-200 rounded flex items-center justify-center text-[10px] text-neutral-400"
                    >
                        Spacer
                    </div>
                )}
                {eff.type === 'timer' && (() => {
                    const d = eff.days !== undefined ? eff.days : 0;
                    const h = eff.hours !== undefined ? eff.hours : 2;
                    const m = eff.minutes !== undefined ? eff.minutes : 15;
                    const s = eff.seconds !== undefined ? eff.seconds : 0;
                    const theme = eff.timerTheme || 'red_urgent';

                    const themeClasses = {
                        red_urgent: 'bg-red-50 border-red-200 text-red-600',
                        brand: 'bg-brand-50 border-brand-200 text-brand-700',
                        dark: 'bg-neutral-900 border-neutral-800 text-white',
                        light: 'bg-white border-neutral-200 text-neutral-900 shadow-sm',
                        minimal: 'bg-transparent border-0 text-brand-600'
                    };

                    return (
                        <div style={inlineStyles} className={`p-3.5 border rounded-xl text-center flex justify-center items-center gap-3 font-mono font-bold text-sm transition-all ${themeClasses[theme] || themeClasses.red_urgent}`}>
                            <Clock className="h-4 w-4 shrink-0 animate-pulse" />
                            <span>
                                {d > 0 && `${String(d).padStart(2, '0')}d : `}
                                {String(h).padStart(2, '0')}h : {String(m).padStart(2, '0')}m : {String(s).padStart(2, '0')}s
                            </span>
                        </div>
                    );
                })()}
                {/* Bug 1 Fix: audio renderer */}
                {eff.type === 'audio' && (
                    <div style={inlineStyles} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <Music className="h-4 w-4 text-brand-600 shrink-0" />
                            <span className="text-sm font-semibold text-neutral-700 truncate">{eff.title || 'Audio Track'}</span>
                        </div>
                        {eff.url ? (
                            <audio controls className="w-full h-10" src={eff.url} />
                        ) : (
                            <div className="h-10 rounded-lg border border-dashed border-neutral-300 bg-white flex items-center justify-center text-[11px] text-neutral-400">
                                Set Audio URL in settings panel →
                            </div>
                        )}
                    </div>
                )}
                {/* Bug 2 Fix: icon_box renderer */}
                {eff.type === 'icon_box' && (
                    <div style={inlineStyles} className="w-full rounded-xl border border-neutral-100 bg-white p-5 shadow-sm text-center space-y-2">
                        <div className="mx-auto h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-brand-600" />
                        </div>
                        <p className="font-bold text-neutral-900 text-sm">{eff.title || 'Feature Title'}</p>
                        <p className="text-xs text-neutral-500 leading-relaxed">{eff.desc || 'Feature description goes here.'}</p>
                    </div>
                )}
                {/* Bug 12 Fix: checkbox renderer */}
                {eff.type === 'checkbox' && (
                    <div style={inlineStyles} className="funnel-input-wrap">
                        <label className="flex items-start gap-2.5 cursor-default select-none">
                            <input type="checkbox" disabled className="mt-0.5 h-4 w-4 rounded accent-brand-600 shrink-0" />
                            <span className="text-sm text-neutral-700">{eff.text || 'I agree to the Terms of Service and Privacy Policy.'}</span>
                        </label>
                    </div>
                )}
                {/* Bug 3 Fix: progress_bar renderer */}
                {eff.type === 'progress_bar' && (
                    <div style={inlineStyles} className="w-full space-y-1">
                        {eff.label && <p className="text-xs font-semibold text-neutral-600">{eff.label}</p>}
                        <div className="w-full h-4 rounded-full bg-neutral-200 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${eff.percent || 80}%`,
                                    backgroundColor: eff.barColor || styleGuide.systemColors?.primary || '#467235',
                                }}
                            />
                        </div>
                        {eff.showPercent !== false && (
                            <p className="text-[11px] font-bold text-right" style={{ color: eff.barColor || styleGuide.systemColors?.primary || '#467235' }}>
                                {eff.percent || 80}%
                            </p>
                        )}
                    </div>
                )}
                {/* Bug 4 Fix: social share renderer */}
                {eff.type === 'social' && (
                    <div style={inlineStyles} className="flex flex-wrap gap-2 justify-center">
                        {[
                            { name: 'Facebook', color: '#1877F2', label: 'f Share' },
                            { name: 'Twitter/X', color: '#000000', label: '𝕏 Tweet' },
                            { name: 'WhatsApp', color: '#25D366', label: '✉ Share' },
                            { name: 'LinkedIn', color: '#0A66C2', label: 'in Share' },
                        ].map(s => (
                            <button key={s.name} type="button" disabled
                                className="rounded-lg px-3.5 py-2 text-xs font-bold text-white cursor-default"
                                style={{ backgroundColor: s.color }}
                            >{s.label}</button>
                        ))}
                    </div>
                )}

                {/* star_rating renderer */}
                {eff.type === 'star_rating' && (
                    <div style={inlineStyles} className="flex flex-col items-center gap-1 py-1">
                        <div className="flex items-center gap-1">
                            {[...Array(eff.stars || 5)].map((_, i) => (
                                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" style={{ color: eff.starColor || '#f59e0b', fill: eff.starColor || '#f59e0b' }} />
                            ))}
                        </div>
                        {eff.ratingText && (
                            <p className="text-xs font-semibold text-neutral-600">{eff.ratingText}</p>
                        )}
                    </div>
                )}

                {/* custom_code renderer */}
                {eff.type === 'custom_code' && (
                    <div style={inlineStyles} className="w-full rounded-xl border border-dashed border-purple-300 bg-purple-50/50 p-4 font-mono text-xs text-purple-900 overflow-x-auto space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-2">
                            <Code className="h-3.5 w-3.5" /> Custom HTML / Script Embed
                        </div>
                        <pre className="whitespace-pre-wrap break-all text-[11px] text-neutral-700 bg-white p-2.5 rounded border border-purple-100">{eff.code || '<!-- Enter custom HTML or script in settings -->'}</pre>
                    </div>
                )}

                {/* rich_text renderer */}
                {eff.type === 'rich_text' && (
                    <div
                        style={inlineStyles}
                        className="w-full prose prose-sm max-w-none transition-all"
                        dangerouslySetInnerHTML={{ __html: eff.htmlContent || eff.content || '<p>Enter rich text HTML in settings...</p>' }}
                    />
                )}

                {/* order_bump renderer */}
                {eff.type === 'order_bump' && (
                    <div style={inlineStyles} className="w-full rounded-xl border-2 border-dashed border-red-400 bg-red-50/60 p-4 space-y-2 relative shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <span className="inline-block rounded-md bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                {eff.badgeText || 'YES! ADD THIS TO MY ORDER'}
                            </span>
                            <span className="font-mono text-sm font-extrabold text-red-700">${eff.price || 17}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <input type="checkbox" disabled className="mt-1 h-5 w-5 rounded accent-red-600 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-neutral-900">{eff.title || 'ONE TIME OFFER: Add Checklist'}</h4>
                                <p className="text-xs text-neutral-600 leading-relaxed mt-0.5">{eff.desc || 'Check this box to instantly include this offer.'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* faq_accordion renderer */}
                {eff.type === 'faq_accordion' && (
                    <CanvasFaqAccordion item={eff} items={eff.items} inlineStyles={inlineStyles} />
                )}

                {/* testimonial_slider renderer */}
                {eff.type === 'testimonial_slider' && (
                    <CanvasTestimonialSlider item={eff} items={eff.items} inlineStyles={inlineStyles} />
                )}
            </div>
        );
    };

    // ── RECURSIVE LAYERS TREE VIEW COMPONENT ─────────────────────────────────
    const RenderLayerTreeItem = ({ item, depth = 0 }) => {
        if (!item) return null;
        return (
            <div className="space-y-1">
                <div
                    onClick={() => {
                        setSelectedSectionId(item.id);
                        setSidebarTab('settings');
                    }}
                    style={{ paddingLeft: `${depth * 14 + 8}px` }}
                    className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                        selectedSectionId === item.id ? 'bg-brand-50 border-brand-500 text-brand-600 font-bold' : 'bg-white border-neutral-200 hover:bg-neutral-50'
                    }`}
                >
                    <div className="flex items-center gap-1.5 truncate">
                        {item.type === 'section' ? <Box className="h-3.5 w-3.5 text-brand-600 shrink-0" /> :
                         item.type.startsWith('col_') ? <Columns className="h-3.5 w-3.5 text-amber-600 shrink-0" /> :
                         <FileText className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
                        <span className="truncate">{item.name || item.title || item.headline || item.type}</span>
                    </div>
                </div>

                {item.elements && item.elements.length > 0 && (
                    <div className="space-y-1">
                        {item.elements.map(child => <RenderLayerTreeItem key={child.id} item={child} depth={depth + 1} />)}
                    </div>
                )}

                {item.columns && item.columns.some(col => col && col.length > 0) && (
                    <div className="space-y-1">
                        {item.columns.map((col, cIdx) => (
                            col && col.length > 0 && (
                                <div key={cIdx} className="space-y-1">
                                    <div style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }} className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                                        Column #{cIdx + 1}
                                    </div>
                                    {col.map(colChild => <RenderLayerTreeItem key={colChild.id} item={colChild} depth={depth + 2} />)}
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <ClientLayout title={`Visual Funnel Builder — ${funnel.name}`} fullWidth>
            <Head title={`${funnel.name} — Real-time Funnel Builder`} />

            {/* Global Brand CSS Variables */}
            <style>{`
                :root {
                    --color-primary: ${styleGuide.systemColors?.primary || '#6EC1E4'};
                    --color-secondary: ${styleGuide.systemColors?.secondary || '#54595F'};
                    --color-text: ${styleGuide.systemColors?.text || '#7A7A7A'};
                    --color-accent: ${styleGuide.systemColors?.accent || '#61CE70'};
                    ${(styleGuide.customColors || []).map(c => `--color-${c.id}: ${c.value || '#3B82F6'};`).join('\n')}
                }
            `}</style>

            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@400;600;700&family=Outfit:wght@400;600;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />

            {/* Top Bar Navigation */}
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href={route('client.funnels.index')} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-600 transition">
                        <ChevronLeft className="h-4 w-4" /> Funnels
                    </Link>
                    <span className="text-neutral-200">|</span>
                    <h1 className="text-sm font-semibold text-neutral-900 truncate max-w-xs">{funnel.name}</h1>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[funnel.status] ?? ''}`}>{funnel.status}</span>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 pl-2">
                        {syncState === 'saving'   && <span className="flex items-center gap-1 text-amber-500"><RefreshCw className="h-3 w-3 animate-spin" /> Saving…</span>}
                        {syncState === 'synced'   && <span className="flex items-center gap-1 text-green-600 font-medium"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Real-time Synced</span>}
                        {/* Bug 18 Fix: show a visible warning when the last auto-save failed */}
                        {syncState === 'unsaved'  && <span className="flex items-center gap-1 text-red-600 font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Unsaved — check network</span>}
                    </div>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1 overflow-x-auto max-w-md">
                    {activeViewports.map(vp => (
                        <button key={vp.key} type="button" onClick={() => setViewport(vp.key)} className={`flex items-center gap-1 shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition ${viewport === vp.key ? 'bg-brand-600 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>
                            <vp.icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{vp.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {isPublished && (
                        <a href={`/f/${funnel.workspace_id}/${funnel.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-neutral-50">
                            <Globe className="h-4 w-4 text-green-600" /> Live Page
                        </a>
                    )}
                    <button type="button" onClick={handlePublish} disabled={publishing} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                        <Send className="h-4 w-4" /> {publishing ? 'Publishing…' : 'Publish Funnel'}
                    </button>
                </div>
            </header>

            <div className="flex h-[calc(100vh-57px)] overflow-hidden">
                {/* Left Sidebar */}
                <aside className="flex w-80 shrink-0 flex-col border-r border-neutral-200 bg-white overflow-y-auto">
                    <nav className="flex border-b border-neutral-200 bg-neutral-50">
                        {[
                            { key: 'blocks',   label: 'Blocks',   icon: Plus },
                            { key: 'settings', label: 'Settings', icon: Settings },
                            { key: 'brand',    label: 'Brand',    icon: Palette },
                            { key: 'layers',   label: 'Layers',   icon: FolderTree },
                            { key: 'steps',    label: 'Steps',    icon: ListFilter },
                            { key: 'seo',      label: 'SEO',      icon: Search },
                        ].map(tab => (
                            <button key={tab.key} type="button" onClick={() => setSidebarTab(tab.key)} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${sidebarTab === tab.key ? 'border-b-2 border-brand-600 text-brand-600 font-bold bg-white' : 'text-neutral-500'}`}>
                                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* BLOCKS TAB */}
                    {sidebarTab === 'blocks' && (
                        <BlocksTab
                            blockSubTab={blockSubTab}
                            setBlockSubTab={setBlockSubTab}
                            mySavedBlocks={mySavedBlocks}
                            loadingSavedBlocks={loadingSavedBlocks}
                            handleDragStart={handleDragStart}
                            handleDragEnd={handleDragEnd}
                            handleAddElement={handleAddElement}
                            handleAddAdminBlock={handleAddAdminBlock}
                            handleAddSavedBlock={handleAddSavedBlock}
                        />
                    )}

                    {/* SETTINGS TAB */}
                    {sidebarTab === 'settings' && (
                        <SettingsTab
                            selectedElement={selectedElement}
                            handleDeleteSelectedElement={handleDeleteSelectedElement}
                            handleUpdateElementSetting={handleUpdateElementSetting}
                            handleResetElementCategory={handleResetElementCategory}
                            styleGuide={styleGuide}
                            copiedId={copiedId}
                            setCopiedId={setCopiedId}
                            viewport={viewport}
                        />
                    )}

                    {/* BRAND TAB */}
                    {sidebarTab === 'brand' && (
                        <BrandTab
                            styleGuide={styleGuide}
                            handleStyleChange={handleStyleChange}
                        />
                    )}

                    {/* LAYERS TAB */}
                    {sidebarTab === 'layers' && (
                        <LayersTab
                            sections={sections}
                            selectedSectionId={selectedSectionId}
                            setSelectedSectionId={setSelectedSectionId}
                        />
                    )}

                    {/* STEPS TAB */}
                    {sidebarTab === 'steps' && (
                        <StepsTab
                            funnel={funnel}
                            activeStepId={activeStepId}
                            setActiveStepId={setActiveStepId}
                            showAddStep={showAddStep}
                            setShowAddStep={setShowAddStep}
                            newStep={newStep}
                            setNewStep={setNewStep}
                            handleAddStep={handleAddStep}
                            handleDeleteStep={handleDeleteStep}
                            publishing={publishing}
                        />
                    )}

                    {/* SEO TAB */}
                    {sidebarTab === 'seo' && (
                        <SeoTab
                            seoSettings={seoSettings}
                            handleSeoChange={handleSeoChange}
                            customCode={customCode}
                            handleCustomCodeChange={handleCustomCodeChange}
                            funnel={funnel}
                        />
                    )}
                </aside>

                {/* Canvas Body */}
                <main id="builder-canvas" className="flex flex-1 flex-col overflow-y-auto bg-neutral-100 items-center py-6 px-4">
                    <style>{`
                        #builder-canvas {
                            ${buildBrandVars(styleGuide)}
                        }
                        #builder-canvas h1 { margin:var(--brand-h1-margin-top) var(--brand-h1-margin-right) var(--brand-h1-margin-bottom) var(--brand-h1-margin-left); padding:var(--brand-h1-padding-top) var(--brand-h1-padding-right) var(--brand-h1-padding-bottom) var(--brand-h1-padding-left); font-family:var(--brand-h1-font-family); font-size:var(--brand-h1-font-size); font-weight:var(--brand-h1-font-weight); line-height:var(--brand-h1-line-height); color:var(--brand-h1-color); text-transform:var(--brand-h1-text-transform); font-style:var(--brand-h1-font-style); text-decoration:var(--brand-h1-text-decoration); }
                        #builder-canvas h2 { margin:var(--brand-h2-margin-top) var(--brand-h2-margin-right) var(--brand-h2-margin-bottom) var(--brand-h2-margin-left); padding:var(--brand-h2-padding-top) var(--brand-h2-padding-right) var(--brand-h2-padding-bottom) var(--brand-h2-padding-left); font-family:var(--brand-h2-font-family); font-size:var(--brand-h2-font-size); font-weight:var(--brand-h2-font-weight); line-height:var(--brand-h2-line-height); color:var(--brand-h2-color); text-transform:var(--brand-h2-text-transform); font-style:var(--brand-h2-font-style); text-decoration:var(--brand-h2-text-decoration); }
                        #builder-canvas h3 { margin:var(--brand-h3-margin-top) var(--brand-h3-margin-right) var(--brand-h3-margin-bottom) var(--brand-h3-margin-left); padding:var(--brand-h3-padding-top) var(--brand-h3-padding-right) var(--brand-h3-padding-bottom) var(--brand-h3-padding-left); font-family:var(--brand-h3-font-family); font-size:var(--brand-h3-font-size); font-weight:var(--brand-h3-font-weight); line-height:var(--brand-h3-line-height); color:var(--brand-h3-color); text-transform:var(--brand-h3-text-transform); font-style:var(--brand-h3-font-style); text-decoration:var(--brand-h3-text-decoration); }
                        #builder-canvas h4 { margin:var(--brand-h4-margin-top) var(--brand-h4-margin-right) var(--brand-h4-margin-bottom) var(--brand-h4-margin-left); padding:var(--brand-h4-padding-top) var(--brand-h4-padding-right) var(--brand-h4-padding-bottom) var(--brand-h4-padding-left); font-family:var(--brand-h4-font-family); font-size:var(--brand-h4-font-size); font-weight:var(--brand-h4-font-weight); line-height:var(--brand-h4-line-height); color:var(--brand-h4-color); text-transform:var(--brand-h4-text-transform); font-style:var(--brand-h4-font-style); text-decoration:var(--brand-h4-text-decoration); }
                        #builder-canvas h5 { margin:var(--brand-h5-margin-top) var(--brand-h5-margin-right) var(--brand-h5-margin-bottom) var(--brand-h5-margin-left); padding:var(--brand-h5-padding-top) var(--brand-h5-padding-right) var(--brand-h5-padding-bottom) var(--brand-h5-padding-left); font-family:var(--brand-h5-font-family); font-size:var(--brand-h5-font-size); font-weight:var(--brand-h5-font-weight); line-height:var(--brand-h5-line-height); color:var(--brand-h5-color); text-transform:var(--brand-h5-text-transform); font-style:var(--brand-h5-font-style); text-decoration:var(--brand-h5-text-decoration); }
                        #builder-canvas h6 { margin:var(--brand-h6-margin-top) var(--brand-h6-margin-right) var(--brand-h6-margin-bottom) var(--brand-h6-margin-left); padding:var(--brand-h6-padding-top) var(--brand-h6-padding-right) var(--brand-h6-padding-bottom) var(--brand-h6-padding-left); font-family:var(--brand-h6-font-family); font-size:var(--brand-h6-font-size); font-weight:var(--brand-h6-font-weight); line-height:var(--brand-h6-line-height); color:var(--brand-h6-color); text-transform:var(--brand-h6-text-transform); font-style:var(--brand-h6-font-style); text-decoration:var(--brand-h6-text-decoration); }
                        #builder-canvas p { margin:var(--brand-body-margin-top) var(--brand-body-margin-right) var(--brand-body-margin-bottom) var(--brand-body-margin-left); padding:var(--brand-body-padding-top) var(--brand-body-padding-right) var(--brand-body-padding-bottom) var(--brand-body-padding-left); font-family:var(--brand-body-font-family); font-size:var(--brand-body-font-size); font-weight:var(--brand-body-font-weight); line-height:var(--brand-body-line-height); color:var(--brand-body-color); }
                        #builder-canvas .funnel-btn-wrap button, #builder-canvas button.funnel-builder-btn { width:100%; padding:var(--brand-btn-padding-top) var(--brand-btn-padding-right) var(--brand-btn-padding-bottom) var(--brand-btn-padding-left); margin:var(--brand-btn-margin-top) var(--brand-btn-margin-right) var(--brand-btn-margin-bottom) var(--brand-btn-margin-left); font-family:var(--brand-btn-font-family); font-size:var(--brand-btn-font-size); font-weight:var(--brand-btn-font-weight); cursor:pointer; border:none; border-radius:var(--brand-btn-border-radius); background:var(--brand-btn-bg-color); color:var(--brand-btn-text-color); transition:all 0.2s ease; }
                        #builder-canvas .funnel-btn-wrap button:hover, #builder-canvas button.funnel-builder-btn:hover { background:var(--brand-btn-hover-bg-color); color:var(--brand-btn-hover-text-color); }
                        #builder-canvas .funnel-input-wrap input, #builder-canvas input.funnel-builder-input { width:100%; padding:var(--brand-field-padding-top) var(--brand-field-padding-right) var(--brand-field-padding-bottom) var(--brand-field-padding-left); margin:var(--brand-field-margin-top) var(--brand-field-margin-right) var(--brand-field-margin-bottom) var(--brand-field-margin-left); font-family:var(--brand-field-font-family); font-size:var(--brand-field-font-size); background:var(--brand-field-bg-color); color:var(--brand-field-text-color); border:1px solid var(--brand-field-border-color); border-radius:var(--brand-field-border-radius); outline:none; }
                    `}</style>
                    <div
                        style={{
                            width: activeViewports.find(v => v.key === viewport)?.width || '100%',
                            maxWidth: '100%',
                            backgroundColor: styleGuide.bgColor,
                            fontFamily: styleGuide.defaultFont,
                            color: styleGuide.textColor,
                        }}
                        className="rounded-xl shadow-2xl border border-neutral-200 flex flex-col max-h-[calc(100vh-100px)] w-full overflow-hidden"
                    >
                        <div className="bg-neutral-900 text-white px-4 py-2 flex items-center justify-between text-xs font-sans shrink-0 border-b border-neutral-800">
                            <span className="font-medium flex items-center gap-1 text-neutral-400">
                                <Box className="h-3.5 w-3.5 text-brand-400" /> Page Canvas Root
                            </span>
                            <span className="text-[11px] text-neutral-400">Max Width: {styleGuide.containerMaxWidth}px</span>
                        </div>

                        <div
                            onDragOver={(e) => handleDragOver(e, 'canvas_root')}
                            onDrop={(e) => handleDropOnTarget(e, null)}
                            className={`flex-1 overflow-y-auto transition-colors ${dragOverTargetId === 'canvas_root' ? 'bg-brand-50/20 ring-4 ring-brand-500' : ''}`}
                        >
                            <div style={{ maxWidth: `${styleGuide.containerMaxWidth}px` }} className="w-full mx-auto p-4 space-y-4">
                                {sections.map((sec, idx) => (
                                    <div key={sec.id || idx} className="group relative">
                                        <div className="absolute top-2 right-2 z-20 hidden group-hover:flex items-center gap-1 bg-neutral-900 text-white p-1 rounded shadow">
                                            <button type="button" onClick={() => handleMoveSection(idx, -1)} className="p-1 hover:text-brand-400"><MoveUp className="h-3.5 w-3.5" /></button>
                                            <button type="button" onClick={() => handleMoveSection(idx, 1)} className="p-1 hover:text-brand-400"><MoveDown className="h-3.5 w-3.5" /></button>
                                            <button type="button" onClick={() => handleDeleteSection(idx)} className="p-1 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                        {renderElementBlock(sec, sec.id)}
                                    </div>
                                ))}

                                <div className="pt-6 pb-6 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleAddRootSection}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-brand-500 bg-brand-50/60 hover:bg-brand-100/80 text-brand-700 font-bold text-xs shadow-sm transition"
                                    >
                                        <Plus className="h-4 w-4 text-brand-600" />
                                        Add New Section to Root Canvas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Save Block Modal */}
            <SaveBlockModal
                saveBlockModal={saveBlockModal}
                setSaveBlockModal={setSaveBlockModal}
                savedBlockName={savedBlockName}
                setSavedBlockName={setSavedBlockName}
                handleConfirmSaveBlock={handleSaveSectionToMyBlocks}
            />

            {/* Toast — Bug 16 Fix: use toast.type to pick correct color and icon */}
            {toast && (() => {
                const isError = toast.type === 'error';
                const isInfo  = toast.type === 'info';
                const bg = isError ? 'bg-red-600' : isInfo ? 'bg-neutral-700' : 'bg-green-600';
                const Icon = isError ? AlertTriangle : CheckCircle;
                return (
                    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg ${bg} px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all`}>
                        <Icon className="h-4 w-4 shrink-0" /> {toast.msg}
                    </div>
                );
            })()}
        </ClientLayout>
    );
}
