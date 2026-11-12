import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  SearchSuggestions,
  collectSearchSuggestions,
} from '../../../app/components/layout/SearchSuggestions';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className }: { to: string; children?: unknown; className?: string }) => (
    <a href={to} className={className}>
      {children as never}
    </a>
  ),
}));

const terms: Record<string, string> = {
  'blocks.search.suggestions.1': 'تسلق',
  'blocks.search.suggestions.2': 'balance board',
  'blocks.search.popular': 'Popular',
};
const t = (key: string, fb: string) => terms[key] ?? fb;

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (k: string, fb: string) => terms[k] ?? fb }),
}));

describe('collectSearchSuggestions', () => {
  it('collects the filled suggestion keys in order, dropping blanks', () => {
    expect(collectSearchSuggestions(t)).toEqual(['تسلق', 'balance board']);
  });

  it('is empty when none are set', () => {
    expect(collectSearchSuggestions((_k, fb) => fb)).toEqual([]);
  });
});

describe('SearchSuggestions', () => {
  it('renders a chip per term, linking to the search route with an encoded query', () => {
    const { container } = render(<SearchSuggestions />);
    const links = [...container.querySelectorAll('a.search-suggestions__chip')] as HTMLAnchorElement[];
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe(`/search?q=${encodeURIComponent('تسلق')}`);
    expect(links[1].getAttribute('href')).toBe('/search?q=balance%20board');
    expect(links[1].textContent).toBe('balance board');
  });

  it('labels the group for assistive tech', () => {
    const { container } = render(<SearchSuggestions />);
    const nav = container.querySelector('nav.search-suggestions');
    expect(nav?.getAttribute('aria-label')).toBe('Popular');
    expect(nav?.querySelector('.search-suggestions__label')?.textContent).toBe('Popular');
  });
});
