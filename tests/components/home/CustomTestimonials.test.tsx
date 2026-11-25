import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CustomTestimonials } from '../../../app/components/home/CustomTestimonials';

// Only the module under test, not the whole barrel and everything it re-exports.
vi.mock('../../../app/components/common', async () => ({
  TestimonialsCarousel: (await vi.importActual<typeof import('../../../app/components/common/TestimonialsCarousel')>(
    '../../../app/components/common/TestimonialsCarousel'
  )).TestimonialsCarousel,
}));

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

vi.mock('@salla.sa/twilight-theme-engine/utils/cdn-image', () => ({
  getCdnImageUrl: (url?: string) => url,
}));

const items = [
  { avatar: 'a1.jpg', name: 'ندى الحسيني', text: 'رائحة رائعة', stars: 5, image: 'p1.jpg' },
  { avatar: 'a2.jpg', name: 'خالد الأحمد', text: 'أنصح به', stars: 4 },
  { avatar: 'a3.jpg', name: 'هند الزهراني', text: 'ممتاز', stars: 5 },
];

const activeText = (container: HTMLElement) =>
  container.querySelector('.s-testimonials__slide.is-active .testimonial-card__text')?.textContent;

describe('CustomTestimonials', () => {
  it('returns null when there are no items', () => {
    const { container } = render(<CustomTestimonials data={{ items: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows one review at a time, the others hidden in place, with no heading', () => {
    const { container, queryByRole } = render(<CustomTestimonials data={{ items }} />);
    expect(container.querySelectorAll('.s-testimonials__slide')).toHaveLength(3);
    expect(container.querySelectorAll('.s-testimonials__slide.is-active')).toHaveLength(1);
    expect(activeText(container)).toBe('رائحة رائعة');
    const hidden = container.querySelectorAll('.s-testimonials__slide:not(.is-active)');
    hidden.forEach((slide) => expect(slide.getAttribute('aria-hidden')).toBe('true'));
    expect(queryByRole('heading')).toBeNull();
  });

  it('moves with the arrows and stops at the ends, as the old slider (no loop)', () => {
    const { container, getByLabelText } = render(<CustomTestimonials data={{ items }} />);
    const prev = getByLabelText('Previous') as HTMLButtonElement;
    const next = getByLabelText('Next') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);

    fireEvent.click(next);
    expect(activeText(container)).toBe('أنصح به');
    fireEvent.click(next);
    expect(activeText(container)).toBe('ممتاز');
    expect(next.disabled).toBe(true);

    fireEvent.click(prev);
    expect(activeText(container)).toBe('أنصح به');
  });

  it('jumps to a review from its dot', () => {
    const { container } = render(<CustomTestimonials data={{ items }} />);
    const dots = container.querySelectorAll('.s-testimonials__dot');
    expect(dots).toHaveLength(3);
    fireEvent.click(dots[2]);
    expect(activeText(container)).toBe('ممتاز');
    expect(dots[2].getAttribute('aria-current')).toBe('true');
  });

  it('has no arrows or dots for a single review', () => {
    const { container } = render(<CustomTestimonials data={{ items: [items[1]] }} />);
    expect(container.querySelector('.s-testimonials__arrow')).toBeNull();
    expect(container.querySelector('.s-testimonials__dots')).toBeNull();
  });

  it('offers "click to view photos" only on a review with a photo, opening it in full', () => {
    const { container, getByText } = render(<CustomTestimonials data={{ items }} />);
    expect(container.querySelectorAll('.testimonial-card__view-photo')).toHaveLength(1);

    fireEvent.click(getByText('Click to view photos'));
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.querySelector('.testimonial-details__text')?.textContent).toBe('رائحة رائعة');
    expect(dialog?.querySelector('.testimonial-details img')?.getAttribute('src')).toBe('p1.jpg');
    expect(dialog?.textContent).toContain('Verified buyer');
  });

  it('opens a review without a photo from a click on the review itself', () => {
    const { container, getByLabelText } = render(<CustomTestimonials data={{ items }} />);
    fireEvent.click(getByLabelText('Next'));
    fireEvent.click(
      container.querySelector('.s-testimonials__slide.is-active .testimonial-card__inner')!
    );
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog?.querySelector('.testimonial-details__text')?.textContent).toBe('أنصح به');
    expect(dialog?.querySelector('.testimonial-details img')).toBeNull();
  });
});
