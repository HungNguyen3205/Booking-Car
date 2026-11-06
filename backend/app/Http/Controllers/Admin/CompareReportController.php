<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** So sánh hiệu quả giữa các nhà xe (hoặc tuyến) theo chuyến khởi hành trong kỳ. */
class CompareReportController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    public function index(Request $r)
    {
        $tz = StudioBridge::TZ;
        $b = $r->validate(['from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d|after_or_equal:from', 'group' => 'nullable|in:partner,route']);
        $from = $b['from'] ?? Carbon::now($tz)->startOfMonth()->toDateString();
        $to = $b['to'] ?? Carbon::now($tz)->toDateString();
        $group = $b['group'] ?? 'partner';
        $scope = $this->bridge->scope($r);

        $trips = $this->bridge->scoped(DB::table('trips'), $scope)->whereBetween('depart_at', $this->bridge->utcBounds($from, $to))
            ->whereNotIn('status', ['cancelled', 'draft'])->get();
        $keyOf = fn ($t) => $group === 'route' ? $t->route_id : $t->tenant_id;
        $bookings = $trips->isEmpty() ? collect() : $this->bridge->bookings(DB::table('bookings')->whereIn('trip_id', $trips->pluck('id'))->get()
            ->map(function ($b) use ($trips) {
                $t = $trips->firstWhere('id', $b->trip_id);
                $b->trip_depart_at = $t->depart_at;
                $b->trip_end_at = $t->end_at;
                $b->trip_status = $t->status;
                $b->trip_route_id = $t->route_id;
                $b->trip_driver_id = $t->driver_id;

                return $b;
            }));
        $tripKey = $trips->mapWithKeys(fn ($t) => [$t->id => $keyOf($t)]);
        $reviews = DB::table('trip_reviews')->whereIn('trip_id', $trips->pluck('id'))->where('status', 'visible')->get();

        $rows = $trips->groupBy($keyOf)->map(function ($list, $k) use ($bookings, $tripKey, $reviews, $group) {
            $mine = $bookings->filter(fn ($b) => ($tripKey[$b['trip_id']] ?? null) === $k);
            $live = $mine->where('booking_status', '!=', 'cancelled');
            $capacity = $list->sum(fn ($t) => (int) ($this->ops->data($t)['vehicle']['capacity'] ?? 0));
            $seats = (int) $live->sum('seat_count');
            $revenue = (int) $live->sum('paid_amount');
            $rv = $reviews->filter(fn ($v) => ($tripKey[$v->trip_id] ?? null) === $k);
            $first = $this->ops->data($list->first());

            return [
                'id' => $k, 'name' => $group === 'route' ? $first['route']['from'].' → '.$first['route']['to'].' ('.$this->bridge->tenant($list->first()->tenant_id)['name'].')' : $this->bridge->tenant($k)['name'],
                'trips' => $list->count(), 'capacity' => $capacity, 'seats_sold' => $seats,
                'occupancy' => $capacity ? round($seats / $capacity * 100, 1) : null,
                'revenue' => $revenue, 'revenue_per_trip' => $list->count() ? (int) round($revenue / $list->count()) : 0,
                'bookings' => $mine->count(), 'cancel_rate' => $mine->count() ? round(($mine->count() - $live->count()) / $mine->count() * 100, 1) : null,
                'boarding_rate' => $seats ? round($live->where('booking_status', 'checked_in')->sum('seat_count') / $seats * 100, 1) : null,
                'rating' => $rv->count() ? round($rv->avg('rating'), 2) : null, 'reviews' => $rv->count(),
            ];
        })->sortByDesc('revenue')->values();

        return response()->json(['status' => 1, 'data' => [
            'from' => $from, 'to' => $to, 'group' => $group, 'rows' => $rows,
            'totals' => [
                'trips' => $rows->sum('trips'), 'seats_sold' => $rows->sum('seats_sold'), 'capacity' => $rows->sum('capacity'), 'revenue' => $rows->sum('revenue'),
                'occupancy' => $rows->sum('capacity') ? round($rows->sum('seats_sold') / $rows->sum('capacity') * 100, 1) : null,
            ],
        ]]);
    }
}
