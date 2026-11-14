import { useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { CheckCircleIcon, QuoteIcon, StarIcon } from '../icons';
import { ScrollCarousel } from './ScrollCarousel';
import { BottomSheet } from './BottomSheet';

export interface TestimonialItem {
  avatar?: string;
  name?: string;
  text?: string;
  stars?: number;
  /** A customer-submitted photo; shown behind a "view photo" trigger, not inline. */
  image?: string;
}

const MAX_STARS = 5;
const STAR_POSITIONS = Array.from({ length: MAX_STARS }, (_, position) => position + 1);

function TestimonialCard({
  item,
  onViewPhoto,
}: {
  item: TestimonialItem;
  onViewPhoto: () => void;
}) {
  const { t } = useTranslation();
  const name = item.name?.trim();
  const stars = Math.max(0, Math.min(MAX_STARS, Math.round(Number(item.stars ?? 0))));

  return (
    <figure className="testimonial-card">
      <div className="testimonial-card__inner">
        <QuoteIcon className="testimonial-card__quote" aria-hidden="true" />

        <blockquote className="testimonial-card__text">{item.text}</blockquote>

        {stars > 0 && (
          <span
            className="testimonial-card__stars"
            role="img"
            aria-label={`${stars} ${t('blocks.home.count_of', 'of')} ${MAX_STARS}`}
          >
            {STAR_POSITIONS.map((position) => (
              <StarIcon
                key={position}
                className={position <= stars ? 'is-on' : undefined}
                aria-hidden="true"
              />
            ))}
          </span>
        )}

        {name && (
          <figcaption className="testimonial-card__person">
            <b className="testimonial-card__name">{name}</b>
            <CheckCircleIcon className="testimonial-card__verified" aria-hidden="true" />
          </figcaption>
        )}

        {item.image && (
          <button type="button" className="testimonial-card__view-photo" onClick={onViewPhoto}>
            {t('blocks.home.view_review_photo', 'View photo')}
          </button>
        )}
      </div>
    </figure>
  );
}

export interface TestimonialsCarouselProps {
  items: TestimonialItem[];
}

/**
 * Customer reviews as full-width slides (one at a time, centered) in the
 * shared {@link ScrollCarousel} — matches the old theme's one-up fading
 * testimonial slider, which has no heading of its own (just the slide, its
 * prev/next arrows and pagination dots below). Used by the
 * `custom-testimonials` home block ({@link CustomTestimonials}). Styling:
 * `04-components/home-blocks.scss` (`.s-testimonials` / `.testimonial-card`).
 */
export function TestimonialsCarousel({ items }: TestimonialsCarouselProps) {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!items.length) return null;

  const openItem = openIndex != null ? items[openIndex] : null;

  return (
    // `max-w-4xl mx-auto`: matches the reference demo's native reviews
    // container width exactly (`s-reviews-container > salla-slider.max-w-4xl`).
    <div className="s-testimonials container max-w-4xl mx-auto">
      <ScrollCarousel
        prevLabel={t('blocks.home.reviews_prev', 'Previous')}
        nextLabel={t('blocks.home.reviews_next', 'Next')}
      >
        {items.map((item, index) => (
          // A static settings list whose items have no id: see
          // .react-doctor/false-positives.md.
          // react-doctor-disable-next-line react-doctor/no-array-index-as-key
          <TestimonialCard
            key={`${index}-${item.name ?? ''}`}
            item={item}
            onViewPhoto={() => setOpenIndex(index)}
          />
        ))}
      </ScrollCarousel>

      <BottomSheet open={openItem != null} onClose={() => setOpenIndex(null)} title={openItem?.name}>
        {openItem?.image && (
          <img
            src={openItem.image}
            alt={openItem.name ?? ''}
            loading="lazy"
            decoding="async"
            className="testimonial-card__photo"
          />
        )}
      </BottomSheet>
    </div>
  );
}
