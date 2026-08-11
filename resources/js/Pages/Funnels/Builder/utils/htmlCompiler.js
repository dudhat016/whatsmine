import { collectElementCss, buildBrandVars } from './cssCompiler';
import { sanitizeElementForBrandInheritance } from './treeUtils';

export const renderItemToHtmlScoped = (rawItem) => {
    if (!rawItem) return '';
    const item = sanitizeElementForBrandInheritance(rawItem);
    const id = `el-${item.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

    if (item.type === 'section') {
        const inner = (item.elements || []).map(child => renderItemToHtmlScoped(child)).join('\n');
        return `<section id="${id}">\n${inner}\n</section>`;
    }

    if (['col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type)) {
        const colsHtml = (item.columns || []).map((col, idx) => {
            const childrenHtml = (col || []).map(child => renderItemToHtmlScoped(child)).join('\n');
            return `<div class="funnel-col">\n${childrenHtml}\n</div>`;
        }).join('\n');
        return `<div id="${id}" class="funnel-row funnel-row-${item.type}">\n${colsHtml}\n</div>`;
    }

    if (item.type === 'flex_container') {
        const inner = (item.elements || []).map(child => renderItemToHtmlScoped(child)).join('\n');
        return `<div id="${id}" class="funnel-flex-container">\n${inner}\n</div>`;
    }

    if (item.type === 'grid_container') {
        const colsHtml = (item.columns || []).map((col, idx) => {
            const childrenHtml = (col || []).map(child => renderItemToHtmlScoped(child)).join('\n');
            return `<div class="funnel-col">\n${childrenHtml}\n</div>`;
        }).join('\n');
        return `<div id="${id}" class="funnel-row funnel-row-grid_container">\n${colsHtml}\n</div>`;
    }

    if (item.type === 'headline') {
        const tag = item.tag || 'h2';
        return `<${tag} id="${id}">${item.text || 'Headline Text'}</${tag}>`;
    }

    if (item.type === 'subheadline') {
        const tag = item.tag || 'h3';
        return `<${tag} id="${id}">${item.text || 'Subheadline Text'}</${tag}>`;
    }

    if (item.type === 'paragraph') {
        return `<p id="${id}">${item.text || 'Paragraph content goes here...'}</p>`;
    }

    if (item.type === 'bullets') {
        const itemsHtml = (item.items || ['Bullet point 1', 'Bullet point 2', 'Bullet point 3'])
            .map(b => `<li>${b}</li>`)
            .join('\n');
        return `<ul id="${id}" class="funnel-bullets">\n${itemsHtml}\n</ul>`;
    }

    if (item.type === 'quote') {
        return `<blockquote id="${id}" class="funnel-quote"><p>“${item.text || 'Quote snippet here'}”</p><cite>— ${item.author || 'Author'}</cite></blockquote>`;
    }

    if (item.type === 'image') {
        const maxW = item.maxWidth ? `${item.maxWidth}%` : '100%';
        return `<div id="${id}" class="funnel-image-wrap"><img src="${item.url || ''}" alt="${item.alt || ''}" style="max-width:${maxW};" /></div>`;
    }

    if (item.type === 'video') {
        return `<div id="${id}" class="funnel-video-wrap"><iframe src="${item.videoUrl || ''}" frameborder="0" allowfullscreen></iframe></div>`;
    }

    if (item.type === 'submit_button') {
        const iconMap = {
            arrow: '→', lock: '🔒', lightning: '⚡', cart: '🛒', download: '📥', star: '⭐', sparkles: '✨', check: '✓'
        };
        const iconChar = item.btnIcon && item.btnIcon !== 'none' ? (iconMap[item.btnIcon] || '') : '';
        const iconPos = item.btnIconPosition || 'right';
        const btnLabel = iconChar
            ? (iconPos === 'left' ? `${iconChar} ${item.text || 'Submit'}` : `${item.text || 'Submit'} ${iconChar}`)
            : (item.text || 'Submit →');

        const btnTypeAttr = item.btnType === 'url' ? `onclick="window.location.href='${item.targetUrl || '#'}'"` : 'type="button"';
        return `<div class="funnel-btn-wrap"><button id="${id}" ${btnTypeAttr}>${btnLabel}</button></div>`;
    }

    if (item.type === 'input_email') {
        return `<div class="funnel-input-wrap"><input type="email" id="${id}" placeholder="${item.placeholder || 'Enter your email...'}" /></div>`;
    }

    if (item.type === 'input_name') {
        return `<div class="funnel-input-wrap"><input type="text" id="${id}" placeholder="${item.placeholder || 'Enter your name...'}" /></div>`;
    }

    if (item.type === 'input_phone') {
        return `<div class="funnel-input-wrap"><input type="tel" id="${id}" placeholder="${item.placeholder || 'Enter phone...'}" /></div>`;
    }

    if (item.type === 'checkbox') {
        return `<div class="funnel-input-wrap"><label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="${id}" /> <span>${item.text || ''}</span></label></div>`;
    }

    if (item.type === 'divider')  return `<hr id="${id}" class="funnel-divider" />`;
    if (item.type === 'spacer')   return `<div id="${id}" class="funnel-spacer"></div>`;
    if (item.type === 'timer')    return `<div id="${id}" class="funnel-timer">02 : 15 : 00</div>`;

    return '';
};

export const renderSectionsHtml = (secList, styleObj, seoObj, codeObj, funnelName = 'Live Funnel Page') => {
    const cssRules    = [];
    const tabletRules = [];
    const mobileRules = [];

    const bgColor = styleObj?.bgColor || '#ffffff';

    cssRules.push(`:root { ${buildBrandVars(styleObj)} }`);
    cssRules.push(`*, *::before, *::after { box-sizing: border-box; }`);
    cssRules.push(`body { margin:0; padding:0; font-family:var(--brand-body-font-family); background-color:${bgColor}; color:var(--brand-body-color); font-size:var(--brand-body-font-size); line-height:var(--brand-body-line-height); min-height:100vh; }`);
    cssRules.push(`h1 { margin:var(--brand-h1-margin-top) var(--brand-h1-margin-right) var(--brand-h1-margin-bottom) var(--brand-h1-margin-left); padding:var(--brand-h1-padding-top) var(--brand-h1-padding-right) var(--brand-h1-padding-bottom) var(--brand-h1-padding-left); font-family:var(--brand-h1-font-family); font-size:var(--brand-h1-font-size); font-weight:var(--brand-h1-font-weight); line-height:var(--brand-h1-line-height); color:var(--brand-h1-color); text-transform:var(--brand-h1-text-transform); font-style:var(--brand-h1-font-style); text-decoration:var(--brand-h1-text-decoration); }`);
    cssRules.push(`h2 { margin:var(--brand-h2-margin-top) var(--brand-h2-margin-right) var(--brand-h2-margin-bottom) var(--brand-h2-margin-left); padding:var(--brand-h2-padding-top) var(--brand-h2-padding-right) var(--brand-h2-padding-bottom) var(--brand-h2-padding-left); font-family:var(--brand-h2-font-family); font-size:var(--brand-h2-font-size); font-weight:var(--brand-h2-font-weight); line-height:var(--brand-h2-line-height); color:var(--brand-h2-color); text-transform:var(--brand-h2-text-transform); font-style:var(--brand-h2-font-style); text-decoration:var(--brand-h2-text-decoration); }`);
    cssRules.push(`h3 { margin:var(--brand-h3-margin-top) var(--brand-h3-margin-right) var(--brand-h3-margin-bottom) var(--brand-h3-margin-left); padding:var(--brand-h3-padding-top) var(--brand-h3-padding-right) var(--brand-h3-padding-bottom) var(--brand-h3-padding-left); font-family:var(--brand-h3-font-family); font-size:var(--brand-h3-font-size); font-weight:var(--brand-h3-font-weight); line-height:var(--brand-h3-line-height); color:var(--brand-h3-color); text-transform:var(--brand-h3-text-transform); font-style:var(--brand-h3-font-style); text-decoration:var(--brand-h3-text-decoration); }`);
    cssRules.push(`h4 { margin:var(--brand-h4-margin-top) var(--brand-h4-margin-right) var(--brand-h4-margin-bottom) var(--brand-h4-margin-left); padding:var(--brand-h4-padding-top) var(--brand-h4-padding-right) var(--brand-h4-padding-bottom) var(--brand-h4-padding-left); font-family:var(--brand-h4-font-family); font-size:var(--brand-h4-font-size); font-weight:var(--brand-h4-font-weight); line-height:var(--brand-h4-line-height); color:var(--brand-h4-color); text-transform:var(--brand-h4-text-transform); font-style:var(--brand-h4-font-style); text-decoration:var(--brand-h4-text-decoration); }`);
    cssRules.push(`h5 { margin:var(--brand-h5-margin-top) var(--brand-h5-margin-right) var(--brand-h5-margin-bottom) var(--brand-h5-margin-left); padding:var(--brand-h5-padding-top) var(--brand-h5-padding-right) var(--brand-h5-padding-bottom) var(--brand-h5-padding-left); font-family:var(--brand-h5-font-family); font-size:var(--brand-h5-font-size); font-weight:var(--brand-h5-font-weight); line-height:var(--brand-h5-line-height); color:var(--brand-h5-color); text-transform:var(--brand-h5-text-transform); font-style:var(--brand-h5-font-style); text-decoration:var(--brand-h5-text-decoration); }`);
    cssRules.push(`h6 { margin:var(--brand-h6-margin-top) var(--brand-h6-margin-right) var(--brand-h6-margin-bottom) var(--brand-h6-margin-left); padding:var(--brand-h6-padding-top) var(--brand-h6-padding-right) var(--brand-h6-padding-bottom) var(--brand-h6-padding-left); font-family:var(--brand-h6-font-family); font-size:var(--brand-h6-font-size); font-weight:var(--brand-h6-font-weight); line-height:var(--brand-h6-line-height); color:var(--brand-h6-color); text-transform:var(--brand-h6-text-transform); font-style:var(--brand-h6-font-style); text-decoration:var(--brand-h6-text-decoration); }`);
    cssRules.push(`p { margin:var(--brand-body-margin-top) var(--brand-body-margin-right) var(--brand-body-margin-bottom) var(--brand-body-margin-left); padding:var(--brand-body-padding-top) var(--brand-body-padding-right) var(--brand-body-padding-bottom) var(--brand-body-padding-left); font-family:var(--brand-body-font-family); font-size:var(--brand-body-font-size); font-weight:var(--brand-body-font-weight); line-height:var(--brand-body-line-height); color:var(--brand-body-color); }`);
    cssRules.push(`.funnel-container { width:100%; margin:0 auto; padding:0; }`);
    cssRules.push(`section { width:100%; max-width:var(--brand-container-width); padding-top:var(--brand-container-padding-top); padding-right:var(--brand-container-padding-right); padding-bottom:var(--brand-container-padding-bottom); padding-left:var(--brand-container-padding-left); margin-top:var(--brand-container-margin-top); margin-right:auto; margin-bottom:var(--brand-container-margin-bottom); margin-left:auto; }`);
    cssRules.push(`.funnel-row { display:grid; row-gap:var(--brand-element-gap-y); column-gap:var(--brand-element-gap-x); width:100%; }`);
    cssRules.push(`.funnel-flex-container { display:flex; gap:var(--brand-element-gap-y) var(--brand-element-gap-x); }`);
    cssRules.push(`.funnel-row-grid_container { grid-template-columns:repeat(2, minmax(0, 1fr)); }`);
    cssRules.push(`.funnel-row-col_1 { grid-template-columns:1fr; }`);
    cssRules.push(`.funnel-row-col_2 { grid-template-columns:repeat(2, minmax(0, 1fr)); }`);
    cssRules.push(`.funnel-row-col_3 { grid-template-columns:repeat(3, minmax(0, 1fr)); }`);
    cssRules.push(`.funnel-row-col_4 { grid-template-columns:repeat(4, minmax(0, 1fr)); }`);
    cssRules.push(`.funnel-row-col_sidebar { grid-template-columns:minmax(0, 7fr) minmax(0, 3fr); }`);
    cssRules.push(`.funnel-col { width:100%; min-width:0; padding:var(--brand-col-padding-top, 0) var(--brand-col-padding-right, 0) var(--brand-col-padding-bottom, 0) var(--brand-col-padding-left, 0); margin:var(--brand-col-margin-top, 0) var(--brand-col-margin-right, 0) var(--brand-col-margin-bottom, 0) var(--brand-col-margin-left, 0); }`);
    cssRules.push(`.funnel-bullets { list-style:none; padding:0; margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }`);
    cssRules.push(`.funnel-bullets li { margin-bottom:var(--brand-bullet-gap, 8px); display:flex; align-items:center; gap:var(--brand-bullet-gap, 8px); font-weight:var(--brand-body-font-weight, 500); color:var(--brand-body-color); }`);
    cssRules.push(`.funnel-bullets li::before { content:"✓"; color:var(--brand-bullet-icon-color, var(--color-primary, #16a34a)); font-weight:700; }`);
    cssRules.push(`.funnel-quote { padding:var(--brand-quote-padding-top, 16px) var(--brand-quote-padding-right, 20px) var(--brand-quote-padding-bottom, 16px) var(--brand-quote-padding-left, 20px); border-left:var(--brand-quote-border-width, 4px) solid var(--brand-quote-border-color, var(--color-primary, #6EC1E4)); background:var(--brand-quote-bg-color, rgba(99,102,241,0.06)); margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); border-radius:var(--brand-quote-border-radius, 0 8px 8px 0); }`);
    cssRules.push(`.funnel-quote p { font-style:var(--brand-quote-font-style, italic); font-weight:var(--brand-quote-font-weight, 400); margin:0 0 8px 0; color:var(--brand-quote-text-color, var(--brand-body-color)); }`);
    cssRules.push(`.funnel-quote cite { font-weight:var(--brand-quote-cite-weight, 700); font-style:var(--brand-quote-cite-style, normal); color:var(--brand-quote-border-color, var(--color-primary, #6EC1E4)); }`);
    cssRules.push(`.funnel-image-wrap { margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }`);
    cssRules.push(`.funnel-image-wrap img { display:block; width:100%; height:auto; border-radius:var(--brand-img-border-radius, 8px); box-shadow:var(--brand-img-shadow, 0 4px 12px rgba(0,0,0,0.1)); transition:transform 0.3s ease; }`);
    cssRules.push(`.funnel-image-wrap img:hover { transform:scale(1.02); }`);
    cssRules.push(`.funnel-video-wrap { position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:var(--brand-video-border-radius, 12px); box-shadow:var(--brand-video-shadow, 0 10px 25px rgba(0,0,0,0.2)); margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }`);
    cssRules.push(`.funnel-video-wrap iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:0; }`);
    cssRules.push(`.funnel-btn-wrap { margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-btn-wrap button { width:100%; margin:var(--brand-btn-margin-top, 0) var(--brand-btn-margin-right, 0) var(--brand-btn-margin-bottom, 16px) var(--brand-btn-margin-left, 0); padding:var(--brand-btn-padding-top, 14px) var(--brand-btn-padding-right, 28px) var(--brand-btn-padding-bottom, 14px) var(--brand-btn-padding-left, 28px); font-family:var(--brand-btn-font-family); font-size:var(--brand-btn-font-size); font-weight:var(--brand-btn-font-weight); cursor:pointer; border:none; border-radius:var(--brand-btn-border-radius); background:var(--brand-btn-bg-color); color:var(--brand-btn-text-color); transition:all 0.2s ease; }`);
    cssRules.push(`.funnel-btn-wrap button:hover { background:var(--brand-btn-hover-bg-color); color:var(--brand-btn-hover-text-color); filter:brightness(1.05); transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.15); }`);
    cssRules.push(`.funnel-input-wrap { margin:0 0 12px 0; }`);
    cssRules.push(`.funnel-input-wrap input { width:100%; margin:var(--brand-field-margin-top, 0) var(--brand-field-margin-right, 0) var(--brand-field-margin-bottom, 12px) var(--brand-field-margin-left, 0); padding:var(--brand-field-padding-top, 12px) var(--brand-field-padding-right, 16px) var(--brand-field-padding-bottom, 12px) var(--brand-field-padding-left, 16px); font-family:var(--brand-field-font-family); font-size:var(--brand-field-font-size); background:var(--brand-field-bg-color); color:var(--brand-field-text-color); border:1px solid var(--brand-field-border-color); border-radius:var(--brand-field-border-radius); outline:none; transition:border-color 0.2s; }`);
    cssRules.push(`.funnel-input-wrap input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px var(--color-primary)22; }`);
    cssRules.push(`.funnel-divider { border:none; border-top:var(--brand-divider-width, 1px) var(--brand-divider-style, solid) var(--brand-divider-color, #e5e7eb); margin:var(--brand-divider-margin-top, 24px) 0 var(--brand-divider-margin-bottom, 24px) 0; }`);
    cssRules.push(`.funnel-spacer { height:var(--brand-spacer-height, 40px); }`);
    cssRules.push(`.funnel-timer { padding:var(--brand-timer-padding, 16px); background:var(--brand-timer-bg-color, #fef2f2); border:1px solid var(--brand-timer-border-color, #fca5a5); border-radius:var(--brand-timer-border-radius, 12px); text-align:center; font-weight:var(--brand-timer-font-weight, 700); color:var(--brand-timer-text-color, #dc2626); font-family:monospace; font-size:var(--brand-timer-font-size, 24px); margin:0 0 16px 0; letter-spacing:2px; }`);
    cssRules.push(`img { max-width:100%; height:auto; }`);

    mobileRules.push(`.funnel-row { grid-template-columns:1fr !important; }`);

    (secList || []).forEach(sec => collectElementCss(sec, cssRules, tabletRules, mobileRules));

    const bodyHtml = (secList || []).map(sec => renderItemToHtmlScoped(sec)).join('\n');

    const tabBp = styleObj?.tabletBreakpoint || 1024;
    const mobBp = styleObj?.mobileBreakpoint || 768;
    const mobMin = mobBp + 1;

    const allCss = cssRules.join('\n')
        + (tabletRules.length > 0 ? `\n@media (max-width: ${tabBp}px) and (min-width: ${mobMin}px) {\n${tabletRules.join('\n')}\n}` : '')
        + (mobileRules.length > 0 ? `\n@media (max-width: ${mobBp}px) {\n${mobileRules.join('\n')}\n}` : '');

    const titleText = seoObj?.metaTitle || funnelName;
    const metaDesc = seoObj?.metaDescription ? `<meta name="description" content="${seoObj.metaDescription}">` : '';
    const ogImage = seoObj?.ogImage ? `<meta property="og:image" content="${seoObj.ogImage}">` : '';
    const headerCode = codeObj?.headerCode || '';
    const footerCode = codeObj?.footerCode || '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titleText}</title>
${metaDesc}
${ogImage}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700&family=Montserrat:wght@400;600;700&family=Outfit:wght@400;600;800&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
${allCss}
</style>
${headerCode}
</head>
<body>
<main class="funnel-container">
${bodyHtml}
</main>
${footerCode}
</body>
</html>`;
};
