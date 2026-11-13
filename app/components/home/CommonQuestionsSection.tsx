import { memo } from 'react';
import { ChevronDownIcon } from '../icons';

interface QuestionItem {
  title?: string;
  desc?: string;
}

export interface CommonQuestionsSectionProps {
  data: {
    title_section?: string;
    questions?: QuestionItem[];
    position?: number;
    [key: string]: unknown;
  };
}

/**
 * `common-questions-section` home block — the store-wide FAQ, dashboard-
 * editable per D2 (`docs/MIGRATION-PLAN.md` §5A/5B): the merchant edits the
 * questions here instead of a theme commit. Native `<details>/<summary>` for
 * a keyboard- and screen-reader-accessible accordion with no JS. FAQPage
 * structured data is Stage 10, not added here.
 */
export const CommonQuestionsSection = memo(function CommonQuestionsSection({
  data,
}: CommonQuestionsSectionProps) {
  const { title_section: title, questions = [] } = data;

  if (!questions.length) return null;

  return (
    <div className="container">
      {title && (
        <h2 className="s-block__title mb-8 text-2xl font-black text-gray-900 md:mb-10 md:text-3xl">
          {title}
        </h2>
      )}
      <div className="common-questions mx-auto max-w-3xl divide-y divide-gray-200">
        {questions.map((question, index) =>
          question.title ? (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <details key={index} className="common-questions__item group py-5">
              <summary className="common-questions__question flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-gray-900 [&::-webkit-details-marker]:hidden">
                <span className="text-start">{question.title}</span>
                <ChevronDownIcon
                  className="common-questions__chevron h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              {question.desc && (
                <p className="common-questions__answer mt-3 text-start text-gray-500">
                  {question.desc}
                </p>
              )}
            </details>
          ) : null
        )}
      </div>
    </div>
  );
});
