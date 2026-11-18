import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { SallaComments } from '@salla.sa/twilight-components-react/comments';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { BottomSheet } from '../common';
import { StarIcon, ChevronDownIcon } from '../icons';

interface ProductReviewsProps {
  product: Product;
}

interface SelectedReview {
  avatarSrc: string | null;
  avatarAlt: string;
  name: string;
  timestamp: string;
  rating: number;
  text: string;
  images: string[];
}

const STAR_POSITIONS = [1, 2, 3, 4, 5];

// The engine renders `.s-comments-item` (actually the `<salla-comment-item>`
// custom element itself) into an unclassed parent with no stable selector to
// target from CSS alone — guessing at that parent's position (sibling of the
// header, `:has(> …)`) repeatedly matched the wrong element live and left
// every card stacking full-width, one per row. Marking the *real* parent,
// read directly off the DOM in `setUp()` below, is unambiguous by
// construction: whatever element the first card's `parentElement` is, is the
// grid to style.
const GRID_CLASS = 'reviews-wrapper__grid';

const INTERACTIVE_SELECTOR =
  'button, a, salla-rating-stars, .s-comments-item-like-btn, .s-comments-item-review-factors-toggle';

/**
 * Wraps the engine `<salla-comments>` web component (light DOM, `.s-*`
 * classes — see `04-components/reviews.scss`) with the theme's own compact
 * header and a tap-to-expand review modal, the same light-DOM-class-toggle
 * pattern `ProductMetadata` uses: a ref'd root, a `MutationObserver` for the
 * component's async-rendered items, and delegated click/keydown handlers —
 * there's no React ref/state reaching those nodes otherwise. `setUp()` also
 * reparents the engine's own async-mounted `<salla-reviews-summary>` into
 * the badge's wrapper div, so the hover-to-show/hide dropdown can be plain
 * CSS (`group-hover`) instead of JS-computed positioning — it isn't
 * rendered there by the engine to begin with.
 *
 * Reads review content (`textContent`, never `innerHTML`) from the exact
 * `.s-*` selectors `reviews.scss` already depends on, so this adds no new
 * fragility beyond what the stylesheet already assumes.
 *
 * Styled to match the live site's reviews section
 * (`pages/product/single.twig` §7), confirmed against real DOM dumps from
 * both sites, with one deliberate deviation: live opens a centered modal for
 * "Add Review" (`#product-rating-modal`, with its own
 * `salla.form.onSubmit('comment.add', …)` wiring); this reveals the engine's
 * own comment form inline instead, to avoid duplicating that submission
 * path — the documented `comment.add` SDK call takes no rating parameter,
 * so there's no supported way to submit the stars outside the engine's own
 * form. That form also renders empty unless the current customer is allowed
 * to comment on this product (per the store's rating settings), which is a
 * Salla eligibility rule, not a theme bug.
 */
export function ProductReviews({ product }: ProductReviewsProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  // The engine renders `<salla-reviews-summary>` on its own, elsewhere in
  // `<SallaComments>`'s tree — not nested inside the badge below, so plain
  // CSS `:hover` can't reach it. `setUp()` below physically moves it into
  // this wrapper once it mounts, so the hover-to-show/hide behaviour (and
  // its `absolute top-full` position) can be pure CSS, exactly like live.
  const summaryGroupRef = useRef<HTMLDivElement>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedReview | null>(null);

  const rating = product.rating;

  // Mark each review card as a focusable, keyboard-activatable button, and
  // open the full review (avatar / name / stars / date / text / photos) in a
  // `BottomSheet` on click or Enter/Space. The component re-renders its grid
  // as comments load, so a `MutationObserver` re-applies this.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // The live site's card "photo" is the review's own attached photo, or the
    // product image when the review has none — never the reviewer's avatar.
    // `.s-comments-item-images` (where the engine renders attached photos)
    // stays hidden via CSS; this promotes the first one into the avatar slot.
    const setUp = () => {
      // Client-only component (renders nothing server-side, per Salla's
      // docs) — it may not exist yet on the first pass, hence re-checked on
      // every mutation rather than once, not just once. Found by filtering
      // on parent rather than taking the first match: if the engine ever
      // re-renders a fresh copy elsewhere (e.g. after `comment::list`), the
      // stale one already sitting in our group would otherwise come first
      // in document order and mask the new one from a plain `querySelector`.
      const freshSummary = Array.from(root.querySelectorAll('salla-reviews-summary')).find(
        (el) => el.parentElement !== summaryGroupRef.current
      );
      if (freshSummary && summaryGroupRef.current) {
        summaryGroupRef.current.querySelector('salla-reviews-summary')?.remove();
        summaryGroupRef.current.appendChild(freshSummary);
      }

      const items = root.querySelectorAll<HTMLElement>('.s-comments-item');

      items.forEach((item) => {
        // The real grid container, whatever element it is — see
        // `GRID_CLASS`. Marked per item (idempotent `classList.add`), not
        // just off `items[0]`, so a later page appended into a different
        // wrapper (e.g. "load more") still gets styled.
        item.parentElement?.classList.add(GRID_CLASS);

        if (!item.hasAttribute('role')) {
          item.setAttribute('role', 'button');
          item.setAttribute('tabindex', '0');
        }

        // Re-checked (not guarded by the `role` attribute above) on every
        // mutation: the engine can fill a review's attached-photo markup in
        // after the card itself first appears, so a one-shot check would miss
        // a photo that loads late and leave the product-image fallback stuck.
        const avatarImg = item.querySelector<HTMLImageElement>('.s-comments-item-avatar-img');
        if (!avatarImg) return;
        const reviewImg = item.querySelector<HTMLImageElement>('.s-comments-item-images img');
        // Attached photos live inside `.s-comments-item-content`, now hidden
        // (card face shows name/stars/date only) — a lazy-loader that only
        // fires on intersection never loads a `display: none` image, so its
        // real photo sits in `data-src` until something else reads it. Read
        // that first, falling back to `src` for a loader that resolved it.
        const desiredSrc = reviewImg?.dataset.src || reviewImg?.src || product.image?.url;
        if (desiredSrc && avatarImg.src !== desiredSrc) {
          avatarImg.src = desiredSrc;
          avatarImg.alt = reviewImg ? reviewImg.alt || avatarImg.alt : product.image?.alt || product.name;
        }
      });
    };

    const observer = new MutationObserver(setUp);
    observer.observe(root, { childList: true, subtree: true });
    setUp();

    const itemFromEvent = (event: Event): HTMLElement | null => {
      const target = event.target as HTMLElement;
      if (target.closest(INTERACTIVE_SELECTOR)) return null;
      const item = target.closest<HTMLElement>('.s-comments-item');
      return item && root.contains(item) ? item : null;
    };

    const openReview = (item: HTMLElement) => {
      const avatarImg = item.querySelector<HTMLImageElement>('.s-comments-item-avatar-img');
      const name =
        item
          .querySelector('.s-comments-item-user-info-name-with-margin, .s-comments-item-user-info-name')
          ?.textContent?.trim() ?? '';
      const timestamp = item.querySelector('.s-comments-item-timestamp')?.textContent?.trim() ?? '';
      const ratingValueAttr = item.querySelector('salla-rating-stars')?.getAttribute('value');
      const ratingValue = ratingValueAttr
        ? Number.parseFloat(ratingValueAttr)
        : item.querySelectorAll('.s-rating-stars-selected').length;
      const text = item.querySelector('.s-comments-item-content-container')?.textContent?.trim() ?? '';
      // Same lazy-loader caveat as the avatar swap above: these live inside
      // a permanently `display: none` ancestor now, so an intersection-based
      // loader never fires and `src` can stay a placeholder forever.
      const images = Array.from(
        item.querySelectorAll<HTMLImageElement>('.s-comments-item-images img')
      ).map((img) => img.dataset.src || img.src);

      setSelected({
        avatarSrc: avatarImg?.src ?? null,
        avatarAlt: avatarImg?.alt ?? name,
        name,
        timestamp,
        rating: Number.isFinite(ratingValue) ? ratingValue : 0,
        text,
        images,
      });
    };

    const onClick = (event: MouseEvent) => {
      const item = itemFromEvent(event);
      if (item) openReview(item);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const item = itemFromEvent(event);
      if (!item) return;
      event.preventDefault();
      openReview(item);
    };

    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeyDown);

    return () => {
      observer.disconnect();
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeyDown);
    };
  }, [product]);

  // Matches live exactly, e.g. "5" or "4.3" — never "5.0" — the engine's own
  // `.s-reviews-summary-average` text confirmed this formatting.
  const ratingDisplay = rating ? Number(rating.stars).toFixed(1).replace(/\.0$/, '') : '';

  return (
    <div ref={rootRef} className={`reviews-wrapper container${writeOpen ? ' reviews-is-writing' : ''}`}>
      <h2 className="sr-only">{t('pages.products.reviews_heading', 'Customer Reviews')}</h2>

      <div className="reviews-wrapper__head">
        {/* Exact class list from the live "Add Review" button, with two
            substitutions this theme's tokens force: `hover:bg-primary/90` →
            `hover:opacity-90` (`--color-primary` is a raw custom property,
            not a Tailwind color Tailwind can apply an opacity modifier to —
            the slash variant silently fails and the button goes invisible)
            and `text-primary-foreground` → `text-white` (no such token
            here; `text-white` is this theme's established equivalent, see
            01-settings/global.scss). Everything else — including the
            inert disabled/aria-invalid/svg selectors this plain button
            never triggers — is copied verbatim for exact parity. */}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 has-[>svg]:px-3 bg-primary hover:opacity-90 text-white px-6 py-3 text-lg font-bold rounded-none"
          onClick={() => setWriteOpen((open) => !open)}
        >
          {t('pages.products.add_review', 'Add Review')}
        </button>

        {rating && (
          // `relative` makes this the containing block for the summary panel
          // `setUp()` moves inside it, and the `group` pure-CSS hover target
          // (`group-hover`/`group-focus-within` in reviews.scss) — no JS
          // open/close state needed, exactly like live's `group-hover`.
          <div className="group relative" ref={summaryGroupRef}>
            <button
              type="button"
              className="reviews-wrapper__badge"
              aria-label={t('pages.products.view_reviews', 'View Reviews')}
              title={t('pages.products.view_reviews', 'View Reviews')}
            >
              {/* Live always renders 5 filled stars here regardless of the
                  actual average — matched for parity (per-review stars in
                  the grid below still reflect each review's own rating). */}
              <span className="inline-flex gap-0.5" aria-hidden="true">
                {STAR_POSITIONS.map((position) => (
                  <StarIcon key={position} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </span>
              <span className="font-bold">{ratingDisplay}</span>
              <span className="text-gray-500">({rating.count})</span>
              <ChevronDownIcon className="h-4 w-4 rotate-180 transition-transform group-hover:rotate-0 group-focus-within:rotate-0" />
            </button>
          </div>
        )}
      </div>

      <SallaComments itemId={product.id} type={'product' as never} />

      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="flex flex-col gap-4">
            {selected.avatarSrc && (
              <img
                src={selected.avatarSrc}
                alt={selected.avatarAlt}
                className="aspect-square w-full rounded-lg object-cover"
              />
            )}
            <div className="flex items-center gap-2">
              <span className="inline-flex gap-0.5" aria-hidden="true">
                {STAR_POSITIONS.map((position) => (
                  <StarIcon
                    key={position}
                    className={`h-4 w-4 ${position <= Math.round(selected.rating) ? 'fill-[#fbbf24] text-[#fbbf24]' : 'text-gray-200'}`}
                  />
                ))}
              </span>
              {selected.timestamp && <span className="text-xs text-gray-500">{selected.timestamp}</span>}
            </div>
            {selected.text && <p className="text-lg leading-relaxed text-gray-700">{selected.text}</p>}
            {selected.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.images.map((src) => (
                  <img key={src} src={src} alt="" className="h-20 w-20 rounded object-cover" />
                ))}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
