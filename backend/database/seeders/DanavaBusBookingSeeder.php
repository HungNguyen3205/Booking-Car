<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\AuditLog;
use App\Models\BookingTransaction;
use App\Models\BusTrip;
use App\Models\BusVehicle;
use App\Models\CustomerNote;
use App\Models\Driver;
use App\Models\Partner;
use App\Models\PartnerDomain;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\Promotion;
use App\Models\Reconciliation;
use App\Models\Route;
use App\Models\RouteStop;
use App\Models\SeatLayout;
use App\Models\SystemSetting;
use App\Models\TicketBooking;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DanavaBusBookingSeeder extends Seeder
{
    public function run(): void
    {
        // 1. System Settings
        $settings = [
            'site_name' => 'DANAVA Go - Hệ Thống Quản Lý Đặt Vé Xe Khách',
            'site_logo' => '/assets/images/logo-danava.png',
            'hotline' => '1900 888 688',
            'support_email' => 'hotro@danavago.com',
            'company_address' => 'Tầng 18, Tòa nhà Indochina Riverside, 74 Bạch Đằng, Hải Châu, Đà Nẵng',
            'bank_name' => 'Vietcombank',
            'bank_account_number' => '1029384756',
            'bank_account_holder' => 'CONG TY CP CONG NGHE DANAVA GO',
            'bank_bin' => '970436',
            'smtp_host' => 'smtp.gmail.com',
            'smtp_port' => '587',
            'smtp_username' => 'ticket@danavago.com',
            'smtp_from_name' => 'DANAVA Go Vé Điện Tử',
            'smtp_from_address' => 'no-reply@danavago.com',
            'sms_brandname' => 'DANAVAGO',
            'sms_api_key' => 'ESMS_API_KEY_LIVE_2026',
            'vnpay_tmn_code' => 'DANAVAGO',
            'vnpay_hash_secret' => 'SECRET_VNPAY_HASH_KEY_2026',
            'vnpay_url' => 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
            'momo_partner_code' => 'MOMO_DANAVAGO',
            'momo_access_key' => 'ACCESS_KEY_MOMO_2026',
        ];

        foreach ($settings as $k => $v) {
            SystemSetting::updateOrCreate(
                ['key' => $k],
                [
                    'value' => $v,
                    'type' => 'string',
                    'group' => str_contains($k, 'smtp') ? 'mail' : (str_contains($k, 'vnpay') || str_contains($k, 'momo') || str_contains($k, 'bank') ? 'payment' : 'general'),
                    'is_public' => !str_contains($k, 'secret') && !str_contains($k, 'password'),
                    'description' => 'Cấu hình hệ thống DANAVA Go',
                ]
            );
        }

        // 2. Admins & Staff
        $adminsData = [
            [
                'ho_ten' => 'Admin Nền Tảng (Super Admin)',
                'email' => 'admin@danavago.com',
                'password' => Hash::make('Admin@2026!Pass'),
                'so_dien_thoai' => '0905123456',
                'role' => 'admin',
                'dia_chi' => 'Hải Châu, Đà Nẵng',
                'tinh_trang' => 1,
            ],
            [
                'ho_ten' => 'Nguyễn Hùng (Quản Trị Viên)',
                'email' => 'manager@danavago.com',
                'password' => Hash::make('Manager@2026!Pass'),
                'so_dien_thoai' => '0912345678',
                'role' => 'manager',
                'dia_chi' => 'Cẩm Lệ, Đà Nẵng',
                'tinh_trang' => 1,
            ],
            [
                'ho_ten' => 'Lê Thanh Thảo (Điều Hành Tour/Vé)',
                'email' => 'dispatcher@danavago.com',
                'password' => Hash::make('Dispatcher@2026!Pass'),
                'so_dien_thoai' => '0935987654',
                'role' => 'dispatcher',
                'dia_chi' => 'Sơn Trà, Đà Nẵng',
                'tinh_trang' => 1,
            ],
            [
                'ho_ten' => 'Trần Văn Long (Nhân Viên Cửa Ông Limousine)',
                'email' => 'staff@cuaonglimousine.com',
                'password' => Hash::make('Staff@2026!Pass'),
                'so_dien_thoai' => '0988112233',
                'role' => 'operator_staff',
                'dia_chi' => 'Cẩm Phả, Quảng Ninh',
                'tinh_trang' => 1,
            ],
        ];

        foreach ($adminsData as $adm) {
            Admin::updateOrCreate(['email' => $adm['email']], $adm);
        }

        // 3. Partners (Nhà xe đối tác)
        $p1 = Partner::updateOrCreate(
            ['slug' => 'danava-go'],
            [
                'name' => 'DANAVA Go Vận Tải',
                'phone' => '1900 888 688',
                'email' => 'booking@danavago.com',
                'address' => '74 Bạch Đằng, Hải Châu, Đà Nẵng',
                'commission_rate' => 0.00,
                'contract_number' => 'HD-DIRECT-2026',
                'bank_name' => 'Vietcombank',
                'bank_account' => '1029384756',
                'bank_holder' => 'CONG TY CP CONG NGHE DANAVA GO',
                'branding' => [
                    'primary_color' => '#1e3a8a',
                    'hotline' => '1900 888 688',
                    'logo' => '/assets/images/partners/danava-logo.png',
                ],
                'status' => 'active',
            ]
        );

        $p2 = Partner::updateOrCreate(
            ['slug' => 'cua-ong-limousine'],
            [
                'name' => 'Cửa Ông Limousine',
                'phone' => '0961 888 888',
                'email' => 'info@cuaonglimousine.com',
                'address' => 'Khu đô thị Cẩm Bình, Cẩm Phả, Quảng Ninh',
                'commission_rate' => 12.00,
                'contract_number' => 'HD-2026/COL-DANAVA',
                'bank_name' => 'Techcombank',
                'bank_account' => '19034567891234',
                'bank_holder' => 'CONG TY TNHH CUA ONG LIMOUSINE',
                'branding' => [
                    'primary_color' => '#0d9488',
                    'hotline' => '0961 888 888',
                    'logo' => '/assets/images/partners/cuaong.png',
                ],
                'status' => 'active',
            ]
        );

        $p3 = Partner::updateOrCreate(
            ['slug' => 'hai-van-xanh'],
            [
                'name' => 'Hải Vân Xanh',
                'phone' => '0236 3767 676',
                'email' => 'contact@haivanxanh.com.vn',
                'address' => 'Bến xe Trung tâm Đà Nẵng, Tôn Đức Thắng, Liên Chiểu, Đà Nẵng',
                'commission_rate' => 10.00,
                'contract_number' => 'HD-2026/HVX-DANAVA',
                'bank_name' => 'BIDV',
                'bank_account' => '56110001234567',
                'bank_holder' => 'CONG TY CP VAN TAI HAI VAN XANH',
                'branding' => [
                    'primary_color' => '#2563eb',
                    'hotline' => '0236 3767 676',
                    'logo' => '/assets/images/partners/haivan.png',
                ],
                'status' => 'active',
            ]
        );

        // 4. Partner Domains (App & Tên miền)
        PartnerDomain::updateOrCreate(
            ['app_slug' => 'cuaonglimousine'],
            [
                'partner_id' => $p2->id,
                'domain' => 'cuaonglimousine.com',
                'subdomain' => 'cuaong.danavago.com',
                'app_slug' => 'cuaonglimousine',
                'is_verified' => true,
                'ssl_status' => 'active',
                'settings' => [
                    'theme_color' => '#0d9488',
                    'show_operator_only' => true,
                    'header_title' => 'Cửa Ông Limousine - Tuyến Hà Nội ⇄ Quảng Ninh',
                ],
            ]
        );

        PartnerDomain::updateOrCreate(
            ['app_slug' => 'haivanxanh'],
            [
                'partner_id' => $p3->id,
                'domain' => null,
                'subdomain' => 'haivanxanh.danavago.com',
                'app_slug' => 'haivanxanh',
                'is_verified' => true,
                'ssl_status' => 'active',
                'settings' => [
                    'theme_color' => '#2563eb',
                    'show_operator_only' => true,
                    'header_title' => 'Hải Vân Xanh - Xe Cao Cấp Huế ⇄ Đà Nẵng ⇄ Hội An',
                ],
            ]
        );

        // 5. Seat Layouts (Sơ đồ ghế)
        // Layout 1: Limousine 9 chỗ
        $layoutLimo = SeatLayout::updateOrCreate(
            ['name' => 'Limousine Skybus VIP 9 chỗ'],
            [
                'partner_id' => $p2->id,
                'vehicle_type' => 'limousine',
                'total_seats' => 9,
                'floors' => 1,
                'rows' => 4,
                'columns' => 3,
                'layout_matrix' => [
                    'floor_1' => [
                        [
                            ['code' => 'D0', 'label' => 'Tài xế', 'type' => 'driver', 'is_seat' => false],
                            ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false],
                            ['code' => 'A01', 'label' => 'A01', 'type' => 'front', 'is_seat' => true, 'price_extra' => 0],
                        ],
                        [
                            ['code' => 'VIP-01', 'label' => 'VIP 1', 'type' => 'vip', 'is_seat' => true, 'price_extra' => 30000],
                            ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false],
                            ['code' => 'VIP-02', 'label' => 'VIP 2', 'type' => 'vip', 'is_seat' => true, 'price_extra' => 30000],
                        ],
                        [
                            ['code' => 'VIP-03', 'label' => 'VIP 3', 'type' => 'vip', 'is_seat' => true, 'price_extra' => 30000],
                            ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false],
                            ['code' => 'VIP-04', 'label' => 'VIP 4', 'type' => 'vip', 'is_seat' => true, 'price_extra' => 30000],
                        ],
                        [
                            ['code' => 'B01', 'label' => 'B01', 'type' => 'standard', 'is_seat' => true, 'price_extra' => 0],
                            ['code' => 'B02', 'label' => 'B02', 'type' => 'standard', 'is_seat' => true, 'price_extra' => 0],
                            ['code' => 'B03', 'label' => 'B03', 'type' => 'standard', 'is_seat' => true, 'price_extra' => 0],
                        ],
                    ],
                ],
            ]
        );

        // Layout 2: Giường nằm VIP 2 tầng
        $layoutSleeper = SeatLayout::updateOrCreate(
            ['name' => 'Cabin Đôi VIP 22 Phòng (2 Tầng)'],
            [
                'partner_id' => $p3->id,
                'vehicle_type' => 'sleeper',
                'total_seats' => 22,
                'floors' => 2,
                'rows' => 6,
                'columns' => 3,
                'layout_matrix' => [
                    'floor_1' => [
                        [['code' => 'A01', 'label' => 'T1-01', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'B01', 'label' => 'T1-02', 'type' => 'cabin', 'is_seat' => true]],
                        [['code' => 'A02', 'label' => 'T1-03', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'B02', 'label' => 'T1-04', 'type' => 'cabin', 'is_seat' => true]],
                        [['code' => 'A03', 'label' => 'T1-05', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'B03', 'label' => 'T1-06', 'type' => 'cabin', 'is_seat' => true]],
                        [['code' => 'A04', 'label' => 'T1-07', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'B04', 'label' => 'T1-08', 'type' => 'cabin', 'is_seat' => true]],
                        [['code' => 'A05', 'label' => 'T1-09', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'B05', 'label' => 'T1-10', 'type' => 'cabin', 'is_seat' => true]],
                        [['code' => 'A06', 'label' => 'T1-11', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'B06', 'label' => 'T1-12', 'type' => 'cabin', 'is_seat' => true]],
                    ],
                    'floor_2' => [
                        [['code' => 'C01', 'label' => 'T2-01', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'D01', 'label' => 'T2-02', 'type' => 'cabin', 'is_seat' => true]],
                        [['code' => 'C02', 'label' => 'T2-03', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'D02', 'label' => 'T2-04', 'type' => 'cabin', 'is_seat' => true]],
                        [['code' => 'C03', 'label' => 'T2-05', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'D03', 'label' => 'T2-06', 'type' => 'cabin', 'is_seat' => true]],
                        [['code' => 'C04', 'label' => 'T2-07', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'D04', 'label' => 'T2-08', 'type' => 'cabin', 'is_seat' => true]],
                        [['code' => 'C05', 'label' => 'T2-09', 'type' => 'cabin', 'is_seat' => true], ['code' => null, 'label' => '', 'type' => 'aisle', 'is_seat' => false], ['code' => 'D05', 'label' => 'T2-10', 'type' => 'cabin', 'is_seat' => true]],
                    ],
                ],
            ]
        );

        // 6. Bus Vehicles (Đội xe)
        $v1 = BusVehicle::updateOrCreate(
            ['plate_number' => '14B-035.88'],
            [
                'partner_id' => $p2->id,
                'seat_layout_id' => $layoutLimo->id,
                'name' => 'DCar President Skybus VIP',
                'category' => 'limousine',
                'capacity' => 9,
                'floor_count' => 1,
                'amenities' => ['Ghế massage', 'Màn hình riêng', 'WiFi 5G', 'Cổng sạc Type-C', 'Nước suối lạnh'],
                'image_url' => '/assets/images/bus-skybus.webp',
                'inspection_date' => '2027-08-15',
                'status' => 'active',
            ]
        );

        $v2 = BusVehicle::updateOrCreate(
            ['plate_number' => '43B-029.11'],
            [
                'partner_id' => $p3->id,
                'seat_layout_id' => $layoutSleeper->id,
                'name' => 'Mobihome Cabin Cung Điện Di Động',
                'category' => 'sleeper',
                'capacity' => 22,
                'floor_count' => 2,
                'amenities' => ['Rèm riêng tư', 'Tai nghe chống ồn', 'Tivi HD', 'Đệm cao su non', 'Chăn đắp'],
                'image_url' => '/assets/images/bus-cabin.webp',
                'inspection_date' => '2027-11-20',
                'status' => 'active',
            ]
        );

        $v3 = BusVehicle::updateOrCreate(
            ['plate_number' => '43B-088.99'],
            [
                'partner_id' => $p1->id,
                'seat_layout_id' => $layoutLimo->id,
                'name' => 'DANAVA Luxury Transit 11 chỗ',
                'category' => 'limousine',
                'capacity' => 11,
                'floor_count' => 1,
                'amenities' => ['WiFi', 'Điều hòa', 'Sạc điện thoại'],
                'image_url' => '/assets/images/bus-limo.webp',
                'inspection_date' => '2027-05-10',
                'status' => 'active',
            ]
        );

        // 7. Drivers
        $d1 = Driver::updateOrCreate(
            ['phone' => '0912345678'],
            [
                'partner_id' => $p2->id,
                'name' => 'Nguyễn Văn Tuấn',
                'license_number' => 'GPLX-7901234',
                'license_class' => 'D',
                'license_expiry' => '2029-12-31',
                'status' => 'active',
            ]
        );

        $d2 = Driver::updateOrCreate(
            ['phone' => '0988765432'],
            [
                'partner_id' => $p3->id,
                'name' => 'Trần Đức Long',
                'license_number' => 'GPLX-4809876',
                'license_class' => 'E',
                'license_expiry' => '2030-06-30',
                'status' => 'active',
            ]
        );

        // 8. Routes & Stops
        // Route 1: Hà Nội -> Hạ Long (Cửa Ông)
        $r1 = Route::updateOrCreate(
            ['name' => 'Hà Nội ⇄ Hạ Long - Cửa Ông'],
            [
                'partner_id' => $p2->id,
                'from_city' => 'Hà Nội',
                'to_city' => 'Hạ Long',
                'distance_km' => 165,
                'duration_minutes' => 150,
                'base_price' => 260000,
                'status' => 'active',
            ]
        );

        RouteStop::updateOrCreate(
            ['route_id' => $r1->id, 'name' => 'Bến xe Mỹ Đình'],
            ['address' => '20 Phạm Hùng, Mỹ Đình 2, Nam Từ Liêm, Hà Nội', 'stop_type' => 'pickup', 'time_offset_minutes' => 0, 'extra_fee' => 0, 'sort_order' => 1]
        );
        RouteStop::updateOrCreate(
            ['route_id' => $r1->id, 'name' => 'Công viên Cầu Giấy'],
            ['address' => 'Đường Thành Thái, Dịch Vọng, Cầu Giấy, Hà Nội', 'stop_type' => 'pickup', 'time_offset_minutes' => 15, 'extra_fee' => 0, 'sort_order' => 2]
        );
        RouteStop::updateOrCreate(
            ['route_id' => $r1->id, 'name' => 'Cảng Tuần Châu'],
            ['address' => 'Khu du lịch Quốc tế Tuần Châu, TP. Hạ Long', 'stop_type' => 'dropoff', 'time_offset_minutes' => 130, 'extra_fee' => 0, 'sort_order' => 3]
        );
        RouteStop::updateOrCreate(
            ['route_id' => $r1->id, 'name' => 'Bến xe Bãi Cháy'],
            ['address' => 'Số 17 đường 279, Bãi Cháy, TP. Hạ Long', 'stop_type' => 'dropoff', 'time_offset_minutes' => 150, 'extra_fee' => 0, 'sort_order' => 4]
        );

        // Route 2: Huế -> Đà Nẵng
        $r2 = Route::updateOrCreate(
            ['name' => 'Huế ⇄ Đà Nẵng (Đèo & Hầm Hải Vân)'],
            [
                'partner_id' => $p3->id,
                'from_city' => 'Huế',
                'to_city' => 'Đà Nẵng',
                'distance_km' => 105,
                'duration_minutes' => 120,
                'base_price' => 180000,
                'status' => 'active',
            ]
        );

        RouteStop::updateOrCreate(
            ['route_id' => $r2->id, 'name' => 'Bến xe Phía Nam Huế'],
            ['address' => '97 An Dương Vương, TP. Huế', 'stop_type' => 'pickup', 'time_offset_minutes' => 0, 'extra_fee' => 0, 'sort_order' => 1]
        );
        RouteStop::updateOrCreate(
            ['route_id' => $r2->id, 'name' => 'Sân bay Quốc tế Đà Nẵng'],
            ['address' => 'Đường Duy Tân, Hòa Thuận Tây, Hải Châu, Đà Nẵng', 'stop_type' => 'dropoff', 'time_offset_minutes' => 110, 'extra_fee' => 20000, 'sort_order' => 2]
        );
        RouteStop::updateOrCreate(
            ['route_id' => $r2->id, 'name' => 'Bến xe Trung tâm Đà Nẵng'],
            ['address' => '185 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng', 'stop_type' => 'dropoff', 'time_offset_minutes' => 120, 'extra_fee' => 0, 'sort_order' => 3]
        );

        // Route 3: Đà Nẵng -> Hội An
        $r3 = Route::updateOrCreate(
            ['name' => 'Đà Nẵng ⇄ Phố Cổ Hội An'],
            [
                'partner_id' => $p1->id,
                'from_city' => 'Đà Nẵng',
                'to_city' => 'Hội An',
                'distance_km' => 32,
                'duration_minutes' => 45,
                'base_price' => 120000,
                'status' => 'active',
            ]
        );

        // 9. Trips (Chuyến chạy)
        $today = Carbon::today('Asia/Ho_Chi_Minh');

        $t1 = BusTrip::updateOrCreate(
            [
                'partner_id' => $p2->id,
                'route_id' => $r1->id,
                'depart_time' => (clone $today)->setTime(7, 30),
            ],
            [
                'bus_vehicle_id' => $v1->id,
                'driver_id' => $d1->id,
                'arrive_time' => (clone $today)->setTime(10, 0),
                'base_price' => 260000,
                'status' => 'scheduled',
                'seat_inventory' => [],
            ]
        );

        $t2 = BusTrip::updateOrCreate(
            [
                'partner_id' => $p2->id,
                'route_id' => $r1->id,
                'depart_time' => (clone $today)->setTime(14, 0),
            ],
            [
                'bus_vehicle_id' => $v1->id,
                'driver_id' => $d1->id,
                'arrive_time' => (clone $today)->setTime(16, 30),
                'base_price' => 260000,
                'status' => 'scheduled',
                'seat_inventory' => [],
            ]
        );

        $t3 = BusTrip::updateOrCreate(
            [
                'partner_id' => $p3->id,
                'route_id' => $r2->id,
                'depart_time' => (clone $today)->setTime(8, 0),
            ],
            [
                'bus_vehicle_id' => $v2->id,
                'driver_id' => $d2->id,
                'arrive_time' => (clone $today)->setTime(10, 0),
                'base_price' => 180000,
                'status' => 'scheduled',
                'seat_inventory' => [],
            ]
        );

        $t4 = BusTrip::updateOrCreate(
            [
                'partner_id' => $p1->id,
                'route_id' => $r3->id,
                'depart_time' => (clone $today)->setTime(9, 15),
            ],
            [
                'bus_vehicle_id' => $v3->id,
                'driver_id' => null,
                'arrive_time' => (clone $today)->setTime(10, 0),
                'base_price' => 120000,
                'status' => 'scheduled',
                'seat_inventory' => [],
            ]
        );

        // 10. Ticket Bookings (Đơn vé)
        $bookingsSeed = [
            [
                'booking_code' => 'DN-88421',
                'partner_id' => $p2->id,
                'trip_id' => $t1->id,
                'customer_name' => 'Nguyễn Minh Tuấn',
                'customer_phone' => '0912445566',
                'customer_email' => 'tuan.nguyen@gmail.com',
                'seats' => ['VIP-01', 'VIP-02'],
                'seat_count' => 2,
                'total_amount' => 580000,
                'discount_amount' => 50000,
                'final_amount' => 530000,
                'payment_status' => 'paid',
                'booking_status' => 'confirmed',
                'payment_method' => 'vnpay',
                'payment_ref' => 'VNP14889210',
                'notes' => 'Khách mang theo 1 hành lý xách tay 15kg',
            ],
            [
                'booking_code' => 'DN-92147',
                'partner_id' => $p2->id,
                'trip_id' => $t1->id,
                'customer_name' => 'Lê Thị Mai Hương',
                'customer_phone' => '0988776655',
                'customer_email' => 'maihuong@danavago.vn',
                'seats' => ['VIP-03'],
                'seat_count' => 1,
                'total_amount' => 290000,
                'discount_amount' => 0,
                'final_amount' => 290000,
                'payment_status' => 'paid',
                'booking_status' => 'confirmed',
                'payment_method' => 'bank_transfer',
                'payment_ref' => 'VCB992140',
                'notes' => 'Đón tại Công viên Cầu Giấy',
            ],
            [
                'booking_code' => 'DN-77319',
                'partner_id' => $p3->id,
                'trip_id' => $t3->id,
                'customer_name' => 'Hoàng Nhật Minh',
                'customer_phone' => '0905334455',
                'customer_email' => 'nhatminh@fpt.edu.vn',
                'seats' => ['A01'],
                'seat_count' => 1,
                'total_amount' => 180000,
                'discount_amount' => 0,
                'final_amount' => 180000,
                'payment_status' => 'paid',
                'booking_status' => 'confirmed',
                'payment_method' => 'momo',
                'payment_ref' => 'MOMO7731928',
                'notes' => 'Trả tại Sân bay Đà Nẵng',
            ],
            [
                'booking_code' => 'DN-65520',
                'partner_id' => $p1->id,
                'trip_id' => $t4->id,
                'customer_name' => 'Phạm Anh Khoa',
                'customer_phone' => '0934112233',
                'customer_email' => null,
                'seats' => ['A01', 'A02'],
                'seat_count' => 2,
                'total_amount' => 240000,
                'discount_amount' => 0,
                'final_amount' => 240000,
                'payment_status' => 'unpaid',
                'booking_status' => 'pending',
                'payment_method' => 'cash',
                'payment_ref' => null,
                'notes' => 'Thanh toán tiền mặt khi lên xe',
            ],
        ];

        foreach ($bookingsSeed as $bData) {
            $bk = TicketBooking::updateOrCreate(['booking_code' => $bData['booking_code']], $bData);

            if ($bk->payment_status === 'paid') {
                BookingTransaction::updateOrCreate(
                    ['reference_code' => $bk->payment_ref ?: ('TXN-' . $bk->booking_code)],
                    [
                        'booking_id' => $bk->id,
                        'partner_id' => $bk->partner_id,
                        'type' => 'payment',
                        'amount' => $bk->final_amount,
                        'status' => 'completed',
                        'method' => $bk->payment_method,
                        'reference_code' => $bk->payment_ref ?: ('TXN-' . $bk->booking_code),
                        'transaction_time' => Carbon::now(),
                        'note' => 'Thanh toán đơn vé ' . $bk->booking_code,
                    ]
                );
            }

            CustomerNote::create([
                'customer_phone' => $bk->customer_phone,
                'customer_name' => $bk->customer_name,
                'note' => 'Đặt vé thành công chuyến ' . $bk->booking_code . ' qua hệ thống',
                'admin_name' => 'Hệ thống tự động',
            ]);
        }

        // 11. Reconciliations (Đối soát & công nợ)
        Reconciliation::updateOrCreate(
            ['code' => 'DS-202610-COL'],
            [
                'partner_id' => $p2->id,
                'period_start' => '2026-10-01',
                'period_end' => '2026-10-31',
                'total_tickets' => 840,
                'total_revenue' => 218400000,
                'commission_rate' => 12.00,
                'commission_amount' => 26208000,
                'payout_amount' => 192192000,
                'status' => 'paid',
                'settled_at' => '2026-11-01 10:30:00',
                'payment_ref' => 'UNC-TCB-20261101-089',
                'notes' => 'Đã chuyển khoản thanh toán hoa hồng tháng 10/2026',
            ]
        );

        Reconciliation::updateOrCreate(
            ['code' => 'DS-202611-COL-W1'],
            [
                'partner_id' => $p2->id,
                'period_start' => '2026-11-01',
                'period_end' => '2026-11-07',
                'total_tickets' => 195,
                'total_revenue' => 50700000,
                'commission_rate' => 12.00,
                'commission_amount' => 6084000,
                'payout_amount' => 44616000,
                'status' => 'pending_approval',
                'settled_at' => null,
                'payment_ref' => null,
                'notes' => 'Kỳ đối soát tuần 1 tháng 11/2026',
            ]
        );

        // 12. Promotions
        Promotion::updateOrCreate(
            ['code' => 'DANAVAGO2026'],
            [
                'partner_id' => null,
                'title' => 'Chào mừng ra mắt DANAVA Go - Giảm 10%',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'min_order_amount' => 200000,
                'max_discount' => 100000,
                'usage_limit' => 1000,
                'used_count' => 142,
                'start_date' => '2026-01-01 00:00:00',
                'end_date' => '2026-12-31 23:59:59',
                'is_active' => true,
            ]
        );

        Promotion::updateOrCreate(
            ['code' => 'CUAONG50K'],
            [
                'partner_id' => $p2->id,
                'title' => 'Ưu đãi Cửa Ông Limousine - Giảm ngay 50.000đ',
                'discount_type' => 'fixed',
                'discount_value' => 50000,
                'min_order_amount' => 500000,
                'max_discount' => 50000,
                'usage_limit' => 300,
                'used_count' => 48,
                'start_date' => '2026-10-01 00:00:00',
                'end_date' => '2026-11-30 23:59:59',
                'is_active' => true,
            ]
        );

        // 13. Posts & Editorial
        $cat = PostCategory::updateOrCreate(
            ['slug' => 'khuyen-mai'],
            ['name' => 'Ưu đãi & Khuyến mãi', 'description' => 'Tin tức khuyến mãi vé xe giá rẻ']
        );

        Post::updateOrCreate(
            ['slug' => 'danava-go-chinh-thuc-ra-mat'],
            [
                'title' => 'DANAVA Go chính thức ra mắt hệ thống đặt vé xe trực tuyến cao cấp',
                'summary' => 'Nền tảng kết nối trực tiếp hành khách với các nhà xe Limousine, giường nằm chất lượng cao.',
                'content' => '<p>DANAVA Go mang đến giải pháp di chuyển thông minh, thuận tiện và an toàn trên toàn quốc.</p>',
                'featured_image' => '/assets/images/posts/hero-launch.webp',
                'category_id' => $cat->id,
                'status' => 'published',
                'views' => 1250,
            ]
        );
    }
}

