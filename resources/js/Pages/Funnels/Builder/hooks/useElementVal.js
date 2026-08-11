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
        }

        if (type === 'submit_button') {
            const primary = styleGuide?.systemColors?.primary || 'var(--color-primary)';
            if (key === 'textColor')     return styleGuide?.btnTextColor || '#ffffff';
            if (key === 'bgColor')       return styleGuide?.btnBgColor || primary;
            if (key === 'fontFamily')    return styleGuide?.btnTypography?.family || styleGuide?.defaultFont || "'Inter', sans-serif";
            if (key === 'fontSize')      return styleGuide?.btnTypography?.size || 16;
            if (key === 'fontWeight')    return styleGuide?.btnTypography?.weight || '700';
            if (key === 'borderStyle')   return styleGuide?.btnBorder?.type || 'none';
            if (key === 'borderWidth')   return styleGuide?.btnBorder?.width || 1;
            if (key === 'borderColor')   return styleGuide?.btnBorder?.color || '#d1d5db';
            if (['borderRadiusTL', 'borderRadiusTR', 'borderRadiusBL', 'borderRadiusBR'].includes(key)) return styleGuide?.btnRadiusTop ?? 12;
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

        if (['input_email', 'input_name', 'input_phone', 'checkbox'].includes(type)) {
            if (key === 'textColor')     return styleGuide?.fieldTextColor || '#111827';
            if (key === 'bgColor')       return styleGuide?.fieldBgColor || '#ffffff';
            if (key === 'borderStyle')   return styleGuide?.fieldBorder?.type || 'solid';
            if (key === 'borderColor')   return styleGuide?.fieldBorder?.color || '#d1d5db';
            if (['borderRadiusTL', 'borderRadiusTR', 'borderRadiusBL', 'borderRadiusBR'].includes(key)) return styleGuide?.fieldRadiusTop ?? 8;
            if (key === 'paddingTop')    return styleGuide?.fieldPaddingTop ?? 12;
            if (key === 'paddingRight')  return styleGuide?.fieldPaddingRight ?? 16;
            if (key === 'paddingBottom') return styleGuide?.fieldPaddingBottom ?? 12;
            if (key === 'paddingLeft')   return styleGuide?.fieldPaddingLeft ?? 16;
            if (key === 'paddingUnit')   return styleGuide?.fieldPaddingUnit || 'px';
            if (key === 'marginTop')     return styleGuide?.fieldMarginTop ?? 0;
            if (key === 'marginRight')   return styleGuide?.fieldMarginRight ?? 0;
            if (key === 'marginBottom')  return styleGuide?.fieldMarginBottom ?? 12;
            if (key === 'marginLeft')    return styleGuide?.fieldMarginLeft ?? 0;
            if (key === 'marginUnit')    return styleGuide?.fieldMarginUnit || 'px';
        }

        const CONTAINER_TYPES = ['section', 'flex_container', 'grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'];
        if (CONTAINER_TYPES.includes(type)) {
            if (key === 'containerWidth')  return styleGuide?.containerWidth ?? 1200;
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
