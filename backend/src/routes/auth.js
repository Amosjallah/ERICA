import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { signToken, protect } from '../middleware/auth.js';

const router = express.Router();

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

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'vendor' ? 'vendor' : 'customer',
    });

    if (role === 'vendor') {
      await Vendor.create({
        user: user._id,
        storeName: storeName.trim(),
        description: storeDescription || '',
        approvalStatus: 'pending',
      });
    }

    const token = signToken(user._id);
    const populated = await User.findById(user._id).select('-password');
    res.status(201).json({ token, user: populated });
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    user.password = undefined;
    res.json({ token, user });
  }
);

router.get('/me', protect, async (req, res) => {
  let vendor = null;
  if (req.user.role === 'vendor') {
    vendor = await Vendor.findOne({ user: req.user._id }).lean();
  }
  res.json({ user: req.user, vendor });
});

export default router;
