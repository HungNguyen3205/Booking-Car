<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Studio "Đơn vé" on the live booking model: the same bookings the website,
 * appgo and operator apps create. Counter sales go through OperatorService::reserve
 * (server-side price, seat locking, idempotency); payments go to the ledger.
 */
class TicketBookingController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    public function index(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $rows = $this->bridge->bookingRows($scope);
        if ($r->filled('status')) {
            $rows = $rows->where('status', $r->query('status'));
        }
        if ($r->filled('trip_id')) {
            $rows = $rows->where('trip_id', $r->query('trip_id'));
        }
        if ($r->filled('travel_date')) {
            [$a, $z] = $this->bridge->utcBounds($r->query('travel_date'), $r->query('travel_date'));
            $rows = $rows->filter(fn ($b) => $b->trip_depart_at >= $a && $b->trip_depart_at <= $z);
        }
        $items = $this->bridge->bookings($rows->values());
        if ($r->filled('payment_status')) {
            $items = $items->where('payment_status', $r->query('payment_status'));
        }
        if ($r->filled('search')) {
            $s = mb_strtolower(trim($r->query('search')));
            $digits = preg_replace('/\D+/', '', $s);
            $items = $items->filter(fn ($b) => str_contains(mb_strtolower($b['booking_code']), $s)
                || str_contains(mb_strtolower($b['customer_name']), $s)
                || ($digits !== '' && str_contains(preg_replace('/\D+/', '', $b['customer_phone']), $digits)));
        }

        return response()->json(['status' => 1, 'data' => $this->bridge->page($items->values(), $r)]);
    }

    private function find(Request $r, string $id): object
    {
        $row = $this->bridge->bookingRows($this->bridge->scope($r, ''))->firstWhere('id', $id);
        abort_unless($row, 404, 'Không tìm thấy đơn vé');

        return $row;
    }

    public function show(Request $r, string $id)
    {
        $row = $this->find($r, $id);
        $booking = $this->bridge->bookings(collect([$row]))->first();
        $booking['transactions'] = DB::table('ledger')->where('booking_id', $id)->orderBy('created_at')->get()
            ->map(fn ($l) => ['id' => $l->id, 'type' => $l->kind === 'collection' ? 'payment' : $l->kind, 'amount' => (int) $l->amount, 'method' => $l->method, 'note' => $l->note, 'transaction_time' => $this->bridge->local($l->created_at)]);

        return response()->json(['status' => 1, 'data' => $booking]);
    }

    /** Bán vé tại quầy. The client price is ignored: the trip price (and promotion) decide. */
    public function store(Request $r)
    {
        $u = $this->bridge->user($r);
        $b = $r->validate([
            'trip_id' => 'required|string',
            'customer_name' => 'required|string|max:100',
            'customer_phone' => 'required|string|max:20',
            'customer_email' => 'nullable|email|max:200',
            'seats' => 'required|array|min:1|max:5',
            'seats.*' => 'required|string|max:8',
            'pickup_stop_id' => 'nullable|string|max:80',
            'dropoff_stop_id' => 'nullable|string|max:80',
            'promo_code' => 'nullable|string|max:30',
            'payment_status' => 'nullable|string|in:unpaid,paid',
            'payment_method' => 'nullable|string',
            'notes' => 'nullable|string|max:1000',
        ]);
        $trip = DB::table('trips')->where('id', $b['trip_id'])->first();
        abort_unless($trip, 404, 'Không tìm thấy chuyến');
        $tid = $this->bridge->writeTenant($r, $trip->tenant_id);
        $route = $this->ops->data($trip)['route'];
        $pickup = $b['pickup_stop_id'] ?? null ?: $route['pickups'][0]['id'];
        $dropoff = $b['dropoff_stop_id'] ?? null ?: end($route['dropoffs'])['id'];

        $booking = $this->ops->reserve([
            'tripId' => $trip->id,
            'seats' => array_values(array_map(fn ($s) => strtoupper(trim($s)), $b['seats'])),
            'passenger' => ['fullName' => $b['customer_name'], 'phone' => $b['customer_phone'], 'email' => $b['customer_email'] ?? '',
                'pickupStopId' => $pickup, 'dropoffStopId' => $dropoff, 'note' => $b['notes'] ?? '', 'agreedTerms' => true],
            'promoCode' => $b['promo_code'] ?? null,
            'paymentMethod' => ($b['payment_method'] ?? 'cash') === 'cash' ? 'cash' : 'bank_transfer',
        ], $u, $tid, 'studio:'.$u->id, (string) Str::uuid());

        if (($b['payment_status'] ?? 'unpaid') === 'paid' && $booking['totalAmount'] > 0) {
            $this->ops->ledger($tid, ['kind' => 'collection', 'bookingId' => $booking['id'], 'amount' => $booking['totalAmount'],
                'method' => ($b['payment_method'] ?? 'cash') === 'cash' ? 'cash' : 'transfer', 'note' => 'Thu tại quầy khi bán vé'], $u, null);
        }

        return response()->json(['status' => 1, 'message' => 'Đã bán vé '.$booking['id'], 'data' => $this->bridge->bookings(collect([$this->find($r, $booking['id'])]))->first()]);
    }

    /** Edit contact details, cancel, or check in. */
    public function update(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $row = $this->find($r, $id);
        $b = $r->validate([
            'customer_name' => 'sometimes|string|max:100',
            'customer_phone' => 'sometimes|string|max:20',
            'customer_email' => 'nullable|email|max:200',
            'booking_status' => 'sometimes|string|in:confirmed,checked_in,cancelled',
            'notes' => 'nullable|string|max:1000',
            'pickup_stop_id' => 'sometimes|string|max:80', 'dropoff_stop_id' => 'sometimes|string|max:80',
            'notify_customer' => 'sometimes|boolean',
        ]);
        $before = $this->ops->data($row)['passenger'] ?? [];
        if (($b['booking_status'] ?? null) === 'cancelled') {
            $this->ops->changeBooking($row->tenant_id, $id, ['action' => 'cancel'], $u);
        } elseif (($b['booking_status'] ?? null) === 'checked_in') {
            $this->ops->changeBooking($row->tenant_id, $id, ['action' => 'checkin'], $u);
        }
        $contact = array_intersect_key($b, array_flip(['customer_name', 'customer_phone', 'customer_email', 'notes', 'pickup_stop_id', 'dropoff_stop_id']));
        $changes = [];
        if ($contact) {
            $changes = DB::transaction(function () use ($id, $contact, $u, $row) {
                $fresh = DB::table('bookings')->where('id', $id)->lockForUpdate()->first();
                abort_if($fresh->status === 'cancelled', 409, 'Vé đã hủy, không sửa được');
                $d = $this->ops->data($fresh);
                $map = ['customer_name' => 'fullName', 'customer_phone' => 'phone', 'customer_email' => 'email', 'notes' => 'note', 'pickup_stop_id' => 'pickupStopId', 'dropoff_stop_id' => 'dropoffStopId'];
                $old = $d['passenger'];
                foreach ($contact as $k => $v) {
                    $d['passenger'][$map[$k]] = $k === 'customer_phone' ? $this->ops->phone($v) : trim((string) ($v ?? ''));
                }
                abort_if($d['passenger']['fullName'] === '', 422, 'Họ tên không được để trống');
                // Stops must belong to this trip.
                $pickup = collect($d['trip']['departureStops'] ?? [])->firstWhere('id', $d['passenger']['pickupStopId']);
                $dropoff = collect($d['trip']['dropoffStops'] ?? [])->firstWhere('id', $d['passenger']['dropoffStopId']);
                abort_unless($pickup && $dropoff, 422, 'Điểm đón/trả không thuộc chuyến');
                $changed = array_keys(array_filter($map, fn ($f) => ($old[$f] ?? '') !== ($d['passenger'][$f] ?? '')));
                if ($changed) {
                    DB::table('bookings')->where('id', $id)->update(['data' => $this->ops->json($d)]);
                    $this->ops->audit($u, $row->tenant_id, 'bookings.contact', $id, ['fields' => $changed]);
                }

                return $changed;
            });
        }
        $fresh = $this->ops->data(DB::table('bookings')->where('id', $id)->first());
        $notified = false;
        if ($changes && ($b['notify_customer'] ?? true)) {
            $labels = ['customer_name' => 'họ tên', 'customer_phone' => 'số điện thoại', 'customer_email' => 'email', 'notes' => 'ghi chú', 'pickup_stop_id' => 'điểm đón', 'dropoff_stop_id' => 'điểm trả'];
            $p = $fresh['passenger'];
            $pick = collect($fresh['trip']['departureStops'] ?? [])->firstWhere('id', $p['pickupStopId']);
            $body = 'Nhà xe đã cập nhật '.implode(', ', array_map(fn ($k) => $labels[$k], $changes)).' của vé '.$id.'.'
                .' Hành khách: '.$p['fullName'].' · '.$p['phone'].'.'
                .($pick ? ' Điểm đón: '.$pick['name'].' lúc '.($pick['time'] ?? '').'.' : '');
            $accounts = app(\App\Services\CustomerAccounts::class);
            // Both the old and the new phone hear about a phone change.
            foreach (array_unique(array_filter([$before['phone'] ?? '', $p['phone']])) as $phone) {
                $accounts->notify($phone, $id, 'Vé của bạn đã được cập nhật', $body);
            }
            $notified = true;
        }
        $message = ! $changes && ! isset($b['booking_status']) ? 'Không có thay đổi nào' : 'Đã cập nhật đơn vé'.($notified ? ' và đã gửi thông báo cho khách' : '');

        return response()->json(['status' => 1, 'message' => $message, 'notified' => $notified, 'data' => $this->bridge->bookings(collect([$this->find($r, $id)]))->first()]);
    }

    /** Collect the remaining (or a given) amount into the ledger. */
    public function confirmPayment(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $row = $this->find($r, $id);
        $b = $r->validate(['method' => 'required|string', 'amount' => 'nullable|integer|min:1', 'reference_code' => 'nullable|string|max:100', 'note' => 'nullable|string|max:400']);
        $total = (int) ($this->ops->data($row)['totalAmount'] ?? 0);
        $due = $total - $this->ops->netPaid($id);
        abort_if($due <= 0, 409, 'Đơn này đã thu đủ tiền');
        $note = trim(($b['note'] ?? 'Thu tiền vé').(! empty($b['reference_code']) ? ' · Mã GD '.$b['reference_code'] : ''));
        $this->ops->ledger($row->tenant_id, ['kind' => 'collection', 'bookingId' => $id, 'amount' => (int) ($b['amount'] ?? $due),
            'method' => $b['method'] === 'cash' ? 'cash' : 'transfer', 'note' => $note], $u, null);
        $phone = $this->ops->data($row)['passenger']['phone'] ?? '';
        if ($phone) {
            app(\App\Services\CustomerAccounts::class)->notify($phone, $id, 'Nhà xe đã nhận tiền vé', 'Đã ghi nhận '.number_format((int) ($b['amount'] ?? $due), 0, ',', '.').'đ cho vé '.$id.'. Chúc bạn thượng lộ bình an!');
        }

        return response()->json(['status' => 1, 'message' => 'Đã ghi nhận thanh toán', 'data' => $this->bridge->bookings(collect([$this->find($r, $id)]))->first()]);
    }

    public function destroy(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $row = $this->find($r, $id);
        $this->ops->changeBooking($row->tenant_id, $id, ['action' => 'cancel'], $u);
        $phone = $this->ops->data($row)['passenger']['phone'] ?? '';
        if ($phone) {
            app(\App\Services\CustomerAccounts::class)->notify($phone, $id, 'Vé đã bị hủy', 'Nhà xe đã hủy vé '.$id.'. Nếu bạn đã trả tiền, nhà xe sẽ liên hệ để hoàn tiền.');
        }

        return response()->json(['status' => 1, 'message' => 'Đã hủy đơn vé '.$id.' và đã báo cho khách']);
    }
}
