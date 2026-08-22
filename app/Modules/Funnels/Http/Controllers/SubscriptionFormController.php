<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\SubscriptionForm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionFormController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        $forms = SubscriptionForm::where('workspace_id', $workspaceId)
            ->withCount('submissions')
            ->latest()
            ->get();

        return Inertia::render('Forms/Index', [
            'forms' => $forms,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Forms/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;

        $validated = $request->validate([
            'name'                 => ['required', 'string', 'max:255'],
            'title'                => ['nullable', 'string', 'max:255'],
            'description'          => ['nullable', 'string', 'max:1000'],
            'type'                 => ['required', 'in:embedded,popup,api'],
            'fields'               => ['nullable', 'array'],
            'settings'             => ['nullable', 'array'],
            'double_optin_enabled' => ['required', 'boolean'],
            'optin_channel'        => ['required', 'in:whatsapp,email,sms'],
            'gdpr_checkbox'        => ['required', 'boolean'],
            'gdpr_text'            => ['nullable', 'string', 'max:500'],
        ]);

        $form = SubscriptionForm::create(array_merge($validated, [
            'workspace_id' => $workspaceId,
        ]));

        return redirect()->route('client.forms.show', $form->id)
            ->with('success', 'Subscription form created successfully.');
    }

    public function show(Request $request, SubscriptionForm $form): Response
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        abort_unless($form->workspace_id === $workspaceId, 403);

        $form->load(['submissions' => function ($query) {
            $query->with('contact')->latest()->take(50);
        }]);

        return Inertia::render('Forms/Show', [
            'form' => $form,
            'appUrl' => config('app.url'),
        ]);
    }

    public function edit(Request $request, SubscriptionForm $form): Response
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        abort_unless($form->workspace_id === $workspaceId, 403);

        return Inertia::render('Forms/Edit', [
            'form' => $form,
        ]);
    }

    public function update(Request $request, SubscriptionForm $form): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        abort_unless($form->workspace_id === $workspaceId, 403);

        $validated = $request->validate([
            'name'                 => ['required', 'string', 'max:255'],
            'title'                => ['nullable', 'string', 'max:255'],
            'description'          => ['nullable', 'string', 'max:1000'],
            'type'                 => ['required', 'in:embedded,popup,api'],
            'fields'               => ['nullable', 'array'],
            'settings'             => ['nullable', 'array'],
            'double_optin_enabled' => ['required', 'boolean'],
            'optin_channel'        => ['required', 'in:whatsapp,email,sms'],
            'gdpr_checkbox'        => ['required', 'boolean'],
            'gdpr_text'            => ['nullable', 'string', 'max:500'],
            'is_active'            => ['sometimes', 'boolean'],
        ]);

        $form->update($validated);

        return back()->with('success', 'Subscription form updated successfully.');
    }

    public function destroy(Request $request, SubscriptionForm $form): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        abort_unless($form->workspace_id === $workspaceId, 403);

        $form->delete();

        return redirect()->route('client.forms.index')
            ->with('success', 'Subscription form deleted.');
    }
}
