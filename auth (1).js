import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ah, httpError } from '../utils/helpers.js';

// verifies the JWT sent as "Authorization: Bearer <token>"
export const protect = ah(async (req, res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw httpError(401, 'Please sign in');
  let decoded;
  try { decoded = jwt.verify(h.slice(7), process.env.JWT_SECRET); }
  catch { throw httpError(401, 'Session expired, please sign in again'); }
  req.user = await User.findById(decoded.id).select('-password');
  if (!req.user) throw httpError(401, 'User no longer exists');
  next();
});

export const adminOnly = (req, res, next) =>
  req.user?.role === 'admin' ? next() : next(httpError(403, 'Admins only'));
