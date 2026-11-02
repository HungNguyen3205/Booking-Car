<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('name');
            $t->string('slug')->unique();
            $t->json('data');
            $t->string('status')->default('active');
            $t->string('created_at', 30)->nullable();
        });
        Schema::create('users', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('tenant_id')->nullable()->constrained('tenants');
            $t->string('name');
            $t->string('email')->unique();
            $t->string('password');
            $t->string('role');
            $t->boolean('active')->default(true);
            $t->uuid('driver_id')->nullable();
            $t->rememberToken();
            $t->string('created_at', 30)->nullable();
        });
        Schema::create('records', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('tenant_id')->constrained('tenants');
            $t->string('kind', 30);
            $t->string('identifier')->nullable();
            $t->json('data');
            $t->string('created_at', 30)->nullable();
            $t->unique(['tenant_id', 'kind', 'identifier']);
            $t->index(['tenant_id', 'kind']);
        });
        Schema::create('trips', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('tenant_id')->constrained('tenants');
            $t->foreignUuid('vehicle_id')->constrained('records');
            $t->foreignUuid('driver_id')->nullable()->constrained('records');
            $t->foreignUuid('route_id')->constrained('records');
            $t->string('depart_at', 30);
            $t->string('end_at', 30);
            $t->string('status', 30);
            $t->json('data');
            $t->string('created_at', 30)->nullable();
            $t->index(['tenant_id', 'depart_at']);
        });
        Schema::create('holds', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('tenant_id')->constrained('tenants');
            $t->foreignUuid('trip_id')->constrained('trips');
            $t->string('token', 64)->index();
            $t->unsignedBigInteger('expires')->index();
            $t->json('data');
        });
        Schema::create('bookings', function (Blueprint $t) {
            $t->string('id', 60)->primary();
            $t->foreignUuid('tenant_id')->constrained('tenants');
            $t->foreignUuid('trip_id')->constrained('trips');
            $t->string('status', 30);
            $t->string('payment_status', 30);
            $t->string('source', 20);
            $t->json('data');
            $t->string('created_at', 30)->nullable();
            $t->index(['tenant_id', 'trip_id']);
        });
        Schema::create('inventory', function (Blueprint $t) {
            $t->foreignUuid('trip_id')->constrained('trips');
            $t->string('seat', 8);
            $t->foreignUuid('hold_id')->nullable()->constrained('holds');
            $t->string('booking_id', 60)->nullable();
            $t->foreign('booking_id')->references('id')->on('bookings');
            $t->primary(['trip_id', 'seat']);
        });
        Schema::create('ledger', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('tenant_id')->constrained('tenants');
            $t->string('booking_id', 60)->nullable();
            $t->foreign('booking_id')->references('id')->on('bookings');
            $t->string('kind', 20);
            $t->unsignedBigInteger('amount');
            $t->string('method', 20);
            $t->text('note');
            $t->foreignUuid('actor_id')->constrained('users');
            $t->string('created_at', 30)->nullable();
        });
        Schema::create('audit', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->uuid('tenant_id')->nullable()->index();
            $t->uuid('actor_id')->nullable();
            $t->string('action');
            $t->string('entity_id')->nullable();
            $t->json('detail');
            $t->string('created_at', 30)->nullable();
        });
        Schema::create('notices', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('tenant_id')->constrained('tenants');
            $t->text('title');
            $t->string('created_at', 30)->nullable();
        });
        Schema::create('notice_reads', function (Blueprint $t) {
            $t->foreignUuid('user_id')->constrained('users');
            $t->foreignUuid('notice_id')->constrained('notices');
            $t->primary(['user_id', 'notice_id']);
        });
        Schema::create('idempotency', function (Blueprint $t) {
            $t->string('key', 64)->primary();
            $t->string('booking_id', 60);
            $t->foreign('booking_id')->references('id')->on('bookings');
        });
        Schema::create('ledger_requests', function (Blueprint $t) {
            $t->string('key', 64)->primary();
            $t->string('fingerprint', 64);
            $t->foreignUuid('ledger_id')->constrained('ledger');
        });
    }

    public function down(): void
    {
        foreach (['ledger_requests', 'idempotency', 'notice_reads', 'notices', 'audit', 'ledger', 'inventory', 'bookings', 'holds', 'trips', 'records', 'users', 'tenants'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
