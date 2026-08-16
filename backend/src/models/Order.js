import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    name: String,
    image: String,
    veg: Boolean,
    unitPrice: Number,
    addonTotal: Number,
    customTotal: Number,
    addons: [{ id: String, name: String, price: Number, _id: false }],
    customizations: [
      { id: String, name: String, optionId: String, optionName: String, price: Number, _id: false },
    ],
    quantity: { type: Number, min: 1, default: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    items: [orderItemSchema],
    address: {
      type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
      name: String,
      phone: String,
      street: String,
      area: String,
      city: String,
      pincode: String,
      landmark: String,
    },
    paymentMethod: { type: String, enum: ['upi', 'card', 'cod'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cod'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'accepted', 'preparing', 'ready', 'picked-up', 'out-for-delivery', 'delivered', 'cancelled'],
      default: 'placed',
      index: true,
    },
    breakdown: {
      total: Number,
      deliveryFee: Number,
      tax: Number,
      discount: Number,
      grandTotal: Number,
    },
    couponCode: String,
    estimatedDelivery: String,
    deliveryPartner: {
      name: String,
      phone: String,
      rating: Number,
      vehicle: String,
      _id: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
