import { memo } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { resolveLink } from '../../lib/resolveLink';
import { StarIcon } from '../icons';

export interface ReviewsSectionProps {
  data: {
    title?: string;
    description?: string;
    button_text?: string;
    link?: unknown;
    rating_count?: string;
    total_reviews?: string;
    position?: number;
    [key: string]: unknown;
  };
}

const STAR_POSITIONS = [1, 2, 3, 4, 5];

/**
 * `reviews-section` home block — a merchant-authored rating-summary banner
 * (free-text `rating_count`/`total_reviews`, e.g. "4.9" / "+3,000 happy
 * parents"), not a list of individual reviews; those stay on the engine's own
 * reviews data (`06-feature-mapping` #9). `rating_count` is documented as a
 * plain number ("4.9"), so it also drives the star row; a merchant value that
 * doesn't parse just skips the stars.
 */
export const ReviewsSection = memo(function ReviewsSection({ data }: ReviewsSectionProps) {
  const { title, description, button_text: buttonText, link: linkField, rating_count: rating, total_reviews: total } = data;
  const link = resolveLink(linkField);
  const ratingValue = rating ? Number.parseFloat(rating) : NaN;
  const hasStars = Number.isFinite(ratingValue);

  if (!title && !description && !rating && !total) return null;

  return (
    <div className="bg-brand-blue-light py-8 md:py-12">
      <div className="container max-w-4xl text-center">
        {title && (
          <h2 className="s-block__title mb-4 text-2xl font-black leading-tight text-primary md:text-4xl">
            {title}
          </h2>
        )}
        {description && (
          <p className="mb-8 text-lg leading-relaxed text-gray-500 md:text-xl">{description}</p>
        )}

        {link && buttonText && (
          <Link
            to={link}
            className="inline-block rounded-full bg-primary px-10 py-4 text-xl font-bold text-primary-reverse shadow-lg transition-transform hover:scale-105 hover:bg-primary-d"
          >
            {buttonText}
          </Link>
        )}

        {(hasStars || rating || total) && (
          <div className="mt-8 flex flex-row items-center justify-center gap-3">
            {hasStars && (
              <span className="inline-flex gap-1" role="img" aria-label={rating}>
                {STAR_POSITIONS.map((position) => (
                  <StarIcon
                    key={position}
                    className={`h-7 w-7 md:h-9 md:w-9 ${position <= Math.round(ratingValue) ? 'fill-accent text-accent' : 'text-gray-200'}`}
                    aria-hidden="true"
                  />
                ))}
              </span>
            )}
            <p className="text-xl font-bold text-gray-900 md:text-2xl">
              {rating}
              {rating && total && <span className="font-normal text-gray-500"> | </span>}
              {total}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
