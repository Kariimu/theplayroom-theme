import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { getCdnImageSrcSet, getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import type { HomeComponentData, ProductTag } from '@salla.sa/twilight-theme-engine/types';
import { ScrollCarousel } from '../common';
import { resolveUsageGallery } from '../../lib/productUsageGallery';

export interface ProductUsageGalleryProps {
  /** `home.queries.components()` from the product route loader (same data as the FAQ). */
  components?: HomeComponentData[];
  tags?: ProductTag[];
}

/** Card widths the CDN resizes to: one column on phones, three across from `md`. */
const IMAGE_WIDTHS = [360, 480, 720, 960] as const;
const IMAGE_SIZES = '(min-width: 768px) 33vw, 100vw';

/**
 * "The product in use" gallery (replaces the legacy `slider_in_products` card
 * slider, 06 §7.6, §5A row 70): a photo, title and description per card, from
 * the `product-usage-gallery` home block cards whose group key matches one of
 * the product's `inuse-<key>` tags (`app/lib/productUsageGallery.ts`).
 *
 * One markup for both layouts: the shared {@link ScrollCarousel} row from `md`
 * up (three across, arrows and count), and a plain one-column grid on phones —
 * `product-usage-gallery.scss` turns the track into a grid and hides the dots,
 * so there is no viewport check and no hydration gate. Renders nothing when
 * the product has no matching card.
 *
 * Takes `tags` from `initialProduct`, like `ProductFeatures`: a variant reload
 * replaces the live product with a response that may not carry them.
 */
export function ProductUsageGallery({ components, tags }: ProductUsageGalleryProps) {
  const { t } = useTranslation();
  const { title, cards } = resolveUsageGallery(components, tags);
  if (!cards.length) return null;

  const heading = title || t('pages.products.usage_gallery_title', 'See it in action');

  return (
    <section className="product-usage-gallery container" aria-labelledby="product-usage-gallery-title">
      <ScrollCarousel
        className="product-usage-gallery__track"
        heading={
          <h2 id="product-usage-gallery-title" className="product-usage-gallery__heading">
            {heading}
          </h2>
        }
        prevLabel={t('blocks.home.reviews_prev', 'Previous')}
        nextLabel={t('blocks.home.reviews_next', 'Next')}
      >
        {cards.map((card, index) => (
          // A static settings list with no id; see .react-doctor/false-positives.md.
          // react-doctor-disable-next-line react-doctor/no-array-index-as-key
          <figure key={index} className="product-usage-gallery__card">
            <img
              src={getCdnImageUrl(card.image, { width: 720 }) ?? card.image}
              srcSet={getCdnImageSrcSet(card.image, IMAGE_WIDTHS)}
              sizes={IMAGE_SIZES}
              alt={card.title}
              width={720}
              height={720}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="product-usage-gallery__image"
            />
            <figcaption className="product-usage-gallery__caption">
              <h3 className="product-usage-gallery__title">{card.title}</h3>
              {card.desc && <p className="product-usage-gallery__desc">{card.desc}</p>}
            </figcaption>
          </figure>
        ))}
      </ScrollCarousel>
    </section>
  );
}
