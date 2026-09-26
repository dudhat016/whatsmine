import { uid } from '../types';

export function blocksToEmailHtml(blocks) {
    return blocks
        .map((b) => {
            switch (b.type) {
                case 'heading': {
                    const tag = `h${b.level || 2}`;
                    const style = `margin:0 0 12px;font-family:sans-serif;color:${b.color || '#111'};text-align:${b.align || 'left'};`;
                    return `<${tag} style="${style}">${b.text || ''}</${tag}>`;
                }
                case 'paragraph': {
                    const style = `margin:0 0 12px;font-family:sans-serif;font-size:15px;line-height:1.6;color:#333;text-align:${b.align || 'left'};`;
                    return `<p style="${style}">${b.text || ''}</p>`;
                }
                case 'button': {
                    const btnStyle = `display:inline-block;padding:${b.paddingY || 12}px ${b.paddingX || 24}px;background:${b.color || '#2563eb'};color:${b.textColor || '#fff'};text-decoration:none;border-radius:${b.borderRadius ?? 6}px;font-family:sans-serif;font-size:15px;font-weight:600;`;
                    return `<div style="text-align:${b.align || 'center'};margin:16px 0;"><a href="${b.url || '#'}" style="${btnStyle}">${b.text || 'Click Here'}</a></div>`;
                }
                case 'image': {
                    const imgStyle = `display:block;max-width:100%;height:auto;border-radius:${b.borderRadius ?? 6}px;margin:${b.align === 'center' ? '0 auto' : b.align === 'right' ? '0 0 0 auto' : '0'};`;
                    const w = b.width ? ` width="${b.width}"` : '';
                    const img = `<img src="${b.src || ''}" alt="${b.alt || ''}" style="${imgStyle}"${w}/>`;
                    if (b.url) {
                        return `<div style="text-align:${b.align || 'center'};margin:12px 0;"><a href="${b.url}">${img}</a></div>`;
                    }
                    return `<div style="text-align:${b.align || 'center'};margin:12px 0;">${img}</div>`;
                }
                case 'divider':
                    return `<hr style="border:none;border-top:${b.thickness || 1}px solid ${b.color || '#e5e7eb'};margin:${b.marginY || 16}px 0;"/>`;
                case 'spacer':
                    return `<div style="height:${b.height || 24}px;line-height:${b.height || 24}px;font-size:1px;">&nbsp;</div>`;
                default:
                    return '';
            }
        })
        .join('\n');
}

export function emailHtmlToBlocks(html) {
    if (!html || !html.trim()) {
        return [
            { id: uid(), type: 'heading', level: 2, text: 'Hello, {{contact.first_name}}', align: 'left', color: '#111' },
            { id: uid(), type: 'paragraph', text: 'Thank you for reaching out to us.', align: 'left' },
        ];
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const nodes = Array.from(doc.body.children);
        if (nodes.length === 0 && doc.body.innerHTML.trim()) {
            return [{ id: uid(), type: 'paragraph', text: doc.body.innerHTML, align: 'left' }];
        }

        const blocks = [];
        for (const el of nodes) {
            const tag = el.tagName.toLowerCase();
            if (/^h[1-6]$/.test(tag)) {
                blocks.push({
                    id: uid(),
                    type: 'heading',
                    level: parseInt(tag[1], 10),
                    text: el.innerHTML,
                    align: el.style.textAlign || 'left',
                    color: el.style.color || '#111',
                });
            } else if (tag === 'p') {
                blocks.push({
                    id: uid(),
                    type: 'paragraph',
                    text: el.innerHTML,
                    align: el.style.textAlign || 'left',
                });
            } else if (tag === 'hr') {
                blocks.push({
                    id: uid(),
                    type: 'divider',
                    color: el.style.borderTopColor || '#e5e7eb',
                });
            } else if (tag === 'div') {
                const a = el.querySelector('a');
                const img = el.querySelector('img');
                if (img) {
                    blocks.push({
                        id: uid(),
                        type: 'image',
                        src: img.getAttribute('src') || '',
                        alt: img.getAttribute('alt') || '',
                        align: el.style.textAlign || 'center',
                        width: img.getAttribute('width') || '',
                        url: a ? a.getAttribute('href') : '',
                    });
                } else if (a) {
                    blocks.push({
                        id: uid(),
                        type: 'button',
                        text: a.innerHTML,
                        url: a.getAttribute('href') || '#',
                        align: el.style.textAlign || 'center',
                        color: a.style.backgroundColor || '#2563eb',
                        textColor: a.style.color || '#ffffff',
                    });
                } else if (el.style.height) {
                    blocks.push({
                        id: uid(),
                        type: 'spacer',
                        height: parseInt(el.style.height, 10) || 24,
                    });
                } else {
                    blocks.push({
                        id: uid(),
                        type: 'paragraph',
                        text: el.innerHTML,
                        align: el.style.textAlign || 'left',
                    });
                }
            } else {
                blocks.push({
                    id: uid(),
                    type: 'paragraph',
                    text: el.outerHTML,
                    align: 'left',
                });
            }
        }
        return blocks.length > 0 ? blocks : [{ id: uid(), type: 'paragraph', text: html, align: 'left' }];
    } catch {
        return [{ id: uid(), type: 'paragraph', text: html, align: 'left' }];
    }
}
