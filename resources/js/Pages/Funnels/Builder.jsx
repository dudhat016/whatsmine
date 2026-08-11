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
    sanitizeElementForBrandInheritance
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

    // ── Helper to guarantee strict Section -> Row -> Element structure ──────────
    const wrapInStandardHierarchy = (itemData) => {
        if (itemData.type === 'section') {
            const { id: templateId, ...cleanItemProps } = itemData;
            return {
                ...cleanItemProps,
                id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                elements: itemData.elements || [],
                columns: itemData.columns || [[], [], [], []],
            };
        }

        if (['col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(itemData.type)) {
            const { id: templateId, ...cleanItemProps } = itemData;
            const rowItem = {
                ...cleanItemProps,
                id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                columns: itemData.columns || [[], [], [], []],
                elements: [],
            };
            return {
                id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                type: 'section',
                name: 'Layout Section',
                title: 'Page Section',
                bgColor: '#ffffff',
                elements: [rowItem],
                columns: [[], [], [], []],
            };
        }

        const cleanItemProps = JSON.parse(JSON.stringify(itemData));
        delete cleanItemProps.id;

        const containerItem = {
            ...cleanItemProps,
            id: 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            elements: cleanItemProps.elements || [],
            columns: cleanItemProps.columns || [[], [], [], []],
        };

        if (['flex_container', 'grid_container'].includes(itemData.type)) {
            return {
                id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                type: 'section',
                name: 'Layout Section',
                title: 'Page Section',
                containerWidth: '1200',
                paddingY: 48,
                paddingX: 24,
                elements: [containerItem],
                columns: [[], [], [], []],
                mobile: { paddingY: 32, paddingX: 16 }
            };
        }

        const rowItem = {
            id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'col_1',
            name: '1 Column (Full Width)',
            colsCount: 1,
            columns: [[containerItem], [], [], []],
            elements: [],
        };

        return {
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'section',
            name: 'Layout Section',
            title: 'Page Section',
            containerWidth: '1200',
            paddingY: 48,
            paddingX: 24,
            elements: [rowItem],
            columns: [[], [], [], []],
            mobile: { paddingY: 32, paddingX: 16 }
        };
    };

    const isContainer = (type) => ['section', 'flex_container', 'grid_container'].includes(type);

    const insertNestedItem = (itemList, targetId, colIdx, newItem) => {
        return itemList.map(item => {
            if (item.id === targetId) {
                if (colIdx !== null) {
                    const columns = [...(item.columns || [[], [], [], []])];
                    columns[colIdx] = [...(columns[colIdx] || []), newItem];
                    return { ...item, columns };
                } else if (item.type === 'section' || item.type === 'flex_container') {
                    const elements = [...(item.elements || []), newItem];
                    return { ...item, elements };
                } else if (['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type)) {
                    const columns = [...(item.columns || [[], [], [], []])];
                    const targetCol = 0;
                    columns[targetCol] = [...(columns[targetCol] || []), newItem];
                    return { ...item, columns };
                } else if (item.elements !== undefined) {
                    const elements = [...(item.elements || []), newItem];
                    return { ...item, elements };
                }
            }

            let updatedItem = { ...item };
            let modified = false;

            if (item.elements && item.elements.length > 0) {
                const targetIdx = item.elements.findIndex(el => el.id === targetId);
                if (targetIdx !== -1) {
                    const elements = [...item.elements];
                    elements.splice(targetIdx + 1, 0, newItem);
                    return { ...item, elements };
                }
                const updatedEls = insertNestedItem(item.elements, targetId, colIdx, newItem);
                if (updatedEls !== item.elements) {
                    updatedItem.elements = updatedEls;
                    modified = true;
                }
            }

            if (item.columns && item.columns.length > 0) {
                const updatedCols = item.columns.map(col => {
                    if (!col) return col;
                    const targetIdx = col.findIndex(el => el.id === targetId);
                    if (targetIdx !== -1) {
                        const newCol = [...col];
                        newCol.splice(targetIdx + 1, 0, newItem);
                        return newCol;
                    }
                    return insertNestedItem(col, targetId, colIdx, newItem);
                });
                updatedItem.columns = updatedCols;
                modified = true;
            }

            return modified ? updatedItem : item;
        });
    };

    // ── Helper to insert an existing element adjacent to target or inside target container ────────
    const insertExistingNestedItem = (itemList, targetId, colIdx, itemToMove) => {
        return itemList.map(item => {
            if (item.id === targetId) {
                if (colIdx !== null) {
                    const columns = [...(item.columns || [[], [], [], []])];
                    columns[colIdx] = [...(columns[colIdx] || []), itemToMove];
                    return { ...item, columns };
                } else if (item.type === 'section' || item.type === 'flex_container') {
                    const elements = [...(item.elements || []), itemToMove];
                    return { ...item, elements };
                } else if (['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type)) {
                    const columns = [...(item.columns || [[], [], [], []])];
                    const targetCol = 0;
                    columns[targetCol] = [...(columns[targetCol] || []), itemToMove];
                    return { ...item, columns };
                } else if (item.elements !== undefined) {
                    const elements = [...(item.elements || []), itemToMove];
                    return { ...item, elements };
                }
            }

            let updatedItem = { ...item };
            let modified = false;

            if (item.elements && item.elements.length > 0) {
                const targetIdx = item.elements.findIndex(el => el.id === targetId);
                if (targetIdx !== -1) {
                    const elements = [...item.elements];
                    elements.splice(targetIdx + 1, 0, itemToMove);
                    return { ...item, elements };
                }
                const updatedEls = insertExistingNestedItem(item.elements, targetId, colIdx, itemToMove);
                if (updatedEls !== item.elements) {
                    updatedItem.elements = updatedEls;
                    modified = true;
                }
            }

            if (item.columns && item.columns.length > 0) {
                const updatedCols = item.columns.map(col => {
                    if (!col) return col;
                    const targetIdx = col.findIndex(el => el.id === targetId);
                    if (targetIdx !== -1) {
                        const newCol = [...col];
                        newCol.splice(targetIdx + 1, 0, itemToMove);
                        return newCol;
                    }
                    return insertExistingNestedItem(col, targetId, colIdx, itemToMove);
                });
                updatedItem.columns = updatedCols;
                modified = true;
            }

            return modified ? updatedItem : item;
        });
    };

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
        const { id: tmplId, ...cleanProps } = template.data;
        const newBlock = {
            ...cleanProps,
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            elements: [],
            columns: [[], [], [], []],
        };
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
                const { id: canvasId, ...cleanCanvas } = canvas;
                const newBlock = {
                    ...cleanCanvas,
                    id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                };
                const updated = [...sections, newBlock];
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
            setFunnel(prev => ({ ...prev, steps: prev.steps.filter(s => s.id !== stepId) }));
            if (activeStepId === stepId) setActiveStepId(funnel.steps?.[0]?.id ?? null);
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
                html_cache: renderSectionsHtml(secList, styleObj, seoObj, codeObj),
                meta_title: seoObj?.metaTitle || null,
                meta_description: seoObj?.metaDescription || null,
                og_image_url: seoObj?.ogImage || null,
            })
            .then(() => setSyncState('synced'))
            .catch(() => setSyncState('unsaved'));
        }, 500);
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

        const visibilityClasses = `${eff.visibleDesktop === false ? 'hidden sm:hidden' : ''} ${eff.visibleMobile === false ? 'hidden max-sm:hidden' : ''}`;

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
                                className="funnel-builder-btn w-full transition-all rounded-xl cursor-pointer"
                            >
                                {btnLabel}
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
                {eff.type === 'spacer' && <div style={inlineStyles} className="h-10 border border-dashed border-neutral-200 rounded flex items-center justify-center text-[10px] text-neutral-400">Spacer (40px)</div>}
                {eff.type === 'timer' && (
                    <div style={inlineStyles} className="p-3 bg-red-50 border border-red-200 rounded-xl text-center flex justify-center items-center gap-4 text-red-600 font-mono font-bold text-sm">
                        <Clock className="h-4 w-4" />
                        <span>0{eff.hours || 2} Hours : {eff.minutes || 15} Minutes : 45 Seconds</span>
                    </div>
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
                        {syncState === 'saving' && <span className="flex items-center gap-1 text-amber-500"><RefreshCw className="h-3 w-3 animate-spin" /> Saving…</span>}
                        {syncState === 'synced' && <span className="flex items-center gap-1 text-green-600 font-medium"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Real-time Synced</span>}
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

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
                    <CheckCircle className="h-4 w-4" /> {toast.msg}
                </div>
            )}
        </ClientLayout>
    );
}
