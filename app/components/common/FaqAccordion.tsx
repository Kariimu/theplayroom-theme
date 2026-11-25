import { ChevronDownIcon } from '../icons';

export interface FaqQuestionItem {
  title?: string;
  desc?: string;
}

export interface FaqAccordionProps {
  questions: FaqQuestionItem[];
}

/**
 * Native `<details>/<summary>` accordion for a list of question/answer pairs —
 * keyboard- and screen-reader-accessible with no JS. Shared by
 * `CommonQuestionsSection` (the home block) and `ProductFaq` (the product
 * page), so the same markup/classes back both — `04-components/home-blocks.scss`
 * (`.common-questions`) styles whichever renders it.
 */
export function FaqAccordion({ questions }: FaqAccordionProps) {
  if (!questions.length) return null;

  return (
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
  );
}
