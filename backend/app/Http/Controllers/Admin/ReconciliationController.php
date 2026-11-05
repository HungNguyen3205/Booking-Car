<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BookingTransaction;
use App\Models\Partner;
use App\Models\Reconciliation;
use App\Models\TicketBooking;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReconciliationController extends Controller
{
    public function index(Request $request)
    {
        $query = Reconciliation::with('partner:id,name,slug,bank_name,bank_account,bank_holder');

        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $reconciliations = $query->orderBy('period_end', 'desc')->paginate($request->input('per_page', 20));

        // Summary metrics
        $totalRevenue = Reconciliation::sum('total_revenue');
        $totalCommission = Reconciliation::sum('commission_amount');
        $totalPayout = Reconciliation::sum('payout_amount');
        $pendingPayout = Reconciliation::whereIn('status', ['draft', 'pending_approval', 'confirmed'])->sum('payout_amount');

        return response()->json([
            'status' => 1,
            'summary' => [
                'total_revenue' => (int) $totalRevenue,
                'total_commission' => (int) $totalCommission,
                'total_payout' => (int) $totalPayout,
                'pending_payout' => (int) $pendingPayout,
            ],
            'data' => $reconciliations,
        ]);
    }

    public function show($id)
    {
        $rec = Reconciliation::with([
            'partner.bank_name',
        ])->findOrFail($id);

        $bookings = TicketBooking::where('partner_id', $rec->partner_id)
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$rec->period_start . ' 00:00:00', $rec->period_end . ' 23:59:59'])
            ->with(['trip.route'])
            ->get();

        return response()->json([
            'status' => 1,
            'data' => [
                'reconciliation' => $rec,
                'bookings' => $bookings,
            ],
        ]);
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'notes' => 'nullable|string',
        ]);

        $partner = Partner::findOrFail($validated['partner_id']);
        $start = $validated['period_start'] . ' 00:00:00';
        $end = $validated['period_end'] . ' 23:59:59';

        $bookings = TicketBooking::where('partner_id', $partner->id)
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->get();

        $totalTickets = $bookings->sum('seat_count') ?: 0;
        $totalRevenue = $bookings->sum('final_amount') ?: 0;
        $commissionRate = (float) $partner->commission_rate;
        $commissionAmount = (int) round($totalRevenue * ($commissionRate / 100));
        $payoutAmount = max(0, $totalRevenue - $commissionAmount);

        $code = 'DS-' . date('Ym', strtotime($validated['period_start'])) . '-' . strtoupper(Str::random(4));

        $rec = Reconciliation::create([
            'code' => $code,
            'partner_id' => $partner->id,
            'period_start' => $validated['period_start'],
            'period_end' => $validated['period_end'],
            'total_tickets' => (int) $totalTickets,
            'total_revenue' => (int) $totalRevenue,
            'commission_rate' => $commissionRate,
            'commission_amount' => $commissionAmount,
            'payout_amount' => $payoutAmount,
            'status' => 'draft',
            'notes' => $validated['notes'] ?? ('Kỳ đối soát ' . $validated['period_start'] . ' đến ' . $validated['period_end']),
        ]);

        AuditLog::create([
            'action' => 'reconciliation.generated',
            'target_type' => 'Reconciliation',
            'target_id' => $rec->id,
            'target_label' => $rec->code . ' - ' . $partner->name,
            'new_values' => $rec->toArray(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Lập kỳ đối soát thành công!',
            'data' => $rec->load('partner'),
        ]);
    }

    public function settle(Request $request, $id)
    {
        $rec = Reconciliation::findOrFail($id);

        $validated = $request->validate([
            'payment_ref' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $rec->update([
            'status' => 'paid',
            'settled_at' => Carbon::now(),
            'payment_ref' => $validated['payment_ref'],
            'notes' => $validated['notes'] ?? $rec->notes,
        ]);

        // Record payout transaction
        BookingTransaction::create([
            'partner_id' => $rec->partner_id,
            'type' => 'payout',
            'amount' => $rec->payout_amount,
            'status' => 'completed',
            'method' => 'bank_transfer',
            'reference_code' => $validated['payment_ref'],
            'transaction_time' => Carbon::now(),
            'note' => 'Chi trả quyết toán đối tác kỳ ' . $rec->code,
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Đã chốt thanh toán và quyết toán chi trả cho nhà xe!',
            'data' => $rec->load('partner'),
        ]);
    }
}

