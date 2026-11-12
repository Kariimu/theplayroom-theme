/**
 * A dropdown-list field's value as the backend may send it: scalar, a
 * `{value|key|id}` object (hydrated picker item), or an array of those.
 * Shared by every home block with a product/category/tag picker.
 */
export type PickerValue =
  | string
  | number
  | { id?: unknown; value?: unknown; key?: unknown }
  | null
  | undefined;

/** Unwraps one picker value down to its scalar id/value, however deeply nested. */
export function scalar(v: unknown): string {
  if (Array.isArray(v)) return scalar(v[0]);
  if (v && typeof v === 'object') {
    const o = v as { value?: unknown; key?: unknown; id?: unknown };
    return scalar(o.value ?? o.key ?? o.id);
  }
  return v === null || v === undefined ? '' : String(v);
}

/** Every picked id as a positive number, from any of the shapes {@link PickerValue} can take. */
export function toIds(v: unknown): number[] {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'source_value' in v) {
    return toIds((v as { source_value?: unknown }).source_value);
  }
  return (Array.isArray(v) ? v : v === null || v === undefined || v === '' ? [] : [v])
    .map((x) => Number(scalar(x)))
    .filter((id) => Number.isFinite(id) && id > 0);
}
