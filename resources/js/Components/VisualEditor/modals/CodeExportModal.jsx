import React, { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import { Modal, Button } from '@/Components/ui';
import { renderSectionsHtml } from '../utils/htmlCompiler';

export default function CodeExportModal({
    showCodeModal,
    setShowCodeModal,
    sections,
    styleGuide,
    funnelName,
}) {
    const [copied, setCopied] = useState(false);

    const htmlCode = renderSectionsHtml(sections, styleGuide, {}, {}, funnelName);

    const handleCopy = () => {
        navigator.clipboard.writeText(htmlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal
            show={!!showCodeModal}
            onClose={() => setShowCodeModal(false)}
            title="Export Page HTML & CSS"
            description="Standalone production HTML bundle with embedded brand tokens"
            maxWidth="3xl"
        >
            <div className="space-y-4">
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleCopy}
                        icon={copied ? Check : Copy}
                    >
                        {copied ? 'Copied HTML!' : 'Copy Code'}
                    </Button>
                </div>

                <div className="max-h-[55vh] overflow-auto bg-neutral-900 rounded-xl p-4 font-mono text-xs text-neutral-200 leading-relaxed border border-neutral-800">
                    <pre className="whitespace-pre-wrap break-all">{htmlCode}</pre>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowCodeModal(false)}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
