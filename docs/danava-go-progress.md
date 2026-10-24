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




