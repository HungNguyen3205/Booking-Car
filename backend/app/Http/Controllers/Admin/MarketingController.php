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
 * Chiến dịch marketing (audience from live booking history) and trip reviews.
 * No SMS/Email/Zalo gateway is connected yet: campaigns are drafted/scheduled
 * with an exact audience count, but nothing is sent.
 */
class MarketingController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    /** Distinct customers (by phone) matching the audience inside the caller's scope. */
    private function audience(Request $r, array $a, string $channel)
    {
        $scope = $this->bridge->scope($r, $a['partner_id'] ?? null);
        $rows = $this->bridge->bookingRows($scope)->where('status', '!=', 'cancelled');
        if (! empty($a['route_id'])) {
            $rows = $rows->where('trip_route_id', $a['route_id']);
        }
        $since = ! empty($a['last_days']) ? now()->utc()->subDays((int) $a['last_days'])->format('Y-m-d\TH:i:s.v\Z') : null;

        return $rows->map(fn ($b) => ['row' => $b, 'p' => $this->ops->data($b)['passenger'] ?? []])
            ->filter(fn ($x) => ($x['p']['phone'] ?? '') !== '' && ($channel !== 'email' || ($x['p']['email'] ?? '') !== ''))
            ->groupBy(fn ($x) => $x['p']['phone'])
            ->map(fn ($g, $phone) => ['phone' => $phone, 'name' => $g->first()['p']['fullName'] ?? '', 'email' => $g->first()['p']['email'] ?? '',
                'trips' => $g->count(), 'last' => $g->max(fn ($x) => $x['row']->created_at)])
            ->filter(fn ($c) => (empty($a['min_trips']) || $c['trips'] >= (int) $a['min_trips']) && (! $since || $c['last'] >= $since))
            ->values();
    }

    private function audienceRules(): array
    {
        return [
            'audience' => 'nullable|array', 'audience.partner_id' => 'nullable|string', 'audience.route_id' => 'nullable|string',
            'audience.min_trips' => 'nullable|integer|min:1|max:100', 'audience.last_days' => 'nullable|integer|min:1|max:3650',
        ];
    }

    public function preview(Request $r)
    {
        $b = $r->validate($this->audienceRules() + ['channel' => 'required|in:sms,email,zalo']);
        $rows = $this->audience($r, $b['audience'] ?? [], $b['channel']);

        return response()->json(['status' => 1, 'data' => [
            'count' => $rows->count(),
            'sample' => $rows->take(5)->map(fn ($x) => ['name' => $x['name'], 'phone' => substr($x['phone'], 0, 3).'****'.substr($x['phone'], -3), 'trips' => $x['trips']])->values(),
        ]]);
    }

    public function campaigns(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $items = DB::table('marketing_campaigns')->when($scope !== null, fn ($q) => $q->whereIn('partner_id', $scope))
            ->orderByDesc('created_at')->get()
            ->map(function ($c) {
                $c->audience = json_decode($c->audience ?? '{}', true) ?: [];
                $c->partner_name = $c->partner_id ? DB::table('tenants')->where('id', $c->partner_id)->value('name') : null;

                return $c;
            });

        return response()->json(['status' => 1, 'data' => $items, 'gateway_connected' => false]);
    }

    public function storeCampaign(Request $r)
    {
        $u = $this->bridge->user($r);
        $b = $r->validate($this->audienceRules() + [
            'name' => 'required|string|max:150', 'channel' => 'required|in:sms,email,zalo', 'message' => 'required|string|max:1000',
            'promotion_code' => 'nullable|string|max:50', 'scheduled_at' => 'nullable|date|after:now',
        ]);
        $audience = array_filter($b['audience'] ?? [], fn ($v) => $v !== null && $v !== '');
        // Operators always target their own customers; platform may target everyone.
        $partnerId = $this->bridge->isPlatform($u) ? ($audience['partner_id'] ?? null) : $u->tenant_id;
        if ($partnerId) {
            $audience['partner_id'] = $partnerId;
        }
        if (! empty($b['promotion_code'])) {
            abort_unless(DB::table('records')->where(['kind' => 'promotions', 'identifier' => strtoupper($b['promotion_code'])])
                ->when($partnerId, fn ($q) => $q->where('tenant_id', $partnerId))->exists(), 422, 'Mã ưu đãi không tồn tại ở nhà xe này');
        }
        $count = $this->audience($r, $audience, $b['channel'])->count();
        $id = (string) Str::uuid();
        DB::table('marketing_campaigns')->insert([
            'id' => $id, 'partner_id' => $partnerId, 'name' => $b['name'], 'channel' => $b['channel'], 'audience' => json_encode($audience),
            'message' => $b['message'], 'promotion_code' => ! empty($b['promotion_code']) ? strtoupper($b['promotion_code']) : null,
            'status' => ! empty($b['scheduled_at']) ? 'scheduled' : 'draft', 'scheduled_at' => $b['scheduled_at'] ?? null,
            'audience_count' => $count, 'created_at' => now(), 'updated_at' => now(),
        ]);
        AuditLog::create(['action' => 'campaign.created', 'target_type' => 'MarketingCampaign', 'target_id' => $id, 'target_label' => $b['name'], 'actor_email' => $u->email, 'new_values' => $b]);

        return response()->json(['status' => 1, 'message' => "Đã lưu chiến dịch ({$count} khách phù hợp)", 'data' => DB::table('marketing_campaigns')->find($id)]);
    }

    public function updateCampaign(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $c = DB::table('marketing_campaigns')->find($id) ?? abort(404, 'Không tìm thấy chiến dịch');
        abort_unless($this->bridge->isPlatform($u) || $c->partner_id === $u->tenant_id, 404, 'Không tìm thấy chiến dịch');
        $b = $r->validate(['status' => 'required|in:draft,scheduled,cancelled', 'scheduled_at' => 'nullable|date|after:now']);
        if ($b['status'] === 'scheduled') {
            abort_unless($b['scheduled_at'] ?? $c->scheduled_at, 422, 'Cần chọn thời gian gửi để lên lịch');
        }
        DB::table('marketing_campaigns')->where('id', $id)->update(['status' => $b['status'], 'scheduled_at' => $b['scheduled_at'] ?? $c->scheduled_at, 'updated_at' => now()]);
        AuditLog::create(['action' => 'campaign.'.$b['status'], 'target_type' => 'MarketingCampaign', 'target_id' => $id, 'target_label' => $c->name, 'actor_email' => $u->email]);

        return response()->json(['status' => 1, 'message' => 'Đã cập nhật chiến dịch']);
    }

    public function reviews(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $items = DB::table('trip_reviews')->when($scope !== null, fn ($q) => $q->whereIn('partner_id', $scope))
            ->when($r->filled('rating'), fn ($q) => $q->where('rating', (int) $r->query('rating')))
            ->when($r->filled('status'), fn ($q) => $q->where('status', $r->query('status')))
            ->orderByDesc('created_at')->limit(300)->get();
        $trips = $items->isEmpty() ? collect() : DB::table('trips')->whereIn('id', $items->pluck('trip_id')->filter())->get()->keyBy('id');
        $items = $items->map(function ($v) use ($trips) {
            $t = $trips[$v->trip_id] ?? null;
            $route = $t ? $this->ops->data($t)['route'] : null;
            $v->booking_code = $v->booking_id;
            $v->partner_name = DB::table('tenants')->where('id', $v->partner_id)->value('name');
            $v->route_name = $route ? $route['from'].' → '.$route['to'] : null;
            $v->depart_time = $t ? $this->bridge->local($t->depart_at) : null;

            return $v;
        });
        $visible = $items->where('status', 'visible');

        return response()->json(['status' => 1, 'data' => [
            'items' => $items->values(),
            'average' => $visible->count() ? round($visible->avg('rating'), 2) : null,
            'distribution' => collect(range(5, 1))->mapWithKeys(fn ($s) => [$s => $items->where('rating', $s)->count()]),
            'unreplied' => $items->whereNull('reply')->count(),
        ]]);
    }

    public function updateReview(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $v = DB::table('trip_reviews')->find($id) ?? abort(404, 'Không tìm thấy đánh giá');
        abort_unless($this->bridge->isPlatform($u) || $v->partner_id === $u->tenant_id, 404, 'Không tìm thấy đánh giá');
        $b = $r->validate(['status' => 'sometimes|in:visible,hidden', 'reply' => 'sometimes|nullable|string|max:1000']);
        $patch = ['updated_at' => now()];
        if (array_key_exists('status', $b)) {
            $patch['status'] = $b['status'];
        }
        if (array_key_exists('reply', $b)) {
            $patch['reply'] = $b['reply'] ?: null;
            $patch['replied_at'] = $b['reply'] ? now() : null;
        }
        DB::table('trip_reviews')->where('id', $id)->update($patch);
        $this->ops->audit($u, $v->partner_id, 'review.update', $id, array_keys($patch));

        return response()->json(['status' => 1, 'message' => 'Đã cập nhật đánh giá']);
    }

    /** Public: a passenger who boarded reviews the trip with booking code + phone. */
    public function submitReview(Request $r)
    {
        $b = $r->validate(['code' => 'required|string|max:60', 'phone' => 'required|string|max:20', 'rating' => 'required|integer|min:1|max:5', 'comment' => 'nullable|string|max:1000']);
        $booking = DB::table('bookings')->where('id', strtoupper(trim($b['code'])))->first();
        $d = $booking ? $this->ops->data($booking) : null;
        abort_unless($booking && ($d['passenger']['phone'] ?? '') === $this->ops->phone($b['phone']), 404, 'Không tìm thấy vé với mã và số điện thoại này');
        abort_unless($booking->status === 'checked_in', 422, 'Chỉ đánh giá được sau khi đã lên xe');
        abort_if(DB::table('trip_reviews')->where('booking_id', $booking->id)->exists(), 409, 'Vé này đã được đánh giá');
        DB::table('trip_reviews')->insert([
            'id' => (string) Str::uuid(), 'booking_id' => $booking->id, 'partner_id' => $booking->tenant_id, 'trip_id' => $booking->trip_id,
            'customer_name' => $d['passenger']['fullName'] ?? null, 'rating' => $b['rating'], 'comment' => $b['comment'] ?? null,
            'status' => 'visible', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->ops->notify($booking->tenant_id, 'Có đánh giá '.$b['rating'].' sao cho vé '.$booking->id);

        return response()->json(['ok' => true, 'message' => 'Cảm ơn bạn đã đánh giá chuyến đi'], 201);
    }
}
