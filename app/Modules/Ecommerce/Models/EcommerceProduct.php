<?php

namespace App\Modules\Ecommerce\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $workspace_id
 * @property int $store_id
 * @property string $external_id
 * @property string $platform
 * @property string $name
 * @property string|null $sku
 * @property float $price
 * @property int|null $inventory_quantity
 * @property string|null $status
 * @property string|null $image_url
 */
class EcommerceProduct extends Model
{
    protected $table = 'ecommerce_products';

    protected $fillable = [
        'workspace_id', 'store_id', 'external_id', 'platform', 'name', 'slug', 'description', 'sku',
        'price', 'compare_price', 'pricing_type', 'billing_interval', 'billing_interval_count', 'trial_days',
        'installment_count', 'product_type', 'inventory_quantity', 'status', 'image_url', 'raw',
        'digital_fulfillment_type', 'digital_file_url', 'digital_external_url', 'digital_license_key',
        'digital_download_limit', 'digital_expiration_days', 'calendar_id',
    ];

    protected static function booted(): void
    {
        static::saving(function (EcommerceProduct $product) {
            if (empty($product->slug) && !empty($product->name)) {
                $baseSlug = \Illuminate\Support\Str::slug($product->name);
                $slug = $baseSlug ?: 'product';
                $count = 1;

                while (static::where('store_id', $product->store_id)
                    ->where('slug', $slug)
                    ->where('id', '!=', $product->id ?? 0)
                    ->exists()
                ) {
                    $slug = "{$baseSlug}-{$count}";
                    $count++;
                }

                $product->slug = $slug;
            }
        });
    }

    protected $hidden = [];

    protected function casts(): array
    {
        return [
            'raw' => 'array',
            'price' => 'decimal:2',
            'inventory_quantity' => 'integer',
            'billing_interval_count' => 'integer',
            'trial_days' => 'integer',
            'installment_count' => 'integer',
            'calendar_id' => 'integer',
        ];
    }

    public function prices(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(EcommerceProductPrice::class, 'product_id')->orderBy('sort_order', 'asc');
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(EcommerceStore::class, 'store_id');
    }

    public function calendar(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Calendars\Models\BookingCalendar::class, 'calendar_id');
    }
}
