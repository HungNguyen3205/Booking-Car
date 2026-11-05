<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bootstrap_slots', fn (Blueprint $t) => $t->unsignedTinyInteger('id')->primary());
        Schema::create('tenant_domains', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('tenant_id')->constrained('tenants');
            $t->string('hostname', 190)->unique();
            $t->string('type', 20);
            $t->string('status', 30)->default('pending');
            $t->string('verification_token', 80)->nullable();
            $t->string('verified_at', 30)->nullable();
            $t->string('created_at', 30)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_domains');
        Schema::dropIfExists('bootstrap_slots');
    }
};
