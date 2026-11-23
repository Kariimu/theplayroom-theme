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
 * reviews data (`06-feature-mapping` #9). Styling ported pixel-for-pixel from
 * the live old-theme spec (`reviews-section.twig` / `styles.scss`): all 5
 * stars always render solid gold — the old template has no per-star
 * active/inactive state, it is not a function of `rating_count`.
 */
export const ReviewsSection = memo(function ReviewsSection({ data }: ReviewsSectionProps) {
  const { title, description, button_text: buttonText, link: linkField, rating_count: rating, total_reviews: total } = data;
  const link = resolveLink(linkField);

  if (!title && !description && !rating && !total) return null;

  return (
    <div className="px-5 py-[50px] text-center">
      <div className="container max-w-[900px]">
        {title && (
          <h2 className="mb-5 text-[40px] font-black leading-[1.25] text-[#f47e4d] max-md:text-[28px]">
            {title}
          </h2>
        )}
        {description && (
          <p className="mb-8 text-[22px] leading-[1.8] text-[#475569] max-md:text-[18px]">
            {description}
          </p>
        )}

        {link && buttonText && (
          <Link
            to={link}
            className="inline-block rounded-full bg-[#f47e4d] px-10 py-4 text-[22px] font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition hover:scale-105 hover:opacity-90 max-md:px-[30px] max-md:py-[14px] max-md:text-[18px]"
          >
            {buttonText}
          </Link>
        )}

        {(rating || total) && (
          <div className="mt-[35px] flex flex-wrap items-end justify-center gap-[15px]">
            {rating && (
              <span className="inline-flex gap-[5px]" role="img" aria-label={rating}>
                {STAR_POSITIONS.map((position) => (
                  <StarIcon
                    key={position}
                    className="h-[35px] w-[35px] fill-[#ffdf20] text-[#ffdf20] max-md:h-[28px] max-md:w-[28px]"
                    aria-hidden="true"
                  />
                ))}
              </span>
            )}
            <p className="text-2xl font-normal text-[#2d3e50] max-md:text-[22px]">
              {rating && <>{rating} / 5</>}
              {rating && total && <span className="font-normal text-[#64748b]"> | </span>}
              {total}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
