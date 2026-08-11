import { sanitizeElementForBrandInheritance } from './treeUtils';

export const buildBrandVars = (styleGuide) => {
    const sg = styleGuide || {};
    const sys = sg.systemColors || {};
    const custom = (sg.customColors || []).map(c => `--color-${c.id}: ${c.value || '#3B82F6'};`).join('\n');
    const headings = ['h1','h2','h3','h4','h5','h6'].map(h => {
        const typo = sg[`${h}Typography`] || {};
        const col = sg[`${h}Color`] || sg.headingColor || '#111827';
        const defaultMb = h === 'h1' || h === 'h2' || h === 'h3' ? 12 : (h === 'h4' ? 10 : 8);
        const mUnit = sg[`${h}MarginUnit`] || sg.headingMarginBottomUnit || 'px';
        const pUnit = sg[`${h}PaddingUnit`] || 'px';
        return `--brand-${h}-font-family: ${typo.family || sg.headingFontName || sg.defaultFont || "'Inter', sans-serif"};
        --brand-${h}-font-size: ${typo.size || (h === 'h1' ? 32 : h === 'h2' ? 24 : h === 'h3' ? 20 : 18)}px;
        --brand-${h}-font-weight: ${typo.weight || '700'};
        --brand-${h}-line-height: ${typo.lineHeight || 36}px;
        --brand-${h}-color: ${col};
        --brand-${h}-text-transform: ${typo.transform === 'Default' ? 'none' : (typo.transform || 'none')};
        --brand-${h}-font-style: ${typo.style === 'Default' ? 'normal' : (typo.style || 'normal')};
        --brand-${h}-text-decoration: ${typo.decoration === 'Default' ? 'none' : (typo.decoration || 'none')};
        --brand-${h}-margin-top: ${sg[`${h}MarginTop`] ?? 0}${mUnit};
        --brand-${h}-margin-right: ${sg[`${h}MarginRight`] ?? 0}${mUnit};
        --brand-${h}-margin-bottom: ${sg[`${h}MarginBottom`] ?? sg.headingMarginBottom ?? defaultMb}${mUnit};
        --brand-${h}-margin-left: ${sg[`${h}MarginLeft`] ?? 0}${mUnit};
        --brand-${h}-padding-top: ${sg[`${h}PaddingTop`] ?? 0}${pUnit};
        --brand-${h}-padding-right: ${sg[`${h}PaddingRight`] ?? 0}${pUnit};
        --brand-${h}-padding-bottom: ${sg[`${h}PaddingBottom`] ?? 0}${pUnit};
        --brand-${h}-padding-left: ${sg[`${h}PaddingLeft`] ?? 0}${pUnit};`;
    }).join('\n');

    const bodyTypo = sg.bodyTypography || {};
    const btnTypo = sg.btnTypography || {};
    const fieldTypo = sg.fieldTypography || {};
    const fieldBorder = sg.fieldBorder || {};

    const qPTop = sg.quotePaddingTop ?? 16;
    const qPRight = sg.quotePaddingRight ?? 20;
    const qPBot = sg.quotePaddingBottom ?? 16;
    const qPLeft = sg.quotePaddingLeft ?? 20;

    return `
        --color-primary: ${sys.primary || '#6EC1E4'};
        --color-secondary: ${sys.secondary || '#54595F'};
        --color-text: ${sys.text || '#7A7A7A'};
        --color-accent: ${sys.accent || '#61CE70'};
        ${custom}
        ${headings}
        --brand-body-font-family: ${bodyTypo.family || sg.defaultFont || "'Inter', sans-serif"};
        --brand-body-font-size: ${bodyTypo.size || sg.fontSize || 16}px;
        --brand-body-font-weight: ${bodyTypo.weight || '400'};
        --brand-body-line-height: ${bodyTypo.lineHeight || sg.lineHeight || 24}px;
        --brand-body-color: ${sg.textColor || '#1f2937'};
        --brand-body-margin-top: ${sg.bodyMarginTop ?? 0}${sg.bodyMarginUnit || 'px'};
        --brand-body-margin-right: ${sg.bodyMarginRight ?? 0}${sg.bodyMarginUnit || 'px'};
        --brand-body-margin-bottom: ${sg.bodyMarginBottom ?? sg.paragraphMarginBottom ?? 16}${sg.bodyMarginUnit || sg.paragraphMarginBottomUnit || 'px'};
        --brand-body-margin-left: ${sg.bodyMarginLeft ?? 0}${sg.bodyMarginUnit || 'px'};
        --brand-body-padding-top: ${sg.bodyPaddingTop ?? 0}${sg.bodyPaddingUnit || 'px'};
        --brand-body-padding-right: ${sg.bodyPaddingRight ?? 0}${sg.bodyPaddingUnit || 'px'};
        --brand-body-padding-bottom: ${sg.bodyPaddingBottom ?? 0}${sg.bodyPaddingUnit || 'px'};
        --brand-body-padding-left: ${sg.bodyPaddingLeft ?? 0}${sg.bodyPaddingUnit || 'px'};

        --brand-btn-font-family: ${btnTypo.family || sg.defaultFont || "'Inter', sans-serif"};
        --brand-btn-font-size: ${btnTypo.size || 16}px;
        --brand-btn-font-weight: ${btnTypo.weight || '700'};
        --brand-btn-bg-color: ${sg.btnBgColor || sg.linkColor || '#c87a57'};
        --brand-btn-text-color: ${sg.btnTextColor || '#ffffff'};
        --brand-btn-border-radius: ${sg.btnRadiusTop ?? 12}px;
        --brand-btn-hover-bg-color: ${sg.btnHoverBgColor || '#b36443'};
        --brand-btn-hover-text-color: ${sg.btnHoverTextColor || '#ffffff'};
        --brand-btn-margin-top: ${sg.btnMarginTop ?? 0}${sg.btnMarginUnit || 'px'};
        --brand-btn-margin-right: ${sg.btnMarginRight ?? 0}${sg.btnMarginUnit || 'px'};
        --brand-btn-margin-bottom: ${sg.btnMarginBottom ?? 16}${sg.btnMarginUnit || 'px'};
        --brand-btn-margin-left: ${sg.btnMarginLeft ?? 0}${sg.btnMarginUnit || 'px'};
        --brand-btn-padding-top: ${sg.btnPaddingTop ?? 14}${sg.btnPaddingUnit || 'px'};
        --brand-btn-padding-right: ${sg.btnPaddingRight ?? 28}${sg.btnPaddingUnit || 'px'};
        --brand-btn-padding-bottom: ${sg.btnPaddingBottom ?? 14}${sg.btnPaddingUnit || 'px'};
        --brand-btn-padding-left: ${sg.btnPaddingLeft ?? 28}${sg.btnPaddingUnit || 'px'};

        --brand-field-font-family: ${fieldTypo.family || sg.defaultFont || "'Inter', sans-serif"};
        --brand-field-font-size: ${fieldTypo.size || 14}px;
        --brand-field-bg-color: ${sg.fieldBgColor || '#ffffff'};
        --brand-field-text-color: ${sg.fieldTextColor || '#111827'};
        --brand-field-border-color: ${fieldBorder.color || '#d1d5db'};
        --brand-field-border-radius: ${sg.fieldRadiusTop ?? 8}px;
        --brand-field-margin-top: ${sg.fieldMarginTop ?? 0}${sg.fieldMarginUnit || 'px'};
        --brand-field-margin-right: ${sg.fieldMarginRight ?? 0}${sg.fieldMarginUnit || 'px'};
        --brand-field-margin-bottom: ${sg.fieldMarginBottom ?? 12}${sg.fieldMarginUnit || 'px'};
        --brand-field-margin-left: ${sg.fieldMarginLeft ?? 0}${sg.fieldMarginUnit || 'px'};
        --brand-field-padding-top: ${sg.fieldPaddingTop ?? 12}${sg.fieldPaddingUnit || 'px'};
        --brand-field-padding-right: ${sg.fieldPaddingRight ?? 16}${sg.fieldPaddingUnit || 'px'};
        --brand-field-padding-bottom: ${sg.fieldPaddingBottom ?? 12}${sg.fieldPaddingUnit || 'px'};
        --brand-field-padding-left: ${sg.fieldPaddingLeft ?? 16}${sg.fieldPaddingUnit || 'px'};

        --brand-container-width: ${sg.containerWidth === '100%' || String(sg.containerWidth).endsWith('%') ? '100%' : `${sg.containerWidth ?? 1200}${sg.containerWidthUnit || 'px'}`};
        --brand-container-margin-top: ${sg.containerMarginTop ?? 0}${sg.containerMarginUnit || 'px'};
        --brand-container-margin-right: ${sg.containerMarginRight ?? 'auto'};
        --brand-container-margin-bottom: ${sg.containerMarginBottom ?? 0}${sg.containerMarginUnit || 'px'};
        --brand-container-margin-left: ${sg.containerMarginLeft ?? 'auto'};
        --brand-container-padding-top: ${sg.containerPaddingTop ?? 48}${sg.containerPaddingUnit || 'px'};
        --brand-container-padding-right: ${sg.containerPaddingRight ?? 24}${sg.containerPaddingUnit || 'px'};
        --brand-container-padding-bottom: ${sg.containerPaddingBottom ?? 48}${sg.containerPaddingUnit || 'px'};
        --brand-container-padding-left: ${sg.containerPaddingLeft ?? 24}${sg.containerPaddingUnit || 'px'};

        --brand-element-gap-x: ${sg.elementGapX ?? 24}${sg.elementGapUnit || 'px'};
        --brand-element-gap-y: ${sg.elementGapY ?? 24}${sg.elementGapUnit || 'px'};

        --brand-quote-padding-top: ${qPTop}${sg.quotePaddingUnit || 'px'};
        --brand-quote-padding-right: ${qPRight}${sg.quotePaddingUnit || 'px'};
        --brand-quote-padding-bottom: ${qPBot}${sg.quotePaddingUnit || 'px'};
        --brand-quote-padding-left: ${qPLeft}${sg.quotePaddingUnit || 'px'};
        --brand-quote-border-width: ${sg.quoteBorderWidth ?? 4}px;
        --brand-quote-border-color: ${sg.quoteBorderColor || sg.linkColor || '#6EC1E4'};
        --brand-quote-bg-color: ${sg.quoteBgColor || 'rgba(99,102,241,0.06)'};
        --brand-quote-text-color: ${sg.quoteTextColor || sg.textColor || '#1f2937'};
        --brand-quote-border-radius: ${sg.quoteBorderRadius || '0 8px 8px 0'};
        --brand-quote-font-style: ${sg.quoteFontStyle || 'italic'};
        --brand-quote-font-weight: ${sg.quoteFontWeight || '400'};
        --brand-quote-cite-weight: ${sg.quoteCiteWeight || '700'};
        --brand-quote-cite-style: ${sg.quoteCiteStyle || 'normal'};

        --brand-bullet-gap: ${sg.bulletGap ?? 8}px;
        --brand-bullet-icon-color: ${sg.bulletIconColor || sg.linkColor || '#16a34a'};

        --brand-img-border-radius: ${sg.imgBorderRadius ?? 8}px;
        --brand-img-shadow: ${sg.imgShadow || '0 4px 12px rgba(0,0,0,0.1)'};

        --brand-video-border-radius: ${sg.videoBorderRadius ?? 12}px;
        --brand-video-shadow: ${sg.videoShadow || '0 10px 25px rgba(0,0,0,0.2)'};

        --brand-divider-width: ${sg.dividerWidth ?? 1}px;
        --brand-divider-style: ${sg.dividerStyle || 'solid'};
        --brand-divider-color: ${sg.dividerColor || '#e5e7eb'};
        --brand-divider-margin-top: ${sg.dividerMarginTop ?? 24}px;
        --brand-divider-margin-bottom: ${sg.dividerMarginBottom ?? 24}px;

        --brand-spacer-height: ${sg.spacerHeight ?? 40}px;

        --brand-timer-padding: ${sg.timerPadding ?? 16}px;
        --brand-timer-border-radius: ${sg.timerBorderRadius ?? 12}px;
        --brand-timer-font-size: ${sg.timerFontSize ?? 24}px;
        --brand-timer-font-weight: ${sg.timerFontWeight ?? 700};
        --brand-timer-bg-color: ${sg.timerBgColor || '#fef2f2'};
        --brand-timer-border-color: ${sg.timerBorderColor || '#fca5a5'};
        --brand-timer-text-color: ${sg.timerTextColor || '#dc2626'};

        --brand-col-padding-top: ${sg.colPaddingTop ?? 0}${sg.colPaddingUnit || 'px'};
        --brand-col-padding-right: ${sg.colPaddingRight ?? 0}${sg.colPaddingUnit || 'px'};
        --brand-col-padding-bottom: ${sg.colPaddingBottom ?? 0}${sg.colPaddingUnit || 'px'};
        --brand-col-padding-left: ${sg.colPaddingLeft ?? 0}${sg.colPaddingUnit || 'px'};
        --brand-col-margin-top: ${sg.colMarginTop ?? 0}${sg.colMarginUnit || 'px'};
        --brand-col-margin-right: ${sg.colMarginRight ?? 0}${sg.colMarginUnit || 'px'};
        --brand-col-margin-bottom: ${sg.colMarginBottom ?? 0}${sg.colMarginUnit || 'px'};
        --brand-col-margin-left: ${sg.colMarginLeft ?? 0}${sg.colMarginUnit || 'px'};
    `;
};

export const collectElementCss = (rawItem, cssRules, tabletRules, mobileRules) => {
    if (!rawItem || !rawItem.id) return;
    const item = sanitizeElementForBrandInheritance(rawItem);
    const id = `el-${item.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

    const buildDeviceRuleList = (dObj) => {
        if (!dObj) return [];
        const r = [];
        if (dObj.containerWidth) {
            const cwUnit = dObj.containerWidthUnit || 'px';
            const cw = dObj.containerWidth;
            const mw = cw === '100%' || String(cw).endsWith('%') ? '100%' : `${cw}${cwUnit}`;
            r.push(`max-width:${mw}`);
            r.push(`margin-left:auto`);
            r.push(`margin-right:auto`);
        }
        const u = (key, def = 'px') => dObj[`${key}Unit`] || def;
        const pU = u('padding', 'px');
        const mU = u('margin', 'px');

        const hasPad = dObj.paddingTop !== undefined || dObj.paddingRight !== undefined || dObj.paddingBottom !== undefined || dObj.paddingLeft !== undefined || dObj.paddingY !== undefined || dObj.paddingX !== undefined;
        if (hasPad) {
            const pTop = dObj.paddingTop !== undefined ? `${dObj.paddingTop}${u('paddingTop', pU)}` : (dObj.paddingY !== undefined ? `${dObj.paddingY}${pU}` : '0px');
            const pRight = dObj.paddingRight !== undefined ? `${dObj.paddingRight}${u('paddingRight', pU)}` : (dObj.paddingX !== undefined ? `${dObj.paddingX}${pU}` : '0px');
            const pBottom = dObj.paddingBottom !== undefined ? `${dObj.paddingBottom}${u('paddingBottom', pU)}` : (dObj.paddingY !== undefined ? `${dObj.paddingY}${pU}` : '0px');
            const pLeft = dObj.paddingLeft !== undefined ? `${dObj.paddingLeft}${u('paddingLeft', pU)}` : (dObj.paddingX !== undefined ? `${dObj.paddingX}${pU}` : '0px');
            r.push(`padding:${pTop} ${pRight} ${pBottom} ${pLeft}`);
        }

        const hasMar = dObj.marginTop !== undefined || dObj.marginRight !== undefined || dObj.marginBottom !== undefined || dObj.marginLeft !== undefined;
        if (hasMar) {
            const mTop = dObj.marginTop !== undefined ? `${dObj.marginTop}${u('marginTop', mU)}` : '0px';
            const mRight = dObj.marginRight !== undefined ? `${dObj.marginRight}${u('marginRight', mU)}` : '0px';
            const mBottom = dObj.marginBottom !== undefined ? `${dObj.marginBottom}${u('marginBottom', mU)}` : '0px';
            const mLeft = dObj.marginLeft !== undefined ? `${dObj.marginLeft}${u('marginLeft', mU)}` : '0px';
            r.push(`margin:${mTop} ${mRight} ${mBottom} ${mLeft}`);
        }
        if (dObj.fontSize)      r.push(`font-size:${dObj.fontSize}${u('fontSize', 'px')}`);
        if (dObj.lineHeight)    r.push(`line-height:${dObj.lineHeight}${u('lineHeight', 'px')}`);
        if (dObj.fontFamily)    r.push(`font-family:${dObj.fontFamily}`);
        if (dObj.fontWeight)    r.push(`font-weight:${dObj.fontWeight}`);
        if (dObj.letterSpacing !== undefined) r.push(`letter-spacing:${dObj.letterSpacing}${u('letterSpacing', 'px')}`);
        if (dObj.wordSpacing !== undefined)   r.push(`word-spacing:${dObj.wordSpacing}${u('wordSpacing', 'px')}`);
        if (dObj.textTransform) r.push(`text-transform:${dObj.textTransform}`);
        if (dObj.fontStyle)     r.push(`font-style:${dObj.fontStyle}`);
        if (dObj.textDecoration)r.push(`text-decoration:${dObj.textDecoration}`);
        if (dObj.textColor)     r.push(`color:${dObj.textColor}`);
        
        // Background
        const bgType = dObj.bgType || 'solid';
        if (bgType === 'gradient') {
            const gType = dObj.gradientType || 'linear';
            const angle = dObj.gradientAngle !== undefined ? dObj.gradientAngle : 135;
            const rawStops = dObj.gradientStops || [
                { color: dObj.gradientColor1 || '#6366f1', pos: 0 },
                { color: dObj.gradientColor2 || '#ec4899', pos: 100 },
            ];
            const stopsStr = [...rawStops].sort((a,b)=>a.pos-b.pos).map(s=>`${s.color} ${s.pos}%`).join(', ');
            const grad = gType === 'radial'
                ? `radial-gradient(circle, ${stopsStr})`
                : `linear-gradient(${angle}deg, ${stopsStr})`;
            r.push(`background-image:${grad}`);
        } else if (bgType === 'image') {
            if (dObj.bgImage) {
                const overlay = dObj.bgOverlay;
                const img = overlay
                    ? `linear-gradient(${overlay}, ${overlay}), url(${dObj.bgImage})`
                    : `url(${dObj.bgImage})`;
                r.push(`background-image:${img}`);
                r.push(`background-size:${dObj.bgSize || 'cover'}`);
                r.push(`background-position:${dObj.bgPosition || 'center center'}`);
                r.push(`background-repeat:${dObj.bgRepeat || 'no-repeat'}`);
            }
        } else {
            if (dObj.bgColor)  r.push(`background-color:${dObj.bgColor}`);
        }
        if (dObj.alignment)     r.push(`text-align:${dObj.alignment}`);

        // Border Radius
        if (dObj.borderRadiusTL !== undefined || dObj.borderRadiusTR !== undefined || dObj.borderRadiusBL !== undefined || dObj.borderRadiusBR !== undefined) {
            const tl = dObj.borderRadiusTL !== undefined ? dObj.borderRadiusTL : (dObj.borderRadius || 0);
            const tr = dObj.borderRadiusTR !== undefined ? dObj.borderRadiusTR : (dObj.borderRadius || 0);
            const bl = dObj.borderRadiusBL !== undefined ? dObj.borderRadiusBL : (dObj.borderRadius || 0);
            const br = dObj.borderRadiusBR !== undefined ? dObj.borderRadiusBR : (dObj.borderRadius || 0);
            r.push(`border-radius:${tl}px ${tr}px ${br}px ${bl}px`);
        } else if (dObj.borderRadius !== undefined) {
            r.push(`border-radius:${dObj.borderRadius}px`);
        }

        // Borders
        if (dObj.borderStyle && dObj.borderStyle !== 'none') {
            const bw = dObj.borderWidth !== undefined ? dObj.borderWidth : 1;
            const bc = dObj.borderColor || '#d1d5db';
            r.push(`border:${bw}px ${dObj.borderStyle} ${bc}`);
        } else if (dObj.borderStyle === 'none') {
            r.push('border:none');
        }

        // Box Shadow
        if (dObj.shadowColor || dObj.shadowH !== undefined || dObj.shadowV !== undefined || dObj.shadowBlur !== undefined) {
            const pos = dObj.shadowPosition === 'inset' ? 'inset ' : '';
            const shColor = dObj.shadowColor || 'rgba(0,0,0,0.1)';
            const shH = dObj.shadowH !== undefined ? dObj.shadowH : 0;
            const shV = dObj.shadowV !== undefined ? dObj.shadowV : 4;
            const shB = dObj.shadowBlur !== undefined ? dObj.shadowBlur : 8;
            const shS = dObj.shadowSpread !== undefined ? dObj.shadowSpread : 0;
            r.push(`box-shadow:${pos}${shH}px ${shV}px ${shB}px ${shS}px ${shColor}`);
        } else if (dObj.shadow) {
            if (dObj.shadow === 'none') r.push('box-shadow:none');
            if (dObj.shadow === 'sm')   r.push('box-shadow:0 1px 3px rgba(0,0,0,0.1)');
            if (dObj.shadow === 'md')   r.push('box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)');
            if (dObj.shadow === 'lg')   r.push('box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)');
            if (dObj.shadow === 'glow') r.push('box-shadow:0 0 15px rgba(200,122,87,0.5)');
        }

        // Layout Engine: Flexbox vs Grid vs Block
        if (dObj.width !== undefined) r.push(`width:${dObj.width}${dObj.widthUnit || '%'}`);
        if (dObj.minHeight !== undefined && dObj.minHeight !== '') r.push(`min-height:${dObj.minHeight}${dObj.minHeightUnit || 'px'}`);

        if (dObj.layoutMode === 'grid') {
            r.push('display:grid');
            if (dObj.gridColumns !== undefined) {
                const rawUnit = dObj.gridColumnsUnit || '1fr';
                const unit = rawUnit === 'fr' ? '1fr' : rawUnit;
                const gc = typeof dObj.gridColumns === 'number' ? `repeat(${dObj.gridColumns}, ${unit})` : dObj.gridColumns;
                r.push(`grid-template-columns:${gc}`);
            } else {
                const cols = dObj.gridPreset === 'custom'
                    ? (dObj.gridTemplateColumns || 'repeat(2, 1fr)')
                    : (dObj.gridPreset || 'repeat(2, 1fr)');
                r.push(`grid-template-columns:${cols}`);
            }
            if (dObj.gridRows !== undefined) {
                const rawRowUnit = dObj.gridRowsUnit || '1fr';
                const rowUnit = rawRowUnit === 'fr' ? '1fr' : rawRowUnit;
                const gr = typeof dObj.gridRows === 'number' ? `repeat(${dObj.gridRows}, ${rowUnit})` : dObj.gridRows;
                r.push(`grid-template-rows:${gr}`);
            }
            if (dObj.justifyItems) r.push(`justify-items:${dObj.justifyItems}`);
            if (dObj.alignItems) r.push(`align-items:${dObj.alignItems}`);
            if (dObj.gridAutoFlow) r.push(`grid-auto-flow:${dObj.gridAutoFlow}`);
        } else if (dObj.layoutMode === 'flex') {
            r.push('display:flex');
            if (dObj.flexDirection) r.push(`flex-direction:${dObj.flexDirection}`);
            if (dObj.flexWrap) r.push(`flex-wrap:${dObj.flexWrap}`);
            if (dObj.justifyContent) r.push(`justify-content:${dObj.justifyContent}`);
            if (dObj.alignItems) r.push(`align-items:${dObj.alignItems}`);
            if (dObj.gap !== undefined) r.push(`gap:${dObj.gap}px`);
        } else if (dObj.layoutMode === 'block') {
            r.push('display:block');
        }

        return r;
    };

    // Desktop
    const desktopRules = buildDeviceRuleList(item);
    if (desktopRules.length > 0) {
        cssRules.push(`#${id} { ${desktopRules.join('; ')}; }`);
    }

    // Sub-component rules
    if (item.type === 'faq_accordion') {
        if (item.itemBorderColor) cssRules.push(`#${id} .faq-item { border-color: ${item.itemBorderColor}; }`);
        if (item.qColor)          cssRules.push(`#${id} .faq-toggle { color: ${item.qColor}; }`);
        if (item.qBgColor)        cssRules.push(`#${id} .faq-toggle { background: ${item.qBgColor}; }`);
        if (item.qFontSize)       cssRules.push(`#${id} .faq-toggle { font-size: ${item.qFontSize}px; }`);
        if (item.qFontWeight)     cssRules.push(`#${id} .faq-toggle { font-weight: ${item.qFontWeight}; }`);
        if (item.aColor)          cssRules.push(`#${id} .faq-answer { color: ${item.aColor}; }`);
        if (item.aBgColor)        cssRules.push(`#${id} .faq-answer { background: ${item.aBgColor}; }`);
        if (item.aFontSize)       cssRules.push(`#${id} .faq-answer { font-size: ${item.aFontSize}px; }`);
        if (item.aLineHeight)     cssRules.push(`#${id} .faq-answer { line-height: ${item.aLineHeight}; }`);
        if (item.iconColor)       cssRules.push(`#${id} .faq-icon { color: ${item.iconColor}; }`);
    }

    if (item.type === 'testimonial_slider') {
        if (item.cardBgColor)     cssRules.push(`#${id} .testimonial-card { background: ${item.cardBgColor}; }`);
        if (item.cardBorderColor) cssRules.push(`#${id} .testimonial-card { border-color: ${item.cardBorderColor}; }`);
        if (item.quoteColor)       cssRules.push(`#${id} blockquote { color: ${item.quoteColor}; }`);
        if (item.quoteFontSize)    cssRules.push(`#${id} blockquote { font-size: ${item.quoteFontSize}px; }`);
        if (item.authorColor)      cssRules.push(`#${id} p { color: ${item.authorColor}; }`);
        if (item.authorFontSize)   cssRules.push(`#${id} p { font-size: ${item.authorFontSize}px; }`);
        if (item.arrowBgColor)     cssRules.push(`#${id} .slider-prev, #${id} .slider-next { background: ${item.arrowBgColor}; }`);
    }

    if (item.type === 'order_bump') {
        if (item.boxBgColor)      cssRules.push(`#${id}.funnel-order-bump { background: ${item.boxBgColor}; }`);
        if (item.boxBorderColor)  cssRules.push(`#${id}.funnel-order-bump { border-color: ${item.boxBorderColor}; }`);
        if (item.badgeBgColor)    cssRules.push(`#${id} .bump-badge { background: ${item.badgeBgColor}; }`);
        if (item.badgeTextColor)  cssRules.push(`#${id} .bump-badge { color: ${item.badgeTextColor}; }`);
        if (item.titleColor)      cssRules.push(`#${id} h4 { color: ${item.titleColor}; }`);
        if (item.priceColor)      cssRules.push(`#${id} .bump-price { color: ${item.priceColor}; }`);
    }

    if (item.type === 'icon_box') {
        if (item.boxBgColor)      cssRules.push(`#${id}.funnel-icon-box { background: ${item.boxBgColor}; }`);
        if (item.boxBorderColor)  cssRules.push(`#${id}.funnel-icon-box { border-color: ${item.boxBorderColor}; }`);
        if (item.titleColor)      cssRules.push(`#${id} h3 { color: ${item.titleColor}; }`);
        if (item.descColor)       cssRules.push(`#${id} p { color: ${item.descColor}; }`);
    }

    // Tablet
    if (item.tablet) {
        const tRules = buildDeviceRuleList(item.tablet);
        if (tRules.length > 0) {
            tabletRules.push(`#${id} { ${tRules.join('; ')}; }`);
        }
    }

    // Mobile
    if (item.mobile) {
        const mRules = buildDeviceRuleList(item.mobile);
        if (mRules.length > 0) {
            mobileRules.push(`#${id} { ${mRules.join('; ')}; }`);
        }
    }

    // Recurse into children
    if (item.elements && item.elements.length > 0) {
        item.elements.forEach(child => collectElementCss(child, cssRules, tabletRules, mobileRules));
    }
    if (item.columns && item.columns.length > 0) {
        item.columns.forEach(col => {
            if (col && col.length > 0) {
                col.forEach(child => collectElementCss(child, cssRules, tabletRules, mobileRules));
            }
        });
    }
};

export const compileFullStyleTag = (sections, styleGuide) => {
    const cssRules = [];
    const tabletRules = [];
    const mobileRules = [];

    const rootVars = buildBrandVars(styleGuide);

    cssRules.push(`:root { ${rootVars} }`);
    cssRules.push(`*, *::before, *::after { box-sizing: border-box; }`);
    cssRules.push(`body { margin:0; padding:0; font-family:var(--brand-body-font-family); background-color:${styleGuide?.bgColor || '#f8fafc'}; color:var(--brand-body-color); font-size:var(--brand-body-font-size); line-height:var(--brand-body-line-height); min-height:100vh; }`);
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
    cssRules.push(`.funnel-bullets li::before { content:'✓'; color:var(--brand-bullet-icon-color, var(--color-primary, #16a34a)); font-weight:700; margin-right:4px; }`);
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

    (sections || []).forEach(sec => collectElementCss(sec, cssRules, tabletRules, mobileRules));

    let finalCss = cssRules.join('\n');
    if (tabletRules.length > 0) {
        finalCss += `\n@media (max-width: 1024px) {\n  ${tabletRules.join('\n  ')}\n}`;
    }
    if (mobileRules.length > 0) {
        finalCss += `\n@media (max-width: 768px) {\n  ${mobileRules.join('\n  ')}\n}`;
    }

    return finalCss;
};
