import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import { ProductCard as EngineProductCard } from '@salla.sa/twilight-theme-engine/product';
import { useWishlist } from '@salla.sa/twilight-theme-engine/hooks/useWishlist';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { registerNativeBookingHook } from '../../lib/nativeBooking';
import { withImageFallback } from '../../lib/productImage';
import { isWhatsappProduct } from '../../lib/tags';
import { cleanWhatsappNumber, whatsappEnquiryHref } from '../../lib/whatsapp';
import { WishlistHeartButton } from './WishlistHeartButton';

type ProductCardProps = ComponentProps<typeof EngineProductCard>;

/**
 * Thin wrapper over the engine `ProductCard`.
 *
 * After mount (and whenever the lazily-hydrated bits appear):
 *  - sets `display: none` inline on a vertical card's own image-corner
 *    wishlist button (a plain style mutation on an existing node — safe,
 *    unlike moving it; see below), and portals a theme-owned wishlist button
 *    into `.s-product-card-content-footer` instead. Hiding it inline rather
 *    than only through `04-components/product.scss` keeps this component
 *    correct on its own — that stylesheet's rule hides it too, from the
 *    first paint.
 *  - The engine's button is a React-owned node; physically moving it there
 *    with `appendChild` (the previous approach) left React still tracking it
 *    as a child of the image container, so on unmount (e.g. navigating away)
 *    React tried to `removeChild` it from a parent it was no longer inside,
 *    throwing `NotFoundError`. A portal keeps this button fully React-managed
 *    at its real DOM location instead.
 *  - sets `loader-position="center"` on the add-to-cart button (grid + list).
 * A product with no photo shows the theme's placeholder, as the Twig card does
 * (the engine `Image` renders nothing without a `src`).
 * Inside the Salla app, a booking product's "Book now" fires `mobile::booking.open`
 * instead of opening the booking page (`lib/nativeBooking.ts`).
 * Styling: `04-components/product.scss`.
 */
export function ProductCard(props: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);
  const [waSlotEl, setWaSlotEl] = useState<HTMLElement | null>(null);
  const { t } = useTranslation();
  const { theme } = useTwilight();
  const { product, isPlaceholder } = useMemo(
    () => withImageFallback(props.product),
    [props.product]
  );

  // Products tagged `whatsapp` can't be bought online (old `categories_whatsapp`,
  // now a product tag — 5A): the add-to-cart button becomes a WhatsApp enquiry to
  // the store number. Gated on a usable `whatsapp_number`.
  const waNumber = (theme?.settings as { whatsapp_number?: string | number } | undefined)
    ?.whatsapp_number;
  const isWhatsapp = useMemo(
    () => isWhatsappProduct(product.tags) && !!cleanWhatsappNumber(waNumber),
    [product.tags, waNumber]
  );
  const waHref = useMemo(
    () =>
      isWhatsapp
        ? whatsappEnquiryHref(waNumber, t('blocks.whatsapp.enquiry_message', ''), product.name)
        : '',
    [isWhatsapp, waNumber, product.name, t]
  );

  useEffect(() => {
    registerNativeBookingHook();
    const root = ref.current;
    if (!root) return;

    const sync = () => {
      root.querySelectorAll<HTMLElement>('salla-add-product-button').forEach((el) => {
        if (isWhatsapp) {
          // Hide the buy button and mount the enquiry link where it sat.
          el.style.display = 'none';
          if (el.parentElement) setWaSlotEl(el.parentElement);
          return;
        }
        // engine ships the card button fill="outline"; make it solid + centre its spinner
        el.setAttribute('fill', 'solid');
        el.setAttribute('loader-position', 'center');
      });

      const vertical = root.querySelector<HTMLElement>('.s-product-card-vertical');
      if (!vertical) return;

      const originalWishlistBtn = vertical.querySelector<HTMLElement>(
        '.s-product-card-image .s-product-card-wishlist-btn'
      );
      if (originalWishlistBtn) originalWishlistBtn.style.display = 'none';

      setFooterEl(vertical.querySelector<HTMLElement>('.s-product-card-content-footer'));
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isWhatsapp]);

  return (
    <div
      ref={ref}
      style={{ display: 'contents' }}
      data-image-placeholder={isPlaceholder ? 'true' : undefined}
    >
      <EngineProductCard {...props} product={product} />
      {footerEl &&
        createPortal(
          // List responses send the id as a numeric string; the wishlist holds numbers.
          <FooterWishlistButton productId={Number(props.product.id)} />,
          footerEl
        )}
      {isWhatsapp &&
        waSlotEl &&
        waHref &&
        createPortal(
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="s-product-card-whatsapp-btn"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>{t('blocks.whatsapp.enquiry_button', 'Enquire on WhatsApp')}</span>
          </a>,
          waSlotEl
        )}
    </div>
  );
}

/** Same button the engine renders for `horizontal`/`fullImage` layouts
 * (`ProductCardContent`, theme-engine) — reused here for `vertical`, which
 * the engine only ever places in the image corner. */
function FooterWishlistButton({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const wishlist = useWishlist();
  const inWishlist = wishlist.has(productId);

  return (
    <WishlistHeartButton
      productId={productId}
      ariaLabel={t('pages.wishlist.toggle', 'Add or remove to wishlist')}
      pressed={inWishlist}
      className={`s-product-card-wishlist-btn animated ${inWishlist ? 's-product-card-wishlist-added pulse-anime' : 'not-added un-favorited'}`}
      onClick={() => wishlist.toggle(productId)}
    />
  );
}
