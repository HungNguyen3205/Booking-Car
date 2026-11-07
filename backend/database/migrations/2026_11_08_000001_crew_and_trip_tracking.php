<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Trip crew (driver + assistant "lơ xe") and live trip tracking:
 * - trips.assistant_id: crew record (records kind=drivers, position=assistant).
 * - trip_positions: GPS points sent by the crew phone while the trip runs.
 * - trip_events: trip log ("nhật ký chuyến") shown to customers and the owner.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $t) {
            $t->uuid('assistant_id')->nullable()->index();
        });
        Schema::create('trip_positions', function (Blueprint $t) {
            $t->id();
            $t->uuid('trip_id')->index();
            $t->uuid('tenant_id')->index();
            $t->uuid('user_id')->nullable();
            $t->double('lat');
            $t->double('lng');
            $t->float('accuracy')->nullable();
            $t->float('speed')->nullable();
            $t->float('heading')->nullable();
            $t->integer('route_distance_m')->nullable();
            $t->boolean('off_route')->default(false);
            $t->string('recorded_at', 30)->index();
        });
        Schema::create('trip_events', function (Blueprint $t) {
            $t->id();
            $t->uuid('trip_id')->index();
            $t->uuid('tenant_id')->index();
            $t->uuid('user_id')->nullable();
            $t->string('type', 30);
            $t->string('note', 300)->nullable();
            $t->double('lat')->nullable();
            $t->double('lng')->nullable();
            $t->string('created_at', 30);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_events');
        Schema::dropIfExists('trip_positions');
        Schema::table('trips', function (Blueprint $t) {
            $t->dropIndex(['assistant_id']);
            $t->dropColumn('assistant_id');
        });
    }
};
