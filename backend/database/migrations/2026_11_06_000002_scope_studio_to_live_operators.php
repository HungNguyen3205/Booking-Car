<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Studio now runs on the live operator model (tenants/users/bookings):
 *  - customer_notes.partner_id: notes belong to one operator (no cross-operator leaks)
 *  - users.permission_group_id: custom permission groups apply to real login accounts
 * Additive only.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('customer_notes') && ! Schema::hasColumn('customer_notes', 'partner_id')) {
            Schema::table('customer_notes', function (Blueprint $t) {
                $t->string('partner_id', 60)->nullable()->index();
            });
        }
        if (! Schema::hasColumn('users', 'permission_group_id')) {
            Schema::table('users', function (Blueprint $t) {
                $t->string('permission_group_id', 60)->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'permission_group_id')) {
            Schema::table('users', fn (Blueprint $t) => $t->dropColumn('permission_group_id'));
        }
        if (Schema::hasColumn('customer_notes', 'partner_id')) {
            Schema::table('customer_notes', fn (Blueprint $t) => $t->dropColumn('partner_id'));
        }
    }
};
