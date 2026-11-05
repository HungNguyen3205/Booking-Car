<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusTrip;
use App\Models\Partner;
use App\Models\Route;
use App\Models\TicketBooking;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function getSummary(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $partnerId = $request->input('partner_id');

        $bookingsQuery = TicketBooking::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('payment_status', 'paid');

        if ($partnerId) {
            $bookingsQuery->where('partner_id', $partnerId);
        }

        $grossRevenue = (clone $bookingsQuery)->sum('final_amount') ?: 0;
        $totalTickets = (clone $bookingsQuery)->sum('seat_count') ?: 0;
        $totalBookings = (clone $bookingsQuery)->count();

        // Platform profit estimation (based on average 10% commission)
        $estimatedProfit = (int) round($grossRevenue * 0.10);

        // Revenue by Route
        $routesReport = DB::table('ticket_bookings')
            ->join('bus_trips', 'ticket_bookings.trip_id', '=', 'bus_trips.id')
            ->join('routes', 'bus_trips.route_id', '=', 'routes.id')
            ->whereBetween('ticket_bookings.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('ticket_bookings.payment_status', 'paid')
            ->when($partnerId, fn($q) => $q->where('ticket_bookings.partner_id', $partnerId))
            ->select(
                'routes.id',
                'routes.name',
                'routes.from_city',
                'routes.to_city',
                DB::raw('COUNT(ticket_bookings.id) as bookings_count'),
                DB::raw('SUM(ticket_bookings.seat_count) as tickets_sold'),
                DB::raw('SUM(ticket_bookings.final_amount) as total_revenue')
            )
            ->groupBy('routes.id', 'routes.name', 'routes.from_city', 'routes.to_city')
            ->orderBy('total_revenue', 'desc')
            ->get();

        // Revenue by Partner
        $partnersReport = DB::table('ticket_bookings')
            ->join('partners', 'ticket_bookings.partner_id', '=', 'partners.id')
            ->whereBetween('ticket_bookings.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('ticket_bookings.payment_status', 'paid')
            ->select(
                'partners.id',
                'partners.name',
                'partners.commission_rate',
                DB::raw('COUNT(ticket_bookings.id) as bookings_count'),
                DB::raw('SUM(ticket_bookings.seat_count) as tickets_sold'),
                DB::raw('SUM(ticket_bookings.final_amount) as total_revenue')
            )
            ->groupBy('partners.id', 'partners.name', 'partners.commission_rate')
            ->orderBy('total_revenue', 'desc')
            ->get();

        return response()->json([
            'status' => 1,
            'data' => [
                'period' => ['start' => $startDate, 'end' => $endDate],
                'gross_revenue' => (int) $grossRevenue,
                'total_tickets' => (int) $totalTickets,
                'total_bookings' => (int) $totalBookings,
                'estimated_profit' => (int) $estimatedProfit,
                'routes_report' => $routesReport,
                'partners_report' => $partnersReport,
            ],
        ]);
    }

    public function exportCsv(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $bookings = TicketBooking::with(['partner:id,name', 'trip.route'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->orderBy('created_at', 'desc')
            ->get();

        $csvHeader = "\xEF\xBB\xBFMã vé,Hành khách,Số điện thoại,Nhà xe,Tuyến đường,Số ghế,Số lượng,Tổng tiền,Trạng thái,Phương thức,Ngày đặt\n";
        $csvContent = '';

        foreach ($bookings as $b) {
            $seatsStr = is_array($b->seats) ? implode(';', $b->seats) : '';
            $routeName = $b->trip && $b->trip->route ? $b->trip->route->name : '';
            $partnerName = $b->partner ? $b->partner->name : '';

            $csvContent .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%d,%d,\"%s\",\"%s\",\"%s\"\n",
                $b->booking_code,
                $b->customer_name,
                $b->customer_phone,
                $partnerName,
                $routeName,
                $seatsStr,
                $b->seat_count,
                $b->final_amount,
                $b->payment_status,
                $b->payment_method,
                $b->created_at->format('Y-m-d H:i')
            );
        }

        return response($csvHeader . $csvContent, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="bao-cao-ve-danavago-' . date('Ymd') . '.csv"',
        ]);
    }
}

