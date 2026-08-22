<?php

namespace App\Modules\Pipelines\Models;

use App\Models\User;
use App\Modules\Shared\Models\Contact;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Deal extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'deals';

    protected $fillable = [
        'uuid',
        'workspace_id',
        'pipeline_id',
        'stage_id',
        'contact_id',
        'assigned_user_id',
        'deal_watcher_id',
        'name',
        'monetary_value',
        'currency_code',
        'status',
        'source',
        'column_priority',
        'next_follow_up',
        'expected_close_date',
        'lost_reason',
    ];

    protected function casts(): array
    {
        return [
            'monetary_value' => 'float',
            'column_priority' => 'integer',
            'expected_close_date' => 'date',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function pipeline(): BelongsTo
    {
        return $this->belongsTo(LeadPipeline::class, 'pipeline_id');
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'stage_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id')->withTrashed();
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function dealWatcher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deal_watcher_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(DealHistory::class, 'deal_id')->orderBy('created_at', 'desc');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(DealFollowUp::class, 'deal_id')->orderBy('follow_up_date', 'asc');
    }
}
