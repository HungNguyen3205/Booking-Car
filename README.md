# DANAVA GO

Website đặt vé xe khách với hero du lịch toàn màn hình, xe chuyển động và ảnh địa danh đổi độc lập theo điểm đi/điểm đến. Màu navy, teal, cream; font Be Vietnam Pro. React + TypeScript + Vite + Framer Motion. Không cần WebGL hoặc mô hình 3D.

## Chạy dự án

Dùng Node.js đáp ứng `engines` của phiên bản Vite trong lockfile (Node 22.12+ hoặc bản LTS mới tương thích).

```bash
npm ci
npm run dev
```

Dừng dev server trước khi chạy lại `npm ci` trên Windows để tránh khóa file native.

```bash
npm run build
npm run lint
npx playwright install chromium
npm run test:journey
```

## Bản đồ mã nguồn

- `AGENTS.md`: chỉ dẫn đọc code có trọng tâm cho AI.
- `src/components/danava-go/`: hero duy nhất, cấu hình ảnh và chuyển động.
- `src/components/home/TripSearchForm.tsx`: form tìm chuyến dùng chung.
- `src/data/sceneManifest.ts`: ID/alias địa điểm.
- `src/data/mockData.ts`: dữ liệu thành phố, xe và chuyến demo.
- `src/components/search`, `seats`, `checkout`, `tickets`: chọn chuyến → ghế → thông tin → thanh toán mô phỏng → xuất vé.
- `docs/hero.md`: chi tiết giao diện, tài nguyên, giới hạn.
- `docs/cleanup.md`: danh sách nhóm tài nguyên đã dọn và lý do.

Bản này là frontend demo với thanh toán mô phỏng, không phải hệ thống thu tiền production.
