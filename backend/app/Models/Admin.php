<?php

namespace App\Models;

use App\Services\Authorization\PermissionMatrix;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids;

    protected $table = 'admins';

    protected $fillable = [
        'ho_ten',
        'email',
        'password',
        'so_dien_thoai',
        'dia_chi',
        'role',
        'partner_id',
        'permissions',
        'tinh_trang',
        'last_login_at',
    ];

    protected $attributes = [
        'tinh_trang' => 1,
        'role'       => 'owner',
    ];

    protected $appends = [
        'admin_role',
        'all_permissions',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password'    => 'hashed',
            'permissions' => 'array',
            'tinh_trang'  => 'integer',
        ];
    }


    /**
     * Danh sách bài viết do Admin tạo
     */
    public function posts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Post::class, 'author_id');
    }

    /**
     * Danh sách bài viết do Admin duyệt
     */
    public function reviewedPosts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Post::class, 'reviewer_id');
    }
}
