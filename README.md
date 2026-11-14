# RUENROM HOTEL — React + Express + MySQL

เวอร์ชัน JavaScript แยกจากโค้ด C# เดิมใน `../Project 2.0 2/RUENROM HOTEL` ไม่ต้องติดตั้ง .NET

- Frontend: Vite + ReactJS (JavaScript), responsive Thai UI
- Backend: Node.js 24 + Express 5 REST API
- Database: MySQL 8.4 ใน Docker พร้อม persistent volume
- Docker Compose รันได้ทั้งเว็บและฐานข้อมูล หรือรันเฉพาะ MySQL แล้วพัฒนาเว็บบนเครื่อง

## รันทั้งหมดผ่าน Docker

เปิด Docker Desktop ให้ Engine พร้อมใช้งาน แล้วเปิด PowerShell ในโฟลเดอร์นี้:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

If port `3307` is already in use, set `MYSQL_PORT` in `.env` to an available host port.

เปิด http://localhost:3000 และตรวจ http://localhost:3000/api/health

```powershell
docker compose logs -f app
docker compose down
```

คำสั่ง down เก็บข้อมูลใน volume ไว้ ห้ามเพิ่ม `-v` หากต้องการเก็บข้อมูลเดิม

## พัฒนาบนเครื่อง (MySQL ผ่าน Docker)

ต้องใช้ Node.js 22.12+ หรือ 24:

```powershell
Copy-Item .env.example .env
docker compose up -d mysql
npm install
npm run dev
```

React: http://localhost:5173, Express: http://localhost:3000, MySQL: localhost:3307
Vite proxy ส่ง `/api` ไป Express โดยใช้ cookie session เหมือนเว็บจริง

```powershell
npm test
npm run build
npm start
```

## บัญชีสาธิต

เมื่อ `.env` ตั้ง `SEED_DEMO=true` ระบบจะสร้างบัญชีต่อไปนี้ครั้งแรกด้วยรหัสผ่านจาก `DEMO_PASSWORD` (ตัวอย่าง `Ruenrom123!`):

| บทบาท | อีเมล |
|---|---|
| ลูกค้า | customer@ruenrom.test |
| ผู้ดูแล | admin@ruenrom.test |
| พนักงานต้อนรับ | receptionist@ruenrom.test |
| บัญชี | accounting@ruenrom.test |

การเปลี่ยน DEMO_PASSWORD หลังสร้างบัญชีแล้วไม่เปลี่ยนรหัสบัญชีเก่า ปิด SEED_DEMO และเปลี่ยนข้อมูลบัญชีสาธิตก่อนเปิดสาธารณะ การจ่ายมัดจำเป็นการจำลองและจะถูกปิดเมื่อ SEED_DEMO ไม่ใช่ true ยังไม่ได้เชื่อม gateway รับเงินจริง

## ฟังก์ชัน

- ลูกค้า: สมัคร / เข้า / ออกจากระบบ ค้นหาห้องว่าง เลือกโปรโมชั่นและแพ็กเกจ ตรวจราคา จอง มัดจำจำลอง ประวัติ ยกเลิก และพิมพ์หน้าการจองเป็น PDF ผ่านเบราว์เซอร์
- Admin: แก้ไข / เพิ่มห้อง โปรโมชั่น แพ็กเกจ ปิดใช้งานแทนลบข้อมูลประวัติ จัดการบทบาทและเปิดปิดผู้ใช้ ดูการจองและรายรับ
- Receptionist: เช็กอิน รับชำระส่วนที่เหลือและเช็กเอาต์ เปลี่ยนสถานะห้องว่าง / ทำความสะอาด / ซ่อมบำรุง
- Accounting: ดูรายรับตามช่วงวันที่ แบ่งรายได้ห้อง / แพ็กเกจ ส่งออก CSV ที่ป้องกันสูตรจากข้อความ
- MySQL เก็บผู้ใช้ sessions ห้อง โปรโมชั่น แพ็กเกจ การจอง และการชำระ ไม่ใช้ in-memory store
- Seed 20 ห้อง: Classic 8, Deluxe 6, Suite 4, Penthouse 2 (888 / 999)
- มัดจำ 20%, ยกเลิกไม่คืนเงิน, ช่วงจอง `[checkIn, checkOut)`, สูงสุด 365 คืน
- ล็อกแถวห้องใน transaction ก่อนตรวจห้องว่างและสร้างการจอง รวมถึงเมื่อเปลี่ยนสถานะการจอง ป้องกันการจองซ้อนและชำระซ้ำ
- bcrypt hash รหัสผ่าน, session token แบบสุ่มเก็บ hash ในฐานข้อมูล, HttpOnly cookie, role checks ฝั่ง API, request validation และ login rate limit

## ข้อจำกัดการย้าย

สร้าง UI React ใหม่โดยอ้างอิงฟังก์ชันและโทนสีเดิม ไม่ได้แปลง Razor แบบตรงทุกพิกเซล ข้อมูลของ HotelStore เดิมอยู่ในหน่วยความจำจึงไม่มีฐานข้อมูลเก่าให้ย้ายอัตโนมัติ ระบบใหม่เริ่มด้วย seed ที่บันทึกใน MySQL การพิมพ์ PDF ใช้หน้าการจองของเบราว์เซอร์ ไม่ใช่ใบเสร็จภาษี

ภาพห้องใช้ Unsplash และฟอนต์ใช้ Google Fonts ต้องใช้อินเทอร์เน็ต (มีฟอนต์สำรอง) ก่อนใช้งานจริงควรเพิ่ม HTTPS, การสำรองข้อมูล, ผู้ให้บริการชำระเงินจริง และระบบกู้คืนรหัสผ่าน ตั้ง `COOKIE_SECURE=true` เมื่อใช้ HTTPS

## สถานะตรวจสอบในเครื่องที่จัดทำ

ดู `VALIDATION.md` สำหรับผลตรวจจริงและสิ่งที่ยังทดสอบไม่ได้
