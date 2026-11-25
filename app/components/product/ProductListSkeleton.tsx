import { FiltersSkeleton, Pulse, ProductsListSkeleton } from '@salla.sa/twilight-components-react';

/**
 * `pendingComponent` for the product-listing / offers routes.
 *
 * Without one, TanStack Router blanks the whole route match on every
 * search-param-driven reload — a sort change, a page change, a filter apply —
 * since a route with no `pendingComponent` renders `null` while its loader
 * re-runs (`Match.js` → `renderPending`).
 *
 * Every element above the list is built from the *exact* production
 * markup/classes, with a `Pulse` standing in only for the text/content, so
 * each one reserves the same box it does in the real page and nothing
 * shifts once the real content arrives:
 *  - the breadcrumb uses `.breadcrumbs` / `.s-breadcrumb-wrapper`
 *    (`04-components/breadcrumb.scss`) — a full-bleed tinted bar the vendor's
 *    generic `BreadcrumbSkeleton` doesn't match at all (wrong width, wrong
 *    padding, no background), which was the actual source of the jump;
 *  - the title uses `.s-catalog-title`, matching its line-height.
 * The phones-only Filters bar is rendered empty with its production class,
 * whose own min-height fixes its height (it has no height from `md` up).
 */
export function ProductListSkeleton({ hideFilters = false }: { hideFilters?: boolean }) {
  return (
    <div className="container px-2.5 mb-10">
      <nav className="breadcrumbs w-full py-5" aria-hidden="true">
        <ol className="s-breadcrumb-wrapper">
          <Pulse className="h-4 w-64" />
        </ol>
      </nav>

      <h2 className="s-catalog-title">
        <Pulse className="h-9 w-56" />
      </h2>

      {!hideFilters && <div className="s-catalog-toolbar-sticky" aria-hidden="true" />}

      <div className={hideFilters ? '' : 'md:grid md:grid-cols-[288px_1fr] gap-8'}>
        {!hideFilters && <FiltersSkeleton className="hidden md:block" />}
        <ProductsListSkeleton count={hideFilters ? 10 : 12} columns={hideFilters ? 5 : 3} />
      </div>
    </div>
  );
}
