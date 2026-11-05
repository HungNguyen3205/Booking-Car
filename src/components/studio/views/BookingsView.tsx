import React, { useState, useEffect } from "react";
import {
  Ticket,
  Search,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  X,
} from "lucide-react";
import { adminApi, type TicketBookingItem, type PartnerItem, type BusTripItem } from "../../../services/adminApi";
import { money, formatDate } from "../studioConfig";

export const BookingsView: React.FC = () => {
  const [bookings, setBookings] = useState<TicketBookingItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [trips, setTrips] = useState<BusTripItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [detailBooking, setDetailBooking] = useState<TicketBookingItem | null>(null);
  const [paymentModal, setPaymentModal] = useState<TicketBookingItem | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("vnpay");
  const [paymentRef, setPaymentRef] = useState("");
  const [msg, setMsg] = useState("");

  // New Booking Form
  const [newBooking, setNewBooking] = useState({
    partner_id: "",
    trip_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    seats: "VIP-01",
    total_amount: 260000,
    payment_status: "paid" as const,
    payment_method: "vnpay",
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedPartner) params.partner_id = selectedPartner;
      if (travelDate) params.travel_date = travelDate;
      if (paymentStatus) params.payment_status = paymentStatus;
      if (bookingStatus) params.status = bookingStatus;
      if (searchTerm) params.search = searchTerm;

      const [resBookings, resPartners, resTrips] = await Promise.all([
        adminApi.getBookings(params),
        adminApi.getPartners(),
        adminApi.getTrips(),
      ]);

      if (resBookings.data?.data) {
        setBookings(resBookings.data.data);
      }
      if (resPartners.data) {
        setPartners(resPartners.data);
      }
      if (resTrips.data?.data) {
        setTrips(resTrips.data.data);
      }
    } catch (e: any) {
      console.error("Error loading bookings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPartner, travelDate, paymentStatus, bookingStatus]);

  const handleConfirmPayment = async () => {
    if (!paymentModal) return;
    try {
      await adminApi.confirmPayment(paymentModal.id, {
        method: paymentMethod,
        reference_code: paymentRef || undefined,
      });
      setMsg("Đã xác nhận thanh toán thành công!");
      setPaymentModal(null);
      loadData();
    } catch (err: any) {
      alert("Lỗi xác nhận thanh toán: " + err.message);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn vé này?")) return;
    try {
      await adminApi.cancelBooking(id);
      setMsg("Đã hủy đơn vé!");
      loadData();
    } catch (err: any) {
      alert("Lỗi hủy vé: " + err.message);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const seatsArr = newBooking.seats.split(",").map((s) => s.trim()).filter(Boolean);
      await adminApi.createBooking({
        partner_id: newBooking.partner_id || (partners[0]?.id ?? ""),
        trip_id: newBooking.trip_id || (trips[0]?.id ?? ""),
        customer_name: newBooking.customer_name,
        customer_phone: newBooking.customer_phone,
        customer_email: newBooking.customer_email || undefined,
        seats: seatsArr.length ? seatsArr : ["A01"],
        seat_count: seatsArr.length || 1,
        total_amount: Number(newBooking.total_amount),
        final_amount: Number(newBooking.total_amount),
        payment_status: newBooking.payment_status,
        booking_status: "confirmed",
        payment_method: newBooking.payment_method,
        notes: newBooking.notes,
      });
      setMsg("Tạo đơn vé thành công!");
      setCreateModal(false);
      loadData();
    } catch (err: any) {
      alert("Lỗi tạo vé: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải đơn vé...</div>}
      {msg && (
        <div className="ds-toast" style={{ marginBottom: 12 }}>
          {msg}
          <button onClick={() => setMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* Bộ lọc thanh toolbar chuẩn UI/UX */}
      <div className="ds-filter-bar">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", flex: 1 }}>
          {/* Lọc Nhà xe */}
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="ds-filter-select"
            style={{ minWidth: 170 }}
          >
            <option value="">Tất cả nhà xe</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Lọc Ngày đi */}
          <div className="ds-filter-date-wrap">
            <Calendar size={15} color="#f2730e" />
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
            />
            {travelDate && (
              <button
                type="button"
                onClick={() => setTravelDate("")}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#888", display: "flex", alignItems: "center" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Lọc Thanh toán */}
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="ds-filter-select"
            style={{ minWidth: 165 }}
          >
            <option value="">Tất cả TT thanh toán</option>
            <option value="paid">Đã thu đủ</option>
            <option value="unpaid">Chưa thu tiền</option>
            <option value="refunded">Đã hoàn tiền</option>
          </select>

          {/* Lọc Trạng thái vé */}
          <select
            value={bookingStatus}
            onChange={(e) => setBookingStatus(e.target.value)}
            className="ds-filter-select"
            style={{ minWidth: 165 }}
          >
            <option value="">Tất cả trạng thái vé</option>
            <option value="confirmed">Đã đặt chỗ</option>
            <option value="checked_in">Đã lên xe</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          {/* Tìm kiếm */}
          <div className="ds-search-input" style={{ maxWidth: 240, minWidth: 180, minHeight: 42 }}>
            <Search size={15} color="#f2730e" />
            <input
              type="text"
              placeholder="Mã vé / Khách / SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadData()}
            />
          </div>

          <button
            onClick={loadData}
            className="ds-btn ds-btn-outline"
            style={{ minHeight: 42, borderRadius: 12 }}
          >
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>

        <button
          onClick={() => setCreateModal(true)}
          className="ds-btn ds-btn-primary"
          style={{ minHeight: 42, borderRadius: 12 }}
        >
          <Plus size={16} /> Bán vé tại quầy
        </button>
      </div>

      {/* Bảng danh sách đơn vé */}
      <div className="ds-panel ds-table-responsive" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 840 }}>
            <thead>
              <tr style={{ background: "#f8fafd", borderBottom: "1px solid #e2eaf4" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Mã vé</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Hành khách</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Nhà xe & Tuyến</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Khởi hành</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Ghế ngồi</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Tổng tiền</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Thanh toán</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Trạng thái</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#6c809c" }}>
                    <Ticket size={32} style={{ margin: "0 auto 8px", display: "block", color: "#a5b4fc" }} />
                    Không tìm thấy đơn vé nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #edf2f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1e3a8a" }}>
                      {b.booking_code}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <strong style={{ display: "block", color: "#102744" }}>{b.customer_name}</strong>
                      <span style={{ color: "#6c809c", fontSize: 12 }}>{b.customer_phone}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontWeight: 600, color: "#2563eb", display: "block" }}>
                        {b.partner?.name || "DANAVA Go"}
                      </span>
                      <span style={{ fontSize: 12, color: "#476381" }}>
                        {b.trip?.route?.name || "Tuyến cố định"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12 }}>
                      {b.trip?.depart_time ? formatDate(b.trip.depart_time) : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                        {(b.seats || []).map((s) => (
                          <span key={s} style={{ background: "#eef5ff", color: "#1765e8", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#102744" }}>
                      {money(b.final_amount)}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span className={`ds-badge ${b.payment_status === "paid" ? "paid" : "unpaid"}`} style={{ fontSize: 11 }}>
                        {b.payment_status === "paid" ? "Đã thu đủ" : b.payment_status === "refunded" ? "Đã hoàn" : "Chưa thu"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span className={`ds-badge ${b.booking_status}`} style={{ fontSize: 11 }}>
                        {b.booking_status === "confirmed" ? "Đã đặt" : b.booking_status === "checked_in" ? "Đã lên xe" : b.booking_status === "completed" ? "Hoàn tất" : b.booking_status === "cancelled" ? "Đã hủy" : "Chờ xử lý"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          onClick={() => setDetailBooking(b)}
                          title="Xem chi tiết vé"
                          style={{ border: "1px solid #dce5ef", background: "#fff", padding: "4px 8px", borderRadius: 6, cursor: "pointer", color: "#1765e8" }}
                        >
                          <Eye size={14} />
                        </button>
                        {b.payment_status !== "paid" && b.booking_status !== "cancelled" && (
                          <button
                            onClick={() => {
                              setPaymentModal(b);
                              setPaymentRef("TXN-" + b.booking_code);
                            }}
                            title="Xác nhận thanh toán"
                            style={{ border: "1px solid #16825d", background: "#e6f7ed", color: "#16825d", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {b.booking_status !== "cancelled" && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            title="Hủy vé"
                            style={{ border: "1px solid #fecaca", background: "#ffecef", color: "#b91c1c", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi tiết vé */}
      {detailBooking && (
        <div className="ds-modal-backdrop" onClick={() => setDetailBooking(null)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <header>
              <h2>Chi tiết vé #{detailBooking.booking_code}</h2>
              <button onClick={() => setDetailBooking(null)}><X size={20} /></button>
            </header>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <small style={{ color: "#6c809c" }}>Hành khách:</small>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{detailBooking.customer_name}</div>
                  <div style={{ color: "#1765e8", fontSize: 13 }}>{detailBooking.customer_phone}</div>
                </div>
                <div>
                  <small style={{ color: "#6c809c" }}>Nhà xe vận tải:</small>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{detailBooking.partner?.name || "DANAVA Go"}</div>
                </div>
                <div>
                  <small style={{ color: "#6c809c" }}>Tuyến đường:</small>
                  <div style={{ fontWeight: 600 }}>{detailBooking.trip?.route?.name || "Tuyến đường"}</div>
                </div>
                <div>
                  <small style={{ color: "#6c809c" }}>Giờ xuất bến:</small>
                  <div style={{ fontWeight: 600 }}>{detailBooking.trip?.depart_time ? formatDate(detailBooking.trip.depart_time) : "—"}</div>
                </div>
                <div>
                  <small style={{ color: "#6c809c" }}>Ghế ngồi đã đặt:</small>
                  <div style={{ fontWeight: 700, color: "#1765e8" }}>{(detailBooking.seats || []).join(", ")}</div>
                </div>
                <div>
                  <small style={{ color: "#6c809c" }}>Tổng tiền thanh toán:</small>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#16825d" }}>{money(detailBooking.final_amount)}</div>
                </div>
              </div>

              {detailBooking.notes && (
                <div style={{ background: "#f8fafd", padding: 12, borderRadius: 8, border: "1px solid #e2eaf4" }}>
                  <small style={{ color: "#6c809c", display: "block" }}>Ghi chú hành khách:</small>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{detailBooking.notes}</div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button className="ds-secondary" onClick={() => setDetailBooking(null)} style={{ padding: "8px 16px" }}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận thanh toán */}
      {paymentModal && (
        <div className="ds-modal-backdrop" onClick={() => setPaymentModal(null)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <header>
              <h2>Xác nhận thanh toán vé #{paymentModal.booking_code}</h2>
              <button onClick={() => setPaymentModal(null)}><X size={20} /></button>
            </header>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Số tiền thu:</label>
                <input
                  type="text"
                  readOnly
                  value={money(paymentModal.final_amount)}
                  style={{ width: "100%", padding: "10px 12px", fontWeight: 700, background: "#f2f7ff" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Cổng / Phương thức thanh toán:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8 }}
                >
                  <option value="vnpay">Cổng thanh toán VNPAY QR</option>
                  <option value="momo">Ví điện tử MoMo</option>
                  <option value="bank_transfer">Chuyển khoản VietQR ngân hàng</option>
                  <option value="cash">Tiền mặt tại quầy / trên xe</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Mã giao dịch / Mã tham chiếu ngân hàng:</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="VD: VCB1029384 hoặc VNP88421"
                  style={{ width: "100%", padding: "10px 12px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button className="ds-secondary" onClick={() => setPaymentModal(null)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button className="ds-primary" onClick={handleConfirmPayment} style={{ padding: "8px 20px" }}>Xác nhận thu tiền</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bán vé tại quầy */}
      {createModal && (
        <div className="ds-modal-backdrop" onClick={() => setCreateModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <header>
              <h2>Tạo đơn vé mới (Bán vé tại quầy)</h2>
              <button onClick={() => setCreateModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleCreateBooking} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="ds-form-grid-2">
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Nhà xe vận chuyển:</label>
                  <select
                    value={newBooking.partner_id}
                    onChange={(e) => setNewBooking({ ...newBooking, partner_id: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="">Chọn nhà xe</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Chuyến chạy:</label>
                  <select
                    value={newBooking.trip_id}
                    onChange={(e) => setNewBooking({ ...newBooking, trip_id: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="">Chọn chuyến chạy</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.route?.name} ({t.depart_time ? formatDate(t.depart_time) : ""})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ds-form-grid-2">
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Họ tên hành khách:</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={newBooking.customer_name}
                    onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Số điện thoại:</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912..."
                    value={newBooking.customer_phone}
                    onChange={(e) => setNewBooking({ ...newBooking, customer_phone: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div className="ds-form-grid-2">
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Mã ghế (ngăn cách bằng dấu phẩy):</label>
                  <input
                    type="text"
                    required
                    placeholder="VIP-01, VIP-02"
                    value={newBooking.seats}
                    onChange={(e) => setNewBooking({ ...newBooking, seats: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Tổng tiền vé (đ):</label>
                  <input
                    type="number"
                    required
                    value={newBooking.total_amount}
                    onChange={(e) => setNewBooking({ ...newBooking, total_amount: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div className="ds-form-grid-2">
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Trạng thái thanh toán:</label>
                  <select
                    value={newBooking.payment_status}
                    onChange={(e) => setNewBooking({ ...newBooking, payment_status: e.target.value as any })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="paid">Đã thu đủ</option>
                    <option value="unpaid">Chưa thu tiền</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Phương thức thanh toán:</label>
                  <select
                    value={newBooking.payment_method}
                    onChange={(e) => setNewBooking({ ...newBooking, payment_method: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="vnpay">VNPAY</option>
                    <option value="momo">MoMo</option>
                    <option value="bank_transfer">Chuyển khoản</option>
                    <option value="cash">Tiền mặt</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Ghi chú đón / trả tận nơi:</label>
                <textarea
                  rows={2}
                  placeholder="Điểm đón cụ thể hoặc yêu cầu ghế..."
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button type="button" className="ds-secondary" onClick={() => setCreateModal(false)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button type="submit" className="ds-primary" style={{ padding: "8px 22px" }}>Tạo vé</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default BookingsView;

