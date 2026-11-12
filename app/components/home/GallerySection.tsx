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
        <div className="s-block__title text-center">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && <p className="text-sm opacity-70">{description}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {withImages.map((item, index) => {
          const desktop = item.image;
          const mobile = item.image_mobile || item.image;
          const fallback = desktop || mobile;
          return (
            // A static settings list with no id; see .react-doctor/false-positives.md.
            // react-doctor-disable-next-line react-doctor/no-array-index-as-key
            <picture key={index} className="gallery-section__item block overflow-hidden rounded-lg">
              {mobile && <source media="(max-width: 639px)" srcSet={getCdnImageUrl(mobile, { width: 336 }) ?? mobile} />}
              {desktop && <source media="(min-width: 640px)" srcSet={getCdnImageUrl(desktop, { width: 500 }) ?? desktop} />}
              <img
                src={getCdnImageUrl(fallback, { width: 500 }) ?? fallback}
                alt={item.alt_text || ''}
                loading="lazy"
                decoding="async"
                className="aspect-square sm:aspect-[2/3] w-full h-full object-cover"
              />
            </picture>
          );
        })}
      </div>

      {link && buttonText && (
        <div className="text-center mt-6">
          <Link to={link} className="btn btn--outline">
            {buttonText}
          </Link>
        </div>
      )}
    </div>
  );
});
