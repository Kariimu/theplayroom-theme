// app/lib/reviewSnippets.ts

/**
 * Quick reviews under the product page's payment list (the "snippets" strip
 * seen on akwan.me): one short review per slide, its photo, the reviewer's
 * name and stars, and a two-line quote; tapping it opens the whole review.
 *
 * Data: the same product reviews `<salla-comments>` lists, fetched through the
 * SDK call that component uses (`salla.api.comment.getComments`). Only good
 * reviews with text make a snippet.
 */

/** Reviews asked for, and the most snippets shown. */
export const SNIPPET_FETCH_COUNT = 20;
export const MAX_SNIPPETS = 10;

/** A review needs at least this many stars to be a snippet. */
export const MIN_SNIPPET_STARS = 4;

export interface ReviewSnippet {
  id: string;
  name: string;
  stars: number;
  /** The review text as plain text (the API sends HTML). */
  text: string;
  /** The first photo attached to the review, if any. */
  image?: string;
  /** The reviewer bought the product (Salla's "verified" tick). */
  verified: boolean;
  /** `d/m/yyyy`, as `<salla-comments>` shows it. */
  date?: string;
}

interface RawComment {
  id?: unknown;
  name?: unknown;
  rating?: unknown;
  stars?: unknown;
  content?: unknown;
  images?: unknown;
  has_order?: unknown;
  is_pending?: unknown;
  created_at?: { date?: unknown } | null;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** HTML to readable plain text: tags dropped, common entities decoded, spaces collapsed. */
export function plainText(html: string): string {
  return html
    // Line and block breaks become spaces, so words on either side stay apart.
    .replace(/<\/?(?:br|p|div|li|h[1-6])(?=[\s/>])[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A review photo is a URL, or an object carrying one. */
function imageUrl(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    const o = value as { url?: unknown; image?: unknown; src?: unknown };
    return text(o.url) || text(o.image) || text(o.src);
  }
  return '';
}

/** `2026-07-26 10:12:00` → `26/7/2026`. */
export function reviewDate(value: unknown): string | undefined {
  const match = text(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return undefined;
  const [, y, m, d] = match;
  return `${Number(d)}/${Number(m)}/${Number(y)}`;
}

/**
 * The snippets from a `getComments` response's `data`: approved reviews with
 * text and {@link MIN_SNIPPET_STARS}+ stars, in the API's order (latest
 * first), at most {@link MAX_SNIPPETS}.
 */
export function toReviewSnippets(data: unknown): ReviewSnippet[] {
  const list = Array.isArray(data) ? (data as RawComment[]) : [];
  const snippets: ReviewSnippet[] = [];
  for (const comment of list) {
    if (!comment || comment.is_pending) continue;
    const stars = Number(comment.rating || comment.stars) || 0;
    if (stars < MIN_SNIPPET_STARS) continue;
    const body = plainText(text(comment.content));
    if (!body) continue;
    const images = Array.isArray(comment.images) ? comment.images : [];
    const image = images.map(imageUrl).find(Boolean);
    const snippet: ReviewSnippet = {
      id: String(comment.id ?? snippets.length),
      name: text(comment.name),
      stars: Math.min(5, Math.round(stars)),
      text: body,
      verified: Boolean(comment.has_order),
    };
    if (image) snippet.image = image;
    const date = reviewDate(comment.created_at?.date);
    if (date) snippet.date = date;
    snippets.push(snippet);
    if (snippets.length >= MAX_SNIPPETS) break;
  }
  return snippets;
}

/** The reviewer's first letter, for the tile shown when a review has no photo. */
export function initial(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? '★';
}
