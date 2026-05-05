import { createClient } from '@supabase/supabase-js';

let _client;

/** Supabase client expects project root only; a trailing /rest/v1 breaks requests (PostgREST PGRST125). */
export function normalizeSupabaseUrl(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  let u = raw.trim().replace(/^["']|["']$/g, '');
  u = u.replace(/\/+$/, '');
  u = u.replace(/\/rest\/v1\/?$/i, '');
  u = u.replace(/\/+$/, '');
  return u;
}

export function getSupabase() {
  if (!_client) {
    const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to backend/.env (Supabase → Project Settings → API).'
      );
    }
    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}
