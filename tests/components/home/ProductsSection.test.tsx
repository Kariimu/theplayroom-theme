import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProductsSection } from '../../../app/components/home/ProductsSection';

vi.mock('../../../app/hooks/useProductCardLayout', () => ({
  useProductCardLayout: () => 'vertical' as const,
}));

vi.mock('../../../app/components/product', () => ({
  ProductCard: ({ product }: { product: { id?: number; name?: string } }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

const listMock = vi.fn().mockResolvedValue({ data: [] });
vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({
  product: { list: (...args: unknown[]) => listMock(...args) },
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
  ProductCardSkeleton: () => <div data-testid="card-skeleton" />,
  SallaProductsList: (props: {
    loader: () => unknown;
    children: (items: unknown[]) => unknown;
    itemsClassName?: string;
  }) => {
    const { loader, children, itemsClassName } = props;
    loader();
    return (
      <div data-testid="salla-products-list" className={itemsClassName}>
        {children([
          { id: 1, name: 'Product 1' },
          { id: 2, name: 'Product 2' },
        ]) as never}
      </div>
    );
  },
}));

describe('ProductsSection', () => {
  it('renders nothing with no products selected', () => {
    const { container } = render(<ProductsSection data={{ products: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('loads the selected products by id', () => {
    render(<ProductsSection data={{ products: [{ id: 1 }, { id: 2 }] }} />);
    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'selected', sourceValue: [1, 2] })
    );
  });

  it('renders the header title and description', () => {
    const { container } = render(
      <ProductsSection
        data={{ products: [{ id: 1 }], title_section: 'Bestsellers', desc_section: 'Top picks' }}
      />
    );
    expect(container.querySelector('h2')?.textContent).toBe('Bestsellers');
    expect(container.textContent).toContain('Top picks');
  });

  it('renders the footer blurb', () => {
    const { container } = render(
      <ProductsSection data={{ products: [{ id: 1 }], desc2_section: 'More to explore' }} />
    );
    expect(container.textContent).toContain('More to explore');
  });

  it('renders the view-all button only with both a link and button text', () => {
    const { container, rerender } = render(
      <ProductsSection data={{ products: [{ id: 1 }], btn_text: 'View all', button_url: '/products' }} />
    );
    expect(container.querySelector('a[href="/products"]')?.textContent).toBe('View all');

    rerender(<ProductsSection data={{ products: [{ id: 1 }], btn_text: 'View all', button_url: [] }} />);
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders the selected products', () => {
    const { container } = render(<ProductsSection data={{ products: [{ id: 1 }, { id: 2 }] }} />);
    expect(container.querySelectorAll('[data-testid="product-card"]').length).toBe(2);
  });
});
