<?php

return [
    'setup_token' => env('DANAVA_SETUP_TOKEN'),
    'allow_demo' => (bool) env('DANAVA_ALLOW_DEMO_SEED', false),
    // GPS tracking: metres from the route line (stops with coordinates) before a trip counts as off route.
    'off_route_m' => (int) env('DANAVA_OFF_ROUTE_M', 3000),
];
