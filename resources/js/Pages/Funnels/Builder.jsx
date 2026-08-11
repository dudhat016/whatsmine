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

import BlocksTab from './Builder/BlocksTab';
import SettingsTab from './Builder/SettingsTab';
import BrandTab from './Builder/BrandTab';
import LayersTab from './Builder/LayersTab';
import StepsTab from './Builder/StepsTab';
import SeoTab from './Builder/SeoTab';

// ─── Recursive Helpers for Finding & Updating Nested Elements ─────────────────
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

const updateNestedElement = (itemList, targetId, updateFn) => {
    return itemList.map(item => {
        if (item.id === targetId) {
            return updateFn(item);
        }
        let updatedItem = { ...item };
        let modified = false;

        if (item.elements && item.elements.length > 0) {
            const updatedEls = updateNestedElement(item.elements, targetId, updateFn);
            if (updatedEls !== item.elements) {
                updatedItem.elements = updatedEls;
                modified = true;
            }
        }

        if (item.columns && item.columns.length > 0) {
            const updatedCols = item.columns.map(col => {
                if (!col || col.length === 0) return col;
                return updateNestedElement(col, targetId, updateFn);
            });
            updatedItem.columns = updatedCols;
            modified = true;
        }

        return modified ? updatedItem : item;
    });
};

const deleteNestedElement = (itemList, targetId) => {
    return itemList.filter(item => item.id !== targetId).map(item => {
        let updatedItem = { ...item };
        if (item.elements && item.elements.length > 0) {
            updatedItem.elements = deleteNestedElement(item.elements, targetId);
        }
        if (item.columns && item.columns.length > 0) {
            updatedItem.columns = item.columns.map(col => col ? deleteNestedElement(col, targetId) : []);
        }
        return updatedItem;
    });
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

    const sanitizeElementForBrandInheritance = (item) => {
        if (!item) return item;
        let clean = { ...item };

        if (!clean.isLocallyOverridden) {
            const textProps = ['fontSize', 'lineHeight', 'fontWeight', 'textColor', 'fontFamily', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingY', 'paddingX'];
            const inputProps = ['paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius', 'fontSize', 'fontFamily', 'bgColor', 'textColor', 'borderColor', 'marginBottom', 'marginTop', 'marginRight', 'marginLeft'];
            const btnProps = ['bgColor', 'textColor', 'fontSize', 'fontWeight', 'fontFamily', 'borderRadius', 'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginBottom', 'marginTop', 'marginRight', 'marginLeft'];
            const containerProps = ['containerWidth', 'gap', 'gapX', 'gapY', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems'];

            const propsToCleanMap = {
                headline: textProps,
                subheadline: textProps,
                paragraph: textProps,
                bullets: textProps,
                quote: textProps,
                input_email: inputProps,
                input_name: inputProps,
                input_phone: inputProps,
                submit_button: btnProps,
                section: containerProps,
                flex_container: containerProps,
                grid_container: containerProps,
                col_1: containerProps,
                col_2: containerProps,
                col_3: containerProps,
                col_4: containerProps,
                col_sidebar: containerProps,
            };

            const propsToClean = propsToCleanMap[clean.type];
            if (propsToClean) {
                propsToClean.forEach(p => delete clean[p]);
            }
        }
        return clean;
    };

    const buildBrandVars = (sg = {}) => {
        const sys = sg.systemColors || {};
        const custom = (sg.customColors || []).map(c => `--color-${c.id}: ${c.value || '#3B82F6'};`).join('\n');
        const headings = ['h1','h2','h3','h4','h5','h6'].map(h => {
            const typo = sg[`${h}Typography`] || {};
            const col = sg[`${h}Color`] || sg.headingColor || '#111827';
            const defaultMb = h === 'h1' || h === 'h2' || h === 'h3' ? 12 : (h === 'h4' ? 10 : 8);
            const mUnit = sg[`${h}MarginUnit`] || sg.headingMarginBottomUnit || 'px';
            const pUnit = sg[`${h}PaddingUnit`] || 'px';
            return `--brand-${h}-font-family: ${typo.family || sg.headingFontName || sg.defaultFont || "'Inter', sans-serif"};
            --brand-${h}-font-size: ${typo.size || (h === 'h1' ? 32 : h === 'h2' ? 24 : h === 'h3' ? 20 : 18)}px;
            --brand-${h}-font-weight: ${typo.weight || '700'};
            --brand-${h}-line-height: ${typo.lineHeight || 36}px;
            --brand-${h}-color: ${col};
            --brand-${h}-text-transform: ${typo.transform === 'Default' ? 'none' : (typo.transform || 'none')};
            --brand-${h}-font-style: ${typo.style === 'Default' ? 'normal' : (typo.style || 'normal')};
            --brand-${h}-text-decoration: ${typo.decoration === 'Default' ? 'none' : (typo.decoration || 'none')};
            --brand-${h}-margin-top: ${sg[`${h}MarginTop`] ?? 0}${mUnit};
            --brand-${h}-margin-right: ${sg[`${h}MarginRight`] ?? 0}${mUnit};
            --brand-${h}-margin-bottom: ${sg[`${h}MarginBottom`] ?? sg.headingMarginBottom ?? defaultMb}${mUnit};
            --brand-${h}-margin-left: ${sg[`${h}MarginLeft`] ?? 0}${mUnit};
            --brand-${h}-padding-top: ${sg[`${h}PaddingTop`] ?? 0}${pUnit};
            --brand-${h}-padding-right: ${sg[`${h}PaddingRight`] ?? 0}${pUnit};
            --brand-${h}-padding-bottom: ${sg[`${h}PaddingBottom`] ?? 0}${pUnit};
            --brand-${h}-padding-left: ${sg[`${h}PaddingLeft`] ?? 0}${pUnit};`;
        }).join('\n');

        const bodyTypo = sg.bodyTypography || {};
        const btnTypo = sg.btnTypography || {};
        const fieldTypo = sg.fieldTypography || {};
        const fieldBorder = sg.fieldBorder || {};

        return `
            --color-primary: ${sys.primary || '#6EC1E4'};
            --color-secondary: ${sys.secondary || '#54595F'};
            --color-text: ${sys.text || '#7A7A7A'};
            --color-accent: ${sys.accent || '#61CE70'};
            ${custom}
            ${headings}
            --brand-body-font-family: ${bodyTypo.family || sg.defaultFont || "'Inter', sans-serif"};
            --brand-body-font-size: ${bodyTypo.size || sg.fontSize || 16}px;
            --brand-body-font-weight: ${bodyTypo.weight || '400'};
            --brand-body-line-height: ${bodyTypo.lineHeight || sg.lineHeight || 24}px;
            --brand-body-color: ${sg.textColor || '#1f2937'};
            --brand-body-margin-top: ${sg.bodyMarginTop ?? 0}${sg.bodyMarginUnit || 'px'};
            --brand-body-margin-right: ${sg.bodyMarginRight ?? 0}${sg.bodyMarginUnit || 'px'};
            --brand-body-margin-bottom: ${sg.bodyMarginBottom ?? sg.paragraphMarginBottom ?? 16}${sg.bodyMarginUnit || sg.paragraphMarginBottomUnit || 'px'};
            --brand-body-margin-left: ${sg.bodyMarginLeft ?? 0}${sg.bodyMarginUnit || 'px'};
            --brand-body-padding-top: ${sg.bodyPaddingTop ?? 0}${sg.bodyPaddingUnit || 'px'};
            --brand-body-padding-right: ${sg.bodyPaddingRight ?? 0}${sg.bodyPaddingUnit || 'px'};
            --brand-body-padding-bottom: ${sg.bodyPaddingBottom ?? 0}${sg.bodyPaddingUnit || 'px'};
            --brand-body-padding-left: ${sg.bodyPaddingLeft ?? 0}${sg.bodyPaddingUnit || 'px'};

            --brand-btn-font-family: ${btnTypo.family || sg.defaultFont || "'Inter', sans-serif"};
            --brand-btn-font-size: ${btnTypo.size || 16}px;
            --brand-btn-font-weight: ${btnTypo.weight || '700'};
            --brand-btn-bg-color: ${sg.btnBgColor || sg.linkColor || '#c87a57'};
            --brand-btn-text-color: ${sg.btnTextColor || '#ffffff'};
            --brand-btn-border-radius: ${sg.btnRadiusTop ?? 12}px;
            --brand-btn-hover-bg-color: ${sg.btnHoverBgColor || '#b36443'};
            --brand-btn-hover-text-color: ${sg.btnHoverTextColor || '#ffffff'};
            --brand-btn-margin-top: ${sg.btnMarginTop ?? 0}${sg.btnMarginUnit || 'px'};
            --brand-btn-margin-right: ${sg.btnMarginRight ?? 0}${sg.btnMarginUnit || 'px'};
            --brand-btn-margin-bottom: ${sg.btnMarginBottom ?? sg.buttonMarginBottom ?? 16}${sg.btnMarginUnit || sg.buttonMarginBottomUnit || 'px'};
            --brand-btn-margin-left: ${sg.btnMarginLeft ?? 0}${sg.btnMarginUnit || 'px'};
            --brand-btn-padding-top: ${sg.btnPaddingTop ?? 14}${sg.btnPaddingUnit || 'px'};
            --brand-btn-padding-right: ${sg.btnPaddingRight ?? 28}${sg.btnPaddingUnit || 'px'};
            --brand-btn-padding-bottom: ${sg.btnPaddingBottom ?? 14}${sg.btnPaddingUnit || 'px'};
            --brand-btn-padding-left: ${sg.btnPaddingLeft ?? 28}${sg.btnPaddingUnit || 'px'};

            --brand-field-font-family: ${fieldTypo.family || sg.defaultFont || "'Inter', sans-serif"};
            --brand-field-font-size: ${fieldTypo.size || 14}px;
            --brand-field-bg-color: ${sg.fieldBgColor || '#ffffff'};
            --brand-field-text-color: ${sg.fieldTextColor || '#111827'};
            --brand-field-border-color: ${fieldBorder.color || '#d1d5db'};
            --brand-field-border-radius: ${sg.fieldRadiusTop ?? 8}px;
            --brand-field-margin-top: ${sg.fieldMarginTop ?? 0}${sg.fieldMarginUnit || 'px'};
            --brand-field-margin-right: ${sg.fieldMarginRight ?? 0}${sg.fieldMarginUnit || 'px'};
            --brand-field-margin-bottom: ${sg.fieldMarginBottom ?? sg.fieldMarginBottom ?? 12}${sg.fieldMarginUnit || 'px'};
            --brand-field-margin-left: ${sg.fieldMarginLeft ?? 0}${sg.fieldMarginUnit || 'px'};
            --brand-field-padding-top: ${sg.fieldPaddingTop ?? 12}${sg.fieldPaddingUnit || 'px'};
            --brand-field-padding-right: ${sg.fieldPaddingRight ?? 16}${sg.fieldPaddingUnit || 'px'};
            --brand-field-padding-bottom: ${sg.fieldPaddingBottom ?? 12}${sg.fieldPaddingUnit || 'px'};
            --brand-field-padding-left: ${sg.fieldPaddingLeft ?? 16}${sg.fieldPaddingUnit || 'px'};

            --brand-container-width: ${sg.containerWidth === '100%' || String(sg.containerWidth).endsWith('%') ? '100%' : `${sg.containerWidth ?? 1200}${sg.containerWidthUnit || 'px'}`};
            --brand-container-margin-top: ${sg.containerMarginTop ?? 0}${sg.containerMarginUnit || 'px'};
            --brand-container-margin-right: ${sg.containerMarginRight ?? 'auto'};
            --brand-container-margin-bottom: ${sg.containerMarginBottom ?? sg.sectionMarginBottom ?? 24}${sg.containerMarginUnit || sg.sectionMarginBottomUnit || 'px'};
            --brand-container-margin-left: ${sg.containerMarginLeft ?? 'auto'};
            --brand-container-padding-top: ${sg.containerPaddingTop ?? 48}${sg.containerPaddingUnit || 'px'};
            --brand-container-padding-right: ${sg.containerPaddingRight ?? 24}${sg.containerPaddingUnit || 'px'};
            --brand-container-padding-bottom: ${sg.containerPaddingBottom ?? 48}${sg.containerPaddingUnit || 'px'};
            --brand-container-padding-left: ${sg.containerPaddingLeft ?? 24}${sg.containerPaddingUnit || 'px'};
            --brand-element-gap-x: ${sg.elementGapX ?? sg.elementGap ?? 24}${sg.elementGapXUnit || 'px'};
            --brand-element-gap-y: ${sg.elementGapY ?? sg.elementGap ?? 24}${sg.elementGapYUnit || 'px'};

            --brand-quote-padding-top: ${sg.quotePaddingTop ?? 16}${sg.quotePaddingUnit || 'px'};
            --brand-quote-padding-right: ${sg.quotePaddingRight ?? 20}${sg.quotePaddingUnit || 'px'};
            --brand-quote-padding-bottom: ${sg.quotePaddingBottom ?? 16}${sg.quotePaddingUnit || 'px'};
            --brand-quote-padding-left: ${sg.quotePaddingLeft ?? 20}${sg.quotePaddingUnit || 'px'};
            --brand-quote-border-width: ${sg.quoteBorderWidth ?? 4}px;
            --brand-quote-border-color: ${sg.quoteBorderColor || sys.primary || '#6EC1E4'};
            --brand-quote-bg-color: ${sg.quoteBgColor || 'rgba(99,102,241,0.06)'};
            --brand-quote-text-color: ${sg.quoteTextColor || sys.text || '#374151'};
            --brand-quote-border-radius: ${sg.quoteBorderRadius || '0 8px 8px 0'};
            --brand-quote-font-style: ${sg.quoteFontStyle || 'italic'};
            --brand-quote-font-weight: ${sg.quoteFontWeight || 400};
            --brand-quote-cite-weight: ${sg.quoteCiteWeight || 700};
            --brand-quote-cite-style: ${sg.quoteCiteStyle || 'normal'};

            --brand-bullet-gap: ${sg.bulletGap ?? 8}px;
            --brand-bullet-icon-color: ${sg.bulletIconColor || sys.primary || '#16a34a'};

            --brand-img-border-radius: ${sg.imgBorderRadius ?? 8}px;
            --brand-img-shadow: ${sg.imgShadow || '0 4px 12px rgba(0,0,0,0.1)'};
            --brand-video-border-radius: ${sg.videoBorderRadius ?? 12}px;
            --brand-video-shadow: ${sg.videoShadow || '0 10px 25px rgba(0,0,0,0.2)'};

            --brand-divider-width: ${sg.dividerWidth ?? 1}px;
            --brand-divider-style: ${sg.dividerStyle || 'solid'};
            --brand-divider-color: ${sg.dividerColor || '#e5e7eb'};
            --brand-divider-margin-top: ${sg.dividerMarginTop ?? 24}px;
            --brand-divider-margin-bottom: ${sg.dividerMarginBottom ?? 24}px;

            --brand-spacer-height: ${sg.spacerHeight ?? 40}px;

            --brand-timer-padding: ${sg.timerPadding ?? 16}px;
            --brand-timer-border-radius: ${sg.timerBorderRadius ?? 12}px;
            --brand-timer-font-size: ${sg.timerFontSize ?? 24}px;
            --brand-timer-font-weight: ${sg.timerFontWeight ?? 700};
            --brand-timer-bg-color: ${sg.timerBgColor || '#fef2f2'};
            --brand-timer-border-color: ${sg.timerBorderColor || '#fca5a5'};
            --brand-timer-text-color: ${sg.timerTextColor || '#dc2626'};

            --brand-col-padding-top: ${sg.colPaddingTop ?? 0}${sg.colPaddingUnit || 'px'};
            --brand-col-padding-right: ${sg.colPaddingRight ?? 0}${sg.colPaddingUnit || 'px'};
            --brand-col-padding-bottom: ${sg.colPaddingBottom ?? 0}${sg.colPaddingUnit || 'px'};
            --brand-col-padding-left: ${sg.colPaddingLeft ?? 0}${sg.colPaddingUnit || 'px'};
            --brand-col-margin-top: ${sg.colMarginTop ?? 0}${sg.colMarginUnit || 'px'};
            --brand-col-margin-right: ${sg.colMarginRight ?? 0}${sg.colMarginUnit || 'px'};
            --brand-col-margin-bottom: ${sg.colMarginBottom ?? 0}${sg.colMarginUnit || 'px'};
            --brand-col-margin-left: ${sg.colMarginLeft ?? 0}${sg.colMarginUnit || 'px'};
        `;
    };

    // ── SCOPED CSS COMPILER (competitor-grade: responsive device rules) ──
    const collectElementCss = (rawItem, cssRules, tabletRules, mobileRules) => {
        if (!rawItem || !rawItem.id) return;
        const item = sanitizeElementForBrandInheritance(rawItem);
        const id = `el-${item.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

        const buildDeviceRuleList = (dObj) => {
            if (!dObj) return [];
            const r = [];
            if (dObj.containerWidth) {
                const cwUnit = dObj.containerWidthUnit || 'px';
                const cw = dObj.containerWidth;
                const mw = cw === '100%' || String(cw).endsWith('%') ? '100%' : `${cw}${cwUnit}`;
                r.push(`max-width:${mw}`);
                r.push(`margin-left:auto`);
                r.push(`margin-right:auto`);
            }
            const u = (key, def = 'px') => dObj[`${key}Unit`] || def;
            const pU = u('padding', 'px');
            const mU = u('margin', 'px');

            const hasPad = dObj.paddingTop !== undefined || dObj.paddingRight !== undefined || dObj.paddingBottom !== undefined || dObj.paddingLeft !== undefined || dObj.paddingY !== undefined || dObj.paddingX !== undefined;
            if (hasPad) {
                const pTop = dObj.paddingTop !== undefined ? `${dObj.paddingTop}${u('paddingTop', pU)}` : (dObj.paddingY !== undefined ? `${dObj.paddingY}${pU}` : '0px');
                const pRight = dObj.paddingRight !== undefined ? `${dObj.paddingRight}${u('paddingRight', pU)}` : (dObj.paddingX !== undefined ? `${dObj.paddingX}${pU}` : '0px');
                const pBottom = dObj.paddingBottom !== undefined ? `${dObj.paddingBottom}${u('paddingBottom', pU)}` : (dObj.paddingY !== undefined ? `${dObj.paddingY}${pU}` : '0px');
                const pLeft = dObj.paddingLeft !== undefined ? `${dObj.paddingLeft}${u('paddingLeft', pU)}` : (dObj.paddingX !== undefined ? `${dObj.paddingX}${pU}` : '0px');
                r.push(`padding:${pTop} ${pRight} ${pBottom} ${pLeft}`);
            }

            const hasMar = dObj.marginTop !== undefined || dObj.marginRight !== undefined || dObj.marginBottom !== undefined || dObj.marginLeft !== undefined;
            if (hasMar) {
                const mTop = dObj.marginTop !== undefined ? `${dObj.marginTop}${u('marginTop', mU)}` : '0px';
                const mRight = dObj.marginRight !== undefined ? `${dObj.marginRight}${u('marginRight', mU)}` : '0px';
                const mBottom = dObj.marginBottom !== undefined ? `${dObj.marginBottom}${u('marginBottom', mU)}` : '0px';
                const mLeft = dObj.marginLeft !== undefined ? `${dObj.marginLeft}${u('marginLeft', mU)}` : '0px';
                r.push(`margin:${mTop} ${mRight} ${mBottom} ${mLeft}`);
            }
            if (dObj.fontSize)      r.push(`font-size:${dObj.fontSize}${u('fontSize', 'px')}`);
            if (dObj.lineHeight)    r.push(`line-height:${dObj.lineHeight}${u('lineHeight', 'px')}`);
            if (dObj.fontFamily)    r.push(`font-family:${dObj.fontFamily}`);
            if (dObj.fontWeight)    r.push(`font-weight:${dObj.fontWeight}`);
            if (dObj.letterSpacing !== undefined) r.push(`letter-spacing:${dObj.letterSpacing}${u('letterSpacing', 'px')}`);
            if (dObj.wordSpacing !== undefined)   r.push(`word-spacing:${dObj.wordSpacing}${u('wordSpacing', 'px')}`);
            if (dObj.textTransform) r.push(`text-transform:${dObj.textTransform}`);
            if (dObj.fontStyle)     r.push(`font-style:${dObj.fontStyle}`);
            if (dObj.textDecoration)r.push(`text-decoration:${dObj.textDecoration}`);
            if (dObj.textColor)     r.push(`color:${dObj.textColor}`);
            // ── BACKGROUND (Solid / Gradient / Image) ──────────────────────────
            const bgType = dObj.bgType || 'solid';
            if (bgType === 'gradient') {
                const gType = dObj.gradientType || 'linear';
                const angle = dObj.gradientAngle !== undefined ? dObj.gradientAngle : 135;
                const rawStops = dObj.gradientStops || [
                    { color: dObj.gradientColor1 || '#6366f1', pos: 0 },
                    { color: dObj.gradientColor2 || '#ec4899', pos: 100 },
                ];
                const stopsStr = [...rawStops].sort((a,b)=>a.pos-b.pos).map(s=>`${s.color} ${s.pos}%`).join(', ');
                const grad = gType === 'radial'
                    ? `radial-gradient(circle, ${stopsStr})`
                    : `linear-gradient(${angle}deg, ${stopsStr})`;
                r.push(`background-image:${grad}`);
            } else if (bgType === 'image') {
                if (dObj.bgImage) {
                    const overlay = dObj.bgOverlay;
                    const img = overlay
                        ? `linear-gradient(${overlay}, ${overlay}), url(${dObj.bgImage})`
                        : `url(${dObj.bgImage})`;
                    r.push(`background-image:${img}`);
                    r.push(`background-size:${dObj.bgSize || 'cover'}`);
                    r.push(`background-position:${dObj.bgPosition || 'center center'}`);
                    r.push(`background-repeat:${dObj.bgRepeat || 'no-repeat'}`);
                }
            } else {
                // solid
                if (dObj.bgColor)  r.push(`background-color:${dObj.bgColor}`);
            }
            if (dObj.alignment)     r.push(`text-align:${dObj.alignment}`);

            // Border Radius
            if (dObj.borderRadiusTL !== undefined || dObj.borderRadiusTR !== undefined || dObj.borderRadiusBL !== undefined || dObj.borderRadiusBR !== undefined) {
                const tl = dObj.borderRadiusTL !== undefined ? dObj.borderRadiusTL : (dObj.borderRadius || 0);
                const tr = dObj.borderRadiusTR !== undefined ? dObj.borderRadiusTR : (dObj.borderRadius || 0);
                const bl = dObj.borderRadiusBL !== undefined ? dObj.borderRadiusBL : (dObj.borderRadius || 0);
                const br = dObj.borderRadiusBR !== undefined ? dObj.borderRadiusBR : (dObj.borderRadius || 0);
                r.push(`border-radius:${tl}px ${tr}px ${br}px ${bl}px`);
            } else if (dObj.borderRadius !== undefined) {
                r.push(`border-radius:${dObj.borderRadius}px`);
            }

            // Borders
            if (dObj.borderStyle && dObj.borderStyle !== 'none') {
                const bw = dObj.borderWidth !== undefined ? dObj.borderWidth : 1;
                const bc = dObj.borderColor || '#d1d5db';
                r.push(`border:${bw}px ${dObj.borderStyle} ${bc}`);
            } else if (dObj.borderStyle === 'none') {
                r.push('border:none');
            }

            // Box Shadow
            if (dObj.shadowColor || dObj.shadowH !== undefined || dObj.shadowV !== undefined || dObj.shadowBlur !== undefined) {
                const pos = dObj.shadowPosition === 'inset' ? 'inset ' : '';
                const shColor = dObj.shadowColor || 'rgba(0,0,0,0.1)';
                const shH = dObj.shadowH !== undefined ? dObj.shadowH : 0;
                const shV = dObj.shadowV !== undefined ? dObj.shadowV : 4;
                const shB = dObj.shadowBlur !== undefined ? dObj.shadowBlur : 8;
                const shS = dObj.shadowSpread !== undefined ? dObj.shadowSpread : 0;
                r.push(`box-shadow:${pos}${shH}px ${shV}px ${shB}px ${shS}px ${shColor}`);
            } else if (dObj.shadow) {
                if (dObj.shadow === 'none') r.push('box-shadow:none');
                if (dObj.shadow === 'sm')   r.push('box-shadow:0 1px 3px rgba(0,0,0,0.1)');
                if (dObj.shadow === 'md')   r.push('box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)');
                if (dObj.shadow === 'lg')   r.push('box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)');
                if (dObj.shadow === 'glow') r.push('box-shadow:0 0 15px rgba(200,122,87,0.5)');
            }

            // Layout Engine: Flexbox vs Grid vs Block
            if (dObj.width !== undefined) r.push(`width:${dObj.width}${dObj.widthUnit || '%'}`);
            if (dObj.minHeight !== undefined && dObj.minHeight !== '') r.push(`min-height:${dObj.minHeight}${dObj.minHeightUnit || 'px'}`);

            if (dObj.layoutMode === 'grid') {
                r.push('display:grid');
                if (dObj.gridColumns !== undefined) {
                    const rawUnit = dObj.gridColumnsUnit || '1fr';
                    const unit = rawUnit === 'fr' ? '1fr' : rawUnit;
                    const gc = typeof dObj.gridColumns === 'number' ? `repeat(${dObj.gridColumns}, ${unit})` : dObj.gridColumns;
                    r.push(`grid-template-columns:${gc}`);
                } else {
                    const cols = dObj.gridPreset === 'custom'
                        ? (dObj.gridTemplateColumns || 'repeat(2, 1fr)')
                        : (dObj.gridPreset || 'repeat(2, 1fr)');
                    r.push(`grid-template-columns:${cols}`);
                }
                if (dObj.gridRows !== undefined) {
                    const rawRowUnit = dObj.gridRowsUnit || '1fr';
                    const rowUnit = rawRowUnit === 'fr' ? '1fr' : rawRowUnit;
                    const gr = typeof dObj.gridRows === 'number' ? `repeat(${dObj.gridRows}, ${rowUnit})` : dObj.gridRows;
                    r.push(`grid-template-rows:${gr}`);
                }
                if (dObj.justifyItems) r.push(`justify-items:${dObj.justifyItems}`);
                if (dObj.gridAutoFlow) r.push(`grid-auto-flow:${dObj.gridAutoFlow}`);
            } else if (dObj.layoutMode === 'block') {
                r.push('display:block');
            } else if (dObj.layoutMode === 'flex' || dObj.flexDirection) {
                r.push('display:flex');
                if (dObj.flexDirection)  r.push(`flex-direction:${dObj.flexDirection}`);
                if (dObj.justifyContent) r.push(`justify-content:${dObj.justifyContent}`);
                if (dObj.flexWrap)       r.push(`flex-wrap:${dObj.flexWrap}`);
            }

            if (dObj.alignItems) r.push(`align-items:${dObj.alignItems}`);
            if (dObj.gapX !== undefined || dObj.gapY !== undefined) {
                const gY = dObj.gapY !== undefined ? dObj.gapY : (dObj.gap || 0);
                const gX = dObj.gapX !== undefined ? dObj.gapX : (dObj.gap || 0);
                r.push(`gap:${gY}${dObj.gapUnit || 'px'} ${gX}${dObj.gapUnit || 'px'}`);
            } else if (dObj.gap !== undefined) {
                r.push(`gap:${dObj.gap}${dObj.gapUnit || 'px'}`);
            }
            if (dObj.flexGrow !== undefined) r.push(`flex-grow:${dObj.flexGrow}`);
            if (dObj.alignSelf)            r.push(`align-self:${dObj.alignSelf}`);
            if (dObj.order !== undefined)   r.push(`order:${dObj.order}`);
            return r;
        };

        const buildHoverRuleList = (dObj) => {
            if (!dObj) return [];
            const r = [];
            if (dObj.hoverBgColor)       r.push(`background-color:${dObj.hoverBgColor}`);
            if (dObj.hoverTextColor)     r.push(`color:${dObj.hoverTextColor}`);
            
            // Hover Border
            if (dObj.hoverBorderStyle && dObj.hoverBorderStyle !== 'none') {
                const bw = dObj.hoverBorderWidth !== undefined ? dObj.hoverBorderWidth : 1;
                const bc = dObj.hoverBorderColor || '#d1d5db';
                r.push(`border:${bw}px ${dObj.hoverBorderStyle} ${bc}`);
            } else if (dObj.hoverBorderColor) {
                r.push(`border-color:${dObj.hoverBorderColor}`);
            }

            // Hover Border Radius
            if (dObj.hoverBorderRadius !== undefined) {
                r.push(`border-radius:${dObj.hoverBorderRadius}px`);
            }

            // Hover Box Shadow
            if (dObj.hoverShadowColor || dObj.hoverShadowH !== undefined || dObj.hoverShadowV !== undefined || dObj.hoverShadowBlur !== undefined) {
                const pos = dObj.hoverShadowPosition === 'inset' ? 'inset ' : '';
                const shColor = dObj.hoverShadowColor || 'rgba(0,0,0,0.15)';
                const shH = dObj.hoverShadowH !== undefined ? dObj.hoverShadowH : 0;
                const shV = dObj.hoverShadowV !== undefined ? dObj.hoverShadowV : 8;
                const shB = dObj.hoverShadowBlur !== undefined ? dObj.hoverShadowBlur : 24;
                const shS = dObj.hoverShadowSpread !== undefined ? dObj.hoverShadowSpread : 0;
                r.push(`box-shadow:${pos}${shH}px ${shV}px ${shB}px ${shS}px ${shColor}`);
            } else if (dObj.hoverShadow) {
                if (dObj.hoverShadow === 'none') r.push('box-shadow:none');
                if (dObj.hoverShadow === 'sm')   r.push('box-shadow:0 1px 3px rgba(0,0,0,0.1)');
                if (dObj.hoverShadow === 'md')   r.push('box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)');
                if (dObj.hoverShadow === 'lg')   r.push('box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)');
                if (dObj.hoverShadow === 'glow') r.push('box-shadow:0 0 15px rgba(200,122,87,0.5)');
            }

            // Hover Transform / Movement
            const transformParts = [];
            if (dObj.hoverTransformX !== undefined && dObj.hoverTransformX !== 0) {
                transformParts.push(`translateX(${dObj.hoverTransformX}px)`);
            }
            if (dObj.hoverTransformY !== undefined && dObj.hoverTransformY !== 0) {
                transformParts.push(`translateY(${dObj.hoverTransformY}px)`);
            }
            if (dObj.hoverScale !== undefined && dObj.hoverScale !== 1) {
                transformParts.push(`scale(${dObj.hoverScale})`);
            }
            if (transformParts.length > 0) {
                r.push(`transform:${transformParts.join(' ')}`);
            }
            return r;
        };

        // Utility to deduplicate property rules
        const deduplicateRules = (ruleList) => {
            const map = {};
            ruleList.forEach(ruleStr => {
                if (!ruleStr) return;
                const parts = ruleStr.split(';');
                parts.forEach(p => {
                    const trimmed = p.trim();
                    if (!trimmed) return;
                    const colonIdx = trimmed.indexOf(':');
                    if (colonIdx > 0) {
                        const propName = trimmed.slice(0, colonIdx).trim();
                        const propVal  = trimmed.slice(colonIdx + 1).trim();
                        map[propName] = propVal;
                    }
                });
            });
            return Object.entries(map).map(([k, v]) => `${k}:${v}`);
        };

        // 1. Desktop Base Rules (single unified block)
        const rules = [];
        if (item.visibleDesktop === false) rules.push('display:none !important');
        if (item.type === 'section' && item.containerWidth) {
            const mw = item.containerWidth === '100%' || String(item.containerWidth).endsWith('%') ? '100%' : `${item.containerWidth}px`;
            rules.push(`max-width:${mw}; margin-left:auto; margin-right:auto`);
        }
        rules.push(...buildDeviceRuleList(item));
        rules.push(`transition:all ${item.transitionDuration || 300}ms ease`);

        const dedupedBase = deduplicateRules(rules);
        if (dedupedBase.length > 0) {
            cssRules.push(`#${id} { ${dedupedBase.join('; ')}; }`);
        }

        // 2. Hover Rules (single unified block)
        const hoverList = buildHoverRuleList(item);
        const dedupedHover = deduplicateRules(hoverList);
        if (dedupedHover.length > 0) {
            cssRules.push(`#${id}:hover { ${dedupedHover.join('; ')}; }`);
        }

        // 3. Tablet Overrides (769px - 1024px)
        const tabList = buildDeviceRuleList(item.tablet);
        const dedupedTab = deduplicateRules(tabList);
        if (dedupedTab.length > 0) tabletRules.push(`#${id} { ${dedupedTab.join('; ')}; }`);

        // 4. Mobile Overrides (<= 768px)
        const mobileRulesList = [];
        if (item.visibleMobile === false) mobileRulesList.push('display:none !important');
        if (item.mobile && Object.keys(item.mobile).length > 0) {
            mobileRulesList.push(...buildDeviceRuleList(item.mobile));
        }
        const dedupedMobile = deduplicateRules(mobileRulesList);
        if (dedupedMobile.length > 0) mobileRules.push(`#${id} { ${dedupedMobile.join('; ')}; }`);

        if (item.type === 'image') {
            cssRules.push(`#${id} img { transition: transform 0.3s ease; }`);
            cssRules.push(`#${id} img:hover { transform: scale(1.02); }`);
        }

        // Recurse into children
        item.elements?.forEach(el => collectElementCss(el, cssRules, tabletRules, mobileRules));
        item.columns?.forEach(col => col?.forEach(child => collectElementCss(child, cssRules, tabletRules, mobileRules)));
    };

    const renderItemToHtmlScoped = (item) => {
        if (!item) return '';
        const id = `el-${item.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

        if (item.type === 'section') {
            const inner = item.elements?.map(el => renderItemToHtmlScoped(el)).join('') || '';
            return `<section id="${id}">${inner}</section>`;
        }

        if (item.type === 'flex_container') {
            const inner = item.elements?.map(el => renderItemToHtmlScoped(el)).join('') || '';
            return `<div id="${id}" class="funnel-flex-container">${inner}</div>`;
        }

        if (['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type)) {
            const colsCount = item.colsCount || 2;
            const colsHtml = [...Array(colsCount)].map((_, cIdx) => {
                const colContent = item.columns?.[cIdx]?.map(child => renderItemToHtmlScoped(child)).join('') || '';
                return `<div class="funnel-col">${colContent}</div>`;
            }).join('');
            return `<div id="${id}" class="funnel-row funnel-row-${item.type}">${colsHtml}</div>`;
        }

        if (['headline', 'subheadline'].includes(item.type)) {
            const Tag = item.headingTag || (item.type === 'headline' ? 'h1' : 'h2');
            return `<${Tag} id="${id}">${item.content || ''}</${Tag}>`;
        }
        if (item.type === 'paragraph')   return `<p id="${id}">${item.content || ''}</p>`;

        if (item.type === 'bullets') {
            const bulletsHtml = item.items?.map(b => `<li>${b}</li>`).join('') || '';
            return `<ul id="${id}" class="funnel-bullets">${bulletsHtml}</ul>`;
        }

        if (item.type === 'quote') {
            return `<blockquote id="${id}" class="funnel-quote"><p>"${item.quote || item.content || ''}"</p><cite>— ${item.author || 'Author'}</cite></blockquote>`;
        }

        if (item.type === 'image') {
            const maxW = item.maxWidth ? `${item.maxWidth}%` : '100%';
            return `<div id="${id}" class="funnel-image-wrap"><img src="${item.url || ''}" alt="${item.alt || ''}" style="max-width:${maxW};" /></div>`;
        }

        if (item.type === 'video') {
            return `<div id="${id}" class="funnel-video-wrap"><iframe src="${item.videoUrl || ''}" frameborder="0" allowfullscreen></iframe></div>`;
        }

        if (item.type === 'submit_button') {
            const iconMap = {
                arrow: '→', lock: '🔒', lightning: '⚡', cart: '🛒', download: '📥', star: '⭐', sparkles: '✨', check: '✓'
            };
            const iconChar = item.btnIcon && item.btnIcon !== 'none' ? (iconMap[item.btnIcon] || '') : '';
            const iconPos = item.btnIconPosition || 'right';
            const btnLabel = iconChar
                ? (iconPos === 'left' ? `${iconChar} ${item.text || 'Submit'}` : `${item.text || 'Submit'} ${iconChar}`)
                : (item.text || 'Submit →');

            const btnTypeAttr = item.btnType === 'url' ? `onclick="window.location.href='${item.targetUrl || '#'}'"` : 'type="button"';
            return `<div class="funnel-btn-wrap"><button id="${id}" ${btnTypeAttr}>${btnLabel}</button></div>`;
        }

        if (item.type === 'input_email') {
            return `<div class="funnel-input-wrap"><input type="email" id="${id}" placeholder="${item.placeholder || 'Enter your email...'}" /></div>`;
        }

        if (item.type === 'input_name') {
            return `<div class="funnel-input-wrap"><input type="text" id="${id}" placeholder="${item.placeholder || 'Enter your name...'}" /></div>`;
        }

        if (item.type === 'input_phone') {
            return `<div class="funnel-input-wrap"><input type="tel" id="${id}" placeholder="${item.placeholder || 'Enter phone...'}" /></div>`;
        }

        if (item.type === 'checkbox') {
            return `<div class="funnel-input-wrap"><label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="${id}" /> <span>${item.text || ''}</span></label></div>`;
        }

        if (item.type === 'divider')  return `<hr id="${id}" class="funnel-divider" />`;
        if (item.type === 'spacer')   return `<div id="${id}" class="funnel-spacer"></div>`;
        if (item.type === 'timer')    return `<div id="${id}" class="funnel-timer">02 : 15 : 00</div>`;

        return '';
    };

    const renderSectionsHtml = (secList, styleObj, seoObj, codeObj) => {
        const cssRules    = [];
        const tabletRules = [];
        const mobileRules = [];

        const defaultFont  = styleObj?.defaultFont || "'Inter', sans-serif";
        const headingFont  = styleObj?.headingFontName || "'Lora', serif";
        const headingColor = styleObj?.headingColor || "#111827";
        const bodyAlign    = styleObj?.bodyAlignment || "left";
        const bgColor      = styleObj?.bgColor || '#ffffff';
        const textColor    = styleObj?.textColor || '#1f2937';
        const linkColor    = styleObj?.linkColor || '#c87a57';
        const fontSize     = styleObj?.fontSize || 17;
        const lineHeight   = styleObj?.lineHeight || 25;

        // Global Design Tokens & Base Styles
        const buildBrandVars = (sg = {}) => {
            const sys = sg.systemColors || {};
            const custom = (sg.customColors || []).map(c => `--color-${c.id}: ${c.value || '#3B82F6'};`).join('\n');
            const headings = ['h1','h2','h3','h4','h5','h6'].map(h => {
                const typo = sg[`${h}Typography`] || {};
                const col = sg[`${h}Color`] || sg.headingColor || '#111827';
                const defaultMb = h === 'h1' || h === 'h2' || h === 'h3' ? 12 : (h === 'h4' ? 10 : 8);
                const mUnit = sg[`${h}MarginUnit`] || sg.headingMarginBottomUnit || 'px';
                const pUnit = sg[`${h}PaddingUnit`] || 'px';
                return `--brand-${h}-font-family: ${typo.family || sg.headingFontName || sg.defaultFont || "'Inter', sans-serif"};
                --brand-${h}-font-size: ${typo.size || (h === 'h1' ? 32 : h === 'h2' ? 24 : h === 'h3' ? 20 : 18)}px;
                --brand-${h}-font-weight: ${typo.weight || '700'};
                --brand-${h}-line-height: ${typo.lineHeight || 36}px;
                --brand-${h}-color: ${col};
                --brand-${h}-text-transform: ${typo.transform === 'Default' ? 'none' : (typo.transform || 'none')};
                --brand-${h}-font-style: ${typo.style === 'Default' ? 'normal' : (typo.style || 'normal')};
                --brand-${h}-text-decoration: ${typo.decoration === 'Default' ? 'none' : (typo.decoration || 'none')};
                --brand-${h}-margin-top: ${sg[`${h}MarginTop`] ?? 0}${mUnit};
                --brand-${h}-margin-right: ${sg[`${h}MarginRight`] ?? 0}${mUnit};
                --brand-${h}-margin-bottom: ${sg[`${h}MarginBottom`] ?? sg.headingMarginBottom ?? defaultMb}${mUnit};
                --brand-${h}-margin-left: ${sg[`${h}MarginLeft`] ?? 0}${mUnit};
                --brand-${h}-padding-top: ${sg[`${h}PaddingTop`] ?? 0}${pUnit};
                --brand-${h}-padding-right: ${sg[`${h}PaddingRight`] ?? 0}${pUnit};
                --brand-${h}-padding-bottom: ${sg[`${h}PaddingBottom`] ?? 0}${pUnit};
                --brand-${h}-padding-left: ${sg[`${h}PaddingLeft`] ?? 0}${pUnit};`;
            }).join('\n');

            const bodyTypo = sg.bodyTypography || {};
            const btnTypo = sg.btnTypography || {};
            const fieldTypo = sg.fieldTypography || {};
            const fieldBorder = sg.fieldBorder || {};

            return `
                --color-primary: ${sys.primary || '#6EC1E4'};
                --color-secondary: ${sys.secondary || '#54595F'};
                --color-text: ${sys.text || '#7A7A7A'};
                --color-accent: ${sys.accent || '#61CE70'};
                ${custom}
                ${headings}
                --brand-body-font-family: ${bodyTypo.family || sg.defaultFont || "'Inter', sans-serif"};
                --brand-body-font-size: ${bodyTypo.size || sg.fontSize || 16}px;
                --brand-body-font-weight: ${bodyTypo.weight || '400'};
                --brand-body-line-height: ${bodyTypo.lineHeight || sg.lineHeight || 24}px;
                --brand-body-color: ${sg.textColor || '#1f2937'};
                --brand-body-margin-top: ${sg.bodyMarginTop ?? 0}${sg.bodyMarginUnit || 'px'};
                --brand-body-margin-right: ${sg.bodyMarginRight ?? 0}${sg.bodyMarginUnit || 'px'};
                --brand-body-margin-bottom: ${sg.bodyMarginBottom ?? sg.paragraphMarginBottom ?? 16}${sg.bodyMarginUnit || sg.paragraphMarginBottomUnit || 'px'};
                --brand-body-margin-left: ${sg.bodyMarginLeft ?? 0}${sg.bodyMarginUnit || 'px'};
                --brand-body-padding-top: ${sg.bodyPaddingTop ?? 0}${sg.bodyPaddingUnit || 'px'};
                --brand-body-padding-right: ${sg.bodyPaddingRight ?? 0}${sg.bodyPaddingUnit || 'px'};
                --brand-body-padding-bottom: ${sg.bodyPaddingBottom ?? 0}${sg.bodyPaddingUnit || 'px'};
                --brand-body-padding-left: ${sg.bodyPaddingLeft ?? 0}${sg.bodyPaddingUnit || 'px'};

                --brand-btn-font-family: ${btnTypo.family || sg.defaultFont || "'Inter', sans-serif"};
                --brand-btn-font-size: ${btnTypo.size || 16}px;
                --brand-btn-font-weight: ${btnTypo.weight || '700'};
                --brand-btn-bg-color: ${sg.btnBgColor || sg.linkColor || '#c87a57'};
                --brand-btn-text-color: ${sg.btnTextColor || '#ffffff'};
                --brand-btn-border-radius: ${sg.btnRadiusTop ?? 12}px;
                --brand-btn-hover-bg-color: ${sg.btnHoverBgColor || '#b36443'};
                --brand-btn-hover-text-color: ${sg.btnHoverTextColor || '#ffffff'};
                --brand-btn-margin-top: ${sg.btnMarginTop ?? 0}${sg.btnMarginUnit || 'px'};
                --brand-btn-margin-right: ${sg.btnMarginRight ?? 0}${sg.btnMarginUnit || 'px'};
                --brand-btn-margin-bottom: ${sg.btnMarginBottom ?? sg.buttonMarginBottom ?? 16}${sg.btnMarginUnit || sg.buttonMarginBottomUnit || 'px'};
                --brand-btn-margin-left: ${sg.btnMarginLeft ?? 0}${sg.btnMarginUnit || 'px'};
                --brand-btn-padding-top: ${sg.btnPaddingTop ?? 14}${sg.btnPaddingUnit || 'px'};
                --brand-btn-padding-right: ${sg.btnPaddingRight ?? 28}${sg.btnPaddingUnit || 'px'};
                --brand-btn-padding-bottom: ${sg.btnPaddingBottom ?? 14}${sg.btnPaddingUnit || 'px'};
                --brand-btn-padding-left: ${sg.btnPaddingLeft ?? 28}${sg.btnPaddingUnit || 'px'};

                --brand-field-font-family: ${fieldTypo.family || sg.defaultFont || "'Inter', sans-serif"};
                --brand-field-font-size: ${fieldTypo.size || 14}px;
                --brand-field-bg-color: ${sg.fieldBgColor || '#ffffff'};
                --brand-field-text-color: ${sg.fieldTextColor || '#111827'};
                --brand-field-border-color: ${fieldBorder.color || '#d1d5db'};
                --brand-field-border-radius: ${sg.fieldRadiusTop ?? 8}px;
                --brand-field-margin-top: ${sg.fieldMarginTop ?? 0}${sg.fieldMarginUnit || 'px'};
                --brand-field-margin-right: ${sg.fieldMarginRight ?? 0}${sg.fieldMarginUnit || 'px'};
                --brand-field-margin-bottom: ${sg.fieldMarginBottom ?? sg.fieldMarginBottom ?? 12}${sg.fieldMarginUnit || 'px'};
                --brand-field-margin-left: ${sg.fieldMarginLeft ?? 0}${sg.fieldMarginUnit || 'px'};
                --brand-field-padding-top: ${sg.fieldPaddingTop ?? 12}${sg.fieldPaddingUnit || 'px'};
                --brand-field-padding-right: ${sg.fieldPaddingRight ?? 16}${sg.fieldPaddingUnit || 'px'};
                --brand-field-padding-bottom: ${sg.fieldPaddingBottom ?? 12}${sg.fieldPaddingUnit || 'px'};
                --brand-field-padding-left: ${sg.fieldPaddingLeft ?? 16}${sg.fieldPaddingUnit || 'px'};

                --brand-container-width: ${sg.containerWidth === '100%' || String(sg.containerWidth).endsWith('%') ? '100%' : `${sg.containerWidth ?? 1200}${sg.containerWidthUnit || 'px'}`};
                --brand-container-margin-top: ${sg.containerMarginTop ?? 0}${sg.containerMarginUnit || 'px'};
                --brand-container-margin-right: ${sg.containerMarginRight ?? 'auto'};
                --brand-container-margin-bottom: ${sg.containerMarginBottom ?? sg.sectionMarginBottom ?? 24}${sg.containerMarginUnit || sg.sectionMarginBottomUnit || 'px'};
                --brand-container-margin-left: ${sg.containerMarginLeft ?? 'auto'};
                --brand-container-padding-top: ${sg.containerPaddingTop ?? 48}${sg.containerPaddingUnit || 'px'};
                --brand-container-padding-right: ${sg.containerPaddingRight ?? 24}${sg.containerPaddingUnit || 'px'};
                --brand-container-padding-bottom: ${sg.containerPaddingBottom ?? 48}${sg.containerPaddingUnit || 'px'};
                --brand-container-padding-left: ${sg.containerPaddingLeft ?? 24}${sg.containerPaddingUnit || 'px'};
                --brand-element-gap-x: ${sg.elementGapX ?? sg.elementGap ?? 24}${sg.elementGapXUnit || 'px'};
                --brand-element-gap-y: ${sg.elementGapY ?? sg.elementGap ?? 24}${sg.elementGapYUnit || 'px'};
            `;
        };

        cssRules.push(`:root { ${buildBrandVars(styleObj)} }`);
        cssRules.push(`*, *::before, *::after { box-sizing: border-box; }`);
        cssRules.push(`body { margin:0; padding:0; font-family:var(--brand-body-font-family); background-color:${bgColor}; color:var(--brand-body-color); font-size:var(--brand-body-font-size); line-height:var(--brand-body-line-height); min-height:100vh; }`);
        cssRules.push(`h1 { margin:var(--brand-h1-margin-top) var(--brand-h1-margin-right) var(--brand-h1-margin-bottom) var(--brand-h1-margin-left); padding:var(--brand-h1-padding-top) var(--brand-h1-padding-right) var(--brand-h1-padding-bottom) var(--brand-h1-padding-left); font-family:var(--brand-h1-font-family); font-size:var(--brand-h1-font-size); font-weight:var(--brand-h1-font-weight); line-height:var(--brand-h1-line-height); color:var(--brand-h1-color); text-transform:var(--brand-h1-text-transform); font-style:var(--brand-h1-font-style); text-decoration:var(--brand-h1-text-decoration); }`);
        cssRules.push(`h2 { margin:var(--brand-h2-margin-top) var(--brand-h2-margin-right) var(--brand-h2-margin-bottom) var(--brand-h2-margin-left); padding:var(--brand-h2-padding-top) var(--brand-h2-padding-right) var(--brand-h2-padding-bottom) var(--brand-h2-padding-left); font-family:var(--brand-h2-font-family); font-size:var(--brand-h2-font-size); font-weight:var(--brand-h2-font-weight); line-height:var(--brand-h2-line-height); color:var(--brand-h2-color); text-transform:var(--brand-h2-text-transform); font-style:var(--brand-h2-font-style); text-decoration:var(--brand-h2-text-decoration); }`);
        cssRules.push(`h3 { margin:var(--brand-h3-margin-top) var(--brand-h3-margin-right) var(--brand-h3-margin-bottom) var(--brand-h3-margin-left); padding:var(--brand-h3-padding-top) var(--brand-h3-padding-right) var(--brand-h3-padding-bottom) var(--brand-h3-padding-left); font-family:var(--brand-h3-font-family); font-size:var(--brand-h3-font-size); font-weight:var(--brand-h3-font-weight); line-height:var(--brand-h3-line-height); color:var(--brand-h3-color); text-transform:var(--brand-h3-text-transform); font-style:var(--brand-h3-font-style); text-decoration:var(--brand-h3-text-decoration); }`);
        cssRules.push(`h4 { margin:var(--brand-h4-margin-top) var(--brand-h4-margin-right) var(--brand-h4-margin-bottom) var(--brand-h4-margin-left); padding:var(--brand-h4-padding-top) var(--brand-h4-padding-right) var(--brand-h4-padding-bottom) var(--brand-h4-padding-left); font-family:var(--brand-h4-font-family); font-size:var(--brand-h4-font-size); font-weight:var(--brand-h4-font-weight); line-height:var(--brand-h4-line-height); color:var(--brand-h4-color); text-transform:var(--brand-h4-text-transform); font-style:var(--brand-h4-font-style); text-decoration:var(--brand-h4-text-decoration); }`);
        cssRules.push(`h5 { margin:var(--brand-h5-margin-top) var(--brand-h5-margin-right) var(--brand-h5-margin-bottom) var(--brand-h5-margin-left); padding:var(--brand-h5-padding-top) var(--brand-h5-padding-right) var(--brand-h5-padding-bottom) var(--brand-h5-padding-left); font-family:var(--brand-h5-font-family); font-size:var(--brand-h5-font-size); font-weight:var(--brand-h5-font-weight); line-height:var(--brand-h5-line-height); color:var(--brand-h5-color); text-transform:var(--brand-h5-text-transform); font-style:var(--brand-h5-font-style); text-decoration:var(--brand-h5-text-decoration); }`);
        cssRules.push(`h6 { margin:var(--brand-h6-margin-top) var(--brand-h6-margin-right) var(--brand-h6-margin-bottom) var(--brand-h6-margin-left); padding:var(--brand-h6-padding-top) var(--brand-h6-padding-right) var(--brand-h6-padding-bottom) var(--brand-h6-padding-left); font-family:var(--brand-h6-font-family); font-size:var(--brand-h6-font-size); font-weight:var(--brand-h6-font-weight); line-height:var(--brand-h6-line-height); color:var(--brand-h6-color); text-transform:var(--brand-h6-text-transform); font-style:var(--brand-h6-font-style); text-decoration:var(--brand-h6-text-decoration); }`);
        cssRules.push(`p { margin:var(--brand-body-margin-top) var(--brand-body-margin-right) var(--brand-body-margin-bottom) var(--brand-body-margin-left); padding:var(--brand-body-padding-top) var(--brand-body-padding-right) var(--brand-body-padding-bottom) var(--brand-body-padding-left); font-family:var(--brand-body-font-family); font-size:var(--brand-body-font-size); font-weight:var(--brand-body-font-weight); line-height:var(--brand-body-line-height); color:var(--brand-body-color); }`);
        cssRules.push(`.funnel-container { width:100%; margin:0 auto; padding:0; }`);
        cssRules.push(`section { width:100%; max-width:var(--brand-container-width); padding-top:var(--brand-container-padding-top); padding-right:var(--brand-container-padding-right); padding-bottom:var(--brand-container-padding-bottom); padding-left:var(--brand-container-padding-left); margin-top:var(--brand-container-margin-top); margin-right:auto; margin-bottom:var(--brand-container-margin-bottom); margin-left:auto; }`);
        cssRules.push(`.funnel-row { display:grid; row-gap:var(--brand-element-gap-y); column-gap:var(--brand-element-gap-x); width:100%; }`);
        cssRules.push(`.funnel-flex-container { display:flex; gap:var(--brand-element-gap-y) var(--brand-element-gap-x); }`);
        cssRules.push(`.funnel-row-grid_container { grid-template-columns:repeat(2, minmax(0, 1fr)); }`);
        cssRules.push(`.funnel-row-col_1 { grid-template-columns:1fr; }`);
        cssRules.push(`.funnel-row-col_2 { grid-template-columns:repeat(2, minmax(0, 1fr)); }`);
        cssRules.push(`.funnel-row-col_3 { grid-template-columns:repeat(3, minmax(0, 1fr)); }`);
        cssRules.push(`.funnel-row-col_4 { grid-template-columns:repeat(4, minmax(0, 1fr)); }`);
        cssRules.push(`.funnel-row-col_sidebar { grid-template-columns:minmax(0, 7fr) minmax(0, 3fr); }`);
        cssRules.push(`.funnel-col { width:100%; min-width:0; padding:var(--brand-col-padding-top, 0) var(--brand-col-padding-right, 0) var(--brand-col-padding-bottom, 0) var(--brand-col-padding-left, 0); margin:var(--brand-col-margin-top, 0) var(--brand-col-margin-right, 0) var(--brand-col-margin-bottom, 0) var(--brand-col-margin-left, 0); }`);
        cssRules.push(`.funnel-bullets { list-style:none; padding:0; margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }`);
        cssRules.push(`.funnel-bullets li { margin-bottom:var(--brand-bullet-gap, 8px); display:flex; align-items:center; gap:var(--brand-bullet-gap, 8px); font-weight:var(--brand-body-font-weight, 500); color:var(--brand-body-color); }`);
        cssRules.push(`.funnel-bullets li::before { content:"✓"; color:var(--brand-bullet-icon-color, var(--color-primary, #16a34a)); font-weight:700; }`);
        cssRules.push(`.funnel-quote { padding:var(--brand-quote-padding-top, 16px) var(--brand-quote-padding-right, 20px) var(--brand-quote-padding-bottom, 16px) var(--brand-quote-padding-left, 20px); border-left:var(--brand-quote-border-width, 4px) solid var(--brand-quote-border-color, var(--color-primary, #6EC1E4)); background:var(--brand-quote-bg-color, rgba(99,102,241,0.06)); margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); border-radius:var(--brand-quote-border-radius, 0 8px 8px 0); }`);
        cssRules.push(`.funnel-quote p { font-style:var(--brand-quote-font-style, italic); font-weight:var(--brand-quote-font-weight, 400); margin:0 0 8px 0; color:var(--brand-quote-text-color, var(--brand-body-color)); }`);
        cssRules.push(`.funnel-quote cite { font-weight:var(--brand-quote-cite-weight, 700); font-style:var(--brand-quote-cite-style, normal); color:var(--brand-quote-border-color, var(--color-primary, #6EC1E4)); }`);
        cssRules.push(`.funnel-image-wrap { margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }`);
        cssRules.push(`.funnel-image-wrap img { display:block; width:100%; height:auto; border-radius:var(--brand-img-border-radius, 8px); box-shadow:var(--brand-img-shadow, 0 4px 12px rgba(0,0,0,0.1)); transition:transform 0.3s ease; }`);
        cssRules.push(`.funnel-image-wrap img:hover { transform:scale(1.02); }`);
        cssRules.push(`.funnel-video-wrap { position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:var(--brand-video-border-radius, 12px); box-shadow:var(--brand-video-shadow, 0 10px 25px rgba(0,0,0,0.2)); margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }`);
        cssRules.push(`.funnel-video-wrap iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:0; }`);
        cssRules.push(`.funnel-btn-wrap { margin:0 0 16px 0; }`);
        cssRules.push(`.funnel-btn-wrap button { width:100%; margin:var(--brand-btn-margin-top, 0) var(--brand-btn-margin-right, 0) var(--brand-btn-margin-bottom, 16px) var(--brand-btn-margin-left, 0); padding:var(--brand-btn-padding-top, 14px) var(--brand-btn-padding-right, 28px) var(--brand-btn-padding-bottom, 14px) var(--brand-btn-padding-left, 28px); font-family:var(--brand-btn-font-family); font-size:var(--brand-btn-font-size); font-weight:var(--brand-btn-font-weight); cursor:pointer; border:none; border-radius:var(--brand-btn-border-radius); background:var(--brand-btn-bg-color); color:var(--brand-btn-text-color); transition:all 0.2s ease; }`);
        cssRules.push(`.funnel-btn-wrap button:hover { background:var(--brand-btn-hover-bg-color); color:var(--brand-btn-hover-text-color); filter:brightness(1.05); transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.15); }`);
        cssRules.push(`.funnel-input-wrap { margin:0 0 12px 0; }`);
        cssRules.push(`.funnel-input-wrap input { width:100%; margin:var(--brand-field-margin-top, 0) var(--brand-field-margin-right, 0) var(--brand-field-margin-bottom, 12px) var(--brand-field-margin-left, 0); padding:var(--brand-field-padding-top, 12px) var(--brand-field-padding-right, 16px) var(--brand-field-padding-bottom, 12px) var(--brand-field-padding-left, 16px); font-family:var(--brand-field-font-family); font-size:var(--brand-field-font-size); background:var(--brand-field-bg-color); color:var(--brand-field-text-color); border:1px solid var(--brand-field-border-color); border-radius:var(--brand-field-border-radius); outline:none; transition:border-color 0.2s; }`);
        cssRules.push(`.funnel-input-wrap input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px var(--color-primary)22; }`);
        cssRules.push(`.funnel-divider { border:none; border-top:var(--brand-divider-width, 1px) var(--brand-divider-style, solid) var(--brand-divider-color, #e5e7eb); margin:var(--brand-divider-margin-top, 24px) 0 var(--brand-divider-margin-bottom, 24px) 0; }`);
        cssRules.push(`.funnel-spacer { height:var(--brand-spacer-height, 40px); }`);
        cssRules.push(`.funnel-timer { padding:var(--brand-timer-padding, 16px); background:var(--brand-timer-bg-color, #fef2f2); border:1px solid var(--brand-timer-border-color, #fca5a5); border-radius:var(--brand-timer-border-radius, 12px); text-align:center; font-weight:var(--brand-timer-font-weight, 700); color:var(--brand-timer-text-color, #dc2626); font-family:monospace; font-size:var(--brand-timer-font-size, 24px); margin:0 0 16px 0; letter-spacing:2px; }`);
        cssRules.push(`img { max-width:100%; height:auto; }`);

        // Mobile base
        mobileRules.push(`.funnel-row { grid-template-columns:1fr !important; }`);

        // Collect per-element overrides
        secList.forEach(sec => collectElementCss(sec, cssRules, tabletRules, mobileRules));

        // Build HTML body
        const bodyHtml = secList.map(sec => renderItemToHtmlScoped(sec)).join('\n');

        const tabBp = styleObj?.tabletBreakpoint || 1024;
        const mobBp = styleObj?.mobileBreakpoint || 768;
        const mobMin = mobBp + 1;

        const allCss = cssRules.join('\n')
            + (tabletRules.length > 0 ? `\n@media (max-width: ${tabBp}px) and (min-width: ${mobMin}px) {\n${tabletRules.join('\n')}\n}` : '')
            + (mobileRules.length > 0 ? `\n@media (max-width: ${mobBp}px) {\n${mobileRules.join('\n')}\n}` : '');

        const titleText = seoObj?.metaTitle || funnel.name || 'Live Funnel Page';
        const metaDesc = seoObj?.metaDescription ? `<meta name="description" content="${seoObj.metaDescription}">` : '';
        const ogImage = seoObj?.ogImage ? `<meta property="og:image" content="${seoObj.ogImage}">` : '';
        const headerCode = codeObj?.headerCode || '';
        const footerCode = codeObj?.footerCode || '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titleText}</title>
${metaDesc}
${ogImage}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700&family=Montserrat:wght@400;600;700&family=Outfit:wght@400;600;800&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
${allCss}
</style>
${headerCode}
</head>
<body>
<main class="funnel-container">
${bodyHtml}
</main>
${footerCode}
</body>
</html>`;
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
            {saveBlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4">
                        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2"><Bookmark className="h-5 w-5 text-brand-600" /> Save to My Blocks</h2>
                        <input type="text" value={savedBlockName} onChange={e => setSavedBlockName(e.target.value)} placeholder="Block Name..." className="w-full rounded-lg border p-2 text-sm" />
                        <div className="flex gap-2">
                            <button type="button" onClick={handleSaveSectionToMyBlocks} className="flex-1 rounded-lg bg-brand-600 py-2 text-sm text-white font-medium">Save</button>
                            <button type="button" onClick={() => setSaveBlockModal(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
                    <CheckCircle className="h-4 w-4" /> {toast.msg}
                </div>
            )}
        </ClientLayout>
    );
}
