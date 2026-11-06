<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Operator Studio modules (additive only):
 *  - permission_groups + admins.permission_group_id  (2-tier custom roles)
 *  - cashbook_entries                                 (sổ quỹ thu/chi)
 *  - staff_attendance, staff_compensation             (chấm công, lương, hoa hồng)
 *  - marketing_campaigns, trip_reviews                (marketing & đánh giá)
 *  - ticket_bookings.checked_in_at/by                 (soát vé lên xe)
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('permission_groups')) {
            Schema::create('permission_groups', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('partner_id', 60)->nullable()->index(); // null = toàn nền tảng
                $table->string('name', 120);
                $table->string('description', 255)->nullable();
                $table->json('permissions')->nullable();
                $table->timestamps();
            });
        }
        if (Schema::hasTable('admins') && ! Schema::hasColumn('admins', 'permission_group_id')) {
            Schema::table('admins', function (Blueprint $table) {
                $table->string('permission_group_id', 60)->nullable()->index();
            });
        }

        if (! Schema::hasTable('cashbook_entries')) {
            Schema::create('cashbook_entries', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('partner_id', 60)->nullable()->index();
                $table->string('type', 10); // in | out
                $table->string('category', 60);
                $table->unsignedBigInteger('amount');
                $table->string('method', 30)->default('cash'); // cash | transfer | card
                $table->string('booking_id', 60)->nullable()->index();
                $table->string('note', 500)->nullable();
                $table->date('occurred_on')->index();
                $table->string('created_by', 150)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('staff_attendance')) {
            Schema::create('staff_attendance', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('admin_id', 60)->index();
                $table->date('work_date');
                $table->string('check_in', 5)->nullable();  // HH:MM, Asia/Ho_Chi_Minh
                $table->string('check_out', 5)->nullable();
                $table->string('status', 20)->default('present'); // present | late | leave | absent
                $table->string('note', 255)->nullable();
                $table->timestamps();
                $table->unique(['admin_id', 'work_date']);
            });
        }
        if (! Schema::hasTable('staff_compensation')) {
            Schema::create('staff_compensation', function (Blueprint $table) {
                $table->string('admin_id', 60)->primary();
                $table->unsignedBigInteger('base_salary')->default(0);      // lương tháng đủ công
                $table->decimal('commission_rate', 5, 2)->default(0);       // % trên vé đã thu do NV bán
                $table->unsignedTinyInteger('standard_days')->default(26);  // số công chuẩn
                $table->string('shift_start', 5)->default('08:00');         // sau giờ này = đi muộn
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('marketing_campaigns')) {
            Schema::create('marketing_campaigns', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('partner_id', 60)->nullable()->index();
                $table->string('name', 150);
                $table->string('channel', 20); // sms | email | zalo
                $table->json('audience')->nullable(); // {route_id, min_trips, last_days}
                $table->text('message');
                $table->string('promotion_code', 50)->nullable();
                $table->string('status', 20)->default('draft'); // draft | scheduled | cancelled
                $table->dateTime('scheduled_at')->nullable();
                $table->unsignedInteger('audience_count')->default(0);
                $table->timestamps();
            });
        }
        if (! Schema::hasTable('trip_reviews')) {
            Schema::create('trip_reviews', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('booking_id', 60)->unique();
                $table->string('partner_id', 60)->index();
                $table->string('trip_id', 60)->nullable()->index();
                $table->string('customer_name', 150)->nullable();
                $table->unsignedTinyInteger('rating');
                $table->text('comment')->nullable();
                $table->string('status', 20)->default('visible'); // visible | hidden
                $table->text('reply')->nullable();
                $table->dateTime('replied_at')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('ticket_bookings') && ! Schema::hasColumn('ticket_bookings', 'checked_in_at')) {
            Schema::table('ticket_bookings', function (Blueprint $table) {
                $table->dateTime('checked_in_at')->nullable();
                $table->string('checked_in_by', 150)->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('ticket_bookings', 'checked_in_at')) {
            Schema::table('ticket_bookings', fn (Blueprint $t) => $t->dropColumn(['checked_in_at', 'checked_in_by']));
        }
        if (Schema::hasColumn('admins', 'permission_group_id')) {
            Schema::table('admins', fn (Blueprint $t) => $t->dropColumn('permission_group_id'));
        }
        foreach (['trip_reviews', 'marketing_campaigns', 'staff_compensation', 'staff_attendance', 'cashbook_entries', 'permission_groups'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
