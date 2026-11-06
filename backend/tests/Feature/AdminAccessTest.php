<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\OperatorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Studio API (/api/admin/*): login required; operator accounts are scoped to
 * their own operator and limited by role; platform-only areas stay platform-only.
 * The end-to-end behaviour is covered by backend/tests/studio-live.test.mjs.
 */
class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, ?string $tenantId = null): User
    {
        return User::create(['id' => (string) Str::uuid(), 'tenant_id' => $tenantId, 'name' => 'QA '.$role, 'email' => $role.Str::random(4).'@example.test',
            'password' => Hash::make('only-local-test-password'), 'role' => $role, 'active' => true]);
    }

    public function test_studio_api_rejects_guests(): void
    {
        foreach (['bookings', 'statistics', 'staff', 'settings', 'partners', 'cashbook'] as $path) {
            $this->getJson('/api/admin/'.$path)->assertStatus(401);
        }
    }

    public function test_operator_accounts_are_scoped_and_role_limited(): void
    {
        $platform = $this->user('platform');
        $ops = app(OperatorService::class);
        $a = $ops->createTenant(['name' => 'Nhà xe A', 'slug' => 'qa-a'], $platform);
        $b = $ops->createTenant(['name' => 'Nhà xe B', 'slug' => 'qa-b'], $platform);
        $owner = $this->user('owner', $a['id']);
        $sales = $this->user('sales', $a['id']);

        $this->actingAs($owner)->getJson('/api/admin/bookings')->assertOk();
        $this->actingAs($owner)->getJson('/api/admin/partners')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $a['id']);
        $this->actingAs($owner)->getJson('/api/admin/partners?partner_id='.$b['id'])->assertStatus(403);
        $this->actingAs($owner)->getJson('/api/admin/settings')->assertStatus(403);
        $this->actingAs($sales)->getJson('/api/admin/staff')->assertStatus(403);
        $this->actingAs($sales)->getJson('/api/admin/cashbook')->assertStatus(403);
    }

    public function test_platform_admin_sees_every_operator(): void
    {
        $platform = $this->user('platform');
        $ops = app(OperatorService::class);
        $ops->createTenant(['name' => 'Nhà xe A', 'slug' => 'qa-a'], $platform);
        $ops->createTenant(['name' => 'Nhà xe B', 'slug' => 'qa-b'], $platform);
        $this->actingAs($platform)->getJson('/api/admin/partners')->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs($platform)->getJson('/api/admin/statistics')->assertOk()->assertJsonPath('status', 1);
    }
}
