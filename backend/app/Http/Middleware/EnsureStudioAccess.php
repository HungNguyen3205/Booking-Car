<?php

namespace App\Http\Middleware;

use App\Services\StudioBridge;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Studio (/api/admin/*) access by area, e.g. `studio:bookings`.
 * Platform admins may use every area; operator roles only the areas listed in
 * StudioBridge::AREAS. Data scoping to the user's own operator happens in the
 * controllers through StudioBridge::scope()/writeTenant().
 */
class EnsureStudioAccess
{
    public function __construct(private StudioBridge $bridge) {}

    public function handle(Request $request, Closure $next, string $area = 'overview'): Response
    {
        $this->bridge->allow($request, $area);

        return $next($request);
    }
}
