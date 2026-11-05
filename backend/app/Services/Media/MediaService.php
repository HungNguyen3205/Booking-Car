<?php

namespace App\Services\Media;

use App\Models\MediaAsset;
use App\Models\Admin;
use App\Models\User;
use App\Services\Authorization\PermissionMatrix;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MediaService
{
    public const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

    public const ALLOWED_IMAGE_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    public const ALLOWED_DOCUMENT_MIMES = [
        'application/pdf',
    ];

    public const ALLOWED_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'webp', 'pdf'
    ];

    /**
     * Tải lên danh sách tệp với kiểm tra nghiêm ngặt bảo mật và MIME thực tế
     * 
     * @param array<UploadedFile> $files
     * @param array $options [collection, visibility, alt_text, description]
     * @param mixed $user User hoặc Admin đang đăng nhập
     * @return array Danh sách các MediaAsset đã được tạo thành công
     */
    public function uploadMultiple(array $files, array $options = [], $user = null): array
    {
        $collection = $options['collection'] ?? MediaAsset::COLLECTION_GENERAL;
        
        // Quy tắc phân loại: Biên lai & giao nhận luôn luôn là private
        if (in_array($collection, [MediaAsset::COLLECTION_RECEIPTS, MediaAsset::COLLECTION_HANDOVERS], true)) {
            $visibility = MediaAsset::VISIBILITY_PRIVATE;
        } else {
            $visibility = $options['visibility'] ?? MediaAsset::VISIBILITY_PUBLIC;
        }

        $createdAssets = [];
        $savedFilePaths = [];

        try {
            foreach ($files as $file) {
                if (!($file instanceof UploadedFile) || !$file->isValid()) {
                    throw new \InvalidArgumentException('Tệp tải lên không hợp lệ hoặc đã bị lỗi trong quá trình truyền.');
                }

                // 1. Kiểm tra kích thước tệp
                if ($file->getSize() > self::MAX_FILE_SIZE_BYTES) {
                    throw new \InvalidArgumentException("Tệp '{$file->getClientOriginalName()}' vượt quá kích thước tối đa cho phép (10MB).");
                }

                // 2. Xác thực MIME thực tế từ nội dung tệp bằng finfo
                $realMime = $this->detectRealMimeType($file);
                $clientExt = strtolower($file->getClientOriginalExtension());
                $guessExt = strtolower($file->guessExtension() ?: $clientExt);

                $allowedMimes = array_merge(self::ALLOWED_IMAGE_MIMES, self::ALLOWED_DOCUMENT_MIMES);
                if (!in_array($realMime, $allowedMimes, true)) {
                    throw new \InvalidArgumentException("Định dạng tệp '{$file->getClientOriginalName()}' (MIME: {$realMime}) không được chấp nhận. Chỉ hỗ trợ ảnh JPG, PNG, WEBP và tài liệu PDF.");
                }

                // Chặn giả mạo đuôi tệp: nếu nội dung là PDF nhưng đuôi là PNG, hoặc ngược lại
                if (in_array($realMime, self::ALLOWED_IMAGE_MIMES, true) && in_array($guessExt, ['pdf', 'html', 'php', 'svg', 'js'], true)) {
                    throw new \InvalidArgumentException("Định dạng mở rộng của tệp '{$file->getClientOriginalName()}' không khớp với nội dung thực tế.");
                }
                if ($realMime === 'application/pdf' && !in_array($clientExt, ['pdf'], true)) {
                    throw new \InvalidArgumentException("Tệp PDF phải có phần mở rộng .pdf.");
                }

                // 3. Quét phát hiện mã độc (PHP tags, script tags) trong tệp
                $this->scanForMaliciousPayloads($file->getRealPath(), $realMime);

                // 4. Xác định thư mục lưu trữ và tên tệp an toàn
                $safeExt = in_array($clientExt, self::ALLOWED_EXTENSIONS, true) ? $clientExt : ($guessExt ?: 'bin');
                if ($safeExt === 'jpeg') {
                    $safeExt = 'jpg';
                }

                $yearMonth = date('Y/m');
                $timestamp = time();
                $randomSuffix = Str::random(16);
                $safeFilename = "media_{$timestamp}_{$randomSuffix}.{$safeExt}";

                if ($visibility === MediaAsset::VISIBILITY_PUBLIC) {
                    $disk = 'public';
                    $targetDir = public_path("uploads/media/{$yearMonth}");
                    $relativePath = "uploads/media/{$yearMonth}/{$safeFilename}";
                    $publicUrl = "/uploads/media/{$yearMonth}/{$safeFilename}";
                } else {
                    $disk = 'private';
                    $targetDir = storage_path("app/private/media/{$yearMonth}");
                    $relativePath = "private/media/{$yearMonth}/{$safeFilename}";
                    $publicUrl = null; // Tệp riêng tư không bao giờ có public URL trực tiếp
                }

                if (!File::exists($targetDir)) {
                    File::makeDirectory($targetDir, 0755, true);
                }

                $destinationPath = $targetDir . DIRECTORY_SEPARATOR . $safeFilename;
                
                // Di chuyển tệp vào vị trí an toàn
                $file->move($targetDir, $safeFilename);
                $savedFilePaths[] = $destinationPath;

                // 5. Đọc kích thước ảnh (nếu là ảnh)
                $width = null;
                $height = null;
                if (str_starts_with($realMime, 'image/')) {
                    $imageInfo = @getimagesize($destinationPath);
                    if ($imageInfo) {
                        $width = $imageInfo[0] ?? null;
                        $height = $imageInfo[1] ?? null;
                    }
                }

                // 6. Lưu bản ghi MediaAsset
                $sanitizedOriginalName = $this->sanitizeFilename($file->getClientOriginalName());

                $asset = MediaAsset::create([
                    'filename'         => $safeFilename,
                    'original_name'    => $sanitizedOriginalName,
                    'disk'             => $disk,
                    'path'             => $relativePath,
                    'url'              => $publicUrl,
                    'mime_type'        => $realMime,
                    'extension'        => $safeExt,
                    'size'             => File::size($destinationPath),
                    'width'            => $width,
                    'height'           => $height,
                    'visibility'       => $visibility,
                    'collection'       => $collection,
                    'uploaded_by_id'   => $user?->id,
                    'uploaded_by_type' => $user ? get_class($user) : null,
                    'alt_text'         => $options['alt_text'] ?? pathinfo($sanitizedOriginalName, PATHINFO_FILENAME),
                    'description'      => $options['description'] ?? null,
                ]);

                $createdAssets[] = $asset;
            }

            return $createdAssets;
        } catch (\Throwable $e) {
            // Dọn dẹp an toàn các tệp vừa lưu nếu có lỗi giữa chừng
            foreach ($savedFilePaths as $path) {
                if (File::exists($path)) {
                    @File::delete($path);
                }
            }
            Log::error('MediaService uploadMultiple failed: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            throw $e;
        }
    }

    /**
     * Xóa tài nguyên an toàn: Kiểm tra nơi sử dụng trước khi xóa
     */
    public function deleteAsset(MediaAsset $asset): array
    {
        // 1. Kiểm tra tham chiếu
        $refs = $asset->getReferences();
        if ($refs['total_count'] > 0) {
            $inUseDetails = [];
            if (!empty($refs['cars_featured'])) {
                $carNames = array_column($refs['cars_featured'], 'name');
                $inUseDetails[] = 'Ảnh đại diện của xe: ' . implode(', ', array_slice($carNames, 0, 3));
            }
            if (!empty($refs['cars_gallery'])) {
                $carNames = array_column($refs['cars_gallery'], 'name');
                $inUseDetails[] = 'Nằm trong thư viện ảnh xe: ' . implode(', ', array_slice($carNames, 0, 3));
            }
            if (!empty($refs['bookings'])) {
                $bookingCodes = array_column($refs['bookings'], 'booking_code');
                $inUseDetails[] = 'Chứng từ đơn thuê xe: ' . implode(', ', array_slice($bookingCodes, 0, 3));
            }

            return [
                'success'    => false,
                'in_use'     => true,
                'message'    => 'Không thể xóa tài nguyên này vì đang được sử dụng trong hệ thống: ' . implode('; ', $inUseDetails),
                'references' => $refs,
            ];
        }

        // 2. Không bị ràng buộc -> Xóa file vật lý trên đĩa
        $physicalPath = $asset->getAbsolutePath();
        if ($physicalPath && File::exists($physicalPath)) {
            @File::delete($physicalPath);
        }

        // 3. Xóa bản ghi database
        $asset->delete();

        return [
            'success' => true,
            'in_use'  => false,
            'message' => 'Đã xóa tài nguyên thành công.',
        ];
    }

    /**
     * Kiểm tra quyền truy cập tệp riêng tư
     */
    public function canAccessPrivateAsset(MediaAsset $asset, $user): bool
    {
        if ($asset->visibility === MediaAsset::VISIBILITY_PUBLIC) {
            return true;
        }

        if (!$user) {
            return false;
        }

        // Nếu là Admin
        if ($user instanceof Admin) {
            if ($user->role === PermissionMatrix::ROLE_OWNER) {
                return true;
            }

            // Quyền theo collection: Biên lai thanh toán chỉ kế toán/chủ hệ thống có payments.manage mới được xem
            if ($asset->collection === MediaAsset::COLLECTION_RECEIPTS) {
                return $user->hasAnyPermission([
                    PermissionMatrix::PERM_PAYMENTS_MANAGE,
                ]);
            }

            if ($asset->collection === MediaAsset::COLLECTION_HANDOVERS) {
                return $user->hasAnyPermission([
                    PermissionMatrix::PERM_HANDOVERS_MANAGE,
                    PermissionMatrix::PERM_BOOKINGS_VIEW,
                    PermissionMatrix::PERM_BOOKINGS_MANAGE,
                ]);
            }

            return $user->hasAnyPermission([
                PermissionMatrix::PERM_CARS_MANAGE,
                PermissionMatrix::PERM_SETTINGS_MANAGE,
            ]);
        }

        // Nếu là User thông thường: chỉ được truy cập nếu là chính chủ tải lên
        if ($user instanceof User) {
            return $asset->uploaded_by_id === $user->id && $asset->uploaded_by_type === get_class($user);
        }

        return false;
    }

    /**
     * Phục vụ stream file với header bảo mật nghiêm ngặt
     */
    public function streamAsset(MediaAsset $asset, $user): BinaryFileResponse
    {
        if (!$this->canAccessPrivateAsset($asset, $user)) {
            abort(403, 'Bạn không có quyền truy cập tài nguyên bảo mật này.');
        }

        $filePath = $asset->getAbsolutePath();
        if (!$filePath || !File::exists($filePath)) {
            abort(404, 'Tệp tài nguyên không tồn tại trên máy chủ.');
        }

        $headers = [
            'Content-Type'              => $asset->mime_type,
            'Content-Security-Policy'   => "default-src 'none'",
            'X-Content-Type-Options'    => 'nosniff',
            'X-Frame-Options'           => 'DENY',
            'Cache-Control'             => 'private, no-cache, no-store, must-revalidate',
            'Pragma'                    => 'no-cache',
            'Expires'                   => '0',
            'Content-Disposition'       => 'inline; filename="' . addslashes($asset->original_name) . '"',
        ];

        return response()->file($filePath, $headers);
    }

    /**
     * Phát hiện MIME thực sự bằng PHP finfo
     */
    protected function detectRealMimeType(UploadedFile $file): string
    {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = finfo_file($finfo, $file->getRealPath());
        finfo_close($finfo);

        return $realMime ?: ($file->getMimeType() ?: 'application/octet-stream');
    }

    /**
     * Quét tệp để chặn các đoạn mã thực thi độc hại ẩn trong ảnh/tài liệu
     */
    protected function scanForMaliciousPayloads(string $filePath, string $mimeType): void
    {
        // Đọc đoạn đầu và đoạn cuối của tệp
        $handle = @fopen($filePath, 'rb');
        if (!$handle) {
            return;
        }

        $sample = fread($handle, 4096);
        fseek($handle, -4096, SEEK_END);
        $sampleEnd = fread($handle, 4096);
        fclose($handle);

        $combined = $sample . ' ' . $sampleEnd;

        $maliciousPatterns = [
            '/<\?php/i',
            '/<\?=/i',
            '/<script\b[^>]*>/i',
            '/eval\s*\(/i',
            '/base64_decode\s*\(/i',
            '/system\s*\(/i',
            '/shell_exec\s*\(/i',
            '/passthru\s*\(/i',
        ];

        foreach ($maliciousPatterns as $pattern) {
            if (preg_match($pattern, $combined)) {
                throw new \InvalidArgumentException('Tệp tải lên chứa nội dung mã nguồn không an toàn và bị từ chối.');
            }
        }
    }

    /**
     * Làm sạch tên tệp để tránh Directory Traversal hoặc ký tự đặc biệt
     */
    protected function sanitizeFilename(string $filename): string
    {
        $clean = basename($filename);
        $clean = preg_replace('/[^\w\.\-\s\(\)]/u', '_', $clean);
        $clean = preg_replace('/\s+/', ' ', $clean);
        return trim($clean) ?: 'unnamed_asset';
    }
}
