<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BookingTransaction;
use App\Models\Partner;
use App\Models\Reconciliation;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReconciliationController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    /** Paid live bookings of one operator created in [start, end] (Vietnam days). */
    private function paidBookings(string $tid, string $start, string $end)
    {
        [$a, $z] = $this->bridge->utcBounds($start, $end);
        $rows = $this->bridge->bookingRows([$tid])->filter(fn ($b) => $b->created_at >= $a && $b->created_at <= $z && $b->status !== 'cancelled')->values();

        return $this->bridge->bookings($rows)->filter(fn ($b) => $b['paid_amount'] > 0)->values();
    }

    public function index(Request $request)
    {
        $query = Reconciliation::with('partner:id,name,slug,bank_name,bank_account,bank_holder');

        $scope = $this->bridge->scope($request);
        if ($scope !== null) {
            $query->whereIn('partner_id', $scope);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $reconciliations = $query->orderBy('period_end', 'desc')->paginate($request->input('per_page', 20));

        // Summary metrics
        $base = Reconciliation::when($scope !== null, fn ($q) => $q->whereIn('partner_id', $scope));
        $totalRevenue = (clone $base)->sum('total_revenue');
        $totalCommission = (clone $base)->sum('commission_amount');
        $totalPayout = (clone $base)->sum('payout_amount');
        $pendingPayout = (clone $base)->whereIn('status', ['draft', 'pending_approval', 'confirmed'])->sum('payout_amount');

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

    public function show(Request $request, $id)
    {
        $rec = Reconciliation::with('partner')->findOrFail($id);
        abort_unless($this->bridge->inScope($this->bridge->scope($request, ''), $rec->partner_id), 403, 'Không có quyền xem kỳ đối soát này');
        $bookings = $this->paidBookings($rec->partner_id, (string) $rec->period_start, (string) $rec->period_end);

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
            'partner_id' => 'required|exists:tenants,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'notes' => 'nullable|string',
        ]);

        $this->bridge->allow($request, 'platform');
        $this->bridge->ensurePartnerRow($validated['partner_id']);
        $partner = Partner::findOrFail($validated['partner_id']);
        $start = $validated['period_start'] . ' 00:00:00';
        $end = $validated['period_end'] . ' 23:59:59';

        $bookings = $this->paidBookings($partner->id, $validated['period_start'], $validated['period_end']);

        $totalTickets = $bookings->sum('seat_count') ?: 0;
        $totalRevenue = $bookings->sum('paid_amount') ?: 0;
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
        $this->bridge->allow($request, 'platform');
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

