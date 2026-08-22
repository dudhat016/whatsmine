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
        'submissions_count',
    ];

    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'settings' => 'array',
            'double_optin_enabled' => 'boolean',
            'gdpr_checkbox' => 'boolean',
            'is_active' => 'boolean',
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

    public function submissions(): HasMany
    {
        return $this->hasMany(SubscriptionFormSubmission::class, 'form_id');
    }
}
