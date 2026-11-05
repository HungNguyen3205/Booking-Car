<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BusTrip;
use App\Models\TicketBooking;
use Illuminate\Http\Request;

class TripController extends Controller
{
    public function index(Request $request)
    {
        $query = BusTrip::with([
            'partner:id,name,slug',
            'route:id,name,from_city,to_city,duration_minutes',
            'vehicle:id,name,plate_number,category,capacity,floor_count',
            'driver:id,name,phone',
        ]);

        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        if ($request->filled('route_id')) {
            $query->where('route_id', $request->route_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('depart_time', $request->date);
        }

        $trips = $query->orderBy('depart_time', 'asc')->paginate($request->input('per_page', 20));

        // Append booked seat count for each trip
        $trips->getCollection()->transform(function ($trip) {
            $bookedSeatsCount = TicketBooking::where('trip_id', $trip->id)
                ->where('booking_status', '!=', 'cancelled')
                ->sum('seat_count') ?: 0;
            $capacity = $trip->vehicle ? $trip->vehicle->capacity : 0;
            $trip->booked_seats_count = (int) $bookedSeatsCount;
            $trip->available_seats_count = max(0, $capacity - $bookedSeatsCount);
            return $trip;
        });

        return response()->json([
            'status' => 1,
            'data' => $trips,
        ]);
    }

    public function show($id)
    {
        $trip = BusTrip::with([
            'partner',
            'route.stops',
            'vehicle.seatLayout',
            'driver',
            'bookings' => function ($q) {
                $q->where('booking_status', '!=', 'cancelled');
            },
        ])->findOrFail($id);

        $capacity = $trip->vehicle ? $trip->vehicle->capacity : 0;
        $bookedSeats = [];
        foreach ($trip->bookings as $b) {
            if (is_array($b->seats)) {
                $bookedSeats = array_merge($bookedSeats, $b->seats);
            }
        }

        $trip->booked_seats = array_values(array_unique($bookedSeats));
        $trip->booked_count = count($trip->booked_seats);
        $trip->available_count = max(0, $capacity - count($trip->booked_seats));

        return response()->json([
            'status' => 1,
            'data' => $trip,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'route_id' => 'required|exists:routes,id',
            'bus_vehicle_id' => 'required|exists:bus_vehicles,id',
            'driver_id' => 'nullable|exists:drivers,id',
            'depart_time' => 'required|date',
            'arrive_time' => 'required|date|after:depart_time',
            'base_price' => 'required|numeric|min:0',
            'status' => 'nullable|string|in:scheduled,running,completed,cancelled',
        ]);

        $trip = BusTrip::create([
            'partner_id' => $validated['partner_id'],
            'route_id' => $validated['route_id'],
            'bus_vehicle_id' => $validated['bus_vehicle_id'],
            'driver_id' => $validated['driver_id'] ?? null,
            'depart_time' => $validated['depart_time'],
            'arrive_time' => $validated['arrive_time'],
            'base_price' => (int) $validated['base_price'],
            'status' => $validated['status'] ?? 'scheduled',
            'seat_inventory' => [],
        ]);

        AuditLog::create([
            'action' => 'trip.created',
            'target_type' => 'BusTrip',
            'target_id' => $trip->id,
            'target_label' => 'Chuyến ' . $trip->depart_time,
            'new_values' => $trip->toArray(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Lên lịch chuyến chạy thành công!',
            'data' => $trip->load(['partner', 'route', 'vehicle', 'driver']),
        ]);
    }

    public function update(Request $request, $id)
    {
        $trip = BusTrip::findOrFail($id);

        $validated = $request->validate([
            'route_id' => 'sometimes|exists:routes,id',
            'bus_vehicle_id' => 'sometimes|exists:bus_vehicles,id',
            'driver_id' => 'nullable|exists:drivers,id',
            'depart_time' => 'sometimes|date',
            'arrive_time' => 'sometimes|date',
            'base_price' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|string|in:scheduled,running,completed,cancelled',
        ]);

        $oldValues = $trip->toArray();
        $trip->update($validated);

        AuditLog::create([
            'action' => 'trip.updated',
            'target_type' => 'BusTrip',
            'target_id' => $trip->id,
            'target_label' => 'Chuyến ' . $trip->id,
            'old_values' => $oldValues,
            'new_values' => $trip->fresh()->toArray(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Cập nhật chuyến chạy thành công!',
            'data' => $trip->load(['partner', 'route', 'vehicle', 'driver']),
        ]);
    }

    public function manifest($id)
    {
        $trip = BusTrip::with([
            'partner',
            'route.stops',
            'vehicle',
            'driver',
        ])->findOrFail($id);

        $bookings = TicketBooking::where('trip_id', $id)
            ->where('booking_status', '!=', 'cancelled')
            ->with(['pickupStop', 'dropoffStop'])
            ->orderBy('customer_name')
            ->get();

        return response()->json([
            'status' => 1,
            'data' => [
                'trip' => $trip,
                'passenger_manifest' => $bookings,
            ],
        ]);
    }

    public function destroy($id)
    {
        $trip = BusTrip::findOrFail($id);
        $trip->update(['status' => 'cancelled']);

        return response()->json([
            'status' => 1,
            'message' => 'Đã hủy chuyến chạy!',
        ]);
    }
}

