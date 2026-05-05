/**
 * Safe page/limit for Supabase `.range()`.
 * Raw query values like `limit=` or `page=abc` become NaN with `Number()` and break PostgREST.
 */
export function parsePagination(query, defaultLimit, maxLimit) {
  const p = parseInt(String(query?.page ?? '1'), 10);
  const l = parseInt(String(query?.limit ?? String(defaultLimit)), 10);
  const page = Number.isFinite(p) && p > 0 ? Math.min(p, 1_000_000) : 1;
  const limit = Number.isFinite(l) && l > 0 ? Math.min(maxLimit, l) : defaultLimit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
