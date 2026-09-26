<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /** Inventory at or below this is flagged as low stock. */
    public const LOW_STOCK_THRESHOLD = 5;

    public function index(Request $request): Response
    {
        $workspaceId = $this->workspaceId($request);

        $query = EcommerceProduct::where('ecommerce_products.workspace_id', $workspaceId)
            ->when($request->input('store_id'), fn ($q, $id) => $q->where('store_id', $id))
            ->when($request->input('pricing_type'), fn ($q, $pt) => $q->where('pricing_type', $pt))
            ->when($request->input('search'), fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$s}%")
                ->orWhere('sku', 'like', "%{$s}%")))
            ->when($request->boolean('low_stock'), fn ($q) => $q
                ->whereNotNull('inventory_quantity')
                ->where('inventory_quantity', '<=', self::LOW_STOCK_THRESHOLD));

        $productIds = (clone $query)->pluck('id');

        // Per-product order counts for analytics mini-stats
        $orderStats = \App\Modules\Ecommerce\Models\EcommerceOrder::whereIn(
            \DB::raw("JSON_UNQUOTE(JSON_EXTRACT(line_items, '$[0].product_id'))"),
            $productIds
        )
        ->select(\DB::raw("JSON_UNQUOTE(JSON_EXTRACT(line_items, '$[0].product_id')) as product_id"), \DB::raw('COUNT(*) as order_count'), \DB::raw('SUM(total) as revenue'))
        ->groupBy('product_id')
        ->get()
        ->keyBy('product_id');

        $products = (clone $query)
            ->with('prices')
            ->orderBy('name')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (EcommerceProduct $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug ?? \Illuminate\Support\Str::slug($p->name),
                'description' => $p->description,
                'sku' => $p->sku,
                'price' => $p->price,
                'compare_price' => $p->compare_price,
                'pricing_type' => $p->pricing_type ?? 'one_time',
                'billing_interval' => $p->billing_interval,
                'billing_interval_count' => $p->billing_interval_count,
                'trial_days' => $p->trial_days,
                'installment_count' => $p->installment_count,
                'product_type' => $p->product_type ?? 'physical',
                'inventory_quantity' => $p->inventory_quantity,
                'status' => $p->status,
                'image_url' => $p->image_url,
                'platform' => $p->platform,
                'meta_title' => $p->meta_title,
                'meta_description' => $p->meta_description,
                'access_duration_type' => $p->access_duration_type ?? 'lifetime',
                'access_duration_days' => $p->access_duration_days,
                'digital_fulfillment_type' => $p->digital_fulfillment_type,
                'digital_file_url' => $p->digital_file_url,
                'digital_external_url' => $p->digital_external_url,
                'digital_license_key' => $p->digital_license_key,
                'digital_download_limit' => $p->digital_download_limit,
                'digital_expiration_days' => $p->digital_expiration_days,
                'calendar_id' => $p->calendar_id,
                'raw' => $p->raw,
                'prices' => $p->prices,
                // Per-product analytics
                'stats' => [
                    'order_count' => (int) ($orderStats[$p->id]->order_count ?? 0),
                    'revenue' => (float) ($orderStats[$p->id]->revenue ?? 0),
                ],
            ]);

        $calendars = \App\Modules\Calendars\Models\BookingCalendar::where('workspace_id', $workspaceId)
            ->where('is_active', true)
            ->get(['id', 'name', 'slug', 'type', 'duration_minutes']);

        $nativeStore = EcommerceStore::getOrCreateNativeStore($workspaceId);

        $allProducts = EcommerceProduct::where('workspace_id', $workspaceId)
            ->with('prices')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'price', 'pricing_type', 'image_url', 'digital_fulfillment_type', 'digital_file_url', 'digital_external_url', 'digital_license_key']);

        return Inertia::render('Ecommerce/Products/Index', [
            'products' => $products,
            'allProducts' => $allProducts,
            'filters' => $request->only('store_id', 'search', 'low_stock'),
            'stores' => $this->workspaceStores($workspaceId),
            'nativeStore' => [
                'id' => $nativeStore->id,
                'slug' => $nativeStore->slug ?? (string) $nativeStore->id,
                'url' => route('public.storefront.index', $nativeStore->slug ?? $nativeStore->id),
            ],
            'calendars' => $calendars,
            'stats' => [
                'total' => (clone $query)->count(),
                'low_stock' => EcommerceProduct::where('workspace_id', $workspaceId)
                    ->whereNotNull('inventory_quantity')
                    ->where('inventory_quantity', '<=', self::LOW_STOCK_THRESHOLD)
                    ->count(),
                'out_of_stock' => EcommerceProduct::where('workspace_id', $workspaceId)
                    ->whereNotNull('inventory_quantity')
                    ->where('inventory_quantity', '<=', 0)
                    ->count(),
            ],
            'lowStockThreshold' => self::LOW_STOCK_THRESHOLD,
        ]);
    }

    public function store(Request $request)
    {
        $workspaceId = $this->workspaceId($request);
        $nativeStore = EcommerceStore::getOrCreateNativeStore($workspaceId);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku' => 'nullable|string|max:100',
            'pricing_type' => 'required|string|in:one_time,recurring,installments,free',
            'price' => 'required_unless:pricing_type,free|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'billing_interval' => 'nullable|string|in:day,month,year,custom',
            'billing_interval_count' => 'nullable|integer|min:1',
            'trial_days' => 'nullable|integer|min:0',
            'installment_count' => 'nullable|integer|min:2',
            'product_type' => 'nullable|string|in:physical,digital',
            'inventory_quantity' => 'nullable|integer|min:0',
            'status' => 'required|string|in:active,draft,archived',
            'image_url' => 'nullable|string|max:1024',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'access_duration_type' => 'nullable|string|in:lifetime,days',
            'access_duration_days' => 'nullable|integer|min:1',
            'digital_fulfillment_type' => 'nullable|string|in:file,external_link,license_key,booking',
            'digital_file_url' => 'nullable|string|max:1024',
            'digital_external_url' => 'nullable|string|max:1024',
            'digital_license_key' => 'nullable|string',
            'digital_download_limit' => 'nullable|integer|min:1',
            'digital_expiration_days' => 'nullable|integer|min:1',
            'calendar_id' => 'nullable|integer|exists:booking_calendars,id',
            'raw' => 'nullable|array',
        ]);

        $productType = $data['product_type'] ?? 'digital';

        $sku = $data['sku'] ?? null;
        if (empty($sku)) {
            $sku = strtoupper(substr(preg_replace('/[^A-Z0-9]/', '', strtoupper($data['name'])), 0, 6)) . '-' . strtoupper(substr((string)\Illuminate\Support\Str::uuid(), 0, 6));
        }

        $product = EcommerceProduct::create([
            'workspace_id' => $workspaceId,
            'store_id' => $nativeStore->id,
            'external_id' => (string) \Illuminate\Support\Str::uuid(),
            'platform' => 'native',
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sku' => $sku,
            'pricing_type' => $data['pricing_type'],
            'price' => $data['pricing_type'] === 'free' ? 0 : $data['price'],
            'compare_price' => !empty($data['compare_price']) ? $data['compare_price'] : null,
            'billing_interval' => $data['pricing_type'] === 'recurring' ? ($data['billing_interval'] ?? 'month') : null,
            'billing_interval_count' => $data['pricing_type'] === 'recurring' ? ($data['billing_interval_count'] ?? 1) : null,
            'trial_days' => $data['pricing_type'] === 'recurring' ? ($data['trial_days'] ?? 0) : null,
            'installment_count' => $data['pricing_type'] === 'installments' ? ($data['installment_count'] ?? 3) : null,
            'product_type' => $productType,
            'inventory_quantity' => array_key_exists('inventory_quantity', $data) ? $data['inventory_quantity'] : null,
            'status' => $data['status'],
            'image_url' => $data['image_url'] ?? null,
            'meta_title' => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
            'access_duration_type' => $data['access_duration_type'] ?? 'lifetime',
            'access_duration_days' => ($data['access_duration_type'] ?? 'lifetime') === 'days' ? ($data['access_duration_days'] ?? null) : null,
            'digital_fulfillment_type' => $data['digital_fulfillment_type'] ?? 'file',
            'digital_file_url' => $data['digital_file_url'] ?? null,
            'digital_external_url' => $data['digital_external_url'] ?? null,
            'digital_license_key' => $data['digital_license_key'] ?? null,
            'digital_download_limit' => $data['digital_download_limit'] ?? 5,
            'digital_expiration_days' => $data['digital_expiration_days'] ?? 30,
            'calendar_id' => $data['calendar_id'] ?? null,
            'raw' => $request->input('raw'),
        ]);

        // Sync Multi-Price Tiers
        if ($request->has('prices') && is_array($request->input('prices'))) {
            foreach ($request->input('prices') as $idx => $pData) {
                if (!empty($pData['name']) || isset($pData['price'])) {
                    $product->prices()->create([
                        'workspace_id'           => $workspaceId,
                        'name'                   => $pData['name'] ?? 'Standard',
                        'pricing_type'           => $pData['pricing_type'] ?? 'one_time',
                        'price'                  => $pData['price'] ?? 0,
                        'compare_price'          => !empty($pData['compare_price']) ? $pData['compare_price'] : null,
                        'billing_interval'       => $pData['billing_interval'] ?? null,
                        'billing_interval_count' => $pData['billing_interval_count'] ?? 1,
                        'trial_days'             => $pData['trial_days'] ?? 0,
                        'installment_count'      => $pData['installment_count'] ?? 3,
                        'is_default'             => !empty($pData['is_default']),
                        'sort_order'             => $idx,
                    ]);
                }
            }
        }

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    public function update(Request $request, EcommerceProduct $product)
    {
        $workspaceId = $this->workspaceId($request);
        if ((int) $product->workspace_id !== $workspaceId) {
            abort(403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:10',
            'pricing_type' => 'required|string|in:one_time,recurring,installments,free',
            'price' => 'required_unless:pricing_type,free|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'billing_interval' => 'nullable|string|in:day,month,year,custom',
            'billing_interval_count' => 'nullable|integer|min:1',
            'trial_days' => 'nullable|integer|min:0',
            'installment_count' => 'nullable|integer|min:2',
            'product_type' => 'nullable|string|in:physical,digital',
            'inventory_quantity' => 'nullable|integer|min:0',
            'status' => 'required|string|in:active,draft,archived',
            'image_url' => 'nullable|string|max:1024',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'access_duration_type' => 'nullable|string|in:lifetime,days',
            'access_duration_days' => 'nullable|integer|min:1',
            'digital_fulfillment_type' => 'nullable|string|in:file,external_link,license_key,booking',
            'digital_file_url' => 'nullable|string|max:1024',
            'digital_external_url' => 'nullable|string|max:1024',
            'digital_license_key' => 'nullable|string',
            'digital_download_limit' => 'nullable|integer|min:1',
            'digital_expiration_days' => 'nullable|integer|min:1',
            'calendar_id' => 'nullable|integer|exists:booking_calendars,id',
            'raw' => 'nullable|array',
        ]);

        $productType = $data['product_type'] ?? 'digital';

        $product->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sku' => $data['sku'] ?? $product->sku,
            'pricing_type' => $data['pricing_type'],
            'price' => $data['pricing_type'] === 'free' ? 0 : $data['price'],
            'compare_price' => !empty($data['compare_price']) ? $data['compare_price'] : null,
            'billing_interval' => $data['pricing_type'] === 'recurring' ? ($data['billing_interval'] ?? 'month') : null,
            'billing_interval_count' => $data['pricing_type'] === 'recurring' ? ($data['billing_interval_count'] ?? 1) : null,
            'trial_days' => $data['pricing_type'] === 'recurring' ? ($data['trial_days'] ?? 0) : null,
            'installment_count' => $data['pricing_type'] === 'installments' ? ($data['installment_count'] ?? 3) : null,
            'product_type' => $productType,
            'inventory_quantity' => array_key_exists('inventory_quantity', $data) ? $data['inventory_quantity'] : null,
            'status' => $data['status'],
            'image_url' => $data['image_url'] ?? null,
            'meta_title' => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
            'access_duration_type' => $data['access_duration_type'] ?? 'lifetime',
            'access_duration_days' => ($data['access_duration_type'] ?? 'lifetime') === 'days' ? ($data['access_duration_days'] ?? null) : null,
            'digital_fulfillment_type' => $data['digital_fulfillment_type'] ?? 'file',
            'digital_file_url' => $data['digital_file_url'] ?? null,
            'digital_external_url' => $data['digital_external_url'] ?? null,
            'digital_license_key' => $data['digital_license_key'] ?? null,
            'digital_download_limit' => $data['digital_download_limit'] ?? 5,
            'digital_expiration_days' => $data['digital_expiration_days'] ?? 30,
            'calendar_id' => $data['calendar_id'] ?? null,
            'raw' => $request->input('raw'),
        ]);

        // Sync Multi-Price Tiers
        if ($request->has('prices') && is_array($request->input('prices'))) {
            $product->prices()->delete();
            foreach ($request->input('prices') as $idx => $pData) {
                if (!empty($pData['name']) || isset($pData['price'])) {
                    $product->prices()->create([
                        'workspace_id'           => $workspaceId,
                        'name'                   => $pData['name'] ?? 'Standard',
                        'pricing_type'           => $pData['pricing_type'] ?? 'one_time',
                        'price'                  => $pData['price'] ?? 0,
                        'compare_price'          => !empty($pData['compare_price']) ? $pData['compare_price'] : null,
                        'billing_interval'       => $pData['billing_interval'] ?? null,
                        'billing_interval_count' => $pData['billing_interval_count'] ?? 1,
                        'trial_days'             => $pData['trial_days'] ?? 0,
                        'installment_count'      => $pData['installment_count'] ?? 3,
                        'is_default'             => !empty($pData['is_default']),
                        'sort_order'             => $idx,
                    ]);
                }
            }
        }

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    public function destroy(Request $request, EcommerceProduct $product)
    {
        $workspaceId = $this->workspaceId($request);
        if ((int) $product->workspace_id !== $workspaceId) {
            abort(403);
        }

        $product->delete();

        return redirect()->back()->with('success', 'Product deleted successfully.');
    }

    /**
     * Duplicate a product (copy all fields, reset slug/sku/external_id, set status to draft).
     */
    public function duplicate(Request $request, EcommerceProduct $product)
    {
        $workspaceId = $this->workspaceId($request);
        if ((int) $product->workspace_id !== $workspaceId) {
            abort(403);
        }

        $newName = 'Copy of ' . $product->name;
        $newSku  = strtoupper(substr(preg_replace('/[^A-Z0-9]/', '', strtoupper($newName)), 0, 6)) . '-' . strtoupper(substr((string)\Illuminate\Support\Str::uuid(), 0, 6));

        EcommerceProduct::create([
            'workspace_id'           => $product->workspace_id,
            'store_id'               => $product->store_id,
            'external_id'            => (string) \Illuminate\Support\Str::uuid(),
            'platform'               => $product->platform,
            'name'                   => $newName,
            'description'            => $product->description,
            'sku'                    => $newSku,
            'pricing_type'           => $product->pricing_type,
            'price'                  => $product->price,
            'compare_price'          => $product->compare_price,
            'billing_interval'       => $product->billing_interval,
            'billing_interval_count' => $product->billing_interval_count,
            'trial_days'             => $product->trial_days,
            'installment_count'      => $product->installment_count,
            'product_type'           => $product->product_type,
            'inventory_quantity'     => $product->inventory_quantity,
            'status'                 => 'draft',
            'image_url'              => $product->image_url,
            'meta_title'             => $product->meta_title,
            'meta_description'       => $product->meta_description,
            'access_duration_type'   => $product->access_duration_type,
            'access_duration_days'   => $product->access_duration_days,
            'digital_fulfillment_type' => $product->digital_fulfillment_type,
            'digital_file_url'       => $product->digital_file_url,
            'digital_external_url'   => $product->digital_external_url,
            'digital_license_key'    => $product->digital_license_key,
            'digital_download_limit' => $product->digital_download_limit,
            'digital_expiration_days'=> $product->digital_expiration_days,
            'calendar_id'            => $product->calendar_id,
            'raw'                    => $product->raw,
        ]);

        return redirect()->back()->with('success', "'{$product->name}' duplicated as draft.");
    }

    /**
     * Lightweight product search for the Inbox "share product" picker (JSON).
     */
    public function search(Request $request): JsonResponse
    {
        $workspaceId = $this->workspaceId($request);
        $q = trim((string) $request->input('q', ''));

        $products = EcommerceProduct::with('store:id,name,slug,external_meta')
            ->where('workspace_id', $workspaceId)
            ->when($q !== '', fn ($query) => $query->where(fn ($w) => $w
                ->where('name', 'like', "%{$q}%")
                ->orWhere('sku', 'like', "%{$q}%")))
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'store_id', 'name', 'description', 'sku', 'price', 'pricing_type', 'billing_interval', 'product_type', 'inventory_quantity', 'status', 'image_url', 'platform'])
            ->map(fn (EcommerceProduct $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description,
                'sku' => $p->sku,
                'price' => $p->price,
                'pricing_type' => $p->pricing_type ?? 'one_time',
                'billing_interval' => $p->billing_interval,
                'product_type' => $p->product_type ?? 'physical',
                'currency' => $p->store?->external_meta['currency'] ?? 'USD',
                'inventory_quantity' => $p->inventory_quantity,
                'status' => $p->status,
                'image_url' => $p->image_url,
                'platform' => $p->platform,
                'checkout_url' => route('public.storefront.show', ['slug' => $p->store?->slug ?? $p->store_id, 'productSlug' => $p->id]),
            ]);

        return response()->json($products);
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function workspaceStores(int $workspaceId): array
    {
        return EcommerceStore::where('workspace_id', $workspaceId)
            ->get(['id', 'name'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])
            ->all();
    }

    private function workspaceId(Request $request): int
    {
        return (int) ($request->user()->current_workspace_id ?? $request->user()->workspace_id);
    }
}
