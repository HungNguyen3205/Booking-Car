<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SettingController extends Controller
{
    /**
     * Lấy toàn bộ cấu hình hệ thống phục vụ trang quản trị.
     */
    public function index(): JsonResponse
    {
        $allSettings = SystemSetting::all();
        $formatted = [];

        foreach ($allSettings as $item) {
            $formatted[$item->key] = [
                'key'         => $item->key,
                'value'       => $item->getParsedValue(),
                'type'        => $item->type,
                'group'       => $item->group,
                'is_public'   => $item->is_public,
                'description' => $item->description,
                'updated_at'  => $item->updated_at,
            ];
        }

        return response()->json([
            'status' => 1,
            'data'   => $formatted,
        ]);
    }

    /**
     * Cập nhật các thông số cấu hình hệ thống.
     * Tự động phát hiện thay đổi thông tin ngân hàng và ghi vết kiểm toán (Audit Log).
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site_name'                         => 'sometimes|string|max:100',
            'site_logo'                         => 'nullable|string|max:500',
            'hotline'                           => 'sometimes|string|max:30',
            'support_email'                     => 'sometimes|email|max:100',
            'company_address'                   => 'sometimes|string|max:255',
            'service_locations'                 => 'sometimes|array',
            'service_locations.*'               => 'string|max:100',
            'bank_name'                         => 'sometimes|string|max:100',
            'bank_account_number'               => 'sometimes|string|max:50',
            'bank_account_holder'               => 'sometimes|string|max:100',
            'bank_bin'                          => 'sometimes|string|max:20',
            'bank_transfer_instruction'         => 'nullable|string|max:500',
            'rental_policy'                     => 'sometimes|array',
            'rental_buffer_hours'                => 'sometimes|integer|min:0|max:48',
            'booking_auto_cancel_unpaid_hours'  => 'sometimes|integer|min:1|max:168',
            'seo_meta_title_suffix'             => 'sometimes|string|max:150',
            'seo_meta_description'              => 'sometimes|string|max:300',
            'seo_og_image'                      => 'nullable|string|max:500',
            'map_provider'                      => 'sometimes|string|in:google_maps,openstreetmap',
            'map_embed_url'                     => [
                'sometimes',
                'string',
                'max:1000',
                function ($attribute, $value, $fail) {
                    if (empty($value)) return;
                    $low = strtolower($value);
                    if (str_contains($low, '<iframe') || str_contains($low, '<script') || str_contains($low, 'javascript:')) {
                        $fail('Đường dẫn bản đồ không được chứa thẻ <iframe> hoặc mã script tùy ý. Vui lòng chỉ nhập URL nhúng trực tiếp (https://...).');
                        return;
                    }
                    if (!filter_var($value, FILTER_VALIDATE_URL) || !str_starts_with($value, 'https://')) {
                        $fail('Đường dẫn bản đồ phải là một URL bảo mật hợp lệ bắt đầu bằng https://.');
                        return;
                    }
                    $host = parse_url($value, PHP_URL_HOST);
                    $allowedHosts = [
                        'google.com',
                        'www.google.com',
                        'maps.google.com',
                        'openstreetmap.org',
                        'www.openstreetmap.org',
                    ];
                    $hostMatches = false;
                    foreach ($allowedHosts as $allowed) {
                        if ($host === $allowed || str_ends_with($host ?? '', '.' . $allowed)) {
                            $hostMatches = true;
                            break;
                        }
                    }
                    if (!$hostMatches) {
                        $fail('Đường dẫn bản đồ chỉ chấp nhận máy chủ Google Maps hoặc OpenStreetMap hợp lệ.');
                    }
                },
            ],
            'map_coordinates'                   => 'sometimes|nullable|string|max:100',
            'animation_mode'                    => 'sometimes|string|in:standard,reduced,off',
            'animation_duration_scale'           => 'sometimes|string|in:0.5,1.0,1.5',
            'notification_email_alerts'          => 'sometimes|boolean',
            'notification_admin_recipient_email' => 'sometimes|email|max:100',
            'notification_sound_enabled'         => 'sometimes|boolean',
            'smtp_host'                          => 'sometimes|nullable|string|max:150',
            'smtp_port'                          => 'sometimes|nullable|string|max:10',
            'smtp_username'                      => 'sometimes|nullable|string|max:150',
            'smtp_password'                      => 'sometimes|nullable|string|max:150',
            'smtp_from_name'                     => 'sometimes|nullable|string|max:150',
            'smtp_from_address'                  => 'sometimes|nullable|string|max:150',
            'sms_brandname'                      => 'sometimes|nullable|string|max:50',
            'sms_api_key'                        => 'sometimes|nullable|string|max:150',
            'sms_secret'                         => 'sometimes|nullable|string|max:150',
            'vnpay_tmn_code'                     => 'sometimes|nullable|string|max:50',
            'vnpay_hash_secret'                  => 'sometimes|nullable|string|max:150',
            'vnpay_url'                          => 'sometimes|nullable|string|max:255',
            'momo_partner_code'                  => 'sometimes|nullable|string|max:50',
            'momo_access_key'                    => 'sometimes|nullable|string|max:150',
            'momo_secret_key'                    => 'sometimes|nullable|string|max:150',
        ], [
            'animation_mode.in' => 'Chế độ chuyển động chỉ chấp nhận một trong các mức: tiêu chuẩn (standard), giảm thiểu (reduced) hoặc tắt (off). Không được nhập mã tùy ý.',
            'animation_duration_scale.in' => 'Thời lượng chuyển động chỉ được chọn các tỷ lệ hợp lệ: 0.5, 1.0 hoặc 1.5.',
            'rental_buffer_hours.min' => 'Thời gian đệm vệ sinh xe không được nhỏ hơn 0 giờ.',
            'rental_buffer_hours.max' => 'Thời gian đệm vệ sinh xe tối đa là 48 giờ.',
            'booking_auto_cancel_unpaid_hours.min' => 'Thời hạn tự động hủy đơn chưa thanh toán tối thiểu là 1 giờ.',
            'booking_auto_cancel_unpaid_hours.max' => 'Thời hạn tự động hủy đơn chưa thanh toán tối đa là 168 giờ (7 ngày).',
        ]);

        $admin = Auth::guard('admin')->user() ?? Auth::guard('sanctum')->user();
        $adminId = $admin?->id;

        // 1. Kiểm tra phát hiện thay đổi thông tin ngân hàng
        $bankKeys = ['bank_name', 'bank_account_number', 'bank_account_holder', 'bank_bin', 'bank_transfer_instruction'];
        $bankChanged = false;
        $oldBankValues = [];
        $newBankValues = [];

        foreach ($bankKeys as $bKey) {
            if ($request->has($bKey)) {
                $currentVal = SystemSetting::get($bKey);
                $newVal = $request->input($bKey);
                if ($currentVal !== $newVal) {
                    $bankChanged = true;
                }
                $oldBankValues[$bKey] = $currentVal;
                $newBankValues[$bKey] = $newVal;
            }
        }

        // 2. Nhóm cấu hình và trạng thái công khai
        $groups = [
            'site_name'                          => 'general',
            'site_logo'                          => 'general',
            'service_locations'                  => 'general',
            'hotline'                            => 'contact',
            'support_email'                      => 'contact',
            'company_address'                    => 'contact',
            'bank_name'                          => 'bank',
            'bank_account_number'                => 'bank',
            'bank_account_holder'                => 'bank',
            'bank_bin'                           => 'bank',
            'bank_transfer_instruction'          => 'bank',
            'rental_policy'                      => 'operations',
            'rental_buffer_hours'                => 'operations',
            'booking_auto_cancel_unpaid_hours'   => 'operations',
            'seo_meta_title_suffix'              => 'seo',
            'seo_meta_description'               => 'seo',
            'seo_og_image'                       => 'seo',
            'map_provider'                       => 'map',
            'map_embed_url'                      => 'map',
            'map_coordinates'                    => 'map',
            'animation_mode'                     => 'animation',
            'animation_duration_scale'           => 'animation',
            'notification_email_alerts'          => 'notifications',
            'notification_admin_recipient_email' => 'notifications',
            'notification_sound_enabled'         => 'notifications',
            'smtp_host'                          => 'smtp',
            'smtp_port'                          => 'smtp',
            'smtp_username'                      => 'smtp',
            'smtp_password'                      => 'smtp',
            'smtp_from_name'                     => 'smtp',
            'smtp_from_address'                  => 'smtp',
            'sms_brandname'                      => 'sms',
            'sms_api_key'                        => 'sms',
            'sms_secret'                         => 'sms',
            'vnpay_tmn_code'                     => 'payments',
            'vnpay_hash_secret'                  => 'payments',
            'vnpay_url'                          => 'payments',
            'momo_partner_code'                  => 'payments',
            'momo_access_key'                    => 'payments',
            'momo_secret_key'                    => 'payments',
        ];

        $privateKeys = [
            'notification_email_alerts',
            'notification_admin_recipient_email',
            'smtp_password',
            'sms_secret',
            'vnpay_hash_secret',
            'momo_secret_key',
        ];

        $allChangesOld = [];
        $allChangesNew = [];

        foreach ($validated as $key => $val) {
            $group = $groups[$key] ?? 'general';
            $isPublic = !in_array($key, $privateKeys, true);
            $currentVal = SystemSetting::get($key);

            if ($currentVal != $val) {
                $allChangesOld[$key] = $currentVal;
                $allChangesNew[$key] = $val;
            }

            SystemSetting::set($key, $val, $group, $isPublic, $adminId);
        }

        // 3. Ghi nhật ký kiểm toán (Audit Log)
        // 3.1. Sự kiện thay đổi thông tin ngân hàng quan trọng
        // Tuyệt đối không thay đổi snapshot của đơn/giao dịch cũ
        if ($bankChanged) {
            AuditService::log(
                action: 'settings.bank_updated',
                targetType: 'SystemSetting',
                targetId: null,
                targetLabel: 'Tài khoản ngân hàng VietQR',
                newValues: $newBankValues,
                oldValues: $oldBankValues
            );
        }

        // 3.2. Sự kiện cập nhật cấu hình hệ thống chung
        if (!empty($allChangesNew)) {
            AuditService::log(
                action: 'settings.updated',
                targetType: 'SystemSetting',
                targetId: null,
                targetLabel: 'Cấu hình hệ thống',
                newValues: $allChangesNew,
                oldValues: $allChangesOld
            );
        }

        // 4. Xóa cache công khai để Frontend nhận dữ liệu mới ngay
        SystemSetting::clearPublicCache();

        return response()->json([
            'status'  => 1,
            'message' => 'Cập nhật cấu hình hệ thống thành công!',
            'data'    => SystemSetting::getPublicSettings(),
        ]);
    }
}
