<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Contract #{{ $contract->id }}</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; color: #1e293b; font-size: 11px; line-height: 1.5; margin: 0; padding: 25px; }
        
        .logo-badge { display: inline-block; width: 32px; height: 32px; background: #fbbf24; color: #0f172a; font-weight: bold; font-size: 18px; text-align: center; line-height: 32px; border-radius: 4px; float: left; margin-right: 10px; }
        .company-name { font-size: 16px; font-weight: bold; color: #0f172a; }
        .company-sub { font-size: 10px; color: #64748b; }
        
        .header-table { width: 100%; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; }
        .header-table td { vertical-align: top; }
        
        .title-header { font-size: 20px; font-weight: bold; color: #0f172a; text-transform: uppercase; text-align: right; margin-bottom: 8px; }

        .contract-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 4px; margin-bottom: 25px; font-size: 11px; white-space: pre-wrap; }

        .signature-section { width: 100%; margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px; }
        .signature-section td { vertical-align: top; width: 50%; }
        .signature-img { max-height: 60px; margin-top: 5px; }
        
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
                        {{ strtoupper(substr($contract->workspace->name ?? 'W', 0, 1)) }}
                    </div>
                    <div class="company-name">{{ $contract->workspace->name ?? 'WhatsMine Agency' }}</div>
                    <div class="company-sub">Master Services Agreement (MSA)</div>
                </div>
                <div style="clear: both; padding-top: 8px; font-size: 10px; color: #64748b;">
                    {{ $contract->workspace->address ?? 'Main Workspace Address' }}
                </div>
            </td>
            <td width="45%" style="text-align: right;">
                <div class="title-header">CONTRACT</div>
                <div style="font-size: 11px; font-weight: bold; color: #475569;">Contract #{{ $contract->id }}</div>
                <div style="font-size: 10px; color: #64748b;">Date: {{ $contract->created_at->format('d-m-Y') }}</div>
            </td>
        </tr>
    </table>

    <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 12px;">
        {{ $contract->title }}
    </div>

    <!-- Contract MSA Content Body -->
    <div class="contract-box">
        {{ $contract->content }}
    </div>

    <!-- Signature Section & Audit Trail -->
    @if($contract->signature_data)
    <table class="signature-section">
        <tr>
            <td>
                <strong style="color: #0f172a;">Client E-Signature:</strong><br>
                <img src="{{ $contract->signature_data }}" class="signature-img" alt="Client Signature"><br>
                <span style="font-size: 10px; font-weight: bold; color: #059669;">Signed by {{ $contract->signed_name ?? 'Client' }}</span>
            </td>
            <td style="text-align: right; font-size: 9px; color: #64748b;">
                <strong>Audit Trail Log:</strong><br>
                Signed At: {{ $contract->signed_at ? \Carbon\Carbon::parse($contract->signed_at)->format('d-m-Y H:i:s T') : 'N/A' }}<br>
                IP Address: {{ $contract->signature_ip ?? 'Client Remote Web Session' }}<br>
                Verification Hash: {{ substr(md5($contract->signature_data), 0, 16) }}
            </td>
        </tr>
    </table>
    @endif

    <div class="footer">
        Generated electronically via WhatsMine Agency Suite.
    </div>
</body>
</html>
