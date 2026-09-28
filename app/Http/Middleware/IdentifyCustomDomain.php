<?php

namespace App\Http\Middleware;

use App\Models\CustomDomain;
use App\Services\CustomDomainService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class IdentifyCustomDomain
{
    public function __construct(private CustomDomainService $domainService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();
        $appHost = parse_url(config('app.url'), PHP_URL_HOST);

        // If visiting on standard app domain or localhost without custom host, continue normally
        if ($host === $appHost || $host === 'localhost' || $host === '127.0.0.1') {
            return $next($request);
        }

        $customDomain = $this->domainService->resolveByHost($host);

        if (!$customDomain) {
            // Domain points to server but is unverified or unregistered
            return $next($request);
        }

        // Attach custom domain model to request attributes
        $request->attributes->set('custom_domain', $customDomain);
        $request->attributes->set('workspace_id', $customDomain->workspace_id);

        // Share dynamic Whitelabel branding with Inertia
        $client = $customDomain->client;
        $branding = $client?->branding ?? [];

        Inertia::share([
            'whitelabel' => [
                'is_whitelabel'      => true,
                'domain'             => $customDomain->domain,
                'type'               => $customDomain->type,
                'app_name'           => $branding['app_name'] ?? $client?->name ?? config('app.name'),
                'logo_url'           => $branding['logo_url'] ?? null,
                'dark_logo_url'      => $branding['dark_logo_url'] ?? null,
                'favicon_url'        => $branding['favicon_url'] ?? null,
                'primary_color'      => $branding['primary_color'] ?? '#10b981',
                'support_email'      => $branding['support_email'] ?? null,
                'support_whatsapp'   => $branding['support_whatsapp'] ?? null,
                'custom_css'         => $branding['custom_css'] ?? null,
                'footer_text'        => $branding['footer_text'] ?? null,
            ],
        ]);

        return $next($request);
    }
}
