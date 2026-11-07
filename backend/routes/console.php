<?php

use App\Services\OperatorService;
use App\Services\PortalService;
use Illuminate\Support\Facades\Artisan;

Artisan::command('danava:seed-demo', function (OperatorService $ops) {
    if (app()->environment('production') && ! config('danava.allow_demo')) {
        $this->error('Demo seed is disabled.');

        return 1;
    }
    $result = $ops->seed();
    app(PortalService::class)->seedCuaOng();
    $this->info(json_encode($result, JSON_UNESCAPED_UNICODE));
})->purpose('Create the DANAVAGO sample operator and future schedules');

Artisan::command('danava:seed-operators {--days=7 : Days of schedule to create from today}', function (App\Services\DemoMarketplace $demo) {
    if (app()->environment('production') && ! config('danava.allow_demo')) {
        $this->error('Demo seed is disabled.');

        return 1;
    }
    $days = max(1, min(30, (int) $this->option('days')));
    foreach ($demo->seed($days) as $row) {
        $this->line(sprintf('%-22s %-18s +%d chuyến', $row['operator'], $row['slug'], $row['newTrips']));
    }
})->purpose('Create fictional demo operators with real-corridor fares and published schedules');

Artisan::command('danava:seed-brand-demo {--days=7 : Days of schedule to create from today}', function (App\Services\BrandDemo $demo) {
    if (app()->environment('production') && ! config('danava.allow_demo')) {
        $this->error('Demo seed is disabled.');

        return 1;
    }
    foreach ($demo->seed(max(1, min(30, (int) $this->option('days')))) as $row) {
        $this->line(sprintf('%-20s %-24s +%d chuyến', $row['operator'], $row['app'], $row['newTrips']));
    }
})->purpose('Branded demo apps: Hải Vân Xanh (green) and Cửa Ông Limousine (brown) with routes, vans and trips');

// Forgotten Studio login: server-shell only (no email reset flow exists).
Artisan::command('danava:staff-list', function () {
    $rows = Illuminate\Support\Facades\DB::table('users')->leftJoin('tenants', 'users.tenant_id', '=', 'tenants.id')
        ->where('users.role', '!=', 'customer')->orderBy('users.role')->orderBy('users.email')
        ->get(['users.email', 'users.name', 'users.role', 'users.active', 'tenants.name as tenant']);
    $this->table(['Email', 'Tên', 'Vai trò', 'Nhà xe', 'Hoạt động'], $rows->map(fn ($u) => [$u->email, $u->name, $u->role, $u->tenant ?: '(nền tảng)', $u->active ? 'có' : 'khóa'])->all());
})->purpose('List Studio (non-customer) accounts to recall a login email');

Artisan::command('danava:reset-password {email : Studio login email}', function () {
    $email = strtolower(trim($this->argument('email')));
    $u = App\Models\User::where('email', $email)->where('role', '!=', 'customer')->first();
    if (! $u) {
        $this->error('Không có tài khoản Studio với email này. Xem danh sách: php artisan danava:staff-list');

        return 1;
    }
    $pass = (string) $this->secret('Mật khẩu mới (tối thiểu 12 ký tự)');
    if (mb_strlen($pass) < 12 || mb_strlen($pass) > 200) {
        $this->error('Mật khẩu phải dài 12–200 ký tự.');

        return 1;
    }
    if ($pass !== (string) $this->secret('Nhập lại mật khẩu mới')) {
        $this->error('Hai lần nhập không khớp.');

        return 1;
    }
    $u->password = Illuminate\Support\Facades\Hash::make($pass);
    $u->remember_token = null;
    $u->active = true;
    $u->save();
    $this->info("Đã đặt lại mật khẩu cho {$u->email} ({$u->role}).");
})->purpose('Reset a forgotten Studio password from the server shell');

Artisan::command('danava:create-admin {email : Login email} {name=Quản trị DANAVA : Display name} {--password= : Skip the prompt (lands in shell history)}', function (OperatorService $ops) {
    $email = strtolower(trim($this->argument('email')));
    if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $this->error('Email không hợp lệ.');

        return 1;
    }
    if (App\Models\User::where('email', $email)->exists()) {
        $this->error('Email đã có tài khoản. Đổi mật khẩu: php artisan danava:reset-password '.$email);

        return 1;
    }
    $pass = (string) ($this->option('password') ?: $this->secret('Mật khẩu (tối thiểu 12 ký tự)'));
    if (mb_strlen($pass) < 12 || mb_strlen($pass) > 200) {
        $this->error('Mật khẩu phải dài 12–200 ký tự.');

        return 1;
    }
    App\Models\User::create(['id' => $ops->uuid(), 'tenant_id' => null, 'name' => $this->argument('name'), 'email' => $email, 'password' => Illuminate\Support\Facades\Hash::make($pass), 'role' => 'platform', 'active' => true, 'created_at' => $ops->now()]);
    $this->info("Đã tạo tài khoản quản trị nền tảng {$email}.");
})->purpose('Create a platform Studio administrator from the server shell');
