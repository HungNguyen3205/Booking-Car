<?php

namespace App\Http\Controllers;

use App\Services\PortalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

class MarketplaceController extends Controller
{
    public function operators(Request $r)
    {
        $tid = app(PortalService::class)->tenantForHost($r);

        return ['items' => DB::table('tenants')->where('status', 'active')->when($tid, fn ($q) => $q->where('id', $tid))->get()->map(function ($t) {
            $t = $this->ops->tenant($t->id);

            return [...array_intersect_key($t, array_flip(['id', 'name', 'slug', 'description', 'phone', 'color', 'logo'])), 'profileUrl' => 'https://'.config('portals.profile_host').'/nha-xe/'.$t['slug']];
        })];
    }

    public function cities(Request $r)
    {
        $names = [];
        $tid = app(PortalService::class)->tenantForHost($r);
        foreach (DB::table('trips')->join('tenants', 'trips.tenant_id', '=', 'tenants.id')->where('trips.status', 'published')->where('tenants.status', 'active')->when($tid, fn ($q) => $q->where('trips.tenant_id', $tid))->select('trips.*')->get() as $t) {
            $d = $this->ops->data($t);
            $names[] = $d['route']['from'];
            $names[] = $d['route']['to'];
        }

        return ['items' => array_values(array_unique($names))];
    }

    public function search(Request $r)
    {
        $b = $r->validate(['from' => 'required|string|max:100|different:to', 'to' => 'required|string|max:100', 'date' => 'required|date_format:Y-m-d|after_or_equal:'.$this->ops->day(), 'passengers' => 'nullable|integer|min:1|max:5', 'operator' => 'nullable|string']);
        $local = \Carbon\CarbonImmutable::parse($b['date'], 'Asia/Ho_Chi_Minh')->startOfDay();
        [$dayStart, $dayEnd] = [$local->utc()->format('Y-m-d\TH:i:s.v\Z'), $local->addDay()->utc()->format('Y-m-d\TH:i:s.v\Z')];
        $rows = DB::table('trips')->join('tenants', 'trips.tenant_id', '=', 'tenants.id')->where('trips.status', 'published')->where('tenants.status', 'active')->where('depart_at', '>', $this->ops->now())
            // Only the requested local day (Asia/Ho_Chi_Minh), so search cost does not grow with the whole schedule.
            ->where('depart_at', '>=', $dayStart)->where('depart_at', '<', $dayEnd)->select('trips.*')->orderBy('depart_at')->get();
        $hostTenant = app(PortalService::class)->tenantForHost($r);
        if ($hostTenant && isset($b['operator'])) {
            abort_unless($b['operator'] === $hostTenant, 403, 'Không truy cập nhà xe khác từ app này');
        }$items = [];
        foreach ($rows as $t) {
            $d = $this->ops->data($t);
            if (($hostTenant && $t->tenant_id !== $hostTenant) || $d['date'] !== $b['date'] || $d['route']['from'] !== $b['from'] || $d['route']['to'] !== $b['to'] || (! empty($b['operator']) && $t->tenant_id !== $b['operator'])) {
                continue;
            }$trip = $this->ops->trip($t);
            if ($trip['availableSeatsCount'] >= ($b['passengers'] ?? 1)) {
                $items[] = $trip;
            }
        }

        return ['items' => $items];
    }

    private function token(Request $r): string
    {
        $t = (string) $r->header('X-Booking-Token');
        abort_unless(strlen($t) >= 24 && strlen($t) <= 150, 422, 'Phiên đặt vé không hợp lệ');

        return $t;
    }

    public function hold(Request $r)
    {
        $b = $r->validate(['tripId' => 'required|string', 'seats' => 'required|array', 'seats.*' => 'required|string']);
        app(PortalService::class)->scopeTrip($r, $b['tripId']);

        return response()->json($this->ops->hold($b['tripId'], $b['seats'], $this->token($r)), 201);
    }

    public function release(Request $r, string $id)
    {
        $token = $this->token($r);
        DB::transaction(function () use ($id, $token) {
            $hold = DB::table('holds')->where(['id' => $id, 'token' => hash('sha256', $token)])->lockForUpdate()->first();
            abort_unless($hold, 404, 'Không tìm thấy lượt giữ ghế');
            DB::table('inventory')->where('hold_id', $id)->delete();
            DB::table('holds')->where('id', $id)->delete();
        });

        return ['ok' => true];
    }

    public function reserve(Request $r)
    {
        app(PortalService::class)->scopeTrip($r, (string) $r->input('tripId'));

        $booking = $this->ops->reserve($r->all(), null, null, $this->token($r), (string) $r->header('Idempotency-Key'));
        // Every online booking gets a customer account (login = phone). The checkout
        // shows these credentials before the ticket; an existing account is untouched.
        $accounts = app(\App\Services\CustomerAccounts::class);
        $account = $accounts->ensure($booking['passenger']['phone'], $booking['passenger']['fullName']);
        if (! DB::table('customer_notifications')->where(['booking_id' => $booking['id'], 'title' => 'Đặt vé thành công'])->exists()) {
            $accounts->notify($booking['passenger']['phone'], $booking['id'], 'Đặt vé thành công',
                'Vé '.$booking['id'].' · '.$booking['trip']['from'].' → '.$booking['trip']['to'].' lúc '.$booking['trip']['departureTime'].' ngày '.$booking['date'].'. Thanh toán tại quầy hoặc chuyển khoản; nhà xe xác nhận khi nhận tiền.');
        }

        return response()->json($booking + ['account' => $account + ($account['created'] ? ['tempPassword' => \App\Services\CustomerAccounts::TEMP_PASSWORD] : [])], 201);
    }

    public function lookup(Request $r)
    {
        $key = 'lookup:'.hash('sha256', $r->ip());
        abort_if(RateLimiter::tooManyAttempts($key, 8), 429, 'Thử tra cứu quá nhiều lần');
        $phone = $this->ops->phone($r->input('phone'));
        $row = DB::table('bookings')->where('id', (string) $r->input('code'))->first();
        if (! $row || $this->ops->data($row)['passenger']['phone'] !== $phone) {
            RateLimiter::hit($key, 900);
            abort(404, 'Không tìm thấy vé với mã và số điện thoại này');
        }$tid = app(PortalService::class)->tenantForHost($r);
        abort_if($tid && $row->tenant_id !== $tid, 404, 'Không tìm thấy vé trong app này');

        return $this->ops->booking($row);
    }
}
