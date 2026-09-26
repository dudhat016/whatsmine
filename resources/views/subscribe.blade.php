<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $form->title ?? $form->name }}</title>
    @php
        $cardPadding = $form->settings['card_padding'] ?? 24;
        $fieldGap = $form->settings['field_gap'] ?? 12;
        $cardBorderRadius = $form->settings['card_border_radius'] ?? 16;
        $cardMaxWidth = $form->settings['card_max_width'] ?? 576;
    @endphp
    <style>
        :root {
            --theme-color: {{ $form->settings['theme_color'] ?? '#25D366' }};
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1f2937;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px 16px;
        }
        .form-container {
            width: 100%;
            max-width: {{ $cardMaxWidth }}px;
        }
        .form-card {
            background: #ffffff;
            border-radius: {{ $cardBorderRadius }}px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            width: 100%;
            padding: {{ $cardPadding }}px;
        }
        .form-header { margin-bottom: 20px; text-align: center; }
        .form-title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 6px; }
        .form-desc { font-size: 14px; color: #6b7280; line-height: 1.5; }
        
        .alert {
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 16px;
        }
        .alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-info { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }

        .fields-stack {
            display: flex;
            flex-direction: column;
            gap: {{ $fieldGap }}px;
        }
        .form-group {
            margin-bottom: 0;
            width: 100%;
        }
        .form-row {
            display: flex;
            gap: 8px;
        }
        .form-label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
        }
        .form-input, .form-textarea {
            width: 100%;
            padding: 9px 12px;
            font-size: 14px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background-color: #ffffff;
            color: #111827;
            outline: none;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input::placeholder, .form-textarea::placeholder {
            color: #9ca3af;
        }
        .form-input:focus, .form-textarea:focus {
            border-color: var(--theme-color);
            box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.2);
        }

        /* Common Consistent Form Validation Styles */
        .form-input.has-error,
        .form-textarea.has-error,
        .custom-select-wrapper.has-error select,
        .custom-datepicker-trigger.has-error,
        .custom-dropzone.has-error,
        .custom-signature-pad.has-error {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.18) !important;
        }
        .custom-checkbox-item.has-error .custom-checkbox-box {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.18) !important;
        }
        .custom-radio-item.has-error .custom-radio-circle {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.18) !important;
        }
        .form-label.has-error {
            color: #ef4444 !important;
        }
        .form-error-msg {
            color: #ef4444;
            font-size: 12px;
            font-weight: 500;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
            line-height: 1.3;
            animation: fadeInError 0.15s ease-in-out;
        }
        .form-error-msg svg {
            flex-shrink: 0;
            width: 13px;
            height: 13px;
        }
        @keyframes fadeInError {
            from { opacity: 0; transform: translateY(-3px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Custom Select */
        .custom-select-wrapper {
            position: relative;
            width: 100%;
        }
        .custom-select-wrapper select {
            width: 100%;
            padding: 9px 36px 9px 12px;
            font-size: 14px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background-color: #ffffff;
            color: #111827;
            outline: none;
            appearance: none;
            cursor: pointer;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .custom-select-wrapper select:focus {
            border-color: var(--theme-color);
            box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.2);
        }
        .custom-select-arrow {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            color: #9ca3af;
            display: flex;
            align-items: center;
        }

        /* Custom Calendar Datepicker Matching UI Component */
        .custom-datepicker-container {
            position: relative;
            width: 100%;
        }
        .custom-datepicker-trigger {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 12px;
            font-size: 14px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background-color: #ffffff;
            color: #111827;
            cursor: pointer;
            text-align: left;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .custom-datepicker-trigger:focus, .custom-datepicker-trigger.active {
            border-color: var(--theme-color);
            box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.2);
            outline: none;
        }
        .custom-datepicker-trigger svg {
            color: #9ca3af;
            flex-shrink: 0;
        }
        .custom-datepicker-trigger .date-text {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .custom-datepicker-trigger .placeholder-text {
            color: #9ca3af;
        }

        .cal-popover {
            position: absolute;
            top: calc(100% + 6px);
            left: 0;
            z-index: 50;
            width: 280px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            padding: 14px;
            display: none;
        }
        .cal-popover.open {
            display: block;
        }
        .cal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            margin-bottom: 12px;
        }
        .cal-header-titles {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .cal-title-btn {
            background: none;
            border: none;
            font-size: 13px;
            font-weight: 700;
            color: #111827;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s;
        }
        .cal-title-btn:hover {
            background: #f1f5f9;
        }
        .cal-title-btn.active {
            background: #ecfdf5;
            color: var(--theme-color);
        }
        .cal-nav {
            display: flex;
            gap: 4px;
        }
        .cal-nav-btn {
            background: none;
            border: none;
            border-radius: 6px;
            padding: 4px;
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .cal-nav-btn:hover {
            background: #f1f5f9;
            color: #111827;
        }
        .cal-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            color: #9ca3af;
            margin-bottom: 6px;
        }
        .cal-days-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
        }
        .cal-months-grid, .cal-years-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            padding: 4px 0;
        }
        .cal-grid-cell {
            padding: 8px 4px;
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            color: #374151;
            background: transparent;
            border: 1px solid transparent;
            transition: all 0.15s;
        }
        .cal-grid-cell:hover {
            background: #f1f5f9;
        }
        .cal-grid-cell.selected {
            background: var(--theme-color) !important;
            color: #ffffff !important;
            border-color: var(--theme-color) !important;
        }
        .cal-days-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
        }
        .cal-day-cell {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 500;
            border-radius: 8px;
            cursor: pointer;
            color: #1f2937;
            background: transparent;
            border: 1px solid transparent;
            transition: all 0.1s;
        }
        .cal-day-cell:hover:not(.disabled) {
            background: #f1f5f9;
        }
        .cal-day-cell.other-month {
            color: #cbd5e1;
        }
        .cal-day-cell.today {
            border-color: var(--theme-color);
            color: var(--theme-color);
            font-weight: 700;
        }
        .cal-day-cell.selected {
            background: var(--theme-color) !important;
            color: #ffffff !important;
            border-color: var(--theme-color) !important;
            font-weight: 700;
        }
        .cal-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid #f1f5f9;
        }
        .cal-footer-btn {
            background: none;
            border: none;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
        }
        .cal-footer-clear {
            color: #6b7280;
        }
        .cal-footer-clear:hover {
            color: #ef4444;
            background: #fef2f2;
        }
        .cal-footer-today {
            color: var(--theme-color);
        }
        .cal-footer-today:hover {
            background: #ecfdf5;
        }

        /* Custom Radio */
        .custom-radio-item {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            user-select: none;
            font-size: 14px;
            color: #374151;
        }
        .custom-radio-item input[type="radio"] {
            display: none;
        }
        .custom-radio-circle {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid #d1d5db;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: border-color 0.15s, transform 0.15s;
            flex-shrink: 0;
            background: #ffffff;
        }
        .custom-radio-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--theme-color);
            transform: scale(0);
            transition: transform 0.15s ease-in-out;
        }
        .custom-radio-item input[type="radio"]:checked + .custom-radio-circle {
            border-color: var(--theme-color);
        }
        .custom-radio-item input[type="radio"]:checked + .custom-radio-circle .custom-radio-dot {
            transform: scale(1);
        }
        .custom-radio-item:hover .custom-radio-circle {
            border-color: #9ca3af;
        }

        /* Custom Checkbox */
        .custom-checkbox-item {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            user-select: none;
            font-size: 14px;
            color: #374151;
        }
        .custom-checkbox-item input[type="checkbox"] {
            display: none;
        }
        .custom-checkbox-box {
            width: 18px;
            height: 18px;
            border-radius: 5px;
            border: 2px solid #d1d5db;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
            flex-shrink: 0;
            background: #ffffff;
            color: #ffffff;
        }
        .custom-checkbox-box svg {
            width: 12px;
            height: 12px;
            stroke-width: 3;
            opacity: 0;
            transform: scale(0.6);
            transition: all 0.15s ease;
        }
        .custom-checkbox-item input[type="checkbox"]:checked + .custom-checkbox-box {
            background-color: var(--theme-color);
            border-color: var(--theme-color);
        }
        .custom-checkbox-item input[type="checkbox"]:checked + .custom-checkbox-box svg {
            opacity: 1;
            transform: scale(1);
        }
        .custom-checkbox-item:hover .custom-checkbox-box {
            border-color: #9ca3af;
        }

        /* Custom File Upload Dropzone */
        .custom-dropzone {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 18px 14px;
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            background: #f8fafc;
            text-align: center;
            cursor: pointer;
            transition: border-color 0.15s, background-color 0.15s;
            position: relative;
        }
        .custom-dropzone:hover {
            border-color: var(--theme-color);
            background: #f0fdf4;
        }
        .custom-dropzone input[type="file"] {
            position: absolute;
            inset: 0;
            opacity: 0;
            cursor: pointer;
            width: 100%;
            height: 100%;
        }
        .dropzone-icon {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #ecfdf5;
            color: var(--theme-color);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
        }
        .dropzone-title {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
        }
        .dropzone-sub {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 2px;
        }
        .dropzone-filename {
            font-size: 12px;
            font-weight: 600;
            color: var(--theme-color);
            margin-top: 6px;
            display: none;
        }

        /* Star Rating */
        .star-rating-group {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .star-rating-group .star-btn {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            color: #d1d5db;
            transition: color 0.15s, transform 0.1s;
            display: flex;
            align-items: center;
        }
        .star-rating-group .star-btn.active,
        .star-rating-group .star-btn:hover,
        .star-rating-group .star-btn.hovered {
            color: #fbbf24;
        }
        .star-rating-group .star-btn:hover {
            transform: scale(1.1);
        }

        /* Scale buttons */
        .scale-btn.active {
            background-color: var(--theme-color) !important;
            color: #ffffff !important;
            border-color: var(--theme-color) !important;
        }
        
        .btn-submit {
            width: 100%;
            padding: 11px 16px;
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            background-color: var(--theme-color);
            border: none;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: opacity 0.15s, transform 0.1s;
            margin-top: 16px;
        }
        .btn-submit:hover { opacity: 0.92; }
        .btn-submit:active { transform: scale(0.99); }

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
        /* 2-Step Order Form & Monetization Elements (GHL Style) */
        .order-step-nav {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            padding: 4px;
            background: #f1f5f9;
            border-radius: 10px;
            margin-bottom: 16px;
        }
        .order-step-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            background: transparent;
            color: #64748b;
            transition: all 0.15s;
        }
        .order-step-btn.active {
            background: #ffffff;
            color: var(--theme-color);
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .order-step-num {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 800;
            background: #cbd5e1;
            color: #1e293b;
        }
        .order-step-btn.active .order-step-num {
            background: var(--theme-color);
            color: #ffffff;
        }

        .product-select-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            background: #ffffff;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.15s;
        }
        .product-select-card:hover {
            border-color: #cbd5e1;
        }
        .product-select-card.selected {
            border-color: var(--theme-color);
            background: #f0fdf4;
        }
        .product-select-radio {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px;
            shrink: 0;
        }
        .product-select-card.selected .product-select-radio {
            border-color: var(--theme-color);
        }
        .product-select-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: transparent;
        }
        .product-select-card.selected .product-select-dot {
            background: var(--theme-color);
        }

        .order-bump-card {
            position: relative;
            padding: 14px 16px;
            border: 2px dashed #f59e0b;
            border-radius: 14px;
            background: #fffbeb;
            margin: 14px 0;
            cursor: pointer;
            transition: all 0.15s;
        }
        .order-bump-card:hover {
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
        }
        .order-bump-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: #f59e0b;
            color: #ffffff;
            margin-bottom: 6px;
        }

        .order-summary-box {
            padding: 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            margin-top: 14px;
            font-size: 13px;
        }
        .order-summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            color: #475569;
        }
        .order-summary-row.total {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #cbd5e1;
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
        }
        .summary-row-bump {
            color: #b45309;
            display: none;
        }
        .summary-row-discount {
            color: #16a34a;
            display: none;
        }
        .summary-total-price {
            color: var(--theme-color);
        }

        /* Product Select & Multi-Tier Cards */
        .product-select-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .product-thumb-img {
            width: 38px;
            height: 38px;
            border-radius: 6px;
            object-fit: cover;
            border: 1px solid #e2e8f0;
            flex-shrink: 0;
        }
        .product-plan-title {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
        }
        .product-plan-desc {
            font-size: 11px;
            color: #64748b;
        }
        .product-plan-price {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
        }

        /* Order Bump Component */
        .order-bump-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .order-bump-price {
            font-size: 13px;
            font-weight: 800;
            color: #b45309;
        }
        .order-bump-body {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-top: 4px;
        }
        .order-bump-checkbox {
            width: 16px;
            height: 16px;
            margin-top: 2px;
            accent-color: #f59e0b;
            cursor: pointer;
        }
        .order-bump-text {
            font-size: 12px;
        }
        .order-bump-title {
            font-weight: 700;
            color: #1e293b;
        }
        .order-bump-desc {
            color: #64748b;
            font-size: 11px;
            margin-top: 2px;
        }

        /* Coupon Code Component */
        .coupon-box {
            display: flex;
            gap: 6px;
            margin-top: 10px;
        }
        .coupon-input {
            flex: 1;
            padding: 8px 12px;
            font-size: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            text-transform: uppercase;
        }
        .coupon-btn {
            padding: 8px 14px;
            background: #1e293b;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s;
        }
        .coupon-btn:hover {
            background: #0f172a;
        }
        .coupon-feedback {
            font-size: 11px;
            margin-top: 4px;
            display: none;
        }

        /* 2-Step Order Form Controls */
        .order-products-list-wrap {
            margin-bottom: 12px;
        }
        .order-products-list-label {
            margin-bottom: 8px;
            font-weight: 700;
        }
        .order-step-2-content {
            display: none;
        }
        .order-submit-btn {
            margin-top: 14px;
            font-size: 15px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .order-step-btn-wrap {
            margin-top: 14px;
        }
        .order-step1-next-btn {
            margin-top: 4px;
            font-weight: 700;
        }

        /* Payment Method Component Styles */
        .payment-method-container {
            margin: 14px 0 10px 0;
            padding: 14px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .payment-method-header {
            margin-bottom: 12px;
        }
        .secure-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-weight: 700;
            color: #16a34a;
            background: #f0fdf4;
            padding: 2px 8px;
            border-radius: 9999px;
            border: 1px solid #bbf7d0;
        }
        .payment-card-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 12px;
        }
        .payment-card-icons {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .card-brand-tag {
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
        }
        .card-brand-logos {
            display: flex;
            gap: 4px;
            align-items: center;
        }
        .brand-badge {
            font-size: 9px;
            font-weight: 900;
            padding: 2px 5px;
            border-radius: 4px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .brand-visa {
            background: #1a1f71;
            color: #ffffff;
        }
        .brand-mc {
            background: #eb001b;
            color: #ffffff;
        }
        .brand-amex {
            background: #006fcf;
            color: #ffffff;
        }
        .payment-input {
            background: #ffffff !important;
            font-size: 13px !important;
            padding: 9px 12px !important;
        }
        .card-number-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }
        .card-type-icon {
            position: absolute;
            right: 10px;
            display: flex;
            align-items: center;
            pointer-events: none;
        }
        .cvc-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }
        .cvc-lock-icon {
            position: absolute;
            right: 10px;
            pointer-events: none;
        }
    </style>
</head>
<body>

<div class="form-container">
    <div class="form-card">

        @php
            $builderFields = $form->settings['builder_fields'] ?? null;
        @endphp

        {{-- If legacy form without builder_fields, render standard top header --}}
        @if(empty($builderFields))
            <div class="form-header">
                <h1 class="form-title">{{ $form->title ?? $form->name }}</h1>
                @if(!empty($form->description))
                    <p class="form-desc">{{ $form->description }}</p>
                @endif
            </div>
        @endif

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

            <form id="public_otp_form" action="{{ route('public.subscribe.verify_otp', $form->slug) }}" method="POST" novalidate>
                @csrf
                <input type="hidden" name="submission_id" value="{{ session('submission_id') }}">

                <div class="form-group" style="margin-bottom: 16px;">
                    <label class="form-label" for="otp_code_input" style="text-align: center;">Enter 6-Digit OTP Code</label>
                    <div class="otp-box">
                        <input type="text" id="otp_code_input" name="otp_code" maxlength="6" class="form-input" style="text-align: center; font-size: 20px; letter-spacing: 4px; font-weight: 700;" placeholder="000000" required autofocus>
                    </div>
                </div>

                <button type="submit" class="btn-submit">Verify & Confirm Subscription</button>
            </form>

        {{-- ── Step 1: Initial Form View ────────────────────────────────────────────── --}}
        @else
            <form id="public_subscribe_form" action="{{ route('public.subscribe.submit', $form->slug) }}" method="POST" enctype="multipart/form-data" novalidate>
                @csrf

                @if(!empty($builderFields) && is_array($builderFields))
                    @php
                        $rows = [];
                        $total = count($builderFields);
                        $idx = 0;
                        while ($idx < $total) {
                            $curr = $builderFields[$idx];
                            $currW = $curr['width'] ?? 'full';
                            $next = $builderFields[$idx + 1] ?? null;
                            $nextW = $next['width'] ?? 'full';

                            if ($currW === 'half' && $next && $nextW === 'half') {
                                $rows[] = ['type' => 'pair', 'fields' => [$curr, $next]];
                                $idx += 2;
                            } else {
                                $rows[] = ['type' => 'single', 'field' => $curr];
                                $idx++;
                            }
                        }
                    @endphp

                    <div class="fields-stack">
                        @foreach($rows as $row)
                            @if($row['type'] === 'pair')
                                <div class="form-row">
                                    @foreach($row['fields'] as $fIdx => $f)
                                        @php
                                            $fType = $f['type'] ?? 'text';
                                            $fKey = (!empty($f['key']) && $f['key'] !== $fType) ? $f['key'] : ($f['id'] ?? ($f['key'] ?? $fType));
                                            $fLabel = $f['label'] ?? '';
                                            $fPlaceholder = $f['placeholder'] ?? '';
                                            $fReq = !empty($f['required']);
                                            $fAlign = $f['align'] ?? 'left';
                                            $fColor = $f['color'] ?? null;
                                            $fShowLabel = ($f['showLabel'] ?? true) !== false;
                                            $fieldId = 'form_field_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $f['id'] ?? ($fKey . '_p' . $fIdx));
                                            $sArr = [];
                                            if (isset($f['marginTop']) && $f['marginTop'] !== '') $sArr[] = "margin-top: {$f['marginTop']}px;";
                                            if (isset($f['marginBottom']) && $f['marginBottom'] !== '') $sArr[] = "margin-bottom: {$f['marginBottom']}px;";
                                            if (isset($f['marginLeft']) && $f['marginLeft'] !== '') $sArr[] = "margin-left: {$f['marginLeft']}px;";
                                            if (isset($f['marginRight']) && $f['marginRight'] !== '') $sArr[] = "margin-right: {$f['marginRight']}px;";
                                            if (isset($f['paddingTop']) && $f['paddingTop'] !== '') $sArr[] = "padding-top: {$f['paddingTop']}px;";
                                            if (isset($f['paddingBottom']) && $f['paddingBottom'] !== '') $sArr[] = "padding-bottom: {$f['paddingBottom']}px;";
                                            if (isset($f['paddingLeft']) && $f['paddingLeft'] !== '') $sArr[] = "padding-left: {$f['paddingLeft']}px;";
                                            if (isset($f['paddingRight']) && $f['paddingRight'] !== '') $sArr[] = "padding-right: {$f['paddingRight']}px;";
                                            $sStyle = implode(' ', $sArr);
                                            $labelStyle = "text-align: {$fAlign};" . ($fColor ? " color: {$fColor};" : "");
                                            $inputStyle = "text-align: {$fAlign};" . ($fColor ? " color: {$fColor};" : "");
                                        @endphp
                                        <div style="flex: 1; min-width: 0; @if($sStyle) {{ $sStyle }} @endif">
                                            @if($fType === 'first_name')
                                                <div class="form-group">
                                                    @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel ?: 'First Name' !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                                    <input type="text" id="{{ $fieldId }}" name="first_name" class="form-input" style="{{ $inputStyle }}" value="{{ old('first_name') }}" placeholder="{{ $fPlaceholder ?: strip_tags($fLabel ?: 'First Name') }}" @if($fReq) required @endif>
                                                </div>
                                            @elseif($fType === 'last_name')
                                                <div class="form-group">
                                                    @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel ?: 'Last Name' !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                                    <input type="text" id="{{ $fieldId }}" name="last_name" class="form-input" style="{{ $inputStyle }}" value="{{ old('last_name') }}" placeholder="{{ $fPlaceholder ?: strip_tags($fLabel ?: 'Last Name') }}" @if($fReq) required @endif>
                                                </div>
                                            @elseif($fType === 'email')
                                                <div class="form-group">
                                                    @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel ?: 'Email Address' !!} <span style="color:#ef4444;">*</span></label>@endif
                                                    <input type="email" id="{{ $fieldId }}" name="email" class="form-input" style="{{ $inputStyle }}" value="{{ old('email') }}" placeholder="{{ $fPlaceholder ?: 'your@email.com' }}" required>
                                                </div>
                                            @elseif($fType === 'phone_e164')
                                                <div class="form-group">
                                                    @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel ?: 'WhatsApp Phone' !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                                    <input type="tel" id="{{ $fieldId }}" name="phone_e164" class="form-input" style="{{ $inputStyle }}" value="{{ old('phone_e164') }}" placeholder="{{ $fPlaceholder ?: '+1 234 567 8900' }}" @if($fReq) required @endif>
                                                </div>
                                            @elseif($fType === 'date')
                                                <div class="form-group">
                                                    @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}_btn" style="{{ $labelStyle }}">{!! $fLabel ?: 'Date' !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                                    <div class="custom-datepicker-container" data-date="{{ old("custom_fields.{$fKey}", '') }}">
                                                        <button type="button" id="{{ $fieldId }}_btn" class="custom-datepicker-trigger" style="{{ $inputStyle }}">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                            <span class="date-text placeholder-text">{{ $fPlaceholder ?: 'Select date' }}</span>
                                                        </button>
                                                        <input type="hidden" id="{{ $fieldId }}" name="custom_fields[{{ $fKey }}]" value="{{ old("custom_fields.{$fKey}", '') }}" {{ $fReq ? 'required' : '' }}>
                                                    </div>
                                                </div>
                                            @elseif($fType === 'select')
                                                <div class="form-group">
                                                    @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                                    <div class="custom-select-wrapper">
                                                        <select id="{{ $fieldId }}" name="custom_fields[{{ $fKey }}]" style="{{ $inputStyle }}" {{ $fReq ? 'required' : '' }}>
                                                            <option value="">{{ $fPlaceholder ?: 'Select ' . $fLabel }}</option>
                                                            @foreach(($f['options'] ?? []) as $opt)
                                                                <option value="{{ $opt }}" {{ old("custom_fields.{$fKey}") === $opt ? 'selected' : '' }}>{!! $opt !!}</option>
                                                            @endforeach
                                                        </select>
                                                        <div class="custom-select-arrow">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            @elseif($fType === 'button')
                                                @php
                                                    $btnBg = $f['backgroundColor'] ?? 'var(--theme-color)';
                                                    $btnColor = $f['textColor'] ?? '#ffffff';
                                                    $btnRadius = isset($f['borderRadius']) && $f['borderRadius'] !== '' ? $f['borderRadius'] . 'px' : '12px';
                                                    $btnW = ($f['width'] ?? 'full') === 'auto' ? 'width: auto; padding-left: 28px; padding-right: 28px;' : 'width: 100%;';
                                                    $btnText = $f['buttonText'] ?? ($f['label'] ?? ($form->settings['button_text'] ?? 'Button'));
                                                    $btnFontSize = isset($f['fontSize']) && $f['fontSize'] !== '' ? $f['fontSize'] . 'px' : '14px';
                                                    $btnFontWeight = $f['fontWeight'] ?? '600';
                                                    $btnFlexJustify = $fAlign === 'center' ? 'center' : ($fAlign === 'right' ? 'flex-end' : 'flex-start');
                                                @endphp
                                                <div class="form-group" style="display: flex; justify-content: {{ $btnFlexJustify }}; width: 100%;">
                                                    <button type="submit" 
                                                            id="{{ $fieldId }}"
                                                            class="btn-submit" 
                                                            style="{{ $btnW }} background-color: {{ $btnBg }}; color: {{ $btnColor }}; border-radius: {{ $btnRadius }}; font-size: {{ $btnFontSize }}; font-weight: {{ $btnFontWeight }}; margin-top: 2px;">
                                                        {!! $btnText !!}
                                                    </button>
                                                </div>
                                            @else
                                                <div class="form-group">
                                                    @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                                    <input type="{{ $fType === 'number' ? 'number' : ($fType === 'tel' ? 'tel' : 'text') }}" 
                                                           id="{{ $fieldId }}"
                                                           name="custom_fields[{{ $fKey }}]" 
                                                           class="form-input" 
                                                           style="{{ $inputStyle }}"
                                                           value="{{ old("custom_fields.{$fKey}") }}" 
                                                           placeholder="{{ $fPlaceholder ?: strip_tags($fLabel) }}" 
                                                           {{ $fReq ? 'required' : '' }}>
                                                </div>
                                            @endif
                                        </div>
                                    @endforeach
                                </div>
                            @else
                                @php
                                    $f = $row['field'];
                                    $fType = $f['type'] ?? 'text';
                                    $fKey = (!empty($f['key']) && $f['key'] !== $fType) ? $f['key'] : ($f['id'] ?? ($f['key'] ?? $fType));
                                    $fLabel = $f['label'] ?? '';
                                    $fPlaceholder = $f['placeholder'] ?? '';
                                    $fReq = !empty($f['required']);
                                    $fAlign = $f['align'] ?? 'left';
                                    $fColor = $f['color'] ?? null;
                                    $fContent = $f['content'] ?? ($f['label'] ?? '');
                                    $fShowLabel = ($f['showLabel'] ?? true) !== false;
                                    $fieldId = 'form_field_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $f['id'] ?? ($fKey . '_s' . $idx));
                                    $sArr = [];
                                    if (isset($f['marginTop']) && $f['marginTop'] !== '') $sArr[] = "margin-top: {$f['marginTop']}px;";
                                    if (isset($f['marginBottom']) && $f['marginBottom'] !== '') $sArr[] = "margin-bottom: {$f['marginBottom']}px;";
                                    if (isset($f['marginLeft']) && $f['marginLeft'] !== '') $sArr[] = "margin-left: {$f['marginLeft']}px;";
                                    if (isset($f['marginRight']) && $f['marginRight'] !== '') $sArr[] = "margin-right: {$f['marginRight']}px;";
                                    if (isset($f['paddingTop']) && $f['paddingTop'] !== '') $sArr[] = "padding-top: {$f['paddingTop']}px;";
                                    if (isset($f['paddingBottom']) && $f['paddingBottom'] !== '') $sArr[] = "padding-bottom: {$f['paddingBottom']}px;";
                                    if (isset($f['paddingLeft']) && $f['paddingLeft'] !== '') $sArr[] = "padding-left: {$f['paddingLeft']}px;";
                                    if (isset($f['paddingRight']) && $f['paddingRight'] !== '') $sArr[] = "padding-right: {$f['paddingRight']}px;";
                                    $sStyle = implode(' ', $sArr);
                                    $labelStyle = "text-align: {$fAlign};" . ($fColor ? " color: {$fColor};" : "");
                                    $inputStyle = "text-align: {$fAlign};" . ($fColor ? " color: {$fColor};" : "");
                                    $flexJustify = $fAlign === 'center' ? 'center' : ($fAlign === 'right' ? 'flex-end' : 'flex-start');
                                    $flexAlignItems = $fAlign === 'center' ? 'center' : ($fAlign === 'right' ? 'flex-end' : 'flex-start');
                                @endphp

                                @if($fType === 'heading')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        <h2 style="font-size: 16px; font-weight: 700; text-align: {{ $fAlign }}; @if($fColor) color: {{ $fColor }}; @else color: #1f2937; @endif line-height: 1.4; padding: 2px 0;">
                                            {!! $fContent ?: 'Section Heading' !!}
                                        </h2>
                                    </div>

                                @elseif($fType === 'paragraph')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        <div style="font-size: 14px; line-height: 1.5; color: {{ $fColor ?: '#4b5563' }}; text-align: {{ $fAlign }}; padding: 2px 0;">
                                            {!! $fContent ?: '' !!}
                                        </div>
                                    </div>

                                @elseif($fType === 'image')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        <div style="width: 100%; overflow: hidden; border-radius: 12px; text-align: {{ $fAlign }};">
                                            <img src="{{ $f['imageUrl'] ?? 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80' }}" 
                                                 alt="{{ $f['imageAlt'] ?? 'Form media' }}" 
                                                 style="max-width: 100%; max-height: 220px; object-fit: cover; border-radius: 8px; display: inline-block;">
                                        </div>
                                    </div>

                                @elseif($fType === 'divider')
                                    <div style="@if($sStyle) {{ $sStyle }} @endif">
                                        <hr style="margin: 4px 0; border: none; border-top: 1px solid #e5e7eb;">
                                    </div>

                                @elseif($fType === 'first_name')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel ?: 'First Name' !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <input type="text" id="{{ $fieldId }}" name="first_name" class="form-input" style="{{ $inputStyle }}" value="{{ old('first_name') }}" placeholder="{{ $fPlaceholder ?: strip_tags($fLabel ?: 'First Name') }}" @if($fReq) required @endif>
                                    </div>

                                @elseif($fType === 'last_name')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel ?: 'Last Name' !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <input type="text" id="{{ $fieldId }}" name="last_name" class="form-input" style="{{ $inputStyle }}" value="{{ old('last_name') }}" placeholder="{{ $fPlaceholder ?: strip_tags($fLabel ?: 'Last Name') }}" @if($fReq) required @endif>
                                    </div>

                                @elseif($fType === 'email')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel ?: 'Email Address' !!} <span style="color:#ef4444;">*</span></label>@endif
                                        <input type="email" id="{{ $fieldId }}" name="email" class="form-input" style="{{ $inputStyle }}" value="{{ old('email') }}" placeholder="{{ $fPlaceholder ?: 'your@email.com' }}" required>
                                    </div>

                                @elseif($fType === 'phone_e164')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel ?: 'WhatsApp Phone' !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <input type="tel" id="{{ $fieldId }}" name="phone_e164" class="form-input" style="{{ $inputStyle }}" value="{{ old('phone_e164') }}" placeholder="{{ $fPlaceholder ?: '+1 234 567 8900' }}" @if($fReq) required @endif>
                                    </div>

                                @elseif($fType === 'gdpr')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        <div style="display: flex; justify-content: {{ $flexJustify }};">
                                            <label class="custom-checkbox-item" for="{{ $fieldId }}" style="align-items: flex-start; @if($fColor) color: {{ $fColor }}; @endif">
                                                <input type="checkbox" id="{{ $fieldId }}" name="gdpr_consent" value="1" {{ old('gdpr_consent') ? 'checked' : '' }} required>
                                                <span class="custom-checkbox-box" style="margin-top: 2px;">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </span>
                                                <span style="font-size: 13px; line-height: 1.4; color: {{ $fColor ?: '#4b5563' }};">{!! $f['gdprText'] ?? ($form->gdpr_text ?? 'I agree to receive communications and updates.') !!}</span>
                                            </label>
                                        </div>
                                    </div>

                                @elseif($fType === 'terms')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        <div style="display: flex; justify-content: {{ $flexJustify }};">
                                            <label class="custom-checkbox-item" for="{{ $fieldId }}" style="align-items: flex-start; @if($fColor) color: {{ $fColor }}; @endif">
                                                <input type="checkbox" id="{{ $fieldId }}" name="terms_consent" value="1" {{ old('terms_consent') ? 'checked' : '' }} required>
                                                <span class="custom-checkbox-box" style="margin-top: 2px;">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </span>
                                                <span style="font-size: 12px; line-height: 1.4; color: {{ $fColor ?: '#4b5563' }};">
                                                    {!! $f['termsText'] ?? ($f['label'] ?? ('I accept the <a href="' . ($f['termsUrl'] ?? '#') . '" target="_blank" style="color: var(--theme-color); font-weight: 600; text-decoration: underline;">Terms of Service</a> and <a href="' . ($f['privacyUrl'] ?? '#') . '" target="_blank" style="color: var(--theme-color); font-weight: 600; text-decoration: underline;">Privacy Policy</a>.')) !!}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                @elseif($fType === 'captcha')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #64748b; justify-content: {{ $flexJustify }};">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                            <span>Protected by <strong>Spam Protection</strong> (reCAPTCHA)</span>
                                        </div>
                                    </div>

                                @elseif($fType === 'double_optin')
                                    {{-- Double OTP verified automatically upon submit --}}

                                @elseif($fType === 'textarea')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <textarea id="{{ $fieldId }}" name="custom_fields[{{ $fKey }}]" class="form-textarea" style="{{ $inputStyle }}" rows="3" placeholder="{{ $fPlaceholder }}" {{ $fReq ? 'required' : '' }}>{{ old("custom_fields.{$fKey}") }}</textarea>
                                    </div>

                                @elseif($fType === 'date')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}_btn" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <div class="custom-datepicker-container" data-date="{{ old("custom_fields.{$fKey}", '') }}">
                                            <button type="button" id="{{ $fieldId }}_btn" class="custom-datepicker-trigger" style="{{ $inputStyle }}">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                <span class="date-text placeholder-text">{{ $fPlaceholder ?: 'Select date' }}</span>
                                            </button>
                                            <input type="hidden" id="{{ $fieldId }}" name="custom_fields[{{ $fKey }}]" value="{{ old("custom_fields.{$fKey}", '') }}" {{ $fReq ? 'required' : '' }}>
                                        </div>
                                    </div>

                                @elseif($fType === 'select')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <div class="custom-select-wrapper">
                                            <select id="{{ $fieldId }}" name="custom_fields[{{ $fKey }}]" style="{{ $inputStyle }}" {{ $fReq ? 'required' : '' }}>
                                                <option value="">{{ $fPlaceholder ?: 'Select ' . $fLabel }}</option>
                                                @foreach(($f['options'] ?? []) as $opt)
                                                    <option value="{{ $opt }}" {{ old("custom_fields.{$fKey}") === $opt ? 'selected' : '' }}>{{ $opt }}</option>
                                                @endforeach
                                            </select>
                                            <div class="custom-select-arrow">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </div>
                                        </div>
                                    </div>

                                @elseif($fType === 'radio')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px; align-items: {{ $flexAlignItems }};">
                                            @foreach(($f['options'] ?? ['Option 1', 'Option 2']) as $optIdx => $opt)
                                                @php $optId = $fieldId . '_opt_' . $optIdx; @endphp
                                                <label class="custom-radio-item" for="{{ $optId }}" style="@if($fColor) color: {{ $fColor }}; @endif">
                                                    <input type="radio" id="{{ $optId }}" name="custom_fields[{{ $fKey }}]" value="{{ $opt }}" {{ old("custom_fields.{$fKey}") === $opt ? 'checked' : '' }} {{ $fReq ? 'required' : '' }}>
                                                    <span class="custom-radio-circle"><span class="custom-radio-dot"></span></span>
                                                    <span>{!! $opt !!}</span>
                                                </label>
                                            @endforeach
                                        </div>
                                    </div>

                                @elseif($fType === 'checkbox')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        <div style="display: flex; justify-content: {{ $flexJustify }};">
                                            <label class="custom-checkbox-item" for="{{ $fieldId }}" style="@if($fColor) color: {{ $fColor }}; @endif">
                                                <input type="checkbox" id="{{ $fieldId }}" name="custom_fields[{{ $fKey }}]" value="1" {{ old("custom_fields.{$fKey}") ? 'checked' : '' }} {{ $fReq ? 'required' : '' }}>
                                                <span class="custom-checkbox-box">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </span>
                                                <span>{!! $fLabel !!}</span>
                                            </label>
                                        </div>
                                    </div>

                                @elseif($fType === 'multi_checkbox')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px; align-items: {{ $flexAlignItems }};">
                                            @foreach(($f['options'] ?? ['Option A', 'Option B', 'Option C']) as $optIdx => $opt)
                                                @php $optId = $fieldId . '_chk_' . $optIdx; @endphp
                                                <label class="custom-checkbox-item" for="{{ $optId }}" style="@if($fColor) color: {{ $fColor }}; @endif">
                                                    <input type="checkbox" id="{{ $optId }}" name="custom_fields[{{ $fKey }}][]" value="{{ $opt }}" {{ is_array(old("custom_fields.{$fKey}")) && in_array($opt, old("custom_fields.{$fKey}")) ? 'checked' : '' }}>
                                                    <span class="custom-checkbox-box">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                    </span>
                                                    <span>{!! $opt !!}</span>
                                                </label>
                                            @endforeach
                                        </div>
                                    </div>

                                @elseif($fType === 'scale')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}_btn_1" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <div class="custom-scale-group" data-key="{{ $fKey }}" style="display: flex; flex-direction: column; gap: 6px;">
                                            <input type="hidden" id="{{ $fieldId }}" name="custom_fields[{{ $fKey }}]" value="{{ old("custom_fields.{$fKey}", '') }}" {{ $fReq ? 'required' : '' }}>
                                            <div style="display: flex; gap: 4px; align-items: center; justify-content: {{ $flexJustify }}; flex-wrap: wrap;">
                                                @for($i = ($f['minScale'] ?? 1); $i <= ($f['maxScale'] ?? 10); $i++)
                                                    <button type="button" id="{{ $fieldId }}_btn_{{ $i }}" class="scale-btn {{ old("custom_fields.{$fKey}") == $i ? 'active' : '' }}" data-value="{{ $i }}" style="width: 32px; height: 32px; border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid #d1d5db; background: #ffffff; cursor: pointer; transition: all 0.15s;">
                                                        {{ $i }}
                                                    </button>
                                                @endfor
                                            </div>
                                            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; padding: 0 2px;">
                                                <span>{!! $f['minLabel'] ?? 'Not likely' !!}</span>
                                                <span>{!! $f['maxLabel'] ?? 'Very likely' !!}</span>
                                            </div>
                                        </div>
                                    </div>

                                @elseif($fType === 'signature')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}_canvas" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <div class="custom-signature-pad" style="position: relative; width: 100%; height: 110px; border: 2px dashed #cbd5e1; border-radius: 12px; background: #ffffff; overflow: hidden;">
                                            <canvas id="{{ $fieldId }}_canvas" style="width: 100%; height: 100%; cursor: crosshair; touch-action: none; display: block;"></canvas>
                                            <input type="hidden" id="{{ $fieldId }}" name="custom_fields[{{ $fKey }}]" value="{{ old("custom_fields.{$fKey}", '') }}" {{ $fReq ? 'required' : '' }}>
                                            <button type="button" class="signature-clear-btn" style="position: absolute; bottom: 6px; right: 8px; font-size: 11px; color: #9ca3af; background: rgba(255,255,255,0.85); border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px 6px; cursor: pointer;">Clear</button>
                                        </div>
                                    </div>

                                @elseif($fType === 'file')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <div class="custom-dropzone">
                                            <input type="file" id="{{ $fieldId }}" name="custom_fields[{{ $fKey }}]" onchange="handleFileChange(this)" {{ $fReq ? 'required' : '' }}>
                                            <div class="dropzone-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                            </div>
                                            <div class="dropzone-title">Drag & drop or <span style="color:var(--theme-color);font-weight:600;text-decoration:underline;">browse</span></div>
                                            <div class="dropzone-sub">Images, PDF, Documents · max 50 MB</div>
                                            <div class="dropzone-filename"></div>
                                        </div>
                                    </div>

                                @elseif($fType === 'rating')
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}_star_1" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <div style="display: flex; justify-content: {{ $flexJustify }};">
                                            <div class="star-rating-group" data-key="{{ $fKey }}">
                                                <input type="hidden" id="{{ $fieldId }}" name="custom_fields[{{ $fKey }}]" value="{{ old("custom_fields.{$fKey}", '') }}" {{ $fReq ? 'required' : '' }}>
                                                @for($i = 1; $i <= ($f['maxRating'] ?? 5); $i++)
                                                    <button type="button" id="{{ $fieldId }}_star_{{ $i }}" class="star-btn {{ old("custom_fields.{$fKey}") >= $i ? 'active' : '' }}" data-value="{{ $i }}">
                                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                    </button>
                                                @endfor
                                            </div>
                                        </div>
                                    </div>

                                @elseif($fType === 'order_2step')
                                     @php
                                         $step1Title = $f['step1Title'] ?? '1. Contact Info';
                                         $step2Title = $f['step2Title'] ?? '2. Products & Pay';
                                         $step1BtnText = $f['step1ButtonText'] ?? 'Go to Step 2 →';
                                         $step2BtnText = $f['step2ButtonText'] ?? 'Complete Order 🔒';
                                         $bumpEnabled = $f['orderBumpEnabled'] ?? true;
                                         $bumpTitle = $f['orderBumpTitle'] ?? ($form->order_bump_settings['title'] ?? 'Yes! Add the VIP Bonus Pack');
                                         $bumpBadge = $f['orderBumpBadge'] ?? ($form->order_bump_settings['badge_text'] ?? 'ONE-TIME OFFER - 80% OFF');
                                         $bumpPrice = (float) ($f['orderBumpPrice'] ?? ($form->order_bump_settings['price'] ?? 19.00));
                                         $bumpDesc = $f['orderBumpDescription'] ?? ($form->order_bump_settings['description'] ?? 'Get lifetime access to bonus resources.');
                                         $currency = $f['currency'] ?? ($form->currency ?? 'USD');
                                         $currencySymbol = $currency === 'EUR' ? '€' : ($currency === 'GBP' ? '£' : ($currency === 'INR' ? '₹' : '$'));
                                     @endphp

                                     <div class="order-2step-container" style="width: 100%; @if($sStyle) {{ $sStyle }} @endif">
                                         {{-- Navigation Step Tabs --}}
                                         <div class="order-step-nav">
                                             <button type="button" class="order-step-btn active" id="btn-step-1" onclick="switchOrderStep(1)">
                                                 <span class="order-step-num">1</span>
                                                 <span>{!! $step1Title !!}</span>
                                             </button>
                                             <button type="button" class="order-step-btn" id="btn-step-2" onclick="switchOrderStep(2)">
                                                 <span class="order-step-num">2</span>
                                                 <span>{!! $step2Title !!}</span>
                                             </button>
                                         </div>

                                         {{-- Step 2 Products & Order Bump Content (Shown in Step 2) --}}
                                         <div id="order-step-2-content" class="order-step-2-content">
                                             {{-- Products List --}}
                                             <div class="order-products-list order-products-list-wrap">
                                                 <label class="form-label order-products-list-label">Select Product Option</label>
                                                 @php
                                                     $attachedProducts = $form->formProducts ?? collect();
                                                     $fieldPrices = $f['prices'] ?? [];
                                                     $fieldImg = $f['imageUrl'] ?? '';
                                                     $fieldProdTitle = $f['productTitle'] ?? '';
                                                     $fieldProdSub = $f['productSubtitle'] ?? 'Instant digital access & templates';
                                                     $fieldProdPrice = (float)($f['productPrice'] ?? 49.00);
                                                     $fieldProdId = $f['productId'] ?? '1';
                                                 @endphp

                                                 @if(!empty($fieldPrices) && is_array($fieldPrices))
                                                      @foreach($fieldPrices as $pIdx => $pTier)
                                                          @php
                                                              $tierName = $pTier['name'] ?? ('Tier ' . ($pIdx + 1));
                                                              $tierPrice = (float)($pTier['price'] ?? 0);
                                                              $tierPricingType = $pTier['pricing_type'] ?? 'one_time';
                                                              $billingInterval = $pTier['billing_interval'] ?? 'month';
                                                              $installmentCount = $pTier['installment_count'] ?? 3;
                                                              $defaultTierDesc = $tierPricingType === 'recurring' ? ('Billed every ' . ($billingInterval === 'year' ? 'year' : 'month')) : ($tierPricingType === 'installments' ? ($installmentCount . ' installments') : 'One-time payment');
                                                              $tierDesc = !empty($pTier['description']) ? $pTier['description'] : $defaultTierDesc;
                                                              $tierSuffix = $tierPricingType === 'recurring' ? ('/' . ($billingInterval === 'year' ? 'yr' : 'mo')) : '';
                                                              $priceId = $pTier['id'] ?? ($pTier['product_price_id'] ?? '');
                                                              $productId = $fieldProdId;
                                                              $isSelected = $pIdx === 0;
                                                              $step2RadioId = 'step2_prod_' . $pIdx;
                                                          @endphp
                                                          <label class="product-select-card {{ $isSelected ? 'selected' : '' }}" for="{{ $step2RadioId }}" onclick="selectProductOption(this, '{{ $productId }}', '{{ $priceId }}', {{ (float)$tierPrice }}, '{{ addslashes($tierName) }}')">
                                                              <input type="radio" id="{{ $step2RadioId }}" name="step2_prod_tier" value="{{ $priceId }}" {{ $isSelected ? 'checked' : '' }} style="position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;">
                                                              <div class="product-select-content">
                                                                  <div class="product-select-radio">
                                                                      <div class="product-select-dot"></div>
                                                                  </div>
                                                                  @if($fieldImg)
                                                                      <img src="{{ $fieldImg }}" alt="" class="product-thumb-img" />
                                                                  @endif
                                                                  <div>
                                                                      <div class="product-plan-title">{{ $tierName }}</div>
                                                                      <div class="product-plan-desc">{{ $tierDesc }}</div>
                                                                  </div>
                                                              </div>
                                                              <div class="product-plan-price">
                                                                  {{ $currencySymbol }}{{ number_format($tierPrice, 2) }}{{ $tierSuffix }}
                                                              </div>
                                                          </label>
                                                      @endforeach
                                                      <input type="hidden" name="selected_product_id" id="input_selected_product_id" value="{{ $fieldProdId }}">
                                                      <input type="hidden" name="selected_price_id" id="input_selected_price_id" value="{{ $fieldPrices[0]['id'] ?? '' }}">
                                                      <input type="hidden" name="selected_product_price" id="input_selected_product_price" value="{{ (float)($fieldPrices[0]['price'] ?? 0) }}">
                                                  @elseif($attachedProducts->isNotEmpty())
                                                      @foreach($attachedProducts as $pIdx => $fp)
                                                          @php
                                                              $pItem = $fp->product;
                                                              $pPrice = $fp->price ? $fp->price->price : ($pItem->price ?? 0);
                                                              $pPriceName = $fp->price ? $fp->price->name : ($pItem->name ?? 'Standard Access');
                                                              $isSelected = $pIdx === 0;
                                                              $step2RadioId = 'step2_fp_' . $pIdx;
                                                          @endphp
                                                          <label class="product-select-card {{ $isSelected ? 'selected' : '' }}" for="{{ $step2RadioId }}" onclick="selectProductOption(this, '{{ $pItem->id }}', '{{ $fp->product_price_id }}', {{ (float)$pPrice }}, '{{ addslashes($pItem->name) }}')">
                                                              <input type="radio" id="{{ $step2RadioId }}" name="step2_prod_tier" value="{{ $fp->product_price_id }}" {{ $isSelected ? 'checked' : '' }} style="position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;">
                                                              <div class="product-select-content">
                                                                  <div class="product-select-radio">
                                                                      <div class="product-select-dot"></div>
                                                                  </div>
                                                                  @if(!empty($pItem->image_url))
                                                                      <img src="{{ $pItem->image_url }}" alt="" class="product-thumb-img" />
                                                                  @endif
                                                                  <div>
                                                                      <div class="product-plan-title">{{ $pItem->name }} @if($fp->price) ({{ $fp->price->name }}) @endif</div>
                                                                      <div class="product-plan-desc">{{ $pItem->description ?: 'Instant digital access' }}</div>
                                                                  </div>
                                                              </div>
                                                              <div class="product-plan-price">
                                                                  {{ $currencySymbol }}{{ number_format($pPrice, 2) }}
                                                              </div>
                                                          </label>
                                                      @endforeach
                                                      <input type="hidden" name="selected_product_id" id="input_selected_product_id" value="{{ $attachedProducts->first()?->product_id ?? '1' }}">
                                                      <input type="hidden" name="selected_price_id" id="input_selected_price_id" value="{{ $attachedProducts->first()?->product_price_id ?? '' }}">
                                                      <input type="hidden" name="selected_product_price" id="input_selected_product_price" value="{{ $attachedProducts->first()?->price?->price ?? ($attachedProducts->first()?->product?->price ?? 49.00) }}">
                                                  @else
                                                      {{-- Demo / Default Product Selection --}}
                                                      <label class="product-select-card selected" for="step2_prod_demo" onclick="selectProductOption(this, '{{ $fieldProdId }}', null, {{ $fieldProdPrice }}, '{{ addslashes($fieldProdTitle ?: 'Standard Access Plan') }}')">
                                                          <input type="radio" id="step2_prod_demo" name="step2_prod_tier" value="{{ $fieldProdId }}" checked style="position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;">
                                                          <div class="product-select-content">
                                                              <div class="product-select-radio">
                                                                  <div class="product-select-dot"></div>
                                                              </div>
                                                              @if($fieldImg)
                                                                  <img src="{{ $fieldImg }}" alt="" class="product-thumb-img" />
                                                              @endif
                                                              <div>
                                                                  <div class="product-plan-title">{{ $fieldProdTitle ?: 'Standard Access Plan' }}</div>
                                                                  <div class="product-plan-desc">{{ $fieldProdSub }}</div>
                                                              </div>
                                                          </div>
                                                          <div class="product-plan-price">
                                                              {{ $currencySymbol }}{{ number_format($fieldProdPrice, 2) }}
                                                          </div>
                                                      </label>
                                                      <input type="hidden" name="selected_product_id" id="input_selected_product_id" value="{{ $fieldProdId }}">
                                                      <input type="hidden" name="selected_price_id" id="input_selected_price_id" value="">
                                                      <input type="hidden" name="selected_product_price" id="input_selected_product_price" value="{{ $fieldProdPrice }}">
                                                  @endif
                                             </div>

                                             {{-- Order Bump (1-Click Upsell) --}}
                                             @if($bumpEnabled)
                                                 <label class="order-bump-card" for="step2_order_bump_checkbox" onclick="toggleOrderBump()">
                                                     <div class="order-bump-header">
                                                         <span class="order-bump-badge">
                                                             <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                                             {{ $bumpBadge }}
                                                         </span>
                                                         <span class="order-bump-price">+{{ $currencySymbol }}{{ number_format($bumpPrice, 2) }}</span>
                                                     </div>
                                                     <div class="order-bump-body">
                                                         <input type="checkbox" name="order_bump_checked" id="step2_order_bump_checkbox" value="1" class="order-bump-checkbox">
                                                         <div class="order-bump-text">
                                                             <div class="order-bump-title">{!! $bumpTitle !!}</div>
                                                             <div class="order-bump-desc">{!! $bumpDesc !!}</div>
                                                         </div>
                                                     </div>
                                                 </label>
                                             @endif

                                             {{-- Coupon Code Input --}}
                                             <div class="coupon-box">
                                                 <label for="order_coupon_code" style="position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0;">Promo Code</label>
                                                 <input type="text" name="coupon_code" id="order_coupon_code" placeholder="Promo / Coupon Code" class="coupon-input" aria-label="Promo or Coupon Code">
                                                 <button type="button" onclick="applyCouponCode()" class="coupon-btn">Apply</button>
                                             </div>
                                             <div id="coupon_feedback" class="coupon-feedback"></div>

                                             {{-- Payment Method Section --}}
                                             <div class="payment-method-container" id="payment-method-section-2step">
                                                 <div class="payment-method-header">
                                                     <label class="form-label" style="font-weight: 700; margin-bottom: 0; display: flex; align-items: center; justify-content: space-between; width: 100%;">
                                                         <span style="display: flex; align-items: center; gap: 6px;">
                                                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                                             Payment Method
                                                         </span>
                                                         <span class="secure-badge">
                                                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                             256-Bit SSL Encrypted
                                                         </span>
                                                     </label>
                                                 </div>

                                                 <div class="payment-card-box">
                                                     <div class="payment-card-icons">
                                                         <span class="card-brand-tag">Credit / Debit Card</span>
                                                         <div class="card-brand-logos">
                                                             <span class="brand-badge brand-visa">VISA</span>
                                                             <span class="brand-badge brand-mc">MC</span>
                                                             <span class="brand-badge brand-amex">AMEX</span>
                                                         </div>
                                                     </div>

                                                     <div class="form-group" style="margin-bottom: 10px;">
                                                         <label class="form-label" for="step2_cardholder" style="font-size: 11px; margin-bottom: 3px;">Cardholder Name</label>
                                                         <input type="text" id="step2_cardholder" name="payment_cardholder" class="form-input payment-input" placeholder="Name on Card" value="{{ old('payment_cardholder') }}">
                                                     </div>

                                                     <div class="form-group" style="margin-bottom: 10px;">
                                                         <label class="form-label" for="step2_card_num" style="font-size: 11px; margin-bottom: 3px;">Card Number</label>
                                                         <div class="card-number-wrapper">
                                                             <input type="text" id="step2_card_num" name="payment_card_number" class="form-input payment-input card-num-input" placeholder="4000 1234 5678 9010" maxlength="19" oninput="formatCardInput(this)">
                                                             <div class="card-type-icon" id="step2_card_type_icon">
                                                                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                                             </div>
                                                         </div>
                                                     </div>

                                                     <div class="form-row" style="margin-bottom: 0; gap: 8px;">
                                                         <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                                             <label class="form-label" for="step2_exp" style="font-size: 11px; margin-bottom: 3px;">Expires (MM/YY)</label>
                                                             <input type="text" id="step2_exp" name="payment_exp" class="form-input payment-input" placeholder="MM / YY" maxlength="7" oninput="formatExpiryInput(this)">
                                                         </div>
                                                         <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                                             <label class="form-label" for="step2_cvc" style="font-size: 11px; margin-bottom: 3px;">Security Code</label>
                                                             <div class="cvc-wrapper">
                                                                 <input type="password" id="step2_cvc" name="payment_cvc" class="form-input payment-input" placeholder="CVC" maxlength="4" oninput="formatCvcInput(this)">
                                                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" class="cvc-lock-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>

                                             {{-- Live Order Summary Breakdown --}}
                                             <div class="order-summary-box">
                                                 <div class="order-summary-row">
                                                      <span id="summary-prod-title">Product Item</span>
                                                      <span id="summary-prod-price">{{ $currencySymbol }}49.00</span>
                                                 </div>
                                                 <div class="order-summary-row summary-row-bump" id="summary-bump-row">
                                                      <span>1-Click Order Bump</span>
                                                      <span id="summary-bump-price">+{{ $currencySymbol }}{{ number_format($bumpPrice, 2) }}</span>
                                                 </div>
                                                 <div class="order-summary-row summary-row-discount" id="summary-discount-row">
                                                      <span>Discount Promo</span>
                                                      <span id="summary-discount-price">-{{ $currencySymbol }}0.00</span>
                                                 </div>
                                                 <div class="order-summary-row total">
                                                      <span>Total Due:</span>
                                                      <span id="summary-total-price" class="summary-total-price">{{ $currencySymbol }}49.00</span>
                                                 </div>
                                             </div>

                                             {{-- Step 2 Submit Button --}}
                                             <button type="submit" class="btn-submit order-submit-btn">
                                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                 {!! $step2BtnText !!}
                                             </button>
                                         </div>

                                         {{-- Step 1 Next Button --}}
                                         <div id="order-step-1-btn-wrap" class="order-step-btn-wrap">
                                             <button type="button" class="btn-submit order-step1-next-btn" onclick="goToOrderStep2()">
                                                 {!! $step1BtnText !!}
                                             </button>
                                         </div>
                                     </div>

                                @elseif($fType === 'product_select')
                                     @php
                                         $currency = $f['currency'] ?? ($form->currency ?? 'USD');
                                         $currencySymbol = $currency === 'EUR' ? '€' : ($currency === 'GBP' ? '£' : ($currency === 'INR' ? '₹' : '$'));
                                         $attachedProducts = $form->formProducts ?? collect();
                                         $fieldPrices = $f['prices'] ?? [];
                                         $fieldImg = $f['imageUrl'] ?? '';
                                         $fieldProdTitle = $f['productTitle'] ?? '';
                                         $fieldProdSub = $f['productSubtitle'] ?? 'Instant digital access';
                                         $fieldProdPrice = (float)($f['productPrice'] ?? 49.00);
                                         $fieldProdId = $f['productId'] ?? '1';
                                         $fieldTier2Title = $f['tier2Title'] ?? '';
                                         $fieldTier2Sub = $f['tier2Subtitle'] ?? 'Upgrade package';
                                         $fieldTier2Price = (float)($f['tier2Price'] ?? 0);
                                     @endphp
                                     <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                         @if($fShowLabel)<label class="form-label" style="{{ $labelStyle }}">{!! $fLabel ?: 'Select Product Option' !!}</label>@endif
                                         <div class="order-products-list">
                                             @if(!empty($fieldPrices) && is_array($fieldPrices))
                                                 @foreach($fieldPrices as $pIdx => $pTier)
                                                     @php
                                                         $tierName = $pTier['name'] ?? ('Tier ' . ($pIdx + 1));
                                                         $tierPrice = (float)($pTier['price'] ?? 0);
                                                         $tierPricingType = $pTier['pricing_type'] ?? 'one_time';
                                                         $billingInterval = $pTier['billing_interval'] ?? 'month';
                                                         $installmentCount = $pTier['installment_count'] ?? 3;
                                                         $defaultTierDesc = $tierPricingType === 'recurring' ? ('Billed every ' . ($billingInterval === 'year' ? 'year' : 'month')) : ($tierPricingType === 'installments' ? ($installmentCount . ' installments') : 'One-time payment');
                                                         $tierDesc = !empty($pTier['description']) ? $pTier['description'] : $defaultTierDesc;
                                                         $tierSuffix = $tierPricingType === 'recurring' ? ('/' . ($billingInterval === 'year' ? 'yr' : 'mo')) : '';
                                                         $priceId = $pTier['id'] ?? ($pTier['product_price_id'] ?? '');
                                                         $productId = $fieldProdId;
                                                         $isSelected = $pIdx === 0;
                                                         $psRadioId = 'ps_prod_' . $pIdx;
                                                     @endphp
                                                     <label class="product-select-card {{ $isSelected ? 'selected' : '' }}" for="{{ $psRadioId }}" onclick="selectProductOption(this, '{{ $productId }}', '{{ $priceId }}', {{ (float)$tierPrice }}, '{{ addslashes($tierName) }}')">
                                                         <input type="radio" id="{{ $psRadioId }}" name="ps_prod_tier" value="{{ $priceId }}" {{ $isSelected ? 'checked' : '' }} style="position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;">
                                                         <div class="product-select-content">
                                                             <div class="product-select-radio"><div class="product-select-dot"></div></div>
                                                             @if($fieldImg)
                                                                 <img src="{{ $fieldImg }}" alt="" class="product-thumb-img" />
                                                             @endif
                                                             <div>
                                                                 <div class="product-plan-title">{{ $tierName }}</div>
                                                                 <div class="product-plan-desc">{{ $tierDesc }}</div>
                                                             </div>
                                                         </div>
                                                         <div class="product-plan-price">{{ $currencySymbol }}{{ number_format($tierPrice, 2) }}{{ $tierSuffix }}</div>
                                                     </label>
                                                 @endforeach
                                                 <input type="hidden" name="selected_product_id" id="input_selected_product_id" value="{{ $fieldProdId }}">
                                                 <input type="hidden" name="selected_price_id" id="input_selected_price_id" value="{{ $fieldPrices[0]['id'] ?? '' }}">
                                                 <input type="hidden" name="selected_product_price" id="input_selected_product_price" value="{{ (float)($fieldPrices[0]['price'] ?? 0) }}">
                                             @elseif($attachedProducts->isNotEmpty())
                                                 @foreach($attachedProducts as $pIdx => $fp)
                                                     @php
                                                         $pItem = $fp->product;
                                                         $pPrice = $fp->price ? $fp->price->price : ($pItem->price ?? 0);
                                                         $isSelected = $pIdx === 0;
                                                         $psRadioId = 'ps_fp_' . $pIdx;
                                                     @endphp
                                                     <label class="product-select-card {{ $isSelected ? 'selected' : '' }}" for="{{ $psRadioId }}" onclick="selectProductOption(this, '{{ $pItem->id }}', '{{ $fp->product_price_id }}', {{ (float)$pPrice }}, '{{ addslashes($pItem->name) }}')">
                                                         <input type="radio" id="{{ $psRadioId }}" name="ps_prod_tier" value="{{ $fp->product_price_id }}" {{ $isSelected ? 'checked' : '' }} style="position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;">
                                                         <div class="product-select-content">
                                                             <div class="product-select-radio"><div class="product-select-dot"></div></div>
                                                             @if(!empty($pItem->image_url))
                                                                 <img src="{{ $pItem->image_url }}" alt="" class="product-thumb-img" />
                                                             @endif
                                                             <div>
                                                                 <div class="product-plan-title">{{ $pItem->name }} @if($fp->price) ({{ $fp->price->name }}) @endif</div>
                                                                 <div class="product-plan-desc">{{ $pItem->description ?: 'Instant access' }}</div>
                                                             </div>
                                                         </div>
                                                         <div class="product-plan-price">{{ $currencySymbol }}{{ number_format($pPrice, 2) }}</div>
                                                     </label>
                                                 @endforeach
                                                 <input type="hidden" name="selected_product_id" id="input_selected_product_id" value="{{ $attachedProducts->first()?->product_id ?? '1' }}">
                                                 <input type="hidden" name="selected_price_id" id="input_selected_price_id" value="{{ $attachedProducts->first()?->product_price_id ?? '' }}">
                                                 <input type="hidden" name="selected_product_price" id="input_selected_product_price" value="{{ $attachedProducts->first()?->price?->price ?? ($attachedProducts->first()?->product?->price ?? 49.00) }}">
                                             @else
                                                 <label class="product-select-card selected" for="ps_prod_demo" onclick="selectProductOption(this, '{{ $fieldProdId }}', null, {{ $fieldProdPrice }}, '{{ addslashes($fieldProdTitle ?: 'Standard Product Plan') }}')">
                                                     <input type="radio" id="ps_prod_demo" name="ps_prod_tier" value="{{ $fieldProdId }}" checked style="position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;">
                                                     <div class="product-select-content">
                                                         <div class="product-select-radio"><div class="product-select-dot"></div></div>
                                                         @if($fieldImg)
                                                             <img src="{{ $fieldImg }}" alt="" class="product-thumb-img" />
                                                         @endif
                                                         <div>
                                                             <div class="product-plan-title">{{ $fieldProdTitle ?: 'Standard Product Plan' }}</div>
                                                             <div class="product-plan-desc">{{ $fieldProdSub }}</div>
                                                         </div>
                                                     </div>
                                                     <div class="product-plan-price">{{ $currencySymbol }}{{ number_format($fieldProdPrice, 2) }}</div>
                                                 </label>
                                                 @if($fieldTier2Title)
                                                     <label class="product-select-card" for="ps_prod_tier2" onclick="selectProductOption(this, '{{ $fieldProdId }}', null, {{ $fieldTier2Price }}, '{{ addslashes($fieldTier2Title) }}')">
                                                         <input type="radio" id="ps_prod_tier2" name="ps_prod_tier" value="tier2" style="position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;">
                                                         <div class="product-select-content">
                                                             <div class="product-select-radio"><div class="product-select-dot"></div></div>
                                                             <div>
                                                                 <div class="product-plan-title">{{ $fieldTier2Title }}</div>
                                                                 <div class="product-plan-desc">{{ $fieldTier2Sub }}</div>
                                                             </div>
                                                         </div>
                                                         <div class="product-plan-price">{{ $currencySymbol }}{{ number_format($fieldTier2Price, 2) }}</div>
                                                     </label>
                                                 @endif
                                                 <input type="hidden" name="selected_product_id" id="input_selected_product_id" value="{{ $fieldProdId }}">
                                                 <input type="hidden" name="selected_price_id" id="input_selected_price_id" value="">
                                                 <input type="hidden" name="selected_product_price" id="input_selected_product_price" value="{{ $fieldProdPrice }}">
                                             @endif
                                         </div>

                                         {{-- Dynamic Payment Method Section for 1-Step Product Selection --}}
                                         <div class="payment-method-container" id="payment-method-section-ps" style="{{ $fieldProdPrice > 0 ? 'display: block;' : 'display: none;' }}">
                                             <div class="payment-method-header">
                                                 <label class="form-label" style="font-weight: 700; margin-bottom: 0; display: flex; align-items: center; justify-content: space-between; width: 100%;">
                                                     <span style="display: flex; align-items: center; gap: 6px;">
                                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                                         Payment Method
                                                     </span>
                                                     <span class="secure-badge">
                                                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                         256-Bit SSL Encrypted
                                                     </span>
                                                 </label>
                                             </div>

                                             <div class="payment-card-box">
                                                 <div class="payment-card-icons">
                                                     <span class="card-brand-tag">Credit / Debit Card</span>
                                                     <div class="card-brand-logos">
                                                         <span class="brand-badge brand-visa">VISA</span>
                                                         <span class="brand-badge brand-mc">MC</span>
                                                         <span class="brand-badge brand-amex">AMEX</span>
                                                     </div>
                                                 </div>

                                                 <div class="form-group" style="margin-bottom: 10px;">
                                                     <label class="form-label" for="ps_cardholder" style="font-size: 11px; margin-bottom: 3px;">Cardholder Name</label>
                                                     <input type="text" id="ps_cardholder" name="payment_cardholder" class="form-input payment-input" placeholder="Name on Card" value="{{ old('payment_cardholder') }}">
                                                 </div>

                                                 <div class="form-group" style="margin-bottom: 10px;">
                                                     <label class="form-label" for="ps_card_num" style="font-size: 11px; margin-bottom: 3px;">Card Number</label>
                                                     <div class="card-number-wrapper">
                                                         <input type="text" id="ps_card_num" name="payment_card_number" class="form-input payment-input card-num-input" placeholder="4000 1234 5678 9010" maxlength="19" oninput="formatCardInput(this)">
                                                         <div class="card-type-icon" id="ps_card_type_icon">
                                                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                                         </div>
                                                     </div>
                                                 </div>

                                                 <div class="form-row" style="margin-bottom: 0; gap: 8px;">
                                                     <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                                         <label class="form-label" for="ps_exp" style="font-size: 11px; margin-bottom: 3px;">Expires (MM/YY)</label>
                                                         <input type="text" id="ps_exp" name="payment_exp" class="form-input payment-input" placeholder="MM / YY" maxlength="7" oninput="formatExpiryInput(this)">
                                                     </div>
                                                     <div class="form-group" style="flex: 1; margin-bottom: 0;">
                                                         <label class="form-label" for="ps_cvc" style="font-size: 11px; margin-bottom: 3px;">Security Code</label>
                                                         <div class="cvc-wrapper">
                                                             <input type="password" id="ps_cvc" name="payment_cvc" class="form-input payment-input" placeholder="CVC" maxlength="4" oninput="formatCvcInput(this)">
                                                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" class="cvc-lock-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>

                                @elseif($fType === 'order_bump')
                                     @php
                                         $bumpHeadline = $f['headline'] ?? 'Yes! Add This Exclusive Bonus';
                                         $bumpBadge = $f['badgeText'] ?? 'SPECIAL ONE-TIME OFFER';
                                         $bumpPrice = (float) ($f['price'] ?? 19.00);
                                         $bumpDesc = $f['description'] ?? 'Get instant access at an exclusive one-time discount.';
                                         $currency = $f['currency'] ?? ($form->currency ?? 'USD');
                                         $currencySymbol = $currency === 'EUR' ? '€' : ($currency === 'GBP' ? '£' : ($currency === 'INR' ? '₹' : '$'));
                                     @endphp
                                     <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                         <label class="order-bump-card" for="order_bump_checkbox" onclick="toggleOrderBump()">
                                             <div class="order-bump-header">
                                                 <span class="order-bump-badge">
                                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                                     {{ $bumpBadge }}
                                                 </span>
                                                 <span class="order-bump-price">+{{ $currencySymbol }}{{ number_format($bumpPrice, 2) }}</span>
                                             </div>
                                             <div class="order-bump-body">
                                                 <input type="checkbox" name="order_bump_checked" id="order_bump_checkbox" value="1" class="order-bump-checkbox">
                                                 <div class="order-bump-text">
                                                     <div class="order-bump-title">{!! $bumpHeadline !!}</div>
                                                     <div class="order-bump-desc">{!! $bumpDesc !!}</div>
                                                 </div>
                                             </div>
                                         </label>
                                     </div>

                                @elseif($fType === 'coupon_code')
                                     <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                         @if($fShowLabel)<label class="form-label" for="order_coupon_code" style="{{ $labelStyle }}">{!! $fLabel ?: 'Promo / Coupon Code' !!}</label>@endif
                                         <div class="coupon-box">
                                             <input type="text" name="coupon_code" id="order_coupon_code" placeholder="{{ $fPlaceholder ?: 'Enter coupon code' }}" class="coupon-input">
                                             <button type="button" onclick="applyCouponCode()" class="coupon-btn">{{ $f['buttonText'] ?? 'Apply' }}</button>
                                         </div>
                                     </div>

                                @elseif($fType === 'button')
                                    @php
                                        $btnBg = $f['backgroundColor'] ?? 'var(--theme-color)';
                                        $btnColor = $f['textColor'] ?? '#ffffff';
                                        $btnRadius = isset($f['borderRadius']) && $f['borderRadius'] !== '' ? $f['borderRadius'] . 'px' : '12px';
                                        $btnW = ($f['width'] ?? 'full') === 'auto' ? 'width: auto; padding-left: 32px; padding-right: 32px;' : 'width: 100%;';
                                        $btnText = $f['buttonText'] ?? ($f['label'] ?? ($form->settings['button_text'] ?? 'Button'));
                                        $btnFontSize = isset($f['fontSize']) && $f['fontSize'] !== '' ? $f['fontSize'] . 'px' : '14px';
                                        $btnFontWeight = $f['fontWeight'] ?? '600';
                                    @endphp
                                    <div class="form-group" style="display: flex; justify-content: {{ $flexJustify }}; width: 100%; @if($sStyle) {{ $sStyle }} @endif">
                                        <button type="submit" 
                                                class="btn-submit" 
                                                style="{{ $btnW }} background-color: {{ $btnBg }}; color: {{ $btnColor }}; border-radius: {{ $btnRadius }}; font-size: {{ $btnFontSize }}; font-weight: {{ $btnFontWeight }}; margin-top: 4px;">
                                            {!! $btnText !!}
                                        </button>
                                                                 @else
                                    <div class="form-group" style="@if($sStyle) {{ $sStyle }} @endif">
                                        @if($fShowLabel)<label class="form-label" for="{{ $fieldId }}" style="{{ $labelStyle }}">{!! $fLabel !!} @if($fReq) <span style="color:#ef4444;">*</span> @endif</label>@endif
                                        <input type="{{ $fType === 'number' ? 'number' : ($fType === 'tel' ? 'tel' : 'text') }}" 
                                               id="{{ $fieldId }}"
                                               name="custom_fields[{{ $fKey }}]" 
                                               class="form-input" 
                                               style="{{ $inputStyle }}"
                                               value="{{ old("custom_fields.{$fKey}") }}" 
                                               placeholder="{{ $fPlaceholder ?: strip_tags($fLabel) }}" 
                                               {{ $fReq ? 'required' : '' }}>
                                    </div>
                                 @endif
                            @endif
                        @endforeach
                    </div>

                @else
                    {{-- Fallback for legacy forms --}}
                    @php
                        $enabledFields = $form->fields ?? ['email'];
                    @endphp

                    <div class="fields-stack">
                        @if(in_array('first_name', $enabledFields))
                            <div class="form-group">
                                <label class="form-label" for="legacy_first_name">First Name</label>
                                <input type="text" id="legacy_first_name" name="first_name" class="form-input" value="{{ old('first_name') }}" placeholder="John">
                            </div>
                        @endif

                        @if(in_array('last_name', $enabledFields))
                            <div class="form-group">
                                <label class="form-label" for="legacy_last_name">Last Name</label>
                                <input type="text" id="legacy_last_name" name="last_name" class="form-input" value="{{ old('last_name') }}" placeholder="Doe">
                            </div>
                        @endif

                        @if(in_array('email', $enabledFields))
                            <div class="form-group">
                                <label class="form-label" for="legacy_email">Email Address <span style="color:#ef4444;">*</span></label>
                                <input type="email" id="legacy_email" name="email" class="form-input" value="{{ old('email') }}" placeholder="your@email.com" required>
                            </div>
                        @endif

                        @if(in_array('phone_e164', $enabledFields))
                            <div class="form-group">
                                <label class="form-label" for="legacy_phone_e164">WhatsApp Phone</label>
                                <input type="tel" id="legacy_phone_e164" name="phone_e164" class="form-input" value="{{ old('phone_e164') }}" placeholder="+1 234 567 8900">
                            </div>
                        @endif

                        @php
                            $customConfigs = $form->settings['custom_fields'] ?? [];
                        @endphp

                        @foreach($customConfigs as $cfIdx => $cf)
                            @php
                                $cfKey = $cf['key'] ?? '';
                                $cfLabel = $cf['label'] ?? $cfKey;
                                $cfType = $cf['type'] ?? 'text';
                                $cfReq = !empty($cf['required']);
                                $cfFieldId = 'legacy_cf_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $cfKey ?: ('field_' . $cfIdx));
                            @endphp

                            <div class="form-group">
                                <label class="form-label" for="{{ $cfFieldId }}">
                                    {{ $cfLabel }}
                                    @if($cfReq) <span style="color:#ef4444;">*</span> @endif
                                </label>

                                @if($cfType === 'textarea')
                                    <textarea id="{{ $cfFieldId }}" name="custom_fields[{{ $cfKey }}]" class="form-textarea" rows="3" placeholder="{{ $cf['placeholder'] ?? '' }}" {{ $cfReq ? 'required' : '' }}>{{ old("custom_fields.{$cfKey}") }}</textarea>
                                @elseif($cfType === 'select')
                                    <div class="custom-select-wrapper">
                                        <select id="{{ $cfFieldId }}" name="custom_fields[{{ $cfKey }}]" {{ $cfReq ? 'required' : '' }}>
                                            <option value="">Select an option...</option>
                                            @foreach(($cf['options'] ?? []) as $opt)
                                                <option value="{{ $opt }}" {{ old("custom_fields.{$cfKey}") === $opt ? 'selected' : '' }}>{{ $opt }}</option>
                                            @endforeach
                                        </select>
                                        <div class="custom-select-arrow">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </div>
                                    </div>
                                @elseif($cfType === 'radio')
                                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
                                        @foreach(($cf['options'] ?? []) as $optIdx => $opt)
                                            @php $optId = $cfFieldId . '_opt_' . $optIdx; @endphp
                                            <label class="custom-radio-item" for="{{ $optId }}">
                                                <input type="radio" id="{{ $optId }}" name="custom_fields[{{ $cfKey }}]" value="{{ $opt }}" {{ old("custom_fields.{$cfKey}") === $opt ? 'checked' : '' }} {{ $cfReq ? 'required' : '' }}>
                                                <span class="custom-radio-circle"><span class="custom-radio-dot"></span></span>
                                                <span>{{ $opt }}</span>
                                            </label>
                                        @endforeach
                                    </div>
                                @elseif($cfType === 'date')
                                    <div class="custom-datepicker-container" data-date="{{ old("custom_fields.{$cfKey}", '') }}">
                                        <button type="button" id="{{ $cfFieldId }}_btn" class="custom-datepicker-trigger">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                            <span class="date-text placeholder-text">{{ $cf['placeholder'] ?? 'Select date' }}</span>
                                        </button>
                                        <input type="hidden" id="{{ $cfFieldId }}" name="custom_fields[{{ $cfKey }}]" value="{{ old("custom_fields.{$cfKey}", '') }}" {{ $cfReq ? 'required' : '' }}>
                                    </div>
                                @elseif($cfType === 'file')
                                    <div class="custom-dropzone">
                                        <input type="file" id="{{ $cfFieldId }}" name="custom_fields[{{ $cfKey }}]" onchange="handleFileChange(this)" {{ $cfReq ? 'required' : '' }}>
                                        <div class="dropzone-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                        </div>
                                        <div class="dropzone-title">Drag & drop or <span style="color:var(--theme-color);font-weight:600;text-decoration:underline;">browse</span></div>
                                        <div class="dropzone-sub">Images, PDF, Documents · max 50 MB</div>
                                        <div class="dropzone-filename"></div>
                                    </div>
                                @else
                                    <input type="{{ $cfType === 'number' ? 'number' : ($cfType === 'tel' ? 'tel' : 'text') }}" 
                                           id="{{ $cfFieldId }}"
                                           name="custom_fields[{{ $cfKey }}]" 
                                           class="form-input" 
                                           value="{{ old("custom_fields.{$cfKey}") }}" 
                                           placeholder="{{ $cf['placeholder'] ?? '' }}" 
                                           {{ $cfReq ? 'required' : '' }}>
                                @endif
                            </div>
                        @endforeach

                        @if($form->gdpr_checkbox)
                            <div class="form-group">
                                <label class="custom-checkbox-item" for="legacy_gdpr" style="align-items: flex-start;">
                                    <input type="checkbox" id="legacy_gdpr" name="gdpr_consent" value="1" {{ old('gdpr_consent') ? 'checked' : '' }} required>
                                    <span class="custom-checkbox-box" style="margin-top: 2px;">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </span>
                                    <span style="font-size: 13px; line-height: 1.4; color: #4b5563;">{{ $form->gdpr_text ?? 'I agree to receive communications and updates.' }}</span>
                                </label>
                            </div>
                        @endif
                    </div>
                @endif

                @php
                    $hasBuilderButton = !empty($builderFields) && is_array($builderFields) && collect($builderFields)->contains('type', 'button');
                @endphp

                @if(!$hasBuilderButton)
                    <button type="submit" class="btn-submit" style="margin-top: {{ $fieldGap }}px;">
                        {{ $form->settings['button_text'] ?? 'Submit' }}
                    </button>
                @endif
            </form>
        @endif

    </div>
</div>

<script>
    function handleFileChange(input) {
        const dropzone = input.closest('.custom-dropzone');
        if (!dropzone) return;
        const nameEl = dropzone.querySelector('.dropzone-filename');
        if (input.files && input.files[0]) {
            const f = input.files[0];
            const sizeKb = (f.size / 1024).toFixed(1);
            nameEl.textContent = `✓ Selected: ${f.name} (${sizeKb} KB)`;
            nameEl.style.display = 'block';
        } else {
            nameEl.textContent = '';
            nameEl.style.display = 'none';
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        // --- Star Rating ---
        document.querySelectorAll('.star-rating-group').forEach(function(group) {
            const hidden = group.querySelector('input[type="hidden"]');
            const btns = group.querySelectorAll('.star-btn');

            function highlight(val) {
                btns.forEach(function(btn) {
                    const bVal = parseInt(btn.dataset.value, 10);
                    btn.classList.toggle('active', bVal <= val);
                });
            }

            btns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const val = parseInt(this.dataset.value, 10);
                    hidden.value = val;
                    highlight(val);
                });

                btn.addEventListener('mouseenter', function() {
                    const val = parseInt(this.dataset.value, 10);
                    btns.forEach(function(b) {
                        const bVal = parseInt(b.dataset.value, 10);
                        b.classList.toggle('hovered', bVal <= val);
                    });
                });

                btn.addEventListener('mouseleave', function() {
                    btns.forEach(function(b) {
                        b.classList.remove('hovered');
                    });
                });
            });
        });

        // --- Scale / NPS Selector ---
        document.querySelectorAll('.custom-scale-group').forEach(function(group) {
            const hidden = group.querySelector('input[type="hidden"]');
            const btns = group.querySelectorAll('.scale-btn');

            btns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const val = this.dataset.value;
                    hidden.value = val;
                    btns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        });

        // --- Signature Pad ---
        document.querySelectorAll('.custom-signature-pad').forEach(function(pad) {
            const canvas = pad.querySelector('canvas');
            const hidden = pad.querySelector('input[type="hidden"]');
            const clearBtn = pad.querySelector('.signature-clear-btn');
            const ctx = canvas.getContext('2d');
            let isDrawing = false;

            function resize() {
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width * (window.devicePixelRatio || 1);
                canvas.height = rect.height * (window.devicePixelRatio || 1);
                ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
                ctx.strokeStyle = '#1f2937';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
            }
            resize();

            function getPos(e) {
                const rect = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
            }

            function start(e) {
                isDrawing = true;
                const pos = getPos(e);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
            }

            function draw(e) {
                if (!isDrawing) return;
                const pos = getPos(e);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }

            function stop() {
                if (isDrawing) {
                    isDrawing = false;
                    hidden.value = canvas.toDataURL();
                }
            }

            canvas.addEventListener('mousedown', start);
            canvas.addEventListener('mousemove', draw);
            window.addEventListener('mouseup', stop);

            canvas.addEventListener('touchstart', start, { passive: true });
            canvas.addEventListener('touchmove', draw, { passive: true });
            window.addEventListener('touchend', stop);

            clearBtn.addEventListener('click', function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                hidden.value = '';
            });
        });

        // --- Custom Interactive DatePicker Matching DatePicker.jsx ---
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const pad2 = (n) => String(n).padStart(2, '0');

        document.querySelectorAll('.custom-datepicker-container').forEach(function(container) {
            const trigger = container.querySelector('.custom-datepicker-trigger');
            const labelEl = trigger.querySelector('.date-text');
            const hiddenInput = container.querySelector('input[type="hidden"]');
            const placeholder = labelEl.textContent;

            let selectedDate = hiddenInput.value ? new Date(hiddenInput.value + 'T00:00:00') : null;
            let currentCursor = selectedDate ? new Date(selectedDate) : new Date();
            let view = 'days'; // 'days' | 'months' | 'years'
            let yearPage = Math.floor(currentCursor.getFullYear() / 12) * 12;

            // Create popover element
            const popover = document.createElement('div');
            popover.className = 'cal-popover';
            popover.innerHTML = `
                <div class="cal-header">
                    <div class="cal-header-titles">
                        <button type="button" class="cal-title-btn month-btn"></button>
                        <button type="button" class="cal-title-btn year-btn"></button>
                    </div>
                    <div class="cal-nav">
                        <button type="button" class="cal-nav-btn prev" title="Previous">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <button type="button" class="cal-nav-btn next" title="Next">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                </div>
                <div class="cal-body">
                    <div class="cal-days-view">
                        <div class="cal-weekdays">
                            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                        </div>
                        <div class="cal-days-grid"></div>
                    </div>
                    <div class="cal-months-grid" style="display: none;"></div>
                    <div class="cal-years-grid" style="display: none;"></div>
                </div>
                <div class="cal-footer">
                    <button type="button" class="cal-footer-btn cal-footer-clear">Clear</button>
                    <button type="button" class="cal-footer-btn cal-footer-today">Today</button>
                </div>
            `;
            container.appendChild(popover);

            const monthBtn = popover.querySelector('.month-btn');
            const yearBtn = popover.querySelector('.year-btn');
            const daysView = popover.querySelector('.cal-days-view');
            const daysGrid = popover.querySelector('.cal-days-grid');
            const monthsGrid = popover.querySelector('.cal-months-grid');
            const yearsGrid = popover.querySelector('.cal-years-grid');
            const prevBtn = popover.querySelector('.cal-nav-btn.prev');
            const nextBtn = popover.querySelector('.cal-nav-btn.next');
            const clearBtn = popover.querySelector('.cal-footer-clear');
            const todayBtn = popover.querySelector('.cal-footer-today');

            monthBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                view = view === 'months' ? 'days' : 'months';
                renderCalendar();
            });

            yearBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                yearPage = Math.floor(currentCursor.getFullYear() / 12) * 12;
                view = view === 'years' ? 'days' : 'years';
                renderCalendar();
            });

            function renderCalendar() {
                const year = currentCursor.getFullYear();
                const month = currentCursor.getMonth();

                monthBtn.textContent = monthNames[month];
                monthBtn.classList.toggle('active', view === 'months');

                if (view === 'years') {
                    yearBtn.textContent = `${yearPage} – ${yearPage + 11}`;
                } else {
                    yearBtn.textContent = year;
                }
                yearBtn.classList.toggle('active', view === 'years');

                daysView.style.display = view === 'days' ? 'block' : 'none';
                monthsGrid.style.display = view === 'months' ? 'grid' : 'none';
                yearsGrid.style.display = view === 'years' ? 'grid' : 'none';

                if (view === 'days') {
                    daysGrid.innerHTML = '';
                    const firstDayDow = new Date(year, month, 1).getDay();
                    const startDate = new Date(year, month, 1 - firstDayDow);
                    const today = new Date();

                    for (let i = 0; i < 42; i++) {
                        const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
                        const cell = document.createElement('div');
                        cell.className = 'cal-day-cell';
                        cell.textContent = d.getDate();

                        const isCurrentMonth = d.getMonth() === month;
                        if (!isCurrentMonth) cell.classList.add('other-month');

                        const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
                        if (isToday) cell.classList.add('today');

                        const isSelected = selectedDate && d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth() && d.getDate() === selectedDate.getDate();
                        if (isSelected) cell.classList.add('selected');

                        cell.addEventListener('click', function(e) {
                            e.stopPropagation();
                            selectDate(d);
                        });

                        daysGrid.appendChild(cell);
                    }
                } else if (view === 'months') {
                    monthsGrid.innerHTML = '';
                    monthNames.forEach(function(mName, idx) {
                        const cell = document.createElement('button');
                        cell.type = 'button';
                        cell.className = 'cal-grid-cell';
                        cell.textContent = mName.slice(0, 3);
                        if (idx === month) cell.classList.add('selected');

                        cell.addEventListener('click', function(e) {
                            e.stopPropagation();
                            currentCursor.setMonth(idx);
                            view = 'days';
                            renderCalendar();
                        });
                        monthsGrid.appendChild(cell);
                    });
                } else if (view === 'years') {
                    yearsGrid.innerHTML = '';
                    for (let y = yearPage; y < yearPage + 12; y++) {
                        const cell = document.createElement('button');
                        cell.type = 'button';
                        cell.className = 'cal-grid-cell';
                        cell.textContent = y;
                        if (y === year) cell.classList.add('selected');

                        cell.addEventListener('click', function(e) {
                            e.stopPropagation();
                            currentCursor.setFullYear(y);
                            view = 'months';
                            renderCalendar();
                        });
                        yearsGrid.appendChild(cell);
                    }
                }
            }

            function selectDate(d) {
                selectedDate = new Date(d);
                const valStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
                hiddenInput.value = valStr;

                const formatted = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
                labelEl.textContent = formatted;
                labelEl.classList.remove('placeholder-text');

                closePopover();
            }

            function clearDate() {
                selectedDate = null;
                hiddenInput.value = '';
                labelEl.textContent = placeholder;
                labelEl.classList.add('placeholder-text');
                closePopover();
            }

            function openPopover() {
                document.querySelectorAll('.cal-popover.open').forEach(p => p.classList.remove('open'));
                document.querySelectorAll('.custom-datepicker-trigger.active').forEach(t => t.classList.remove('active'));
                currentCursor = selectedDate ? new Date(selectedDate) : new Date();
                yearPage = Math.floor(currentCursor.getFullYear() / 12) * 12;
                view = 'days';
                renderCalendar();
                popover.classList.add('open');
                trigger.classList.add('active');
            }

            function closePopover() {
                popover.classList.remove('open');
                trigger.classList.remove('active');
                view = 'days';
            }

            trigger.addEventListener('click', function(e) {
                e.stopPropagation();
                if (popover.classList.contains('open')) {
                    closePopover();
                } else {
                    openPopover();
                }
            });

            prevBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (view === 'days') {
                    currentCursor.setMonth(currentCursor.getMonth() - 1);
                } else if (view === 'months') {
                    currentCursor.setFullYear(currentCursor.getFullYear() - 1);
                } else {
                    yearPage -= 12;
                }
                renderCalendar();
            });

            nextBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (view === 'days') {
                    currentCursor.setMonth(currentCursor.getMonth() + 1);
                } else if (view === 'months') {
                    currentCursor.setFullYear(currentCursor.getFullYear() + 1);
                } else {
                    yearPage += 12;
                }
                renderCalendar();
            });

            clearBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                clearDate();
            });

            todayBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                selectDate(new Date());
            });

            if (selectedDate) {
                const formatted = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(selectedDate);
                labelEl.textContent = formatted;
                labelEl.classList.remove('placeholder-text');
            }
        });

        // ── URL Query Key Parameter Autofilling (GoHighLevel Feature) ───────────
        (function() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                if (!urlParams || !window.location.search) return;

                // Alias mapping for common parameters
                const aliases = {
                    'phone': ['phone_e164', 'whatsapp', 'mobile', 'phone_number'],
                    'phone_e164': ['phone', 'whatsapp', 'mobile'],
                    'whatsapp': ['phone_e164', 'phone'],
                    'first_name': ['fname', 'firstname', 'name'],
                    'last_name': ['lname', 'lastname', 'surname'],
                    'email': ['email_address', 'mail'],
                };

                urlParams.forEach(function(val, qKey) {
                    if (!val) return;
                    const cleanKey = qKey.trim();
                    const lowerKey = cleanKey.toLowerCase();

                    // 1. Check custom fields: name="custom_fields[cleanKey]"
                    const customInputs = document.querySelectorAll(`[name="custom_fields[${cleanKey}]"], [name="custom_fields[${cleanKey}][]"], [data-query-key="${cleanKey}"]`);
                    
                    if (customInputs && customInputs.length > 0) {
                        const first = customInputs[0];
                        const type = (first.getAttribute('type') || '').toLowerCase();
                        const tag = first.tagName.toLowerCase();

                        if (type === 'radio') {
                            customInputs.forEach(function(r) {
                                if (r.value.trim().toLowerCase() === val.trim().toLowerCase()) {
                                    r.checked = true;
                                }
                            });
                        } else if (type === 'checkbox') {
                            const valList = val.split(',').map(function(s) { return s.trim().toLowerCase(); });
                            customInputs.forEach(function(c) {
                                if (valList.includes(c.value.trim().toLowerCase()) || val === '1' || val.toLowerCase() === 'true' || val.toLowerCase() === 'yes') {
                                    c.checked = true;
                                }
                            });
                        } else if (tag === 'select') {
                            for (let i = 0; i < first.options.length; i++) {
                                if (first.options[i].value.toLowerCase() === val.toLowerCase() || first.options[i].text.toLowerCase() === val.toLowerCase()) {
                                    first.selectedIndex = i;
                                    break;
                                }
                            }
                        } else {
                            first.value = val;
                        }
                    }

                    // 2. Check standard top-level fields (first_name, last_name, email, phone_e164, etc.)
                    const stdInput = document.querySelector(`input[name="${cleanKey}"], input[name="${lowerKey}"], textarea[name="${cleanKey}"]`);
                    if (stdInput && !stdInput.value) {
                        stdInput.value = val;
                    }

                    // Check aliases if standard input wasn't found directly
                    if (aliases[lowerKey]) {
                        aliases[lowerKey].forEach(function(alias) {
                            const aliasInput = document.querySelector(`input[name="${alias}"]`);
                            if (aliasInput && !aliasInput.value) {
                                aliasInput.value = val;
                            }
                        });
                    }

                    // 3. Handle interactive Scale (NPS) buttons pre-selection
                    const scaleContainer = document.querySelector(`[data-field-key="${cleanKey}"] .nps-scale-wrapper`);
                    if (scaleContainer) {
                        const scaleBtns = scaleContainer.querySelectorAll('.scale-btn');
                        scaleBtns.forEach(function(btn) {
                            if (btn.getAttribute('data-value') === val.trim()) {
                                btn.click();
                            }
                        });
                    }

                    // 4. Handle interactive Star Ratings pre-selection
                    const ratingContainer = document.querySelector(`[data-field-key="${cleanKey}"] .star-rating-wrapper`);
                    if (ratingContainer) {
                        const stars = ratingContainer.querySelectorAll('.star-btn');
                        const ratingNum = parseInt(val, 10);
                        if (!isNaN(ratingNum) && stars[ratingNum - 1]) {
                            stars[ratingNum - 1].click();
                        }
                    }
                });
            } catch (err) {
                console.warn('URL query pre-fill notice:', err);
            }
        })();

        // --- Consistent Client-Side Form Validation Engine ---
        function getFieldContainer(el) {
            return el.closest('.form-group') || el.closest('.custom-dropzone') || el.parentElement;
        }

        function clearFieldError(el) {
            if (!el) return;
            el.classList.remove('has-error');
            const container = getFieldContainer(el);
            if (!container) return;

            const datepickerTrigger = container.querySelector('.custom-datepicker-trigger');
            if (datepickerTrigger) datepickerTrigger.classList.remove('has-error');

            const dropzone = container.querySelector('.custom-dropzone');
            if (dropzone) dropzone.classList.remove('has-error');

            const sigPad = container.querySelector('.custom-signature-pad');
            if (sigPad) sigPad.classList.remove('has-error');

            const checkboxItem = el.closest('.custom-checkbox-item');
            if (checkboxItem) checkboxItem.classList.remove('has-error');

            const radioItem = el.closest('.custom-radio-item');
            if (radioItem) radioItem.classList.remove('has-error');

            const label = container.querySelector('.form-label');
            if (label) label.classList.remove('has-error');

            const existingErr = container.querySelector('.form-error-msg');
            if (existingErr) existingErr.remove();
        }

        function showFieldError(el, message) {
            clearFieldError(el);
            const container = getFieldContainer(el);
            if (!container) return;

            el.classList.add('has-error');

            const datepickerTrigger = container.querySelector('.custom-datepicker-trigger');
            if (datepickerTrigger) datepickerTrigger.classList.add('has-error');

            const dropzone = container.querySelector('.custom-dropzone');
            if (dropzone) dropzone.classList.add('has-error');

            const sigPad = container.querySelector('.custom-signature-pad');
            if (sigPad) sigPad.classList.add('has-error');

            const checkboxItem = el.closest('.custom-checkbox-item');
            if (checkboxItem) checkboxItem.classList.add('has-error');

            const radioItem = el.closest('.custom-radio-item');
            if (radioItem) radioItem.classList.add('has-error');

            const label = container.querySelector('.form-label');
            if (label) label.classList.add('has-error');

            const errDiv = document.createElement('div');
            errDiv.className = 'form-error-msg';
            errDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><span>${message}</span>`;
            
            container.appendChild(errDiv);
        }

        function getFieldLabelText(el) {
            const container = getFieldContainer(el);
            if (container) {
                const label = container.querySelector('.form-label') || container.closest('.form-group')?.querySelector('.form-label');
                if (label) {
                    const clone = label.cloneNode(true);
                    clone.querySelectorAll('span, svg').forEach(s => s.remove());
                    const txt = clone.textContent.trim();
                    if (txt) return txt;
                }
                const chkLabel = el.closest('.custom-checkbox-item');
                if (chkLabel) {
                    const clone = chkLabel.cloneNode(true);
                    clone.querySelectorAll('.custom-checkbox-box, svg').forEach(s => s.remove());
                    const txt = clone.textContent.trim();
                    if (txt) return txt.length > 40 ? txt.slice(0, 40) + '...' : txt;
                }
            }
            const placeholder = el.getAttribute('placeholder');
            if (placeholder && !placeholder.toLowerCase().includes('http') && !placeholder.toLowerCase().includes('select')) {
                return placeholder;
            }
            const name = el.getAttribute('name') || '';
            const cleanName = name.replace(/^custom_fields\[/, '').replace(/\]$/, '').replace(/_/g, ' ');
            if (cleanName && !cleanName.startsWith('terms_f_')) {
                return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
            }
            return 'This field';
        }

        function validateFormField(el) {
            if (!el || el.disabled) return true;

            // Skip hidden inputs unless they represent interactive components
            const isCustomComponent = el.closest('.custom-datepicker-container') || el.closest('.custom-signature-pad') || el.closest('.custom-scale-group') || el.closest('.star-rating-group');
            if (el.type === 'hidden' && !isCustomComponent) return true;

            const isRequired = el.hasAttribute('required') || el.required;
            const tag = el.tagName.toLowerCase();
            const type = (el.type || '').toLowerCase();
            const val = (el.value || '').trim();

            if (type === 'checkbox') {
                if (isRequired && !el.checked) {
                    showFieldError(el, 'You must agree to continue.');
                    return false;
                }
            } else if (type === 'radio') {
                const name = el.getAttribute('name');
                if (isRequired && name) {
                    const group = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
                    const anyChecked = Array.from(group).some(r => r.checked);
                    if (!anyChecked) {
                        showFieldError(el, 'Please select an option.');
                        return false;
                    }
                }
            } else if (type === 'file') {
                if (isRequired && (!el.files || el.files.length === 0)) {
                    showFieldError(el, 'Please upload a file.');
                    return false;
                }
            } else if (el.closest('.custom-datepicker-container')) {
                if (isRequired && !val) {
                    showFieldError(el, 'Please select a date.');
                    return false;
                }
            } else if (el.closest('.custom-signature-pad')) {
                if (isRequired && !val) {
                    showFieldError(el, 'Please draw your signature.');
                    return false;
                }
            } else if (el.closest('.custom-scale-group') || el.closest('.star-rating-group')) {
                if (isRequired && !val) {
                    showFieldError(el, 'Please select a score/rating.');
                    return false;
                }
            } else if (tag === 'select') {
                if (isRequired && (!val || val === '')) {
                    showFieldError(el, 'Please select an option.');
                    return false;
                }
            } else {
                if (isRequired && !val) {
                    const labelText = getFieldLabelText(el);
                    showFieldError(el, `${labelText} is required.`);
                    return false;
                }
                if (type === 'email' && val) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(val)) {
                        showFieldError(el, 'Please enter a valid email address.');
                        return false;
                    }
                }
            }

            clearFieldError(el);
            return true;
        }

        function validateFormContainer(containerEl) {
            if (!containerEl) return { isValid: true, firstErrorEl: null };

            let isValid = true;
            let firstErrorEl = null;

            // Gather all candidate inputs, selects, textareas
            const fields = containerEl.querySelectorAll('input, select, textarea');
            const processedRadioNames = new Set();

            fields.forEach(function(field) {
                // If field is in step 2 and step 2 is hidden, skip it during step 1 validation
                if (containerEl.id !== 'order-step-2-content' && field.closest('#order-step-2-content') && document.getElementById('order-step-2-content')?.style.display === 'none') {
                    return;
                }

                if (field.type === 'radio') {
                    const rName = field.getAttribute('name');
                    if (rName && processedRadioNames.has(rName)) return;
                    if (rName) processedRadioNames.add(rName);
                }

                const fieldOk = validateFormField(field);
                if (!fieldOk) {
                    isValid = false;
                    if (!firstErrorEl) {
                        firstErrorEl = field.closest('.custom-datepicker-container')?.querySelector('.custom-datepicker-trigger') ||
                                       field.closest('.custom-dropzone') ||
                                       field.closest('.custom-signature-pad') ||
                                       field;
                    }
                }
            });

            return { isValid, firstErrorEl };
        }

        // --- 2-Step Order Form & Monetization Engine (GHL Style) ---
        let currentOrderStep = 1;
        let selectedProductPrice = parseFloat(document.getElementById('input_selected_product_price')?.value || 49.00);
        let bumpOfferPrice = {{ (float) ($form->order_bump_settings['price'] ?? 19.00) }};
        let couponDiscountAmount = 0;
        let currencySym = "{{ ($form->currency ?? 'USD') === 'EUR' ? '€' : (($form->currency ?? 'USD') === 'GBP' ? '£' : (($form->currency ?? 'USD') === 'INR' ? '₹' : '$')) }}";

        window.switchOrderStep = function(step) {
            currentOrderStep = step;
            const step1Btn = document.getElementById('btn-step-1');
            const step2Btn = document.getElementById('btn-step-2');
            const step2Content = document.getElementById('order-step-2-content');
            const step1BtnWrap = document.getElementById('order-step-1-btn-wrap');

            if (step === 1) {
                step1Btn?.classList.add('active');
                step2Btn?.classList.remove('active');
                if (step2Content) step2Content.style.display = 'none';
                if (step1BtnWrap) step1BtnWrap.style.display = 'block';
            } else {
                step1Btn?.classList.remove('active');
                step2Btn?.classList.add('active');
                if (step2Content) step2Content.style.display = 'block';
                if (step1BtnWrap) step1BtnWrap.style.display = 'none';
            }
            recalculateOrderTotal();
        };

        window.goToOrderStep2 = function() {
            // Validate Step 1 form fields using our consistent validation system
            const form = document.getElementById('public_subscribe_form');
            if (form) {
                const step1Validation = validateFormContainer(form);
                if (!step1Validation.isValid) {
                    if (step1Validation.firstErrorEl) {
                        step1Validation.firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        if (typeof step1Validation.firstErrorEl.focus === 'function') {
                            step1Validation.firstErrorEl.focus();
                        }
                    }
                    return;
                }
            }
            switchOrderStep(2);
        };

        window.formatCardInput = function(input) {
            let val = input.value.replace(/\D/g, '').slice(0, 16);
            let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
            input.value = formatted;

            const isStep2 = input.id === 'step2_card_num';
            const iconId = isStep2 ? 'step2_card_type_icon' : 'ps_card_type_icon';
            const typeIcon = document.getElementById(iconId);
            if (typeIcon) {
                if (val.startsWith('4')) {
                    typeIcon.innerHTML = '<span class="brand-badge brand-visa">VISA</span>';
                } else if (val.startsWith('51') || val.startsWith('52') || val.startsWith('53') || val.startsWith('54') || val.startsWith('55') || (parseInt(val.slice(0, 4), 10) >= 2221 && parseInt(val.slice(0, 4), 10) <= 2720)) {
                    typeIcon.innerHTML = '<span class="brand-badge brand-mc">MC</span>';
                } else if (val.startsWith('34') || val.startsWith('37')) {
                    typeIcon.innerHTML = '<span class="brand-badge brand-amex">AMEX</span>';
                } else {
                    typeIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>';
                }
            }
        };

        window.formatExpiryInput = function(input) {
            let val = input.value.replace(/\D/g, '').slice(0, 4);
            if (val.length >= 2) {
                input.value = val.slice(0, 2) + ' / ' + val.slice(2);
            } else {
                input.value = val;
            }
        };

        window.formatCvcInput = function(input) {
            input.value = input.value.replace(/\D/g, '').slice(0, 4);
        };

        window.selectProductOption = function(cardEl, productId, priceId, price, title) {
            document.querySelectorAll('.product-select-card').forEach(c => c.classList.remove('selected'));
            cardEl.classList.add('selected');

            const radio = cardEl.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;

            selectedProductPrice = parseFloat(price);
            const pIdInput = document.getElementById('input_selected_product_id');
            const priceIdInput = document.getElementById('input_selected_price_id');
            const priceValInput = document.getElementById('input_selected_product_price');

            if (pIdInput) pIdInput.value = productId;
            if (priceIdInput) priceIdInput.value = priceId || '';
            if (priceValInput) priceValInput.value = price;

            const sumProdTitle = document.getElementById('summary-prod-title');
            const sumProdPrice = document.getElementById('summary-prod-price');
            if (sumProdTitle) sumProdTitle.textContent = title || 'Product Item';
            if (sumProdPrice) sumProdPrice.textContent = currencySym + selectedProductPrice.toFixed(2);

            const psPayment = document.getElementById('payment-method-section-ps');
            if (psPayment) {
                psPayment.style.display = selectedProductPrice > 0 ? 'block' : 'none';
            }

            recalculateOrderTotal();
        };

        window.toggleOrderBump = function() {
            const chk = document.getElementById('order_bump_checkbox') || document.getElementById('step2_order_bump_checkbox');
            if (chk) {
                chk.checked = !chk.checked;
                recalculateOrderTotal();
            }
        };

        window.applyCouponCode = function() {
            const input = document.getElementById('order_coupon_code');
            const feedback = document.getElementById('coupon_feedback');
            const code = input ? input.value.trim().toUpperCase() : '';

            if (!code) {
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.color = '#ef4444';
                    feedback.textContent = 'Please enter a coupon code';
                }
                return;
            }

            // Simulate coupon discount or check code
            if (code === 'SAVE20' || code === 'VIP20' || code === 'DISCOUNT') {
                couponDiscountAmount = selectedProductPrice * 0.20;
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.color = '#16a34a';
                    feedback.textContent = `Promo code "${code}" applied (20% OFF)!`;
                }
            } else {
                couponDiscountAmount = 10.00;
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.style.color = '#16a34a';
                    feedback.textContent = `Coupon "${code}" applied!`;
                }
            }
            recalculateOrderTotal();
        };

        function recalculateOrderTotal() {
            const chk = document.getElementById('order_bump_checkbox') || document.getElementById('step2_order_bump_checkbox');
            const isBump = chk && chk.checked;
            const bumpRow = document.getElementById('summary-bump-row');
            const discountRow = document.getElementById('summary-discount-row');
            const totalPriceEl = document.getElementById('summary-total-price');
            const discountPriceEl = document.getElementById('summary-discount-price');

            let total = selectedProductPrice;

            if (isBump) {
                total += bumpOfferPrice;
                if (bumpRow) bumpRow.style.display = 'flex';
            } else {
                if (bumpRow) bumpRow.style.display = 'none';
            }

            if (couponDiscountAmount > 0) {
                total = Math.max(0, total - couponDiscountAmount);
                if (discountRow) discountRow.style.display = 'flex';
                if (discountPriceEl) discountPriceEl.textContent = '-' + currencySym + couponDiscountAmount.toFixed(2);
            } else {
                if (discountRow) discountRow.style.display = 'none';
            }

            if (totalPriceEl) {
                totalPriceEl.textContent = currencySym + total.toFixed(2);
            }
        }

        // Attach dynamic input clearing and submit interception
        const mainForm = document.getElementById('public_subscribe_form');
        if (mainForm) {
            mainForm.addEventListener('input', function(e) {
                clearFieldError(e.target);
            });
            mainForm.addEventListener('change', function(e) {
                clearFieldError(e.target);
            });

            mainForm.addEventListener('submit', function(e) {
                // If 2-step form is in step 1, advance to step 2 instead of submitting
                const is2Step = document.querySelector('.order-2step-container');
                if (is2Step && currentOrderStep === 1) {
                    e.preventDefault();
                    goToOrderStep2();
                    return;
                }

                const result = validateFormContainer(mainForm);
                if (!result.isValid) {
                    e.preventDefault();
                    if (result.firstErrorEl) {
                        result.firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        if (typeof result.firstErrorEl.focus === 'function') {
                            result.firstErrorEl.focus();
                        }
                    }
                }
            });
        }

        const otpForm = document.getElementById('public_otp_form');
        if (otpForm) {
            otpForm.addEventListener('input', function(e) {
                clearFieldError(e.target);
            });
            otpForm.addEventListener('submit', function(e) {
                const otpInput = document.getElementById('otp_code_input');
                if (otpInput && (!otpInput.value.trim() || otpInput.value.trim().length < 6)) {
                    e.preventDefault();
                    showFieldError(otpInput, 'Please enter a valid 6-digit OTP code.');
                    otpInput.focus();
                }
            });
        }
    });
</script>

</body>
</html>
