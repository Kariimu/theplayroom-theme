// app/lib/productUsageGallery.ts
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import { prefixedTagKeys } from './tags';
import { findHomeBlock } from './homeBlocks';

/**
 * Product in-use gallery (replaces the legacy `slider_in_products` card slider,
 * MIGRATION-PLAN §5A row 70): photos of the product in use, each with a title
 * and a short description, shown on the product page above the universal
 * features.
 *
 * Data lives in the D2 pattern, like the FAQ: the `product-usage-gallery` home
 * block holds every card (image, title AR/EN, description AR/EN, group key), so
 * the owner edits it in the dashboard's theme customizer. A product shows the
 * cards whose key matches one of its `inuse-<key>` tags. The block arrives
 * with `home.queries.components()`, which the product route loader already
 * fetches for the FAQ, so this costs no extra request and is server-rendered.
 * The block draws nothing on the home page itself (`app/router.tsx`).
 */

/** The block's `path` as the engine reports it (`twilight.json` has `home.` in front). */
export const USAGE_GALLERY_PATH = 'product-usage-gallery';

/** At most this many cards show on one product. */
export const MAX_USAGE_CARDS = 8;

export interface UsageCard {
  image: string;
  title: string;
  desc?: string;
}

export interface UsageGallery {
  /** The section heading from the block, or undefined to use the locale fallback. */
  title?: string;
  cards: UsageCard[];
}

interface RawUsageItem {
  image?: unknown;
  title?: unknown;
  desc?: unknown;
  key?: unknown;
}

type TagLike = string | { name?: string | null } | null | undefined;

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** An image field is a URL string; tolerate an `{ url }` object too. */
function imageUrl(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && 'url' in value) return text((value as { url?: unknown }).url);
  return '';
}

/** A group key as matched against `inuse-<key>` tags: trimmed, lower-cased. */
export const normalizeUsageKey = (value: unknown) => text(value).toLowerCase();

/**
 * This product's in-use cards, in the block's own order (the owner sorts them
 * in the customizer), capped at {@link MAX_USAGE_CARDS}. A card needs an image,
 * a title and a key that matches one of the product's `inuse-` tags.
 */
export function resolveUsageGallery(
  components: readonly HomeComponentData[] | null | undefined,
  tags: readonly TagLike[] | null | undefined
): UsageGallery {
  const keys = new Set(prefixedTagKeys(tags, 'inUse').map((key) => key.toLowerCase()));
  if (!keys.size) return { cards: [] };

  const data = (findHomeBlock(components, USAGE_GALLERY_PATH) ?? {}) as {
    title_section?: unknown;
    items?: unknown;
  };
  const items = Array.isArray(data.items) ? (data.items as RawUsageItem[]) : [];

  const cards: UsageCard[] = [];
  for (const item of items) {
    if (!keys.has(normalizeUsageKey(item?.key))) continue;
    const image = imageUrl(item.image);
    const title = text(item.title);
    if (!image || !title) continue;
    const desc = text(item.desc);
    cards.push(desc ? { image, title, desc } : { image, title });
    if (cards.length >= MAX_USAGE_CARDS) break;
  }

  return { title: text(data.title_section) || undefined, cards };
}
