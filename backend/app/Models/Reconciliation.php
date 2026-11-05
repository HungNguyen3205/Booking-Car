<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reconciliation extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'reconciliations';

    protected $fillable = [
        'code',
        'partner_id',
        'period_start',
        'period_end',
        'total_tickets',
        'total_revenue',
        'commission_rate',
        'commission_amount',
        'payout_amount',
        'status',
        'settled_at',
        'payment_ref',
        'notes',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'settled_at' => 'datetime',
        'total_tickets' => 'integer',
        'total_revenue' => 'integer',
        'commission_rate' => 'float',
        'commission_amount' => 'integer',
        'payout_amount' => 'integer',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }
}

