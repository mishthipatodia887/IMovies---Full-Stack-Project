import { Router } from 'express';
import Movie from '../models/Movie.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { ah, httpError } from '../utils/helpers.js';

const r = Router();
const SORTS = { pop: { createdAt: 1 }, rating: { rating: -1 }, name: { title: 1 }, dur: { duration: 1 } };

r.get('/', ah(async (req, res) => {
  const { q = '', industry, language, sort = 'pop' } = req.query;
  const filter = {};
  if (industry && industry !== 'All') filter.industry = industry;
  if (language && language !== 'All') filter.language = language;
  if (q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { genre: rx }, { language: rx }];
  }
  res.json(await Movie.find(filter).sort(SORTS[sort] || SORTS.pop));
}));

r.get('/:id', ah(async (req, res) => {
  const m = await Movie.findById(req.params.id);
  if (!m) throw httpError(404, 'Movie not found');
  res.json(m);
}));

r.post('/', protect, adminOnly, ah(async (req, res) => {
  const { title, industry, genre, language, duration, poster } = req.body;
  if (!title?.trim()) throw httpError(400, 'Title is required');
  res.status(201).json(await Movie.create({ title, industry, genre: genre || 'Drama', language: language || 'Hindi', duration: +duration || 120, poster: poster || '', rating: 7 }));
}));

r.delete('/:id', protect, adminOnly, ah(async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

export default r;
