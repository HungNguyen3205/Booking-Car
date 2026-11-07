<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Carbon\CarbonImmutable as C;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Studio "Tổng quan" from live bookings, trips, vehicles and the ledger. */
class DashboardController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    public function getStatistics(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $tz = StudioBridge::TZ;
        $now = C::now($tz);
        $today = $now->toDateString();
        $range = $r->query('range', 'day');

        $rows = $this->bridge->bookingRows($scope);
        $bookings = $this->bridge->bookings($rows);
        $live = $bookings->where('booking_status', '!=', 'cancelled');
        $localDay = fn (?string $s) => $s ? substr($s, 0, 10) : null;

        // Money actually collected, bucketed by the day it was collected.
        $ledger = $this->bridge->scoped(DB::table('ledger'), $scope)->whereIn('kind', ['collection', 'refund'])->get(['kind', 'amount', 'created_at'])
            ->map(fn ($l) => ['day' => $localDay($this->bridge->local($l->created_at)), 'amount' => $l->kind === 'refund' ? -(int) $l->amount : (int) $l->amount]);
        $revenueBetween = fn (string $a, string $z) => (int) $ledger->filter(fn ($l) => $l['day'] >= $a && $l['day'] <= $z)->sum('amount');

        $tripsToday = $this->bridge->scoped(DB::table('trips'), $scope)->whereBetween('depart_at', $this->bridge->utcBounds($today, $today))
            ->whereNotIn('status', ['cancelled', 'draft'])->get(['id', 'data']);
        $capacityToday = $tripsToday->sum(fn ($t) => (int) ($this->ops->data($t)['vehicle']['capacity'] ?? 0));
        $seatsToday = $tripsToday->isEmpty() ? 0 : (int) DB::table('inventory')->whereIn('trip_id', $tripsToday->pluck('id'))->whereNotNull('booking_id')->count();
        $soldToday = $live->filter(fn ($b) => $localDay($b['created_at']) === $today);

        $vehicles = $this->bridge->scoped(DB::table('records')->where('kind', 'vehicles'), $scope)->get()->map(fn ($v) => $this->ops->data($v));

        $months = collect(range(5, 0))->map(function ($i) use ($now, $revenueBetween) {
            $m = $now->subMonthsNoOverflow($i);

            return ['label' => $m->format('m/Y'), 'date' => $m->startOfMonth()->toDateString(), 'value' => $revenueBetween($m->startOfMonth()->toDateString(), $m->endOfMonth()->toDateString())];
        })->values();
        $chart = match ($range) {
            'week' => collect(range(7, 0))->map(function ($i) use ($now, $revenueBetween) {
                $w = $now->subWeeks($i)->startOfWeek();

                return ['label' => 'Tuần '.$w->format('W/y'), 'date' => $w->toDateString(), 'value' => $revenueBetween($w->toDateString(), $w->endOfWeek()->toDateString())];
            })->values(),
            'month' => $months->map(fn ($m) => ['label' => 'Tháng '.$m['label']] + $m)->values(),
            default => collect(range(6, 0))->map(function ($i) use ($now, $revenueBetween) {
                $d = $now->subDays($i)->toDateString();

                return ['label' => substr($d, 8, 2).'/'.substr($d, 5, 2), 'date' => $d, 'value' => $revenueBetween($d, $d)];
            })->values(),
        };

        $customers = $live->pluck('customer_phone')->filter()->unique();
        $weekAgo = $now->subWeek()->format('Y-m-d H:i:s');
        $firstSeen = $bookings->groupBy('customer_phone')->map(fn ($g) => $g->min('created_at'));

        $operators = $live->groupBy('partner_id')->map(fn ($g, $id) => [
            'id' => $id, 'name' => $g->first()['partner']['name'], 'slug' => $g->first()['partner']['slug'],
            'trips_count' => $g->pluck('trip_id')->unique()->count(), 'tickets_sold' => $g->sum('seat_count'),
            'revenue' => $g->sum('paid_amount'), 'commission_rate' => round(((int) ($this->bridge->tenant($id)['commissionBps'] ?? 0)) / 100, 2),
        ])->sortByDesc('revenue')->values();

        return response()->json(['status' => 1, 'data' => [
            'total_revenue' => (int) $ledger->sum('amount'),
            'today_revenue' => $revenueBetween($today, $today),
            'total_tickets_sold' => (int) $live->sum('seat_count'),
            'today_tickets_sold' => (int) $soldToday->sum('seat_count'),
            'today_trips_count' => $tripsToday->count(),
            'occupancy_rate' => $capacityToday > 0 ? round($seatsToday / $capacityToday * 100, 1) : 0,
            'total_bookings_count' => $bookings->count(),
            'pending_bookings_count' => $live->whereIn('payment_status', ['unpaid', 'partially_paid'])->count(),
            'confirmed_bookings_count' => $live->where('booking_status', 'confirmed')->count(),
            'completed_bookings_count' => $live->where('booking_status', 'checked_in')->count(),
            'cancelled_bookings_count' => $bookings->where('booking_status', 'cancelled')->count(),
            'vehicles_total' => $vehicles->count(),
            'vehicles_active' => $vehicles->where('maintenance', false)->count(),
            'vehicles_maintenance' => $vehicles->where('maintenance', true)->count(),
            'total_customers' => $customers->count(),
            'new_customers_week' => $firstSeen->filter(fn ($d) => $d >= $weekAgo)->count(),
            'revenue_chart' => $chart,
            'six_month_chart' => $months,
            // Overview lists stay light whatever the size: top 50 operators by revenue (+ total), 20 latest bookings.
            'operator_performance' => $operators->take(50)->values(),
            'operator_total' => $operators->count(),
            'recent_bookings' => $bookings->take(20)->values(),
        ]]);
    }
}
