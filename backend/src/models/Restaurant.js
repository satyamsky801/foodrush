import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    cuisine: [{ type: String }],
    // Category slugs this restaurant belongs to (pizza, biryani, …)
    categories: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    deliveryTime: { type: String, default: '25–35 min' },
    deliveryMin: { type: Number, default: 30 },
    deliveryFee: { type: Number, default: 0 },
    freeDeliveryAbove: { type: Number, default: null },
    priceForTwo: { type: Number, default: 300 },
    pureVeg: { type: Boolean, default: false },
    area: { type: String, default: '' },
    address: { type: String, default: '' },
    offers: [{ type: String }],
    featured: { type: Boolean, default: false },
    topRated: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

restaurantSchema.index({ name: 'text', cuisine: 'text', area: 'text' });

export default mongoose.model('Restaurant', restaurantSchema);
