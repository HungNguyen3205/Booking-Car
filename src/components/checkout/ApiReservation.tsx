import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, ShieldCheck, Ticket } from "lucide-react";
import type { Trip } from "../../types";
export function ApiReservation({
  trip,
  seats,
  expires,
  busy,
  onBack,
  onConfirm,
}: {
  trip: Trip;
  seats: string[];
  expires: number;
  busy: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, expires - Date.now()),
  );
  useEffect(() => {
    const timer = setInterval(
      () => setRemaining(Math.max(0, expires - Date.now())),
      1000,
    );
    return () => clearInterval(timer);
  }, [expires]);
  const total = seats.reduce(
    (s, code) => s + (trip.seats.find((x) => x.code === code)?.price || 0),
    0,
  );
  return (
    <section className="max-w-2xl mx-auto px-4 py-10">
      <button
        onClick={onBack}
        disabled={busy}
        className="inline-flex items-center gap-2 mb-6"
      >
        <ArrowLeft size={17} />
        Quay lại thông tin
      </button>
      <div className="bg-white rounded-3xl border border-[#e5e3dc] p-7 shadow-sm">
        <span className="inline-flex items-center gap-2 text-sm text-[#007c85]">
          <Clock3 size={17} />
          Giữ chỗ: {Math.floor(remaining / 60000)}:
          {String(Math.floor(remaining / 1000) % 60).padStart(2, "0")}
        </span>
        <h1 className="text-2xl font-bold mt-4">Xác nhận đặt vé</h1>
        <h2 className="text-xl font-semibold mt-4">
          {trip.from} → {trip.to}
        </h2>
        <p className="mt-2">
          {trip.operator} · {trip.departureTime} · Ghế {seats.join(", ")}
        </p>
        <div className="my-6 p-4 bg-[#f7f4ec] rounded-xl">
          <p className="font-semibold">
            Thanh toán tại quầy / theo hướng dẫn nhà xe
          </p>
          <p className="text-sm mt-2 leading-relaxed">
            Đơn sẽ được lưu trên hệ thống ở trạng thái chưa thu tiền. Nhà xe xác
            nhận khoản tiền thực nhận. Hiện chưa kết nối cổng thanh toán online.
          </p>
        </div>
        <div className="flex justify-between font-bold text-xl mb-6">
          <span>Tổng giá vé</span>
          <span>{total.toLocaleString("vi-VN")}đ</span>
        </div>
        <button
          disabled={busy || remaining <= 0}
          onClick={onConfirm}
          className="w-full rounded-xl bg-[#102744] text-white font-semibold py-4 inline-flex gap-2 justify-center items-center disabled:opacity-50"
        >
          <Ticket size={18} />
          {busy
            ? "Đang xác nhận…"
            : remaining <= 0
              ? "Lượt giữ ghế đã hết hạn"
              : "Xác nhận đặt vé"}
        </button>
        <p className="text-xs text-[#647084] mt-4 inline-flex gap-2">
          <ShieldCheck size={15} />
          Server kiểm tra tồn ghế và giá vé trước khi phát hành đơn.
        </p>
      </div>
    </section>
  );
}
