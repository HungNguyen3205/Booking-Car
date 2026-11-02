<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    private function view(User $u): array
    {
        return ['id' => $u->id, 'tenantId' => $u->tenant_id, 'name' => $u->name, 'email' => $u->email, 'role' => $u->role, 'active' => $u->active, 'driverId' => $u->driver_id];
    }

    private function signed(Request $r, User $u): array
    {
        Auth::login($u);
        $r->session()->regenerate();
        $r->session()->put('password_hash_web', $u->password);

        return ['user' => $this->view($u), 'csrf' => csrf_token()];
    }

    public function me(Request $r)
    {
        $u = $r->user();
        if ($u && (! $u->active || ($u->tenant_id && $this->ops->tenant($u->tenant_id)['status'] !== 'active'))) {
            Auth::logout();
            $u = null;
        }

        return ['user' => $u ? $this->view($u) : null, 'csrf' => csrf_token(), 'needsSetup' => ! User::exists(), 'demoSeedAllowed' => (bool) config('danava.allow_demo')];
    }

    public function setup(Request $r)
    {
        $secret = config('danava.setup_token');
        abort_unless(is_string($secret) && strlen($secret) >= 24, 503, 'Cần cấu hình DANAVA_SETUP_TOKEN riêng trên server');
        abort_unless(hash_equals($secret, (string) $r->input('setupToken')), 403, 'Mã thiết lập không hợp lệ');
        abort_if(User::exists(), 409, 'Hệ thống đã được thiết lập');
        $b = $r->validate(['name' => 'required|string|max:150', 'email' => 'required|email|max:200', 'password' => 'required|string|min:12|max:200']);
        $u = DB::transaction(function () use ($b) {
            DB::table('bootstrap_slots')->insert(['id' => 1]);

            return User::create(['id' => $this->ops->uuid(), 'tenant_id' => null, 'name' => $b['name'], 'email' => strtolower($b['email']), 'password' => Hash::make($b['password']), 'role' => 'platform', 'active' => true, 'created_at' => $this->ops->now()]);
        }, 3);

        return response()->json($this->signed($r, $u), 201);
    }

    public function login(Request $r)
    {
        $b = $r->validate(['email' => 'required|email', 'password' => 'required|string|max:200']);
        $key = 'login:'.hash('sha256', strtolower($b['email']).$r->ip());
        abort_if(RateLimiter::tooManyAttempts($key, 8), 429, 'Thử đăng nhập quá nhiều lần. Chờ 15 phút.');
        $u = User::where('email', strtolower($b['email']))->where('active', true)->first();
        if (! $u || ! Hash::check($b['password'], $u->password)) {
            RateLimiter::hit($key, 900);
            abort(401, 'Email hoặc mật khẩu chưa đúng');
        }if ($u->tenant_id) {
            abort_unless($this->ops->tenant($u->tenant_id)['status'] === 'active', 403, 'Nhà xe tạm ngưng');
        }RateLimiter::clear($key);

        return $this->signed($r, $u);
    }

    public function logout(Request $r)
    {
        $this->user($r);
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();

        return ['ok' => true, 'csrf' => csrf_token()];
    }

    public function password(Request $r)
    {
        $u = $this->user($r);
        $b = $r->validate(['currentPassword' => 'required|string|max:200', 'newPassword' => 'required|string|min:12|max:200']);
        $key = 'password:'.$u->id;
        abort_if(RateLimiter::tooManyAttempts($key, 8), 429, 'Thao tác quá nhiều lần');
        if (! Hash::check($b['currentPassword'], $u->password)) {
            RateLimiter::hit($key, 900);
            abort(401, 'Mật khẩu hiện tại chưa đúng');
        }$u->password = Hash::make($b['newPassword']);
        $u->save();
        $this->ops->audit($u, $u->tenant_id, 'account.password', $u->id);
        RateLimiter::clear($key);

        return $this->signed($r, $u);
    }
}
