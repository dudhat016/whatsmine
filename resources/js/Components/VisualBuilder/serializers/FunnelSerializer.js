import { uid } from '../types';

export function blocksToFunnelHtml(blocks, brandConfig = {}) {
    return blocks
        .map((b) => {
            switch (b.type) {
                case 'heading': {
                    const tag = `h${b.level || 2}`;
                    const alignCls = b.align === 'center' ? 'text-center' : b.align === 'right' ? 'text-right' : 'text-left';
                    return `<${tag} class="font-bold tracking-tight text-neutral-900 dark:text-neutral-100 ${alignCls} mb-4">${b.text || ''}</${tag}>`;
                }
                case 'paragraph': {
                    const alignCls = b.align === 'center' ? 'text-center' : b.align === 'right' ? 'text-right' : 'text-left';
                    return `<p class="text-neutral-600 dark:text-neutral-300 leading-relaxed ${alignCls} mb-4">${b.text || ''}</p>`;
                }
                case 'button': {
                    const alignCls = b.align === 'center' ? 'justify-center' : b.align === 'right' ? 'justify-end' : 'justify-start';
                    return `<div class="flex ${alignCls} my-6"><a href="${b.url || '#'}" class="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500">${b.text || 'Get Started'}</a></div>`;
                }
                case 'image': {
                    const alignCls = b.align === 'center' ? 'mx-auto' : b.align === 'right' ? 'ml-auto' : '';
                    return `<div class="my-6"><img src="${b.src || ''}" alt="${b.alt || ''}" class="rounded-lg max-w-full h-auto ${alignCls} shadow-sm" loading="lazy" /></div>`;
                }
                case 'video':
                    return `<div class="my-6 aspect-video rounded-xl overflow-hidden shadow-lg"><iframe src="${b.url}" class="w-full h-full border-0" allowfullscreen></iframe></div>`;
                case 'pricing_card':
                    return `<div class="my-8 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm max-w-sm mx-auto text-center"><h3 class="text-xl font-bold">${b.title}</h3><div class="my-4"><span class="text-4xl font-extrabold">${b.price}</span><span class="text-neutral-500">${b.period}</span></div><ul class="space-y-2 text-sm text-neutral-600 dark:text-neutral-400 mb-6">${(b.features || []).map(f => `<li>✓ ${f}</li>`).join('')}</ul><a href="${b.buttonUrl || '#'}" class="block w-full py-3 font-semibold text-white bg-brand-600 rounded-lg">${b.buttonText}</a></div>`;
                case 'order_bump':
                    return `<div class="my-6 p-4 rounded-xl border-2 border-dashed border-brand-500 bg-brand-50/50 dark:bg-brand-950/20"><label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" class="mt-1 rounded text-brand-600 border-neutral-300"><div><span class="font-bold text-brand-700 dark:text-brand-300">${b.headline}</span><p class="text-xs text-neutral-600 dark:text-neutral-400 mt-1">${b.description}</p></div></label></div>`;
                case 'faq_accordion':
                    return `<div class="my-8 space-y-3 max-w-2xl mx-auto">${(b.items || []).map(item => `<details class="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"><summary class="font-semibold cursor-pointer">${item.q}</summary><p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">${item.a}</p></details>`).join('')}</div>`;
                case 'divider':
                    return `<hr class="my-6 border-neutral-200 dark:border-neutral-800" />`;
                case 'spacer':
                    return `<div style="height:${b.height || 24}px;"></div>`;
                default:
                    return '';
            }
        })
        .join('\n');
}
