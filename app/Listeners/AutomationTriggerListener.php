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

        $this->fireWithConfig('message.received', $workspaceId, $contactId, [
            'message_id' => $event->message->id,
            'message_channel' => $channel,
            'message_body' => $messageBody,
        ], $messageBody, $channel);
    }

    /**
     * Extract all trigger definitions from an automation (from nodes array + fallback).
     * Returns list of ['id' => string, 'trigger_type' => string, 'trigger_config' => array].
     */
    private function getAutomationTriggers(Automation $automation): array
    {
        $triggers = [];

        if (is_array($automation->nodes)) {
            foreach ($automation->nodes as $node) {
                $isTrigger = ($node['type'] ?? '') === 'triggerNode'
                    || ($node['type'] ?? '') === 'trigger'
                    || isset($node['data']['triggerType']);

                if ($isTrigger) {
                    $type = $node['data']['triggerType'] ?? $node['data']['trigger_type'] ?? $automation->trigger_type;
                    $config = $node['data']['triggerConfig'] ?? $node['data']['trigger_config'] ?? $automation->trigger_config ?? [];
                    if ($type) {
                        $triggers[] = [
                            'id' => $node['id'] ?? 'trigger-1',
                            'trigger_type' => $type,
                            'trigger_config' => is_array($config) ? $config : [],
                        ];
                    }
                }
            }
        }

        if (empty($triggers) && ! empty($automation->trigger_type)) {
            $triggers[] = [
                'id' => 'trigger-1',
                'trigger_type' => $automation->trigger_type,
                'trigger_config' => is_array($automation->trigger_config) ? $automation->trigger_config : [],
            ];
        }

        return $triggers;
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

                $this->engine->triggerForContact($automation, $event->contactId, array_merge($event->context, ['_matched_trigger_id' => $tr['id']]));
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

        $context = ['payload' => $event->payload];

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
            ->where('trigger_type', $triggerType)
            ->get();

        $bodyLower = mb_strtolower($messageBody);

        foreach ($automations as $automation) {
            $requiredChannel = $automation->trigger_config['channel'] ?? null;
            if ($requiredChannel && strtolower((string) $messageChannel) !== strtolower((string) $requiredChannel)) {
                continue;
            }

            $keywords = $automation->trigger_config['keywords'] ?? [];

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

            $this->engine->triggerForContact($automation, $contactId, $context);
        }
    }
}
