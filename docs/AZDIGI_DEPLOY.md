# Deploy DANAVA GO lên cPanel AZDIGI (bản test)

Áp dụng cho: `danavago.com` (website + `/appgo` + Studio `/manage`), `cuaong.danavago.com` (app Cửa Ông),
`haivan.danavago.com` (app Hải Vân Xanh). Cả 3 tên miền chạy **cùng một thư mục** `backend/public`;
Laravel tự chọn app theo tên miền.

Gói deploy (`danavago-deploy.zip`) được tạo trên máy dev, gồm:

- `danavago/backend/` — Laravel + `vendor/` + giao diện đã build sẵn trong `backend/public` (`spa.html`, `assets/`).
- `danavago/backend/database/danavago.sqlite` — database test (2 nhà xe, tuyến, xe, lịch 7 ngày, tài khoản Studio).
- `danavago/backend/.env.production` — cấu hình mẫu, đổi tên thành `.env`.

Không có `node_modules`, `src`, `.env` thật hay mật khẩu trong gói (mật khẩu tài khoản được gửi riêng).

## 1. Chọn PHP 8.3

cPanel → **Select PHP Version** (hoặc MultiPHP Manager) → chọn **8.3** cho `danavago.com` và 2 subdomain.
Bật extension: `pdo_sqlite`, `sqlite3`, `pdo_mysql`, `mbstring`, `fileinfo`, `openssl`, `tokenizer`, `xml`, `dom`, `curl`, `zip`.

## 2. Tải lên và giải nén

1. cPanel → **File Manager** → thư mục home (`/home/TEN_USER`), **Upload** `danavago-deploy.zip`.
2. Chuột phải file zip → **Extract** vào `/home/TEN_USER/` → được `/home/TEN_USER/danavago/backend/...`.

Không giải nén vào `public_html`: chỉ thư mục `backend/public` được phép public, mã nguồn và database phải nằm ngoài.

## 3. Trỏ 3 tên miền vào `backend/public`

cPanel → **Domains**:

- `cuaong.danavago.com` → **Manage** → Document Root: `danavago/backend/public` → Update.
- `haivan.danavago.com` → giống trên.
- `danavago.com`:
  - Nếu sửa được Document Root (addon domain) → `danavago/backend/public`.
  - Nếu là domain chính (Document Root cố định `public_html`, không sửa được): mở **Terminal**, sao lưu rồi tạo liên kết:
    ```bash
    mv ~/public_html ~/public_html.bak-$(date +%Y%m%d)
    ln -s ~/danavago/backend/public ~/public_html
    ```
    (Website cũ vẫn còn trong `public_html.bak-…`; muốn quay lại thì xóa liên kết và đổi tên thư mục về `public_html`.)

cPanel → **SSL/TLS Status** → **Run AutoSSL** để 3 tên miền có HTTPS (camera quét vé và GPS cần HTTPS).

## 4. Cấu hình và chạy lệnh (cPanel → Terminal)

```bash
cd ~/danavago/backend
cp .env.production .env
sed -i "s#/home/TEN_USER_CPANEL/#$HOME/#" .env      # điền đường dẫn database theo user hiện tại
php -v                                              # phải là 8.3.x
php artisan key:generate --force
php artisan migrate --force                          # database đóng gói đã cập nhật, lệnh này thường báo "Nothing to migrate"
chmod -R 775 storage bootstrap/cache
chmod 775 database && chmod 664 database/danavago.sqlite
php artisan config:cache
php artisan danava:staff-list                        # xem các tài khoản Studio
```

Nếu `php -v` không phải 8.3 trong Terminal, dùng đường dẫn đầy đủ, ví dụ `/opt/alt/php83/usr/bin/php artisan …`.

Mỗi lần sửa `.env` phải chạy lại `php artisan config:cache`.

## 5. Kiểm tra

| Mở | Kết quả đúng |
|---|---|
| `https://danavago.com` | Website DANAVA GO |
| `https://danavago.com/appgo` | App DANAVA Go (màu xanh dương) |
| `https://danavago.com/manage` | Studio, đăng nhập bằng tài khoản được gửi riêng |
| `https://cuaong.danavago.com` | App Cửa Ông (vàng hổ phách, logo xe van) |
| `https://haivan.danavago.com` | App Hải Vân Xanh (xanh lá) |

Thử đặt 1 vé trên mỗi app, rồi vào Studio xem đơn vé của đúng nhà xe.

## 6. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| 500 + log ghi "No application encryption key" | `php artisan config:clear && php artisan key:generate --force && php artisan config:cache` (khóa phải có trong `.env` trước khi cache). |
| 503 "Chưa có frontend build" | Thiếu `backend/public/spa.html`: giải nén lại đầy đủ gói zip. |
| 404 "Tên miền chưa được cấu hình…" | Kiểm tra `TENANT_WILDCARD_READY=true`, `MARKETPLACE_HOST=danavago.com` trong `.env`, rồi `php artisan config:cache`. |
| Subdomain mở ra website DANAVA thay vì app nhà xe | Subdomain chưa trỏ đúng `danavago/backend/public` hoặc chưa chạy `config:cache`. |
| 500 Server Error | Xem `~/danavago/backend/storage/logs/laravel.log`; thường do PHP < 8.3, thiếu `pdo_sqlite`, hoặc quyền ghi `storage`/`database`. |
| "could not find driver" | Bật extension `pdo_sqlite` (hoặc `pdo_mysql` nếu dùng MySQL). |
| "attempt to write a readonly database" | `chmod 775 ~/danavago/backend/database` và `chmod 664 …/danavago.sqlite`. |
| Hết chuyến sau 7 ngày | Tạm đặt `DANAVA_ALLOW_DEMO_SEED=true`, `php artisan config:cache`, `php artisan danava:seed-brand-demo --days=7`, rồi đặt lại `false` + `config:cache`. |

## 7. Trước khi chạy thật với khách

- Chuyển sang MySQL (cPanel → MySQL Databases: tạo database + user, cấp ALL PRIVILEGES), sửa `.env` theo phần MySQL,
  `php artisan migrate --force`, tạo quản trị bằng `php artisan danava:create-admin <email> "<Tên>"`.
  Dữ liệu trong file SQLite test **không** tự chuyển sang MySQL.
- Đổi mật khẩu mọi tài khoản test: `php artisan danava:reset-password <email>`; xóa các tài khoản `*.local` không dùng.
- Đặt `VITE_MAP_TILE_URL` (nhà cung cấp bản đồ) khi build nếu dùng GPS thật.
- Không để lộ `.env`, file `.sqlite` trong `public_html`.
