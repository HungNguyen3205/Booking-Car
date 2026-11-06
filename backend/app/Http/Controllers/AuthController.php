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
        return ['id' => $u->id, 'tenantId' => $u->tenant_id, 'name' => $u->name, 'email' => $u->role === 'customer' ? '' : $u->email, 'role' => $u->role, 'active' => $u->active, 'driverId' => $u->driver_id,
            'phone' => $u->phone, 'mustChangePassword' => (bool) $u->must_change_password];
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
        if ($r->filled('phone')) {
            return $this->customerLogin($r);
        }
        $b = $r->validate(['email' => 'required|email', 'password' => 'required|string|max:200']);
        $key = 'login:'.hash('sha256', strtolower($b['email']).$r->ip());
        abort_if(RateLimiter::tooManyAttempts($key, 8), 429, 'Thử đăng nhập quá nhiều lần. Chờ 15 phút.');
        $u = User::where('email', strtolower($b['email']))->where('active', true)->where('role', '!=', 'customer')->first();
        if (! $u || ! Hash::check($b['password'], $u->password)) {
            RateLimiter::hit($key, 900);
            abort(401, 'Email hoặc mật khẩu chưa đúng');
        }if ($u->tenant_id) {
            abort_unless($this->ops->tenant($u->tenant_id)['status'] === 'active', 403, 'Nhà xe tạm ngưng');
        }RateLimiter::clear($key);

        return $this->signed($r, $u);
    }

    /**
     * Customer sign-in by phone. The temporary password is shared by design, so
     * attempts are limited per phone (any IP) as well as per phone + IP.
     */
    private function customerLogin(Request $r)
    {
        $b = $r->validate(['phone' => 'required|string|max:20', 'password' => 'required|string|max:200']);
        $phone = $this->ops->phone($b['phone']);
        $keys = ['clogin:'.hash('sha256', $phone.$r->ip()) => 6, 'clogin-phone:'.hash('sha256', $phone) => 20];
        foreach ($keys as $key => $max) {
            abort_if(RateLimiter::tooManyAttempts($key, $max), 429, 'Thử đăng nhập quá nhiều lần. Chờ 15 phút.');
        }
        $u = User::where('phone', $phone)->where('role', 'customer')->where('active', true)->first();
        if (! $u || ! Hash::check($b['password'], $u->password)) {
            foreach (array_keys($keys) as $key) {
                RateLimiter::hit($key, 900);
            }
            abort(401, 'Số điện thoại hoặc mật khẩu chưa đúng');
        }
        RateLimiter::clear(array_key_first($keys));

        return $this->signed($r, $u);
    }

    public function logout(Request $r)
    {
        $this->user($r, true);
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();

        return ['ok' => true, 'csrf' => csrf_token()];
    }

    public function password(Request $r)
    {
        $u = $this->user($r, true);
        $customer = $u->role === 'customer';
        $b = $r->validate(['currentPassword' => 'required|string|max:200', 'newPassword' => 'required|string|max:200|min:'.($customer ? 8 : 12)]);
        abort_if($customer && in_array($b['newPassword'], [\App\Services\CustomerAccounts::TEMP_PASSWORD, '12345678', '123456789', '00000000', '11111111', '87654321', $u->phone], true), 422, 'Mật khẩu quá dễ đoán, hãy chọn mật khẩu khác');
        abort_if($b['newPassword'] === $b['currentPassword'], 422, 'Mật khẩu mới phải khác mật khẩu hiện tại');
        $key = 'password:'.$u->id;
        abort_if(RateLimiter::tooManyAttempts($key, 8), 429, 'Thao tác quá nhiều lần');
        if (! Hash::check($b['currentPassword'], $u->password)) {
            RateLimiter::hit($key, 900);
            abort(401, 'Mật khẩu hiện tại chưa đúng');
        }$u->password = Hash::make($b['newPassword']);
        $u->must_change_password = false;
        $u->save();
        $this->ops->audit($u, $u->tenant_id, 'account.password', $u->id);
        RateLimiter::clear($key);

        return $this->signed($r, $u);
    }
}
