import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { ah, httpError } from '../utils/helpers.js';

const r = Router();
const sign = u => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = u => ({ id: u._id, name: u.name, role: u.role });

r.post('/register', ah(async (req, res) => {
  const { name, password } = req.body;
  if (!name?.trim() || !password || password.length < 6) throw httpError(400, 'Enter a name and a password of at least 6 characters');
  const n = name.trim().toLowerCase();
  if (await User.findOne({ name: n })) throw httpError(409, 'That name is already taken');
  const user = await User.create({ name: n, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: pub(user) });
}));

r.post('/login', ah(async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findOne({ name: String(name || '').trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password))) throw httpError(401, 'Wrong name or password');
  res.json({ token: sign(user), user: pub(user) });
}));

r.get('/me', protect, (req, res) => res.json({ user: pub(req.user) }));

export default r;
