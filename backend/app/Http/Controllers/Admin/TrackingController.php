<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use App\Services\TrackingService;
use Carbon\CarbonImmutable as C;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Trip crew and live tracking for Studio and the app's crew/owner screens.
 *
 * - crew / assign: owners pick the driver and the "lơ xe" of a trip. Allowed
 *   after tickets are sold (unlike re-saving the trip) until it is completed.
 * - start / position / finish: only the assigned crew (or owner, manager,
 *   dispatcher) drive the GPS log of a trip.
 * - live: running trips of the day with their last position (owner map).
 */
class TrackingController extends Controller
{
    /** Roles that may start/stop a trip and send its position. */
    private const DRIVERS = ['owner', 'manager', 'dispatcher', 'driver', 'assistant'];

    public function __construct(OperatorService $ops, private StudioBridge $bridge, private TrackingService $tracking)
    {
        parent::__construct($ops);
    }

    /** @return array{0: object, 1: object} [user, trip] */
    private function trip(Request $r, string $id, bool $drive = false): array
    {
        $u = $this->bridge->user($r);
        $trip = $this->tracking->tripRow($id);
        abort_unless($this->bridge->inScope($this->bridge->scope($r, ''), $trip->tenant_id), 404, 'Không tìm thấy chuyến');
        abort_unless(StudioBridge::onTrip($u, $trip), 403, 'Không phải chuyến được phân công');
        abort_if($drive && ! $this->bridge->isPlatform($u) && ! in_array($u->role, self::DRIVERS, true), 403, 'Chỉ tổ lái hoặc điều hành được bật định vị chuyến');

        return [$u, $trip];
    }

    private function coords(Request $r, bool $required): array
    {
        return $r->validate([
            'lat' => ($required ? 'required' : 'nullable').'|numeric|between:-90,90',
            'lng' => ($required ? 'required' : 'nullable').'|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0|max:100000', 'speed' => 'nullable|numeric|min:0|max:100',
            'heading' => 'nullable|numeric|min:0|max:360',
        ]);
    }

    public function show(Request $r, string $id)
    {
        [, $trip] = $this->trip($r, $id);

        return response()->json(['status' => 1, 'data' => $this->tracking->view($trip, true)]);
    }

    public function start(Request $r, string $id)
    {
        [$u, $trip] = $this->trip($r, $id, true);
        $b = $this->coords($r, false);

        return response()->json(['status' => 1, 'message' => 'Đã bắt đầu chuyến, đang chia sẻ vị trí',
            'data' => $this->tracking->start($u, $trip, isset($b['lat']) ? (float) $b['lat'] : null, isset($b['lng']) ? (float) $b['lng'] : null)]);
    }

    public function position(Request $r, string $id)
    {
        [$u, $trip] = $this->trip($r, $id, true);

        return response()->json(['status' => 1, 'data' => $this->tracking->record($u, $trip, $this->coords($r, true))]);
    }

    public function finish(Request $r, string $id)
    {
        [$u, $trip] = $this->trip($r, $id, true);

        return response()->json(['status' => 1, 'message' => 'Đã kết thúc chuyến', 'data' => $this->tracking->finish($u, $trip)]);
    }

    /** Today's trips in scope with tracking state and last position (owner map / crew list). */
    public function live(Request $r)
    {
        $u = $this->bridge->user($r);
        $day = $r->query('date') ?: C::now(StudioBridge::TZ)->toDateString();
        abort_unless(preg_match('/^\d{4}-\d{2}-\d{2}$/', $day), 422, 'Ngày không hợp lệ');
        $q = $this->bridge->scoped(DB::table('trips'), $this->bridge->scope($r))->whereBetween('depart_at', $this->bridge->utcBounds($day, $day))
            ->whereNotIn('status', ['draft', 'cancelled'])->orderBy('depart_at');
        StudioBridge::crewFilter($q, $u);
        $items = $q->get()->map(function ($t) {
            $v = $this->tracking->view($t, false);

            return ['trip' => $v['trip'], 'state' => $v['state'], 'position' => $v['position'], 'routeChecked' => $v['routeChecked'],
                'driver' => $this->bridge->driver($t->driver_id), 'assistant' => $this->bridge->driver($t->assistant_id ?? null)];
        })->values();

        return response()->json(['status' => 1, 'data' => ['date' => $day, 'trips' => $items]]);
    }

    /** Crew records (tài xế + lơ xe) of the operator, with their login if any. */
    public function crew(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $logins = DB::table('users')->whereNotNull('driver_id')->whereIn('role', array_keys(StudioBridge::CREW))->pluck('email', 'driver_id');
        $rows = $this->bridge->scoped(DB::table('records')->where('kind', 'drivers'), $scope)->orderBy('created_at')->get()
            ->map(function ($row) use ($logins) {
                $d = $this->ops->data($row);

                return ['id' => $row->id, 'partner_id' => $row->tenant_id, 'name' => $d['name'] ?? '', 'phone' => $d['phone'] ?? '',
                    'position' => ($d['position'] ?? 'driver') === 'assistant' ? 'assistant' : 'driver',
                    'license' => $d['license'] ?? '', 'active' => ($d['active'] ?? true) !== false, 'login' => $logins[$row->id] ?? null];
            })->values();

        return response()->json(['status' => 1, 'data' => $rows]);
    }

    /** Assign the driver and the assistant of a trip (area: fleet). */
    public function assign(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $trip = $this->tracking->tripRow($id);
        abort_unless($this->bridge->inScope($this->bridge->scope($r, ''), $trip->tenant_id), 404, 'Không tìm thấy chuyến');
        $b = $r->validate(['driver_id' => 'nullable|string', 'assistant_id' => 'nullable|string']);
        $this->ops->need(! in_array($trip->status, ['cancelled', 'completed'], true), 409, 'Chuyến đã kết thúc hoặc đã huỷ');
        $set = [];
        foreach (['driver_id' => 'driver', 'assistant_id' => 'assistant'] as $column => $position) {
            if (! array_key_exists($column, $b)) {
                continue;
            }
            $crewId = ($b[$column] ?? '') ?: null;
            if ($crewId) {
                $c = $this->ops->resource($trip->tenant_id, 'drivers', $crewId);
                $this->ops->need(($c['active'] ?? true) !== false, 422, 'Nhân sự đang tạm nghỉ');
                $this->ops->need((($c['position'] ?? 'driver') === 'assistant' ? 'assistant' : 'driver') === $position, 422, $position === 'driver' ? 'Người được chọn không phải tài xế' : 'Người được chọn không phải lơ xe');
                if ($position === 'driver') {
                    $day = C::parse($trip->depart_at)->setTimezone(StudioBridge::TZ)->toDateString();
                    $this->ops->need(! ($c['licenseExpiry'] ?? '') || $c['licenseExpiry'] >= $day, 422, 'Giấy phép lái xe đã hết hạn');
                }
                $busy = DB::table('trips')->where('id', '!=', $trip->id)->whereNotIn('status', ['cancelled', 'completed'])
                    ->where('depart_at', '<', $trip->end_at)->where('end_at', '>', $trip->depart_at)
                    ->where(fn ($q) => $q->where('driver_id', $crewId)->orWhere('assistant_id', $crewId))->exists();
                $this->ops->need(! $busy, 409, ($c['name'] ?? 'Nhân sự').' đã được phân công chuyến khác cùng giờ');
            }
            $set[$column] = $crewId;
        }
        if ($set) {
            DB::table('trips')->where('id', $trip->id)->update($set);
            $this->ops->audit($u, $trip->tenant_id, 'trips.crew', $trip->id, $set);
        }

        return response()->json(['status' => 1, 'message' => 'Đã cập nhật tổ lái', 'data' => $this->bridge->trip($this->tracking->tripRow($id))]);
    }
}
