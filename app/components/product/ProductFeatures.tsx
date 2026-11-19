import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import type { ProductTag } from '@salla.sa/twilight-theme-engine/types';
import { resolveProductFeatures, type ProductFeature } from '../../lib/productFeatures';

export interface ProductFeaturesProps {
  tags?: ProductTag[];
  library?: ProductFeature[];
}

/**
 * This product's own features (replaces the old `special_features` grid,
 * 06 §7.6): the product's `feature-<key>` tags, each resolved against the blog
 * feature library the route loader fetched (`app/lib/productFeatures.ts`).
 * Title only, linking to the feature's explainer article. Renders nothing
 * when the product has no matching feature.
 *
 * Takes `tags` from `initialProduct`, like `ProductAddOns`: a variant reload
 * replaces the live product with a response that may not carry them.
 */
export function ProductFeatures({ tags, library }: ProductFeaturesProps) {
  const { t } = useTranslation();
  const features = resolveProductFeatures(tags, library);
  if (!features.length) return null;

  return (
    <section
      className="product-features"
      aria-label={t('pages.products.features_title', 'Product features')}
    >
      <ul className="product-features__list">
        {features.map((feature) => {
          const body = (
            <>
              <span className="product-features__icon">
                {feature.image && (
                  <img
                    src={getCdnImageUrl(feature.image, { width: 160 }) ?? feature.image}
                    alt=""
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </span>
              <span className="product-features__title">{feature.title}</span>
            </>
          );
          return (
            <li key={feature.key} className="product-features__item">
              {feature.url ? (
                <Link to={feature.url} className="product-features__link">
                  {body}
                </Link>
              ) : (
                <span className="product-features__link">{body}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
