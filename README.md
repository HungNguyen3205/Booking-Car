# DANAVA GO

Website đặt vé xe khách đa nhà xe. Trang chủ là hero du lịch toàn màn hình: xe chạy trên đường, ảnh địa danh đổi độc lập theo điểm đi (trái) và điểm đến (phải). Phần dưới trang chủ là các mục giới thiệu và form tìm chuyến dùng chung.

**Công nghệ:** React 19 + TypeScript + Vite 8 + Framer Motion (frontend), PHP 8.3+ / Laravel 13 (backend trong `backend/`). Giao diện là 2.5D bằng ảnh, SVG và DOM; không dùng WebGL hay mô hình 3D.

**Màu sắc & font:** navy, teal, cream; font Be Vietnam Pro.

## Tính năng chính

- Tìm chuyến theo điểm đi / điểm đến / ngày (múi giờ `Asia/Ho_Chi_Minh`) / số hành khách.
- Chọn chuyến → chọn ghế (capsule, ghế da, suite riêng) → nhập thông tin → thanh toán mô phỏng → xuất vé điện tử.
- Mỗi điểm đến có ảnh địa danh riêng; không dùng chung ảnh thành phố cho nhiều nơi.
- Nhánh Laravel: API thật cho quản lý vé, nhiều nhà xe, trang nhà xe, app thương hiệu riêng theo tên miền (`/app`, `/manage`).
- App nhà xe = appgo nhân bản theo thương hiệu: chỉ đổi màu chủ đạo, logo, ảnh bìa (cấu hình trong Studio), giữ nguyên mọi tính năng.
- App chia 3 vai trò: **chủ nhà xe** (mọi tính năng + tab Quản lý), **tài xế / lơ xe** (chuyến được phân công, quét vé ràng buộc theo xe, bật GPS), **khách hàng** (đặt vé, mã ưu đãi, vé của tôi, theo dõi xe trên bản đồ + nhật ký chuyến, cảnh báo lệch tuyến). Xem [Vai trò trong app](#vai-trò-trong-app).
- Chế độ demo dùng dữ liệu mẫu để xem giao diện mà không cần backend.

Cổng thanh toán online chưa được tích hợp.

## Yêu cầu

- Node.js 22.12+ hoặc 24 (theo `engines` trong `package.json`).
- Với chạy backend: PHP 8.3+ (có PDO, SQLite hoặc PDO MySQL, mbstring, XML/DOM, cURL, fileinfo, OpenSSL, tokenizer) và Composer 2.

## Chạy nhanh (chỉ frontend, demo)

```bash
npm ci
npm run dev:web
```

Mở địa chỉ Vite in ra trong terminal. Dùng `VITE_BOOKING_MODE=demo` (xem `.env.example`) nếu muốn ép chế độ demo.

Trên Windows, dừng dev server trước khi chạy lại `npm ci` để tránh khóa file native.

## Chạy đầy đủ (frontend + Laravel)

```bash
npm ci

cd backend
composer install
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
php artisan key:generate
# Tạo backend/database/database.sqlite nếu dùng SQLite (xem docs/LARAVEL_PORTALS.md)
php artisan migrate
php artisan danava:seed-demo
cd ..

npm run dev                   # khởi động PHP API (127.0.0.1:8787) + Vite cùng lúc
```

Chi tiết cấu hình (domain, token cài đặt, MySQL cho cPanel) xem [docs/LARAVEL_PORTALS.md](docs/LARAVEL_PORTALS.md).

### Tài khoản đăng nhập Studio (chỉ dùng local/demo)

> ⚠️ Chỉ dành cho máy phát triển / bản demo. **Không** tạo tài khoản với mật khẩu này trên
> hosting thật (danavago.com): README nằm trên GitHub nên ai đọc repo cũng thấy.

| Mở | Email | Mật khẩu | Quyền |
|---|---|---|---|
| `http://localhost:5173/manage` | `quantri@danavago.local` | `Danava-MUAVv7Vryg` | Quản trị nền tảng (toàn bộ Studio) |

Tài khoản nằm trong database của từng máy. Máy mới (sau `migrate`) chưa có, tạo bằng:

```bash
cd backend
php artisan danava:create-admin quantri@danavago.local "Quản trị DANAVA (local)" --password="Danava-MUAVv7Vryg"
```

Quên email/mật khẩu Studio:

```bash
php artisan danava:staff-list                         # xem các email đăng nhập Studio
php artisan danava:reset-password <email>             # đặt mật khẩu mới (≥ 12 ký tự)
```

Biến môi trường:

- `.env` ở gốc: chỉ cho launcher local (`PHP_BINARY`, `VITE_BOOKING_MODE`). Xem `.env.example`.
- `backend/.env`: toàn bộ cấu hình Laravel, gồm tên miền các app. Không commit file này.

### Demo 2 app nhà xe: Hải Vân Xanh (xanh lá) và Cửa Ông (nâu)

```bash
cd backend
php artisan danava:seed-brand-demo --days=7   # tạo/cập nhật 2 nhà xe, tuyến, xe van 7/9/11 chỗ, lịch 7 ngày
cd ..
npm run dev
```

| App | Mở ở local | Màu | Tuyến |
|---|---|---|---|
| Hải Vân Xanh | `http://localhost:5173/app/hai-van-xanh` | `#2f9e44` | Huế ⇄ Đà Nẵng, Huế ⇄ Hội An |
| Cửa Ông Limousine | `http://localhost:5173/app/cua-ong-limousine` | `#febc27` (chữ `#4d2f15`) | Hà Nội ⇄ Cửa Ông |

Lệnh chạy lại không tạo trùng (chỉ thêm chuyến còn thiếu, cập nhật lại thương hiệu). Dữ liệu là demo, không bật trên production
(cần `DANAVA_ALLOW_DEMO_SEED=true`). Ảnh: `public/assets/operators/{slug}/` (logo cả hai nhà xe, ảnh bìa và ảnh xe Hải Vân cắt từ mockup; có thể thay
bằng file gốc chất lượng cao trong Studio → App & Tên miền).

## Tên miền và các app

Một bản build phục vụ mọi tên miền; app được chọn theo tên miền (`src/utils/surface.ts`).

| Tên miền | App | Thử ở local |
|---|---|---|
| `danavago.com` | Website đặt vé | `/` |
| `app.danavago.com` | App khách DANAVA Go (appgo) | `/appgo` |
| `studio.danavago.com` | Studio quản trị (nền tảng và nhà xe) | `/manage` |
| `admin.danavago.com` | Bí danh cũ, tự chuyển về Studio | `/admin` → `/manage` |
| `{slug}.danavago.com` hoặc tên miền riêng đã xác minh | App riêng của nhà xe (appgo + màu/logo/ảnh bìa nhà xe) | `/app/{slug}` |
| `danava.com/nha-xe/{slug}` | Trang giới thiệu nhà xe | `/nha-xe/{slug}` |

Tất cả dùng chung một backend Laravel và một cơ sở dữ liệu. DNS/SSL cho từng tên miền là bước hạ tầng riêng; xem [docs/LARAVEL_PORTALS.md](docs/LARAVEL_PORTALS.md).

## Vai trò trong app

Cùng một app (`/appgo`, `/app/{slug}`, tên miền nhà xe). App tự đổi giao diện theo tài khoản đăng nhập:

| Vai trò | Đăng nhập | Thấy gì |
|---|---|---|
| Khách hàng | Không cần, hoặc số điện thoại (tài khoản tạo lúc đặt vé) | Đặt vé, nhập mã ưu đãi, Vé của tôi, **Theo dõi xe & nhật ký chuyến**: bản đồ vị trí xe, đường tuyến đăng ký, cảnh báo khi xe lệch tuyến, mất tín hiệu |
| Tài xế / Lơ xe | Email + mật khẩu do chủ xe cấp (Tài khoản → *Nhân viên nhà xe*) | Chỉ các chuyến được phân công hôm nay (và chuyến đêm còn chạy). Mỗi chuyến: **Bắt đầu chuyến** (bật GPS điện thoại), **Quét vé** (camera QR hoặc gõ mã/SĐT), danh sách khách, bản đồ + nhật ký, **Kết thúc chuyến** |
| Chủ nhà xe / Quản lý / Điều hành | Email + mật khẩu Studio (Tài khoản → *Nhân viên nhà xe*) | Mọi tính năng của khách + tab **Quản lý**: chuyến hôm nay, tổ lái, số khách đã lên xe, bản đồ mọi xe đang chạy (xe lệch tuyến màu đỏ), quét vé, mở Studio cho các việc còn lại |

Ràng buộc an toàn (kiểm tra ở server, không chỉ ở giao diện):

- Tài xế/lơ xe chỉ thấy và soát vé của chuyến mình được phân công. Quét vé của **xe khác** bị từ chối và báo vé đó thuộc chuyến/xe/giờ nào. Vé chưa thu đủ tiền, đã huỷ hoặc đã soát không cho lên xe.
- Chỉ tổ lái được phân công (hoặc chủ xe/quản lý/điều hành) mới bật/tắt GPS và gửi vị trí của chuyến.
- Khách chỉ xem được hành trình của vé mình (mã vé + SĐT, hoặc tài khoản đúng SĐT).
- Tài khoản nhân viên của nhà xe A không dùng được trong app của nhà xe B.

### Thiết lập cho một nhà xe (làm trong Studio)

1. **Nhân sự & phân quyền** → Thêm nhân sự, vai trò *Tài xế* (cần SĐT + hạng GPLX) hoặc *Lơ xe* (cần SĐT). Hệ thống tự tạo hồ sơ tổ lái gắn với tài khoản.
2. **Tuyến & điểm đón** → *Sửa · Tọa độ GPS*: dán tọa độ `vĩ độ, kinh độ` (lấy từ Google Maps) cho các điểm đón/trả, nên thêm cả điểm dừng nghỉ dọc đường. Không có tọa độ thì app vẫn hiện vị trí xe nhưng không kiểm tra được đúng tuyến.
3. **Chuyến chạy** → nút *Tổ lái*: chọn tài xế và lơ xe. Đổi được cả khi chuyến đã bán vé (đến khi chuyến hoàn tất/huỷ); hệ thống chặn một người bị xếp hai chuyến trùng giờ.
4. Trước giờ chạy, tài xế/lơ xe mở app → chọn chuyến → **Bắt đầu chuyến**, cho phép vị trí, **giữ app mở** suốt chuyến.

Ngưỡng lệch tuyến mặc định 3 km tính từ đường nối các điểm có tọa độ (`DANAVA_OFF_ROUTE_M` trong `backend/.env`). Khi xe lệch tuyến: nhật ký chuyến ghi lại, chủ xe nhận thông báo trong Studio, khách thấy cảnh báo đỏ.

## Lệnh thường dùng

| Lệnh | Mục đích |
|---|---|
| `npm run dev` | PHP API + Vite (cần `backend/vendor` đã cài) |
| `npm run dev:web` | Chỉ Vite (frontend) |
| `npm run build` | Kiểm tra TypeScript và build production |
| `npm run build:hosting` | Build và chuẩn bị bản frontend cho `backend/public` |
| `npm run lint` | Chạy oxlint |
| `npm run start` | Chạy PHP API tại `127.0.0.1:8787` |
| `npm run test:logic` | Kiểm tra route, ngày, tồn kho, chuẩn hoá số điện thoại, thanh toán |
| `npm run test:navigation` | Kiểm tra URL gốc và khôi phục tìm kiếm theo lịch sử trình duyệt |
| `npm run test:surfaces` | Kiểm tra tên miền/đường dẫn mở đúng app |
| `npm run test:server` | Kiểm tra hợp đồng API (Node) |
| `npm run test:studio` | Studio trên dữ liệu thật: tách dữ liệu từng nhà xe, quyền theo vai trò |
| `npm run test:crew` | Tài xế/lơ xe: phân công, quét vé theo xe, GPS, lệch tuyến, nhật ký chuyến của khách |
| `npm run test:php` | PHPUnit trong `backend/` |
| `npm run test:hero` | Kiểm tra trang chủ (cần build trước và Playwright) |
| `npm run test:journey` | Kiểm tra toàn bộ luồng đặt vé (cần build trước và Playwright) |
| `npm run test:audit` | Các kịch bản regression trên trình duyệt (cần build trước) |

Kiểm tra trình duyệt cần cài Chromium một lần:

```bash
npx playwright install chromium
```

Có thể trỏ tới Chromium có sẵn bằng biến `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, và đổi thư mục ảnh chụp QA bằng `JOURNEY_QA_DIR`.

## Cấu trúc thư mục

```
src/
  components/
    danava-go/      Hero trang chủ: cảnh, xe, ảnh địa danh, chuyển động
    home/           Form tìm chuyến dùng chung, các mục bên dưới trang chủ
    search/         Kết quả tìm chuyến
    seats/          Sơ đồ ghế và modal chọn ghế
    checkout/       Thông tin khách và thanh toán mô phỏng
    tickets/        Vé điện tử
    account/, layout/, motion/
    operator-app/   App demo Cửa Ông cũ (không còn được dùng; app nhà xe = appgo + thương hiệu)
    portals/        Trang nhà xe và cổng theo tên miền
    studio/         Giao diện quản trị /manage (/admin tự chuyển về đây)
    appgo/          App DANAVA Go (app.danavago.com) và app nhà xe, gọi API đặt vé thật
      DanavaGoApp.tsx       App khách; nhận `brand` (appgoBrand.ts) và đổi giao diện theo vai trò
      appgoBrand.ts         Màu/logo/ảnh bìa: DANAVA mặc định, nhà xe lấy từ Studio
      OperatorBrandedApp.tsx Nạp thương hiệu nhà xe theo tên miền hoặc /app/{slug}
      CrewApp.tsx           Màn tài xế/lơ xe: chuyến, bắt đầu/kết thúc, GPS, quét vé
      ManageTab.tsx         Tab Quản lý của chủ nhà xe
      TripTrackingSheet.tsx Khách theo dõi xe + nhật ký chuyến
      TripMap.tsx, TicketScanner.tsx, useGpsShare.ts, opsUtils.ts, crew-app.css
  services/
    crewApi.ts          API tổ lái, soát vé, GPS (dùng chung Studio và app)
  utils/
    surface.ts          Tên miền/đường dẫn → app nào
    searchNavigation.ts URL gốc, import query cũ, khôi phục tìm kiếm
    dateUtils.ts, phoneUtils.ts
  data/
    sceneManifest.ts    ID và alias của 13 điểm đến
    landmarkBanks.json  Crop cảnh trái/phải từ các atlas
    departureViews.json Crop xe phía sau khi khởi hành
    mockData.ts         Thành phố, xe, tuyến và chuyến demo
  App.tsx           Điều hướng đặt vé và SearchParams dùng chung
backend/            Laravel 13: API, quản lý nhà xe, tenant, migrations, tests
scripts/            Script chạy dev, build hosting và kiểm tra
docs/               Tài liệu chi tiết (xem bên dưới)
```

## Tài liệu

- [AGENTS.md](AGENTS.md): hướng dẫn đọc code và ràng buộc cho AI agent.
- [docs/hero.md](docs/hero.md): bố cục trang chủ, nguồn gốc tài nguyên, giới hạn và cách kiểm tra.
- [docs/home-editorial.md](docs/home-editorial.md): các mục bên dưới trang chủ.
- [docs/LARAVEL_PORTALS.md](docs/LARAVEL_PORTALS.md): backend Laravel, định tuyến nhiều tên miền, cài đặt local.
- [docs/OPERATOR_STUDIO.md](docs/OPERATOR_STUDIO.md) và [docs/operator-app.md](docs/operator-app.md): quản trị nhà xe và app thương hiệu.
- [docs/url-navigation.md](docs/url-navigation.md): quy tắc URL và lịch sử tìm kiếm.
- [docs/AZDIGI_DEPLOY.md](docs/AZDIGI_DEPLOY.md): deploy bản Laravel lên cPanel AZDIGI (danavago.com, cuaong., haivan.) bằng gói zip.
- [docs/CPANEL_UPDATE.md](docs/CPANEL_UPDATE.md): cập nhật website trên cPanel. Đọc trước khi triển khai.
- [docs/review-2026-10-27.md](docs/review-2026-10-27.md): kết quả review, các lỗi đã sửa và giới hạn còn lại (demo/backend).
- [docs/cleanup.md](docs/cleanup.md): tài nguyên đã gỡ và lý do.

## Triển khai (production: cPanel AZDIGI)

> ⚠️ **Server ĐÃ CÓ SẴN DATABASE.** Đọc hết mục này trước khi deploy. Không tạo lại database, không chạy
> `migrate:fresh`, `db:wipe`, không upload đè file `.sqlite`: làm vậy sẽ **mất toàn bộ** nhà xe, chuyến, vé, tài khoản.

### Hiện trạng server (cập nhật 2026-11-07)

| Mục | Giá trị |
|---|---|
| Hosting | cPanel AZDIGI (CloudLinux), user `khoaluan`, PHP 8.3 tại `/opt/alt/php83/usr/bin/php` (extension bật trong Select PHP Version → Extensions → 8.3), Node 22 tại `/opt/alt/alt-nodejs22/root/usr/bin`; build phải chạy 1 luồng |
| Mã nguồn | `~/danavago`, lấy code bằng Git. Repo **hiện tại**: `https://github.com/HungNguyen3205/Booking-Car.git`, nhánh `main` (sẽ đổi sang repo khác, xem [Đổi repo Git](#đổi-repo-git-trên-server)). Kiểm tra repo đang dùng: `git -C ~/danavago remote -v` |
| Tên miền | `danavago.com`, `cuaong.danavago.com`, `haivan.danavago.com` |
| Document root | `~/danavago.com`, `~/cuaong.danavago.com`, `~/haivan.danavago.com` là **symlink** → `~/danavago/backend/public`. Thư mục cũ được giữ lại tên `*.bak-YYYYMMDD-HHMM` |
| PHP cho web | Tài khoản cPanel mặc định PHP 8.2 (dùng chung cho các website khác, **không đổi**). Riêng DANAVA chạy PHP 8.3 nhờ 4 dòng `AddHandler application/x-httpd-alt-php83___lsphp .php` thêm ở **đầu** `~/danavago/backend/public/.htaccess` (chỉ có trên server, Git bỏ qua bằng `git update-index --skip-worktree`; bản `.htaccess` gốc sao lưu ở `~/danavago-htaccess.bak`) |
| Cấu hình | `~/danavago/backend/.env` (không có trên Git; `APP_ENV=production`, `TENANT_WILDCARD_READY=true`, `TENANT_APP_ROOT=danavago.com`) |
| **Database** | **SQLite có sẵn**: `~/danavago/backend/database/danavago.sqlite`. Đã có đủ bảng (migrate), 2 nhà xe demo **Hải Vân Xanh** (`haivan.danavago.com`) và **Cửa Ông Limousine** (`cuaong.danavago.com`) với tuyến, xe van 7/9/11 chỗ, lịch chạy 7 ngày, và tài khoản quản trị Studio |
| Tài khoản | Đăng nhập `https://danavago.com/manage`. Xem danh sách: `php artisan danava:staff-list`. Quên mật khẩu: `php artisan danava:reset-password <email>`. Mật khẩu server **không** ghi trong repo |
| Kiểm tra | `https://danavago.com`, `/appgo`, `/manage`, `https://cuaong.danavago.com`, `https://haivan.danavago.com` |

Database đến từ một trong hai cách đã dùng khi deploy lần đầu (cả hai cho cùng cấu trúc): gói zip có sẵn file
`danavago.sqlite` copy từ máy dev (kèm tài khoản, mật khẩu đã đổi ngẫu nhiên), hoặc `migrate` + `danava:seed-brand-demo`
+ `danava:create-admin` chạy trên server. Dù cách nào, **từ nay chỉ cập nhật code, không đụng vào file database**.

### Cập nhật code (mỗi lần có commit mới trên repo đang dùng, nhánh `main`)

Chạy trong cPanel → Terminal. Lệnh **giữ nguyên database và `.env`**; `migrate --force` chỉ thêm bảng/cột mới, không xóa dữ liệu.

```bash
(set -e
export PATH="/opt/alt/alt-nodejs22/root/usr/bin:/opt/alt/php83/usr/bin:$PATH"
PHP=/opt/alt/php83/usr/bin/php
cd ~/danavago
cp backend/database/danavago.sqlite ~/danavago-db-backup-$(date +%Y%m%d-%H%M).sqlite   # sao lưu DB trước khi cập nhật
git pull --ff-only origin main
npm ci --include=dev
RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=1 npm run build:hosting   # hosting giới hạn số luồng: build 1 luồng
cd backend
$PHP "$(command -v composer || echo composer.phar)" install --no-dev --optimize-autoloader
$PHP artisan migrate --force
$PHP artisan config:cache
echo XONG)
```

Thêm lịch chạy cho 2 nhà xe demo khi hết 7 ngày (không tạo trùng, không xóa vé):

```bash
cd ~/danavago/backend
sed -i 's/^DANAVA_ALLOW_DEMO_SEED=false/DANAVA_ALLOW_DEMO_SEED=true/' .env && /opt/alt/php83/usr/bin/php artisan config:cache
/opt/alt/php83/usr/bin/php artisan danava:seed-brand-demo --days=7
sed -i 's/^DANAVA_ALLOW_DEMO_SEED=true/DANAVA_ALLOW_DEMO_SEED=false/' .env && /opt/alt/php83/usr/bin/php artisan config:cache
```

### Đổi repo Git trên server

Database (`backend/database/danavago.sqlite`), `backend/.env` và ảnh tải lên (`backend/storage/app/public`) **không nằm
trên Git**, nên đổi repo không làm mất dữ liệu. Không xóa `~/danavago` rồi clone lại; chỉ đổi địa chỉ remote:

```bash
cd ~/danavago
git remote -v                                   # repo cũ
git remote set-url origin https://github.com/<TAI-KHOAN-MOI>/<REPO-MOI>.git
git fetch origin
git status                                      # phải sạch (không có thay đổi local)
git log --oneline -1 origin/main                # commit mới nhất của repo mới
```

Repo mới phải chứa cùng lịch sử code (đã push commit mới nhất từ repo cũ lên). Nếu repo mới có lịch sử khác hẳn,
`git pull --ff-only` sẽ báo lỗi: **không** dùng `reset --hard`; liên hệ người quản lý code để đồng bộ trước. Sau khi đổi,
chạy khối lệnh "Cập nhật code" ở trên như bình thường. Nhớ sửa lại dòng *Mã nguồn* trong bảng hiện trạng.

### Lỗi thường gặp khi cài trên hosting

`npm run build` báo `ThreadPoolBuildError … Resource temporarily unavailable` rồi `Aborted (core dumped)`: hosting dùng chung
giới hạn số luồng, công cụ build (Rust) không mở được luồng. Luôn build bằng `RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=1 npm run build:hosting`.
Nếu vẫn lỗi: build trên máy dev (`npm run build:hosting`), nén `backend/public/{assets,spa.html,favicon.svg,icons.svg}` thành zip
có thư mục gốc `public/`, upload vào home rồi `cd ~/danavago/backend && unzip -o ~/danavago-build.zip`.

`composer install` báo `requires ext-fileinfo … missing`: PHP 8.3 chưa bật extension. cPanel → **Select PHP Version** →
tab **Extensions** → chọn phiên bản **8.3** (không bấm *Set as current*, tài khoản có nhiều website khác) → tick
`fileinfo`, `pdo_sqlite`, `sqlite3`, `mbstring`, `intl`, `zip`. Cảnh báo `pdo_mysql skipped as conflicting` là bình thường:
`nd_pdo_mysql` đã bật thay thế. Kiểm tra: `/opt/alt/php83/usr/bin/php -m | grep -iE "fileinfo|pdo_sqlite|sqlite3|mbstring"`.
Không dùng `--ignore-platform-req` (web vẫn lỗi khi chạy).

Trình duyệt báo `Composer detected issues in your platform … require a PHP version ">= 8.3.0". You are running 8.2.x`:
Terminal chạy PHP 8.3 (gọi thẳng `/opt/alt/php83/usr/bin/php`) nhưng web dùng PHP mặc định của tài khoản (8.2). Hosting
CloudLinux/LiteSpeed không có MultiPHP Manager, nên đặt PHP 8.3 **chỉ cho thư mục DANAVA** (không ảnh hưởng website khác):

```bash
cd ~/danavago/backend/public
cp .htaccess ~/danavago-htaccess.bak
sed -i '1i # AZDIGI/CloudLinux: chạy PHP 8.3 cho riêng website DANAVA (không đổi PHP của cả tài khoản)
<IfModule mime_module>
  AddHandler application/x-httpd-alt-php83___lsphp .php
</IfModule>
' .htaccess
git -C ~/danavago update-index --skip-worktree backend/public/.htaccess
```

Lỗi 500 hoặc trình duyệt tải về file `.php` sau khi sửa: khôi phục `cp ~/danavago-htaccess.bak ~/danavago/backend/public/.htaccess`.
Nếu sau này `.htaccess` trong repo thay đổi, `git pull` sẽ báo xung đột ở file này: chạy
`git update-index --no-skip-worktree backend/public/.htaccess`, sao lưu, `git checkout -- backend/public/.htaccess`, pull, rồi thêm lại 4 dòng trên.

### Không được làm

- Không chạy `php artisan migrate:fresh`, `migrate:reset`, `db:wipe`, không xóa/ghi đè `backend/database/danavago.sqlite`.
- Không upload lại gói zip đè lên `~/danavago` (gói zip có file `.sqlite` riêng, sẽ ghi đè dữ liệu thật). Nếu buộc phải dùng zip:
  giải nén ra thư mục khác, chỉ copy code, giữ nguyên `backend/database/danavago.sqlite` và `backend/.env`.
- Không đổi PHP của **cả tài khoản** cPanel (tài khoản có nhiều website khác); PHP 8.3 cho DANAVA đặt bằng `.htaccess` như trên.
- Không xóa 4 dòng `AddHandler … php83` ở đầu `backend/public/.htaccess` trên server (web sẽ quay về PHP 8.2 và báo lỗi).
- Không đặt `public_html` hay document root vào `~/danavago` (chỉ `backend/public` được public).
- Không commit `.env`, `vendor/`, file SQLite, file session hoặc ảnh tải lên.

### Chuyển sang MySQL khi chạy thật

Dữ liệu SQLite **không** tự sang MySQL. Khi cần: tạo database + user trong cPanel → MySQL Databases, sao lưu file
`.sqlite`, sửa `.env` (`DB_CONNECTION=mysql`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`), `php artisan migrate --force`,
tạo lại tài khoản/dữ liệu (hoặc nhờ chuyển dữ liệu có đối soát). Chi tiết và xử lý lỗi: [docs/AZDIGI_DEPLOY.md](docs/AZDIGI_DEPLOY.md).
Hướng dẫn cũ cho bản frontend tĩnh: [docs/CPANEL_UPDATE.md](docs/CPANEL_UPDATE.md).

## Giới hạn hiện tại

- Thanh toán online chưa tích hợp; luồng thanh toán hiện là mô phỏng.
- Dữ liệu chế độ demo không phải dữ liệu thật của nhà xe.
- DNS và SSL cho tên miền nhà xe là bước hạ tầng riêng, không tự động khi lưu domain trong app.
- GPS lấy từ điện thoại tổ lái qua trình duyệt: khi app bị tắt/khoá màn hình lâu, trình duyệt ngừng gửi vị trí (khách thấy "mất tín hiệu"). Muốn chạy nền liên tục cần app native hoặc thiết bị GPS gắn xe.
- "Đúng tuyến" so với đường thẳng nối các điểm có tọa độ, không phải đường bộ thật: tuyến càng nhiều điểm dọc đường càng chính xác.
- Ảnh bản đồ mặc định lấy từ máy chủ công cộng OpenStreetMap (giới hạn lưu lượng, có lúc không tải). Production nên đặt `VITE_MAP_TILE_URL` sang nhà cung cấp bản đồ (MapTiler, Stadia… hoặc tự host).
- Quét QR bằng camera cần HTTPS (hoặc localhost) và quyền camera.

## Nhật ký cập nhật

Ghi theo phiên bản để người cùng làm biết đã làm gì và còn gì phải làm. Phiên bản mới ở trên cùng.
Khi thay đổi lớn, thêm một mục mới theo cùng mẫu.

### v2.7 — 2026-11-07 · Studio đọc được trên điện thoại

- Màn hình ≤ 640px: mọi bảng trong Studio hiển thị **mỗi dòng một thẻ** ("TÊN CỘT: giá trị"), không còn bị ép cột hay phải
  cuộn ngang (`studio/studio-mobile.css`). Tên cột lấy tự động từ tiêu đề bảng (`studio/useTableCardLabels.ts`), nên bảng
  thêm sau này cũng tự áp dụng. Bảng chấm công dạng lịch vẫn cuộn ngang; bảng khác muốn giữ cuộn ngang thì bọc bằng phần tử có `data-table-scroll`.
- Trang Tổng quan: "Hiệu quả nhà xe đối tác" và "Đơn vé vừa đặt" thiết kế lại thành danh sách thẻ (không còn bảng 5 cột
  phải cuộn ngang): nhà xe có doanh thu + thanh so sánh, số chuyến, vé, hoa hồng; đơn vé có khách, SĐT, mã vé, tuyến,
  giờ, ghế, số tiền, trạng thái thu tiền (bấm vào mở Đơn vé). Xuống 1 cột trên điện thoại.
- Nút trong bảng không bị bẻ chữ (cột Thao tác ở Chuyến chạy).
- Máy tính: bảng giữ nguyên như cũ.

### v2.6 — 2026-11-07 · Deploy test lên cPanel AZDIGI

- Commit `2ff0040` đã push lên `HungNguyen3205/Booking-Car` main, repo dùng để deploy test (2 repo `danavagroup/DANAVA_Bus`,
  `danava-org/DANAVA_Bus` chưa cập nhật). Sau này đổi sang repo khác: xem [Đổi repo Git](#đổi-repo-git-trên-server).
- Server có sẵn database SQLite, 2 nhà xe demo và tài khoản `admin@danavago.com`; xem mục [Triển khai](#triển-khai-production-cpanel-azdigi).
- Đã cài bằng Git trên server: build 1 luồng (`RAYON_NUM_THREADS=1`), bật extension PHP 8.3 (fileinfo, pdo_sqlite…),
  web chạy PHP 8.3 qua `.htaccess` (tài khoản mặc định 8.2). 3 domain là symlink tới `backend/public`, thư mục cũ `*.bak-20261107-1431`.
- `backend/server.php` (chạy thử `php -S`) sửa so sánh đường dẫn trên Windows; `docs/AZDIGI_DEPLOY.md` có cả cách zip và Git.

### v2.5 — 2026-11-07 · Trang chủ app gọn hơn

- Áp dụng cho appgo và mọi app nhà xe: ảnh bìa thấp hơn (295 → 228px), khung tìm chuyến gọn hơn (354 → 290px; icon, chữ,
  nút nhỏ lại nhưng vùng bấm vẫn ≥ 34px), banner **Ưu đãi** đưa lên ngay dưới khung tìm chuyến, thẻ điểm đến thấp hơn.
  Ở khổ 390×844 thấy trọn khung tìm, banner ưu đãi và thẻ điểm đến mà không bị thanh tab che.
- Màu thương hiệu tách vai trò: `--go-primary` (nền), `--go-on-primary` (chữ trên nền), `--go-primary-text` (chữ/icon trên
  nền trắng); logo Cửa Ông lấy từ mockup.

### v2.4 — 2026-11-07 · Demo app Hải Vân Xanh & Cửa Ông (commit `2ff0040`)

- Lệnh `danava:seed-brand-demo` (`app/Services/BrandDemo.php`): 2 nhà xe có màu, logo, ảnh bìa, slogan, hotline, chính sách,
  tuyến có tọa độ GPS, xe van 7/9/11 chỗ với sơ đồ ghế kiểu van (A1 | A2 … D1 D2 D3), lịch chạy nhiều ngày.
- **App nhà xe = bản sao y hệt appgo**: cùng bố cục, cùng mục (Điểm đến nổi bật, Ưu đãi, Vé của tôi, Tài khoản…), chỉ khác
  **logo, ảnh bìa, màu chủ đạo** (tên nhà xe thay chữ DANAVA Go; hotline/chính sách trong hộp liên hệ là của nhà xe).
  Dữ liệu chuyến vẫn chỉ của nhà xe đó (server khóa theo tên miền); điểm đi/đến mặc định là tuyến chính của nhà xe.
- **Nút liên hệ chỉ hiện khi vé đã thanh toán** (danh sách vé và vé điện tử), áp dụng cho cả appgo.
- Ghế đang chọn trên sơ đồ ghế theo màu nhà xe.
- Màu sáng (vd. Cửa Ông vàng hổ phách `#febc27`): nút nền vàng chữ nâu đậm (`ink` `#4d2f15`), chữ/icon màu thương hiệu
  chuyển sang nâu đậm. Biến mới `--go-primary-text`, `--go-on-primary`; màu tối (DANAVA, Hải Vân) giữ nguyên chữ trắng.
- Tenant có thêm `slogan`, `tagline` (lưu sẵn, hiện chưa hiển thị trong app).
- Tuyến có `waypoints` (điểm lộ trình chỉ dùng cho GPS, không phải điểm đón/trả); sửa tuyến trong Studio giữ nguyên waypoints.

### v2.3 — 2026-11-07 · App 3 vai trò, tổ lái, quét vé theo xe, GPS (commit `2ff0040`)

Đã làm:

- **Vai trò lơ xe** (`assistant`) bên cạnh tài xế (`driver`). Tạo tài khoản Tài xế/Lơ xe trong Studio tự tạo hồ sơ tổ lái (`records` kind `drivers`, có `position`).
- **Phân công tổ lái**: cột `trips.assistant_id`, API `PATCH /api/admin/trips/{id}/crew`, `GET /api/admin/crew`; Studio → Chuyến chạy → nút *Tổ lái*. Trước đây Studio chưa có chỗ gán tài xế và đổi tài xế bị chặn khi chuyến đã có vé.
- **Phạm vi tổ lái** dùng chung `StudioBridge::crewColumn/crewFilter/onTrip`: tài xế theo `driver_id`, lơ xe theo `assistant_id` (thay 7 chỗ kiểm tra cứng `role === 'driver'`).
- **Quét vé ràng buộc theo xe**: `checkin/lookup` và `checkin/{id}` nhận `trip_id`; vé của xe khác bị từ chối kèm thông tin chuyến/xe/giờ của vé.
- **GPS & nhật ký chuyến**: bảng `trip_positions`, `trip_events`; `TrackingService` (lệch tuyến, mất tín hiệu, thông báo chủ xe). API tổ lái `trips/{id}/tracking/start|position|finish`, chủ xe `tracking/live`, khách `customer/bookings/{id}/tracking` và `public/tracking` (mã vé + SĐT).
- **Tọa độ điểm dừng**: Studio → Tuyến → *Sửa · Tọa độ GPS* (trước đây trang Tuyến chỉ tạo mới, không sửa được). Sửa lỗi cũ: sửa tuyến làm đổi mã điểm dừng (`stop-1`…) khiến quầy bán vé chọn điểm đón cho chuyến đã lên lịch bị lỗi "Điểm đón/trả không thuộc chuyến".
- **App**: đăng nhập nhân viên ở Tài khoản; màn tài xế/lơ xe (`CrewApp`), tab *Quản lý* cho chủ xe (`ManageTab`), *Theo dõi xe & nhật ký chuyến* cho khách. Bản đồ Leaflet + OpenStreetMap; quét QR bằng `BarcodeDetector` hoặc `jsQR` (iPhone). Các màn này tải lazy nên app khách không nặng thêm.
- Vé đã soát lên xe vẫn nằm ở "Sắp đi" đến khi chuyến kết thúc (để khách mở theo dõi xe).
- Dependency mới: `leaflet`, `@types/leaflet`, `jsqr`. Migration mới: `2026_11_08_000001_crew_and_trip_tracking`. Test mới: `npm run test:crew`.

Đã kiểm tra: build, lint; `test:crew` 5/5, `test:studio` 17/17, `test:server` 25/25, `test:logic` 26/26, `test:surfaces` 37/37, `test:navigation` 25/25; chạy thử trên trình duyệt 390px cả 3 vai trò và Studio (Tổ lái, sửa tuyến). Chưa chạy `test:php` (máy dev đang có PHP 8.2, PHPUnit cần 8.3+).

### v2.2 — 2026-11-07 · App nhà xe theo thương hiệu, tài khoản Studio (commit `2ff0040`)

- App nhà xe dùng lại toàn bộ appgo, chỉ khác màu chủ đạo (1 mã màu → các biến `--go-*`), logo, ảnh bìa, hotline, chính sách, tuyến của nhà xe (`appgoBrand.ts`, `OperatorBrandedApp.tsx`). Không có ảnh bìa → nền gradient theo màu, không dùng ảnh DANAVA/thành phố.
- `/public/cities?operator=` để bản local `/app/{slug}` chỉ hiện thành phố của nhà xe.
- Lệnh `danava:staff-list`, `danava:reset-password`, `danava:create-admin` (quên/tạo tài khoản Studio).

### v2.1 — 2026-11-06 · Studio trên dữ liệu thật (commit `46f76f3`)

- Studio `/api/admin/*` chạy trên mô hình nhà xe thật (`StudioBridge`), sơ đồ ghế, tài khoản khách, checkout appgo.

### v2.0 — 2026-11-02 → 05 · Laravel, đa nhà xe, Studio, app mobile (commit `179ccb7` … `67892d5`)

- Chuyển backend sang Laravel, sàn nhiều nhà xe, cổng theo tên miền, bộ Studio quản trị, giao diện app mobile.

### Cần làm tiếp

- [ ] Chạy `test:php` trên máy có PHP 8.3+; chạy `npm run test:journey` và `test:audit` trước khi triển khai.
- [ ] Production: đặt `VITE_MAP_TILE_URL` (nhà cung cấp bản đồ), bảo đảm HTTPS cho camera/GPS, chạy migration mới trên MySQL.
- [ ] Nhập tọa độ điểm dừng cho các tuyến thật; cân nhắc lưu đường đi thật (polyline) thay vì đường thẳng nối các điểm.
- [ ] GPS chạy nền: app native (Capacitor/React Native) hoặc tích hợp API thiết bị GPS gắn xe (Vietmap, Bình Anh…).
- [ ] Dọn dữ liệu GPS cũ (ví dụ giữ 30–90 ngày) bằng lệnh định kỳ.
- [ ] Thông báo đẩy cho khách khi xe xuất bến / sắp tới điểm đón / lệch tuyến (hiện chỉ hiện trong app khi mở).
- [ ] Ưu đãi riêng của nhà xe hiển thị trong tab Ưu đãi (hiện chỉ nhập mã khi thanh toán).
- [ ] Gỡ `src/components/operator-app/` (demo Cửa Ông cũ) sau khi kiểm tra app nhà xe với chuyến thật.
- [ ] Studio: ô nhập điểm lộ trình (waypoints) ở Tuyến.
- [ ] Thay logo/ảnh cắt từ mockup bằng file gốc chất lượng cao của nhà xe.
- [ ] Thanh toán online (QR ngân hàng, ví điện tử như mockup Hải Vân).
