import fs from 'fs';

const load = f => JSON.parse(fs.readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const TH = load('theatres.json');
export const LOCATIONS = load('locations.json');

export const SHOW_TIMES = ['09:30 AM', '12:45 PM', '04:00 PM', '07:15 PM', '10:30 PM'];
export const SNACKS = [{ name: '🍿 Popcorn', price: 220 }, { name: '🥤 Cold drink', price: 120 }, { name: '🍔 Combo', price: 380 }];
export const COUPONS = {
  IMOVIES10: { pct: 10, desc: '10% off on ticket price' },
  FIRST50: { flat: 50, desc: 'Flat ₹50 off on your booking' },
};
export const ROWS = 'ABCDEFG'.split('');

export const H = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
export const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const httpError = (status, message) => Object.assign(new Error(message), { status });

export const seatPrice = (row, base) => base + ('AB'.includes(row) ? 70 : 0);
export const showKey = (...p) => p.join('|');

// real theatres for major cities, generated sample names for the rest
export const theatresOf = city => {
  const real = TH.real[city];
  const names = real || [0, 1, 2, 3].map(i => `${TH.chains[(H(city) + i) % 6]} – ${TH.areas[(H(city) + i * 2) % 6]}, ${city}`);
  return names.map(name => ({ name, price: [180, 200, 210, 230, 250][H(name) % 5], real: !!real }));
};

export const showsFor = (movieId, theatre) => {
  const a = SHOW_TIMES.filter(t => H(movieId + theatre + t) % 5 < 3);
  return a.length ? a : [SHOW_TIMES[3]];
};

// deterministic "already sold" seats + seats really booked in the database
export const takenSet = (key, booked = []) => {
  const s = new Set(booked);
  for (const r of ROWS) for (let n = 1; n <= 10; n++) if (H(key + r + n) % 100 < 24) s.add(r + n);
  return s;
};

export const quote = ({ seats, base, snacks, coupon }) => {
  const tickets = seats.reduce((a, s) => a + seatPrice(s[0], base), 0);
  const snackTotal = SNACKS.reduce((a, x, i) => a + x.price * (snacks[i] || 0), 0);
  const fee = 25 * seats.length;
  const c = COUPONS[coupon];
  const discount = c && seats.length ? (c.pct ? Math.round(tickets * c.pct / 100) : Math.min(c.flat, tickets)) : 0;
  return { tickets, snackTotal, fee, discount, total: tickets + snackTotal + fee - discount };
};
