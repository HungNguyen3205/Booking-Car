<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\PlatformController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\StudioController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\TicketBookingController as AdminTicketBookingController;
use App\Http\Controllers\Admin\TripController as AdminTripController;
use App\Http\Controllers\Admin\RouteController as AdminRouteController;
use App\Http\Controllers\Admin\BusVehicleController as AdminBusVehicleController;
use App\Http\Controllers\Admin\PassengerController as AdminPassengerController;
use App\Http\Controllers\Admin\PartnerController as AdminPartnerController;
use App\Http\Controllers\Admin\PartnerDomainController as AdminPartnerDomainController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\ReconciliationController as AdminReconciliationController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\PromotionController as AdminPromotionController;
use App\Http\Controllers\Admin\AdminController as AdminStaffController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\AuditLogController as AdminAuditLogController;
use App\Services\OperatorService;
use App\Services\PortalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::prefix('api')->middleware('auth.session')->group(function () {
    Route::get('health', fn () => ['ok' => true, 'version' => 2, 'backend' => 'laravel']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/setup', [AuthController::class, 'setup'])->middleware('throttle:8,15');
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::patch('auth/password', [AuthController::class, 'password']);
    Route::get('public/operators', [MarketplaceController::class, 'operators']);
    Route::get('public/operators/{slug}', [PortalController::class, 'profile']);
    Route::get('public/context', [PortalController::class, 'context']);
    Route::get('public/cities', [MarketplaceController::class, 'cities']);
    Route::get('public/search', [MarketplaceController::class, 'search']);
    Route::post('public/holds', [MarketplaceController::class, 'hold'])->middleware('throttle:60,1');
    Route::delete('public/holds/{id}', [MarketplaceController::class, 'release']);
    Route::post('public/bookings', [MarketplaceController::class, 'reserve'])->middleware('throttle:30,1');
    Route::post('public/lookup', [MarketplaceController::class, 'lookup']);

    // DANAVA Go Admin APIs (Quản trị toàn diện hệ thống)
    Route::prefix('admin')->group(function () {
        // 1. TỔNG QUAN
        Route::get('statistics', [AdminDashboardController::class, 'getStatistics']);

        // 2. VẬN HÀNH
        Route::get('bookings', [AdminTicketBookingController::class, 'index']);
        Route::get('bookings/{id}', [AdminTicketBookingController::class, 'show']);
        Route::post('bookings', [AdminTicketBookingController::class, 'store']);
        Route::patch('bookings/{id}', [AdminTicketBookingController::class, 'update']);
        Route::post('bookings/{id}/confirm-payment', [AdminTicketBookingController::class, 'confirmPayment']);
        Route::delete('bookings/{id}', [AdminTicketBookingController::class, 'destroy']);

        Route::get('trips', [AdminTripController::class, 'index']);
        Route::get('trips/{id}', [AdminTripController::class, 'show']);
        Route::post('trips', [AdminTripController::class, 'store']);
        Route::patch('trips/{id}', [AdminTripController::class, 'update']);
        Route::get('trips/{id}/manifest', [AdminTripController::class, 'manifest']);
        Route::delete('trips/{id}', [AdminTripController::class, 'destroy']);

        Route::get('routes', [AdminRouteController::class, 'index']);
        Route::get('routes/{id}', [AdminRouteController::class, 'show']);
        Route::post('routes', [AdminRouteController::class, 'store']);
        Route::patch('routes/{id}', [AdminRouteController::class, 'update']);
        Route::delete('routes/{id}', [AdminRouteController::class, 'destroy']);

        Route::get('vehicles', [AdminBusVehicleController::class, 'index']);
        Route::get('vehicles/{id}', [AdminBusVehicleController::class, 'show']);
        Route::post('vehicles', [AdminBusVehicleController::class, 'store']);
        Route::patch('vehicles/{id}', [AdminBusVehicleController::class, 'update']);
        Route::delete('vehicles/{id}', [AdminBusVehicleController::class, 'destroy']);
        Route::get('seat-layouts', [AdminBusVehicleController::class, 'getSeatLayouts']);
        Route::post('seat-layouts', [AdminBusVehicleController::class, 'saveSeatLayout']);
        Route::delete('seat-layouts/{id}', [AdminBusVehicleController::class, 'deleteSeatLayout']);

        Route::get('passengers', [AdminPassengerController::class, 'index']);
        Route::get('passengers/{phone}', [AdminPassengerController::class, 'show']);
        Route::post('passengers/{phone}/notes', [AdminPassengerController::class, 'addNote']);

        // 3. ĐỐI TÁC
        Route::get('partners', [AdminPartnerController::class, 'index']);
        Route::get('partners/{id}', [AdminPartnerController::class, 'show']);
        Route::post('partners', [AdminPartnerController::class, 'store']);
        Route::patch('partners/{id}', [AdminPartnerController::class, 'update']);
        Route::delete('partners/{id}', [AdminPartnerController::class, 'destroy']);

        Route::get('partner-domains', [AdminPartnerDomainController::class, 'index']);
        Route::post('partner-domains', [AdminPartnerDomainController::class, 'store']);
        Route::patch('partner-domains/{id}', [AdminPartnerDomainController::class, 'update']);
        Route::post('partner-domains/{id}/verify', [AdminPartnerDomainController::class, 'verify']);

        // 4. TÀI CHÍNH
        Route::get('payments', [AdminPaymentController::class, 'index']);
        Route::post('payments', [AdminPaymentController::class, 'store']);
        Route::patch('payments/{id}/status', [AdminPaymentController::class, 'updateStatus']);

        Route::get('reconciliations', [AdminReconciliationController::class, 'index']);
        Route::get('reconciliations/{id}', [AdminReconciliationController::class, 'show']);
        Route::post('reconciliations/generate', [AdminReconciliationController::class, 'generate']);
        Route::post('reconciliations/{id}/settle', [AdminReconciliationController::class, 'settle']);

        Route::get('reports', [AdminReportController::class, 'getSummary']);
        Route::get('reports/export', [AdminReportController::class, 'exportCsv']);

        // 5. HỆ THỐNG
        Route::get('promotions', [AdminPromotionController::class, 'index']);
        Route::post('promotions', [AdminPromotionController::class, 'store']);
        Route::patch('promotions/{id}', [AdminPromotionController::class, 'update']);
        Route::delete('promotions/{id}', [AdminPromotionController::class, 'destroy']);

        Route::get('staff', [AdminStaffController::class, 'getData']);
        Route::post('staff', [AdminStaffController::class, 'createData']);
        Route::post('staff/update', [AdminStaffController::class, 'updateData']);
        Route::post('staff/delete', [AdminStaffController::class, 'deleteData']);
        Route::post('staff/status', [AdminStaffController::class, 'statusData']);

        Route::get('settings', [AdminSettingController::class, 'index']);
        Route::put('settings', [AdminSettingController::class, 'update']);

        Route::get('audit-logs', [AdminAuditLogController::class, 'index']);
    });

    Route::middleware('auth')->group(function () {
        Route::get('platform/tenants', [PlatformController::class, 'index']);
        Route::post('platform/tenants', [PlatformController::class, 'store']);
        Route::patch('platform/tenants/{id}', [PlatformController::class, 'update']);
        Route::post('platform/demo', [PlatformController::class, 'seed']);
        Route::post('platform/domains/{id}/activate', [PortalController::class, 'activate']);
        Route::match(['GET', 'PATCH'], 'manage/app', [PortalController::class, 'settings']);
        Route::post('manage/domains/{id}/verify', [PortalController::class, 'verify']);
        Route::match(['GET', 'PATCH'], 'manage/settings', [StudioController::class, 'settings']);
        Route::get('manage/dashboard', [StudioController::class, 'dashboard']);
        Route::match(['GET', 'POST'], 'manage/trips', [StudioController::class, 'trips']);
        Route::patch('manage/trips/{id}', [StudioController::class, 'trip']);
        Route::patch('manage/trips/{id}/status', [StudioController::class, 'status']);
        Route::get('manage/trips/{id}/manifest', [StudioController::class, 'manifest']);
        Route::match(['GET', 'POST'], 'manage/bookings', [StudioController::class, 'orders']);
        Route::patch('manage/bookings/{id}', [StudioController::class, 'order']);
        Route::match(['GET', 'POST'], 'manage/ledger', [StudioController::class, 'ledger']);
        Route::get('manage/reports', [StudioController::class, 'reports']);
        Route::get('manage/customers', [StudioController::class, 'customers']);
        Route::match(['GET', 'POST'], 'manage/staff', [StudioController::class, 'staff']);
        Route::patch('manage/staff/{id}', [StudioController::class, 'staffUpdate']);
        Route::get('manage/audit', [StudioController::class, 'audit']);
        Route::get('manage/notices', [StudioController::class, 'notices']);
        Route::post('manage/notices/read', [StudioController::class, 'notices']);
        Route::post('manage/upload', [StudioController::class, 'upload']);
        Route::match(['GET', 'POST', 'PATCH', 'DELETE'], 'manage/{kind}/{id?}', [StudioController::class, 'resource'])->whereIn('kind', OperatorService::KINDS);
    });

    Route::any('{path}', fn () => abort(404, 'API không tồn tại'))->where('path', '.*');
});

Route::get('uploads/{file}', function (string $file) {
    abort_unless(preg_match('/^[a-zA-Z0-9-]+\.(png|jpg|webp)$/', $file) && Storage::disk('public')->exists($file), 404);

    return Storage::disk('public')->response($file, null, ['X-Content-Type-Options' => 'nosniff']);
});

Route::get('{path?}', function (Request $r, PortalService $p) {
    $p->context($r);
    $file = public_path('spa.html');
    abort_unless(is_file($file), 503, 'Chưa có frontend build. Chạy npm run build và npm run build:hosting.');

    return response()->file($file, ['Cache-Control' => 'no-cache']);
})->where('path', '^(?!api(?:/|$)|uploads(?:/|$)).*');
