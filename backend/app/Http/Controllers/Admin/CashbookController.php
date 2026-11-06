<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Sổ quỹ (manual cash in/out per operator) and công nợ:
 * receivables = live tickets not fully paid; payables = unsettled operator reconciliations.
 */
class CashbookController extends Controller
{
    public const IN_CATEGORIES = ['ticket' => 'Thu tiền vé', 'cargo' => 'Thu hàng gửi', 'deposit' => 'Thu tạm ứng / cọc', 'other_in' => 'Thu khác'];

    public const OUT_CATEGORIES = ['fuel' => 'Nhiên liệu', 'toll' => 'Phí cầu đường / bến bãi', 'repair' => 'Sửa chữa & bảo dưỡng', 'salary' => 'Lương & thưởng', 'payout' => 'Chi trả nhà xe', 'refund' => 'Hoàn tiền khách', 'other_out' => 'Chi khác'];

    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function range(Request $r): array
    {
        $tz = StudioBridge::TZ;

        return [$r->query('from') ?: Carbon::now($tz)->startOfMonth()->toDateString(), $r->query('to') ?: Carbon::now($tz)->toDateString()];
    }

    public function index(Request $r)
    {
        [$from, $to] = $this->range($r);
        $base = $this->bridge->scoped(DB::table('cashbook_entries'), $this->bridge->scope($r), 'partner_id');
        $signed = 'SUM(CASE WHEN type = \'in\' THEN amount ELSE -amount END)';
        $opening = (int) (clone $base)->where('occurred_on', '<', $from)->selectRaw("COALESCE($signed, 0) as v")->value('v');
        $period = (clone $base)->whereBetween('occurred_on', [$from, $to]);
        $in = (int) (clone $period)->where('type', 'in')->sum('amount');
        $out = (int) (clone $period)->where('type', 'out')->sum('amount');
        $byCategory = (clone $period)->select('type', 'category', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))->groupBy('type', 'category')->orderByDesc('total')->get();
        $entries = (clone $period)->orderByDesc('occurred_on')->orderByDesc('created_at')->limit(500)->get()
            ->map(function ($e) {
                $e->partner_name = $e->partner_id ? (DB::table('tenants')->where('id', $e->partner_id)->value('name')) : null;

                return $e;
            });

        return response()->json(['status' => 1, 'data' => [
            'from' => $from, 'to' => $to,
            'opening_balance' => $opening, 'total_in' => $in, 'total_out' => $out, 'closing_balance' => $opening + $in - $out,
            'by_category' => $byCategory, 'entries' => $entries,
            'categories' => ['in' => self::IN_CATEGORIES, 'out' => self::OUT_CATEGORIES],
        ]]);
    }

    public function store(Request $r)
    {
        $u = $this->bridge->user($r);
        $b = $r->validate([
            'type' => 'required|in:in,out',
            'category' => 'required|string|in:'.implode(',', array_merge(array_keys(self::IN_CATEGORIES), array_keys(self::OUT_CATEGORIES))),
            'amount' => 'required|integer|min:1|max:10000000000',
            'method' => 'required|in:cash,transfer,card',
            'occurred_on' => 'required|date_format:Y-m-d',
            'partner_id' => 'nullable|string',
            'booking_id' => 'nullable|string',
            'note' => 'nullable|string|max:500',
        ]);
        $valid = $b['type'] === 'in' ? self::IN_CATEGORIES : self::OUT_CATEGORIES;
        abort_unless(isset($valid[$b['category']]), 422, 'Hạng mục không khớp loại phiếu thu/chi');
        // Platform may keep its own general cashbook (no operator); operators always write to their own.
        $tid = $this->bridge->isPlatform($u) && empty($b['partner_id']) ? null : $this->bridge->writeTenant($r, $b['partner_id'] ?? null);
        if (! empty($b['booking_id'])) {
            abort_unless(DB::table('bookings')->where('id', $b['booking_id'])->when($tid, fn ($q) => $q->where('tenant_id', $tid))->exists(), 422, 'Mã vé không thuộc nhà xe này');
        }
        $id = (string) Str::uuid();
        DB::table('cashbook_entries')->insert(['partner_id' => $tid] + $b + ['id' => $id, 'created_by' => $u->email, 'created_at' => now(), 'updated_at' => now()]);
        AuditLog::create(['action' => 'cashbook.'.$b['type'], 'target_type' => 'CashbookEntry', 'target_id' => $id, 'target_label' => $valid[$b['category']].' '.number_format($b['amount']).'đ', 'actor_email' => $u->email, 'new_values' => $b]);
        if ($tid) {
            $this->ops->audit($u, $tid, 'cashbook.'.$b['type'], $id, ['amount' => $b['amount'], 'category' => $b['category']]);
        }

        return response()->json(['status' => 1, 'message' => $b['type'] === 'in' ? 'Đã ghi phiếu thu' : 'Đã ghi phiếu chi', 'data' => DB::table('cashbook_entries')->find($id)]);
    }

    public function destroy(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $e = DB::table('cashbook_entries')->find($id) ?? abort(404, 'Không tìm thấy phiếu');
        abort_unless($this->bridge->isPlatform($u) || $e->partner_id === $u->tenant_id, 404, 'Không tìm thấy phiếu');
        DB::table('cashbook_entries')->where('id', $id)->delete();
        AuditLog::create(['action' => 'cashbook.deleted', 'target_type' => 'CashbookEntry', 'target_id' => $id, 'target_label' => $e->category.' '.$e->amount, 'actor_email' => $u->email, 'old_values' => (array) $e]);
        if ($e->partner_id) {
            $this->ops->audit($u, $e->partner_id, 'cashbook.deleted', $id, ['amount' => $e->amount]);
        }

        return response()->json(['status' => 1, 'message' => 'Đã xoá phiếu']);
    }

    public function debts(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $now = now()->utc()->format('Y-m-d\TH:i:s.v\Z');
        $receivable = $this->bridge->bookings($this->bridge->bookingRows($scope)->where('status', '!=', 'cancelled')->values())
            ->filter(fn ($b) => $b['due_amount'] > 0)
            ->map(fn ($b) => [
                'id' => $b['id'], 'booking_code' => $b['booking_code'], 'customer_name' => $b['customer_name'], 'customer_phone' => $b['customer_phone'],
                'final_amount' => $b['due_amount'], 'payment_status' => $b['payment_status'], 'created_at' => $b['created_at'],
                'depart_time' => $b['trip']['depart_time'], 'partner_name' => $b['partner']['name'],
                'overdue' => $b['trip']['depart_time'] && $b['trip']['depart_time'] < $this->bridge->local($now),
            ])->sortBy('depart_time')->values();
        $payable = DB::table('reconciliations as c')
            ->where('c.status', '!=', 'paid')
            ->when($scope !== null, fn ($q) => $q->whereIn('c.partner_id', $scope))
            ->select('c.id', 'c.code', 'c.period_start', 'c.period_end', 'c.payout_amount', 'c.status', 'c.partner_id')
            ->orderBy('c.period_end')->get()
            ->map(function ($c) {
                $c->partner_name = DB::table('tenants')->where('id', $c->partner_id)->value('name');

                return $c;
            });

        return response()->json(['status' => 1, 'data' => [
            'receivable_total' => (int) $receivable->sum('final_amount'),
            'receivable_overdue' => (int) $receivable->where('overdue', true)->sum('final_amount'),
            'receivables' => $receivable,
            'payable_total' => (int) $payable->sum('payout_amount'),
            'payables' => $payable,
        ]]);
    }
}
