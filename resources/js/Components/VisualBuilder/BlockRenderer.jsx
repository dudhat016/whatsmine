import { useTranslation } from 'react-i18next';
import { Image as ImageIcon } from 'lucide-react';
import InlineText from './InlineText';

export default function BlockRenderer({
    block,
    onChange,
    isSelected,
    mode = 'email',
    onOpenSettings,
}) {
    const { t } = useTranslation();

    function update(key, value) {
        onChange({ ...block, [key]: value });
    }

    switch (block.type) {
        case 'heading': {
            const levelNum = typeof block.level === 'string' ? parseInt(block.level.replace(/\D/g, '') || '2', 10) : (block.level || 2);
            const Tag = `h${levelNum}`;
            const alignCls = block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left';
            const sizeCls = levelNum === 1 ? 'text-3xl font-extrabold' : levelNum === 3 ? 'text-xl font-semibold' : 'text-2xl font-bold';

            return (
                <InlineText
                    as={Tag}
                    html={block.text || block.content}
                    onChange={(text) => update('text', text)}
                    placeholder={t('common.heading_placeholder', 'Heading...')}
                    className={`${sizeCls} ${alignCls} text-neutral-900 dark:text-neutral-100 transition-colors`}
                    style={{ color: block.color || undefined }}
                />
            );
        }

        case 'paragraph': {
            const alignCls = block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left';
            return (
                <InlineText
                    as="p"
                    html={block.text || block.content}
                    onChange={(text) => update('text', text)}
                    placeholder={t('common.text_placeholder', 'Type something...')}
                    className={`text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed ${alignCls}`}
                    style={{ color: block.color || undefined }}
                />
            );
        }

        case 'button': {
            const alignCls = block.align === 'center' ? 'justify-center' : block.align === 'right' ? 'justify-end' : 'justify-start';
            return (
                <div className={`flex ${alignCls} my-2`}>
                    <InlineText
                        as="span"
                        singleLine
                        html={block.text}
                        onChange={(text) => update('text', text)}
                        placeholder={t('common.button_placeholder', 'Button text...')}
                        className="inline-block px-6 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all focus:outline-none"
                        style={{
                            backgroundColor: block.color || '#2563eb',
                            color: block.textColor || '#ffffff',
                            borderRadius: `${block.borderRadius ?? 8}px`,
                        }}
                    />
                </div>
            );
        }

        case 'image': {
            const alignCls = block.align === 'center' ? 'mx-auto' : block.align === 'right' ? 'ml-auto' : '';
            return (
                <div className="my-2 text-center">
                    {block.src ? (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenSettings?.();
                            }}
                            className="cursor-pointer inline-block group/imgpreview"
                        >
                            <img
                                src={block.src}
                                alt={block.alt || ''}
                                className={`rounded-lg max-w-full h-auto ${alignCls} border border-neutral-200 dark:border-neutral-800 transition-transform group-hover/imgpreview:scale-[1.01]`}
                                style={{ width: block.width || '100%', borderRadius: `${block.borderRadius ?? 8}px` }}
                            />
                        </div>
                    ) : (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenSettings?.();
                            }}
                            className="group/imgdrop relative flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-600 dark:hover:border-emerald-500 group-hover/block:border-emerald-600 bg-transparent transition-all cursor-pointer select-none"
                        >
                            <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium text-sm transition-colors">
                                <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{t('common.click_to_add_image', 'Click to add an image')}</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        case 'divider':
            return (
                <hr
                    className="my-3 border-neutral-200 dark:border-neutral-700"
                    style={{ borderColor: block.color, borderTopWidth: `${block.thickness || 1}px` }}
                />
            );

        case 'spacer':
            return (
                <div
                    className="flex items-center justify-center bg-neutral-100/50 dark:bg-neutral-800/30 border border-dashed border-neutral-200 dark:border-neutral-700/50 rounded text-[10px] text-neutral-400 font-mono select-none"
                    style={{ height: `${block.height || 24}px` }}
                >
                    {block.height || 24}px
                </div>
            );

        // ── Form Specific Blocks ─────────────────────────────────────────────
        case 'form_text':
        case 'form_email':
        case 'form_phone':
            return (
                <div className="space-y-1.5 my-2">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        {block.label} {block.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type={block.type === 'form_email' ? 'email' : block.type === 'form_phone' ? 'tel' : 'text'}
                        placeholder={block.placeholder}
                        disabled
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm cursor-not-allowed opacity-80"
                    />
                    {block.helpText && <p className="text-[11px] text-neutral-400">{block.helpText}</p>}
                </div>
            );

        case 'form_otp':
            return (
                <div className="space-y-1.5 my-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        {block.label} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        {Array.from({ length: block.length || 6 }).map((_, i) => (
                            <div key={i} className="h-10 w-10 flex-1 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 flex items-center justify-center font-mono text-sm text-neutral-400">
                                •
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'form_dropdown':
            return (
                <div className="space-y-1.5 my-2">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        {block.label} {block.required && <span className="text-red-500">*</span>}
                    </label>
                    <select disabled className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm cursor-not-allowed opacity-80">
                        <option>{t('common.select_option', 'Select an option...')}</option>
                        {(block.options || []).map((opt, i) => (
                            <option key={i}>{opt}</option>
                        ))}
                    </select>
                </div>
            );

        case 'form_checkbox':
            return (
                <div className="flex items-center gap-2.5 my-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/30">
                    <input type="checkbox" disabled className="rounded border-neutral-300 dark:border-neutral-600 text-brand-600 cursor-not-allowed" />
                    <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                        {block.label} {block.required && <span className="text-red-500">*</span>}
                    </span>
                </div>
            );

        case 'form_submit':
            return (
                <div className="my-3">
                    <button
                        type="button"
                        className="w-full py-2.5 px-4 font-semibold text-white rounded-lg shadow-sm text-sm transition-all"
                        style={{
                            backgroundColor: block.color || '#2563eb',
                            color: block.textColor || '#ffffff',
                            borderRadius: `${block.borderRadius ?? 8}px`,
                        }}
                    >
                        {block.text || t('common.submit', 'Submit')}
                    </button>
                </div>
            );

        // ── Funnel Specific Blocks ───────────────────────────────────────────
        case 'order_bump':
            return (
                <div className="my-4 p-4 rounded-xl border-2 border-dashed border-brand-500 bg-brand-50/50 dark:bg-brand-950/20">
                    <div className="flex items-start gap-3">
                        <input type="checkbox" disabled className="mt-1 rounded border-neutral-300 text-brand-600" />
                        <div>
                            <span className="text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wide">{block.title}</span>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">{block.headline}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{block.description}</p>
                        </div>
                    </div>
                </div>
            );

        case 'pricing_card':
            return (
                <div className="my-4 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm text-center max-w-sm mx-auto">
                    <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{block.title}</h4>
                    <div className="my-3">
                        <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">{block.price}</span>
                        <span className="text-xs text-neutral-500">{block.period}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                        {(block.features || []).map((f, i) => (
                            <li key={i}>✓ {f}</li>
                        ))}
                    </ul>
                    <div className="py-2 px-4 bg-brand-600 text-white rounded-lg text-xs font-semibold">{block.buttonText}</div>
                </div>
            );

        default:
            return (
                <div className="p-3 text-xs text-neutral-400 border border-dashed rounded">
                    Unknown block type: {block.type}
                </div>
            );
    }
}
