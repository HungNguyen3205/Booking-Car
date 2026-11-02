<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\PlatformController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\StudioController;
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
