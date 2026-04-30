import express from 'express';
import { body, validationResult } from 'express-validator';
import { getSupabase } from '../lib/supabase.js';
import { newId } from '../lib/ids.js';
import { signToken, protect, hashPassword, comparePassword } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';
import { toLegacy } from '../utils/legacy.js';

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['customer', 'vendor']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role = 'customer', storeName, storeDescription } = req.body;

    if (role === 'vendor' && !storeName?.trim()) {
      return res.status(400).json({ message: 'Store name is required for vendor registration' });
    }

    const sb = getSupabase();
    const { data: exists } = await sb.from('User').select('id').eq('email', email).maybeSingle();
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
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const sb = getSupabase();
    const { data: user } = await sb.from('User').select('*').eq('email', email).maybeSingle();
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    const { password: _, ...safe } = user;
    res.json({ token, user: toLegacy(safe) });
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
