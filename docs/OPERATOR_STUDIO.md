# DANAVA GO — Quản trị nhà xe và marketplace API (nhánh kiểm tra)

## Phạm vi

Nhánh `feature/operator-studio` bổ sung quản trị nhiều nhà xe ở `/manage` (alias
`/admin`) trong dự án hiện có. Giao diện lấy hướng thiết kế từ video tham chiếu:
nền navy/teal, các bề mặt kính tối, nhấn cam đào, ô chỉ số pastel, ảnh hành trình.
Nghiệp vụ bám theo hoạt động bán vé/điều hành nhà xe; không sao chép code hay tài
sản thương hiệu của Vexere. Đây là bản pilot chạy được với database/API, chưa phải
hệ thống đã nghiệm thu để vận hành hãng xe lớn.

Trang khách `/` dùng API mặc định. Các animation hero, đổi xe, đổi địa danh và
chuyển cảnh tìm chuyến được giữ nguyên. `/app` vẫn là prototype Cửa Ông cũ, chưa
chuyển thành app thương hiệu riêng của từng nhà xe. Tự cấp app/subdomain để sau.

## Chạy thử trên máy

Yêu cầu Node **22.13 trở lên trong nhánh 22**, hoặc **Node 24**. Server dùng
`node:sqlite`, không cần cài thêm database server hoặc thư viện runtime.

```bash
git fetch origin
git switch feature/operator-studio
git pull --ff-only origin feature/operator-studio
npm ci
```

Tạo `.env` (không commit) tại thư mục gốc. Với môi trường local:

```dotenv
DANAVA_SETUP_TOKEN=<chuỗi ngẫu nhiên riêng, tối thiểu 24 ký tự>
DANAVA_DB=var/danava.sqlite
DANAVA_UPLOAD_DIR=var/uploads
DANAVA_ALLOW_DEMO_SEED=true
```

Sinh token bằng lệnh sau, rồi điền vào `.env`. Không gửi token hoặc mật khẩu lên Git.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run dev
```

Không điền `DANAVA_ORIGIN=https://danavago.com` khi đang chạy localhost. Development
chỉ chấp nhận origin local đã cho phép; production cần origin HTTPS chính xác.
Lệnh `dev` chạy API tại 8787 và Vite tại 5173; proxy `/api` và `/uploads` giữ cùng
origin. `npm run dev:web` chỉ chạy Vite, cần API đã được chạy riêng.

1. Mở `http://localhost:5173/manage`.
2. Lần đầu sẽ có form thiết lập. Nhập token đã tạo, tên, email và mật khẩu riêng
   tối thiểu 12 ký tự để tạo quản trị nền tảng. Không có tài khoản mặc định.
3. Trong **Quản lý nhà xe**, bấm **Tạo nhà xe mẫu DANAVAGO**.
4. DANAVAGO có 3 xe (34 giường / 16 ghế / 22 cabin), 3 tuyến và 15 chuyến mở bán
   trong 5 ngày tiếp theo theo giờ Việt Nam. Địa chỉ/biển số/tài xế là dữ liệu test.
   Không tự sinh đơn hàng, đánh giá hay doanh thu giả. Bấm tạo lại không nhân đôi.
5. Vào **Nhân sự & Quyền** để cấp tài khoản chủ nhà xe và nhân viên. Dùng trình
   duyệt riêng để thử các vai trò; tài xế cần liên kết hồ sơ tài xế.
6. Trang `/`: tìm Đà Nẵng → Huế vào ngày mai để thấy xe giường nằm; Đà Nẵng → Hội
   An để thấy Limousine; Huế → Đà Nẵng để thấy Cabin. Tuyến/ngày không có chuyến sẽ
   trả rỗng. Không chuyển sang tuyến khác hoặc mock data.
7. Chọn ghế → thông tin khách → xác nhận đặt vé. Đơn online xuất hiện trong
   **Bán vé & Đơn vé**. Vé mới là **chưa thu tiền**, chưa phải thanh toán ngân hàng.
8. **Thu chi**: ghi nhận khoản thực nhận bằng tiền mặt hoặc chuyển khoản đã đối
   chiếu. Thu đủ mới được kiểm vé. Hủy vé đã thu tiền tạo trạng thái cần hoàn;
   ghi sổ hoàn tiền không tự chuyển tiền ra ngân hàng.

Có thể bật `VITE_BOOKING_MODE=demo` để chạy riêng giao diện mock cũ. Phải khởi
động lại Vite/build lại khi đổi biến VITE_. API lỗi ở chế độ bình thường phải báo
lỗi, tuyệt đối không âm thầm hiển thị dữ liệu mô phỏng.

## Chức năng hiện có

| Khu vực | Thao tác có API và lưu bền |
|---|---|
| Nền tảng | Tạo/chọn/tạm ngưng nhà xe; phân tách doanh nghiệp; duyệt mở bán chuyến |
| Tổng quan | Lịch sắp tới, đơn hoạt động, ghế bán, giá trị đơn chưa thu đủ, thu ròng 7 ngày từ sổ thực |
| Đội xe | Ảnh upload PNG/JPEG/WebP, biển số duy nhất, loại xe, sức chứa, mã ghế riêng, đăng kiểm, bảo dưỡng |
| Tuyến | Thành phố đi/đến, thời lượng, danh sách điểm đón/trả, địa chỉ, phút lệch giờ xuất bến |
| Chuyến | Lịch đơn hoặc lặp 1–30 ngày; phân xe/tài xế/văn phòng; chống trùng lịch; nháp/chờ duyệt/mở/đóng bán/hủy/hoàn tất |
| Bán vé | Tại quầy và online cùng tồn ghế; danh sách khách CSV; kiểm vé; đổi chuyến đồng giá; hủy/hoàn |
| Tài xế | Hồ sơ, giấy phép/hạn, liên kết tài khoản; chỉ xem/kiểm vé chuyến được phân công |
| Khách hàng | Tổng hợp theo số điện thoại từ đơn vé, lịch sử giá trị đặt |
| Nhân sự | Cấp tài khoản theo vai trò, khóa/mở, chống khóa chủ cuối cùng; đổi mật khẩu cá nhân và hủy các phiên cũ |
| Thu chi | Thu vé, hoàn vé, chi phí; hạn mức thu/hoàn; nhật ký bất biến qua UI; khóa chống ghi sổ trùng khi gửi lại |
| Đại lý | Hạn mức công nợ, tỷ lệ hoa hồng; báo cáo giá trị đặt/còn thu/hoa hồng phát sinh |
| Ưu đãi | Mã duy nhất, giảm cố định/phần trăm, giới hạn lượt, hạn dùng và giới hạn tuyến |
| Văn phòng | Tên, địa chỉ, hotline; liên kết lịch chạy |
| Ca trực | Ngày, tài xế, phụ cấp, ghi chú, trạng thái điểm danh; chưa là bộ tính lương/thuế |
| Báo cáo | Theo tuyến, tiền thu/hoàn, chi phí, phí nền tảng dự tính, công nợ đại lý; xuất CSV |
| Cài đặt | Thông tin, màu, liên hệ và chính sách nhà xe; thông báo trong quản trị; nhật ký người thao tác |

Sửa sơ đồ ghế/biển số xe có lịch hoạt động bị chặn. Ảnh/mô tả được sửa và phản ánh
trên chuyến; snapshot trong đơn cũ được giữ. Sửa lịch/đổi xe của chuyến phải đóng
bán, chưa có vé hoạt động hoặc lượt giữ ghế. Chuyến có khách cần xử lý vé trước.
Đổi chuyến có chênh lệch giá hoặc ưu đãi phải hủy/hoàn và đặt lại, không tự điều
chỉnh tiền âm/dương. Các tính toán hoa hồng/phí là số báo cáo, chưa tự chi trả.

## Vai trò

| Vai trò | Quyền chính |
|---|---|
| Platform | Quản lý các nhà xe, duyệt chuyến, thao tác trong nhà xe được chọn |
| Owner | Toàn bộ nghiệp vụ của chính nhà xe, nhân sự và tài chính |
| Manager | Quản lý nghiệp vụ; không cấp thêm owner/manager hoặc khóa họ |
| Dispatcher | Lịch xe, tuyến, tài xế, bán/đổi vé, danh sách khách; không sổ tài chính tổng |
| Sales | Xem lịch/tồn chỗ, bán vé, kiểm/hủy/đổi, thu tiền và xem giao dịch chính mình |
| Accountant | Báo cáo, công nợ, thu/chi/hoàn; không đổi lịch và sơ đồ xe |
| Driver | Chuyến được phân công và danh sách khách tương ứng, kiểm vé đã thu đủ |

Quyền được kiểm tra ở server, không chỉ ẩn menu. Header tenant khác bị từ chối.
Ảnh/URL public là tài sản hiển thị cho khách; không tải ảnh nhạy cảm vào thư viện.

## API và file map cho AI sửa tiếp

- `server/index.mjs`: HTTP, RBAC, upload, CSV, API public/quản trị, static `dist`.
- `server/security.mjs`: scrypt, phiên HttpOnly, CSRF, xác thực dữ liệu, throttling.
- `server/database.mjs`: schema SQLite, WAL, transaction/savepoint, tồn ghế.
- `server/domain.mjs`: xe/tuyến/chuyến, holds, đơn, đổi/hủy, sổ thu/hoàn.
- `server/seed.mjs`: tạo mẫu DANAVAGO, transaction toàn bộ, seed idempotent.
- `server/tests/platform.test.mjs`: kiểm thử HTTP với DB tạm riêng, không đụng DB thật.
- `src/components/studio/StudioApp.tsx`: layout, tổng quan, bảng, modal nghiệp vụ.
- `studioConfig.ts`: trường form/danh mục, tên vai trò và trạng thái.
- `studio.css`: giao diện tối và responsive; không lan style ra trang khách.
- `src/services/platformApi.ts`: client fetch/CSRF/token giữ ghế và API đặt vé.
- `src/App.tsx`: adapter API cho frontend hiện có, giữ state/animation điều hướng.
- `src/components/checkout/ApiReservation.tsx`: xác nhận đặt vé và đếm ngược hold.
- `BoardingTicket.tsx`, `TicketLookupView.tsx`: trạng thái thu/hủy và tra cứu mã+phone.

| API | Mục đích |
|---|---|
| GET `/api/auth/me` | Phiên, CSRF, trạng thái cần setup |
| POST `/api/auth/setup`, `/login`, `/logout` | Tạo platform đầu tiên / đăng nhập / đăng xuất |
| PATCH `/api/auth/password` | Đổi mật khẩu có kiểm tra mật khẩu hiện tại |
| GET/POST `/api/platform/tenants` | Danh sách/tạo nhà xe |
| PATCH `/api/platform/tenants/:id` | Trạng thái, quyền tự mở bán, tỷ lệ phí |
| POST `/api/platform/demo` | Seed DANAVAGO, chỉ khi dev hoặc được bật riêng |
| GET `/api/public/operators`, `/cities`, `/search` | Dữ liệu nhà xe/city/chuyến public |
| POST/DELETE `/api/public/holds[/id]` | Giữ/bỏ ghế bằng X-Booking-Token |
| POST `/api/public/bookings` | Đặt vé bằng hold và Idempotency-Key |
| POST `/api/public/lookup` | Tra mã vé + số điện thoại; không tra bằng mã đơn độc |
| GET `/api/manage/dashboard`, `/reports`, `/customers` | Tổng quan/báo cáo/khách theo tenant |
| GET/POST/PATCH `/api/manage/vehicles`, `/routes`, `/drivers`, `/branches`, `/agencies`, `/promotions`, `/shifts` | Danh mục; PATCH/DELETE dùng thêm /id |
| GET/POST/PATCH `/api/manage/trips[/id[/status]]` | Lịch chạy, cập nhật và trạng thái |
| GET `/api/manage/trips/:id/manifest` | Danh sách hành khách CSV |
| GET/POST/PATCH `/api/manage/bookings[/id]` | Vé tại quầy, kiểm/đổi/hủy |
| GET/POST `/api/manage/ledger` | Sổ ghi nhận; POST hỗ trợ Idempotency-Key |
| GET/POST/PATCH `/api/manage/staff[/id]` | Cấp tài khoản/khóa nhân viên |
| GET/PATCH `/api/manage/settings` | Thông tin nhà xe |
| GET `/api/manage/audit`, `/notices`; POST `/notices/read` | Nhật ký/thông báo |
| POST `/api/manage/upload` | Ảnh tối đa 3MB, kiểm tra chữ ký PNG/JPEG/WebP |

Các mutation đăng nhập cần `X-CSRF-Token` và cookie cùng origin. Platform cần
`X-Tenant-Id` cho /manage; tài khoản nhà xe không thể đổi sang tenant khác.
Server quyết định giá, discount, trạng thái và tồn ghế; bỏ qua tổng tiền từ client.
Giữ ghế 8 phút, giải phóng khi hết hạn hoặc người dùng rời checkout. Khóa chính
trip+seat và transaction đảm bảo không bán cùng chỗ cho hai đơn.

## Chạy production / cPanel

**Không merge rồi chạy ngay quy trình copy `dist/*` cũ.** Backend mới cần dịch vụ
Node thường trực, HTTPS và thư mục dữ liệu riêng ngoài document root. Chỉ có Node
trong PATH để build chưa có nghĩa cPanel đã chạy được Node application.

1. Kiểm tra hosting hỗ trợ Node application/reverse proxy (Node 22.13+ hoặc 24).
   Nếu không, đặt API trên VPS/Node hosting, cấu hình same-origin proxy phù hợp.
2. Source, `.env`, database, upload và backup phải nằm ngoài public document root.
   `dist` là đầu ra build; DB không được tạo trong `dist`.
3. Cấu hình environment: origin HTTPS chính xác, DB/upload tuyệt đối, setup token
   riêng. `DANAVA_ALLOW_DEMO_SEED=false` trên môi trường khách thật.
4. `npm ci --include=dev` → `npm run build` → `npm start`. Production server phục
   vụ cả `dist`, `/api`, `/uploads` cùng origin; cookie có Secure.
5. cPanel Passenger: entry là `server/index.mjs` nếu hosting hỗ trợ ESM và
   `node:sqlite`; nếu chỉ hỗ trợ CommonJS hoặc Node cũ, cần cấu hình Node runner
   phù hợp. Không sửa cookie Secure hay bỏ xác thực để chữa cấu hình hosting.
6. Setup qua HTTPS `/manage`, cấp tài khoản, thử đặt/thu/hủy/hoàn bằng dữ liệu
   riêng trước khi mở bán. Không dùng dữ liệu DANAVAGO mẫu cho khách thanh toán.
7. Sao lưu database bằng SQLite backup API (bao gồm dữ liệu nhất quán với WAL)
   và thư mục uploads. Không chỉ copy file `.sqlite` đang ghi; thử phục hồi vào
   môi trường staging trước cập nhật schema. Không xóa `var/` lúc pull/build.

Chưa có webhook cổng thanh toán, đối soát ngân hàng tự động, SMS/email ra ngoài,
GPS trực tiếp, app/domain white-label, hóa đơn điện tử hay bảng lương đầy đủ.
Không hiện MoMo/VNPAY/VietQR giả như đã kết nối. Chưa kiểm thử tải quy mô lớn,
penetration test độc lập hoặc failover nhiều máy. SQLite pilot phù hợp đánh giá
quy trình; triển khai hãng lớn cần chốt SLA, storage, backup, provider và load test.

## Nghiệm thu nhánh

```bash
npm run build
npm run lint
npm run test:server
npm run test:logic
npm run test:navigation
```

Kiểm thử API dùng DB tạm: setup, CSRF, tenant isolation, vai trò, seed lặp, tuyến
chính xác, tranh chấp ghế đồng thời, giá server, gửi lại đặt vé/ghi sổ, thu thiếu/
đủ, kiểm vé trùng, hủy/hoàn cả thanh toán một phần, chống trùng lịch và rollback
lịch nhiều ngày, tạm ngưng nhà xe, báo cáo và audit.

Kiểm tra trình duyệt đã thực hiện trên dữ liệu QA tách biệt: dashboard, ảnh 3 xe,
bán vé quầy, chuyến API trên frontend, ghế quầy đã bán bị khóa, giữ ghế online,
nhập khách → xác nhận → xuất mã chưa thu tiền → đơn online hiện trong quản trị.
Tài khoản/DB/fixture kiểm thử không nằm trong Git. Ảnh giao diện là ảnh web đã
chạy, không phải ảnh AI concept. Kiểm tra desktop đã thực hiện; cần nghiệm thu
thiết bị di động và hosting production thực tế trước khi mở cho khách.

Kết quả kiểm tra tại ngày 02/11/2026: build thành công (còn cảnh báo kích thước
chunk trang khách >500KB), lint không cảnh báo; test server 22/22, logic 26/26,
navigation 25/25. Không coi các kết quả này là kiểm thử tải hoặc chứng nhận sẵn
sàng vận hành production.
