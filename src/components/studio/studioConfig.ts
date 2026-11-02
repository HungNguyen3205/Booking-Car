export type Item = { id: string; [key: string]: any };
export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
};
export const roleLabels: Record<string, string> = {
  platform: "Quản trị nền tảng",
  owner: "Chủ nhà xe",
  manager: "Quản lý",
  dispatcher: "Điều hành",
  sales: "Bán vé",
  accountant: "Kế toán",
  driver: "Tài xế",
};
export const statuses: Record<string, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  published: "Đang mở bán",
  closed: "Đóng bán",
  cancelled: "Đã hủy",
  completed: "Hoàn tất",
  confirmed: "Đã đặt",
  checked_in: "Đã lên xe",
  unpaid: "Chưa thu tiền",
  paid: "Đã thu đủ",
  refund_due: "Cần hoàn tiền",
  refunded: "Đã hoàn",
  active: "Hoạt động",
  suspended: "Tạm ngưng",
};
export const modules: Record<
  string,
  {
    title: string;
    subtitle: string;
    fields: Field[];
    columns: string[];
    labels: string[];
  }
> = {
  vehicles: {
    title: "Đội xe",
    subtitle: "Mỗi chiếc xe, một chuẩn trải nghiệm.",
    columns: ["name", "plate", "category", "capacity"],
    labels: ["Tên xe", "Biển số", "Loại", "Số chỗ"],
    fields: [
      { key: "name", label: "Tên xe", required: true },
      { key: "plate", label: "Biển số", required: true },
      {
        key: "category",
        label: "Loại xe",
        type: "select",
        options: [
          { value: "sleeper", label: "Giường nằm" },
          { value: "limousine", label: "Limousine" },
          { value: "cabin", label: "Cabin VIP" },
        ],
      },
      {
        key: "capacity",
        label: "Số chỗ hành khách",
        type: "number",
        required: true,
        min: 1,
        max: 60,
      },
      { key: "floors", label: "Số tầng", type: "number", min: 1, max: 2 },
      { key: "image", label: "Ảnh xe", type: "image" },
      { key: "description", label: "Mô tả", type: "textarea" },
      { key: "amenities", label: "Tiện ích (mỗi dòng một mục)", type: "lines" },
      {
        key: "seatCodes",
        label: "Mã ghế riêng (mỗi dòng một mã; để trống để tự tạo)",
        type: "lines",
      },
      { key: "inspectionDate", label: "Hạn đăng kiểm", type: "date" },
      { key: "maintenance", label: "Đang bảo dưỡng", type: "checkbox" },
    ],
  },
  routes: {
    title: "Tuyến đường",
    subtitle: "Kết nối những điểm đến, rõ ràng từng điểm đón.",
    columns: ["name", "from", "to", "durationMinutes"],
    labels: ["Tuyến", "Điểm đi", "Điểm đến", "Phút"],
    fields: [
      { key: "name", label: "Tên tuyến", required: true },
      { key: "from", label: "Thành phố đi", required: true },
      { key: "to", label: "Thành phố đến", required: true },
      {
        key: "durationMinutes",
        label: "Thời gian dự kiến (phút)",
        type: "number",
        min: 10,
        max: 2880,
        required: true,
      },
      { key: "pickups", label: "Điểm đón", type: "stops" },
      { key: "dropoffs", label: "Điểm trả", type: "stops" },
    ],
  },
  drivers: {
    title: "Tài xế",
    subtitle: "Đúng người, đúng chuyến, đúng lịch.",
    columns: ["name", "phone", "license", "licenseExpiry"],
    labels: ["Họ tên", "Điện thoại", "Hạng GPLX", "Hết hạn"],
    fields: [
      { key: "name", label: "Họ tên", required: true },
      { key: "phone", label: "Điện thoại", type: "tel", required: true },
      { key: "license", label: "Hạng giấy phép", required: true },
      { key: "licenseExpiry", label: "Hạn giấy phép", type: "date" },
      { key: "active", label: "Đang hoạt động", type: "checkbox" },
    ],
  },
  branches: {
    title: "Văn phòng & Chi nhánh",
    subtitle: "Một hệ thống cho mọi điểm bán.",
    columns: ["name", "address", "phone"],
    labels: ["Tên văn phòng", "Địa chỉ", "Điện thoại"],
    fields: [
      { key: "name", label: "Tên văn phòng", required: true },
      { key: "address", label: "Địa chỉ", required: true },
      { key: "phone", label: "Điện thoại", type: "tel", required: true },
    ],
  },
  agencies: {
    title: "Đại lý",
    subtitle: "Theo dõi đối tác và hạn mức công nợ.",
    columns: ["name", "phone", "creditLimit", "commissionBps"],
    labels: ["Đại lý", "Điện thoại", "Hạn mức", "Hoa hồng (bps)"],
    fields: [
      { key: "name", label: "Tên đại lý", required: true },
      { key: "phone", label: "Điện thoại", required: true },
      {
        key: "creditLimit",
        label: "Hạn mức công nợ (đ)",
        type: "number",
        min: 0,
      },
      {
        key: "commissionBps",
        label: "Hoa hồng (100 bps = 1%)",
        type: "number",
        min: 0,
        max: 5000,
      },
      { key: "active", label: "Đang hoạt động", type: "checkbox" },
    ],
  },
  promotions: {
    title: "Ưu đãi",
    subtitle: "Chương trình có giới hạn, kiểm soát tại server.",
    columns: ["name", "code", "value", "ends"],
    labels: ["Chương trình", "Mã", "Mức giảm", "Kết thúc"],
    fields: [
      { key: "name", label: "Tên chương trình", required: true },
      { key: "code", label: "Mã ưu đãi", required: true },
      {
        key: "discountType",
        label: "Kiểu giảm",
        type: "select",
        options: [
          { value: "fixed", label: "Số tiền (đ)" },
          { value: "percent", label: "Phần trăm" },
        ],
      },
      {
        key: "value",
        label: "Mức giảm",
        type: "number",
        min: 1,
        required: true,
      },
      { key: "limit", label: "Tối đa số lượt", type: "number", min: 1 },
      { key: "starts", label: "Bắt đầu", type: "date", required: true },
      { key: "ends", label: "Kết thúc", type: "date", required: true },
      { key: "active", label: "Đang áp dụng", type: "checkbox" },
    ],
  },
  shifts: {
    title: "Lịch trực & Phụ cấp",
    subtitle: "Ghi nhận ca làm và phụ cấp dự kiến; chưa tự tính lương.",
    columns: ["name", "date", "allowance", "checkedIn"],
    labels: ["Ca làm", "Ngày", "Phụ cấp", "Đã chấm công"],
    fields: [
      { key: "name", label: "Tên ca", required: true },
      {
        key: "driverId",
        label: "Tài xế",
        type: "driver-select",
        required: true,
      },
      { key: "date", label: "Ngày trực", type: "date", required: true },
      {
        key: "allowance",
        label: "Phụ cấp dự kiến (đ)",
        type: "number",
        min: 0,
      },
      { key: "note", label: "Ghi chú", type: "textarea" },
      { key: "checkedIn", label: "Đã chấm công", type: "checkbox" },
    ],
  },
};
export const money = (n: unknown) =>
  Number(n || 0).toLocaleString("vi-VN") + "đ";
export const formatDate = (s: unknown) =>
  s
    ? new Date(
        String(s).length === 10 ? String(s) + "T12:00:00+07:00" : String(s),
      ).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        ...(String(s).length > 10 ? { timeStyle: "short" } : {}),
      })
    : "—";
