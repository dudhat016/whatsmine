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
        // Bug 11 Fix: builder stores heading level as `item.headingTag`, content as `item.content`.
        const tag = item.headingTag || 'h2';
        return `<${tag} id="${id}">${item.content || item.text || 'Headline Text'}</${tag}>`;
    }

    if (item.type === 'subheadline') {
        // Bug 13 Fix: same field name corrections as headline.
        const tag = item.headingTag || 'h3';
        return `<${tag} id="${id}">${item.content || item.text || 'Subheadline Text'}</${tag}>`;
    }

    if (item.type === 'paragraph') {
        // Bug 12 Fix: builder stores paragraph text as `item.content`.
        return `<p id="${id}">${item.content || item.text || 'Paragraph content goes here...'}</p>`;
    }

    if (item.type === 'bullets') {
        const itemsHtml = (item.items || ['Bullet point 1', 'Bullet point 2', 'Bullet point 3'])
            .map(b => `<li>${b}</li>`)
            .join('\n');
        return `<ul id="${id}" class="funnel-bullets">\n${itemsHtml}\n</ul>`;
    }

    if (item.type === 'quote') {
        // Bug 5 Fix: use item.quote || item.content (settings panel writes to `quote`).
        return `<blockquote id="${id}" class="funnel-quote"><p>“${item.quote || item.content || item.text || 'Quote snippet here'}”</p><cite>— ${item.author || 'Author'}</cite></blockquote>`;
    }

    if (item.type === 'image') {
        const maxW = item.maxWidth ? `${item.maxWidth}%` : '100%';
        const imgTag = `<img src="${item.url || ''}" alt="${item.alt || ''}" style="max-width:${maxW};" />`;
        const inner = item.linkUrl
            ? `<a href="${item.linkUrl}" target="_blank" rel="noopener">${imgTag}</a>`
            : imgTag;
        return `<div id="${id}" class="funnel-image-wrap">${inner}</div>`;
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

        // Bug 20 Fix: escape targetUrl before embedding in onclick to prevent stored XSS.
        const safeUrl = (item.targetUrl || '#')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const subtextHtml = item.subtext ? `<span style="display:block;font-size:${item.subtextFontSize || 11}px;color:${item.subtextColor || 'rgba(255,255,255,0.85)'};font-weight:400;margin-top:2px;">${item.subtext}</span>` : '';
        return `<div class="funnel-btn-wrap"><button id="${id}" ${btnTypeAttr}><span>${btnLabel}</span>${subtextHtml}</button></div>`;
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
        return `<div class="funnel-input-wrap"><label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="${id}" /> <span>${item.text || 'I agree'}</span></label></div>`;
    }

    if (item.type === 'audio') {
        return `<div id="${id}" class="funnel-audio-wrap"><p style="margin:0 0 8px 0;font-weight:600;">${item.title || 'Audio Track'}</p><audio controls style="width:100%;" src="${item.url || ''}"></audio></div>`;
    }

    if (item.type === 'icon_box') {
        return `<div id="${id}" class="funnel-icon-box"><h3>${item.title || 'Feature'}</h3><p>${item.desc || ''}</p></div>`;
    }

    if (item.type === 'progress_bar') {
        const pct = item.percent || 80;
        const col = item.barColor || 'var(--color-primary, #467235)';
        return `<div id="${id}" class="funnel-progress-wrap">${item.label ? `<p style="margin:0 0 4px 0;font-size:12px;font-weight:600;">${item.label}</p>` : ''}<div class="funnel-progress-bar"><div style="width:${pct}%;height:100%;background:${col};transition:width 0.5s;"></div></div></div>`;
    }

    if (item.type === 'social') {
        const u = encodeURIComponent(item.shareUrl || '');
        return `<div id="${id}" class="funnel-social-wrap">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" class="funnel-social-fb">f Share</a>
            <a href="https://twitter.com/intent/tweet?url=${u}" target="_blank" rel="noopener" class="funnel-social-tw">𝕏 Tweet</a>
            <a href="https://api.whatsapp.com/send?text=${u}" target="_blank" rel="noopener" class="funnel-social-wa">✉ Share</a>
        </div>`;
    }

    if (item.type === 'star_rating') {
        const starChar = '★';
        const numStars = item.stars || 5;
        const color = item.starColor || '#f59e0b';
        const starsHtml = `<span style="color:${color};font-size:20px;letter-spacing:2px;">${starChar.repeat(numStars)}</span>`;
        const subtext = item.ratingText ? `<p style="margin:4px 0 0 0;font-size:12px;color:#6b7280;font-weight:600;">${item.ratingText}</p>` : '';
        return `<div id="${id}" class="funnel-star-rating">${starsHtml}${subtext}</div>`;
    }

    if (item.type === 'custom_code') {
        return `<div id="${id}" class="funnel-custom-code">${item.code || ''}</div>`;
    }

    if (item.type === 'rich_text') {
        return `<div id="${id}" class="funnel-rich-text">${item.htmlContent || item.content || ''}</div>`;
    }

    if (item.type === 'order_bump') {
        const badge = item.badgeText || 'YES! ADD THIS TO MY ORDER';
        const title = item.title || 'ONE TIME OFFER: Add Checklist';
        const desc = item.desc || 'Check this box to instantly include this offer.';
        const price = item.price || 17;
        return `<div id="${id}" class="funnel-order-bump">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span class="bump-badge">${badge}</span>
                <span class="bump-price">$${price}</span>
            </div>
            <label>
                <input type="checkbox" />
                <div>
                    <h4 style="margin:0;font-size:14px;font-weight:700;color:#111827;">${title}</h4>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#4b5563;">${desc}</p>
                </div>
            </label>
        </div>`;
    }

    if (item.type === 'faq_accordion') {
        const items = item.items || [];
        const faqHtml = items.map((faq, idx) => `
            <div class="faq-item">
                <button type="button" class="faq-toggle">
                    <span>${faq.q || 'Question?'}</span>
                    <span class="faq-icon">▼</span>
                </button>
                <div class="faq-answer">
                    ${faq.a || ''}
                </div>
            </div>
        `).join('');
        return `<div id="${id}" class="funnel-faq-accordion">${faqHtml}</div>`;
    }

    if (item.type === 'testimonial_slider') {
        const items = item.items || [];
        const slidesHtml = items.map((t, idx) => `
            <div class="testimonial-card" style="display:${idx === 0 ? 'block' : 'none'};">
                <div style="color:#f59e0b;font-size:16px;margin-bottom:8px;">★★★★★</div>
                <blockquote style="font-style:italic;font-size:14px;color:#1f2937;margin:0 0 12px 0;line-height:1.6;">"${t.quote || ''}"</blockquote>
                <p style="margin:0;font-weight:700;font-size:13px;color:#111827;">${t.author || ''} <span style="font-weight:400;color:#6b7280;">(${t.role || ''})</span></p>
            </div>
        `).join('');

        const dotsHtml = items.map((_, idx) => `
            <button type="button" class="slider-dot" data-idx="${idx}" style="width:${idx === 0 ? '20px' : '8px'};background:${idx === 0 ? 'var(--color-primary, #467235)' : '#e5e7eb'};"></button>
        `).join('');

        const navArrows = items.length > 1 ? `
            <button type="button" class="slider-prev">‹</button>
            <button type="button" class="slider-next">›</button>
        ` : '';

        return `<div id="${id}" class="funnel-testimonial-slider">
            <div class="slider-slides-wrap">${slidesHtml}</div>
            ${navArrows}
            ${items.length > 1 ? `<div class="slider-dots">${dotsHtml}</div>` : ''}
        </div>`;
    }

    if (item.type === 'divider')  return `<hr id="${id}" class="funnel-divider" />`;

    if (item.type === 'spacer') {
        // Bug 7 Fix: dynamic spacer height
        const h = item.spacerHeight !== undefined ? item.spacerHeight : ((item.paddingY || 20) * 2);
        return `<div id="${id}" class="funnel-spacer" style="height:${h}px;"></div>`;
    }

    if (item.type === 'timer') {
        const d = item.days !== undefined ? item.days : 0;
        const h = item.hours !== undefined ? item.hours : 2;
        const m = item.minutes !== undefined ? item.minutes : 15;
        const s = item.seconds !== undefined ? item.seconds : 0;
        const action = item.timerAction || 'show_message';
        const redirectUrl = (item.redirectUrl || '#').replace(/"/g, '&quot;');
        const expireMsg = (item.expireMessage || 'OFFER EXPIRED!').replace(/"/g, '&quot;');
        const theme = item.timerTheme || 'red_urgent';

        const themeStyles = {
            red_urgent: 'background:#fef2f2;border:1px solid #fca5a5;color:#dc2626;',
            brand: 'background:rgba(99,102,241,0.08);border:1px solid var(--color-primary, #6EC1E4);color:var(--color-primary, #467235);',
            dark: 'background:#111827;border:1px solid #374151;color:#ffffff;',
            light: 'background:#ffffff;border:1px solid #e5e7eb;color:#111827;box-shadow:0 1px 3px rgba(0,0,0,0.05);',
            minimal: 'background:transparent;border:none;color:var(--color-primary, #111827);padding:0;'
        };

        const styleStr = themeStyles[theme] || themeStyles.red_urgent;
        const timeText = (d > 0 ? `${String(d).padStart(2,'0')}d : ` : '') + `${String(h).padStart(2,'0')} : ${String(m).padStart(2,'0')} : ${String(s).padStart(2,'0')}`;

        return `<div id="${id}" class="funnel-timer" style="padding:14px;border-radius:12px;text-align:center;font-weight:700;font-family:monospace;font-size:18px;margin-bottom:16px;letter-spacing:1px;${styleStr}" data-days="${d}" data-hours="${h}" data-minutes="${m}" data-seconds="${s}" data-action="${action}" data-redirect="${redirectUrl}" data-message="${expireMsg}">⏰ <span class="timer-display">${timeText}</span></div>`;
    }

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
    cssRules.push(`.funnel-audio-wrap { padding:14px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:var(--brand-field-border-radius, 8px); margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-icon-box { padding:20px; text-align:center; background:#ffffff; border:1px solid #f3f4f6; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05); margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-icon-box h3 { margin:0 0 8px 0; font-size:16px; color:var(--brand-body-color, #111827); }`);
    cssRules.push(`.funnel-icon-box p { margin:0; color:#6b7280; font-size:14px; }`);
    cssRules.push(`.funnel-progress-wrap { margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-progress-bar { width:100%; height:14px; background:#e5e7eb; border-radius:9999px; overflow:hidden; }`);
    cssRules.push(`.funnel-social-wrap { display:flex; gap:8px; justify-content:center; margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-social-wrap a { padding:8px 14px; color:#ffffff; border-radius:6px; text-decoration:none; font-size:12px; font-weight:700; display:inline-flex; align-items:center; }`);
    cssRules.push(`.funnel-social-fb { background:#1877F2; }`);
    cssRules.push(`.funnel-social-tw { background:#000000; }`);
    cssRules.push(`.funnel-social-wa { background:#25D366; }`);
    cssRules.push(`.funnel-star-rating { text-align:center; margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-custom-code { margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-rich-text { margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-order-bump { border:2px dashed #f87171; background:#fef2f2; padding:16px; border-radius:12px; margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-order-bump .bump-badge { background:#dc2626; color:#ffffff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; }`);
    cssRules.push(`.funnel-order-bump .bump-price { font-weight:800; color:#991b1b; font-size:14px; }`);
    cssRules.push(`.funnel-order-bump label { display:flex; gap:10px; cursor:pointer; align-items:flex-start; }`);
    cssRules.push(`.funnel-order-bump input[type="checkbox"] { margin-top:3px; width:18px; height:18px; }`);
    cssRules.push(`.funnel-faq-accordion { margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-faq-accordion .faq-item { border:1px solid #e5e7eb; border-radius:8px; margin-bottom:8px; overflow:hidden; background:#ffffff; }`);
    cssRules.push(`.funnel-faq-accordion .faq-toggle { width:100%; padding:14px 16px; text-align:left; background:none; border:none; font-weight:700; font-size:14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; color:var(--brand-body-color, #111827); }`);
    cssRules.push(`.funnel-faq-accordion .faq-answer { display:none; padding:0 16px 14px 16px; font-size:13px; color:#4b5563; line-height:1.6; border-top:1px solid #f3f4f6; }`);
    cssRules.push(`.funnel-testimonial-slider { position:relative; margin:0 0 24px 0; }`);
    cssRules.push(`.funnel-testimonial-slider .testimonial-card { padding:28px 24px; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); transition:all 0.3s ease; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-prev, .funnel-testimonial-slider .slider-next { position:absolute; top:45%; transform:translateY(-50%); width:32px; height:32px; border-radius:50%; background:#ffffff; border:1px solid #e5e7eb; box-shadow:0 2px 8px rgba(0,0,0,0.1); cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:700; z-index:2; color:#374151; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-prev { left:-14px; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-next { right:-14px; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-dots { display:flex; justify-content:center; gap:6px; margin-top:12px; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-dot { height:8px; border-radius:9999px; border:none; padding:0; cursor:pointer; transition:all 0.3s; }`);
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
<script>
// Bug 8 Fix: Live countdown script for timer elements
(function(){
  document.querySelectorAll('.funnel-timer').forEach(function(el){
    var days = parseInt(el.getAttribute('data-days')||'0', 10);
    var hrs = parseInt(el.getAttribute('data-hours')||'2', 10);
    var mins = parseInt(el.getAttribute('data-minutes')||'15', 10);
    var secs = parseInt(el.getAttribute('data-seconds')||'0', 10);
    var action = el.getAttribute('data-action')||'show_message';
    var redirect = el.getAttribute('data-redirect')||'#';
    var message = el.getAttribute('data-message')||'OFFER EXPIRED!';
    var totalSecs = (days * 86400) + (hrs * 3600) + (mins * 60) + secs;
    var disp = el.querySelector('.timer-display') || el;
    function updateTimer(){
      if(totalSecs <= 0){
        if(action === 'hide') { el.style.display = 'none'; }
        else if(action === 'redirect' && redirect !== '#') { window.location.href = redirect; }
        else { disp.textContent = message; }
        return;
      }
      totalSecs--;
      var d = Math.floor(totalSecs / 86400);
      var h = Math.floor((totalSecs % 86400) / 3600);
      var m = Math.floor((totalSecs % 3600) / 60);
      var s = totalSecs % 60;
      var str = (d > 0 ? String(d).padStart(2,'0') + 'd : ' : '') + String(h).padStart(2,'0') + ' : ' + String(m).padStart(2,'0') + ' : ' + String(s).padStart(2,'0');
      disp.textContent = str;
    }
    setInterval(updateTimer, 1000);
  });
  // Live FAQ Accordion toggle script
  document.querySelectorAll('.funnel-faq-accordion .faq-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var ans = this.nextElementSibling;
      var icon = this.querySelector('.faq-icon');
      var isOpen = ans.style.display === 'block';
      ans.style.display = isOpen ? 'none' : 'block';
      if(icon) icon.textContent = isOpen ? '▼' : '▲';
    });
  });
  // Live Testimonial Slider script
  document.querySelectorAll('.funnel-testimonial-slider').forEach(function(slider){
    var slides = slider.querySelectorAll('.testimonial-card');
    var dots = slider.querySelectorAll('.slider-dot');
    var prevBtn = slider.querySelector('.slider-prev');
    var nextBtn = slider.querySelector('.slider-next');
    if (!slides.length) return;
    var current = 0;
    function showSlide(idx){
      current = (idx + slides.length) % slides.length;
      slides.forEach(function(s, i){ s.style.display = (i === current) ? 'block' : 'none'; });
      dots.forEach(function(d, i){
        d.style.background = (i === current) ? 'var(--color-primary, #467235)' : '#e5e7eb';
        d.style.width = (i === current) ? '20px' : '8px';
      });
    }
    if (prevBtn) prevBtn.addEventListener('click', function(e){ e.preventDefault(); showSlide(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function(e){ e.preventDefault(); showSlide(current + 1); });
    dots.forEach(function(d, i){ d.addEventListener('click', function(e){ e.preventDefault(); showSlide(i); }); });
    showSlide(0);
    if (slides.length > 1) {
      setInterval(function(){ showSlide(current + 1); }, 5000);
    }
  });
})();
</script>
</body>
</html>`;
};
