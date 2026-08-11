import React from 'react';
import { Settings } from 'lucide-react';
import { useElementVal } from './hooks/useElementVal';
import ViewportBanner  from './settings/ViewportBanner';
import ElementHeader   from './settings/ElementHeader';
import ContentPanel    from './settings/ContentPanel';
import TypographyPanel from './settings/TypographyPanel';
import StylePanel      from './settings/StylePanel';
import SizePanel       from './settings/SizePanel';
import LayoutPanel     from './settings/LayoutPanel';
import ButtonPanel     from './settings/ButtonPanel';
import FlexChildPanel  from './settings/FlexChildPanel';
import MotionPanel     from './settings/MotionPanel';
import VisibilityPanel from './settings/VisibilityPanel';

export default function SettingsTab({
    selectedElement,
    handleDeleteSelectedElement,
    handleUpdateElementSetting,
    handleResetElementCategory,
    styleGuide,
    viewport = 'desktop',
}) {
    const { val, isKeyOverridden, isLocallySet } = useElementVal(selectedElement, viewport, styleGuide);

    if (!selectedElement) {
        return (
            <div className="p-6 text-center text-neutral-400 space-y-2">
                <Settings className="h-8 w-8 mx-auto text-neutral-300 animate-spin" />
                <p className="font-bold text-neutral-700">No Element Selected</p>
                <p className="text-[11px]">
                    Click any element on the canvas to customize its typography, spacing, background, borders, and shadows in real-time!
                </p>
            </div>
        );
    }

    // Shared props passed to every sub-panel
    const shared = { element: selectedElement, val, viewport, styleGuide, handleUpdateElementSetting, handleResetElementCategory };

    return (
        <div className="p-4 space-y-1 text-xs overflow-y-auto">
            <ViewportBanner viewport={viewport} element={selectedElement} />

            <div className="space-y-1 pt-3">
                <ElementHeader element={selectedElement} handleDeleteSelectedElement={handleDeleteSelectedElement} />
                <ContentPanel    {...shared} />
                <ButtonPanel     {...shared} />
                <TypographyPanel {...shared} isKeyOverridden={isKeyOverridden} />
                <StylePanel      {...shared} />
                <SizePanel       {...shared} />
                <LayoutPanel     {...shared} />
                <FlexChildPanel  {...shared} />
                <MotionPanel     {...shared} />
                <VisibilityPanel element={selectedElement} handleUpdateElementSetting={handleUpdateElementSetting} />
            </div>
        </div>
    );
}
