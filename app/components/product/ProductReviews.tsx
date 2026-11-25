import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { SallaComments } from '@salla.sa/twilight-components-react/comments';
import { SallaRatingModal } from '@salla.sa/twilight-components-react/rating-modal';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { StarIcon, ChevronDownIcon } from '../icons';
import { initial } from '../../lib/reviewSnippets';

interface ProductReviewsProps {
  product: Product;
}

/** Salla's rating popup: `setOrder` and `open` are its public methods. */
type RatingModalElement = HTMLElement & {
  componentOnReady?: () => Promise<unknown>;
  setOrder?: (orderId: number | string | null, productId?: number | string) => Promise<void>;
  open?: () => Promise<void>;
};

/** What `rating.api.productEligibility` answers (`data`). */
interface ReviewEligibility {
  eligible?: boolean;
  order_id?: number | null;
  code?: string;
  message?: string;
}

/** The SDK pieces this uses; not all are in the engine's `window.salla` type. */
type ReviewSdk = {
  onReady?: () => Promise<unknown>;
  config?: { isGuest?: () => boolean };
  event?: { dispatch?: (name: string, ...args: unknown[]) => void };
  notify?: { info?: (message: string) => void; error?: (message: string) => void };
  api?: { withoutNotifier?: <T>(fn: () => Promise<T>) => Promise<T> };
  rating?: { api?: { productEligibility?: (id: number | string) => Promise<{ data?: ReviewEligibility }> } };
};

const STAR_POSITIONS = [1, 2, 3, 4, 5];

// `<salla-comments>` renders its items into an unclassed `<div>` with no
// stable selector to reach from CSS alone. Each card's real parent is read
// off the DOM in `setUp()` below and marked with this class, which
// `reviews.scss` lays out as the card grid.
const GRID_CLASS = 'reviews-wrapper__grid';

/**
 * Product reviews as cards in the review snippets' look (the strip under the
 * payment list): a tinted rounded card, the reviewer's initial on a 60px
 * tile, name and stars on one line, date, and the full review text, in a
 * two-column grid on desktop (one column on mobile). The store has no review photos yet, so photos are not
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
  const ratingModalRef = useRef<RatingModalElement>(null);
  // While the eligibility check runs, so a double tap doesn't open two popups.
  const [checking, setChecking] = useState(false);
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

        // The card's photo tile shows the reviewer's first letter (the
        // engine's avatars are generic placeholders), as the review snippets
        // under the payment list do. Read by `reviews.scss` (`attr()`); an
        // attribute change doesn't retrigger this childList observer.
        const avatar = item.querySelector<HTMLElement>(
          ':scope > .s-comments-item-wrapper > .s-comments-item-inner > .s-comments-item-avatar'
        );
        const name = item.querySelector('.s-comments-item-inner h3')?.textContent ?? '';
        const letter = initial(name);
        if (avatar && avatar.dataset.initial !== letter) avatar.dataset.initial = letter;
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

  /**
   * "Write a review", the same flow as Salla's `<salla-verified-review>`:
   * a guest gets the login popup; a signed-in customer's eligibility for this
   * product is checked (a purchase, or the store's community reviews); if
   * eligible, Salla's rating popup opens for the product (with the order when
   * it was a purchase) and sends the stars and text to the store, where they
   * wait for approval. Salla's inline comment form was the old target: it
   * renders nothing unless `user.can_comment`, which the React engine never
   * sets, so the button opened nothing.
   */
  const writeReview = async () => {
    const sdk = window.salla as (typeof window.salla & ReviewSdk) | undefined;
    if (!sdk || checking) return;
    await sdk.onReady?.();
    if (sdk.config?.isGuest?.()) {
      sdk.event?.dispatch?.('login::open');
      return;
    }
    setChecking(true);
    try {
      const request = () =>
        sdk.rating?.api?.productEligibility?.(product.id) ?? Promise.resolve(undefined);
      const response = await (sdk.api?.withoutNotifier ? sdk.api.withoutNotifier(request) : request());
      const eligibility = response?.data;
      if (eligibility?.code === 'community_review_daily_limit') {
        sdk.notify?.error?.(
          eligibility.message || t('pages.products.review_limit', "You have reached today's review limit.")
        );
        return;
      }
      if (!eligibility?.eligible) {
        sdk.notify?.info?.(
          t('pages.products.review_not_eligible', 'You can review this product after you buy it.')
        );
        return;
      }
      const modal = ratingModalRef.current;
      await modal?.componentOnReady?.();
      await modal?.setOrder?.(eligibility.order_id ?? null, product.id);
      await modal?.open?.();
    } catch {
      sdk.notify?.error?.(t('common.errors.error_occurred', 'Something went wrong'));
    } finally {
      setChecking(false);
    }
  };

  // "5" or "4.3", never "5.0".
  const hasReviews = !!rating && rating.count > 0;
  const ratingDisplay = rating ? Number(rating.stars).toFixed(1).replace(/\.0$/, '') : '';
  const filledStars = rating ? Math.round(Number(rating.stars)) : 0;

  return (
    <div
      ref={rootRef}
      className="reviews-wrapper container"
    >
      <h2 className="reviews-wrapper__title">
        {t('pages.products.reviews_heading', 'Customer Reviews')}
      </h2>

      {/* No reviews yet: only the "Write a review" button, centred under the title. */}
      <div className={`reviews-wrapper__head${hasReviews ? '' : ' reviews-wrapper__head--empty'}`}>
        {hasReviews ? (
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
                    className={`reviews-wrapper__star h-5 w-5${position <= filledStars ? ' is-filled' : ''}`}
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
        ) : null}

        <button
          type="button"
          className="reviews-wrapper__write"
          aria-haspopup="dialog"
          aria-busy={checking}
          disabled={checking}
          onClick={writeReview}
        >
          {t('pages.products.add_review', 'Write a review')}
        </button>
      </div>

      {/* Salla's own rating popup (stars + comment), opened by `writeReview`. */}
      {/* The wrapper types its ref as its own element class; ours lists the methods used. */}
      <SallaRatingModal ref={ratingModalRef as never} />

      <SallaComments
        itemId={product.id}
        type={'product' as never}
        loadMoreText={t('pages.products.reviews_load_more', 'Load more')}
      />
    </div>
  );
}
