<?php

namespace App\Modules\Funnels\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\SubscriptionForm;
use App\Modules\Funnels\Models\SubscriptionFormFolder;
use App\Modules\Funnels\Models\SubscriptionFormSubmission;
use App\Modules\Funnels\Models\SubscriptionFormView;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubscriptionFormController extends Controller
{
    public function index(Request $request): Response
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        $activeTab = $request->query('tab', 'forms');
        $folderId = $request->query('folder_id');
        $searchQuery = $request->query('search', '');
        $selectedFormId = $request->query('form_id');

        // 1. Folders List for Current Workspace
        $folders = SubscriptionFormFolder::where('workspace_id', $workspaceId)
            ->withCount('forms')
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        // 2. Active Folder Object (if inside a folder)
        $activeFolder = null;
        if (! empty($folderId)) {
            $activeFolder = SubscriptionFormFolder::where('workspace_id', $workspaceId)
                ->where('id', $folderId)
                ->first();
        }

        // 3. Forms Query
        $formsQuery = SubscriptionForm::where('workspace_id', $workspaceId)
            ->with('folder')
            ->withCount(['submissions', 'views']);

        if (! empty($folderId)) {
            $formsQuery->where('folder_id', $folderId);
        }

        if (! empty($searchQuery)) {
            $formsQuery->where(function ($q) use ($searchQuery) {
                $q->where('name', 'like', "%{$searchQuery}%")
                    ->orWhere('title', 'like', "%{$searchQuery}%")
                    ->orWhere('description', 'like', "%{$searchQuery}%");
            });
        }

        $forms = $formsQuery->latest()->get();

        // Count of all forms without folder
        $rootFormsCount = SubscriptionForm::where('workspace_id', $workspaceId)->whereNull('folder_id')->count();

        // 4. Submissions Tab Data
        $submissions = null;
        if ($activeTab === 'submissions' || $request->wantsJson()) {
            $subQuery = SubscriptionFormSubmission::where('workspace_id', $workspaceId)
                ->with(['form', 'contact']);

            if (! empty($selectedFormId)) {
                $subQuery->where('form_id', $selectedFormId);
            }

            if (! empty($searchQuery)) {
                $subQuery->where(function ($q) use ($searchQuery) {
                    $q->where('ip_address', 'like', "%{$searchQuery}%")
                        ->orWhereHas('contact', function ($cq) use ($searchQuery) {
                            $cq->where('first_name', 'like', "%{$searchQuery}%")
                                ->orWhere('last_name', 'like', "%{$searchQuery}%")
                                ->orWhere('email', 'like', "%{$searchQuery}%")
                                ->orWhere('phone_e164', 'like', "%{$searchQuery}%");
                        });
                });
            }

            $submissions = $subQuery->latest()->paginate(25)->withQueryString();
        }

        // 5. Analytics Tab Data
        $analytics = null;
        if ($activeTab === 'analytics') {
            $thirtyDaysAgo = Carbon::now()->subDays(29)->startOfDay();

            $totalViews = SubscriptionFormView::where('workspace_id', $workspaceId)->count();
            $totalSubmissions = SubscriptionFormSubmission::where('workspace_id', $workspaceId)->count();
            $verifiedSubmissions = SubscriptionFormSubmission::where('workspace_id', $workspaceId)->where('is_verified', true)->count();
            $conversionRate = $totalViews > 0 ? round(($totalSubmissions / $totalViews) * 100, 1) : 0;
            $otpVerifiedRate = $totalSubmissions > 0 ? round(($verifiedSubmissions / $totalSubmissions) * 100, 1) : 0;

            // Daily trend series for the last 30 days
            $dailyViews = SubscriptionFormView::where('workspace_id', $workspaceId)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupBy('date')
                ->pluck('count', 'date')
                ->toArray();

            $dailySubmissions = SubscriptionFormSubmission::where('workspace_id', $workspaceId)
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupBy('date')
                ->pluck('count', 'date')
                ->toArray();

            $dailySeries = [];
            for ($i = 29; $i >= 0; $i--) {
                $d = Carbon::now()->subDays($i)->format('Y-m-d');
                $dailySeries[] = [
                    'date'        => $d,
                    'label'       => Carbon::parse($d)->format('M d'),
                    'views'       => (int) ($dailyViews[$d] ?? 0),
                    'submissions' => (int) ($dailySubmissions[$d] ?? 0),
                ];
            }

            // Top Traffic Sources / UTM Breakdown
            $trafficSources = SubscriptionFormView::where('workspace_id', $workspaceId)
                ->whereNotNull('utm_source')
                ->selectRaw('utm_source, utm_medium, utm_campaign, COUNT(*) as views_count')
                ->groupBy('utm_source', 'utm_medium', 'utm_campaign')
                ->orderByDesc('views_count')
                ->limit(10)
                ->get();

            // Device Breakdown
            $deviceBreakdown = SubscriptionFormView::where('workspace_id', $workspaceId)
                ->selectRaw('COALESCE(device_type, "desktop") as device, COUNT(*) as count')
                ->groupBy('device')
                ->pluck('count', 'device')
                ->toArray();

            $analytics = [
                'total_views'          => $totalViews,
                'total_submissions'    => $totalSubmissions,
                'verified_submissions' => $verifiedSubmissions,
                'conversion_rate'      => $conversionRate,
                'otp_verified_rate'    => $otpVerifiedRate,
                'daily_series'         => $dailySeries,
                'traffic_sources'      => $trafficSources,
                'device_breakdown'     => [
                    'desktop' => (int) ($deviceBreakdown['desktop'] ?? 0),
                    'mobile'  => (int) ($deviceBreakdown['mobile'] ?? 0),
                ],
            ];
        }

        // All forms list for dropdown filtering in Submissions and Analytics
        $allWorkspaceForms = SubscriptionForm::where('workspace_id', $workspaceId)
            ->select('id', 'name', 'slug', 'is_active')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Forms/Index', [
            'activeTab'         => $activeTab,
            'folders'           => $folders,
            'activeFolder'      => $activeFolder,
            'forms'             => $forms,
            'rootFormsCount'    => $rootFormsCount,
            'submissions'       => $submissions,
            'analytics'         => $analytics,
            'allWorkspaceForms' => $allWorkspaceForms,
            'filters'           => [
                'search'    => $searchQuery,
                'folder_id' => $folderId,
                'form_id'   => $selectedFormId,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
        \App\Http\Controllers\Client\CustomFieldController::ensureWorkspaceFolders($workspaceId);

        $globalCustomFields = \App\Modules\Shared\Models\CustomField::where('workspace_id', $workspaceId)->where('is_active', true)->get();
        $availableFolders = \App\Modules\Shared\Models\CustomFieldFolder::where('workspace_id', $workspaceId)->orderBy('sort_order', 'asc')->get();
        $formFolders = SubscriptionFormFolder::where('workspace_id', $workspaceId)->orderBy('name', 'asc')->get();
        $ecommerceProducts = \App\Modules\Ecommerce\Models\EcommerceProduct::where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->with('prices')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Forms/Create', [
            'globalCustomFields' => $globalCustomFields,
            'availableFolders'   => $availableFolders,
            'formFolders'        => $formFolders,
            'ecommerceProducts'  => $ecommerceProducts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;

        $validated = $request->validate([
            'name'                 => ['required', 'string', 'max:255'],
            'folder_id'            => ['nullable', 'exists:subscription_form_folders,id'],
            'title'                => ['nullable', 'string', 'max:255'],
            'description'          => ['nullable', 'string', 'max:1000'],
            'type'                 => ['required', 'in:embedded,popup,api'],
            'fields'               => ['nullable', 'array'],
            'settings'             => ['nullable', 'array'],
            'double_optin_enabled' => ['required', 'boolean'],
            'optin_channel'        => ['required', 'in:whatsapp,email,sms'],
            'gdpr_checkbox'        => ['required', 'boolean'],
            'gdpr_text'            => ['nullable', 'string', 'max:500'],
            'is_order_form'        => ['sometimes', 'boolean'],
            'order_form_type'      => ['nullable', 'string', 'in:1_step,2_step'],
            'currency'             => ['nullable', 'string', 'max:10'],
            'order_bump_settings'  => ['nullable', 'array'],
            'coupon_enabled'       => ['sometimes', 'boolean'],
            'form_products'        => ['nullable', 'array'],
        ]);

        $hasIdentifier = false;
        $formFields = $validated['fields'] ?? [];
        $builderFields = $validated['settings']['builder_fields'] ?? [];

        foreach ($formFields as $f) {
            if (in_array($f, ['email', 'phone_e164', 'whatsapp', 'tel'])) {
                $hasIdentifier = true;
                break;
            }
        }
        if (! $hasIdentifier && is_array($builderFields)) {
            foreach ($builderFields as $bf) {
                if (in_array($bf['type'] ?? '', ['email', 'phone_e164', 'whatsapp', 'tel']) || in_array($bf['key'] ?? '', ['email', 'phone_e164', 'whatsapp', 'tel'])) {
                    $hasIdentifier = true;
                    break;
                }
            }
        }

        if (! $hasIdentifier) {
            return back()->withErrors([
                'primary_identifier' => 'A form must contain at least an Email Address or WhatsApp Phone number to identify contacts.',
            ]);
        }

        $form = SubscriptionForm::create(array_merge($validated, [
            'workspace_id' => $workspaceId,
        ]));

        if ($request->has('form_products') && is_array($request->input('form_products'))) {
            foreach ($request->input('form_products') as $idx => $fp) {
                if (! empty($fp['product_id'])) {
                    $form->formProducts()->create([
                        'workspace_id'     => $workspaceId,
                        'product_id'       => $fp['product_id'],
                        'product_price_id' => $fp['product_price_id'] ?? null,
                        'is_default'       => ! empty($fp['is_default']),
                        'sort_order'       => $idx,
                    ]);
                }
            }
        }

        return redirect()->route('client.forms.show', $form->id)
            ->with('success', 'Subscription form created successfully.');
    }

    public function show(Request $request, SubscriptionForm $form): Response
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        abort_unless($form->workspace_id === $workspaceId, 403);

        $form->load(['folder', 'formProducts.product.prices', 'formProducts.price', 'submissions' => function ($query) {
            $query->with('contact')->latest()->take(50);
        }]);

        return Inertia::render('Forms/Show', [
            'form'   => $form,
            'appUrl' => config('app.url'),
        ]);
    }

    public function edit(Request $request, SubscriptionForm $form): Response
    {
        $workspaceId = (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
        abort_unless($form->workspace_id === $workspaceId, 403);

        \App\Http\Controllers\Client\CustomFieldController::ensureWorkspaceFolders($workspaceId);

        $form->load(['formProducts.product.prices', 'formProducts.price']);

        $globalCustomFields = \App\Modules\Shared\Models\CustomField::where('workspace_id', $workspaceId)->where('is_active', true)->get();
        $availableFolders = \App\Modules\Shared\Models\CustomFieldFolder::where('workspace_id', $workspaceId)->orderBy('sort_order', 'asc')->get();
        $formFolders = SubscriptionFormFolder::where('workspace_id', $workspaceId)->orderBy('name', 'asc')->get();
        $ecommerceProducts = \App\Modules\Ecommerce\Models\EcommerceProduct::where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->with('prices')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Forms/Edit', [
            'form'               => $form,
            'globalCustomFields' => $globalCustomFields,
            'availableFolders'   => $availableFolders,
            'formFolders'        => $formFolders,
            'ecommerceProducts'  => $ecommerceProducts,
        ]);
    }

    public function update(Request $request, SubscriptionForm $form): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        abort_unless($form->workspace_id === $workspaceId, 403);

        $validated = $request->validate([
            'name'                 => ['required', 'string', 'max:255'],
            'folder_id'            => ['nullable', 'exists:subscription_form_folders,id'],
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
            'is_order_form'        => ['sometimes', 'boolean'],
            'order_form_type'      => ['nullable', 'string', 'in:1_step,2_step'],
            'currency'             => ['nullable', 'string', 'max:10'],
            'order_bump_settings'  => ['nullable', 'array'],
            'coupon_enabled'       => ['sometimes', 'boolean'],
            'form_products'        => ['nullable', 'array'],
        ]);

        $hasIdentifier = false;
        $formFields = $validated['fields'] ?? [];
        $builderFields = $validated['settings']['builder_fields'] ?? [];

        foreach ($formFields as $f) {
            if (in_array($f, ['email', 'phone_e164', 'whatsapp', 'tel'])) {
                $hasIdentifier = true;
                break;
            }
        }
        if (! $hasIdentifier && is_array($builderFields)) {
            foreach ($builderFields as $bf) {
                if (in_array($bf['type'] ?? '', ['email', 'phone_e164', 'whatsapp', 'tel']) || in_array($bf['key'] ?? '', ['email', 'phone_e164', 'whatsapp', 'tel'])) {
                    $hasIdentifier = true;
                    break;
                }
            }
        }

        if (! $hasIdentifier) {
            return back()->withErrors([
                'primary_identifier' => 'A form must contain at least an Email Address or WhatsApp Phone number to identify contacts.',
            ]);
        }

        $form->update($validated);

        if ($request->has('form_products') && is_array($request->input('form_products'))) {
            $form->formProducts()->delete();
            foreach ($request->input('form_products') as $idx => $fp) {
                if (! empty($fp['product_id'])) {
                    $form->formProducts()->create([
                        'workspace_id'     => $workspaceId,
                        'product_id'       => $fp['product_id'],
                        'product_price_id' => $fp['product_price_id'] ?? null,
                        'is_default'       => ! empty($fp['is_default']),
                        'sort_order'       => $idx,
                    ]);
                }
            }
        }

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

    /** Duplicate a form */
    public function duplicate(Request $request, SubscriptionForm $form): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        abort_unless($form->workspace_id === $workspaceId, 403);

        $cloned = $form->replicate([
            'slug',
            'submissions_count',
            'created_at',
            'updated_at',
        ]);
        $cloned->name = $form->name . ' (Copy)';
        $cloned->slug = Str::slug($cloned->name) . '-' . Str::lower(Str::random(6));
        $cloned->save();

        return back()->with('success', "Form '{$form->name}' duplicated successfully.");
    }

    /** Store a new Form Folder */
    public function storeFolder(Request $request): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:128'],
            'color' => ['nullable', 'string', 'max:32'],
        ]);

        SubscriptionFormFolder::create([
            'workspace_id' => $workspaceId,
            'name'         => $validated['name'],
            'color'        => $validated['color'] ?? '#16a34a',
            'sort_order'   => SubscriptionFormFolder::where('workspace_id', $workspaceId)->count() + 1,
        ]);

        return back()->with('success', "Folder '{$validated['name']}' created.");
    }

    /** Update an existing Form Folder */
    public function updateFolder(Request $request, $id): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        $folder = SubscriptionFormFolder::where('workspace_id', $workspaceId)->findOrFail($id);

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:128'],
            'color' => ['nullable', 'string', 'max:32'],
        ]);

        $folder->update($validated);

        return back()->with('success', "Folder updated successfully.");
    }

    /** Destroy a Form Folder */
    public function destroyFolder(Request $request, $id): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        $folder = SubscriptionFormFolder::where('workspace_id', $workspaceId)->findOrFail($id);

        // Move forms inside this folder to root
        SubscriptionForm::where('folder_id', $folder->id)->update(['folder_id' => null]);

        $folder->delete();

        return redirect()->route('client.forms.index')
            ->with('success', "Folder '{$folder->name}' deleted.");
    }

    /** Move forms to a folder or root */
    public function moveToFolder(Request $request): RedirectResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;

        $validated = $request->validate([
            'form_ids'  => ['required', 'array'],
            'form_ids.*'=> ['required', 'exists:subscription_forms,id'],
            'folder_id' => ['nullable', 'exists:subscription_form_folders,id'],
        ]);

        SubscriptionForm::where('workspace_id', $workspaceId)
            ->whereIn('id', $validated['form_ids'])
            ->update(['folder_id' => $validated['folder_id']]);

        return back()->with('success', "Forms moved successfully.");
    }

    /** Export Submissions to CSV */
    public function exportSubmissions(Request $request): StreamedResponse
    {
        $workspaceId = $request->user()->current_workspace_id ?? $request->user()->workspace_id;
        $selectedFormId = $request->query('form_id');

        $query = SubscriptionFormSubmission::where('workspace_id', $workspaceId)
            ->with(['form', 'contact']);

        if (! empty($selectedFormId)) {
            $query->where('form_id', $selectedFormId);
        }

        $submissions = $query->latest()->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="form_submissions_' . date('Y-m-d_H-i') . '.csv"',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        return response()->stream(function () use ($submissions) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'ID',
                'Form Name',
                'Submitted Date',
                'Contact Name',
                'Email',
                'Phone',
                'OTP Status',
                'IP Address',
                'Referrer URL',
                'Submitted Data (JSON)',
            ]);

            foreach ($submissions as $sub) {
                $contactName = $sub->contact ? ($sub->contact->first_name . ' ' . $sub->contact->last_name) : 'N/A';
                $email = $sub->submitted_data['email'] ?? ($sub->contact->email ?? 'N/A');
                $phone = $sub->submitted_data['phone_e164'] ?? ($sub->contact->phone_e164 ?? 'N/A');

                fputcsv($handle, [
                    $sub->id,
                    $sub->form->name ?? 'Deleted Form',
                    $sub->created_at ? $sub->created_at->toDateTimeString() : '',
                    trim($contactName),
                    $email,
                    $phone,
                    $sub->is_verified ? 'Verified' : 'Pending OTP',
                    $sub->ip_address,
                    $sub->referrer_url,
                    json_encode($sub->submitted_data),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
