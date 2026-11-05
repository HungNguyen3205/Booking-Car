<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BusVehicle;
use App\Models\SeatLayout;
use Illuminate\Http\Request;

class BusVehicleController extends Controller
{
    public function index(Request $request)
    {
        $query = BusVehicle::with(['partner:id,name,slug', 'seatLayout']);

        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('plate_number', 'like', "%{$s}%");
            });
        }

        $vehicles = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 1,
            'data' => $vehicles,
        ]);
    }

    public function show($id)
    {
        $vehicle = BusVehicle::with(['partner', 'seatLayout'])->findOrFail($id);

        return response()->json([
            'status' => 1,
            'data' => $vehicle,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'seat_layout_id' => 'nullable|exists:seat_layouts,id',
            'name' => 'required|string|max:100',
            'plate_number' => 'required|string|max:30',
            'category' => 'required|string|in:limousine,sleeper,seating',
            'capacity' => 'required|numeric|min:1',
            'floor_count' => 'nullable|numeric|min:1|max:2',
            'amenities' => 'nullable|array',
            'image_url' => 'nullable|string',
            'inspection_date' => 'nullable|date',
            'status' => 'nullable|string|in:active,maintenance,inactive',
        ]);

        $vehicle = BusVehicle::create([
            'partner_id' => $validated['partner_id'],
            'seat_layout_id' => $validated['seat_layout_id'] ?? null,
            'name' => $validated['name'],
            'plate_number' => $validated['plate_number'],
            'category' => $validated['category'],
            'capacity' => (int) $validated['capacity'],
            'floor_count' => (int) ($validated['floor_count'] ?? 1),
            'amenities' => $validated['amenities'] ?? ['WiFi', 'Điều hòa', 'Sạc USB', 'Nước uống'],
            'image_url' => $validated['image_url'] ?? null,
            'inspection_date' => $validated['inspection_date'] ?? null,
            'status' => $validated['status'] ?? 'active',
        ]);

        AuditLog::create([
            'action' => 'vehicle.created',
            'target_type' => 'BusVehicle',
            'target_id' => $vehicle->id,
            'target_label' => $vehicle->plate_number . ' - ' . $vehicle->name,
            'new_values' => $vehicle->toArray(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Thêm phương tiện thành công!',
            'data' => $vehicle->load('seatLayout'),
        ]);
    }

    public function update(Request $request, $id)
    {
        $vehicle = BusVehicle::findOrFail($id);

        $validated = $request->validate([
            'seat_layout_id' => 'nullable|exists:seat_layouts,id',
            'name' => 'sometimes|string|max:100',
            'plate_number' => 'sometimes|string|max:30',
            'category' => 'sometimes|string|in:limousine,sleeper,seating',
            'capacity' => 'sometimes|numeric|min:1',
            'floor_count' => 'sometimes|numeric|min:1|max:2',
            'amenities' => 'nullable|array',
            'image_url' => 'nullable|string',
            'inspection_date' => 'nullable|date',
            'status' => 'sometimes|string|in:active,maintenance,inactive',
        ]);

        $vehicle->update($validated);

        return response()->json([
            'status' => 1,
            'message' => 'Cập nhật phương tiện thành công!',
            'data' => $vehicle->load('seatLayout'),
        ]);
    }

    public function destroy($id)
    {
        $vehicle = BusVehicle::findOrFail($id);
        $vehicle->update(['status' => 'inactive']);

        return response()->json([
            'status' => 1,
            'message' => 'Đã ngừng hoạt động xe ' . $vehicle->plate_number,
        ]);
    }

    // Seat Layout Matrix Endpoints
    public function getSeatLayouts(Request $request)
    {
        $query = SeatLayout::with('partner:id,name,slug');
        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }
        return response()->json([
            'status' => 1,
            'data' => $query->get(),
        ]);
    }

    public function saveSeatLayout(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|string',
            'partner_id' => 'nullable|exists:partners,id',
            'name' => 'required|string|max:100',
            'vehicle_type' => 'required|string|in:limousine,sleeper,seating',
            'total_seats' => 'required|numeric|min:1',
            'floors' => 'required|numeric|min:1|max:2',
            'rows' => 'required|numeric|min:1',
            'columns' => 'required|numeric|min:1',
            'layout_matrix' => 'required|array',
        ]);

        if (!empty($validated['id'])) {
            $layout = SeatLayout::findOrFail($validated['id']);
            $layout->update($validated);
        } else {
            $layout = SeatLayout::create($validated);
        }

        return response()->json([
            'status' => 1,
            'message' => 'Lưu sơ đồ ma trận ghế thành công!',
            'data' => $layout,
        ]);
    }

    public function deleteSeatLayout($id)
    {
        $layout = SeatLayout::findOrFail($id);
        $layout->delete();

        return response()->json([
            'status' => 1,
            'message' => 'Đã xóa sơ đồ ghế!',
        ]);
    }
}

