import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { useStore } from '@salla.sa/twilight-theme-engine/hooks/useStore';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useLocation, useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { onSallaEvent } from '@salla.sa/twilight-theme-engine/utils';
import {
  Breadcrumb,
  NoContent,
  ProductCardSkeleton,
  Image,
  RenderWhenVisible,
} from '@salla.sa/twilight-theme-engine/common';
import { SallaFilters } from '@salla.sa/twilight-components-react/filters';
import {
  ItemsList,
  ReviewItemSkeleton,
  type ItemsLoaderFn,
} from '@salla.sa/twilight-components-react';
import { Testimonials, useReorderButtons } from '@salla.sa/twilight-theme-engine/home';
import { product, parseNextPageToken } from '@salla.sa/twilight-theme-engine/api/product';
import type { ProductListLoaderData } from '@salla.sa/twilight-theme-engine/routes/product-listing';
import type { Category, Product } from '@salla.sa/twilight-theme-engine/types';
import { ProductCard } from './ProductCard';
import { useAppliedFilters } from '@salla.sa/twilight-theme-engine/routes/product-listing';
import type { ProductListFilters } from '@salla.sa/twilight-theme-engine/api/product';
import { BlockHookSlot, BottomSheet } from '../common';
import { CategoryHero } from '../category/CategoryHero';
import { GalleryPage } from '../category/GalleryPage';
import { isGalleryCategory } from '../../lib/galleryPage';
import { TagGroupFilters } from './TagGroupFilters';
import { buildTagFilterGroups, filterProductsByTags, type TagFilterGroup } from '../../lib/tagGroupFilters';
import { useAppSafeAreaTop } from '../../hooks/useAppSafeAreaTop';
import { useProductCardLayout } from '../../hooks/useProductCardLayout';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { dispatchProductsFetched } from '../../lib/productsFetched';
import { FilterHorizontalIcon } from '../icons';

type View = 'grid' | 'list';

/** Salla's native filter widgets on listing pages (off, see `showFilters`). */
const NATIVE_FILTERS = false;

/** `ItemsList`'s `loader` for infinite scroll - the route already loaded the
 * first page, so this fetches subsequent ones from `pagination.next`, which
 * `parseNextPageToken` reads as either a bare cursor token or (sources
 * without true cursor pagination, e.g. `offers`) a full next-page URL. */
function useCatalogLoader(
  source: ProductListLoaderData['source'],
  selectedSort: string,
  next: string | null | undefined,
  filters: ProductListFilters | null
): ItemsLoaderFn<Product> {
  const nextCursorRef = useRef<string | null>(next ?? null);
  useEffect(() => {
    nextCursorRef.current = next ?? null;
  }, [next]);

  return useCallback(async () => {
    const { cursor, page } = parseNextPageToken(nextCursorRef.current);
    const result = await product.list({
      source: source.type,
      sourceValue: source.value,
      ...(cursor && { cursor }),
      ...(page !== undefined && { page }),
      sort: selectedSort,
      ...(filters && { filterable: true, filters }),
    });
    nextCursorRef.current = result.next;
    dispatchProductsFetched(result, source);
    return result;
  }, [source, selectedSort, filters]);
}

type BrandEntity = { name: string; banner?: string; logo?: string; description?: string };

/** Banner + logo + description above the listing, for a `/brands/{id}` page. Renders
 * nothing for any other source type. */
function BrandHeader({ source }: { source: ProductListLoaderData['source'] }) {
  if (source.type !== 'brands') return null;
  const brand = source.entity as BrandEntity | undefined;
  if (!brand) return null;

  return (
    <>
      <Image
        width={1200}
        height={300}
        className="w-full max-h-[300px] object-cover rounded bg-gray-100"
        src={brand.banner || undefined}
        alt={brand.name}
        priority
      />
      <header className="flex flex-col md:flex-row items-center md:items-start text-center rtl:md:text-right ltr:md:text-left mt-2 mb-8">
        <Image
          className="rounded w-40 h-24 object-contain shadow-md p-4 bg-white shrink-0"
          src={brand.logo || undefined}
          alt={brand.name}
          aspectRatio="5/3"
        />
        <div className="px-5 pt-3 rtl:text-right">
          <h2 className="text-2xl font-bold mb-1">{brand.name}</h2>
          {brand.description && (
            <p
              className="text-base text-gray-500 font-medium"
              dangerouslySetInnerHTML={{ __html: brand.description }}
            />
          )}
        </div>
      </header>
    </>
  );
}

/** The pinned site header's height on phones (`.site-header__bar.is-scrolled`,
 * `min-h-[56px]`); the toolbar pins below it. */
const PINNED_HEADER_PX = 56;

/**
 * On phones the toolbar pins under the pinned site header once it scrolls up
 * to it (or the top of the screen when the merchant turned the sticky header
 * off) (`is-stuck`), slides out of view while the page scrolls down and back in
 * when it scrolls up (`is-hidden`). In its own place on the page it never
 * hides. A zero-height sentinel above it tells when it is pinned, as in
 * `Header.tsx`. Styling: `04-components/product-list.scss`; desktop keeps the
 * plain toolbar.
 */
function MobileStickyToolbar({ children }: { children: ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Inside the Salla app the title bar sits below the status bar.
  const safeTop = useAppSafeAreaTop();
  const direction = useScrollDirection();
  const [stuck, setStuck] = useState(false);
  const { theme } = useTwilight();
  const headerPx = theme?.settings?.header_is_sticky !== false ? PINNED_HEADER_PX : 0;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    const top = safeTop + headerPx;
    const observer = new IntersectionObserver(
      // Out of view above the pin line, not below the fold.
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < top),
      { threshold: 0, rootMargin: `-${top}px 0px 0px 0px` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [safeTop, headerPx]);

  const className = [
    's-catalog-toolbar-sticky',
    stuck && 'is-stuck',
    stuck && direction === 'down' && 'is-hidden',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div
        className={className}
        style={{ top: `calc(var(--app-safe-area-top, 0px) + ${headerPx}px)` }}
      >
        {children}
      </div>
    </>
  );
}

/**
 * Phones only: the button that opens the filter sheet. The old toolbar (sort,
 * grid/list switch, desktop "hide filters") was removed at the owner's
 * request; from `md` up the filter column is always shown, so it needs none.
 */
function MobileFiltersButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <button type="button" onClick={onOpen} className="s-catalog-filters-button md:hidden">
      <span className="s-catalog-filters-button__icon" aria-hidden="true">
        <FilterHorizontalIcon />
      </span>
      {t('pages.categories.filters', 'Filters')}
    </button>
  );
}

/** The desktop filter column (when visible) + the product grid/list itself. */
function CatalogGrid({
  filtersVisible,
  showNativeFilters,
  filters,
  listKey,
  selectedSort,
  view,
  products,
  pagination,
  loader,
  listLayoutClass,
  wideGridClass,
  filterStatus,
  onRetry,
  isBrand,
  tagFilterGroups,
  selectedTagFilters,
  onToggleTagFilter,
  onClearTagFilters,
}: {
  /** A `/brands/{id}` page: also renders the Twig `brands:single.items.*` hooks. */
  isBrand: boolean;
  filterStatus: 'idle' | 'loading' | 'ready' | 'error';
  onRetry: () => void;
  filtersVisible: boolean;
  /** Native `<salla-filters>` itself — separate from `filtersVisible`, which also goes true from tag groups alone. */
  showNativeFilters: boolean;
  filters: ProductListLoaderData['filters'];
  listKey: string;
  selectedSort: string;
  view: View;
  products: Product[];
  pagination: ProductListLoaderData['pagination'];
  loader: ItemsLoaderFn<Product>;
  listLayoutClass: string;
  wideGridClass: string;
  /** Merchant "Group-Value" tag filters (06 §6) — native `<salla-filters>` can't express these. */
  tagFilterGroups: TagFilterGroup[];
  selectedTagFilters: string[];
  onToggleTagFilter: (key: string) => void;
  onClearTagFilters: () => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className={filtersVisible ? 'md:grid md:grid-cols-[288px_1fr] gap-8' : ''}>
      {filtersVisible && (
        <div className="hidden md:block lg:sticky lg:top-20 lg:self-start">
          {showNativeFilters && <SallaFilters id="filters-menu" filters={filters as never} />}
          <TagGroupFilters
            groups={tagFilterGroups}
            selected={selectedTagFilters}
            onToggle={onToggleTagFilter}
            onClear={onClearTagFilters}
          />
        </div>
      )}

      <div className="min-w-0">
        <HookSlot name="product:list.items.start" />
        {/* legacy name for the same point */}
        <HookSlot name="product:index.items.start" />
        {isBrand && <HookSlot name="brands:single.items.start" />}

        <div
          className={`flex min-h-screen${filterStatus === 'loading' ? ' opacity-60' : ''}`}
          aria-busy={filterStatus === 'loading'}
        >
          {filterStatus === 'error' ? (
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <NoContent
                icon="sicon-shopping-bag"
                message={t('common.errors.error_occurred', 'Something went wrong')}
              />
              <button
                type="button"
                data-testid="store-catalog-filters-retry"
                className="link--primary mt-4"
                onClick={onRetry}
              >
                {t('common.elements.try_again', 'Try again')}
              </button>
            </div>
          ) : (
            <ItemsList<Product>
              key={`${listKey}-${selectedSort}-${view}`}
              resetKey={`${listKey}-${selectedSort}-${view}`}
              items={products}
              loader={loader}
              mode={pagination?.next ? 'infinite' : 'static'}
              pageUrl={location.pathname + location.searchStr}
              className="s-products-list flex-1 min-w-0"
              itemsClassName={`s-products-list-wrapper ${listLayoutClass}${filtersVisible ? ' s-products-list-with-filters' : ''}${wideGridClass}`}
              skeleton={<ProductCardSkeleton />}
              skeletonType="item"
              skeletonCount={12}
              empty={
                <NoContent
                  icon="sicon-shopping-bag"
                  message={t('pages.categories.no_products', 'No products found in this category')}
                />
              }
              t={(key, fallback) => t(key, fallback || key)}
            >
              {(items) => {
                const visible =
                  selectedTagFilters.length > 0
                    ? filterProductsByTags(items, selectedTagFilters)
                    : items;
                if (visible.length === 0 && items.length > 0) {
                  return (
                    <NoContent
                      icon="sicon-shopping-bag"
                      message={t('blocks.catalog.no_match_filters', 'No products match these filters')}
                    />
                  );
                }
                return visible.map((prod, idx) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    index={idx}
                    layout={view === 'list' ? 'horizontal' : 'vertical'}
                  />
                ));
              }}
            </ItemsList>
          )}
        </div>

        {isBrand && <HookSlot name="brands:single.items.end" />}
        {/* legacy name for the same point */}
        <HookSlot name="product:index.items.end" />
        <HookSlot name="product:list.items.end" />
      </div>
    </div>
  );
}

/** The store-reviews block below the listing — categories only, and only when
 * the merchant has enabled it. */
function CategoryTestimonials({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    // `estimatedHeight="0"`: `RenderWhenVisible` hard-codes `min-height` on
    // its wrapper and never clears it, so an empty `salla-reviews` (no
    // category reviews) reserves 400px. It's collapsed by CSS when empty.
    <RenderWhenVisible estimatedHeight="0px" placeholder={<ReviewItemSkeleton />}>
      <Testimonials data={{}} />
    </RenderWhenVisible>
  );
}

/**
 * Theme fork of the engine `ProductListPage`, registered as `product:list-page`
 * in `app/router.tsx` for every product listing.
 *
 * The category picked in the `gallery_page_category` setting shows the gallery
 * page instead of a product list (`GalleryPage`, the Twig theme's gallery
 * mode). Every other listing gets {@link CatalogListPage}.
 */
export function ProductListPage(props: ProductListLoaderData) {
  const { theme } = useTwilight();
  const { source } = props;
  if (
    source.type === 'categories' &&
    isGalleryCategory(theme?.settings as Record<string, unknown> | undefined, source.value)
  ) {
    return (
      <GalleryPage
        key={source.value}
        category={source.entity as Category | undefined}
      />
    );
  }
  return <CatalogListPage {...props} />;
}

/**
 * The product list itself. Same data flow as upstream; the toolbar is rebuilt
 * as a pill with a product count, a grid / list view switch and a styled sort
 * control, plus a desktop "hide filters" toggle that collapses the filter
 * column. View + collapse state persist in `localStorage`. Upgrade notes: `FORKS.md`.
 */
function CatalogListPage({
  page,
  source,
  query,
  products,
  pagination,
  filters,
}: ProductListLoaderData) {
  const { t, locale } = useTranslation();
  const store = useStore();
  const { theme } = useTwilight();

  const category = source.type === 'categories' ? (source.entity as Category | undefined) : undefined;

  // Merchant "Group-Value" tag filters (06 §6: age range, color, skills…) — the
  // one thing native `<salla-filters>` can't do, since these are plain product
  // tags rather than a configured attribute. Built from the route's own loaded
  // page, so a store tagging in both scripts only shows the current locale's.
  const isArabicLocale = locale?.startsWith('ar') ?? true;
  const tagFilterGroups = useMemo(
    () => buildTagFilterGroups(products, isArabicLocale),
    [products, isArabicLocale]
  );
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const handleToggleTagFilter = useCallback((key: string) => {
    setSelectedTagFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);
  const handleClearTagFilters = useCallback(() => setSelectedTagFilters([]), []);

  const selectedSort = query.sort;
  const [filtersOpen, setFiltersOpen] = useState(false);
  // The merchant's card layout picks the view (there is no grid/list switch).
  const cardLayout = useProductCardLayout();
  const view: View = cardLayout === 'horizontal' ? 'list' : 'grid';

  // Salla's native `<salla-filters>` widgets are off at the owner's request
  // (23 Nov 2026): with their titles hidden they showed as empty white boxes.
  // Only the tag-group filter remains. Flip `NATIVE_FILTERS` to bring them back.
  const showFilters = NATIVE_FILTERS && !!(query.filters && store?.settings?.product?.filters);
  // The tag-group filter stands on its own feet: a store with native filters
  // disabled (or none configured for this list) should still see it.
  const showAnyFilters = showFilters || tagFilterGroups.length > 0;
  const filtersVisible = showAnyFilters;

  // The selection made in `<salla-filters>` — re-queries the list (the route's
  // loader output was fetched without it).
  const {
    filters: appliedFilters,
    page: filteredPage,
    lastPage,
    status: filterStatus,
    retry: retryFilters,
  } = useAppliedFilters(source, selectedSort, showFilters);
  // While a new selection loads, the previous page stays up (dimmed, `aria-busy`); if the
  // request fails nothing stale passes for the new selection. Infinite scroll is only live
  // for the loader's own page or a fully loaded filtered one.
  const shownPage = filterStatus === 'ready' ? filteredPage : lastPage;
  const shownProducts =
    filterStatus === 'error'
      ? []
      : filterStatus === 'idle'
        ? products
        : (shownPage?.items ?? products);
  const shownNext =
    filterStatus === 'idle'
      ? pagination?.next
      : filterStatus === 'ready'
        ? filteredPage?.next
        : null;
  const filteredKey =
    filterStatus === 'idle'
      ? ''
      : `${filterStatus}${filterStatus === 'ready' ? JSON.stringify(appliedFilters) : ''}`;

  // No API response carries a total (cursor pagination has none), so the only
  // honest count is: the tag filter's own match count once one is selected
  // (same page the tag filter itself can see), else the category's own static
  // total while nothing else is filtering — never a number next to an active
  // native filter, since there is nothing to show it from.
  const tagFilteredCount =
    selectedTagFilters.length > 0 ? filterProductsByTags(shownProducts, selectedTagFilters).length : null;
  const productCount =
    tagFilteredCount ??
    (source.type === 'categories' && filterStatus === 'idle' && typeof category?.products_count === 'number'
      ? category.products_count
      : null);

  const isBrand = source.type === 'brands';
  const isReorder = source.type === 'reorder';
  useReorderButtons(isReorder);

  useEffect(() => {
    const handleFiltersChanged = () => setFiltersOpen(false);
    return onSallaEvent('salla-filters::changed', handleFiltersChanged);
  }, []);

  const listKey = source.value ?? source.type;
  // Merchant blocks go on category pages only, as in Twig; offers, search and brands get none.
  const blockScope = useMemo(
    () =>
      source.type === 'categories' && source.value ? { category_id: source.value } : undefined,
    [source.type, source.value]
  );
  const loader = useCatalogLoader(source, selectedSort, shownNext, appliedFilters);

  const listLayoutClass =
    view === 'list' ? 's-products-list-horizontal-cards' : 's-products-list-vertical-cards';
  // Offers (and other filter-less lists) get the full row: 5 columns on desktop.
  const wideGridClass = !query.filters && view === 'grid' ? ' s-products-list-cols-5' : '';

  return (
    <div
      key={listKey}
      className="container px-2.5 mb-10"
      data-source={isReorder ? 'reorder' : undefined}
    >
      {theme?.settings?.product_index_show_breadcrumbs !== false && <Breadcrumb page={page} />}

      {/* Twig `brands/single.twig` hooks around the brand header, for apps that target them */}
      {isBrand && <HookSlot name="brands:single.details.start" context={{ brand: source.entity }} />}
      <BrandHeader source={source} />
      {isBrand && <HookSlot name="brands:single.details.end" context={{ brand: source.entity }} />}

      <HookSlot name="product:list.start" />

      {/* App-block hook `product.index.before_products_group_with_filter` — above the listing */}
      <BlockHookSlot
        name="product.index.before_products_group_with_filter"
        wrapper="s-before-products-list"
        className="!mt-0"
        scope={blockScope}
      />

      <CategoryHero category={category} />

      {/* h2: MobilePageTitleBar already renders this page's one real <h1> with
          the same title, always in the HTML — not just below `md` (SEO audit #2).
          On a brand page this sits under BrandHeader's own (now h2) heading. */}
      <h2 className="s-catalog-title" id="page-main-title">
        {isBrand ? t('common.titles.products') : page.title}
      </h2>

      {productCount !== null && (
        <p className="s-catalog-count text-sm text-gray-500 mb-4">
          {productCount} {t('blocks.catalog.products_count_label', 'products')}
        </p>
      )}

      {/* Phones: the Filters button, pinned under the header while scrolling up */}
      {showAnyFilters && (
        <MobileStickyToolbar>
          <MobileFiltersButton onOpen={() => setFiltersOpen(true)} />
        </MobileStickyToolbar>
      )}

      <CatalogGrid
        filtersVisible={filtersVisible}
        showNativeFilters={showFilters}
        filters={filters}
        listKey={`${listKey}${filteredKey}`}
        filterStatus={filterStatus}
        onRetry={retryFilters}
        isBrand={isBrand}
        selectedSort={selectedSort}
        view={view}
        products={shownProducts}
        pagination={{ next: shownNext ?? null }}
        loader={loader}
        listLayoutClass={listLayoutClass}
        wideGridClass={wideGridClass}
        tagFilterGroups={tagFilterGroups}
        selectedTagFilters={selectedTagFilters}
        onToggleTagFilter={handleToggleTagFilter}
        onClearTagFilters={handleClearTagFilters}
      />

      {/* App-block hook `product.index.after_products_group_with_filter` — below the listing */}
      <BlockHookSlot
        name="product.index.after_products_group_with_filter"
        wrapper="s-after-products-list"
        scope={blockScope}
      />

      {showAnyFilters && (
        <BottomSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title={t('pages.categories.filters', 'Filters')}
        >
          {showFilters && <SallaFilters id="filters-menu-mobile" filters={filters as never} />}
          <TagGroupFilters
            groups={tagFilterGroups}
            selected={selectedTagFilters}
            onToggle={handleToggleTagFilter}
            onClear={handleClearTagFilters}
          />
        </BottomSheet>
      )}

      <CategoryTestimonials
        enabled={source.type === 'categories' && !!store?.settings?.category?.testimonial_enabled}
      />

      {/* App-block hook `product.index.after_testimonials` — after the store-reviews block */}
      <BlockHookSlot
        name="product.index.after_testimonials"
        wrapper="s-after-testimonials"
        scope={blockScope}
      />

      <HookSlot name="product:list.end" />
    </div>
  );
}
