import { memo } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { cleanWhatsappNumber } from '../../lib/whatsapp';
import { WhatsAppIcon } from '../icons';

export { cleanWhatsappNumber };

export interface FloatingWhatsAppProps {
  /** The `whatsapp_number` setting (manifest `integer`). */
  number: string | number | null | undefined;
}

/**
 * The store-wide floating WhatsApp button (old theme's `.wa-float-btn`, rendered
 * after the footer via the `body:end` hook when `show_whatsapp` is on). A plain
 * enquiry link to the store number — not product-specific. Renders nothing
 * without a usable number.
 */
export const FloatingWhatsApp = memo(function FloatingWhatsApp({ number }: FloatingWhatsAppProps) {
  const { t } = useTranslation();
  const digits = cleanWhatsappNumber(number);
  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('blocks.floating_whatsapp.label', 'Chat on WhatsApp')}
      className="wa-float-btn"
    >
      <WhatsAppIcon width={30} height={30} fill="white" aria-hidden="true" />
    </a>
  );
});
