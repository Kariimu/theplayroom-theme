import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  TAG,
  TAG_PREFIX,
  hasTag,
  isCartUpsellProduct,
  isWhatsappProduct,
  parseGroupValueTag,
  prefixedTagKeys,
  tagIdFromUrl,
  tagNames,
  warnUnknownTagKey,
} from '../../app/lib/tags';

describe('tagNames', () => {
  it('reads engine tag objects and plain strings, trimmed and non-empty', () => {
    expect(tagNames([{ name: ' whatsapp ' }, 'cart-upsell', { name: '' }, null, '  '])).toEqual([
      'whatsapp',
      'cart-upsell',
    ]);
  });

  it('is empty for missing tags', () => {
    expect(tagNames(null)).toEqual([]);
    expect(tagNames(undefined)).toEqual([]);
  });
});

describe('whole-tag membership', () => {
  it('matches case-insensitively', () => {
    expect(hasTag([{ name: 'WhatsApp' }], TAG.whatsapp)).toBe(true);
    expect(isWhatsappProduct([{ name: 'whatsapp' }])).toBe(true);
    expect(isWhatsappProduct(['other'])).toBe(false);
    expect(isCartUpsellProduct([{ name: 'cart-upsell' }])).toBe(true);
    expect(isCartUpsellProduct([])).toBe(false);
  });

  it('does not treat a prefixed tag as a whole-tag literal', () => {
    expect(isWhatsappProduct(['whatsapp:yes'])).toBe(false);
  });
});

describe('prefixedTagKeys', () => {
  it('extracts and trims the key after the prefix, preserving order', () => {
    const tags = ['feature: wood ', 'feature:safe', 'set:pikler', 'card:a', 'whatsapp'];
    expect(prefixedTagKeys(tags, 'feature')).toEqual(['wood', 'safe']);
    expect(prefixedTagKeys(tags, 'set')).toEqual(['pikler']);
    expect(prefixedTagKeys(tags, 'card')).toEqual(['a']);
  });

  it('ignores a bare prefix with no key', () => {
    expect(prefixedTagKeys(['feature:', 'feature: '], 'feature')).toEqual([]);
  });

  it('matches the prefix case-insensitively', () => {
    expect(prefixedTagKeys(['Feature:Wood'], 'feature')).toEqual(['Wood']);
  });
});

describe('parseGroupValueTag', () => {
  it('splits on the first hyphen so the value keeps its own hyphens', () => {
    expect(parseGroupValueTag('Age Range-7 months - 5 years')).toEqual({
      group: 'Age Range',
      value: '7 months - 5 years',
    });
    expect(parseGroupValueTag('الفئة العمرية-١-٣ سنوات')).toEqual({
      group: 'الفئة العمرية',
      value: '١-٣ سنوات',
    });
  });

  it('is null without a real group/value split', () => {
    for (const t of ['whatsapp', '-value', 'group-', '-', '  ']) {
      expect(parseGroupValueTag(t)).toBeNull();
    }
  });
});

describe('tagIdFromUrl', () => {
  it('reads the numeric id from a tag page URL', () => {
    expect(tagIdFromUrl('https://theplayroom.sa/ar/مجموعة-التسلق/tag-1143764859')).toBe(1143764859);
    expect(tagIdFromUrl('/ar/x/tag-42?page=2')).toBe(42);
  });

  it('is null when there is no tag id (list responses send url: null)', () => {
    for (const u of [null, undefined, '', 'https://theplayroom.sa/ar/category/c123', 'tag-']) {
      expect(tagIdFromUrl(u)).toBeNull();
    }
  });
});

describe('warnUnknownTagKey', () => {
  afterEach(() => vi.restoreAllMocks());

  it('warns once for an unknown key and never for a known one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const known = new Set(['wood']);
    warnUnknownTagKey('feature', 'wood', known);
    expect(warn).not.toHaveBeenCalled();
    warnUnknownTagKey('feature', 'mystery-key', known);
    warnUnknownTagKey('feature', 'mystery-key', known); // deduped
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('feature:mystery-key');
  });
});

describe('convention literals', () => {
  it('are the exact strings the merchant and Phase 0b data entry rely on', () => {
    expect(TAG).toEqual({ whatsapp: 'whatsapp', cartUpsell: 'cart-upsell' });
    expect(TAG_PREFIX).toEqual({ feature: 'feature:', card: 'card:', set: 'set:' });
  });
});
