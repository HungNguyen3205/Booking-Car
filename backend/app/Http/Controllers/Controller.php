<?php

namespace App\Http\Controllers;

use App\Services\OperatorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

abstract class Controller
{
    public function __construct(protected OperatorService $ops) {}

    protected function user(Request $r, bool $allowCustomer = false): object
    {
        $u = $r->user();
        abort_unless($u && $u->active, 401, 'Vui lòng đăng nhập');
        // Customer accounts (created at checkout) only use /api/customer/* and their own password.
        abort_if($u->role === 'customer' && ! $allowCustomer, 403, 'Tài khoản khách không dùng được mục này');
        if ($u->tenant_id) {
            abort_unless($this->ops->tenant($u->tenant_id)['status'] === 'active', 401, 'Nhà xe tạm ngưng');
        }

        return $u;
    }

    protected function role(Request $r, array $roles): object
    {
        $u = $this->user($r);
        abort_unless($u->role === 'platform' || in_array($u->role, $roles), 403, 'Bạn chưa được cấp quyền thao tác này');

        return $u;
    }

    protected function tid(Request $r): string
    {
        $u = $this->user($r);
        $id = $r->header('X-Tenant-Id');
        if ($u->role === 'platform') {
            abort_unless($id && DB::table('tenants')->where('id', $id)->exists(), 422, 'Chọn nhà xe trước');

            return $id;
        }abort_if($id && $id !== $u->tenant_id, 403, 'Không có quyền truy cập nhà xe khác');

        return $u->tenant_id;
    }

    protected function tripRows(Request $r, string $tid)
    {
        $q = DB::table('trips')->where('tenant_id', $tid)->orderByDesc('depart_at');
        $u = $this->user($r);
        if ($u->role === 'driver') {
            $q->where('driver_id', $u->driver_id ?: 'unassigned');
        }

        return $q->get();
    }

    protected function bookings(Request $r, string $tid)
    {
        $q = DB::table('bookings')->where('tenant_id', $tid)->orderByDesc('created_at');
        if ($this->user($r)->role === 'driver') {
            $q->whereIn('trip_id', $this->tripRows($r, $tid)->pluck('id'));
        }

        return $q->get();
    }

    protected function csv(string $name, array $rows)
    {
        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            foreach ($rows as $row) {
                fputcsv($out, array_map(function ($v) {
                    $s = (string) ($v ?? '');

                    return preg_match('/^[=+@-]/', $s) ? "'".$s : $s;
                }, $row), ',', '"', '');
            }fclose($out);
        }, $name, ['Content-Type' => 'text/csv; charset=utf-8', 'Cache-Control' => 'no-store']);
    }
}
