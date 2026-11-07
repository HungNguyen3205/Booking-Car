<?php

namespace App\Services;

use Carbon\CarbonImmutable as C;
use Illuminate\Support\Facades\DB;

/**
 * Live trip tracking from the crew phone (driver or "lơ xe").
 *
 * - The crew presses "Bắt đầu chuyến" in the app; the phone then posts its GPS
 *   position every ~15 s until "Kết thúc chuyến".
 * - Each point is compared with the route line made of the stops that have
 *   coordinates (Studio → Tuyến & điểm đón). Farther than OFF_ROUTE_M from that
 *   line = off route: the trip log records it and the operator gets a notice.
 *   Straight lines between stops are an approximation of the road, so more
 *   stops with coordinates give a tighter check.
 * - Customers see the bus, the route and the trip log ("nhật ký chuyến") for a
 *   booking they own; the owner sees every running trip.
 */
class TrackingService
{
    public const EVENT_LABELS = [
        'started' => 'Xe xuất bến, bắt đầu chia sẻ vị trí',
        'off_route' => 'Xe đi lệch khỏi tuyến đã đăng ký',
        'back_on_route' => 'Xe đã trở lại đúng tuyến',
        'boarded' => 'Bạn đã lên xe (soát vé)',
        'finished' => 'Chuyến đã kết thúc',
    ];

    /** Seconds between accepted points; faster posts are ignored. */
    private const MIN_GAP_S = 5;

    /** A position older than this is shown as "mất tín hiệu". */
    private const STALE_S = 120;

    public function __construct(private OperatorService $ops) {}

    public function offRouteMeters(): int
    {
        return (int) config('danava.off_route_m', 3000);
    }

    public function tripRow(string $id): object
    {
        $t = DB::table('trips')->where('id', $id)->first();
        abort_unless($t, 404, 'Không tìm thấy chuyến');

        return $t;
    }

    /** 'scheduled' | 'running' | 'finished' from the trip log. */
    public function state(string $tripId): string
    {
        $types = DB::table('trip_events')->where('trip_id', $tripId)->whereIn('type', ['started', 'finished'])->pluck('type')->all();
        if (in_array('finished', $types, true)) {
            return 'finished';
        }

        return in_array('started', $types, true) ? 'running' : 'scheduled';
    }

    public function start(object $u, object $trip, ?float $lat, ?float $lng): array
    {
        $this->ops->need(! in_array($trip->status, ['cancelled', 'draft'], true), 409, 'Chuyến chưa mở hoặc đã huỷ');
        $state = $this->state($trip->id);
        $this->ops->need($state !== 'finished', 409, 'Chuyến đã kết thúc');
        if ($state === 'scheduled') {
            $this->event($trip, $u, 'started', null, $lat, $lng);
            $this->ops->audit($u, $trip->tenant_id, 'trips.tracking_start', $trip->id);
        }
        if ($lat !== null && $lng !== null) {
            $this->record($u, $trip, ['lat' => $lat, 'lng' => $lng]);
        }

        return $this->view($trip, true);
    }

    public function finish(object $u, object $trip): array
    {
        $this->ops->need($this->state($trip->id) === 'running', 409, 'Chuyến chưa bắt đầu hoặc đã kết thúc');
        $this->event($trip, $u, 'finished');
        $this->ops->audit($u, $trip->tenant_id, 'trips.tracking_finish', $trip->id);

        return $this->view($trip, true);
    }

    /** Store one GPS point; returns whether it was kept and the on-route check. */
    public function record(object $u, object $trip, array $p): array
    {
        $this->ops->need($this->state($trip->id) === 'running', 409, 'Bấm "Bắt đầu chuyến" trước khi chia sẻ vị trí');
        $now = $this->ops->now();
        $last = DB::table('trip_positions')->where('trip_id', $trip->id)->orderByDesc('id')->first();
        if ($last && C::parse($last->recorded_at)->diffInSeconds(C::parse($now)) < self::MIN_GAP_S) {
            return ['kept' => false, 'offRoute' => (bool) $last->off_route, 'routeDistanceM' => $last->route_distance_m];
        }
        $line = $this->routeLine($trip);
        $distance = count($line) >= 2 ? (int) round($this->distanceToLine((float) $p['lat'], (float) $p['lng'], $line)) : null;
        $off = $distance !== null && $distance > $this->offRouteMeters();
        DB::table('trip_positions')->insert([
            'trip_id' => $trip->id, 'tenant_id' => $trip->tenant_id, 'user_id' => $u->id,
            'lat' => round((float) $p['lat'], 6), 'lng' => round((float) $p['lng'], 6),
            'accuracy' => $p['accuracy'] ?? null, 'speed' => $p['speed'] ?? null, 'heading' => $p['heading'] ?? null,
            'route_distance_m' => $distance, 'off_route' => $off, 'recorded_at' => $now,
        ]);
        $wasOff = $last ? (bool) $last->off_route : false;
        if ($off && ! $wasOff) {
            $this->event($trip, $u, 'off_route', 'Cách tuyến khoảng '.number_format($distance / 1000, 1, ',', '.').' km', (float) $p['lat'], (float) $p['lng']);
            $code = $this->ops->data($trip)['code'] ?? $trip->id;
            $this->ops->notify($trip->tenant_id, 'Chuyến '.$code.' đang đi lệch tuyến khoảng '.number_format($distance / 1000, 1, ',', '.').' km. Kiểm tra với tài xế.');
        } elseif (! $off && $wasOff) {
            $this->event($trip, $u, 'back_on_route', null, (float) $p['lat'], (float) $p['lng']);
        }

        return ['kept' => true, 'offRoute' => $off, 'routeDistanceM' => $distance];
    }

    /**
     * Everything the map and trip log need. $staff adds the full path; customers
     * get the same view (it is their own trip) plus their own boarding time.
     */
    public function view(object $trip, bool $staff, ?object $booking = null): array
    {
        $d = $this->ops->data($trip);
        $route = $this->route($trip);
        $vehicle = $d['vehicle'] ?? [];
        $start = C::parse($trip->depart_at)->setTimezone('Asia/Ho_Chi_Minh');
        $stops = [];
        foreach (['pickups' => 'pickup', 'dropoffs' => 'dropoff'] as $key => $kind) {
            foreach ($route[$key] ?? [] as $s) {
                $stops[] = ['id' => $s['id'], 'kind' => $kind, 'name' => $s['name'], 'address' => $s['address'] ?? '',
                    'time' => $start->addMinutes((int) ($s['offset'] ?? 0))->format('H:i'),
                    'lat' => $s['lat'] ?? null, 'lng' => $s['lng'] ?? null];
            }
        }
        $last = DB::table('trip_positions')->where('trip_id', $trip->id)->orderByDesc('id')->first();
        $path = DB::table('trip_positions')->where('trip_id', $trip->id)->orderByDesc('id')->limit($staff ? 720 : 360)
            ->get(['lat', 'lng'])->reverse()->map(fn ($p) => [(float) $p->lat, (float) $p->lng])->values();
        $events = DB::table('trip_events')->where('trip_id', $trip->id)->orderBy('id')->get()
            ->map(fn ($e) => ['type' => $e->type, 'label' => self::EVENT_LABELS[$e->type] ?? $e->type, 'note' => $e->note, 'at' => $e->created_at])->all();
        if ($booking && ($at = $this->ops->data($booking)['checkedInAt'] ?? null)) {
            $events[] = ['type' => 'boarded', 'label' => self::EVENT_LABELS['boarded'], 'note' => null, 'at' => $at];
            usort($events, fn ($a, $b) => strcmp($a['at'], $b['at']));
        }

        return [
            'trip' => [
                'id' => $trip->id, 'code' => $d['code'] ?? '', 'from' => $route['from'] ?? '', 'to' => $route['to'] ?? '',
                'departAt' => $trip->depart_at, 'endAt' => $trip->end_at, 'status' => $trip->status,
                'operator' => $this->ops->tenant($trip->tenant_id)['name'] ?? '',
                'vehicle' => $vehicle['name'] ?? '', 'plate' => $vehicle['plate'] ?? '',
            ],
            'state' => $this->state($trip->id),
            'stops' => $stops,
            'routeChecked' => count($this->routeLine($trip)) >= 2,
            'offRouteThresholdM' => $this->offRouteMeters(),
            'position' => $last ? [
                'lat' => (float) $last->lat, 'lng' => (float) $last->lng, 'speed' => $last->speed, 'heading' => $last->heading,
                'accuracy' => $last->accuracy, 'at' => $last->recorded_at, 'offRoute' => (bool) $last->off_route,
                'routeDistanceM' => $last->route_distance_m,
                'stale' => C::parse($last->recorded_at)->diffInSeconds(C::now('UTC')) > self::STALE_S,
            ] : null,
            'path' => $path,
            'events' => $events,
        ];
    }

    private function event(object $trip, ?object $u, string $type, ?string $note = null, ?float $lat = null, ?float $lng = null): void
    {
        DB::table('trip_events')->insert(['trip_id' => $trip->id, 'tenant_id' => $trip->tenant_id, 'user_id' => $u?->id, 'type' => $type,
            'note' => $note, 'lat' => $lat, 'lng' => $lng, 'created_at' => $this->ops->now()]);
    }

    /**
     * The live route record (so coordinates added in Studio apply to trips
     * already scheduled), falling back to the copy saved with the trip.
     */
    private function route(object $trip): array
    {
        $snapshot = $this->ops->data($trip)['route'] ?? [];
        $live = DB::table('records')->where(['tenant_id' => $trip->tenant_id, 'kind' => 'routes', 'id' => $trip->route_id])->first();

        return $live ? $this->ops->data($live) + $snapshot : $snapshot;
    }

    /** Stops with coordinates (+ GPS-only waypoints), in travel order: pickups, waypoints, drop-offs. */
    public function routeLine(object $trip): array
    {
        $route = $this->route($trip);
        $line = [];
        foreach (['pickups', 'waypoints', 'dropoffs'] as $key) {
            foreach ($route[$key] ?? [] as $s) {
                if (isset($s['lat'], $s['lng'])) {
                    $line[] = [(float) $s['lat'], (float) $s['lng']];
                }
            }
        }

        return $line;
    }

    /** Metres from a point to the nearest segment of $line (equirectangular, fine at road scale). */
    public function distanceToLine(float $lat, float $lng, array $line): float
    {
        $r = 6371000.0;
        $k = cos(deg2rad($lat));
        $xy = fn ($p) => [deg2rad($p[1]) * $k * $r, deg2rad($p[0]) * $r];
        [$px, $py] = $xy([$lat, $lng]);
        $best = INF;
        for ($i = 0; $i < count($line) - 1; $i++) {
            [$ax, $ay] = $xy($line[$i]);
            [$bx, $by] = $xy($line[$i + 1]);
            $dx = $bx - $ax;
            $dy = $by - $ay;
            $len = $dx * $dx + $dy * $dy;
            $t = $len > 0 ? max(0, min(1, (($px - $ax) * $dx + ($py - $ay) * $dy) / $len)) : 0;
            $best = min($best, hypot($px - ($ax + $t * $dx), $py - ($ay + $t * $dy)));
        }

        return $best;
    }
}
