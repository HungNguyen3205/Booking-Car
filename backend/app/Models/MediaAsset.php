<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\File;

class MediaAsset extends Model
{
    use HasFactory;

    public const VISIBILITY_PUBLIC  = 'public';
    public const VISIBILITY_PRIVATE = 'private';

    public const COLLECTION_CARS       = 'cars';
    public const COLLECTION_MARKETING  = 'marketing';
    public const COLLECTION_RECEIPTS   = 'receipts';
    public const COLLECTION_HANDOVERS  = 'handovers';
    public const COLLECTION_GENERAL    = 'general';

    protected $table = 'media_assets';

    protected $fillable = [
        'filename',
        'original_name',
        'disk',
        'path',
        'url',
        'mime_type',
        'extension',
        'size',
        'width',
        'height',
        'visibility',
        'collection',
        'uploaded_by_id',
        'uploaded_by_type',
        'alt_text',
        'description',
    ];

    protected $casts = [
        'size'   => 'integer',
        'width'  => 'integer',
        'height' => 'integer',
    ];

    protected $appends = [
        'formatted_size',
        'display_url',
        'is_image',
    ];

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size ?? 0;
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 1) . ' KB';
        }
        return $bytes . ' B';
    }

    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type ?? '', 'image/');
    }

    public function getDisplayUrlAttribute(): string
    {
        if ($this->visibility === self::VISIBILITY_PUBLIC && $this->url) {
            return $this->url;
        }

        // Tệp riêng tư: phục vụ qua route API stream có phân quyền
        return url("/api/admin/media/{$this->id}/stream");
    }

    /**
     * Tra cứu tất cả các vị trí trong hệ thống đang tham chiếu đến asset này.
     * Kiểm tra xe (ảnh đại diện, gallery), đơn đặt xe (biên lai), giao nhận và cấu hình.
     */
    public function getReferences(): array
    {
        $refs = [
            'cars_featured' => [],
            'cars_gallery'  => [],
            'bookings'      => [],
            'handovers'     => [],
            'settings'      => [],
            'total_count'   => 0,
        ];

        $targetUrl = $this->url;
        $targetFile = $this->filename;

        // 1. Kiểm tra xe dùng làm ảnh đại diện
        if ($targetUrl || $targetFile) {
            $featuredCars = Car::where(function ($q) use ($targetUrl, $targetFile) {
                if ($targetUrl && $targetFile) {
                    $q->where('image', $targetUrl)
                      ->orWhere('image', 'like', '%' . $targetFile . '%');
                } elseif ($targetUrl) {
                    $q->where('image', $targetUrl);
                } elseif ($targetFile) {
                    $q->where('image', 'like', '%' . $targetFile . '%');
                }
            })->select('id', 'name', 'license_plate')->get();

            foreach ($featuredCars as $car) {
                $refs['cars_featured'][] = [
                    'id'            => $car->id,
                    'name'          => $car->name,
                    'license_plate' => $car->license_plate,
                    'type'          => 'Ảnh đại diện xe',
                ];
            }
        }

        // 2. Kiểm tra xe dùng trong gallery ảnh
        $galleryCars = Car::whereNotNull('gallery')->get();
        foreach ($galleryCars as $car) {
            $gallery = is_array($car->gallery) ? $car->gallery : (json_decode($car->gallery, true) ?? []);
            if (is_string($car->gallery) && !is_array($gallery)) {
                $gallery = array_filter(array_map('trim', explode("\n", $car->gallery)));
            }

            $matched = false;
            foreach ($gallery as $gUrl) {
                if (($targetUrl && str_contains($gUrl, $targetUrl)) || ($targetFile && str_contains($gUrl, $targetFile))) {
                    $matched = true;
                    break;
                }
            }

            if ($matched) {
                $refs['cars_gallery'][] = [
                    'id'            => $car->id,
                    'name'          => $car->name,
                    'license_plate' => $car->license_plate,
                    'type'          => 'Thư viện ảnh xe',
                ];
            }
        }

        // 3. Kiểm tra đơn đặt xe (biên lai thanh toán)
        if ($targetFile) {
            $bookings = Booking::where(function ($q) use ($targetFile, $targetUrl) {
                $q->where('bill_image', 'like', '%' . $targetFile . '%');
                if ($targetUrl) {
                    $q->orWhere('bill_image', $targetUrl);
                }
            })->select('id', 'ma_dat_xe')->get();

            foreach ($bookings as $b) {
                $refs['bookings'][] = [
                    'id'         => $b->id,
                    'ma_dat_xe'  => $b->ma_dat_xe,
                    'type'       => 'Biên lai chuyển khoản',
                ];
            }
        }

        $refs['total_count'] = count($refs['cars_featured']) + count($refs['cars_gallery']) + count($refs['bookings']);

        return $refs;
    }

    /**
     * Lấy đường dẫn tệp thực tế trên ổ đĩa máy chủ.
     */
    public function getAbsolutePath(): ?string
    {
        if ($this->disk === 'public') {
            return public_path(ltrim($this->path, '/'));
        }

        return storage_path('app/' . ltrim($this->path, '/'));
    }

    /**
     * Kiểm tra tệp vật lý có thực sự tồn tại trên máy chủ hay không.
     */
    public function fileExistsOnDisk(): bool
    {
        $path = $this->getAbsolutePath();
        return $path && File::exists($path);
    }

    // Scopes
    public function scopePublic($query)
    {
        return $query->where('visibility', self::VISIBILITY_PUBLIC);
    }

    public function scopePrivate($query)
    {
        return $query->where('visibility', self::VISIBILITY_PRIVATE);
    }

    public function scopeFilter($query, array $filters)
    {
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('original_name', 'like', $search)
                  ->orWhere('filename', 'like', $search)
                  ->orWhere('alt_text', 'like', $search)
                  ->orWhere('description', 'like', $search);
            });
        }

        if (!empty($filters['visibility']) && $filters['visibility'] !== 'all') {
            $query->where('visibility', $filters['visibility']);
        }

        if (!empty($filters['collection']) && $filters['collection'] !== 'all') {
            $query->where('collection', $filters['collection']);
        }

        if (!empty($filters['mime_type'])) {
            if ($filters['mime_type'] === 'image') {
                $query->where('mime_type', 'like', 'image/%');
            } elseif ($filters['mime_type'] === 'document') {
                $query->where(function ($q) {
                    $q->where('mime_type', 'like', '%pdf%')
                      ->orWhere('mime_type', 'like', '%document%')
                      ->orWhere('mime_type', 'like', '%text%');
                });
            } else {
                $query->where('mime_type', $filters['mime_type']);
            }
        }

        return $query;
    }
}
