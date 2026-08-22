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
    public function show(string $slug): View
    {
        $form = SubscriptionForm::where('slug', $slug)->where('is_active', true)->firstOrFail();

        return view('subscribe', [
            'form' => $form,
        ]);
    }

    /** Handle public web form submission */
    public function subscribe(string $slug, Request $request)
    {
        $form = SubscriptionForm::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $rules = [
            'email'      => ['required', 'email', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:128'],
            'last_name'  => ['nullable', 'string', 'max:128'],
            'phone_e164' => ['nullable', 'string', 'max:32'],
        ];

        // Add dynamic rules for custom fields
        $customFieldConfigs = $form->settings['custom_fields'] ?? [];
        foreach ($customFieldConfigs as $cf) {
            $key = 'custom_fields.' . ($cf['key'] ?? '');
            if (!empty($cf['required'])) {
                $rules[$key] = ['required'];
            }
        }

        if ($form->gdpr_checkbox) {
            $rules['gdpr_consent'] = ['required', 'accepted'];
        }

        $validated = $request->validate($rules);

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
        $phoneE164 = $data['phone_e164'] ?? null;
        $firstName = $data['first_name'] ?? null;
        $lastName  = $data['last_name'] ?? null;
        $customVal = $data['custom_fields'] ?? [];

        // Upsert Contact in WhatsMine CRM
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

        // Dispatch Event for Marketing Automations Engine
        event(new SubscriptionFormSubmitted($form, $contact, $data));

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
