import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { ProductInfoSection } from '../../../app/components/product/AddToCartForm';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const makeProduct = (overrides: Partial<Product> = {}) =>
  ({ id: 1, name: 'Product', ...overrides }) as Product;

/** The value cell of the row whose label is `labelKey`. */
const rowValue = (container: HTMLElement, labelKey: string) =>
  [...container.querySelectorAll('.text-unicode')].find((el) =>
    el.previousElementSibling?.textContent?.includes(labelKey)
  )?.textContent ?? null;

// `AddToCartForm` passes the live product here, so a selected variant's
// SKU / barcode reaches this section as the product's own.
describe('ProductInfoSection', () => {
  it('shows the SKU and the barcode', () => {
    const { container } = render(
      <ProductInfoSection product={makeProduct({ sku: 'VAR-1', barcode: 'VAR-BC' })} />
    );
    expect(rowValue(container, 'pages.products.sku')).toBe('VAR-1');
    expect(rowValue(container, 'pages.products.barcode')).toBe('VAR-BC');
  });

  it('hides a row with no value', () => {
    const { container } = render(<ProductInfoSection product={makeProduct({ sku: 'PARENT' })} />);
    expect(rowValue(container, 'pages.products.sku')).toBe('PARENT');
    expect(rowValue(container, 'pages.products.barcode')).toBeNull();
  });

  it('renders nothing when there is no SKU, barcode, weight or size guide', () => {
    const { container } = render(<ProductInfoSection product={makeProduct()} />);
    expect(container.firstChild).toBeNull();
  });
});
