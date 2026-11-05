<?php

return ['default' => 'file', 'stores' => ['file' => ['driver' => 'file', 'path' => env('CACHE_PATH', storage_path('framework/cache/data')), 'lock_path' => env('CACHE_PATH', storage_path('framework/cache/data'))]], 'prefix' => 'danava_go'];
