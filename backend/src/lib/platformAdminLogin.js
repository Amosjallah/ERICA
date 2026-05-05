import { getSupabase } from './supabase.js';
import { signToken, comparePassword } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';
import { escapeIlikeExact, normalizeAuthEmail } from '../utils/authEmail.js';

/** @returns {Promise<{ ok: true, token: string, user: object } | { ok: false, message: string, status: number }>} */
export async function performPlatformAdminLogin(email, password) {
  const sb = getSupabase();
  const emailNorm = normalizeAuthEmail(email);
  if (!emailNorm) return { ok: false, message: 'Invalid email or password', status: 401 };
  const { data: user, error: findErr } = await sb
    .from('User')
    .select('*')
    .ilike('email', escapeIlikeExact(emailNorm))
    .limit(1)
    .maybeSingle();
  if (findErr) return { ok: false, message: findErr.message, status: 500 };
  let pwdOk = false;
  try {
    pwdOk = !!(user && user.password && (await comparePassword(password, user.password)));
  } catch {
    pwdOk = false;
  }
  if (!pwdOk) {
    return { ok: false, message: 'Invalid email or password', status: 401 };
  }
  if (user.role !== 'admin') {
    return { ok: false, message: 'Invalid email or password', status: 401 };
  }
  const token = signToken(user.id);
  const { password: _, ...safe } = user;
  return { ok: true, token, user: toLegacy(safe) };
}
