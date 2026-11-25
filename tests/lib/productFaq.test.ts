import { describe, it, expect } from 'vitest';
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import { MAX_PRODUCT_FAQ, resolveProductFaq } from '../../app/lib/productFaq';

const blocks = (faqItems: unknown[], common: unknown[] = []) =>
  [
    { path: 'home.product-faq', items: faqItems },
    { path: 'home.common-questions-section', questions: common },
  ] as unknown as HomeComponentData[];

const COMMON = [
  { title: 'Delivery time?', desc: '2-5 days' },
  { title: '  ', desc: 'no question' },
];

const ITEMS = [
  { key: 'swedish-ladder', question: ' Max weight? ', answer: ' 80 kg ' },
  { key: 'pikler', question: 'Folds flat?', answer: 'Yes' },
  { key: ' Swedish-Ladder ', question: 'Wall mount needed?', answer: 'Yes, included' },
  { key: 'swedish-ladder', question: 'No answer', answer: '' },
];

describe('resolveProductFaq', () => {
  it("shows the product's own questions, matched by faq- tag case-insensitively, in block order", () => {
    const faq = resolveProductFaq(blocks(ITEMS, COMMON), [{ name: 'whatsapp' }, { name: 'faq-swedish-ladder' }]);
    expect(faq.own).toBe(true);
    expect(faq.questions).toEqual([
      { title: 'Max weight?', desc: '80 kg' },
      { title: 'Wall mount needed?', desc: 'Yes, included' },
    ]);
  });

  it('merges every faq- group the product carries', () => {
    const faq = resolveProductFaq(blocks(ITEMS), ['faq-pikler', 'FAQ-swedish-ladder']);
    expect(faq.questions.map((q) => q.title)).toEqual(['Max weight?', 'Folds flat?', 'Wall mount needed?']);
  });

  it('falls back to the store-wide questions with no faq- tag', () => {
    const faq = resolveProductFaq(blocks(ITEMS, COMMON), [{ name: 'whatsapp' }]);
    expect(faq.own).toBe(false);
    expect(faq.questions).toEqual([{ title: 'Delivery time?', desc: '2-5 days' }]);
  });

  it('falls back to the store-wide questions when the tag matches no question', () => {
    const faq = resolveProductFaq(blocks(ITEMS, COMMON), ['faq-unknown']);
    expect(faq.own).toBe(false);
    expect(faq.questions).toHaveLength(1);
  });

  it('is empty with no blocks at all', () => {
    expect(resolveProductFaq(undefined, ['faq-x'])).toEqual({ questions: [], own: false });
  });

  it(`keeps at most ${MAX_PRODUCT_FAQ} questions`, () => {
    const many = Array.from({ length: MAX_PRODUCT_FAQ + 5 }, (_, i) => ({ key: 'k', question: `Q${i}`, answer: 'A' }));
    expect(resolveProductFaq(blocks(many), ['faq-k']).questions).toHaveLength(MAX_PRODUCT_FAQ);
  });
});
