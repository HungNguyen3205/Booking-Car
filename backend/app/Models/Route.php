<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Route extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'routes';

    protected $fillable = [
        'partner_id',
        'name',
        'from_city',
        'to_city',
        'distance_km',
        'duration_minutes',
        'base_price',
        'status',
    ];

    protected $casts = [
        'distance_km' => 'integer',
        'duration_minutes' => 'integer',
        'base_price' => 'integer',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }

    public function stops()
    {
        return $this->hasMany(RouteStop::class, 'route_id')->orderBy('sort_order', 'asc');
    }

    public function trips()
    {
        return $this->hasMany(BusTrip::class, 'route_id');
    }
}

