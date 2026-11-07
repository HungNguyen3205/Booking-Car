<?php

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
$root = realpath(__DIR__.'/public').DIRECTORY_SEPARATOR;   // realpath uses "\" on Windows
$file = realpath(__DIR__.'/public'.$path);
if ($path !== '/' && $file && str_starts_with($file, $root) && is_file($file)) {
    return false;
}
require __DIR__.'/public/index.php';
