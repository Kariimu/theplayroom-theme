import type { Money } from '@salla.sa/twilight-theme-engine/types';

/** A cart amount can arrive as a bare number or a `{ amount, currency }` object. */
export function toNumber(value: number | Money | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  return value.amount;
}

export function moneyCurrency(value: number | Money | undefined): string | undefined {
  if (typeof value !== 'object') return undefined;
  return value.currency;
}
