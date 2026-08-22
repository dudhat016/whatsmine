<?php

namespace App\Modules\Pipelines\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DealFollowUp extends Model
{
    use HasFactory;

    protected $table = 'deal_follow_ups';

    protected $fillable = [
        'deal_id',
        'user_id',
        'follow_up_date',
        'remark',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'follow_up_date' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'deal_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
