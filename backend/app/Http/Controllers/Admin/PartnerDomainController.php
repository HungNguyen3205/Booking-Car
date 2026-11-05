<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PartnerDomain;
use Illuminate\Http\Request;

class PartnerDomainController extends Controller
{
    public function index(Request $request)
    {
        $query = PartnerDomain::with('partner:id,name,slug,phone');

        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        $domains = $query->get();

        return response()->json([
            'status' => 1,
            'data' => $domains,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'partner_id' => 'required|exists:partners,id',
            'domain' => 'nullable|string|max:150',
            'subdomain' => 'nullable|string|max:100',
            'app_slug' => 'required|string|max:80',
            'settings' => 'nullable|array',
        ]);

        $domain = PartnerDomain::create([
            'partner_id' => $validated['partner_id'],
            'domain' => $validated['domain'] ?? null,
            'subdomain' => $validated['subdomain'] ?? ($validated['app_slug'] . '.danavago.com'),
            'app_slug' => $validated['app_slug'],
            'is_verified' => false,
            'ssl_status' => 'pending',
            'settings' => $validated['settings'] ?? [
                'theme_color' => '#1e3a8a',
                'show_operator_only' => true,
                'header_title' => 'Web App Đặt Vé Chính Hãng',
            ],
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Cấu hình App & Tên miền thành công!',
            'data' => $domain->load('partner'),
        ]);
    }

    public function update(Request $request, $id)
    {
        $domain = PartnerDomain::findOrFail($id);

        $validated = $request->validate([
            'domain' => 'nullable|string|max:150',
            'subdomain' => 'nullable|string|max:100',
            'app_slug' => 'sometimes|string|max:80',
            'settings' => 'nullable|array',
            'is_verified' => 'sometimes|boolean',
        ]);

        $domain->update($validated);

        return response()->json([
            'status' => 1,
            'message' => 'Cập nhật cấu hình thành công!',
            'data' => $domain->load('partner'),
        ]);
    }

    public function verify($id)
    {
        $domain = PartnerDomain::findOrFail($id);
        $domain->update([
            'is_verified' => true,
            'ssl_status' => 'active',
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Xác minh tên miền và kích hoạt SSL thành công!',
            'data' => $domain,
        ]);
    }
}

