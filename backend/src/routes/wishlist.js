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

async function getOrCreateWishlist(sb, userId) {
  const { data: w } = await sb.from('Wishlist').select('*').eq('userId', userId).maybeSingle();
  if (w) return w;
  const id = newId();
  const ts = nowIso();
  const { data: created, error } = await sb.from('Wishlist').insert({ id, userId, updatedAt: ts }).select('*').single();
  if (error) throw error;
  return created;
}

router.get('/', async (req, res) => {
  try {
    const sb = getSupabase();
    const w = await getOrCreateWishlist(sb, req.user._id);
    const { data: links } = await sb
      .from('WishlistProduct')
      .select('*, Product(*, Vendor(storeName, slug)))')
      .eq('wishlistId', w.id);
    const products = (links || [])
      .map((l) => {
        if (!l.Product) return null;
        return { ...l.Product, vendor: l.Product.Vendor };
      })
      .filter(Boolean);
    res.json(toLegacy({ ...w, products }));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/:productId', async (req, res) => {
  try {
    const sb = getSupabase();
    const { data: p } = await sb.from('Product').select('id').eq('id', req.params.productId).maybeSingle();
    if (!p) return res.status(404).json({ message: 'Product not found' });
    const w = await getOrCreateWishlist(sb, req.user._id);
    const { error } = await sb.from('WishlistProduct').upsert(
      { wishlistId: w.id, productId: p.id },
      { onConflict: 'wishlistId,productId' }
    );
    if (error) throw error;

    const { data: links } = await sb.from('WishlistProduct').select('*, Product(*)').eq('wishlistId', w.id);
    const products = (links || []).map((l) => l.Product).filter(Boolean);
    res.json(toLegacy({ ...w, products }));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    const sb = getSupabase();
    const w = await getOrCreateWishlist(sb, req.user._id);
    await sb.from('WishlistProduct').delete().eq('wishlistId', w.id).eq('productId', req.params.productId);
    const { data: links } = await sb.from('WishlistProduct').select('*, Product(*)').eq('wishlistId', w.id);
    const products = (links || []).map((l) => l.Product).filter(Boolean);
    res.json(toLegacy({ ...w, products }));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
