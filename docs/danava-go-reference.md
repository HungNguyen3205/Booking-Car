# DANAVA GO — Tài liệu Tham chiếu Thiết kế & Chuyển động

**Trạng thái cập nhật**: 2026-10-24  
**Nhánh làm việc**: `feature/danava-go`

---

## 1. Nguồn Tham chiếu & Báo cáo Tình trạng File
- **Video tham chiếu**:
  > **Báo cáo tình trạng**: Trong repository hiện tại không có file video đính kèm (`.mp4`, `.webm`, `.mov`). Chúng tôi sử dụng các keyframe và mô tả chi tiết do người dùng cung cấp làm tiêu chuẩn chính xác, không tự suy diễn hoặc đoán là đã xem video khi chưa có file vật lý trong repo.
- **Vai trò của video**: Là **chuẩn chuyển động** (motion timing, easing, trình tự các lớp mở ra).
- **Vai trò của Frame cuối**: Là **chuẩn bố cục** (tỷ lệ các khối, vị trí chữ, vị trí sân khấu mô hình, các điểm tiếp đất của bánh xe, cuống vé và form tìm kiếm).
- **Lưu ý chất lượng nội dung**:
  - **Không sao chép lỗi chính tả, typography lỗi hoặc ngày tháng cũ** xuất hiện trong các video demo mẫu.
  - Sử dụng ngày thực tế hiện tại (Việt Nam) và thông tin điểm đón/trả chính xác: **Đà Nẵng (Cầu Rồng) → Huế (Ngọ Môn)**.

---

## 2. Các Trạng thái Chuyển động Cốt lõi (State Progression)

Quy trình chuyển động của vé mở pop-up 3D chia làm 5 pha nối tiếp (tổng thời lượng chuẩn 1.8s – 2.4s):

| Pha | Tên trạng thái | Mô tả chi tiết | Thời điểm & Thời lượng |
|---|---|---|---|
| **Pha 1** | **Vé gấp đóng (Folded Ticket)** | Chiếc vé giấy cao cấp nằm trên nền cream `#F7F4EC`, có nếp gấp giữa và viền khuyết notch hai đầu. Header và headline editorial bắt đầu fade/translateY nhẹ. | `0.0s – 0.3s` (300ms) |
| **Pha 2** | **Vé mở ra (Paper Unfolding)** | Hai nếp gấp vé mở phẳng ra hai bên theo trục 3D nhẹ, tạo nền móng sân khấu (stage base) cho cảnh quan bên trong. | `0.3s – 0.8s` (500ms) |
| **Pha 3** | **Cảnh nổi (Pop-up Scenery)** | Các lớp địa danh (Cầu Rồng bên trái, Núi Hải Vân ở giữa, Ngọ Môn bên phải) nổi dựng đứng lên từ mặt giấy theo chiều sâu trục Z và tỷ lệ scale. | `0.7s – 1.3s` (600ms) |
| **Pha 4** | **Xe vào đường gần (Vehicle Entrance)** | Xe khách (theo loại được chọn: Giường nằm / Limousine / Cabin VIP) tiến từ góc xa theo đúng đoạn đường cong phía trước rồi dừng vững trên mặt đường. Bánh xe tiếp xúc chặt chẽ với bóng gầm xe. | `1.0s – 1.8s` (800ms) |
| **Pha 5** | **Route hiện & Marker chạy (Route Draw)** | Nét teal mảnh vẽ nối từ Đà Nẵng sang Huế. Nhãn địa danh hiển thị rõ ràng. Marker nhỏ chuyển động dọc tuyến đường. Cuống vé hiển thị thông tin chuyến đi. | `1.5s – 2.2s` (700ms) |

---

## 3. Khung Quy chuẩn Bố cục & Nhận diện Thương hiệu

- **Màu sắc**:
  - Nền toàn trang: Cream `#F7F4EC`
  - Màu thương hiệu chính: Navy `#102744`
  - Màu điểm nhấn hành trình: Teal `#0097A7`
  - Nền vé và thẻ: Ivory `#FFFEFA` / `#FFFDF8`
  - Viền phân tách: Nhẹ nhàng `#E5E3DC`
- **Typography**:
  - Tiêu đề thương hiệu: `Noto Serif` (trang nhã, sang trọng, mang phong cách ấn phẩm du lịch cao cấp).
  - Thẻ thông số & Form: `Be Vietnam Pro` (rõ ràng, tương phản tốt, chuẩn tỷ lệ chữ Việt Nam).
- **Tính toàn vẹn giao diện (Rule 8)**:
  - Form tìm kiếm, các nút bấm, nhãn địa điểm, tabs loại xe và thông tin trên vé là **UI thật có thể tương tác**, không bake giao diện thành ảnh chết.

---

## 4. Bảng Kiểm kê Module (Audit: Giữ lại, Sẽ thay, Cấu hình trùng)

1. **Phần giữ lại (Retained)**:
   - Toàn bộ luồng booking cốt lõi: tìm chuyến (`TripResultsView`), chọn ghế (`SeatSelectionModal`), nhập thông tin hành khách (`PassengerForm`), thanh toán giả lập (`DemoPayment`), xuất vé điện tử (`BoardingTicket`), tra cứu vé (`TicketLookupView`).
   - Component form tìm kiếm [TripSearchForm.tsx](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/home/TripSearchForm.tsx) (đã có validation chuẩn, cập nhật state nguyên tử, swap 180° không reload).
   - Component layout chung: [SiteHeader.tsx](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/layout/SiteHeader.tsx), [SiteFooter.tsx](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/layout/SiteFooter.tsx).
   - Mock data và business logic: [bookingService.ts](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/services/bookingService.ts).
   - Hero cũ [AnimatedBusHero.tsx](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/home/AnimatedBusHero.tsx) phục vụ đối chiếu (`?hero=legacy`).
2. **Phần sẽ thay thế / nâng cấp cho DANAVA GO**:
   - Module [DanavaGoHero.tsx](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/DanavaGoHero.tsx) thay thế giao diện panorama 2.5D phẳng thành mô hình vé giấy gập 3D mở ra cảnh quan pop-up.
   - Tích hợp hiệu ứng mở nếp gấp vé giấy vật lý thật và xe pop-up theo tuyến Đà Nẵng → Huế.
3. **Các cấu hình đang trùng lặp cần dọn dẹp ở các bước sau**:
   - Cấu hình cảnh: `destinationScenes` trong [sceneData.ts](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/data/sceneData.ts) (phương án chia 2 ảnh cũ) vs `sceneManifest.ts` (manifest tuyến đường).
   - Cấu hình xe: `VEHICLE_MODELS` trong [mockData.ts](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/data/mockData.ts) vs `SCENE_VEHICLE_CONFIGS` trong [sceneVehicleData.ts](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/data/sceneVehicleData.ts).
