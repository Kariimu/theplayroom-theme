import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, fireEvent, screen } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { ProductReviews } from '../../../app/components/product/ProductReviews';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

// The engine web component, reduced to one review card in its real markup.
vi.mock('@salla.sa/twilight-components-react/comments', () => ({
  SallaComments: () => (
    <div className="s-comments-product">
      <div>
        <div className="s-comments-item">
          <div className="s-comments-item-wrapper">
            <div className="s-comments-item-inner s-comments-flex-1">
              <div className="s-comments-item-avatar">
                <img alt="" src="avatar.png" />
              </div>
              <div className="s-comments-flex-1">
                <div className="s-comments-item-user-wrapper">
                  <div className="s-comments-item-user-info">
                    <h3>noor</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}));

// Salla's rating popup: a stand-in exposing the two methods the button calls.
const setOrder = vi.fn(() => Promise.resolve());
const openModal = vi.fn(() => Promise.resolve());
vi.mock('@salla.sa/twilight-components-react/rating-modal', () => ({
  SallaRatingModal: forwardRef(function RatingModal(_props, ref) {
    useImperativeHandle(ref, () => ({ setOrder, open: openModal }));
    return null;
  }),
}));

let guest = false;
let eligibility: Record<string, unknown> | undefined;
const dispatch = vi.fn();
const info = vi.fn();
const error = vi.fn();

beforeEach(() => {
  guest = false;
  eligibility = { eligible: true, verified_purchase: false };
  [setOrder, openModal, dispatch, info, error].forEach((fn) => fn.mockClear());
  (window as unknown as { salla: unknown }).salla = {
    onReady: () => Promise.resolve(),
    config: { isGuest: () => guest },
    event: { dispatch },
    notify: { info, error },
    api: { withoutNotifier: <T,>(fn: () => Promise<T>) => fn() },
    rating: { api: { productEligibility: () => Promise.resolve({ data: eligibility }) } },
  };
});

afterEach(() => {
  delete (window as unknown as { salla?: unknown }).salla;
});

const write = () => fireEvent.click(screen.getByRole('button', { name: 'Write a review' }));

describe('ProductReviews — write a review', () => {
  it("opens Salla's rating popup for this product when the customer may review it", async () => {
    render(<ProductReviews product={{ id: 42, rating: { count: 0, stars: 0 } } as never} />);
    write();
    await waitFor(() => expect(openModal).toHaveBeenCalled());
    expect(setOrder).toHaveBeenCalledWith(null, 42);
  });

  it('passes the order when the review is for a purchase', async () => {
    eligibility = { eligible: true, verified_purchase: true, order_id: 9001 };
    render(<ProductReviews product={{ id: 42, rating: { count: 0, stars: 0 } } as never} />);
    write();
    await waitFor(() => expect(setOrder).toHaveBeenCalledWith(9001, 42));
  });

  it('asks a guest to log in', async () => {
    guest = true;
    render(<ProductReviews product={{ id: 42, rating: { count: 0, stars: 0 } } as never} />);
    write();
    await waitFor(() => expect(dispatch).toHaveBeenCalledWith('login::open'));
    expect(openModal).not.toHaveBeenCalled();
  });

  it('explains instead of doing nothing when the customer may not review it', async () => {
    eligibility = { eligible: false };
    render(<ProductReviews product={{ id: 42, rating: { count: 0, stars: 0 } } as never} />);
    write();
    await waitFor(() => expect(info).toHaveBeenCalledWith('You can review this product after you buy it.'));
    expect(openModal).not.toHaveBeenCalled();
  });

  it("shows Salla's message at the daily review limit", async () => {
    eligibility = { eligible: false, code: 'community_review_daily_limit', message: 'Limit reached' };
    render(<ProductReviews product={{ id: 42, rating: { count: 0, stars: 0 } } as never} />);
    write();
    await waitFor(() => expect(error).toHaveBeenCalledWith('Limit reached'));
    expect(openModal).not.toHaveBeenCalled();
  });
});

describe('ProductReviews', () => {
  it("puts the reviewer's initial on each card's photo tile and marks the card grid", async () => {
    const { container } = render(
      <ProductReviews product={{ id: 1, rating: { count: 0, stars: 0 } } as never} />
    );
    const avatar = container.querySelector<HTMLElement>('.s-comments-item-avatar');
    await waitFor(() => expect(avatar?.dataset.initial).toBe('N'));
    expect(container.querySelector('.s-comments-item')?.parentElement?.classList).toContain(
      'reviews-wrapper__grid'
    );
  });

  it('with no reviews, shows only the "Write a review" button, centred under the title', () => {
    const { container, getByRole } = render(
      <ProductReviews product={{ id: 1, rating: { count: 0, stars: 0 } } as never} />
    );
    const head = container.querySelector('.reviews-wrapper__head');
    expect(head?.classList).toContain('reviews-wrapper__head--empty');
    expect(head?.querySelector('.reviews-wrapper__badge')).toBeNull();
    expect(getByRole('button', { name: 'Write a review' })).toBeTruthy();
  });

  it('with reviews, keeps the rating badge beside the button', () => {
    const { container } = render(
      <ProductReviews product={{ id: 1, rating: { count: 3, stars: 4.7 } } as never} />
    );
    const head = container.querySelector('.reviews-wrapper__head');
    expect(head?.classList).not.toContain('reviews-wrapper__head--empty');
    expect(head?.querySelector('.reviews-wrapper__badge')).toBeTruthy();
  });
});
