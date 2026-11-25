import { describe, it, expect } from 'vitest';
import { MAX_SNIPPETS, initial, plainText, reviewDate, toReviewSnippets } from '../../app/lib/reviewSnippets';

const review = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Maryam S.',
  rating: 5,
  content: '<p>شكراً على جهودكم&nbsp;<b>المبدعة</b></p>',
  images: [],
  has_order: true,
  is_pending: false,
  created_at: { date: '2026-07-26 10:12:00' },
  ...over,
});

describe('toReviewSnippets', () => {
  it('turns a review into a snippet with plain text, stars, date and verified flag', () => {
    expect(toReviewSnippets([review({ images: [{ url: 'r.webp' }] })])).toEqual([
      {
        id: '1',
        name: 'Maryam S.',
        stars: 5,
        text: 'شكراً على جهودكم المبدعة',
        image: 'r.webp',
        verified: true,
        date: '26/7/2026',
      },
    ]);
  });

  it('reads stars from `stars` when there is no `rating`, and a plain-string photo', () => {
    const [s] = toReviewSnippets([review({ rating: undefined, stars: 4, images: ['p.jpg'], has_order: false })]);
    expect(s.stars).toBe(4);
    expect(s.image).toBe('p.jpg');
    expect(s.verified).toBe(false);
  });

  it('skips pending reviews, reviews under 4 stars and reviews with no text', () => {
    expect(
      toReviewSnippets([
        review({ is_pending: true }),
        review({ rating: 3 }),
        review({ content: '<p> </p>' }),
        review({ id: 9 }),
      ]).map((s) => s.id)
    ).toEqual(['9']);
  });

  it(`keeps at most ${MAX_SNIPPETS}`, () => {
    const many = Array.from({ length: MAX_SNIPPETS + 3 }, (_, i) => review({ id: i }));
    expect(toReviewSnippets(many)).toHaveLength(MAX_SNIPPETS);
  });

  it('is empty for anything that is not a list', () => {
    expect(toReviewSnippets(undefined)).toEqual([]);
    expect(toReviewSnippets({ data: [] })).toEqual([]);
  });
});

describe('helpers', () => {
  it('plainText drops tags and decodes entities', () => {
    expect(plainText('a<br>b &amp; &quot;c&quot;<div>d</div>')).toBe('a b & "c" d');
  });

  it('reviewDate reads the API date, else undefined', () => {
    expect(reviewDate('2026-01-05 09:00:00')).toBe('5/1/2026');
    expect(reviewDate('yesterday')).toBeUndefined();
  });

  it('initial is the first letter, or a star', () => {
    expect(initial(' noor')).toBe('N');
    expect(initial('مريم')).toBe('م');
    expect(initial('')).toBe('★');
  });
});
