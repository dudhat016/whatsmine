<?php

namespace App\Modules\Pipelines\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class LeadPipeline extends Model
{
    use HasFactory;

    protected $table = 'lead_pipelines';

    protected $fillable = [
        'uuid',
        'workspace_id',
        'name',
        'slug',
        'label_color',
        'is_default',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
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

    public function stages(): HasMany
    {
        return $this->hasMany(PipelineStage::class, 'pipeline_id')->orderBy('priority', 'asc');
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class, 'pipeline_id');
    }
}
