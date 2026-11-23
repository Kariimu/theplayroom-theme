import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { openStoreSwitcher } from '../../lib/storeSwitchers';

/** The old theme's language icon (Lucide `languages`, 2px stroke). */
function LanguagesGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

/**
 * Header language switcher, next to the menu trigger at every breakpoint. As
 * the old theme it names the *other* language: "EN" on phones and "English"
 * from `md` up on the Arabic store, "AR" / "العربية" on the English one.
 * Opens the same switcher as `HeaderTopnav`'s language action
 * (`lib/storeSwitchers.ts`): the app's own sheet inside the Salla app, the
 * shared `<SallaLocalizationModal>` on the web. Renders nothing when the store
 * isn't multilingual.
 */
export function LanguageSwitcher() {
  const { t, locale } = useTranslation();
  const { store } = useTwilight();

  if (!store?.settings?.is_multilingual) return null;

  const isArabic = locale?.startsWith('ar');

  return (
    <button
      type="button"
      className="site-header__language-switcher"
      aria-label={t('blocks.header.change_language', 'Change language')}
      onClick={() => openStoreSwitcher('language')}
    >
      <LanguagesGlyph />
      <span className="site-header__language-code">{isArabic ? 'EN' : 'AR'}</span>
      <span className="site-header__language-name">{isArabic ? 'English' : 'العربية'}</span>
    </button>
  );
}
