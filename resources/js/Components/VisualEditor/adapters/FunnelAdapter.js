/**
 * FunnelAdapter.js
 * 
 * Adapter layer connecting Funnel state, steps, and backend API routes
 * with the Unified VisualEditor component.
 * 
 * Standardizes API calls, data contract transformations, pre-flight checks,
 * and page variant management.
 */

import axios from 'axios';
import { renderSectionsHtml } from '../utils/htmlCompiler';
import { deepAssignNewIds } from '../utils/treeUtils';

export class FunnelAdapter {
    /**
     * Standardizes/normalizes canvas_json to ensure guaranteed structure.
     */
    static normalizeCanvas(canvasJson, fallbackMeta = {}) {
        const raw = canvasJson || {};
        return {
            sections: Array.isArray(raw.sections) ? raw.sections : [],
            styleGuide: {
                systemColors: {
                    primary: '#6EC1E4',
                    secondary: '#54595F',
                    text: '#7A7A7A',
                    accent: '#61CE70',
                    ...(raw.styleGuide?.systemColors || {})
                },
                customColors: Array.isArray(raw.styleGuide?.customColors) ? raw.styleGuide.customColors : [],
                defaultFont: raw.styleGuide?.defaultFont || "'Inter', sans-serif",
                fontSize: raw.styleGuide?.fontSize || 17,
                lineHeight: raw.styleGuide?.lineHeight || 25,
                linkColor: raw.styleGuide?.linkColor || '#c87a57',
                textColor: raw.styleGuide?.textColor || '#1f2937',
                bodyAlignment: raw.styleGuide?.bodyAlignment || 'left',
                headingFontType: raw.styleGuide?.headingFontType || 'Google Fonts',
                headingFontName: raw.styleGuide?.headingFontName || "'Lora', serif",
                headingFontStyle: raw.styleGuide?.headingFontStyle || '600',
                headingColor: raw.styleGuide?.headingColor || '#111827',
                headingAlignment: raw.styleGuide?.headingAlignment || 'left',
                containerMaxWidth: raw.styleGuide?.containerMaxWidth || 1200,
                containerPaddingX: raw.styleGuide?.containerPaddingX || 32,
                sectionPaddingY: raw.styleGuide?.sectionPaddingY || 48,
                containerAlignment: raw.styleGuide?.containerAlignment || 'center',
                bgColor: raw.styleGuide?.bgColor || '#ffffff',
                bgImage: raw.styleGuide?.bgImage || '',
                bgBlur: raw.styleGuide?.bgBlur || 0,
                ...(raw.styleGuide || {})
            },
            seoSettings: {
                metaTitle: raw.seoSettings?.metaTitle || fallbackMeta.meta_title || fallbackMeta.name || '',
                metaDescription: raw.seoSettings?.metaDescription || fallbackMeta.meta_description || '',
                ogImage: raw.seoSettings?.ogImage || fallbackMeta.og_image_url || '',
                ...(raw.seoSettings || {})
            },
            customCode: {
                headerCode: raw.customCode?.headerCode || '',
                footerCode: raw.customCode?.footerCode || '',
                ...(raw.customCode || {})
            },
            popups: Array.isArray(raw.popups) ? raw.popups : []
        };
    }

    /**
     * Saves the current funnel page canvas to the backend.
     */
    static async savePage(funnelUuid, pageId, { sections, styleGuide, seoSettings, customCode, popups }) {
        if (!funnelUuid || !pageId) {
            throw new Error('Funnel UUID and Page ID are required to save.');
        }

        const htmlCache = renderSectionsHtml(sections, styleGuide, seoSettings, customCode);

        const payload = {
            canvas_json: {
                sections,
                styleGuide,
                seoSettings,
                customCode,
                popups: popups || []
            },
            html_cache: htmlCache,
            meta_title: seoSettings?.metaTitle || null,
            meta_description: seoSettings?.metaDescription || null,
            og_image_url: seoSettings?.ogImage || null,
        };

        const response = await axios.post(route('client.funnels.pages.save', [funnelUuid, pageId]), payload);
        return response.data;
    }

    /**
     * Publishes the funnel live after optionally saving the active page.
     */
    static async publish(funnelUuid, activePageData = null) {
        if (activePageData?.pageId) {
            await this.savePage(funnelUuid, activePageData.pageId, activePageData);
        }

        const response = await axios.post(route('client.funnels.publish', funnelUuid));
        return response.data;
    }

    /**
     * Add a new funnel step.
     */
    static async addStep(funnelUuid, { name, type }) {
        const response = await axios.post(route('client.funnels.steps.store', funnelUuid), {
            name,
            type: type || 'optin',
        });
        return response.data.step;
    }

    /**
     * Delete an existing funnel step.
     */
    static async deleteStep(funnelUuid, stepId) {
        const response = await axios.delete(route('client.funnels.steps.destroy', [funnelUuid, stepId]));
        return response.data;
    }

    /**
     * Fetch user's saved block templates.
     */
    static async getSavedBlocks() {
        const response = await axios.get(route('client.funnels.sections.index'));
        return response.data.sections || [];
    }

    /**
     * Save a section as a reusable block template.
     */
    static async saveBlock(name, sectionTree) {
        const response = await axios.post(route('client.funnels.sections.store'), {
            name,
            canvas_json: sectionTree,
        });
        return response.data;
    }

    /**
     * Fetch a specific saved block template by ID.
     */
    static async getSavedBlock(blockId) {
        const response = await axios.get(route('client.funnels.sections.show', blockId));
        return response.data;
    }

    /**
     * Clone a page variant tree with fresh unique IDs.
     */
    static cloneVariantTree(sections) {
        return deepAssignNewIds(JSON.parse(JSON.stringify(sections)));
    }

    /**
     * Export complete funnel step JSON schema as a downloadable template.
     */
    static exportTemplateJson(stepData, meta = {}) {
        return JSON.stringify({
            schemaVersion: '2.0.0',
            exportedAt: new Date().toISOString(),
            meta: {
                name: meta.name || 'Exported Funnel Template',
                type: meta.type || 'page',
                author: 'WhatsMine Funnel Builder'
            },
            data: stepData
        }, null, 2);
    }

    /**
     * Import and validate funnel template JSON.
     */
    static importTemplateJson(jsonString) {
        const parsed = JSON.parse(jsonString);
        if (!parsed || (!parsed.data && !parsed.sections)) {
            throw new Error('Invalid template format: missing sections data.');
        }

        const rawData = parsed.data || parsed;
        const normalized = this.normalizeCanvas(rawData);
        // Ensure all imported nodes receive brand new collision-free IDs
        normalized.sections = deepAssignNewIds(normalized.sections);
        return normalized;
    }
}

export default FunnelAdapter;
