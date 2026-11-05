<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Admins
        if (!Schema::hasTable('admins')) {
            Schema::create('admins', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('ho_ten');
                $table->string('email')->unique();
                $table->string('password');
                $table->string('so_dien_thoai', 30)->nullable();
                $table->string('dia_chi', 255)->nullable();
                $table->string('role', 30)->default('manager'); // admin, manager, dispatcher, operator_staff, accountant, owner
                $table->string('partner_id', 60)->nullable()->index();
                $table->json('permissions')->nullable();
                $table->tinyInteger('tinh_trang')->default(1);
                $table->timestamp('last_login_at')->nullable();
                $table->rememberToken();
                $table->timestamps();
            });
        }

        // 2. Audit Logs
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->string('actor_type', 30)->default('system');
                $table->string('actor_id', 60)->nullable();
                $table->string('actor_name', 100)->nullable();
                $table->string('actor_email', 150)->nullable();
                $table->string('action', 80);
                $table->string('target_type', 50)->nullable();
                $table->string('target_id', 60)->nullable();
                $table->string('target_label', 255)->nullable();
                $table->json('old_values')->nullable();
                $table->json('new_values')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();

                $table->index(['actor_type', 'actor_id']);
                $table->index('action');
                $table->index('created_at');
            });
        }

        // 3. System Settings
        if (!Schema::hasTable('system_settings')) {
            Schema::create('system_settings', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique()->index();
                $table->longText('value')->nullable();
                $table->string('type')->default('string'); // string, json, boolean, integer
                $table->string('group')->default('general'); // general, payment, mail, sms, policy
                $table->boolean('is_public')->default(true);
                $table->string('description')->nullable();
                $table->string('updated_by', 60)->nullable();
                $table->timestamps();
            });
        }

        // 4. Partners (Nhà xe đối tác)
        if (!Schema::hasTable('partners')) {
            Schema::create('partners', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('slug')->unique();
                $table->string('phone', 30)->nullable();
                $table->string('email', 150)->nullable();
                $table->string('address')->nullable();
                $table->decimal('commission_rate', 5, 2)->default(10.00); // 10%
                $table->string('contract_number', 80)->nullable();
                $table->string('bank_name', 100)->nullable();
                $table->string('bank_account', 50)->nullable();
                $table->string('bank_holder', 100)->nullable();
                $table->json('branding')->nullable();
                $table->string('status', 30)->default('active'); // active, suspended, pending
                $table->timestamps();
            });
        }

        // 5. Partner Domains (App & Tên miền white-label)
        if (!Schema::hasTable('partner_domains')) {
            Schema::create('partner_domains', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('partner_id')->constrained('partners')->cascadeOnDelete();
                $table->string('domain', 150)->nullable()->unique();
                $table->string('subdomain', 100)->nullable()->unique();
                $table->string('app_slug', 80);
                $table->boolean('is_verified')->default(false);
                $table->string('ssl_status', 30)->default('active');
                $table->json('settings')->nullable();
                $table->timestamps();
            });
        }

        // 6. Seat Layouts (Sơ đồ ma trận ghế)
        if (!Schema::hasTable('seat_layouts')) {
            Schema::create('seat_layouts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('partner_id')->nullable()->constrained('partners')->cascadeOnDelete();
                $table->string('name');
                $table->string('vehicle_type', 30)->default('limousine'); // limousine, sleeper, seating
                $table->integer('total_seats')->default(9);
                $table->integer('floors')->default(1);
                $table->integer('rows')->default(3);
                $table->integer('columns')->default(3);
                $table->json('layout_matrix');
                $table->timestamps();
            });
        }

        // 7. Bus Vehicles (Đội xe khách)
        if (!Schema::hasTable('bus_vehicles')) {
            Schema::create('bus_vehicles', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('partner_id')->constrained('partners')->cascadeOnDelete();
                $table->foreignUuid('seat_layout_id')->nullable()->constrained('seat_layouts')->nullOnDelete();
                $table->string('name');
                $table->string('plate_number', 30);
                $table->string('category', 30)->default('limousine'); // limousine, sleeper, seating
                $table->integer('capacity')->default(9);
                $table->integer('floor_count')->default(1);
                $table->json('amenities')->nullable();
                $table->string('image_url')->nullable();
                $table->date('inspection_date')->nullable();
                $table->string('status', 30)->default('active'); // active, maintenance, inactive
                $table->timestamps();
            });
        }

        // 8. Drivers (Tài xế)
        if (!Schema::hasTable('drivers')) {
            Schema::create('drivers', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('partner_id')->constrained('partners')->cascadeOnDelete();
                $table->string('name');
                $table->string('phone', 30);
                $table->string('license_number', 50)->nullable();
                $table->string('license_class', 20)->default('D');
                $table->date('license_expiry')->nullable();
                $table->string('status', 30)->default('active');
                $table->timestamps();
            });
        }

        // 9. Routes (Tuyến đường)
        if (!Schema::hasTable('routes')) {
            Schema::create('routes', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('partner_id')->constrained('partners')->cascadeOnDelete();
                $table->string('name');
                $table->string('from_city', 80);
                $table->string('to_city', 80);
                $table->integer('distance_km')->default(100);
                $table->integer('duration_minutes')->default(120);
                $table->unsignedBigInteger('base_price')->default(200000);
                $table->string('status', 30)->default('active');
                $table->timestamps();
            });
        }

        // 10. Route Stops (Điểm đón & Điểm trả)
        if (!Schema::hasTable('route_stops')) {
            Schema::create('route_stops', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('route_id')->constrained('routes')->cascadeOnDelete();
                $table->string('name');
                $table->string('address')->nullable();
                $table->string('stop_type', 20)->default('pickup'); // pickup, dropoff, both
                $table->integer('time_offset_minutes')->default(0);
                $table->unsignedBigInteger('extra_fee')->default(0);
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // 11. Trips (Chuyến chạy)
        if (!Schema::hasTable('bus_trips')) {
            Schema::create('bus_trips', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('partner_id')->constrained('partners')->cascadeOnDelete();
                $table->foreignUuid('route_id')->constrained('routes')->cascadeOnDelete();
                $table->foreignUuid('bus_vehicle_id')->constrained('bus_vehicles')->cascadeOnDelete();
                $table->foreignUuid('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
                $table->dateTime('depart_time');
                $table->dateTime('arrive_time');
                $table->unsignedBigInteger('base_price');
                $table->string('status', 30)->default('scheduled'); // scheduled, running, completed, cancelled
                $table->json('seat_inventory')->nullable();
                $table->timestamps();
                $table->index(['partner_id', 'depart_time']);
            });
        }

        // 12. Ticket Bookings (Đơn vé)
        if (!Schema::hasTable('ticket_bookings')) {
            Schema::create('ticket_bookings', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('booking_code', 60)->unique();
                $table->foreignUuid('partner_id')->constrained('partners')->cascadeOnDelete();
                $table->foreignUuid('trip_id')->constrained('bus_trips')->cascadeOnDelete();
                $table->string('customer_name');
                $table->string('customer_phone', 30);
                $table->string('customer_email', 150)->nullable();
                $table->json('seats');
                $table->integer('seat_count')->default(1);
                $table->foreignUuid('pickup_stop_id')->nullable()->constrained('route_stops')->nullOnDelete();
                $table->foreignUuid('dropoff_stop_id')->nullable()->constrained('route_stops')->nullOnDelete();
                $table->string('pickup_custom')->nullable();
                $table->string('dropoff_custom')->nullable();
                $table->unsignedBigInteger('total_amount');
                $table->unsignedBigInteger('discount_amount')->default(0);
                $table->unsignedBigInteger('final_amount');
                $table->string('payment_status', 30)->default('unpaid'); // unpaid, paid, refunded
                $table->string('booking_status', 30)->default('confirmed'); // pending, confirmed, checked_in, completed, cancelled
                $table->string('payment_method', 30)->default('vnpay'); // vnpay, momo, bank_transfer, cash
                $table->string('payment_ref', 100)->nullable();
                $table->text('notes')->nullable();
                $table->string('created_by_admin_id', 60)->nullable();
                $table->timestamps();
                $table->index(['partner_id', 'trip_id']);
                $table->index('customer_phone');
            });
        }

        // 13. Reconciliations (Đối soát & Công nợ)
        if (!Schema::hasTable('reconciliations')) {
            Schema::create('reconciliations', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('code', 60)->unique();
                $table->foreignUuid('partner_id')->constrained('partners')->cascadeOnDelete();
                $table->date('period_start');
                $table->date('period_end');
                $table->integer('total_tickets')->default(0);
                $table->unsignedBigInteger('total_revenue')->default(0);
                $table->decimal('commission_rate', 5, 2)->default(10.00);
                $table->unsignedBigInteger('commission_amount')->default(0);
                $table->unsignedBigInteger('payout_amount')->default(0);
                $table->string('status', 30)->default('draft'); // draft, pending_approval, confirmed, paid
                $table->dateTime('settled_at')->nullable();
                $table->string('payment_ref', 100)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 14. Promotions (Ưu đãi & Khuyến mãi)
        if (!Schema::hasTable('promotions')) {
            Schema::create('promotions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('partner_id')->nullable()->constrained('partners')->cascadeOnDelete();
                $table->string('code', 50)->unique();
                $table->string('title');
                $table->string('discount_type', 20)->default('percent'); // percent, fixed
                $table->unsignedBigInteger('discount_value');
                $table->unsignedBigInteger('min_order_amount')->default(0);
                $table->unsignedBigInteger('max_discount')->nullable();
                $table->integer('usage_limit')->default(100);
                $table->integer('used_count')->default(0);
                $table->dateTime('start_date');
                $table->dateTime('end_date');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 15. Booking Transactions (Thanh toán & Giao dịch nạp/rút)
        if (!Schema::hasTable('booking_transactions')) {
            Schema::create('booking_transactions', function (Blueprint $table) {
                $table->id();
                $table->string('booking_id', 60)->nullable();
                $table->string('partner_id', 60)->nullable();
                $table->string('type', 40); // payment, refund, payout, topup
                $table->unsignedBigInteger('amount');
                $table->string('status', 20)->default('completed'); // pending, completed, failed
                $table->string('method', 50)->default('bank_transfer'); // vnpay, momo, bank_transfer, cash
                $table->string('reference_code', 100)->nullable();
                $table->dateTime('transaction_time');
                $table->string('created_by', 60)->nullable();
                $table->text('note')->nullable();
                $table->string('proof_image')->nullable();
                $table->string('actor_name', 100)->nullable();
                $table->timestamps();
                $table->index('booking_id');
                $table->index('partner_id');
            });
        }

        // 16. Post Categories & Posts (Tin tức & Ưu đãi)
        if (!Schema::hasTable('post_categories')) {
            Schema::create('post_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->string('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('posts')) {
            Schema::create('posts', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('slug')->unique();
                $table->text('summary')->nullable();
                $table->longText('content')->nullable();
                $table->string('featured_image')->nullable();
                $table->unsignedBigInteger('category_id')->nullable();
                $table->string('status', 30)->default('published');
                $table->integer('views')->default(0);
                $table->timestamps();
            });
        }

        // 17. Customer Notes (CRM hành khách)
        if (!Schema::hasTable('customer_notes')) {
            Schema::create('customer_notes', function (Blueprint $table) {
                $table->id();
                $table->string('customer_phone', 30)->index();
                $table->string('customer_name')->nullable();
                $table->text('note');
                $table->string('admin_id', 60)->nullable();
                $table->string('admin_name', 100)->nullable();
                $table->timestamps();
            });
        }

        // 18. Media Assets (Thư viện media)
        if (!Schema::hasTable('media_assets')) {
            Schema::create('media_assets', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('file_path');
                $table->string('mime_type', 80);
                $table->unsignedBigInteger('size_bytes')->default(0);
                $table->string('category', 50)->default('general');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('media_assets');
        Schema::dropIfExists('customer_notes');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('post_categories');
        Schema::dropIfExists('booking_transactions');
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('reconciliations');
        Schema::dropIfExists('ticket_bookings');
        Schema::dropIfExists('bus_trips');
        Schema::dropIfExists('route_stops');
        Schema::dropIfExists('routes');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('bus_vehicles');
        Schema::dropIfExists('seat_layouts');
        Schema::dropIfExists('partner_domains');
        Schema::dropIfExists('partners');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('admins');
    }
};

