# DANAVA GO — Tiến độ & Kế hoạch Nâng cấp Frontend

**Repo**: `https://github.com/HungNguyen3205/Booking-Car.git`  
**Nhánh làm việc**: `feature/danava-go` (tạo từ `main` tại commit `5db7170`)  
**Khởi tạo**: 2026-10-24

---

## 1. Mục tiêu & Nguyên tắc Cốt lõi
- **Mục tiêu**: Nâng cấp giao diện frontend thành **DANAVA GO**, nổi bật với Hero vé giấy mở thành mô hình cảnh 3D (pop-up folding ticket diorama), xe và địa danh chuyển động theo video/mô hình tham chiếu.
- **Phong cách thương hiệu**:
  - Tên thương hiệu: **DANAVA GO**
  - Màu nền chủ đạo: Cream `#F7F4EC`
  - Màu thương hiệu chính: Navy `#102744`
  - Điểm nhấn: Teal `#0097A7`
  - Typography: `Noto Serif` (tiêu đề trang nhã) & `Be Vietnam Pro` (giao diện, thông số kỹ thuật)
- **Quy tắc làm việc**:
  - Không tạo dự án mới, không xóa code cũ, không phá vỡ luồng booking hiện tại.
  - Giữ hero hiện có làm phương án quay lại (fallback / switchable).
  - Không bake UI vào ảnh: form tìm kiếm, nút bấm, nhãn và thông tin cuống vé là tương tác thật.
  - Tuyến mẫu chuẩn ban đầu: **Đà Nẵng → Huế**, hoàn thiện trước khi nhân rộng các tuyến khác.

---

## 2. Nhật ký Tiến độ theo Từng Bước

### Bước 0: Khởi tạo nhánh và thiết lập môi trường
- **Thời gian**: 2026-10-24
- **Công việc đã thực hiện**:
  - Đọc và kiểm tra trạng thái Git, remote `origin` (`HungNguyen3205/Booking-Car.git`) và `danava`.
  - Tạo và chuyển sang nhánh `feature/danava-go`.
  - Khởi tạo tài liệu theo dõi [danava-go-progress.md](file:///d:/NamHung/Projects/Code/DatVeXeONL/docs/danava-go-progress.md).
- **Kết quả kiểm tra**:
  - `git branch`: `feature/danava-go`
  - `npm run build`: Hoàn thành thành công (0 errors).
  - `npx oxlint`: 0 warnings, 0 errors.
- **Kế hoạch bước tiếp theo**: Bắt đầu Bước 1 do người dùng giao.
