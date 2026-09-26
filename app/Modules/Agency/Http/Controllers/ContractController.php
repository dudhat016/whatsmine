<?php

namespace App\Modules\Agency\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Agency\Models\AgencyContract;
use App\Modules\Agency\Models\AgencyInvoice;
use App\Modules\Agency\Services\DocumentService;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function __construct(
        private readonly DocumentService $documentService
    ) {}

    /**
     * E-Signature execution: signs contract, generates audit log and checksum, and ensures invoice exists.
     */
    public function sign(Request $request, string $uuid)
    {
        $contract = AgencyContract::with(['proposal', 'contact', 'workspace'])
            ->where('uuid', $uuid)
            ->firstOrFail();

        $data = $request->validate([
            'signature_data' => 'required|string', // Base64 canvas data or typed string
            'signer_name' => 'required|string|max:255',
            'signer_email' => 'required|email|max:255',
        ]);

        $auditLog = [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()->toIso8601String(),
            'signer_name' => $data['signer_name'],
            'signer_email' => $data['signer_email'],
        ];

        $checksum = $this->documentService->generateChecksum(
            $contract->content ?? '',
            array_merge($auditLog, ['signature' => substr($data['signature_data'], 0, 50)])
        );

        $contract->update([
            'status' => 'signed',
            'client_signature' => [
                'type' => str_starts_with($data['signature_data'], 'data:image') ? 'draw' : 'type',
                'value' => $data['signature_data'],
                'signed_by' => $data['signer_name'],
                'signer_email' => $data['signer_email'],
            ],
            'audit_log' => array_merge($auditLog, ['checksum' => $checksum]),
            'document_checksum' => $checksum,
            'signed_at' => now(),
        ]);

        if ($contract->proposal) {
            $contract->proposal->update([
                'status' => 'accepted',
                'accepted_at' => now(),
            ]);

            // Ensure linked invoice is ready for checkout
            AgencyInvoice::firstOrCreate(
                ['proposal_id' => $contract->proposal->id],
                [
                    'workspace_id' => $contract->workspace_id,
                    'contract_id' => $contract->id,
                    'contact_id' => $contract->contact_id,
                    'billing_type' => $contract->proposal->pricing_type ?? 'one_time',
                    'line_items' => $contract->proposal->line_items,
                    'subtotal' => $contract->proposal->subtotal,
                    'discount_amount' => $contract->proposal->discount_amount ?? 0,
                    'tax_rate' => $contract->proposal->tax_rate ?? 0,
                    'tax_amount' => $contract->proposal->tax_amount ?? 0,
                    'total' => $contract->proposal->total,
                    'amount_paid' => 0.00,
                    'balance_due' => $contract->proposal->total,
                    'status' => 'unpaid',
                    'due_date' => now()->addDays(14),
                ]
            );
        }

        // Dispatch contract_signed trigger into the Automation Engine
        $this->documentService->dispatchTrigger('contract_signed', (int) $contract->workspace_id, (int) $contract->contact_id, [
            'contract_id' => $contract->id,
            'contract_title' => $contract->title,
            'signer_name' => $data['signer_name'],
            'signer_email' => $data['signer_email'],
            'signed_at' => now()->toIso8601String(),
            'checksum' => $checksum,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contract signed successfully.',
            'checksum' => $checksum,
        ]);
    }

    public function downloadPdf(string $uuid)
    {
        $contract = AgencyContract::with(['proposal', 'contact', 'workspace'])->where('uuid', $uuid)->firstOrFail();
        return view('agency.invoice_pdf', [
            'invoice' => $contract,
            'workspace' => $contract->workspace,
            'contact' => $contract->contact,
        ]);
    }
}
