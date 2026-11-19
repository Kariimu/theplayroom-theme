import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

const getMock = vi.fn();
const listMock = vi.fn();

vi.mock('@salla.sa/twilight-theme-engine/api/blog', () => ({
  blog: {
    get: (...args: unknown[]) => getMock(...args),
    articles: { list: (...args: unknown[]) => listMock(...args) },
  },
}));

import {
  MAX_PRODUCT_FEATURES,
  articleFeatureKey,
  hasFeatureTags,
  productFeatureKeys,
  productFeatures,
  resolveProductFeatures,
  toFeatureLibrary,
} from '../../app/lib/productFeatures';

const article = (name: string, tags: string[], extra: Record<string, string> = {}) => ({
  name,
  tags: tags.map((t) => ({ name: t })),
  ...extra,
});

describe('feature keys', () => {
  it('reads an article key from its first feature- blog tag, lower-cased', () => {
    expect(articleFeatureKey(article('Montessori', ['toys', 'Feature-Montessori']))).toBe('montessori');
    expect(articleFeatureKey(article('Plain', ['toys']))).toBeNull();
  });

  it('reads product keys in tag order, lower-cased and de-duplicated', () => {
    const tags = [{ name: 'feature-b' }, { name: 'whatsapp' }, { name: 'Feature-A' }, { name: 'feature-b' }];
    expect(productFeatureKeys(tags)).toEqual(['b', 'a']);
    expect(hasFeatureTags(tags)).toBe(true);
    expect(hasFeatureTags([{ name: 'addons-p1' }])).toBe(false);
    expect(hasFeatureTags(undefined)).toBe(false);
  });
});

describe('toFeatureLibrary', () => {
  it('keeps articles with a key and a title; the first article wins a duplicate key', () => {
    const library = toFeatureLibrary([
      article('Montessori', ['feature-montessori'], { image: 'https://cdn/x.png', url: 'https://s/blog/1' }),
      article('Duplicate', ['feature-montessori']),
      article('No key', ['other']),
      article('  ', ['feature-empty']),
    ]);
    expect(library).toEqual([
      { key: 'montessori', title: 'Montessori', image: 'https://cdn/x.png', url: 'https://s/blog/1' },
    ]);
  });
});

describe('resolveProductFeatures', () => {
  const library = toFeatureLibrary(
    ['a', 'b', 'c', 'd', 'e'].map((k) => article(`Title ${k}`, [`feature-${k}`]))
  );

  it('follows the product tag order and skips unknown keys', () => {
    const tags = ['feature-c', 'feature-missing', 'feature-a'];
    expect(resolveProductFeatures(tags, library).map((f) => f.key)).toEqual(['c', 'a']);
  });

  it(`caps at ${MAX_PRODUCT_FEATURES}`, () => {
    const tags = ['a', 'b', 'c', 'd', 'e'].map((k) => `feature-${k}`);
    expect(resolveProductFeatures(tags, library)).toHaveLength(MAX_PRODUCT_FEATURES);
  });

  it('is empty without a library', () => {
    expect(resolveProductFeatures(['feature-a'], undefined)).toEqual([]);
    expect(resolveProductFeatures(['feature-a'], [])).toEqual([]);
  });
});

describe('productFeatures.queries.library', () => {
  beforeEach(() => {
    getMock.mockReset();
    listMock.mockReset();
  });

  const run = (locale: string) => new QueryClient().fetchQuery(productFeatures.queries.library(locale));

  it('lists the features category (matched by name in either language) and follows the cursor', async () => {
    getMock.mockResolvedValue({
      categories: [
        { id: '11', name: 'News' },
        { id: '22', name: ' Our Toy Features ' },
      ],
    });
    listMock
      .mockResolvedValueOnce({ data: [article('A', ['feature-a'])], cursor: { next: 'c2', current: 1 } })
      .mockResolvedValueOnce({ data: [article('B', ['feature-b'])], cursor: { next: null, current: 2 } });

    const library = await run('en');
    expect(library.map((f) => f.key)).toEqual(['a', 'b']);
    expect(listMock).toHaveBeenCalledTimes(2);
    expect(listMock.mock.calls[0][0]).toMatchObject({ category: '22', cursor: undefined });
    expect(listMock.mock.calls[1][0]).toMatchObject({ category: '22', cursor: 'c2' });
  });

  it('is empty, without listing articles, when the store has no features category', async () => {
    getMock.mockResolvedValue({ categories: [{ id: '11', name: 'News' }] });
    expect(await run('ar')).toEqual([]);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('keys the cache by locale', () => {
    expect(productFeatures.queries.library('ar').queryKey).not.toEqual(
      productFeatures.queries.library('en').queryKey
    );
  });
});
