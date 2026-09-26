import { sanitizeElementForBrandInheritance, resolveContentMaxWidth } from './treeUtils';

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

// ── compileSubTargetStyles ──────────────────────────────────────────────────
// Helper: Compile rich sub-target styles (Typography, Background, Border, Radius, Shadow, Padding, Opacity)
export const compileSubTargetStyles = (selector, obj, prefix = '') => {
    if (!obj) return null;
    const k = (prop) => {
        if (!prefix) return prop;
        return `${prefix}${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
    };
    const r = [];

    // Typography
    const fontFam = obj[k('fontFamily')];
    if (fontFam && fontFam !== 'Default') r.push(`font-family: ${fontFam}`);
    const fontSize = obj[k('fontSize')];
    if (fontSize) r.push(`font-size: ${fontSize}${obj[k('fontSizeUnit')] || 'px'}`);
    const fontWeight = obj[k('fontWeight')];
    if (fontWeight && fontWeight !== 'Default') r.push(`font-weight: ${fontWeight}`);
    const fontTrans = obj[k('textTransform')];
    if (fontTrans && fontTrans !== 'Default') r.push(`text-transform: ${fontTrans}`);
    const fontStyle = obj[k('fontStyle')];
    if (fontStyle && fontStyle !== 'Default') r.push(`font-style: ${fontStyle}`);
    const fontDec = obj[k('textDecoration')];
    if (fontDec && fontDec !== 'Default') r.push(`text-decoration: ${fontDec}`);
    const fontLh = obj[k('lineHeight')];
    if (fontLh) r.push(`line-height: ${fontLh}${obj[k('lineHeightUnit')] || 'px'}`);
    const fontLs = obj[k('letterSpacing')];
    if (fontLs !== undefined && fontLs !== 0 && fontLs !== '') r.push(`letter-spacing: ${fontLs}${obj[k('letterSpacingUnit')] || 'px'}`);
    const fontWs = obj[k('wordSpacing')];
    if (fontWs !== undefined && fontWs !== 0 && fontWs !== '') r.push(`word-spacing: ${fontWs}${obj[k('wordSpacingUnit')] || 'px'}`);

    // Text Color
    const textColor = obj[k('textColor')] || obj[k('color')];
    if (textColor) r.push(`color: ${textColor}`);

    // Background (Solid, Gradient, Image)
    const bgType = obj[k('bgType')] || (obj[k('bgColor')] ? 'solid' : undefined);
    if (bgType === 'gradient') {
        const gType = obj[k('gradientType')] || 'linear';
        const angle = obj[k('gradientAngle')] !== undefined ? obj[k('gradientAngle')] : 135;
        const rawStops = obj[k('gradientStops')] || [
            { color: obj[k('gradientColor1')] || '#6366f1', pos: 0 },
            { color: obj[k('gradientColor2')] || '#ec4899', pos: 100 },
        ];
        const stopsStr = [...rawStops].sort((a,b)=>a.pos-b.pos).map(s=>`${s.color} ${s.pos}%`).join(', ');
        const grad = gType === 'radial'
            ? `radial-gradient(circle, ${stopsStr})`
            : `linear-gradient(${angle}deg, ${stopsStr})`;
        r.push(`background-image: ${grad}`);
    } else if (bgType === 'image') {
        const imgUrl = obj[k('bgImage')];
        if (imgUrl) {
            const overlay = obj[k('bgOverlay')];
            const img = overlay
                ? `linear-gradient(${overlay}, ${overlay}), url(${imgUrl})`
                : `url(${imgUrl})`;
            r.push(`background-image: ${img}`);
            r.push(`background-size: ${obj[k('bgSize')] || 'cover'}`);
            r.push(`background-position: ${obj[k('bgPosition')] || 'center center'}`);
            r.push(`background-repeat: ${obj[k('bgRepeat')] || 'no-repeat'}`);
        }
    } else if (bgType === 'solid' && obj[k('bgColor')]) {
        r.push(`background-color: ${obj[k('bgColor')]}`);
        r.push(`background-image: none`);
    }

    // Border
    const bStyle = obj[k('borderStyle')];
    if (bStyle && bStyle !== 'none' && bStyle !== 'Default') {
        const bw = obj[k('borderWidth')] !== undefined ? obj[k('borderWidth')] : 1;
        const bc = obj[k('borderColor')] || '#d1d5db';
        r.push(`border: ${bw}px ${bStyle} ${bc}`);
    } else if (bStyle === 'none') {
        r.push(`border: none`);
    }

    // Border Radius
    const tl = obj[k('borderRadiusTL')];
    const tr = obj[k('borderRadiusTR')];
    const bl = obj[k('borderRadiusBL')];
    const br = obj[k('borderRadiusBR')];
    const rad = obj[k('borderRadius')] ?? obj[k('radius')];
    if (tl !== undefined || tr !== undefined || bl !== undefined || br !== undefined) {
        r.push(`border-radius: ${tl ?? rad ?? 0}px ${tr ?? rad ?? 0}px ${br ?? rad ?? 0}px ${bl ?? rad ?? 0}px`);
    } else if (rad !== undefined) {
        r.push(`border-radius: ${rad}px`);
    }

    // Shadow
    const shColor = obj[k('shadowColor')];
    if (shColor || obj[k('shadowH')] !== undefined || obj[k('shadowV')] !== undefined || obj[k('shadowBlur')] !== undefined) {
        const pos = obj[k('shadowPosition')] === 'inset' ? 'inset ' : '';
        const c = shColor || 'rgba(0,0,0,0.15)';
        const h = obj[k('shadowH')] !== undefined ? obj[k('shadowH')] : 0;
        const v = obj[k('shadowV')] !== undefined ? obj[k('shadowV')] : 4;
        const b = obj[k('shadowBlur')] !== undefined ? obj[k('shadowBlur')] : 8;
        const s = obj[k('shadowSpread')] !== undefined ? obj[k('shadowSpread')] : 0;
        r.push(`box-shadow: ${pos}${h}px ${v}px ${b}px ${s}px ${c}`);
    }

    // Opacity
    const opacity = obj[k('opacity')];
    if (opacity !== undefined && opacity !== '' && Number(opacity) < 1) {
        r.push(`opacity: ${opacity}`);
    }

    // Padding
    const pU = obj[k('paddingUnit')] || 'px';
    const pTop = obj[k('paddingTop')];
    const pRight = obj[k('paddingRight')];
    const pBottom = obj[k('paddingBottom')];
    const pLeft = obj[k('paddingLeft')];
    const pY = obj[k('paddingY')] ?? obj[k('padding')];
    const pX = obj[k('paddingX')] ?? obj[k('padding')];
    if (pTop !== undefined || pRight !== undefined || pBottom !== undefined || pLeft !== undefined || pY !== undefined || pX !== undefined) {
        const t = pTop !== undefined ? `${pTop}${pU}` : (pY !== undefined ? `${pY}${pU}` : '0px');
        const ri = pRight !== undefined ? `${pRight}${pU}` : (pX !== undefined ? `${pX}${pU}` : '0px');
        const b = pBottom !== undefined ? `${pBottom}${pU}` : (pY !== undefined ? `${pY}${pU}` : '0px');
        const l = pLeft !== undefined ? `${pLeft}${pU}` : (pX !== undefined ? `${pX}${pU}` : '0px');
        r.push(`padding: ${t} ${ri} ${b} ${l}`);
    }

    // Gap / Top Spacing
    const gap = obj[k('gap')];
    if (gap !== undefined) {
        r.push(`margin-top: ${gap}px`);
    }

    if (r.length === 0) return null;
    return `${selector} { ${r.join('; ')}; }`;
};

export const deduplicateRules = (ruleList) => {
    if (!ruleList || !Array.isArray(ruleList)) return [];
    const map = new Map();
    for (const ruleStr of ruleList) {
        if (!ruleStr) continue;
        const parts = ruleStr.split(';');
        for (const p of parts) {
            const trimmed = p.trim();
            if (!trimmed) continue;
            const colonIdx = trimmed.indexOf(':');
            if (colonIdx !== -1) {
                const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
                const val = trimmed.slice(colonIdx + 1).trim();
                map.set(prop, val);
            }
        }
    }
    // Shorthand conflict cleanup to prevent strikethroughs in DevTools
    if (map.has('margin')) {
        map.delete('margin-top');
        map.delete('margin-right');
        map.delete('margin-bottom');
        map.delete('margin-left');
    }
    if (map.has('padding')) {
        map.delete('padding-top');
        map.delete('padding-right');
        map.delete('padding-bottom');
        map.delete('padding-left');
    }
    return Array.from(map.entries()).map(([k, v]) => `${k}: ${v}`);
};

export const collectElementCss = (rawItem, cssRules, tabletRules, mobileRules) => {
    if (!rawItem || !rawItem.id) return;
    const item = sanitizeElementForBrandInheritance(rawItem);
    const id = `el-${item.id.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

    const buildDeviceRuleList = (dObj, overrideType = item.type) => {
        if (!dObj) return [];
        const r = [];
        const isRowType = ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(overrideType);
        if (isRowType) {
            const mw = resolveContentMaxWidth(dObj);
            if (mw) {
                r.push(`--row-max-width:${mw}`);
            }
        } else if (dObj.containerWidth && overrideType !== 'section' && overrideType !== 'col' && overrideType !== 'column') {
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

        // Transform & Effects (Opacity, 2D Transforms, Backdrop Blur)
        if (dObj.opacity !== undefined && dObj.opacity !== '' && Number(dObj.opacity) < 1) {
            r.push(`opacity:${dObj.opacity}`);
        }
        const transforms = [];
        if (dObj.rotate !== undefined && dObj.rotate !== 0 && dObj.rotate !== '') {
            transforms.push(`rotate(${dObj.rotate}deg)`);
        }
        if (dObj.scale !== undefined && dObj.scale !== 1 && dObj.scale !== '') {
            transforms.push(`scale(${dObj.scale})`);
        }
        if (dObj.translateX !== undefined && dObj.translateX !== 0 && dObj.translateX !== '') {
            transforms.push(`translateX(${dObj.translateX}px)`);
        }
        if (dObj.translateY !== undefined && dObj.translateY !== 0 && dObj.translateY !== '') {
            transforms.push(`translateY(${dObj.translateY}px)`);
        }
        if (transforms.length > 0) {
            r.push(`transform:${transforms.join(' ')}`);
        }
        if (dObj.backdropBlur !== undefined && Number(dObj.backdropBlur) > 0) {
            r.push(`backdrop-filter:blur(${dObj.backdropBlur}px)`);
            r.push(`-webkit-backdrop-filter:blur(${dObj.backdropBlur}px)`);
        }

        // Positioning (Sticky Top / Sticky Bottom / Fixed)
        if (dObj.positionType === 'sticky_top') {
            r.push('position:sticky');
            r.push(`top:${dObj.stickyOffset !== undefined ? dObj.stickyOffset : 0}px`);
            r.push(`z-index:${dObj.zIndex || 40}`);
        } else if (dObj.positionType === 'sticky_bottom') {
            r.push('position:sticky');
            r.push(`bottom:${dObj.stickyOffset !== undefined ? dObj.stickyOffset : 0}px`);
            r.push(`z-index:${dObj.zIndex || 40}`);
        } else if (dObj.positionType === 'fixed_bottom') {
            r.push('position:fixed');
            r.push(`bottom:${dObj.stickyOffset !== undefined ? dObj.stickyOffset : 0}px`);
            r.push('left:0');
            r.push('right:0');
            r.push(`z-index:${dObj.zIndex || 40}`);
        }

        // Layout Engine: Flexbox vs Grid vs Block
        if (dObj.width !== undefined) r.push(`width:${dObj.width}${dObj.widthUnit || '%'}`);
        if (dObj.minHeight !== undefined && dObj.minHeight !== '') r.push(`min-height:${dObj.minHeight}${dObj.minHeightUnit || 'px'}`);

        if (dObj.layoutMode === 'grid' || dObj.type === 'grid_container' || isRowType) {
            if (!isRowType) {
                r.push('display:grid');
            }
            if (dObj.gridColumns !== undefined) {
                const rawUnit = dObj.gridColumnsUnit || '1fr';
                const unit = rawUnit === 'fr' ? '1fr' : rawUnit;
                const gc = typeof dObj.gridColumns === 'number' ? `repeat(${dObj.gridColumns}, ${unit})` : dObj.gridColumns;
                if (isRowType) {
                    r.push(`--grid-cols:${gc}`);
                } else {
                    r.push(`grid-template-columns:${gc}`);
                }
            } else if (dObj.columnWidths && Array.isArray(dObj.columnWidths)) {
                const cols = dObj.columnWidths.map(w => `minmax(0, ${w}fr)`).join(' ');
                r.push(`--grid-cols:${cols}`);
            } else if (dObj.gridPreset === 'custom' && dObj.gridTemplateColumns) {
                r.push(`--grid-cols:${dObj.gridTemplateColumns}`);
            } else if (item.type === 'grid_container' && dObj.colsCount) {
                r.push(`--grid-cols-count:${dObj.colsCount}`);
            }
            if (dObj.gridRows !== undefined) {
                const rawRowUnit = dObj.gridRowsUnit || '1fr';
                const rowUnit = rawRowUnit === 'fr' ? '1fr' : rawRowUnit;
                const gr = typeof dObj.gridRows === 'number' ? `repeat(${dObj.gridRows}, ${rowUnit})` : dObj.gridRows;
                r.push(`grid-template-rows:${gr}`);
            }
            if (dObj.justifyItems) {
                if (isRowType) r.push(`--row-justify:${dObj.justifyItems}`);
                else r.push(`justify-items:${dObj.justifyItems}`);
            }
            if (dObj.alignItems) {
                if (isRowType) r.push(`--row-align:${dObj.alignItems}`);
                else r.push(`align-items:${dObj.alignItems}`);
            }
            if (dObj.gridAutoFlow) r.push(`grid-auto-flow:${dObj.gridAutoFlow}`);
        } else if (dObj.layoutMode === 'flex' || dObj.type === 'flex_container') {
            r.push('display:flex');
            if (dObj.flexDirection) r.push(`flex-direction:${dObj.flexDirection}`);
            if (dObj.flexWrap) r.push(`flex-wrap:${dObj.flexWrap}`);
            if (dObj.justifyContent) r.push(`justify-content:${dObj.justifyContent}`);
            if (dObj.alignItems) r.push(`align-items:${dObj.alignItems}`);
        } else if (dObj.layoutMode === 'block') {
            r.push('display:block');
        }

        if (dObj.gap !== undefined) {
            if (isRowType) {
                r.push(`--row-gap:${dObj.gap}px`);
            } else if (dObj.layoutMode === 'grid' || dObj.layoutMode === 'flex' || dObj.type === 'flex_container') {
                r.push(`gap:${dObj.gap}px`);
            }
        }

        // Width Mode
        const effWidthMode = dObj.widthMode || (item.type === 'submit_button' ? dObj.btnWidthMode : undefined);
        const effCustomWidth = dObj.customWidth ?? (item.type === 'submit_button' ? dObj.btnCustomWidth : undefined);
        if (effWidthMode === 'auto') {
            r.push('width:fit-content');
            r.push('max-width:100%');
        } else if (effWidthMode === 'custom' && effCustomWidth) {
            r.push(`width:${effCustomWidth}%`);
            r.push('max-width:100%');
        } else if (effWidthMode === 'full') {
            r.push('width:100%');
        }

        // Flex / Grid Child Positioning
        if (dObj.pushToBottom) {
            r.push('margin-top:auto');
        }
        const effAlignSelf = (dObj.alignSelf && dObj.alignSelf !== 'auto')
            ? dObj.alignSelf
            : (item.type === 'submit_button' && dObj.btnAlign ? (dObj.btnAlign === 'left' ? 'flex-start' : dObj.btnAlign === 'right' ? 'flex-end' : 'center') : undefined);
        if (effAlignSelf) {
            r.push(`align-self:${effAlignSelf}`);
            if (effAlignSelf === 'center') {
                r.push('margin-left:auto');
                r.push('margin-right:auto');
            } else if (effAlignSelf === 'flex-start') {
                r.push('margin-right:auto');
            } else if (effAlignSelf === 'flex-end') {
                r.push('margin-left:auto');
            }
        }
        if (dObj.flexGrow !== undefined && dObj.flexGrow !== 0) {
            r.push(`flex-grow:${dObj.flexGrow}`);
        }
        if (dObj.flexShrink !== undefined && dObj.flexShrink !== 1) {
            r.push(`flex-shrink:${dObj.flexShrink}`);
        }
        if (dObj.flexBasis !== undefined && dObj.flexBasis !== '') {
            r.push(`flex-basis:${dObj.flexBasis}`);
        }
        if (dObj.order !== undefined && dObj.order !== 0) {
            r.push(`order:${dObj.order}`);
        }

        return r;
    };

    const buildHoverRuleList = (dObj) => {
        if (!dObj) return [];
        const r = [];
        if (dObj.hoverTextColor)   r.push(`color:${dObj.hoverTextColor}`);
        
        // Hover Background (Solid / Gradient / Image)
        const hoverBgType = dObj.hoverBgType || (dObj.hoverBgColor ? 'solid' : undefined);
        if (hoverBgType === 'gradient') {
            const gType = dObj.hoverGradientType || 'linear';
            const angle = dObj.hoverGradientAngle !== undefined ? dObj.hoverGradientAngle : 135;
            const rawStops = dObj.hoverGradientStops || [
                { color: dObj.hoverGradientColor1 || dObj.hoverBgColor || '#4f46e5', pos: 0 },
                { color: dObj.hoverGradientColor2 || '#db2777', pos: 100 },
            ];
            const stopsStr = [...rawStops].sort((a,b)=>a.pos-b.pos).map(s=>`${s.color} ${s.pos}%`).join(', ');
            const grad = gType === 'radial'
                ? `radial-gradient(circle, ${stopsStr})`
                : `linear-gradient(${angle}deg, ${stopsStr})`;
            r.push(`background-image:${grad}`);
        } else if (hoverBgType === 'image') {
            const hoverImgUrl = dObj.hoverBgImage;
            if (hoverImgUrl) {
                const overlay = dObj.hoverBgOverlay;
                const img = overlay
                    ? `linear-gradient(${overlay}, ${overlay}), url(${hoverImgUrl})`
                    : `url(${hoverImgUrl})`;
                r.push(`background-image:${img}`);
                r.push(`background-size:${dObj.hoverBgSize || 'cover'}`);
                r.push(`background-position:${dObj.hoverBgPosition || 'center center'}`);
                r.push(`background-repeat:${dObj.hoverBgRepeat || 'no-repeat'}`);
            }
        } else if (hoverBgType === 'solid' && dObj.hoverBgColor) {
            r.push(`background-color:${dObj.hoverBgColor}`);
            r.push('background-image:none');
        }

        if (dObj.hoverOpacity !== undefined && dObj.hoverOpacity !== '') r.push(`opacity:${dObj.hoverOpacity}`);

        // Hover Border
        if (dObj.hoverBorderStyle && dObj.hoverBorderStyle !== 'none' && dObj.hoverBorderStyle !== 'Default') {
            const bw = dObj.hoverBorderWidth !== undefined ? dObj.hoverBorderWidth : 1;
            const bc = dObj.hoverBorderColor || '#d1d5db';
            r.push(`border:${bw}px ${dObj.hoverBorderStyle} ${bc}`);
        }
        if (dObj.hoverBorderRadiusTL !== undefined || dObj.hoverBorderRadiusTR !== undefined || dObj.hoverBorderRadiusBL !== undefined || dObj.hoverBorderRadiusBR !== undefined) {
            const tl = dObj.hoverBorderRadiusTL ?? dObj.hoverBorderRadius ?? 0;
            const tr = dObj.hoverBorderRadiusTR ?? dObj.hoverBorderRadius ?? 0;
            const br = dObj.hoverBorderRadiusBR ?? dObj.hoverBorderRadius ?? 0;
            const bl = dObj.hoverBorderRadiusBL ?? dObj.hoverBorderRadius ?? 0;
            r.push(`border-radius:${tl}px ${tr}px ${br}px ${bl}px`);
        } else if (dObj.hoverBorderRadius !== undefined) {
            r.push(`border-radius:${dObj.hoverBorderRadius}px`);
        }

        // Hover Box Shadow
        if (dObj.hoverShadowColor || dObj.hoverShadowH !== undefined || dObj.hoverShadowV !== undefined || dObj.hoverShadowBlur !== undefined) {
            const pos = dObj.hoverShadowInset ? 'inset ' : '';
            const shColor = dObj.hoverShadowColor || 'rgba(0,0,0,0.15)';
            const shH = dObj.hoverShadowH !== undefined ? dObj.hoverShadowH : 0;
            const shV = dObj.hoverShadowV !== undefined ? dObj.hoverShadowV : 8;
            const shB = dObj.hoverShadowBlur !== undefined ? dObj.hoverShadowBlur : 24;
            const shS = dObj.hoverShadowSpread !== undefined ? dObj.hoverShadowSpread : 0;
            r.push(`box-shadow:${pos}${shH}px ${shV}px ${shB}px ${shS}px ${shColor}`);
        }

        // Hover Animation & Transforms
        const anim = dObj.hoverAnimation || 'none';
        if (anim === 'lift' || dObj.hoverTransformY !== undefined || dObj.hoverTransformX !== undefined) {
            const ty = dObj.hoverTransformY !== undefined ? dObj.hoverTransformY : (anim === 'lift' ? -3 : 0);
            const tx = dObj.hoverTransformX !== undefined ? dObj.hoverTransformX : 0;
            if (tx !== 0 || ty !== 0) {
                r.push(`transform:translate(${tx}px, ${ty}px)`);
            }
        } else if (anim === 'grow') {
            r.push(`transform:scale(${dObj.hoverTransformScale || 1.03})`);
        } else if (anim === 'shrink') {
            r.push('transform:scale(0.97)');
        } else if (anim === 'glow') {
            r.push('box-shadow:0 0 20px var(--color-primary, #3b82f6)');
        } else if (anim === 'pulse') {
            r.push('transform:scale(1.02)');
        }

        return r;
    };

    // User Element Styles (Desktop) - Collected first so sub-component and custom properties can be merged cleanly into a single #id declaration
    const desktopRules = buildDeviceRuleList(item);

    // Sub-component rules
    if (item.type === 'submit_button') {
        if (item.btnFontSize)     cssRules.push(`#${id} .btn-main-text { font-size: ${item.btnFontSize}px; }`);
        if (item.btnFontWeight)   cssRules.push(`#${id} .btn-main-text { font-weight: ${item.btnFontWeight}; }`);
        
        // Subtext Normal & Hover
        const subtextRule = compileSubTargetStyles(`#${id} .btn-subtext`, item, 'subtext');
        if (subtextRule) cssRules.push(subtextRule);
        const subtextHoverRule = compileSubTargetStyles(`#${id}:hover .btn-subtext`, item, 'subtextHover');
        if (subtextHoverRule) cssRules.push(subtextHoverRule);

        // Icon Normal & Hover
        const iconRule = compileSubTargetStyles(`#${id} .btn-icon`, item, 'btnIcon');
        if (iconRule) cssRules.push(iconRule);
        const iconHoverRule = compileSubTargetStyles(`#${id}:hover .btn-icon`, item, 'btnIconHover');
        if (iconHoverRule) cssRules.push(iconHoverRule);

        if (item.btnIconGap !== undefined) {
            const pos = item.btnIconPosition || 'right';
            if (pos === 'left') {
                cssRules.push(`#${id} .btn-icon { margin-right: ${item.btnIconGap}px; }`);
            } else {
                cssRules.push(`#${id} .btn-icon { margin-left: ${item.btnIconGap}px; }`);
            }
        }

        const wMode = item.widthMode || item.btnWidthMode;
        const cWidth = item.customWidth ?? item.btnCustomWidth;
        if (wMode === 'auto') {
            desktopRules.push('width: auto', 'display: inline-flex');
        } else if (wMode === 'custom' && cWidth) {
            desktopRules.push(`width: ${cWidth}%`);
        } else if (wMode === 'full') {
            desktopRules.push('width: 100%', 'display: flex');
        }

        const bAlign = item.alignSelf === 'flex-start' ? 'left' : item.alignSelf === 'flex-end' ? 'right' : item.alignSelf === 'center' ? 'center' : (item.btnAlign || null);
        if (bAlign === 'center') {
            desktopRules.push('margin-left: auto', 'margin-right: auto');
        } else if (bAlign === 'right') {
            desktopRules.push('margin-left: auto', 'margin-right: 0');
        } else if (bAlign === 'left') {
            desktopRules.push('margin-left: 0', 'margin-right: auto');
        }
    }

    if (item.type === 'image') {
        if (item.aspectRatio && item.aspectRatio !== 'auto') {
            desktopRules.push(`aspect-ratio: ${item.aspectRatio}`, `object-fit: ${item.objectFit || 'cover'}`);
        }
        if (item.objectFit && (!item.aspectRatio || item.aspectRatio === 'auto')) {
            desktopRules.push(`object-fit: ${item.objectFit}`);
        }
        if (item.borderRadius !== undefined) {
            desktopRules.push(`border-radius: ${item.borderRadius}px`);
        }
        if (item.hoverEffect === 'zoom-in') {
            desktopRules.push('transition: transform 0.3s ease');
            cssRules.push(`#${id}:hover { transform: scale(1.05); }`);
        } else if (item.hoverEffect === 'lift') {
            desktopRules.push('transition: transform 0.3s ease');
            cssRules.push(`#${id}:hover { transform: translateY(-4px); }`);
        }
    }

    if (item.type === 'faq_accordion') {
        const itemRule = compileSubTargetStyles(`#${id} .faq-item`, item, 'item');
        if (itemRule) cssRules.push(itemRule);
        const itemHoverRule = compileSubTargetStyles(`#${id} .faq-item:hover`, item, 'itemHover');
        if (itemHoverRule) cssRules.push(itemHoverRule);

        const qRule = compileSubTargetStyles(`#${id} .faq-toggle`, item, 'q');
        if (qRule) cssRules.push(qRule);
        const qHoverRule = compileSubTargetStyles(`#${id} .faq-toggle:hover`, item, 'qHover');
        if (qHoverRule) cssRules.push(qHoverRule);

        const aRule = compileSubTargetStyles(`#${id} .faq-answer`, item, 'a');
        if (aRule) cssRules.push(aRule);

        if (item.iconColor) cssRules.push(`#${id} .faq-icon { color: ${item.iconColor}; }`);
        if (item.iconHoverColor) cssRules.push(`#${id} .faq-toggle:hover .faq-icon { color: ${item.iconHoverColor}; }`);
    }

    if (item.type === 'testimonial_slider') {
        const cardRule = compileSubTargetStyles(`#${id} .testimonial-card`, item, 'card');
        if (cardRule) cssRules.push(cardRule);
        const cardHoverRule = compileSubTargetStyles(`#${id} .testimonial-card:hover`, item, 'cardHover');
        if (cardHoverRule) cssRules.push(cardHoverRule);

        const quoteRule = compileSubTargetStyles(`#${id} blockquote`, item, 'quote');
        if (quoteRule) cssRules.push(quoteRule);

        const authorRule = compileSubTargetStyles(`#${id} p`, item, 'author');
        if (authorRule) cssRules.push(authorRule);

        if (item.starColor) cssRules.push(`#${id} .testimonial-card > div:first-child { color: ${item.starColor}; }`);
        if (item.arrowBgColor) cssRules.push(`#${id} .slider-prev, #${id} .slider-next { background: ${item.arrowBgColor}; }`);
        if (item.arrowColor) cssRules.push(`#${id} .slider-prev, #${id} .slider-next { color: ${item.arrowColor}; }`);
    }

    if (item.type === 'quote') {
        const quoteTextRule = compileSubTargetStyles(`#${id} .quote-text`, item, 'quote');
        if (quoteTextRule) cssRules.push(quoteTextRule);
        const quoteAuthorRule = compileSubTargetStyles(`#${id} .quote-author`, item, 'author');
        if (quoteAuthorRule) cssRules.push(quoteAuthorRule);
    }

    if (item.type === 'timer') {
        const digitRule = compileSubTargetStyles(`#${id} .timer-digit`, item, 'digit');
        if (digitRule) cssRules.push(digitRule);
        const digitHoverRule = compileSubTargetStyles(`#${id} .timer-digit:hover`, item, 'digitHover');
        if (digitHoverRule) cssRules.push(digitHoverRule);

        const unitRule = compileSubTargetStyles(`#${id} .timer-label`, item, 'unit');
        if (unitRule) cssRules.push(unitRule);

        const timerBoxRule = compileSubTargetStyles(`#${id}.funnel-timer-wrap`, item, 'timer');
        if (timerBoxRule) cssRules.push(timerBoxRule);
    }

    if (item.type === 'order_bump') {
        const boxRule = compileSubTargetStyles(`#${id}.funnel-order-bump`, item, 'box');
        if (boxRule) cssRules.push(boxRule);

        const badgeRule = compileSubTargetStyles(`#${id} .bump-badge`, item, 'bumpBadge');
        if (badgeRule) cssRules.push(badgeRule);

        const priceRule = compileSubTargetStyles(`#${id} .bump-price`, item, 'bumpPrice');
        if (priceRule) cssRules.push(priceRule);

        const titleRule = compileSubTargetStyles(`#${id} h4`, item, 'title');
        if (titleRule) cssRules.push(titleRule);

        const descRule = compileSubTargetStyles(`#${id} p`, item, 'desc');
        if (descRule) cssRules.push(descRule);
    }

    if (item.type === 'icon_box') {
        const boxRule = compileSubTargetStyles(`#${id}.funnel-icon-box`, item, 'box');
        if (boxRule) cssRules.push(boxRule);
        const boxHoverRule = compileSubTargetStyles(`#${id}.funnel-icon-box:hover`, item, 'boxHover');
        if (boxHoverRule) cssRules.push(boxHoverRule);

        const iconRule = compileSubTargetStyles(`#${id} .icon-wrapper`, item, 'icon');
        if (iconRule) cssRules.push(iconRule);

        const titleRule = compileSubTargetStyles(`#${id} h3`, item, 'title');
        if (titleRule) cssRules.push(titleRule);

        const descRule = compileSubTargetStyles(`#${id} p`, item, 'desc');
        if (descRule) cssRules.push(descRule);
    }

    if (item.type === 'bullets') {
        if (item.itemSpacing !== undefined && String(item.itemSpacing) !== '12') {
            if (!desktopRules.some(r => r.startsWith('gap:'))) {
                desktopRules.push(`gap: ${item.itemSpacing}px`);
            }
        }

        const bulletItemRules = [];
        if (item.bulletIconAlign && item.bulletIconAlign !== 'center') {
            const align = item.bulletIconAlign === 'top' ? 'flex-start' : (item.bulletIconAlign === 'baseline' ? 'baseline' : 'center');
            bulletItemRules.push(`align-items: ${align}`);
        }
        if (item.bulletIconGap !== undefined && String(item.bulletIconGap) !== '10') {
            bulletItemRules.push(`gap: ${item.bulletIconGap}px`);
        }
        if (bulletItemRules.length > 0) {
            cssRules.push(`#${id} .funnel-bullet-item { ${bulletItemRules.join('; ')}; }`);
        }

        // Bullet text: only compile typography and text color (never container border, background, radius, shadow, or padding)
        const textRules = [];
        if (item.fontFamily && item.fontFamily !== 'Default') textRules.push(`font-family: ${item.fontFamily}`);
        if (item.fontSize) textRules.push(`font-size: ${item.fontSize}${item.fontSizeUnit || 'px'}`);
        if (item.fontWeight && item.fontWeight !== 'Default') textRules.push(`font-weight: ${item.fontWeight}`);
        if (item.textTransform && item.textTransform !== 'Default') textRules.push(`text-transform: ${item.textTransform}`);
        if (item.fontStyle && item.fontStyle !== 'Default') textRules.push(`font-style: ${item.fontStyle}`);
        if (item.textDecoration && item.textDecoration !== 'Default') textRules.push(`text-decoration: ${item.textDecoration}`);
        if (item.lineHeight) textRules.push(`line-height: ${item.lineHeight}${item.lineHeightUnit || 'px'}`);
        if (item.letterSpacing !== undefined && item.letterSpacing !== 0 && item.letterSpacing !== '') textRules.push(`letter-spacing: ${item.letterSpacing}${item.letterSpacingUnit || 'px'}`);
        if (item.wordSpacing !== undefined && item.wordSpacing !== 0 && item.wordSpacing !== '') textRules.push(`word-spacing: ${item.wordSpacing}${item.wordSpacingUnit || 'px'}`);
        if (item.textColor) textRules.push(`color: ${item.textColor}`);
        if (textRules.length > 0) {
            cssRules.push(`#${id} .bullet-text { ${textRules.join('; ')}; }`);
        }

        if (item.bulletIconColor) {
            cssRules.push(`#${id} .bullet-icon { color: ${item.bulletIconColor}; }`);
        }
        if (item.bulletIconSize) {
            cssRules.push(`#${id} .bullet-icon { font-size: ${item.bulletIconSize}px; }`);
        }
        if (item.bulletIconHoverColor) {
            cssRules.push(`#${id}:hover .bullet-icon { color: ${item.bulletIconHoverColor}; }`);
        }
        if (item.hoverTextColor) {
            cssRules.push(`#${id}:hover .bullet-text { color: ${item.hoverTextColor}; }`);
        }
    }

    if (item.type === 'star_rating') {
        if (item.starColor)       cssRules.push(`#${id} span { color: ${item.starColor}; }`);
        if (item.starSize)        cssRules.push(`#${id} span { font-size: ${item.starSize}px; }`);
        if (item.ratingTextColor) cssRules.push(`#${id} p { color: ${item.ratingTextColor}; }`);
        if (item.ratingTextSize)  cssRules.push(`#${id} p { font-size: ${item.ratingTextSize}px; }`);
    }

    if (item.type === 'progress_bar') {
        const pct = item.percent !== undefined ? item.percent : (item.percentage !== undefined ? item.percentage : 80);
        cssRules.push(`#${id} .progress-fill { width: ${pct}%; }`);
        if (item.fillColor)   cssRules.push(`#${id} .funnel-progress-bar > div { background: ${item.fillColor}; }`);
        if (item.trackBgColor)cssRules.push(`#${id} .funnel-progress-bar { background-color: ${item.trackBgColor}; }`);
        if (item.barHeight)   cssRules.push(`#${id} .funnel-progress-bar { height: ${item.barHeight}px; }`);
        if (item.barRadius !== undefined) cssRules.push(`#${id} .funnel-progress-bar, #${id} .funnel-progress-bar > div { border-radius: ${item.barRadius}px; }`);
        const labelRule = compileSubTargetStyles(`#${id} .progress-label`, item, 'label');
        if (labelRule) cssRules.push(labelRule);
    }

    if (item.type === 'spacer') {
        const h = item.spacerHeight !== undefined ? item.spacerHeight : ((item.paddingY || 20) * 2);
        cssRules.push(`#${id} { height: ${h}px; }`);
    }

    if (item.type === 'divider') {
        const isVertical = item.dividerType === 'vertical';
        const thickness = item.dividerThickness !== undefined ? item.dividerThickness : 1;
        const style = item.dividerStyle || 'solid';
        const color = item.dividerColor || item.borderColor || '#d1d5db';
        const align = item.alignment || 'center';
        const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

        if (isVertical) {
            const heightVal = item.dividerHeight !== undefined ? `${item.dividerHeight}${item.dividerHeightUnit || 'px'}` : '60px';
            cssRules.push(`#${id}-wrap { display: flex; width: 100%; justify-content: ${justify}; padding: 4px 0; }`);
            cssRules.push(`#${id} { height: ${heightVal}; width: ${thickness}px; border: none; border-left: ${thickness}px ${style} ${color}; }`);
        } else {
            const widthVal = item.dividerWidth !== undefined ? `${item.dividerWidth}${item.dividerWidthUnit || '%'}` : '100%';
            cssRules.push(`#${id}-wrap { display: flex; width: 100%; justify-content: ${justify}; padding: 8px 0; }`);
            cssRules.push(`#${id} { width: ${widthVal}; border: none; border-top: ${thickness}px ${style} ${color}; }`);
        }
    }

    if (item.type === 'two_step_order') {
        const boxRule = compileSubTargetStyles(`#${id}.funnel-two-step-order`, item, 'box');
        if (boxRule) cssRules.push(boxRule);

        if (item.tabActiveBgColor || item.tabActiveTextColor) {
            cssRules.push(`#${id} .two-step-tab-btn.active { background: ${item.tabActiveBgColor || '#ffffff'}; color: ${item.tabActiveTextColor || 'var(--color-primary, #6366f1)'}; border-bottom-color: ${item.tabActiveTextColor || 'var(--color-primary, #6366f1)'}; }`);
            cssRules.push(`#${id} .two-step-tab-btn.active span { background: ${item.tabActiveTextColor || 'var(--color-primary, #6366f1)'}; color: ${item.tabActiveBgColor || '#ffffff'}; }`);
        }
        if (item.tabInactiveBgColor || item.tabInactiveTextColor) {
            cssRules.push(`#${id} .two-step-tab-btn:not(.active) { background: ${item.tabInactiveBgColor || '#f9fafb'}; color: ${item.tabInactiveTextColor || '#6b7280'}; }`);
        }

        const inputRule = compileSubTargetStyles(`#${id} input.funnel-input, #${id} .two-step-name-input, #${id} .two-step-email-input, #${id} .two-step-phone-input, #${id} .two-step-address-input`, item, 'input');
        if (inputRule) cssRules.push(inputRule);
        if (item.labelColor) cssRules.push(`#${id} label { color: ${item.labelColor}; }`);
        if (item.inputFocusBorderColor) cssRules.push(`#${id} input:focus { border-color: ${item.inputFocusBorderColor}; }`);

        const summaryRule = compileSubTargetStyles(`#${id} .two-step-summary-box`, item, 'summary');
        if (summaryRule) cssRules.push(summaryRule);
        if (item.totalPriceColor) cssRules.push(`#${id} .two-step-total-display { color: ${item.totalPriceColor}; }`);

        const btnRule = compileSubTargetStyles(`#${id} .btn-complete-checkout, #${id} .btn-goto-step-2`, item, 'btn');
        if (btnRule) cssRules.push(btnRule);
    }

    if (item.type === 'upsell_box') {
        const boxRule = compileSubTargetStyles(`#${id}.funnel-upsell-box`, item, 'box');
        if (boxRule) cssRules.push(boxRule);

        if (item.badgeBgColor || item.badgeTextColor) {
            cssRules.push(`#${id} .upsell-badge { background: ${item.badgeBgColor || '#fee2e2'}; color: ${item.badgeTextColor || '#dc2626'}; }`);
        }
        if (item.headlineColor) cssRules.push(`#${id} .upsell-headline { color: ${item.headlineColor}; }`);
        if (item.subheadlineColor) cssRules.push(`#${id} .upsell-subheadline { color: ${item.subheadlineColor}; }`);

        const calloutRule = compileSubTargetStyles(`#${id} .upsell-callout`, item, 'callout');
        if (calloutRule) cssRules.push(calloutRule);
        if (item.priceColor) cssRules.push(`#${id} .upsell-special-price { color: ${item.priceColor}; }`);

        const acceptBtnRule = compileSubTargetStyles(`#${id} .btn-upsell-accept`, item, 'acceptBtn');
        if (acceptBtnRule) cssRules.push(acceptBtnRule);
        if (item.declineTextColor) cssRules.push(`#${id} .btn-upsell-decline { color: ${item.declineTextColor}; }`);
    }

    if (item.type === 'pricing_table') {
        const cardRule = compileSubTargetStyles(`#${id} .pricing-card`, item, 'card');
        if (cardRule) cssRules.push(cardRule);

        if (item.featuredCardBorderColor || item.featuredCardBgColor) {
            cssRules.push(`#${id} .pricing-card.featured { border-color: ${item.featuredCardBorderColor || 'var(--color-primary, #4f46e5)'}; background: ${item.featuredCardBgColor || '#ffffff'}; }`);
        }
        if (item.featuredBadgeBgColor || item.featuredBadgeTextColor) {
            cssRules.push(`#${id} .pricing-featured-badge { background: ${item.featuredBadgeBgColor || 'var(--color-primary, #4f46e5)'}; color: ${item.featuredBadgeTextColor || '#ffffff'}; }`);
        }
        if (item.planTitleColor) cssRules.push(`#${id} .pricing-plan-title { color: ${item.planTitleColor}; }`);
        if (item.priceColor) cssRules.push(`#${id} .pricing-amount { color: ${item.priceColor}; }`);

        const btnRule = compileSubTargetStyles(`#${id} .btn-pricing-cta`, item, 'btn');
        if (btnRule) cssRules.push(btnRule);
    }

    if (['input_email', 'input_name', 'input_phone', 'datepicker', 'signature'].includes(item.type)) {
        const labelRule = compileSubTargetStyles(`#${id} label.funnel-field-label`, item, 'label');
        if (labelRule) cssRules.push(labelRule);
        if (item.labelColor) cssRules.push(`#${id} label { color: ${item.labelColor}; }`);

        const inputRule = compileSubTargetStyles(`#${id} input.funnel-input`, item, 'input');
        if (inputRule) cssRules.push(inputRule);
        if (item.inputFocusBorderColor) cssRules.push(`#${id} input.funnel-input:focus { border-color: ${item.inputFocusBorderColor}; }`);

        if (item.type === 'signature') {
            const padRule = compileSubTargetStyles(`#${id} .funnel-signature-pad`, item, 'pad');
            if (padRule) cssRules.push(padRule);
        }
    }

    // Grid Container / Row Column Styles & Mobile Reversal
    if (['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type) || (item.type === 'section' && item.layoutMode === 'grid')) {
        if (item.reverseMobileOrder) {
            mobileRules.push(`#${id} { display: flex; flex-direction: column-reverse; }`);
        }
        if (Array.isArray(item.columnStyles)) {
            item.columnStyles.forEach((cs, cIdx) => {
                if (!cs || typeof cs !== 'object') return;
                const colSel = `#${id} > .funnel-col:nth-child(${cIdx + 1})`;
                const colRules = buildDeviceRuleList(cs, 'col');

                // Legacy fallback checks
                if (cs.bgColor && !colRules.some(r => r.startsWith('background'))) {
                    colRules.push(`background-color:${cs.bgColor}`);
                }
                if (cs.padding !== undefined && cs.padding !== 0 && !colRules.some(r => r.startsWith('padding'))) {
                    colRules.push(`padding:${cs.padding}px`);
                }
                if (cs.borderRadius !== undefined && cs.borderRadius !== 0 && !colRules.some(r => r.startsWith('border-radius'))) {
                    colRules.push(`border-radius:${cs.borderRadius}px`);
                }
                if (cs.borderWidth !== undefined && cs.borderWidth !== 0 && !colRules.some(r => r.startsWith('border'))) {
                    colRules.push(`border:${cs.borderWidth}px solid ${cs.borderColor || '#e5e7eb'}`);
                }
                if (cs.shadow && cs.shadow !== 'none' && !colRules.some(r => r.startsWith('box-shadow'))) {
                    const shadowMap = {
                        sm: '0 1px 3px rgba(0,0,0,0.1)',
                        md: '0 4px 12px rgba(0,0,0,0.08)',
                        lg: '0 10px 25px rgba(0,0,0,0.12)',
                        brand: '0 0 20px rgba(99,102,241,0.3)',
                    };
                    if (shadowMap[cs.shadow]) colRules.push(`box-shadow:${shadowMap[cs.shadow]}`);
                }

                // Column alignment via CSS variables
                if (cs.verticalAlign) {
                    const vJustify = cs.verticalAlign === 'center' ? 'center' : cs.verticalAlign === 'bottom' ? 'flex-end' : cs.verticalAlign === 'space-between' ? 'space-between' : 'flex-start';
                    if (vJustify !== 'flex-start') {
                        colRules.push(`--col-justify:${vJustify}`);
                    }
                }

                if (cs.horizontalAlign && cs.horizontalAlign !== 'stretch') {
                    colRules.push(`--col-align:${cs.horizontalAlign}`);
                }

                if (cs.gap !== undefined && cs.gap !== 0) {
                    colRules.push(`--col-gap:${cs.gap}px`);
                }
                if (colRules.length > 0) {
                    cssRules.push(`${colSel} { ${colRules.join('; ')}; }`);
                }

                if (cs.hasBadge && cs.badgeText) {
                    const badgeBg = cs.badgeBgColor || '#4f46e5';
                    const badgeText = cs.badgeTextColor || '#ffffff';
                    cssRules.push(`${colSel} > .funnel-col-badge { background: ${badgeBg}; color: ${badgeText}; }`);
                }

                // Column hover rules
                const hoverRules = buildHoverRuleList(cs);
                if (hoverRules.length > 0) {
                    cssRules.push(`${colSel}:hover { ${hoverRules.join('; ')}; }`);
                }
            });
        }
    }

    // User Element Styles (Desktop) - Consolidated and deduplicated into a single #${id} rule
    if (item.animationName && item.animationName !== 'none') {
        const dur = item.animationDuration || 600;
        const delay = item.animationDelay || 0;
        const easing = item.animationEasing || 'cubic-bezier(0.16, 1, 0.3, 1)';
        const animMap = {
            fade_in: 'funnelFadeIn',
            fade_up: 'funnelFadeUp',
            fade_down: 'funnelFadeDown',
            fade_left: 'funnelFadeLeft',
            fade_right: 'funnelFadeRight',
            zoom_in: 'funnelZoomIn',
            zoom_out: 'funnelZoomOut',
            bounce_in: 'funnelBounceIn',
            flip_x: 'funnelFlipX',
            pulse: 'funnelPulse',
        };
        const keyframeName = animMap[item.animationName] || item.animationName;
        desktopRules.push(`animation: ${keyframeName} ${dur}ms ${easing} ${delay}ms both`);
    }

    if (desktopRules.length > 0) {
        const transDuration = item.transitionDuration || 200;
        const transTiming = item.transitionTiming || 'cubic-bezier(0.4, 0, 0.2, 1)';
        if (!desktopRules.some(r => r.startsWith('transition:'))) {
            desktopRules.push(`transition: all ${transDuration}ms ${transTiming}`);
        }
        const consolidated = deduplicateRules(desktopRules);
        if (consolidated.length > 0) {
            cssRules.push(`#${id} { ${consolidated.join('; ')}; }`);
        }
    }

    // Inner container rule for Section (Only for optional inner card styles, width is controlled by row)
    if (item.type === 'section' && (item.contentBgColor || item.contentPadding || item.contentBorderRadius || item.contentMaxWidth)) {
        const innerStyles = [];
        if (item.contentMaxWidth) innerStyles.push(`--section-max-width:${item.contentMaxWidth}`);
        if (item.contentBgColor) innerStyles.push(`background-color:${item.contentBgColor}`);
        if (item.contentPadding) innerStyles.push(`padding:${item.contentPadding}px`);
        if (item.contentBorderRadius) innerStyles.push(`border-radius:${item.contentBorderRadius}px`);
        if (innerStyles.length > 0) {
            cssRules.push(`#${id} > .funnel-section-inner { ${innerStyles.join('; ')}; }`);
        }
    }

    // Element Hover Rules
    const hoverRules = buildHoverRuleList(item);
    if (hoverRules.length > 0) {
        cssRules.push(`#${id}:hover { ${hoverRules.join('; ')}; }`);
    }

    // Scoped Custom CSS (highest priority override)
    if (item.customCss && typeof item.customCss === 'string' && item.customCss.trim()) {
        const scoped = item.customCss.replace(/selector/g, `#${id}`).trim();
        cssRules.push(scoped.includes('{') ? scoped : `#${id} { ${scoped} }`);
    }

    // Tablet
    if (item.tablet) {
        const tRules = deduplicateRules(buildDeviceRuleList(item.tablet));
        if (tRules.length > 0) {
            tabletRules.push(`#${id} { ${tRules.join('; ')}; }`);
        }
    }

    // Mobile
    if (item.mobile) {
        const mRules = deduplicateRules(buildDeviceRuleList(item.mobile));
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
    cssRules.push(`
@keyframes funnelFadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes funnelFadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
@keyframes funnelFadeDown { from { opacity:0; transform:translateY(-30px); } to { opacity:1; transform:translateY(0); } }
@keyframes funnelFadeLeft { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
@keyframes funnelFadeRight { from { opacity:0; transform:translateX(-30px); } to { opacity:1; transform:translateX(0); } }
@keyframes funnelZoomIn { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
@keyframes funnelZoomOut { from { opacity:0; transform:scale(1.15); } to { opacity:1; transform:scale(1); } }
@keyframes funnelBounceIn { 0% { opacity:0; transform:scale(0.3); } 50% { opacity:1; transform:scale(1.05); } 70% { transform:scale(0.9); } 100% { transform:scale(1); } }
@keyframes funnelFlipX { from { opacity:0; transform:perspective(400px) rotateX(90deg); } to { opacity:1; transform:perspective(400px) rotateX(0deg); } }
@keyframes funnelPulse { 0%, 100% { transform:scale(1); } 50% { transform:scale(1.05); } }
    `.trim());
    cssRules.push(`*, *::before, *::after { box-sizing: border-box; }`);
    cssRules.push(`body { margin:0; padding:0; font-family:var(--brand-body-font-family); background-color:${styleGuide?.bgColor || '#f8fafc'}; color:var(--brand-body-color); font-size:var(--brand-body-font-size); line-height:var(--brand-body-line-height); min-height:100vh; }`);
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
    cssRules.push(`.funnel-col-badge { position:absolute; top:-12px; left:50%; transform:translateX(-50%); padding:4px 14px; border-radius:9999px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; box-shadow:0 3px 10px rgba(0,0,0,0.15); z-index:15; white-space:nowrap; }`);
    cssRules.push(`.funnel-col-clickable { cursor:pointer; text-decoration:none; color:inherit; display:flex; flex-direction:column; }`);
    cssRules.push(`.funnel-col-clickable:hover { opacity:0.98; }`);
    cssRules.push(`.funnel-hp-check { display:none; visibility:hidden; position:absolute; left:-9999px; }`);
    cssRules.push(`.funnel-timer { padding:var(--brand-timer-padding); background:var(--brand-timer-bg-color); border:1px solid var(--brand-timer-border-color); border-radius:var(--brand-timer-border-radius); text-align:center; font-weight:var(--brand-timer-font-weight); color:var(--brand-timer-text-color); font-family:monospace; font-size:var(--brand-timer-font-size); margin:0 0 16px 0; letter-spacing:2px; }`);
    cssRules.push(`.timer-theme-red_urgent { background:#fef2f2; border:1px solid #fca5a5; color:#dc2626; }`);
    cssRules.push(`.timer-theme-brand { background:rgba(99,102,241,0.08); border:1px solid var(--color-primary, #6EC1E4); color:var(--color-primary, #467235); }`);
    cssRules.push(`.timer-theme-dark { background:#111827; border:1px solid #374151; color:#ffffff; }`);
    cssRules.push(`.timer-theme-light { background:#ffffff; border:1px solid #e5e7eb; color:#111827; box-shadow:0 1px 3px rgba(0,0,0,0.05); }`);
    cssRules.push(`.timer-theme-minimal { background:transparent; border:none; color:var(--color-primary, #111827); padding:0; }`);
    cssRules.push(`.timer-active-wrap { display:flex; align-items:center; justify-content:center; gap:10px; }`);
    cssRules.push(`.timer-expired-wrap { display:none; font-weight:800; letter-spacing:0.5px; color:#dc2626; }`);
    cssRules.push(`.funnel-testimonial-slider { position:relative; margin:0 0 24px 0; }`);
    cssRules.push(`.funnel-testimonial-slider .testimonial-card { display:none; padding:28px 24px; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); transition:all 0.3s ease; }`);
    cssRules.push(`.funnel-testimonial-slider .testimonial-card.active, .funnel-testimonial-slider .testimonial-card:first-child { display:block; }`);
    cssRules.push(`.testimonial-stars { color:#f59e0b; font-size:16px; margin-bottom:8px; }`);
    cssRules.push(`.testimonial-quote { font-style:italic; font-size:14px; color:#1f2937; margin:0 0 12px 0; line-height:1.6; }`);
    cssRules.push(`.testimonial-author-wrap { display:flex; align-items:center; justify-content:center; gap:8px; }`);
    cssRules.push(`.testimonial-avatar { width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid #e5e7eb; }`);
    cssRules.push(`.testimonial-author-info { text-align:left; }`);
    cssRules.push(`.testimonial-author-name { margin:0; font-weight:700; font-size:13px; color:#111827; line-height:1.2; }`);
    cssRules.push(`.testimonial-author-role { margin:0; font-weight:400; font-size:11px; color:#6b7280; }`);
    cssRules.push(`.slider-dot { width:8px; height:8px; border-radius:9999px; border:none; padding:0; cursor:pointer; transition:all 0.2s; background:#e5e7eb; }`);
    cssRules.push(`.slider-dot.active, .slider-dot:first-child { width:20px; background:var(--color-primary, #467235); }`);
    cssRules.push(`.two-step-pane.pane-step-2 { display:none; }`);
    cssRules.push(`.two-step-pane.active { display:block; }`);
    cssRules.push(`.two-step-product-desc { font-size:12px; color:#6b7280; }`);
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
    cssRules.push(`.funnel-btn { width:100%; padding:var(--brand-btn-padding-top) var(--brand-btn-padding-right) var(--brand-btn-padding-bottom) var(--brand-btn-padding-left); margin:var(--brand-btn-margin-top) var(--brand-btn-margin-right) var(--brand-btn-margin-bottom) var(--brand-btn-margin-left); cursor:pointer; border:none; border-radius:var(--brand-btn-border-radius); transition:all 0.2s ease; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; text-decoration:none; }`);
    cssRules.push(`.funnel-btn .btn-icon-wrap { display:inline-flex; align-items:center; gap:8px; }`);
    cssRules.push(`.funnel-btn .btn-subtext { display:block; margin-top:3px; }`);
    cssRules.push(`.funnel-field-label { display:block; margin-bottom:6px; font-size:12px; font-weight:600; color:#374151; }`);
    cssRules.push(`.funnel-signature-pad { border:1px dashed #cbd5e1; border-radius:8px; padding:24px; text-align:center; color:#94a3b8; font-size:13px; background:#f8fafc; }`);
    cssRules.push(`.funnel-input { width:100%; outline:none; transition:border-color 0.2s; padding:12px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; box-sizing:border-box; }`);
    cssRules.push(`.funnel-input:focus { border-color:var(--color-primary, #467235); box-shadow:0 0 0 3px rgba(70,114,53,0.15); }`);
    cssRules.push(`.funnel-checkbox { display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px; }`);
    cssRules.push(`.funnel-divider { border:none; border-top:var(--brand-divider-width) var(--brand-divider-style) var(--brand-divider-color); }`);
    cssRules.push(`.funnel-icon-box { padding:20px; border-radius:16px; background:#ffffff; border:1px solid #f1f5f9; box-shadow:0 1px 3px rgba(0,0,0,0.05); }`);
    cssRules.push(`.funnel-icon-box.is-horizontal { display:flex; flex-direction:row; align-items:flex-start; text-align:left; gap:14px; }`);
    cssRules.push(`.funnel-icon-box.is-vertical { display:flex; flex-direction:column; align-items:center; text-align:center; gap:14px; }`);
    cssRules.push(`.funnel-icon-box .icon-wrapper { background:#eff6ff; width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }`);
    cssRules.push(`.funnel-icon-box .icon-box-body { flex:1; }`);
    cssRules.push(`.funnel-icon-box .icon-box-title { margin:0 0 6px 0; font-size:15px; font-weight:700; color:#0f172a; }`);
    cssRules.push(`.funnel-icon-box .icon-box-desc { margin:0; font-size:13px; color:#64748b; line-height:1.5; }`);
    cssRules.push(`.funnel-icon-box-link { text-decoration:none; color:inherit; display:block; }`);
    cssRules.push(`.funnel-progress-wrap { margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-progress-wrap .progress-label { margin:0 0 4px 0; font-size:12px; font-weight:600; }`);
    cssRules.push(`.funnel-progress-bar { width:100%; height:14px; background:#e5e7eb; border-radius:9999px; overflow:hidden; }`);
    cssRules.push(`.funnel-progress-bar .progress-fill { height:100%; background:var(--color-primary, #467235); transition:width 0.5s; }`);
    cssRules.push(`.funnel-star-rating { text-align:center; margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-star-rating .star-symbols { color:#f59e0b; font-size:20px; letter-spacing:2px; }`);
    cssRules.push(`.funnel-star-rating .star-rating-text { margin:4px 0 0 0; font-size:12px; color:#6b7280; font-weight:600; }`);
    cssRules.push(`.funnel-order-bump { border:2px dashed #f87171; background:#fef2f2; padding:16px; border-radius:12px; margin:0 0 16px 0; }`);
    cssRules.push(`.funnel-order-bump .bump-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }`);
    cssRules.push(`.funnel-order-bump .bump-badge { background:#dc2626; color:#ffffff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; }`);
    cssRules.push(`.funnel-order-bump .bump-price { font-weight:800; color:#991b1b; font-size:14px; }`);
    cssRules.push(`.funnel-order-bump label, .funnel-order-bump .bump-body { display:flex; gap:10px; cursor:pointer; align-items:flex-start; }`);
    cssRules.push(`.funnel-order-bump input[type="checkbox"] { margin-top:3px; width:18px; height:18px; }`);
    cssRules.push(`.funnel-order-bump h4, .funnel-order-bump .bump-title { margin:0; font-size:14px; font-weight:700; color:#111827; }`);
    cssRules.push(`.funnel-order-bump p, .funnel-order-bump .bump-desc { margin:4px 0 0 0; font-size:12px; color:#4b5563; }`);
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
