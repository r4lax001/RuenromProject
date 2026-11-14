// Additive tables only: existing bookings, users and payments remain authoritative.
export async function initOperations(db) {
  const sql = [
    `CREATE TABLE IF NOT EXISTS room_types (name VARCHAR(40) PRIMARY KEY, description VARCHAR(1000) NOT NULL DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS hotel_settings (id INT PRIMARY KEY, data JSON NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS employees (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, department VARCHAR(80) NOT NULL, position VARCHAR(80) NOT NULL, phone VARCHAR(30) NOT NULL DEFAULT '', active BOOLEAN NOT NULL DEFAULT TRUE)`,
    `CREATE TABLE IF NOT EXISTS shifts (id INT AUTO_INCREMENT PRIMARY KEY, employee_id INT NOT NULL, starts_at DATETIME NOT NULL, ends_at DATETIME NOT NULL, clock_in DATETIME NULL, clock_out DATETIME NULL, FOREIGN KEY(employee_id) REFERENCES employees(id))`,
    `CREATE TABLE IF NOT EXISTS hotel_tasks (id INT AUTO_INCREMENT PRIMARY KEY, room_id INT NOT NULL, kind ENUM('Cleaning','Maintenance') NOT NULL, title VARCHAR(200) NOT NULL, assignee_id INT NULL, status ENUM('Open','InProgress','Done') NOT NULL DEFAULT 'Open', notes VARCHAR(2000) NOT NULL DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME NULL, FOREIGN KEY(room_id) REFERENCES rooms(id), FOREIGN KEY(assignee_id) REFERENCES employees(id))`,
    `CREATE TABLE IF NOT EXISTS inventory (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, unit VARCHAR(30) NOT NULL, quantity DECIMAL(12,2) NOT NULL DEFAULT 0, minimum DECIMAL(12,2) NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE)`,
    `CREATE TABLE IF NOT EXISTS stock_movements (id INT AUTO_INCREMENT PRIMARY KEY, item_id INT NOT NULL, delta DECIMAL(12,2) NOT NULL, note VARCHAR(500) NOT NULL, actor_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(item_id) REFERENCES inventory(id), FOREIGN KEY(actor_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS booking_charges (id INT AUTO_INCREMENT PRIMARY KEY, booking_id VARCHAR(40) NOT NULL, label VARCHAR(200) NOT NULL, amount DECIMAL(12,2) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(booking_id) REFERENCES bookings(id))`,
    `CREATE TABLE IF NOT EXISTS stay_events (booking_id VARCHAR(40) PRIMARY KEY, verified BOOLEAN NOT NULL DEFAULT FALSE, checked_in_at DATETIME NULL, checked_out_at DATETIME NULL, actor_id INT NOT NULL, FOREIGN KEY(booking_id) REFERENCES bookings(id))`,
    `CREATE TABLE IF NOT EXISTS customer_notes (email VARCHAR(190) PRIMARY KEY, note VARCHAR(2000) NOT NULL DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS receipt_requests (request_id VARCHAR(80) PRIMARY KEY, booking_id VARCHAR(40) NOT NULL, payment_id INT NOT NULL, FOREIGN KEY(payment_id) REFERENCES payments(id))`,
  ];
  for (const statement of sql) await db.query(statement);
  await db.query(
    "INSERT IGNORE INTO room_types(name) SELECT DISTINCT type FROM rooms",
  );
  await db.execute("INSERT IGNORE INTO hotel_settings VALUES(1,?)", [
    JSON.stringify({
      name: "RUENROM HOTEL",
      address: "",
      phone: "",
      email: "",
      checkIn: "14:00",
      checkOut: "12:00",
      policy: "มัดจำ 20% เพื่อยืนยันการจอง เงินที่ชำระแล้วไม่คืน",
    }),
  ]);
}
