import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import prisma from './lib/prisma.js';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import vendorRoutes from './routes/vendors.js';
import cartRoutes from './routes/cart.js';
import checkoutRoutes from './routes/checkout.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import wishlistRoutes from './routes/wishlist.js';
import couponRoutes from './routes/coupons.js';
import notificationRoutes from './routes/notifications.js';
import messageRoutes from './routes/messages.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const app = express();

/** Comma-separated origins (e.g. production URL + preview). Always allows localhost:3000 for local dev. */
function corsAllowedOrigins() {
  const raw = process.env.CLIENT_URL || 'http://localhost:3000';
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set(list);
  set.add('http://localhost:3000');
  set.add('http://127.0.0.1:3000');
  return [...set];
}

const allowedOrigins = corsAllowedOrigins();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const ok = allowedOrigins.includes(origin);
      if (!ok) console.warn('[cors] blocked origin:', origin, '| allowed:', allowedOrigins);
      callback(null, ok);
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'KTU E-MARKET API' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = Number(process.env.PORT) || 5000;

prisma
  .$connect()
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on ${PORT}`));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
