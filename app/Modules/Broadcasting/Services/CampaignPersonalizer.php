<?php

namespace App\Modules\Broadcasting\Services;

use App\Modules\Shared\Models\Contact;

/**
 * Substitutes per-recipient variables into campaign content.
 *
 * Supported tokens:
 *  - `{{contact.first_name}}`, `{{contact.last_name}}`, `{{contact.email}}`,
 *    `{{contact.phone_e164}}`, `{{contact.country}}`, `{{contact.language}}`
 *  - `{{contact.name}}` shorthand for full name
 *  - `{{contact.custom.<key>}}` for keys inside `custom_fields`
 *  - `{{context.<key>}}` for runtime extras (e.g. unsubscribe link)
 *
 * Meta-style positional placeholders such as `{{1}}` and `{{2}}` are not
 * substituted directly; instead, the wizard saves the contact-token strings
 * inside `template_ref.components` parameters, and we re-render those.
 */
class CampaignPersonalizer
{
    /** Render a free-form string with `{{contact.*}}` and `{{context.*}}` tokens. */
    public function renderText(string $template, Contact $contact, array $context = []): string
    {
        if ($template === '' || ! str_contains($template, '{{')) {
            return $template;
        }

        // Helper to resolve with optional fallback
        $resolveWithFallback = function (mixed $val, ?string $fallback = null): string {
            $str = trim((string) $val);
            if ($str !== '') {
                return $str;
            }
            if ($fallback === null) {
                return '';
            }
            return trim($fallback, " '\"");
        };

        // {{contact.name | ...}} shorthand — full name
        $template = preg_replace_callback('/\{\{\s*contact\.name(?:\s*\|\s*(?:default:\s*)?([^}]+))?\s*\}\}/', function ($matches) use ($contact, $resolveWithFallback) {
            return $resolveWithFallback($contact->full_name, $matches[1] ?? null);
        }, $template);

        // {{contact.custom.foo | ...}}
        $template = preg_replace_callback('/\{\{\s*contact\.custom\.([a-zA-Z0-9_\-]+)(?:\s*\|\s*(?:default:\s*)?([^}]+))?\s*\}\}/', function ($matches) use ($contact, $resolveWithFallback) {
            $key = $matches[1];
            return $resolveWithFallback($contact->custom_fields[$key] ?? '', $matches[2] ?? null);
        }, $template);

        // {{contact.<field> | ...}}
        $template = preg_replace_callback('/\{\{\s*contact\.([a-zA-Z0-9_]+)(?:\s*\|\s*(?:default:\s*)?([^}]+))?\s*\}\}/', function ($matches) use ($contact, $resolveWithFallback) {
            $field = $matches[1];
            return $resolveWithFallback($contact->{$field} ?? '', $matches[2] ?? null);
        }, $template);

        // {{trigger_links.<slug>}} and {{trigger_link.<slug>}}
        if (str_contains($template, 'trigger_link')) {
            $workspaceId = $context['workspace_id'] ?? $contact->workspace_id ?? null;
            if ($workspaceId) {
                $template = preg_replace_callback('/\{\{\s*trigger_links?\.([a-zA-Z0-9_\-]+)(?:\s*\|\s*(?:default:\s*)?([^}]+))?\s*\}\}/', function ($matches) use ($workspaceId, $contact, $resolveWithFallback) {
                    $slug = $matches[1];
                    $link = \App\Modules\Shared\Models\TriggerLink::where('workspace_id', $workspaceId)
                        ->where(function ($q) use ($slug) {
                            $q->where('slug', $slug)->orWhere('id', $slug);
                        })
                        ->first();

                    if ($link) {
                        $target = url('/l/' . $link->slug);
                        if ($contact->id) {
                            $target .= '?c=' . $contact->id;
                        }
                        return $target;
                    }
                    return $resolveWithFallback('', $matches[2] ?? null);
                }, $template);
            }
        }

        // {{custom_values.<key> | ...}} and {{custom_value.<key> | ...}}
        if (str_contains($template, 'custom_value')) {
            $workspaceId = $context['workspace_id'] ?? $contact->workspace_id ?? null;
            if ($workspaceId) {
                $customValues = \App\Modules\Shared\Models\CustomValue::where('workspace_id', $workspaceId)
                    ->pluck('value', 'key')
                    ->toArray();

                $template = preg_replace_callback('/\{\{\s*custom_values?\.([a-zA-Z0-9_\-]+)(?:\s*\|\s*(?:default:\s*)?([^}]+))?\s*\}\}/', function ($matches) use ($customValues, $resolveWithFallback) {
                    return $resolveWithFallback($customValues[$matches[1]] ?? '', $matches[2] ?? null);
                }, $template);
            }
        }

        // {{right_now.<key>}} and {{current_year}}
        if (str_contains($template, 'right_now') || str_contains($template, 'current_year')) {
            $template = str_replace('{{current_year}}', date('Y'), $template);
            $template = preg_replace_callback('/\{\{\s*right_now\.([a-zA-Z0-9_\-]+)(?:\s*\|\s*(?:default:\s*)?([^}]+))?\s*\}\}/', function ($matches) use ($resolveWithFallback) {
                $val = match (strtolower($matches[1])) {
                    'day' => date('l'),
                    'date' => date('Y-m-d'),
                    'month' => date('F'),
                    'year' => date('Y'),
                    'time' => date('g:i A'),
                    default => date('Y-m-d H:i:s'),
                };
                return $resolveWithFallback($val, $matches[2] ?? null);
            }, $template);
        }

        // {{account.<field> | ...}} or {{workspace.<field> | ...}}
        if (str_contains($template, 'account.') || str_contains($template, 'workspace.')) {
            $workspaceId = $context['workspace_id'] ?? $contact->workspace_id ?? null;
            if ($workspaceId) {
                $workspace = \App\Models\Workspace::find($workspaceId);
                if ($workspace) {
                    $template = preg_replace_callback('/\{\{\s*(account|workspace)\.([a-zA-Z0-9_\-]+)(?:\s*\|\s*(?:default:\s*)?([^}]+))?\s*\}\}/', function ($matches) use ($workspace, $resolveWithFallback) {
                        return $resolveWithFallback($workspace->{$matches[2]} ?? '', $matches[3] ?? null);
                    }, $template);
                }
            }
        }

        // {{user.<field> | ...}}
        if (str_contains($template, 'user.')) {
            $user = $context['user'] ?? null;
            if (! $user && ! empty($context['user_id'])) {
                $user = \App\Models\User::find($context['user_id']);
            }
            if (! $user && ! empty($contact->workspace_id)) {
                $ws = \App\Models\Workspace::find($contact->workspace_id);
                $user = $ws?->owner;
            }
            if ($user) {
                $template = preg_replace_callback('/\{\{\s*user\.([a-zA-Z0-9_\-]+)(?:\s*\|\s*(?:default:\s*)?([^}]+))?\s*\}\}/', function ($matches) use ($user, $resolveWithFallback) {
                    $field = $matches[1];
                    $val = ($field === 'first_name') ? (explode(' ', $user->name)[0] ?? $user->name) : (string) ($user->{$field} ?? '');
                    return $resolveWithFallback($val, $matches[2] ?? null);
                }, $template);
            }
        }

        // {{context.<key> | ...}}
        if (! empty($context)) {
            $template = preg_replace_callback('/\{\{\s*context\.([a-zA-Z0-9_]+)(?:\s*\|\s*(?:default:\s*)?([^}]+))?\s*\}\}/', function ($matches) use ($context, $resolveWithFallback) {
                return $resolveWithFallback($context[$matches[1]] ?? '', $matches[2] ?? null);
            }, $template);
        }

        return $template;
    }

    /**
     * Walk a Meta WhatsApp template `components` array and render any
     * placeholder strings that reference contact fields.
     *
     * Meta shape:
     *  [
     *    [
     *      "type": "header"|"body"|"button",
     *      "sub_type": "url"|"quick_reply" (for buttons),
     *      "index": "0",
     *      "parameters": [
     *        { "type": "text", "text": "Hi {{contact.first_name}}" },
     *        { "type": "image", "image": { "link": "https://..." } },
     *        { "type": "document", "document": { "link": "...", "filename": "..." } },
     *        { "type": "video", "video": { "link": "..." } },
     *        { "type": "currency", "currency": { "code": "USD", "amount_1000": 12000, "fallback_value": "$12.00" } },
     *        { "type": "date_time", "date_time": { "fallback_value": "Feb 25" } },
     *      ]
     *    ]
     *  ]
     */
    public function renderTemplateComponents(array $components, Contact $contact, array $context = []): array
    {
        return array_map(function ($component) use ($contact, $context) {
            if (! is_array($component) || ! isset($component['parameters']) || ! is_array($component['parameters'])) {
                return $component;
            }

            $component['parameters'] = array_map(
                fn ($param) => $this->renderParameter($param, $contact, $context),
                $component['parameters'],
            );

            return $component;
        }, $components);
    }

    private function renderParameter(mixed $param, Contact $contact, array $context): mixed
    {
        if (! is_array($param)) {
            return $param;
        }

        // Plain text parameter
        if (isset($param['text']) && is_string($param['text'])) {
            $param['text'] = $this->renderText($param['text'], $contact, $context);
        }

        // Media link parameters: image / video / document
        foreach (['image', 'video', 'document'] as $mediaKey) {
            if (isset($param[$mediaKey]) && is_array($param[$mediaKey])) {
                if (isset($param[$mediaKey]['link']) && is_string($param[$mediaKey]['link'])) {
                    $param[$mediaKey]['link'] = $this->renderText($param[$mediaKey]['link'], $contact, $context);
                }
                if (isset($param[$mediaKey]['filename']) && is_string($param[$mediaKey]['filename'])) {
                    $param[$mediaKey]['filename'] = $this->renderText($param[$mediaKey]['filename'], $contact, $context);
                }
            }
        }

        // Currency / date_time fallback strings can also carry tokens
        foreach (['currency', 'date_time'] as $structuredKey) {
            if (isset($param[$structuredKey]['fallback_value']) && is_string($param[$structuredKey]['fallback_value'])) {
                $param[$structuredKey]['fallback_value'] = $this->renderText($param[$structuredKey]['fallback_value'], $contact, $context);
            }
        }

        return $param;
    }

    /**
     * Available contact token keys for the UI variable picker.
     *
     * @return array<int, array{key: string, label: string}>
     */
    public static function availableContactTokens(): array
    {
        return [
            ['key' => '{{contact.first_name}}', 'label' => 'First name'],
            ['key' => '{{contact.last_name}}', 'label' => 'Last name'],
            ['key' => '{{contact.name}}', 'label' => 'Full name'],
            ['key' => '{{contact.email}}', 'label' => 'Email'],
            ['key' => '{{contact.phone_e164}}', 'label' => 'Phone (E.164)'],
            ['key' => '{{contact.country}}', 'label' => 'Country'],
            ['key' => '{{contact.language}}', 'label' => 'Language'],
        ];
    }
}
