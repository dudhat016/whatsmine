<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $invoice->invoice_number }}</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; color: #1e293b; font-size: 11px; line-height: 1.5; margin: 0; padding: 25px; }
        
        .logo-badge { display: inline-block; width: 32px; height: 32px; background: #fbbf24; color: #0f172a; font-weight: bold; font-size: 18px; text-align: center; line-height: 32px; border-radius: 4px; float: left; margin-right: 10px; }
        .company-name { font-size: 16px; font-weight: bold; color: #0f172a; }
        .company-sub { font-size: 10px; color: #64748b; }
        
        .header-table { width: 100%; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
        .header-table td { vertical-align: top; }
        
        .title-header { font-size: 20px; font-weight: bold; color: #0f172a; text-transform: uppercase; text-align: right; margin-bottom: 8px; }
        .meta-grid { border-collapse: collapse; float: right; font-size: 10px; }
        .meta-grid td { padding: 4px 8px; border: 1px solid #cbd5e1; }
        .meta-grid .meta-label { font-weight: bold; background: #f8fafc; color: #475569; }

        .billed-row { width: 100%; margin-bottom: 25px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px; }
        .billed-row td { vertical-align: top; }
        .billed-to { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #94a3b8; }
        .billed-name { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px; }
        
        .status-paid { display: inline-block; padding: 4px 10px; border: 1.5px solid #10b981; color: #059669; font-weight: bold; font-size: 10px; text-transform: uppercase; border-radius: 3px; }
        .status-unpaid { display: inline-block; padding: 4px 10px; border: 1.5px solid #ef4444; color: #dc2626; font-weight: bold; font-size: 10px; text-transform: uppercase; border-radius: 3px; }

        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #e2e8f0; }
        .items-table th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
        .items-table td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }

        .summary-box { float: right; width: 220px; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 25px; }
        .summary-row { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
        .summary-total { padding: 8px 10px; background: #f1f5f9; font-weight: bold; font-size: 12px; color: #059669; }

        .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    </style>
</head>
<body>

    <!-- Header Table -->
    <table class="header-table">
        <tr>
            <td width="55%">
                <div>
                    <div class="logo-badge">
                        {{ strtoupper(substr($invoice->workspace->name ?? 'W', 0, 1)) }}
                    </div>
                    <div class="company-name">{{ $invoice->workspace->name ?? 'WhatsMine Agency' }}</div>
                    <div class="company-sub">Official Tax Invoice</div>
                </div>
                <div style="clear: both; padding-top: 8px; font-size: 10px; color: #64748b;">
                    {{ $invoice->workspace->address ?? 'Main Workspace Address' }}<br>
                    {{ $invoice->workspace->phone ?? '' }} {{ $invoice->workspace->email ? '• '.$invoice->workspace->email : '' }}
                </div>
            </td>
            <td width="45%" style="text-align: right;">
                <div class="title-header">INVOICE</div>
                <table class="meta-grid">
                    <tr>
                        <td class="meta-label">Invoice #</td>
                        <td style="font-weight: bold;">{{ $invoice->invoice_number }}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Invoice Date</td>
                        <td>{{ $invoice->created_at->format('d-m-Y') }}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Due Date</td>
                        <td>{{ $invoice->due_date ? $invoice->due_date->format('d-m-Y') : 'On Receipt' }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Billed To & Status Row -->
    <table class="billed-row">
        <tr>
            <td width="70%">
                <div class="billed-to">Billed To</div>
                <div class="billed-name">{{ $invoice->contact ? trim("{$invoice->contact->first_name} {$invoice->contact->last_name}") : 'Client Lead' }}</div>
                <div style="font-size: 10px; color: #475569;">{{ $invoice->contact->email ?? '' }}</div>
                @if(!empty($invoice->contact->phone_e164))
                    <div style="font-size: 10px; color: #475569;">{{ $invoice->contact->phone_e164 }}</div>
                @endif
            </td>
            <td width="30%" style="text-align: right;">
                @if($invoice->status === 'paid')
                    <div class="status-paid">PAID</div>
                @else
                    <div class="status-unpaid">UNPAID</div>
                @endif
            </td>
        </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th width="50%">Description</th>
                <th width="15%" style="text-align: center;">Qty</th>
                <th width="35%" style="text-align: right;">Amount ({{ $invoice->workspace->currency_code ?? 'USD' }})</th>
            </tr>
        </thead>
        <tbody>
            @foreach(($invoice->line_items ?? []) as $item)
            <tr>
                <td><strong style="color: #0f172a;">{{ $item['name'] ?? 'Service Item' }}</strong></td>
                <td style="text-align: center;">{{ $item['quantity'] ?? 1 }} Pcs</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold;">
                    ${{ number_format((float)($item['price'] ?? 0), 2) }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Summary Box -->
    <div class="summary-box">
        <div class="summary-row">
            <span style="color: #64748b;">Sub Total:</span>
            <span style="float: right; font-family: monospace; font-weight: bold;">${{ number_format((float)$invoice->subtotal, 2) }}</span>
            <div style="clear: both;"></div>
        </div>
        @if($invoice->tax_rate > 0)
        <div class="summary-row">
            <span style="color: #64748b;">Tax ({{ $invoice->tax_rate }}%):</span>
            <span style="float: right; font-family: monospace;">${{ number_format((float)$invoice->tax_amount, 2) }}</span>
            <div style="clear: both;"></div>
        </div>
        @endif
        <div class="summary-total">
            <span>Total Due:</span>
            <span style="float: right; font-family: monospace;">${{ number_format((float)$invoice->total, 2) }}</span>
            <div style="clear: both;"></div>
        </div>
    </div>

    <div style="clear: both;"></div>

    <div class="footer">
        Thank you for your business. Generated by WhatsMine Agency Suite.
    </div>
</body>
</html>
