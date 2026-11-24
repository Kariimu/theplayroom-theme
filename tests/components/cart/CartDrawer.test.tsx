import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartDrawer, CART_DRAWER_OPEN_EVENT } from '../../../app/components/cart/CartDrawer';

const makeCart = () => ({
  id: 5,
  total: 30,
  items: [
    {
      id: 1,
      product_id: 2,
      product_name: 'Wooden Train',
      product_image: '',
      url: '/p2',
      quantity: 2,
      price: 15,
      total: 30,
      is_available: true,
    },
  ],
});
let cartData: ReturnType<typeof makeCart> | null = makeCart();
let currentCartId: number | null = 5;
let currentIdFails = false;
let detailGone = false;

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useMoney', () => ({
  useMoney: () => ({ format: (amount: unknown) => String(amount) }),
}));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, onClick }: { to: string; children?: React.ReactNode; onClick?: () => void }) => (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  ),
  Image: ({ alt }: { alt?: string }) => <img alt={alt ?? ''} />,
}));
// Only the module under test, not the whole barrel and everything it re-exports.
vi.mock('../../../app/components/common', async () => ({
  BottomSheet: (
    await vi.importActual<typeof import('../../../app/components/common/BottomSheet')>(
      '../../../app/components/common/BottomSheet'
    )
  ).BottomSheet,
}));

vi.mock('@salla.sa/twilight-theme-engine/api/cart', () => ({
  cart: {
    queries: {
      currentId: () => ({
        queryKey: ['cart', 'id'],
        queryFn: () => {
          if (currentIdFails) throw new Error('network');
          return currentCartId;
        },
      }),
      detail: (id: number) => ({
        queryKey: ['cart', 'detail', id],
        queryFn: () => {
          if (detailGone) throw Object.assign(new Error('Not Found'), { response: { status: 404 } });
          return cartData;
        },
      }),
    },
  },
}));

function renderDrawer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <CartDrawer />
    </QueryClientProvider>
  );
}

function openDrawer() {
  act(() => {
    window.salla?.event?.dispatch(CART_DRAWER_OPEN_EVENT);
  });
}

/** A real, tiny pub-sub — the component's own `on` registers a listener that
 * `dispatch` must actually reach, which a bare `vi.fn()` pair can't do. */
function makeEventBus() {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
    on: (name: string, cb: (...args: unknown[]) => void) => {
      (listeners.get(name) ?? listeners.set(name, new Set()).get(name)!).add(cb);
    },
    off: (name: string, cb: (...args: unknown[]) => void) => {
      listeners.get(name)?.delete(cb);
    },
    dispatch: (name: string, ...args: unknown[]) => {
      listeners.get(name)?.forEach((cb) => cb(...args));
    },
  };
}

describe('CartDrawer', () => {
  let originalSalla: unknown;
  let updateItem: ReturnType<typeof vi.fn>;
  let deleteItem: ReturnType<typeof vi.fn>;
  let submit: ReturnType<typeof vi.fn>;
  let reset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cartData = makeCart();
    currentCartId = 5;
    currentIdFails = false;
    detailGone = false;
    updateItem = vi.fn().mockResolvedValue(undefined);
    deleteItem = vi.fn().mockResolvedValue(undefined);
    submit = vi.fn();
    reset = vi.fn();
    originalSalla = (window as { salla?: unknown }).salla;
    (window as { salla?: unknown }).salla = {
      event: makeEventBus(),
      cart: { updateItem, deleteItem, submit, reset },
    };
  });

  afterEach(() => {
    (window as { salla?: unknown }).salla = originalSalla;
  });

  it('stays closed and fetches nothing until the open event fires', () => {
    const { container } = renderDrawer();
    expect(container.querySelector('.bottom-sheet-root')).toBeNull();
  });

  it('opens and shows the cart items on the open event', async () => {
    const { getByText } = renderDrawer();
    openDrawer();
    await waitFor(() => expect(getByText('Wooden Train')).toBeTruthy());
  });

  it('shows the empty state when the cart has no items', async () => {
    cartData = { ...makeCart(), items: [] };
    const { getByText } = renderDrawer();
    openDrawer();
    await waitFor(() => expect(getByText('Your cart is empty')).toBeTruthy());
  });

  it('shows the empty state, not a skeleton, for a visitor with no cart yet', async () => {
    currentCartId = null;
    const { getByText, container } = renderDrawer();
    openDrawer();
    await waitFor(() => expect(getByText('Your cart is empty')).toBeTruthy());
    expect(container.querySelector('.cart-drawer__skeleton')).toBeNull();
  });

  it('offers a retry when the cart cannot be loaded, and recovers', async () => {
    currentIdFails = true;
    const { getByText } = renderDrawer();
    openDrawer();
    await waitFor(() => expect(getByText('Something went wrong')).toBeTruthy());
    currentIdFails = false;
    fireEvent.click(getByText('Try again'));
    await waitFor(() => expect(getByText('Wooden Train')).toBeTruthy());
  });

  it('drops a cart the API no longer knows and shows it empty, not an error', async () => {
    detailGone = true;
    const { getByText, queryByText } = renderDrawer();
    openDrawer();
    await waitFor(() => expect(getByText('Your cart is empty')).toBeTruthy());
    expect(queryByText('Something went wrong')).toBeNull();
    expect(reset).toHaveBeenCalled();
  });

  it('removes an item through salla.cart.deleteItem', async () => {
    const { getByLabelText } = renderDrawer();
    openDrawer();
    await waitFor(() => expect(getByLabelText('Remove from the cart')).toBeTruthy());
    fireEvent.click(getByLabelText('Remove from the cart'));
    await waitFor(() => expect(deleteItem).toHaveBeenCalledWith(1));
  });

  it('closes when a cart item link is clicked', async () => {
    const { getByText, container } = renderDrawer();
    openDrawer();
    const nameLink = await waitFor(() => getByText('Wooden Train'));
    fireEvent.click(nameLink);
    await waitFor(() => expect(container.querySelector('.bottom-sheet-root.is-open')).toBeNull());
  });

  it('submits the cart and closes on "Complete Order"', async () => {
    const { getByText, container } = renderDrawer();
    openDrawer();
    await waitFor(() => expect(getByText('Complete Order')).toBeTruthy());
    fireEvent.click(getByText('Complete Order'));
    expect(submit).toHaveBeenCalled();
    await waitFor(() => expect(container.querySelector('.bottom-sheet-root.is-open')).toBeNull());
  });
});
