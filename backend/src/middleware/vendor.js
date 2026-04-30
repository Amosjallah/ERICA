import prisma from '../lib/prisma.js';
import { sanitizeVendor } from '../utils/legacy.js';

export async function loadVendor(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user._id } });
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
