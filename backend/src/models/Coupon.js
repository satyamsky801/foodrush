import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'freedelivery'], required: true },
    value: { type: Number, default: 0 }, // percent value when type = 'percent'
    maxDiscount: { type: Number, default: 0 },
    minOrder: { type: Number, default: 0 },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
