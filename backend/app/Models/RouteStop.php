<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RouteStop extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'route_stops';

    protected $fillable = [
        'route_id',
        'name',
        'address',
        'stop_type',
        'time_offset_minutes',
        'extra_fee',
        'sort_order',
    ];

    protected $casts = [
        'time_offset_minutes' => 'integer',
        'extra_fee' => 'integer',
        'sort_order' => 'integer',
    ];

    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id');
    }
}

