import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  industry: { type: String, enum: ['Bollywood', 'Hollywood', 'South Indian', 'International'], required: true },
  genre: { type: String, default: 'Drama' },
  language: { type: String, default: 'Hindi' },
  rating: { type: Number, default: 7 },
  duration: { type: Number, default: 120 },
  certificate: { type: String, default: 'UA' },
  poster: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Movie', movieSchema);
