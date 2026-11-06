<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Authorization\PermissionMatrix;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Studio "Nhân sự" = real login accounts (users) of each operator. Same rules as
 * the operator API: managers cannot create/lock owners or managers, nobody locks
 * themselves, the last active owner cannot be locked, passwords >= 12 chars.
 */
class AdminController extends Controller
{
    public const ROLES = [
        'owner' => 'Chủ nhà xe', 'manager' => 'Quản lý', 'dispatcher' => 'Điều hành',
        'sales' => 'Bán vé', 'accountant' => 'Kế toán', 'driver' => 'Tài xế',
    ];

    /** Legacy Studio role values -> live roles. */
    private const LEGACY = ['admin' => 'manager', 'operator_staff' => 'sales'];

    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function view(object $u): array
    {
        return [
            'id' => $u->id, 'ho_ten' => $u->name, 'email' => $u->email, 'so_dien_thoai' => '', 'dia_chi' => '',
            'role' => $u->role, 'role_label' => self::ROLES[$u->role] ?? ($u->role === 'platform' ? 'Quản trị nền tảng' : $u->role),
            'partner_id' => $u->tenant_id, 'partner_name' => $u->tenant_id ? $this->bridge->tenant($u->tenant_id)['name'] : 'Nền tảng',
            'permission_group_id' => $u->permission_group_id ?? null, 'all_permissions' => PermissionMatrix::effectiveForUser($u),
            'tinh_trang' => $u->active ? 1 : 0, 'driver_id' => $u->driver_id, 'created_at' => $this->bridge->local($u->created_at),
        ];
    }

    private function target(Request $r, string $id): object
    {
        $t = DB::table('users')->where('id', $id)->first();
        abort_unless($t && $t->tenant_id && $this->bridge->inScope($this->bridge->scope($r, ''), $t->tenant_id), 404, 'Không tìm thấy nhân sự');

        return $t;
    }

    private function guard(object $actor, string $role): void
    {
        abort_if($actor->role === 'manager' && in_array($role, ['owner', 'manager'], true), 403, 'Quản lý không được tạo/sửa/khoá chủ nhà xe hoặc quản lý khác');
    }

    public function getData(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $rows = $this->bridge->scoped(DB::table('users')->whereNotNull('tenant_id'), $scope)->orderBy('name')->get();

        return response()->json([
            'status' => 1,
            'data' => $rows->map(fn ($u) => $this->view($u))->values(),
            'roles' => collect(self::ROLES)->map(fn ($name, $code) => ['code' => $code, 'name' => $name])->values(),
            'permissions_matrix' => PermissionMatrix::getAllPermissions(),
        ]);
    }

    public function createData(Request $r)
    {
        $actor = $this->bridge->user($r);
        $r->merge(['role' => self::LEGACY[$r->input('role')] ?? $r->input('role')]);
        $b = $r->validate([
            'ho_ten' => 'required|string|max:150', 'email' => 'required|email|max:200|unique:users,email',
            'password' => 'required|string|min:12|max:200', 'role' => 'required|in:'.implode(',', array_keys(self::ROLES)),
            'driver_id' => 'nullable|string', 'permission_group_id' => 'nullable|string|exists:permission_groups,id',
        ], ['email.unique' => 'Email đã được dùng cho tài khoản khác', 'password.min' => 'Mật khẩu tối thiểu 12 ký tự']);
        $tid = $this->bridge->writeTenant($r);
        $this->guard($actor, $b['role']);
        if (! empty($b['driver_id'])) {
            $this->ops->resource($tid, 'drivers', $b['driver_id']);
        }
        $id = $this->ops->uuid();
        User::create(['id' => $id, 'tenant_id' => $tid, 'name' => $b['ho_ten'], 'email' => strtolower($b['email']), 'password' => Hash::make($b['password']),
            'role' => $b['role'], 'active' => true, 'driver_id' => ($b['driver_id'] ?? '') ?: null, 'created_at' => $this->ops->now()]);
        if (! empty($b['permission_group_id'])) {
            DB::table('users')->where('id', $id)->update(['permission_group_id' => $b['permission_group_id']]);
        }
        $this->ops->audit($actor, $tid, 'staff.create', $id, ['role' => $b['role']]);

        return response()->json(['status' => 1, 'message' => 'Đã tạo tài khoản. Nhân sự đăng nhập tại /manage bằng email và mật khẩu vừa đặt.', 'data' => $this->view(DB::table('users')->find($id))]);
    }

    public function updateData(Request $r)
    {
        $actor = $this->bridge->user($r);
        $r->merge(['role' => self::LEGACY[$r->input('role')] ?? $r->input('role')]);
        $b = $r->validate(['id' => 'required|string', 'ho_ten' => 'sometimes|string|max:150', 'role' => 'sometimes|in:'.implode(',', array_keys(self::ROLES)),
            'password' => 'nullable|string|min:12|max:200', 'tinh_trang' => 'sometimes|integer|in:0,1']);
        $t = $this->target($r, $b['id']);
        $this->guard($actor, $t->role);
        if (isset($b['role'])) {
            $this->guard($actor, $b['role']);
            abort_if($actor->id === $t->id && $b['role'] !== $t->role, 409, 'Không tự đổi vai trò của chính mình');
        }
        if (isset($b['tinh_trang'])) {
            $this->checkLock($actor, $t, (bool) $b['tinh_trang']);
        }
        $patch = array_filter(['name' => $b['ho_ten'] ?? null, 'role' => $b['role'] ?? null], fn ($v) => $v !== null);
        if (isset($b['tinh_trang'])) {
            $patch['active'] = (bool) $b['tinh_trang'];
        }
        if (! empty($b['password'])) {
            $patch['password'] = Hash::make($b['password']);
        }
        if ($patch) {
            DB::table('users')->where('id', $t->id)->update($patch);
        }
        $this->ops->audit($actor, $t->tenant_id, 'staff.update', $t->id, array_keys($patch));

        return response()->json(['status' => 1, 'message' => 'Đã cập nhật nhân sự', 'data' => $this->view(DB::table('users')->find($t->id))]);
    }

    private function checkLock(object $actor, object $t, bool $active): void
    {
        if ($active) {
            return;
        }
        abort_if($actor->id === $t->id, 409, 'Không tự khoá tài khoản của chính mình');
        if ($t->role === 'owner') {
            abort_unless(DB::table('users')->where(['tenant_id' => $t->tenant_id, 'role' => 'owner', 'active' => true])->where('id', '!=', $t->id)->exists(), 409, 'Không khoá chủ nhà xe cuối cùng');
        }
    }

    public function statusData(Request $r)
    {
        $actor = $this->bridge->user($r);
        $t = $this->target($r, (string) $r->input('id'));
        $this->guard($actor, $t->role);
        $active = ! $t->active;
        $this->checkLock($actor, $t, $active);
        DB::table('users')->where('id', $t->id)->update(['active' => $active]);
        $this->ops->audit($actor, $t->tenant_id, 'staff.'.($active ? 'unlock' : 'lock'), $t->id);

        return response()->json(['status' => 1, 'message' => $active ? 'Đã mở khoá tài khoản' : 'Đã khoá tài khoản (phiên đăng nhập cũ bị chặn)']);
    }

    /** Accounts with history are locked, never deleted (ledger/audit keep their author). */
    public function deleteData(Request $r)
    {
        $actor = $this->bridge->user($r);
        $t = $this->target($r, (string) $r->input('id'));
        $this->guard($actor, $t->role);
        $this->checkLock($actor, $t, false);
        $used = DB::table('ledger')->where('actor_id', $t->id)->exists() || DB::table('audit')->where('actor_id', $t->id)->exists();
        if ($used) {
            DB::table('users')->where('id', $t->id)->update(['active' => false]);

            return response()->json(['status' => 1, 'message' => 'Tài khoản đã có lịch sử thao tác nên được khoá thay vì xoá']);
        }
        DB::table('notice_reads')->where('user_id', $t->id)->delete();
        DB::table('users')->where('id', $t->id)->delete();
        $this->ops->audit($actor, $t->tenant_id, 'staff.delete', $t->id);

        return response()->json(['status' => 1, 'message' => 'Đã xoá tài khoản']);
    }
}
