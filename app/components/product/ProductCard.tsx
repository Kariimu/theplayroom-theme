import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import { ProductCard as EngineProductCard } from '@salla.sa/twilight-theme-engine/product';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useWishlist } from '@salla.sa/twilight-theme-engine/hooks/useWishlist';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { StarIcon, ShoppingBagIcon, WhatsAppIcon } from '../icons';
import { registerNativeBookingHook } from '../../lib/nativeBooking';
import { withImageFallback } from '../../lib/productImage';
import { isWhatsappProduct } from '../../lib/tags';
import { cleanWhatsappNumber, whatsappEnquiryHref } from '../../lib/whatsapp';
import { WishlistHeartButton } from './WishlistHeartButton';

type ProductCardProps = ComponentProps<typeof EngineProductCard>;

/**
 * `vertical` (grid-card) products get a fully custom card matching the brand's
 * reference design; every other layout (`horizontal`, `fullImage`, `minimal`,
 * `special` — list view, slider cards, etc.) keeps going through the engine's
 * own `ProductCard` via {@link EngineWrappedProductCard}, unchanged.
 * Styling: `04-components/product.scss` (`.product-card`).
 */
export function ProductCard(props: ProductCardProps) {
  const layout = props.layout ?? 'vertical';
  if (layout === 'vertical') return <VerticalProductCard {...props} />;
  return <EngineWrappedProductCard {...props} />;
}

/**
 * Custom grid card: click on the quick-action button adds straight to the
 * cart (`salla.cart.addItem`, old Twig card's `.add-btn` behaviour — 06 §1);
 * a product with options/a non-plain type (bookings included, since picking
 * a date needs the product page) links there instead. A WhatsApp-tagged
 * product keeps its enquiry link, same rule as the engine-wrapped card.
 *
 * Hover shows a second photo on pointer devices, as the old card did
 * (`loadSecondaryImage`) — but only when the API actually sent one.
 * `product.images` is a detail-response-only field (theme-engine's own
 * `Product` type): a list/grid product normally has just `product.image`, so
 * in practice this never fires outside a context that fetched details. Kept
 * for when it does, and so a future `images` include on list responses picks
 * it up for free.
 *
 * Honoring `product_card_img_ratio` (the fixed-ratio boxes in
 * `product.scss`) would fight the reference's fixed `aspect-square` photo;
 * this card always renders a square image regardless of that setting.
 */
function VerticalProductCard(props: ProductCardProps) {
  const { t } = useTranslation();
  const { theme } = useTwilight();
  const { format } = useMoney();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const { product, isPlaceholder } = useMemo(() => withImageFallback(props.product), [props.product]);
  const productId = Number(product.id);

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

  const needsProductPage = product.has_options || product.type !== 'product';
  const hoverImageUrl = product.images?.find((img) => img.url && img.url !== product.image?.url)?.url;

  const handleQuickAdd = () => {
    if (isAdding) return;
    setIsAdding(true);
    const salla = window.salla as
      | { cart?: { addItem?: (payload: { id: number | string; quantity?: number }) => Promise<unknown> } }
      | undefined;
    void salla?.cart
      ?.addItem?.({ id: productId, quantity: 1 })
      .finally(() => setIsAdding(false));
  };

  return (
    <div
      className={`product-card group${product.is_out_of_stock ? ' product-card--out-of-stock' : ''}`}
      data-image-placeholder={isPlaceholder ? 'true' : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Stretched link: the card's one accessible link to the product page.
          Title/price below are plain text, not a second nested link — a
          `<button>`/`<a>` inside an `<a>` is invalid HTML, so the quick-action
          button stays a sibling, stacked above this with `z-[1]`. */}
      <Link to={product.url} className="product-card__link" aria-label={product.name} />

      <div className="product-card__media">
        <img
          src={getCdnImageUrl(product.image?.url, { width: 400 }) ?? product.image?.url}
          alt=""
          loading="lazy"
          decoding="async"
          className="product-card__image product-card__image--base"
          style={isHovered && hoverImageUrl ? { opacity: 0 } : undefined}
        />
        {hoverImageUrl && (
          <img
            src={getCdnImageUrl(hoverImageUrl, { width: 400 }) ?? hoverImageUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="product-card__image product-card__image--hover"
            style={isHovered ? { opacity: 1 } : undefined}
          />
        )}

        {!product.is_out_of_stock && !!product.promotion_title && (
          <span className="product-card__badge">{product.promotion_title}</span>
        )}

        {isWhatsapp ? (
          waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="product-card__quick-action"
              aria-label={t('blocks.whatsapp.enquiry_button', 'Enquire on WhatsApp')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          )
        ) : product.is_out_of_stock ? (
          <span className="product-card__quick-action product-card__quick-action--disabled" aria-hidden="true">
            <ShoppingBagIcon width={20} height={20} aria-hidden="true" />
          </span>
        ) : needsProductPage ? (
          <Link
            to={product.url}
            className="product-card__quick-action"
            aria-label={t('pages.products.select_options', 'Select Options')}
          >
            <ShoppingBagIcon width={20} height={20} aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            className="product-card__quick-action"
            aria-label={t('pages.products.add_to_cart', 'Add to Cart')}
            aria-busy={isAdding}
            disabled={isAdding}
            onClick={handleQuickAdd}
          >
            <ShoppingBagIcon width={20} height={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="product-card__body">
        {!!product.subtitle && <p className="product-card__subtitle">{product.subtitle}</p>}
        <h3 className="product-card__title">{product.name}</h3>

        {!!product.rating?.count && (
          <div className="product-card__rating">
            {Array.from({ length: 5 }, (_, i) => (
              <StarIcon
                key={i}
                width={16}
                height={16}
                className={i < Math.round(product.rating!.stars) ? 'product-card__star--filled' : 'product-card__star'}
              />
            ))}
            <span className="product-card__rating-count">({product.rating.count})</span>
          </div>
        )}

        <div className="product-card__price">
          {product.is_on_sale ? (
            <>
              <span className="product-card__price-now">{format(product.price)}</span>
              <span className="product-card__price-was">{format(product.regular_price)}</span>
            </>
          ) : (
            <span className="product-card__price-now">{format(product.price)}</span>
          )}
        </div>
      </div>

      {product.is_out_of_stock && (
        <span className="product-card__oos-label">{t('pages.products.out_of_stock', 'Out of Stock')}</span>
      )}
    </div>
  );
}

/**
 * Thin wrapper over the engine `ProductCard`, used for every layout besides
 * `vertical` (handled by {@link VerticalProductCard} instead).
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
function EngineWrappedProductCard(props: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);
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
        // engine ships the card button fill="outline"; make it solid + centre its spinner.
        // For whatsapp products the button is hidden by CSS (`[data-whatsapp]`) and the
        // enquiry link is portaled into the footer below — no DOM surgery here.
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
  }, []);

  return (
    <div
      ref={ref}
      style={{ display: 'contents' }}
      data-image-placeholder={isPlaceholder ? 'true' : undefined}
      data-whatsapp={isWhatsapp ? 'true' : undefined}
    >
      <EngineProductCard {...props} product={product} />
      {footerEl &&
        createPortal(
          // List responses send the id as a numeric string; the wishlist holds numbers.
          <FooterWishlistButton productId={Number(props.product.id)} />,
          footerEl
        )}
      {isWhatsapp &&
        footerEl &&
        waHref &&
        createPortal(
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="s-product-card-whatsapp-btn"
          >
            <WhatsAppIcon width={18} height={18} aria-hidden="true" />
            <span>{t('blocks.whatsapp.enquiry_button', 'Enquire on WhatsApp')}</span>
          </a>,
          footerEl
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
