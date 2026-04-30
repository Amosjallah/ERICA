import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { protect } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';

const router = express.Router();

router.use(protect);

function nowIso() {
  return new Date().toISOString();
}

router.get('/', async (req, res) => {
  const sb = getSupabase();
  const { data: list, error } = await sb
    .from('Notification')
    .select('*')
    .eq('userId', req.user._id)
    .order('createdAt', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ message: error.message });
  res.json((list || []).map((n) => toLegacy(n)));
});

router.patch('/:id/read', async (req, res) => {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from('Notification')
    .select('*')
    .eq('id', req.params.id)
    .eq('userId', req.user._id)
    .maybeSingle();
  if (!existing) return res.status(404).json({ message: 'Not found' });
  const { data: n, error } = await sb
    .from('Notification')
    .update({ read: true, updatedAt: nowIso() })
    .eq('id', existing.id)
    .select('*')
    .single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(toLegacy(n));
});

router.post('/read-all', async (req, res) => {
  const sb = getSupabase();
  const { error } = await sb
    .from('Notification')
    .update({ read: true, updatedAt: nowIso() })
    .eq('userId', req.user._id);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ ok: true });
});

export default router;
