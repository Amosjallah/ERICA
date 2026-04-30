import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { protect } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';
import { newId } from '../lib/ids.js';

const router = express.Router();

router.use(protect);

function nowIso() {
  return new Date().toISOString();
}

function makeConversationId(vendorId, customerUserId) {
  return `v:${vendorId}:c:${customerUserId}`;
}

async function loadUsersMap(sb, ids) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return {};
  const { data: users } = await sb.from('User').select('id, name, role').in('id', uniq);
  return Object.fromEntries((users || []).map((u) => [u.id, u]));
}

router.get('/conversations', async (req, res) => {
  const uid = req.user._id;
  const sb = getSupabase();
  const { data: messages, error } = await sb
    .from('Message')
    .select('*, Vendor(storeName, slug)')
    .or(`senderId.eq.${uid},recipientId.eq.${uid}`)
    .order('createdAt', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });

  const userIds = [];
  for (const m of messages || []) {
    userIds.push(m.senderId, m.recipientId);
  }
  const umap = await loadUsersMap(sb, userIds);

  const seen = new Set();
  const threads = [];
  for (const m of messages || []) {
    if (seen.has(m.conversationId)) continue;
    seen.add(m.conversationId);
    const peerId = m.senderId === uid ? m.recipientId : m.senderId;
    const peer = umap[peerId] || { id: peerId, name: 'User', role: 'customer' };
    const ve = m.Vendor;
    const lastRow = { ...m };
    delete lastRow.Vendor;
    threads.push({
      conversationId: m.conversationId,
      lastMessage: toLegacy({
        ...lastRow,
        sender: { name: umap[m.senderId]?.name },
      }),
      vendor: toLegacy({ id: m.vendorId, storeName: ve?.storeName, slug: ve?.slug }),
      peer: toLegacy(peer),
      peerId,
    });
  }
  res.json(threads);
});

router.get('/thread/:conversationId', async (req, res) => {
  const cid = req.params.conversationId;
  const sb = getSupabase();
  const { data: list, error } = await sb
    .from('Message')
    .select('*')
    .eq('conversationId', cid)
    .order('createdAt', { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  if (!list?.length) return res.json([]);

  const allowed = list.some((m) => m.senderId === req.user._id || m.recipientId === req.user._id);
  if (!allowed) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await sb
    .from('Message')
    .update({ read: true, updatedAt: nowIso() })
    .eq('conversationId', cid)
    .eq('recipientId', req.user._id)
    .eq('read', false);

  const umap = await loadUsersMap(
    sb,
    list.map((m) => m.senderId)
  );
  res.json(list.map((m) => toLegacy({ ...m, sender: { name: umap[m.senderId]?.name } })));
});

router.post('/', async (req, res) => {
  const { vendorId, customerId, body: text } = req.body;
  if (!vendorId || !text?.trim()) return res.status(400).json({ message: 'vendorId and body required' });

  const sb = getSupabase();
  const { data: vendor } = await sb.from('Vendor').select('*').eq('id', vendorId).maybeSingle();
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

  const msgId = newId();
  const ts = nowIso();
  const { data: msg, error } = await sb
    .from('Message')
    .insert({
      id: msgId,
      conversationId,
      senderId,
      recipientId,
      vendorId: vendor.id,
      body: text.trim(),
      updatedAt: ts,
    })
    .select('*')
    .single();
  if (error) return res.status(400).json({ message: error.message });

  const umap = await loadUsersMap(sb, [msg.senderId]);
  await sb.from('Notification').insert({
    id: newId(),
    userId: recipientId,
    title: 'New message',
    body: text.slice(0, 120),
    type: 'message',
    meta: { conversationId },
    updatedAt: ts,
  });

  res.status(201).json(toLegacy({ ...msg, sender: { name: umap[msg.senderId]?.name } }));
});

export default router;
