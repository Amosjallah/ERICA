/** Keep in sync with `frontend/src/lib/shipping-address.ts` (parse for UI). */
export const SHIPPING_NOTES_MARKER = '\n\n--- Delivery notes ---\n';

/** Merges optional apartment line 2 and delivery notes into one DB field (`shippingLine2`). */
export function buildShippingLine2(apartmentLine, deliveryNotes) {
  const apt = String(apartmentLine || '').trim();
  const notes = String(deliveryNotes || '').trim().slice(0, 2000);
  if (!notes) return apt;
  if (apt) return `${apt}${SHIPPING_NOTES_MARKER}${notes}`;
  return `${SHIPPING_NOTES_MARKER}${notes}`;
}

export function parseShippingLine2(merged) {
  const raw = String(merged || '');
  const i = raw.indexOf(SHIPPING_NOTES_MARKER);
  if (i === -1) return { apartment: raw.trim(), notes: '' };
  return {
    apartment: raw.slice(0, i).trim(),
    notes: raw.slice(i + SHIPPING_NOTES_MARKER.length).trim(),
  };
}
