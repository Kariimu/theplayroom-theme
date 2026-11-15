import { lazy, Suspense, type ComponentType } from 'react';

/** Matches the engine's own `AnyHomeComponent` (`components/home/types.d.ts`) —
 *  every `registerHomeComponents` entry's prop shape, loosely typed there too. */
type HomeBlockProps = { data: any; priority?: boolean }; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Wraps a dynamically-imported home block so it can be passed straight to
 * `registerHomeComponents` (Stage 11 performance audit: every registered home
 * block was a static import in `app/router.tsx`, which every route pays for —
 * confirmed in the build's bundle analysis as a ~580KB "shared" chunk loaded on
 * every page, home block or not). The engine's own `HomeComponentRenderer`
 * renders the registered component directly, with no `<Suspense>` ancestor of
 * its own, so `React.lazy()` can't be registered by itself — this supplies the
 * boundary locally instead of forking the engine's renderer. `fallback={null}`:
 * the outer `LazyRenderWhenVisible` (engine) already reserves the block's
 * height via `registerHomeComponentConfig`, so there is nothing to reserve here.
 */
export function lazyHomeBlock(
  loader: () => Promise<{ default: ComponentType<any> }> // eslint-disable-line @typescript-eslint/no-explicit-any
): ComponentType<HomeBlockProps> {
  const LazyComponent = lazy(loader);
  return function LazyHomeBlock(props: HomeBlockProps) {
    return (
      <Suspense fallback={null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
