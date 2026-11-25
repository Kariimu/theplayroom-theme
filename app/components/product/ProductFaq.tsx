import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import type { HomeComponentData, Product } from '@salla.sa/twilight-theme-engine/types';
import { FaqAccordion } from '../common/FaqAccordion';
import { resolveProductFaq } from '../../lib/productFaq';

/**
 * The product page FAQ: the product's own questions (its `faq-<key>` tags
 * matched against the `product-faq` block), else the store-wide
 * `common-questions-section` list (`app/lib/productFaq.ts`). `components`
 * comes from the product route's own loader (`home.queries.components()`,
 * fetched server-side), so the question text is in the SSR HTML (SEO audit
 * #1) and matches the FAQPage JSON-LD built in the route's `head`. Renders
 * nothing when there are no questions at all.
 */
export function ProductFaq({
  components,
  tags,
}: {
  components?: HomeComponentData[];
  tags?: Product['tags'];
}) {
  const { t } = useTranslation();
  const { questions } = resolveProductFaq(components, tags);

  if (!questions.length) return null;

  return (
    // `product-faq`: 18px question and answer text, product page only (the
    // home FAQ block shares `FaqAccordion`). `pt-*` spaces it from the reviews.
    <div className="product-faq container pt-10 md:pt-14">
      <h2 className="mb-8 text-center text-3xl font-black text-gray-900 md:mb-10">
        {t('pages.products.faq_title', 'Frequently Asked Questions')}
      </h2>
      <FaqAccordion questions={questions} />
    </div>
  );
}
