import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { ProductTag } from '@salla.sa/twilight-theme-engine/types';
import { ProductFeatures } from '../../../app/components/product/ProductFeatures';
import type { ProductFeature } from '../../../app/lib/productFeatures';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

vi.mock('@salla.sa/twilight-theme-engine/utils/cdn-image', () => ({
  getCdnImageUrl: (url: string) => url,
}));

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const tags = (...names: string[]) => names.map((name) => ({ name, url: '' })) as ProductTag[];

const LIBRARY: ProductFeature[] = [
  { key: 'montessori', title: 'Montessori', image: 'https://cdn/m.png', url: 'https://s/blog/m' },
  { key: 'handmade', title: 'Handmade' },
];

describe('ProductFeatures', () => {
  it('renders the product features in tag order, linked to their articles', () => {
    const { container, getAllByRole } = render(
      <ProductFeatures tags={tags('feature-handmade', 'whatsapp', 'feature-montessori')} library={LIBRARY} />
    );
    const titles = [...container.querySelectorAll('.product-features__title')].map((el) => el.textContent);
    expect(titles).toEqual(['Handmade', 'Montessori']);
    const links = getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('https://s/blog/m');
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn/m.png');
  });

  it('renders nothing without matching features', () => {
    expect(render(<ProductFeatures tags={tags('whatsapp')} library={LIBRARY} />).container.firstChild).toBeNull();
    expect(render(<ProductFeatures tags={tags('feature-montessori')} />).container.firstChild).toBeNull();
    expect(render(<ProductFeatures tags={tags('feature-unknown')} library={LIBRARY} />).container.firstChild).toBeNull();
  });
});
