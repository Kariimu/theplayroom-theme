import { useRef, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { ChevronDownIcon, StarIcon } from '../icons';
import { BottomSheet } from './BottomSheet';

export interface TestimonialItem {
  avatar?: string;
  name?: string;
  text?: string;
  stars?: number;
  /** A customer-submitted photo; shown in the review's popup, not inline. */
  image?: string;
}

const MAX_STARS = 5;
const STAR_POSITIONS = Array.from({ length: MAX_STARS }, (_, position) => position + 1);
/** A horizontal swipe longer than this (px) moves to the next / previous review. */
const SWIPE_PX = 40;

const starCount = (item: TestimonialItem) =>
  Math.max(0, Math.min(MAX_STARS, Math.round(Number(item.stars ?? 0))));

function Stars({ count, label }: { count: number; label: string }) {
  return (
    <span className="testimonial-card__stars" role="img" aria-label={label}>
      {STAR_POSITIONS.map((position) => (
        <StarIcon
          key={position}
          className={position <= count ? 'is-on' : undefined}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/** The old theme's large quote mark (`custom-testimonials.twig`), 80 × 60. */
function QuoteMark() {
  return (
    <svg
      className="testimonial-card__quote"
      width="80"
      height="60"
      viewBox="0 0 80 60"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 60C12.6667 60 8.16667 58.1667 4.5 54.5C1.5 50.8333 0 46.3333 0 41C0 35 1.5 29.3333 4.5 24C7.5 18.6667 11.6667 13.8333 17 9.5C22.3333 5.16667 28.3333 1.83333 35 -0.5L38 6.5C30.6667 9.16667 24.6667 13.1667 20 18.5C15.3333 23.8333 13 29.6667 13 36C13 37.3333 13.1667 38.3333 13.5 39C16.1667 37.6667 19 37 22 37C26.6667 37 30.5 38.5 33.5 41.5C36.5 44.5 38 48.3333 38 53C38 57 36.5 60.3333 33.5 63C30.5 65.6667 26.6667 67 22 67C18.6667 67 18 64.6667 18 60ZM58 60C52.6667 60 48.1667 58.1667 44.5 54.5C41.5 50.8333 40 46.3333 40 41C40 35 41.5 29.3333 44.5 24C47.5 18.6667 51.6667 13.8333 57 9.5C62.3333 5.16667 68.3333 1.83333 75 -0.5L78 6.5C70.6667 9.16667 64.6667 13.1667 60 18.5C55.3333 23.8333 53 29.6667 53 36C53 37.3333 53.1667 38.3333 53.5 39C56.1667 37.6667 59 37 62 37C66.6667 37 70.5 38.5 73.5 41.5C76.5 44.5 78 48.3333 78 53C78 57 76.5 60.3333 73.5 63C70.5 65.6667 66.6667 67 62 67C58.6667 67 58 64.6667 58 60Z"
        fill="#8FA7C3"
      />
    </svg>
  );
}

/** The old theme's green check after the customer's name. */
function VerifiedCheck({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TestimonialCard({ item, onOpen }: { item: TestimonialItem; onOpen: () => void }) {
  const { t } = useTranslation();
  const name = item.name?.trim();
  const stars = starCount(item);

  return (
    <figure className="testimonial-card">
      {/* As the old theme, a click anywhere on the review opens it in full; the
          "view photos" button below is the keyboard way in when it has a photo. */}
      <div className="testimonial-card__inner" onClick={onOpen}>
        <QuoteMark />

        <blockquote className="testimonial-card__text">{item.text}</blockquote>

        {stars > 0 && (
          <Stars count={stars} label={`${stars} ${t('blocks.home.count_of', 'of')} ${MAX_STARS}`} />
        )}

        {name && (
          <figcaption className="testimonial-card__person">
            <b className="testimonial-card__name">{name}</b>
            <VerifiedCheck className="testimonial-card__verified" />
          </figcaption>
        )}

        {item.image && (
          <button
            type="button"
            className="testimonial-card__view-photo"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            {t('blocks.home.click_to_view_images', 'Click to view photos')}
          </button>
        )}
      </div>
    </figure>
  );
}

/** The review in full: avatar, name and stars, the text, its photo and a
 *  "verified buyer" line (the old theme's `testimonial-modal`). */
function TestimonialDetails({ item }: { item: TestimonialItem }) {
  const { t } = useTranslation();

  return (
    <div className="testimonial-details">
      <p className="testimonial-details__text">{item.text}</p>
      {item.image && (
        <div className="testimonial-details__photos">
          <h4 className="testimonial-details__photos-title">
            {t('blocks.home.review_photos', 'Review photos')}
          </h4>
          <img
            src={getCdnImageUrl(item.image, { width: 600 }) ?? item.image}
            alt={item.name || t('blocks.home.review_photo_alt', 'Customer photo')}
            loading="lazy"
            decoding="async"
            className="testimonial-card__photo"
          />
        </div>
      )}
      <p className="testimonial-details__verified">
        <VerifiedCheck className="h-5 w-5" />
        {t('blocks.home.verified_buyer', 'Verified buyer')}
      </p>
    </div>
  );
}

export interface TestimonialsCarouselProps {
  items: TestimonialItem[];
}

/**
 * Customer reviews, one at a time, as the old theme's `custom-testimonials`
 * (`salla-slider`, fade effect, no loop): the reviews cross-fade in place, with
 * an arrow on each side and dots below. Swipe on touch screens. All slides sit
 * in the same grid cell, so the block is as tall as its longest review and
 * never jumps between slides. Clicking a review opens it in full.
 * Used by the `custom-testimonials` home block ({@link CustomTestimonials}).
 * Styling: `04-components/home-blocks.scss` (`.s-testimonials`, `.testimonial-card`).
 */
export function TestimonialsCarousel({ items }: TestimonialsCarouselProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  if (!items.length) return null;

  const last = items.length - 1;
  const goTo = (index: number) => setActive(Math.max(0, Math.min(last, index)));
  const openItem = openIndex != null ? items[openIndex] : null;

  return (
    <div className="s-testimonials container">
      <div
        className="s-testimonials__stage"
        onTouchStart={(event) => {
          touchX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchX.current == null) return;
          const dx = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) < SWIPE_PX) return;
          // Swiping toward the reading direction's end shows the next review.
          const isRtl = document.documentElement.dir === 'rtl';
          const forward = isRtl ? dx > 0 : dx < 0;
          goTo(active + (forward ? 1 : -1));
        }}
      >
        <div className="s-testimonials__slides" aria-live="polite">
          {items.map((item, index) => (
            <div
              // A static settings list whose items have no id: see
              // .react-doctor/false-positives.md.
              // react-doctor-disable-next-line react-doctor/no-array-index-as-key
              key={`${index}-${item.name ?? ''}`}
              className={`s-testimonials__slide${index === active ? ' is-active' : ''}`}
              aria-hidden={index !== active}
              inert={index !== active}
            >
              <TestimonialCard item={item} onOpen={() => setOpenIndex(index)} />
            </div>
          ))}
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              className="s-testimonials__arrow s-testimonials__arrow--prev"
              aria-label={t('blocks.home.reviews_prev', 'Previous')}
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
            >
              <ChevronDownIcon aria-hidden="true" />
            </button>
            <button
              type="button"
              className="s-testimonials__arrow s-testimonials__arrow--next"
              aria-label={t('blocks.home.reviews_next', 'Next')}
              disabled={active === last}
              onClick={() => goTo(active + 1)}
            >
              <ChevronDownIcon aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div className="s-testimonials__dots">
          {items.map((item, index) => (
            <button
              // react-doctor-disable-next-line react-doctor/no-array-index-as-key
              key={`${index}-${item.name ?? ''}`}
              type="button"
              className={`s-testimonials__dot${index === active ? ' is-active' : ''}`}
              aria-label={`${index + 1} / ${items.length}`}
              aria-current={index === active}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}

      <BottomSheet
        open={openItem != null}
        onClose={() => setOpenIndex(null)}
        className="testimonial-sheet"
        title={openItem?.name || t('blocks.home.view_review_photo', 'View photo')}
        header={
          openItem ? (
            <div className="testimonial-sheet__person">
              <span className="testimonial-sheet__avatar">
                {openItem.avatar && (
                  <img
                    src={getCdnImageUrl(openItem.avatar, { width: 96 }) ?? openItem.avatar}
                    alt=""
                    width="48"
                    height="48"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </span>
              <span>
                <b className="testimonial-sheet__name">{openItem.name}</b>
                {starCount(openItem) > 0 && (
                  <Stars
                    count={starCount(openItem)}
                    label={`${starCount(openItem)} ${t('blocks.home.count_of', 'of')} ${MAX_STARS}`}
                  />
                )}
              </span>
            </div>
          ) : undefined
        }
      >
        {openItem && <TestimonialDetails item={openItem} />}
      </BottomSheet>
    </div>
  );
}
