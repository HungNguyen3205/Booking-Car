<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Studio "Ưu đãi" on live promotion records: the same codes customers enter
 * when booking (OperatorService::reserve validates them). Each code belongs to one operator.
 */
class PromotionController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function usage(array $tenantIds): array
    {
        $used = [];
        foreach ($this->bridge->scoped(DB::table('bookings')->where('status', '!=', 'cancelled'), $tenantIds ?: null)->get(['tenant_id', 'data']) as $b) {
            $code = $this->ops->data($b)['promoCode'] ?? '';
            if ($code !== '') {
                $used[$b->tenant_id.'|'.$code] = ($used[$b->tenant_id.'|'.$code] ?? 0) + 1;
            }
        }

        return $used;
    }

    private function view(array $p, array $used): array
    {
        return [
            'id' => $p['id'], 'partner_id' => $p['tenantId'], 'code' => $p['code'], 'title' => $p['name'],
            'discount_type' => $p['discountType'], 'discount_value' => (int) $p['value'],
            'min_order_amount' => 0, 'max_discount' => null, 'usage_limit' => (int) $p['limit'],
            'used_count' => $used[$p['tenantId'].'|'.$p['code']] ?? 0,
            'start_date' => $p['starts'], 'end_date' => $p['ends'], 'is_active' => (bool) $p['active'], 'route_id' => $p['routeId'] ?? '',
            'partner' => ['id' => $p['tenantId'], 'name' => $this->bridge->tenant($p['tenantId'])['name']],
        ];
    }

    public function index(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $rows = $this->bridge->scoped(DB::table('records')->where('kind', 'promotions'), $scope)->orderByDesc('created_at')->get()->map(fn ($x) => $this->ops->record($x));
        $used = $this->usage($rows->pluck('tenantId')->unique()->values()->all());

        return response()->json(['status' => 1, 'data' => [
            'promotions' => $rows->map(fn ($p) => $this->view($p, $used))->values(),
            'posts' => $this->bridge->isPlatform($this->bridge->user($r)) ? Post::orderByDesc('created_at')->limit(10)->get() : [],
        ]]);
    }

    private function payload(array $b, ?array $old = null): array
    {
        return [
            'name' => $b['title'] ?? $old['name'], 'code' => $b['code'] ?? $old['code'],
            'discountType' => $b['discount_type'] ?? $old['discountType'], 'value' => (int) ($b['discount_value'] ?? $old['value']),
            'starts' => substr((string) ($b['start_date'] ?? $old['starts']), 0, 10), 'ends' => substr((string) ($b['end_date'] ?? $old['ends']), 0, 10),
            'limit' => (int) ($b['usage_limit'] ?? $old['limit'] ?? 100), 'routeId' => $b['route_id'] ?? $old['routeId'] ?? '',
            'active' => array_key_exists('is_active', $b) ? (bool) $b['is_active'] : (bool) ($old['active'] ?? true),
        ];
    }

    public function store(Request $r)
    {
        $u = $this->bridge->user($r);
        $b = $r->validate([
            'code' => 'required|string|max:30', 'title' => 'required|string|max:150', 'discount_type' => 'required|in:fixed,percent',
            'discount_value' => 'required|integer|min:1', 'usage_limit' => 'nullable|integer|min:1|max:100000',
            'start_date' => 'required|date', 'end_date' => 'required|date|after_or_equal:start_date', 'is_active' => 'nullable|boolean',
            'route_id' => 'nullable|string',
        ]);
        $tid = $this->bridge->writeTenant($r);
        abort_if(DB::table('records')->where(['tenant_id' => $tid, 'kind' => 'promotions', 'identifier' => strtoupper($b['code'])])->exists(), 422, 'Mã ưu đãi đã tồn tại ở nhà xe này');
        $p = $this->ops->saveRecord($tid, 'promotions', $this->payload($b), $u);

        return response()->json(['status' => 1, 'message' => 'Đã tạo mã ưu đãi '.$p['code'], 'data' => $this->view($p, [])]);
    }

    private function find(Request $r, string $id): array
    {
        $row = $this->bridge->scoped(DB::table('records')->where(['kind' => 'promotions', 'id' => $id]), $this->bridge->scope($r, ''))->first();
        abort_unless($row, 404, 'Không tìm thấy mã ưu đãi');

        return $this->ops->record($row);
    }

    public function update(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $old = $this->find($r, $id);
        $b = $r->validate([
            'title' => 'sometimes|string|max:150', 'discount_type' => 'sometimes|in:fixed,percent', 'discount_value' => 'sometimes|integer|min:1',
            'usage_limit' => 'sometimes|integer|min:1|max:100000', 'start_date' => 'sometimes|date', 'end_date' => 'sometimes|date', 'is_active' => 'sometimes|boolean',
        ]);
        $p = $this->ops->saveRecord($old['tenantId'], 'promotions', $this->payload($b, $old), $u, $id);

        return response()->json(['status' => 1, 'message' => 'Đã cập nhật mã ưu đãi', 'data' => $this->view($p, [])]);
    }

    /** Codes already used on tickets are deactivated instead of deleted. */
    public function destroy(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $old = $this->find($r, $id);
        if (($this->usage([$old['tenantId']])[$old['tenantId'].'|'.$old['code']] ?? 0) > 0) {
            $this->ops->saveRecord($old['tenantId'], 'promotions', ['active' => false] + $this->payload([], $old), $u, $id);

            return response()->json(['status' => 1, 'message' => 'Mã đã được dùng trên vé nên được tắt thay vì xoá']);
        }
        DB::table('records')->where(['id' => $id, 'tenant_id' => $old['tenantId']])->delete();
        $this->ops->audit($u, $old['tenantId'], 'promotions.delete', $id);

        return response()->json(['status' => 1, 'message' => 'Đã xoá mã ưu đãi']);
    }
}
