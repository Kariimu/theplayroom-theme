import { describe, it, expect } from 'vitest';
import {
  matchesName,
  sectionsFromMetadataValues,
  FACTS_SECTION_NAMES,
} from '../../app/lib/specs';

describe('matchesName', () => {
  it('matches case- and whitespace-insensitively', () => {
    expect(matchesName('  Product Details ', ['product details'])).toBe(true);
    expect(matchesName('تفاصيل المنتج', FACTS_SECTION_NAMES)).toBe(true);
  });

  it('is false for an unrelated name or none at all', () => {
    expect(matchesName('Shipping', FACTS_SECTION_NAMES)).toBe(false);
    expect(matchesName(undefined, FACTS_SECTION_NAMES)).toBe(false);
    expect(matchesName('', FACTS_SECTION_NAMES)).toBe(false);
  });
});

describe('sectionsFromMetadataValues', () => {
  const sections = [{ name: 'Product Details', fields: [{ name: 'Material', value: 'Wood' }] }];

  it('reads the bare { sections } shape', () => {
    expect(sectionsFromMetadataValues({ sections }, 101)).toEqual(sections);
  });

  it('reads an array of per-entity results, matched by id', () => {
    const data = [
      { id: 999, sections: [{ name: 'Other' }] },
      { id: 101, sections },
    ];
    expect(sectionsFromMetadataValues(data, 101)).toEqual(sections);
    expect(sectionsFromMetadataValues(data, '101')).toEqual(sections);
  });

  it('reads an id-keyed map', () => {
    expect(sectionsFromMetadataValues({ 101: { sections } }, 101)).toEqual(sections);
  });

  it('is empty for null, a shape with no sections, or no matching id', () => {
    expect(sectionsFromMetadataValues(null, 101)).toEqual([]);
    expect(sectionsFromMetadataValues({}, 101)).toEqual([]);
    expect(sectionsFromMetadataValues([{ id: 1, sections }], 101)).toEqual([]);
  });
});
