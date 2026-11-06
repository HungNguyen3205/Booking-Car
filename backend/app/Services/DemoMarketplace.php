<?php

namespace App\Services;

use Carbon\CarbonImmutable as C;
use Illuminate\Support\Facades\DB;

/**
 * Demo marketplace: fictional operators on real Vietnamese corridors with
 * fares close to 2026 market prices. Local/staging only (see danava:seed-operators).
 * Operator names, phones and plates are invented; slugs start with "demo-".
 */
class DemoMarketplace
{
    /** City => [main bus station, address]. Public stations, used as pickup/drop-off points. */
    private const STATIONS = [
        'Đà Nẵng' => ['Bến xe Trung tâm Đà Nẵng', 'Tôn Đức Thắng, Liên Chiểu, Đà Nẵng'],
        'Huế' => ['Bến xe phía Nam Huế', 'An Dương Vương, Huế'],
        'Hội An' => ['Bến xe Hội An', 'Hùng Vương, Hội An'],
        'Quy Nhơn' => ['Bến xe Quy Nhơn', 'Tây Sơn, Quy Nhơn'],
        'Nha Trang' => ['Bến xe phía Nam Nha Trang', 'Võ Nguyên Giáp, Nha Trang'],
        'Đà Lạt' => ['Bến xe Liên tỉnh Đà Lạt', 'Tô Hiến Thành, Đà Lạt'],
        'Hà Nội' => ['Bến xe Mỹ Đình', 'Phạm Hùng, Nam Từ Liêm, Hà Nội'],
        'TP. Hồ Chí Minh' => ['Bến xe Miền Đông mới', 'Quốc lộ 1A, Thủ Đức, TP. Hồ Chí Minh'],
        'Hải Phòng' => ['Bến xe Niệm Nghĩa', 'Trần Nguyên Hãn, Lê Chân, Hải Phòng'],
        'Cần Thơ' => ['Bến xe Trung tâm Cần Thơ', 'Quốc lộ 1A, Cái Răng, Cần Thơ'],
        'Đồng Nai' => ['Bến xe Biên Hòa', 'Nguyễn Ái Quốc, Biên Hòa, Đồng Nai'],
        'Quảng Ninh' => ['Bến xe Bãi Cháy', 'Hạ Long, Quảng Ninh'],
        'Bắc Ninh' => ['Bến xe Bắc Ninh', 'Ngô Gia Tự, Bắc Ninh'],
    ];

    /** "from|to" => [minutes, km]. */
    private const LEGS = [
        'Đà Nẵng|Huế' => [150, 100], 'Đà Nẵng|Hội An' => [50, 30], 'Huế|Hội An' => [210, 130],
        'Đà Nẵng|Hà Nội' => [900, 770], 'Đà Nẵng|TP. Hồ Chí Minh' => [1080, 960], 'Huế|Hà Nội' => [780, 660],
        'Đà Nẵng|Đà Lạt' => [780, 660], 'Đà Nẵng|Nha Trang' => [600, 530], 'TP. Hồ Chí Minh|Đà Lạt' => [420, 300],
        'Đà Nẵng|Quy Nhơn' => [360, 320], 'Quy Nhơn|Nha Trang' => [300, 220], 'Hà Nội|Hải Phòng' => [120, 120],
        'Hà Nội|Bắc Ninh' => [50, 35], 'Hà Nội|Quảng Ninh' => [165, 160], 'TP. Hồ Chí Minh|Cần Thơ' => [210, 170],
        'TP. Hồ Chí Minh|Đồng Nai' => [70, 35], 'TP. Hồ Chí Minh|Nha Trang' => [510, 430], 'Nha Trang|Đà Lạt' => [240, 140],
    ];

    /** Vehicle category => [label, capacity, floors, image, amenities]. */
    private const MODELS = [
        'limousine' => ['Limousine 9 chỗ', 9, 1, 'bus_limousine_vip.png', ['Ghế massage', 'Điều hòa', 'Wifi', 'Nước uống']],
        'sleeper' => ['Giường nằm 34 chỗ', 34, 2, 'bus_coach_sleeper.png', ['Điều hòa', 'Chăn gối', 'USB', 'Nước uống']],
        'cabin' => ['Cabin đôi 22 phòng', 22, 2, 'bus_cabin_royal.png', ['Phòng riêng có rèm', 'Màn hình giải trí', 'Wifi', 'Nước uống']],
    ];

    /**
     * slug => [name, phone, plate prefix, description, legs].
     * Each leg: [from, to, category, fare, departure times].
     */
    private const OPERATORS = [
        'demo-song-han' => ['Sông Hàn Limousine', '0905112233', '43B', 'Limousine 9 chỗ miền Trung, đón trả tận nơi trong nội thành.', [
            ['Đà Nẵng', 'Huế', 'limousine', 200000, ['06:30', '10:00', '14:00', '17:30']],
            ['Huế', 'Đà Nẵng', 'limousine', 200000, ['07:00', '11:00', '15:00', '18:30']],
            ['Đà Nẵng', 'Hội An', 'limousine', 110000, ['08:00', '12:30', '16:30']],
            ['Hội An', 'Đà Nẵng', 'limousine', 110000, ['09:30', '14:00', '18:30']],
            ['Huế', 'Hội An', 'limousine', 250000, ['08:30']],
        ]],
        'demo-canh-dieu' => ['Cánh Diều Express', '0914223344', '43B', 'Giường nằm Bắc – Nam tuyến dài, xuất bến đúng giờ.', [
            ['Đà Nẵng', 'Hà Nội', 'sleeper', 520000, ['17:00']],
            ['Hà Nội', 'Đà Nẵng', 'sleeper', 520000, ['18:00']],
            ['Đà Nẵng', 'TP. Hồ Chí Minh', 'sleeper', 620000, ['15:00']],
            ['TP. Hồ Chí Minh', 'Đà Nẵng', 'sleeper', 620000, ['16:00']],
            ['Huế', 'Hà Nội', 'sleeper', 470000, ['18:30']],
            ['Hà Nội', 'Huế', 'sleeper', 470000, ['19:00']],
        ]],
        'demo-may-ngan' => ['Mây Ngàn Cabin', '0935334455', '49B', 'Xe cabin đôi cao cấp đi Đà Lạt, Nha Trang.', [
            ['Đà Nẵng', 'Đà Lạt', 'cabin', 680000, ['16:00']],
            ['Đà Lạt', 'Đà Nẵng', 'cabin', 680000, ['15:30']],
            ['Đà Nẵng', 'Nha Trang', 'cabin', 560000, ['19:00']],
            ['Nha Trang', 'Đà Nẵng', 'cabin', 560000, ['19:30']],
            ['TP. Hồ Chí Minh', 'Đà Lạt', 'cabin', 450000, ['22:00']],
            ['Đà Lạt', 'TP. Hồ Chí Minh', 'cabin', 450000, ['22:30']],
        ]],
        'demo-pho-bien' => ['Phố Biển Travel', '0976445566', '77B', 'Giường nằm duyên hải Nam Trung Bộ.', [
            ['Đà Nẵng', 'Quy Nhơn', 'sleeper', 280000, ['07:30', '20:00']],
            ['Quy Nhơn', 'Đà Nẵng', 'sleeper', 280000, ['08:00', '21:00']],
            ['Quy Nhơn', 'Nha Trang', 'sleeper', 230000, ['09:00']],
            ['Nha Trang', 'Quy Nhơn', 'sleeper', 230000, ['13:00']],
        ]],
        'demo-sao-mai' => ['Sao Mai Limousine', '0987556677', '29B', 'Limousine Hà Nội – Hải Phòng – Bắc Ninh, chạy mỗi 3–4 giờ.', [
            ['Hà Nội', 'Hải Phòng', 'limousine', 240000, ['06:00', '09:00', '14:00', '18:00']],
            ['Hải Phòng', 'Hà Nội', 'limousine', 240000, ['06:30', '10:30', '15:00', '19:00']],
            ['Hà Nội', 'Bắc Ninh', 'limousine', 100000, ['07:00', '17:00']],
            ['Bắc Ninh', 'Hà Nội', 'limousine', 100000, ['08:30', '18:30']],
        ]],
        'demo-vinh-xanh' => ['Vịnh Xanh Cabin', '0968667788', '14B', 'Limousine đi Hạ Long và cabin Hà Nội – Đà Nẵng.', [
            ['Hà Nội', 'Quảng Ninh', 'limousine', 290000, ['07:00', '13:00']],
            ['Quảng Ninh', 'Hà Nội', 'limousine', 290000, ['10:30', '16:30']],
            ['Hà Nội', 'Đà Nẵng', 'cabin', 880000, ['19:00']],
            ['Đà Nẵng', 'Hà Nội', 'cabin', 880000, ['18:00']],
        ]],
        'demo-mien-tay' => ['Miền Tây Xanh', '0939778899', '65B', 'Giường nằm TP. Hồ Chí Minh – Cần Thơ và limousine đi Biên Hòa.', [
            ['TP. Hồ Chí Minh', 'Cần Thơ', 'sleeper', 170000, ['06:00', '10:00', '14:00', '20:00']],
            ['Cần Thơ', 'TP. Hồ Chí Minh', 'sleeper', 170000, ['05:30', '09:30', '13:30', '19:30']],
            ['TP. Hồ Chí Minh', 'Đồng Nai', 'limousine', 90000, ['07:00', '12:00', '17:00']],
            ['Đồng Nai', 'TP. Hồ Chí Minh', 'limousine', 90000, ['08:30', '13:30', '18:30']],
        ]],
        'demo-huong-duong' => ['Hướng Dương Bus', '0909889900', '51B', 'Giường nằm và cabin TP. Hồ Chí Minh – Nha Trang – Đà Lạt.', [
            ['TP. Hồ Chí Minh', 'Nha Trang', 'sleeper', 330000, ['21:00']],
            ['TP. Hồ Chí Minh', 'Nha Trang', 'cabin', 490000, ['22:00']],
            ['Nha Trang', 'TP. Hồ Chí Minh', 'sleeper', 330000, ['20:30']],
            ['Nha Trang', 'TP. Hồ Chí Minh', 'cabin', 490000, ['21:30']],
            ['Nha Trang', 'Đà Lạt', 'limousine', 210000, ['08:00', '14:00']],
            ['Đà Lạt', 'Nha Trang', 'limousine', 210000, ['08:30', '14:30']],
            ['TP. Hồ Chí Minh', 'Đà Lạt', 'sleeper', 310000, ['23:00']],
        ]],
    ];

    public function __construct(private OperatorService $ops) {}

    /** Creates missing demo operators and tops up their schedule to $days days ahead. */
    public function seed(int $days = 7): array
    {
        $actor = (object) ['id' => null, 'role' => 'platform'];
        $summary = [];
        foreach (self::OPERATORS as $slug => [$name, $phone, $platePrefix, $description, $legs]) {
            $tenant = DB::table('tenants')->where('slug', $slug)->first();
            $tid = $tenant?->id ?? $this->ops->createTenant(['name' => $name, 'slug' => $slug, 'phone' => $phone, 'description' => $description.' (Dữ liệu demo)', 'address' => self::STATIONS[$legs[0][0]][1], 'autoPublish' => true], null)['id'];
            $vehicles = collect($this->ops->records($tid, 'vehicles'))->keyBy('name')->all();
            $routes = collect($this->ops->records($tid, 'routes'))->keyBy('name')->all();
            $created = 0;
            $n = 0;
            foreach ($legs as [$from, $to, $category, $fare, $times]) {
                $routeName = $from.' → '.$to;
                $routes[$routeName] ??= $this->route($tid, $from, $to, $fare);
                foreach ($times as $time) {
                    $n++;
                    // One vehicle per departure slot, so daily schedules never overlap.
                    $model = self::MODELS[$category];
                    $vehicleName = $model[0].' · '.$routeName.' '.$time;
                    $vehicles[$vehicleName] ??= $this->ops->saveRecord($tid, 'vehicles', ['name' => $vehicleName, 'category' => $category, 'capacity' => $model[1], 'floors' => $model[2],
                        'plate' => sprintf('%s-%03d.%02d', $platePrefix, 100 + $n, $n), 'image' => '/assets/images/'.$model[3], 'amenities' => $model[4]], null);
                    for ($day = 0; $day < $days; $day++) {
                        $date = C::now('Asia/Ho_Chi_Minh')->addDays($day);
                        if ($date->format('Y-m-d').' '.$time <= C::now('Asia/Ho_Chi_Minh')->addMinutes(30)->format('Y-m-d H:i')) {
                            continue;
                        }
                        $created += $this->trip($tid, $vehicles[$vehicleName], $routes[$routeName], $date, $time, $fare, $actor);
                    }
                }
            }
            $summary[] = ['operator' => $name, 'slug' => $slug, 'newTrips' => $created];
        }

        return $summary;
    }

    private function route(string $tid, string $from, string $to, int $fare): array
    {
        [$minutes, $km] = self::LEGS[$from.'|'.$to] ?? self::LEGS[$to.'|'.$from];
        $gap = min(20, intdiv($minutes, 5));

        return $this->ops->saveRecord($tid, 'routes', ['name' => $from.' → '.$to, 'from' => $from, 'to' => $to, 'durationMinutes' => $minutes, 'basePrice' => $fare, 'distanceKm' => $km,
            'pickups' => [
                ['id' => 'pickup-office', 'name' => 'Văn phòng nhà xe '.$from, 'address' => 'Trung tâm '.$from, 'offset' => 0],
                ['id' => 'pickup-station', 'name' => self::STATIONS[$from][0], 'address' => self::STATIONS[$from][1], 'offset' => $gap],
            ],
            'dropoffs' => [
                ['id' => 'dropoff-station', 'name' => self::STATIONS[$to][0], 'address' => self::STATIONS[$to][1], 'offset' => $minutes - $gap],
                ['id' => 'dropoff-office', 'name' => 'Văn phòng nhà xe '.$to, 'address' => 'Trung tâm '.$to, 'offset' => $minutes],
            ]], null);
    }

    /** Weekend fares (Fri–Sun) are 10% higher, rounded to 10,000đ, like most operators. */
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
