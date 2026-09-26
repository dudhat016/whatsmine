<?php

namespace App\Modules\Funnels\Models;

use App\Modules\Ecommerce\Models\EcommerceProduct;
use App\Modules\Ecommerce\Models\EcommerceProductPrice;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionFormProduct extends Model
{
    protected $table = 'subscription_form_products';

    protected $fillable = [
        'workspace_id',
        'form_id',
        'product_id',
        'product_price_id',
        'is_default',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function form(): BelongsTo
    {
        return $this->belongsTo(SubscriptionForm::class, 'form_id');
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
