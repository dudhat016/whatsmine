<?php

namespace App\Modules\Pipelines\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class PipelineStage extends Model
{
    use HasFactory;

    protected $table = 'pipeline_stages';

    protected $fillable = [
        'uuid',
        'pipeline_id',
        'name',
        'slug',
        'color',
        'probability',
        'show_in_funnel',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'probability' => 'integer',
            'show_in_funnel' => 'boolean',
            'priority' => 'integer',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->name);
            }
        });
    }

    public function pipeline(): BelongsTo
    {
        return $this->belongsTo(LeadPipeline::class, 'pipeline_id');
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class, 'stage_id')->orderBy('column_priority', 'asc');
    }
}
