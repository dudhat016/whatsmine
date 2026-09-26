export function blocksToFormSchema(blocks) {
    const fields = blocks
        .filter((b) => b.type.startsWith('form_'))
        .map((b) => ({
            id: b.id,
            type: b.type.replace('form_', ''),
            label: b.label || '',
            name: b.name || b.id,
            placeholder: b.placeholder || '',
            required: !!b.required,
            options: b.options || [],
            helpText: b.helpText || '',
        }));

    return {
        blocks,
        fields,
    };
}
