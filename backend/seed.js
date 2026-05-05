import './src/load-env.js';
import bcrypt from 'bcryptjs';
import { getSupabase } from './src/lib/supabase.js';
import { newId } from './src/lib/ids.js';
import { slugify } from './src/utils/slugify.js';

async function hash(p) {
  return bcrypt.hash(p, 12);
}

function nowIso() {
  return new Date().toISOString();
}

const SENT = '__SEED_CLEAR__';

async function clearAll(sb) {
  const byId = async (table) => {
    const { error } = await sb.from(table).delete().neq('id', SENT);
    if (error) console.warn('clear', table, error.message);
  };
  await byId('OrderLineItem');
  await byId('OrderSuborder');
  await byId('Order');
  await byId('Review');
  await byId('CartItem');
  await byId('Cart');
  const { error: wpErr } = await sb.from('WishlistProduct').delete().neq('wishlistId', SENT);
  if (wpErr) console.warn('clear WishlistProduct', wpErr.message);
  await byId('Wishlist');
  await byId('Notification');
  await byId('Message');
  await byId('Product');
  await byId('Coupon');
  await byId('Vendor');
  await byId('Category');
  await byId('User');
}

async function seed() {
  const sb = getSupabase();
  await clearAll(sb);

  const ts = nowIso();
  const adminId = newId();
  const vendorUserId = newId();
  const customerId = newId();

  await sb.from('User').insert([
    {
      id: adminId,
      name: 'Admin User',
      email: 'admin@ktu-emarket.local',
      password: await hash('Admin123!'),
      role: 'admin',
      updatedAt: ts,
    },
    {
      id: vendorUserId,
      name: 'Luxe Goods Co.',
      email: 'vendor@ktu-emarket.local',
      password: await hash('Vendor123!'),
      role: 'vendor',
      updatedAt: ts,
    },
    {
      id: customerId,
      name: 'Jane Customer',
      email: 'customer@ktu-emarket.local',
      password: await hash('Customer123!'),
      role: 'customer',
      updatedAt: ts,
    },
  ]);

  const vendorId = newId();
  await sb.from('Vendor').insert({
    id: vendorId,
    userId: vendorUserId,
    storeName: 'Luxe Goods Co.',
    slug: `${slugify('Luxe Goods Co.')}-${vendorUserId.slice(-6)}`,
    description: 'Premium curated products for modern living.',
    approvalStatus: 'approved',
    approvedAt: ts,
    updatedAt: ts,
  });

  const catIds = [newId(), newId(), newId()];
  await sb.from('Category').insert([
    { id: catIds[0], name: 'Electronics', slug: 'electronics', description: 'Gadgets and tech' },
    { id: catIds[1], name: 'Fashion', slug: 'fashion', description: 'Apparel and accessories' },
    { id: catIds[2], name: 'Home', slug: 'home', description: 'Home and living' },
  ]);

  const productsData = [
    {
      categoryId: catIds[0],
      title: 'Wireless Noise-Canceling Headphones',
      description: 'Studio-grade sound with 40h battery life.',
      price: 199.99,
      compareAtPrice: 249.99,
      stock: 50,
      featured: true,
      images: [],
    },
    {
      categoryId: catIds[1],
      title: 'Merino Wool Crewneck',
      description: 'Ultra-soft sustainable wool.',
      price: 89,
      stock: 120,
      featured: true,
      images: [],
    },
    {
      categoryId: catIds[2],
      title: 'Minimal Ceramic Table Lamp',
      description: 'Warm ambient lighting for any room.',
      price: 65,
      stock: 30,
      featured: false,
      images: [],
    },
  ];

  for (const p of productsData) {
    const pid = newId();
    const tmpSlug = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await sb.from('Product').insert({
      id: pid,
      vendorId,
      categoryId: p.categoryId,
      title: p.title,
      slug: tmpSlug,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      stock: p.stock,
      featured: p.featured,
      images: p.images,
      updatedAt: ts,
    });
    const slug = `${slugify(p.title)}-${pid.slice(-6)}`;
    await sb.from('Product').update({ slug, updatedAt: nowIso() }).eq('id', pid);
  }

  await sb.from('Coupon').insert({
    id: newId(),
    code: 'WELCOME10',
    description: '10% off your first order',
    discountType: 'percent',
    discountValue: 10,
    minOrderAmount: 40,
    active: true,
    updatedAt: ts,
  });

  const { data: vrow } = await sb.from('Vendor').select('slug').eq('id', vendorId).single();
  console.log('Seed complete.');
  console.log('Admin: admin@ktu-emarket.local / Admin123!');
  console.log('Vendor: vendor@ktu-emarket.local / Vendor123!');
  console.log('Customer: customer@ktu-emarket.local / Customer123!');
  console.log('Vendor slug:', vrow?.slug);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
