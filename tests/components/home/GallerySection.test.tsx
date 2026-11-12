import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { GallerySection } from '../../../app/components/home/GallerySection';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe('GallerySection', () => {
  it('renders nothing with no images', () => {
    const { container } = render(<GallerySection data={{ gallery: [{ alt_text: 'no image' }] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the header title and description', () => {
    const { container } = render(
      <GallerySection
        data={{ title_section: 'In the wild', desc_section: 'Real homes', gallery: [{ image: 'a.jpg' }] }}
      />
    );
    expect(container.querySelector('h2')?.textContent).toBe('In the wild');
    expect(container.textContent).toContain('Real homes');
  });

  it('renders one tile per gallery image with its alt text', () => {
    const { container } = render(
      <GallerySection
        data={{
          gallery: [
            { image: 'a.jpg', alt_text: 'Living room set' },
            { image: 'b.jpg', image_mobile: 'b-mobile.jpg', alt_text: 'Kitchen set' },
          ],
        }}
      />
    );
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(2);
    expect(images[0].getAttribute('alt')).toBe('Living room set');
    // Each item renders both sources (mobile falls back to the desktop image when unset).
    expect(container.querySelectorAll('source').length).toBe(4);
  });

  it('renders the view-all button only with both a link and button text', () => {
    const { container, rerender } = render(
      <GallerySection
        data={{ gallery: [{ image: 'a.jpg' }], btn_text: 'See all', button_url: '/gallery' }}
      />
    );
    expect(container.querySelector('a[href="/gallery"]')?.textContent).toBe('See all');

    rerender(
      <GallerySection data={{ gallery: [{ image: 'a.jpg' }], btn_text: 'See all', button_url: [] }} />
    );
    expect(container.querySelector('a')).toBeNull();
  });
});
