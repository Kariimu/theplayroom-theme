import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ProductReviewSnippets } from '../../../app/components/product/ProductReviewSnippets';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

vi.mock('../../../app/components/common', () => ({
  ScrollCarousel: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

const getComments = vi.fn();

beforeEach(() => {
  getComments.mockReset();
  getComments.mockResolvedValue({
    data: [
      {
        id: 1,
        name: 'Maryam S.',
        rating: 5,
        content: '<p>Lovely blocks</p>',
        images: ['https://cdn.files.salla.network/r.webp'],
        has_order: true,
        created_at: { date: '2026-07-26 10:00:00' },
      },
      { id: 2, name: 'Fay A.', rating: 2, content: 'Meh' },
      { id: 3, name: 'noor', rating: 4, content: 'Great quality', images: [], has_order: false },
    ],
  });
  (window as unknown as { salla: unknown }).salla = {
    onReady: () => Promise.resolve(),
    api: { comment: { getComments } },
  };
});

afterEach(() => {
  delete (window as unknown as { salla?: unknown }).salla;
});

const product = (count: number) => ({ id: 77, rating: { count, stars: 4.5 } }) as never;

describe('ProductReviewSnippets', () => {
  it('shows a slide per good review, from the product reviews', async () => {
    const { container } = render(<ProductReviewSnippets product={product(3)} />);
    await waitFor(() => expect(container.querySelectorAll('.review-snippet')).toHaveLength(2));
    expect(getComments).toHaveBeenCalledWith('product', 77, 1, 20, 'latest');
    expect(screen.getByText('Maryam S.')).toBeTruthy();
    expect(screen.getByText('"Lovely blocks"')).toBeTruthy();
    // No photo: the writer's initial instead.
    expect(container.querySelector('.review-snippet__image--initial')?.textContent).toBe('N');
  });

  it('opens the whole review on tap and closes on Escape', async () => {
    render(<ProductReviewSnippets product={product(3)} />);
    fireEvent.click(await screen.findByText('Maryam S.'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Verified buyer');
    expect(dialog.textContent).toContain('26/7/2026');
    expect(dialog.textContent).toContain('Lovely blocks');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('does not ask for reviews when the product has none', async () => {
    const { container } = render(<ProductReviewSnippets product={product(0)} />);
    await Promise.resolve();
    expect(getComments).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });
});
