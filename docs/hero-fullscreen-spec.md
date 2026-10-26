# DANAVA GO — SPEC THIẾT KẾ HERO FULLSCREEN CHUẨN THAM CHIẾU

> **Tài liệu đặc tả kỹ thuật và kiến trúc giao diện Hero trải rộng toàn màn hình (Full-Width Edge-to-Edge Hero Stage).**  
> *Phiên bản:* 1.0 (Bước 1 — Kiểm tra code & Chuẩn bị bố cục)  
> *Đối chiếu:* Ảnh chuẩn tham chiếu bố cục & phong cách du lịch thực cảnh DANAVA GO (`reference-hero-fullwidth.png`).

---

## 1. Mục tiêu kiến trúc & Định vị trải nghiệm

Hero mới chuyển đổi toàn diện từ phong cách **mô hình pop-up thu nhỏ trong khung chữ nhật** sang **đại cảnh du lịch liên tục 100% full-width**, mở rộng tầm nhìn của khách hàng:

- **100% Edge-to-Edge Viewport:** Cảnh sắc trải dài chạm hai mép trái/phải màn hình, không viền, không bo góc hộp, không đế giấy thu nhỏ.
- **Bầu trời & Địa hình liên tục:** Nền trời nắng sớm trong trẻo, dãy núi trùng điệp phía xa, dòng sông Hàn – sông Hoài nối liền hai địa danh di sản Đà Nẵng và Hội An.
- **Tiêu đề & Tabs căn giữa vùng trời:** Toàn bộ typography sử dụng font **Sans-serif (không chân)** hiện đại, thanh lịch; nhóm tiêu đề, mô tả và 3 nút pill chọn xe nổi bật ở trung tâm vùng trời phía trên.
- **Xe khách Royal Navy bề thế ở trung tâm tiền cảnh:** Thân xe nhìn thấy thực tế chiếm **50%–58% chiều rộng viewport** trên desktop, đặt vững vàng trên dải xa lộ tiền cảnh, bóng tiếp xúc ôm sát mặt đường nhựa.
- **Địa danh cân đối hai cực:** Điểm đi (Đà Nẵng & Cầu Rồng) neo ở $\approx 15\%$ viewport bên trái; Điểm đến (Hội An & Phố cổ) neo ở $\approx 85\%$ viewport bên phải.
- **Thanh tìm chuyến chuẩn mực:** Nằm ngang gần chân hero, chiều rộng $\approx 90\%$ (tối đa $1440\text{px}$), giữ khoảng đệm thoáng đãng phía trên, bảo đảm thân xe và bánh xe hoàn toàn không bị che khuất.

---

## 2. Thông số kỹ thuật bố cục Desktop (Desktop Layout Specifications)

| Thành phần | Thông số vị trí & Kích thước | Tương quan Viewport | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Site Header** | Chiều cao: $72\text{px} - 80\text{px}$ | $100\%$ Width | Sticky top, nền trong suốt nhẹ hoặc bán mờ trên nền trời, không chắn tầm nhìn cảnh quan. |
| **Hero Stage Tổng** | Chiều rộng: $100\text{vw}$<br>Chiều cao: $\ge (100\text{vh} - \text{Header Height})$, tối thiểu $\approx 780\text{px} - 860\text{px}$ | Toàn màn hình viewport còn lại | Cảnh chạm mép trái và mép phải. Không dùng `max-width` co cụm cảnh. |
| **Headline & Copy** | Căn giữa: $X = 50\%$, $Y \approx 12\% - 28\%$ từ đỉnh Hero Stage | Căn giữa vùng trời phía trên | Toàn bộ font Sans-serif (Inter / Be Vietnam Pro). Headline 2 dòng, Eyebrow trên đầu, mô tả ngắn dưới. |
| **Bộ chọn loại xe (Pills)** | Căn giữa ngay dưới mô tả, $Y \approx 30\% - 36\%$ | Chiều ngang $\approx 360\text{px} - 420\text{px}$ | 3 pills: Giường nằm, Limousine, Cabin VIP. Active nền navy `#102744`, text trắng sáng `#FFFEFA`. |
| **Điểm đi (Đà Nẵng)** | Tọa độ ngang: $X \approx 12\% - 18\%$ (tâm $\approx 15\%$), $Y \approx 18\% - 28\%$ | Phía trên Cầu Rồng | Badge nhãn: `ĐIỂM ĐI` / `Đà Nẵng` / `Cầu Rồng • Sông Hàn` kèm pin đứt nét trỏ xuống nhịp cầu. |
| **Điểm đến (Hội An)** | Tọa độ ngang: $X \approx 82\% - 88\%$ (tâm $\approx 85\%$), $Y \approx 22\% - 32\%$ | Phía trên Phố cổ | Badge nhãn: `ĐIỂM ĐẾN` / `Hội An` / `Phố cổ • Sông Hoài` kèm pin đứt nét trỏ xuống dãy nhà cổ. |
| **Xe Navy trung tâm** | Tọa độ ngang: Căn giữa tiền cảnh ($X_{\text{center}} \approx 50\% - 54\%$), $Y_{\text{contact}} \approx 78\% - 82\%$ | **Bề ngang nhìn thấy: 50%–58% viewport** | Thân xe hướng góc 3/4 sang phải. Tiếp đất vững trên làn đường gần, không cấn form tìm chuyến. |
| **Search Dock (Form)** | Chiều rộng: $\approx 90\%$ viewport, `max-width: 1440px`<br>Khoảng cách đáy: `bottom: 24px - 36px` | Căn giữa đáy Hero Stage | Nằm gần chân hero, nổi nhẹ trên dải đường nhựa. Khoảng cách an toàn tới bánh xe: $\ge 25\text{px} - 40\text{px}$. |

---

## 3. Phân biệt Bounding Box PNG vs Thân xe thực sự nhìn thấy

> [!IMPORTANT]
> Toàn bộ tỷ lệ kích thước xe ($50\% - 58\%$ viewport) được tính dựa trên **phần thân xe thực sự nhìn thấy (Visible Vehicle Body)**, không tính theo bounding box của canvas ảnh chứa vùng trong suốt.

Dữ liệu đo đạc thực tế từ tệp gốc $1376 \times 768\text{px}$ (RGBA):

```
+--------------------------------- Canvas 1376 x 768 px ---------------------------------+
|                                                                                        |
|         (x1: 72, y1: 59) ┌──────────────────────────────────────────┐                  |
|                          │                                          │                  |
|                          │          PHẦN THÂN XE NHÌN THẤY          │                  |
|                          │          W_visible = 1270 px             │                  |
|                          │          H_visible = 656 px              │                  |
|                          │                                          │                  |
|                          └──────────────────────────────────────────┘ (x2: 1342, y2: 715)
|                                                                                        |
+----------------------------------------------------------------------------------------+
```

| Dòng xe | Kích thước Canvas | Bounding Box Visible $(x_1, y_1, x_2, y_2)$ | Chiều rộng nhìn thấy ($W_{\text{visible}}$) | Tỷ lệ $W_{\text{visible}} / W_{\text{canvas}}$ | Chiều rộng Container tại Viewport $1440\text{px}$ (để đạt $54\%$ VP) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Giường nằm 34 chỗ** (`bus_coach_sleeper_right.png`) | $1376 \times 768$ | $(72, 59, 1342, 715)$ | $1270\text{px}$ | **$92.30\%$** | $W_{\text{container}} \approx 843\text{px}$ (Visible: $778\text{px} = 54.0\%$ VP) |
| **Limousine VIP** (`bus_limousine_right.png`) | $1376 \times 768$ | $(89, 81, 1325, 713)$ | $1236\text{px}$ | **$89.83\%$** | $W_{\text{container}} \approx 810\text{px}$ (Visible: $728\text{px} = 50.5\%$ VP) |
| **Cabin Hoàng Gia** (`bus_cabin_right.png`) | $1376 \times 768$ | $(93, 121, 1334, 715)$ | $1241\text{px}$ | **$90.19\%$** | $W_{\text{container}} \approx 880\text{px}$ (Visible: $794\text{px} = 55.1\%$ VP) |

---

## 4. Phân tích nguyên nhân Hero hiện tại còn giống mô hình thu nhỏ

Qua kiểm tra mã nguồn thực tế tại `DanavaGoHero.tsx`, `LayeredSceneStage.tsx`, `VehicleMotionStage.tsx` và `danava-go-hero.css`, 6 nguyên nhân cốt lõi khiến giao diện hiện tại bị thu nhỏ như sau:

1. **Giới hạn `max-width` trên container chính:**  
   `.go-shell` đang đặt `max-width: 1600px; padding: 12px 40px 36px;` trên nền màu kem `#F7F4EC`. Hai bên lề màn hình lớn để lộ dải trống vô nghĩa thay vì cảnh quan chạm mép $100\text{vw}$.
2. **Bố cục chia cột Grid trái/phải (`36% / 64%`):**  
   Cấu trúc `grid-template-columns: minmax(0, .36fr) minmax(0, .64fr)` ép toàn bộ đại cảnh du lịch sang khu vực $64\%$ bên phải, trong khi $36\%$ bên trái chỉ để một khối text nhỏ. Điều này biến phong cảnh thành một "hộp ảnh card minh hoạ" thay vì bối cảnh nền tự nhiên bao trọn toàn bộ giao diện.
3. **Stage bị gò vào `aspect-ratio` cố định (`1536 / 1024`):**  
   `.go-journey-stage` bị ép tỉ lệ khung ảnh cố định. Khi màn hình co giãn, chiều cao stage bị thu hẹp tỉ lệ thuận với cột phải, khiến các chi tiết Cầu Rồng, Phố Cổ và chiếc xe bị co lại bé tí xíu.
4. **Đế giấy và viền cắt ziczac nằm trong bitmap (`journey_ground_fixed.webp` / `journey-pop-up.webp`):**  
   Bitmap nền đường hiện tại kế thừa từ phác thảo pop-up book diorama, có vẽ sẵn các đường lượn sóng viền giấy carton cắt thủ công dưới đáy. Khi đưa lên màn hình, người xem nhận diện ngay đây là mô hình đồ chơi/sách gấp thay vì một cung đường ven biển thực tế.
5. **Vị trí và kích thước xe bị đặt lệch góc và quá nhỏ:**  
   `VehicleMotionStage` đưa xe về tọa độ `translate(1000px, 785px)` ở góc phải của canvas $1536\text{px}$, với bề rộng xe chỉ $800\text{px}$ trên canvas $1536\text{px}$ (tương đương $\approx 33\%$ chiều rộng màn hình desktop). Xe không ở trung tâm, không tạo được cảm giác bề thế của chủ thể chính.
6. **Kế thừa font Serif (`Noto Serif`):**  
   Class `.go-title` và nhãn địa danh đang gắn font serif có chân, tạo cảm giác tài liệu văn học cũ, trái ngược với ngôn ngữ thiết kế thương hiệu du lịch hiện đại (Sans-serif tròn chắc) trên ảnh mẫu.

---

## 5. Kiểm kê & Đánh giá mức độ tái sử dụng Asset

### Nhóm A: Xe có alpha dùng được (Tái sử dụng 100%)
- `public/assets/images/bus_coach_sleeper_right.png`: Đạt chuẩn xuất sắc. Xe khách Giường nằm Danava Go màu Royal Navy, alpha sạch, góc phối cảnh $3/4$ chuẩn xác.
- `public/assets/images/bus_limousine_right.png`: Đạt chuẩn xuất sắc. Xe Limousine VIP Danava Go màu Royal Navy, alpha sạch.
- `public/assets/images/bus_cabin_right.png`: Đạt chuẩn xuất sắc. Xe Cabin VIP Danava Go màu Royal Navy, kính lái đã được inpaint sạch sẽ, không còn chữ sai tuyến, trục kép tandem sắc nét.

### Nhóm B: Địa danh có alpha dùng được (Tái sử dụng một phần)
- `public/assets/images/scenes/journey_landmarks_atlas.webp` & `landmarks_danang_hoian.webp`: Cụm Cầu Rồng và Cụm Phố Cổ Hội An có chất lượng hình ảnh cao, có thể tái sử dụng để làm layer địa danh độc lập nổi phía trên dòng sông.

### Nhóm C: Nền trời / Núi / Sông / Địa hình (LỚP CÒN THIẾU — Cần bổ sung)
- **Hiện trạng:** Các file nền hiện có (`journey_danang_hoian.webp`, `journey_ground_fixed.webp`, `journey-pop-up.webp`) đều bị dính hình khối đế giấy/đế gỗ thu nhỏ dạng pop-up book.
- **Nhu cầu đạt ảnh tham chiếu:** Cần **1 lớp nền phong cảnh thực cảnh liên tục (Full-width Continuous Panoramic Landscape)** trải từ $0\%$ đến $100\%$ màn hình gồm:
  - Bầu trời xanh ấm với ánh mặt trời buổi sớm phía trên;
  - Dãy núi biếc trập trùng ở chân trời xa;
  - Sông Hàn và sông Hoài trải rộng liền mạch;
  - Thành phố Đà Nẵng bên trái và quần thể phố cổ Hội An bên phải;
  - **Tuyệt đối không có viền đế gỗ/đế giấy carton gấp**.

### Nhóm D: Mặt đường độc lập (Cần tinh chỉnh / Mở rộng toàn cảnh)
- `public/assets/images/scenes/road_foreground_danang_hoian.webp`: Có mặt đường nhựa, nhưng mép dưới đang bị bo theo viền cong của mô hình cũ.
- **Nhu cầu:** Mặt đường tiền cảnh cần mở rộng liên tục ra mép phải và góc dưới màn hình, với thảm cỏ hoa nở ở góc dưới bên trái và dải nhựa đường kéo dài mượt mà sát thanh tìm kiếm như trong ảnh tham chiếu.

### Nhóm E: Concept & Tệp thừa / Trùng lặp
- Các file test cũ (`diorama_ticket_danang_hue.webp`, `vietnam_journey_panorama.webp`, `journey-pop-up.webp`) giữ ở dạng lưu trữ tham chiếu, không đưa vào luồng render chính của Hero mới.

---

## 6. Kiến trúc Phân tầng DOM Layer (Sẵn sàng cho Animation Bước tiếp theo)

Để đảm bảo hiệu ứng xe chạy từ xa ra gần, phóng lớn dần rồi dừng vững chãi mà không bị dính vào nền hoặc làm biến dạng các thành phần khác, Hero được phân thành **5 lớp DOM độc lập**:

```
[Layer 5: z-30]  Search Dock & Pill Controls (Form tìm kiếm & Bộ chọn xe - tương tác người dùng)
       ▲
[Layer 4: z-25]  UI Typography & Badges (Headline Sans-serif, Eyebrow, Pin địa danh Đà Nẵng / Hội An)
       ▲
[Layer 3: z-20]  Vehicle Motion Stage (Xe Navy chuyển động từ xa lại gần + Bóng tiếp xúc bám sát lốp xe)
       ▲
[Layer 2: z-10]  Foreground Highway Layer (Mặt đường nhựa tiền cảnh, vạch sơn vàng, vỉa hè, thảm hoa cỏ)
       ▲
[Layer 1: z-0]   Continuous Tourism Scenery (Bầu trời, dãy núi xa, sông nước, Cầu Rồng, Phố cổ 100% full-width)
```

Kiến trúc này đảm bảo:
1. **Xe chạy độc lập:** Xe có thể scale từ $0.35 \rightarrow 1.0$, di chuyển theo đường cong phối cảnh mà không ảnh hưởng tới nền đường hay làm rung form tìm kiếm.
2. **Không che khuất:** Vị trí dừng của xe được tính toán chính xác để cách mép trên của Search Dock từ $25\text{px} - 40\text{px}$.
3. **HTML / CSS chuẩn mực:** Không dùng ảnh phác thảo tĩnh chứa sẵn chữ hay form; toàn bộ nút bấm, ô nhập liệu và nhãn đều là DOM element sống.

---

## 7. Kế hoạch triển khai từng bước theo chỉ đạo

- [x] **Bước 1 (Hiện tại):** Kiểm tra code hiện tại, phân loại asset, phân tích nguyên nhân mô hình thu nhỏ và lập tài liệu đặc tả `docs/hero-fullscreen-spec.md`. Dừng để duyệt.
- [ ] **Bước 2:** Chuẩn bị và tích hợp lớp nền phong cảnh thực cảnh liên tục 100% full-width (loại bỏ hoàn toàn đế giấy), kết nối Cầu Rồng và Phố Cổ Hội An mượt mà.
- [ ] **Bước 3:** Chuyển đổi typography sang font Sans-serif hiện đại, đưa Headline, mô tả và Tabs chọn xe ra trung tâm vùng trời phía trên.
- [ ] **Bước 4:** Định vị 2 nhãn địa danh (Đà Nẵng $15\%$, Hội An $85\%$) kèm đường pin trỏ chuẩn xác.
- [ ] **Bước 5:** Thiết lập vị trí và tỷ lệ xe Navy lớn chính giữa tiền cảnh ($50\% - 58\%$ viewport) cùng lớp đường tiền cảnh và bóng tiếp xúc thật.
- [ ] **Bước 6:** Hoàn thiện animation xe di chuyển từ xa ra gần, lớn dần rồi phanh dừng êm ái trên cung đường. Kiểm thử Playwright trên Desktop và Mobile.
