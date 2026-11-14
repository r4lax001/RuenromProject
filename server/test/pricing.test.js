import { test } from "node:test";
import assert from "node:assert/strict";
import { quote, today } from "../src/pricing.js";
const add = (d, n) =>
  new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10);
const room = { price: 2400, capacity: 2, is_lucky: false };
const input = {
  checkIn: add(today(), 40),
  checkOut: add(today(), 42),
  guests: 2,
  packageIds: [1, 1, 2],
  promotionId: 2,
};
const promotions = [
  {
    id: 2,
    active: 1,
    start_date: today(),
    end_date: add(today(), 365),
    rule: "EarlyBird",
    percent: 20,
  },
];
const packages = [
  { id: 1, active: 1, name: "Breakfast", price: 350, per_night: 1 },
  { id: 2, active: 1, name: "Transfer", price: 650, per_night: 0 },
];
test("early bird discount applies only to room; packages deduplicate; deposit rounds in cents", () => {
  assert.deepEqual(quote(room, input, promotions, packages), {
    nights: 2,
    roomTotal: 4800,
    packageTotal: 2700,
    discount: 960,
    total: 6540,
    deposit: 1308,
    packages: ["Breakfast", "Transfer"],
  });
});
test("reject past, reversed, overlong dates and over capacity", () => {
  for (const patch of [
    { checkIn: add(today(), -1) },
    { checkOut: input.checkIn },
    { checkOut: add(input.checkIn, 366) },
    { guests: 3 },
  ])
    assert.throws(() =>
      quote(room, { ...input, ...patch }, promotions, packages),
    );
});
test("reject unqualified promotion and inactive package", () => {
  assert.throws(() =>
    quote(room, { ...input, checkIn: add(today(), 1) }, promotions, packages),
  );
  assert.throws(() =>
    quote(
      room,
      input,
      promotions,
      packages.map((p) => ({ ...p, active: 0 })),
    ),
  );
});
test("member discount requires membership; lucky discount requires lucky room", () => {
  for (const rule of ["Member", "Lucky"])
    assert.throws(() =>
      quote(
        room,
        { ...input, promotionId: 3 },
        [{ ...promotions[0], id: 3, rule }],
        packages,
        false,
      ),
    );
});
test("weekend promotion checks every occupied night and excludes checkout", () => {
  let saturday = add(today(), 1);
  while (new Date(saturday).getUTCDay() !== 6) saturday = add(saturday, 1);
  const p = [{ ...promotions[0], id: 2, rule: "Weekend", percent: 12 }];
  assert.equal(
    quote(
      room,
      { ...input, checkIn: saturday, checkOut: add(saturday, 2) },
      p,
      packages,
    ).discount,
    576,
  );
  assert.throws(() =>
    quote(
      room,
      { ...input, checkIn: saturday, checkOut: add(saturday, 3) },
      p,
      packages,
    ),
  );
});