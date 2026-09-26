import { collectElementCss, buildBrandVars } from './cssCompiler';
import { sanitizeElementForBrandInheritance, resolveContentMaxWidth } from './treeUtils';

export const renderItemToHtmlScoped = (rawItem) => {
    if (!rawItem) return '';
    const item = sanitizeElementForBrandInheritance(rawItem);
    const id = `el-${item.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

    if (item.type === 'section') {
        const tag = ['header', 'footer', 'main', 'section', 'div'].includes(item.htmlTag) ? item.htmlTag : 'section';
        
        let children = Array.isArray(item.elements) ? [...item.elements] : [];
        if (children.length === 0 && Array.isArray(item.columns) && item.columns.some(col => Array.isArray(col) && col.length > 0)) {
            children = [{
                id: `${item.id}_auto_row`,
                type: 'grid_container',
                name: `Row (${item.columns.length} Col)`,
                title: 'Grid Row',
                colsCount: item.colsCount || item.columns.length,
                columns: item.columns,
                columnStyles: item.columnStyles || Array.from({ length: item.columns.length }, () => ({})),
                columnWidths: item.columnWidths,
                gridPreset: item.gridPreset || '50-50',
                gap: item.gap !== undefined ? item.gap : 20,
                containerWidth: '1120',
                contentWidth: 'wide',
                elements: [],
            }];
        }

        const inner = children.map(child => renderItemToHtmlScoped(child)).join('\n');
        return `<${tag} id="${id}" class="funnel-section">\n<div class="funnel-section-inner">\n${inner}\n</div>\n</${tag}>`;
    }

    if (['col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar', 'grid_container'].includes(item.type)) {
        const colsHtml = (item.columns || []).map((col, idx) => {
            const cs = item.columnStyles?.[idx] || {};
            const badgeHtml = cs.hasBadge && cs.badgeText
                ? `<div class="funnel-col-badge">${cs.badgeText}</div>`
                : '';
            const childrenHtml = (col || []).map(child => renderItemToHtmlScoped(child)).join('\n');
            const inner = `${badgeHtml}\n${childrenHtml}`;

            if (cs.linkUrl) {
                const targetAttr = cs.linkTargetBlank ? ' target="_blank" rel="noopener noreferrer"' : '';
                return `<a href="${cs.linkUrl}"${targetAttr} class="funnel-col funnel-col-clickable">\n${inner}\n</a>`;
            }
            return `<div class="funnel-col">\n${inner}\n</div>`;
        }).join('\n');
        return `<div id="${id}" class="funnel-row funnel-row-${item.type}">\n${colsHtml}\n</div>`;
    }

    if (item.type === 'flex_container') {
        const inner = (item.elements || []).map(child => renderItemToHtmlScoped(child)).join('\n');
        return `<div id="${id}" class="funnel-flex-container">\n${inner}\n</div>`;
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
        const iconMap = {
            'check-circle': '✓',
            'check': '✓',
            'star': '⭐',
            'sparkles': '✨',
            'arrow': '→',
            'chevron': '›',
            'dot': '•',
            'shield': '🛡️',
            'lightning': '⚡',
            'heart': '❤️',
            'cross': '✕',
            'none': '',
        };
        const iconName = item.bulletIcon || 'check-circle';
        const iconChar = item.bulletIcon === 'none' ? '' : (iconMap[iconName] || '✓');
        const iconColor = item.bulletIconColor || '#22c55e';
        const iconHtml = iconChar ? `<span class="bullet-icon">${iconChar}</span>` : '';
        const itemsHtml = (item.items || ['Bullet point 1', 'Bullet point 2', 'Bullet point 3'])
            .map(b => `<li class="funnel-bullet-item">${iconHtml}<span class="bullet-text">${b}</span></li>`)
            .join('\n');
        return `<ul id="${id}" class="funnel-bullets">\n${itemsHtml}\n</ul>`;
    }

    if (item.type === 'quote') {
        return `<blockquote id="${id}" class="funnel-quote"><p class="quote-text">“${item.quote || item.content || item.text || 'Quote snippet here'}”</p><cite class="quote-author">— ${item.author || 'Author'}</cite></blockquote>`;
    }

    if (item.type === 'image') {
        const imgTag = `<img id="${item.linkUrl ? '' : id}" class="funnel-img" src="${item.url || ''}" alt="${item.alt || ''}" />`;
        if (item.linkUrl) {
            return `<a id="${id}" class="funnel-img-link" href="${item.linkUrl}" target="_blank" rel="noopener">${imgTag}</a>`;
        }
        return imgTag;
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

        // Escape targetUrl before embedding in onclick to prevent stored XSS.
        const safeUrl = (item.targetUrl || '#')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const actionType = item.btnType || 'submit';
        let btnTypeAttr = 'type="submit"';
        if (actionType === 'url') {
            btnTypeAttr = `type="button" onclick="window.open('${safeUrl}', '${item.openInNewTab ? '_blank' : '_self'}')"`;
        } else if (actionType === 'scroll') {
            btnTypeAttr = `type="button" onclick="const el=document.getElementById('${item.scrollToId || ''}');if(el)el.scrollIntoView({behavior:'smooth'})"`;
        } else if (actionType === 'popup') {
            btnTypeAttr = `type="button" onclick="window.dispatchEvent(new CustomEvent('open-funnel-popup',{detail:{popupId:'${item.popupId || ''}'}}))"`;
        } else if (actionType === 'call') {
            btnTypeAttr = `type="button" onclick="window.location.href='tel:${item.phone || ''}'"`;
        } else if (actionType === 'sms') {
            btnTypeAttr = `type="button" onclick="window.location.href='sms:${item.phone || ''}'"`;
        } else if (actionType === 'email') {
            btnTypeAttr = `type="button" onclick="window.location.href='mailto:${item.email || ''}'"`;
        } else {
            btnTypeAttr = 'type="submit"';
        }

        const iconHtml = iconChar ? `<span class="btn-icon">${iconChar}</span>` : '';
        const mainText = `<span class="btn-main-text">${item.text || 'Submit'}</span>`;
        const contentHtml = iconChar
            ? (iconPos === 'left' ? `<span class="btn-icon-wrap">${iconHtml}${mainText}</span>` : `<span class="btn-icon-wrap">${mainText}${iconHtml}</span>`)
            : mainText;

        const subtextHtml = item.subtext ? `<span class="btn-subtext">${item.subtext}</span>` : '';
        return `<button id="${id}" class="funnel-btn" ${btnTypeAttr}>${contentHtml}${subtextHtml}</button>`;
    }

    if (item.type === 'input_email') {
        const labelHtml = item.label ? `<label class="funnel-field-label">${item.label}${item.required ? ' *' : ''}</label>` : '';
        return `<div id="${id}" class="funnel-field-wrap">${labelHtml}<input type="email" class="funnel-input" placeholder="${item.placeholder || 'Enter your email...'}" ${item.required ? 'required' : ''} /><input type="text" name="_hp_security_check" class="funnel-hp-check" tabindex="-1" autocomplete="off" /></div>`;
    }

    if (item.type === 'input_name') {
        const labelHtml = item.label ? `<label class="funnel-field-label">${item.label}${item.required ? ' *' : ''}</label>` : '';
        return `<div id="${id}" class="funnel-field-wrap">${labelHtml}<input type="text" class="funnel-input" placeholder="${item.placeholder || 'Enter your full name...'}" ${item.required ? 'required' : ''} /></div>`;
    }

    if (item.type === 'input_phone') {
        const labelHtml = item.label ? `<label class="funnel-field-label">${item.label}${item.required ? ' *' : ''}</label>` : '';
        return `<div id="${id}" class="funnel-field-wrap">${labelHtml}<input type="tel" class="funnel-input" placeholder="${item.placeholder || 'Enter phone...'}" ${item.required ? 'required' : ''} /></div>`;
    }

    if (item.type === 'datepicker') {
        const labelHtml = item.label ? `<label class="funnel-field-label">${item.label}</label>` : '';
        return `<div id="${id}" class="funnel-field-wrap">${labelHtml}<input type="date" class="funnel-input" placeholder="${item.placeholder || ''}" /></div>`;
    }

    if (item.type === 'signature') {
        const labelHtml = item.label ? `<label class="funnel-field-label">${item.label}</label>` : '';
        return `<div id="${id}" class="funnel-field-wrap">${labelHtml}<div class="funnel-signature-pad">✍️ Digital Signature Area</div></div>`;
    }

    if (item.type === 'checkbox') {
        return `<label id="${id}" class="funnel-checkbox"><input type="checkbox" /> <span class="checkbox-label">${item.text || 'I agree'}</span></label>`;
    }

    if (item.type === 'audio') {
        return `<div id="${id}" class="funnel-audio-wrap"><p class="audio-title">${item.title || 'Audio Track'}</p><audio controls class="audio-player" src="${item.url || ''}"></audio></div>`;
    }

    if (item.type === 'icon_box') {
        const iconMap = {
            sparkles: '✨', star: '⭐', shield: '🛡️', lightning: '⚡',
            check: '✓', lock: '🔒', cart: '🛒', heart: '❤️',
            rocket: '🚀', message: '💬', clock: '⏱️', none: ''
        };
        const iconChar = item.icon && item.icon !== 'none' ? (iconMap[item.icon] || '✨') : '✨';
        const isHorizontal = item.layoutAlign === 'horizontal';
        const iconHtml = iconChar ? `<div class="icon-wrapper"><span class="icon-symbol">${iconChar}</span></div>` : '';
        const linkOpen = item.linkUrl ? `<a href="${item.linkUrl}" target="_blank" rel="noopener" class="funnel-icon-box-link">` : '';
        const linkClose = item.linkUrl ? `</a>` : '';
        return `${linkOpen}<div id="${id}" class="funnel-icon-box ${isHorizontal ? 'is-horizontal' : 'is-vertical'}">${iconHtml}<div class="icon-box-body"><h3 class="icon-box-title">${item.title || 'Feature'}</h3><p class="icon-box-desc">${item.desc || ''}</p></div></div>${linkClose}`;
    }

    if (item.type === 'progress_bar') {
        return `<div id="${id}" class="funnel-progress-wrap">${item.label ? `<p class="progress-label">${item.label}</p>` : ''}<div class="funnel-progress-bar"><div class="progress-fill"></div></div></div>`;
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
        const starsHtml = `<span class="star-symbols">${starChar.repeat(numStars)}</span>`;
        const subtext = item.ratingText ? `<p class="star-rating-text">${item.ratingText}</p>` : '';
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
            <div class="bump-header">
                <span class="bump-badge">${badge}</span>
                <span class="bump-price">$${price}</span>
            </div>
            <label class="bump-body">
                <input type="checkbox" />
                <div class="bump-content">
                    <h4 class="bump-title">${title}</h4>
                    <p class="bump-desc">${desc}</p>
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
            <div class="testimonial-card${idx === 0 ? ' active' : ''}">
                <div class="testimonial-stars">★★★★★</div>
                <blockquote class="testimonial-quote">"${t.quote || ''}"</blockquote>
                <p class="testimonial-author-wrap">${t.author || ''} <span class="testimonial-role">(${t.role || ''})</span></p>
            </div>
        `).join('');

        const dotsHtml = items.map((_, idx) => `
            <button type="button" class="slider-dot${idx === 0 ? ' active' : ''}" data-idx="${idx}"></button>
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

    if (item.type === 'divider') {
        const isVertical = item.dividerType === 'vertical';
        if (isVertical) {
            return `<div id="${id}-wrap" class="funnel-divider-wrapper funnel-divider-vertical-wrap"><div id="${id}" class="funnel-divider funnel-divider-vertical"></div></div>`;
        }
        return `<div id="${id}-wrap" class="funnel-divider-wrapper funnel-divider-horizontal-wrap"><div id="${id}" class="funnel-divider funnel-divider-horizontal"></div></div>`;
    }

    if (item.type === 'spacer') {
        return `<div id="${id}" class="funnel-spacer"></div>`;
    }

    if (item.type === 'timer') {
        const d = item.days !== undefined ? item.days : 0;
        const h = item.hours !== undefined ? item.hours : 0;
        const m = item.minutes !== undefined ? item.minutes : 15;
        const s = item.seconds !== undefined ? item.seconds : 0;
        const totalSecs = (d * 86400) + (h * 3600) + (m * 60) + s;
        const action = item.timerAction || 'show_message';
        const redirectUrl = (item.redirectUrl || '').replace(/"/g, '&quot;');
        const expireMsg = (item.expireMessage || 'SPECIAL OFFER HAS EXPIRED!').replace(/"/g, '&quot;');
        const theme = item.timerTheme || 'red_urgent';
        const timerType = item.timerType || 'evergreen';
        const themeClass = `timer-theme-${theme.replace(/[^a-zA-Z0-9_-]/g, '')}`;

        const timeText = (d > 0 ? `${String(d).padStart(2,'0')}d : ` : '') + `${String(h).padStart(2,'0')}h : ${String(m).padStart(2,'0')}m : ${String(s).padStart(2,'0')}s`;

        return `<div id="${id}" class="funnel-timer ${themeClass}" data-total-seconds="${totalSecs}" data-timer-type="${timerType}" data-action="${action}" data-redirect="${redirectUrl}" data-message="${expireMsg}">
            <div class="timer-active-wrap">
                <span class="timer-icon">⏰</span>
                <span class="timer-display">${timeText}</span>
            </div>
            <div class="timer-expired-wrap">${expireMsg}</div>
        </div>`;
    }

    if (item.type === 'two_step_order') {
        const step1Title = item.step1Title || 'Step 1: Contact & Shipping Info';
        const step1Sub = item.step1Subtitle || 'Where should we send your receipt and access?';
        const step1Btn = item.step1BtnText || 'Proceed to Step 2: Payment →';
        const step2Title = item.step2Title || 'Step 2: Select Offer & Payment';
        const step2Sub = item.step2Subtitle || 'Fast & Encrypted 256-bit SSL Checkout';
        const step2Btn = item.step2BtnText || 'Complete Secure Order Now 🔒';
        const bumpBadge = item.bumpBadge || '70% OFF SPECIAL';
        const bumpTitle = item.bumpTitle || 'ONE TIME OFFER: Add Template Pack';
        const bumpDesc = item.bumpDesc || 'Check this box to include this high-converting pack.';
        const bumpPrice = Number(item.bumpPrice || 19);
        const guarantee = item.guaranteeBadge || '30-Day 100% Risk-Free Money-Back Guarantee';
        const products = Array.isArray(item.products) && item.products.length > 0 ? item.products : [
            { id: 'prod_1', name: 'Standard Full License', price: 47, desc: 'Instant access + all features', defaultSelected: true }
        ];

        const productsHtml = products.map((p, idx) => `
            <label class="two-step-product-option ${idx === 0 ? 'selected' : ''}">
                <div class="two-step-product-info">
                    <input type="radio" name="selected_product" class="two-step-product-radio" value="${p.id}" data-price="${p.price}" ${idx === 0 ? 'checked' : ''} />
                    <div>
                        <div class="two-step-product-name">${p.name}</div>
                        ${p.desc ? `<div class="two-step-product-desc">${p.desc}</div>` : ''}
                    </div>
                </div>
                <div class="two-step-product-price">$${p.price}</div>
            </label>
        `).join('');

        const bumpHtml = item.hasOrderBump ? `
            <div class="two-step-bump-box">
                <div class="two-step-bump-header">
                    <span class="two-step-bump-badge">${bumpBadge}</span>
                    <span class="two-step-bump-price">+$${bumpPrice}</span>
                </div>
                <label class="two-step-bump-body">
                    <input type="checkbox" id="${id}-bump-chk" class="two-step-bump-checkbox" data-bump-price="${bumpPrice}" />
                    <div>
                        <span class="two-step-bump-title">${bumpTitle}</span>
                        <p class="two-step-bump-desc">${bumpDesc}</p>
                    </div>
                </label>
            </div>
        ` : '';

        return `
        <div id="${id}" class="funnel-two-step-order">
            <!-- Step Tabs Header -->
            <div class="two-step-tabs">
                <div class="two-step-tab-btn active" data-step="1">
                    <span class="step-num">1</span>
                    Contact Info
                </div>
                <div class="two-step-tab-btn" data-step="2">
                    <span class="step-num">2</span>
                    Payment & Summary
                </div>
            </div>

            <!-- STEP 1 CONTAINER -->
            <div class="two-step-pane pane-step-1">
                <div class="two-step-pane-header">
                    <h3>${step1Title}</h3>
                    <p>${step1Sub}</p>
                </div>
                <div class="two-step-form-grid">
                    <input type="text" name="_hp_security_check" class="funnel-hp-check" tabindex="-1" autocomplete="off" />
                    <div class="two-step-field-group">
                        <label>Full Name *</label>
                        <input type="text" name="customer_name" class="two-step-name-input funnel-input" placeholder="e.g. John Doe" required />
                    </div>
                    <div class="two-step-field-group">
                        <label>Email Address *</label>
                        <input type="email" name="customer_email" class="two-step-email-input funnel-input" placeholder="e.g. john@example.com" required />
                    </div>
                    ${item.showPhone ? `
                    <div class="two-step-field-group">
                        <label>Phone Number (WhatsApp) *</label>
                        <input type="tel" name="customer_phone" class="two-step-phone-input funnel-input" placeholder="e.g. +1 555 123 4567" />
                    </div>` : ''}
                    ${item.showAddress ? `
                    <div class="two-step-field-group">
                        <label>Shipping Address</label>
                        <input type="text" name="customer_address" class="two-step-address-input funnel-input" placeholder="Street Address" />
                    </div>` : ''}
                    <button type="button" class="btn-goto-step-2">
                        ${step1Btn}
                    </button>
                </div>
            </div>

            <!-- STEP 2 CONTAINER -->
            <div class="two-step-pane pane-step-2">
                <div class="two-step-pane-header">
                    <h3>${step2Title}</h3>
                    <p>${step2Sub}</p>
                </div>
                
                <!-- Product Selector -->
                <div class="two-step-products-list">
                    ${productsHtml}
                </div>

                <!-- Order Bump -->
                ${bumpHtml}

                <!-- Live Total Summary -->
                <div class="two-step-summary-box">
                    <span>Total Amount:</span>
                    <span class="two-step-total-display">$${products[0]?.price || 47}</span>
                </div>

                <!-- Payment Selection -->
                <div class="two-step-payment-section">
                    <label class="two-step-payment-label">Payment Method</label>
                    <div class="two-step-payment-grid">
                        <label class="two-step-gateway-label">
                            <input type="radio" name="payment_gateway" value="stripe" checked /> 💳 Card
                        </label>
                        <label class="two-step-gateway-label">
                            <input type="radio" name="payment_gateway" value="paypal" /> 🅿️ PayPal
                        </label>
                        <label class="two-step-gateway-label">
                            <input type="radio" name="payment_gateway" value="cod" /> 📦 COD
                        </label>
                    </div>
                </div>

                <button type="button" class="btn-complete-checkout">
                    ${step2Btn}
                </button>

                <div class="two-step-guarantee">
                    🛡️ ${guarantee}
                </div>
            </div>
        </div>`;
    }

    if (item.type === 'upsell_box') {
        const headline = item.offerHeadline || 'WAIT! Special One-Time Offer';
        const subheadline = item.offerSubheadline || 'Add this exclusive upgrade to your order.';
        const urgency = item.urgencyText || '⚡ This discounted offer is only available right now.';
        const prodName = item.productName || 'VIP Accelerator Pack';
        const price = item.productPrice || 47;
        const regPrice = item.regularPrice || 197;
        const acceptBtn = item.acceptBtnText || `YES! Add This to My Order for Only $${price} →`;
        const declineBtn = item.declineBtnText || 'No thanks, I will pass on this special offer';

        return `
        <div id="${id}" class="funnel-upsell-box">
            <div class="upsell-badge">
                ${urgency}
            </div>
            <h2 class="upsell-headline">${headline}</h2>
            <p class="upsell-subheadline">${subheadline}</p>

            <div class="upsell-callout">
                <h4>${prodName}</h4>
                <div class="price-row">
                    <span class="reg-price">Regular: $${regPrice}</span>
                    <span class="upsell-special-price">Special Price: $${price}</span>
                </div>
            </div>

            <button type="button" class="btn-upsell-accept" data-price="${price}" data-product="${prodName}">
                ${acceptBtn}
            </button>

            <div>
                <button type="button" class="btn-upsell-decline">
                    ${declineBtn}
                </button>
            </div>
        </div>`;
    }

    if (item.type === 'pricing_table') {
        const plans = Array.isArray(item.plans) && item.plans.length > 0 ? item.plans : [
            { name: 'Starter', price: '29', period: '/mo', features: ['1 Funnel', '1,000 Visitors', 'Standard Support'], btnText: 'Choose Starter' },
            { name: 'Growth', price: '79', period: '/mo', features: ['Unlimited Funnels', '50,000 Visitors', 'Order Bumps & Upsells', 'Priority Support'], isFeatured: true, btnText: 'Choose Growth' }
        ];

        const cardsHtml = plans.map(p => {
            const isFeat = p.isFeatured;
            const badgeHtml = isFeat ? `<span class="pricing-featured-badge">Most Popular</span>` : '';
            const featsHtml = (p.features || []).map(f => `<li class="pricing-feature-item"><span class="pricing-feature-check">✓</span><span>${f}</span></li>`).join('');

            return `<div class="pricing-card ${isFeat ? 'featured' : ''}">
                <div>
                    ${badgeHtml}
                    <h4 class="pricing-plan-title">${p.name}</h4>
                    <div class="pricing-amount-wrap">
                        <span class="pricing-amount">$${p.price}</span>
                        <span class="pricing-period">${p.period || '/mo'}</span>
                    </div>
                    <ul class="pricing-features-list">
                        ${featsHtml}
                    </ul>
                </div>
                <button type="button" class="btn-pricing-cta">
                    ${p.btnText || 'Select Plan'}
                </button>
            </div>`;
        }).join('');

        return `<div id="${id}" class="funnel-pricing-table">${cardsHtml}</div>`;
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
    cssRules.push(`main.funnel-container { width:100%; max-width:100%; margin:0 auto; padding:0; }`);
    cssRules.push(`section { width:100%; max-width:100%; padding-top:var(--brand-container-padding-top); padding-right:var(--brand-container-padding-right); padding-bottom:var(--brand-container-padding-bottom); padding-left:var(--brand-container-padding-left); margin-top:var(--brand-container-margin-top); margin-right:auto; margin-bottom:var(--brand-container-margin-bottom); margin-left:auto; box-sizing:border-box; }`);
    cssRules.push(`.funnel-section-inner { width:100%; max-width:var(--section-max-width, 100%); margin-left:auto; margin-right:auto; box-sizing:border-box; }`);
    cssRules.push(`.funnel-row { display:grid; row-gap:var(--row-gap-y, var(--row-gap, var(--brand-element-gap-y))); column-gap:var(--row-gap-x, var(--row-gap, var(--brand-element-gap-x))); gap:var(--row-gap, var(--brand-element-gap-y) var(--brand-element-gap-x)); width:100%; max-width:var(--row-max-width, var(--brand-container-width)); margin-left:auto; margin-right:auto; box-sizing:border-box; justify-items:var(--row-justify, stretch); align-items:var(--row-align, stretch); }`);
    cssRules.push(`.funnel-flex-container { display:flex; gap:var(--brand-element-gap-y) var(--brand-element-gap-x); }`);
    cssRules.push(`.funnel-row-grid_container { grid-template-columns:var(--grid-cols, repeat(var(--grid-cols-count, 2), minmax(0, 1fr))); }`);
    cssRules.push(`.funnel-row-col_1 { grid-template-columns:var(--grid-cols, 1fr); }`);
    cssRules.push(`.funnel-row-col_2 { grid-template-columns:var(--grid-cols, repeat(2, minmax(0, 1fr))); }`);
    cssRules.push(`.funnel-row-col_3 { grid-template-columns:var(--grid-cols, repeat(3, minmax(0, 1fr))); }`);
    cssRules.push(`.funnel-row-col_4 { grid-template-columns:var(--grid-cols, repeat(4, minmax(0, 1fr))); }`);
    cssRules.push(`.funnel-row-col_sidebar { grid-template-columns:var(--grid-cols, minmax(0, 7fr) minmax(0, 3fr)); }`);
    cssRules.push(`.funnel-col { position:relative; width:100%; min-width:0; display:flex; flex-direction:column; box-sizing:border-box; justify-content:var(--col-justify, flex-start); align-items:var(--col-align, stretch); gap:var(--col-gap, 0px); padding:var(--brand-col-padding-top) var(--brand-col-padding-right) var(--brand-col-padding-bottom) var(--brand-col-padding-left); margin:var(--brand-col-margin-top) var(--brand-col-margin-right) var(--brand-col-margin-bottom) var(--brand-col-margin-left); }`);
    cssRules.push(`.funnel-col-badge { position:absolute; top:-10px; right:16px; padding:3px 10px; border-radius:9999px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; z-index:2; }`);
    cssRules.push(`.funnel-col-clickable { text-decoration:none; color:inherit; cursor:pointer; }`);
    cssRules.push(`.funnel-hp-check { display:none; visibility:hidden; position:absolute; left:-9999px; }`);
    cssRules.push(`.funnel-bullets { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }`);
    cssRules.push(`.funnel-bullet-item { display:flex; align-items:center; gap:10px; }`);
    cssRules.push(`.funnel-bullet-item .bullet-icon { display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:bold; }`);
    cssRules.push(`.funnel-bullet-item .bullet-text { flex:1; }`);
    cssRules.push(`.funnel-quote { padding:var(--brand-quote-padding-top) var(--brand-quote-padding-right) var(--brand-quote-padding-bottom) var(--brand-quote-padding-left); border-left:var(--brand-quote-border-width) solid var(--brand-quote-border-color); background:var(--brand-quote-bg-color); margin:0; border-radius:var(--brand-quote-border-radius); }`);
    cssRules.push(`.funnel-quote .quote-text { font-style:var(--brand-quote-font-style); font-weight:var(--brand-quote-font-weight); margin:0 0 8px 0; color:var(--brand-quote-text-color); }`);
    cssRules.push(`.funnel-quote .quote-author { font-weight:var(--brand-quote-cite-weight); font-style:var(--brand-quote-cite-style); color:var(--brand-quote-border-color); }`);
    cssRules.push(`.funnel-img { display:block; width:100%; height:auto; border-radius:var(--brand-img-border-radius); box-shadow:var(--brand-img-shadow); transition:transform 0.3s ease; }`);
    cssRules.push(`.funnel-img-link { display:block; width:100%; text-decoration:none; }`);
    cssRules.push(`.funnel-img:hover { transform:scale(1.02); }`);
    cssRules.push(`.funnel-video-wrap { position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:var(--brand-video-border-radius); box-shadow:var(--brand-video-shadow); margin:0; }`);
    cssRules.push(`.funnel-video-wrap iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:0; }`);
    cssRules.push(`.funnel-btn { width:100%; cursor:pointer; border:none; transition:all 0.2s ease; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; text-decoration:none; }`);
    cssRules.push(`.funnel-btn .btn-icon-wrap { display:inline-flex; align-items:center; gap:8px; }`);
    cssRules.push(`.funnel-btn .btn-subtext { display:block; margin-top:3px; }`);
    cssRules.push(`.funnel-field-label { display:block; margin-bottom:6px; font-size:12px; font-weight:600; color:#374151; }`);
    cssRules.push(`.funnel-signature-pad { border:1px dashed #cbd5e1; border-radius:8px; padding:24px; text-align:center; color:#94a3b8; font-size:13px; background:#f8fafc; }`);
    cssRules.push(`.funnel-input { width:100%; outline:none; transition:border-color 0.2s; padding:12px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; box-sizing:border-box; }`);
    cssRules.push(`.funnel-input:focus { border-color:var(--color-primary, #467235); box-shadow:0 0 0 3px rgba(70,114,53,0.15); }`);
    cssRules.push(`.funnel-checkbox { display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px; }`);
    cssRules.push(`.funnel-divider-wrapper { display:flex; width:100%; box-sizing:border-box; }`);
    cssRules.push(`.funnel-divider-horizontal-wrap { padding:8px 0; }`);
    cssRules.push(`.funnel-divider-vertical-wrap { padding:4px 0; }`);
    cssRules.push(`.funnel-divider-horizontal { width:100%; border:none; border-top:var(--brand-divider-width) var(--brand-divider-style) var(--brand-divider-color); }`);
    cssRules.push(`.funnel-divider-vertical { height:60px; border:none; border-left:var(--brand-divider-width) var(--brand-divider-style) var(--brand-divider-color); }`);
    cssRules.push(`.funnel-spacer { height:var(--brand-spacer-height); }`);
    cssRules.push(`.funnel-timer { padding:14px 20px; border-radius:12px; text-align:center; font-weight:700; font-family:monospace; font-size:17px; margin-bottom:16px; letter-spacing:1px; }`);
    cssRules.push(`.funnel-timer .timer-active-wrap { display:flex; align-items:center; justify-content:center; gap:10px; }`);
    cssRules.push(`.funnel-timer .timer-expired-wrap { display:none; font-weight:800; letter-spacing:0.5px; color:#dc2626; }`);
    cssRules.push(`.timer-theme-red_urgent { background:#fef2f2; border:1px solid #fca5a5; color:#dc2626; }`);
    cssRules.push(`.timer-theme-brand { background:rgba(99,102,241,0.08); border:1px solid var(--color-primary, #6EC1E4); color:var(--color-primary, #4f46e5); }`);
    cssRules.push(`.timer-theme-dark { background:#0f172a; border:1px solid #334155; color:#f8fafc; }`);
    cssRules.push(`.timer-theme-light { background:#ffffff; border:1px solid #e2e8f0; color:#0f172a; box-shadow:0 1px 3px rgba(0,0,0,0.05); }`);
    cssRules.push(`.funnel-audio-wrap { padding:14px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:var(--brand-field-border-radius); margin:0; }`);
    cssRules.push(`.funnel-audio-wrap .audio-title { margin:0 0 8px 0; font-weight:600; }`);
    cssRules.push(`.funnel-audio-wrap .audio-player { width:100%; }`);
    cssRules.push(`.funnel-icon-box { padding:20px; border-radius:16px; background:#ffffff; border:1px solid #f1f5f9; box-shadow:0 1px 3px rgba(0,0,0,0.05); }`);
    cssRules.push(`.funnel-icon-box.is-horizontal { display:flex; flex-direction:row; align-items:flex-start; text-align:left; gap:14px; }`);
    cssRules.push(`.funnel-icon-box.is-vertical { display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; }`);
    cssRules.push(`.funnel-icon-box .icon-wrapper { background:#eff6ff; width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }`);
    cssRules.push(`.funnel-icon-box .icon-box-body { flex:1; }`);
    cssRules.push(`.funnel-icon-box .icon-box-title { margin:0 0 6px 0; font-size:15px; font-weight:700; color:#0f172a; }`);
    cssRules.push(`.funnel-icon-box .icon-box-desc { margin:0; font-size:13px; color:#64748b; line-height:1.5; }`);
    cssRules.push(`.funnel-icon-box-link { text-decoration:none; color:inherit; display:block; }`);
    cssRules.push(`.funnel-progress-wrap { margin:0; }`);
    cssRules.push(`.funnel-progress-bar { width:100%; height:14px; background:#e5e7eb; border-radius:9999px; overflow:hidden; }`);
    cssRules.push(`.funnel-social-wrap { display:flex; gap:8px; justify-content:center; margin:0; }`);
    cssRules.push(`.funnel-social-wrap a { padding:8px 14px; color:#ffffff; border-radius:6px; text-decoration:none; font-size:12px; font-weight:700; display:inline-flex; align-items:center; }`);
    cssRules.push(`.funnel-social-fb { background:#1877F2; }`);
    cssRules.push(`.funnel-social-tw { background:#000000; }`);
    cssRules.push(`.funnel-social-wa { background:#25D366; }`);
    cssRules.push(`.funnel-star-rating { text-align:center; margin:0; }`);
    cssRules.push(`.funnel-custom-code { margin:0; }`);
    cssRules.push(`.funnel-rich-text { margin:0; }`);
    cssRules.push(`.funnel-order-bump { border:2px dashed #f87171; background:#fef2f2; padding:16px; border-radius:12px; margin:0; }`);
    cssRules.push(`.funnel-order-bump .bump-badge { background:#dc2626; color:#ffffff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; }`);
    cssRules.push(`.funnel-order-bump .bump-price { font-weight:800; color:#991b1b; font-size:14px; }`);
    cssRules.push(`.funnel-order-bump label { display:flex; gap:10px; cursor:pointer; align-items:flex-start; }`);
    cssRules.push(`.funnel-order-bump input[type="checkbox"] { margin-top:3px; width:18px; height:18px; }`);
    cssRules.push(`.funnel-two-step-order { max-width:580px; margin:0 auto 24px auto; background:#ffffff; border:1px solid #e5e7eb; box-shadow:0 10px 25px -5px rgba(0,0,0,0.08); border-radius:16px; overflow:hidden; }`);
    cssRules.push(`.funnel-two-step-order .two-step-tabs { display:grid; grid-template-columns:1fr 1fr; background:#f9fafb; border-bottom:1px solid #e5e7eb; text-align:center; }`);
    cssRules.push(`.funnel-two-step-order .two-step-tab-btn { padding:14px 12px; font-weight:600; font-size:13px; color:#6b7280; cursor:pointer; border-bottom:3px solid transparent; }`);
    cssRules.push(`.funnel-two-step-order .two-step-tab-btn.active { font-weight:700; color:var(--color-primary, #6366f1); border-bottom-color:var(--color-primary, #6366f1); background:#ffffff; }`);
    cssRules.push(`.funnel-two-step-order .two-step-tab-btn .step-num { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#e5e7eb; color:#6b7280; font-size:11px; margin-right:6px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-tab-btn.active .step-num { background:var(--color-primary, #6366f1); color:#ffffff; }`);
    cssRules.push(`.funnel-two-step-order .two-step-pane { padding:24px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-pane-header { margin-bottom:16px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-pane-header h3 { margin:0; font-size:18px; font-weight:800; color:#111827; }`);
    cssRules.push(`.funnel-two-step-order .two-step-pane-header p { margin:4px 0 0 0; font-size:13px; color:#6b7280; }`);
    cssRules.push(`.funnel-two-step-order .two-step-form-grid { display:flex; flex-direction:column; gap:12px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-field-group label { display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:4px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-product-option { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border:2px solid #e5e7eb; border-radius:10px; margin-bottom:8px; cursor:pointer; background:#fff; transition:all 0.2s; }`);
    cssRules.push(`.funnel-two-step-order .two-step-product-option.selected, .funnel-two-step-order .two-step-product-option:first-of-type { border-color:var(--color-primary, #6366f1); }`);
    cssRules.push(`.funnel-two-step-order .two-step-product-info { display:flex; align-items:center; gap:10px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-product-radio { accent-color:var(--color-primary, #6366f1); width:18px; height:18px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-product-name { font-weight:700; font-size:14px; color:#111827; }`);
    cssRules.push(`.funnel-two-step-order .two-step-product-desc { font-size:12px; color:#6b7280; }`);
    cssRules.push(`.funnel-two-step-order .two-step-product-price { font-weight:800; font-size:16px; color:var(--color-primary, #6366f1); }`);
    cssRules.push(`.funnel-two-step-order .two-step-bump-box { border:2px dashed #f59e0b; background:#fffbeb; border-radius:10px; padding:14px; margin:16px 0; }`);
    cssRules.push(`.funnel-two-step-order .two-step-bump-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-bump-badge { background:#f59e0b; color:#fff; font-size:11px; font-weight:800; padding:2px 8px; border-radius:4px; letter-spacing:0.5px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-bump-price { font-weight:800; color:#b45309; font-size:15px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-bump-body { display:flex; gap:10px; cursor:pointer; }`);
    cssRules.push(`.funnel-two-step-order .two-step-bump-checkbox { accent-color:#f59e0b; width:20px; height:20px; margin-top:2px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-bump-title { font-weight:700; font-size:13px; color:#92400e; }`);
    cssRules.push(`.funnel-two-step-order .two-step-bump-desc { margin:2px 0 0 0; font-size:11px; color:#78350f; line-height:1.4; }`);
    cssRules.push(`.funnel-two-step-order .two-step-summary-box { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin:16px 0; font-weight:700; color:#334155; font-size:14px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-total-display { font-weight:900; color:#0f172a; font-size:20px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-payment-section { margin-bottom:16px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-payment-label { display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:6px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-payment-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); gap:8px; }`);
    cssRules.push(`.funnel-two-step-order .two-step-gateway-label { display:flex; align-items:center; justify-content:center; gap:6px; padding:8px; border:1px solid #d1d5db; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; background:#fff; }`);
    cssRules.push(`.funnel-two-step-order .btn-goto-step-2 { margin-top:8px; width:100%; padding:14px; background:var(--color-primary, #6366f1); color:#ffffff; font-size:15px; font-weight:700; border-radius:10px; border:none; cursor:pointer; transition:all 0.2s; }`);
    cssRules.push(`.funnel-two-step-order .btn-complete-checkout { width:100%; padding:16px; background:#10b981; color:#ffffff; font-size:16px; font-weight:800; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.35); transition:all 0.2s; }`);
    cssRules.push(`.funnel-two-step-order .two-step-guarantee { text-align:center; margin-top:12px; font-size:11px; color:#6b7280; }`);
    cssRules.push(`.funnel-two-step-order .two-step-pane.pane-step-2 { display:none; }`);
    cssRules.push(`.funnel-upsell-box { max-width:620px; margin:0 auto 24px auto; background:#ffffff; border:2px solid #6366f1; box-shadow:0 12px 30px -5px rgba(99,102,241,0.15); border-radius:16px; padding:28px; text-align:center; }`);
    cssRules.push(`.funnel-upsell-box .upsell-badge { display:inline-block; background:#fee2e2; color:#dc2626; font-size:11px; font-weight:800; padding:4px 12px; border-radius:20px; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px; }`);
    cssRules.push(`.funnel-upsell-box .upsell-headline { margin:0 0 8px 0; font-size:22px; font-weight:900; color:#111827; line-height:1.3; }`);
    cssRules.push(`.funnel-upsell-box .upsell-subheadline { margin:0 0 20px 0; font-size:14px; color:#4b5563; }`);
    cssRules.push(`.funnel-upsell-box .upsell-callout { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:20px; }`);
    cssRules.push(`.funnel-upsell-box .upsell-callout h4 { margin:0 0 6px 0; font-size:16px; font-weight:700; color:#1e293b; }`);
    cssRules.push(`.funnel-upsell-box .upsell-callout .price-row { display:flex; align-items:center; justify-content:center; gap:10px; }`);
    cssRules.push(`.funnel-upsell-box .upsell-callout .reg-price { font-size:14px; color:#94a3b8; text-decoration:line-through; }`);
    cssRules.push(`.funnel-upsell-box .upsell-callout .upsell-special-price { font-size:24px; font-weight:900; color:#16a34a; }`);
    cssRules.push(`.funnel-upsell-box .btn-upsell-accept { width:100%; padding:16px; background:#16a34a; color:#ffffff; font-size:16px; font-weight:800; border-radius:10px; border:none; cursor:pointer; box-shadow:0 6px 18px rgba(22,163,74,0.35); transition:all 0.2s; }`);
    cssRules.push(`.funnel-upsell-box .btn-upsell-decline { background:none; border:none; color:#9ca3af; font-size:12px; text-decoration:underline; cursor:pointer; margin-top:14px; }`);
    cssRules.push(`.funnel-pricing-table { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px; margin-bottom:24px; }`);
    cssRules.push(`.funnel-pricing-table .pricing-card { padding:24px; border-radius:16px; border:1px solid #e5e7eb; background:#ffffff; text-align:center; display:flex; flex-direction:column; justify-content:space-between; }`);
    cssRules.push(`.funnel-pricing-table .pricing-card.featured { border-color:var(--color-primary, #6366f1); box-shadow:0 10px 25px -5px rgba(99,102,241,0.15); }`);
    cssRules.push(`.funnel-pricing-table .pricing-featured-badge { display:inline-block; padding:2px 10px; border-radius:12px; font-size:11px; font-weight:800; text-transform:uppercase; margin-bottom:8px; background:var(--color-primary, #6366f1); color:#ffffff; }`);
    cssRules.push(`.funnel-pricing-table .pricing-plan-title { margin:0 0 8px 0; font-size:18px; font-weight:800; }`);
    cssRules.push(`.funnel-pricing-table .pricing-amount-wrap { margin-bottom:16px; }`);
    cssRules.push(`.funnel-pricing-table .pricing-amount { font-size:32px; font-weight:900; }`);
    cssRules.push(`.funnel-pricing-table .pricing-period { font-size:13px; color:#6b7280; }`);
    cssRules.push(`.funnel-pricing-table .pricing-features-list { list-style:none; padding:0; margin:0 0 20px 0; text-align:left; font-size:13px; }`);
    cssRules.push(`.funnel-pricing-table .pricing-feature-item { margin-bottom:8px; display:flex; align-items:center; gap:8px; }`);
    cssRules.push(`.funnel-pricing-table .pricing-feature-check { color:#10b981; }`);
    cssRules.push(`.funnel-pricing-table .btn-pricing-cta { width:100%; padding:12px; border-radius:10px; border:none; cursor:pointer; font-weight:700; font-size:14px; background:var(--color-primary, #6366f1); color:#ffffff; }`);
    cssRules.push(`.funnel-progress-wrap { margin:0; }`);
    cssRules.push(`.funnel-progress-bar { width:100%; height:14px; background:#e5e7eb; border-radius:9999px; overflow:hidden; }`);
    cssRules.push(`.funnel-social-wrap { display:flex; gap:8px; justify-content:center; margin:0; }`);
    cssRules.push(`.funnel-social-wrap a { padding:8px 14px; color:#ffffff; border-radius:6px; text-decoration:none; font-size:12px; font-weight:700; display:inline-flex; align-items:center; }`);
    cssRules.push(`.funnel-social-fb { background:#1877F2; }`);
    cssRules.push(`.funnel-social-tw { background:#000000; }`);
    cssRules.push(`.funnel-social-wa { background:#25D366; }`);
    cssRules.push(`.funnel-star-rating { text-align:center; margin:0; }`);
    cssRules.push(`.funnel-custom-code { margin:0; }`);
    cssRules.push(`.funnel-rich-text { margin:0; }`);
    cssRules.push(`.funnel-order-bump { border:2px dashed #f87171; background:#fef2f2; padding:16px; border-radius:12px; margin:0; }`);
    cssRules.push(`.funnel-order-bump .bump-badge { background:#dc2626; color:#ffffff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; }`);
    cssRules.push(`.funnel-order-bump .bump-price { font-weight:800; color:#991b1b; font-size:14px; }`);
    cssRules.push(`.funnel-order-bump label { display:flex; gap:10px; cursor:pointer; align-items:flex-start; }`);
    cssRules.push(`.funnel-order-bump input[type="checkbox"] { margin-top:3px; width:18px; height:18px; }`);
    cssRules.push(`.funnel-faq-accordion { margin:0; }`);
    cssRules.push(`.funnel-faq-accordion .faq-item { border:1px solid #e5e7eb; border-radius:8px; margin-bottom:8px; overflow:hidden; background:#ffffff; }`);
    cssRules.push(`.funnel-faq-accordion .faq-toggle { width:100%; padding:14px 16px; text-align:left; background:none; border:none; font-weight:700; font-size:14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; color:var(--brand-body-color); }`);
    cssRules.push(`.funnel-faq-accordion .faq-answer { display:none; padding:0 16px 14px 16px; font-size:13px; color:#4b5563; line-height:1.6; border-top:1px solid #f3f4f6; }`);
    cssRules.push(`.funnel-testimonial-slider { position:relative; margin:0 0 24px 0; }`);
    cssRules.push(`.funnel-testimonial-slider .testimonial-card { display:none; padding:28px 24px; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); transition:all 0.3s ease; }`);
    cssRules.push(`.funnel-testimonial-slider .testimonial-card.active { display:block; }`);
    cssRules.push(`.funnel-testimonial-slider .testimonial-stars { color:#f59e0b; font-size:16px; margin-bottom:8px; }`);
    cssRules.push(`.funnel-testimonial-slider .testimonial-quote { font-style:italic; font-size:14px; color:#1f2937; margin:0 0 12px 0; line-height:1.6; }`);
    cssRules.push(`.funnel-testimonial-slider .testimonial-author-wrap { margin:0; font-weight:700; font-size:13px; color:#111827; }`);
    cssRules.push(`.funnel-testimonial-slider .testimonial-role { font-weight:400; color:#6b7280; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-prev, .funnel-testimonial-slider .slider-next { position:absolute; top:45%; transform:translateY(-50%); width:32px; height:32px; border-radius:50%; background:#ffffff; border:1px solid #e5e7eb; box-shadow:0 2px 8px rgba(0,0,0,0.1); cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:700; z-index:2; color:#374151; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-prev { left:-14px; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-next { right:-14px; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-dots { display:flex; justify-content:center; gap:6px; margin-top:12px; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-dot { width:8px; height:8px; border-radius:9999px; border:none; padding:0; cursor:pointer; background:#e5e7eb; transition:all 0.3s; }`);
    cssRules.push(`.funnel-testimonial-slider .slider-dot.active { width:20px; background:var(--color-primary, #467235); }`);
    cssRules.push(`img { max-width:100%; height:auto; }`);

    mobileRules.push(`.funnel-row { --grid-cols: 1fr; grid-template-columns: 1fr; }`);

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
    const robotsTag = seoObj?.noIndex ? `<meta name="robots" content="noindex, nofollow">` : '';
    const canonicalTag = seoObj?.canonical ? `<link rel="canonical" href="${seoObj.canonical}">` : '';
    const faviconTag = seoObj?.favicon ? `<link rel="icon" href="${seoObj.favicon}">` : '';
    const headerCode = codeObj?.headerCode || '';
    const bodyStartCode = codeObj?.bodyStartCode || '';
    const footerCode = codeObj?.footerCode || '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titleText}</title>
${metaDesc}
${robotsTag}
${canonicalTag}
${faviconTag}
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
${bodyStartCode}
<main class="funnel-container">
${bodyHtml}
</main>
${footerCode}
<script>
// Live Interactive Runtime Suite for Funnel Elements
(function(){
  // 1. Live countdown script for timer elements (Evergreen + Standard)
  document.querySelectorAll('.funnel-timer').forEach(function(el){
    var days = parseInt(el.getAttribute('data-days')||'0', 10);
    var hrs = parseInt(el.getAttribute('data-hours')||'2', 10);
    var mins = parseInt(el.getAttribute('data-minutes')||'15', 10);
    var secs = parseInt(el.getAttribute('data-seconds')||'0', 10);
    var action = el.getAttribute('data-action')||'show_message';
    var redirect = el.getAttribute('data-redirect')||'#';
    var message = el.getAttribute('data-message')||'OFFER EXPIRED!';
    var timerType = el.getAttribute('data-timer-type') || 'standard';
    var timerId = el.id || 'timer';

    var durationSecs = (days * 86400) + (hrs * 3600) + (mins * 60) + secs;
    var targetTime;

    if (timerType === 'evergreen') {
      var storageKey = 'funnel_timer_' + timerId;
      var stored = localStorage.getItem(storageKey);
      if (stored && !isNaN(parseInt(stored, 10))) {
        targetTime = parseInt(stored, 10);
      } else {
        targetTime = Date.now() + (durationSecs * 1000);
        try { localStorage.setItem(storageKey, String(targetTime)); } catch(e){}
      }
    } else {
      targetTime = Date.now() + (durationSecs * 1000);
    }

    var disp = el.querySelector('.timer-display') || el;
    function updateTimer(){
      var remainingSecs = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      if(remainingSecs <= 0){
        if(action === 'hide') { el.style.display = 'none'; }
        else if(action === 'redirect' && redirect !== '#') { window.location.href = redirect; }
        else { disp.textContent = message; }
        return;
      }
      var d = Math.floor(remainingSecs / 86400);
      var h = Math.floor((remainingSecs % 86400) / 3600);
      var m = Math.floor((remainingSecs % 3600) / 60);
      var s = remainingSecs % 60;
      var str = (d > 0 ? String(d).padStart(2,'0') + 'd : ' : '') + String(h).padStart(2,'0') + ' : ' + String(m).padStart(2,'0') + ' : ' + String(s).padStart(2,'0');
      disp.textContent = str;
    }
    updateTimer();
    setInterval(updateTimer, 1000);
  });

  var ctx = window.__FUNNEL_CONTEXT__ || {};
  var endpoints = ctx.endpoints || {};

  function getUtms() {
    var p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_term: p.get('utm_term') || '',
      utm_content: p.get('utm_content') || '',
      referrer: document.referrer || ''
    };
  }

  // 2. 2-Step Order Form Step Navigation, Background Lead Capture & Checkout Submission
  document.querySelectorAll('.funnel-two-step-order').forEach(function(checkout){
    var step1Pane = checkout.querySelector('.pane-step-1');
    var step2Pane = checkout.querySelector('.pane-step-2');
    var tabBtns = checkout.querySelectorAll('.two-step-tab-btn');
    var nextBtn = checkout.querySelector('.btn-goto-step-2');
    var totalDisplay = checkout.querySelector('.two-step-total-display');
    var bumpCheckbox = checkout.querySelector('.two-step-bump-checkbox');

    function showStep(stepNum) {
      if(stepNum === 1) {
        if(step1Pane) step1Pane.style.display = 'block';
        if(step2Pane) step2Pane.style.display = 'none';
        if(tabBtns[0]) {
          tabBtns[0].classList.add('active');
          tabBtns[0].style.borderBottom = '3px solid var(--color-primary, #6366f1)';
          tabBtns[0].style.color = 'var(--color-primary, #6366f1)';
          tabBtns[0].style.background = '#ffffff';
        }
        if(tabBtns[1]) {
          tabBtns[1].classList.remove('active');
          tabBtns[1].style.borderBottom = 'none';
          tabBtns[1].style.color = '#6b7280';
          tabBtns[1].style.background = 'transparent';
        }
      } else {
        var nameInput = checkout.querySelector('.two-step-name-input');
        var emailInput = checkout.querySelector('.two-step-email-input');
        if (nameInput && !nameInput.value.trim()) {
          nameInput.focus();
          nameInput.style.borderColor = '#ef4444';
          return false;
        } else if (nameInput) {
          nameInput.style.borderColor = '#d1d5db';
        }
        if (emailInput && (!emailInput.value.trim() || !emailInput.value.includes('@'))) {
          emailInput.focus();
          emailInput.style.borderColor = '#ef4444';
          return false;
        } else if (emailInput) {
          emailInput.style.borderColor = '#d1d5db';
        }
        if(step1Pane) step1Pane.style.display = 'none';
        if(step2Pane) step2Pane.style.display = 'block';
        if(tabBtns[0]) {
          tabBtns[0].classList.remove('active');
          tabBtns[0].style.borderBottom = 'none';
          tabBtns[0].style.color = '#6b7280';
          tabBtns[0].style.background = 'transparent';
        }
        if(tabBtns[1]) {
          tabBtns[1].classList.add('active');
          tabBtns[1].style.borderBottom = '3px solid var(--color-primary, #6366f1)';
          tabBtns[1].style.color = 'var(--color-primary, #6366f1)';
          tabBtns[1].style.background = '#ffffff';
        }
        return true;
      }
    }

    if(nextBtn) {
      nextBtn.addEventListener('click', function(e){
        e.preventDefault();
        var isValid = showStep(2);
        if (!isValid) return;

        // Background lead capture for cart abandonment recovery
        var nameInput = checkout.querySelector('.two-step-name-input');
        var emailInput = checkout.querySelector('.two-step-email-input');
        var phoneInput = checkout.querySelector('.two-step-phone-input');
        var addressInput = checkout.querySelector('.two-step-address-input');

        var step1Url = endpoints.step1Lead || (window.location.pathname.replace(/\/$/, '') + '/step-1-lead');
        var hpInput = checkout.querySelector('input[name="_hp_security_check"]');
        var step1Payload = Object.assign({
          email: emailInput ? emailInput.value.trim() : '',
          name: nameInput ? nameInput.value.trim() : null,
          phone: phoneInput ? phoneInput.value.trim() : null,
          address: addressInput ? addressInput.value.trim() : null,
          _hp_security_check: hpInput ? hpInput.value : ''
        }, getUtms());

        fetch(step1Url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify(step1Payload)
        })
        .then(function(res){ return res.json(); })
        .then(function(data){
          if (data && data.submission_id) {
            checkout.setAttribute('data-submission-id', data.submission_id);
          }
        })
        .catch(function(){});
      });
    }

    tabBtns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var stepNum = parseInt(this.getAttribute('data-step') || '1', 10);
        showStep(stepNum);
      });
    });

    function recalcTotal() {
      var selectedRadio = checkout.querySelector('input[name="selected_product"]:checked');
      var basePrice = selectedRadio ? parseFloat(selectedRadio.getAttribute('data-price') || '0') : 47;
      if (bumpCheckbox && bumpCheckbox.checked) {
        basePrice += parseFloat(bumpCheckbox.getAttribute('data-bump-price') || '17');
      }
      if (totalDisplay) totalDisplay.textContent = '$' + basePrice.toFixed(2);
    }

    checkout.querySelectorAll('input[name="selected_product"]').forEach(function(r){
      r.addEventListener('change', recalcTotal);
    });
    if (bumpCheckbox) {
      bumpCheckbox.addEventListener('change', recalcTotal);
    }

    // Step 2 Complete Checkout Submission Handler
    var submitCheckoutBtn = checkout.querySelector('.btn-complete-checkout');
    if (submitCheckoutBtn) {
      submitCheckoutBtn.addEventListener('click', function(e){
        e.preventDefault();
        var nameInput = checkout.querySelector('.two-step-name-input');
        var emailInput = checkout.querySelector('.two-step-email-input');
        var phoneInput = checkout.querySelector('.two-step-phone-input');
        var addressInput = checkout.querySelector('.two-step-address-input');
        var selectedRadio = checkout.querySelector('input[name="selected_product"]:checked');
        var bumpCheckbox = checkout.querySelector('.two-step-bump-checkbox');
        var gatewayRadio = checkout.querySelector('input[name="payment_gateway"]:checked');

        if (!emailInput || !emailInput.value.trim()) {
          showStep(1);
          if (emailInput) { emailInput.focus(); emailInput.style.borderColor = '#ef4444'; }
          return;
        }

        var basePrice = selectedRadio ? parseFloat(selectedRadio.getAttribute('data-price') || '0') : 47;
        var hasBump = bumpCheckbox && bumpCheckbox.checked;
        var bumpPrice = hasBump ? parseFloat(bumpCheckbox.getAttribute('data-bump-price') || '17') : 0;
        var total = basePrice + bumpPrice;

        var origText = submitCheckoutBtn.innerHTML;
        submitCheckoutBtn.disabled = true;
        submitCheckoutBtn.style.opacity = '0.7';
        submitCheckoutBtn.innerHTML = '<span>Processing Order... 🔒</span>';

        var checkoutUrl = endpoints.checkout || (window.location.pathname.replace(/\/$/, '') + '/checkout');
        var hpInput = checkout.querySelector('input[name="_hp_security_check"]');
        var checkoutPayload = Object.assign({
          email: emailInput.value.trim(),
          name: nameInput ? nameInput.value.trim() : null,
          phone: phoneInput ? phoneInput.value.trim() : null,
          address: addressInput ? addressInput.value.trim() : null,
          product_id: selectedRadio ? selectedRadio.value : 'prod_1',
          product_name: selectedRadio ? (selectedRadio.closest('.two-step-product-option')?.querySelector('div > div')?.textContent || 'Product') : 'Product',
          product_price: basePrice,
          has_bump: hasBump,
          bump_title: hasBump ? 'Order Bump' : null,
          bump_price: bumpPrice,
          total_amount: total,
          payment_gateway: gatewayRadio ? gatewayRadio.value : 'stripe',
          submission_id: checkout.getAttribute('data-submission-id') || null,
          _hp_security_check: hpInput ? hpInput.value : ''
        }, getUtms());

        fetch(checkoutUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify(checkoutPayload)
        })
        .then(function(res){ return res.json(); })
        .then(function(data){
          if (data && data.success && data.redirect_url) {
            window.location.href = data.redirect_url;
          } else {
            submitCheckoutBtn.disabled = false;
            submitCheckoutBtn.style.opacity = '1';
            submitCheckoutBtn.innerHTML = origText;
            alert((data && data.message) ? data.message : 'Order submitted!');
          }
        })
        .catch(function(){
          submitCheckoutBtn.disabled = false;
          submitCheckoutBtn.style.opacity = '1';
          submitCheckoutBtn.innerHTML = origText;
        });
      });
    }
  });

  // 3. 1-Click Upsell Actions
  document.querySelectorAll('.funnel-upsell-box').forEach(function(upsellBox){
    var acceptBtn = upsellBox.querySelector('.btn-upsell-accept');
    var declineBtn = upsellBox.querySelector('.btn-upsell-decline');
    var upsellUrl = endpoints.upsellAction || (window.location.pathname.replace(/\/$/, '') + '/upsell-action');

    function sendUpsellDecision(decision, btn) {
      var origText = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<span>Processing...</span>';
      }
      var price = acceptBtn ? parseFloat(acceptBtn.getAttribute('data-price') || '47') : 47;
      var prod = acceptBtn ? acceptBtn.getAttribute('data-product') : 'Upsell Offer';

      fetch(upsellUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          decision: decision,
          product_name: prod,
          product_price: price
        })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          window.location.reload();
        }
      })
      .catch(function(){
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.innerHTML = origText;
        }
      });
    }

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function(e){
        e.preventDefault();
        sendUpsellDecision('accept', acceptBtn);
      });
    }
    if (declineBtn) {
      declineBtn.addEventListener('click', function(e){
        e.preventDefault();
        sendUpsellDecision('decline', declineBtn);
      });
    }
  });

  // 4. Universal Opt-In Form Submission Handler
  document.querySelectorAll('button[type="submit"], .funnel-btn').forEach(function(btn){
    if (btn.classList.contains('btn-goto-step-2') || btn.classList.contains('btn-complete-checkout') || btn.classList.contains('btn-upsell-accept') || btn.classList.contains('btn-upsell-decline')) return;

    btn.addEventListener('click', function(e){
      var formContainer = btn.closest('form') || btn.closest('.funnel-section') || document.body;
      var emailInput = formContainer.querySelector('input[type="email"], .funnel-input[type="email"]');
      if (!emailInput) return; // Not an opt-in form

      e.preventDefault();
      var nameInput = formContainer.querySelector('input[name="customer_name"], input[placeholder*="name" i], .funnel-input[type="text"]');
      var phoneInput = formContainer.querySelector('input[type="tel"], input[name="customer_phone"], .funnel-input[type="tel"]');

      if (!emailInput.value || !emailInput.value.includes('@')) {
        emailInput.focus();
        emailInput.style.borderColor = '#ef4444';
        return;
      }
      emailInput.style.borderColor = '';

      var originalText = btn.innerHTML;
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.innerHTML = '<span>Processing...</span>';

      var optinUrl = endpoints.optin || (window.location.pathname.replace(/\/$/, '') + '/optin');
      var hpInput = formContainer.querySelector('input[name="_hp_security_check"]');
      var optinPayload = Object.assign({
        email: emailInput.value.trim(),
        name: nameInput ? nameInput.value.trim() : null,
        phone: phoneInput ? phoneInput.value.trim() : null,
        step_id: ctx.stepId || null,
        _hp_security_check: hpInput ? hpInput.value : ''
      }, getUtms());

      fetch(optinUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify(optinPayload)
      })
      .then(function(res){ return res.json(); })
      .then(function(data){
        if (data && data.success && data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.innerHTML = originalText;
          alert((data && data.message) ? data.message : 'Thank you! Submission received.');
        }
      })
      .catch(function(){
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = originalText;
      });
    });
  });

  // 3. Exit-Intent & Triggered Popups Engine
  function openPopup(popupId) {
    var popupEl = document.getElementById(popupId);
    if (!popupEl) return;
    popupEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function closePopup(popupEl) {
    if (!popupEl) return;
    popupEl.style.display = 'none';
    document.body.style.overflow = '';
  }

  window.addEventListener('open-funnel-popup', function(e){
    if (e.detail && e.detail.popupId) {
      openPopup(e.detail.popupId);
    }
  });

  document.querySelectorAll('.funnel-popup-overlay').forEach(function(popup){
    var popupId = popup.id;
    var trigger = popup.getAttribute('data-trigger'); // 'exit_intent', 'delay', 'scroll', 'manual'
    var delaySecs = parseInt(popup.getAttribute('data-delay') || '5', 10);
    var scrollPct = parseInt(popup.getAttribute('data-scroll-depth') || '50', 10);
    var frequency = popup.getAttribute('data-frequency') || 'always'; // 'always', 'once_per_session', 'once_per_day'
    var storageKey = 'funnel_popup_' + popupId;

    function canTrigger() {
      if (frequency === 'once_per_session') {
        return !sessionStorage.getItem(storageKey);
      }
      if (frequency === 'once_per_day') {
        var lastSeen = localStorage.getItem(storageKey);
        if (lastSeen && (Date.now() - parseInt(lastSeen, 10)) < 86400000) return false;
      }
      return true;
    }

    function recordTrigger() {
      if (frequency === 'once_per_session') sessionStorage.setItem(storageKey, '1');
      if (frequency === 'once_per_day') localStorage.setItem(storageKey, String(Date.now()));
    }

    function triggerThisPopup() {
      if (!canTrigger()) return;
      recordTrigger();
      openPopup(popupId);
    }

    popup.querySelectorAll('.funnel-popup-close, .funnel-popup-backdrop').forEach(function(cBtn){
      cBtn.addEventListener('click', function(e){
        e.stopPropagation();
        closePopup(popup);
      });
    });

    if (trigger === 'exit_intent') {
      var triggered = false;
      document.addEventListener('mouseleave', function(e){
        if (!triggered && e.clientY <= 0) {
          triggered = true;
          triggerThisPopup();
        }
      });
    } else if (trigger === 'delay') {
      setTimeout(function(){
        triggerThisPopup();
      }, delaySecs * 1000);
    } else if (trigger === 'scroll') {
      var scrollTriggered = false;
      window.addEventListener('scroll', function(){
        if (scrollTriggered) return;
        var totalScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (totalScroll > 0) {
          var currentPct = (window.scrollY / totalScroll) * 100;
          if (currentPct >= scrollPct) {
            scrollTriggered = true;
            triggerThisPopup();
          }
        }
      });
    }
  });

  // 3b. Live Countdown Timer Engine (Standard & Evergreen + Actions)
  document.querySelectorAll('.funnel-timer').forEach(function(timerEl){
    var timerId = timerEl.id;
    var totalSecs = parseInt(timerEl.getAttribute('data-total-seconds') || '900', 10);
    var timerType = timerEl.getAttribute('data-timer-type') || 'evergreen';
    var action = timerEl.getAttribute('data-action') || 'show_message';
    var redirectUrl = timerEl.getAttribute('data-redirect') || '';
    var displayEl = timerEl.querySelector('.timer-display');
    var activeWrap = timerEl.querySelector('.timer-active-wrap');
    var expiredWrap = timerEl.querySelector('.timer-expired-wrap');
    var storageKey = 'funnel_timer_' + timerId;

    var endTime;
    if (timerType === 'evergreen') {
      var saved = localStorage.getItem(storageKey);
      if (saved && !isNaN(parseInt(saved, 10))) {
        endTime = parseInt(saved, 10);
      } else {
        endTime = Date.now() + (totalSecs * 1000);
        localStorage.setItem(storageKey, String(endTime));
      }
    } else {
      endTime = Date.now() + (totalSecs * 1000);
    }

    function tick() {
      var now = Date.now();
      var remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      if (remaining <= 0) {
        if (action === 'hide') {
          timerEl.style.display = 'none';
        } else if (action === 'redirect_url' && redirectUrl && redirectUrl !== '#') {
          window.location.href = redirectUrl;
        } else {
          if (activeWrap) activeWrap.style.display = 'none';
          if (expiredWrap) expiredWrap.style.display = 'block';
        }
        return;
      }
      var d = Math.floor(remaining / 86400);
      var h = Math.floor((remaining % 86400) / 3600);
      var m = Math.floor((remaining % 3600) / 60);
      var s = remaining % 60;
      var str = (d > 0 ? (String(d).padStart(2, '0') + 'd : ') : '') +
                String(h).padStart(2, '0') + 'h : ' +
                String(m).padStart(2, '0') + 'm : ' +
                String(s).padStart(2, '0') + 's';
      if (displayEl) displayEl.textContent = str;
      setTimeout(tick, 1000);
    }
    tick();
  });

  // 4. Live FAQ Accordion toggle script
  document.querySelectorAll('.funnel-faq-accordion .faq-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var ans = this.nextElementSibling;
      var icon = this.querySelector('.faq-icon');
      var isOpen = ans.style.display === 'block';
      ans.style.display = isOpen ? 'none' : 'block';
      if(icon) icon.textContent = isOpen ? '▼' : '▲';
    });
  });

  // 5. Live Testimonial Slider script
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
