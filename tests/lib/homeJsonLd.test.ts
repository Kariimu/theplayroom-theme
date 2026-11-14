import { describe, it, expect } from 'vitest';
import { buildHomeJsonLd } from '../../app/lib/homeJsonLd';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    locale: 'ar',
    settings: {
      store: {
        name: 'غرفة الألعاب',
        url: 'https://theplayroom.sa/ar/',
        logo: 'https://cdn.example/logo.png',
        description: 'Store description',
        meta: { title: 'Meta title', description: 'Meta description' },
        social: { instagram: 'https://instagram.com/theplayroom', twitter: '' },
        ...((overrides.store as Record<string, unknown>) ?? {}),
      },
    },
  } as unknown as Parameters<typeof buildHomeJsonLd>[0];
}

describe('buildHomeJsonLd', () => {
  it('returns nothing without a store url', () => {
    const ctx = { locale: 'ar', settings: {} } as unknown as Parameters<typeof buildHomeJsonLd>[0];
    expect(buildHomeJsonLd(ctx, { locale: 'ar', components: [], page: { slug: '' } }, undefined)).toEqual(
      []
    );
  });

  it('builds Organization, WebSite and WebPage from the store, not hard-coded values', () => {
    const ctx = makeCtx();
    const jsonLd = buildHomeJsonLd(
      ctx,
      { locale: 'ar', components: [], page: { slug: '' } },
      'https://theplayroom.sa/ar'
    );
    const org = jsonLd.find((n) => n['@type'] === 'Organization')!;
    expect(org['@id']).toBe('https://theplayroom.sa/#organization');
    expect(org.name).toBe('غرفة الألعاب');
    expect(org.logo).toBe('https://cdn.example/logo.png');
    // Only non-empty social links.
    expect(org.sameAs).toEqual(['https://instagram.com/theplayroom']);

    const site = jsonLd.find((n) => n['@type'] === 'WebSite')!;
    expect(site['@id']).toBe('https://theplayroom.sa/#website');
    expect(site.url).toBe('https://theplayroom.sa/');

    const page = jsonLd.find((n) => n['@type'] === 'WebPage')!;
    expect(page.url).toBe('https://theplayroom.sa/ar');
    expect(page.isPartOf).toEqual({ '@id': 'https://theplayroom.sa/#website' });
    expect(page.about).toEqual({ '@id': 'https://theplayroom.sa/#organization' });
  });

  it('adds FAQPage only when the common-questions-section block has real Q&A', () => {
    const ctx = makeCtx();
    const withFaq = buildHomeJsonLd(
      ctx,
      {
        locale: 'ar',
        page: { slug: '' },
        components: [
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
      },
      'https://theplayroom.sa/ar'
    );
    const faq = withFaq.find((n) => n['@type'] === 'FAQPage');
    expect(faq).toBeDefined();
    expect(faq?.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'هل يوجد توصيل؟',
        acceptedAnswer: { '@type': 'Answer', text: 'نعم، نوصل لجميع المناطق.' },
      },
    ]);
  });

  it('omits FAQPage when the block is absent or empty', () => {
    const ctx = makeCtx();
    const noBlock = buildHomeJsonLd(ctx, { locale: 'ar', components: [], page: { slug: '' } }, undefined);
    expect(noBlock.some((n) => n['@type'] === 'FAQPage')).toBe(false);

    const emptyBlock = buildHomeJsonLd(
      ctx,
      {
        locale: 'ar',
        page: { slug: '' },
        components: [{ path: 'common-questions-section', component: { questions: [] } }],
      },
      undefined
    );
    expect(emptyBlock.some((n) => n['@type'] === 'FAQPage')).toBe(false);
  });
});
