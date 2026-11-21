import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { SallaComments } from '@salla.sa/twilight-components-react/comments';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { StarIcon, ChevronDownIcon } from '../icons';

interface ProductReviewsProps {
  product: Product;
}

const STAR_POSITIONS = [1, 2, 3, 4, 5];

// `<salla-comments>` renders its items into an unclassed `<div>` with no
// stable selector to reach from CSS alone. Each card's real parent is read
// off the DOM in `setUp()` below and marked with this class, which
// `reviews.scss` lays out as the card grid.
const GRID_CLASS = 'reviews-wrapper__grid';

/**
 * Product reviews as text-first cards: name, verified-purchase tick, date,
 * stars, and the full review text, in a two-column grid on desktop (one
 * column on mobile). The store has no review photos yet, so photos are not
 * the main element of a card. Any photos a review does have show as small
 * thumbnails under its text (the engine's own `<salla-attachments>`, which
 * has its own lightbox).
 *
 * Wraps the engine `<salla-comments>` web component (light DOM, `.s-*`
 * classes, all restyled in `04-components/reviews.scss`) with the theme's
 * own heading and toolbar. The toolbar has the average/count badge, whose
 * hover/focus dropdown is the engine's own `<salla-reviews-summary>`, and a
 * "Write a review" button that reveals the engine's comment form inline (the
 * documented `comment.add` SDK call takes no rating, so the engine form is
 * the only supported way to submit stars). That form renders empty unless the
 * customer is allowed to review this product, which is a Salla rule.
 *
 * `setUp()` runs on every mutation because the component renders
 * client-side and adds items asynchronously ("load more" appends pages). It
 * reparents `<salla-reviews-summary>` into the badge's `.group` wrapper so
 * the dropdown can be plain CSS `group-hover`/`group-focus-within`, and marks
 * the grid container.
 */
export function ProductReviews({ product }: ProductReviewsProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const summaryGroupRef = useRef<HTMLDivElement>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  // Tap/click toggle for the summary dropdown. Hover and focus-within open it
  // on desktop, but iOS Safari does not focus a tapped <button>, so on touch
  // screens the dropdown needs this explicit state.
  const [summaryOpen, setSummaryOpen] = useState(false);

  const rating = product.rating;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const setUp = () => {
      // Filtered by parent, not the first match: if the engine re-renders a
      // fresh summary elsewhere (e.g. after `comment::list`), the stale one
      // already in our group would otherwise come first in document order.
      const freshSummary = Array.from(root.querySelectorAll('salla-reviews-summary')).find(
        (el) => el.parentElement !== summaryGroupRef.current
      );
      if (freshSummary && summaryGroupRef.current) {
        summaryGroupRef.current.querySelector('salla-reviews-summary')?.remove();
        summaryGroupRef.current.appendChild(freshSummary);
      }

      // Marked per item (idempotent) so a page appended into a different
      // wrapper still gets styled. Nested replies sit inside a card and are
      // skipped, so a card's own inner `<div>` never becomes a grid.
      root.querySelectorAll<HTMLElement>('.s-comments-item').forEach((item) => {
        const parent = item.parentElement;
        if (parent && !parent.closest('.s-comments-item')) parent.classList.add(GRID_CLASS);
      });
    };

    const observer = new MutationObserver(setUp);
    observer.observe(root, { childList: true, subtree: true });
    setUp();

    return () => observer.disconnect();
  }, [product.id]);

  // close the summary on a tap/click outside it, or on Escape
  useEffect(() => {
    if (!summaryOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!summaryGroupRef.current?.contains(event.target as Node)) setSummaryOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSummaryOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [summaryOpen]);

  // "5" or "4.3", never "5.0".
  const ratingDisplay = rating ? Number(rating.stars).toFixed(1).replace(/\.0$/, '') : '';
  const filledStars = rating ? Math.round(Number(rating.stars)) : 0;

  return (
    <div
      ref={rootRef}
      className={`reviews-wrapper container${writeOpen ? ' reviews-is-writing' : ''}`}
    >
      <h2 className="reviews-wrapper__title">
        {t('pages.products.reviews_heading', 'Customer Reviews')}
      </h2>

      <div className="reviews-wrapper__head">
        {rating && rating.count > 0 ? (
          // From `md`, `relative` makes this the containing block for the
          // summary panel `setUp()` moves in here; below `md` the panel anchors
          // to the full-width toolbar instead. `group` is the hover/focus
          // target; `is-open` is the tap/click state.
          <div
            className={`group md:relative${summaryOpen ? ' is-open' : ''}`}
            ref={summaryGroupRef}
          >
            <button
              type="button"
              className="reviews-wrapper__badge"
              aria-expanded={summaryOpen}
              onClick={() => setSummaryOpen((open) => !open)}
              aria-label={t('pages.products.rating_summary', ':stars out of 5, :count reviews')
                .replace(':stars', ratingDisplay)
                .replace(':count', String(rating.count))}
            >
              <span className="inline-flex gap-0.5" aria-hidden="true">
                {STAR_POSITIONS.map((position) => (
                  <StarIcon
                    key={position}
                    className={`h-5 w-5 ${position <= filledStars ? 'fill-accent text-accent' : 'fill-gray-200 text-gray-200'}`}
                  />
                ))}
              </span>
              <span className="font-bold" aria-hidden="true">
                {ratingDisplay}
              </span>
              <span className="text-gray-500" aria-hidden="true">
                {t('pages.products.reviews_count', ':count reviews').replace(
                  ':count',
                  String(rating.count)
                )}
              </span>
              <ChevronDownIcon
                className="h-4 w-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180"
                aria-hidden="true"
              />
            </button>
          </div>
        ) : (
          // keeps the write button at the inline end when there is no badge
          <span />
        )}

        <button
          type="button"
          className="reviews-wrapper__write"
          aria-expanded={writeOpen}
          onClick={() => setWriteOpen((open) => !open)}
        >
          {t('pages.products.add_review', 'Write a review')}
        </button>
      </div>

      <SallaComments
        itemId={product.id}
        type={'product' as never}
        loadMoreText={t('pages.products.reviews_load_more', 'Load more')}
      />
    </div>
  );
}
