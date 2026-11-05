<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'drivers';

    protected $fillable = [
        'partner_id',
        'name',
        'phone',
        'license_number',
        'license_class',
        'license_expiry',
        'status',
    ];

    protected $casts = [
        'license_expiry' => 'date',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function trips()
    {
        return $this->hasMany(BusTrip::class, 'driver_id');
    }
}

