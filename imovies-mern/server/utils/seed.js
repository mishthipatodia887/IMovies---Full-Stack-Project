import 'dotenv/config';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';

await connectDB();
const movies = JSON.parse(fs.readFileSync(new URL('../data/movies.json', import.meta.url), 'utf8'));
await Movie.deleteMany({});
await Movie.insertMany(movies);
console.log(`Seeded ${movies.length} movies`);

const name = (process.env.ADMIN_NAME || 'admin').toLowerCase();
if (!(await User.findOne({ name }))) {
  await User.create({ name, password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10), role: 'admin' });
  console.log(`Admin user created: ${name}`);
}
process.exit(0);
