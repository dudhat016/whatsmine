import React, { useState } from 'react';
import { PanelSelect, PanelToggle, PanelNumber, PanelInput, SectionTitle, FieldLabel, IconButtonGroup } from '../BuilderUI';
import { Select } from '@/Components/ui';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import ColorPickerInput from '../ColorPicker';
import GapControl from './GapControl';
import { CONTAINER_TYPES } from '../constants';
import { CONTENT_WIDTH_PRESETS } from '../utils/treeUtils';

const defaultLayoutMode = (element) =>
    element.type === 'section' ? 'block'
    : (element.type === 'grid_container' || element.type.startsWith('col_')) ? 'grid'
    : 'flex';

export default function LayoutPanel({ element, val, viewport, handleUpdateElementSetting, handleResetElementCategory, styleGuide, onSelectElement }) {
    if (!CONTAINER_TYPES.includes(element.type)) return null;

    const [selectedColIndex, setSelectedColIndex] = useState(0);

    const update      = (key, value) => handleUpdateElementSetting(element.id, key, value);
    const updateBatch = (patch)      => handleUpdateElementSetting(element.id, patch);
    const layoutMode  = val('layoutMode', defaultLayoutMode(element));

    const rawCols = element.colsCount;
    const colsCount = (typeof rawCols === 'number' && rawCols > 0) ? rawCols : (
        element.type === 'col_1' ? 1 :
        element.type === 'col_2' || element.type === 'col_sidebar' ? 2 :
        element.type === 'col_3' ? 3 :
        element.type === 'col_4' ? 4 :
        (Array.isArray(element.columns) && element.columns.length > 0 ? element.columns.length : 2)
    );

    const updateColumnStyle = (colIdx, key, value) => {
        const currentStyles = Array.isArray(element.columnStyles) ? [...element.columnStyles] : [];
        while (currentStyles.length <= colIdx) currentStyles.push({});
        currentStyles[colIdx] = { ...(currentStyles[colIdx] || {}), [key]: value };
        update('columnStyles', currentStyles);
    };

    const currentColumnStyles = Array.isArray(element.columnStyles) ? element.columnStyles : [];
    const activeColStyle = currentColumnStyles[selectedColIndex] || {};

    // Target row element(s): if element is a section, delegate content width to its row child
    const childRows = element.type === 'section'
        ? (element.elements || []).filter(el =>
            el.type === 'grid_container' ||
            el.type === 'flex_container' ||
            (typeof el.type === 'string' && el.type.startsWith('col_'))
        )
        : [];
    const activeRow = element.type === 'section'
        ? (childRows[0] || (element.elements && element.elements[0]) || null)
        : element;

    const activeContentWidth = (() => {
        const target = activeRow || element;
        const cw = target?.contentWidth;
        if (['full', 'wide', 'medium', 'small', 'extra_small', 'custom'].includes(cw)) return cw;
        const w = target?.containerWidth;
        if (w === '100%') return 'full';
        if (w === '960') return 'medium';
        if (w === '768') return 'small';
        if (w === '540') return 'extra_small';
        if (w === '1120' || w === '1200') return 'wide';
        return 'wide';
    })();

    const ViewportIcon = viewport === 'tablet' ? Tablet : viewport === 'mobile' ? Smartphone : Monitor;

    return (
        <div className="space-y-4">
            <SectionTitle
                onReset={() => handleResetElementCategory(element.id, 'flex_container')}
                resetTitle={`Reset Layout for ${typeof viewport === 'string' ? viewport : 'desktop'}`}
            >
                <span className="flex items-center gap-1.5">
                    Container Layout
                    <span className="text-[9px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <ViewportIcon className="h-2.5 w-2.5" />{typeof viewport === 'string' ? viewport : 'desktop'}
                    </span>
                </span>
            </SectionTitle>

            <div className="space-y-3">
                {/* Semantic HTML Tag for Section */}
                {element.type === 'section' && (
                    <div className="space-y-0.5">
                        <FieldLabel>HTML Semantic Tag (SEO / a11y)</FieldLabel>
                        <PanelSelect
                            value={val('htmlTag', 'section')}
                            onChange={e => update('htmlTag', e.target.value)}
                        >
                            <option value="section">&lt;section&gt; — Standard Section (Default)</option>
                            <option value="header">&lt;header&gt; — Header / Navigation Bar</option>
                            <option value="footer">&lt;footer&gt; — Footer / Legal / Disclaimers</option>
                            <option value="main">&lt;main&gt; — Main Landing Page Hero</option>
                            <option value="div">&lt;div&gt; — Generic Container</option>
                        </PanelSelect>
                    </div>
                )}

                {/* Layout Mode & Content Width */}
                {element.type === 'section' ? (
                    <div className="space-y-0.5">
                        <FieldLabel>Content Width</FieldLabel>
                        <PanelSelect
                            value={activeContentWidth}
                            onChange={e => {
                                const key = e.target.value;
                                const preset = CONTENT_WIDTH_PRESETS.find(p => p.key === key);
                                const widthVal = key === 'custom'
                                    ? (activeRow?.containerWidth || '1120')
                                    : (preset ? preset.widthValue : '1120');

                                const rowsToUpdate = childRows.length > 0 ? childRows : (element.elements || []);
                                rowsToUpdate.forEach(row => {
                                    handleUpdateElementSetting(row.id, {
                                        contentWidth: key,
                                        containerWidth: widthVal,
                                        isLocallyOverridden: true,
                                    });
                                });
                                handleUpdateElementSetting(element.id, {
                                    contentWidth: undefined,
                                    containerWidth: undefined,
                                });
                            }}
                        >
                            {CONTENT_WIDTH_PRESETS.map(p => (
                                <option key={p.key} value={p.key}>{p.label}</option>
                            ))}
                        </PanelSelect>
                        <p className="text-[10px] text-neutral-400 italic mt-0.5">
                            Sets max-width for the row contents inside this section.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <FieldLabel>Layout</FieldLabel>
                            <PanelSelect
                                value={layoutMode}
                                onChange={e => {
                                    const newMode = e.target.value;
                                    if (newMode === 'grid') {
                                        const count = element.colsCount || element.columns?.length || 2;
                                        let cols = Array.isArray(element.columns) && element.columns.length > 0
                                            ? [...element.columns]
                                            : null;
                                        if (!cols) {
                                            const initialFirstCol = Array.isArray(element.elements) ? [...element.elements] : [];
                                            cols = [initialFirstCol, []];
                                        }
                                        while (cols.length < count) cols.push([]);
                                        updateBatch({
                                            layoutMode: 'grid',
                                            colsCount: count,
                                            gridColumns: count,
                                            columns: cols.slice(0, count),
                                            gridPreset: element.gridPreset || `repeat(${count}, minmax(0, 1fr))`,
                                            isLocallyOverridden: true,
                                        });
                                    } else {
                                        const fromCols = Array.isArray(element.columns) ? element.columns.flat() : [];
                                        const existing = Array.isArray(element.elements) && element.elements.length > 0 ? element.elements : fromCols;
                                        updateBatch({
                                            layoutMode: newMode,
                                            elements: existing,
                                            isLocallyOverridden: true,
                                        });
                                    }
                                }}
                            >
                                <option value="grid">Grid (Columns)</option>
                                <option value="flex">Flexbox</option>
                                <option value="block">Block</option>
                            </PanelSelect>
                        </div>
                        <div className="space-y-0.5">
                            <FieldLabel>Content Width</FieldLabel>
                            <PanelSelect
                                value={activeContentWidth}
                                onChange={e => {
                                    const key = e.target.value;
                                    const preset = CONTENT_WIDTH_PRESETS.find(p => p.key === key);
                                    const widthVal = key === 'custom'
                                        ? (element.containerWidth || '1120')
                                        : (preset ? preset.widthValue : '1120');
                                    updateBatch({ contentWidth: key, containerWidth: widthVal, isLocallyOverridden: true });
                                }}
                            >
                                {CONTENT_WIDTH_PRESETS.map(p => (
                                    <option key={p.key} value={p.key}>{p.label}</option>
                                ))}
                            </PanelSelect>
                        </div>
                    </div>
                )}

                {/* Custom Content Max-Width slider (when Custom is active) */}
                {activeContentWidth === 'custom' && (
                    <SliderWithInput
                        label="Custom Content Width"
                        unitKey="containerWidthUnit" unitDefault="px" unitOptions={['px', 'rem', '%']}
                        valueKey="containerWidth"
                        valueDefault={activeRow?.containerWidth || 1120}
                        max={1920}
                        step="10"
                        val={(k, def) => (activeRow && activeRow[k] !== undefined ? activeRow[k] : def)}
                        update={(k, v) => {
                            if (element.type === 'section') {
                                const rowsToUpdate = childRows.length > 0 ? childRows : (element.elements || []);
                                rowsToUpdate.forEach(row => {
                                    handleUpdateElementSetting(row.id, k, v);
                                });
                            } else {
                                update(k, v);
                            }
                        }}
                        hint="Set exact custom width in px, rem, or % for this row's content."
                    />
                )}

                {/* Content Background Color for Section (Inner Container) */}
                {element.type === 'section' && (
                    <div className="space-y-0.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-1">
                            <FieldLabel className="mb-0">Content Background Color</FieldLabel>
                            {val('contentBgColor') && (
                                <button
                                    type="button"
                                    onClick={() => update('contentBgColor', '')}
                                    className="text-[10px] text-red-500 hover:underline cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <ColorPickerInput
                            value={val('contentBgColor', '')}
                            onChange={v => update('contentBgColor', v)}
                            styleGuide={styleGuide}
                        />
                        <p className="text-[10px] text-neutral-400 italic mt-0.5">Optional card background for the inner centered container.</p>
                    </div>
                )}

                {/* Width slider */}
                <SliderWithInput
                    label="Width"
                    unitKey="widthUnit" unitDefault="%" unitOptions={['%', 'px', 'vw', 'rem']}
                    valueKey="width" valueDefault={val('widthUnit', '%') === '%' ? 100 : 1200}
                    max={val('widthUnit', '%') === '%' || val('widthUnit', '%') === 'vw' ? 100 : 1920}
                    step="0.5" val={val} update={update}
                />

                {/* Min Height slider */}
                <SliderWithInput
                    label="Min Height"
                    unitKey="minHeightUnit" unitDefault="px" unitOptions={['px', 'vh', '%']}
                    valueKey="minHeight" valueDefault={0}
                    max={val('minHeightUnit', 'px') === 'vh' || val('minHeightUnit', 'px') === '%' ? 100 : 1000}
                    hint="Use 100vh to fill full screen height."
                    val={val} update={update}
                />
            </div>

            {/* Items */}
            <div className="pt-2 border-t border-neutral-200">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-3">
                    {element.type === 'section' ? 'Rows & Columns in Section' : 'Container Items'}
                </p>

                {element.type === 'section' ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <FieldLabel className="mb-0">Rows in Section</FieldLabel>
                            <span className="text-[10px] text-neutral-400 font-medium">
                                {childRows.length} {childRows.length === 1 ? 'Row' : 'Rows'}
                            </span>
                        </div>
                        {childRows.length > 0 ? (
                            <div className="space-y-1.5">
                                {childRows.map((row, rIdx) => {
                                    const rCols = row.colsCount || (Array.isArray(row.columns) ? row.columns.length : 1);
                                    return (
                                        <div
                                            key={row.id || rIdx}
                                            className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-md bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 text-[10px] font-bold flex items-center justify-center">
                                                    {rIdx + 1}
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">{row.name || `Row (${rCols} Col)`}</p>
                                                    <p className="text-[10px] text-neutral-400">{rCols} {rCols === 1 ? 'Column' : 'Columns'} · {row.contentWidth || 'Wide'}</p>
                                                </div>
                                            </div>
                                            {onSelectElement && (
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectElement(row.id)}
                                                    className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:text-brand-600 hover:border-brand-300 transition cursor-pointer"
                                                >
                                                    Edit Columns ➔
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-3 text-center rounded-xl border border-dashed border-neutral-300 text-neutral-400 text-xs">
                                No rows in this section yet.
                            </div>
                        )}

                        {/* Quick Add Row to Section */}
                        <div className="space-y-1 p-2 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-800/40">
                            <FieldLabel className="text-[10px] text-brand-700 dark:text-brand-300 font-bold mb-1">
                                + Add Row to Section
                            </FieldLabel>
                            <div className="grid grid-cols-4 gap-1">
                                {[1, 2, 3, 4].map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            const newRow = {
                                                id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                                                type: 'grid_container',
                                                name: `Row (${c} Col)`,
                                                title: 'Grid Row',
                                                colsCount: c,
                                                columnRatio: c === 1 ? '100' : c === 3 ? '33-33-33' : c === 4 ? '25-25-25-25' : '50-50',
                                                gap: 20,
                                                contentWidth: activeContentWidth || 'wide',
                                                containerWidth: activeRow?.containerWidth || '1120',
                                                columns: Array.from({ length: c }, () => []),
                                                columnStyles: Array.from({ length: c }, () => ({})),
                                                elements: [],
                                                isLocallyOverridden: true,
                                            };
                                            const currentElements = Array.isArray(element.elements) ? [...element.elements] : [];
                                            handleUpdateElementSetting(element.id, 'elements', [...currentElements, newRow]);
                                            if (onSelectElement) onSelectElement(newRow.id);
                                        }}
                                        className="py-1 px-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-brand-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-brand-500 hover:text-white hover:border-brand-500 text-[10px] font-bold transition text-center cursor-pointer"
                                    >
                                        {c} Col{c > 1 ? 's' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Flexbox controls ── */}
                        {layoutMode === 'flex' && (
                            <div className="space-y-3">
                                {/* 9-Point Quick Alignment Matrix */}
                                <div className="space-y-1 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                        <span>Quick Alignment Matrix</span>
                                        <span className="text-[9px] text-brand-600 font-normal">1-click align</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 w-28 mx-auto p-1 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                        {[
                                            { j: 'flex-start', a: 'flex-start', label: '↖' },
                                            { j: 'center',     a: 'flex-start', label: '⬆' },
                                            { j: 'flex-end',   a: 'flex-start', label: '↗' },
                                            { j: 'flex-start', a: 'center',     label: '⬅' },
                                            { j: 'center',     a: 'center',     label: '⏺' },
                                            { j: 'flex-end',   a: 'center',     label: '➡' },
                                            { j: 'flex-start', a: 'flex-end',   label: '↙' },
                                            { j: 'center',     a: 'flex-end',   label: '⬇' },
                                            { j: 'flex-end',   a: 'flex-end',   label: '↘' },
                                        ].map((pt, i) => {
                                            const isDirCol = val('flexDirection', 'row').startsWith('column');
                                            const targetJ = isDirCol ? pt.a : pt.j;
                                            const targetA = isDirCol ? pt.j : pt.a;
                                            const isActive = val('justifyContent', 'flex-start') === targetJ && val('alignItems', 'stretch') === targetA;
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    title={`Align ${pt.label}`}
                                                    onClick={() => {
                                                        updateBatch({ justifyContent: targetJ, alignItems: targetA });
                                                    }}
                                                    className={`h-6 text-xs font-bold rounded flex items-center justify-center transition cursor-pointer ${
                                                        isActive
                                                            ? 'bg-brand-600 text-white shadow-xs'
                                                            : 'bg-neutral-50 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300 hover:bg-brand-50 hover:text-brand-600'
                                                    }`}
                                                >
                                                    {pt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-0.5">
                                    <FieldLabel>Direction</FieldLabel>
                                    <IconButtonGroup
                                        value={val('flexDirection', 'row')}
                                        onChange={v => update('flexDirection', v)}
                                        cols={4}
                                        options={[
                                            { key: 'row',            icon: '→', title: 'Row' },
                                            { key: 'column',         icon: '↓', title: 'Column' },
                                            { key: 'row-reverse',    icon: '←', title: 'Row Reverse' },
                                            { key: 'column-reverse', icon: '↑', title: 'Column Reverse' },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-0.5">
                                    <FieldLabel>Justify Content</FieldLabel>
                                    <IconButtonGroup
                                        value={val('justifyContent', 'flex-start')}
                                        onChange={v => update('justifyContent', v)}
                                        cols={6}
                                        options={[
                                            { key: 'flex-start',   icon: '▍ ',  title: 'Start' },
                                            { key: 'center',       icon: ' ▌ ', title: 'Center' },
                                            { key: 'flex-end',     icon: ' ▍',  title: 'End' },
                                            { key: 'space-between',icon: '▍ ▍', title: 'Space Between' },
                                            { key: 'space-around', icon: '▌ ▌', title: 'Space Around' },
                                            { key: 'space-evenly', icon: '▕ ▕', title: 'Space Evenly' },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-0.5">
                                    <FieldLabel>Align Items</FieldLabel>
                                    <IconButtonGroup
                                        value={val('alignItems', 'stretch')}
                                        onChange={v => update('alignItems', v)}
                                        cols={4}
                                        options={[
                                            { key: 'flex-start', icon: '⊤', title: 'Start' },
                                            { key: 'center',     icon: '┼', title: 'Center' },
                                            { key: 'flex-end',   icon: '⊥', title: 'End' },
                                            { key: 'stretch',    icon: '⧉', title: 'Stretch' },
                                        ]}
                                    />
                                </div>

                                <GapControl val={val} elementId={element.id} handleUpdateElementSetting={handleUpdateElementSetting} />

                                <div className="space-y-0.5">
                                    <FieldLabel>Wrap</FieldLabel>
                                    <IconButtonGroup
                                        value={val('flexWrap', 'nowrap')}
                                        onChange={v => update('flexWrap', v)}
                                        cols={2}
                                        options={[
                                            { key: 'nowrap', icon: '↳ No Wrap', title: 'No Wrap' },
                                            { key: 'wrap',   icon: '↲ Wrap',    title: 'Wrap' },
                                        ]}
                                    />
                                    <p className="text-[10px] italic text-neutral-400 mt-1">Items can stay single-line (No Wrap) or break into multiple lines (Wrap).</p>
                                </div>
                            </div>
                        )}

                        {/* ── Grid controls ── */}
                        {layoutMode === 'grid' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <FieldLabel>Grid Outline</FieldLabel>
                                    <PanelToggle
                                        value={val('gridOutline', true)}
                                        onChange={v => update('gridOutline', v)}
                                    />
                                </div>

                                <GridSlider label="Columns" valueKey="gridColumns" unitKey="gridColumnsUnit"
                                    unitDefault="1fr"
                                    unitOptions={[{ v: '1fr', l: 'fr' }, { v: 'px', l: 'px' }, { v: '%', l: '%' }]}
                                    defaultCount={colsCount}
                                    onChange={count => {
                                        const cols = [...(element.columns || [])];
                                        while (cols.length < count) cols.push([]);
                                        updateBatch({ gridColumns: count, colsCount: count, columns: cols.slice(0, count) });
                                    }}
                                    val={val} update={update}
                                />

                                {/* Quick Column Ratio Presets for 2 and 3 columns */}
                                {(colsCount === 2 || colsCount === 3) && (() => {
                                    const presets = colsCount === 2
                                        ? [
                                            { label: '50 / 50', widths: [50, 50] },
                                            { label: '60 / 40', widths: [60, 40] },
                                            { label: '40 / 60', widths: [40, 60] },
                                            { label: '70 / 30', widths: [70, 30] },
                                            { label: '30 / 70', widths: [30, 70] },
                                        ]
                                        : [
                                            { label: '33/33/33', widths: [33, 34, 33] },
                                            { label: '25/50/25', widths: [25, 50, 25] },
                                            { label: '50/25/25', widths: [50, 25, 25] },
                                            { label: '25/25/50', widths: [25, 25, 50] },
                                        ];

                                    const currentWidthsStr = (element.columnWidths || []).join('/');

                                    return (
                                        <div className="space-y-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                                <span>Column Ratio Presets</span>
                                                <span className="text-[9px] text-brand-600 font-normal">or drag divider on canvas</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {presets.map(p => {
                                                    const isMatch = currentWidthsStr === p.widths.join('/');
                                                    return (
                                                        <button
                                                            key={p.label}
                                                            type="button"
                                                            onClick={() => {
                                                                const templateStr = p.widths.map(w => `minmax(0, ${w}fr)`).join(' ');
                                                                updateBatch({
                                                                    gridPreset: 'custom',
                                                                    gridTemplateColumns: templateStr,
                                                                    columnWidths: p.widths,
                                                                });
                                                            }}
                                                            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                                                                isMatch
                                                                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                                                                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-brand-400 hover:text-brand-600'
                                                            }`}
                                                        >
                                                            {p.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <GridSlider label="Rows" valueKey="gridRows" unitKey="gridRowsUnit"
                                    unitDefault="fr"
                                    unitOptions={[{ v: 'fr', l: 'fr' }, { v: 'px', l: 'px' }, { v: '%', l: '%' }]}
                                    defaultCount={2}
                                    onChange={count => update('gridRows', count)}
                                    val={val} update={update}
                                />

                                <GapControl val={val} elementId={element.id} handleUpdateElementSetting={handleUpdateElementSetting} />

                                <div className="space-y-0.5">
                                    <FieldLabel>Auto Flow</FieldLabel>
                                    <PanelSelect value={val('gridAutoFlow', 'row')} onChange={e => update('gridAutoFlow', e.target.value)}>
                                        <option value="row">Row</option>
                                        <option value="column">Column</option>
                                        <option value="row dense">Row Dense</option>
                                        <option value="column dense">Column Dense</option>
                                    </PanelSelect>
                                </div>

                                <div className="space-y-0.5">
                                    <FieldLabel>Justify Items</FieldLabel>
                                    <IconButtonGroup
                                        value={val('justifyItems', 'stretch')}
                                        onChange={v => update('justifyItems', v)}
                                        cols={4}
                                        options={[
                                            { key: 'start',   icon: '╞', title: 'Start' },
                                            { key: 'center',  icon: '┼', title: 'Center' },
                                            { key: 'end',     icon: '╡', title: 'End' },
                                            { key: 'stretch', icon: '⧉', title: 'Stretch' },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-0.5">
                                    <FieldLabel>Align Items</FieldLabel>
                                    <IconButtonGroup
                                        value={val('alignItems', 'stretch')}
                                        onChange={v => update('alignItems', v)}
                                        cols={4}
                                        options={[
                                            { key: 'start',   icon: '⊤', title: 'Start' },
                                            { key: 'center',  icon: '┼', title: 'Center' },
                                            { key: 'end',     icon: '⊥', title: 'End' },
                                            { key: 'stretch', icon: '⧉', title: 'Stretch' },
                                        ]}
                                    />
                                </div>

                                {/* Reverse Column Order on Mobile */}
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                                    <div className="space-y-0.5">
                                        <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Reverse on Mobile</div>
                                        <p className="text-[10px] text-neutral-500">Invert column stacking order on mobile screens</p>
                                    </div>
                                    <PanelToggle
                                        value={val('reverseMobileOrder', false)}
                                        onChange={v => update('reverseMobileOrder', v)}
                                    />
                                </div>

                                {/* ── Column Customization Tabs ── */}
                                <div className="pt-3 border-t border-neutral-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <FieldLabel className="mb-0">Column Customization</FieldLabel>
                                        <span className="text-[10px] text-amber-600 font-bold">Styling Col #{selectedColIndex + 1}</span>
                                    </div>

                                    {/* Column Selector Tabs */}
                                    <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-0.5 gap-0.5">
                                        {[...Array(colsCount)].map((_, cIdx) => (
                                            <button
                                                key={cIdx}
                                                type="button"
                                                onClick={() => setSelectedColIndex(cIdx)}
                                                className={`flex-1 py-1 text-[11px] font-bold rounded-md transition text-center cursor-pointer ${
                                                    selectedColIndex === cIdx
                                                        ? 'bg-white dark:bg-neutral-700 text-amber-600 dark:text-amber-400 shadow-xs'
                                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                                                }`}
                                            >
                                                Col #{cIdx + 1}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Selected Column Styles */}
                                    <div className="space-y-2.5 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10">
                                        <div className="space-y-0.5">
                                            <FieldLabel>Vertical Content Distribution</FieldLabel>
                                            <IconButtonGroup
                                                value={activeColStyle.verticalAlign || 'flex-start'}
                                                onChange={v => updateColumnStyle(selectedColIndex, 'verticalAlign', v)}
                                                cols={4}
                                                options={[
                                                    { key: 'flex-start',    icon: '⊤', title: 'Top (Start)' },
                                                    { key: 'center',        icon: '┼', title: 'Center' },
                                                    { key: 'flex-end',      icon: '⊥', title: 'Bottom (End)' },
                                                    { key: 'space-between', icon: '↕', title: 'Space Between' },
                                                ]}
                                            />
                                            <p className="text-[10px] text-neutral-500 italic mt-0.5">
                                                {activeColStyle.verticalAlign === 'space-between'
                                                    ? 'Pushes elements apart, keeping buttons/footers at the very bottom.'
                                                    : activeColStyle.verticalAlign === 'center'
                                                    ? 'Centers elements vertically inside this column.'
                                                    : 'Standard top-aligned content.'}
                                            </p>
                                        </div>

                                        {/* Horizontal content alignment inside this column */}
                                        <div className="space-y-0.5">
                                            <FieldLabel>Horizontal Content Alignment</FieldLabel>
                                            <IconButtonGroup
                                                value={activeColStyle.horizontalAlign || 'stretch'}
                                                onChange={v => updateColumnStyle(selectedColIndex, 'horizontalAlign', v)}
                                                cols={4}
                                                options={[
                                                    { key: 'stretch',    icon: '⧉', title: 'Stretch (Full Width)' },
                                                    { key: 'flex-start', icon: '╞', title: 'Left' },
                                                    { key: 'center',     icon: '┼', title: 'Center' },
                                                    { key: 'flex-end',   icon: '╡', title: 'Right' },
                                                ]}
                                            />
                                            <p className="text-[10px] text-neutral-500 italic mt-0.5">
                                                {activeColStyle.horizontalAlign === 'center'
                                                    ? 'Centers all elements horizontally inside this column.'
                                                    : activeColStyle.horizontalAlign === 'flex-start'
                                                    ? 'Aligns elements to the left edge of this column.'
                                                    : activeColStyle.horizontalAlign === 'flex-end'
                                                    ? 'Aligns elements to the right edge of this column.'
                                                    : 'Elements stretch to fill the column width.'}
                                            </p>
                                        </div>

                                        {/* Column Item Gap */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <FieldLabel>Element Gap (px)</FieldLabel>
                                                <span className="font-mono text-xs font-bold text-amber-600">{activeColStyle.gap ?? 16}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="64"
                                                step="2"
                                                value={activeColStyle.gap ?? 16}
                                                onChange={e => updateColumnStyle(selectedColIndex, 'gap', Number(e.target.value))}
                                                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full"
                                            />
                                        </div>

                                        {/* Column Background */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <FieldLabel>Column Background</FieldLabel>
                                                {activeColStyle.bgColor && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateColumnStyle(selectedColIndex, 'bgColor', '')}
                                                        className="text-[10px] text-red-500 hover:underline cursor-pointer"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                            <ColorPickerInput
                                                value={activeColStyle.bgColor || ''}
                                                onChange={c => updateColumnStyle(selectedColIndex, 'bgColor', c)}
                                                styleGuide={styleGuide}
                                            />
                                        </div>

                                        {/* Column Padding & Radius */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-0.5">
                                                <FieldLabel>Padding (px)</FieldLabel>
                                                <PanelNumber
                                                    min="0"
                                                    max="80"
                                                    value={activeColStyle.padding ?? 0}
                                                    onChange={e => updateColumnStyle(selectedColIndex, 'padding', Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <FieldLabel>Corner Radius (px)</FieldLabel>
                                                <PanelNumber
                                                    min="0"
                                                    max="48"
                                                    value={activeColStyle.borderRadius ?? 0}
                                                    onChange={e => updateColumnStyle(selectedColIndex, 'borderRadius', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        {/* Border styling */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-0.5">
                                                <FieldLabel>Border Width (px)</FieldLabel>
                                                <PanelNumber
                                                    min="0"
                                                    max="12"
                                                    value={activeColStyle.borderWidth ?? 0}
                                                    onChange={e => updateColumnStyle(selectedColIndex, 'borderWidth', Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <FieldLabel>Border Color</FieldLabel>
                                                <input
                                                    type="color"
                                                    value={activeColStyle.borderColor || '#e5e7eb'}
                                                    onChange={e => updateColumnStyle(selectedColIndex, 'borderColor', e.target.value)}
                                                    className="w-full h-7 rounded border border-neutral-200 cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        {/* Box Shadow Preset */}
                                        <div className="space-y-0.5">
                                            <FieldLabel>Card Shadow</FieldLabel>
                                            <PanelSelect
                                                value={activeColStyle.shadow || 'none'}
                                                onChange={e => updateColumnStyle(selectedColIndex, 'shadow', e.target.value)}
                                            >
                                                <option value="none">None</option>
                                                <option value="sm">Subtle (Small)</option>
                                                <option value="md">Card (Medium)</option>
                                                <option value="lg">Elevated (Large)</option>
                                                <option value="brand">Brand Glow</option>
                                            </PanelSelect>
                                        </div>

                                        {/* Featured Ribbon Badge */}
                                        <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <FieldLabel>Featured Badge Ribbon</FieldLabel>
                                                    <p className="text-[10px] text-neutral-500">e.g. "Most Popular" or "Best Value"</p>
                                                </div>
                                                <PanelToggle
                                                    value={!!activeColStyle.hasBadge}
                                                    onChange={v => updateColumnStyle(selectedColIndex, 'hasBadge', v)}
                                                />
                                            </div>

                                            {activeColStyle.hasBadge && (
                                                <div className="space-y-2 p-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
                                                    <div className="space-y-0.5">
                                                        <FieldLabel>Badge Text</FieldLabel>
                                                        <PanelInput
                                                            type="text"
                                                            value={activeColStyle.badgeText || 'MOST POPULAR'}
                                                            onChange={e => updateColumnStyle(selectedColIndex, 'badgeText', e.target.value)}
                                                            placeholder="MOST POPULAR"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-0.5">
                                                            <FieldLabel>Badge Color</FieldLabel>
                                                            <input
                                                                type="color"
                                                                value={activeColStyle.badgeBgColor || '#4f46e5'}
                                                                onChange={e => updateColumnStyle(selectedColIndex, 'badgeBgColor', e.target.value)}
                                                                className="w-full h-7 rounded border border-neutral-200 cursor-pointer"
                                                            />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <FieldLabel>Text Color</FieldLabel>
                                                            <input
                                                                type="color"
                                                                value={activeColStyle.badgeTextColor || '#ffffff'}
                                                                onChange={e => updateColumnStyle(selectedColIndex, 'badgeTextColor', e.target.value)}
                                                                className="w-full h-7 rounded border border-neutral-200 cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Whole Column Click Target */}
                                        <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
                                            <FieldLabel>Column Link URL (Clickable Card)</FieldLabel>
                                            <PanelInput
                                                type="text"
                                                value={activeColStyle.linkUrl || ''}
                                                onChange={e => updateColumnStyle(selectedColIndex, 'linkUrl', e.target.value)}
                                                placeholder="https://... or #checkout"
                                            />
                                            {activeColStyle.linkUrl && (
                                                <label className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!activeColStyle.linkTargetBlank}
                                                        onChange={e => updateColumnStyle(selectedColIndex, 'linkTargetBlank', e.target.checked)}
                                                        className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500 h-3 w-3"
                                                    />
                                                    <span>Open in new tab</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Private sub-components ── */

function SliderWithInput({ label, unitKey, unitDefault, unitOptions, valueKey, valueDefault, max, step = 1, hint, val, update }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <FieldLabel>{label}</FieldLabel>
                <div className="w-16">
                    <Select
                        size="sm"
                        value={val(unitKey, unitDefault)}
                        onChange={e => update(unitKey, e.target.value)}
                    >
                        {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input type="range" min="0" max={max} step={step} value={val(valueKey, valueDefault)}
                    onChange={e => update(valueKey, parseFloat(e.target.value))}
                    className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-full" />
                <PanelNumber value={val(valueKey, valueDefault)} step={step}
                    onChange={e => update(valueKey, parseFloat(e.target.value) || 0)}
                    className="w-16" />
            </div>
            {hint && <p className="text-[10px] italic text-neutral-400">{hint}</p>}
        </div>
    );
}

function GridSlider({ label, valueKey, unitKey, unitDefault, unitOptions, defaultCount, onChange, val, update }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <FieldLabel>{label}</FieldLabel>
                <div className="w-20">
                    <Select
                        size="sm"
                        value={val(unitKey, unitDefault)}
                        onChange={e => update(unitKey, e.target.value)}
                    >
                        {unitOptions.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input type="range" min="1" max="12" value={val(valueKey, defaultCount)}
                    onChange={e => onChange(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                    className="flex-1 accent-brand-600 cursor-pointer h-1.5 bg-neutral-200 rounded-full" />
                <PanelNumber min="1" max="12" value={val(valueKey, defaultCount)}
                    onChange={e => onChange(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                    className="w-16" />
            </div>
        </div>
    );
}
