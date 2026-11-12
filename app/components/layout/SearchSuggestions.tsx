import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { Link } from '@salla.sa/twilight-theme-engine/common';

/** Highest suggestion index to read from `locales` (`blocks.search.suggestions.N`). */
const MAX_SUGGESTIONS = 12;

/**
 * The curated search words (old `search_texts` setting → `locales`, 5A Tier 3),
 * in order, blanks dropped. `t` returns '' for a missing key, so the list is
 * however many the merchant filled, 1..{@link MAX_SUGGESTIONS}.
 */
export function collectSearchSuggestions(t: (key: string, fallback: string) => string): string[] {
  return Array.from({ length: MAX_SUGGESTIONS }, (_, i) =>
    t(`blocks.search.suggestions.${i + 1}`, '').trim()
  ).filter(Boolean);
}

/**
 * "Popular searches" — the curated `search_texts` words as chips that link to the
 * engine search route (`/search?q=…`). Replaces the old theme's modal-injected
 * suggestion list (that used manual DOM edits); these are real `<a href>` links
 * for SSR/SEO. Renders nothing when no suggestions are set.
 */
export function SearchSuggestions({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const terms = collectSearchSuggestions(t);
  if (!terms.length) return null;

  return (
    <nav className={`search-suggestions ${className}`} aria-label={t('blocks.search.popular', 'Popular searches')}>
      <div className="container search-suggestions__inner">
        <span className="search-suggestions__label text-start">
          {t('blocks.search.popular', 'Popular searches')}
        </span>
        <ul className="search-suggestions__list">
          {terms.map((term) => (
            <li key={term}>
              <Link
                to={`/search?q=${encodeURIComponent(term)}`}
                className="search-suggestions__chip"
              >
                {term}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
