import { z } from "zod";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dashboardData } from "./reporting.js";
import { today } from "./pricing.js";

export function registerOperations(
  app,
  { db, auth, tx, price, bookingInput, fail },
) {
  const front = auth("Admin", "Receptionist"),
    finance = auth("Admin", "Accounting"),
    staff = auth("Admin", "Receptionist", "Accounting");
  const id = z.coerce.number().int().positive();
  const contact = z.object({
    guestName: z.string().trim().min(1).max(120),
    email: z
      .email()
      .max(190)
      .transform((s) => s.toLowerCase()),
    phone: z.string().regex(/^[+\d ()-]{8,30}$/),
    requests: z.string().max(2000).default(""),
  });
  const bookingSchema = bookingInput.merge(contact);
  const list = `SELECT b.*,r.number room_number,r.name room_name,r.type room_type FROM bookings b JOIN rooms r ON r.id=b.room_id`;
  async function lock(c, key) {
    const [found] = await c.execute("SELECT room_id FROM bookings WHERE id=?", [
      key,
    ]);
    if (!found.length) throw fail("ไม่พบการจอง", 404);
    await c.execute("SELECT id FROM rooms WHERE id=? FOR UPDATE", [
      found[0].room_id,
    ]);
    const [rows] = await c.execute(
      "SELECT * FROM bookings WHERE id=? FOR UPDATE",
      [key],
    );
    return rows[0];
  }
  app.get("/api/staff/dashboard", staff, async (req, res) => {
    const period = z.coerce
      .number()
      .refine((n) => [7, 30].includes(n))
      .parse(req.query.days || 7);
    const [[rooms], [bookings], [payments]] = await Promise.all([
      db.query("SELECT * FROM rooms"),
      db.query(list + " ORDER BY b.created_at DESC"),
      db.query("SELECT * FROM payments"),
    ]);
    const data = dashboardData(rooms, bookings, payments, period, today());
    data.financial = req.user.role !== "Receptionist";
    if (!data.financial) {
      data.revenue = {
        ...data.revenue,
        total: 0,
        delta: null,
        series: data.revenue.series.map((p) => ({ ...p, value: 0, prev: 0 })),
      };
      data.kpi.adr = 0;
      data.kpi.revpar = 0;
    }
    res.json(data);
  });
  app.get("/api/staff/bookings", staff, async (req, res) =>
    res.json((await db.query(list + " ORDER BY b.created_at DESC"))[0]),
  );
  app.get("/api/staff/bookings/:id", staff, async (req, res) => {
    const [rows] = await db.execute(list + " WHERE b.id=?", [req.params.id]);
    if (!rows.length) throw fail("ไม่พบการจอง", 404);
    const [[payments], [charges], [events]] = await Promise.all([
      db.execute("SELECT * FROM payments WHERE booking_id=? ORDER BY id", [
        req.params.id,
      ]),
      db.execute(
        "SELECT * FROM booking_charges WHERE booking_id=? ORDER BY id",
        [req.params.id],
      ),
      db.execute("SELECT * FROM stay_events WHERE booking_id=?", [
        req.params.id,
      ]),
    ]);
    const [settings] = await db.query(
      "SELECT data FROM hotel_settings WHERE id=1",
    );
    res.json({
      ...rows[0],
      payments,
      charges,
      stay: events[0] || null,
      hotel: settings[0].data,
    });
  });
  app.post("/api/staff/bookings", front, async (req, res) => {
    const p = bookingSchema.parse(req.body);
    res.status(201).json(
      await tx(async (c) => {
        const [customer] = await c.execute(
          "SELECT id FROM users WHERE email=? AND role='Customer' AND active=TRUE",
          [p.email],
        );
        const q = await price(c, p, !!customer.length);
        const key = "RR-" + randomBytes(8).toString("hex").toUpperCase();
        await c.execute(
          "INSERT INTO bookings(id,user_id,room_id,check_in,check_out,guests,guest_name,email,phone,requests,packages,room_total,package_total,discount,total,deposit) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            key,
            customer[0]?.id || req.user.id,
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
        return { id: key, ...q };
      }),
    );
  });
  app.put("/api/staff/bookings/:id", front, async (req, res) => {
    const p = contact.parse(req.body);
    res.json(
      await tx(async (c) => {
        const b = await lock(c, req.params.id);
        if (!["Pending", "Confirmed"].includes(b.status))
          throw fail("แก้ไขได้ก่อนเข้าพักเท่านั้น");
        await c.execute(
          "UPDATE bookings SET guest_name=?,email=?,phone=?,requests=? WHERE id=?",
          [p.guestName, p.email, p.phone, p.requests, b.id],
        );
        return { ok: true };
      }),
    );
  });
  app.post("/api/staff/bookings/:id/reschedule", front, async (req, res) => {
    const p = bookingInput.parse(req.body);
    res.json(
      await tx(async (c) => {
        // Lock both rooms in numeric order before the booking, matching normal booking lock order.
        const [lookup] = await c.execute(
          "SELECT room_id FROM bookings WHERE id=?",
          [req.params.id],
        );
        if (!lookup.length) throw fail("ไม่พบการจอง", 404);
        for (const roomId of [...new Set([lookup[0].room_id, p.roomId])].sort(
          (a, b) => a - b,
        ))
          await c.execute("SELECT id FROM rooms WHERE id=? FOR UPDATE", [
            roomId,
          ]);
        const [rows] = await c.execute(
          "SELECT * FROM bookings WHERE id=? FOR UPDATE",
          [req.params.id],
        );
        const b = rows[0];
        if (b.status !== "Pending" || Number(b.paid) !== 0)
          throw fail("เปลี่ยนห้องหรือวันได้เฉพาะรายการรอมัดจำที่ยังไม่รับเงิน");
        const [customer] = await c.execute(
          "SELECT id FROM users WHERE id=? AND role='Customer'",
          [b.user_id],
        );
        const q = await price(c, p, !!customer.length, b.id);
        await c.execute(
          "UPDATE bookings SET room_id=?,check_in=?,check_out=?,guests=?,packages=?,room_total=?,package_total=?,discount=?,total=?,deposit=? WHERE id=?",
          [
            p.roomId,
            p.checkIn,
            p.checkOut,
            p.guests,
            JSON.stringify(q.packages),
            q.roomTotal,
            q.packageTotal,
            q.discount,
            q.total,
            q.deposit,
            b.id,
          ],
        );
        return { ok: true, ...q };
      }),
    );
  });
  app.post(
    "/api/staff/bookings/:id/receive",
    auth("Admin", "Receptionist", "Accounting"),
    async (req, res) => {
      const p = z
        .object({
          amount: z.number().positive().max(10000000),
          method: z.enum(["Cash", "Transfer"]),
          reference: z.string().max(100).default(""),
          requestId: z.string().uuid(),
        })
        .parse(req.body);
      res.json(
        await tx(async (c) => {
          const b = await lock(c, req.params.id);
          const [duplicate] = await c.execute(
            "SELECT * FROM receipt_requests WHERE request_id=?",
            [p.requestId],
          );
          if (duplicate.length) {
            if (duplicate[0].booking_id !== b.id)
              throw fail("รหัสรับชำระถูกใช้แล้ว", 409);
            return { ok: true, paymentId: duplicate[0].payment_id };
          }
          if (!["Pending", "Confirmed", "CheckedIn"].includes(b.status))
            throw fail("สถานะนี้ไม่รับชำระเงิน");
          const cents = Math.round(p.amount * 100);
          if (
            cents !== p.amount * 100 &&
            Math.abs(cents - p.amount * 100) > 0.000001
          )
            throw fail("จำนวนเงินทศนิยมไม่เกิน 2 ตำแหน่ง");
          if (cents > Math.round((b.total - b.paid) * 100))
            throw fail("รับเงินเกินยอดคงเหลือ");
          const [r] = await c.execute(
            "INSERT INTO payments(booking_id,amount,kind) VALUES(?,?,?)",
            [b.id, p.amount, `${p.method}: ${p.reference}`.slice(0, 40)],
          );
          const paid = Math.round((Number(b.paid) + p.amount) * 100) / 100;
          const status =
            b.status === "Pending" && paid >= Number(b.deposit)
              ? "Confirmed"
              : b.status;
          await c.execute("UPDATE bookings SET paid=?,status=? WHERE id=?", [
            paid,
            status,
            b.id,
          ]);
          await c.execute("INSERT INTO receipt_requests VALUES(?,?,?)", [
            p.requestId,
            b.id,
            r.insertId,
          ]);
          return { ok: true, paymentId: r.insertId };
        }),
      );
    },
  );
  app.post("/api/staff/bookings/:id/charges", front, async (req, res) => {
    const p = z
      .object({
        label: z.string().trim().min(1).max(200),
        amount: z.number().positive().max(1000000).multipleOf(0.01),
      })
      .parse(req.body);
    res.json(
      await tx(async (c) => {
        const b = await lock(c, req.params.id);
        if (!["Confirmed", "CheckedIn"].includes(b.status))
          throw fail("เพิ่มค่าบริการได้เฉพาะรายการยืนยันหรือกำลังเข้าพัก");
        await c.execute(
          "INSERT INTO booking_charges(booking_id,label,amount) VALUES(?,?,?)",
          [b.id, p.label, p.amount],
        );
        await c.execute("UPDATE bookings SET total=total+? WHERE id=?", [
          p.amount,
          b.id,
        ]);
        return { ok: true };
      }),
    );
  });
  app.get("/api/staff/customers", front, async (req, res) => {
    const [rows] = await db.query(
      `SELECT LOWER(b.email) email,MAX(b.guest_name) name,MAX(b.phone) phone,COUNT(*) bookings,SUM(b.status='Completed') stays,MAX(b.check_in) last_stay,COALESCE(MAX(n.note),'') note FROM bookings b LEFT JOIN customer_notes n ON n.email=LOWER(b.email) GROUP BY LOWER(b.email) ORDER BY last_stay DESC`,
    );
    res.json(rows);
  });
  app.put("/api/staff/customers/note", front, async (req, res) => {
    const p = z
      .object({
        email: z.email().transform((s) => s.toLowerCase()),
        note: z.string().max(2000),
      })
      .parse(req.body);
    await db.execute(
      "INSERT INTO customer_notes VALUES(?,?) ON DUPLICATE KEY UPDATE note=?",
      [p.email, p.note, p.note],
    );
    res.json({ ok: true });
  });
  app.get("/api/staff/settings", staff, async (req, res) =>
    res.json(
      (await db.query("SELECT data FROM hotel_settings WHERE id=1"))[0][0].data,
    ),
  );
  app.put("/api/staff/settings", auth("Admin"), async (req, res) => {
    const p = z
      .object({
        name: z.string().min(1).max(120),
        address: z.string().max(1000),
        phone: z.string().max(30),
        email: z.union([z.email(), z.literal("")]),
        checkIn: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        checkOut: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        policy: z.string().max(3000),
      })
      .parse(req.body);
    await db.execute("UPDATE hotel_settings SET data=? WHERE id=1", [
      JSON.stringify(p),
    ]);
    res.json({ ok: true });
  });
  app.get("/api/staff/room-types", staff, async (req, res) =>
    res.json((await db.query("SELECT * FROM room_types ORDER BY name"))[0]),
  );
  app.post("/api/staff/room-types", auth("Admin"), async (req, res) => {
    const p = z
      .object({
        name: z.string().trim().min(1).max(40),
        description: z.string().max(1000),
      })
      .parse(req.body);
    await db.execute(
      "INSERT INTO room_types VALUES(?,?) ON DUPLICATE KEY UPDATE description=?",
      [p.name, p.description, p.description],
    );
    res.json({ ok: true });
  });
  app.post("/api/staff/room-image", auth("Admin"), async (req, res) => {
    const p = z.object({ data: z.string().max(2800000) }).parse(req.body);
    const match = p.data.match(
      /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/,
    );
    if (!match) throw fail("รองรับ PNG หรือ JPEG เท่านั้น");
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 2 * 1024 * 1024) throw fail("รูปต้องไม่เกิน 2 MB");
    const valid =
      match[1] === "png"
        ? buffer
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
    if (!valid) throw fail("ไฟล์รูปไม่ถูกต้อง");
    const filename =
      randomBytes(16).toString("hex") + (match[1] === "png" ? ".png" : ".jpg");
    const folder = resolve("uploads");
    await mkdir(folder, { recursive: true });
    await writeFile(resolve(folder, filename), buffer, { flag: "wx" });
    res.json({ url: "/uploads/" + filename });
  });
  const employee = z.object({
    name: z.string().trim().min(1).max(120),
    department: z.string().min(1).max(80),
    position: z.string().min(1).max(80),
    phone: z.string().max(30).default(""),
    active: z.boolean().default(true),
  });
  app.get("/api/staff/employees", front, async (req, res) =>
    res.json(
      (await db.query("SELECT * FROM employees ORDER BY active DESC,name"))[0],
    ),
  );
  app.post("/api/staff/employees", auth("Admin"), async (req, res) => {
    const p = employee.parse(req.body);
    const [r] = await db.execute(
      "INSERT INTO employees(name,department,position,phone,active) VALUES(?,?,?,?,?)",
      Object.values(p),
    );
    res.status(201).json({ id: r.insertId });
  });
  app.put("/api/staff/employees/:id", auth("Admin"), async (req, res) => {
    const p = employee.parse(req.body);
    await db.execute(
      "UPDATE employees SET name=?,department=?,position=?,phone=?,active=? WHERE id=?",
      [...Object.values(p), id.parse(req.params.id)],
    );
    res.json({ ok: true });
  });
  app.get("/api/staff/shifts", front, async (req, res) =>
    res.json(
      (
        await db.query(
          "SELECT s.*,e.name FROM shifts s JOIN employees e ON e.id=s.employee_id ORDER BY starts_at DESC LIMIT 500",
        )
      )[0],
    ),
  );
  app.post("/api/staff/shifts", auth("Admin"), async (req, res) => {
    const p = z
      .object({
        employeeId: id,
        startsAt: z.iso.datetime({ local: true }),
        endsAt: z.iso.datetime({ local: true }),
      })
      .parse(req.body);
    if (p.endsAt <= p.startsAt) throw fail("เวลาสิ้นสุดต้องหลังเวลาเริ่ม");
    res.json(
      await tx(async (c) => {
        await c.execute("SELECT id FROM employees WHERE id=? FOR UPDATE", [
          p.employeeId,
        ]);
        const [overlap] = await c.execute(
          "SELECT id FROM shifts WHERE employee_id=? AND starts_at<? AND ends_at>?",
          [p.employeeId, p.endsAt, p.startsAt],
        );
        if (overlap.length) throw fail("ตารางงานซ้อนกัน");
        await c.execute(
          "INSERT INTO shifts(employee_id,starts_at,ends_at) VALUES(?,?,?)",
          [p.employeeId, p.startsAt, p.endsAt],
        );
        return { ok: true };
      }),
    );
  });
  app.post(
    "/api/staff/shifts/:id/attendance",
    auth("Admin"),
    async (req, res) => {
      const action = z.enum(["in", "out"]).parse(req.body.action);
      res.json(
        await tx(async (c) => {
          const [rows] = await c.execute(
            "SELECT * FROM shifts WHERE id=? FOR UPDATE",
            [id.parse(req.params.id)],
          );
          const s = rows[0];
          if (!s) throw fail("ไม่พบกะ", 404);
          if (
            (action === "in" && s.clock_in) ||
            (action === "out" && (!s.clock_in || s.clock_out))
          )
            throw fail("ลงเวลาไม่ได้");
          await c.execute(
            `UPDATE shifts SET ${action === "in" ? "clock_in" : "clock_out"}=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 HOUR) WHERE id=?`,
            [s.id],
          );
          return { ok: true };
        }),
      );
    },
  );
  app.get("/api/staff/tasks", front, async (req, res) =>
    res.json(
      (
        await db.query(
          'SELECT t.*,r.number room_number,e.name assignee FROM hotel_tasks t JOIN rooms r ON r.id=t.room_id LEFT JOIN employees e ON e.id=t.assignee_id ORDER BY t.status="Done",t.created_at DESC',
        )
      )[0],
    ),
  );
  const task = z.object({
    roomId: id,
    kind: z.enum(["Cleaning", "Maintenance"]),
    title: z.string().trim().min(1).max(200),
    assigneeId: id.nullable().default(null),
    notes: z.string().max(2000).default(""),
  });
  app.post("/api/staff/tasks", front, async (req, res) => {
    const p = task.parse(req.body);
    res.json(
      await tx(async (c) => {
        const [rs] = await c.execute(
          "SELECT * FROM rooms WHERE id=? FOR UPDATE",
          [p.roomId],
        );
        if (!rs.length) throw fail("ไม่พบห้อง", 404);
        const [occupied] = await c.execute(
          "SELECT id FROM bookings WHERE room_id=? AND status='CheckedIn'",
          [p.roomId],
        );
        if (occupied.length) throw fail("ห้องมีผู้เข้าพัก กรุณาประสานเช็กเอาต์ก่อนปิดห้อง");
        await c.execute(
          "INSERT INTO hotel_tasks(room_id,kind,title,assignee_id,notes) VALUES(?,?,?,?,?)",
          [p.roomId, p.kind, p.title, p.assigneeId, p.notes],
        );
        await c.execute("UPDATE rooms SET status=? WHERE id=?", [
          p.kind === "Maintenance"
            ? "Maintenance"
            : rs[0].status === "Maintenance"
              ? "Maintenance"
              : "Cleaning",
          p.roomId,
        ]);
        return { ok: true };
      }),
    );
  });
  app.put("/api/staff/tasks/:id", front, async (req, res) => {
    const p = z
      .object({
        status: z.enum(["Open", "InProgress", "Done"]),
        assigneeId: id.nullable(),
        notes: z.string().max(2000),
      })
      .parse(req.body);
    res.json(
      await tx(async (c) => {
        const [found] = await c.execute(
          "SELECT room_id FROM hotel_tasks WHERE id=?",
          [id.parse(req.params.id)],
        );
        if (!found.length) throw fail("ไม่พบงาน", 404);
        const room = found[0].room_id;
        await c.execute("SELECT id FROM rooms WHERE id=? FOR UPDATE", [room]);
        const [rows] = await c.execute(
          "SELECT * FROM hotel_tasks WHERE id=? FOR UPDATE",
          [req.params.id],
        );
        if (rows[0].status === "Done") throw fail("งานปิดแล้ว");
        await c.execute(
          'UPDATE hotel_tasks SET status=?,assignee_id=?,notes=?,completed_at=IF(?="Done",UTC_TIMESTAMP(),NULL) WHERE id=?',
          [p.status, p.assigneeId, p.notes, p.status, req.params.id],
        );
        const [open] = await c.execute(
          'SELECT kind FROM hotel_tasks WHERE room_id=? AND status<>"Done"',
          [room],
        );
        const status = open.some((t) => t.kind === "Maintenance")
          ? "Maintenance"
          : open.length
            ? "Cleaning"
            : "Vacant";
        await c.execute(
          'UPDATE rooms SET status=? WHERE id=? AND status<>"Occupied"',
          [status, room],
        );
        return { ok: true };
      }),
    );
  });
  app.get("/api/staff/inventory", auth("Admin"), async (req, res) =>
    res.json(
      (await db.query("SELECT * FROM inventory ORDER BY active DESC,name"))[0],
    ),
  );
  app.post("/api/staff/inventory", auth("Admin"), async (req, res) => {
    const p = z
      .object({
        name: z.string().min(1).max(120),
        unit: z.string().min(1).max(30),
        minimum: z.number().nonnegative().max(1000000),
      })
      .parse(req.body);
    await db.execute(
      "INSERT INTO inventory(name,unit,minimum) VALUES(?,?,?)",
      Object.values(p),
    );
    res.json({ ok: true });
  });
  app.get("/api/staff/inventory/:id/history", auth("Admin"), async (req, res) =>
    res.json(
      (
        await db.execute(
          "SELECT m.*,u.name actor FROM stock_movements m JOIN users u ON u.id=m.actor_id WHERE item_id=? ORDER BY id DESC",
          [id.parse(req.params.id)],
        )
      )[0],
    ),
  );
  app.post("/api/staff/inventory/:id/move", auth("Admin"), async (req, res) => {
    const p = z
      .object({
        delta: z
          .number()
          .min(-1000000)
          .max(1000000)
          .multipleOf(0.01)
          .refine((n) => n !== 0),
        note: z.string().trim().min(1).max(500),
      })
      .parse(req.body);
    res.json(
      await tx(async (c) => {
        const [rows] = await c.execute(
          "SELECT * FROM inventory WHERE id=? FOR UPDATE",
          [id.parse(req.params.id)],
        );
        if (!rows.length) throw fail("ไม่พบสินค้า", 404);
        if (Number(rows[0].quantity) + p.delta < 0) throw fail("จำนวนสินค้าไม่พอ");
        await c.execute("UPDATE inventory SET quantity=quantity+? WHERE id=?", [
          p.delta,
          req.params.id,
        ]);
        await c.execute(
          "INSERT INTO stock_movements(item_id,delta,note,actor_id) VALUES(?,?,?,?)",
          [req.params.id, p.delta, p.note, req.user.id],
        );
        return { ok: true };
      }),
    );
  });
}
