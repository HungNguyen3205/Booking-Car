# DANAVA GO — Laravel + sàn nhiều nhà xe + app thương hiệu

## Mô hình đã triển khai trong code

| Địa chỉ production mong muốn | Vai trò | Cách thử tại localhost |
|---|---|---|
| `danavago.com` | Sàn tìm và đặt vé nhiều nhà xe | `/` |
| `danava.com/nha-xe/cua-ong-limousine` | Trang nhà xe, tuyến, đội xe, chính sách | `/nha-xe/cua-ong-limousine` |
| `app.danavago.com` | Web app đặt vé chung, chọn/lọc nhà xe | `/app` |
| `cuaonglimousine.danavago.com` | Web app chỉ bán vé Cửa Ông | `/app/cua-ong-limousine` |
| Tên miền chính chủ được xác minh | Cùng app riêng của nhà xe | Cấu hình ở `/manage` → App & Tên miền |
| `danavago.com/manage` | Quản trị nhà xe / quản trị nền tảng theo quyền | `/manage` hoặc `/admin` |

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
cd ..
npm run dev
```

Mở `/manage`, thiết lập quản trị đầu tiên bằng token trên và mật khẩu riêng tối
thiểu 12 ký tự. Không có mật khẩu mặc định. Sau đó tạo/cấp tài khoản chủ nhà xe.
Demo seeder tạo DANAVAGO (3 loại xe, 15 chuyến) và Cửa Ông Limousine (9 ghế, tuyến
Hà Nội–Cửa Ông, 5 chuyến các ngày tiếp theo). Địa chỉ/biển số là minh họa, chưa
phải chuyến thực. Seeder chạy lại không nhân đôi, không tự tạo doanh thu hay đơn.
Không bật `DANAVA_ALLOW_DEMO_SEED=true` trên môi trường khách thật.

`npm run dev` khởi động PHP development server ở 8787 và Vite ở 5173. Có thể đặt
`PHP_BINARY` trong `.env` tại root nếu PHP CLI không có trong PATH. Các thiết lập
Laravel và bí mật phải nằm trong **backend/.env**. Không dùng `.env` Node cũ.

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
- `src/components/portals/*`: app chung, app riêng, profile và danh bạ nhà xe.
- `src/components/studio/AppBrandSettings.tsx`: bật app/subdomain/custom domain.
- `src/services/platformApi.ts`: bootstrap CSRF Laravel trước các mutation.

```bash
npm run build
npm run lint
npm run test:server
npm run test:php
npm run test:logic
npm run test:navigation
```

Giữ các giới hạn pilot: thanh toán hiện là ghi sổ tiền mặt/chuyển khoản đã đối
chiếu, chưa tự thu/hoàn tiền ngân hàng; chưa có SMS/email, GPS, hóa đơn điện tử,
SLA đa máy hoặc kiểm thử tải hãng xe lớn. App là web app responsive, chưa phát
hành ứng dụng native lên App Store/Google Play.

## Kết quả kiểm tra nhánh

Build và lint đạt; 25 kiểm thử API HTTP Laravel, 2 kiểm thử PHP (11 assertions), 26 kiểm thử logic và 25 kiểm thử điều hướng đạt. Trình duyệt đã chạy luồng Cửa Ông: tìm chuyến → chọn ghế → thông tin hành khách → đặt chỗ → vé chờ thanh toán. Đã kiểm tra trang nhà xe. Kiểm thử database hiện dùng SQLite; cần kiểm tra staging MySQL và DNS/SSL trên hosting trước production.
