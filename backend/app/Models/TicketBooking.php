<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketBooking extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ticket_bookings';

    protected $fillable = [
        'booking_code',
        'partner_id',
        'trip_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'seats',
        'seat_count',
        'pickup_stop_id',
        'dropoff_stop_id',
        'pickup_custom',
        'dropoff_custom',
        'total_amount',
        'discount_amount',
        'final_amount',
        'payment_status',
        'booking_status',
        'payment_method',
        'payment_ref',
        'notes',
        'created_by_admin_id',
    ];

    protected $casts = [
        'seats' => 'array',
        'seat_count' => 'integer',
        'total_amount' => 'integer',
        'discount_amount' => 'integer',
        'final_amount' => 'integer',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function trip()
    {
        return $this->belongsTo(BusTrip::class, 'trip_id');
    }

    public function pickupStop()
    {
        return $this->belongsTo(RouteStop::class, 'pickup_stop_id');
    }

    public function dropoffStop()
    {
        return $this->belongsTo(RouteStop::class, 'dropoff_stop_id');
    }

    public function transactions()
    {
        return $this->hasMany(BookingTransaction::class, 'booking_id');
    }
}

