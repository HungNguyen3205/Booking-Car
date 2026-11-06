<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Customer accounts created at checkout (login = phone) and the in-app
 * notifications customers see about their tickets.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->string('phone', 20)->nullable()->unique();
            $t->boolean('must_change_password')->default(false);
        });
        Schema::create('customer_notifications', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('phone', 20)->index();
            $t->string('booking_id', 60)->nullable()->index();
            $t->string('title', 150);
            $t->text('body');
            $t->string('read_at', 30)->nullable();
            $t->string('created_at', 30);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_notifications');
        Schema::table('users', function (Blueprint $t) {
            $t->dropUnique(['phone']);
            $t->dropColumn(['phone', 'must_change_password']);
        });
    }
};
