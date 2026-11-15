import type { TwilightContext } from '@salla.sa/twilight-theme-engine/tanstack';
import type { HomeLoaderData } from '@salla.sa/twilight-theme-engine/routes/home';
import { buildFaqJsonLd } from './faqJsonLd';

/** The store's own English name (`store.name` is the Arabic one the merchant typed). */
const ALTERNATE_NAME = 'The Playroom';

/**
 * Organization, WebSite, WebPage and (when the FAQ block is actually on the page) FAQPage
 * JSON-LD for the homepage — none of this is emitted by the engine itself (SEO audit
 * tickets #9–#12). Built from `StoreContext` rather than hard-coded values, so it tracks
 * the merchant's actual name/logo/social links and the FAQ block's actual dashboard
 * content instead of drifting from them.
 */
export function buildHomeJsonLd(
  ctx: TwilightContext,
  data: HomeLoaderData,
  canonicalUrl: string | undefined
): Record<string, unknown>[] {
  const store = ctx.settings?.store;
  if (!store?.url) return [];

  const origin = new URL(store.url).origin;
  const siteUrl = `${origin}/`;
  const organizationId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;
  const pageUrl = canonicalUrl ?? siteUrl;

  const sameAs = Object.values(store.social ?? {}).filter(
    (value): value is string => typeof value === 'string' && value.trim() !== ''
  );

  const jsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': organizationId,
      name: store.name,
      alternateName: ALTERNATE_NAME,
      url: store.url,
      logo: store.logo,
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': websiteId,
      name: store.name,
      alternateName: ALTERNATE_NAME,
      url: siteUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      name: store.meta?.title || store.name,
      description: store.meta?.description || store.description,
      url: pageUrl,
      inLanguage: ctx.locale,
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId },
    },
  ];

  const faq = buildFaqJsonLd(data.components, ctx.locale, pageUrl);
  if (faq) jsonLd.push(faq);

  return jsonLd;
}
