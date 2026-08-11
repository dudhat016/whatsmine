<?php

namespace Tests\Feature;

use App\Models\AdminUser;
use App\Models\User;
use App\Models\Workspace;
use App\Modules\Funnels\Models\Funnel;
use App\Modules\Funnels\Models\FunnelStep;
use App\Modules\Funnels\Models\FunnelPage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FunnelModuleTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->user = User::factory()->create([
            'role' => 'client',
            'email_verified_at' => now(),
        ]);

        $this->workspace = Workspace::factory()->create([
            'owner_id' => $this->user->id,
        ]);

        $this->user->update(['workspace_id' => $this->workspace->id]);
        $this->user->refresh();
    }

    public function test_can_view_funnel_list(): void
    {
        $response = $this->actingAs($this->user)->get(route('client.funnels.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Funnels/Index')
            ->has('funnels')
            ->has('usage')
        );
    }

    public function test_can_create_funnel(): void
    {
        $response = $this->actingAs($this->user)->post(route('client.funnels.store'), [
            'name' => 'High-Converting Sales Funnel',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('funnels', [
            'workspace_id' => $this->workspace->id,
            'name' => 'High-Converting Sales Funnel',
            'slug' => 'high-converting-sales-funnel',
        ]);
    }

    public function test_can_add_step_to_funnel(): void
    {
        $funnel = Funnel::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Optin Funnel',
            'slug' => 'optin-funnel',
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->user)->post(route('client.funnels.steps.store', $funnel->uuid), [
            'name' => 'Landing Page Step',
            'type' => 'optin',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);

        $this->assertDatabaseHas('funnel_steps', [
            'funnel_id' => $funnel->id,
            'name' => 'Landing Page Step',
            'type' => 'optin',
        ]);
    }

    public function test_public_funnel_render_route(): void
    {
        $funnel = Funnel::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Public Product Launch',
            'slug' => 'product-launch',
            'status' => 'published',
            'is_ready' => true,
        ]);

        $step = FunnelStep::create([
            'funnel_id' => $funnel->id,
            'name' => 'Landing',
            'type' => 'optin',
            'sort_order' => 1,
        ]);

        FunnelPage::create([
            'funnel_step_id' => $step->id,
            'variant' => 'A',
            'is_control' => true,
            'canvas_json' => ['sections' => []],
            'html_cache' => '<!DOCTYPE html><html><head><title>Launch</title></head><body><h1>Welcome to Launch</h1></body></html>',
        ]);

        $response = $this->get('/f/' . $this->workspace->id . '/' . $funnel->slug);

        $response->assertStatus(200);
        $response->assertSee('Welcome to Launch');
    }

    public function test_admin_can_suspend_funnel(): void
    {
        $this->withoutMiddleware([
            \App\Http\Middleware\EnsureLicensed::class,
            \App\Http\Middleware\RequirePermission::class,
        ]);

        $admin = AdminUser::factory()->create([
            'status' => AdminUser::STATUS_ACTIVE,
        ]);

        $funnel = Funnel::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Violating Funnel',
            'slug' => 'violating-funnel',
            'status' => 'published',
        ]);

        $response = $this->actingAs($admin, 'admin')->post(route('admin.funnels.suspend', $funnel), [
            'reason' => 'Policy violation',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('funnels', [
            'id' => $funnel->id,
            'status' => 'suspended',
        ]);
    }
}
