<?php

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
$file = realpath(__DIR__.'/public'.$path);
if ($path !== '/' && $file && str_starts_with($file, __DIR__.'/public/') && is_file($file)) {
    return false;
}
require __DIR__.'/public/index.php';
