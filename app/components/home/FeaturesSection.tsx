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
    <div className="py-8 md:py-12">
      <div className="container">
        {title && (
          <h2 className="mb-8 text-center text-3xl font-black text-primary md:mb-12">
            {title}
          </h2>
        )}
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4 md:gap-12">
          {features.map((feature, index) => (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <div key={index} className="group flex flex-col items-center gap-3 text-center">
              {feature.image && (
                <img
                  src={getCdnImageUrl(feature.image, { width: 150 }) ?? feature.image}
                  width="80"
                  height="80"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20"
                />
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
