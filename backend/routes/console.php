<?php

use App\Services\OperatorService;
use App\Services\PortalService;
use Illuminate\Support\Facades\Artisan;

Artisan::command('danava:seed-demo', function (OperatorService $ops) {
    if (app()->environment('production') && ! config('danava.allow_demo')) {
        $this->error('Demo seed is disabled.');

        return 1;
    }
    $result = $ops->seed();
    app(PortalService::class)->seedCuaOng();
    $this->info(json_encode($result, JSON_UNESCAPED_UNICODE));
})->purpose('Create the DANAVAGO sample operator and future schedules');
