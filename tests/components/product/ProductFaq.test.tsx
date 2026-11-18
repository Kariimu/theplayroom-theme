import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProductFaq } from '../../../app/components/product/ProductFaq';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

describe('ProductFaq', () => {
  it('renders the common-questions-section block questions as an accordion', () => {
    const { container, getByText } = render(
      <ProductFaq
        components={[
          { path: 'banner-section', component: { image: 'x.jpg' } },
          {
            path: 'common-questions-section',
            component: {
              questions: [
                { title: 'Do you ship internationally?', desc: 'Yes, worldwide.' },
                { title: 'What is the warranty?', desc: '2 years.' },
              ],
            },
          },
        ]}
      />
    );
    expect(getByText('Frequently Asked Questions')).toBeTruthy();
    expect(container.querySelectorAll('details')).toHaveLength(2);
    expect(getByText('Do you ship internationally?')).toBeTruthy();
  });

  it('renders nothing when the block is absent', () => {
    const { container } = render(<ProductFaq components={[{ path: 'banner-section' }]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the block has no questions', () => {
    const { container } = render(
      <ProductFaq
        components={[{ path: 'common-questions-section', component: { questions: [] } }]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no components were loaded', () => {
    const { container } = render(<ProductFaq />);
    expect(container.firstChild).toBeNull();
  });
});
