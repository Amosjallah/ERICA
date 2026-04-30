import express from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { Vendor } from '../models/Vendor.js';
import { Notification } from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

function makeConversationId(vendorId, customerUserId) {
  return `v:${vendorId}:c:${customerUserId}`;
}

router.get('/conversations', async (req, res) => {
  const uid = req.user._id;
  const messages = await Message.find({
    $or: [{ sender: uid }, { recipient: uid }],
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name role')
    .populate('recipient', 'name role')
    .populate('vendor', 'storeName slug')
    .lean();

  const seen = new Set();
  const threads = [];
  for (const m of messages) {
    if (seen.has(m.conversationId)) continue;
    seen.add(m.conversationId);
    const peerId =
      m.sender._id.toString() === uid.toString() ? m.recipient._id : m.sender._id;
    const peer = m.sender._id.toString() === uid.toString() ? m.recipient : m.sender;
    threads.push({
      conversationId: m.conversationId,
      lastMessage: m,
      vendor: m.vendor,
      peer,
      peerId,
    });
  }
  res.json(threads);
});

router.get('/thread/:conversationId', async (req, res) => {
  const cid = req.params.conversationId;
  const list = await Message.find({ conversationId: cid })
    .sort({ createdAt: 1 })
    .populate('sender', 'name')
    .lean();

  if (!list.length) return res.json([]);

  const allowed = list.some(
    (m) =>
      m.sender._id.toString() === req.user._id.toString() ||
      m.recipient?.toString() === req.user._id.toString()
  );
  if (!allowed) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await Message.updateMany(
    { conversationId: cid, recipient: req.user._id, read: false },
    { read: true }
  );
  res.json(list);
});

router.post('/', async (req, res) => {
  const { vendorId, customerId, body: text } = req.body;
  if (!vendorId || !text?.trim()) return res.status(400).json({ message: 'vendorId and body required' });

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  const vendorUserId = vendor.user;

  let customerUserId;
  if (req.user.role === 'vendor') {
    if (vendorUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your store' });
    }
    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({ message: 'customerId required' });
    }
    customerUserId = customerId;
  } else {
    customerUserId = req.user._id;
  }

  const conversationId = makeConversationId(vendor._id, customerUserId);

  const senderId = req.user._id;
  const recipientId =
    senderId.toString() === customerUserId.toString() ? vendorUserId : customerUserId;

  const msg = await Message.create({
    conversationId,
    sender: senderId,
    recipient: recipientId,
    vendor: vendor._id,
    body: text.trim(),
  });

  await Notification.create({
    user: recipientId,
    title: 'New message',
    body: text.slice(0, 120),
    type: 'message',
    meta: { conversationId },
  });

  await msg.populate('sender', 'name');
  res.status(201).json(msg);
});

export default router;
