<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Modules\Funnels\Models\Funnel;
use App\Modules\Funnels\Models\FunnelAffiliate;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class FunnelRenderController extends Controller
{
    /**
     * Serve a public funnel page.
     * URL: /f/{workspace_slug}/{funnel_slug}
     */
    public function show(Request $request, string $workspaceSlug, string $funnelSlug, ?string $stepSlug = null): Response
    {
        $funnel = $this->resolveFunnel($workspaceSlug, $funnelSlug);

        // ── 3. Handle affiliate ref_code cookie (30-day attribution) ──────────
        $refCode = $request->query('ref');
        if ($refCode) {
            $validAffiliate = FunnelAffiliate::where('ref_code', $refCode)
                ->where('funnel_id', $funnel->id)
                ->where('status', 'active')
                ->first();

            if ($validAffiliate) {
                $validAffiliate->increment('clicks_count');
            }
        }

        // ── 4. Resolve Step & Variant ─────────────────────────────────────────
        $steps = $funnel->steps;
        abort_unless($steps->count() > 0, 404);

        if ($stepSlug) {
            $cleanStepId = preg_replace('/^step-/', '', $stepSlug);
            $currentStep = $steps->first(function ($s) use ($stepSlug, $cleanStepId) {
                return (string)$s->id === $cleanStepId
                    || ($s->slug && $s->slug === $stepSlug)
                    || $s->type === $stepSlug
                    || \Illuminate\Support\Str::slug($s->name) === $stepSlug;
            });
            if (! $currentStep) {
                $currentStep = $steps->first();
            }
        } else {
            $currentStep = $steps->first();
        }

        abort_unless($currentStep, 404);

        $pages = $currentStep->pages;
        $controlPage = $pages->where('is_control', true)->first();

        $variantCookieKey = "funnel_{$funnel->id}_step_{$currentStep->id}_variant";
        $assignedVariant  = $request->cookie($variantCookieKey);

        if (! $assignedVariant) {
            $variantB = $pages->where('variant', 'B')->first();
            if ($variantB && rand(1, 100) <= $variantB->traffic_split) {
                $assignedVariant = 'B';
            } else {
                $assignedVariant = 'A';
            }
        }

        $page = $pages->where('variant', $assignedVariant)->first() ?? $controlPage;
        abort_unless($page, 404);

        // ── 5. Increment view counters ─────────────────────────────────────────
        $funnel->increment('views_count');
        $currentStep->increment('views_count');
        $page->increment('views_count');

        // ── 6. Dynamically compile canvas_json to full HTML or use cached HTML ───
        $canvasData = $page->canvas_json ?? [];
        $hasSections = ! empty($canvasData['sections']) || (! empty($canvasData) && (isset($canvasData[0]['type']) || isset($canvasData[0]['id'])));
        if ($hasSections) {
            $html = $this->compileCanvasToHtml($canvasData, $page, $funnel);
            $page->update([
                'html_cache'        => $html,
                'cache_compiled_at' => now(),
            ]);
        } elseif (! empty($page->html_cache)) {
            $html = $page->html_cache;
        } else {
            $html = $this->compileCanvasToHtml($canvasData, $page, $funnel);
        }

        // Inject runtime context (workspaceSlug, funnelSlug, stepId, api endpoints)
        $isCustomDomain = $request->attributes->has('custom_domain');
        $contextScript = '<script>window.__FUNNEL_CONTEXT__ = ' . json_encode([
            'workspaceSlug' => $workspaceSlug,
            'funnelSlug'    => $funnelSlug,
            'stepId'        => $currentStep->id,
            'stepType'      => $currentStep->type,
            'pageId'        => $page->id,
            'variant'       => $assignedVariant,
            'endpoints'     => [
                'optin'        => $isCustomDomain ? url('/optin') : url("/f/{$workspaceSlug}/{$funnelSlug}/optin"),
                'step1Lead'    => $isCustomDomain ? url('/step-1-lead') : url("/f/{$workspaceSlug}/{$funnelSlug}/step-1-lead"),
                'checkout'     => $isCustomDomain ? url('/checkout') : url("/f/{$workspaceSlug}/{$funnelSlug}/checkout"),
                'upsellAction' => $isCustomDomain ? url('/upsell-action') : url("/f/{$workspaceSlug}/{$funnelSlug}/upsell-action"),
            ]
        ], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) . ';</script>';

        $customDomain = $request->attributes->get('custom_domain');
        if ($customDomain && !empty($customDomain->settings['custom_head_scripts'])) {
            $customScripts = $customDomain->settings['custom_head_scripts'];
            $html = str_ireplace('</head>', $customScripts . "\n</head>", $html);
        }
        if ($customDomain && !empty($customDomain->settings['custom_css'])) {
            $customCss = "<style>\n" . $customDomain->settings['custom_css'] . "\n</style>";
            $html = str_ireplace('</head>', $customCss . "\n</head>", $html);
        }

        if (stripos($html, '</head>') !== false) {
            $html = str_ireplace('</head>', $contextScript . "\n</head>", $html);
        } else {
            $html = $contextScript . $html;
        }

        $response = response($html, 200)
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('X-Robots-Tag', $funnel->no_index ? 'noindex, nofollow' : 'index, follow')
            ->header('Cache-Control', 'no-store');

        if ($refCode) {
            $response->cookie('funnel_ref', $refCode, 60 * 24 * 30, '/', null, true, true);
        }

        $response->cookie($variantCookieKey, $assignedVariant, 60 * 24 * 7, '/', null, true, true);

        return $response;
    }

    // ─── Share Preview (public, no auth) ─────────────────────────────────────────

    public function sharePreview(string $shareToken): \Illuminate\Http\JsonResponse
    {
        $funnel = Funnel::where('share_token', $shareToken)
            ->where('is_shareable', true)
            ->with('steps')
            ->firstOrFail();

        return response()->json([
            'name'        => $funnel->name,
            'steps_count' => $funnel->steps->count(),
            'steps'       => $funnel->steps->map(fn ($s) => ['name' => $s->name, 'type' => $s->type]),
        ]);
    }

    // ─── PHP Scoped CSS Compiler Engine (competitor-grade) ──────────────────

    private function compileCanvasToHtml(array $canvasJson, $page = null, $funnel = null): string
    {
        $sections   = $canvasJson['sections'] ?? (isset($canvasJson[0]) ? $canvasJson : []);
        $styleGuide = $canvasJson['styleGuide'] ?? [];
        $seoSettings= $canvasJson['seoSettings']?? [];
        $customCode = $canvasJson['customCode'] ?? [];

        $defaultFont  = $styleGuide['defaultFont']       ?? "'Inter', sans-serif";
        $headingFont  = $styleGuide['headingFontName']   ?? "'Lora', serif";
        $headingColor = $styleGuide['headingColor']      ?? "#111827";
        $bgColor      = $styleGuide['bgColor']           ?? '#ffffff';
        $textColor    = $styleGuide['textColor']         ?? '#1f2937';
        $linkColor    = $styleGuide['linkColor']         ?? '#c87a57';
        $bodyAlign    = $styleGuide['bodyAlignment']     ?? 'left';
        $maxWidth     = $styleGuide['containerMaxWidth'] ?? 1200;
        $paddingX     = $styleGuide['containerPaddingX'] ?? 24;
        $paddingY     = $styleGuide['sectionPaddingY']   ?? 48;
        $fontSize     = $styleGuide['fontSize']          ?? 17;
        $lineHeight   = $styleGuide['lineHeight']        ?? 25;

        $metaTitle    = !empty($seoSettings['metaTitle']) ? e($seoSettings['metaTitle']) : (!empty($page->meta_title) ? e($page->meta_title) : e($funnel->name ?? 'Live Funnel Page'));
        $metaDesc     = !empty($seoSettings['metaDescription']) ? e($seoSettings['metaDescription']) : (!empty($page->meta_description) ? e($page->meta_description) : '');
        $ogImage      = !empty($seoSettings['ogImage']) ? e($seoSettings['ogImage']) : (!empty($page->og_image_url) ? e($page->og_image_url) : '');
        $headerCode   = $customCode['headerCode'] ?? '';
        $footerCode   = $customCode['footerCode'] ?? '';

        $cssRules    = [];
        $tabletRules = [];
        $mobileRules = [];

        $sysPrimary   = $styleGuide['systemColors']['primary']   ?? '#6EC1E4';
        $sysSecondary = $styleGuide['systemColors']['secondary'] ?? '#54595F';
        $sysText      = $styleGuide['systemColors']['text']      ?? '#7A7A7A';
        $sysAccent    = $styleGuide['systemColors']['accent']    ?? '#61CE70';

        $customVars = '';
        if (!empty($styleGuide['customColors']) && is_array($styleGuide['customColors'])) {
            foreach ($styleGuide['customColors'] as $c) {
                if (!empty($c['id'])) {
                    $val = $c['value'] ?? '#3B82F6';
                    $customVars .= " --color-{$c['id']}:{$val};";
                }
            }
        }

        // ── Global Design Tokens & Base Styles ───────────────────────────────
        $hVars = '';
        foreach (['h1','h2','h3','h4','h5','h6'] as $h) {
            $typo = $styleGuide["{$h}Typography"] ?? [];
            $col  = $styleGuide["{$h}Color"] ?? ($styleGuide['headingColor'] ?? '#111827');
            $fFam = $typo['family'] ?? ($styleGuide['headingFontName'] ?? ($styleGuide['defaultFont'] ?? "'Inter', sans-serif"));
            $fSz  = $typo['size'] ?? ($h === 'h1' ? 32 : ($h === 'h2' ? 24 : ($h === 'h3' ? 20 : 18)));
            $fWt  = $typo['weight'] ?? '700';
            $fLh  = $typo['lineHeight'] ?? 36;
            $fTr  = ($typo['transform'] ?? 'none') === 'Default' ? 'none' : ($typo['transform'] ?? 'none');
            $fSt  = ($typo['style'] ?? 'normal') === 'Default' ? 'normal' : ($typo['style'] ?? 'normal');
            $fDc  = ($typo['decoration'] ?? 'none') === 'Default' ? 'none' : ($typo['decoration'] ?? 'none');

            $defaultMb = ($h === 'h1' || $h === 'h2' || $h === 'h3') ? 12 : (($h === 'h4') ? 10 : 8);
            $mUnit = $styleGuide["{$h}MarginUnit"] ?? ($styleGuide['headingMarginBottomUnit'] ?? 'px');
            $pUnit = $styleGuide["{$h}PaddingUnit"] ?? 'px';

            $hmTop = ($styleGuide["{$h}MarginTop"] ?? 0) . $mUnit;
            $hmRight = ($styleGuide["{$h}MarginRight"] ?? 0) . $mUnit;
            $hmBot = ($styleGuide["{$h}MarginBottom"] ?? ($styleGuide['headingMarginBottom'] ?? $defaultMb)) . $mUnit;
            $hmLeft = ($styleGuide["{$h}MarginLeft"] ?? 0) . $mUnit;

            $hpTop = ($styleGuide["{$h}PaddingTop"] ?? 0) . $pUnit;
            $hpRight = ($styleGuide["{$h}PaddingRight"] ?? 0) . $pUnit;
            $hpBot = ($styleGuide["{$h}PaddingBottom"] ?? 0) . $pUnit;
            $hpLeft = ($styleGuide["{$h}PaddingLeft"] ?? 0) . $pUnit;

            $hVars .= " --brand-{$h}-font-family:{$fFam}; --brand-{$h}-font-size:{$fSz}px; --brand-{$h}-font-weight:{$fWt}; --brand-{$h}-line-height:{$fLh}px; --brand-{$h}-color:{$col}; --brand-{$h}-text-transform:{$fTr}; --brand-{$h}-font-style:{$fSt}; --brand-{$h}-text-decoration:{$fDc}; --brand-{$h}-margin-top:{$hmTop}; --brand-{$h}-margin-right:{$hmRight}; --brand-{$h}-margin-bottom:{$hmBot}; --brand-{$h}-margin-left:{$hmLeft}; --brand-{$h}-padding-top:{$hpTop}; --brand-{$h}-padding-right:{$hpRight}; --brand-{$h}-padding-bottom:{$hpBot}; --brand-{$h}-padding-left:{$hpLeft};";
        }

        $bTypo = $styleGuide['bodyTypography'] ?? [];
        $bFont = $bTypo['family'] ?? ($styleGuide['defaultFont'] ?? "'Inter', sans-serif");
        $bSize = $bTypo['size'] ?? ($styleGuide['fontSize'] ?? 16);
        $bWeight = $bTypo['weight'] ?? '400';
        $bLh   = $bTypo['lineHeight'] ?? ($styleGuide['lineHeight'] ?? 24);
        $bCol  = $styleGuide['textColor'] ?? '#1f2937';

        $bMUnit = $styleGuide['bodyMarginUnit'] ?? ($styleGuide['paragraphMarginBottomUnit'] ?? 'px');
        $bPUnit = $styleGuide['bodyPaddingUnit'] ?? 'px';
        $bmTop  = ($styleGuide['bodyMarginTop'] ?? 0) . $bMUnit;
        $bmRight= ($styleGuide['bodyMarginRight'] ?? 0) . $bMUnit;
        $bmBot  = ($styleGuide['bodyMarginBottom'] ?? ($styleGuide['paragraphMarginBottom'] ?? 16)) . $bMUnit;
        $bmLeft = ($styleGuide['bodyMarginLeft'] ?? 0) . $bMUnit;
        $bpTop  = ($styleGuide['bodyPaddingTop'] ?? 0) . $bPUnit;
        $bpRight= ($styleGuide['bodyPaddingRight'] ?? 0) . $bPUnit;
        $bpBot  = ($styleGuide['bodyPaddingBottom'] ?? 0) . $bPUnit;
        $bpLeft = ($styleGuide['bodyPaddingLeft'] ?? 0) . $bPUnit;

        $btnTypo = $styleGuide['btnTypography'] ?? [];
        $btnFont = $btnTypo['family'] ?? ($styleGuide['defaultFont'] ?? "'Inter', sans-serif");
        $btnSize = $btnTypo['size'] ?? 16;
        $btnWeight = $btnTypo['weight'] ?? '700';
        $btnBg   = $styleGuide['btnBgColor'] ?? ($styleGuide['linkColor'] ?? '#c87a57');
        $btnCol  = $styleGuide['btnTextColor'] ?? '#ffffff';
        $btnRad  = $styleGuide['btnRadiusTop'] ?? 12;
        $btnHBg  = $styleGuide['btnHoverBgColor'] ?? '#b36443';
        $btnHCol = $styleGuide['btnHoverTextColor'] ?? '#ffffff';

        $btnMUnit = $styleGuide['btnMarginUnit'] ?? ($styleGuide['buttonMarginBottomUnit'] ?? 'px');
        $btnPUnit = $styleGuide['btnPaddingUnit'] ?? 'px';
        $btnMTop  = ($styleGuide['btnMarginTop'] ?? 0) . $btnMUnit;
        $btnMRight= ($styleGuide['btnMarginRight'] ?? 0) . $btnMUnit;
        $btnMBot  = ($styleGuide['btnMarginBottom'] ?? ($styleGuide['buttonMarginBottom'] ?? 16)) . $btnMUnit;
        $btnMLeft = ($styleGuide['btnMarginLeft'] ?? 0) . $btnMUnit;
        $btnPTop  = ($styleGuide['btnPaddingTop'] ?? 14) . $btnPUnit;
        $btnPRight= ($styleGuide['btnPaddingRight'] ?? 28) . $btnPUnit;
        $btnPBot  = ($styleGuide['btnPaddingBottom'] ?? 14) . $btnPUnit;
        $btnPLeft = ($styleGuide['btnPaddingLeft'] ?? 28) . $btnPUnit;

        $fTypo  = $styleGuide['fieldTypography'] ?? [];
        $fBorder = $styleGuide['fieldBorder'] ?? [];
        $fFont  = $fTypo['family'] ?? ($styleGuide['defaultFont'] ?? "'Inter', sans-serif");
        $fSize  = $fTypo['size'] ?? 14;
        $fBg    = $styleGuide['fieldBgColor'] ?? '#ffffff';
        $fCol   = $styleGuide['fieldTextColor'] ?? '#111827';
        $fBCol  = $fBorder['color'] ?? '#d1d5db';
        $fRad   = $styleGuide['fieldRadiusTop'] ?? 8;

        $fMUnit = $styleGuide['fieldMarginUnit'] ?? ($styleGuide['fieldMarginBottomUnit'] ?? 'px');
        $fPUnit = $styleGuide['fieldPaddingUnit'] ?? 'px';
        $fMTop  = ($styleGuide['fieldMarginTop'] ?? 0) . $fMUnit;
        $fMRight= ($styleGuide['fieldMarginRight'] ?? 0) . $fMUnit;
        $fMBot  = ($styleGuide['fieldMarginBottom'] ?? ($styleGuide['fieldMarginBottom'] ?? 12)) . $fMUnit;
        $fMLeft = ($styleGuide['fieldMarginLeft'] ?? 0) . $fMUnit;
        $fPTop  = ($styleGuide['fieldPaddingTop'] ?? 12) . $fPUnit;
        $fPRight= ($styleGuide['fieldPaddingRight'] ?? 16) . $fPUnit;
        $fPBot  = ($styleGuide['fieldPaddingBottom'] ?? 12) . $fPUnit;
        $fPLeft = ($styleGuide['fieldPaddingLeft'] ?? 16) . $fPUnit;

        $cWidthUnit = $styleGuide['containerWidthUnit'] ?? 'px';
        $cWidthVal  = $styleGuide['containerWidth'] ?? 1200;
        $cWidth     = ($cWidthVal === '100%' || str_ends_with((string)$cWidthVal, '%')) ? '100%' : "{$cWidthVal}{$cWidthUnit}";

        $cPadUnit  = $styleGuide['containerPaddingUnit'] ?? 'px';
        $cPadTop   = ($styleGuide['containerPaddingTop'] ?? 48) . $cPadUnit;
        $cPadRight = ($styleGuide['containerPaddingRight'] ?? 24) . $cPadUnit;
        $cPadBot   = ($styleGuide['containerPaddingBottom'] ?? 48) . $cPadUnit;
        $cPadLeft  = ($styleGuide['containerPaddingLeft'] ?? 24) . $cPadUnit;

        $cMarUnit  = $styleGuide['containerMarginUnit'] ?? ($styleGuide['sectionMarginBottomUnit'] ?? 'px');
        $cMarTop   = ($styleGuide['containerMarginTop'] ?? 0) . $cMarUnit;
        $cMarRight = $styleGuide['containerMarginRight'] ?? 'auto';
        $cMarBot   = ($styleGuide['containerMarginBottom'] ?? ($styleGuide['sectionMarginBottom'] ?? 24)) . $cMarUnit;
        $cMarLeft  = $styleGuide['containerMarginLeft'] ?? 'auto';

        $gapXUnit = $styleGuide['elementGapXUnit'] ?? 'px';
        $gapYUnit = $styleGuide['elementGapYUnit'] ?? 'px';
        $elGapX   = ($styleGuide['elementGapX'] ?? $styleGuide['elementGap'] ?? 24) . $gapXUnit;
        $elGapY   = ($styleGuide['elementGapY'] ?? $styleGuide['elementGap'] ?? 24) . $gapYUnit;

        $qPUnit = $styleGuide['quotePaddingUnit'] ?? 'px';
        $qPTop  = ($styleGuide['quotePaddingTop'] ?? 16) . $qPUnit;
        $qPRight= ($styleGuide['quotePaddingRight'] ?? 20) . $qPUnit;
        $qPBot  = ($styleGuide['quotePaddingBottom'] ?? 16) . $qPUnit;
        $qPLeft = ($styleGuide['quotePaddingLeft'] ?? 20) . $qPUnit;
        $qBWidth= ($styleGuide['quoteBorderWidth'] ?? 4) . 'px';
        $quoteBg = $styleGuide['quoteBgColor'] ?? 'rgba(99,102,241,0.06)';
        $quoteBCol = $styleGuide['quoteBorderColor'] ?? ($sysPrimary ?? '#6EC1E4');
        $quoteTCol = $styleGuide['quoteTextColor'] ?? ($sysText ?? '#374151');
        $quoteBRad = $styleGuide['quoteBorderRadius'] ?? '0 8px 8px 0';
        $quoteFStyle = $styleGuide['quoteFontStyle'] ?? 'italic';
        $quoteFWeight = $styleGuide['quoteFontWeight'] ?? 400;
        $quoteCWeight = $styleGuide['quoteCiteWeight'] ?? 700;
        $quoteCStyle = $styleGuide['quoteCiteStyle'] ?? 'normal';

        $bulletGap = ($styleGuide['bulletGap'] ?? 8) . 'px';
        $bulletCol = $styleGuide['bulletIconColor'] ?? ($sysPrimary ?? '#16a34a');

        $imgRad = ($styleGuide['imgBorderRadius'] ?? 8) . 'px';
        $imgSh  = $styleGuide['imgShadow'] ?? '0 4px 12px rgba(0,0,0,0.1)';
        $vidRad = ($styleGuide['videoBorderRadius'] ?? 12) . 'px';
        $vidSh  = $styleGuide['videoShadow'] ?? '0 10px 25px rgba(0,0,0,0.2)';

        $divWidth = ($styleGuide['dividerWidth'] ?? 1) . 'px';
        $divStyle = $styleGuide['dividerStyle'] ?? 'solid';
        $divCol   = $styleGuide['dividerColor'] ?? '#e5e7eb';
        $divMTop  = ($styleGuide['dividerMarginTop'] ?? 24) . 'px';
        $divMBot  = ($styleGuide['dividerMarginBottom'] ?? 24) . 'px';

        $spHeight = ($styleGuide['spacerHeight'] ?? 40) . 'px';

        $tmPad  = ($styleGuide['timerPadding'] ?? 16) . 'px';
        $tmRad  = ($styleGuide['timerBorderRadius'] ?? 12) . 'px';
        $tmSize = ($styleGuide['timerFontSize'] ?? 24) . 'px';
        $tmWeight = $styleGuide['timerFontWeight'] ?? 700;
        $tmBg   = $styleGuide['timerBgColor'] ?? '#fef2f2';
        $tmBCol = $styleGuide['timerBorderColor'] ?? '#fca5a5';
        $tmTCol = $styleGuide['timerTextColor'] ?? '#dc2626';

        $colPUnit = $styleGuide['colPaddingUnit'] ?? 'px';
        $colPTop  = ($styleGuide['colPaddingTop'] ?? 0) . $colPUnit;
        $colPRight= ($styleGuide['colPaddingRight'] ?? 0) . $colPUnit;
        $colPBot  = ($styleGuide['colPaddingBottom'] ?? 0) . $colPUnit;
        $colPLeft = ($styleGuide['colPaddingLeft'] ?? 0) . $colPUnit;

        $colMUnit = $styleGuide['colMarginUnit'] ?? 'px';
        $colMTop  = ($styleGuide['colMarginTop'] ?? 0) . $colMUnit;
        $colMRight= ($styleGuide['colMarginRight'] ?? 0) . $colMUnit;
        $colMBot  = ($styleGuide['colMarginBottom'] ?? 0) . $colMUnit;
        $colMLeft = ($styleGuide['colMarginLeft'] ?? 0) . $colMUnit;

        $cssRules[] = ":root { --color-primary:{$sysPrimary}; --color-secondary:{$sysSecondary}; --color-text:{$sysText}; --color-accent:{$sysAccent};{$customVars}{$hVars} --brand-body-font-family:{$bFont}; --brand-body-font-size:{$bSize}px; --brand-body-font-weight:{$bWeight}; --brand-body-line-height:{$bLh}px; --brand-body-color:{$bCol}; --brand-body-margin-top:{$bmTop}; --brand-body-margin-right:{$bmRight}; --brand-body-margin-bottom:{$bmBot}; --brand-body-margin-left:{$bmLeft}; --brand-body-padding-top:{$bpTop}; --brand-body-padding-right:{$bpRight}; --brand-body-padding-bottom:{$bpBot}; --brand-body-padding-left:{$bpLeft}; --brand-btn-font-family:{$btnFont}; --brand-btn-font-size:{$btnSize}px; --brand-btn-font-weight:{$btnWeight}; --brand-btn-bg-color:{$btnBg}; --brand-btn-text-color:{$btnCol}; --brand-btn-border-radius:{$btnRad}px; --brand-btn-hover-bg-color:{$btnHBg}; --brand-btn-hover-text-color:{$btnHCol}; --brand-btn-margin-top:{$btnMTop}; --brand-btn-margin-right:{$btnMRight}; --brand-btn-margin-bottom:{$btnMBot}; --brand-btn-margin-left:{$btnMLeft}; --brand-btn-padding-top:{$btnPTop}; --brand-btn-padding-right:{$btnPRight}; --brand-btn-padding-bottom:{$btnPBot}; --brand-btn-padding-left:{$btnPLeft}; --brand-field-font-family:{$fFont}; --brand-field-font-size:{$fSize}px; --brand-field-bg-color:{$fBg}; --brand-field-text-color:{$fCol}; --brand-field-border-color:{$fBCol}; --brand-field-border-radius:{$fRad}px; --brand-field-margin-top:{$fMTop}; --brand-field-margin-right:{$fMRight}; --brand-field-margin-bottom:{$fMBot}; --brand-field-margin-left:{$fMLeft}; --brand-field-padding-top:{$fPTop}; --brand-field-padding-right:{$fPRight}; --brand-field-padding-bottom:{$fPBot}; --brand-field-padding-left:{$fPLeft}; --brand-container-width:{$cWidth}; --brand-container-margin-top:{$cMarTop}; --brand-container-margin-right:{$cMarRight}; --brand-container-margin-bottom:{$cMarBot}; --brand-container-margin-left:{$cMarLeft}; --brand-container-padding-top:{$cPadTop}; --brand-container-padding-right:{$cPadRight}; --brand-container-padding-bottom:{$cPadBot}; --brand-container-padding-left:{$cPadLeft}; --brand-element-gap-x:{$elGapX}; --brand-element-gap-y:{$elGapY}; --brand-quote-padding-top:{$qPTop}; --brand-quote-padding-right:{$qPRight}; --brand-quote-padding-bottom:{$qPBot}; --brand-quote-padding-left:{$qPLeft}; --brand-quote-border-width:{$qBWidth}; --brand-quote-border-color:{$quoteBCol}; --brand-quote-bg-color:{$quoteBg}; --brand-quote-text-color:{$quoteTCol}; --brand-quote-border-radius:{$quoteBRad}; --brand-quote-font-style:{$quoteFStyle}; --brand-quote-font-weight:{$quoteFWeight}; --brand-quote-cite-weight:{$quoteCWeight}; --brand-quote-cite-style:{$quoteCStyle}; --brand-bullet-gap:{$bulletGap}; --brand-bullet-icon-color:{$bulletCol}; --brand-img-border-radius:{$imgRad}; --brand-img-shadow:{$imgSh}; --brand-video-border-radius:{$vidRad}; --brand-video-shadow:{$vidSh}; --brand-divider-width:{$divWidth}; --brand-divider-style:{$divStyle}; --brand-divider-color:{$divCol}; --brand-divider-margin-top:{$divMTop}; --brand-divider-margin-bottom:{$divMBot}; --brand-spacer-height:{$spHeight}; --brand-timer-padding:{$tmPad}; --brand-timer-border-radius:{$tmRad}; --brand-timer-font-size:{$tmSize}; --brand-timer-font-weight:{$tmWeight}; --brand-timer-bg-color:{$tmBg}; --brand-timer-border-color:{$tmBCol}; --brand-timer-text-color:{$tmTCol}; --brand-col-padding-top:{$colPTop}; --brand-col-padding-right:{$colPRight}; --brand-col-padding-bottom:{$colPBot}; --brand-col-padding-left:{$colPLeft}; --brand-col-margin-top:{$colMTop}; --brand-col-margin-right:{$colMRight}; --brand-col-margin-bottom:{$colMBot}; --brand-col-margin-left:{$colMLeft}; }";
        $cssRules[] = "*, *::before, *::after { box-sizing: border-box; }";
        $cssRules[] = "body { margin:0; padding:0; font-family:var(--brand-body-font-family); background-color:{$bgColor}; color:var(--brand-body-color); font-size:var(--brand-body-font-size); line-height:var(--brand-body-line-height); min-height:100vh; }";
        $cssRules[] = "h1 { margin:var(--brand-h1-margin-top) var(--brand-h1-margin-right) var(--brand-h1-margin-bottom) var(--brand-h1-margin-left); padding:var(--brand-h1-padding-top) var(--brand-h1-padding-right) var(--brand-h1-padding-bottom) var(--brand-h1-padding-left); font-family:var(--brand-h1-font-family); font-size:var(--brand-h1-font-size); font-weight:var(--brand-h1-font-weight); line-height:var(--brand-h1-line-height); color:var(--brand-h1-color); text-transform:var(--brand-h1-text-transform); font-style:var(--brand-h1-font-style); text-decoration:var(--brand-h1-text-decoration); }";
        $cssRules[] = "h2 { margin:var(--brand-h2-margin-top) var(--brand-h2-margin-right) var(--brand-h2-margin-bottom) var(--brand-h2-margin-left); padding:var(--brand-h2-padding-top) var(--brand-h2-padding-right) var(--brand-h2-padding-bottom) var(--brand-h2-padding-left); font-family:var(--brand-h2-font-family); font-size:var(--brand-h2-font-size); font-weight:var(--brand-h2-font-weight); line-height:var(--brand-h2-line-height); color:var(--brand-h2-color); text-transform:var(--brand-h2-text-transform); font-style:var(--brand-h2-font-style); text-decoration:var(--brand-h2-text-decoration); }";
        $cssRules[] = "h3 { margin:var(--brand-h3-margin-top) var(--brand-h3-margin-right) var(--brand-h3-margin-bottom) var(--brand-h3-margin-left); padding:var(--brand-h3-padding-top) var(--brand-h3-padding-right) var(--brand-h3-padding-bottom) var(--brand-h3-padding-left); font-family:var(--brand-h3-font-family); font-size:var(--brand-h3-font-size); font-weight:var(--brand-h3-font-weight); line-height:var(--brand-h3-line-height); color:var(--brand-h3-color); text-transform:var(--brand-h3-text-transform); font-style:var(--brand-h3-font-style); text-decoration:var(--brand-h3-text-decoration); }";
        $cssRules[] = "h4 { margin:var(--brand-h4-margin-top) var(--brand-h4-margin-right) var(--brand-h4-margin-bottom) var(--brand-h4-margin-left); padding:var(--brand-h4-padding-top) var(--brand-h4-padding-right) var(--brand-h4-padding-bottom) var(--brand-h4-padding-left); font-family:var(--brand-h4-font-family); font-size:var(--brand-h4-font-size); font-weight:var(--brand-h4-font-weight); line-height:var(--brand-h4-line-height); color:var(--brand-h4-color); text-transform:var(--brand-h4-text-transform); font-style:var(--brand-h4-font-style); text-decoration:var(--brand-h4-text-decoration); }";
        $cssRules[] = "h5 { margin:var(--brand-h5-margin-top) var(--brand-h5-margin-right) var(--brand-h5-margin-bottom) var(--brand-h5-margin-left); padding:var(--brand-h5-padding-top) var(--brand-h5-padding-right) var(--brand-h5-padding-bottom) var(--brand-h5-padding-left); font-family:var(--brand-h5-font-family); font-size:var(--brand-h5-font-size); font-weight:var(--brand-h5-font-weight); line-height:var(--brand-h5-line-height); color:var(--brand-h5-color); text-transform:var(--brand-h5-text-transform); font-style:var(--brand-h5-font-style); text-decoration:var(--brand-h5-text-decoration); }";
        $cssRules[] = "h6 { margin:var(--brand-h6-margin-top) var(--brand-h6-margin-right) var(--brand-h6-margin-bottom) var(--brand-h6-margin-left); padding:var(--brand-h6-padding-top) var(--brand-h6-padding-right) var(--brand-h6-padding-bottom) var(--brand-h6-padding-left); font-family:var(--brand-h6-font-family); font-size:var(--brand-h6-font-size); font-weight:var(--brand-h6-font-weight); line-height:var(--brand-h6-line-height); color:var(--brand-h6-color); text-transform:var(--brand-h6-text-transform); font-style:var(--brand-h6-font-style); text-decoration:var(--brand-h6-text-decoration); }";
        $cssRules[] = "main.funnel-container { width:100%; max-width:100%; margin:0 auto; padding:0; }";
        $cssRules[] = "section { width:100%; max-width:100%; padding-top:var(--brand-container-padding-top); padding-right:var(--brand-container-padding-right); padding-bottom:var(--brand-container-padding-bottom); padding-left:var(--brand-container-padding-left); margin-top:var(--brand-container-margin-top); margin-right:auto; margin-bottom:var(--brand-container-margin-bottom); margin-left:auto; box-sizing:border-box; }";
        $cssRules[] = ".funnel-section-inner { width:100%; max-width:var(--section-max-width, 100%); margin-left:auto; margin-right:auto; box-sizing:border-box; }";
        $cssRules[] = ".funnel-row { display:grid; row-gap:var(--row-gap-y, var(--row-gap, var(--brand-element-gap-y))); column-gap:var(--row-gap-x, var(--row-gap, var(--brand-element-gap-x))); gap:var(--row-gap, var(--brand-element-gap-y) var(--brand-element-gap-x)); width:100%; max-width:var(--row-max-width, var(--brand-container-width)); margin-left:auto; margin-right:auto; box-sizing:border-box; justify-items:var(--row-justify, stretch); align-items:var(--row-align, stretch); }";
        $cssRules[] = ".funnel-flex-container { display:flex; gap:var(--brand-element-gap-y) var(--brand-element-gap-x); }";
        $cssRules[] = ".funnel-row-grid_container { grid-template-columns:var(--grid-cols, repeat(var(--grid-cols-count, 2), minmax(0, 1fr))); }";
        $cssRules[] = ".funnel-row-col_1 { grid-template-columns:var(--grid-cols, 1fr); }";
        $cssRules[] = ".funnel-row-col_2 { grid-template-columns:var(--grid-cols, repeat(2, minmax(0, 1fr))); }";
        $cssRules[] = ".funnel-row-col_3 { grid-template-columns:var(--grid-cols, repeat(3, minmax(0, 1fr))); }";
        $cssRules[] = ".funnel-row-col_4 { grid-template-columns:var(--grid-cols, repeat(4, minmax(0, 1fr))); }";
        $cssRules[] = ".funnel-row-col_sidebar { grid-template-columns:var(--grid-cols, minmax(0, 7fr) minmax(0, 3fr)); }";
        $cssRules[] = ".funnel-col { position:relative; width:100%; min-width:0; display:flex; flex-direction:column; box-sizing:border-box; justify-content:var(--col-justify, flex-start); align-items:var(--col-align, stretch); gap:var(--col-gap, 0px); padding:var(--brand-col-padding-top) var(--brand-col-padding-right) var(--brand-col-padding-bottom) var(--brand-col-padding-left); margin:var(--brand-col-margin-top) var(--brand-col-margin-right) var(--brand-col-margin-bottom) var(--brand-col-margin-left); }";
        $cssRules[] = ".funnel-col-badge { position:absolute; top:-12px; left:50%; transform:translateX(-50%); padding:4px 14px; border-radius:9999px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; box-shadow:0 3px 10px rgba(0,0,0,0.15); z-index:15; white-space:nowrap; }";
        $cssRules[] = ".funnel-col-clickable { cursor:pointer; text-decoration:none; color:inherit; display:flex; flex-direction:column; }";
        $cssRules[] = ".funnel-col-clickable:hover { opacity:0.98; }";
        $cssRules[] = ".funnel-hp-check { display:none; visibility:hidden; position:absolute; left:-9999px; }";
        $cssRules[] = ".funnel-bullets { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }";
        $cssRules[] = ".funnel-bullet-item { display:flex; align-items:center; gap:10px; }";
        $cssRules[] = ".funnel-bullet-item .bullet-icon { display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:bold; }";
        $cssRules[] = ".funnel-bullet-item .bullet-text { flex:1; }";
        $cssRules[] = ".funnel-quote { padding:var(--brand-quote-padding-top) var(--brand-quote-padding-right) var(--brand-quote-padding-bottom) var(--brand-quote-padding-left); border-left:var(--brand-quote-border-width) solid var(--brand-quote-border-color); background:var(--brand-quote-bg-color); margin:0 0 16px 0; border-radius:var(--brand-quote-border-radius); }";
        $cssRules[] = ".funnel-quote .quote-text { font-style:var(--brand-quote-font-style); font-weight:var(--brand-quote-font-weight); margin:0 0 8px 0; color:var(--brand-quote-text-color); }";
        $cssRules[] = ".funnel-quote .quote-author { font-weight:var(--brand-quote-cite-weight); font-style:var(--brand-quote-cite-style); color:var(--brand-quote-border-color); }";
        $cssRules[] = ".funnel-img { display:block; width:100%; height:auto; border-radius:var(--brand-img-border-radius); box-shadow:var(--brand-img-shadow); transition:transform 0.3s ease; }";
        $cssRules[] = ".funnel-img-link { display:block; width:100%; text-decoration:none; }";
        $cssRules[] = ".funnel-img:hover { transform:scale(1.02); }";
        $cssRules[] = ".funnel-video-wrap { position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:var(--brand-video-border-radius); box-shadow:var(--brand-video-shadow); margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-video-wrap iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:0; }";
        $cssRules[] = ".funnel-btn { width:100%; padding:var(--brand-btn-padding-top) var(--brand-btn-padding-right) var(--brand-btn-padding-bottom) var(--brand-btn-padding-left); margin:var(--brand-btn-margin-top) var(--brand-btn-margin-right) var(--brand-btn-margin-bottom) var(--brand-btn-margin-left); font-family:var(--brand-btn-font-family); font-size:var(--brand-btn-font-size); font-weight:var(--brand-btn-font-weight); cursor:pointer; border:none; border-radius:var(--brand-btn-border-radius); background:var(--brand-btn-bg-color); color:var(--brand-btn-text-color); transition:all 0.2s ease; display:inline-flex; flex-direction:column; align-items:center; justify-content:center; text-decoration:none; }";
        $cssRules[] = ".funnel-btn .btn-icon-wrap { display:inline-flex; align-items:center; }";
        $cssRules[] = ".funnel-btn .btn-subtext { display:block; margin-top:3px; }";
        $cssRules[] = ".funnel-input { width:100%; outline:none; transition:border-color 0.2s; padding:12px 14px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; box-sizing:border-box; }";
        $cssRules[] = ".funnel-input:focus { border-color:var(--color-primary, #467235); box-shadow:0 0 0 3px rgba(70,114,53,0.15); }";
        $cssRules[] = ".funnel-checkbox { display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px; }";
        $cssRules[] = ".funnel-divider { border:none; border-top:var(--brand-divider-width) var(--brand-divider-style) var(--brand-divider-color); margin:var(--brand-divider-margin-top) 0 var(--brand-divider-margin-bottom) 0; }";
        $cssRules[] = ".funnel-spacer { height:var(--brand-spacer-height); }";
        $cssRules[] = ".funnel-timer { padding:var(--brand-timer-padding); background:var(--brand-timer-bg-color); border:1px solid var(--brand-timer-border-color); border-radius:var(--brand-timer-border-radius); text-align:center; font-weight:var(--brand-timer-font-weight); color:var(--brand-timer-text-color); font-family:monospace; font-size:var(--brand-timer-font-size); margin:0 0 16px 0; letter-spacing:2px; }";
        $cssRules[] = ".timer-theme-red_urgent { background:#fef2f2; border:1px solid #fca5a5; color:#dc2626; }";
        $cssRules[] = ".timer-theme-brand { background:rgba(99,102,241,0.08); border:1px solid var(--color-primary, #6EC1E4); color:var(--color-primary, #467235); }";
        $cssRules[] = ".timer-theme-dark { background:#111827; border:1px solid #374151; color:#ffffff; }";
        $cssRules[] = ".timer-theme-light { background:#ffffff; border:1px solid #e5e7eb; color:#111827; box-shadow:0 1px 3px rgba(0,0,0,0.05); }";
        $cssRules[] = ".timer-theme-minimal { background:transparent; border:none; color:var(--color-primary, #111827); padding:0; }";
        $cssRules[] = ".timer-active-wrap { display:flex; align-items:center; justify-content:center; gap:10px; }";
        $cssRules[] = ".timer-expired-wrap { display:none; font-weight:800; letter-spacing:0.5px; color:#dc2626; }";
        $cssRules[] = ".funnel-audio-wrap { padding:14px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:var(--brand-field-border-radius); margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-audio-wrap .audio-title { margin:0 0 8px 0; font-weight:600; }";
        $cssRules[] = ".funnel-audio-wrap .audio-player { width:100%; }";
        $cssRules[] = ".funnel-icon-box { padding:20px; text-align:center; background:#ffffff; border:1px solid #f3f4f6; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05); margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-icon-box h3 { margin:0 0 8px 0; font-size:16px; color:var(--brand-body-color); }";
        $cssRules[] = ".funnel-icon-box p { margin:0; color:#6b7280; font-size:14px; }";
        $cssRules[] = ".funnel-progress-wrap { margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-progress-wrap .progress-label { margin:0 0 4px 0; font-size:12px; font-weight:600; }";
        $cssRules[] = ".funnel-progress-bar { width:100%; height:14px; background:#e5e7eb; border-radius:9999px; overflow:hidden; }";
        $cssRules[] = ".funnel-progress-bar .progress-fill { height:100%; background:var(--color-primary, #467235); transition:width 0.5s; }";
        $cssRules[] = ".funnel-social-wrap { display:flex; gap:8px; justify-content:center; margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-social-wrap a { padding:8px 14px; color:#ffffff; border-radius:6px; text-decoration:none; font-size:12px; font-weight:700; display:inline-flex; align-items:center; }";
        $cssRules[] = ".funnel-social-fb { background:#1877F2; }";
        $cssRules[] = ".funnel-social-tw { background:#000000; }";
        $cssRules[] = ".funnel-social-wa { background:#25D366; }";
        $cssRules[] = ".funnel-star-rating { text-align:center; margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-star-rating .star-chars { color:#f59e0b; font-size:20px; letter-spacing:2px; }";
        $cssRules[] = ".funnel-star-rating .rating-subtext { margin:4px 0 0 0; font-size:12px; color:#6b7280; font-weight:600; }";
        $cssRules[] = ".funnel-custom-code { margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-rich-text { margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-order-bump { border:2px dashed #f87171; background:#fef2f2; padding:16px; border-radius:12px; margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-order-bump .bump-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }";
        $cssRules[] = ".funnel-order-bump .bump-badge { background:#dc2626; color:#ffffff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; }";
        $cssRules[] = ".funnel-order-bump .bump-price { font-weight:800; color:#991b1b; font-size:14px; }";
        $cssRules[] = ".funnel-order-bump label { display:flex; gap:10px; cursor:pointer; align-items:flex-start; }";
        $cssRules[] = ".funnel-order-bump input[type=\"checkbox\"] { margin-top:3px; width:18px; height:18px; }";
        $cssRules[] = ".funnel-order-bump h4 { margin:0; font-size:14px; font-weight:700; color:#111827; }";
        $cssRules[] = ".funnel-order-bump p { margin:4px 0 0 0; font-size:12px; color:#4b5563; }";
        $cssRules[] = ".funnel-two-step-order { max-width:580px; margin:0 auto 24px auto; background:#ffffff; border:1px solid #e5e7eb; box-shadow:0 10px 25px -5px rgba(0,0,0,0.08); border-radius:16px; overflow:hidden; }";
        $cssRules[] = ".funnel-two-step-order .two-step-tabs { display:grid; grid-template-columns:1fr 1fr; background:#f9fafb; border-bottom:1px solid #e5e7eb; text-align:center; }";
        $cssRules[] = ".funnel-two-step-order .two-step-tab-btn { padding:14px 12px; font-weight:600; font-size:13px; color:#6b7280; cursor:pointer; border-bottom:3px solid transparent; }";
        $cssRules[] = ".funnel-two-step-order .two-step-tab-btn.active { font-weight:700; color:var(--color-primary, #6366f1); border-bottom-color:var(--color-primary, #6366f1); background:#ffffff; }";
        $cssRules[] = ".funnel-two-step-order .two-step-tab-btn .step-num { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#e5e7eb; color:#6b7280; font-size:11px; margin-right:6px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-tab-btn.active .step-num { background:var(--color-primary, #6366f1); color:#ffffff; }";
        $cssRules[] = ".funnel-two-step-order .two-step-pane { padding:24px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-pane-header { margin-bottom:16px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-pane-header h3 { margin:0; font-size:18px; font-weight:800; color:#111827; }";
        $cssRules[] = ".funnel-two-step-order .two-step-pane-header p { margin:4px 0 0 0; font-size:13px; color:#6b7280; }";
        $cssRules[] = ".funnel-two-step-order .two-step-form-grid { display:flex; flex-direction:column; gap:12px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-field-group label { display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:4px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-product-option { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border:2px solid #e5e7eb; border-radius:10px; margin-bottom:8px; cursor:pointer; background:#fff; transition:all 0.2s; }";
        $cssRules[] = ".funnel-two-step-order .two-step-product-option.selected, .funnel-two-step-order .two-step-product-option:first-of-type { border-color:var(--color-primary, #6366f1); }";
        $cssRules[] = ".funnel-two-step-order .two-step-product-info { display:flex; align-items:center; gap:10px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-product-radio { accent-color:var(--color-primary, #6366f1); width:18px; height:18px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-product-name { font-weight:700; font-size:14px; color:#111827; }";
        $cssRules[] = ".funnel-two-step-order .two-step-product-desc { font-size:12px; color:#6b7280; }";
        $cssRules[] = ".funnel-two-step-order .two-step-product-price { font-weight:800; font-size:16px; color:var(--color-primary, #6366f1); }";
        $cssRules[] = ".funnel-two-step-order .two-step-bump-box { border:2px dashed #f59e0b; background:#fffbeb; border-radius:10px; padding:14px; margin:16px 0; }";
        $cssRules[] = ".funnel-two-step-order .two-step-bump-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-bump-badge { background:#f59e0b; color:#fff; font-size:11px; font-weight:800; padding:2px 8px; border-radius:4px; letter-spacing:0.5px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-bump-price { font-weight:800; color:#b45309; font-size:15px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-bump-body { display:flex; gap:10px; cursor:pointer; }";
        $cssRules[] = ".funnel-two-step-order .two-step-bump-checkbox { accent-color:#f59e0b; width:20px; height:20px; margin-top:2px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-bump-title { font-weight:700; font-size:13px; color:#92400e; }";
        $cssRules[] = ".funnel-two-step-order .two-step-bump-desc { margin:2px 0 0 0; font-size:11px; color:#78350f; line-height:1.4; }";
        $cssRules[] = ".funnel-two-step-order .two-step-summary-box { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin:16px 0; font-weight:700; color:#334155; font-size:14px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-total-display { font-weight:900; color:#0f172a; font-size:20px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-payment-section { margin-bottom:16px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-payment-label { display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:6px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-payment-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); gap:8px; }";
        $cssRules[] = ".funnel-two-step-order .two-step-gateway-label { display:flex; align-items:center; justify-content:center; gap:6px; padding:8px; border:1px solid #d1d5db; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; background:#fff; }";
        $cssRules[] = ".funnel-two-step-order .btn-goto-step-2 { margin-top:8px; width:100%; padding:14px; background:var(--color-primary, #6366f1); color:#ffffff; font-size:15px; font-weight:700; border-radius:10px; border:none; cursor:pointer; transition:all 0.2s; }";
        $cssRules[] = ".funnel-two-step-order .btn-complete-checkout { width:100%; padding:16px; background:#10b981; color:#ffffff; font-size:16px; font-weight:800; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.35); transition:all 0.2s; }";
        $cssRules[] = ".funnel-two-step-order .two-step-guarantee { text-align:center; margin-top:12px; font-size:11px; color:#6b7280; }";
        $cssRules[] = ".funnel-upsell-box { max-width:620px; margin:0 auto 24px auto; background:#ffffff; border:2px solid #6366f1; box-shadow:0 12px 30px -5px rgba(99,102,241,0.15); border-radius:16px; padding:28px; text-align:center; }";
        $cssRules[] = ".funnel-upsell-box .upsell-badge { display:inline-block; background:#fee2e2; color:#dc2626; font-size:11px; font-weight:800; padding:4px 12px; border-radius:20px; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px; }";
        $cssRules[] = ".funnel-upsell-box .upsell-headline { margin:0 0 8px 0; font-size:22px; font-weight:900; color:#111827; line-height:1.3; }";
        $cssRules[] = ".funnel-upsell-box .upsell-subheadline { margin:0 0 20px 0; font-size:14px; color:#4b5563; }";
        $cssRules[] = ".funnel-upsell-box .upsell-callout { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:20px; }";
        $cssRules[] = ".funnel-upsell-box .upsell-callout h4 { margin:0 0 6px 0; font-size:16px; font-weight:700; color:#1e293b; }";
        $cssRules[] = ".funnel-upsell-box .upsell-callout .price-row { display:flex; align-items:center; justify-content:center; gap:10px; }";
        $cssRules[] = ".funnel-upsell-box .upsell-callout .reg-price { font-size:14px; color:#94a3b8; text-decoration:line-through; }";
        $cssRules[] = ".funnel-upsell-box .upsell-callout .upsell-special-price { font-size:24px; font-weight:900; color:#16a34a; }";
        $cssRules[] = ".funnel-upsell-box .btn-upsell-accept { width:100%; padding:16px; background:#16a34a; color:#ffffff; font-size:16px; font-weight:800; border-radius:10px; border:none; cursor:pointer; box-shadow:0 6px 18px rgba(22,163,74,0.35); transition:all 0.2s; }";
        $cssRules[] = ".funnel-upsell-box .btn-upsell-decline { background:none; border:none; color:#9ca3af; font-size:12px; text-decoration:underline; cursor:pointer; margin-top:14px; }";
        $cssRules[] = ".funnel-pricing-table { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px; margin-bottom:24px; }";
        $cssRules[] = ".funnel-pricing-table .pricing-card { padding:24px; border-radius:16px; border:1px solid #e5e7eb; background:#ffffff; text-align:center; display:flex; flex-direction:column; justify-content:space-between; }";
        $cssRules[] = ".funnel-pricing-table .pricing-card.featured { border-color:var(--color-primary, #6366f1); box-shadow:0 10px 25px -5px rgba(99,102,241,0.15); }";
        $cssRules[] = ".funnel-pricing-table .pricing-featured-badge { display:inline-block; padding:2px 10px; border-radius:12px; font-size:11px; font-weight:800; text-transform:uppercase; margin-bottom:8px; background:var(--color-primary, #6366f1); color:#ffffff; }";
        $cssRules[] = ".funnel-pricing-table .pricing-plan-title { margin:0 0 8px 0; font-size:18px; font-weight:800; }";
        $cssRules[] = ".funnel-pricing-table .pricing-amount-wrap { margin-bottom:16px; }";
        $cssRules[] = ".funnel-pricing-table .pricing-amount { font-size:32px; font-weight:900; }";
        $cssRules[] = ".funnel-pricing-table .pricing-period { font-size:13px; color:#6b7280; }";
        $cssRules[] = ".funnel-pricing-table .pricing-features-list { list-style:none; padding:0; margin:0 0 20px 0; text-align:left; font-size:13px; }";
        $cssRules[] = ".funnel-pricing-table .pricing-feature-item { margin-bottom:8px; display:flex; align-items:center; gap:8px; }";
        $cssRules[] = ".funnel-pricing-table .pricing-feature-check { color:#10b981; }";
        $cssRules[] = ".funnel-pricing-table .btn-pricing-cta { width:100%; padding:12px; border-radius:10px; border:none; cursor:pointer; font-weight:700; font-size:14px; background:var(--color-primary, #6366f1); color:#ffffff; }";
        $cssRules[] = ".funnel-faq-accordion { margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-faq-accordion .faq-item { border:1px solid #e5e7eb; border-radius:8px; margin-bottom:8px; overflow:hidden; background:#ffffff; }";
        $cssRules[] = ".funnel-faq-accordion .faq-toggle { width:100%; padding:14px 16px; text-align:left; background:none; border:none; font-weight:700; font-size:14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; color:var(--brand-body-color); }";
        $cssRules[] = ".funnel-faq-accordion .faq-answer { display:none; padding:0 16px 14px 16px; font-size:13px; color:#4b5563; line-height:1.6; border-top:1px solid #f3f4f6; }";
        $cssRules[] = ".funnel-testimonial-slider { position:relative; margin:0 0 24px 0; }";
        $cssRules[] = ".funnel-testimonial-slider .testimonial-card { padding:28px 24px; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); transition:all 0.3s ease; }";
        $cssRules[] = ".funnel-testimonial-slider .slider-prev, .funnel-testimonial-slider .slider-next { position:absolute; top:45%; transform:translateY(-50%); width:32px; height:32px; border-radius:50%; background:#ffffff; border:1px solid #e5e7eb; box-shadow:0 2px 8px rgba(0,0,0,0.1); cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:700; z-index:2; color:#374151; }";
        $cssRules[] = ".funnel-testimonial-slider .slider-prev { left:-14px; }";
        $cssRules[] = ".funnel-testimonial-slider .slider-next { right:-14px; }";
        $cssRules[] = ".funnel-testimonial-slider .slider-dots { display:flex; justify-content:center; gap:6px; margin-top:12px; }";
        $cssRules[] = ".funnel-testimonial-slider .slider-dot { height:8px; border-radius:9999px; border:none; padding:0; cursor:pointer; transition:all 0.3s; }";
        $cssRules[] = "img { max-width:100%; height:auto; }";

        // ── Mobile Base Breakpoints ──────────────────────────────────────────
        $mobileRules[] = ".funnel-row { grid-template-columns:1fr; }";

        // ── Collect per-element overrides ───────────────────────────────────
        foreach ($sections as $sec) {
            $this->collectElementCss($sec, $cssRules, $tabletRules, $mobileRules);
        }

        // ── Build HTML body ──────────────────────────────────────────────────
        $bodyHtml = '';
        foreach ($sections as $sec) {
            $bodyHtml .= $this->renderItemScoped($sec);
        }

        $tabBp  = $styleGuide['tabletBreakpoint'] ?? 1024;
        $mobBp  = $styleGuide['mobileBreakpoint'] ?? 768;
        $mobMin = $mobBp + 1;

        $allCss = implode("\n", $cssRules)
            . (!empty($tabletRules) ? "\n@media (max-width: {$tabBp}px) and (min-width: {$mobMin}px) {\n" . implode("\n", $tabletRules) . "\n}" : '')
            . (!empty($mobileRules) ? "\n@media (max-width: {$mobBp}px) {\n" . implode("\n", $mobileRules) . "\n}" : '');

        $metaDescTag = $metaDesc ? "<meta name=\"description\" content=\"{$metaDesc}\">" : '';
        $ogImageTag  = $ogImage ? "<meta property=\"og:image\" content=\"{$ogImage}\">" : '';

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$metaTitle}</title>
{$metaDescTag}
{$ogImageTag}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700&family=Montserrat:wght@400;600;700&family=Outfit:wght@400;600;800&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
{$allCss}
</style>
{$headerCode}
</head>
<body>
<main class="funnel-container">
{$bodyHtml}
</main>
{$footerCode}
<script>
(function(){
  document.querySelectorAll('.funnel-timer').forEach(function(el){
    var days = parseInt(el.getAttribute('data-days')||'0', 10);
    var hrs = parseInt(el.getAttribute('data-hours')||'2', 10);
    var mins = parseInt(el.getAttribute('data-minutes')||'15', 10);
    var secs = parseInt(el.getAttribute('data-seconds')||'0', 10);
    var action = el.getAttribute('data-action')||'show_message';
    var redirect = el.getAttribute('data-redirect')||'#';
    var message = el.getAttribute('data-message')||'OFFER EXPIRED!';
    var totalSecs = (days * 86400) + (hrs * 3600) + (mins * 60) + secs;
    var disp = el.querySelector('.timer-display') || el;
    function updateTimer(){
      if(totalSecs <= 0){
        if(action === 'hide') { el.style.display = 'none'; }
        else if(action === 'redirect' && redirect !== '#') { window.location.href = redirect; }
        else { disp.textContent = message; }
        return;
      }
      totalSecs--;
      var d = Math.floor(totalSecs / 86400);
      var h = Math.floor((totalSecs % 86400) / 3600);
      var m = Math.floor((totalSecs % 3600) / 60);
      var s = totalSecs % 60;
      var str = (d > 0 ? String(d).padStart(2,'0') + 'd : ' : '') + String(h).padStart(2,'0') + ' : ' + String(m).padStart(2,'0') + ' : ' + String(s).padStart(2,'0');
      disp.textContent = str;
    }
    setInterval(updateTimer, 1000);
  });
  document.querySelectorAll('.funnel-faq-accordion .faq-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var ans = this.nextElementSibling;
      var icon = this.querySelector('.faq-icon');
      var isOpen = ans.style.display === 'block';
      ans.style.display = isOpen ? 'none' : 'block';
      if(icon) icon.textContent = isOpen ? '▼' : '▲';
    });
  });
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

  // ── URL Query Parameter Pre-filling (Sticky Contacts) ───────────
  try {
    var urlParams = new URLSearchParams(window.location.search);
    var prefillName = urlParams.get('name') || urlParams.get('first_name') || '';
    var prefillEmail = urlParams.get('email') || '';
    var prefillPhone = urlParams.get('phone') || '';

    if (prefillName) {
      document.querySelectorAll('input[name="customer_name"], input[placeholder*="name" i]').forEach(function(inp){
        if (!inp.value) inp.value = prefillName;
      });
    }
    if (prefillEmail) {
      document.querySelectorAll('input[name="customer_email"], input[type="email"]').forEach(function(inp){
        if (!inp.value) inp.value = prefillEmail;
      });
    }
    if (prefillPhone) {
      document.querySelectorAll('input[name="customer_phone"], input[type="tel"]').forEach(function(inp){
        if (!inp.value) inp.value = prefillPhone;
      });
    }
  } catch(e){}

  // ── 2-Step Smart Checkout Engine (GHL style) ───────────────────
  document.querySelectorAll('.funnel-two-step-order').forEach(function(orderWidget){
    var step1Pane = orderWidget.querySelector('.pane-step-1');
    var step2Pane = orderWidget.querySelector('.pane-step-2');
    var tabBtns = orderWidget.querySelectorAll('.two-step-tab-btn');
    var btnGoToStep2 = orderWidget.querySelector('.btn-goto-step-2');
    var btnComplete = orderWidget.querySelector('.btn-complete-checkout');
    var totalDisplay = orderWidget.querySelector('.two-step-total-display');
    var bumpCheckbox = orderWidget.querySelector('.two-step-bump-checkbox');
    var productRadios = orderWidget.querySelectorAll('input[name="selected_product"]');
    var activeSubmissionId = null;

    function calcTotal(){
      var basePrice = 0;
      var checkedRadio = orderWidget.querySelector('input[name="selected_product"]:checked');
      if (checkedRadio) {
        basePrice = parseFloat(checkedRadio.getAttribute('data-price') || '0');
      }
      var bumpPrice = 0;
      if (bumpCheckbox && bumpCheckbox.checked) {
        bumpPrice = parseFloat(bumpCheckbox.getAttribute('data-bump-price') || '0');
      }
      var total = (basePrice + bumpPrice).toFixed(2);
      if (totalDisplay) totalDisplay.textContent = '$' + total;
      return total;
    }

    productRadios.forEach(function(radio){
      radio.addEventListener('change', function(){
        orderWidget.querySelectorAll('.two-step-product-option').forEach(function(opt){
          opt.style.borderColor = '#e5e7eb';
        });
        if (this.checked && this.closest('.two-step-product-option')) {
          this.closest('.two-step-product-option').style.borderColor = 'var(--color-primary, #6366f1)';
        }
        calcTotal();
      });
    });

    if (bumpCheckbox) {
      bumpCheckbox.addEventListener('change', calcTotal);
    }

    function goToStep(stepNum){
      if (stepNum === 2) {
        var nameInput = step1Pane.querySelector('.two-step-name-input');
        var emailInput = step1Pane.querySelector('.two-step-email-input');
        if (nameInput && !nameInput.value.trim()) {
          nameInput.focus();
          alert('Please enter your full name to proceed.');
          return;
        }
        if (emailInput && !emailInput.value.trim()) {
          emailInput.focus();
          alert('Please enter a valid email address to proceed.');
          return;
        }

        // Asynchronous Step 1 Lead Capture (Cart Abandonment recovery)
        var leadData = {
          name: nameInput ? nameInput.value.trim() : '',
          email: emailInput ? emailInput.value.trim() : '',
          phone: step1Pane.querySelector('.two-step-phone-input') ? step1Pane.querySelector('.two-step-phone-input').value.trim() : '',
          address: step1Pane.querySelector('.two-step-address-input') ? step1Pane.querySelector('.two-step-address-input').value.trim() : '',
        };

        var leadUrl = window.location.pathname.replace(/\/$/, '') + '/step-1-lead';
        fetch(leadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify(leadData)
        }).then(function(res){ return res.json(); }).then(function(data){
          if (data && data.submission_id) activeSubmissionId = data.submission_id;
        }).catch(function(){});

        step1Pane.style.display = 'none';
        step2Pane.style.display = 'block';
        tabBtns.forEach(function(t){
          if (t.getAttribute('data-step') === '2') {
            t.classList.add('active');
            t.style.fontWeight = '700';
            t.style.color = 'var(--color-primary, #6366f1)';
            t.style.borderBottom = '3px solid var(--color-primary, #6366f1)';
            t.style.background = '#ffffff';
          } else {
            t.classList.remove('active');
            t.style.fontWeight = '600';
            t.style.color = '#6b7280';
            t.style.borderBottom = 'none';
            t.style.background = 'transparent';
          }
        });
      } else {
        step2Pane.style.display = 'none';
        step1Pane.style.display = 'block';
        tabBtns.forEach(function(t){
          if (t.getAttribute('data-step') === '1') {
            t.classList.add('active');
            t.style.fontWeight = '700';
            t.style.color = 'var(--color-primary, #6366f1)';
            t.style.borderBottom = '3px solid var(--color-primary, #6366f1)';
            t.style.background = '#ffffff';
          } else {
            t.classList.remove('active');
            t.style.fontWeight = '600';
            t.style.color = '#6b7280';
            t.style.borderBottom = 'none';
            t.style.background = 'transparent';
          }
        });
      }
    }

    if (btnGoToStep2) {
      btnGoToStep2.addEventListener('click', function(){ goToStep(2); });
    }

    tabBtns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var stepNum = parseInt(this.getAttribute('data-step') || '1', 10);
        goToStep(stepNum);
      });
    });

    if (btnComplete) {
      btnComplete.addEventListener('click', function(){
        btnComplete.disabled = true;
        btnComplete.textContent = 'Processing Secure Order... 🔒';

        var checkedRadio = orderWidget.querySelector('input[name="selected_product"]:checked');
        var checkedGateway = orderWidget.querySelector('input[name="payment_gateway"]:checked');
        var totalAmount = calcTotal();

        var payload = {
          submission_id: activeSubmissionId,
          name: step1Pane.querySelector('.two-step-name-input') ? step1Pane.querySelector('.two-step-name-input').value.trim() : '',
          email: step1Pane.querySelector('.two-step-email-input') ? step1Pane.querySelector('.two-step-email-input').value.trim() : '',
          phone: step1Pane.querySelector('.two-step-phone-input') ? step1Pane.querySelector('.two-step-phone-input').value.trim() : '',
          address: step1Pane.querySelector('.two-step-address-input') ? step1Pane.querySelector('.two-step-address-input').value.trim() : '',
          product_id: checkedRadio ? checkedRadio.value : '',
          product_name: checkedRadio ? checkedRadio.getAttribute('data-name') : 'Main Product',
          product_price: checkedRadio ? parseFloat(checkedRadio.getAttribute('data-price') || '0') : 0,
          has_bump: bumpCheckbox ? bumpCheckbox.checked : false,
          bump_title: bumpCheckbox ? bumpCheckbox.getAttribute('data-bump-title') : '',
          bump_price: bumpCheckbox && bumpCheckbox.checked ? parseFloat(bumpCheckbox.getAttribute('data-bump-price') || '0') : 0,
          total_amount: parseFloat(totalAmount),
          payment_gateway: checkedGateway ? checkedGateway.value : 'stripe'
        };

        var checkoutUrl = window.location.pathname.replace(/\/$/, '') + '/checkout';
        fetch(checkoutUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify(payload)
        }).then(function(res){ return res.json(); }).then(function(resData){
          if (resData.redirect_url) {
            window.location.href = resData.redirect_url;
          } else {
            alert('Order completed successfully! Thank you.');
            window.location.reload();
          }
        }).catch(function(err){
          btnComplete.disabled = false;
          btnComplete.textContent = 'Complete Secure Order Now 🔒';
          alert('Order received successfully! Redirecting...');
          window.location.reload();
        });
      });
    }
  });

  // ── 1-Click Upsell / OTO Engine ────────────────────────────────
  document.querySelectorAll('.funnel-upsell-box').forEach(function(upsellBox){
    var acceptBtn = upsellBox.querySelector('.btn-upsell-accept');
    var declineBtn = upsellBox.querySelector('.btn-upsell-decline');

    function sendUpsellAction(decision, btn){
      if (btn) {
        btn.disabled = true;
        btn.textContent = decision === 'accept' ? 'Adding to order... ⚡' : 'Skipping...';
      }
      var upsellUrl = window.location.pathname.replace(/\/$/, '') + '/upsell-action';
      fetch(upsellUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          decision: decision,
          product_name: acceptBtn ? acceptBtn.getAttribute('data-product') : '',
          product_price: acceptBtn ? parseFloat(acceptBtn.getAttribute('data-price') || '0') : 0
        })
      }).then(function(res){ return res.json(); }).then(function(resData){
        if (resData.redirect_url) {
          window.location.href = resData.redirect_url;
        } else {
          window.location.reload();
        }
      }).catch(function(){
        window.location.reload();
      });
    }

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function(){ sendUpsellAction('accept', acceptBtn); });
    }
    if (declineBtn) {
      declineBtn.addEventListener('click', function(){ sendUpsellAction('decline', declineBtn); });
    }
  });
})();
</script>
</body>
</html>
HTML;
    }

    private function sanitizeElementForBrandInheritance(array $item): array
    {
        if (empty($item)) return $item;
        $clean = $item;

        if (empty($clean['isLocallyOverridden'])) {
            $textProps = [
                'fontSize', 'lineHeight', 'fontWeight', 'textColor', 'fontFamily',
                'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
                'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingY', 'paddingX',
                'textTransform', 'fontStyle', 'textDecoration', 'letterSpacing', 'wordSpacing'
            ];
            $btnProps = [
                'bgColor', 'textColor', 'fontSize', 'fontWeight', 'fontFamily', 'borderRadius',
                'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                'marginBottom', 'marginTop', 'marginRight', 'marginLeft',
                'btnFontSize', 'btnFontWeight', 'btnBgColor', 'btnTextColor', 'btnBorderRadius'
            ];
            $mediaProps = [
                'borderRadius', 'boxShadow', 'shadow',
                'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
                'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingY', 'paddingX'
            ];
            $dividerProps = [
                'dividerWidth', 'dividerStyle', 'dividerColor', 'dividerThickness',
                'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'borderColor'
            ];
            $inputProps = [
                'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                'borderRadius', 'fontSize', 'fontFamily', 'bgColor', 'textColor', 'borderColor',
                'marginBottom', 'marginTop', 'marginRight', 'marginLeft',
                'inputBgColor', 'inputBorderColor', 'inputBorderWidth', 'inputBorderStyle', 'inputBorderRadius',
                'inputFocusBorderColor', 'inputTextColor', 'inputFontSize', 'inputPaddingY', 'inputPaddingX',
                'labelColor', 'labelFontSize', 'labelFontWeight', 'labelFontFamily'
            ];
            $signatureProps = [
                'padBgColor', 'padBorderColor', 'padBorderWidth', 'padBorderStyle', 'padBorderRadius',
                'penColor', 'labelColor', 'labelFontSize', 'labelFontWeight', 'labelFontFamily',
                'marginBottom', 'marginTop', 'marginRight', 'marginLeft',
                'paddingY', 'paddingX', 'borderRadius'
            ];
            $checkboxProps = [
                'textColor', 'fontSize', 'checkboxColor',
                'marginBottom', 'marginTop', 'marginRight', 'marginLeft'
            ];
            $containerProps = [
                'gap', 'gapX', 'gapY', 'containerWidth',
                'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
                'flexDirection', 'flexWrap', 'justifyContent', 'alignItems'
            ];
            $interactiveProps = [
                'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                'marginBottom', 'marginTop', 'marginRight', 'marginLeft'
            ];

            $propsToCleanMap = [
                'headline' => $textProps,
                'subheadline' => $textProps,
                'paragraph' => $textProps,
                'bullets' => $textProps,
                'quote' => $textProps,
                'rich_text' => $textProps,
                'icon_box' => $textProps,
                'star_rating' => $textProps,
                'custom_code' => $textProps,
                'image' => $mediaProps,
                'video' => $mediaProps,
                'divider' => $dividerProps,
                'submit_button' => $btnProps,
                'button' => $btnProps,
                'input_email' => $inputProps,
                'input_name' => $inputProps,
                'input_phone' => $inputProps,
                'datepicker' => $inputProps,
                'signature' => $signatureProps,
                'checkbox' => $checkboxProps,
                'section' => $containerProps,
                'flex_container' => $containerProps,
                'grid_container' => $containerProps,
                'col_1' => $containerProps,
                'col_2' => $containerProps,
                'col_3' => $containerProps,
                'col_4' => $containerProps,
                'col_sidebar' => $containerProps,
                'timer' => $interactiveProps,
                'progress_bar' => $interactiveProps,
                'faq_accordion' => $interactiveProps,
                'testimonial_slider' => $interactiveProps,
                'order_bump' => $interactiveProps,
                'two_step_order' => $interactiveProps,
                'upsell_box' => $interactiveProps,
                'pricing_table' => $interactiveProps,
                'audio' => $interactiveProps,
                'social' => $interactiveProps,
            ];

            $type = $clean['type'] ?? '';
            if (isset($propsToCleanMap[$type])) {
                foreach ($propsToCleanMap[$type] as $p) {
                    unset($clean[$p]);
                }
            }
        }

        // Clean legacy hardcoded preset defaults so brand variables manage them
        $type = $clean['type'] ?? '';
        if ($type === 'image' && (in_array($clean['borderRadius'] ?? null, [12, 8], true))) {
            unset($clean['borderRadius']);
        }
        if ($type === 'video' && (in_array($clean['borderRadius'] ?? null, [12, 8], true))) {
            unset($clean['borderRadius']);
        }
        if (in_array($type, ['input_email', 'input_name', 'input_phone', 'datepicker'], true)) {
            if (($clean['inputBorderRadius'] ?? null) === 8) unset($clean['inputBorderRadius']);
            if (($clean['inputBgColor'] ?? null) === '#ffffff') unset($clean['inputBgColor']);
            if (($clean['inputBorderColor'] ?? null) === '#d1d5db') unset($clean['inputBorderColor']);
        }
        if ($type === 'signature' && ($clean['padBorderRadius'] ?? null) === 8) {
            unset($clean['padBorderRadius']);
        }
        if ($type === 'divider') {
            if (($clean['dividerThickness'] ?? null) === 1) unset($clean['dividerThickness']);
            if (($clean['dividerStyle'] ?? null) === 'solid') unset($clean['dividerStyle']);
        }
        if ($type === 'section') {
            if (in_array($clean['containerWidth'] ?? null, ['1200', 1200], true)) unset($clean['containerWidth']);
            if (($clean['paddingY'] ?? null) === 48 && ($clean['paddingX'] ?? null) === 24) {
                unset($clean['paddingY'], $clean['paddingX']);
            }
        }
        if ($type === 'grid_container' && ($clean['gap'] ?? null) === 20) {
            unset($clean['gap']);
        }

        return $clean;
    }

    private function collectElementCss(array $rawItem, array &$cssRules, array &$tabletRules, array &$mobileRules): void
    {
        if (empty($rawItem) || empty($rawItem['id'])) return;
        $item  = $this->sanitizeElementForBrandInheritance($rawItem);
        $rawId = $item['id'];
        $id    = 'el-' . preg_replace('/[^a-zA-Z0-9\-_]/', '-', $rawId);

        $buildDeviceRules = function(array $dObj, ?string $targetType = null) use ($item): array {
            $r = [];
            $type = $targetType ?? ($item['type'] ?? '');
            $isRowType = in_array($type, ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar']);
            if ($isRowType) {
                $mw = $this->resolveContentMaxWidth($dObj);
                if ($mw) {
                    $r[] = "--row-max-width:{$mw}";
                }
            } elseif (!empty($dObj['containerWidth']) && $type !== 'section' && $type !== 'col' && $type !== 'column') {
                $cwUnit = $dObj['containerWidthUnit'] ?? 'px';
                $cw     = (string)$dObj['containerWidth'];
                $mw     = ($cw === '100%' || str_ends_with($cw, '%')) ? '100%' : "{$cw}{$cwUnit}";
                $r[]    = "max-width:{$mw}";
                $r[]    = "margin-left:auto";
                $r[]    = "margin-right:auto";
            }
            $u = function(string $key, string $def = 'px') use ($dObj): string {
                return $dObj["{$key}Unit"] ?? $def;
            };
            $pU = $u('padding', 'px');
            $mU = $u('margin', 'px');

            $hasPad = isset($dObj['paddingTop']) || isset($dObj['paddingRight']) || isset($dObj['paddingBottom']) || isset($dObj['paddingLeft']) || isset($dObj['paddingY']) || isset($dObj['paddingX']);
            if ($hasPad) {
                $pTop = isset($dObj['paddingTop']) ? "{$dObj['paddingTop']}" . $u('paddingTop', $pU) : (isset($dObj['paddingY']) ? "{$dObj['paddingY']}{$pU}" : '0px');
                $pRight = isset($dObj['paddingRight']) ? "{$dObj['paddingRight']}" . $u('paddingRight', $pU) : (isset($dObj['paddingX']) ? "{$dObj['paddingX']}{$pU}" : '0px');
                $pBottom = isset($dObj['paddingBottom']) ? "{$dObj['paddingBottom']}" . $u('paddingBottom', $pU) : (isset($dObj['paddingY']) ? "{$dObj['paddingY']}{$pU}" : '0px');
                $pLeft = isset($dObj['paddingLeft']) ? "{$dObj['paddingLeft']}" . $u('paddingLeft', $pU) : (isset($dObj['paddingX']) ? "{$dObj['paddingX']}{$pU}" : '0px');
                $r[] = "padding:{$pTop} {$pRight} {$pBottom} {$pLeft}";
            }

            $hasMar = isset($dObj['marginTop']) || isset($dObj['marginRight']) || isset($dObj['marginBottom']) || isset($dObj['marginLeft']);
            if ($hasMar) {
                $mTop = isset($dObj['marginTop']) ? "{$dObj['marginTop']}" . $u('marginTop', $mU) : '0px';
                $mRight = isset($dObj['marginRight']) ? "{$dObj['marginRight']}" . $u('marginRight', $mU) : '0px';
                $mBottom = isset($dObj['marginBottom']) ? "{$dObj['marginBottom']}" . $u('marginBottom', $mU) : '0px';
                $mLeft = isset($dObj['marginLeft']) ? "{$dObj['marginLeft']}" . $u('marginLeft', $mU) : '0px';
                $r[] = "margin:{$mTop} {$mRight} {$mBottom} {$mLeft}";
            }
            if (!empty($dObj['fontSize']))     { $r[] = "font-size:{$dObj['fontSize']}" . $u('fontSize', 'px'); }
            if (!empty($dObj['lineHeight']))   { $r[] = "line-height:{$dObj['lineHeight']}" . $u('lineHeight', 'px'); }
            if (!empty($dObj['fontFamily']))   { $r[] = "font-family:{$dObj['fontFamily']}"; }
            if (!empty($dObj['fontWeight']))   { $r[] = "font-weight:{$dObj['fontWeight']}"; }
            if (isset($dObj['letterSpacing'])){ $r[] = "letter-spacing:{$dObj['letterSpacing']}" . $u('letterSpacing', 'px'); }
            if (isset($dObj['wordSpacing']))  { $r[] = "word-spacing:{$dObj['wordSpacing']}" . $u('wordSpacing', 'px'); }
            if (!empty($dObj['textTransform'])){ $r[] = "text-transform:{$dObj['textTransform']}"; }
            if (!empty($dObj['fontStyle']))    { $r[] = "font-style:{$dObj['fontStyle']}"; }
            if (!empty($dObj['textDecoration'])){ $r[] = "text-decoration:{$dObj['textDecoration']}"; }
            if (!empty($dObj['textColor']))    { $r[] = "color:{$dObj['textColor']}"; }
            // ── BACKGROUND (Solid / Gradient / Image) ──────────────────────────
            $bgType = $dObj['bgType'] ?? 'solid';
            if ($bgType === 'gradient') {
                $gType = $dObj['gradientType'] ?? 'linear';
                $angle = $dObj['gradientAngle'] ?? 135;
                // Use multi-stop gradientStops array; fall back to old 2-color fields
                $rawStops = !empty($dObj['gradientStops']) ? $dObj['gradientStops'] : [
                    ['color' => $dObj['gradientColor1'] ?? '#6366f1', 'pos' => 0],
                    ['color' => $dObj['gradientColor2'] ?? '#ec4899', 'pos' => 100],
                ];
                usort($rawStops, fn($a, $b) => ($a['pos'] ?? 0) <=> ($b['pos'] ?? 0));
                $stopsStr = implode(', ', array_map(fn($s) => "{$s['color']} {$s['pos']}%", $rawStops));
                $grad = $gType === 'radial'
                    ? "radial-gradient(circle, {$stopsStr})"
                    : "linear-gradient({$angle}deg, {$stopsStr})";
                $r[] = "background-image:{$grad}";
            } elseif ($bgType === 'image') {
                if (!empty($dObj['bgImage'])) {
                    $overlay = $dObj['bgOverlay'] ?? '';
                    $imgVal  = $overlay
                        ? "linear-gradient({$overlay}, {$overlay}), url({$dObj['bgImage']})"
                        : "url({$dObj['bgImage']})";
                    $r[] = "background-image:{$imgVal}";
                    $r[] = "background-size:" . ($dObj['bgSize'] ?? 'cover');
                    $r[] = "background-position:" . ($dObj['bgPosition'] ?? 'center center');
                    $r[] = "background-repeat:" . ($dObj['bgRepeat'] ?? 'no-repeat');
                }
            } else {
                // solid
                if (!empty($dObj['bgColor'])) { $r[] = "background-color:{$dObj['bgColor']}"; }
            }
            if (!empty($dObj['alignment']))    { $r[] = "text-align:{$dObj['alignment']}"; }

            if (isset($dObj['borderRadiusTL']) || isset($dObj['borderRadiusTR']) || isset($dObj['borderRadiusBL']) || isset($dObj['borderRadiusBR'])) {
                $tl = $dObj['borderRadiusTL'] ?? ($dObj['borderRadius'] ?? 0);
                $tr = $dObj['borderRadiusTR'] ?? ($dObj['borderRadius'] ?? 0);
                $bl = $dObj['borderRadiusBL'] ?? ($dObj['borderRadius'] ?? 0);
                $br = $dObj['borderRadiusBR'] ?? ($dObj['borderRadius'] ?? 0);
                $r[] = "border-radius:{$tl}px {$tr}px {$br}px {$bl}px";
            } elseif (isset($dObj['borderRadius'])) {
                $r[] = "border-radius:{$dObj['borderRadius']}px";
            }

            if (!empty($dObj['borderStyle']) && $dObj['borderStyle'] !== 'none') {
                $bw = $dObj['borderWidth'] ?? 1;
                $bc = $dObj['borderColor'] ?? '#d1d5db';
                $r[] = "border:{$bw}px {$dObj['borderStyle']} {$bc}";
            } elseif (($dObj['borderStyle'] ?? '') === 'none') {
                $r[] = "border:none";
            }

            if (!empty($dObj['shadowColor']) || isset($dObj['shadowH']) || isset($dObj['shadowV']) || isset($dObj['shadowBlur'])) {
                $pos = ($dObj['shadowPosition'] ?? '') === 'inset' ? 'inset ' : '';
                $shColor = $dObj['shadowColor'] ?? 'rgba(0,0,0,0.1)';
                $shH = $dObj['shadowH'] ?? 0;
                $shV = $dObj['shadowV'] ?? 4;
                $shB = $dObj['shadowBlur'] ?? 8;
                $shS = $dObj['shadowSpread'] ?? 0;
                $r[] = "box-shadow:{$pos}{$shH}px {$shV}px {$shB}px {$shS}px {$shColor}";
            } elseif (isset($dObj['shadow'])) {
                if ($dObj['shadow'] === 'none') $r[] = 'box-shadow:none';
                elseif ($dObj['shadow'] === 'sm')   $r[] = 'box-shadow:0 1px 3px rgba(0,0,0,0.1)';
                elseif ($dObj['shadow'] === 'md')   $r[] = 'box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)';
                elseif ($dObj['shadow'] === 'lg')   $r[] = 'box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)';
                elseif ($dObj['shadow'] === 'glow') $r[] = 'box-shadow:0 0 15px rgba(200,122,87,0.5)';
            }
            // Layout Engine: Width & Flexbox vs Grid vs Block
            $wMode = $dObj['widthMode'] ?? ($type === 'submit_button' ? ($dObj['btnWidthMode'] ?? null) : null);
            $cWidth = $dObj['customWidth'] ?? ($type === 'submit_button' ? ($dObj['btnCustomWidth'] ?? null) : null);
            if ($wMode === 'auto') {
                $r[] = 'width:fit-content';
                $r[] = 'max-width:100%';
            } elseif ($wMode === 'custom' && $cWidth) {
                $r[] = "width:{$cWidth}%";
                $r[] = 'max-width:100%';
            } elseif ($wMode === 'full') {
                $r[] = 'width:100%';
            } elseif (isset($dObj['width'])) {
                $wUnit = $dObj['widthUnit'] ?? '%';
                $r[] = "width:{$dObj['width']}{$wUnit}";
            }
            if (isset($dObj['minHeight']) && $dObj['minHeight'] !== '') {
                $mhUnit = $dObj['minHeightUnit'] ?? 'px';
                $r[] = "min-height:{$dObj['minHeight']}{$mhUnit}";
            }

            $layoutMode = $dObj['layoutMode'] ?? '';
            if ($layoutMode === 'grid' || $type === 'grid_container' || $isRowType) {
                if (! $isRowType) {
                    $r[] = 'display:grid';
                }
                if (isset($dObj['gridColumns'])) {
                    $rawUnit = $dObj['gridColumnsUnit'] ?? '1fr';
                    $unit = $rawUnit === 'fr' ? '1fr' : $rawUnit;
                    $gc = is_numeric($dObj['gridColumns']) ? "repeat({$dObj['gridColumns']}, {$unit})" : $dObj['gridColumns'];
                    if ($isRowType) {
                        $r[] = "--grid-cols:{$gc}";
                    } else {
                        $r[] = "grid-template-columns:{$gc}";
                    }
                } elseif (! empty($dObj['columnWidths']) && is_array($dObj['columnWidths'])) {
                    $cols = implode(' ', array_map(fn($w) => "minmax(0, {$w}fr)", $dObj['columnWidths']));
                    $r[] = "--grid-cols:{$cols}";
                } elseif (($dObj['gridPreset'] ?? '') === 'custom' && ! empty($dObj['gridTemplateColumns'])) {
                    $r[] = "--grid-cols:{$dObj['gridTemplateColumns']}";
                } elseif ($type === 'grid_container' && ! empty($dObj['colsCount'])) {
                    $r[] = "--grid-cols-count:{$dObj['colsCount']}";
                }
                if (isset($dObj['gridRows'])) {
                    $rawRowUnit = $dObj['gridRowsUnit'] ?? '1fr';
                    $rowUnit = $rawRowUnit === 'fr' ? '1fr' : $rawRowUnit;
                    $gr = is_numeric($dObj['gridRows']) ? "repeat({$dObj['gridRows']}, {$rowUnit})" : $dObj['gridRows'];
                    $r[] = "grid-template-rows:{$gr}";
                }
                if (!empty($dObj['justifyItems'])) {
                    if ($isRowType) {
                        $r[] = "--row-justify:{$dObj['justifyItems']}";
                    } else {
                        $r[] = "justify-items:{$dObj['justifyItems']}";
                    }
                }
                if (!empty($dObj['alignItems'])) {
                    if ($isRowType) {
                        $r[] = "--row-align:{$dObj['alignItems']}";
                    } else {
                        $r[] = "align-items:{$dObj['alignItems']}";
                    }
                }
                if (!empty($dObj['gridAutoFlow'])) { $r[] = "grid-auto-flow:{$dObj['gridAutoFlow']}"; }
            } elseif (($dObj['layoutMode'] ?? '') === 'block') {
                $r[] = 'display:block';
            } elseif (($dObj['layoutMode'] ?? '') === 'flex' || !empty($dObj['flexDirection']) || $type === 'flex_container') {
                $r[] = 'display:flex';
                if (!empty($dObj['flexDirection']))  { $r[] = "flex-direction:{$dObj['flexDirection']}"; }
                if (!empty($dObj['justifyContent'])) { $r[] = "justify-content:{$dObj['justifyContent']}"; }
                if (!empty($dObj['flexWrap']))       { $r[] = "flex-wrap:{$dObj['flexWrap']}"; }
                if (!empty($dObj['alignItems']))     { $r[] = "align-items:{$dObj['alignItems']}"; }
            }

            if (! $isRowType && !empty($dObj['alignItems']) && ($dObj['layoutMode'] ?? '') !== 'flex' && $type !== 'flex_container') {
                $r[] = "align-items:{$dObj['alignItems']}";
            }
            $gapUnit = $dObj['gapUnit'] ?? 'px';
            if (isset($dObj['gapX']) || isset($dObj['gapY'])) {
                $gY = $dObj['gapY'] ?? ($dObj['gap'] ?? 0);
                $gX = $dObj['gapX'] ?? ($dObj['gap'] ?? 0);
                if ($isRowType) {
                    $r[] = "--row-gap-y:{$gY}{$gapUnit}";
                    $r[] = "--row-gap-x:{$gX}{$gapUnit}";
                } else {
                    $r[] = "gap:{$gY}{$gapUnit} {$gX}{$gapUnit}";
                }
            } elseif (isset($dObj['gap'])) {
                if ($isRowType) {
                    $r[] = "--row-gap:{$dObj['gap']}{$gapUnit}";
                } elseif (($dObj['layoutMode'] ?? '') === 'grid' || ($dObj['layoutMode'] ?? '') === 'flex' || $type === 'flex_container') {
                    $r[] = "gap:{$dObj['gap']}{$gapUnit}";
                }
            }
            if (!empty($dObj['pushToBottom'])) {
                $r[] = 'margin-top:auto';
            }
            $effAlignSelf = (!empty($dObj['alignSelf']) && $dObj['alignSelf'] !== 'auto')
                ? $dObj['alignSelf']
                : ($type === 'submit_button' && !empty($dObj['btnAlign']) ? ($dObj['btnAlign'] === 'left' ? 'flex-start' : ($dObj['btnAlign'] === 'right' ? 'flex-end' : 'center')) : null);
            if ($effAlignSelf) {
                $r[] = "align-self:{$effAlignSelf}";
                if ($effAlignSelf === 'center') {
                    $r[] = 'margin-left:auto';
                    $r[] = 'margin-right:auto';
                } elseif ($effAlignSelf === 'flex-start') {
                    $r[] = 'margin-right:auto';
                } elseif ($effAlignSelf === 'flex-end') {
                    $r[] = 'margin-left:auto';
                }
            }
            if (isset($dObj['flexGrow']))        { $r[] = "flex-grow:{$dObj['flexGrow']}"; }
            if (isset($dObj['flexShrink']))      { $r[] = "flex-shrink:{$dObj['flexShrink']}"; }
            if (isset($dObj['flexBasis']) && $dObj['flexBasis'] !== '') { $r[] = "flex-basis:{$dObj['flexBasis']}"; }
            if (isset($dObj['order']))           { $r[] = "order:{$dObj['order']}"; }
            return $r;
        };

        $deduplicateRules = function(array $ruleList): array {
            $map = [];
            foreach ($ruleList as $ruleStr) {
                if (empty($ruleStr)) continue;
                $parts = explode(';', $ruleStr);
                foreach ($parts as $p) {
                    $trimmed = trim($p);
                    if (empty($trimmed)) continue;
                    $colonIdx = strpos($trimmed, ':');
                    if ($colonIdx !== false) {
                        $propName = strtolower(trim(substr($trimmed, 0, $colonIdx)));
                        $propVal  = trim(substr($trimmed, $colonIdx + 1));
                        $map[$propName] = $propVal;
                    }
                }
            }
            if (isset($map['margin'])) {
                unset($map['margin-top'], $map['margin-right'], $map['margin-bottom'], $map['margin-left']);
            }
            if (isset($map['padding'])) {
                unset($map['padding-top'], $map['padding-right'], $map['padding-bottom'], $map['padding-left']);
            }
            $out = [];
            foreach ($map as $k => $v) {
                $out[] = "{$k}:{$v}";
            }
            return $out;
        };

        $rules = $buildDeviceRules($item);

        $transMs = $item['transitionDuration'] ?? 300;
        $rules[] = "transition:all {$transMs}ms ease";

        $dedupedBase = $deduplicateRules($rules);
        if (!empty($dedupedBase)) {
            $cssRules[] = "#{$id} { " . implode('; ', $dedupedBase) . "; }";
        }

        // Sub-component rules
        if (($item['type'] ?? '') === 'faq_accordion') {
            if (!empty($item['itemBorderColor'])) $cssRules[] = "#{$id} .faq-item { border-color: " . e($item['itemBorderColor']) . "; }";
            if (!empty($item['qColor']))          $cssRules[] = "#{$id} .faq-toggle { color: " . e($item['qColor']) . "; }";
            if (!empty($item['qBgColor']))        $cssRules[] = "#{$id} .faq-toggle { background: " . e($item['qBgColor']) . "; }";
            if (!empty($item['qFontSize']))       $cssRules[] = "#{$id} .faq-toggle { font-size: " . (int)$item['qFontSize'] . "px; }";
            if (!empty($item['qFontWeight']))     $cssRules[] = "#{$id} .faq-toggle { font-weight: " . e($item['qFontWeight']) . "; }";
            if (!empty($item['aColor']))          $cssRules[] = "#{$id} .faq-answer { color: " . e($item['aColor']) . "; }";
            if (!empty($item['aBgColor']))        $cssRules[] = "#{$id} .faq-answer { background: " . e($item['aBgColor']) . "; }";
            if (!empty($item['aFontSize']))       $cssRules[] = "#{$id} .faq-answer { font-size: " . (int)$item['aFontSize'] . "px; }";
            if (!empty($item['aLineHeight']))     $cssRules[] = "#{$id} .faq-answer { line-height: " . (float)$item['aLineHeight'] . "; }";
            if (!empty($item['iconColor']))       $cssRules[] = "#{$id} .faq-icon { color: " . e($item['iconColor']) . "; }";
        }

        if (($item['type'] ?? '') === 'testimonial_slider') {
            if (!empty($item['cardBgColor']))     $cssRules[] = "#{$id} .testimonial-card { background: " . e($item['cardBgColor']) . "; }";
            if (!empty($item['cardBorderColor'])) $cssRules[] = "#{$id} .testimonial-card { border-color: " . e($item['cardBorderColor']) . "; }";
            if (!empty($item['quoteColor']))       $cssRules[] = "#{$id} blockquote { color: " . e($item['quoteColor']) . "; }";
            if (!empty($item['quoteFontSize']))    $cssRules[] = "#{$id} blockquote { font-size: " . (int)$item['quoteFontSize'] . "px; }";
            if (!empty($item['authorColor']))      $cssRules[] = "#{$id} p { color: " . e($item['authorColor']) . "; }";
            if (!empty($item['authorFontSize']))   $cssRules[] = "#{$id} p { font-size: " . (int)$item['authorFontSize'] . "px; }";
            if (!empty($item['arrowBgColor']))     $cssRules[] = "#{$id} .slider-prev, #{$id} .slider-next { background: " . e($item['arrowBgColor']) . "; }";
        }

        if (($item['type'] ?? '') === 'order_bump') {
            if (!empty($item['boxBgColor']))      $cssRules[] = "#{$id}.funnel-order-bump { background: " . e($item['boxBgColor']) . "; }";
            if (!empty($item['boxBorderColor']))  $cssRules[] = "#{$id}.funnel-order-bump { border-color: " . e($item['boxBorderColor']) . "; }";
            if (!empty($item['badgeBgColor']))    $cssRules[] = "#{$id} .bump-badge { background: " . e($item['badgeBgColor']) . "; }";
            if (!empty($item['badgeTextColor']))  $cssRules[] = "#{$id} .bump-badge { color: " . e($item['badgeTextColor']) . "; }";
            if (!empty($item['titleColor']))      $cssRules[] = "#{$id} h4 { color: " . e($item['titleColor']) . "; }";
            if (!empty($item['priceColor']))      $cssRules[] = "#{$id} .bump-price { color: " . e($item['priceColor']) . "; }";
        }

        if (($item['type'] ?? '') === 'icon_box') {
            if (!empty($item['boxBgColor']))      $cssRules[] = "#{$id}.funnel-icon-box { background: " . e($item['boxBgColor']) . "; }";
            if (!empty($item['boxBorderColor']))  $cssRules[] = "#{$id}.funnel-icon-box { border-color: " . e($item['boxBorderColor']) . "; }";
            if (!empty($item['titleColor']))      $cssRules[] = "#{$id} h3 { color: " . e($item['titleColor']) . "; }";
            if (!empty($item['descColor']))       $cssRules[] = "#{$id} p { color: " . e($item['descColor']) . "; }";
        }

        if (($item['type'] ?? '') === 'bullets') {
            if (isset($item['itemSpacing']) && (string)$item['itemSpacing'] !== '12') {
                $desktopRules[] = "gap:{$item['itemSpacing']}px";
            }
            $bulletItemRules = [];
            if (!empty($item['bulletIconAlign']) && $item['bulletIconAlign'] !== 'center') {
                $align = $item['bulletIconAlign'] === 'top' ? 'flex-start' : ($item['bulletIconAlign'] === 'baseline' ? 'baseline' : 'center');
                $bulletItemRules[] = "align-items:{$align}";
            }
            if (isset($item['bulletIconGap']) && (string)$item['bulletIconGap'] !== '10') {
                $bulletItemRules[] = "gap:{$item['bulletIconGap']}px";
            }
            if (!empty($bulletItemRules)) {
                $cssRules[] = "#{$id} .funnel-bullet-item { " . implode('; ', $bulletItemRules) . "; }";
            }
            if (!empty($item['bulletIconColor'])) {
                $cssRules[] = "#{$id} .bullet-icon { color:" . e($item['bulletIconColor']) . "; }";
            }
            if (!empty($item['bulletIconSize'])) {
                $cssRules[] = "#{$id} .bullet-icon { font-size:" . (int)$item['bulletIconSize'] . "px; }";
            }
            if (!empty($item['bulletIconHoverColor'])) {
                $cssRules[] = "#{$id}:hover .bullet-icon { color:" . e($item['bulletIconHoverColor']) . "; }";
            }
            if (!empty($item['hoverTextColor'])) {
                $cssRules[] = "#{$id}:hover .bullet-text { color:" . e($item['hoverTextColor']) . "; }";
            }
        }

        if (($item['type'] ?? '') === 'submit_button') {
            if (!empty($item['subtextColor'])) {
                $cssRules[] = "#{$id} .btn-subtext { color:" . e($item['subtextColor']) . "; }";
            }
            if (!empty($item['subtextFontSize'])) {
                $cssRules[] = "#{$id} .btn-subtext { font-size:" . (int)$item['subtextFontSize'] . "px; }";
            }
            if (!empty($item['subtextGap'])) {
                $cssRules[] = "#{$id} .btn-subtext { margin-top:" . (int)$item['subtextGap'] . "px; }";
            }
            if (isset($item['subtextOpacity'])) {
                $cssRules[] = "#{$id} .btn-subtext { opacity:" . (float)$item['subtextOpacity'] . "; }";
            }
            if (!empty($item['subtextHoverColor']) || !empty($item['hoverSubtextColor'])) {
                $shCol = $item['subtextHoverColor'] ?? $item['hoverSubtextColor'];
                $cssRules[] = "#{$id}:hover .btn-subtext { color:" . e($shCol) . "; }";
            }
            if (isset($item['subtextHoverOpacity'])) {
                $cssRules[] = "#{$id}:hover .btn-subtext { opacity:" . (float)$item['subtextHoverOpacity'] . "; }";
            }
            if (!empty($item['btnIconColor'])) {
                $cssRules[] = "#{$id} .btn-icon { color:" . e($item['btnIconColor']) . "; }";
            }
            if (!empty($item['btnIconSize'])) {
                $cssRules[] = "#{$id} .btn-icon { font-size:" . (int)$item['btnIconSize'] . "px; }";
            }
            if (!empty($item['btnIconGap'])) {
                $cssRules[] = "#{$id} .btn-icon-wrap { gap:" . (int)$item['btnIconGap'] . "px; }";
            }
            if (!empty($item['btnIconHoverColor'])) {
                $cssRules[] = "#{$id}:hover .btn-icon { color:" . e($item['btnIconHoverColor']) . "; }";
            }

            $wMode = $item['widthMode'] ?? ($item['btnWidthMode'] ?? null);
            $cWidth = $item['customWidth'] ?? ($item['btnCustomWidth'] ?? null);
            if ($wMode === 'auto') {
                $desktopRules[] = 'width: auto';
                $desktopRules[] = 'display: inline-flex';
            } elseif ($wMode === 'custom' && $cWidth) {
                $desktopRules[] = "width: {$cWidth}%";
            } elseif ($wMode === 'full') {
                $desktopRules[] = 'width: 100%';
                $desktopRules[] = 'display: flex';
            }

            $bAlign = (!empty($item['alignSelf']) && $item['alignSelf'] !== 'auto')
                ? ($item['alignSelf'] === 'flex-start' ? 'left' : ($item['alignSelf'] === 'flex-end' ? 'right' : 'center'))
                : ($item['btnAlign'] ?? null);
            if ($bAlign === 'center') {
                $desktopRules[] = 'margin-left: auto';
                $desktopRules[] = 'margin-right: auto';
            } elseif ($bAlign === 'right') {
                $desktopRules[] = 'margin-left: auto';
                $desktopRules[] = 'margin-right: 0';
            } elseif ($bAlign === 'left') {
                $desktopRules[] = 'margin-left: 0';
                $desktopRules[] = 'margin-right: auto';
            }
        }

        // Hover Rules
        $buildHoverRules = function(array $h): array {
            $r = [];
            if (!empty($h['hoverBgColor']))    $r[] = "background-color:{$h['hoverBgColor']}";
            if (!empty($h['hoverTextColor']))   $r[] = "color:{$h['hoverTextColor']}";
            if (!empty($h['hoverBorderStyle']) && $h['hoverBorderStyle'] !== 'none') {
                $bw = $h['hoverBorderWidth'] ?? 1;
                $bc = $h['hoverBorderColor'] ?? '#d1d5db';
                $r[] = "border:{$bw}px {$h['hoverBorderStyle']} {$bc}";
            } elseif (!empty($h['hoverBorderColor'])) {
                $r[] = "border-color:{$h['hoverBorderColor']}";
            }
            if (isset($h['hoverBorderRadius'])) $r[] = "border-radius:{$h['hoverBorderRadius']}px";
            if (!empty($h['hoverShadowColor']) || isset($h['hoverShadowH']) || isset($h['hoverShadowV']) || isset($h['hoverShadowBlur'])) {
                $pos = ($h['hoverShadowPosition'] ?? '') === 'inset' ? 'inset ' : '';
                $shColor = $h['hoverShadowColor'] ?? 'rgba(0,0,0,0.15)';
                $shH = $h['hoverShadowH'] ?? 0;
                $shV = $h['hoverShadowV'] ?? 8;
                $shB = $h['hoverShadowBlur'] ?? 24;
                $shS = $h['hoverShadowSpread'] ?? 0;
                $r[] = "box-shadow:{$pos}{$shH}px {$shV}px {$shB}px {$shS}px {$shColor}";
            } elseif (!empty($h['hoverShadow'])) {
                if ($h['hoverShadow'] === 'none') $r[] = 'box-shadow:none';
                elseif ($h['hoverShadow'] === 'sm')   $r[] = 'box-shadow:0 1px 3px rgba(0,0,0,0.1)';
                elseif ($h['hoverShadow'] === 'md')   $r[] = 'box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)';
                elseif ($h['hoverShadow'] === 'lg')   $r[] = 'box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)';
                elseif ($h['hoverShadow'] === 'glow') $r[] = 'box-shadow:0 0 15px rgba(200,122,87,0.5)';
            }
            $t = [];
            if (!empty($h['hoverTransformX']) && $h['hoverTransformX'] != 0) $t[] = "translateX({$h['hoverTransformX']}px)";
            if (!empty($h['hoverTransformY']) && $h['hoverTransformY'] != 0) $t[] = "translateY({$h['hoverTransformY']}px)";
            if (!empty($h['hoverScale']) && $h['hoverScale'] != 1)            $t[] = "scale({$h['hoverScale']})";
            if (!empty($t)) $r[] = 'transform:' . implode(' ', $t);
            return $r;
        };

        $hoverList = $buildHoverRules($item);
        $dedupedHover = $deduplicateRules($hoverList);
        if (!empty($dedupedHover)) {
            $cssRules[] = "#{$id}:hover { " . implode('; ', $dedupedHover) . "; }";
        }

        // Tablet overrides
        if (!empty($item['tablet'])) {
            $tabList = $buildDeviceRules($item['tablet']);
            if (!empty($tabList)) {
                $tabletRules[] = "#{$id} { " . implode('; ', $tabList) . "; }";
            }
        }

        // Mobile overrides
        $mobileList = [];
        if (isset($item['visibleMobile']) && $item['visibleMobile'] === false) {
            $mobileList[] = 'display:none';
        }
        if (!empty($item['mobile'])) {
            $mobileList = array_merge($mobileList, $buildDeviceRules($item['mobile']));
        } else {
            $fontSize = $item['fontSize'] ?? 0;
            if ($fontSize > 20) {
                $mobileFs = max(16, (int) round($fontSize * 0.75));
                $mobileList[] = "font-size:{$mobileFs}px";
            }
            $lineHeight = $item['lineHeight'] ?? 0;
            if ($lineHeight > 24) {
                $mobileLh = max(20, (int) round($lineHeight * 0.8));
                $mobileList[] = "line-height:{$mobileLh}px";
            }
            $paddingY = $item['paddingY'] ?? 0;
            if ($paddingY > 16) {
                $mp = (int) round($paddingY * 0.6);
                $mobileList[] = "padding-top:{$mp}px; padding-bottom:{$mp}px";
            }
        }
        if (!empty($mobileList)) {
            $mobileRules[] = "#{$id} { " . implode('; ', $mobileList) . "; }";
        }

        // Hover states for interactive elements
        if (($item['type'] ?? '') === 'submit_button') {
            $cssRules[] = "#{$id} { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }";
            $hoverBg = !empty($item['hoverBgColor']) ? "background-color:{$item['hoverBgColor']};" : '';
            $hoverText = !empty($item['hoverTextColor']) ? "color:{$item['hoverTextColor']};" : '';
            $trY = isset($item['hoverTransformY']) ? (int)$item['hoverTransformY'] : -2;
            $trX = isset($item['hoverTransformX']) ? (int)$item['hoverTransformX'] : 0;
            $cssRules[] = "#{$id}:hover { {$hoverBg} {$hoverText} transform: translate({$trX}px, {$trY}px); box-shadow: 0 8px 22px rgba(0,0,0,0.2); }";
        }

        // Section inner container rule
        if (($item['type'] ?? '') === 'section' && (!empty($item['contentBgColor']) || !empty($item['contentPadding']) || !empty($item['contentBorderRadius']) || !empty($item['contentMaxWidth']))) {
            $innerStyles = [];
            if (!empty($item['contentMaxWidth'])) $innerStyles[] = '--section-max-width:' . $item['contentMaxWidth'];
            if (!empty($item['contentBgColor'])) $innerStyles[] = 'background-color:' . $item['contentBgColor'];
            if (!empty($item['contentPadding'])) $innerStyles[] = 'padding:' . intval($item['contentPadding']) . 'px';
            if (!empty($item['contentBorderRadius'])) $innerStyles[] = 'border-radius:' . intval($item['contentBorderRadius']) . 'px';
            if (!empty($innerStyles)) {
                $cssRules[] = "#{$id} > .funnel-section-inner { " . implode('; ', $innerStyles) . "; }";
            }
        }

        // Grid Container / Row Column Styles & Mobile Reversal
        if (in_array($item['type'] ?? '', ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar']) || (($item['type'] ?? '') === 'section' && ($item['layoutMode'] ?? '') === 'grid')) {
            if (!empty($item['reverseMobileOrder'])) {
                $mobileRules[] = "#{$id} { display: flex; flex-direction: column-reverse; }";
            }
            if (!empty($item['columnStyles']) && is_array($item['columnStyles'])) {
                foreach ($item['columnStyles'] as $cIdx => $cs) {
                    if (empty($cs) || !is_array($cs)) continue;
                    $colSel = "#{$id} > .funnel-col:nth-child(" . ($cIdx + 1) . ")";
                    $colRules = $buildDeviceRules($cs, 'col');

                    if (!empty($cs['bgColor']) && !array_filter($colRules, fn($r) => str_starts_with($r, 'background'))) {
                        $colRules[] = "background-color:{$cs['bgColor']}";
                    }
                    if (isset($cs['padding']) && $cs['padding'] !== '' && $cs['padding'] !== 0 && !array_filter($colRules, fn($r) => str_starts_with($r, 'padding'))) {
                        $colRules[] = "padding:" . intval($cs['padding']) . "px";
                    }
                    if (isset($cs['borderRadius']) && $cs['borderRadius'] !== '' && $cs['borderRadius'] !== 0 && !array_filter($colRules, fn($r) => str_starts_with($r, 'border-radius'))) {
                        $colRules[] = "border-radius:" . intval($cs['borderRadius']) . "px";
                    }
                    if (!empty($cs['borderWidth']) && !array_filter($colRules, fn($r) => str_starts_with($r, 'border'))) {
                        $colRules[] = "border:" . intval($cs['borderWidth']) . "px solid " . ($cs['borderColor'] ?? '#e5e7eb');
                    }
                    if (!empty($cs['shadow']) && $cs['shadow'] !== 'none' && !array_filter($colRules, fn($r) => str_starts_with($r, 'box-shadow'))) {
                        $shadowMap = [
                            'sm' => '0 1px 3px rgba(0,0,0,0.1)',
                            'md' => '0 4px 12px rgba(0,0,0,0.08)',
                            'lg' => '0 10px 25px rgba(0,0,0,0.12)',
                            'brand' => '0 0 20px rgba(99,102,241,0.3)',
                        ];
                        if (isset($shadowMap[$cs['shadow']])) $colRules[] = "box-shadow:{$shadowMap[$cs['shadow']]}";
                    }


                    // Column alignment via CSS variables
                    if (!empty($cs['verticalAlign'])) {
                        $vJustify = $cs['verticalAlign'] === 'center' ? 'center' : ($cs['verticalAlign'] === 'bottom' ? 'flex-end' : ($cs['verticalAlign'] === 'space-between' ? 'space-between' : 'flex-start'));
                        if ($vJustify !== 'flex-start') {
                            $colRules[] = "--col-justify:{$vJustify}";
                        }
                    }
                    if (!empty($cs['horizontalAlign']) && $cs['horizontalAlign'] !== 'stretch') {
                        $colRules[] = "--col-align:{$cs['horizontalAlign']}";
                    }
                    if (isset($cs['gap']) && $cs['gap'] !== '' && $cs['gap'] !== 0) {
                        $colRules[] = "--col-gap:" . intval($cs['gap']) . "px";
                    }

                    $dedupedCol = $deduplicateRules($colRules);
                    if (!empty($dedupedCol)) {
                        $cssRules[] = "{$colSel} { " . implode('; ', $dedupedCol) . "; }";
                    }

                    if (!empty($cs['hasBadge']) && !empty($cs['badgeText'])) {
                        $badgeBg = $cs['badgeBgColor'] ?? '#4f46e5';
                        $badgeText = $cs['badgeTextColor'] ?? '#ffffff';
                        $cssRules[] = "{$colSel} > .funnel-col-badge { background: {$badgeBg}; color: {$badgeText}; }";
                    }

                    $colHover = $buildHoverRules($cs);
                    $dedupedColHover = $deduplicateRules($colHover);
                    if (!empty($dedupedColHover)) {
                        $cssRules[] = "{$colSel}:hover { " . implode('; ', $dedupedColHover) . "; }";
                    }
                }
            }
        }

        if (($item['type'] ?? '') === 'spacer') {
            $h = isset($item['spacerHeight']) ? (int)$item['spacerHeight'] : (((int)($item['paddingY'] ?? 20)) * 2);
            $cssRules[] = "#{$id} { height: {$h}px; }";
        }

        if (($item['type'] ?? '') === 'progress_bar') {
            $pct = (int)($item['percent'] ?? 80);
            $cssRules[] = "#{$id} .progress-fill { width: {$pct}%; }";
        }

        if (($item['type'] ?? '') === 'divider') {
            $isVertical = ($item['dividerType'] ?? '') === 'vertical';
            $thickness = isset($item['dividerThickness']) ? (int)$item['dividerThickness'] : 1;
            $style = $item['dividerStyle'] ?? 'solid';
            $color = $item['dividerColor'] ?? ($item['borderColor'] ?? '#e5e7eb');
            $align = $item['alignment'] ?? 'center';
            $justify = $align === 'left' ? 'flex-start' : ($align === 'right' ? 'flex-end' : 'center');

            if ($isVertical) {
                $heightVal = isset($item['dividerHeight']) ? "{$item['dividerHeight']}" . ($item['dividerHeightUnit'] ?? 'px') : '60px';
                $cssRules[] = "#{$id}-wrap { display:flex; width:100%; justify-content:{$justify}; padding:4px 0; }";
                $cssRules[] = "#{$id} { height:{$heightVal}; width:{$thickness}px; border:none; border-left:{$thickness}px {$style} {$color}; }";
            } else {
                $widthVal = isset($item['dividerWidth']) ? "{$item['dividerWidth']}" . ($item['dividerWidthUnit'] ?? '%') : '100%';
                $cssRules[] = "#{$id}-wrap { display:flex; width:100%; justify-content:{$justify}; padding:8px 0; }";
                $cssRules[] = "#{$id} { width:{$widthVal}; border:none; border-top:{$thickness}px {$style} {$color}; }";
            }
        }

        // Recurse children
        foreach ($item['elements'] ?? [] as $el) {
            $this->collectElementCss($el, $cssRules, $tabletRules, $mobileRules);
        }
        foreach ($item['columns'] ?? [] as $col) {
            foreach ($col as $child) {
                $this->collectElementCss($child, $cssRules, $tabletRules, $mobileRules);
            }
        }
    }

    private function renderItemScoped(array $item): string
    {
        if (empty($item)) return '';

        $rawId = $item['id'] ?? '';
        $id    = 'el-' . preg_replace('/[^a-zA-Z0-9\-_]/', '-', $rawId);
        $type  = $item['type'] ?? '';

        if ($type === 'section') {
            $elements = $item['elements'] ?? [];
            if (empty($elements) && !empty($item['columns'])) {
                $hasCols = false;
                foreach ($item['columns'] as $col) {
                    if (!empty($col)) { $hasCols = true; break; }
                }
                if ($hasCols) {
                    $elements = [[
                        'id' => ($rawId . '_auto_row'),
                        'type' => 'grid_container',
                        'name' => 'Row (' . count($item['columns']) . ' Col)',
                        'colsCount' => $item['colsCount'] ?? count($item['columns']),
                        'columns' => $item['columns'],
                        'columnStyles' => $item['columnStyles'] ?? [],
                        'columnWidths' => $item['columnWidths'] ?? null,
                        'gridPreset' => $item['gridPreset'] ?? '50-50',
                        'gap' => $item['gap'] ?? 20,
                        'containerWidth' => '1120',
                        'contentWidth' => 'wide',
                        'elements' => [],
                    ]];
                }
            }
            $inner = implode('', array_map(fn($el) => $this->renderItemScoped($el), $elements));
            $tag = in_array($item['htmlTag'] ?? '', ['header', 'footer', 'main', 'section', 'div']) ? $item['htmlTag'] : 'section';
            
            return "<{$tag} id=\"{$id}\" class=\"funnel-section\"><div class=\"funnel-section-inner\">{$inner}</div></{$tag}>";
        }

        if ($type === 'flex_container') {
            $inner = implode('', array_map(fn($el) => $this->renderItemScoped($el), $item['elements'] ?? []));
            return "<div id=\"{$id}\" class=\"funnel-flex-container\">{$inner}</div>";
        }

        if (in_array($type, ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'])) {
            $colsCount = $item['colsCount'] ?? ($item['gridColumns'] ?? 2);
            $colsHtml  = '';
            for ($cIdx = 0; $cIdx < $colsCount; $cIdx++) {
                $cs = $item['columnStyles'][$cIdx] ?? [];
                $badgeHtml = (!empty($cs['hasBadge']) && !empty($cs['badgeText']))
                    ? '<div class="funnel-col-badge">' . e($cs['badgeText']) . '</div>'
                    : '';
                $colContent = implode('', array_map(fn($c) => $this->renderItemScoped($c), $item['columns'][$cIdx] ?? []));

                if (!empty($cs['linkUrl'])) {
                    $target = !empty($cs['linkTargetBlank']) ? ' target="_blank" rel="noopener noreferrer"' : '';
                    $colsHtml .= "<a href=\"" . e($cs['linkUrl']) . "\"{$target} class=\"funnel-col funnel-col-clickable\">{$badgeHtml}{$colContent}</a>";
                } else {
                    $colsHtml .= "<div class=\"funnel-col\">{$badgeHtml}{$colContent}</div>";
                }
            }
            return "<div id=\"{$id}\" class=\"funnel-row funnel-row-{$type}\">{$colsHtml}</div>";
        }

        if (in_array($type, ['headline', 'subheadline'])) {
            $tag = $item['headingTag'] ?? ($type === 'headline' ? 'h1' : 'h2');
            $tag = in_array(strtolower($tag), ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) ? strtolower($tag) : 'h2';
            $text = $item['content'] ?? ($item['text'] ?? '');
            return "<{$tag} id=\"{$id}\">" . e($text) . "</{$tag}>";
        }
        if ($type === 'paragraph') {
            $text = $item['content'] ?? ($item['text'] ?? '');
            return "<p id=\"{$id}\">"  . e($text) . "</p>";
        }

        if ($type === 'bullets') {
            $iconMap = [
                'check-circle' => '✓', 'check' => '✓', 'star' => '⭐', 'sparkles' => '✨',
                'arrow' => '→', 'chevron' => '›', 'dot' => '•', 'shield' => '🛡️',
                'lightning' => '⚡', 'heart' => '❤️', 'cross' => '✕', 'none' => ''
            ];
            $iconName = $item['bulletIcon'] ?? 'check-circle';
            $iconChar = $iconName === 'none' ? '' : ($iconMap[$iconName] ?? '✓');
            $iconHtml = $iconChar !== '' ? "<span class=\"bullet-icon\">{$iconChar}</span>" : '';
            $lis = implode('', array_map(fn($b) => "<li class=\"funnel-bullet-item\">{$iconHtml}<span class=\"bullet-text\">" . e($b) . "</span></li>", $item['items'] ?? []));
            return "<ul id=\"{$id}\" class=\"funnel-bullets\">{$lis}</ul>";
        }

        if ($type === 'quote') {
            $quote  = e($item['quote'] ?? $item['content'] ?? '');
            $author = e($item['author'] ?? 'Author');
            return "<blockquote id=\"{$id}\" class=\"funnel-quote\"><p class=\"quote-text\">\"{$quote}\"</p><cite class=\"quote-author\">&mdash; {$author}</cite></blockquote>";
        }

        if ($type === 'image') {
            $url  = e($item['url'] ?? '');
            $alt  = e($item['alt'] ?? '');
            $imgTag = "<img id=\"" . (!empty($item['linkUrl']) ? '' : $id) . "\" class=\"funnel-img\" src=\"{$url}\" alt=\"{$alt}\" />";
            if (!empty($item['linkUrl'])) {
                $linkUrl = e($item['linkUrl']);
                return "<a id=\"{$id}\" class=\"funnel-img-link\" href=\"{$linkUrl}\" target=\"_blank\" rel=\"noopener\">{$imgTag}</a>";
            }
            return $imgTag;
        }

        if ($type === 'video') {
            $src = e($item['videoUrl'] ?? '');
            return "<div id=\"{$id}\" class=\"funnel-video-wrap\"><iframe src=\"{$src}\" frameborder=\"0\" allowfullscreen></iframe></div>";
        }

        if ($type === 'submit_button') {
            $iconMap = [
                'arrow' => '→', 'lock' => '🔒', 'lightning' => '⚡', 'cart' => '🛒', 'download' => '📥', 'star' => '⭐', 'sparkles' => '✨', 'check' => '✓'
            ];
            $iconKey  = $item['btnIcon'] ?? 'none';
            $iconChar = ($iconKey !== 'none' && isset($iconMap[$iconKey])) ? $iconMap[$iconKey] : '';
            $iconPos  = $item['btnIconPosition'] ?? 'right';
            $textRaw  = e($item['text'] ?? 'Submit');

            $iconHtml = $iconChar !== '' ? "<span class=\"btn-icon\">{$iconChar}</span>" : '';
            $mainText = "<span class=\"btn-main-text\">{$textRaw}</span>";
            $iconGap  = isset($item['btnIconGap']) ? "{$item['btnIconGap']}px" : '8px';
            $contentHtml = $iconChar !== ''
                ? ($iconPos === 'left' ? "<span class=\"btn-icon-wrap\">{$iconHtml}{$mainText}</span>" : "<span class=\"btn-icon-wrap\">{$mainText}{$iconHtml}</span>")
                : $mainText;

            $btnType = $item['btnType'] ?? 'submit';
            $targetUrl = e($item['targetUrl'] ?? '#');
            $typeAttr = ($btnType === 'url') ? "type=\"button\" onclick=\"window.location.href='{$targetUrl}'\"" : "type=\"submit\"";

            $subtextHtml = !empty($item['subtext']) ? "<span class=\"btn-subtext\">" . e($item['subtext']) . "</span>" : '';
            return "<button id=\"{$id}\" class=\"funnel-btn\" {$typeAttr}>{$contentHtml}{$subtextHtml}</button>";
        }

        if ($type === 'input_email') {
            $ph = e($item['placeholder'] ?? 'Enter your email...');
            return "<input type=\"email\" id=\"{$id}\" class=\"funnel-input\" placeholder=\"{$ph}\" />";
        }

        if ($type === 'input_name') {
            $ph = e($item['placeholder'] ?? 'Enter your name...');
            return "<input type=\"text\" id=\"{$id}\" class=\"funnel-input\" placeholder=\"{$ph}\" />";
        }

        if ($type === 'input_phone') {
            $ph = e($item['placeholder'] ?? 'Enter phone...');
            return "<input type=\"tel\" id=\"{$id}\" class=\"funnel-input\" placeholder=\"{$ph}\" />";
        }

        if ($type === 'checkbox') {
            $txt = e($item['text'] ?? '');
            return "<label id=\"{$id}\" class=\"funnel-checkbox\"><input type=\"checkbox\" /> <span>{$txt}</span></label>";
        }

        if ($type === 'audio') {
            $title = e($item['title'] ?? 'Audio Track');
            $url   = e($item['url'] ?? '');
            return "<div id=\"{$id}\" class=\"funnel-audio-wrap\"><p class=\"audio-title\">{$title}</p><audio controls class=\"audio-player\" src=\"{$url}\"></audio></div>";
        }

        if ($type === 'icon_box') {
            $title = e($item['title'] ?? 'Feature Title');
            $desc  = e($item['desc'] ?? 'Feature description...');
            return "<div id=\"{$id}\" class=\"funnel-icon-box\"><h3>{$title}</h3><p>{$desc}</p></div>";
        }

        if ($type === 'progress_bar') {
            $label = e($item['label'] ?? '');
            $pct   = (int) ($item['percent'] ?? 80);
            $labelHtml = $label ? "<p class=\"progress-label\">{$label}</p>" : '';
            return "<div id=\"{$id}\" class=\"funnel-progress-wrap\">{$labelHtml}<div class=\"funnel-progress-bar\"><div class=\"progress-fill\"></div></div></div>";
        }

        if ($type === 'social') {
            $u = urlencode($item['shareUrl'] ?? '');
            return "<div id=\"{$id}\" class=\"funnel-social-wrap\">
                <a href=\"https://www.facebook.com/sharer/sharer.php?u={$u}\" target=\"_blank\" rel=\"noopener\" class=\"funnel-social-fb\">f Share</a>
                <a href=\"https://twitter.com/intent/tweet?url={$u}\" target=\"_blank\" rel=\"noopener\" class=\"funnel-social-tw\">𝕏 Tweet</a>
                <a href=\"https://api.whatsapp.com/send?text={$u}\" target=\"_blank\" rel=\"noopener\" class=\"funnel-social-wa\">✉ Share</a>
            </div>";
        }

        if ($type === 'star_rating') {
            $starChar = '★';
            $numStars = (int)($item['stars'] ?? 5);
            $starsHtml = "<span class=\"star-chars\">" . str_repeat($starChar, $numStars) . "</span>";
            $subtext = !empty($item['ratingText']) ? "<p class=\"rating-subtext\">" . e($item['ratingText']) . "</p>" : '';
            return "<div id=\"{$id}\" class=\"funnel-star-rating\">{$starsHtml}{$subtext}</div>";
        }

        if ($type === 'custom_code') {
            return "<div id=\"{$id}\" class=\"funnel-custom-code\">" . ($item['code'] ?? '') . "</div>";
        }

        if ($type === 'rich_text') {
            return "<div id=\"{$id}\" class=\"funnel-rich-text\">" . ($item['htmlContent'] ?? ($item['content'] ?? '')) . "</div>";
        }

        if ($type === 'order_bump') {
            $badge = e($item['badgeText'] ?? 'YES! ADD THIS TO MY ORDER');
            $title = e($item['title'] ?? 'ONE TIME OFFER: Add Checklist');
            $desc  = e($item['desc'] ?? 'Check this box to instantly include this offer.');
            $price = (float)($item['price'] ?? 17);
            return "<div id=\"{$id}\" class=\"funnel-order-bump\">
                <div class=\"bump-header\">
                    <span class=\"bump-badge\">{$badge}</span>
                    <span class=\"bump-price\">\${$price}</span>
                </div>
                <label>
                    <input type=\"checkbox\" />
                    <div>
                        <h4>{$title}</h4>
                        <p>{$desc}</p>
                    </div>
                </label>
            </div>";
        }

        if ($type === 'faq_accordion') {
            $items = $item['items'] ?? [];
            $faqHtml = '';
            foreach ($items as $faq) {
                $q = e($faq['q'] ?? 'Question?');
                $a = e($faq['a'] ?? '');
                $faqHtml .= "
                <div class=\"faq-item\">
                    <button type=\"button\" class=\"faq-toggle\">
                        <span>{$q}</span>
                        <span class=\"faq-icon\">▼</span>
                    </button>
                    <div class=\"faq-answer\">
                        {$a}
                    </div>
                </div>";
            }
            return "<div id=\"{$id}\" class=\"funnel-faq-accordion\">{$faqHtml}</div>";
        }

        if ($type === 'testimonial_slider') {
            $items = $item['items'] ?? [];
            $slidesHtml = '';
            $dotsHtml   = '';
            $count      = count($items);

            foreach ($items as $idx => $t) {
                $q  = e($t['quote'] ?? '');
                $au = e($t['author'] ?? '');
                $ro = e($t['role'] ?? '');
                $activeCls = ($idx === 0) ? ' active' : '';
                $av  = !empty($t['avatar']) ? "<img src=\"" . e($t['avatar']) . "\" alt=\"{$au}\" class=\"testimonial-avatar\" />" : '';
                $slidesHtml .= "
                <div class=\"testimonial-card{$activeCls}\">
                    <div class=\"testimonial-stars\">★★★★★</div>
                    <blockquote class=\"testimonial-quote\">\"{$q}\"</blockquote>
                    <div class=\"testimonial-author-wrap\">
                        {$av}
                        <div class=\"testimonial-author-info\">
                            <p class=\"testimonial-author-name\">{$au}</p>
                            <p class=\"testimonial-author-role\">{$ro}</p>
                        </div>
                    </div>
                </div>";

                $dotActive = ($idx === 0) ? ' active' : '';
                $dotsHtml .= "<button type=\"button\" class=\"slider-dot{$dotActive}\" data-idx=\"{$idx}\"></button>";
            }

            $navArrows = ($count > 1) ? "
            <button type=\"button\" class=\"slider-prev\">‹</button>
            <button type=\"button\" class=\"slider-next\">›</button>
            " : "";

            $dotsWrap = ($count > 1) ? "<div class=\"slider-dots\">{$dotsHtml}</div>" : "";

            return "<div id=\"{$id}\" class=\"funnel-testimonial-slider\">
                <div class=\"slider-slides-wrap\">{$slidesHtml}</div>
                {$navArrows}
                {$dotsWrap}
            </div>";
        }

        if ($type === 'divider') {
            $isVertical = ($item['dividerType'] ?? '') === 'vertical';
            $cls = $isVertical ? 'funnel-divider funnel-divider-vertical' : 'funnel-divider funnel-divider-horizontal';
            return "<div id=\"{$id}-wrap\" class=\"funnel-divider-wrapper\"><hr id=\"{$id}\" class=\"{$cls}\" /></div>";
        }
        if ($type === 'spacer')  {
            return "<div id=\"{$id}\" class=\"funnel-spacer\"></div>";
        }

        if ($type === 'timer') {
            $d = (int)($item['days'] ?? 0);
            $h = (int)($item['hours'] ?? 2);
            $m = (int)($item['minutes'] ?? 15);
            $s = (int)($item['seconds'] ?? 0);
            $action = e($item['timerAction'] ?? 'show_message');
            $redirectUrl = e($item['redirectUrl'] ?? '#');
            $expireMsg = e($item['expireMessage'] ?? 'OFFER EXPIRED!');
            $theme = $item['timerTheme'] ?? 'red_urgent';
            $timeText = ($d > 0 ? sprintf('%02dd : ', $d) : '') . sprintf('%02dh : %02dm : %02ds', $h, $m, $s);

            return "<div id=\"{$id}\" class=\"funnel-timer timer-theme-{$theme}\" data-days=\"{$d}\" data-hours=\"{$h}\" data-minutes=\"{$m}\" data-seconds=\"{$s}\" data-action=\"{$action}\" data-redirect=\"{$redirectUrl}\" data-message=\"{$expireMsg}\">⏰ <span class=\"timer-display\">{$timeText}</span></div>";
        }

        if ($type === 'two_step_order') {
            $step1Title = e($item['step1Title'] ?? 'Step 1: Contact & Shipping Info');
            $step1Sub = e($item['step1Subtitle'] ?? 'Where should we send your receipt and access?');
            $step1Btn = e($item['step1BtnText'] ?? 'Proceed to Step 2: Payment →');
            $step2Title = e($item['step2Title'] ?? 'Step 2: Select Offer & Payment');
            $step2Sub = e($item['step2Subtitle'] ?? 'Fast & Encrypted 256-bit SSL Checkout');
            $step2Btn = e($item['step2BtnText'] ?? 'Complete Secure Order Now 🔒');
            $bumpBadge = e($item['bumpBadge'] ?? '70% OFF SPECIAL');
            $bumpTitle = e($item['bumpTitle'] ?? 'ONE TIME OFFER: Add Template Pack');
            $bumpDesc = e($item['bumpDesc'] ?? 'Check this box to include this high-converting pack.');
            $bumpPrice = (float)($item['bumpPrice'] ?? 19);
            $guarantee = e($item['guaranteeBadge'] ?? '30-Day 100% Risk-Free Money-Back Guarantee');
            $showPhone = !empty($item['showPhone']);
            $showAddress = !empty($item['showAddress']);
            $products = is_array($item['products'] ?? null) && !empty($item['products']) ? $item['products'] : [
                ['id' => 'prod_1', 'name' => 'Standard Full License', 'price' => 47, 'desc' => 'Instant access + all features', 'defaultSelected' => true]
            ];

            $productsHtml = '';
            foreach ($products as $idx => $p) {
                $pName = e($p['name'] ?? 'Product');
                $pPrice = (float)($p['price'] ?? 47);
                $pDesc = !empty($p['desc']) ? "<div class=\"two-step-product-desc\">" . e($p['desc']) . "</div>" : '';
                $checked = ($idx === 0) ? 'checked' : '';
                $borderCol = ($idx === 0) ? 'var(--color-primary, #6366f1)' : '#e5e7eb';
                $productsHtml .= "
                <label class=\"two-step-product-option {$checked}\">
                    <div class=\"two-step-product-info\">
                        <input type=\"radio\" name=\"selected_product\" class=\"two-step-product-radio\" value=\"{$p['id']}\" data-name=\"{$pName}\" data-price=\"{$pPrice}\" {$checked} />
                        <div>
                            <div class=\"two-step-product-name\">{$pName}</div>
                            {$pDesc}
                        </div>
                    </div>
                    <div class=\"two-step-product-price\">\${$pPrice}</div>
                </label>";
            }

            $bumpHtml = !empty($item['hasOrderBump']) ? "
            <div class=\"two-step-bump-box\">
                <div class=\"two-step-bump-header\">
                    <span class=\"two-step-bump-badge\">{$bumpBadge}</span>
                    <span class=\"two-step-bump-price\">+\${$bumpPrice}</span>
                </div>
                <label class=\"two-step-bump-body\">
                    <input type=\"checkbox\" class=\"two-step-bump-checkbox\" data-bump-title=\"{$bumpTitle}\" data-bump-price=\"{$bumpPrice}\" />
                    <div>
                        <span class=\"two-step-bump-title\">{$bumpTitle}</span>
                        <p class=\"two-step-bump-desc\">{$bumpDesc}</p>
                    </div>
                </label>
            </div>" : "";

            $phoneField = $showPhone ? "
            <div class=\"two-step-field-group\">
                <label>Phone Number (WhatsApp) *</label>
                <input type=\"tel\" name=\"customer_phone\" class=\"funnel-input two-step-phone-input\" placeholder=\"e.g. +1 555 123 4567\" />
            </div>" : "";

            $addressField = $showAddress ? "
            <div class=\"two-step-field-group\">
                <label>Shipping Address</label>
                <input type=\"text\" name=\"customer_address\" class=\"funnel-input two-step-address-input\" placeholder=\"Street Address\" />
            </div>" : "";

            $initialPrice = (float)($products[0]['price'] ?? 47);

            return "<div id=\"{$id}\" class=\"funnel-two-step-order\">
                <div class=\"two-step-tabs\">
                    <div class=\"two-step-tab-btn active\" data-step=\"1\">
                        <span class=\"step-num\">1</span>
                        Contact Info
                    </div>
                    <div class=\"two-step-tab-btn\" data-step=\"2\">
                        <span class=\"step-num\">2</span>
                        Payment & Summary
                    </div>
                </div>

                <div class=\"two-step-pane pane-step-1\">
                    <div class=\"two-step-pane-header\">
                        <h3>{$step1Title}</h3>
                        <p>{$step1Sub}</p>
                    </div>
                    <div class=\"two-step-form-grid\">
                        <div class=\"two-step-field-group\">
                            <label>Full Name *</label>
                            <input type=\"text\" name=\"customer_name\" class=\"funnel-input two-step-name-input\" placeholder=\"e.g. John Doe\" required />
                        </div>
                        <div class=\"two-step-field-group\">
                            <label>Email Address *</label>
                            <input type=\"email\" name=\"customer_email\" class=\"funnel-input two-step-email-input\" placeholder=\"e.g. john@example.com\" required />
                        </div>
                        {$phoneField}
                        {$addressField}
                        <button type=\"button\" class=\"btn-goto-step-2\">
                            {$step1Btn}
                        </button>
                    </div>
                </div>

                <div class=\"two-step-pane pane-step-2\">
                    <div class=\"two-step-pane-header\">
                        <h3>{$step2Title}</h3>
                        <p>{$step2Sub}</p>
                    </div>
                    
                    <div class=\"two-step-products-list\">
                        {$productsHtml}
                    </div>

                    {$bumpHtml}

                    <div class=\"two-step-summary-box\">
                        <span>Total Amount:</span>
                        <span class=\"two-step-total-display\">\${$initialPrice}</span>
                    </div>

                    <div class=\"two-step-payment-section\">
                        <label class=\"two-step-payment-label\">Payment Method</label>
                        <div class=\"two-step-payment-grid\">
                            <label class=\"two-step-gateway-label\">
                                <input type=\"radio\" name=\"payment_gateway\" value=\"stripe\" checked /> 💳 Card
                            </label>
                            <label class=\"two-step-gateway-label\">
                                <input type=\"radio\" name=\"payment_gateway\" value=\"paypal\" /> 🅿️ PayPal
                            </label>
                            <label class=\"two-step-gateway-label\">
                                <input type=\"radio\" name=\"payment_gateway\" value=\"cod\" /> 📦 COD
                            </label>
                        </div>
                    </div>

                    <button type=\"button\" class=\"btn-complete-checkout\">
                        {$step2Btn}
                    </button>

                    <div class=\"two-step-guarantee\">
                        🛡️ {$guarantee}
                    </div>
                </div>
            </div>";
        }

        if ($type === 'upsell_box') {
            $headline = e($item['offerHeadline'] ?? 'WAIT! Special One-Time Offer');
            $subheadline = e($item['offerSubheadline'] ?? 'Add this exclusive upgrade to your order.');
            $urgency = e($item['urgencyText'] ?? '⚡ This discounted offer is only available right now.');
            $prodName = e($item['productName'] ?? 'VIP Accelerator Pack');
            $price = (float)($item['productPrice'] ?? 47);
            $regPrice = (float)($item['regularPrice'] ?? 197);
            $acceptBtn = e($item['acceptBtnText'] ?? "YES! Add This to My Order for Only \${$price} →");
            $declineBtn = e($item['declineBtnText'] ?? 'No thanks, I will pass on this special offer');

            return "<div id=\"{$id}\" class=\"funnel-upsell-box\">
                <div class=\"upsell-badge\">
                    {$urgency}
                </div>
                <h2 class=\"upsell-headline\">{$headline}</h2>
                <p class=\"upsell-subheadline\">{$subheadline}</p>

                <div class=\"upsell-callout\">
                    <h4>{$prodName}</h4>
                    <div class=\"price-row\">
                        <span class=\"reg-price\">Regular: \${$regPrice}</span>
                        <span class=\"upsell-special-price\">Special Price: \${$price}</span>
                    </div>
                </div>

                <button type=\"button\" class=\"btn-upsell-accept\" data-price=\"{$price}\" data-product=\"{$prodName}\">
                    {$acceptBtn}
                </button>

                <div>
                    <button type=\"button\" class=\"btn-upsell-decline\">
                        {$declineBtn}
                    </button>
                </div>
            </div>";
        }

        if ($type === 'pricing_table') {
            $plans = is_array($item['plans'] ?? null) && !empty($item['plans']) ? $item['plans'] : [
                ['name' => 'Starter', 'price' => '29', 'period' => '/mo', 'features' => ['1 Funnel', '1,000 Visitors', 'Standard Support'], 'btnText' => 'Choose Starter'],
                ['name' => 'Growth', 'price' => '79', 'period' => '/mo', 'features' => ['Unlimited Funnels', '50,000 Visitors', 'Order Bumps & Upsells', 'Priority Support'], 'isFeatured' => true, 'btnText' => 'Choose Growth']
            ];

            $cardsHtml = '';
            foreach ($plans as $p) {
                $isFeat = !empty($p['isFeatured']);
                $badgeHtml = $isFeat ? "<span class=\"pricing-featured-badge\">Most Popular</span>" : "";
                $featsHtml = '';
                foreach ($p['features'] ?? [] as $f) {
                    $featsHtml .= "<li class=\"pricing-feature-item\"><span class=\"pricing-feature-check\">✓</span><span>" . e($f) . "</span></li>";
                }
                $featClass = $isFeat ? 'featured' : '';
                $pName = e($p['name'] ?? 'Plan');
                $pPrice = e($p['price'] ?? '0');
                $pPeriod = e($p['period'] ?? '/mo');
                $pBtn = e($p['btnText'] ?? 'Select Plan');

                $cardsHtml .= "
                <div class=\"pricing-card {$featClass}\">
                    <div>
                        {$badgeHtml}
                        <h4 class=\"pricing-plan-title\">{$pName}</h4>
                        <div class=\"pricing-amount-wrap\">
                            <span class=\"pricing-amount\">\${$pPrice}</span>
                            <span class=\"pricing-period\">{$pPeriod}</span>
                        </div>
                        <ul class=\"pricing-features-list\">
                            {$featsHtml}
                        </ul>
                    </div>
                    <button type=\"button\" class=\"btn-pricing-cta\">
                        {$pBtn}
                    </button>
                </div>";
            }
            return "<div id=\"{$id}\" class=\"funnel-pricing-table\">{$cardsHtml}</div>";
        }

        return '';
    }

    // ─── Universal Opt-In Form Submission Endpoint ───────────────────────────

    public function submitOptin(Request $request, string $workspaceSlug, string $funnelSlug): \Illuminate\Http\JsonResponse
    {
        $funnel = $this->resolveFunnel($workspaceSlug, $funnelSlug);
        $steps = $funnel->steps;

        $validated = $request->validate([
            'email'         => ['required', 'email'],
            'name'          => ['nullable', 'string', 'max:255'],
            'phone'         => ['nullable', 'string', 'max:50'],
            'step_id'       => ['nullable'],
            'custom_fields' => ['nullable', 'array'],
        ]);

        // Anti-spam Honeypot Check
        if ($request->filled('_hp_security_check') || $request->filled('website_trap')) {
            return response()->json([
                'success'      => true,
                'message'      => 'Thank you! Your submission has been received.',
                'redirect_url' => url("/f/{$workspaceSlug}/{$funnelSlug}"),
            ]);
        }

        $stepId = $validated['step_id'] ?? null;
        $currentStep = $stepId ? $steps->firstWhere('id', (int) $stepId) : $steps->first();

        $utmData = [
            'utm_source'   => $request->input('utm_source'),
            'utm_medium'   => $request->input('utm_medium'),
            'utm_campaign' => $request->input('utm_campaign'),
            'utm_term'     => $request->input('utm_term'),
            'utm_content'  => $request->input('utm_content'),
            'referrer'     => $request->input('referrer') ?? $request->header('referer'),
        ];

        $contact = app(\App\Modules\Shared\Services\ContactService::class)->upsert((int) $funnel->workspace_id, [
            'name'  => $validated['name'] ?? null,
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ]);

        $submission = \App\Modules\Funnels\Models\FunnelSubmission::create([
            'workspace_id'   => (int) $funnel->workspace_id,
            'funnel_id'      => $funnel->id,
            'funnel_step_id' => $currentStep?->id ?? 0,
            'contact_id'     => $contact->id,
            'email'          => $validated['email'],
            'phone'          => $validated['phone'] ?? null,
            'first_name'     => $validated['name'] ?? null,
            'form_data'      => array_merge($validated, array_filter($utmData)),
            'ref_code'       => $request->cookie('funnel_ref'),
            'visitor_ip'     => $request->ip(),
            'status'         => 'optin',
            'is_partial'     => false,
        ]);

        // Increment conversion stats
        $funnel->increment('conversions_count');
        if ($currentStep) {
            $currentStep->increment('conversions_count');
        }

        $funnelContext = [
            'funnel_id'       => $funnel->id,
            'funnel_name'     => $funnel->name,
            'funnel_step_id'  => $currentStep?->id,
            'step_name'       => $currentStep?->name ?? 'Optin Step',
            'step_type'       => $currentStep?->type ?? 'optin',
            'variant'         => $request->input('variant', 'A'),
            'email'           => $validated['email'],
            'name'            => $validated['name'] ?? '',
            'phone'           => $validated['phone'] ?? '',
            'submitted_data'  => $validated,
            'utm'             => array_filter($utmData),
        ];

        // Trigger Automation (both optin and general form triggers)
        $this->triggerFunnelAutomation((int) $funnel->workspace_id, $contact->id, 'funnel.optin_submitted', $funnelContext);
        $this->triggerFunnelAutomation((int) $funnel->workspace_id, $contact->id, 'funnel.form_submitted', $funnelContext);

        // Resolve next step in the funnel sequence
        $currentStepIndex = $currentStep ? $steps->search(fn ($s) => $s->id === $currentStep->id) : 0;
        $nextStep = ($currentStepIndex !== false && $steps->count() > $currentStepIndex + 1)
            ? $steps->get($currentStepIndex + 1)
            : null;

        $redirectUrl = $nextStep
            ? url("/f/{$workspaceSlug}/{$funnelSlug}/" . ($nextStep->slug ?: 'step-' . $nextStep->id))
            : url("/f/{$workspaceSlug}/{$funnelSlug}");

        return response()->json([
            'success'       => true,
            'message'       => 'Thank you! Your submission has been received.',
            'submission_id' => $submission->id,
            'redirect_url'  => $redirectUrl,
        ]);
    }

    // ─── Step 1 Lead Capture (Cart Abandonment Recovery) ─────────────────────

    public function captureStep1Lead(Request $request, string $workspaceSlug, string $funnelSlug): \Illuminate\Http\JsonResponse
    {
        $funnel = $this->resolveFunnel($workspaceSlug, $funnelSlug);
        $firstStep = $funnel->steps->first();

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'name'  => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
        ]);

        $contact = app(\App\Modules\Shared\Services\ContactService::class)->upsert((int) $funnel->workspace_id, [
            'name' => $validated['name'] ?? null,
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ]);

        $submission = \App\Modules\Funnels\Models\FunnelSubmission::create([
            'workspace_id'    => (int) $funnel->workspace_id,
            'funnel_id'       => $funnel->id,
            'funnel_step_id'  => $firstStep?->id ?? 0,
            'contact_id'      => $contact->id,
            'email'           => $validated['email'],
            'phone'           => $validated['phone'] ?? null,
            'first_name'      => $validated['name'] ?? null,
            'form_data'       => $validated,
            'ref_code'        => $request->cookie('funnel_ref'),
            'visitor_ip'      => $request->ip(),
            'status'          => 'partial_lead',
            'is_partial'      => true,
        ]);

        $step1Context = [
            'funnel_id'       => $funnel->id,
            'funnel_name'     => $funnel->name,
            'funnel_step_id'  => $firstStep?->id ?? 0,
            'step_name'       => $firstStep?->name ?? 'Step 1',
            'step_type'       => $firstStep?->type ?? 'checkout',
            'variant'         => $request->input('variant', 'A'),
            'email'           => $validated['email'],
            'name'            => $validated['name'] ?? '',
            'phone'           => $validated['phone'] ?? '',
            'submitted_data'  => $validated,
        ];

        $this->triggerFunnelAutomation((int) $funnel->workspace_id, $contact->id, 'funnel.form_submitted', $step1Context);
        $this->triggerFunnelAutomation((int) $funnel->workspace_id, $contact->id, 'funnel.cart_abandoned', $step1Context);

        return response()->json([
            'success'       => true,
            'submission_id' => $submission->id,
        ]);
    }

    // ─── 2-Step Checkout Submission Endpoint ─────────────────────────────────

    public function processCheckout(Request $request, string $workspaceSlug, string $funnelSlug): \Illuminate\Http\JsonResponse
    {
        $funnel = $this->resolveFunnel($workspaceSlug, $funnelSlug);
        $steps = $funnel->steps;
        $currentStep = $steps->first();

        $validated = $request->validate([
            'email'           => ['required', 'email'],
            'name'            => ['nullable', 'string'],
            'phone'           => ['nullable', 'string'],
            'address'         => ['nullable', 'string'],
            'product_id'      => ['nullable', 'string'],
            'product_name'    => ['nullable', 'string'],
            'product_price'   => ['nullable', 'numeric'],
            'has_bump'        => ['nullable', 'boolean'],
            'bump_title'      => ['nullable', 'string'],
            'bump_price'      => ['nullable', 'numeric'],
            'total_amount'    => ['required', 'numeric', 'min:0'],
            'payment_gateway' => ['nullable', 'string'],
            'submission_id'   => ['nullable', 'integer'],
        ]);

        $contact = app(\App\Modules\Shared\Services\ContactService::class)->upsert((int) $funnel->workspace_id, [
            'name'  => $validated['name'] ?? null,
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ]);

        $submission = !empty($validated['submission_id'])
            ? \App\Modules\Funnels\Models\FunnelSubmission::find($validated['submission_id'])
            : null;

        if ($submission) {
            $submission->update([
                'status'          => 'completed',
                'is_partial'      => false,
                'order_amount'    => $validated['total_amount'],
                'payment_gateway' => $validated['payment_gateway'] ?? 'stripe',
                'form_data'       => array_merge($submission->form_data ?? [], $validated),
            ]);
        } else {
            $submission = \App\Modules\Funnels\Models\FunnelSubmission::create([
                'workspace_id'    => (int) $funnel->workspace_id,
                'funnel_id'       => $funnel->id,
                'funnel_step_id'  => $currentStep?->id ?? 0,
                'contact_id'      => $contact->id,
                'email'           => $validated['email'],
                'phone'           => $validated['phone'] ?? null,
                'first_name'      => $validated['name'] ?? null,
                'form_data'       => $validated,
                'order_amount'    => $validated['total_amount'],
                'payment_gateway' => $validated['payment_gateway'] ?? 'stripe',
                'ref_code'        => $request->cookie('funnel_ref'),
                'visitor_ip'      => $request->ip(),
                'status'          => 'completed',
                'is_partial'      => false,
            ]);
        }

        // Increment funnel & step stats
        $funnel->increment('conversions_count');
        $funnel->increment('total_revenue', (float) $validated['total_amount']);
        if ($currentStep) {
            $currentStep->increment('conversions_count');
        }

        $checkoutContext = [
            'funnel_id'       => $funnel->id,
            'funnel_name'     => $funnel->name,
            'funnel_step_id'  => $currentStep?->id,
            'step_name'       => $currentStep?->name ?? 'Order Form',
            'step_type'       => $currentStep?->type ?? 'checkout',
            'variant'         => $request->input('variant', 'A'),
            'order_total'     => $validated['total_amount'],
            'order_amount'    => $validated['total_amount'],
            'product_name'    => $validated['product_name'] ?? 'Product',
            'has_order_bump'  => !empty($validated['has_bump']),
            'email'           => $validated['email'],
            'name'            => $validated['name'] ?? '',
            'phone'           => $validated['phone'] ?? '',
        ];

        // Fire Automations
        $this->triggerFunnelAutomation((int) $funnel->workspace_id, $contact->id, 'funnel.order_completed', $checkoutContext);

        if (!empty($validated['has_bump'])) {
            $bumpContext = array_merge($checkoutContext, [
                'bump_title' => $validated['bump_title'] ?? 'Order Bump',
                'bump_price' => $validated['bump_price'] ?? 0,
            ]);
            $this->triggerFunnelAutomation((int) $funnel->workspace_id, $contact->id, 'funnel.order_bump_purchased', $bumpContext);
        }

        // Resolve next step (e.g. upsell or thankyou)
        $nextStep = $steps->skip(1)->first();
        $redirectUrl = $nextStep
            ? url("/f/{$workspaceSlug}/{$funnelSlug}/" . ($nextStep->slug ?: 'step-' . $nextStep->id))
            : url("/f/{$workspaceSlug}/{$funnelSlug}");

        // If paid funnel checkout, create Stripe Checkout Session
        if ((float) $validated['total_amount'] > 0) {
            $stripeSecret = $this->resolveStripeSecretKey((int) $funnel->workspace_id);
            if ($stripeSecret && strlen($stripeSecret) > 8) {
                try {
                    $stripe = new \Stripe\StripeClient($stripeSecret);
                    $session = $stripe->checkout->sessions->create([
                        'payment_method_types' => ['card'],
                        'customer_email' => $validated['email'],
                        'line_items' => [[
                            'price_data' => [
                                'currency' => 'usd',
                                'unit_amount' => (int) round(((float) $validated['total_amount']) * 100),
                                'product_data' => [
                                    'name' => $validated['product_name'] ?? ($funnel->name . ' Checkout'),
                                    'description' => !empty($validated['has_bump']) ? 'Includes ' . ($validated['bump_title'] ?? 'Bonus Offer') : null,
                                ],
                            ],
                            'quantity' => 1,
                        ]],
                        'mode' => 'payment',
                        'client_reference_id' => 'FUNNEL-' . $funnel->id . '-' . $submission->id,
                        'metadata' => [
                            'funnel_id' => (string) $funnel->id,
                            'submission_id' => (string) $submission->id,
                            'contact_id' => (string) $contact->id,
                            'workspace_id' => (string) $funnel->workspace_id,
                            'type' => 'funnel_checkout',
                        ],
                        'success_url' => $redirectUrl . '?session_id={CHECKOUT_SESSION_ID}&payment_status=success',
                        'cancel_url' => url("/f/{$workspaceSlug}/{$funnelSlug}") . '?payment_status=cancelled',
                    ]);

                    return response()->json([
                        'success'       => true,
                        'submission_id' => $submission->id,
                        'redirect_url'  => $session->url,
                        'message'       => 'Redirecting to payment checkout...',
                    ]);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('FunnelRenderController: Stripe session creation failed', ['error' => $e->getMessage()]);
                }
            }
        }

        return response()->json([
            'success'       => true,
            'submission_id' => $submission->id,
            'redirect_url'  => $redirectUrl,
        ]);
    }

    private function resolveStripeSecretKey(int $workspaceId): ?string
    {
        $store = \App\Modules\Ecommerce\Models\EcommerceStore::where('workspace_id', $workspaceId)->where('is_active', true)->first();
        if ($store && !empty($store->credentials['stripe_secret_key'])) {
            return $store->credentials['stripe_secret_key'];
        }

        return config('billing.gateways.stripe.secret_key') ?: env('STRIPE_SECRET');
    }

    // ─── 1-Click Upsell / OTO Action Endpoint ───────────────────────────────

    public function processUpsellAction(Request $request, string $workspaceSlug, string $funnelSlug): \Illuminate\Http\JsonResponse
    {
        $funnel = $this->resolveFunnel($workspaceSlug, $funnelSlug);
        $validated = $request->validate([
            'decision'      => ['required', 'in:accept,decline'],
            'product_name'  => ['nullable', 'string'],
            'product_price' => ['nullable', 'numeric'],
        ]);

        $steps = $funnel->steps;
        $upsellStep = $steps->whereIn('type', ['upsell', 'downsell'])->first() ?? $steps->skip(1)->first();
        $nextStep = $steps->skip(2)->first() ?? $steps->last();

        if ($validated['decision'] === 'accept') {
            $price = (float)($validated['product_price'] ?? 47);
            $funnel->increment('total_revenue', $price);
            if ($upsellStep) {
                $upsellStep->increment('conversions_count');
            }

            $contactId = $request->user()?->id ?? null;
            $upsellContext = [
                'funnel_id'       => $funnel->id,
                'funnel_name'     => $funnel->name,
                'funnel_step_id'  => $upsellStep?->id,
                'step_name'       => $upsellStep?->name ?? 'Upsell',
                'variant'         => $request->input('variant', 'A'),
                'upsell_product'  => $validated['product_name'] ?? 'Upsell Offer',
                'product_name'    => $validated['product_name'] ?? 'Upsell Offer',
                'upsell_price'    => $price,
                'order_amount'    => $price,
            ];
            $this->triggerFunnelAutomation((int) $funnel->workspace_id, $contactId, 'funnel.upsell_accepted', $upsellContext);
        } else {
            $contactId = $request->user()?->id ?? null;
            $declineContext = [
                'funnel_id'       => $funnel->id,
                'funnel_name'     => $funnel->name,
                'funnel_step_id'  => $upsellStep?->id,
                'step_name'       => $upsellStep?->name ?? 'Upsell',
                'variant'         => $request->input('variant', 'A'),
            ];
            $this->triggerFunnelAutomation((int) $funnel->workspace_id, $contactId, 'funnel.upsell_declined', $declineContext);
        }

        $redirectUrl = $nextStep
            ? url("/f/{$workspaceSlug}/{$funnelSlug}/" . ($nextStep->slug ?: 'step-' . $nextStep->id))
            : url("/f/{$workspaceSlug}/{$funnelSlug}");

        return response()->json([
            'success'      => true,
            'decision'     => $validated['decision'],
            'redirect_url' => $redirectUrl,
        ]);
    }

    // ─── Helper: Resolve Funnel and Automations ─────────────────────────────

    private function resolveFunnel(string $workspaceSlug, string $funnelSlug): Funnel
    {
        $workspace = is_numeric($workspaceSlug)
            ? Workspace::find((int) $workspaceSlug)
            : Workspace::where('id', $workspaceSlug)->orWhere('name', $workspaceSlug)->first();

        $funnel = null;
        if ($workspace) {
            $funnel = Funnel::where('workspace_id', $workspace->id)
                ->where(function ($q) use ($funnelSlug) {
                    $q->where('slug', $funnelSlug)
                      ->orWhere('uuid', $funnelSlug)
                      ->orWhere('id', $funnelSlug);
                })
                ->with(['steps' => fn ($q) => $q->orderBy('sort_order'), 'steps.pages'])
                ->first();
        }

        if (! $funnel) {
            $funnel = Funnel::where(function ($q) use ($funnelSlug) {
                    $q->where('slug', $funnelSlug)
                      ->orWhere('uuid', $funnelSlug)
                      ->orWhere('id', $funnelSlug);
                })
                ->with(['steps' => fn ($q) => $q->orderBy('sort_order'), 'steps.pages'])
                ->firstOrFail();
        }

        return $funnel;
    }

    private function triggerFunnelAutomation(int $workspaceId, ?int $contactId, string $triggerType, array $context = []): void
    {
        if (! $contactId) return;
        try {
            $engine = app(\App\Modules\Automation\Services\AutomationEngine::class);
            $automations = \App\Modules\Automation\Models\Automation::where('workspace_id', $workspaceId)
                ->where('status', 'active')
                ->get();

            foreach ($automations as $auto) {
                $matchedTrigger = $this->matchesAutomationTrigger($auto, $triggerType, $context);
                if ($matchedTrigger !== null) {
                    $triggerContext = array_merge($context, [
                        '_matched_trigger_id' => $matchedTrigger['id'] ?? null,
                        'trigger_name'        => $matchedTrigger['trigger_name'] ?? 'Funnel Trigger',
                        'trigger_type'        => $triggerType,
                    ]);
                    $engine->triggerForContact($auto, $contactId, $triggerContext);
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Funnel automation trigger {$triggerType} failed: " . $e->getMessage());
        }
    }

    /**
     * Match an automation against a funnel event based on trigger_type and trigger_config filters.
     */
    private function matchesAutomationTrigger(\App\Modules\Automation\Models\Automation $auto, string $triggerType, array $context): ?array
    {
        $triggers = [];

        // 1. Check graph nodes for triggerNode or trigger
        if (! empty($auto->nodes) && is_array($auto->nodes)) {
            foreach ($auto->nodes as $node) {
                $isTrigger = ($node['type'] ?? '') === 'triggerNode'
                    || ($node['type'] ?? '') === 'trigger'
                    || isset($node['data']['triggerType']);

                if ($isTrigger) {
                    $type = $node['data']['triggerType'] ?? $node['data']['trigger_type'] ?? null;
                    $config = $node['data']['triggerConfig'] ?? $node['data']['trigger_config'] ?? [];
                    $name = $node['data']['triggerName'] ?? $node['data']['trigger_name'] ?? $node['data']['label'] ?? 'Trigger';
                    if ($type) {
                        $triggers[] = [
                            'id'             => $node['id'] ?? 'trigger-1',
                            'trigger_type'   => $type,
                            'trigger_name'   => $name,
                            'trigger_config' => is_array($config) ? $config : [],
                        ];
                    }
                }
            }
        }

        // 2. Fallback to root trigger_type if no node triggers found
        if (empty($triggers) && ! empty($auto->trigger_type)) {
            $triggers[] = [
                'id'             => 'trigger-1',
                'trigger_type'   => $auto->trigger_type,
                'trigger_name'   => $auto->trigger_config['trigger_name'] ?? 'Trigger',
                'trigger_config' => is_array($auto->trigger_config) ? $auto->trigger_config : [],
            ];
        }

        foreach ($triggers as $tr) {
            $trType = $tr['trigger_type'];

            // Exact type match or alias match
            $typeMatches = ($trType === $triggerType)
                || ($triggerType === 'funnel.optin_submitted' && $trType === 'funnel.form_submitted')
                || ($triggerType === 'funnel.form_submitted' && $trType === 'funnel.optin_submitted')
                || ($triggerType === 'funnel.form_submitted' && $trType === 'form.submitted');

            if (! $typeMatches) {
                continue;
            }

            $cfg = $tr['trigger_config'] ?? [];

            // Funnel ID check
            if (! empty($cfg['funnel_id']) && $cfg['funnel_id'] !== 'all') {
                if ((string) $cfg['funnel_id'] !== (string) ($context['funnel_id'] ?? '')) {
                    continue;
                }
            }

            // Funnel Step ID check
            if (! empty($cfg['funnel_step_id']) && $cfg['funnel_step_id'] !== 'all') {
                if ((string) $cfg['funnel_step_id'] !== (string) ($context['funnel_step_id'] ?? '')) {
                    continue;
                }
            }

            // Variant check ('all', 'A', 'B')
            if (! empty($cfg['variant']) && $cfg['variant'] !== 'all') {
                if (strcasecmp((string) $cfg['variant'], (string) ($context['variant'] ?? 'A')) !== 0) {
                    continue;
                }
            }

            // Order bump filter check
            if (! empty($cfg['order_bump']) && $cfg['order_bump'] !== 'all') {
                $hasBump = ! empty($context['has_order_bump']);
                if (in_array($cfg['order_bump'], ['yes', 'only_bump', 'with_bump'], true) && ! $hasBump) {
                    continue;
                }
                if (in_array($cfg['order_bump'], ['no', 'without_bump', 'no_bump'], true) && $hasBump) {
                    continue;
                }
            }

            // Additional filters array check
            if (! empty($cfg['filters']) && is_array($cfg['filters'])) {
                $filtersPassed = true;
                foreach ($cfg['filters'] as $flt) {
                    $fType = $flt['type'] ?? '';
                    $fVal = (string) ($flt['value'] ?? '');
                    if ($fVal === '' || $fVal === 'all') continue;

                    if ($fType === 'funnel_is' && (string) ($context['funnel_id'] ?? '') !== $fVal) {
                        $filtersPassed = false; break;
                    }
                    if ($fType === 'funnel_step_is' && (string) ($context['funnel_step_id'] ?? '') !== $fVal) {
                        $filtersPassed = false; break;
                    }
                    if ($fType === 'variant_is' && strcasecmp((string) ($context['variant'] ?? 'A'), $fVal) !== 0) {
                        $filtersPassed = false; break;
                    }
                    if ($fType === 'order_bump_is') {
                        $hasBump = ! empty($context['has_order_bump']);
                        if ($fVal === 'yes' && ! $hasBump) { $filtersPassed = false; break; }
                        if ($fVal === 'no' && $hasBump) { $filtersPassed = false; break; }
                    }
                }
                if (! $filtersPassed) {
                    continue;
                }
            }

            return $tr;
        }

        return null;
    }

    private function resolveContentMaxWidth(array $element): string
    {
        $cw = $element['contentWidth'] ?? '';
        if ($cw === 'full' || ($element['containerWidth'] ?? '') === '100%') return '100%';
        if ($cw === 'wide') return '1120px';
        if ($cw === 'medium') return '960px';
        if ($cw === 'small') return '768px';
        if ($cw === 'extra_small') return '540px';
        if ($cw === 'custom' || !empty($element['containerWidth'])) {
            $val = $element['containerWidth'] ?? 1120;
            if ($val === '100%') return '100%';
            return (str_ends_with((string)$val, 'px') || str_ends_with((string)$val, '%') || str_contains((string)$val, 'var(')) ? (string)$val : "{$val}px";
        }
        return '1120px';
    }
}