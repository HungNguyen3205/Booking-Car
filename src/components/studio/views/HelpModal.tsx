import {
  HelpCircle,
  X,
  BookOpen,
  QrCode,
  FileSpreadsheet,
  Headphones,
  Keyboard,
  ShieldCheck,
  PhoneCall,
  Mail,
} from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="ds-modal-overlay" onClick={onClose}>
      <div
        className="ds-modal-content ds-modal-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "780px" }}
      >
        <div className="ds-modal-header">
          <div className="d-flex align-items-center gap-2">
            <div className="ds-modal-icon-badge">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="mb-0">Trung tâm trợ giúp & Hướng dẫn vận hành</h3>
              <small className="ds-text-muted">Cẩm nang điều hành hệ thống vé xe DANAVA Go</small>
            </div>
          </div>
          <button className="ds-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="ds-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {/* Quick Shortcuts */}
          <div className="ds-help-card mb-4">
            <h4 className="d-flex align-items-center gap-2">
              <Keyboard size={16} /> Phím tắt thao tác nhanh
            </h4>
            <div className="ds-shortcuts-grid">
              <div className="ds-shortcut-item">
                <kbd>/</kbd>
                <span>Mở tìm kiếm nhanh chức năng & mã vé</span>
              </div>
              <div className="ds-shortcut-item">
                <kbd>Esc</kbd>
                <span>Đóng cửa sổ modal / chi tiết đơn vé</span>
              </div>
              <div className="ds-shortcut-item">
                <kbd>F5</kbd>
                <span>Đồng bộ và làm mới dữ liệu từ server</span>
              </div>
              <div className="ds-shortcut-item">
                <kbd>Ctrl + P</kbd>
                <span>In danh sách hành khách / Lệnh xuất bến</span>
              </div>
            </div>
          </div>

          {/* Operational Guides */}
          <div className="ds-help-card mb-4">
            <h4 className="d-flex align-items-center gap-2">
              <BookOpen size={16} /> Quy trình nghiệp vụ cốt lõi
            </h4>
            <div className="ds-guide-list">
              <div className="ds-guide-item">
                <div className="ds-guide-icon">
                  <QrCode size={18} />
                </div>
                <div>
                  <strong>1. Soát vé & Check-in hành khách lên xe</strong>
                  <p className="text-muted small mb-0">
                    Sử dụng ứng dụng camera trên điện thoại hoặc mã vạch cầm tay để quét QR trên vé điện tử của khách. Trạng thái đơn vé sẽ tức thời chuyển sang "Đã check-in", đảm bảo không trùng ghế.
                  </p>
                </div>
              </div>

              <div className="ds-guide-item">
                <div className="ds-guide-icon">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <strong>2. Kỳ đối soát & Quyết toán nhà xe đối tác</strong>
                  <p className="text-muted small mb-0">
                    Vào mục Tài chính &rarr; Đối soát & công nợ &rarr; Bấm "Khởi tạo kỳ đối soát mới". Hệ thống tự động gom các đơn vé đã hoàn thành chuyến trong kỳ, khấu trừ phí nền tảng (hoa hồng 8-15%) và xuất lệnh chi trả chuyển khoản ngân hàng.
                  </p>
                </div>
              </div>

              <div className="ds-guide-item">
                <div className="ds-guide-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>3. Quản lý sơ đồ ma trận ghế xe</strong>
                  <p className="text-muted small mb-0">
                    Vào mục Vận hành &rarr; Xe & sơ đồ ghế &rarr; Chỉnh sửa Layout ghế. Bạn có thể kéo thả, bật/tắt vị trí ghế tầng 1 / tầng 2, đặt tên mã ghế (A01, B01...) trực quan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="ds-help-card">
            <h4 className="d-flex align-items-center gap-2">
              <Headphones size={16} /> Kênh hỗ trợ kỹ thuật 24/7
            </h4>
            <p className="ds-text-muted small mb-3">
              Nếu gặp sự cố về đường truyền, kết nối cổng thanh toán hoặc lỗi hệ thống điều hành, đội ngũ kỹ thuật DANAVA Go luôn sẵn sàng hỗ trợ trực tuyến:
            </p>
            <div className="ds-contact-grid">
              <div className="ds-contact-box">
                <PhoneCall size={18} className="text-primary" />
                <div>
                  <small>Tổng đài Hotline hỗ trợ</small>
                  <strong>1900 6868 (Nhánh 2)</strong>
                </div>
              </div>
              <div className="ds-contact-box">
                <Mail size={18} className="text-success" />
                <div>
                  <small>Email tiếp nhận kỹ thuật</small>
                  <strong>tech@danavago.vn</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ds-modal-footer">
          <button className="ds-btn ds-btn-primary" onClick={onClose}>
            Đã hiểu, quay lại làm việc
          </button>
        </div>
      </div>
    </div>
  );
}

