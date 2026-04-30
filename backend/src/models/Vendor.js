import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const vendorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },
    approvedAt: { type: Date },
    commissionOverridePercent: { type: Number, min: 0, max: 100, default: null },
  },
  { timestamps: true }
);

vendorSchema.pre('save', function (next) {
  if (this.isModified('storeName') || !this.slug) {
    const base = slugify(this.storeName);
    this.slug = `${base}-${this._id.toString().slice(-6)}`;
  }
  next();
});

export const Vendor = mongoose.model('Vendor', vendorSchema);
