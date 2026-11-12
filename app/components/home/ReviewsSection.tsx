import { memo } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { resolveLink } from '../../lib/resolveLink';

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

/**
 * `reviews-section` home block — a merchant-authored rating-summary banner
 * (free-text `rating_count`/`total_reviews`, e.g. "4.9" / "+3,000 happy
 * parents"), not a list of individual reviews; those stay on the engine's own
 * reviews data (`06-feature-mapping` #9).
 */
export const ReviewsSection = memo(function ReviewsSection({ data }: ReviewsSectionProps) {
  const { title, description, button_text: buttonText, link: linkField, rating_count: rating, total_reviews: total } = data;
  const link = resolveLink(linkField);

  if (!title && !description && !rating && !total) return null;

  return (
    <div className="container text-center">
      {rating && <p className="reviews-section__rating text-4xl font-bold">{rating}</p>}
      {title && <h2 className="s-block__title text-lg font-semibold">{title}</h2>}
      {description && <p className="text-sm opacity-70 max-w-xl mx-auto">{description}</p>}
      {total && <p className="text-sm font-medium mt-1">{total}</p>}
      {link && buttonText && (
        <Link to={link} className="btn btn--outline mt-4 inline-block">
          {buttonText}
        </Link>
      )}
    </div>
  );
});
