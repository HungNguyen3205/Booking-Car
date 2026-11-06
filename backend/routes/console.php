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

Artisan::command('danava:seed-operators {--days=7 : Days of schedule to create from today}', function (App\Services\DemoMarketplace $demo) {
    if (app()->environment('production') && ! config('danava.allow_demo')) {
        $this->error('Demo seed is disabled.');

        return 1;
    }
    $days = max(1, min(30, (int) $this->option('days')));
    foreach ($demo->seed($days) as $row) {
        $this->line(sprintf('%-22s %-18s +%d chuyến', $row['operator'], $row['slug'], $row['newTrips']));
    }
})->purpose('Create fictional demo operators with real-corridor fares and published schedules');
