import 'dotenv/config';
import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';
import { slugify } from './src/utils/slugify.js';

async function hash(p) {
  return bcrypt.hash(p, 12);
}

async function seed() {
  await prisma.orderLineItem.deleteMany();
  await prisma.orderSuborder.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistProduct.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.product.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@ericah.market',
      password: await hash('Admin123!'),
      role: 'admin',
    },
  });

  const vendorUser = await prisma.user.create({
    data: {
      name: 'Luxe Goods Co.',
      email: 'vendor@ericah.market',
      password: await hash('Vendor123!'),
      role: 'vendor',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Jane Customer',
      email: 'customer@ericah.market',
      password: await hash('Customer123!'),
      role: 'customer',
    },
  });

  const vendor = await prisma.vendor.create({
    data: {
      userId: vendorUser.id,
      storeName: 'Luxe Goods Co.',
      slug: `${slugify('Luxe Goods Co.')}-${vendorUser.id.slice(-6)}`,
      description: 'Premium curated products for modern living.',
      approvalStatus: 'approved',
      approvedAt: new Date(),
    },
  });

  const cats = [];
  cats.push(
    await prisma.category.create({
      data: { name: 'Electronics', slug: 'electronics', description: 'Gadgets and tech' },
    })
  );
  cats.push(
    await prisma.category.create({
      data: { name: 'Fashion', slug: 'fashion', description: 'Apparel and accessories' },
    })
  );
  cats.push(
    await prisma.category.create({
      data: { name: 'Home', slug: 'home', description: 'Home and living' },
    })
  );

  const productsData = [
    {
      vendorId: vendor.id,
      categoryId: cats[0].id,
      title: 'Wireless Noise-Canceling Headphones',
      description: 'Studio-grade sound with 40h battery life.',
      price: 199.99,
      compareAtPrice: 249.99,
      stock: 50,
      featured: true,
      images: [],
    },
    {
      vendorId: vendor.id,
      categoryId: cats[1].id,
      title: 'Merino Wool Crewneck',
      description: 'Ultra-soft sustainable wool.',
      price: 89,
      stock: 120,
      featured: true,
      images: [],
    },
    {
      vendorId: vendor.id,
      categoryId: cats[2].id,
      title: 'Minimal Ceramic Table Lamp',
      description: 'Warm ambient lighting for any room.',
      price: 65,
      stock: 30,
      featured: false,
      images: [],
    },
  ];

  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        ...p,
        slug: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });
    await prisma.product.update({
      where: { id: prod.id },
      data: { slug: `${slugify(p.title)}-${prod.id.slice(-6)}` },
    });
  }

  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      description: '10% off your first order',
      discountType: 'percent',
      discountValue: 10,
      minOrderAmount: 40,
      active: true,
    },
  });

  console.log('Seed complete.');
  console.log('Admin:', admin.email, '/ Admin123!');
  console.log('Vendor:', vendorUser.email, '/ Vendor123!');
  console.log('Customer:', 'customer@ericah.market', '/ Customer123!');
  console.log('Vendor slug:', vendor.slug);

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
