import useHistoryState from '@/hooks/useHistoryState';
import ClientLayout from '@/Layouts/ClientLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Box,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ClipboardPaste,
  Clock,
  Code,
  Columns,
  Copy,
  Eye,
  EyeOff,
  FileText,
  FolderTree,
  Globe,
  GripVertical,
  Italic,
  Layers,
  LayoutTemplate,
  ListFilter,
  Monitor,
  Music,
  Paintbrush,
  Palette,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  Sliders,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Trash2,
  Undo2,
} from 'lucide-react';
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/Components/ui';

import {
  ADMIN_BLOCK_TEMPLATES, STATUS_COLORS, checkStepReadiness
} from '@/Components/VisualEditor/constants';

import {
  deepAssignNewIds,
  deleteNestedElement,
  getAncestorTrail,
  insertExistingNestedItem,
  insertNestedItem,
  moveNestedElement,
  sanitizeElementForBrandInheritance,
  updateNestedElement,
  wrapInStandardHierarchy
} from '@/Components/VisualEditor/utils/treeUtils';

import { buildBrandVars, collectElementCss } from '@/Components/VisualEditor/utils/cssCompiler';
import { renderSectionsHtml } from '@/Components/VisualEditor/utils/htmlCompiler';

import PopupsManagerModal from '@/Components/VisualEditor/modals/PopupsManagerModal';
import SaveBlockModal from '@/Components/VisualEditor/modals/SaveBlockModal';
import ShareFunnelModal from '@/Components/VisualEditor/modals/ShareFunnelModal';
import TemplateGalleryModal from '@/Components/VisualEditor/modals/TemplateGalleryModal';
import FunnelAdapter from '@/Components/VisualEditor/adapters/FunnelAdapter';

import { useConfirm } from '@/context/ConfirmationContext';
import BlocksTab from '@/Components/VisualEditor/BlocksTab';
import BrandTab from '@/Components/VisualEditor/BrandTab';
import LayersTab from '@/Components/VisualEditor/LayersTab';
import SeoTab from '@/Components/VisualEditor/SeoTab';
import SettingsTab from '@/Components/VisualEditor/SettingsTab';
import StepsTab from '@/Components/VisualEditor/StepsTab';

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
    const { confirm } = useConfirm();
    const { props } = usePage();

    const [funnel, setFunnel] = useState(initialFunnel);
    const [activeStepId, setActiveStepId] = useState(funnel.steps?.[0]?.id ?? null);
    const [activeVariant, setActiveVariant] = useState('A');
    const [viewport, setViewport] = useState('desktop');
    const [sidebarTab, setSidebarTab] = useState('blocks');
    const [blockSubTab, setBlockSubTab] = useState('elements');
    const [mySavedBlocks, setMySavedBlocks] = useState([]);
    const [loadingSavedBlocks, setLoadingSavedBlocks] = useState(false);
    const [saveBlockModal, setSaveBlockModal] = useState(null);
    const [savedBlockName, setSavedBlockName] = useState('');
    const [copiedId, setCopiedId] = useState(false);

    // Drag & Drop Real-Time State (useRef prevents React re-renders from cancelling native dragstart)
    const draggingElementRef = useRef(null);
    const [dragOverTargetId, setDragOverTargetId] = useState(null);
    const [dragOverPosition, setDragOverPosition] = useState('after'); // 'before' | 'after' | 'inside'

    // Sections & Brand Style Guide State with Undo/Redo history
    const [sections, setSections, { undo, redo, canUndo, canRedo }] = useHistoryState([]);
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [hoveredElementId, setHoveredElementId] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showLayersRight, setShowLayersRight] = useState(true);
    const [showGuides, setShowGuides] = useState(true);
    const [hoveredColKey, setHoveredColKey] = useState(null);
    const [stepDropdownOpen, setStepDropdownOpen] = useState(false);

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

    const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen]         = useState(false);
    const [popupsModalOpen, setPopupsModalOpen]       = useState(false);
    const [copiedStyle, setCopiedStyle]               = useState(null);
    const [editingTarget, setEditingTarget]           = useState(null); // { id: string, field: string, index?: number }
    const [resizingCol, setResizingCol]               = useState(null); // { containerId: string, colIdx: number, previewWidths: number[] }

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
    const activePage = activeStep?.pages?.find(p => p.variant === activeVariant) ?? activeStep?.pages?.find(p => p.is_control) ?? activeStep?.pages?.[0];

    const stepHealth = useMemo(() => {
        if (!activeStep?.type) return { isReady: true };
        return checkStepReadiness(activeStep.type, sections);
    }, [activeStep?.type, sections]);

    const selectedElement = useMemo(() => {
        if (!selectedSectionId) return null;
        if (typeof selectedSectionId === 'string' && selectedSectionId.includes('_col_')) {
            const [containerId, colStr] = selectedSectionId.split('_col_');
            const cIdx = parseInt(colStr, 10);
            const container = findNestedElement(sections, containerId);
            if (!container) return null;
            const currentStyles = Array.isArray(container.columnStyles) ? container.columnStyles : [];
            const colStyle = currentStyles[cIdx] || {};
            return {
                id: selectedSectionId,
                parentId: container.id,
                containerId: container.id,
                colIdx: cIdx,
                type: 'grid_column',
                name: `Column #${cIdx + 1}`,
                title: `Column #${cIdx + 1} (${container.name || container.title || 'Grid'})`,
                ...colStyle,
            };
        }
        return findNestedElement(sections, selectedSectionId);
    }, [sections, selectedSectionId]);

    const ancestorTrail = useMemo(() => {
        if (!selectedSectionId) return [];
        return getAncestorTrail(sections, selectedSectionId);
    }, [sections, selectedSectionId]);

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
        setHasUnsavedChanges(false);
    }, [activeStepId, activeVariant, activePage?.id]);

    useEffect(() => {
        if (blockSubTab === 'my_blocks') {
            setLoadingSavedBlocks(true);
            axios.get(route('client.funnels.sections.index'))
                .then(res => setMySavedBlocks(res.data.sections || []))
                .catch(() => setMySavedBlocks([]))
                .finally(() => setLoadingSavedBlocks(false));
        }
    }, [blockSubTab]);

    // ── Global Keyboard Shortcuts ─────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;

            // Cmd/Ctrl + S: Publish Funnel
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handlePublish();
                return;
            }

            if (!selectedSectionId || isInput) return;

            // Cmd/Ctrl + D: Duplicate selected element
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                handleDuplicateSelectedElement(selectedSectionId);
                return;
            }

            // Delete / Backspace: Delete selected element
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                handleDeleteSelectedElement(selectedSectionId);
                return;
            }

            // Enter: Enter in-line edit mode for text elements
            if (e.key === 'Enter' && !editingTarget) {
                const el = findNestedElement(sections, selectedSectionId);
                if (el && ['headline', 'subheadline', 'paragraph', 'quote', 'submit_button'].includes(el.type)) {
                    e.preventDefault();
                    setEditingTarget({
                        id: el.id,
                        field: el.type === 'submit_button' ? 'text' : el.type === 'quote' ? 'content' : 'content',
                    });
                    return;
                }
            }

            // Escape: Exit edit mode or Deselect
            if (e.key === 'Escape') {
                if (editingTarget) {
                    setEditingTarget(null);
                    return;
                }
                setSelectedSectionId(null);
                setSidebarTab('blocks');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedSectionId, editingTarget]);

    // ── Update Element Settings with Device Override Support ─────────────────────────────
    const handleUpdateElementSetting = (targetId, keyOrObj, value) => {
        const updates = (typeof keyOrObj === 'object' && keyOrObj !== null) ? keyOrObj : { [keyOrObj]: value };

        // Column style updates (e.g. "el_123_col_0")
        if (targetId && typeof targetId === 'string' && targetId.includes('_col_')) {
            const [containerId, colStr] = targetId.split('_col_');
            const cIdx = parseInt(colStr, 10);
            const updated = updateNestedElement(sections, containerId, container => {
                const columnStyles = Array.isArray(container.columnStyles) ? [...container.columnStyles] : [];
                while (columnStyles.length <= cIdx) columnStyles.push({});
                columnStyles[cIdx] = { ...(columnStyles[cIdx] || {}), ...updates };
                return {
                    ...container,
                    columnStyles,
                    isLocallyOverridden: true,
                };
            });
            setSections(updated);
            setHasUnsavedChanges(true);
            return;
        }

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
        setHasUnsavedChanges(true);
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
            } else if (category === 'flex_child') {
                keysToClean = ['widthMode', 'customWidth', 'alignSelf', 'pushToBottom', 'flexGrow', 'flexShrink', 'flexBasis', 'order', 'btnWidthMode', 'btnCustomWidth', 'btnAlign'];
            } else if (category === 'flex_container') {
                keysToClean = ['display', 'flexDirection', 'justifyContent', 'alignItems', 'flexWrap', 'gap', 'rowGap', 'columnGap'];
            }

            if (viewport !== 'desktop') {
                const deviceObj = { ...(item[viewport] || {}) };
                keysToClean.forEach(k => delete deviceObj[k]);
                return {
                    ...item,
                    [viewport]: deviceObj,
                };
            }

            const newItem = { ...item };
            keysToClean.forEach(k => delete newItem[k]);
            delete newItem.isLocallyOverridden;
            return newItem;
        });

        setSections(updated);
        setHasUnsavedChanges(true);
        showToast(`Reset ${category.replace('_', ' ')} for ${viewport} to defaults`, 'info');
    };

    const handleDeleteSelectedElement = (targetId) => {
        if (targetId && typeof targetId === 'string' && targetId.includes('_col_')) {
            const [containerId, colStr] = targetId.split('_col_');
            const cIdx = parseInt(colStr, 10);
            const updated = updateNestedElement(sections, containerId, container => {
                const columnStyles = Array.isArray(container.columnStyles) ? [...container.columnStyles] : [];
                if (columnStyles[cIdx]) {
                    columnStyles[cIdx] = {};
                }
                return { ...container, columnStyles };
            });
            setSections(updated);
            setHasUnsavedChanges(true);
            showToast('Column styles reset', 'info');
            return;
        }

        const updated = deleteNestedElement(sections, targetId);
        setSections(updated);
        setSelectedSectionId(null);
        setSidebarTab('blocks');
        setHasUnsavedChanges(true);
        showToast('Element deleted', 'info');
    };

    const handleDuplicateSelectedElement = (targetId) => {
        const existingObj = findNestedElement(sections, targetId);
        if (!existingObj) return;
        const cloned = deepAssignNewIds(JSON.parse(JSON.stringify(existingObj)));
        cloned.name = `${existingObj.name || existingObj.type} (Copy)`;
        const updated = insertNestedItem(sections, targetId, null, cloned);
        setSections(updated);
        setSelectedSectionId(cloned.id);
        setHasUnsavedChanges(true);
        showToast(`Duplicated ${existingObj.name || existingObj.type}`, 'success');
    };

    const handleCopyStyle = (targetId) => {
        const el = findNestedElement(sections, targetId);
        if (!el) return;
        const styleKeys = [
            'fontSize', 'lineHeight', 'fontFamily', 'fontWeight', 'letterSpacing', 'textTransform', 'fontStyle', 'textDecoration', 'wordSpacing',
            'textColor', 'bgColor', 'textBgColor', 'hoverTextColor', 'hoverBgColor', 'bgType', 'gradientType', 'gradientAngle', 'gradientStops', 'bgImage', 'bgOverlay', 'bgSize', 'bgPosition', 'bgRepeat',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'padding', 'paddingY', 'paddingX',
            'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'margin', 'marginY', 'marginX',
            'alignment', 'borderStyle', 'borderWidth', 'borderColor', 'borderRadiusTL', 'borderRadiusTR', 'borderRadiusBL', 'borderRadiusBR', 'borderRadius',
            'shadow', 'shadowColor', 'shadowH', 'shadowV', 'shadowBlur', 'shadowSpread', 'shadowPosition',
            'opacity', 'transformRotate', 'transformScale',
            'buttonStyle', 'btnBgColor', 'btnTextColor', 'btnBorderColor', 'btnBorderWidth', 'btnCornerRadius', 'btnShadow',
            'positionType', 'stickyOffset', 'zIndex',
        ];
        const extracted = {};
        const sourceObj = viewport !== 'desktop' && el[viewport] ? { ...el, ...el[viewport] } : el;
        styleKeys.forEach(k => {
            if (sourceObj[k] !== undefined) {
                extracted[k] = sourceObj[k];
            }
        });
        setCopiedStyle(extracted);
        showToast(`Copied style from ${el.name || el.type}`, 'success');
    };

    const handlePasteStyle = (targetId) => {
        if (!copiedStyle) {
            showToast('No style copied yet', 'info');
            return;
        }
        const el = findNestedElement(sections, targetId);
        if (!el) return;
        handleUpdateElementSetting(targetId, copiedStyle);
        showToast(`Pasted style to ${el.name || el.type}!`, 'success');
    };



    // ── Drag & Drop Handlers ───────────────────────────────────────────
    useEffect(() => {
        const handleGlobalDragEnd = () => {
            draggingElementRef.current = null;
            setDragOverTargetId(null);
        };
        window.addEventListener('dragend', handleGlobalDragEnd);
        window.addEventListener('drop', handleGlobalDragEnd);
        return () => {
            window.removeEventListener('dragend', handleGlobalDragEnd);
            window.removeEventListener('drop', handleGlobalDragEnd);
        };
    }, []);

    const handleDragStart = (e, itemData) => {
        draggingElementRef.current = itemData;
        try {
            e.dataTransfer.setData('text/plain', JSON.stringify(itemData));
            e.dataTransfer.setData('application/json', JSON.stringify(itemData));
            e.dataTransfer.effectAllowed = 'copy';
        } catch (err) {}
    };

    const handleDragEnd = () => {
        draggingElementRef.current = null;
        setDragOverTargetId(null);
        setDragOverPosition('after');
    };

    const handleDragOver = (e, targetId, isAtomic = false) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            e.dataTransfer.dropEffect = 'copy';
        } catch (err) {}

        let pos = 'inside';
        if (isAtomic) {
            const rect = e.currentTarget.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            pos = e.clientY < midY ? 'before' : 'after';
        }

        if (dragOverTargetId !== targetId || dragOverPosition !== pos) {
            setDragOverTargetId(targetId);
            setDragOverPosition(pos);
        }
    };

    // ─── NOTE: wrapInStandardHierarchy, isContainer, insertNestedItem,
    // insertExistingNestedItem are imported from utils/treeUtils.js above.
    // Do NOT redefine them here — local definitions shadow the imports (Bug 2/3/4 fix).

    const handleCanvasElementDragStart = (e, item) => {
        e.stopPropagation();
        const payload = { isExisting: true, existingId: item.id };
        draggingElementRef.current = payload;
        try {
            e.dataTransfer.setData('text/plain', JSON.stringify(payload));
            e.dataTransfer.setData('application/json', JSON.stringify(payload));
            e.dataTransfer.effectAllowed = 'move';
        } catch (err) {}
    };

    const handleDropOnTarget = (e, targetId = null, colIdx = null) => {
        e.preventDefault();
        e.stopPropagation();
        const dropPos = dragOverPosition || 'after';
        setDragOverTargetId(null);
        setDragOverPosition('after');

        let itemData = draggingElementRef.current;
        if (!itemData) {
            try {
                const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
                if (text) itemData = JSON.parse(text);
            } catch (err) {}
        }
        draggingElementRef.current = null;
        if (!itemData) return;

        // ── Case A: Reordering / Moving existing element on Canvas ──
        if (itemData.isExisting) {
            const existingId = itemData.existingId;
            if (existingId === targetId) {
                return;
            }
            const existingObj = findNestedElement(sections, existingId);
            if (!existingObj) {
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
                return;
            }

            // 1. Remove from previous position
            const cleanSections = deleteNestedElement(sections, existingId);

            // 2. Insert into new target position
            let updated = cleanSections;
            if (!targetId || targetId === 'canvas_root') {
                updated = [...cleanSections, existingObj];
            } else {
                updated = insertExistingNestedItem(cleanSections, targetId, colIdx, existingObj, dropPos);
            }

            setSections(updated);
            setSelectedSectionId(existingId);
            setHasUnsavedChanges(true);
            showToast(`Moved ${existingObj.name || existingObj.type}!`, 'info');
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
                ...(['flex_container', 'section'].includes(cleanItemProps.type) ? { elements: cleanItemProps.elements || [] } : {}),
                ...(['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(cleanItemProps.type) ? {
                    colsCount: cleanItemProps.colsCount || (cleanItemProps.type === 'col_1' ? 1 : cleanItemProps.type === 'col_3' ? 3 : cleanItemProps.type === 'col_4' ? 4 : 2),
                    columns: cleanItemProps.columns || Array.from({ length: cleanItemProps.colsCount || 2 }, () => []),
                } : {}),
            };
            updated = insertNestedItem(updated, targetId, colIdx, newItem, dropPos);
            setSelectedSectionId(newItem.id);
        }

        setSections(updated);
        setSidebarTab('settings');
        setHasUnsavedChanges(true);
        showToast(`Inserted ${itemData.name || 'element'}!`, 'success');
    };

    const handleAddElement = (elItem) => {
        let updated = [...sections];
        const isGridType = ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(elItem.type);
        const isContainer = ['flex_container', 'section'].includes(elItem.type);

        const buildNewItem = (raw) => {
            const clean = JSON.parse(JSON.stringify(raw));
            delete clean.id;
            const colsCount = clean.type === 'col_1' ? 1 :
                              clean.type === 'col_2' || clean.type === 'col_sidebar' ? 2 :
                              clean.type === 'col_3' ? 3 :
                              clean.type === 'col_4' ? 4 :
                              clean.colsCount || 2;
            return {
                ...clean,
                id: 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                ...(isContainer ? { elements: clean.elements || [] } : {}),
                ...(isGridType ? {
                    colsCount,
                    columns: clean.columns || Array.from({ length: colsCount }, () => []),
                } : {}),
            };
        };

        if (elItem.type === 'section' || !selectedSectionId) {
            const wrappedSection = wrapInStandardHierarchy(elItem);
            updated.push(wrappedSection);
            setSelectedSectionId(wrappedSection.id);
        } else {
            const newItem = buildNewItem(elItem);
            updated = insertNestedItem(updated, selectedSectionId, null, newItem);
            setSelectedSectionId(newItem.id);
        }

        setSections(updated);
        setHasUnsavedChanges(true);
        showToast(`Added ${elItem.name}`, 'success');
    };

    const handleAddRootSection = (presetCols = 1) => {
        const validCols = typeof presetCols === 'number' ? presetCols : 1;
        const rowItem = {
            id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'grid_container',
            name: `Row (${validCols} Col)`,
            title: 'Grid Row',
            colsCount: validCols,
            columnRatio: validCols === 1 ? '100' : validCols === 3 ? '33-33-33' : validCols === 4 ? '25-25-25-25' : '50-50',
            gap: 20,
            contentWidth: 'wide',
            containerWidth: '1120',
            columns: Array.from({ length: validCols }, () => []),
            columnStyles: Array.from({ length: validCols }, () => ({})),
            elements: [],
        };
        const newSec = {
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'section',
            name: 'Full Section',
            title: `Page Section #${sections.length + 1}`,
            htmlTag: 'section',
            paddingY: 48,
            paddingX: 24,
            elements: [rowItem],
        };
        const updated = [...sections, newSec];
        setSections(updated);
        setSelectedSectionId(rowItem.id);
        setSidebarTab('settings');
        setHasUnsavedChanges(true);
        showToast(`Added Section with ${validCols}-column Row`, 'success');
    };

    const handleAddRowToSection = (sectionId, colsCount = 2) => {
        const validCols = typeof colsCount === 'number' ? colsCount : 2;
        const newRow = {
            id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'grid_container',
            name: `Row (${validCols} Col)`,
            title: 'Grid Row',
            colsCount: validCols,
            columnRatio: validCols === 1 ? '100' : validCols === 3 ? '33-33-33' : validCols === 4 ? '25-25-25-25' : '50-50',
            gap: 20,
            contentWidth: 'wide',
            containerWidth: '1120',
            columns: Array.from({ length: validCols }, () => []),
            columnStyles: Array.from({ length: validCols }, () => ({})),
            elements: [],
        };
        const updated = insertNestedItem(sections, sectionId, null, newRow);
        setSections(updated);
        setSelectedSectionId(newRow.id);
        setSidebarTab('settings');
        setHasUnsavedChanges(true);
        showToast(`Added ${validCols}-column Row to Section`, 'success');
    };

    const handleInsertStepBlueprint = () => {
        if (!activeStep?.type) return;
        const stepType = activeStep.type;
        const stepName = activeStep.name || 'Funnel Step';
        
        let elements = [];
        if (['optin', 'contact_us'].includes(stepType)) {
            elements = [
                {
                    type: 'headline',
                    headingTag: 'h1',
                    content: `Get Instant Access to ${stepName}`,
                    marginBottom: 12,
                },
                {
                    type: 'headline',
                    headingTag: 'h2',
                    content: 'Enter your contact details below to receive your download link immediately.',
                    marginBottom: 20,
                },
                {
                    type: 'input_name',
                    label: 'Full Name',
                    placeholder: 'Enter your full name...',
                    required: true,
                    marginBottom: 12,
                },
                {
                    type: 'input_email',
                    label: 'Email Address',
                    placeholder: 'Enter your email address...',
                    required: true,
                    marginBottom: 12,
                },
                {
                    type: 'checkbox',
                    text: 'I agree to the Terms of Service and Privacy Policy.',
                    required: true,
                    marginBottom: 16,
                },
                {
                    type: 'submit_button',
                    text: 'Get Instant Access Now →',
                    btnType: 'submit',
                    btnWidthMode: 'full',
                    marginBottom: 0,
                },
            ];
        } else if (stepType === 'booking') {
            elements = [
                {
                    type: 'headline',
                    headingTag: 'h1',
                    content: `Schedule Your 1-on-1 Consultation`,
                    marginBottom: 12,
                },
                {
                    type: 'headline',
                    headingTag: 'h2',
                    content: 'Select a convenient date and time on the calendar below to book your private session.',
                    marginBottom: 24,
                },
                {
                    type: 'datepicker',
                    label: 'Select Date & Time',
                    placeholder: 'Choose booking date...',
                    marginBottom: 16,
                },
                {
                    type: 'input_name',
                    label: 'Full Name',
                    placeholder: 'Enter your full name...',
                    required: true,
                    marginBottom: 12,
                },
                {
                    type: 'input_email',
                    label: 'Email Address',
                    placeholder: 'Enter your email address...',
                    required: true,
                    marginBottom: 16,
                },
                {
                    type: 'submit_button',
                    text: 'Confirm Appointment Booking →',
                    btnType: 'submit',
                    btnWidthMode: 'full',
                    marginBottom: 0,
                },
            ];
        } else if (stepType === 'checkout') {
            elements = [
                {
                    type: 'headline',
                    headingTag: 'h1',
                    content: 'Complete Your Order',
                    marginBottom: 8,
                },
                {
                    type: 'headline',
                    headingTag: 'h2',
                    content: 'Guaranteed safe & 256-bit encrypted checkout',
                    marginBottom: 24,
                },
                {
                    type: 'two_step_order',
                    step1Title: 'Step 1: Contact & Delivery Info',
                    step1Subtitle: 'Where should we send your receipt and access credentials?',
                    step1BtnText: 'Proceed to Step 2: Payment →',
                    step2Title: 'Step 2: Payment & Order Confirmation',
                    step2Subtitle: 'Fast & Secure Checkout',
                    step2BtnText: 'Complete Secure Order Now 🔒',
                    hasOrderBump: true,
                    bumpTitle: 'ONE TIME OFFER: Add VIP Fast-Track Pack ($19)',
                    bumpDesc: 'Check this box to instantly add our VIP training templates to your order today.',
                    bumpPrice: 19,
                    marginBottom: 20,
                },
            ];
        } else if (['upsell', 'downsell'].includes(stepType)) {
            elements = [
                {
                    type: 'upsell_box',
                    productName: `${stepName} - Special Offer`,
                    productPrice: stepType === 'downsell' ? 27 : 47,
                    regularPrice: 197,
                    offerHeadline: 'WAIT! Special One-Time Offer Before You Finish',
                    offerSubheadline: 'Upgrade your order today with this exclusive discount.',
                    urgencyText: '⚡ This one-time discounted offer is only available on this page right now.',
                    acceptBtnText: `YES! Upgrade My Order for Only $${stepType === 'downsell' ? 27 : 47} →`,
                    declineBtnText: 'No thanks, I will pass on this special offer and proceed to final step',
                    marginBottom: 20,
                },
            ];
        } else if (['thank_you', 'optin_thank_you'].includes(stepType)) {
            elements = [
                {
                    type: 'headline',
                    headingTag: 'h1',
                    content: '🎉 Congratulations! Your Request is Confirmed',
                    marginBottom: 12,
                },
                {
                    type: 'headline',
                    headingTag: 'h2',
                    content: 'We have received your submission. Check your inbox for confirmation details.',
                    marginBottom: 24,
                },
                {
                    type: 'bullets',
                    items: [
                        'Confirmation details sent to your registered email',
                        'Instant access link active for 24 hours',
                        'Our team is available 24/7 if you need assistance',
                    ],
                    marginBottom: 24,
                },
                {
                    type: 'submit_button',
                    text: 'Access Your Member Area Now →',
                    btnType: 'next_step',
                    btnWidthMode: 'auto',
                    marginBottom: 0,
                },
            ];
        } else {
            elements = [
                {
                    type: 'headline',
                    headingTag: 'h1',
                    content: stepName,
                    marginBottom: 12,
                },
                {
                    type: 'headline',
                    headingTag: 'h2',
                    content: 'Supporting headline clarifying the core offer and next steps.',
                    marginBottom: 20,
                },
                {
                    type: 'submit_button',
                    text: 'Proceed to Next Step →',
                    btnType: 'next_step',
                    btnWidthMode: 'auto',
                    marginBottom: 0,
                },
            ];
        }

        const newSection = {
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'section',
            name: `${stepName} Main Section`,
            title: `${stepName} Section`,
            elements: deepAssignNewIds({ elements }).elements,
        };

        const updated = [...sections, newSection];
        setSections(updated);
        setSelectedSectionId(newSection.id);
        setHasUnsavedChanges(true);
        showToast(`Inserted recommended ${stepName} blueprint!`, 'success');
    };

    const handleAddAdminBlock = (template) => {
        // Use deepAssignNewIds so inserting the same template twice never creates duplicate IDs
        // (bug 11 fix: also ensures template data is a proper element tree, not custom-type placeholders)
        const cloned = JSON.parse(JSON.stringify(template.data));
        const newBlock = deepAssignNewIds(cloned);
        const updated = [...sections, newBlock];
        setSections(updated);
        setSelectedSectionId(newBlock.id);
        setHasUnsavedChanges(true);
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
                setHasUnsavedChanges(true);
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
            setHasUnsavedChanges(true);
            return next;
        });
    };

    const handleSeoChange = (key, value) => {
        const updated = { ...seoSettings, [key]: value };
        setSeoSettings(updated);
        setHasUnsavedChanges(true);
    };

    const handleCustomCodeChange = (key, value) => {
        const updated = { ...customCode, [key]: value };
        setCustomCode(updated);
        setHasUnsavedChanges(true);
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

    const handleDeleteStep = async (stepId) => {
        const ok = await confirm({
            title: 'Delete Step',
            message: 'Delete this step and all its pages? This action cannot be undone.',
            confirmText: 'Delete Step',
            variant: 'danger',
        });
        if (!ok) return;
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
        setHasUnsavedChanges(true);
    };

    const handleDeleteSection = (index) => {
        const updated = sections.filter((_, i) => i !== index);
        setSections(updated);
        setHasUnsavedChanges(true);
        showToast('Section removed', 'info');
    };

    /**
     * handleManualSave — saves current canvas JSON and metadata on demand.
     */
    const handleManualSave = () => {
        if (!activeStep || !activePage) {
            showToast('No active page selected to save.', 'info');
            return;
        }
        setIsSaving(true);
        FunnelAdapter.savePage(funnel.uuid, activePage.id, {
            sections,
            styleGuide,
            seoSettings,
            customCode
        })
        .then(() => {
            setHasUnsavedChanges(false);
            showToast('Changes saved successfully!', 'success');
        })
        .catch(() => {
            showToast('Failed to save changes. Please try again.', 'error');
        })
        .finally(() => {
            setIsSaving(false);
        });
    };

    const handlePublish = () => {
        setPublishing(true);
        FunnelAdapter.publish(funnel.uuid, activePage?.id ? {
            pageId: activePage.id,
            sections,
            styleGuide,
            seoSettings,
            customCode
        } : null)
        .then(() => {
            setHasUnsavedChanges(false);
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

    const canvasDynamicCss = useMemo(() => {
        const cssRules = [];
        const tabletRules = [];
        const mobileRules = [];
        (sections || []).forEach(sec => collectElementCss(sec, cssRules, tabletRules, mobileRules));
        return cssRules.join('\n');
    }, [sections, styleGuide]);

    const focusContentEditable = (el) => {
        if (!el) return;
        el.focus();
        try {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (err) {}
    };

    const handleStartColumnResize = (e, containerEl, colIdx) => {
        e.preventDefault();
        e.stopPropagation();

        const rowDom = document.getElementById(`el-${containerEl.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`);
        if (!rowDom) return;

        const rowRect = rowDom.getBoundingClientRect();
        const totalCols = containerEl.colsCount || (containerEl.columns?.length || 2);

        let startWidths = [];
        if (Array.isArray(containerEl.columnWidths) && containerEl.columnWidths.length === totalCols) {
            startWidths = [...containerEl.columnWidths];
        } else {
            const equalW = +(100 / totalCols).toFixed(2);
            startWidths = Array(totalCols).fill(equalW);
        }

        const startX = e.clientX;
        setResizingCol({
            containerId: containerEl.id,
            colIdx,
            previewWidths: [...startWidths],
        });

        const onMouseMove = (moveEvent) => {
            const deltaPx = moveEvent.clientX - startX;
            const deltaPct = (deltaPx / rowRect.width) * 100;

            const minColPct = 12;
            const colA = startWidths[colIdx];
            const colB = startWidths[colIdx + 1];

            let newColA = Math.max(minColPct, Math.min(colA + colB - minColPct, colA + deltaPct));
            let newColB = (colA + colB) - newColA;

            const current = [...startWidths];
            current[colIdx] = +newColA.toFixed(1);
            current[colIdx + 1] = +newColB.toFixed(1);

            setResizingCol({
                containerId: containerEl.id,
                colIdx,
                previewWidths: current,
            });
        };

        const onMouseUp = (upEvent) => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            const deltaPx = upEvent.clientX - startX;
            const deltaPct = (deltaPx / rowRect.width) * 100;

            const minColPct = 12;
            const colA = startWidths[colIdx];
            const colB = startWidths[colIdx + 1];

            let newColA = Math.max(minColPct, Math.min(colA + colB - minColPct, colA + deltaPct));
            let newColB = (colA + colB) - newColA;

            const finalWidths = [...startWidths];
            finalWidths[colIdx] = Math.round(newColA);
            finalWidths[colIdx + 1] = Math.round(newColB);

            const total = finalWidths.reduce((a, b) => a + b, 0);
            if (total !== 100) {
                finalWidths[finalWidths.length - 1] += (100 - total);
            }

            const templateStr = finalWidths.map(w => `minmax(0, ${w}fr)`).join(' ');

            handleUpdateElementSetting(containerEl.id, {
                gridPreset: 'custom',
                gridTemplateColumns: templateStr,
                columnWidths: finalWidths,
            });

            setResizingCol(null);
            showToast(`Column ratio: ${finalWidths.map(w => w + '%').join(' / ')}`, 'info');
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const renderElementBlock = (item, parentId, cIdx = null) => {
        if (!item) return null;
        // Merge active viewport overrides (mobile/tablet) into effective properties for canvas real-time preview
        const effRaw = (viewport !== 'desktop' && item[viewport]) ? { ...item, ...item[viewport] } : item;
        const eff = sanitizeElementForBrandInheritance(effRaw);
        const isSelected = selectedSectionId === item.id;
        const isHovered  = hoveredElementId === item.id;

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
            transition: `all ${eff.transitionDuration || 200}ms ${eff.transitionTiming || 'cubic-bezier(0.4, 0, 0.2, 1)'}`,
            ...(eff.positionType === 'sticky_top' ? {
                position: 'sticky',
                top: `${eff.stickyOffset !== undefined ? eff.stickyOffset : 0}px`,
                zIndex: eff.zIndex || 40,
            } : eff.positionType === 'sticky_bottom' ? {
                position: 'sticky',
                bottom: `${eff.stickyOffset !== undefined ? eff.stickyOffset : 0}px`,
                zIndex: eff.zIndex || 40,
            } : eff.positionType === 'fixed_bottom' ? {
                position: 'fixed',
                bottom: `${eff.stickyOffset !== undefined ? eff.stickyOffset : 0}px`,
                left: 0,
                right: 0,
                zIndex: eff.zIndex || 40,
            } : {}),
        };

        // Bug 10 Fix: corrected Tailwind responsive visibility classes.
        // 'max-sm:hidden' = hide on mobile, show on desktop (sm and above).
        // 'sm:hidden'     = hide on desktop (sm and above), show on mobile.
        const visibilityClasses = [
            eff.visibleDesktop === false ? 'max-sm:hidden' : '',
            eff.visibleMobile  === false ? 'sm:hidden'     : '',
        ].filter(Boolean).join(' ');

        const effAlign = eff.alignSelf && eff.alignSelf !== 'auto'
            ? eff.alignSelf
            : (eff.type === 'submit_button' && eff.btnAlign ? (eff.btnAlign === 'left' ? 'flex-start' : eff.btnAlign === 'right' ? 'flex-end' : 'center') : undefined);
        const effWidthMode = eff.widthMode || (eff.type === 'submit_button' && eff.btnWidthMode ? (eff.btnWidthMode === 'custom' ? 'custom' : eff.btnWidthMode === 'auto' ? 'auto' : 'full') : undefined);
        const effCustomWidth = eff.customWidth ?? eff.btnCustomWidth ?? 80;

        return (
            <div
                key={eff.id}
                onDragOver={(e) => handleDragOver(e, eff.id, true)}
                onDrop={(e) => handleDropOnTarget(e, eff.id, cIdx)}
                onDragEnd={handleDragEnd}
                onMouseEnter={(e) => {
                    e.stopPropagation();
                    setHoveredElementId(eff.id);
                    setHoveredColKey(null);
                }}
                onMouseLeave={(e) => {
                    e.stopPropagation();
                    if (hoveredElementId === eff.id) {
                        setHoveredElementId(null);
                    }
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSectionId(eff.id);
                    setSidebarTab('settings');
                }}
                style={{
                    marginTop: eff.pushToBottom ? 'auto' : undefined,
                    alignSelf: effAlign,
                    flexGrow: eff.flexGrow || undefined,
                    order: eff.order || undefined,
                    width: effWidthMode === 'auto'
                        ? 'fit-content'
                        : effWidthMode === 'custom'
                        ? `${effCustomWidth}%`
                        : (eff.width !== undefined ? `${eff.width}${eff.widthUnit || '%'}` : undefined),
                    marginLeft: (effAlign === 'center' || effAlign === 'flex-end') ? 'auto' : undefined,
                    marginRight: (effAlign === 'center' || effAlign === 'flex-start') ? 'auto' : undefined,
                }}
                data-builder-selected={showGuides && isSelected ? 'true' : undefined}
                data-builder-hovered={showGuides && isHovered ? 'true' : undefined}
                className={`${
                    effWidthMode === 'auto'
                        ? 'max-w-full'
                        : effWidthMode === 'custom'
                        ? 'max-w-full'
                        : 'w-full'
                } relative group/builder cursor-pointer ${visibilityClasses}`}
            >
                {/* ── Competitor-Grade Precision Drop Indicator Line ── */}
                {dragOverTargetId === eff.id && (
                    <div
                        className={`absolute left-0 right-0 z-50 flex items-center justify-between pointer-events-none transition-all duration-75 ${
                            dragOverPosition === 'before' ? '-top-1.5' : '-bottom-1.5'
                        }`}
                    >
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-600 shadow-[0_0_8px_rgba(79,70,229,0.9)] -ml-1 border-2 border-white dark:border-neutral-900 animate-pulse" />
                        <div className="flex-1 h-1 bg-brand-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-600 shadow-[0_0_8px_rgba(79,70,229,0.9)] -mr-1 border-2 border-white dark:border-neutral-900 animate-pulse" />
                    </div>
                )}

                {/* ── Top-Right Floating Action Pill Bar ── */}
                <div
                    className={`absolute right-2 -top-4 z-30 flex items-center gap-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-0.5 shadow-lg transition-all ${
                        showGuides && isSelected
                            ? 'opacity-100 ring-2 ring-emerald-500/20 pointer-events-auto'
                            : showGuides && isHovered
                            ? 'opacity-100 pointer-events-auto'
                            : 'opacity-0 pointer-events-none'
                    }`}
                >
                    <div
                        title="Drag to reorder"
                        draggable={true}
                        onDragStart={(e) => handleCanvasElementDragStart(e, eff)}
                        onDragEnd={handleDragEnd}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-3.5 w-3.5" />
                    </div>

                    {/* Micro-Action: Move Up / Down */}
                    <button
                        type="button"
                        title="Move Up"
                        onClick={(e) => {
                            e.stopPropagation();
                            const updated = moveNestedElement(sections, eff.id, 'up');
                            setSections(updated);
                            setHasUnsavedChanges(true);
                            showToast('Moved element up', 'info');
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
                    >
                        <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        title="Move Down"
                        onClick={(e) => {
                            e.stopPropagation();
                            const updated = moveNestedElement(sections, eff.id, 'down');
                            setSections(updated);
                            setHasUnsavedChanges(true);
                            showToast('Moved element down', 'info');
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
                    >
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {/* Quick Text Formatting if text/heading/button */}
                    {isSelected && ['headline', 'subheadline', 'paragraph', 'quote', 'submit_button'].includes(eff.type) && (
                        <>
                            <div className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
                            <button
                                type="button"
                                title="Toggle Bold"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentWeight = eff.fontWeight || '400';
                                    const nextWeight = ['700', '800', '900', 'bold'].includes(String(currentWeight)) ? '400' : '700';
                                    handleUpdateElementSetting(eff.id, 'fontWeight', nextWeight);
                                }}
                                className={`p-1 rounded transition ${
                                    ['700', '800', '900', 'bold'].includes(String(eff.fontWeight))
                                        ? 'bg-brand-50 text-brand-600 font-bold'
                                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                                }`}
                            >
                                <Bold className="h-3 w-3" />
                            </button>
                            <button
                                type="button"
                                title="Toggle Italic"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateElementSetting(eff.id, 'fontStyle', eff.fontStyle === 'italic' ? 'normal' : 'italic');
                                }}
                                className={`p-1 rounded transition ${
                                    eff.fontStyle === 'italic'
                                        ? 'bg-brand-50 text-brand-600 font-bold'
                                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                                }`}
                            >
                                <Italic className="h-3 w-3" />
                            </button>
                            <button
                                type="button"
                                title="Align Left"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateElementSetting(eff.id, 'alignment', 'left');
                                }}
                                className={`p-1 rounded transition ${
                                    (eff.alignment || 'left') === 'left' ? 'text-brand-600 bg-brand-50' : 'text-neutral-400 hover:text-neutral-800'
                                }`}
                            >
                                <AlignLeft className="h-3 w-3" />
                            </button>
                            <button
                                type="button"
                                title="Align Center"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateElementSetting(eff.id, 'alignment', 'center');
                                }}
                                className={`p-1 rounded transition ${
                                    eff.alignment === 'center' ? 'text-brand-600 bg-brand-50' : 'text-neutral-400 hover:text-neutral-800'
                                }`}
                            >
                                <AlignCenter className="h-3 w-3" />
                            </button>
                            <button
                                type="button"
                                title="Align Right"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateElementSetting(eff.id, 'alignment', 'right');
                                }}
                                className={`p-1 rounded transition ${
                                    eff.alignment === 'right' ? 'text-brand-600 bg-brand-50' : 'text-neutral-400 hover:text-neutral-800'
                                }`}
                            >
                                <AlignRight className="h-3 w-3" />
                            </button>
                        </>
                    )}

                    <div className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5" />

                    <button
                        type="button"
                        title="Copy Style (Format Painter)"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCopyStyle(eff.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                    >
                        <Paintbrush className="h-3.5 w-3.5" />
                    </button>

                    {copiedStyle && (
                        <button
                            type="button"
                            title="Paste Copied Style"
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePasteStyle(eff.id);
                            }}
                            className="p-1 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded transition"
                        >
                            <ClipboardPaste className="h-3.5 w-3.5" />
                        </button>
                    )}

                    <button
                        type="button"
                        title="Settings"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSectionId(eff.id);
                            setSidebarTab('settings');
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                    </button>

                    <button
                        type="button"
                        title="Duplicate (Ctrl+D)"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateSelectedElement(eff.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </button>

                    <button
                        type="button"
                        title="Delete (Delete)"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSelectedElement(eff.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Top-Left Identifier Badge for Selected Element */}
                {showGuides && isSelected && (
                    <div className="absolute -top-3 left-2 z-30 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow flex items-center gap-1 pointer-events-none">
                        <span>{eff.name || eff.type}</span>
                    </div>
                )}

                {/* ── SECTION CONTAINER ───── */}
                {eff.type === 'section' && (() => {
                    // Auto-heal legacy section with direct columns into a child grid_container row
                    let sectionElements = Array.isArray(eff.elements) ? [...eff.elements] : [];
                    if (sectionElements.length === 0 && Array.isArray(eff.columns) && eff.columns.some(col => Array.isArray(col) && col.length > 0)) {
                        sectionElements = [{
                            id: `${eff.id}_auto_row`,
                            type: 'grid_container',
                            name: `Row (${eff.columns.length} Col)`,
                            title: 'Grid Row',
                            colsCount: eff.colsCount || eff.columns.length,
                            columns: eff.columns,
                            columnStyles: eff.columnStyles || Array.from({ length: eff.columns.length }, () => ({})),
                            columnWidths: eff.columnWidths,
                            gridPreset: eff.gridPreset || '50-50',
                            gap: eff.gap !== undefined ? eff.gap : 20,
                            containerWidth: '1120',
                            contentWidth: 'wide',
                            elements: [],
                        }];
                    }

                    return (
                        <section
                            id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                            onDragOver={(e) => handleDragOver(e, eff.id)}
                            onDrop={(e) => handleDropOnTarget(e, eff.id)}
                            className={`funnel-section w-full relative transition ${
                                dragOverTargetId === eff.id ? 'border-2 border-dashed border-amber-500 bg-amber-50/40 p-4' : ''
                            }`}
                        >
                            <div
                                className="funnel-section-inner w-full transition-all"
                                style={{
                                    maxWidth: '100%',
                                    marginLeft: 'auto',
                                    marginRight: 'auto',
                                    backgroundColor: eff.contentBgColor || undefined,
                                    borderRadius: eff.contentBorderRadius ? `${eff.contentBorderRadius}px` : undefined,
                                    padding: eff.contentPadding ? `${eff.contentPadding}px` : undefined,
                                    display: eff.layoutMode === 'flex' ? 'flex' : undefined,
                                    flexDirection: eff.layoutMode === 'flex' ? (eff.flexDirection || 'column') : undefined,
                                    justifyContent: eff.layoutMode === 'flex' ? (eff.justifyContent || 'flex-start') : undefined,
                                    alignItems: eff.layoutMode === 'flex' ? (eff.alignItems || 'stretch') : undefined,
                                    flexWrap: eff.layoutMode === 'flex' ? (eff.flexWrap || 'nowrap') : undefined,
                                    gap: eff.gap !== undefined ? `${eff.gap}px` : undefined,
                                }}
                            >
                                {sectionElements.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 rounded-lg bg-neutral-50/50">
                                        📥 Drag & drop elements or rows into this Section
                                    </div>
                                ) : (
                                    <div className="w-full space-y-4">
                                        {sectionElements.map(el => renderElementBlock(el, eff.id))}
                                    </div>
                                )}
                            </div>

                            {/* Section "+ Add Row" Inline Action Toolbar */}
                            {(showGuides || isSelected || isHovered) && (
                                <div className="w-full pt-3 pb-1 flex items-center justify-center select-none">
                                    <div className="flex items-center gap-1.5 p-1 bg-white/95 dark:bg-neutral-900/95 border border-brand-200 dark:border-neutral-700 rounded-lg shadow-xs backdrop-blur-xs">
                                        <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 px-1.5 flex items-center gap-1">
                                            <Plus className="w-3 h-3 text-brand-600" />
                                            Add Row:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleAddRowToSection(eff.id, 1); }}
                                            className="px-2 py-0.5 text-[10px] font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-600 rounded transition cursor-pointer"
                                            title="Add 1-Column Row"
                                        >
                                            1 Col
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleAddRowToSection(eff.id, 2); }}
                                            className="px-2 py-0.5 text-[10px] font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-600 rounded transition cursor-pointer"
                                            title="Add 2-Column Row (50/50)"
                                        >
                                            2 Cols
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleAddRowToSection(eff.id, 3); }}
                                            className="px-2 py-0.5 text-[10px] font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-600 rounded transition cursor-pointer"
                                            title="Add 3-Column Row (33/33/33)"
                                        >
                                            3 Cols
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleAddRowToSection(eff.id, 4); }}
                                            className="px-2 py-0.5 text-[10px] font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-600 rounded transition cursor-pointer"
                                            title="Add 4-Column Row (25/25/25/25)"
                                        >
                                            4 Cols
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    );
                })()}

                {/* ── FLEXBOX CONTAINER (d-flex) ── */}
                {eff.type === 'flex_container' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        onDragOver={(e) => handleDragOver(e, eff.id)}
                        onDrop={(e) => handleDropOnTarget(e, eff.id)}
                        style={{
                            display: 'flex',
                            flexDirection: eff.flexDirection || 'row',
                            justifyContent: eff.justifyContent || 'flex-start',
                            alignItems: eff.alignItems || 'center',
                            flexWrap: eff.flexWrap || 'nowrap',
                            gap: eff.gap !== undefined ? `${eff.gap}px` : '16px',
                        }}
                        className={`funnel-flex-container w-full transition-all ${
                            dragOverTargetId === eff.id ? 'border-2 border-dashed border-brand-500 bg-brand-50/40' : ''
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
                {['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(eff.type) && (() => {
                    const renderColumnsLayout = (containerEff) => {
                        const totalCols = containerEff.colsCount || (containerEff.columns?.length || 2);
                        return (
                            <>
                                {/* Live Column Resize Ratio Badge */}
                                {resizingCol?.containerId === containerEff.id && (
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-3 py-0.5 rounded-full shadow-2xl pointer-events-none flex items-center gap-1.5 border border-brand-500/50">
                                        <span className="text-neutral-400">Column Split:</span>
                                        <span className="text-brand-400">{resizingCol.previewWidths.map(w => Math.round(w) + '%').join(' │ ')}</span>
                                    </div>
                                )}

                                {[...Array(totalCols)].map((_, innerColIdx) => {
                                    const hasItems = containerEff.columns?.[innerColIdx]?.length > 0;
                                    const colStyle = containerEff.columnStyles?.[innerColIdx] || {};
                                    const colKey = `${containerEff.id}_col_${innerColIdx}`;
                                    const isColHovered = hoveredColKey === colKey;
                                    const isColSelected = selectedSectionId === colKey;

                                    return (
                                        <div
                                            key={innerColIdx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSectionId(colKey);
                                            }}
                                            onMouseEnter={(e) => {
                                                e.stopPropagation();
                                                setHoveredColKey(colKey);
                                            }}
                                            onMouseLeave={(e) => {
                                                e.stopPropagation();
                                                setHoveredColKey(prev => prev === colKey ? null : prev);
                                            }}
                                            onDragOver={(e) => handleDragOver(e, colKey)}
                                            onDrop={(e) => handleDropOnTarget(e, containerEff.id, innerColIdx)}
                                            data-builder-selected={showGuides && isColSelected ? 'true' : undefined}
                                            data-builder-hovered={showGuides && isColHovered ? 'true' : undefined}
                                            className={`funnel-col relative cursor-pointer ${
                                                dragOverTargetId === colKey
                                                    ? 'ring-2 ring-brand-400/50'
                                                    : hasItems
                                                    ? ''
                                                    : showGuides
                                                    ? 'min-h-[70px]'
                                                    : 'min-h-[20px]'
                                            }`}
                                        >
                                            {/* Column Hover/Selected Indicator & Quick Action Pill */}
                                            {showGuides && (
                                                <div
                                                    className={`absolute top-1.5 right-1.5 z-20 flex items-center gap-1 backdrop-blur-xs px-1.5 py-0.5 rounded-md shadow-xs text-[10px] font-bold transition-opacity duration-150 ${
                                                        isColSelected
                                                            ? 'opacity-100 pointer-events-auto bg-amber-500 text-white border border-amber-600 shadow-sm'
                                                            : isColHovered
                                                            ? 'opacity-100 pointer-events-auto bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                                                            : 'opacity-0 pointer-events-none'
                                                    }`}
                                                >
                                                    <span
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedSectionId(colKey);
                                                            setSidebarTab('settings');
                                                        }}
                                                        className={`font-mono flex items-center gap-1 cursor-pointer hover:underline ${isColSelected ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}
                                                        title="Click to select and style this column"
                                                    >
                                                        Col #{innerColIdx + 1}
                                                        {colStyle.linkUrl && <span title={`Linked to: ${colStyle.linkUrl}`}>🔗</span>}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        title="Style this Column"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedSectionId(colKey);
                                                            setSidebarTab('settings');
                                                        }}
                                                        className={`p-0.5 rounded transition cursor-pointer ${isColSelected ? 'hover:text-amber-100' : 'hover:text-amber-600'}`}
                                                    >
                                                        <SlidersHorizontal className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}

                                            {!hasItems ? (
                                                showGuides ? (
                                                    <div
                                                        className={`w-full py-4 px-3 rounded-xl border border-dashed transition-all flex flex-col items-center justify-center gap-1 select-none pointer-events-none ${
                                                            dragOverTargetId === colKey
                                                                ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 ring-2 ring-brand-400'
                                                                : 'border-neutral-300/80 dark:border-neutral-700/60 bg-neutral-50/20 text-neutral-400'
                                                        }`}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-white dark:bg-neutral-800 shadow-2xs border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xs">
                                                            <Plus className="w-3 h-3 text-neutral-400" />
                                                        </div>
                                                        <span className="text-[10px] font-medium text-neutral-400">
                                                            Drag elements here
                                                        </span>
                                                    </div>
                                                ) : <div className="min-h-[20px]" />
                                            ) : (
                                                containerEff.columns?.[innerColIdx]?.map(colChild => renderElementBlock(colChild, containerEff.id, innerColIdx))
                                            )}

                                            {/* Column Resize Divider Handle between adjacent columns */}
                                            {totalCols > 1 && innerColIdx < totalCols - 1 && (
                                                <div
                                                    onMouseDown={(e) => handleStartColumnResize(e, containerEff, innerColIdx)}
                                                    className="absolute -right-3 top-0 bottom-0 w-6 z-30 flex items-center justify-center cursor-col-resize group/resizer select-none"
                                                    title="Drag to resize column widths"
                                                >
                                                    <div className="w-1 h-full bg-brand-300/40 group-hover/resizer:bg-brand-500 rounded-full transition-colors flex items-center justify-center">
                                                        <div className="opacity-0 group-hover/resizer:opacity-100 bg-brand-600 text-white rounded-full px-1 py-0.5 shadow-md text-[8px] font-black flex items-center gap-0.5 tracking-tighter scale-90 transition-opacity">
                                                            <span>◀</span>
                                                            <span>▶</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        );
                    };

                    return (
                        <div
                            id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                            className={`funnel-row funnel-row-${eff.type} w-full relative ${
                                viewport === 'mobile' && eff.reverseMobileOrder ? 'flex flex-col-reverse' : ''
                            }`}
                            style={resizingCol?.containerId === eff.id && resizingCol.previewWidths ? {
                                '--grid-cols': resizingCol.previewWidths.map(w => `minmax(0, ${w}fr)`).join(' ')
                            } : undefined}
                        >
                            {renderColumnsLayout(eff)}
                        </div>
                    );
                })()}

                {/* ── ATOMIC ELEMENTS ─── */}
                {['headline', 'subheadline'].includes(eff.type) && (() => {
                    const tagStr = (eff.headingTag || (eff.type === 'headline' ? 'h1' : 'h2')).toLowerCase();
                    const Tag = tagStr;
                    const isEditing = editingTarget?.id === eff.id && editingTarget?.field === 'content';
                    const textVal = eff.content ?? eff.text ?? '';
                    return (
                        <Tag
                            id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                            contentEditable={isEditing}
                            suppressContentEditableWarning={true}
                            ref={(el) => { if (el && isEditing && document.activeElement !== el) focusContentEditable(el); }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingTarget({ id: eff.id, field: 'content' });
                            }}
                            onBlur={(e) => {
                                const newText = e.currentTarget.innerText;
                                if (newText !== textVal) {
                                    handleUpdateElementSetting(eff.id, 'content', newText);
                                }
                                setEditingTarget(null);
                            }}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                }
                            }}
                            className={`w-full transition-all ${
                                isEditing
                                    ? 'outline-none ring-2 ring-brand-500 rounded px-1 -mx-1 bg-brand-50/10 cursor-text select-text'
                                    : 'select-none hover:cursor-text'
                            }`}
                            title={isEditing ? 'Press Enter or Esc to finish editing' : 'Double-click to edit text'}
                        >
                            {textVal}
                        </Tag>
                    );
                })()}

                {eff.type === 'paragraph' && (() => {
                    const isEditing = editingTarget?.id === eff.id && editingTarget?.field === 'content';
                    const textVal = eff.content ?? eff.text ?? '';
                    return (
                        <p
                            id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                            contentEditable={isEditing}
                            suppressContentEditableWarning={true}
                            ref={(el) => { if (el && isEditing && document.activeElement !== el) focusContentEditable(el); }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingTarget({ id: eff.id, field: 'content' });
                            }}
                            onBlur={(e) => {
                                const newText = e.currentTarget.innerText;
                                if (newText !== textVal) {
                                    handleUpdateElementSetting(eff.id, 'content', newText);
                                }
                                setEditingTarget(null);
                            }}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Escape') {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                }
                            }}
                            className={`funnel-paragraph w-full transition-all ${
                                isEditing
                                    ? 'outline-none ring-2 ring-brand-500 rounded px-1 -mx-1 bg-brand-50/10 cursor-text select-text'
                                    : 'select-none hover:cursor-text'
                            }`}
                            title={isEditing ? 'Press Esc to finish editing' : 'Double-click to edit text'}
                        >
                            {textVal}
                        </p>
                    );
                })()}

                {eff.type === 'bullets' && (() => {
                    const iconMap = {
                        'check-circle': '✓',
                        'check': '✓',
                        'star': '⭐',
                        'sparkles': '✨',
                        'arrow': '→',
                        'chevron': '›',
                        'dot': '•',
                        'shield': '🛡️',
                        'lightning': '⚡',
                        'heart': '❤️',
                        'cross': '✕',
                        'none': '',
                    };
                    const iconName = eff.bulletIcon || 'check-circle';
                    const iconChar = eff.bulletIcon === 'none' ? '' : (iconMap[iconName] || '✓');
                    const itemGap = eff.itemSpacing !== undefined ? `${eff.itemSpacing}px` : '12px';
                    const iconGap = eff.bulletIconGap !== undefined ? `${eff.bulletIconGap}px` : '10px';
                    const iconSize = eff.bulletIconSize ? `${eff.bulletIconSize}px` : '18px';
                    const iconColor = eff.bulletIconColor || '#22c55e';
                    const alignClass = eff.bulletIconAlign === 'top' ? 'items-start' : eff.bulletIconAlign === 'baseline' ? 'items-baseline' : 'items-center';

                    return (
                        <ul
                            id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                            className="funnel-bullets"
                        >
                            {eff.items?.map((bullet, bI) => {
                                const isEditingBullet = editingTarget?.id === eff.id && editingTarget?.field === 'bullet' && editingTarget?.index === bI;
                                return (
                                    <li key={bI} className="funnel-bullet-item">
                                        {iconChar && (
                                            <span className="bullet-icon">
                                                {iconChar}
                                            </span>
                                        )}
                                        <span
                                            contentEditable={isEditingBullet}
                                            suppressContentEditableWarning={true}
                                            ref={(el) => { if (el && isEditingBullet && document.activeElement !== el) focusContentEditable(el); }}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                setEditingTarget({ id: eff.id, field: 'bullet', index: bI });
                                            }}
                                            onBlur={(e) => {
                                                const newItems = [...(eff.items || [])];
                                                newItems[bI] = e.currentTarget.innerText;
                                                handleUpdateElementSetting(eff.id, 'items', newItems);
                                                setEditingTarget(null);
                                            }}
                                            onKeyDown={(e) => {
                                                e.stopPropagation();
                                                if (e.key === 'Escape' || e.key === 'Enter') {
                                                    e.preventDefault();
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            className={`bullet-text transition-all ${
                                                isEditingBullet
                                                    ? 'outline-none ring-2 ring-brand-500 rounded px-1 -mx-1 bg-brand-50/10 cursor-text select-text'
                                                    : 'hover:cursor-text'
                                            }`}
                                            title="Double-click to edit bullet point"
                                        >
                                            {bullet}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    );
                })()}

                {eff.type === 'quote' && (() => {
                    const isEditingQuote = editingTarget?.id === eff.id && editingTarget?.field === 'content';
                    const isEditingAuthor = editingTarget?.id === eff.id && editingTarget?.field === 'author';
                    return (
                        <blockquote
                            id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                            className="funnel-quote select-none"
                        >
                            <p
                                contentEditable={isEditingQuote}
                                suppressContentEditableWarning={true}
                                ref={(el) => { if (el && isEditingQuote && document.activeElement !== el) focusContentEditable(el); }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTarget({ id: eff.id, field: 'content' });
                                }}
                                onBlur={(e) => {
                                    const raw = e.currentTarget.innerText.replace(/^["“”]|["“”]$/g, '').trim();
                                    handleUpdateElementSetting(eff.id, 'content', raw);
                                    setEditingTarget(null);
                                }}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Escape' || e.key === 'Enter') {
                                        e.preventDefault();
                                        e.currentTarget.blur();
                                    }
                                }}
                                className={`quote-text transition-all ${
                                    isEditingQuote
                                        ? 'outline-none ring-2 ring-brand-500 rounded px-1 -mx-1 bg-brand-50/10 cursor-text select-text'
                                        : 'hover:cursor-text'
                                }`}
                                title="Double-click to edit quote"
                            >
                                {isEditingQuote ? (eff.quote || eff.content) : `"${eff.quote || eff.content}"`}
                            </p>
                            <cite
                                contentEditable={isEditingAuthor}
                                suppressContentEditableWarning={true}
                                ref={(el) => { if (el && isEditingAuthor && document.activeElement !== el) focusContentEditable(el); }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTarget({ id: eff.id, field: 'author' });
                                }}
                                onBlur={(e) => {
                                    const rawAuthor = e.currentTarget.innerText.replace(/^[—–-]\s*/, '').trim();
                                    handleUpdateElementSetting(eff.id, 'author', rawAuthor);
                                    setEditingTarget(null);
                                }}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Escape' || e.key === 'Enter') {
                                        e.preventDefault();
                                        e.currentTarget.blur();
                                    }
                                }}
                                className={`quote-author transition-all ${
                                    isEditingAuthor
                                        ? 'outline-none ring-2 ring-brand-500 rounded px-1 -mx-1 bg-brand-50/10 cursor-text select-text inline-block'
                                        : 'hover:cursor-text inline-block'
                                }`}
                                title="Double-click to edit author"
                            >
                                {isEditingAuthor ? (eff.author || 'Author') : `— ${eff.author || 'Author'}`}
                            </cite>
                        </blockquote>
                    );
                })()}

                {eff.type === 'image' && (() => {
                    const imgAlign = eff.alignSelf === 'flex-start' ? 'mr-auto ml-0' : eff.alignSelf === 'flex-end' ? 'ml-auto mr-0' : 'mx-auto';
                    return (
                        <img
                            id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                            src={eff.url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'}
                            alt={eff.alt || ''}
                            style={{
                                maxWidth: eff.maxWidth ? `${eff.maxWidth}%` : '100%',
                                width: eff.aspectRatio && eff.aspectRatio !== 'auto' ? '100%' : undefined,
                                aspectRatio: eff.aspectRatio && eff.aspectRatio !== 'auto' ? eff.aspectRatio : undefined,
                                objectFit: eff.objectFit || undefined,
                                borderRadius: eff.borderRadius !== undefined && eff.borderRadius !== 0 ? `${eff.borderRadius}px` : undefined,
                            }}
                            className={`funnel-img ${imgAlign} pointer-events-none select-none transition-all duration-300 ${
                                eff.hoverEffect === 'zoom-in' ? 'hover:scale-105' : eff.hoverEffect === 'lift' ? 'hover:-translate-y-1' : ''
                            }`}
                        />
                    );
                })()}

                {eff.type === 'video' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-video-wrap aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-2xl bg-black border border-neutral-800 flex items-center justify-center select-none"
                    >
                        <div className="flex flex-col items-center gap-3 pointer-events-none">
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
                    const iconHtml = iconChar ? <span className="btn-icon">{iconChar}</span> : null;
                    const isEditingText = editingTarget?.id === eff.id && editingTarget?.field === 'text';
                    const isEditingSubtext = editingTarget?.id === eff.id && editingTarget?.field === 'subtext';

                    const mainText = (
                        <span
                            contentEditable={isEditingText}
                            suppressContentEditableWarning={true}
                            ref={(el) => { if (el && isEditingText && document.activeElement !== el) focusContentEditable(el); }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingTarget({ id: eff.id, field: 'text' });
                            }}
                            onBlur={(e) => {
                                const newText = e.currentTarget.innerText;
                                if (newText !== eff.text) {
                                    handleUpdateElementSetting(eff.id, 'text', newText);
                                }
                                setEditingTarget(null);
                            }}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Escape' || e.key === 'Enter') {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                }
                            }}
                            className={`btn-main-text transition-all ${
                                isEditingText
                                    ? 'outline-none ring-2 ring-white/90 rounded px-1.5 py-0.5 bg-black/40 cursor-text select-text'
                                    : 'hover:cursor-text'
                            }`}
                            title="Double-click to edit button text"
                        >
                            {eff.text || 'Submit'}
                        </span>
                    );

                    const content = iconChar
                        ? (iconPos === 'left' ? <span className="inline-flex items-center gap-2">{iconHtml}{mainText}</span> : <span className="inline-flex items-center gap-2">{mainText}{iconHtml}</span>)
                        : mainText;

                    const widthMode = eff.widthMode || eff.btnWidthMode || 'full';
                    const align = eff.alignSelf === 'flex-start' ? 'left' : eff.alignSelf === 'flex-end' ? 'right' : eff.alignSelf === 'center' ? 'center' : (eff.btnAlign || 'center');
                    const btnWidth = widthMode === 'auto'
                        ? 'auto'
                        : widthMode === 'custom'
                        ? `${eff.customWidth ?? eff.btnCustomWidth ?? 70}%`
                        : '100%';

                    const btnMargin = widthMode === 'full'
                        ? undefined
                        : align === 'left'
                        ? '0 auto 0 0'
                        : align === 'right'
                        ? '0 0 0 auto'
                        : '0 auto';

                    const wrapperJustify = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

                    return (
                        <div className={`w-full flex ${wrapperJustify}`}>
                            <div
                                id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                                style={{ width: btnWidth, margin: btnMargin }}
                                className="funnel-btn funnel-builder-btn transition-all flex flex-col items-center justify-center gap-0.5 select-none"
                            >
                                {content}
                                {eff.subtext && (
                                    <span
                                        contentEditable={isEditingSubtext}
                                        suppressContentEditableWarning={true}
                                        ref={(el) => { if (el && isEditingSubtext && document.activeElement !== el) focusContentEditable(el); }}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            setEditingTarget({ id: eff.id, field: 'subtext' });
                                        }}
                                        onBlur={(e) => {
                                            const newSub = e.currentTarget.innerText;
                                            if (newSub !== eff.subtext) {
                                                handleUpdateElementSetting(eff.id, 'subtext', newSub);
                                            }
                                            setEditingTarget(null);
                                        }}
                                        onKeyDown={(e) => {
                                            e.stopPropagation();
                                            if (e.key === 'Escape' || e.key === 'Enter') {
                                                e.preventDefault();
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        className={`btn-subtext font-normal tracking-normal transition-all ${
                                            isEditingSubtext
                                                ? 'outline-none ring-2 ring-white/90 rounded px-1 py-0.5 bg-black/40 cursor-text select-text'
                                                : 'hover:cursor-text'
                                        }`}
                                        style={{ marginTop: eff.subtextGap !== undefined ? `${eff.subtextGap}px` : '3px' }}
                                        title="Double-click to edit subtext"
                                    >
                                        {eff.subtext}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {eff.type === 'input_email' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-field-wrap w-full pointer-events-none select-none"
                    >
                        {eff.label && <label className="funnel-field-label">{eff.label}{eff.required ? ' *' : ''}</label>}
                        <Input
                            type="email"
                            readOnly
                            placeholder={eff.placeholder || 'Enter your email address...'}
                        />
                    </div>
                )}

                {eff.type === 'input_name' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-field-wrap w-full pointer-events-none select-none"
                    >
                        {eff.label && <label className="funnel-field-label">{eff.label}{eff.required ? ' *' : ''}</label>}
                        <Input
                            type="text"
                            readOnly
                            placeholder={eff.placeholder || 'Enter your full name...'}
                        />
                    </div>
                )}

                {eff.type === 'input_phone' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-field-wrap w-full pointer-events-none select-none"
                    >
                        {eff.label && <label className="funnel-field-label">{eff.label}{eff.required ? ' *' : ''}</label>}
                        <div className="funnel-input flex items-center p-0 overflow-hidden">
                            <div className="flex items-center gap-1 bg-neutral-100 px-3 border-r border-neutral-200 text-xs font-bold text-neutral-600">
                                <span>🇺🇸</span> +1
                            </div>
                            <Input size="sm" type="tel" readOnly placeholder={eff.placeholder || '(555) 000-0000'} className="border-0 focus:ring-0" />
                        </div>
                    </div>
                )}

                {(eff.type === 'datepicker' || eff.type === 'date_picker') && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-field-wrap w-full pointer-events-none select-none"
                    >
                        {eff.label && <label className="funnel-field-label">{eff.label}</label>}
                        <div className="funnel-input flex items-center justify-between">
                            <span>{eff.placeholder || 'Select Date & Time Slot...'}</span>
                            <Clock className="h-4 w-4 text-neutral-400" />
                        </div>
                    </div>
                )}

                {(eff.type === 'signature' || eff.type === 'signature_pad') && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-field-wrap w-full pointer-events-none select-none"
                    >
                        {eff.label && <label className="funnel-field-label">{eff.label || 'Sign Here (Draw Signature)'}</label>}
                        <div className="funnel-signature-pad flex items-center justify-center">
                            ✍️ Recipient Signature Pad
                        </div>
                    </div>
                )}

                {eff.type === 'checkbox' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-checkbox-wrap flex items-center gap-2 pointer-events-none select-none"
                    >
                        <input type="checkbox" readOnly className="h-4 w-4 rounded accent-brand-600" />
                        <label className="funnel-field-label text-xs font-semibold text-neutral-700">{eff.label || eff.text || 'I agree to the terms and conditions'}</label>
                    </div>
                )}

                {eff.type === 'divider' && (() => {
                    const isVertical = eff.dividerType === 'vertical';
                    const thickness = eff.dividerThickness !== undefined ? eff.dividerThickness : 1;
                    const style = eff.dividerStyle || 'solid';
                    const color = eff.dividerColor || eff.borderColor || '#d1d5db';
                    const align = eff.alignment || 'center';

                    if (isVertical) {
                        const heightVal = eff.dividerHeight !== undefined ? `${eff.dividerHeight}${eff.dividerHeightUnit || 'px'}` : '60px';
                        return (
                            <div className="w-full flex py-1 select-none pointer-events-none" style={{ justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }}>
                                <div
                                    id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                                    style={{
                                        height: heightVal,
                                        width: `${thickness}px`,
                                        borderLeft: `${thickness}px ${style} ${color}`,
                                    }}
                                    className="funnel-divider funnel-divider-vertical"
                                />
                            </div>
                        );
                    }

                    const widthVal = eff.dividerWidth !== undefined ? `${eff.dividerWidth}${eff.dividerWidthUnit || '%'}` : '100%';
                    return (
                        <div className="w-full flex py-2 select-none pointer-events-none" style={{ justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }}>
                            <div
                                id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                                style={{
                                    width: widthVal,
                                    borderTop: `${thickness}px ${style} ${color}`,
                                }}
                                className="funnel-divider funnel-divider-horizontal"
                            />
                        </div>
                    );
                })()}

                {eff.type === 'spacer' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        style={{
                            height: eff.spacerHeight !== undefined
                                ? `${eff.spacerHeight}px`
                                : `${(eff.paddingY || 20) * 2}px`,
                        }}
                        className="border border-dashed border-neutral-200 rounded flex items-center justify-center text-[10px] text-neutral-400 pointer-events-none"
                    >
                        Spacer
                    </div>
                )}

                {eff.type === 'timer' && (() => {
                    const d = eff.days !== undefined ? eff.days : 0;
                    const h = eff.hours !== undefined ? eff.hours : 0;
                    const m = eff.minutes !== undefined ? eff.minutes : 15;
                    const s = eff.seconds !== undefined ? eff.seconds : 0;
                    const theme = eff.timerTheme || 'red_urgent';
                    const timerType = eff.timerType || 'evergreen';

                    const themeClasses = {
                        red_urgent: 'bg-red-50/80 border-red-200 text-red-600',
                        brand: 'bg-brand-50/80 border-brand-200 text-brand-700',
                        dark: 'bg-neutral-900 border-neutral-800 text-white',
                        light: 'bg-white border-neutral-200 text-neutral-900 shadow-xs',
                        minimal: 'bg-transparent border-0 text-brand-600'
                    };

                    return (
                        <div
                            id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                            className={`p-3.5 border rounded-xl text-center flex flex-col justify-center items-center gap-1 font-mono transition-all pointer-events-none ${themeClasses[theme] || themeClasses.red_urgent}`}
                        >
                            <div className="flex items-center gap-2 font-bold text-base">
                                <Clock className="h-4 w-4 shrink-0 animate-pulse" />
                                <span>
                                    {d > 0 && `${String(d).padStart(2, '0')}d : `}
                                    {String(h).padStart(2, '0')}h : {String(m).padStart(2, '0')}m : {String(s).padStart(2, '0')}s
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-sans font-medium opacity-75">
                                <span className="uppercase tracking-wider">
                                    {timerType === 'evergreen' ? '⚡ Evergreen Session' : '📅 Fixed Deadline'}
                                </span>
                                {eff.timerAction === 'redirect_url' && (
                                    <span>• Redirect on Expiry</span>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {eff.type === 'audio' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2 pointer-events-none"
                    >
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

                {eff.type === 'icon_box' && (() => {
                    const iconMap = {
                        sparkles: '✨', star: '⭐', shield: '🛡️', lightning: '⚡',
                        check: '✓', lock: '🔒', cart: '🛒', heart: '❤️',
                        rocket: '🚀', message: '💬', clock: '⏱️', none: ''
                    };
                    const iconChar = eff.icon && eff.icon !== 'none' ? (iconMap[eff.icon] || '✨') : '✨';
                    const isHorizontal = eff.layoutAlign === 'horizontal';
                    const iconBg = eff.iconBgColor || '#eff6ff';
                    return (
                        <div
                            id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                            className={`funnel-icon-box w-full rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-800 p-4 shadow-xs transition-all pointer-events-none flex ${
                                isHorizontal ? 'flex-row items-start text-left gap-3.5' : 'flex-col items-center text-center gap-2.5'
                            }`}
                        >
                            {iconChar && (
                                <div
                                    className="icon-wrapper shrink-0 h-11 w-11 rounded-xl flex items-center justify-center text-xl shadow-xs"
                                    style={{ backgroundColor: iconBg }}
                                >
                                    <span className="icon-symbol">{iconChar}</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-neutral-900 dark:text-white text-sm truncate">{eff.title || 'Feature Title'}</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mt-0.5">{eff.desc || 'Feature description goes here.'}</p>
                                {eff.linkUrl && (
                                    <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium inline-block mt-1">
                                        🔗 {eff.linkUrl}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {eff.type === 'checkbox' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-input-wrap pointer-events-none"
                    >
                        <label className="flex items-start gap-2.5 cursor-default select-none">
                            <input type="checkbox" readOnly className="mt-0.5 h-4 w-4 rounded accent-brand-600 shrink-0" />
                            <span className="text-sm text-neutral-700">{eff.text || 'I agree to the Terms of Service and Privacy Policy.'}</span>
                        </label>
                    </div>
                )}

                {eff.type === 'progress_bar' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="w-full space-y-1 pointer-events-none"
                    >
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

                {eff.type === 'social' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="flex flex-wrap gap-2 justify-center pointer-events-none"
                    >
                        {[
                            { name: 'Facebook', color: '#1877F2', label: 'f Share' },
                            { name: 'Twitter/X', color: '#000000', label: '𝕏 Tweet' },
                            { name: 'WhatsApp', color: '#25D366', label: '✉ Share' },
                            { name: 'LinkedIn', color: '#0A66C2', label: 'in Share' },
                        ].map(s => (
                            <button key={s.name} type="button"
                                className="rounded-lg px-3.5 py-2 text-xs font-bold text-white cursor-default"
                                style={{ backgroundColor: s.color }}
                            >{s.label}</button>
                        ))}
                    </div>
                )}

                {eff.type === 'star_rating' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="flex flex-col items-center gap-1 py-1 pointer-events-none"
                    >
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

                {eff.type === 'custom_code' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="w-full rounded-xl border border-dashed border-purple-300 bg-purple-50/50 p-4 font-mono text-xs text-purple-900 overflow-x-auto space-y-1 pointer-events-none"
                    >
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-2">
                            <Code className="h-3.5 w-3.5" /> Custom HTML / Script Embed
                        </div>
                        <pre className="whitespace-pre-wrap break-all text-[11px] text-neutral-700 bg-white p-2.5 rounded border border-purple-100">{eff.code || '<!-- Enter custom HTML or script in settings -->'}</pre>
                    </div>
                )}

                {eff.type === 'rich_text' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="w-full prose prose-sm max-w-none transition-all pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: eff.htmlContent || eff.content || '<p>Enter rich text HTML in settings...</p>' }}
                    />
                )}

                {/* ── 2-STEP CHECKOUT ── */}
                {(eff.type === 'two_step_order' || eff.type === 'checkout_2step') && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-two-step-order w-full rounded-2xl border border-neutral-200 bg-white shadow-md overflow-hidden pointer-events-none"
                    >
                        <div className="grid grid-cols-2 bg-neutral-50 border-b border-neutral-200 text-center">
                            <div className="two-step-tab-btn active p-3 font-bold text-xs text-brand-600 border-b-2 border-brand-600 bg-white">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] mr-1.5">1</span>
                                {eff.step1Title || 'Step 1: Contact Info'}
                            </div>
                            <div className="two-step-tab-btn p-3 font-semibold text-xs text-neutral-500">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-neutral-200 text-neutral-600 text-[10px] mr-1.5">2</span>
                                {eff.step2Title || 'Step 2: Payment'}
                            </div>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Full Name</label>
                                    <Input size="sm" type="text" readOnly placeholder="Full Name" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Email Address</label>
                                    <Input size="sm" type="email" readOnly placeholder="Email Address" />
                                </div>
                            </div>
                            <div className="two-step-summary-box flex items-center justify-between border-t pt-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
                                <span className="text-xs font-bold text-neutral-600">Total:</span>
                                <span className="two-step-total-display text-sm font-black text-neutral-900">$47.00</span>
                            </div>
                            <button type="button" className="btn-goto-step-2 w-full py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs">
                                {eff.step1BtnText || 'Proceed to Step 2 →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── 1-CLICK ORDER BUMP ── */}
                {eff.type === 'order_bump' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-order-bump w-full rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/60 p-4 space-y-2 relative shadow-sm pointer-events-none"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="bump-badge inline-block rounded-md bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                {eff.badgeText || 'YES! ADD THIS TO MY ORDER'}
                            </span>
                            <span className="bump-price font-mono text-sm font-extrabold text-amber-800">${eff.price || 17}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <input type="checkbox" readOnly className="mt-1 h-5 w-5 rounded accent-amber-500 shrink-0" />
                            <div>
                                <h4 className="bump-title text-sm font-bold text-neutral-900">{eff.title || 'ONE TIME OFFER: Add Checklist'}</h4>
                                <p className="bump-desc text-xs text-neutral-600 leading-relaxed mt-0.5">{eff.desc || 'Check this box to instantly include this offer.'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 1-CLICK UPSELL / OTO ── */}
                {eff.type === 'upsell_box' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-upsell-box w-full rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-xl text-center space-y-4 pointer-events-none"
                    >
                        <span className="upsell-badge inline-block rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold px-3 py-1 uppercase tracking-wider">
                            {eff.urgencyText || '⚡ Special One-Time Offer'}
                        </span>
                        <h3 className="upsell-headline text-xl font-black text-neutral-900">{eff.offerHeadline || eff.title || 'Upgrade to VIP Masterclass ($47)'}</h3>
                        <p className="upsell-subheadline text-xs text-neutral-600 max-w-md mx-auto">{eff.offerSubheadline || eff.desc || 'Get instant lifetime access to the recorded workshop and templates.'}</p>
                        <div className="upsell-callout p-3 rounded-xl bg-neutral-50 border border-neutral-200/60 max-w-xs mx-auto">
                            <span className="text-xs text-neutral-400 line-through mr-2">Regular: ${eff.regularPrice || 197}</span>
                            <span className="upsell-special-price text-base font-black text-emerald-600">Special: ${eff.productPrice || eff.price || 47}</span>
                        </div>
                        <div className="space-y-2 pt-2">
                            <button type="button" className="btn-upsell-accept w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md">
                                {eff.acceptBtnText || eff.btnText || 'Yes! Upgrade My Order'}
                            </button>
                            <p className="btn-upsell-decline text-[11px] text-neutral-400 underline cursor-pointer">{eff.declineBtnText || eff.declineText || 'No thanks, I will pass on this offer'}</p>
                        </div>
                    </div>
                )}

                {/* ── PRICING TABLE ── */}
                {eff.type === 'pricing_table' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-pricing-table w-full grid grid-cols-2 gap-4 pointer-events-none"
                    >
                        {(eff.plans || [{ name: 'Standard', price: '29', period: '/mo' }, { name: 'Pro Plan', price: '79', period: '/mo', isFeatured: true }]).map((tier, tI) => (
                            <div key={tI} className={`pricing-card p-5 rounded-2xl border ${tier.isFeatured ? 'featured border-brand-500 bg-brand-50/10 shadow-lg' : 'border-neutral-200 bg-white shadow-xs'} text-center space-y-3`}>
                                {tier.isFeatured && (
                                    <span className="pricing-featured-badge inline-block px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-extrabold uppercase">
                                        Most Popular
                                    </span>
                                )}
                                <h4 className="pricing-plan-title font-bold text-sm text-neutral-900">{tier.name}</h4>
                                <div className="pricing-amount text-2xl font-black text-neutral-900">${tier.price}<span className="text-xs text-neutral-500 font-normal">{tier.period || '/mo'}</span></div>
                                <button type="button" className={`btn-pricing-cta w-full py-2 rounded-xl text-xs font-bold ${tier.isFeatured ? 'bg-brand-600 text-white shadow-xs' : 'bg-neutral-100 text-neutral-800'}`}>
                                    {tier.btnText || 'Get Started'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* faq_accordion renderer */}
                {eff.type === 'faq_accordion' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-faq-accordion w-full space-y-2 pointer-events-none"
                    >
                        {(eff.items || [{ q: 'How does it work?', a: 'You can easily configure and automate in minutes.' }]).map((faq, idx) => (
                            <div key={idx} className="faq-item rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
                                <button type="button" className="faq-toggle w-full flex items-center justify-between p-4 text-left font-bold text-sm text-neutral-900 bg-white">
                                    <span>{faq.q || 'Question?'}</span>
                                    <span className="faq-icon text-xs text-neutral-400">▼</span>
                                </button>
                                <div className="faq-answer p-4 pt-0 text-xs text-neutral-600 border-t border-neutral-100/50 leading-relaxed bg-neutral-50/50">
                                    {faq.a || 'Answer goes here...'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* testimonial_slider renderer */}
                {eff.type === 'testimonial_slider' && (
                    <div
                        id={`el-${eff.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`}
                        className="funnel-testimonial-slider w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm pointer-events-none space-y-4"
                    >
                        {(() => {
                            const items = eff.items || [{ quote: 'This funnel builder completely transformed our conversion rate!', author: 'Sarah Jenkins', role: 'Founder & CEO' }];
                            const t = items[0] || {};
                            return (
                                <div className="testimonial-card text-center space-y-3">
                                    <div className="text-amber-400 text-lg">★★★★★</div>
                                    <blockquote className="italic text-sm text-neutral-800 leading-relaxed">
                                        "{t.quote || 'Amazing experience and wonderful product!'}"
                                    </blockquote>
                                    <p className="font-bold text-xs text-neutral-900">
                                        {t.author || 'Customer Name'} <span className="font-normal text-neutral-500">({t.role || 'Verified Buyer'})</span>
                                    </p>
                                </div>
                            );
                        })()}
                        {(eff.items && eff.items.length > 1) && (
                            <div className="slider-dots flex justify-center gap-1.5 pt-2">
                                {eff.items.map((_, idx) => (
                                    <span key={idx} className={`h-2 rounded-full transition-all ${idx === 0 ? 'w-5 bg-brand-600' : 'w-2 bg-neutral-200'}`} />
                                ))}
                            </div>
                        )}
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
                    <Link href={route('client.funnels.show', funnel.uuid)} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand-600 transition">
                        <ChevronLeft className="h-4 w-4" /> Funnel Hub
                    </Link>
                    <span className="text-neutral-200">|</span>
                    <h1 className="text-sm font-semibold text-neutral-900 truncate max-w-xs">{funnel.name}</h1>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[funnel.status] ?? ''}`}>{funnel.status}</span>

                    {/* Step Switcher Dropdown (ClickFunnels & GoHighLevel style) */}
                    {funnel.steps && funnel.steps.length > 0 && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setStepDropdownOpen(!stepDropdownOpen)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-200 hover:border-brand-500 bg-neutral-50 hover:bg-white text-xs font-semibold text-neutral-800 transition shadow-2xs"
                            >
                                <ListFilter className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                                <span className="truncate max-w-[120px] sm:max-w-[160px]">
                                    {activeStep?.name || 'Select Step'}
                                </span>
                                <ChevronDown className="h-3 w-3 text-neutral-400 shrink-0" />
                            </button>

                            {stepDropdownOpen && (
                                <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl z-50 space-y-1">
                                    <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                                        <span>Funnel Steps</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStepDropdownOpen(false);
                                                setSidebarTab('steps');
                                            }}
                                            className="text-brand-600 hover:underline text-[10px] font-bold"
                                        >
                                            Manage Steps →
                                        </button>
                                    </div>
                                    {funnel.steps.map((s, idx) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveStepId(s.id);
                                                setActiveVariant('A');
                                                setStepDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                                                s.id === activeStepId
                                                    ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                                                    : 'hover:bg-neutral-100 text-neutral-700'
                                            }`}
                                        >
                                            <div className="truncate flex items-center gap-2">
                                                <span className="h-5 w-5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <span className="truncate">{s.name}</span>
                                            </div>
                                            <span className="text-[10px] text-neutral-400 uppercase font-mono">{s.type}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeVariant === 'B' && (
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                            Editing Variant B
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 text-xs pl-2">
                        {isSaving ? (
                            <span className="flex items-center gap-1 text-amber-500 font-medium">
                                <RefreshCw className="h-3 w-3 animate-spin" /> Saving…
                            </span>
                        ) : hasUnsavedChanges ? (
                            <span className="flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Unsaved Changes
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-neutral-400 text-[11px]">
                                <CheckCircle className="h-3 w-3 text-emerald-500" /> Saved
                            </span>
                        )}
                    </div>

                    {/* Step Readiness Health Status */}
                    {activeStep && (
                        <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-neutral-200 dark:border-neutral-700">
                            {stepHealth.isReady ? (
                                <span
                                    title="All required conversion elements are present on this page"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                >
                                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                                    <span>Step Ready</span>
                                </span>
                            ) : (
                                <div
                                    title={stepHealth.warningMsg}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                                >
                                    <AlertTriangle className="h-3 w-3 text-amber-600 animate-pulse" />
                                    <span>Missing: {stepHealth.requiredLabel}</span>
                                    {stepHealth.quickAddElement && (
                                        <button
                                            type="button"
                                            onClick={() => handleAddElement(stepHealth.quickAddElement)}
                                            className="ml-1 underline text-amber-700 dark:text-amber-300 hover:text-amber-900 font-extrabold cursor-pointer"
                                            title="Click to automatically add this required element"
                                        >
                                            + Add
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1 overflow-x-auto max-w-md">
                    {activeViewports.map(vp => (
                        <button key={vp.key} type="button" onClick={() => setViewport(vp.key)} className={`flex items-center gap-1 shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition ${viewport === vp.key ? 'bg-brand-600 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>
                            <vp.icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{vp.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-1">
                        <button
                            type="button"
                            onClick={undo}
                            disabled={!canUndo}
                            title="Undo (Ctrl+Z)"
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        >
                            <Undo2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={redo}
                            disabled={!canRedo}
                            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:hover:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        >
                            <Redo2 className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowGuides(!showGuides)}
                        title={showGuides ? "Hide Guides (Clean Live Preview)" : "Show Guides (Editor Wireframe)"}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
                            showGuides
                                ? 'border-neutral-200 text-neutral-700 hover:bg-neutral-100 bg-white'
                                : 'border-brand-500 bg-brand-50 text-brand-700 shadow-2xs font-bold'
                        }`}
                    >
                        {showGuides ? <Eye className="h-3.5 w-3.5 text-neutral-500" /> : <EyeOff className="h-3.5 w-3.5 text-brand-600" />}
                        <span className="hidden xl:inline">{showGuides ? 'Guides: On' : 'Guides: Off'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setTemplatesModalOpen(true)}
                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition flex items-center gap-1"
                        title="Template Gallery"
                    >
                        <LayoutTemplate className="h-3.5 w-3.5 text-brand-500" />
                        <span className="hidden lg:inline">Templates</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPopupsModalOpen(true)}
                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition flex items-center gap-1"
                        title="Interactive Popups"
                    >
                        <Layers className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="hidden lg:inline">Popups</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShareModalOpen(true)}
                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition flex items-center gap-1"
                        title="Share Funnel"
                    >
                        <Share2 className="h-3.5 w-3.5 text-blue-500" />
                        <span className="hidden lg:inline">Share</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowLayersRight(prev => !prev)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
                            showLayersRight
                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-bold shadow-2xs'
                                : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                        title="Toggle Layers Tree (Right Side)"
                    >
                        <FolderTree className="h-3.5 w-3.5 text-brand-600" />
                        <span className="hidden lg:inline">Layers</span>
                        {sections.length > 0 && (
                            <span className="rounded-full bg-brand-100 dark:bg-brand-900/60 px-1.5 py-0.2 text-[10px] font-bold text-brand-700 dark:text-brand-300">
                                {sections.length}
                            </span>
                        )}
                    </button>

                    {isPublished && (
                        <a href={`/f/${funnel.workspace_id}/${funnel.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">
                            <Globe className="h-3.5 w-3.5 text-green-600" /> Live Page
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={handlePublish}
                        disabled={publishing}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                        title="Publish & Save Funnel (Ctrl+S)"
                    >
                        {publishing ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Send className="h-3.5 w-3.5" />
                        )}
                        <span>{publishing ? 'Publishing…' : 'Publish Funnel'}</span>
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
                            { key: 'steps',    label: 'Steps',    icon: ListFilter },
                            { key: 'seo',      label: 'SEO',      icon: Search },
                        ].map(tab => (
                            <button key={tab.key} type="button" onClick={() => setSidebarTab(tab.key)} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${sidebarTab === tab.key ? 'border-b-2 border-brand-600 text-brand-600 font-bold bg-white' : 'text-neutral-500'}`}>
                                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* BLOCKS TAB */}
                    <div className={sidebarTab === 'blocks' ? 'block' : 'hidden'}>
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
                            activeStep={activeStep}
                        />
                    </div>

                    {/* SETTINGS TAB */}
                    <div className={sidebarTab === 'settings' ? 'block' : 'hidden'}>
                        <SettingsTab
                            selectedElement={selectedElement}
                            handleDeleteSelectedElement={handleDeleteSelectedElement}
                            handleUpdateElementSetting={handleUpdateElementSetting}
                            handleResetElementCategory={handleResetElementCategory}
                            styleGuide={styleGuide}
                            viewport={viewport}
                            sections={sections}
                            funnel={funnel}
                            copiedStyle={copiedStyle}
                            handleCopyStyle={handleCopyStyle}
                            handlePasteStyle={handlePasteStyle}
                            onSelectElement={(id) => {
                                setSelectedSectionId(id);
                                setSidebarTab('settings');
                            }}
                            ancestorTrail={ancestorTrail}
                            activeStep={activeStep}
                        />
                    </div>

                    {/* BRAND TAB */}
                    <div className={sidebarTab === 'brand' ? 'block' : 'hidden'}>
                        <BrandTab
                            styleGuide={styleGuide}
                            handleStyleChange={handleStyleChange}
                        />
                    </div>

                    {/* STEPS TAB */}
                    <div className={sidebarTab === 'steps' ? 'block' : 'hidden'}>
                        <StepsTab
                            funnel={funnel}
                            activeStepId={activeStepId}
                            setActiveStepId={setActiveStepId}
                            activeVariant={activeVariant}
                            onSelectVariant={setActiveVariant}
                            showAddStep={showAddStep}
                            setShowAddStep={setShowAddStep}
                            newStep={newStep}
                            setNewStep={setNewStep}
                            handleAddStep={handleAddStep}
                            handleDeleteStep={handleDeleteStep}
                            publishing={publishing}
                            onVariantChanged={() => router.reload({ only: ['funnel'] })}
                        />
                    </div>

                    {/* SEO TAB */}
                    <div className={sidebarTab === 'seo' ? 'block' : 'hidden'}>
                        <SeoTab
                            seoSettings={seoSettings}
                            handleSeoChange={handleSeoChange}
                            customCode={customCode}
                            handleCustomCodeChange={handleCustomCodeChange}
                            funnel={funnel}
                        />
                    </div>
                </aside>

                {/* Canvas Body */}
                <div className="flex flex-1 flex-col overflow-hidden w-full relative">

                    <main
                        id="builder-canvas"
                        onDragOver={(e) => handleDragOver(e, 'canvas_root')}
                        onDrop={(e) => handleDropOnTarget(e, null)}
                        onMouseLeave={() => setHoveredElementId(null)}
                        className="flex flex-1 flex-col overflow-y-auto bg-neutral-100 items-center"
                    >
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
                            #builder-canvas main.funnel-container { width:100%; max-width:100%; margin:0 auto; padding:0; }
                            #builder-canvas section { width:100%; max-width:100%; padding-top:var(--brand-container-padding-top); padding-right:var(--brand-container-padding-right); padding-bottom:var(--brand-container-padding-bottom); padding-left:var(--brand-container-padding-left); margin-top:var(--brand-container-margin-top); margin-right:auto; margin-bottom:var(--brand-container-margin-bottom); margin-left:auto; box-sizing:border-box; }
                            #builder-canvas .funnel-section-inner { width:100%; max-width:var(--section-max-width, 100%); margin-left:auto; margin-right:auto; box-sizing:border-box; }
                            #builder-canvas .funnel-row { display:grid; row-gap:var(--row-gap-y, var(--row-gap, var(--brand-element-gap-y))); column-gap:var(--row-gap-x, var(--row-gap, var(--brand-element-gap-x))); gap:var(--row-gap, var(--brand-element-gap-y) var(--brand-element-gap-x)); width:100%; max-width:var(--row-max-width, var(--brand-container-width)); margin-left:auto; margin-right:auto; box-sizing:border-box; justify-items:var(--row-justify, stretch); align-items:var(--row-align, stretch); }
                            #builder-canvas .funnel-flex-container { display:flex; gap:var(--brand-element-gap-y) var(--brand-element-gap-x); }
                            #builder-canvas .funnel-card-container { display:flex; }
                            #builder-canvas .funnel-row-grid_container { grid-template-columns:var(--grid-cols, repeat(var(--grid-cols-count, 2), minmax(0, 1fr))); }
                            #builder-canvas .funnel-row-col_1 { grid-template-columns:var(--grid-cols, 1fr); }
                            #builder-canvas .funnel-row-col_2 { grid-template-columns:var(--grid-cols, repeat(2, minmax(0, 1fr))); }
                            #builder-canvas .funnel-row-col_3 { grid-template-columns:var(--grid-cols, repeat(3, minmax(0, 1fr))); }
                            #builder-canvas .funnel-row-col_4 { grid-template-columns:var(--grid-cols, repeat(4, minmax(0, 1fr))); }
                            #builder-canvas .funnel-row-col_sidebar { grid-template-columns:var(--grid-cols, minmax(0, 7fr) minmax(0, 3fr)); }
                            #builder-canvas .funnel-col { position:relative; width:100%; min-width:0; display:flex; flex-direction:column; box-sizing:border-box; justify-content:var(--col-justify, flex-start); align-items:var(--col-align, stretch); gap:var(--col-gap, 0px); padding:var(--brand-col-padding-top) var(--brand-col-padding-right) var(--brand-col-padding-bottom) var(--brand-col-padding-left); margin:var(--brand-col-margin-top) var(--brand-col-margin-right) var(--brand-col-margin-bottom) var(--brand-col-margin-left); }
                            #builder-canvas .funnel-bullets { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }
                            #builder-canvas .funnel-bullet-item { display:flex; align-items:center; gap:10px; }
                            #builder-canvas .funnel-bullet-item .bullet-icon { display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:bold; }
                            #builder-canvas .funnel-bullet-item .bullet-text { flex:1; }
                            #builder-canvas .funnel-quote { padding:var(--brand-quote-padding-top) var(--brand-quote-padding-right) var(--brand-quote-padding-bottom) var(--brand-quote-padding-left); border-left:var(--brand-quote-border-width) solid var(--brand-quote-border-color); background:var(--brand-quote-bg-color); margin:0; border-radius:var(--brand-quote-border-radius); }
                            #builder-canvas .funnel-quote .quote-text { font-style:var(--brand-quote-font-style); font-weight:var(--brand-quote-font-weight); margin:0 0 8px 0; color:var(--brand-quote-text-color); }
                            #builder-canvas .funnel-quote .quote-author { font-weight:var(--brand-quote-cite-weight); font-style:var(--brand-quote-cite-style); color:var(--brand-quote-border-color); }
                            #builder-canvas .funnel-img { display:block; width:100%; height:auto; border-radius:var(--brand-img-border-radius); box-shadow:var(--brand-img-shadow); transition:transform 0.3s ease; }
                            #builder-canvas .funnel-video-wrap { border-radius:var(--brand-video-border-radius); box-shadow:var(--brand-video-shadow); }
                            #builder-canvas .funnel-divider { border:none; border-top:var(--brand-divider-width) var(--brand-divider-style) var(--brand-divider-color); }
                            #builder-canvas button.funnel-builder-btn, #builder-canvas .funnel-btn { width:100%; padding:var(--brand-btn-padding-top) var(--brand-btn-padding-right) var(--brand-btn-padding-bottom) var(--brand-btn-padding-left); margin:var(--brand-btn-margin-top) var(--brand-btn-margin-right) var(--brand-btn-margin-bottom) var(--brand-btn-margin-left); font-family:var(--brand-btn-font-family); font-size:var(--brand-btn-font-size); font-weight:var(--brand-btn-font-weight); cursor:pointer; border:none; border-radius:var(--brand-btn-border-radius); background:var(--brand-btn-bg-color); color:var(--brand-btn-text-color); transition:all 0.2s ease; }
                            #builder-canvas button.funnel-builder-btn:hover, #builder-canvas .funnel-btn:hover { background:var(--brand-btn-hover-bg-color); color:var(--brand-btn-hover-text-color); }
                            #builder-canvas .funnel-btn .btn-icon-wrap { display:inline-flex; align-items:center; gap:8px; }
                            #builder-canvas .funnel-btn .btn-subtext { display:block; margin-top:3px; }
                            #builder-canvas .funnel-field-label { display:block; margin-bottom:6px; font-size:12px; font-weight:600; color:#374151; }
                            #builder-canvas .funnel-signature-pad { border:1px dashed #cbd5e1; border-radius:8px; padding:24px; text-align:center; color:#94a3b8; font-size:13px; background:#f8fafc; }
                            #builder-canvas input.funnel-builder-input, #builder-canvas .funnel-input { width:100%; padding:var(--brand-field-padding-top) var(--brand-field-padding-right) var(--brand-field-padding-bottom) var(--brand-field-padding-left); margin:var(--brand-field-margin-top) var(--brand-field-margin-right) var(--brand-field-margin-bottom) var(--brand-field-margin-left); font-family:var(--brand-field-font-family); font-size:var(--brand-field-font-size); background:var(--brand-field-bg-color); color:var(--brand-field-text-color); border:1px solid var(--brand-field-border-color); border-radius:var(--brand-field-border-radius); outline:none; }
                            #builder-canvas .funnel-icon-box { padding:20px; border-radius:16px; background:#ffffff; border:1px solid #f1f5f9; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
                            #builder-canvas .funnel-icon-box.is-horizontal { display:flex; flex-direction:row; align-items:flex-start; text-align:left; gap:14px; }
                            #builder-canvas .funnel-icon-box.is-vertical { display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; }
                            #builder-canvas .funnel-icon-box .icon-wrapper { background:#eff6ff; width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
                            #builder-canvas .funnel-icon-box .icon-box-body { flex:1; }
                            #builder-canvas .funnel-icon-box .icon-box-title { margin:0 0 6px 0; font-size:15px; font-weight:700; color:#0f172a; }
                            #builder-canvas .funnel-icon-box .icon-box-desc { margin:0; font-size:13px; color:#64748b; line-height:1.5; }
                            #builder-canvas .funnel-two-step-order { max-width:580px; margin:0 auto 24px auto; background:#ffffff; border:1px solid #e5e7eb; box-shadow:0 10px 25px -5px rgba(0,0,0,0.08); border-radius:16px; overflow:hidden; }
                            #builder-canvas .funnel-two-step-order .two-step-tabs { display:grid; grid-template-columns:1fr 1fr; background:#f9fafb; border-bottom:1px solid #e5e7eb; text-align:center; }
                            #builder-canvas .funnel-two-step-order .two-step-tab-btn { padding:14px 12px; font-weight:600; font-size:13px; color:#6b7280; cursor:pointer; border-bottom:3px solid transparent; }
                            #builder-canvas .funnel-two-step-order .two-step-tab-btn.active { font-weight:700; color:var(--color-primary, #6366f1); border-bottom-color:var(--color-primary, #6366f1); background:#ffffff; }
                            #builder-canvas .funnel-two-step-order .two-step-tab-btn .step-num { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#e5e7eb; color:#6b7280; font-size:11px; margin-right:6px; }
                            #builder-canvas .funnel-two-step-order .two-step-tab-btn.active .step-num { background:var(--color-primary, #6366f1); color:#ffffff; }
                            #builder-canvas .funnel-two-step-order .two-step-pane { padding:24px; }
                            #builder-canvas .funnel-two-step-order .two-step-pane-header { margin-bottom:16px; }
                            #builder-canvas .funnel-two-step-order .two-step-pane-header h3 { margin:0; font-size:18px; font-weight:800; color:#111827; }
                            #builder-canvas .funnel-two-step-order .two-step-pane-header p { margin:4px 0 0 0; font-size:13px; color:#6b7280; }
                            #builder-canvas .funnel-two-step-order .two-step-form-grid { display:flex; flex-direction:column; gap:12px; }
                            #builder-canvas .funnel-two-step-order .two-step-field-group label { display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:4px; }
                            #builder-canvas .funnel-two-step-order .two-step-product-option { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border:2px solid #e5e7eb; border-radius:10px; margin-bottom:8px; cursor:pointer; background:#fff; transition:all 0.2s; }
                            #builder-canvas .funnel-two-step-order .two-step-product-option.selected, #builder-canvas .funnel-two-step-order .two-step-product-option:first-of-type { border-color:var(--color-primary, #6366f1); }
                            #builder-canvas .funnel-two-step-order .two-step-product-info { display:flex; align-items:center; gap:10px; }
                            #builder-canvas .funnel-two-step-order .two-step-product-radio { accent-color:var(--color-primary, #6366f1); width:18px; height:18px; }
                            #builder-canvas .funnel-two-step-order .two-step-product-name { font-weight:700; font-size:14px; color:#111827; }
                            #builder-canvas .funnel-two-step-order .two-step-product-desc { font-size:12px; color:#6b7280; }
                            #builder-canvas .funnel-two-step-order .two-step-product-price { font-weight:800; font-size:16px; color:var(--color-primary, #6366f1); }
                            #builder-canvas .funnel-two-step-order .two-step-bump-box { border:2px dashed #f59e0b; background:#fffbeb; border-radius:10px; padding:14px; margin:16px 0; }
                            #builder-canvas .funnel-two-step-order .two-step-bump-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
                            #builder-canvas .funnel-two-step-order .two-step-bump-badge { background:#f59e0b; color:#fff; font-size:11px; font-weight:800; padding:2px 8px; border-radius:4px; letter-spacing:0.5px; }
                            #builder-canvas .funnel-two-step-order .two-step-bump-price { font-weight:800; color:#b45309; font-size:15px; }
                            #builder-canvas .funnel-two-step-order .two-step-bump-body { display:flex; gap:10px; cursor:pointer; }
                            #builder-canvas .funnel-two-step-order .two-step-bump-checkbox { accent-color:#f59e0b; width:20px; height:20px; margin-top:2px; }
                            #builder-canvas .funnel-two-step-order .two-step-bump-title { font-weight:700; font-size:13px; color:#92400e; }
                            #builder-canvas .funnel-two-step-order .two-step-bump-desc { margin:2px 0 0 0; font-size:11px; color:#78350f; line-height:1.4; }
                            #builder-canvas .funnel-two-step-order .two-step-summary-box { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin:16px 0; font-weight:700; color:#334155; font-size:14px; }
                            #builder-canvas .funnel-two-step-order .two-step-total-display { font-weight:900; color:#0f172a; font-size:20px; }
                            #builder-canvas .funnel-two-step-order .two-step-payment-section { margin-bottom:16px; }
                            #builder-canvas .funnel-two-step-order .two-step-payment-label { display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:6px; }
                            #builder-canvas .funnel-two-step-order .two-step-payment-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); gap:8px; }
                            #builder-canvas .funnel-two-step-order .two-step-gateway-label { display:flex; align-items:center; justify-content:center; gap:6px; padding:8px; border:1px solid #d1d5db; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; background:#fff; }
                            #builder-canvas .funnel-two-step-order .btn-goto-step-2 { margin-top:8px; width:100%; padding:14px; background:var(--color-primary, #6366f1); color:#ffffff; font-size:15px; font-weight:700; border-radius:10px; border:none; cursor:pointer; transition:all 0.2s; }
                            #builder-canvas .funnel-two-step-order .btn-complete-checkout { width:100%; padding:16px; background:#10b981; color:#ffffff; font-size:16px; font-weight:800; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.35); transition:all 0.2s; }
                            #builder-canvas .funnel-two-step-order .two-step-guarantee { text-align:center; margin-top:12px; font-size:11px; color:#6b7280; }
                            #builder-canvas .funnel-upsell-box { max-width:620px; margin:0 auto 24px auto; background:#ffffff; border:2px solid #6366f1; box-shadow:0 12px 30px -5px rgba(99,102,241,0.15); border-radius:16px; padding:28px; text-align:center; }
                            #builder-canvas .funnel-upsell-box .upsell-badge { display:inline-block; background:#fee2e2; color:#dc2626; font-size:11px; font-weight:800; padding:4px 12px; border-radius:20px; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px; }
                            #builder-canvas .funnel-upsell-box .upsell-headline { margin:0 0 8px 0; font-size:22px; font-weight:900; color:#111827; line-height:1.3; }
                            #builder-canvas .funnel-upsell-box .upsell-subheadline { margin:0 0 20px 0; font-size:14px; color:#4b5563; }
                            #builder-canvas .funnel-upsell-box .upsell-callout { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:20px; }
                            #builder-canvas .funnel-upsell-box .upsell-callout h4 { margin:0 0 6px 0; font-size:16px; font-weight:700; color:#1e293b; }
                            #builder-canvas .funnel-upsell-box .upsell-callout .price-row { display:flex; align-items:center; justify-content:center; gap:10px; }
                            #builder-canvas .funnel-upsell-box .upsell-callout .reg-price { font-size:14px; color:#94a3b8; text-decoration:line-through; }
                            #builder-canvas .funnel-upsell-box .upsell-callout .upsell-special-price { font-size:24px; font-weight:900; color:#16a34a; }
                            #builder-canvas .funnel-upsell-box .btn-upsell-accept { width:100%; padding:16px; background:#16a34a; color:#ffffff; font-size:16px; font-weight:800; border-radius:10px; border:none; cursor:pointer; box-shadow:0 6px 18px rgba(22,163,74,0.35); transition:all 0.2s; }
                            #builder-canvas .funnel-upsell-box .btn-upsell-decline { background:none; border:none; color:#9ca3af; font-size:12px; text-decoration:underline; cursor:pointer; margin-top:14px; }
                            #builder-canvas .funnel-pricing-table { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px; margin-bottom:24px; }
                            #builder-canvas .funnel-pricing-table .pricing-card { padding:24px; border-radius:16px; border:1px solid #e5e7eb; background:#ffffff; text-align:center; display:flex; flex-direction:column; justify-content:space-between; }
                            #builder-canvas .funnel-pricing-table .pricing-card.featured { border-color:var(--color-primary, #6366f1); box-shadow:0 10px 25px -5px rgba(99,102,241,0.15); }
                            #builder-canvas .funnel-pricing-table .pricing-featured-badge { display:inline-block; padding:2px 10px; border-radius:12px; font-size:11px; font-weight:800; text-transform:uppercase; margin-bottom:8px; background:var(--color-primary, #6366f1); color:#ffffff; }
                            #builder-canvas .funnel-pricing-table .pricing-plan-title { margin:0 0 8px 0; font-size:18px; font-weight:800; }
                            #builder-canvas .funnel-pricing-table .pricing-amount-wrap { margin-bottom:16px; }
                            #builder-canvas .funnel-pricing-table .pricing-amount { font-size:32px; font-weight:900; }
                            #builder-canvas .funnel-pricing-table .pricing-period { font-size:13px; color:#6b7280; }
                            #builder-canvas .funnel-pricing-table .pricing-features-list { list-style:none; padding:0; margin:0 0 20px 0; text-align:left; font-size:13px; }
                            #builder-canvas .funnel-pricing-table .pricing-feature-item { margin-bottom:8px; display:flex; align-items:center; gap:8px; }
                            #builder-canvas .funnel-pricing-table .pricing-feature-check { color:#10b981; }
                            #builder-canvas .funnel-pricing-table .btn-pricing-cta { width:100%; padding:12px; border-radius:10px; border:none; cursor:pointer; font-weight:700; font-size:14px; background:var(--color-primary, #6366f1); color:#ffffff; }
                            ${canvasDynamicCss}
                            /* ── Editor Canvas Chrome & State Rules ── */
                            #builder-canvas [data-builder-selected="true"] {
                                outline: 2px solid #059669;
                                outline-offset: -2px;
                            }
                            #builder-canvas [data-builder-hovered="true"]:not([data-builder-selected="true"]) {
                                outline: 1px dashed rgba(16, 185, 129, 0.8);
                                outline-offset: -1px;
                            }
                            #builder-canvas .funnel-col[data-builder-selected="true"] {
                                outline: 2px solid #f59e0b;
                                outline-offset: -2px;
                            }
                            #builder-canvas .funnel-col[data-builder-hovered="true"]:not([data-builder-selected="true"]) {
                                outline: 1px dashed rgba(245, 158, 11, 0.8);
                                outline-offset: -1px;
                            }
                        `}</style>
                        <div
                            style={{
                                width: activeViewports.find(v => v.key === viewport)?.width || '100%',
                                maxWidth: '100%',
                                backgroundColor: styleGuide.bgColor,
                                fontFamily: styleGuide.defaultFont,
                                color: styleGuide.textColor,
                                minHeight: '100%',
                            }}
                            className={`w-full flex-1 flex flex-col ${viewport !== 'desktop' ? 'my-4 rounded-xl shadow-xl border border-neutral-300 overflow-hidden' : ''}`}
                        >
                            <div
                                onDragOver={(e) => handleDragOver(e, 'canvas_root')}
                                onDrop={(e) => handleDropOnTarget(e, null)}
                                className={`flex-1 w-full overflow-y-auto transition-colors ${dragOverTargetId === 'canvas_root' ? 'bg-brand-50/20 ring-4 ring-brand-500' : ''}`}
                            >
                                <div className="w-full mx-auto space-y-0">
                                    {/* Empty Canvas Smart Blueprint Prompt */}
                                    {sections.length === 0 && activeStep && (
                                        <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm text-center space-y-4 shadow-sm">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50 px-2.5 py-1 rounded-full">
                                                    {activeStep.type ? `${activeStep.type.replace(/_/g, ' ')} step` : 'Funnel Step'}
                                                </span>
                                                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                                                    Design {activeStep.name || 'Your Step'}
                                                </h3>
                                                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 leading-relaxed">
                                                    Start with a pre-configured layout with recommended conversion elements for this step, or drag and drop elements from the left panel.
                                                </p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleInsertStepBlueprint}
                                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    <span>Insert Recommended {activeStep.name} Blueprint</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddRootSection(1)}
                                                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs transition cursor-pointer"
                                                >
                                                    + Blank Section
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {sections.map((sec, idx) => (
                                        <div key={sec.id || idx} className="group relative w-full">
                                            {renderElementBlock(sec, sec.id)}
                                        </div>
                                    ))}

                                    <div className="py-8 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => handleAddRootSection(1)}
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

                {/* Right Sidebar - Layers Tree Inspector */}
                {showLayersRight && (
                    <aside className="shrink-0 flex h-full">
                        <LayersTab
                            sections={sections}
                            selectedSectionId={selectedSectionId}
                            setSelectedSectionId={setSelectedSectionId}
                            setSidebarTab={setSidebarTab}
                            setBlockSubTab={setBlockSubTab}
                            handleDuplicateSelectedElement={handleDuplicateSelectedElement}
                            handleDeleteSelectedElement={handleDeleteSelectedElement}
                            handleUpdateElementSetting={handleUpdateElementSetting}
                            hoveredElementId={hoveredElementId}
                            setHoveredElementId={setHoveredElementId}
                            onClose={() => setShowLayersRight(false)}
                        />
                    </aside>
                )}
            </div>

            {/* Save Block Modal */}
            <SaveBlockModal
                saveBlockModal={saveBlockModal}
                setSaveBlockModal={setSaveBlockModal}
                savedBlockName={savedBlockName}
                setSavedBlockName={setSavedBlockName}
                handleConfirmSaveBlock={handleSaveSectionToMyBlocks}
            />

            {/* Template Gallery Modal */}
            <TemplateGalleryModal
                isOpen={templatesModalOpen}
                onClose={() => setTemplatesModalOpen(false)}
                onApplyTemplate={(template) => {
                    if (template?.blocks) {
                        setSections(prev => [...prev, ...template.blocks]);
                        setSyncState('unsaved');
                    }
                }}
            />

            {/* Share Funnel Modal */}
            <ShareFunnelModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                funnel={funnel}
            />

            {/* Popups Manager Modal */}
            <PopupsManagerModal
                isOpen={popupsModalOpen}
                onClose={() => setPopupsModalOpen(false)}
                funnel={funnel}
                onSavePopups={() => {
                    setToast({ msg: 'Popup settings updated successfully!', type: 'success' });
                    setTimeout(() => setToast(null), 3000);
                }}
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
