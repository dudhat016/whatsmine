<?php

namespace App\Modules\Funnels\Models;

use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceProductPrice;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FunnelStepProduct extends Model
{
    protected $table = 'funnel_step_products';

    protected $fillable = [
        'workspace_id',
        'funnel_step_id',
        'product_id',
        'product_price_id',
        'name',
        'type',
        'offer_type',
        'price',
        'bump_headline',
        'bump_description',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price'      => 'decimal:2',
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function step(): BelongsTo
    {
        return $this->belongsTo(FunnelStep::class, 'funnel_step_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(EcommerceProduct::class, 'product_id');
    }

    public function price(): BelongsTo
    {
        return $this->belongsTo(EcommerceProductPrice::class, 'product_price_id');
    }
}
