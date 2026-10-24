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

### Bước 2: Dựng môi trường 3D tối giản (JourneyCanvas & Environment)
- **Thời gian**: 2026-10-24
- **Công việc đã thực hiện**:
  1. **Kiểm tra phiên bản & Cài đặt Thư viện Tương thích**:
     - React hiện tại: React 19 (`^19.3.1`).
     - Chọn Three.js và React Three Fiber tương thích chính thức với React 19: `three@^0.174.0`, `@react-three/fiber@^9.8.2`, devDependency `@types/three@^0.174.0`.
     - Cập nhật lockfile `package-lock.json` sạch sẽ, không dùng cờ force.
  2. **Lazy-loading Cô lập Module 3D**:
     - `DanavaGoHero.tsx` sử dụng `React.lazy(() => import('./3d/JourneyCanvas'))` cùng `Suspense`.
     - Khi build production (`npm run build`), toàn bộ Three.js và R3F được tách riêng thành chunk độc lập `dist/assets/JourneyCanvas-*.js` (khoảng 860 kB), không kéo vào các trang booking, checkout, tra cứu vé.
  3. **Tập trung Cấu hình Camera & Ánh sáng (`environmentConfig.ts`)**:
     - Đặt tên chuẩn `DANAVA_3D_CONFIG` tại `src/components/danava-go/3d/environmentConfig.ts` để các asset sau này (vé giấy, đường route, xe) dùng chung:
       - **Màu sắc**:
         - Nền: Cream `#F7F4EC`
         - Ambient light: Ivory nhạt `#FFFDF8`
         - Sun key light: Trắng ấm `#FFFFFF`
         - Sky fill light: Xanh ngọc dịu `#E0F7FA`
         - Shadow tint: Navy `#102744` (độ mờ bóng `0.18`)
         - Dãy núi xa: Đất nhẹ `#DFDCD2`
       - **Camera**:
         - Góc nhìn 3/4 khớp frame kết video tham chiếu.
         - `fov: 36`, `near: 0.1`, `far: 80`
         - `position: [0, 4.8, 9.2]`
         - `target: [0, 0.35, 0]` (hướng vào trung tâm sân khấu vé)
       - **Hệ thống Chiếu sáng & Bóng (Lighting)**:
         - `ambientLight`: intensity `0.8` (đều khắp sân khấu)
         - `directionalLight` (Sun Key Light): position `[-4.2, 7.5, 5.0]`, intensity `1.25`, `castShadow: true`, `shadow-mapSize: [1024, 1024]`, shadow camera bounds `[-6, 6, 6, -6, 0.5, 25]`
         - `directionalLight` (Sky Fill Light): position `[4.5, 3.8, -2.5]`, intensity `0.4`
       - **Mặt phẳng nhận bóng (Shadow-receiving Ground Plane)**:
         - Kích thước `24 x 18`, position `[0, -0.01, 0]`, rotation `[-Math.PI / 2, 0, 0]`
         - Vật liệu `<shadowMaterial transparent opacity={0.18} />` chỉ nhận bóng đổ, không tạo viền khối.
       - **Khí quyển & Dãy núi xa tối giản**:
         - `<fog attach="fog" args={['#F7F4EC', 16, 45]} />`
         - Silhouette dãy núi mờ xa tại position `[0, 0.4, -14]`, opacity `0.45` (tuyệt đối không có công trình hoặc xe trong bước này).
  4. **Canvas Trong suốt & Hòa màu Nền**:
     - Thiết lập WebGL context `alpha: true, antialias: true, powerPreference: 'high-performance'`.
     - `gl.setClearColor('#F7F4EC', 0)` hòa tan hoàn toàn vào màu nền trang web, không lộ bất kỳ khung viền chữ nhật nào.
  5. **DOM Độc lập & Không Chặn Tương tác**:
     - Thẻ canvas và container được thiết lập `pointer-events-none`.
     - Toàn bộ chữ, tiêu đề, form tìm kiếm `TripSearchForm`, chip xe và card ảnh là DOM độc lập, có `pointer-events: auto` và z-index nổi trên mặt canvas.
  6. **Fallback HTML (`WebGLFallback.tsx`)**:
     - Kiểm tra WebGL availability trước khi nạp renderer.
     - Khi WebGL không hỗ trợ hoặc khởi tạo lỗi, hiển thị khung nền tĩnh thanh nhã, thông báo trung thực chế độ tương thích mà không giả danh hoàn thiện.
- **Kết quả nghiệm thu**:
  - **Browser thật (Headless Edge CDP test)**:
    - Canvas khởi tạo thành công với WebGL2 context (`hasContainer: true, hasCanvas: true, canvasWidth: 823, canvasHeight: 430`).
    - Lỗi console renderer: **0 lỗi** (`Total console error count: 0`).
    - Form tìm kiếm click được bình thường, điều hướng URL `?from=...&to=...&step=search` và hiển thị kết quả chuyến đi.
    - Desktop 1440×900: body width 1425px (không tràn, `hasOverflow: false`).
    - Mobile 390px: body width 390px (không tràn, `hasOverflow: false`).
  - **Linter & Typecheck**:
    - `npx oxlint`: 0 warnings, 0 errors.
    - `npm run build`: Thành công 100%, tạo chunk `JourneyCanvas-*.js` độc lập.
  - **Ảnh chụp nghiệm thu**:
    - `danava_go_3d_1440x900.png`
    - `danava_go_3d_390px.png`

