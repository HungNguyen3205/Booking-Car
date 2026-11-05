<?php

namespace App\Services\Notification;

use App\Mail\BookingNotificationMail;
use App\Models\AdminNotification;
use App\Models\AppNotification;
use App\Models\Booking;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class NotificationService
{
    /**
     * Đảm bảo thông báo chỉ phát hành sau khi database transaction đã COMMIT thành công.
     * Nếu giao dịch bị ROLLBACK, callback sẽ bị hủy bỏ hoàn toàn.
     */
    public function dispatchAfterCommit(callable $callback): void
    {
        if (DB::transactionLevel() > 0) {
            DB::afterCommit(function () use ($callback) {
                try {
                    $callback();
                } catch (Throwable $e) {
                    Log::warning('Lỗi xử lý notification sau commit: ' . $e->getMessage(), [
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            });
        } else {
            try {
                $callback();
            } catch (Throwable $e) {
                Log::warning('Lỗi xử lý notification trực tiếp: ' . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }
    }

    /**
     * Tạo thông báo trong ứng dụng (In-app Notification) an toàn, chống duplicate bằng dedup_key.
     */
    public function createInAppNotification(
        int $userId,
        string $type,
        string $title,
        string $content,
        ?int $bookingId = null,
        ?string $actionUrl = null,
        ?array $data = null,
        ?string $dedupKey = null
    ): ?AppNotification {
        try {
            if ($dedupKey) {
                $exists = AppNotification::where('dedup_key', $dedupKey)->exists();
                if ($exists) {
                    Log::info("Bỏ qua thông báo trùng lặp với dedup_key: {$dedupKey}");
                    return null;
                }
            }

            return AppNotification::create([
                'user_id'    => $userId,
                'booking_id' => $bookingId,
                'type'       => $type,
                'title'      => $title,
                'content'    => $content,
                'action_url' => $actionUrl,
                'data'       => $data,
                'is_read'    => false,
                'dedup_key'  => $dedupKey,
            ]);
        } catch (Throwable $e) {
            // Chống làm sập luồng chính nếu database notification gặp vấn đề
            Log::error('Lỗi khi lưu thông báo in-app: ' . $e->getMessage(), [
                'user_id' => $userId,
                'type'    => $type,
            ]);
            return null;
        }
    }

    /**
     * Tạo thông báo nội bộ cho nhân viên quản trị (Admin In-app Notification) an toàn, chống duplicate bằng dedup_key.
     */
    public function createAdminNotification(
        int $adminId,
        string $type,
        string $title,
        string $content,
        ?string $actionUrl = null,
        ?array $data = null,
        ?string $dedupKey = null
    ): ?AdminNotification {
        try {
            if ($dedupKey) {
                $exists = AdminNotification::where('dedup_key', $dedupKey)->exists();
                if ($exists) {
                    Log::info("Bỏ qua thông báo nội bộ trùng lặp với dedup_key: {$dedupKey}");
                    return null;
                }
            }

            return AdminNotification::create([
                'admin_id'   => $adminId,
                'type'       => $type,
                'title'      => $title,
                'content'    => $content,
                'action_url' => $actionUrl,
                'data'       => $data,
                'is_read'    => false,
                'dedup_key'  => $dedupKey,
            ]);
        } catch (Throwable $e) {
            Log::error('Lỗi khi lưu thông báo nội bộ admin: ' . $e->getMessage(), [
                'admin_id' => $adminId,
                'type'     => $type,
            ]);
            return null;
        }
    }

    /**
     * Gửi email thông báo (chỉ kích hoạt khi người dùng có email hợp lệ và mailer cấu hình)
     */
    public function sendEmailNotification(
        string $recipientEmail,
        string $subject,
        string $title,
        string $content,
        array $details = [],
        ?string $actionUrl = null
    ): void {
        try {
            if (empty($recipientEmail) || !filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
                return;
            }

            Mail::to($recipientEmail)->send(new BookingNotificationMail(
                $subject,
                $title,
                $content,
                $details,
                $actionUrl
            ));
        } catch (Throwable $e) {
            // Không làm gián đoạn luồng đặt xe khi lỗi kênh gửi mail
            Log::warning('Không thể gửi email thông báo: ' . $e->getMessage(), [
                'recipient' => $recipientEmail,
                'subject'   => $subject,
            ]);
        }
    }

    /**
     * 1. Thông báo tạo đơn đặt xe mới
     */
    public function notifyBookingCreated(Booking $booking): void
    {
        $this->dispatchAfterCommit(function () use ($booking) {
            $user = User::find($booking->user_id);
            if (!$user) {
                return;
            }

            $carName = $booking->car?->name ?? 'xe đã chọn';
            $title = "Đặt xe thành công - Mã đơn: #{$booking->ma_dat_xe}";
            $content = "Yêu cầu thuê xe {$carName} từ {$booking->start_date} đến {$booking->end_date} đã được tiếp nhận và đang chờ duyệt.";
            $actionUrl = "/my-bookings/{$booking->id}";

            $this->createInAppNotification(
                userId: $user->id,
                type: AppNotification::TYPE_BOOKING_CREATED,
                title: $title,
                content: $content,
                bookingId: $booking->id,
                actionUrl: $actionUrl,
                data: [
                    'ma_dat_xe'  => $booking->ma_dat_xe,
                    'start_date' => $booking->start_date,
                    'end_date'   => $booking->end_date,
                    'car_name'   => $carName,
                ]
            );

            $this->sendEmailNotification(
                recipientEmail: $user->email,
                subject: "[DriveRentals] Xác nhận tạo đơn đặt xe #{$booking->ma_dat_xe}",
                title: $title,
                content: $content,
                details: [
                    'Mã đơn'        => $booking->ma_dat_xe,
                    'Dòng xe'       => $carName,
                    'Thời gian nhận' => Carbon::parse($booking->start_date)->format('d/m/Y H:i'),
                    'Thời gian trả' => Carbon::parse($booking->end_date)->format('d/m/Y H:i'),
                    'Tổng tiền'     => number_format($booking->tong_tien) . ' VNĐ',
                ],
                actionUrl: $actionUrl
            );
        });
    }

    /**
     * 2. Thông báo duyệt đơn đặt xe
     */
    public function notifyBookingConfirmed(Booking $booking): void
    {
        $this->dispatchAfterCommit(function () use ($booking) {
            $user = User::find($booking->user_id);
            if (!$user) {
                return;
            }

            $carName = $booking->car?->name ?? 'xe đã chọn';
            $title = "Đơn đặt xe #{$booking->ma_dat_xe} đã được duyệt!";
            $content = "Đơn thuê xe {$carName} đã được quản trị viên duyệt. Xe đã sẵn sàng cho hành trình của bạn.";
            $actionUrl = "/my-bookings/{$booking->id}";

            $this->createInAppNotification(
                userId: $user->id,
                type: AppNotification::TYPE_BOOKING_CONFIRMED,
                title: $title,
                content: $content,
                bookingId: $booking->id,
                actionUrl: $actionUrl,
                data: [
                    'ma_dat_xe' => $booking->ma_dat_xe,
                    'car_name'  => $carName,
                ]
            );

            $this->sendEmailNotification(
                recipientEmail: $user->email,
                subject: "[DriveRentals] Đơn đặt xe #{$booking->ma_dat_xe} đã được duyệt thành công",
                title: $title,
                content: $content,
                details: [
                    'Mã đơn'         => $booking->ma_dat_xe,
                    'Dòng xe'        => $carName,
                    'Thời gian nhận' => Carbon::parse($booking->start_date)->format('d/m/Y H:i'),
                    'Trạng thái'     => 'Đã duyệt - Sẵn sàng bàn giao',
                ],
                actionUrl: $actionUrl
            );
        });
    }

    /**
     * 3. Thông báo hủy đơn đặt xe
     */
    public function notifyBookingCancelled(Booking $booking, string $reason): void
    {
        $this->dispatchAfterCommit(function () use ($booking, $reason) {
            $user = User::find($booking->user_id);
            if (!$user) {
                return;
            }

            $carName = $booking->car?->name ?? 'xe';
            $title = "Đơn đặt xe #{$booking->ma_dat_xe} đã bị hủy";
            $content = "Đơn thuê xe {$carName} đã bị hủy. Lý do: {$reason}";
            $actionUrl = "/my-bookings/{$booking->id}";

            $this->createInAppNotification(
                userId: $user->id,
                type: AppNotification::TYPE_BOOKING_CANCELLED,
                title: $title,
                content: $content,
                bookingId: $booking->id,
                actionUrl: $actionUrl,
                data: [
                    'ma_dat_xe'     => $booking->ma_dat_xe,
                    'cancel_reason' => $reason,
                ]
            );

            $this->sendEmailNotification(
                recipientEmail: $user->email,
                subject: "[DriveRentals] Thông báo hủy đơn đặt xe #{$booking->ma_dat_xe}",
                title: $title,
                content: $content,
                details: [
                    'Mã đơn'     => $booking->ma_dat_xe,
                    'Lý do hủy'  => $reason,
                    'Thời điểm'  => now()->format('d/m/Y H:i'),
                ],
                actionUrl: $actionUrl
            );
        });
    }

    /**
     * 4. Thông báo xác nhận thanh toán thành công
     */
    public function notifyPaymentConfirmed(Booking $booking, int $amount): void
    {
        $this->dispatchAfterCommit(function () use ($booking, $amount) {
            $user = User::find($booking->user_id);
            if (!$user) {
                return;
            }

            $formattedAmount = number_format($amount) . ' VNĐ';
            $title = "Xác nhận thanh toán thành công (#{$booking->ma_dat_xe})";
            $content = "Hệ thống đã xác nhận thanh toán số tiền {$formattedAmount} cho đơn đặt xe #{$booking->ma_dat_xe}.";
            $actionUrl = "/my-bookings/{$booking->id}";

            $this->createInAppNotification(
                userId: $user->id,
                type: AppNotification::TYPE_PAYMENT_CONFIRMED,
                title: $title,
                content: $content,
                bookingId: $booking->id,
                actionUrl: $actionUrl,
                data: [
                    'ma_dat_xe' => $booking->ma_dat_xe,
                    'amount'    => $amount,
                ]
            );

            $this->sendEmailNotification(
                recipientEmail: $user->email,
                subject: "[DriveRentals] Xác nhận thanh toán thành công đơn #{$booking->ma_dat_xe}",
                title: $title,
                content: $content,
                details: [
                    'Mã đơn'     => $booking->ma_dat_xe,
                    'Số tiền'    => $formattedAmount,
                    'Thời điểm'  => now()->format('d/m/Y H:i'),
                    'Trạng thái' => 'Đã thanh toán',
                ],
                actionUrl: $actionUrl
            );
        });
    }

    /**
     * 5. Nhắc lịch sắp nhận xe (Có khóa chống gửi trùng)
     */
    public function notifyUpcomingPickup(Booking $booking): bool
    {
        $dedupKey = "upcoming_pickup_{$booking->id}";
        $user = User::find($booking->user_id);
        if (!$user) {
            return false;
        }

        $carName = $booking->car?->name ?? 'xe';
        $formattedStart = Carbon::parse($booking->start_date)->format('H:i d/m/Y');
        $title = "Nhắc lịch nhận xe: #{$booking->ma_dat_xe}";
        $content = "Chuyến đi với xe {$carName} sẽ bắt đầu vào lúc {$formattedStart}. Vui lòng chuẩn bị CCCD/Hộ chiếu và Giấy phép lái xe hợp lệ.";
        $actionUrl = "/my-bookings/{$booking->id}";

        $notification = $this->createInAppNotification(
            userId: $user->id,
            type: AppNotification::TYPE_UPCOMING_PICKUP,
            title: $title,
            content: $content,
            bookingId: $booking->id,
            actionUrl: $actionUrl,
            data: [
                'ma_dat_xe'  => $booking->ma_dat_xe,
                'start_date' => $booking->start_date,
                'car_name'   => $carName,
            ],
            dedupKey: $dedupKey
        );

        if (!$notification) {
            return false;
        }

        $this->sendEmailNotification(
            recipientEmail: $user->email,
            subject: "[DriveRentals] Nhắc lịch nhận xe đơn #{$booking->ma_dat_xe}",
            title: $title,
            content: $content,
            details: [
                'Mã đơn'         => $booking->ma_dat_xe,
                'Dòng xe'        => $carName,
                'Thời gian nhận' => $formattedStart,
                'Địa điểm'       => $booking->pickup_location ?? 'Văn phòng DriveRentals',
            ],
            actionUrl: $actionUrl
        );

        return true;
    }

    /**
     * 6. Nhắc lịch sắp trả xe (Có khóa chống gửi trùng)
     */
    public function notifyUpcomingReturn(Booking $booking): bool
    {
        $dedupKey = "upcoming_return_{$booking->id}";
        $user = User::find($booking->user_id);
        if (!$user) {
            return false;
        }

        $carName = $booking->car?->name ?? 'xe';
        $formattedEnd = Carbon::parse($booking->end_date)->format('H:i d/m/Y');
        $title = "Nhắc lịch trả xe: #{$booking->ma_dat_xe}";
        $content = "Hạn hoàn trả xe {$carName} là vào lúc {$formattedEnd}. Vui lòng bàn giao xe đúng giờ để tránh phát sinh phụ phí trễ giờ.";
        $actionUrl = "/my-bookings/{$booking->id}";

        $notification = $this->createInAppNotification(
            userId: $user->id,
            type: AppNotification::TYPE_UPCOMING_RETURN,
            title: $title,
            content: $content,
            bookingId: $booking->id,
            actionUrl: $actionUrl,
            data: [
                'ma_dat_xe' => $booking->ma_dat_xe,
                'end_date'  => $booking->end_date,
                'car_name'  => $carName,
            ],
            dedupKey: $dedupKey
        );

        if (!$notification) {
            return false;
        }

        $this->sendEmailNotification(
            recipientEmail: $user->email,
            subject: "[DriveRentals] Nhắc lịch hoàn trả xe đơn #{$booking->ma_dat_xe}",
            title: $title,
            content: $content,
            details: [
                'Mã đơn'        => $booking->ma_dat_xe,
                'Dòng xe'       => $carName,
                'Thời gian trả' => $formattedEnd,
                'Địa điểm trả'  => $booking->return_location ?? 'Văn phòng DriveRentals',
            ],
            actionUrl: $actionUrl
        );

        return true;
    }
}
