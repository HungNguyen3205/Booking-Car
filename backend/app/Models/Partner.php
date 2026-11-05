<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'partners';

    protected $fillable = [
        'name',
        'slug',
        'phone',
        'email',
        'address',
        'commission_rate',
        'contract_number',
        'bank_name',
        'bank_account',
        'bank_holder',
        'branding',
        'status',
    ];

    protected $casts = [
        'branding' => 'array',
        'commission_rate' => 'float',
    ];

    public function domains()
    {
        return $this->hasMany(PartnerDomain::class, 'partner_id');
    }

    public function vehicles()
    {
        return $this->hasMany(BusVehicle::class, 'partner_id');
    }

    public function routes()
    {
        return $this->hasMany(Route::class, 'partner_id');
    }

    public function drivers()
    {
        return $this->hasMany(Driver::class, 'partner_id');
    }

    public function trips()
    {
        return $this->hasMany(BusTrip::class, 'partner_id');
    }

    public function bookings()
    {
        return $this->hasMany(TicketBooking::class, 'partner_id');
    }

    public function reconciliations()
    {
        return $this->hasMany(Reconciliation::class, 'partner_id');
    }
}

