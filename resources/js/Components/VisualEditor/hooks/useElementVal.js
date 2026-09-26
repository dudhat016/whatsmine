/**
 * useElementVal — resolves the effective value of any element property
 * applying responsive viewport overrides then falling back to the global Brand Style Guide.
 */
export function useElementVal(selectedElement, viewport, styleGuide) {
    const val = (key, defaultVal = '') => {
        if (!selectedElement) return defaultVal;

        // 1. Responsive override (tablet / mobile)
        if (viewport !== 'desktop' && selectedElement[viewport]?.[key] !== undefined) {
            return selectedElement[viewport][key];
        }
        // 2. Element's own property
        if (selectedElement[key] !== undefined) return selectedElement[key];

        // 3. Brand style-guide fallbacks per element type
        const type = selectedElement.type;
        const tag  = selectedElement.headingTag || (type === 'headline' ? 'h1' : 'h2');

        if (['headline', 'subheadline'].includes(type)) {
            if (key === 'textColor')     return styleGuide?.[`${tag}Color`] || styleGuide?.headingColor || '#111827';
            if (key === 'fontFamily')    return styleGuide?.[`${tag}Typography`]?.family || styleGuide?.headingFontName || styleGuide?.defaultFont || "'Inter', sans-serif";
            if (key === 'fontSize')      return styleGuide?.[`${tag}Typography`]?.size || (tag === 'h1' ? 32 : tag === 'h2' ? 24 : tag === 'h3' ? 20 : 18);
            if (key === 'fontWeight')    return styleGuide?.[`${tag}Typography`]?.weight || '700';
            if (key === 'lineHeight')    return styleGuide?.[`${tag}Typography`]?.lineHeight || 36;
            if (key === 'paddingTop')    return styleGuide?.[`${tag}PaddingTop`] ?? 0;
            if (key === 'paddingRight')  return styleGuide?.[`${tag}PaddingRight`] ?? 0;
            if (key === 'paddingBottom') return styleGuide?.[`${tag}PaddingBottom`] ?? 0;
            if (key === 'paddingLeft')   return styleGuide?.[`${tag}PaddingLeft`] ?? 0;
            if (key === 'paddingUnit')   return styleGuide?.[`${tag}PaddingUnit`] || 'px';
            if (key === 'marginTop')     return styleGuide?.[`${tag}MarginTop`] ?? 0;
            if (key === 'marginRight')   return styleGuide?.[`${tag}MarginRight`] ?? 0;
            if (key === 'marginBottom')  return styleGuide?.[`${tag}MarginBottom`] ?? styleGuide?.headingMarginBottom ?? (tag === 'h1' || tag === 'h2' || tag === 'h3' ? 12 : 8);
            if (key === 'marginLeft')    return styleGuide?.[`${tag}MarginLeft`] ?? 0;
            if (key === 'marginUnit')    return styleGuide?.[`${tag}MarginUnit`] || 'px';
        }

        if (['paragraph', 'bullets'].includes(type)) {
            if (key === 'textColor')     return styleGuide?.textColor || '#1f2937';
            if (key === 'fontFamily')    return styleGuide?.bodyTypography?.family || styleGuide?.defaultFont || "'Inter', sans-serif";
            if (key === 'fontSize')      return styleGuide?.bodyTypography?.size || styleGuide?.fontSize || 16;
            if (key === 'lineHeight')    return styleGuide?.bodyTypography?.lineHeight || styleGuide?.lineHeight || 24;
            if (key === 'paddingTop')    return styleGuide?.bodyPaddingTop ?? 0;
            if (key === 'paddingRight')  return styleGuide?.bodyPaddingRight ?? 0;
            if (key === 'paddingBottom') return styleGuide?.bodyPaddingBottom ?? 0;
            if (key === 'paddingLeft')   return styleGuide?.bodyPaddingLeft ?? 0;
            if (key === 'paddingUnit')   return styleGuide?.bodyPaddingUnit || 'px';
            if (key === 'marginTop')     return styleGuide?.bodyMarginTop ?? 0;
            if (key === 'marginRight')   return styleGuide?.bodyMarginRight ?? 0;
            if (key === 'marginBottom')  return styleGuide?.bodyMarginBottom ?? styleGuide?.paragraphMarginBottom ?? 16;
            if (key === 'marginLeft')    return styleGuide?.bodyMarginLeft ?? 0;
            if (key === 'marginUnit')    return styleGuide?.bodyMarginUnit || 'px';
            if (key === 'bulletIconColor') return styleGuide?.bulletIconColor || styleGuide?.linkColor || '#16a34a';
            if (key === 'bulletGap')     return styleGuide?.bulletGap ?? 8;
        }

        if (type === 'submit_button' || type === 'button') {
            const primary = styleGuide?.systemColors?.primary || 'var(--color-primary)';
            if (key === 'textColor')     return styleGuide?.btnTextColor || '#ffffff';
            if (key === 'bgColor')       return styleGuide?.btnBgColor || primary;
            if (key === 'fontFamily')    return styleGuide?.btnTypography?.family || styleGuide?.defaultFont || "'Inter', sans-serif";
            if (key === 'fontSize')      return styleGuide?.btnTypography?.size || 16;
            if (key === 'fontWeight')    return styleGuide?.btnTypography?.weight || '700';
            if (key === 'borderStyle')   return styleGuide?.btnBorder?.type || 'none';
            if (key === 'borderWidth')   return styleGuide?.btnBorder?.width || 1;
            if (key === 'borderColor')   return styleGuide?.btnBorder?.color || '#d1d5db';
            if (['borderRadius', 'borderRadiusTL', 'borderRadiusTR', 'borderRadiusBL', 'borderRadiusBR'].includes(key)) return styleGuide?.btnRadiusTop ?? 12;
            if (key === 'paddingTop')    return styleGuide?.btnPaddingTop ?? 14;
            if (key === 'paddingRight')  return styleGuide?.btnPaddingRight ?? 28;
            if (key === 'paddingBottom') return styleGuide?.btnPaddingBottom ?? 14;
            if (key === 'paddingLeft')   return styleGuide?.btnPaddingLeft ?? 28;
            if (key === 'paddingUnit')   return styleGuide?.btnPaddingUnit || 'px';
            if (key === 'marginTop')     return styleGuide?.btnMarginTop ?? 0;
            if (key === 'marginRight')   return styleGuide?.btnMarginRight ?? 0;
            if (key === 'marginBottom')  return styleGuide?.btnMarginBottom ?? styleGuide?.buttonMarginBottom ?? 16;
            if (key === 'marginLeft')    return styleGuide?.btnMarginLeft ?? 0;
            if (key === 'marginUnit')    return styleGuide?.btnMarginUnit || 'px';
            if (key === 'hoverTextColor')   return styleGuide?.btnHoverTextColor || '#ffffff';
            if (key === 'hoverBgColor')     return styleGuide?.btnHoverBgColor || primary;
            if (key === 'hoverBorderStyle') return styleGuide?.btnHoverBorder?.type || 'none';
            if (key === 'hoverBorderWidth') return styleGuide?.btnHoverBorder?.width || 1;
            if (key === 'hoverBorderColor') return styleGuide?.btnHoverBorder?.color || '#d1d5db';
        }

        if (type === 'image') {
            if (['borderRadius', 'borderRadiusTL', 'borderRadiusTR', 'borderRadiusBL', 'borderRadiusBR'].includes(key)) return styleGuide?.imgBorderRadius ?? 8;
            if (key === 'boxShadow' || key === 'shadow') return styleGuide?.imgShadow || '0 4px 12px rgba(0,0,0,0.1)';
        }

        if (type === 'video') {
            if (['borderRadius', 'borderRadiusTL', 'borderRadiusTR', 'borderRadiusBL', 'borderRadiusBR'].includes(key)) return styleGuide?.videoBorderRadius ?? 12;
            if (key === 'boxShadow' || key === 'shadow') return styleGuide?.videoShadow || '0 10px 25px rgba(0,0,0,0.2)';
        }

        if (type === 'divider') {
            if (key === 'dividerThickness' || key === 'dividerWidth') return styleGuide?.dividerWidth ?? 1;
            if (key === 'dividerStyle') return styleGuide?.dividerStyle || 'solid';
            if (key === 'dividerColor' || key === 'borderColor') return styleGuide?.dividerColor || '#e5e7eb';
            if (key === 'marginTop')    return styleGuide?.dividerMarginTop ?? 24;
            if (key === 'marginBottom') return styleGuide?.dividerMarginBottom ?? 24;
        }

        if (type === 'quote') {
            if (key === 'quoteBorderWidth' || key === 'borderWidth') return styleGuide?.quoteBorderWidth ?? 4;
            if (key === 'quoteBorderColor' || key === 'borderColor') return styleGuide?.quoteBorderColor || styleGuide?.linkColor || '#6EC1E4';
            if (key === 'quoteBgColor' || key === 'bgColor') return styleGuide?.quoteBgColor || 'rgba(99,102,241,0.06)';
            if (key === 'quoteTextColor' || key === 'textColor') return styleGuide?.quoteTextColor || styleGuide?.textColor || '#1f2937';
            if (key === 'quoteBorderRadius' || key === 'borderRadius') return styleGuide?.quoteBorderRadius || '0 8px 8px 0';
            if (key === 'quoteFontStyle' || key === 'fontStyle') return styleGuide?.quoteFontStyle || 'italic';
            if (key === 'quoteFontWeight' || key === 'fontWeight') return styleGuide?.quoteFontWeight || '400';
        }

        if (type === 'timer') {
            if (key === 'padding' || key === 'timerPadding') return styleGuide?.timerPadding ?? 16;
            if (key === 'borderRadius' || key === 'timerBorderRadius') return styleGuide?.timerBorderRadius ?? 12;
            if (key === 'fontSize' || key === 'timerFontSize') return styleGuide?.timerFontSize ?? 24;
            if (key === 'fontWeight' || key === 'timerFontWeight') return styleGuide?.timerFontWeight ?? 700;
            if (key === 'bgColor' || key === 'timerBgColor') return styleGuide?.timerBgColor || '#fef2f2';
            if (key === 'borderColor' || key === 'timerBorderColor') return styleGuide?.timerBorderColor || '#fca5a5';
            if (key === 'textColor' || key === 'timerTextColor') return styleGuide?.timerTextColor || '#dc2626';
        }

        if (['input_email', 'input_name', 'input_phone', 'datepicker', 'checkbox'].includes(type)) {
            if (key === 'textColor' || key === 'inputTextColor')     return styleGuide?.fieldTextColor || '#111827';
            if (key === 'bgColor' || key === 'inputBgColor')         return styleGuide?.fieldBgColor || '#ffffff';
            if (key === 'borderStyle' || key === 'inputBorderStyle') return styleGuide?.fieldBorder?.type || 'solid';
            if (key === 'borderColor' || key === 'inputBorderColor') return styleGuide?.fieldBorder?.color || '#d1d5db';
            if (key === 'borderWidth' || key === 'inputBorderWidth') return styleGuide?.fieldBorder?.width ?? 1;
            if (['borderRadius', 'inputBorderRadius', 'borderRadiusTL', 'borderRadiusTR', 'borderRadiusBL', 'borderRadiusBR'].includes(key)) return styleGuide?.fieldRadiusTop ?? 8;
            if (key === 'inputFocusBorderColor')                     return styleGuide?.systemColors?.primary || '#4f46e5';
            if (key === 'labelColor')                                return styleGuide?.fieldTextColor || '#374151';
            if (key === 'labelFontSize')                             return 13;
            if (key === 'labelFontWeight')                           return '600';
            if (key === 'paddingTop' || key === 'inputPaddingTop')   return styleGuide?.fieldPaddingTop ?? 12;
            if (key === 'paddingRight' || key === 'inputPaddingRight') return styleGuide?.fieldPaddingRight ?? 16;
            if (key === 'paddingBottom' || key === 'inputPaddingBottom') return styleGuide?.fieldPaddingBottom ?? 12;
            if (key === 'paddingLeft' || key === 'inputPaddingLeft') return styleGuide?.fieldPaddingLeft ?? 16;
            if (key === 'paddingUnit')                               return styleGuide?.fieldPaddingUnit || 'px';
            if (key === 'marginTop')                                 return styleGuide?.fieldMarginTop ?? 0;
            if (key === 'marginRight')                               return styleGuide?.fieldMarginRight ?? 0;
            if (key === 'marginBottom')                              return styleGuide?.fieldMarginBottom ?? 12;
            if (key === 'marginLeft')                                return styleGuide?.fieldMarginLeft ?? 0;
            if (key === 'marginUnit')                                return styleGuide?.fieldMarginUnit || 'px';
        }

        if (type === 'signature') {
            if (key === 'padBgColor' || key === 'bgColor')         return styleGuide?.fieldBgColor || '#ffffff';
            if (key === 'padBorderColor' || key === 'borderColor') return styleGuide?.fieldBorder?.color || '#d1d5db';
            if (key === 'padBorderWidth' || key === 'borderWidth') return styleGuide?.fieldBorder?.width ?? 1;
            if (key === 'padBorderStyle' || key === 'borderStyle') return styleGuide?.fieldBorder?.type || 'solid';
            if (key === 'padBorderRadius' || key === 'borderRadius') return styleGuide?.fieldRadiusTop ?? 8;
            if (key === 'penColor')                                return styleGuide?.fieldTextColor || '#111827';
            if (key === 'labelColor')                              return styleGuide?.fieldTextColor || '#374151';
            if (key === 'labelFontSize')                           return 13;
            if (key === 'labelFontWeight')                         return '600';
        }

        const CONTAINER_TYPES = ['section', 'flex_container', 'grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'];
        if (CONTAINER_TYPES.includes(type)) {
            if (key === 'containerWidth')  return styleGuide?.containerWidth ?? 1200;
            if (key === 'gap' || key === 'gapX') return styleGuide?.elementGapX ?? 24;
            if (key === 'gapY')            return styleGuide?.elementGapY ?? 24;
            if (key === 'paddingTop')      return styleGuide?.containerPaddingTop ?? 48;
            if (key === 'paddingRight')    return styleGuide?.containerPaddingRight ?? 24;
            if (key === 'paddingBottom')   return styleGuide?.containerPaddingBottom ?? 48;
            if (key === 'paddingLeft')     return styleGuide?.containerPaddingLeft ?? 24;
            if (key === 'paddingUnit')     return styleGuide?.containerPaddingUnit || 'px';
            if (key === 'marginTop')       return styleGuide?.containerMarginTop ?? 0;
            if (key === 'marginRight')     return styleGuide?.containerMarginRight ?? 0;
            if (key === 'marginBottom')    return styleGuide?.containerMarginBottom ?? styleGuide?.sectionMarginBottom ?? 24;
            if (key === 'marginLeft')      return styleGuide?.containerMarginLeft ?? 0;
            if (key === 'marginUnit')      return styleGuide?.containerMarginUnit || 'px';
            if (key === 'bgColor')         return styleGuide?.bgColor || '#ffffff';
        }

        // Global fallbacks
        if (key === 'fontSize')    return styleGuide?.fontSize || 17;
        if (key === 'lineHeight')  return styleGuide?.lineHeight || 25;
        if (key === 'fontFamily')  return styleGuide?.defaultFont || "'Inter', sans-serif";
        if (key === 'textColor')   return styleGuide?.textColor || '#1f2937';
        if (key === 'bgColor')     return '';

        return defaultVal;
    };

    const isKeyOverridden = (key) =>
        viewport !== 'desktop' && selectedElement?.[viewport]?.[key] !== undefined;

    const isLocallySet = (key) =>
        selectedElement && selectedElement[key] !== undefined;

    return { val, isKeyOverridden, isLocallySet };
}
