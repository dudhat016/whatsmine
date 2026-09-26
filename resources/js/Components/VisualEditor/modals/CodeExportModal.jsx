import React, { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import { renderSectionsHtml } from '../utils/htmlCompiler';

export default function CodeExportModal({
    showCodeModal,
    setShowCodeModal,
    sections,
    styleGuide,
    funnelName,
}) {
    const [copied, setCopied] = useState(false);

    if (!showCodeModal) return null;

    const htmlCode = renderSectionsHtml(sections, styleGuide, {}, {}, funnelName);

    const handleCopy = () => {
        navigator.clipboard.writeText(htmlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl border border-neutral-100 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                            <Code className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-neutral-900">Export Page HTML & CSS</h3>
                            <p className="text-xs text-neutral-500">Standalone production HTML bundle with embedded brand tokens</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied HTML!' : 'Copy Code'}
                    </button>
                </div>

                <div className="mt-4 flex-1 overflow-auto bg-neutral-900 rounded-xl p-4 font-mono text-xs text-neutral-200 leading-relaxed border border-neutral-800">
                    <pre className="whitespace-pre-wrap break-all">{htmlCode}</pre>
                </div>

                <div className="flex items-center justify-end pt-4 shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowCodeModal(false)}
                        className="px-4 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
