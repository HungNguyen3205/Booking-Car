<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerNote extends Model
{
    use HasFactory;

    protected $table = 'customer_notes';

    protected $fillable = [
        'user_id',
        'admin_id',
        'admin_name',
        'content',
    ];

    /**
     * Khách hàng sở hữu ghi chú này
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Quản trị viên/chuyên viên tạo ghi chú
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }
}
