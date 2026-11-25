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
    <div className="relative overflow-hidden px-4">
      <div className="container relative z-10">
        {/* Phones: a horizontal-scroll row of cards. */}
        <div className="-mx-4 overflow-x-auto px-4 pb-4 scrollbar-hide md:hidden">
          <div className="flex gap-4" style={{ width: 'max-content' }}>
            {features.map((feature, index) => (
              // A static settings list with no id; see .react-doctor/false-positives.md.
              // react-doctor-disable-next-line react-doctor/no-array-index-as-key
              <div
                key={index}
                className="group w-[80vw] flex-shrink-0 rounded-3xl bg-white/50 p-6 text-center"
              >
                {feature.image && (
                  <div className="mb-8 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-500 group-hover:scale-110">
                      <img
                        src={getCdnImageUrl(feature.image, { width: 140 }) ?? feature.image}
                        width="40"
                        height="40"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-10 object-contain"
                      />
                    </div>
                  </div>
                )}
                {feature.title && (
                  <h3 className="mb-4 text-xl font-black text-gray-900">{feature.title}</h3>
                )}
                {feature.desc && (
                  <p className="text-base leading-relaxed text-gray-500">{feature.desc}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: a 3-column grid. */}
        <div className="hidden grid-cols-3 gap-12 md:grid">
          {features.map((feature, index) => (
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <div key={index} className="group text-center">
              {feature.image && (
                <div className="mb-8 flex justify-center">
                  <div className="rounded-full bg-white p-6 shadow-lg transition-transform duration-500 group-hover:scale-110">
                    <img
                      src={getCdnImageUrl(feature.image, { width: 140 }) ?? feature.image}
                      width="64"
                      height="64"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                </div>
              )}
              {feature.title && (
                <h3 className="mb-4 text-2xl font-black text-gray-900">{feature.title}</h3>
              )}
              {feature.desc && (
                <p className="text-lg leading-relaxed text-gray-500">{feature.desc}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
