import express from 'express';
import { Category } from '../models/Category.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json(categories);
});

router.get('/:slug', async (req, res) => {
  const cat = await Category.findOne({ slug: req.params.slug }).lean();
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  res.json(cat);
});

router.post('/', protect, allowRoles('admin'), async (req, res) => {
  const { name, description, image, parent } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Name required' });
  const slug = slugify(name);
  const exists = await Category.findOne({ slug });
  if (exists) return res.status(400).json({ message: 'Category slug exists' });
  const cat = await Category.create({ name: name.trim(), slug, description, image, parent });
  res.status(201).json(cat);
});

router.patch('/:id', protect, allowRoles('admin'), async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cat) return res.status(404).json({ message: 'Not found' });
  res.json(cat);
});

router.delete('/:id', protect, allowRoles('admin'), async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
