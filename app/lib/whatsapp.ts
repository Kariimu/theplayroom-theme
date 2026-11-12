// app/lib/whatsapp.ts
// Shared WhatsApp link helpers: the floating button (store enquiry) and the
// product card / product page (per-product enquiry) both build `wa.me` links
// from the `whatsapp_number` setting. Keep that logic here, not duplicated.

/** Digits only for a `wa.me` link (drops spaces, `+`, `-`, and anything non-numeric). */
export function cleanWhatsappNumber(raw: string | number | null | undefined): string {
  return String(raw ?? '').replace(/\D/g, '');
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
