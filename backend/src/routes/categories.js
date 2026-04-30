import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';
import { newId } from '../lib/ids.js';
import { toLegacy } from '../utils/legacy.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const sb = getSupabase();
  const { data: categories, error } = await sb.from('Category').select('*').order('name', { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  res.json((categories || []).map((c) => toLegacy(c)));
});

router.get('/:slug', async (req, res) => {
  const sb = getSupabase();
  const { data: cat, error } = await sb.from('Category').select('*').eq('slug', req.params.slug).maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  res.json(toLegacy(cat));
});

router.post('/', protect, allowRoles('admin'), async (req, res) => {
  const { name, description, image, parent } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Name required' });
  const slug = slugify(name);
  const sb = getSupabase();
  const { data: exists } = await sb.from('Category').select('id').eq('slug', slug).maybeSingle();
  if (exists) return res.status(400).json({ message: 'Category slug exists' });
  const id = newId();
  const { data: cat, error } = await sb
    .from('Category')
    .insert({
      id,
      name: name.trim(),
      slug,
      description: description || '',
      image: image || '',
      parentId: parent || null,
    })
    .select('*')
    .single();
  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(toLegacy(cat));
});

router.patch('/:id', protect, allowRoles('admin'), async (req, res) => {
  const sb = getSupabase();
  const payload = {};
  if (req.body.name !== undefined) payload.name = req.body.name;
  if (req.body.description !== undefined) payload.description = req.body.description;
  if (req.body.image !== undefined) payload.image = req.body.image;
  if (req.body.slug !== undefined) payload.slug = req.body.slug;
  if (req.body.parent !== undefined) payload.parentId = req.body.parent || null;
  if (req.body.parentId !== undefined) payload.parentId = req.body.parentId;

  const { data: cat, error } = await sb.from('Category').update(payload).eq('id', req.params.id).select('*').maybeSingle();
  if (error || !cat) return res.status(404).json({ message: 'Not found' });
  res.json(toLegacy(cat));
});

router.delete('/:id', protect, allowRoles('admin'), async (req, res) => {
  const sb = getSupabase();
  const { error } = await sb.from('Category').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});

export default router;
