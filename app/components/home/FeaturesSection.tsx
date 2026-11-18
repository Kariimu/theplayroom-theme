import { memo } from 'react';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';

interface FeatureItem {
  image?: string;
  title?: string;
}

export interface FeaturesSectionProps {
  data: {
    title_section?: string;
    features?: FeatureItem[];
    position?: number;
    [key: string]: unknown;
  };
}

/**
 * `features-section` home block — a short row of store features (icon +
 * title), 1 to 4 items, e.g. free shipping, cash on delivery. Distinct from
 * `features2-section`, which adds a description per item and caps at 3.
 */
export const FeaturesSection = memo(function FeaturesSection({ data }: FeaturesSectionProps) {
  const { title_section: title, features = [] } = data;

  if (!features.length) return null;

  return (
    <div className="bg-brand-blue-light py-10 md:py-14">
      <div className="container">
        {title && (
          <h2 className="mb-12 text-center text-3xl font-black text-primary md:text-4xl">
            {title}
          </h2>
        )}
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {features.map((feature, index) => (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <div key={index} className="group flex flex-col items-center text-center">
              {feature.image && (
                <div className="mb-4 h-20 w-20 transition-transform duration-300 group-hover:scale-110 md:h-24 md:w-24">
                  <img
                    src={getCdnImageUrl(feature.image, { width: 160 }) ?? feature.image}
                    width="96"
                    height="96"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              {feature.title && (
                <p className="text-sm font-semibold leading-tight text-gray-900 md:text-base">
                  {feature.title}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
