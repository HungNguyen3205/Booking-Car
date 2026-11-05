<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BookingTransaction;
use App\Models\Partner;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = BookingTransaction::query();

        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('method')) {
            $query->where('method', $request->method);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('transaction_time', $request->date);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('reference_code', 'like', "%{$s}%")
                    ->orWhere('booking_id', 'like', "%{$s}%")
                    ->orWhere('note', 'like', "%{$s}%");
            });
        }

        $transactions = $query->orderBy('transaction_time', 'desc')->paginate($request->input('per_page', 20));

        // Summary metrics
        $totalIn = BookingTransaction::where('type', 'payment')->where('status', 'completed')->sum('amount');
        $totalOut = BookingTransaction::whereIn('type', ['refund', 'payout'])->where('status', 'completed')->sum('amount');
        $pendingCount = BookingTransaction::where('status', 'pending')->count();

        return response()->json([
            'status' => 1,
            'summary' => [
                'total_inflow' => (int) $totalIn,
                'total_outflow' => (int) $totalOut,
                'net_balance' => (int) ($totalIn - $totalOut),
                'pending_count' => $pendingCount,
            ],
            'data' => $transactions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'partner_id' => 'nullable|exists:partners,id',
            'booking_id' => 'nullable|string',
            'type' => 'required|string|in:payment,refund,payout,topup',
            'amount' => 'required|numeric|min:1',
            'method' => 'required|string|in:vnpay,momo,bank_transfer,cash',
            'reference_code' => 'nullable|string',
            'status' => 'nullable|string|in:completed,pending,failed',
            'note' => 'nullable|string',
            'proof_image' => 'nullable|string',
            'actor_name' => 'nullable|string',
        ]);

        $txn = BookingTransaction::create([
            'partner_id' => $validated['partner_id'] ?? null,
            'booking_id' => $validated['booking_id'] ?? null,
            'type' => $validated['type'],
            'amount' => (int) $validated['amount'],
            'method' => $validated['method'],
            'reference_code' => $validated['reference_code'] ?? ('TXN-' . strtoupper(Str::random(8))),
            'status' => $validated['status'] ?? 'completed',
            'transaction_time' => Carbon::now(),
            'note' => $validated['note'] ?? null,
            'proof_image' => $validated['proof_image'] ?? null,
            'actor_name' => $validated['actor_name'] ?? 'Admin',
        ]);

        AuditLog::create([
            'action' => 'payment.created',
            'target_type' => 'BookingTransaction',
            'target_id' => $txn->id,
            'target_label' => $txn->reference_code . ' (' . number_format($txn->amount) . 'đ)',
            'new_values' => $txn->toArray(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Ghi nhận giao dịch thành công!',
            'data' => $txn,
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $txn = BookingTransaction::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string|in:completed,pending,failed',
            'note' => 'nullable|string',
        ]);

        $txn->update($validated);

        return response()->json([
            'status' => 1,
            'message' => 'Cập nhật trạng thái giao dịch thành công!',
            'data' => $txn,
        ]);
    }
}

