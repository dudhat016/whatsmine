<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Events\SubscriptionFormSubmitted;
use App\Modules\Funnels\Models\SubscriptionForm;
use App\Modules\Funnels\Models\SubscriptionFormSubmission;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\ContactTag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class PublicSubscriptionController extends Controller
{
    /** Render public Blade form view (Standalone / iFrame) */
    public function show(string $slug, Request $request): View
    {
        $form = SubscriptionForm::where('slug', $slug)
            ->where('is_active', true)
            ->with(['formProducts.product.prices', 'formProducts.price'])
            ->firstOrFail();

        // Track impression / view
        try {
            $userAgent = $request->userAgent() ?? '';
            $deviceType = 'desktop';
            if (preg_match('/(mobile|android|iphone|ipad|phone)/i', $userAgent)) {
                $deviceType = 'mobile';
            }

            \App\Modules\Funnels\Models\SubscriptionFormView::create([
                'workspace_id' => $form->workspace_id,
                'form_id'      => $form->id,
                'ip_address'   => $request->ip(),
                'user_agent'   => substr($userAgent, 0, 500),
                'device_type'  => $deviceType,
                'referrer_url' => $request->header('referer'),
                'utm_source'   => $request->query('utm_source'),
                'utm_medium'   => $request->query('utm_medium'),
                'utm_campaign' => $request->query('utm_campaign'),
                'utm_term'     => $request->query('utm_term'),
                'utm_content'  => $request->query('utm_content'),
            ]);
        } catch (\Throwable $e) {
            // Silently log view error without blocking form load
            Log::warning("Error tracking form view for form {$form->id}: {$e->getMessage()}");
        }

        return view('subscribe', [
            'form' => $form,
        ]);
    }

    /** Handle public web form submission */
    public function subscribe(string $slug, Request $request)
    {
        $form = SubscriptionForm::where('slug', $slug)->where('is_active', true)->first();
        if (! $form) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['status' => 'error', 'message' => 'This form is no longer active or could not be found.'], 404);
            }
            abort(404, 'Form not found or inactive.');
        }

        $formFields = $form->fields ?? [];
        $builderFields = $form->settings['builder_fields'] ?? [];

        $isEmailRequired = in_array('email', $formFields);
        $isPhoneRequired = in_array('phone_e164', $formFields);

        // Check if builder fields define specific required state
        if (is_array($builderFields)) {
            foreach ($builderFields as $bf) {
                if (($bf['type'] ?? '') === 'email' || ($bf['key'] ?? '') === 'email') {
                    $isEmailRequired = ! empty($bf['required']);
                }
                if (in_array($bf['type'] ?? '', ['phone_e164', 'tel', 'whatsapp']) || in_array($bf['key'] ?? '', ['phone_e164', 'tel', 'whatsapp'])) {
                    $isPhoneRequired = ! empty($bf['required']);
                }
            }
        }

        // If neither is strictly required by form settings, at least one must be provided for CRM contact identification
        $rules = [
            'email'                  => $isEmailRequired ? ['required', 'email', 'max:255'] : ['nullable', 'email', 'max:255'],
            'first_name'             => ['nullable', 'string', 'max:128'],
            'last_name'              => ['nullable', 'string', 'max:128'],
            'phone_e164'             => $isPhoneRequired ? ['required', 'string', 'max:32'] : ['nullable', 'string', 'max:32'],
            'selected_product_id'    => ['nullable'],
            'selected_price_id'      => ['nullable'],
            'selected_product_price' => ['nullable'],
            'order_bump_checked'     => ['nullable'],
            'coupon_code'            => ['nullable', 'string', 'max:64'],
            'payment_cardholder'     => ['nullable', 'string', 'max:128'],
            'payment_card_number'    => ['nullable', 'string', 'max:32'],
            'payment_exp'            => ['nullable', 'string', 'max:16'],
            'payment_cvc'            => ['nullable', 'string', 'max:8'],
        ];

        if (! $isEmailRequired && ! $isPhoneRequired) {
            $rules['email']      = ['required_without:phone_e164', 'nullable', 'email', 'max:255'];
            $rules['phone_e164'] = ['required_without:email', 'nullable', 'string', 'max:32'];
        }

        $customAttributes = [
            'email'         => 'Email Address',
            'first_name'    => 'First Name',
            'last_name'     => 'Last Name',
            'phone_e164'    => 'Phone',
            'gdpr_consent'  => 'Consent Agreement',
            'terms_consent' => 'Terms of Service',
        ];

        $ignoredTypes = ['heading', 'paragraph', 'divider', 'image', 'button', 'order_2step', 'product_select', 'order_bump', 'coupon_code', 'captcha', 'double_optin'];

        // 1. Process customFieldConfigs (legacy / settings custom fields) only if builder_fields is empty
        $customFieldConfigs = $form->settings['custom_fields'] ?? [];
        if (empty($builderFields) && is_array($customFieldConfigs)) {
            foreach ($customFieldConfigs as $cf) {
                $cfType = $cf['type'] ?? 'text';
                if (in_array($cfType, array_merge($ignoredTypes, ['terms', 'gdpr', 'first_name', 'last_name', 'email', 'phone_e164']))) {
                    continue;
                }
                $cfKey = $cf['key'] ?? ($cf['id'] ?? null);
                if (! $cfKey) {
                    continue;
                }
                $ruleKey = 'custom_fields.' . $cfKey;
                $fieldRules = ['nullable'];

                if (! empty($cf['required'])) {
                    $fieldRules = ['required'];
                }

                if ($cfType === 'number') {
                    $fieldRules[] = 'numeric';
                } elseif ($cfType === 'date') {
                    $fieldRules[] = 'date';
                } elseif ($cfType === 'file') {
                    $fieldRules = array_merge($fieldRules, ['file', 'max:10240']); // max 10MB
                }

                $rules[$ruleKey] = $fieldRules;
                $cleanLabel = trim(strip_tags($cf['label'] ?? ($cf['name'] ?? $cfKey)));
                $customAttributes[$ruleKey] = $cleanLabel ?: $cfKey;
            }
        }

        // 2. Process builderFields (visual drag-and-drop form builder fields)
        if (! empty($builderFields) && is_array($builderFields)) {
            foreach ($builderFields as $bf) {
                $bfType = $bf['type'] ?? 'text';
                $bfKey = (! empty($bf['key']) && $bf['key'] !== $bfType) ? $bf['key'] : ($bf['id'] ?? ($bf['key'] ?? $bfType));
                $rawLabel = $bf['label'] ?? ($bf['content'] ?? ($bf['termsText'] ?? ($bf['placeholder'] ?? '')));
                $cleanLabel = trim(strip_tags($rawLabel));

                if (empty($cleanLabel)) {
                    $cleanLabel = match ($bfType) {
                        'phone_e164', 'tel', 'whatsapp' => 'Phone',
                        'email'                         => 'Email Address',
                        'first_name'                    => 'First Name',
                        'last_name'                     => 'Last Name',
                        'terms'                         => 'Terms of Service',
                        'gdpr'                          => 'Consent Agreement',
                        'file'                          => 'File Upload',
                        'date'                          => 'Date',
                        default                         => 'Field',
                    };
                }

                if (in_array($bfType, ['email', 'phone_e164', 'first_name', 'last_name'])) {
                    $customAttributes[$bfType] = $cleanLabel;
                    if (! empty($bf['required'])) {
                        $rules[$bfType] = array_merge(array_diff($rules[$bfType] ?? [], ['nullable']), ['required']);
                    }
                } elseif ($bfType === 'gdpr') {
                    $rules['gdpr_consent'] = ['required', 'accepted'];
                    $customAttributes['gdpr_consent'] = $cleanLabel ?: 'Consent Agreement';
                } elseif ($bfType === 'terms') {
                    $rules['terms_consent'] = ['required', 'accepted'];
                    $customAttributes['terms_consent'] = $cleanLabel ?: 'Terms of Service';
                } elseif (! in_array($bfType, $ignoredTypes)) {
                    $ruleKey = 'custom_fields.' . $bfKey;
                    $fieldRules = ['nullable'];

                    if (! empty($bf['required'])) {
                        $fieldRules = ['required'];
                    }

                    if ($bfType === 'number') {
                        $fieldRules[] = 'numeric';
                    } elseif ($bfType === 'date') {
                        $fieldRules[] = 'date';
                    } elseif ($bfType === 'file') {
                        $fieldRules = array_merge($fieldRules, ['file', 'max:10240']);
                    }

                    $rules[$ruleKey] = $fieldRules;
                    $customAttributes[$ruleKey] = $cleanLabel;
                }
            }
        }

        if ($form->gdpr_checkbox) {
            $rules['gdpr_consent'] = ['required', 'accepted'];
        }

        $validated = $request->validate($rules, [
            'email.required_without'      => 'Please provide either an Email Address or WhatsApp Phone Number.',
            'phone_e164.required_without' => 'Please provide either an Email Address or WhatsApp Phone Number.',
            'gdpr_consent.accepted'       => 'You must agree to the privacy policy to continue.',
            'gdpr_consent.required'       => 'You must agree to the privacy policy to continue.',
            'terms_consent.accepted'      => 'You must agree to the Terms of Service to continue.',
            'terms_consent.required'      => 'You must agree to the Terms of Service to continue.',
            'required'                    => 'The :attribute field is required.',
        ], $customAttributes);

        // Handle file uploads in custom fields
        if ($request->hasFile('custom_fields')) {
            $files = $request->file('custom_fields');
            foreach ($files as $key => $file) {
                if ($file && $file->isValid()) {
                    $path = $file->store("forms/submissions/{$form->id}", 'public');
                    $validated['custom_fields'][$key] = \Illuminate\Support\Facades\Storage::url($path);
                }
            }
        }

        return $this->processSubmission($form, $validated, $request);
    }

    /** Handle OTP Verification step */
    public function verifyOtp(string $slug, Request $request)
    {
        $form = SubscriptionForm::where('slug', $slug)->firstOrFail();

        $validated = $request->validate([
            'submission_id' => ['required', 'integer'],
            'otp_code'      => ['required', 'string', 'max:16'],
        ]);

        $submission = SubscriptionFormSubmission::where('id', $validated['submission_id'])
            ->where('form_id', $form->id)
            ->first();

        if (! $submission) {
            if ($request->wantsJson()) {
                return response()->json(['status' => 'error', 'message' => 'Submission not found.'], 404);
            }
            return back()->withErrors(['otp_code' => 'Invalid or expired submission.']);
        }

        if ($submission->is_verified) {
            if ($request->wantsJson()) {
                return response()->json(['status' => 'success', 'message' => 'Already verified.']);
            }
            return back()->with('success', 'Already verified.');
        }

        if ($submission->otp_expires_at && $submission->otp_expires_at->isPast()) {
            if ($request->wantsJson()) {
                return response()->json(['status' => 'error', 'message' => 'OTP has expired. Please request a new code.'], 422);
            }
            return back()->withErrors(['otp_code' => 'OTP code has expired.']);
        }

        if ($submission->otp_code !== trim($validated['otp_code'])) {
            if ($request->wantsJson()) {
                return response()->json(['status' => 'error', 'message' => 'Incorrect OTP code.'], 422);
            }
            return back()->withErrors(['otp_code' => 'Incorrect OTP code.']);
        }

        // Mark submission verified
        $submission->update([
            'is_verified' => true,
            'verified_at' => now(),
        ]);

        return $this->finalizeVerifiedContact($form, $submission, $request);
    }

    /** Public REST API Endpoint mode (CSRF exempt) */
    public function apiSubscribe(string $slug, Request $request): JsonResponse
    {
        $form = SubscriptionForm::where('slug', $slug)->where('is_active', true)->first();

        if (! $form) {
            return response()->json(['status' => 'error', 'message' => 'Form not found or inactive.'], 404);
        }

        $validated = $request->validate([
            'email'         => ['required', 'email', 'max:255'],
            'first_name'    => ['nullable', 'string', 'max:128'],
            'last_name'     => ['nullable', 'string', 'max:128'],
            'phone_e164'    => ['nullable', 'string', 'max:32'],
            'custom_fields' => ['nullable', 'array'],
        ]);

        return $this->processSubmission($form, $validated, $request);
    }

    /** Public REST API OTP Verification */
    public function apiVerifyOtp(string $slug, Request $request): JsonResponse
    {
        return $this->verifyOtp($slug, $request);
    }

    /** Inner submission processing logic */
    protected function processSubmission(SubscriptionForm $form, array $validated, Request $request)
    {
        $otpCode = $form->double_optin_enabled ? sprintf('%06d', random_int(100000, 999999)) : null;
        $otpExpiresAt = $form->double_optin_enabled ? now()->addMinutes(5) : null;

        $submission = SubscriptionFormSubmission::create([
            'workspace_id'   => $form->workspace_id,
            'form_id'        => $form->id,
            'submitted_data' => $validated,
            'otp_code'       => $otpCode,
            'otp_expires_at' => $otpExpiresAt,
            'is_verified'    => ! $form->double_optin_enabled,
            'ip_address'     => $request->ip(),
            'user_agent'     => $request->userAgent(),
            'referrer_url'   => $request->header('referer'),
        ]);

        if ($form->double_optin_enabled) {
            // Log OTP code (In production, dispatches via WhatsApp Cloud API / Email / SMS)
            Log::info("Subscription Form OTP Code generated: [{$otpCode}] for form [{$form->slug}] channel [{$form->optin_channel}]");

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'status'         => 'pending_verification',
                    'submission_id'  => $submission->id,
                    'optin_channel'  => $form->optin_channel,
                    'message'        => 'Verification 6-digit OTP code sent. Please enter it to complete subscription.',
                    'demo_otp'       => config('app.debug') ? $otpCode : null,
                ], 202);
            }

            return back()->with([
                'pending_verification' => true,
                'submission_id'         => $submission->id,
                'optin_channel'         => $form->optin_channel,
                'message'               => 'Verification 6-digit OTP code sent. Please enter it to complete subscription.',
                'demo_otp'              => config('app.debug') ? $otpCode : null,
            ]);
        }

        return $this->finalizeVerifiedContact($form, $submission, $request);
    }

    /** Finalize verified contact creation & trigger marketing automation */
    protected function finalizeVerifiedContact(SubscriptionForm $form, SubscriptionFormSubmission $submission, Request $request)
    {
        $data = $submission->submitted_data ?? [];

        $email     = $data['email'] ?? null;
        $phoneE164 = $data['phone_e164'] ?? $data['phone'] ?? $data['whatsapp'] ?? null;
        if (! $phoneE164 && ! empty($data['custom_fields'])) {
            foreach ($data['custom_fields'] as $k => $v) {
                if (in_array(strtolower($k), ['phone', 'phone_e164', 'whatsapp', 'mobile', 'contact_number', 'phone_number'])) {
                    $phoneE164 = $v;
                    break;
                }
            }
        }

        $firstName = $data['first_name'] ?? null;
        $lastName  = $data['last_name'] ?? null;
        $customVal = $data['custom_fields'] ?? [];

        // If first_name is an email address (e.g. from browser autofill), do not treat as name
        if ($firstName && filter_var($firstName, FILTER_VALIDATE_EMAIL)) {
            $firstName = null;
        }

        // Upsert Contact in WhatsMine CRM using DB transaction
        try {
            $contact = \Illuminate\Support\Facades\DB::transaction(function () use ($form, $submission, $email, $phoneE164, $firstName, $lastName, $customVal) {
                $contact = Contact::where('workspace_id', $form->workspace_id)
                    ->where(function ($query) use ($email, $phoneE164) {
                        if ($email) {
                            $query->where('email', $email);
                        }
                        if ($phoneE164) {
                            $query->orWhere('phone_e164', $phoneE164);
                        }
                    })
                    ->first();

                if (! $contact) {
                    $contact = new Contact();
                    $contact->workspace_id = $form->workspace_id;
                }

                if ($email) {
                    $contact->email = $email;
                }
                if ($phoneE164) {
                    $contact->phone_e164 = $phoneE164;
                }
                if ($firstName) {
                    $contact->first_name = $firstName;
                } elseif ($contact->first_name && filter_var($contact->first_name, FILTER_VALIDATE_EMAIL)) {
                    $contact->first_name = null; // Clean up existing bad data in database
                }
                if ($lastName) {
                    $contact->last_name = $lastName;
                }

                $contact->opt_in_email = true;
                if ($phoneE164) {
                    $contact->opt_in_whatsapp = true;
                }
                $contact->source = "Form: {$form->name}";
                $contact->custom_fields = array_merge($contact->custom_fields ?? [], $customVal);
                $contact->save();

                $submission->update(['contact_id' => $contact->id]);
                $form->increment('submissions_count');

                // Attach Auto-Tags
                $autoTags = $form->settings['auto_tags'] ?? [];
                if (! empty($autoTags)) {
                    foreach ($autoTags as $tagName) {
                        if (empty(trim($tagName))) {
                            continue;
                        }
                        $tag = ContactTag::firstOrCreate([
                            'workspace_id' => $form->workspace_id,
                            'name'         => trim($tagName),
                        ]);
                        $contact->tags()->syncWithoutDetaching([$tag->id]);
                    }
                }

                // Create EcommerceOrder if this is an Order Form
                if ($form->is_order_form || ! empty($data['selected_product_id']) || ! empty($data['selected_price_id'])) {
                    try {
                        $nativeStore = \App\Modules\Ecommerce\Models\EcommerceStore::getOrCreateNativeStore($form->workspace_id);
                        $lineItems = [];
                        $totalAmount = 0;

                        // 1. Main Selected Product
                        $selectedProductId = $data['selected_product_id'] ?? null;
                        $selectedPriceId = $data['selected_price_id'] ?? null;

                        if ($selectedProductId) {
                            $prod = \App\Modules\Ecommerce\Models\EcommerceProduct::where('id', $selectedProductId)->where('workspace_id', $form->workspace_id)->first();
                            if ($prod) {
                                $itemPrice = (float) $prod->price;
                                if ($selectedPriceId) {
                                    $priceTier = \App\Modules\Ecommerce\Models\EcommerceProductPrice::where('id', $selectedPriceId)->where('product_id', $prod->id)->first();
                                    if ($priceTier) {
                                        $itemPrice = (float) $priceTier->price;
                                    }
                                }
                                $lineItems[] = [
                                    'product_id' => $prod->id,
                                    'title'      => $prod->name . ($selectedPriceId && isset($priceTier) ? " ({$priceTier->name})" : ''),
                                    'sku'        => $prod->sku,
                                    'price'      => $itemPrice,
                                    'quantity'   => 1,
                                    'total'      => $itemPrice,
                                ];
                                $totalAmount += $itemPrice;
                            }
                        }

                        // 2. Order Bump
                        if (! empty($data['order_bump_checked']) && ! empty($form->order_bump_settings['enabled'])) {
                            $bumpPrice = (float) ($form->order_bump_settings['price'] ?? 0);
                            $bumpTitle = $form->order_bump_settings['title'] ?? 'Order Bump Add-on';
                            $lineItems[] = [
                                'product_id' => $form->order_bump_settings['product_id'] ?? null,
                                'title'      => $bumpTitle,
                                'sku'        => 'ORDER-BUMP',
                                'price'      => $bumpPrice,
                                'quantity'   => 1,
                                'total'      => $bumpPrice,
                            ];
                            $totalAmount += $bumpPrice;
                        }

                        // 3. Discount Coupon
                        $couponCode = $data['coupon_code'] ?? null;
                        if ($couponCode) {
                            $coupon = \App\Models\Coupon::where('workspace_id', $form->workspace_id)
                                ->where('code', strtoupper(trim($couponCode)))
                                ->where('is_active', true)
                                ->first();
                            if ($coupon) {
                                if ($coupon->type === 'percent') {
                                    $discount = round(($totalAmount * ($coupon->value / 100)), 2);
                                } else {
                                    $discount = min($totalAmount, (float) $coupon->value);
                                }
                                $totalAmount = max(0, $totalAmount - $discount);
                            }
                        }

                        if (! empty($lineItems)) {
                            \App\Modules\Ecommerce\Models\EcommerceOrder::create([
                                'workspace_id'       => $form->workspace_id,
                                'store_id'           => $nativeStore->id,
                                'contact_id'         => $contact->id,
                                'external_order_id'  => (string) \Illuminate\Support\Str::uuid(),
                                'platform'           => 'form_checkout',
                                'number'             => 'ORD-' . strtoupper(\Illuminate\Support\Str::random(6)),
                                'status'             => 'open',
                                'financial_status'   => 'paid',
                                'fulfillment_status' => 'unfulfilled',
                                'currency'           => $form->currency ?? 'USD',
                                'total'              => $totalAmount,
                                'line_items'         => $lineItems,
                                'placed_at'          => now(),
                                'raw'                => [
                                    'form_id'        => $form->id,
                                    'form_name'      => $form->name,
                                    'submission_id'  => $submission->id,
                                    'coupon_code'    => $couponCode,
                                ],
                            ]);
                        }
                    } catch (\Throwable $orderErr) {
                        Log::warning("Order creation from form failed: {$orderErr->getMessage()}");
                    }
                }

                return $contact;
            });
        } catch (\Throwable $e) {
            Log::error("Failed to process verified contact for form [{$form->id}]: " . $e->getMessage());
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['status' => 'error', 'message' => 'An error occurred while saving your subscription. Please try again.'], 500);
            }
            return back()->withErrors(['submission' => 'An error occurred while saving your subscription. Please try again.']);
        }

        // Dispatch Event for Marketing Automations Engine
        try {
            event(new SubscriptionFormSubmitted($form, $contact, $data));
        } catch (\Throwable $evErr) {
            Log::warning("SubscriptionFormSubmitted event dispatch error: {$evErr->getMessage()}");
        }

        $redirectUrl = $form->settings['redirect_url'] ?? null;
        $successMsg = $form->settings['success_message'] ?? 'Thank you for subscribing!';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'status'       => 'success',
                'message'      => $successMsg,
                'redirect_url' => $redirectUrl,
                'contact_uuid' => $contact->uuid,
            ]);
        }

        if ($redirectUrl) {
            return redirect()->away($redirectUrl);
        }

        return back()->with('success', $successMsg);
    }
}
