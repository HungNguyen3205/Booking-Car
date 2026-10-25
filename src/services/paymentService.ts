/**
 * DANAVA GO - Payment Gateway Integration Service
 * 
 * KIẾN TRÚC TÍCH HỢP THANH TOÁN (PAYMENT GATEWAY SPECIFICATION):
 * - File này định nghĩa interface chuẩn cho việc tích hợp cổng thanh toán trực tuyến
 *   (VietQR, MoMo, VNPay, Thẻ quốc tế Visa/MasterCard).
 * - PHÂN ĐỊNH RÕ RÀNG:
 *   + Phần Frontend Mock Sandbox: Phục vụ trải nghiệm người dùng, demo giao diện và kiểm thử luồng.
 *   + Phần Cần Backend (Production): Cần được thay thế bằng các API endpoints bảo mật
 *     (Server-to-Server, Webhook listener, HMAC-SHA256 signature verification).
 * - TUYỆT ĐỐI KHÔNG:
 *   + Không lưu số thẻ, CVV, OTP hoặc bí mật thanh toán vào localStorage/client storage.
 *   + Không tự ý công bố giao dịch đã hoàn tất tài chính thật nếu chưa có xác thực từ Webhook backend.
 */

export type PaymentMethodType = 'vietqr' | 'momo' | 'vnpay' | 'credit_card';

export type PaymentTransactionState = 
  | 'idle'         // Chưa bắt đầu phiên
  | 'processing'   // Đang kết nối và xử lý giao dịch với cổng
  | 'failed'       // Giao dịch bị từ chối / hết số dư / lỗi kết nối
  | 'cancelled'    // Người dùng chủ động hủy phiên thanh toán
  | 'success';     // Thanh toán được xác nhận hợp lệ

export interface PaymentIntentPayload {
  bookingId: string;
  tripId: string;
  amount: number;
  provider: PaymentMethodType;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export interface PaymentIntentResult {
  transactionId: string;
  state: PaymentTransactionState;
  isDemoSandbox: boolean;
  message: string;
  errorCode?: string;
  timestamp: string;
}

/**
 * Interface chuẩn cho cổng thanh toán.
 * Khi triển khai production, lớp BackendPaymentAdapter sẽ implement interface này
 * để gọi thực tế tới backend endpoint (e.g. POST /api/v1/payments/charge).
 */
export interface IPaymentGateway {
  initiatePayment(
    payload: PaymentIntentPayload,
    forceOutcome?: 'success' | 'insufficient_funds' | 'timeout' | 'user_cancel'
  ): Promise<PaymentIntentResult>;
  verifyTransaction(transactionId: string): Promise<PaymentIntentResult>;
  cancelTransaction(transactionId: string): Promise<PaymentIntentResult>;
}

/**
 * Frontend Mock Sandbox Adapter
 * Mô phỏng phản hồi từ cổng thanh toán với kiểm soát kết quả kiểm thử (Thành công, Thất bại, Hủy).
 */
class SandboxPaymentAdapter implements IPaymentGateway {
  private activeTransactions = new Map<string, PaymentTransactionState>();

  /**
   * Khởi tạo giao dịch mô phỏng (Sandbox)
   * @param payload Thông tin đơn đặt vé
   * @param forceOutcome Kịch bản kiểm thử mong muốn ('success' | 'insufficient_funds' | 'timeout' | 'user_cancel')
   */
  async initiatePayment(
    _payload: PaymentIntentPayload,
    forceOutcome: 'success' | 'insufficient_funds' | 'timeout' | 'user_cancel' = 'success'
  ): Promise<PaymentIntentResult> {
    const transactionId = `TXN_SANDBOX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.activeTransactions.set(transactionId, 'processing');

    // Giả lập độ trễ mạng thực tế từ 1.0s - 1.5s
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (forceOutcome === 'user_cancel') {
      this.activeTransactions.set(transactionId, 'cancelled');
      return {
        transactionId,
        state: 'cancelled',
        isDemoSandbox: true,
        message: 'Giao dịch đã được hủy theo yêu cầu của bạn.',
        errorCode: 'ERR_USER_CANCELLED',
        timestamp: new Date().toISOString(),
      };
    }

    if (forceOutcome === 'insufficient_funds') {
      this.activeTransactions.set(transactionId, 'failed');
      return {
        transactionId,
        state: 'failed',
        isDemoSandbox: true,
        message: 'Giao dịch thất bại: Tài khoản/Thẻ không đủ số dư để thực hiện thanh toán.',
        errorCode: 'ERR_INSUFFICIENT_FUNDS',
        timestamp: new Date().toISOString(),
      };
    }

    if (forceOutcome === 'timeout') {
      this.activeTransactions.set(transactionId, 'failed');
      return {
        transactionId,
        state: 'failed',
        isDemoSandbox: true,
        message: 'Giao dịch thất bại: Hết thời gian chờ phản hồi từ cổng thanh toán (Timeout).',
        errorCode: 'ERR_GATEWAY_TIMEOUT',
        timestamp: new Date().toISOString(),
      };
    }

    // Default: Success in sandbox environment
    this.activeTransactions.set(transactionId, 'success');
    return {
      transactionId,
      state: 'success',
      isDemoSandbox: true,
      message: 'Mô phỏng thanh toán thành công trong môi trường Sandbox.',
      timestamp: new Date().toISOString(),
    };
  }

  async verifyTransaction(transactionId: string): Promise<PaymentIntentResult> {
    const state = this.activeTransactions.get(transactionId) || 'failed';
    return {
      transactionId,
      state,
      isDemoSandbox: true,
      message: `Trạng thái giao dịch: ${state}`,
      timestamp: new Date().toISOString(),
    };
  }

  async cancelTransaction(transactionId: string): Promise<PaymentIntentResult> {
    this.activeTransactions.set(transactionId, 'cancelled');
    return {
      transactionId,
      state: 'cancelled',
      isDemoSandbox: true,
      message: 'Giao dịch đã được hủy thành công.',
      timestamp: new Date().toISOString(),
    };
  }
}

export const paymentGateway = new SandboxPaymentAdapter();
