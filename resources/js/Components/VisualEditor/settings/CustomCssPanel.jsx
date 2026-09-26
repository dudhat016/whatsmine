import React from 'react';
import { SectionTitle, FieldLabel, PanelTextarea } from '../BuilderUI';
import { Code2, Sparkles } from 'lucide-react';

export default function CustomCssPanel({ element, val, handleUpdateElementSetting }) {
    const update = (key, value) => handleUpdateElementSetting(element.id, key, value);
    const elementId = `el-${element.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

    const insertSnippet = (snippet) => {
        const current = val('customCss', '');
        const next = current ? `${current}\n${snippet}` : snippet;
        update('customCss', next);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <SectionTitle>Custom Scoped CSS</SectionTitle>
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                    #{elementId}
                </span>
            </div>

            <p className="text-[11px] text-neutral-500 leading-relaxed">
                Write custom CSS rules. Use <code className="text-brand-600 bg-brand-50 px-1 py-0.5 rounded font-mono font-bold">selector</code> to target this element automatically.
            </p>

            {/* Quick CSS Snippets */}
            <div className="space-y-1 bg-neutral-50 p-2 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>Quick CSS Snippets</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                    <button
                        type="button"
                        onClick={() => insertSnippet('selector {\n  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.15));\n}')}
                        className="p-1 text-left rounded text-[10px] font-mono bg-white border border-neutral-200 hover:border-brand-500 hover:text-brand-600 truncate transition"
                    >
                        + Drop Shadow
                    </button>
                    <button
                        type="button"
                        onClick={() => insertSnippet('selector {\n  background-clip: text;\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}')}
                        className="p-1 text-left rounded text-[10px] font-mono bg-white border border-neutral-200 hover:border-brand-500 hover:text-brand-600 truncate transition"
                    >
                        + Gradient Text
                    </button>
                    <button
                        type="button"
                        onClick={() => insertSnippet('selector:hover {\n  filter: brightness(1.15);\n}')}
                        className="p-1 text-left rounded text-[10px] font-mono bg-white border border-neutral-200 hover:border-brand-500 hover:text-brand-600 truncate transition"
                    >
                        + Hover Brightness
                    </button>
                    <button
                        type="button"
                        onClick={() => insertSnippet('selector {\n  pointer-events: none;\n  user-select: none;\n}')}
                        className="p-1 text-left rounded text-[10px] font-mono bg-white border border-neutral-200 hover:border-brand-500 hover:text-brand-600 truncate transition"
                    >
                        + Disable Select
                    </button>
                </div>
            </div>

            {/* CSS Textarea */}
            <div className="space-y-1">
                <FieldLabel>CSS Rules</FieldLabel>
                <PanelTextarea
                    rows={6}
                    value={val('customCss', '')}
                    onChange={e => update('customCss', e.target.value)}
                    placeholder={'selector {\n  /* Your custom CSS here */\n}'}
                    className="font-mono text-xs leading-relaxed"
                />
            </div>
        </div>
    );
}
