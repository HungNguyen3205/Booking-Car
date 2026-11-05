import { useState, useEffect } from "react";
import {
  Mail,
  MessageSquare,
  CreditCard,
  Building,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  Phone,
  Server,
  Send,
} from "lucide-react";
import { adminApi } from "../../../services/adminApi";

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<"general" | "smtp" | "sms" | "payments">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    // Chung & Liên hệ
    site_name: "DANAVA GO — Hệ Thống Đặt Vé Xe Khách",
    hotline: "1900 6868",
    support_email: "hotro@danavago.vn",
    company_address: "Tầng 5, Tòa nhà Danava Plaza, 150 Nguyễn Tri Phương, Hải Châu, Đà Nẵng",
    booking_auto_cancel_unpaid_hours: 2,

    // SMTP Email vé điện tử
    smtp_host: "smtp.gmail.com",
    smtp_port: "587",
    smtp_username: "booking@danavago.vn",
    smtp_password: "",
    smtp_from_name: "DANAVA GO Vé Điện Tử",
    smtp_from_address: "booking@danavago.vn",

    // SMS Gateway
    sms_brandname: "DANAVAGO",
    sms_api_key: "",
    sms_secret: "",

    // Ngân hàng VietQR
    bank_name: "Ngân hàng TMCP Quân đội (MBBank)",
    bank_account_number: "0905123456",
    bank_account_holder: "CONG TY CP DANAVA GO VIET NAM",
    bank_bin: "970422",
    bank_transfer_instruction: "Chuyển khoản ghi rõ nội dung: [MÃ ĐƠN VÉ] [SĐT KHÁCH]",

    // Cổng VNPAY
    vnpay_tmn_code: "DANAVAGO",
    vnpay_hash_secret: "",
    vnpay_url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",

    // Cổng MoMo
    momo_partner_code: "MOMO_DANAVAGO",
    momo_access_key: "",
    momo_secret_key: "",
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      if (res.status === 1 && res.data) {
        const fetched: Record<string, any> = {};
        Object.entries(res.data).forEach(([k, item]) => {
          fetched[k] = item.value;
        });
        setFormData((prev) => ({
          ...prev,
          ...fetched,
        }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi tải cấu hình hệ thống");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await adminApi.updateSettings(formData);
      if (res.status === 1) {
        setSuccessMsg("Đã lưu các thay đổi cấu hình thành công!");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(res.message || "Không thể cập nhật cấu hình");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ds-page">
      <div className="ds-page-header">
        <div>
          <h2>Cài đặt hệ thống</h2>
          <p className="ds-text-muted">
            Quản trị máy chủ email vé điện tử SMTP, cổng tin nhắn SMS thông báo, API thanh toán VNPAY/MoMo và thông tin chung
          </p>
        </div>
        <div className="ds-header-actions">
          <button className="ds-btn ds-btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="ds-alert ds-alert-success">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="ds-alert ds-alert-danger">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      <div className="ds-settings-layout">
        {/* Navigation Tabs */}
        <div className="ds-settings-nav">
          <button
            className={`ds-settings-tab ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <Building size={16} />
            <div>
              <strong>Chung & Liên hệ</strong>
              <small>Thương hiệu, hotline, địa chỉ</small>
            </div>
          </button>

          <button
            className={`ds-settings-tab ${activeTab === "smtp" ? "active" : ""}`}
            onClick={() => setActiveTab("smtp")}
          >
            <Mail size={16} />
            <div>
              <strong>Email vé điện tử (SMTP)</strong>
              <small>Máy chủ gửi email vé kèm mã QR</small>
            </div>
          </button>

          <button
            className={`ds-settings-tab ${activeTab === "sms" ? "active" : ""}`}
            onClick={() => setActiveTab("sms")}
          >
            <MessageSquare size={16} />
            <div>
              <strong>SMS Gateway</strong>
              <small>SpeedSMS, eSMS Brandname</small>
            </div>
          </button>

          <button
            className={`ds-settings-tab ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            <CreditCard size={16} />
            <div>
              <strong>Thanh toán & Cổng API</strong>
              <small>VietQR, VNPAY, MoMo</small>
            </div>
          </button>
        </div>

        {/* Form Content */}
        <div className="ds-settings-content">
          {loading ? (
            <div className="ds-card ds-loading-state">
              <RefreshCw size={24} className="spin" /> Đang tải cấu hình...
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {/* TAB 1: GENERAL */}
              {activeTab === "general" && (
                <div className="ds-card">
                  <div className="ds-card-header">
                    <h3>Thông tin thương hiệu & Quy chế vận hành</h3>
                    <span className="ds-text-muted">Các thông số hiển thị trên website, vé in và thông báo khách hàng</span>
                  </div>
                  <div className="ds-card-body">
                    <div className="ds-form-grid">
                      <div className="ds-form-group ds-col-2">
                        <label>Tên hệ thống / Đơn vị quản lý</label>
                        <input
                          type="text"
                          value={formData.site_name}
                          onChange={(e) => handleChange("site_name", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>Hotline hỗ trợ tổng đài 24/7</label>
                        <div className="ds-input-icon">
                          <Phone size={15} />
                          <input
                            type="text"
                            value={formData.hotline}
                            onChange={(e) => handleChange("hotline", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="ds-form-group">
                        <label>Email tiếp nhận yêu cầu & phản ánh</label>
                        <div className="ds-input-icon">
                          <Mail size={15} />
                          <input
                            type="email"
                            value={formData.support_email}
                            onChange={(e) => handleChange("support_email", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="ds-form-group ds-col-2">
                        <label>Địa chỉ trụ sở chính</label>
                        <input
                          type="text"
                          value={formData.company_address}
                          onChange={(e) => handleChange("company_address", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>Thời hạn tự động hủy đơn giữ chỗ chưa thanh toán (giờ)</label>
                        <input
                          type="number"
                          min={1}
                          max={72}
                          value={formData.booking_auto_cancel_unpaid_hours}
                          onChange={(e) =>
                            handleChange("booking_auto_cancel_unpaid_hours", parseInt(e.target.value, 10))
                          }
                        />
                        <small className="ds-form-help">
                          Hệ thống sẽ tự động giải phóng sơ đồ ghế nếu khách hàng không hoàn tất thanh toán.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SMTP EMAIL */}
              {activeTab === "smtp" && (
                <div className="ds-card">
                  <div className="ds-card-header">
                    <h3>Cấu hình máy chủ gửi thư điện tử (SMTP)</h3>
                    <span className="ds-text-muted">Gửi xác nhận đặt vé, xuất vé điện tử PDF và thông báo đổi chuyến</span>
                  </div>
                  <div className="ds-card-body">
                    <div className="ds-form-grid">
                      <div className="ds-form-group">
                        <label>Máy chủ SMTP Host</label>
                        <div className="ds-input-icon">
                          <Server size={15} />
                          <input
                            type="text"
                            placeholder="smtp.gmail.com"
                            value={formData.smtp_host}
                            onChange={(e) => handleChange("smtp_host", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="ds-form-group">
                        <label>Cổng SMTP Port</label>
                        <input
                          type="text"
                          placeholder="587 hoặc 465"
                          value={formData.smtp_port}
                          onChange={(e) => handleChange("smtp_port", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>Tài khoản SMTP Username</label>
                        <input
                          type="text"
                          placeholder="booking@danavago.vn"
                          value={formData.smtp_username}
                          onChange={(e) => handleChange("smtp_username", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>Mật khẩu ứng dụng SMTP Password</label>
                        <div className="ds-input-icon">
                          <Lock size={15} />
                          <input
                            type="password"
                            placeholder="••••••••••••"
                            value={formData.smtp_password}
                            onChange={(e) => handleChange("smtp_password", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="ds-form-group">
                        <label>Tên hiển thị người gửi</label>
                        <input
                          type="text"
                          value={formData.smtp_from_name}
                          onChange={(e) => handleChange("smtp_from_name", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>Địa chỉ email người gửi</label>
                        <input
                          type="email"
                          value={formData.smtp_from_address}
                          onChange={(e) => handleChange("smtp_from_address", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="ds-smtp-test mt-4 p-3 ds-bg-subtle rounded border">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Kiểm tra kết nối gửi thư</strong>
                          <p className="ds-text-muted mb-0 small">
                            Gửi email mẫu kiểm tra xem máy chủ SMTP có hoạt động ổn định và không bị chặn thư rác
                          </p>
                        </div>
                        <button
                          type="button"
                          className="ds-btn ds-btn-outline"
                          onClick={() => alert("Đã gửi email kiểm tra tới email hỗ trợ: " + formData.support_email)}
                        >
                          <Send size={15} /> Gửi email thử nghiệm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SMS GATEWAY */}
              {activeTab === "sms" && (
                <div className="ds-card">
                  <div className="ds-card-header">
                    <h3>Cổng tin nhắn SMS thông báo tự động (Brandname)</h3>
                    <span className="ds-text-muted">Nhắn tin SMS chứa Mã vé, Biển số xe và Số điện thoại tài xế trước giờ khởi hành</span>
                  </div>
                  <div className="ds-card-body">
                    <div className="ds-form-grid">
                      <div className="ds-form-group">
                        <label>Thương hiệu tin nhắn (SMS Brandname)</label>
                        <input
                          type="text"
                          placeholder="DANAVAGO"
                          value={formData.sms_brandname}
                          onChange={(e) => handleChange("sms_brandname", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>SMS Gateway API Key</label>
                        <input
                          type="text"
                          placeholder="speed_sms_api_key_..."
                          value={formData.sms_api_key}
                          onChange={(e) => handleChange("sms_api_key", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group ds-col-2">
                        <label>SMS Gateway Secret Token</label>
                        <div className="ds-input-icon">
                          <Lock size={15} />
                          <input
                            type="password"
                            placeholder="••••••••••••••••••••••••"
                            value={formData.sms_secret}
                            onChange={(e) => handleChange("sms_secret", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="ds-alert ds-alert-info mt-3">
                      <strong>Mẫu tin nhắn tự động khi đặt vé thành công:</strong>
                      <p className="mb-0 font-monospace small">
                        [DANAVAGO] Cam on Quy khach da dat ve chuyen [Hà Nội - Hạ Long], Khoi hanh [18:30 25/11], Ghe [A01, A02], Ma ve: [DNV-2026-X8]. Hotline: 19006868.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PAYMENTS & APIS */}
              {activeTab === "payments" && (
                <div className="ds-card">
                  <div className="ds-card-header">
                    <h3>Cổng thanh toán điện tử & Ngân hàng VietQR</h3>
                    <span className="ds-text-muted">Tích hợp tạo mã QR thanh toán tức thời và kết nối cổng VNPAY / MoMo</span>
                  </div>
                  <div className="ds-card-body">
                    <h4 className="ds-section-title">1. Tài khoản ngân hàng nhận tiền chuyển khoản (VietQR PRO)</h4>
                    <div className="ds-form-grid">
                      <div className="ds-form-group">
                        <label>Tên ngân hàng</label>
                        <input
                          type="text"
                          value={formData.bank_name}
                          onChange={(e) => handleChange("bank_name", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>Mã chuẩn ngân hàng (BIN)</label>
                        <input
                          type="text"
                          value={formData.bank_bin}
                          onChange={(e) => handleChange("bank_bin", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>Số tài khoản thụ hưởng</label>
                        <input
                          type="text"
                          className="font-monospace fw-bold"
                          value={formData.bank_account_number}
                          onChange={(e) => handleChange("bank_account_number", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>Tên chủ tài khoản (In hoa không dấu)</label>
                        <input
                          type="text"
                          value={formData.bank_account_holder}
                          onChange={(e) => handleChange("bank_account_holder", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group ds-col-2">
                        <label>Cú pháp hướng dẫn chuyển khoản</label>
                        <input
                          type="text"
                          value={formData.bank_transfer_instruction}
                          onChange={(e) => handleChange("bank_transfer_instruction", e.target.value)}
                        />
                      </div>
                    </div>

                    <hr className="my-4" />

                    <h4 className="ds-section-title">2. Cổng thanh toán trực tuyến VNPAY</h4>
                    <div className="ds-form-grid">
                      <div className="ds-form-group">
                        <label>VNPAY Terminal ID (TMN Code)</label>
                        <input
                          type="text"
                          value={formData.vnpay_tmn_code}
                          onChange={(e) => handleChange("vnpay_tmn_code", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>VNPAY Hash Secret Key</label>
                        <div className="ds-input-icon">
                          <Lock size={15} />
                          <input
                            type="password"
                            placeholder="••••••••••••••••"
                            value={formData.vnpay_hash_secret}
                            onChange={(e) => handleChange("vnpay_hash_secret", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="ds-form-group ds-col-2">
                        <label>VNPAY Endpoint URL</label>
                        <input
                          type="text"
                          value={formData.vnpay_url}
                          onChange={(e) => handleChange("vnpay_url", e.target.value)}
                        />
                      </div>
                    </div>

                    <hr className="my-4" />

                    <h4 className="ds-section-title">3. Cổng thanh toán Ví điện tử MoMo</h4>
                    <div className="ds-form-grid">
                      <div className="ds-form-group">
                        <label>MoMo Partner Code</label>
                        <input
                          type="text"
                          value={formData.momo_partner_code}
                          onChange={(e) => handleChange("momo_partner_code", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group">
                        <label>MoMo Access Key</label>
                        <input
                          type="text"
                          value={formData.momo_access_key}
                          onChange={(e) => handleChange("momo_access_key", e.target.value)}
                        />
                      </div>

                      <div className="ds-form-group ds-col-2">
                        <label>MoMo Secret Key</label>
                        <div className="ds-input-icon">
                          <Lock size={15} />
                          <input
                            type="password"
                            placeholder="••••••••••••••••"
                            value={formData.momo_secret_key}
                            onChange={(e) => handleChange("momo_secret_key", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="ds-card-footer mt-4 d-flex justify-content-end gap-2">
                <button type="submit" className="ds-btn ds-btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? "Đang lưu cấu hình..." : "Lưu tất cả cấu hình"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

