import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BannerSection } from '../../../app/components/home/BannerSection';

describe('BannerSection', () => {
  it('renders nothing with neither image set', () => {
    const { container } = render(<BannerSection data={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders both breakpoint sources when both images are set', () => {
    const { container } = render(
      <BannerSection data={{ image_desktop: 'desktop.jpg', image_mobile: 'mobile.jpg' }} />
    );
    const sources = container.querySelectorAll('source');
    expect(sources.length).toBe(2);
    expect(sources[0].getAttribute('media')).toBe('(max-width: 639px)');
    expect(sources[1].getAttribute('media')).toBe('(min-width: 640px)');
  });

  it('falls back to the desktop image as the <img> src when no mobile art is uploaded', () => {
    const { container } = render(<BannerSection data={{ image_desktop: 'desktop.jpg' }} />);
    expect(container.querySelectorAll('source').length).toBe(1);
    expect(container.querySelector('img')?.getAttribute('src')).toContain('desktop.jpg');
  });

  it('uses the desktop description as alt text, falling back to the mobile one', () => {
    const { container, rerender } = render(
      <BannerSection
        data={{
          image_desktop: 'd.jpg',
          image_desktop_description: 'Desktop alt',
          image_mobile_description: 'Mobile alt',
        }}
      />
    );
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Desktop alt');

    rerender(<BannerSection data={{ image_desktop: 'd.jpg', image_mobile_description: 'Mobile alt' }} />);
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Mobile alt');
  });

  it('loads eagerly, at high priority, only when the engine marks it the first block', () => {
    const { container, rerender } = render(
      <BannerSection data={{ image_desktop: 'd.jpg' }} />
    );
    const lazyImg = container.querySelector('img')!;
    expect(lazyImg.getAttribute('loading')).toBe('lazy');
    expect(lazyImg.getAttribute('fetchpriority')).toBeNull();

    rerender(<BannerSection data={{ image_desktop: 'd.jpg', priority: true }} />);
    const eagerImg = container.querySelector('img')!;
    expect(eagerImg.getAttribute('loading')).toBe('eager');
    expect(eagerImg.getAttribute('fetchpriority')).toBe('high');
  });

  it('carries 12:5 width/height attributes, matching the reference hero (no CLS, no breakpoint-specific crop)', () => {
    const { container } = render(<BannerSection data={{ image_desktop: 'd.jpg' }} />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('width')).toBe('1200');
    expect(img.getAttribute('height')).toBe('500');
  });

  it('adds top margin only when top_margin is set', () => {
    const { container, rerender } = render(
      <BannerSection data={{ image_desktop: 'd.jpg', top_margin: true }} />
    );
    expect(container.querySelector('.container')?.className).toContain('mt-4');

    rerender(<BannerSection data={{ image_desktop: 'd.jpg', top_margin: false }} />);
    expect(container.querySelector('.container')?.className).not.toContain('mt-4');
  });
});
