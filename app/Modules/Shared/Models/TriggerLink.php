<?php

namespace App\Modules\Shared\Models;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class TriggerLink extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'target_url',
        'slug',
        'clicks_count',
    ];

    protected $casts = [
        'clicks_count' => 'integer',
    ];

    protected $appends = [
        'tracked_url',
        'merge_tag',
    ];

    protected static function booted(): void
    {
        static::creating(function (TriggerLink $link) {
            if (empty($link->slug)) {
                $base = Str::slug($link->name, '_');
                $slug = $base ?: 'link_' . Str::lower(Str::random(6));
                $count = static::where('workspace_id', $link->workspace_id)->where('slug', 'like', "{$slug}%")->count();
                $link->slug = $count > 0 ? "{$slug}_{$count}" : $slug;
            }
        });
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(TriggerLinkClick::class);
    }

    public function getTrackedUrlAttribute(): string
    {
        return url('/l/' . $this->slug);
    }

    public function getMergeTagAttribute(): string
    {
        return "{{ trigger_links.{$this->slug} }}";
    }
}
