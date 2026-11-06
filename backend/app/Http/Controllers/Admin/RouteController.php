<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Studio "Tuyến & điểm đón" on live route records (used by trips and public search). */
class RouteController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function rows(Request $r)
    {
        return $this->bridge->scoped(DB::table('records')->where('kind', 'routes'), $this->bridge->scope($r))->orderByDesc('created_at')->get()
            ->map(fn ($row) => $this->ops->record($row));
    }

    public function index(Request $r)
    {
        $items = $this->rows($r)->map(fn ($x) => $this->bridge->route($x));
        if ($r->filled('status')) {
            $items = $items->where('status', $r->query('status'));
        }

        return response()->json(['status' => 1, 'data' => $items->values()]);
    }

    public function show(Request $r, string $id)
    {
        $route = $this->rows($r)->firstWhere('id', $id);
        abort_unless($route, 404, 'Không tìm thấy tuyến');

        return response()->json(['status' => 1, 'data' => $this->bridge->route($route)]);
    }

    /** Studio stops (pickup/dropoff/both) -> live pickups/dropoffs; defaults to the two terminals. */
    private function payload(array $b, ?array $old = null): array
    {
        $from = $b['from_city'] ?? $old['from'];
        $to = $b['to_city'] ?? $old['to'];
        $duration = (int) ($b['duration_minutes'] ?? $old['durationMinutes']);
        $pickups = $old['pickups'] ?? [];
        $dropoffs = $old['dropoffs'] ?? [];
        if (array_key_exists('stops', $b) && is_array($b['stops'])) {
            $pickups = $dropoffs = [];
            foreach (array_values($b['stops']) as $i => $s) {
                if (! trim($s['name'] ?? '')) {
                    continue;
                }
                $stop = ['id' => $s['id'] ?? 'stop-'.($i + 1), 'name' => trim($s['name']), 'address' => trim($s['address'] ?? '') ?: trim($s['name']),
                    'offset' => max(0, min($duration, (int) ($s['time_offset_minutes'] ?? 0)))];
                $type = $s['stop_type'] ?? 'pickup';
                if (in_array($type, ['pickup', 'both'], true)) {
                    $pickups[] = $stop + ['id' => $stop['id']];
                }
                if (in_array($type, ['dropoff', 'both'], true)) {
                    $dropoffs[] = ['id' => $stop['id'].($type === 'both' ? '-drop' : '')] + $stop;
                }
            }
        }
        if (! $pickups) {
            $pickups = [['id' => 'pickup-start', 'name' => 'Bến '.$from, 'address' => $from, 'offset' => 0]];
        }
        if (! $dropoffs) {
            $dropoffs = [['id' => 'dropoff-end', 'name' => 'Bến '.$to, 'address' => $to, 'offset' => $duration]];
        }

        return [
            'name' => $b['name'] ?? $old['name'] ?? trim($from.' → '.$to), 'from' => $from, 'to' => $to, 'durationMinutes' => $duration,
            'basePrice' => (int) ($b['base_price'] ?? $old['basePrice'] ?? 0), 'distanceKm' => (int) ($b['distance_km'] ?? $old['distanceKm'] ?? 0),
            'active' => ($b['status'] ?? (($old['active'] ?? true) ? 'active' : 'inactive')) === 'active',
            'pickups' => $pickups, 'dropoffs' => $dropoffs,
        ];
    }

    private function rules(bool $partial): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return [
            'name' => "$req|string|max:150", 'from_city' => "$req|string|max:80", 'to_city' => "$req|string|max:80",
            'distance_km' => 'nullable|integer|min:0|max:5000', 'duration_minutes' => "$req|integer|min:10|max:2880",
            'base_price' => 'nullable|integer|min:0|max:100000000', 'status' => 'nullable|string|in:active,inactive',
            'stops' => 'nullable|array|max:30', 'stops.*.name' => 'nullable|string|max:150', 'stops.*.address' => 'nullable|string|max:300',
            'stops.*.stop_type' => 'nullable|string|in:pickup,dropoff,both', 'stops.*.time_offset_minutes' => 'nullable|integer|min:0',
        ];
    }

    public function store(Request $r)
    {
        $u = $this->bridge->user($r);
        $b = $r->validate($this->rules(false));
        $tid = $this->bridge->writeTenant($r);
        $route = $this->ops->saveRecord($tid, 'routes', $this->payload($b), $u);

        return response()->json(['status' => 1, 'message' => 'Đã lưu tuyến đường', 'data' => $this->bridge->route($route)]);
    }

    public function update(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $old = $this->rows($r)->firstWhere('id', $id);
        abort_unless($old, 404, 'Không tìm thấy tuyến');
        $b = $r->validate($this->rules(true));
        $route = $this->ops->saveRecord($old['tenantId'], 'routes', $this->payload($b, $old), $u, $id);

        return response()->json(['status' => 1, 'message' => 'Đã cập nhật tuyến', 'data' => $this->bridge->route($route)]);
    }

    public function destroy(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $old = $this->rows($r)->firstWhere('id', $id);
        abort_unless($old, 404, 'Không tìm thấy tuyến');
        abort_if(DB::table('trips')->where('route_id', $id)->exists(), 409, 'Tuyến đã có chuyến chạy, không thể xoá. Hãy chuyển sang "Ngừng hoạt động".');
        DB::table('records')->where(['id' => $id, 'tenant_id' => $old['tenantId']])->delete();
        $this->ops->audit($u, $old['tenantId'], 'routes.delete', $id);

        return response()->json(['status' => 1, 'message' => 'Đã xoá tuyến']);
    }
}
