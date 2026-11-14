import { describe, it, expect } from 'vitest';
import {
  matchesName,
  findSection,
  extractFacts,
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

describe('findSection', () => {
  it('finds the section whose name matches, case-insensitively', () => {
    const sections = [{ name: 'Shipping', fields: [] }, { name: 'product details', fields: [] }];
    expect(findSection(sections, FACTS_SECTION_NAMES)?.name).toBe('product details');
  });

  it('is undefined when nothing matches, or there are no sections', () => {
    expect(findSection([{ name: 'Shipping' }], FACTS_SECTION_NAMES)).toBeUndefined();
    expect(findSection(undefined, FACTS_SECTION_NAMES)).toBeUndefined();
  });
});

describe('extractFacts', () => {
  it('reads for_who/material/box_contents by their canonical label, in either language', () => {
    const facts = extractFacts({
      name: 'Product Details',
      fields: [
        { name: 'Suitable for', value: 'Ages 3+' },
        { name: 'الخامة', value: 'خشب الزان الصلب' },
        { name: 'Box contents', value: '1x play set, 1x manual' },
      ],
    });
    expect(facts).toEqual({
      forWho: 'Ages 3+',
      material: 'خشب الزان الصلب',
      boxContents: '1x play set, 1x manual',
    });
  });

  it('skips a field with no value, and ignores an unrecognised field name', () => {
    const facts = extractFacts({
      fields: [
        { name: 'Suitable for', value: '   ' },
        { name: 'Colour', value: 'Red' },
      ],
    });
    expect(facts).toEqual({});
  });

  it('is empty for an absent section', () => {
    expect(extractFacts(undefined)).toEqual({});
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
