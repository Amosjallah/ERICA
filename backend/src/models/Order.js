import mongoose from 'mongoose';

const orderLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  title: String,
  image: String,
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  lineTotal: { type: Number, required: true },
  commissionPercent: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  vendorPayout: { type: Number, required: true },
});

const vendorSubOrderSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [orderLineSchema],
  subtotal: { type: Number, required: true },
  commissionTotal: { type: Number, required: true },
  vendorPayoutTotal: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending_payment',
    },
    paymentProvider: { type: String, enum: ['stripe', 'paystack', 'manual'], default: 'stripe' },
    paymentIntentId: { type: String, default: '' },
    stripeSessionId: { type: String, default: '' },
    subOrders: [vendorSubOrderSchema],
    subtotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    shippingTotal: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    couponCode: { type: String, default: '' },
    shippingAddress: {
      name: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
