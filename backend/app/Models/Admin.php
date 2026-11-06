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
        'permission_group_id',
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

    /** Role descriptor (code, name, level) for the UI. */
    public function getAdminRoleAttribute(): ?array
    {
        return PermissionMatrix::getAllRoles()[$this->role] ?? null;
    }

    /** Effective permissions: role defaults ∪ custom permission group ∪ individually granted. */
    public function getAllPermissionsAttribute(): array
    {
        $granted = is_array($this->permissions) ? $this->permissions : [];
        $group = [];
        if ($this->permission_group_id) {
            $raw = \Illuminate\Support\Facades\DB::table('permission_groups')->where('id', $this->permission_group_id)->value('permissions');
            $group = json_decode($raw ?? '[]', true) ?: [];
        }

        return array_values(array_unique(array_merge(PermissionMatrix::getDefaultPermissionsForRole((string) $this->role), $group, $granted)));
    }

    public function isOwner(): bool
    {
        return $this->role === PermissionMatrix::ROLE_OWNER;
    }

    public function hasPermission(string $permission): bool
    {
        return $this->isOwner() || in_array($permission, $this->all_permissions, true);
    }

    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
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
