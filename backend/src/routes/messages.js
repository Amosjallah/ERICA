import express from 'express';
import prisma from '../lib/prisma.js';
import { protect } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';

const router = express.Router();

router.use(protect);

function makeConversationId(vendorId, customerUserId) {
  return `v:${vendorId}:c:${customerUserId}`;
}

router.get('/conversations', async (req, res) => {
  const uid = req.user._id;
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: uid }, { recipientId: uid }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { name: true, role: true } },
      recipient: { select: { name: true, role: true } },
      vendor: { select: { storeName: true, slug: true } },
    },
  });

  const seen = new Set();
  const threads = [];
  for (const m of messages) {
    if (seen.has(m.conversationId)) continue;
    seen.add(m.conversationId);
    const peerId = m.senderId === uid ? m.recipientId : m.senderId;
    const peer = m.senderId === uid ? m.recipient : m.sender;
    threads.push({
      conversationId: m.conversationId,
      lastMessage: toLegacy(m),
      vendor: toLegacy(m.vendor),
      peer: toLegacy(peer),
      peerId,
    });
  }
  res.json(threads);
});

router.get('/thread/:conversationId', async (req, res) => {
  const cid = req.params.conversationId;
  const list = await prisma.message.findMany({
    where: { conversationId: cid },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { name: true } } },
  });

  if (!list.length) return res.json([]);

  const allowed = list.some(
    (m) => m.senderId === req.user._id || m.recipientId === req.user._id
  );
  if (!allowed) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await prisma.message.updateMany({
    where: { conversationId: cid, recipientId: req.user._id, read: false },
    data: { read: true },
  });
  res.json(list.map((m) => toLegacy(m)));
});

router.post('/', async (req, res) => {
  const { vendorId, customerId, body: text } = req.body;
  if (!vendorId || !text?.trim()) return res.status(400).json({ message: 'vendorId and body required' });

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
  const vendorUserId = vendor.userId;

  let customerUserId;
  if (req.user.role === 'vendor') {
    if (vendorUserId !== req.user._id) {
      return res.status(403).json({ message: 'Not your store' });
    }
    if (!customerId) {
      return res.status(400).json({ message: 'customerId required' });
    }
    customerUserId = customerId;
  } else {
    customerUserId = req.user._id;
  }

  const conversationId = makeConversationId(vendor.id, customerUserId);

  const senderId = req.user._id;
  const recipientId = senderId === customerUserId ? vendorUserId : customerUserId;

  const msg = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      recipientId,
      vendorId: vendor.id,
      body: text.trim(),
    },
    include: { sender: { select: { name: true } } },
  });

  await prisma.notification.create({
    data: {
      userId: recipientId,
      title: 'New message',
      body: text.slice(0, 120),
      type: 'message',
      meta: { conversationId },
    },
  });

  res.status(201).json(toLegacy(msg));
});

export default router;
