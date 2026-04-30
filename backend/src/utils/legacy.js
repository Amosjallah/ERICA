/** Map Prisma `id` → `_id` recursively for API compatibility with the existing frontend. */
export function toLegacy(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toLegacy);
  if (typeof value !== 'object') return value;

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === 'id' && typeof v === 'string') {
      out._id = v;
      continue;
    }
    out[k] = toLegacy(v);
  }
  return out;
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password, id, ...rest } = user;
  return { ...rest, _id: id };
}

export function sanitizeVendor(v) {
  if (!v) return null;
  const { id, ...rest } = v;
  return { ...rest, _id: id };
}
