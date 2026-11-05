<?php

namespace App\Http\Controllers;

use App\Services\PortalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlatformController extends Controller
{
    public function index(Request $r)
    {
        $this->role($r, []);

        return ['items' => DB::table('tenants')->orderBy('created_at')->get()->map(fn ($t) => $this->ops->tenant($t->id))];
    }

    public function store(Request $r)
    {
        $u = $this->role($r, []);

        return response()->json($this->ops->createTenant($r->all(), $u), 201);
    }

    public function update(Request $r, string $id)
    {
        $u = $this->role($r, []);
        $t = $this->ops->tenant($id);
        $b = $r->validate(['status' => 'nullable|in:active,pending,suspended', 'autoPublish' => 'nullable|boolean', 'commissionBps' => 'nullable|integer|min:0|max:5000']);
        $t['autoPublish'] = $b['autoPublish'] ?? $t['autoPublish'];
        $t['commissionBps'] = (int) ($b['commissionBps'] ?? $t['commissionBps']);
        DB::table('tenants')->where('id', $id)->update(['status' => $b['status'] ?? $t['status'], 'data' => $this->ops->json($t)]);
        $this->ops->audit($u, $id, 'tenant.status', $id);

        return $this->ops->tenant($id);
    }

    public function seed(Request $r)
    {
        $u = $this->role($r, []);
        abort_unless(config('danava.allow_demo'), 403, 'Demo seed đang tắt');
        $result = $this->ops->seed($u);
        app(PortalService::class)->seedCuaOng($u);

        return response()->json($result, 201);
    }
}
