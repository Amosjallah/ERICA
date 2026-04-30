import { getSupabase } from '../lib/supabase.js';
import { sanitizeVendor } from '../utils/legacy.js';

export async function loadVendor(req, res, next) {
  try {
    const sb = getSupabase();
    const { data: vendor, error } = await sb.from('Vendor').select('*').eq('userId', req.user._id).maybeSingle();
    if (error) throw error;
    req.vendorProfile = vendor ? sanitizeVendor(vendor) : null;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireApprovedVendor(req, res, next) {
  const v = req.vendorProfile;
  if (!v) return res.status(403).json({ message: 'Vendor profile not found' });
  if (v.approvalStatus !== 'approved') {
    return res.status(403).json({ message: 'Your vendor account is not approved yet' });
  }
  next();
}
