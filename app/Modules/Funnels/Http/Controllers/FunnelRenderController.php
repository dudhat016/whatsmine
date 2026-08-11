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
    public function show(Request $request, string $workspaceSlug, string $funnelSlug): Response
    {
        // â”€â”€ 1. Resolve workspace by ID, slug, or fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $workspace = is_numeric($workspaceSlug)
            ? Workspace::find((int) $workspaceSlug)
            : Workspace::where('id', $workspaceSlug)->first();

        if (! $workspace) {
            $workspace = Workspace::first();
        }

        // â”€â”€ 2. Resolve funnel by workspace, slug, or UUID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $funnel = Funnel::where('workspace_id', $workspace->id)
            ->where(function ($q) use ($funnelSlug) {
                $q->where('slug', $funnelSlug)
                  ->orWhere('uuid', $funnelSlug)
                  ->orWhere('id', $funnelSlug);
            })
            ->with(['steps' => fn ($q) => $q->orderBy('sort_order'), 'steps.pages'])
            ->first();

        if (! $funnel) {
            $funnel = Funnel::where('slug', $funnelSlug)
                ->orWhere('uuid', $funnelSlug)
                ->orWhere('id', $funnelSlug)
                ->with(['steps' => fn ($q) => $q->orderBy('sort_order'), 'steps.pages'])
                ->firstOrFail();
        }

        // â”€â”€ 3. Handle affiliate ref_code cookie (30-day attribution) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

        // â”€â”€ 4. Get first step and resolve A/B variant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        $firstStep = $funnel->steps->first();
        abort_unless($firstStep, 404);

        $pages = $firstStep->pages;
        $controlPage = $pages->where('is_control', true)->first();

        $variantCookieKey = "funnel_{$funnel->id}_step_{$firstStep->id}_variant";
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
        $firstStep->increment('views_count');
        $page->increment('views_count');

        // ── 6. Dynamically compile canvas_json to full HTML ───────────────────
        $html = $this->compileCanvasToHtml($page->canvas_json ?? [], $page, $funnel);

        // Cache full compiled HTML back onto page record
        if (! empty($page->canvas_json)) {
            $page->update([
                'html_cache'        => $html,
                'cache_compiled_at' => now(),
            ]);
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
        $sections   = $canvasJson['sections']   ?? [];
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
        $cssRules[] = "p { margin:var(--brand-body-margin-top) var(--brand-body-margin-right) var(--brand-body-margin-bottom) var(--brand-body-margin-left); padding:var(--brand-body-padding-top) var(--brand-body-padding-right) var(--brand-body-padding-bottom) var(--brand-body-padding-left); font-family:var(--brand-body-font-family); font-size:var(--brand-body-font-size); font-weight:var(--brand-body-font-weight); line-height:var(--brand-body-line-height); color:var(--brand-body-color); }";
        $cssRules[] = ".funnel-container { width:100%; margin:0 auto; padding:0; }";
        $cssRules[] = "section { width:100%; max-width:var(--brand-container-width); padding-top:var(--brand-container-padding-top); padding-right:var(--brand-container-padding-right); padding-bottom:var(--brand-container-padding-bottom); padding-left:var(--brand-container-padding-left); margin-top:var(--brand-container-margin-top); margin-right:auto; margin-bottom:var(--brand-container-margin-bottom); margin-left:auto; }";
        $cssRules[] = ".funnel-row { display:grid; row-gap:var(--brand-element-gap-y); column-gap:var(--brand-element-gap-x); width:100%; }";
        $cssRules[] = ".funnel-flex-container { display:flex; gap:var(--brand-element-gap-y) var(--brand-element-gap-x); }";
        $cssRules[] = ".funnel-row-grid_container { grid-template-columns:repeat(2, minmax(0, 1fr)); }";
        $cssRules[] = ".funnel-row-col_1 { grid-template-columns:1fr; }";
        $cssRules[] = ".funnel-row-col_2 { grid-template-columns:repeat(2, minmax(0, 1fr)); }";
        $cssRules[] = ".funnel-row-col_3 { grid-template-columns:repeat(3, minmax(0, 1fr)); }";
        $cssRules[] = ".funnel-row-col_4 { grid-template-columns:repeat(4, minmax(0, 1fr)); }";
        $cssRules[] = ".funnel-row-col_sidebar { grid-template-columns:minmax(0, 7fr) minmax(0, 3fr); }";
        $cssRules[] = ".funnel-col { width:100%; min-width:0; padding:var(--brand-col-padding-top, 0) var(--brand-col-padding-right, 0) var(--brand-col-padding-bottom, 0) var(--brand-col-padding-left, 0); margin:var(--brand-col-margin-top, 0) var(--brand-col-margin-right, 0) var(--brand-col-margin-bottom, 0) var(--brand-col-margin-left, 0); }";
        $cssRules[] = ".funnel-bullets { list-style:none; padding:0; margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }";
        $cssRules[] = ".funnel-bullets li { margin-bottom:var(--brand-bullet-gap, 8px); display:flex; align-items:center; gap:var(--brand-bullet-gap, 8px); font-weight:var(--brand-body-font-weight, 500); color:var(--brand-body-color); }";
        $cssRules[] = ".funnel-bullets li::before { content:'✓'; color:var(--brand-bullet-icon-color, var(--color-primary, #16a34a)); font-weight:700; margin-right:4px; }";
        $cssRules[] = ".funnel-quote { padding:var(--brand-quote-padding-top, 16px) var(--brand-quote-padding-right, 20px) var(--brand-quote-padding-bottom, 16px) var(--brand-quote-padding-left, 20px); border-left:var(--brand-quote-border-width, 4px) solid var(--brand-quote-border-color, var(--color-primary, #6EC1E4)); background:var(--brand-quote-bg-color, rgba(99,102,241,0.06)); margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); border-radius:var(--brand-quote-border-radius, 0 8px 8px 0); }";
        $cssRules[] = ".funnel-quote p { font-style:var(--brand-quote-font-style, italic); font-weight:var(--brand-quote-font-weight, 400); margin:0 0 8px 0; color:var(--brand-quote-text-color, var(--brand-body-color)); }";
        $cssRules[] = ".funnel-quote cite { font-weight:var(--brand-quote-cite-weight, 700); font-style:var(--brand-quote-cite-style, normal); color:var(--brand-quote-border-color, var(--color-primary, #6EC1E4)); }";
        $cssRules[] = ".funnel-image-wrap { margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }";
        $cssRules[] = ".funnel-image-wrap img { display:block; width:100%; height:auto; border-radius:var(--brand-img-border-radius, 8px); box-shadow:var(--brand-img-shadow, 0 4px 12px rgba(0,0,0,0.1)); transition:transform 0.3s ease; }";
        $cssRules[] = ".funnel-image-wrap img:hover { transform:scale(1.02); }";
        $cssRules[] = ".funnel-video-wrap { position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:var(--brand-video-border-radius, 12px); box-shadow:var(--brand-video-shadow, 0 10px 25px rgba(0,0,0,0.2)); margin:var(--brand-body-margin-top, 0) var(--brand-body-margin-right, 0) var(--brand-body-margin-bottom, 16px) var(--brand-body-margin-left, 0); }";
        $cssRules[] = ".funnel-video-wrap iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:0; }";
        $cssRules[] = ".funnel-btn-wrap { margin:0 0 16px 0; }";
        $cssRules[] = ".funnel-btn-wrap button { width:100%; margin:var(--brand-btn-margin-top, 0) var(--brand-btn-margin-right, 0) var(--brand-btn-margin-bottom, 16px) var(--brand-btn-margin-left, 0); padding:var(--brand-btn-padding-top, 14px) var(--brand-btn-padding-right, 28px) var(--brand-btn-padding-bottom, 14px) var(--brand-btn-padding-left, 28px); font-family:var(--brand-btn-font-family); font-size:var(--brand-btn-font-size); font-weight:var(--brand-btn-font-weight); cursor:pointer; border:none; border-radius:var(--brand-btn-border-radius); background:var(--brand-btn-bg-color); color:var(--brand-btn-text-color); transition:all 0.2s ease; }";
        $cssRules[] = ".funnel-btn-wrap button:hover { background:var(--brand-btn-hover-bg-color); color:var(--brand-btn-hover-text-color); filter:brightness(1.05); transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.15); }";
        $cssRules[] = ".funnel-input-wrap { margin:0 0 12px 0; }";
        $cssRules[] = ".funnel-input-wrap input { width:100%; margin:var(--brand-field-margin-top, 0) var(--brand-field-margin-right, 0) var(--brand-field-margin-bottom, 12px) var(--brand-field-margin-left, 0); padding:var(--brand-field-padding-top, 12px) var(--brand-field-padding-right, 16px) var(--brand-field-padding-bottom, 12px) var(--brand-field-padding-left, 16px); font-family:var(--brand-field-font-family); font-size:var(--brand-field-font-size); background:var(--brand-field-bg-color); color:var(--brand-field-text-color); border:1px solid var(--brand-field-border-color); border-radius:var(--brand-field-border-radius); outline:none; transition:border-color 0.2s; }";
        $cssRules[] = ".funnel-input-wrap input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px var(--color-primary)22; }";
        $cssRules[] = ".funnel-divider { border:none; border-top:var(--brand-divider-width, 1px) var(--brand-divider-style, solid) var(--brand-divider-color, #e5e7eb); margin:var(--brand-divider-margin-top, 24px) 0 var(--brand-divider-margin-bottom, 24px) 0; }";
        $cssRules[] = ".funnel-spacer { height:var(--brand-spacer-height, 40px); }";
        $cssRules[] = ".funnel-timer { padding:var(--brand-timer-padding, 16px); background:var(--brand-timer-bg-color, #fef2f2); border:1px solid var(--brand-timer-border-color, #fca5a5); border-radius:var(--brand-timer-border-radius, 12px); text-align:center; font-weight:var(--brand-timer-font-weight, 700); color:var(--brand-timer-text-color, #dc2626); font-family:monospace; font-size:var(--brand-timer-font-size, 24px); margin:0 0 16px 0; letter-spacing:2px; }";
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
</body>
</html>
HTML;
    }

    private function sanitizeElementForBrandInheritance(array $item): array
    {
        if (empty($item)) return $item;
        $clean = $item;

        if (empty($clean['isLocallyOverridden'])) {
            $textProps = ['fontSize', 'lineHeight', 'fontWeight', 'textColor', 'fontFamily', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingY', 'paddingX'];
            $inputProps = ['paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius', 'fontSize', 'fontFamily', 'bgColor', 'textColor', 'borderColor', 'marginBottom', 'marginTop', 'marginRight', 'marginLeft'];
            $btnProps = ['bgColor', 'textColor', 'fontSize', 'fontWeight', 'fontFamily', 'borderRadius', 'paddingY', 'paddingX', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginBottom', 'marginTop', 'marginRight', 'marginLeft'];
            $containerProps = ['containerWidth', 'gap', 'gapX', 'gapY', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems'];

            $propsToCleanMap = [
                'headline' => $textProps,
                'subheadline' => $textProps,
                'paragraph' => $textProps,
                'bullets' => $textProps,
                'quote' => $textProps,
                'input_email' => $inputProps,
                'input_name' => $inputProps,
                'input_phone' => $inputProps,
                'submit_button' => $btnProps,
                'section' => $containerProps,
                'flex_container' => $containerProps,
                'grid_container' => $containerProps,
                'col_1' => $containerProps,
                'col_2' => $containerProps,
                'col_3' => $containerProps,
                'col_4' => $containerProps,
                'col_sidebar' => $containerProps,
            ];

            $type = $clean['type'] ?? '';
            if (isset($propsToCleanMap[$type])) {
                foreach ($propsToCleanMap[$type] as $p) {
                    unset($clean[$p]);
                }
            }
        }

        return $clean;
    }

    private function collectElementCss(array $rawItem, array &$cssRules, array &$tabletRules, array &$mobileRules): void
    {
        if (empty($rawItem) || empty($rawItem['id'])) return;
        $item  = $this->sanitizeElementForBrandInheritance($rawItem);
        $rawId = $item['id'];
        $id    = 'el-' . preg_replace('/[^a-zA-Z0-9\-_]/', '-', $rawId);

        $buildDeviceRules = function(array $dObj) use ($item): array {
            $r = [];
            if (!empty($dObj['containerWidth'])) {
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
            // Layout Engine: Flexbox vs Grid vs Block
            if (isset($dObj['width'])) {
                $wUnit = $dObj['widthUnit'] ?? '%';
                $r[] = "width:{$dObj['width']}{$wUnit}";
            }
            if (isset($dObj['minHeight']) && $dObj['minHeight'] !== '') {
                $mhUnit = $dObj['minHeightUnit'] ?? 'px';
                $r[] = "min-height:{$dObj['minHeight']}{$mhUnit}";
            }

            if (($dObj['layoutMode'] ?? '') === 'grid') {
                $r[] = 'display:grid';
                if (isset($dObj['gridColumns'])) {
                    $rawUnit = $dObj['gridColumnsUnit'] ?? '1fr';
                    $unit = $rawUnit === 'fr' ? '1fr' : $rawUnit;
                    $gc = is_numeric($dObj['gridColumns']) ? "repeat({$dObj['gridColumns']}, {$unit})" : $dObj['gridColumns'];
                    $r[] = "grid-template-columns:{$gc}";
                } else {
                    $gridPreset = $dObj['gridPreset'] ?? 'repeat(2, 1fr)';
                    $cols = ($gridPreset === 'custom') ? ($dObj['gridTemplateColumns'] ?? 'repeat(2, 1fr)') : $gridPreset;
                    $r[] = "grid-template-columns:{$cols}";
                }
                if (isset($dObj['gridRows'])) {
                    $rawRowUnit = $dObj['gridRowsUnit'] ?? '1fr';
                    $rowUnit = $rawRowUnit === 'fr' ? '1fr' : $rawRowUnit;
                    $gr = is_numeric($dObj['gridRows']) ? "repeat({$dObj['gridRows']}, {$rowUnit})" : $dObj['gridRows'];
                    $r[] = "grid-template-rows:{$gr}";
                }
                if (!empty($dObj['justifyItems'])) { $r[] = "justify-items:{$dObj['justifyItems']}"; }
                if (!empty($dObj['gridAutoFlow'])) { $r[] = "grid-auto-flow:{$dObj['gridAutoFlow']}"; }
            } elseif (($dObj['layoutMode'] ?? '') === 'block') {
                $r[] = 'display:block';
            } elseif (($dObj['layoutMode'] ?? '') === 'flex' || !empty($dObj['flexDirection'])) {
                $r[] = 'display:flex';
                if (!empty($dObj['flexDirection']))  { $r[] = "flex-direction:{$dObj['flexDirection']}"; }
                if (!empty($dObj['justifyContent'])) { $r[] = "justify-content:{$dObj['justifyContent']}"; }
                if (!empty($dObj['flexWrap']))       { $r[] = "flex-wrap:{$dObj['flexWrap']}"; }
            }

            if (!empty($dObj['alignItems']))     { $r[] = "align-items:{$dObj['alignItems']}"; }
            $gapUnit = $dObj['gapUnit'] ?? 'px';
            if (isset($dObj['gapX']) || isset($dObj['gapY'])) {
                $gY = $dObj['gapY'] ?? ($dObj['gap'] ?? 0);
                $gX = $dObj['gapX'] ?? ($dObj['gap'] ?? 0);
                $r[] = "gap:{$gY}{$gapUnit} {$gX}{$gapUnit}";
            } elseif (isset($dObj['gap'])) {
                $r[] = "gap:{$dObj['gap']}{$gapUnit}";
            }
            if (isset($dObj['flexGrow']))        { $r[] = "flex-grow:{$dObj['flexGrow']}"; }
            if (!empty($dObj['alignSelf']))      { $r[] = "align-self:{$dObj['alignSelf']}"; }
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
                        $propName = trim(substr($trimmed, 0, $colonIdx));
                        $propVal  = trim(substr($trimmed, $colonIdx + 1));
                        $map[$propName] = $propVal;
                    }
                }
            }
            $out = [];
            foreach ($map as $k => $v) {
                $out[] = "{$k}:{$v}";
            }
            return $out;
        };

        $rules = [];

        if (($item['type'] ?? '') === 'section' && !empty($item['containerWidth'])) {
            $mw = ($item['containerWidth'] === '100%' || str_ends_with((string)$item['containerWidth'], '%')) ? '100%' : "{$item['containerWidth']}px";
            $rules[] = "max-width:{$mw}; margin-left:auto; margin-right:auto";
        }
        if (isset($item['paddingY']))     { $rules[] = "padding-top:{$item['paddingY']}px; padding-bottom:{$item['paddingY']}px"; }
        if (isset($item['paddingX']))     { $rules[] = "padding-left:{$item['paddingX']}px; padding-right:{$item['paddingX']}px"; }
        if (isset($item['marginTop']))    { $rules[] = "margin-top:{$item['marginTop']}px"; }
        if (isset($item['marginBottom'])) { $rules[] = "margin-bottom:{$item['marginBottom']}px"; }
        if (!empty($item['fontSize']))     { $rules[] = "font-size:{$item['fontSize']}px"; }
        if (!empty($item['lineHeight']))   { $rules[] = "line-height:{$item['lineHeight']}px"; }
        if (!empty($item['fontFamily']))   { $rules[] = "font-family:{$item['fontFamily']}"; }
        if (!empty($item['fontWeight']))   { $rules[] = "font-weight:{$item['fontWeight']}"; }
        if (isset($item['letterSpacing'])){ $rules[] = "letter-spacing:{$item['letterSpacing']}px"; }
        if (!empty($item['textColor']))    { $rules[] = "color:{$item['textColor']}"; }
        if (!empty($item['bgColor']))      { $rules[] = "background-color:{$item['bgColor']}"; }
        elseif (!empty($item['textBgColor'])) { $rules[] = "background-color:{$item['textBgColor']}"; }
        if (isset($item['borderRadius'])) { $rules[] = "border-radius:{$item['borderRadius']}px"; }
        if (!empty($item['alignment']))    { $rules[] = "text-align:{$item['alignment']}"; }

        if (isset($item['borderStyle'])) {
            if ($item['borderStyle'] === 'full')   $rules[] = 'border:1px solid #d1d5db';
            elseif ($item['borderStyle'] === 'dashed') $rules[] = 'border:2px dashed #94a3b8';
            elseif ($item['borderStyle'] === 'bottom') $rules[] = 'border-bottom:2px solid #d1d5db';
        }
        if (isset($item['shadow'])) {
            if ($item['shadow'] === 'sm')   $rules[] = 'box-shadow:0 1px 3px rgba(0,0,0,0.1)';
            elseif ($item['shadow'] === 'md')   $rules[] = 'box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)';
            elseif ($item['shadow'] === 'lg')   $rules[] = 'box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)';
            elseif ($item['shadow'] === 'glow') $rules[] = 'box-shadow:0 0 15px rgba(200,122,87,0.5)';
        }

        // Include Desktop layout engine rules (Flexbox vs Grid, gap, align-items, etc.)
        $rules = array_merge($rules, $buildDeviceRules($item));

        $transMs = $item['transitionDuration'] ?? 300;
        $rules[] = "transition:all {$transMs}ms ease";

        $dedupedBase = $deduplicateRules($rules);
        if (!empty($dedupedBase)) {
            $cssRules[] = "#{$id} { " . implode('; ', $dedupedBase) . "; }";
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
            $mobileList[] = 'display:none !important';
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
            $hoverBg = !empty($item['hoverBgColor']) ? "background-color:{$item['hoverBgColor']} !important;" : '';
            $hoverText = !empty($item['hoverTextColor']) ? "color:{$item['hoverTextColor']} !important;" : '';
            $trY = isset($item['hoverTransformY']) ? (int)$item['hoverTransformY'] : -2;
            $trX = isset($item['hoverTransformX']) ? (int)$item['hoverTransformX'] : 0;
            $cssRules[] = "#{$id}:hover { {$hoverBg} {$hoverText} transform: translate({$trX}px, {$trY}px); box-shadow: 0 8px 22px rgba(0,0,0,0.2); }";
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
            $inner = implode('', array_map(fn($el) => $this->renderItemScoped($el), $item['elements'] ?? []));
            return "<section id=\"{$id}\">{$inner}</section>";
        }

        if ($type === 'flex_container') {
            $inner = implode('', array_map(fn($el) => $this->renderItemScoped($el), $item['elements'] ?? []));
            return "<div id=\"{$id}\" class=\"funnel-flex-container\">{$inner}</div>";
        }

        if (in_array($type, ['grid_container', 'col_1', 'col_2', 'col_3', 'col_4', 'col_sidebar'])) {
            $colsCount = $item['colsCount'] ?? ($item['gridColumns'] ?? 2);
            $colsHtml  = '';
            for ($cIdx = 0; $cIdx < $colsCount; $cIdx++) {
                $colContent = implode('', array_map(fn($c) => $this->renderItemScoped($c), $item['columns'][$cIdx] ?? []));
                $colsHtml  .= "<div class=\"funnel-col\">{$colContent}</div>";
            }
            return "<div id=\"{$id}\" class=\"funnel-row funnel-row-{$type}\">{$colsHtml}</div>";
        }

        if (in_array($type, ['headline', 'subheadline'])) {
            $tag = $item['headingTag'] ?? ($type === 'headline' ? 'h1' : 'h2');
            $tag = in_array(strtolower($tag), ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) ? strtolower($tag) : 'h2';
            return "<{$tag} id=\"{$id}\">" . e($item['content'] ?? '') . "</{$tag}>";
        }
        if ($type === 'paragraph')   return "<p id=\"{$id}\">"  . e($item['content'] ?? '') . "</p>";

        if ($type === 'bullets') {
            $lis = implode('', array_map(fn($b) => "<li>" . e($b) . "</li>", $item['items'] ?? []));
            return "<ul id=\"{$id}\" class=\"funnel-bullets\">{$lis}</ul>";
        }

        if ($type === 'quote') {
            $quote  = e($item['quote'] ?? $item['content'] ?? '');
            $author = e($item['author'] ?? 'Author');
            return "<blockquote id=\"{$id}\" class=\"funnel-quote\"><p>\"{$quote}\"</p><cite>&mdash; {$author}</cite></blockquote>";
        }

        if ($type === 'image') {
            $url  = e($item['url'] ?? '');
            $alt  = e($item['alt'] ?? '');
            $maxW = isset($item['maxWidth']) ? "style=\"max-width:{$item['maxWidth']}%\"" : '';
            return "<div id=\"{$id}\" class=\"funnel-image-wrap\"><img src=\"{$url}\" alt=\"{$alt}\" {$maxW} /></div>";
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

            if ($iconChar !== '') {
                $btnLabel = ($iconPos === 'left') ? "{$iconChar} {$textRaw}" : "{$textRaw} {$iconChar}";
            } else {
                $btnLabel = "{$textRaw} →";
            }

            $btnType = $item['btnType'] ?? 'submit';
            $targetUrl = e($item['targetUrl'] ?? '#');
            $typeAttr = ($btnType === 'url') ? "onclick=\"window.location.href='{$targetUrl}'\"" : "type=\"button\"";

            return "<div class=\"funnel-btn-wrap\"><button id=\"{$id}\" {$typeAttr}>{$btnLabel}</button></div>";
        }

        if ($type === 'input_email') {
            $ph = e($item['placeholder'] ?? 'Enter your email...');
            return "<div class=\"funnel-input-wrap\"><input type=\"email\" id=\"{$id}\" placeholder=\"{$ph}\" /></div>";
        }

        if ($type === 'input_name') {
            $ph = e($item['placeholder'] ?? 'Enter your name...');
            return "<div class=\"funnel-input-wrap\"><input type=\"text\" id=\"{$id}\" placeholder=\"{$ph}\" /></div>";
        }

        if ($type === 'input_phone') {
            $ph = e($item['placeholder'] ?? 'Enter phone...');
            return "<div class=\"funnel-input-wrap\"><input type=\"tel\" id=\"{$id}\" placeholder=\"{$ph}\" /></div>";
        }

        if ($type === 'checkbox') {
            $txt = e($item['text'] ?? '');
            return "<div class=\"funnel-input-wrap\"><label style=\"display:flex;align-items:center;gap:8px;\"><input type=\"checkbox\" id=\"{$id}\" /> <span>{$txt}</span></label></div>";
        }

        if ($type === 'audio') {
            $title = e($item['title'] ?? 'Listen to Audio');
            return "<div id=\"{$id}\" class=\"funnel-input-wrap\" style=\"padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;display:flex;align-items:center;gap:12px;\"><span style=\"font-size:20px;\">🎧</span><span style=\"font-weight:600;\">{$title}</span></div>";
        }

        if ($type === 'icon_box') {
            $title = e($item['title'] ?? 'Feature Title');
            $desc  = e($item['desc'] ?? 'Feature description...');
            return "<div id=\"{$id}\" style=\"padding:20px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.05);\"><h4 style=\"margin:0 0 8px 0;font-size:18px;\">⚡ {$title}</h4><p style=\"margin:0;font-size:14px;color:var(--brand-color-text);\">{$desc}</p></div>";
        }

        if ($type === 'progress_bar') {
            $pct = (int) ($item['percent'] ?? 80);
            return "<div id=\"{$id}\" style=\"width:100%;background:#e5e7eb;border-radius:999px;height:12px;overflow:hidden;margin:16px 0;\"><div style=\"width:{$pct}%;background:var(--brand-color-primary);height:100%;border-radius:999px;transition:width 0.5s;\"></div></div>";
        }

        if ($type === 'social') {
            return "<div id=\"{$id}\" style=\"display:flex;gap:12px;margin:16px 0;\"><button style=\"padding:8px 16px;background:#1877f2;color:#fff;border:none;border-radius:6px;font-weight:600;\">Share on Facebook</button><button style=\"padding:8px 16px;background:#1da1f2;color:#fff;border:none;border-radius:6px;font-weight:600;\">Share on Twitter</button></div>";
        }

        if ($type === 'divider') return "<hr id=\"{$id}\" class=\"funnel-divider\" />";
        if ($type === 'spacer')  return "<div id=\"{$id}\" class=\"funnel-spacer\"></div>";

        if ($type === 'timer') {
            $h = $item['hours']   ?? 2;
            $m = str_pad($item['minutes'] ?? 15, 2, '0', STR_PAD_LEFT);
            return "<div id=\"{$id}\" class=\"funnel-timer\">⏱ 0{$h}:{$m}:45</div>";
        }

        return '';
    }
}