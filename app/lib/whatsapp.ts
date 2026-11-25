// app/lib/whatsapp.ts
// Shared WhatsApp link helpers: the floating button (store enquiry) and the
// product card / product page (per-product enquiry) both build `wa.me` links
// from the `whatsapp_number` setting. Keep that logic here, not duplicated.

/** Fewer digits than any real international number (country code + subscriber). */
const MIN_DIGITS = 8;

/**
 * Digits only for a `wa.me` link (drops spaces, `+`, `-`, and anything
 * non-numeric), or '' when that is too short to be a real number — the
 * manifest's unset default `0` included, so nothing links to `wa.me/0`.
 */
export function cleanWhatsappNumber(raw: string | number | null | undefined): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits.length >= MIN_DIGITS ? digits : '';
}

/**
 * A `wa.me` enquiry link, or '' when the number is unusable. `message` is the
 * localized enquiry text (`blocks.whatsapp.enquiry_message`); `subject` is the
 * product name (and optionally its URL) appended after it. The text is URL-encoded.
 */
export function whatsappEnquiryHref(
  number: string | number | null | undefined,
  message?: string,
  subject?: string
): string {
  const digits = cleanWhatsappNumber(number);
  if (!digits) return '';
  const text = [message ?? '', subject ?? ''].join('').trim();
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${query}`;
}
