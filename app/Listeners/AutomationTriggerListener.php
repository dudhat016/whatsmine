<?php

namespace App\Listeners;

use App\Events\AutomationWebhookReceived;
use App\Events\CampaignCompleted;
use App\Events\CommerceEventReceived;
use App\Events\ContactCreated;
use App\Events\MessageReceived;
use App\Modules\Automation\Jobs\ExecuteAutomationRunJob;
use App\Modules\Automation\Models\Automation;
use App\Modules\Automation\Models\AutomationRun;
use App\Modules\Automation\Services\AutomationEngine;
use App\Modules\Shared\Models\Contact;

class AutomationTriggerListener
{
    public function __construct(private readonly AutomationEngine $engine) {}

    public function handleMessageReceived(MessageReceived $event): void
    {
        $contactId = $event->message->conversation?->contact_id;
        $workspaceId = $event->message->conversation?->workspace_id;
        if (! $contactId || ! $workspaceId) {
            return;
        }

        $messageBody = $event->message->body ?? '';
        $channel = $event->message->channel ?? 'whatsapp';

        // Resume any runs parked on an "Ask question" node awaiting this contact's reply.
        $this->engine->resumeAwaitingReplies($workspaceId, $contactId, $messageBody);

        // Stop waiting runs for workflows with stop_on_response safeguard
        $this->engine->handleCustomerReplyStopDrip($workspaceId, $contactId);

        $this->fireWithConfig('message.received', $workspaceId, $contactId, [
            'message_id' => $event->message->id,
            'message_channel' => $channel,
            'message_body' => $messageBody,
        ], $messageBody, $channel);

        // Fire 'customer.replied' trigger
        $this->fireWithConfig('customer.replied', $workspaceId, $contactId, [
            'message_id' => $event->message->id,
            'message_channel' => $channel,
            'message_body' => $messageBody,
            'customer_reply' => $messageBody,
        ], $messageBody, $channel);
    }

    /**
     * Extract all trigger definitions from an automation (delegated to AutomationEngine).
     */
    private function getAutomationTriggers(Automation $automation): array
    {
        return $this->engine->getAutomationTriggers($automation);
    }

    public function handleContactCreated(ContactCreated $event): void
    {
        $workspaceId = (int) $event->contact->workspace_id;
        $contactId = (int) $event->contact->id;

        $automations = Automation::where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->get();

        foreach ($automations as $automation) {
            foreach ($this->getAutomationTriggers($automation) as $tr) {
                if ($tr['trigger_type'] !== 'contact.created') {
                    continue;
                }
                $requiredSource = $tr['trigger_config']['source'] ?? null;
                if ($requiredSource && strtolower((string) $event->contact->source) !== strtolower((string) $requiredSource)) {
                    continue;
                }

                $this->engine->triggerForContact($automation, $contactId, [
                    'source' => $event->contact->source,
                    'trigger_name' => $tr['trigger_name'],
                    'trigger_type' => $tr['trigger_type'],
                    '_matched_trigger_id' => $tr['id'],
                ]);
                break; // Triggered once for this automation
            }
        }
    }

    public function handleTagAdded(int $workspaceId, int $contactId, string $tagName): void
    {
        $automations = Automation::where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->get();

        foreach ($automations as $automation) {
            foreach ($this->getAutomationTriggers($automation) as $tr) {
                if ($tr['trigger_type'] !== 'contact.tag_added') {
                    continue;
                }
                $requiredTag = $tr['trigger_config']['tag_name'] ?? null;
                if ($requiredTag && strtolower(trim((string) $tagName)) !== strtolower(trim((string) $requiredTag))) {
                    continue;
                }

                $this->engine->triggerForContact($automation, $contactId, [
                    'tag' => $tagName,
                    'trigger_name' => $tr['trigger_name'],
                    'trigger_type' => $tr['trigger_type'],
                    '_matched_trigger_id' => $tr['id'],
                ]);
                break;
            }
        }
    }

    public function handleSubscriptionFormSubmitted(\App\Modules\Funnels\Events\SubscriptionFormSubmitted $event): void
    {
        $workspaceId = (int) $event->form->workspace_id;
        $contactId = (int) $event->contact->id;

        $automations = Automation::where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->get();

        foreach ($automations as $automation) {
            foreach ($this->getAutomationTriggers($automation) as $tr) {
                if ($tr['trigger_type'] !== 'form.submitted') {
                    continue;
                }
                $selectedSlug = $tr['trigger_config']['form_slug'] ?? null;
                $selectedId = $tr['trigger_config']['form_id'] ?? null;

                if ($selectedSlug && $selectedSlug !== $event->form->slug) {
                    continue;
                }
                if ($selectedId && (int) $selectedId !== (int) $event->form->id) {
                    continue;
                }

                $context = [
                    'form_id' => $event->form->id,
                    'form_name' => $event->form->name,
                    'form_slug' => $event->form->slug,
                    'submitted_data' => $event->submittedData,
                    'trigger_name' => $tr['trigger_name'],
                    'trigger_type' => $tr['trigger_type'],
                    '_matched_trigger_id' => $tr['id'],
                ];

                $this->engine->triggerForContact($automation, $contactId, $context);
                break;
            }
        }
    }

    public function handleCampaignCompleted(CampaignCompleted $event): void
    {
        // No per-contact trigger for campaign completion; skip.
    }

    public function handleCommerceEvent(CommerceEventReceived $event): void
    {
        $automations = Automation::where('workspace_id', $event->workspaceId)
            ->where('status', 'active')
            ->get();

        foreach ($automations as $automation) {
            foreach ($this->getAutomationTriggers($automation) as $tr) {
                if ($tr['trigger_type'] !== $event->eventType) {
                    continue;
                }
                $requiredStoreId = $tr['trigger_config']['store_id'] ?? null;
                $eventStoreId = $event->context['store_id'] ?? null;

                if ($requiredStoreId && (int) $requiredStoreId !== (int) $eventStoreId) {
                    continue;
                }

                $this->engine->triggerForContact($automation, $event->contactId, array_merge($event->context, [
                    '_matched_trigger_id' => $tr['id'],
                    'trigger_name' => $tr['trigger_name'],
                    'trigger_type' => $tr['trigger_type'],
                ]));
                break;
            }
        }
    }

    public function handleAutomationWebhookReceived(AutomationWebhookReceived $event): void
    {
        $automation = Automation::where('id', $event->automationId)
            ->where('status', 'active')
            ->where('trigger_type', 'webhook')
            ->first();

        if (! $automation) {
            return;
        }

        $context = [
            'payload' => $event->payload,
            'trigger_name' => 'Webhook Received',
            'trigger_type' => 'webhook.received',
        ];

        if ($event->contactId) {
            $this->engine->triggerForContact($automation, $event->contactId, $context);
        } else {
            // Contactless: trigger a run without a contact (contact_id = null)
            $this->triggerWithoutContact($automation, $context);
        }
    }

    private function triggerWithoutContact(Automation $automation, array $context = []): void
    {
        $run = AutomationRun::create([
            'automation_id' => $automation->id,
            'contact_id' => null,
            'status' => 'pending',
            'context' => $context,
            'started_at' => now(),
        ]);

        dispatch(new ExecuteAutomationRunJob($run->id))->onQueue('automation');
    }

    private function fire(string $triggerType, int $workspaceId, int $contactId, array $context = []): void
    {
        Automation::where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->where('trigger_type', $triggerType)
            ->each(fn ($automation) => $this->engine->triggerForContact($automation, $contactId, $context));
    }

    /**
     * Like fire(), but respects trigger_config.keywords & trigger_config.channel.
     */
    private function fireWithConfig(string $triggerType, int $workspaceId, int $contactId, array $context, string $messageBody = '', string $messageChannel = ''): void
    {
        $automations = Automation::where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->get();

        $bodyLower = mb_strtolower($messageBody);

        foreach ($automations as $automation) {
            foreach ($this->getAutomationTriggers($automation) as $tr) {
                if ($tr['trigger_type'] !== $triggerType) {
                    continue;
                }

                $requiredChannel = $tr['trigger_config']['channel'] ?? null;
                if ($requiredChannel && strtolower((string) $messageChannel) !== strtolower((string) $requiredChannel)) {
                    continue;
                }

                $keywords = $tr['trigger_config']['keywords'] ?? [];
                if (is_string($keywords)) {
                    $keywords = array_filter(array_map('trim', explode(',', $keywords)));
                }

                if (! empty($keywords)) {
                    $matches = false;
                    foreach ($keywords as $kw) {
                        if (str_contains($bodyLower, mb_strtolower((string) $kw))) {
                            $matches = true;
                            break;
                        }
                    }
                    if (! $matches) {
                        continue;
                    }
                }

                // 3. Replied to Workflow filter with optional lookback window (GHL parity)
                $repliedWfId = $tr['trigger_config']['replied_to_workflow_id'] ?? null;
                $lookback = null;
                if (! empty($tr['trigger_config']['filters'])) {
                    foreach ($tr['trigger_config']['filters'] as $f) {
                        if (($f['type'] ?? '') === 'replied_to_workflow' && ! empty($f['value'])) {
                            $repliedWfId = $f['value'];
                            $lookback = $f['lookback'] ?? null;
                            break;
                        }
                    }
                }

                if ($repliedWfId) {
                    $query = AutomationRun::where('contact_id', $contactId)
                        ->where(function ($q) use ($repliedWfId) {
                            if (is_numeric($repliedWfId)) {
                                $q->where('automation_id', (int) $repliedWfId);
                            } else {
                                $q->whereHas('automation', fn ($aq) => $aq->where('uuid', $repliedWfId));
                            }
                        });

                    if ($lookback && $lookback !== 'any') {
                        $hours = match ($lookback) {
                            '24h' => 24,
                            '48h' => 48,
                            '7d' => 168,
                            '30d' => 720,
                            default => is_numeric($lookback) ? (int) $lookback : null,
                        };
                        if ($hours) {
                            $query->where('updated_at', '>=', now()->subHours($hours));
                        }
                    }

                    $hasRun = $query->exists();

                    if (! $hasRun) {
                        continue;
                    }
                }

                // 4. Contact Tag / Source filters in trigger_config.filters
                if (! empty($tr['trigger_config']['filters'])) {
                    $filters = $tr['trigger_config']['filters'];
                    $contact = null;

                    $tagIs = collect($filters)->firstWhere('type', 'tag_is');
                    if ($tagIs && ! empty($tagIs['value'])) {
                        $contact = Contact::with('tags')->find($contactId);
                        if (! $contact || ! $contact->tags->contains('name', $tagIs['value'])) {
                            continue;
                        }
                    }

                    $tagIsNot = collect($filters)->firstWhere('type', 'tag_is_not');
                    if ($tagIsNot && ! empty($tagIsNot['value'])) {
                        $contact = $contact ?? Contact::with('tags')->find($contactId);
                        if ($contact && $contact->tags->contains('name', $tagIsNot['value'])) {
                            continue;
                        }
                    }

                    $sourceIs = collect($filters)->firstWhere('type', 'source_is');
                    if ($sourceIs && ! empty($sourceIs['value'])) {
                        $contact = $contact ?? Contact::find($contactId);
                        if (! $contact || strtolower((string) $contact->source) !== strtolower((string) $sourceIs['value'])) {
                            continue;
                        }
                    }
                }

                $this->engine->triggerForContact($automation, $contactId, array_merge($context, [
                    '_matched_trigger_id' => $tr['id'],
                    'trigger_name' => $tr['trigger_name'],
                    'trigger_type' => $tr['trigger_type'],
                ]));
                break;
            }
        }
    }

    public function handleTriggerLinkClicked(int $workspaceId, ?int $contactId, \App\Modules\Shared\Models\TriggerLink $link, array $extraContext = []): void
    {
        if (! $contactId) {
            return;
        }

        $automations = Automation::where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->get();

        foreach ($automations as $automation) {
            foreach ($this->getAutomationTriggers($automation) as $tr) {
                if ($tr['trigger_type'] !== 'trigger_link.clicked') {
                    continue;
                }

                $requiredLinkId = $tr['trigger_config']['trigger_link_id'] ?? ($tr['trigger_config']['link_id'] ?? null);
                if ($requiredLinkId && (int) $requiredLinkId !== (int) $link->id) {
                    continue;
                }

                $this->engine->triggerForContact($automation, $contactId, array_merge($extraContext, [
                    'trigger_link_id' => $link->id,
                    'trigger_link_name' => $link->name,
                    'trigger_link_url' => $link->target_url,
                    'trigger_name' => $tr['trigger_name'] ?? 'Trigger Link Clicked',
                    'trigger_type' => 'trigger_link.clicked',
                    '_matched_trigger_id' => $tr['id'],
                ]));
                break;
            }
        }
    }
}

