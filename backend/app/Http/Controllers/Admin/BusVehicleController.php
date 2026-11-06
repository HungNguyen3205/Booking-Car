<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeatLayout;
use App\Services\OperatorService;
use App\Services\StudioBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Studio "Xe & sơ đồ ghế" on live vehicle records (the seat maps customers book).
 * Seat-layout templates stay in their own table as drawing aids, scoped per operator.
 */
class BusVehicleController extends Controller
{
    /** Studio category -> live category. Live supports sleeper | limousine | cabin. */
    private const CATEGORY = ['sleeper' => 'sleeper', 'limousine' => 'limousine', 'cabin' => 'cabin', 'seating' => 'limousine'];

    public function __construct(OperatorService $ops, private StudioBridge $bridge)
    {
        parent::__construct($ops);
    }

    private function rows(Request $r)
    {
        return $this->bridge->scoped(DB::table('records')->where('kind', 'vehicles'), $this->bridge->scope($r))->orderByDesc('created_at')->get()
            ->map(fn ($row) => $this->ops->record($row));
    }

    public function index(Request $r)
    {
        $items = $this->rows($r)->map(fn ($v) => $this->bridge->vehicle($v));
        if ($r->filled('status')) {
            $items = $items->where('status', $r->query('status'));
        }

        return response()->json(['status' => 1, 'data' => $items->values()]);
    }

    public function show(Request $r, string $id)
    {
        $v = $this->rows($r)->firstWhere('id', $id);
        abort_unless($v, 404, 'Không tìm thấy xe');

        return response()->json(['status' => 1, 'data' => $this->bridge->vehicle($v)]);
    }

    private function payload(array $b, ?array $old = null): array
    {
        $category = self::CATEGORY[$b['category'] ?? ''] ?? ($old['category'] ?? 'sleeper');
        $capacity = (int) ($b['capacity'] ?? $old['capacity']);
        $floors = (int) ($b['floor_count'] ?? $old['floors'] ?? ($category === 'limousine' ? 1 : 2));
        $keepSeats = $old && $old['capacity'] === $capacity && $old['category'] === $category && (int) $old['floors'] === $floors;

        return [
            'name' => $b['name'] ?? $old['name'], 'category' => $category, 'capacity' => $capacity, 'floors' => $floors,
            'plate' => $b['plate_number'] ?? $old['plate'],
            'inspectionDate' => array_key_exists('inspection_date', $b) ? (substr((string) $b['inspection_date'], 0, 10) ?: null) : (($old['inspectionDate'] ?? '') ?: null),
            'image' => $b['image_url'] ?? $old['image'] ?? '',
            'amenities' => $b['amenities'] ?? $old['amenities'] ?? ['Điều hòa', 'USB'],
            'description' => $b['description'] ?? $old['description'] ?? '',
            'maintenance' => array_key_exists('status', $b) ? $b['status'] !== 'active' : (bool) ($old['maintenance'] ?? false),
            'seatCodes' => $keepSeats ? $old['seatCodes'] : ($b['seat_codes'] ?? []),
            'seatMap' => $b['seat_map'] ?? null,
        ];
    }

    private function rules(bool $partial): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return [
            'name' => "$req|string|max:100", 'plate_number' => "$req|string|max:30",
            'category' => "$req|string|in:limousine,sleeper,cabin,seating", 'capacity' => "$req|integer|min:1|max:60",
            'floor_count' => 'nullable|integer|min:1|max:2', 'amenities' => 'nullable|array|max:20', 'amenities.*' => 'string|max:80',
            'image_url' => 'nullable|string|max:500', 'inspection_date' => 'nullable|date', 'description' => 'nullable|string|max:1500',
            'status' => 'nullable|string|in:active,maintenance,inactive', 'seat_codes' => 'nullable|array', 'seat_map' => 'nullable|array',
        ];
    }

    public function store(Request $r)
    {
        $u = $this->bridge->user($r);
        $b = $r->validate($this->rules(false));
        $tid = $this->bridge->writeTenant($r);
        $v = $this->ops->saveRecord($tid, 'vehicles', $this->payload($b), $u);

        return response()->json(['status' => 1, 'message' => 'Đã thêm xe '.$v['plate'], 'data' => $this->bridge->vehicle($v)]);
    }

    public function update(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $old = $this->rows($r)->firstWhere('id', $id);
        abort_unless($old, 404, 'Không tìm thấy xe');
        $b = $r->validate($this->rules(true));
        $v = $this->ops->saveRecord($old['tenantId'], 'vehicles', $this->payload($b, $old), $u, $id);

        return response()->json(['status' => 1, 'message' => 'Đã cập nhật xe', 'data' => $this->bridge->vehicle($v)]);
    }

    public function destroy(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $old = $this->rows($r)->firstWhere('id', $id);
        abort_unless($old, 404, 'Không tìm thấy xe');
        abort_if(DB::table('trips')->where('vehicle_id', $id)->exists(), 409, 'Xe đã có lịch chạy, không thể xoá. Hãy chuyển sang "Bảo dưỡng".');
        DB::table('records')->where(['id' => $id, 'tenant_id' => $old['tenantId']])->delete();
        $this->ops->audit($u, $old['tenantId'], 'vehicles.delete', $id);

        return response()->json(['status' => 1, 'message' => 'Đã xoá xe']);
    }

    /* Seat-layout templates (drawing aid), scoped per operator. */

    public function getSeatLayouts(Request $r)
    {
        $scope = $this->bridge->scope($r);
        $q = SeatLayout::query();
        if ($scope !== null) {
            $q->where(fn ($w) => $w->whereNull('partner_id')->orWhereIn('partner_id', $scope));
        }

        return response()->json(['status' => 1, 'data' => $q->orderBy('name')->get()]);
    }

    public function saveSeatLayout(Request $r)
    {
        $b = $r->validate([
            'id' => 'nullable|string', 'name' => 'required|string|max:100',
            'vehicle_type' => 'required|string|in:limousine,sleeper,seating,cabin', 'total_seats' => 'required|integer|min:1|max:60',
            'floors' => 'required|integer|min:1|max:2', 'rows' => 'required|integer|min:1|max:30', 'columns' => 'required|integer|min:1|max:10',
            'layout_matrix' => 'required|array',
        ]);
        $u = $this->bridge->user($r);
        $b['partner_id'] = $this->bridge->isPlatform($u) ? ($r->input('partner_id') ?: null) : $u->tenant_id;
        if ($b['partner_id']) {
            abort_unless(DB::table('tenants')->where('id', $b['partner_id'])->exists(), 422, 'Nhà xe không tồn tại');
            $this->bridge->ensurePartnerRow($b['partner_id']);
        }
        if (! empty($b['id'])) {
            $layout = SeatLayout::findOrFail($b['id']);
            abort_unless($this->bridge->isPlatform($u) || $layout->partner_id === $u->tenant_id, 403, 'Không sửa được sơ đồ của nhà xe khác');
            $layout->update($b);
        } else {
            $layout = SeatLayout::create($b);
        }

        return response()->json(['status' => 1, 'message' => 'Đã lưu sơ đồ ghế', 'data' => $layout]);
    }

    public function deleteSeatLayout(Request $r, string $id)
    {
        $u = $this->bridge->user($r);
        $layout = SeatLayout::findOrFail($id);
        abort_unless($this->bridge->isPlatform($u) || $layout->partner_id === $u->tenant_id, 403, 'Không xoá được sơ đồ của nhà xe khác');
        $layout->delete();

        return response()->json(['status' => 1, 'message' => 'Đã xoá sơ đồ ghế']);
    }
}
