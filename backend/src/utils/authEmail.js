/** Lowercase + trim — use for all persisted auth emails so login matches registration. */
export function normalizeAuthEmail(email) {
  if (email == null || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/** Escape `%`, `_`, `\` so ILIKE treats the string as a literal (exact match, case-insensitive). */
export function escapeIlikeExact(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
