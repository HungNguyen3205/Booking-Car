<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Studio "Nhà xe" on live tenants. Platform admins create operators and set
 * status/commission; owners/managers see and edit only their own contact and bank details.
 */
class PartnerController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function withStats(array $tenantIds): array
    {
        if (! $tenantIds) {
            return [];
        }
        $trips = DB::table('trips')->whereIn('tenant_id', $tenantIds)->select('tenant_id', DB::raw('COUNT(*) as n'))->groupBy('tenant_id')->pluck('n', 'tenant_id');
        $seats = DB::table('inventory as i')->join('bookings as b', 'b.id', '=', 'i.booking_id')->whereIn('b.tenant_id', $tenantIds)
            ->select('b.tenant_id', DB::raw('COUNT(*) as n'))->groupBy('b.tenant_id')->pluck('n', 'tenant_id');
        $revenue = DB::table('ledger')->whereIn('tenant_id', $tenantIds)
            ->selectRaw("tenant_id, coalesce(sum(CASE WHEN kind='collection' THEN amount WHEN kind='refund' THEN -amount ELSE 0 END),0) as v")
            ->groupBy('tenant_id')->pluck('v', 'tenant_id');

        return ['trips' => $trips, 'seats' => $seats, 'revenue' => $revenue];
    }

    public function index(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $rows = $this->bridge->scoped(DB::table('tenants'), $scope, 'id')->orderBy('name')->get();
        if ($r->filled('status')) {
            $rows = $rows->where('status', $r->query('status'));
        }
        $stats = $this->withStats($rows->pluck('id')->all());
        $items = $rows->map(fn ($t) => $this->bridge->partner($this->bridge->tenant($t->id)) + [
            'trips_count' => (int) ($stats['trips'][$t->id] ?? 0),
            'tickets_sold' => (int) ($stats['seats'][$t->id] ?? 0),
            'total_revenue' => (int) ($stats['revenue'][$t->id] ?? 0),
        ]);
        if ($r->filled('search')) {
            $s = mb_strtolower(trim($r->query('search')));
            $items = $items->filter(fn ($p) => str_contains(mb_strtolower($p['name'].' '.$p['phone'].' '.$p['email']), $s));
        }

        return response()->json(['status' => 1, 'data' => $items->values()]);
    }

    public function show(Request $r, string $id)
    {
        abort_unless($this->bridge->inScope($this->bridge->scope($r, ''), $id), 403, 'Không có quyền xem nhà xe này');
        $p = $this->bridge->partner($this->bridge->tenant($id));
        $p['vehicles'] = collect($this->ops->records($id, 'vehicles'))->map(fn ($v) => $this->bridge->vehicle($v))->values();
        $p['routes'] = collect($this->ops->records($id, 'routes'))->map(fn ($x) => $this->bridge->route($x))->values();
        $p['drivers'] = collect($this->ops->records($id, 'drivers'))->map(fn ($d) => ['id' => $d['id'], 'name' => $d['name'], 'phone' => $d['phone'] ?? '', 'license_number' => $d['license'] ?? ''])->values();

        return response()->json(['status' => 1, 'data' => $p]);
    }

    public function store(Request $r)
    {
        $u = $this->bridge->allow($r, 'platform');
        $b = $r->validate([
            'name' => 'required|string|max:150', 'slug' => 'nullable|string|max:50', 'phone' => 'required|string|max:30',
            'email' => 'nullable|email|max:150', 'address' => 'nullable|string|max:255', 'commission_rate' => 'required|numeric|min:0|max:50',
            'status' => 'nullable|string|in:active,suspended,pending', 'auto_publish' => 'nullable|boolean',
        ]);
        $slug = Str::slug($b['slug'] ?? $b['name']);
        abort_if(DB::table('tenants')->where('slug', $slug)->exists(), 422, 'Định danh nhà xe đã tồn tại');
        $t = $this->ops->createTenant(['name' => $b['name'], 'slug' => $slug, 'phone' => $b['phone'], 'email' => $b['email'] ?? '', 'address' => $b['address'] ?? '',
            'commissionBps' => (int) round($b['commission_rate'] * 100), 'autoPublish' => (bool) ($b['auto_publish'] ?? false)], $u);
        if (($b['status'] ?? 'active') !== 'active') {
            DB::table('tenants')->where('id', $t['id'])->update(['status' => $b['status']]);
        }
        $this->updateExtras($t['id'], $r);

        return response()->json(['status' => 1, 'message' => 'Đã tạo nhà xe '.$t['name'], 'data' => $this->bridge->partner($this->ops->tenant($t['id']))]);
    }

    private function updateExtras(string $id, Request $r): void
    {
        $extra = $r->validate(['contract_number' => 'nullable|string|max:80', 'bank_name' => 'nullable|string|max:100', 'bank_account' => 'nullable|string|max:50', 'bank_holder' => 'nullable|string|max:100']);
        if (! $extra) {
            return;
        }
        $row = DB::table('tenants')->where('id', $id)->first();
        $d = $this->ops->data($row);
        foreach (['contract_number' => 'contractNumber', 'bank_name' => 'bankName', 'bank_account' => 'bankAccount', 'bank_holder' => 'bankHolder'] as $k => $key) {
            if (array_key_exists($k, $extra)) {
                $d[$key] = (string) ($extra[$k] ?? '');
            }
        }
        DB::table('tenants')->where('id', $id)->update(['data' => $this->ops->json($d)]);
    }

    public function update(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $platform = $this->bridge->isPlatform($u);
        abort_unless($platform || ($u->tenant_id === $id && in_array($u->role, ['owner', 'manager'], true)), 403, 'Không có quyền sửa nhà xe này');
        $b = $r->validate([
            'name' => 'sometimes|string|max:150', 'phone' => 'sometimes|string|max:30', 'email' => 'nullable|email|max:150',
            'address' => 'nullable|string|max:255', 'commission_rate' => 'sometimes|numeric|min:0|max:50',
            'status' => 'sometimes|string|in:active,suspended,pending', 'auto_publish' => 'sometimes|boolean',
        ]);
        abort_if(! $platform && array_intersect_key($b, array_flip(['commission_rate', 'status', 'auto_publish'])), 403, 'Chỉ nền tảng được đổi hoa hồng, trạng thái hoặc quyền tự mở bán');
        $row = DB::table('tenants')->where('id', $id)->first() ?? abort(404, 'Nhà xe không tồn tại');
        $d = $this->ops->data($row);
        foreach (['phone' => 'phone', 'email' => 'email', 'address' => 'address'] as $k => $key) {
            if (array_key_exists($k, $b)) {
                $d[$key] = (string) ($b[$k] ?? '');
            }
        }
        if (isset($b['commission_rate'])) {
            $d['commissionBps'] = (int) round($b['commission_rate'] * 100);
        }
        if (isset($b['auto_publish'])) {
            $d['autoPublish'] = (bool) $b['auto_publish'];
        }
        DB::table('tenants')->where('id', $id)->update(['data' => $this->ops->json($d), 'name' => $b['name'] ?? $row->name, 'status' => $b['status'] ?? $row->status]);
        $this->updateExtras($id, $r);
        $this->ops->audit($u, $id, 'tenant.update', $id, array_keys($b));

        return response()->json(['status' => 1, 'message' => 'Đã cập nhật nhà xe', 'data' => $this->bridge->partner($this->ops->tenant($id))]);
    }

    /** Never hard-delete an operator with history: suspend it (hides its inventory). */
    public function destroy(Request $r, string $id)
    {
        $u = $this->bridge->allow($r, 'platform');
        abort_unless(DB::table('tenants')->where('id', $id)->exists(), 404, 'Nhà xe không tồn tại');
        DB::table('tenants')->where('id', $id)->update(['status' => 'suspended']);
        $this->ops->audit($u, $id, 'tenant.status', $id, ['status' => 'suspended']);

        return response()->json(['status' => 1, 'message' => 'Đã tạm ngưng nhà xe (giữ nguyên lịch sử)']);
    }
}
