<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proposal #{{ $proposal->id }}</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; color: #1e293b; font-size: 11px; line-height: 1.5; margin: 0; padding: 25px; }
        
        .header-table { width: 100%; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
        .header-table td { vertical-align: top; }
        
        .logo-box { width: 36px; height: 36px; background: #fbbf24; color: #0f172a; font-weight: bold; font-size: 20px; text-align: center; line-height: 36px; border-radius: 6px; }
        .company-name { font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 2px; }
        .company-sub { font-size: 10px; color: #64748b; }
        
        .title-header { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; text-align: right; margin-bottom: 8px; tracking-tight: true; }
        .meta-grid { border-collapse: collapse; float: right; font-size: 10px; }
        .meta-grid td { padding: 4px 10px; border: 1px solid #cbd5e1; }
        .meta-grid .meta-label { font-weight: bold; background: #f8fafc; color: #475569; }

        .billed-row { width: 100%; margin-bottom: 25px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; }
        .billed-row td { vertical-align: middle; }
        .billed-to { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #94a3b8; }
        .billed-name { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px; }
        
        .status-waiting { display: inline-block; padding: 5px 12px; border: 1.5px solid #f59e0b; color: #d97706; font-weight: bold; font-size: 10px; text-transform: uppercase; border-radius: 4px; background: #fffbeb; }
        .status-accepted { display: inline-block; padding: 5px 12px; border: 1.5px solid #10b981; color: #059669; font-weight: bold; font-size: 10px; text-transform: uppercase; border-radius: 4px; background: #ecfdf5; }

        .proposal-title { font-size: 16px; font-weight: bold; color: #0f172a; text-transform: uppercase; margin-bottom: 15px; }

        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #e2e8f0; }
        .items-table th { background: #f1f5f9; padding: 9px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
        .items-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .item-desc { font-size: 9.5px; color: #64748b; margin-top: 3px; }

        .summary-wrapper { width: 100%; margin-bottom: 25px; }
        .summary-box { float: right; width: 230px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
        .summary-row { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; background: #ffffff; }
        .summary-total { padding: 10px 12px; background: #f8fafc; font-weight: bold; font-size: 13px; color: #059669; }

        .terms-section { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 30px; font-size: 10px; color: #475569; }
        .terms-section td { vertical-align: top; width: 50%; }
        .terms-header { font-weight: bold; color: #0f172a; font-size: 11px; margin-bottom: 6px; }
        
        .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    </style>
</head>
<body>

    <!-- Header Table -->
    <table class="header-table">
        <tr>
            <td width="55%">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="46" style="vertical-align: top;">
                            <div class="logo-box">
                                {{ strtoupper(substr($proposal->workspace->name ?? 'W', 0, 1)) }}
                            </div>
                        </td>
                        <td style="vertical-align: top;">
                            <div class="company-name">{{ $proposal->workspace->name ?? 'WhatsMine Agency' }}</div>
                            <div class="company-sub">Official Sales Proposal</div>
                            <div style="padding-top: 6px; font-size: 10px; color: #64748b; line-height: 1.4;">
                                {{ $proposal->workspace->address ?? 'Main Workspace Address' }}<br>
                                {{ $proposal->workspace->phone ?? '' }} {{ $proposal->workspace->email ? '• '.$proposal->workspace->email : '' }}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            <td width="45%" style="text-align: right;">
                <div class="title-header">PROPOSAL</div>
                <table class="meta-grid">
                    <tr>
                        <td class="meta-label">Proposal #</td>
                        <td style="font-weight: bold; color: #0f172a;">#{{ $proposal->id }}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Valid Till</td>
                        <td>{{ $proposal->valid_until ? $proposal->valid_until->format('d-m-Y') : '30 Days' }}</td>
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
                <div class="billed-name">{{ $proposal->contact ? trim("{$proposal->contact->first_name} {$proposal->contact->last_name}") : 'Client Lead' }}</div>
                <div style="font-size: 10px; color: #475569;">{{ $proposal->contact->email ?? '' }}</div>
                @if(!empty($proposal->contact->phone_e164))
                    <div style="font-size: 10px; color: #475569;">{{ $proposal->contact->phone_e164 }}</div>
                @endif
            </td>
            <td width="30%" style="text-align: right;">
                @if(in_array($proposal->status, ['accepted', 'signed']))
                    <div class="status-accepted">ACCEPTED</div>
                @else
                    <div class="status-waiting">{{ strtoupper($proposal->status ?? 'WAITING') }}</div>
                @endif
            </td>
        </tr>
    </table>

    <!-- Proposal Title -->
    <div class="proposal-title">{{ $proposal->title }}</div>

    <!-- Line Items Table (Worksuite Style) -->
    <table class="items-table">
        <thead>
            <tr>
                <th width="45%">Description</th>
                <th width="12%" style="text-align: center;">Quantity</th>
                <th width="20%" style="text-align: right;">Unit Price ({{ $proposal->workspace->currency_code ?? 'USD' }})</th>
                <th width="8%" style="text-align: center;">Tax</th>
                <th width="15%" style="text-align: right;">Amount ({{ $proposal->workspace->currency_code ?? 'USD' }})</th>
            </tr>
        </thead>
        <tbody>
            @foreach(($proposal->line_items ?? []) as $item)
            <tr>
                <td>
                    <strong style="color: #0f172a;">{{ $item['name'] ?? 'Service Item' }}</strong>
                    <div class="item-desc">{{ $item['description'] ?? 'Professional deliverable as detailed in scope agreement.' }}</div>
                </td>
                <td style="text-align: center;">{{ $item['quantity'] ?? 1 }} Pcs</td>
                <td style="text-align: right; font-family: monospace;">${{ number_format((float)($item['price'] ?? 0), 2) }}</td>
                <td style="text-align: center; color: #cbd5e1;">-</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold;">
                    ${{ number_format((float)($item['price'] ?? 0) * (int)($item['quantity'] ?? 1), 2) }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Sub Total & Total Calculation Box -->
    <div class="summary-wrapper">
        <div class="summary-box">
            <div class="summary-row">
                <span style="color: #64748b;">Sub Total:</span>
                <span style="float: right; font-family: monospace; font-weight: bold;">${{ number_format((float)$proposal->subtotal, 2) }}</span>
                <div style="clear: both;"></div>
            </div>
            <div class="summary-total">
                <span>Total:</span>
                <span style="float: right; font-family: monospace;">${{ number_format((float)$proposal->total, 2) }}</span>
                <div style="clear: both;"></div>
            </div>
        </div>
        <div style="clear: both;"></div>
    </div>

    <!-- Notes & Terms (Both Left-Aligned) -->
    <table class="terms-section" cellpadding="0" cellspacing="0">
        <tr>
            <td style="padding-right: 15px;">
                <div class="terms-header">Note</div>
                <div style="line-height: 1.4;">{{ $proposal->raw['note'] ?? 'Thank you for considering our services. We look forward to working together.' }}</div>
            </td>
            <td style="padding-left: 15px;">
                <div class="terms-header">Terms and Conditions</div>
                <div style="line-height: 1.4;">{{ $proposal->contract->content ?? ($proposal->raw['contract_terms'] ?? 'Thank you for your business. Master Services Agreement (MSA) applies.') }}</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Generated electronically via WhatsMine Agency Suite.
    </div>
</body>
</html>
