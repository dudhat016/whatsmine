<?php

namespace App\Modules\Agency\Services;

use App\Models\Workspace;
use App\Modules\Agency\Models\AgencyContract;
use App\Modules\Agency\Models\AgencyInvoice;
use App\Modules\Agency\Models\AgencyProposal;
use App\Modules\Automation\Models\Automation;
use App\Modules\Automation\Services\AutomationEngine;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\CustomValue;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class DocumentService
{
    public function __construct(
        private readonly ?AutomationEngine $automationEngine = null
    ) {}

    /**
     * Resolve 9-Tier dynamic tokens in document or contract content.
     */
    public function resolveVariables(string $template, Workspace $workspace, ?Contact $contact = null, array $extraContext = []): string
    {
        if (empty($template)) {
            return '';
        }

        $tokens = [];

        // 1. Contact tokens
        if ($contact) {
            $tokens['contact.first_name'] = $contact->first_name ?? '';
            $tokens['contact.last_name'] = $contact->last_name ?? '';
            $tokens['contact.name'] = trim("{$contact->first_name} {$contact->last_name}") ?: ($contact->email ?? 'Client');
            $tokens['contact.email'] = $contact->email ?? '';
            $tokens['contact.phone'] = $contact->phone_e164 ?? $contact->phone ?? '';
            $tokens['contact.company'] = $contact->company_name ?? $contact->organization ?? '';
        } else {
            $tokens['contact.first_name'] = 'Client';
            $tokens['contact.last_name'] = '';
            $tokens['contact.name'] = 'Client';
            $tokens['contact.email'] = '';
            $tokens['contact.phone'] = '';
            $tokens['contact.company'] = '';
        }

        // 2. Account / Workspace tokens
        $tokens['account.name'] = $workspace->name ?? 'Company';
        $tokens['account.email'] = $workspace->email ?? '';
        $tokens['account.phone'] = $workspace->phone ?? '';
        $tokens['account.address'] = $workspace->address ?? '';
        $tokens['account.timezone'] = $workspace->timezone ?? config('app.timezone');

        // 3. Right now timestamps
        $now = Carbon::now($workspace->timezone ?? config('app.timezone'));
        $tokens['right_now.date'] = $now->format('Y-m-d');
        $tokens['right_now.formatted_date'] = $now->format('M d, Y');
        $tokens['right_now.time'] = $now->format('H:i:s');
        $tokens['right_now.year'] = $now->format('Y');

        // 4. Custom Values tokens
        try {
            $customValues = CustomValue::where('workspace_id', $workspace->id)->get();
            foreach ($customValues as $cv) {
                $tokens["custom_values.{$cv->key}"] = $cv->value;
            }
        } catch (\Throwable $e) {
            // Ignore if custom values table is empty or unavailable
        }

        // 5. Extra context (proposal, invoice, contract amounts)
        foreach ($extraContext as $k => $v) {
            if (is_scalar($v)) {
                $tokens[$k] = (string) $v;
            }
        }

        // Replace all {{token}} and {{ token }}
        return preg_replace_callback('/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/', function ($matches) use ($tokens) {
            $key = $matches[1];
            return $tokens[$key] ?? $matches[0];
        }, $template);
    }

    /**
     * Generate SHA-256 Checksum for document & legal contract audit trail.
     */
    public function generateChecksum(string $content, array $metadata = []): string
    {
        return hash('sha256', $content . '|' . json_encode($metadata));
    }

    /**
     * Dispatch event triggers to the Visual Automation Engine.
     */
    public function dispatchTrigger(string $triggerType, int $workspaceId, ?int $contactId, array $context = []): void
    {
        if (!$contactId) {
            return;
        }

        try {
            /** @var AutomationEngine $engine */
            $engine = $this->automationEngine ?? app(AutomationEngine::class);

            $automations = Automation::where('workspace_id', $workspaceId)
                ->where('is_active', true)
                ->where('trigger_type', $triggerType)
                ->get();

            foreach ($automations as $automation) {
                $engine->triggerForContact($automation, $contactId, $context);
            }
        } catch (\Throwable $e) {
            Log::error("Failed to dispatch automation trigger [{$triggerType}]: " . $e->getMessage(), [
                'workspace_id' => $workspaceId,
                'contact_id' => $contactId,
                'context' => $context,
            ]);
        }
    }
}
