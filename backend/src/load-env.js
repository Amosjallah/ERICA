import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeSupabaseUrl } from './lib/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load backend/.env from this package (stable path). override: true so a shell/IDE PORT does not hide .env values.
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
if (process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
}
