<?php

namespace App\Modules\Pipelines\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLeadboardSetting extends Model
{
    use HasFactory;

    protected $table = 'user_leadboard_settings';

    protected $fillable = [
        'user_id',
        'pipeline_stage_id',
        'collapsed',
    ];

    protected function casts(): array
    {
        return [
            'collapsed' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'pipeline_stage_id');
    }
}
