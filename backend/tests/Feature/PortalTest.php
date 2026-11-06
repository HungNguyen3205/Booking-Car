<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\OperatorService;
use App\Services\PortalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class PortalTest extends TestCase
{
    use RefreshDatabase;

    private function actor(): User
    {
        return User::create(['id' => (string) Str::uuid(), 'name' => 'QA', 'email' => 'qa@example.test', 'password' => Hash::make('only-local-test-password'), 'role' => 'platform', 'active' => true]);
    }

    public function test_custom_domain_requires_dns_ownership_and_platform_activation(): void
    {
        $u = $this->actor();
        $ops = app(OperatorService::class);
        $t = $ops->createTenant(['name' => 'Nhà xe QA', 'slug' => 'qa-bus'], $u);
        $p = app(PortalService::class);
        $p->save($t['id'], ['appEnabled' => true, 'appSlug' => 'qabus', 'customDomain' => 'app.qa-bus.example'], $u);
        $domain = DB::table('tenant_domains')->where('type', 'custom')->first();
        $this->actingAs($u)->postJson('/api/platform/domains/'.$domain->id.'/activate', ['hostingReady' => true])->assertStatus(409);
        $mock = \Mockery::mock(PortalService::class, [$ops])->makePartial();
        $mock->shouldReceive('txt')->once()->andReturn(['not-the-token']);
        try {
            $mock->verify($t['id'], $domain->id, $u);
            $this->fail('Wrong TXT must fail');
        } catch (HttpException $e) {
            $this->assertSame(422, $e->getStatusCode());
        }
        $this->assertSame('pending', DB::table('tenant_domains')->where('id', $domain->id)->value('status'));
        $good = \Mockery::mock(PortalService::class, [$ops])->makePartial();
        $good->shouldReceive('txt')->once()->andReturn(['danava-verification='.$domain->verification_token]);
        $good->verify($t['id'], $domain->id, $u);
        $this->assertSame('verified', DB::table('tenant_domains')->where('id', $domain->id)->value('status'));
        $this->actingAs($u)->postJson('/api/platform/domains/'.$domain->id.'/activate', ['hostingReady' => true])->assertOk();
        $this->getJson('https://app.qa-bus.example/api/public/context')->assertOk()->assertJsonPath('operator.id', $t['id']);
    }

    public function test_app_domain_collision_and_disabled_app_are_enforced(): void
    {
        $u = $this->actor();
        $ops = app(OperatorService::class);
        $a = $ops->createTenant(['name' => 'A', 'slug' => 'tenant-a'], $u);
        $b = $ops->createTenant(['name' => 'B', 'slug' => 'tenant-b'], $u);
        $p = app(PortalService::class);
        $p->save($a['id'], ['appEnabled' => true, 'appSlug' => 'tenant-a', 'customDomain' => ''], $u);
        $this->actingAs($u)->withHeader('X-Tenant-Id', $b['id'])->patchJson('/api/manage/app', ['appEnabled' => true, 'appSlug' => 'tenant-a', 'customDomain' => ''])->assertStatus(409);
        $p->save($a['id'], ['appEnabled' => false, 'appSlug' => 'tenant-a', 'customDomain' => ''], $u);
        $this->getJson('https://tenant-a.danavago.com/api/public/context')->assertNotFound();
    }

    public function test_platform_hosts_resolve_to_their_app_and_never_to_a_tenant(): void
    {
        foreach (['danavago.com' => 'marketplace', 'www.danavago.com' => 'marketplace', 'app.danavago.com' => 'platform-app', 'studio.danavago.com' => 'studio', 'admin.danavago.com' => 'admin'] as $host => $kind) {
            $this->getJson("https://$host/api/public/context")->assertOk()->assertJsonPath('kind', $kind)->assertJsonPath('operator', null);
        }
        $this->getJson('https://unknown-host.example/api/public/context')->assertNotFound();

        // Even an active row that claims a platform host must not hijack it.
        $u = $this->actor();
        $t = app(OperatorService::class)->createTenant(['name' => 'Hijack', 'slug' => 'hijack'], $u);
        app(PortalService::class)->save($t['id'], ['appEnabled' => true, 'appSlug' => 'hijack', 'customDomain' => ''], $u);
        DB::table('tenant_domains')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $t['id'], 'type' => 'custom', 'hostname' => 'studio.danavago.com', 'status' => 'active', 'verification_token' => Str::random(32), 'created_at' => now()->toIso8601String()]);
        $this->getJson('https://studio.danavago.com/api/public/context')->assertOk()->assertJsonPath('kind', 'studio')->assertJsonPath('operator', null);

        try {
            app(PortalService::class)->save($t['id'], ['appEnabled' => true, 'appSlug' => 'hijack', 'customDomain' => 'studio.danavago.com'], $u);
            $this->fail('A platform host must not be accepted as a custom domain');
        } catch (HttpException $e) {
            $this->assertSame(422, $e->getStatusCode());
        }
    }
}
