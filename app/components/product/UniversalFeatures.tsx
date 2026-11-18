import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';

/** `blocks.universal_features.<n>.title/desc` + `public/features/feature-<n>.webp` (Stage 2). */
const FEATURE_SLOTS = [1, 2, 3, 4] as const;

/**
 * The 4 store-wide features (§5A row 72: locales + `public/`) authored in
 * Stage 2 but never rendered until now — legacy `single.twig` §7.8 shows them
 * on every product page, after the reviews block. A feature with no title in
 * either locale is skipped, so a store that trims the list below 4 doesn't
 * leave gaps.
 */
export function UniversalFeatures() {
  const { t } = useTranslation();

  const features = FEATURE_SLOTS.map((n) => ({
    n,
    title: t(`blocks.universal_features.${n}.title`, ''),
    desc: t(`blocks.universal_features.${n}.desc`, ''),
  })).filter((feature) => feature.title);

  if (!features.length) return null;

  return (
    <div className="universal-features container grid grid-cols-2 gap-6 md:grid-cols-4">
      {features.map(({ n, title, desc }) => (
        <div key={n} className="universal-features__item flex flex-col items-center text-center">
          <img
            src={`/features/feature-${n}.webp`}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
            className="h-12 w-12"
          />
          <b className="universal-features__title mt-3 text-lg font-bold text-gray-900">{title}</b>
          {desc && <p className="universal-features__desc text-lg text-gray-500">{desc}</p>}
        </div>
      ))}
    </div>
  );
}
