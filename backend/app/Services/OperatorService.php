<?php

namespace App\Services;

use Carbon\CarbonImmutable as C;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

final class OperatorService
{
    public const KINDS = ['vehicles', 'routes', 'drivers', 'branches', 'agencies', 'promotions', 'shifts'];

    public function now(): string
    {
        return C::now('UTC')->format('Y-m-d\TH:i:s.v\Z');
    }

    public function day(): string
    {
        return C::now('Asia/Ho_Chi_Minh')->format('Y-m-d');
    }

    public function uuid(): string
    {
        return (string) Str::uuid();
    }

    public function json(mixed $v): string
    {
        return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    public function data(object $r): array
    {
        return json_decode($r->data, true, 512, JSON_THROW_ON_ERROR);
    }

    public function record(object $r): array
    {
        return [...$this->data($r), 'id' => $r->id, 'tenantId' => $r->tenant_id, 'createdAt' => $r->created_at];
    }

    public function validate(array $b, array $rules): array
    {
        return Validator::make($b, $rules)->validate();
    }

    public function need(bool $ok, int $code, string $msg): void
    {
        abort_unless($ok, $code, $msg);
    }

    public function phone(mixed $p): string
    {
        $p = preg_replace('/[ .-]/', '', (string) $p);
        $p = preg_replace('/^\+84/', '0', $p);
        $this->need((bool) preg_match('/^0[35789]\d{8}$/', $p), 422, 'Số điện thoại không hợp lệ');

        return $p;
    }

    public function audit(?object $u, ?string $tid, string $action, ?string $entity, array $detail = []): void
    {
        DB::table('audit')->insert(['id' => $this->uuid(), 'tenant_id' => $tid, 'actor_id' => $u?->id, 'action' => $action, 'entity_id' => $entity, 'detail' => $this->json($detail), 'created_at' => $this->now()]);
    }

    public function notify(string $tid, string $text): void
    {
        DB::table('notices')->insert(['id' => $this->uuid(), 'tenant_id' => $tid, 'title' => $text, 'created_at' => $this->now()]);
    }

    public function tenant(string $id): array
    {
        $r = DB::table('tenants')->where('id', $id)->first();
        abort_unless($r, 404, 'Nhà xe không tồn tại');

        return [...$this->data($r), 'id' => $r->id, 'name' => $r->name, 'slug' => $r->slug, 'status' => $r->status];
    }

    public function resource(string $tid, string $kind, string $id): array
    {
        $r = DB::table('records')->where(['tenant_id' => $tid, 'kind' => $kind, 'id' => $id])->first();
        abort_unless($r, 404, 'Không tìm thấy dữ liệu trong nhà xe này');

        return $this->record($r);
    }

    public function records(string $tid, string $kind): array
    {
        return DB::table('records')->where(['tenant_id' => $tid, 'kind' => $kind])->orderByDesc('created_at')->get()->map(fn ($r) => $this->record($r))->all();
    }

    public function createTenant(array $b, ?object $u): array
    {
        $this->validate($b, ['name' => 'required|string|max:150', 'slug' => 'required|string|max:50|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'commissionBps' => 'nullable|integer|min:0|max:5000']);
        $this->need(! in_array($b['slug'], ['admin', 'api', 'app', 'manage', 'www']), 422, 'Định danh đã được dành riêng');
        $id = $this->uuid();
        $d = ['phone' => $b['phone'] ?? '', 'email' => $b['email'] ?? '', 'address' => $b['address'] ?? '', 'description' => $b['description'] ?? '', 'color' => '#f5a066', 'logo' => '', 'hero' => '', 'autoPublish' => ($b['autoPublish'] ?? false) === true, 'commissionBps' => (int) ($b['commissionBps'] ?? 0), 'policies' => 'Đổi/hủy vé liên hệ nhà xe để được xác nhận.'];
        DB::table('tenants')->insert(['id' => $id, 'name' => $b['name'], 'slug' => $b['slug'], 'data' => $this->json($d), 'status' => 'active', 'created_at' => $this->now()]);
        $this->audit($u, $id, 'tenant.create', $id);

        return $this->tenant($id);
    }

    public function saveRecord(string $tid, string $kind, array $b, ?object $u, ?string $id = null): array
    {
        $this->need(in_array($kind, self::KINDS), 404, 'Danh mục không tồn tại');
        $this->validate($b, ['name' => 'required|string|max:150']);
        $d = ['name' => trim($b['name'])];
        $identifier = null;
        if ($kind === 'vehicles') {
            $this->validate($b, ['category' => 'required|in:sleeper,limousine,cabin', 'capacity' => 'required|integer|min:1|max:60', 'floors' => 'nullable|integer|min:1|max:2', 'plate' => 'required|string|max:30', 'inspectionDate' => 'nullable|date_format:Y-m-d', 'image' => 'nullable|string|max:500', 'amenities' => 'nullable|array|max:20', 'amenities.*' => 'string|max:80', 'seatCodes' => 'nullable|array', 'seatCodes.*' => 'required|string|regex:/^[A-Z0-9-]{1,8}$/|distinct']);
            $capacity = (int) $b['capacity'];
            $floors = $b['category'] === 'limousine' ? 1 : (int) (($b['floors'] ?? 2) ?: 2);
            $codes = $b['seatCodes'] ?? [];
            $this->need(! $codes || count($codes) === $capacity, 422, 'Mã ghế phải đủ số chỗ và duy nhất');
            $per = (int) ceil($capacity / $floors);
            $image = $b['image'] ?? '';
            $this->need(! $image || preg_match('~^/(assets/[\w/.-]+|uploads/[\w.-]+)$~', $image) || (filter_var($image, FILTER_VALIDATE_URL) && str_starts_with($image, 'https://')), 422, 'Ảnh phải là URL HTTPS hoặc ảnh đã tải lên');
            $d += ['category' => $b['category'], 'capacity' => $capacity, 'floors' => $floors, 'plate' => strtoupper(trim($b['plate'])), 'image' => $image, 'amenities' => $b['amenities'] ?? ['Điều hòa', 'USB'], 'description' => mb_substr($b['description'] ?? '', 0, 1500), 'seatCodes' => $codes ?: array_map(fn ($i) => ($i < $per ? 'A' : 'B').($i % $per + 1), range(0, $capacity - 1)), 'maintenance' => (bool) ($b['maintenance'] ?? false), 'inspectionDate' => $b['inspectionDate'] ?? ''];
            $identifier = $d['plate'];
        } elseif ($kind === 'routes') {
            $this->validate($b, ['from' => 'required|string|max:100|different:to', 'to' => 'required|string|max:100', 'durationMinutes' => 'required|integer|min:10|max:2880', 'pickups' => 'required|array|min:1|max:30', 'dropoffs' => 'required|array|min:1|max:30']);
            $d += ['from' => $b['from'], 'to' => $b['to'], 'durationMinutes' => (int) $b['durationMinutes']];
            foreach (['pickups', 'dropoffs'] as $key) {
                $d[$key] = [];
                foreach ($b[$key] as $i => $stop) {
                    $this->validate($stop, ['name' => 'required|string|max:150', 'address' => 'required|string|max:300', 'offset' => 'nullable|integer|min:0|max:'.$d['durationMinutes']]);
                    $d[$key][] = ['id' => $stop['id'] ?? $key.'-'.$i, 'name' => $stop['name'], 'address' => $stop['address'], 'offset' => (int) ($stop['offset'] ?? 0)];
                }$this->need(count(array_unique(array_column($d[$key], 'id'))) === count($d[$key]), 422, 'Mã điểm dừng phải duy nhất');
            }
        } elseif ($kind === 'drivers') {
            $this->validate($b, ['license' => 'required|string|max:30', 'licenseExpiry' => 'nullable|date_format:Y-m-d']);
            $d += ['phone' => $this->phone($b['phone'] ?? ''), 'license' => $b['license'], 'licenseExpiry' => $b['licenseExpiry'] ?? '', 'active' => ($b['active'] ?? true) !== false];
        } elseif ($kind === 'branches') {
            $this->validate($b, ['address' => 'required|string|max:300']);
            $d += ['address' => $b['address'], 'phone' => $this->phone($b['phone'] ?? '')];
        } elseif ($kind === 'agencies') {
            $this->validate($b, ['commissionBps' => 'nullable|integer|min:0|max:5000', 'creditLimit' => 'nullable|integer|min:0|max:10000000000']);
            $d += ['phone' => $this->phone($b['phone'] ?? ''), 'commissionBps' => (int) ($b['commissionBps'] ?? 0), 'creditLimit' => (int) ($b['creditLimit'] ?? 0), 'active' => ($b['active'] ?? true) !== false];
        } elseif ($kind === 'promotions') {
            $this->validate($b, ['code' => 'required|string|regex:/^[A-Za-z0-9_-]{3,30}$/', 'discountType' => 'required|in:fixed,percent', 'value' => 'required|integer|min:1|max:'.(($b['discountType'] ?? '') === 'percent' ? 100 : 100000000), 'starts' => 'required|date_format:Y-m-d', 'ends' => 'required|date_format:Y-m-d|after_or_equal:starts', 'limit' => 'nullable|integer|min:1|max:100000']);
            if (! empty($b['routeId'])) {
                $this->resource($tid, 'routes', $b['routeId']);
            }$d += ['code' => strtoupper($b['code']), 'discountType' => $b['discountType'], 'value' => (int) $b['value'], 'starts' => $b['starts'], 'ends' => $b['ends'], 'limit' => (int) ($b['limit'] ?? 100), 'routeId' => $b['routeId'] ?? '', 'active' => ($b['active'] ?? true) !== false];
            $identifier = $d['code'];
        } elseif ($kind === 'shifts') {
            $this->resource($tid, 'drivers', $b['driverId'] ?? '');
            $this->validate($b, ['date' => 'required|date_format:Y-m-d', 'allowance' => 'nullable|integer|min:0|max:100000000']);
            $d += ['driverId' => $b['driverId'], 'date' => $b['date'], 'allowance' => (int) ($b['allowance'] ?? 0), 'checkedIn' => (bool) ($b['checkedIn'] ?? false), 'note' => mb_substr($b['note'] ?? '', 0, 500)];
        }

        return DB::transaction(function () use ($tid, $kind, $u, $id, $d, $identifier) {
            DB::table('tenants')->where('id', $tid)->lockForUpdate()->first();
            if ($id) {
                $old = $this->resource($tid, $kind, $id);
                if ($kind === 'vehicles') {
                    $active = DB::table('trips')->where(['tenant_id' => $tid, 'vehicle_id' => $id])->whereNotIn('status', ['cancelled', 'completed'])->where('end_at', '>', $this->now())->exists();
                    $changed = false;
                    foreach (['category', 'capacity', 'floors', 'plate', 'seatCodes'] as $k) {
                        if ($old[$k] !== $d[$k]) {
                            $changed = true;
                        }
                    }$this->need(! $active || ! $changed, 409, 'Xe có lịch chạy: không đổi biển số/sơ đồ ghế');
                    if ($d['maintenance']) {
                        $this->need(! DB::table('trips')->where(['vehicle_id' => $id, 'status' => 'published'])->where('end_at', '>', $this->now())->exists(), 409, 'Đóng bán trước khi bảo dưỡng');
                    }
                }
                DB::table('records')->where(['id' => $id, 'tenant_id' => $tid])->update(['data' => $this->json($d), 'identifier' => $identifier]);
            } else {
                $id = $this->uuid();
                DB::table('records')->insert(['id' => $id, 'tenant_id' => $tid, 'kind' => $kind, 'identifier' => $identifier, 'data' => $this->json($d), 'created_at' => $this->now()]);
            }
            $this->audit($u, $tid, $kind.'.save', $id);

            return $this->resource($tid, $kind, $id);
        }, 3);
    }

    public function tripRow(string $tid, string $id): object
    {
        $r = DB::table('trips')->where(['tenant_id' => $tid, 'id' => $id])->first();
        abort_unless($r, 404, 'Chuyến không thuộc nhà xe này');

        return $r;
    }

    public function expire(): void
    {
        $expired = DB::table('holds')->where('expires', '<=', (int) (microtime(true) * 1000))->pluck('id');
        if ($expired->isNotEmpty()) {
            DB::table('inventory')->whereIn('hold_id', $expired)->delete();
            DB::table('holds')->whereIn('id', $expired)->delete();
        }
    }

    public function trip(object $r): array
    {
        $this->expire();
        $d = $this->data($r);
        $v = $d['vehicle'];
        $live = $this->resource($r->tenant_id, 'vehicles', $r->vehicle_id);
        foreach (['image', 'name', 'amenities', 'description'] as $k) {
            $v[$k] = $live[$k];
        }$route = $d['route'];
        $tenant = $this->tenant($r->tenant_id);
        $occupied = DB::table('inventory')->where('trip_id', $r->id)->pluck('seat')->all();
        $blocked = $d['blockedSeats'] ?? [];
        $per = (int) ceil($v['capacity'] / $v['floors']);
        $seats = [];
        foreach ($v['seatCodes'] as $i => $code) {
            $seats[] = ['id' => $r->id.'-'.$code, 'code' => $code, 'floor' => $i < $per ? 1 : 2, 'row' => (int) floor(($i % $per) / 3) + 1, 'col' => ($i % $per) % 3 + 1, 'type' => ['limousine' => 'seat', 'cabin' => 'cabin', 'sleeper' => 'sleeper'][$v['category']], 'status' => in_array($code, $blocked) ? 'disabled' : (in_array($code, $occupied) ? 'booked' : 'available'), 'price' => $d['price']];
        }
        $start = C::parse($r->depart_at)->setTimezone('Asia/Ho_Chi_Minh');
        $end = C::parse($r->end_at)->setTimezone('Asia/Ho_Chi_Minh');
        $stop = fn ($s) => ['id' => $s['id'], 'name' => $s['name'], 'address' => $s['address'], 'time' => $start->addMinutes($s['offset'])->format('H:i')];

        return ['id' => $r->id, 'tenantId' => $r->tenant_id, 'code' => $d['code'], 'operator' => $tenant['name'], 'vehicle' => ['id' => $r->vehicle_id, 'name' => $v['name'], 'category' => $v['category'], 'categoryLabel' => ['sleeper' => 'Giường nằm', 'limousine' => 'Limousine', 'cabin' => 'Cabin VIP'][$v['category']], 'seatsTotal' => $v['capacity'], 'floors' => $v['floors'], 'image' => $v['image'] ?: '/assets/images/bus_limousine_vip.png', 'amenities' => $v['amenities'], 'description' => $v['description'], 'rating' => 0], 'from' => $route['from'], 'to' => $route['to'], 'departureTime' => $start->format('H:i'), 'arrivalTime' => $end->format('H:i'), 'duration' => intdiv($route['durationMinutes'], 60).'h'.($route['durationMinutes'] % 60).'m', 'nextDay' => $start->format('Y-m-d') !== $end->format('Y-m-d'), 'departureLocation' => $route['pickups'][0], 'arrivalLocation' => $route['dropoffs'][0], 'price' => $d['price'], 'availableSeatsCount' => count(array_filter($seats, fn ($s) => $s['status'] === 'available')), 'departureStops' => array_map($stop, $route['pickups']), 'dropoffStops' => array_map($stop, $route['dropoffs']), 'seats' => $seats, 'date' => $d['date'], 'status' => $r->status, 'driverId' => $r->driver_id, 'branchId' => $d['branchId'] ?? '', 'vehicleId' => $r->vehicle_id, 'routeId' => $r->route_id, 'departAt' => $r->depart_at, 'endAt' => $r->end_at, 'blockedSeats' => $blocked, 'plate' => $v['plate']];
    }

    public function saveTrip(string $tid, array $b, ?object $u, ?string $id = null): array
    {
        $this->validate($b, ['date' => 'required|date_format:Y-m-d|after_or_equal:'.$this->day(), 'time' => 'required|date_format:H:i', 'price' => 'required|integer|min:1000|max:100000000', 'code' => 'nullable|string|max:40', 'blockedSeats' => 'nullable|array']);
        $v = $this->resource($tid, 'vehicles', $b['vehicleId'] ?? '');
        $route = $this->resource($tid, 'routes', $b['routeId'] ?? '');
        $start = C::parse($b['date'].' '.$b['time'], 'Asia/Ho_Chi_Minh')->utc();
        $end = $start->addMinutes($route['durationMinutes']);
        $this->need($start->isFuture(), 422, 'Giờ khởi hành đã qua');
        $this->need(! $v['maintenance'] && (! $v['inspectionDate'] || $v['inspectionDate'] >= $b['date']), 422, 'Xe bảo dưỡng hoặc hết đăng kiểm');
        if (! empty($b['driverId'])) {
            $driver = $this->resource($tid, 'drivers', $b['driverId']);
            $this->need($driver['active'] && (! $driver['licenseExpiry'] || $driver['licenseExpiry'] >= $b['date']), 422, 'Tài xế/giấy phép không khả dụng');
        }
        if (! empty($b['branchId'])) {
            $this->resource($tid, 'branches', $b['branchId']);
        }$blocked = $b['blockedSeats'] ?? [];
        $this->need(! array_diff($blocked, $v['seatCodes']), 422, 'Ghế khóa không tồn tại');

        return DB::transaction(function () use ($tid, $b, $u, $id, $v, $route, $start, $end, $blocked) {
            DB::table('tenants')->where('id', $tid)->lockForUpdate()->first();
            $this->expire();
            if ($id) {
                $old = $this->tripRow($tid, $id);
                $this->need(in_array($old->status, ['draft', 'pending', 'closed']), 409, 'Đóng bán trước khi sửa');
                $this->need(! DB::table('bookings')->where('trip_id', $id)->where('status', '!=', 'cancelled')->exists() && ! DB::table('holds')->where('trip_id', $id)->exists(), 409, 'Chuyến có vé hoặc giữ ghế');
            }
            $startStr = $start->format('Y-m-d\TH:i:s.v\Z');
            $endStr = $end->format('Y-m-d\TH:i:s.v\Z');
            $conflict = DB::table('trips')->where('tenant_id', $tid)->where('id', '!=', $id ?? '')->whereNotIn('status', ['cancelled', 'completed'])->where('depart_at', '<', $endStr)->where('end_at', '>', $startStr)->where(function ($q) use ($b) {
                $q->where('vehicle_id', $b['vehicleId']);
                if (! empty($b['driverId'])) {
                    $q->orWhere('driver_id', $b['driverId']);
                }
            })->exists();
            $this->need(! $conflict, 409, 'Xe hoặc tài xế bị trùng lịch chạy');
            $rid = $id ?? $this->uuid();
            $data = ['code' => ! empty($b['code']) ? $b['code'] : 'DG-'.strtoupper(substr($rid, 0, 6)), 'date' => $b['date'], 'price' => (int) $b['price'], 'vehicle' => $v, 'route' => $route, 'branchId' => $b['branchId'] ?? '', 'blockedSeats' => $blocked];
            $row = ['vehicle_id' => $v['id'], 'driver_id' => ($b['driverId'] ?? '') ?: null, 'route_id' => $route['id'], 'depart_at' => $startStr, 'end_at' => $endStr, 'data' => $this->json($data)];
            if ($id) {
                DB::table('trips')->where('id', $id)->update($row);
            } else {
                DB::table('trips')->insert($row + ['id' => $rid, 'tenant_id' => $tid, 'status' => 'draft', 'created_at' => $this->now()]);
            }$this->audit($u, $tid, 'trips.save', $rid);

            return $this->trip($this->tripRow($tid, $rid));
        }, 3);
    }

    public function netPaid(string $id): int
    {
        return (int) DB::table('ledger')->where('booking_id', $id)->selectRaw("coalesce(sum(CASE WHEN kind='collection' THEN amount WHEN kind='refund' THEN -amount ELSE 0 END),0) as total")->value('total');
    }

    public function cancel(object $booking): void
    {
        DB::table('bookings')->where('id', $booking->id)->update(['status' => 'cancelled', 'payment_status' => $this->netPaid($booking->id) > 0 ? 'refund_due' : $booking->payment_status]);
        DB::table('inventory')->where('booking_id', $booking->id)->delete();
    }

    public function tripStatus(string $tid, string $id, string $status, object $u): array
    {
        $this->need(in_array($status, ['draft', 'pending', 'published', 'closed', 'cancelled', 'completed']), 422, 'Trạng thái không hợp lệ');

        return DB::transaction(function () use ($tid, $id, $status, $u) {
            $r = $this->tripRow($tid, $id);
            DB::table('trips')->where('id', $id)->lockForUpdate()->first();
            $this->need(! in_array($r->status, ['cancelled', 'completed']), 409, 'Chuyến đã kết thúc');
            if ($status === 'published') {
                $this->need($u->role === 'platform' || $this->tenant($tid)['autoPublish'] === true, 403, 'Chuyến cần nền tảng duyệt');
                $this->need($r->depart_at > $this->now(), 422, 'Chuyến đã khởi hành');
                $v = $this->resource($tid, 'vehicles', $r->vehicle_id);
                $date = $this->data($r)['date'];
                $this->need(! $v['maintenance'] && (! $v['inspectionDate'] || $v['inspectionDate'] >= $date), 422, 'Xe không khả dụng');
                if ($r->driver_id) {
                    $d = $this->resource($tid, 'drivers', $r->driver_id);
                    $this->need($d['active'] && (! $d['licenseExpiry'] || $d['licenseExpiry'] >= $date), 422, 'Tài xế không khả dụng');
                }
            }
            if ($status === 'completed') {
                $this->need($r->end_at <= $this->now(), 422, 'Chưa tới giờ kết thúc');
            }if ($status === 'cancelled') {
                foreach (DB::table('bookings')->where('trip_id', $id)->where('status', '!=', 'cancelled')->get() as $booking) {
                    $this->cancel($booking);
                }DB::table('inventory')->where('trip_id', $id)->delete();
                DB::table('holds')->where('trip_id', $id)->delete();
                $this->notify($tid, 'Chuyến bị hủy: kiểm tra khách cần thông báo và tiền cần hoàn.');
            }
            DB::table('trips')->where('id', $id)->update(['status' => $status]);
            $this->audit($u, $tid, 'trips.status', $id, ['status' => $status]);

            return $this->trip($this->tripRow($tid, $id));
        }, 3);
    }

    public function seats(object $r, array $codes): array
    {
        $this->need(count($codes) > 0 && count($codes) <= 5 && count(array_unique($codes)) === count($codes), 422, 'Chọn 1–5 ghế khác nhau');
        $trip = $this->trip($r);
        $available = array_column(array_filter($trip['seats'], fn ($s) => $s['status'] === 'available'), 'code');
        $this->need(! array_diff($codes, $available), 409, 'Ghế vừa được giữ/đặt hoặc không khả dụng');

        return $trip;
    }

    public function hold(string $id, array $codes, string $token): array
    {
        return DB::transaction(function () use ($id, $codes, $token) {
            $this->expire();
            $r = DB::table('trips')->where('id', $id)->lockForUpdate()->first();
            $this->need($r && $r->status === 'published' && $r->depart_at > $this->now() && $this->tenant($r->tenant_id)['status'] === 'active', 404, 'Chuyến chưa mở bán hoặc đã khởi hành');
            $this->need(DB::table('holds')->where('token', hash('sha256', $token))->count() < 2, 429, 'Bạn đang giữ ghế ở hai chuyến');
            $this->need(! $this->resource($r->tenant_id, 'vehicles', $r->vehicle_id)['maintenance'], 409, 'Xe đang bảo dưỡng');
            $this->seats($r, $codes);
            $hid = $this->uuid();
            $expires = (int) (microtime(true) * 1000) + 480000;
            DB::table('holds')->insert(['id' => $hid, 'tenant_id' => $r->tenant_id, 'trip_id' => $id, 'token' => hash('sha256', $token), 'expires' => $expires, 'data' => $this->json($codes)]);
            foreach ($codes as $code) {
                DB::table('inventory')->insert(['trip_id' => $id, 'seat' => $code, 'hold_id' => $hid]);
            }

            return ['id' => $hid, 'expires' => $expires];
        }, 3);
    }

    public function booking(object $r): array
    {
        $d = $this->data($r);
        unset($d['receiptToken']);

        return [...$d, 'id' => $r->id, 'tenantId' => $r->tenant_id, 'tripId' => $r->trip_id, 'status' => $r->status, 'paymentStatus' => $r->payment_status, 'source' => $r->source, 'createdAt' => $r->created_at];
    }

    public function reserve(array $b, ?object $u, ?string $tid, string $token, string $key): array
    {
        $this->need((bool) preg_match('/^[\w-]{10,100}$/', $key), 422, 'Cần khóa chống gửi trùng');

        return DB::transaction(function () use ($b, $u, $tid, $token, $key) {
            $this->expire();
            $cached = DB::table('idempotency')->where('key', hash('sha256', $key.$token))->first();
            if ($cached) {
                $old = $this->booking(DB::table('bookings')->where('id', $cached->booking_id)->first());
                $this->need((! $tid || $old['tenantId'] === $tid) && $old['tripId'] === ($b['tripId'] ?? '') && $old['selectedSeats'] === ($b['seats'] ?? []) && $old['passenger']['phone'] === $this->phone($b['passenger']['phone'] ?? ''), 409, 'Khóa đặt vé đã dùng cho yêu cầu khác');

                return $old;
            }
            $this->validate($b, ['tripId' => 'required|string', 'seats' => 'required|array|min:1|max:5', 'seats.*' => 'required|string|distinct', 'passenger.fullName' => 'required|string|max:100', 'passenger.email' => 'nullable|email|max:200', 'passenger.pickupStopId' => 'required|string|max:80', 'passenger.dropoffStopId' => 'required|string|max:80', 'passenger.agreedTerms' => 'required|accepted']);
            $r = DB::table('trips')->where('id', $b['tripId'])->lockForUpdate()->first();
            $this->need($r && (! $tid || $r->tenant_id === $tid), 404, 'Chuyến không thuộc nhà xe này');
            $this->need($r->status === 'published' && $r->depart_at > $this->now() && $this->tenant($r->tenant_id)['status'] === 'active', 409, 'Chuyến đã đóng bán');
            if (! empty($b['holdId'])) {
                $hold = DB::table('holds')->where(['id' => $b['holdId'], 'trip_id' => $r->id, 'token' => hash('sha256', $token)])->where('expires', '>', (int) (microtime(true) * 1000))->first();
                $this->need((bool) $hold, 409, 'Thời gian giữ ghế đã hết');
                $held = $this->data($hold);
                $this->need(count($held) === count($b['seats']) && ! array_diff($held, $b['seats']), 422, 'Ghế khác lượt giữ chỗ');
                $trip = $this->trip($r);
            } else {
                $this->need((bool) $u, 422, 'Vui lòng giữ ghế trước');
                $trip = $this->seats($r, $b['seats']);
            }
            $p = $b['passenger'];
            $p = ['fullName' => trim($p['fullName']), 'phone' => $this->phone($p['phone'] ?? ''), 'email' => $p['email'] ?? '', 'pickupStopId' => $p['pickupStopId'], 'dropoffStopId' => $p['dropoffStopId'], 'note' => mb_substr($p['note'] ?? '', 0, 1000), 'agreedTerms' => true];
            $route = $this->data($r)['route'];
            $pickup = collect($route['pickups'])->firstWhere('id', $p['pickupStopId']);
            $dropoff = collect($route['dropoffs'])->firstWhere('id', $p['dropoffStopId']);
            $this->need($pickup && $dropoff, 422, 'Điểm đón/trả không thuộc chuyến');
            $this->need($dropoff['offset'] > $pickup['offset'], 422, 'Điểm trả phải sau điểm đón');
            $amount = count($b['seats']) * $trip['price'];
            $discount = 0;
            $promo = '';
            if (! empty($b['promoCode'])) {
                $promotion = collect($this->records($r->tenant_id, 'promotions'))->firstWhere('code', strtoupper($b['promoCode']));
                $this->need($promotion && $promotion['active'] && $promotion['starts'] <= $this->day() && $promotion['ends'] >= $this->day() && (! $promotion['routeId'] || $promotion['routeId'] === $r->route_id), 422, 'Ưu đãi không áp dụng');
                $used = DB::table('bookings')->where('tenant_id', $r->tenant_id)->where('status', '!=', 'cancelled')->get()->filter(fn ($x) => ($this->data($x)['promoCode'] ?? '') === $promotion['code'])->count();
                $this->need($used < $promotion['limit'], 409, 'Ưu đãi hết lượt');
                $discount = min($amount, $promotion['discountType'] === 'percent' ? (int) floor($amount * $promotion['value'] / 100) : $promotion['value']);
                $promo = $promotion['code'];
            }
            $agencyId = $b['agencyId'] ?? '';
            $agencyRate = 0;
            if ($agencyId) {
                $this->need((bool) $u, 403, 'Đại lý chỉ được gán từ quầy');
                $agency = $this->resource($r->tenant_id, 'agencies', $agencyId);
                $this->need($agency['active'], 422, 'Đại lý tạm ngưng');
                $debt = DB::table('bookings')->where('tenant_id', $r->tenant_id)->where('status', '!=', 'cancelled')->get()->sum(function ($x) use ($agencyId) {
                    $d = $this->data($x);

                    return ($d['agencyId'] ?? '') === $agencyId ? $d['totalAmount'] - $this->netPaid($x->id) : 0;
                });
                $this->need($debt + $amount - $discount <= $agency['creditLimit'], 409, 'Vượt hạn mức công nợ đại lý');
                $agencyRate = $agency['commissionBps'];
            }
            $id = 'DG'.strtoupper(base_convert((string) (int) (microtime(true) * 1000), 10, 36)).strtoupper(Str::random(8));
            $data = ['trip' => $trip, 'date' => $trip['date'], 'selectedSeats' => $b['seats'], 'passenger' => $p, 'totalAmount' => $amount - $discount, 'discount' => $discount, 'promoCode' => $promo, 'agencyId' => $agencyId, 'agencyCommissionBps' => $agencyRate, 'platformCommissionBps' => $this->tenant($r->tenant_id)['commissionBps'], 'paymentMethod' => 'cash', 'checkedInAt' => null];
            DB::table('bookings')->insert(['id' => $id, 'tenant_id' => $r->tenant_id, 'trip_id' => $r->id, 'status' => 'confirmed', 'payment_status' => $amount - $discount === 0 ? 'paid' : 'unpaid', 'source' => $u ? 'counter' : 'online', 'data' => $this->json($data), 'created_at' => $this->now()]);
            if (! empty($b['holdId'])) {
                DB::table('inventory')->where('hold_id', $b['holdId'])->update(['hold_id' => null, 'booking_id' => $id]);
                DB::table('holds')->where('id', $b['holdId'])->delete();
            } else {
                foreach ($b['seats'] as $code) {
                    DB::table('inventory')->insert(['trip_id' => $r->id, 'seat' => $code, 'booking_id' => $id]);
                }
            }DB::table('idempotency')->insert(['key' => hash('sha256', $key.$token), 'booking_id' => $id]);
            $this->audit($u, $r->tenant_id, 'bookings.create', $id, ['source' => $u ? 'counter' : 'online']);
            $this->notify($r->tenant_id, 'Có đơn vé mới '.$id);

            return $this->booking(DB::table('bookings')->where('id', $id)->first());
        }, 3);
    }

    public function changeBooking(string $tid, string $id, array $b, object $u): array
    {
        return DB::transaction(function () use ($tid, $id, $b, $u) {
            $r = DB::table('bookings')->where(['tenant_id' => $tid, 'id' => $id])->lockForUpdate()->first();
            $this->need((bool) $r, 404, 'Không tìm thấy đơn');
            $this->need($r->status !== 'cancelled', 409, 'Đơn đã hủy');
            $d = $this->data($r);
            if (($b['action'] ?? '') === 'cancel') {
                $this->cancel($r);
                $this->notify($tid, 'Vé '.$id.' đã hủy; kiểm tra khoản cần hoàn.');
            } elseif (($b['action'] ?? '') === 'checkin') {
                $trip = $this->tripRow($tid, $r->trip_id);
                if ($u->role === 'driver') {
                    $this->need($u->driver_id === $trip->driver_id, 403, 'Không phải chuyến được phân công');
                }$this->need($r->payment_status === 'paid' && $r->status !== 'checked_in', 409, 'Vé chưa thu đủ hoặc đã kiểm');
                $d['checkedInAt'] = $this->now();
                DB::table('bookings')->where('id', $id)->update(['status' => 'checked_in', 'data' => $this->json($d)]);
            } elseif (($b['action'] ?? '') === 'move') {
                $this->need($r->status !== 'checked_in', 409, 'Khách đã lên xe');
                $target = $this->tripRow($tid, $b['tripId'] ?? '');
                DB::table('trips')->where('id', $target->id)->lockForUpdate()->first();
                $this->need($target->status === 'published' && $target->depart_at > $this->now(), 409, 'Chuyến đích chưa mở bán');
                DB::table('inventory')->where('booking_id', $id)->delete();
                $trip = $this->seats($target, $b['seats'] ?? []);
                $this->need(count($b['seats']) === count($d['selectedSeats']), 422, 'Số ghế phải bằng vé cũ');
                $this->need($d['totalAmount'] === $trip['price'] * count($b['seats']) && $d['discount'] === 0, 409, 'Chỉ chuyển đồng giá, không ưu đãi');
                $d['trip'] = $trip;
                $d['date'] = $trip['date'];
                $d['selectedSeats'] = $b['seats'];
                $d['passenger']['pickupStopId'] = $trip['departureStops'][0]['id'];
                $d['passenger']['dropoffStopId'] = $trip['dropoffStops'][0]['id'];
                DB::table('bookings')->where('id', $id)->update(['trip_id' => $target->id, 'data' => $this->json($d)]);
                foreach ($b['seats'] as $code) {
                    DB::table('inventory')->insert(['trip_id' => $target->id, 'seat' => $code, 'booking_id' => $id]);
                }
            } else {
                abort(422, 'Thao tác đơn không hợp lệ');
            }$this->audit($u, $tid, 'bookings.'.$b['action'], $id);

            return $this->booking(DB::table('bookings')->where('id', $id)->first());
        }, 3);
    }

    public function ledger(string $tid, array $b, object $u, ?string $requestKey): object
    {
        return DB::transaction(function () use ($tid, $b, $u, $requestKey) {
            $this->validate($b, ['kind' => 'required|in:collection,refund,expense', 'amount' => 'required|integer|min:1|max:10000000000', 'method' => 'required|in:cash,transfer', 'note' => 'nullable|string|max:500']);
            $key = $requestKey ? hash('sha256', $tid.$u->id.$requestKey) : null;
            $fingerprint = hash('sha256', $this->json($b));
            if ($key) {
                $this->need((bool) preg_match('/^[\w-]{10,100}$/', $requestKey), 422, 'Khóa giao dịch không hợp lệ');
                $prior = DB::table('ledger_requests')->where('key', $key)->first();
                if ($prior) {
                    $this->need($prior->fingerprint === $fingerprint, 409, 'Khóa giao dịch đã dùng cho nội dung khác');

                    return DB::table('ledger')->where('id', $prior->ledger_id)->first();
                }
            }
            $booking = null;
            if ($b['kind'] !== 'expense') {
                $booking = DB::table('bookings')->where(['id' => $b['bookingId'] ?? '', 'tenant_id' => $tid])->lockForUpdate()->first();
                $this->need((bool) $booking, 404, 'Không tìm thấy đơn');
                $d = $this->data($booking);
                $paid = $this->netPaid($booking->id);
                if ($b['kind'] === 'collection') {
                    $this->need($booking->status !== 'cancelled' && $paid + $b['amount'] <= $d['totalAmount'], 409, 'Vượt tiền cần thu hoặc vé đã hủy');
                    if ($paid + $b['amount'] === $d['totalAmount']) {
                        DB::table('bookings')->where('id', $booking->id)->update(['payment_status' => 'paid']);
                    }
                } else {
                    $this->need($booking->status === 'cancelled' && $b['amount'] <= $paid, 409, 'Chỉ hoàn tiền thực thu của vé hủy');
                    if ($b['amount'] === $paid) {
                        DB::table('bookings')->where('id', $booking->id)->update(['payment_status' => 'refunded']);
                    }
                }
            }
            $id = $this->uuid();
            DB::table('ledger')->insert(['id' => $id, 'tenant_id' => $tid, 'booking_id' => $booking?->id, 'kind' => $b['kind'], 'amount' => $b['amount'], 'method' => $b['method'], 'note' => $b['note'] ?? 'Đối soát thủ công', 'actor_id' => $u->id, 'created_at' => $this->now()]);
            if ($key) {
                DB::table('ledger_requests')->insert(['key' => $key, 'fingerprint' => $fingerprint, 'ledger_id' => $id]);
            }$this->audit($u, $tid, 'ledger.'.$b['kind'], $id, ['amount' => $b['amount'], 'bookingId' => $booking?->id]);

            return DB::table('ledger')->where('id', $id)->first();
        }, 3);
    }

    public function seed(?object $u = null): array
    {
        return DB::transaction(function () use ($u) {
            $existing = DB::table('tenants')->where('slug', 'danavago')->first();
            if ($existing) {
                return ['tenant' => $this->tenant($existing->id), 'alreadyExists' => true];
            }$t = $this->createTenant(['name' => 'DANAVAGO', 'slug' => 'danavago', 'autoPublish' => true, 'phone' => '0935917677'], $u);
            $tid = $t['id'];
            $branch = $this->saveRecord($tid, 'branches', ['name' => 'Văn phòng Đà Nẵng', 'address' => 'Đà Nẵng — dữ liệu thử nghiệm', 'phone' => '0935917677'], $u);
            $driver = $this->saveRecord($tid, 'drivers', ['name' => 'Tài xế thử nghiệm', 'phone' => '0901234567', 'license' => 'D', 'licenseExpiry' => '2099-12-31'], $u);
            $models = [['Giường nằm 34 chỗ', 'sleeper', 34, 2, 'bus_coach_sleeper.png'], ['Limousine 16 chỗ', 'limousine', 16, 1, 'bus_limousine_vip.png'], ['Cabin VIP 22 phòng', 'cabin', 22, 2, 'bus_cabin_royal.png']];
            $routePairs = [['Đà Nẵng', 'Huế', 150], ['Đà Nẵng', 'Hội An', 60], ['Huế', 'Đà Nẵng', 150]];
            $vehicles = [];
            $routes = [];
            foreach ($models as $i => $m) {
                $vehicles[] = $this->saveRecord($tid, 'vehicles', ['name' => $m[0], 'category' => $m[1], 'capacity' => $m[2], 'floors' => $m[3], 'plate' => '43B-000.0'.($i + 1), 'image' => '/assets/images/'.$m[4]], $u);
                [$from,$to,$minutes] = $routePairs[$i];
                $routes[] = $this->saveRecord($tid, 'routes', ['name' => $from.' → '.$to, 'from' => $from, 'to' => $to, 'durationMinutes' => $minutes, 'pickups' => [['id' => 'pickup-office', 'name' => 'Văn phòng '.$from, 'address' => $from.' — điểm đón thử nghiệm', 'offset' => 0]], 'dropoffs' => [['id' => 'dropoff-office', 'name' => 'Văn phòng '.$to, 'address' => $to.' — điểm trả thử nghiệm', 'offset' => $minutes]]], $u);
            }
            $actor = $u ?? (object) ['id' => null, 'role' => 'platform'];
            for ($day = 1; $day <= 5; $day++) {
                foreach ($vehicles as $i => $v) {
                    $trip = $this->saveTrip($tid, ['vehicleId' => $v['id'], 'routeId' => $routes[$i]['id'], 'driverId' => $driver['id'], 'branchId' => $branch['id'], 'date' => C::now('Asia/Ho_Chi_Minh')->addDays($day)->format('Y-m-d'), 'time' => ['08:00', '12:00', '17:00'][$i], 'price' => [180000, 240000, 320000][$i]], $u);
                    $this->tripStatus($tid, $trip['id'], 'published', $actor);
                }
            }

            return ['tenant' => $this->tenant($tid), 'counts' => ['vehicles' => 3, 'routes' => 3, 'trips' => 15], 'demo' => true];
        }, 3);
    }
}
