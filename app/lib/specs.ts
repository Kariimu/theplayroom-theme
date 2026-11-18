// app/lib/specs.ts
/**
 * Product specs (`product.has_metadata`) are client-only (docs/MIGRATION-PLAN.md
 * §5B) and section/field names are free text the merchant types in the
 * dashboard. The generic accordion (`ProductMetadata`) renders whichever
 * groups exist, whatever they're named. This one group gets a *second*,
 * purpose-built rendering on top of that — the "facts" row (`ProductFacts`)
 * — so Stage 7 data entry must use these names verbatim; anything else
 * still shows in the generic accordion, just not in the dedicated UI.
 */

export interface SpecField {
  name?: string;
  type?: string;
  value?: string;
}

export interface SpecSection {
  name?: string;
  fields?: SpecField[];
}

/** §5A row 65: "one group (e.g. 'تفاصيل المنتج') with three fields". */
export const FACTS_SECTION_NAMES = ['تفاصيل المنتج', 'Product Details'] as const;

/** `for_who` / `material` / `inner_box` (§5A row 65), by their canonical field label. */
export const FACTS_FIELD_NAMES = {
  forWho: ['مناسب لـ', 'Suitable for'],
  material: ['الخامة', 'Material'],
  boxContents: ['محتويات الصندوق', 'Box contents'],
} as const;

export type FactKey = keyof typeof FACTS_FIELD_NAMES;

/**
 * The generic specs accordion's (`ProductMetadata`) other groups, in the
 * fixed display order the storefront enforces — the merchant/dashboard's own
 * group order isn't under our control, only the storefront rendering is.
 * Names are the exact live group headers (both locales, theplayroom.sa), not
 * invented labels — a group with none of these names keeps its original
 * position, appended after every known group.
 */
export const METADATA_GROUPS = [
  { key: 'features', names: ['مميزات المنتج', 'Product Features'] },
  { key: 'uses', names: ['إستخدامات المنتج', 'Product Uses'] },
  { key: 'installationGuide', names: ['دليل التركيب', 'Installation Guide'] },
  { key: 'installationService', names: ['خدمة التركيب', 'Installation Service'] },
  { key: 'shipping', names: ['تفاصيل الشحن', 'Shipping Details'] },
  { key: 'returnExchange', names: ['آلية الإسترجاع و الإستبدال', 'Return & Exchange Policy'] },
  { key: 'note', names: ['ملاحظة', 'Note'] },
] as const satisfies ReadonlyArray<{ key: string; names: readonly string[] }>;

export type MetadataGroupKey = (typeof METADATA_GROUPS)[number]['key'];

const normalize = (value: string) => value.trim().toLowerCase();

/** Case/whitespace-insensitive match against a list of candidate names. */
export function matchesName(name: string | undefined, candidates: readonly string[]): boolean {
  if (!name?.trim()) return false;
  const normalized = normalize(name);
  return candidates.some((candidate) => normalize(candidate) === normalized);
}

/** The first section whose name matches one of `candidates`. */
export function findSection(
  sections: readonly SpecSection[] | undefined,
  candidates: readonly string[]
): SpecSection | undefined {
  return sections?.find((section) => matchesName(section.name, candidates));
}

/** `for_who` / `material` / `inner_box`, read from the facts section's fields by their canonical label. */
export function extractFacts(section: SpecSection | undefined): Partial<Record<FactKey, string>> {
  const facts: Partial<Record<FactKey, string>> = {};
  for (const field of section?.fields ?? []) {
    const value = field.value?.trim();
    if (!value) continue;
    for (const key of Object.keys(FACTS_FIELD_NAMES) as FactKey[]) {
      if (matchesName(field.name, FACTS_FIELD_NAMES[key])) facts[key] = value;
    }
  }
  return facts;
}

/**
 * Splits a metadata value into list items on a newline or `|`. Salla's
 * metadata field is single-line `type: "text"` — a merchant can't type an
 * actual newline into the dashboard, so `|` is the separator documented in
 * `docs/DATA-ENTRY.md` for a field meant to read as a list (box contents,
 * installation steps, etc.). `\n` is also accepted in case a value ever
 * arrives with one (e.g. pasted from elsewhere) — it just can't be typed.
 * A value with neither character returns a single-item array, so callers
 * can use this unconditionally instead of branching on "is this a list".
 */
export function splitListValue(value: string): string[] {
  return value
    .split(/\n|\|/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * `Salla.metadata.fetchValues(entity, ids)` (sdk/metadata.md) resolves to
 * `{ data }` whose exact shape for a single id isn't documented beyond the
 * `{ sections: [...] }` payload PHASE-0-FINDINGS confirmed for the web
 * component. Handles every shape that single `data` could plausibly take for
 * one id: the sections payload itself, an array of per-entity results, or an
 * id-keyed map — so a shape this wasn't written for degrades to "no facts"
 * instead of throwing.
 */
export function sectionsFromMetadataValues(data: unknown, entityId: number | string): SpecSection[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;

  if (Array.isArray(record.sections)) return record.sections as SpecSection[];

  const id = String(entityId);
  const byId = Array.isArray(data)
    ? (data as Array<Record<string, unknown>>).find(
        (entry) => String(entry.id ?? entry.entity_id) === id
      )
    : record[id];

  const sections = (byId as Record<string, unknown> | undefined)?.sections;
  return Array.isArray(sections) ? (sections as SpecSection[]) : [];
}
