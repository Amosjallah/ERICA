import express from 'express';
import { Notification } from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  const list = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json(list);
});

router.patch('/:id/read', async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!n) return res.status(404).json({ message: 'Not found' });
  res.json(n);
});

router.post('/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { read: true });
  res.json({ ok: true });
});

export default router;
