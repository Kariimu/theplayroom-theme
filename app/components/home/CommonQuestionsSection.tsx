import { memo } from 'react';

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
      {title && <h2 className="s-block__title text-center text-lg font-semibold mb-4">{title}</h2>}
      <div className="common-questions mx-auto max-w-3xl divide-y divide-gray-200">
        {questions.map((question, index) =>
          question.title ? (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <details key={index} className="common-questions__item py-3">
              <summary className="common-questions__question cursor-pointer font-medium text-start">
                {question.title}
              </summary>
              {question.desc && (
                <p className="common-questions__answer mt-2 text-sm opacity-80 text-start">
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
