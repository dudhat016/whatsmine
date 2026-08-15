<?php

namespace App\Modules\Shared\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChannelAccount extends Model
{
    protected $fillable = [
        'workspace_id', 'channel', 'provider', 'credentials',
        'display_name', 'phone_number_id', 'business_account_id', 'status', 'meta_json',
    ];

    protected $hidden = ['credentials'];

    protected function casts(): array
    {
        return [
            'meta_json' => 'array',
        ];
    }

    public function getCredentialsAttribute(): array
    {
        $raw = $this->attributes['credentials'] ?? null;
        if (! $raw) {
            return [];
        }
        try {
            $decrypted = decrypt($raw);
            return is_array($decrypted) ? $decrypted : (json_decode((string) $decrypted, true) ?? []);
        } catch (\Throwable) {
            return is_string($raw) ? (json_decode($raw, true) ?? []) : [];
        }
    }

    public function setCredentialsAttribute($value): void
    {
        if (empty($value)) {
            $this->attributes['credentials'] = null;
        } else {
            $this->attributes['credentials'] = encrypt(is_array($value) ? json_encode($value) : $value);
        }
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }
}
