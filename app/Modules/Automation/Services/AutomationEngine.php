<?php

namespace App\Modules\Automation\Services;

use App\Events\ConversationAssigned;
use App\Events\MessageSent;
use App\Mail\AutomationEmail;
use App\Models\User;
use App\Modules\AI\Models\AiChatbot;
use App\Modules\AI\Services\ChatbotRunner;
use App\Modules\AI\Services\LlmGateway;
use App\Modules\Automation\Jobs\ExecuteAutomationRunJob;
use App\Modules\Automation\Models\Automation;
use App\Modules\Automation\Models\AutomationRun;
use App\Modules\Automation\Models\AutomationRunLog;
use App\Modules\Broadcasting\Models\Campaign;
use App\Modules\Broadcasting\Models\CampaignRecipient;
use App\Modules\Broadcasting\Services\Sms\SmsDriverManager;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Integrations\Services\Clients\GoogleClient;
use App\Modules\Shared\Models\ChannelAccount;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\ContactTag;
use App\Modules\Shared\Models\Conversation;
use App\Modules\Shared\Models\Message;
use App\Modules\Shared\Services\ChannelManager;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Event-driven automation execution engine.
 *
 * Executes automation nodes sequentially. Each node has a `type` and `data`.
 * Edges define the flow between nodes. Entry node is the first node after the trigger.
 *
 * Supported node types:
 *   - trigger            (entry point, skipped at runtime)
 *   - send_whatsapp      (send WhatsApp template/text)
 *   - send_sms           (send SMS via SmsDriverManager)
 *   - send_email         (send email via Laravel Mail)
 *   - wait               (delay in minutes/hours/days)
 *   - condition          (if/else branch on contact attribute or event)
 *   - add_tag / remove_tag
 *   - update_contact     (set custom field value)
 *   - add_to_campaign    (enqueue contact to broadcast campaign)
 *   - ai_reply           (generate AI response and send)
 *   - webhook            (POST JSON payload to URL)
 */
class AutomationEngine
{
    public function __construct(
        private readonly ChannelManager $channelManager,
        private readonly ChatbotRunner $chatbotRunner,
        private readonly LlmGateway $llmGateway,
    ) {}

    public function triggerForContact(Automation $automation, int $contactId, array $context = []): void
    {
        if (! $automation->isActive()) {
            return;
        }

        $cfg = $automation->trigger_config ?? [];
        if (empty($cfg) && is_array($automation->nodes)) {
            foreach ($automation->nodes as $n) {
                if ((($n['type'] ?? '') === 'trigger' || ($n['type'] ?? '') === 'triggerNode') && ! empty($n['data']['triggerConfig'])) {
                    $cfg = array_merge($cfg, $n['data']['triggerConfig']);
                    break;
                }
            }
        }

        // 1. Prevent duplicate parallel runs (Active Run Debounce / Mutex)
        $preventParallel = $cfg['prevent_parallel_runs'] ?? true;
        if ($preventParallel) {
            $hasActiveRun = AutomationRun::where('automation_id', $automation->id)
                ->where('contact_id', $contactId)
                ->whereIn('status', ['pending', 'running', 'waiting'])
                ->exists();

            if ($hasActiveRun) {
                return;
            }
        }

        // 2. Re-entry policy (Once, Cooldown, Always)
        $policy = $cfg['re_entry_policy'] ?? 'always';
        if ($policy === 'once') {
            $hasPastRun = AutomationRun::where('automation_id', $automation->id)
                ->where('contact_id', $contactId)
                ->exists();

            if ($hasPastRun) {
                return;
            }
        } elseif ($policy === 'cooldown') {
            $amount = (int) ($cfg['cooldown_amount'] ?? 24);
            $unit = $cfg['cooldown_unit'] ?? 'hours';
            $cutoff = match ($unit) {
                'minutes' => now()->subMinutes($amount),
                'days' => now()->subDays($amount),
                default => now()->subHours($amount),
            };

            $hasRecentRun = AutomationRun::where('automation_id', $automation->id)
                ->where('contact_id', $contactId)
                ->where('created_at', '>=', $cutoff)
                ->exists();

            if ($hasRecentRun) {
                return;
            }
        }

        $run = AutomationRun::create([
            'automation_id' => $automation->id,
            'contact_id' => $contactId,
            'status' => 'pending',
            'context' => $context,
            'started_at' => now(),
        ]);

        dispatch(new ExecuteAutomationRunJob($run->id))->onQueue('automation');
    }

    /**
     * Resume runs that are parked on an "Ask question" node or "Wait for Customer Reply" fork node,
     * waiting for this contact's next inbound message.
     */
    public function resumeAwaitingReplies(int $workspaceId, int $contactId, string $messageBody): void
    {
        $runs = AutomationRun::where('contact_id', $contactId)
            ->where('status', 'waiting')
            ->whereHas('automation', fn ($q) => $q->where('workspace_id', $workspaceId))
            ->with('automation')
            ->get();

        foreach ($runs as $run) {
            $context = $run->context ?? [];

            // Case 1: Parked on "Ask question" node
            if (! empty($context['_awaiting_reply'])) {
                $var = $context['_reply_var'] ?? 'answer';
                $context[$var] = $messageBody;
                unset($context['_awaiting_reply'], $context['_reply_var']);
                $run->update(['context' => $context, 'status' => 'pending']);
                dispatch(new ExecuteAutomationRunJob($run->id))->onQueue('automation');
                continue;
            }

            // Case 2: Parked on "Wait for Customer Reply" fork node
            if (! empty($context['_waiting_for_reply'])) {
                $matchType = $context['_reply_match_type'] ?? 'any';
                $matchPhrase = trim((string) ($context['_reply_match_phrase'] ?? ''));
                $matched = true;

                if ($matchType === 'contains' && $matchPhrase !== '') {
                    $matched = str_contains(mb_strtolower($messageBody), mb_strtolower($matchPhrase));
                } elseif ($matchType === 'exact' && $matchPhrase !== '') {
                    $matched = mb_strtolower(trim($messageBody)) === mb_strtolower($matchPhrase);
                }

                if (! $matched) {
                    continue; // Didn't match requirement; continue waiting until matching reply or timeout
                }

                $replyVar = $context['_reply_var'] ?? 'customer_reply';
                $waitingNodeId = $context['_waiting_for_reply_node_id'] ?? $run->current_node_id;
                $edges = collect($run->automation->edges ?? []);

                // Find edge from 'replied' sourceHandle
                $repliedEdge = $edges->first(fn ($e) => $e['source'] === $waitingNodeId && ($e['sourceHandle'] ?? '') === 'replied')
                    ?? $edges->first(fn ($e) => $e['source'] === $waitingNodeId && in_array($e['sourceHandle'] ?? '', ['true', 'yes', 'replied']))
                    ?? $edges->first(fn ($e) => $e['source'] === $waitingNodeId);

                $targetNodeId = $repliedEdge['target'] ?? null;

                $context[$replyVar] = $messageBody;
                $context['_reply_received_at'] = now()->toIso8601String();
                unset(
                    $context['_waiting_for_reply'],
                    $context['_waiting_for_reply_node_id'],
                    $context['_reply_var'],
                    $context['_reply_match_type'],
                    $context['_reply_match_phrase'],
                    $context['_reply_timeout_at']
                );

                $run->update([
                    'context' => $context,
                    'status' => 'pending',
                    'resume_node_id' => $targetNodeId,
                ]);

                dispatch(new ExecuteAutomationRunJob($run->id))->onQueue('automation');
                continue;
            }
        }
    }

    /**
     * Stop waiting runs for this contact when they send an inbound reply,
     * if the automation has "stop_on_response" safeguard enabled.
     */
    public function handleCustomerReplyStopDrip(int $workspaceId, int $contactId): void
    {
        $runs = AutomationRun::where('contact_id', $contactId)
            ->where('status', 'waiting')
            ->whereHas('automation', fn ($q) => $q->where('workspace_id', $workspaceId))
            ->with('automation')
            ->get();

        foreach ($runs as $run) {
            $automation = $run->automation;
            if (! $automation) {
                continue;
            }

            // Check if stop_on_response is enabled on trigger_config or any trigger node
            $stopOnResponse = ! empty($automation->trigger_config['stop_on_response']);
            if (! $stopOnResponse && is_array($automation->nodes)) {
                foreach ($automation->nodes as $node) {
                    $isTrigger = ($node['type'] ?? '') === 'triggerNode' || ($node['type'] ?? '') === 'trigger';
                    if ($isTrigger && ! empty($node['data']['triggerConfig']['stop_on_response'])) {
                        $stopOnResponse = true;
                        break;
                    }
                }
            }

            // Don't halt if it was waiting on an "ask_question" reply or "wait_for_reply" fork
            $context = $run->context ?? [];
            if (! empty($context['_awaiting_reply']) || ! empty($context['_waiting_for_reply'])) {
                continue;
            }

            if ($stopOnResponse) {
                $run->update([
                    'status' => 'cancelled',
                    'completed_at' => now(),
                    'error' => 'Stopped on customer reply (Stop on Response safeguard)',
                ]);

                \App\Modules\Automation\Models\AutomationRunLog::create([
                    'automation_run_id' => $run->id,
                    'node_id' => $run->current_node_id ?? 'system',
                    'node_type' => 'system',
                    'status' => 'skipped',
                    'message' => 'Automation paused/cancelled because contact replied (Stop on Customer Response safeguard).',
                ]);
            }
        }
    }

    /**
     * Extract all trigger definitions from an automation (from nodes array + fallback).
     * Returns list of ['id' => string, 'trigger_type' => string, 'trigger_name' => string, 'trigger_config' => array].
     */
    public function getAutomationTriggers(Automation $automation): array
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
                    $name = $node['data']['triggerName'] ?? $node['data']['trigger_name'] ?? $node['data']['label'] ?? null;
                    if (! $name && $type) {
                        $name = match ($type) {
                            'form.submitted' => 'Form Submitted',
                            'contact.created' => 'Contact Created',
                            'contact.tag_added' => 'Tag Added',
                            'message.received' => 'Message Received',
                            'customer.replied' => 'Customer Replied',
                            'opportunity.created' => 'Opportunity Created',
                            'opportunity.pipeline_changed' => 'Opportunity Pipeline Changed',
                            'opportunity.stage_changed' => 'Opportunity Stage Changed',
                            'opportunity.status_changed' => 'Opportunity Status Changed',
                            'opportunity.won' => 'Opportunity Won',
                            'opportunity.lost' => 'Opportunity Lost',
                            'opportunity.abandoned' => 'Opportunity Abandoned',
                            default => ucfirst(str_replace(['.', '_'], ' ', (string) $type)),
                        };
                    }
                    if ($type) {
                        $triggers[] = [
                            'id' => $node['id'] ?? 'trigger-1',
                            'trigger_type' => $type,
                            'trigger_name' => $name,
                            'trigger_config' => is_array($config) ? $config : [],
                        ];
                    }
                }
            }
        }

        if (empty($triggers) && ! empty($automation->trigger_type)) {
            $defaultName = $automation->trigger_config['trigger_name'] ?? match ($automation->trigger_type) {
                'form.submitted' => 'Form Submitted',
                'contact.created' => 'Contact Created',
                'contact.tag_added' => 'Tag Added',
                'message.received' => 'Message Received',
                'customer.replied' => 'Customer Replied',
                'opportunity.created' => 'Opportunity Created',
                'opportunity.pipeline_changed' => 'Opportunity Pipeline Changed',
                'opportunity.stage_changed' => 'Opportunity Stage Changed',
                'opportunity.status_changed' => 'Opportunity Status Changed',
                'opportunity.won' => 'Opportunity Won',
                'opportunity.lost' => 'Opportunity Lost',
                'opportunity.abandoned' => 'Opportunity Abandoned',
                default => ucfirst(str_replace(['.', '_'], ' ', (string) $automation->trigger_type)),
            };

            $triggers[] = [
                'id' => 'trigger-1',
                'trigger_type' => $automation->trigger_type,
                'trigger_name' => $defaultName,
                'trigger_config' => is_array($automation->trigger_config) ? $automation->trigger_config : [],
            ];
        }

        return $triggers;
    }

    public function executeRun(AutomationRun $run): void
    {
        if (in_array($run->status, ['completed', 'failed', 'cancelled'])) {
            return;
        }

        $run->update(['status' => 'running']);
        $automation = $run->automation;

        $nodes = collect($automation->nodes ?? []);
        $edges = collect($automation->edges ?? []);
        $context = $run->context ?? [];

        // If resuming after a wait, start from the node after the wait
        if ($run->resume_node_id) {
            $currentId = $run->resume_node_id;
            $run->update(['resume_node_id' => null]);
        } elseif (! empty($context['_waiting_for_reply'])) {
            // Scheduled wakeup fired while still waiting for customer reply -> Timeout branch!
            $waitingNodeId = $context['_waiting_for_reply_node_id'] ?? $run->current_node_id;
            $timeoutEdge = $edges->first(fn ($e) => $e['source'] === $waitingNodeId && ($e['sourceHandle'] ?? '') === 'timeout')
                ?? $edges->first(fn ($e) => $e['source'] === $waitingNodeId && in_array($e['sourceHandle'] ?? '', ['false', 'no', 'timeout', 'timed_out']));

            $currentId = $timeoutEdge['target'] ?? null;
            unset(
                $context['_waiting_for_reply'],
                $context['_waiting_for_reply_node_id'],
                $context['_reply_var'],
                $context['_reply_match_type'],
                $context['_reply_match_phrase'],
                $context['_reply_timeout_at']
            );
            $context['_reply_timed_out'] = true;
            $run->update(['context' => $context]);
        } else {
            // Find trigger node and start from the first node after it
            $matchedTriggerId = $context['_matched_trigger_id'] ?? null;
            $triggerNodes = $nodes->filter(fn ($n) => ($n['type'] ?? '') === 'trigger' || ($n['type'] ?? '') === 'triggerNode');

            if ($triggerNodes->isEmpty()) {
                $run->update(['status' => 'failed', 'error' => 'No trigger node found in automation.', 'completed_at' => now()]);

                return;
            }

            $triggerNodeIds = $triggerNodes->pluck('id')->all();
            $firstEdge = $edges->first(function ($e) use ($matchedTriggerId, $triggerNodeIds) {
                if ($matchedTriggerId && $e['source'] === $matchedTriggerId) {
                    return true;
                }
                return in_array($e['source'], $triggerNodeIds);
            });

            $currentId = $firstEdge['target'] ?? null;
        }

        $visited = [];
        $maxSteps = 100;

        while ($currentId && $maxSteps-- > 0) {
            if (in_array($currentId, $visited)) {
                break; // cycle guard
            }
            $visited[] = $currentId;

            $node = $nodes->first(fn ($n) => $n['id'] === $currentId);
            if (! $node) {
                break;
            }

            // Update current_node_id before executing so child methods (e.g. executeWait)
            // can read the correct node ID when looking up outgoing edges.
            $run->update(['current_node_id' => $currentId]);

            $result = $this->executeNode($node, $run, $context);
            $context = array_merge($context, $result['context_update'] ?? []);
            $run->update(['context' => $context]);

            AutomationRunLog::create([
                'run_id' => $run->id,
                'node_id' => $currentId,
                'node_type' => $node['data']['nodeType'] ?? $node['data']['type'] ?? $node['type'] ?? 'unknown',
                'result' => match ($result['status'] ?? 'ok') {
                    'error' => 'error',
                    'skipped' => 'skipped',
                    default => 'ok',
                },
                'message' => $result['message'] ?? null,
                'output' => $result['output'] ?? null,
            ]);

            if (($result['status'] ?? 'ok') === 'error') {
                $run->update(['status' => 'failed', 'error' => $result['message'], 'completed_at' => now()]);

                return;
            }

            // Wait node suspends the run; wakeup job will continue from the stored next node
            if (($result['status'] ?? '') === 'waiting') {
                return;
            }

            // Exit early if requested by remove_from_workflow or stop_flow
            if (! empty($result['stop_flow']) || ($result['status'] ?? '') === 'exited') {
                $run->update(['status' => 'completed', 'completed_at' => now()]);
                return;
            }

            // Direct step redirect (e.g. go_to_step from wait node or jump action)
            if (! empty($result['next_node_id'])) {
                $currentId = $result['next_node_id'];
                $nextEdgeLabel = null;
                continue;
            }

            // Condition branching
            $nextEdgeLabel = $result['branch'] ?? null;

            // Find next edge
            $nextEdge = $edges->first(fn ($e) => $e['source'] === $currentId &&
                (! isset($nextEdgeLabel) || ($e['sourceHandle'] ?? null) === $nextEdgeLabel || (($e['sourceHandle'] ?? null) === ($result['branch_base'] ?? null)))
            );

            $currentId = $nextEdge['target'] ?? null;
            $nextEdgeLabel = null;
        }

        $run->update(['status' => 'completed', 'completed_at' => now()]);
        $automation->increment('run_count');

        // If this was a nested child subflow with wait_completion, resume parent run
        $parentRunId = $context['_parent_run_id'] ?? null;
        if ($parentRunId) {
            $parentRun = AutomationRun::find($parentRunId);
            if ($parentRun && $parentRun->status === 'waiting') {
                $parentContext = $parentRun->context ?? [];
                $parentContext['_subflow_completed'] = true;
                $parentContext['_subflow_id'] = $automation->id;
                $parentRun->update([
                    'context' => $parentContext,
                    'status' => 'pending',
                ]);
                dispatch(new ExecuteAutomationRunJob($parentRun->id))->onQueue('automation');
            }
        }
    }

    /**
     * Simulate a workflow run for the builder's "Test" button. Walks the same graph the
     * engine would, evaluating conditions for real (read-only) but only *previewing*
     * side-effecting nodes — no messages are sent, no records written, no external APIs
     * called and no AI tokens spent. Returns a step-by-step trace for the UI.
     *
     * @param  array<int, array<string, mixed>>  $nodes  builder node objects ({id, type, data})
     * @param  array<int, array<string, mixed>>  $edges  builder edge objects ({source, target, sourceHandle})
     * @return array{ok: bool, error?: string, steps: array<int, array<string, mixed>>, context?: array<string, mixed>, contact?: array<string, mixed>}
     */
    public function testRun(Automation $automation, array $nodes, array $edges, array $context = []): array
    {
        $nodesC = collect($nodes);
        $edgesC = collect($edges);

        $contact = $this->sampleContact((int) $automation->workspace_id);
        $context = array_merge($this->defaultTestContext(), $context);

        $isTrigger = fn ($n) => in_array($n['type'] ?? '', ['trigger', 'triggerNode'], true) || isset($n['data']['triggerType']);
        $trigger = $nodesC->first($isTrigger);

        if (! $trigger) {
            return ['ok' => false, 'error' => 'Add a trigger to start the automation.', 'steps' => []];
        }
        $triggerType = $automation->trigger_type ?: ($trigger['data']['triggerType'] ?? null);
        if (! $triggerType) {
            return ['ok' => false, 'error' => 'Pick a trigger type before testing.', 'steps' => []];
        }

        $firstEdge = $edgesC->first(fn ($e) => ($e['source'] ?? null) === ($trigger['id'] ?? null));
        $currentId = $firstEdge['target'] ?? null;
        if (! $currentId) {
            return ['ok' => false, 'error' => 'Connect the trigger to at least one step.', 'steps' => []];
        }

        $steps = [];
        $visited = [];
        $maxSteps = 60;

        while ($currentId && $maxSteps-- > 0) {
            if (in_array($currentId, $visited, true)) {
                $steps[] = ['node_id' => $currentId, 'node_type' => 'loop', 'label' => null, 'result' => 'skipped', 'message' => 'Loop detected — stopping here.', 'branch' => null];
                break;
            }
            $visited[] = $currentId;

            $node = $nodesC->first(fn ($n) => ($n['id'] ?? null) === $currentId);
            if (! $node) {
                break;
            }
            $type = $node['data']['nodeType'] ?? $node['type'] ?? 'unknown';
            $data = is_array($node['data'] ?? null) ? $node['data'] : [];

            $branch = null;
            if ($type === 'condition') {
                $eval = $this->evaluateConditionNode($data, $contact, $context);
                $branch = $eval['branch'];
                $result = $eval;
            } else {
                $result = $this->previewNode($type, $data, $contact, $context);
            }

            $context = array_merge($context, $result['context_update'] ?? []);

            $steps[] = [
                'node_id' => $currentId,
                'node_type' => $type,
                'label' => $data['label'] ?? null,
                'result' => $result['status'] ?? 'ok',
                'message' => $result['message'] ?? '',
                'output' => $result['output'] ?? null,
                'branch' => $branch,
            ];

            if (($result['status'] ?? 'ok') === 'error') {
                break;
            }

            $nextEdge = $edgesC->first(fn ($e) => ($e['source'] ?? null) === $currentId
                && ($branch === null || ($e['sourceHandle'] ?? null) === $branch || (($e['sourceHandle'] ?? null) === ($result['branch_base'] ?? null))));
            $currentId = $nextEdge['target'] ?? null;
        }

        return [
            'ok' => true,
            'steps' => $steps,
            'context' => $context,
            'contact' => [
                'name' => $contact->full_name,
                'email' => $contact->email,
                'phone' => $contact->phone_e164,
            ],
        ];
    }

    /** A throw-away, unsaved contact used for test simulations so we never touch real data. */
    private function sampleContact(int $workspaceId): Contact
    {
        $c = new Contact;
        $c->workspace_id = $workspaceId;
        $c->first_name = 'Test';
        $c->last_name = 'Contact';
        $c->email = 'test.contact@example.com';
        $c->phone_e164 = '+15555550123';
        $c->language = 'en';
        $c->country = 'US';

        return $c;
    }

    /** Seed run-context values so {{context.*}} tokens render during a test. */
    private function defaultTestContext(): array
    {
        return [
            'message_body' => 'Hi',
            'message_channel' => 'whatsapp',
            'order_number' => '1042',
            'order_total' => '49.00',
            'order_currency' => 'USD',
            'tracking_url' => 'https://example.com/track/1042',
            'store_name' => 'Demo Store',
            'cart_total' => '49.00',
            'recovery_url' => 'https://example.com/cart/abc',
        ];
    }

    /**
     * Describe what a node *would* do — without performing any side effect. Used by testRun()
     * only; mirrors the validation each real executor performs so the trace flags mis-config.
     */
    private function previewNode(string $type, array $data, Contact $contact, array $context): array
    {
        $render = fn ($v) => $this->renderTokens((string) ($v ?? ''), $contact, $context);
        $ok = fn (string $msg, array $extra = []) => array_merge(['status' => 'ok', 'message' => $msg], $extra);
        $err = fn (string $msg) => ['status' => 'error', 'message' => $msg];
        $skip = fn (string $msg) => ['status' => 'skipped', 'message' => $msg];

        return match ($type) {
            'send_whatsapp' => $ok('Would send WhatsApp: "'.$this->snippet($render($data['body'] ?? '')).'"'),
            'send_sms' => $ok('Would send SMS: "'.$this->snippet($render($data['body'] ?? '')).'"'),
            'internal_notification' => $ok('Would send internal '.($data['notification_type'] ?? 'email').' alert: "'.$this->snippet($render($data['subject'] ?? ($data['title'] ?? 'Alert'))).'"'),
            'send_email' => ($data['subject'] ?? '') === ''
                ? $err('Email subject is required.')
                : $ok('Would email "'.$this->snippet($render($data['subject'])).'" to '.$contact->email),
            'send_template' => ($data['template_name'] ?? ($data['template_ref'] ?? '')) === ''
                ? $err('No template selected.')
                : $ok('Would send template "'.($data['template_name'] ?? $data['template_ref']).'" ('.($data['language'] ?? 'en').').'),
            'send_media' => ($data['link'] ?? '') === ''
                ? $err('Media link is required.')
                : $ok('Would send '.($data['media_type'] ?? 'image').': '.$this->snippet($render($data['link']), 50)),
            'send_sequence' => $ok('Would send '.count($this->parseSteps($data['steps'] ?? [])).' sequence step(s).'),
            'quick_replies' => $ok('Would send buttons: '.(implode(' · ', array_slice($this->toList($data['buttons'] ?? []), 0, 3)) ?: '—')),
            'list_message' => $ok('Would send a list with '.count($this->parseRows($data['rows'] ?? [])).' item(s).'),
            'ask_question' => $ok('Would ask: "'.$this->snippet($render($data['question'] ?? '')).'" → saved to {{context.'.(($data['variable'] ?? '') ?: 'answer').'}}',
                ['context_update' => [(($data['variable'] ?? '') ?: 'answer') => '[sample reply]']]),
            'wait' => $ok('Would wait '.((int) ($data['amount'] ?? 1)).' '.($data['unit'] ?? 'minutes').' (skipped in test).'),
            'wait_for_reply' => $ok('Would wait up to '.((int) ($data['timeout_amount'] ?? 24)).' '.($data['timeout_unit'] ?? 'hours').' for customer reply. Branch: "replied" on message, "timeout" on expiration.', [
                'branch' => 'replied',
                'context_update' => [(($data['reply_variable'] ?? '') ?: 'customer_reply') => '[sample customer reply]'],
            ]),
            'webhook' => ($data['url'] ?? '') === ''
                ? $err('Webhook URL missing.')
                : $ok('Would call '.strtoupper($data['method'] ?? 'POST').' '.$this->snippet($render($data['url']), 50), ['context_update' => ['webhook_status' => 200]]),
            'run_subflow' => $ok('Would run sub-flow '.($data['subflow_name'] ?? ($data['automation_uuid'] ?? '?')).' (Mode: '.($data['mode'] ?? 'fire_and_forget').').'),
            'ai_reply' => $ok('Would generate an AI reply'.(! empty($data['chatbot_id']) ? ' via chatbot #'.$data['chatbot_id'] : '').' and send it.', ['context_update' => ['last_ai_reply' => '[AI generated reply]']]),
            'add_tag' => ($data['tag'] ?? '') === '' ? $skip('No tag name.') : $ok('Would add tag "'.$data['tag'].'".'),
            'remove_tag' => ($data['tag'] ?? '') === '' ? $skip('No tag name.') : $ok('Would remove tag "'.$data['tag'].'".'),
            'update_contact' => ($data['field'] ?? '') === '' ? $skip('No field selected.') : $ok('Would set contact.'.$data['field'].' = "'.$this->snippet($render($data['value'] ?? '')).'".'),
            'assign_agent' => $ok(! empty($data['agent_name']) ? 'Would assign to '.$data['agent_name'].'.' : 'Would hand off to a human agent.'),
            'add_to_campaign' => ($data['campaign_id'] ?? '') === '' ? $skip('No campaign selected.') : $ok('Would add contact to campaign #'.$data['campaign_id'].'.'),
            'cta_button' => $ok('Would send CTA "'.($data['display_text'] ?? 'Open').'" → '.$this->snippet($render($data['url'] ?? ''), 40)),
            'send_location' => $ok('Would send location '.($data['latitude'] ?? '?').', '.($data['longitude'] ?? '?').'.'),
            'send_poll' => $ok('Would send a poll: "'.$this->snippet($render($data['question'] ?? '')).'"'),
            'run_chatbot' => empty($data['chatbot_id']) ? $err('No chatbot selected.') : $ok('Would run chatbot #'.$data['chatbot_id'].' and send the reply.', ['context_update' => ['last_ai_reply' => '[chatbot reply]']]),
            'book_appointment' => $ok('Would book "'.$this->snippet($render($data['summary'] ?? 'Appointment'), 30).'" at '.($data['start'] ?? '?').'.', ['context_update' => ['appointment_link' => 'https://calendar.example.com/evt']]),
            'google_meet' => $ok('Would create a Google Meet for "'.$this->snippet($render($data['summary'] ?? 'Meeting'), 30).'".', ['context_update' => ['meet_url' => 'https://meet.google.com/abc-defg-hij']]),
            'whatsapp_form' => ($data['flow_id'] ?? '') === '' ? $err('Flow ID is required.') : $ok('Would send WhatsApp flow #'.$data['flow_id'].'.'),
            'whatsapp_catalog' => $ok('Would send the WhatsApp catalog.'),
            'woocommerce_product', 'shopify_product' => ($data['product_id'] ?? '') === '' ? $err('No product selected.') : $ok('Would send product #'.$data['product_id'].'.'),
            'google_sheets' => ($data['spreadsheet_id'] ?? '') === '' ? $err('Spreadsheet ID is required.') : $ok('Would '.($data['mode'] ?? 'append').' Google Sheet range '.($data['range'] ?? '').'.'),
            'google_docs' => ($data['template_doc_id'] ?? '') === '' ? $err('Template document ID is required.') : $ok('Would generate a Google Doc from template.', ['context_update' => ['doc_url' => 'https://docs.google.com/document/d/sample']]),
            'google_forms' => ($data['form_id'] ?? '') === ''
                ? $err('Form ID is required.')
                : (($data['mode'] ?? 'send_link') === 'read_response'
                    ? $ok('Would read the latest Google Form response.', ['context_update' => [(($data['result_var'] ?? '') ?: 'form').'_json' => '{}']])
                    : $ok('Would share the Google Form link.', ['context_update' => ['form_url' => 'https://docs.google.com/forms/d/sample/viewform']])),
            'remove_from_workflow' => in_array($data['target_type'] ?? 'current', ['another', 'specific']) && empty($data['target_automation_id'])
                ? $err('Target automation is required.')
                : $ok('Would unenroll contact from '.match ($data['target_type'] ?? 'current') {
                    'another', 'specific' => 'specified workflow',
                    'all_except_current' => 'all workflows except current workflow',
                    'all' => 'all workflows',
                    default => 'this workflow',
                }.'.'),
            default => $skip('Unknown node type: '.$type),
        };
    }

    private function snippet(string $s, int $n = 40): string
    {
        $s = trim($s);

        return mb_strlen($s) > $n ? mb_substr($s, 0, $n).'…' : $s;
    }

    private function executeNode(array $node, AutomationRun $run, array $context): array
    {
        $type = $node['data']['nodeType'] ?? $node['data']['type'] ?? $node['type'] ?? 'unknown';
        $data = $node['data'] ?? [];

        // Support disabling/muting steps during testing without deleting them
        if (! empty($data['disabled'])) {
            return ['status' => 'skipped', 'message' => 'Step skipped (disabled by user)'];
        }

        // Outbound communication safeguard: if previous wait step flagged to skip obsolete reminders
        if (! empty($context['skip_outbound_until_next_wait']) && in_array($type, [
            'send_whatsapp', 'send_sms', 'send_email', 'send_template', 'send_media',
            'send_sequence', 'quick_replies', 'list_message', 'cta_button', 'send_location',
            'send_poll', 'whatsapp_catalog', 'whatsapp_form',
        ])) {
            return [
                'status' => 'skipped',
                'message' => 'Skipped outbound communication: event reminder window has already passed.',
            ];
        }

        try {
            return match ($type) {
                'wait' => $this->executeWait($data, $run, $context),
                'wait_for_reply' => $this->executeWaitForReply($data, $run, $context),
                'add_tag' => $this->executeTagAction($data, $run, 'add', $context),
                'remove_tag' => $this->executeTagAction($data, $run, 'remove', $context),
                'update_contact' => $this->executeUpdateContact($data, $run, $context),
                'webhook' => $this->executeWebhook($data, $run, $context),
                'condition' => $this->executeCondition($data, $run, $context),
                'send_whatsapp' => $this->executeSendWhatsapp($data, $run, $context),
                'send_sms' => $this->executeSendSms($data, $run, $context),
                'send_email' => $this->executeSendEmail($data, $run, $context),
                'internal_notification' => $this->executeInternalNotification($data, $run, $context),
                'ai_reply' => $this->executeAiReply($data, $run, $context),
                'add_to_campaign' => $this->executeAddToCampaign($data, $run),
                // ── SEND ──────────────────────────────────────────────────────
                'send_template' => $this->executeSendTemplate($data, $run, $context),
                'send_media' => $this->executeSendMedia($data, $run, $context),
                'send_sequence' => $this->executeSendSequence($data, $run, $context),
                'quick_replies' => $this->executeQuickReplies($data, $run, $context),
                'list_message' => $this->executeListMessage($data, $run, $context),
                // ── LISTEN ────────────────────────────────────────────────────
                'ask_question' => $this->executeAskQuestion($data, $run, $context),
                // ── LOGIC ─────────────────────────────────────────────────────
                'run_subflow' => $this->executeRunSubflow($data, $run, $context),
                'remove_from_workflow' => $this->executeRemoveFromWorkflow($data, $run, $context),
                // ── CONTACT ───────────────────────────────────────────────────
                'assign_agent' => $this->executeAssignAgent($data, $run),
                // ── ENGAGE ────────────────────────────────────────────────────
                'cta_button' => $this->executeCtaButton($data, $run, $context),
                'send_location' => $this->executeSendLocation($data, $run, $context),
                'send_poll' => $this->executeSendPoll($data, $run, $context),
                'run_chatbot' => $this->executeRunChatbot($data, $run, $context),
                'book_appointment' => $this->executeBookAppointment($data, $run, $context),
                'google_meet' => $this->executeGoogleMeet($data, $run, $context),
                'whatsapp_form' => $this->executeWhatsappForm($data, $run, $context),
                // ── COMMERCE ──────────────────────────────────────────────────
                'whatsapp_catalog' => $this->executeWhatsappCatalog($data, $run, $context),
                'woocommerce_product' => $this->executeSendProduct($data, $run, $context, 'woocommerce'),
                'shopify_product' => $this->executeSendProduct($data, $run, $context, 'shopify'),
                // ── INTEGRATIONS ──────────────────────────────────────────────
                'google_sheets' => $this->executeGoogleSheets($data, $run, $context),
                'google_docs' => $this->executeGoogleDocs($data, $run, $context),
                'google_forms' => $this->executeGoogleForms($data, $run, $context),
                // ── PIPELINES ─────────────────────────────────────────────────
                'create_opportunity', 'create_update_opportunity' => $this->executeCreateOpportunity($data, $run, $context),
                'change_opportunity_stage' => $this->executeChangeOpportunityStage($data, $run, $context),
                'transfer_opportunity_pipeline' => $this->executeTransferOpportunityPipeline($data, $run, $context),
                'update_opportunity_status' => $this->executeUpdateOpportunityStatus($data, $run, $context),
                'remove_opportunity' => $this->executeRemoveOpportunity($data, $run, $context),
                // ── CALENDARS ─────────────────────────────────────────────────
                'book_system_appointment' => $this->executeSystemBookAppointment($data, $run, $context),
                'cancel_appointment' => $this->executeCancelAppointment($data, $run, $context),
                // ── AGENCY SUITE & PAYMENTS ───────────────────────────────────
                'create_agency_invoice' => $this->executeCreateAgencyInvoice($data, $run, $context),
                'send_agency_payment_link' => $this->executeSendAgencyPaymentLink($data, $run, $context),
                'send_onboarding_form_link' => $this->executeSendOnboardingFormLink($data, $run, $context),
                default => ['status' => 'skipped', 'message' => "Unknown node type: {$type}"],
            };
        } catch (\Throwable $e) {
            Log::error("AutomationEngine node error [{$type}]: ".$e->getMessage());

            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    // ─── Channel send helpers ────────────────────────────────────────────────

    private function executeSendWhatsapp(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        // Back-compat: a template_ref still sends an approved template (WhatsApp only).
        if (! empty($data['template_ref'])) {
            return $this->sendWhatsappPayload($run, 'template', null, ['template' => [
                'name' => $data['template_ref'],
                'language' => $data['language'] ?? 'en',
                'components' => [],
            ]]);
        }

        $body = $this->renderTokens($data['body'] ?? '', $contact, $context);

        return $this->dispatchMessage($run, $this->pickChannel($data), 'text', $body, null);
    }

    private function executeSendSms(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        $body = $this->renderTokens($data['body'] ?? '', $contact, $context);

        return $this->dispatchMessage($run, 'sms', 'text', $body, null);
    }

    private function executeSendEmail(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact || ! $contact->email) {
            return ['status' => 'skipped', 'message' => 'Contact has no email address.'];
        }

        $fromName = ! empty($data['from_name']) ? $this->renderTokens((string) $data['from_name'], $contact, $context) : null;
        $fromEmail = ! empty($data['from_email']) ? $this->renderTokens((string) $data['from_email'], $contact, $context) : null;
        $subject = $this->renderTokens((string) ($data['subject'] ?? 'Message from us'), $contact, $context);
        $preheader = ! empty($data['preheader']) ? $this->renderTokens((string) $data['preheader'], $contact, $context) : null;
        $body = $this->renderTokens((string) ($data['body'] ?? ''), $contact, $context);

        if (! empty($data['utm_tracking'])) {
            $campaignName = $run->automation->name ?? 'workflow';
            $actionName = $data['label'] ?? 'email_action';
            $body = $this->applyUtmTracking($body, $campaignName, $actionName);
        }

        $cc = ! empty($data['cc']) ? (is_array($data['cc']) ? $data['cc'] : array_map('trim', explode(',', (string) $data['cc']))) : [];
        $bcc = ! empty($data['bcc']) ? (is_array($data['bcc']) ? $data['bcc'] : array_map('trim', explode(',', (string) $data['bcc']))) : [];

        Mail::to($contact->email)->queue(
            new AutomationEmail(
                emailSubject: $subject,
                emailBody: $body,
                fromName: $fromName,
                fromEmail: $fromEmail,
                preheader: $preheader,
                cc: $cc,
                bcc: $bcc,
            )
        );

        return ['status' => 'ok', 'message' => "Email queued to {$contact->email}."];
    }

    private function applyUtmTracking(string $html, string $campaignName, string $actionName): string
    {
        $campaignSlug = \Illuminate\Support\Str::slug($campaignName) ?: 'workflow';
        $contentSlug = \Illuminate\Support\Str::slug($actionName) ?: 'email_step';

        return (string) preg_replace_callback('/<a\s+([^>]*?)href=["\'](https?:\/\/[^"\'>]+)["\']([^>]*)>/i', function ($matches) use ($campaignSlug, $contentSlug) {
            $url = $matches[2];
            if (str_starts_with($url, 'mailto:') || str_starts_with($url, 'tel:') || str_starts_with($url, '#')) {
                return $matches[0];
            }

            $separator = str_contains($url, '?') ? '&' : '?';
            $utm = "utm_source=whatsmine&utm_medium=email&utm_campaign={$campaignSlug}&utm_content={$contentSlug}";
            $trackedUrl = $url . $separator . $utm;

            return "<a {$matches[1]}href=\"{$trackedUrl}\"{$matches[3]}>";
        }, $html);
    }

    /**
     * AI assistant node. Two modes:
     *   - chatbot_id set  → run the RAG chatbot (knowledge-base aware).
     *   - prompt only     → free-form generation via the workspace LLM (ChatGPT / Gemini).
     */
    private function executeAiReply(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        $workspaceId = $run->automation->workspace_id;
        $userMessage = (string) ($context['message_body'] ?? '');

        if (! empty($data['chatbot_id'])) {
            $bot = AiChatbot::where('id', $data['chatbot_id'])
                ->where('workspace_id', $workspaceId)
                ->first();

            if (! $bot || ! $bot->enabled) {
                return ['status' => 'error', 'message' => 'Chatbot not found or disabled.'];
            }

            $prompt = $userMessage !== ''
                ? $userMessage
                : $this->renderTokens($data['prompt'] ?? '', $contact, $context);

            $result = $this->chatbotRunner->runForApi($bot, $prompt, $workspaceId, $context['history'] ?? []);
            $reply = $result['reply'] ?? null;
            $tokens = $result['tokens_used'] ?? 0;
        } else {
            $system = $this->renderTokens($data['prompt'] ?? 'You are a helpful assistant.', $contact, $context);
            $messages = [['role' => 'system', 'content' => $system]];
            $messages[] = [
                'role' => 'user',
                'content' => $userMessage !== '' ? $userMessage : 'Write a helpful, friendly message to the contact.',
            ];

            try {
                $response = $this->llmGateway->chat($workspaceId, $messages, ['max_tokens' => 512]);
                $reply = $response->content;
                $tokens = $response->promptTokens + $response->completionTokens;
            } catch (\Throwable $e) {
                return ['status' => 'error', 'message' => 'AI generation failed: '.$e->getMessage()];
            }
        }

        if (! $reply) {
            return ['status' => 'skipped', 'message' => 'AI returned no reply.'];
        }

        $send = $this->sendTextViaChannel($run, $data['channel'] ?? 'whatsapp', $reply, 'bot');

        return [
            'status' => $send['status'] ?? 'ok',
            'message' => ($send['status'] ?? 'ok') === 'ok' ? 'AI reply sent.' : $send['message'],
            'output' => ['reply' => $reply, 'tokens_used' => $tokens],
            'context_update' => ['last_ai_reply' => $reply],
        ];
    }

    private function executeAddToCampaign(array $data, AutomationRun $run): array
    {
        $campaignId = $data['campaign_id'] ?? null;
        if (! $campaignId || ! $run->contact_id) {
            return ['status' => 'skipped', 'message' => 'No campaign_id or contact.'];
        }

        $campaign = Campaign::find($campaignId);
        if (! $campaign) {
            return ['status' => 'error', 'message' => "Campaign {$campaignId} not found."];
        }

        // Scope check
        if ((int) $campaign->workspace_id !== (int) $run->automation->workspace_id) {
            return ['status' => 'error', 'message' => 'Campaign belongs to a different workspace.'];
        }

        // Skip if already a recipient
        $exists = CampaignRecipient::where('campaign_id', $campaignId)
            ->where('contact_id', $run->contact_id)
            ->exists();

        if ($exists) {
            return ['status' => 'skipped', 'message' => 'Contact already in campaign.'];
        }

        CampaignRecipient::create([
            'campaign_id' => $campaignId,
            'contact_id' => $run->contact_id,
            'status' => 'queued',
        ]);

        return ['status' => 'ok', 'message' => "Contact added to campaign {$campaignId}."];
    }

    // ─── Token replacement ───────────────────────────────────────────────────

    private function renderTokens(string $template, Contact $contact, array $context): string
    {
        if ($template === '' || ! str_contains($template, '{{')) {
            return $template;
        }

        // 1. Core token resolution via CampaignPersonalizer (supports contact, custom_fields, custom_values, trigger_links, right_now, account, user, context and fallback modifiers)
        $personalizer = app(\App\Modules\Broadcasting\Services\CampaignPersonalizer::class);
        $template = $personalizer->renderText($template, $contact, $context);

        // 2. Opportunity tokens: {{opportunity.name}}, {{opportunity.monetary_value}}, {{opportunity.stage}}, etc.
        if (str_contains($template, '{{opportunity.')) {
            $deal = \App\Modules\Pipelines\Models\Deal::where('workspace_id', $contact->workspace_id)
                ->where('contact_id', $contact->id)
                ->with(['pipeline', 'stage', 'assigned_user'])
                ->latest()
                ->first();

            if ($deal) {
                $template = str_replace([
                    '{{opportunity.name}}',
                    '{{opportunity.monetary_value}}',
                    '{{opportunity.value}}',
                    '{{opportunity.pipeline}}',
                    '{{opportunity.pipeline_name}}',
                    '{{opportunity.stage}}',
                    '{{opportunity.stage_name}}',
                    '{{opportunity.status}}',
                    '{{opportunity.assigned_user}}',
                ], [
                    $deal->name,
                    number_format((float) $deal->monetary_value, 2),
                    number_format((float) $deal->monetary_value, 2),
                    $deal->pipeline->name ?? 'Default Pipeline',
                    $deal->pipeline->name ?? 'Default Pipeline',
                    $deal->stage->name ?? 'Default Stage',
                    $deal->stage->name ?? 'Default Stage',
                    strtoupper($deal->status),
                    $deal->assigned_user->name ?? 'Unassigned',
                ], $template);
            }
        }

        // 3. Appointment tokens: {{appointment.title}}, {{appointment.start_time}}, {{appointment.location}}, etc.
        if (str_contains($template, '{{appointment.')) {
            $appointment = null;
            if (($context['_appointment_instance'] ?? null) instanceof \App\Modules\Calendars\Models\Appointment) {
                $appointment = $context['_appointment_instance'];
            } elseif (($context['appointment'] ?? null) instanceof \App\Modules\Calendars\Models\Appointment) {
                $appointment = $context['appointment'];
            } else {
                $appointmentId = $context['appointment_id'] ?? null;
                try {
                    $appointment = $appointmentId
                        ? \App\Modules\Calendars\Models\Appointment::with(['calendar', 'assignedUser'])->find($appointmentId)
                        : \App\Modules\Calendars\Models\Appointment::where('workspace_id', $contact->workspace_id)
                            ->where('contact_id', $contact->id)
                            ->with(['calendar', 'assignedUser'])
                            ->latest()
                            ->first();
                } catch (\Throwable $e) {
                    $appointment = null;
                }
            }

            if ($appointment) {
                $isHtml = preg_match('/<(?:p|div|table|html|body|br|span|h[1-6]|a)\b/i', $template);
                $calendarLinksBlock = $isHtml ? $appointment->getCalendarLinksHtml() : $appointment->getCalendarLinksText();

                $template = str_replace([
                    '{{appointment.title}}',
                    '{{appointment.calendar_name}}',
                    '{{appointment.date}}',
                    '{{appointment.start_time}}',
                    '{{appointment.end_time}}',
                    '{{appointment.time}}',
                    '{{appointment.timezone}}',
                    '{{appointment.location}}',
                    '{{appointment.meeting_join_url}}',
                    '{{appointment.staff_name}}',
                    '{{appointment.reschedule_url}}',
                    '{{appointment.reschedule_link}}',
                    '{{appointment.cancel_url}}',
                    '{{appointment.cancel_link}}',
                    '{{appointment.add_to_google_calendar}}',
                    '{{appointment.google_calendar_url}}',
                    '{{appointment.add_to_outlook}}',
                    '{{appointment.outlook_calendar_url}}',
                    '{{appointment.add_to_ical}}',
                    '{{appointment.ical_url}}',
                    '{{appointment.calendar_links}}',
                    '{{appointment.action_links}}',
                    '{{appointment.status}}',
                    '{{appointment.notes}}',
                ], [
                    $appointment->title,
                    $appointment->calendar?->name ?? 'Calendar',
                    $appointment->start_at ? $appointment->start_at->format('Y-m-d') : '',
                    $appointment->start_at ? $appointment->start_at->format('g:i A') : '',
                    $appointment->end_at ? $appointment->end_at->format('g:i A') : '',
                    $appointment->start_at ? $appointment->start_at->format('g:i A') : '',
                    $appointment->timezone ?? 'UTC',
                    $appointment->location ?? 'Online',
                    $appointment->meeting_join_url ?? '#',
                    $appointment->assignedUser?->name ?? 'Host Staff',
                    $appointment->reschedule_url,
                    $appointment->reschedule_url,
                    $appointment->cancel_url,
                    $appointment->cancel_url,
                    $appointment->google_calendar_url,
                    $appointment->google_calendar_url,
                    $appointment->outlook_calendar_url,
                    $appointment->outlook_calendar_url,
                    $appointment->ical_url,
                    $appointment->ical_url,
                    $calendarLinksBlock,
                    $calendarLinksBlock,
                    $appointment->status,
                    $appointment->notes ?? '',
                ], $template);
            } elseif (! empty($context['appointment_title']) || ! empty($context['reschedule_url']) || ! empty($context['add_to_google_calendar'])) {
                $isHtml = preg_match('/<(?:p|div|table|html|body|br|span|h[1-6]|a)\b/i', $template);
                $calendarLinksBlock = $isHtml ? ($context['calendar_links_html'] ?? '') : ($context['calendar_links_text'] ?? '');

                $template = str_replace([
                    '{{appointment.title}}',
                    '{{appointment.calendar_name}}',
                    '{{appointment.date}}',
                    '{{appointment.start_time}}',
                    '{{appointment.end_time}}',
                    '{{appointment.time}}',
                    '{{appointment.timezone}}',
                    '{{appointment.location}}',
                    '{{appointment.meeting_join_url}}',
                    '{{appointment.staff_name}}',
                    '{{appointment.reschedule_url}}',
                    '{{appointment.reschedule_link}}',
                    '{{appointment.cancel_url}}',
                    '{{appointment.cancel_link}}',
                    '{{appointment.add_to_google_calendar}}',
                    '{{appointment.google_calendar_url}}',
                    '{{appointment.add_to_outlook}}',
                    '{{appointment.outlook_calendar_url}}',
                    '{{appointment.add_to_ical}}',
                    '{{appointment.ical_url}}',
                    '{{appointment.calendar_links}}',
                    '{{appointment.action_links}}',
                    '{{appointment.status}}',
                    '{{appointment.notes}}',
                ], [
                    $context['appointment_title'] ?? '',
                    $context['calendar_name'] ?? 'Calendar',
                    $context['appointment_date'] ?? '',
                    $context['appointment_time'] ?? '',
                    $context['appointment_end_time'] ?? '',
                    $context['appointment_time'] ?? '',
                    $context['appointment_timezone'] ?? 'UTC',
                    $context['appointment_location'] ?? 'Online',
                    $context['meeting_join_url'] ?? '#',
                    $context['host_staff_name'] ?? 'Host Staff',
                    $context['reschedule_url'] ?? '#',
                    $context['reschedule_link'] ?? ($context['reschedule_url'] ?? '#'),
                    $context['cancel_url'] ?? '#',
                    $context['cancel_link'] ?? ($context['cancel_url'] ?? '#'),
                    $context['add_to_google_calendar'] ?? '#',
                    $context['google_calendar_url'] ?? ($context['add_to_google_calendar'] ?? '#'),
                    $context['add_to_outlook'] ?? '#',
                    $context['outlook_calendar_url'] ?? ($context['add_to_outlook'] ?? '#'),
                    $context['add_to_ical'] ?? '#',
                    $context['ical_url'] ?? ($context['add_to_ical'] ?? '#'),
                    $calendarLinksBlock,
                    $calendarLinksBlock,
                    $context['appointment_status'] ?? '',
                    $context['appointment_notes'] ?? '',
                ], $template);
            }
        }

        // 4. Funnel tokens: {{funnel.name}}, {{funnel.step_name}}, {{funnel.variant}}, {{funnel.order_amount}}, etc.
        if (str_contains($template, '{{funnel.')) {
            $template = str_replace([
                '{{funnel.name}}',
                '{{funnel.step_name}}',
                '{{funnel.variant}}',
                '{{funnel.order_amount}}',
                '{{funnel.order_total}}',
                '{{funnel.bump_title}}',
                '{{funnel.bump_price}}',
                '{{funnel.product_name}}',
                '{{funnel.next_step_url}}',
            ], [
                (string) ($context['funnel_name'] ?? ''),
                (string) ($context['step_name'] ?? ''),
                (string) ($context['variant'] ?? 'A'),
                (string) ($context['order_amount'] ?? ($context['order_total'] ?? '')),
                (string) ($context['order_total'] ?? ($context['order_amount'] ?? '')),
                (string) ($context['bump_title'] ?? ''),
                (string) ($context['bump_price'] ?? ''),
                (string) ($context['product_name'] ?? ($context['upsell_product'] ?? '')),
                (string) ($context['redirect_url'] ?? ($context['next_step_url'] ?? '')),
            ], $template);
        }

        // 5. Inbound Message tokens: {{message.body}}, {{message.text}}, {{message.content}}
        if (str_contains($template, '{{message.')) {
            $msgBody = (string) ($context['message_body'] ?? ($context['message'] ?? ($context['body'] ?? '')));
            $template = str_replace([
                '{{message.body}}',
                '{{message.text}}',
                '{{message.content}}',
            ], $msgBody, $template);
        }

        // 6. Trigger name token: {{trigger.name}}
        if (str_contains($template, '{{trigger.name}}')) {
            $triggerName = (string) ($context['trigger_name'] ?? ($context['trigger'] ?? ''));
            $template = str_replace('{{trigger.name}}', $triggerName, $template);
        }

        return $template;
    }

    // ─── Existing helpers ────────────────────────────────────────────────────

    private function resolveOrCreateConversation(Contact $contact, ChannelAccount $account, string $channel = 'whatsapp'): Conversation
    {
        return Conversation::firstOrCreate(
            [
                'workspace_id' => $account->workspace_id,
                'channel_account_id' => $account->id,
                'contact_id' => $contact->id,
            ],
            [
                'status' => 'open',
                'unread_count' => 0,
                // WhatsApp/SMS address the contact by phone; Messenger/Instagram require an
                // existing thread (PSID/IGSID) so they never reach this create path.
                'external_thread_id' => in_array($channel, ['whatsapp', 'sms'], true) ? $contact->phone_e164 : null,
            ]
        );
    }

    private function executeWait(array $data, AutomationRun $run, array $context = []): array
    {
        $waitType = $data['wait_type'] ?? 'delay';

        // 1. Event / Appointment or Invoice Due Date relative wait
        if ($waitType === 'event_relative' || $waitType === 'event_appointment' || $waitType === 'invoice_due_date' || ! empty($data['event_target'])) {
            $eventTarget = $data['event_target'] ?? 'before_start';
            $eventTiming = $data['event_timing'] ?? (str_starts_with($eventTarget, 'after') ? 'after' : (str_starts_with($eventTarget, 'before') ? 'before' : 'at_time'));

            // Calculate multi-unit offset minutes
            if (isset($data['offset_days']) || isset($data['offset_hours']) || isset($data['offset_minutes'])) {
                $offsetMinutes = ((int) ($data['offset_days'] ?? 0)) * 1440
                    + ((int) ($data['offset_hours'] ?? 0)) * 60
                    + ((int) ($data['offset_minutes'] ?? 0));
            } else {
                $amount = max(0, (int) ($data['amount'] ?? 1));
                $unit = $data['unit'] ?? 'hours';
                $offsetMinutes = match ($unit) {
                    'days' => $amount * 1440,
                    'hours' => $amount * 60,
                    default => $amount,
                };
            }

            // Determine reference timestamp
            $refTimeStr = null;
            if ($waitType === 'invoice_due_date' || ($data['scheduled_what_type'] ?? '') === 'invoice_due_date') {
                // Find latest open invoice for this contact
                $invoice = \Illuminate\Support\Facades\DB::table('invoices')
                    ->where('workspace_id', $run->automation->workspace_id)
                    ->where('contact_id', $run->contact_id)
                    ->whereIn('status', ['unpaid', 'pending', 'overdue'])
                    ->latest()
                    ->first();
                $refTimeStr = $invoice?->due_date ?? $invoice?->due_at;
            } else {
                if (str_contains($eventTarget, 'end')) {
                    $refTimeStr = $context['appointment_end_at'] ?? $context['appointment']['end_time'] ?? $context['appointment_end'] ?? null;
                } else {
                    $refTimeStr = $context['appointment_start_at'] ?? $context['appointment']['start_time'] ?? $context['appointment_start'] ?? $context['event_time'] ?? null;
                }

                if (! $refTimeStr && $run->contact_id) {
                    $appointment = \App\Modules\Calendars\Models\Appointment::where('workspace_id', $run->automation->workspace_id)
                        ->where('contact_id', $run->contact_id)
                        ->latest()
                        ->first();
                    if ($appointment) {
                        $refTimeStr = str_contains($eventTarget, 'end')
                            ? $appointment->end_at?->toIso8601String()
                            : $appointment->start_at?->toIso8601String();
                    }
                }
            }

            if ($refTimeStr) {
                try {
                    $refTime = \Carbon\Carbon::parse($refTimeStr);
                    if ($eventTiming === 'at_time') {
                        $targetTime = $refTime->copy();
                    } elseif ($eventTiming === 'after') {
                        $targetTime = $refTime->copy()->addMinutes($offsetMinutes);
                    } else {
                        $targetTime = $refTime->copy()->subMinutes($offsetMinutes);
                    }

                    // ── Past Date Fallback Handling ──────────────────────────────────
                    if (now()->gte($targetTime)) {
                        $pastAction = $data['past_action'] ?? 'continue';

                        if ($pastAction === 'exit') {
                            return [
                                'status' => 'exited',
                                'stop_flow' => true,
                                'message' => "Target event time ({$targetTime->toIso8601String()}) was in the past. Exited contact from workflow per policy.",
                            ];
                        }

                        if ($pastAction === 'go_to_step' && ! empty($data['past_target_step_id'])) {
                            $targetNodeId = $data['past_target_step_id'];
                            return [
                                'status' => 'ok',
                                'next_node_id' => $targetNodeId,
                                'message' => "Target event time was in past. Redirected to step #{$targetNodeId}.",
                            ];
                        }

                        if ($pastAction === 'skip_outbound') {
                            $context['skip_outbound_until_next_wait'] = true;
                            $run->update(['context' => $context]);
                            return [
                                'status' => 'ok',
                                'context_updates' => ['skip_outbound_until_next_wait' => true],
                                'message' => "Target event time has passed. Skipping outbound reminders until next event or wait.",
                            ];
                        }

                        return [
                            'status' => 'ok',
                            'message' => "Target event time ({$targetTime->toIso8601String()}) has arrived. Continuing execution.",
                        ];
                    }

                    // Clear any previous skip_outbound flag when moving to future wait
                    if (! empty($context['skip_outbound_until_next_wait'])) {
                        unset($context['skip_outbound_until_next_wait']);
                        $run->update(['context' => $context]);
                    }

                    // Apply Advance Business Hours Window if enabled
                    if (! empty($data['advance_window_enabled'])) {
                        $targetTime = $this->applyAdvanceWindow($targetTime, $data, $run);
                    }

                    // Schedule wakeup at target time
                    $automation = $run->automation;
                    $edges = collect($automation->edges ?? []);
                    $nextEdge = $edges->first(fn ($e) => $e['source'] === $run->current_node_id);
                    $nextNodeId = $nextEdge['target'] ?? null;

                    $run->update([
                        'status' => 'waiting',
                        'resume_node_id' => $nextNodeId,
                    ]);

                    dispatch(new ExecuteAutomationRunJob($run->id))
                        ->delay($targetTime)
                        ->onQueue('automation');

                    return [
                        'status' => 'waiting',
                        'message' => "Waiting until {$targetTime->toIso8601String()} ({$eventTiming} event).",
                    ];
                } catch (\Throwable $e) {
                    // Fall through to standard delay if parsing fails
                }
            }
        }

        // 2. Standard Time Delay
        $amount = (int) ($data['amount'] ?? 1);
        $unit = $data['unit'] ?? 'minutes';
        $delayMinutes = match ($unit) {
            'seconds' => max(1, (int) round($amount / 60)),
            'hours' => $amount * 60,
            'days' => $amount * 1440,
            default => $amount,
        };

        $targetTime = now()->addMinutes($delayMinutes);

        // Apply Advance Business Hours Window if enabled
        if (! empty($data['advance_window_enabled'])) {
            $targetTime = $this->applyAdvanceWindow($targetTime, $data, $run);
        }

        // Clear previous skip_outbound flag when arriving at a new wait step
        if (! empty($context['skip_outbound_until_next_wait'])) {
            unset($context['skip_outbound_until_next_wait']);
            $run->update(['context' => $context]);
        }

        // Find the next node after this wait node so the wakeup job resumes there
        $automation = $run->automation;
        $edges = collect($automation->edges ?? []);
        $nextEdge = $edges->first(fn ($e) => $e['source'] === $run->current_node_id);
        $nextNodeId = $nextEdge['target'] ?? null;

        // Persist the resume cursor and mark the run as waiting
        $run->update([
            'status' => 'waiting',
            'resume_node_id' => $nextNodeId,
        ]);

        // Schedule the wakeup
        dispatch(new ExecuteAutomationRunJob($run->id))
            ->delay($targetTime)
            ->onQueue('automation');

        return ['status' => 'waiting', 'message' => "Waiting until {$targetTime->toIso8601String()} ({$amount} {$unit})."];
    }

    private function applyAdvanceWindow(\Carbon\Carbon $targetTime, array $data, ?AutomationRun $run = null): \Carbon\Carbon
    {
        $allowedDays = $data['allowed_days'] ?? ['mon', 'tue', 'wed', 'thu', 'fri'];
        $fromTime = $data['window_from'] ?? '09:00';
        $toTime = $data['window_to'] ?? '18:00';

        $tz = $data['window_timezone'] ?? $run?->automation?->workspace?->timezone ?? config('app.timezone', 'UTC');
        $local = $targetTime->copy()->setTimezone($tz);

        $fromParts = array_map('intval', explode(':', $fromTime));
        $toParts = array_map('intval', explode(':', $toTime));
        $fromHour = $fromParts[0] ?? 9;
        $fromMin = $fromParts[1] ?? 0;
        $toHour = $toParts[0] ?? 18;
        $toMin = $toParts[1] ?? 0;

        for ($i = 0; $i < 14; $i++) {
            $dayCode = strtolower($local->format('D'));
            $isAllowedDay = in_array($dayCode, $allowedDays, true);

            $currentMinutes = $local->hour * 60 + $local->minute;
            $windowFromMinutes = $fromHour * 60 + $fromMin;
            $windowToMinutes = $toHour * 60 + $toMin;

            if (! $isAllowedDay || $currentMinutes > $windowToMinutes) {
                // Move to next day at window start
                $local->addDay()->setTime($fromHour, $fromMin, 0);
                continue;
            }

            if ($currentMinutes < $windowFromMinutes) {
                $local->setTime($fromHour, $fromMin, 0);
                break;
            }

            // Within window on an allowed day
            break;
        }

        return $local->setTimezone('UTC');
    }

    private function executeTagAction(array $data, AutomationRun $run, string $action, array $context = []): array
    {
        $tagName = $data['tag'] ?? null;
        if (! $tagName || ! $run->contact_id) {
            return ['status' => 'skipped', 'message' => 'No tag or contact.'];
        }
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $tagName = $this->renderTokens($tagName, $contact, $context);
        $tag = ContactTag::firstOrCreate(
            ['workspace_id' => $contact->workspace_id, 'name' => $tagName],
        );
        if ($action === 'add') {
            $contact->tags()->syncWithoutDetaching([$tag->id]);
        } else {
            $contact->tags()->detach($tag->id);
        }

        return ['status' => 'ok', 'message' => ucfirst($action)." tag '{$tagName}'."];
    }

    private function executeUpdateContact(array $data, AutomationRun $run, array $context): array
    {
        if (! $run->contact_id) {
            return ['status' => 'skipped', 'message' => 'No contact.'];
        }
        $field = $data['field'] ?? null;
        if (! $field) {
            return ['status' => 'skipped', 'message' => 'No field specified.'];
        }
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $value = $this->renderTokens((string) ($data['value'] ?? ''), $contact, $context);

        // Map the builder's friendly field names onto real Contact columns; anything
        // unrecognised (incl. "notes") is stored under custom_fields.
        switch ($field) {
            case 'name':
                $parts = preg_split('/\s+/', trim($value), 2);
                $contact->first_name = $parts[0] ?? '';
                $contact->last_name = $parts[1] ?? '';
                break;
            case 'first_name':
                $contact->first_name = $value;
                break;
            case 'last_name':
                $contact->last_name = $value;
                break;
            case 'phone':
            case 'phone_e164':
                $contact->phone_e164 = $value;
                break;
            case 'email':
                $contact->email = $value;
                break;
            case 'language':
                $contact->language = $value;
                break;
            case 'country':
                $contact->country = $value;
                break;
            default:
                $key = str_starts_with($field, 'custom.') ? substr($field, 7) : $field;
                $custom = $contact->custom_fields ?? [];
                $custom[$key] = $value;
                $contact->custom_fields = $custom;
                break;
        }
        $contact->save();

        return ['status' => 'ok', 'message' => "Updated contact.{$field}."];
    }

    private function executeWebhook(array $data, AutomationRun $run, array $context): array
    {
        $contact = $run->contact_id ? Contact::find($run->contact_id) : null;
        $url = (string) ($data['url'] ?? '');
        if ($url === '') {
            return ['status' => 'error', 'message' => 'Webhook URL missing.'];
        }
        if ($contact) {
            $url = $this->renderTokens($url, $contact, $context);
        }

        $method = strtolower($data['method'] ?? 'POST');
        if (! in_array($method, ['get', 'post', 'put', 'patch', 'delete'], true)) {
            $method = 'post';
        }

        // The builder stores headers/payload as JSON strings — decode + token-render them.
        $headers = $this->decodeJsonField($data['headers'] ?? null, $contact, $context);
        $payload = $this->decodeJsonField($data['payload'] ?? null, $contact, $context);

        $request = Http::timeout(10);
        if (! empty($headers)) {
            $request = $request->withHeaders($headers);
        }

        $response = $method === 'get'
            ? $request->get($url, $payload)
            : $request->{$method}($url, array_merge($payload, ['context' => $context]));

        return [
            'status' => 'ok',
            'message' => "Webhook {$method} {$url} → {$response->status()}",
            'output' => ['status' => $response->status()],
            'context_update' => ['webhook_status' => $response->status()],
        ];
    }

    /** Decode a JSON-string (or already-array) config field into an array, token-rendered. */
    private function decodeJsonField(mixed $v, ?Contact $contact, array $context): array
    {
        if (is_array($v)) {
            return $v;
        }
        if (! is_string($v) || trim($v) === '') {
            return [];
        }
        $rendered = $contact ? $this->renderTokens($v, $contact, $context) : $v;
        $decoded = json_decode($rendered, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function executeCondition(array $data, AutomationRun $run, array $context): array
    {
        $contact = $run->contact_id ? Contact::find($run->contact_id) : null;

        return $this->evaluateConditionNode($data, $contact, $context);
    }

    /**
     * Evaluate a condition node supporting multi-branches (GHL style) or legacy 2-way Yes/No.
     */
    public function evaluateConditionNode(array $data, ?Contact $contact, array $context): array
    {
        // 1. Multi-branch condition mode (GHL style)
        if (! empty($data['branches']) && is_array($data['branches'])) {
            foreach ($data['branches'] as $index => $branch) {
                $branchId = $branch['id'] ?? "branch_{$index}";
                $branchName = $branch['name'] ?? 'Branch '.($index + 1);
                $conditions = $branch['conditions'] ?? [];
                $segments = $branch['segments'] ?? [];

                $branchPassed = false;

                if (! empty($conditions)) {
                    if (count($conditions) > 1) {
                        // When a branch contains multiple condition rules, each rule acts as its own branch node on canvas
                        foreach ($conditions as $cIdx => $cond) {
                            $cPassed = $this->evaluateSingleCondition($cond, $contact, $context);
                            if ($cPassed) {
                                $handleId = $cIdx === 0 ? $branchId : "{$branchId}_{$cIdx}";
                                $condVal = $cond['value'] ?? ($cond['field'] ?? 'Rule '.($cIdx + 1));

                                return [
                                    'status' => 'ok',
                                    'branch' => $handleId,
                                    'branch_base' => $branchId,
                                    'message' => "Condition: branch '{$branchName}' rule '{$condVal}' matched.",
                                ];
                            }
                        }
                    } else {
                        $cPassed = $this->evaluateSingleCondition($conditions[0], $contact, $context);
                        if ($cPassed) {
                            return [
                                'status' => 'ok',
                                'branch' => $branchId,
                                'branch_base' => $branchId,
                                'message' => "Condition: branch '{$branchName}' matched.",
                            ];
                        }
                    }
                } elseif (! empty($segments)) {
                    foreach ($segments as $sIdx => $segment) {
                        $segConditions = $segment['conditions'] ?? [];
                        $segPassed = false;
                        foreach ($segConditions as $scIdx => $sCond) {
                            $scPassed = $this->evaluateSingleCondition($sCond, $contact, $context);
                            if ($scIdx === 0) {
                                $segPassed = $scPassed;
                            } else {
                                $scLogic = strtoupper($sCond['logic'] ?? 'AND');
                                $segPassed = ($scLogic === 'OR') ? ($segPassed || $scPassed) : ($segPassed && $scPassed);
                            }
                        }
                        if ($sIdx === 0) {
                            $branchPassed = $segPassed;
                        } else {
                            $sLogic = strtoupper($segment['logic'] ?? ($segment['type'] ?? 'AND'));
                            $branchPassed = ($sLogic === 'OR') ? ($branchPassed || $segPassed) : ($branchPassed && $segPassed);
                        }
                    }

                    if ($branchPassed) {
                        return [
                            'status' => 'ok',
                            'branch' => $branchId,
                            'branch_base' => $branchId,
                            'message' => "Condition: branch '{$branchName}' matched.",
                        ];
                    }
                }
            }

            // Fallback: None branch
            return [
                'status' => 'ok',
                'branch' => 'none',
                'message' => "Condition: no branch matched, taking 'None' fallback.",
            ];
        }

        // 2. Legacy / 2-way Yes/No condition
        $passed = $this->evaluateSingleCondition($data, $contact, $context);

        return $this->conditionResult($passed, $data['field'] ?? null, $data['operator'] ?? 'equals', $data['value'] ?? null);
    }

    /**
     * Pure boolean evaluation of a single condition against contact + context.
     */
    public function evaluateSingleCondition(array $data, ?Contact $contact, array $context): bool
    {
        $field = $data['field'] ?? null;
        $operator = $data['operator'] ?? 'equals';
        $value = $data['value'] ?? null;

        if (! $field) {
            return false;
        }

        // Tag membership check
        if ($field === 'contact.tag') {
            $has = ($contact && $contact->exists) ? $contact->tags()->where('name', $value)->exists() : false;

            return in_array($operator, ['not_equals', 'is_not', 'not_contains', 'not_exists'], true) ? ! $has : $has;
        }

        // Workflow Trigger matching
        if (in_array($field, ['trigger.name', 'workflow_trigger', 'trigger_name', 'Workflow Trigger'], true)) {
            $actual = $context['trigger_name'] ?? $context['trigger_type'] ?? '';

            return match ($operator) {
                'equals', 'is', 'Is' => strcasecmp((string) $actual, (string) $value) === 0,
                'not_equals', 'is_not', 'Is not' => strcasecmp((string) $actual, (string) $value) !== 0,
                'contains' => stripos((string) $actual, (string) $value) !== false,
                'not_contains' => stripos((string) $actual, (string) $value) === false,
                default => strcasecmp((string) $actual, (string) $value) === 0,
            };
        }

        if (in_array($field, ['trigger.type', 'trigger_type'], true)) {
            $actual = $context['trigger_type'] ?? '';

            return match ($operator) {
                'equals', 'is', 'Is' => (string) $actual === (string) $value,
                'not_equals', 'is_not', 'Is not' => (string) $actual !== (string) $value,
                default => (string) $actual === (string) $value,
            };
        }

        // Form fields and custom data
        if (str_starts_with($field, 'form.field.') || str_starts_with($field, 'custom.')) {
            $cleanKey = (!empty($data['custom_key']) && ($field === 'custom.field' || $field === 'form.field'))
                ? $data['custom_key']
                : preg_replace('/^(form\.field\.|custom\.)/', '', $field);
            $submitted = $context['submitted_data'] ?? [];
            $actual = $submitted[$cleanKey] ?? ($context[$cleanKey] ?? ($contact?->custom_fields[$cleanKey] ?? null));
        } elseif ($field === 'form.name' || $field === 'form_name') {
            $actual = $context['form_name'] ?? '';
        } elseif ($field === 'form.slug' || $field === 'form_slug') {
            $actual = $context['form_slug'] ?? '';
        } elseif ($field === 'contact.name') {
            $actual = optional($contact)->full_name;
        } elseif (str_starts_with($field, 'contact.')) {
            $contactKey = str_replace('contact.', '', $field);
            if ($contactKey === 'phone' || $contactKey === 'whatsapp') {
                $actual = optional($contact)->phone_e164;
            } else {
                $actual = optional($contact)->{$contactKey} ?? ($contact?->custom_fields[$contactKey] ?? null);
            }
        } elseif ($field === 'message.body') {
            $actual = $context['message_body'] ?? null;
        } elseif (str_starts_with($field, 'appointment.')) {
            $aptKey = str_replace('appointment.', '', $field);
            if ($aptKey === 'status') {
                $actual = $context['appointment_status'] ?? ($context['status'] ?? null);
                if ($actual === null && $contact && $contact->exists) {
                    $apt = \App\Modules\Calendars\Models\Appointment::where('contact_id', $contact->id)->latest()->first();
                    $actual = $apt?->status;
                }
            } elseif ($aptKey === 'calendar_id') {
                $actual = $context['calendar_id'] ?? null;
                if ($actual === null && $contact && $contact->exists) {
                    $apt = \App\Modules\Calendars\Models\Appointment::where('contact_id', $contact->id)->latest()->first();
                    $actual = $apt?->calendar_id;
                }
            } elseif ($aptKey === 'title') {
                $actual = $context['appointment_title'] ?? ($context['title'] ?? null);
                if ($actual === null && $contact && $contact->exists) {
                    $apt = \App\Modules\Calendars\Models\Appointment::where('contact_id', $contact->id)->latest()->first();
                    $actual = $apt?->title;
                }
            } elseif ($aptKey === 'location') {
                $actual = $context['appointment_location'] ?? ($context['location'] ?? null);
                if ($actual === null && $contact && $contact->exists) {
                    $apt = \App\Modules\Calendars\Models\Appointment::where('contact_id', $contact->id)->latest()->first();
                    $actual = $apt?->location;
                }
            } else {
                $actual = $context[$field] ?? ($context[$aptKey] ?? null);
                if ($actual === null && $contact && $contact->exists) {
                    $apt = \App\Modules\Calendars\Models\Appointment::where('contact_id', $contact->id)->latest()->first();
                    $actual = $apt?->{$aptKey};
                }
            }
        } elseif (str_starts_with($field, 'invoice.')) {
            $invKey = str_replace('invoice.', '', $field);
            if ($invKey === 'status') {
                $actual = $context['invoice_status'] ?? ($context['status'] ?? null);
                if ($actual === null && $contact && $contact->exists) {
                    $inv = \App\Modules\Agency\Models\AgencyInvoice::where('contact_id', $contact->id)->latest()->first();
                    $actual = $inv?->status;
                }
            } elseif ($invKey === 'total' || $invKey === 'amount') {
                $actual = $context['invoice_total'] ?? ($context['total'] ?? ($context['amount'] ?? null));
                if ($actual === null && $contact && $contact->exists) {
                    $inv = \App\Modules\Agency\Models\AgencyInvoice::where('contact_id', $contact->id)->latest()->first();
                    $actual = $inv?->total;
                }
            } else {
                $actual = $context[$field] ?? ($context[$invKey] ?? null);
                if ($actual === null && $contact && $contact->exists) {
                    $inv = \App\Modules\Agency\Models\AgencyInvoice::where('contact_id', $contact->id)->latest()->first();
                    $actual = $inv?->{$invKey};
                }
            }
        } elseif (str_starts_with($field, 'funnel.')) {
            $funnelKey = str_replace('funnel.', '', $field);
            $actual = match ($funnelKey) {
                'id', 'funnel_id' => $context['funnel_id'] ?? null,
                'name', 'funnel_name' => $context['funnel_name'] ?? null,
                'step_id', 'funnel_step_id' => $context['funnel_step_id'] ?? null,
                'step_name' => $context['step_name'] ?? null,
                'step_type' => $context['step_type'] ?? null,
                'variant' => $context['variant'] ?? 'A',
                'order_bump', 'has_order_bump', 'order_bump_taken' => !empty($context['has_order_bump']) ? 'yes' : 'no',
                'total_amount', 'order_total', 'order_amount' => $context['order_total'] ?? ($context['order_amount'] ?? 0),
                default => $context[$funnelKey] ?? ($context[$field] ?? null),
            };
        } elseif (str_starts_with($field, 'opportunity.')) {
            $oppKey = str_replace('opportunity.', '', $field);
            if ($oppKey === 'status') {
                $actual = $context['new_status'] ?? ($context['status'] ?? null);
                if ($actual === null && $contact && $contact->exists) {
                    $deal = \App\Modules\Pipelines\Models\Deal::where('contact_id', $contact->id)->latest()->first();
                    $actual = $deal?->status;
                }
            } elseif ($oppKey === 'stage_id') {
                $actual = $context['stage_id'] ?? null;
                if ($actual === null && $contact && $contact->exists) {
                    $deal = \App\Modules\Pipelines\Models\Deal::where('contact_id', $contact->id)->latest()->first();
                    $actual = $deal?->stage_id;
                }
            } elseif ($oppKey === 'pipeline_id') {
                $actual = $context['pipeline_id'] ?? null;
                if ($actual === null && $contact && $contact->exists) {
                    $deal = \App\Modules\Pipelines\Models\Deal::where('contact_id', $contact->id)->latest()->first();
                    $actual = $deal?->pipeline_id;
                }
            } elseif ($oppKey === 'lost_reason') {
                $actual = $context['lost_reason'] ?? null;
                if ($actual === null && $contact && $contact->exists) {
                    $deal = \App\Modules\Pipelines\Models\Deal::where('contact_id', $contact->id)->latest()->first();
                    $actual = $deal?->lost_reason;
                }
            } elseif ($oppKey === 'monetary_value' || $oppKey === 'value') {
                $actual = $context['opportunity_value'] ?? null;
                if ($actual === null && $contact && $contact->exists) {
                    $deal = \App\Modules\Pipelines\Models\Deal::where('contact_id', $contact->id)->latest()->first();
                    $actual = $deal?->monetary_value;
                }
            } else {
                $actual = $context[$field] ?? ($context[$oppKey] ?? null);
            }
        } elseif (str_starts_with($field, 'context.')) {
            $actual = $context[str_replace('context.', '', $field)] ?? null;
        } else {
            $actual = $context[$field] ?? null;
        }

        // Normalized boolean / consent matching (e.g. yes/no with boolean true/false or 1/0)
        if (in_array(strtolower((string) $value), ['yes', 'no'], true) && (is_bool($actual) || is_numeric($actual) || is_null($actual) || in_array(strtolower((string) $actual), ['yes', 'no', 'true', 'false', 'on', 'off'], true))) {
            $actualBool = filter_var($actual, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (in_array(strtolower((string) $actual), ['yes', 'on', '1'], true));
            $valBool = strtolower((string) $value) === 'yes';
            if (in_array($operator, ['equals', 'is', 'Is'], true)) {
                return $actualBool === $valBool;
            }
            if (in_array($operator, ['not_equals', 'is_not', 'Is not'], true)) {
                return $actualBool !== $valBool;
            }
        }

        return match ($operator) {
            'equals', 'is', 'Is' => strcasecmp((string) $actual, (string) $value) === 0,
            'not_equals', 'is_not', 'Is not' => strcasecmp((string) $actual, (string) $value) !== 0,
            'contains' => $value !== null && stripos((string) $actual, (string) $value) !== false,
            'not_contains' => $value === null || stripos((string) $actual, (string) $value) === false,
            'exists' => $actual !== null && $actual !== '' && $actual !== false,
            'not_exists' => $actual === null || $actual === '' || $actual === false,
            'gt' => (float) $actual > (float) $value,
            'lt' => (float) $actual < (float) $value,
            'gte', '>=' => (float) $actual >= (float) $value,
            'lte', '<=' => (float) $actual <= (float) $value,
            default => strcasecmp((string) $actual, (string) $value) === 0,
        };
    }

    /**
     * Backward-compatible evaluation alias.
     */
    public function evaluateCondition(array $data, ?Contact $contact, array $context): bool
    {
        return $this->evaluateSingleCondition($data, $contact, $context);
    }

    private function conditionResult(bool $passed, ?string $field, string $operator, mixed $value): array
    {
        return [
            'status' => 'ok',
            'branch' => $passed ? 'true' : 'false',
            'message' => "Condition: {$field} {$operator} {$value} → ".($passed ? 'true' : 'false'),
        ];
    }

    // ─── SEND nodes ───────────────────────────────────────────────────────────

    private function executeSendTemplate(array $data, AutomationRun $run, array $context): array
    {
        $name = $data['template_name'] ?? ($data['template_ref'] ?? null);
        if (! $name) {
            return ['status' => 'error', 'message' => 'No template selected.'];
        }
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        $components = [];
        // Positional body variables ({{1}}, {{2}}, …). An array preserves blanks so the
        // index alignment is never broken; a legacy newline/comma string is split as a list.
        $vars = is_array($data['variables'] ?? null)
            ? array_map(fn ($v) => (string) $v, $data['variables'])
            : $this->toList($data['variables'] ?? []);
        if (! empty($vars)) {
            $params = array_map(fn ($v) => ['type' => 'text', 'text' => $this->renderTokens($v, $contact, $context)], $vars);
            $components[] = ['type' => 'body', 'parameters' => $params];
        }

        return $this->sendWhatsappPayload($run, 'template', null, ['template' => [
            'name' => $name,
            'language' => $data['language'] ?? 'en',
            'components' => $components,
        ]]);
    }

    private function executeSendMedia(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $type = in_array($data['media_type'] ?? 'image', ['image', 'video', 'document', 'audio'], true) ? $data['media_type'] : 'image';
        $channel = $this->pickChannel($data);

        // Messenger / Instagram drivers only carry image attachments.
        if (in_array($channel, ['messenger', 'instagram'], true) && $type !== 'image') {
            return ['status' => 'skipped', 'message' => ucfirst($channel).' supports image media only.'];
        }

        $link = $this->renderTokens((string) ($data['link'] ?? ''), $contact, $context);
        if ($link === '') {
            return ['status' => 'error', 'message' => 'Media link is required.'];
        }
        $caption = isset($data['caption']) ? $this->renderTokens((string) $data['caption'], $contact, $context) : null;
        $payload = ['link' => $link];
        if ($caption) {
            $payload['caption'] = $caption;
        }
        if (! empty($data['filename'])) {
            $payload['filename'] = (string) $data['filename'];
        }

        return $this->dispatchMessage($run, $channel, $type, $caption, $payload);
    }

    private function executeSendSequence(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $steps = $this->parseSteps($data['steps'] ?? []);
        if (empty($steps)) {
            return ['status' => 'skipped', 'message' => 'No steps configured.'];
        }

        $sent = 0;
        foreach ($steps as $step) {
            if ($step['kind'] === 'media') {
                $payload = ['link' => $this->renderTokens($step['link'] ?? '', $contact, $context)];
                if (! empty($step['caption'])) {
                    $payload['caption'] = $this->renderTokens($step['caption'], $contact, $context);
                }
                $res = $this->sendWhatsappPayload($run, $step['media_type'] ?? 'image', $payload['caption'] ?? null, $payload);
            } else {
                $res = $this->sendWhatsappPayload($run, 'text', $this->renderTokens($step['body'] ?? '', $contact, $context), null);
            }
            if (($res['status'] ?? '') === 'error') {
                return ['status' => 'error', 'message' => 'Sequence step failed: '.$res['message']];
            }
            if (($res['status'] ?? '') === 'ok') {
                $sent++;
            }
        }

        return ['status' => 'ok', 'message' => "Sent {$sent} sequence step(s)."];
    }

    private function executeQuickReplies(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $body = $this->renderTokens((string) ($data['body'] ?? ''), $contact, $context);
        $buttons = $this->toList($data['buttons'] ?? []);
        if ($body === '' || empty($buttons)) {
            return ['status' => 'error', 'message' => 'Body and at least one button are required.'];
        }

        return $this->sendWhatsappPayload($run, 'interactive', $body, ['interactive' => $this->buttonInteractive($body, $buttons)]);
    }

    private function executeListMessage(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $body = $this->renderTokens((string) ($data['body'] ?? ''), $contact, $context);
        $rows = $this->parseRows($data['rows'] ?? []);
        if ($body === '' || empty($rows)) {
            return ['status' => 'error', 'message' => 'Body and at least one list item are required.'];
        }

        $interactive = $this->listInteractive($body, (string) ($data['button_label'] ?? 'Menu'), (string) ($data['section_title'] ?? 'Options'), $rows);

        return $this->sendWhatsappPayload($run, 'interactive', $body, ['interactive' => $interactive]);
    }

    // ─── LISTEN nodes ─────────────────────────────────────────────────────────

    private function executeAskQuestion(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $question = $this->renderTokens((string) ($data['question'] ?? ''), $contact, $context);
        if ($question === '') {
            return ['status' => 'error', 'message' => 'Question text is required.'];
        }

        $send = $this->sendTextViaChannel($run, $data['channel'] ?? 'whatsapp', $question, 'automation');
        if (($send['status'] ?? '') !== 'ok') {
            // Could not deliver the question (e.g. no open Messenger/Instagram thread) — do not park.
            return $send;
        }

        // Park the run until the contact's next inbound message (see resumeAwaitingReplies()).
        $var = ($data['variable'] ?? '') ?: 'answer';
        $edges = collect($run->automation->edges ?? []);
        $nextEdge = $edges->first(fn ($e) => $e['source'] === $run->current_node_id);
        $run->update(['status' => 'waiting', 'resume_node_id' => $nextEdge['target'] ?? null]);

        return [
            'status' => 'waiting',
            'message' => "Asked question — waiting for reply → {{context.{$var}}}",
            'context_update' => ['_awaiting_reply' => true, '_reply_var' => $var],
        ];
    }

    // ─── LOGIC nodes ──────────────────────────────────────────────────────────

    private function executeRunSubflow(array $data, AutomationRun $run, array $context): array
    {
        $ref = $data['automation_uuid'] ?? ($data['automation_id'] ?? null);
        if (! $ref) {
            return ['status' => 'error', 'message' => 'No sub-flow selected.'];
        }
        if (! $run->contact_id) {
            return ['status' => 'skipped', 'message' => 'Sub-flows require a contact.'];
        }

        $target = Automation::where('workspace_id', $run->automation->workspace_id)
            ->where(fn ($q) => $q->where('uuid', $ref)->orWhere('id', $ref))
            ->first();

        if (! $target) {
            return ['status' => 'error', 'message' => 'Sub-flow not found.'];
        }
        if ((int) $target->id === (int) $run->automation_id) {
            return ['status' => 'skipped', 'message' => 'A flow cannot call itself.'];
        }
        if (! $target->isActive()) {
            return ['status' => 'skipped', 'message' => 'Sub-flow is not active.'];
        }

        $mode = $data['mode'] ?? 'fire_and_forget'; // 'wait_completion', 'fire_and_forget', 'handoff'
        $passContext = ! isset($data['pass_context']) || (bool) $data['pass_context'];
        $childContext = $passContext ? $context : [];

        // Determine next node in parent flow
        $edges = collect($run->automation->edges ?? []);
        $nextEdge = $edges->first(fn ($e) => $e['source'] === $run->current_node_id);
        $nextNodeId = $nextEdge['target'] ?? null;

        if ($mode === 'wait_completion') {
            $childContext['_parent_run_id'] = $run->id;

            $run->update([
                'status' => 'waiting',
                'resume_node_id' => $nextNodeId,
            ]);

            $this->triggerForContact($target, $run->contact_id, $childContext);

            return [
                'status' => 'waiting',
                'message' => "Sub-flow '{$target->name}' initiated; waiting for completion before continuing.",
            ];
        }

        if ($mode === 'handoff') {
            $this->triggerForContact($target, $run->contact_id, $childContext);

            return [
                'status' => 'ok',
                'branch' => '__halt__',
                'message' => "Handed off contact to sub-flow '{$target->name}'. Parent workflow completed.",
            ];
        }

        // Default 'fire_and_forget' (parallel execution)
        $this->triggerForContact($target, $run->contact_id, $childContext);

        return ['status' => 'ok', 'message' => "Triggered sub-flow '{$target->name}' in background."];
    }

    private function executeRemoveFromWorkflow(array $data, AutomationRun $run, array $context): array
    {
        $targetType = $data['target_type'] ?? 'current'; // 'current', 'specific', 'all'
        $contactId = $run->contact_id;
        $workspaceId = $run->automation->workspace_id ?? null;

        if ($targetType === 'current') {
            return [
                'status' => 'exited',
                'stop_flow' => true,
                'message' => 'Contact exited from this workflow.',
            ];
        }

        if ($targetType === 'specific' || $targetType === 'another') {
            $targetAutomationId = $data['target_automation_id'] ?? null;
            if (! $targetAutomationId) {
                return [
                    'status' => 'error',
                    'message' => 'Target automation is required for specific workflow removal.',
                ];
            }

            // Find target automation by id or uuid
            $targetAutomation = Automation::where(function ($q) use ($targetAutomationId) {
                $q->where('id', $targetAutomationId)->orWhere('uuid', $targetAutomationId);
            })->first();

            if (! $targetAutomation) {
                return [
                    'status' => 'skipped',
                    'message' => 'Target automation not found.',
                ];
            }

            $affectedRuns = AutomationRun::where('automation_id', $targetAutomation->id)
                ->where('contact_id', $contactId)
                ->whereIn('status', ['pending', 'waiting', 'running'])
                ->get();

            foreach ($affectedRuns as $r) {
                $r->update([
                    'status' => 'cancelled',
                    'completed_at' => now(),
                    'error' => 'Removed by workflow "'.$run->automation->name.'" (Step: Remove from Workflow)',
                ]);

                AutomationRunLog::create([
                    'run_id' => $r->id,
                    'node_id' => 'system',
                    'node_type' => 'remove_from_workflow',
                    'result' => 'ok',
                    'message' => 'Unenrolled/cancelled by automation "'.$run->automation->name.'".',
                ]);
            }

            return [
                'status' => 'ok',
                'message' => "Unenrolled contact from workflow '{$targetAutomation->name}' ({$affectedRuns->count()} active run(s) cancelled).",
            ];
        }

        if ($targetType === 'all_except_current') {
            $affectedRuns = AutomationRun::where('contact_id', $contactId)
                ->where('id', '!=', $run->id)
                ->whereIn('status', ['pending', 'waiting', 'running'])
                ->when($workspaceId, function ($q) use ($workspaceId) {
                    $q->whereHas('automation', fn ($aq) => $aq->where('workspace_id', $workspaceId));
                })
                ->get();

            foreach ($affectedRuns as $r) {
                $r->update([
                    'status' => 'cancelled',
                    'completed_at' => now(),
                    'error' => 'Removed by workflow "'.$run->automation->name.'" (Step: Remove from all workflows except current)',
                ]);

                AutomationRunLog::create([
                    'run_id' => $r->id,
                    'node_id' => 'system',
                    'node_type' => 'remove_from_workflow',
                    'result' => 'ok',
                    'message' => 'Unenrolled/cancelled by automation "'.$run->automation->name.'".',
                ]);
            }

            return [
                'status' => 'ok',
                'stop_flow' => false,
                'message' => "Unenrolled contact from all other workflows ({$affectedRuns->count()} active run(s) cancelled). Current workflow continues.",
            ];
        }

        if ($targetType === 'all') {
            $affectedRuns = AutomationRun::where('contact_id', $contactId)
                ->where('id', '!=', $run->id)
                ->whereIn('status', ['pending', 'waiting', 'running'])
                ->when($workspaceId, function ($q) use ($workspaceId) {
                    $q->whereHas('automation', fn ($aq) => $aq->where('workspace_id', $workspaceId));
                })
                ->get();

            foreach ($affectedRuns as $r) {
                $r->update([
                    'status' => 'cancelled',
                    'completed_at' => now(),
                    'error' => 'Removed by workflow "'.$run->automation->name.'" (Step: Remove from All Workflows)',
                ]);

                AutomationRunLog::create([
                    'run_id' => $r->id,
                    'node_id' => 'system',
                    'node_type' => 'remove_from_workflow',
                    'result' => 'ok',
                    'message' => 'Unenrolled/cancelled by automation "'.$run->automation->name.'".',
                ]);
            }

            $includeThis = ! empty($data['include_current']) || ($targetType === 'all' && ! isset($data['include_current']));

            return [
                'status' => $includeThis ? 'exited' : 'ok',
                'stop_flow' => $includeThis,
                'message' => "Unenrolled contact from all workflows ({$affectedRuns->count()} other run(s) cancelled).",
            ];
        }

        return ['status' => 'ok', 'message' => 'Remove from workflow processed.'];
    }

    private function executeWaitForReply(array $data, AutomationRun $run, array $context): array
    {
        $amount = max(1, (int) ($data['timeout_amount'] ?? ($data['amount'] ?? 24)));
        $unit = $data['timeout_unit'] ?? ($data['unit'] ?? 'hours');
        $delayMinutes = match ($unit) {
            'days' => $amount * 1440,
            'hours' => $amount * 60,
            default => $amount,
        };

        $replyVar = ! empty($data['reply_variable']) ? $data['reply_variable'] : (! empty($data['variable']) ? $data['variable'] : 'customer_reply');
        $matchType = $data['match_type'] ?? 'any';
        $matchPhrase = (string) ($data['match_phrase'] ?? '');

        $contextUpdate = [
            '_waiting_for_reply' => true,
            '_waiting_for_reply_node_id' => $run->current_node_id,
            '_reply_var' => $replyVar,
            '_reply_match_type' => $matchType,
            '_reply_match_phrase' => $matchPhrase,
            '_reply_timeout_at' => now()->addMinutes($delayMinutes)->toIso8601String(),
        ];

        $run->update([
            'status' => 'waiting',
            'resume_node_id' => null,
            'context' => array_merge($context, $contextUpdate),
        ]);

        dispatch(new ExecuteAutomationRunJob($run->id))
            ->delay(now()->addMinutes($delayMinutes))
            ->onQueue('automation');

        return [
            'status' => 'waiting',
            'message' => "Waiting up to {$amount} {$unit} for customer reply.",
        ];
    }

    // ─── CONTACT nodes ────────────────────────────────────────────────────────

    private function executeAssignAgent(array $data, AutomationRun $run): array
    {
        if (! $run->contact_id) {
            return ['status' => 'skipped', 'message' => 'No contact to assign.'];
        }
        $workspaceId = $run->automation->workspace_id;
        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->where('contact_id', $run->contact_id)
            ->orderByDesc('last_message_at')
            ->first();

        if (! $conversation) {
            return ['status' => 'skipped', 'message' => 'No conversation found for contact.'];
        }

        $user = null;
        if (! empty($data['user_id'])) {
            $user = User::where('workspace_id', $workspaceId)->find($data['user_id']);
            if (! $user) {
                return ['status' => 'error', 'message' => 'Assigned user not found in workspace.'];
            }
        }

        $conversation->update([
            'assigned_user_id' => $user?->id,
            'assigned_to' => 'human',
            'handover_at' => now(),
        ]);
        ConversationAssigned::dispatch($conversation, $user);

        return ['status' => 'ok', 'message' => $user ? "Assigned to {$user->name}." : 'Handed off to a human agent.'];
    }

    // ─── ENGAGE nodes ─────────────────────────────────────────────────────────

    private function executeCtaButton(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $body = $this->renderTokens((string) ($data['body'] ?? ''), $contact, $context);
        $url = $this->renderTokens((string) ($data['url'] ?? ''), $contact, $context);
        if ($body === '' || $url === '') {
            return ['status' => 'error', 'message' => 'Body and URL are required.'];
        }

        $interactive = [
            'type' => 'cta_url',
            'body' => ['text' => mb_substr($body, 0, 1024)],
            'action' => [
                'name' => 'cta_url',
                'parameters' => [
                    'display_text' => mb_substr((string) ($data['display_text'] ?? 'Open'), 0, 20),
                    'url' => $url,
                ],
            ],
        ];

        return $this->sendWhatsappPayload($run, 'interactive', $body, ['interactive' => $interactive]);
    }

    private function executeSendLocation(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $lat = $data['latitude'] ?? null;
        $lng = $data['longitude'] ?? null;
        if ($lat === null || $lng === null || $lat === '' || $lng === '') {
            return ['status' => 'error', 'message' => 'Latitude and longitude are required.'];
        }

        $payload = ['location' => [
            'latitude' => (float) $lat,
            'longitude' => (float) $lng,
            'name' => $data['name'] ?? null,
            'address' => $data['address'] ?? null,
        ]];

        return $this->sendWhatsappPayload($run, 'location', $data['name'] ?? null, $payload);
    }

    private function executeSendPoll(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $question = $this->renderTokens((string) ($data['question'] ?? ''), $contact, $context);
        $options = $this->toList($data['options'] ?? []);
        if ($question === '' || empty($options)) {
            return ['status' => 'error', 'message' => 'Question and options are required.'];
        }

        // The Cloud API has no native poll — emulate with reply buttons (≤3) or an interactive list.
        $interactive = count($options) <= 3
            ? $this->buttonInteractive($question, $options)
            : $this->listInteractive($question, (string) ($data['button_label'] ?? 'Vote'), 'Options', array_map(fn ($o) => ['title' => $o, 'description' => ''], $options));

        return $this->sendWhatsappPayload($run, 'interactive', $question, ['interactive' => $interactive]);
    }

    private function executeRunChatbot(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $workspaceId = $run->automation->workspace_id;
        if (empty($data['chatbot_id'])) {
            return ['status' => 'error', 'message' => 'No chatbot selected.'];
        }
        $bot = AiChatbot::where('id', $data['chatbot_id'])->where('workspace_id', $workspaceId)->first();
        if (! $bot || ! $bot->enabled) {
            return ['status' => 'error', 'message' => 'Chatbot not found or disabled.'];
        }

        $message = (string) ($context['message_body'] ?? '');
        if ($message === '' && ! empty($data['prompt'])) {
            $message = $this->renderTokens($data['prompt'], $contact, $context);
        }
        if ($message === '') {
            $message = 'Hello';
        }

        $result = $this->chatbotRunner->runForApi($bot, $message, $workspaceId, $context['history'] ?? []);
        $reply = $result['reply'] ?? null;
        if (! $reply) {
            return ['status' => 'skipped', 'message' => 'Chatbot returned no reply.'];
        }

        $send = $this->sendTextViaChannel($run, $data['channel'] ?? 'whatsapp', $reply, 'bot');

        return [
            'status' => $send['status'] ?? 'ok',
            'message' => ($send['status'] ?? 'ok') === 'ok' ? 'Chatbot reply sent.' : $send['message'],
            'output' => ['reply' => $reply, 'tokens_used' => $result['tokens_used'] ?? 0],
            'context_update' => ['last_ai_reply' => $reply],
        ];
    }

    private function executeBookAppointment(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $google = GoogleClient::resolve();
        if (! $google) {
            return ['status' => 'error', 'message' => 'Google Workspace integration is not configured.'];
        }

        $start = $this->parseDateTime($this->renderTokens((string) ($data['start'] ?? ''), $contact, $context));
        if (! $start) {
            return ['status' => 'error', 'message' => 'A valid start date/time is required.'];
        }
        $duration = max(1, (int) ($data['duration_minutes'] ?? 30));
        $summary = $this->renderTokens((string) ($data['summary'] ?? 'Appointment'), $contact, $context);
        $description = isset($data['description']) ? $this->renderTokens((string) $data['description'], $contact, $context) : null;

        try {
            $res = $google->createCalendarEvent(
                ($data['calendar_id'] ?? '') ?: 'primary',
                $summary,
                $start->toRfc3339String(),
                $start->copy()->addMinutes($duration)->toRfc3339String(),
                $contact->email ? [$contact->email] : [],
                false,
                $description,
                ($data['timezone'] ?? '') ?: null,
            );
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }

        $ctx = ['appointment_link' => $res['html_link'], 'appointment_event_id' => $res['event_id']];

        if (! empty($data['send_confirmation'])) {
            $msg = "✅ Your appointment \"{$summary}\" is booked for ".$start->format('M j, Y g:i A').'.';
            if ($res['html_link']) {
                $msg .= "\n".$res['html_link'];
            }
            $this->sendTextViaChannel($run, $data['channel'] ?? 'whatsapp', $msg, 'automation');
        }

        return ['status' => 'ok', 'message' => 'Appointment booked for '.$start->toDateTimeString().'.', 'output' => $ctx, 'context_update' => $ctx];
    }

    private function executeGoogleMeet(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $google = GoogleClient::resolve();
        if (! $google) {
            return ['status' => 'error', 'message' => 'Google Workspace integration is not configured.'];
        }

        $start = $this->parseDateTime($this->renderTokens((string) ($data['start'] ?? ''), $contact, $context));
        if (! $start) {
            return ['status' => 'error', 'message' => 'A valid start date/time is required.'];
        }
        $duration = max(1, (int) ($data['duration_minutes'] ?? 30));
        $summary = $this->renderTokens((string) ($data['summary'] ?? 'Meeting'), $contact, $context);

        try {
            $res = $google->createCalendarEvent(
                ($data['calendar_id'] ?? '') ?: 'primary',
                $summary,
                $start->toRfc3339String(),
                $start->copy()->addMinutes($duration)->toRfc3339String(),
                $contact->email ? [$contact->email] : [],
                true,
                null,
                ($data['timezone'] ?? '') ?: null,
            );
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }

        $meet = $res['meet_url'] ?? null;
        if (! $meet) {
            return ['status' => 'error', 'message' => 'Meet link was not created. Ensure the calendar can create conferences.'];
        }

        $ctx = ['meet_url' => $meet, 'appointment_event_id' => $res['event_id']];

        if ($data['send_link'] ?? true) {
            $msg = "📹 Join your meeting \"{$summary}\" (".$start->format('M j, g:i A')."):\n".$meet;
            $this->sendTextViaChannel($run, $data['channel'] ?? 'whatsapp', $msg, 'automation');
        }

        return ['status' => 'ok', 'message' => 'Google Meet created.', 'output' => $ctx, 'context_update' => $ctx];
    }

    private function executeWhatsappForm(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $flowId = (string) ($data['flow_id'] ?? '');
        if ($flowId === '') {
            return ['status' => 'error', 'message' => 'Flow ID is required.'];
        }
        $body = $this->renderTokens((string) ($data['body'] ?? ''), $contact, $context);
        $cta = (string) ($data['flow_cta'] ?? 'Open form');

        $params = [
            'flow_message_version' => '3',
            'flow_id' => $flowId,
            'flow_cta' => mb_substr($cta, 0, 20),
            'flow_action' => 'navigate',
            'flow_token' => (string) (($data['flow_token'] ?? '') ?: 'flow_'.$run->id),
        ];
        if (! empty($data['screen'])) {
            $params['flow_action_payload'] = ['screen' => (string) $data['screen']];
        }

        $interactive = [
            'type' => 'flow',
            'body' => ['text' => mb_substr($body !== '' ? $body : $cta, 0, 1024)],
            'action' => ['name' => 'flow', 'parameters' => $params],
        ];

        return $this->sendWhatsappPayload($run, 'interactive', $body, ['interactive' => $interactive]);
    }

    // ─── COMMERCE nodes ───────────────────────────────────────────────────────

    private function executeWhatsappCatalog(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $body = $this->renderTokens((string) ($data['body'] ?? 'Browse our catalog'), $contact, $context);

        $action = ['name' => 'catalog_message'];
        if (! empty($data['thumbnail_product_retailer_id'])) {
            $action['parameters'] = ['thumbnail_product_retailer_id' => (string) $data['thumbnail_product_retailer_id']];
        }

        $interactive = ['type' => 'catalog_message', 'body' => ['text' => mb_substr($body, 0, 1024)], 'action' => $action];

        return $this->sendWhatsappPayload($run, 'interactive', $body, ['interactive' => $interactive]);
    }

    private function executeSendProduct(array $data, AutomationRun $run, array $context, string $platform): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $workspaceId = $run->automation->workspace_id;

        $query = EcommerceProduct::where('workspace_id', $workspaceId)->where('platform', $platform);
        if (! empty($data['store_id'])) {
            $query->where('store_id', $data['store_id']);
        }
        if (! empty($data['product_id'])) {
            $query->where(fn ($w) => $w->where('id', $data['product_id'])->orWhere('external_id', (string) $data['product_id']));
        } elseif (! empty($data['external_id'])) {
            $query->where('external_id', (string) $data['external_id']);
        } else {
            return ['status' => 'error', 'message' => 'No product selected.'];
        }

        $product = $query->first();
        if (! $product) {
            return ['status' => 'error', 'message' => 'Product not found. Sync your store products first.'];
        }

        $url = $product->raw['permalink'] ?? ($product->raw['onlineStoreUrl'] ?? null);
        $lines = array_filter([
            '*'.$product->name.'*',
            $product->price !== null ? 'Price: '.number_format((float) $product->price, 2) : null,
            $product->sku ? 'SKU: '.$product->sku : null,
            $url,
        ]);
        $caption = implode("\n", $lines);
        if (! empty($data['body'])) {
            $caption = $this->renderTokens((string) $data['body'], $contact, $context)."\n\n".$caption;
        }

        if ($product->image_url) {
            return $this->sendWhatsappPayload($run, 'image', $caption, ['link' => $product->image_url, 'caption' => $caption]);
        }

        return $this->sendWhatsappPayload($run, 'text', $caption, null);
    }

    // ─── INTEGRATIONS nodes ───────────────────────────────────────────────────

    private function executeGoogleSheets(array $data, AutomationRun $run, array $context): array
    {
        $google = GoogleClient::resolve();
        if (! $google) {
            return ['status' => 'error', 'message' => 'Google Workspace integration is not configured.'];
        }
        $spreadsheetId = (string) ($data['spreadsheet_id'] ?? '');
        $range = (string) ($data['range'] ?? '');
        if ($spreadsheetId === '' || $range === '') {
            return ['status' => 'error', 'message' => 'Spreadsheet ID and range are required.'];
        }
        $contact = $run->contact_id ? Contact::find($run->contact_id) : null;

        try {
            if (($data['mode'] ?? 'append') === 'read') {
                $rows = $google->readSheetRange($spreadsheetId, $range);
                $var = ($data['result_var'] ?? '') ?: 'sheet';

                return [
                    'status' => 'ok',
                    'message' => 'Read '.count($rows).' row(s) from sheet.',
                    'output' => ['rows' => $rows],
                    'context_update' => [$var => (string) ($rows[0][0] ?? ''), $var.'_json' => json_encode($rows)],
                ];
            }

            $values = array_map(
                fn ($v) => $contact ? $this->renderTokens(trim($v), $contact, $context) : trim($v),
                $this->toLines($data['values'] ?? [])
            );
            $res = $google->appendSheetRow($spreadsheetId, $range, $values);

            return ['status' => 'ok', 'message' => 'Appended row to sheet.', 'output' => $res];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function executeGoogleDocs(array $data, AutomationRun $run, array $context): array
    {
        $google = GoogleClient::resolve();
        if (! $google) {
            return ['status' => 'error', 'message' => 'Google Workspace integration is not configured.'];
        }
        $templateId = (string) ($data['template_doc_id'] ?? '');
        if ($templateId === '') {
            return ['status' => 'error', 'message' => 'Template document ID is required.'];
        }
        $contact = $run->contact_id ? Contact::find($run->contact_id) : null;
        $title = $contact ? $this->renderTokens((string) ($data['title'] ?? 'Document'), $contact, $context) : (string) ($data['title'] ?? 'Document');
        $replacements = $this->parseReplacements($data['replacements'] ?? [], $contact, $context);

        try {
            $res = $google->createDocFromTemplate($templateId, $title ?: 'Document', $replacements);
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }

        $ctx = ['doc_url' => $res['url'], 'doc_id' => $res['doc_id']];
        if (! empty($data['send_link'])) {
            $this->sendTextViaChannel($run, $data['channel'] ?? 'whatsapp', "📄 {$title}:\n".$res['url'], 'automation');
        }

        return ['status' => 'ok', 'message' => 'Document generated.', 'output' => $ctx, 'context_update' => $ctx];
    }

    /**
     * Google Forms node. Two modes:
     *   - send_link (default) → share the form's responder URL with the contact.
     *   - read_response       → pull the latest submission's answers into the run context.
     */
    private function executeGoogleForms(array $data, AutomationRun $run, array $context): array
    {
        $google = GoogleClient::resolve();
        if (! $google) {
            return ['status' => 'error', 'message' => 'Google Workspace integration is not configured.'];
        }
        $formId = (string) ($data['form_id'] ?? '');
        if ($formId === '') {
            return ['status' => 'error', 'message' => 'Form ID is required.'];
        }
        $contact = $run->contact_id ? Contact::find($run->contact_id) : null;
        $mode = ($data['mode'] ?? 'send_link') === 'read_response' ? 'read_response' : 'send_link';

        try {
            if ($mode === 'read_response') {
                $responses = $google->listFormResponses($formId);
                if (empty($responses)) {
                    return ['status' => 'skipped', 'message' => 'No form responses yet.'];
                }

                $latest = $responses[0];
                $var = ($data['result_var'] ?? '') ?: 'form';
                $answers = [];
                foreach ($latest['answers'] ?? [] as $questionId => $answer) {
                    $values = array_map(fn ($a) => $a['value'] ?? '', $answer['textAnswers']['answers'] ?? []);
                    $answers[$questionId] = implode(', ', $values);
                }

                return [
                    'status' => 'ok',
                    'message' => 'Read latest form response.',
                    'output' => ['response_id' => $latest['responseId'] ?? null, 'answers' => $answers],
                    'context_update' => [
                        $var.'_id' => $latest['responseId'] ?? '',
                        $var.'_json' => json_encode($answers),
                    ],
                ];
            }

            $form = $google->getForm($formId);
            $url = (string) ($form['responderUri'] ?? '');
            if ($url === '') {
                return ['status' => 'error', 'message' => 'Form has no shareable responder link.'];
            }
            $title = $form['info']['title'] ?? 'Form';
            $ctx = ['form_url' => $url, 'form_title' => $title];

            if (! empty($data['send_link']) && $contact) {
                $body = ! empty($data['body'])
                    ? $this->renderTokens((string) $data['body'], $contact, $context)
                    : "📋 {$title}";
                $this->sendTextViaChannel($run, $data['channel'] ?? 'whatsapp', $body."\n".$url, 'automation');
            }

            return ['status' => 'ok', 'message' => 'Fetched form link.', 'output' => $ctx, 'context_update' => $ctx];
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    // ─── Shared send helpers ──────────────────────────────────────────────────

    /** Normalise a node's channel choice; defaults to WhatsApp. */
    private function pickChannel(array $data): string
    {
        $channel = $data['channel'] ?? 'whatsapp';

        return in_array($channel, ['whatsapp', 'messenger', 'instagram', 'sms'], true) ? $channel : 'whatsapp';
    }

    /**
     * Resolve which channel account + conversation to use for an outbound message on
     * $channel. Prefers the contact's most-recent conversation on that channel so that,
     * with multiple accounts (e.g. two WhatsApp numbers / two Pages), replies go out on
     * the same account/thread the contact already uses. Messenger & Instagram can ONLY be
     * messaged inside an existing thread (the PSID/IGSID lives on conversation.external_thread_id).
     *
     * @return array{account: ?ChannelAccount, conversation: ?Conversation, error: ?string, soft: bool}
     */
    private function resolveChannelTarget(int $workspaceId, Contact $contact, string $channel): array
    {
        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->where('contact_id', $contact->id)
            ->whereHas('channelAccount', fn ($q) => $q->where('channel', $channel)->where('status', 'active'))
            ->orderByDesc('last_message_at')
            ->first();

        if ($conversation) {
            return ['account' => $conversation->channelAccount, 'conversation' => $conversation, 'error' => null, 'soft' => false];
        }

        // No existing thread. Messenger/Instagram cannot be initiated proactively.
        if (in_array($channel, ['messenger', 'instagram'], true)) {
            return [
                'account' => null, 'conversation' => null, 'soft' => true,
                'error' => "No open {$channel} conversation with this contact — a {$channel} thread can only start after the contact messages first.",
            ];
        }

        $account = ChannelAccount::where('workspace_id', $workspaceId)
            ->where('channel', $channel)
            ->where('status', 'active')
            ->orderBy('id')
            ->first();

        if (! $account) {
            return ['account' => null, 'conversation' => null, 'soft' => false, 'error' => "No active {$channel} channel account in this workspace."];
        }

        return ['account' => $account, 'conversation' => null, 'error' => null, 'soft' => false];
    }

    /**
     * Create + send an outbound message on any supported channel
     * (whatsapp / messenger / instagram / sms), routed to the correct account.
     */
    private function dispatchMessage(AutomationRun $run, string $channel, string $type, ?string $body, ?array $payload, string $sentBy = 'automation'): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }
        $channel = in_array($channel, ['whatsapp', 'messenger', 'instagram', 'sms'], true) ? $channel : 'whatsapp';

        if ($channel === 'sms') {
            return $this->dispatchSms($run, $contact, $body ?? '', $sentBy);
        }

        $target = $this->resolveChannelTarget($run->automation->workspace_id, $contact, $channel);
        if ($target['error']) {
            return ['status' => $target['soft'] ? 'skipped' : 'error', 'message' => $target['error']];
        }

        $account = $target['account'];
        $conversation = $target['conversation'] ?? $this->resolveOrCreateConversation($contact, $account, $channel);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'direction' => 'out',
            'channel' => $channel,
            'type' => $type,
            'body' => $body,
            'payload' => $payload,
            'status' => 'queued',
            'sent_by' => $sentBy,
            'sent_at' => now(),
        ]);

        try {
            $messageId = $this->channelManager->driver($channel)->send($message);
            $message->update(['status' => 'sent', 'provider_message_id' => $messageId]);
        } catch (\Throwable $e) {
            $message->update(['status' => 'failed', 'error_json' => ['message' => $e->getMessage()]]);

            return ['status' => 'error', 'message' => ucfirst($channel).' send failed: '.$e->getMessage()];
        }

        $conversation->update(['last_message_at' => now()]);
        $message->load('conversation');
        MessageSent::dispatch($message);

        return ['status' => 'ok', 'message' => ucfirst($channel).' message sent.', 'output' => ['message_id' => $message->id]];
    }

    /** Send an SMS via the workspace's configured SMS provider (Broadcasting drivers). */
    private function dispatchSms(AutomationRun $run, Contact $contact, string $text, string $sentBy): array
    {
        if (! $contact->phone_e164) {
            return ['status' => 'skipped', 'message' => 'Contact has no phone number for SMS.'];
        }
        $workspaceId = $run->automation->workspace_id;

        try {
            $driver = SmsDriverManager::forWorkspace($workspaceId);
        } catch (\Throwable $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }

        $account = ChannelAccount::where('workspace_id', $workspaceId)
            ->where('channel', 'sms')
            ->where('status', 'active')
            ->first();
        $conversation = $account
            ? $this->resolveOrCreateConversation($contact, $account, 'sms')
            : Conversation::firstOrCreate(
                ['workspace_id' => $workspaceId, 'contact_id' => $contact->id, 'channel_account_id' => null],
                ['status' => 'open', 'unread_count' => 0, 'external_thread_id' => $contact->phone_e164],
            );

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'direction' => 'out',
            'channel' => 'sms',
            'type' => 'text',
            'body' => $text,
            'status' => 'queued',
            'sent_by' => $sentBy,
            'sent_at' => now(),
        ]);

        try {
            $result = $driver->send($contact->phone_e164, $text);
            if (! $result->success) {
                throw new \RuntimeException($result->error ?: 'SMS provider rejected the message.');
            }
            $message->update(['status' => 'sent', 'provider_message_id' => $result->messageId]);
        } catch (\Throwable $e) {
            $message->update(['status' => 'failed', 'error_json' => ['message' => $e->getMessage()]]);

            return ['status' => 'error', 'message' => 'SMS send failed: '.$e->getMessage()];
        }

        $conversation->update(['last_message_at' => now()]);
        $message->load('conversation');
        MessageSent::dispatch($message);

        return ['status' => 'ok', 'message' => 'SMS sent.', 'output' => ['message_id' => $message->id]];
    }

    /** WhatsApp-only send (templates, interactive, media, location) — routed to the right account. */
    private function sendWhatsappPayload(AutomationRun $run, string $type, ?string $body, ?array $payload, string $sentBy = 'automation'): array
    {
        return $this->dispatchMessage($run, 'whatsapp', $type, $body, $payload, $sentBy);
    }

    /** Send a plain text message on the given channel (whatsapp / messenger / instagram / sms). */
    private function sendTextViaChannel(AutomationRun $run, string $channel, string $text, string $sentBy): array
    {
        return $this->dispatchMessage($run, $channel, 'text', $text, null, $sentBy);
    }

    /** WhatsApp interactive reply-buttons payload (max 3). */
    private function buttonInteractive(string $body, array $titles): array
    {
        $buttons = [];
        foreach (array_slice(array_values($titles), 0, 3) as $i => $title) {
            $buttons[] = ['type' => 'reply', 'reply' => ['id' => 'btn_'.($i + 1), 'title' => mb_substr((string) $title, 0, 20)]];
        }

        return ['type' => 'button', 'body' => ['text' => mb_substr($body, 0, 1024)], 'action' => ['buttons' => $buttons]];
    }

    /** WhatsApp interactive list payload (max 10 rows). */
    private function listInteractive(string $body, string $buttonLabel, string $sectionTitle, array $rows): array
    {
        $items = [];
        foreach (array_slice(array_values($rows), 0, 10) as $i => $row) {
            $item = ['id' => 'row_'.($i + 1), 'title' => mb_substr($row['title'] ?? '', 0, 24)];
            if (! empty($row['description'])) {
                $item['description'] = mb_substr($row['description'], 0, 72);
            }
            $items[] = $item;
        }

        return [
            'type' => 'list',
            'body' => ['text' => mb_substr($body, 0, 1024)],
            'action' => [
                'button' => mb_substr($buttonLabel ?: 'Menu', 0, 20),
                'sections' => [['title' => mb_substr($sectionTitle ?: 'Options', 0, 24), 'rows' => $items]],
            ],
        ];
    }

    // ─── Parsing helpers ──────────────────────────────────────────────────────

    /** Normalise a value to a trimmed list (accepts an array, or a comma/newline string). */
    private function toList(mixed $v): array
    {
        if (is_array($v)) {
            return array_values(array_filter(array_map(fn ($x) => trim((string) $x), $v), fn ($x) => $x !== ''));
        }
        if (is_string($v) && $v !== '') {
            return array_values(array_filter(array_map('trim', preg_split('/[\r\n,]+/', $v) ?: []), fn ($x) => $x !== ''));
        }

        return [];
    }

    /** Split a value into lines, preserving empty cells for column alignment. */
    private function toLines(mixed $v): array
    {
        if (is_array($v)) {
            return array_map(fn ($x) => (string) $x, $v);
        }

        return preg_split('/\r\n|\r|\n/', (string) $v) ?: [];
    }

    /**
     * Parse list rows. Accepts an array of {title, description} objects/strings, or a
     * newline string where each line is "Title|Description".
     *
     * @return list<array{title: string, description: string}>
     */
    private function parseRows(mixed $v): array
    {
        $rows = [];
        if (is_array($v)) {
            foreach ($v as $r) {
                if (is_array($r)) {
                    $title = trim((string) ($r['title'] ?? ''));
                    if ($title === '') {
                        continue;
                    }
                    $rows[] = ['title' => $title, 'description' => trim((string) ($r['description'] ?? ''))];
                } else {
                    $title = trim((string) $r);
                    if ($title !== '') {
                        $rows[] = ['title' => $title, 'description' => ''];
                    }
                }
            }
        } elseif (is_string($v)) {
            foreach (preg_split('/\r\n|\r|\n/', $v) ?: [] as $line) {
                $line = trim($line);
                if ($line === '') {
                    continue;
                }
                [$title, $desc] = array_pad(explode('|', $line, 2), 2, '');
                $title = trim($title);
                if ($title !== '') {
                    $rows[] = ['title' => $title, 'description' => trim($desc)];
                }
            }
        }

        return $rows;
    }

    /**
     * Parse sequence steps. Accepts an array of {kind, body, media_type, link, caption}
     * objects, or a newline string ("text|...", "image|url|caption").
     *
     * @return list<array<string, mixed>>
     */
    private function parseSteps(mixed $v): array
    {
        $steps = [];
        if (is_array($v)) {
            foreach ($v as $s) {
                if (! is_array($s)) {
                    $t = trim((string) $s);
                    if ($t !== '') {
                        $steps[] = ['kind' => 'text', 'body' => $t];
                    }

                    continue;
                }
                $kind = ($s['kind'] ?? 'text') === 'media' ? 'media' : 'text';
                if ($kind === 'media') {
                    if (empty($s['link'])) {
                        continue;
                    }
                    $steps[] = [
                        'kind' => 'media',
                        'media_type' => in_array($s['media_type'] ?? 'image', ['image', 'video', 'document', 'audio'], true) ? $s['media_type'] : 'image',
                        'link' => (string) $s['link'],
                        'caption' => $s['caption'] ?? null,
                    ];
                } elseif (trim((string) ($s['body'] ?? '')) !== '') {
                    $steps[] = ['kind' => 'text', 'body' => (string) $s['body']];
                }
            }
        } elseif (is_string($v)) {
            foreach (preg_split('/\r\n|\r|\n/', $v) ?: [] as $line) {
                $line = trim($line);
                if ($line === '') {
                    continue;
                }
                $parts = explode('|', $line);
                $head = strtolower(trim($parts[0]));
                if (in_array($head, ['image', 'video', 'document', 'audio'], true)) {
                    $steps[] = ['kind' => 'media', 'media_type' => $head, 'link' => trim($parts[1] ?? ''), 'caption' => isset($parts[2]) ? trim($parts[2]) : null];
                } else {
                    $body = $head === 'text' ? trim(substr($line, strpos($line, '|') + 1)) : $line;
                    if ($body !== '') {
                        $steps[] = ['kind' => 'text', 'body' => $body];
                    }
                }
            }
        }

        return $steps;
    }

    /**
     * Parse Doc placeholder replacements. Accepts an array of {key, value}, an assoc
     * array, a JSON object string, or "key=value" lines. Values are token-rendered.
     *
     * @return array<string, string>
     */
    private function parseReplacements(mixed $v, ?Contact $contact, array $context): array
    {
        $out = [];
        $render = fn ($s) => $contact ? $this->renderTokens((string) $s, $contact, $context) : (string) $s;

        if (is_array($v)) {
            foreach ($v as $k => $item) {
                if (is_array($item) && isset($item['key'])) {
                    $out[(string) $item['key']] = $render($item['value'] ?? '');
                } elseif (is_string($k)) {
                    $out[$k] = $render($item);
                }
            }
        } elseif (is_string($v) && trim($v) !== '') {
            $decoded = json_decode($v, true);
            if (is_array($decoded)) {
                foreach ($decoded as $k => $val) {
                    $out[(string) $k] = $render($val);
                }
            } else {
                foreach (preg_split('/\r\n|\r|\n/', $v) ?: [] as $line) {
                    if (! str_contains($line, '=')) {
                        continue;
                    }
                    [$k, $val] = array_pad(explode('=', $line, 2), 2, '');
                    $k = trim($k);
                    if ($k !== '') {
                        $out[$k] = $render(trim($val));
                    }
                }
            }
        }

        return $out;
    }

    private function parseDateTime(?string $v): ?Carbon
    {
        $v = trim((string) $v);
        if ($v === '') {
            return null;
        }
        try {
            return Carbon::parse($v);
        } catch (\Throwable) {
            return null;
        }
    }

    private function executeInternalNotification(array $data, AutomationRun $run, array $context): array
    {
        $contact = $run->contact;
        $type = $data['notification_type'] ?? 'email';
        $sendTo = $data['send_to'] ?? 'user';
        $subject = $this->renderTokens((string) ($data['subject'] ?? $data['title'] ?? 'Internal Automation Notification'), $contact, $context);
        $body = $this->renderTokens((string) ($data['body'] ?? ''), $contact, $context);

        $recipients = [];

        if ($sendTo === 'user' && ! empty($data['user_id'])) {
            $user = \App\Models\User::find($data['user_id']);
            if ($user) {
                $recipients[] = $user;
            }
        } elseif ($sendTo === 'assigned_user' && $contact && $contact->assigned_agent_id) {
            $user = \App\Models\User::find($contact->assigned_agent_id);
            if ($user) {
                $recipients[] = $user;
            }
        } elseif ($sendTo === 'custom_email' && ! empty($data['to_address'])) {
            $emails = array_map('trim', explode(',', $data['to_address']));
            foreach ($emails as $em) {
                if (filter_var($em, FILTER_VALIDATE_EMAIL)) {
                    $recipients[] = (object) ['email' => $em, 'name' => 'Internal Recipient'];
                }
            }
        } elseif ($sendTo === 'custom_phone' && ! empty($data['to_address'])) {
            $phones = array_map('trim', explode(',', $data['to_address']));
            foreach ($phones as $ph) {
                $recipients[] = (object) ['phone' => $ph, 'name' => 'Internal Recipient'];
            }
        }

        if (empty($recipients)) {
            $recipients = \App\Models\User::where('workspace_id', $run->automation->workspace_id)->get()->all();
        }

        $sentCount = 0;
        $notificationObj = new \App\Notifications\InternalAutomationNotification($subject, $body, [
            'contact_id' => $contact?->id,
            'contact_name' => $contact?->name,
            'automation_id' => $run->automation_id,
        ]);

        foreach ($recipients as $recipient) {
            try {
                if ($recipient instanceof \App\Models\User) {
                    if ($type === 'email') {
                        $recipient->notify($notificationObj);
                        $sentCount++;
                    } else {
                        $recipient->notifications()->create([
                            'id' => (string) \Illuminate\Support\Str::uuid(),
                            'type' => 'App\\Notifications\\InternalAutomationNotification',
                            'data' => [
                                'type' => 'internal_automation_alert',
                                'title' => $subject,
                                'body' => $body,
                                'url' => $contact ? route('client.contacts.show', $contact->id) : null,
                            ],
                        ]);
                        $sentCount++;
                    }
                } else {
                    if ($type === 'email' && ! empty($recipient->email)) {
                        \Illuminate\Support\Facades\Mail::raw($body, function ($message) use ($recipient, $subject) {
                            $message->to($recipient->email)->subject($subject);
                        });
                        $sentCount++;
                    } else {
                        \Illuminate\Support\Facades\Log::info("[Internal Notification Alert] {$type} to recipient: {$subject} - {$body}");
                        $sentCount++;
                    }
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Failed to send internal notification: " . $e->getMessage());
            }
        }

        return ['status' => 'ok', 'message' => "Internal {$type} notification sent to {$sentCount} recipient(s)."];
    }

    private function executeCreateOpportunity(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        $workspaceId = $run->automation->workspace_id;
        $pipelineId = $data['pipeline_id'] ?? null;
        $stageId = $data['stage_id'] ?? null;

        if (! $pipelineId || ! $stageId) {
            $pipelineService = app(\App\Modules\Pipelines\Services\PipelineService::class);
            $defaultPipeline = $pipelineService->getOrCreateDefaultPipeline($workspaceId);
            $pipelineId = $defaultPipeline->id;
            $stageId = $defaultPipeline->stages->first()?->id;
        }

        if (! $stageId) {
            return ['status' => 'error', 'message' => 'No pipeline stage available.'];
        }

        $dealName = ! empty($data['name'])
            ? $this->renderTokens($data['name'], $contact, $context)
            : "Opportunity - {$contact->full_name}";

        $targetStatus = $data['status'] ?? 'open';
        $statusPolicy = $data['status_policy'] ?? 'preserve_if_won';

        $existingDeal = \App\Modules\Pipelines\Models\Deal::where('workspace_id', $workspaceId)
            ->where('contact_id', $contact->id)
            ->where('pipeline_id', $pipelineId)
            ->first();

        $pipelineService = app(\App\Modules\Pipelines\Services\PipelineService::class);

        if ($existingDeal) {
            $oldStatus = $existingDeal->status;
            $newStatus = $targetStatus;

            if ($statusPolicy === 'keep_existing') {
                $newStatus = $oldStatus;
            } elseif ($statusPolicy === 'preserve_if_won' && $oldStatus === 'won') {
                $newStatus = 'won';
            }

            $lostReason = ($newStatus === 'lost' || $newStatus === 'abandoned')
                ? (! empty($data['lost_reason']) ? $this->renderTokens($data['lost_reason'], $contact, $context) : $existingDeal->lost_reason)
                : null;

            $existingDeal->update([
                'stage_id' => $stageId,
                'name' => $dealName,
                'monetary_value' => isset($data['monetary_value']) && $data['monetary_value'] !== ''
                    ? (float) $this->renderTokens((string) $data['monetary_value'], $contact, $context)
                    : (float) $existingDeal->monetary_value,
                'assigned_user_id' => $data['assigned_user_id'] ?? $existingDeal->assigned_user_id,
                'deal_watcher_id' => $data['deal_watcher_id'] ?? $existingDeal->deal_watcher_id,
                'status' => $newStatus,
                'lost_reason' => $lostReason,
            ]);

            if ($oldStatus !== $newStatus) {
                \App\Modules\Pipelines\Models\DealHistory::create([
                    'deal_id' => $existingDeal->id,
                    'event_type' => 'status_change',
                    'stage_from_id' => $existingDeal->stage_id,
                    'stage_to_id' => $existingDeal->stage_id,
                    'user_id' => null,
                    'remarks' => "Status changed from {$oldStatus} to {$newStatus} via workflow '{$run->automation->name}'" . ($lostReason ? " (Reason: {$lostReason})" : ''),
                    'created_at' => now(),
                ]);

                $pipelineService->triggerStatusAutomations($existingDeal, $oldStatus, $newStatus);
            }

            return ['status' => 'ok', 'message' => "Opportunity #{$existingDeal->id} updated (Status: {$newStatus})."];
        }

        $lostReason = ($targetStatus === 'lost' || $targetStatus === 'abandoned') && ! empty($data['lost_reason'])
            ? $this->renderTokens($data['lost_reason'], $contact, $context)
            : null;

        $deal = \App\Modules\Pipelines\Models\Deal::create([
            'workspace_id' => $workspaceId,
            'contact_id' => $contact->id,
            'pipeline_id' => $pipelineId,
            'stage_id' => $stageId,
            'name' => $dealName,
            'monetary_value' => isset($data['monetary_value']) && $data['monetary_value'] !== ''
                ? (float) $this->renderTokens((string) $data['monetary_value'], $contact, $context)
                : 0.0,
            'assigned_user_id' => $data['assigned_user_id'] ?? null,
            'deal_watcher_id' => $data['deal_watcher_id'] ?? null,
            'status' => $targetStatus,
            'lost_reason' => $lostReason,
        ]);

        \App\Modules\Pipelines\Models\DealHistory::create([
            'deal_id' => $deal->id,
            'event_type' => 'deal_created',
            'stage_from_id' => $stageId,
            'stage_to_id' => $stageId,
            'user_id' => null,
            'remarks' => "Opportunity created via workflow '{$run->automation->name}' with status '{$targetStatus}'",
            'created_at' => now(),
        ]);

        if ($targetStatus !== 'open') {
            $pipelineService->triggerStatusAutomations($deal, 'open', $targetStatus);
        }

        return ['status' => 'ok', 'message' => "Opportunity #{$deal->id} created (Status: {$targetStatus})."];
    }

    private function executeChangeOpportunityStage(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        $workspaceId = $run->automation->workspace_id;
        $stageId = $data['stage_id'] ?? null;
        if (! $stageId) {
            return ['status' => 'error', 'message' => 'No target stage selected.'];
        }

        $deal = \App\Modules\Pipelines\Models\Deal::where('workspace_id', $workspaceId)
            ->where('contact_id', $contact->id)
            ->latest()
            ->first();

        if (! $deal) {
            return $this->executeCreateOpportunity(array_merge($data, ['stage_id' => $stageId]), $run, $context);
        }

        $workflowName = $run->automation->name ?? 'Workflow';
        $pipelineService = app(\App\Modules\Pipelines\Services\PipelineService::class);
        $pipelineService->updateStageAndPriority(
            $deal,
            (int) $stageId,
            [$deal->id],
            null,
            'automation',
            $workflowName
        );

        return ['status' => 'ok', 'message' => "Opportunity #{$deal->id} stage updated via workflow '{$workflowName}'."];
    }

    private function executeTransferOpportunityPipeline(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        $workspaceId = $run->automation->workspace_id;
        $targetPipelineId = (int) ($data['pipeline_id'] ?? $data['target_pipeline_id'] ?? 0);
        $targetStageId = (int) ($data['stage_id'] ?? $data['target_stage_id'] ?? 0);

        if (! $targetPipelineId || ! $targetStageId) {
            return ['status' => 'error', 'message' => 'Target pipeline and stage are required for pipeline transfer.'];
        }

        $dealId = $context['deal_id'] ?? $context['opportunity_id'] ?? null;
        $deal = null;
        if ($dealId) {
            $deal = \App\Modules\Pipelines\Models\Deal::where('workspace_id', $workspaceId)->find($dealId);
        }
        if (! $deal) {
            $deal = \App\Modules\Pipelines\Models\Deal::where('workspace_id', $workspaceId)
                ->where('contact_id', $contact->id)
                ->latest()
                ->first();
        }

        if (! $deal) {
            return ['status' => 'skipped', 'message' => 'No opportunity found for contact to transfer.'];
        }

        $assignedUserId = ! empty($data['assigned_user_id']) ? (int) $data['assigned_user_id'] : null;
        $workflowName = $run->automation->name ?? 'Workflow';

        $pipelineService = app(\App\Modules\Pipelines\Services\PipelineService::class);
        $pipelineService->transferPipeline(
            deal: $deal,
            targetPipelineId: $targetPipelineId,
            targetStageId: $targetStageId,
            assignedUserId: $assignedUserId,
            userId: null,
            changeSource: 'automation',
            sourceName: $workflowName
        );

        return ['status' => 'ok', 'message' => "Opportunity #{$deal->id} transferred to pipeline #{$targetPipelineId} (Stage #{$targetStageId}) via workflow '{$workflowName}'."];
    }

    private function executeUpdateOpportunityStatus(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        $workspaceId = $run->automation->workspace_id;

        $deal = \App\Modules\Pipelines\Models\Deal::where('workspace_id', $workspaceId)
            ->where('contact_id', $contact->id)
            ->latest()
            ->first();

        if (! $deal) {
            return ['status' => 'skipped', 'message' => 'No active opportunity found for contact.'];
        }

        $oldStatus = $deal->status;
        $newStatus = $data['status'] ?? 'won';
        $lostReason = ($newStatus === 'lost' || $newStatus === 'abandoned') && ! empty($data['lost_reason'])
            ? $this->renderTokens($data['lost_reason'], $contact, $context)
            : ($newStatus === 'open' || $newStatus === 'won' ? null : $deal->lost_reason);

        $deal->update([
            'status' => $newStatus,
            'lost_reason' => $lostReason,
        ]);

        if ($oldStatus !== $newStatus) {
            \App\Modules\Pipelines\Models\DealHistory::create([
                'deal_id' => $deal->id,
                'event_type' => 'status_change',
                'stage_from_id' => $deal->stage_id,
                'stage_to_id' => $deal->stage_id,
                'user_id' => null,
                'remarks' => "Status changed from {$oldStatus} to {$newStatus} via workflow node" . ($lostReason ? " (Reason: {$lostReason})" : ''),
                'created_at' => now(),
            ]);

            $pipelineService = app(\App\Modules\Pipelines\Services\PipelineService::class);
            $pipelineService->triggerStatusAutomations($deal, $oldStatus, $newStatus);
        }

        return ['status' => 'ok', 'message' => "Opportunity #{$deal->id} status updated to '{$newStatus}'."];
    }

    private function executeRemoveOpportunity(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        $workspaceId = $run->automation->workspace_id;

        $count = \App\Modules\Pipelines\Models\Deal::where('workspace_id', $workspaceId)
            ->where('contact_id', $contact->id)
            ->delete();

        return ['status' => 'ok', 'message' => "{$count} opportunity record(s) removed for contact."];
    }

    private function executeSystemBookAppointment(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        $calendarId = $data['calendar_id'] ?? null;
        $calendar = $calendarId ? \App\Modules\Calendars\Models\BookingCalendar::find($calendarId) : \App\Modules\Calendars\Models\BookingCalendar::where('workspace_id', $run->automation->workspace_id)->first();

        if (! $calendar) {
            return ['status' => 'skipped', 'message' => 'No active calendar found.'];
        }

        $appointmentService = app(\App\Modules\Calendars\Services\AppointmentService::class);
        $appointment = $appointmentService->createAppointment($calendar, [
            'first_name' => $contact->first_name,
            'last_name' => $contact->last_name,
            'email' => $contact->email,
            'phone' => $contact->phone_e164,
            'start_at' => now()->addDay()->format('Y-m-d 10:00:00'),
        ]);

        return ['status' => 'ok', 'message' => "Appointment #{$appointment->id} booked for contact."];
    }

    private function executeCancelAppointment(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact) {
            return ['status' => 'skipped', 'message' => 'Contact not found.'];
        }

        $appointment = \App\Modules\Calendars\Models\Appointment::where('workspace_id', $run->automation->workspace_id)
            ->where('contact_id', $contact->id)
            ->where('status', 'confirmed')
            ->latest()
            ->first();

        if (! $appointment) {
            return ['status' => 'skipped', 'message' => 'No active confirmed appointment found for contact.'];
        }

        $appointmentService = app(\App\Modules\Calendars\Services\AppointmentService::class);
        $appointmentService->cancel($appointment, $data['reason'] ?? 'Cancelled via automation workflow');

        return ['status' => 'ok', 'message' => "Appointment #{$appointment->id} cancelled."];
    }

    private function executeCreateAgencyInvoice(array $data, AutomationRun $run, array $context): array
    {
        $contactId = $run->contact_id;
        $workspaceId = $run->automation->workspace_id;

        $contractId = $context['contract_id'] ?? null;
        $proposalId = $context['proposal_id'] ?? null;

        $proposal = $proposalId ? \App\Modules\Agency\Models\AgencyProposal::find($proposalId) : null;
        $lineItems = $proposal ? $proposal->line_items : [
            ['name' => $data['service_name'] ?? 'Agency Service Agreement', 'price' => (float) ($data['amount'] ?? 100.00), 'quantity' => 1]
        ];
        $total = $proposal ? (float) $proposal->total : (float) ($data['amount'] ?? 100.00);

        $invoice = \App\Modules\Agency\Models\AgencyInvoice::create([
            'workspace_id' => $workspaceId,
            'proposal_id' => $proposalId,
            'contract_id' => $contractId,
            'contact_id' => $contactId,
            'invoice_number' => 'INV-' . strtoupper(\Illuminate\Support\Str::random(8)),
            'status' => 'unpaid',
            'due_date' => now()->addDays(7),
            'line_items' => $lineItems,
            'subtotal' => $total,
            'total' => $total,
        ]);

        return [
            'status' => 'completed',
            'output' => [
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'checkout_url' => route('agency.invoices.checkout', $invoice->uuid),
            ]
        ];
    }

    private function executeSendAgencyPaymentLink(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact || empty($contact->phone_e164)) {
            return ['status' => 'skipped', 'message' => 'No contact phone available for payment link dispatch.'];
        }

        $invoiceId = $context['invoice_id'] ?? null;
        $invoice = $invoiceId ? \App\Modules\Agency\Models\AgencyInvoice::find($invoiceId) : \App\Modules\Agency\Models\AgencyInvoice::where('contact_id', $contact->id)->latest()->first();

        if (! $invoice) {
            return ['status' => 'failed', 'message' => 'No active invoice found for contact.'];
        }

        $checkoutUrl = route('agency.invoices.checkout', $invoice->uuid);
        $message = $data['message'] ?? "Hello {$contact->first_name}, here is your official B2B invoice link for payment: {$checkoutUrl}";

        $channel = \App\Models\Channel::where('workspace_id', $run->automation->workspace_id)->where('status', 'connected')->first();
        if ($channel) {
            $this->channelManager->sendMessage($channel, $contact->phone_e164, $message);
        }

        return ['status' => 'completed', 'output' => ['checkout_url' => $checkoutUrl]];
    }

    private function executeSendOnboardingFormLink(array $data, AutomationRun $run, array $context): array
    {
        $contact = Contact::find($run->contact_id);
        if (! $contact || empty($contact->phone_e164)) {
            return ['status' => 'skipped', 'message' => 'No contact phone available for onboarding link dispatch.'];
        }

        $onboarding = \App\Modules\Agency\Models\AgencyOnboardingResponse::firstOrCreate([
            'workspace_id' => $run->automation->workspace_id,
            'contact_id' => $contact->id,
        ], ['status' => 'pending']);

        $onboardingUrl = route('agency.onboarding.show', $onboarding->uuid);
        $message = $data['message'] ?? "Welcome aboard {$contact->first_name}! Please complete your client onboarding questionnaire here: {$onboardingUrl}";

        $channel = \App\Models\Channel::where('workspace_id', $run->automation->workspace_id)->where('status', 'connected')->first();
        if ($channel) {
            $this->channelManager->sendMessage($channel, $contact->phone_e164, $message);
        }

        return ['status' => 'completed', 'output' => ['onboarding_url' => $onboardingUrl]];
    }
}
