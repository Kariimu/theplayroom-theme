import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { ScrollCarousel } from '../common';
import { CloseIcon } from '../icons';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { useScrollLock } from '../../hooks/useScrollLock';
import {
  SNIPPET_FETCH_COUNT,
  initial,
  toReviewSnippets,
  type ReviewSnippet,
} from '../../lib/reviewSnippets';

/** The SDK call `<salla-comments>` itself uses; not in the engine's `window.salla` type. */
type CommentsSdk = {
  onReady?: () => Promise<unknown>;
  api?: {
    comment?: {
      getComments?: (
        type: string,
        id: number | string,
        page: number,
        perPage: number,
        sort?: string
      ) => Promise<{ data?: unknown } | undefined>;
    };
  };
};

/** The product's good reviews, loaded in the browser once the SDK is ready. */
function useReviewSnippets(productId: number, hasReviews: boolean): ReviewSnippet[] {
  const [snippets, setSnippets] = useState<ReviewSnippet[]>([]);

  useEffect(() => {
    if (!hasReviews) {
      setSnippets([]);
      return;
    }
    let alive = true;
    const load = async () => {
      const sdk = window.salla as (typeof window.salla & CommentsSdk) | undefined;
      if (!sdk) return [];
      await sdk.onReady?.();
      // Called on its owner object, so an SDK method that uses `this` keeps it.
      const response = await sdk.api?.comment?.getComments?.(
        'product',
        productId,
        1,
        SNIPPET_FETCH_COUNT,
        'latest'
      );
      return toReviewSnippets(response?.data);
    };
    load()
      .then((result) => {
        if (alive) setSnippets(result);
      })
      .catch(() => {
        if (alive) setSnippets([]);
      });
    return () => {
      alive = false;
    };
  }, [productId, hasReviews]);

  return snippets;
}

function Stars({ count, size }: { count: number; size: number }) {
  return (
    <span className="review-snippet__stars" role="img" aria-label={`${count} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={n <= count ? 'is-filled' : undefined}
        >
          <path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95z" />
        </svg>
      ))}
    </span>
  );
}

/** The review's photo, or its writer's first letter on a store-colour tile. */
function SnippetThumb({ snippet, width }: { snippet: ReviewSnippet; width: number }) {
  return snippet.image ? (
    <img
      src={getCdnImageUrl(snippet.image, { width: width * 2 }) ?? snippet.image}
      width={width}
      height={width}
      alt=""
      loading="lazy"
      decoding="async"
      className="review-snippet__image"
    />
  ) : (
    <span className="review-snippet__image review-snippet__image--initial" aria-hidden="true">
      {initial(snippet.name)}
    </span>
  );
}

/** The whole review: its photo beside the name, verified tick, date, stars and text. */
function ReviewModal({ snippet, onClose }: { snippet: ReviewSnippet; onClose: () => void }) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  useScrollLock(true);
  useDialogFocus(dialogRef, true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="review-modal" role="presentation">
      <div className="review-modal__overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className={`review-modal__inner${snippet.image ? '' : ' review-modal__inner--text'}`}
        role="dialog"
        aria-modal="true"
        aria-label={snippet.name || t('pages.products.reviews_heading', 'Reviews')}
        tabIndex={-1}
      >
        <button
          type="button"
          className="review-modal__close"
          onClick={onClose}
          aria-label={t('blocks.header.close', 'Close')}
        >
          <CloseIcon aria-hidden="true" />
        </button>

        {snippet.image && (
          <div className="review-modal__media">
            <img
              src={getCdnImageUrl(snippet.image, { width: 800 }) ?? snippet.image}
              alt=""
              decoding="async"
            />
          </div>
        )}

        <div className="review-modal__body">
          <div className="review-modal__head">
            <strong className="review-modal__name">{snippet.name}</strong>
            {snippet.verified && (
              <span className="review-modal__verified">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m7.5 12.5 3 3 6-6.5" />
                </svg>
                {t('pages.products.verified_buyer', 'Verified buyer')}
              </span>
            )}
          </div>
          {snippet.date && <p className="review-modal__date">{snippet.date}</p>}
          <Stars count={snippet.stars} size={16} />
          <p className="review-modal__text">{snippet.text}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Quick reviews under the payment list: a tinted strip with one review per
 * slide (photo, name and stars, two-line quote), side arrows when there are
 * more, and the whole review in a popup on tap. Modelled on the reviews
 * "snippets" strip on akwan.me; data and rules in `app/lib/reviewSnippets.ts`.
 * Renders nothing until the product has a good review with text.
 * Styles: `04-components/review-snippets.scss`.
 */
export function ProductReviewSnippets({ product }: { product: Product }) {
  const { t } = useTranslation();
  const snippets = useReviewSnippets(Number(product.id), Number(product.rating?.count) > 0);
  const [opened, setOpened] = useState<ReviewSnippet | null>(null);
  const close = useCallback(() => setOpened(null), []);

  if (!snippets.length) return null;

  return (
    <section className="review-snippets" aria-label={t('pages.products.reviews_heading', 'Reviews')}>
      <ScrollCarousel
        arrows="sides"
        className="review-snippets__track"
        prevLabel={t('blocks.home.reviews_prev', 'Previous')}
        nextLabel={t('blocks.home.reviews_next', 'Next')}
      >
        {snippets.map((snippet) => (
          <button
            key={snippet.id}
            type="button"
            className="review-snippet"
            onClick={() => setOpened(snippet)}
          >
            <SnippetThumb snippet={snippet} width={60} />
            <span className="review-snippet__content">
              <span className="review-snippet__title">
                <strong className="review-snippet__name">{snippet.name}</strong>
                <Stars count={snippet.stars} size={13} />
              </span>
              <span className="review-snippet__text">"{snippet.text}"</span>
            </span>
          </button>
        ))}
      </ScrollCarousel>

      {opened && <ReviewModal snippet={opened} onClose={close} />}
    </section>
  );
}
