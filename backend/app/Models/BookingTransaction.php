<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use RuntimeException;

class BookingTransaction extends Model
{
    use HasFactory;

    protected $table = 'booking_transactions';

    // Các loại giao dịch phân định rõ giữa Tiền thuê và Tiền cọc bảo đảm
    public const TYPE_RENTAL_PAYMENT     = 'rental_payment';     // Thu tiền thuê xe (trả trước hoặc theo đợt)
    public const TYPE_RENTAL_REFUND      = 'rental_refund';      // Hoàn tiền thuê xe cho khách
    public const TYPE_DEPOSIT_COLLECTION = 'deposit_collection'; // Thu tiền cọc bảo đảm hoàn lại (không tính doanh thu)
    public const TYPE_DEPOSIT_REFUND     = 'deposit_refund';     // Hoàn trả tiền cọc cho khách
    public const TYPE_DEPOSIT_DEDUCTION  = 'deposit_deduction';  // Khấu trừ tiền cọc (bồi thường thiệt hại, phụ phí)

    // Trạng thái giao dịch
    public const STATUS_CONFIRMED = 'confirmed'; // Đã ghi nhận và có hiệu lực
    public const STATUS_REVERSED  = 'reversed';  // Đã bị đảo / điều chỉnh bởi giao dịch đối ứng

    protected $fillable = [
        'booking_id',
        'type',
        'amount',
        'status',
        'method',
        'reference_code',
        'transaction_time',
        'created_by',
        'note',
        'deduction_reason',
        'idempotency_key',
    ];

    protected $casts = [
        'amount'           => 'integer',
        'transaction_time' => 'datetime',
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
    ];

    protected $appends = [
        'type_label',
        'type_badge_color',
        'is_deposit',
        'is_outflow',
    ];

    /**
     * Quy tắc bất biến (Immutability):
     * Tuyệt đối không xóa hoặc chỉnh sửa số tiền / loại giao dịch đã xác nhận để che giấu lịch sử.
     * Mọi điều chỉnh tài chính phải thực hiện thông qua giao dịch hoàn tiền hoặc đảo giao dịch.
     */
    protected static function booted(): void
    {
        static::updating(function (BookingTransaction $transaction) {
            // Nếu giao dịch đã xác nhận, cấm sửa các trường nhạy cảm tài chính
            if ($transaction->getOriginal('status') === self::STATUS_CONFIRMED) {
                if ($transaction->isDirty(['amount', 'type', 'booking_id', 'transaction_time'])) {
                    throw new RuntimeException('Tuyệt đối không được chỉnh sửa số tiền, loại giao dịch hoặc thời gian của giao dịch đã xác nhận! Vui lòng dùng giao dịch điều chỉnh.');
                }
            }
        });

        static::deleting(function (BookingTransaction $transaction) {
            if ($transaction->getOriginal('status') === self::STATUS_CONFIRMED) {
                throw new RuntimeException('Tuyệt đối không được xóa giao dịch đã xác nhận để che giấu lịch sử tài chính!');
            }
        });
    }

    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_RENTAL_PAYMENT     => 'Thu tiền thuê xe',
            self::TYPE_RENTAL_REFUND      => 'Hoàn tiền thuê xe',
            self::TYPE_DEPOSIT_COLLECTION => 'Thu tiền cọc bảo đảm',
            self::TYPE_DEPOSIT_REFUND     => 'Hoàn trả tiền cọc',
            self::TYPE_DEPOSIT_DEDUCTION  => 'Khấu trừ tiền cọc',
            default                       => 'Giao dịch khác',
        };
    }

    public function getTypeBadgeColorAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_RENTAL_PAYMENT     => 'success',
            self::TYPE_RENTAL_REFUND      => 'warning',
            self::TYPE_DEPOSIT_COLLECTION => 'info',
            self::TYPE_DEPOSIT_REFUND     => 'secondary',
            self::TYPE_DEPOSIT_DEDUCTION  => 'danger',
            default                       => 'dark',
        };
    }

    public function getIsDepositAttribute(): bool
    {
        return in_array($this->type, [
            self::TYPE_DEPOSIT_COLLECTION,
            self::TYPE_DEPOSIT_REFUND,
            self::TYPE_DEPOSIT_DEDUCTION,
        ], true);
    }

    public function getIsOutflowAttribute(): bool
    {
        // Giao dịch chi ra / hoàn lại tiền
        return in_array($this->type, [
            self::TYPE_RENTAL_REFUND,
            self::TYPE_DEPOSIT_REFUND,
        ], true);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function createdByAdmin()
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }
}
