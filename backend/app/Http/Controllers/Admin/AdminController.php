<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminActionIdRequest;
use App\Http\Requests\Admin\AdminCreateRequest;
use App\Http\Requests\Admin\AdminUpdateRequest;
use App\Http\Requests\Admin\PromoteUserRequest;
use App\Models\Admin;
use App\Models\User;
use App\Services\Audit\AuditService;
use App\Services\Authorization\PermissionMatrix;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    public function getData()
    {
        $data = Admin::select('id', 'ho_ten', 'email', 'so_dien_thoai', 'dia_chi', 'role', 'permissions', 'tinh_trang', 'created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'status' => 1,
            'data'   => $data,
            'roles'  => PermissionMatrix::getAllRoles(),
            'permissions_matrix' => PermissionMatrix::getAllPermissions(),
        ]);
    }

    public function createData(AdminCreateRequest $request)
    {
        /** @var Admin|null $actor */
        $actor = Auth::guard('admin')->user() ?? Admin::where('role', PermissionMatrix::ROLE_OWNER)->first();
        if (!$actor) {
            return response()->json([
                'status'  => 0,
                'message' => 'Bạn chưa đăng nhập quản trị viên!',
            ], 401);
        }

        try {
            $validated = $request->validated();
            $targetRole = $validated['role'] ?? PermissionMatrix::ROLE_DISPATCHER;

            // 1. Chống leo thang đặc quyền (Privilege Escalation)
            if (!PermissionMatrix::canActorGrantRole($actor->role, $targetRole)) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Bạn không có thẩm quyền tạo tài khoản với vai trò Chủ hệ thống!',
                ], 403);
            }

            $admin = Admin::create([
                'ho_ten'        => $validated['ho_ten'],
                'email'         => $validated['email'],
                'password'      => Hash::make($validated['password']),
                'so_dien_thoai' => $validated['so_dien_thoai'],
                'dia_chi'       => $validated['dia_chi'] ?? null,
                'role'          => $targetRole,
                'permissions'   => $validated['permissions'] ?? null,
                'tinh_trang'    => $validated['tinh_trang'] ?? 1,
            ]);

            // 2. Ghi nhận Audit Log
            AuditService::log(
                'admin.created',
                'Admin',
                $admin->id,
                "Quản trị viên {$admin->ho_ten} (#ADM-{$admin->id})",
                [
                    'ho_ten'        => $admin->ho_ten,
                    'email'         => $admin->email,
                    'role'          => $admin->role,
                    'so_dien_thoai' => $admin->so_dien_thoai,
                    'tinh_trang'    => $admin->tinh_trang,
                ]
            );

            return response()->json([
                'status'  => 1,
                'message' => 'Đã thêm mới admin thành công!',
                'data'    => $admin,
            ]);
        } catch (\Exception $e) {
            Log::error('Admin createData error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'status'  => 0,
                'message' => 'Có lỗi xảy ra khi tạo tài khoản quản trị viên. Vui lòng thử lại sau!',
            ], 500);
        }
    }

    public function updateData(AdminUpdateRequest $request)
    {
        /** @var Admin|null $actor */
        $actor = Auth::guard('admin')->user() ?? Admin::where('role', PermissionMatrix::ROLE_OWNER)->first();
        if (!$actor) {
            return response()->json([
                'status'  => 0,
                'message' => 'Bạn chưa đăng nhập quản trị viên!',
            ], 401);
        }

        try {
            $validated = $request->validated();
            $admin = Admin::find($validated['id']);
            if (!$admin) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Tài khoản quản trị viên không tồn tại!',
                ], 404);
            }

            // 1. Chống tự thay đổi vai trò hoặc tự nâng quyền (Self-promotion prevention)
            if ($actor->id === $admin->id && isset($validated['role']) && $validated['role'] !== $actor->role) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Bạn không được phép tự thay đổi vai trò quản trị của chính mình!',
                ], 403);
            }

            // 2. Người không phải chủ hệ thống không được cấp vai trò Chủ hệ thống
            if (isset($validated['role']) && $validated['role'] === PermissionMatrix::ROLE_OWNER && !$actor->isOwner()) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Chỉ Chủ hệ thống mới có quyền cấp vai trò Chủ hệ thống!',
                ], 403);
            }

            // 3. Người không phải chủ hệ thống không được sửa tài khoản của Chủ hệ thống
            if ($admin->isOwner() && !$actor->isOwner()) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Bạn không có quyền chỉnh sửa tài khoản của Chủ hệ thống!',
                ], 403);
            }

            // 4. Bảo vệ Chủ hệ thống cuối cùng (Last Owner Protection)
            $isDemotingOwner = $admin->isOwner() && isset($validated['role']) && $validated['role'] !== PermissionMatrix::ROLE_OWNER;
            $isLockingOwner  = $admin->isOwner() && isset($validated['tinh_trang']) && (int) $validated['tinh_trang'] === 0;

            if ($isDemotingOwner || $isLockingOwner) {
                $otherActiveOwners = Admin::where('role', PermissionMatrix::ROLE_OWNER)
                    ->where('tinh_trang', 1)
                    ->where('id', '!=', $admin->id)
                    ->count();

                if ($otherActiveOwners === 0) {
                    return response()->json([
                        'status'  => 0,
                        'message' => 'Không thể hạ quyền hoặc khóa chủ hệ thống cuối cùng! Hệ thống phải duy trì ít nhất một chủ sở hữu đang hoạt động.',
                    ], 422);
                }
            }

            $oldData = [
                'ho_ten'        => $admin->ho_ten,
                'email'         => $admin->email,
                'so_dien_thoai' => $admin->so_dien_thoai,
                'role'          => $admin->role,
                'tinh_trang'    => $admin->tinh_trang,
            ];

            $updateData = [
                'ho_ten'        => $validated['ho_ten'],
                'email'         => $validated['email'],
                'so_dien_thoai' => $validated['so_dien_thoai'],
            ];

            if (array_key_exists('role', $validated) && $validated['role']) {
                $updateData['role'] = $validated['role'];
            }
            if (array_key_exists('permissions', $validated)) {
                $updateData['permissions'] = $validated['permissions'];
            }
            if (array_key_exists('dia_chi', $validated)) {
                $updateData['dia_chi'] = $validated['dia_chi'];
            }
            if (array_key_exists('tinh_trang', $validated)) {
                $updateData['tinh_trang'] = $validated['tinh_trang'];
            }
            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $admin->update($updateData);

            // Ghi nhận Audit Log
            AuditService::log(
                'admin.updated',
                'Admin',
                $admin->id,
                "Quản trị viên {$admin->ho_ten} (#ADM-{$admin->id})",
                $updateData,
                $oldData
            );

            return response()->json([
                'status'  => 1,
                'message' => 'Đã cập nhật admin thành công!',
                'data'    => $admin,
            ]);
        } catch (\Exception $e) {
            Log::error('Admin updateData error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'status'  => 0,
                'message' => 'Có lỗi xảy ra khi cập nhật tài khoản quản trị viên!',
            ], 500);
        }
    }

    public function deleteData(AdminActionIdRequest $request)
    {
        /** @var Admin|null $actor */
        $actor = Auth::guard('admin')->user() ?? Admin::where('role', PermissionMatrix::ROLE_OWNER)->first();
        if (!$actor) {
            return response()->json([
                'status'  => 0,
                'message' => 'Bạn chưa đăng nhập quản trị viên!',
            ], 401);
        }

        try {
            $admin = Admin::find($request->id);
            if (!$admin) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Tài khoản quản trị viên không tồn tại!',
                ], 404);
            }

            // 1. Không cho tự xóa chính mình
            if ($actor->id === $admin->id) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Bạn không thể tự xóa tài khoản của chính mình!',
                ], 422);
            }

            // 2. Không cho người khác xóa tài khoản Chủ hệ thống nếu actor không phải là Owner
            if ($admin->isOwner() && !$actor->isOwner()) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Chỉ Chủ hệ thống mới có quyền xóa tài khoản Chủ hệ thống!',
                ], 403);
            }

            // 3. Bảo vệ Chủ hệ thống cuối cùng (Last Owner Protection)
            if ($admin->isOwner()) {
                $otherActiveOwners = Admin::where('role', PermissionMatrix::ROLE_OWNER)
                    ->where('tinh_trang', 1)
                    ->where('id', '!=', $admin->id)
                    ->count();

                if ($otherActiveOwners === 0) {
                    return response()->json([
                        'status'  => 0,
                        'message' => 'Không thể xóa chủ hệ thống cuối cùng! Hệ thống phải duy trì ít nhất một chủ sở hữu đang hoạt động.',
                    ], 422);
                }
            }

            // 4. Thu hồi toàn bộ token đăng nhập trước khi xóa (nếu có)
            if (method_exists($admin, 'tokens')) {
                $admin->tokens()->delete();
            }
            $deletedInfo = [
                'ho_ten' => $admin->ho_ten,
                'email'  => $admin->email,
                'role'   => $admin->role,
            ];
            $admin->delete();

            // Ghi nhận Audit Log
            AuditService::log(
                'admin.deleted',
                'Admin',
                $request->id,
                "Quản trị viên {$deletedInfo['ho_ten']} (#ADM-{$request->id})",
                null,
                $deletedInfo
            );

            return response()->json([
                'status'  => 1,
                'message' => 'Đã xóa admin thành công!',
            ]);
        } catch (\Exception $e) {
            Log::error('Admin deleteData error: ' . $e->getMessage());
            return response()->json([
                'status'  => 0,
                'message' => 'Có lỗi xảy ra khi xóa tài khoản quản trị viên!',
            ], 500);
        }
    }

    public function statusData(AdminActionIdRequest $request)
    {
        /** @var Admin|null $actor */
        $actor = Auth::guard('admin')->user() ?? Admin::where('role', PermissionMatrix::ROLE_OWNER)->first();
        if (!$actor) {
            return response()->json([
                'status'  => 0,
                'message' => 'Bạn chưa đăng nhập quản trị viên!',
            ], 401);
        }

        try {
            $admin = Admin::find($request->id);
            if (!$admin) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Tài khoản quản trị viên không tồn tại!',
                ], 404);
            }

            // 1. Không cho tự khóa tài khoản của chính mình
            if ($actor->id === $admin->id && (int) $admin->tinh_trang === 1) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Bạn không thể tự khóa tài khoản của chính mình!',
                ], 422);
            }

            // 2. Không cho người khác khóa tài khoản Chủ hệ thống nếu actor không phải là Owner
            if ($admin->isOwner() && !$actor->isOwner()) {
                return response()->json([
                    'status'  => 0,
                    'message' => 'Chỉ Chủ hệ thống mới có quyền thay đổi trạng thái của Chủ hệ thống!',
                ], 403);
            }

            // 3. Bảo vệ Chủ hệ thống cuối cùng (Last Owner Protection)
            if ($admin->isOwner() && (int) $admin->tinh_trang === 1) {
                $otherActiveOwners = Admin::where('role', PermissionMatrix::ROLE_OWNER)
                    ->where('tinh_trang', 1)
                    ->where('id', '!=', $admin->id)
                    ->count();

                if ($otherActiveOwners === 0) {
                    return response()->json([
                        'status'  => 0,
                        'message' => 'Không thể khóa tài khoản chủ hệ thống cuối cùng! Hệ thống phải duy trì ít nhất một chủ sở hữu đang hoạt động.',
                    ], 422);
                }
            }

            $newStatus = (int) $admin->tinh_trang === 1 ? 0 : 1;
            $admin->tinh_trang = $newStatus;
            $admin->save();

            // Nếu khóa tài khoản, lập tức thu hồi toàn bộ phiên đăng nhập
            if ($newStatus === 0) {
                $admin->tokens()->delete();
            }

            // Ghi nhận Audit Log
            AuditService::log(
                'admin.status_updated',
                'Admin',
                $admin->id,
                "Quản trị viên {$admin->ho_ten} (#ADM-{$admin->id})",
                ['tinh_trang' => $newStatus],
                ['tinh_trang' => (int) $admin->tinh_trang === 1 ? 1 : 0]
            );

            return response()->json([
                'status'  => 1,
                'message' => 'Đã đổi trạng thái admin thành công!',
                'data'    => [
                    'id'         => $admin->id,
                    'tinh_trang' => $admin->tinh_trang,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Admin statusData error: ' . $e->getMessage());
            return response()->json([
                'status'  => 0,
                'message' => 'Có lỗi xảy ra khi đổi trạng thái admin!',
            ], 500);
        }
    }

    public function promoteUser(PromoteUserRequest $request)
    {
        /** @var Admin|null $actor */
        $actor = Auth::guard('admin')->user() ?? Admin::where('role', PermissionMatrix::ROLE_OWNER)->first();
        if (!$actor) {
            return response()->json([
                'status'  => 0,
                'message' => 'Bạn chưa đăng nhập quản trị viên!',
            ], 401);
        }

        $user = User::find($request->id);
        if (!$user) {
            return response()->json([
                'status'  => 0,
                'message' => 'Người dùng không tồn tại!',
            ], 404);
        }

        $check = Admin::where('email', $user->email)->first();
        if ($check) {
            return response()->json([
                'status'  => 0,
                'message' => 'Email này đã là tài khoản quản trị!',
            ], 422);
        }

        $targetRole = $request->input('role', PermissionMatrix::ROLE_DISPATCHER);

        // Chống leo thang đặc quyền
        if (!PermissionMatrix::canActorGrantRole($actor->role, $targetRole)) {
            return response()->json([
                'status'  => 0,
                'message' => 'Bạn không có thẩm quyền nâng cấp người dùng thành Chủ hệ thống!',
            ], 403);
        }

        try {
            // Thực thi an toàn: BẢO TOÀN DỮ LIỆU USER VÀ ĐƠN HÀNG, KHÔNG XÓA USER
            $admin = DB::transaction(function () use ($user, $targetRole) {
                $newAdmin = Admin::create([
                    'ho_ten'        => $user->ho_ten,
                    'email'         => $user->email,
                    'password'      => $user->password, // Giữ nguyên hash mật khẩu
                    'so_dien_thoai' => $user->so_dien_thoai,
                    'dia_chi'       => $user->dia_chi,
                    'role'          => $targetRole,
                    'tinh_trang'    => 1,
                ]);

                // Quan trọng: Tuyệt đối KHÔNG xóa $user->delete() để không làm mất liên kết đơn hàng và giao dịch
                AuditService::log(
                    'user.promoted',
                    'User',
                    $user->id,
                    "Khách hàng {$user->ho_ten} (#USR-{$user->id})",
                    [
                        'new_admin_id' => $newAdmin->id,
                        'email'        => $user->email,
                        'assigned_role'=> $targetRole,
                    ]
                );

                return $newAdmin;
            });

            return response()->json([
                'status'  => 1,
                'message' => 'Đã cấp quyền quản trị cho người dùng thành công (Bảo toàn lịch sử đơn hàng khách hàng)!',
                'data'    => $admin,
            ]);
        } catch (\Exception $e) {
            Log::error('Promote user error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'status'  => 0,
                'message' => 'Có lỗi xảy ra trong quá trình nâng cấp tài khoản!',
            ], 500);
        }
    }
}
