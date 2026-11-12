import { memo } from 'react';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';

interface Feature2Item {
  image?: string;
  title?: string;
  desc?: string;
}

export interface Features2SectionProps {
  data: {
    // twilight.json keeps the legacy Twig typo (`fatures`, not `features`).
    fatures?: Feature2Item[];
    position?: number;
    [key: string]: unknown;
  };
}

/**
 * `features2-section` home block — up to 3 larger feature cards (icon, title,
 * description), no section heading. Distinct from `features-section`, the
 * smaller icon+title-only row capped at 4.
 */
export const Features2Section = memo(function Features2Section({ data }: Features2SectionProps) {
  const { fatures: features = [] } = data;

  if (!features.length) return null;

  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          // A static settings list with no id; see .react-doctor/false-positives.md.
          // react-doctor-disable-next-line react-doctor/no-array-index-as-key
          <div key={index} className="flex flex-col items-center text-center gap-3 p-4">
            {feature.image && (
              <img
                src={getCdnImageUrl(feature.image, { width: 160 }) ?? feature.image}
                width="80"
                height="80"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-20 w-20 object-contain"
              />
            )}
            {feature.title && <h3 className="font-semibold">{feature.title}</h3>}
            {feature.desc && <p className="text-sm opacity-70">{feature.desc}</p>}
          </div>
        ))}
      </div>
    </div>
  );
});
