import './load-env.js';
import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getSupabase } from './lib/supabase.js';

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

/** Comma-separated origins (production + previews). In non-production, any localhost / 127.0.0.1 port is allowed for dev. */
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

function isLocalDevOrigin(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const h = u.hostname;
    if (h !== 'localhost' && h !== '127.0.0.1' && h !== '[::1]' && h !== '::1') return false;
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const allowedOrigins = corsAllowedOrigins();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)) {
        return callback(null, true);
      }
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
  const status = Number(err.status || err.statusCode) || 500;
  const message = err.message || 'Server error';
  if (!res.headersSent) {
    res.status(status).json({ message });
  }
});

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('User').select('id').limit(1);
    if (error) throw error;
    const server = app.listen(PORT, () => {
      console.log(`API listening on ${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `\n[api] Port ${PORT} is already in use. Stop the other Node process (or close the other terminal), or set PORT=5001 in backend/.env and NEXT_PUBLIC_API_URL in frontend/.env.local to match.\n`
        );
      } else {
        console.error(err);
      }
      setImmediate(() => process.exit(1));
    });
  } catch (e) {
    console.error(e);
    const code = e && typeof e === 'object' && 'code' in e ? String(e.code) : '';
    if (code === 'PGRST125') {
      console.error(
        '\n[api] Supabase returned PGRST125 (invalid REST path). Use SUPABASE_URL=https://<project-ref>.supabase.co with NO /rest/v1 suffix (copy "Project URL" from Supabase → Settings → API).\n'
      );
    } else {
      console.error(
        '\nCould not reach Supabase or the schema is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env, then run the SQL files in supabase/migrations/ (in order) in the Supabase SQL editor.\n'
      );
    }
    setImmediate(() => process.exit(1));
  }
}

start();
