import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema(
  { id: String, name: String, price: Number },
  { _id: false }
);

const customizationSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    required: { type: Boolean, default: false },
    options: [
      { id: String, name: String, price: Number, _id: false },
    ],
  },
  { _id: false }
);

const foodSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    veg: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    category: { type: String, default: 'generic' }, // slug used for imagery
    section: { type: String, default: '' }, // menu section (Starters, Main Course…)
    sortOrder: { type: Number, default: 0 }, // preserves the menu's section/item order
    image: { type: String, default: '' },
    isBestseller: { type: Boolean, default: false },
    isRecommended: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    addons: [addonSchema],
    customizations: [customizationSchema],
  },
  { timestamps: true }
);

foodSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Food', foodSchema);
