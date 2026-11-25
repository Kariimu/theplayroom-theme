/**
 * A `variable-list` field's value (button/CTA links across the home blocks).
 * The engine resolves a chosen target to a plain URL string server-side, but
 * an unset field still carries its manifest default of `[]` — never render
 * that, or `'#'`, as a link.
 */
export function resolveLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed !== '#' ? trimmed : undefined;
}
