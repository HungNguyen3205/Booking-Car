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
     * Danh mục chi tiết các quyền hạn nghiệp vụ
     */
    public static function getAllPermissions(): array
    {
        return [
            self::PERM_CARS_MANAGE => [
                'code'        => self::PERM_CARS_MANAGE,
                'name'        => 'Quản lý xe',
                'group'       => 'Đội xe & Thiết bị',
                'description' => 'Thêm mới, sửa thông số, hình ảnh, cập nhật trạng thái và bảo dưỡng xe',
            ],
            self::PERM_BOOKINGS_VIEW => [
                'code'        => self::PERM_BOOKINGS_VIEW,
                'name'        => 'Xem đơn đặt xe',
                'group'       => 'Vận hành đơn hàng',
                'description' => 'Xem danh sách đơn, chi tiết lịch hẹn, lịch xe và thông tin khách hàng',
            ],
            self::PERM_BOOKINGS_MANAGE => [
                'code'        => self::PERM_BOOKINGS_MANAGE,
                'name'        => 'Xử lý đơn đặt xe',
                'group'       => 'Vận hành đơn hàng',
                'description' => 'Tạo đơn cho khách, duyệt hoặc hủy đơn, cập nhật trạng thái đơn hàng',
            ],
            self::PERM_HANDOVERS_MANAGE => [
                'code'        => self::PERM_HANDOVERS_MANAGE,
                'name'        => 'Bàn giao & Nhận xe',
                'group'       => 'Vận hành đơn hàng',
                'description' => 'Lập biên bản giao xe, nhận trả xe, kiểm tra km, pin/xăng và ảnh hiện trạng',
            ],
            self::PERM_PAYMENTS_MANAGE => [
                'code'        => self::PERM_PAYMENTS_MANAGE,
                'name'        => 'Xác nhận thu & hoàn tiền',
                'group'       => 'Tài chính & Thu chi',
                'description' => 'Xác nhận thanh toán tiền thuê, ghi nhận cọc giữ chân, khấu trừ và hoàn trả cọc',
            ],
            self::PERM_REPORTS_VIEW => [
                'code'        => self::PERM_REPORTS_VIEW,
                'name'        => 'Báo cáo & Đối soát',
                'group'       => 'Tài chính & Thu chi',
                'description' => 'Xem thống kê doanh thu, tỷ lệ lấp đầy xe và danh sách đối soát thanh toán',
            ],
            self::PERM_ADMINS_MANAGE => [
                'code'        => self::PERM_ADMINS_MANAGE,
                'name'        => 'Quản trị nhân sự Admin',
                'group'       => 'Hệ thống & Phân quyền',
                'description' => 'Thêm mới, chỉnh sửa, khóa hoặc phân quyền cho tài khoản quản trị viên',
            ],
            self::PERM_AUDIT_LOGS_VIEW => [
                'code'        => self::PERM_AUDIT_LOGS_VIEW,
                'name'        => 'Nhật ký thao tác (Audit Log)',
                'group'       => 'Hệ thống & Phân quyền',
                'description' => 'Tra cứu lịch sử thao tác, truy vết thay đổi dữ liệu nhạy cảm trên hệ thống',
            ],
            self::PERM_SETTINGS_MANAGE => [
                'code'        => self::PERM_SETTINGS_MANAGE,
                'name'        => 'Cấu hình hệ thống',
                'group'       => 'Hệ thống & Phân quyền',
                'description' => 'Cài đặt tham số hệ thống, giá thuê mặc định và chính sách cọc',
            ],
            self::PERM_POSTS_VIEW => [
                'code'        => self::PERM_POSTS_VIEW,
                'name'        => 'Xem bài viết',
                'group'       => 'Nội dung & Bài viết',
                'description' => 'Xem danh sách bài viết nội bộ, bộ lọc chuyên mục và lịch sử biên tập',
            ],
            self::PERM_POSTS_CREATE => [
                'code'        => self::PERM_POSTS_CREATE,
                'name'        => 'Soạn thảo bài viết',
                'group'       => 'Nội dung & Bài viết',
                'description' => 'Tạo bài viết mới, lưu nháp, chỉnh sửa bài của mình và gửi yêu cầu duyệt',
            ],
            self::PERM_POSTS_REVIEW => [
                'code'        => self::PERM_POSTS_REVIEW,
                'name'        => 'Kiểm duyệt bài viết',
                'group'       => 'Nội dung & Bài viết',
                'description' => 'Duyệt bài chờ xuất bản, yêu cầu chỉnh sửa hoặc phản hồi lý do từ chối',
            ],
            self::PERM_POSTS_PUBLISH => [
                'code'        => self::PERM_POSTS_PUBLISH,
                'name'        => 'Xuất bản bài viết',
                'group'       => 'Nội dung & Bài viết',
                'description' => 'Xuất bản bài ra công khai, gỡ bài, chuyển lưu trữ và duyệt bản sửa đổi của bài đã đăng',
            ],
            self::PERM_POSTS_DELETE => [
                'code'        => self::PERM_POSTS_DELETE,
                'name'        => 'Xóa & Thùng rác',
                'group'       => 'Nội dung & Bài viết',
                'description' => 'Đưa bài viết vào thùng rác, khôi phục bài viết hoặc xóa vĩnh viễn',
            ],
            self::PERM_CONTENT_VIEW => [
                'code'        => self::PERM_CONTENT_VIEW,
                'name'        => 'Xem nội dung nháp & Preview',
                'group'       => 'Nội dung & Bài viết',
                'description' => 'Xem danh sách và xem trước bản nháp nội dung website',
            ],
            self::PERM_CONTENT_EDIT => [
                'code'        => self::PERM_CONTENT_EDIT,
                'name'        => 'Soạn thảo & Lưu nháp nội dung',
                'group'       => 'Nội dung & Bài viết',
                'description' => 'Chỉnh sửa và lưu nháp các khối giao diện Home, About, Contact, Process, Policies',
            ],
            self::PERM_CONTENT_PUBLISH => [
                'code'        => self::PERM_CONTENT_PUBLISH,
                'name'        => 'Xuất bản & Khôi phục nội dung',
                'group'       => 'Nội dung & Bài viết',
                'description' => 'Xuất bản nội dung lên website chính thức và khôi phục các phiên bản lịch sử',
            ],
            self::PERM_CONTENT_MANAGE => [
                'code'        => self::PERM_CONTENT_MANAGE,
                'name'        => 'Toàn quyền CMS Website',
                'group'       => 'Nội dung & Bài viết',
                'description' => 'Chỉnh sửa, xem trước, lưu nháp, xuất bản và khôi phục toàn bộ các khối nội dung website',
            ],
        ];
    }

    /**
     * Ma trận quyền mặc định gắn với từng vai trò
     */
    public static function getDefaultPermissionsForRole(string $role): array
    {
        return match ($role) {
            self::ROLE_OWNER => [
                self::PERM_CARS_MANAGE,
                self::PERM_BOOKINGS_VIEW,
                self::PERM_BOOKINGS_MANAGE,
                self::PERM_HANDOVERS_MANAGE,
                self::PERM_PAYMENTS_MANAGE,
                self::PERM_REPORTS_VIEW,
                self::PERM_ADMINS_MANAGE,
                self::PERM_SETTINGS_MANAGE,
                self::PERM_AUDIT_LOGS_VIEW,
                self::PERM_POSTS_VIEW,
                self::PERM_POSTS_CREATE,
                self::PERM_POSTS_REVIEW,
                self::PERM_POSTS_PUBLISH,
                self::PERM_POSTS_DELETE,
                self::PERM_CONTENT_VIEW,
                self::PERM_CONTENT_EDIT,
                self::PERM_CONTENT_PUBLISH,
                self::PERM_CONTENT_MANAGE,
            ],
            self::ROLE_DISPATCHER => [
                self::PERM_CARS_MANAGE,
                self::PERM_BOOKINGS_VIEW,
                self::PERM_BOOKINGS_MANAGE,
                self::PERM_HANDOVERS_MANAGE,
            ],
            self::ROLE_ACCOUNTANT => [
                self::PERM_BOOKINGS_VIEW,
                self::PERM_PAYMENTS_MANAGE,
                self::PERM_REPORTS_VIEW,
            ],
            default => [],
        };
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
