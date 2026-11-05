<?php

namespace App\Services\Revenue;

use App\Models\Admin;
use App\Models\Booking;
use App\Models\BookingTransaction;
use App\Models\Car;
use App\Models\Contact;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RevenueCalculationService
{
    /**
     * Chuẩn hóa tính toán số liệu doanh thu, dòng tiền thực tế và trung tâm điều hành đội xe.
     * 
     * Định nghĩa các chỉ số tài chính:
     * 1. total_booking_value (Tổng giá trị đặt đơn / GMV trong kỳ):
     *    Tổng tiền của toàn bộ đơn đặt xe được tạo, không phân biệt trạng thái duyệt hay thanh toán.
     * 2. confirmed_booking_value (Giá trị đơn đã xác nhận thuê):
     *    Tổng tiền của các đơn có tinh_trang = 1 (Đã duyệt xe sẵn sàng bàn giao).
     * 3. valid_paid_revenue (Doanh thu đơn hợp lệ đã thanh toán):
     *    Tổng tiền của các đơn có is_thanh_toan = 1 VÀ tinh_trang != 2 (không tính các đơn đã hủy).
     * 4. net_rental_collected (Thực thu tiền thuê xe):
     *    Dòng tiền thực tế từ booking_transactions: Thu tiền thuê (rental_payment) - Hoàn tiền thuê (rental_refund),
     *    kết hợp với các đơn thanh toán cũ chưa chuyển đổi giao dịch.
     * 5. total_deposit_held (Số dư tiền cọc đang giữ đến mốc báo cáo):
     *    Lũy kế từ đầu đến thời điểm báo cáo: Cọc đã thu - Cọc đã hoàn - Cọc đã khấu trừ.
     *    TUYỆT ĐỐI KHÔNG TÍNH TIỀN CỌC VÀO DOANH THU THUÊ XE.
     * 6. refund_review_value (Tiền đơn hủy chờ xử lý hoàn tiền / đối soát):
     *    Tổng tiền của các đơn có is_thanh_toan = 1 VÀ tinh_trang = 2 (Đã hủy).
     * 7. unpaid_confirmed_value (Công nợ đơn đã duyệt nhưng chưa thanh toán):
     *    Tổng tiền của các đơn có tinh_trang = 1 VÀ is_thanh_toan = 0.
     * 8. pending_receipt_value (Tiền đơn đang chờ đối soát biên lai):
     *    Tổng tiền của các đơn có is_thanh_toan = 0 VÀ có bill_image.
     */

    public const DATE_BY_PAYMENT = 'payment_date';
    public const DATE_BY_BOOKING = 'booking_date';

    /**
     * Lấy thống kê tổng quan doanh thu và chỉ số cho Admin Dashboard.
     *
     * @param array $options [
     *   'date_by'    => 'payment_date' | 'booking_date',
     *   'start_date' => 'Y-m-d' | null,
     *   'end_date'   => 'Y-m-d' | null,
     *   'months'     => int (default 6)
     * ]
     * @param Admin|null $admin Quản trị viên đang yêu cầu để kiểm tra phân quyền dữ liệu tài chính
     * @return array
     */
    public function getDashboardRevenueStats(array $options = [], ?Admin $admin = null): array
    {
        $canViewFinancial = is_null($admin)
            || $admin->isOwner()
            || $admin->hasPermission('reports.view')
            || $admin->hasPermission('payments.manage');

        $dateBy = $options['date_by'] ?? self::DATE_BY_PAYMENT;
        $months = isset($options['months']) ? (int) $options['months'] : 6;
        $startDate = !empty($options['start_date']) ? Carbon::parse($options['start_date'])->startOfDay() : null;
        $endDate = !empty($options['end_date']) ? Carbon::parse($options['end_date'])->endOfDay() : null;
        $now = Carbon::now();

        // 1. Thống kê tài chính & số lượng đơn (Filtered Summary)
        $summary = $this->calculateRevenueSummary($dateBy, $startDate, $endDate);

        // 2. Chỉ số vận hành ưu tiên thời điểm hiện tại (Operational Center KPIs)
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd = Carbon::today()->endOfDay();

        // Giao xe hôm nay (start_date rơi vào hôm nay và không hủy)
        $deliveriesTodayQuery = Booking::whereBetween('start_date', [$todayStart, $todayEnd])
            ->where('tinh_trang', '!=', Booking::STATUS_CANCELLED);
        $deliveriesTodayCount = (clone $deliveriesTodayQuery)->count();
        $deliveriesPendingCount = (clone $deliveriesTodayQuery)
            ->whereIn('tinh_trang', [Booking::STATUS_PENDING, Booking::STATUS_CONFIRMED])
            ->count();
        $deliveriesCompletedCount = (clone $deliveriesTodayQuery)
            ->whereIn('tinh_trang', [Booking::STATUS_IN_PROGRESS, Booking::STATUS_RETURNED, Booking::STATUS_COMPLETED])
            ->count();

        // Nhận trả hôm nay (end_date rơi vào hôm nay và không hủy)
        $returnsTodayQuery = Booking::whereBetween('end_date', [$todayStart, $todayEnd])
            ->where('tinh_trang', '!=', Booking::STATUS_CANCELLED);
        $returnsTodayCount = (clone $returnsTodayQuery)->count();
        $returnsPendingCount = (clone $returnsTodayQuery)
            ->where('tinh_trang', Booking::STATUS_IN_PROGRESS)
            ->count();
        $returnsReceivedCount = (clone $returnsTodayQuery)
            ->whereIn('tinh_trang', [Booking::STATUS_RETURNED, Booking::STATUS_COMPLETED])
            ->count();

        // Xe quá hạn trả (Đang lưu hành tinh_trang = 3 nhưng end_date < now())
        $overdueQuery = Booking::with(['user:id,ho_ten,so_dien_thoai', 'car:id,name,image'])
            ->where('tinh_trang', Booking::STATUS_IN_PROGRESS)
            ->where('end_date', '<', $now);
        $overdueReturnsCount = (clone $overdueQuery)->count();
        $overdueBookings = (clone $overdueQuery)
            ->orderBy('end_date', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($b) use ($now) {
                $end = Carbon::parse($b->end_date);
                $diffHours = round(abs($now->diffInMinutes($end)) / 60, 1);
                return [
                    'id'            => $b->id,
                    'ma_dat_xe'     => $b->ma_dat_xe,
                    'car_name'      => $b->car->name ?? 'Xe hệ thống',
                    'car_image'     => $b->car->image ?? null,
                    'user_name'     => $b->user->ho_ten ?? 'Khách hàng',
                    'user_phone'    => $b->user->so_dien_thoai ?? '',
                    'end_date'      => $b->end_date ? $end->format('d/m/Y H:i') : '',
                    'hours_overdue' => $diffHours,
                    'dia_chi_tra'   => $b->dia_chi_tra_xe ?: 'Tại showroom',
                ];
            })->values()->toArray();

        // Khối việc cần xử lý ngay (Action Center)
        $pendingReceiptsCount = Booking::where('is_thanh_toan', 0)
            ->whereNotNull('bill_image')
            ->where('bill_image', '!=', '')
            ->where('tinh_trang', '!=', Booking::STATUS_CANCELLED)
            ->count();

        $newContactsCount = Schema::hasTable('contacts')
            ? Contact::where('trang_thai', Contact::STATUS_PENDING)->count()
            : 0;

        // 3. Tổng quan đội xe (Phân biệt sẵn sàng theo lịch, đang lưu hành, và bảo trì)
        $totalCars = Car::count();
        $maintenanceCars = Car::where('status', 'maintenance')->orWhere('is_active', false)->count();

        // Xe đang lưu hành hoặc có lịch đã duyệt bao phủ mốc hiện tại
        $rentingCarIds = Booking::where(function ($q) use ($now) {
            $q->where('tinh_trang', Booking::STATUS_IN_PROGRESS)
              ->orWhere(function ($sub) use ($now) {
                  $sub->where('tinh_trang', Booking::STATUS_CONFIRMED)
                      ->where('start_date', '<=', $now)
                      ->where('end_date', '>=', $now);
              });
        })->pluck('car_id')->filter()->unique()->toArray();
        $rentingCarsCount = count($rentingCarIds);

        // Xe sẵn sàng: active = true, status != maintenance, và không trùng lịch đang thuê
        $availableCarsCount = Car::where('is_active', true)
            ->where('status', '!=', 'maintenance')
            ->whereNotIn('id', $rentingCarIds)
            ->count();

        $availableRate = $totalCars > 0 ? round(($availableCarsCount / $totalCars) * 100, 1) : 0;
        $totalUsers = User::count();

        // 4. Biểu đồ dòng tiền thu (Daily Trend nếu khoảng ngày <= 31 ngày; Monthly Trend nếu > 31 ngày hoặc toàn bộ)
        $isDailyRange = $startDate && $endDate && $startDate->diffInDays($endDate) <= 31;
        if ($isDailyRange) {
            $revenueChart = $this->getDailyRevenueTrend($startDate, $endDate, $dateBy);
        } else {
            $revenueChart = $this->getMonthlyRevenueTrend($months, $dateBy, $startDate, $endDate);
        }

        // 5. 5 Đơn đặt xe mới nhất (Tải tối ưu bằng SQL limit(5), không tải toàn bộ bảng)
        $recentBookings = Booking::with(['user:id,ho_ten,so_dien_thoai', 'car:id,name,image'])
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(function ($b) use ($canViewFinancial) {
                return [
                    'id'            => $b->id,
                    'ma_dat_xe'     => $b->ma_dat_xe,
                    'user_name'     => $b->user->ho_ten ?? 'Khách hàng',
                    'user_phone'    => $b->user->so_dien_thoai ?? '',
                    'car_name'      => $b->car->name ?? 'Xe hệ thống',
                    'car_image'     => $b->car->image ?? null,
                    'created_at'    => $b->created_at ? Carbon::parse($b->created_at)->format('d/m/Y H:i') : '',
                    'tong_tien'     => $canViewFinancial ? (int) $b->tong_tien : null,
                    'tinh_trang'    => (int) $b->tinh_trang,
                    'is_thanh_toan' => (int) $b->is_thanh_toan,
                    'bill_image'    => $b->bill_image,
                ];
            })->values()->toArray();

        // 6. Phân bổ trạng thái thuê
        $statusDistribution = Booking::select(
            DB::raw('count(*) as count'),
            'tinh_trang'
        )
        ->groupBy('tinh_trang')
        ->get();

        // 7. Phân bổ trạng thái thanh toán
        $paymentDistribution = [
            [
                'code'  => 'valid_paid',
                'label' => 'Đã thanh toán (Hợp lệ)',
                'count' => Booking::where('is_thanh_toan', 1)->where('tinh_trang', '!=', Booking::STATUS_CANCELLED)->count(),
                'total' => $canViewFinancial ? $this->roundCurrency(Booking::where('is_thanh_toan', 1)->where('tinh_trang', '!=', Booking::STATUS_CANCELLED)->sum('tong_tien')) : null,
            ],
            [
                'code'  => 'refund_review',
                'label' => 'Đã thu tiền (Cần xử lý hoàn tiền)',
                'count' => Booking::where('is_thanh_toan', 1)->where('tinh_trang', Booking::STATUS_CANCELLED)->count(),
                'total' => $canViewFinancial ? $this->roundCurrency(Booking::where('is_thanh_toan', 1)->where('tinh_trang', Booking::STATUS_CANCELLED)->sum('tong_tien')) : null,
            ],
            [
                'code'  => 'pending_receipt',
                'label' => 'Chờ đối soát biên lai',
                'count' => Booking::where('is_thanh_toan', 0)->whereNotNull('bill_image')->where('bill_image', '!=', '')->count(),
                'total' => $canViewFinancial ? $this->roundCurrency(Booking::where('is_thanh_toan', 0)->whereNotNull('bill_image')->where('bill_image', '!=', '')->sum('tong_tien')) : null,
            ],
            [
                'code'  => 'unpaid_approved',
                'label' => 'Đã duyệt chưa thanh toán',
                'count' => Booking::where('is_thanh_toan', 0)->where('tinh_trang', Booking::STATUS_CONFIRMED)->count(),
                'total' => $canViewFinancial ? $this->roundCurrency(Booking::where('is_thanh_toan', 0)->where('tinh_trang', Booking::STATUS_CONFIRMED)->sum('tong_tien')) : null,
            ],
            [
                'code'  => 'unpaid_pending',
                'label' => 'Đơn chờ duyệt chưa thanh toán',
                'count' => Booking::where('is_thanh_toan', 0)->where('tinh_trang', Booking::STATUS_PENDING)->whereNull('bill_image')->count(),
                'total' => $canViewFinancial ? $this->roundCurrency(Booking::where('is_thanh_toan', 0)->where('tinh_trang', Booking::STATUS_PENDING)->whereNull('bill_image')->sum('tong_tien')) : null,
            ]
        ];

        // 8. Đóng gói Summary với phân quyền tài chính
        $mergedSummary = array_merge($summary, [
            // Thông tin đội xe chi tiết
            'total_cars'               => $totalCars,
            'available_cars'           => $availableCarsCount,
            'renting_cars'             => $rentingCarsCount,
            'maintenance_cars'         => $maintenanceCars,
            'available_rate'           => $availableRate,
            'total_users'              => $totalUsers,

            // Chỉ số vận hành ưu tiên
            'deliveries_today'         => $deliveriesTodayCount,
            'deliveries_pending'       => $deliveriesPendingCount,
            'deliveries_completed'     => $deliveriesCompletedCount,
            'returns_today'            => $returnsTodayCount,
            'returns_pending'          => $returnsPendingCount,
            'returns_received'         => $returnsReceivedCount,
            'overdue_returns_count'    => $overdueReturnsCount,

            // Khối việc cần xử lý ngay
            'pending_receipts_count'   => $pendingReceiptsCount,
            'new_contacts_count'       => $newContactsCount,
        ]);

        if (!$canViewFinancial) {
            // Bảo mật: Xóa toàn bộ số tiền tài chính nhạy cảm đối với vai trò không có quyền xem
            $mergedSummary['total_booking_value'] = null;
            $mergedSummary['confirmed_booking_value'] = null;
            $mergedSummary['paid_booking_value'] = null;
            $mergedSummary['valid_paid_revenue'] = null;
            $mergedSummary['total_revenue'] = null;
            $mergedSummary['net_rental_collected'] = null;
            $mergedSummary['refund_review_value'] = null;
            $mergedSummary['unpaid_confirmed_value'] = null;
            $mergedSummary['pending_receipt_value'] = null;
            $mergedSummary['total_deposit_held'] = null;
            $mergedSummary['period_deposit_collected'] = null;
            $mergedSummary['period_deposit_refunded'] = null;
            $mergedSummary['period_deposit_deducted'] = null;
            $mergedSummary['total_rental_paid'] = null;
            $mergedSummary['total_rental_refunded'] = null;
            $mergedSummary['legacy_missing_date_value'] = null;

            $revenueChart['chart'] = [];
        }

        return [
            'summary'              => $mergedSummary,
            'operational_actions'  => [
                'pending_receipts'  => $pendingReceiptsCount,
                'new_contacts'      => $newContactsCount,
                'overdue_returns'   => $overdueReturnsCount,
                'overdue_bookings'  => $overdueBookings,
            ],
            'fleet_breakdown'      => [
                'total_cars'        => $totalCars,
                'available_cars'    => $availableCarsCount,
                'renting_cars'      => $rentingCarsCount,
                'maintenance_cars'  => $maintenanceCars,
                'available_rate'    => $availableRate,
            ],
            'recent_bookings'      => $recentBookings,
            'revenue_chart'        => $revenueChart['chart'],
            'chart_granularity'    => $revenueChart['granularity'] ?? 'monthly',
            'legacy_undated'       => $canViewFinancial ? $revenueChart['legacy_undated'] : ['count' => 0, 'total' => 0],
            'status_distribution' => $statusDistribution,
            'payment_distribution' => $paymentDistribution,
            'can_view_financial'   => $canViewFinancial,
        ];
    }

    /**
     * Tính toán bảng tóm tắt doanh thu đồng bộ cho cả Dashboard và danh sách Đơn hàng.
     *
     * @param string $dateBy
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function calculateRevenueSummary(string $dateBy = self::DATE_BY_PAYMENT, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        // Tổng đơn & tổng giá trị toàn hệ thống (không lọc ngày)
        $totalBookingsAllTime = Booking::count();
        $pendingBookingsCount = Booking::where('tinh_trang', Booking::STATUS_PENDING)->count();

        // Kiểm tra số lượng đơn lịch sử thiếu ngày thanh toán (payment_confirmed_at IS NULL)
        $legacyMissingDateQuery = Booking::where('is_thanh_toan', 1)->whereNull('payment_confirmed_at');
        $legacyMissingDateCount = $legacyMissingDateQuery->count();
        $legacyMissingDateValue = $this->roundCurrency($legacyMissingDateQuery->sum('tong_tien'));

        // Áp dụng bộ lọc thời gian nếu có
        $bookingDateQuery = Booking::query();
        $paymentDateQuery = Booking::query();

        if ($startDate && $endDate) {
            $bookingDateQuery->whereBetween('created_at', [$startDate, $endDate]);
            $paymentDateQuery->whereBetween('payment_confirmed_at', [$startDate, $endDate]);
        } elseif ($startDate) {
            $bookingDateQuery->where('created_at', '>=', $startDate);
            $paymentDateQuery->where('payment_confirmed_at', '>=', $startDate);
        } elseif ($endDate) {
            $bookingDateQuery->where('created_at', '<=', $endDate);
            $paymentDateQuery->where('payment_confirmed_at', '<=', $endDate);
        }

        $activePaymentQuery = ($dateBy === self::DATE_BY_PAYMENT && ($startDate || $endDate)) 
            ? $paymentDateQuery 
            : ($dateBy === self::DATE_BY_BOOKING && ($startDate || $endDate) ? $bookingDateQuery : Booking::query());

        // 1. Tổng giá trị đơn đặt (Total Booking Value / GMV trong kỳ)
        $totalBookingValue = $this->roundCurrency((clone $bookingDateQuery)->sum('tong_tien'));
        $totalBookingsFiltered = (clone $bookingDateQuery)->count();

        // 2. Giá trị đơn đã xác nhận duyệt xe (Confirmed Rental Value)
        $confirmedBookingValue = $this->roundCurrency(
            (clone $bookingDateQuery)->where('tinh_trang', Booking::STATUS_CONFIRMED)->sum('tong_tien')
        );

        // 3. Tổng giá trị đơn được đánh dấu đã thanh toán (Gross Paid Bookings)
        $paidBookingValue = $this->roundCurrency(
            (clone $activePaymentQuery)->where('is_thanh_toan', 1)->sum('tong_tien')
        );

        // 4. Doanh thu đơn hợp lệ đã thanh toán (Valid Paid Revenue - Net Valid)
        $validPaidRevenue = $this->roundCurrency(
            (clone $activePaymentQuery)->where('is_thanh_toan', 1)->where('tinh_trang', '!=', Booking::STATUS_CANCELLED)->sum('tong_tien')
        );

        // 5. Tiền đơn hủy cần xử lý hoàn tiền (Refund Review Value)
        $refundReviewValue = $this->roundCurrency(
            (clone $activePaymentQuery)->where('is_thanh_toan', 1)->where('tinh_trang', Booking::STATUS_CANCELLED)->sum('tong_tien')
        );

        // 6. Công nợ đơn đã duyệt chưa thu tiền (Unpaid Confirmed)
        $unpaidConfirmedValue = $this->roundCurrency(
            (clone $bookingDateQuery)->where('tinh_trang', Booking::STATUS_CONFIRMED)->where('is_thanh_toan', 0)->sum('tong_tien')
        );

        // 7. Chờ đối soát biên lai (Pending Receipt)
        $pendingReceiptValue = $this->roundCurrency(
            (clone $bookingDateQuery)->where('is_thanh_toan', 0)->whereNotNull('bill_image')->where('bill_image', '!=', '')->sum('tong_tien')
        );

        // 8. Quản lý số dư tiền cọc và dòng tiền thực thu từ booking_transactions
        // Mốc báo cáo để tính số dư ký quỹ: Lũy kế đến mốc báo cáo (endDate ?: now())
        $depositMilestone = $endDate ? $endDate->copy()->endOfDay() : Carbon::now();

        $totalDepositHeld = 0;
        $totalDepositDeducted = 0;
        $totalDepositRefunded = 0;
        $periodDepositCollected = 0;
        $periodDepositRefunded = 0;
        $periodDepositDeducted = 0;
        $totalRentalPaid = 0;
        $totalRentalRefunded = 0;
        $netRentalCollected = 0;

        if (Schema::hasTable('booking_transactions')) {
            // A. Số dư tiền cọc đang giữ đến mốc báo cáo (Cumulative snapshot balance)
            $cumDepositCollected = (int) BookingTransaction::where('status', BookingTransaction::STATUS_CONFIRMED)
                ->where('type', BookingTransaction::TYPE_DEPOSIT_COLLECTION)
                ->where('transaction_time', '<=', $depositMilestone)
                ->sum('amount');

            $cumDepositRefunded = (int) BookingTransaction::where('status', BookingTransaction::STATUS_CONFIRMED)
                ->where('type', BookingTransaction::TYPE_DEPOSIT_REFUND)
                ->where('transaction_time', '<=', $depositMilestone)
                ->sum('amount');

            $cumDepositDeducted = (int) BookingTransaction::where('status', BookingTransaction::STATUS_CONFIRMED)
                ->where('type', BookingTransaction::TYPE_DEPOSIT_DEDUCTION)
                ->where('transaction_time', '<=', $depositMilestone)
                ->sum('amount');

            $totalDepositHeld = max(0, $cumDepositCollected - $cumDepositRefunded - $cumDepositDeducted);
            $totalDepositRefunded = $cumDepositRefunded;
            $totalDepositDeducted = $cumDepositDeducted;

            // B. Dòng tiền cọc và tiền thuê phát sinh trong kỳ lọc (Period flow)
            $txPeriodQuery = BookingTransaction::where('status', BookingTransaction::STATUS_CONFIRMED);
            if ($startDate && $endDate) {
                $txPeriodQuery->whereBetween('transaction_time', [$startDate, $endDate]);
            } elseif ($startDate) {
                $txPeriodQuery->where('transaction_time', '>=', $startDate);
            } elseif ($endDate) {
                $txPeriodQuery->where('transaction_time', '<=', $endDate);
            }

            $periodDepositCollected = (int) (clone $txPeriodQuery)->where('type', BookingTransaction::TYPE_DEPOSIT_COLLECTION)->sum('amount');
            $periodDepositRefunded = (int) (clone $txPeriodQuery)->where('type', BookingTransaction::TYPE_DEPOSIT_REFUND)->sum('amount');
            $periodDepositDeducted = (int) (clone $txPeriodQuery)->where('type', BookingTransaction::TYPE_DEPOSIT_DEDUCTION)->sum('amount');

            $totalRentalPaid = (int) (clone $txPeriodQuery)->where('type', BookingTransaction::TYPE_RENTAL_PAYMENT)->sum('amount');
            $totalRentalRefunded = (int) (clone $txPeriodQuery)->where('type', BookingTransaction::TYPE_RENTAL_REFUND)->sum('amount');
            $netRentalFromTx = max(0, $totalRentalPaid - $totalRentalRefunded);

            // Bổ sung các đơn thanh toán cũ không có bản ghi trong sổ booking_transactions
            $legacyPaidInPeriod = (int) (clone $activePaymentQuery)
                ->where('is_thanh_toan', 1)
                ->where('tinh_trang', '!=', Booking::STATUS_CANCELLED)
                ->whereDoesntHave('transactions')
                ->sum('tong_tien');

            $netRentalCollected = $netRentalFromTx + $legacyPaidInPeriod;
        } else {
            $netRentalCollected = $validPaidRevenue;
        }

        return [
            // Tổng quan số lượng
            'total_bookings'             => ($startDate || $endDate) ? $totalBookingsFiltered : $totalBookingsAllTime,
            'total_bookings_all_time'    => $totalBookingsAllTime,
            'pending_bookings'           => $pendingBookingsCount,
            
            // Các chỉ số tiền tệ chuẩn hóa (đơn vị: VNĐ nguyên bản, không float làm tròn sai)
            'total_booking_value'        => $totalBookingValue,
            'confirmed_booking_value'    => $confirmedBookingValue,
            'paid_booking_value'         => $paidBookingValue,
            'valid_paid_revenue'         => $validPaidRevenue,
            'net_rental_collected'       => $netRentalCollected,
            'refund_review_value'        => $refundReviewValue,
            'unpaid_confirmed_value'     => $unpaidConfirmedValue,
            'pending_receipt_value'      => $pendingReceiptValue,

            // Quản lý tiền cọc và thanh toán nhiều lần
            // LƯU Ý: Tiền cọc đang giữ là quỹ ký quỹ bảo đảm hoàn lại, TUYỆT ĐỐI KHÔNG TÍNH VÀO DOANH THU THUÊ XE.
            'total_deposit_held'         => $totalDepositHeld,
            'total_deposit_deducted'     => $totalDepositDeducted,
            'total_deposit_refunded'     => $totalDepositRefunded,
            'period_deposit_collected'   => $periodDepositCollected,
            'period_deposit_refunded'    => $periodDepositRefunded,
            'period_deposit_deducted'    => $periodDepositDeducted,
            'total_rental_paid'          => $totalRentalPaid,
            'total_rental_refunded'      => $totalRentalRefunded,

            // Tương thích ngược với field total_revenue cũ nhưng trỏ vào valid_paid_revenue chuẩn
            'total_revenue'              => $validPaidRevenue,

            // Cảnh báo dữ liệu lịch sử thiếu ngày thanh toán
            'legacy_missing_date_count'  => $legacyMissingDateCount,
            'legacy_missing_date_value'  => $legacyMissingDateValue,

            // Siêu dữ liệu mô tả chỉ số
            'date_dimension'             => $dateBy,
            'reporting_method'           => 'reconciled_cashflow',
            'label_note'                 => 'Số liệu phản ánh dòng tiền thực tế sau đối soát biên lai và giao dịch ký quỹ; cọc giữ chân được bóc tách độc lập khỏi doanh thu.',
        ];
    }

    /**
     * Lấy xu hướng doanh thu dòng tiền theo từng ngày (áp dụng khi khoảng ngày lọc <= 31 ngày).
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @param string $dateBy
     * @return array
     */
    public function getDailyRevenueTrend(Carbon $startDate, Carbon $endDate, string $dateBy = self::DATE_BY_PAYMENT): array
    {
        $chartData = [];
        $curr = $startDate->copy()->startOfDay();
        $end = $endDate->copy()->endOfDay();

        // Giới hạn an toàn tối đa 31 ngày
        if ($curr->diffInDays($end) > 31) {
            $curr = $end->copy()->subDays(30)->startOfDay();
        }

        $days = [];
        while ($curr->lte($end)) {
            $days[] = $curr->copy();
            $curr->addDay();
        }

        foreach ($days as $day) {
            $startOfDay = $day->copy()->startOfDay();
            $endOfDay = $day->copy()->endOfDay();
            $label = $day->format('d/m');
            $fullDate = $day->format('Y-m-d');

            $rentalPaid = 0;
            $rentalRefund = 0;

            if (Schema::hasTable('booking_transactions')) {
                $rentalPaid = (int) BookingTransaction::where('status', BookingTransaction::STATUS_CONFIRMED)
                    ->where('type', BookingTransaction::TYPE_RENTAL_PAYMENT)
                    ->whereBetween('transaction_time', [$startOfDay, $endOfDay])
                    ->sum('amount');

                $rentalRefund = (int) BookingTransaction::where('status', BookingTransaction::STATUS_CONFIRMED)
                    ->where('type', BookingTransaction::TYPE_RENTAL_REFUND)
                    ->whereBetween('transaction_time', [$startOfDay, $endOfDay])
                    ->sum('amount');
            }

            // Đơn cũ đánh dấu thanh toán không có bản ghi giao dịch
            $legacyPaid = Booking::where('is_thanh_toan', 1)
                ->where('tinh_trang', '!=', Booking::STATUS_CANCELLED)
                ->whereBetween($dateBy === self::DATE_BY_PAYMENT ? 'payment_confirmed_at' : 'created_at', [$startOfDay, $endOfDay])
                ->whereDoesntHave('transactions')
                ->sum('tong_tien');

            $netRentalDay = max(0, $rentalPaid - $rentalRefund) + (int) $legacyPaid;

            $bookingValue = (int) Booking::whereBetween('created_at', [$startOfDay, $endOfDay])->sum('tong_tien');
            $bookingCount = Booking::whereBetween('created_at', [$startOfDay, $endOfDay])->count();

            $chartData[] = [
                'date'                => $fullDate,
                'label'               => $label,
                'month'               => $label, // Tương thích v-for key
                'valid_paid_revenue'  => $this->roundCurrency($netRentalDay),
                'total'               => $this->roundCurrency($netRentalDay),
                'total_booking_value' => $this->roundCurrency($bookingValue),
                'booking_count'       => $bookingCount,
            ];
        }

        return [
            'chart'          => $chartData,
            'granularity'    => 'daily',
            'date_dimension' => $dateBy,
            'legacy_undated' => ['count' => 0, 'total' => 0],
        ];
    }

    /**
     * Lấy xu hướng doanh thu theo tháng (Mặc định 6 tháng gần nhất hoặc theo khoảng ngày chỉ định).
     * Tuyệt đối không lấy created_at làm ngày thu tiền khi date_by = payment_date.
     * Đơn lịch sử thiếu ngày thanh toán được bóc tách riêng, không bịa ngày.
     *
     * @param int $months
     * @param string $dateBy
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function getMonthlyRevenueTrend(int $months = 6, string $dateBy = self::DATE_BY_PAYMENT, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $months = max(1, min($months, 24));
        $chartData = [];

        // 1. Kiểm tra đơn lịch sử có is_thanh_toan = 1 nhưng payment_confirmed_at IS NULL
        $legacyUndatedCount = Booking::where('is_thanh_toan', 1)->whereNull('payment_confirmed_at')->count();
        $legacyUndatedTotal = $this->roundCurrency(
            Booking::where('is_thanh_toan', 1)->whereNull('payment_confirmed_at')->sum('tong_tien')
        );

        $legacyUndated = [
            'count' => $legacyUndatedCount,
            'total' => $legacyUndatedTotal,
            'label' => 'Đơn thanh toán lịch sử (thiếu mốc ngày xác nhận)',
            'note'  => 'Các đơn này được bảo toàn số tiền đã thanh toán nhưng không gắn vào biểu đồ tháng để tránh bịa đặt ngày thu tiền.'
        ];

        // 2. Tính toán từng tháng
        for ($i = $months - 1; $i >= 0; $i--) {
            $carbonMonth = Carbon::now()->subMonths($i);
            $monthStr = $carbonMonth->format('m/Y');
            $startOfMonth = $carbonMonth->copy()->startOfMonth();
            $endOfMonth = $carbonMonth->copy()->endOfMonth();

            if ($dateBy === self::DATE_BY_PAYMENT) {
                // Thu tiền tính theo payment_confirmed_at hoặc transaction_time
                $validPaid = Booking::where('is_thanh_toan', 1)
                    ->where('tinh_trang', '!=', Booking::STATUS_CANCELLED)
                    ->whereBetween('payment_confirmed_at', [$startOfMonth, $endOfMonth])
                    ->sum('tong_tien');

                $refundReview = Booking::where('is_thanh_toan', 1)
                    ->where('tinh_trang', Booking::STATUS_CANCELLED)
                    ->whereBetween('payment_confirmed_at', [$startOfMonth, $endOfMonth])
                    ->sum('tong_tien');

                $bookingValue = Booking::whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('tong_tien');
            } else {
                // Tính theo ngày đặt xe (created_at)
                $validPaid = Booking::where('is_thanh_toan', 1)
                    ->where('tinh_trang', '!=', Booking::STATUS_CANCELLED)
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('tong_tien');

                $refundReview = Booking::where('is_thanh_toan', 1)
                    ->where('tinh_trang', Booking::STATUS_CANCELLED)
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('tong_tien');

                $bookingValue = Booking::whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('tong_tien');
            }

            $chartData[] = [
                'month'               => $monthStr,
                'label'               => $monthStr,
                'total'               => $this->roundCurrency($validPaid),
                'valid_paid_revenue'  => $this->roundCurrency($validPaid),
                'refund_review_value' => $this->roundCurrency($refundReview),
                'total_booking_value' => $this->roundCurrency($bookingValue),
            ];
        }

        return [
            'chart'          => $chartData,
            'granularity'    => 'monthly',
            'legacy_undated' => $legacyUndated,
            'date_dimension' => $dateBy,
        ];
    }

    /**
     * Làm tròn số tiền chính xác, tránh sai lệch floating point.
     * Đơn vị tiền tệ VNĐ không có số thập phân.
     *
     * @param mixed $value
     * @return int
     */
    public function roundCurrency($value): int
    {
        if (is_null($value)) {
            return 0;
        }
        return (int) round((float) $value);
    }
}
