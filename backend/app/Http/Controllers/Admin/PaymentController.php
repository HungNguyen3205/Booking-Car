<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BookingTransaction;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Studio "Thanh toán": the live ledger (collections, refunds, expenses of each
 * operator) plus platform payouts recorded when a reconciliation is settled.
 * Ledger lines are immutable; corrections are made with a refund entry.
 */
class PaymentController extends Controller
{
    private const METHOD_OUT = ['cash' => 'cash', 'transfer' => 'bank_transfer'];

    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    public function index(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $users = DB::table('users')->pluck('name', 'id');
        $ledger = $this->bridge->scoped(DB::table('ledger'), $scope)->orderByDesc('created_at')->limit(2000)->get()->map(fn ($l) => [
            'id' => $l->id, 'booking_id' => $l->booking_id, 'partner_id' => $l->tenant_id,
            'partner_name' => $this->bridge->tenant($l->tenant_id)['name'],
            'type' => ['collection' => 'payment', 'refund' => 'refund', 'expense' => 'expense'][$l->kind] ?? $l->kind,
            'amount' => (int) $l->amount, 'status' => 'completed', 'method' => self::METHOD_OUT[$l->method] ?? $l->method,
            'reference_code' => $l->booking_id ?: strtoupper(substr($l->id, 0, 8)), 'transaction_time' => $this->bridge->local($l->created_at),
            'note' => $l->note, 'actor_name' => $users[$l->actor_id] ?? '',
        ]);
        $payouts = BookingTransaction::where('type', 'payout')
            ->when($scope !== null, fn ($q) => $q->whereIn('partner_id', $scope))->get()->map(fn ($t) => [
                'id' => 'payout-'.$t->id, 'booking_id' => null, 'partner_id' => $t->partner_id,
                'partner_name' => DB::table('tenants')->where('id', $t->partner_id)->value('name'),
                'type' => 'payout', 'amount' => (int) $t->amount, 'status' => $t->status, 'method' => $t->method,
                'reference_code' => $t->reference_code, 'transaction_time' => (string) $t->transaction_time, 'note' => $t->note, 'actor_name' => $t->actor_name ?? '',
            ]);
        $items = $ledger->concat($payouts)->sortByDesc('transaction_time')->values();
        foreach (['type', 'method', 'status'] as $f) {
            if ($r->filled($f)) {
                $items = $items->where($f, $r->query($f))->values();
            }
        }
        if ($r->filled('date')) {
            $items = $items->filter(fn ($t) => str_starts_with((string) $t['transaction_time'], $r->query('date')))->values();
        }
        if ($r->filled('search')) {
            $s = mb_strtolower(trim($r->query('search')));
            $items = $items->filter(fn ($t) => str_contains(mb_strtolower($t['reference_code'].' '.$t['booking_id'].' '.$t['note']), $s))->values();
        }
        $in = $ledger->where('type', 'payment')->sum('amount');
        $out = $ledger->whereIn('type', ['refund', 'expense'])->sum('amount') + $payouts->sum('amount');

        return response()->json(['status' => 1, 'summary' => [
            'total_inflow' => (int) $in, 'total_outflow' => (int) $out, 'net_balance' => (int) ($in - $out), 'pending_count' => 0,
        ], 'data' => $this->bridge->page($items, $r)]);
    }

    /** payment -> collection on a booking; refund -> refund on a cancelled booking; expense -> operator expense. */
    public function store(Request $r)
    {
        $u = $this->bridge->user($r);
        $b = $r->validate([
            'booking_id' => 'nullable|string', 'type' => 'required|string|in:payment,refund,expense',
            'amount' => 'required|integer|min:1|max:10000000000', 'method' => 'required|string',
            'reference_code' => 'nullable|string|max:100', 'note' => 'nullable|string|max:400',
        ]);
        if ($b['type'] !== 'expense') {
            abort_unless(! empty($b['booking_id']), 422, 'Cần mã vé cho khoản thu/hoàn');
            $booking = DB::table('bookings')->where('id', $b['booking_id'])->first();
            abort_unless($booking, 404, 'Không tìm thấy vé');
            $tid = $this->bridge->writeTenant($r, $booking->tenant_id);
        } else {
            $tid = $this->bridge->writeTenant($r);
        }
        $note = trim(($b['note'] ?? '').(! empty($b['reference_code']) ? ' · Mã GD '.$b['reference_code'] : '')) ?: 'Ghi nhận từ Studio';
        $line = $this->ops->ledger($tid, ['kind' => ['payment' => 'collection', 'refund' => 'refund', 'expense' => 'expense'][$b['type']],
            'bookingId' => $b['booking_id'] ?? null, 'amount' => $b['amount'], 'method' => $b['method'] === 'cash' ? 'cash' : 'transfer', 'note' => $note], $u, null);

        return response()->json(['status' => 1, 'message' => 'Đã ghi vào sổ thu chi', 'data' => $line]);
    }

    public function updateStatus(Request $r, string $id)
    {
        abort(422, 'Bút toán đã ghi không sửa được. Nếu ghi nhầm, hãy lập khoản hoàn tiền tương ứng.');
    }
}
