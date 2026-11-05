<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    // Các trạng thái bài viết
    public const STATUS_DRAFT          = 'draft';          // Bản nháp
    public const STATUS_PENDING_REVIEW = 'pending_review'; // Chờ duyệt
    public const STATUS_PUBLISHED      = 'published';      // Đã xuất bản
    public const STATUS_ARCHIVED       = 'archived';       // Lưu trữ

    protected $table = 'posts';

    protected $fillable = [
        'title',
        'slug',
        'summary',
        'content',
        'featured_image',
        'featured_image_alt',
        'category_id',
        'author_id',
        'status',
        'published_at',
        'reviewer_id',
        'reviewed_at',
        'rejection_reason',
        'pending_changes',
        'has_pending_revision',
        'views_count',
        'meta_title',
        'meta_description',
        'meta_keywords',
    ];

    protected $casts = [
        'published_at'         => 'datetime',
        'reviewed_at'          => 'datetime',
        'pending_changes'      => 'array',
        'has_pending_revision' => 'boolean',
        'views_count'          => 'integer',
    ];

    protected $appends = [
        'reading_time',
        'status_label',
    ];

    /**
     * Chuyên mục của bài viết
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(PostCategory::class, 'category_id');
    }

    /**
     * Tác giả bài viết (Quản trị viên)
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'author_id');
    }

    /**
     * Người kiểm duyệt bài viết
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'reviewer_id');
    }

    /**
     * Scope bài viết công khai hợp lệ
     * Điều kiện: status = published, published_at <= hiện tại, chưa bị xóa mềm
     */
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED)
                     ->whereNotNull('published_at')
                     ->where('published_at', '<=', now());
    }

    /**
     * Scope bộ lọc tìm kiếm cho trang quản trị
     */
    public function scopeFilter($query, array $filters = [])
    {
        if (!empty($filters['search'])) {
            $keyword = trim($filters['search']);
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                  ->orWhere('summary', 'like', "%{$keyword}%")
                  ->orWhere('slug', 'like', "%{$keyword}%")
                  ->orWhereHas('author', function ($aq) use ($keyword) {
                      $aq->where('ho_ten', 'like', "%{$keyword}%");
                  });
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            if ($filters['status'] === 'trashed') {
                $query->onlyTrashed();
            } else {
                $query->where('status', $filters['status']);
            }
        }

        if (!empty($filters['category_id']) && $filters['category_id'] !== 'all') {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['author_id']) && $filters['author_id'] !== 'all') {
            $query->where('author_id', $filters['author_id']);
        }

        if (isset($filters['has_pending_revision']) && $filters['has_pending_revision'] !== '') {
            $query->where('has_pending_revision', (bool) $filters['has_pending_revision']);
        }

        return $query;
    }

    /**
     * Tạo slug duy nhất tự động từ tiêu đề bài viết
     */
    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title, '-');
        if (empty($baseSlug)) {
            $baseSlug = 'bai-viet-' . time();
        }

        $slug = $baseSlug;
        $counter = 1;

        // Kiểm tra tính duy nhất (kể cả trong thùng rác để tránh xung đột routing)
        while (static::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /**
     * Ước tính thời gian đọc bài (phút)
     */
    public function getReadingTimeAttribute(): int
    {
        $wordCount = str_word_count(strip_tags($this->content ?? ''));
        return max(1, (int) ceil($wordCount / 200));
    }

    /**
     * Nhãn trạng thái tiếng Việt
     */
    public function getStatusLabelAttribute(): string
    {
        if ($this->trashed()) {
            return 'Thùng rác';
        }

        return match ($this->status) {
            self::STATUS_DRAFT          => 'Bản nháp',
            self::STATUS_PENDING_REVIEW => 'Chờ duyệt',
            self::STATUS_PUBLISHED      => 'Đã xuất bản',
            self::STATUS_ARCHIVED       => 'Lưu trữ',
            default                     => 'Không xác định',
        };
    }
}
