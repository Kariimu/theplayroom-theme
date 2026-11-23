import { memo } from 'react';
import { FaqAccordion, type FaqQuestionItem } from '../common/FaqAccordion';

export interface CommonQuestionsSectionProps {
  data: {
    title_section?: string;
    questions?: FaqQuestionItem[];
    position?: number;
    [key: string]: unknown;
  };
}

/**
 * `common-questions-section` home block — the store-wide FAQ, dashboard-
 * editable per D2 (`docs/MIGRATION-PLAN.md` §5A/5B): the merchant edits the
 * questions here instead of a theme commit. {@link FaqAccordion} renders the
 * actual accordion (shared with the product page's `ProductFaq`, which reads
 * this same block's data through `home.components()`). FAQPage structured
 * data is Stage 10, not added here.
 */
export const CommonQuestionsSection = memo(function CommonQuestionsSection({
  data,
}: CommonQuestionsSectionProps) {
  const { title_section: title, questions = [] } = data;

  if (!questions.length) return null;

  return (
    <div className="container">
      {title && (
        <h2 className="s-block__title mb-8 text-[30px] font-black text-gray-900 md:mb-10 md:text-[36px]">
          {title}
        </h2>
      )}
      <FaqAccordion questions={questions} />
    </div>
  );
});
