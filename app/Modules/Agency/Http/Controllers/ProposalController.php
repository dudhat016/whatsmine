<?php

namespace App\Modules\Agency\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Agency\Models\AgencyContract;
use App\Modules\Agency\Models\AgencyInvoice;
use App\Modules\Agency\Models\AgencyProposal;
use App\Modules\Agency\Services\DocumentService;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Shared\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProposalController extends Controller
{
    public function __construct(
        private readonly DocumentService $documentService
    ) {}

    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    public function index(Request $request): Response
    {
        $workspaceId = $this->workspaceId($request);

        $proposals = AgencyProposal::with(['contact:id,first_name,last_name,email,phone_e164', 'contract', 'invoices'])
            ->where('workspace_id', $workspaceId)
            ->when($request->input('search'), function ($q, $s) {
                $q->where('title', 'like', "%{$s}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        $contacts = Contact::where('workspace_id', $workspaceId)
            ->get(['id', 'first_name', 'last_name', 'email', 'phone_e164'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => trim("{$c->first_name} {$c->last_name}") ?: $c->email ?: $c->phone_e164 ?: 'Contact #' . $c->id,
            ]);

        return Inertia::render('Agency/Proposals/Index', [
            'proposals' => $proposals,
            'contacts' => $contacts,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(Request $request): Response
    {
        $workspaceId = $this->workspaceId($request);

        $contacts = Contact::where('workspace_id', $workspaceId)
            ->get(['id', 'first_name', 'last_name', 'email', 'phone_e164'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => trim("{$c->first_name} {$c->last_name}") ?: $c->email ?: $c->phone_e164 ?: 'Contact #' . $c->id,
                'email' => $c->email,
                'phone' => $c->phone_e164,
            ]);

        $products = EcommerceProduct::where('workspace_id', $workspaceId)
            ->with(['prices'])
            ->get(['id', 'name', 'price', 'pricing_type', 'billing_interval', 'installment_count'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
                'pricing_type' => $p->pricing_type ?? 'one_time',
                'billing_interval' => $p->billing_interval,
                'installment_count' => $p->installment_count,
                'prices' => $p->prices->map(fn ($pr) => [
                    'id' => $pr->id,
                    'name' => $pr->name,
                    'price' => (float) $pr->price,
                    'pricing_type' => $pr->pricing_type,
                    'billing_interval' => $pr->billing_interval,
                ]),
            ]);

        return Inertia::render('Agency/Proposals/Edit', [
            'proposal' => null,
            'contacts' => $contacts,
            'products' => $products,
        ]);
    }

    public function edit(Request $request, AgencyProposal $proposal): Response
    {
        $workspaceId = $this->workspaceId($request);
        abort_unless($proposal->workspace_id === $workspaceId, 403);

        $proposal->load(['contact', 'contract']);
        $contacts = Contact::where('workspace_id', $workspaceId)
            ->get(['id', 'first_name', 'last_name', 'email', 'phone_e164'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => trim("{$c->first_name} {$c->last_name}") ?: $c->email ?: $c->phone_e164 ?: 'Contact #' . $c->id,
                'email' => $c->email,
                'phone' => $c->phone_e164,
            ]);

        $products = EcommerceProduct::where('workspace_id', $workspaceId)
            ->with(['prices'])
            ->get(['id', 'name', 'price', 'pricing_type', 'billing_interval', 'installment_count'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
                'pricing_type' => $p->pricing_type ?? 'one_time',
                'billing_interval' => $p->billing_interval,
                'installment_count' => $p->installment_count,
                'prices' => $p->prices->map(fn ($pr) => [
                    'id' => $pr->id,
                    'name' => $pr->name,
                    'price' => (float) $pr->price,
                    'pricing_type' => $pr->pricing_type,
                    'billing_interval' => $pr->billing_interval,
                ]),
            ]);

        $raw = $proposal->raw ?? [];

        return Inertia::render('Agency/Proposals/Edit', [
            'proposal' => [
                'id' => $proposal->id,
                'uuid' => $proposal->uuid,
                'title' => $proposal->title,
                'contact_id' => $proposal->contact_id,
                'pricing_type' => $proposal->pricing_type,
                'line_items' => $proposal->line_items,
                'subtotal' => (float) $proposal->subtotal,
                'discount_amount' => (float) ($proposal->discount_amount ?? 0),
                'tax_rate' => (float) ($proposal->tax_rate ?? 0),
                'tax_amount' => (float) ($proposal->tax_amount ?? 0),
                'total' => (float) $proposal->total,
                'status' => $proposal->status,
                'valid_until' => $proposal->valid_until?->format('Y-m-d') ?? '',
                'note' => $raw['note'] ?? '',
                'contract_terms' => $proposal->contract?->content ?? $proposal->contract_terms ?? $raw['contract_terms'] ?? '',
                'require_signature' => $raw['require_signature'] ?? true,
                'revision_notes' => $raw['revision_notes'] ?? null,
            ],
            'contacts' => $contacts,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $workspaceId = $this->workspaceId($request);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'contact_id' => 'nullable|integer|exists:contacts,id',
            'pricing_type' => 'required|string|in:one_time,recurring,installments',
            'status' => 'nullable|string|in:draft,sent,waiting,accepted,declined',
            'line_items' => 'required|array|min:1',
            'line_items.*.product_id' => 'nullable|integer',
            'line_items.*.price_id' => 'nullable|integer',
            'line_items.*.name' => 'required|string',
            'line_items.*.price' => 'required|numeric|min:0',
            'line_items.*.quantity' => 'nullable|numeric|min:1',
            'line_items.*.is_optional' => 'nullable|boolean',
            'line_items.*.is_selected' => 'nullable|boolean',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'valid_until' => 'nullable|date',
            'note' => 'nullable|string|max:2000',
            'contract_terms' => 'nullable|string',
        ]);

        $subtotal = collect($data['line_items'])->sum(function ($item) {
            $price = (float) ($item['price'] ?? 0);
            $qty = (float) ($item['quantity'] ?? 1);
            return $price * $qty;
        });

        $discount = (float) ($data['discount_amount'] ?? 0);
        $taxable = max(0, $subtotal - $discount);
        $taxRate = (float) ($data['tax_rate'] ?? 0);
        $taxAmount = $taxable * ($taxRate / 100);
        $total = $taxable + $taxAmount;

        $proposal = AgencyProposal::create([
            'workspace_id' => $workspaceId,
            'contact_id' => $data['contact_id'] ?? null,
            'uuid' => (string) Str::uuid(),
            'title' => $data['title'],
            'pricing_type' => $data['pricing_type'],
            'line_items' => $data['line_items'],
            'subtotal' => $subtotal,
            'discount_amount' => $discount,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'contract_terms' => $data['contract_terms'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'valid_until' => $data['valid_until'] ?? null,
            'raw' => [
                'note' => $data['note'] ?? null,
                'contract_terms' => $data['contract_terms'] ?? null,
            ],
        ]);

        // Auto-create associated contract shell
        AgencyContract::create([
            'workspace_id' => $workspaceId,
            'proposal_id' => $proposal->id,
            'contact_id' => $proposal->contact_id,
            'title' => 'Contract: ' . $proposal->title,
            'content' => $data['contract_terms'] ?? 'Standard Master Services Agreement (MSA) terms apply.',
            'status' => 'pending_signature',
        ]);

        return redirect()->route('client.agency.proposals.index')->with('success', 'Proposal saved as draft successfully.');
    }

    public function update(Request $request, AgencyProposal $proposal)
    {
        $workspaceId = $this->workspaceId($request);
        abort_unless($proposal->workspace_id === $workspaceId, 403);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'contact_id' => 'nullable|integer|exists:contacts,id',
            'pricing_type' => 'required|string|in:one_time,recurring,installments',
            'status' => 'nullable|string|in:draft,sent,waiting,accepted,declined',
            'line_items' => 'required|array|min:1',
            'line_items.*.product_id' => 'nullable|integer',
            'line_items.*.price_id' => 'nullable|integer',
            'line_items.*.name' => 'required|string',
            'line_items.*.price' => 'required|numeric|min:0',
            'line_items.*.quantity' => 'nullable|numeric|min:1',
            'line_items.*.is_optional' => 'nullable|boolean',
            'line_items.*.is_selected' => 'nullable|boolean',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'valid_until' => 'nullable|date',
            'note' => 'nullable|string|max:2000',
            'contract_terms' => 'nullable|string',
        ]);

        $subtotal = collect($data['line_items'])->sum(function ($item) {
            $price = (float) ($item['price'] ?? 0);
            $qty = (float) ($item['quantity'] ?? 1);
            return $price * $qty;
        });

        $discount = (float) ($data['discount_amount'] ?? 0);
        $taxable = max(0, $subtotal - $discount);
        $taxRate = (float) ($data['tax_rate'] ?? 0);
        $taxAmount = $taxable * ($taxRate / 100);
        $total = $taxable + $taxAmount;

        $raw = $proposal->raw ?? [];
        $history = $raw['revision_history'] ?? [];
        $versionNumber = 'v1.' . count($history);

        $history[] = [
            'version' => $versionNumber,
            'event' => 'Agency Updated Proposal',
            'notes' => 'Updated by workspace admin.',
            'timestamp' => now()->toIso8601String(),
            'snapshot_total' => $total,
            'snapshot_items' => $data['line_items'],
        ];

        $proposal->update([
            'contact_id' => $data['contact_id'] ?? null,
            'title' => $data['title'],
            'pricing_type' => $data['pricing_type'],
            'line_items' => $data['line_items'],
            'subtotal' => $subtotal,
            'discount_amount' => $discount,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'contract_terms' => $data['contract_terms'] ?? null,
            'status' => $data['status'] ?? $proposal->status,
            'valid_until' => $data['valid_until'] ?? null,
            'raw' => array_merge($raw, [
                'note' => $data['note'] ?? null,
                'contract_terms' => $data['contract_terms'] ?? null,
                'revision_history' => $history,
                'current_version' => $versionNumber,
            ]),
        ]);

        if ($proposal->contract) {
            $proposal->contract->update([
                'title' => 'Contract: ' . $proposal->title,
                'content' => $data['contract_terms'] ?? $proposal->contract->content,
            ]);
        }

        return redirect()->route('client.agency.proposals.index')->with('success', 'Proposal updated successfully.');
    }

    public function showPublic(string $uuid): Response
    {
        $proposal = AgencyProposal::with(['contact', 'contract', 'workspace', 'invoices'])
            ->where('uuid', $uuid)
            ->firstOrFail();

        if (!$proposal->viewed_at) {
            $proposal->update(['viewed_at' => now(), 'status' => $proposal->status === 'draft' ? 'sent' : $proposal->status]);
        }

        // Emit document_viewed trigger for automation engine
        $this->documentService->dispatchTrigger('document_viewed', (int) $proposal->workspace_id, (int) $proposal->contact_id, [
            'document_id' => $proposal->id,
            'document_type' => 'proposal',
            'title' => $proposal->title,
            'total_amount' => (float) $proposal->total,
        ]);

        $raw = $proposal->raw ?? [];
        $rawTerms = $proposal->contract?->content ?? $proposal->contract_terms ?? $raw['contract_terms'] ?? 'Standard Master Services Agreement (MSA) applies.';

        // Resolve 9-tier dynamic variables in contract terms
        $resolvedTerms = $this->documentService->resolveVariables(
            $rawTerms,
            $proposal->workspace,
            $proposal->contact,
            [
                'proposal.title' => $proposal->title,
                'proposal.total' => '$' . number_format((float) $proposal->total, 2),
                'proposal.subtotal' => '$' . number_format((float) $proposal->subtotal, 2),
            ]
        );

        $latestInvoice = $proposal->invoices()->latest()->first();

        // Load active store payment gateways
        $store = EcommerceStore::where('workspace_id', $proposal->workspace_id)->first();
        $gateways = [];
        if ($store) {
            $settings = $store->settings ?? [];
            if (!empty($settings['stripe_enabled'])) {
                $gateways[] = 'stripe';
            }
            if (!empty($settings['razorpay_enabled'])) {
                $gateways[] = 'razorpay';
            }
            if (!empty($settings['paypal_enabled'])) {
                $gateways[] = 'paypal';
            }
            if (!empty($settings['cod_enabled'])) {
                $gateways[] = 'bank_transfer';
            }
        }
        if (empty($gateways)) {
            $gateways = ['stripe', 'bank_transfer'];
        }

        return Inertia::render('Agency/Proposals/PublicView', [
            'proposal' => [
                'id' => $proposal->id,
                'uuid' => $proposal->uuid,
                'title' => $proposal->title,
                'pricing_type' => $proposal->pricing_type,
                'line_items' => $proposal->line_items,
                'subtotal' => (float) $proposal->subtotal,
                'discount_amount' => (float) ($proposal->discount_amount ?? 0),
                'tax_rate' => (float) ($proposal->tax_rate ?? 0),
                'tax_amount' => (float) ($proposal->tax_amount ?? 0),
                'total' => (float) $proposal->total,
                'status' => $proposal->status,
                'valid_until' => $proposal->valid_until?->toIso8601String(),
                'revision_history' => $raw['revision_history'] ?? [],
                'current_version' => $raw['current_version'] ?? 'v1.0',
                'workspace' => $proposal->workspace ? [
                    'name' => $proposal->workspace->name,
                    'email' => $proposal->workspace->email,
                    'phone' => $proposal->workspace->phone,
                    'address' => $proposal->workspace->address,
                ] : null,
                'contact' => $proposal->contact ? [
                    'name' => trim("{$proposal->contact->first_name} {$proposal->contact->last_name}") ?: $proposal->contact->email,
                    'email' => $proposal->contact->email,
                    'phone' => $proposal->contact->phone_e164,
                ] : null,
                'note' => $raw['note'] ?? 'Thank you for considering our services. We look forward to working together.',
                'terms' => $resolvedTerms,
                'contract' => $proposal->contract ? [
                    'uuid' => $proposal->contract->uuid,
                    'title' => $proposal->contract->title,
                    'content' => $resolvedTerms,
                    'status' => $proposal->contract->status,
                    'signed_at' => $proposal->contract->signed_at?->toIso8601String(),
                    'client_signature' => $proposal->contract->client_signature,
                ] : null,
                'invoice' => $latestInvoice ? [
                    'uuid' => $latestInvoice->uuid,
                    'invoice_number' => $latestInvoice->invoice_number,
                    'status' => $latestInvoice->status,
                    'total' => (float) $latestInvoice->total,
                    'balance_due' => (float) ($latestInvoice->balance_due ?? $latestInvoice->total),
                ] : null,
            ],
            'availableGateways' => $gateways,
        ]);
    }

    public function accept(Request $request, string $uuid)
    {
        $proposal = AgencyProposal::with(['contract', 'workspace'])->where('uuid', $uuid)->firstOrFail();

        $proposal->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        // Auto-create invoice if not already generated
        $invoice = AgencyInvoice::firstOrCreate(
            ['proposal_id' => $proposal->id],
            [
                'workspace_id' => $proposal->workspace_id,
                'contract_id' => $proposal->contract?->id,
                'contact_id' => $proposal->contact_id,
                'billing_type' => $proposal->pricing_type ?? 'one_time',
                'line_items' => $proposal->line_items,
                'subtotal' => $proposal->subtotal,
                'discount_amount' => $proposal->discount_amount ?? 0,
                'tax_rate' => $proposal->tax_rate ?? 0,
                'tax_amount' => $proposal->tax_amount ?? 0,
                'total' => $proposal->total,
                'amount_paid' => 0.00,
                'balance_due' => $proposal->total,
                'status' => 'unpaid',
                'due_date' => now()->addDays(14),
            ]
        );

        // Emit estimate_accepted trigger for automation engine
        $this->documentService->dispatchTrigger('estimate_accepted', (int) $proposal->workspace_id, (int) $proposal->contact_id, [
            'proposal_id' => $proposal->id,
            'proposal_title' => $proposal->title,
            'total_amount' => (float) $proposal->total,
            'invoice_id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Proposal accepted successfully.',
            'invoice_uuid' => $invoice->uuid,
        ]);
    }

    public function requestRevision(Request $request, string $uuid)
    {
        $proposal = AgencyProposal::where('uuid', $uuid)->firstOrFail();

        $data = $request->validate([
            'notes' => 'required|string|max:2000',
        ]);

        $raw = $proposal->raw ?? [];
        $history = $raw['revision_history'] ?? [];
        $versionNumber = 'v1.' . (count($history) + 1);

        $history[] = [
            'version' => $versionNumber,
            'event' => 'Client Requested Revision',
            'notes' => $data['notes'],
            'timestamp' => now()->toIso8601String(),
            'snapshot_total' => (float) $proposal->total,
            'snapshot_items' => $proposal->line_items,
        ];

        $proposal->update([
            'status' => 'revision_requested',
            'raw' => array_merge($raw, [
                'revision_notes' => $data['notes'],
                'revision_requested_at' => now()->toIso8601String(),
                'revision_history' => $history,
            ]),
        ]);

        return redirect()->back()->with('success', 'Your revision request has been submitted. The team will review and update your proposal shortly.');
    }

    public function downloadPdf(string $uuid)
    {
        $proposal = AgencyProposal::with(['workspace', 'contact', 'contract'])->where('uuid', $uuid)->firstOrFail();
        return view('agency.invoice_pdf', [
            'invoice' => $proposal,
            'workspace' => $proposal->workspace,
            'contact' => $proposal->contact,
        ]);
    }
}
