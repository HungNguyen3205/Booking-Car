<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusTrip extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'bus_trips';

    protected $fillable = [
        'partner_id',
        'route_id',
        'bus_vehicle_id',
        'driver_id',
        'depart_time',
        'arrive_time',
        'base_price',
        'status',
        'seat_inventory',
    ];

    protected $casts = [
        'depart_time' => 'datetime',
        'arrive_time' => 'datetime',
        'base_price' => 'integer',
        'seat_inventory' => 'array',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(BusVehicle::class, 'bus_vehicle_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function bookings()
    {
        return $this->hasMany(TicketBooking::class, 'trip_id');
    }
}

