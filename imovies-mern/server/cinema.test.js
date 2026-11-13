// Run with:  node --test server/tests      (Node 18+, no extra packages needed)
const test = require('node:test');
const assert = require('node:assert');
const cinema = require('../utils/cinema');
const { validatePayment, luhn, brandOf } = require('../utils/payment');

const THEATRE = 'PVR Phoenix Palladium, Lower Parel';
const big = () => { // find a Large screen so IMAX/3D cases can be tested
  for (const n of ['PVR Orion Mall, Rajajinagar', 'INOX Garuda Mall, Magrath Road', 'AMB Cinemas, Gachibowli', 'Sathyam Cinemas, Royapettah', 'INOX Inorbit Mall, Malad', THEATRE, 'Metro INOX, Marine Lines', 'Gaiety Galaxy, Bandra'])
    if (cinema.getLayout(n).size === 'Large') return n;
  throw new Error('no large theatre found');
};

test('layouts are deterministic and consistent', () => {
  const l = cinema.getLayout(THEATRE);
  assert.strictEqual(cinema.getLayout(THEATRE), l);
  assert.strictEqual(l.totalSeats, l.rows.reduce((a, r) => a + r.seats, 0));
  assert.ok(cinema.allSeatIds(THEATRE).length === l.totalSeats);
});
test('seat validation', () => {
  const first = cinema.allSeatIds(THEATRE)[0];
  assert.ok(cinema.isValidSeat(THEATRE, first));
  assert.ok(!cinema.isValidSeat(THEATRE, 'Z9'));
  assert.ok(!cinema.isValidSeat(THEATRE, 'A99'));
  assert.ok(!cinema.isValidSeat(THEATRE, 'A0'));
});
test('premium classes and formats cost more', () => {
  const l = cinema.getLayout(THEATRE);
  const silver = l.rows.find((r) => r.cls === 'S').row;
  const best = l.rows[0].row;
  assert.ok(cinema.seatPrice(best, THEATRE) >= cinema.seatPrice(silver, THEATRE));
  assert.strictEqual(cinema.seatPrice(silver, THEATRE, '3D') - cinema.seatPrice(silver, THEATRE, '2D'), 50);
});
test('format support follows screen size', () => {
  const small = ['x', 'y', 'z', 'Small cinema', 'Tiny', 'Mini'].map((n) => `${n} Cinema`).find((n) => cinema.getLayout(n).size === 'Small');
  assert.ok(cinema.supportsFormat(small, '2D'));
  assert.ok(!cinema.supportsFormat(small, '3D'));
  assert.ok(!cinema.supportsFormat(small, 'IMAX 2D'));
  assert.ok(cinema.supportsFormat(big(), 'IMAX 3D'));
});
test('booking price is calculated on the server', () => {
  const l = cinema.getLayout(THEATRE);
  const seats = [`${l.rows[0].row}1`, `${l.rows[l.rows.length - 1].row}1`];
  const p = cinema.priceBooking({ theatre: THEATRE, seats, snacks: [1, 0, 1], coupon: 'imovies10' });
  assert.strictEqual(p.snacks, 220 + 380);
  assert.strictEqual(p.fee, 50);
  assert.strictEqual(p.discount, Math.round(p.tickets * 0.1));
  assert.strictEqual(p.total, p.tickets + p.snacks + p.fee - p.discount);
  assert.strictEqual(cinema.priceBooking({ theatre: THEATRE, seats: [seats[0]], coupon: 'FIRST50' }).discount, 50);
});
test('booking validation rejects bad input', () => {
  const ok = cinema.allSeatIds(THEATRE)[0];
  assert.throws(() => cinema.priceBooking({ theatre: THEATRE, seats: [] }), /at least one/);
  assert.throws(() => cinema.priceBooking({ theatre: THEATRE, seats: [ok, ok] }), /Duplicate/);
  assert.throws(() => cinema.priceBooking({ theatre: THEATRE, seats: ['Z99'] }), /Invalid seat/);
  assert.throws(() => cinema.priceBooking({ theatre: THEATRE, seats: [ok], coupon: 'FREE100' }), /Invalid coupon/);
  assert.throws(() => cinema.priceBooking({ theatre: THEATRE, seats: [ok], format: '8K' }), /Unknown format/);
  assert.throws(() => cinema.priceBooking({ theatre: THEATRE, seats: cinema.allSeatIds(THEATRE).slice(0, 9) }), /up to 8/);
  const snack = cinema.priceBooking({ theatre: THEATRE, seats: [ok], snacks: [999, -5, 'x'] });
  assert.deepStrictEqual(snack.snackQty, [10, 0, 0]); // clamped
});
test('past shows and unreleased movies cannot be booked', () => {
  const now = { date: '2026-11-12', minutes: 16 * 60 }; // 4:00 PM IST
  assert.ok(cinema.isPast('2026-11-11', '09:30 AM', now));
  assert.ok(cinema.isPast('2026-11-12', '04:00 PM', now));
  assert.ok(!cinema.isPast('2026-11-12', '07:15 PM', now));
  assert.ok(cinema.notReleased({ releaseDate: '2026-12-01' }, '2026-11-30'));
  assert.ok(!cinema.notReleased({ releaseDate: '2026-12-01' }, '2026-12-01'));
  assert.deepStrictEqual(cinema.bookableShows({ id: 1, releaseDate: '2026-12-01' }, THEATRE, '2026-11-20', '2D', now), []);
  assert.ok(cinema.bookableShows({ id: 1 }, THEATRE, '2026-11-13', '2D', now).length > 0);
});
test('show keys are unique per show and format', () => {
  const a = cinema.showKey({ city: 'Pune', theatre: THEATRE, movieId: 1, date: '2026-11-13', time: '04:00 PM' });
  const b = cinema.showKey({ city: 'Pune', theatre: THEATRE, movieId: 1, date: '2026-11-13', time: '04:00 PM', format: '3D' });
  assert.notStrictEqual(a, b);
  assert.ok(a.endsWith('04:00 PM'));
});

test('card validation: Luhn, expiry, CVV and Amex rules', () => {
  const now = new Date('2026-11-12');
  const good = { method: 'card', cardNumber: '4111 1111 1111 1111', cardName: 'Asha Rao', expiry: '12/29', cvv: '123' };
  const r = validatePayment(good, now);
  assert.ok(r.ok);
  assert.deepStrictEqual(r.summary, { method: 'card', brand: 'Visa', last4: '1111' }); // never the full number
  assert.ok(validatePayment({ ...good, cardNumber: '4111111111111112' }, now).errors.cardNumber);
  assert.ok(validatePayment({ ...good, expiry: '10/26' }, now).errors.expiry); // expired
  assert.ok(validatePayment({ ...good, expiry: '13/29' }, now).errors.expiry);
  assert.ok(validatePayment({ ...good, cvv: '12' }, now).errors.cvv);
  assert.ok(validatePayment({ method: 'card', cardNumber: '378282246310005', cardName: 'A B', expiry: '12/29', cvv: '1234' }, now).ok); // Amex
  assert.ok(luhn('4111111111111111') && !luhn('4111111111111112'));
  assert.strictEqual(brandOf('5555555555554444'), 'Mastercard');
});
test('UPI, net banking and unknown methods', () => {
  assert.ok(validatePayment({ method: 'upi', app: 'PhonePe', upiId: 'asha@okhdfcbank' }).ok);
  assert.ok(validatePayment({ method: 'upi', app: 'PhonePe', upiId: 'not-an-id' }).errors.upiId);
  assert.ok(validatePayment({ method: 'upi', app: 'Fake', upiId: 'a.b@ybl' }).errors.app);
  assert.ok(validatePayment({ method: 'bank', bank: 'HDFC Bank' }).ok);
  assert.ok(validatePayment({ method: 'bank', bank: 'Nowhere Bank' }).errors.bank);
  assert.ok(validatePayment({ method: 'crypto' }).errors.method);
});
