<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\CarbonImmutable as C;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class StudioController extends Controller
{
    private const EDIT = ['owner', 'manager', 'dispatcher'];

    private const FINANCE = ['owner', 'manager', 'accountant'];

    public function settings(Request $r)
    {
        $tid = $this->tid($r);
        if ($r->isMethod('GET')) {
            return $this->ops->tenant($tid);
        }$u = $this->role($r, ['owner', 'manager']);
        $b = $r->validate(['name' => 'required|string|max:150', 'email' => 'nullable|email', 'address' => 'nullable|string|max:300', 'description' => 'nullable|string|max:1500', 'policies' => 'nullable|string|max:5000', 'color' => 'nullable|regex:/^#[0-9a-fA-F]{6}$/']);
        $t = $this->ops->tenant($tid);
        foreach (['email', 'address', 'description', 'policies', 'color'] as $k) {
            if (array_key_exists($k, $b)) {
                $t[$k] = $b[$k] ?? '';
            }
        }$t['phone'] = $this->ops->phone($r->input('phone'));
        DB::table('tenants')->where('id', $tid)->update(['name' => $b['name'], 'data' => $this->ops->json($t)]);
        $this->ops->audit($u, $tid, 'settings.update', $tid);

        return $this->ops->tenant($tid);
    }

    public function dashboard(Request $r)
    {
        $tid = $this->tid($r);
        $u = $this->user($r);
        $trips = $this->tripRows($r, $tid)->map(fn ($t) => $this->ops->trip($t));
        $bookings = $this->bookings($r, $tid)->map(fn ($b) => $this->ops->booking($b));
        $active = $bookings->where('status', '!=', 'cancelled');
        $can = $u->role === 'platform' || in_array($u->role, self::FINANCE);
        $ledger = $can ? DB::table('ledger')->where('tenant_id', $tid)->get() : collect();
        $days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = C::now('Asia/Ho_Chi_Minh')->subDays($i)->format('Y-m-d');
            $sum = $ledger->filter(fn ($l) => C::parse($l->created_at, 'UTC')->setTimezone('Asia/Ho_Chi_Minh')->format('Y-m-d') === $date)->sum(fn ($l) => $l->kind === 'collection' ? $l->amount : ($l->kind === 'refund' ? -$l->amount : 0));
            $days[] = ['date' => $date, 'value' => $sum];
        }

        return ['trips' => $trips->where('date', $this->ops->day())->values(), 'upcoming' => $trips->filter(fn ($t) => $t['departAt'] > $this->ops->now() && ! in_array($t['status'], ['cancelled', 'completed']))->sortBy('departAt')->take(8)->values(), 'totals' => ['trips' => $trips->count(), 'bookings' => $active->count(), 'seats' => $active->sum(fn ($b) => count($b['selectedSeats'])), 'revenue' => $can ? $ledger->where('kind', 'collection')->sum('amount') : null, 'refunds' => $can ? $ledger->where('kind', 'refund')->sum('amount') : null, 'unpaid' => $can ? $active->where('paymentStatus', 'unpaid')->sum('totalAmount') : null], 'days' => $days, 'latest' => $bookings->take(6)->values()];
    }

    public function trips(Request $r)
    {
        $tid = $this->tid($r);
        if ($r->isMethod('GET')) {
            return ['items' => $this->tripRows($r, $tid)->map(fn ($t) => $this->ops->trip($t))];
        }$u = $this->role($r, self::EDIT);
        $b = $r->all();
        $r->validate(['date' => 'required|date_format:Y-m-d', 'repeatDays' => 'nullable|integer|min:1|max:30']);
        $items = DB::transaction(function () use ($tid, $b, $u) {
            $rows = [];
            for ($i = 0; $i < ($b['repeatDays'] ?? 1); $i++) {
                $rows[] = $this->ops->saveTrip($tid, [...$b, 'date' => C::parse($b['date'])->addDays($i)->format('Y-m-d')], $u);
            }

            return $rows;
        }, 3);

        return response()->json(['items' => $items], 201);
    }

    public function trip(Request $r, string $id)
    {
        $tid = $this->tid($r);
        $u = $this->role($r, self::EDIT);

        return $this->ops->saveTrip($tid, $r->all(), $u, $id);
    }

    public function status(Request $r, string $id)
    {
        $tid = $this->tid($r);
        $u = $this->role($r, self::EDIT);

        return $this->ops->tripStatus($tid, $id, (string) $r->input('status'), $u);
    }

    public function manifest(Request $r, string $id)
    {
        $tid = $this->tid($r);
        $trip = $this->ops->tripRow($tid, $id);
        $u = $this->user($r);
        abort_if($u->role === 'driver' && $trip->driver_id !== $u->driver_id, 403, 'Không phải chuyến được phân công');
        $rows = [['Ma ve', 'Ho ten', 'Dien thoai', 'Ghe', 'Diem don', 'Trang thai']];
        foreach (DB::table('bookings')->where('trip_id', $id)->where('status', '!=', 'cancelled')->get() as $row) {
            $b = $this->ops->booking($row);
            $rows[] = [$b['id'], $b['passenger']['fullName'], $b['passenger']['phone'], implode(' ', $b['selectedSeats']), $b['passenger']['pickupStopId'], $b['status']];
        }

        return $this->csv('passengers.csv', $rows);
    }

    public function orders(Request $r)
    {
        $tid = $this->tid($r);
        if ($r->isMethod('GET')) {
            return ['items' => $this->bookings($r, $tid)->map(fn ($b) => $this->ops->booking($b))];
        }$u = $this->role($r, ['owner', 'manager', 'dispatcher', 'sales']);

        return response()->json($this->ops->reserve($r->all(), $u, $tid, 'counter-'.$u->id, (string) $r->header('Idempotency-Key')), 201);
    }

    public function order(Request $r, string $id)
    {
        $tid = $this->tid($r);
        $u = $this->role($r, $r->input('action') === 'checkin' ? ['owner', 'manager', 'dispatcher', 'sales', 'driver'] : ['owner', 'manager', 'dispatcher', 'sales']);

        return $this->ops->changeBooking($tid, $id, $r->all(), $u);
    }

    public function ledger(Request $r)
    {
        $tid = $this->tid($r);
        if ($r->isMethod('GET')) {
            $u = $this->role($r, [...self::FINANCE, 'sales']);
            $q = DB::table('ledger')->where('tenant_id', $tid);
            if ($u->role === 'sales') {
                $q->where('actor_id', $u->id);
            }

            return ['items' => $q->orderByDesc('created_at')->get()];
        }$u = $this->role($r, $r->input('kind') === 'collection' ? [...self::FINANCE, 'sales'] : self::FINANCE);

        return response()->json($this->ops->ledger($tid, $r->all(), $u, $r->header('Idempotency-Key')), 201);
    }

    public function reports(Request $r)
    {
        $tid = $this->tid($r);
        $this->role($r, self::FINANCE);
        $bookings = $this->bookings($r, $tid)->map(fn ($b) => $this->ops->booking($b));
        $ledger = DB::table('ledger')->where('tenant_id', $tid)->get();
        $routes = [];
        foreach ($bookings->groupBy(fn ($b) => $b['trip']['from'].' → '.$b['trip']['to']) as $name => $bs) {
            $ids = $bs->pluck('id');
            $active = $bs->where('status', '!=', 'cancelled');
            $routes[] = ['name' => $name, 'tickets' => $active->sum(fn ($b) => count($b['selectedSeats'])), 'bookedValue' => $active->sum('totalAmount'), 'collected' => $ledger->whereIn('booking_id', $ids)->where('kind', 'collection')->sum('amount'), 'refunded' => $ledger->whereIn('booking_id', $ids)->where('kind', 'refund')->sum('amount')];
        }$agencies = [];
        foreach ($this->ops->records($tid, 'agencies') as $a) {
            $bs = $bookings->where('agencyId', $a['id'])->where('status', '!=', 'cancelled');
            $agencies[] = [...$a, 'bookedValue' => $bs->sum('totalAmount'), 'commissionAccrued' => $bs->where('paymentStatus', 'paid')->sum(fn ($b) => (int) floor($b['totalAmount'] * ($b['agencyCommissionBps'] ?? 0) / 10000)), 'debt' => $bs->sum(fn ($b) => $b['totalAmount'] - $this->ops->netPaid($b['id']))];
        }$summary = ['collected' => $ledger->where('kind', 'collection')->sum('amount'), 'refunded' => $ledger->where('kind', 'refund')->sum('amount'), 'expenses' => $ledger->where('kind', 'expense')->sum('amount'), 'platformFeeAccrued' => $bookings->where('status', '!=', 'cancelled')->where('paymentStatus', 'paid')->sum(fn ($b) => (int) floor($b['totalAmount'] * ($b['platformCommissionBps'] ?? 0) / 10000))];
        if ($r->query('export') === 'csv') {
            return $this->csv('revenue.csv', [['Tuyen', 'Ve', 'Gia tri dat', 'Da thu', 'Da hoan'], ...array_map(fn ($x) => array_values($x), $routes)]);
        }

        return ['routes' => $routes, 'agencies' => $agencies, 'byDay' => [], 'summary' => $summary];
    }

    public function customers(Request $r)
    {
        $tid = $this->tid($r);
        $this->role($r, ['owner', 'manager', 'sales', 'accountant']);
        $items = [];
        foreach ($this->bookings($r, $tid) as $row) {
            $b = $this->ops->booking($row);
            $phone = $b['passenger']['phone'];
            if (! isset($items[$phone])) {
                $items[$phone] = [...$b['passenger'], 'bookings' => 0, 'total' => 0, 'lastAt' => $b['createdAt']];
            }$items[$phone]['bookings']++;
            if ($b['status'] !== 'cancelled') {
                $items[$phone]['total'] += $b['totalAmount'];
            }
        }

        return ['items' => array_values($items)];
    }

    public function staff(Request $r)
    {
        $tid = $this->tid($r);
        $u = $this->role($r, ['owner', 'manager']);
        if ($r->isMethod('GET')) {
            return ['items' => User::where('tenant_id', $tid)->get()];
        }$b = $r->validate(['name' => 'required|string|max:150', 'email' => 'required|email|max:200', 'password' => 'required|string|min:12|max:200', 'role' => 'required|in:owner,manager,dispatcher,sales,accountant,driver', 'driverId' => 'nullable|string']);
        abort_if($u->role === 'manager' && in_array($b['role'], ['owner', 'manager']), 403, 'Quản lý không được tạo chủ sở hữu hoặc quản lý khác');
        if (! empty($b['driverId'])) {
            $this->ops->resource($tid, 'drivers', $b['driverId']);
        }$new = User::create(['id' => $this->ops->uuid(), 'tenant_id' => $tid, 'name' => $b['name'], 'email' => strtolower($b['email']), 'password' => Hash::make($b['password']), 'role' => $b['role'], 'active' => true, 'driver_id' => ($b['driverId'] ?? '') ?: null, 'created_at' => $this->ops->now()]);
        $this->ops->audit($u, $tid, 'staff.create', $new->id);

        return response()->json($new, 201);
    }

    public function staffUpdate(Request $r, string $id)
    {
        $tid = $this->tid($r);
        $u = $this->role($r, ['owner', 'manager']);
        $b = $r->validate(['active' => 'required|boolean']);

        return DB::transaction(function () use ($id, $tid, $u, $b) {
            DB::table('tenants')->where('id', $tid)->lockForUpdate()->first();
            $target = User::where(['id' => $id, 'tenant_id' => $tid])->firstOrFail();
            abort_if($u->id === $id, 409, 'Không tự khóa tài khoản');
            abort_if($u->role === 'manager' && in_array($target->role, ['owner', 'manager']), 403, 'Không được khóa chủ/quản lý');
            if (! $b['active'] && $target->role === 'owner') {
                abort_unless(User::where(['tenant_id' => $tid, 'role' => 'owner', 'active' => true])->where('id', '!=', $id)->exists(), 409, 'Không khóa chủ nhà xe cuối cùng');
            }$target->active = $b['active'];
            $target->save();
            $this->ops->audit($u, $tid, 'staff.active', $id);

            return $target;
        }, 3);
    }

    public function resource(Request $r, string $kind, ?string $id = null)
    {
        $tid = $this->tid($r);
        $read = in_array($kind, ['agencies', 'promotions']) ? ['owner', 'manager', 'sales', 'accountant'] : ($kind === 'shifts' ? self::EDIT : ['owner', 'manager', 'dispatcher', 'sales', 'accountant']);
        $u = $this->role($r, $read);
        if ($r->isMethod('GET')) {
            return ['items' => $this->ops->records($tid, $kind)];
        }$this->role($r, in_array($kind, ['agencies', 'promotions']) ? ['owner', 'manager'] : self::EDIT);
        if (! $r->isMethod('DELETE')) {
            return response()->json($this->ops->saveRecord($tid, $kind, $r->all(), $u, $id), $id ? 200 : 201);
        }$this->ops->resource($tid, $kind, $id);
        abort_if(DB::table('trips')->where('tenant_id', $tid)->where(fn ($q) => $q->where('vehicle_id', $id)->orWhere('route_id', $id)->orWhere('driver_id', $id))->exists() || User::where('driver_id', $id)->exists(), 409, 'Dữ liệu đã được sử dụng, không thể xóa');
        if ($kind === 'agencies') {
            abort_if(DB::table('bookings')->where('tenant_id', $tid)->get()->contains(fn ($b) => ($this->ops->data($b)['agencyId'] ?? '') === $id), 409, 'Đại lý đã phát sinh công nợ');
        }if ($kind === 'branches') {
            abort_if(DB::table('trips')->where('tenant_id', $tid)->get()->contains(fn ($t) => ($this->ops->data($t)['branchId'] ?? '') === $id), 409, 'Văn phòng đã gắn lịch chạy');
        }DB::table('records')->where(['tenant_id' => $tid, 'id' => $id])->delete();
        $this->ops->audit($u, $tid, $kind.'.delete', $id);

        return ['ok' => true];
    }

    public function audit(Request $r)
    {
        $tid = $this->tid($r);
        $this->role($r, ['owner', 'manager']);

        return ['items' => DB::table('audit')->leftJoin('users', 'audit.actor_id', '=', 'users.id')->where('audit.tenant_id', $tid)->select('audit.*', 'users.name as actor')->orderByDesc('audit.created_at')->limit(500)->get()];
    }

    public function notices(Request $r)
    {
        $tid = $this->tid($r);
        $u = $this->user($r);
        if ($r->isMethod('POST')) {
            foreach (DB::table('notices')->where('tenant_id', $tid)->pluck('id') as $id) {
                DB::table('notice_reads')->insertOrIgnore(['user_id' => $u->id, 'notice_id' => $id]);
            }

            return ['ok' => true];
        }

        return ['items' => DB::table('notices')->where('tenant_id', $tid)->orderByDesc('created_at')->limit(50)->get()->map(fn ($n) => (array) $n + ['read' => DB::table('notice_reads')->where(['user_id' => $u->id, 'notice_id' => $n->id])->exists()])];
    }

    public function upload(Request $r)
    {
        $tid = $this->tid($r);
        $u = $this->role($r, self::EDIT);
        $b = $r->validate(['data' => 'required|string|max:4500000']);
        $data = base64_decode($b['data'], true);
        abort_unless($data && strlen($data) <= 3 * 1024 * 1024, 422, 'Ảnh tối đa 3MB');
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($data);
        $ext = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp'][$mime] ?? null;
        abort_unless($ext && @getimagesizefromstring($data), 422, 'Chỉ nhận ảnh PNG/JPEG/WebP hợp lệ');
        $name = $tid.'-'.$this->ops->uuid().'.'.$ext;
        Storage::disk('public')->put($name, $data);
        $this->ops->audit($u, $tid, 'image.upload', $name);

        return response()->json(['url' => '/uploads/'.$name], 201);
    }
}
