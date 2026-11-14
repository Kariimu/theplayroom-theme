import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SuggestedGames } from '../../../app/components/product/SuggestedGames';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  RenderWhenVisible: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const sliderProps = vi.fn();
vi.mock('../../../app/components/home', () => ({
  ProductsSlider: (props: unknown) => {
    sliderProps(props);
    return <div data-testid="products-slider" />;
  },
}));

describe('SuggestedGames', () => {
  it('renders nothing without a set: tag', () => {
    const { container } = render(
      <SuggestedGames productId={1} tags={[{ name: 'whatsapp', url: '' }]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("lists products by the set: tag's numeric id, parsed from its url, excluding the current product", () => {
    render(
      <SuggestedGames
        productId={42}
        tags={[{ name: 'set:adventure', url: 'https://x.test/tag-1143764859' }]}
      />
    );
    expect(sliderProps).toHaveBeenCalledWith(
      expect.objectContaining({
        excludeId: 42,
        data: expect.objectContaining({
          products: { source: 'tags', source_value: 1143764859 },
        }),
      })
    );
  });

  it('prefers a populated tag.id over parsing the url', () => {
    render(
      <SuggestedGames
        productId={1}
        tags={[{ id: 55, name: 'set:adventure', url: 'https://x.test/tag-999' }]}
      />
    );
    expect(sliderProps).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ products: { source: 'tags', source_value: 55 } }),
      })
    );
  });

  it('renders nothing when the set: tag has no usable id', () => {
    const { container } = render(
      <SuggestedGames productId={1} tags={[{ name: 'set:adventure', url: '' }]} />
    );
    expect(container.firstChild).toBeNull();
  });
});
