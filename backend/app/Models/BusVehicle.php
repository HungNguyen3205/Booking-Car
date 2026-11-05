<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusVehicle extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'bus_vehicles';

    protected $fillable = [
        'partner_id',
        'seat_layout_id',
        'name',
        'plate_number',
        'category',
        'capacity',
        'floor_count',
        'amenities',
        'image_url',
        'inspection_date',
        'status',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'floor_count' => 'integer',
        'amenities' => 'array',
        'inspection_date' => 'date',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function seatLayout()
    {
        return $this->belongsTo(SeatLayout::class, 'seat_layout_id');
    }

    public function trips()
    {
        return $this->hasMany(BusTrip::class, 'bus_vehicle_id');
    }
}

