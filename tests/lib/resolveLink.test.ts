import { describe, it, expect } from 'vitest';
import { resolveLink } from '../../app/lib/resolveLink';

describe('resolveLink', () => {
  it('returns a real url string as-is', () => {
    expect(resolveLink('/products/1')).toBe('/products/1');
  });

  it('trims surrounding whitespace', () => {
    expect(resolveLink('  /products/1  ')).toBe('/products/1');
  });

  it('is undefined for the manifest default (empty array)', () => {
    expect(resolveLink([])).toBeUndefined();
  });

  it('is undefined for an empty or placeholder string', () => {
    expect(resolveLink('')).toBeUndefined();
    expect(resolveLink('#')).toBeUndefined();
  });

  it('is undefined for null/undefined/objects', () => {
    expect(resolveLink(null)).toBeUndefined();
    expect(resolveLink(undefined)).toBeUndefined();
    expect(resolveLink({})).toBeUndefined();
  });
});
