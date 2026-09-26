<?php

namespace App\Http\Controllers;

use App\Listeners\AutomationTriggerListener;
use App\Modules\Shared\Models\Contact;
use App\Modules\Shared\Models\TriggerLink;
use App\Modules\Shared\Models\TriggerLinkClick;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TriggerLinkRedirectController extends Controller
{
    /**
     * Handle tracked redirect for a Trigger Link.
     * Route: GET /l/{slug}
     */
    public function __invoke(Request $request, string $slug): RedirectResponse
    {
        $link = TriggerLink::where('slug', $slug)->first();

        if (! $link) {
            abort(404, 'Tracked link not found or expired.');
        }

        // Increment click count
        $link->increment('clicks_count');

        // Identify contact if passed in parameter ?c=
        $contactId = $request->query('c');
        $contact = null;
        if ($contactId) {
            $contact = Contact::where('workspace_id', $link->workspace_id)
                ->where('id', $contactId)
                ->first();
        }

        // Record the click event
        try {
            TriggerLinkClick::create([
                'trigger_link_id' => $link->id,
                'contact_id'      => $contact?->id,
                'ip_address'      => $request->ip(),
                'user_agent'      => substr((string) $request->userAgent(), 0, 500),
                'created_at'      => now(),
            ]);
        } catch (\Throwable $e) {
            // Silently log and do not break redirection
            report($e);
        }

        // Fire automation trigger if contact is known
        if ($contact) {
            try {
                $listener = app(AutomationTriggerListener::class);
                $listener->handleTriggerLinkClicked($link->workspace_id, $contact->id, $link, [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        // Target URL fallback
        $targetUrl = $link->target_url;
        if (! str_starts_with($targetUrl, 'http://') && ! str_starts_with($targetUrl, 'https://')) {
            $targetUrl = 'https://' . $targetUrl;
        }

        return redirect()->away($targetUrl);
    }
}
