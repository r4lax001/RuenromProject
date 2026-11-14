export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function days(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}
export function quote(room, input, promotions, packages, member = true) {
  const { checkIn, checkOut, guests, packageIds = [], promotionId } = input;
  const nights = days(checkIn, checkOut);
  if (
    checkIn < today() ||
    !Number.isInteger(nights) ||
    nights < 1 ||
    nights > 365
  )
    throw new Error("วันที่เข้าพักไม่ถูกต้อง (1–365 คืน และไม่ย้อนหลัง)");
  if (guests < 1 || guests > room.capacity)
    throw new Error("จำนวนผู้เข้าพักเกินความจุห้อง");
  const roomTotal = Math.round(Number(room.price) * 100) * nights;
  let discount = 0;
  if (promotionId) {
    const p = promotions.find(
      (p) =>
        p.id === promotionId &&
        p.active &&
        p.start_date <= today() &&
        p.end_date >= today(),
    );
    const weekend = Array.from({ length: nights }, (_, i) =>
      new Date(Date.parse(checkIn) + i * 86400000).getUTCDay(),
    ).every((d) => d === 0 || d === 6);
    if (
      !p ||
      !{
        Weekend: weekend,
        EarlyBird: days(today(), checkIn) >= 30,
        Member: member,
        Lucky: !!room.is_lucky,
        LongStay: nights >= 5,
      }[p.rule]
    )
      throw new Error("ไม่เข้าเงื่อนไขโปรโมชั่น");
    discount = Math.round((roomTotal * Number(p.percent)) / 100);
  }
  const selected = [...new Set(packageIds)].map((id) => {
    const p = packages.find((p) => p.id === id && p.active);
    if (!p) throw new Error("ไม่พบแพ็กเกจ");
    return p;
  });
  const packageTotal = selected.reduce(
    (n, p) =>
      n +
      Math.round(Number(p.price) * 100) * guests * (p.per_night ? nights : 1),
    0,
  );
  const total = roomTotal + packageTotal - discount;
  return {
    nights,
    roomTotal: roomTotal / 100,
    packageTotal: packageTotal / 100,
    discount: discount / 100,
    total: total / 100,
    deposit: Math.round(total * 0.2) / 100,
    packages: selected.map((p) => p.name),
  };
}