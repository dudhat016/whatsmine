<?php

namespace App\Modules\Agency\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Agency\Models\AgencyOnboardingResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingFormController extends Controller
{
    /**
     * Public Onboarding Questionnaire page for client to upload assets.
     */
    public function showPublic(string $uuid): Response
    {
        $response = AgencyOnboardingResponse::with(['contact', 'invoice'])
            ->where('uuid', $uuid)
            ->firstOrFail();

        return Inertia::render('Agency/Onboarding/FormView', [
            'onboarding' => [
                'id' => $response->id,
                'uuid' => $response->uuid,
                'status' => $response->status,
                'completed_at' => $response->completed_at?->toIso8601String(),
                'form_data' => $response->form_data ?? [],
                'files' => $response->files ?? [],
                'contact' => $response->contact ? [
                    'name' => trim("{$response->contact->first_name} {$response->contact->last_name}"),
                    'email' => $response->contact->email,
                ] : null,
                'invoice' => $response->invoice ? [
                    'invoice_number' => $response->invoice->invoice_number,
                    'total' => (float) $response->invoice->total,
                ] : null,
            ],
        ]);
    }

    public function submit(Request $request, string $uuid)
    {
        $response = AgencyOnboardingResponse::where('uuid', $uuid)->firstOrFail();

        $data = $request->validate([
            'brand_name' => 'required|string|max:255',
            'website' => 'nullable|string|max:255',
            'target_audience' => 'nullable|string',
            'brand_color' => 'nullable|string|max:50',
            'logo_url' => 'nullable|string|max:1024',
            'brief_url' => 'nullable|string|max:1024',
            'notes' => 'nullable|string',
        ]);

        $response->update([
            'form_data' => $data,
            'files' => array_filter([$data['logo_url'] ?? null, $data['brief_url'] ?? null]),
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Thank you! Your onboarding information and assets have been submitted successfully.');
    }
}
