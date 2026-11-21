// app/lib/productInfo.ts
import {
  FACTS_SECTION_NAMES,
  METADATA_GROUPS,
  matchesName,
  type MetadataGroupKey,
  type SpecField,
  type SpecSection,
} from './specs';

/**
 * The product page's four product-info sections (reference: the avenlur.com
 * product page): Product Details, Specifications, Assembly, Shipping &
 * Returns. The merchant keeps their custom-field groups as they are in the
 * dashboard; the theme only decides which section each group shows in.
 */
export const INFO_SECTIONS = ['details', 'specs', 'assembly', 'shipping'] as const;
export type InfoSectionKey = (typeof INFO_SECTIONS)[number];

/** Which section each known custom-field group (`METADATA_GROUPS`) belongs to. */
const GROUP_SECTION: Record<MetadataGroupKey, InfoSectionKey> = {
  features: 'details',
  uses: 'details',
  installationGuide: 'assembly',
  installationService: 'assembly',
  shipping: 'shipping',
  returnExchange: 'shipping',
  note: 'specs',
};

export interface InfoGroup {
  /** The group's name as the merchant typed it (shown as a sub-heading). */
  name: string;
  /** The for-who / material / box-contents group: shown as rows, no sub-heading. */
  isFacts: boolean;
  fields: SpecField[];
}

export type ProductInfoGroups = Record<InfoSectionKey, InfoGroup[]>;

/**
 * Sorts the product's custom-field groups into the four sections.
 *
 *  · facts group (`FACTS_SECTION_NAMES`) → Specifications, first
 *  · a known group → its section in `GROUP_SECTION`, in `METADATA_GROUPS` order
 *  · any other group → Specifications, after the known ones, in the
 *    merchant's own order, so a group added later still shows
 *
 * Fields with no value are dropped, and a group left with no fields is
 * dropped with them.
 */
export function groupProductInfo(sections: readonly SpecSection[] | null | undefined): ProductInfoGroups {
  const ranked: Array<{ section: InfoSectionKey; rank: number; index: number; group: InfoGroup }> = [];

  (sections ?? []).forEach((section, index) => {
    const fields = (section?.fields ?? []).filter((field) => field?.value?.trim());
    if (!fields.length) return;
    const name = section.name?.trim() ?? '';

    if (matchesName(name, FACTS_SECTION_NAMES)) {
      ranked.push({ section: 'specs', rank: -1, index, group: { name, isFacts: true, fields } });
      return;
    }
    const known = METADATA_GROUPS.findIndex((group) => matchesName(name, group.names));
    ranked.push({
      section: known >= 0 ? GROUP_SECTION[METADATA_GROUPS[known].key] : 'specs',
      rank: known >= 0 ? known : METADATA_GROUPS.length,
      index,
      group: { name, isFacts: false, fields },
    });
  });

  ranked.sort((a, b) => a.rank - b.rank || a.index - b.index);

  const result: ProductInfoGroups = { details: [], specs: [], assembly: [], shipping: [] };
  for (const entry of ranked) result[entry.section].push(entry.group);
  return result;
}

/**
 * Whether the description has anything to show: text, an image or an
 * embed. The editor often leaves an empty `<p>&nbsp;</p>`, which would
 * otherwise open "Product Details" onto a blank gap.
 */
export function hasDescriptionContent(html: string | null | undefined): boolean {
  if (!html) return false;
  if (/<(img|iframe|video|object|embed)\b/i.test(html)) return true;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .trim();
  return text.length > 0;
}

/**
 * A field with no real label: the store's "features" / "uses" groups name
 * their single text field "." and keep the text in its value (Phase 0).
 */
export const isUnlabeledField = (field: SpecField) => /^[\s.\-–—_:،]*$/.test(field.name ?? '');

/**
 * The URL to link to, for a `file` field (its value is the file URL) or a
 * text value that is just a web address. Only `http(s)` is accepted, so a
 * merchant-typed value can never become a `javascript:` link.
 */
export function fieldLinkUrl(field: SpecField): string | undefined {
  const value = field.value?.trim() ?? '';
  if (!/^https?:\/\/\S+$/i.test(value)) return undefined;
  return value;
}
