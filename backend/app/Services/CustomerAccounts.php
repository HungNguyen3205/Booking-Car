<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Customer accounts created at checkout. Login is the phone number; a new
 * account starts with the temporary password below and must change it at the
 * first sign-in. An existing account is never reset by a new booking.
 */
class CustomerAccounts
{
    /** Business decision (2026-11-07): fixed temporary password, forced change on first login. */
    public const TEMP_PASSWORD = '123456';

    public function __construct(private OperatorService $ops) {}

    /** @return array{created: bool, username: string} */
    public function ensure(string $phone, string $name): array
    {
        $phone = $this->ops->phone($phone);
        if (User::where('phone', $phone)->exists()) {
            return ['created' => false, 'username' => $phone];
        }
        try {
            User::create(['id' => $this->ops->uuid(), 'tenant_id' => null, 'name' => mb_substr(trim($name) ?: 'Khách DANAVA Go', 0, 150),
                // Customers sign in by phone; the address only satisfies the unique email column.
                'email' => $phone.'@customer.invalid', 'phone' => $phone, 'password' => Hash::make(self::TEMP_PASSWORD),
                'role' => 'customer', 'active' => true, 'must_change_password' => true, 'created_at' => $this->ops->now()]);
        } catch (QueryException) {
            return ['created' => false, 'username' => $phone];
        }

        return ['created' => true, 'username' => $phone];
    }

    public function notify(string $phone, ?string $bookingId, string $title, string $body): void
    {
        $phone = $this->ops->phone($phone);
        if ($phone === '') {
            return;
        }
        DB::table('customer_notifications')->insert(['id' => $this->ops->uuid(), 'phone' => $phone, 'booking_id' => $bookingId,
            'title' => mb_substr($title, 0, 150), 'body' => $body, 'read_at' => null, 'created_at' => $this->ops->now()]);
    }
}
