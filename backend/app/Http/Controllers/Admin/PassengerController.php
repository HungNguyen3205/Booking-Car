<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Studio "Hành khách": customers derived from live bookings, notes kept per operator. */
class PassengerController extends Controller
{
    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function grouped(Request $r)
    {
        return $this->bridge->bookings($this->bridge->bookingRows($this->bridge->scope($r)))
            ->filter(fn ($b) => $b['customer_phone'] !== '')
            ->groupBy('customer_phone');
    }

    public function index(Request $r)
    {
        $items = $this->grouped($r)->map(function ($list, $phone) {
            $live = $list->where('booking_status', '!=', 'cancelled');

            return [
                'customer_phone' => $phone, 'customer_name' => $list->first()['customer_name'], 'customer_email' => $list->firstWhere('customer_email', '!=', '')['customer_email'] ?? '',
                'total_bookings' => $list->count(), 'total_tickets' => $live->sum('seat_count'), 'total_spent' => $live->sum('paid_amount'),
                'last_booking_at' => $list->max('created_at'),
                'last_trip' => $list->sortByDesc('trip.depart_time')->first()['trip']['route']['name'] ?? '',
                'trips_taken' => $list->where('booking_status', 'checked_in')->count(),
            ];
        })->values();
        if ($r->filled('search')) {
            $s = mb_strtolower(trim($r->query('search')));
            $digits = preg_replace('/\D+/', '', $s);
            $items = $items->filter(fn ($p) => str_contains(mb_strtolower($p['customer_name']), $s) || str_contains(mb_strtolower($p['customer_email']), $s)
                || ($digits !== '' && str_contains($p['customer_phone'], $digits)));
        }

        return response()->json(['status' => 1, 'data' => $this->bridge->page($items->sortByDesc('last_booking_at')->values(), $r)]);
    }

    public function show(Request $r, string $phone)
    {
        $phone = $this->ops->phone($phone);
        $list = $this->grouped($r)->get($phone, collect());
        abort_if($list->isEmpty(), 404, 'Không tìm thấy hành khách');
        $scope = $this->bridge->scope($r);
        $notes = DB::table('customer_notes')->where('customer_phone', $phone)
            ->when($scope !== null, fn ($q) => $q->whereIn('partner_id', $scope))
            ->orderByDesc('created_at')->get();
        $live = $list->where('booking_status', '!=', 'cancelled');

        return response()->json(['status' => 1, 'data' => [
            'phone' => $phone, 'name' => $list->first()['customer_name'], 'email' => $list->firstWhere('customer_email', '!=', '')['customer_email'] ?? null,
            'total_bookings' => $list->count(), 'total_tickets' => $live->sum('seat_count'), 'total_spent' => $live->sum('paid_amount'),
            'bookings' => $list->values(), 'notes' => $notes,
        ]]);
    }

    public function addNote(Request $r, string $phone)
    {
        $u = $this->bridge->user($r);
        $b = $r->validate(['note' => 'required|string|max:1000', 'customer_name' => 'nullable|string|max:150']);
        $tid = $this->bridge->writeTenant($r, $this->bridge->isPlatform($u) ? ($r->input('partner_id') ?: $this->ownerOf($r, $phone)) : null);
        $id = DB::table('customer_notes')->insertGetId([
            'customer_phone' => $this->ops->phone($phone), 'customer_name' => $b['customer_name'] ?? null, 'note' => $b['note'],
            'admin_name' => $u->name, 'partner_id' => $tid, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['status' => 1, 'message' => 'Đã thêm ghi chú chăm sóc khách', 'data' => DB::table('customer_notes')->find($id)]);
    }

    /** Operator of the customer's most recent booking (platform notes default to it). */
    private function ownerOf(Request $r, string $phone): ?string
    {
        return $this->grouped($r)->get($this->ops->phone($phone), collect())->sortByDesc('created_at')->first()['partner_id'] ?? null;
    }
}
