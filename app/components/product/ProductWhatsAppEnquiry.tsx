import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { WhatsAppIcon } from '../icons';
import { whatsappEnquiryHref } from '../../lib/whatsapp';

export interface ProductWhatsAppEnquiryProps {
  product: Product;
  /** The `whatsapp_number` setting; renders nothing without a usable number. */
  number: string | number | null | undefined;
}

/**
 * Replaces `<AddToCartForm>` for a `whatsapp`-tagged product (06 §7: "quantity
 * + `<salla-add-product-button>` **or** WhatsApp block") — this product can't
 * be bought online, only enquired about. Same `wa.me` link builder as the
 * floating button and the product-card enquiry link.
 */
export function ProductWhatsAppEnquiry({ product, number }: ProductWhatsAppEnquiryProps) {
  const { t } = useTranslation();
  const href = whatsappEnquiryHref(number, t('blocks.whatsapp.enquiry_message', ''), product.name);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="product-whatsapp-enquiry flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-white shadow-lg"
    >
      <WhatsAppIcon width={20} height={20} aria-hidden="true" />
      {t('blocks.whatsapp.enquiry_button', 'Enquire on WhatsApp')}
    </a>
  );
}
