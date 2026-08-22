<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $form->title ?? $form->name }}</title>
    <style>
        :root {
            --theme-color: {{ $form->settings['theme_color'] ?? '#25D366' }};
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            color: #1f2937;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .form-card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            width: 100%;
            max-width: 480px;
            padding: 28px;
        }
        .form-header { margin-bottom: 20px; text-align: center; }
        .form-title { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 6px; }
        .form-desc { font-size: 14px; color: #6b7280; line-height: 1.5; }
        
        .alert {
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 20px;
        }
        .alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-info { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }

        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
            border-color: var(--theme-color);
            box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.15);
        }
        .form-checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 13px;
            color: #4b5563;
            cursor: pointer;
        }
        .form-checkbox-label input { margin-top: 3px; }
        
        .btn-submit {
            width: 100%;
            padding: 12px;
            font-size: 15px;
            font-weight: 600;
            color: #ffffff;
            background-color: var(--theme-color);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .btn-submit:hover { opacity: 0.9; }

        .otp-box {
            display: flex;
            gap: 8px;
            justify-content: center;
            margin: 20px 0;
        }
        .otp-input {
            width: 48px;
            height: 54px;
            text-align: center;
            font-size: 22px;
            font-weight: 700;
            border: 2px solid #d1d5db;
            border-radius: 8px;
        }
        .otp-input:focus {
            border-color: var(--theme-color);
        }
    </style>
</head>
<body>

<div class="form-card">

    <div class="form-header">
        <h1 class="form-title">{{ $form->title ?? $form->name }}</h1>
        @if(!empty($form->description))
            <p class="form-desc">{{ $form->description }}</p>
        @endif
    </div>

    @if(session('success'))
        <div class="alert alert-success">
            {{ session('success') }}
        </div>
    @endif

    @if($errors->any())
        <div class="alert alert-error">
            <ul style="padding-left: 18px;">
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- ── Step 2: OTP Verification Mode ────────────────────────────────────────── --}}
    @if(session('pending_verification'))
        <div class="alert alert-info">
            {{ session('message') }}
            @if(session('demo_otp'))
                <br><strong>[DEMO OTP CODE: {{ session('demo_otp') }}]</strong>
            @endif
        </div>

        <form action="{{ route('public.subscribe.verify_otp', $form->slug) }}" method="POST">
            @csrf
            <input type="hidden" name="submission_id" value="{{ session('submission_id') }}">

            <div class="form-group">
                <label class="form-label" style="text-align: center;">Enter 6-Digit OTP Code</label>
                <div class="otp-box">
                    <input type="text" name="otp_code" maxlength="6" class="form-input" style="text-align: center; font-size: 20px; letter-spacing: 4px; font-weight: 700;" placeholder="000000" required autofocus>
                </div>
            </div>

            <button type="submit" class="btn-submit">Verify & Confirm Subscription</button>
        </form>

    {{-- ── Step 1: Initial Form View ────────────────────────────────────────────── --}}
    @else
        <form action="{{ route('public.subscribe.submit', $form->slug) }}" method="POST">
            @csrf

            {{-- Standard Fields --}}
            @php
                $enabledFields = $form->fields ?? ['email'];
            @endphp

            @if(in_array('first_name', $enabledFields))
                <div class="form-group">
                    <label class="form-label">First Name</label>
                    <input type="text" name="first_name" class="form-input" value="{{ old('first_name') }}" placeholder="e.g. John">
                </div>
            @endif

            @if(in_array('last_name', $enabledFields))
                <div class="form-group">
                    <label class="form-label">Last Name</label>
                    <input type="text" name="last_name" class="form-input" value="{{ old('last_name') }}" placeholder="e.g. Doe">
                </div>
            @endif

            @if(in_array('email', $enabledFields))
                <div class="form-group">
                    <label class="form-label">Email Address <span style="color:#ef4444;">*</span></label>
                    <input type="email" name="email" class="form-input" value="{{ old('email') }}" placeholder="e.g. john@example.com" required>
                </div>
            @endif

            @if(in_array('phone_e164', $enabledFields))
                <div class="form-group">
                    <label class="form-label">WhatsApp Phone Number</label>
                    <input type="tel" name="phone_e164" class="form-input" value="{{ old('phone_e164') }}" placeholder="e.g. +1234567890">
                </div>
            @endif

            {{-- Dynamic Custom Fields --}}
            @php
                $customConfigs = $form->settings['custom_fields'] ?? [];
            @endphp

            @foreach($customConfigs as $cf)
                @php
                    $cfKey = $cf['key'] ?? '';
                    $cfLabel = $cf['label'] ?? $cfKey;
                    $cfType = $cf['type'] ?? 'text';
                    $cfReq = !empty($cf['required']);
                @endphp

                <div class="form-group">
                    <label class="form-label">
                        {{ $cfLabel }}
                        @if($cfReq) <span style="color:#ef4444;">*</span> @endif
                    </label>

                    @if($cfType === 'textarea')
                        <textarea name="custom_fields[{{ $cfKey }}]" class="form-textarea" rows="3" placeholder="{{ $cf['placeholder'] ?? '' }}" {{ $cfReq ? 'required' : '' }}>{{ old("custom_fields.{$cfKey}") }}</textarea>
                    
                    @elseif($cfType === 'select')
                        <select name="custom_fields[{{ $cfKey }}]" class="form-select" {{ $cfReq ? 'required' : '' }}>
                            <option value="">Select an option...</option>
                            @foreach(($cf['options'] ?? []) as $opt)
                                <option value="{{ $opt }}" {{ old("custom_fields.{$cfKey}") === $opt ? 'selected' : '' }}>{{ $opt }}</option>
                            @endforeach
                        </select>

                    @elseif($cfType === 'radio')
                        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
                            @foreach(($cf['options'] ?? []) as $opt)
                                <label class="form-checkbox-label">
                                    <input type="radio" name="custom_fields[{{ $cfKey }}]" value="{{ $opt }}" {{ old("custom_fields.{$cfKey}") === $opt ? 'checked' : '' }} {{ $cfReq ? 'required' : '' }}>
                                    <span>{{ $opt }}</span>
                                </label>
                            @endforeach
                        </div>

                    @else
                        <input type="{{ $cfType === 'number' ? 'number' : ($cfType === 'date' ? 'date' : 'text') }}" 
                               name="custom_fields[{{ $cfKey }}]" 
                               class="form-input" 
                               value="{{ old("custom_fields.{$cfKey}") }}" 
                               placeholder="{{ $cf['placeholder'] ?? '' }}" 
                               {{ $cfReq ? 'required' : '' }}>
                    @endif
                </div>
            @endforeach

            {{-- GDPR Consent --}}
            @if($form->gdpr_checkbox)
                <div class="form-group">
                    <label class="form-checkbox-label">
                        <input type="checkbox" name="gdpr_consent" value="1" required>
                        <span>{{ $form->gdpr_text ?? 'I agree to receive communications and updates.' }}</span>
                    </label>
                </div>
            @endif

            <button type="submit" class="btn-submit">
                {{ $form->settings['button_text'] ?? 'Subscribe Now' }}
            </button>
        </form>
    @endif

</div>

</body>
</html>
