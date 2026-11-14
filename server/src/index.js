import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { db, init } from "./db.js";
import { quote, today } from "./pricing.js";
import { initOperations } from "./operations-db.js";
import { registerOperations } from "./operations.js";
import { resolve } from "node:path";
const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "https://images.unsplash.com", "data:"],
        "style-src": [
          "'self'",
          "https://fonts.googleapis.com",
          "'unsafe-inline'",
        ],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
      },
    },
  }),
);
app.use(express.json({ limit: "3mb" }));
app.use(cookieParser());
const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const hash = (t) => createHash("sha256").update(t).digest("hex");
app.use("/api", async (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.get("origin") &&
    new URL(req.get("origin")).host !== req.get("host")
  )
    throw fail("Invalid origin", 403);
  if (req.cookies.session) {
    const [rows] = await db.execute(
      "SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>UTC_TIMESTAMP() AND u.active=TRUE",
      [hash(req.cookies.session)],
    );
    req.user = rows[0];
  }
  next();
});
const auth =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) throw fail("กรุณาเข้าสู่ระบบ", 401);
    if (roles.length && !roles.includes(req.user.role))
      throw fail("ไม่มีสิทธิ์ใช้งาน", 403);
    next();
  };
async function session(res, user) {
  const token = randomBytes(32).toString("hex");
  await db.execute(
    "INSERT INTO sessions VALUES(?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 DAY))",
    [hash(token), user.id],
  );
  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 604800000,
  });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
const credentials = z.object({
  email: z
    .email()
    .max(190)
    .transform((s) => s.toLowerCase().trim()),
  password: z.string().min(10).max(128),
});
const loginLimit = rateLimit({ windowMs: 900000, limit: 30 });
app.get("/api/health", async (req, res) => {
  await db.query("SELECT 1");
  res.json({ status: "ok", database: "mysql" });
});
app.get("/api/auth/me", (req, res) => res.json(req.user || null));
app.post("/api/auth/register", loginLimit, async (req, res) => {
  const p = credentials
    .extend({ name: z.string().trim().min(1).max(120) })
    .parse(req.body);
  const [r] = await db.execute(
    "INSERT INTO users(name,email,password_hash) VALUES(?,?,?)",
    [p.name, p.email, await bcrypt.hash(p.password, 12)],
  );
  await session(res, {
    id: r.insertId,
    name: p.name,
    email: p.email,
    role: "Customer",
  });
});
app.post("/api/auth/login", loginLimit, async (req, res) => {
  const p = credentials.parse(req.body);
  const [rows] = await db.execute(
    "SELECT * FROM users WHERE email=? AND active=TRUE",
    [p.email],
  );
  const u = rows[0];
  if (!u || !(await bcrypt.compare(p.password, u.password_hash)))
    throw fail("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);
  await session(res, u);
});
app.post("/api/auth/logout", async (req, res) => {
  if (req.cookies.session)
    await db.execute("DELETE FROM sessions WHERE token=?", [
      hash(req.cookies.session),
    ]);
  res.clearCookie("session").json({ ok: true });
});
app.get("/api/reviews", async (req, res) => {
  const [reviews] = await db.query(
    "SELECT r.id,u.name,r.rating,r.body FROM reviews r JOIN users u ON u.id=r.user_id ORDER BY r.id DESC LIMIT 24",
  );
  res.json(reviews);
});
app.post("/api/reviews", auth("Customer"), async (req, res) => {
  const { rating, body } = z.object({
    rating: z.number().int().min(1).max(5),
    body: z.string().trim().min(1).max(500),
  }).parse(req.body);
  const [result] = await db.execute(
    "INSERT INTO reviews(user_id,rating,body) VALUES(?,?,?)",
    [req.user.id, rating, body],
  );
  res.status(201).json({ id: result.insertId });
});
const date = z.iso.date();
const bookingInput = z.object({
  roomId: z.number().int().positive(),
  checkIn: date,
  checkOut: date,
  guests: z.number().int().min(1).max(10),
  promotionId: z.number().int().positive().nullable().optional(),
  packageIds: z.array(z.number().int().positive()).max(20).default([]),
});
app.get("/api/rooms", async (req, res) => {
  const [rooms] = await db.query(
    "SELECT * FROM rooms WHERE active=TRUE ORDER BY price,number",
  );
  let result = rooms;
  if (req.query.checkIn || req.query.checkOut) {
    const a = date.parse(req.query.checkIn),
      b = date.parse(req.query.checkOut);
    if (b <= a || a < today()) throw fail("วันที่ไม่ถูกต้อง");
    const [busy] = await db.execute(
      "SELECT room_id FROM bookings WHERE status NOT IN ('Cancelled','Completed') AND check_in<? AND check_out>?",
      [b, a],
    );
    result = result.filter(
      (r) =>
        !busy.some((x) => x.room_id === r.id) &&
        !["Cleaning", "Maintenance"].includes(r.status),
    );
  }
  if (req.query.guests)
    result = result.filter((r) => r.capacity >= Number(req.query.guests));
  res.json(result);
});
app.get("/api/catalog", async (req, res) => {
  const [promotions] = await db.query(
    "SELECT * FROM promotions WHERE active=TRUE",
  );
  const [packages] = await db.query("SELECT * FROM packages WHERE active=TRUE");
  res.json({ promotions, packages });
});
async function price(c, p, member, excludeId = "") {
  const [rs] = await c.execute("SELECT * FROM rooms WHERE id=? FOR UPDATE", [
    p.roomId,
  ]);
  const r = rs[0];
  if (!r || !r.active || ["Cleaning", "Maintenance"].includes(r.status))
    throw fail("ห้องไม่พร้อมจอง");
  const [busy] = await c.execute(
    "SELECT id FROM bookings WHERE room_id=? AND status NOT IN ('Cancelled','Completed') AND check_in<? AND check_out>? AND id<>? FOR UPDATE",
    [r.id, p.checkOut, p.checkIn, excludeId],
  );
  if (busy.length) throw fail("ห้องถูกจองแล้วในช่วงที่เลือก", 409);
  const [ps] = await c.query("SELECT * FROM promotions");
  const [xs] = await c.query("SELECT * FROM packages");
  return quote(r, p, ps, xs, member);
}
async function tx(fn) {
  const c = await db.getConnection();
  try {
    await c.beginTransaction();
    const r = await fn(c);
    await c.commit();
    return r;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
app.post("/api/quote", async (req, res) => {
  const p = bookingInput.parse(req.body);
  res.json(await tx((c) => price(c, p, !!req.user)));
});
app.post("/api/bookings", auth(), async (req, res) => {
  const p = bookingInput
    .extend({
      guestName: z.string().trim().min(1).max(120),
      email: z.email().max(190),
      phone: z.string().regex(/^[+\d ()-]{8,30}$/),
      requests: z.string().max(2000).default(""),
      acceptPolicy: z.literal(true),
    })
    .parse(req.body);
  res.status(201).json(
    await tx(async (c) => {
      const q = await price(c, p, true);
      const id = "RR-" + randomBytes(8).toString("hex").toUpperCase();
      await c.execute(
        "INSERT INTO bookings(id,user_id,room_id,check_in,check_out,guests,guest_name,email,phone,requests,packages,room_total,package_total,discount,total,deposit) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          id,
          req.user.id,
          p.roomId,
          p.checkIn,
          p.checkOut,
          p.guests,
          p.guestName,
          p.email,
          p.phone,
          p.requests,
          JSON.stringify(q.packages),
          q.roomTotal,
          q.packageTotal,
          q.discount,
          q.total,
          q.deposit,
        ],
      );
      return { id, ...q };
    }),
  );
});
const listBookings = `SELECT b.*,r.name room_name,r.number room_number FROM bookings b JOIN rooms r ON r.id=b.room_id`;
app.get("/api/bookings", auth(), async (req, res) => {
  const staff = ["Admin", "Receptionist"].includes(req.user.role);
  const [rows] = await db.execute(
    listBookings +
      (staff ? "" : " WHERE b.user_id=?") +
      " ORDER BY b.created_at DESC",
    staff ? [] : [req.user.id],
  );
  res.json(rows);
});
app.post("/api/bookings/:id/:action", auth(), async (req, res) => {
  const action = z
    .enum(["deposit", "cancel", "checkin", "checkout"])
    .parse(req.params.action);
  res.json(
    await tx(async (c) => {
      const [lookup] = await c.execute(
        "SELECT room_id FROM bookings WHERE id=?",
        [req.params.id],
      );
      if (!lookup.length) throw fail("ไม่พบการจอง", 404);
      const [rs] = await c.execute(
        "SELECT * FROM rooms WHERE id=? FOR UPDATE",
        [lookup[0].room_id],
      );
      const [bs] = await c.execute(
        "SELECT * FROM bookings WHERE id=? FOR UPDATE",
        [req.params.id],
      );
      const b = bs[0],
        room = rs[0];
      const staff = ["Admin", "Receptionist"].includes(req.user.role);
      if (b.user_id !== req.user.id && !staff) throw fail("ไม่มีสิทธิ์", 403);
      let status = b.status,
        amount = 0,
        kind = "";
      if (action === "cancel") {
        if (!["Pending", "Confirmed"].includes(status)) throw fail("ยกเลิกไม่ได้");
        status = "Cancelled";
      }
      if (action === "deposit") {
        if (status !== "Pending" || b.check_in < today())
          throw fail("ชำระมัดจำไม่ได้");
        if (process.env.SEED_DEMO !== "true")
          throw fail("ยังไม่ได้เชื่อมผู้ให้บริการชำระเงิน กรุณาติดต่อพนักงาน");
        status = "Confirmed";
        amount = b.deposit;
        kind = "Demo deposit";
      }
      if (action === "checkin") {
        if (!staff) throw fail("เฉพาะพนักงาน", 403);
        if (
          status !== "Confirmed" ||
          b.check_in > today() ||
          b.check_out <= today() ||
          room.status !== "Vacant"
        )
          throw fail("ยังเช็กอินไม่ได้");
        if (req.body.verified !== true) throw fail("กรุณายืนยันการตรวจสอบผู้เข้าพัก");
        await c.execute(
          "INSERT INTO stay_events(booking_id,verified,checked_in_at,actor_id) VALUES(?,TRUE,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 HOUR),?)",
          [b.id, req.user.id],
        );
        status = "CheckedIn";
        await c.execute("UPDATE rooms SET status='Occupied' WHERE id=?", [
          b.room_id,
        ]);
      }
      if (action === "checkout") {
        if (!staff) throw fail("เฉพาะพนักงาน", 403);
        if (status !== "CheckedIn" || Number(b.paid) < Number(b.total))
          throw fail("กรุณาบันทึกรับชำระยอดคงเหลือก่อนเช็กเอาต์");
        await c.execute(
          "UPDATE stay_events SET checked_out_at=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 HOUR) WHERE booking_id=?",
          [b.id],
        );
        await c.execute(
          "INSERT INTO hotel_tasks(room_id,kind,title) VALUES(?,'Cleaning','ทำความสะอาดหลังเช็กเอาต์')",
          [b.room_id],
        );
        status = "Completed";
        amount = Math.round((b.total - b.paid) * 100) / 100;
        kind = "Balance received by staff";
        await c.execute("UPDATE rooms SET status='Cleaning' WHERE id=?", [
          b.room_id,
        ]);
      }
      if (amount > 0)
        await c.execute(
          "INSERT INTO payments(booking_id,amount,kind) VALUES(?,?,?)",
          [b.id, amount, kind],
        );
      await c.execute("UPDATE bookings SET status=?,paid=paid+? WHERE id=?", [
        status,
        amount,
        b.id,
      ]);
      return { ok: true };
    }),
  );
});
app.get("/api/staff/rooms", auth("Admin", "Receptionist"), async (req, res) => {
  const [r] = await db.query("SELECT * FROM rooms");
  res.json(r);
});
app.patch(
  "/api/staff/rooms/:id/status",
  auth("Admin", "Receptionist"),
  async (req, res) => {
    const status = z
      .enum(["Vacant", "Cleaning", "Maintenance"])
      .parse(req.body.status);
    await tx(async (c) => {
      const [rs] = await c.execute(
        "SELECT * FROM rooms WHERE id=? FOR UPDATE",
        [req.params.id],
      );
      if (!rs.length) throw fail("ไม่พบห้อง", 404);
      const [bs] = await c.execute(
        "SELECT id FROM bookings WHERE room_id=? AND status='CheckedIn'",
        [req.params.id],
      );
      if (bs.length) throw fail("ห้องยังมีผู้เข้าพัก");
      const [tasks] = await c.execute(
        "SELECT id FROM hotel_tasks WHERE room_id=? AND status<>'Done'",
        [req.params.id],
      );
      if (tasks.length)
        throw fail("กรุณาปิดงานแม่บ้านหรืองานซ่อมที่ค้างอยู่ก่อนเปลี่ยนสถานะห้อง");
      await c.execute("UPDATE rooms SET status=? WHERE id=?", [
        status,
        req.params.id,
      ]);
    });
    res.json({ ok: true });
  },
);
const roomSchema = z.object({
  number: z.string().min(1).max(10),
  name: z.string().min(1).max(120),
  type: z.string().trim().min(1).max(40),
  price: z.number().positive().max(1000000),
  capacity: z.number().int().min(1).max(10),
  size: z.number().int().positive(),
  image_url: z
    .string()
    .refine(
      (s) =>
        s.startsWith("https://") || /^\/uploads\/[a-f0-9]+\.(png|jpg)$/.test(s),
    ),
  active: z.boolean(),
  is_lucky: z.boolean(),
});
const promoSchema = z
  .object({
    code: z.string().min(1).max(40),
    name: z.string().min(1).max(120),
    percent: z.number().min(0).max(100),
    rule: z.enum(["Weekend", "EarlyBird", "Member", "Lucky", "LongStay"]),
    start_date: date,
    end_date: date,
    active: z.boolean(),
  })
  .refine((p) => p.end_date >= p.start_date);
const packageSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().min(0).max(1000000),
  per_night: z.boolean(),
  active: z.boolean(),
});
for (const [table, schema] of [
  ["rooms", roomSchema],
  ["promotions", promoSchema],
  ["packages", packageSchema],
]) {
  app.get("/api/admin/" + table, auth("Admin"), async (req, res) => {
    const [r] = await db.query(`SELECT * FROM ${table}`);
    res.json(r);
  });
  app.post("/api/admin/" + table, auth("Admin"), async (req, res) => {
    const p = schema.parse(req.body),
      keys = Object.keys(p);
    const [r] = await db.execute(
      `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
      Object.values(p),
    );
    res.status(201).json({ id: r.insertId });
  });
  app.put("/api/admin/" + table + "/:id", auth("Admin"), async (req, res) => {
    const p = schema.parse(req.body);
    await tx(async (c) => {
      const [rows] = await c.execute(
        `SELECT id FROM ${table} WHERE id=? FOR UPDATE`,
        [req.params.id],
      );
      if (!rows.length) throw fail("ไม่พบข้อมูล", 404);
      if (table === "rooms" && !p.active) {
        const [busy] = await c.execute(
          "SELECT id FROM bookings WHERE room_id=? AND status NOT IN ('Completed','Cancelled')",
          [req.params.id],
        );
        if (busy.length) throw fail("ห้องมีการจองค้างอยู่");
      }
      await c.execute(
        `UPDATE ${table} SET ${Object.keys(p)
          .map((k) => k + "=?")
          .join(",")} WHERE id=?`,
        [...Object.values(p), req.params.id],
      );
    });
    res.json({ ok: true });
  });
}
app.get("/api/admin/users", auth("Admin"), async (req, res) => {
  const [r] = await db.query("SELECT id,name,email,role,active FROM users");
  res.json(r);
});
app.patch("/api/admin/users/:id", auth("Admin"), async (req, res) => {
  if (Number(req.params.id) === req.user.id) throw fail("แก้ไขสิทธิ์ตัวเองไม่ได้");
  const p = z
    .object({
      role: z.enum(["Customer", "Admin", "Receptionist", "Accounting"]),
      active: z.boolean(),
    })
    .parse(req.body);
  await db.execute("UPDATE users SET role=?,active=? WHERE id=?", [
    p.role,
    p.active,
    req.params.id,
  ]);
  res.json({ ok: true });
});
app.get("/api/payments", auth("Admin", "Accounting"), async (req, res) => {
  const from = date.parse(req.query.from || "2000-01-01"),
    to = date.parse(req.query.to || today());
  if (to < from) throw fail("ช่วงวันที่ไม่ถูกต้อง");
  const [rows] = await db.execute(
    "SELECT p.*,b.guest_name,b.room_total,b.discount,b.package_total,b.total FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE DATE(DATE_ADD(p.paid_at,INTERVAL 7 HOUR)) BETWEEN ? AND ? ORDER BY p.paid_at DESC",
    [from, to],
  );
  if (req.query.format === "csv") {
    const escape = (v) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+\-@]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    res
      .attachment("ruenrom-payments.csv")
      .type("text/csv")
      .send(
        "\uFEFF" +
          [
            ["ID", "Booking", "Guest", "Amount", "Kind", "Paid at UTC"],
            ...rows.map((p) => [
              p.id,
              p.booking_id,
              p.guest_name,
              p.amount,
              p.kind,
              p.paid_at,
            ]),
          ]
            .map((r) => r.map(escape).join(","))
            .join("\r\n"),
      );
  } else res.json(rows);
});
registerOperations(app, { db, auth, tx, price, bookingInput, fail });
app.use("/uploads", express.static(resolve("uploads"), { dotfiles: "deny" }));
app.use(
  express.static(fileURLToPath(new URL("../../client/dist", import.meta.url))),
);
app.get("/{*path}", (req, res) => {
  if (req.path.startsWith("/api/"))
    return res.status(404).json({ message: "Not found" });
  res.sendFile(
    fileURLToPath(new URL("../../client/dist/index.html", import.meta.url)),
  );
});
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError)
    return res
      .status(400)
      .json({ message: "ข้อมูลไม่ถูกต้อง", details: err.issues });
  if (err.code === "ER_DUP_ENTRY")
    return res.status(409).json({ message: "ข้อมูลนี้มีอยู่แล้ว" });
  if (!err.status) console.error(err);
  res.status(err.status || 400).json({
    message: err.code ? "ไม่สามารถทำรายการได้" : err.message || "เกิดข้อผิดพลาด",
  });
});
await init();
await initOperations(db);
const server = app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
  console.log("RUENROM API http://localhost:" + (process.env.PORT || 3000)),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(async () => {
      await db.end();
      process.exit(0);
    }),
  );
