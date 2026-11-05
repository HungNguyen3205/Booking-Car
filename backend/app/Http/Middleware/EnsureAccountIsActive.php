<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $freshUser = $user->fresh();
            if (!$freshUser) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Tài khoản không tồn tại hoặc đã bị xóa!',
                ], 401);
            }

            $isInactive = false;

            if (isset($freshUser->tinh_trang) && (int) $freshUser->tinh_trang === 0) {
                $isInactive = true;
            }

            if (isset($freshUser->is_active) && (int) $freshUser->is_active === 0) {
                $isInactive = true;
            }

            if ($isInactive) {
                // Thu hồi toàn bộ token của tài khoản bị khóa
                if (method_exists($freshUser, 'tokens')) {
                    $freshUser->tokens()->delete();
                }

                return response()->json([
                    'status'  => 0,
                    'message' => 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt. Phiên làm việc đã bị thu hồi!',
                ], 403);
            }
        }

        return $next($request);
    }
}
