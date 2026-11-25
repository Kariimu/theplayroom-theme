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

function BrandLogo({ brand, grid }: { brand: BrandImageItem; grid?: boolean }) {
  const img = brand.image && (
    <img
      src={getCdnImageUrl(brand.image, { width: 400 }) ?? brand.image}
      width="160"
      height="107"
      alt={brand.alt_text || ''}
      loading="lazy"
      decoding="async"
      className={
        grid
          ? 'max-h-14 w-auto max-w-[140px] object-contain opacity-75 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100'
          : 'h-full max-h-20 w-auto object-contain'
      }
    />
  );
  const link = resolveLink(brand.url);
  const className = grid
    ? 'custom-brands__logo group flex items-center justify-center rounded-2xl p-3 transition-all duration-300'
    : 'custom-brands__logo flex items-center justify-center';
  return link ? (
    <Link to={link} className={className}>
      {img}
    </Link>
  ) : (
    <span className={className}>{img}</span>
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
      <div className="bg-white py-8">
      <div className="container mx-auto px-4">
        {/* A real grid, not flex-wrap: a logo's own width no longer decides how many
            land in a row — reliably 3 on mobile, matching the reference site. */}
        <div className="grid grid-cols-3 place-items-center gap-4 sm:grid-cols-4 sm:gap-6 md:grid-cols-5 lg:grid-cols-6 lg:gap-8">
          {withImages.map((brand, index) => (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <BrandLogo key={index} brand={brand} grid />
          ))}
        </div>
      </div>
      </div>
    );
  }

  // Seamless loop: the track is the list twice, animated by exactly half its width.
  const track = motionAllowed ? [...withImages, ...withImages] : withImages;

  return (
    <div className="custom-brands-marquee overflow-x-auto bg-white py-8 hide-scroll">
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
