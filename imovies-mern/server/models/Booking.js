import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  ref: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  movieTitle: String,
  city: String, theatre: String, date: String, time: String,
  seats: [String],
  snacks: [Number],
  coupon: { type: String, default: '' },
  total: Number,
  key: { type: String, index: true }, // city|theatre|movie|date|time
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
