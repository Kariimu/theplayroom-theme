import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartUpsellSlider } from '../../../app/components/cart/CartUpsellSlider';

const listMock = vi.fn();

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({
  product: {
    queries: {
      list: (params: { source: string; perPage?: number }) => ({
        queryKey: ['products', 'list', params],
        queryFn: () => listMock(params),
      }),
    },
  },
}));

vi.mock('@salla.sa/twilight-components-react', () => ({
  ProductsListSkeleton: () => <div data-testid="list-skeleton" />,
}));

vi.mock('../../../app/components/common', async () => ({
  ScrollCarousel: (
    await vi.importActual<typeof import('../../../app/components/common/ScrollCarousel')>(
      '../../../app/components/common/ScrollCarousel'
    )
  ).ScrollCarousel,
}));

vi.mock('../../../app/components/product', () => ({
  ProductCard: ({ product }: { product: { id?: number; name?: string } }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  listMock.mockReset();
  Element.prototype.scrollBy = vi.fn();
});

describe('CartUpsellSlider', () => {
  it('shows only products tagged cart-upsell, excluding ids already in the cart', async () => {
    listMock.mockResolvedValue({
      items: [
        { id: 1, name: 'Not tagged', tags: [{ name: 'whatsapp', url: '' }] },
        { id: 2, name: 'Tagged, in cart', tags: [{ name: 'cart-upsell', url: '' }] },
        { id: 3, name: 'Tagged, suggested', tags: [{ name: 'cart-upsell', url: '' }] },
      ],
    });
    const { getAllByTestId } = renderWithClient(<CartUpsellSlider excludeIds={[2]} />);
    await waitFor(() => expect(getAllByTestId('product-card')).toHaveLength(1));
    expect(getAllByTestId('product-card')[0].textContent).toBe('Tagged, suggested');
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ source: 'latest' }));
  });

  it('renders nothing when no candidate carries the cart-upsell tag', async () => {
    listMock.mockResolvedValue({ items: [{ id: 1, name: 'Plain', tags: [] }] });
    const { container } = renderWithClient(<CartUpsellSlider excludeIds={[]} />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('renders nothing on a fetch error', async () => {
    listMock.mockRejectedValue(new Error('network error'));
    const { container } = renderWithClient(<CartUpsellSlider excludeIds={[]} />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('shows the skeleton until the list resolves', () => {
    listMock.mockReturnValue(new Promise(() => {}));
    const { getByTestId } = renderWithClient(<CartUpsellSlider excludeIds={[]} />);
    expect(getByTestId('list-skeleton')).toBeTruthy();
  });
});
