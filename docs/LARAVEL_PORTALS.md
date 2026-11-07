# DANAVA GO — Laravel + sàn nhiều nhà xe + app thương hiệu

## Mô hình đã triển khai trong code

| Địa chỉ production | App (frontend) | Vai trò | Cách thử tại localhost |
|---|---|---|---|
| `danavago.com`, `www.` | Website (`App.tsx`) | Sàn tìm và đặt vé nhiều nhà xe | `/` |
| `app.danavago.com` | **appgo** (`components/appgo`) | App khách DANAVA Go: tìm/giữ/đặt vé mọi nhà xe, Vé của tôi | `/appgo` |
| `studio.danavago.com` | Studio (`StudioApp`) | Một Studio duy nhất cho quản trị nền tảng và nhà xe | `/manage` |
| `admin.danavago.com` | Bí danh cũ, tự chuyển về `studio.danavago.com` | Giữ trong danh sách host dành riêng | `/admin` → `/manage` |
| `danava.com/nha-xe/cua-ong-limousine` | Trang nhà xe | Tuyến, đội xe, chính sách | `/nha-xe/cua-ong-limousine` |
| `cuaonglimousine.danavago.com` | App nhà xe (`PortalEntry`) | App chỉ bán vé Cửa Ông | `/app/cua-ong-limousine` |
| Tên miền chính chủ được xác minh | App nhà xe (`PortalEntry`) | Cùng app riêng của nhà xe | Cấu hình ở Studio → App & Tên miền |

Một bản build phục vụ mọi hostname. **Frontend** chọn app theo host/path trong
`src/utils/surface.ts` (`npm run test:surfaces`); **backend** `PortalService` quyết định
host nào được phép và host nào thuộc nhà xe nào. Hai danh sách phải khớp nhau:
`MARKETPLACE_HOST`, `PLATFORM_APP_HOST`, `STUDIO_HOST`, `ADMIN_HOST`, `OPERATOR_PROFILE_HOST`
trong `backend/.env` và `VITE_APP_ROOT` (mặc định `danavago.com`) lúc build frontend.

- Host nền tảng (`platformHosts()`) không bao giờ resolve thành nhà xe, kể cả khi có dòng
  `tenant_domains` trỏ tới; nhà xe cũng không được khai báo chúng làm tên miền riêng.
- Trên tên miền nhà xe, mọi path đều mở app nhà xe: `/manage` hay `/nha-xe/…` không mở
  Studio hoặc trang nhà xe khác. Quản trị dùng `studio.`/`admin.` hoặc `danavago.com/manage`.
- Cookie phiên là host-only: đăng nhập ở `studio.danavago.com` không dùng chung với
  `danavago.com/manage`. Mỗi host gọi `/api` cùng origin, không cần CORS và không cần `api.` riêng.
- appgo dùng đúng API công khai như website (`/api/public/*`): vé đặt trong app về Studio của
  đúng nhà xe và cùng tồn ghế. Chưa có tài khoản hành khách: "Vé của tôi" nhớ mã vé + SĐT trên
  máy và làm mới qua `/public/lookup`. Chưa có cổng thanh toán online: đơn mới ở trạng thái
  chờ thanh toán, nhà xe xác nhận khoản thu trong Studio.

Tất cả dùng **một Laravel backend và cùng cơ sở dữ liệu**, không nhân bản repository
hoặc tạo một database/frontend riêng cho mỗi nhà xe. Mỗi tenant có đội xe, tuyến,
chuyến, nhân viên, vé, công nợ, cấu hình thương hiệu và domain mapping riêng.

Tên miền `danava.com` được giữ đúng theo yêu cầu. Nếu thực tế cần `danavago.com`
hoặc `danava.vn` cho trang nhà xe, chỉ đổi `OPERATOR_PROFILE_HOST` trong Laravel.
Không tự sửa DNS hoặc nội dung của website DANAVA hiện có. Nếu `danava.com` đang
chạy website khác, cần tích hợp/proxy đường dẫn `/nha-xe/*` và các API/asset liên
quan, hoặc chọn hostname riêng; không thay toàn bộ document root của website đó.

## Công nghệ và phần được giữ lại

- Backend chuyển từ Node.js sang **PHP 8.3+ / Laravel 13**; có `composer.lock`.
- MySQL dùng cho cPanel production; SQLite dùng để thử nhanh và chạy tests.
- React/TypeScript tiếp tục là giao diện quản trị và trang khách. Không thay
  animation hero/xe/địa danh của trang chủ bằng Blade hoặc dựng lại frontend.
- Routes, controllers, native Auth/session/CSRF/Hash, migrations, validation,
  database transactions, RateLimiter và Storage đều chạy trong Laravel.
- Bỏ backend Node `server/` khỏi nhánh này; vẫn có trên nhánh Node trước để đối chiếu.
- Node chỉ dùng để build/chạy Vite khi phát triển. Production có thể chạy PHP-FPM
  trên cPanel, không cần một tiến trình Node backend thường trực.
- `/app` cũ được thay bằng app dùng API thực. Màu, tên, logo, ảnh bìa lấy theo nhà xe.
- **App nhà xe = appgo + thương hiệu.** `PortalEntry` → `appgo/OperatorBrandedApp.tsx` nạp
  `/public/context` (host nhà xe) hoặc `/public/operators/{slug}` (local `/app/{slug}`), rồi render
  cùng `DanavaGoApp` với `brand` từ `appgo/appgoBrand.ts`. Chỉ khác: màu (`color` → mọi biến
  `--go-*`), logo/tên, ảnh bìa (`hero`), hotline/email, chính sách, tuyến của nhà xe thay cho
  "Điểm đến nổi bật"; ẩn voucher mẫu và banner ưu đãi của sàn. Không có ảnh bìa → nền gradient
  theo màu, không dùng ảnh DANAVA/thành phố. Màu mới trong appgo phải dùng `var(--go-*)`,
  không viết mã hex xanh cứng. `operator-app/OperatorApp.tsx` (demo Cửa Ông cũ) không còn được dùng.
  Các thành phần chọn ghế, nhập khách, xác nhận và vé điện tử được tái sử dụng.

## Cài đặt local

Yêu cầu PHP 8.3+ với PDO, SQLite (hoặc PDO MySQL), mbstring, XML/DOM, cURL,
fileinfo, OpenSSL, tokenizer; Composer 2; Node tương thích Vite (22.12+ hoặc 24).

```bash
npm ci
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Trên PowerShell thay `cp` bằng `Copy-Item .env.example .env` nếu cần. Với SQLite,
tạo file `backend/database/database.sqlite` trước khi migrate; nếu cấu hình
`DB_DATABASE`, dùng đường dẫn tuyệt đối. Không đặt DB trong thư mục public.

Sinh `DANAVA_SETUP_TOKEN` riêng và điền vào `backend/.env`:

```bash
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
php artisan migrate
php artisan danava:seed-demo
php artisan danava:seed-operators --days=7   # optional: 8 fictional demo operators, real-corridor fares
cd ..
npm run dev
```

`danava:seed-operators` (`app/Services/DemoMarketplace.php`) is idempotent: rerun it to top up the schedule. Slugs start with `demo-`; Fri–Sun fares are +10%. Like `seed-demo` it is refused in production unless `DANAVA_ALLOW_DEMO_SEED=true`, and should stay off for real customers.

Mở `/manage`, thiết lập quản trị đầu tiên bằng token trên và mật khẩu riêng tối
thiểu 12 ký tự. Không có mật khẩu mặc định. Sau đó tạo/cấp tài khoản chủ nhà xe.
Demo seeder tạo DANAVAGO (3 loại xe, 15 chuyến) và Cửa Ông Limousine (9 ghế, tuyến
Hà Nội–Cửa Ông, 5 chuyến các ngày tiếp theo). Địa chỉ/biển số là minh họa, chưa
phải chuyến thực. Seeder chạy lại không nhân đôi, không tự tạo doanh thu hay đơn.
Không bật `DANAVA_ALLOW_DEMO_SEED=true` trên môi trường khách thật.

`npm run dev` khởi động PHP development server ở 8787 và Vite ở 5173. Có thể đặt
`PHP_BINARY` trong `.env` tại root nếu PHP CLI không có trong PATH. Các thiết lập
Laravel và bí mật phải nằm trong **backend/.env**. Không dùng `.env` Node cũ.

## Quên tài khoản Studio

Không có "quên mật khẩu" qua email. Chạy trên máy chủ (thư mục `backend`):

```bash
php artisan danava:staff-list                     # xem lại email đăng nhập Studio
php artisan danava:reset-password admin@danavago.com   # nhập mật khẩu mới ≥12 ký tự (ẩn)
php artisan danava:create-admin <email> "<Tên>"       # thêm quản trị nền tảng mới
```

Lệnh chỉ đổi tài khoản Studio (không đổi tài khoản khách), cần quyền shell trên hosting.

## Luồng tạo thêm nhà xe

1. Platform tạo nhà xe với tên và slug duy nhất, ví dụ `cua-ong-limousine`.
2. Cấp tài khoản owner, cấu hình hotline, chính sách, màu thương hiệu.
3. Thêm xe, số chỗ/mã ghế, ảnh xe, tài xế, tuyến, điểm đón/trả.
4. Tạo chuyến, phân xe/tài xế, kiểm tra trùng lịch và mở bán/duyệt mở bán.
5. Trang nhà xe `/nha-xe/{slug}` đọc dữ liệu đó; sàn đọc các chuyến đang mở bán.
6. Trong **App & Tên miền**, bật app, đặt appSlug (ví dụ `cuaonglimousine`), logo,
   ảnh bìa và tên miền riêng nếu có. Xem thử ngay qua `/app/{slug}` ở local.
7. App nhà xe chỉ tìm/giữ/đặt/tra cứu vé của chính tenant đã ánh xạ theo hostname;
   cố gán tenant khác vào query hoặc trip ID bị từ chối ở server.
8. App chung `/app` tìm nhiều nhà xe và có bộ lọc nhà xe; vé từ mọi kênh đều về
   đúng quản trị nhà xe và cùng một tồn ghế.

Chưa có đăng nhập tài khoản hành khách chung/SSO giữa các domain. "Vé của tôi"
đang dùng mã vé + số điện thoại. Cookie quản trị không chia sẻ qua toàn bộ
`.danavago.com`; giữ host-only để tránh app nhà xe truy cập phiên của nhà xe khác.

## Subdomain và tên miền chính chủ

**Lưu cấu hình không phải là đã triển khai DNS/SSL.** Code không đăng nhập cPanel,
không tạo domain bằng API hosting và không tự cấp chứng chỉ.

### Host nền tảng `app.`, `studio.`, `admin.`

- Tạo DNS (A/CNAME) cho `app.danavago.com`, `studio.danavago.com`, `admin.danavago.com`
  về cùng máy chủ, cùng document root `backend/public`, và cấp SSL. Wildcard `*.danavago.com`
  bên dưới cũng phủ được ba host này.
- Đặt `PLATFORM_APP_HOST`, `STUDIO_HOST`, `ADMIN_HOST` trong `backend/.env` đúng tên thật rồi
  `php artisan config:cache`. Host chưa khai báo sẽ trả 404 "Tên miền chưa được cấu hình".
- Đây là cấu hình hạ tầng; code không tự tạo DNS/SSL.

### Subdomain miễn phí

- Tạo wildcard DNS `*.danavago.com` về máy chủ chạy Laravel (theo IP hosting thật).
- Tạo virtual host/wildcard domain cùng document root `backend/public`.
- Cấp SSL wildcard hoặc chứng chỉ tương ứng; kiểm tra HTTPS hoạt động.
- Sau đó đặt `TENANT_WILDCARD_READY=true` và clear/config cache Laravel.
- Subdomain được gán trong DB không được trùng tenant khác hoặc các tên dành riêng
  như `app`, `admin`, `api`, `www`, `mail`, `cpanel`.

### Domain riêng

1. Owner khai báo hostname, ví dụ `app.nhaxe.vn` (không có `https://`, path hay IP).
2. Hệ thống sinh TXT `_danava-challenge.app.nhaxe.vn` với giá trị hiển thị trong
   quản trị. Owner phải tạo TXT trong DNS của domain mình.
3. Tạo CNAME về `app.danavago.com`. Với apex/root domain, dùng A/ALIAS theo cấu hình
   hosting; không hardcode IP demo vào code.
4. Bấm **Kiểm tra TXT**. Chỉ TXT khớp token mới chuyển từ `pending` → `verified`.
5. Platform thêm domain vào hosting, cùng document root và cấp SSL. Sau khi xác
   nhận hạ tầng đã xong, platform mới bấm kích hoạt → `active`.
6. Domain chưa xác minh/chưa active hoặc app tắt không được resolve thành app.
   Bỏ hoặc đổi domain làm mất mapping cũ; không tự chuyển sang tenant khác.

Kết quả kiểm thử TXT được mô phỏng có kiểm soát trong PHPUnit; không phải bằng
chứng DNS/SSL production đã được tạo. Chưa chạy cấu hình DNS thật của các domain.

## cPanel production

1. Sao lưu source, DB và upload. Không copy DB Node vào MySQL rồi migrate trực tiếp.
2. Đặt source Laravel ngoài public web root. Document root của các hostname app
   là **backend/public**, tuyệt đối không phải thư mục backend hoặc gốc repository.
3. `backend/.env`: `APP_ENV=production`, `APP_DEBUG=false`, APP_KEY riêng,
   `SESSION_SECURE_COOKIE=true`, DB MySQL và thông số domain thật.
4. Chạy theo môi trường đã cấu hình:

```bash
npm ci
npm run build:hosting
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

`build:hosting` copy Vite assets và tạo `backend/public/spa.html`, giữ Laravel
`index.php` và `.htaccess`; không ghi đè bằng rewrite SPA cũ. Không dùng lệnh
`cp -rf dist/* .` trong document root cũ cho nhánh này.

`storage/` và `bootstrap/cache` cần PHP ghi được (không dùng chmod 777). Upload
được lưu ngoài public và phục vụ qua route `/uploads/{filename}`. Mỗi domain gọi
API cùng origin; không cần mở CORS `*`. Không dùng `php artisan serve` hoặc PHP
built-in development server làm webserver production.

Nếu domain production hiện còn bản frontend cũ, pull nhánh không tự đổi website:
cần build, migrate, chỉnh document root và DNS/SSL theo các bước trên.

## Dữ liệu Node cũ

Đây là schema Laravel mới. **Không tự đọc/ghi hoặc xóa file `var/danava.sqlite`
cũ**, không tự chuyển mật khẩu scrypt của Node thành bcrypt. Nếu đã có giao dịch
thực, cần migration dữ liệu riêng trên bản sao DB, đối chiếu tồn ghế/ledger, và
luồng đặt lại mật khẩu trước cutover. Nhánh Node `feature/operator-studio` vẫn là
mốc đối chiếu. Không chạy hai backend cùng ghi một DB.

## Studio (/manage) chạy trên dữ liệu đặt vé thật

Studio chỉ còn một địa chỉ: `/manage` (`studio.danavago.com`); `/admin` và `admin.danavago.com`
tự chuyển về đây. Mọi API `/api/admin/*` đọc/ghi **cùng dữ liệu** với website, appgo và app nhà xe
(`tenants`, `records`, `trips`, `bookings`, `inventory`, `ledger`, `audit`) qua `App\Services\StudioBridge`
và `OperatorService` (giữ ghế, chống bán trùng, giá tính ở server, sổ thu bất biến).

- "partner" trong API Studio = `tenant` (cùng id). Bảng phụ có khoá ngoại tới `partners`
  (`seat_layouts`, `reconciliations`, `partner_domains`) được đồng bộ bằng `StudioBridge::ensurePartnerRow()`.
- Phạm vi: `platform` thấy mọi nhà xe (lọc `?partner_id=`), các vai trò khác bị khoá vào nhà xe của mình.
- Quyền theo khu vực (`EnsureStudioAccess`, `studio:<area>`, bảng `StudioBridge::AREAS`):

| Khu vực | Vai trò (ngoài platform) | Mục Studio |
|---|---|---|
| overview | owner, manager, dispatcher, sales, accountant | Tổng quan |
| bookings | owner, manager, dispatcher, sales | Đơn vé, bán tại quầy, thu tiền, huỷ |
| trips (xem) / fleet (sửa) | xem: + sales, driver; sửa: owner, manager, dispatcher | Chuyến, tuyến, xe |
| checkin | owner, manager, dispatcher, sales, driver (chỉ chuyến được phân) | Soát vé lên xe |
| customers | owner, manager, sales | Hành khách (ghi chú theo nhà xe) |
| finance / reports | owner, manager, accountant | Thanh toán, sổ quỹ, công nợ, đối soát (xem), báo cáo, so sánh |
| staff / marketing | owner, manager | Nhân sự (tài khoản đăng nhập thật), nhóm quyền, chấm công & lương, ưu đãi, chiến dịch, đánh giá |
| partner | owner, manager | Sửa liên hệ/ngân hàng nhà xe mình |
| platform | chỉ platform | Tạo/tạm ngưng nhà xe, hoa hồng, tên miền, lập/tất toán đối soát, cài đặt hệ thống |

Quy tắc nghiệp vụ giữ nguyên của luồng thật: nhà xe chưa bật tự mở bán thì chuyến tạo mới ở trạng thái
"Chờ duyệt" đến khi platform duyệt; vé phải thu đủ mới được lên xe; huỷ chuyến huỷ vé và đánh dấu
"Chờ hoàn tiền"; mã ưu đãi tạo trong Studio dùng được ngay khi khách đặt; quản lý không tạo/khoá chủ hoặc
quản lý khác; không khoá chủ nhà xe cuối cùng; tài khoản có lịch sử chỉ khoá, không xoá.

Migrations Studio (chỉ thêm): `2026_11_06_000001_add_operator_studio_modules.php`
(nhóm quyền, sổ quỹ, chấm công/lương, chiến dịch, đánh giá) và
`2026_11_06_000002_scope_studio_to_live_operators.php` (`customer_notes.partner_id`, `users.permission_group_id`).
Bảng cũ của bộ admin (`bus_trips`, `ticket_bookings`, `admins`, …) không còn được Studio dùng; dữ liệu cũ giữ nguyên.

Giới hạn còn lại: chưa nối cổng SMS/Email/Zalo (chiến dịch chỉ lưu/lên lịch); chưa có thanh toán online;
khách gửi đánh giá qua `POST /api/public/reviews` (mã vé + SĐT, sau khi lên xe) nhưng chưa có form trên website/appgo.

Kiểm tra: `npm run test:studio` (tích hợp Studio ↔ đặt vé thật, 2 nhà xe, các vai trò) và `npm run test:server`;
thêm `API_TEST_DB=mysql DB_HOST=… DB_PORT=… DB_DATABASE=… DB_USERNAME=… DB_PASSWORD=…` để chạy trên MySQL
(database bị xoá sạch bằng `migrate:fresh`, không trỏ vào dữ liệu thật).

## File map và kiểm tra

- `backend/app/Services/OperatorService.php`: nghiệp vụ xe/tuyến/chuyến, tồn ghế,
  giữ chỗ, đơn vé, đổi/hủy, thu/hoàn, seed DANAVAGO.
- `backend/app/Services/PortalService.php`: profile, host resolver, thương hiệu,
  domain/TXT và seed nhà xe Cửa Ông.
- `backend/app/Http/Controllers/*`: Auth, Platform, Studio, Marketplace, Portal.
- `backend/routes/web.php`: API cùng session/CSRF và các route SPA/upload.
- `backend/database/migrations/*`: schema SQLite/MySQL và khóa chống bán trùng.
- `backend/tests/api-contract.test.mjs`: regression HTTP trên PHP thật, DB tạm.
- `backend/tests/Feature/PortalTest.php`: domain ownership/activation và tenant.
- `backend/config/portals.php`: hostname các app nền tảng (khớp `src/utils/surface.ts`).
- `src/utils/surface.ts`: host/path → app nào (website, appgo, Studio, profile, app nhà xe).
- `src/components/appgo/*`: app khách DANAVA Go; `appgoData.ts` = định dạng + vé lưu trên máy.
- `src/components/portals/*`: app riêng nhà xe, profile và danh bạ nhà xe.
- `src/components/studio/AppBrandSettings.tsx`: bật app/subdomain/custom domain.
- `src/services/platformApi.ts`: bootstrap CSRF Laravel trước các mutation.

```bash
npm run build
npm run lint
npm run test:server
npm run test:php
npm run test:logic
npm run test:navigation
npm run test:surfaces
```

### Lưu ý còn mở (2026-11-05)

- `PortalEntry` (app nhà xe trên subdomain/tên miền riêng và `/app`) đang render
  `operator-app/OperatorApp`, bản demo Cửa Ông dữ liệu cố định, không phải `portals/MobilePortal`
  (bản gọi API thật). Trước khi bật tên miền nhà xe thật cần chọn lại component này.
- Bộ admin `/api/admin/*` (commit `67892d5`) dùng bảng riêng (`partners`, `bus_trips`,
  `ticket_bookings`…), không chung bảng với luồng bán vé (`tenants`, `trips`, `bookings`).
  Chuyến tạo ở đó không hiện trên website/appgo. Studio `/api/manage/*` mới là nguồn dữ liệu thật.
- Nội dung appgo còn là nội dung mẫu: danh sách mã ưu đãi, hotline/email hỗ trợ
  (`1900 1234`), chính sách nhà xe, thanh trạng thái iOS "9:41". Cần thay bằng nội dung thật.

Giữ các giới hạn pilot: thanh toán hiện là ghi sổ tiền mặt/chuyển khoản đã đối
chiếu, chưa tự thu/hoàn tiền ngân hàng; chưa có SMS/email, GPS, hóa đơn điện tử,
SLA đa máy hoặc kiểm thử tải hãng xe lớn. App là web app responsive, chưa phát
hành ứng dụng native lên App Store/Google Play.

## Kết quả kiểm tra nhánh

Build và lint đạt; 25 kiểm thử API HTTP Laravel, 2 kiểm thử PHP (11 assertions), 26 kiểm thử logic và 25 kiểm thử điều hướng đạt. Trình duyệt đã chạy luồng Cửa Ông: tìm chuyến → chọn ghế → thông tin hành khách → đặt chỗ → vé chờ thanh toán. Đã kiểm tra trang nhà xe. Kiểm thử database hiện dùng SQLite; cần kiểm tra staging MySQL và DNS/SSL trên hosting trước production.

## Seat maps and per-seat prices

Studio → "Xe & sơ đồ ghế" → "Sơ đồ ghế & giá theo chỗ" edits the live vehicle's `seatMap`:
a `cols × rows` grid per floor (columns without seats are the aisle), price groups
(`{id, name, surcharge}`), and cells `{code, floor, row, col, type, group, note, disabled}`.
`PATCH /api/admin/vehicles/{id}` with `seat_map` is validated server-side (unique codes and
positions, existing groups, at least one sellable seat). Seat price = trip fare + surcharge
(group surcharge wins), and `reserve`/`move` charge `seatAmount()` — never a client total.
Trips snapshot the vehicle when scheduled; a later edit that keeps exactly the same seat codes
(moves, prices, blocking) also applies to those trips, while added/removed/renamed seats only
affect trips scheduled afterwards. Vehicles saved without a map get `defaultSeatMap()`.
`npm run test:studio` covers validation, isolation, blocked seats and surcharge pricing.

## Customer accounts and notifications

Every online booking (`POST /api/public/bookings`) ensures a `users` row with `role=customer`,
`phone` = passenger phone, temporary password `CustomerAccounts::TEMP_PASSWORD` (`123456`, a
business decision of 2026-11-07) and `must_change_password=true`. An existing account is never
reset. The booking response carries `account {created, username, tempPassword?}`; appgo and the
website show it before the e-ticket. Customers sign in with `POST /api/auth/login {phone, password}`
(limited per phone+IP and per phone), must change the password first (`PATCH /api/auth/password`,
min 8 chars, common/temporary values refused), then use `GET /api/customer/bookings`,
`GET /api/customer/notifications` and `POST /api/customer/notifications/read`.
Customer sessions are refused by every Studio/operator API (`Controller::user`, `StudioBridge::user`).
Risk accepted by the owner: anyone who knows a customer's phone can sign in before the customer
does; the forced change and rate limits reduce, not remove, that risk.

Studio "Đơn vé" → "Cập nhật thông tin" (`PATCH /api/admin/bookings/{id}`) edits name, phone,
email, pick-up/drop-off (validated against the trip) and note, and by default notifies the customer
(old and new phone on a phone change). Payment confirmation and cancellation also notify.

