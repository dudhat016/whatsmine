import { useTranslation } from 'react-i18next';
import Drawer from '@/Components/ui/Drawer';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import Toggle from '@/Components/ui/Toggle';
import Button from '@/Components/ui/Button';
import { Trash2 } from 'lucide-react';

export default function BlockSettingsDrawer({
    block,
    isOpen,
    onClose,
    onChange,
    onDelete,
    mode = 'email',
}) {
    const { t } = useTranslation();

    if (!block) return null;

    function setProp(key, value) {
        onChange({ ...block, [key]: value });
    }

    return (
        <Drawer
            open={isOpen}
            onClose={onClose}
            title={`${t('common.settings', 'Settings')}: ${block.type.replace('form_', '').toUpperCase()}`}
            position="right"
            size="md"
        >
            <div className="space-y-4 p-4">
                {/* ── Heading Settings ── */}
                {block.type === 'heading' && (
                    <>
                        <Select
                            label={t('common.heading_level', 'Heading Level')}
                            value={block.level || 2}
                            onChange={(e) => setProp('level', parseInt(e.target.value, 10))}
                            options={[
                                { value: 1, label: 'H1 (Main Headline)' },
                                { value: 2, label: 'H2 (Sub-headline)' },
                                { value: 3, label: 'H3 (Section Title)' },
                            ]}
                        />
                        <Select
                            label={t('common.alignment', 'Alignment')}
                            value={block.align || 'left'}
                            onChange={(e) => setProp('align', e.target.value)}
                            options={[
                                { value: 'left', label: 'Left' },
                                { value: 'center', label: 'Center' },
                                { value: 'right', label: 'Right' },
                            ]}
                        />
                    </>
                )}

                {/* ── Button / Form Submit Settings ── */}
                {(block.type === 'button' || block.type === 'form_submit') && (
                    <>
                        {block.type === 'button' && (
                            <Input
                                label={t('common.button_url', 'Button Link (URL)')}
                                value={block.url || ''}
                                onChange={(e) => setProp('url', e.target.value)}
                                placeholder="https://example.com"
                            />
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label={t('common.button_color', 'Button Color')}
                                type="color"
                                value={block.color || '#2563eb'}
                                onChange={(e) => setProp('color', e.target.value)}
                            />
                            <Input
                                label={t('common.text_color', 'Text Color')}
                                type="color"
                                value={block.textColor || '#ffffff'}
                                onChange={(e) => setProp('textColor', e.target.value)}
                            />
                        </div>
                        <Select
                            label={t('common.alignment', 'Alignment')}
                            value={block.align || 'center'}
                            onChange={(e) => setProp('align', e.target.value)}
                            options={[
                                { value: 'left', label: 'Left' },
                                { value: 'center', label: 'Center' },
                                { value: 'right', label: 'Right' },
                            ]}
                        />
                    </>
                )}

                {/* ── Image Settings ── */}
                {block.type === 'image' && (
                    <>
                        <Input
                            label={t('common.image_url', 'Image URL')}
                            value={block.src || ''}
                            onChange={(e) => setProp('src', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                        />
                        <Input
                            label={t('common.alt_text', 'Alt Text')}
                            value={block.alt || ''}
                            onChange={(e) => setProp('alt', e.target.value)}
                            placeholder="Image description"
                        />
                        <Input
                            label={t('common.click_link', 'Click Link (Optional)')}
                            value={block.url || ''}
                            onChange={(e) => setProp('url', e.target.value)}
                            placeholder="https://example.com"
                        />
                    </>
                )}

                {/* ── Form Field Settings ── */}
                {block.type.startsWith('form_') && block.type !== 'form_submit' && (
                    <>
                        <Input
                            label={t('common.field_label', 'Field Label')}
                            value={block.label || ''}
                            onChange={(e) => setProp('label', e.target.value)}
                        />
                        <Input
                            label={t('common.field_name', 'Field Key / Database Name')}
                            value={block.name || ''}
                            onChange={(e) => setProp('name', e.target.value)}
                        />
                        {block.type !== 'form_checkbox' && (
                            <Input
                                label={t('common.placeholder', 'Placeholder')}
                                value={block.placeholder || ''}
                                onChange={(e) => setProp('placeholder', e.target.value)}
                            />
                        )}
                        <Toggle
                            label={t('common.required_field', 'Required Field')}
                            checked={!!block.required}
                            onChange={(checked) => setProp('required', checked)}
                        />
                    </>
                )}

                {/* ── Spacer Settings ── */}
                {block.type === 'spacer' && (
                    <Input
                        label={t('common.height_px', 'Height (px)')}
                        type="number"
                        min="8"
                        max="120"
                        value={block.height || 24}
                        onChange={(e) => setProp('height', parseInt(e.target.value, 10) || 24)}
                    />
                )}

                {/* ── Divider Settings ── */}
                {block.type === 'divider' && (
                    <Input
                        label={t('common.divider_color', 'Color')}
                        type="color"
                        value={block.color || '#e5e7eb'}
                        onChange={(e) => setProp('color', e.target.value)}
                    />
                )}

                {/* ── Delete Action ── */}
                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                    <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => {
                            onDelete(block.id);
                            onClose();
                        }}
                        className="flex items-center gap-1.5"
                    >
                        <Trash2 className="h-4 w-4" />
                        {t('common.delete_block', 'Delete Block')}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                        {t('common.done', 'Done')}
                    </Button>
                </div>
            </div>
        </Drawer>
    );
}
