# DANAVA GO — Tài Liệu Chuyển Giao & Hiện Trạng Dự Án (Handoff Document)

> **Cập nhật ngày:** 25/10/2026  
> **Nhánh hiện tại:** `feature/danava-go`  
> **Trạng thái:** Prototype Refinement — Bước 2 (Nâng cấp Asset Xe Coach Chân thực & Môi trường Phản xạ PBR IBL) đã hoàn thành và nghiệm thu đạt chuẩn.

---

## 1. Thiết Kế & Ảnh Tham Chiếu Đã Chốt

### 1.1. Ảnh tham chiếu chính
1. **Xe khách mục tiêu (Hero Foreground Coach)**:
   - **Tệp nguồn:** [`public/assets/images/bus_coach_sleeper.png`](file:///d:/NamHung/Projects/Code/DatVeXeONL/public/assets/images/bus_coach_sleeper.png) (kèm bản JPG [`bus_coach_sleeper.jpg`](file:///d:/NamHung/Projects/Code/DatVeXeONL/public/assets/images/bus_coach_sleeper.jpg)).
   - **Đặc điểm định danh:**
     - Dáng xe khách du lịch cao cấp hiện đại (Modern Ultra Luxury Tour Coach, phong cách Marcopolo Paradiso G7 / Thaco Mobihome / Hyundai Universe).
     - Thân xe sơn xanh Deep Royal Navy bóng gương (`#10274C`).
     - Mui xe vát cong khí động học vuốt dốc êm từ nóc xuống kính trước, liền khối không hộp điều hòa rời.
     - Trụ A và viền mạ bạc uốn lượn hình chữ Z ("hockey stick line") chạy từ nóc xuống eo xe.
     - Kính chắn gió kép phía trước vát nghiêng ~32° với cần gạt nước đen đôi.
     - Cặp gương chiếu hậu khí động học kiểu "cổ thiên nga" (swan-neck mirrors) dài vươn về phía trước từ đỉnh mui.
     - Mặt ca-lăng mạ chrome hình nụ cười ôm trọn logo trung tâm, cụm đèn pha LED jewel projector kép vuốt xếch kèm mí LED DRL xanh băng (`#00E5FF`).
     - Họa tiết tem sườn xe gồm các dải sóng chữ S kép màu Teal (`#00E5FF`, `#00838F`), Bạc kim loại và đường chỉ vàng Champagne `#F59E0B`. Chữ thương hiệu `DANAVA GO` in hoa to đậm (150px) và phụ đề `EXECUTIVE TOURS` (64px) đọc xuôi tự nhiên từ trái sang phải.
     - Bánh xe mâm đúc 10 lỗ sâu mạ chrome sáng bóng, lốp cao su có gai lăn thực tế, đĩa phanh và cùm phanh thể thao Teal.

2. **Khung cảnh sa bàn diorama (Landscape & Pop-up Stage)**:
   - **Tệp nguồn:** [`public/assets/images/scenes/journey-pop-up.webp`](file:///d:/NamHung/Projects/Code/DatVeXeONL/public/assets/images/scenes/journey-pop-up.webp) và [`public/assets/images/scenes/diorama_ticket_danang_hue.webp`](file:///d:/NamHung/Projects/Code/DatVeXeONL/public/assets/images/scenes/diorama_ticket_danang_hue.webp).
   - **Đặc điểm không gian:**
     - Mạn trái ($X < -1.5$): Cầu Rồng Đà Nẵng vòm vàng 3 nhịp uốn lượn, sông Hàn xanh ngọc, bờ kè uốn cong.
     - Trung tâm ($X \in [-0.8, 0.8]$): Vùng đồi chuyển tiếp Đèo Hải Vân, rặng thông đồi xanh thoai thoải.
     - Mạn phải ($X > 1.5$): Ngọ Môn Hoàng Thành Huế với đài thành chữ U đỏ trầm, lầu Ngũ Phụng mái hoàng lưu ly / thanh lưu ly, cầu Trung Đạo.
     - Dải đường nhựa cong liên tục từ trái qua phải, vạch tim vàng ngắt quãng.
     - Nền đất cream hòa tan vào giao diện chung, không bị viền hộp chữ nhật bao bọc.

### 1.2. Bảng màu thương hiệu đã chốt
- **Primary Brand Color (Navy):** `#10274C` (màu nhận diện cốt lõi, dùng cho thân xe, chữ tiêu đề, nút chọn chính).
- **Page Background (Cream):** `#F7F4EC` (màu nền giao diện web và nền trời/mặt đất 3D).
- **Accent Color (Teal):** `#0097A7` (dùng cho CTA tìm chuyến, đường cong route, cùm phanh xe).
- **Secondary Accent (Cyan/Ice Blue):** `#00E5FF` (dải LED định vị ban ngày DRL và chữ EXECUTIVE TOURS).
- **Gold Accent (Champagne Gold):** `#F59E0B` / `#D4AF37` (viền mạ vàng logo, chỉ tem sóng và vạch tim đường).
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

## 2. Thông Tin Branch & Hiện Trạng Mã Nguồn

- **Repository:** `HungNguyen3205/Booking-Car`
- **Branch:** `feature/danava-go`
- **Tình trạng:** Sạch sẽ, hoàn thành Bước 2 chuẩn bị asset xe coach chân thực bám sát ảnh mục tiêu `bus_coach_sleeper.png`.

---

## 3. Việc Đã Làm Ở Bước 2 & Kết Quả Kiểm Tra Thực Tế

### 3.1. Những việc đã hoàn thành
1. **Loại bỏ khối hộp điều hòa thô màu trắng trên nóc xe**: Thay bằng vòm mui cong khí động học liền khối với 2 gờ gân lướt gió thể thao cùng màu sơn Deep Midnight Royal Navy `#10274C` bóng gương (`clearcoat: 1.0`).
2. **Kính sườn xe liền lạc & Nẹp Z mạ bạc**: Kính đổi sang màu khói đen ngọc bích bóng gương phẳng lì (`windowTransmission: 0.0`, `windowRoughness: 0.02`), nẹp đố cửa sổ chìm mỏng, viền nẹp chữ Z mạ bạc sáng bóng.
3. **Decal tem lượn sóng chữ S kép & Typography thương hiệu**:
   - Sinh CanvasTexture siêu nét 2048x1024, khắc phục triệt để lỗi UV đảo ngược.
   - Chữ `DANAVA GO` in hoa to đậm 150px màu trắng tinh viền bóng nổi, phụ đề `EXECUTIVE TOURS` màu Cyan Teal 64px và `ULTRA LUXURY COACH` 30px đọc xuôi tự nhiên từ trái sang phải.
   - Sóng chữ S kép bạc/teal/gold vươn từ hốc bánh trước vút lên đuôi xe, kết hợp tấm ốp bạc ôm vòm bánh sau.
4. **Cụm gương cổ thiên nga (Swan-neck aero mirrors) & Mặt ca-lăng chrome**: Cặp gương vươn từ đỉnh mui uốn cong xuống, ca-lăng cười chrome, logo tròn Danava mạ vàng, cụm đèn pha Jewel LED Projector kép và mí LED xanh băng `#00E5FF`.
5. **Cụm bánh xe lazăng 10 lỗ mâm đúc hợp kim sâu lòng**: 10 lỗ thoát nhiệt sâu lòng, 10 ốc lazăng chrome, nắp chụp tâm chrome, lốp gai bám đường và cùm phanh thể thao Teal.
6. **Môi trường IBL PMREM Studio Horizon & Phản xạ Vật liệu**: Tạo reflection map tự động qua `THREE.PMREMGenerator` trong [`Environment.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/Environment.tsx).
7. **Cân chỉnh góc vàng 3/4**: Điểm dừng `ROAD_CONTROL_POINTS[3]` tại `[1.75, 0.020, 1.85]`, góc đỗ xe $\approx 42^\circ - 44^\circ$ và bóng ambient gầm xe tiếp xúc sàn mềm mại.
8. **Khắc phục lỗi treo lazy load Suspense**: Nạp trực tiếp `import { JourneyCanvas } from './3d/JourneyCanvas'` trong [`DanavaGoHero.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/DanavaGoHero.tsx).

### 3.2. Kết quả nghiệm thu thực tế
- [x] **Mã nguồn sạch:** `npx oxlint` ➔ **0 errors, 0 warnings** trên toàn bộ 66 files.
- [x] **Build & Typecheck:** `npm run build` ➔ **Thành công 100% trong 1.12s**.
- [x] **Không tràn ngang màn hình:** Viewport 1440×900, 1280×800 và 390px mobile đều đạt `horizontal overflow: false`.
- [x] **Đối chiếu trực quan:** Toàn bộ 7 đặc điểm ngoại thất hiển thị sắc nét tại góc vàng 3/4 đón mắt nhìn:
  - Ảnh toàn cảnh: [`docs/screenshots/step2_danava_coach_1440x900.png`](file:///d:/NamHung/Projects/Code/DatVeXeONL/docs/screenshots/step2_danava_coach_1440x900.png)
  - Ảnh cận cảnh sườn xe: [`docs/screenshots/coach_side_closeup.png`](file:///d:/NamHung/Projects/Code/DatVeXeONL/docs/screenshots/coach_side_closeup.png)
  - Ảnh desktop 1280px: [`docs/screenshots/step2_danava_coach_1280x800.png`](file:///d:/NamHung/Projects/Code/DatVeXeONL/docs/screenshots/step2_danava_coach_1280x800.png)
  - Ảnh mobile 390px: [`docs/screenshots/step2_danava_coach_390px.png`](file:///d:/NamHung/Projects/Code/DatVeXeONL/docs/screenshots/step2_danava_coach_390px.png)
- [x] **Chuyển đổi loại xe:** Chuyển đổi giữa Giường nằm, Limousine và Cabin VIP trơn tru, không phát sinh lỗi console (`hasNoErrors: true`).
- [x] **Bảo toàn luồng booking:** Form tìm chuyến và luồng tìm kiếm đặt vé hạ nguồn hoạt động 100% nguyên vẹn.
- [x] **Cam kết tính minh bạch:** Metadata `coachConfig.ts` duy trì rõ ràng `isPlaceholderPrototype: true`.

---

## 4. Kế Hoạch Bước Tiếp Theo (BƯỚC 3)

### 4.1. Nhiệm vụ Bước 3
Nâng cấp chi tiết tạo hình của các công trình biểu tượng (Landmarks) trên sa bàn pop-up diorama:
1. **Cầu Rồng Đà Nẵng ([`DragonBridge.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/DragonBridge.tsx))**:
   - Tinh chỉnh 3 nhịp vòm vàng uốn lượn, đầu rồng phun lửa/nước cách điệu, dầm thép hộp và trụ cầu bê tông cắm xuống mặt nước sông Hàn xanh ngọc bích.
2. **Ngọ Môn Hoàng Thành Huế ([`NgoMonGate.tsx`](file:///d:/NamHung/Projects/Code/DatVeXeONL/src/components/danava-go/3d/NgoMonGate.tsx))**:
   - Dựng đài thành chữ U đá thanh và gạch vồ đỏ trầm, 5 cửa vòm (Ngọ Môn chính giữa cho vua, Giáp Môn, Dịch Môn hai bên), lầu Ngũ Phụng 2 tầng mái hoàng lưu ly / thanh lưu ly với đầu đao cong thanh thoát.
3. **Cầu Trung Đạo & Hồ Thái Dịch**: Bổ sung lan can đá hoa cương và mặt nước hồ phản chiếu chân Ngọ Môn.
4. **Vùng chuyển tiếp Đèo Hải Vân**: Tinh chỉnh rặng đồi chuyển tiếp xanh mướt, độ dốc tự nhiên nối nhịp nhàng giữa Đà Nẵng và Huế.

### 4.2. Điều kiện nghiệm thu Bước 3
- [ ] Linter sạch: `npx oxlint` 0 warnings, 0 errors.
- [ ] Build & Typecheck: `npm run build` thành công.
- [ ] Không layout shift / overflow: Viewport 1440, 1280, 390px không tràn ngang.
- [ ] Giữ vững thiết kế và màu sắc đã chốt, bảo toàn luồng booking hạ nguồn.
