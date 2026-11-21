import { Fragment, useEffect, useMemo, useState } from 'react';
import { SallaQuickOrder } from '@salla.sa/twilight-components-react/quick-order';
import { SallaOffer } from '@salla.sa/twilight-components-react/offer';
import { SallaPayments } from '@salla.sa/twilight-components-react/payments';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useProduct } from '@salla.sa/twilight-theme-engine/hooks/useProduct';
import { useComments } from '@salla.sa/twilight-theme-engine/hooks/useComments';
import { Breadcrumb, RenderWhenVisible } from '@salla.sa/twilight-theme-engine/common';
import { PageBlocks } from '@salla.sa/twilight-theme-engine/home';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import type { ProductPageProps } from '@salla.sa/twilight-theme-engine/routes/product';
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import { ProductGallery } from './ProductGallery';
import { ProductDetails } from './ProductDetails';
import { ProductInfo } from './ProductInfo';
import { ProductAddOns } from './ProductAddOns';
import { ProductFeatures } from './ProductFeatures';
import type { ProductFeature } from '../../lib/productFeatures';
import { AddToCartForm } from './AddToCartForm';
import { ProductWhatsAppEnquiry } from './ProductWhatsAppEnquiry';
import { UniversalFeatures } from './UniversalFeatures';
import { ProductUsageGallery } from './ProductUsageGallery';
import { ProductFaq } from './ProductFaq';
import { SuggestedGames } from './SuggestedGames';
import { ProductReviews } from './ProductReviews';
import { BlockHookSlot } from '../common';
import { ProductsSlider } from '../home/ProductsSlider';
import { isWhatsappProduct } from '../../lib/tags';
import { cleanWhatsappNumber } from '../../lib/whatsapp';

/**
 * "Similar products" slider. A separate component (not inline in
 * `ProductPage`) so `relatedCount` lives *inside* the product's keyed
 * `<Fragment>` and resets for free on every product → product navigation,
 * instead of needing a `useEffect` to reset it by hand.
 */
function RelatedProducts({ productId, title }: { productId: number; title: string }) {
  // `null` until the related-products list resolves; `0` once we know there are
  // none — then the lazy `<section>` / `.container` wrapper is dropped entirely
  // rather than left empty in the DOM.
  const [relatedCount, setRelatedCount] = useState<number | null>(null);

  return (
    <>
      <HookSlot name="product:related.start" />
      {/* Dropped once we know there are no related products, so no empty
          `<section>` / `.container` is left behind. `estimatedHeight="0"`: until
          then, don't reserve 400px for a block that may render nothing. */}
      {relatedCount !== 0 && (
        <RenderWhenVisible estimatedHeight="0px">
          <div className="container">
            <ProductsSlider
              data={{
                products: { source: 'related', source_value: productId },
                title,
                display_all_url: '',
              }}
              onResolve={setRelatedCount}
            />
          </div>
        </RenderWhenVisible>
      )}
      <HookSlot name="product:related.end" />
    </>
  );
}

/**
 * Theme fork of the engine `ProductPage` (wired in from
 * `app/routes/$slug.p$id.tsx`).
 *
 * Same structure as upstream, but renders the theme's flat-markup
 * {@link ProductDetails} / {@link AddToCartForm} and the theme's scroll-carousel
 * {@link ProductsSlider} for the "similar products" block (matching the homepage
 * product cards). The engine's bottom store-wide testimonials block is dropped —
 * `<SallaComments>` already covers product reviews on this page. A
 * `whatsapp`-tagged product (06 §7) gets {@link ProductWhatsAppEnquiry} instead
 * of `<AddToCartForm>` — same convention as the product card. Also adds what
 * the engine route doesn't render at all: trust/payment badges beside the
 * form, then between the info and the reviews {@link SuggestedGames} (a `set:`
 * tag companion list), the product's own in-use photos ({@link
 * ProductUsageGallery}, §5A row 70) and the store-wide {@link UniversalFeatures},
 * and the store-wide {@link ProductFaq} between the reviews and related products
 * (06 §7, §5A rows 71/72/80, D2).
 *
 * Upgrade notes: `FORKS.md`.
 */
export type ProductPageWithFaq = ProductPageProps & {
  faqComponents?: HomeComponentData[];
  /** The blog feature library; only loaded when the product has a `feature-` tag. */
  featureLibrary?: ProductFeature[];
};

export function ProductPage({
  product: initialProduct,
  page,
  faqComponents,
  featureLibrary,
}: ProductPageWithFaq) {
  const { theme, store } = useTwilight();
  const { t } = useTranslation();
  const { product } = useProduct(initialProduct);
  const { commentsKey } = useComments();
  const blockScope = useMemo(() => ({ product_id: product.id }), [product.id]);

  // Products tagged `whatsapp` can't be bought online (06 §7): the add-to-cart
  // form becomes a WhatsApp enquiry block, same convention as the card.
  const waNumber = (theme?.settings as { whatsapp_number?: string | number } | undefined)
    ?.whatsapp_number;
  const isWhatsapp = isWhatsappProduct(product.tags) && !!cleanWhatsappNumber(waNumber);

  // The Twig storefront bootstraps `salla.config` with `user.can_comment`; the
  // React SDK init doesn't, so it's `null` and `<salla-comment-form>` (and the
  // `<salla-comments>` container gate) render empty even for eligible buyers.
  // The engine *does* expose the same flag as `store.settings.product
  // .user_can_comment` — copy it across before the lazy comments block mounts.
  useEffect(() => {
    const salla = window.salla;
    if (!salla?.config?.set) return;
    if (salla.config.get('user.can_comment') != null) return;
    const canComment = salla.config.get('store.settings.product.user_can_comment');
    if (typeof canComment !== 'boolean') return;
    salla.config.set('user', { ...(salla.config.get('user') || {}), can_comment: canComment });
  }, []);

  // The engine breadcrumb replaces the product's category crumb with the page
  // you came from (a stored "referrer"). Drop it — synchronously, before
  // `<Breadcrumb>` mounts and reads it — so the real Home › Category › Product
  // trail shows. Guarded: `window` doesn't exist during SSR.
  useState(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage?.removeItem('breadcrumb-referrer');
    } catch {
      /* sessionStorage unavailable (private mode) */
    }
  });

  return (
    // Keyed Fragment (not a wrapper <div>): remounts the whole subtree on a
    // product → product navigation so gallery / form state resets, without
    // adding a node between `#main-content` and the page's sections.
    <Fragment key={product.id}>
      {/* App-block hook `product.single.before_product_info` — above the gallery / info grid */}
      <BlockHookSlot
        name="product.single.before_product_info"
        wrapper="s-before-product-info"
        className="!mt-0"
        scope={blockScope}
      />

      <div className="container">
        {theme?.settings?.product_show_breadcrumbs !== false && <Breadcrumb page={page} />}

        <HookSlot name="product:start" />

        <div className="flex flex-col items-start md:flex-row" id={`product-${product.id}`}>
          <ProductGallery product={product} />

          <div className="main-content w-full md:w-2/4 md:pb-16 text-lg">
            {/* Base text size for this column: the product's normal/body text
                (labels, SKU/weight rows, descriptions) was 14–15px (`text-sm`
                or the unset body default); 18px now, set once here rather than
                on every individual element. Anything with its own explicit
                size class (the 36px title, 30px price, the 18px facts/specs
                rows already set directly) is unaffected — a class always wins
                over this inherited value. */}
            <HookSlot name="product:details.start" />
            <ProductDetails product={initialProduct} />
            <HookSlot name="product:details.end" />

            <HookSlot name="product:single.form.start" />
            {isWhatsapp ? (
              <ProductWhatsAppEnquiry product={product} number={waNumber} />
            ) : (
              <AddToCartForm product={product} stickyAddToCart={theme.settings.sticky_add_to_cart} />
            )}
            {/* Payment options (06 §7, §5A row 80) — trust badges dropped here,
                `Footer` already shows them once; showing them twice on the
                same page was redundant. */}
            <div className="product-payments mt-5">
              <SallaPayments />
            </div>

            {/* Product information in four collapsible sections (details,
                specifications, assembly, shipping & returns): the description
                plus every custom-field group, including for-who / material /
                box contents (§5A row 65). Same place on mobile and desktop.
                `initialProduct`, not the live `product` from `useProduct`: a
                variant-options reload replaces that object wholesale from
                `getDetails(id, ["images", "category"])`, whose response
                doesn't carry `has_metadata` — it would go from true to
                undefined the moment a shopper touches an option. */}
            <ProductInfo product={initialProduct} />

            {/* Accessory products sold alongside this one — also under the
                payment badges, each with its own catalog entry and one-click
                add to cart. Renders only when this product is the master of
                an `addons-p<id>` group (`ProductAddOns`); an accessory's own
                page renders nothing. `initialProduct.tags`, not the live
                `product` from `useProduct`, for the same variant-reload
                reason as `ProductInfo` above. */}
            <ProductAddOns productId={product.id} tags={initialProduct.tags} />

            <HookSlot name="product:single.form.end" />
            {/* Twig renders this hook and its merchant blocks after the form */}
            <HookSlot name="product:single.description.end" context={{ product }} />
            <PageBlocks hook="product:single.description.end" scope={blockScope} />

            <SallaQuickOrder className="mt-5 md:-mb-2 block" />
          </div>
        </div>

        <SallaOffer />

        {/* This product's own features (06 §7.6, §5A row 69): `feature-<key>`
            tags resolved against the blog feature library, directly under the
            product info and above the suggested games. */}
        <ProductFeatures tags={initialProduct.tags} library={featureLibrary} />
      </div>

      {/* "Suggested games" (06 §7.5, §5A row 71) — under the product info */}
      <SuggestedGames productId={product.id} tags={product.tags} />

      {/* The product in use (06 §7.6, §5A row 70): cards from the
          `product-usage-gallery` home block matched by `inuse-<key>` tags —
          directly above the store-wide features. */}
      <ProductUsageGallery components={faqComponents} tags={initialProduct.tags} />

      {/* Store-wide features (06 §7.8, §5A row 72) — directly above the reviews */}
      <UniversalFeatures />

      {/* App-block hook `product.single.before_customer_reviews` — kept directly above the reviews */}
      <BlockHookSlot
        name="product.single.before_customer_reviews"
        wrapper="s-before-reviews"
        scope={blockScope}
      />

      {store.settings?.rating?.show_on_product && (
        // `estimatedHeight="0"`: `RenderWhenVisible` hard-codes `min-height` on its
        // wrapper section and never clears it, so the default 400px leaves an empty
        // gap when the product has no reviews. Comments size themselves once present.
        <RenderWhenVisible estimatedHeight="0px" className="s-block s-block--full-bg text-start">
          <ProductReviews key={commentsKey} product={product} />
        </RenderWhenVisible>
      )}

      {/* Store-wide FAQ, same content as the home block (06 §7.8, D2) — between
          the reviews and related */}
      <ProductFaq components={faqComponents} />

      {/* App-block hook `product.single.before_product_recommendations` — between the reviews and related */}
      <BlockHookSlot
        name="product.single.before_product_recommendations"
        wrapper="s-before-related"
        scope={blockScope}
      />

      <RelatedProducts productId={product.id} title={t('pages.products.similar_products')} />

      {/* App-block hook `product.single.after_product_recommendations` — end of the product page */}
      <BlockHookSlot
        name="product.single.after_product_recommendations"
        wrapper="s-after-related"
        scope={blockScope}
      />

      <HookSlot name="product:end" />
    </Fragment>
  );
}
