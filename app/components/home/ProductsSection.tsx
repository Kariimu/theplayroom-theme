import { Suspense, memo, useCallback, useMemo } from 'react';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { product } from '@salla.sa/twilight-theme-engine/api/product';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import {
  SallaProductsList,
  ProductsListSkeleton,
  ProductCardSkeleton,
} from '@salla.sa/twilight-components-react';
import { ProductCard } from '../product';
import { useProductCardLayout } from '../../hooks/useProductCardLayout';
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
 * `products-section` home block — a plain grid of merchant-chosen products
 * (up to 24, no tabs), with an optional header, a footer blurb and a "view
 * all" button. Simpler than `featured-products`: one fixed selection, no
 * category/tag/latest sources.
 */
export const ProductsSection = memo(function ProductsSection({ data }: ProductsSectionProps) {
  const {
    title_section: title,
    desc_section: description,
    products: productsField,
    btn_text: buttonText,
    button_url: buttonUrl,
    desc2_section: footerText,
  } = data;

  const ids = useMemo(() => toIds(productsField), [productsField]);
  const cardLayout = useProductCardLayout();
  const link = resolveLink(buttonUrl);

  const loader = useCallback(
    () => product.list({ source: 'selected', sourceValue: ids, perPage: ids.length }),
    [ids]
  );

  if (!ids.length) return null;

  return (
    <div className="container">
      {(title || description) && (
        <div className="s-block__title text-center">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && <p className="text-sm opacity-70">{description}</p>}
        </div>
      )}

      <Suspense fallback={<ProductsListSkeleton />}>
        <SallaProductsList
          loader={loader}
          mode="once"
          itemsClassName={`s-products-list-${cardLayout}-cards`}
          skeleton={<ProductCardSkeleton />}
          skeletonType="item"
          skeletonCount={Math.min(ids.length, 10)}
        >
          {(items: Product[]) =>
            items.map((item) => <ProductCard key={item.id} product={item} layout={cardLayout} />)
          }
        </SallaProductsList>
      </Suspense>

      {footerText && <p className="text-sm text-center opacity-70 mt-4">{footerText}</p>}

      {link && buttonText && (
        <div className="text-center mt-6">
          <Link to={link} className="btn btn--outline">
            {buttonText}
          </Link>
        </div>
      )}
    </div>
  );
});
