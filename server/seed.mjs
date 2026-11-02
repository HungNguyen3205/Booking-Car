import { one, run, id, now, transaction, audit } from "./database.mjs";
import { saveRecord, saveTrip, tripStatus, dayVN, tenant } from "./domain.mjs";
import { text, requireThat, integer } from "./security.mjs";
export function createTenant(body, actor) {
  const name = text(body.name, "Tên nhà xe", 150),
    slug = text(body.slug, "Định danh", 50).toLowerCase();
  requireThat(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
      !["admin", "api", "app", "manage", "www"].includes(slug),
    422,
    "Định danh chỉ gồm chữ thường, số và dấu gạch ngang",
  );
  return transaction(() => {
    requireThat(
      !one("SELECT id FROM tenants WHERE slug=?", slug),
      409,
      "Định danh đã được sử dụng",
    );
    const rid = id(),
      data = {
        phone: body.phone || "",
        email: body.email || "",
        address: body.address || "",
        description: body.description || "",
        color: "#f5a066",
        logo: "",
        hero: "",
        autoPublish: body.autoPublish === true,
        commissionBps: integer(
          Number(body.commissionBps || 0),
          "Phí nền tảng",
          0,
          5000,
        ),
        policies: "Đổi/hủy vé liên hệ nhà xe để được xác nhận.",
      };
    run(
      "INSERT INTO tenants VALUES(?,?,?,?,?,?)",
      rid,
      name,
      slug,
      JSON.stringify(data),
      "active",
      now(),
    );
    audit(actor, rid, "tenant.create", rid);
    return tenant(rid);
  });
}
export function seedDanava(actor) {
  return transaction(() => {
    let t = one("SELECT * FROM tenants WHERE slug='danavago'");
    if (t) return { tenant: tenant(t.id), alreadyExists: true };
    t = createTenant(
      {
        name: "DANAVAGO",
        slug: "danavago",
        autoPublish: true,
        phone: "0935917677",
      },
      actor,
    );
    const branch = saveRecord(
      t.id,
      "branches",
      {
        name: "Văn phòng Đà Nẵng",
        address: "Đà Nẵng — địa chỉ dữ liệu thử nghiệm",
        phone: "0935917677",
      },
      actor,
    );
    const driver = saveRecord(
      t.id,
      "drivers",
      {
        name: "Tài xế thử nghiệm",
        phone: "0901234567",
        license: "D",
        licenseExpiry: "2099-12-31",
      },
      actor,
    );
    const vehicles = [
      [
        "Giường nằm 34 chỗ",
        "sleeper",
        34,
        2,
        "43B-000.01",
        "/assets/images/bus_coach_sleeper.png",
      ],
      [
        "Limousine 16 chỗ",
        "limousine",
        16,
        1,
        "43B-000.02",
        "/assets/images/bus_limousine_vip.png",
      ],
      [
        "Cabin VIP 22 phòng",
        "cabin",
        22,
        2,
        "43B-000.03",
        "/assets/images/bus_cabin_royal.png",
      ],
    ].map((v) =>
      saveRecord(
        t.id,
        "vehicles",
        {
          name: v[0],
          category: v[1],
          capacity: v[2],
          floors: v[3],
          plate: v[4],
          image: v[5],
          amenities: ["Điều hòa", "USB", "WiFi"],
          inspectionDate: "2099-12-31",
        },
        actor,
      ),
    );
    const routes = [
      ["Đà Nẵng", "Huế", 150],
      ["Đà Nẵng", "Hội An", 60],
      ["Huế", "Đà Nẵng", 150],
    ].map(([from, to, durationMinutes]) =>
      saveRecord(
        t.id,
        "routes",
        {
          name: `${from} → ${to}`,
          from,
          to,
          durationMinutes,
          pickups: [
            {
              id: "pickup-office",
              name: `Văn phòng ${from}`,
              address: `${from} — điểm đón thử nghiệm`,
              offset: 0,
            },
          ],
          dropoffs: [
            {
              id: "dropoff-office",
              name: `Văn phòng ${to}`,
              address: `${to} — điểm trả thử nghiệm`,
              offset: durationMinutes,
            },
          ],
        },
        actor,
      ),
    );
    for (let day = 1; day <= 5; day++) {
      const d = new Date(dayVN() + "T12:00:00+07:00");
      d.setDate(d.getDate() + day);
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(d);
      vehicles.forEach((v, i) => {
        const trip = saveTrip(
          t.id,
          {
            vehicleId: v.id,
            routeId: routes[i].id,
            date,
            time: ["08:00", "12:00", "17:00"][i],
            price: [180000, 240000, 320000][i],
            branchId: branch.id,
            driverId: driver.id,
          },
          actor,
        );
        tripStatus(t.id, trip.id, "published", actor);
      });
    }
    return {
      tenant: tenant(t.id),
      counts: { vehicles: vehicles.length, routes: routes.length, trips: 15 },
      demo: true,
    };
  });
}
