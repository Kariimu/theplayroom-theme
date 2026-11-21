import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { ProductInfo } from '../../../app/components/product/ProductInfo';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

// `ProductDescription` lives in the `ProductDetails` fork, whose other
// imports are irrelevant here.
vi.mock('../../../app/components/product/ProductDetails', () => ({
  ProductDescription: ({ product }: { product: Product }) => (
    <div className="stub-description">{product.description}</div>
  ),
}));

afterEach(() => {
  delete (window as unknown as { salla?: unknown }).salla;
});

const makeProduct = (overrides: Partial<Product> = {}) =>
  ({ id: 101, description: 'A wooden climbing triangle.', has_metadata: true, ...overrides }) as Product;

function stubFetchValues(data: unknown) {
  (window as unknown as { salla: unknown }).salla = {
    metadata: { fetchValues: vi.fn().mockResolvedValue({ data }) },
  };
}

const titles = (container: HTMLElement) =>
  [...container.querySelectorAll('.product-info__title')].map((el) => el.textContent);

describe('ProductInfo', () => {
  it('shows the description under Product Details before the custom fields load', () => {
    const { container } = render(<ProductInfo product={makeProduct({ has_metadata: false })} />);
    expect(titles(container)).toEqual(['Product Details']);
    expect(container.querySelector('.stub-description')?.textContent).toBe('A wooden climbing triangle.');
    expect(container.querySelector('details')?.open).toBe(false);
  });

  it('adds the other sections once the custom fields arrive, each group in its section', async () => {
    stubFetchValues({
      sections: [
        { name: 'مميزات المنتج', fields: [{ name: '.', value: 'خشب طبيعي | آمن للأطفال' }] },
        { name: 'تفاصيل المنتج', fields: [{ name: 'الخامة', value: 'خشب الزان' }] },
        { name: 'دليل التركيب', fields: [{ name: 'الدليل', type: 'file', value: 'https://cdn/guide.pdf' }] },
        { name: 'تفاصيل الشحن', fields: [{ name: '.', value: '3-5 أيام' }] },
      ],
    });
    const { container } = render(<ProductInfo product={makeProduct()} />);

    await waitFor(() =>
      expect(titles(container)).toEqual(['Product Details', 'Specifications', 'Assembly', 'Shipping & Returns'])
    );
    const [details, specs, assembly] = container.querySelectorAll('details');
    // features: a sub-heading and a checklist split on `|`
    expect(details.querySelector('.product-info__group-title')?.textContent).toBe('مميزات المنتج');
    expect(details.querySelectorAll('.product-info__list li')).toHaveLength(2);
    // facts group: a labelled row, no sub-heading
    expect(specs.querySelector('.product-info__group-title')).toBeNull();
    expect(specs.querySelector('.product-info__label')?.textContent).toBe('الخامة');
    // the guide file is a link that opens in a new tab
    const link = assembly.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://cdn/guide.pdf');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('reads the groups through salla.api.metadata, as the storefront SDK provides them', async () => {
    const fetchValues = vi.fn().mockResolvedValue({
      data: [
        {
          entity_id: 101,
          sections: [{ name: 'تفاصيل الشحن', fields: [{ name: '.', type: 'text', value: '3-5 أيام' }] }],
        },
      ],
    });
    (window as unknown as { salla: unknown }).salla = {
      onReady: () => Promise.resolve(),
      api: { metadata: { fetchValues } },
    };
    const { container } = render(<ProductInfo product={makeProduct()} />);
    await waitFor(() => expect(titles(container)).toEqual(['Product Details', 'Shipping & Returns']));
    expect(fetchValues).toHaveBeenCalledWith('product', 101);
  });

  it('renders nothing without a description or custom fields', () => {
    const { container } = render(
      <ProductInfo product={makeProduct({ description: '', has_metadata: false })} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('keeps just Product Details if the custom fields call fails', async () => {
    (window as unknown as { salla: unknown }).salla = {
      metadata: { fetchValues: vi.fn().mockRejectedValue(new Error('network')) },
    };
    const { container } = render(<ProductInfo product={makeProduct()} />);
    await waitFor(() => expect(titles(container)).toEqual(['Product Details']));
  });
});
