<?php

namespace App\Modules\Funnels\Models;

use App\Modules\Shared\Models\Contact;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class SubscriptionForm extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'subscription_forms';

    protected $fillable = [
        'workspace_id',
        'folder_id',
        'name',
        'title',
        'slug',
        'type',
        'description',
        'fields',
        'settings',
        'double_optin_enabled',
        'optin_channel',
        'gdpr_checkbox',
        'gdpr_text',
        'is_active',
        'is_order_form',
        'order_form_type',
        'currency',
        'order_bump_settings',
        'coupon_enabled',
        'submissions_count',
    ];

    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'settings' => 'array',
            'order_bump_settings' => 'array',
            'double_optin_enabled' => 'boolean',
            'gdpr_checkbox' => 'boolean',
            'is_active' => 'boolean',
            'is_order_form' => 'boolean',
            'coupon_enabled' => 'boolean',
            'submissions_count' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->name) . '-' . Str::lower(Str::random(6));
            }
        });
    }

    public function folder(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(SubscriptionFormFolder::class, 'folder_id');
    }

    public function formProducts(): HasMany
    {
        return $this->hasMany(SubscriptionFormProduct::class, 'form_id')->orderBy('sort_order', 'asc');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(SubscriptionFormSubmission::class, 'form_id');
    }

    public function views(): HasMany
    {
        return $this->hasMany(SubscriptionFormView::class, 'form_id');
    }
}
