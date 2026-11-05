<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeatLayout extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'seat_layouts';

    protected $fillable = [
        'partner_id',
        'name',
        'vehicle_type',
        'total_seats',
        'floors',
        'rows',
        'columns',
        'layout_matrix',
    ];

    protected $casts = [
        'floors' => 'integer',
        'rows' => 'integer',
        'columns' => 'integer',
        'total_seats' => 'integer',
        'layout_matrix' => 'array',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function vehicles()
    {
        return $this->hasMany(BusVehicle::class, 'seat_layout_id');
    }
}

