<?php

namespace App\Modules\Pipelines;

use Illuminate\Support\ServiceProvider;

class PipelinesServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/routes/web.php');
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');
    }
}
