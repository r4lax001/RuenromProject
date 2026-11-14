import assert from 'node:assert/strict';

// Opt-in integration test against the local demo server only.
assert.equal(process.env.SEED_DEMO, 'true', 'Requires SEED_DEMO=true');
assert.ok(process.env.DEMO_PASSWORD, 'Requires the demo account password');
const base = 'http://localhost:3000/api';
let cookie = '';
let bookingId;
const checks = [];
async function request(path, body, expected = 200) {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Cookie: cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(data)}`);
  if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  return data;
}
function pass(name) { checks.push(name); console.log(`PASS ${name}`); }
const date = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const checkIn = date(60), checkOut = date(62);
const search = `/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`;
try {
  await request('/health');
  await request('/auth/login', { email: 'customer@ruenrom.test', password: process.env.DEMO_PASSWORD });
  const rooms = await request(search);
  assert.ok(rooms.length, 'No available rooms for test');
  const room = rooms[0];
  pass('Room available before booking');
  const input = { roomId: room.id, checkIn, checkOut, guests: 2, packageIds: [] };
  const quote = await request('/quote', input);
  const payload = { ...input, guestName: 'QA Booking Flow Test', email: 'qa@ruenrom.test', phone: '0800000000', requests: 'Automated local demo test; cancel after verification.', acceptPolicy: true };
  const created = await request('/bookings', payload, 201);
  bookingId = created.id;
  assert.equal(created.total, quote.total);
  assert.equal(created.deposit, quote.deposit);
  const booking = async () => (await request('/bookings')).find(b => b.id === bookingId);
  assert.equal((await booking()).status, 'Pending');
  pass('Booking created Pending with quoted price');
  assert.ok(!(await request(search)).some(r => r.id === room.id));
  pass('Pending booking blocks room availability');
  await request('/bookings', payload, 409);
  pass('Overlapping duplicate booking rejected');
  await request(`/bookings/${bookingId}/deposit`, {});
  let saved = await booking();
  assert.equal(saved.status, 'Confirmed');
  assert.equal(Number(saved.paid), quote.deposit);
  pass('Demo deposit confirms booking and saves correct amount');
  await request(`/bookings/${bookingId}/deposit`, {}, 400);
  assert.equal(Number((await booking()).paid), quote.deposit);
  pass('Repeated deposit rejected without double charge');
  assert.ok(!(await request(search)).some(r => r.id === room.id));
  pass('Confirmed booking keeps room unavailable');
  await request(`/bookings/${bookingId}/cancel`, {});
  saved = await booking();
  assert.equal(saved.status, 'Cancelled');
  assert.equal(Number(saved.paid), quote.deposit);
  pass('Cancellation saved; historical deposit preserved (no refund policy)');
  assert.ok((await request(search)).some(r => r.id === room.id));
  pass('Cancelled room becomes available for the same dates');
  const after = await request('/quote', input);
  assert.equal(after.total, quote.total);
  pass('Room can be quoted again after cancellation');
  console.log(JSON.stringify({ bookingId, room: room.number, checkIn, checkOut, total: quote.total, deposit: quote.deposit, finalStatus: saved.status, passed: checks.length }, null, 2));
} finally {
  // Cleanup only the record created by this run, preserving its audit trail.
  if (bookingId) {
    const saved = (await request('/bookings')).find(b => b.id === bookingId);
    if (saved && ['Pending', 'Confirmed'].includes(saved.status)) await request(`/bookings/${bookingId}/cancel`, {});
  }
  if (cookie) await request('/auth/logout', {});
}
