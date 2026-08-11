<?php

namespace App\Modules\Funnels;

use Illuminate\Support\ServiceProvider;

class FunnelsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');
    }
}
