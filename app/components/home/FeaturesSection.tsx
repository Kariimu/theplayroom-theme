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
    <div className="container">
      {title && <h2 className="s-block__title text-center text-lg font-semibold mb-4">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
        {features.map((feature, index) => (
          // A static settings list with no id; see .react-doctor/false-positives.md.
          // react-doctor-disable-next-line react-doctor/no-array-index-as-key
          <div key={index} className="flex flex-col items-center text-center gap-2">
            {feature.image && (
              <img
                src={getCdnImageUrl(feature.image, { width: 100 }) ?? feature.image}
                width="56"
                height="56"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-14 w-14 object-contain"
              />
            )}
            {feature.title && <p className="text-sm font-medium">{feature.title}</p>}
          </div>
        ))}
      </div>
    </div>
  );
});
