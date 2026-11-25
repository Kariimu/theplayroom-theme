// app/lib/tagGroupFilters.ts
/**
 * Client-side "Group-Value" tag filters (docs/legacy/06-custom-features.md §6,
 * ported from the old theme's `products.js`): a merchant tags products
 * `"<Group>-<Value>"` (e.g. `"Age Range-7 months - 5 years"`,
 * `"الفئة العمرية-١-٣ سنوات"`) to get a filter native `<salla-filters>` can't
 * offer, since it isn't a configured product attribute. Split on the first
 * hyphen so the value keeps any hyphens of its own.
 *
 * Client-side only: it narrows whatever page of products is already loaded,
 * same limitation the old theme had (docs/MIGRATION-PLAN.md row 7).
 */
import { TAG, TAG_PREFIX, parseGroupValueTag, tagNames } from './tags';
import type { Product } from '@salla.sa/twilight-theme-engine/types';

export interface TagFilterOption {
  /** The exact tag name; passed back by the UI to select/match this option. */
  key: string;
  /** The value half of the tag, for display. */
  label: string;
}

export interface TagFilterGroup {
  /** The group half of the tag, for display (original casing). */
  group: string;
  options: TagFilterOption[];
}

const RESERVED_PREFIXES = Object.values(TAG_PREFIX).map((p) => p.toLowerCase());
const RESERVED_LITERALS = Object.values(TAG).map((literal) => literal.toLowerCase());

/** Collapses internal whitespace runs and case, so near-duplicate merchant tags compare equal. */
function normalizeTag(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

const ARABIC_RANGE = new RegExp('[' + String.fromCharCode(0x0600) + '-' + String.fromCharCode(0x06ff) + ']');

function isArabicText(value: string): boolean {
  return ARABIC_RANGE.test(value);
}

/** This theme's own convention tags (`app/lib/tags.ts`) are never a merchant filter group. */
function isConventionTag(name: string): boolean {
  const lower = name.toLowerCase();
  if (RESERVED_LITERALS.includes(lower)) return true;
  return RESERVED_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * The Group-Value filter groups found on `products`, limited to tags whose
 * group name matches `isArabicLocale`'s script — a store tagging in both
 * languages would otherwise show both at once, same as the old theme.
 */
export function buildTagFilterGroups(
  products: readonly Pick<Product, 'tags'>[],
  isArabicLocale: boolean
): TagFilterGroup[] {
  const groups = new Map<string, { group: string; options: Map<string, TagFilterOption> }>();

  for (const product of products) {
    for (const name of tagNames(product.tags)) {
      if (isConventionTag(name)) continue;
      const parsed = parseGroupValueTag(name);
      if (!parsed) continue;
      if (isArabicText(parsed.group) !== isArabicLocale) continue;

      const groupKey = normalizeTag(parsed.group);
      let entry = groups.get(groupKey);
      if (!entry) {
        entry = { group: parsed.group, options: new Map() };
        groups.set(groupKey, entry);
      }

      const optionKey = normalizeTag(name);
      if (!entry.options.has(optionKey)) {
        entry.options.set(optionKey, { key: name, label: parsed.value });
      }
    }
  }

  return Array.from(groups.values(), ({ group, options }) => ({
    group,
    options: Array.from(options.values()),
  }));
}

/**
 * `products` whose tags include every tag in `selected` (AND across groups,
 * same as the old theme). Comparison is whitespace/case-normalized so a
 * doubled space in a merchant tag doesn't break the match.
 */
export function filterProductsByTags<T extends Pick<Product, 'tags'>>(
  products: readonly T[],
  selected: readonly string[]
): T[] {
  if (selected.length === 0) return products as T[];
  const wanted = selected.map(normalizeTag);
  return products.filter((product) => {
    const names = tagNames(product.tags).map(normalizeTag);
    return wanted.every((key) => names.includes(key));
  });
}
