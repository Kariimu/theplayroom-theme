import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { Link, Image } from '@salla.sa/twilight-theme-engine/common';
import { cart } from '@salla.sa/twilight-theme-engine/api/cart';
import type { CartItem as CartItemType } from '@salla.sa/twilight-theme-engine/types';
import { BottomSheet } from '../common';
import { CartQuantity } from './CartQuantity';
import { toNumber, moneyCurrency } from './cartMoney';
import { Delete01Icon } from '../icons';

/** Dispatched by the header's cart icon (`Header.tsx`) instead of following its link. */
export const CART_DRAWER_OPEN_EVENT = 'theme::cart-drawer.open';

function DrawerItem({
  item,
  onMutated,
  onNavigate,
}: {
  item: CartItemType;
  onMutated: () => void;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  const { format } = useMoney();
  const [busy, setBusy] = useState(false);

  const changeQuantity = useCallback(
    async (quantity: number) => {
      await window.salla?.cart.updateItem({ id: item.id, quantity });
      onMutated();
    },
    [item.id, onMutated]
  );

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await window.salla?.cart.deleteItem(item.id);
      onMutated();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="cart-drawer-item">
      <Link to={item.url} className="cart-drawer-item__image" onClick={onNavigate}>
        <Image src={item.product_image} alt={item.product_name} aspectRatio="1/1" />
      </Link>

      <div className="cart-drawer-item__body">
        <Link to={item.url} className="cart-drawer-item__name" onClick={onNavigate}>
          {item.product_name}
        </Link>
        <div className="cart-drawer-item__row">
          {item.type === 'donating' || item.is_hidden_quantity ? (
            <span className="cart-drawer-item__qty-static">{item.quantity}</span>
          ) : (
            <CartQuantity
              value={item.quantity}
              max={item.max_quantity ?? undefined}
              label={t('pages.products.quantity', 'Quantity')}
              disabled={busy}
              onChange={changeQuantity}
            />
          )}
          <span className="cart-drawer-item__price">
            {item.is_available
              ? format(toNumber(item.total), { currency: moneyCurrency(item.total) })
              : t('pages.products.out_of_stock', 'Out of Stock')}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="cart-drawer-item__delete"
        aria-label={t('common.elements.remove', 'Remove from the cart')}
        aria-busy={busy}
        disabled={busy}
        onClick={handleDelete}
      >
        <Delete01Icon aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Side cart drawer (D4, built fresh per the owner's decision — the old
 * theme's `cart-drawer.js`/`.scss` shipped but was never wired to any markup,
 * 09 §4). Opens on the `theme::cart-drawer.open` event the header's cart icon
 * dispatches instead of following its link straight to `/cart` (same
 * `window.salla.event` convention as `scopes::open`); the add-to-cart toast
 * keeps its own job — this only reacts to the icon, not to `cart::item.added`,
 * so the two never fight over the same moment.
 *
 * Reuses {@link BottomSheet} for the shell (portal, backdrop, scroll lock,
 * Escape, focus trap) with a `cart-drawer` class that turns its bottom-slide
 * into a side-slide (`04-components/cart-drawer.scss`); the data flow mirrors
 * `CartPage`'s cart id → cart detail → `cart::updated` refetch, gated to only
 * fetch once the drawer has actually been opened.
 */
export function CartDrawer() {
  const { t } = useTranslation();
  const { format } = useMoney();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setHasOpened(true);
    };
    window.salla?.event?.on?.(CART_DRAWER_OPEN_EVENT, onOpen);
    return () => window.salla?.event?.off?.(CART_DRAWER_OPEN_EVENT, onOpen);
  }, []);

  const cartIdQuery = useQuery({ ...cart.queries.currentId(), enabled: hasOpened });
  const cartId = cartIdQuery.data;

  const cartQuery = useQuery({
    ...cart.queries.detail(cartId!),
    enabled: hasOpened && !!cartId,
  });
  const cartData = cartQuery.data;

  const refetchCart = useCallback(() => {
    if (cartId != null) {
      queryClient.invalidateQueries({ queryKey: cart.queries.detail(cartId).queryKey });
    }
  }, [cartId, queryClient]);

  useEffect(() => {
    window.salla?.event?.on?.('cart::updated', refetchCart);
    return () => window.salla?.event?.off?.('cart::updated', refetchCart);
  }, [refetchCart]);

  const close = () => setOpen(false);
  const items = cartData?.items ?? [];
  // While the first fetch is in flight there's no data yet, so `items` reads
  // as empty — without this check the "cart is empty" message would flash
  // before the real rows (or real empty state) land.
  // A visitor with no cart yet has no id: the detail query stays disabled (and
  // so `isPending` forever), and that is the empty state, not loading.
  const loading =
    hasOpened && cartData === undefined && (cartIdQuery.isPending || (!!cartId && cartQuery.isPending));
  const failed = cartData === undefined && (cartIdQuery.isError || cartQuery.isError);
  const retry = () => {
    if (cartIdQuery.isError) cartIdQuery.refetch();
    else cartQuery.refetch();
  };

  return (
    <BottomSheet
      open={open}
      onClose={close}
      className="cart-drawer"
      title={t('common.titles.cart', 'Cart')}
    >
      {loading ? (
        <div className="cart-drawer__skeleton" aria-hidden="true">
          <div className="cart-drawer-item cart-drawer-item--skeleton" />
          <div className="cart-drawer-item cart-drawer-item--skeleton" />
          <div className="cart-drawer-item cart-drawer-item--skeleton" />
        </div>
      ) : failed ? (
        <div className="cart-drawer__empty" role="alert">
          <p>{t('common.errors.error_occurred', 'Something went wrong')}</p>
          <button type="button" className="cart-drawer__retry" onClick={retry}>
            {t('common.elements.try_again', 'Try again')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="cart-drawer__empty">{t('pages.cart.empty_cart', 'Your cart is empty')}</p>
      ) : (
        <>
          <div className="cart-drawer__items">
            {items.map((item) => (
              <DrawerItem key={item.id} item={item} onMutated={refetchCart} onNavigate={close} />
            ))}
          </div>

          {cartData && (
            <div className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>{t('pages.cart.total', 'Total')}</span>
                <b>{format(cartData.total)}</b>
              </div>
              <div className="cart-drawer__actions">
                <Link to="/cart" className="cart-drawer__view-cart" onClick={close}>
                  {t('pages.cart.view_cart', 'View Cart')}
                </Link>
                <button
                  type="button"
                  className="cart-drawer__checkout"
                  onClick={() => {
                    window.salla?.cart.submit();
                    close();
                  }}
                >
                  {t('pages.cart.complete_order', 'Complete Order')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
}
