import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { ProductsListSkeleton } from '@salla.sa/twilight-components-react';
import { ScrollCarousel } from '../common';
import { ProductCard } from '../product';
import { isCartUpsellProduct } from '../../lib/tags';

/**
 * How many products to scan for the `cart-upsell` tag. There is no API to
 * resolve a tag *name* to the numeric id `source: 'tags'` needs (`app/lib/tags.ts`'s
 * `tagIdFromUrl` only works from a product that already carries the tag — the
 * cart has no such product in context). So this fetches a candidate page and
 * filters by tag name client-side, same documented tradeoff as the Group-Value
 * filters (`app/lib/tagGroupFilters.ts`): it only sees this one page. The live
 * catalogue is 14 products (Phase 0b), so 50 covers it today; a much larger
 * catalogue would need a real tag-id lookup instead.
 */
const CANDIDATE_PAGE_SIZE = 50;
const DISPLAY_LIMIT = 8;

export interface CartUpsellSliderProps {
  /** Product ids already in the cart — excluded from the suggestions. */
  excludeIds: number[];
}

/**
 * "You might also like" — products tagged `cart-upsell` (docs/MIGRATION-PLAN.md
 * row 10/74, replaces the old theme's `products_in_cart` setting), shown below
 * the cart's items/summary row. Same card/carousel as {@link ProductsSlider}
 * but with its own fetch: that component's `source`/`sourceValue` can't express
 * "filter a page by tag name", only "list by tag id".
 */
export function CartUpsellSlider({ excludeIds }: CartUpsellSliderProps) {
  const { t } = useTranslation();
  const { data, isSuccess, isError } = useQuery(
    product.queries.list({ source: 'latest', perPage: CANDIDATE_PAGE_SIZE })
  );

  if (isError) return null;

  if (!isSuccess) {
    return (
      <div className="s-products-carousel s-products-carousel--vertical">
        <ProductsListSkeleton />
      </div>
    );
  }

  const excluded = new Set(excludeIds);
  const items = data.items
    .filter((item) => !excluded.has(Number(item.id)) && isCartUpsellProduct(item.tags))
    .slice(0, DISPLAY_LIMIT);

  if (items.length === 0) return null;

  return (
    <div className="s-products-carousel s-products-carousel--vertical">
      <ScrollCarousel
        heading={
          <div className="s-products-carousel__head">
            <h2 className="s-products-carousel__title">
              {t('pages.cart.upsell_title', 'You May Also Like')}
            </h2>
          </div>
        }
        prevLabel={t('blocks.home.reviews_prev', 'Previous')}
        nextLabel={t('blocks.home.reviews_next', 'Next')}
      >
        {items.map((item) => (
          <div key={item.id} className="s-products-carousel__slide">
            <ProductCard product={item} layout="vertical" />
          </div>
        ))}
      </ScrollCarousel>
    </div>
  );
}
