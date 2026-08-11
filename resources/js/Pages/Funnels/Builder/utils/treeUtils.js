import { ADMIN_BLOCK_TEMPLATES } from '../constants';

export const isContainer = (type) => ['section', 'flex_container', 'grid_container'].includes(type);

export const wrapInStandardHierarchy = (itemData) => {
    if (itemData.type === 'section') {
        const { id: templateId, ...cleanItemProps } = itemData;
        return {
            ...cleanItemProps,
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            elements: itemData.elements || [],
            columns: itemData.columns || [[], [], [], []],
        };
    }

    if (['col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(itemData.type)) {
        const { id: templateId, ...cleanItemProps } = itemData;
        const rowItem = {
            ...cleanItemProps,
            id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            columns: itemData.columns || [[], [], [], []],
            elements: [],
        };
        return {
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'section',
            name: 'Layout Section',
            title: 'Page Section',
            bgColor: '#ffffff',
            elements: [rowItem],
            columns: [[], [], [], []],
        };
    }

    const cleanItemProps = JSON.parse(JSON.stringify(itemData));
    delete cleanItemProps.id;

    const containerItem = {
        ...cleanItemProps,
        id: 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        elements: cleanItemProps.elements || [],
        columns: cleanItemProps.columns || [[], [], [], []],
    };

    if (['flex_container', 'grid_container'].includes(itemData.type)) {
        return {
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: 'section',
            name: 'Layout Section',
            title: 'Page Section',
            containerWidth: '1200',
            paddingY: 48,
            paddingX: 24,
            elements: [containerItem],
            columns: [[], [], [], []],
            mobile: { paddingY: 32, paddingX: 16 }
        };
    }

    const rowItem = {
        id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        type: 'col_1',
        name: '1 Column (Full Width)',
        colsCount: 1,
        columns: [[containerItem], [], [], []],
        elements: [],
    };

    return {
        id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        type: 'section',
        name: 'Layout Section',
        title: 'Page Section',
        containerWidth: '1200',
        paddingY: 48,
        paddingX: 24,
        elements: [rowItem],
        columns: [[], [], [], []],
        mobile: { paddingY: 32, paddingX: 16 }
    };
};

export const insertNestedItem = (itemList, targetId, colIdx, newItem) => {
    return itemList.map(item => {
        if (item.id === targetId) {
            if (colIdx !== null) {
                const columns = [...(item.columns || [[], [], [], []])];
                columns[colIdx] = [...(columns[colIdx] || []), newItem];
                return { ...item, columns };
            } else if (item.type === 'section' || item.type === 'flex_container') {
                const elements = [...(item.elements || []), newItem];
                return { ...item, elements };
            } else if (['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type)) {
                const columns = [...(item.columns || [[], [], [], []])];
                const targetCol = 0;
                columns[targetCol] = [...(columns[targetCol] || []), newItem];
                return { ...item, columns };
            } else if (item.elements !== undefined) {
                const elements = [...(item.elements || []), newItem];
                return { ...item, elements };
            }
        }

        let updatedItem = { ...item };
        let modified = false;

        if (item.elements && item.elements.length > 0) {
            const targetIdx = item.elements.findIndex(el => el.id === targetId);
            if (targetIdx !== -1) {
                const elements = [...item.elements];
                elements.splice(targetIdx + 1, 0, newItem);
                return { ...item, elements };
            }
            const updatedEls = insertNestedItem(item.elements, targetId, colIdx, newItem);
            if (updatedEls !== item.elements) {
                updatedItem.elements = updatedEls;
                modified = true;
            }
        }

        if (item.columns && item.columns.length > 0) {
            const updatedCols = item.columns.map(col => {
                if (!col) return col;
                const targetIdx = col.findIndex(el => el.id === targetId);
                if (targetIdx !== -1) {
                    const newCol = [...col];
                    newCol.splice(targetIdx + 1, 0, newItem);
                    return newCol;
                }
                return insertNestedItem(col, targetId, colIdx, newItem);
            });
            updatedItem.columns = updatedCols;
            modified = true;
        }

        return modified ? updatedItem : item;
    });
};

export const insertExistingNestedItem = (itemList, targetId, colIdx, itemToMove) => {
    return itemList.map(item => {
        if (item.id === targetId) {
            if (colIdx !== null) {
                const columns = [...(item.columns || [[], [], [], []])];
                columns[colIdx] = [...(columns[colIdx] || []), itemToMove];
                return { ...item, columns };
            } else if (item.type === 'section' || item.type === 'flex_container') {
                const elements = [...(item.elements || []), itemToMove];
                return { ...item, elements };
            } else if (['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'].includes(item.type)) {
                const columns = [...(item.columns || [[], [], [], []])];
                const targetCol = 0;
                columns[targetCol] = [...(columns[targetCol] || []), itemToMove];
                return { ...item, columns };
            } else if (item.elements !== undefined) {
                const elements = [...(item.elements || []), itemToMove];
                return { ...item, elements };
            }
        }

        let updatedItem = { ...item };
        let modified = false;

        if (item.elements && item.elements.length > 0) {
            const targetIdx = item.elements.findIndex(el => el.id === targetId);
            if (targetIdx !== -1) {
                const elements = [...item.elements];
                elements.splice(targetIdx + 1, 0, itemToMove);
                return { ...item, elements };
            }
            const updatedEls = insertExistingNestedItem(item.elements, targetId, colIdx, itemToMove);
            if (updatedEls !== item.elements) {
                updatedItem.elements = updatedEls;
                modified = true;
            }
        }

        if (item.columns && item.columns.length > 0) {
            const updatedCols = item.columns.map(col => {
                if (!col) return col;
                const targetIdx = col.findIndex(el => el.id === targetId);
                if (targetIdx !== -1) {
                    const newCol = [...col];
                    newCol.splice(targetIdx + 1, 0, itemToMove);
                    return newCol;
                }
                return insertExistingNestedItem(col, targetId, colIdx, itemToMove);
            });
            updatedItem.columns = updatedCols;
            modified = true;
        }

        return modified ? updatedItem : item;
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
        const textProps = ['fontSize', 'lineHeight', 'fontWeight', 'textColor', 'fontFamily', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingY', 'paddingX'];
        const inputProps = ['paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius', 'fontSize', 'fontFamily', 'bgColor', 'textColor', 'borderColor', 'marginBottom', 'marginTop', 'marginRight', 'marginLeft'];
        const btnProps = ['bgColor', 'textColor', 'fontSize', 'fontWeight', 'fontFamily', 'borderRadius', 'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginBottom', 'marginTop', 'marginRight', 'marginLeft'];
        const containerProps = ['containerWidth', 'gap', 'gapX', 'gapY', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems'];

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
            order_bump: inputProps,
            faq_accordion: inputProps,
            testimonial_slider: inputProps,
            timer: inputProps,
            progress_bar: inputProps,
            social: inputProps,
            audio: inputProps,
            input_email: inputProps,
            input_name: inputProps,
            input_phone: inputProps,
            submit_button: btnProps,
            section: containerProps,
            flex_container: containerProps,
            grid_container: containerProps,
            col_1: containerProps,
            col_2: containerProps,
            col_3: containerProps,
            col_4: containerProps,
            col_sidebar: containerProps,
        };

        const keysToClean = propsToCleanMap[clean.type];
        if (keysToClean) {
            keysToClean.forEach(k => delete clean[k]);
        }
    }

    return clean;
};
