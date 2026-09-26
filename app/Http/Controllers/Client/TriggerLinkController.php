<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Modules\Automation\Models\Automation;
use App\Modules\Shared\Models\TriggerLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TriggerLinkController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    /**
     * Return JSON list of trigger links for pickers and builders.
     */
    public function list(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);
        $links = TriggerLink::where('workspace_id', $wid)
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($links);
    }

    /**
     * Check if a trigger link is used in active automations (Deletion Safety Guard).
     */
    public function checkDependencies(Request $request, TriggerLink $triggerLink): JsonResponse
    {
        $wid = $this->workspaceId($request);
        if ($triggerLink->workspace_id !== $wid) {
            abort(403);
        }

        $automations = Automation::where('workspace_id', $wid)->get();
        $usedIn = [];

        foreach ($automations as $auto) {
            $raw = json_encode($auto->nodes ?? []);
            if (str_contains($raw, (string) $triggerLink->id) || str_contains($raw, $triggerLink->slug)) {
                $usedIn[] = [
                    'id'   => $auto->id,
                    'name' => $auto->name,
                ];
            }
        }

        return response()->json([
            'used_in_count' => count($usedIn),
            'automations'   => $usedIn,
        ]);
    }

    /**
     * Store a new trigger link.
     */
    public function store(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'name'       => 'required|string|max:190',
            'target_url' => 'required|url|max:2000',
            'slug'       => [
                'nullable',
                'string',
                'max:64',
                Rule::unique('trigger_links', 'slug')->where('workspace_id', $wid),
            ],
        ]);

        $slug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'], '_')
            : Str::slug($validated['name'], '_');

        $baseSlug = $slug ?: 'link_' . Str::lower(Str::random(6));
        $slug = $baseSlug;
        $counter = 1;
        while (TriggerLink::where('workspace_id', $wid)->where('slug', $slug)->exists()) {
            $slug = $baseSlug . '_' . $counter++;
        }

        TriggerLink::create([
            'workspace_id' => $wid,
            'name'         => $validated['name'],
            'target_url'   => $validated['target_url'],
            'slug'         => $slug,
        ]);

        return back()->with('success', "Trigger Link '{$validated['name']}' created successfully.");
    }

    /**
     * Update an existing trigger link.
     */
    public function update(Request $request, TriggerLink $triggerLink): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        if ($triggerLink->workspace_id !== $wid) {
            abort(403);
        }

        $validated = $request->validate([
            'name'       => 'required|string|max:190',
            'target_url' => 'required|url|max:2000',
            'slug'       => [
                'required',
                'string',
                'max:64',
                Rule::unique('trigger_links', 'slug')->where('workspace_id', $wid)->ignore($triggerLink->id),
            ],
        ]);

        $slug = Str::slug($validated['slug'], '_');

        $triggerLink->update([
            'name'       => $validated['name'],
            'target_url' => $validated['target_url'],
            'slug'       => $slug,
        ]);

        return back()->with('success', "Trigger Link '{$validated['name']}' updated.");
    }

    /**
     * Delete a trigger link.
     */
    public function destroy(Request $request, TriggerLink $triggerLink): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        if ($triggerLink->workspace_id !== $wid) {
            abort(403);
        }

        $name = $triggerLink->name;
        $triggerLink->delete();

        return back()->with('success', "Trigger Link '{$name}' deleted.");
    }
}
