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
 * Chấm công, lương và hoa hồng for operator login accounts (users).
 * Lương = lương cơ bản × công thực tế / công chuẩn (tối đa bằng lương cơ bản).
 * Hoa hồng = % × tiền đã thu của vé do chính nhân viên bán, tạo trong tháng.
 */
class WorkforceController extends Controller
{
    private const TZ = StudioBridge::TZ;

    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function month(Request $r): array
    {
        $m = $r->query('month') ?: Carbon::now(self::TZ)->format('Y-m');
        abort_unless(preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $m), 422, 'Tháng không hợp lệ (YYYY-MM)');
        $start = Carbon::createFromFormat('Y-m-d', $m.'-01', self::TZ)->startOfDay();

        return [$m, $start, (clone $start)->endOfMonth()];
    }

    private function staff(Request $r)
    {
        return $this->bridge->scoped(DB::table('users as u')->whereNotNull('u.tenant_id')->where('u.active', true), $this->bridge->scope($r), 'u.tenant_id')
            ->leftJoin('staff_compensation as c', 'c.admin_id', '=', 'u.id')
            ->select('u.id', 'u.name', 'u.email', 'u.role', 'u.tenant_id',
                DB::raw('COALESCE(c.base_salary, 0) as base_salary'), DB::raw('COALESCE(c.commission_rate, 0) as commission_rate'),
                DB::raw('COALESCE(c.standard_days, 26) as standard_days'), DB::raw("COALESCE(c.shift_start, '08:00') as shift_start"))
            ->orderBy('u.name')->get()
            ->map(function ($s) {
                $s->partner_name = $this->bridge->tenant($s->tenant_id)['name'];

                return $s;
            });
    }

    private function member(Request $r, string $userId): object
    {
        $u = DB::table('users')->where('id', $userId)->first();
        abort_unless($u && $u->tenant_id && $this->bridge->inScope($this->bridge->scope($r, ''), $u->tenant_id), 404, 'Không tìm thấy nhân sự');

        return $u;
    }

    public function attendance(Request $r)
    {
        [$m, $start, $end] = $this->month($r);
        $staff = $this->staff($r);
        $rows = DB::table('staff_attendance')->whereIn('admin_id', $staff->pluck('id'))
            ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])->get()->groupBy('admin_id');

        return response()->json(['status' => 1, 'data' => [
            'month' => $m, 'days_in_month' => $start->daysInMonth,
            'staff' => $staff->map(fn ($s) => [
                'id' => $s->id, 'name' => $s->name, 'email' => $s->email, 'role' => $s->role, 'partner_name' => $s->partner_name, 'shift_start' => $s->shift_start,
                'days' => collect($rows[$s->id] ?? [])->mapWithKeys(fn ($a) => [substr($a->work_date, 0, 10) => ['status' => $a->status, 'check_in' => $a->check_in, 'check_out' => $a->check_out, 'note' => $a->note]]),
            ])->values(),
        ]]);
    }

    public function mark(Request $r)
    {
        $actor = $this->bridge->user($r);
        $b = $r->validate([
            'admin_id' => 'required|string', 'work_date' => 'required|date_format:Y-m-d',
            'status' => 'required|in:present,late,leave,absent,clear',
            'check_in' => 'nullable|date_format:H:i', 'check_out' => 'nullable|date_format:H:i|after_or_equal:check_in',
            'note' => 'nullable|string|max:255',
        ]);
        $member = $this->member($r, $b['admin_id']);
        abort_if(Carbon::createFromFormat('Y-m-d', $b['work_date'], self::TZ)->isAfter(Carbon::now(self::TZ)->endOfDay()), 422, 'Không chấm công cho ngày trong tương lai');
        $key = ['admin_id' => $member->id, 'work_date' => $b['work_date']];
        if ($b['status'] === 'clear') {
            DB::table('staff_attendance')->where($key)->delete();

            return response()->json(['status' => 1, 'message' => 'Đã xoá công ngày '.$b['work_date']]);
        }
        $status = $b['status'];
        if ($status === 'present' && ! empty($b['check_in'])) {
            $shift = DB::table('staff_compensation')->where('admin_id', $member->id)->value('shift_start') ?: '08:00';
            if ($b['check_in'] > $shift) {
                $status = 'late';
            }
        }
        $values = ['status' => $status, 'check_in' => $b['check_in'] ?? null, 'check_out' => $b['check_out'] ?? null, 'note' => $b['note'] ?? null, 'updated_at' => now()];
        $existing = DB::table('staff_attendance')->where($key)->first();
        $existing
            ? DB::table('staff_attendance')->where('id', $existing->id)->update($values)
            : DB::table('staff_attendance')->insert($key + $values + ['id' => (string) Str::uuid(), 'created_at' => now()]);
        $this->ops->audit($actor, $member->tenant_id, 'attendance.mark', $member->id, ['date' => $b['work_date'], 'status' => $status]);

        return response()->json(['status' => 1, 'message' => 'Đã chấm công', 'data' => $key + $values]);
    }

    public function saveCompensation(Request $r, string $userId)
    {
        $actor = $this->bridge->user($r);
        $member = $this->member($r, $userId);
        abort_if($actor->id === $member->id && ! $this->bridge->isPlatform($actor), 403, 'Không tự đặt lương cho chính mình');
        $b = $r->validate([
            'base_salary' => 'required|integer|min:0|max:1000000000', 'commission_rate' => 'required|numeric|min:0|max:50',
            'standard_days' => 'required|integer|min:1|max:31', 'shift_start' => 'required|date_format:H:i',
        ]);
        DB::table('staff_compensation')->where('admin_id', $member->id)->exists()
            ? DB::table('staff_compensation')->where('admin_id', $member->id)->update($b + ['updated_at' => now()])
            : DB::table('staff_compensation')->insert($b + ['admin_id' => $member->id, 'created_at' => now(), 'updated_at' => now()]);
        AuditLog::create(['action' => 'staff.compensation', 'target_type' => 'User', 'target_id' => $member->id, 'actor_email' => $actor->email, 'new_values' => $b]);
        $this->ops->audit($actor, $member->tenant_id, 'staff.compensation', $member->id);

        return response()->json(['status' => 1, 'message' => 'Đã lưu lương & hoa hồng']);
    }

    public function payroll(Request $r)
    {
        [$m, $start, $end] = $this->month($r);
        $staff = $this->staff($r);
        $att = DB::table('staff_attendance')->whereIn('admin_id', $staff->pluck('id'))
            ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])
            ->select('admin_id', 'status', DB::raw('COUNT(*) as n'))->groupBy('admin_id', 'status')->get()->groupBy('admin_id');

        // Tickets each staff member sold (live audit "bookings.create"), created this month, money collected.
        [$a, $z] = $this->bridge->utcBounds($start->toDateString(), $end->toDateString());
        $rows = $this->bridge->bookingRows($this->bridge->scope($r))->filter(fn ($b) => $b->created_at >= $a && $b->created_at <= $z && $b->status !== 'cancelled')->values();
        $sold = $this->bridge->bookings($rows)->filter(fn ($b) => $b['created_by'])->groupBy('created_by');

        $out = $staff->map(function ($s) use ($att, $sold) {
            $counts = collect($att[$s->id] ?? [])->pluck('n', 'status');
            $worked = (int) ($counts['present'] ?? 0) + (int) ($counts['late'] ?? 0);
            $salary = (int) round($s->base_salary * min($worked, $s->standard_days) / max(1, $s->standard_days));
            $mine = $sold->get($s->id, collect());
            $revenue = (int) $mine->sum('paid_amount');
            $commission = (int) round($revenue * (float) $s->commission_rate / 100);

            return [
                'id' => $s->id, 'name' => $s->name, 'email' => $s->email, 'role' => $s->role, 'partner_name' => $s->partner_name,
                'base_salary' => (int) $s->base_salary, 'commission_rate' => (float) $s->commission_rate,
                'standard_days' => (int) $s->standard_days, 'shift_start' => $s->shift_start,
                'worked_days' => $worked, 'late_days' => (int) ($counts['late'] ?? 0),
                'leave_days' => (int) ($counts['leave'] ?? 0), 'absent_days' => (int) ($counts['absent'] ?? 0),
                'tickets_sold' => (int) $mine->sum('seat_count'), 'sales_revenue' => $revenue,
                'salary' => $salary, 'commission' => $commission, 'total' => $salary + $commission,
            ];
        })->values();

        return response()->json(['status' => 1, 'data' => [
            'month' => $m, 'rows' => $out,
            'totals' => ['salary' => $out->sum('salary'), 'commission' => $out->sum('commission'), 'total' => $out->sum('total')],
        ]]);
    }
}
