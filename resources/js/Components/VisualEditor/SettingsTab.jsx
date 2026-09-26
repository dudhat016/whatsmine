import { Code, Eye, FileText, LayoutGrid, Move, Palette, Settings, Sliders, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useElementVal } from './hooks/useElementVal';
import ColumnFlexboxControl from './settings/ColumnFlexboxControl';
import ContentPanel from './settings/ContentPanel';
import CustomCssPanel from './settings/CustomCssPanel';
import ElementHeader from './settings/ElementHeader';
import FlexChildPanel from './settings/FlexChildPanel';
import LayoutPanel from './settings/LayoutPanel';
import MotionPanel from './settings/MotionPanel';
import SizePanel from './settings/SizePanel';
import StylePanel from './settings/StylePanel';
import ViewportBanner from './settings/ViewportBanner';
import VisibilityPanel from './settings/VisibilityPanel';
import { AccordionSection } from './StyleControls';

import { CONTAINER_TYPES } from './constants';
export default function SettingsTab({
    selectedElement,
    handleDeleteSelectedElement,
    handleUpdateElementSetting,
    handleResetElementCategory,
    styleGuide,
    viewport = 'desktop',
    sections = [],
    funnel = {},
    copiedStyle = null,
    handleCopyStyle = null,
    handlePasteStyle = null,
    onSelectElement = null,
    ancestorTrail = null,
    activeStep = null,
}) {
    const [subTab, setSubTab] = useState('content'); // 'content' | 'style' | 'advanced'
    const { val, isKeyOverridden, isLocallySet } = useElementVal(selectedElement, viewport, styleGuide);

    if (!selectedElement) {
        return (
            <div className="p-6 text-center text-neutral-400 space-y-2">
                <Settings className="h-8 w-8 mx-auto text-neutral-300 animate-spin" />
                <p className="font-bold text-neutral-700">No Element Selected</p>
                <p className="text-[11px]">
                    Click any element on the canvas to customize its content, styles, typography, and advanced layout in real-time!
                </p>
            </div>
        );
    }

    // Shared props passed to every sub-panel
    const shared = {
        element: selectedElement,
        val,
        viewport,
        styleGuide,
        sections,
        funnel,
        activeStep,
        handleUpdateElementSetting,
        handleResetElementCategory,
        isLocallySet,
        onSelectElement,
    };

    const isContainer = CONTAINER_TYPES.includes(selectedElement.type);

    return (
        <div className="p-3 space-y-3 text-xs overflow-y-auto">
            <ViewportBanner
                viewport={viewport}
                element={selectedElement}
                onReset={() => handleResetElementCategory(selectedElement.id, viewport)}
            />
            <ElementHeader
                element={selectedElement}
                handleDeleteSelectedElement={handleDeleteSelectedElement}
                copiedStyle={copiedStyle}
                handleCopyStyle={handleCopyStyle}
                handlePasteStyle={handlePasteStyle}
            />

            {/* 3-Tier Tabs Switcher: Content | Style | Advanced */}
            <div className="flex rounded-xl bg-neutral-100 p-1 border border-neutral-200">
                <button
                    type="button"
                    onClick={() => setSubTab('content')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        subTab === 'content'
                            ? 'bg-white text-brand-600 shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Content</span>
                </button>
                <button
                    type="button"
                    onClick={() => setSubTab('style')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        subTab === 'style'
                            ? 'bg-white text-brand-600 shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                    <Palette className="h-3.5 w-3.5" />
                    <span>Style</span>
                </button>
                <button
                    type="button"
                    onClick={() => setSubTab('advanced')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        subTab === 'advanced'
                            ? 'bg-white text-brand-600 shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Advanced</span>
                </button>
            </div>

            {/* Sub-Tab Contents */}
            <div className="space-y-3">
                {subTab === 'content' && (
                    <ContentPanel {...shared} />
                )}

                {subTab === 'style' && (
                    <StylePanel {...shared} isKeyOverridden={isKeyOverridden} />
                )}

                {subTab === 'advanced' && (
                    <div className="space-y-2.5">
                        {/* 1. Layout & Flex Alignment */}
                        {selectedElement.type === 'grid_column' ? (
                            <AccordionSection
                                title="Column Flexbox & Alignment"
                                icon={<LayoutGrid className="h-3.5 w-3.5 text-amber-600" />}
                                defaultOpen={true}
                                badge={`${val('verticalAlign', 'top')} · ${val('horizontalAlign', 'stretch')}`}
                            >
                                <ColumnFlexboxControl element={selectedElement} val={val} handleUpdateElementSetting={handleUpdateElementSetting} />
                            </AccordionSection>
                        ) : isContainer ? (
                            <AccordionSection
                                title="Container Layout & Grid"
                                icon={<LayoutGrid className="h-3.5 w-3.5 text-brand-600" />}
                                defaultOpen={true}
                                badge={val('layoutMode', selectedElement.type === 'section' ? 'block' : selectedElement.type === 'flex_container' ? 'flex' : 'grid')}
                            >
                                <LayoutPanel {...shared} />
                            </AccordionSection>
                        ) : (
                            <AccordionSection
                                title="Sizing & Flex Alignment"
                                icon={<LayoutGrid className="h-3.5 w-3.5 text-brand-600" />}
                                defaultOpen={true}
                                badge={`${val('widthMode', 'full')} · ${val('alignSelf', 'auto')}`}
                            >
                                <FlexChildPanel {...shared} />
                            </AccordionSection>
                        )}

                        {/* 2. Dimensions, Spacing & Positioning */}
                        <AccordionSection
                            title="Size, Spacing & Position"
                            icon={<Move className="h-3.5 w-3.5 text-brand-600" />}
                            defaultOpen={false}
                            badge={val('positionType', 'static') !== 'static' ? 'Sticky' : undefined}
                        >
                            <SizePanel {...shared} />
                        </AccordionSection>

                        {/* 3. Entrance Animations */}
                        <AccordionSection
                            title="Entrance Animations"
                            icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                            defaultOpen={false}
                            badge={val('animationName') && val('animationName') !== 'none' ? val('animationName') : undefined}
                        >
                            <MotionPanel {...shared} />
                        </AccordionSection>

                        {/* 4. Device Visibility */}
                        <AccordionSection
                            title="Responsive Visibility"
                            icon={<Eye className="h-3.5 w-3.5 text-blue-500" />}
                            defaultOpen={false}
                            badge={(selectedElement.visibleDesktop === false || selectedElement.visibleMobile === false) ? 'Custom' : 'All Devices'}
                        >
                            <VisibilityPanel {...shared} />
                        </AccordionSection>

                        {/* 5. Custom CSS Code */}
                        <AccordionSection
                            title="Custom CSS Code"
                            icon={<Code className="h-3.5 w-3.5 text-purple-500" />}
                            defaultOpen={false}
                            badge={val('customCss') ? 'Active' : undefined}
                        >
                            <CustomCssPanel {...shared} />
                        </AccordionSection>
                    </div>
                )}
            </div>
        </div>
    );
}
