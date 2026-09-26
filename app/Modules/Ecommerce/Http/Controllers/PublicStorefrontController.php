<?php

namespace App\Modules\Ecommerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Ecommerce\Models\EcommerceOrder;
use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceStore;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicStorefrontController extends Controller
{
    public function index(string $slug): Response
    {
        $store = $this->resolveStore($slug);

        $products = EcommerceProduct::where('store_id', $store->id)
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'slug', 'description', 'sku', 'price', 'pricing_type', 'billing_interval', 'billing_interval_count', 'trial_days', 'installment_count', 'product_type', 'inventory_quantity', 'image_url', 'platform']);

        return Inertia::render('Public/Storefront/Index', [
            'store' => [
                'id' => $store->id,
                'uuid' => $store->uuid,
                'name' => $store->name,
                'slug' => $store->slug ?? Str::slug($store->name),
            ],
            'products' => $products,
        ]);
    }

    public function show(string $slug, string $productSlug): Response
    {
        $store = $this->resolveStore($slug);

        $product = EcommerceProduct::where('status', 'active')
            ->where(function ($q) use ($store) {
                $q->where('store_id', $store->id)
                  ->orWhere('workspace_id', $store->workspace_id);
            })
            ->where(function ($q) use ($productSlug) {
                $q->where('slug', $productSlug)
                  ->orWhere('id', $productSlug)
                  ->orWhere('external_id', $productSlug)
                  ->orWhere('name', 'like', "%{$productSlug}%");
            })
            ->firstOrFail();

        return Inertia::render('Public/Storefront/Show', [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug ?? Str::slug($store->name),
            ],
            'product' => $product,
        ]);
    }

    public function checkout(Request $request, string $slug)
    {
        $store = $this->resolveStore($slug);

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:50',
            'shipping_address' => 'nullable|string|max:500',
            'payment_method' => 'required|string|max:50',
            'include_order_bump' => 'nullable|boolean',
            'coupon_code' => 'nullable|string|max:50',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:ecommerce_products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $lineItems = [];
        $totalAmount = 0;
        $primaryProduct = null;

        foreach ($validated['items'] as $itemData) {
            $product = EcommerceProduct::find($itemData['product_id']);
            if (!$product) {
                abort(404, "Product #{$itemData['product_id']} not found.");
            }

            if (!$primaryProduct) {
                $primaryProduct = $product;
            }

            if ($product->store) {
                $store = $product->store;
            }

            $qty = (int) $itemData['quantity'];

            // Stock guard check
            if ($product->inventory_quantity !== null) {
                if ($product->inventory_quantity < $qty) {
                    return response()->json([
                        'message' => $product->inventory_quantity <= 0
                            ? "Sorry, '{$product->name}' is completely sold out!"
                            : "Sorry, only {$product->inventory_quantity} remaining in stock for '{$product->name}'!",
                    ], 422);
                }
            }

            $itemTotal = (float) $product->price * $qty;
            $totalAmount += $itemTotal;

            $lineItems[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'quantity' => $qty,
                'total' => $itemTotal,
                'pricing_type' => $product->pricing_type,
                'product_type' => $product->product_type,
            ];

            if ($product->inventory_quantity !== null) {
                $product->decrement('inventory_quantity', min($qty, $product->inventory_quantity));
            }
        }

        // Apply Coupon Discount if valid
        $couponCode = trim((string) ($validated['coupon_code'] ?? ''));
        $discountAmount = 0;

        if ($couponCode !== '' && $primaryProduct && !empty($primaryProduct->raw['coupons'])) {
            foreach ($primaryProduct->raw['coupons'] as $coupon) {
                if (strcasecmp($coupon['code'] ?? '', $couponCode) === 0) {
                    $discType = $coupon['discount_type'] ?? 'percent';
                    $discVal = (float) ($coupon['discount_value'] ?? 0);
                    if ($discType === 'percent') {
                        $discountAmount = $totalAmount * ($discVal / 100);
                    } else {
                        $discountAmount = $discVal;
                    }
                    $discountAmount = min($discountAmount, $totalAmount);
                    $totalAmount = max(0, $totalAmount - $discountAmount);
                    break;
                }
            }
        }

        // Apply Order Bump if selected
        $orderBumpIncluded = false;
        $orderBumpData = null;

        if (!empty($validated['include_order_bump']) && $primaryProduct && !empty($primaryProduct->raw['order_bump']['enabled'])) {
            $bumpConfig = $primaryProduct->raw['order_bump'];
            $bumpPrice = (float) ($bumpConfig['price'] ?? 0);
            $bumpProductId = !empty($bumpConfig['product_id']) ? (int) $bumpConfig['product_id'] : null;
            $bumpProduct = $bumpProductId ? EcommerceProduct::find($bumpProductId) : null;

            if ($bumpProduct) {
                $bumpConfig['title'] = !empty($bumpConfig['title']) ? $bumpConfig['title'] : $bumpProduct->name;
                $bumpConfig['fulfillment_type'] = $bumpProduct->digital_fulfillment_type ?? 'file';
                $bumpConfig['file_url'] = !empty($bumpConfig['file_url']) ? $bumpConfig['file_url'] : $bumpProduct->digital_file_url;
                $bumpConfig['external_url'] = $bumpProduct->digital_external_url;
                $bumpConfig['license_key'] = $bumpProduct->digital_license_key;
                $bumpConfig['calendar_id'] = $bumpProduct->calendar_id;

                if ($bumpProduct->product_type === 'physical' && $bumpProduct->inventory_quantity !== null) {
                    $bumpProduct->decrement('inventory_quantity', 1);
                }
            }

            $totalAmount += $bumpPrice;
            $orderBumpIncluded = true;
            $orderBumpData = $bumpConfig;

            $lineItems[] = [
                'product_id' => $bumpProduct ? $bumpProduct->id : null,
                'name' => '[BUMP OFFER] ' . ($bumpConfig['title'] ?? 'Bonus Upsell Offer'),
                'price' => $bumpPrice,
                'quantity' => 1,
                'total' => $bumpPrice,
                'is_bump' => true,
            ];
        }

        $orderNumber = 'WM-' . strtoupper(Str::random(6));
        $accessToken = Str::random(32);

        // Find or create customer contact in workspace
        $fullName = trim($validated['customer_name']);
        $parts = preg_split('/\s+/u', $fullName, 2) ?: [];
        $firstName = $parts[0] ?? $fullName;
        $lastName = $parts[1] ?? '';

        $contactService = app(\App\Modules\Shared\Services\ContactService::class);
        $contact = $contactService->upsert($store->workspace_id, [
            'phone_e164' => $validated['customer_phone'],
            'email' => $validated['customer_email'],
            'first_name' => $firstName,
            'last_name' => $lastName,
            'source' => 'storefront',
        ]);

        $order = EcommerceOrder::create([
            'workspace_id' => $store->workspace_id,
            'store_id' => $store->id,
            'contact_id' => $contact->id,
            'external_order_id' => (string) Str::uuid(),
            'number' => $orderNumber,
            'access_token' => $accessToken,
            'platform' => $store->platform,
            'total' => $totalAmount,
            'currency' => 'USD',
            'financial_status' => 'paid',
            'fulfillment_status' => 'fulfilled',
            'placed_at' => now(),
            'line_items' => $lineItems,
            'raw' => [
                'customer_name' => $validated['customer_name'],
                'email' => $validated['customer_email'],
                'phone' => $validated['customer_phone'],
                'payment_method' => $validated['payment_method'],
                'created_via' => 'public_storefront',
                'coupon_code' => $couponCode !== '' ? $couponCode : null,
                'discount_amount' => $discountAmount,
                'order_bump_included' => $orderBumpIncluded,
                'order_bump_data' => $orderBumpData,
            ],
        ]);

        $vaultUrl = route('public.storefront.vault', $accessToken);

        return response()->json([
            'success' => true,
            'order_number' => $orderNumber,
            'total' => number_format($totalAmount, 2),
            'vault_url' => $vaultUrl,
            'message' => 'Order placed successfully!',
        ]);
    }

    public function digitalVault(string $token): Response
    {
        $order = EcommerceOrder::where('access_token', $token)->firstOrFail();

        $lineItems = $order->line_items ?? [];
        $firstItem = $lineItems[0] ?? null;

        $product = null;
        if ($firstItem && isset($firstItem['product_id'])) {
            $product = EcommerceProduct::find($firstItem['product_id']);
        }

        return Inertia::render('Public/Storefront/DigitalVault', [
            'order' => [
                'number' => $order->number,
                'access_token' => $order->access_token,
                'download_count' => $order->download_count ?? 0,
                'created_at' => $order->created_at ? $order->created_at->toFormattedDateString() : null,
                'customer_name' => $order->raw['customer_name'] ?? 'Valued Customer',
                'order_bump_data' => $order->raw['order_bump_data'] ?? null,
            ],
            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'image_url' => $product->image_url,
                'digital_fulfillment_type' => $product->digital_fulfillment_type ?? 'file',
                'digital_file_url' => $product->digital_file_url,
                'digital_external_url' => $product->digital_external_url,
                'digital_license_key' => $product->digital_license_key,
                'digital_download_limit' => $product->digital_download_limit ?? 5,
                'calendar_id' => $product->calendar_id,
                'calendar_slug' => $product->calendar?->slug,
            ] : null,
        ]);
    }

    public function downloadDigitalFile(string $token)
    {
        $order = EcommerceOrder::where('access_token', $token)->firstOrFail();

        $lineItems = $order->line_items ?? [];
        $firstItem = $lineItems[0] ?? null;

        if (!$firstItem || !isset($firstItem['product_id'])) {
            abort(404, 'No digital content associated with this order.');
        }

        $product = EcommerceProduct::findOrFail($firstItem['product_id']);
        $maxLimit = $product->digital_download_limit ?? 5;

        if ($order->download_count >= $maxLimit) {
            return back()->with('error', 'Download limit exceeded for this purchase.');
        }

        $order->increment('download_count');

        if ($product->digital_fulfillment_type === 'external_link' && $product->digital_external_url) {
            return redirect()->away($product->digital_external_url);
        }

        if ($product->digital_file_url) {
            return redirect()->away($product->digital_file_url);
        }

        return back()->with('error', 'Digital download file is not configured.');
    }

    private function resolveStore(string $slug): EcommerceStore
    {
        // 1. If numeric, check direct EcommerceStore ID or Workspace ID
        if (is_numeric($slug)) {
            $storeById = EcommerceStore::find((int) $slug);
            if ($storeById) {
                return $storeById;
            }

            $workspaceStore = EcommerceStore::where('workspace_id', (int) $slug)
                ->where('platform', 'native')
                ->first();
            if ($workspaceStore) {
                return $workspaceStore;
            }
        }

        // 2. Prioritize Native store with matching slug
        $nativeStore = EcommerceStore::where('platform', 'native')
            ->where('slug', $slug)
            ->first();

        if ($nativeStore) {
            return $nativeStore;
        }

        // 3. Check by store slug, uuid, or name
        $store = EcommerceStore::where('slug', $slug)
            ->orWhere('uuid', $slug)
            ->orWhere('name', 'like', "%{$slug}%")
            ->first();

        if ($store) {
            return $store;
        }

        // 4. Check by workspace ID or name
        $workspace = Workspace::where('id', $slug)
            ->orWhere('name', 'like', "%{$slug}%")
            ->first();

        if ($workspace) {
            return EcommerceStore::getOrCreateNativeStore($workspace->id);
        }

        return EcommerceStore::getOrCreateNativeStore(1);
    }
}
