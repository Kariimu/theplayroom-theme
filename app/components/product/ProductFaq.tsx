import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { home } from '@salla.sa/twilight-theme-engine/api/home';
import { FaqAccordion, type FaqQuestionItem } from '../common/FaqAccordion';

const COMMON_QUESTIONS_PATH = 'common-questions-section';

/**
 * The same store-wide, dashboard-editable FAQ as the home `common-questions-section`
 * block — D2 (docs/MIGRATION-PLAN.md §5A/5B) resolved the FAQ to live there, not a
 * per-product specs group or hard-coded `locales`. `home.components()` (api/modules/home.md)
 * is callable from any route, so the product page reads the exact same merchant-edited
 * questions instead of duplicating them. Renders nothing until the block resolves and
 * actually has questions.
 */
export function ProductFaq() {
  const { t } = useTranslation();
  const { data: components } = useQuery(home.queries.components());
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
