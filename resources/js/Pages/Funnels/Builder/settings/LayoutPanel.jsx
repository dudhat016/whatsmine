import React from 'react';
import { PanelSelect, PanelToggle, PanelNumber, SectionTitle, FieldLabel, IconButtonGroup } from '../BuilderUI';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import GapControl from './GapControl';

const CONTAINER_TYPES = ['section', 'flex_container', 'grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'];

const defaultLayoutMode = (element) =>
    element.type === 'section' ? 'block'
    : (element.type === 'grid_container' || element.type.startsWith('col_')) ? 'grid'
    : 'flex';

export default function LayoutPanel({ element, val, viewport, handleUpdateElementSetting, handleResetElementCategory }) {
    if (!CONTAINER_TYPES.includes(element.type)) return null;

    const update      = (key, value) => handleUpdateElementSetting(element.id, key, value);
    const updateBatch = (patch)      => handleUpdateElementSetting(element.id, patch);
    const layoutMode  = val('layoutMode', defaultLayoutMode(element));

    const ViewportIcon = viewport === 'tablet' ? Tablet : viewport === 'mobile' ? Smartphone : Monitor;

    return (
        <div className="space-y-4 pt-3 border-t border-neutral-200">
            <SectionTitle
                onReset={() => handleResetElementCategory(element.id, 'flex_container')}
                resetTitle={`Reset Layout for ${viewport}`}
            >
                <span className="flex items-center gap-1.5">
                    Container Layout
                    <span className="text-[9px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <ViewportIcon className="h-2.5 w-2.5" />{viewport}
                    </span>
                </span>
            </SectionTitle>

            <div className="space-y-3">
                {/* Layout Mode & Content Width */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                        <FieldLabel>Layout</FieldLabel>
                        <PanelSelect value={layoutMode} onChange={e => update('layoutMode', e.target.value)}>
                            <option value="flex">Flexbox</option>
                            <option value="grid">Grid</option>
                            <option value="block">Block</option>
                        </PanelSelect>
                    </div>
                    <div className="space-y-0.5">
                        <FieldLabel>Content Width</FieldLabel>
                        <PanelSelect value={val('contentWidth', 'full')} onChange={e => update('contentWidth', e.target.value)}>
                            <option value="full">Full Width</option>
                            <option value="boxed">Boxed</option>
                        </PanelSelect>
                    </div>
                </div>

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
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-3">Items</p>

                {/* ── Flexbox controls ── */}
                {layoutMode === 'flex' && (
                    <div className="space-y-3">
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
                            defaultCount={element.colsCount || 2}
                            onChange={count => {
                                const cols = [...(element.columns || [])];
                                while (cols.length < count) cols.push([]);
                                updateBatch({ gridColumns: count, colsCount: count, columns: cols.slice(0, count) });
                            }}
                            val={val} update={update}
                        />

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
                    </div>
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
                <select
                    value={val(unitKey, unitDefault)}
                    onChange={e => update(unitKey, e.target.value)}
                    className="text-[10px] font-bold text-neutral-500 bg-transparent border-0 py-0 pr-1 focus:ring-0 cursor-pointer"
                >
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
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
                <select value={val(unitKey, unitDefault)} onChange={e => update(unitKey, e.target.value)}
                    className="text-[10px] font-bold text-neutral-500 bg-transparent border-0 py-0 pr-1 focus:ring-0 cursor-pointer">
                    {unitOptions.map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
                </select>
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
