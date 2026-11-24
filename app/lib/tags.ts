// app/lib/tags.ts
/**
 * The single source of truth for product-tag conventions in this theme.
 *
 * The old Twig theme drove several behaviours from theme settings that listed
 * product ids (WhatsApp categories, cart upsell, feature badges, in-use cards,
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
  /**
   * Feature badge (replaces `special_features`); key → the blog article in the
   * features category carrying the same `feature-<key>` blog tag
   * (`app/lib/productFeatures.ts`). Hyphen, not colon: Salla rejects colons in
   * tag names (see `addOn` below).
   */
  feature: 'feature-',
  /**
   * In-use gallery group (replaces `slider_in_products`); key → the cards with
   * the same group key in the `product-usage-gallery` home block
   * (`app/lib/productUsageGallery.ts`). Hyphen, not colon: Salla rejects colons
   * in tag names (see `addOn` below).
   */
  inUse: 'inuse-',
  /**
   * Product FAQ group (replaces the per-product `products_questions` rows);
   * key → the questions with the same group key in the `product-faq` home
   * block (`app/lib/productFaq.ts`). Hyphen, not colon (Salla rejects colons).
   */
  faq: 'faq-',
  /** Companion "set"; products sharing a set are suggested together (replaces `products_play_games`). */
  set: 'set:',
  /**
   * Add-on group, keyed by the *master* product's own numeric id
   * (`addons-p<id>`, e.g. `addons-p1571449334`) rather than a merchant-picked
   * name — directional, not a shared/symmetric group: tag the master product
   * and every accessory with the identical `addons-p<masterId>` tag, and only
   * the product whose own id matches the key (the master) lists the group's
   * other members (`ProductAddOns`). An accessory carrying the same tag
   * renders nothing on its own page. No colon (Salla's tag-name validation
   * rejects it — `product::order.errors.tag_name_regex`); `set:` above has the
   * same colon and hasn't been verified against a real store yet.
   */
  addOn: 'addons-p',
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
 * The numeric tag id from a tag page URL (`…/tag-1143764859` → `1143764859`), or
 * null. Tag objects carry `{ name, url }` with **no id field** (Phase 0 §2), yet
 * listing a product's companions by tag needs the numeric id
 * (`product.list({ source: 'tags', sourceValue })` takes a number). On list
 * responses `url` can be null — then there is no id to list by.
 */
export function tagIdFromUrl(url: string | null | undefined): number | null {
  const match = (url ?? '').match(/tag-(\d+)(?:[/?#]|$)/);
  return match ? Number(match[1]) : null;
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

