import express from 'express';
import prisma from '../lib/prisma.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { slugify } from '../utils/slugify.js';
import { toLegacy } from '../utils/legacy.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories.map((c) => toLegacy(c)));
});

router.get('/:slug', async (req, res) => {
  const cat = await prisma.category.findUnique({ where: { slug: req.params.slug } });
  if (!cat) return res.status(404).json({ message: 'Category not found' });
  res.json(toLegacy(cat));
});

router.post('/', protect, allowRoles('admin'), async (req, res) => {
  const { name, description, image, parent } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Name required' });
  const slug = slugify(name);
  const exists = await prisma.category.findUnique({ where: { slug } });
  if (exists) return res.status(400).json({ message: 'Category slug exists' });
  const cat = await prisma.category.create({
    data: {
      name: name.trim(),
      slug,
      description: description || '',
      image: image || '',
      parentId: parent || null,
    },
  });
  res.status(201).json(toLegacy(cat));
});

router.patch('/:id', protect, allowRoles('admin'), async (req, res) => {
  const data = { ...req.body };
  if (data.parent !== undefined) {
    data.parentId = data.parent || null;
    delete data.parent;
  }
  try {
    const cat = await prisma.category.update({
      where: { id: req.params.id },
      data,
    });
    res.json(toLegacy(cat));
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
});

router.delete('/:id', protect, allowRoles('admin'), async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
});

export default router;
