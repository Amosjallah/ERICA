import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import { Vendor } from './src/models/Vendor.js';
import { Category } from './src/models/Category.js';
import { Product } from './src/models/Product.js';
import { Coupon } from './src/models/Coupon.js';
import { connectDB } from './src/config/db.js';

async function seed() {
  await connectDB();

  await Promise.all([
    Coupon.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Vendor.deleteMany({}),
    User.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@ericah.market',
    password: 'Admin123!',
    role: 'admin',
  });

  const vendorUser = await User.create({
    name: 'Luxe Goods Co.',
    email: 'vendor@ericah.market',
    password: 'Vendor123!',
    role: 'vendor',
  });

  const customer = await User.create({
    name: 'Jane Customer',
    email: 'customer@ericah.market',
    password: 'Customer123!',
    role: 'customer',
  });

  const vendor = await Vendor.create({
    user: vendorUser._id,
    storeName: 'Luxe Goods Co.',
    description: 'Premium curated products for modern living.',
    approvalStatus: 'approved',
    approvedAt: new Date(),
  });

  const cats = await Category.insertMany([
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets and tech' },
    { name: 'Fashion', slug: 'fashion', description: 'Apparel and accessories' },
    { name: 'Home', slug: 'home', description: 'Home and living' },
  ]);

  const productsData = [
    {
      vendor: vendor._id,
      category: cats[0]._id,
      title: 'Wireless Noise-Canceling Headphones',
      description: 'Studio-grade sound with 40h battery life.',
      price: 199.99,
      compareAtPrice: 249.99,
      stock: 50,
      featured: true,
      images: [],
    },
    {
      vendor: vendor._id,
      category: cats[1]._id,
      title: 'Merino Wool Crewneck',
      description: 'Ultra-soft sustainable wool.',
      price: 89,
      stock: 120,
      featured: true,
      images: [],
    },
    {
      vendor: vendor._id,
      category: cats[2]._id,
      title: 'Minimal Ceramic Table Lamp',
      description: 'Warm ambient lighting for any room.',
      price: 65,
      stock: 30,
      featured: false,
      images: [],
    },
  ];

  for (const p of productsData) {
    await Product.create(p);
  }

  await Coupon.create({
    code: 'WELCOME10',
    description: '10% off your first order',
    discountType: 'percent',
    discountValue: 10,
    minOrderAmount: 40,
    active: true,
  });

  console.log('Seed complete.');
  console.log('Admin:', admin.email, '/ Admin123!');
  console.log('Vendor:', vendorUser.email, '/ Vendor123!');
  console.log('Customer:', customer.email, '/ Customer123!');
  console.log('Vendor slug:', vendor.slug);

  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
