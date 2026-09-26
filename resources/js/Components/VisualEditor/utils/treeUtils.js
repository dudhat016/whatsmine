import { ADMIN_BLOCK_TEMPLATES } from '../constants';

export const isContainer = (type) => ['section', 'flex_container', 'grid_container'].includes(type);

export const wrapInStandardHierarchy = (itemData) => {
    if (itemData.type === 'section') {
        const { id: templateId, ...cleanItemProps } = itemData;
        const initialElements = (itemData.elements && itemData.elements.length > 0)
            ? itemData.elements
            : [{
                id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                type: 'grid_container',
                name: 'Row (1 Col)',
                title: 'Grid Row',
                colsCount: 1,
                columnRatio: '100',
                gap: 20,
                columns: [[]],
                columnStyles: [{}],
                elements: [],
            }];

        return {
            ...cleanItemProps,
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'section',
            name: itemData.name || 'Full Section',
            title: itemData.title || 'Page Section',
            htmlTag: itemData.htmlTag || 'section',
            paddingY: itemData.paddingY !== undefined ? itemData.paddingY : 48,
            paddingX: itemData.paddingX !== undefined ? itemData.paddingX : 24,
            elements: initialElements,
        };
    }

    if (itemData.type === 'grid_container' || ['col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(itemData.type)) {
        const { id: templateId, ...cleanItemProps } = itemData;
        const colsCount = itemData.type === 'col_1' ? 1 :
                          itemData.type === 'col_2' || itemData.type === 'col_sidebar' ? 2 :
                          itemData.type === 'col_3' ? 3 :
                          itemData.type === 'col_4' ? 4 :
                          (typeof cleanItemProps.colsCount === 'number' && cleanItemProps.colsCount > 0 ? cleanItemProps.colsCount : 2);
        const rowItem = {
            ...cleanItemProps,
            id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'grid_container',
            name: `Row (${colsCount} Col)`,
            title: 'Grid Row',
            colsCount,
            columnRatio: cleanItemProps.columnRatio || (colsCount === 1 ? '100' : colsCount === 3 ? '33-33-33' : colsCount === 4 ? '25-25-25-25' : '50-50'),
            ...(cleanItemProps.gap !== undefined ? { gap: cleanItemProps.gap } : {}),
            contentWidth: 'wide',
            columns: cleanItemProps.columns || Array.from({ length: colsCount }, () => []),
            columnStyles: cleanItemProps.columnStyles || Array.from({ length: colsCount }, () => ({})),
            elements: [],
        };
        return {
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'section',
            name: 'Full Section',
            title: 'Page Section',
            htmlTag: 'section',
            elements: [rowItem],
        };
    }

    const isGridType = ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(itemData.type);
    const isContainer = ['flex_container', 'section'].includes(itemData.type);
    const cleanItemProps = JSON.parse(JSON.stringify(itemData));
    delete cleanItemProps.id;

    const colsCount = itemData.type === 'col_1' ? 1 :
                      itemData.type === 'col_2' || itemData.type === 'col_sidebar' ? 2 :
                      itemData.type === 'col_3' ? 3 :
                      itemData.type === 'col_4' ? 4 :
                      (typeof cleanItemProps.colsCount === 'number' && cleanItemProps.colsCount > 0 ? cleanItemProps.colsCount : 2);

    const containerItem = {
        ...cleanItemProps,
        id: 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        ...(isContainer ? { elements: cleanItemProps.elements || [] } : {}),
        ...(isGridType ? {
            colsCount,
            columns: cleanItemProps.columns || Array.from({ length: colsCount }, () => []),
        } : {}),
    };

    if (['flex_container', 'grid_container'].includes(itemData.type)) {
        return {
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'section',
            name: 'Full Section',
            title: 'Page Section',
            htmlTag: 'section',
            elements: [containerItem],
        };
    }

    const rowItem = {
        id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        type: 'grid_container',
        name: 'Row (1 Col)',
        title: 'Grid Row',
        colsCount: 1,
        columnRatio: '100',
        contentWidth: 'wide',
        columns: [[containerItem]],
        columnStyles: [{}],
        elements: [],
    };

    return {
        id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        type: 'section',
        name: 'Full Section',
        title: 'Page Section',
        htmlTag: 'section',
        elements: [rowItem],
    };
};

export const insertNestedItem = (itemList, targetId, colIdx, newItem, position = 'after') => {
    let effectiveTargetId = targetId;
    let effectiveColIdx = colIdx;

    if (typeof targetId === 'string' && targetId.includes('_col_')) {
        const [cId, cStr] = targetId.split('_col_');
        effectiveTargetId = cId;
        effectiveColIdx = parseInt(cStr, 10);
    }

    return itemList.map(item => {
        if (item.id === effectiveTargetId) {
            if (effectiveColIdx !== null && effectiveColIdx !== undefined) {
                const columns = [...(item.columns || [[], []])];
                while (columns.length <= effectiveColIdx) columns.push([]);
                columns[effectiveColIdx] = position === 'before'
                    ? [newItem, ...(columns[effectiveColIdx] || [])]
                    : [...(columns[effectiveColIdx] || []), newItem];
                return { ...item, columns };
            } else if (item.type === 'section' && item.layoutMode === 'grid') {
                const columns = [...(item.columns || [[], []])];
                const targetCol = 0;
                columns[targetCol] = position === 'before'
                    ? [newItem, ...(columns[targetCol] || [])]
                    : [...(columns[targetCol] || []), newItem];
                return { ...item, columns };
            } else if (item.type === 'section' || item.type === 'flex_container') {
                if (newItem.type === 'section') {
                    // Prevent nesting sections inside sections - sections are strictly root-level
                    return item;
                }
                const elements = position === 'before'
                    ? [newItem, ...(item.elements || [])]
                    : [...(item.elements || []), newItem];
                return { ...item, elements };
            } else if (['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type)) {
                const columns = [...(item.columns || [[], [], [], []])];
                const targetCol = 0;
                columns[targetCol] = position === 'before'
                    ? [newItem, ...(columns[targetCol] || [])]
                    : [...(columns[targetCol] || []), newItem];
                return { ...item, columns };
            } else if (item.elements !== undefined) {
                const elements = position === 'before'
                    ? [newItem, ...(item.elements || [])]
                    : [...(item.elements || []), newItem];
                return { ...item, elements };
            }
        }

        let updatedItem = { ...item };
        let modified = false;

        if (item.elements && item.elements.length > 0) {
            const targetIdx = item.elements.findIndex(el => el.id === effectiveTargetId);
            if (targetIdx !== -1) {
                const targetEl = item.elements[targetIdx];
                const isTargetContainer = ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar', 'flex_container', 'section'].includes(targetEl?.type);
                if (!isTargetContainer) {
                    const elements = [...item.elements];
                    const insertAt = position === 'before' ? targetIdx : targetIdx + 1;
                    elements.splice(insertAt, 0, newItem);
                    return { ...item, elements };
                }
            }
            const updatedEls = insertNestedItem(item.elements, targetId, colIdx, newItem, position);
            if (updatedEls !== item.elements) {
                updatedItem.elements = updatedEls;
                modified = true;
            }
        }

        if (item.columns && item.columns.length > 0) {
            const updatedCols = item.columns.map(col => {
                if (!col) return col;
                const targetIdx = col.findIndex(el => el.id === effectiveTargetId);
                if (targetIdx !== -1) {
                    const targetEl = col[targetIdx];
                    const isTargetContainer = ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar', 'flex_container', 'section'].includes(targetEl?.type);
                    if (!isTargetContainer) {
                        const newCol = [...col];
                        const insertAt = position === 'before' ? targetIdx : targetIdx + 1;
                        newCol.splice(insertAt, 0, newItem);
                        return newCol;
                    }
                }
                return insertNestedItem(col, targetId, colIdx, newItem, position);
            });
            if (JSON.stringify(updatedCols) !== JSON.stringify(item.columns)) {
                updatedItem.columns = updatedCols;
                modified = true;
            }
        }

        return modified ? updatedItem : item;
    });
};

export const insertExistingNestedItem = (itemList, targetId, colIdx, itemToMove, position = 'after') => {
    let effectiveTargetId = targetId;
    let effectiveColIdx = colIdx;

    if (typeof targetId === 'string' && targetId.includes('_col_')) {
        const [cId, cStr] = targetId.split('_col_');
        effectiveTargetId = cId;
        effectiveColIdx = parseInt(cStr, 10);
    }

    return itemList.map(item => {
        if (item.id === effectiveTargetId) {
            if (effectiveColIdx !== null && effectiveColIdx !== undefined) {
                const columns = [...(item.columns || [[], []])];
                while (columns.length <= effectiveColIdx) columns.push([]);
                columns[effectiveColIdx] = position === 'before'
                    ? [itemToMove, ...(columns[effectiveColIdx] || [])]
                    : [...(columns[effectiveColIdx] || []), itemToMove];
                return { ...item, columns };
            } else if (item.type === 'section' && item.layoutMode === 'grid') {
                const columns = [...(item.columns || [[], []])];
                const targetCol = 0;
                columns[targetCol] = position === 'before'
                    ? [itemToMove, ...(columns[targetCol] || [])]
                    : [...(columns[targetCol] || []), itemToMove];
                return { ...item, columns };
            } else if (item.type === 'section' || item.type === 'flex_container') {
                const elements = position === 'before'
                    ? [itemToMove, ...(item.elements || [])]
                    : [...(item.elements || []), itemToMove];
                return { ...item, elements };
            } else if (['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type)) {
                const columns = [...(item.columns || [[], [], [], []])];
                const targetCol = 0;
                columns[targetCol] = position === 'before'
                    ? [itemToMove, ...(columns[targetCol] || [])]
                    : [...(columns[targetCol] || []), itemToMove];
                return { ...item, columns };
            } else if (item.elements !== undefined) {
                const elements = position === 'before'
                    ? [itemToMove, ...(item.elements || [])]
                    : [...(item.elements || []), itemToMove];
                return { ...item, elements };
            }
        }

        let updatedItem = { ...item };
        let modified = false;

        if (item.elements && item.elements.length > 0) {
            const targetIdx = item.elements.findIndex(el => el.id === effectiveTargetId);
            if (targetIdx !== -1) {
                const targetEl = item.elements[targetIdx];
                const isTargetContainer = ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar', 'flex_container', 'section'].includes(targetEl?.type);
                if (!isTargetContainer) {
                    const elements = [...item.elements];
                    const insertAt = position === 'before' ? targetIdx : targetIdx + 1;
                    elements.splice(insertAt, 0, itemToMove);
                    return { ...item, elements };
                }
            }
            const updatedEls = insertExistingNestedItem(item.elements, targetId, colIdx, itemToMove, position);
            if (updatedEls !== item.elements) {
                updatedItem.elements = updatedEls;
                modified = true;
            }
        }

        if (item.columns && item.columns.length > 0) {
            const updatedCols = item.columns.map(col => {
                if (!col) return col;
                const targetIdx = col.findIndex(el => el.id === effectiveTargetId);
                if (targetIdx !== -1) {
                    const targetEl = col[targetIdx];
                    const isTargetContainer = ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar', 'flex_container', 'section'].includes(targetEl?.type);
                    if (!isTargetContainer) {
                        const newCol = [...col];
                        const insertAt = position === 'before' ? targetIdx : targetIdx + 1;
                        newCol.splice(insertAt, 0, itemToMove);
                        return newCol;
                    }
                }
                return insertExistingNestedItem(col, targetId, colIdx, itemToMove, position);
            });
            if (JSON.stringify(updatedCols) !== JSON.stringify(item.columns)) {
                updatedItem.columns = updatedCols;
                modified = true;
            }
        }

        return modified ? updatedItem : item;
    });
};

export const moveNestedElement = (itemList, targetId, direction = 'up') => {
    // 1. Check if targetId is in the top-level itemList
    const topIdx = itemList.findIndex(el => el.id === targetId);
    if (topIdx !== -1) {
        const swapIdx = direction === 'up' ? topIdx - 1 : topIdx + 1;
        if (swapIdx >= 0 && swapIdx < itemList.length) {
            const list = [...itemList];
            const [removed] = list.splice(topIdx, 1);
            list.splice(swapIdx, 0, removed);
            return list;
        }
        return itemList;
    }

    // 2. Otherwise search nested in elements and columns
    return itemList.map(item => {
        let updated = { ...item };
        let modified = false;

        if (item.elements && item.elements.length > 0) {
            const idx = item.elements.findIndex(el => el.id === targetId);
            if (idx !== -1) {
                const targetSwapIdx = direction === 'up' ? idx - 1 : idx + 1;
                if (targetSwapIdx >= 0 && targetSwapIdx < item.elements.length) {
                    const elements = [...item.elements];
                    const [removed] = elements.splice(idx, 1);
                    elements.splice(targetSwapIdx, 0, removed);
                    return { ...item, elements };
                }
                return item;
            }
            const updatedEls = moveNestedElement(item.elements, targetId, direction);
            if (updatedEls !== item.elements) {
                updated.elements = updatedEls;
                modified = true;
            }
        }

        if (item.columns && item.columns.length > 0) {
            const updatedCols = item.columns.map(col => {
                if (!col) return col;
                const idx = col.findIndex(el => el.id === targetId);
                if (idx !== -1) {
                    const targetSwapIdx = direction === 'up' ? idx - 1 : idx + 1;
                    if (targetSwapIdx >= 0 && targetSwapIdx < col.length) {
                        const newCol = [...col];
                        const [removed] = newCol.splice(idx, 1);
                        newCol.splice(targetSwapIdx, 0, removed);
                        return newCol;
                    }
                    return col;
                }
                return moveNestedElement(col, targetId, direction);
            });
            if (JSON.stringify(updatedCols) !== JSON.stringify(item.columns)) {
                updated.columns = updatedCols;
                modified = true;
            }
        }

        return modified ? updated : item;
    });
};

export const deleteNestedElement = (itemList, targetId) => {
    return itemList
        .filter(item => item.id !== targetId)
        .map(item => {
            let updated = { ...item };
            if (item.elements && item.elements.length > 0) {
                updated.elements = deleteNestedElement(item.elements, targetId);
            }
            if (item.columns && item.columns.length > 0) {
                updated.columns = item.columns.map(col => (col ? deleteNestedElement(col, targetId) : col));
            }
            return updated;
        });
};

export const updateNestedElement = (itemList, targetId, updater) => {
    return itemList.map(item => {
        if (item.id === targetId) {
            return updater(item);
        }
        let updated = { ...item };
        let modified = false;
        if (item.elements && item.elements.length > 0) {
            const updatedEls = updateNestedElement(item.elements, targetId, updater);
            if (updatedEls !== item.elements) {
                updated.elements = updatedEls;
                modified = true;
            }
        }
        if (item.columns && item.columns.length > 0) {
            const updatedCols = item.columns.map(col => (col ? updateNestedElement(col, targetId, updater) : col));
            if (updatedCols !== item.columns) {
                updated.columns = updatedCols;
                modified = true;
            }
        }
        return modified ? updated : item;
    });
};

/**
 * deepAssignNewIds — Bug 19 Fix.
 * Recursively walks an element tree and assigns a brand-new unique ID to every node.
 * Used when inserting a saved block so re-inserting the same block doesn't create
 * duplicate IDs across elements, columns, and nested children.
 *
 * @param {object} item — any element/section node from the canvas tree
 * @returns {object} — a deep-cloned version with all IDs replaced
 */
export const deepAssignNewIds = (item) => {
    if (!item) return item;

    const prefix = item.type === 'section' ? 'sec'
        : ['col_1','col_2','col_3','col_4','col_sidebar','flex_container','grid_container'].includes(item.type) ? 'row'
        : 'el';

    const newId = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;

    const updated = { ...item, id: newId };

    if (item.elements && item.elements.length > 0) {
        updated.elements = item.elements.map(child => deepAssignNewIds(child));
    }

    if (item.columns && item.columns.length > 0) {
        updated.columns = item.columns.map(col =>
            Array.isArray(col) ? col.map(child => deepAssignNewIds(child)) : col
        );
    }

    return updated;
};

export const sanitizeElementForBrandInheritance = (item) => {
    if (!item) return item;
    let clean = { ...item };

    if (!clean.isLocallyOverridden) {
        const textProps = [
            'fontSize', 'lineHeight', 'fontWeight', 'textColor', 'fontFamily',
            'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingY', 'paddingX',
            'textTransform', 'fontStyle', 'textDecoration', 'letterSpacing', 'wordSpacing'
        ];
        const btnProps = [
            'bgColor', 'textColor', 'fontSize', 'fontWeight', 'fontFamily', 'borderRadius',
            'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'marginBottom', 'marginTop', 'marginRight', 'marginLeft',
            'btnFontSize', 'btnFontWeight', 'btnBgColor', 'btnTextColor', 'btnBorderRadius'
        ];
        const mediaProps = [
            'borderRadius', 'boxShadow', 'shadow',
            'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingY', 'paddingX'
        ];
        const dividerProps = [
            'dividerWidth', 'dividerStyle', 'dividerColor', 'dividerThickness',
            'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'borderColor'
        ];
        const inputProps = [
            'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'borderRadius', 'fontSize', 'fontFamily', 'bgColor', 'textColor', 'borderColor',
            'marginBottom', 'marginTop', 'marginRight', 'marginLeft',
            'inputBgColor', 'inputBorderColor', 'inputBorderWidth', 'inputBorderStyle', 'inputBorderRadius',
            'inputFocusBorderColor', 'inputTextColor', 'inputFontSize', 'inputPaddingY', 'inputPaddingX',
            'labelColor', 'labelFontSize', 'labelFontWeight', 'labelFontFamily'
        ];
        const signatureProps = [
            'padBgColor', 'padBorderColor', 'padBorderWidth', 'padBorderStyle', 'padBorderRadius',
            'penColor', 'labelColor', 'labelFontSize', 'labelFontWeight', 'labelFontFamily',
            'marginBottom', 'marginTop', 'marginRight', 'marginLeft',
            'paddingY', 'paddingX', 'borderRadius'
        ];
        const checkboxProps = [
            'textColor', 'fontSize', 'checkboxColor',
            'marginBottom', 'marginTop', 'marginRight', 'marginLeft'
        ];
        const containerProps = [
            'gap', 'gapX', 'gapY', 'containerWidth',
            'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
            'flexDirection', 'flexWrap', 'justifyContent', 'alignItems'
        ];
        const interactiveProps = [
            'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'marginBottom', 'marginTop', 'marginRight', 'marginLeft'
        ];

        const propsToCleanMap = {
            headline: textProps,
            subheadline: textProps,
            paragraph: textProps,
            bullets: textProps,
            quote: textProps,
            rich_text: textProps,
            icon_box: textProps,
            star_rating: textProps,
            custom_code: textProps,
            image: mediaProps,
            video: mediaProps,
            divider: dividerProps,
            submit_button: btnProps,
            button: btnProps,
            input_email: inputProps,
            input_name: inputProps,
            input_phone: inputProps,
            datepicker: inputProps,
            signature: signatureProps,
            checkbox: checkboxProps,
            section: containerProps,
            flex_container: containerProps,
            grid_container: containerProps,
            col_1: containerProps,
            col_2: containerProps,
            col_3: containerProps,
            col_4: containerProps,
            col_sidebar: containerProps,
            timer: interactiveProps,
            progress_bar: interactiveProps,
            faq_accordion: interactiveProps,
            testimonial_slider: interactiveProps,
            order_bump: interactiveProps,
            two_step_order: interactiveProps,
            upsell_box: interactiveProps,
            pricing_table: interactiveProps,
            audio: interactiveProps,
            social: interactiveProps,
        };

        const keysToClean = propsToCleanMap[clean.type];
        if (keysToClean) {
            keysToClean.forEach(k => delete clean[k]);
        }
    }

    // Clean legacy hardcoded preset defaults so brand variables manage them
    if (clean.type === 'image' && (clean.borderRadius === 12 || clean.borderRadius === 8)) {
        delete clean.borderRadius;
    }
    if (clean.type === 'video' && (clean.borderRadius === 12 || clean.borderRadius === 8)) {
        delete clean.borderRadius;
    }
    if (['input_email', 'input_name', 'input_phone', 'datepicker'].includes(clean.type)) {
        if (clean.inputBorderRadius === 8) delete clean.inputBorderRadius;
        if (clean.inputBgColor === '#ffffff') delete clean.inputBgColor;
        if (clean.inputBorderColor === '#d1d5db') delete clean.inputBorderColor;
    }
    if (clean.type === 'signature' && clean.padBorderRadius === 8) {
        delete clean.padBorderRadius;
    }
    if (clean.type === 'divider') {
        if (clean.dividerThickness === 1) delete clean.dividerThickness;
        if (clean.dividerStyle === 'solid') delete clean.dividerStyle;
    }
    if (clean.type === 'section') {
        if (clean.containerWidth === '1200' || clean.containerWidth === 1200) delete clean.containerWidth;
        if (clean.paddingY === 48 && clean.paddingX === 24) {
            delete clean.paddingY;
            delete clean.paddingX;
        }
    }
    if (clean.type === 'grid_container' && clean.gap === 20) {
        delete clean.gap;
    }

    return clean;
};

/**
 * getAncestorTrail - traces the exact hierarchy lineage from root section down to targetId.
 * e.g. [Hero Section] > [3 Columns] > [Col #2] > [Card / Box] > [Action Button / CTA]
 */
export const getAncestorTrail = (itemList, targetId, path = []) => {
    if (!targetId || !itemList || itemList.length === 0) return [];

    for (const item of itemList) {
        if (!item) continue;
        const currentPath = [...path, { id: item.id, name: item.name || item.title || item.type, type: item.type, item }];
        if (item.id === targetId) {
            return currentPath;
        }

        if (item.elements && item.elements.length > 0) {
            const found = getAncestorTrail(item.elements, targetId, currentPath);
            if (found.length > 0) return found;
        }

        if (item.columns && item.columns.length > 0) {
            for (let cIdx = 0; cIdx < item.columns.length; cIdx++) {
                const col = item.columns[cIdx];
                if (Array.isArray(col)) {
                    const colPath = [...currentPath, {
                        id: `${item.id}_col_${cIdx}`,
                        name: `Col #${cIdx + 1}`,
                        type: 'column',
                        parentId: item.id,
                        colIdx: cIdx,
                    }];
                    if (targetId === `${item.id}_col_${cIdx}`) {
                        return colPath;
                    }
                    const foundInCol = getAncestorTrail(col, targetId, colPath);
                    if (foundInCol.length > 0) return foundInCol;
                }
            }
        }
    }
    return [];
};

// ── Content Width Presets & Resolver (Wide, Medium, Small, Extra Small, Full) ──
export const CONTENT_WIDTH_PRESETS = [
    { key: 'full',        label: 'Full page (100%)',   maxWidth: '100%',   widthValue: '100%' },
    { key: 'wide',        label: 'Wide (1120px)',      maxWidth: '1120px', widthValue: '1120' },
    { key: 'medium',      label: 'Medium (960px)',     maxWidth: '960px',  widthValue: '960' },
    { key: 'small',       label: 'Small (768px)',      maxWidth: '768px',  widthValue: '768' },
    { key: 'extra_small', label: 'Extra small (540px)', maxWidth: '540px', widthValue: '540' },
    { key: 'custom',      label: 'Custom width...',    maxWidth: 'custom', widthValue: '1120' },
];

export const resolveContentMaxWidth = (element) => {
    if (!element) return '100%';
    const cw = element.contentWidth;
    if (cw === 'full' || element.containerWidth === '100%') return '100%';
    if (cw === 'wide') return '1120px';
    if (cw === 'medium') return '960px';
    if (cw === 'small') return '768px';
    if (cw === 'extra_small') return '540px';
    if (cw === 'custom' || cw === 'boxed' || element.containerWidth) {
        const val = element.containerWidth || 1120;
        if (val === '100%') return '100%';
        return String(val).endsWith('px') || String(val).endsWith('%') || String(val).includes('var(') ? String(val) : `${val}px`;
    }
    return '1120px';
};


