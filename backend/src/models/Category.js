import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    emoji: { type: String, default: '🍽️' },
    tagline: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
