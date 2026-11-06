<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Carbon\CarbonImmutable as C;
use Illuminate\Http\Request;

/**
 * Studio "Báo cáo" from live bookings created in the period (Vietnam days).
 * Revenue = money actually collected (ledger), platform profit = each ticket's
 * recorded platform commission rate applied to what was collected.
 */
class ReportController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function period(Request $r): array
    {
        $now = C::now(StudioBridge::TZ);
        $start = $r->input('start_date') ?: $now->startOfMonth()->toDateString();
        $end = $r->input('end_date') ?: $now->endOfMonth()->toDateString();
        abort_unless(preg_match('/^\d{4}-\d{2}-\d{2}$/', $start) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $end) && $start <= $end, 422, 'Khoảng ngày không hợp lệ');

        return [$start, $end];
    }

    private function rows(Request $r, string $start, string $end)
    {
        [$a, $z] = $this->bridge->utcBounds($start, $end);
        $rows = $this->bridge->bookingRows($this->bridge->scope($r))->filter(fn ($b) => $b->created_at >= $a && $b->created_at <= $z)->values();

        return $this->bridge->bookings($rows)->map(function ($b) use ($rows) {
            $raw = $rows->firstWhere('id', $b['id']);
            $b['platform_bps'] = (int) ($this->ops->data($raw)['platformCommissionBps'] ?? 0);
            $b['route_id'] = $raw->trip_route_id;

            return $b;
        });
    }

    public function getSummary(Request $r)
    {
        [$start, $end] = $this->period($r);
        $items = $this->rows($r, $start, $end);
        $live = $items->where('booking_status', '!=', 'cancelled');
        $profit = (int) round($items->sum(fn ($b) => $b['paid_amount'] * $b['platform_bps'] / 10000));

        $routes = $live->groupBy('route_id')->map(fn ($g, $id) => [
            'id' => $id, 'name' => $g->first()['trip']['route']['name'],
            'from_city' => $g->first()['trip']['route']['from_city'], 'to_city' => $g->first()['trip']['route']['to_city'],
            'bookings_count' => $g->count(), 'tickets_sold' => $g->sum('seat_count'), 'total_revenue' => $g->sum('paid_amount'),
        ])->sortByDesc('total_revenue')->values();
        $partners = $live->groupBy('partner_id')->map(fn ($g, $id) => [
            'id' => $id, 'name' => $g->first()['partner']['name'],
            'commission_rate' => round(($g->first()['platform_bps'] ?? 0) / 100, 2),
            'tickets_sold' => $g->sum('seat_count'), 'total_revenue' => $g->sum('paid_amount'),
            'commission_amount' => (int) round($g->sum(fn ($b) => $b['paid_amount'] * $b['platform_bps'] / 10000)),
        ])->sortByDesc('total_revenue')->values();

        return response()->json(['status' => 1, 'data' => [
            'period' => ['start' => $start, 'end' => $end],
            'gross_revenue' => (int) $items->sum('paid_amount'),
            'total_tickets' => (int) $live->sum('seat_count'),
            'total_bookings' => $live->count(),
            'cancelled_bookings' => $items->count() - $live->count(),
            'unpaid_amount' => (int) $live->sum('due_amount'),
            'estimated_profit' => $profit,
            'routes_report' => $routes,
            'partners_report' => $partners,
        ]]);
    }

    public function exportCsv(Request $r)
    {
        [$start, $end] = $this->period($r);
        $status = ['confirmed' => 'Đã xác nhận', 'checked_in' => 'Đã lên xe', 'cancelled' => 'Đã hủy'];
        $pay = ['paid' => 'Đã thu', 'unpaid' => 'Chưa thu', 'partially_paid' => 'Thu một phần', 'refund_due' => 'Chờ hoàn', 'refunded' => 'Đã hoàn'];
        $rows = [['Mã vé', 'Ngày đặt', 'Nhà xe', 'Tuyến', 'Giờ chạy', 'Khách', 'SĐT', 'Ghế', 'Thành tiền', 'Đã thu', 'Còn nợ', 'Thanh toán', 'Trạng thái', 'Kênh']];
        foreach ($this->rows($r, $start, $end) as $b) {
            $rows[] = [$b['booking_code'], $b['created_at'], $b['partner']['name'], $b['trip']['route']['name'], $b['trip']['depart_time'],
                $b['customer_name'], $b['customer_phone'], implode(' ', $b['seats']), $b['final_amount'], $b['paid_amount'], $b['due_amount'],
                $pay[$b['payment_status']] ?? $b['payment_status'], $status[$b['booking_status']] ?? $b['booking_status'], $b['source'] === 'online' ? 'Online' : 'Tại quầy'];
        }

        return $this->csv("bao-cao-ve-danavago-{$start}-{$end}.csv", $rows);
    }
}
