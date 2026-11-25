import { describe, it, expect } from 'vitest';
import { buildFaqJsonLd } from '../../app/lib/faqJsonLd';

describe('buildFaqJsonLd', () => {
  it('builds FAQPage from the common-questions-section block questions', () => {
    const faq = buildFaqJsonLd(
      [
        {
          path: 'common-questions-section',
          component: {
            questions: [
              { title: 'هل يوجد توصيل؟', desc: 'نعم، نوصل لجميع المناطق.' },
              { title: '', desc: 'answer with no question is skipped' },
            ],
          },
        },
      ],
      'ar',
      'https://theplayroom.sa/ar/some-product/p1'
    );

    expect(faq).toBeDefined();
    expect(faq?.['@type']).toBe('FAQPage');
    expect(faq?.['@id']).toBe('https://theplayroom.sa/ar/some-product/p1#faq');
    expect(faq?.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'هل يوجد توصيل؟',
        acceptedAnswer: { '@type': 'Answer', text: 'نعم، نوصل لجميع المناطق.' },
      },
    ]);
  });

  it('omits FAQPage when the block is absent, empty, or has no real Q&A', () => {
    expect(buildFaqJsonLd(undefined, 'ar', 'https://theplayroom.sa/ar')).toBeUndefined();
    expect(buildFaqJsonLd([], 'ar', 'https://theplayroom.sa/ar')).toBeUndefined();
    expect(
      buildFaqJsonLd(
        [{ path: 'common-questions-section', component: { questions: [] } }],
        'ar',
        'https://theplayroom.sa/ar'
      )
    ).toBeUndefined();
  });
});
