<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php', commands: __DIR__.'/../routes/console.php', health: '/up')
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn () => '/manage');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());
        $exceptions->render(function (Throwable $e, Request $r) {
            if (! $r->is('api/*')) {
                return null;
            }
            $status = $e instanceof AuthenticationException ? 401 : ($e instanceof ValidationException ? 422 : ($e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500));
            if ($e instanceof QueryException && in_array((string) $e->getCode(), ['23000', '23505', '40001'])) {
                $status = 409;
            }
            $message = $e instanceof ValidationException ? collect($e->errors())->flatten()->first() : ($status < 500 ? $e->getMessage() : 'Không thể xử lý yêu cầu. Vui lòng thử lại.');
            if ($status === 419) {
                $message = 'Phiên thao tác đã hết hạn. Vui lòng tải lại trang.';
            }

            return response()->json(['error' => $message ?: 'Yêu cầu không hợp lệ'], $status);
        });
    })->create();
