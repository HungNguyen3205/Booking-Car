# DANAVA GO — Tài Liệu Chuyển Giao & Hiện Trạng Dự Án (Handoff Document)

> **Cập nhật ngày:** 25/10/2026  
> **Nhánh hiện tại:** `feature/danava-go`  
> **Commit SHA hiện tại:** `a202753b9905654a5433de3d0b2fb7ccf82a8402`  
> **Trạng thái:** Prototype Refinement — Bước 1 đã nghiệm thu đạt chuẩn.

---

## 1. Thiết Kế & Ảnh Tham Chiếu Đã Chốt

### 1.1. Ảnh tham chiếu chính
1. **Xe khách mục tiêu (Hero Foreground Coach)**:
   - **Tệp nguồn:** [`public/assets/images/bus_coach_sleeper.png`](file:///d:/NamHung/Projects/Code/DatVeXeONL/public/assets/images/bus_coach_sleeper.png) (kèm bản JPG [`bus_coach_sleeper.jpg`](file:///d:/NamHung/Projects/Code/DatVeXeONL/public/assets/images/bus_coach_sleeper.jpg)).
   - **Đặc điểm định danh:**
     - Dáng xe khách du lịch cao cấp hiện đại (Modern Ultra Luxury Tour Coach, phong cách Marcopolo Paradiso G7 / Thaco Mobihome / Hyundai Universe).
     - Thân xe sơn xanh Deep Royal Navy bóng gương (`#102744`).
     - Mui xe vát cong khí động học vuốt dốc êm từ nóc xuống kính trước.
     - Trụ A và viền mạ bạc uốn lượn hình chữ Z ("hockey stick line") chạy từ nóc xuống eo xe.
     - Kính chắn gió kép phía trước vát nghiêng ~30° với cần gạt nước đen đôi.
     - Cặp gương chiếu hậu khí động học kiểu "cổ thiên nga" (swan-neck mirrors) dài vươn về phía trước từ đỉnh mui.
     - Mặt ca-lăng mạ chrome hình nụ cười ôm trọn logo trung tâm, cụm đèn pha LED jewel projector vuốt xếch.
     - Họa tiết tem sườn xe gồm các dải sóng mềm mại màu Teal (`#0097A7`) và Bạc kim loại.
     - Bánh xe mâm đúc 10 lỗ sâu mạ chrome sáng bóng, lốp cao su có gai lăn thực tế.

2. **Khung cảnh sa bàn diorama (Landscape & Pop-up Stage)**:
   - **Tệp nguồn:** [`public/assets/images/scenes/journey-pop-up.webp`](file:///d:/NamHung/Projects/Code/DatVeXeONL/public/assets/images/scenes/journey-pop-up.webp) và [`public/assets/images/scenes/diorama_ticket_danang_hue.webp`](file:///d:/NamHung/Projects/Code/DatVeXeONL/public/assets/images/scenes/diorama_ticket_danang_hue.webp).
   - **Đặc điểm không gian:**
     - Mạn trái ($X < -1.5$): Cầu Rồng Đà Nẵng vòm vàng 3 nhịp uốn lượn, sông Hàn xanh ngọc, bờ kè uốn cong.
     - Trung tâm ($X \in [-0.8, 0.8]$): Vùng đồi chuyển tiếp Đèo Hải Vân, rặng thông đồi xanh thoai thoải.
     - Mạn phải ($X > 1.5$): Ngọ Môn Hoàng Thành Huế với đài thành chữ U đỏ trầm, lầu Ngũ Phụng mái hoàng lưu ly / thanh lưu ly, cầu Trung Đạo.
     - Dải đường nhựa cong liên tục từ trái qua phải, vạch tim vàng ngắt quãng.
     - Nền đất cream hòa tan vào giao diện chung, không bị viền hộp chữ nhật bao bọc.

### 1.2. Bảng màu thương hiệu đã chốt
- **Primary Brand Color (Navy):** `#102744` (màu nhận diện cốt lõi, dùng cho thân xe, chữ tiêu đề, nút chọn chính).
- **Page Background (Cream):** `#F7F4EC` (màu nền giao diện web và nền trời/mặt đất 3D).
- **Accent Color (Teal):** `#0097A7` (dùng cho CTA tìm chuyến, đường cong route, dải LED DRL, điểm nhấn).
- **Secondary Accent (Cyan/Ice Blue):** `#00E5FF` (dải LED định vị ban ngày DRL).
- **Gold Accent (Champagne Gold):** `#D4AF37` / `#F4D06F` (viền mạ vàng và vạch tim đường).
- **Neutral Dark / Text Body:** `#4A5568` / `#102744`.
- **Border / Muted Neutral:** `#D8D4C9` / `#E5E3DC`.

### 1.3. Quy chuẩn Typography đã chốt
- **Headline chính:** `Noto Serif` / Serif, bold 700, kích thước `clamp(32px, 3.2vw, 52px)`, line-height 1.15.
  - Dòng 1: `Đi một chuyến.`
  - Dòng 2: `Mở ngàn ` + `<span class="go-title-experience">trải nghiệm.</span>` (chữ "trải nghiệm" màu Teal `#0097A7`).
- **Mô tả (Description):** `Be Vietnam Pro` / Sans-serif, regular 400, kích thước 15–16px, line-height 1.6.
  - Nội dung: `Chọn chuyến yêu thích. Chạm đến những miền đất mới.`
- **Nhãn tabs xe:** Sans-serif semi-bold 600, kích thước 12–13px, icon Lucide (`BedDouble`, `Armchair`, `Crown`).

---

## 2. Thông Tin Branch & Commit Hiện Tại

- **Repository:** `HungNguyen3205/Booking-Car`
- **Branch:** `feature/danava-go`
- **Commit SHA:** `a202753b9905654a5433de3d0b2fb7ccf82a8402`
- **Commit Message:** `prototype(danava-go): refactor hero layout to full-width with unboxed editorial and responsive mobile flow`
- **Tình trạng Working Tree:** Sạch (Clean), không có file code nào bị bỏ quên. Các thư mục chưa commit của môi trường (`.agents/`, `.aider-desk/`, `skills-lock.json`) được giữ nguyên theo chỉ đạo.

---

## 3. Việc Đã Làm & Kiểm Tra Đã Chạy

### 3.1. Những việc đã làm ở Bước 1
1. **Giải phóng Hero sang chế độ toàn chiều rộng (Full-Width)**:
   - Hero container chiếm 100% chiều rộng màn hình (`width: 100%`).
   - Sân khấu 3D Canvas Three.js đặt làm lớp nền tuyệt đối `absolute inset-0 w-full h-full pointer-events-none z-[1]` trên desktop.
   - Ẩn tấm đế vé giấy (`baseDeckGeometry`) và nếp gấp (`creaseLine`) trong [`PaperTicket.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/PaperTicket.tsx) để nền đất Three.js hòa tan 100% vào màu cream `#F7F4EC` của trang web; hậu cảnh tiếp tục ra mép phải mà không bị đóng khung thành sa bàn nhỏ.
2. **Gỡ bỏ hoàn toàn card bo góc và đường viền quanh chữ**:
   - Khối chữ editorial `.go-copy` hiển thị trực tiếp trên nền, không còn bất kỳ khung kính đục, đường viền `border` hay bóng đổ `box-shadow` nào bao quanh.
   - Phân bổ 35–40% mạn trái cho chữ và tabs xe.
3. **Bổ sung lớp Gradient Cream bảo vệ độ tương phản chữ phía trái**:
   - Thêm `.danava-go-hero-gradient` (`z-index: 2` trên desktop) chuyển sắc mượt mà từ 96% cream tại mép trái, 92% tại 28%, 45% tại 38% và tắt hoàn toàn (0%) từ 52% trở đi.
   - Chữ Navy `#102744` đạt độ tương phản tối đa, trong khi toàn bộ cảnh 3D từ giữa sang phải (Cầu Rồng, xe khách, Ngọ Môn) hoàn toàn sáng rõ.
4. **Chiều cao linh hoạt & Form luôn truy cập được**:
   - Desktop dùng `min-height: clamp(680px, 86svh, 860px)` theo viewport và nội dung, tuyệt đối không dùng fixed height gây cắt form.
   - Form tìm kiếm `TripSearchForm` đặt trong document flow với `margin-top: auto;`, dock sát chân hero.
5. **Căn chỉnh điểm dừng xe tiền cảnh**:
   - Cập nhật `stopT: 0.54` trong [`roadConfig.ts`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/roadConfig.ts), đưa toàn bộ thân xe khách cỡ lớn (scale 2.2) vào vùng không gian mở giữa/phải, hướng đầu 3/4 đón mắt nhìn.
6. **Chuẩn hóa luồng hiển thị Mobile (Mobile Document Flow)**:
   - Sắp xếp thứ tự tự nhiên theo chiều dọc: **Chữ (Text) → Tabs chọn xe → Vùng scene riêng (`height: 290px`) → Form tìm kiếm**.
   - Không ép mobile thành một màn hình cố định, không thu nhỏ nguyên desktop.

### 3.2. Kết quả kiểm tra thực tế đã chạy
- **Linter:** `npx oxlint` ➔ **0 errors** trên toàn bộ codebase.
- **TypeScript & Build:** `npm run build` ➔ **Thành công 100% (3.89s)**, các chunk tối ưu hóa:
  - `JourneyCanvas-*.js` (90.34 kB / gzip 22.80 kB).
  - `SeatSelectionModal-*.js` (37.78 kB).
- **Kiểm thử tự động Playwright (Headless CDP)**:
  - **1440×900 Desktop:** `horizontal overflow: false`. Ảnh nghiệm thu: [`docs/screenshots/step1_danava_go_1440x900.png`](file:///d:/NamHung/Projects/Code/DatVeXeONL/docs/screenshots/step1_danava_go_1440x900.png).
  - **1280×800 Desktop:** `horizontal overflow: false`. Ảnh nghiệm thu: [`docs/screenshots/step1_danava_go_1280x800.png`](file:///d:/NamHung/Projects/Code/DatVeXeONL/docs/screenshots/step1_danava_go_1280x800.png).
  - **390×844 Mobile:** `horizontal overflow: false`. Ảnh nghiệm thu: [`docs/screenshots/step1_danava_go_390px.png`](file:///d:/NamHung/Projects/Code/DatVeXeONL/docs/screenshots/step1_danava_go_390px.png).
- **Kiểm tra luồng đặt vé hạ nguồn (Downstream Booking Regression)**:
  - Form tìm kiếm submit ➔ Điều hướng sang danh sách chuyến đi (`Search results found: true`).
  - Chọn chuyến ➔ Mở sơ đồ ghế 16 chỗ Limousine thành công.
  - Toàn bộ state và logic đặt vé hoạt động nguyên vẹn, không bị ảnh hưởng bởi thay đổi giao diện Hero.

---

## 4. Kiểm Kê Tài Nguyên: Asset Có Sẵn & Asset Còn Thiếu

### 4.1. Asset có sẵn
- **Ảnh tham chiếu 2D:**
  - `public/assets/images/bus_coach_sleeper.png` & `jpg` (Xe Giường nằm mục tiêu).
  - `public/assets/images/bus_cabin_royal.png` (Xe Cabin VIP).
  - `public/assets/images/bus_limousine_vip.png` (Xe Limousine).
  - `public/assets/images/scenes/journey-pop-up.webp` (Sa bàn pop-up mẫu).
  - `public/assets/images/scenes/diorama_ticket_danang_hue.webp`.
  - `public/assets/images/scenes/scene_danang.jpg`, `scene_hue.jpg`, `scene_hcm.jpg`, `scene_nha_trang.jpg`.
- **Mã nguồn hình học 3D Procedural (Three.js):**
  - Thân xe Sleeper Coach ([`SleeperCoach.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/SleeperCoach.tsx)), Limousine Van ([`LimousineVan.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/LimousineVan.tsx)), Cabin Coach ([`CabinCoach.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/CabinCoach.tsx)).
  - Cầu Rồng Đà Nẵng ([`DragonBridge.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/DragonBridge.tsx)), Ngọ Môn Huế ([`NgoMonGate.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/NgoMonGate.tsx)), Landmark 81, Tháp Trầm Hương.
  - Làn đường cong ribbon ([`CurvedRoad.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/CurvedRoad.tsx)).
- **Texture sinh bằng code (CanvasTexture):**
  - Ambient Occlusion contact shadow (`createContactShadowTexture`).
  - Decal thương hiệu DANAVA GO eo xe (`createDanavaGoDecalTexture`).

### 4.2. Asset còn thiếu để đạt chất lượng chân thực (Photoreal Quality)
1. **File mô hình 3D thực tế:**
   - Hiện tại **chưa có file `.glb` / `.gltf` nào** trong repository.
   - Để đạt độ chi tiết cao chuẩn công nghiệp, cần file `danava_sleeper_coach.glb` (15k – 25k tris) với cấu trúc phân cấp node:
     - Root: Gốc tọa độ tại mặt tiếp xúc bánh xe.
     - Node con: `Body`, `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR` tách riêng để quay bánh độc lập.
2. **File môi trường ánh sáng IBL:**
   - Hiện tại **chưa có file `.hdr` / `.exr`** nào để làm môi trường phản chiếu bầu trời/đường chân trời.
3. **Bộ Texture Maps PBR độc lập:**
   - Chưa có các kênh texture map riêng biệt:
     - `Albedo/BaseColor`: Decal tem sóng teal/bạc, viền kính.
     - `Normal Map`: Đường gân dập nổi khí động học, rãnh cốp hành lý, vân lốp cao su.
     - `Roughness Map`: Tách biệt độ nhám của vỏ sơn bóng (0.15) với cao su lốp (0.85).
     - `Metallic Map`: Ánh kim mạ chrome của mặt ca-lăng, lazăng mâm đúc.
4. **Các chi tiết ngoại thất còn thiếu so với ảnh mục tiêu:**
   - Vòm mui cong khí động học uốn dốc (thay cho khối mui vát góc hiện tại).
   - Trụ A và viền mạ bạc uốn lượn hình chữ Z ("hockey stick line").
   - Kính chắn gió kép vát nghiêng 30° và cần gạt nước đôi.
   - Cặp gương chiếu hậu kiểu "cổ thiên nga" vươn về phía trước.
   - Mặt ca-lăng mạ chrome hình nụ cười và đèn pha vuốt xếch jewel LED.
   - Dải tem sóng Teal/Bạc uốn lượn dọc thân xe.
   - Lazăng mâm đúc 10 lỗ sâu chuẩn xe thương mại hạng nặng.

---

## 5. Giới Hạn Hiện Tại (Minh Bạch Prototype)

1. **Bản chất mô hình 3D:**
   - Các mô hình xe trong codebase hiện tại là **bản thử nghiệm kỹ thuật (Technical Prototype)** được dựng bằng phương pháp ghép các khối hình học cơ bản Three.js kết hợp vật liệu vật lý PBR (`MeshPhysicalMaterial`), **không phải là asset quét 3D / photoreal GLB hoàn thiện chuẩn thương phẩm**.
   - Cấu hình trong [`coachConfig.ts`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/coachConfig.ts) được đánh dấu rõ ràng `isPlaceholderPrototype: true`.
2. **Phản chiếu ánh sáng:**
   - Do chưa nạp file môi trường HDRI/EXR, hiệu ứng phản chiếu gương của lớp sơn bóng (`clearcoat: 0.95`) chủ yếu bắt sáng từ nguồn `directionalLight` (Sun Key Light) và `skyBounce`, chưa tái hiện được dải phản quang môi trường đường chân trời phức tạp như trong render offline.
3. **Cam kết tính trung thực kỹ thuật:**
   - Không tự tiện bịa đặt file model 3D ngoài thực tế hoặc tuyên bố mô hình compound hiện tại là asset photoreal đã hoàn thiện.

---

## 6. Bước Tiếp Theo & Điều Kiện Nghiệm Thu

### 6.1. Nhiệm vụ Bước tiếp theo (BƯỚC 2)
Nâng cấp chi tiết tạo hình của xe Giường Nằm ([`SleeperCoach.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/SleeperCoach.tsx)) bám sát ảnh mục tiêu [`bus_coach_sleeper.png`](file:///d:/NamHung/Projects/Code/DatVeXeONL/public/assets/images/bus_coach_sleeper.png):
1. **Thiết kế vòm mui cong khí động học & Trụ A mạ bạc hình chữ Z**: Tái tạo đường vuốt mui dốc êm và dải viền mạ bạc chạy từ nóc xe xuống bệ cửa sổ.
2. **Kính chắn gió kép vát nghiêng & Cần gạt nước đôi**: Tạo hình kính lái 2 tầng nghiêng 30° và 2 cần gạt nước đen.
3. **Gương chiếu hậu khí động học cổ thiên nga**: Bổ sung 2 cụm gương dài vươn về phía trước từ đỉnh mui.
4. **Mặt ca-lăng nụ cười mạ chrome & Cụm đèn pha Jewel LED**: Nâng cấp cụm đèn trước hình mắt ngọc với dải DRL sắc sảo và thanh chrome ôm logo trung tâm.
5. **Decal tem lượn sóng Teal/Bạc**: Vẽ đồ họa tem sóng uốn lượn mềm mại dọc hai bên sườn xe bằng CanvasTexture hoặc decal mesh.
6. **Cụm bánh xe lazăng 10 lỗ mâm đúc**: Dựng mâm đúc lõm sâu có 10 lỗ thoát nhiệt, đai ốc lazăng và lốp cao su có rãnh gai lăn.
7. **Bổ sung phản chiếu môi trường IBL**: Thiết lập `Environment` với Lightformer hoặc tạo gradient phản xạ giả lập bầu trời để lớp sơn bóng ô tô có chiều sâu thị giác chân thực.

### 6.2. Điều kiện nghiệm thu Bước tiếp theo
- [ ] Mã nguồn sạch: `npx oxlint` đạt 0 warnings, 0 errors.
- [ ] Build & Typecheck: `npm run build` thành công, không phát sinh lỗi bundle hay TypeScript.
- [ ] Không tràn ngang màn hình: Kiểm thử viewports 1440×900, 1280×800 và 390px mobile đều đạt `horizontal overflow: false`.
- [ ] Đối chiếu trực quan: Các đặc điểm của xe mới (gương cổ thiên nga, kính kép, tem sóng, lazăng 10 lỗ) hiển thị rõ nét tại góc 3/4 và tương thích với tỷ lệ lòng đường.
- [ ] Bảo toàn luồng booking: Form tìm kiếm, kết quả chuyến đi, sơ đồ chọn ghế và thanh toán sandbox tiếp tục hoạt động 100%.
- [ ] Cam kết tính minh bạch: Nếu tiếp tục dùng procedural mesh nâng cao, ghi rõ `prototype` trong commit và báo cáo; nếu nạp file GLB ngoài, phải có kiểm tra bản quyền và kiểm định dung lượng (< 2MB).
