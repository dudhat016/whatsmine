import React from 'react';
import { Sparkles } from 'lucide-react';
import { SectionTitle } from '../BuilderUI';
import { TypographyControl } from '../StyleControls';

const TYPOGRAPHY_TYPES = ['headline', 'subheadline', 'paragraph', 'quote', 'submit_button'];

export default function TypographyPanel({
    element, val, viewport, styleGuide, handleUpdateElementSetting, handleResetElementCategory, isKeyOverridden,
}) {
    if (!TYPOGRAPHY_TYPES.includes(element.type)) return null;

    return (
        <div className="space-y-3 pt-3 border-t border-neutral-200">
            <SectionTitle
                onReset={() => handleResetElementCategory(element.id, 'typography')}
                resetTitle={`Reset Typography for ${viewport}`}
            >
                Typography
                {viewport !== 'desktop' && isKeyOverridden('fontSize') && (
                    <Sparkles className="h-3 w-3 text-amber-500" title="Custom viewport overrides applied" />
                )}
            </SectionTitle>

            <TypographyControl
                label="Typography"
                value={{
                    family:            val('fontFamily', styleGuide?.defaultFont || 'Default'),
                    size:              val('fontSize', 16),
                    sizeUnit:          val('fontSizeUnit', 'px'),
                    weight:            val('fontWeight', '400'),
                    transform:         val('textTransform', 'Default'),
                    style:             val('fontStyle', 'Default'),
                    decoration:        val('textDecoration', 'Default'),
                    lineHeight:        val('lineHeight', 24),
                    lineHeightUnit:    val('lineHeightUnit', 'px'),
                    letterSpacing:     val('letterSpacing', 0),
                    letterSpacingUnit: val('letterSpacingUnit', 'px'),
                    wordSpacing:       val('wordSpacing', 0),
                    wordSpacingUnit:   val('wordSpacingUnit', 'px'),
                }}
                onChange={typo => {
                    const u = {};
                    if (typo.family      !== undefined) u.fontFamily       = typo.family;
                    if (typo.size        !== undefined) u.fontSize         = typo.size;
                    if (typo.sizeUnit    !== undefined) u.fontSizeUnit     = typo.sizeUnit;
                    if (typo.weight      !== undefined) u.fontWeight       = typo.weight;
                    if (typo.transform   !== undefined) u.textTransform    = typo.transform === 'Default' ? 'none' : typo.transform;
                    if (typo.style       !== undefined) u.fontStyle        = typo.style === 'Default' ? 'normal' : typo.style;
                    if (typo.decoration  !== undefined) u.textDecoration   = typo.decoration === 'Default' ? 'none' : typo.decoration;
                    if (typo.lineHeight       !== undefined) u.lineHeight       = typo.lineHeight;
                    if (typo.lineHeightUnit   !== undefined) u.lineHeightUnit   = typo.lineHeightUnit;
                    if (typo.letterSpacing    !== undefined) u.letterSpacing    = typo.letterSpacing;
                    if (typo.letterSpacingUnit!== undefined) u.letterSpacingUnit= typo.letterSpacingUnit;
                    if (typo.wordSpacing      !== undefined) u.wordSpacing      = typo.wordSpacing;
                    if (typo.wordSpacingUnit  !== undefined) u.wordSpacingUnit  = typo.wordSpacingUnit;
                    handleUpdateElementSetting(element.id, u);
                }}
            />
        </div>
    );
}
