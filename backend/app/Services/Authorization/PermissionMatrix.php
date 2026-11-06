<?php

namespace App\Services\Authorization;

class PermissionMatrix
{
    // 1. Roles
    public const ROLE_ADMIN          = 'admin';
    public const ROLE_MANAGER        = 'manager';
    public const ROLE_DISPATCHER     = 'dispatcher';
    public const ROLE_OPERATOR_STAFF = 'operator_staff';
    public const ROLE_ACCOUNTANT     = 'accountant';
    public const ROLE_OWNER          = 'owner';

    // 2. Permissions
    public const PERM_PARTNERS_MANAGE        = 'partners.manage';
    public const PERM_VEHICLES_MANAGE        = 'vehicles.manage';
    public const PERM_ROUTES_MANAGE          = 'routes.manage';
    public const PERM_TRIPS_MANAGE           = 'trips.manage';
    public const PERM_BOOKINGS_VIEW          = 'bookings.view';
    public const PERM_BOOKINGS_MANAGE        = 'bookings.manage';
    public const PERM_PAYMENTS_MANAGE        = 'payments.manage';
    public const PERM_RECONCILIATIONS_MANAGE = 'reconciliations.manage';
    public const PERM_REPORTS_VIEW           = 'reports.view';
    public const PERM_PROMOTIONS_MANAGE      = 'promotions.manage';
    public const PERM_ADMINS_MANAGE          = 'admins.manage';
    public const PERM_SETTINGS_MANAGE        = 'settings.manage';
    public const PERM_AUDIT_LOGS_VIEW        = 'audit_logs.view';
    public const PERM_POSTS_VIEW             = 'posts.view';
    public const PERM_POSTS_MANAGE           = 'posts.manage';

    public static function getAllRoles(): array
    {
        return [
            self::ROLE_ADMIN => [
                'code'        => self::ROLE_ADMIN,
                'name'        => 'Admin hệ thống',
                'description' => 'Toàn quyền quản trị nền tảng DANAVA Go',
                'level'       => 100,
            ],
            self::ROLE_OWNER => [
                'code'        => self::ROLE_OWNER,
                'name'        => 'Chủ nhà xe',
                'description' => 'Quản trị toàn bộ dữ liệu, chuyến xe, tài chính của nhà xe',
                'level'       => 90,
            ],
            self::ROLE_MANAGER => [
                'code'        => self::ROLE_MANAGER,
                'name'        => 'Quản trị viên',
                'description' => 'Quản lý vận hành, đơn vé, chuyến chạy và đối tác',
                'level'       => 80,
            ],
            self::ROLE_DISPATCHER => [
                'code'        => self::ROLE_DISPATCHER,
                'name'        => 'Điều hành tour/vé',
                'description' => 'Quản lý đội xe, lịch trình, điều phối chuyến và xử lý đơn đặt vé',
                'level'       => 60,
            ],
            'sales' => [
                self::PERM_BOOKINGS_VIEW,
                self::PERM_BOOKINGS_MANAGE,
            ],
            'driver' => [
                self::PERM_BOOKINGS_VIEW,
            ],
            self::ROLE_OPERATOR_STAFF => [
                'code'        => self::ROLE_OPERATOR_STAFF,
                'name'        => 'Nhân viên nhà xe',
                'description' => 'Tra cứu chuyến, kiểm vé hành khách và hỗ trợ đặt vé',
                'level'       => 40,
            ],
            self::ROLE_ACCOUNTANT => [
                'code'        => self::ROLE_ACCOUNTANT,
                'name'        => 'Kế toán',
                'description' => 'Xác nhận thanh toán, đối soát doanh thu và công nợ đối tác',
                'level'       => 50,
            ],
        ];
    }

    /**
     * Danh mục quyền nghiệp vụ xe khách (chỉ dùng hằng số đã khai báo ở trên)
     */
    public static function getAllPermissions(): array
    {
        return [
            self::PERM_PARTNERS_MANAGE => [
                'code'        => self::PERM_PARTNERS_MANAGE,
                'name'        => 'Quản lý nhà xe đối tác',
                'group'       => 'Đối tác',
                'description' => 'Thêm, sửa, tạm ngưng nhà xe và cấu hình hoa hồng',
            ],
            self::PERM_VEHICLES_MANAGE => [
                'code'        => self::PERM_VEHICLES_MANAGE,
                'name'        => 'Quản lý xe & sơ đồ ghế',
                'group'       => 'Vận hành',
                'description' => 'Thêm xe, biển số, loại xe và sơ đồ ghế',
            ],
            self::PERM_ROUTES_MANAGE => [
                'code'        => self::PERM_ROUTES_MANAGE,
                'name'        => 'Quản lý tuyến & điểm đón',
                'group'       => 'Vận hành',
                'description' => 'Tạo tuyến đường, điểm đón và điểm trả',
            ],
            self::PERM_TRIPS_MANAGE => [
                'code'        => self::PERM_TRIPS_MANAGE,
                'name'        => 'Quản lý chuyến chạy',
                'group'       => 'Vận hành',
                'description' => 'Lên lịch, đổi giờ, phân xe/tài xế và hủy chuyến',
            ],
            self::PERM_BOOKINGS_VIEW => [
                'code'        => self::PERM_BOOKINGS_VIEW,
                'name'        => 'Xem đơn vé',
                'group'       => 'Đơn vé',
                'description' => 'Xem danh sách đơn vé, ghế đã đặt và thông tin hành khách',
            ],
            self::PERM_BOOKINGS_MANAGE => [
                'code'        => self::PERM_BOOKINGS_MANAGE,
                'name'        => 'Xử lý đơn vé',
                'group'       => 'Đơn vé',
                'description' => 'Bán vé tại quầy, xác nhận, đổi hoặc hủy vé',
            ],
            self::PERM_PAYMENTS_MANAGE => [
                'code'        => self::PERM_PAYMENTS_MANAGE,
                'name'        => 'Xác nhận thanh toán',
                'group'       => 'Tài chính',
                'description' => 'Ghi nhận thu tiền, hoàn tiền và trạng thái thanh toán',
            ],
            self::PERM_RECONCILIATIONS_MANAGE => [
                'code'        => self::PERM_RECONCILIATIONS_MANAGE,
                'name'        => 'Đối soát & công nợ',
                'group'       => 'Tài chính',
                'description' => 'Lập kỳ đối soát và tất toán công nợ với nhà xe',
            ],
            self::PERM_REPORTS_VIEW => [
                'code'        => self::PERM_REPORTS_VIEW,
                'name'        => 'Xem báo cáo',
                'group'       => 'Tài chính',
                'description' => 'Xem doanh thu theo tuyến, nhà xe và xuất file',
            ],
            self::PERM_PROMOTIONS_MANAGE => [
                'code'        => self::PERM_PROMOTIONS_MANAGE,
                'name'        => 'Quản lý ưu đãi',
                'group'       => 'Nội dung',
                'description' => 'Tạo mã giảm giá và chương trình khuyến mãi',
            ],
            self::PERM_POSTS_VIEW => [
                'code'        => self::PERM_POSTS_VIEW,
                'name'        => 'Xem bài viết',
                'group'       => 'Nội dung',
                'description' => 'Xem danh sách bài viết và bản nháp',
            ],
            self::PERM_POSTS_MANAGE => [
                'code'        => self::PERM_POSTS_MANAGE,
                'name'        => 'Quản lý bài viết',
                'group'       => 'Nội dung',
                'description' => 'Soạn, xuất bản và gỡ bài viết',
            ],
            self::PERM_ADMINS_MANAGE => [
                'code'        => self::PERM_ADMINS_MANAGE,
                'name'        => 'Quản lý nhân sự',
                'group'       => 'Hệ thống',
                'description' => 'Thêm, khóa và phân quyền tài khoản quản trị',
            ],
            self::PERM_SETTINGS_MANAGE => [
                'code'        => self::PERM_SETTINGS_MANAGE,
                'name'        => 'Cấu hình hệ thống',
                'group'       => 'Hệ thống',
                'description' => 'Thông tin thương hiệu, email, SMS và cổng thanh toán',
            ],
            self::PERM_AUDIT_LOGS_VIEW => [
                'code'        => self::PERM_AUDIT_LOGS_VIEW,
                'name'        => 'Nhật ký thao tác',
                'group'       => 'Hệ thống',
                'description' => 'Tra cứu lịch sử thay đổi dữ liệu nhạy cảm',
            ],
        ];
    }

    /**
     * Ma trận quyền mặc định gắn với từng vai trò
     */
    public static function getDefaultPermissionsForRole(string $role): array
    {
        return match ($role) {
            'platform', self::ROLE_ADMIN, self::ROLE_OWNER => [
                self::PERM_PARTNERS_MANAGE,
                self::PERM_VEHICLES_MANAGE,
                self::PERM_ROUTES_MANAGE,
                self::PERM_TRIPS_MANAGE,
                self::PERM_BOOKINGS_VIEW,
                self::PERM_BOOKINGS_MANAGE,
                self::PERM_PAYMENTS_MANAGE,
                self::PERM_RECONCILIATIONS_MANAGE,
                self::PERM_REPORTS_VIEW,
                self::PERM_PROMOTIONS_MANAGE,
                self::PERM_POSTS_VIEW,
                self::PERM_POSTS_MANAGE,
                self::PERM_ADMINS_MANAGE,
                self::PERM_SETTINGS_MANAGE,
                self::PERM_AUDIT_LOGS_VIEW,
            ],
            self::ROLE_MANAGER => [
                self::PERM_PARTNERS_MANAGE,
                self::PERM_VEHICLES_MANAGE,
                self::PERM_ROUTES_MANAGE,
                self::PERM_TRIPS_MANAGE,
                self::PERM_BOOKINGS_VIEW,
                self::PERM_BOOKINGS_MANAGE,
                self::PERM_REPORTS_VIEW,
                self::PERM_PROMOTIONS_MANAGE,
                self::PERM_POSTS_VIEW,
                self::PERM_POSTS_MANAGE,
            ],
            self::ROLE_DISPATCHER => [
                self::PERM_VEHICLES_MANAGE,
                self::PERM_ROUTES_MANAGE,
                self::PERM_TRIPS_MANAGE,
                self::PERM_BOOKINGS_VIEW,
                self::PERM_BOOKINGS_MANAGE,
            ],
            self::ROLE_OPERATOR_STAFF => [
                self::PERM_BOOKINGS_VIEW,
                self::PERM_BOOKINGS_MANAGE,
            ],
            self::ROLE_ACCOUNTANT => [
                self::PERM_BOOKINGS_VIEW,
                self::PERM_PAYMENTS_MANAGE,
                self::PERM_RECONCILIATIONS_MANAGE,
                self::PERM_REPORTS_VIEW,
            ],
            default => [],
        };
    }

    /** Effective permissions of a login account: role defaults ∪ its custom permission group. */
    public static function effectiveForUser(object $user): array
    {
        $group = [];
        if (! empty($user->permission_group_id)) {
            $raw = \Illuminate\Support\Facades\DB::table('permission_groups')->where('id', $user->permission_group_id)->value('permissions');
            $group = json_decode($raw ?? '[]', true) ?: [];
        }

        return array_values(array_unique(array_merge(self::getDefaultPermissionsForRole((string) $user->role), $group)));
    }

    /**
     * Kiểm tra quyền cấp phát vai trò để chống leo thang đặc quyền (Privilege Escalation)
     */
    public static function canActorGrantRole(string $actorRole, string $targetRole): bool
    {
        // Chỉ chủ hệ thống (owner) mới được phép tạo, sửa hoặc cấp quyền Chủ hệ thống (owner)
        if ($targetRole === self::ROLE_OWNER) {
            return $actorRole === self::ROLE_OWNER;
        }

        // Owner có thể cấp bất kỳ role nào
        if ($actorRole === self::ROLE_OWNER) {
            return true;
        }

        // Các vai trò khác không có quyền quản lý tài khoản admin
        return false;
    }
}
