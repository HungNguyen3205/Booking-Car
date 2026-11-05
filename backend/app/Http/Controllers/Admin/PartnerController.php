<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BusTrip;
use App\Models\Partner;
use App\Models\TicketBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PartnerController extends Controller
{
    public function index(Request $request)
    {
        $query = Partner::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
            });
        }

        $partners = $query->orderBy('name', 'asc')->get();

        // Calculate metrics for each partner
        $partners->transform(function ($p) {
            $p->trips_count = BusTrip::where('partner_id', $p->id)->count();
            $p->tickets_sold = TicketBooking::where('partner_id', $p->id)
                ->where('booking_status', '!=', 'cancelled')
                ->sum('seat_count') ?: 0;
            $p->total_revenue = TicketBooking::where('partner_id', $p->id)
                ->where('payment_status', 'paid')
                ->sum('final_amount') ?: 0;
            return $p;
        });

        return response()->json([
            'status' => 1,
            'data' => $partners,
        ]);
    }

    public function show($id)
    {
        $partner = Partner::with(['domains', 'vehicles', 'routes.stops', 'drivers'])->findOrFail($id);

        return response()->json([
            'status' => 1,
            'data' => $partner,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'slug' => 'nullable|string|max:80|unique:partners,slug',
            'phone' => 'required|string|max:30',
            'email' => 'nullable|email|max:150',
            'address' => 'nullable|string|max:255',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'contract_number' => 'nullable|string|max:80',
            'bank_name' => 'nullable|string|max:100',
            'bank_account' => 'nullable|string|max:50',
            'bank_holder' => 'nullable|string|max:100',
            'branding' => 'nullable|array',
            'status' => 'nullable|string|in:active,suspended,pending',
        ]);

        $slug = !empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['name']);

        $partner = Partner::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'commission_rate' => (float) $validated['commission_rate'],
            'contract_number' => $validated['contract_number'] ?? ('HD-' . date('Y') . '/' . strtoupper(substr($slug, 0, 4))),
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account' => $validated['bank_account'] ?? null,
            'bank_holder' => $validated['bank_holder'] ?? null,
            'branding' => $validated['branding'] ?? [
                'primary_color' => '#1e3a8a',
                'hotline' => $validated['phone'],
                'description' => 'Đối tác vận chuyển hành khách cao cấp DANAVA Go',
            ],
            'status' => $validated['status'] ?? 'active',
        ]);

        AuditLog::create([
            'action' => 'partner.created',
            'target_type' => 'Partner',
            'target_id' => $partner->id,
            'target_label' => $partner->name,
            'new_values' => $partner->toArray(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Thêm đối tác nhà xe thành công!',
            'data' => $partner,
        ]);
    }

    public function update(Request $request, $id)
    {
        $partner = Partner::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:150',
            'phone' => 'sometimes|string|max:30',
            'email' => 'nullable|email|max:150',
            'address' => 'nullable|string|max:255',
            'commission_rate' => 'sometimes|numeric|min:0|max:100',
            'contract_number' => 'nullable|string|max:80',
            'bank_name' => 'nullable|string|max:100',
            'bank_account' => 'nullable|string|max:50',
            'bank_holder' => 'nullable|string|max:100',
            'branding' => 'nullable|array',
            'status' => 'sometimes|string|in:active,suspended,pending',
        ]);

        $oldValues = $partner->toArray();
        $partner->update($validated);

        AuditLog::create([
            'action' => 'partner.updated',
            'target_type' => 'Partner',
            'target_id' => $partner->id,
            'target_label' => $partner->name,
            'old_values' => $oldValues,
            'new_values' => $partner->fresh()->toArray(),
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Cập nhật thông tin đối tác thành công!',
            'data' => $partner,
        ]);
    }

    public function destroy($id)
    {
        $partner = Partner::findOrFail($id);
        $partner->update(['status' => 'suspended']);

        return response()->json([
            'status' => 1,
            'message' => 'Đã tạm ngưng đối tác ' . $partner->name,
        ]);
    }
}

