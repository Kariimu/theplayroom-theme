import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { ProductCard } from '../../../app/components/product/ProductCard';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../../app/lib/productImage';

const wishlistState = { ids: [] as number[] };

// Mirrors the real engine's conditional: the image-corner wishlist button only
// renders for `!isHorizontal && !isFullImage` (theme-engine ProductCard.tsx) —
// a `layout` change on an already-mounted card unmounts just that button while
// its siblings (and the whole card) stay mounted.
vi.mock('@salla.sa/twilight-theme-engine/product', () => ({
  ProductCard: ({
    product,
    layout = 'vertical',
  }: {
    product: { id: number; name: string; image?: { url?: string } };
    layout?: string;
  }) => (
    <div
      className="s-product-card-vertical"
      data-testid="engine-card"
      data-image={product.image?.url}
    >
      <div className="s-product-card-image">
        {layout !== 'horizontal' && (
          <button
            type="button"
            className="s-product-card-wishlist-btn"
            aria-label="engine wishlist"
          >
            {product.name}
          </button>
        )}
      </div>
      <div className="s-product-card-content-footer" data-testid="footer">
        <salla-add-product-button fill="outline" />
      </div>
    </div>
  ),
}));

vi.mock('@salla.sa/twilight-theme-engine/hooks/useWishlist', () => ({
  useWishlist: () => ({
    has: (id: number) => wishlistState.ids.includes(id),
    toggle: vi.fn((id: number) => {
      wishlistState.ids = wishlistState.ids.includes(id)
        ? wishlistState.ids.filter((x) => x !== id)
        : [...wishlistState.ids, id];
    }),
  }),
}));

vi.mock('@salla.sa/twilight-theme-engine/hooks/useMoney', () => ({
  useMoney: () => ({ format: (amount: unknown) => `${amount} SAR` }),
}));

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({
    to,
    children,
    className,
    ...rest
  }: { to: string; children?: React.ReactNode; className?: string } & Record<string, unknown>) => (
    <a href={to} className={className} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fallback?: string) => fallback ?? _k }),
}));

vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ theme: { settings: { whatsapp_number: '966532603300' } } }),
}));

const product = { id: 42, name: 'Test product' } as never;

beforeEach(() => {
  wishlistState.ids = [];
  cleanup();
});

describe('ProductCard (non-vertical layouts, engine-wrapped)', () => {
  it('shows the placeholder, whole, for a product with no photo', () => {
    const { getByTestId } = render(<ProductCard product={product} layout="horizontal" />);
    const card = getByTestId('engine-card');
    expect(card.getAttribute('data-image')).toBe(PRODUCT_IMAGE_PLACEHOLDER);
    expect(card.parentElement?.hasAttribute('data-image-placeholder')).toBe(true);
  });

  it('leaves a product with a photo as it is', () => {
    const photo = { id: 1, name: 'Photo', image: { url: 'https://example.com/a.jpg' } } as never;
    const { getByTestId } = render(<ProductCard product={photo} layout="horizontal" />);
    const card = getByTestId('engine-card');
    expect(card.getAttribute('data-image')).toBe('https://example.com/a.jpg');
    expect(card.parentElement?.hasAttribute('data-image-placeholder')).toBe(false);
  });

  it('portals a wishlist toggle into the engine card footer instead of moving the image one', async () => {
    const { getByTestId, getByLabelText } = render(
      <ProductCard product={product} layout="fullImage" />
    );

    await waitFor(() => {
      expect(
        getByTestId('footer').querySelector('[aria-label="Add or remove to wishlist"]')
      ).toBeTruthy();
    });

    // The engine's own image-corner button is untouched — still inside the image container,
    // not moved (i.e. this is a style hide, not the old appendChild reparenting).
    expect(getByLabelText('engine wishlist').closest('.s-product-card-image')).toBeTruthy();
    // Our portaled button lives in the footer, as a distinct element.
    expect(getByTestId('footer').querySelector('button')).toBeTruthy();
  });

  it('hides the engine image-corner button so only one wishlist control is visible', async () => {
    const { getByTestId, getByLabelText } = render(
      <ProductCard product={product} layout="fullImage" />
    );

    await waitFor(() => expect(getByLabelText('engine wishlist').style.display).toBe('none'));
    // The footer's portaled button stays visible (no inline hide applied to it).
    expect(getByTestId('footer').querySelector('button')?.style.display).not.toBe('none');
  });

  it('toggles the wishlist through the portaled button without touching the engine node', async () => {
    const { getByTestId } = render(<ProductCard product={product} layout="fullImage" />);

    await waitFor(() => expect(getByTestId('footer').querySelector('button')).toBeTruthy());
    const footerBtn = getByTestId('footer').querySelector('button')!;
    footerBtn.click();

    expect(wishlistState.ids).toContain(42);
  });

  it('shows a saved product as added when the list sends its id as a string', async () => {
    wishlistState.ids = [42];
    const { getByTestId } = render(
      <ProductCard product={{ id: '42', name: 'Listed' } as never} layout="fullImage" />
    );

    await waitFor(() =>
      expect(getByTestId('footer').querySelector('button')?.className).toContain(
        's-product-card-wishlist-added'
      )
    );
    expect(getByTestId('footer').querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('reports an unsaved product as not pressed', async () => {
    const { getByTestId } = render(<ProductCard product={product} layout="fullImage" />);

    await waitFor(() =>
      expect(getByTestId('footer').querySelector('button')?.getAttribute('aria-pressed')).toBe(
        'false'
      )
    );
  });

  it('marks the heart with the product id, as Twig does, so wishlist apps can find it', async () => {
    const { getByTestId } = render(<ProductCard product={product} layout="fullImage" />);

    await waitFor(() =>
      expect(getByTestId('footer').querySelector('button')?.getAttribute('data-id')).toBe('42')
    );
  });

  it('unmounts cleanly — no DOM-reparenting removeChild errors', async () => {
    const { getByTestId, unmount } = render(<ProductCard product={product} layout="fullImage" />);
    await waitFor(() => expect(getByTestId('footer').querySelector('button')).toBeTruthy());

    expect(() => unmount()).not.toThrow();
  });

  it('swaps add-to-cart for a WhatsApp enquiry on a whatsapp-tagged product', async () => {
    const wa = { id: 7, name: 'Climbing wall', tags: [{ name: 'whatsapp' }] } as never;
    const { getByTestId } = render(<ProductCard product={wa} layout="fullImage" />);

    await waitFor(() => {
      const link = getByTestId('footer').querySelector(
        'a.s-product-card-whatsapp-btn'
      ) as HTMLAnchorElement | null;
      expect(link).toBeTruthy();
      expect(link!.getAttribute('href')).toContain('https://wa.me/966532603300');
    });
    // The buy button is hidden by CSS via `data-whatsapp` on the wrapper (no DOM surgery).
    expect(getByTestId('engine-card').parentElement?.getAttribute('data-whatsapp')).toBe('true');
    // The engine node is left in place (hidden by the stylesheet, not removed).
    expect(getByTestId('footer').querySelector('salla-add-product-button')).toBeTruthy();
  });

  it('keeps add-to-cart for a product without the whatsapp tag', async () => {
    const { getByTestId } = render(<ProductCard product={product} layout="fullImage" />);

    await waitFor(() => expect(getByTestId('footer').querySelector('button')).toBeTruthy());
    expect(getByTestId('footer').querySelector('a.s-product-card-whatsapp-btn')).toBeNull();
    expect(getByTestId('engine-card').parentElement?.hasAttribute('data-whatsapp')).toBe(false);
  });

  it('survives switching from the custom vertical card to the engine-wrapped horizontal one', async () => {
    const { getByTestId, rerender } = render(<ProductCard product={product} layout="vertical" />);
    await waitFor(() => expect(document.querySelector('.product-card')).toBeTruthy());

    expect(() => rerender(<ProductCard product={product} layout="horizontal" />)).not.toThrow();
    await waitFor(() => expect(getByTestId('footer').querySelector('button')).toBeTruthy());
  });
});

describe('ProductCard (default/vertical layout, custom card)', () => {
  it('renders the custom card, not the engine one, by default', () => {
    render(<ProductCard product={product} />);
    expect(document.querySelector('.product-card')).toBeTruthy();
    expect(document.querySelector('.s-product-card-vertical')).toBeNull();
  });

  it('links the card to the product page', () => {
    const p = { ...product, url: '/products/test' } as never;
    const { container } = render(<ProductCard product={p} />);
    expect(container.querySelector('a.product-card__link')?.getAttribute('href')).toBe(
      '/products/test'
    );
  });

  it('renders the promotion badge from promotion_title', () => {
    const p = { ...product, promotion_title: 'New' } as never;
    const { getByText } = render(<ProductCard product={p} />);
    expect(getByText('New')).toBeTruthy();
  });

  it('renders a disabled out-of-stock state instead of a badge or quick-add', () => {
    const p = { ...product, promotion_title: 'New', is_out_of_stock: true } as never;
    const { queryByText, container } = render(<ProductCard product={p} />);
    expect(queryByText('New')).toBeNull();
    expect(queryByText('Out of Stock')).toBeTruthy();
    expect(container.querySelector('.product-card__quick-action--disabled')).toBeTruthy();
    expect(container.querySelector('button.product-card__quick-action')).toBeNull();
  });

  it('shows a WhatsApp enquiry link and no cart button for a whatsapp-tagged product', () => {
    const p = {
      ...product,
      tags: [{ name: 'whatsapp' }],
    } as never;
    const { container } = render(<ProductCard product={p} />);
    const waLink = container.querySelector('a.product-card__quick-action');
    expect(waLink?.getAttribute('href')).toContain('https://wa.me/966532603300');
    expect(container.querySelector('button.product-card__quick-action')).toBeNull();
  });

  it('links to the product page instead of adding to cart when the product has options', () => {
    const p = { ...product, has_options: true, url: '/products/test', type: 'product' } as never;
    const { container } = render(<ProductCard product={p} />);
    const action = container.querySelector('a.product-card__quick-action');
    expect(action).toBeTruthy();
    expect(action!.getAttribute('href')).toBe('/products/test');
  });

  it('links to the product page instead of adding to cart for a non-plain product type (e.g. booking)', () => {
    const p = { ...product, type: 'booking', url: '/products/book' } as never;
    const { container } = render(<ProductCard product={p} />);
    const action = container.querySelector('a.product-card__quick-action');
    expect(action?.getAttribute('href')).toBe('/products/book');
  });

  it('adds a plain product straight to the cart on quick-action click', async () => {
    const addItem = vi.fn().mockResolvedValue(undefined);
    (window as unknown as { salla: unknown }).salla = { cart: { addItem } };

    const p = { ...product, id: 99, type: 'product', has_options: false } as never;
    const { container } = render(<ProductCard product={p} />);
    const action = container.querySelector('button.product-card__quick-action') as HTMLButtonElement;
    expect(action).toBeTruthy();

    fireEvent.click(action);
    await waitFor(() => expect(addItem).toHaveBeenCalledWith({ id: 99, quantity: 1 }));

    delete (window as unknown as { salla?: unknown }).salla;
  });

  it('shows the hover image only when the product actually has a second one', () => {
    const withHover = {
      ...product,
      image: { url: 'https://example.com/a.jpg' },
      images: [{ url: 'https://example.com/a.jpg' }, { url: 'https://example.com/b.jpg' }],
    } as never;
    const { container, rerender } = render(<ProductCard product={withHover} />);
    expect(container.querySelector('.product-card__image--hover')).toBeTruthy();

    const withoutHover = { ...product, image: { url: 'https://example.com/a.jpg' } } as never;
    rerender(<ProductCard product={withoutHover} />);
    expect(container.querySelector('.product-card__image--hover')).toBeNull();
  });
});
