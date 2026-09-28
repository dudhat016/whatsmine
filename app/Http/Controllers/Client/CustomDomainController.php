<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\CustomDomain;
use App\Modules\Calendars\Models\BookingCalendar;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Modules\Funnels\Models\Funnel;
use App\Services\CustomDomainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomDomainController extends Controller
{
    public function __construct(private CustomDomainService $domainService) {}

    public function index(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
        $workspaceId = $workspace?->id ?? $user->id;

        $domains = CustomDomain::where('workspace_id', $workspaceId)
            ->latest()
            ->get()
            ->map(function ($domain) {
                return [
                    'id'                 => $domain->id,
                    'domain'             => $domain->domain,
                    'type'               => $domain->type,
                    'target_id'          => $domain->target_id,
                    'target_name'        => $domain->resolved_target_name,
                    'fallback_url'       => $domain->fallback_url,
                    'is_verified'        => $domain->is_verified,
                    'dns_status'         => $domain->dns_status,
                    'ssl_status'         => $domain->ssl_status,
                    'subdomain'          => $domain->subdomain,
                    'is_subdomain'       => $domain->isSubdomain(),
                    'expected_cname'     => $domain->getExpectedCnameTarget(),
                    'expected_ip'        => $domain->getExpectedIpTarget(),
                    'dns_records'        => $domain->dns_records,
                    'settings'           => $domain->settings ?? [],
                    'last_checked_at'    => $domain->last_checked_at?->diffForHumans(),
                    'created_at'         => $domain->created_at?->format('M d, Y'),
                ];
            });

        // Load linkable assets for mapping
        $funnels = Funnel::where('workspace_id', $workspaceId)->select('id', 'name', 'slug')->get();
        $stores = EcommerceStore::where('workspace_id', $workspaceId)->select('id', 'name', 'slug', 'domain')->get();
        $calendars = BookingCalendar::where('workspace_id', $workspaceId)->select('id', 'name', 'slug')->get();

        $cnameTarget = parse_url(config('app.url'), PHP_URL_HOST) ?? 'custom.whatsmine.com';
        $aRecordTarget = config('domains.a_record_target', '162.159.137.91');

        if ($request->wantsJson() && !$request->header('X-Inertia')) {
            return response()->json([
                'domains'        => $domains,
                'cname_target'   => $cnameTarget,
                'a_record_target'=> $aRecordTarget,
            ]);
        }

        return Inertia::render('Settings/Domains/Index', [
            'domains'         => $domains,
            'funnels'         => $funnels,
            'stores'          => $stores,
            'calendars'       => $calendars,
            'cnameTarget'     => $cnameTarget,
            'aRecordTarget'   => $aRecordTarget,
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();
        $workspaceId = $workspace?->id ?? $user->id;

        $validated = $request->validate([
            'domain'       => ['required', 'string', 'max:255'],
            'type'         => ['required', 'string', 'in:app_whitelabel,funnel,ecommerce,booking,universal'],
            'target_id'    => ['nullable', 'integer'],
            'fallback_url' => ['nullable', 'url', 'max:255'],
        ]);

        $normalized = $this->domainService->normalizeDomain($validated['domain']);

        // Check format
        if (!preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i', $normalized)) {
            return back()->withErrors(['domain' => 'Please enter a valid domain or subdomain name (e.g. app.mybrand.com or go.mybrand.com).']);
        }

        // Check uniqueness
        if (CustomDomain::where('domain', $normalized)->exists()) {
            return back()->withErrors(['domain' => "The domain '{$normalized}' is already registered in the system."]);
        }

        $customDomain = CustomDomain::create([
            'workspace_id'       => $workspaceId,
            'client_id'          => $user->client_id ?? null,
            'domain'             => $normalized,
            'type'               => $validated['type'],
            'target_id'          => $validated['target_id'] ?? null,
            'fallback_url'       => $validated['fallback_url'] ?? null,
            'verification_token' => 'wm_' . bin2hex(random_bytes(16)),
            'is_verified'        => false,
            'dns_status'         => 'pending',
            'ssl_status'         => 'pending',
            'settings'           => [
                'custom_head_scripts' => '',
                'custom_css'          => '',
            ],
        ]);

        // Attempt instant live DNS verification
        $result = $this->domainService->verifyDomain($customDomain);

        if ($request->wantsJson()) {
            return response()->json([
                'success'       => true,
                'custom_domain' => $customDomain->fresh(),
                'verification'  => $result,
            ]);
        }

        return redirect()->route('client.settings.domains.index')->with('success', "Custom domain '{$normalized}' added. Please configure your DNS records.");
    }

    public function verify(Request $request, CustomDomain $customDomain): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if ($customDomain->workspace_id !== ($workspace?->id ?? $user->id)) {
            abort(403, 'Unauthorized access to this domain.');
        }

        $result = $this->domainService->verifyDomain($customDomain);

        if ($request->wantsJson()) {
            return response()->json([
                'success'       => $result['success'],
                'custom_domain' => $customDomain->fresh(),
                'details'       => $result,
            ]);
        }

        if ($result['success']) {
            return back()->with('success', "Domain '{$customDomain->domain}' has been successfully verified!");
        }

        return back()->with('error', "DNS records for '{$customDomain->domain}' have not propagated yet. Please ensure your CNAME or A Record points to the specified target.");
    }

    public function update(Request $request, CustomDomain $customDomain): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if ($customDomain->workspace_id !== ($workspace?->id ?? $user->id)) {
            abort(403, 'Unauthorized access to this domain.');
        }

        $validated = $request->validate([
            'type'         => ['required', 'string', 'in:app_whitelabel,funnel,ecommerce,booking,universal'],
            'target_id'    => ['nullable', 'integer'],
            'fallback_url' => ['nullable', 'url', 'max:255'],
            'settings'     => ['nullable', 'array'],
        ]);

        $customDomain->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success'       => true,
                'custom_domain' => $customDomain->fresh(),
            ]);
        }

        return back()->with('success', 'Domain settings updated successfully.');
    }

    public function destroy(Request $request, CustomDomain $customDomain): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspaces()->first();

        if ($customDomain->workspace_id !== ($workspace?->id ?? $user->id)) {
            abort(403, 'Unauthorized access to this domain.');
        }

        $domainName = $customDomain->domain;
        $customDomain->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Domain '{$domainName}' removed.",
            ]);
        }

        return back()->with('success', "Domain '{$domainName}' removed successfully.");
    }
}
