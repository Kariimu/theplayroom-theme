import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { ProductsListSkeleton } from '@salla.sa/twilight-components-react';
import { ProductCard } from '../product';
import { ScrollCarousel } from '../common';
import { toIds } from '../../lib/pickerValue';
import { resolveLink } from '../../lib/resolveLink';

export interface ProductsSectionProps {
  data: {
    title_section?: string;
    desc_section?: string;
    products?: unknown;
    btn_text?: string;
    button_url?: unknown;
    desc2_section?: string;
    position?: number;
    [key: string]: unknown;
  };
}

/**
 * `products-section` home block — a row of merchant-chosen products (up to 24,
 * no tabs) in the shared {@link ScrollCarousel}, with an optional header, a
 * footer blurb and a "view all" button. Matches the reference site's own
 * version of this block, which is a slider on every breakpoint, not a grid —
 * same convention as {@link ProductsSlider}: cards are always vertical, the
 * store's `product_card_layout` applies to grids and lists only. Simpler than
 * `featured-products`: one fixed selection, no category/tag/latest sources.
 */
export const ProductsSection = memo(function ProductsSection({ data }: ProductsSectionProps) {
  const { t } = useTranslation();
  const {
    title_section: title,
    desc_section: description,
    products: productsField,
    btn_text: buttonText,
    button_url: buttonUrl,
    desc2_section: footerText,
  } = data;

  const ids = useMemo(() => toIds(productsField), [productsField]);
  const link = resolveLink(buttonUrl);

  const { data: result, isSuccess } = useQuery({
    ...product.queries.list({ source: 'selected', sourceValue: ids, perPage: ids.length }),
    enabled: ids.length > 0,
  });
  const items = result?.items as Product[] | undefined;

  if (!ids.length) return null;

  return (
    <div className="container">
      {(title || description) && (
        <div className="mb-10 md:mb-16">
          {title && <h2 className="mb-2 text-3xl font-black text-brand-navy">{title}</h2>}
          {description && <p className="text-lg font-medium text-gray-500">{description}</p>}
        </div>
      )}

      {!isSuccess ? (
        <ProductsListSkeleton />
      ) : (
        <ScrollCarousel
          prevLabel={t('blocks.home.reviews_prev', 'Previous')}
          nextLabel={t('blocks.home.reviews_next', 'Next')}
        >
          {(items ?? []).map((item) => (
            <div key={item.id} className="s-products-carousel__slide">
              <ProductCard product={item} layout="vertical" />
            </div>
          ))}
        </ScrollCarousel>
      )}

      {((link && buttonText) || footerText) && (
        <div className="mt-8 text-center">
          {link && buttonText && (
            <Link
              to={link}
              className="inline-block rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-reverse shadow-lg transition-shadow hover:shadow-xl"
            >
              {buttonText}
            </Link>
          )}
          {footerText && (
            <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-gray-500 md:text-xl">
              {footerText}
            </p>
          )}
        </div>
      )}
    </div>
  );
});
