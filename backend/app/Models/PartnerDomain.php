<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerDomain extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'partner_domains';

    protected $fillable = [
        'partner_id',
        'domain',
        'subdomain',
        'app_slug',
        'is_verified',
        'ssl_status',
        'settings',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'settings' => 'array',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }
}

