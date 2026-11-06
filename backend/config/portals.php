<?php

// Hostnames are the domain map in docs/LARAVEL_PORTALS.md. The frontend picks the
// app per host in src/utils/surface.ts; keep both in sync.
return [
    'marketplace_host' => env('MARKETPLACE_HOST', 'danavago.com'),
    'profile_host' => env('OPERATOR_PROFILE_HOST', 'danava.com'),
    'platform_app_host' => env('PLATFORM_APP_HOST', 'app.danavago.com'),
    'studio_host' => env('STUDIO_HOST', 'studio.danavago.com'),
    'admin_host' => env('ADMIN_HOST', 'admin.danavago.com'),
    'tenant_app_root' => env('TENANT_APP_ROOT', 'danavago.com'),
    'wildcard_ready' => (bool) env('TENANT_WILDCARD_READY', false),
];
