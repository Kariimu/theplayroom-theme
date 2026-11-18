import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { LanguagesIcon } from '../icons';
import { openStoreSwitcher } from '../../lib/storeSwitchers';

/**
 * Header language switcher — a pill button next to the menu trigger, shown at
 * every breakpoint (unlike {@link HeaderTopnav}'s version, desktop-only on
 * the "default" layout). Opens the same switcher as `HeaderTopnav`'s language
 * action (`lib/storeSwitchers.ts`): the app's own sheet inside the Salla app,
 * the shared `<SallaLocalizationModal>` on the web. Renders nothing when the
 * store isn't multilingual.
 */
export function LanguageSwitcher() {
  const { t, languageName } = useTranslation();
  const { store } = useTwilight();

  if (!store?.settings?.is_multilingual) return null;

  return (
    <button
      type="button"
      className="site-header__language-switcher"
      aria-label={t('blocks.header.change_language', 'Change language')}
      onClick={() => openStoreSwitcher('language')}
    >
      <LanguagesIcon aria-hidden="true" />
      <span>{languageName}</span>
    </button>
  );
}
