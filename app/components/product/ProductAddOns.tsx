import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { Link, Image } from '@salla.sa/twilight-theme-engine/common';
import type { Product, ProductTag } from '@salla.sa/twilight-theme-engine/types';
import { ScrollCarousel } from '../common';
import { TAG_PREFIX, tagIdFromUrl, isWhatsappProduct } from '../../lib/tags';

export interface ProductAddOnsProps {
  productId: number;
  tags?: ProductTag[];
}

/**
 * Standalone accessory products sold alongside this one (e.g. a swing or
 * rings next to a climbing frame) — each its own real catalog product, with
 * its own one-click add to cart, not a product option.
 *
 * Directional, not a shared/symmetric group (`app/lib/tags.ts`): the master
 * product and every accessory are tagged with the identical
 * `addons-p<masterId>` tag, but only the product whose *own* id matches the
 * key renders this row — so the master's page lists its accessories, while an
 * accessory's own page (carrying the same tag for a different id) renders
 * nothing. Resolves that tag's numeric id the same way {@link SuggestedGames}
 * resolves its `set:` tag (`ProductTag.id` isn't populated on list responses,
 * so falls back to parsing it from the tag's own URL) to list the group's
 * other members.
 *
 * Takes `tags` from the caller rather than reading them off a live `product`
 * itself — on the product page it's passed `initialProduct.tags`, since a
 * variant-options reload replaces the live product wholesale from
 * `getDetails(id, ["images", "category"])`, which doesn't carry every field
 * the initial load did.
 */
export function ProductAddOns({ productId, tags }: ProductAddOnsProps) {
  const { t } = useTranslation();

  // Only a tag whose key is *this product's own id* qualifies — that's what
  // makes the product the group's master instead of just another accessory.
  const masterTag = tags?.find((tag) => {
    const name = tag.name?.trim().toLowerCase();
    if (!name?.startsWith(TAG_PREFIX.addOn)) return false;
    return name.slice(TAG_PREFIX.addOn.length).trim() === String(productId);
  });
  const tagId = masterTag ? (masterTag.id ?? tagIdFromUrl(masterTag.url)) : null;

  const { data, isSuccess } = useQuery({
    ...product.queries.list({ source: 'tags', sourceValue: tagId ?? undefined, perPage: 10 }),
    enabled: tagId != null,
  });

  const items = data?.items?.filter((item) => Number(item.id) !== productId);

  // Nothing while loading (no skeleton — this sits above the fold and a
  // product that isn't a group's master, the common case, should render
  // instantly with no reserved space) and nothing once it's known to be empty.
  if (!tagId || !isSuccess || !items?.length) return null;

  return (
    <div className="product-addons">
      <h3 className="product-addons__title">
        {t('pages.products.add_ons.title', 'Product add-ons')}
      </h3>
      <ScrollCarousel
        prevLabel={t('blocks.home.reviews_prev', 'Previous')}
        nextLabel={t('blocks.home.reviews_next', 'Next')}
        className="product-addons__track"
      >
        {items.map((item) => (
          <div key={item.id} className="product-addons__slide">
            <AddOnCard product={item} />
          </div>
        ))}
      </ScrollCarousel>
    </div>
  );
}

function AddOnCard({ product: item }: { product: Product }) {
  const { t } = useTranslation();
  const { format } = useMoney();
  const [isAdding, setIsAdding] = useState(false);
  const itemId = Number(item.id);

  // Added to cart with nothing chosen yet — regardless of type or options —
  // same as any other add-on: the cart page already renders
  // `<salla-product-options>` per line item (`CartItem`), so the shopper
  // picks a product's options (or an installation city, a size, etc.) there
  // instead of detouring through this add-on's own product page. Only a
  // WhatsApp-only product, which isn't a cart item at all, still falls back
  // to its own page.
  const needsProductPage = isWhatsappProduct(item.tags);

  const handleQuickAdd = () => {
    if (isAdding) return;
    setIsAdding(true);
    const salla = window.salla as
      | { cart?: { addItem?: (payload: { id: number | string; quantity?: number }) => Promise<unknown> } }
      | undefined;
    void salla?.cart?.addItem?.({ id: itemId, quantity: 1 }).finally(() => setIsAdding(false));
  };

  return (
    <div className="product-addons__card">
      <Link to={item.url} className="product-addons__media" aria-label={item.name}>
        <Image
          src={item.image?.url}
          alt={item.name}
          aspectRatio="1/1"
          objectFit="cover"
          noWrapper
        />
      </Link>

      <Link to={item.url} className="product-addons__name">
        {item.name}
      </Link>

      <p className="product-addons__price">{format(item.price)}</p>

      {item.is_out_of_stock ? (
        <span className="product-addons__btn product-addons__btn--disabled">
          {t('pages.products.out_of_stock', 'Out of Stock')}
        </span>
      ) : needsProductPage ? (
        <Link to={item.url} className="product-addons__btn">
          {t('pages.products.select_options', 'Select Options')}
        </Link>
      ) : (
        <button
          type="button"
          className="product-addons__btn"
          aria-busy={isAdding}
          disabled={isAdding}
          onClick={handleQuickAdd}
        >
          {t('pages.products.add_to_cart', 'Add to Cart')}
        </button>
      )}
    </div>
  );
}
