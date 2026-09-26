<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Modules\Shared\Models\CustomValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CustomValueController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    /**
     * Return JSON list of custom values for dynamic pickers.
     */
    public function list(Request $request): JsonResponse
    {
        $wid = $this->workspaceId($request);
        $values = CustomValue::where('workspace_id', $wid)
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'key', 'value']);

        return response()->json($values);
    }

    /**
     * Check if a custom value is used in active automations (Deletion Safety Guard).
     */
    public function checkDependencies(Request $request, CustomValue $customValue): JsonResponse
    {
        $wid = $this->workspaceId($request);
        if ($customValue->workspace_id !== $wid) {
            abort(403);
        }

        $automations = \App\Modules\Automation\Models\Automation::where('workspace_id', $wid)->get();
        $usedIn = [];

        foreach ($automations as $auto) {
            $raw = json_encode($auto->nodes ?? []);
            if (str_contains($raw, "custom_values.{$customValue->key}") || str_contains($raw, "custom_value.{$customValue->key}")) {
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
     * Store a new custom value.
     */
    public function store(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'name'  => 'required|string|max:190',
            'key'   => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('custom_values', 'key')->where('workspace_id', $wid),
            ],
            'value' => 'nullable|string|max:10000',
        ]);

        $key = ! empty($validated['key'])
            ? Str::slug($validated['key'], '_')
            : Str::slug($validated['name'], '_');

        // Ensure unique key in case generated
        $baseKey = $key;
        $counter = 1;
        while (CustomValue::where('workspace_id', $wid)->where('key', $key)->exists()) {
            $key = $baseKey . '_' . $counter++;
        }

        CustomValue::create([
            'workspace_id' => $wid,
            'name'         => $validated['name'],
            'key'          => $key,
            'value'        => $validated['value'] ?? '',
        ]);

        return back()->with('success', "Custom Value '{$validated['name']}' created successfully.");
    }

    /**
     * Update an existing custom value.
     */
    public function update(Request $request, CustomValue $customValue): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        if ($customValue->workspace_id !== $wid) {
            abort(403);
        }

        $validated = $request->validate([
            'name'  => 'required|string|max:190',
            'key'   => [
                'required',
                'string',
                'max:100',
                Rule::unique('custom_values', 'key')->where('workspace_id', $wid)->ignore($customValue->id),
            ],
            'value' => 'nullable|string|max:10000',
        ]);

        $key = Str::slug($validated['key'], '_');

        $customValue->update([
            'name'  => $validated['name'],
            'key'   => $key,
            'value' => $validated['value'] ?? '',
        ]);

        return back()->with('success', "Custom Value '{$validated['name']}' updated.");
    }

    /**
     * Delete a custom value.
     */
    public function destroy(Request $request, CustomValue $customValue): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        if ($customValue->workspace_id !== $wid) {
            abort(403);
        }

        $name = $customValue->name;
        $customValue->delete();

        return back()->with('success', "Custom Value '{$name}' deleted.");
    }
}
