<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BookingTransaction;
use App\Models\BusTrip;
use App\Models\TicketBooking;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TicketBookingController extends Controller
{
    public function index(Request $request)
    {
        $query = TicketBooking::with([
            'partner:id,name,slug,phone',
            'trip.route',
            'trip.vehicle',
            'pickupStop',
            'dropoffStop',
        ]);

        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        if ($request->filled('status')) {
            $query->where('booking_status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('travel_date')) {
            $date = $request->travel_date;
            $query->whereHas('trip', function ($q) use ($date) {
                $q->whereDate('depart_time', $date);
            });
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('booking_code', 'like', "%{$s}%")
                    ->orWhere('customer_name', 'like', "%{$s}%")
                    ->orWhere('customer_phone', 'like', "%{$s}%");
            });
        }

        $bookings = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20));

        return response()->json([
            'status' => 1,
            'data' => $bookings,
        ]);
    }

    public function show($id)
    {
        $booking = TicketBooking::with([
            'partner',
            'trip.route',
            'trip.vehicle',
            'trip.driver',
            'pickupStop',
            'dropoffStop',
            'transactions',
        ])->findOrFail($id);

        return response()->json([
            'status' => 1,
            'data' => $booking,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'trip_id' => 'required|exists:bus_trips,id',
            'customer_name' => 'required|string|max:100',
            'customer_phone' => 'required|string|max:20',
            'customer_email' => 'nullable|email',
            'seats' => 'required|array|min:1',
            'pickup_stop_id' => 'nullable|exists:route_stops,id',
            'dropoff_stop_id' => 'nullable|exists:route_stops,id',
            'pickup_custom' => 'nullable|string',
            'dropoff_custom' => 'nullable|string',
            'total_amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|string|in:unpaid,paid,partially_paid,refunded',
            'booking_status' => 'nullable|string|in:pending,confirmed,checked_in,completed,cancelled',
            'payment_method' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $seats = $validated['seats'];
        $seatCount = count($seats);
        $totalAmount = (int) $validated['total_amount'];
        $discountAmount = (int) ($validated['discount_amount'] ?? 0);
        $finalAmount = max(0, $totalAmount - $discountAmount);

        // Generate clean unique ticket code
        $code = 'DN-' . strtoupper(Str::random(6));

        $booking = TicketBooking::create([
            'booking_code' => $code,
            'partner_id' => $validated['partner_id'],
            'trip_id' => $validated['trip_id'],
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'customer_email' => $validated['customer_email'] ?? null,
            'seats' => $seats,
            'seat_count' => $seatCount,
            'pickup_stop_id' => $validated['pickup_stop_id'] ?? null,
            'dropoff_stop_id' => $validated['dropoff_stop_id'] ?? null,
            'pickup_custom' => $validated['pickup_custom'] ?? null,
            'dropoff_custom' => $validated['dropoff_custom'] ?? null,
            'total_amount' => $totalAmount,
            'discount_amount' => $discountAmount,
            'final_amount' => $finalAmount,
            'payment_status' => $validated['payment_status'] ?? 'unpaid',
            'booking_status' => $validated['booking_status'] ?? 'confirmed',
            'payment_method' => $validated['payment_method'] ?? 'vnpay',
            'notes' => $validated['notes'] ?? null,
        ]);

        // If paid, create transaction record
        if ($booking->payment_status === 'paid') {
            BookingTransaction::create([
                'booking_id' => $booking->id,
                'partner_id' => $booking->partner_id,
                'type' => 'payment',
                'amount' => $finalAmount,
                'status' => 'completed',
                'method' => $booking->payment_method,
                'reference_code' => 'TXN-' . strtoupper(Str::random(8)),
                'transaction_time' => Carbon::now(),
                'note' => 'Thanh toán vé xe ' . $booking->booking_code,
            ]);
        }

        // Audit Log
        AuditLog::create([
            'action' => 'booking.created',
            'target_type' => 'TicketBooking',
            'target_id' => $booking->id,
            'target_label' => $booking->booking_code . ' (' . $booking->customer_name . ')',
            'new_values' => $booking->toArray(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Tạo đơn vé thành công!',
            'data' => $booking,
        ]);
    }

    public function update(Request $request, $id)
    {
        $booking = TicketBooking::findOrFail($id);

        $validated = $request->validate([
            'customer_name' => 'sometimes|string|max:100',
            'customer_phone' => 'sometimes|string|max:20',
            'customer_email' => 'nullable|email',
            'booking_status' => 'sometimes|string|in:pending,confirmed,checked_in,completed,cancelled',
            'payment_status' => 'sometimes|string|in:unpaid,paid,partially_paid,refunded',
            'payment_method' => 'sometimes|string',
            'notes' => 'nullable|string',
        ]);

        $oldValues = $booking->toArray();
        $booking->update($validated);

        AuditLog::create([
            'action' => 'booking.updated',
            'target_type' => 'TicketBooking',
            'target_id' => $booking->id,
            'target_label' => $booking->booking_code,
            'old_values' => $oldValues,
            'new_values' => $booking->fresh()->toArray(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Cập nhật đơn vé thành công!',
            'data' => $booking,
        ]);
    }

    public function confirmPayment(Request $request, $id)
    {
        $booking = TicketBooking::findOrFail($id);

        $validated = $request->validate([
            'method' => 'required|string',
            'reference_code' => 'nullable|string',
            'amount' => 'nullable|numeric|min:1',
            'note' => 'nullable|string',
        ]);

        $amount = (int) ($validated['amount'] ?? $booking->final_amount);
        $booking->update([
            'payment_status' => 'paid',
            'payment_method' => $validated['method'],
            'payment_ref' => $validated['reference_code'] ?? null,
        ]);

        BookingTransaction::create([
            'booking_id' => $booking->id,
            'partner_id' => $booking->partner_id,
            'type' => 'payment',
            'amount' => $amount,
            'status' => 'completed',
            'method' => $validated['method'],
            'reference_code' => $validated['reference_code'] ?? ('TXN-' . strtoupper(Str::random(8))),
            'transaction_time' => Carbon::now(),
            'note' => $validated['note'] ?? ('Xác nhận thanh toán đơn vé ' . $booking->booking_code),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Xác nhận thanh toán thành công!',
            'data' => $booking,
        ]);
    }

    public function destroy($id)
    {
        $booking = TicketBooking::findOrFail($id);
        $booking->update(['booking_status' => 'cancelled']);

        return response()->json([
            'status' => 1,
            'message' => 'Đã hủy đơn vé ' . $booking->booking_code,
        ]);
    }
}

