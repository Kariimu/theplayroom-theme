import { useId, useRef, useState, type MouseEvent } from 'react';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { HookName } from '@salla.sa/twilight-theme-engine/types/hooks';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { getActiveCurrency } from '@salla.sa/twilight-theme-engine/api/client';
import { useWishlist } from '@salla.sa/twilight-theme-engine/hooks/useWishlist';
import { CurrencySymbol, Link, Image } from '@salla.sa/twilight-theme-engine/common';
import { formatSallaPlural } from '@salla.sa/twilight-theme-engine/utils';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { SallaRatingStars } from '@salla.sa/twilight-components-react/rating-stars';
import { SallaSocialShare } from '@salla.sa/twilight-components-react/social-share';
import { SallaInstallment } from '@salla.sa/twilight-components-react/installment';
import { youtubeFacades } from '../../lib/descriptionVideos';
import { WishlistHeartButton } from './WishlistHeartButton';

interface ProductDetailsProps {
  product: Product;
}

/**
 * Theme fork of the engine `ProductDetails`.
 *
 * Differs from the engine version: the data-column blocks (title,
 * availability, sold / remaining quantity; SKU and barcode moved to
 * `ProductInfoSection` in `AddToCartForm.tsx`) render flat: no `bg-white`, no
 * `rounded`, no card padding. The `.product-form` `gap` / element `mb`
 * classes control the vertical rhythm. The brand logo passes `objectFit="contain"`
 * to `<Image>` rather than an `object-contain` class, which the component's own
 * `object-cover` default overrides. Upgrade notes: `FORKS.md`.
 */
export function ProductDetails({ product }: ProductDetailsProps) {
  const { t } = useTranslation();

  // Context for all product hooks - contains product data
  const productHookContext = { product };

  return (
    <>
      <HookSlot name={HookName.PRODUCT_DESCRIPTION_START} context={productHookContext} />

      {product.brand?.name && (
        <div className="product-brand mb-5 w-12">
          <Link className="brand-logo" to={product.brand.url || '#'} title={product.brand.name}>
            <Image
              className="max-h-full"
              objectFit="contain"
              src={product.brand.logo}
              title={product.brand.name}
              alt={product.brand.name}
              aspectRatio="1/1"
            />
          </Link>
        </div>
      )}

      <div className="mb-2.5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-10 font-bold text-gray-800">{product.name}</h1>
          {product.subtitle && (
            <h2 className="product-entry__sub-title text-lg text-gray-500 leading-6 font-normal">
              {product.subtitle}
            </h2>
          )}
        </div>

        {/* share + wishlist, pulled up beside the title on the end side.
            On mobile these move to the gallery overlay bar (`ProductGallery`),
            so this copy is hidden — see `product.scss`. */}
        <div className="product-details__title-actions flex shrink-0">
          <SallaSocialShare className="inline-flex" aria-label="social share" />

          <TitleWishlistButton productId={Number(product.id)} />
        </div>
      </div>

      {product.rating && (
        <div className="product-details__rating">
          {/* `SallaRatingStars` is a Stencil web component that defers hydration past
              first paint, so its stars/count never reach the SSR HTML (GEO audit #5) —
              the same numbers are already in the Product JSON-LD, but only as schema, not
              as text a crawler reads directly. This repeats them as real text. */}
          <span className="sr-only">
            {t('pages.products.rating_summary', ':stars out of 5, :count reviews')
              .replace(':stars', String(product.rating.stars))
              .replace(':count', String(product.rating.count))}
          </span>
          <SallaRatingStars value={product.rating.stars} reviews={product.rating.count} />
        </div>
      )}

      {product.is_taxable && (
        <small className="color-grey text-lg">{t('pages.products.tax_included')}</small>
      )}

      <ProductPrice product={product} />

      <ProductQuantityInfo product={product} />

      {product.show_availability && (
        <section className="mb-5 last:mb-0">
          <div className="center-between">
            <span className="flex items-center text-base">
              <span className="sicon-location rtl:ml-1 ltr:mr-1"></span>
              <span className="inline-block">{t('pages.products.availability')}</span>
            </span>
            <div className="mt-1 sm:mt-0 sm:col-span-2 text-end">
              <div className="flex rtl:space-x-reverse space-x-3">
                {/* A button, not `href="#!"`: it opens the branch picker and leaves the URL
                    and history alone. `with-arrow` turns the arrow to the right in LTR (`ltr.scss`). */}
                <button
                  type="button"
                  onClick={() =>
                    window.salla?.event?.dispatch('scopes::open', {
                      mode: 'availability',
                      product_id: String(product.id),
                    })
                  }
                  className="group with-arrow text-primary flex items-center justify-center"
                >
                  <span>{t('pages.products.select_branch')}</span>
                  <span className="sicon-keyboard_arrow_left ms-2 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1"></span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <HookSlot name={HookName.PRODUCT_DESCRIPTION} context={productHookContext} />

      <SallaInstallment
        price={String(
          typeof product.base_currency_price === 'object'
            ? product.base_currency_price.amount
            : product.base_currency_price
        )}
      />
    </>
  );
}

function TitleWishlistButton({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const wishlist = useWishlist();

  return (
    <WishlistHeartButton
      productId={productId}
      pressed={wishlist.has(productId)}
      className={`btn--wishlist animated hidden sm:inline-flex ${wishlist.has(productId) ? 'is-added' : 'not-added'}`}
      onClick={() => window.salla?.wishlist.toggle(productId)}
      ariaLabel={t('pages.products.add_to_wishlist', 'Add to wishlist')}
    />
  );
}

function ProductPrice({ product }: { product: Product }) {
  const { t } = useTranslation();
  // The API converts the amounts but still labels them in the store's own currency.
  const priceCurrency = getActiveCurrency(product.currency);

  return (
    <div className="flex whitespace-nowrap gap-4 items-center mb-2.5">
      <div
        className={`${product.is_on_sale ? '' : 'hidden'} space-x-2 rtl:space-x-reverse whitespace-nowrap`}
      >
        <p className="text-primary font-bold text-3xl inline-block">
          {product.sale_price} <CurrencySymbol currency={priceCurrency} />
        </p>
        <span className="text-gray-500 line-through">
          {product.regular_price} <CurrencySymbol currency={priceCurrency} />
        </span>
      </div>
      <div className={`gap-4 ${product.is_on_sale ? 'hidden' : 'flex'}`}>
        {product.starting_price && <span>{t('pages.products.starting_price')}</span>}
        <p className="text-primary font-bold text-3xl inline-block">
          {product.starting_price ?? product.price} <CurrencySymbol currency={priceCurrency} />
        </p>
      </div>
    </div>
  );
}

/** An `<iframe>` start tag; quoted values may hold `>`. */
const IFRAME_TAG = /<iframe\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;

/** Embedded players (YouTube, Vimeo, maps) load only when scrolled near, unless the merchant set `loading`. */
function lazyIframes(html: string): string {
  return html.replace(IFRAME_TAG, (tag) =>
    /\sloading\s*=/i.test(tag.replace(/"[^"]*"|'[^']*'/g, '""'))
      ? tag
      : tag.replace(/^<iframe/i, '<iframe loading="lazy"')
  );
}

interface ProductDescriptionProps {
  product: Product;
  /** Extra classes on the wrapper. */
  className?: string;
  /**
   * Always the full text, ignoring the store's "read more" setting. Set
   * inside the "Product Details" section of `ProductInfo`, which is already
   * a collapsed panel, so a second click to read it would be redundant.
   */
  expanded?: boolean;
}

/**
 * The product's description (merchant HTML). Rendered inside the "Product
 * Details" section of {@link ProductInfo}. `useId` keeps the "read more" ids
 * unique if more than one copy is ever on the page.
 */
export function ProductDescription({ product, className, expanded }: ProductDescriptionProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  // YouTube videos the shopper pressed play on; the rest stay thumbnails.
  const [playingVideos, setPlayingVideos] = useState<ReadonlySet<number>>(() => new Set());
  const moreContentId = `${useId()}-more-content`;

  if (!product.description) return null;

  const description = youtubeFacades(
    lazyIframes(product.description.replace(/&nbsp;/g, '\n')),
    playingVideos,
    t('pages.products.play_video', 'Play video')
  );

  // One listener for every thumbnail in the merchant's HTML.
  const playVideo = (event: MouseEvent<HTMLElement>) => {
    const facade = (event.target as Element).closest?.('[data-video-index]');
    if (!facade) return;
    const index = Number(facade.getAttribute('data-video-index'));
    setPlayingVideos((current) => new Set(current).add(index));
  };

  if (product.has_read_more && !expanded) {
    return (
      <div className={`product__description leading-7 mb-3${className ? ` ${className}` : ''}`}>
        <article
          ref={articleRef}
          className="article article--main relative leading-8 overflow-hidden transition-[max-height] duration-300 py-4 focus:outline-none"
          id={moreContentId}
          tabIndex={-1}
          style={{ maxHeight: isExpanded ? 'none' : '5.25rem' }}
          onClick={playVideo}
          dangerouslySetInnerHTML={{ __html: description }}
        />
        {/* Fades out once used, so it is also `inert`; focus moves to the text it revealed
            rather than dropping to the top of the page. */}
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={moreContentId}
          inert={isExpanded}
          className={`btn-show-more link--primary inline-block mt-2 cursor-pointer bg-transparent border-0 p-0 ${isExpanded ? 'is-expanded' : ''}`}
          onClick={() => {
            setIsExpanded(true);
            articleRef.current?.focus({ preventScroll: true });
          }}
        >
          {t('pages.products.read_more')}
        </button>
      </div>
    );
  }

  return (
    <div className={`product__description leading-7 mb-3${className ? ` ${className}` : ''}`}>
      <article
        className="article--main pb-1"
        onClick={playVideo}
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}

function ProductQuantityInfo({ product }: { product: Product }) {
  const { t } = useTranslation();
  // Like Twig's `{% if product.sold_quantity or product.can_show_remained_quantity %}`:
  // a product that sold 0 has nothing to show either, and the `mb-5` box would be an empty gap.
  if (!((product.sold_quantity ?? 0) > 0) && !product.can_show_remained_quantity) {
    return null;
  }

  return (
    <div className="mb-5 inline-flex text-lg">
      {(product.sold_quantity ?? 0) > 0 && (
        <div className="px-4 only:px-0 !text-red-800">
          <i className="sicon-fire rtl:ml-1.5 ltr:mr-1.5"></i> {t('pages.products.sold')}{' '}
          {/* Salla ships `sold_times` in Laravel plural format; resolve it for the count. */}
          <span>{formatSallaPlural(t('pages.products.sold_times'), product.sold_quantity!)}</span>
        </div>
      )}
      {product.can_show_remained_quantity &&
        ((product.quantity ?? 0) > 0 ? (
          <div className="inline-flex items-center gap-2 px-4 only:px-1 font-medium text-green-700">
            {/* live "in stock" dot with pulsing waves */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-40"
                style={{ animationDelay: '0.75s' }}
              />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-600" />
            </span>
            {t('blocks.product.in_stock')} ({product.quantity})
          </div>
        ) : (
          <div className="px-4 only:px-1 !text-red-800">
            <i className="sicon-box-bankers rtl:ml-1.5 ltr:mr-1.5"></i>
            {t('pages.products.remained')} <span>{product.quantity ?? 0}</span>
          </div>
        ))}
    </div>
  );
}
