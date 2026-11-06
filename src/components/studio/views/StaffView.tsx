import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  X,
  Lock,
  Mail,
  Phone,
  User,
  ShieldCheck,
} from "lucide-react";
import { adminApi } from "../../../services/adminApi";
import type { StaffItem } from "../../../services/adminApi";
import PermissionGroupsPanel from "./modules/PermissionGroupsPanel";

export default function StaffView() {
  const [activeTab, setActiveTab] = useState<"staff" | "audit" | "groups">("staff");
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New Staff Form State
  const [formData, setFormData] = useState({
    ho_ten: "",
    email: "",
    password: "",
    so_dien_thoai: "",
    dia_chi: "",
    role: "sales",
    partner_id: "",
    permissions: [] as string[],
    tinh_trang: 1,
  });
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    adminApi.getPartners().then((r) => {
      const list = (r.data || []) as { id: string; name: string }[];
      setPartners(list);
      if (list.length === 1) setFormData((f) => ({ ...f, partner_id: list[0].id }));
    }).catch(() => setPartners([]));
  }, []);


  const roleLabels: Record<string, { label: string; badge: string }> = {
    owner: { label: "Chủ nhà xe", badge: "badge-purple" },
    manager: { label: "Quản lý", badge: "badge-teal" },
    dispatcher: { label: "Điều hành", badge: "badge-orange" },
    sales: { label: "Bán vé", badge: "badge-blue" },
    accountant: { label: "Kế toán", badge: "badge-green" },
    driver: { label: "Tài xế", badge: "badge-gray" },
  };

  const loadData = async () => {
    if (activeTab === "groups") return; // the panel loads its own data
    setLoading(true);
    try {
      if (activeTab === "staff") {
        const res = await adminApi.getStaff();
        if (res.status === 1) {
          setStaffList(res.data);
        }
      } else {
        const res = await adminApi.getAuditLogs({ limit: "50" });
        if (res.status === 1) {
          setAuditLogs(res.data.data);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi nạp danh sách nhân sự");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);


  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await adminApi.createStaff(formData);
      if (res.status === 1) {
        setSuccessMsg("Đã khởi tạo tài khoản nhân sự thành công!");
        setModalOpen(false);
        setFormData({
          ho_ten: "",
          email: "",
          password: "",
          so_dien_thoai: "",
          dia_chi: "",
          role: "sales",
          partner_id: partners.length === 1 ? partners[0].id : "",
          permissions: [],
          tinh_trang: 1,
        });
        loadData();
      } else {
        setErrorMsg(res.message || "Không thể tạo nhân sự");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra khi tạo nhân sự");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: StaffItem) => {
    const actionText = staff.tinh_trang === 1 ? "khóa" : "kích hoạt";
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của ${staff.ho_ten}?`)) return;

    try {
      const res = await adminApi.toggleStaffStatus(staff.id);
      if (res.status === 1) {
        loadData();
      } else {
        alert(res.message || "Không thể đổi trạng thái");
      }
    } catch (err: any) {
      alert(err.message || "Lỗi thao tác");
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.ho_ten.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.so_dien_thoai && s.so_dien_thoai.includes(searchQuery));
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="ds-page">
      <div className="ds-page-header">
        <div>
          <h2>Nhân sự & Phân quyền</h2>
          <p className="ds-text-muted">
            Quản lý tài khoản điều hành, nhân viên nhà xe và kiểm soát vai trò RBAC (Role-Based Access Control)
          </p>
        </div>
        <div className="ds-header-actions">
          <div className="ds-tabs-header">
            <button
              className={`ds-tab-btn ${activeTab === "staff" ? "active" : ""}`}
              onClick={() => setActiveTab("staff")}
            >
              <Users size={16} /> Danh sách nhân sự
            </button>
            <button
              className={`ds-tab-btn ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              <FileText size={16} /> Nhật ký hoạt động (Audit Logs)
            </button>
            <button
              className={`ds-tab-btn ${activeTab === "groups" ? "active" : ""}`}
              onClick={() => setActiveTab("groups")}
            >
              <ShieldCheck size={16} /> Nhóm quyền
            </button>
          </div>
          {activeTab === "staff" && (
            <button className="ds-btn ds-btn-primary" onClick={() => setModalOpen(true)}>
              <UserPlus size={16} /> Thêm nhân sự mới
            </button>
          )}
        </div>
      </div>

      {successMsg && <div className="ds-alert ds-alert-success">{successMsg}</div>}
      {errorMsg && <div className="ds-alert ds-alert-danger">{errorMsg}</div>}

      {activeTab === "groups" ? (
        <PermissionGroupsPanel />
      ) : activeTab === "staff" ? (
        <>
          <div className="ds-filter-bar">
            <div className="ds-search-input">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="ds-filter-group">
              <Filter size={16} />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">Tất cả vai trò</option>
                <option value="owner">Chủ nhà xe</option>
                <option value="manager">Quản lý</option>
                <option value="dispatcher">Điều hành</option>
                <option value="sales">Bán vé</option>
                <option value="accountant">Kế toán</option>
                <option value="driver">Tài xế</option>
              </select>
            </div>
            <button className="ds-btn ds-btn-outline" onClick={loadData} title="Làm mới">
              <RefreshCw size={15} />
            </button>
          </div>

          <div className="ds-card">
            {loading ? (
              <div className="ds-loading-state">Đang tải danh sách nhân sự...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="ds-empty-state">
                <Users size={48} className="ds-text-muted" />
                <p>Không tìm thấy nhân sự phù hợp.</p>
              </div>
            ) : (
              <div className="ds-table-container">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Nhân viên</th>
                      <th>Thông tin liên hệ</th>
                      <th>Vai trò & Phân quyền</th>
                      <th>Trạng thái</th>
                      <th>Ngày tham gia</th>
                      <th style={{ textAlign: "right" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((staff) => {
                      const roleMeta = roleLabels[staff.role] || {
                        label: staff.role,
                        badge: "badge-gray",
                      };
                      return (
                        <tr key={staff.id}>
                          <td>
                            <div className="ds-user-cell">
                              <div className="ds-avatar-circle">
                                {staff.ho_ten.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{staff.ho_ten}</strong>
                                <small className="ds-text-muted d-block">ID: #{staff.id.slice(0, 8)}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="d-flex align-items-center gap-1">
                                <Mail size={13} className="ds-text-muted" />
                                <span>{staff.email}</span>
                              </div>
                              {staff.so_dien_thoai && (
                                <div className="d-flex align-items-center gap-1 ds-text-muted mt-1">
                                  <Phone size={13} />
                                  <span>{staff.so_dien_thoai}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`ds-badge ${roleMeta.badge}`}>{roleMeta.label}</span>
                          </td>
                          <td>
                            {staff.tinh_trang === 1 ? (
                              <span className="ds-status-badge ds-status-badge-active">
                                <CheckCircle size={13} /> Đang hoạt động
                              </span>
                            ) : (
                              <span className="ds-status-badge ds-status-badge-inactive">
                                <XCircle size={13} /> Đang bị khóa
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="ds-text-muted">
                              {new Date(staff.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {staff.role !== "owner" && (
                              <button
                                className={`ds-btn ds-btn-sm ${staff.tinh_trang === 1 ? "ds-btn-outline-danger" : "ds-btn-outline-success"}`}
                                onClick={() => handleToggleStatus(staff)}
                              >
                                {staff.tinh_trang === 1 ? "Khóa tài khoản" : "Mở khóa"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Audit Logs Tab */
        <div className="ds-card">
          <div className="ds-card-header">
            <h3>Nhật ký thao tác hệ thống (Audit Trail)</h3>
            <span className="ds-text-muted">Theo dõi mọi thay đổi trên hệ thống đảm bảo minh bạch</span>
          </div>
          {loading ? (
            <div className="ds-loading-state">Đang tải lịch sử audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="ds-empty-state">
              <FileText size={48} className="ds-text-muted" />
              <p>Chưa có ghi nhận nhật ký nào.</p>
            </div>
          ) : (
            <div className="ds-table-container">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Tài khoản thực hiện</th>
                    <th>Hành động</th>
                    <th>Đối tượng</th>
                    <th>Địa chỉ IP</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td>
                        <span className="ds-text-muted font-monospace">
                          {new Date(log.created_at).toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td>
                        <strong>{log.admin?.ho_ten || log.admin_name || "Hệ thống"}</strong>
                      </td>
                      <td>
                        <span className="ds-badge badge-blue">{log.action}</span>
                      </td>
                      <td>
                        <code>{log.target_type ? `${log.target_type} #${log.target_id || ""}` : "Hệ thống"}</code>
                      </td>
                      <td>
                        <span className="font-monospace ds-text-muted">{log.ip_address || "127.0.0.1"}</span>
                      </td>
                      <td>
                        <small className="ds-text-muted">{log.description || "-"}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Thêm Nhân Sự Mới */}
      {modalOpen && (
        <div className="ds-modal-overlay">
          <div className="ds-modal-content ds-modal-lg">
            <div className="ds-modal-header">
              <h3>
                <UserPlus size={18} /> Thêm tài khoản nhân sự mới
              </h3>
              <button className="ds-close-btn" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateStaff}>
              <div className="ds-modal-body">
                <div className="ds-form-grid">
                  <div className="ds-form-group">
                    <label>
                      Họ và tên <span className="ds-required">*</span>
                    </label>
                    <div className="ds-input-icon">
                      <User size={16} />
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={formData.ho_ten}
                        onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="ds-form-group">
                    <label>
                      Email đăng nhập <span className="ds-required">*</span>
                    </label>
                    <div className="ds-input-icon">
                      <Mail size={16} />
                      <input
                        type="email"
                        required
                        placeholder="admin@danavago.vn"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="ds-form-group">
                    <label>
                      Mật khẩu khởi tạo <span className="ds-required">*</span>
                    </label>
                    <div className="ds-input-icon">
                      <Lock size={16} />
                      <input
                        type="password"
                        required
                        minLength={12}
                        placeholder="Tối thiểu 12 ký tự"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="ds-form-group">
                    <label>
                      Thuộc nhà xe <span className="ds-required">*</span>
                    </label>
                    <select
                      required
                      value={formData.partner_id}
                      onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                    >
                      {partners.length !== 1 && <option value="">Chọn nhà xe</option>}
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="ds-form-group">
                    <label>
                      Vai trò chính <span className="ds-required">*</span>
                    </label>
                    <div className="ds-input-icon">
                      <ShieldCheck size={16} />
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="sales">Bán vé — bán tại quầy, thu tiền, soát vé</option>
                        <option value="dispatcher">Điều hành — chuyến, xe, tuyến, soát vé</option>
                        <option value="accountant">Kế toán — thu chi, sổ quỹ, báo cáo</option>
                        <option value="driver">Tài xế — soát vé chuyến được phân công</option>
                        <option value="manager">Quản lý — gần như toàn quyền nhà xe</option>
                        <option value="owner">Chủ nhà xe — toàn quyền</option>
                      </select>
                    </div>
                  </div>
                </div>

                <p style={{ margin: "14px 0 0", fontSize: 13, color: "#64748b" }}>
                  Quyền của tài khoản = quyền theo vai trò + nhóm quyền (gán ở tab "Nhóm quyền").
                  Nhân sự đăng nhập tại trang quản lý bằng email và mật khẩu này.
                </p>
              </div>

              <div className="ds-modal-footer">
                <button
                  type="button"
                  className="ds-btn ds-btn-outline"
                  onClick={() => setModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="ds-btn ds-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Đang tạo..." : "Xác nhận tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

