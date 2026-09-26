<?php

namespace App\Modules\Ecommerce\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EcommerceProductPrice extends Model
{
    protected $table = 'ecommerce_product_prices';

    protected $fillable = [
        'workspace_id',
        'product_id',
        'name',
        'pricing_type',
        'price',
        'compare_price',
        'billing_interval',
        'billing_interval_count',
        'trial_days',
        'installment_count',
        'is_default',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'compare_price' => 'decimal:2',
            'billing_interval_count' => 'integer',
            'trial_days' => 'integer',
            'installment_count' => 'integer',
            'is_default' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(EcommerceProduct::class, 'product_id');
    }
}
