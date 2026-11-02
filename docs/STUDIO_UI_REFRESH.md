# Studio — cải thiện giao diện quản trị

Phạm vi: StudioApp, StudioTable và studio.css. Không sửa API, phân quyền, dữ liệu hay animation xe ngoài trang đặt vé.

- Cỡ chữ mặc định 15px; bảng 14px, thông tin phụ 12px; tiêu đề trang co giãn 28–40px.
- Không gian nội dung tận dụng chiều ngang; nền navy ít nhiễu, panel phân lớp, số liệu nổi bật.
- Menu chia 5 nhóm có thể thu gọn: Tổng quan; Điều hành & Bán vé; Đội xe & Nhân sự; Kinh doanh & Tài chính; Thương hiệu & Hệ thống. Giữ phân quyền sẵn có.
- StudioTable dùng chung cho bảng lịch chuyến, đơn vé, tài chính, khách hàng, nhân sự, báo cáo và danh mục. Bấm mũi tên cạnh tên cột để tìm/chọn nhiều giá trị hoặc sắp xếp. Các cột lọc kết hợp AND. Chip cho biết bộ lọc đang bật; xóa từng cột hoặc tất cả. Không lọc cột thao tác. Bộ lọc chỉ áp dụng dữ liệu đã tải của trang, không thay API hoặc xuất báo cáo server.
- Chuyển trang fade/translate 240ms, tắt khi reduced motion. Form không chờ animation mới dùng được.

Kiểm tra: TypeScript/Vite build và lint đạt. Kiểm tra SSR xác nhận bảng hiển thị đầy đủ dòng, giữ nút thao tác, tiêu đề lọc và thuộc tính ARIA. Trình duyệt QA bị môi trường chặn truy cập trong lượt này; cần kiểm tra trực quan trên /manage hoặc /admin trước khi merge: mở/đóng nhóm menu, đổi nhà xe, chọn nhiều giá trị cột, kết hợp ô tìm kiếm, xóa lọc, menu mobile và reduced motion. Không coi ảnh video tham chiếu là ảnh nghiệm thu.

## Navy / nền sáng theo ảnh tham chiếu

`studio-navy.css` được import sau stylesheet cũ để đồng bộ mọi màn hình: sidebar navy #102744, nền sáng #F2F6FC, thẻ trắng trong nhẹ, CTA xanh #1765E8. Tổng quan đặt KPI lên đầu, sau đó biểu đồ thu ròng SVG và chuyến tiếp theo, lịch chạy và bảng đơn vé gần đây từ API `dashboard.latest`. Không thêm tỷ lệ tăng trưởng, hiệu suất nhà xe hay số đếm giả theo ảnh mẫu. Ảnh xe dùng file alpha hiện có và shadow; không sinh ảnh mới, không in chữ/UI vào ảnh. Animation vào khung ngắn và tắt với reduced motion.

Build và lint đạt sau cập nhật. Trình duyệt mở được /manage nhưng backend bản preview chưa thiết lập tài khoản (hiện màn hình tạo quản trị đầu tiên), nên chưa xác nhận trực quan dashboard đã đăng nhập. Không tự tạo tài khoản hay bỏ xác thực để chụp màn hình. Cần nghiệm thu dashboard có dữ liệu, hộp thoại và các bảng trên môi trường đã cấu hình trước merge.
