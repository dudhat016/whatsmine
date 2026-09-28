<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\LandingPageController;
use App\Models\Plan;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    private function landingDisabledRedirect(): ?RedirectResponse
    {
        if (SystemSetting::get('landing.page_enabled', '1') === '1' || ! Route::has('login')) {
            return null;
        }

        return redirect()->route('login');
    }

    private function plans(): array
    {
        try {
            return Plan::where('enabled', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn ($p) => [
                    'id'            => $p->id,
                    'name'          => $p->name,
                    'description'   => $p->description ?? '',
                    'price_monthly' => round(($p->monthly_price_cents ?? 0) / 100, 2),
                    'price_yearly'  => round(($p->yearly_price_cents ?? 0) / 100, 2),
                    'features'      => is_array($p->features) ? $p->features : [],
                    'is_featured'   => (bool) ($p->featured ?? $p->popular ?? false),
                    'trial_days'    => $p->trial_days ?? 0,
                ])
                ->values()
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    public function index(): mixed
    {
        $customDomain = request()->attributes->get('custom_domain');
        if ($customDomain && $customDomain->is_verified) {
            // 1. Whitelabel agency app portal -> redirect to login
            if ($customDomain->type === 'app_whitelabel') {
                return redirect()->route('login');
            }

            // 2. Sales Funnel -> Render funnel root step
            if ($customDomain->type === 'funnel' && $customDomain->target_id) {
                $funnel = \App\Modules\Funnels\Models\Funnel::find($customDomain->target_id);
                if ($funnel) {
                    return app(\App\Modules\Funnels\Http\Controllers\FunnelRenderController::class)
                        ->show(request(), (string)$funnel->workspace_id, $funnel->slug);
                }
            }

            // 3. E-Commerce Storefront -> Render store
            if ($customDomain->type === 'ecommerce' && $customDomain->target_id) {
                $store = \App\Modules\Ecommerce\Models\EcommerceStore::find($customDomain->target_id);
                if ($store && $store->slug) {
                    return app(\App\Modules\Ecommerce\Http\Controllers\PublicStorefrontController::class)
                        ->index(request(), $store->slug);
                }
            }

            // 4. Booking Calendar -> Render calendar
            if ($customDomain->type === 'booking' && $customDomain->target_id) {
                $calendar = \App\Modules\Calendars\Models\BookingCalendar::find($customDomain->target_id);
                if ($calendar && $calendar->slug && class_exists(\App\Modules\Calendars\Http\Controllers\PublicBookingController::class)) {
                    return app(\App\Modules\Calendars\Http\Controllers\PublicBookingController::class)
                        ->show(request(), $calendar->slug);
                }
            }

            // 5. Fallback URL redirect if configured
            if (!empty($customDomain->fallback_url)) {
                return redirect()->away($customDomain->fallback_url);
            }
        }

        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('Welcome', [
            'canLogin'    => Route::has('login'),
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
            'plans'       => $this->plans(),
        ]);
    }

    public function pricing(): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('marketing/Pricing', [
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
            'plans'       => $this->plans(),
        ]);
    }

    public function faq(): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('marketing/Faq', [
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
        ]);
    }

    public function useCases(): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('marketing/UseCases', [
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
        ]);
    }

    public function about(): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('marketing/About', [
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
        ]);
    }

    public function integrations(): Response|RedirectResponse
    {
        if ($redirect = $this->landingDisabledRedirect()) {
            return $redirect;
        }

        return Inertia::render('marketing/Integrations', [
            'canRegister' => Route::has('register'),
            'landing'     => LandingPageController::getPublicSettings(),
        ]);
    }
}
