<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomDomain extends Model
{
    use HasFactory;

    protected $table = 'custom_domains';

    public const TYPE_APP_WHITELABEL = 'app_whitelabel';
    public const TYPE_FUNNEL         = 'funnel';
    public const TYPE_ECOMMERCE      = 'ecommerce';
    public const TYPE_BOOKING        = 'booking';
    public const TYPE_UNIVERSAL      = 'universal';

    protected $fillable = [
        'workspace_id',
        'client_id',
        'domain',
        'type',
        'target_id',
        'fallback_url',
        'is_verified',
        'dns_status',
        'ssl_status',
        'verification_token',
        'dns_records',
        'settings',
        'last_checked_at',
    ];

    protected $casts = [
        'is_verified'     => 'boolean',
        'dns_records'     => 'array',
        'settings'        => 'array',
        'last_checked_at' => 'datetime',
    ];

    protected $attributes = [
        'type'        => self::TYPE_FUNNEL,
        'dns_status'  => 'pending',
        'ssl_status'  => 'pending',
        'is_verified' => false,
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function isSubdomain(): bool
    {
        $parts = explode('.', $this->domain);
        return count($parts) > 2;
    }

    public function getSubdomainAttribute(): ?string
    {
        if (!$this->isSubdomain()) {
            return '@';
        }

        $parts = explode('.', $this->domain);
        return $parts[0];
    }

    public function getExpectedCnameTarget(): string
    {
        $appHost = parse_url(config('app.url'), PHP_URL_HOST) ?? 'custom.whatsmine.com';
        return config('domains.cname_target', $appHost);
    }

    public function getExpectedIpTarget(): string
    {
        return config('domains.a_record_target', '162.159.137.91');
    }

    public function getResolvedTargetNameAttribute(): ?string
    {
        if (!$this->target_id) {
            return match ($this->type) {
                self::TYPE_APP_WHITELABEL => 'Agency App & Login Portal',
                self::TYPE_ECOMMERCE      => 'All Products & Storefront',
                self::TYPE_BOOKING        => 'All Booking Calendars',
                default                   => 'Workspace Default Landing',
            };
        }

        return match ($this->type) {
            self::TYPE_FUNNEL => \App\Modules\Funnels\Models\Funnel::find($this->target_id)?->name ?? 'Funnel #' . $this->target_id,
            self::TYPE_ECOMMERCE => \App\Modules\Ecommerce\Models\EcommerceStore::find($this->target_id)?->name ?? 'Store #' . $this->target_id,
            self::TYPE_BOOKING => \App\Modules\Calendars\Models\BookingCalendar::find($this->target_id)?->name ?? 'Calendar #' . $this->target_id,
            default => 'Target #' . $this->target_id,
        };
    }
}
