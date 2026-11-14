import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProductFaq } from '../../../app/components/product/ProductFaq';

const state = {
  components: [] as Array<{ path: string; component?: Record<string, unknown> }>,
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: state.components }),
}));
vi.mock('@salla.sa/twilight-theme-engine/api/home', () => ({
  home: { queries: { components: () => ({ queryKey: ['home-components'] }) } },
}));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

describe('ProductFaq', () => {
  it('renders the common-questions-section block questions as an accordion', () => {
    state.components = [
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
    ];
    const { container, getByText } = render(<ProductFaq />);
    expect(getByText('Frequently Asked Questions')).toBeTruthy();
    expect(container.querySelectorAll('details')).toHaveLength(2);
    expect(getByText('Do you ship internationally?')).toBeTruthy();
  });

  it('renders nothing when the block is absent', () => {
    state.components = [{ path: 'banner-section' }];
    const { container } = render(<ProductFaq />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the block has no questions', () => {
    state.components = [{ path: 'common-questions-section', component: { questions: [] } }];
    const { container } = render(<ProductFaq />);
    expect(container.firstChild).toBeNull();
  });
});
