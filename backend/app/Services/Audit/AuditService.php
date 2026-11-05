<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Danh sách các trường nhạy cảm cần loại bỏ hoặc che giấu
     */
    protected static array $sensitiveFields = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'plaintexttoken',
        'remember_token',
        'hash_reset',
        'hash_active',
        'secret',
        'access_token',
        'cvv',
        'card_number',
    ];

    /**
     * Ghi nhận một sự kiện kiểm toán nghiệp vụ quan trọng
     */
    public static function log(
        string $action,
        ?string $targetType = null,
        $targetId = null,
        ?string $targetLabel = null,
        ?array $newValues = null,
        ?array $oldValues = null,
        ?object $customActor = null
    ): AuditLog {
        $actor = $customActor ?? (Auth::guard('admin')->user() ?? Auth::guard('sanctum')->user());

        $actorType = 'system';
        $actorId = null;
        $actorName = 'System';
        $actorEmail = null;

        if ($actor) {
            $actorId = $actor->id;
            $actorName = $actor->ho_ten ?? 'Unknown';
            $actorEmail = $actor->email ?? null;

            if ($actor instanceof \App\Models\Admin) {
                $actorType = 'admin';
            } elseif ($actor instanceof \App\Models\User) {
                $actorType = 'user';
            }
        }

        // Lọc dữ liệu nhạy cảm
        $cleanOld = self::sanitize($oldValues);
        $cleanNew = self::sanitize($newValues);

        return AuditLog::create([
            'actor_type'   => $actorType,
            'actor_id'     => $actorId,
            'actor_name'   => $actorName,
            'actor_email'  => $actorEmail,
            'action'       => $action,
            'target_type'  => $targetType,
            'target_id'    => $targetId !== null ? (string) $targetId : null,
            'target_label' => $targetLabel,
            'old_values'   => $cleanOld,
            'new_values'   => $cleanNew,
            'ip_address'   => Request::ip() ?? '127.0.0.1',
            'user_agent'   => Request::header('User-Agent'),
        ]);
    }

    /**
     * Làm sạch dữ liệu, loại bỏ mật khẩu và mã token bí mật
     */
    public static function sanitize(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        $result = [];
        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);
            $isSensitive = in_array($lowerKey, self::$sensitiveFields, true) ||
                str_contains($lowerKey, 'password') ||
                str_contains($lowerKey, 'token') ||
                str_contains($lowerKey, 'secret') ||
                str_contains($lowerKey, 'apikey') ||
                str_contains($lowerKey, 'api_key') ||
                str_contains($lowerKey, 'cvv');

            if ($isSensitive) {
                $result[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $result[$key] = self::sanitize($value);
            } else {
                $result[$key] = $value;
            }
        }

        return $result;
    }
}
