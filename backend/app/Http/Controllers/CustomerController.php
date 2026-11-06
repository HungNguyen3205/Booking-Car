<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Signed-in customers (login = phone): their tickets and notifications.
 * Everything is keyed by the account's own phone; nothing is taken from the client.
 */
class CustomerController extends Controller
{
    private function customer(Request $r): object
    {
        $u = $this->user($r, true);
        abort_unless($u->role === 'customer' && $u->phone, 403, 'Chỉ dành cho tài khoản khách');
        abort_if($u->must_change_password, 403, 'Vui lòng đổi mật khẩu tạm trước khi tiếp tục');

        return $u;
    }

    public function myBookings(Request $r)
    {
        $u = $this->customer($r);
        // Passenger phone lives in the booking JSON; narrow with LIKE, then verify exactly.
        $rows = DB::table('bookings')->where('data', 'like', '%'.$u->phone.'%')->orderByDesc('created_at')->limit(200)->get()
            ->filter(fn ($row) => ($this->ops->data($row)['passenger']['phone'] ?? '') === $u->phone);

        return ['items' => $rows->map(fn ($row) => $this->ops->booking($row))->values()];
    }

    public function notifications(Request $r)
    {
        $u = $this->customer($r);
        $items = DB::table('customer_notifications')->where('phone', $u->phone)->orderByDesc('created_at')->limit(50)->get()
            ->map(fn ($n) => ['id' => $n->id, 'bookingId' => $n->booking_id, 'title' => $n->title, 'body' => $n->body, 'read' => (bool) $n->read_at, 'createdAt' => $n->created_at]);

        return ['items' => $items, 'unread' => $items->where('read', false)->count()];
    }

    public function readNotifications(Request $r)
    {
        $u = $this->customer($r);
        DB::table('customer_notifications')->where('phone', $u->phone)->whereNull('read_at')->update(['read_at' => $this->ops->now()]);

        return ['ok' => true];
    }
}
