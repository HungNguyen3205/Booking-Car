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

### Bước 3: Dựng trạng thái cuối tĩnh của vé giấy và đường (Paper Ticket & Curved Road)
- **Thời gian**: 2026-10-24
- **Công việc đã thực hiện**:
  1. **Dựng vé giấy Ivory mỏng & Bản lề cơ học chính xác**:
     - *Phân loại vật lý*: Mô hình giấy gấp cứng có bản lề cơ học (`Rigid Folded Paper Panels with Hinge Pivots`), mô tả trung thực không tuyên bố mô phỏng biến dạng giấy mềm (soft-body deformation).
     - *Độ dày giấy*: `0.016` đơn vị (thanh mảnh, cạnh sắc nét, tuyệt đối không giống đế gỗ dày).
     - *Cấu trúc 2 phân vùng*:
       - Sàn vé chính (`Base Deck`): $X \in [-1.4, 3.8]$, chiều sâu $Z = 3.8$, chứa sa bàn và làn đường cong.
       - Cánh vé nắp (`Folding Flap`): $X \in [-3.8, -1.4]$, chiều sâu $Z = 3.8$.
       - Trục bản lề (`Hinge Pivot`): Đặt chính xác tại $[X: -1.4, Y: 0.016, Z: 0]$, cho phép flap quay từ $0^\circ$ (mở phẳng tĩnh) tới $180^\circ$ (gập kín lên sàn chính).
     - *Nếp gấp & Khuyết vé (Notches)*:
       - Rãnh dập chìm (`Crease indentation`) màu `#D8D1C0` chạy dọc trục bản lề.
       - Khuyết bán nguyệt (`Ticket notches`, bán kính `0.09`) ở hai đầu mép biên ngoài và hai đầu nếp gấp.
     - *Vật liệu giấy*: Màu ivory ấm `#FFFDF8`, roughness `0.88`, metalness `0.02`, nhận bóng mềm (`castShadow`, `receiveShadow`).
  2. **Dựng làn đường cong thực (Curved Road Ribbon)**:
     - Nằm êm trên mặt vé tại cao độ $Y = 0.020$ (không lơ lửng, không xuyên giấy, không Z-fighting).
     - Gồm 3 lớp hình học độc lập được tính toán chuẩn xác từ giải thuật Ribbon Mesh:
       - Mặt đường nhựa xám than đậm `#2B303A` bề rộng `0.68`.
       - Hai gờ vỉa lề đường ngà nhạt `#E2DCD0` bề rộng `0.05` mỗi bên (tổng bề rộng `0.78`).
       - Vạch tim đường ngắt quãng màu vàng ấm `#F4D06F` (dài `0.18`, khoảng cách `0.14`, rộng `0.035`) tại cao độ $Y = 0.022$.
  3. **Khai báo đường dẫn xe riêng (Vehicle Guidance Curve)**:
     - *Hệ tọa độ*: Three.js Right-Handed (X: Trái sang Phải, Y: Dưới lên Trên, Z: Sau ra Trước).
     - *Hướng tuyến*: Đà Nẵng (South-West $X \approx -3.45$) → Đèo Hải Vân ($X \approx 0.1, Z \approx -0.32$) → Huế ($X \approx 3.25$).
     - Khởi tạo `THREE.CatmullRomCurve3` với 7 điểm chốt khớp 100% tim làn đường.
     - Điểm vào xe: $t = 0.0$ tại `[-3.45, 0.020, 0.92]`.
     - Điểm dừng xe: $t = 0.62$ tại `[1.45, 0.020, 0.12]`, góc yaw angle đón góc nhìn 3/4.
     - Hàm `getVehicleTransformAt(t)` trả về vị trí, tiếp tuyến, pháp tuyến và góc quay yaw.
  4. **Chế độ Debug Nhà phát triển (`?debug=1`)**:
     - Khi truy cập với tham số `?debug=1`:
       - Hiển thị trục bản lề (Hinge axis cylinder màu hồng `#FF007F`).
       - Hiển thị marker điểm xuất phát (Sphere xanh cyan `#00E5FF`).
       - Hiển thị marker điểm dừng xe (Sphere cam `#FF9100` và wireframe box mô phỏng góc đỗ xe).
       - Hiển thị đường tim đường nối tiếp (Line cyan `#00B4D8`).
       - Nút dev "Bản lề: Mở phẳng / Gập lại" để kiểm tra trực quan góc quay bản lề flap.
     - Chế độ thường: Hoàn toàn không hiển thị marker debug, không có barcode/mã sân bay giả, giữ giao diện khách tinh tế và chuẩn mực.
- **Kết quả nghiệm thu**:
  - **Browser thật (Headless Edge CDP test)**:
    - Canvas, vé giấy và làn đường tải hoàn hảo, không có lỗi renderer (`Total console error count: 0`).
    - Flap xoay quanh bản lề chính xác $180^\circ$ khi kích hoạt toggle kiểm thử.
    - Desktop 1440×900: body width 1425px (không tràn).
    - Mobile 390px: body width 390px (không tràn).
  - **Linter & Typecheck**:
    - `npx oxlint`: 0 warnings, 0 errors.
    - `npm run build`: Thành công 100%, chunk `JourneyCanvas-*.js` độc lập.
  - **Ảnh chụp nghiệm thu**:
    - `danava_go_step3_1440x900.png` (Góc nhìn camera chuẩn, vé mở tĩnh và làn đường cong)
    - `danava_go_step3_390px.png` (Đáp ứng di động hoàn hảo)
    - `danava_go_step3_debug_markers.png` (Đường dẫn xe, điểm vào t=0, điểm dừng t=0.62)
    - `danava_go_step3_flap_folded.png` (Xác thực góc xoay bản lề flap 180 độ)


