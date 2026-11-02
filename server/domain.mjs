import {
  all,
  one,
  run,
  id,
  now,
  record,
  transaction,
  audit,
  notify,
  expireHolds,
} from "./database.mjs";
import {
  requireThat,
  text,
  integer,
  phone,
  email,
  hashToken,
} from "./security.mjs";
export const kinds = [
  "vehicles",
  "routes",
  "drivers",
  "branches",
  "agencies",
  "promotions",
  "shifts",
];
export const dayVN = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );
export function dateValid(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value
  );
}
export function resource(tenantId, kind, rid) {
  const r = record(
    one(
      "SELECT * FROM records WHERE tenant_id=? AND kind=? AND id=?",
      tenantId,
      kind,
      rid,
    ),
  );
  requireThat(r, 404, "Không tìm thấy dữ liệu trong nhà xe này");
  return r;
}
function safeImage(value) {
  if (!value) return "";
  requireThat(
    typeof value === "string" &&
      value.length <= 500 &&
      (/^\/assets\/[\w/.-]+$/.test(value) ||
        /^\/uploads\/[\w.-]+$/.test(value) ||
        /^https:\/\/[^\s]+$/.test(value)),
    422,
    "Ảnh phải là URL HTTPS hoặc ảnh đã tải lên",
  );
  return value;
}
export function validateRecord(tenantId, kind, body) {
  const name = text(body.name, "Tên", 150);
  let out = { name };
  if (kind === "vehicles") {
    const category = body.category || "limousine";
    requireThat(
      ["sleeper", "limousine", "cabin"].includes(category),
      422,
      "Loại xe không hợp lệ",
    );
    const capacity = integer(Number(body.capacity), "Số chỗ", 1, 60),
      floors =
        category === "limousine"
          ? 1
          : integer(Number(body.floors || 2), "Số tầng", 1, 2);
    const codes = Array.isArray(body.seatCodes) ? body.seatCodes : [];
    requireThat(
      codes.length === 0 ||
        (codes.length === capacity &&
          new Set(codes).size === capacity &&
          codes.every(
            (s) => typeof s === "string" && /^[A-Z0-9-]{1,8}$/.test(s),
          )),
      422,
      "Mã ghế phải duy nhất và đủ số chỗ",
    );
    out = {
      ...out,
      category,
      capacity,
      floors,
      plate: text(body.plate, "Biển số", 30).toUpperCase(),
      image: safeImage(body.image),
      amenities: Array.isArray(body.amenities)
        ? body.amenities.map((v) => text(v, "Tiện ích", 80)).slice(0, 20)
        : ["Điều hòa", "USB"],
      description: String(body.description || "").slice(0, 1500),
      seatCodes: codes.length
        ? codes
        : Array.from(
            { length: capacity },
            (_, i) =>
              `${i < Math.ceil(capacity / floors) ? "A" : "B"}${(i % Math.ceil(capacity / floors)) + 1}`,
          ),
      maintenance: !!body.maintenance,
      inspectionDate: body.inspectionDate || "",
    };
    if (out.inspectionDate)
      requireThat(
        dateValid(out.inspectionDate),
        422,
        "Ngày đăng kiểm không hợp lệ",
      );
  } else if (kind === "routes") {
    const from = text(body.from, "Điểm đi", 100),
      to = text(body.to, "Điểm đến", 100);
    requireThat(from !== to, 422, "Điểm đi và đến phải khác nhau");
    const duration = integer(
      Number(body.durationMinutes),
      "Thời lượng",
      10,
      2880,
    );
    const stops = (value, label) => {
      requireThat(
        Array.isArray(value) && value.length > 0 && value.length <= 30,
        422,
        `Cần ít nhất một ${label}`,
      );
      return value.map((s, i) => ({
        id:
          typeof s.id === "string" && /^[\w-]+$/.test(s.id)
            ? s.id
            : `${label}-${i}`,
        name: text(s.name, "Tên điểm", 150),
        address: text(s.address, "Địa chỉ", 300),
        offset: integer(Number(s.offset || 0), "Phút dừng", 0, duration),
      }));
    };
    out = {
      ...out,
      from,
      to,
      durationMinutes: duration,
      pickups: stops(body.pickups, "pickup"),
      dropoffs: stops(body.dropoffs, "dropoff"),
    };
  } else if (kind === "drivers") {
    out = {
      ...out,
      phone: phone(body.phone),
      license: text(body.license, "Hạng giấy phép", 30),
      licenseExpiry: body.licenseExpiry || "",
      active: body.active !== false,
    };
    if (out.licenseExpiry)
      requireThat(
        dateValid(out.licenseExpiry),
        422,
        "Hạn giấy phép không hợp lệ",
      );
  } else if (kind === "branches") {
    out = {
      ...out,
      address: text(body.address, "Địa chỉ", 300),
      phone: phone(body.phone),
    };
  } else if (kind === "agencies") {
    out = {
      ...out,
      phone: phone(body.phone),
      commissionBps: integer(
        Number(body.commissionBps || 0),
        "Hoa hồng (basis points)",
        0,
        5000,
      ),
      creditLimit: integer(
        Number(body.creditLimit || 0),
        "Hạn mức công nợ",
        0,
        1e10,
      ),
      active: body.active !== false,
    };
  } else if (kind === "promotions") {
    const code = text(body.code, "Mã ưu đãi", 30).toUpperCase();
    requireThat(/^[A-Z0-9_-]{3,30}$/.test(code), 422, "Mã ưu đãi không hợp lệ");
    requireThat(
      ["fixed", "percent"].includes(body.discountType),
      422,
      "Kiểu giảm giá không hợp lệ",
    );
    requireThat(
      dateValid(body.starts) &&
        dateValid(body.ends) &&
        body.ends >= body.starts,
      422,
      "Khoảng ngày ưu đãi không hợp lệ",
    );
    out = {
      ...out,
      code,
      discountType: body.discountType,
      value: integer(
        Number(body.value),
        "Mức giảm",
        1,
        body.discountType === "percent" ? 100 : 1e8,
      ),
      limit: integer(Number(body.limit || 100), "Giới hạn lượt", 1, 100000),
      starts: body.starts,
      ends: body.ends,
      routeId: body.routeId || "",
      active: body.active !== false,
    };
    if (out.routeId) resource(tenantId, "routes", out.routeId);
  } else if (kind === "shifts") {
    resource(tenantId, "drivers", body.driverId);
    requireThat(dateValid(body.date), 422, "Ngày trực không hợp lệ");
    out = {
      ...out,
      driverId: body.driverId,
      date: body.date,
      note: String(body.note || "").slice(0, 500),
      allowance: integer(Number(body.allowance || 0), "Phụ cấp", 0, 1e8),
      checkedIn: !!body.checkedIn,
    };
  }
  return out;
}
export function saveRecord(tenantId, kind, body, actor, rid) {
  requireThat(kinds.includes(kind), 404, "Danh mục không tồn tại");
  const data = validateRecord(tenantId, kind, body);
  return transaction(() => {
    if (["vehicles", "promotions"].includes(kind)) {
      const key = kind === "vehicles" ? "plate" : "code";
      requireThat(
        !all(
          "SELECT * FROM records WHERE tenant_id=? AND kind=? AND id!=?",
          tenantId,
          kind,
          rid || "",
        )
          .map(record)
          .some((r) => r[key] === data[key]),
        409,
        kind === "vehicles"
          ? "Biển số đã tồn tại trong nhà xe"
          : "Mã ưu đãi đã tồn tại",
      );
    }
    if (rid) {
      resource(tenantId, kind, rid);
      if (kind === "vehicles") {
        const active = one(
          "SELECT id FROM trips WHERE tenant_id=? AND vehicle_id=? AND status NOT IN ('cancelled','completed') AND end_at>?",
          tenantId,
          rid,
          now(),
        );
        const previous = resource(tenantId, kind, rid);
        const layoutChanged = [
          "category",
          "capacity",
          "floors",
          "plate",
          "seatCodes",
        ].some((k) => JSON.stringify(previous[k]) !== JSON.stringify(data[k]));
        requireThat(
          !active || !layoutChanged,
          409,
          "Xe có lịch chạy: chỉ được sửa ảnh/mô tả, không đổi biển số hay sơ đồ ghế.",
        );
        if (data.maintenance)
          requireThat(
            !one(
              "SELECT id FROM trips WHERE tenant_id=? AND vehicle_id=? AND status='published' AND end_at>?",
              tenantId,
              rid,
              now(),
            ),
            409,
            "Đóng bán các chuyến trước khi đưa xe vào bảo dưỡng.",
          );
      }
      run(
        "UPDATE records SET data=? WHERE tenant_id=? AND id=?",
        JSON.stringify(data),
        tenantId,
        rid,
      );
    } else {
      rid = id();
      run(
        "INSERT INTO records VALUES(?,?,?,?,?)",
        rid,
        tenantId,
        kind,
        JSON.stringify(data),
        now(),
      );
    }
    audit(actor, tenantId, `${kind}.${body.id ? "update" : "save"}`, rid);
    return resource(tenantId, kind, rid);
  });
}
export function tenant(idValue) {
  const row = one("SELECT * FROM tenants WHERE id=?", idValue);
  requireThat(row, 404, "Nhà xe không tồn tại");
  return {
    ...JSON.parse(row.data),
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
  };
}
export function tripRow(tenantId, tripId) {
  const row = one(
    "SELECT * FROM trips WHERE id=? AND tenant_id=?",
    tripId,
    tenantId,
  );
  requireThat(row, 404, "Chuyến không thuộc nhà xe này");
  return row;
}
export function buildTrip(row) {
  expireHolds();
  const data = JSON.parse(row.data),
    t = tenant(row.tenant_id),
    v = data.vehicle,
    r = data.route;
  const currentVehicle = resource(row.tenant_id, "vehicles", row.vehicle_id);
  Object.assign(v, {
    image: currentVehicle.image,
    name: currentVehicle.name,
    amenities: currentVehicle.amenities,
    description: currentVehicle.description,
  });
  const occupied = all(
      "SELECT seat FROM inventory WHERE trip_id=?",
      row.id,
    ).map((s) => s.seat),
    blocked = data.blockedSeats || [];
  const dateTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const seats = v.seatCodes.map((code, i) => ({
    id: `${row.id}-${code}`,
    code,
    floor: i < Math.ceil(v.capacity / v.floors) ? 1 : 2,
    row: Math.floor((i % Math.ceil(v.capacity / v.floors)) / 3) + 1,
    col: ((i % Math.ceil(v.capacity / v.floors)) % 3) + 1,
    type:
      v.category === "limousine"
        ? "seat"
        : v.category === "cabin"
          ? "cabin"
          : "sleeper",
    status: blocked.includes(code)
      ? "disabled"
      : occupied.includes(code)
        ? "booked"
        : "available",
    price: data.price,
  }));
  const stop = (s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    time: dateTime.format(
      new Date(Date.parse(row.depart_at) + s.offset * 60000),
    ),
  });
  return {
    id: row.id,
    tenantId: row.tenant_id,
    code: data.code,
    operator: t.name,
    vehicle: {
      id: row.vehicle_id,
      name: v.name,
      category: v.category,
      categoryLabel: {
        sleeper: "Giường nằm",
        limousine: "Limousine",
        cabin: "Cabin VIP",
      }[v.category],
      seatsTotal: v.capacity,
      floors: v.floors,
      image: v.image || "/assets/images/bus_limousine_vip.png",
      amenities: v.amenities,
      description: v.description || "",
      rating: 0,
    },
    from: r.from,
    to: r.to,
    departureTime: dateTime.format(new Date(row.depart_at)),
    arrivalTime: dateTime.format(new Date(row.end_at)),
    duration: `${Math.floor(r.durationMinutes / 60)}h${r.durationMinutes % 60}m`,
    nextDay:
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
        new Date(row.depart_at),
      ) !==
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
        new Date(row.end_at),
      ),
    departureLocation: r.pickups[0],
    arrivalLocation: r.dropoffs[0],
    price: data.price,
    availableSeatsCount: seats.filter((s) => s.status === "available").length,
    departureStops: r.pickups.map((s) => stop(s)),
    dropoffStops: r.dropoffs.map((s) => stop(s)),
    seats,
    date: data.date,
    status: row.status,
    driverId: row.driver_id,
    branchId: data.branchId || "",
    vehicleId: row.vehicle_id,
    routeId: row.route_id,
    departAt: row.depart_at,
    endAt: row.end_at,
    blockedSeats: blocked,
    plate: v.plate,
  };
}
export function saveTrip(tenantId, body, actor, tripId) {
  const v = resource(tenantId, "vehicles", body.vehicleId),
    r = resource(tenantId, "routes", body.routeId);
  const date = text(body.date, "Ngày chạy");
  requireThat(
    dateValid(date) && date >= dayVN(),
    422,
    "Ngày chạy không hợp lệ hoặc đã qua",
  );
  requireThat(
    /^([01]\d|2[0-3]):[0-5]\d$/.test(body.time),
    422,
    "Giờ chạy không hợp lệ",
  );
  const start = new Date(`${date}T${body.time}:00+07:00`).toISOString(),
    end = new Date(Date.parse(start) + r.durationMinutes * 60000).toISOString();
  requireThat(start > now(), 422, "Giờ khởi hành đã qua");
  requireThat(
    !v.maintenance && (!v.inspectionDate || v.inspectionDate >= date),
    422,
    "Xe đang bảo dưỡng hoặc hết hạn đăng kiểm",
  );
  if (body.driverId) {
    const d = resource(tenantId, "drivers", body.driverId);
    requireThat(
      d.active && (!d.licenseExpiry || d.licenseExpiry >= date),
      422,
      "Tài xế ngừng hoạt động hoặc giấy phép hết hạn",
    );
  }
  if (body.branchId) resource(tenantId, "branches", body.branchId);
  const price = integer(Number(body.price), "Giá vé", 1000, 1e8),
    blockedSeats = Array.isArray(body.blockedSeats) ? body.blockedSeats : [];
  requireThat(
    blockedSeats.every((s) => v.seatCodes.includes(s)),
    422,
    "Ghế khóa không tồn tại",
  );
  return transaction(() => {
    if (tripId) {
      const previous = tripRow(tenantId, tripId);
      requireThat(
        !one(
          "SELECT id FROM bookings WHERE trip_id=? AND status!=?",
          tripId,
          "cancelled",
        ),
        409,
        "Chuyến đã có khách: dùng đổi/hủy vé trước khi sửa lịch hoặc xe",
      );
      requireThat(
        !one(
          "SELECT id FROM holds WHERE trip_id=? AND expires>?",
          tripId,
          Date.now(),
        ),
        409,
        "Có khách đang giữ ghế",
      );
      requireThat(
        ["draft", "pending", "closed"].includes(previous.status),
        409,
        "Đóng bán chuyến trước khi chỉnh sửa",
      );
    }
    const conflict = one(
      "SELECT id FROM trips WHERE tenant_id=? AND id!=? AND status NOT IN ('cancelled','completed') AND depart_at<? AND end_at>? AND (vehicle_id=? OR (? IS NOT NULL AND driver_id=?))",
      tenantId,
      tripId || "",
      end,
      start,
      body.vehicleId,
      body.driverId || null,
      body.driverId || null,
    );
    requireThat(!conflict, 409, "Xe hoặc tài xế bị trùng lịch chạy");
    const rid = tripId || id(),
      data = {
        code: body.code
          ? text(body.code, "Mã chuyến", 40)
          : "DG-" + rid.slice(0, 6).toUpperCase(),
        date,
        price,
        vehicle: v,
        route: r,
        branchId: body.branchId || "",
        blockedSeats,
      };
    if (tripId)
      run(
        "UPDATE trips SET vehicle_id=?,driver_id=?,route_id=?,depart_at=?,end_at=?,data=? WHERE id=?",
        v.id,
        body.driverId || null,
        r.id,
        start,
        end,
        JSON.stringify(data),
        rid,
      );
    else
      run(
        "INSERT INTO trips VALUES(?,?,?,?,?,?,?,?,?,?)",
        rid,
        tenantId,
        v.id,
        body.driverId || null,
        r.id,
        start,
        end,
        "draft",
        JSON.stringify(data),
        now(),
      );
    audit(actor, tenantId, "trips.save", rid);
    return buildTrip(tripRow(tenantId, rid));
  });
}
export function tripStatus(tenantId, tripId, status, actor) {
  requireThat(
    [
      "draft",
      "pending",
      "published",
      "closed",
      "cancelled",
      "completed",
    ].includes(status),
    422,
    "Trạng thái không hợp lệ",
  );
  return transaction(() => {
    const row = tripRow(tenantId, tripId);
    requireThat(
      !["cancelled", "completed"].includes(row.status),
      409,
      "Chuyến đã kết thúc",
    );
    if (status === "published") {
      requireThat(
        actor.role === "platform" || tenant(tenantId).autoPublish === true,
        403,
        "Chuyến cần nền tảng duyệt trước khi mở bán",
      );
      requireThat(
        row.depart_at > now(),
        422,
        "Không mở bán chuyến đã khởi hành",
      );
      const v = resource(tenantId, "vehicles", row.vehicle_id);
      requireThat(
        !v.maintenance &&
          (!v.inspectionDate || v.inspectionDate >= JSON.parse(row.data).date),
        422,
        "Xe đang bảo dưỡng hoặc hết hạn đăng kiểm",
      );
      if (row.driver_id) {
        const d = resource(tenantId, "drivers", row.driver_id);
        requireThat(
          d.active &&
            (!d.licenseExpiry || d.licenseExpiry >= JSON.parse(row.data).date),
          422,
          "Tài xế không khả dụng hoặc hết hạn giấy phép",
        );
      }
    }
    if (status === "completed")
      requireThat(row.end_at <= now(), 422, "Chưa đến giờ kết thúc chuyến");
    if (status === "cancelled") {
      for (const b of all(
        "SELECT * FROM bookings WHERE trip_id=? AND status!='cancelled'",
        tripId,
      )) {
        run(
          "UPDATE bookings SET status='cancelled',payment_status=CASE WHEN (SELECT coalesce(sum(CASE WHEN kind='collection' THEN amount ELSE -amount END),0) FROM ledger WHERE booking_id=bookings.id AND kind!='expense')>0 THEN 'refund_due' ELSE payment_status END WHERE id=?",
          b.id,
        );
      }
      run("DELETE FROM inventory WHERE trip_id=?", tripId);
      run("DELETE FROM holds WHERE trip_id=?", tripId);
      notify(
        tenantId,
        "Chuyến bị hủy: kiểm tra khách cần thông báo và tiền cần hoàn.",
      );
    }
    run("UPDATE trips SET status=? WHERE id=?", status, tripId);
    audit(actor, tenantId, "trips.status", tripId, { status });
    return buildTrip(tripRow(tenantId, tripId));
  });
}
function seatSelection(row, codes) {
  requireThat(
    Array.isArray(codes) &&
      codes.length > 0 &&
      codes.length <= 5 &&
      new Set(codes).size === codes.length,
    422,
    "Chọn 1–5 ghế khác nhau",
  );
  const trip = buildTrip(row);
  requireThat(
    codes.every((c) =>
      trip.seats.some((s) => s.code === c && s.status === "available"),
    ),
    409,
    "Ghế vừa được giữ/đặt hoặc không khả dụng",
  );
  return trip;
}
export function createHold(tripId, codes, token) {
  return transaction(() => {
    expireHolds();
    const row = one(
      "SELECT trips.* FROM trips JOIN tenants ON tenants.id=trips.tenant_id WHERE trips.id=? AND trips.status='published' AND tenants.status='active'",
      tripId,
    );
    requireThat(
      row && row.depart_at > now(),
      404,
      "Chuyến chưa mở bán hoặc đã khởi hành",
    );
    requireThat(
      one(
        "SELECT count(*) AS n FROM holds WHERE token=? AND expires>?",
        hashToken(token),
        Date.now(),
      ).n < 2,
      429,
      "Bạn đang giữ chỗ ở hai chuyến. Hoàn tất hoặc bỏ lượt giữ cũ trước.",
    );
    const liveVehicle = resource(row.tenant_id, "vehicles", row.vehicle_id);
    requireThat(!liveVehicle.maintenance, 409, "Xe đang bảo dưỡng");
    seatSelection(row, codes);
    const holdId = id(),
      expires = Date.now() + 8 * 60000;
    run(
      "INSERT INTO holds VALUES(?,?,?,?,?,?)",
      holdId,
      row.tenant_id,
      tripId,
      hashToken(token),
      expires,
      JSON.stringify(codes),
    );
    for (const c of codes)
      run("INSERT INTO inventory VALUES(?,?,?,NULL)", tripId, c, holdId);
    return { id: holdId, expires };
  });
}
export function bookingView(row) {
  const data = JSON.parse(row.data);
  return {
    ...data,
    id: row.id,
    tenantId: row.tenant_id,
    tripId: row.trip_id,
    status: row.status,
    paymentStatus: row.payment_status,
    source: row.source,
    createdAt: row.created_at,
  };
}
export function createBooking(body, actor, tenantId, token, idempotency) {
  requireThat(
    typeof idempotency === "string" && /^[\w-]{10,100}$/.test(idempotency),
    422,
    "Cần khóa chống gửi trùng",
  );
  return transaction(() => {
    expireHolds();
    const existing = one(
      "SELECT booking_id FROM idempotency WHERE key=?",
      hashToken(idempotency + token),
    );
    if (existing) {
      const prior = bookingView(
        one("SELECT * FROM bookings WHERE id=?", existing.booking_id),
      );
      requireThat(
        (!tenantId || prior.tenantId === tenantId) &&
          prior.tripId === body.tripId &&
          JSON.stringify(prior.selectedSeats) === JSON.stringify(body.seats) &&
          prior.passenger.phone === phone(body.passenger?.phone),
        409,
        "Khóa đặt vé đã được sử dụng cho yêu cầu khác",
      );
      return prior;
    }
    const row = one("SELECT * FROM trips WHERE id=?", body.tripId);
    requireThat(
      row && (!tenantId || row.tenant_id === tenantId),
      404,
      "Chuyến không thuộc nhà xe này",
    );
    requireThat(
      tenant(row.tenant_id).status === "active",
      409,
      "Nhà xe tạm ngừng",
    );
    requireThat(
      row.status === "published" && row.depart_at > now(),
      409,
      "Chuyến đã đóng bán",
    );
    let trip;
    if (body.holdId) {
      const hold = one(
        "SELECT * FROM holds WHERE id=? AND trip_id=? AND token=? AND expires>?",
        body.holdId,
        row.id,
        hashToken(token),
        Date.now(),
      );
      requireThat(hold, 409, "Thời gian giữ ghế đã hết");
      const held = JSON.parse(hold.data);
      requireThat(
        Array.isArray(body.seats) &&
          held.length === body.seats.length &&
          held.every((c) => body.seats.includes(c)),
        422,
        "Ghế khác với lượt giữ chỗ",
      );
      trip = buildTrip(row);
    } else {
      requireThat(actor, 422, "Vui lòng giữ ghế trước");
      trip = seatSelection(row, body.seats);
    }
    const p = body.passenger || {},
      passenger = {
        fullName: text(p.fullName, "Họ tên", 100),
        phone: phone(p.phone),
        email: p.email ? email(p.email) : "",
        pickupStopId: text(p.pickupStopId, "Điểm đón", 80),
        dropoffStopId: text(p.dropoffStopId, "Điểm trả", 80),
        note: String(p.note || "").slice(0, 1000),
        agreedTerms: p.agreedTerms === true,
      };
    requireThat(passenger.agreedTerms, 422, "Cần đồng ý chính sách đặt vé");
    requireThat(
      trip.departureStops.some((s) => s.id === passenger.pickupStopId) &&
        trip.dropoffStops.some((s) => s.id === passenger.dropoffStopId),
      422,
      "Điểm đón/trả không thuộc chuyến",
    );
    const routeSnapshot = JSON.parse(row.data).route;
    const picked = routeSnapshot.pickups.find(
        (s) => s.id === passenger.pickupStopId,
      ),
      dropped = routeSnapshot.dropoffs.find(
        (s) => s.id === passenger.dropoffStopId,
      );
    requireThat(
      dropped.offset > picked.offset,
      422,
      "Điểm trả phải sau điểm đón trên hành trình",
    );
    let amount = body.seats.reduce(
        (sum, c) => sum + trip.seats.find((s) => s.code === c).price,
        0,
      ),
      discount = 0,
      promo = "";
    if (body.promoCode) {
      const promotions = all(
        "SELECT * FROM records WHERE tenant_id=? AND kind='promotions'",
        row.tenant_id,
      ).map(record);
      const found = promotions.find(
        (p) => p.code === String(body.promoCode).toUpperCase(),
      );
      requireThat(
        found &&
          found.active &&
          found.starts <= dayVN() &&
          found.ends >= dayVN() &&
          (!found.routeId || found.routeId === row.route_id),
        422,
        "Ưu đãi không áp dụng",
      );
      const used = all(
        "SELECT data FROM bookings WHERE tenant_id=? AND status!='cancelled'",
        row.tenant_id,
      ).filter((b) => JSON.parse(b.data).promoCode === found.code).length;
      requireThat(used < found.limit, 409, "Ưu đãi hết lượt");
      discount = Math.min(
        amount,
        found.discountType === "percent"
          ? Math.floor((amount * found.value) / 100)
          : found.value,
      );
      promo = found.code;
    }
    let agencyId = body.agencyId || "",
      agencyCommissionBps = 0;
    if (agencyId) {
      requireThat(actor, 403, "Đại lý chỉ được gán từ quầy");
      const agency = resource(row.tenant_id, "agencies", agencyId);
      requireThat(agency.active, 422, "Đại lý tạm ngưng");
      agencyCommissionBps = agency.commissionBps;
      const debt = all(
        "SELECT * FROM bookings WHERE tenant_id=? AND status!='cancelled' AND payment_status='unpaid'",
        row.tenant_id,
      )
        .map(bookingView)
        .filter((b) => b.agencyId === agencyId)
        .reduce(
          (s, b) =>
            s +
            b.totalAmount -
            one(
              "SELECT coalesce(sum(amount),0) AS amount FROM ledger WHERE booking_id=? AND kind='collection'",
              b.id,
            ).amount,
          0,
        );
      requireThat(
        debt + amount - discount <= agency.creditLimit,
        409,
        "Vượt hạn mức công nợ đại lý",
      );
    }
    const bookingId =
        "DG" +
        Date.now().toString(36).toUpperCase() +
        id().slice(0, 8).toUpperCase(),
      data = {
        trip,
        date: trip.date,
        selectedSeats: body.seats,
        passenger,
        totalAmount: amount - discount,
        discount,
        promoCode: promo,
        agencyId,
        agencyCommissionBps,
        platformCommissionBps: tenant(row.tenant_id).commissionBps || 0,
        paymentMethod: "cash",
        receiptToken: hashToken(token),
        checkedInAt: null,
      };
    run(
      "INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?)",
      bookingId,
      row.tenant_id,
      row.id,
      "confirmed",
      amount - discount === 0 ? "paid" : "unpaid",
      actor ? "counter" : "online",
      JSON.stringify(data),
      now(),
    );
    if (body.holdId) {
      run(
        "UPDATE inventory SET booking_id=?,hold_id=NULL WHERE hold_id=?",
        bookingId,
        body.holdId,
      );
      run("DELETE FROM holds WHERE id=?", body.holdId);
    } else
      for (const c of body.seats)
        run("INSERT INTO inventory VALUES(?,?,NULL,?)", row.id, c, bookingId);
    run(
      "INSERT INTO idempotency VALUES(?,?)",
      hashToken(idempotency + token),
      bookingId,
    );
    audit(actor, row.tenant_id, "bookings.create", bookingId, {
      source: actor ? "counter" : "online",
    });
    notify(
      row.tenant_id,
      `Có đơn vé mới ${bookingId} · ${body.seats.length} chỗ`,
    );
    return bookingView(one("SELECT * FROM bookings WHERE id=?", bookingId));
  });
}
export function changeBooking(tenantId, bookingId, body, actor) {
  return transaction(() => {
    const b = one(
      "SELECT * FROM bookings WHERE tenant_id=? AND id=?",
      tenantId,
      bookingId,
    );
    requireThat(b, 404, "Không tìm thấy đơn");
    requireThat(b.status !== "cancelled", 409, "Đơn đã hủy");
    const data = JSON.parse(b.data);
    if (body.action === "cancel") {
      run(
        "UPDATE bookings SET status='cancelled',payment_status=CASE WHEN (SELECT coalesce(sum(CASE WHEN kind='collection' THEN amount ELSE -amount END),0) FROM ledger WHERE booking_id=bookings.id AND kind!='expense')>0 THEN 'refund_due' ELSE payment_status END WHERE id=?",
        bookingId,
      );
      run("DELETE FROM inventory WHERE booking_id=?", bookingId);
      notify(tenantId, `Vé ${bookingId} đã hủy; kiểm tra khoản cần hoàn.`);
    } else if (body.action === "checkin") {
      const row = tripRow(tenantId, b.trip_id);
      if (actor.role === "driver")
        requireThat(
          actor.driver_id === row.driver_id,
          403,
          "Không phải chuyến được phân công",
        );
      requireThat(
        b.payment_status === "paid",
        409,
        "Vé chưa thanh toán, cần quầy xác nhận tiền",
      );
      requireThat(b.status !== "checked_in", 409, "Vé đã được kiểm trước đó");
      data.checkedInAt = now();
      run(
        "UPDATE bookings SET status='checked_in',data=? WHERE id=?",
        JSON.stringify(data),
        bookingId,
      );
    } else if (body.action === "move") {
      requireThat(b.status !== "checked_in", 409, "Khách đã lên xe");
      const target = tripRow(tenantId, body.tripId);
      requireThat(
        target.status === "published" && target.depart_at > now(),
        409,
        "Chuyến đích chưa mở bán",
      );
      run("DELETE FROM inventory WHERE booking_id=?", bookingId);
      const trip = seatSelection(target, body.seats);
      requireThat(
        body.seats.length === data.selectedSeats.length,
        422,
        "Số ghế chuyển phải bằng vé cũ",
      );
      const cost = body.seats.reduce(
        (s, c) => s + trip.seats.find((x) => x.code === c).price,
        0,
      );
      requireThat(
        cost === data.totalAmount && data.discount === 0,
        409,
        "Chỉ chuyển đồng giá và không có ưu đãi; xử lý hủy/hoàn và đặt mới cho chênh lệch",
      );
      data.trip = trip;
      data.date = trip.date;
      data.selectedSeats = body.seats;
      data.passenger.pickupStopId = trip.departureStops[0].id;
      data.passenger.dropoffStopId = trip.dropoffStops[0].id;
      run(
        "UPDATE bookings SET trip_id=?,data=? WHERE id=?",
        target.id,
        JSON.stringify(data),
        bookingId,
      );
      for (const c of body.seats)
        run(
          "INSERT INTO inventory VALUES(?,?,NULL,?)",
          target.id,
          c,
          bookingId,
        );
    } else requireThat(false, 422, "Thao tác đơn không hợp lệ");
    audit(actor, tenantId, "bookings." + body.action, bookingId);
    return bookingView(one("SELECT * FROM bookings WHERE id=?", bookingId));
  });
}
export function postLedger(tenantId, body, actor, requestKey) {
  return transaction(() => {
    const key = requestKey ? hashToken(tenantId + actor.id + requestKey) : null;
    if (requestKey)
      requireThat(
        /^[\w-]{10,100}$/.test(requestKey),
        422,
        "Khóa giao dịch không hợp lệ",
      );
    const fingerprint = hashToken(JSON.stringify(body));
    const prior = key
      ? one("SELECT * FROM ledger_requests WHERE key=?", key)
      : null;
    if (prior) {
      requireThat(
        prior.fingerprint === fingerprint,
        409,
        "Khóa giao dịch đã dùng cho nội dung khác",
      );
      return one("SELECT * FROM ledger WHERE id=?", prior.ledger_id);
    }
    const kind = text(body.kind, "Loại giao dịch");
    requireThat(
      ["collection", "refund", "expense"].includes(kind),
      422,
      "Loại giao dịch không hợp lệ",
    );
    const amount = integer(Number(body.amount), "Số tiền", 1, 1e10),
      method = text(body.method || "cash", "Phương thức");
    requireThat(
      ["cash", "transfer"].includes(method),
      422,
      "Chỉ ghi nhận tiền mặt/chuyển khoản đã đối chiếu",
    );
    let booking = null;
    if (kind !== "expense") {
      booking = one(
        "SELECT * FROM bookings WHERE tenant_id=? AND id=?",
        tenantId,
        body.bookingId,
      );
      requireThat(booking, 404, "Không tìm thấy đơn");
      const b = bookingView(booking);
      const paid = one(
        "SELECT coalesce(sum(CASE WHEN kind='collection' THEN amount ELSE -amount END),0) AS amount FROM ledger WHERE booking_id=? AND kind!='expense'",
        booking.id,
      ).amount;
      if (kind === "collection") {
        requireThat(
          booking.status !== "cancelled" && paid + amount <= b.totalAmount,
          409,
          "Vượt tiền cần thu hoặc vé đã hủy",
        );
        if (paid + amount === b.totalAmount)
          run(
            "UPDATE bookings SET payment_status='paid' WHERE id=?",
            booking.id,
          );
      } else {
        requireThat(
          booking.status === "cancelled" && amount <= paid,
          409,
          "Chỉ hoàn số tiền đã thu của vé hủy",
        );
        if (amount === paid)
          run(
            "UPDATE bookings SET payment_status='refunded' WHERE id=?",
            booking.id,
          );
      }
    }
    const rid = id();
    run(
      "INSERT INTO ledger VALUES(?,?,?,?,?,?,?,?,?)",
      rid,
      tenantId,
      booking?.id || null,
      kind,
      amount,
      method,
      text(body.note || "Đối soát thủ công", "Ghi chú", 500),
      actor.id,
      now(),
    );
    if (key)
      run("INSERT INTO ledger_requests VALUES(?,?,?)", key, fingerprint, rid);
    audit(actor, tenantId, "ledger." + kind, rid, {
      amount,
      bookingId: booking?.id || null,
    });
    return one("SELECT * FROM ledger WHERE id=?", rid);
  });
}
