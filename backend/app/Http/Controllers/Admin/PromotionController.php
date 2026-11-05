<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\Promotion;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index(Request $request)
    {
        $promotions = Promotion::with('partner:id,name,slug')->orderBy('created_at', 'desc')->get();
        $posts = Post::orderBy('created_at', 'desc')->limit(10)->get();

        return response()->json([
            'status' => 1,
            'data' => [
                'promotions' => $promotions,
                'posts' => $posts,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'partner_id' => 'nullable|exists:partners,id',
            'code' => 'required|string|max:50|unique:promotions,code',
            'title' => 'required|string|max:150',
            'discount_type' => 'required|string|in:fixed,percent',
            'discount_value' => 'required|numeric|min:1',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|numeric|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'nullable|boolean',
        ]);

        $promo = Promotion::create([
            'partner_id' => $validated['partner_id'] ?? null,
            'code' => strtoupper($validated['code']),
            'title' => $validated['title'],
            'discount_type' => $validated['discount_type'],
            'discount_value' => (int) $validated['discount_value'],
            'min_order_amount' => (int) ($validated['min_order_amount'] ?? 0),
            'max_discount' => !empty($validated['max_discount']) ? (int) $validated['max_discount'] : null,
            'usage_limit' => (int) ($validated['usage_limit'] ?? 100),
            'used_count' => 0,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'status' => 1,
            'message' => 'Tạo mã ưu đãi thành công!',
            'data' => $promo,
        ]);
    }

    public function update(Request $request, $id)
    {
        $promo = Promotion::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:150',
            'discount_type' => 'sometimes|string|in:fixed,percent',
            'discount_value' => 'sometimes|numeric|min:1',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'sometimes|numeric|min:1',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date',
            'is_active' => 'sometimes|boolean',
        ]);

        $promo->update($validated);

        return response()->json([
            'status' => 1,
            'message' => 'Cập nhật mã ưu đãi thành công!',
            'data' => $promo,
        ]);
    }

    public function destroy($id)
    {
        $promo = Promotion::findOrFail($id);
        $promo->delete();

        return response()->json([
            'status' => 1,
            'message' => 'Đã xóa mã ưu đãi!',
        ]);
    }
}

