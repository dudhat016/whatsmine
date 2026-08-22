<?php

namespace App\Modules\Pipelines\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DealHistory extends Model
{
    use HasFactory;

    protected $table = 'deal_histories';

    public $timestamps = false;

    protected $fillable = [
        'deal_id',
        'event_type',
        'stage_from_id',
        'stage_to_id',
        'user_id',
        'remarks',
        'created_at',
    ];

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'deal_id');
    }

    public function stageFrom(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'stage_from_id');
    }

    public function stageTo(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'stage_to_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
