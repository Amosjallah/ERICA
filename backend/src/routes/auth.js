import express from 'express';
import { body, validationResult } from 'express-validator';
import { getSupabase } from '../lib/supabase.js';
import { newId } from '../lib/ids.js';
import { signToken, protect, hashPassword, comparePassword } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';
import { toLegacy } from '../utils/legacy.js';
import { performPlatformAdminLogin } from '../lib/platformAdminLogin.js';
import { normalizeAuthEmail, escapeIlikeExact } from '../utils/authEmail.js';

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').trim().notEmpty().isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['customer', 'vendor']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, password, role = 'customer', storeName, storeDescription } = req.body;
    const email = normalizeAuthEmail(req.body.email);
    if (!email) return res.status(400).json({ message: 'Invalid email' });

    if (role === 'vendor' && !storeName?.trim()) {
      return res.status(400).json({ message: 'Store name is required for vendor registration' });
    }

    const sb = getSupabase();
    const { data: exists } = await sb
      .from('User')
      .select('id')
      .ilike('email', escapeIlikeExact(email))
      .maybeSingle();
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await hashPassword(password);
    const id = newId();
    const ts = nowIso();
    const { data: user, error } = await sb
      .from('User')
      .insert({
        id,
        name,
        email,
        password: hashed,
        role: role === 'vendor' ? 'vendor' : 'customer',
        updatedAt: ts,
      })
      .select('*')
      .single();
    if (error) return res.status(400).json({ message: error.message });

    if (role === 'vendor') {
      const slugBase = slugify(storeName.trim());
      const vid = newId();
      const { error: ve } = await sb.from('Vendor').insert({
        id: vid,
        userId: user.id,
        storeName: storeName.trim(),
        slug: `${slugBase}-${user.id.slice(-6)}`,
        description: storeDescription || '',
        approvalStatus: 'pending',
        updatedAt: ts,
      });
      if (ve) return res.status(400).json({ message: ve.message });
    }

    const token = signToken(user.id);
    const { password: _, ...safe } = user;
    res.status(201).json({ token, user: toLegacy(safe) });
  }
);

router.post(
  '/login',
  [body('email').trim().notEmpty().isEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const email = normalizeAuthEmail(req.body.email);
    const { password } = req.body;
    const sb = getSupabase();
    const { data: user, error: findErr } = await sb
      .from('User')
      .select('*')
      .ilike('email', escapeIlikeExact(email))
      .limit(1)
      .maybeSingle();
    if (findErr) return res.status(500).json({ message: findErr.message });
    let ok = false;
    try {
      ok = !!(user && user.password && (await comparePassword(password, user.password)));
    } catch {
      ok = false;
    }
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    const { password: _, ...safe } = user;
    res.json({ token, user: toLegacy(safe) });
  }
);

/** Same credentials as /login but only succeeds for role=admin (generic 401 otherwise). */
router.post(
  '/admin/login',
  [body('email').trim().notEmpty().isEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const email = normalizeAuthEmail(req.body.email);
    const { password } = req.body;
    const out = await performPlatformAdminLogin(email, password);
    if (!out.ok) return res.status(out.status).json({ message: out.message });
    res.json({ token: out.token, user: out.user });
  }
);

router.get('/me', protect, async (req, res) => {
  let vendor = null;
  if (req.user.role === 'vendor') {
    const sb = getSupabase();
    const { data: v } = await sb.from('Vendor').select('*').eq('userId', req.user._id).maybeSingle();
    vendor = v ? toLegacy(v) : null;
  }
  res.json({ user: req.user, vendor });
});

export default router;
