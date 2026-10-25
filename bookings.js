import { Router } from 'express';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { ah, httpError, theatresOf, showsFor, showKey, takenSet, quote, COUPONS } from '../utils/helpers.js';

const r = Router();

// create a booking – availability, price and coupon are all validated on the server
r.post('/', protect, ah(async (req, res) => {
  const { movieId, city, theatre, date, time, seats, snacks = [0, 0, 0], coupon = '' } = req.body;
  const movie = await Movie.findById(movieId);
  if (!movie) throw httpError(404, 'Movie not found');
  const th = theatresOf(city).find(t => t.name === theatre);
  if (!th) throw httpError(400, 'Invalid theatre');
  if (!showsFor(String(movie._id), theatre).includes(time)) throw httpError(400, 'Invalid showtime');
  if (!Array.isArray(seats) || !seats.length || seats.length > 8 || new Set(seats).size !== seats.length || !seats.every(s => /^[A-G](10|[1-9])$/.test(s)))
    throw httpError(400, 'Choose 1 to 8 valid seats');

  const key = showKey(city, theatre, movie._id, date, time);
  const booked = (await Booking.find({ key }).lean()).flatMap(b => b.seats);
  const taken = takenSet(key, booked);
  const clash = seats.filter(s => taken.has(s));
  if (clash.length) throw httpError(409, `Seats already taken: ${clash.join(', ')}`);

  const sn = [0, 1, 2].map(i => Math.max(0, Math.min(10, +snacks[i] || 0)));
  const q = quote({ seats, base: th.price, snacks: sn, coupon });
  const booking = await Booking.create({
    ref: 'IM' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    user: req.user._id, movie: movie._id, movieTitle: movie.title,
    city, theatre, date, time, seats, snacks: sn, coupon: COUPONS[coupon] ? coupon : '', total: q.total, key,
  });
  res.status(201).json(booking);
}));

r.get('/mine', protect, ah(async (req, res) => res.json(await Booking.find({ user: req.user._id }).sort('-createdAt'))));

r.get('/stats', protect, adminOnly, ah(async (req, res) => {
  const [bookings, movies, users] = await Promise.all([Booking.find().select('total'), Movie.countDocuments(), User.countDocuments()]);
  res.json({ bookings: bookings.length, revenue: bookings.reduce((a, b) => a + b.total, 0), movies, users });
}));

// cancel – seats are released automatically because availability is computed from bookings
r.delete('/:id', protect, ah(async (req, res) => {
  const b = await Booking.findById(req.params.id);
  if (!b) throw httpError(404, 'Booking not found');
  if (String(b.user) !== String(req.user._id) && req.user.role !== 'admin') throw httpError(403, 'Not your booking');
  await b.deleteOne();
  res.json({ ok: true });
}));

export default r;
