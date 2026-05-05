/** Must match `backend/src/utils/shippingLine2.js` SHIPPING_NOTES_MARKER. */
const SHIPPING_NOTES_MARKER = "\n\n--- Delivery notes ---\n";

export function parseShippingLine2(merged: string | null | undefined): { apartment: string; notes: string } {
  const raw = String(merged || "");
  const i = raw.indexOf(SHIPPING_NOTES_MARKER);
  if (i === -1) return { apartment: raw.trim(), notes: "" };
  return {
    apartment: raw.slice(0, i).trim(),
    notes: raw.slice(i + SHIPPING_NOTES_MARKER.length).trim(),
  };
}
