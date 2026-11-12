import { memo } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { useMotionAllowed } from '../../hooks/useMotionAllowed';
import { resolveLink } from '../../lib/resolveLink';

interface BrandImageItem {
  image?: string;
  alt_text?: string;
  url?: string;
}

export interface CustomBrandsSectionProps {
  data: {
    display_as_grid?: boolean;
    brands?: BrandImageItem[];
    position?: number;
    [key: string]: unknown;
  };
}

function BrandLogo({ brand }: { brand: BrandImageItem }) {
  const img = brand.image && (
    <img
      src={getCdnImageUrl(brand.image, { width: 400 }) ?? brand.image}
      width="160"
      height="107"
      alt={brand.alt_text || ''}
      loading="lazy"
      decoding="async"
      className="h-full max-h-20 w-auto object-contain"
    />
  );
  const link = resolveLink(brand.url);
  return link ? (
    <Link to={link} className="custom-brands__logo flex items-center justify-center">
      {img}
    </Link>
  ) : (
    <span className="custom-brands__logo flex items-center justify-center">{img}</span>
  );
}

/**
 * `custom-brands-section` home block — merchant-uploaded brand logo images
 * (not Salla brand entities, unlike the `brands` block), up to 20. Either a
 * static grid (`display_as_grid`) or a continuous marquee strip, the latter
 * disabled for `prefers-reduced-motion` (a plain scrollable row instead).
 */
export const CustomBrandsSection = memo(function CustomBrandsSection({
  data,
}: CustomBrandsSectionProps) {
  const { display_as_grid: asGrid, brands = [] } = data;
  const motionAllowed = useMotionAllowed();

  const withImages = brands.filter((brand) => brand.image);
  if (!withImages.length) return null;

  if (asGrid) {
    return (
      <div className="container">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 items-center">
          {withImages.map((brand, index) => (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <BrandLogo key={index} brand={brand} />
          ))}
        </div>
      </div>
    );
  }

  // Seamless loop: the track is the list twice, animated by exactly half its width.
  const track = motionAllowed ? [...withImages, ...withImages] : withImages;

  return (
    <div className="custom-brands-marquee overflow-x-auto hide-scroll">
      <div
        className={`custom-brands-marquee__track flex items-center gap-10 ${
          motionAllowed ? 'custom-brands-marquee__track--animated' : ''
        }`}
      >
        {track.map((brand, index) => (
          // The track is duplicated for the loop; the index alone still keys each copy.
          // react-doctor-disable-next-line react-doctor/no-array-index-as-key
          <BrandLogo key={index} brand={brand} />
        ))}
      </div>
    </div>
  );
});
