<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PortalService
{
    public function __construct(private OperatorService $ops) {}

    public function profile(string $slug): array
    {
        $t = DB::table('tenants')->where(['slug' => $slug, 'status' => 'active'])->first();
        abort_unless($t, 404, 'Nhà xe chưa hoạt động');
        $t = $this->ops->tenant($t->id);
        $routes = $this->ops->records($t['id'], 'routes');
        $vehicles = $this->ops->records($t['id'], 'vehicles');
        $sub = DB::table('tenant_domains')->where(['tenant_id' => $t['id'], 'type' => 'subdomain', 'status' => 'active'])->value('hostname');
        $custom = DB::table('tenant_domains')->where(['tenant_id' => $t['id'], 'type' => 'custom', 'status' => 'active'])->value('hostname');
        $public = array_intersect_key($t, array_flip(['id', 'name', 'slug', 'phone', 'email', 'description', 'address', 'color', 'logo', 'hero', 'policies']));
        $next = DB::table('trips')->where(['tenant_id' => $t['id'], 'status' => 'published'])->where('depart_at', '>', $this->ops->now())->orderBy('depart_at')->first();

        return [...$public, 'nextDepartureDate' => $next ? $this->ops->data($next)['date'] : null, 'appEnabled' => (bool) ($t['appEnabled'] ?? false), 'appUrl' => ($custom || ($sub && config('portals.wildcard_ready'))) ? 'https://'.($custom ?: $sub) : '/app/'.$t['slug'], 'profileUrl' => 'https://'.config('portals.profile_host').'/nha-xe/'.$t['slug'], 'routes' => $routes, 'vehicles' => array_map(fn ($v) => array_intersect_key($v, array_flip(['id', 'name', 'category', 'capacity', 'floors', 'image', 'description', 'amenities'])), $vehicles)];
    }

    public function tenantForHost(Request $r): ?string
    {
        $host = strtolower($r->getHost());
        if (in_array($host, [config('portals.marketplace_host'), 'www.'.config('portals.marketplace_host'), config('portals.profile_host'), 'www.'.config('portals.profile_host'), config('portals.platform_app_host'), 'localhost', '127.0.0.1', 'terminal.local'])) {
            return null;
        }
        $domain = DB::table('tenant_domains')->where(['hostname' => $host, 'status' => 'active'])->first();
        if (! $domain) {
            return null;
        }if ($domain->type === 'subdomain' && ! config('portals.wildcard_ready')) {
            return null;
        }
        $t = $this->ops->tenant($domain->tenant_id);
        abort_unless($t['status'] === 'active' && ($t['appEnabled'] ?? false), 404, 'Ứng dụng nhà xe tạm ngừng');

        return $t['id'];
    }

    public function context(Request $r): array
    {
        $tid = $this->tenantForHost($r);
        if ($tid) {
            return ['kind' => 'operator', 'operator' => $this->profile($this->ops->tenant($tid)['slug'])];
        }
        $host = strtolower($r->getHost());
        $known = [config('portals.marketplace_host'), 'www.'.config('portals.marketplace_host'), config('portals.profile_host'), 'www.'.config('portals.profile_host'), config('portals.platform_app_host'), 'localhost', '127.0.0.1', 'terminal.local'];
        abort_unless(in_array($host, $known), 404, 'Tên miền chưa được cấu hình hoặc xác minh');

        return ['kind' => $host === config('portals.platform_app_host') ? 'platform-app' : 'marketplace', 'operator' => null];
    }

    public function scopeTrip(Request $r, string $tripId): void
    {
        $tid = $this->tenantForHost($r);
        if ($tid) {
            abort_unless(DB::table('trips')->where(['id' => $tripId, 'tenant_id' => $tid])->exists(), 403, 'Chuyến không thuộc app nhà xe này');
        }
    }

    public function domains(string $tid): array
    {
        return DB::table('tenant_domains')->where('tenant_id', $tid)->get()->map(function ($d) {
            return [...(array) $d, 'verificationRecord' => $d->type === 'custom' ? ['_danava-challenge.'.$d->hostname, 'danava-verification='.$d->verification_token] : null, 'target' => config('portals.platform_app_host')];
        })->all();
    }

    public function save(string $tid, array $b, object $u): array
    {
        $this->ops->validate($b, ['appEnabled' => 'required|boolean', 'appSlug' => 'required|string|min:3|max:63|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'customDomain' => 'nullable|string|max:190', 'logo' => 'nullable|string|max:500', 'hero' => 'nullable|string|max:500']);
        $slug = $b['appSlug'];
        abort_if(in_array($slug, ['www', 'app', 'admin', 'manage', 'api', 'mail', 'ftp', 'cpanel', 'webmail', 'studio', 'autodiscover']), 422, 'Subdomain đã được dành riêng');
        $sub = $slug.'.'.config('portals.tenant_app_root');
        $custom = strtolower(trim($b['customDomain'] ?? ''));
        if ($custom) {
            abort_unless(filter_var($custom, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) && str_contains($custom, '.') && ! filter_var($custom, FILTER_VALIDATE_IP) && ! preg_match('/\.(local|test|localhost|internal)$/', $custom), 422, 'Tên miền không hợp lệ');
            abort_if(in_array($custom, [config('portals.profile_host'), config('portals.marketplace_host'), config('portals.platform_app_host')]) || str_ends_with($custom, '.'.config('portals.tenant_app_root')), 422, 'Dùng trường subdomain cho tên miền của nền tảng');
        }
        foreach (['logo', 'hero'] as $field) {
            if (! empty($b[$field])) {
                abort_unless(preg_match('~^/(assets/[\w/.-]+|uploads/[\w.-]+)$~', $b[$field]) || str_starts_with($b[$field], 'https://'), 422, 'Ảnh thương hiệu cần HTTPS hoặc ảnh tải lên');
            }
        }

        return DB::transaction(function () use ($tid, $b, $u, $sub, $custom) {
            DB::table('tenants')->where('id', $tid)->lockForUpdate()->first();
            $wanted = array_filter([$sub, $custom]);
            abort_if(DB::table('tenant_domains')->whereIn('hostname', $wanted)->where('tenant_id', '!=', $tid)->exists(), 409, 'Tên miền/subdomain đã thuộc nhà xe khác');
            $t = $this->ops->tenant($tid);
            $t['appEnabled'] = $b['appEnabled'];
            foreach (['logo', 'hero'] as $k) {
                if (array_key_exists($k, $b)) {
                    $t[$k] = $b[$k] ?? '';
                }
            }DB::table('tenants')->where('id', $tid)->update(['data' => $this->ops->json($t)]);
            DB::table('tenant_domains')->where('tenant_id', $tid)->whereNotIn('hostname', $wanted)->delete();
            foreach (['subdomain' => $sub, 'custom' => $custom] as $type => $host) {
                if (! $host || DB::table('tenant_domains')->where('hostname', $host)->exists()) {
                    continue;
                }DB::table('tenant_domains')->insert(['id' => $this->ops->uuid(), 'tenant_id' => $tid, 'hostname' => $host, 'type' => $type, 'status' => $type === 'subdomain' ? 'active' : 'pending', 'verification_token' => $type === 'custom' ? Str::random(48) : null, 'verified_at' => $type === 'subdomain' ? $this->ops->now() : null, 'created_at' => $this->ops->now()]);
            }
            $this->ops->audit($u, $tid, 'app.configure', $tid);

            return ['operator' => $this->profile($t['slug']), 'domains' => $this->domains($tid), 'wildcardReady' => config('portals.wildcard_ready')];
        }, 3);
    }

    public function verify(string $tid, string $id, object $u): array
    {
        $d = DB::table('tenant_domains')->where(['tenant_id' => $tid, 'id' => $id, 'type' => 'custom'])->first();
        abort_unless($d, 404, 'Không tìm thấy tên miền riêng');
        $records = $this->txt('_danava-challenge.'.$d->hostname);
        $expected = 'danava-verification='.$d->verification_token;
        abort_unless(in_array($expected, $records, true), 422, 'Chưa tìm thấy TXT xác minh. Kiểm tra DNS và thử lại sau.');
        DB::table('tenant_domains')->where('id', $id)->update(['status' => 'verified', 'verified_at' => $this->ops->now()]);
        $this->ops->audit($u, $tid, 'domain.verified', $id);

        return ['domains' => $this->domains($tid), 'message' => 'Đã xác minh chủ sở hữu. Quản trị nền tảng cần cấu hình DNS/SSL trên hosting trước khi kích hoạt.'];
    }

    public function txt(string $host): array
    {
        return array_map(fn ($r) => $r['txt'] ?? implode('', $r['entries'] ?? []), dns_get_record($host, DNS_TXT) ?: []);
    }

    public function seedCuaOng(?object $u = null): array
    {
        return DB::transaction(function () use ($u) {
            $existing = DB::table('tenants')->where('slug', 'cua-ong-limousine')->first();
            if ($existing) {
                return $this->profile($existing->slug);
            }
            $t = $this->ops->createTenant(['name' => 'Cửa Ông Limousine', 'slug' => 'cua-ong-limousine', 'phone' => '0983227788', 'autoPublish' => true], $u);
            $tid = $t['id'];
            $data = $t;
            $data['color'] = '#f5b51b';
            $data['description'] = 'Đi êm ái. Đến an tâm. Dữ liệu nhà xe mẫu để thử nghiệm.';
            $data['policies'] = 'Dữ liệu thử nghiệm. Liên hệ nhà xe để xác nhận điểm đón, hành lý và chính sách trước khi đi.';
            DB::table('tenants')->where('id', $tid)->update(['data' => $this->ops->json($data)]);
            $v = $this->ops->saveRecord($tid, 'vehicles', ['name' => 'Limousine 9 chỗ', 'plate' => '29B-DEMO.09', 'category' => 'limousine', 'floors' => 1, 'capacity' => 9, 'seatCodes' => ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'D3'], 'image' => '/assets/images/bus_limousine_vip.png', 'amenities' => ['WiFi', 'USB', 'Điều hòa']], $u);
            $route = $this->ops->saveRecord($tid, 'routes', ['name' => 'Hà Nội → Cửa Ông', 'from' => 'Hà Nội', 'to' => 'Cửa Ông', 'durationMinutes' => 210, 'pickups' => [['id' => 'hn-office', 'name' => 'Văn phòng Hà Nội', 'address' => 'Điểm đón thử nghiệm — nhà xe cần cập nhật địa chỉ thực', 'offset' => 0]], 'dropoffs' => [['id' => 'co-office', 'name' => 'Văn phòng Cửa Ông', 'address' => 'Điểm trả thử nghiệm — nhà xe cần cập nhật địa chỉ thực', 'offset' => 210]]], $u);
            for ($i = 1; $i <= 5; $i++) {
                $trip = $this->ops->saveTrip($tid, ['vehicleId' => $v['id'], 'routeId' => $route['id'], 'date' => CarbonImmutable::now('Asia/Ho_Chi_Minh')->addDays($i)->format('Y-m-d'), 'time' => '07:00', 'price' => 300000, 'driverId' => ''], $u);
                $this->ops->tripStatus($tid, $trip['id'], 'published', $u ?? (object) ['id' => null, 'role' => 'platform']);
            }
            $this->save($tid, ['appEnabled' => true, 'appSlug' => 'cuaonglimousine', 'customDomain' => '', 'logo' => '', 'hero' => ''], $u ?? (object) ['id' => null]);

            return $this->profile('cua-ong-limousine');
        }, 3);
    }
}
