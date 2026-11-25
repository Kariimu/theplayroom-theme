import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import { findHomeBlock } from './homeBlocks';

const COMMON_QUESTIONS_PATH = 'common-questions-section';

interface QuestionItem {
  title?: string;
  desc?: string;
}

/**
 * FAQPage schema from the actual `common-questions-section` block data, shared by every
 * page that renders that block's questions (home, product — SEO audit #1/#12: only where
 * the FAQ is actually visible on the page, built from live data so it never drifts from it).
 */
export function buildFaqJsonLd(
  components: HomeComponentData[] | undefined,
  locale: string,
  pageUrl: string
): Record<string, unknown> | undefined {
  const questions = (findHomeBlock(components, COMMON_QUESTIONS_PATH)?.questions as
    | QuestionItem[]
    | undefined) ?? [];
  return faqJsonLdFromQuestions(questions, locale, pageUrl);
}

/**
 * FAQPage schema from a list of questions already resolved for the page (the
 * product page's own or store-wide FAQ, `app/lib/productFaq.ts`).
 */
export function faqJsonLdFromQuestions(
  questions: readonly QuestionItem[],
  locale: string,
  pageUrl: string
): Record<string, unknown> | undefined {
  const mainEntity = questions
    .filter((q): q is Required<QuestionItem> => Boolean(q.title?.trim() && q.desc?.trim()))
    .map((q) => ({
      '@type': 'Question',
      name: q.title.trim(),
      acceptedAnswer: { '@type': 'Answer', text: q.desc.trim() },
    }));

  if (!mainEntity.length) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    url: pageUrl,
    inLanguage: locale,
    mainEntity,
  };
}
