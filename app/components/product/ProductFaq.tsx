import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import { FaqAccordion, type FaqQuestionItem } from '../common/FaqAccordion';

const COMMON_QUESTIONS_PATH = 'common-questions-section';

/**
 * The same store-wide, dashboard-editable FAQ as the home `common-questions-section`
 * block — D2 (docs/MIGRATION-PLAN.md §5A/5B) resolved the FAQ to live there, not a
 * per-product specs group or hard-coded `locales`. `components` comes from the product
 * route's own loader (`home.queries.components()`, fetched server-side via
 * `queryClient.ensureQueryData` — same cache key the home page's own query uses), so the
 * question text is in the SSR HTML instead of only appearing after a client-side query
 * (SEO audit #1). Renders nothing until the block actually has questions.
 */
export function ProductFaq({ components }: { components?: HomeComponentData[] }) {
  const { t } = useTranslation();
  const block = components?.find((c) => c.path === COMMON_QUESTIONS_PATH);
  const questions = (block?.component?.questions as FaqQuestionItem[] | undefined) ?? [];

  if (!questions.length) return null;

  return (
    <div className="container">
      <h2 className="s-block__title mb-8 text-3xl font-black text-gray-900 md:mb-10">
        {t('pages.products.faq_title', 'Frequently Asked Questions')}
      </h2>
      <FaqAccordion questions={questions} />
    </div>
  );
}
