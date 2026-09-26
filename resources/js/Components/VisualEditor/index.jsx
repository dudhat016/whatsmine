import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ChevronLeft, ChevronDown, ChevronRight, Plus, Trash2, Globe, Eye, EyeOff,
    Monitor, Tablet, Smartphone, Send, RotateCcw,
    Settings, BarChart2, Share2, CheckCircle, AlertTriangle,
    GripVertical, Layers, Zap, Image, Type, AlignLeft, AlignCenter, AlignRight,
    Play, Star, HelpCircle, ArrowRight, LayoutTemplate,
    MousePointerClick, Sparkles, MoveUp, MoveDown, Copy, RefreshCw,
    Palette, Code, Search, Upload, Bookmark, Columns, Sliders, Music,
    Clock, ListFilter, CheckSquare, MessageSquare, ShieldCheck, Download,
    Box, Maximize2, MoveHorizontal, MoveVertical, FolderTree, FileText,
    GripHorizontal, DownloadCloud, SlidersHorizontal, SlidersVertical, CopyCheck, RefreshCw as ResetIcon,
    Undo2, Redo2, ExternalLink
} from 'lucide-react';
import useHistoryState from '@/hooks/useHistoryState';

import {
    VIEWPORTS, GOOGLE_FONTS, SYSTEM_FONTS, FONT_WEIGHTS,
    ELEMENT_CATEGORIES, ADMIN_BLOCK_TEMPLATES, STATUS_COLORS
} from './constants';

import {
    isContainer, wrapInStandardHierarchy, insertNestedItem,
    insertExistingNestedItem, deleteNestedElement, updateNestedElement,
    sanitizeElementForBrandInheritance, deepAssignNewIds
} from './utils/treeUtils';

import { buildBrandVars, collectElementCss, compileFullStyleTag } from './utils/cssCompiler';

import SaveBlockModal from './modals/SaveBlockModal';
import CodeExportModal from './modals/CodeExportModal';
import TemplateGalleryModal from './modals/TemplateGalleryModal';
import ShareFunnelModal from './modals/ShareFunnelModal';
import PopupsManagerModal from './modals/PopupsManagerModal';

import BlocksTab from './BlocksTab';
import SettingsTab from './SettingsTab';
import BrandTab from './BrandTab';
import LayersTab from './LayersTab';
import StepsTab from './StepsTab';
import SeoTab from './SeoTab';
import { useConfirm } from '@/context/ConfirmationContext';

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

/**
 * Unified Common Visual Editor Component
 * 
 * Usable across Funnels, Forms, E-commerce Product Landers, and CMS Pages.
 */
export default function VisualEditor({
    mode = 'funnel', // 'funnel' | 'form' | 'product' | 'page'
    initialData = null,
    funnel = null,
    activeStep = null,
    title = 'Visual Builder',
    subtitle = 'Design responsive pages with live drag & drop',
    backUrl = '/app/funnels',
    onSave = null,
    onPublish = null,
    customTabs = [],
}) {
    const { confirm } = useConfirm();
    const currentStep = activeStep || funnel?.steps?.[0] || null;

    const [viewport, setViewport] = useState('desktop');
    const [sidebarTab, setSidebarTab] = useState('blocks');
    const [blockSubTab, setBlockSubTab] = useState('elements');
    const [mySavedBlocks, setMySavedBlocks] = useState([]);
    const [loadingSavedBlocks, setLoadingSavedBlocks] = useState(false);
    const [saveBlockModal, setSaveBlockModal] = useState(null);
    const [savedBlockName, setSavedBlockName] = useState('');
    const [copiedId, setCopiedId] = useState(false);

    // Modals state
    const [showCodeExport, setShowCodeExport] = useState(false);
    const [showTemplateGallery, setShowTemplateGallery] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showRevisionsModal, setShowRevisionsModal] = useState(false);
    const [showPopupsModal, setShowPopupsModal] = useState(false);

    // Drag & Drop State
    const draggingElementRef = useRef(null);
    const [dragOverTargetId, setDragOverTargetId] = useState(null);

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

    // Sections & Brand Style Guide State with Undo/Redo history
    const [sections, setSections, { undo, redo, canUndo, canRedo }] = useHistoryState(initialData?.sections || []);
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [syncState, setSyncState] = useState('synced');
    const [showLayersRight, setShowLayersRight] = useState(true);

    const [styleGuide, setStyleGuide] = useState(initialData?.styleGuide || {
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
    });

    const [seoSettings, setSeoSettings] = useState(initialData?.seoSettings || {
        metaTitle: '',
        metaDescription: '',
        ogImage: '',
    });

    const [customCode, setCustomCode] = useState(initialData?.customCode || {
        headerCode: '',
        footerCode: '',
    });

    // Handle element selection
    const selectedElement = selectedSectionId ? findNestedElement(sections, selectedSectionId) : null;

    const handleSelectElement = (id) => {
        setSelectedSectionId(id);
        if (id) setSidebarTab('settings');
    };

    const handleUpdateElementSetting = (targetId, key, value) => {
        setSections(prev => updateNestedElement(prev, targetId, item => ({
            ...item,
            [key]: value,
            isLocallyOverridden: true,
        })));
    };

    const handleAddElement = (elementDef) => {
        const newEl = {
            ...elementDef,
            id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        };
        setSections(prev => [...prev, wrapInStandardHierarchy(newEl)]);
    };

    const handleDuplicateElement = (id) => {
        const existingObj = findNestedElement(sections, id);
        if (!existingObj) return;
        const cloned = deepAssignNewIds(JSON.parse(JSON.stringify(existingObj)));
        cloned.name = `${existingObj.name || existingObj.type} (Copy)`;
        const updated = insertNestedItem(sections, id, null, cloned);
        setSections(updated);
        setSelectedSectionId(cloned.id);
    };

    const handleDeleteElement = async (id) => {
        const ok = await confirm({
            title: 'Delete Element',
            message: 'Are you sure you want to remove this element from the canvas?',
            variant: 'danger',
        });
        if (!ok) return;
        setSections(prev => deleteNestedElement(prev, id));
        if (selectedSectionId === id) setSelectedSectionId(null);
    };

    const handleSave = () => {
        if (onSave) {
            onSave({
                sections,
                styleGuide,
                seoSettings,
                customCode,
            });
        }
    };

    // ── Global Keyboard Shortcuts ─────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
            
            // Cmd/Ctrl + S: Instant Save
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSave();
                return;
            }

            if (!selectedSectionId || isInput) return;

            // Cmd/Ctrl + D: Duplicate selected element
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                handleDuplicateElement(selectedSectionId);
                return;
            }

            // Delete / Backspace: Delete selected element
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                handleDeleteElement(selectedSectionId);
                return;
            }

            // Escape: Deselect
            if (e.key === 'Escape') {
                setSelectedSectionId(null);
                setSidebarTab('blocks');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedSectionId, sections, styleGuide, seoSettings, customCode]);

    return (
        <div className="flex h-screen w-full flex-col bg-neutral-900 text-neutral-100 select-none overflow-hidden font-sans">
            {/* Top Toolbar */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 z-30">
                <div className="flex items-center gap-3">
                    <Link
                        href={backUrl}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold text-white flex items-center gap-2">
                            {title}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30 uppercase">
                                {mode}
                            </span>
                        </h1>
                        <p className="text-[10px] text-neutral-400">{subtitle}</p>
                    </div>
                </div>

                {/* Viewport controls & Undo/Redo */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
                        <button
                            type="button"
                            onClick={() => setViewport('desktop')}
                            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                                viewport === 'desktop' ? 'bg-brand-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Monitor className="h-3.5 w-3.5" /> Desktop
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewport('tablet')}
                            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                                viewport === 'tablet' ? 'bg-brand-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Tablet className="h-3.5 w-3.5" /> Tablet
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewport('mobile')}
                            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                                viewport === 'mobile' ? 'bg-brand-600 text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Smartphone className="h-3.5 w-3.5" /> Mobile
                        </button>
                    </div>

                    <div className="h-5 w-px bg-neutral-800 mx-1" />

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={undo}
                            disabled={!canUndo}
                            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-40 transition"
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={redo}
                            disabled={!canRedo}
                            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-40 transition"
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowLayersRight(prev => !prev)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            showLayersRight ? 'bg-brand-600/20 text-brand-400 border border-brand-500/40' : 'text-neutral-400 hover:text-white border border-neutral-800 bg-neutral-900'
                        }`}
                        title="Toggle Layers Tree (Right Side)"
                    >
                        <FolderTree className="h-3.5 w-3.5 text-brand-400" />
                        <span>Layers</span>
                        {sections.length > 0 && (
                            <span className="rounded-full bg-brand-500/20 text-brand-300 px-1.5 text-[10px] font-bold">
                                {sections.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowCodeExport(true)}
                        className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition"
                    >
                        <Code className="h-3.5 w-3.5" /> HTML/CSS
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition active:scale-95"
                    >
                        <Download className="h-3.5 w-3.5" /> Save Changes
                    </button>
                </div>
            </header>

            {/* Editor Workspace */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Drawer / Palette */}
                <div className="w-80 shrink-0 border-r border-neutral-800 bg-neutral-950 flex flex-col overflow-hidden">
                    <div className="flex border-b border-neutral-800 bg-neutral-900/50 px-2 pt-2 gap-1 overflow-x-auto scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setSidebarTab('blocks')}
                            className={`px-3 py-2 text-xs font-bold border-b-2 transition ${
                                sidebarTab === 'blocks' ? 'border-brand-500 text-brand-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            Blocks
                        </button>
                        <button
                            type="button"
                            onClick={() => setSidebarTab('settings')}
                            className={`px-3 py-2 text-xs font-bold border-b-2 transition ${
                                sidebarTab === 'settings' ? 'border-brand-500 text-brand-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            Style & Props
                        </button>
                        <button
                            type="button"
                            onClick={() => setSidebarTab('brand')}
                            className={`px-3 py-2 text-xs font-bold border-b-2 transition ${
                                sidebarTab === 'brand' ? 'border-brand-500 text-brand-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            Brand
                        </button>
                        {mode === 'funnel' && funnel && (
                            <button
                                type="button"
                                onClick={() => setSidebarTab('steps')}
                                className={`px-3 py-2 text-xs font-bold border-b-2 transition ${
                                    sidebarTab === 'steps' ? 'border-brand-500 text-brand-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                                }`}
                            >
                                Steps
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setSidebarTab('seo')}
                            className={`px-3 py-2 text-xs font-bold border-b-2 transition ${
                                sidebarTab === 'seo' ? 'border-brand-500 text-brand-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            SEO/Code
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3">
                        <div className={sidebarTab === 'blocks' ? 'block' : 'hidden'}>
                            <BlocksTab
                                blockSubTab={blockSubTab}
                                setBlockSubTab={setBlockSubTab}
                                mySavedBlocks={mySavedBlocks}
                                loadingSavedBlocks={loadingSavedBlocks}
                                handleDragStart={(e, item) => {
                                    draggingElementRef.current = item;
                                    try {
                                        e.dataTransfer.setData('text/plain', JSON.stringify(item));
                                        e.dataTransfer.setData('application/json', JSON.stringify(item));
                                        e.dataTransfer.effectAllowed = 'copy';
                                    } catch (err) {}
                                }}
                                handleDragEnd={() => {
                                    draggingElementRef.current = null;
                                    setDragOverTargetId(null);
                                }}
                                handleAddElement={handleAddElement}
                                handleAddAdminBlock={(tmpl) => setSections(prev => [...prev, ...deepAssignNewIds(tmpl.sections)])}
                                handleAddSavedBlock={(blk) => setSections(prev => [...prev, ...deepAssignNewIds(blk.canvas_json?.sections || [])])}
                                activeStep={currentStep}
                            />
                        </div>

                        <div className={sidebarTab === 'settings' ? 'block' : 'hidden'}>
                            <SettingsTab
                                selectedElement={selectedElement}
                                viewport={viewport}
                                handleUpdateElementSetting={handleUpdateElementSetting}
                                handleDeleteElement={handleDeleteElement}
                            />
                        </div>

                        <div className={sidebarTab === 'brand' ? 'block' : 'hidden'}>
                            <BrandTab
                                styleGuide={styleGuide}
                                setStyleGuide={setStyleGuide}
                                handleUpdateBrandStyleGuide={(key, val) => setStyleGuide(p => ({ ...p, [key]: val }))}
                                updateSystemColor={(k, v) => setStyleGuide(p => ({ ...p, systemColors: { ...p.systemColors, [k]: v } }))}
                            />
                        </div>

                        {funnel && (
                            <div className={sidebarTab === 'steps' ? 'block' : 'hidden'}>
                                <StepsTab
                                    funnel={funnel}
                                    activeStepId={funnel.steps?.[0]?.id}
                                    setActiveStepId={() => {}}
                                    showAddStep={false}
                                    setShowAddStep={() => {}}
                                    newStep={{ name: '', type: 'optin' }}
                                    setNewStep={() => {}}
                                    handleAddStep={() => {}}
                                    handleDeleteStep={() => {}}
                                    publishing={false}
                                    onToggleSplitTest={() => {}}
                                />
                            </div>
                        )}

                        <div className={sidebarTab === 'seo' ? 'block' : 'hidden'}>
                            <SeoTab
                                seoSettings={seoSettings}
                                setSeoSettings={setSeoSettings}
                                customCode={customCode}
                                setCustomCode={setCustomCode}
                            />
                        </div>
                    </div>
                </div>

                {/* Center Canvas View - Edge to Edge */}
                <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 overflow-y-auto flex flex-col items-center">
                    <div
                        style={{
                            width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px',
                            minHeight: '100%',
                            transition: 'width 0.3s ease',
                        }}
                        className={`w-full flex-1 flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white ${viewport !== 'desktop' ? 'my-4 rounded-xl shadow-xl border border-neutral-300 dark:border-neutral-800 overflow-hidden' : ''}`}
                    >
                        {/* Render sections tree */}
                        {sections.length === 0 ? (
                            <div className="py-24 text-center text-neutral-400 space-y-3">
                                <LayoutTemplate className="h-12 w-12 mx-auto text-neutral-600" />
                                <h3 className="text-base font-bold text-neutral-300">Canvas is Empty</h3>
                                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                                    Click or drag elements from the left sidebar to start building your page.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => handleAddElement(ELEMENT_CATEGORIES[0]?.items[0])}
                                    className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition"
                                >
                                    + Add First Section
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 p-4">
                                {sections.map((sec) => (
                                    <div
                                        key={sec.id}
                                        onClick={() => handleSelectElement(sec.id)}
                                        className={`group relative rounded-lg p-4 border transition ${
                                            selectedSectionId === sec.id
                                                ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/10'
                                                : 'border-neutral-200 dark:border-neutral-800 hover:border-brand-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-2">
                                            <span className="uppercase tracking-wider text-[10px]">{sec.name || sec.type}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteElement(sec.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        {sec.elements && sec.elements.length > 0 ? (
                                            <div className="space-y-3">
                                                {sec.elements.map(child => (
                                                    <div
                                                        key={child.id}
                                                        onClick={(e) => { e.stopPropagation(); handleSelectElement(child.id); }}
                                                        className={`p-3 rounded border transition ${
                                                            selectedSectionId === child.id
                                                                ? 'border-brand-500 bg-brand-50/20'
                                                                : 'border-neutral-200 dark:border-neutral-800 hover:border-brand-400'
                                                        }`}
                                                    >
                                                        <div className="text-xs font-semibold">{child.content || child.text || child.title || child.name || child.type}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-800 rounded">
                                                Drop elements here
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Layers Tree */}
                {showLayersRight && (
                    <aside className="shrink-0 flex h-full">
                        <LayersTab
                            sections={sections}
                            selectedSectionId={selectedSectionId}
                            setSelectedSectionId={setSelectedSectionId}
                            setSidebarTab={setSidebarTab}
                            handleDuplicateSelectedElement={handleDuplicateElement}
                            handleDeleteSelectedElement={handleDeleteElement}
                            handleUpdateElementSetting={handleUpdateElementSetting}
                            onClose={() => setShowLayersRight(false)}
                        />
                    </aside>
                )}
            </div>

            {/* Modals */}
            <CodeExportModal
                isOpen={showCodeExport}
                onClose={() => setShowCodeExport(false)}
                sections={sections}
                styleGuide={styleGuide}
                seoSettings={seoSettings}
                customCode={customCode}
            />
        </div>
    );
}
