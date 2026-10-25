# DANAVA GO — Nền Tảng Đặt Vé Xe Khách Trực Tuyến Cao Cấp

DANAVA GO là nền tảng bán vé xe khách trực tuyến thế hệ mới, nổi bật với giao diện đặt vé phong cách hiện đại và sân khấu sa bàn vé giấy mở 3D (Pop-up Folding Ticket Diorama) tương tác thời gian thực trên Three.js / React Three Fiber.

---

## 1. Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu cầu môi trường
- **Node.js**: Phiên bản 18+ hoặc 20+ LTS
- **Trình quản lý gói**: `npm` (đi kèm Node.js)
- **Trình duyệt**: Hỗ trợ WebGL 1.0/2.0 (Chrome, Safari, Firefox, Edge trên Desktop & Mobile)

### Lệnh chạy cục bộ
```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển (Development Server)
npm run dev

# 3. Kiểm tra lỗi mã nguồn (Linting)
npm run lint      # hoặc: npx oxlint

# 4. Kiểm tra kiểu TypeScript & Đóng gói sản phẩm (Production Build)
npm run build     # thực thi: tsc -b && vite build

# 5. Xem trước bản đóng gói (Preview)
npm run preview
```

Ứng dụng mặc định phục vụ tại: `http://localhost:5173/`

---

## 2. Kiến Trúc 3D Hero Sa Bàn Vé Mở (Pop-up Diorama Architecture)

Hero của DANAVA GO được thiết kế độc lập, bảo toàn 100% hiệu năng của luồng đặt vé và không gây gián đoạn layout:

```
src/components/danava-go/
├── DanavaGoHero.tsx               # Khung bao Hero: Tiêu đề editorial, form tìm kiếm, tabs xe & khung sa bàn 3D
└── 3d/
    ├── JourneyCanvas.tsx          # Canvas Three.js cô lập, quản lý camera thích ứng, DPR và tạm dừng ngoài viewport
    ├── PaperTicket.tsx            # Mô hình vé giấy ngà (Ivory Paper) gập/mở quanh trục bản lề X = -1.4
    ├── CurvedRoad.tsx             # Cung đường cong bezier mềm mại kết nối 2 miền di sản
    ├── VehicleStage.tsx           # Quản lý trượt vào/rời đi của 3 dòng xe (Giường nằm, Limousine, Cabin VIP)
    ├── LandmarkSlotStage.tsx      # Quản lý trồi sụt của các địa danh (Origin bên trái, Destination bên phải)
    ├── CentralPassTransition.tsx  # Cụm đèo Hải Vân & dãy núi chuyển tiếp ở giữa
    ├── DestinationLabelOverlay.tsx# Chiếu tọa độ 3D sang màn hình 2D để vẽ nhãn SVG & tuyến đường động
    ├── WebGLFallback.tsx          # Tấm vé Poster 2D cao cấp hiển thị khi WebGL không khả dụng
    ├── journeyTimeline.ts         # Đồng hồ điều phối 2.5s tập trung (0 React re-renders)
    ├── routeTransition.ts         # Bộ điều phối chuyển cảnh chuyển tuyến mượt mà (Latest-Choice-Wins)
    ├── destinationConfig.ts       # Cấu hình địa danh, tọa độ neo (anchor) và vùng an toàn (safe zone)
    ├── vehicleConfig.ts           # Thông số kích thước, bánh xe, vật liệu và trạng thái xe
    ├── roadConfig.ts              # Đường cong tham số không gian 3D của đường xe chạy
    └── environmentConfig.ts       # Nguồn sáng Sun Key Light, Soft Fill, Tone bóng đổ và Camera
```

### Các cơ chế tối ưu nổi bật:
1. **Lazy-loading Landmark & Vehicle**: Chỉ nạp cặp ban đầu (Đà Nẵng → Huế, Xe Giường nằm). Các địa danh Nha Trang, TP. HCM và xe Limousine, Cabin được tách chunk riêng và chỉ tải khi người dùng chọn.
2. **Tự động ngắt hoạt ảnh (Resource Saving)**: Tích hợp `IntersectionObserver` và `visibilitychange`. Khi người dùng cuộn khỏi Hero hoặc đổi tab, `frameloop` chuyển về `"never"` (0 FPS, 0 GPU load).
3. **Camera thích ứng Mobile**: Tự động nhận diện thiết bị < 768px để điều chỉnh khung hình 16:11 và góc nhìn camera (`fov: 42`), không co cụm hay thu nhỏ thô từ desktop.
4. **Poster Fallback**: Tự động chuyển về poster vé 2D sang trọng khi gặp sự cố WebGL hoặc mất Context (`webglcontextlost`), cam kết form tìm kiếm và đặt vé không bao giờ bị tê liệt.

---

## 3. Hướng Dẫn Mở Rộng Địa Danh & Phương Tiện

### Thêm một địa danh mới
1. **Định nghĩa trong `src/components/danava-go/3d/destinationConfig.ts`**:
   - Thêm `searchLocationId` (ví dụ: `'da-lat'`), `administrativeArea` (`'Tỉnh Lâm Đồng'`), `sceneLandmarkId`.
   - Cấu hình vị trí và góc quay cho 2 slot: `placement.origin` (khi là nơi đi) và `placement.destination` (khi là nơi đến).
   - Đặt tọa độ neo nhãn `labelAnchor` để đường cong SVG bắt đúng đỉnh tháp/công trình.
2. **Tạo component Landmark 3D**:
   - Tạo file trong `src/components/danava-go/3d/` (ví dụ: `DaLatLandmark.tsx`).
   - Xây dựng hình học đa giác tối ưu (< 3,000 triangles) và gắn `timelineRef` để hỗ trợ nổi pop-up.
3. **Đăng ký vào `LandmarkSlotStage.tsx`**:
   - Khai báo `React.lazy` component và gắn điều kiện hiển thị theo `destination.id`.

### Thêm một dòng xe mới
1. **Khai báo trong `src/components/danava-go/3d/vehicleConfig.ts`**:
   - Đăng ký `category` mới vào `VehicleCategory` (`types/index.ts`).
   - Thêm thông số kích thước dài/rộng/cao, bán kính bánh xe `wheelRadius`.
2. **Tạo component xe 3D**:
   - Tạo component (ví dụ: `src/components/danava-go/3d/DoubleDeckerCoach.tsx`).
   - Gắn tên mesh quay bánh `child.name = 'WHEEL_SPIN'`.
3. **Đăng ký vào `VehicleStage.tsx` & Tabs trên `DanavaGoHero.tsx`**.

---

## 4. Nguồn Gốc Tài Nguyên & Bản Quyền Asset

- **Hình học 3D (Geometry)**: 100% Procedural WebGL BufferGeometry (Three.js Extrude, Cylinder, Box, Tube, Curve) được lập trình thuần túy bằng mã nguồn TypeScript, không tải file 3D ngoại vi nặng nề (.gltf / .obj).
- **Vật liệu (Materials)**: MeshStandardMaterial và MeshBasicMaterial sử dụng bảng màu thương hiệu DANAVA GO (Navy `#102744`, Teal `#0097A7`, Amber `#F3B54A`, Cream `#F7F4EC`).
- **Icons**: [Lucide React](https://lucide.dev/) (giấy phép ISC/MIT).
- **Phông chữ (Typography)**:
  - `Noto Serif`: Tiêu đề sang trọng, cảm giác ấn phẩm báo chí du lịch (Google Fonts, Open Font License).
  - `Be Vietnam Pro`: Thể hiện thông số hành trình, số ghế, nhãn vé rõ ràng, hỗ trợ tiếng Việt hoàn hảo (Google Fonts, Open Font License).
- **Âm thanh**: 100% không chứa âm thanh, không autoplay audio.

---

## 5. Ranh Giới Kỹ Thuật: Phần Hoàn Thiện vs. Phần Cần Backend (Minh Bạch Sandbox)

> [!IMPORTANT]
> Dự án hiện tại là **Frontend Khách Hàng Hoàn Thiện (Client-side Complete)** kết hợp cùng lớp **Mô Phỏng Sandbox Chuẩn Mực (Sandbox Mock Adapter)**. Không tự xưng là "hoàn thiện production" đối với các nghiệp vụ đòi hỏi máy chủ tập trung.

| Phân hệ chức năng | Trạng thái Frontend hiện tại | Yêu cầu Backend để đưa vào Production |
| :--- | :--- | :--- |
| **Tìm kiếm & Lọc chuyến** | Hoàn thiện: Lọc giá, giờ đi, nhà xe, loại xe, sắp xếp, responsive | Cần API `GET /api/v1/trips?from=&to=&date=&passengers=` |
| **Sơ đồ & Chọn ghế** | Hoàn thiện: Sơ đồ 1-2 tầng thật, giới hạn số khách, chú thích tiếp cận, cách ly ghế khi đổi chuyến | Cần API giữ chỗ tạm thời có thời hạn (Redis TTL / Distributed Lock) `POST /api/v1/trips/:id/hold-seats` |
| **Thông tin hành khách** | Hoàn thiện: Regex tên $\ge 2$ từ, SĐT 10 số VN, RFC email, điểm đón/trả, lưu bản nháp khi quay lại | Cần API xác thực thông tin đặt vé `POST /api/v1/bookings/draft` |
| **Giao diện thanh toán** | Hoàn thiện: Hợp đồng `IPaymentGateway`, 4 trạng thái (chờ, thành công, lỗi, hủy), bảng điều khiển thử nghiệm sandbox, chống double-submit | Cần tích hợp Cổng thanh toán thực tế: `POST /api/v1/payments/intent`, Webhook IPN xử lý bất đồng bộ từ VietQR / VNPAY / MoMo |
| **Bảo mật thanh toán** | Hoàn thiện: Tuyệt đối không lưu số thẻ, CVV hay bí mật vào `localStorage` | Cần Tokenization / PCI-DSS compliance từ phía Payment Provider |
| **Vé điện tử & In ấn** | Hoàn thiện: Đầy đủ mã vé, tuyến, giờ, ghế, điểm đón/trả, QR xác thực demo, bố cục in `@media print` A4 chuẩn | Cần API xác thực vé ký điện tử `GET /api/v1/tickets/:id/verify` & dịch vụ gửi Email/SMS vé điện tử |
| **Tra cứu vé** | Hoàn thiện: Kiểm tra mã vé và SĐT, loading, không tìm thấy, tuyệt đối không dùng seed giả mạo | Cần API tra cứu vé bảo mật `POST /api/v1/bookings/lookup` |
| **Tài khoản người dùng** | Hoàn thiện: Hợp đồng `IAuthService`, quản lý phiên client demo, hiển thị cấp bậc hội viên, lịch sử đặt vé | Cần Backend Auth: OAuth2 / JWT (httpOnly cookie), máy chủ gửi mã OTP SMS qua điện thoại `POST /api/v1/auth/login`, `POST /api/v1/auth/verify-otp` |

---

## 6. Điểm Khác Biệt So Với Mẫu Tham Chiếu & Các Vấn Đề Đang Mở

Để đảm bảo tính trung thực kỹ thuật cao nhất:

1. **Uốn cong mềm của thớ giấy (Soft-body Paper Curl)**:
   - *Thực tế triển khai*: Cánh vé mở phẳng theo cơ chế bản lề gập 2 mảnh phân vùng (`Hinged Rigid Panel`).
   - *So với video mẫu 3D CGI*: Hoạt cảnh CGI offline có thể mô phỏng tờ giấy uốn cong lượn như dải lụa mềm (Cloth/Soft-body simulation). Việc sử dụng bản lề gập giúp duy trì 60fps trên mọi chip đồ họa điện thoại phổ thông mà vẫn đạt tính thẩm mỹ cao cấp.
2. **Mặt nước phản chiếu động (Dynamic Water Waves)**:
   - *Thực tế triển khai*: Mặt nước sông Hàn và hào nước Kim Thủy dùng vật liệu PBR bắt sáng mịn màng.
   - *Điểm có thể nâng cấp*: Có thể bổ sung Custom Vertex Shader sóng nước lăn tăn nhẹ trong các phiên bản cập nhật tương lai nếu thiết bị hỗ trợ GPU mạnh.
3. **Hiệu ứng hạt bụi bánh xe (Tire Dust Particles)**:
   - *Thực tế triển khai*: 4 bánh xe lăn đúng quãng đường vật lý và đổ bóng gầm êm ái khi dừng lại; chưa tích hợp hệ thống hạt bụi cát văng ra khi phanh gấp.

---

## 7. Giấy Phép & Bản Quyền

Dự án được xây dựng và phát triển cho nền tảng thương mại điện tử vận tải cao cấp **DANAVA GO** © 2026.
