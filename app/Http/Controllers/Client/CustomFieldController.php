<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Modules\Funnels\Models\SubscriptionForm;
use App\Modules\Shared\Models\CustomField;
use App\Modules\Shared\Models\CustomFieldFolder;
use App\Modules\Shared\Models\CustomValue;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomFieldController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }

    /** Ensure base system folders, standard system fields, and active form folders exist for workspace */
    public static function ensureWorkspaceFolders(int $wid): void
    {
        $defaultSystemFolders = [
            ['key' => 'contact', 'name' => 'Contact', 'object_target' => 'contact', 'sort_order' => 1],
            ['key' => 'general_info', 'name' => 'General Info', 'object_target' => 'contact', 'sort_order' => 2],
            ['key' => 'additional_info', 'name' => 'Additional Info', 'object_target' => 'contact', 'sort_order' => 3],
        ];

        foreach ($defaultSystemFolders as $f) {
            $folder = CustomFieldFolder::withTrashed()
                ->where('workspace_id', $wid)
                ->where('key', $f['key'])
                ->first();

            if ($folder) {
                if ($folder->trashed()) {
                    $folder->restore();
                }
            } else {
                CustomFieldFolder::create([
                    'workspace_id'  => $wid,
                    'key'           => $f['key'],
                    'name'          => $f['name'],
                    'object_target' => $f['object_target'],
                    'sort_order'    => $f['sort_order'],
                    'is_system'     => true,
                ]);
            }
        }

        // Standard System Fields for Contact folder (10 fields)
        $standardContactFields = [
            ['key' => 'first_name', 'name' => 'First Name', 'type' => 'text', 'field_group' => 'contact'],
            ['key' => 'last_name', 'name' => 'Last Name', 'type' => 'text', 'field_group' => 'contact'],
            ['key' => 'name', 'name' => 'Full Name', 'type' => 'text', 'field_group' => 'contact'],
            ['key' => 'email', 'name' => 'Email Address', 'type' => 'text', 'field_group' => 'contact'],
            ['key' => 'phone_e164', 'name' => 'Phone Number', 'type' => 'tel', 'field_group' => 'contact'],
            ['key' => 'whatsapp', 'name' => 'WhatsApp Number', 'type' => 'tel', 'field_group' => 'contact'],
            ['key' => 'date_of_birth', 'name' => 'Date of Birth', 'type' => 'date', 'field_group' => 'contact'],
            ['key' => 'contact_type', 'name' => 'Contact Type', 'type' => 'select', 'field_group' => 'contact', 'options' => ['Lead', 'Customer', 'Partner']],
            ['key' => 'timezone', 'name' => 'Timezone', 'type' => 'select', 'field_group' => 'contact', 'options' => ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata']],
            ['key' => 'source', 'name' => 'Lead Source', 'type' => 'text', 'field_group' => 'contact'],
        ];

        foreach ($standardContactFields as $sf) {
            $field = CustomField::withTrashed()->where('workspace_id', $wid)->where('key', $sf['key'])->first();
            if ($field) {
                if ($field->trashed()) {
                    $field->restore();
                }
                if (empty($field->field_group)) {
                    $field->update(['field_group' => $sf['field_group']]);
                }
            } else {
                CustomField::create([
                    'workspace_id'  => $wid,
                    'key'           => $sf['key'],
                    'name'          => $sf['name'],
                    'type'          => $sf['type'],
                    'object_target' => 'contact',
                    'field_group'   => $sf['field_group'],
                    'options'       => $sf['options'] ?? [],
                    'is_required'   => in_array($sf['key'], ['email']),
                    'is_active'     => true,
                ]);
            }
        }

        // Standard System Fields for General Info folder (11 fields)
        $standardGeneralFields = [
            ['key' => 'company_name', 'name' => 'Company / Business Name', 'type' => 'text', 'field_group' => 'general_info'],
            ['key' => 'address_1', 'name' => 'Street Address', 'type' => 'text', 'field_group' => 'general_info'],
            ['key' => 'address_2', 'name' => 'Apartment / Suite', 'type' => 'text', 'field_group' => 'general_info'],
            ['key' => 'city', 'name' => 'City', 'type' => 'text', 'field_group' => 'general_info'],
            ['key' => 'state', 'name' => 'State / Region', 'type' => 'text', 'field_group' => 'general_info'],
            ['key' => 'postal_code', 'name' => 'Postal / ZIP Code', 'type' => 'text', 'field_group' => 'general_info'],
            ['key' => 'country', 'name' => 'Country', 'type' => 'text', 'field_group' => 'general_info'],
            ['key' => 'website', 'name' => 'Website URL', 'type' => 'text', 'field_group' => 'general_info'],
            ['key' => 'job_title', 'name' => 'Job Title', 'type' => 'text', 'field_group' => 'general_info'],
            ['key' => 'notes', 'name' => 'Contact Notes', 'type' => 'textarea', 'field_group' => 'general_info'],
            ['key' => 'vat_id', 'name' => 'Tax / VAT ID', 'type' => 'text', 'field_group' => 'general_info'],
        ];

        foreach ($standardGeneralFields as $sf) {
            $field = CustomField::withTrashed()->where('workspace_id', $wid)->where('key', $sf['key'])->first();
            if ($field) {
                if ($field->trashed()) {
                    $field->restore();
                }
                if (empty($field->field_group)) {
                    $field->update(['field_group' => $sf['field_group']]);
                }
            } else {
                CustomField::create([
                    'workspace_id'  => $wid,
                    'key'           => $sf['key'],
                    'name'          => $sf['name'],
                    'type'          => $sf['type'],
                    'object_target' => 'contact',
                    'field_group'   => $sf['field_group'],
                    'options'       => $sf['options'] ?? [],
                    'is_required'   => false,
                    'is_active'     => true,
                ]);
            }
        }

        // Auto-discover and sync folders from active subscription forms & sync form custom fields
        $forms = SubscriptionForm::where('workspace_id', $wid)->get();
        foreach ($forms as $form) {
            $folderKey = 'form_' . $form->id;
            $folderName = 'Form | ' . ($form->title ?? $form->name);

            $folder = CustomFieldFolder::withTrashed()
                ->where('workspace_id', $wid)
                ->where('key', $folderKey)
                ->first();

            if ($folder) {
                if ($folder->trashed()) {
                    $folder->restore();
                }
                $folder->update([
                    'name'        => $folderName,
                    'source_id'   => $form->id,
                    'source_type' => 'form',
                ]);
            } else {
                CustomFieldFolder::create([
                    'workspace_id'  => $wid,
                    'key'           => $folderKey,
                    'name'          => $folderName,
                    'object_target' => 'contact',
                    'sort_order'    => 10,
                    'is_system'     => false,
                    'source_type'   => 'form',
                    'source_id'     => $form->id,
                ]);
            }

            // Sync any builder custom fields inside form settings
            $formFields = $form->settings['builder_fields'] ?? $form->settings['custom_fields'] ?? [];
            if (is_array($formFields)) {
                foreach ($formFields as $bf) {
                    $bType = $bf['type'] ?? 'text';
                    if (in_array($bType, ['heading', 'paragraph', 'image', 'divider', 'gdpr', 'double_optin', 'terms', 'captcha', 'email', 'first_name', 'last_name', 'phone_e164', 'button'])) {
                        continue;
                    }
                    $bKey = $bf['key'] ?? null;
                    if ($bKey) {
                        $rawName = ! empty($bf['label']) ? strip_tags($bf['label']) : ucfirst(str_replace('_', ' ', $bKey));
                        $cleanedName = \Illuminate\Support\Str::limit(trim($rawName) ?: ucfirst(str_replace('_', ' ', $bKey)), 250, '');

                        $existingField = CustomField::withTrashed()
                            ->where('workspace_id', $wid)
                            ->where('key', $bKey)
                            ->first();

                        if ($existingField) {
                            if ($existingField->trashed()) {
                                $existingField->restore();
                            }
                            $existingField->update([
                                'name'          => $cleanedName,
                                'type'          => $bType,
                                'object_target' => $bf['objectTarget'] ?? ($existingField->object_target ?: 'contact'),
                                'field_group'   => $existingField->field_group ?: $folderKey,
                                'options'       => $bf['options'] ?? $existingField->options,
                                'is_required'   => ! empty($bf['required']),
                                'is_active'     => true,
                            ]);
                        } else {
                            CustomField::create([
                                'workspace_id'  => $wid,
                                'key'           => $bKey,
                                'name'          => $cleanedName,
                                'type'          => $bType,
                                'object_target' => $bf['objectTarget'] ?? 'contact',
                                'field_group'   => $folderKey,
                                'options'       => $bf['options'] ?? [],
                                'is_required'   => ! empty($bf['required']),
                                'is_active'     => true,
                            ]);
                        }
                    }
                }
            }
        }
    }

    /** Display master table of global custom fields */
    public function index(Request $request): Response
    {
        $wid = $this->workspaceId($request);

        $this->ensureWorkspaceFolders($wid);

        $folders = CustomFieldFolder::where('workspace_id', $wid)
            ->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($folder) use ($wid) {
                return [
                    'id'            => $folder->id,
                    'key'           => $folder->key,
                    'name'          => $folder->name,
                    'object_target' => $folder->object_target,
                    'sort_order'    => $folder->sort_order,
                    'is_system'     => (bool) $folder->is_system,
                    'source_type'   => $folder->source_type,
                    'fields_count'  => CustomField::where('workspace_id', $wid)->where('field_group', $folder->key)->count(),
                    'created_at'    => $folder->created_at ? $folder->created_at->toISOString() : null,
                ];
            });

        $customFields = CustomField::where('workspace_id', $wid)
            ->orderBy('folder_order', 'asc')
            ->orderBy('field_group', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        $deletedFields = CustomField::onlyTrashed()
            ->where('workspace_id', $wid)
            ->orderBy('deleted_at', 'desc')
            ->get();

        $customValues = CustomValue::where('workspace_id', $wid)
            ->orderBy('name', 'asc')
            ->get();

        $triggerLinks = \App\Modules\Shared\Models\TriggerLink::where('workspace_id', $wid)
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Settings/CustomFields/Index', [
            'folders'       => $folders,
            'customFields'  => $customFields,
            'deletedFields' => $deletedFields,
            'customValues'  => $customValues,
            'triggerLinks'  => $triggerLinks,
        ]);
    }

    /**
     * Check if a custom field is referenced in automations (Deletion Safety Guard).
     */
    public function checkDependencies(Request $request, CustomField $customField): \Illuminate\Http\JsonResponse
    {
        $wid = $this->workspaceId($request);
        if ($customField->workspace_id !== $wid) {
            abort(403);
        }

        $automations = \App\Modules\Automation\Models\Automation::where('workspace_id', $wid)->get();
        $usedIn = [];

        foreach ($automations as $auto) {
            $raw = json_encode($auto->nodes ?? []);
            if (str_contains($raw, "contact.custom.{$customField->key}") || str_contains($raw, "contact.{$customField->key}") || str_contains($raw, "custom.{$customField->key}")) {
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

    /** Store a newly created global custom field */
    public function store(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'key'           => 'nullable|string|max:255',
            'type'          => 'required|string|in:text,textarea,number,tel,date,select,radio,checkbox,multi_checkbox,file,rating,scale,signature,hidden',
            'object_target' => 'required|string|in:contact,opportunity,company',
            'field_group'   => 'required|string|max:255',
            'options'       => 'nullable|array',
            'placeholder'   => 'nullable|string|max:255',
            'is_required'   => 'boolean',
        ]);

        $key = ! empty($validated['key'])
            ? strtolower(preg_replace('/[^a-z0-9_]/', '_', $validated['key']))
            : strtolower(preg_replace('/[^a-z0-9_]/', '_', $validated['name']));

        // If field was previously soft deleted, restore and update
        $existing = CustomField::withTrashed()
            ->where('workspace_id', $wid)
            ->where('key', $key)
            ->first();

        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
            }
            $existing->update([
                'name'          => trim($validated['name']),
                'type'          => $validated['type'],
                'object_target' => $validated['object_target'],
                'field_group'   => $validated['field_group'],
                'options'       => $validated['options'] ?? [],
                'placeholder'   => $validated['placeholder'] ?? '',
                'is_required'   => $validated['is_required'] ?? false,
                'is_active'     => true,
            ]);
        } else {
            CustomField::create([
                'workspace_id'  => $wid,
                'key'           => $key,
                'name'          => trim($validated['name']),
                'type'          => $validated['type'],
                'object_target' => $validated['object_target'],
                'field_group'   => $validated['field_group'],
                'options'       => $validated['options'] ?? [],
                'placeholder'   => $validated['placeholder'] ?? '',
                'is_required'   => $validated['is_required'] ?? false,
                'is_active'     => true,
            ]);
        }

        return back()->with('success', 'Custom field saved successfully.');
    }

    /** Update an existing global custom field */
    public function update(Request $request, CustomField $customField): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        if ($customField->workspace_id !== $wid) {
            abort(403);
        }

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'type'          => 'required|string|in:text,textarea,number,tel,date,select,radio,checkbox,multi_checkbox,file,rating,scale,signature,hidden',
            'object_target' => 'required|string|in:contact,opportunity,company',
            'field_group'   => 'required|string|max:255',
            'options'       => 'nullable|array',
            'placeholder'   => 'nullable|string|max:255',
            'is_required'   => 'boolean',
            'is_active'     => 'boolean',
            'folder_order'  => 'nullable|integer',
        ]);

        $customField->update([
            'name'          => trim($validated['name']),
            'type'          => $validated['type'],
            'object_target' => $validated['object_target'],
            'field_group'   => $validated['field_group'],
            'options'       => $validated['options'] ?? [],
            'placeholder'   => $validated['placeholder'] ?? '',
            'is_required'   => $validated['is_required'] ?? false,
            'is_active'     => $validated['is_active'] ?? true,
            'folder_order'  => $validated['folder_order'] ?? $customField->folder_order,
        ]);

        return back()->with('success', 'Custom field updated successfully.');
    }

    /** Delete (soft-delete) a custom field */
    public function destroy(Request $request, CustomField $customField): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        if ($customField->workspace_id !== $wid) {
            abort(403);
        }

        $systemProtectedKeys = [
            'first_name', 'last_name', 'name', 'email', 'phone_e164', 'whatsapp',
            'date_of_birth', 'contact_type', 'timezone', 'source',
            'company_name', 'address_1', 'address_2', 'city', 'state', 'postal_code',
            'country', 'website', 'job_title', 'notes', 'vat_id',
        ];

        if (in_array($customField->key, $systemProtectedKeys) || in_array($customField->field_group, ['contact', 'general_info'])) {
            return back()->with('error', 'Default system fields are required by CRM operations and cannot be deleted.');
        }

        $customField->delete();

        return back()->with('success', 'Custom field moved to Deleted Fields.');
    }

    /** Restore a soft-deleted custom field */
    public function restore(Request $request, int $id): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        $field = CustomField::onlyTrashed()
            ->where('workspace_id', $wid)
            ->where('id', $id)
            ->firstOrFail();

        $field->restore();

        return back()->with('success', 'Custom field restored successfully.');
    }

    /** Permanently purge a custom field */
    public function forceDelete(Request $request, int $id): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        $field = CustomField::onlyTrashed()
            ->where('workspace_id', $wid)
            ->where('id', $id)
            ->firstOrFail();

        $field->forceDelete();

        return back()->with('success', 'Custom field permanently purged.');
    }

    /** Create a new custom field folder */
    public function storeFolder(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'object_target' => 'required|string|in:contact,opportunity,company',
        ]);

        $key = strtolower(preg_replace('/[^a-z0-9_]/', '_', $validated['name']));

        // Check if existing
        $existing = CustomFieldFolder::withTrashed()->where('workspace_id', $wid)->where('key', $key)->first();
        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
                $existing->update([
                    'name'          => trim($validated['name']),
                    'object_target' => $validated['object_target'],
                ]);
                return back()->with('success', 'Folder restored successfully.');
            }
            return back()->with('error', 'A folder with this name already exists.');
        }

        $maxSort = (int) CustomFieldFolder::where('workspace_id', $wid)->max('sort_order');

        CustomFieldFolder::create([
            'workspace_id'  => $wid,
            'name'          => trim($validated['name']),
            'key'           => $key,
            'object_target' => $validated['object_target'],
            'sort_order'    => $maxSort + 1,
            'is_system'     => false,
            'source_type'   => 'custom',
        ]);

        return back()->with('success', 'Folder created successfully.');
    }

    /** Update a custom field folder */
    public function updateFolder(Request $request, int $id): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        $folder = CustomFieldFolder::where('workspace_id', $wid)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'object_target' => 'required|string|in:contact,opportunity,company',
        ]);

        $folder->update([
            'name'          => trim($validated['name']),
            'object_target' => $validated['object_target'],
        ]);

        return back()->with('success', 'Folder updated successfully.');
    }

    /** Delete a custom field folder */
    public function destroyFolder(Request $request, int $id): RedirectResponse
    {
        $wid = $this->workspaceId($request);
        $folder = CustomFieldFolder::where('workspace_id', $wid)->where('id', $id)->firstOrFail();

        if ($folder->is_system) {
            return back()->with('error', 'System default folders cannot be deleted.');
        }

        $folder->delete();

        return back()->with('success', 'Folder deleted.');
    }

    /** Reorder folders */
    public function reorderFolders(Request $request): RedirectResponse
    {
        $wid = $this->workspaceId($request);

        $validated = $request->validate([
            'folder_ids' => 'required|array',
            'folder_ids.*' => 'integer',
        ]);

        foreach ($validated['folder_ids'] as $order => $folderId) {
            CustomFieldFolder::where('workspace_id', $wid)
                ->where('id', $folderId)
                ->update(['sort_order' => $order + 1]);
        }

        return back()->with('success', 'Folder order updated.');
    }
}

