import { memo } from 'react';
import { TestimonialsCarousel, type TestimonialItem } from '../common';

export interface CustomTestimonialsProps {
  data: {
    items: TestimonialItem[];
    title?: string;
    description?: string;
    position?: number;
    [key: string]: unknown;
  };
}

/**
 * `custom-testimonials` home block — merchant-authored reviews in the shared
 * {@link TestimonialsCarousel} (gray band via `.s-block--custom-testimonials`,
 * one full-width slide at a time, matching the old theme's fading slider).
 * `title`/`description` are unused — the old theme never renders them here.
 */
export const CustomTestimonials = memo(function CustomTestimonials({
  data,
}: CustomTestimonialsProps) {
  const { items } = data;

  if (!items?.length) return null;

  return <TestimonialsCarousel items={items} />;
});
