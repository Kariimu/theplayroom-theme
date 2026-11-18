import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductsSection } from '../../../app/components/home/ProductsSection';

const listMock = vi.fn();

vi.mock('../../../app/components/common', async () => ({
  ScrollCarousel: (await vi.importActual<typeof import('../../../app/components/common/ScrollCarousel')>(
    '../../../app/components/common/ScrollCarousel'
  )).ScrollCarousel,
}));

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({
  product: {
    queries: {
      list: (params: { source: string; sourceValue?: unknown }) => ({
        queryKey: ['products', 'list', params],
        queryFn: () => listMock(params),
      }),
    },
  },
}));

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@salla.sa/twilight-components-react', () => ({
  ProductsListSkeleton: () => <div data-testid="list-skeleton" />,
}));

vi.mock('../../../app/components/product', () => ({
  ProductCard: ({
    product,
    layout,
  }: {
    product: { id?: number; name?: string };
    layout?: string;
  }) => (
    <div data-testid="product-card" data-layout={layout}>
      {product.name}
    </div>
  ),
}));

// `useQuery` needs a QueryClient in context.
function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  listMock.mockReset();
  listMock.mockResolvedValue({ items: [{ id: 1, name: 'Product 1' }, { id: 2, name: 'Product 2' }] });
  Element.prototype.scrollBy = vi.fn();
});

describe('ProductsSection', () => {
  it('renders nothing with no products selected', () => {
    const { container } = renderWithClient(<ProductsSection data={{ products: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('loads the selected products by id', () => {
    renderWithClient(<ProductsSection data={{ products: [{ id: 1 }, { id: 2 }] }} />);
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'selected', sourceValue: [1, 2] })
    );
  });

  it('renders the header title and description', () => {
    const { container } = renderWithClient(
      <ProductsSection
        data={{ products: [{ id: 1 }], title_section: 'Bestsellers', desc_section: 'Top picks' }}
      />
    );
    expect(container.querySelector('h2')?.textContent).toBe('Bestsellers');
    expect(container.textContent).toContain('Top picks');
  });

  it('renders the footer blurb', () => {
    const { container } = renderWithClient(
      <ProductsSection data={{ products: [{ id: 1 }], desc2_section: 'More to explore' }} />
    );
    expect(container.textContent).toContain('More to explore');
  });

  it('renders the view-all button only with both a link and button text', () => {
    const { container, rerender } = render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>
        <ProductsSection data={{ products: [{ id: 1 }], btn_text: 'View all', button_url: '/products' }} />
      </QueryClientProvider>
    );
    expect(container.querySelector('a[href="/products"]')?.textContent).toBe('View all');

    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>
        <ProductsSection data={{ products: [{ id: 1 }], btn_text: 'View all', button_url: [] }} />
      </QueryClientProvider>
    );
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders the selected products as vertical-card slides, a slider at every breakpoint', async () => {
    const { container, getAllByTestId } = renderWithClient(
      <ProductsSection data={{ products: [{ id: 1 }, { id: 2 }] }} />
    );
    await waitFor(() => expect(getAllByTestId('product-card').length).toBe(2));
    for (const card of getAllByTestId('product-card')) {
      expect(card.getAttribute('data-layout')).toBe('vertical');
    }
    expect(container.querySelectorAll('.s-products-carousel__slide').length).toBe(2);
  });
});
