import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { HomeComponentData, ProductTag } from '@salla.sa/twilight-theme-engine/types';
import { ProductUsageGallery } from '../../../app/components/product/ProductUsageGallery';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

vi.mock('@salla.sa/twilight-theme-engine/utils/cdn-image', () => ({
  getCdnImageUrl: (url: string) => url,
  getCdnImageSrcSet: () => undefined,
}));

// The real carousel, without the rest of `common` (it pulls in engine home modules).
vi.mock('../../../app/components/common', async () => ({
  ScrollCarousel: (
    await vi.importActual<typeof import('../../../app/components/common/ScrollCarousel')>(
      '../../../app/components/common/ScrollCarousel'
    )
  ).ScrollCarousel,
}));

const tags = (...names: string[]) => names.map((name) => ({ name, url: '' })) as ProductTag[];

const components = (title?: string) =>
  [
    {
      path: 'product-usage-gallery',
      component: {
        title_section: title,
        items: [
          { key: 'swedish-ladder', image: 'https://cdn/1.webp', title: 'Climbing ladder', desc: 'Strength' },
          { key: 'swedish-ladder', image: 'https://cdn/2.webp', title: 'Reading swing' },
          { key: 'pikler', image: 'https://cdn/3.webp', title: 'Pikler' },
        ],
      },
    },
  ] as unknown as HomeComponentData[];

describe('ProductUsageGallery', () => {
  it("renders the product's cards: image, title, description", () => {
    const { container, getByRole } = render(
      <ProductUsageGallery components={components('In use')} tags={tags('inuse-swedish-ladder')} />
    );
    expect(getByRole('heading', { level: 2 }).textContent).toBe('In use');
    const cards = container.querySelectorAll('.product-usage-gallery__card');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('img')?.getAttribute('alt')).toBe('Climbing ladder');
    expect(cards[0].querySelector('.product-usage-gallery__desc')?.textContent).toBe('Strength');
    expect(cards[1].querySelector('.product-usage-gallery__desc')).toBeNull();
  });

  it('falls back to the locale heading', () => {
    const { getByRole } = render(
      <ProductUsageGallery components={components()} tags={tags('inuse-pikler')} />
    );
    expect(getByRole('heading', { level: 2 }).textContent).toBe('See it in action');
  });

  it('renders nothing without matching cards', () => {
    expect(
      render(<ProductUsageGallery components={components()} tags={tags('whatsapp')} />).container
        .firstChild
    ).toBeNull();
    expect(render(<ProductUsageGallery tags={tags('inuse-pikler')} />).container.firstChild).toBeNull();
  });
});
