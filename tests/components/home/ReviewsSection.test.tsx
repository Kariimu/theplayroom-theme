import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ReviewsSection } from '../../../app/components/home/ReviewsSection';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe('ReviewsSection', () => {
  it('renders nothing with no content at all', () => {
    const { container } = render(<ReviewsSection data={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the rating, title, description and reviews caption', () => {
    const { container } = render(
      <ReviewsSection
        data={{
          rating_count: '4.9',
          title: 'Loved by parents',
          description: 'Real feedback from real families',
          total_reviews: '+3,000 happy customers',
        }}
      />
    );
    expect(container.textContent).toContain('4.9');
    expect(container.querySelector('h2')?.textContent).toBe('Loved by parents');
    expect(container.textContent).toContain('Real feedback from real families');
    expect(container.textContent).toContain('+3,000 happy customers');
  });

  it('renders 5 stars, filled up to the rounded rating, when rating_count is a number', () => {
    const { container } = render(<ReviewsSection data={{ rating_count: '4.4', title: 'x' }} />);
    const stars = container.querySelectorAll('svg');
    expect(stars).toHaveLength(5);
    expect(container.querySelectorAll('svg.fill-accent')).toHaveLength(4);
  });

  it('skips the stars when rating_count does not parse as a number', () => {
    const { container } = render(<ReviewsSection data={{ rating_count: 'ممتاز', title: 'x' }} />);
    expect(container.querySelectorAll('svg')).toHaveLength(0);
    expect(container.textContent).toContain('ممتاز');
  });

  it('renders the CTA only with both a link and button text', () => {
    const { container, rerender } = render(
      <ReviewsSection data={{ title: 'x', button_text: 'See reviews', link: '/reviews' }} />
    );
    expect(container.querySelector('a[href="/reviews"]')?.textContent).toBe('See reviews');

    rerender(<ReviewsSection data={{ title: 'x', button_text: 'See reviews', link: [] }} />);
    expect(container.querySelector('a')).toBeNull();
  });
});
