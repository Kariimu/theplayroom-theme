// app/lib/productFaq.ts
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import type { FaqQuestionItem } from '../components/common/FaqAccordion';
import { findHomeBlock } from './homeBlocks';
import { prefixedTagKeys } from './tags';

/**
 * Per-product FAQ (replaces the legacy per-product `products_questions` rows).
 *
 * D2 pattern, like the in-use gallery: the data-only `product-faq` home block
 * holds every question (group key, question AR/EN, answer AR/EN), edited in the
 * theme customizer. A product shows the questions whose key matches one of its
 * `faq-<key>` tags, so one group can serve a whole product family (sizes,
 * colours). The block arrives with `home.queries.components()`, which the
 * product route loader already fetches, so the questions and their FAQPage
 * JSON-LD are server-rendered.
 *
 * A product with no matching questions falls back to the store-wide list in
 * the `common-questions-section` block, as before. Why not product custom
 * fields (§5A's first idea): they load client-side only (no SEO, no JSON-LD),
 * and a field's name is shared by every product, so it can't hold a
 * product's own question. Why not the description: parsing Q&A out of rich
 * text breaks on the first formatting slip.
 */

export const PRODUCT_FAQ_PATH = 'product-faq';
export const COMMON_QUESTIONS_PATH = 'common-questions-section';

/** At most this many questions show on one product. */
export const MAX_PRODUCT_FAQ = 15;

export interface ProductFaq {
  questions: FaqQuestionItem[];
  /** True when the questions are the product's own, false for the store-wide fallback. */
  own: boolean;
}

interface RawFaqItem {
  key?: unknown;
  question?: unknown;
  answer?: unknown;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** A group key as matched against `faq-<key>` tags: trimmed, lower-cased. */
export const normalizeFaqKey = (value: unknown) => text(value).toLowerCase();

type TagLike = string | { name?: string | null } | null | undefined;

/** Questions and answers with both parts filled in, trimmed. */
function cleanQuestions(items: readonly FaqQuestionItem[]): FaqQuestionItem[] {
  return items
    .map((q) => ({ title: text(q?.title), desc: text(q?.desc) }))
    .filter((q) => q.title && q.desc);
}

/**
 * This product's FAQ: its own questions (block order, capped at
 * {@link MAX_PRODUCT_FAQ}) when it has a `faq-` tag matching any, else the
 * store-wide questions.
 */
export function resolveProductFaq(
  components: readonly HomeComponentData[] | null | undefined,
  tags: readonly TagLike[] | null | undefined
): ProductFaq {
  const keys = new Set(prefixedTagKeys(tags, 'faq').map((key) => key.toLowerCase()));

  if (keys.size) {
    const items = findHomeBlock(components, PRODUCT_FAQ_PATH)?.items;
    const own: FaqQuestionItem[] = [];
    for (const item of Array.isArray(items) ? (items as RawFaqItem[]) : []) {
      if (!keys.has(normalizeFaqKey(item?.key))) continue;
      const title = text(item?.question);
      const desc = text(item?.answer);
      if (!title || !desc) continue;
      own.push({ title, desc });
      if (own.length >= MAX_PRODUCT_FAQ) break;
    }
    if (own.length) return { questions: own, own: true };
  }

  const common = findHomeBlock(components, COMMON_QUESTIONS_PATH)?.questions;
  return {
    questions: cleanQuestions(Array.isArray(common) ? (common as FaqQuestionItem[]) : []),
    own: false,
  };
}
