import { describe, it, expect } from 'vitest';
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import {
  MAX_USAGE_CARDS,
  USAGE_GALLERY_PATH,
  resolveUsageGallery,
} from '../../app/lib/productUsageGallery';

const block = (component: Record<string, unknown>, path = USAGE_GALLERY_PATH) =>
  [{ path, component }] as unknown as HomeComponentData[];

const ITEMS = [
  { key: 'swedish-ladder', image: 'https://cdn/1.webp', title: 'Climbing ladder', desc: ' Strength ' },
  { key: 'pikler', image: 'https://cdn/2.webp', title: 'Pikler triangle' },
  { key: ' Swedish-Ladder ', image: { url: 'https://cdn/3.webp' }, title: 'Reading swing', desc: '' },
  { key: 'swedish-ladder', image: '', title: 'No image' },
  { key: 'swedish-ladder', image: 'https://cdn/5.webp', title: '  ' },
];

describe('resolveUsageGallery', () => {
  it("returns the product's cards in block order, matched by inuse- tag, case-insensitively", () => {
    const result = resolveUsageGallery(
      block({ title_section: ' In use ', items: ITEMS }),
      [{ name: 'whatsapp' }, { name: 'inuse-swedish-ladder' }]
    );
    expect(result.title).toBe('In use');
    expect(result.cards).toEqual([
      { image: 'https://cdn/1.webp', title: 'Climbing ladder', desc: 'Strength' },
      { image: 'https://cdn/3.webp', title: 'Reading swing' },
    ]);
  });

  it('reads the raw store API shape (home. prefix, fields flat on the block)', () => {
    const raw = [
      { path: 'home.common-questions-section', questions: [] },
      { path: 'home.product-usage-gallery', title_section: 'In use', items: ITEMS },
    ] as unknown as HomeComponentData[];
    const result = resolveUsageGallery(raw, ['inuse-pikler']);
    expect(result.title).toBe('In use');
    expect(result.cards).toEqual([{ image: 'https://cdn/2.webp', title: 'Pikler triangle' }]);
  });

  it('combines several groups and caps the count', () => {
    const many = Array.from({ length: MAX_USAGE_CARDS + 3 }, (_, i) => ({
      key: i % 2 ? 'a' : 'b',
      image: `https://cdn/${i}.webp`,
      title: `Card ${i}`,
    }));
    const { cards } = resolveUsageGallery(block({ items: many }), ['inuse-a', 'inuse-b']);
    expect(cards).toHaveLength(MAX_USAGE_CARDS);
    expect(cards[0].title).toBe('Card 0');
  });

  it('is empty without a matching tag, block or card', () => {
    expect(resolveUsageGallery(block({ items: ITEMS }), ['feature-x']).cards).toEqual([]);
    expect(resolveUsageGallery(block({ items: ITEMS }), ['inuse-unknown']).cards).toEqual([]);
    expect(resolveUsageGallery(block({ items: ITEMS }, 'other'), ['inuse-pikler']).cards).toEqual([]);
    expect(resolveUsageGallery(undefined, ['inuse-pikler']).cards).toEqual([]);
    expect(resolveUsageGallery(block({ items: 'nope' }), ['inuse-pikler'])).toEqual({
      title: undefined,
      cards: [],
    });
  });
});
