<?php

namespace App\Modules\Agency\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Agency\Models\AgencyInvoice;
use App\Modules\Agency\Models\AgencyOnboardingResponse;
use App\Modules\Agency\Services\DocumentService;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Shared\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AgencyInvoiceController extends Controller
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

        $invoices = AgencyInvoice::with(['contact:id,first_name,last_name,email,phone_e164', 'proposal', 'contract'])
            ->where('workspace_id', $workspaceId)
            ->when($request->input('search'), function ($q, $s) {
                $q->where('invoice_number', 'like', "%{$s}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

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

        return Inertia::render('Agency/Invoices/Index', [
            'invoices' => $invoices,
            'contacts' => $contacts,
            'products' => $products,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request)
    {
        $workspaceId = $this->workspaceId($request);

        $data = $request->validate([
            'contact_id' => 'required|integer|exists:contacts,id',
            'billing_type' => 'nullable|string|in:one_time,recurring,installments',
            'line_items' => 'required|array|min:1',
            'line_items.*.product_id' => 'nullable|integer',
            'line_items.*.price_id' => 'nullable|integer',
            'line_items.*.name' => 'required|string',
            'line_items.*.price' => 'required|numeric|min:0',
            'line_items.*.quantity' => 'nullable|numeric|min:1',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'installments' => 'nullable|array',
        ]);

        $subtotal = collect($data['line_items'])->sum(function ($item) {
            $price = (float) ($item['price'] ?? 0);
            $qty = (float) ($item['quantity'] ?? 1);
            return $price * $qty;
        });

        $discount = (float) ($data['discount_amount'] ?? 0);
        $taxableAmount = max(0, $subtotal - $discount);
        $taxRate = (float) ($data['tax_rate'] ?? 0);
        $taxAmount = $taxableAmount * ($taxRate / 100);
        $total = $taxableAmount + $taxAmount;

        $invoice = AgencyInvoice::create([
            'workspace_id' => $workspaceId,
            'contact_id' => $data['contact_id'],
            'billing_type' => $data['billing_type'] ?? 'one_time',
            'line_items' => $data['line_items'],
            'installments' => $data['installments'] ?? null,
            'subtotal' => $subtotal,
            'discount_amount' => $discount,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'amount_paid' => 0.00,
            'balance_due' => $total,
            'status' => 'unpaid',
            'due_date' => $data['due_date'] ? Carbon::parse($data['due_date']) : now()->addDays(14),
        ]);

        return redirect()->route('client.agency.invoices.index')
            ->with('success', 'Invoice #' . $invoice->invoice_number . ' created successfully.');
    }

    public function showPublicCheckout(string $uuid): Response
    {
        $invoice = AgencyInvoice::with([
            'contact',
            'workspace',
            'proposal',
            'contract',
        ])->where('uuid', $uuid)->firstOrFail();

        // Mark invoice viewed timestamp if first time
        if (!$invoice->viewed_at) {
            $invoice->update(['viewed_at' => now()]);
        }

        // Emit document_viewed trigger for automation engine
        $this->documentService->dispatchTrigger('document_viewed', (int) $invoice->workspace_id, (int) $invoice->contact_id, [
            'document_id' => $invoice->id,
            'document_type' => 'invoice',
            'invoice_number' => $invoice->invoice_number,
            'total_amount' => (float) $invoice->total,
            'balance_due' => (float) ($invoice->balance_due ?? $invoice->total),
        ]);

        // Load active store payment gateways for this workspace
        $store = EcommerceStore::where('workspace_id', $invoice->workspace_id)->first();
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

        return Inertia::render('Agency/Invoices/PublicCheckout', [
            'invoice' => [
                'id' => $invoice->id,
                'uuid' => $invoice->uuid,
                'invoice_number' => $invoice->invoice_number,
                'status' => $invoice->status,
                'billing_type' => $invoice->billing_type ?? 'one_time',
                'due_date' => $invoice->due_date?->format('M d, Y'),
                'line_items' => $invoice->line_items ?? [],
                'installments' => $invoice->installments ?? [],
                'subtotal' => (float) $invoice->subtotal,
                'discount_amount' => (float) ($invoice->discount_amount ?? 0),
                'tax_rate' => (float) $invoice->tax_rate,
                'tax_amount' => (float) $invoice->tax_amount,
                'total' => (float) $invoice->total,
                'amount_paid' => (float) ($invoice->amount_paid ?? 0),
                'balance_due' => (float) ($invoice->balance_due ?? $invoice->total),
                'currency' => $invoice->currency ?? 'USD',
                'paid_at' => $invoice->paid_at?->format('M d, Y H:i'),
            ],
            'contact' => $invoice->contact ? [
                'name' => trim("{$invoice->contact->first_name} {$invoice->contact->last_name}") ?: $invoice->contact->email,
                'email' => $invoice->contact->email,
                'phone' => $invoice->contact->phone_e164,
            ] : null,
            'workspace' => [
                'name' => $invoice->workspace->name ?? 'Service Provider',
                'email' => $invoice->workspace->email ?? '',
            ],
            'availableGateways' => $gateways,
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

    public function pay(Request $request, string $uuid)
    {
        $invoice = AgencyInvoice::where('uuid', $uuid)->firstOrFail();

        $data = $request->validate([
            'payment_method' => 'required|string',
            'amount' => 'nullable|numeric|min:0.01',
            'transaction_id' => 'nullable|string',
        ]);

        $payAmount = isset($data['amount']) ? (float) $data['amount'] : (float) ($invoice->balance_due ?? $invoice->total);

        // If Stripe payment is selected
        if (in_array($data['payment_method'], ['stripe', 'card', 'credit_card'])) {
            $stripeSecret = $this->resolveStripeSecretKey((int) $invoice->workspace_id);

            if (!$stripeSecret || strlen($stripeSecret) < 8) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment gateway is not configured for this workspace. Please contact support.',
                ], 422);
            }

            try {
                $stripe = new \Stripe\StripeClient($stripeSecret);

                $session = $stripe->checkout->sessions->create([
                    'payment_method_types' => ['card'],
                    'customer_email' => $invoice->contact?->email,
                    'line_items' => [[
                        'price_data' => [
                            'currency' => strtolower($invoice->currency ?? 'usd'),
                            'unit_amount' => (int) round($payAmount * 100),
                            'product_data' => [
                                'name' => "Invoice #{$invoice->invoice_number}",
                                'description' => "Payment towards Invoice #{$invoice->invoice_number}",
                            ],
                        ],
                        'quantity' => 1,
                    ]],
                    'mode' => 'payment',
                    'client_reference_id' => 'INV-' . $invoice->invoice_number,
                    'metadata' => [
                        'invoice_id' => (string) $invoice->id,
                        'invoice_uuid' => $invoice->uuid,
                        'invoice_number' => $invoice->invoice_number,
                        'pay_amount' => (string) $payAmount,
                        'workspace_id' => (string) $invoice->workspace_id,
                        'type' => 'agency_invoice',
                    ],
                    'success_url' => route('agency.invoices.payment.success', $invoice->uuid) . '?session_id={CHECKOUT_SESSION_ID}&amount=' . $payAmount,
                    'cancel_url' => route('agency.invoices.checkout', $invoice->uuid) . '?payment_status=cancelled',
                ]);

                return response()->json([
                    'success' => true,
                    'requires_redirect' => true,
                    'redirect_url' => $session->url,
                    'message' => 'Redirecting to secure payment checkout...',
                ]);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('AgencyInvoiceController: Stripe session creation failed', ['error' => $e->getMessage()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to initialize payment gateway: ' . $e->getMessage(),
                ], 422);
            }
        }

        // Offline / manual methods (bank_transfer, cash, check, etc.)
        return $this->recordInvoicePayment($invoice, $payAmount, $data['payment_method'], $data['transaction_id'] ?? null);
    }

    private function recordInvoicePayment(AgencyInvoice $invoice, float $payAmount, string $method, ?string $transactionId = null)
    {
        $newAmountPaid = ((float) $invoice->amount_paid) + $payAmount;
        $newBalanceDue = max(0.00, ((float) $invoice->total) - $newAmountPaid);
        $newStatus = $newBalanceDue <= 0.00 ? 'paid' : 'partially_paid';

        $raw = $invoice->raw ?? [];
        $raw['payments'] = $raw['payments'] ?? [];
        $raw['payments'][] = [
            'amount' => $payAmount,
            'method' => $method,
            'transaction_id' => $transactionId ?? ('TXN-' . strtoupper(\Illuminate\Support\Str::random(10))),
            'paid_at' => now()->toIso8601String(),
        ];

        $invoice->update([
            'status' => $newStatus,
            'amount_paid' => $newAmountPaid,
            'balance_due' => $newBalanceDue,
            'paid_at' => $newStatus === 'paid' ? now() : $invoice->paid_at,
            'raw' => $raw,
        ]);

        // Emit invoice_paid trigger for automation engine
        $this->documentService->dispatchTrigger('invoice_paid', (int) $invoice->workspace_id, (int) $invoice->contact_id, [
            'document_id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'amount_paid' => $payAmount,
            'total_amount' => (float) $invoice->total,
            'balance_due' => $newBalanceDue,
            'payment_method' => $method,
            'paid_at' => now()->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'status' => $invoice->status,
            'amount_paid' => (float) $invoice->amount_paid,
            'balance_due' => (float) $invoice->balance_due,
            'message' => 'Payment processed successfully.',
        ]);
    }

    public function paymentSuccess(Request $request, string $uuid)
    {
        $invoice = AgencyInvoice::where('uuid', $uuid)->firstOrFail();

        $sessionId = $request->query('session_id');
        $amount = (float) $request->query('amount', $invoice->balance_due ?? $invoice->total);

        if ($sessionId) {
            $stripeSecret = $this->resolveStripeSecretKey((int) $invoice->workspace_id);
            if ($stripeSecret) {
                try {
                    $stripe = new \Stripe\StripeClient($stripeSecret);
                    $session = $stripe->checkout->sessions->retrieve($sessionId);
                    if ($session && $session->payment_status === 'paid') {
                        $this->recordInvoicePayment($invoice, $amount, 'stripe', $session->payment_intent ?? $session->id);
                        return redirect()->route('agency.invoices.checkout', $uuid)->with('success', 'Payment confirmed! Thank you.');
                    }
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('AgencyInvoiceController: Failed verifying Stripe session', ['session' => $sessionId, 'error' => $e->getMessage()]);
                }
            }
        }

        return redirect()->route('agency.invoices.checkout', $uuid);
    }

    public function downloadPdf(string $uuid)
    {
        $invoice = AgencyInvoice::with(['contact', 'workspace', 'proposal', 'contract'])
            ->where('uuid', $uuid)->firstOrFail();

        $html = view('agency.invoice_pdf', [
            'invoice' => $invoice,
            'workspace' => $invoice->workspace,
            'contact' => $invoice->contact,
        ])->render();

        return response($html)
            ->header('Content-Type', 'text/html; charset=utf-8');
    }
}
