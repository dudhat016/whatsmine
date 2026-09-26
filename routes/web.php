<?php

use App\Http\Controllers\CmsPageController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\I18nController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\WebhookController;
use App\Models\CmsPage;
use App\Modules\Funnels\Http\Controllers\FunnelRenderController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Public Funnel Pages & Actions ──────────────────────────────────────────
// Format: /f/{workspace_slug}/{funnel_slug}
Route::get('/f/{workspaceSlug}/{funnelSlug}', [FunnelRenderController::class, 'show'])
    ->name('funnel.public')
    ->middleware('throttle:120,1');

Route::post('/f/{workspaceSlug}/{funnelSlug}/step-1-lead', [FunnelRenderController::class, 'captureStep1Lead'])
    ->name('funnel.public.step1_lead')
    ->middleware('throttle:60,1');

Route::post('/f/{workspaceSlug}/{funnelSlug}/optin', [FunnelRenderController::class, 'submitOptin'])
    ->name('funnel.public.optin')
    ->middleware('throttle:60,1');

Route::post('/f/{workspaceSlug}/{funnelSlug}/checkout', [FunnelRenderController::class, 'processCheckout'])
    ->name('funnel.public.checkout')
    ->middleware('throttle:60,1');

Route::post('/f/{workspaceSlug}/{funnelSlug}/upsell-action', [FunnelRenderController::class, 'processUpsellAction'])
    ->name('funnel.public.upsell_action')
    ->middleware('throttle:60,1');

Route::get('/f/{workspaceSlug}/{funnelSlug}/{stepSlug}', [FunnelRenderController::class, 'show'])
    ->name('funnel.public.step')
    ->middleware('throttle:120,1');

use App\Modules\Funnels\Http\Controllers\FunnelShareController;

// Funnel Share Preview & 1-Click Import (public / authenticated)
Route::get('/funnels/share/{shareToken}', [FunnelShareController::class, 'sharePreview'])
    ->name('funnels.share.preview');

Route::post('/funnels/share/{shareToken}/import', [FunnelShareController::class, 'import'])
    ->name('funnels.share.import');



// ─── Public Storefront Routes (Fixed Prefixes) ─────────────────────────────────
use App\Modules\Ecommerce\Http\Controllers\PublicStorefrontController;

// Backward Compatible Legacy /s/ and /p/ Fallback Routes
Route::get('/s/{slug}', [PublicStorefrontController::class, 'index'])->name('public.storefront.legacy.index');
Route::get('/s/{slug}/p/{productSlug}', [PublicStorefrontController::class, 'show'])->name('public.storefront.legacy.show');
Route::post('/s/{slug}/checkout', [PublicStorefrontController::class, 'checkout'])->name('public.storefront.legacy.checkout');

Route::get('/d/{token}', [PublicStorefrontController::class, 'digitalVault'])->name('public.storefront.vault');
Route::get('/d/{token}/download', [PublicStorefrontController::class, 'downloadDigitalFile'])->name('public.storefront.download');

// Home / Landing
Route::get('/', [LandingController::class, 'index'])->name('home');

// ─── Public Subscription Forms (No Auth / iFrame / Standalone) ────────────────
use App\Modules\Funnels\Http\Controllers\PublicSubscriptionController;
use App\Modules\Funnels\Http\Controllers\SubscriptionFormController;

Route::get('/subscribe/{slug}', [PublicSubscriptionController::class, 'show'])->name('public.subscribe.show');
Route::post('/subscribe/{slug}', [PublicSubscriptionController::class, 'subscribe'])->name('public.subscribe.submit');
Route::post('/subscribe/{slug}/verify-otp', [PublicSubscriptionController::class, 'verifyOtp'])->name('public.subscribe.verify_otp');

// ─── Client App: Standalone Subscription Forms CRUD ────────────────────────────
Route::middleware(['web', 'client-app'])->prefix('app/forms')->name('client.forms.')->group(function () {
    Route::get('/', [SubscriptionFormController::class, 'index'])->name('index');
    Route::get('/create', [SubscriptionFormController::class, 'create'])->name('create');
    Route::post('/', [SubscriptionFormController::class, 'store'])->name('store');
    Route::get('/submissions/export', [SubscriptionFormController::class, 'exportSubmissions'])->name('submissions.export');
    Route::post('/folders', [SubscriptionFormController::class, 'storeFolder'])->name('folders.store');
    Route::put('/folders/{id}', [SubscriptionFormController::class, 'updateFolder'])->name('folders.update');
    Route::delete('/folders/{id}', [SubscriptionFormController::class, 'destroyFolder'])->name('folders.destroy');
    Route::post('/move-to-folder', [SubscriptionFormController::class, 'moveToFolder'])->name('move_to_folder');
    Route::get('/{form}', [SubscriptionFormController::class, 'show'])->name('show');
    Route::get('/{form}/edit', [SubscriptionFormController::class, 'edit'])->name('edit');
    Route::put('/{form}', [SubscriptionFormController::class, 'update'])->name('update');
    Route::delete('/{form}', [SubscriptionFormController::class, 'destroy'])->name('destroy');
    Route::post('/{form}/duplicate', [SubscriptionFormController::class, 'duplicate'])->name('duplicate');
});

// ─── Client App: Global Custom Fields Management ───────────────────────────────
Route::middleware(['web', 'client-app'])->prefix('app/custom-fields')->name('client.custom_fields.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Client\CustomFieldController::class, 'index'])->name('index');
    Route::post('/', [\App\Http\Controllers\Client\CustomFieldController::class, 'store'])->name('store');
    Route::put('/{customField}', [\App\Http\Controllers\Client\CustomFieldController::class, 'update'])->name('update');
    Route::get('/{customField}/check-dependencies', [\App\Http\Controllers\Client\CustomFieldController::class, 'checkDependencies'])->name('check_dependencies');
    Route::delete('/{customField}', [\App\Http\Controllers\Client\CustomFieldController::class, 'destroy'])->name('destroy');
    Route::post('/{id}/restore', [\App\Http\Controllers\Client\CustomFieldController::class, 'restore'])->name('restore');
    Route::delete('/{id}/force', [\App\Http\Controllers\Client\CustomFieldController::class, 'forceDelete'])->name('force_delete');

    // Custom Field Folders
    Route::post('/folders', [\App\Http\Controllers\Client\CustomFieldController::class, 'storeFolder'])->name('folders.store');
    Route::put('/folders/{id}', [\App\Http\Controllers\Client\CustomFieldController::class, 'updateFolder'])->name('folders.update');
    Route::delete('/folders/{id}', [\App\Http\Controllers\Client\CustomFieldController::class, 'destroyFolder'])->name('folders.destroy');
    Route::post('/folders/reorder', [\App\Http\Controllers\Client\CustomFieldController::class, 'reorderFolders'])->name('folders.reorder');
});

// ─── Client App: Global Custom Values Management ───────────────────────────────
Route::middleware(['web', 'client-app'])->prefix('app/custom-values')->name('client.custom_values.')->group(function () {
    Route::get('/list', [\App\Http\Controllers\Client\CustomValueController::class, 'list'])->name('list');
    Route::get('/{customValue}/check-dependencies', [\App\Http\Controllers\Client\CustomValueController::class, 'checkDependencies'])->name('check_dependencies');
    Route::post('/', [\App\Http\Controllers\Client\CustomValueController::class, 'store'])->name('store');
    Route::put('/{customValue}', [\App\Http\Controllers\Client\CustomValueController::class, 'update'])->name('update');
    Route::delete('/{customValue}', [\App\Http\Controllers\Client\CustomValueController::class, 'destroy'])->name('destroy');
});

// ─── Client App: Global Trigger Links Management ───────────────────────────────
Route::middleware(['web', 'client-app'])->prefix('app/trigger-links')->name('client.trigger_links.')->group(function () {
    Route::get('/list', [\App\Http\Controllers\Client\TriggerLinkController::class, 'list'])->name('list');
    Route::get('/{triggerLink}/check-dependencies', [\App\Http\Controllers\Client\TriggerLinkController::class, 'checkDependencies'])->name('check_dependencies');
    Route::post('/', [\App\Http\Controllers\Client\TriggerLinkController::class, 'store'])->name('store');
    Route::put('/{triggerLink}', [\App\Http\Controllers\Client\TriggerLinkController::class, 'update'])->name('update');
    Route::delete('/{triggerLink}', [\App\Http\Controllers\Client\TriggerLinkController::class, 'destroy'])->name('destroy');
});

// Public Trigger Link Click Tracker & Redirect
Route::get('/l/{slug}', \App\Http\Controllers\TriggerLinkRedirectController::class)->name('public.trigger_link');

// Calendars & Appointments Client Management Routes
Route::middleware(['web', 'client-app'])->prefix('app/calendars')->name('client.calendars.')->group(function () {
    Route::get('/', [\App\Modules\Calendars\Http\Controllers\CalendarController::class, 'index'])->name('index');
    Route::post('/', [\App\Modules\Calendars\Http\Controllers\CalendarController::class, 'store'])->name('store');
    Route::put('/{calendar}', [\App\Modules\Calendars\Http\Controllers\CalendarController::class, 'update'])->name('update');
    Route::delete('/{calendar}', [\App\Modules\Calendars\Http\Controllers\CalendarController::class, 'destroy'])->name('destroy');
    Route::put('/appointments/{appointment}/status', [\App\Modules\Calendars\Http\Controllers\CalendarController::class, 'updateAppointmentStatus'])->name('appointments.status');
    Route::post('/manual-book', [\App\Modules\Calendars\Http\Controllers\CalendarController::class, 'bookManualAppointment'])->name('manual_book');
});

// Public Booking Widget Routes
Route::prefix('b')->name('public.booking.')->group(function () {
    Route::get('/reschedule/{token}', [\App\Modules\Calendars\Http\Controllers\PublicBookingController::class, 'showReschedule'])->name('reschedule.show');
    Route::post('/reschedule/{token}', [\App\Modules\Calendars\Http\Controllers\PublicBookingController::class, 'processReschedule'])->name('reschedule.submit');
    Route::get('/cancel/{token}', [\App\Modules\Calendars\Http\Controllers\PublicBookingController::class, 'processCancel'])->name('cancel');
    Route::get('/appointment/{token}/invite.ics', [\App\Modules\Calendars\Http\Controllers\PublicBookingController::class, 'downloadIcs'])->name('ics');
    Route::get('/{slug}', [\App\Modules\Calendars\Http\Controllers\PublicBookingController::class, 'showWidget'])->name('widget');
    Route::get('/{slug}/slots', [\App\Modules\Calendars\Http\Controllers\PublicBookingController::class, 'getSlots'])->name('slots');
    Route::post('/{slug}/book', [\App\Modules\Calendars\Http\Controllers\PublicBookingController::class, 'processBooking'])->name('book');
});

// Auth routes
require __DIR__.'/auth.php';

// Locale / currency / theme
Route::put('/locale', [LocaleController::class, 'update'])->name('locale.update');
Route::get('/i18n/{locale}', [I18nController::class, 'show'])->name('i18n.show');
Route::put('/currency', [CurrencyController::class, 'update'])->name('currency.update');
Route::post('/theme/update', [ThemeController::class, 'update'])->name('theme.update');

// Public marketing pages
Route::get('/contact', [ContactController::class, 'show'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

// Public marketing landing pages
Route::get('/pricing', [LandingController::class, 'pricing'])->name('pricing');
Route::get('/faq', [LandingController::class, 'faq'])->name('faq');
Route::get('/use-cases', [LandingController::class, 'useCases'])->name('use-cases');
Route::get('/about', [LandingController::class, 'about'])->name('about');
Route::get('/integrations', [LandingController::class, 'integrations'])->name('integrations');

// CMS pages (e.g. /p/privacy, /p/terms)
Route::get('/p/{slug}', [CmsPageController::class, 'show'])->name('cms-page.show');

// Sitemap & robots.txt
Route::get('/sitemap.xml', function () {
    $landingEnabled = true;
    try {
        $landingEnabled = \App\Models\SystemSetting::get('landing.page_enabled', '1') === '1';
    } catch (Throwable $e) {
        // table may not exist yet
    }
    $urls = $landingEnabled
        ? [url('/'), url('/pricing'), url('/faq'), url('/use-cases'), url('/about'), url('/integrations'), url('/contact'), route('login'), route('register')]
        : [route('login'), route('register')];
    try {
        $cmsPages = CmsPage::where('published', true)->get();
        foreach ($cmsPages as $page) {
            $urls[] = route('cms-page.show', $page->slug);
        }
    } catch (Throwable $e) {
        // table may not exist yet
    }
    $xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    foreach ($urls as $url) {
        $xml .= '<url><loc>'.htmlspecialchars($url).'</loc></url>';
    }
    $xml .= '</urlset>';

    return response($xml, 200)->header('Content-Type', 'application/xml');
})->name('sitemap');

Route::get('/robots.txt', function () {
    $sitemap = route('sitemap');

    return response(
        "User-agent: *\nDisallow: /admin/\nDisallow: /app/\nSitemap: {$sitemap}",
        200
    )->header('Content-Type', 'text/plain');
})->name('robots');

// Webhooks (no auth, verified by gateway signature)
Route::middleware('throttle:webhooks')->group(function () {
    Route::post('/webhooks/stripe', [WebhookController::class, 'stripe'])->name('webhooks.stripe');
    Route::post('/webhooks/paypal', [WebhookController::class, 'paypal'])->name('webhooks.paypal');
    Route::post('/webhooks/paddle', [WebhookController::class, 'paddle'])->name('webhooks.paddle');
    Route::post('/webhooks/razorpay', [WebhookController::class, 'razorpay'])->name('webhooks.razorpay');
    Route::post('/webhooks/cashfree', [WebhookController::class, 'cashfree'])->name('webhooks.cashfree');
    Route::post('/webhooks/tap', [WebhookController::class, 'tap'])->name('webhooks.tap');
    Route::post('/webhooks/paystack', [WebhookController::class, 'paystack'])->name('webhooks.paystack');
    Route::post('/webhooks/xendit', [WebhookController::class, 'xendit'])->name('webhooks.xendit');
    Route::post('/webhooks/paymob', [WebhookController::class, 'paymob'])->name('webhooks.paymob');
    Route::post('/webhooks/myfatoorah', [WebhookController::class, 'myfatoorah'])->name('webhooks.myfatoorah');
    Route::post('/webhooks/mollie', [WebhookController::class, 'mollie'])->name('webhooks.mollie');
    Route::post('/webhooks/square', [WebhookController::class, 'square'])->name('webhooks.square');
    Route::post('/webhooks/mercadopago', [WebhookController::class, 'mercadopago'])->name('webhooks.mercadopago');
});

// ─── Health / readiness probes ───────────────────────────────────────────────
// Protected by a shared secret token (HEALTHZ_TOKEN env var). Set to a random
// string in production and pass via Authorization: Bearer <token> header.
Route::middleware('throttle:30,1')->group(function () {
    $guardHealthz = function (Illuminate\Http\Request $request): bool {
        $token = config('app.healthz_token');

        return ! filled($token) || hash_equals($token, $request->bearerToken() ?? '');
    };

    Route::get('/healthz/db', function () use ($guardHealthz) {
        if (! $guardHealthz(request())) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }
        try {
            DB::selectOne('SELECT 1');

            return response()->json(['status' => 'ok', 'db' => 'connected']);
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'db' => 'database error'], 503);
        }
    })->name('healthz.db');

    Route::get('/healthz/redis', function () use ($guardHealthz) {
        if (! $guardHealthz(request())) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }
        try {
            Redis::ping();

            return response()->json(['status' => 'ok', 'redis' => 'connected']);
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'redis' => 'redis error'], 503);
        }
    })->name('healthz.redis');

    Route::get('/healthz/queue', function () use ($guardHealthz) {
        if (! $guardHealthz(request())) {
            return response()->json(['error' => 'Unauthorized.'], 401);
        }
        try {
            $size = Queue::size('default');

            return response()->json(['status' => 'ok', 'queue_driver' => config('queue.default'), 'default_size' => $size]);
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'queue' => 'queue error'], 503);
        }
    })->name('healthz.queue');
});

// ─── Public Storefront Catch-All Routes (Option 1 Direct Clean Brand Paths) ───
$storeSlugPattern = '^(?!(app|login|logout|register|dashboard|admin|api|subscribe|funnels|healthz|d|f|storage|sanctum|_debugbar)\b)[A-Za-z0-9_-]+';

Route::get('/{slug}', [PublicStorefrontController::class, 'index'])
    ->name('public.storefront.index')
    ->where('slug', $storeSlugPattern);

Route::get('/{slug}/{productSlug}', [PublicStorefrontController::class, 'show'])
    ->name('public.storefront.show')
    ->where('slug', $storeSlugPattern);

Route::post('/{slug}/checkout', [PublicStorefrontController::class, 'checkout'])
    ->name('public.storefront.checkout')
    ->where('slug', $storeSlugPattern);

