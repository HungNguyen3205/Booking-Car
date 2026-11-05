<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Route;
use App\Models\RouteStop;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    public function index(Request $request)
    {
        $query = Route::with(['partner:id,name,slug', 'stops']);

        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('from_city', 'like', "%{$s}%")
                    ->orWhere('to_city', 'like', "%{$s}%");
            });
        }

        $routes = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'status' => 1,
            'data' => $routes,
        ]);
    }

    public function show($id)
    {
        $route = Route::with(['partner', 'stops'])->findOrFail($id);

        return response()->json([
            'status' => 1,
            'data' => $route,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'name' => 'required|string|max:150',
            'from_city' => 'required|string|max:80',
            'to_city' => 'required|string|max:80',
            'distance_km' => 'nullable|numeric|min:1',
            'duration_minutes' => 'required|numeric|min:10',
            'base_price' => 'required|numeric|min:0',
            'status' => 'nullable|string|in:active,inactive',
            'stops' => 'nullable|array',
            'stops.*.name' => 'required|string',
            'stops.*.address' => 'nullable|string',
            'stops.*.stop_type' => 'required|string|in:pickup,dropoff,both',
            'stops.*.time_offset_minutes' => 'nullable|numeric',
            'stops.*.extra_fee' => 'nullable|numeric',
        ]);

        $route = Route::create([
            'partner_id' => $validated['partner_id'],
            'name' => $validated['name'],
            'from_city' => $validated['from_city'],
            'to_city' => $validated['to_city'],
            'distance_km' => (int) ($validated['distance_km'] ?? 100),
            'duration_minutes' => (int) $validated['duration_minutes'],
            'base_price' => (int) $validated['base_price'],
            'status' => $validated['status'] ?? 'active',
        ]);

        if (!empty($validated['stops'])) {
            foreach ($validated['stops'] as $index => $stop) {
                RouteStop::create([
                    'route_id' => $route->id,
                    'name' => $stop['name'],
                    'address' => $stop['address'] ?? null,
                    'stop_type' => $stop['stop_type'] ?? 'pickup',
                    'time_offset_minutes' => (int) ($stop['time_offset_minutes'] ?? 0),
                    'extra_fee' => (int) ($stop['extra_fee'] ?? 0),
                    'sort_order' => $index,
                ]);
            }
        }

        AuditLog::create([
            'action' => 'route.created',
            'target_type' => 'Route',
            'target_id' => $route->id,
            'target_label' => $route->name,
            'new_values' => $route->toArray(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Tạo tuyến đường thành công!',
            'data' => $route->load('stops'),
        ]);
    }

    public function update(Request $request, $id)
    {
        $route = Route::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:150',
            'from_city' => 'sometimes|string|max:80',
            'to_city' => 'sometimes|string|max:80',
            'distance_km' => 'nullable|numeric|min:1',
            'duration_minutes' => 'sometimes|numeric|min:10',
            'base_price' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|string|in:active,inactive',
            'stops' => 'nullable|array',
        ]);

        $route->update($validated);

        if ($request->has('stops')) {
            RouteStop::where('route_id', $route->id)->delete();
            foreach ($request->input('stops', []) as $index => $stop) {
                RouteStop::create([
                    'route_id' => $route->id,
                    'name' => $stop['name'],
                    'address' => $stop['address'] ?? null,
                    'stop_type' => $stop['stop_type'] ?? 'pickup',
                    'time_offset_minutes' => (int) ($stop['time_offset_minutes'] ?? 0),
                    'extra_fee' => (int) ($stop['extra_fee'] ?? 0),
                    'sort_order' => $index,
                ]);
            }
        }

        return response()->json([
            'status' => 1,
            'message' => 'Cập nhật tuyến đường thành công!',
            'data' => $route->load('stops'),
        ]);
    }

    public function destroy($id)
    {
        $route = Route::findOrFail($id);
        $route->update(['status' => 'inactive']);

        return response()->json([
            'status' => 1,
            'message' => 'Đã dừng khai thác tuyến đường!',
        ]);
    }
}

