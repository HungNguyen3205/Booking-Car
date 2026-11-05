<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomerNote;
use App\Models\TicketBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PassengerController extends Controller
{
    public function index(Request $request)
    {
        $search = trim($request->input('search', ''));

        $query = TicketBooking::query()
            ->select(
                'customer_phone',
                DB::raw('MAX(customer_name) as customer_name'),
                DB::raw('MAX(customer_email) as customer_email'),
                DB::raw('COUNT(id) as total_bookings'),
                DB::raw('SUM(seat_count) as total_tickets'),
                DB::raw('SUM(final_amount) as total_spent'),
                DB::raw('MAX(created_at) as last_booking_at')
            )
            ->groupBy('customer_phone');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('customer_phone', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $passengers = $query->orderBy('last_booking_at', 'desc')->paginate($request->input('per_page', 20));

        return response()->json([
            'status' => 1,
            'data' => $passengers,
        ]);
    }

    public function show($phone)
    {
        $bookings = TicketBooking::where('customer_phone', $phone)
            ->with(['partner:id,name,slug', 'trip.route'])
            ->orderBy('created_at', 'desc')
            ->get();

        $notes = CustomerNote::where('customer_phone', $phone)
            ->orderBy('created_at', 'desc')
            ->get();

        $passenger = [
            'phone' => $phone,
            'name' => $bookings->first() ? $bookings->first()->customer_name : 'Hành khách',
            'email' => $bookings->first() ? $bookings->first()->customer_email : null,
            'total_bookings' => $bookings->count(),
            'total_tickets' => $bookings->sum('seat_count'),
            'total_spent' => $bookings->where('payment_status', 'paid')->sum('final_amount'),
            'bookings' => $bookings,
            'notes' => $notes,
        ];

        return response()->json([
            'status' => 1,
            'data' => $passenger,
        ]);
    }

    public function addNote(Request $request, $phone)
    {
        $validated = $request->validate([
            'note' => 'required|string',
            'customer_name' => 'nullable|string',
            'admin_name' => 'nullable|string',
        ]);

        $note = CustomerNote::create([
            'customer_phone' => $phone,
            'customer_name' => $validated['customer_name'] ?? null,
            'note' => $validated['note'],
            'admin_name' => $validated['admin_name'] ?? 'Admin',
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Thêm ghi chú chăm sóc hành khách thành công!',
            'data' => $note,
        ]);
    }
}

