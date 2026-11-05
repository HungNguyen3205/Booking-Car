<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class PostCategory extends Model
{
    use HasFactory;

    protected $table = 'post_categories';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'is_active'     => 'boolean',
        'display_order' => 'integer',
    ];

    /**
     * Danh sách bài viết thuộc chuyên mục
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'category_id');
    }

    /**
     * Scope lọc chuyên mục đang hoạt động
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Tạo slug duy nhất từ tên chuyên mục
     */
    public static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name, '-');
        if (empty($baseSlug)) {
            $baseSlug = 'chuyen-muc';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (static::where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
