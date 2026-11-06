# DANAVA GO

Website đặt vé xe khách đa nhà xe. Trang chủ là hero du lịch toàn màn hình: xe chạy trên đường, ảnh địa danh đổi độc lập theo điểm đi (trái) và điểm đến (phải). Phần dưới trang chủ là các mục giới thiệu và form tìm chuyến dùng chung.

**Công nghệ:** React 19 + TypeScript + Vite 8 + Framer Motion (frontend), PHP 8.3+ / Laravel 13 (backend trong `backend/`). Giao diện là 2.5D bằng ảnh, SVG và DOM; không dùng WebGL hay mô hình 3D.

**Màu sắc & font:** navy, teal, cream; font Be Vietnam Pro.

## Tính năng chính

- Tìm chuyến theo điểm đi / điểm đến / ngày (múi giờ `Asia/Ho_Chi_Minh`) / số hành khách.
- Chọn chuyến → chọn ghế (capsule, ghế da, suite riêng) → nhập thông tin → thanh toán mô phỏng → xuất vé điện tử.
- Mỗi điểm đến có ảnh địa danh riêng; không dùng chung ảnh thành phố cho nhiều nơi.
- Nhánh Laravel: API thật cho quản lý vé, nhiều nhà xe, trang nhà xe, app thương hiệu riêng theo tên miền (`/app`, `/manage`).
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

Biến môi trường:

- `.env` ở gốc: chỉ cho launcher local (`PHP_BINARY`, `VITE_BOOKING_MODE`). Xem `.env.example`.
- `backend/.env`: toàn bộ cấu hình Laravel, gồm tên miền các app. Không commit file này.

## Tên miền và các app

Một bản build phục vụ mọi tên miền; app được chọn theo tên miền (`src/utils/surface.ts`).

| Tên miền | App | Thử ở local |
|---|---|---|
| `danavago.com` | Website đặt vé | `/` |
| `app.danavago.com` | App khách DANAVA Go (appgo) | `/appgo` |
| `studio.danavago.com` | Studio quản trị (nền tảng và nhà xe) | `/manage` |
| `admin.danavago.com` | Bí danh cũ, tự chuyển về Studio | `/admin` → `/manage` |
| `{slug}.danavago.com` hoặc tên miền riêng đã xác minh | App riêng của nhà xe | `/app/{slug}` |
| `danava.com/nha-xe/{slug}` | Trang giới thiệu nhà xe | `/nha-xe/{slug}` |

Tất cả dùng chung một backend Laravel và một cơ sở dữ liệu. DNS/SSL cho từng tên miền là bước hạ tầng riêng; xem [docs/LARAVEL_PORTALS.md](docs/LARAVEL_PORTALS.md).

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
    operator-app/   App đặt vé thương hiệu nhà xe
    portals/        Trang nhà xe và cổng theo tên miền
    studio/         Giao diện quản trị /manage (/admin tự chuyển về đây)
    appgo/          App khách DANAVA Go (app.danavago.com), gọi API đặt vé thật
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
- [docs/CPANEL_UPDATE.md](docs/CPANEL_UPDATE.md): cập nhật website trên cPanel. Đọc trước khi triển khai.
- [docs/review-2026-10-27.md](docs/review-2026-10-27.md): kết quả review, các lỗi đã sửa và giới hạn còn lại (demo/backend).
- [docs/cleanup.md](docs/cleanup.md): tài nguyên đã gỡ và lý do.

## Triển khai

Website `danavago.com` chạy trên cPanel. Quy trình build, sao chép và kiểm tra `/app` nằm trong [docs/CPANEL_UPDATE.md](docs/CPANEL_UPDATE.md). Production dùng `backend/public` làm document root và giữ nguyên `.htaccess` của Laravel. Không thay bằng rewrite kiểu SPA.

Không commit `.env`, `vendor/`, file SQLite, file session hoặc ảnh tải lên.

## Giới hạn hiện tại

- Thanh toán online chưa tích hợp; luồng thanh toán hiện là mô phỏng.
- Dữ liệu chế độ demo không phải dữ liệu thật của nhà xe.
- DNS và SSL cho tên miền nhà xe là bước hạ tầng riêng, không tự động khi lưu domain trong app.
