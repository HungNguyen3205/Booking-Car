<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Carbon\CarbonImmutable as C;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Studio "Chuyến chạy" on live trips (the inventory customers book from). */
class TripController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function counts(array $tripIds): array
    {
        if (! $tripIds) {
            return [];
        }

        return DB::table('inventory')->whereIn('trip_id', $tripIds)->whereNotNull('booking_id')
            ->select('trip_id', DB::raw('COUNT(*) as n'))->groupBy('trip_id')->pluck('n', 'trip_id')->all();
    }

    private function rows(Request $r)
    {
        $u = $this->bridge->user($r);
        $q = $this->bridge->scoped(DB::table('trips'), $this->bridge->scope($r))->orderByDesc('depart_at');
        if ($u->role === 'driver') {
            $q->where('driver_id', $u->driver_id ?: 'unassigned');
        }

        return $q;
    }

    public function index(Request $r)
    {
        $q = $this->rows($r);
        if ($r->filled('route_id')) {
            $q->where('route_id', $r->query('route_id'));
        }
        if ($r->filled('date')) {
            $q->whereBetween('depart_at', $this->bridge->utcBounds($r->query('date'), $r->query('date')));
        }
        $rows = $q->limit(1000)->get();
        $counts = $this->counts($rows->pluck('id')->all());
        $items = $rows->map(fn ($t) => $this->bridge->trip($t, ['booked' => (int) ($counts[$t->id] ?? 0)]));
        if ($r->filled('status')) {
            $items = $items->where('status', $r->query('status'));
        }

        return response()->json(['status' => 1, 'data' => $this->bridge->page($items->values(), $r, 50)]);
    }

    private function find(Request $r, string $id): object
    {
        $row = $this->rows($r)->where('id', $id)->first();
        abort_unless($row, 404, 'Không tìm thấy chuyến');

        return $row;
    }

    public function show(Request $r, string $id)
    {
        $row = $this->find($r, $id);
        $trip = $this->bridge->trip($row);
        $trip['seats'] = $this->ops->trip($row)['seats'];
        $trip['route']['stops'] = $this->bridge->route($this->ops->resource($row->tenant_id, 'routes', $row->route_id))['stops'];

        return response()->json(['status' => 1, 'data' => $trip]);
    }

    /** depart_time is Vietnam local "YYYY-MM-DD HH:mm" (or ISO); arrive time follows the route duration. */
    public function store(Request $r)
    {
        $u = $this->bridge->user($r);
        $b = $r->validate([
            'route_id' => 'required|string', 'bus_vehicle_id' => 'required|string', 'driver_id' => 'nullable|string',
            'depart_time' => 'required|date', 'base_price' => 'required|integer|min:1000|max:100000000',
            'status' => 'nullable|string|in:draft,scheduled',
        ]);
        $tid = $this->bridge->writeTenant($r);
        $start = C::parse($b['depart_time'], StudioBridge::TZ);
        $trip = $this->ops->saveTrip($tid, ['date' => $start->format('Y-m-d'), 'time' => $start->format('H:i'), 'price' => (int) $b['base_price'],
            'vehicleId' => $b['bus_vehicle_id'], 'routeId' => $b['route_id'], 'driverId' => $b['driver_id'] ?? ''], $u);
        $message = 'Đã lên lịch chuyến (bản nháp)';
        if (($b['status'] ?? 'scheduled') === 'scheduled') {
            $autoPublish = $this->bridge->isPlatform($u) || ($this->ops->tenant($tid)['autoPublish'] ?? false) === true;
            if ($autoPublish) {
                $this->ops->tripStatus($tid, $trip['id'], 'published', $u);
                $message = 'Đã lên lịch và mở bán chuyến';
            } else {
                $this->ops->tripStatus($tid, $trip['id'], 'pending', $u);
                $message = 'Đã lên lịch chuyến, chờ nền tảng duyệt mở bán';
            }
        }

        return response()->json(['status' => 1, 'message' => $message, 'data' => $this->bridge->trip($this->ops->tripRow($tid, $trip['id']))]);
    }

    /**
     * Status changes map to the live lifecycle:
     *   scheduled -> published (mở bán), running -> closed (xuất bến, đóng bán),
     *   completed, cancelled (huỷ chuyến: huỷ vé, giải phóng ghế, báo hoàn tiền).
     * Other fields re-save the trip (only allowed while it has no tickets).
     */
    public function update(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $row = $this->find($r, $id);
        $b = $r->validate([
            'status' => 'sometimes|string|in:draft,pending,scheduled,published,running,closed,completed,cancelled',
            'route_id' => 'sometimes|string', 'bus_vehicle_id' => 'sometimes|string', 'driver_id' => 'nullable|string',
            'depart_time' => 'sometimes|date', 'base_price' => 'sometimes|integer|min:1000|max:100000000',
        ]);
        $fields = array_intersect_key($b, array_flip(['route_id', 'bus_vehicle_id', 'driver_id', 'depart_time', 'base_price']));
        if ($fields) {
            $d = $this->ops->data($row);
            $start = C::parse($b['depart_time'] ?? $this->bridge->local($row->depart_at), StudioBridge::TZ);
            $this->ops->saveTrip($row->tenant_id, ['date' => $start->format('Y-m-d'), 'time' => $start->format('H:i'), 'price' => (int) ($b['base_price'] ?? $d['price']),
                'vehicleId' => $b['bus_vehicle_id'] ?? $row->vehicle_id, 'routeId' => $b['route_id'] ?? $row->route_id,
                'driverId' => array_key_exists('driver_id', $b) ? ($b['driver_id'] ?? '') : ($row->driver_id ?? '')], $u, $id);
        }
        if (isset($b['status'])) {
            $target = ['scheduled' => 'published', 'running' => 'closed'][$b['status']] ?? $b['status'];
            if ($target !== $row->status) {
                $this->ops->tripStatus($row->tenant_id, $id, $target, $u);
            }
        }

        return response()->json(['status' => 1, 'message' => 'Đã cập nhật chuyến', 'data' => $this->bridge->trip($this->ops->tripRow($row->tenant_id, $id))]);
    }

    public function manifest(Request $r, string $id)
    {
        $row = $this->find($r, $id);
        $bookings = $this->bridge->bookings(
            $this->bridge->bookingRows([$row->tenant_id])->where('trip_id', $id)->where('status', '!=', 'cancelled')->values()
        )->sortBy('customer_name')->values();
        $trip = $this->bridge->trip($row);
        $trip['route']['stops'] = $this->bridge->route($this->ops->resource($row->tenant_id, 'routes', $row->route_id))['stops'];

        return response()->json(['status' => 1, 'data' => ['trip' => $trip, 'passenger_manifest' => $bookings]]);
    }

    public function destroy(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $row = $this->find($r, $id);
        $this->ops->tripStatus($row->tenant_id, $id, 'cancelled', $u);

        return response()->json(['status' => 1, 'message' => 'Đã hủy chuyến; vé trên chuyến được hủy và đánh dấu cần hoàn tiền nếu đã thu']);
    }
}
