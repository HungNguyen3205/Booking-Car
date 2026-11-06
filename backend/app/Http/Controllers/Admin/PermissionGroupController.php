<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\Authorization\PermissionMatrix;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Two-tier custom permission groups.
 *  Tier 1: platform groups (partner_id = null) usable by every operator.
 *  Tier 2: groups owned by one operator (partner_id set).
 * Effective permissions of an admin = role defaults ∪ group ∪ individually granted.
 */
class PermissionGroupController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    /** Operators may only touch their own groups; platform groups are platform-managed. */
    private function editable(Request $r, object $g): void
    {
        $u = $this->bridge->user($r);
        abort_unless($this->bridge->isPlatform($u) || ($g->partner_id && $g->partner_id === $u->tenant_id), 403, 'Chỉ sửa được nhóm quyền của nhà xe mình');
    }

    private function codes(): array
    {
        return array_keys(PermissionMatrix::getAllPermissions());
    }

    private function view(object $g): array
    {
        return [
            'id' => $g->id,
            'partner_id' => $g->partner_id,
            'partner_name' => $g->partner_name ?? null,
            'name' => $g->name,
            'description' => $g->description,
            'permissions' => json_decode($g->permissions ?? '[]', true) ?: [],
            'member_count' => (int) ($g->member_count ?? 0),
            'scope' => $g->partner_id ? 'partner' : 'platform',
        ];
    }

    public function index(Request $r)
    {
        $q = DB::table('permission_groups as g')
            ->leftJoin('tenants as p', 'p.id', '=', 'g.partner_id')
            ->select('g.*', 'p.name as partner_name')
            ->selectSub(DB::table('users')->selectRaw('count(*)')->whereColumn('users.permission_group_id', 'g.id'), 'member_count')
            ->orderByRaw('g.partner_id is not null')->orderBy('g.name');
        $scope = $this->bridge->scope($r);
        if ($scope !== null) {
            // An operator sees platform groups plus its own.
            $q->where(fn ($w) => $w->whereNull('g.partner_id')->orWhereIn('g.partner_id', $scope));
        }

        return response()->json([
            'status' => 1,
            'data' => $q->get()->map(fn ($g) => $this->view($g))->values(),
            'permissions' => array_values(PermissionMatrix::getAllPermissions()),
        ]);
    }

    private function validated(Request $r, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $r->validate([
            'name' => "$req|string|max:120",
            'description' => 'nullable|string|max:255',
            'partner_id' => 'nullable|exists:tenants,id',
            'permissions' => "$req|array",
            'permissions.*' => 'string|in:'.implode(',', $this->codes()),
        ]);
    }

    public function store(Request $r)
    {
        $b = $this->validated($r);
        $u = $this->bridge->user($r);
        $b['partner_id'] = $this->bridge->isPlatform($u) ? ($b['partner_id'] ?? null) : $u->tenant_id;
        $id = (string) Str::uuid();
        DB::table('permission_groups')->insert([
            'id' => $id, 'partner_id' => $b['partner_id'] ?? null, 'name' => $b['name'],
            'description' => $b['description'] ?? null, 'permissions' => json_encode(array_values(array_unique($b['permissions']))),
            'created_at' => now(), 'updated_at' => now(),
        ]);
        AuditLog::create(['action' => 'permission_group.created', 'target_type' => 'PermissionGroup', 'target_id' => $id, 'target_label' => $b['name'], 'actor_email' => $r->user()?->email, 'new_values' => $b]);

        return response()->json(['status' => 1, 'message' => 'Đã tạo nhóm quyền', 'data' => $this->view(DB::table('permission_groups')->find($id))]);
    }

    public function update(Request $r, string $id)
    {
        $g = DB::table('permission_groups')->find($id) ?? abort(404, 'Không tìm thấy nhóm quyền');
        $this->editable($r, $g);
        $b = $this->validated($r, true);
        $patch = ['updated_at' => now()];
        foreach (['name', 'description'] as $k) {
            if (array_key_exists($k, $b)) {
                $patch[$k] = $b[$k];
            }
        }
        if (array_key_exists('permissions', $b)) {
            $patch['permissions'] = json_encode(array_values(array_unique($b['permissions'])));
        }
        DB::table('permission_groups')->where('id', $id)->update($patch);
        AuditLog::create(['action' => 'permission_group.updated', 'target_type' => 'PermissionGroup', 'target_id' => $id, 'target_label' => $g->name, 'actor_email' => $r->user()?->email, 'old_values' => (array) $g, 'new_values' => $patch]);

        return response()->json(['status' => 1, 'message' => 'Đã lưu nhóm quyền', 'data' => $this->view(DB::table('permission_groups')->find($id))]);
    }

    public function destroy(Request $r, string $id)
    {
        $g = DB::table('permission_groups')->find($id) ?? abort(404, 'Không tìm thấy nhóm quyền');
        $this->editable($r, $g);
        $members = DB::table('users')->where('permission_group_id', $id)->count();
        abort_if($members > 0, 422, "Nhóm đang có {$members} nhân sự. Hãy chuyển họ sang nhóm khác trước khi xoá.");
        DB::table('permission_groups')->where('id', $id)->delete();
        AuditLog::create(['action' => 'permission_group.deleted', 'target_type' => 'PermissionGroup', 'target_id' => $id, 'target_label' => $g->name, 'actor_email' => $r->user()?->email, 'old_values' => (array) $g]);

        return response()->json(['status' => 1, 'message' => 'Đã xoá nhóm quyền']);
    }

    /** Assign (or clear) the group of one login account. Group must be platform-wide or the account's own operator. */
    public function assign(Request $r, string $adminId)
    {
        $u = $this->bridge->user($r);
        $b = $r->validate(['permission_group_id' => 'nullable|string|exists:permission_groups,id']);
        $target = DB::table('users')->find($adminId);
        abort_unless($target && $target->tenant_id && $this->bridge->inScope($this->bridge->scope($r, ''), $target->tenant_id), 404, 'Không tìm thấy nhân sự');
        abort_if($u->role === 'manager' && in_array($target->role, ['owner', 'manager'], true), 403, 'Quản lý không đổi quyền của chủ/quản lý');
        if ($gid = $b['permission_group_id'] ?? null) {
            $g = DB::table('permission_groups')->find($gid);
            abort_if($g->partner_id && $g->partner_id !== $target->tenant_id, 422, 'Nhóm quyền này thuộc nhà xe khác');
        }
        DB::table('users')->where('id', $adminId)->update(['permission_group_id' => $gid ?? null]);
        AuditLog::create(['action' => 'permission_group.assigned', 'target_type' => 'User', 'target_id' => $adminId, 'target_label' => $target->email, 'actor_email' => $u->email, 'new_values' => ['permission_group_id' => $gid ?? null]]);
        $this->ops->audit($u, $target->tenant_id, 'staff.permission_group', $adminId, ['group' => $gid ?? null]);

        return response()->json(['status' => 1, 'message' => 'Đã cập nhật nhóm quyền cho nhân sự']);
    }
}
