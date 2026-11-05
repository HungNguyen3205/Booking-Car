<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    use HasFactory;

    protected $table = 'system_settings';

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'is_public',
        'description',
        'updated_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    /**
     * Danh sách các key cấu hình công khai được phép trả về cho Frontend khách hàng.
     * Tuyệt đối không bao gồm secret, API key hay mật khẩu.
     */
    public const PUBLIC_KEYS_WHITELIST = [
        'site_name',
        'site_logo',
        'hotline',
        'support_email',
        'company_address',
        'service_locations',
        'bank_name',
        'bank_account_number',
        'bank_account_holder',
        'bank_bin',
        'bank_transfer_instruction',
        'rental_policy',
        'rental_buffer_hours',
        'booking_auto_cancel_unpaid_hours',
        'seo_meta_title_suffix',
        'seo_meta_description',
        'seo_og_image',
        'map_provider',
        'map_embed_url',
        'map_coordinates',
        'animation_mode',
        'animation_duration_scale',
        'notification_sound_enabled',
    ];

    public function updatedByAdmin()
    {
        return $this->belongsTo(Admin::class, 'updated_by');
    }

    /**
     * Parse giá trị lưu trữ thành kiểu dữ liệu tương ứng.
     */
    public function getParsedValue()
    {
        if ($this->value === null) {
            return null;
        }

        return match ($this->type) {
            'json'    => json_decode($this->value, true) ?? [],
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $this->value,
            default   => (string) $this->value,
        };
    }

    /**
     * Lấy giá trị cấu hình theo key.
     */
    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) {
            return $default;
        }

        return $setting->getParsedValue();
    }

    /**
     * Cập nhật hoặc thêm mới một cấu hình.
     */
    public static function set(string $key, $value, string $group = 'general', bool $isPublic = true, ?int $updatedBy = null): self
    {
        $type = 'string';
        if (is_array($value) || is_object($value)) {
            $type = 'json';
            $rawValue = json_encode($value, JSON_UNESCAPED_UNICODE);
        } elseif (is_bool($value)) {
            $type = 'boolean';
            $rawValue = $value ? '1' : '0';
        } elseif (is_int($value)) {
            $type = 'integer';
            $rawValue = (string) $value;
        } else {
            $rawValue = $value !== null ? (string) $value : null;
        }

        $setting = static::updateOrCreate(
            ['key' => $key],
            [
                'value'       => $rawValue,
                'type'        => $type,
                'group'       => $group,
                'is_public'   => $isPublic,
                'updated_by'  => $updatedBy,
            ]
        );

        self::clearPublicCache();

        return $setting;
    }

    /**
     * Lấy toàn bộ cấu hình công khai có caching (1 giờ).
     */
    public static function getPublicSettings(): array
    {
        return Cache::remember('system_settings_public', 3600, function () {
            $settings = static::where('is_public', true)
                ->whereIn('key', self::PUBLIC_KEYS_WHITELIST)
                ->get();

            $result = [];
            foreach ($settings as $setting) {
                $result[$setting->key] = $setting->getParsedValue();
            }

            return $result;
        });
    }

    /**
     * Làm mới cache cấu hình công khai sau khi cập nhật.
     */
    public static function clearPublicCache(): void
    {
        Cache::forget('system_settings_public');
    }
}
