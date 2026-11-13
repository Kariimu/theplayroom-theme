import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ProductListPage } from '../../../app/components/product/ProductListPage';
import type { ProductListLoaderData } from '@salla.sa/twilight-theme-engine/routes/product-listing';

let storeSettings: { product?: { filters?: boolean }; category?: { testimonial_enabled?: boolean } } = {};
let locale = 'ar';

vi.mock('@salla.sa/twilight-theme-engine/hooks', () => ({
  HookSlot: () => null,
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useStore', () => ({
  useStore: () => ({ settings: storeSettings }),
}));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale }),
}));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/ar/c1', searchStr: '' }),
  useTwilight: () => ({ theme: { settings: {} } }),
}));
vi.mock('@salla.sa/twilight-theme-engine/utils', () => ({
  sortOptions: () => [{ id: 'ourSuggest', name: 'Our suggestion' }],
  onSallaEvent: () => () => {},
}));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Breadcrumb: () => null,
  NoContent: ({ message }: { message?: string }) => <div data-testid="no-content">{message}</div>,
  ProductCardSkeleton: () => null,
  Image: (props: Record<string, unknown>) => (
    <img alt={String(props.alt ?? '')} src={String(props.src ?? '')} />
  ),
  Link: ({ to, children, className }: { to: string; children?: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  RenderWhenVisible: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@salla.sa/twilight-components-react/filters', () => ({
  SallaFilters: () => <div data-testid="salla-filters" />,
}));
vi.mock('@salla.sa/twilight-components-react', () => ({
  ItemsList: ({
    items,
    children,
    empty,
  }: {
    items: unknown[];
    children: (items: unknown[]) => ReactNode;
    empty?: ReactNode;
  }) => <div data-testid="items-list">{items.length === 0 ? empty : children(items)}</div>,
  ReviewItemSkeleton: () => null,
}));
vi.mock('@salla.sa/twilight-theme-engine/home', () => ({
  Testimonials: () => null,
  useReorderButtons: () => {},
}));
vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({
  product: { list: vi.fn().mockResolvedValue({ items: [], next: null }) },
  parseNextPageToken: () => ({}),
}));
vi.mock('@salla.sa/twilight-theme-engine/routes/product-listing', () => ({
  useAppliedFilters: () => ({
    filters: null,
    page: null,
    lastPage: null,
    status: 'idle',
    retry: vi.fn(),
  }),
}));
vi.mock('../../../app/components/product/ProductCard', () => ({
  ProductCard: ({ product }: { product: { id: number; name: string } }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));
vi.mock('../../../app/components/common', () => ({
  BlockHookSlot: () => null,
  BottomSheet: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
}));
vi.mock('../../../app/hooks/useAppSafeAreaTop', () => ({ useAppSafeAreaTop: () => 0 }));
vi.mock('../../../app/hooks/useProductCardLayout', () => ({ useProductCardLayout: () => 'vertical' }));
vi.mock('../../../app/hooks/useScrollDirection', () => ({ useScrollDirection: () => 'up' }));
vi.mock('../../../app/lib/productsFetched', () => ({ dispatchProductsFetched: () => {} }));

function product(id: number, name: string, tagNames: string[] = []) {
  return { id, name, url: `/p${id}`, tags: tagNames.map((n) => ({ name: n, url: '' })) };
}

function baseData(overrides: Partial<ProductListLoaderData> = {}): ProductListLoaderData {
  return {
    page: { title: 'ألعاب خشبية', slug: 'c1', id: '1' },
    source: { type: 'categories', value: '1', entity: undefined },
    query: { sort: 'ourSuggest', filters: false },
    products: [],
    pagination: { next: null },
    filters: [],
    ...overrides,
  };
}

describe('ProductListPage — category hero', () => {
  it('renders the category image, description and sub-category cards', () => {
    const data = baseData({
      source: {
        type: 'categories',
        value: '1',
        entity: {
          id: 1,
          name: 'ألعاب خشبية',
          url: '/c1',
          image: 'cat.jpg',
          description: 'ألعاب خشبية مستدامة',
          products_count: 7,
          sub_categories: [{ id: 2, name: 'تسلق', url: '/c2' }],
        },
      },
    });
    const { getByText, getByAltText } = render(<ProductListPage {...data} />);
    expect(getByAltText('ألعاب خشبية').getAttribute('src')).toBe('cat.jpg');
    expect(getByText('ألعاب خشبية مستدامة')).toBeTruthy();
    expect(getByText('تسلق')).toBeTruthy();
  });

  it('renders no hero content for a category with no image, description or children', () => {
    const data = baseData({
      source: { type: 'categories', value: '1', entity: { id: 1, name: 'ألعاب', url: '/c1' } },
    });
    const { container } = render(<ProductListPage {...data} />);
    expect(container.querySelector('.category-hero')).toBeNull();
  });
});

describe('ProductListPage — product count', () => {
  it("shows the category's own count when idle and nothing else is filtering", () => {
    const data = baseData({
      source: { type: 'categories', value: '1', entity: { id: 1, name: 'ألعاب', url: '/c1', products_count: 42 } },
    });
    const { container } = render(<ProductListPage {...data} />);
    expect(container.querySelector('.s-catalog-count')?.textContent).toContain('42');
  });

  it('shows no count for a source with no known total (e.g. "latest")', () => {
    const data = baseData({ source: { type: 'latest', value: undefined, entity: undefined } });
    const { container } = render(<ProductListPage {...data} />);
    expect(container.querySelector('.s-catalog-count')).toBeNull();
  });
});

describe('ProductListPage — tag-group filter', () => {
  const products = [
    product(1, 'Climbing triangle', ['Age Range-7 months - 5 years']),
    product(2, 'Balance board', ['Age Range-5-8 years']),
  ];

  beforeEach(() => {
    // The fixture tags are English; match the locale buildTagFilterGroups filters on.
    locale = 'en';
  });

  it('shows the filter column from tag groups alone, even with native filters disabled', () => {
    storeSettings = { product: { filters: false } };
    const data = baseData({
      source: { type: 'categories', value: '1', entity: { id: 1, name: 'ألعاب', url: '/c1' } },
      products,
      query: { sort: 'ourSuggest', filters: false },
    });
    const { getByText, queryByTestId } = render(<ProductListPage {...data} />);
    expect(getByText('Age Range')).toBeTruthy();
    // native filters are off: the salla-filters widget itself shouldn't render
    expect(queryByTestId('salla-filters')).toBeNull();
  });

  it('narrows the rendered cards and the count when a filter is toggled', () => {
    storeSettings = { product: { filters: false } };
    const data = baseData({
      source: { type: 'categories', value: '1', entity: { id: 1, name: 'ألعاب', url: '/c1' } },
      products,
      query: { sort: 'ourSuggest', filters: false },
    });
    const { container, getByLabelText, getAllByTestId, getByText, queryByText } = render(
      <ProductListPage {...data} />
    );
    expect(getAllByTestId('product-card')).toHaveLength(2);

    fireEvent.click(getByLabelText('7 months - 5 years'));

    expect(getAllByTestId('product-card')).toHaveLength(1);
    expect(getByText('Climbing triangle')).toBeTruthy();
    expect(queryByText('Balance board')).toBeNull();
    expect(container.querySelector('.s-catalog-count')?.textContent).toContain('1');
  });

  it('shows a no-match message when no single product carries every selected tag', () => {
    storeSettings = { product: { filters: false } };
    const data = baseData({
      source: { type: 'categories', value: '1', entity: { id: 1, name: 'ألعاب', url: '/c1' } },
      products: [
        product(1, 'Climbing triangle', ['Age Range-7 months - 5 years']),
        product(2, 'Painted blocks', ['Color-Natural wood']),
      ],
      query: { sort: 'ourSuggest', filters: false },
    });
    const { getByLabelText, queryByTestId, getByTestId } = render(<ProductListPage {...data} />);
    // AND across groups: no product has both, so selecting one from each matches nothing.
    fireEvent.click(getByLabelText('7 months - 5 years'));
    fireEvent.click(getByLabelText('Natural wood'));
    expect(queryByTestId('product-card')).toBeNull();
    expect(getByTestId('no-content')).toBeTruthy();
  });
});
