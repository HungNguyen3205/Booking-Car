<?php

namespace App\Http\Controllers;

use App\Services\PortalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PortalController extends Controller
{
    public function context(Request $r, PortalService $p)
    {
        return $p->context($r);
    }

    public function profile(string $slug, PortalService $p)
    {
        $profile = $p->profile($slug);
        $tid = $p->tenantForHost(request());
        abort_if($tid && $profile['id'] !== $tid, 404, 'Không tìm thấy nhà xe trong app này');

        return $profile;
    }

    public function settings(Request $r, PortalService $p)
    {
        $tid = $this->tid($r);
        $u = $this->role($r, ['owner', 'manager']);
        if ($r->isMethod('GET')) {
            return ['operator' => $p->profile($this->ops->tenant($tid)['slug']), 'domains' => $p->domains($tid), 'wildcardReady' => config('portals.wildcard_ready')];
        }

        return $p->save($tid, $r->all(), $u);
    }

    public function verify(Request $r, string $id, PortalService $p)
    {
        $tid = $this->tid($r);
        $u = $this->role($r, ['owner', 'manager']);

        return $p->verify($tid, $id, $u);
    }

    public function activate(Request $r, string $id)
    {
        $u = $this->role($r, []);
        $b = $r->validate(['hostingReady' => 'required|accepted']);
        $domain = DB::table('tenant_domains')->where('id', $id)->first();
        abort_unless($domain && $domain->type === 'custom' && $domain->status === 'verified', 409, 'Tên miền cần xác minh TXT trước');
        DB::table('tenant_domains')->where('id', $id)->update(['status' => 'active']);
        $this->ops->audit($u, $domain->tenant_id, 'domain.active', $id);

        return ['ok' => true];
    }
}
