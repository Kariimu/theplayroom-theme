import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@salla.sa/twilight-theme-engine/routes/home';
import type { HomeLoaderData } from '@salla.sa/twilight-theme-engine/routes/home';
import { HomeSkeleton } from '@salla.sa/twilight-theme-engine/skeleton';
import { withHead } from '@salla.sa/twilight-theme-engine/tanstack';
import { storePageUrl } from '@salla.sa/twilight-theme-engine/utils/baseHead';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { buildHomeJsonLd } from '../lib/homeJsonLd';

/**
 * Home (index) route — forked from the engine default (`/recipes/fork-a-built-in-route`)
 * to add what it doesn't emit for the homepage: an `<h1>` (SEO audit #1/#4) and
 * Organization/WebSite/WebPage/FAQPage JSON-LD (#9–#12). Loader and component stay the
 * engine's own; only `head` is extended and a heading is added around `Home.Component`.
 */
export const Route = createFileRoute('/{-$locale}/')({
  loader: ({ params }): Promise<HomeLoaderData> => Home.loader({ locale: params.locale }),
  head: withHead<HomeLoaderData>(Home, (result, ctx, data) => {
    const canonicalUrl = result.canonical ?? storePageUrl(ctx.settings, ctx.location.pathname);
    const existing = Array.isArray(result.jsonLd)
      ? result.jsonLd
      : result.jsonLd
        ? [result.jsonLd]
        : [];
    return {
      ...result,
      jsonLd: [...existing, ...buildHomeJsonLd(ctx, data, canonicalUrl)],
    };
  }),
  pendingComponent: () => <HomeSkeleton />,
  component: HomeComponent,
});

/**
 * Home page component. Uses Route.useLoaderData() to access the data loaded by the
 * route loader, following React best practices for data fetching in route components.
 */
function HomeComponent() {
  const data: HomeLoaderData = Route.useLoaderData();
  const { t } = useTranslation();
  return (
    <>
      {/* Visually hidden: the home blocks already carry the page's visible heading
          hierarchy, matched to the reference design's look. One real `<h1>` per page
          (SEO audit #1/#4) without changing anything on screen — an owner call to make
          it a visible heading instead is open. */}
      <h1 className="sr-only">
        {t('pages.home.h1', 'متجر ألعاب أطفال خشبية وتعليمية في السعودية')}
      </h1>
      <Home.Component {...data} />
    </>
  );
}
