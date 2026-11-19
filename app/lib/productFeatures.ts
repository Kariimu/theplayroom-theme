// app/lib/productFeatures.ts
import { queryOptions } from '@tanstack/react-query';
import { blog } from '@salla.sa/twilight-theme-engine/api/blog';
import { prefixedTagKeys } from './tags';
import { matchesName } from './specs';

/**
 * Per-product features (MIGRATION-PLAN §5A row 69, owner decision 19 Nov 2026):
 * the feature *library* lives in the store's own blog, so the merchant edits it
 * in the dashboard's Blog screen (title in both languages, an image as the icon,
 * an explainer as the article body) and never in theme code or the theme editor.
 *
 * - Library: every article in the blog category named one of
 *   {@link FEATURES_BLOG_CATEGORY_NAMES}. An article's key is its own blog tag
 *   `feature-<key>`.
 * - Assignment: the product carries the identical tag `feature-<key>`.
 *
 * Read on the server in the product route loader, so the titles and links are
 * in the SSR HTML. The library is only fetched for a product that carries at
 * least one `feature-` tag.
 */

/** The blog category that holds the feature articles, by its exact name in either language. */
export const FEATURES_BLOG_CATEGORY_NAMES = ['مميزات ألعابنا', 'Our toy features'] as const;

/** At most this many features show on one product (the old `special_features` cap). */
export const MAX_PRODUCT_FEATURES = 4;

/** A pagination guard: the library is a short list, never a whole blog. */
const MAX_LIBRARY_PAGES = 3;

export interface ProductFeature {
  key: string;
  title: string;
  image?: string;
  url?: string;
}

type TagLike = string | { name?: string | null } | null | undefined;

interface ArticleLike {
  name?: string | null;
  image?: string | null;
  url?: string | null;
  tags?: readonly TagLike[] | null;
}

const lower = (value: string) => value.trim().toLowerCase();

/** The `feature-<key>` key of one blog article (its first such tag), lower-cased, or null. */
export function articleFeatureKey(article: ArticleLike): string | null {
  const key = prefixedTagKeys(article.tags, 'feature')[0];
  return key ? lower(key) : null;
}

/** The product's own feature keys, lower-cased and de-duplicated, in tag order. */
export function productFeatureKeys(tags: readonly TagLike[] | null | undefined): string[] {
  return [...new Set(prefixedTagKeys(tags, 'feature').map(lower))];
}

/** Whether the product carries any `feature-` tag (decides if the library is fetched at all). */
export function hasFeatureTags(tags: readonly TagLike[] | null | undefined): boolean {
  return productFeatureKeys(tags).length > 0;
}

/** Library articles reduced to `{ key, title, image, url }`; the first article wins a duplicate key. */
export function toFeatureLibrary(articles: readonly ArticleLike[] | null | undefined): ProductFeature[] {
  const seen = new Set<string>();
  const library: ProductFeature[] = [];
  for (const article of articles ?? []) {
    const key = articleFeatureKey(article);
    const title = article.name?.trim();
    if (!key || !title || seen.has(key)) continue;
    seen.add(key);
    library.push({
      key,
      title,
      image: article.image?.trim() || undefined,
      url: article.url?.trim() || undefined,
    });
  }
  return library;
}

/**
 * The product's features, in the product's tag order, capped at
 * {@link MAX_PRODUCT_FEATURES}. A key with no library article is skipped.
 */
export function resolveProductFeatures(
  tags: readonly TagLike[] | null | undefined,
  library: readonly ProductFeature[] | null | undefined
): ProductFeature[] {
  if (!library?.length) return [];
  const byKey = new Map(library.map((feature) => [feature.key, feature]));
  return productFeatureKeys(tags)
    .map((key) => byKey.get(key))
    .filter((feature): feature is ProductFeature => !!feature)
    .slice(0, MAX_PRODUCT_FEATURES);
}

/** Every article in the features category (follows the cursor up to {@link MAX_LIBRARY_PAGES} pages). */
async function fetchFeatureLibrary(signal?: AbortSignal): Promise<ProductFeature[]> {
  const overview = await blog.get(signal);
  const category = overview.categories.find((c) => matchesName(c.name, FEATURES_BLOG_CATEGORY_NAMES));
  if (!category) return [];

  const articles: ArticleLike[] = [];
  let cursor: string | null | undefined;
  for (let page = 0; page < MAX_LIBRARY_PAGES; page++) {
    const response = await blog.articles.list({ category: String(category.id), cursor, signal });
    articles.push(...response.data);
    cursor = response.cursor?.next;
    if (!cursor) break;
  }
  return toFeatureLibrary(articles);
}

export const productFeatures = {
  queries: {
    /** Keyed by locale: the article titles come back in the request's language. */
    library: (locale: string | undefined) =>
      queryOptions({
        queryKey: ['theme', 'product-features', 'library', locale ?? ''],
        queryFn: ({ signal }) => fetchFeatureLibrary(signal),
        staleTime: 5 * 60 * 1000,
      }),
  },
};
