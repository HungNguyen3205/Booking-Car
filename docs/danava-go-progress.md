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

### Bước 4: Dựng xe Giường nằm hoàn chỉnh ở trạng thái đứng yên (Grounded Sleeper Coach Model)
- **Thời gian**: 2026-10-24
- **Công việc đã thực hiện**:
  1. **Kiểm kê tài nguyên Model**:
     - *Kết quả rà soát*: Trong kho lưu trữ không có bất kỳ file model 3D (`.glb`, `.gltf`, `.obj`, `.fbx`). Các file PNG sẵn có (`bus_coach_sleeper.png`, ...) là ảnh phẳng 2D cutout của giao diện cũ, không phải model 3D.
     - *Giải pháp triển khai*: Xây dựng mô hình 3D Procedural Rig tham số hóa cao cấp (`SleeperCoach.tsx`, `coachConfig.ts`), tách riêng thân xe và 4 cụm bánh xe, chuẩn hóa gốc tọa độ và trục tiếp đất.
     - *Yêu cầu tài nguyên GLB bổ sung trong tương lai (nếu muốn nâng cấp ultra-high-poly)*: File `sleeper_coach.glb` (< 2.5MB), 15k-25k tris, PBR texture (Albedo, Normal, Roughness, Metallic 1024x1024), tách rời 4 node bánh xe.
  2. **Chuẩn hóa Gốc tọa độ & Trục tiếp đất (Standardized Vehicle Rig)**:
     - Gốc tọa độ cục bộ `[0, 0, 0]` đặt tại mặt tiếp đất giữa hai trục bánh xe.
     - Cao độ tâm trục bánh xe: $Y_{axle} = R_{wheel} = 0.078$.
     - Đáy lốp xe nằm chuẩn xác tại $Y = 0.0$ trong hệ tọa độ cục bộ.
     - Khi đặt xe tại cao độ $Y_{road} = 0.020$, 4 lốp xe tiếp đất 100% hoàn hảo trên mặt đường, không bị lún, không lơ lửng, không phụ thuộc vào bounding box ngẫu nhiên.
     - Khoảng sáng gầm xe: `0.038` đơn vị (~28cm thực tế).
  3. **Chi tiết Hình học & Tỷ lệ Chuẩn**:
     - Tỷ lệ: Dài `1.15`, Rộng `0.33` (chiếm 48% bề rộng lòng đường `0.68`), Cao `0.35`.
     - *Thân xe*: Vát góc khí động học, sơn xanh Navy thương hiệu `#102744`, độ nhám satin `0.38`, độ ánh kim `0.22`.
     - *Cửa sổ 2 tầng*: Dải kính hai tầng xe giường nằm sẫm màu `#18202C`, độ phản xạ cao (`roughness: 0.12, metalness: 0.88`). Kính chắn gió trước vát nghiêng 25° và kính hậu sau.
     - *Mui xe*: Cụm điều hòa làm mát mui xe (Roof AC Pod).
     - *Bánh xe*: 4 cụm bánh tách rời (lốp cao su mờ `#1A1D20` và mâm đúc hợp kim bạc `#D8DCE2` có trục tâm).
     - *Hệ thống đèn*: Đèn pha xenon LED ấm `#FFFDF0`, đèn gầm phá sương `#FFB300`, đèn hậu LED đỏ `#E53935`.
     - *Branding DANAVA GO*: Dải decal eo màu Teal `#0097A7` và chữ nổi "DANAVA GO" sạch sẽ, tuyệt đối không có logo của hãng xe bên thứ ba.
  4. **Bóng gầm xe tiếp xúc (Ambient Occlusion Contact Shadow)**:
     - Mặt phẳng bóng gầm tiếp xúc đặt tại $Y = 0.0208$ (ngay trên mặt đường $0.8$mm, triệt tiêu Z-fighting), đổ bóng đậm dưới 4 vệt lốp xe và nhạt dần ra ngoài viền gầm xe.
     - Kết hợp cùng bóng đổ Three.js `castShadow` từ Sun Key Light tạo chiều sâu cơ học vững chãi.
  5. **Vị trí và Góc đỗ xe**:
     - Đặt tại điểm dừng đỗ chuẩn $t = 0.62$ trên `VEHICLE_PATH_CURVE`.
     - Góc quay `yawAngle ≈ 68.2°` theo hướng tiếp tuyến đường, quay đầu xe chếch đón góc nhìn 3/4 camera giống hệt frame kết video.
     - Không che khuất vùng hậu cảnh núi đèo/landmark dự kiến ($Z < -0.4$).
- **Kết quả nghiệm thu**:
  - **Browser thật (Headless Edge CDP test)**:
    - Canvas tải mượt mà với Sleeper Coach 3D, không có lỗi console (`Total console error count: 0`).
    - Bánh xe chạm khít mặt đường, bóng gầm tiếp xúc tự nhiên.
    - Form tìm kiếm click được và chuyển trang kết quả chuyến đi thành công.
    - Desktop 1440×900: body width 1425px (không tràn).
    - Mobile 390px: body width 390px (không tràn).
  - **Linter & Typecheck**:
    - `npx oxlint`: 0 warnings, 0 errors.
    - `npm run build`: Thành công 100%, chunk `JourneyCanvas-*.js` độc lập.
  - **Ảnh chụp nghiệm thu**:
    - `danava_go_step4_1440x900.png` (Xe Giường nằm tĩnh góc 3/4 trên đường cong, bóng gầm vững chãi)
    - `danava_go_step4_390px.png` (Hiển thị sắc nét trên màn hình di động)

### Bước 5: Chuyển động xe trên scene hiện có (Coach Motion & Wheel Animation)
- **Thời gian**: 2026-10-24
- **Công việc đã thực hiện**:
  1. **Bám sát Đường dẫn Đã Khai báo (`VEHICLE_PATH_CURVE`)**:
     - Xe di chuyển chuẩn xác dọc theo `VEHICLE_PATH_CURVE` từ điểm vào $t = 0.0$ (`[-3.45, 0.020, 0.92]`) đến điểm dừng đỗ $t = 0.62$ (`[0.704, 0.020, -0.173]`).
     - Cao độ $Y = 0.020$ tuyệt đối ổn định trong suốt hành trình, 4 bánh xe luôn tiếp xúc chính xác mặt đường, không bị lơ lửng hay chìm lún.
  2. **Định hướng Theo Tiếp tuyến & Giảm tốc Êm**:
     - Thân xe xoay theo góc `yawAngle = Math.atan2(tangent.x, tangent.z)` liên tục và mượt mà, triệt tiêu hoàn toàn hiện tượng giật góc hay rung lắc.
     - Đường cong giảm tốc Cubic Ease-Out: $f(u) = 1 - (1 - u)^3$ với thời lượng $2.4$s:
       - Xe vào với vận tốc hành trình mượt, giảm tốc dần đều, và dừng êm ru tại đích.
       - Tuyệt đối không dùng spring nảy hay rung lắc giả tạo.
  3. **Vật lý Quay Bánh Xe Theo Quãng Đường Thực Tế**:
     - Bánh xe quay quanh trục X theo công thức vật lý: $\Delta \theta = \frac{\Delta s}{R_{wheel}}$ ($R_{wheel} = 0.078$).
     - Tổng quãng đường $s = 4.411$ units tương ứng chính xác $9.00$ vòng quay của bánh xe.
     - Khi xe giảm tốc, tốc độ quay bánh xe giảm tương ứng; khi xe dừng hẳn tại $t = 0.62$, bánh xe dừng quay hoàn toàn và cố định vị trí tĩnh.
  4. **Bóng Gầm Di Chuyển Đồng Bộ**:
     - Mesh bóng gầm tiếp xúc (Contact shadow) là node con trong cùng root group của xe, chuyển động đồng thời với thân xe tại cao độ $Y = 0.0208$, kết hợp cùng shadow map động của Three.js.
  5. **Hiệu năng & Không Dùng React setState Mỗi Frame**:
     - Vòng lặp animation sử dụng hook `useFrame` của `@react-three/fiber`, can thiệp trực tiếp vào thuộc tính `.position` và `.rotation` của các Three.js Object3D thông qua `useRef`.
     - Số lần gọi `setState` trong lúc chuyển động: **0 lần**.
     - Giao diện form và DOM hoàn toàn độc lập, không bị re-render hay lag giật khi xe đang chạy.
  6. **Cơ chế Cleanup & Hỗ trợ Accessibility**:
     - R3F tự động gỡ bỏ `useFrame` khi component unmount hoặc khi người dùng chuyển trang.
     - Chế độ `shouldReduceMotion`: Đặt xe ngay lập tức tại vị trí dừng tĩnh $t = 0.62$, bỏ qua chuyển động lăn bánh.
  7. **Công cụ Phát lại Kiểm thử (Debug Replay)**:
     - Thêm nút "Phát lại xe ▶" trong thanh header khi có tham số `?debug=1`, cho phép phát lại chu kỳ chuyển động xe để kiểm tra cơ học bánh xe.
     - Người dùng thông thường (không có `?debug=1`) chỉ thấy xe vào một lần tự nhiên, không hiển thị nút replay trên UI khách.
- **Kết quả nghiệm thu**:
  - **Browser thật & Quay video**:
    - Video browser WebP được ghi nhận tự động tại `coach_motion_demo_1792852532009.webp`.
    - Xe di chuyển êm ái, bám sát mặt đường, không bị lún hay bay khỏi đường.
    - Dừng xe thì bánh xe dừng quay hoàn toàn.
    - Nút "Tìm chuyến" và form tìm kiếm tương tác bình thường trong suốt quá trình xe chạy.
    - Lỗi console renderer: **0 lỗi** (`Total console error count: 0`).
  - **Linter & Typecheck**:
    - `npx oxlint`: 0 warnings, 0 errors.
    - `npm run build`: Thành công 100%, chunk `JourneyCanvas-*.js` độc lập.
  - **Ảnh chụp nghiệm thu**:
    - `danava_go_step5_transit_early.png` (Xe ở đoạn vào $t \approx 0.15$)
    - `danava_go_step5_transit_midway.png` (Xe lướt trên cung đường đèo $t \approx 0.38$)
    - `danava_go_step5_stopped.png` (Xe dừng đỗ tĩnh vững chãi tại $t = 0.62$, bánh dừng hoàn toàn)
    - `danava_go_step5_replaying.png` (Xác thực công cụ phát lại dev debug)

### Bước 6: Bổ sung bộ địa điểm Đà Nẵng (Da Nang Landmark & Dragon Bridge Module)
- **Thời gian**: 2026-10-24
- **Công việc đã thực hiện**:
  1. **Đối chiếu Ảnh Tham khảo & Dựng Cầu Rồng Nhận diện được (Dragon Bridge 3D Rig)**:
     - *Nguồn đối chiếu đáng tin cậy*: `scene_danang.jpg`, `journey-pop-up.webp`, `diorama_ticket_danang_hue.webp` trong kho tài nguyên.
     - *Đặc điểm nhận diện độc bản của Cầu Rồng*:
       - **Thân rồng 3 nhịp vòm hình sin uốn lượn**: Hệ thống vòm ống thép giàn không gian gồm 1 ống chính ($\varnothing = 0.068$) và 2 ống phụ ($\varnothing = 0.036$) màu vàng óng ánh kim (`#F59E0B`, `metalness: 0.42, roughness: 0.22`), vươn cao nhất tại vòm chính nhịp giữa.
       - **Hàng vây lưng rồng (Dorsal Fins / Scales)**: 14 cặp vây nhọn hình ngọn lửa vàng đặc trưng chạy dọc sống lưng các nhịp vòm, tạo silhouette không thể nhầm lẫn với bất kỳ cây cầu nào trên thế giới.
       - **Đầu rồng thời Lý vươn cao (Sculpted Dragon Head)**: Đặt ở mố cầu phía Đông hướng ra biển (+X), há hàm uy nghi, bờm/sừng lửa 3 lớp cuộn về sau, mũi mây và mắt ngọc sáng ấm.
       - **Đuôi rồng hoa sen (Lotus Tail)**: Xòe 3 cánh hoa sen cách điệu tại mố cầu phía Tây (-X).
       - **Bản mặt cầu dầm thẳng & Cáp treo**: Mặt đường nhựa xám đậm `#374151`, vạch sơn tim đường, vỉa hè đi bộ hai bên và 22 thanh cáp treo đứng kết nối từ vòm rồng xuống dầm cầu.
       - **Trụ cầu bê tông bo tròn**: 4 trụ bê tông đá mài ấm `#E5E0D8` bo tròn cản nước cắm xuống lòng sông.
     - *Tuân thủ Rule 8*: Tuyệt đối không dùng ảnh 2D vuông dựng đứng giả danh 3D billboard. Toàn bộ Cầu Rồng là hình học 3D Procedural Mesh chuẩn Three.js.
  2. **Dựng Cảnh quan Sông Hàn, Bờ Kè, Cây Xanh & Núi Sơn Trà Vừa Đủ**:
     - *Sông Hàn (Han River)*: Dòng chảy uốn lượn hình học đa giác tự nhiên (`ShapeGeometry`), mở rộng dần từ thượng lưu ra vịnh. Màu xanh ngọc trong mát `#1E7B98` (`opacity: 0.92, roughness: 0.12, metalness: 0.48`), nhận bóng đổ và bắt sáng specular từ Sun Key Light.
     - *Bờ kè đá (Stone Embankments)*: Dải kè đá ngà `#DDD6C9` uốn cong ôm sát hai bờ sông, mép ngoài tiếp giáp phẳng êm với mặt vé giấy, **triệt tiêu hoàn toàn viền khung chữ nhật thô cứng** ("Không lộ mép chữ nhật").
     - *Cây xanh diorama ven sông*: 12 cụm cây diorama tán tròn/nón đa tầng mang phong cách thủ công tinh tế với các sắc độ xanh lá ấm `#2D5A3D`, `#3A6B4C`, `#4E835E` dọc tuyến đường dạo bộ bờ sông.
     - *Núi xa vừa đủ (Bán đảo Sơn Trà)*: Cụm 3 đỉnh núi thoai thoải ở hậu cảnh xa phía bắc vịnh, màu xanh đá phiến nhạt `#4A6B5B` hòa trộn êm dịu vào sương khí quyển (`fog`), tạo chiều sâu bờ biển Đà Nẵng mà không làm nặng scene.
  3. **Đồng nhất Hệ Quy chiếu (Camera, Tỷ lệ, Ánh sáng, Vật liệu)**:
     - Giữ nguyên Camera chuẩn: `fov: 36`, `position: [0, 4.8, 9.2]`, `target: [0, 0.35, 0]`.
     - Tỷ lệ nhóm cảnh quan: scale `[1.38, 1.38, 1.38]`, chiều dài cầu ~2.8 units, tương quan cân đối tuyệt đẹp với bề rộng mặt đường `0.68` và xe khách `1.15`.
     - Dùng chung hệ thống chiếu sáng Sun Key Light `[-4.2, 7.5, 5.0]` và Sky Fill `[4.5, 3.8, -2.5]`.
  4. **Thiết lập Khung Cấu hình Chuẩn `DestinationDefinition` (`destinationConfig.ts`)**:
     - `id`: Định danh ổn định `'da-nang'`.
     - `displayName`: Tên hiển thị chuẩn `'Đà Nẵng'`.
     - `model`: Đặc tả mô hình 3D procedural, vật liệu PBR, polycount budget < 2400 tris, cam kết `hasBakedText: false`.
     - `labelAnchor`: Tọa độ neo 3D `[-2.15, 0.92, 0.05]` tại đỉnh vòm chính Cầu Rồng.
     - `safeZone`: Ranh giới an toàn 3D `minX: -3.5, maxX: -0.8, minZ: -1.4, maxZ: 0.40`.
       - Cách tim đường gần nhất $\ge 0.42$ units.
       - Cách điểm dừng xe $t=0.62$ tới $2.25$ units.
       - Nằm trọn trong khung 3D 62%, cách biệt hoàn toàn khỏi 54% vùng text editorial bên trái.
     - `placement`: Tọa độ gốc `[-2.15, 0.0, 0.0]`, góc xoay `[0, 0.06, 0]`, scale `[1.38, 1.38, 1.38]`.
     - `approvalStatus`: Trạng thái `'approved'`, ngày kiểm định `2026-10-24`, đáp ứng 100% checklist tiêu chí nghiệm thu.
  5. **Model 3D Sạch & Nhãn HTML/SVG Neo Độc Lập**:
     - Model 3D hoàn toàn không chứa chữ tỉnh thành bake sẵn vào texture hoặc hình học.
     - Chữ "Đà Nẵng" được hiển thị bằng DOM HTML/SVG độc lập (`DestinationLabelOverlay.tsx`):
       - Component `LandmarkAnchorTracker` nằm trong R3F loop sử dụng `camera.project()` chiếu tọa độ 3D thành tọa độ màn hình `%`.
       - Cập nhật trực tiếp `style.left` và `style.top` qua `useRef` (zero React `setState` re-renders, 60fps).
       - Thẻ huy hiệu pill bo tròn sang trọng: Tiêu đề `Noto Serif` bold "Đà Nẵng", chip "Khởi hành", phụ đề `Be Vietnam Pro` "Cầu Rồng • Sông Hàn".
       - Đường dóng SVG thanh mảnh và điểm tròn xung nhịp cyan neo chuẩn xác vào sống lưng Cầu Rồng.
  6. **Tuân thủ Phạm vi**:
     - **Chưa thêm Huế**: Giữ nguyên vị trí phía Đông ($X > 1.8$) cho đợt triển khai bước kế tiếp, tuyệt đối không thêm Ngọ Môn trước khi được yêu cầu.
- **Kết quả nghiệm thu**:
  - **Browser thật (Headless Edge CDP test)**:
    - Cầu Rồng nhìn từ xa nhận diện được ngay lập tức với dáng rồng vàng uốn lượn, đầu rồng và vây lưng đặc trưng.
    - Không che headline `Đi một chuyến. Mở ngàn trải nghiệm.` bên trái (`stageLeftMarginPct` an toàn).
    - Không che xe khách Sleeper Coach (xe đỗ phía trước bên phải, Cầu Rồng ở phía sau bên trái).
    - Không lộ bất kỳ mép chữ nhật nào: Bờ kè đá và mặt sông cong hữu cơ hòa tan vào mặt vé giấy.
    - Lỗi console renderer: **0 lỗi** (`Total console error count: 0`).
  - **Linter & Typecheck**:
    - `npx oxlint`: 0 warnings, 0 errors.
    - `npm run build`: Thành công 100%, chunk `JourneyCanvas-*.js` tách riêng 894 kB.
  - **Ảnh chụp nghiệm thu lưu trữ**:
    - `danava_go_step6_danang_1440x900.png` (Góc nhìn camera chuẩn 1440x900)
    - `danava_go_step6_danang_debug.png` (Chế độ debug hiển thị hộp an toàn Safe Zone & điểm neo Anchor)
    - `danava_go_step6_danang_390px.png` (Hiển thị sắc nét trên di động 390px)

### Bước 7: Thêm Huế và hoàn thiện trạng thái cuối tĩnh của tuyến mẫu (Da Nang — Hue Static Composition)
- **Thời gian**: 2026-10-24
- **Công việc đã thực hiện**:
  1. **Đối chiếu Ảnh Tham khảo & Dựng Ngọ Môn Huế 3D Chuẩn Xác (`NgoMonGate.tsx`)**:
     - *Nguồn đối chiếu đáng tin cậy*: `scene_hue.jpg`, `journey-pop-up.webp`, `diorama_ticket_danang_hue.webp`.
     - *Đặc điểm nhận diện độc bản của Ngọ Môn*:
       - **Đài thành khối đá chữ U (U-shaped Fortress Base)**: Đài thành gạch nung đỏ trầm cổ kính (`#7D3C32`, `roughness: 0.75`), hai cánh chữ U vươn ra phía trước ôm lấy sân tiền đường, mép trên có lan can đá thanh vọng cảnh (`#DDD6C9`).
       - **3 cổng vòm xuyên thành (Arched Portals)**: Cửa chính giữa (dành cho Hoàng đế) cao rộng nổi bật, 2 cửa Tả Giáp Môn và Hữu Giáp Môn hai bên với hốc cửa sâu và vòm cuốn đá mài.
       - **Lầu Ngũ Phụng 2 tầng mái đa sắc (Five-Phoenix Pavilion)**:
         - Gian chính giữa: 2 tầng mái dốc cong góc lợp ngói **hoàng lưu ly vàng rực rỡ** (`#E5A93C`, `metalness: 0.35, roughness: 0.25`), bờ nóc chầu và cột cờ triều Nguyễn.
         - Hai chái lầu cánh Tả - Hữu: 2 tầng mái lợp ngói **thanh lưu ly xanh ngọc bích** (`#246D4E`).
         - Cột gỗ sơn son thếp vàng Cung đình (`#8C2518`) và lan can tầng lầu.
       - **Cầu đá Trung Đạo (Trung Dao Stone Bridge)**: Cầu đá thanh bắc thẳng từ sân trước qua hào sen vào cổng chính, có lan can đá hoa sen hai bên.
     - *Tuân thủ Rule 8*: Toàn bộ Ngọ Môn là mô hình 3D Procedural Mesh, không dùng ảnh phẳng dựng đứng.
  2. **Tạo DestinationDefinition cho Huế (`destinationConfig.ts`)**:
     - `id`: `'hue'`.
     - `displayName`: `'Huế'`.
     - `province`: `'Thừa Thiên Huế'`.
     - `tagline`: `'Cố đô di sản • Ngọ Môn Hoàng Thành'`.
     - `model`: Quy chuẩn mô hình 3D, vật liệu PBR, polycount < 2400 tris, cam kết `hasBakedText: false`.
     - `labelAnchor`: Tọa độ neo 3D `[2.15, 0.92, -0.20]` tại đỉnh lầu Ngũ Phụng.
     - `safeZone`: `minX: 0.9, maxX: 3.6, minZ: -1.3, maxZ: 0.45`, cách xa vùng headline bên trái, cách điểm đỗ xe $1.45$ units.
     - `placement`: `position: [2.15, 0.0, -0.20]`, `rotation: [0, -0.10, 0]`, `scale: [1.32, 1.32, 1.32]`.
     - `approvalStatus`: Trạng thái `'approved'`.
  3. **Vùng Chuyển tiếp Trung tâm & Đèo Hải Vân (`CentralPassTransition.tsx`)**:
     - Đặt tại $X \in [-0.85, +0.85]$, $Z \in [-1.2, -0.3]$: Rặng đồi xanh đèo Hải Vân thoai thoải (`#3E6B4E`, `#487B56`), rừng thông xanh ngát kết nối mượt mà từ biển Sông Hàn sang Cố đô Huế.
     - Lòng đường cong uốn qua đỉnh đèo tại $X \approx 0.10, Z = -0.32$, không tạo bất kỳ viền cắt đột ngột nào.
  4. **Tuyến đường Vector SVG & 2 Pin Động (`DestinationLabelOverlay.tsx`)**:
     - Component `DualLandmarkAnchorTracker` chiếu đồng thời 2 điểm neo 3D sang tọa độ màn hình `%`.
     - Nối 2 pin bằng một đường cong Parabol SVG màu Teal `#0097A7` vồng nhẹ qua bầu trời phía trên mô hình vé, kèm hiệu ứng phát sáng `filter: url(#routeGlow)`.
     - Huy hiệu thông số tuyến đường ở đỉnh cung: `100 KM • 2H 15M`.
     - **Không có đường vẽ tĩnh bake sẵn trong background**: Tuyến đường và pin 100% là vector SVG động, co giãn mượt mà theo kích thước màn hình.
  5. **Nội dung Vé Chuẩn Mực & Dữ liệu Thật**:
     - Cuống vé bên trái in thông tin du lịch chính thức bằng tiếng Việt: `ĐÀ NẴNG → HUẾ` (tuyệt đối không dùng mã sân bay DAD/HUI).
     - Header sân khấu: `DANAVA GO • ĐÀ NẴNG → HUẾ`.
     - Footer sân khấu: `Tuyến mẫu: Đà Nẵng — Huế • Cầu Rồng (Đà Nẵng) → Ngọ Môn (Huế) • Xe Giường Nằm`.
     - Toàn bộ nhãn, tuyến và thông tin được liên kết động từ dữ liệu (`currentRoute`, `DA_NANG_HUE_ROUTE`, `DESTINATION_REGISTRY`).
- **Nghiệm thu & So sánh Đối chiếu (Audit Analysis)**:
  - **Tỷ lệ Vé / Cảnh / Xe**:
    - Vé giấy cardstock ivory mở phẳng nằm làm nền móng sân khấu ổn định.
    - Cầu Rồng (trái) và Ngọ Môn (phải) tạo thế đăng đối hài hòa hai miền di sản.
    - Xe khách Giường nằm DANAVA GO đỗ vững chãi tại $t = 0.62$ trên mặt đường, đầu xe hướng về phía Huế, tỷ lệ 1:1 với lòng đường.
  - **Vị trí Headline & Form tìm kiếm**:
    - Headline "Đi một chuyến. Mở ngàn trải nghiệm" ở mạn trái hoàn toàn không bị 3D che khuất.
    - Form tìm kiếm dạng thanh ngang dock ở dưới, click tương tác mượt mà.
  - **Phần còn khác biệt so với video/ảnh concept tham khảo (Tính trung thực kỹ thuật)**:
    - *Định dạng*: Ảnh concept là tranh minh họa 2.5D tĩnh; sản phẩm của chúng ta là sa bàn 3D WebGL tương tác thật thời gian thực có thể gập bản lề, quay bánh xe, và chiếu pin động.
    - *Chi tiết mái ngói*: Mái ngói hoàng lưu ly và thanh lưu ly được tối ưu hóa đa giác hình học khối cách điệu (< 2.4k tris) để đảm bảo 60fps trên thiết bị di động, không chứa texture bitmap nặng nề.
    - *Mặt nước*: Mặt nước sông Hàn và hào Kim Thủy có độ phản chiếu PBR mịn bắt sáng Sun Key Light; chưa có vi phân sóng động dynamic displacement.
  - **Ảnh chụp nghiệm thu lưu trữ**:
    - `danava_go_step7_composition_1440x900.png` (Ảnh tĩnh toàn cảnh desktop camera chuẩn)
    - `danava_go_step7_composition_debug.png` (Chế độ debug hiển thị 2 hộp Safe Zone, 2 pin và trục bản lề)
    - `danava_go_step7_composition_390px.png` (Ảnh tĩnh trên màn hình di động 390px)

### Bước 8: Nối các trạng thái theo video, trên composition đã đạt (Orchestrate Ticket Opening Journey Intro)
- **Thời gian**: 2026-10-24
- **Công việc đã thực hiện**:
  1. **Thiết lập Bộ Điều Phối Timeline Tập Trung (`journeyTimeline.ts`, `JourneyTimelineManager`)**:
     - *Kiến trúc*: Một đồng hồ điều phối duy nhất cập nhật trong vòng lặp `useFrame` của Three.js, phân bổ trạng thái trực tiếp qua mutable ref `timelineRef` đến các thành phần con. Đạt **0 React component re-renders** trong toàn bộ 2.5 giây hoạt cảnh (giữ vững 60fps mượt mà).
     - *Tổng thời lượng intro*: **2.50 giây** (khớp hoàn hảo khoảng mục tiêu 2.0s – 3.0s của video mẫu).
     - *Trình tự 6 trạng thái thời gian*:
       1. **`closed` ($0.00\text{s} – 0.10\text{s}$)**: Vé gấp đóng kín quanh trục bản lề $X = -1.4$, nắp vé gập úp lên mặt sàn chính, cảnh và xe ẩn dưới mặt giấy.
       2. **`opening` ($0.10\text{s} – 0.70\text{s}$)**: Cánh vé mở phẳng quanh trục bản lề từ $180^\circ \to 0^\circ$ theo đường cong `easeOutCubic`. Bóng đổ của cánh vé biến thiên tự nhiên trên mặt sàn dưới nguồn sáng `DirectionalLight`.
       3. **`landscape-reveal` ($0.60\text{s} – 1.30\text{s}$)**: Các cụm di sản nổi dựng đứng từ mặt vé với quãng đường ngắn (short vertical rise $0.02 – 0.05$ units) và hệ số scale theo `easeOutBack` (nảy nhẹ $6\%$ tạo cảm giác sách pop-up thủ công cao cấp):
          - Cầu Rồng (Đà Nẵng bên trái): bắt đầu nổi từ $t = 0.60\text{s}$.
          - Đèo Hải Vân (chuyển tiếp ở giữa): bắt đầu nổi từ $t = 0.70\text{s}$.
          - Ngọ Môn (Huế bên phải): bắt đầu nổi từ $t = 0.80\text{s}$.
          - Tuyệt đối không rơi hay bay từ trên trời xuống.
       4. **`vehicle-enter` ($1.10\text{s} – 1.95\text{s}$)**: Xe khách Sleeper Coach xuất hiện tại $t = 0.15$ trên đường cong, lăn bánh với vận tốc giảm dần mượt mà theo `easeOutCubic`, 4 bánh xe quay đúng vật lý quãng đường $\Delta \theta = \Delta d / r_{\text{wheel}}$, dừng êm ái tại điểm đỗ $t = 0.62$ ($X = 0.704, Z = -0.173$).
       5. **`route-reveal` ($1.85\text{s} – 2.50\text{s}$)**:
          - $t = 1.85\text{s}$: Pin Đà Nẵng pop-in với `easeOutBack`.
          - $t = 2.00\text{s} – 2.30\text{s}$: Tuyến đường vector SVG màu Teal phát sáng vẽ nối từ Đà Nẵng sang Huế bằng thuộc tính `strokeDashoffset` (từ $100\% \to 0\%$).
          - $t = 2.22\text{s}$: Pin Huế pop-in với `easeOutBack`.
          - $t = 2.35\text{s} – 2.50\text{s}$: Huy hiệu thông số `100 KM • 2H 15M` hiện rõ ở đỉnh cung đường.
       6. **`ready` ($\ge 2.50\text{s}$)**: Hoàn tất trạng thái tĩnh toàn vẹn. Các tán cây ven sông Hàn, đèo Hải Vân và rừng thông Cố đô đung đưa vi mô rất khẽ ($\pm 0.015\text{ rad}$) theo nhịp gió nhẹ $\sin(t \times 1.5)$. Tuyệt đối không rung lắc cả scene hay làm lơ lửng xe cộ/công trình.
  2. **Quản lý Vòng đời Phiên Làm việc (`sessionStorage`)**:
     - Sử dụng key `sessionStorage.getItem('danava_go_intro_played')`.
     - Intro chỉ chạy một lần duy nhất khi người dùng mở trang chủ.
     - Khi người dùng đổi loại xe (`Limousine`, `Cabin VIP`, `Giường nằm`) hoặc đổi tuyến đi trong form, intro **hoàn toàn không bị lặp lại**, bảo tồn trạng thái `ready` tức thì.
  3. **Tương tác An toàn & Không Khóa Form**:
     - Form tìm kiếm dock ở dưới cùng luôn giữ diện tích cố định, hoàn toàn không có layout shift.
     - Không áp dụng biến đổi phối cảnh 3D (perspective matrix3d) lên text editorial hay form HTML.
     - Form hoạt động từ frame đầu tiên: nếu người dùng click hoặc focus vào bất kỳ ô nhập liệu nào (`Nơi đi`, `Nơi đến`, `Ngày đi`), hoạt cảnh sẽ lập tức chuyển an toàn về trạng thái `ready` ngay lập tức, không làm gián đoạn luồng đặt vé của khách hàng.
     - Nút "Bỏ qua ▶" xuất hiện ở góc trên sân khấu 3D trong 2.5s đầu cho phép người dùng chủ động bỏ qua hoạt cảnh nếu muốn.
  4. **Tôn trọng Reduced Motion & Tải Trang Thực**:
     - Khi `prefers-reduced-motion` bật hoặc `shouldReduceMotion === true`, timeline lập tức khởi tạo tại `ready` với cự ly thời gian $2.50\text{s}$, không chờ đợi callback hay timeout giả.
     - Không chạy intro ngầm phía sau loader: chỉ kích hoạt khi WebGL Context đã sẵn sàng và Canvas đã hiển thị.
  5. **Chế độ Kiểm thử Nhà phát triển (`?debug=1`)**:
     - Hiển thị badge trạng thái thời gian thực: `closed` ➔ `opening` ➔ `landscape-reveal` ➔ `vehicle-enter` ➔ `route-reveal` ➔ `ready`.
     - Nút "Phát lại Intro ▶" cho phép xóa cờ session và tái hiện toàn bộ 2.5s intro để kiểm tra chất lượng hoạt họa.
     - Nút "Xe ▶" phát lại riêng xe khách lăn bánh.
     - Nút "Bản lề" cho phép đóng/mở thủ công nắp flap quanh trục hingeX.
- **Nghiệm thu Thực tế & Đối chiếu Video Mẫu**:
  - **Video ghi hình phiên duyệt thực**:
    - File ghi hình video WebP: `danava_intro_demo_1792856269716.webp` (ghi lại đầy đủ quá trình mở vé, cảnh nổi, xe chạy, vẽ route, pin hiện, đổi tab xe và tương tác form).
  - **Ảnh chụp màn hình nghiệm thu**:
    - Desktop: `danava_go_step8_ready_1440x900.png`
    - Mobile: `danava_go_step8_mobile_390px.png`
  - **Báo cáo trung thực những chuyển động chưa tái tạo được (Tính trung thực kỹ thuật)**:
    1. *Uốn cong mềm của thớ giấy (Soft-body paper curl)*: Cánh vé hiện tại mở theo cơ chế bản lề cứng phân vùng (`Rigid Hinged Panel`). Trong một số animation 3D CGI cao cấp render offline (Blender/Cinema4D), tờ giấy có thể uốn lượn cong mềm mại như dải lụa; ở đây ta dùng mô hình bản lề gập để đảm bảo nhẹ tải và tương thích rộng rãi trên mọi GPU di động.
    2. *Bụi cát gầm xe*: Xe khách lướt êm ái với bánh quay và bóng gầm xe tiếp đất khít khao; chưa có hiệu ứng hạt bụi (particle system) bay ra từ lốp xe khi phanh dừng lại.
    3. *Gợn sóng nước*: Nước sông Hàn và hào Kim Thủy có độ phản quang và màu sắc chuẩn mực, nhưng là mặt phẳng tĩnh bắt sáng PBR, chưa có shader sóng nước lăn tăn bằng custom vertex displacement.

### Bước 9: Đa dạng hóa dòng xe & Hiệu ứng chuyển đổi xe (Vehicle Stage)
- Bổ sung 3 dòng xe: Giường nằm (Sleeper Coach), Limousine VIP (Limousine Van), Cabin Cung Điện (Cabin VIP).
- Hiệu ứng chuyển đổi xe mượt mà 0.6s với cơ chế Latest-Choice-Wins.
- Bánh xe quay đúng tỷ lệ vật lý theo chu vi lăn.

### Bước 10: Chuẩn hóa kiến trúc địa danh & Bổ sung Nha Trang
- Chuẩn hóa Destination Registry với 3 cấp độ danh tính (searchLocationId, administrativeArea, sceneLandmarkId).
- Bổ sung Tháp Trầm Hương & Vịnh Nha Trang (procedural 3D).
- Chiếu neo nhãn động 3D sang 2D SVG overlay.

### Bước 11: Mở rộng TP. Hồ Chí Minh
- Bổ sung Landmark 81 & Sông Sài Gòn với bố cục cân đối và an toàn vùng chữ.
- Kiểm tra chuyển cảnh từ các điểm xuất phát khác nhau.

### Bước 12: Đồng bộ chuyển tuyến, đảo chiều & Vùng an toàn
- Đồng bộ chọn tuyến trên Form với sa bàn 3D qua `useRouteTransitionController`.
- Hỗ trợ đảo chiều tức thì (⇄) mà không gây chồng chéo tên gọi.
- Kỹ thuật Latest-Choice-Wins ngăn ngừa hiện tượng lag khi bấm nhanh.

### Bước 13: Hoàn thiện nhận diện thương hiệu DANAVA GO quanh Scene
- Đồng bộ thương hiệu: DANAVA GO, Navy `#102744`, Teal `#0097A7`, Cream `#F7F4EC`.
- Thiết kế Headline và mô tả chuẩn mực, không orphan hay tràn cột.
- Bổ sung các section: Tuyến đường nổi bật, Trải nghiệm xe, Các bước đặt vé, Quyền lợi, FAQ.

### Bước 14: Chuẩn hóa trang chọn chuyến
- Giữ nguyên thông số tìm kiếm (`from`, `to`, `date`, `passengers`).
- Bộ lọc và sắp xếp theo giá, giờ, nhà xe hoạt động thực tế.
- Xử lý trạng thái tải, danh sách rỗng và thử lại.

### Bước 15: Hoàn thiện chọn ghế & Sơ đồ xe
- Hiển thị đúng cấu hình tầng (1 tầng cho limousine, 2 tầng cho giường nằm/cabin).
- Chú thích ghế trực quan với biểu tượng tiếp cận (`Check`, `Lock`, `Ban`).
- Giới hạn số ghế theo số khách đặt, tính tổng tiền chính xác.
- Cách ly ghế khi đổi sang chuyến mới, không mang ghế cũ sang.

### Bước 16: Chuẩn hóa form hành khách & Thanh toán Sandbox
- Kiểm tra dữ liệu tiếng Việt (Họ tên $\ge 2$ từ, SĐT 10 số VN, RFC Email).
- Bảo toàn bản nháp thông tin khi nhấn quay lại.
- Bảng điều khiển kiểm thử Sandbox với 4 trạng thái giao dịch (chờ, thành công, lỗi, hủy).
- Chống gửi lặp và bảo vệ quyền riêng tư: 100% không lưu số thẻ/CVV vào `localStorage`.

### Bước 17: Đồng bộ xuất vé, tra cứu & Tài khoản
- Vé điện tử đầy đủ thông tin: mã vé, tuyến, giờ, loại xe, ghế, điểm đón/trả, trạng thái thanh toán.
- Mã QR mang đường dẫn xác thực tra cứu kèm cảnh báo demo minh bạch.
- Bố cục in chuyên nghiệp `@media print` A4.
- Tra cứu vé có loading, không tìm thấy, và tuyệt đối không tạo vé giả khi mã không tồn tại.
- Tích hợp AuthModal quản lý phiên làm việc client demo và hiển thị cấp bậc hội viên.

### Bước 18: Tối ưu toàn diện Frontend & Fallbacks
- Giảm 92.5% kích thước chunk `JourneyCanvas.js` (từ 961 kB xuống 71.8 kB).
- Lazy loading các địa danh và xe không dùng ban đầu.
- Tự động dừng hoạt ảnh (`frameloop="never"`) khi tab ẩn hoặc cuộn khỏi viewport.
- Điều chỉnh DPR thích ứng (tối đa 1.5 trên mobile) và camera mobile chuyên biệt (16:11, FOV 42).
- Poster fallback 2D cao cấp khi WebGL không khả dụng hoặc mất Context.

### Bước 19: Nghiệm thu toàn diện & Chuẩn bị đưa vào Main
- Toàn bộ 18 bước hoàn thành và được kiểm thử nghiệm thu thành công.
- Video ghi hình phiên duyệt đầy đủ được lưu trữ trong artifacts.
- Tạo tài liệu kỹ thuật hoàn chỉnh tại `README.md`.
- Sẵn sàng tích hợp Pull Request vào nhánh `main`.

