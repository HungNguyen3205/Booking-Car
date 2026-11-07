<?php

namespace App\Services;

use Carbon\CarbonImmutable as C;
use Illuminate\Support\Facades\DB;

/**
 * Two branded operator apps for demos: Hải Vân Xanh (green, Huế · Đà Nẵng ·
 * Hội An, 7/9/11-seat vans) and Cửa Ông Limousine (brown, Hà Nội ⇄ Cửa Ông).
 * Each is the same appgo with its own colour, logo, cover, slogan, routes with
 * GPS coordinates, vans and published trips. Idempotent: rerun to top up the
 * schedule; branding is refreshed every run. Same production guard as
 * danava:seed-demo. Command: php artisan danava:seed-brand-demo --days=7
 */
class BrandDemo
{
    /** Stop coordinates (approximate city centres) for the on-route check. */
    private const GEO = [
        'Huế' => [16.4637, 107.5909],
        'Hầm Hải Vân' => [16.1967, 108.1305],
        'Đà Nẵng' => [16.0544, 108.2022],
        'Hội An' => [15.8801, 108.3380],
        'Hà Nội' => [21.0285, 105.8542],
        'Hải Dương' => [20.9373, 106.3146],
        'Hạ Long' => [20.9599, 107.0425],
        'Cửa Ông' => [21.0236, 107.3533],
    ];

    /** Seat codes as drawn in the van mock-ups (driver up front, aisle on the right). */
    private const SEATS = [
        7 => ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3'],
        9 => ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'D3'],
        11 => ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3'],
    ];

    private const OPERATORS = [
        'hai-van-xanh' => [
            'name' => 'Hải Vân Xanh', 'app' => 'haivan', 'phone' => '0777500500', 'plate' => '75E', 'van' => '/assets/operators/hai-van-xanh/van.jpg',
            'brand' => [
                'color' => '#2f9e44', 'logo' => '/assets/operators/hai-van-xanh/logo.png', 'hero' => '/assets/operators/hai-van-xanh/hero.jpg',
                'slogan' => 'Đi êm ái. Đến an tâm.', 'tagline' => 'Chuyên xe 7 chỗ • 9 chỗ • 11 chỗ',
                'description' => 'Kết nối Huế • Đà Nẵng • Hội An. Đón tận nơi, trả tận nơi.',
                'address' => 'Huế — Đà Nẵng — Hội An',
                'policies' => "Có mặt trước giờ khởi hành 15 phút.\nĐón/trả tận nơi trong nội thành; địa chỉ được nhà xe gọi xác nhận sau khi đặt vé.\nĐổi/hủy vé trước 12 giờ: liên hệ hotline 0777 500 500.\nMỗi khách 1 vali + 1 túi xách tay.",
            ],
            // [from, to, minutes, km, fare, via, [[time, seats], ...]]
            'legs' => [
                ['Huế', 'Đà Nẵng', 150, 100, 300000, 'Hầm Hải Vân', [['07:00', 9], ['09:00', 9], ['13:00', 7], ['16:00', 11]]],
                ['Đà Nẵng', 'Huế', 150, 100, 300000, 'Hầm Hải Vân', [['08:00', 9], ['12:00', 7], ['15:00', 9], ['18:00', 11]]],
                ['Huế', 'Hội An', 180, 130, 350000, 'Đà Nẵng', [['07:30', 9], ['14:00', 11]]],
                ['Hội An', 'Huế', 180, 130, 350000, 'Đà Nẵng', [['08:30', 9], ['15:30', 11]]],
            ],
        ],
        'cua-ong-limousine' => [
            'name' => 'Cửa Ông Limousine', 'app' => 'cuaong', 'phone' => '0983227788', 'plate' => '14B', 'van' => '/assets/operator-app/cua-ong-coach-engraving.webp',
            'brand' => [
                // Amber fill with dark-brown text, as in the Cửa Ông mock-up.
                'color' => '#febc27', 'ink' => '#4d2f15', 'logo' => '/assets/operators/cua-ong-limousine/logo.png', 'hero' => '/assets/operator-app/cua-ong-hero.webp',
                'slogan' => 'Đi êm ái. Đến an tâm.', 'tagline' => 'Limousine Hà Nội ⇄ Cửa Ông • Hạ Long',
                'description' => 'Limousine 9 chỗ cao cấp, đón trả tận nơi Hà Nội — Hạ Long — Cửa Ông.',
                'address' => 'Cửa Ông, Cẩm Phả, Quảng Ninh',
                'policies' => "Có mặt trước giờ khởi hành 15 phút.\nĐón/trả tận nơi nội thành Hà Nội và Cẩm Phả; nhà xe gọi xác nhận địa chỉ.\nĐổi/hủy vé trước 12 giờ: liên hệ hotline nhà xe.\nMỗi khách 1 vali + 1 túi xách tay.",
            ],
            'legs' => [
                ['Hà Nội', 'Cửa Ông', 210, 200, 300000, 'Hạ Long', [['06:00', 9], ['09:00', 9], ['13:30', 11], ['17:00', 9]]],
                ['Cửa Ông', 'Hà Nội', 210, 200, 300000, 'Hạ Long', [['05:30', 9], ['10:00', 9], ['14:00', 11], ['18:00', 9]]],
            ],
        ],
    ];

    public function __construct(private OperatorService $ops, private PortalService $portal) {}

    public function seed(int $days = 7): array
    {
        $actor = (object) ['id' => null, 'role' => 'platform'];
        $out = [];
        foreach (self::OPERATORS as $slug => $o) {
            $tenant = DB::table('tenants')->where('slug', $slug)->first();
            $tid = $tenant?->id ?? $this->ops->createTenant(['name' => $o['name'], 'slug' => $slug, 'phone' => $o['phone'], 'autoPublish' => true], null)['id'];
            $t = $this->ops->tenant($tid);
            $t = array_merge($t, $o['brand'], ['phone' => $o['phone'], 'autoPublish' => true]);
            DB::table('tenants')->where('id', $tid)->update(['name' => $o['name'], 'status' => 'active', 'data' => $this->ops->json($t)]);
            $this->portal->save($tid, ['appEnabled' => true, 'appSlug' => $o['app'], 'customDomain' => '', 'logo' => $o['brand']['logo'], 'hero' => $o['brand']['hero']], $actor);

            $routes = collect($this->ops->records($tid, 'routes'))->keyBy('name')->all();
            $vehicles = collect($this->ops->records($tid, 'vehicles'))->keyBy('name')->all();
            $created = 0;
            $n = 0;
            foreach ($o['legs'] as [$from, $to, $minutes, $km, $fare, $via, $slots]) {
                $name = $from.' → '.$to;
                $routes[$name] = $this->route($tid, $routes[$name]['id'] ?? null, $from, $to, $minutes, $km, $fare, $via);
                foreach ($slots as [$time, $seats]) {
                    $n++;
                    // One van per departure slot so daily schedules never overlap.
                    $vName = 'Limousine '.$seats.' chỗ · '.$name.' '.$time;
                    // Saved every run so the van layout and photo follow this file.
                    $vehicles[$vName] = $this->ops->saveRecord($tid, 'vehicles', [
                        'name' => $vName, 'category' => 'limousine', 'seatMap' => $this->vanMap(self::SEATS[$seats]),
                        'plate' => sprintf('%s-%03d.%02d', $o['plate'], 10 + $n, 90 + $n % 10), 'image' => $o['van'],
                        'amenities' => ['WiFi', 'USB', 'Điều hòa', 'Nước uống'],
                    ], null, $vehicles[$vName]['id'] ?? null);
                    for ($day = 0; $day < $days; $day++) {
                        $date = C::now('Asia/Ho_Chi_Minh')->addDays($day);
                        if ($date->format('Y-m-d').' '.$time <= C::now('Asia/Ho_Chi_Minh')->addMinutes(30)->format('Y-m-d H:i')) {
                            continue;
                        }
                        $created += $this->trip($tid, $vehicles[$vName], $routes[$name], $date, $time, $fare, $actor);
                    }
                }
            }
            $out[] = ['operator' => $o['name'], 'slug' => $slug, 'app' => '/app/'.$slug, 'newTrips' => $created];
        }

        return $out;
    }

    /** Door-to-door pickup + meeting point, a waypoint with coordinates, door-to-door drop-off. */
    private function route(string $tid, ?string $id, string $from, string $to, int $minutes, int $km, int $fare, string $via): array
    {
        $geo = fn (string $place) => ['lat' => self::GEO[$place][0], 'lng' => self::GEO[$place][1]];

        return $this->ops->saveRecord($tid, 'routes', [
            'name' => $from.' → '.$to, 'from' => $from, 'to' => $to, 'durationMinutes' => $minutes, 'basePrice' => $fare, 'distanceKm' => $km,
            'pickups' => [
                ['id' => 'pickup-door', 'name' => 'Đón tận nơi tại '.$from, 'address' => 'Địa chỉ được xác nhận khi đặt vé', 'offset' => 0] + $geo($from),
                ['id' => 'pickup-meet', 'name' => 'Điểm hẹn tại '.$from, 'address' => 'Văn phòng nhà xe '.$from, 'offset' => 15] + $geo($from),
            ],
            'waypoints' => [['name' => $via] + $geo($via)],
            'dropoffs' => [
                // The app pre-selects the last drop-off: door-to-door, as in the mock-ups.
                ['id' => 'dropoff-meet', 'name' => 'Văn phòng nhà xe '.$to, 'address' => 'Điểm hẹn tại '.$to, 'offset' => $minutes] + $geo($to),
                ['id' => 'dropoff-door', 'name' => 'Trả tận nơi tại '.$to, 'address' => 'Địa chỉ được xác nhận khi đặt vé', 'offset' => $minutes] + $geo($to),
            ],
        ], null, $id);
    }

    /**
     * Van layout as in the mock-ups: one row per letter, two seats with the aisle
     * in the middle (A1 | A2) or a full bench of three at the back (D1 D2 D3).
     */
    private function vanMap(array $codes): array
    {
        $rows = [];
        foreach ($codes as $c) {
            $rows[$c[0]][] = $c;
        }
        $cells = [];
        $r = 0;
        foreach ($rows as $seats) {
            $r++;
            $cols = count($seats) >= 3 ? [1, 2, 3] : [1, 3];
            foreach (array_values($seats) as $i => $code) {
                $cells[] = ['code' => $code, 'floor' => 1, 'row' => $r, 'col' => $cols[$i]];
            }
        }

        return ['cols' => 3, 'rows' => $r, 'cells' => $cells];
    }

    /** Fri–Sun +10% like DemoMarketplace; existing trips are left untouched. */
    private function trip(string $tid, array $vehicle, array $route, C $date, string $time, int $fare, object $actor): int
    {
        $day = $date->format('Y-m-d');
        $exists = DB::table('trips')->where(['tenant_id' => $tid, 'vehicle_id' => $vehicle['id'], 'route_id' => $route['id']])
            ->where('depart_at', C::parse($day.' '.$time, 'Asia/Ho_Chi_Minh')->utc()->format('Y-m-d\TH:i:s.v\Z'))->exists();
        if ($exists) {
            return 0;
        }
        $price = $date->isoWeekday() >= 5 ? (int) (round($fare * 1.1 / 10000) * 10000) : $fare;
        $trip = $this->ops->saveTrip($tid, ['vehicleId' => $vehicle['id'], 'routeId' => $route['id'], 'date' => $day, 'time' => $time, 'price' => $price], null);
        $this->ops->tripStatus($tid, $trip['id'], 'published', $actor);

        return 1;
    }
}
