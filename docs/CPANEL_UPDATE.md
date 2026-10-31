# Cập nhật DANAVA GO trên cPanel — hướng dẫn cho người dùng và AI

## 1. Thông tin đã xác nhận

- Website: https://danavago.com ; app nhà xe: https://danavago.com/app
- Repo đang được cPanel lấy code theo terminal người dùng:
  `https://github.com/HungNguyen3205/Booking-Car.git`, nhánh `main`.
- Không nhầm với `danava-org/DANAVA_Bus` hoặc `danavagroup/DANAVA_Bus`.
  Một số bản trên máy Windows trước đây dùng các remote này, chưa có `/app`.
- Node có trên hosting tại `/opt/alt/alt-nodejs22/root/usr/bin` nhưng chưa nằm
  trong PATH của phiên terminal. Cần kiểm tra `node -v` đạt 22.12.0 trở lên.
- React/TypeScript/Vite: cần build, bản public nằm trong `dist/`.
  Git pull chỉ cập nhật source, chưa cập nhật bản website đã build.
- `/` là website DANAVA GO. `/app` là giao diện Cửa Ông, chọn trong `src/main.tsx`.
- Chưa xác nhận có CI/CD tự động trên repo này. Không mặc định push là đã deploy.
- Tài liệu này không cấu hình backend hoặc thanh toán thật; `/app` hiện là demo.

## 2. Quy tắc bắt buộc cho AI

1. Chỉ đọc tài liệu này, `AGENTS.md`, trạng thái Git và cấu hình liên quan trước.
   Không cần quét toàn bộ source để cập nhật hosting.
2. Phân biệt terminal máy Windows và terminal cPanel (Bash). Không truy cập được
   cPanel thì hướng dẫn người dùng chạy lệnh; không báo đã cập nhật server.
3. Xác nhận `pwd`, remote, nhánh và Document Root trước khi copy file. Document Root
   lấy tại cPanel → Domains → `danavago.com`; không suy ra chỉ từ tên thư mục.
4. Không đổi remote, reset hard, force push, git clean hoặc xóa source để sửa lỗi.
   Có thay đổi local hoặc pull xung đột/phân kỳ thì dừng và giữ nguyên dữ liệu.
5. Không đụng `.htaccess`, `.user.ini`, `php.ini`, `.env`, thông tin đăng nhập,
   chứng chỉ, thư mục upload hay các website khác. Không đưa secrets vào frontend.
6. Chỉ deploy sau khi install/build thành công và có `dist/index.html`.
7. Không chạy `npm run dev` hoặc `vite preview` để phục vụ website production.
8. Việc người dùng yêu cầu tạo/đọc tài liệu không tự cho phép deploy. Khi người dùng
   yêu cầu cập nhật website thì thực hiện trong phạm vi đó, không cần hỏi lại.
9. Không commit `dist`, `node_modules` hoặc bản sao lưu vào Git. Không copy Git,
   source, môi trường Node hay bản sao lưu vào Document Root.

## 3. Bố trí một lần để các lần cập nhật sau không lỗi Git

Khuyến nghị tách mã nguồn và website public:

- Source riêng: `$HOME/repositories/danavago-source`
- Document Root: đường dẫn thật trong cPanel Domains.

Trước đây người dùng clone source ngay trong thư mục website rồi chép `dist` vào
đó. Cách này ghi đè `index.html` đang được Git quản lý, dễ gây lỗi lần pull sau;
source cũng có thể bị public nếu cấu hình server không chặn. Từ lần sau dùng
checkout riêng bên ngoài Document Root. Không tự xóa checkout/cấu hình cũ đang chạy.

Trong terminal cPanel, tạo source riêng nếu đường dẫn này CHƯA tồn tại:

```bash
mkdir -p "$HOME/repositories"
git clone --branch main https://github.com/HungNguyen3205/Booking-Car.git "$HOME/repositories/danavago-source"
```

Nếu thư mục đã có, kiểm tra `git -C "$HOME/repositories/danavago-source" remote -v`
và `git status` trước, không ghi đè hoặc xóa rồi clone lại.

## 4. Cập nhật mỗi lần có code mới trên main

Chạy tại cPanel Terminal. Trong khối dưới, sửa `DEPLOY_WEB_ROOT` thành Document Root
đã xác nhận. `$HOME/danavago.com` chỉ là VÍ DỤ theo tên thư mục trong ảnh terminal;
không chạy copy nếu chưa đối chiếu với cPanel Domains. Đây là Bash, không phải PowerShell.

Khối lệnh chạy trong subshell; `set -e` dừng ngay khi một bước lỗi, không tiếp tục
copy bản build cũ. Không đóng phiên terminal cha khi có lỗi.

```bash
(
set -e
export PATH="/opt/alt/alt-nodejs22/root/usr/bin:$PATH"
DEPLOY_SOURCE_DIR="$HOME/repositories/danavago-source"
DEPLOY_WEB_ROOT="$HOME/danavago.com"  # SỬA nếu Document Root thực tế khác

node -v
npm -v
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a!==22 || b<12){console.error("Cần Node 22.12+ trong nhánh 22");process.exit(1)}'
test -d "$DEPLOY_WEB_ROOT"
cd "$DEPLOY_SOURCE_DIR"
test "$(pwd -P)" != "$(cd "$DEPLOY_WEB_ROOT" && pwd -P)"
case "$(git remote get-url origin)" in
  https://github.com/HungNguyen3205/Booking-Car|https://github.com/HungNguyen3205/Booking-Car.git) ;;
  *) echo "Sai repo origin: dừng để kiểm tra"; exit 1 ;;
esac
test "$(git branch --show-current)" = "main"
if test -n "$(git status --porcelain)"; then
  git status --short
  echo "Source có thay đổi local: dừng, không tự ghi đè"
  exit 1
fi

git pull --ff-only origin main
npm ci --include=dev
npm run build
test -s dist/index.html

# Sao lưu bản public hiện tại bên NGOÀI Document Root.
DEPLOY_BACKUP_DIR="$HOME/danavago-backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_BACKUP_DIR"
deploy_backup_items=()
for deploy_name in index.html assets favicon.svg icons.svg .htaccess .user.ini php.ini; do
  if test -e "$DEPLOY_WEB_ROOT/$deploy_name"; then
    deploy_backup_items+=("$deploy_name")
  fi
done
if test "${#deploy_backup_items[@]}" -gt 0; then
  tar -czf "$DEPLOY_BACKUP_DIR/public-before-update.tar.gz" -C "$DEPLOY_WEB_ROOT" "${deploy_backup_items[@]}"
fi
git rev-parse HEAD > "$DEPLOY_BACKUP_DIR/deployed-commit.txt"

# Copy tài nguyên trước, thay index.html sau cùng. Không xóa assets cũ:
# tab/cache còn dùng bundle cũ vẫn cần các tên file hash trước đó.
for deploy_item in dist/*; do
  test -e "$deploy_item" || continue
  deploy_name="${deploy_item##*/}"
  test "$deploy_name" = "index.html" && continue
  cp -R "$deploy_item" "$DEPLOY_WEB_ROOT/"
done
cp dist/index.html "$DEPLOY_WEB_ROOT/.danava-index.new"
mv -f "$DEPLOY_WEB_ROOT/.danava-index.new" "$DEPLOY_WEB_ROOT/index.html"
echo "Đã copy bản build; cần kiểm tra / và /app trên trình duyệt"
git log -1 --oneline
)
```

Lưu ý: `deployed-commit.txt` ghi commit source MỚI của lần triển khai, không phải
commit của bản public cũ. Khối copy không phải triển khai atomic toàn bộ asset;
không chạy hai lần deploy đồng thời. Bản sao lưu dành cho khôi phục có chủ đích,
không tự giải nén ghi đè cấu hình khi chưa xác định lỗi.

## 5. Kiểm tra sau cập nhật

- Mở `https://danavago.com/`: website DANAVA GO và animation cũ vẫn hoạt động.
- Mở trực tiếp `https://danavago.com/app`, rồi refresh: giao diện Cửa Ông.
- Ctrl + Shift + R hoặc cửa sổ riêng tư để loại trừ cache trình duyệt.
- Kiểm tra ảnh, CSS/JS không bị 404; thử luồng tìm chuyến/chọn ghế.
- Có CDN thì chỉ purge cache sau khi xác nhận bản build đã copy đúng.
- Chỉ báo hoàn tất khi đã kiểm tra kết quả thực tế. Nếu không có quyền xem server
  hoặc trình duyệt thì nói rõ đã xác minh được đến bước nào.

## 6. Nếu /app trả 404

Kiểm tra `.htaccess` tại Document Root. Nếu chưa có SPA fallback tương đương,
sao lưu và BỔ SUNG đoạn sau, giữ cấu hình bảo mật/SSL/PHP và thứ tự rule đang có:

```apache
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
</IfModule>
```

Nếu `/app` ra website DANAVA GO thay vì app Cửa Ông, kiểm tra source `src/main.tsx`
có `OperatorEntry` và phép kiểm tra pathname `/app`, rồi kiểm tra bản build đang
phục vụ. Tham số `?from=...` không quyết định component `/app`.

## 7. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
| `npm: command not found` | Chạy lại `export PATH` ở mục 4 trong phiên terminal hiện tại; kiểm tra `node -v`, `npm -v`. |
| Node 22 quá cũ | Nhờ hosting cập nhật Node tương thích; hoặc build trên máy rồi upload nội dung `dist`. |
| `Already up to date` nhưng web cũ | Git chỉ cập nhật source; cần build và copy vào đúng Document Root. |
| `dist` không tồn tại | Install/build chưa thành công; không chạy copy. |
| `git pull` bị chặn bởi thay đổi `index.html` | Có thể đang dùng chung source/public; giữ file, chuyển sang checkout riêng ở mục 3. Không reset hard. |
| `?? assets/`, `.htaccess`, `.user.ini`, `php.ini` ở checkout cũ | Là file không theo dõi, không tự xóa hoặc commit lên Git. |
| Build bị kill/hết bộ nhớ hoặc lỗi native module trên hosting | Không lặp cài đặt vô hạn; build trên Windows/Linux tương thích rồi upload bản `dist`. |
| 403/500 sau sửa `.htaccess` | Đối chiếu/khôi phục đúng phần rule vừa thay từ bản sao lưu; không xóa toàn bộ cấu hình. |

Nếu không build được trên hosting: tại repo đúng trên máy Windows, dừng dev server,
`git pull --ff-only origin main`, `npm ci`, `npm run build`; upload NỘI DUNG bên trong
`dist` vào Document Root. Không upload nguyên thư mục thành `/dist`, không upload
`node_modules`, và giữ nguyên file cấu hình hosting.

## 8. Câu nhắc AI dùng lại

> Đọc AGENTS.md và docs/CPANEL_UPDATE.md. Kiểm tra repo/nhánh/trạng thái Git,
> Document Root và Node trước. Giúp tôi cập nhật danavago.com từ main, giữ cấu hình
> cPanel và các animation hiện có. Dừng nếu pull/install/build lỗi, kiểm tra cả /
> và /app trước khi báo hoàn tất. Không reset hard, force push hay xóa dữ liệu.
