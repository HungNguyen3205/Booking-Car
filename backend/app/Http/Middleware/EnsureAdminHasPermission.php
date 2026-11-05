<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminHasPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$permissions
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $admin = Auth::guard('admin')->user();

        // 1. Nếu chưa có user admin qua guard admin, kiểm tra qua sanctum
        if (!$admin) {
            $sanctumUser = Auth::guard('sanctum')->user();
            if ($sanctumUser instanceof Admin) {
                $admin = $sanctumUser;
            }
        }

        if (!$admin) {
            return response()->json([
                'status'  => 0,
                'message' => 'Bạn chưa đăng nhập với tư cách quản trị viên!',
            ], 401);
        }

        // 2. Kiểm tra trạng thái hoạt động của Admin
        if ($admin->tinh_trang !== null && (int) $admin->tinh_trang === 0) {
            // Thu hồi phiên ngay lập tức
            $admin->tokens()->delete();
            return response()->json([
                'status'  => 0,
                'message' => 'Tài khoản quản trị viên đã bị khóa hoặc tạm ngưng hoạt động!',
            ], 403);
        }

        // 3. Nếu là Chủ hệ thống (Owner), luôn có toàn bộ quyền
        if ($admin->isOwner()) {
            return $next($request);
        }

        // 4. Nếu không truyền quyền yêu cầu thì cho qua (chỉ cần là admin)
        if (empty($permissions)) {
            return $next($request);
        }

        // 5. Kiểm tra quyền (Hỗ trợ cú pháp dấu phẩy: "bookings.view,cars.manage" -> hoặc có 1 trong 2 quyền)
        $hasAnyPermission = false;
        foreach ($permissions as $permGroup) {
            $subPerms = explode(',', $permGroup);
            foreach ($subPerms as $perm) {
                $cleanPerm = trim($perm);
                if (!empty($cleanPerm) && $admin->hasPermission($cleanPerm)) {
                    $hasAnyPermission = true;
                    break 2;
                }
            }
        }

        if (!$hasAnyPermission) {
            return response()->json([
                'status'  => 0,
                'message' => 'Bạn không có quyền thực hiện thao tác này! Vui lòng liên hệ chủ hệ thống để được cấp quyền.',
                'required_permissions' => $permissions,
            ], 403);
        }

        return $next($request);
    }
}
