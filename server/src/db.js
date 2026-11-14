import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
export const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.MYSQL_USER || "ruenrom",
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || "ruenrom",
  dateStrings: true,
  decimalNumbers: true,
  connectionLimit: 10,
});
export async function init() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120) NOT NULL,email VARCHAR(190) NOT NULL UNIQUE,password_hash VARCHAR(255) NOT NULL,role ENUM('Customer','Admin','Receptionist','Accounting') NOT NULL DEFAULT 'Customer',active BOOLEAN NOT NULL DEFAULT TRUE)`,
    `CREATE TABLE IF NOT EXISTS reviews(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,rating TINYINT UNSIGNED NOT NULL,body VARCHAR(500) NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id),CHECK(rating BETWEEN 1 AND 5))`,
    `CREATE TABLE IF NOT EXISTS sessions(token CHAR(64) PRIMARY KEY,user_id INT NOT NULL,expires_at DATETIME NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS rooms(id INT AUTO_INCREMENT PRIMARY KEY,number VARCHAR(10) NOT NULL UNIQUE,name VARCHAR(120) NOT NULL,type VARCHAR(40) NOT NULL,price DECIMAL(12,2) NOT NULL,capacity INT NOT NULL,size INT NOT NULL DEFAULT 32,image_url VARCHAR(1000) NOT NULL,status ENUM('Vacant','Occupied','Cleaning','Maintenance') NOT NULL DEFAULT 'Vacant',active BOOLEAN NOT NULL DEFAULT TRUE,is_lucky BOOLEAN NOT NULL DEFAULT FALSE)`,
    `CREATE TABLE IF NOT EXISTS promotions(id INT AUTO_INCREMENT PRIMARY KEY,code VARCHAR(40) UNIQUE NOT NULL,name VARCHAR(120) NOT NULL,percent DECIMAL(5,2) NOT NULL,rule ENUM('Weekend','EarlyBird','Member','Lucky','LongStay') NOT NULL,start_date DATE NOT NULL,end_date DATE NOT NULL,active BOOLEAN NOT NULL DEFAULT TRUE)`,
    `CREATE TABLE IF NOT EXISTS packages(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120) NOT NULL,price DECIMAL(12,2) NOT NULL,per_night BOOLEAN NOT NULL DEFAULT FALSE,active BOOLEAN NOT NULL DEFAULT TRUE)`,
    `CREATE TABLE IF NOT EXISTS bookings(id VARCHAR(40) PRIMARY KEY,user_id INT NOT NULL,room_id INT NOT NULL,check_in DATE NOT NULL,check_out DATE NOT NULL,guests INT NOT NULL,guest_name VARCHAR(120) NOT NULL,email VARCHAR(190) NOT NULL,phone VARCHAR(30) NOT NULL,requests TEXT NOT NULL,packages JSON NOT NULL,room_total DECIMAL(12,2) NOT NULL,package_total DECIMAL(12,2) NOT NULL,discount DECIMAL(12,2) NOT NULL,total DECIMAL(12,2) NOT NULL,deposit DECIMAL(12,2) NOT NULL,paid DECIMAL(12,2) NOT NULL DEFAULT 0,status ENUM('Pending','Confirmed','CheckedIn','Completed','Cancelled') NOT NULL DEFAULT 'Pending',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(room_id) REFERENCES rooms(id),INDEX availability(room_id,check_in,check_out))`,
    `CREATE TABLE IF NOT EXISTS payments(id INT AUTO_INCREMENT PRIMARY KEY,booking_id VARCHAR(40) NOT NULL,amount DECIMAL(12,2) NOT NULL,kind VARCHAR(40) NOT NULL,paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(booking_id) REFERENCES bookings(id))`,
    `CREATE TABLE IF NOT EXISTS seed_versions(id INT PRIMARY KEY)`,
  ];
  for (const sql of statements) await db.query(sql);
  const c = await db.getConnection();
  await c.query("SELECT GET_LOCK('ruenrom_seed',30)");
  try {
    await c.beginTransaction();
    const [done] = await c.query("SELECT id FROM seed_versions WHERE id=1");
    if (!done.length) {
      const names = [
        "Siam Classic Room",
        "Deluxe River View",
        "Heritage Suite",
        "Ruenrom Penthouse",
      ];
      const photos = [
        "photo-1566665797739-1674de7a421a",
        "photo-1590490360182-c33d57733427",
        "photo-1582719478250-c89cae4dc85b",
        "photo-1566073771259-6a8506099945",
      ];
      for (let i = 0; i < 20; i++) {
        const t = i < 8 ? 0 : i < 14 ? 1 : i < 18 ? 2 : 3;
        await c.execute(
          "INSERT INTO rooms(number,name,type,price,capacity,size,image_url,is_lucky) VALUES(?,?,?,?,?,?,?,?)",
          [
            i === 18 ? "888" : i === 19 ? "999" : String(101 + i),
            names[t],
            ["Classic", "Deluxe", "Suite", "Penthouse"][t],
            [2400, 3200, 4500, 8900][t],
            t >= 2 ? 4 : 2,
            [32, 42, 64, 120][t],
            `https://images.unsplash.com/${photos[t]}?auto=format&fit=crop&w=1200&q=85`,
            i >= 18,
          ],
        );
      }
      for (const [code, name, percent, rule] of [
        ["WEEKEND12", "สุดสัปดาห์", 12, "Weekend"],
        ["EARLY20", "จองล่วงหน้า 30 วัน", 20, "EarlyBird"],
        ["MEMBER8", "สมาชิก", 8, "Member"],
        ["LUCKY12", "ห้องเลขมงคล", 12, "Lucky"],
        ["ESCAPE20", "พัก 5 คืนขึ้นไป", 20, "LongStay"],
      ])
        await c.execute(
          "INSERT INTO promotions(code,name,percent,rule,start_date,end_date) VALUES(?,?,?,?,CURRENT_DATE,DATE_ADD(CURRENT_DATE,INTERVAL 2 YEAR))",
          [code, name, percent, rule],
        );
      await c.query(
        "INSERT INTO packages(name,price,per_night) VALUES('อาหารเช้า',350,TRUE),('รถรับส่งสนามบิน',650,FALSE)",
      );
      await c.query("INSERT INTO seed_versions VALUES(1)");
    }
    if (process.env.SEED_DEMO === "true") {
      if (!process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length < 10)
        throw new Error("DEMO_PASSWORD must have at least 10 characters");
      const hash = await bcrypt.hash(process.env.DEMO_PASSWORD, 12);
      for (const role of ["Customer", "Admin", "Receptionist", "Accounting"])
        await c.execute(
          "INSERT IGNORE INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",
          [role, `${role.toLowerCase()}@ruenrom.test`, hash, role],
        );
    }
    await c.commit();
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    await c.query("SELECT RELEASE_LOCK('ruenrom_seed')");
    c.release();
  }
}