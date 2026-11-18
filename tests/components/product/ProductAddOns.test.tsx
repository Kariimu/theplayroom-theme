import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { ProductAddOns } from '../../../app/components/product/ProductAddOns';

const listMock = vi.fn();

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

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

vi.mock('@salla.sa/twilight-theme-engine/hooks/useMoney', () => ({
  useMoney: () => ({ format: (amount: number) => `${amount} SAR` }),
}));

// Only the module under test, not the whole barrel (`BlockHookSlot` pulls in
// the engine's home-components chunk transitively — same issue `ProductsSlider.test.tsx` avoids this way).
vi.mock('../../../app/components/common', async () => ({
  ScrollCarousel: (await vi.importActual<typeof import('../../../app/components/common/ScrollCarousel')>(
    '../../../app/components/common/ScrollCarousel'
  )).ScrollCarousel,
}));

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  Image: ({ src, alt }: { src?: string; alt?: string }) => <img src={src} alt={alt} />,
}));

const makeItem = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 2,
    name: 'Wooden Rings',
    url: '/wooden-rings/p2',
    price: 79,
    image: { url: 'https://cdn.test/rings.png' },
    type: 'product',
    has_options: false,
    is_out_of_stock: false,
    tags: [],
    ...overrides,
  }) as Product;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  listMock.mockReset();
  Element.prototype.scrollBy = vi.fn();
});

describe('ProductAddOns', () => {
  it('renders nothing without an addons-p<id> tag', () => {
    const { container } = renderWithClient(
      <ProductAddOns productId={1} tags={[{ name: 'whatsapp', url: '' }]} />
    );
    expect(container.firstChild).toBeNull();
    expect(listMock).not.toHaveBeenCalled();
  });

  it("renders nothing on an accessory's own page — the tag's key names a different product", () => {
    // Tagged into product 1's add-on group, but this *is* product 999, not the master.
    const { container } = renderWithClient(
      <ProductAddOns productId={999} tags={[{ name: 'addons-p1', url: 'https://x.test/tag-555' }]} />
    );
    expect(container.firstChild).toBeNull();
    expect(listMock).not.toHaveBeenCalled();
  });

  it("lists the group by the master's own addons-p<id> tag, excluding itself, and shows name + price", async () => {
    listMock.mockResolvedValue({ items: [makeItem(), makeItem({ id: 1, name: 'Self' })] });

    const { container, getByText } = renderWithClient(
      <ProductAddOns productId={1} tags={[{ name: 'addons-p1', url: 'https://x.test/tag-555' }]} />
    );

    await waitFor(() => expect(getByText('Wooden Rings')).toBeTruthy());
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'tags', sourceValue: 555 })
    );
    // The master itself (id 1) is excluded from its own add-ons list.
    expect(container.textContent).not.toContain('Self');
    expect(getByText('79 SAR')).toBeTruthy();
  });

  it('picks the addons-p tag matching its own id when it also carries another group\'s tag', async () => {
    listMock.mockResolvedValue({ items: [makeItem()] });

    renderWithClient(
      <ProductAddOns
        productId={1}
        tags={[
          { name: 'addons-p999', url: 'https://x.test/tag-111' }, // an accessory of product 999
          { name: 'addons-p1', url: 'https://x.test/tag-555' }, // master of its own group
        ]}
      />
    );

    await waitFor(() =>
      expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ sourceValue: 555 }))
    );
  });

  it('renders nothing when the list resolves empty', async () => {
    listMock.mockResolvedValue({ items: [] });
    const { container } = renderWithClient(
      <ProductAddOns productId={1} tags={[{ name: 'addons-p1', url: 'https://x.test/tag-555' }]} />
    );
    await waitFor(() => expect(listMock).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('adds a plain add-on straight to cart on click', async () => {
    listMock.mockResolvedValue({ items: [makeItem()] });
    const addItem = vi.fn().mockResolvedValue(undefined);
    (window as unknown as { salla: unknown }).salla = { cart: { addItem } };

    const { getByText } = renderWithClient(
      <ProductAddOns productId={1} tags={[{ name: 'addons-p1', url: 'https://x.test/tag-555' }]} />
    );

    const button = await waitFor(() => getByText('Add to Cart'));
    fireEvent.click(button);

    await waitFor(() => expect(addItem).toHaveBeenCalledWith({ id: 2, quantity: 1 }));
    delete (window as unknown as { salla?: unknown }).salla;
  });

  it('adds an add-on with options straight to cart too — the cart page lets the shopper pick them', async () => {
    listMock.mockResolvedValue({ items: [makeItem({ has_options: true })] });
    const addItem = vi.fn().mockResolvedValue(undefined);
    (window as unknown as { salla: unknown }).salla = { cart: { addItem } };

    const { getByText } = renderWithClient(
      <ProductAddOns productId={1} tags={[{ name: 'addons-p1', url: 'https://x.test/tag-555' }]} />
    );

    const button = await waitFor(() => getByText('Add to Cart'));
    fireEvent.click(button);

    await waitFor(() => expect(addItem).toHaveBeenCalledWith({ id: 2, quantity: 1 }));
    delete (window as unknown as { salla?: unknown }).salla;
  });

  it('adds a non-"product" type (e.g. a service) straight to cart too', async () => {
    listMock.mockResolvedValue({ items: [makeItem({ type: 'service' })] });
    const addItem = vi.fn().mockResolvedValue(undefined);
    (window as unknown as { salla: unknown }).salla = { cart: { addItem } };

    const { getByText } = renderWithClient(
      <ProductAddOns productId={1} tags={[{ name: 'addons-p1', url: 'https://x.test/tag-555' }]} />
    );

    const button = await waitFor(() => getByText('Add to Cart'));
    fireEvent.click(button);

    await waitFor(() => expect(addItem).toHaveBeenCalledWith({ id: 2, quantity: 1 }));
    delete (window as unknown as { salla?: unknown }).salla;
  });

  it('links to the product page instead of quick-adding for a WhatsApp-only add-on', async () => {
    listMock.mockResolvedValue({ items: [makeItem({ tags: [{ name: 'whatsapp', url: '' }] })] });

    const { getByText } = renderWithClient(
      <ProductAddOns productId={1} tags={[{ name: 'addons-p1', url: 'https://x.test/tag-555' }]} />
    );

    const link = await waitFor(() => getByText('Select Options'));
    expect(link.closest('a')?.getAttribute('href')).toBe('/wooden-rings/p2');
  });

  it('shows a disabled label for an out-of-stock add-on', async () => {
    listMock.mockResolvedValue({ items: [makeItem({ is_out_of_stock: true })] });

    const { getByText } = renderWithClient(
      <ProductAddOns productId={1} tags={[{ name: 'addons-p1', url: 'https://x.test/tag-555' }]} />
    );

    const label = await waitFor(() => getByText('Out of Stock'));
    expect(label.tagName).toBe('SPAN');
  });
});
