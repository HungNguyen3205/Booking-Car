<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Carbon\CarbonImmutable as C;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Soát vé lên xe on live bookings, with the live rules: the ticket must be fully
 * paid, drivers only board their assigned trips, a second scan is refused.
 */
class CheckinController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function present(array $b): array
    {
        $warnings = [];
        if ($b['booking_status'] === 'cancelled') {
            $warnings[] = 'Vé đã huỷ — không cho lên xe';
        } elseif ($b['due_amount'] > 0) {
            $warnings[] = 'Vé còn nợ '.number_format($b['due_amount'], 0, ',', '.').'đ — thu đủ trước khi cho lên xe';
        }
        $depart = $b['trip']['depart_time'];
        if ($depart && substr($depart, 0, 10) !== C::now(StudioBridge::TZ)->toDateString()) {
            $warnings[] = 'Vé không thuộc chuyến hôm nay ('.C::parse($depart)->format('d/m H:i').')';
        }
        $trip = $b['trip'];

        return [
            'id' => $b['id'], 'booking_code' => $b['booking_code'], 'customer_name' => $b['customer_name'], 'customer_phone' => $b['customer_phone'],
            'seats' => $b['seats'], 'seat_count' => $b['seat_count'], 'final_amount' => $b['final_amount'], 'due_amount' => $b['due_amount'],
            'payment_status' => $b['payment_status'], 'booking_status' => $b['booking_status'],
            'checked_in_at' => $b['checked_in_at'], 'checked_in_by' => null, 'trip_id' => $b['trip_id'],
            'depart_time' => $depart, 'route_name' => $trip['route']['name'], 'plate_number' => $trip['vehicle']['plate_number'],
            'vehicle_name' => $trip['vehicle']['name'], 'partner_name' => $b['partner']['name'],
            'pickup' => $b['pickup_stop']['name'] ?? null,
            'warnings' => $warnings,
            'can_board' => $b['booking_status'] === 'confirmed' && $b['due_amount'] <= 0,
        ];
    }

    private function scoped(Request $r)
    {
        $u = $this->bridge->user($r);
        $rows = $this->bridge->bookingRows($this->bridge->scope($r, ''));
        if ($column = StudioBridge::crewColumn($u)) {
            $rows = $rows->where('trip_'.$column, $u->driver_id ?: 'unassigned');
        }

        return $rows->values();
    }

    public function lookup(Request $r)
    {
        $b = $r->validate(['q' => 'required|string|min:3|max:40', 'trip_id' => 'nullable|string']);
        $q = strtoupper(trim($b['q']));
        $digits = preg_replace('/\D+/', '', $q);
        $rows = $this->scoped($r)->filter(function ($row) use ($q, $digits) {
            if (strtoupper($row->id) === $q) {
                return true;
            }
            if (strlen($digits) >= 9) {
                $phone = preg_replace('/\D+/', '', $this->ops->data($row)['passenger']['phone'] ?? '');

                return str_ends_with($phone, substr($digits, -9));
            }

            return false;
        });
        if (! empty($b['trip_id'])) {
            $rows = $rows->where('trip_id', $b['trip_id']);
            if ($rows->isEmpty()) {
                $this->refuseOtherTrip($r, $q, $b['trip_id']);
            }
        }
        $items = $this->bridge->bookings($rows->sortByDesc('trip_depart_at')->take(10)->values())->map(fn ($x) => $this->present($x))->values();

        return response()->json(['status' => 1, 'data' => $items]);
    }

    /**
     * Scanning is bound to the bus being boarded: a ticket of the same operator
     * on another trip gets a clear refusal (which bus/time it belongs to) instead
     * of "not found", so the crew can redirect the passenger.
     */
    private function refuseOtherTrip(Request $r, string $code, string $tripId): void
    {
        $row = DB::table('bookings')->where('id', $code)->first();
        if (! $row || $row->trip_id === $tripId || ! $this->bridge->inScope($this->bridge->scope($r, ''), $row->tenant_id)) {
            return;
        }
        $trip = DB::table('trips')->where('id', $row->trip_id)->first();
        if (! $trip) {
            return;
        }
        $view = $this->bridge->trip($trip);
        abort(409, 'Vé '.$row->id.' thuộc chuyến khác: '.$view['route']['name'].' lúc '.substr((string) $view['depart_time'], 11, 5).' '.substr((string) $view['depart_time'], 8, 2).'/'.substr((string) $view['depart_time'], 5, 2)
            .($view['vehicle']['plate_number'] ? ', xe '.$view['vehicle']['plate_number'] : '').'. Không cho lên xe này.');
    }

    private function one(Request $r, string $id): array
    {
        $row = $this->scoped($r)->firstWhere('id', $id);
        abort_unless($row, 404, 'Không tìm thấy vé');

        return [$row, $this->bridge->bookings(collect([$row]))->first()];
    }

    public function board(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        [$row, $b] = $this->one($r, $id);
        $tripId = (string) $r->input('trip_id', '');
        if ($tripId !== '' && $row->trip_id !== $tripId) {
            $this->refuseOtherTrip($r, $row->id, $tripId);
            abort(409, 'Vé không thuộc chuyến/xe đang soát');
        }
        if ($row->status === 'checked_in') {
            return response()->json(['status' => 1, 'message' => 'Vé đã được soát lúc '.substr((string) $b['checked_in_at'], 11, 5).' '.substr((string) $b['checked_in_at'], 8, 2).'/'.substr((string) $b['checked_in_at'], 5, 2), 'data' => $this->present($b)]);
        }
        abort_if($row->status === 'cancelled', 422, 'Vé đã huỷ, không thể cho lên xe');
        abort_if($b['due_amount'] > 0, 409, 'Vé chưa thu đủ tiền. Thu tiền ở mục Đơn vé trước khi cho lên xe.');
        $this->ops->changeBooking($row->tenant_id, $id, ['action' => 'checkin'], $u);
        [, $fresh] = $this->one($r, $id);

        return response()->json(['status' => 1, 'message' => 'Đã cho '.$fresh['customer_name'].' lên xe', 'data' => $this->present($fresh)]);
    }

    /** Undo a mistaken scan (same day, before the trip ends). */
    public function undo(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        [$row] = $this->one($r, $id);
        abort_unless($row->status === 'checked_in', 422, 'Vé chưa được soát');
        abort_if($row->trip_end_at <= $this->ops->now(), 409, 'Chuyến đã kết thúc, không huỷ soát được');
        DB::transaction(function () use ($id, $u, $row) {
            $fresh = DB::table('bookings')->where('id', $id)->lockForUpdate()->first();
            $d = $this->ops->data($fresh);
            $d['checkedInAt'] = null;
            DB::table('bookings')->where('id', $id)->update(['status' => 'confirmed', 'data' => $this->ops->json($d)]);
            $this->ops->audit($u, $row->tenant_id, 'bookings.checkin_undo', $id);
        });

        return response()->json(['status' => 1, 'message' => 'Đã huỷ soát vé']);
    }

    public function trips(Request $r)
    {
        $u = $this->bridge->user($r);
        $day = $r->query('date') ?: C::now(StudioBridge::TZ)->toDateString();
        abort_unless(preg_match('/^\d{4}-\d{2}-\d{2}$/', $day), 422, 'Ngày không hợp lệ');
        $q = $this->bridge->scoped(DB::table('trips'), $this->bridge->scope($r))->whereBetween('depart_at', $this->bridge->utcBounds($day, $day))
            ->whereNotIn('status', ['draft', 'cancelled'])->orderBy('depart_at');
        StudioBridge::crewFilter($q, $u);
        $trips = $q->get();
        $bookings = $trips->isEmpty() ? collect() : DB::table('bookings')->whereIn('trip_id', $trips->pluck('id'))->where('status', '!=', 'cancelled')->get(['trip_id', 'status', 'data']);
        $items = $trips->map(function ($t) use ($bookings) {
            $mine = $bookings->where('trip_id', $t->id);
            $seats = fn ($list) => $list->sum(fn ($b) => count($this->ops->data($b)['selectedSeats'] ?? []));
            $view = $this->bridge->trip($t);

            return [
                'id' => $t->id, 'depart_time' => $view['depart_time'], 'status' => $view['status'], 'route_name' => $view['route']['name'],
                'plate_number' => $view['vehicle']['plate_number'], 'capacity' => $view['vehicle']['capacity'], 'partner_name' => $view['partner']['name'],
                'seats_booked' => $seats($mine), 'seats_boarded' => $seats($mine->where('status', 'checked_in')),
            ];
        })->values();

        return response()->json(['status' => 1, 'data' => ['date' => $day, 'trips' => $items]]);
    }

    public function manifest(Request $r, string $tripId)
    {
        $rows = $this->scoped($r)->where('trip_id', $tripId)->where('status', '!=', 'cancelled')->values();

        return response()->json(['status' => 1, 'data' => $this->bridge->bookings($rows)->sortBy('customer_name')->map(fn ($x) => $this->present($x))->values()]);
    }
}
