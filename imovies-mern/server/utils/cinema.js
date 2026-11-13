/**
 * Cinema rules shared by the booking API.
 * Ported 1:1 from the IMovies front-end (IMovies_Cinema_Booking__5_.html) so the server and the page agree.
 * The server must ALWAYS recompute prices and validate seats / shows / formats itself - never trust the client.
 * CommonJS module. If your server uses ES modules, change module.exports at the bottom to `export { ... }`.
 */

const SHOW_TIMES = ['09:30 AM', '12:45 PM', '04:00 PM', '07:15 PM', '10:30 PM'];
const THEATRE_BASE_PRICES = [180, 200, 210, 230, 250];
const SEAT_CLASSES = { S: ['Silver', 0], G: ['Gold', 50], P: ['Premium', 110], R: ['Recliner', 280] }; // [name, extra Rs per seat]
const FORMAT_SURCHARGE = { '2D': 0, '3D': 50, 'IMAX 2D': 100, 'IMAX 3D': 150, '4DX': 200 };
const SNACKS = [['Popcorn', 220], ['Cold drink', 120], ['Combo', 380]];
const CONVENIENCE_FEE_PER_SEAT = 25;
const MAX_SEATS_PER_BOOKING = 8;
const MAX_SNACK_QTY = 10;
const COUPONS = {
  IMOVIES10: (tickets) => Math.round(tickets * 0.1), // 10% off tickets
  FIRST50: (tickets) => Math.min(50, tickets), // flat Rs 50 off
};
const SIZE_FACTOR = { Small: 0.8, Medium: 1, Large: 1.2 };
const ROW_LETTERS = 'ABCDEFGHIJKL';

// Same string hash as the page - used for the deterministic demo data (screen sizes, showtimes, simulated sold seats).
const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/** Screen layout of a theatre: size, seat rows (letter, class, seats in row) and a price factor. */
const layoutCache = new Map();
function getLayout(theatreName) {
  if (layoutCache.has(theatreName)) return layoutCache.get(theatreName);
  const h = hash(theatreName);
  const size = ['Small', 'Medium', 'Large'][h % 3];
  const hasRecliners = size === 'Large' || (size === 'Medium' && hash(`${theatreName}r`) % 2 === 0);
  const spec = size === 'Small'
    ? [['S', 3, 8], ['G', 3, 8]]
    : size === 'Medium'
      ? [['S', 3, 10], ['G', 3, 10], ['P', 2, 10], ...(hasRecliners ? [['R', 1, 6]] : [])]
      : [['S', 4, 14], ['G', 4, 14], ['P', 2, 14], ['R', 2, 8]];
  const rows = []; const classOf = {}; let i = 0;
  spec.slice().reverse().forEach(([cls, count, width]) => { // best class sits in the first rows
    for (let j = 0; j < count; j += 1) { const r = ROW_LETTERS[i++]; rows.push({ row: r, cls, seats: width }); classOf[r] = cls; }
  });
  const layout = { size, hasRecliners, rows, classOf, totalSeats: rows.reduce((a, x) => a + x.seats, 0), priceFactor: SIZE_FACTOR[size] };
  layoutCache.set(theatreName, layout);
  return layout;
}

/** Base ticket price of a theatre (Silver seat, 2D). */
const theatrePrice = (theatreName) => Math.round((THEATRE_BASE_PRICES[hash(theatreName) % 5] * getLayout(theatreName).priceFactor) / 10) * 10;

/** Price of one seat. */
const seatPrice = (row, theatreName, format = '2D') => {
  const cls = getLayout(theatreName).classOf[row];
  if (!cls) throw new Error(`Invalid row ${row}`);
  return theatrePrice(theatreName) + SEAT_CLASSES[cls][1] + (FORMAT_SURCHARGE[format] || 0);
};

/** Does this theatre screen the format? 3D needs a Medium+ screen, IMAX a Large one, 4DX only some Large ones. */
function supportsFormat(theatreName, format) {
  if (!format || format === '2D') return true;
  const { size } = getLayout(theatreName);
  if (format === '3D') return size !== 'Small';
  if (format.startsWith('IMAX')) return size === 'Large';
  if (format === '4DX') return size === 'Large' && hash(`${theatreName}4`) % 2 === 0;
  return false;
}

/** All showtimes a movie has at a theatre (before removing past ones). */
function showTimes(movieId, theatreName, format = '2D') {
  const list = SHOW_TIMES.filter((t) => hash(`${movieId}${theatreName}${t}${format && format !== '2D' ? format : ''}`) % 5 < 3);
  return list.length ? list : [SHOW_TIMES[3]];
}

/** Current date/time in India (the page works in IST regardless of the visitor's time zone). */
function istNow(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
const minutesOf = (time) => { const [a, ampm] = time.split(' '); const [h, m] = a.split(':').map(Number); return (h % 12) * 60 + m + (ampm === 'PM' ? 720 : 0); };

/** A show that has already started cannot be booked. */
const isPast = (date, time, now = istNow()) => date < now.date || (date === now.date && minutesOf(time) <= now.minutes);
/** A movie with a releaseDate (YYYY-MM-DD) cannot be booked before it. */
const notReleased = (movie, date) => !!movie.releaseDate && date < movie.releaseDate;
const isComingSoon = (movie, now = istNow()) => !!movie.releaseDate && movie.releaseDate > now.date;

/** Showtimes a customer can still book on a given date. */
function bookableShows(movie, theatreName, date, format = '2D', now = istNow()) {
  if (notReleased(movie, date) || !supportsFormat(theatreName, format)) return [];
  return showTimes(movie.id, theatreName, format).filter((t) => !isPast(date, t, now));
}

/** Unique key of one show. Used for seat availability and the unique booking index. */
const showKey = ({ city, theatre, movieId, date, time, format = '2D' }) => `${city}|${theatre}|${movieId}|${date}|${time}${format && format !== '2D' ? `|${format}` : ''}`;

/** Every seat id of a theatre, e.g. ['A1', 'A2', ...]. */
const allSeatIds = (theatreName) => getLayout(theatreName).rows.flatMap((r) => Array.from({ length: r.seats }, (_, i) => `${r.row}${i + 1}`));
const isValidSeat = (theatreName, seatId) => {
  const m = /^([A-L])(\d{1,2})$/.exec(String(seatId));
  const row = m && getLayout(theatreName).rows.find((r) => r.row === m[1]);
  return !!row && Number(m[2]) >= 1 && Number(m[2]) <= row.seats;
};

/** Demo availability: a deterministic share of seats counts as already sold (replace with real data in production). */
function simulatedSoldSeats(key) {
  const theatre = key.split('|')[1];
  const sold = new Set();
  for (const r of getLayout(theatre).rows) for (let n = 1; n <= r.seats; n += 1) if (hash(`${key}${r.row}${n}`) % 100 < (r.cls === 'R' ? 16 : 24)) sold.add(`${r.row}${n}`);
  return sold;
}
/** green / amber / red indicator used on showtime pills. */
function availabilityLevel(soldCount, theatreName) {
  const free = 1 - soldCount / getLayout(theatreName).totalSeats;
  return free > 0.5 ? 'green' : free > 0.2 ? 'amber' : 'red';
}

/**
 * Server-side price of a booking. Throws on invalid input.
 * @param {{theatre:string, format?:string, seats:string[], snacks?:number[], coupon?:string}} b
 */
function priceBooking({ theatre, format = '2D', seats, snacks = [0, 0, 0], coupon = '' }) {
  if (!Array.isArray(seats) || seats.length === 0) throw new Error('Select at least one seat');
  if (seats.length > MAX_SEATS_PER_BOOKING) throw new Error(`You can book up to ${MAX_SEATS_PER_BOOKING} seats`);
  if (new Set(seats).size !== seats.length) throw new Error('Duplicate seats selected');
  if (!(format in FORMAT_SURCHARGE)) throw new Error('Unknown format');
  if (!supportsFormat(theatre, format)) throw new Error(`${format} is not available at this theatre`);
  seats.forEach((s) => { if (!isValidSeat(theatre, s)) throw new Error(`Invalid seat ${s}`); });
  const qty = SNACKS.map((_, i) => Math.min(MAX_SNACK_QTY, Math.max(0, Math.floor(Number(snacks[i]) || 0))));
  const code = String(coupon || '').trim().toUpperCase();
  if (code && !COUPONS[code]) throw new Error('Invalid coupon');

  const tickets = seats.reduce((sum, s) => sum + seatPrice(s[0], theatre, format), 0);
  const snackTotal = SNACKS.reduce((sum, [, price], i) => sum + price * qty[i], 0);
  const fee = CONVENIENCE_FEE_PER_SEAT * seats.length;
  const discount = code ? COUPONS[code](tickets) : 0;
  return { tickets, snacks: snackTotal, snackQty: qty, fee, discount, coupon: code, total: tickets + snackTotal + fee - discount };
}

module.exports = {
  SHOW_TIMES, SEAT_CLASSES, FORMAT_SURCHARGE, SNACKS, COUPONS, MAX_SEATS_PER_BOOKING,
  hash, getLayout, theatrePrice, seatPrice, supportsFormat, showTimes, istNow, minutesOf, isPast, notReleased, isComingSoon,
  bookableShows, showKey, allSeatIds, isValidSeat, simulatedSoldSeats, availabilityLevel, priceBooking,
};
