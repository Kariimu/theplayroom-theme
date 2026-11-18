import { memo } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { resolveLink } from '../../lib/resolveLink';

interface GalleryItem {
  image?: string;
  image_mobile?: string;
  alt_text?: string;
}

export interface GallerySectionProps {
  data: {
    title_section?: string;
    desc_section?: string;
    gallery?: GalleryItem[];
    btn_text?: string;
    button_url?: unknown;
    position?: number;
    [key: string]: unknown;
  };
}

/**
 * `gallery-section` home block — a photo gallery of up to 5 merchant images
 * (portrait on desktop, square on mobile, per the manifest's size guidance),
 * with a header and an optional "view all" button. Independent of the
 * /gallery route decision (D3) — this block exists either way.
 */
export const GallerySection = memo(function GallerySection({ data }: GallerySectionProps) {
  const {
    title_section: title,
    desc_section: description,
    gallery = [],
    btn_text: buttonText,
    button_url: buttonUrl,
  } = data;
  const link = resolveLink(buttonUrl);

  const withImages = gallery.filter((item) => item.image || item.image_mobile);
  if (!withImages.length) return null;

  return (
    <div className="container">
      {(title || description) && (
        <div className="mb-8 text-center md:mb-12">
          {title && <h2 className="mb-4 text-3xl font-black text-brand-navy">{title}</h2>}
          {description && <p className="text-lg text-gray-500">{description}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {withImages.map((item, index) => {
          const desktop = item.image;
          const mobile = item.image_mobile || item.image;
          const fallback = desktop || mobile;
          // An odd count leaves one orphaned tile on the mobile 2-column grid; the
          // reference site widens the last tile to fill that row instead of
          // leaving a half-empty one (matches the reference grid exactly).
          const isOrphan = withImages.length % 2 === 1 && index === withImages.length - 1;
          return (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <picture
              key={index}
              className={`gallery-section__item group block aspect-square overflow-hidden rounded-2xl md:aspect-[2/3] ${isOrphan ? 'col-span-2 md:col-span-1' : ''}`}
            >
              {mobile && <source media="(max-width: 639px)" srcSet={getCdnImageUrl(mobile, { width: 336 }) ?? mobile} />}
              {desktop && <source media="(min-width: 640px)" srcSet={getCdnImageUrl(desktop, { width: 500 }) ?? desktop} />}
              <img
                src={getCdnImageUrl(fallback, { width: 500 }) ?? fallback}
                alt={item.alt_text || ''}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </picture>
          );
        })}
      </div>

      {link && buttonText && (
        <div className="mt-8 text-center">
          <Link
            to={link}
            className="inline-block rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-reverse shadow-lg transition-shadow hover:shadow-xl"
          >
            {buttonText}
          </Link>
        </div>
      )}
    </div>
  );
});
