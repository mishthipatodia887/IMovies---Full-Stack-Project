import { Router } from 'express';
import Booking from '../models/Booking.js';
import { ah, httpError, LOCATIONS, SNACKS, COUPONS, theatresOf, showsFor, showKey, takenSet } from '../utils/helpers.js';

const r = Router();

r.get('/locations', (req, res) => res.json(LOCATIONS));
r.get('/config', (req, res) => res.json({ snacks: SNACKS, coupons: COUPONS }));
r.get('/theatres', (req, res) => {
  if (!req.query.city) throw httpError(400, 'city is required');
  res.json(theatresOf(req.query.city));
});

// theatres + showtimes (with availability colour) for one movie, city and date
r.get('/shows', ah(async (req, res) => {
  const { movie, city, date } = req.query;
  if (!movie || !city || !date) throw httpError(400, 'movie, city and date are required');
  const booked = {};
  (await Booking.find({ movie, city, date }).lean()).forEach(b => (booked[b.key] ||= []).push(...b.seats));
  res.json(theatresOf(city).map(t => ({
    ...t,
    shows: showsFor(movie, t.name).map(time => {
      const key = showKey(city, t.name, movie, date, time);
      const free = 1 - takenSet(key, booked[key]).size / 70;
      return { time, status: free > .5 ? 'g' : free > .2 ? 'a' : 'r' };
    }),
  })));
}));

r.get('/seats', ah(async (req, res) => {
  const { movie, city, theatre, date, time } = req.query;
  const key = showKey(city, theatre, movie, date, time);
  const booked = (await Booking.find({ key }).lean()).flatMap(b => b.seats);
  res.json({ taken: [...takenSet(key, booked)] });
}));

export default r;
