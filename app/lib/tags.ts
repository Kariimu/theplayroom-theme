// app/lib/tags.ts
/**
 * The single source of truth for product-tag conventions in this theme.
 *
 * The old Twig theme drove several behaviours from theme settings that listed
 * product ids (WhatsApp categories, cart upsell, feature badges, image cards,
 * "suggested games"). Per docs/MIGRATION-PLAN.md §5A those move onto the product
 * itself as tags, so the card and product page read one product's own tags
 * instead of a store-wide crawl. Keep every convention here; nothing else in the
 * theme should hard-code a tag string.
 */

/** Whole-tag literals, matched case-insensitively against the trimmed tag name. */
export const TAG = {
  /** Buy button becomes a WhatsApp enquiry instead of add-to-cart (06 §2, replaces `categories_whatsapp`). */
  whatsapp: 'whatsapp',
  /** Product shows in the cart upsell slider (replaces `products_in_cart`). */
  cartUpsell: 'cart-upsell',
} as const;

/** `<prefix><key>` tags. The key selects an entry in a code-side library. */
export const TAG_PREFIX = {
  /** Feature badge; key → app/lib/features.ts (replaces `special_features`). */
  feature: 'feature:',
  /** Image card; key → card library (replaces `slider_in_products`). */
  card: 'card:',
  /** Companion "set"; products sharing a set are suggested together (replaces `products_play_games`). */
  set: 'set:',
} as const;

export type TagPrefix = keyof typeof TAG_PREFIX;

/** A tag as the engine's `product.tags` object, or a plain string. */
type TagLike = string | { name?: string | null } | null | undefined;

/** Tag names as trimmed, non-empty strings, from engine tag objects or a string list. */
export function tagNames(tags: readonly TagLike[] | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .map((t) => (typeof t === 'string' ? t : (t?.name ?? '')))
    .map((s) => s.trim())
    .filter(Boolean);
}

const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Whether a tag list contains a whole-tag literal (case-insensitive). */
export function hasTag(tags: readonly TagLike[] | null | undefined, literal: string): boolean {
  return tagNames(tags).some((name) => eq(name, literal));
}

/** Buy button is a WhatsApp enquiry for this product (06 §2). */
export const isWhatsappProduct = (tags: readonly TagLike[] | null | undefined) =>
  hasTag(tags, TAG.whatsapp);

/** Product belongs in the cart upsell slider. */
export const isCartUpsellProduct = (tags: readonly TagLike[] | null | undefined) =>
  hasTag(tags, TAG.cartUpsell);

/** The keys of every `<prefix><key>` tag, in order (trimmed; prefix match is case-insensitive). */
export function prefixedTagKeys(
  tags: readonly TagLike[] | null | undefined,
  prefix: TagPrefix
): string[] {
  const p = TAG_PREFIX[prefix];
  return tagNames(tags)
    .filter((name) => name.toLowerCase().startsWith(p))
    .map((name) => name.slice(p.length).trim())
    .filter(Boolean);
}

/**
 * A merchant filter tag `"<group>-<value>"` (06 §6), split on the first hyphen
 * so a value keeps its own hyphens (`"Age Range-7 months - 5 years"` → group
 * `"Age Range"`, value `"7 months - 5 years"`). Returns null when there is no
 * real group/value split.
 */
export function parseGroupValueTag(tag: string): { group: string; value: string } | null {
  const name = tag.trim();
  const dash = name.indexOf('-');
  if (dash <= 0 || dash >= name.length - 1) return null;
  const group = name.slice(0, dash).trim();
  const value = name.slice(dash + 1).trim();
  if (!group || !value) return null;
  return { group, value };
}

/**
 * Dev-only guard: warn once per unknown `<prefix><key>` tag whose key is not in
 * the code library, so a mistyped `feature:` / `card:` / `set:` tag is caught in
 * the editor instead of silently rendering nothing (MIGRATION-PLAN §8). No-op in
 * production builds.
 */
const warned = new Set<string>();
export function warnUnknownTagKey(prefix: TagPrefix, key: string, known: Iterable<string>): void {
  if (!import.meta.env?.DEV) return;
  const set = known instanceof Set ? known : new Set(known);
  if (set.has(key)) return;
  const id = `${prefix}:${key}`;
  if (warned.has(id)) return;
  warned.add(id);
  console.warn(
    `[theme] unknown ${TAG_PREFIX[prefix]}${key} tag — no "${key}" in the ${prefix} library`
  );
}
