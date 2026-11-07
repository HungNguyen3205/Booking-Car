<?php

namespace App\Services;

use Carbon\CarbonImmutable as C;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Bridges the Studio UI (/api/admin/*) to the live booking model used by the
 * website, appgo and operator apps (tenants, records, trips, bookings, ledger).
 *
 * - Scope: platform users see every operator (optionally filtered by
 *   ?partner_id); every other role is locked to its own tenant.
 * - Areas: each Studio module is allowed for a set of roles.
 * - Mappers: live rows -> the JSON shapes the Studio views already render.
 *
 * "partner" in the Studio API == "tenant" in the live model (same id).
 */
class StudioBridge
{
    public const TZ = 'Asia/Ho_Chi_Minh';

    /** Studio area => roles allowed besides platform. */
    public const AREAS = [
        'overview' => ['owner', 'manager', 'dispatcher', 'sales', 'accountant'],
        'bookings' => ['owner', 'manager', 'dispatcher', 'sales'],
        'trips' => ['owner', 'manager', 'dispatcher', 'sales', 'driver', 'assistant'],   // read; writes need 'fleet'
        'fleet' => ['owner', 'manager', 'dispatcher'],
        'checkin' => ['owner', 'manager', 'dispatcher', 'sales', 'driver', 'assistant'],
        'customers' => ['owner', 'manager', 'sales'],
        'finance' => ['owner', 'manager', 'accountant'],
        'reports' => ['owner', 'manager', 'accountant'],
        'staff' => ['owner', 'manager'],
        'marketing' => ['owner', 'manager'],
        'partner' => ['owner', 'manager'],      // own operator profile only
        'platform' => [],                         // platform-wide settings, domains, all operators
    ];

    /**
     * Crew roles see only trips they are assigned to: a driver by trips.driver_id,
     * an assistant ("lơ xe") by trips.assistant_id. users.driver_id holds the
     * crew record (records kind=drivers) for both.
     */
    public const CREW = ['driver' => 'driver_id', 'assistant' => 'assistant_id'];

    public static function crewColumn(object $u): ?string
    {
        return self::CREW[$u->role] ?? null;
    }

    /** Limit a trips query (or a join aliased by $prefix) to the crew member's trips. */
    public static function crewFilter($query, object $u, string $prefix = '')
    {
        if ($column = self::crewColumn($u)) {
            $query->where($prefix.$column, $u->driver_id ?: 'unassigned');
        }

        return $query;
    }

    /** True when $u may act on $trip: not crew, or assigned to it. */
    public static function onTrip(object $u, object $trip): bool
    {
        $column = self::crewColumn($u);

        return ! $column || ($u->driver_id && ($trip->{$column} ?? null) === $u->driver_id);
    }

    private array $tenantCache = [];

    private array $recordCache = [];

    public function __construct(private OperatorService $ops) {}

    /* ---------------------------------------------------------------- scope */

    public function user(Request $r): object
    {
        $u = $r->user();
        abort_unless($u && $u->active, 401, 'Vui lòng đăng nhập');
        abort_if($u->role === 'customer', 403, 'Tài khoản khách không dùng được Studio');
        if ($u->tenant_id) {
            abort_unless(DB::table('tenants')->where('id', $u->tenant_id)->value('status') === 'active', 403, 'Nhà xe đang tạm ngưng');
        }

        return $u;
    }

    public function isPlatform(object $u): bool
    {
        return $u->role === 'platform';
    }

    public function allow(Request $r, string $area): object
    {
        $u = $this->user($r);
        abort_unless($this->isPlatform($u) || in_array($u->role, self::AREAS[$area] ?? [], true), 403, 'Tài khoản của bạn không có quyền dùng mục này');

        return $u;
    }

    /** Tenant ids visible for a read: null = every operator (platform, no filter). */
    public function scope(Request $r, ?string $partnerId = null): ?array
    {
        $u = $this->user($r);
        $partnerId ??= $r->query('partner_id') ?: $r->input('partner_id');
        if ($this->isPlatform($u)) {
            return $partnerId ? [$partnerId] : null;
        }
        abort_unless($u->tenant_id, 403, 'Tài khoản chưa gắn nhà xe');
        abort_if($partnerId && $partnerId !== $u->tenant_id, 403, 'Không có quyền xem dữ liệu nhà xe khác');

        return [$u->tenant_id];
    }

    /** Tenant id for a write. Platform must name the operator. */
    public function writeTenant(Request $r, ?string $partnerId = null): string
    {
        $u = $this->user($r);
        $partnerId ??= $r->input('partner_id') ?: $r->query('partner_id');
        if ($this->isPlatform($u)) {
            abort_unless($partnerId && DB::table('tenants')->where('id', $partnerId)->exists(), 422, 'Chọn nhà xe trước');

            return $partnerId;
        }
        abort_if($partnerId && $partnerId !== $u->tenant_id, 403, 'Không có quyền thao tác trên nhà xe khác');

        return $u->tenant_id;
    }

    public function inScope(?array $scope, ?string $tid): bool
    {
        return $scope === null || in_array($tid, $scope, true);
    }

    public function scoped($query, ?array $scope, string $column = 'tenant_id')
    {
        return $scope === null ? $query : $query->whereIn($column, $scope);
    }

    /* ---------------------------------------------------------------- time */

    /** Live timestamps are UTC ISO strings; Studio shows Vietnam local time. */
    public function local(?string $iso): ?string
    {
        if (! $iso) {
            return null;
        }

        return C::parse($iso)->setTimezone(self::TZ)->format('Y-m-d H:i:s');
    }

    /** Vietnam local "Y-m-d" (or datetime) -> UTC ISO bounds used in the live tables. */
    public function utcBounds(string $fromDay, string $toDay): array
    {
        return [
            C::parse($fromDay, self::TZ)->startOfDay()->utc()->format('Y-m-d\TH:i:s.v\Z'),
            C::parse($toDay, self::TZ)->endOfDay()->utc()->format('Y-m-d\TH:i:s.v\Z'),
        ];
    }

    /* ---------------------------------------------------------------- lookups */

    public function tenant(string $id): array
    {
        return $this->tenantCache[$id] ??= $this->ops->tenant($id);
    }

    public function recordById(?string $id): ?array
    {
        if (! $id) {
            return null;
        }
        if (! array_key_exists($id, $this->recordCache)) {
            $row = DB::table('records')->where('id', $id)->first();
            $this->recordCache[$id] = $row ? $this->ops->record($row) : null;
        }

        return $this->recordCache[$id];
    }

    /** Net paid per booking id in one query. */
    public function paidMap(iterable $bookingIds): array
    {
        $ids = collect($bookingIds)->values()->all();
        if (! $ids) {
            return [];
        }

        return DB::table('ledger')->whereIn('booking_id', $ids)
            ->selectRaw("booking_id, coalesce(sum(CASE WHEN kind='collection' THEN amount WHEN kind='refund' THEN -amount ELSE 0 END),0) as paid")
            ->groupBy('booking_id')->pluck('paid', 'booking_id')->map(fn ($v) => (int) $v)->all();
    }

    /** Who created each booking (from the live audit trail). */
    public function creatorMap(iterable $bookingIds): array
    {
        $ids = collect($bookingIds)->values()->all();
        if (! $ids) {
            return [];
        }

        return DB::table('audit')->where('action', 'bookings.create')->whereIn('entity_id', $ids)->pluck('actor_id', 'entity_id')->all();
    }

    /** Bookings in scope, optionally limited to trips departing in [from,to] (local days). */
    public function bookingRows(?array $scope, ?string $fromDay = null, ?string $toDay = null): Collection
    {
        $q = $this->scoped(DB::table('bookings as b'), $scope, 'b.tenant_id')
            ->join('trips as t', 't.id', '=', 'b.trip_id')
            ->select('b.*', 't.depart_at as trip_depart_at', 't.end_at as trip_end_at', 't.status as trip_status', 't.route_id as trip_route_id', 't.driver_id as trip_driver_id', 't.assistant_id as trip_assistant_id');
        if ($fromDay && $toDay) {
            [$a, $z] = $this->utcBounds($fromDay, $toDay);
            $q->whereBetween('t.depart_at', [$a, $z]);
        }

        return $q->orderByDesc('b.created_at')->get();
    }

    /**
     * Some Studio side tables (seat_layouts, reconciliations, partner_domains)
     * keep a foreign key to `partners`. Mirror the tenant into `partners` under
     * the same id so those rows can reference a live operator.
     */
    public function ensurePartnerRow(string $tid): void
    {
        $t = $this->tenant($tid);
        $values = ['name' => $t['name'], 'phone' => $t['phone'] ?? null, 'email' => $t['email'] ?? null, 'address' => $t['address'] ?? null,
            'commission_rate' => round(((int) ($t['commissionBps'] ?? 0)) / 100, 2), 'status' => $t['status'], 'updated_at' => now()];
        if (DB::table('partners')->where('id', $tid)->exists()) {
            DB::table('partners')->where('id', $tid)->update($values);

            return;
        }
        $slug = DB::table('partners')->where('slug', $t['slug'])->exists() ? $t['slug'].'-'.substr($tid, 0, 6) : $t['slug'];
        DB::table('partners')->insert($values + ['id' => $tid, 'slug' => $slug, 'created_at' => now()]);
    }

    /* ---------------------------------------------------------------- mappers */

    public function partner(array $t): array
    {
        return [
            'id' => $t['id'], 'name' => $t['name'], 'slug' => $t['slug'],
            'phone' => $t['phone'] ?? '', 'email' => $t['email'] ?? '', 'address' => $t['address'] ?? '',
            'description' => $t['description'] ?? '',
            'commission_rate' => round(((int) ($t['commissionBps'] ?? 0)) / 100, 2),
            'status' => $t['status'], 'auto_publish' => (bool) ($t['autoPublish'] ?? false),
            'branding' => ['color' => $t['color'] ?? '', 'logo' => $t['logo'] ?? '', 'hero' => $t['hero'] ?? ''],
            'bank_name' => $t['bankName'] ?? '', 'bank_account' => $t['bankAccount'] ?? '', 'bank_holder' => $t['bankHolder'] ?? '',
            'contract_number' => $t['contractNumber'] ?? '',
        ];
    }

    public function partnerRef(string $tid): array
    {
        $t = $this->tenant($tid);

        return ['id' => $t['id'], 'name' => $t['name'], 'slug' => $t['slug'], 'phone' => $t['phone'] ?? ''];
    }

    public function route(array $r): array
    {
        $stops = [];
        foreach (($r['pickups'] ?? []) as $i => $s) {
            $stops[] = ['id' => $s['id'], 'name' => $s['name'], 'address' => $s['address'] ?? '', 'stop_type' => 'pickup', 'time_offset_minutes' => (int) ($s['offset'] ?? 0), 'extra_fee' => 0, 'sort_order' => $i, 'lat' => $s['lat'] ?? null, 'lng' => $s['lng'] ?? null];
        }
        foreach (($r['dropoffs'] ?? []) as $i => $s) {
            $stops[] = ['id' => $s['id'], 'name' => $s['name'], 'address' => $s['address'] ?? '', 'stop_type' => 'dropoff', 'time_offset_minutes' => (int) ($s['offset'] ?? 0), 'extra_fee' => 0, 'sort_order' => 100 + $i, 'lat' => $s['lat'] ?? null, 'lng' => $s['lng'] ?? null];
        }

        return [
            'id' => $r['id'], 'partner_id' => $r['tenantId'], 'name' => $r['name'],
            'from_city' => $r['from'] ?? '', 'to_city' => $r['to'] ?? '',
            'distance_km' => (int) ($r['distanceKm'] ?? 0), 'duration_minutes' => (int) ($r['durationMinutes'] ?? 0),
            'base_price' => (int) ($r['basePrice'] ?? 0), 'status' => ($r['active'] ?? true) ? 'active' : 'inactive',
            'partner' => $this->partnerRef($r['tenantId']), 'stops' => $stops,
        ];
    }

    public function vehicle(array $v): array
    {
        return [
            'id' => $v['id'], 'partner_id' => $v['tenantId'], 'name' => $v['name'],
            'plate_number' => $v['plate'] ?? '', 'category' => $v['category'] ?? 'sleeper',
            'capacity' => (int) ($v['capacity'] ?? 0), 'floor_count' => (int) ($v['floors'] ?? 1),
            'amenities' => $v['amenities'] ?? [], 'image_url' => $v['image'] ?? '', 'description' => $v['description'] ?? '',
            'inspection_date' => ($v['inspectionDate'] ?? '') ?: null,
            'status' => ($v['maintenance'] ?? false) ? 'maintenance' : 'active',
            'seat_codes' => $v['seatCodes'] ?? [],
            'seat_map' => $v['seatMap'] ?? app(OperatorService::class)->defaultSeatMap($v['category'] ?? 'sleeper', (int) ($v['capacity'] ?? 0), (int) ($v['floors'] ?? 1), $v['seatCodes'] ?? []),
            'partner' => $this->partnerRef($v['tenantId']),
        ];
    }

    public function driver(?string $id): ?array
    {
        $d = $this->recordById($id);

        return $d ? ['id' => $d['id'], 'name' => $d['name'], 'phone' => $d['phone'] ?? ''] : null;
    }

    /** Live trip status -> Studio label key. Published trips en route read as "running". */
    public function tripStatus(object $row): string
    {
        if ($row->status === 'published') {
            $now = $this->ops->now();

            return $row->depart_at <= $now ? 'running' : 'scheduled'; // departed: no longer on sale, awaiting "Hoàn tất"
        }
        if ($row->status === 'closed') {
            return 'running'; // "Xuất bến": sales closed, bus on the road until marked completed
        }

        return $row->status;
    }

    public function trip(object $row, ?array $counts = null): array
    {
        $d = $this->ops->data($row);
        $v = $d['vehicle'];
        $route = $d['route'];
        $booked = $counts['booked'] ?? (int) DB::table('inventory')->where('trip_id', $row->id)->whereNotNull('booking_id')->count();
        $capacity = (int) ($v['capacity'] ?? 0) - count($d['blockedSeats'] ?? []);

        return [
            'id' => $row->id, 'code' => $d['code'] ?? '', 'partner_id' => $row->tenant_id, 'route_id' => $row->route_id,
            'bus_vehicle_id' => $row->vehicle_id, 'driver_id' => $row->driver_id,
            'depart_time' => $this->local($row->depart_at), 'arrive_time' => $this->local($row->end_at),
            'base_price' => (int) ($d['price'] ?? 0), 'status' => $this->tripStatus($row), 'raw_status' => $row->status,
            'booked_seats_count' => $booked, 'available_seats_count' => max(0, $capacity - $booked),
            'partner' => $this->partnerRef($row->tenant_id),
            'route' => ['id' => $row->route_id, 'name' => $route['name'], 'from_city' => $route['from'], 'to_city' => $route['to'], 'duration_minutes' => (int) $route['durationMinutes']],
            'vehicle' => ['id' => $row->vehicle_id, 'name' => $v['name'], 'plate_number' => $v['plate'] ?? '', 'category' => $v['category'], 'capacity' => (int) $v['capacity'], 'floor_count' => (int) ($v['floors'] ?? 1)],
            'driver' => $this->driver($row->driver_id),
            'assistant_id' => $row->assistant_id ?? null,
            'assistant' => $this->driver($row->assistant_id ?? null),
        ];
    }

    public function paymentStatus(object $row, int $paid, int $total): string
    {
        if ($row->payment_status === 'unpaid' && $paid > 0 && $paid < $total) {
            return 'partially_paid';
        }

        return $row->payment_status; // unpaid | paid | refund_due | refunded
    }

    public function booking(object $row, int $paid = 0, ?string $creator = null): array
    {
        $d = $this->ops->data($row);
        $p = $d['passenger'] ?? [];
        $trip = $d['trip'] ?? [];
        $find = fn ($stops, $id) => collect($stops ?? [])->firstWhere('id', $id);
        $pickup = $find($trip['departureStops'] ?? [], $p['pickupStopId'] ?? '');
        $dropoff = $find($trip['dropoffStops'] ?? [], $p['dropoffStopId'] ?? '');
        $total = (int) ($d['totalAmount'] ?? 0);
        $departAt = $row->trip_depart_at ?? $trip['departAt'] ?? null;
        $endAt = $row->trip_end_at ?? $trip['endAt'] ?? null;

        return [
            'id' => $row->id, 'booking_code' => $row->id, 'partner_id' => $row->tenant_id, 'trip_id' => $row->trip_id,
            'customer_name' => $p['fullName'] ?? '', 'customer_phone' => $p['phone'] ?? '', 'customer_email' => $p['email'] ?? '',
            'seats' => $d['selectedSeats'] ?? [], 'seat_count' => count($d['selectedSeats'] ?? []),
            'pickup_stop_id' => $p['pickupStopId'] ?? null, 'dropoff_stop_id' => $p['dropoffStopId'] ?? null,
            'pickup_stop' => $pickup ? ['name' => $pickup['name'], 'address' => $pickup['address'] ?? '', 'time' => $pickup['time'] ?? ''] : null,
            'dropoff_stop' => $dropoff ? ['name' => $dropoff['name'], 'address' => $dropoff['address'] ?? '', 'time' => $dropoff['time'] ?? ''] : null,
            'total_amount' => $total + (int) ($d['discount'] ?? 0), 'discount_amount' => (int) ($d['discount'] ?? 0), 'final_amount' => $total,
            'paid_amount' => $paid, 'due_amount' => max(0, $total - $paid),
            'payment_status' => $this->paymentStatus($row, $paid, $total), 'booking_status' => $row->status,
            'payment_method' => $d['paymentMethod'] ?? 'cash', 'promo_code' => $d['promoCode'] ?? '',
            'notes' => $p['note'] ?? '', 'source' => $row->source, 'created_by' => $creator,
            'checked_in_at' => $this->local($d['checkedInAt'] ?? null),
            'created_at' => $this->local($row->created_at),
            'partner' => $this->partnerRef($row->tenant_id),
            'trip' => [
                'id' => $row->trip_id, 'code' => $trip['code'] ?? '',
                'depart_time' => $this->local($departAt), 'arrive_time' => $this->local($endAt),
                'status' => $row->trip_status ?? ($trip['status'] ?? null),
                'route' => ['name' => trim(($trip['from'] ?? '').' → '.($trip['to'] ?? '')), 'from_city' => $trip['from'] ?? '', 'to_city' => $trip['to'] ?? ''],
                'vehicle' => ['name' => $trip['vehicle']['name'] ?? '', 'plate_number' => $trip['plate'] ?? '', 'category' => $trip['vehicle']['category'] ?? ''],
                'driver' => $this->driver($row->trip_driver_id ?? ($trip['driverId'] ?? null)),
            ],
        ];
    }

    /** Map many booking rows at once (one ledger query, one audit query). */
    public function bookings(Collection $rows): Collection
    {
        $paid = $this->paidMap($rows->pluck('id'));
        $creators = $this->creatorMap($rows->pluck('id'));

        return $rows->map(fn ($row) => $this->booking($row, $paid[$row->id] ?? 0, $creators[$row->id] ?? null));
    }

    /** Laravel-paginator-shaped page from a collection. */
    public function page(Collection $items, Request $r, int $default = 20): array
    {
        $per = max(1, min(200, (int) $r->input('per_page', $default)));
        $page = max(1, (int) $r->input('page', 1));
        $total = $items->count();

        return [
            'current_page' => $page, 'per_page' => $per, 'total' => $total,
            'last_page' => max(1, (int) ceil($total / $per)),
            'data' => $items->slice(($page - 1) * $per, $per)->values(),
        ];
    }
}
