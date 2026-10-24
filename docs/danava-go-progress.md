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
  - Giữ hero hiện có làm phương án quay lại (fallback / switchable qua `?hero=legacy`).
  - Không bake UI vào ảnh: form tìm kiếm, nút bấm, nhãn và thông tin cuống vé là tương tác thật.
  - Tuyến mẫu chuẩn ban đầu: **Đà Nẵng → Huế**, hoàn thiện trước khi nhân rộng các tuyến khác.

---

## 2. Nhật ký Tiến độ theo Từng Bước

### Bước 0: Khởi tạo nhánh và thiết lập môi trường
- **Thời gian**: 2026-10-24
- **Công việc đã thực hiện**:
  - Kiểm tra trạng thái Git, remote `origin` (`HungNguyen3205/Booking-Car.git`) và `danava`.
  - Tạo và checkout sang nhánh `feature/danava-go`.
  - Đã push commit khởi tạo `6a88db4`.

### Bước 1: Chuẩn bị nền tảng DANAVA GO & Dựng khung Hero cô lập
- **Thời gian**: 2026-10-24
- **Công việc đã thực hiện**:
  1. **Kiểm kê kiến trúc & Dữ liệu**:
     - *Phần giữ lại*: Toàn bộ luồng booking (`TripResultsView`, `SeatSelectionModal`, `PassengerForm`, `DemoPayment`, `BoardingTicket`), form tìm kiếm `TripSearchForm`, layout `SiteHeader`/`SiteFooter`.
     - *Phần sẽ thay thế*: Hero diorama 2.5D phẳng cũ được nâng cấp thành module vé giấy mở 3D `DanavaGoHero`.
     - *Cấu hình trùng lặp phát hiện*: `destinationScenes` trong `sceneData.ts` vs `sceneManifest.ts`; `VEHICLE_MODELS` trong `mockData.ts` vs `SCENE_VEHICLE_CONFIGS` trong `sceneVehicleData.ts`.
  2. **Tạo Module cô lập `DanavaGoHero`**:
     - Tạo file `src/components/danava-go/DanavaGoHero.tsx`.
     - Khung HTML tiêu chuẩn: Header thương hiệu, Headline & Mô tả Noto Serif/Navy, Vùng sân khấu vé mở có kích thước hình học ổn định (`aspect-[1376/570]` tránh layout shift), Tabs loại xe chip bo tròn và form tìm kiếm `TripSearchForm`.
  3. **Cơ chế đối chiếu song song (Dev Toggle)**:
     - Tích hợp vào `src/App.tsx`: Mặc định mở `DanavaGoHero`. Nếu có tham số `?hero=legacy` trên URL, hiển thị hero cũ `AnimatedBusHero` để đối chiếu trực tiếp mà không thêm nút bấm kỹ thuật vào giao diện khách.
  4. **Tài liệu tham chiếu**:
     - Tạo `docs/danava-go-reference.md` ghi nhận 5 trạng thái chuyển động (vé gấp đóng, mở ra, cảnh nổi, xe vào, route hiện), quy chuẩn bố cục và ghi nhận tình trạng file video tham chiếu.
- **Kết quả nghiệm thu**:
  - Hero cũ mở được bình thường qua `http://localhost:5173/?hero=legacy`.
  - Hero mới mở được mặc định tại `http://localhost:5173/`, form tìm kiếm hoạt động và chuyển mượt sang trang chọn chuyến.
  - Không có tràn ngang (`hasHorizontalOverflow: false`).
  - Linter: `npx oxlint` (0 warnings, 0 errors).
  - Typecheck & Build: `npm run build` thành công.
