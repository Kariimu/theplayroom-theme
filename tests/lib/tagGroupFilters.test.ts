import { describe, expect, it } from 'vitest';
import { buildTagFilterGroups, filterProductsByTags } from '../../app/lib/tagGroupFilters';

function product(id: number, tagNames: string[]) {
  return { id, tags: tagNames.map((name) => ({ name, url: '' })) };
}

describe('buildTagFilterGroups', () => {
  it('groups Group-Value tags by group, deduping repeated values', () => {
    const products = [
      product(1, ['Age Range-7 months - 5 years', 'Color-Natural wood']),
      product(2, ['Age Range-7 months - 5 years', 'Age Range-5-8 years']),
    ];
    const groups = buildTagFilterGroups(products, false);
    expect(groups).toEqual([
      {
        group: 'Age Range',
        options: [
          { key: 'Age Range-7 months - 5 years', label: '7 months - 5 years' },
          { key: 'Age Range-5-8 years', label: '5-8 years' },
        ],
      },
      { group: 'Color', options: [{ key: 'Color-Natural wood', label: 'Natural wood' }] },
    ]);
  });

  it('keeps only groups matching the locale script', () => {
    const products = [
      product(1, ['Age Range-7 months - 5 years', 'الفئة العمرية-١-٣ سنوات']),
    ];
    expect(buildTagFilterGroups(products, false)).toEqual([
      { group: 'Age Range', options: [{ key: 'Age Range-7 months - 5 years', label: '7 months - 5 years' }] },
    ]);
    expect(buildTagFilterGroups(products, true)).toEqual([
      {
        group: 'الفئة العمرية',
        options: [{ key: 'الفئة العمرية-١-٣ سنوات', label: '١-٣ سنوات' }],
      },
    ]);
  });

  it('excludes this theme convention tags, so cart-upsell is never a fake "cart" group', () => {
    const products = [product(1, ['cart-upsell', 'whatsapp', 'feature-wood', 'set:pikler', 'gallery'])];
    expect(buildTagFilterGroups(products, false)).toEqual([]);
  });

  it('dedupes near-duplicate tags that only differ in whitespace', () => {
    const products = [
      product(1, ['Age Range-7  months - 5 years']),
      product(2, ['Age Range-7 months -  5 years']),
    ];
    const groups = buildTagFilterGroups(products, false);
    expect(groups).toHaveLength(1);
    expect(groups[0].options).toHaveLength(1);
  });

  it('is empty for products with no tags', () => {
    expect(buildTagFilterGroups([{ id: 1, tags: [] }], false)).toEqual([]);
  });
});

describe('filterProductsByTags', () => {
  const products = [
    product(1, ['Age Range-7 months - 5 years', 'Color-Natural wood']),
    product(2, ['Age Range-5-8 years', 'Color-Natural wood']),
    product(3, ['Color-Natural wood']),
  ];

  it('returns every product when nothing is selected', () => {
    expect(filterProductsByTags(products, [])).toEqual(products);
  });

  it('keeps only products carrying every selected tag (AND across groups)', () => {
    const result = filterProductsByTags(products, ['Age Range-7 months - 5 years', 'Color-Natural wood']);
    expect(result.map((p) => p.id)).toEqual([1]);
  });

  it('matches a tag with different internal whitespace', () => {
    const result = filterProductsByTags(products, ['Age Range-7  months -  5 years']);
    expect(result.map((p) => p.id)).toEqual([1]);
  });

  it('matches case-insensitively', () => {
    const result = filterProductsByTags(products, ['AGE RANGE-7 months - 5 years']);
    expect(result.map((p) => p.id)).toEqual([1]);
  });
});
