import { useRouterState } from '@tanstack/react-router';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { isNativeApp } from '@salla.sa/twilight-theme-engine/native-app';
import { openStoreSwitcher } from '../../lib/storeSwitchers';

/** The same page in the other language: `/ar/…` ⇄ `/en/…` (never both prefixes). */
export function otherLanguageHref(pathname: string, search: string, target: string): string {
  const rest = pathname.replace(/\/+$/, '').replace(/^\/(ar|en)(?=\/|$)/, '');
  return `/${target}${rest}${search}`;
}

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
 * the old theme it names the *other* language ("EN" on phones and "English"
 * from `md` up on the Arabic store, "AR" / "العربية" on the English one) and
 * switches to it in one click: the same page under the other language's path.
 * Like Salla's own localization modal it also stores the choice in the
 * `s-lang` cookie. A plain link, not the engine `Link`: a language change
 * needs a full page load (translations, `lang` / `dir` on `<html>`), which is
 * what the modal does too. Inside the Salla app it opens the app's own
 * language sheet instead (`lib/storeSwitchers.ts`). Renders nothing when the
 * store isn't multilingual.
 */
export function LanguageSwitcher() {
  const { t, locale } = useTranslation();
  const { store } = useTwilight();
  // Two plain-string selects, so the switcher re-renders only when one changes.
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useRouterState({ select: (state) => state.location.searchStr });

  if (!store?.settings?.is_multilingual) return null;

  const isArabic = locale?.startsWith('ar');
  const target = isArabic ? 'en' : 'ar';

  return (
    <a
      href={otherLanguageHref(pathname, search, target)}
      hrefLang={target}
      className="site-header__language-switcher"
      // In the page's own language, so the screen reader voice can read it.
      aria-label={t('blocks.header.switch_language', isArabic ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic')}
      title={t('blocks.header.change_language', 'Change language')}
      onClick={(event) => {
        if (isNativeApp()) {
          event.preventDefault();
          openStoreSwitcher('language');
          return;
        }
        const salla = window.salla as
          | { cookie?: { set?: (name: string, value: string) => void } }
          | undefined;
        salla?.cookie?.set?.('s-lang', target);
      }}
    >
      <LanguagesGlyph />
      <span className="site-header__language-code">{isArabic ? 'EN' : 'AR'}</span>
      <span className="site-header__language-name">{isArabic ? 'English' : 'العربية'}</span>
    </a>
  );
}
